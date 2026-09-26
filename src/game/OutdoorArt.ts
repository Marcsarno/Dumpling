import {Asset,BoundingBox,Entity,Color,StandardMaterial,type Application,type ContainerResource,type RenderComponent} from 'playcanvas';
import {assetUrl} from '../editor/AssetUrls';
import {leaseContainer} from './ContainerLease';
/** Shared containers and static batches keep the selected CC0 outdoor assets small. */
export class OutdoorArt{
 readonly tasks:Promise<void>[]=[];readonly errors:string[]=[];private cache=new Map<string,Promise<ContainerResource>>();private group;private leaves=new Map<string,StandardMaterial>();private leases:ReturnType<typeof leaseContainer>[]=[];private disposed=false;private generation=0;private active:boolean;private placements:[string,number,number,number,number][]=[];private anchors:Entity[]=[];
 constructor(private app:Application,private parent:Entity,lazy=false){this.group=app.batcher.addGroup('Garden plants',false,14);this.active=!lazy;}
 add(file:string,x:number,z:number,height:number,yaw=0){
  this.placements.push([file,x,z,height,yaw]);if(this.active)this.load(file,x,z,height,yaw);
 }
 private load(file:string,x:number,z:number,height:number,yaw:number){
  const generation=this.generation;
  if(!this.cache.has(file)){const lease=leaseContainer(this.app,assetUrl('assets/outdoors/'+file+'.glb'),file);this.leases.push(lease);this.cache.set(file,lease.ready);}
  const task=this.cache.get(file)!.then(r=>{if(this.disposed||generation!==this.generation)return;const e=r.instantiateRenderEntity({castShadows:true}),box=new BoundingBox();let first=true;for(const c of e.findComponents('render') as RenderComponent[])for(const m of c.meshInstances){if(first){box.copy(m.aabb);first=false;}else box.add(m.aabb);m.mask=1;let mat=m.material as StandardMaterial;if(/Leaves/.test(mat.name)){const variant=Math.abs(Math.round(yaw))%3,key=file+':'+mat.name+':'+variant;let leaf=this.leaves.get(key);if(!leaf){leaf=mat.clone();leaf.diffuseVertexColor=false;leaf.opacityMap=leaf.opacityMap??leaf.diffuseMap;leaf.opacityMapChannel='a';leaf.diffuseMap=null;leaf.diffuse=new Color().fromString((file.includes('Bush')?['#71915e','#7b9c68','#88a170']:['#84a66e','#8dab69','#789666'])[variant]);leaf.update();this.leaves.set(key,leaf);}m.material=leaf;}else{mat.diffuseVertexColor=false;mat.update();}}
   const scale=height/(box.halfExtents.y*2),anchor=new Entity(file,this.app);this.anchors.push(anchor);this.parent.addChild(anchor);anchor.addChild(e);e.setLocalScale(scale,scale,scale);e.setLocalPosition(-box.center.x*scale,-(box.center.y-box.halfExtents.y)*scale,-box.center.z*scale);anchor.setLocalPosition(x,0,z);anchor.setLocalEulerAngles(0,yaw,0);for(const c of e.findComponents('render') as RenderComponent[])c.batchGroupId=this.group.id;
  }).catch(e=>{this.errors.push(file);throw e;});this.tasks.push(task);
 }
 async finish(){if(this.disposed)return;if(!this.active){this.active=true;for(const p of this.placements)this.load(...p);}const generation=this.generation;await Promise.all(this.tasks);if(!this.disposed&&generation===this.generation)this.app.batcher.generate([this.group.id]);}
 unload(){if(!this.active)return;this.active=false;this.generation++;this.app.batcher.removeGroup(this.group.id);for(const e of this.anchors)e.destroy();this.anchors=[];for(const m of this.leaves.values())m.destroy();this.leases.forEach(l=>l.release());this.cache.clear();this.leaves.clear();this.leases=[];this.tasks.length=0;this.group=this.app.batcher.addGroup('Garden plants',false,14);}
 dispose(){this.unload();this.disposed=true;this.app.batcher.removeGroup(this.group.id);this.placements=[];}
}
