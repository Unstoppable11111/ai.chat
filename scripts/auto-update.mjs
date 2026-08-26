import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

// 兼容 ES Module 的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// 使用原生 https 封装请求，兼容低版本 Node.js (<v18)
// ==========================================
function requestJSON(urlStr, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(urlStr, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`解析 JSON 失败: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// ==========================================
// 推荐数据源
// ==========================================
const SOURCES = {
  DEV_TO_AI: 'https://dev.to/api/articles?tag=ai&top=1&per_page=5',
};

async function fetchNewsData() {
  console.log('📡 正在抓取最新技术与 AI 资讯...');
  try {
    const devToData = await requestJSON(SOURCES.DEV_TO_AI, {
      method: 'GET',
      headers: { 'User-Agent': 'NodeJS/AutoUpdateScript' }
    });
    
    const rawNews = devToData.map((item, index) => {
      return `【资讯 ${index + 1}】标题: ${item.title}\n摘要: ${item.description}\n原链接: ${item.url}\n`;
    }).join('\n');

    return rawNews;
  } catch (err) {
    console.error('❌ 抓取失败:', err);
    process.exit(1);
  }
}

async function generateArticleWithAI(rawNews) {
  console.log('🧠 正在调用大模型提炼生成今日资讯...');
  
  const prompt = `
你是一个资深的科技媒体编辑。我将给你几条今天最新的外网 AI 与科技资讯。
请你把它们总结成一篇符合中文阅读习惯的“AI 科技早报”。

要求：
1. 语气专业、流畅。
2. 为每条资讯生成一个简短的二级标题，并附带原链接。
3. 最后加上一小段简短的总结（作为博主的观点）。

输入资讯：
${rawNews}

你必须只输出纯 Markdown 内容（不包含 YAML frontmatter）。
`;

  try {
    const apiKey = 'sk-vNt7PklyKhEjw9jBXyBA0GY3OVDBNt8hN0WgLxb85WU47k4s';
    const baseUrl = 'https://newapi.chenyc.chat/v1';
    const url = `${baseUrl}/chat/completions`;
    
    const postData = JSON.stringify({
      model: 'gemini-3.7-flash', 
      messages: [
        { role: 'system', content: '你是一个资深的科技媒体编辑。' },
        { role: 'user', content: prompt }
      ]
    });

    const data = await requestJSON(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);

    if (data.error) {
      throw new Error(data.error.message);
    }
    
    return data.choices[0].message.content;
  } catch (err) {
    console.error('❌ AI 生成失败:', err);
    process.exit(1);
  }
}

async function saveToMarkdown(content) {
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `${dateStr}-daily-ai.mdx`;
  const filePath = path.join(__dirname, '..', 'content', 'news', fileName);

  const frontmatter = `---
title: AI 与科技每日速递 (${dateStr})
excerpt: 今日最新的 AI 与技术资讯速览。
date: ${dateStr}
tags:
  - 自动抓取
  - AI资讯
cover: /images/placeholders/prompt-01.svg
---

${content}
`;

  fs.writeFileSync(filePath, frontmatter, 'utf-8');
  console.log(`✅ 生成成功！文件已保存至: ${filePath}`);
}

async function main() {
  const newsText = await fetchNewsData();
  const articleContent = await generateArticleWithAI(newsText);
  await saveToMarkdown(articleContent);
}

main();
