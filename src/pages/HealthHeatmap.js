import React, { useState, useEffect } from 'react';

const stateDetails = {
  'Maharashtra': { readiness: 71, verified: 312, partial: 198, critical: 23, population: 1100000, topGap: 'Specialist', disease: 'Clear', deserts: 23 },
  'Rajasthan': { readiness: 44, verified: 89, partial: 201, critical: 98, population: 6100000, topGap: 'ICU Equipment', disease: 'Clear', deserts: 98 },
  'Uttar Pradesh': { readiness: 48, verified: 203, partial: 412, critical: 189, population: 14400000, topGap: 'Blood Bank', disease: 'Malaria', deserts: 203 },
  'Madhya Pradesh': { readiness: 52, verified: 134, partial: 178, critical: 64, population: 3200000, topGap: 'Oxygen Supply', disease: 'TB', deserts: 64 },
  'Bihar': { readiness: 41, verified: 42, partial: 118, critical: 63, population: 8200000, topGap: 'Anesthesiologist', disease: 'Dengue', deserts: 127 },
  'West Bengal': { readiness: 63, verified: 187, partial: 143, critical: 41, population: 2800000, topGap: '24/7 Coverage', disease: 'Dengue', deserts: 41 },
  'Karnataka': { readiness: 69, verified: 221, partial: 156, critical: 28, population: 850000, topGap: 'Dialysis', disease: 'Clear', deserts: 28 },
  'Tamil Nadu': { readiness: 74, verified: 289, partial: 121, critical: 18, population: 620000, topGap: 'Trauma Care', disease: 'Clear', deserts: 18 },
  'Andhra Pradesh': { readiness: 66, verified: 178, partial: 167, critical: 42, population: 1200000, topGap: 'Anesthesiologist', disease: 'Clear', deserts: 42 },
  'Telangana': { readiness: 67, verified: 156, partial: 134, critical: 36, population: 980000, topGap: 'Blood Bank', disease: 'Clear', deserts: 36 },
  'Gujarat': { readiness: 68, verified: 198, partial: 134, critical: 31, population: 900000, topGap: 'Neonatal Care', disease: 'Clear', deserts: 31 },
  'Odisha': { readiness: 55, verified: 112, partial: 167, critical: 58, population: 2100000, topGap: 'ICU Equipment', disease: 'Malaria', deserts: 58 },
  'Jharkhand': { readiness: 53, verified: 98, partial: 143, critical: 62, population: 1800000, topGap: 'Surgeon', disease: 'Clear', deserts: 62 },
  'Assam': { readiness: 57, verified: 134, partial: 156, critical: 52, population: 1900000, topGap: 'Blood Bank', disease: 'Malaria', deserts: 52 },
  'Punjab': { readiness: 72, verified: 167, partial: 98, critical: 18, population: 780000, topGap: '24/7 Coverage', disease: 'Clear', deserts: 18 },
  'Haryana': { readiness: 70, verified: 145, partial: 112, critical: 21, population: 820000, topGap: 'Neonatal', disease: 'Clear', deserts: 21 },
  'Kerala': { readiness: 78, verified: 312, partial: 89, critical: 12, population: 410000, topGap: 'ICU Capacity', disease: 'Clear', deserts: 12 },
  'Chhattisgarh': { readiness: 50, verified: 87, partial: 138, critical: 71, population: 2200000, topGap: 'Anesthesiologist', disease: 'Clear', deserts: 71 },
  'Uttarakhand': { readiness: 64, verified: 112, partial: 98, critical: 32, population: 680000, topGap: 'Specialist', disease: 'Clear', deserts: 32 },
  'Himachal Pradesh': { readiness: 75, verified: 134, partial: 67, critical: 14, population: 320000, topGap: 'Dialysis', disease: 'Clear', deserts: 14 },
  'Jammu and Kashmir': { readiness: 58, verified: 89, partial: 112, critical: 44, population: 1200000, topGap: 'Trauma Care', disease: 'Clear', deserts: 44 },
  'Goa': { readiness: 82, verified: 45, partial: 12, critical: 3, population: 150000, topGap: 'Specialist', disease: 'Clear', deserts: 3 },
};

