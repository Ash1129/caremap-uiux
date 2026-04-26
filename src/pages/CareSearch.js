import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Database,
  FileText,
  Loader2,
  MapPin,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import TrustScore from '../components/TrustScore';
import { askGenie, searchCareMap } from '../api/caremapApi';

const exampleQueries = [
  'Chest pain in Bihar, need emergency care with oxygen and ICU support',
  'Which states have the most high-risk medical desert regions?',
  'Trauma care facilities with high trust score',
  'Dialysis centers in underserved regions',
  'Newborn breathing difficulty near Assam',
];

const serviceFields = [
  ['has_icu', 'ICU'],
  ['has_oxygen', 'Oxygen'],
  ['has_ventilator', 'Ventilator'],
  ['has_emergency_surgery', 'Surgery'],
  ['has_dialysis', 'Dialysis'],
  ['has_trauma_care', 'Trauma'],
  ['has_neonatal_care', 'Neonatal'],
  ['availability_24_7', '24/7'],
];

const chartColors = ['#2D9C9C', '#4F9F73', '#E6A23C', '#5B8DD9', '#D96C6C'];

function numberFormat(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value ?? '—';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: numeric % 1 ? 1 : 0 }).format(numeric);
}

function coerceBoolean(value) {
  if (value === true || value === 1) return true;
  if (typeof value === 'string') return ['true', '1', 'yes'].includes(value.toLowerCase());
  return false;
}

function normalizeFlags(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return value === '[]' ? [] : [value];
    }
  }
  return [String(value)];
}

function extractAttachmentText(attachments = []) {
  return attachments
    .map(attachment => attachment.text?.content || attachment.text || attachment.content || '')
    .filter(Boolean)
    .join('\n\n');
}

function tableRowsFromStatementPayload(payload) {
  const response = payload?.statement_response || payload?.result || payload;
  const columns =
    response?.manifest?.schema?.columns ||
    response?.schema?.columns ||
    payload?.manifest?.schema?.columns ||
    [];
  const columnNames = columns.map(column => column.name || column);
  const data = response?.result?.data_array || response?.data_array || payload?.data_array || [];

  if (!columnNames.length || !Array.isArray(data)) return [];
  return data.map(row => Object.fromEntries(columnNames.map((name, index) => [name, row[index]])));
}

function extractGenieRows(queryResults = []) {
  return queryResults.flatMap(item => tableRowsFromStatementPayload(item.result || item));
}

function buildGenieMetrics(rows, fallbackFacilities) {
  const facilities = fallbackFacilities || [];
  if (!rows.length) {
    return [
      ['Top facilities', facilities.length],
      ['Avg trust', facilities.length ? facilities.reduce((sum, row) => sum + Number(row.trust_score || 0), 0) / facilities.length : null],
      ['High trust', facilities.filter(row => Number(row.trust_score || 0) >= 80).length],
      ['Flagged', facilities.filter(row => normalizeFlags(row.contradiction_flags).length > 0).length],
    ];
  }

  const firstRow = rows[0] || {};
  const numericEntries = Object.entries(firstRow)
    .filter(([, value]) => value !== null && value !== '' && Number.isFinite(Number(value)))
    .slice(0, 4);

  if (numericEntries.length) {
    return numericEntries.map(([key, value]) => [key.replaceAll('_', ' '), value]);
  }

  return [
    ['Rows returned', rows.length],
    ['Columns', Object.keys(firstRow).length],
    ['Facilities shown', facilities.length],
    ['Flagged', facilities.filter(row => normalizeFlags(row.contradiction_flags).length > 0).length],
  ];
}

function buildTrustChart(facilities = []) {
  const buckets = [
    { label: '90-100', min: 90, max: 100, count: 0 },
    { label: '80-89', min: 80, max: 89, count: 0 },
    { label: '70-79', min: 70, max: 79, count: 0 },
    { label: '<70', min: -Infinity, max: 69, count: 0 },
  ];
  facilities.forEach(facility => {
    const score = Number(facility.trust_score || 0);
    const bucket = buckets.find(item => score >= item.min && score <= item.max);
    if (bucket) bucket.count += 1;
  });
  return buckets.map(({ label, count }) => ({ label, count }));
}

function buildCapabilityChart(facilities = []) {
  return serviceFields.map(([key, label]) => ({
    label,
    count: facilities.filter(facility => coerceBoolean(facility[key])).length,
  }));
}

