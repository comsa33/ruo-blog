import type { MetadataRoute } from 'next';
import { getPosts } from '@/lib/posts';
import { site, LANGS } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = LANGS.map((lang) => ({
    url: `${site.url}/${lang}`,
    changeFrequency: 'weekly',
    priority: 1,
  }));

  for (const lang of LANGS) {
    for (const post of getPosts(lang)) {
      entries.push({
        url: `${site.url}/${lang}/${post.slug}`,
        lastModified: post.date,
        changeFrequency: 'monthly',
        priority: 0.8,
      });
    }
  }
  return entries;
}
