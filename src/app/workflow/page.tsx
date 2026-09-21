"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sliders,
  Play,
  Square,
  BookOpen,
  Clapperboard,
  FileSpreadsheet,
  FileText,
  Download,
  AlertCircle,
  Plus,
  Compass,
  Image as ImageIcon,
} from "lucide-react";
import { WorkflowIntro } from "@/components/workflow/workflow-intro";
import { NovelShelf } from "@/components/workflow/novel-shelf";
import { ConfigModal } from "@/components/workflow/config-modal";
import {
  PipelineStepper,
  type StepItem,
  type StepStatus,
} from "@/components/workflow/pipeline-stepper";
import { NovelViewer } from "@/components/workflow/novel-viewer";
import { VideoPromptBoard } from "@/components/workflow/video-prompt-board";
import { PitchCard } from "@/components/workflow/pitch-card";
import { VisualAssetsBoard } from "@/components/workflow/visual-assets-board";
import { WorkflowModal, type ModalState } from "@/components/workflow/workflow-modal";
import type {
  BibleData,
  ChapterData,
  PitchNoteData,
  VideoPromptItem,
  VisualAssetItem,
  WorkflowConfig,
  WorkflowProject,
  WorkflowSSEEvent,
} from "@/types/workflow";

const INITIAL_STEPS: StepItem[] = [
  {
    id: "step_1_bible",
    name: "Step 1: 世界观与人物细纲 (Bible)",
    description: "全局世界观、主要人物卡、核心伏笔清单与分章细纲",
    status: "idle",
  },
  {
    id: "step_2_chapters",
    name: "Step 2: 逐章正文创作与流式打字 (Context Cascading)",
    description: "上下文滚动接力，去机械味短句正文实时逐章流式撰写",
    status: "idle",
  },
  {
    id: "step_3_video_prompts",
    name: "Step 3: 电影级 AI 视频分镜 (Video Prompts)",
    description: "提炼 3~4 个高潮镜头，适配 Kling / Runway 4K/24fps",
    status: "idle",
  },
  {
    id: "step_4_polish",
    name: "Step 4: 去 AI 味语言精修与调优 (De-AI Polish)",
    description: "15字以内短句拆分，删除套话，强化动作与物理细节",
    status: "idle",
  },
  {
    id: "step_5_pitch",
    name: "Step 5: 商业包装与终极电影海报 (Pitch & Cover)",
    description: "面向编辑与制片人的商业亮点，汇聚全案生成电影海报",
    status: "idle",
  },
];

const LOCAL_PROJECTS_KEY = "chen_ai_workflow_projects_v2";
const DEFAULT_CONFIG: WorkflowConfig = {
  prompt: "",
  genre: "都市异能",
  style: "快节奏爽感、电影质感",
  chapterCount: 3,
  targetWordCount: 1200,
  deAiLevel: "light",
  customSystemPrompt: "",
  model: "",   // 保持为空，默认走站点内置 AI 对话通道 (与全站 AI 助手一致)
  baseUrl: "", // 保持为空，默认走站点内置 AI 对话通道
  apiKey: "",  // 保持为空，默认走站点内置 AI 对话通道
};