function buildStateChart(facilities = []) {
  const counts = facilities.reduce((acc, facility) => {
    const state = facility.state || 'Unknown';
    acc[state] = (acc[state] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function buildGenieChart(rows = []) {
  if (!rows.length) return [];
  const firstRow = rows[0] || {};
  const columns = Object.keys(firstRow);
  const labelColumn = columns.find(key => !Number.isFinite(Number(firstRow[key]))) || columns[0];
  const valueColumn = columns.find(key => key !== labelColumn && Number.isFinite(Number(firstRow[key])));
  if (!labelColumn || !valueColumn) return [];

  return rows.slice(0, 8).map(row => ({
    label: String(row[labelColumn] || 'Unknown').slice(0, 24),
    value: Number(row[valueColumn] || 0),
  }));
}

function humanizeKey(key) {
  return String(key || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

function firstPresent(row, keys) {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== '') {
      return row[key];
    }
  }
  return null;
}

function firstFacilityLabel(row) {
  const direct = firstPresent(row, ['name', 'facility_name', 'facility', 'recommended_facility', 'Recommended Facility']);
  if (direct) return direct;
  const firstString = Object.entries(row || {}).find(([, value]) => typeof value === 'string' && value.trim());
  return firstString ? firstString[1] : 'Top facility';
}

function buildGenieAnswer(query, genieText, rows) {
  if (!rows.length) {
    return genieText || 'Genie returned a response without display text.';
  }

  const top = rows[0];
  const trust = firstPresent(top, ['trust_score', 'Trust Score', 'avg_trust_score']);
  const availability = firstPresent(top, ['availability_24_7', '24/7 Available', 'available_24_7']);
  const flags = rows.filter(row => JSON.stringify(row).includes('too_many_unknown_capabilities')).length;
  const title = `Healthcare Facilities for ${query}`;
  const summary = [
    `For "${query}", Genie returned ${rows.length} facility rows from the Databricks Genie Space.`,
    `Recommended facility: ${firstFacilityLabel(top)}${trust !== null ? ` with trust score ${trust}` : ''}${availability !== null ? ` and 24/7 availability ${availability}` : ''}.`,
    flags ? `Important note: ${flags} returned rows mention too many unknown capabilities, so critical services should be verified before routing.` : null,
  ].filter(Boolean);

  return `## ${title}\n\n${summary.join('\n\n')}`;
}

function formatInlineMarkdown(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function MarkdownText({ text }) {
  const lines = String(text || '').split('\n');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} style={{ height: 4 }} />;
        if (trimmed.startsWith('## ')) {
          return <h3 key={index} style={{ fontFamily: 'var(--font-display)', fontSize: 15, marginTop: 4 }}>{formatInlineMarkdown(trimmed.slice(3))}</h3>;
        }
        if (trimmed.startsWith('# ')) {
          return <h2 key={index} style={{ fontFamily: 'var(--font-display)', fontSize: 17, marginTop: 4 }}>{formatInlineMarkdown(trimmed.slice(2))}</h2>;
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          return <div key={index} style={{ paddingLeft: 12 }}>• {formatInlineMarkdown(trimmed.slice(2))}</div>;
        }
        return <p key={index} style={{ margin: 0 }}>{formatInlineMarkdown(trimmed)}</p>;
      })}
    </div>
  );
}

