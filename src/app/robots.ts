import { MetadataRoute } from 'next';

const CANONICAL_URL = 'https://emate.live';
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || CANONICAL_URL).replace(/\/+$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/callback',
          '/admin/',
          '/private/',
          '/invite/',
          '/ai-topper-chat',
        ],
      },
      {
        userAgent: [
          'Googlebot',
          'Google-Extended',
          'OAI-SearchBot',
          'GPTBot',
          'ChatGPT-User',
          'PerplexityBot',
          'ClaudeBot',
          'Applebot',
          'Applebot-Extended',
        ],
        allow: '/',
        disallow: [
          '/api/',
          '/auth/callback',
          '/admin/',
          '/private/',
          '/invite/',
          '/ai-topper-chat',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
