export const site = {
  url: 'https://blog.po24lio.com',
  author: 'Ruo Lee',
  authorKo: '이루오',
  portfolio: 'https://po24lio.com',
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

export const POST_TYPES = ['note', 'log'] as const;
export type PostType = (typeof POST_TYPES)[number];

export const t = {
  note: { ko: '해설', en: 'Note' },
  log: { ko: '기록', en: 'Log' },
  notesHeading: { ko: '해설', en: 'Notes' },
  logHeading: { ko: '기록', en: 'Log' },
  contents: { ko: '목차', en: 'Contents' },
  backToIndex: { ko: '목록', en: 'Index' },
  minutes: { ko: '분', en: ' min' },
  empty: { ko: '아직 글이 없습니다.', en: 'Nothing here yet.' },
  copy: { ko: '복사', en: 'Copy' },
  nextSection: { ko: '다음 섹션', en: 'Next section' },
  backToTop: { ko: '맨 위로', en: 'Back to top' },
  copied: { ko: '복사됨', en: 'Copied' },
} as const;
