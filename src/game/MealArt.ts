import {BoundingBox,Entity,Mesh,MeshInstance,type Application,type RenderComponent} from 'playcanvas';
import {leaseContainer} from './ContainerLease';
import {assetUrl} from '../editor/AssetUrls';
import type {HomeToyArt} from './HomeToyArt';
import {primitives} from './primitives';
/** A serving is held at the fingers, with its near edge angled toward the mouth. */
export function mealGrip(prop:Entity,drink:boolean,fruit=false){
 prop.setLocalPosition(0,drink?-.025:.035,-.055);
 prop.setLocalScale(drink?.65:1,drink?.65:1,drink?.65:1);
 prop.setLocalEulerAngles(drink?-18:fruit?0:35,0,0);
}
/** Authored food geometry supplies the servings. Bite variants cut the actual mesh tip. */
export class MealArt{
 private leases=new Map<string,ReturnType<typeof leaseContainer>>();private meshes:Mesh[]=[];
 constructor(private app:Application,private art:HomeToyArt){}
 async pizzaPlatter(parent:Entity,portions:boolean[]){
  let lease=this.leases.get('pizza');if(!lease){lease=leaseContainer(this.app,assetUrl('/assets/food/pizza.glb'),'Edible pizza');this.leases.set('pizza',lease);}const res=await lease.ready;if(!parent.parent)return;
  const model=res.instantiateRenderEntity({castShadows:true}),bounds=new BoundingBox();let first=true;
  for(const r of model.findComponents('render') as RenderComponent[])for(const m of r.meshInstances){if(first){bounds.copy(m.aabb);first=false;}else bounds.add(m.aabb);}
  const size=.57/(bounds.halfExtents.x*2);model.setLocalScale(size,size,size);model.setLocalPosition(-bounds.center.x*size,-(bounds.center.y-bounds.halfExtents.y)*size,-bounds.center.z*size);
  for(const r of model.findComponents('render') as RenderComponent[]){const index=Number(r.entity.name.replace('slice',''))-1;r.enabled=portions[index]??false;}parent.addChild(model);
 }
 async food(parent:Entity,kind:string,bites=0,slice=0,width=.28){
  if(bites>=3)return;
  if(kind==='sandwich'){const serving=new Entity('Sandwich serving',this.app);parent.addChild(serving);serving.setLocalScale(width/.28,width/.28,width/.28);const s=primitives(this.app,serving),w=.25*(1-bites*.28);for(const y of [.025,.10])s('Bread slice','sphere',[0,y,0],[w,.035,.22],this.art.mat('#ddbb80'));s('Lettuce','sphere',[0,.06,0],[w+.01,.018,.23],this.art.mat('#91aa70'));s('Tomato','cylinder',[0,.08,0],[w,.018,.19],this.art.mat('#cf8e75'));return;}
  if(kind==='turkey'&&slice>=2){const s=primitives(this.app,parent),w=width*(1-bites*.28);s('Roasted turkey skin','sphere',[0,.02,0],[w,.04,width*.65],this.art.mat('#b88352'));s('Carved turkey','sphere',[0,.035,0],[w*.86,.025,width*.53],this.art.mat('#ebd6b4'));return;}
  const file=kind==='sandwich'?'bread':kind;let lease=this.leases.get(file);if(!lease){lease=leaseContainer(this.app,assetUrl(`/assets/food/${file}.glb`),'Edible '+file);this.leases.set(file,lease);}
  const res=await lease.ready;if(!parent.parent)return;
  const model=res.instantiateRenderEntity({castShadows:true});
  const all=model.findComponents('render') as RenderComponent[];
  // Detached components are not enabled in the hierarchy yet. Select by authored
  // part identity, before attachment, rather than their effective enabled state.
  const visible=file==='pizza'?all.filter(r=>r.entity.name===`slice${slice%8+1}`):file==='turkey'?[all.filter(r=>r.entity.name==='leg')[slice%2]].filter(Boolean):all;
  for(const r of all)r.enabled=visible.includes(r);
  const bounds=new BoundingBox();let first=true;
  for(const r of visible)for(const m of r.meshInstances){if(first){bounds.copy(m.aabb);first=false;}else bounds.add(m.aabb);}
  const size=width/Math.max(bounds.halfExtents.x*2,bounds.halfExtents.z*2,.001);
  model.setLocalScale(size,size,size);model.setLocalPosition(-bounds.center.x*size,-(bounds.center.y-bounds.halfExtents.y)*size,-bounds.center.z*size);
  parent.addChild(model);
  if(bites){
   for(const r of visible)r.meshInstances=r.meshInstances.map(instance=>{
    const positions:number[]=[],normals:number[]=[],uvs:number[]=[],indices:number[]=[];instance.mesh.getPositions(positions);instance.mesh.getNormals(normals);instance.mesh.getUvs(0,uvs);instance.mesh.getIndices(indices);
    const zs=positions.filter((_,i)=>i%3===2),lo=Math.min(...zs),hi=Math.max(...zs),cut=lo+(hi-lo)*(bites===1?.32:.62),out:number[]=[];
    for(let i=0;i<indices.length;i+=3)if((positions[indices[i]*3+2]+positions[indices[i+1]*3+2]+positions[indices[i+2]*3+2])/3>=cut)out.push(indices[i],indices[i+1],indices[i+2]);
    const mesh=new Mesh(this.app.graphicsDevice);mesh.setPositions(positions);if(normals.length)mesh.setNormals(normals);if(uvs.length)mesh.setUvs(0,uvs);mesh.setIndices(out);mesh.update();parent.once('destroy',()=>mesh.destroy());return new MeshInstance(mesh,instance.material,instance.node);
   });
  }
 }
 plate(parent:Entity,lunch:boolean){const s=primitives(this.app,parent);s('Plate','cylinder',[0,0,0],[lunch?.53:.40,.025,lunch?.44:.40],this.art.mat(lunch?'#a6c4bf':'#fff1d8'));}
 destroy(){for(const m of this.meshes)m.destroy();for(const l of this.leases.values())l.release();}
}
