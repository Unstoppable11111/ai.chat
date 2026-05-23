import type { NavItem, PromptEntry, StackCategory } from "@/lib/types";

export const siteConfig = {
  name: "Chen Tech Studio",
  title: "CHEN TECH STUDIO",
  description:
    "个人技术展示与项目记录网站，记录网站开发、代码构建、视觉实验、工具整理与学习过程。",
  url: "https://chenyc.chat",
  email: "chenyc0507@gmail.com",
};

export const navigation: NavItem[] = [
  { href: "/", label: "首页" },
  { href: "/projects", label: "项目案例" },
  { href: "/build-log", label: "构建日志" },
  { href: "/stack", label: "工具整理" },
  { href: "/prompts", label: "学习笔记" },
  { href: "/gesture-interactive.html", label: "手势实验" },
  { href: "/about", label: "关于我" },
];

export const currentlyBuilding = [
  "一套适用于个人项目展示页的轻亮视觉语言系统",
  "从设计草图到页面镜头的视觉与代码实验流程",
  "用于追踪内容、产品和实验进展的个人工作台",
  "面向日志、项目和学习资料的可复用 MDX 内容系统",
];

export const manifesto =
  "个人网站不该只是简历、博客或静态作品集。它也可以是一个持续更新的记录系统：想法在这里被验证，页面在这里被搭建，项目在这里被整理，学习过程在这里变成可见的资料。";

export const promptLibrary: PromptEntry[] = [
  {
    id: "prompt-01",
    title: "电影感产品预告图",
    category: "产品视觉",
    model: "视觉资料",
    tags: ["海报", "光线", "发布"],
    summary: "适合技术产品概念、硬件概念和新品发布页的主视觉预告图。",
    useCase: "新品发布、首页主视觉、海报封面",
    notes: "重点保留 teaser、negative space 和 rim light，不要加入过多材质形容词。",
    exampleImage: "/images/placeholders/prompt-01.svg",
    prompt:
      "A premium tech product teaser, isolated hero object on bright pearl background, cinematic rim light, subtle fog, high contrast, glossy materials, shallow depth of field, elegant startup launch campaign, editorial composition, ultra clean, cyan accent lighting, 4k.",
  },
  {
    id: "prompt-02",
    title: "未来感品牌战役画面",
    category: "品牌战役",
    model: "视觉资料",
    tags: ["品牌", "战役", "时尚"],
    summary: "用于品牌主视觉、人物海报和偏时尚科技感的 KV 画面。",
    useCase: "品牌海报、活动主视觉、人物主 KV",
    notes: "服装和神态越克制，画面越容易接近成熟品牌的气质。",
    exampleImage: "/images/placeholders/prompt-02.svg",
    prompt:
      "A futuristic brand campaign visual, confident subject, minimal wardrobe, reflective materials, spatial typography framing, premium startup aesthetic, controlled cyan and violet lights, fashion editorial energy, clean negative space, poster-ready layout, high-end color grading.",
  },
  {
    id: "prompt-03",
    title: "技术网站首页场景图",
    category: "网站视觉",
    model: "页面参考",
    tags: ["网站", "首页", "工作台"],
    summary: "适合技术网站首页、工作台页面和未来感网页背景。",
    useCase: "官网首页、落地页、产品背景图",
    notes: "控制界面卡片数量，画面会更高级，也更适合叠加内容。",
    exampleImage: "/images/placeholders/prompt-03.svg",
    prompt:
      "A next-gen technology website hero scene, airy workspace environment, floating transparent interface cards, glowing central orb, cinematic depth, layered grids, pearl and silver palette, cyan and violet highlights, modern product feel, ultra modern web visual.",
  },
  {
    id: "prompt-04",
    title: "工业概念渲染",
    category: "工业设计",
    model: "设计资料",
    tags: ["工业", "概念", "材质"],
    summary: "适合做产品设计方向的概念渲染和材质研究图。",
    useCase: "工业设计方案、产品概念图、材质研究",
    notes: "如果想更像评审稿，建议补上 prototype 和 presentation style。",
    exampleImage: "/images/placeholders/prompt-04.svg",
    prompt:
      "An industrial design concept render, brushed metal shell, modular construction, soft studio shadows, dramatic side light, elevated light pedestal, hyper detailed materials, future manufacturing prototype, precise, premium, product development presentation style.",
  },
  {
    id: "prompt-05",
    title: "景深与光线研究",
    category: "提示词研究",
    model: "学习记录",
    tags: ["研究", "光线", "迭代"],
    summary: "测试景深、主光源和留白对画面高级感的影响。",
    useCase: "提示词研究、变量测试、风格校准",
    notes: "更适合做控制变量实验，而不是直接用于营销成图。",
    exampleImage: "/images/placeholders/prompt-05.svg",
    prompt:
      "A controlled prompt study image showing how layered lighting, focal depth, and negative space influence mood, same object centered, three-quarter view, pale studio environment, directional cyan key light, subtle bounce fill, clean background, test-sheet composition.",
  },
  {
    id: "prompt-06",
    title: "创业者工作台氛围图",
    category: "产品视觉",
    model: "页面参考",
    tags: ["工作台", "软件产品", "创业者"],
    summary: "适合整理偏创业者、偏软件产品感的明亮工作台视觉。",
    useCase: "品牌页、产品宣传图、工作台视觉",
    notes: "加入 refined props 和 editorial atmosphere，会更接近真实软件环境。",
    exampleImage: "/images/placeholders/prompt-06.svg",
    prompt:
      "A founder-facing startup dashboard moodframe, airy interface on large display, crisp data widgets, high-end workspace setting, refined keyboard and notebook props, soft daylight, premium software brand atmosphere, realistic and editorial.",
  },
  {
    id: "prompt-07",
    title: "技术工具品牌人物视觉",
    category: "角色人物",
    model: "视觉资料",
    tags: ["人物", "肖像", "品牌"],
    summary: "适合技术工具品牌、科技人物肖像和首页人物主视觉。",
    useCase: "人物主视觉、品牌肖像、团队形象图",
    notes: "避免过度 cyberpunk 关键词，画面会更像成熟品牌。",
    exampleImage: "/images/placeholders/prompt-02.svg",
    prompt:
      "A creative technologist portrait for a technology tool campaign, sharp silhouette, subtle expression, modern jacket, clean studio background, cyan and violet split lighting, high-end startup brand mood, editorial portrait, premium and believable.",
  },
  {
    id: "prompt-08",
    title: "包装系统探索",
    category: "品牌战役",
    model: "设计资料",
    tags: ["包装", "样机", "品牌"],
    summary: "适合极简高端品牌的包装样机和发布物料视觉。",
    useCase: "包装视觉、品牌系统、发布物料",
    notes: "比起 luxury，emboss、foil、matte 这类工艺词更能提升质感。",
    exampleImage: "/images/placeholders/prompt-01.svg",
    prompt:
      "A premium packaging system exploration for a modern technology hardware brand, matte packaging, embossed typography, clean light surface, cyan foil details, staged on soft-lit studio table, minimal but luxurious, launch-ready brand image.",
  },
];

