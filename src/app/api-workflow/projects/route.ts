import { NextRequest, NextResponse } from 'next/server';
import { requestOwner, readJsonBody, sameOrigin } from '@/lib/server-security';
import { listUserProjects, getUserProject, createUserProject, patchUserProject, deleteUserProject } from '@/lib/workflow-db';
import { validProjectId, WorkflowProjectError } from '@/lib/workflow-projects.mjs';
import type { WorkflowProject } from '@/types/workflow';

export const dynamic = 'force-dynamic';

function failure(error: unknown) {
  const status = error instanceof WorkflowProjectError ? error.status : 503;
  const code = error instanceof WorkflowProjectError ? error.code : 'STORAGE_UNAVAILABLE';
  const message = code === 'PROJECT_CONFLICT' ? '此工程已有较新的修改，草稿已保留，请重新加载后核对再保存。'
    : code === 'PROJECT_NOT_FOUND' ? '小说不存在或无权访问。'
    : status === 400 ? '工程数据不完整或格式不正确，请重新加载。'
    : '云端暂时无法读取或保存，请稍后重试。';
  if (status >= 500) console.error('[WorkflowProjects]', (error as { code?: string })?.code || 'STORAGE_UNAVAILABLE');
  return NextResponse.json({ success: false, code, error: message }, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

export async function GET(request: NextRequest) {
  try {
    const userId = await requestOwner(request);
    if (!userId) return NextResponse.json({ success: false, error: '未登录或登录已过期' }, { status: 401 });
    const query = request.nextUrl.searchParams;
    const id = query.get('id');
    if (id) {
      const project = await getUserProject(userId, id);
      if (!project) throw new WorkflowProjectError('PROJECT_NOT_FOUND', 404);
      return NextResponse.json({ success: true, project }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    const offset = Number(query.get('offset') || 0);
    const limit = Number(query.get('limit') || 12);
    if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1) throw new WorkflowProjectError('INVALID_PROJECT');
    const list = await listUserProjects(userId, offset, limit);
    return NextResponse.json({ success: true, ...list }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return failure(error); }
}

async function save(request: NextRequest, patch: boolean) {
  try {
    if (!sameOrigin(request)) return NextResponse.json({ success: false, error: '请求来源不合法' }, { status: 403 });
    const userId = await requestOwner(request);
    if (!userId) return NextResponse.json({ success: false, error: '未登录或登录已过期' }, { status: 401 });
    let body: Record<string, unknown>;
    try { body = await readJsonBody(request, 12 * 1024 * 1024); }
    catch { throw new WorkflowProjectError('INVALID_PROJECT'); }
    if (!validProjectId(body.id)) throw new WorkflowProjectError('INVALID_PROJECT');
    const project = patch ? await patchUserProject(userId, String(body.id), String(body.revision || ''), body.patch)
      : await createUserProject(userId, body as unknown as WorkflowProject);
    return NextResponse.json({ success: true, project }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return failure(error); }
}

export function POST(request: NextRequest) { return save(request, false); }
export function PATCH(request: NextRequest) { return save(request, true); }

export async function DELETE(request: NextRequest) {
  try {
    if (!sameOrigin(request)) return NextResponse.json({ success: false, error: '请求来源不合法' }, { status: 403 });
    const userId = await requestOwner(request);
    if (!userId) return NextResponse.json({ success: false, error: '未登录或登录已过期' }, { status: 401 });
    const id = request.nextUrl.searchParams.get('id');
    if (!validProjectId(id)) throw new WorkflowProjectError('INVALID_PROJECT');
    await deleteUserProject(userId, id!);
    return NextResponse.json({ success: true });
  } catch (error) { return failure(error); }
}
