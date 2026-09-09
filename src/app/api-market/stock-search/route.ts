import { NextResponse } from "next/server";
import { getRealStockQuotes } from "@/lib/quotes-service";
type Suggestion={Classify?:string;SecurityTypeName?:string;Code?:string;Name?:string;PinYin?:string};
export async function GET(request:Request) {
  const query=(new URL(request.url).searchParams.get("q")||"").trim();
  if(!query)return NextResponse.json({success:true,items:[]});
  if(query.length>64)return NextResponse.json({error:"搜索内容过长"},{status:400});
  try {
    const response=await fetch(`https://searchapi.eastmoney.com/api/suggest/get?type=14&token=D43BF722C8E333C90704E3A9F6F6AC15&input=${encodeURIComponent(query)}`,{cache:"no-store",signal:AbortSignal.timeout(5000)});
    if(!response.ok)throw new Error("Unavailable");
    const data=await response.json();
    const rows:Suggestion[]=Array.isArray(data?.QuotationCodeTable?.Data)?data.QuotationCodeTable.Data:[];
    const items=rows.filter(item=>item.Classify==="AStock"&&typeof item.Code==="string"&&/^\d{6}$/.test(item.Code)).slice(0,6).map(item=>({code:item.Code!,name:item.Name||item.Code!,market:item.SecurityTypeName||"",pinyin:item.PinYin||""}));
    const quotes=await getRealStockQuotes(items.map(item=>item.code));
    return NextResponse.json({success:true,items:items.map(item=>({...item,current_price:quotes[item.code]?.current_price??null,day_change_pct:quotes[item.code]?.change_pct??null,quote_time:quotes[item.code]?.timestamp??null}))});
  } catch {return NextResponse.json({success:false,error:"证券搜索暂不可用"},{status:503});}
}
