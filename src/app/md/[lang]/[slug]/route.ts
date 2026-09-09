import { getPost, getPostBody, getAllParams } from '@/lib/posts';
import { site, LANGS, type Lang } from '@/lib/site';

export const dynamic = 'force-static';

/**
 * The plain-markdown form of a post, reachable as `/{lang}/{slug}.md` through
 * the rewrite in `next.config.ts`. `llms.txt` links here.
 *
 * A model asked about one of these posts otherwise has to strip the reading
 * ruler, the navigation and the view counter out of the HTML before it reaches
 * a sentence. This hands over the same article with none of that.
 */
export function generateStaticParams() {
  return getAllParams();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string; slug: string }> },
) {
  const { lang, slug } = await params;
  if (!LANGS.includes(lang as Lang)) return new Response('Not found', { status: 404 });

  const post = getPost(slug, lang as Lang);
  const body = getPostBody(slug, lang as Lang);
  if (!post || !body) return new Response('Not found', { status: 404 });

  // A header the model can read as fact rather than inferring from layout.
  const header = [
    `# ${post.title}`,
    '',
    `> ${post.description}`,
    '',
    `- Author: ${site.author} (${site.authorKo})`,
    `- Published: ${post.date}`,
    `- Topic: ${post.topic}`,
    post.tags.length ? `- Tags: ${post.tags.join(', ')}` : null,
    `- Canonical: ${site.url}/${lang}/${slug}`,
    `- Source: ${site.title.en} — ${site.url}`,
    '',
    '---',
    '',
  ]
    .filter((line) => line !== null)
    .join('\n');

  return new Response(header + body + '\n', {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
