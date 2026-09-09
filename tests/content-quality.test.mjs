import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readLocalPosts } from "../src/lib/published-posts.mjs";
import { chunkMarkdown, parseMarkdown, rankChunks } from "../src/lib/markdown-core.mjs";

const posts=readLocalPosts().filter(p=>p.collection==="build-log"&&p.ragReady&&p.status==="published");
test("all revised technical notes have working examples and valid chunk anchors",()=>{
  assert.equal(posts.length,12);
  for(const post of posts){
    const {tree,headings}=parseMarkdown(post.content);
    assert.ok(post.content.includes("https://"),post.slug);
    const anchors=new Set([...headings.map(h=>h.id),...tree.children.filter(n=>n.position).map(n=>`p-${n.position.start.line}`)]);
    for(const chunk of chunkMarkdown(post))assert.ok(anchors.has(decodeURIComponent(chunk.sourceUrl.split("#")[1])),chunk.sourceUrl);
    const code=tree.children.filter(n=>n.type==="code"&&n.lang==="js");
    assert.ok(code.length,post.slug);
    for(const block of code){const run=spawnSync(process.execPath,["--input-type=module"],{input:block.value,encoding:"utf8",timeout:5000,shell:false});assert.equal(run.status,0,`${post.slug}: ${run.stderr}`);}
  }
});
test("frozen 12-topic retrieval smoke set returns the intended article in top 4",()=>{
  const fixtures=[
    ["RRF 排名融合", "enterprise-rag-hybrid-search-matrix"],
    ["KV cache 容量", "speculative-decoding-inference-acceleration"],
    ["专家路由容量", "sparse-moe-architecture-and-scaling"],
    ["组内优势归一化", "deepseek-r1-reasoning-revolution"],
    ["LoRA 参数预算", "flux-synthesis-architecture-and-lora"],
    ["视频 token 规模", "multimodal-dit-video-generation"],
    ["实体关系来源合并", "graph-rag-knowledge-network-architecture"],
    ["量化离群值", "edge-ai-and-npu-quantization"],
    ["推理预算超时", "claude-gemini-hybrid-thinking-paradigm"],
    ["MCP 工具身份", "mcp-protocol-and-agent-ecosystem"],
    ["Coding Agent 验收", "autonomous-coding-agents-workflow"],
    ["提示注入目的地", "ai-security-and-prompt-injection-defense"],
  ];
  const chunks=posts.flatMap(post=>chunkMarkdown(post));
  for(const [query,slug] of fixtures)assert.ok(rankChunks(chunks,query,4).some(r=>r.chunk.postSlug===slug),query);
});
