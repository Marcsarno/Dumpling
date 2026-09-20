import {Vec3} from 'playcanvas';
export const BED_ENTRY_SECONDS=3.2;
/** Matched to SleepEnter's reach, tuck, sit and recline keys. */
export function bedEntry(start:Vec3,startYaw:number,crib:boolean,progress:number){
 const end=crib?new Vec3(9.8,.09,-1.70):new Vec3(-2.05,.09,-1.85),yaw=crib?90:0;
 const keys=crib?[
  {t:0,p:start,h:.027,y:startYaw},{t:.20,p:new Vec3(8.55,.09,-1.3),h:.12,y:90},
  {t:.43,p:new Vec3(8.76,.09,-1.5),h:1.22,y:90},{t:.65,p:new Vec3(9.45,.09,-1.7),h:1.22,y:90},{t:1,p:end,h:.65,y:yaw},
 ]:[
  {t:0,p:start,h:.027,y:startYaw},{t:.20,p:new Vec3(-1.0,.09,-1.75),h:.08,y:90},
  {t:.43,p:new Vec3(-1.35,.09,-1.85),h:.91,y:90},{t:.65,p:new Vec3(-1.8,.09,-1.85),h:.91,y:35},{t:1,p:end,h:.91,y:yaw},
 ];
 const t=Math.max(0,Math.min(1,progress)),b=keys.findIndex(k=>k.t>=t),i=Math.max(1,b),a=keys[i-1],z=keys[i],raw=(t-a.t)/(z.t-a.t),u=raw*raw*(3-2*raw),delta=((z.y-a.y+540)%360)-180;
 return {position:new Vec3().lerp(a.p,z.p,u),height:a.h+(z.h-a.h)*u,yaw:a.y+delta*u};
}
