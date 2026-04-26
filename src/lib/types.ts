export type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
};

export type AiLabCategory =
  | "产品海报"
  | "角色人物"
  | "工业设计"
  | "网站视觉"
  | "品牌战役"
  | "提示词研究";

export type AiLabEntry = {
  slug: string;
  title: string;
  excerpt: string;
  category: AiLabCategory;
  cover: string;
  tools: string[];
  tags: string[];
  promptPreview: string;
  date: string;
  featured?: boolean;
};

export type BuildLogEntry = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
  cover: string;
  featured?: boolean;
};

export type ProjectEntry = {
  slug: string;
  title: string;
  description: string;
  cover: string;
  type: string;
  stack: string[];
  year: string;
  featured?: boolean;
};

export type PromptEntry = {
  id: string;
  title: string;
  category: string;
  model: string;
  tags: string[];
  summary: string;
  useCase: string;
  notes: string;
  prompt: string;
  exampleImage: string;
};

export type StackCategory = {
  title: string;
  description: string;
  tools: { name: string; detail: string }[];
};

export type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};
