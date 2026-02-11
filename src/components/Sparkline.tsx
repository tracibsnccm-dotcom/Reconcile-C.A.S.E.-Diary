interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({ values, width = 120, height = 24, color = "currentColor" }: SparklineProps) {
  if (!values.length) return null;

  const max = Math.max(...values, 10);
  const points = values
    .map((v, i) => `${(i / (values.length - 1 || 1)) * 100},${100 - (v / max) * 100}`)
    .join(" ");

  return (
    <svg width={width} height={height} viewBox="0 0 100 100" aria-label="trend sparkline" className="inline-block">
      <polyline fill="none" stroke={color} strokeWidth="5" points={points} />
    </svg>
  );
}
