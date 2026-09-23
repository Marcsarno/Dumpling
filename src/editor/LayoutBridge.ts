import {Entity,BoundingBox,Vec3,StandardMaterial,type Application,type RenderComponent} from 'playcanvas';
import type {Bedroom} from '../game/bedroom';
import type {CleanupProps} from '../game/cleanupProps';
import type {GameLoop} from '../game/GameLoop';
import {registerPropSpace,propTuple} from './PropSpace';
type RecordEntry={key:string;entity:Entity;model?:string};
const records:RecordEntry[]=[];
const counts=new Map<string,number>();
const artTasks:Promise<void>[]=[];
export function trackArt(task:Promise<void>){artTasks.push(task);}
const scopes=new Set(['Bedroom','Maple cottage','Cleanup props','Daily routines']);
export function recordLayout(entity:Entity,parent:Entity,model?:string){
 if(!scopes.has(parent.name)&&!parent.tags.has('migration.store'))return;
 if(/Nearby display aura|Trading spot|Paper wiping|Puppy kibble/.test(entity.name))return;
 const key=parent.name+'/'+entity.name,index=counts.get(key)??0;counts.set(key,index+1);
 records.push({key:key+'/'+index,entity,model});
}
export function recordArt(entity:Entity,parent:Entity,model:string){recordLayout(entity,parent,model);}
export async function captureWorld(app:Application,house:Bedroom,props:CleanupProps,loop:GameLoop,editor:boolean){
 await Promise.all([house.ready,...loop.stores.map(s=>s.ready),loop.recess.ready,...artTasks]);
 const rooms=[house,...loop.stores,loop.recess];
 for(const room of rooms)if(room.artStats?.().errors.length)throw Error('Environment assets failed: '+room.root.name+' '+room.artStats!().errors.join(', '));
 const serialize=(r:RecordEntry)=>{const e=r.entity,m=e.render?.meshInstances[0]?.material as StandardMaterial|undefined;return {key:r.key,name:e.name,model:r.model,modelMaterials:r.model?(e.findComponents('render') as RenderComponent[]).flatMap(r=>r.meshInstances.map(mi=>{const mat=mi.material as StandardMaterial;return {name:mat.name,diffuse:[mat.diffuse.r,mat.diffuse.g,mat.diffuse.b],specular:[mat.specular.r,mat.specular.g,mat.specular.b],emissive:[mat.emissive.r,mat.emissive.g,mat.emissive.b],useLighting:mat.useLighting};})):undefined,position:e.getLocalPosition().toArray(),rotation:e.getLocalEulerAngles().toArray(),scale:e.getLocalScale().toArray(),scope:(e.parent as Entity).name,enabled:e.enabled,render:e.render?{type:e.render.type,castShadows:e.render.castShadows}:undefined,material:m?{name:m.name,diffuse:[m.diffuse.r,m.diffuse.g,m.diffuse.b],specular:[m.specular.r,m.specular.g,m.specular.b],emissive:[m.emissive.r,m.emissive.g,m.emissive.b],useLighting:m.useLighting}:undefined,normalization:r.model?(e.children[0] as Entity).getLocalScale().toArray():undefined,offset:r.model?(e.children[0] as Entity).getLocalPosition().toArray():undefined};};
 const data={records:records.map(serialize),rooms:rooms.map(r=>({name:r.root.name,walkable:r.walkable,obstacles:r.obstacles.map(b=>({center:b.center.toArray(),half:b.halfExtents.toArray()}))})),interactions:props.interactions.filter(i=>i.kind==='place'||i.kind==='daily'&&!/play-lilah|wipe-|vacuum-|put-tool/.test(i.id)).map(i=>({id:i.id,anchor:i.anchor.toArray(),marker:i.marker.toArray(),placement:i.placement})),stores:loop.stores.map(s=>({name:s.root.name,sites:s.sites.map(t=>({id:t.id,anchor:t.anchor.toArray(),marker:t.marker.toArray()})),exit:s.exitAnchor.toArray()}))};
 (window as any).__migrationSource=data;
 (data as any).lights=house.lighting?.snapshot().lights;
 (window as any).__migration={ready:false,source:data};
 if(editor){
  const authored=app.root.findByTag('migration.environment') as Entity[];
  if(!authored.length)throw Error('This Editor scene is missing its authored game environments.');
  const entities=new Map<string,Entity>();for(const e of app.root.findByTag('migration.record') as Entity[]){const key=e.tags.list().find(t=>t.startsWith('key:'))!.slice(4);entities.set(key,e);}
  const variants=new Map<string,StandardMaterial>(),emission:{source:StandardMaterial;target:StandardMaterial}[]=[];
  const paintMaterial=(source:StandardMaterial,paint:StandardMaterial)=>{
   const key=source.id+':'+paint.id;if(variants.has(key))return variants.get(key)!;
   const m=source.clone();m.diffuse.copy(paint.diffuse);m.specular.copy(paint.specular);m.gloss=paint.gloss;m.metalness=paint.metalness;
   if(paint.diffuseMap){m.diffuseMap=paint.diffuseMap;m.diffuseMapTiling.copy(paint.diffuseMapTiling);}
   m.update();variants.set(key,m);emission.push({source,target:m});return m;
  };
  for(const r of records){const e=entities.get(r.key);if(!e)throw Error('Missing Editor layout entity: '+r.key);const original=r.entity;
   // The Editor transform is authoritative; the original renderer supplies its preserved textures and model animation data.
   for(const preview of e.findByTag('migration.preview') as Entity[]){
    const paints=(preview.findComponents('render') as RenderComponent[]).flatMap(r=>r.meshInstances.map(m=>m.material as StandardMaterial));
    (original.findComponents('render') as RenderComponent[]).flatMap(r=>r.meshInstances).forEach((mesh,i)=>{if(paints[i])mesh.material=paintMaterial(mesh.material as StandardMaterial,paints[i]);});preview.enabled=false;
   }
   if(e.render){
    const paint=e.render.meshInstances[0]?.material as StandardMaterial,material=original.render?.meshInstances[0]?.material as StandardMaterial;
    if(material&&paint){original.render!.material=paintMaterial(material,paint);original.render!.type=e.render.type;}
    e.render.enabled=false;
   }
   original.reparent(e);original.setLocalPosition(0,0,0);original.setLocalEulerAngles(0,0,0);original.setLocalScale(1,1,1);
  }
  for(const env of authored){const name=env.tags.list().find(t=>t.startsWith('scope:'))!.slice(6);if(name==='Classroom trading club'&&loop.recess.usesReferenceLayout){env.enabled=false;continue;}const runtime=rooms.find(r=>r.root.name===name)?.root??(name==='Bedroom'?house.root.findByName('Bedroom'):name==='Cleanup props'?props.root:props.daily!.root);if(!runtime)throw Error('Unknown layout scope '+name);env.reparent(runtime as Entity);env.enabled=true;}
  for(const n of app.root.findByTag('migration.light') as Entity[]){const name=n.tags.list().find(t=>t.startsWith('light:'))!.slice(6),light=(house.root.findComponents('light') as import('playcanvas').LightComponent[]).find(l=>l.entity!==n&&l.entity.name===name);if(light){light.entity.reparent(n);light.entity.setLocalPosition(0,0,0);light.entity.setLocalEulerAngles(0,0,0);light.color.copy(n.light!.color);light.range=n.light!.range;n.light!.enabled=false;}}
  for(const [key,x,z] of [['bed',-2.05,-1.7],['crib',9.8,-1.7],['dining',.55,13.85],['marc-seat',4.5,7.35],['stove',-2.72,12.65],['fridge',-2.65,14.55],['clothes',-.7,3.05]] as const){const index=data.rooms[0].obstacles.findIndex(b=>Math.abs(b.center[0]-x)<.01&&Math.abs(b.center[2]-z)<.01),e=app.root.findByTag('prop:Maple cottage:'+index)[0] as Entity|undefined;if(e)registerPropSpace(key,e,new Vec3(x,0,z));}
  for(const item of props.items){const key=item.id==='daily-outfit'?'clothes':item.id==='breakfast-egg'?'fridge':item.id==='breakfast-plate'?'stove':null;if(key)item.home.splice(0,3,...propTuple(key,item.home));}
  const bounds=new BoundingBox(new Vec3(),new Vec3(.5,.5,.5));
  for(const r of rooms){if(r===loop.recess&&loop.recess.usesReferenceLayout)continue;const enabled=r.root.enabled;r.root.enabled=true;const nodes=(app.root.findByTag('collision:'+r.root.name) as Entity[]).filter(n=>n.enabled);r.obstacles.splice(0,r.obstacles.length,...nodes.map(n=>{const box=new BoundingBox();box.setFromTransformedAabb(bounds,n.getWorldTransform());return box;}));r.root.enabled=enabled;}
  for(const r of rooms.filter(r=>r!==loop.recess||!loop.recess.usesReferenceLayout))for(const n of app.root.findByTag('walkable:'+r.root.name) as Entity[]){const index=Number(n.tags.list().find(t=>t.startsWith('index:'))!.slice(6)),b=new BoundingBox();b.setFromTransformedAabb(bounds,n.getWorldTransform());if(r.walkable?.[index])Object.assign(r.walkable[index],{minX:b.center.x-b.halfExtents.x,maxX:b.center.x+b.halfExtents.x,minZ:b.center.z-b.halfExtents.z,maxZ:b.center.z+b.halfExtents.z});}
  for(const i of props.interactions){const a=app.root.findByTag('anchor:'+i.id)[0] as Entity|undefined,marker=app.root.findByTag('marker:'+i.id)[0] as Entity|undefined,p=app.root.findByTag('placement:'+i.id)[0] as Entity|undefined;if(a)i.anchor.copy(a.getPosition());if(marker)i.marker.copy(marker.getPosition());if(p&&i.placement)i.placement.splice(0,3,...p.getPosition().toArray());}
  for(const s of loop.stores){for(const site of s.sites){for(const field of ['anchor','marker'] as const){const e=app.root.findByTag(s.root.name+':'+site.id+':'+field)[0] as Entity|undefined;if(e)site[field].copy(e.getPosition());}}const exit=app.root.findByTag('exit:'+s.root.name)[0] as Entity|undefined;if(exit)s.exitAnchor.copy(exit.getPosition());}
  for(const s of loop.stores)for(let i=0;i<s.sites.length;i++){const group=app.root.findByTag('prop:'+s.root.name+':'+i)[0] as Entity,origin=data.rooms.find(r=>r.name===s.root.name)!.obstacles[i].center;for(const child of [...s.boxes[i],s.glows[i]]){const p=child.getLocalPosition().clone().sub(new Vec3(origin[0],0,origin[2]));child.reparent(group);child.setLocalPosition(p);}}
  // Authored stock sockets let reused display furniture change height and orientation.
  for(const s of loop.stores){
   for(let i=0;i<s.sites.length;i++){
    s.boxes[i].forEach((box,n)=>{const socket=app.root.findByTag('stock:'+s.root.name+':'+i+':'+n)[0] as Entity|undefined;if(socket){box.setLocalPosition(socket.getLocalPosition());box.setLocalEulerAngles(socket.getLocalEulerAngles());box.setLocalScale(socket.getLocalScale());}});
    const anchor=app.root.findByTag(s.root.name+':'+i+':anchor')[0] as Entity|undefined;if(anchor)s.glows[i].setLocalPosition(anchor.getLocalPosition().clone().add(new Vec3(0,.027,0)));
   }
   const batch=app.batcher.addGroup('Store art '+s.root.name,false,32);
   for(const e of s.root.findByTag('store.art') as Entity[])for(const r of e.findComponents('render') as RenderComponent[])r.batchGroupId=batch.id;
  }
  const classroom=app.root.findByTag('prop:Classroom trading club:0')[0] as Entity|undefined;
  if(classroom)loop.recess.bindLayout(classroom);
  // Explicit numeric IDs retire old batches; this engine's no-argument path uses
  // string keys, which fail to match existing numeric IDs and leave ghost furniture.
  const batchIds=[...new Set((app.root.findComponents('render') as RenderComponent[]).map(r=>r.batchGroupId).filter(id=>id>=0))];
  app.batcher.generate(batchIds);
  app.on('update',()=>{for(const {source,target} of emission)if(target.emissiveIntensity!==source.emissiveIntensity||!target.emissive.equals(source.emissive)){target.emissive.copy(source.emissive);target.emissiveIntensity=source.emissiveIntensity;target.update();}});
 }
 (window as any).__migration.ready=true;
}
