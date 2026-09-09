import { NextResponse } from "next/server";
import { listPublishedPosts } from "@/lib/posts-repository";
import { chunkMarkdown, rankChunks } from "@/lib/markdown-core.mjs";
export async function GET(request:Request) {
  const query=(new URL(request.url).searchParams.get("q")||"").trim();
  if(query.length<2)return NextResponse.json({items:[]});
  if(query.length>128)return NextResponse.json({error:"搜索内容过长"},{status:400});
  try {
    const chunks=(await listPublishedPosts()).flatMap(post=>chunkMarkdown(post));
    const found=rankChunks(chunks,query,24);
    const unique=new Map<string,{href:string;label:string}>();
    for(const result of found){const key=`${result.chunk.collection}/${result.chunk.postSlug}`;if(!unique.has(key))unique.set(key,{href:result.sourceUrl,label:result.chunk.title});}
    return NextResponse.json({items:[...unique.values()].slice(0,8)},{headers:{"Cache-Control":"no-store"}});
  } catch {return NextResponse.json({error:"内容搜索暂不可用",items:[]},{status:503});}
}
