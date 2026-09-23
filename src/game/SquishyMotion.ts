const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(n:number)=>{const x=clamp(n);return x*x*(3-2*x);};
export const SQUISHY_REVEAL_SECONDS=2.85;
/** Wind-up, snappy hinge release, a reward arc, then a volume-preserving soft landing. */
export function squishyOpeningPose(seconds:number,intensity=1){
 if(seconds>=SQUISHY_REVEAL_SECONDS)return {lid:-112,height:.34,scale:[1,1,1] as [number,number,number],wiggle:0};
 const launch=smooth((seconds-.92)/.62),fall=smooth((seconds-1.54)/.67);
 const height=.11+1.02*launch-.79*fall;
 const size=.51+.49*launch;
 const stretch=1+.17*intensity*Math.sin(launch*Math.PI)-.16*intensity*Math.sin(smooth((seconds-2.12)/.50)*Math.PI);
 const lid=-112*smooth((seconds-.76)/.40)-9*Math.sin(smooth((seconds-1.16)/.35)*Math.PI);
 const tension=clamp(seconds/.76);
 return {lid,height:height+.02*Math.sin(smooth((seconds-2.21)/.64)*Math.PI),scale:[size/Math.sqrt(stretch),size*stretch,size/Math.sqrt(stretch)] as [number,number,number],wiggle:seconds<.76?Math.sin(seconds*42)*tension*tension*4:0};
}
