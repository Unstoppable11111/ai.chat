import { test } from "node:test";
import assert from "node:assert/strict";
import { chunkMarkdown, parseMarkdown, rankChunks } from "../src/lib/markdown-core.mjs";

test("heading IDs follow GitHub rules for punctuation, emoji and duplicates", () => {
  const { headings } = parseMarkdown("## Kiro Crew + MCP\n\n## Kiro Crew + MCP\n\n## 🤖 代理工具");
  assert.deepEqual(headings.map(h => h.id), ["kiro-crew--mcp", "kiro-crew--mcp-1", "-代理工具"]);
});
test("chunking preserves a long code block and every source node", () => {
  const content = "## 部署\n\n" + "段落内容。".repeat(500) + "\n\n```js\n" + "console.log('test');\n".repeat(200) + "```\n\n## 验证\n\n最后一段。";
  const post = { slug: "deploy", collection: "build-log", title: "部署记录", content };
  const chunks = chunkMarkdown(post, 1000);
  assert.equal(chunks.map(c => c.content).join("").replace(/\s/g, ""), content.replace(/\s/g, ""));
  assert.ok(chunks.every(c => c.startLine <= c.endLine && c.contentHash.length === 64));
  assert.ok(chunks.some(c => c.content.includes("```js") && c.content.endsWith("```")));
});
test("Chinese lexical ranking happens before limiting and accepts regex syntax literally", () => {
  const chunks = Array.from({length:30}, (_, i) => chunkMarkdown({slug:`post-${i}`,collection:"build-log",title:i===29?"向量索引与检索":"界面布局",content:i===29?"## 检索\n\n向量索引可以用于语义检索。":"## 排版\n\n页面布局和颜色。"})[0]);
  assert.equal(rankChunks(chunks, "向量索引", 1)[0].chunk.postSlug, "post-29");
  assert.doesNotThrow(() => rankChunks(chunks, "[a-z](.*)+?"));
  assert.deepEqual(rankChunks(chunks, "无关天气"), []);
});
