export function getAgeInMonths(dateString: string): number {
  const past = new Date(dateString);
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - past.getTime());
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return Math.floor(diffDays / 30.4375);
}

export function formatAgeLabel(dateString: string): string {
  const months = getAgeInMonths(dateString);
  if (months === 0) return 'Recent (this month)';
  if (months === 1) return '1 month dead';
  if (months < 12) return `${months} months dead`;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (remMonths === 0) return `${years} yr${years > 1 ? 's' : ''} dead`;
  return `${years}y ${remMonths}m dead`;
}

export function formatRelativeTime(isoString: string): string {
  const past = new Date(isoString);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
