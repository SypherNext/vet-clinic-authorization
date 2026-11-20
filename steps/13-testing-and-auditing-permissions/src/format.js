// Small helpers that turn values into words for pages.

// 1800000 -> "30 minutes", 86400000 -> "24 hours"
export function formatDuration(ms) {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60 || minutes % 60 !== 0) return plural(minutes, 'minute');
  return plural(minutes / 60, 'hour');
}

// 1762333200000 -> "2026-11-05 09:00" in the server's local time zone
export function formatTime(ms) {
  const date = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// plural(1, 'pet') -> "1 pet", plural(3, 'pet') -> "3 pets"
export function plural(count, word, pluralWord = `${word}s`) {
  return `${count} ${count === 1 ? word : pluralWord}`;
}
