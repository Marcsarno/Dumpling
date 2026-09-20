import {Vec3,type Entity} from 'playcanvas';
import {HousePath} from '../components/HousePath';
import type {Bedroom} from './bedroom';
/** Small, collision-aware strolls with idle breaks. Tornado temporarily owns the dog. */
export class DogRoaming {
 private path:HousePath;private route:Vec3[]=[];private wait=4;private blocked=0;private last=-1;
 private spots=[[4.7,6],[3.3,5.8],[1.2,7.8],[.6,10.8],[1.6,11.8],[4.7,11.6],[1.1,4.6]];
 constructor(house:Bedroom,private root:Entity){this.path=new HousePath(house,.19);}
 update(dt:number,active:boolean,people:Vec3[]){
  if(!active){this.route=[];this.wait=3;return;}
  if(this.wait>0){this.wait-=dt;return;}
  const p=this.root.getPosition();
  if(!this.route.length){const candidates=this.spots.map((s,i)=>({i,p:new Vec3(s[0],0,s[1])})).filter(s=>s.i!==this.last&&this.path.free(s.p.x,s.p.z)&&s.p.distance(p)>1);const choice=candidates[Math.floor(Math.random()*candidates.length)];if(choice){this.route=this.path.route(new Vec3(p.x,0,p.z),choice.p);this.last=choice.i;}if(!this.route.length)this.wait=3;return;}
  const next=this.route[0],delta=new Vec3(next.x-p.x,0,next.z-p.z),distance=delta.length();if(distance<.015){this.route.shift();if(!this.route.length)this.wait=4+Math.random()*6;return;}
  delta.normalize();const q=p.clone().add(delta.clone().mulScalar(Math.min(distance,dt*.3)));
  if(people.some(person=>Math.hypot(person.x-q.x,person.z-q.z)<.48)||!this.path.free(q.x,q.z)){this.blocked+=dt;if(this.blocked>2){this.route=[];this.wait=2;this.blocked=0;}return;}
  this.blocked=0;this.root.setPosition(q.x,.04,q.z);this.root.setEulerAngles(0,Math.atan2(delta.x,delta.z)*180/Math.PI,0);
 }
}
