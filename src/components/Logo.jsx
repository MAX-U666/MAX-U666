import React from 'react';

export const GMVLogo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF6B35" />
        <stop offset="50%" stopColor="#F7931E" />
        <stop offset="100%" stopColor="#FFB347" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect width="48" height="48" rx="12" fill="url(#logoGrad)"/>
    <g filter="url(#glow)">
      <path d="M12 32 Q18 28, 24 24 Q30 20, 36 14" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9"/>
      <path d="M12 36 Q20 30, 28 26 Q34 23, 38 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6"/>
      <circle cx="36" cy="14" r="3" fill="white"/>
    </g>
  </svg>
);

export const MiniLogo = ({ size = 24, color = "#FF6B35" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 16 Q8 13, 12 11 Q16 9, 20 6" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <circle cx="20" cy="6" r="2" fill={color}/>
  </svg>
);
