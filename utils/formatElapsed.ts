/**
 * Format elapsed time between two dates (or date and now) as human-readable string.
 *
 * Examples:
 *   "30 sec"
 *   "1:21 min"
 *   "3:10:30 hours"
 */
export function formatElapsed(
  startIso: string | undefined,
  endIso: string | undefined,
  now?: Date
): string {
  if (!startIso) return '';
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : (now ?? new Date()).getTime();
  const totalSec = Math.max(0, Math.floor((end - start) / 1000));

  if (totalSec < 60) {
    return `${totalSec} sec`;
  }

  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} hours`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')} min`;
}

/**
 * Format a Date as HH:MM:SS (24-hour).
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}