export const stackCategories: StackCategory[] = [
  {
    title: "学习资料",
    description: "负责技术学习、资料整理、提示词笔记和项目复盘。",
    tools: [
      { name: "技术文档", detail: "开发知识、接口说明与问题记录" },
      { name: "提示词笔记", detail: "表达方式、结构拆解与案例整理" },
      { name: "视觉参考", detail: "构图、光线、版式和风格资料" },
      { name: "复盘文档", detail: "项目过程、问题和改进方向" },
    ],
  },
  {
    title: "设计",
    description: "负责视觉系统、界面、动效和品牌实验方向。",
    tools: [
      { name: "Figma", detail: "系统、流程与组件设计" },
      { name: "Photoshop", detail: "合成、修图与视觉精修" },
      { name: "Framer", detail: "品牌页验证与交互测试" },
      { name: "Spline", detail: "轻量 3D 概念表达" },
    ],
  },
  {
    title: "开发",
    description: "保证界面和原型可以快速上线，同时保留结构感和迭代空间。",
    tools: [
      { name: "Next.js", detail: "App Router 与内容驱动前端" },
      { name: "TypeScript", detail: "让整个站点更稳定可迭代" },
      { name: "Tailwind CSS v4", detail: "基于 design token 的界面样式" },
      { name: "Motion", detail: "克制但有存在感的动效系统" },
    ],
  },
  {
    title: "内容",
    description: "把实验沉淀成可复用的文档、案例和叙事资产。",
    tools: [
      { name: "MDX", detail: "构建日志、案例和提示词笔记" },
      { name: "Notion", detail: "记录、整理与前期规划" },
      { name: "Cap", detail: "快速异步演示和录屏" },
      { name: "Raycast", detail: "命令优先的工作习惯" },
    ],
  },
  {
    title: "商业",
    description: "让实验始终靠近真实结果的创业者工作流。",
    tools: [
      { name: "Linear", detail: "执行节奏与路线图管理" },
      { name: "Tally", detail: "线索收集与轻量调研" },
      { name: "Stripe", detail: "验证商业化路径" },
      { name: "Airtable", detail: "运营、CRM 与内容流水线" },
    ],
  },
  {
    title: "自动化",
    description: "减少内容整理、资料归档和页面构建中的重复劳动。",
    tools: [
      { name: "Zapier", detail: "快速业务自动化" },
      { name: "Make", detail: "可视化流程编排" },
      { name: "n8n", detail: "自定义内部自动化逻辑" },
      { name: "GitHub Actions", detail: "构建与内容自动化" },
    ],
  },
];
