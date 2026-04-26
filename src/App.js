import React, { useState } from 'react';
import FacilitySearch from './pages/FacilitySearch';
import HealthHeatmap from './pages/HealthHeatmap';
import './App.css';

function ComingSoon({ title, emoji }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '70vh', gap: 16,
    }}>
      <div style={{ fontSize: 48 }}>{emoji}</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Building now — coming next</p>
    </div>
  );
}

const navItems = [
  { id: 'search', label: 'Facility Search', emoji: '🔍' },
  { id: 'map', label: 'Health Heatmap', emoji: '🗺️' },
  { id: 'ngo', label: 'NGO Dashboard', emoji: '📊' },
  { id: 'chat', label: 'Patient Navigator', emoji: '🗣️' },
  { id: 'supplier', label: 'Supplier Connect', emoji: '🔗' },
  { id: 'collab', label: 'Care Clusters', emoji: '🤝' },
];

function LandingPage({ onEnter }) {
  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', fontFamily: 'var(--font-body)' }}>

      {/* HERO */}
      <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
        <img
          src="/healthcare.jpg"
          alt="Healthcare in India"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(10,25,40,0.92) 0%, rgba(10,25,40,0.75) 50%, rgba(10,25,40,0.3) 100%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(10,25,40,0.6) 0%, transparent 50%)',
        }} />

        {/* Nav */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 52px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38,
              background: 'rgba(45,156,156,0.3)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(45,156,156,0.5)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>🏥</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>CareMap India</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', letterSpacing: '2px', textTransform: 'uppercase' }}>Healthcare Readiness Network</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{
              background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '9px 22px',
              color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>Sign In</button>
            <button onClick={onEnter} style={{
              background: '#2D9C9C', border: 'none', borderRadius: 8, padding: '9px 22px',
              color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
              boxShadow: '0 4px 16px rgba(45,156,156,0.5)',
            }}>Get Started →</button>
          </div>
        </div>

        {/* Hero content */}
        <div style={{
          position: 'absolute', top: '50%', transform: 'translateY(-50%)',
          left: 0, right: 0, padding: '0 52px', maxWidth: 680, zIndex: 5,
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(45,156,156,0.18)', border: '1px solid rgba(45,156,156,0.4)',
            borderRadius: 100, padding: '6px 16px', marginBottom: 24,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4FD1C5', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>Live · AI-powered · 10,247 facilities indexed</span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 800,
            color: 'white', lineHeight: 1.08, letterSpacing: '-2px', marginBottom: 20,
          }}>
            Find the right care.<br />
            <span style={{ color: '#4FD1C5' }}>Verify the capability.</span><br />
            Close the gap.
          </h1>

          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, marginBottom: 36, maxWidth: 500 }}>
            India doesn't just have a hospital discovery problem — it has a healthcare readiness crisis.
            CareMap helps patients, NGOs, and decision-makers find care that actually exists.
          </p>

          <div style={{ display: 'flex', gap: 14, marginBottom: 52 }}>
            <button onClick={onEnter} style={{
              background: '#2D9C9C', border: 'none', borderRadius: 10,
              padding: '15px 30px', color: 'white',
              fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 8px 28px rgba(45,156,156,0.45)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>🔍 Search Facilities</button>
            <button onClick={onEnter} style={{
              background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
              border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 10, padding: '15px 30px',
              color: 'white', fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            }}>🗺️ Explore Readiness Map</button>
          </div>

          <div style={{ display: 'flex', gap: 40 }}>
            {[
              { value: '10,247', label: 'Facilities Analyzed' },
              { value: '38%', label: 'Fully Verified' },
              { value: '312M', label: 'People in Care Deserts' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: 'white', letterSpacing: '-1px' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase',
        }}>
          <span>Scroll to explore</span>
          <div style={{ fontSize: 18 }}>↓</div>
        </div>
      </div>

      {/* BELOW FOLD */}
      <div style={{ background: '#FAFAF8', padding: '60px 52px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7A9BB5', marginBottom: 8 }}>
          Who uses CareMap India
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#102A43', letterSpacing: '-0.8px', marginBottom: 32 }}>
          Built for four stakeholders, one mission
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            {
              emoji: '👤', title: 'Patients & Families',
              color: '#2D9C9C', bg: '#F0FAFA', border: '#C8EEEE',
              story: "Riya's father needs emergency surgery in rural Bihar. CareMap tells her which nearby hospital is actually equipped — before she drives 3 hours.",
              cta: 'Find verified care near you',
            },
            {
              emoji: '🏢', title: 'NGOs & Health Orgs',
              color: '#4F9F73', bg: '#F2F9F5', border: '#C4E4D2',
              story: "An NGO planning intervention in UP can see exactly which districts need one anesthesiologist to unlock 5 surgery-ready centers for 400,000 people.",
              cta: 'Plan high-impact interventions',
            },
            {
              emoji: '🏥', title: 'Hospitals & Clinics',
              color: '#5B8DD9', bg: '#F2F6FC', border: '#C4D8F0',
              story: "A district hospital in Jharkhand discovers it's 8 Trust Score points from full verification — and which specific gap is holding it back.",
              cta: 'Understand your readiness',
            },
            {
              emoji: '🚚', title: 'Equipment Suppliers',
              color: '#E6A23C', bg: '#FEF9F0', border: '#F5DFB0',
              story: "A medical equipment company sees 47 facilities in Bihar urgently need oxygen concentrators — with contact info and population impact estimates.",
              cta: "Find where you're needed",
            },
          ].map((s, i) => (
            <div key={i} onClick={onEnter} style={{
              background: s.bg, border: `1.5px solid ${s.border}`,
              borderRadius: 16, padding: '24px 20px', cursor: 'pointer',
              transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', gap: 14,
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.09)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{
                width: 46, height: 46, borderRadius: 12, background: 'white',
                border: `1.5px solid ${s.border}`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 22, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}>{s.emoji}</div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#102A43', marginBottom: 10 }}>{s.title}</div>
                <p style={{ fontSize: 13, color: '#5A7A94', lineHeight: 1.65, fontStyle: 'italic' }}>"{s.story}"</p>
              </div>
              <div style={{ marginTop: 'auto', fontSize: 12.5, fontWeight: 600, color: s.color }}>{s.cta} →</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 52, paddingTop: 24, borderTop: '1px solid #E8EDF2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 12, color: '#A0B4C4' }}>© 2026 CareMap India · Databricks Healthcare Challenge · MIT Hackathon</div>
          <div style={{ display: 'flex', gap: 28 }}>
            {['About', 'Methodology', 'Data Sources', 'Contact'].map((l, i) => (
              <span key={i} style={{ fontSize: 12, color: '#A0B4C4', cursor: 'pointer' }}
                onMouseEnter={e => e.target.style.color = '#2D9C9C'}
                onMouseLeave={e => e.target.style.color = '#A0B4C4'}
              >{l}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AppShell({ children, activePage, setActivePage }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <header style={{
        background: '#0D2137',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 20px rgba(0,0,0,0.25)',
      }}>

        {/* Top row — logo + controls */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 36px', height: 60,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, background: '#2D9C9C',
              borderRadius: 9, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 17,
              boxShadow: '0 4px 12px rgba(45,156,156,0.4)',
            }}>🏥</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'white', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                CareMap India
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '1.8px', textTransform: 'uppercase' }}>
                Healthcare Readiness Network
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, opacity: 0.4 }}>🔍</span>
              <input placeholder="Search facilities, districts..." style={{
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '8px 16px 8px 34px',
                color: 'white', fontFamily: 'var(--font-body)', fontSize: 12.5, width: 240, outline: 'none',
              }} />
            </div>
            <div style={{
              width: 36, height: 36, background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative', fontSize: 15,
            }}>
              🔔
              <div style={{
                position: 'absolute', top: 7, right: 7, width: 7, height: 7,
                borderRadius: '50%', background: '#D96C6C', border: '1.5px solid #0D2137',
              }} />
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', background: '#2D9C9C',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
              color: 'white', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(45,156,156,0.4)',
            }}>S</div>
          </div>
        </div>

        {/* Nav tabs row */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '0 36px', height: 52,
        }}>
          {navItems.map(item => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '0 20px', height: '100%',
                  border: 'none',
                  background: isActive ? 'rgba(45,156,156,0.12)' : 'transparent',
                  color: isActive ? '#4FD1C5' : 'rgba(255,255,255,0.5)',
                  fontFamily: 'var(--font-display)',
                  fontSize: 14, fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  borderBottom: isActive ? '3px solid #2D9C9C' : '3px solid transparent',
                  transition: 'all 0.15s ease',
                  letterSpacing: '-0.1px',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: 16 }}>{item.emoji}</span>
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Live indicator */}
          <div style={{
            marginLeft: 'auto',
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(79,159,115,0.1)',
            border: '1px solid rgba(79,159,115,0.2)',
            borderRadius: 100, padding: '5px 14px',
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4F9F73', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>10,247 facilities indexed</span>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState('search');
  const [showLanding, setShowLanding] = useState(true);

  const pages = {
    search: <FacilitySearch />,
    map: <HealthHeatmap />,
    ngo: <ComingSoon title="NGO Dashboard" emoji="📊" />,
    chat: <ComingSoon title="Patient Navigator" emoji="🗣️" />,
    supplier: <ComingSoon title="Supplier Connect" emoji="🔗" />,
    collab: <ComingSoon title="Care Clusters" emoji="🤝" />,
  };

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  return (
    <AppShell activePage={activePage} setActivePage={setActivePage}>
      {pages[activePage]}
    </AppShell>
  );
}