const alerts = [
  '🔴 Bihar: 12 districts have zero ICU-verified facilities',
  '🔴 Rajasthan: 4.2M people more than 100km from verified trauma care',
  '🟡 Nagpur: 5 surgery facilities urgently need anesthesiologist',
  '🟢 Muzaffarpur: New ICU verified — Trust Score 41→78',
  '🔴 UP: Dengue rising in 6 districts with inadequate fever care',
  '🟢 Kerala: 12 new facilities verified — national model for readiness',
];

const capFilters = ['Emergency Surgery', 'ICU', 'Neonatal', 'Dialysis', 'Trauma'];
const diseaseFilters = ['COVID', 'Dengue', 'Malaria', 'TB', 'Chickenpox'];

function getColor(readiness) {
  if (!readiness) return '#C8D8E8';
  if (readiness >= 65) return '#3DB87A';
  if (readiness >= 50) return '#F0A83A';
  return '#D95F5F';
}

// Project lat/lng to SVG coordinates for India
function project(lng, lat) {
  const x = (lng - 68) * 6.5;
  const y = (37 - lat) * 7.5;
  return [x, y];
}

function geoPathToSVG(geometry) {
  if (!geometry) return '';
  const coords = geometry.type === 'Polygon'
    ? [geometry.coordinates]
    : geometry.coordinates;

  return coords.map(polygon =>
    polygon.map(ring => {
      const points = ring.map(([lng, lat]) => project(lng, lat));
      return 'M ' + points.map(p => p.join(' ')).join(' L ') + ' Z';
    }).join(' ')
  ).join(' ');
}

function getCentroid(geometry) {
  if (!geometry) return [250, 200];
  const coords = geometry.type === 'Polygon'
    ? geometry.coordinates[0]
    : geometry.coordinates[0][0];
  const lngs = coords.map(c => c[0]);
  const lats = coords.map(c => c[1]);
  const lng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
  const lat = lats.reduce((a, b) => a + b, 0) / lats.length;
  return project(lng, lat);
}

