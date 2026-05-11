// Pure-SVG bar chart — tidak butuh dep tambahan, ringan untuk free tier.
type Item = { label: string; value: number; color?: string };

export function StatBarChart({
  data,
  height = 220,
  emptyText = "Belum ada data.",
}: {
  data: Item[];
  height?: number;
  emptyText?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const padX = 36;
  const padBottom = 40;
  const padTop = 12;
  const barGap = 12;
  const innerH = height - padTop - padBottom;
  const width = Math.max(280, data.length * 84);
  const innerW = width - padX * 2;
  const barW = Math.max(28, innerW / data.length - barGap);
  const totalNonzero = data.some((d) => d.value > 0);

  if (!totalNonzero) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Statistik"
        className="block min-w-full"
      >
        {/* grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padTop + innerH - innerH * t;
          return (
            <g key={t}>
              <line
                x1={padX}
                x2={width - padX}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeOpacity={t === 0 ? 0.25 : 0.07}
                strokeDasharray={t === 0 ? "" : "3 3"}
              />
              <text
                x={padX - 6}
                y={y + 3}
                textAnchor="end"
                fontSize={10}
                fill="currentColor"
                fillOpacity={0.6}
              >
                {Math.round(max * t)}
              </text>
            </g>
          );
        })}
        {/* bars */}
        {data.map((d, i) => {
          const h = (d.value / max) * innerH;
          const x = padX + i * (barW + barGap) + barGap / 2;
          const y = padTop + innerH - h;
          return (
            <g key={d.label}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={6}
                fill={d.color ?? "currentColor"}
                fillOpacity={0.9}
              />
              <text
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize={11}
                fontWeight={500}
                fill="currentColor"
              >
                {d.value.toLocaleString("id-ID")}
              </text>
              <text
                x={x + barW / 2}
                y={padTop + innerH + 18}
                textAnchor="middle"
                fontSize={10}
                fill="currentColor"
                fillOpacity={0.7}
              >
                {d.label.length > 14 ? d.label.slice(0, 13) + "…" : d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
