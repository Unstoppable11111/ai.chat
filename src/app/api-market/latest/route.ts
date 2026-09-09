import { NextResponse } from "next/server";
export async function GET() {
  try {
    const response=await fetch(`${process.env.QUANT_API_URL||"http://127.0.0.1:8100"}/api/v1/market/latest`,{cache:"no-store",signal:AbortSignal.timeout(8000)});
    if(!response.ok)throw new Error("Unavailable");
    const data=await response.json();
    if(!Array.isArray(data.indices)||!data.indices.length)throw new Error("No quotes");
    const indices=data.indices.filter((row: {code?:string;close?:number;change_pct?:number})=>typeof row.code==="string"&&Number.isFinite(row.close)&&Number(row.close)>0&&Number.isFinite(row.change_pct));
    if(!indices.length)throw new Error("Invalid quotes");
    return NextResponse.json({success:true,indices,market_date:data.market_date,snapshot_time:data.snapshot_time,last_updated:data.last_updated,data_status:"DELAYED",market_state:"暂不评估",market_score:null,confidence:"unknown",total_turnover:Number.isFinite(data.total_turnover)&&data.total_turnover>0?data.total_turnover:null},{headers:{"Cache-Control":"private, no-store"}});
  } catch {return NextResponse.json({success:false,data_status:"UNAVAILABLE",error:"行情暂不可用，未生成市场判断"},{status:503});}
}
