import os
import json
import time
from typing import Any

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="CareMap AI Databricks Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CareSearchRequest(BaseModel):
    query: str
    top_k: int = 10
    vector_top_k: int | None = None


class GenieRequest(BaseModel):
    question: str
    conversation_id: str | None = None


def env(name: str, default: str | None = None) -> str:
    value = os.getenv(name, default)
    if value is None or value == "":
        raise HTTPException(status_code=500, detail=f"Missing required environment variable: {name}")
    return value.rstrip("/") if name == "DATABRICKS_HOST" else value


def databricks_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {env('DATABRICKS_TOKEN')}",
        "Content-Type": "application/json",
    }


def databricks_url(path: str) -> str:
    return f"{env('DATABRICKS_HOST')}{path}"


def execute_sql(statement: str, wait_timeout: str = "30s") -> list[dict[str, Any]]:
    payload = {
        "warehouse_id": env("DATABRICKS_WAREHOUSE_ID"),
        "statement": statement,
        "wait_timeout": wait_timeout,
        "on_wait_timeout": "CONTINUE",
        "disposition": "INLINE",
        "format": "JSON_ARRAY",
    }
    response = requests.post(
        databricks_url("/api/2.0/sql/statements"),
        headers=databricks_headers(),
        json=payload,
        timeout=45,
    )
    response.raise_for_status()
    data = response.json()
    statement_id = data.get("statement_id")

    while data.get("status", {}).get("state") in {"PENDING", "RUNNING"}:
        time.sleep(1.5)
        poll = requests.get(
            databricks_url(f"/api/2.0/sql/statements/{statement_id}"),
            headers=databricks_headers(),
            timeout=30,
        )
        poll.raise_for_status()
        data = poll.json()

    state = data.get("status", {}).get("state")
    if state != "SUCCEEDED":
        raise HTTPException(status_code=502, detail=data.get("status", {}).get("error", data))

    manifest_columns = data.get("manifest", {}).get("schema", {}).get("columns", [])
    column_names = [col["name"] for col in manifest_columns]
    rows = data.get("result", {}).get("data_array", [])
    return [dict(zip(column_names, row)) for row in rows]


def table_name(name: str) -> str:
    return f"{os.getenv('DATABRICKS_CATALOG', 'workspace')}.{os.getenv('DATABRICKS_SCHEMA', 'caremap_ai')}.{name}"


def sql_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def normalize_flags(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(v) for v in value]
    if isinstance(value, str):
        stripped = value.strip()
        if stripped in {"", "[]"}:
            return []
        return [stripped]
    return [str(value)]


def env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def json_safe(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, list):
        return [json_safe(item) for item in value]
    if isinstance(value, dict):
        return {str(key): json_safe(item) for key, item in value.items()}
    return str(value)


def parse_jsonish(value: Any, default: Any) -> Any:
    if value is None:
        return default
    if isinstance(value, (list, dict)):
        return value
    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return default
        try:
            return json.loads(stripped)
        except json.JSONDecodeError:
            return default
    return default


def triage_query(query: str) -> dict[str, Any]:
    lower = query.lower()
    rules = [
        {
            "category": "possible_cardiac_emergency",
            "terms": ["chest pain", "shortness of breath", "heart attack", "left arm pain"],
            "urgency": "emergency",
            "preferred": ["availability_24_7", "has_oxygen", "has_icu", "has_ventilator"],
        },
        {
            "category": "newborn_or_neonatal_distress",
            "terms": ["newborn", "baby breathing", "infant breathing", "nicu", "premature"],
            "urgency": "emergency",
            "preferred": ["has_neonatal_care", "has_oxygen", "availability_24_7", "has_icu"],
        },
        {
            "category": "kidney_failure_or_dialysis_need",
            "terms": ["dialysis", "kidney failure", "renal"],
            "urgency": "urgent",
            "preferred": ["has_dialysis", "availability_24_7", "has_oxygen"],
        },
        {
            "category": "trauma_or_accident",
            "terms": ["trauma", "accident", "fracture", "bleeding"],
            "urgency": "emergency",
            "preferred": [
                "has_trauma_care",
                "has_emergency_surgery",
                "has_anesthesiologist",
                "availability_24_7",
                "has_oxygen",
                "has_icu",
            ],
        },
    ]
    categories: list[str] = []
    preferred: list[str] = []
    urgency = "routine_or_urgent"
    for rule in rules:
        if any(term in lower for term in rule["terms"]):
            categories.append(rule["category"])
            preferred.extend(rule["preferred"])
            if rule["urgency"] == "emergency":
                urgency = "emergency"
            elif urgency != "emergency":
                urgency = rule["urgency"]
    return {
        "categories": list(dict.fromkeys(categories)),
        "urgency": urgency,
        "preferred_capabilities": list(dict.fromkeys(preferred)),
        "safety_note": (
            "This is not a diagnosis. For emergency symptoms, seek immediate medical help or contact local emergency services."
            if urgency == "emergency"
            else "This is not a diagnosis. Use results for facility routing, not medical advice."
        )
        if categories
        else None,
    }


