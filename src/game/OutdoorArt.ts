import {Asset,BoundingBox,Entity,Vec3,Color,StandardMaterial,type Application,type ContainerResource,type RenderComponent} from 'playcanvas';
import {assetUrl} from '../editor/AssetUrls';
/** Shared containers and static batches keep the selected CC0 outdoor assets small. */
export class OutdoorArt{
 readonly tasks:Promise<void>[]=[];readonly errors:string[]=[];private cache=new Map<string,Promise<ContainerResource>>();private group;private leaves=new Map<string,StandardMaterial>();
 constructor(private app:Application,private parent:Entity){this.group=app.batcher.addGroup('Garden plants',false,14);}
 add(file:string,x:number,z:number,height:number,yaw=0){
  if(!this.cache.has(file))this.cache.set(file,new Promise((resolve,reject)=>{const a=new Asset(file,'container',{url:assetUrl('assets/outdoors/'+file+'.glb')});a.once('load',()=>resolve(a.resource as ContainerResource));a.once('error',reject);this.app.assets.add(a);this.app.assets.load(a);}));
  const task=this.cache.get(file)!.then(r=>{const e=r.instantiateRenderEntity({castShadows:true}),box=new BoundingBox();let first=true;for(const c of e.findComponents('render') as RenderComponent[])for(const m of c.meshInstances){if(first){box.copy(m.aabb);first=false;}else box.add(m.aabb);m.mask=1;let mat=m.material as StandardMaterial;if(/Leaves/.test(mat.name)){const variant=Math.abs(Math.round(yaw))%3,key=file+':'+mat.name+':'+variant;let leaf=this.leaves.get(key);if(!leaf){leaf=mat.clone();leaf.diffuseVertexColor=false;leaf.opacityMap=leaf.opacityMap??leaf.diffuseMap;leaf.opacityMapChannel='a';leaf.diffuseMap=null;leaf.diffuse=new Color().fromString((file.includes('Bush')?['#71915e','#7b9c68','#88a170']:['#84a66e','#8dab69','#789666'])[variant]);leaf.update();this.leaves.set(key,leaf);}m.material=leaf;}else{mat.diffuseVertexColor=false;mat.update();}}
   const scale=height/(box.halfExtents.y*2),anchor=new Entity(file,this.app);this.parent.addChild(anchor);anchor.addChild(e);e.setLocalScale(scale,scale,scale);e.setLocalPosition(-box.center.x*scale,-(box.center.y-box.halfExtents.y)*scale,-box.center.z*scale);anchor.setLocalPosition(x,0,z);anchor.setLocalEulerAngles(0,yaw,0);for(const c of e.findComponents('render') as RenderComponent[])c.batchGroupId=this.group.id;
  }).catch(e=>{this.errors.push(file);throw e;});this.tasks.push(task);
 }
 async finish(){await Promise.all(this.tasks);this.app.batcher.generate([this.group.id]);}
}
