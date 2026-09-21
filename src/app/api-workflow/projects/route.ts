import { NextRequest, NextResponse } from "next/server";
import { requestOwner } from "@/lib/server-security";
import { listUserProjects, saveUserProject, deleteUserProject } from "@/lib/workflow-db";
import type { WorkflowProject } from "@/types/workflow";

export const dynamic = "force-dynamic";

/**
 * 获取当前登录用户的小说列表
 */
export async function GET(request: NextRequest) {
  const userId = await requestOwner(request);
  if (!userId) {
    return NextResponse.json({ success: false, error: "未登录或登录已过期" }, { status: 401 });
  }

  const projects = await listUserProjects(userId);
  return NextResponse.json({ success: true, projects });
}

/**
 * 保存或更新当前登录用户的小说
 */
export async function POST(request: NextRequest) {
  const userId = await requestOwner(request);
  if (!userId) {
    return NextResponse.json({ success: false, error: "未登录或登录已过期" }, { status: 401 });
  }

  let project: WorkflowProject;
  try {
    project = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "无效的 JSON 数据" }, { status: 400 });
  }

  if (!project.id) {
    return NextResponse.json({ success: false, error: "缺少工程 ID" }, { status: 400 });
  }

  const ok = await saveUserProject(userId, project);
  if (!ok) {
    return NextResponse.json({ success: false, error: "数据库保存失败" }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "已同步保存至云端书架" });
}

/**
 * 删除当前登录用户的指定小说
 */
export async function DELETE(request: NextRequest) {
  const userId = await requestOwner(request);
  if (!userId) {
    return NextResponse.json({ success: false, error: "未登录或登录已过期" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("id");

  if (!projectId) {
    return NextResponse.json({ success: false, error: "缺少 projectId 参数" }, { status: 400 });
  }

  const ok = await deleteUserProject(userId, projectId);
  if (!ok) {
    return NextResponse.json({ success: false, error: "删除失败" }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "已成功删除" });
}