function GenieResultTable({ rows }) {
  if (!rows?.length) return null;
  const columns = Object.keys(rows[0]).slice(0, 6);
  return (
    <div style={{ marginTop: 12, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'white' }}>
      <div style={{ padding: '8px 10px', fontWeight: 800, fontSize: 12, borderBottom: '1px solid var(--border)' }}>
        Genie result table
      </div>
      <div style={{ overflowX: 'auto', maxHeight: 260 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
          <thead>
            <tr style={{ background: 'var(--bg-primary)', textAlign: 'left' }}>
              {columns.map(column => (
                <th key={column} style={{ padding: 8, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{humanizeKey(column)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 10).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map(column => (
                  <td key={column} style={{ padding: 8, borderBottom: '1px solid var(--border)', verticalAlign: 'top', maxWidth: 220 }}>
                    {String(row[column] ?? '').slice(0, 180)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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
  const flags = normalizeFlags(facility.contradiction_flags);

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
          {facility.llm_fit_score != null && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '4px 9px', borderRadius: 999, background: 'var(--brand-teal-light)', color: 'var(--brand-teal)', fontSize: 11, fontWeight: 800 }}>
              <Sparkles size={12} />
              LLM fit {Number(facility.llm_fit_score).toFixed(0)}/100
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {serviceFields.slice(0, 7).map(([key, label]) => (
              <span key={key} className={coerceBoolean(facility[key]) ? 'badge-verified' : 'badge-partial'}>
                {coerceBoolean(facility[key]) ? '✓' : '•'} {label}
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
            {facility.llm_score_reason && (
              <p style={{ fontSize: 12.5, color: 'var(--brand-teal)', lineHeight: 1.6, marginTop: 8 }}>
                <strong>LLM fit:</strong> {facility.llm_score_reason}
              </p>
            )}
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

function ChatBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '86%',
        background: isUser ? 'var(--brand-teal)' : 'var(--bg-secondary)',
        color: isUser ? 'white' : 'var(--text-primary)',
        border: isUser ? 'none' : '1px solid var(--border)',
        borderRadius: 12,
        padding: 12,
        whiteSpace: 'pre-wrap',
        fontSize: 13,
        lineHeight: 1.6,
      }}
    >
      {isUser ? message.content : <MarkdownText text={message.content} />}
      <GenieResultTable rows={message.queryRows} />
      {message.sql?.length > 0 && (
        <details style={{ marginTop: 10 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Generated SQL</summary>
          {message.sql.map((query, index) => (
            <pre key={index} style={{ marginTop: 8, overflowX: 'auto', fontSize: 11 }}>
              {query}
            </pre>
          ))}
        </details>
      )}
    </div>
  );
}

function MetricCard({ label, value, sublabel }) {
  return (
    <div className="card" style={{ padding: 16, minHeight: 96 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 27, fontWeight: 800, marginTop: 5 }}>{numberFormat(value)}</div>
      {sublabel && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{sublabel}</div>}
    </div>
  );
}

function ChartCard({ title, icon, children }) {
  return (
    <div className="card" style={{ padding: 16, minHeight: 270 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        {icon}
        <strong style={{ fontFamily: 'var(--font-display)' }}>{title}</strong>
      </div>
      <div style={{ height: 210 }}>{children}</div>
    </div>
  );
}

export default function CareSearch() {
  const [query, setQuery] = useState(exampleQueries[0]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [answer, setAnswer] = useState(null);
  const [genieRows, setGenieRows] = useState([]);
  const [genieNote, setGenieNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const facilities = answer?.ranked_facilities || [];
  const metrics = useMemo(() => buildGenieMetrics(genieRows, facilities), [genieRows, facilities]);
  const trustChart = useMemo(() => buildTrustChart(facilities), [facilities]);
  const capabilityChart = useMemo(() => buildCapabilityChart(facilities), [facilities]);
  const stateChart = useMemo(() => buildStateChart(facilities), [facilities]);
  const genieChart = useMemo(() => buildGenieChart(genieRows), [genieRows]);

  const submit = async (nextQuery = query) => {
    const cleanQuery = nextQuery.trim();
    if (!cleanQuery) return;

    setQuery(cleanQuery);
    setLoading(true);
    setError('');
    setMessages(previous => [...previous, { role: 'user', content: cleanQuery }]);

    try {
      const [genieResponse, searchResponse] = await Promise.allSettled([
        askGenie(cleanQuery, conversationId),
        searchCareMap(cleanQuery, 10),
      ]);

      if (searchResponse.status === 'fulfilled') {
        setAnswer(searchResponse.value);
      } else {
        setAnswer(null);
      }

      let genieNarrative = '';
      let sql = [];
      let rows = [];
      if (genieResponse.status === 'fulfilled') {
        const response = genieResponse.value;
        setConversationId(response.conversation_id);
        rows = extractGenieRows(response.query_results || []);
        setGenieRows(rows);
        setGenieNote(rows.length ? `Genie returned ${rows.length} structured rows for metrics and charts.` : 'Genie returned narrative guidance without tabular rows.');
        genieNarrative = response.content || extractAttachmentText(response.attachments) || '';
        sql = (response.attachments || [])
          .filter(attachment => attachment.query)
          .map(attachment => attachment.query?.query || JSON.stringify(attachment.query, null, 2));
      } else {
        setGenieRows([]);
        setGenieNote(`Genie unavailable: ${genieResponse.reason?.message || genieResponse.reason}`);
      }

      setMessages(previous => [
        ...previous,
        {
          role: 'assistant',
          content: buildGenieAnswer(cleanQuery, genieNarrative, rows),
          sql,
          queryRows: rows,
        },
      ]);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 112px)', padding: 24 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <section className="card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.9fr', minHeight: 420 }}>
            <div style={{ padding: 22, background: 'linear-gradient(135deg, #102A43 0%, #153854 62%, #1C5B67 100%)', color: 'white', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={23} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.58)' }}>Genie Care Search</div>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, lineHeight: 1.12 }}>Ask Genie. Route patients. Update readiness intelligence.</h1>
                </div>
              </div>

              <div style={{ flex: 1, minHeight: 190, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
                {messages.length === 0 && (
                  <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 1.7, maxWidth: 720 }}>
                    Ask a natural-language question. Genie analyzes governed Databricks tables while CareMap also runs symptom-aware Vector Search and trust reranking.
                  </div>
                )}
                {messages.map((message, index) => (
                  <ChatBubble key={`${message.role}-${index}`} message={message} />
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)' }} />
                  <input
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    onKeyDown={event => event.key === 'Enter' && submit()}
                    placeholder="Ask Genie about symptoms, facilities, deserts, trust scores..."
                    style={{
                      width: '100%',
                      border: '1px solid rgba(255,255,255,0.18)',
                      background: 'rgba(255,255,255,0.08)',
                      color: 'white',
                      borderRadius: 10,
                      padding: '13px 14px 13px 42px',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
                <button className="btn-primary" onClick={() => submit()} disabled={loading}>
                  {loading ? <Loader2 size={16} /> : <Send size={16} />}
                  Ask
                </button>
              </div>
            </div>

            <div style={{ padding: 20, background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div className="section-label">Live Metrics</div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginTop: 3 }}>Filled from Genie and reranking</h2>
                </div>
                <Sparkles color="var(--brand-teal)" size={22} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {metrics.map(([label, value], index) => (
                  <MetricCard key={`${label}-${index}`} label={label} value={value} sublabel={index < 2 ? 'Genie/table derived' : 'Current query context'} />
                ))}
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="card" style={{ padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Database size={17} color="var(--brand-teal)" />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 800 }}>{answer?.retrieval_note || 'Vector Search will run with each Genie question.'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {genieNote || 'Genie output will update the metrics and charts after your first question.'}
                    </div>
                    {answer?.llm_note && (
                      <div style={{ fontSize: 12, color: 'var(--brand-teal)', marginTop: 4, fontWeight: 700 }}>
                        {answer.llm_note}
                      </div>
                    )}
                  </div>
                </div>
                {answer?.triage?.safety_note && (
                  <div className="card" style={{ padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--partial-bg)' }}>
                    <ShieldCheck size={17} color="var(--partial)" />
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {answer.triage.safety_note}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {exampleQueries.map(item => (
            <button key={item} className="btn-secondary" onClick={() => submit(item)} style={{ padding: '7px 11px', fontSize: 12 }}>
              {item}
            </button>
          ))}
        </div>

        {error && (
          <div className="card" style={{ padding: 14, borderColor: 'var(--critical-border)', color: 'var(--critical)' }}>
            {error}
          </div>
        )}

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ChartCard title="Genie query result chart" icon={<BarChart3 color="var(--brand-teal)" size={18} />}>
            {genieChart.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={genieChart} margin={{ top: 4, right: 4, left: -18, bottom: 6 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDE6ED" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2D9C9C" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                Ask Genie for a grouped metric, such as high-risk regions by state.
              </div>
            )}
          </ChartCard>

          <ChartCard title="Capability coverage in ranked facilities" icon={<ShieldCheck color="var(--brand-teal)" size={18} />}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={capabilityChart} margin={{ top: 4, right: 4, left: -18, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDE6ED" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={55} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#4F9F73" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Trust score distribution" icon={<BarChart3 color="var(--brand-teal)" size={18} />}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={trustChart} dataKey="count" nameKey="label" innerRadius={52} outerRadius={82} paddingAngle={3}>
                  {trustChart.map((entry, index) => (
                    <Cell key={entry.label} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Ranked facilities by state" icon={<MapPin color="var(--brand-teal)" size={18} />}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateChart} layout="vertical" margin={{ top: 4, right: 12, left: 24, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#DDE6ED" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="state" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="count" fill="#5B8DD9" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
              <div>
                <div className="section-label">Recommended Facilities</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>Trust-ranked care options</h2>
              </div>
              <span className="badge-verified">{facilities.length} shown</span>
            </div>

            {facilities.map(facility => (
              <FacilityResult key={facility.facility_id || facility.name} facility={facility} />
            ))}

            {answer && facilities.length === 0 && (
              <div className="card" style={{ padding: 18, color: 'var(--text-secondary)' }}>
                No facilities matched the current query. Try removing a state or capability constraint.
              </div>
            )}
          </div>

          <aside className="card" style={{ padding: 16, position: 'sticky', top: 144 }}>
            <div className="section-label">Reasoning Chain</div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Genie answers analytical questions over governed Databricks tables.',
                'Vector Search retrieves semantic facility candidates for the same prompt.',
                'CareMap reranks by trust score, symptom capability fit, and contradiction penalties.',
                'Metrics and charts refresh from Genie query rows plus the ranked facility set.',
              ].map((item, index) => (
                <div key={item} style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: 8, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 999, background: 'var(--brand-teal-light)', color: 'var(--brand-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                    {index + 1}
                  </div>
                  <div>{item}</div>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
