import { getPosts } from '@/lib/posts';
import { site, LANGS } from '@/lib/site';

export const dynamic = 'force-static';

/**
 * https://llmstxt.org — a curated markdown index for language models, sitting
 * alongside robots.txt (what may be crawled) and sitemap.xml (every URL).
 *
 * Each entry points at the `.md` form of the post rather than the page, so a
 * model reading this never has to parse the article shell. The convention is
 * to append `.md` to the canonical URL, which `next.config.ts` rewrites onto
 * the route handler.
 *
 * This is an emerging proposal, not a standard, and no major provider has
 * committed to consuming it. It costs one generated file, so it is here; the
 * structured data in the pages themselves is what actually carries weight.
 */
export function GET() {
  const lines: string[] = [];

  lines.push(`# ${site.title.en}`);
  lines.push('');
  lines.push(`> ${site.description.en}`);
  lines.push('');
  lines.push(
    `Engineering notes by ${site.author} (${site.authorKo}), an AI engineer. Every post is a decision record: a problem that was measured, the options that were weighed, what was chosen, and what is still unsolved. Numbers come from production systems the author built or operates. Each post exists in Korean and English at the same slug — \`/ko/<slug>\` and \`/en/<slug>\`.`,
  );
  lines.push('');

  for (const lang of LANGS) {
    const posts = getPosts(lang);
    if (!posts.length) continue;

    lines.push(`## Posts (${lang === 'ko' ? 'Korean' : 'English'})`);
    lines.push('');
    for (const post of posts) {
      const meta = [post.topic, post.date].filter(Boolean).join(' · ');
      lines.push(
        `- [${post.title}](${site.url}/${lang}/${post.slug}.md): ${post.description} (${meta})`,
      );
    }
    lines.push('');
  }

  lines.push('## Optional');
  lines.push('');
  lines.push(`- [Index, Korean](${site.url}/ko): all posts, newest first`);
  lines.push(`- [Index, English](${site.url}/en): all posts, newest first`);
  lines.push(`- [Portfolio](${site.portfolio}): the author's work and background`);
  lines.push(`- [RSS](${site.url}/rss.xml): feed of recent posts`);
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