def retrieve_vector_ids(query: str, top_k: int) -> list[str]:
    from databricks.vector_search.client import VectorSearchClient

    client = VectorSearchClient(
        workspace_url=env("DATABRICKS_HOST"),
        personal_access_token=env("DATABRICKS_TOKEN"),
        disable_notice=True,
    )
    index = client.get_index(
        endpoint_name=os.getenv("DATABRICKS_VECTOR_ENDPOINT", "caremap-vector-endpoint"),
        index_name=os.getenv("DATABRICKS_VECTOR_INDEX", table_name("facility_capabilities_index")),
    )
    results = index.similarity_search(
        query_text=query,
        columns=["facility_id", "name", "state", "district_city", "trust_score"],
        num_results=top_k,
    )
    result = results.get("result", results) if isinstance(results, dict) else {}
    columns = result.get("columns", [])
    column_names = [col.get("name", col) if isinstance(col, dict) else col for col in columns]
    rows = result.get("data_array", [])
    ids: list[str] = []
    for row in rows:
        item = dict(zip(column_names, row))
        if item.get("facility_id") is not None:
            ids.append(str(item["facility_id"]))
    return list(dict.fromkeys(ids))


def rank_facility(row: dict[str, Any], preferred_capabilities: list[str]) -> float:
    trust = float(row.get("trust_score") or 0)
    triage_bonus = 4 * sum(bool(row.get(field)) for field in preferred_capabilities)
    contradiction_penalty = 8 * len(normalize_flags(row.get("contradiction_flags")))
    return trust + triage_bonus - contradiction_penalty


def candidate_payload(row: dict[str, Any]) -> dict[str, Any]:
    evidence = parse_jsonish(row.get("extracted_evidence"), {})
    evidence_summary: dict[str, list[str]] = {}
    if isinstance(evidence, dict):
        for key, snippets in evidence.items():
            if isinstance(snippets, list):
                evidence_summary[key] = [str(item)[:220] for item in snippets[:2]]
            else:
                evidence_summary[key] = [str(snippets)[:220]]

    return {
        "facility_id": str(row.get("facility_id")),
        "name": row.get("name"),
        "state": row.get("state"),
        "district_city": row.get("district_city"),
        "pin_code": row.get("pin_code"),
        "trust_score": row.get("trust_score"),
        "deterministic_rank_score": row.get("rank_score"),
        "contradiction_flags": normalize_flags(row.get("contradiction_flags")),
        "capabilities": {
            "ICU": row.get("has_icu"),
            "oxygen": row.get("has_oxygen"),
            "ventilator": row.get("has_ventilator"),
            "emergency_surgery": row.get("has_emergency_surgery"),
            "anesthesiologist": row.get("has_anesthesiologist"),
            "dialysis": row.get("has_dialysis"),
            "oncology": row.get("has_oncology"),
            "trauma_care": row.get("has_trauma_care"),
            "neonatal_care": row.get("has_neonatal_care"),
            "availability_24_7": row.get("availability_24_7"),
        },
        "evidence": evidence_summary,
        "trust_explanation": row.get("explanation"),
    }


def parse_llm_response(text: str) -> list[dict[str, Any]]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.removeprefix("json").strip()
    data = json.loads(cleaned)
    if isinstance(data, dict):
        data = data.get("scores", data.get("results", []))
    return data if isinstance(data, list) else []


