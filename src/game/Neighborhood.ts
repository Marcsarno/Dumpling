import {Entity,Vec3,BoundingBox,type Application,type StandardMaterial,type RenderComponent} from 'playcanvas';
import {assetUrl} from '../editor/AssetUrls';
import {primitives,material} from './primitives';
import {OutdoorArt} from './OutdoorArt';
import {classroomSign} from './Classmates';
import {outdoorSurface} from './OutdoorGround';
import {leaseContainer} from './ContainerLease';
import type {Bedroom} from './bedroom';
type Section={root:Entity;art:OutdoorArt;group:number;materials:StandardMaterial[];leases:ReturnType<typeof leaseContainer>[]};
export const ROAD_Z=-22.5, SHOP_DOOR_Z=-30.1;
export const PLAY_SPOTS=[-17,-30,-43,-56,-69].map(x=>({x,z:-15.3}));
export const SHOP_STOPS=[{id:'corner',x:-26,name:'Clover Corner'},{id:'toys',x:-50,name:'Peachy Playroom'},{id:'collector',x:-74,name:'Moonbeam Finds'}];
/** Instantiated in short, independent blocks. Retire batches as well as entities. */
export class Neighborhood {
 private sections=new Map<number,Section>();private maxSections=4;
 constructor(private app:Application,private house:Bedroom){}
 install(){
  this.house.walkable!.push({minX:-100,maxX:31,minZ:-27.5,maxZ:-16.3});this.house.halfWidth=110;
  for(const shop of SHOP_STOPS)this.house.walkable!.push({minX:shop.x-6,maxX:shop.x+6,minZ:-30.8,maxZ:-25.8});
  for(const p of PLAY_SPOTS)this.house.walkable!.push({minX:p.x-3,maxX:p.x+3,minZ:-18.2,maxZ:-12.6});
 }
 update(p:Vec3,outside:boolean){
  for(let i=0;i<this.maxSections;i++){
   const center=-16-i*24,camera=this.app.root.findByTag('migration.camera')[0] as Entity|undefined,near=outside&&(Math.abs(p.x-center)<30||!!camera?.camera?.frustum.containsAabb(new BoundingBox(new Vec3(center,2,-23),new Vec3(16,8,16))));
   if(near&&!this.sections.has(i))this.sections.set(i,this.create(i));
   if(!near&&this.sections.has(i)){const s=this.sections.get(i)!;s.root.enabled=false;this.app.batcher.removeGroup(s.group);s.root.destroy();s.art.dispose();s.materials.forEach(m=>{m.diffuseMap?.destroy();m.destroy();});s.leases.forEach(l=>l.release());this.sections.delete(i);}
  }
 }
 private create(index:number):Section{
  const center=-16-index*24,root=new Entity('Neighborhood section '+index,this.app);this.app.root.addChild(root);
  const group=this.app.batcher.addGroup('Lane section '+index,false,18),s=primitives(this.app,root,group.id),materials:StandardMaterial[]=[],leases:ReturnType<typeof leaseContainer>[]=[];
  const m=(name:string,color:string)=>{const v=material(name,color);materials.push(v);return v;};
  const lawn=outdoorSurface(this.app,'grass');lawn.diffuseMapTiling.set(5,8);materials.push(lawn);
  const road=m('Warm slate road','#8994a0'),paving=m('Cream sidewalk','#eadfc3'),curb=m('Pale limestone curb','#f2e7cc'),soil=m('Rich planting earth','#a8977b'),wood=m('Warm cedar fence','#b59976'),white=m('Road markings','#f5e9cc'),blue=m('Chalk blue','#b0cbd0');
  // Continue the original school street from x=-4; leave the backyard untouched.
  s('North neighborhood meadow','box',[center,-.16,-28.5],[24,.25,18],lawn,false);
  if(index>0)s('South lane meadow','box',[center,-.16,0],[24,.25,40],lawn,false);
  else s('West garden meadow','box',[-24,-.16,0],[8,.25,40],lawn,false);
  s('Connected street','box',[center,-.025,ROAD_Z],[24,.10,6.4],road,false);
  s('Connected garden sidewalk','box',[center,.015,-17.75],[24,.12,2.6],paving,false);
  s('Connected far sidewalk','box',[center,.015,-26.65],[24,.12,1.7],paving,false);
  for(let x=center-11;x<center+12;x+=2){s('Paving seam','box',[x,.08,-17.75],[.025,.01,2.6],soil,false);s('Road dash','box',[x,.033,ROAD_Z],[1,.015,.13],white,false);}
  const crossing=SHOP_STOPS[index]?.x;
  if(crossing!==undefined)for(let z=-25.3;z<=-19.7;z+=.7)s('Shop crossing stripe','box',[crossing,.04,z],[3.2,.018,.4],white,false);
  const art=new OutdoorArt(this.app,root);let seed=821+index*47;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let k=0;k<5;k++){
   const x=center-10+k*4.4;
   art.add(k%2?'CommonTree_1':'CommonTree_3',x,-36-rand()*1.5,3.1+rand()*1.2,rand()*360);
   art.add('Bush_Common_Flowers',x,-35,.6,rand()*360);
   if(k%2===0)art.add('Rock_Medium_1',x+1,-35.8,.45,rand()*360);
  }
  for(const p of PLAY_SPOTS.filter(p=>p.x>=center-12&&p.x<center+12)){
   s('Play alcove paving','box',[p.x,.015,p.z],[5.5,.12,5.1],paving,false);
   for(const dx of [-2.8,2.8])art.add('Bush_Common_Flowers',p.x+dx,-13.4,.65,rand()*360);
   art.add('CommonTree_1',p.x-4,-12.2,3.2+rand()*.6,rand()*360);
   art.add('Rock_Medium_1',p.x-3.5,-11.5,.48,rand()*360);
   art.add('Bush_Common_Flowers',p.x+3.2,-11.9,.8,rand()*360);
   for(let i=0;i<3;i++)s('Garden stepping stone','cylinder',[p.x+3.5+i*.65,.02,-14.3+Math.sin(i)*.35],[.5,.07,.4],curb,false);
  }
  const shop=SHOP_STOPS[index];
  if(shop){
   s('Three-space shop forecourt','box',[shop.x,.025,-28.3],[12,.09,4.5],road,false);
   for(const dx of [-5.5,-1.8,1.8,5.5])s('Parking bay stripe','box',[shop.x+dx,.077,-28.2],[.07,.01,3.2],white,false);
   for(const dx of [-3.6,0,3.6])s('Parking wheel stop','box',[shop.x+dx,.12,-30.0],[1.2,.18,.20],curb,false);
   s('Store entrance walk','box',[shop.x,.045,-30.3],[12,.12,.65],paving,false);
   const lease=leaseContainer(this.app,assetUrl('assets/outdoors/shop-'+['clover','peachy','moonbeam'][index]+'.glb'),'Neighborhood storefront '+shop.id);leases.push(lease);
   void lease.ready.then(resource=>{if(!root.enabled)return;const model=resource.instantiateRenderEntity({castShadows:true});root.addChild(model);model.setLocalPosition(shop.x,.075,-33.1);for(const r of model.findComponents('render') as RenderComponent[])r.batchGroupId=group.id;this.app.batcher.generate([group.id]);}).catch(e=>console.error('Storefront load',e));
   classroomSign(this.app,root,shop.name+' exterior sign',shop.name.toUpperCase(),[shop.x,3.60,-30.72],index===1?5.7:4.3,.43);
   for(const dx of [-8,7.4]){art.add('CommonTree_3',shop.x+dx,-36.1,3.7+rand(),rand()*360);art.add('Bush_Common_Flowers',shop.x+dx,-32.2,.8,rand()*360);}
   if(index===1){for(let k=0;k<5;k++){const flag=s('Playroom bunting','cone',[shop.x-3+k*1.5,3.22,-30.05],[.4,.35,.035],k%2?blue:white,false);flag.setLocalEulerAngles(0,0,180);}}
  }
  // Additional art above is queued before the batch is finalized.
  void art.finish().catch(e=>console.error('Neighborhood plants',e));
  this.app.batcher.generate([group.id]);return{root,art,group:group.id,materials,leases};
 }
 destroy(){this.update(new Vec3(),false);}
 snapshot(){return{loadedSections:[...this.sections.keys()],totalSections:this.maxSections,roadZ:ROAD_Z,joinX:-4};}
}
