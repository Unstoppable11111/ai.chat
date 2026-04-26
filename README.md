# Chen AI Studio

一个基于 Next.js App Router、TypeScript、Tailwind CSS v4、Motion 和 MDX 构建的 AI Native Personal Studio。

## 本地运行

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Motion
- 基于本地内容文件的 MDX 内容系统
- 使用 `next/image` 优化本地占位视觉图

## 内容结构

```text
content/
  ai-lab/
  build-log/
  projects/
src/
  app/
  components/
  data/
  lib/
public/
  images/placeholders/
```

## 新增一篇 Build Log

1. 在 `content/build-log/` 下新增一个 `.mdx` 文件。
2. 写入 frontmatter：

```md
---
title: 你的标题
excerpt: 简短摘要
date: 2026-04-25
tags:
  - 标签一
  - 标签二
cover: /images/placeholders/prompt-03.svg
featured: true
---
```

3. 用 Markdown 或 MDX 写正文。
4. 使用 `##` 和 `###` 标题生成目录。

## 新增一个 AI Lab 作品

1. 在 `content/ai-lab/` 下新增一个 `.mdx` 文件。
2. 写入 frontmatter：

```md
---
title: 实验标题
excerpt: 简短摘要
category: 产品海报
cover: /images/placeholders/prompt-01.svg
tools:
  - Midjourney
  - Photoshop
tags:
  - 光线
  - 海报
promptPreview: 提示词预览摘要
date: 2026-04-25
featured: true
---
```

3. 详情页建议沿用这些章节：

- `Final Result`
- `Original Idea`
- `Prompt Structure`
- `Iteration Process`
- `What Worked`
- `What Failed`
- `Reusable Prompt`

4. 可复用提示词建议使用自定义 MDX 组件：

```mdx
<PromptBlock>
{`这里写完整提示词。`}
</PromptBlock>
```

## 新增一个 Project

1. 在 `content/projects/` 下新增一个 `.mdx` 文件。
2. 写入 frontmatter：

```md
---
title: 项目标题
description: 简短摘要
cover: /images/placeholders/prompt-06.svg
type: 内部产品
stack:
  - Next.js
  - TypeScript
year: 2026
featured: true
---
```

3. 项目详情建议沿用这些章节：

- `Project Overview`
- `Problem`
- `Approach`
- `Design System`
- `Tech Stack`
- `Result`
- `Next Step`

## 新增一个 Prompt

提示词目前放在 [`src/data/site.ts`](./src/data/site.ts) 的 `promptLibrary` 数组中。

每条提示词包含：

- `title`
- `category`
- `model`
- `tags`
- `prompt`
- `exampleImage`

## 说明

- 当前所有视觉图都使用本地 placeholder SVG，不依赖外部图片链接。
- 全局 design tokens 放在 [`src/app/globals.css`](./src/app/globals.css)。
- 共享布局和 UI 组件放在 `src/components`。
