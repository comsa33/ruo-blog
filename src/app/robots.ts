import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

export const dynamic = 'force-static';

/**
 * Everything here is public, so the interesting part is not what is blocked
 * but naming the AI crawlers explicitly. A bare `User-Agent: *` already allows
 * them; listing them states the intent and keeps the decision visible if it
 * ever needs revisiting.
 *
 * The roles differ and are worth keeping straight: GPTBot is OpenAI's training
 * crawler while OAI-SearchBot serves ChatGPT search, and Google-Extended covers
 * Google's non-Search uses while Googlebot covers AI features inside Search.
 */
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'meta-externalagent',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: AI_CRAWLERS, allow: '/' },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