export default function HealthHeatmap() {
  const [geoData, setGeoData] = useState(null);
  const [hoveredState, setHoveredState] = useState(null);
  const [clickedState, setClickedState] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [activeCapFilters, setActiveCapFilters] = useState([]);
  const [activeDiseaseFilters, setActiveDiseaseFilters] = useState([]);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson')
      .then(r => r.json())
      .then(data => setGeoData(data))
      .catch(err => console.error('Failed to load map:', err));
  }, []);

  const detail = clickedState ? stateDetails[clickedState] : null;

  const handleMouseMove = (e, stateName) => {
    const rect = e.currentTarget.closest('svg').getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setHoveredState(stateName);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 210px', height: 'calc(100vh - var(--topbar-height))', overflow: 'hidden' }}>

      {/* Left filters */}
      <aside style={{ background: 'white', borderRight: '1px solid var(--border)', padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700 }}>Map Layers</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Capabilities</div>
          {capFilters.map(f => (
            <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={activeCapFilters.includes(f)} onChange={() => setActiveCapFilters(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f])} style={{ accentColor: 'var(--brand-blue)' }} />
              {f}
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Disease Pressure</div>
          {diseaseFilters.map(f => (
            <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={activeDiseaseFilters.includes(f)} onChange={() => setActiveDiseaseFilters(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f])} style={{ accentColor: 'var(--brand-blue)' }} />
              {f}
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Legend</div>
          {[['#3DB87A', 'Verified (65+)'], ['#F0A83A', 'Partial (50–64)'], ['#D95F5F', 'Critical (<50)'], ['#C8D8E8', 'No data']].map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: c, flexShrink: 0, display: 'inline-block' }} />
              {l}
            </div>
          ))}
        </div>
      </aside>

      {/* Map */}
      <div style={{ display: 'flex', flexDirection: 'column', background: '#D6E4F0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'white', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            India Healthcare Readiness Map
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--verified-bg)', color: 'var(--verified)', border: '1px solid rgba(61,184,122,0.3)', borderRadius: 100, padding: '3px 10px' }}>🟢 LIVE</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Hover to explore · Click for details</span>
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {!geoData ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 32 }}>🗺️</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading India map...</div>
            </div>
          ) : (
            <svg
              viewBox="0 0 400 380"
              style={{ width: '100%', height: '100%' }}
              onMouseLeave={() => setHoveredState(null)}
            >
              <rect width="400" height="380" fill="#D6E4F0" />

              {geoData.features.map((feature, i) => {
                const name = feature.properties.NAME_1;
                const d = stateDetails[name];
                const color = getColor(d?.readiness);
                const pathD = geoPathToSVG(feature.geometry);
                const isHovered = hoveredState === name;
                const isClicked = clickedState === name;
                const centroid = getCentroid(feature.geometry);

                return (
                  <g key={i}>
                    <path
                      d={pathD}
                      fill={color}
                      stroke="white"
                      strokeWidth={isHovered || isClicked ? 1.5 : 0.8}
                      opacity={isHovered || isClicked ? 1 : hoveredState ? 0.75 : 0.92}
                      style={{
                        cursor: 'pointer',
                        filter: isClicked ? 'drop-shadow(0 0 6px rgba(47,127,237,0.6))' : isHovered ? 'brightness(1.1)' : 'none',
                        transition: 'opacity 0.2s ease',
                      }}
                      onMouseMove={e => handleMouseMove(e, name)}
                      onMouseLeave={() => setHoveredState(null)}
                      onClick={() => setClickedState(clickedState === name ? null : name)}
                    />
                    {d && isHovered && (
                      <text
                        x={centroid[0]}
                        y={centroid[1]}
                        fontSize="7"
                        fontWeight="700"
                        fontFamily="'Syne', sans-serif"
                        fill="white"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        pointerEvents="none"
                        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
                      >
                        {d.readiness}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Water labels */}
              <text x="18" y="200" fontSize="7" fill="#8FA3B8" fontStyle="italic" fontFamily="sans-serif">Arabian</text>
              <text x="18" y="210" fontSize="7" fill="#8FA3B8" fontStyle="italic" fontFamily="sans-serif">Sea</text>
              <text x="355" y="200" fontSize="7" fill="#8FA3B8" fontStyle="italic" fontFamily="sans-serif">Bay of</text>
              <text x="355" y="210" fontSize="7" fill="#8FA3B8" fontStyle="italic" fontFamily="sans-serif">Bengal</text>

              {/* Hover tooltip */}
              {hoveredState && stateDetails[hoveredState] && (() => {
                const d = stateDetails[hoveredState];
                const tx = Math.min(tooltipPos.x + 10, 240);
                const ty = Math.max(tooltipPos.y - 140, 10);
                return (
                  <g>
                    <rect x={tx} y={ty} width="155" height={d.disease !== 'Clear' ? 130 : 115} rx="6" fill="white" stroke="#E2EAF0" strokeWidth="0.8" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }} />
                    <text x={tx + 8} y={ty + 16} fontSize="9" fontWeight="700" fontFamily="'Syne', sans-serif" fill="#0D1B2A">{hoveredState}</text>
                    <line x1={tx + 8} y1={ty + 22} x2={tx + 147} y2={ty + 22} stroke="#E2EAF0" strokeWidth="0.5" />
                    <text x={tx + 8} y={ty + 34} fontSize="8" fill="#4A6078" fontFamily="sans-serif">Readiness</text>
                    <text x={tx + 100} y={ty + 34} fontSize="10" fontWeight="700" fontFamily="'Syne', sans-serif" fill={getColor(d.readiness)}>{d.readiness}/100</text>
                    <text x={tx + 8} y={ty + 48} fontSize="8" fill="#4A6078" fontFamily="sans-serif">✅ Verified</text>
                    <text x={tx + 100} y={ty + 48} fontSize="8" fontWeight="600" fill="#3DB87A" fontFamily="sans-serif">{d.verified}</text>
                    <text x={tx + 8} y={ty + 61} fontSize="8" fill="#4A6078" fontFamily="sans-serif">❌ Critical</text>
                    <text x={tx + 100} y={ty + 61} fontSize="8" fontWeight="600" fill="#D95F5F" fontFamily="sans-serif">{d.critical}</text>
                    <text x={tx + 8} y={ty + 74} fontSize="8" fill="#4A6078" fontFamily="sans-serif">Top Gap</text>
                    <text x={tx + 100} y={ty + 74} fontSize="7" fontWeight="600" fill="#0D1B2A" fontFamily="sans-serif">{d.topGap}</text>
                    <text x={tx + 8} y={ty + 87} fontSize="8" fill="#4A6078" fontFamily="sans-serif">Pop. at Risk</text>
                    <text x={tx + 100} y={ty + 87} fontSize="8" fontWeight="600" fill="#0D1B2A" fontFamily="sans-serif">{(d.population / 1000000).toFixed(1)}M</text>
                    {d.disease !== 'Clear' && (
                      <text x={tx + 8} y={ty + 100} fontSize="8" fill="#D95F5F" fontFamily="sans-serif" fontWeight="600">🔴 {d.disease} Active</text>
                    )}
                    <rect x={tx + 8} y={ty + (d.disease !== 'Clear' ? 110 : 97)} width="139" height="14" rx="4" fill="#2F7FED" style={{ cursor: 'pointer' }} onClick={() => setClickedState(hoveredState)} />
                    <text x={tx + 77} y={ty + (d.disease !== 'Clear' ? 120 : 107)} fontSize="8" fill="white" fontFamily="sans-serif" fontWeight="600" textAnchor="middle">Click for full detail →</text>
                  </g>
                );
              })()}
            </svg>
          )}
        </div>

        {/* Alert ticker */}
        <div style={{ background: 'var(--bg-sidebar)', padding: '10px 0', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', overflow: 'hidden' }}>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '1.5px', color: 'var(--critical)', background: 'rgba(217,95,95,0.2)', borderRadius: 4, padding: '3px 7px', flexShrink: 0 }}>LIVE</span>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ display: 'flex', gap: 40, animation: 'ticker 25s linear infinite', whiteSpace: 'nowrap' }}>
                {[...alerts, ...alerts].map((a, i) => (
                  <span key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{a}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <aside style={{ background: 'white', borderLeft: '1px solid var(--border)', padding: '16px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {clickedState && detail ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={() => setClickedState(null)} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--brand-blue)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)', fontWeight: 600 }}>← Back</button>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{clickedState}</h3>
            <div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 800, color: getColor(detail.readiness) }}>{detail.readiness}</span>
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}> / 100</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { l: 'Verified', v: detail.verified, c: 'var(--verified)' },
                { l: 'Partial', v: detail.partial, c: 'var(--partial)' },
                { l: 'Critical', v: detail.critical, c: 'var(--critical)' },
                { l: 'Deserts', v: detail.deserts, c: 'var(--critical)' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: 10 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--critical-bg)', border: '1px solid rgba(217,95,95,0.2)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--critical)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Gap</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 3 }}>{detail.topGap}</div>
            </div>
            {detail.disease !== 'Clear' && (
              <div style={{ fontSize: 12.5, color: 'var(--critical)', background: 'var(--critical-bg)', borderRadius: 7, padding: '8px 10px' }}>
                🔴 Disease Alert: <strong>{detail.disease}</strong>
              </div>
            )}
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Population at risk</div>
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>{(detail.population / 1000000).toFixed(1)}M people</strong>
            </div>
            <button style={{ background: 'var(--brand-blue)', color: 'white', border: 'none', borderRadius: 8, padding: 9, fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>📋 Intervention Plan</button>
            <button style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1.5px solid var(--border)', borderRadius: 8, padding: 8, fontFamily: 'var(--font-body)', fontSize: 12.5, cursor: 'pointer' }}>🔗 Find Suppliers</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-blue)' }}>🧠 AI Insights</div>
            {[
              { l: 'Top gap nationally', v: 'Anesthesiologist (34%)' },
              { l: 'Highest risk state', v: 'Bihar — 63 critical' },
              { l: 'Disease alerts', v: '🔴 Dengue: 8 states' },
              { l: 'Medical deserts', v: '847 districts' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.l}</span>
                <strong style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>{s.v}</strong>
              </div>
            ))}
            <div style={{ height: 1, background: 'var(--border)' }} />
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>TRENDING GAPS</div>
            {[['Anesthesiologist', '34%'], ['ICU Equipment', '28%'], ['24/7 Coverage', '22%'], ['Blood Bank', '16%']].map(([g, p], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', width: 18 }}>#{i + 1}</span>
                <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{g}</span>
                <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{p}</strong>
              </div>
            ))}
            <div style={{ height: 1, background: 'var(--border)' }} />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>Click any state to see detailed readiness data.</p>
          </>
        )}
      </aside>
    </div>
  );
}