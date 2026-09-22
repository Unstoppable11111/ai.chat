import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { inspectGeneratedImage, MAX_GENERATED_IMAGE_BYTES, resolveGeneratedAssetPath } from "@/lib/workflow-utils.mjs";

export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await context.params;
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // 1. 安全过滤目录穿越
    const cleanSegments = pathSegments.filter(
      (segment) => segment && segment !== ".." && segment !== "."
    );
    if (cleanSegments.length !== pathSegments.length) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // 2. 寻址候选存储路径
    const targetFilePath = resolveGeneratedAssetPath(cleanSegments);
    if (!targetFilePath) {
      return new NextResponse("File Not Found", { status: 404 });
    }

    // 3. 读取本地图片二进制并附带长效缓存头响应
    const fileBuffer = await fs.promises.readFile(targetFilePath);
    const ext = path.extname(targetFilePath).toLowerCase();
    const format = inspectGeneratedImage(fileBuffer);
    const contentType = MIME_TYPES[ext];
    if (fileBuffer.length > MAX_GENERATED_IMAGE_BYTES || !format || format.mimeType !== contentType) {
      return new NextResponse("Unsupported image", { status: 415 });
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[GeneratedAssetRoute] Error serving generated file:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
