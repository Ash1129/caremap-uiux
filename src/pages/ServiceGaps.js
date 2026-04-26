import React, { useEffect, useState } from 'react';
import { AlertTriangle, BarChart3, Database, Loader2 } from 'lucide-react';
import { getDeserts, getQuality, getSummary } from '../api/caremapApi';

export default function ServiceGaps() {
  const [deserts, setDeserts] = useState([]);
  const [quality, setQuality] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getDeserts(), getQuality(), getSummary()])
      .then(([desertData, qualityData, summaryData]) => {
        setDeserts(desertData.regions || []);
        setQuality(qualityData.profile || []);
        setSummary(summaryData);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 112px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <Loader2 />
        Loading Databricks intelligence...
      </div>
    );
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 112px)', padding: 24 }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'end', marginBottom: 18 }}>
          <div>
            <div className="section-label">Service Gaps</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28 }}>Medical desert intelligence from Databricks</h1>
          </div>
          <span className="badge-verified">Live Delta Tables</span>
        </div>

        {error && <div className="card" style={{ padding: 14, color: 'var(--critical)', marginBottom: 14 }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            ['Facilities', summary?.facilities?.total_facilities],
            ['Avg Trust', Number(summary?.facilities?.avg_trust_score || 0).toFixed(1)],
            ['High Trust', summary?.facilities?.high_trust_facilities],
            ['High-Risk Regions', summary?.deserts?.high_risk_regions],
          ].map(([label, value]) => (
            <div key={label} className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800 }}>{value ?? '—'}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle color="var(--critical)" size={18} />
              <strong>Highest-risk regions</strong>
            </div>
            <div style={{ maxHeight: 560, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-primary)', textAlign: 'left' }}>
                    {['Region', 'PIN', 'Facilities', 'Trusted', 'Missing'].map(header => (
                      <th key={header} style={{ padding: 10, borderBottom: '1px solid var(--border)' }}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deserts.slice(0, 80).map((row, index) => (
                    <tr key={`${row.state}-${row.district_city}-${row.pin_code}-${index}`}>
                      <td style={{ padding: 10, borderBottom: '1px solid var(--border)' }}>
                        <strong>{row.district_city || 'Unknown'}</strong>
                        <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{row.state}</div>
                      </td>
                      <td style={{ padding: 10, borderBottom: '1px solid var(--border)' }}>{row.pin_code}</td>
                      <td style={{ padding: 10, borderBottom: '1px solid var(--border)' }}>{row.facility_count}</td>
                      <td style={{ padding: 10, borderBottom: '1px solid var(--border)' }}>{row.trusted_facility_count}</td>
                      <td style={{ padding: 10, borderBottom: '1px solid var(--border)' }}>
                        {(Array.isArray(row.missing_services) ? row.missing_services : [row.missing_services]).join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <BarChart3 color="var(--brand-teal)" size={18} />
                <strong>Data quality watchlist</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {quality.slice(0, 10).map(item => (
                  <div key={item.column_name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span>{item.column_name}</span>
                      <strong>{Number(item.missing_or_blank_pct || 0).toFixed(1)}%</strong>
                    </div>
                    <div style={{ height: 7, borderRadius: 999, background: 'var(--bg-primary)', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(Number(item.missing_or_blank_pct || 0), 100)}%`, height: '100%', background: 'var(--partial)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card" style={{ padding: 16, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <Database size={20} color="var(--brand-teal)" />
              <p style={{ marginTop: 10 }}>
                This page reads `medical_deserts`, `facility_capabilities`, and `data_quality_profile` from Databricks through the FastAPI gateway.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
