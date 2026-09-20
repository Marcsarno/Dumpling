import {Entity,Vec3} from 'playcanvas';
const spaces=new Map<string,{entity:Entity;origin:Vec3}>();
export function registerPropSpace(key:string,entity:Entity,origin:Vec3){spaces.set(key,{entity,origin});}
/** Convert original authored coordinates to the saved Editor prop's current space. */
export function propPoint(key:string,point:Vec3){const s=spaces.get(key);return s?s.entity.getWorldTransform().transformPoint(point.clone().sub(s.origin)):point.clone();}
export function propTuple(key:string,point:[number,number,number]){return propPoint(key,new Vec3(...point)).toArray() as [number,number,number];}
export function propYaw(key:string,yaw:number){return yaw+(spaces.get(key)?.entity.getEulerAngles().y??0);}
export function propHeight(key:string,y:number){const s=spaces.get(key);return s?s.entity.getPosition().y+y*s.entity.getLocalScale().y:y;}
