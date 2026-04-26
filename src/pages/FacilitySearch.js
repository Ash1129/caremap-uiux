import React, { useState } from 'react';
import TrustScore, { getTrustColor, getTrustLabel } from '../components/TrustScore';
import { facilities } from '../data/mockData';

const exampleQueries = [
  'Emergency appendectomy in rural Bihar',
  'Nearest verified ICU near Patna',
  'Dialysis center within 100km of Pune',
  'Neonatal care in Rajasthan',
];

export default function FacilitySearch() {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [minTrust, setMinTrust] = useState(0);
  const [sortBy, setSortBy] = useState('trust');

  const handleSearch = (q) => {
    setQuery(q || query);
    setSearched(true);
    setSelectedFacility(null);
  };

  const sorted = [...facilities]
    .filter(f => f.trustScore >= minTrust)
    .sort((a, b) => sortBy === 'trust' ? b.trustScore - a.trustScore : a.distance - b.distance);

  if (selectedFacility) {
    return <FacilityDetail facility={selectedFacility} onBack={() => setSelectedFacility(null)} allFacilities={facilities} />;
  }

  if (!searched) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: 'calc(100vh - var(--topbar-height))',
        padding: 40, gap: 32,
      }}>
        <div style={{ textAlign: 'center', maxWidth: 640 }}>
          <div style={{
            display: 'inline-block',
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.8px', textTransform: 'uppercase',
            color: 'var(--brand-blue)',
            background: 'rgba(47,127,237,0.1)',
            border: '1px solid rgba(47,127,237,0.2)',
            padding: '5px 14px', borderRadius: 100,
            marginBottom: 20,
          }}>
            AI-Powered Healthcare Intelligence
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 42, fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-1.5px', lineHeight: 1.1,
            marginBottom: 16,
          }}>
            Find healthcare you can<br />
            <span style={{ color: 'var(--brand-blue)' }}>actually trust</span>
          </h1>

          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 28 }}>
            AI-verified facility intelligence across 10,247 facilities in India
          </p>

          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'white',
            border: '2px solid var(--border)',
            borderRadius: 14, padding: '6px 6px 6px 16px',
            boxShadow: 'var(--shadow-md)',
            marginBottom: 16,
          }}>
            <input
              type="text"
              placeholder="Find emergency surgery in rural Bihar..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{
                flex: 1, border: 'none', outline: 'none',
                fontFamily: 'var(--font-body)', fontSize: 15,
                color: 'var(--text-primary)', background: 'transparent',
                padding: '8px 12px',
              }}
            />
            <button onClick={() => handleSearch()} style={{
              background: 'var(--brand-blue)', color: 'white',
              border: 'none', borderRadius: 10,
              padding: '10px 20px',
              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
              cursor: 'pointer',
            }}>
              Search →
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {exampleQueries.map((q, i) => (
              <button key={i} onClick={() => handleSearch(q)} style={{
                background: 'white',
                border: '1.5px solid var(--border)',
                borderRadius: 100, padding: '6px 14px',
                fontFamily: 'var(--font-body)', fontSize: 12,
                color: 'var(--text-secondary)', cursor: 'pointer',
              }}>
                {q}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { value: '10,247', label: 'Facilities Analyzed' },
            { value: '38%', label: 'Fully Verified' },
            { value: '312M', label: 'People in Care Deserts' },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'white', border: '1px solid var(--border)',
              borderRadius: 12, padding: '16px 24px', textAlign: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 28, fontWeight: 800,
                color: 'var(--text-primary)', letterSpacing: '-1px',
              }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 220px', height: 'calc(100vh - var(--topbar-height))', overflow: 'hidden' }}>
      {/* Filters */}
      <aside style={{
        padding: '18px 14px', borderRight: '1px solid var(--border)',
        background: 'white', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700 }}>Filters</div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: 8 }}>
            Min Trust Score: <strong style={{ color: 'var(--text-primary)' }}>{minTrust}</strong>
          </div>
          <input type="range" min={0} max={100} value={minTrust}
            onChange={e => setMinTrust(+e.target.value)}
            style={{ width: '100%', accentColor: 'var(--brand-blue)' }} />
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: 8 }}>Sort By</div>
          {['trust', 'distance'].map(s => (
            <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, cursor: 'pointer' }}>
              <input type="radio" name="sort" checked={sortBy === s} onChange={() => setSortBy(s)} style={{ accentColor: 'var(--brand-blue)' }} />
              {s === 'trust' ? 'Trust Score' : 'Distance'}
            </label>
          ))}
        </div>
      </aside>

      {/* Results */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', background: 'white' }}>
          <div style={{
            background: 'rgba(47,127,237,0.06)',
            border: '1px solid rgba(47,127,237,0.15)',
            borderRadius: 8, padding: '10px 12px',
            fontSize: 12.5, color: 'var(--text-secondary)',
          }}>
            ⚡ <strong>3 of {facilities.length} facilities</strong> are fully verified for this query. AI recommends <strong>District Hospital Gopalganj</strong> — 31km, Trust Score 87.
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sorted.map((f, i) => (
            <FacilityCard key={f.id} facility={f} onClick={() => setSelectedFacility(f)} />
          ))}
        </div>
      </div>

      {/* Insight panel */}
      <aside style={{
        padding: '18px 14px', borderLeft: '1px solid var(--border)',
        background: 'white', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-blue)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          🧠 Regional Insight
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Bihar has <strong>14 facilities</strong> claiming surgery capability. Only <strong>3 are fully verified.</strong>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>
          <div style={{ color: 'var(--text-muted)' }}>Most common gap</div>
          <strong style={{ color: 'var(--text-primary)' }}>Anesthesiologist</strong>
          <div style={{ color: 'var(--critical)', fontSize: 11 }}>67% of facilities</div>
        </div>
      </aside>
    </div>
  );
}

