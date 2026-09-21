export interface WorkflowInspiration {
  id: string;
  title: string;
  genre: string;
  style: string;
  prompt: string;
  protagonist: string;
  hook: string;
}

// 导出底层数据数组
export { WORKFLOW_INSPIRATIONS } from "./workflow-inspirations.mjs";
