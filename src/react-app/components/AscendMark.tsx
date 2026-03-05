// AscendMark.tsx — the vertical lens icon
// Props: size (number, default 44), variant ('color' | 'white')

interface AscendMarkProps {
  size?: number;
  variant?: 'color' | 'white';
}

export function AscendMark({ size = 44, variant = 'color' }: AscendMarkProps) {
  const h = Math.round(size * 54 / 44);
  const gradId = `ag_${size}`;
  const clipId = `lc_${size}`;

  if (variant === 'white') {
    return (
      <svg width={size} height={h} viewBox="0 0 44 54" fill="none">
        <clipPath id={clipId}>
          <path d="M22,1 C7,1 5,27 22,53 C39,27 37,1 22,1 Z"/>
        </clipPath>
        <path d="M22,1 C7,1 5,27 22,53 C39,27 37,1 22,1 Z"
              fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.8"/>
        <g clipPath={`url(#${clipId})`}>
          <rect x="8" y="40" width="6" height="13" rx="1.5" fill="white" opacity="0.35"/>
          <rect x="18" y="30" width="6" height="23" rx="1.5" fill="white" opacity="0.65"/>
          <rect x="28" y="20" width="6" height="33" rx="1.5" fill="white"/>
        </g>
        <polyline points="22,5 22,16" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
        <polyline points="17,12 22,5 27,12" fill="none" stroke="white"
                  strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }

  return (
    <svg width={size} height={h} viewBox="0 0 44 54" fill="none">
      <defs>
        <linearGradient id={gradId} x1="22" y1="54" x2="22" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F6B3D"/>
          <stop offset="100%" stopColor="#22C76A"/>
        </linearGradient>
        <clipPath id={clipId}>
          <path d="M22,1 C7,1 5,27 22,53 C39,27 37,1 22,1 Z"/>
        </clipPath>
      </defs>
      <path d="M22,1 C7,1 5,27 22,53 C39,27 37,1 22,1 Z"
            fill="none" stroke={`url(#${gradId})`} strokeWidth="1.8"/>
      <g clipPath={`url(#${clipId})`}>
        <rect x="8" y="40" width="6" height="13" rx="1.5" fill={`url(#${gradId})`} opacity="0.4"/>
        <rect x="18" y="30" width="6" height="23" rx="1.5" fill={`url(#${gradId})`} opacity="0.7"/>
        <rect x="28" y="20" width="6" height="33" rx="1.5" fill={`url(#${gradId})`}/>
      </g>
      <polyline points="22,5 22,16" stroke={`url(#${gradId})`} strokeWidth="1.8" strokeLinecap="round"/>
      <polyline points="17,12 22,5 27,12" fill="none" stroke={`url(#${gradId})`}
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
