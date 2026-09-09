import { NextResponse } from "next/server";
import { listPublishedPosts } from "@/lib/posts-repository";
import { readJsonBody } from "@/lib/server-security";
import { POST as updateReaction } from "@/app/api-post-like/route";
type Context={params:Promise<{slug:string}>};
export async function GET(_request:Request,{params}:Context) {
  try {
    const {slug}=await params;const post=(await listPublishedPosts()).find(item=>item.slug===slug);
    return post?NextResponse.json({views:post.views,likes:post.likes}):NextResponse.json({error:"文章不存在"},{status:404});
  } catch {return NextResponse.json({error:"统计暂时不可用"},{status:503});}
}
export async function POST(request:Request,{params}:Context) {
  try {
    const {slug}=await params;const body=await readJsonBody(request,2048);
    const result=await updateReaction(new Request(request.url,{method:"POST",headers:request.headers,body:JSON.stringify({...body,slug})}));
    const data=await result.json();return NextResponse.json({...data,...data.data},{status:result.status,headers:result.headers});
  } catch {return NextResponse.json({error:"请求无效"},{status:400});}
}
