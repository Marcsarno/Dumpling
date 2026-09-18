/** Complete the first-play lesson with real touch input, shared by regression harnesses. */
export async function learnFirstChain(page){
  const lesson=await page.evaluate(()=>(window.pop?.snapshot()??window.__roomTest?.snapshot().loop.pop)?.state==='lesson');
  if(!lesson)return;
  const cdp=await page.context().newCDPSession(page),b=await page.locator('#squishy-pop canvas').boundingBox();
  for(let n=0;n<3;n++){await cdp.send('Input.dispatchTouchEvent',{type:n?'touchMove':'touchStart',touchPoints:[{id:1,x:b.x+(n+.5)*b.width/6,y:b.y+2.5*b.width/6}]});await page.waitForTimeout(40);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
}
