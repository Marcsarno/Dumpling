import {Application,Entity,StandardMaterial,RenderComponent} from 'playcanvas';
import {createBedroom} from '../src/game/bedroom';
import {createCleanupProps} from '../src/game/cleanupProps';
const app=new Application(document.querySelector('canvas')!);
const room=createBedroom(app),props=createCleanupProps(app,room);
const mats:Record<string,unknown>={};
function serialize(e:Entity):any{
 const c:any={name:e.name,position:e.getLocalPosition().toArray(),rotation:e.getLocalEulerAngles().toArray(),scale:e.getLocalScale().toArray(),children:e.children.map(n=>serialize(n as Entity))};
 if(e.render){const m=e.render.meshInstances[0].material as StandardMaterial; mats[m.name]={diffuse:[m.diffuse.r,m.diffuse.g,m.diffuse.b],specular:[m.specular.r,m.specular.g,m.specular.b],shininess:15,useMetalness:true,metalness:0};c.components={render:{type:e.render.type,castShadows:e.render.castShadows,receiveShadows:true}};c.materialName=m.name;}
 return c;
}
const groups=[['Bed',[-2.05,0,-1.7]],['Bookshelf',[1.12,0,-3.05]],['Nightstand',[-.53,0,-2.8]],['Toy chest',[2.48,0,-1.55]],['Desk',[2.33,0,1.24]],['Stool',[2.05,0,2.15]],['Floor plant',[-2.66,0,2.45]]] as const;
const nodes=groups.map(([name,position],i)=>({name,position:[...position],tags:['pilot.prop'],children:[{name:'Collision footprint',position:[room.obstacles[i].center.x-position[0],.7,room.obstacles[i].center.z-position[2]],scale:[room.obstacles[i].halfExtents.x*2,2.8,room.obstacles[i].halfExtents.z*2],tags:['pilot.collider']}]}));
const shell:any={name:'Bedroom architecture',children:[]};
for(const e of room.root.children as Entity[]){
 const n=serialize(e),p=e.getPosition(); let index=-1;
 if(/^(Bed |Headboard|Mattress|Pink duvet|Folded lavender|Pillow)/.test(e.name))index=0;
 else if(/^(Shelf |Book$|Storage basket|Basket label|Stacked book)/.test(e.name))index=1;
 else if(/^(Nightstand|Drawer|Lamp )/.test(e.name))index=2;
 else if(/^(Toy chest|Chest label)/.test(e.name))index=3;
 else if(/^(Desk |Notebook)/.test(e.name))index=4;
 else if(/^Stool/.test(e.name))index=5;
 else if(/^Plant/.test(e.name))index=p.y>1.8?1:p.x>0?4:6;
 if(index>=0){n.position=n.position.map((v:number,j:number)=>v-nodes[index].position[j]);(nodes[index].children as any[]).push(n);}else shell.children.push(n);
}
(nodes[1].children as any[]).push({name:'Book standing point',position:[0,0,.5],tags:['pilot.destination']},{name:'Book placement',position:[.39,.79,.06],tags:['pilot.placement']},{name:'Book marker',position:[0,2.35,0]});
(nodes[2].children as any[]).push({name:'Bedside lamp light',position:[0,1.39,-.03],components:{light:{type:'omni',color:[1,.84,.67],intensity:0,range:3.8,castShadows:false}},enabled:false});
const book=serialize(props.items.find(i=>i.id==='book')!.entity);book.tags=['pilot.book'];
const roomRoot={name:'Arianna bedroom',children:[shell,...nodes,book,{name:'Player start',position:[0,.09,.9]},{name:'Room bounds',position:[0,0,0],scale:[6.6,1,7.2],tags:['pilot.bounds']}]};
(window as any).__pilotExport={materials:mats,room:roomRoot,source:'fe3ae65'};
