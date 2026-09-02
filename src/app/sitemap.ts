import type { MetadataRoute } from 'next';
import { getBuildLogs, getExperimentEntries, getProjects, getNews } from '@/lib/content';
import { siteConfig } from '@/data/site';

export default function sitemap(): MetadataRoute.Sitemap {
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
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  // 构建日志动态路由
  const buildLogRoutes: MetadataRoute.Sitemap = getBuildLogs().map((entry) => ({
    url: `${baseUrl}/build-log/${entry.slug}`,
    lastModified: new Date(entry.date || Date.now()),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // 实验动态路由
  const experimentRoutes: MetadataRoute.Sitemap = getExperimentEntries().map((entry) => ({
    url: `${baseUrl}/experiments/${entry.slug}`,
    lastModified: new Date(entry.date || Date.now()),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // 项目动态路由
  const projectRoutes: MetadataRoute.Sitemap = getProjects().map((entry) => ({
    url: `${baseUrl}/projects/${entry.slug}`,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // 资讯动态路由
  const newsRoutes: MetadataRoute.Sitemap = getNews().map((entry) => ({
    url: `${baseUrl}/news/${entry.slug}`,
    lastModified: new Date(entry.date || Date.now()),
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
