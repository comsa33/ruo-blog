import type { Lang } from './site';

/** Kept apart from posts.ts, which reads the filesystem, so client code can format dates. */
export function formatDate(date: string, lang: Lang): string {
  const d = new Date(`${date}T00:00:00Z`);
  return new Intl.DateTimeFormat(lang === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: lang === 'ko' ? 'long' : 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}
