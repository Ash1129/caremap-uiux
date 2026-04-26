import React from 'react';
import { MessageSquare, Search, Map, BarChart2, Link, Users, Activity } from 'lucide-react';

const navItems = [
  { id: 'chat', icon: MessageSquare, label: 'Patient Navigator' },
  { id: 'search', icon: Search, label: 'Facility Search' },
  { id: 'map', icon: Map, label: 'Health Heatmap' },
  { id: 'ngo', icon: BarChart2, label: 'NGO Dashboard' },
  { id: 'supplier', icon: Link, label: 'Supplier Connect' },
  { id: 'collab', icon: Users, label: 'Care Clusters' },
];

const stakeholders = [
  { id: 'patient', label: '👤 Patient' },
  { id: 'ngo', label: '🏢 NGO' },
  { id: 'hospital', label: '🏥 Hospital' },
  { id: 'supplier', label: '🚚 Supplier' },
];

export default function Sidebar({ activePage, setActivePage, stakeholder, setStakeholder }) {
  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, bottom: 0,
      width: 'var(--sidebar-width)',
      background: 'var(--bg-sidebar)',
      display: 'flex', flexDirection: 'column',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '20px 18px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{
          width: 32, height: 32,
          background: 'var(--brand-blue)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', flexShrink: 0,
        }}>
          <Activity size={18} strokeWidth={2.5} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 15,
            fontWeight: 700, color: 'white', letterSpacing: '-0.3px',
          }}>CareMap</span>
          <span style={{
            fontSize: 10, fontWeight: 500,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '1.5px', textTransform: 'uppercase',
          }}>India</span>
        </div>
      </div>

      {/* Nav label */}
      <div style={{
        fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.25)',
        letterSpacing: '1.2px', textTransform: 'uppercase',
        padding: '16px 18px 6px',
      }}>Navigation</div>

      {/* Nav items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 10px' }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button key={item.id} onClick={() => setActivePage(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 8, border: 'none',
              background: isActive ? 'rgba(47,127,237,0.2)' : 'transparent',
              color: isActive ? '#6AADFF' : 'rgba(255,255,255,0.5)',
              fontFamily: 'var(--font-body)', fontSize: 13,
              cursor: 'pointer', textAlign: 'left', width: '100%',
              transition: 'all 0.15s ease',
            }}>
              <Icon size={16} strokeWidth={1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '12px 18px' }} />

      {/* Stakeholder label */}
      <div style={{
        fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.25)',
        letterSpacing: '1.2px', textTransform: 'uppercase',
        padding: '0 18px 6px',
      }}>Stakeholder View</div>

      {/* Stakeholder selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 10px' }}>
        {stakeholders.map(s => (
          <button key={s.id} onClick={() => setStakeholder(s.id)} style={{
            padding: '7px 10px', borderRadius: 6, border: 'none',
            background: stakeholder === s.id ? 'rgba(43,179,163,0.15)' : 'transparent',
            color: stakeholder === s.id ? '#5DDDD0' : 'rgba(255,255,255,0.4)',
            fontFamily: 'var(--font-body)', fontSize: 12,
            cursor: 'pointer', textAlign: 'left',
            transition: 'all 0.15s ease',
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 'auto', padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 8,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        fontSize: 11, color: 'rgba(255,255,255,0.25)',
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--verified)',
          boxShadow: '0 0 0 2px rgba(61,184,122,0.3)',
          animation: 'pulse 2s infinite', flexShrink: 0,
        }} />
        <span>10,247 facilities indexed</span>
      </div>
    </aside>
  );
}