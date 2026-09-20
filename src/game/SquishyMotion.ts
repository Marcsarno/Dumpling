const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(n:number)=>{const x=clamp(n);return x*x*(3-2*x);};
export const SQUISHY_REVEAL_SECONDS=2.85;
/** Hinge opens before the toy unfolds; the settled shape has exactly its bind volume. */
export function squishyOpeningPose(seconds:number,intensity=1){
 if(seconds>=SQUISHY_REVEAL_SECONDS)return {lid:-112,height:.34,scale:[1,1,1] as [number,number,number],wiggle:0};
 const lift=smooth((seconds-.90)/1.05),settle=Math.max(0,seconds-1.95);
 const bounce=seconds>1.95?Math.sin(settle*12)*Math.exp(-settle*6)*.048*intensity:0;
 const height=.11+.39*lift-.16*smooth((seconds-1.95)/.75)+bounce;
 const size=.51+.49*lift,stretch=1+Math.sin(lift*Math.PI)*.14*intensity+(seconds>1.95?Math.sin(settle*12)*Math.exp(-settle*7)*.075*intensity:0);
 const lid=smooth((seconds-.40)/.92);
 return {lid:-112*lid,height,scale:[size/Math.sqrt(stretch),size*stretch,size/Math.sqrt(stretch)] as [number,number,number],wiggle:seconds<.55?Math.sin(seconds*31)*Math.sin(seconds/.55*Math.PI)*2:0};
}
