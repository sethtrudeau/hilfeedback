/** SQLite datetime('now') values are UTC without a zone marker. */
export function formatTime(sqlite: string): string {
  return new Date(`${sqlite.replace(" ", "T")}Z`).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
