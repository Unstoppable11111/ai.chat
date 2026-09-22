import type { WorkflowConfig, WorkflowProject } from "@/types/workflow";
export function publicWorkflowConfig(config: WorkflowConfig): WorkflowConfig;
export function projectSummary(project: WorkflowProject): WorkflowProject;
export function mergeProjectPatch(project: WorkflowProject, patch: Partial<WorkflowProject>): WorkflowProject;
export function remainingDraft(current: Partial<WorkflowProject>, saved: Partial<WorkflowProject>): Partial<WorkflowProject>;
export function mergeInitialProjectSummaries(current: WorkflowProject[], incoming: WorkflowProject[]): WorkflowProject[];
export function canResumeWorkflow(project: Partial<WorkflowProject>): boolean;
