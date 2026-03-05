// CoheronMark.tsx — the Coheron wordmark/logo

interface CoheronMarkProps {
  width?: number;
  fill?: string;
  accentFill?: string;
}

export function CoheronMark({ width = 96, fill = "#0A0A0A", accentFill = "#1A7A4A" }: CoheronMarkProps) {
  const height = Math.round(width * 16 / 96);
  
  return (
    <svg width={width} height={height} viewBox="0 0 96 16" fill="none" overflow="visible">
      <text
        x="0"
        y="12"
        fontFamily="'ZalandoSans', sans-serif"
        fontSize="12"
        fontWeight="400"
        letterSpacing="0.5"
        fill={fill}
      >
        by <tspan fill={accentFill}>Coheron</tspan>
      </text>
    </svg>
  );
}
