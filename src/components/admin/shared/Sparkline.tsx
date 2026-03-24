"use client";

interface DataPoint {
  date: string;
  count: number;
}

interface Props {
  data: DataPoint[];
  color?: string;
  height?: number;
}

export default function Sparkline({ data, color = "#6366f1", height = 40 }: Props) {
  if (!data || data.length === 0) return null;

  const values = data.map((d) => d.count);
  const max = Math.max(...values, 1);
  const width = 200;
  const pad = 2;

  const points = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (width - pad * 2);
      const y = pad + (1 - v / max) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height }}
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Fill under the line */}
      <polygon
        points={`${pad},${height} ${points} ${width - pad},${height}`}
        fill={color}
        fillOpacity="0.1"
      />
    </svg>
  );
}
