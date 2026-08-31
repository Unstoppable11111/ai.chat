import type { MetadataRoute } from 'next';
import { siteConfig } from '@/data/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/api-chat-backend/'],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}