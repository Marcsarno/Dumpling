import {BoundingBox,Entity,Vec3,Mesh,MeshInstance,StandardMaterial,type Application,type RenderComponent} from 'playcanvas';
import type {Bedroom} from './bedroom';import {material,primitives} from './primitives';import {OutdoorArt} from './OutdoorArt';import {classroomSign} from './Classmates';import {crossingGuard} from './CrossingGuard';
export const POND={stand:new Vec3(-4.1,.09,-10.0),bobber:new Vec3(-7.15,.12,-11.9),center:new Vec3(-8,0,-12)};
export const SCHOOL_GATE=new Vec3(22,.09,-29.4);
export class Outdoors{
 readonly root:Entity;readonly roof:Entity;readonly ready:Promise<void>;readonly water:Entity;readonly obstacles:BoundingBox[]=[];readonly halfWidth=40;readonly halfDepth=45;
 readonly walkable=[{minX:-9,maxX:-3.3,minZ:-6,maxZ:9.8},{minX:-14,maxX:14,minZ:-19,maxZ:-4},{minX:-4,maxX:31,minZ:-19.5,maxZ:-16},{minX:20,maxX:24,minZ:-27,maxZ:-18},{minX:14,maxX:31,minZ:-33,maxZ:-26}];
 private guard?:Awaited<ReturnType<typeof crossingGuard>>;private time=0;private opened=false;readonly art:OutdoorArt;
 constructor(private app:Application,private house:Bedroom){
  this.root=new Entity('Pond and school walk',app);app.root.addChild(this.root);const group=app.batcher.addGroup('Outdoor architecture',false,14),s=primitives(app,this.root,group.id),grass=material('Soft meadow','#9fb97a'),stone=material('Warm pathway','#ddceae'),edge=material('Limestone edges','#eadfc3'),soil=material('Pond bank','#a79b74'),road=material('Quiet street','#8994a0'),white=material('Crossing paint','#fff4d7'),wood=material('Honey garden oak','#b89570'),mint=material('School mint','#b3cbbc'),cream=material('School plaster','#f5dfb8'),pink=material('Roof clay','#cb8d88');
  this.art=new OutdoorArt(app,this.root);
  const box=(n:string,x:number,y:number,z:number,w:number,h:number,d:number,m=stone)=>s(n,'box',[x,y,z],[w,h,d],m);
  box('Back garden lawn',7,-.16,-16,54,.25,40,grass);box('Side garden lawn',-6.6,-.16,3,4.8,.25,14,grass);
  // A continuous, winding path leading away from the existing side entry.
  const path=(ax:number,az:number,bx:number,bz:number,w:number)=>{const e=box('Garden path',(ax+bx)/2,-.005,(az+bz)/2,w,.06,Math.hypot(bx-ax,bz-az)+.3);e.setLocalEulerAngles(0,Math.atan2(bx-ax,bz-az)*180/Math.PI,0);};
  path(-3.8,8.25,-6.3,8.25,1.8);path(-6.3,8.25,-6.3,-4,1.8);path(-6.3,-4,-3.5,-7,2);path(-3.5,-7,-.5,-12,2);path(-.5,-12,6,-17.3,2.2);path(-.5,-10,-4.4,-10,1.5);for(const [x,z,w] of [[-6.3,-4,1.8],[-3.5,-7,2],[-.5,-12,2.1],[6,-17.3,2.2]])s('Rounded path corner','cylinder',[x,-.005,z],[w,.06,w],stone,false);
  const pondLayer=(name:string,rx:number,rz:number,y:number,mat:StandardMaterial)=>{const e=new Entity(name,app),mesh=new Mesh(app.graphicsDevice),pos=[0,0,0],norm=[0,1,0],idx:number[]=[];for(let i=0;i<=80;i++){const a=i*Math.PI/40,k=1+.035*Math.sin(a*3)+.025*Math.cos(a*5);pos.push(Math.cos(a)*rx*k,0,Math.sin(a)*rz*k);norm.push(0,1,0);if(i<80)idx.push(0,i+2,i+1);}mesh.setPositions(pos);mesh.setNormals(norm);mesh.setIndices(idx);mesh.update();e.addComponent('render',{meshInstances:[new MeshInstance(mesh,mat)],castShadows:false});this.root.addChild(e);e.setLocalPosition(-8,y,-12);return e;};
  // Layered irregular-looking pond, clear east bank for casting.
  pondLayer('Grassy pond lip',3.95,3.25,.018,soil);
  pondLayer('Pond shallows',3.72,3.02,.055,material('Pond shallow turquoise','#a4d4c6'));
  this.water=pondLayer('Pond water',3.45,2.77,.077,material('Pond blue','#78bac5'));
  this.obstacles.push(new BoundingBox(new Vec3(-8,.5,-12),new Vec3(3.45,2,2.8)));
  for(let i=0;i<15;i++){const a=i*Math.PI*2/15;if(a<.7||a>5.75)continue;this.art.add(i%2?'Rock_Medium_1':'Rock_Medium_3',-8+Math.cos(a)*3.8,-12+Math.sin(a)*3.1,.25+(i%3)*.12,i*31);}
  for(const [x,z] of [[-9.7,-13.3],[-7.3,-13.8],[-10,-11.8]]){s('Lily pad','cylinder',[x,.11,z],[.55,.018,.5],material('Lily leaf','#6b9f74'),false);s('Lily bloom','sphere',[x+.12,.17,z],[.18,.11,.18],material('Water lily','#f4c8d8'),false);}
  for(let i=0;i<12;i++){const x=-10.5+i%4*.3,z=-9.7+Math.floor(i/4)*.17;s('Pond reed','cylinder',[x,.38,z],[.035,.75+(i%3)*.12,.035],material('Reed green','#6c9363'),false);}
  for(let i=0;i<7;i++)box('Fishing landing planks',-3.9,.01,-10.7+i*.21,1.1,.04,.18,wood);
  for(const x of [-.6,.6]){box('Garden bench leg',x-1.4,.30,-7,.11,.6,.6,wood);}box('Garden bench seat',-1.4,.62,-7,1.7,.12,.60,edge);box('Garden bench back',-1.4,1.05,-7.24,1.7,.65,.09,wood);
  for(let i=0;i<9;i++){const x=-6.15+.3*Math.sin(i),z=6.5-i*1.0;s('Garden stepping inset','cylinder',[x,.035,z],[.7,.035,.5],edge,false);}
  for(let i=0;i<14;i++){const x=-9.7+(i%5)*.8,z=-13.4+Math.floor(i/5)*.95;const e=s('Water glint','box',[x,.087,z],[.25+(i%3)*.15,.005,.018],material('Water glints','#a5d5d5'),false);e.setLocalEulerAngles(0,-14,0);}
  classroomSign(app,this.root,'Fishing sign','CATCH & RELEASE\nPond friends',[-2.8,1.15,-11.4],1.8,.65);box('Fishing sign post',-2.8,.52,-11.4,.08,1,.08,wood);
  box('Sidewalk',13.5,.015,-17.75,35,.12,2.6,edge);box('Street',13.5,-.025,-22.5,35,.10,6.4,road);box('School sidewalk',22,.015,-26.65,18,.12,1.7,edge);
  for(let x=-3;x<31;x+=2){box('Paving seam',x,.08,-17.75,.025,.01,2.6,stone);if(x<20||x>24)box('Road dash',x,.033,-22.5,1,.015,.13,white);}
  for(let z=-25.3;z<=-19.7;z+=.7)box('Crosswalk stripe',22,.04,z,3.5,.018,.4,white);
  path(22,-26,22,-31,3.4);
  // Raised planting beds make the safe crosswalk route readable, with no moving traffic.
  for(const x of [16.5,28]){box('School flower bed',x,.1,-28.5,3,.3,2,soil);for(let i=0;i<3;i++)this.art.add('Bush_Common_Flowers',x-1+i,-28.5,.65,i*40);}
  for(const [ax,bx,z] of [[14,20,-29.8],[24,31,-29.8]])for(let x=ax;x<=bx;x+=.55){box('School fence picket',x,.65,z,.09,1.3,.10,wood);box('School fence rail',x,.92,z,.65,.08,.08,wood);}
  for(const x of [19.8,24.2]){box('Gate pillar',x,1.3,-30,.45,2.6,.45,mint);s('Gate cap','sphere',[x,2.65,-30],[.6,.22,.6],cream);}
  box('School gate arch',22,2.68,-30,4.8,.32,.4,mint);classroomSign(app,this.root,'School gate sign','MAPLE GROVE\nSCHOOL',[22,2.73,-29.76],3.2,.55);
  box('School facade',22,2.1,-35,16,4.2,3,cream);box('School roof',22,4.25,-35,17,.35,4,pink);
  for(const x of [16,18,26,28]){box('School window frame',x,2.2,-33.46,1.5,1.8,.08,white);box('School blue window',x,2.2,-33.40,1.3,1.6,.05,material('Sky window','#a3c9d6'));box('Window crosspiece',x,2.2,-33.34,1.4,.08,.05,white);}
  box('School entry',22,1.4,-33.38,2.6,2.8,.10,mint);classroomSign(app,this.root,'School facade title','GOOD FRIENDS · BRIGHT DAYS',[22,3.55,-33.32],6,.65);
  // Deliberate masses of trees and low flowering boundaries; keep sightlines over the path.
  const trees=[[-12,-6,3.8],[-13,-16,4.8],[-10,-18,3.6],[0,-5.2,3.8],[4,-7,4.7],[10,-10,4.5],[13,-15,3.8],[28,-31,4.5],[15,-31,4.7],[30,-18,4.1]];
  trees.forEach(([x,z,h],i)=>{this.art.add(i%2?'CommonTree_1':'CommonTree_3',x,z,h,i*67);this.obstacles.push(new BoundingBox(new Vec3(x,1,z),new Vec3(.38,2,.38)));});
  for(let x=-13;x<14;x+=1.15)if(x<4||x>8)this.art.add('Bush_Common',x,-18.7,.65,x*17);
  for(let z=-17;z<-4;z+=1.15)this.art.add('Bush_Common_Flowers',-13.4,z,.65,z*9);
  for(let z=-4;z<10;z+=1.15)this.art.add('Bush_Common',-8.7,z,.62,z*9);
  for(let i=0;i<16;i++)this.art.add('Plant_1',-12+(i%8)*3.2,-5.4-Math.floor(i/8)*10.2,.35,i*40);
  this.roof=new Entity('Outside cottage shell and roof',app);house.root.addChild(this.roof);const r=primitives(app,this.roof),roofMat=material('Cottage rose tiles','#bc8179');
  for(const [x,z,w,d] of [[3.85,4.8,14.65,17.1],[-.35,14.7,6.4,3.8]]){r('Exterior upper wall','box',[x,1.8,z],[w,1.9,d],material('Exterior cottage cream','#ecd8b2'));r('Ivory eaves','box',[x,2.83,z],[w+.55,.16,d+.55],edge);const pitch=Math.atan2(1.3,w/2)*180/Math.PI;for(const side of [-1,1]){const e=r('Pitched cottage roof','box',[x+side*w*.25,3.60,z],[Math.hypot(w/2,1.3)+.5,.16,d+.75],roofMat);e.setLocalEulerAngles(0,0,-side*pitch);}r('Roof ridge','box',[x,4.28,z],[.20,.16,d+.85],pink);}
  for(const z of [-1.7,2.2,5.6,11.1]){r('Exterior window frame','box',[-3.51,1.70,z],[.10,1.18,1.25],edge);r('Exterior blue glass','box',[-3.57,1.70,z],[.05,.98,1.05],material('Cottage sky glass','#accacf'));r('Exterior window mullion','box',[-3.61,1.70,z],[.05,1.03,.06],edge);r('Exterior window ledge','box',[-3.65,1.08,z],[.3,.10,1.42],wood);}
  r('Chimney','box',[7,4.0,8],[.75,1.4,.75],cream);r('Chimney cap','box',[7,4.73,8],[.95,.14,.95],edge);this.roof.enabled=false;
  for(const [x,z,hx,hz] of [[-1.4,-7,.85,.34],[-2.8,-11.4,.12,.12],[20,-18,.35,.35],[16.5,-28.5,1.5,1],[28,-28.5,1.5,1],[17,-29.8,3.05,.12],[27.5,-29.8,3.55,.12],[19.8,-30,.23,.23],[24.2,-30,.23,.23]])this.obstacles.push(new BoundingBox(new Vec3(x,.6,z),new Vec3(hx,1,hz)));
  this.ready=Promise.all([this.art.finish(),crossingGuard(app,this.root).then(g=>this.guard=g)]).then(()=>{app.batcher.generate([group.id]);});
 }
 installDoor(){
  if(this.opened)return;this.opened=true;
  // The authored Editor wall remains authoritative except for this one doorway cutout.
  const shapes=primitives(this.app,this.root),wall=material('Entry plaster repair','#f3dfca'),trim=material('Entry ivory repair','#f5e9d6');
  for(const r of this.house.root.findComponents('render') as RenderComponent[]){const n=r.entity,p=n.getPosition();if((['Painted cottage wall','Ivory wall cap','Cottage skirting'].includes(n.name)&&Math.abs(p.x+3.3)<.2&&p.z>5.8&&p.z<7.4)||['Front door timber','Front door inset','Door brass handle'].includes(n.name)){r.enabled=false;r.batchGroupId=-1;}}
  // Clear only obsolete decorative trees/fence pieces across the new garden route.
  for(const node of this.house.root.find(n=>n.name.startsWith('Art '))){const p=node.getPosition();if((node.name.startsWith('Art tree')&&p.z<-3)||(node.name==='Art fence_planksDouble'&&Math.abs(p.z+6)<.2&&p.x<1)){node.enabled=false;for(const r of (node as Entity).findComponents('render') as RenderComponent[]){r.enabled=false;r.batchGroupId=-1;}}}
  this.house.obstacles.splice(0,this.house.obstacles.length,...this.house.obstacles.filter(b=>!(Math.abs(b.center.x+3.3)<.2&&b.center.z-b.halfExtents.z<8.25&&b.center.z+b.halfExtents.z>8.25)));
  for(const [a,b] of [[3.6,7.6],[8.95,9.5]]){shapes('Open entry wall','box',[-3.3,1.325,(a+b)/2],[.14,2.65,b-a],wall);shapes('Open entry skirting','box',[-3.28,.12,(a+b)/2],[.16,.16,b-a],trim);this.house.obstacles.push(new BoundingBox(new Vec3(-3.3,.7,(a+b)/2),new Vec3(.07,1.4,(b-a)/2)));}
  this.house.walkable!.push(...this.walkable);this.house.obstacles.push(...this.obstacles);this.house.halfWidth=this.halfWidth;this.house.halfDepth=this.halfDepth;this.app.batcher.generate();
 }
 update(dt:number,p:Vec3,enabled:boolean){this.root.enabled=enabled;this.time+=dt;this.roof.enabled=enabled&&(p.x<-5.2||p.z<-5);this.guard?.update(this.time,p);}
 snapshot(){return{ready:!this.art.errors.length,roof:this.roof.enabled,stand:POND.stand.toArray(),gate:SCHOOL_GATE.toArray(),walkable:this.house.walkable,obstacles:this.house.obstacles.map(b=>({center:b.center.toArray(),halfExtents:b.halfExtents.toArray()}))};}
}