function FacilityCard({ facility: f, onClick }) {
  const color = getTrustColor(f.trustScore);
  return (
    <div onClick={onClick} style={{
      background: 'white', border: '1.5px solid var(--border)',
      borderRadius: 12, padding: 16,
      display: 'flex', alignItems: 'flex-start', gap: 16,
      boxShadow: 'var(--shadow-card)', cursor: 'pointer',
      transition: 'all 0.15s ease',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-blue)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <TrustScore score={f.trustScore} size="md" />

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{f.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              📍 {f.district}, {f.state} · {f.distance}km · {f.type}
            </div>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.8px',
            padding: '4px 10px', borderRadius: 6,
            border: `1.5px solid ${color}`,
            color, background: `${color}15`,
            fontFamily: 'var(--font-display)',
          }}>
            {getTrustLabel(f.trustScore)}
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {[
            { key: 'emergencySurgery', label: 'Surgery' },
            { key: 'icu', label: 'ICU' },
            { key: 'bloodBank', label: 'Blood Bank' },
            { key: 'anesthesiologist', label: 'Anesthesia' },
          ].map(cap => {
            const val = f.capabilities[cap.key];
            const ok = val === true || val === 'yes';
            return (
              <span key={cap.key} style={{
                fontSize: 11, fontWeight: 500,
                padding: '3px 9px', borderRadius: 5,
                color: ok ? 'var(--verified)' : 'var(--critical)',
                background: ok ? 'var(--verified-bg)' : 'var(--critical-bg)',
                border: `1px solid ${ok ? 'rgba(61,184,122,0.3)' : 'rgba(217,95,95,0.3)'}`,
              }}>
                {ok ? '✓' : '✗'} {cap.label}
              </span>
            );
          })}
        </div>

        {f.missingLinks.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: 'var(--critical)',
            background: 'var(--critical-bg)',
            border: '1px solid rgba(217,95,95,0.2)',
            borderRadius: 6, padding: '6px 10px',
          }}>
            ⚠️ Missing: {f.missingLinks.join(' · ')}
          </div>
        )}
      </div>

      <button onClick={onClick} style={{
        background: 'var(--brand-blue)', color: 'white',
        border: 'none', borderRadius: 8,
        padding: '8px 14px',
        fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600,
        cursor: 'pointer', flexShrink: 0,
      }}>
        View Audit
      </button>
    </div>
  );
}

