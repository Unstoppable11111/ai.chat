import { NextResponse } from "next/server";
export async function GET() {
  try {
    const res=await fetch("https://money.finance.sina.com.cn/q/view/newSinaHy.php",{headers:{Referer:"https://finance.sina.com.cn"},cache:"no-store",signal:AbortSignal.timeout(5000)});
    if(!res.ok)throw new Error("Unavailable");
    const text=new TextDecoder("gbk").decode(await res.arrayBuffer());
    const match=text.match(/\{[\s\S]*\}/);if(!match)throw new Error("Invalid response");
    const parsed:unknown=JSON.parse(match[0]);if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new Error("Invalid response");
    const sectors=Object.values(parsed).filter((row):row is string=>typeof row==="string").map(row=>{
      const p=row.split(",");return {code:p[0],name:p[1],change_pct:Number(p[5]),amount:Number(p[7]),leader_name:p[12]||"--",leader_change:Number(p[9])};
    }).filter(row=>row.code&&row.name&&Number.isFinite(row.change_pct)&&Number.isFinite(row.amount)).sort((a,b)=>b.change_pct-a.change_pct);
    if(!sectors.length)throw new Error("No sectors");
    return NextResponse.json({success:true,source:"sina",data_status:"DELAYED",top_sectors:sectors.slice(0,6),lagging_sectors:sectors.slice(-3).reverse(),total_sectors_tracked:sectors.length});
  } catch {return NextResponse.json({success:false,error:"行业行情暂不可用",top_sectors:[]},{status:503});}
}
