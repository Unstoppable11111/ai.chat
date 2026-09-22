"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WorkflowProject } from "@/types/workflow";
import { mergeInitialProjectSummaries, mergeProjectPatch, projectSummary, publicWorkflowConfig, remainingDraft } from "./project-state.mjs";

const CACHE_KEY = "chen_ai_workflow_projects_v3";
const PAGE_SIZE = 12;

export function useWorkflowProjects() {
  const [projects, setProjects] = useState<WorkflowProject[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const projectsRef = useRef<WorkflowProject[]>([]);
  const revisions = useRef(new Map<string, string>());
  const queues = useRef(new Map<string, Promise<boolean>>());
  const drafts = useRef(new Map<string, Partial<WorkflowProject>>());
  const failed = useRef(new Set<string>());
  const failedCreates = useRef(new Set<string>());
  const offset = useRef(0);
  const initialized = useRef(false);
  const listRequest = useRef(0);

  const publish = useCallback((next: WorkflowProject[]) => {
    initialized.current = true;
    projectsRef.current = next;
    setProjects(next);
  }, []);

  useEffect(() => {
    try { localStorage.removeItem("chen_ai_workflow_projects_v2"); } catch {}
    const timer = window.setTimeout(() => {
      if (!initialized.current) return;
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(projects.slice(0, PAGE_SIZE).map(projectSummary))); } catch {}
    }, 500);
    return () => window.clearTimeout(timer);
  }, [projects]);

  const loadMore = useCallback(async (initial = false) => {
    const request = ++listRequest.current;
    setLoading(true);
    try {
      const response = await fetch(`/api-workflow/projects?offset=${initial ? 0 : offset.current}&limit=${PAGE_SIZE}`, { cache: "no-store" });
      const data = await response.json();
      if (request !== listRequest.current) return [];
      if (!response.ok || !data.success) throw new Error(data.error || "书架加载失败");
      const incoming: WorkflowProject[] = data.projects;
      for (const project of incoming) if (project.revision && !projectsRef.current.some((item) => item.id === project.id && !item.isSummary)) revisions.current.set(project.id, project.revision);
      offset.current = (initial ? 0 : offset.current) + incoming.length;
      const previous = projectsRef.current;
      const seen = new Set(previous.map((project) => project.id));
      publish(initial ? mergeInitialProjectSummaries(previous, incoming) : [...previous, ...incoming.filter((project) => !seen.has(project.id))]);
      setHasMore(Boolean(data.hasMore));
      return incoming;
    } catch (error) {
      if (request !== listRequest.current) return [];
      setSaveError(error instanceof Error ? error.message : "书架加载失败");
      if (initial) {
        try {
          const cached: WorkflowProject[] = JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
          if (Array.isArray(cached)) publish(mergeInitialProjectSummaries(projectsRef.current, cached.slice(0, PAGE_SIZE).map(projectSummary)));
        } catch {}
      }
      return [];
    } finally { if (request === listRequest.current) setLoading(false); }
  }, [publish]);

  const fetchProject = useCallback(async (id: string) => {
    const existing = projectsRef.current.find((project) => project.id === id);
    if (existing && !existing.isSummary) return existing;
    const response = await fetch(`/api-workflow/projects?id=${encodeURIComponent(id)}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.success || !data.project || data.project.isSummary) throw new Error(data.error || "小说正文加载失败，请重试");
    const project: WorkflowProject = data.project;
    if (project.revision) revisions.current.set(id, project.revision);
    publish(projectsRef.current.map((item) => item.id === id ? project : item));
    return project;
  }, [publish]);

  const saveDraft = useCallback((id: string): Promise<boolean> => {
    const previous = queues.current.get(id) || Promise.resolve(true);
    const next = previous.then(async () => {
      if (failed.current.has(id)) return false;
      const patch = { ...drafts.current.get(id) };
      if (!Object.keys(patch).length) return true;
      try {
        if (!revisions.current.has(id)) throw new Error("此小说尚未成功创建，草稿已保留，请重试保存。");
        const response = await fetch("/api-workflow/projects", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, revision: revisions.current.get(id), patch }),
        });
        const data = await response.json();
        if (!response.ok || !data.success || !data.project?.revision) {
          throw new Error(response.status === 409 ? "此小说已在其他页面更新，当前草稿已保留。请先导出草稿，再刷新核对版本。" : data.error || "保存失败，当前草稿仍保留，可重试保存。");
        }
        revisions.current.set(id, data.project.revision);
        drafts.current.set(id, remainingDraft(drafts.current.get(id) || {}, patch));
        // A response only acknowledges this revision; newer local edits remain intact.
        publish(projectsRef.current.map((project) => project.id === id ? { ...project, revision: data.project.revision } : project));
        return true;
      } catch (error) {
        failed.current.add(id);
        setSaveError(error instanceof Error ? error.message : "保存失败，当前草稿仍保留");
        return false;
      }
    });
    queues.current.set(id, next);
    return next;
  }, [publish]);

  const patchProject = useCallback((id: string, patch: Partial<WorkflowProject>) => {
    const project = projectsRef.current.find((item) => item.id === id);
    if (!project || project.isSummary) {
      setSaveError("正文尚未加载，无法保存，请重新打开此小说。");
      return Promise.resolve(false);
    }
    const safePatch = patch.config ? { ...patch, config: publicWorkflowConfig(patch.config) } : patch;
    publish(projectsRef.current.map((item) => item.id === id ? mergeProjectPatch(item, patch) : item));
    drafts.current.set(id, { ...drafts.current.get(id), ...safePatch });
    return saveDraft(id);
  }, [publish, saveDraft]);

  const createProject = useCallback(async (project: WorkflowProject) => {
    publish([project, ...projectsRef.current.filter((item) => item.id !== project.id)]);
    try {
      const response = await fetch("/api-workflow/projects", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...project, config: publicWorkflowConfig(project.config) }),
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.project?.revision) throw new Error(data.error || "创建失败，草稿已保留");
      revisions.current.set(project.id, data.project.revision);
      failedCreates.current.delete(project.id);
      failed.current.delete(project.id);
      drafts.current.delete(project.id);
      publish(projectsRef.current.map((item) => item.id === project.id ? { ...item, revision: data.project.revision } : item));
      return true;
    } catch (error) {
      failedCreates.current.add(project.id);
      setSaveError(error instanceof Error ? error.message : "创建失败，草稿已保留");
      return false;
    }
  }, [publish]);

  const removeProject = useCallback(async (id: string) => {
    await queues.current.get(id);
    const response = await fetch(`/api-workflow/projects?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || "删除失败，请重试");
    publish(projectsRef.current.filter((item) => item.id !== id));
    offset.current = Math.max(0, offset.current - 1);
    drafts.current.delete(id);
    revisions.current.delete(id);
  }, [publish]);

  const retrySaves = useCallback(async () => {
    setSaveError(null);
    const creates = [...failedCreates.current];
    for (const id of creates) {
      const project = projectsRef.current.find((item) => item.id === id);
      if (project) await createProject(project);
    }
    const ids = [...failed.current];
    failed.current.clear();
    await Promise.all(ids.map(saveDraft));
  }, [createProject, saveDraft]);

  return { projects, projectsRef, hasMore, loading, saveError, loadMore, fetchProject, patchProject, createProject, removeProject, retrySaves };
}
