import {schoolPerson} from './SchoolPerson';
import {assetUrl,containerOptions} from '../editor/AssetUrls';
import {Asset,BoundingBox,Entity,Quat,Texture,StandardMaterial,CULLFACE_NONE,type AnimTrack,type Application,type ContainerResource,type RenderComponent} from 'playcanvas';
import {TRADERS,type TradingDay} from '../data/trading';
import {dailyWish} from '../data/tradeHelp';

export function classroomSign(app:Application,parent:Entity,name:string,text:string,position:[number,number,number],width=1,height=.26,color='#5c496e'){
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=256;
 const texture=new Texture(app.graphicsDevice,{mipmaps:false});texture.setSource(canvas);
 const material=new StandardMaterial();material.diffuseMap=texture;material.emissiveMap=texture;material.emissive.set(.45,.45,.45);material.cull=CULLFACE_NONE;material.update();
 const sign=new Entity(name,app);parent.addChild(sign);sign.addComponent('render',{type:'plane',material,castShadows:false});sign.setLocalPosition(...position);sign.setLocalEulerAngles(90,0,0);sign.setLocalScale(width,1,height);
 const paint=(words:string)=>{const c=canvas.getContext('2d')!;c.fillStyle='#fff6df';c.fillRect(0,0,768,256);c.strokeStyle=color;c.lineWidth=16;c.strokeRect(10,10,748,236);c.fillStyle='#514365';c.textAlign='center';c.textBaseline='middle';c.font='bold 56px Trebuchet MS';words.split('\n').forEach((line,i,a)=>c.fillText(line,384,128+(i-(a.length-1)/2)*76,720));texture.upload();};paint(text);return paint;
}

/** Proportionally fitted Quaternius classmates share the same chairs and trading identities. */
export class Classmates {
 readonly ready:Promise<void>;readonly errors:string[]=[];loaded=0;
 private actors:{person:Awaited<ReturnType<typeof schoolPerson>>;id:string;near:boolean}[]=[];
 private signs:((s:string)=>void)[]=[];
 constructor(private app:Application,parent:Entity,placements?:{x:number;z:number}[],showNames=true){
  this.ready=Promise.all(TRADERS.map(async(t,i)=>{
   const x=placements?.[i].x??(i-1)*1.75,z=placements?.[i].z??-.74;
   if(showNames)this.signs[i]=classroomSign(app,parent,t.name+' nameplate',t.name+'\n'+t.title,[x,.92,z+1.12],1,.24,t.color);
   try{const person=await schoolPerson(app,parent,['jules','remy','poppy'][i],t.name+' classmate',[1.38,1.36,1.34][i],true);person.root.setLocalPosition(x,0,z);this.actors.push({person,id:t.id,near:false});this.loaded++;}
   catch(e){this.errors.push(t.name);console.error('Classmate failed to load',e);}
  })).then(()=>{});
 }
 sync(day:TradingDay){TRADERS.forEach((t,i)=>this.signs[i]?.(t.name+'\n'+(day.traders[t.id].done?'Thanks for trading!':'Wishes for '+dailyWish(day,t.id).name)));}
 attachLayout(group:Entity){for(const a of this.actors){const p=a.person.root.getLocalPosition().clone();a.person.root.reparent(group);a.person.root.setLocalPosition(p.x,p.y,p.z+.3);}}
 update(now:number,focus:string){for(const a of this.actors){const near=focus===a.id;a.person.update(now/1000,near&&!a.near);a.near=near;}}
 snapshot(){return{loaded:this.loaded,errors:[...this.errors],people:this.actors.map(a=>({id:a.id,height:a.person.height,source:'Quaternius modular'}))};}
}
