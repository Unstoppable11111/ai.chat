import test from "node:test";
import assert from "node:assert/strict";
import { canResumeWorkflow, mergeInitialProjectSummaries, mergeProjectPatch, projectSummary, publicWorkflowConfig, remainingDraft } from "../src/components/workflow/project-state.mjs";

const project = {
  id: "book-a", title: "First", revision: "r1", createdAt: "2026-01-01", updatedAt: "2026-01-01",
  prompt: "story", cover_url: "data:image/png;base64,large-image",
  config: { prompt: "story", apiKey: "private-text-key", imageApiKey: "private-image-key", genre: "fiction" },
  bible: { title: "First", worldview: "large-world" },
  chapters: [{ chapter_number: 1, raw_content: "A".repeat(5000), polished_content: "B".repeat(6000) }],
  visual_assets: [{ id: "scene-1", image_url: "large-image" }],
};

test("summary caching excludes full text, assets, inline images and credentials", () => {
  const summary = projectSummary(project);
  assert.equal(summary.isSummary, true);
  assert.equal(summary.chapterCount, 1);
  assert.equal(summary.wordCount, 6000);
  assert.deepEqual(summary.chapters, []);
  const serialized = JSON.stringify(summary);
  for (const sensitive of ["private-text-key", "private-image-key", "large-image", "large-world", "AAAA"]) assert.equal(serialized.includes(sensitive), false);
  assert.throws(() => mergeProjectPatch(summary, { chapters: [] }), /正文尚未加载/);
});

test("chapter checkpoints preserve new assets and the original creation date", () => {
  const withAsset = mergeProjectPatch(project, { visual_assets: [{ id: "scene-2" }] });
  const withChapter = mergeProjectPatch(withAsset, { chapters: [{ chapter_number: 2 }], id: "other-book" });
  assert.equal(withChapter.id, project.id);
  assert.equal(withChapter.createdAt, project.createdAt);
  assert.deepEqual(withChapter.visual_assets, [{ id: "scene-2" }]);
});

test("legacy summaries keep unknown word counts unknown until detail is loaded", () => {
  assert.equal(projectSummary({ ...project, isSummary: true, chapters: [], wordCount: undefined }).wordCount, undefined);
});

test("acknowledging a save retains a newer edit made while the request was in flight", () => {
  const sent = { title: "Old", chapters: project.chapters };
  const latest = { title: "New", chapters: project.chapters, visual_assets: project.visual_assets };
  assert.deepEqual(remainingDraft(latest, sent), { title: "New", visual_assets: project.visual_assets });
});

test("exported config removes credentials and resume payload without mutating the session", () => {
  const source = { ...project.config, resumeChapters: project.chapters, model: "custom-model" };
  assert.deepEqual(publicWorkflowConfig(source), { prompt: "story", genre: "fiction", model: "custom-model" });
  assert.equal(source.apiKey, "private-text-key");
});

test("completed prose still exposes resume for missing later stages or fallback cover", () => {
  const finished = { ...project, bible: { ...project.bible, outlines: [{}] }, pitch: { synopsis: "complete" }, cover_url: "/cover.webp", chapters: [{ raw_content: "raw", polished_content: "polished", video_prompts: [{}] }] };
  assert.equal(canResumeWorkflow(finished), false);
  assert.equal(canResumeWorkflow({ ...finished, chapters: [{ ...finished.chapters[0], video_prompts: [] }] }), true);
  assert.equal(canResumeWorkflow({ ...finished, chapters: [{ ...finished.chapters[0], polished_content: "" }] }), true);
  assert.equal(canResumeWorkflow({ ...finished, pitch: undefined }), true);
  assert.equal(canResumeWorkflow({ ...finished, cover_url: "data:image/svg+xml,fallback" }), true);
});

test("late initial shelf responses preserve loaded details and newly created drafts", () => {
  const newDraft = { ...project, id: "new-book", revision: undefined, title: "Unsaved draft" };
  const secondSummary = { ...projectSummary(project), id: "second-book" };
  const incoming = [secondSummary, projectSummary(project)];
  const merged = mergeInitialProjectSummaries([project, newDraft], incoming);
  assert.deepEqual(merged.map((item) => item.id), ["second-book", project.id, "new-book"]);
  assert.equal(merged[1], project);
  assert.equal(merged[2], newDraft);
  assert.equal(merged[1].chapters[0].raw_content.length, 5000);
  assert.deepEqual(mergeInitialProjectSummaries([newDraft], []), [newDraft]);
});
