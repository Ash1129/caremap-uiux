import React from 'react';
import { Search, Bell, Globe, ChevronDown } from 'lucide-react';

const pageLabels = {
  chat: 'Patient Navigator',
  search: 'Facility Search',
  map: 'Health Heatmap',
  ngo: 'NGO Dashboard',
  supplier: 'Supplier Connector',
  collab: 'Care Clusters',
};

export default function TopBar({ activePage }) {
  return (
    <header style={{
      height: 'var(--topbar-height)',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '0 24px',
      position: 'sticky', top: 0, zIndex: 50,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: 14, fontWeight: 600,
        color: 'var(--text-primary)',
        flexShrink: 0,
      }}>
        {pageLabels[activePage]}
      </span>

      <div style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
        <Search size={14} style={{
          position: 'absolute', left: 12,
          top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-muted)',
        }} />
        <input
          type="text"
          placeholder="Search any facility, district, or condition..."
          style={{
            width: '100%',
            padding: '8px 14px 8px 36px',
            border: '1.5px solid var(--border)',
            borderRadius: 8,
            fontFamily: 'var(--font-body)', fontSize: 13,
            color: 'var(--text-primary)',
            background: 'var(--bg-primary)',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '6px 10px',
          border: '1.5px solid var(--border)',
          borderRadius: 7, background: 'white',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-body)', fontSize: 12,
          cursor: 'pointer',
        }}>
          <Globe size={15} />
          <span>EN</span>
          <ChevronDown size={12} />
        </button>

        <button style={{
          position: 'relative',
          padding: '6px 8px',
          border: '1.5px solid var(--border)',
          borderRadius: 7, background: 'white',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center',
        }}>
          <Bell size={15} color="var(--text-secondary)" />
          <div style={{
            position: 'absolute', top: 5, right: 5,
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--critical)',
            border: '1.5px solid white',
          }} />
        </button>

        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--brand-blue)',
          color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 600,
          fontFamily: 'var(--font-display)',
          cursor: 'pointer',
        }}>
          S
        </div>
      </div>
    </header>
  );
}