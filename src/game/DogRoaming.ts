import {Vec3,type Entity} from 'playcanvas';
import {HousePath} from '../components/HousePath';
import type {Bedroom} from './bedroom';
import type {DailyLife} from './DailyLife';
/** Small, collision-aware strolls with idle breaks. Tornado temporarily owns the dog. */
export class DogRoaming {
 private path:HousePath;private route:Vec3[]=[];private wait=4;private blocked=0;private last=-1;
 private spots=[[4.7,6],[3.3,5.8],[1.2,7.8],[.6,10.8],[1.6,11.8],[4.7,11.6],[1.1,4.6]];
 private state='roaming';private bowlWait=20+Math.random()*20;private meals=0;
 private fetch:{toy:Entity;player:Entity;drop:()=>void;carrying:boolean;time:number}|null=null;
 fetchToy(toy:Entity,player:Entity,drop:()=>void){
  if(this.fetch||this.state!=='roaming'||this.daily.hasDogFood||toy.getPosition().distance(this.root.getPosition())>7)return false;
  const p=toy.getPosition(),route=this.path.route(this.root.getPosition().clone().set(this.root.getPosition().x,0,this.root.getPosition().z),new Vec3(p.x,0,p.z));if(!route.length)return false;
  this.fetch={toy,player,drop,carrying:false,time:0};this.route=route;this.wait=0;this.state='fetch';return true;
 }
 constructor(house:Bedroom,private root:Entity,private daily:DailyLife){this.path=new HousePath(house,.19);}
 update(dt:number,active:boolean,people:Vec3[]){
  if(this.fetch){const job=this.fetch;job.time+=dt;
   if(!active||job.time>15){job.drop();this.fetch=null;this.route=[];this.state='roaming';return;}
   const p=this.root.getPosition(),next=this.route[0];
   if(next){const delta=new Vec3(next.x-p.x,0,next.z-p.z),d=delta.length();if(d<.08)this.route.shift();else {delta.normalize();const q=p.clone().add(delta.clone().mulScalar(Math.min(d,dt*.8)));if(!people.some(v=>Math.hypot(q.x-v.x,q.z-v.z)<.38)&&this.path.free(q.x,q.z)){this.root.setPosition(q);this.root.setEulerAngles(0,Math.atan2(delta.x,delta.z)*180/Math.PI,0);}}}
   else if(!job.carrying){const a=job.player.getPosition();for(const [dx,dz]of [[.7,0],[-.7,0],[0,.7],[0,-.7]]){const route=this.path.route(new Vec3(p.x,0,p.z),new Vec3(a.x+dx,0,a.z+dz));if(route.length){this.route=route;job.carrying=true;break;}}if(!job.carrying){job.drop();this.fetch=null;this.state='roaming';}}
   else {job.drop();this.fetch=null;this.state='roaming';this.wait=4;}
   if(job.carrying){const f=this.root.forward;job.toy.setPosition(p.x-f.x*.22,.22,p.z-f.z*.22);}return;
  }
  if(!active){this.route=[];this.wait=3;this.state='roaming';return;}
  this.bowlWait-=dt;
  if(this.state==='eating'){
   this.wait-=dt;if(this.wait<=0){this.daily.consumeDogFood();this.meals++;this.state='roaming';this.wait=5;this.bowlWait=40+Math.random()*30;}return;
  }
  if(this.wait>0){this.wait-=dt;return;}
  const p=this.root.getPosition();
  if(this.state==='roaming'&&this.bowlWait<=0&&this.daily.hasDogFood){
   const bowl=this.daily.bowlPosition;
   for(const [dx,dz] of [[0,.5],[-.5,0],[0,-.5],[.5,0]]){
    const goal=new Vec3(bowl.x+dx,0,bowl.z+dz);if(!this.path.free(goal.x,goal.z))continue;
    const route=this.path.route(new Vec3(p.x,0,p.z),goal);if(route.length){this.route=route;this.state='to-bowl';break;}
   }
   this.bowlWait=20;
  }
  if(!this.route.length&&this.state==='to-bowl'){
   const bowl=this.daily.bowlPosition;if(Math.hypot(p.x-bowl.x,p.z-bowl.z)<.75){this.state='eating';this.wait=3+Math.random()*2;this.root.setEulerAngles(0,Math.atan2(bowl.x-p.x,bowl.z-p.z)*180/Math.PI,0);return;}this.state='roaming';
  }
  if(!this.route.length){const candidates=this.spots.map((s,i)=>({i,p:new Vec3(s[0],0,s[1])})).filter(s=>s.i!==this.last&&this.path.free(s.p.x,s.p.z)&&s.p.distance(p)>1);const choice=candidates[Math.floor(Math.random()*candidates.length)];if(choice){this.route=this.path.route(new Vec3(p.x,0,p.z),choice.p);this.last=choice.i;}if(!this.route.length)this.wait=3;return;}
  const next=this.route[0],delta=new Vec3(next.x-p.x,0,next.z-p.z),distance=delta.length();if(distance<.015){this.route.shift();if(!this.route.length&&this.state==='roaming')this.wait=4+Math.random()*6;return;}
  delta.normalize();const q=p.clone().add(delta.clone().mulScalar(Math.min(distance,dt*.3)));
  if(people.some(person=>Math.hypot(person.x-q.x,person.z-q.z)<.48)||!this.path.free(q.x,q.z)){this.blocked+=dt;if(this.blocked>2){this.route=[];this.state='roaming';this.wait=2;this.blocked=0;}return;}
  this.blocked=0;this.root.setPosition(q.x,.04,q.z);this.root.setEulerAngles(0,Math.atan2(delta.x,delta.z)*180/Math.PI,0);
 }
 snapshot(){return{state:this.state,meals:this.meals,food:this.daily.hasDogFood,route:this.route.map(p=>p.toArray())};}
}
