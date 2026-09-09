import createMDX from '@next/mdx';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'mdx'],
  // The views route checks that a slug is a real post by looking at the
  // content directory at request time, so it must ship with the function.
  outputFileTracingIncludes: { '/api/views/[slug]': ['./content/posts/**'] },
  /**
   * `llms.txt` links posts as `/{lang}/{slug}.md`, which is the convention
   * models expect. A route segment cannot carry the extension, so the handler
   * lives at /md/... and the conventional URL rewrites onto it.
   */
  async rewrites() {
    return [{ source: '/:lang(ko|en)/:slug.md', destination: '/md/:lang/:slug' }];
  },
};

/**
 * Turbopack requires loader options to be serialisable, so MDX plugins are
 * named as strings rather than imported. Importing them breaks `next build`.
 */
const withMDX = createMDX({
  options: {
    remarkPlugins: [['remark-frontmatter'], ['remark-gfm']],
    rehypePlugins: [
      ['rehype-slug'],
      [
        'rehype-pretty-code',
        {
          // One theme per colour scheme; CSS decides which one is visible.
          theme: { light: 'github-light', dark: 'github-dark' },
          defaultLang: 'text',
          keepBackground: false,
        },
      ],
    ],
  },
});

export default withMDX(nextConfig);
