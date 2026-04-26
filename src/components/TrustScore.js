import React from 'react';

export function getTrustColor(score) {
  if (score >= 80) return '#3DB87A';
  if (score >= 50) return '#F0A83A';
  return '#D95F5F';
}

export function getTrustLabel(score) {
  if (score >= 80) return 'VERIFIED';
  if (score >= 50) return 'PARTIAL';
  return 'CRITICAL';
}

export default function TrustScore({ score, size = 'md', showLabel = true }) {
  const color = getTrustColor(score);
  const label = getTrustLabel(score);

  const sizes = {
    sm: { ring: 52, stroke: 5, r: 20, fontSize: '14px', labelSize: '8px' },
    md: { ring: 72, stroke: 6, r: 28, fontSize: '18px', labelSize: '9px' },
    lg: { ring: 100, stroke: 7, r: 40, fontSize: '26px', labelSize: '10px' },
  };

  const s = sizes[size];
  const circumference = 2 * Math.PI * s.r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <svg width={s.ring} height={s.ring} viewBox={`0 0 ${s.ring} ${s.ring}`}>
        <circle
          cx={s.ring / 2} cy={s.ring / 2} r={s.r}
          fill="none" stroke="#E2EAF0" strokeWidth={s.stroke}
        />
        <circle
          cx={s.ring / 2} cy={s.ring / 2} r={s.r}
          fill="none" stroke={color} strokeWidth={s.stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${s.ring / 2} ${s.ring / 2})`}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text
          x="50%" y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize={s.fontSize}
          fontWeight="700"
          fontFamily="'Syne', sans-serif"
          fill={color}
        >
          {score}
        </text>
      </svg>
      {showLabel && (
        <span style={{
          color,
          fontSize: s.labelSize,
          fontFamily: "'Syne', sans-serif",
          fontWeight: '700',
          letterSpacing: '1px',
          textTransform: 'uppercase'
        }}>
          {label}
        </span>
      )}
    </div>
  );
}