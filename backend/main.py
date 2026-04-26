import os
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
    ranked = sorted(rows, key=lambda row: rank_facility(row, triage["preferred_capabilities"]), reverse=True)[:top_k]
    for row in ranked:
        row["rank_score"] = round(rank_facility(row, triage["preferred_capabilities"]), 2)
        row["contradiction_flags"] = normalize_flags(row.get("contradiction_flags"))
        row["symptom_triage"] = triage

    return {
        "query": request.query,
        "retrieval_note": retrieval_note,
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
