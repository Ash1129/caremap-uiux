import React, { useState } from 'react';
import { AlertTriangle, Database, FileText, Loader2, MapPin, Search, ShieldCheck } from 'lucide-react';
import TrustScore from '../components/TrustScore';
import { searchCareMap } from '../api/caremapApi';

const exampleQueries = [
  'Chest pain in Bihar, need emergency care with oxygen and ICU support',
  'Trauma care facilities with high trust score',
  'Dialysis centers in underserved regions',
  'Newborn breathing difficulty near Assam',
];

function EvidencePreview({ evidence }) {
  const entries = Object.entries(evidence || {}).slice(0, 4);
  if (!entries.length) {
    return <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No evidence snippets returned.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {entries.map(([capability, snippets]) => (
        <div key={capability} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-teal)', marginBottom: 4 }}>{capability.replaceAll('_', ' ')}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {(Array.isArray(snippets) ? snippets[0] : snippets)?.toString().slice(0, 220)}
          </div>
        </div>
      ))}
    </div>
  );
}

function FacilityResult({ facility }) {
  const [expanded, setExpanded] = useState(false);
  const flags = facility.contradiction_flags || [];

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '86px 1fr auto', gap: 16, alignItems: 'start' }}>
        <TrustScore score={Number(facility.trust_score || 0)} size="md" />
        <div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text-primary)' }}>{facility.name}</h3>
            {flags.length > 0 && <span className="badge-critical">Contradictions</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
            <MapPin size={14} />
            {facility.district_city || 'Unknown district'}, {facility.state || 'Unknown state'} · {facility.pin_code || 'No PIN'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[
              ['has_icu', 'ICU'],
              ['has_oxygen', 'Oxygen'],
              ['has_ventilator', 'Ventilator'],
              ['has_emergency_surgery', 'Surgery'],
              ['has_dialysis', 'Dialysis'],
              ['has_trauma_care', 'Trauma'],
              ['availability_24_7', '24/7'],
            ].map(([key, label]) => (
              <span key={key} className={facility[key] ? 'badge-verified' : 'badge-partial'}>
                {facility[key] ? '✓' : '•'} {label}
              </span>
            ))}
          </div>
        </div>
        <button className="btn-secondary" onClick={() => setExpanded(!expanded)}>
          <FileText size={15} />
          Evidence
        </button>
      </div>

      {facility.symptom_triage?.safety_note && (
        <div style={{ marginTop: 12, background: 'var(--partial-bg)', border: '1px solid var(--partial-border)', borderRadius: 8, padding: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
          <AlertTriangle size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          {facility.symptom_triage.safety_note}
        </div>
      )}

      {flags.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--critical)' }}>
          <strong>Flags:</strong> {flags.join(', ')}
        </div>
      )}

      {expanded && (
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <div className="section-label" style={{ marginBottom: 8 }}>Scoring Explanation</div>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{facility.explanation || 'No explanation returned.'}</p>
          </div>
          <div>
            <div className="section-label" style={{ marginBottom: 8 }}>Evidence Snippets</div>
            <EvidencePreview evidence={facility.extracted_evidence || facility.evidence} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function CareSearch() {
  const [query, setQuery] = useState(exampleQueries[0]);
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runSearch = async (nextQuery = query) => {
    setQuery(nextQuery);
    setLoading(true);
    setError('');
    try {
      const result = await searchCareMap(nextQuery, 10);
      setAnswer(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 112px)', padding: 24 }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18 }}>
        <main>
          <div className="card" style={{ padding: 20, marginBottom: 14 }}>
            <div className="section-label" style={{ marginBottom: 8 }}>Care Search</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1.15, marginBottom: 10 }}>
              Search Databricks intelligence with symptom-aware routing
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18 }}>
              Uses Mosaic AI Vector Search for semantic retrieval, then reranks facilities by trust score, contradictions, and capability fit.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  onKeyDown={event => event.key === 'Enter' && runSearch()}
                  placeholder="Chest pain in Bihar, need emergency care with oxygen..."
                  style={{
                    width: '100%',
                    border: '1.5px solid var(--border)',
                    borderRadius: 10,
                    padding: '12px 14px 12px 42px',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
              <button className="btn-primary" onClick={() => runSearch()} disabled={loading}>
                {loading ? <Loader2 size={16} /> : <Search size={16} />}
                Search
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
              {exampleQueries.map(item => (
                <button key={item} className="btn-secondary" onClick={() => runSearch(item)} style={{ padding: '6px 10px', fontSize: 12 }}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="card" style={{ padding: 14, borderColor: 'var(--critical-border)', color: 'var(--critical)', marginBottom: 14 }}>
              {error}
            </div>
          )}

          {answer && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Database size={17} color="var(--brand-teal)" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{answer.retrieval_note}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Triage: {answer.triage?.categories?.join(', ') || 'No symptom category'} · urgency {answer.triage?.urgency}
                  </div>
                </div>
              </div>

              {(answer.ranked_facilities || []).map(facility => (
                <FacilityResult key={facility.facility_id || facility.name} facility={facility} />
              ))}

              {answer.ranked_facilities?.length === 0 && (
                <div className="card" style={{ padding: 18, color: 'var(--text-secondary)' }}>
                  No facilities matched the current query. Try removing a state or capability constraint.
                </div>
              )}
            </div>
          )}
        </main>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ padding: 16 }}>
            <ShieldCheck size={22} color="var(--brand-teal)" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, marginTop: 10 }}>Backend Path</h3>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.8, marginTop: 8 }}>
              React → FastAPI → Databricks SQL + Mosaic AI Vector Search → trust-aware reranking.
            </div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div className="section-label">Safe Use</div>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 8 }}>
              Symptom triage routes to facility capabilities. It does not diagnose or replace emergency care.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
