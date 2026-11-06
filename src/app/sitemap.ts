import type { MetadataRoute } from 'next';
import { listPublishedPosts, type PublishedPost } from '@/lib/posts-repository';
import { siteConfig } from '@/data/site';

// 保持动态生成：避免构建期依赖数据库；listPublishedPosts 自带 30s 进程级缓存，请求开销很小
export const dynamic = 'force-dynamic';

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

/** 文章集合 → 站点路由前缀及抓取策略 */
const COLLECTIONS: Record<string, { changeFrequency: ChangeFrequency; priority: number }> = {
  'build-log': { changeFrequency: 'monthly', priority: 0.8 },
  experiments: { changeFrequency: 'monthly', priority: 0.7 },
  projects: { changeFrequency: 'monthly', priority: 0.7 },
  news: { changeFrequency: 'weekly', priority: 0.6 },
};

/**
 * 公开可索引的静态页面。
 * 刻意不收录：/market（noindex 私有工作台）、/workflow（需登录，未登录仅显示鉴权页）、/dev/*（noindex 预览页）、所有 API 路由。
 */
const STATIC_ROUTES: Array<{ path: string; changeFrequency: ChangeFrequency; priority: number; collection?: string }> = [
  { path: '', changeFrequency: 'daily', priority: 1.0 },
  { path: '/build-log', changeFrequency: 'daily', priority: 0.9, collection: 'build-log' },
  { path: '/news', changeFrequency: 'daily', priority: 0.8, collection: 'news' },
  { path: '/experiments', changeFrequency: 'weekly', priority: 0.8, collection: 'experiments' },
  { path: '/projects', changeFrequency: 'weekly', priority: 0.8, collection: 'projects' },
  { path: '/chat', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/stack', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/prompts', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/gesture', changeFrequency: 'monthly', priority: 0.6 },
  // 独立交互实验页
  { path: '/experiments/ziwei', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/experiments/pelican', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/experiments/image-studio', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/experiments/ai-town', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/experiments/cyber-hack', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/experiments/fluid', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/experiments/geo-detective', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/experiments/gods-eye', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
];

/** 解析为有效 Date，无效日期返回 undefined（宁可不写 lastmod，也不输出错误时间误导搜索引擎） */
function toDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function latest(dates: Array<Date | undefined>): Date | undefined {
  return dates.reduce<Date | undefined>((max, d) => (d && (!max || d > max) ? d : max), undefined);
}

/** 封面转绝对地址，用于 Google 图片站点地图扩展；默认 OG 占位图不收录 */
function coverUrl(post: PublishedPost, baseUrl: string): string[] | undefined {
  if (!post.cover || post.cover.startsWith('/opengraph-image')) return undefined;
  try {
    return [new URL(post.cover, baseUrl).href];
  } catch {
    return undefined;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url.replace(/\/+$/, '');

  // 一次查询取出全部已发布文章，按集合分组（原实现分 4 次查询）
  const posts = (await listPublishedPosts()).filter((post) => post.collection in COLLECTIONS);
  const postModified = (post: PublishedPost) => toDate(post.updatedAt) || toDate(post.publishedAt);
  const latestByCollection = new Map<string, Date | undefined>();
  for (const collection of Object.keys(COLLECTIONS)) {
    latestByCollection.set(collection, latest(posts.filter((p) => p.collection === collection).map(postModified)));
  }
  const siteLatest = latest([...latestByCollection.values()]);

  // 以 URL 为键去重：防止数据库文章 slug 与独立实验页路由重复输出
  const entries = new Map<string, MetadataRoute.Sitemap[number]>();

  for (const route of STATIC_ROUTES) {
    const url = `${baseUrl}${route.path}`;
    // 首页与列表页的 lastmod 取其下最新文章更新时间；其他静态页无可靠时间则省略
    const lastModified = route.path === '' ? siteLatest : route.collection ? latestByCollection.get(route.collection) : undefined;
    entries.set(url, {
      url,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    });
  }

  for (const post of posts) {
    const url = `${baseUrl}/${post.collection}/${encodeURIComponent(post.slug)}`;
    if (entries.has(url)) continue;
    const config = COLLECTIONS[post.collection];
    const lastModified = postModified(post);
    const images = coverUrl(post, baseUrl);
    entries.set(url, {
      url,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: config.changeFrequency,
      priority: post.featured ? Math.min(config.priority + 0.1, 0.9) : config.priority,
      ...(images ? { images } : {}),
    });
  }

  return [...entries.values()];
}
