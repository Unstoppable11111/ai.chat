import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import type {
  AiLabEntry,
  BuildLogEntry,
  ProjectEntry,
  TocItem,
} from "@/lib/types";
import { slugify } from "@/lib/utils";

const CONTENT_ROOT = path.join(process.cwd(), "content");

type CollectionName = "ai-lab" | "build-log" | "projects";

function readCollection(collection: CollectionName) {
  const collectionPath = path.join(CONTENT_ROOT, collection);

  return fs
    .readdirSync(collectionPath)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const fullPath = path.join(collectionPath, file);
      const raw = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(raw);
      const slug = file.replace(/\.mdx$/, "");

      return {
        slug,
        frontmatter: data,
        content,
        stats: readingTime(content),
      };
    });
}

function sortByDate<T extends { frontmatter: { date?: string } }>(items: T[]) {
  return items.sort((a, b) => {
    const aTime = new Date(a.frontmatter.date ?? "").getTime();
    const bTime = new Date(b.frontmatter.date ?? "").getTime();
    return bTime - aTime;
  });
}

export function getAiLabEntries(): AiLabEntry[] {
  return sortByDate(readCollection("ai-lab")).map(({ slug, frontmatter }) => ({
    slug,
    title: String(frontmatter.title),
    excerpt: String(frontmatter.excerpt),
    category: frontmatter.category as AiLabEntry["category"],
    cover: String(frontmatter.cover),
    tools: frontmatter.tools as string[],
    tags: frontmatter.tags as string[],
    promptPreview: String(frontmatter.promptPreview),
    date: String(frontmatter.date),
    featured: Boolean(frontmatter.featured),
  }));
}

export function getBuildLogs(): BuildLogEntry[] {
  return sortByDate(readCollection("build-log")).map(({ slug, frontmatter }) => ({
    slug,
    title: String(frontmatter.title),
    excerpt: String(frontmatter.excerpt),
    date: String(frontmatter.date),
    tags: frontmatter.tags as string[],
    cover: String(frontmatter.cover),
    featured: Boolean(frontmatter.featured),
  }));
}

export function getProjects(): ProjectEntry[] {
  return sortByDate(readCollection("projects")).map(({ slug, frontmatter }) => ({
    slug,
    title: String(frontmatter.title),
    description: String(frontmatter.description),
    cover: String(frontmatter.cover),
    type: String(frontmatter.type),
    stack: frontmatter.stack as string[],
    year: String(frontmatter.year),
    featured: Boolean(frontmatter.featured),
  }));
}

export function getAiLabBySlug(slug: string) {
  return readCollection("ai-lab").find((entry) => entry.slug === slug);
}

export function getBuildLogBySlug(slug: string) {
  return readCollection("build-log").find((entry) => entry.slug === slug);
}

export function getProjectBySlug(slug: string) {
  return readCollection("projects").find((entry) => entry.slug === slug);
}

export function getTableOfContents(source: string): TocItem[] {
  return source
    .split("\n")
    .map((line) => {
      const match = /^(##|###)\s+(.+)$/.exec(line.trim());

      if (!match) {
        return null;
      }

      const text = match[2].replace(/[*_`]/g, "").trim();

      return {
        level: match[1].length as 2 | 3,
        text,
        id: slugify(text),
      };
    })
    .filter(Boolean) as TocItem[];
}