function FacilityDetail({ facility: f, onBack, allFacilities }) {
  const [activeTab, setActiveTab] = useState('audit');
  const others = allFacilities.filter(x => x.id !== f.id).slice(0, 2);

  const capChecklist = [
    { key: 'operationTheatre', label: 'Operation Theatre' },
    { key: 'surgeon', label: 'General Surgeon' },
    { key: 'oxygenSupply', label: 'Oxygen Supply' },
    { key: 'anesthesiologist', label: 'Anesthesiologist' },
    { key: 'bloodBank', label: 'Blood Bank (on-site)' },
    { key: 'icu', label: 'ICU / Post-op Ward' },
  ];

  return (
    <div style={{ padding: '20px 24px' }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none',
        fontFamily: 'var(--font-body)', fontSize: 13,
        color: 'var(--text-secondary)', cursor: 'pointer',
        marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6,
      }}>
        ← Back to Results
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 200px', gap: 20 }}>
        {/* Left snapshot */}
        <div style={{
          background: 'white', border: '1.5px solid var(--border)',
          borderRadius: 14, padding: 18,
          display: 'flex', flexDirection: 'column', gap: 14,
          boxShadow: 'var(--shadow-card)',
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '1px',
            textTransform: 'uppercase', color: 'var(--brand-blue)',
            background: 'rgba(47,127,237,0.1)', borderRadius: 5,
            padding: '3px 8px', width: 'fit-content',
          }}>{f.type}</span>

          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.25 }}>
            {f.name}
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div>📍 {f.district}, {f.state} — {f.pin}</div>
            <div>📏 {f.distance}km from your location</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
            <TrustScore score={f.trustScore} size="lg" />
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
            Last AI verified: April 23, 2026<br />
            {f.evidence.length} sources analyzed
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <button style={{
              background: 'var(--brand-blue)', color: 'white',
              border: 'none', borderRadius: 8, padding: '9px',
              fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600,
              cursor: 'pointer',
            }}>📍 Get Directions</button>
            <button style={{
              background: 'transparent', color: 'var(--text-secondary)',
              border: '1.5px solid var(--border)', borderRadius: 8, padding: '8px',
              fontFamily: 'var(--font-body)', fontSize: 12.5,
              cursor: 'pointer',
            }}>📤 Share Facility</button>
          </div>
        </div>

        {/* Center audit */}
        <div>
          <div style={{ display: 'flex', gap: 4, borderBottom: '1.5px solid var(--border)', marginBottom: 20 }}>
            {['audit', 'evidence', 'compare'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding: '9px 16px', border: 'none', background: 'none',
                fontFamily: 'var(--font-body)', fontSize: 13,
                fontWeight: activeTab === t ? 600 : 400,
                color: activeTab === t ? 'var(--brand-blue)' : 'var(--text-muted)',
                borderBottom: activeTab === t ? '2.5px solid var(--brand-blue)' : '2.5px solid transparent',
                marginBottom: -1.5, cursor: 'pointer',
              }}>
                {t === 'audit' ? '⚕️ Capability Audit' : t === 'evidence' ? '📜 Evidence' : '⚖️ Compare'}
              </button>
            ))}
          </div>

          {activeTab === 'audit' && (
            <div>
              {/* Trust breakdown */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Trust Score Breakdown</div>
                {[
                  { label: 'Equipment Match', value: f.trustBreakdown.equipment, max: 30 },
                  { label: 'Staff Availability', value: f.trustBreakdown.staff, max: 25 },
                  { label: 'Procedure Capability', value: f.trustBreakdown.procedure, max: 25 },
                  { label: 'Data Reliability', value: f.trustBreakdown.dataReliability, max: 20 },
                ].map(item => (
                  <div key={item.label} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 60px', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{item.label}</span>
                    <div style={{ height: 8, background: 'var(--bg-primary)', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(item.value / item.max) * 100}%`, background: 'var(--brand-blue)', borderRadius: 100 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, textAlign: 'right' }}>{item.value}/{item.max}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1.5px solid var(--border)', paddingTop: 10, textAlign: 'right', fontSize: 13, color: 'var(--text-secondary)' }}>
                  Total: <strong style={{ fontSize: 16 }}>{f.trustScore}/100</strong>
                </div>
              </div>

              {/* Checklist */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
                  Capability Audit — <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Emergency Appendectomy</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {capChecklist.map(cap => {
                    const val = f.capabilities[cap.key];
                    const ok = val === true || val === 'yes';
                    const partial = val === 'partial';
                    return (
                      <div key={cap.key} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                        color: ok ? 'var(--verified)' : partial ? 'var(--partial)' : 'var(--critical)',
                        background: ok ? 'var(--verified-bg)' : partial ? 'var(--partial-bg)' : 'var(--critical-bg)',
                        border: `1.5px solid ${ok ? 'rgba(61,184,122,0.25)' : partial ? 'rgba(240,168,58,0.25)' : 'rgba(217,95,95,0.25)'}`,
                      }}>
                        {ok ? '✅' : partial ? '⚠️' : '❌'} {cap.label}
                      </div>
                    );
                  })}
                </div>

                {f.missingLinks.length > 0 ? (
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '12px 14px', borderRadius: 10,
                    background: 'var(--critical-bg)',
                    border: '1.5px solid rgba(217,95,95,0.3)',
                    color: 'var(--critical)', fontSize: 13,
                  }}>
                    <span>⚠️</span>
                    <div>
                      <strong>NOT FULLY VERIFIED for this procedure</strong>
                      <p style={{ color: 'var(--text-secondary)', marginTop: 3, fontSize: 12 }}>
                        {f.missingLinks.length} critical gap(s) detected. Risk level: HIGH for emergency use.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '12px 14px', borderRadius: 10,
                    background: 'var(--verified-bg)',
                    border: '1.5px solid rgba(61,184,122,0.3)',
                    color: 'var(--verified)', fontSize: 13,
                  }}>
                    ✅ <strong>FULLY VERIFIED for this procedure</strong>
                  </div>
                )}
              </div>

              {/* Upgrade impact */}
              {f.upgradeImpact && (
                <div style={{
                  background: 'rgba(43,179,163,0.06)',
                  border: '1.5px solid rgba(43,179,163,0.25)',
                  borderRadius: 10, padding: 14,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                    💡 {f.upgradeImpact.action}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                    {[
                      { label: 'Score Impact', value: f.upgradeImpact.scoreJump },
                      { label: 'People Served', value: `${(f.upgradeImpact.population / 1000).toFixed(0)}K` },
                      { label: 'Est. Cost', value: f.upgradeImpact.cost },
                    ].map((m, i) => (
                      <div key={i} style={{ background: 'white', borderRadius: 8, padding: '10px 8px', textAlign: 'center', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.label}</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginTop: 3 }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'evidence' && (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 6 }}>AI Evidence Citations</div>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16 }}>Exact text found in facility records, analyzed by AI</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {f.evidence.map((e, i) => (
                  <div key={i} style={{
                    borderRadius: 10, padding: 14,
                    background: e.type === 'verified' ? 'var(--verified-bg)' : e.type === 'warning' ? 'var(--partial-bg)' : 'var(--critical-bg)',
                    border: `1.5px solid ${e.type === 'verified' ? 'rgba(61,184,122,0.3)' : e.type === 'warning' ? 'rgba(240,168,58,0.3)' : 'rgba(217,95,95,0.3)'}`,
                  }}>
                    <div style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 10 }}>
                      "{e.text}"
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {e.type === 'verified' ? '✅' : e.type === 'warning' ? '⚠️' : '❌'} {e.supports}
                      </span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ fontSize: 10.5, background: 'white', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 8px', color: 'var(--text-muted)' }}>
                          {e.confidence}
                        </span>
                        <span style={{ fontSize: 10.5, background: 'white', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 8px', color: 'var(--text-muted)' }}>
                          {e.source}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'compare' && (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Care Route Comparison</div>
              <div style={{ border: '1.5px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 100px', padding: '10px 14px', background: 'var(--bg-primary)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                  <span>Facility</span><span>Distance</span><span>Trust</span><span>Verdict</span>
                </div>
                {[f, ...others].map((fac, i) => (
                  <div key={fac.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 80px 100px 100px',
                    padding: '10px 14px', fontSize: 12.5,
                    background: i === 0 ? 'rgba(47,127,237,0.05)' : 'white',
                    borderBottom: i < others.length ? '1px solid var(--border)' : 'none',
                    alignItems: 'center',
                  }}>
                    <span style={{ fontWeight: i === 0 ? 600 : 400 }}>
                      {i === 0 && <span style={{ fontSize: 10, color: 'var(--brand-blue)', fontWeight: 700, display: 'block' }}>CURRENT</span>}
                      {fac.name}
                    </span>
                    <span>{fac.distance}km</span>
                    <span style={{ fontWeight: 700, color: fac.trustScore >= 80 ? 'var(--verified)' : fac.trustScore >= 50 ? 'var(--partial)' : 'var(--critical)' }}>
                      {fac.trustScore}
                    </span>
                    <span>{fac.trustScore >= 80 ? '✅ Best' : fac.trustScore >= 50 ? '⚠️ Partial' : '❌ Avoid'}</span>
                  </div>
                ))}
              </div>
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                background: 'rgba(47,127,237,0.07)',
                border: '1px solid rgba(47,127,237,0.2)',
                borderRadius: 8, padding: 12, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5,
              }}>
                💡 For emergency appendectomy, <strong>AIIMS Patna</strong> (134km) is the only fully verified option. Travel further for higher safety probability.
              </div>
            </div>
          )}
        </div>

        {/* Right evidence panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📜 Quick Evidence
          </div>
          {f.evidence.slice(0, 2).map((e, i) => (
            <div key={i} style={{
              borderRadius: 10, padding: 12,
              background: e.type === 'verified' ? 'var(--verified-bg)' : e.type === 'warning' ? 'var(--partial-bg)' : 'var(--critical-bg)',
              border: `1.5px solid ${e.type === 'verified' ? 'rgba(61,184,122,0.25)' : e.type === 'warning' ? 'rgba(240,168,58,0.25)' : 'rgba(217,95,95,0.25)'}`,
            }}>
              <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
                "{e.text.substring(0, 80)}..."
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 600 }}>
                {e.type === 'verified' ? '✅' : e.type === 'warning' ? '⚠️' : '❌'} {e.supports}
              </div>
            </div>
          ))}

          {f.upgradeImpact && (
            <div style={{
              background: 'rgba(43,179,163,0.06)',
              border: '1.5px solid rgba(43,179,163,0.2)',
              borderRadius: 10, padding: 12,
              display: 'flex', flexDirection: 'column', gap: 7,
              fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5,
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--brand-teal)' }}>🤝 Care Cluster</div>
              <p>This facility has Surgery + OT but no Blood Bank.</p>
              <p><strong>City Care Hospital</strong> (6km) has verified Blood Bank.</p>
              <p>Together they can handle complex surgical cases.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}