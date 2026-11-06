import type { MetadataRoute } from 'next';
import { siteConfig } from '@/data/site';

/**
 * robots.txt
 * - 仅屏蔽接口路由（/api/ 与全站 /api-* 前缀），不浪费抓取预算，也避免接口响应被收录。
 * - 不屏蔽 /_next/ 静态资源：搜索引擎需要 JS/CSS 才能正确渲染页面。
 * - 不屏蔽 /market、/dev/*：这些页面已通过 meta robots noindex 控制；若在此禁止抓取，
 *   爬虫反而读不到 noindex，可能出现“无描述的收录结果”。
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url.replace(/\/+$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/api-'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