def llm_score_candidates(query: str, rows: list[dict[str, Any]]) -> tuple[dict[str, dict[str, Any]], str]:
    if not env_bool("USE_LLM_FIT_SCORING", False):
        return {}, "LLM query-fit scoring disabled."
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return {}, "LLM query-fit scoring requested but OPENAI_API_KEY is missing."

    try:
        from openai import OpenAI
    except ImportError:
        return {}, "LLM query-fit scoring requested but the openai package is not installed."

    model = os.getenv("OPENAI_MODEL", "gpt-5.5")
    max_candidates = max(1, min(int(os.getenv("LLM_RERANK_TOP_N", "12")), len(rows)))
    payload = [candidate_payload(row) for row in rows[:max_candidates]]

    client = OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a cautious healthcare facility routing evaluator for India. "
                    "Score how well each facility fits the user's query using only the provided "
                    "structured capabilities, trust score, contradiction flags, location, and evidence snippets. "
                    "Do not diagnose. Do not invent capabilities. Penalize contradictions, unknowns, weak evidence, "
                    "and geographic mismatch. Return strict JSON only."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "query": query,
                        "scale": "0 means unsuitable; 100 means very strong evidence-backed fit",
                        "required_output_schema": [
                            {
                                "facility_id": "string",
                                "llm_fit_score": "number 0-100",
                                "llm_score_reason": "one short evidence-grounded sentence",
                            }
                        ],
                        "candidates": payload,
                    },
                    ensure_ascii=True,
                ),
            },
        ],
    )
    parsed = parse_llm_response(response.choices[0].message.content or "[]")
    scores: dict[str, dict[str, Any]] = {}
    for item in parsed:
        facility_id = str(item.get("facility_id", ""))
        if not facility_id:
            continue
        try:
            fit_score = max(0.0, min(100.0, float(item.get("llm_fit_score", 0))))
        except (TypeError, ValueError):
            continue
        scores[facility_id] = {
            "llm_fit_score": round(fit_score, 2),
            "llm_score_reason": str(item.get("llm_score_reason", ""))[:600],
        }
    return scores, f"LLM query-fit scorer reranked {len(scores)} candidates with {model}."


def apply_llm_rerank(query: str, rows: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], str]:
    try:
        llm_scores, note = llm_score_candidates(query, rows)
    except Exception as exc:
        return rows, f"LLM query-fit scorer failed ({type(exc).__name__}: {exc}); deterministic ranking used."
    if not llm_scores:
        return rows, note

    reranked = []
    for row in rows:
        facility_id = str(row.get("facility_id"))
        llm_score = llm_scores.get(facility_id)
        if llm_score:
            row = dict(row)
            row.update(llm_score)
            row["deterministic_rank_score"] = row.get("rank_score")
            row["rank_score"] = round(0.65 * float(row.get("rank_score") or 0) + 0.35 * float(llm_score["llm_fit_score"]), 2)
            row["explanation"] = (
                f"{row.get('explanation') or ''} "
                f"LLM query-fit score {llm_score['llm_fit_score']}/100: {llm_score['llm_score_reason']}"
            ).strip()
        reranked.append(row)
    return sorted(reranked, key=lambda item: float(item.get("rank_score") or 0), reverse=True), note


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/query")
def care_search(request: CareSearchRequest) -> dict[str, Any]:
    top_k = max(1, min(request.top_k, 25))
    vector_top_k = request.vector_top_k or int(os.getenv("QUERY_VECTOR_TOP_K", "100"))
    triage = triage_query(request.query)
    retrieval_note = "Mosaic AI Vector Search was not used."
    candidate_ids: list[str] = []

    try:
        candidate_ids = retrieve_vector_ids(request.query, vector_top_k)
        retrieval_note = f"Mosaic AI Vector Search retrieved {len(candidate_ids)} semantic candidates."
    except Exception as exc:
        retrieval_note = f"Vector Search fallback: {type(exc).__name__}: {exc}"

    columns = """
        facility_id, name, state, district_city, pin_code, latitude, longitude,
        trust_score, confidence_score, contradiction_flags, extracted_evidence, explanation,
        has_icu, has_oxygen, has_ventilator, has_emergency_surgery,
        has_anesthesiologist, has_dialysis, has_oncology, has_trauma_care,
        has_neonatal_care, availability_24_7, doctor_availability
    """
    if candidate_ids:
        id_list = ", ".join(sql_literal(fid) for fid in candidate_ids)
        statement = f"SELECT {columns} FROM {table_name('facility_capabilities')} WHERE facility_id IN ({id_list})"
    else:
        statement = f"SELECT {columns} FROM {table_name('facility_capabilities')} ORDER BY trust_score DESC LIMIT 250"

    rows = execute_sql(statement)
    ranked_pool_size = max(top_k, int(os.getenv("LLM_RERANK_TOP_N", "12")) if env_bool("USE_LLM_FIT_SCORING", False) else top_k)
    ranked = sorted(rows, key=lambda row: rank_facility(row, triage["preferred_capabilities"]), reverse=True)[:ranked_pool_size]
    for row in ranked:
        row["rank_score"] = round(rank_facility(row, triage["preferred_capabilities"]), 2)
        row["contradiction_flags"] = normalize_flags(row.get("contradiction_flags"))
        row["symptom_triage"] = triage
        row["extracted_evidence"] = json_safe(parse_jsonish(row.get("extracted_evidence"), row.get("extracted_evidence")))

    ranked, llm_note = apply_llm_rerank(request.query, ranked)
    ranked = ranked[:top_k]

    return {
        "query": request.query,
        "retrieval_note": retrieval_note,
        "llm_note": llm_note,
        "triage": triage,
        "ranked_facilities": ranked,
    }


