import {Asset,Color,type Application,type ContainerResource,type Entity,type RenderComponent,type StandardMaterial} from 'playcanvas';
import type {DumplingDefinition} from '../data/collection';

type Art={bao:ContainerResource;steamer:ContainerResource;shelf:ContainerResource};
const loaded=new WeakMap<Application,Art>();
/** Load once before scene factories. All instances share immutable meshes/textures. */
export async function loadSquishyArt(app:Application){
 const load=(name:string)=>new Promise<ContainerResource>((resolve,reject)=>{
  const asset=new Asset(name,'container',{url:`${import.meta.env.BASE_URL}assets/squishies/${name}.glb`});
  asset.once('load',()=>resolve(asset.resource as ContainerResource));asset.once('error',reject);app.assets.add(asset);app.assets.load(asset);
 });
 const [bao,steamer,shelf]=await Promise.all([load('bao-squishy'),load('bamboo-steamer'),load('bamboo-steamer-shelf')]);loaded.set(app,{bao,steamer,shelf});
}
export function squishyModel(app:Application,data:DumplingDefinition){
 const model=loaded.get(app)!.bao.instantiateRenderEntity({castShadows:true});
 for(const name of ['leaf','bow','star','crown'])model.findByName('Accessory_'+name)!.enabled=data.accessory===name;
 for(const side of ['L','R']){
  const closed=data.face==='sleepy'||data.face==='wink'&&side==='R';
  model.findByName('EyeOpen'+side)!.enabled=!closed;model.findByName('EyeClosed'+side)!.enabled=closed;
 }
 const materials=new Map<StandardMaterial,StandardMaterial>();
 for(const renderer of model.findComponents('render') as RenderComponent[])for(const mesh of renderer.meshInstances){
  const original=mesh.material as StandardMaterial;
  if(['Dough tint','Accessory tint'].includes(original.name)){
   if(!materials.has(original)){const mat=original.clone();mat.diffuse=new Color().fromString(original.name==='Dough tint'?data.color:data.accent);mat.update();materials.set(original,mat);}
   mesh.material=materials.get(original)!;
  }
 }
 model.on('destroy',()=>{for(const mat of materials.values())mat.destroy();});return model;
}
export function steamerModel(app:Application,small=false){return loaded.get(app)![small?'shelf':'steamer'].instantiateRenderEntity({castShadows:true});}
/** Volume-conserving soft toy motion; face/charms inherit the deformation. */
export function animateSquishy(model:Entity,time:number,strength=.012){
 const y=1+Math.sin(time*2.4)*strength,x=1/Math.sqrt(y);model.setLocalScale(x,y,x);
}
