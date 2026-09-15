import {Vec3} from 'playcanvas';
import type {Bedroom} from '../game/bedroom';

/** Small floor-grid route planner shared by autonomous household characters. */
export class HousePath {
  constructor(private house:Bedroom,private radius=.17){}
  free(x:number,z:number){
    for(const a of [x-this.radius,x+this.radius])for(const b of [z-this.radius,z+this.radius])if(!this.house.walkable?.some(r=>a>=r.minX&&a<=r.maxX&&b>=r.minZ&&b<=r.maxZ))return false;
    return !this.house.obstacles.some(o=>Math.abs(x-o.center.x)<=o.halfExtents.x+this.radius&&Math.abs(z-o.center.z)<=o.halfExtents.z+this.radius);
  }
  line(a:Vec3,b:Vec3){const n=Math.ceil(a.distance(b)/.08);for(let i=1;i<=n;i++)if(!this.free(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n))return false;return true;}
  route(start:Vec3,end:Vec3):Vec3[]{
    if(!this.free(end.x,end.z))return [];
    if(this.line(start,end))return [end.clone()];
    const step=.25,key=(x:number,z:number)=>x+','+z;
    type Node={x:number;z:number;g:number;f:number;parent?:Node};
    const open:Node[]=[{x:Math.round(start.x/step),z:Math.round(start.z/step),g:0,f:0}],cost=new Map<string,number>();let finish:Node|undefined;
    for(let iterations=0;open.length&&iterations<5000;iterations++){
      open.sort((a,b)=>a.f-b.f);const current=open.shift()!,p=new Vec3(current.x*step,0,current.z*step);
      if(p.distance(end)<.4&&this.line(p,end)){finish=current;break;}
      for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
        const x=current.x+dx,z=current.z+dz,v=new Vec3(x*step,0,z*step),g=current.g+Math.hypot(dx,dz),k=key(x,z);
        if(g>=(cost.get(k)??Infinity)||!this.free(v.x,v.z)||!this.line(p,v))continue;
        cost.set(k,g);open.push({x,z,g,f:g+v.distance(end)/step,parent:current});
      }
    }
    if(!finish)return [];
    const path=[end.clone()];while(finish){path.unshift(new Vec3(finish.x*step,0,finish.z*step));finish=finish.parent;}
    path[0]=start.clone();const result:Vec3[]=[];
    for(let i=0;i<path.length-1;){let j=path.length-1;while(j>i+1&&!this.line(path[i],path[j]))j--;result.push(path[j]);i=j;}
    return result;
  }
}