@app.get("/api/deserts")
def deserts(limit: int = 100) -> dict[str, Any]:
    rows = execute_sql(
        f"""
        SELECT state, district_city, pin_code, facility_count, trusted_facility_count, missing_services, risk_level
        FROM {table_name('medical_deserts')}
        ORDER BY CASE risk_level WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
                 trusted_facility_count ASC,
                 facility_count ASC
        LIMIT {max(1, min(limit, 500))}
        """
    )
    return {"regions": rows}


@app.get("/api/quality")
def quality() -> dict[str, Any]:
    rows = execute_sql(
        f"""
        SELECT column_name, total_rows, missing_or_blank_count, missing_or_blank_pct
        FROM {table_name('data_quality_profile')}
        ORDER BY missing_or_blank_pct DESC
        LIMIT 50
        """
    )
    return {"profile": rows}


@app.get("/api/summary")
def summary() -> dict[str, Any]:
    facilities = execute_sql(
        f"""
        SELECT
          COUNT(*) AS total_facilities,
          AVG(trust_score) AS avg_trust_score,
          SUM(CASE WHEN trust_score >= 80 THEN 1 ELSE 0 END) AS high_trust_facilities,
          SUM(CASE WHEN size(contradiction_flags) > 0 THEN 1 ELSE 0 END) AS facilities_with_contradictions
        FROM {table_name('facility_capabilities')}
        """
    )
    deserts = execute_sql(
        f"""
        SELECT
          COUNT(*) AS total_regions,
          SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) AS high_risk_regions
        FROM {table_name('medical_deserts')}
        """
    )
    return {"facilities": facilities[0] if facilities else {}, "deserts": deserts[0] if deserts else {}}


@app.post("/api/genie")
def genie(request: GenieRequest) -> dict[str, Any]:
    space_id = env("DATABRICKS_GENIE_SPACE_ID")
    if request.conversation_id:
        start_path = f"/api/2.0/genie/spaces/{space_id}/conversations/{request.conversation_id}/messages"
    else:
        start_path = f"/api/2.0/genie/spaces/{space_id}/start-conversation"
    start_response = requests.post(
        databricks_url(start_path),
        headers=databricks_headers(),
        json={"content": request.question},
        timeout=30,
    )
    start_response.raise_for_status()
    start_data = start_response.json()
    conversation = start_data.get("conversation", {"id": request.conversation_id})
    message = start_data.get("message", start_data)
    conversation_id = conversation["id"]
    message_id = message["id"]

    for _ in range(80):
        poll_response = requests.get(
            databricks_url(f"/api/2.0/genie/spaces/{space_id}/conversations/{conversation_id}/messages/{message_id}"),
            headers=databricks_headers(),
            timeout=30,
        )
        poll_response.raise_for_status()
        message = poll_response.json()
        if message.get("status") in {"COMPLETED", "FAILED", "CANCELLED"}:
            break
        time.sleep(1.5)

    attachments = message.get("attachments") or []
    query_results: list[dict[str, Any]] = []
    for attachment in attachments:
        attachment_id = attachment.get("attachment_id") or attachment.get("id")
        if not attachment_id or not attachment.get("query"):
            continue
        try:
            result_response = requests.get(
                databricks_url(
                    f"/api/2.0/genie/spaces/{space_id}/conversations/{conversation_id}/messages/{message_id}/attachments/{attachment_id}/query-result"
                ),
                headers=databricks_headers(),
                timeout=45,
            )
            if result_response.ok:
                query_results.append({"attachment_id": attachment_id, "result": result_response.json()})
        except requests.RequestException:
            continue

    return {
        "conversation_id": conversation_id,
        "message_id": message_id,
        "status": message.get("status"),
        "content": message.get("content"),
        "attachments": attachments,
        "query_results": query_results,
    }
