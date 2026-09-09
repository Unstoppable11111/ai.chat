import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({success:false,data_status:"UNAVAILABLE",error:"尚无经过验证的策略信号数据，自动选股与交易暂停",signals:{aggressive:[],balanced:[],conservative:[]}},{status:503});
}
