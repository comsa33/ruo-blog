import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { LANGS, type Lang } from './site';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'posts');

export type PostMeta = {
  slug: string;
  lang: Lang;
  title: string;
  description: string;
  /** What the post is about, in the reader's words. Shown above the title. */
  topic: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  tags: string[];
  draft: boolean;
  /** Estimated reading time in minutes. */
  readingTime: number;
  /** How the post opens: its first paragraphs as plain text, cut at ~240 chars. */
  excerpt: string;
};

/** Roughly what the index can show in three lines on a phone, with room to clamp. */
const EXCERPT_CHARS = 240;

/**
 * The body's prose lines, with the component blocks taken out and counted.
 * Component blocks carry data, not prose. They span many lines and contain
 * `>` inside arrow functions, so a tag regex cannot remove them — track the
 * block instead, from `<Capital` until the line that closes it.
 */
function proseOf(body: string): { lines: string[]; figures: number } {
  const lines = body.replace(/```[\s\S]*?```/g, '').split('\n');
  const prose: string[] = [];
  let depth = 0;
  let figures = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (depth === 0 && /^<[A-Z]/.test(trimmed)) {
      depth = 1;
      figures++;
      if (/\/>$/.test(trimmed)) depth = 0;
      continue;
    }
    if (depth > 0) {
      if (/^\/>$/.test(trimmed) || /^<\/[A-Z]/.test(trimmed)) depth = 0;
      continue;
    }
    prose.push(line);
  }
  return { lines: prose, figures };
}

/**
 * Korean prose is counted by character, English by word. Mixing the two in one
 * formula gives wildly wrong numbers for Korean posts, which are our default.
 */
function readingTime(body: string, lang: Lang): number {
  const { lines, figures } = proseOf(body);
  const text = lines
    .join('\n')
    .replace(/<[^>]+>/g, '')
    .trim();
  const reading =
    lang === 'ko' ? text.replace(/\s/g, '').length / 500 : text.split(/\s+/).length / 220;
  // An interactive figure is not free to read. Half a minute each is closer to
  // the truth than pretending the diagrams take no time at all.
  return Math.max(1, Math.round(reading + figures * 0.5));
}

/**
 * The opening of the post, for the index to show in place of the summary.
 * Paragraphs only — headings, lists, quotes, tables and anything a component
 * left behind are skipped — with the markdown taken off so it reads as the
 * sentence the reader will meet on the page.
 */
function excerptOf(body: string): string {
  const paragraphs: string[] = [];
  let current: string[] = [];
  const flush = () => {
    if (current.length) paragraphs.push(current.join(' '));
    current = [];
  };
  for (const raw of proseOf(body).lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    if (/^(#|[-*] |\d+\. |>|\||!\[|\{|import |export |---)/.test(line)) {
      flush();
      continue;
    }
    current.push(line);
  }
  flush();

  let out = '';
  for (const p of paragraphs) {
    const plain = p
      .replace(/<[^>]+>/g, '')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/(\*\*|__)(.+?)\1/g, '$2')
      .replace(/(\*|_)(.+?)\1/g, '$2')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
    if (!plain) continue;
    out = out ? `${out} ${plain}` : plain;
    if (out.length >= EXCERPT_CHARS) break;
  }
  if (out.length > EXCERPT_CHARS) {
    // Cut on a space, so no word is left half-written before the ellipsis.
    const cut = out.lastIndexOf(' ', EXCERPT_CHARS);
    out = `${out.slice(0, cut > EXCERPT_CHARS * 0.6 ? cut : EXCERPT_CHARS).trimEnd()}…`;
  }
  return out;
}

