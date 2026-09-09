import type { MetadataRoute } from 'next';
import { listPublishedPosts } from '@/lib/posts-repository';
import { siteConfig } from '@/data/site';

export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  // 基础静态路由
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/about',
    '/build-log',
    '/chat',
    '/experiments',
    '/news',
    '/projects',
    '/prompts',
    '/stack',
    '/privacy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  // 构建日志动态路由
  const buildLogRoutes: MetadataRoute.Sitemap = (await listPublishedPosts('build-log')).map((entry) => ({
    url: `${baseUrl}/build-log/${entry.slug}`,
    lastModified: entry.updatedAt || entry.publishedAt,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // 实验动态路由
  const experimentRoutes: MetadataRoute.Sitemap = (await listPublishedPosts('experiments')).map((entry) => ({
    url: `${baseUrl}/experiments/${entry.slug}`,
    lastModified: entry.updatedAt || entry.publishedAt,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // 项目动态路由
  const projectRoutes: MetadataRoute.Sitemap = (await listPublishedPosts('projects')).map((entry) => ({
    url: `${baseUrl}/projects/${entry.slug}`,
    lastModified: entry.updatedAt || entry.publishedAt,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // 资讯动态路由
  const newsRoutes: MetadataRoute.Sitemap = (await listPublishedPosts('news')).map((entry) => ({
    url: `${baseUrl}/news/${entry.slug}`,
    lastModified: entry.updatedAt || entry.publishedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...buildLogRoutes,
    ...experimentRoutes,
    ...projectRoutes,
    ...newsRoutes,
  ];
}
