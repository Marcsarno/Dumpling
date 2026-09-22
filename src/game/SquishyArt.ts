import {animalModel} from './AnimalSquishy';
import {assetUrl} from '../editor/AssetUrls';
import {Asset,Color,type Application,type ContainerResource,type Entity,type RenderComponent,type StandardMaterial,type Texture} from 'playcanvas';
import type {DumplingDefinition} from '../data/collection';
import { SQUISHY_PRESENTATION } from '../data/squishyPresentation';

type Art={bao:ContainerResource;steamer:ContainerResource;shelf:ContainerResource;color:Texture;surface:Texture;animals:Record<NonNullable<DumplingDefinition['special']>,ContainerResource>};
const loaded=new WeakMap<Application,Art>();
/** Load once before scene factories. All instances share immutable meshes/textures. */
export async function loadSquishyArt(app:Application){
 const load=(name:string)=>new Promise<ContainerResource>((resolve,reject)=>{
  const asset=new Asset(name,'container',{url:assetUrl(`${import.meta.env.BASE_URL}assets/squishies/${name}.glb`)});
  asset.once('load',()=>resolve(asset.resource as ContainerResource));asset.once('error',reject);app.assets.add(asset);app.assets.load(asset);
 });
 const texture=(name:string)=>new Promise<Texture>((resolve,reject)=>{const asset=new Asset(name,'texture',{url:assetUrl(`${import.meta.env.BASE_URL}assets/squishies/materials/${name}.png`)});asset.once('load',()=>resolve(asset.resource as Texture));asset.once('error',reject);app.assets.add(asset);app.assets.load(asset);});
 const [bao,steamer,shelf,color,surface,panda,frog,bunny,cat]=await Promise.all([load('bao-squishy'),load('bamboo-steamer'),load('bamboo-steamer-shelf'),texture('satin-color'),texture('satin-surface'),load('animal-panda'),load('animal-frog'),load('animal-bunny'),load('animal-cat')]);loaded.set(app,{bao,steamer,shelf,color,surface,animals:{panda,frog,bunny,cat}});
}
export function squishyModel(app:Application,data:DumplingDefinition){
 if(data.special)return animalModel(app,loaded.get(app)!.animals[data.special],data);
 const model=loaded.get(app)!.bao.instantiateRenderEntity({castShadows:true});
 for(const name of ['leaf','bow','star','crown'])model.findByName('Accessory_'+name)!.enabled=data.accessory===name;
 for(const side of ['L','R']){
  const closed=data.face==='sleepy'||data.face==='wink'&&side==='R';
  model.findByName('EyeOpen'+side)!.enabled=!closed;model.findByName('EyeClosed'+side)!.enabled=closed;
 }
 const materials=new Map<StandardMaterial,StandardMaterial>();
 const finish=SQUISHY_PRESENTATION[data.rarity],maps=loaded.get(app)!;
 for(const renderer of model.findComponents('render') as RenderComponent[])for(const mesh of renderer.meshInstances){
  const original=mesh.material as StandardMaterial;
  if(!materials.has(original)){
   const mat=original.clone();mat.glossInvert=true;mat.metalness=0;
   if(original.name==='Dough tint'){
    // Neutral albedo preserves pink/blue/cocoa identity instead of a second cream tint.
    mat.diffuse=new Color().fromString(data.color);mat.diffuseMap=maps.color;
    mat.opacityMap=null;mat.normalMap=maps.surface;mat.bumpiness=.24;
    mat.glossMap=maps.surface;mat.glossMapChannel='a';mat.gloss=finish.roughness;
    mat.specularityFactor=.65;mat.clearCoat=finish.coat;mat.clearCoatGloss=.65;
   }else if(original.name==='Accessory tint'){
    mat.diffuse=new Color().fromString(data.accent);mat.gloss=.38;
    mat.clearCoat=finish.accentCoat;mat.clearCoatGloss=.72;mat.specularityFactor=.8;
   }else if(original.name==='Glossy chocolate eyes'){
    mat.gloss=.23;mat.specularityFactor=.8;
   }else if(original.name==='Warm iris rim'){
    mat.gloss=.32;mat.specularityFactor=.65;
   }else if(original.name==='Cocoa smile'||original.name==='Strawberry cheek marks'){
    mat.gloss=.55;mat.specularityFactor=.35;
   }
   mat.update();materials.set(original,mat);
  }
   mesh.material=materials.get(original)!;
 }
 model.on('destroy',()=>{for(const mat of materials.values())mat.destroy();});return model;
}
export function steamerModel(app:Application,small=false){return loaded.get(app)![small?'shelf':'steamer'].instantiateRenderEntity({castShadows:true});}
/** Volume-conserving soft toy motion; face/charms inherit the deformation. */
export function animateSquishy(model:Entity,time:number,strength=.012){
 const y=1+Math.sin(time*2.4)*strength,x=1/Math.sqrt(y);model.setLocalScale(x,y,x);
}
