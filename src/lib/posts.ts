import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { LANGS, type Lang } from './site';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'posts');

/** The explanatory engines (src/components/diagram). Order is irrelevant. */
export const FIGURES = [
  'Sequence',
  'Structure',
  'Breakdown',
  'Series',
  'Transform',
  'Threshold',
  'Playground',
] as const;
export type FigureKind = (typeof FIGURES)[number];

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
  /** The first diagram in the body, or null for a post that has none. */
  figure: FigureKind | null;
};

/**
 * The first explanatory engine in the body. The index previews it on hover,
 * so a reader sees what kind of figure a post explains itself with. Derived,
 * never authored — nothing in the frontmatter has to be kept in step.
 */
function firstFigure(body: string): FigureKind | null {
  const m = new RegExp(`^\\s*<(${FIGURES.join('|')})\\b`, 'm').exec(body);
  return m ? (m[1] as FigureKind) : null;
}

/**
 * Korean prose is counted by character, English by word. Mixing the two in one
 * formula gives wildly wrong numbers for Korean posts, which are our default.
 */
function readingTime(body: string, lang: Lang): number {
  // Component blocks carry data, not prose. They span many lines and contain
  // `>` inside arrow functions, so a tag regex cannot remove them — track the
  // block instead, from `<Capital` until the line that closes it.
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

  const text = prose
    .join('\n')
    .replace(/<[^>]+>/g, '')
    .trim();
  const reading =
    lang === 'ko' ? text.replace(/\s/g, '').length / 500 : text.split(/\s+/).length / 220;
  // An interactive figure is not free to read. Half a minute each is closer to
  // the truth than pretending the diagrams take no time at all.
  return Math.max(1, Math.round(reading + figures * 0.5));
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
    figure: firstFigure(content),
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
