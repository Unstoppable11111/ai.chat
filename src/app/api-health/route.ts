import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
export async function GET() {
  try {
    const result=await executeQuery("SELECT id FROM studio_users LIMIT 0");
    await executeQuery("SELECT metadata,status,rag_ready FROM posts LIMIT 0");
    if(!result)throw new Error("Not configured");
    return NextResponse.json({status:"ready",release:process.env.RELEASE_ID||"local"},{headers:{"Cache-Control":"no-store"}});
  } catch {return NextResponse.json({status:"unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});}
}
