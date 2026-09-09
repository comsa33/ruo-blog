export const site = {
  url: 'https://blog.po24lio.com',
  author: 'Ruo Lee',
  authorKo: '이루오',
  portfolio: 'https://po24lio.com',
  worldtrip: 'https://backpacking.po24lio.com',
  github: 'https://github.com/comsa33',
  email: 'comsa333@gmail.com',
  title: { ko: '이루오 — 기록', en: 'Ruo Lee — Notes' },
  description: {
    ko: 'AI 엔지니어의 설계 기록. 무엇을 만들었는지가 아니라, 왜 그렇게 정했는지.',
    en: 'Design notes from an AI engineer. Not what was built, but why it was decided that way.',
  },
} as const;

export const LANGS = ['ko', 'en'] as const;
export type Lang = (typeof LANGS)[number];

export const t = {
  contents: { ko: '목차', en: 'Contents' },
  backToIndex: { ko: '목록', en: 'Index' },
  minutes: { ko: '분', en: ' min' },
  empty: { ko: '아직 글이 없습니다.', en: 'Nothing here yet.' },
  copy: { ko: '복사', en: 'Copy' },
  nextSection: { ko: '다음 섹션', en: 'Next section' },
  backToTop: { ko: '맨 위로', en: 'Back to top' },
  copied: { ko: '복사됨', en: 'Copied' },
  search: { ko: '검색', en: 'Search' },
  found: { ko: '건', en: ' found' },
  noMatch: { ko: '일치하는 글이 없습니다.', en: 'Nothing matches.' },
  searchScope: {
    ko: '제목 · 요약 · 토픽 · 태그에서 찾음 · ↑↓ 이동 · esc 지우기',
    en: 'Title · summary · topic · tags · ↑↓ move · esc clear',
  },
  views: { ko: '회', en: ' views' },
  today: { ko: '오늘', en: 'today' },
  viewsBasis: {
    ko: 'KST 기준 · 오늘 00:00부터 · 한 사람 하루 1회',
    en: 'KST · since 00:00 today · one per person per day',
  },
} as const;
