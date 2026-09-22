export type SquishStyle=0|1|2;
/** Press, stretch, and side-to-side jelly wobble. Always returns to neutral. */
export function squishPose(time:number,style:SquishStyle){
 const t=Math.max(0,Math.min(1,time/.95)),wave=Math.sin(t*Math.PI),bounce=Math.sin(t*Math.PI*4)*(1-t);
 if(style===1){const y=1+.38*wave;return {scale:[1/Math.sqrt(y),y,1/Math.sqrt(y)] as [number,number,number],roll:0};}
 if(style===2){const x=1+.20*bounce;return {scale:[x,1/Math.sqrt(x),1/Math.sqrt(x)] as [number,number,number],roll:12*bounce||0};}
 const y=1-.30*wave;return {scale:[1/Math.sqrt(y),y,1/Math.sqrt(y)] as [number,number,number],roll:0};
}
