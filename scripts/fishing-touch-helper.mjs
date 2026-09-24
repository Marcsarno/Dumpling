import assert from 'node:assert/strict';
/** Drive actual touch controls; never mutate the fishing simulation. */
export async function landFish(page,cdp,{photo}={}){
 let reel=true,active=new Map(),photographed=false,rests=0,steered=false;
 const point=async(selector,id)=>{const b=await page.locator(selector).boundingBox();return{id,x:b.x+b.width/2,y:b.y+b.height/2}};
 const action=await point('#fish-action',11),left=await point('#fish-left',12),right=await point('#fish-right',13);
 const change=async next=>{if([...active.keys()].join(',')===[...next.keys()].join(','))return;if(active.size)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});active=new Map(next);if(active.size)await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[...active.values()]});};
 try{for(let i=0;i<700;i++){const s=await page.evaluate(()=>window.__roomTest.snapshot().loop.fishing);if(s.phase!=='reel'){assert.equal(s.phase,'catch');return{rests,steered,seconds:s.fightTime};}if(s.tension>.76){reel=false;rests++;}else if(s.tension<.28)reel=true;const next=new Map();if(reel)next.set(11,action);if(s.pull){const p=s.pull<0?left:right;next.set(p.id,p);steered=true;}await change(next);if(photo&&s.pull&&!photographed){await page.screenshot({path:photo});photographed=true;}await page.waitForTimeout(60);}await page.screenshot({path:'artifacts/npc-upgrade/battle-timeout.png'});throw Error('Fishing battle timed out');}finally{await change(new Map());}
}
