import {Color,Texture,type Application,type ContainerResource,type RenderComponent,type StandardMaterial} from 'playcanvas';
import type {DumplingDefinition} from '../data/collection';

/** Reference-led Blender sculpts share geometry across color variants.
 * Solid satin materials preserve the approved shapes without UV seams.
 * Rarity sparkle/aura lives in opening VFX, separate from the body finish.
 */
const catMasks=new WeakMap<Application,Map<string,Texture>>();
function catMask(app:Application,data:DumplingDefinition){
 let cache=catMasks.get(app);if(!cache){cache=new Map();catMasks.set(app,cache);}
 const key=data.color+data.accent;let result=cache.get(key);if(result)return result;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d')!,pixels=ctx.createImageData(512,512);
 const linear=(v:number)=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
 const srgb=(v:number)=>v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055;
 const base=new Color().fromString(data.color),accent=new Color().fromString(data.accent);
 // The reference's painted head patches are lighter than the softly shaded
 // outer ears. Blend their pigments continuously rather than adding a band.
 const colors=data.id==='nebula-dragon'?['#e7b386','#cba57f','#c68777','#aa8074']:['#c9b5dc','#bba4ce','#ac91bd','#9780ac'];
 const ratios=colors.map(hex=>{const c=new Color().fromString(hex);return [c.r,c.g,c.b].map((v,i)=>linear(v)/linear([base.r,base.g,base.b][i]));});
 for(let row=0;row<512;row++)for(let col=0;col<512;col++){
  const x=col/512*1.5-.75,y=(1-row/512)*1.4;
  const distance=Math.min(...[-1,1].map(s=>((x-s*.36)/.23)**2+((y-.87)/.25)**2));
  const a=Math.max(0,Math.min(1,(1.02-distance)/.04));
  const t=Math.max(0,Math.min(1,(y-.76)/.20)),blend=t*t*(3-2*t),side=x<0?0:1;
  const offset=(row*512+col)*4;for(let c=0;c<3;c++){const ratio=ratios[side][c]*(1-blend)+ratios[side+2][c]*blend;pixels.data[offset+c]=Math.round(255*srgb(1-a*(1-ratio)));}pixels.data[offset+3]=255;
 }
 ctx.putImageData(pixels,0,0);result=new Texture(app.graphicsDevice,{name:'Seamless kitten cap mask',width:512,height:512,mipmaps:true,flipY:false});result.setSource(canvas);cache.set(key,result);return result;
}
export function animalModel(app:Application,resource:ContainerResource,data:DumplingDefinition){
 const model=resource.instantiateRenderEntity({castShadows:true});
 const materials=new Map<StandardMaterial,StandardMaterial>();
 for(const renderer of model.findComponents('render') as RenderComponent[])for(const mesh of renderer.meshInstances){
  const original=mesh.material as StandardMaterial;
  if(!materials.has(original)){
   const mat=original.clone();mat.diffuseMap=null;mat.normalMap=null;mat.glossMap=null;
   // Baked local visibility only shades indirect light: the surface still reacts
   // to room lights and never carries a fixed painted highlight as it rotates.
   mat.diffuseVertexColor=false;mat.aoVertexColor=true;mat.aoVertexColorChannel='r';mat.aoIntensity=.78;mat.occludeDirect=false;
   mat.glossInvert=true;mat.metalness=0;mat.gloss=.48;mat.specularityFactor=.40;
   mat.clearCoat=.035;mat.clearCoatGloss=.55;
   if(original.name.startsWith('Dough tint')){mat.diffuse=new Color().fromString(data.color);if(data.special==='cat')mat.diffuseMap=catMask(app,data);}
   if(original.name.startsWith('Animal accent')){mat.diffuse=new Color().fromString(data.accent);mat.gloss=.58;mat.specularityFactor=.32;mat.clearCoat=.015;}
   if(original.name.startsWith('Animal eyes')){mat.gloss=.18;mat.specularityFactor=.75;mat.diffuse=new Color().fromString('#392a2e');}
   if(original.name.startsWith('Animal ink')){mat.gloss=.45;mat.diffuse=new Color().fromString('#463039');}
   if(original.name.startsWith('Animal blush')){mat.gloss=.6;mat.clearCoat=0;mat.diffuse=new Color().fromString('#f2a0ab');}
   mat.update();materials.set(original,mat);
  }
  mesh.material=materials.get(original)!;
 }
 model.on('destroy',()=>{for(const mat of materials.values())mat.destroy();});return model;
}