function readPost(slug: string, lang: Lang): PostMeta | null {
  const file = path.join(CONTENT_DIR, slug, `${lang}.mdx`);
  if (!fs.existsSync(file)) return null;

  const { data, content } = matter(fs.readFileSync(file, 'utf8'));
  if (!data.title || !data.date) {
    throw new Error(`[posts] ${slug}/${lang}.mdx is missing "title" or "date" in frontmatter.`);
  }

  return {
    slug,
    lang,
    title: String(data.title),
    description: String(data.description ?? ''),
    topic: String(data.topic ?? ''),
    // gray-matter parses unquoted YAML dates into Date objects.
    date: data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    draft: Boolean(data.draft),
    readingTime: readingTime(content, lang),
    excerpt: excerptOf(content),
  };
}

/** Every post for a language, newest first. Drafts are excluded in production. */
export function getPosts(lang: Lang): PostMeta[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  return fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => readPost(e.name, lang))
    .filter((p): p is PostMeta => p !== null)
    .filter((p) => !p.draft || process.env.NODE_ENV === 'development')
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Why a post is being offered at the end of another one. */
export type NeighbourKind = 'topic' | 'prev' | 'next';
export type Neighbour = { post: PostMeta; kind: NeighbourKind };

/**
 * What to read after this one.
 *
 * Chronological neighbours are a poor answer here: the posts are unrelated
 * engineering notes, so the one written a week earlier is usually about
 * something else entirely. The topic is the reader's own orientation — it is
 * printed above every title and is what the index searches — so the nearest
 * post either side *within the same topic* comes first, which also turns a
 * topic with several entries into a readable series.
 *
 * Only when that leaves a gap do the overall neighbours fill it, and the two
 * cases are labelled differently in the UI so the reason a post is being
 * offered is visible rather than implied.
 */
export function getNeighbours(slug: string, lang: Lang, limit = 2): Neighbour[] {
  const posts = getPosts(lang); // newest first
  const i = posts.findIndex((p) => p.slug === slug);
  if (i === -1) return [];
  const self = posts[i];

  const out: Neighbour[] = [];
  const taken = new Set([slug]);
  const push = (post: PostMeta | undefined, kind: NeighbourKind) => {
    if (!post || taken.has(post.slug) || out.length >= limit) return;
    taken.add(post.slug);
    out.push({ post, kind });
  };

  if (self.topic) {
    const sameTopic = posts.filter((p) => p.topic === self.topic);
    const j = sameTopic.findIndex((p) => p.slug === slug);
    // Nearest on each side, newer first — the order the index reads in.
    push(sameTopic[j - 1], 'topic');
    push(sameTopic[j + 1], 'topic');
  }

  // posts[i - 1] is newer, posts[i + 1] older.
  push(posts[i - 1], 'next');
  push(posts[i + 1], 'prev');

  return out;
}

export function getPost(slug: string, lang: Lang): PostMeta | null {
  return readPost(slug, lang);
}

/** Slugs that have a translation in every language, for generateStaticParams. */
export function getAllParams(): { lang: Lang; slug: string }[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const params: { lang: Lang; slug: string }[] = [];
  for (const lang of LANGS)
    for (const post of getPosts(lang)) params.push({ lang, slug: post.slug });
  return params;
}

/** Which languages a given post exists in — drives the language toggle. */
export function getAvailableLangs(slug: string): Lang[] {
  return LANGS.filter((lang) => fs.existsSync(path.join(CONTENT_DIR, slug, `${lang}.mdx`)));
}

/**
 * The post body as authored, with the frontmatter stripped. Served at
 * `/{lang}/{slug}.md` so an LLM can read a post without parsing the page
 * chrome. Component blocks are left in place on purpose — the `note` and
 * `verdict` strings inside them carry measurements that the prose does not
 * repeat, so removing them would hand over an incomplete post.
 */
export function getPostBody(slug: string, lang: Lang): string | null {
  const file = path.join(CONTENT_DIR, slug, `${lang}.mdx`);
  if (!fs.existsSync(file)) return null;
  return matter(fs.readFileSync(file, 'utf8')).content.trim();
}

export { formatDate } from './date';
