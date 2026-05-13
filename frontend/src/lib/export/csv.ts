// Lightweight CSV builder — no extra deps. Excel/Sheets bisa langsung membuka.

export function toCsv(rows: (string | number | null | undefined | Date)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          if (cell == null) return "";
          const s = cell instanceof Date ? cell.toISOString() : String(cell);
          if (s.includes(",") || s.includes('"') || s.includes("\n")) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        })
        .join(","),
    )
    .join("\r\n");
}

export function csvResponse(filename: string, csv: string): Response {
  // BOM untuk kompatibilitas Excel Windows (locale ID)
  const body = "\ufeff" + csv;
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
