import { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://emate-ai.runs-on.dev';

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
