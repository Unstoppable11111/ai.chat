import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import GithubSlugger from "github-slugger";
import { createHash } from "node:crypto";

/** @param {import('mdast').Nodes} node @returns {string} */
function textOf(node) {
  if ("value" in node) return node.value;
  if ("children" in node) return node.children.map(textOf).join("");
  return "";
}
/** @param {string} source */
export function parseMarkdown(source) {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(source);
  const slugger = new GithubSlugger();
  const headings = tree.children.filter(node => node.type === "heading").map(node => ({
    level: node.depth, text: textOf(node), id: slugger.slug(textOf(node)), line: node.position?.start.line || 1,
  }));
  return { tree, headings };
}
/** @param {string} source */
export function contentHash(source) { return createHash("sha256").update(source).digest("hex"); }

/** @param {{slug:string,collection:string,title:string,content:string}} post @param {number} [maxChars] */
export function chunkMarkdown(post, maxChars = 1800) {
  const { tree, headings } = parseMarkdown(post.content);
  const version = contentHash(post.content);
  const chunks = [];
  let parent = post.title;
  let heading = post.title;
  let anchor = "";
  let group = [];
  const flush = () => {
    if (!group.length) return;
    const first = group[0];
    const last = group[group.length - 1];
    const startLine = first.position.start.line;
    const content = post.content.slice(first.position.start.offset, last.position.end.offset);
    const fragment = first.type === "heading" ? anchor : `p-${startLine}`;
    chunks.push({ id: `${post.collection}/${post.slug}:${version.slice(0,12)}:${startLine}`, postSlug: post.slug, collection: post.collection, title: post.title, parentHeading: parent, sectionHeading: heading, content, startLine, endLine: last.position.end.line, contentHash: version, sourceUrl: `/${post.collection}/${post.slug}#${encodeURIComponent(fragment)}` });
    group = [];
  };
  for (const node of tree.children) {
    if (!node.position) continue;
    if (node.type === "heading") {
      flush();
      const entry = headings.find(item => item.line === node.position.start.line);
      heading = entry.text; anchor = entry.id;
      if (node.depth <= 2) parent = heading;
    }
    if (group.length && node.position.end.offset - group[0].position.start.offset > maxChars) flush();
    group.push(node);
  }
  flush();
  return chunks;
}

/** Preserve a stable paragraph/code/list anchor for a cited Markdown source line. */
export function rehypeSourceAnchors() {
  return (tree) => {
    for (const node of tree.children || []) {
      if (node.type === "element" && node.position?.start?.line && !/^h[1-6]$/.test(node.tagName)) {
        node.properties ||= {};
        node.properties.id ||= `p-${node.position.start.line}`;
      }
    }
  };
}

/** @param {string} query */
export function searchTerms(query) {
  const normalized = query.toLowerCase().normalize("NFKC");
  const words = normalized.match(/[a-z0-9][a-z0-9+#.-]*|[\p{Script=Han}]+/gu) || [];
  const terms = new Set();
  for (const word of words) {
    if (/\p{Script=Han}/u.test(word)) {
      for (let i = 0; i < word.length - 1; i++) terms.add(word.slice(i,i + 2));
    } else terms.add(word);
  }
  for (const stop of ["什么", "如何", "怎么", "一下", "介绍", "可以", "这个", "我们", "是否", "哪些"]) terms.delete(stop);
  return [...terms].slice(0,32);
}
/** @param {ReturnType<typeof chunkMarkdown>} chunks @param {string} query @param {number} [limit] */
export function rankChunks(chunks, query, limit = 4) {
  const terms = searchTerms(query);
  if (!terms.length) return [];
  const frequencies = new Map(terms.map(term => [term, chunks.filter(row => `${row.title} ${row.content}`.toLowerCase().includes(term)).length]));
  const scored = chunks.map(chunk => {
    const title = `${chunk.title} ${chunk.sectionHeading}`.toLowerCase();
    const body = chunk.content.toLowerCase();
    let hits = 0, score = 0;
    for (const term of terms) {
      if (!body.includes(term) && !title.includes(term)) continue;
      hits++;
      const frequency = frequencies.get(term);
      score += Math.log(1 + chunks.length / (1 + frequency)) * (title.includes(term) ? 3 : 1);
    }
    return { chunk, score, sourceUrl: chunk.sourceUrl, coverage: hits / terms.length };
  }).filter(row => row.score > 0 && row.coverage >= 0.25);
  return scored.sort((a,b) => b.score - a.score).slice(0,limit);
}
