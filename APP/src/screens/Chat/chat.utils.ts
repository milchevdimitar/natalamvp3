export function formatStoryAge(isoString?: string): string {
  if (!isoString) return 'скоро';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'преди малко';
    return `преди ${hours}ч`;
  } catch {
    return isoString;
  }
}

export function getCurrentTimeFormatted(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;
}