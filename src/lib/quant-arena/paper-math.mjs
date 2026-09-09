/** Historical peak-to-trough drawdown, expressed as a positive percentage. */
export function maximumDrawdown(equities) {
  let peak=0,drawdown=0;
  for(const value of equities){
    if(!Number.isFinite(value)||value<0)throw new Error("Invalid equity");
    peak=Math.max(peak,value);
    if(peak>0)drawdown=Math.max(drawdown,(peak-value)/peak*100);
  }
  return Math.round(drawdown*100)/100;
}