export default function WorkflowPage() {
  // 多小说书架列表
  const [projects, setProjects] = useState<WorkflowProject[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // 当前小说的专属参数与输入
  const [prompt, setPrompt] = useState("");
  const [config, setConfig] = useState<WorkflowConfig>(DEFAULT_CONFIG);

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<StepItem[]>(INITIAL_STEPS);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // 当前小说的流水线产物
  const [bible, setBible] = useState<BibleData | null>(null);
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [pitch, setPitch] = useState<PitchNoteData | null>(null);
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [visualAssets, setVisualAssets] = useState<VisualAssetItem[]>([]);

  // 打字机流式文本
  const [streamingText, setStreamingText] = useState("");
  const [streamingChapter, setStreamingChapter] = useState(1);
  const [activeTab, setActiveTab] = useState<"novel" | "video" | "assets" | "pitch" | "bible">("novel");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState>({ type: "idle" });

  const abortControllerRef = useRef<AbortController | null>(null);

  // 统一加载单本小说的专属参数与数据
  const loadProjectIntoState = (proj: WorkflowProject) => {
    setCurrentProjectId(proj.id);
    setPrompt(proj.prompt || proj.config?.prompt || "");
    const cleanedConfig = { ...DEFAULT_CONFIG, ...proj.config };
    if (cleanedConfig.baseUrl && !/^https?:\/\//i.test(cleanedConfig.baseUrl)) {
      cleanedConfig.baseUrl = "";
    }
    if (!cleanedConfig.apiKey?.trim()) {
      cleanedConfig.model = "";
    }
    setConfig(cleanedConfig);
    setBible(proj.bible || null);
    setChapters(proj.chapters || []);
    setPitch(proj.pitch || null);
    setCoverUrl(proj.cover_url || "");
    setVisualAssets(proj.visual_assets || []);
    setStreamingText("");
    setErrorMessage(null);
    setSteps((prev) =>
      prev.map((s) => ({ ...s, status: "completed" as StepStatus, detail: undefined }))
    );
  };

  // 优先从云端数据库加载用户绑定的小说书架，若无则使用本地缓存
  useEffect(() => {
    let ignore = false;

    fetch("/api-workflow/projects")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (ignore) return;
        if (data?.success && Array.isArray(data.projects) && data.projects.length > 0) {
          const list: WorkflowProject[] = data.projects;
          setProjects(list);
          try {
            localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(list));
          } catch {}
          loadProjectIntoState(list[0]);
          return;
        }

        // 云端暂无时回退从本地缓存恢复
        try {
          const saved = localStorage.getItem(LOCAL_PROJECTS_KEY);
          if (saved) {
            const list: WorkflowProject[] = JSON.parse(saved);
            if (Array.isArray(list) && list.length > 0) {
              setProjects(list);
              loadProjectIntoState(list[0]);
            }
          }
        } catch {}
      })
      .catch(() => {
        try {
          const saved = localStorage.getItem(LOCAL_PROJECTS_KEY);
          if (saved) {
            const list: WorkflowProject[] = JSON.parse(saved);
            if (Array.isArray(list) && list.length > 0) {
              setProjects(list);
              loadProjectIntoState(list[0]);
            }
          }
        } catch {}
      });

    return () => {
      ignore = true;
    };
  }, []);

  // 仅在本地持久化工程列表 (纯更新 state 与 localStorage，绝不隐式触发网络 POST)
  const persistProjectsLocally = (updatedList: WorkflowProject[]) => {
    setProjects(updatedList);
    try {
      localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(updatedList));
    } catch {}
  };

  // 显式异步保存指定小说项目至云端 MySQL 数据库
  const syncProjectToCloud = (project: WorkflowProject) => {
    if (!project || !project.id) return;
    fetch("/api-workflow/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    }).catch((err) => console.warn("[Workflow] 云端单书保存失败:", err));
  };

  // 显式异步从云端 MySQL 数据库删除指定小说项目
  const deleteProjectFromCloud = (projectId: string) => {
    if (!projectId) return;
    fetch(`/api-workflow/projects?id=${encodeURIComponent(projectId)}`, {
      method: "DELETE",
    }).catch((err) => console.warn("[Workflow] 云端单书删除失败:", err));
  };

  // 切换选中某部小说：左边加载原来绑定的专属参数，右边展示小说章节信息与资产
  const handleSelectProject = (projectId: string) => {
    if (isRunning) handleStop();
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return;
    loadProjectIntoState(proj);
    setActiveTab("novel");
  };

  // 创作全新小说
  const handleCreateNew = () => {
    if (isRunning) handleStop();
    setCurrentProjectId(null);
    setPrompt("");
    setConfig(DEFAULT_CONFIG);
    setBible(null);
    setChapters([]);
    setPitch(null);
    setCoverUrl("");
    setVisualAssets([]);
    setStreamingText("");
    setErrorMessage(null);
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: "idle" })));
    setCurrentStepIndex(0);
    setActiveTab("novel");
  };

  // 保存新生成的视觉资产 (人物立绘或场景概念图)
  const handleSaveVisualAsset = (newAsset: VisualAssetItem) => {
    setVisualAssets((prev) => {
      const filtered = prev.filter((a) => a.id !== newAsset.id);
      const updated = [...filtered, newAsset];

      if (currentProjectId) {
        const targetProj = projects.find((p) => p.id === currentProjectId);
        if (targetProj) {
          const updatedProj: WorkflowProject = {
            ...targetProj,
            visual_assets: updated,
            updatedAt: new Date().toISOString(),
          };
          const nextProjects = projects.map((p) =>
            p.id === currentProjectId ? updatedProj : p
          );
          persistProjectsLocally(nextProjects);
          syncProjectToCloud(updatedProj);
        }
      }
      return updated;
    });
  };

  // 触发删除小说二次确认弹窗 (杜绝误删，提升安全感)
  const handleRequestDeleteProject = (proj: WorkflowProject, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRunning) {
      setModalState({
        type: "busy_block",
        message: "当前流水线正在执行工业化生产中，为保障数据完整性，暂时无法删除小说。请等待当前全案完成或先中止任务。",
      });
      return;
    }
    setModalState({ type: "confirm_delete", project: proj });
  };

  // 确认执行从本地及云端数据库彻底删除
  const handleConfirmDelete = (projectId: string) => {
    const nextList = projects.filter((p) => p.id !== projectId);
    persistProjectsLocally(nextList);
    deleteProjectFromCloud(projectId);

    // 如果删除的是当前选中的小说项目
    if (currentProjectId === projectId) {
      if (nextList.length > 0) {
        loadProjectIntoState(nextList[0]);
      } else {
        handleCreateNew();
      }
    }
  };

  // 触发运行中拦截弹窗
  const handleBlockedAction = (message: string) => {
    setModalState({ type: "busy_block", message });
  };

  // 更新当前小说的创作配置项并同步绑定
  const handleConfigChange = (updated: Partial<WorkflowConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updated };
      // 若当前已处于某个小说工程中，同步持久化到该小说的专属绑定配置中
      if (currentProjectId) {
        const targetProj = projects.find((p) => p.id === currentProjectId);
        if (targetProj) {
          const updatedProj: WorkflowProject = {
            ...targetProj,
            config: next,
            updatedAt: new Date().toISOString(),
          };
          const nextProjects = projects.map((p) =>
            p.id === currentProjectId ? updatedProj : p
          );
          persistProjectsLocally(nextProjects);
          syncProjectToCloud(updatedProj);
        }
      }
      return next;
    });
  };

  // 当 Prompt 输入框失焦时，持久化同步到当前小说绑定中 (避免每个按键都发起网络请求)
  const handlePromptBlur = () => {
    if (currentProjectId && prompt.trim()) {
      const targetProj = projects.find((p) => p.id === currentProjectId);
      if (targetProj && targetProj.prompt !== prompt.trim()) {
        const updatedProj: WorkflowProject = {
          ...targetProj,
          prompt: prompt.trim(),
          config: { ...targetProj.config, prompt: prompt.trim() },
          updatedAt: new Date().toISOString(),
        };
        const nextProjects = projects.map((p) =>
          p.id === currentProjectId ? updatedProj : p
        );
        persistProjectsLocally(nextProjects);
        syncProjectToCloud(updatedProj);
      }
    }
  };

  // 选择预设创作赛道 (正在运行时严格拦截锁控)
  const handleSelectPreset = (p: string, g: string, s: string) => {
    if (isRunning) {
      handleBlockedAction("当前已有小说正在流水线工业化生产中，请等待当前全案完成或先中止任务，再尝试其他赛道。");
      return;
    }
    setPrompt(p);
    handleConfigChange({ genre: g, style: s });
  };

  // 终止执行
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsRunning(false);
    setSteps((prev) =>
      prev.map((s) => (s.status === "running" ? { ...s, status: "idle" } : s))
    );
  };

  // 重置当前正在创作的内容
  const handleReset = () => {
    handleCreateNew();
  };

  // 单章微调后的持久化回调
  const handleUpdateChapter = (
    chapterNumber: number,
    updatedFields: Partial<ChapterData>
  ) => {
    setChapters((prev) => {
      const nextChapters = prev.map((ch) =>
        ch.chapter_number === chapterNumber ? { ...ch, ...updatedFields } : ch
      );

      // 同步持久化到当前选中小说项目中
      if (currentProjectId) {
        const targetProj = projects.find((p) => p.id === currentProjectId);
        if (targetProj) {
          const updatedProj: WorkflowProject = {
            ...targetProj,
            chapters: nextChapters,
            updatedAt: new Date().toISOString(),
          };
          const nextProjects = projects.map((p) =>
            p.id === currentProjectId ? updatedProj : p
          );
          persistProjectsLocally(nextProjects);
          syncProjectToCloud(updatedProj);
        }
      }

      return nextChapters;
    });
  };

  // 启动工业化流水线
  const handleStartPipeline = async () => {
    if (isRunning) {
      handleBlockedAction("当前已有小说正在流水线工业化生产中，请勿重复启动或提交。");
      return;
    }
    if (!prompt.trim()) {
      setErrorMessage("请先输入小说的核心灵感或基础设定");
      return;
    }

    setErrorMessage(null);
    setIsRunning(true);
    setStreamingText("");
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: "idle" })));
    setCurrentStepIndex(0);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // 清洗 Base URL，避免无效的残存字符串导致服务端异常
    let safeBaseUrl = config.baseUrl?.trim() || "";
    if (safeBaseUrl && !/^https?:\/\//i.test(safeBaseUrl)) {
      safeBaseUrl = "";
    }

    const isCustom = Boolean(config.apiKey && config.apiKey.trim().length > 0);

    const requestPayload: WorkflowConfig = {
      ...config,
      projectId: currentProjectId || undefined,
      baseUrl: safeBaseUrl,
      model: isCustom ? config.model?.trim() || "gpt-4o-mini" : "", // 非自定义 Key 留空，后端自动映射为站长 AI 对话后端模型
      prompt: prompt.trim(),
    };

    // 分配或沿用小说工程 ID
    const activeId = currentProjectId || `proj_${Date.now()}`;
    if (!currentProjectId) {
      setCurrentProjectId(activeId);
    }

    try {
      const response = await fetch("/api-workflow/novel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.code === "DAILY_QUOTA_EXCEEDED") {
          setModalState({
            type: "quota_limit",
            message:
              errorData.error ||
              "您今日的小说创作额度已达上限（每个账户每日限 2 本小说的全案生产与视觉资产制作）。",
          });
        } else if (
          errorData.code === "PROMPT_INJECTION_DETECTED" ||
          errorData.code === "RATE_LIMITED"
        ) {
          setModalState({
            type: "security_alert",
            message: errorData.error || "触发服务端安全防护或高频请求拦截，系统已拒绝执行。",
          });
        } else if (errorData.code === "UNAUTHORIZED") {
          setModalState({
            type: "security_alert",
            message: "未登录或登录会话已过期，请重新登录后再使用小说创作功能。",
          });
        }
        throw new Error(errorData.error || `HTTP 异常: ${response.status}`);
      }

      if (!response.body) throw new Error("服务器未返回流数据");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      let currentBible: BibleData | null = bible;
      let currentChapters: ChapterData[] = [...chapters];
      let currentPitch: PitchNoteData | null = pitch;
      let currentCoverUrl: string = coverUrl;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;
          if (trimmed.startsWith("data: ")) {
            try {
              const event: WorkflowSSEEvent = JSON.parse(trimmed.slice(6));

              // 处理 STEP_START
              if (event.type === "STEP_START") {
                const stepKey = event.step;
                if (stepKey.startsWith("chapter_")) {
                  const chNum = parseInt(stepKey.replace("chapter_", ""), 10);
                  setStreamingChapter(chNum);
                  setStreamingText("");
                  setActiveTab("novel");
                  setSteps((prev) =>
                    prev.map((s) =>
                      s.id === "step_2_chapters"
                        ? { ...s, status: "running", detail: event.label }
                        : s
                    )
                  );
                } else if (stepKey === "cover_generation") {
                  setSteps((prev) =>
                    prev.map((s) =>
                      s.id === "step_2_chapters"
                        ? { ...s, status: "running", detail: event.label }
                        : s
                    )
                  );
                } else if (stepKey.startsWith("video_ch_")) {
                  setActiveTab("video");
                  setSteps((prev) =>
                    prev.map((s) =>
                      s.id === "step_3_video_prompts"
                        ? { ...s, status: "running", detail: event.label }
                        : s
                    )
                  );
                } else if (stepKey.startsWith("polish_ch_")) {
                  setActiveTab("novel");
                  setSteps((prev) =>
                    prev.map((s) =>
                      s.id === "step_4_polish"
                        ? { ...s, status: "running", detail: event.label }
                        : s
                    )
                  );
                } else {
                  setSteps((prev) =>
                    prev.map((s) =>
                      s.id === stepKey
                        ? { ...s, status: "running", detail: event.label }
                        : s
                    )
                  );
                  const idx = INITIAL_STEPS.findIndex((s) => s.id === stepKey);
                  if (idx !== -1) setCurrentStepIndex(idx);
                }
              }

              // 处理 CHUNK
              if (event.type === "CHUNK" && event.text) {
                setStreamingText((prev) => prev + event.text);
              }

              // 处理 STEP_COMPLETE
              if (event.type === "STEP_COMPLETE") {
                const stepKey = event.step;
                const data = event.data as Record<string, unknown> | undefined;

                if (stepKey === "step_1_bible" && data?.bible) {
                  currentBible = data.bible as BibleData;
                  setBible(currentBible);
                  setStreamingText("");
                  setSteps((prev) =>
                    prev.map((s) =>
                      s.id === "step_1_bible"
                        ? { ...s, status: "completed", detail: undefined }
                        : s
                    )
                  );
                } else if (stepKey === "cover_generation" && data?.cover_url) {
                  currentCoverUrl = String(data.cover_url);
                  setCoverUrl(currentCoverUrl);
                } else if (stepKey.startsWith("chapter_") && data) {
                  const chNum = Number(data.chapter_number) || 1;
                  const chTitle = String(data.title || `第 ${chNum} 章`);
                  const chContent = String(data.content || "");

                  const existing = currentChapters.findIndex((c) => c.chapter_number === chNum);
                  const newChapter: ChapterData = {
                    chapter_number: chNum,
                    title: chTitle,
                    summary: "",
                    raw_content: chContent,
                    polished_content: "",
                    video_prompts: [],
                  };

                  if (existing !== -1) {
                    currentChapters[existing] = { ...currentChapters[existing], ...newChapter };
                  } else {
                    currentChapters.push(newChapter);
                  }

                  setChapters([...currentChapters]);
                  setStreamingText("");
                } else if (stepKey === "step_2_chapters" && data?.chapters) {
                  currentChapters = data.chapters as ChapterData[];
                  if (data.cover_url) {
                    currentCoverUrl = String(data.cover_url);
                    setCoverUrl(currentCoverUrl);
                  }
                  setChapters([...currentChapters]);
                  setSteps((prev) =>
                    prev.map((s) =>
                      s.id === "step_2_chapters"
                        ? { ...s, status: "completed", detail: undefined }
                        : s
                    )
                  );
                } else if (stepKey.startsWith("video_ch_") && data) {
                  const chNum = Number(data.chapter_number);
                  const prompts = (data.video_prompts as VideoPromptItem[]) || [];
                  currentChapters = currentChapters.map((c) =>
                    c.chapter_number === chNum ? { ...c, video_prompts: prompts } : c
                  );
                  setChapters([...currentChapters]);
                } else if (stepKey === "step_3_video_prompts" && data?.chapters) {
                  currentChapters = data.chapters as ChapterData[];
                  setChapters([...currentChapters]);
                  setSteps((prev) =>
                    prev.map((s) =>
                      s.id === "step_3_video_prompts"
                        ? { ...s, status: "completed", detail: undefined }
                        : s
                    )
                  );
                } else if (stepKey.startsWith("polish_ch_") && data) {
                  const chNum = Number(data.chapter_number);
                  const polished = String(data.polished_content || "");
                  currentChapters = currentChapters.map((c) =>
                    c.chapter_number === chNum ? { ...c, polished_content: polished } : c
                  );
                  setChapters([...currentChapters]);
                } else if (stepKey === "step_4_polish" && data?.chapters) {
                  currentChapters = data.chapters as ChapterData[];
                  setChapters([...currentChapters]);
                  setSteps((prev) =>
                    prev.map((s) =>
                      s.id === "step_4_polish"
                        ? { ...s, status: "completed", detail: undefined }
                        : s
                    )
                  );
                } else if (stepKey === "step_5_pitch" && data?.pitch) {
                  currentPitch = data.pitch as PitchNoteData;
                  setPitch(currentPitch);
                  setActiveTab("pitch");
                  setSteps((prev) =>
                    prev.map((s) =>
                      s.id === "step_5_pitch"
                        ? { ...s, status: "completed", detail: undefined }
                        : s
                    )
                  );
                }
              }

              // 处理 ALL_COMPLETE
              if (event.type === "ALL_COMPLETE" && event.result) {
                const finalResult = event.result;
                setBible(finalResult.bible);
                setChapters(finalResult.chapters);
                setPitch(finalResult.pitch);
                if (finalResult.cover_url) {
                  setCoverUrl(finalResult.cover_url);
                }

                setSteps((prev) =>
                  prev.map((s) => ({ ...s, status: "completed", detail: undefined }))
                );
                setIsRunning(false);

                // 将本小说持久化入库到 projects 书架中
                const newProject: WorkflowProject = {
                  id: activeId,
                  title: finalResult.bible.title || "未命名小说",
                  cover_url: finalResult.cover_url || currentCoverUrl,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  prompt: prompt.trim(),
                  config: { ...config, prompt: prompt.trim() },
                  bible: finalResult.bible,
                  chapters: finalResult.chapters,
                  pitch: finalResult.pitch,
                  visual_assets: visualAssets,
                };

                setProjects((prev) => {
                  const existingIndex = prev.findIndex((p) => p.id === activeId);
                  let updatedList: WorkflowProject[];
                  if (existingIndex !== -1) {
                    updatedList = [...prev];
                    updatedList[existingIndex] = newProject;
                  } else {
                    updatedList = [newProject, ...prev];
                  }
                  try {
                    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(updatedList));
                  } catch {}
                  return updatedList;
                });
                syncProjectToCloud(newProject);

                // 全书精美成册并归档入库，弹出大作完成庆祝弹窗
                setModalState({ type: "book_published", project: newProject });
              }

              // 处理 ERROR
              if (event.type === "ERROR") {
                setErrorMessage(event.error || "执行出错");
                setIsRunning(false);
                setSteps((prev) =>
                  prev.map((s) =>
                    s.status === "running" ? { ...s, status: "error" } : s
                  )
                );
              }
            } catch (err) {
              console.error("解析 SSE 事件错误:", err);
            }
          }
        }
      }
    } catch (err: unknown) {
      const isAbort =
        err instanceof Error &&
        (err.name === "AbortError" || err.message === "Client aborted");
      if (!isAbort) {
        const msg =
          err instanceof Error ? err.message : "请求失败，请检查网络或配置";
        setErrorMessage(msg);
        setSteps((prev) =>
          prev.map((s) =>
            s.status === "running" ? { ...s, status: "error" } : s
          )
        );
      }
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  };

  // 导出全部工程为 JSON
  const handleExportJson = () => {
    if (!bible && !chapters.length) return;
    const projectData = {
      id: currentProjectId,
      title: bible?.title || "Novel_Project",
      cover_url: coverUrl,
      exportTime: new Date().toISOString(),
      prompt,
      config,
      bible,
      chapters,
      pitch,
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${bible?.title || "novel_project"}_full.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container-shell mx-auto py-6 sm:py-8 space-y-6">
      {/* 顶部介绍与赛道选择 */}
      <WorkflowIntro onSelectPreset={handleSelectPreset} />

      {/* 多小说书架画廊卡片流 */}
      <NovelShelf
        projects={projects}
        currentProjectId={currentProjectId}
        isRunning={isRunning}
        onSelectProject={handleSelectProject}
        onCreateNew={handleCreateNew}
        onReqDeleteProject={handleRequestDeleteProject}
        onBlockedAction={handleBlockedAction}
      />

      {/* 参数调优抽屉弹窗 */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onChange={handleConfigChange}
      />

      {/* 错误提示横幅 */}
      {errorMessage && (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs sm:text-sm text-rose-800 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
          >
            关闭
          </button>
        </div>
      )}

      {/* 核心双栏栅格布局：左边专属参数绑定，右边章节信息与多维视窗 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左栏：小说专属创作参数面板 (占 4 列) */}
        <div className="lg:col-span-4 space-y-5">
          {/* 输入控制台卡片 */}
          <div className="rounded-3xl border border-slate-900/10 bg-white/80 p-5 shadow-xs backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-700">
                  <Compass className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {bible?.title ? `《${bible.title}》参数绑定` : "小说专属创作参数"}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    {config.genre} · {config.chapterCount}章 · {config.style?.slice(0, 8)}...
                  </p>
                </div>
              </div>

              {/* 参数调优入口 */}
              <button
                type="button"
                onClick={() => {
                  if (isRunning) {
                    handleBlockedAction("当前流水线正在运行中，创作参数已被锁定，请等待生成完毕或中止后再调整。");
                    return;
                  }
                  setIsConfigOpen(true);
                }}
                disabled={isRunning}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-cyan-500/40 hover:text-cyan-700 transition-all shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>配置参数</span>
              </button>
            </div>

            {/* 灵感输入框 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">核心灵感与设定</label>
                {currentProjectId && (
                  <span className="text-[10px] text-cyan-700 bg-cyan-50 px-1.5 py-0.2 rounded font-mono">
                    已绑定当前书目
                  </span>
                )}
              </div>
              <textarea
                rows={5}
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                }}
                onBlur={handlePromptBlur}
                disabled={isRunning}
                placeholder="在此输入故事初始构思、核心悬念或反转设定...（例如：外科医生获得三秒时空回溯能力，在救女过程中卷入跨国活体长生阴谋）"
                className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-hidden disabled:bg-slate-50 transition-all resize-none shadow-2xs leading-relaxed"
              />
            </div>

            {/* 动作按钮组 */}
            <div className="flex items-center gap-2 pt-1">
              {isRunning ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-xs sm:text-sm font-bold text-white hover:bg-rose-700 transition-all shadow-sm cursor-pointer"
                >
                  <Square className="h-4 w-4 fill-current" />
                  <span>中止流水线</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartPipeline}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600 px-4 py-3 text-xs sm:text-sm font-bold text-white hover:opacity-95 transition-all shadow-md shadow-cyan-500/15 cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>{bible ? "重新生成本案" : "启动工业化流水线"}</span>
                </button>
              )}

              {/* 新建/重置按钮 */}
              <button
                type="button"
                onClick={handleReset}
                disabled={isRunning}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all disabled:opacity-40 shadow-2xs cursor-pointer"
                title="创作全新小说"
              >
                <Plus className="h-4 w-4" />
              </button>

              {/* 导出 JSON 按钮 */}
              {(bible || chapters.length > 0) && (
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all shadow-2xs cursor-pointer"
                  title="导出全套工程 JSON"
                >
                  <Download className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* 左侧五步流水线状态轴 */}
          <PipelineStepper
            steps={steps}
            currentStepIndex={currentStepIndex}
            onRetry={handleStartPipeline}
            isRunning={isRunning}
          />
        </div>

        {/* 右栏：章节信息与多维视窗看板 (占 8 列) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          {/* 右栏顶部 Tab 切换胶囊 */}
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5 overflow-x-auto hide-scrollbar">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("novel")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "novel"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>章节正文打字机</span>
                {chapters.length > 0 && (
                  <span className="rounded-full bg-slate-700 px-1.5 py-0.2 text-[10px] font-mono">
                    {chapters.length}章
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("video")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "video"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                <Clapperboard className="h-3.5 w-3.5" />
                <span>电影级分镜提示词</span>
                {chapters.some((c) => c.video_prompts?.length) && (
                  <span className="rounded-full bg-blue-500 px-1.5 py-0.2 text-[10px] font-mono text-white">
                    {chapters.reduce((a, c) => a + (c.video_prompts?.length || 0), 0)}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("assets")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "assets"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>视觉资产</span>
                {visualAssets.length > 0 && (
                  <span className="rounded-full bg-purple-500 px-1.5 py-0.2 text-[10px] font-mono text-white">
                    {visualAssets.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("pitch")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "pitch"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>商业投稿包装</span>
                {pitch && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("bible")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "bible"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>专属设定集 Bible</span>
              </button>
            </div>
          </div>

          {/* Tab 内容区 */}
          <div className="flex-1 min-h-[480px]">
            {activeTab === "novel" && (
              <NovelViewer
                key={currentProjectId || "current"}
                bible={bible}
                chapters={chapters}
                config={config}
                streamingText={streamingText}
                streamingChapter={streamingChapter}
                isStreaming={isRunning && steps[1].status === "running"}
                onUpdateChapter={handleUpdateChapter}
              />
            )}

            {activeTab === "video" && <VideoPromptBoard chapters={chapters} />}

            {activeTab === "assets" && (
              <VisualAssetsBoard
                projectId={currentProjectId || undefined}
                bible={bible}
                coverUrl={coverUrl}
                visualAssets={visualAssets}
                config={config}
                onSaveVisualAsset={handleSaveVisualAsset}
                onQueueBusy={(msg) =>
                  setModalState({
                    type: "queue_busy",
                    message: msg,
                  })
                }
                onSecurityAlert={(msg) =>
                  setModalState({
                    type: "security_alert",
                    message: msg,
                  })
                }
                onQuotaLimit={(msg) =>
                  setModalState({
                    type: "quota_limit",
                    message: msg,
                  })
                }
              />
            )}

            {activeTab === "pitch" && <PitchCard pitch={pitch} />}

            {activeTab === "bible" && (
              <div className="rounded-3xl border border-slate-900/10 bg-white/90 p-5 shadow-xs backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      作品设定集与人物卡 (Bible)
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      世界观、角色卡、伏笔清单与分章细纲
                    </p>
                  </div>
                  {bible && (
                    <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-xl border border-cyan-200">
                      《{bible.title}》
                    </span>
                  )}
                </div>

                {bible ? (
                  <div className="space-y-4 text-xs">
                    {/* 一句话核心梗概 */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
                      <p className="font-bold text-slate-800">一句话核心钩子</p>
                      <p className="text-slate-600">{bible.logline}</p>
                    </div>

                    {/* 世界观 */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
                      <p className="font-bold text-slate-800">底层世界观与规则体系</p>
                      <p className="text-slate-600 leading-relaxed">{bible.worldview}</p>
                    </div>

                    {/* 人物卡 */}
                    <div className="space-y-2">
                      <p className="font-bold text-slate-800">主要人物卡 ({bible.characters.length})</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {bible.characters.map((char, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-slate-100 bg-white p-3 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{char.name}</span>
                              <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                {char.role}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600">
                              <strong>性格：</strong>{char.personality}
                            </p>
                            <p className="text-[11px] text-slate-600">
                              <strong>动机：</strong>{char.motivation}
                            </p>
                            {char.visual_traits && (
                              <p className="text-[11px] text-slate-500">
                                <strong>视觉：</strong>{char.visual_traits}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 章节细纲 */}
                    <div className="space-y-2">
                      <p className="font-bold text-slate-800">分章细纲 ({bible.outlines.length})</p>
                      <div className="space-y-2">
                        {bible.outlines.map((ot) => (
                          <div
                            key={ot.chapter_number}
                            className="rounded-xl border border-slate-100 bg-white p-3 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">
                                第 {ot.chapter_number} 章：{ot.title}
                              </span>
                            </div>
                            <p className="text-slate-600">
                              <strong>目标：</strong>{ot.goal}
                            </p>
                            <p className="text-slate-600">
                              <strong>冲突：</strong>{ot.conflict}
                            </p>
                            <p className="text-cyan-700">
                              <strong>章末悬念：</strong>{ot.hook}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                    <BookOpen className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-xs">等待流水线 Step 1 生成作品设定集...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 业务状态交互弹窗 (删除二次确认 / 并发拦截 / 全案成册庆祝) */}
      <WorkflowModal
        state={modalState}
        onClose={() => setModalState({ type: "idle" })}
        onConfirmDelete={handleConfirmDelete}
        onViewBook={(id) => {
          handleSelectProject(id);
          setActiveTab("novel");
        }}
        onGoAssets={() => setActiveTab("assets")}
      />
    </div>
  );
}
