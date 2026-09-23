import {Asset,BoundingBox,Entity,Vec3,type Application,type ContainerResource} from 'playcanvas';
import {assetUrl} from '../editor/AssetUrls';
import {TRADERS,definition,type TradingDay} from '../data/trading';
import {schoolCook} from './SchoolCook';
import {Classmates} from './Classmates';
import {createDumpling} from './dumplingVisual';
import {material,primitives} from './primitives';
import type {Bedroom} from './bedroom';
import classroomCollision from '../../public/assets/school-kit/classroom-collision.json';
import cafeteriaCollision from '../../public/assets/school-kit/cafeteria-collision.json';

/** Reference-led rooms share one walkable school, including the open back doorway. */
export function createRecess(app:Application){
 const root=new Entity('Classroom trading club',app);app.root.addChild(root);
 const classroom=new Entity('Reference classroom',app),cafeteria=new Entity('Reference cafeteria',app);root.addChild(classroom);root.addChild(cafeteria);cafeteria.setLocalPosition(4.6,0,-16);
 const errors:string[]=[];
 // A short enclosed threshold connects the classroom's top-right door to the lunchroom entrance.
 const cream=material('School corridor plaster','#f6ebd4'),floor=material('School corridor tile','#e8dfce');
 const corridor=new Entity('School connecting doorway',app);root.addChild(corridor);const hall=primitives(app,corridor);
 hall('Walkable door threshold','box',[4.6,-.055,-8],[1.8,.11,2.1],floor,false);
 for(const x of [3.65,5.55])hall('Corridor side','box',[x,1.30,-8],[.1,2.60,2.1],cream);
 let loaded=0;
 const load=async(name:string,parent:Entity)=>{try{const a=new Asset('School '+name,'container',{url:assetUrl(`/assets/school-kit/${name}.glb`)});app.assets.add(a);await new Promise<void>((resolve,reject)=>{a.once('load',resolve);a.once('error',reject);app.assets.load(a);});const model=(a.resource as ContainerResource).instantiateRenderEntity({castShadows:true});parent.addChild(model);loaded++;}catch(e){errors.push(name);console.error('School art failed',name,e);}};
 const desks=[{x:-3.1,z:-1.75},{x:2.65,z:-1.75},{x:0,z:1.5}];
 const classmates=new Classmates(app,classroom,desks.map(p=>({x:p.x-.51,z:p.z-.8})));
 const lunchFriends=new Classmates(app,cafeteria,[{x:-4.15,z:-2.58},{x:-1.85,z:-2.58},{x:2.55,z:-2.58}],false);
 const offers=new Entity('Today’s trading squishies',app);classroom.addChild(offers);
 const display=new Entity('Squishy friends display',app);classroom.addChild(display);
 for(const [i,id] of ['bunny','rosie','mochi','panda','lavendream'].entries()){
  const model=createDumpling(app,display,definition(id));model.setLocalScale(.27,.27,.27);model.setLocalPosition(1.82+i*.49,.855,4.55);
 }
 const seats=TRADERS.map((trader,i)=>{const d=desks[i],anchor=new Vec3(d.x,0,d.z+1.55);const glow=primitives(app,classroom)('Trading spot','cylinder',[anchor.x,.016,anchor.z],[.82,.022,.82],material(trader.name+' cue',trader.color),false);return{id:trader.id,anchor,glow};});
 const obstacles=[...classroomCollision.map(b=>new BoundingBox(new Vec3(...b.center),new Vec3(...b.half))),...cafeteriaCollision.map(b=>new BoundingBox(new Vec3(b.center[0]+4.6,0,b.center[2]-16),new Vec3(...b.half))),... [3.65,5.55].map(x=>new BoundingBox(new Vec3(x,0,-8),new Vec3(.05,1,1.05)))];
 const room:Bedroom={root,halfWidth:12,halfDepth:24,walkable:[{minX:-5.9,maxX:5.9,minZ:-6.96,maxZ:6.9},{minX:3.7,maxX:5.5,minZ:-9.2,maxZ:-6.7},{minX:-1.3,maxX:10.5,minZ:-22.9,maxZ:-9}],obstacles,ready:Promise.all([load('classroom',classroom),load('cafeteria',cafeteria),classmates.ready,lunchFriends.ready,schoolCook(app,cafeteria).catch(e=>{errors.push('School cook');console.error(e);})]).then(()=>{}),artStats:()=>({loaded,models:2,errors:[...errors,...classmates.errors,...lunchFriends.errors],classmates:classmates.snapshot(),cafeteria:lunchFriends.snapshot()})};
 let area='Classroom';root.enabled=false;
 const sync=(day:TradingDay)=>{classmates.sync(day);for(const child of [...offers.children])child.destroy();TRADERS.forEach((t,i)=>{if(day.traders[t.id].done)return;day.traders[t.id].offer.forEach((id,j)=>{const model=createDumpling(app,offers,definition(id));model.setLocalScale(.22,.22,.22);model.setLocalPosition(desks[i].x+(j-1)*.40,.875,desks[i].z+.12);});});};
 return{...room,usesReferenceLayout:true,seats,sync,bindLayout:(_group:Entity)=>{},get area(){return area;},update:(now:number,focus:string,p:Vec3)=>{area=p.z<-8?'Cafeteria':'Classroom';classroom.enabled=p.z>-9.2;cafeteria.enabled=p.z<-5.8;classmates.update(now,focus);lunchFriends.update(now,'');},door:new Vec3(4.6,0,-8),cafeteriaCenter:new Vec3(4.6,0,-15)};
}
