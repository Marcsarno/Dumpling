import {Vec3} from 'playcanvas';
import {HousePath} from '../components/HousePath';
import {HOUSE_TASKS,EXTRA_HOUSE_TASKS} from '../data/house';
import type {Bedroom} from './bedroom';
import type {CleanupProps} from './cleanupProps';

/** Round-only variation. Never changes item homes, destinations or daily saves. */
export class RoundMesses {
 private planner:HousePath;
 private previous=new Map<string,string>();
 private lastTasks='';
 constructor(private props:CleanupProps,house:Bedroom){this.planner=new HousePath(house,.29);}
 houseTasks(random=Math.random){
  const pool=[...HOUSE_TASKS,...EXTRA_HOUSE_TASKS];
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  let result=pool.slice(0,6),key=result.map(t=>t.id).sort().join();
  if(key===this.lastTasks){result=[...result.slice(0,5),pool[6]];key=result.map(t=>t.id).sort().join();}
  this.lastTasks=key;return result;
 }
 apply(mode:string,random=Math.random){
  const used:Vec3[]=[];
  const bedroom=[[-.55,.2],[.65,-.7],[.45,1.7],[-.85,2.55],[1.3,2.6],[1.7,-1.5],[.25,-2.1]];
  const living=[[1.2,5.2],[3.3,6.1],[1.1,7.2],[.5,8.2],[3.5,8.7]];
  const pools:Record<string,number[][]>={bedroom,living,kitchen:[[.2,10.6],[1.5,11.4],[-.6,11.6],[.15,12.0]],laundry:[[4.55,10.5],[4.65,11.8],[5.35,11.65]],hall:[[4.4,2.4],[4.5,1.5],[5.3,1.8]],bath:[[4.6,-1.4],[4.6,-2.15],[5.1,-.7]]};
  const choose=(id:string,pool:number[][])=>{
   const candidates=pool.map(([x,z])=>new Vec3(x,0,z)).filter(p=>this.planner.free(p.x,p.z)&&used.every(q=>q.distance(p)>.65)&&this.planner.route(new Vec3(0,0,.9),p).length);
   const fresh=candidates.filter(p=>p.x+','+p.z!==this.previous.get(id)),options=fresh.length?fresh:candidates;
   const p=options[Math.floor(random()*options.length)];if(p){used.push(p);this.previous.set(id,p.x+','+p.z);}return p;
  };
  for(const item of this.props.items){
   const target=this.props.interactions.find(t=>t.id==='pickup-'+item.id);if(!target)continue;
   target.anchor.set(...item.home);target.marker.set(item.home[0],item.home[1]+(item.id==='vacuum'?.82:.62),item.home[2]);
   if(mode==='day'||mode==='pet'||!item.entity.enabled||['vacuum','scooper'].includes(item.id))continue;
   const room=item.id.includes('-')?item.id.split('-')[0]:'bedroom',p=choose(item.id,pools[room]??bedroom);if(!p)continue;
   item.entity.setLocalPosition(p.x,.09,p.z);item.entity.setLocalEulerAngles(0,random()*90-45,0);target.anchor.copy(p);target.marker.set(p.x,.71,p.z);
  }
  if(mode==='day'||mode==='pet')return;
  const dirt=choose('dirt',[...living,...pools.kitchen]);if(dirt){this.props.dirt.setPosition(dirt.x,.085,dirt.z);const t=this.props.interactions.find(t=>t.id==='dirt')!;t.anchor.copy(dirt);t.marker.set(dirt.x,.55,dirt.z);}
  const crayons=choose('crayons',bedroom);if(crayons){this.props.crayonMess.setPosition(crayons.x,.06,crayons.z);const t=this.props.interactions.find(t=>t.id==='crayons')!;t.anchor.copy(crayons);t.marker.set(crayons.x,.6,crayons.z);}
 }
}
