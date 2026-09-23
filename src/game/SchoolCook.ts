import {Asset,BoundingBox,Entity,type AnimTrack,type Application,type ContainerResource,type RenderComponent} from 'playcanvas';
import {assetUrl,containerOptions} from '../editor/AssetUrls';
import {material,primitives} from './primitives';

/** The existing CC0 classmate rig also supplies the lunch counter attendant. */
export async function schoolCook(app:Application,parent:Entity){
 const path='/assets/characters/classmates/character-male-a.glb';
 const asset=new Asset('School lunch attendant','container',{url:assetUrl(path)},{},containerOptions(path));app.assets.add(asset);
 await new Promise<void>((resolve,reject)=>{asset.once('load',resolve);asset.once('error',reject);app.assets.load(asset);});
 const resource=asset.resource as ContainerResource&{animations:Asset[]},model=resource.instantiateRenderEntity({castShadows:true}),bounds=new BoundingBox();let first=true;
 for(const r of model.findComponents('render') as RenderComponent[])for(const m of r.meshInstances){if(first){bounds.copy(m.aabb);first=false;}else bounds.add(m.aabb);}
 const scale=1.90/(2*bounds.halfExtents.y),idle=resource.animations.map(a=>a.resource as AnimTrack).find(a=>a.name==='idle')!;
 for(const curve of idle.curves)for(const path of curve.paths as unknown as {entityPath:string[];propertyPath:string[]}[]){const n=model.findByName(path.entityPath.at(-1)!)!,v=idle.outputs[curve.output].data;if(path.propertyPath[0]==='localRotation')n.setLocalRotation(v[0],v[1],v[2],v[3]);else if(path.propertyPath[0]==='localPosition')n.setLocalPosition(v[0],v[1],v[2]);}
 const root=new Entity('Friendly lunch cook',app);parent.addChild(root);root.setLocalPosition(.3,.37,-6.18);root.addChild(model);model.setLocalScale(scale,scale,scale);
 const shape=primitives(app,root),white=material('Chef cotton','#fff8e9');
 shape('Chef hat band','cylinder',[0,2.00,0],[.72,.17,.65],white);
 for(const x of [-.20,0,.20])shape('Soft chef cap','sphere',[x,2.16,0],[.38,.30,.55],white);
 shape('Chef apron bib','box',[0,1.1,.22],[.35,.48,.025],white,false);
 primitives(app,parent)('Kitchen standing platform','box',[.3,.175,-6.18],[1.1,.35,.8],material('Kitchen platform','#b6bac2'));
 return root;
}
