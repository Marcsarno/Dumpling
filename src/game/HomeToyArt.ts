import {Entity,type Application,type StandardMaterial} from 'playcanvas';
import {material,primitives,type Shape,type Triple} from './primitives';
import type {ToyKind} from '../data/homePlay';
/** Original small toy geometry, shared between uses; no imported character resources. */
export class HomeToyArt{
 private materials=new Map<string,StandardMaterial>();
 constructor(private app:Application){}
 mat(color:string){let m=this.materials.get(color);if(!m){m=material('Home toy '+color,color);this.materials.set(color,m);}return m;}
 make(kind:ToyKind,color:string){
  const root=new Entity('Toy '+kind,this.app),s=primitives(this.app,root);
  const part=(name:string,type:Shape,p:Triple,size:Triple,c=color)=>s(name,type,p,size,this.mat(c));
  const ball=(name:string,p:Triple,size:Triple,c=color)=>part(name,'sphere',p,size,c);
  const box=(name:string,p:Triple,size:Triple,c=color)=>part(name,'box',p,size,c);
  const cyl=(name:string,p:Triple,size:Triple,c=color)=>part(name,'cylinder',p,size,c);
  const eyes=(y:number,z:number)=>{for(const x of [-.055,.055])ball('Eye',[x,y,z],[.026,.032,.02],'#453c48');};
  if(kind==='ball'||kind==='fetch'){ball('Soft toy',[0,.14,0],[.28,.28,.28]);for(const x of [-.07,.07])ball('Stitch',[x,.25,.045],[.015,.025,.17],'#fff3dc');}
  if(kind==='cup'||kind==='pitcher'||kind==='can'||kind==='bubbles'){
   const h=kind==='cup'?.17:.26;cyl('Body',[0,h/2,0],[.19,h,.19]);cyl('Open rim',[0,h,0],[.215,.028,.215],'#fff0d8');cyl('Inside',[0,h+.004,0],[.16,.01,.16],'#76617d');
   if(kind!=='cup'){const handle=ball('Handle',[.13,.13,0],[.14,.16,.045]);if(kind==='bubbles'){handle.setLocalPosition(0,.34,0);box('Wand',[0,.24,0],[.025,.16,.025],'#fff0d8');}else {const spout=cyl('Spout',[-.14,.17,0],[.065,.22,.065]);spout.setLocalEulerAngles(0,0,50);}}
  }
  if(kind==='beanbag'||kind==='cushion'){const f=kind==='cushion'?3:1;ball('Fabric',[0,.06*f,0],[.28*f,.12*f,.23*f]);box('Seam',[0,.08*f,.108*f],[.22*f,.013,.018],'#eee0cd');}
  if(kind==='teddy'){
   ball('Body',[0,.19,0],[.29,.35,.22]);ball('Head',[0,.42,0],[.29,.27,.25]);ball('Muzzle',[0,.39,.11],[.16,.10,.09],'#e5c79f');eyes(.44,.12);ball('Nose',[0,.4,.16],[.04,.035,.025],'#453c48');
   for(const x of [-.14,.14]){ball('Ear',[x*.8,.53,0],[.11,.12,.09]);ball('Paw',[x,.08,.1],[.13,.12,.20]);ball('Arm',[x,.23,.03],[.12,.22,.13]);}
  }
  if(kind==='plate'){cyl('Toy china',[0,.025,0],[.35,.035,.35]);cyl('Center',[0,.045,0],[.26,.009,.26],'#f4d6e4');}
  if(kind==='cake'){cyl('Pretend sponge',[0,.06,0],[.19,.11,.19],'#c99c70');cyl('Painted icing',[0,.12,0],[.20,.04,.20]);ball('Wooden cherry',[0,.165,0],[.06,.06,.06],'#ad646e');}
  if(kind==='block'){box('Wooden block',[0,.11,0],[.22,.22,.22]);box('Grain',[0,.224,0],[.15,.003,.013],'#fff0d8');}
  if(kind==='car'||kind==='wagon'){
   const wagon=kind==='wagon';box('Body',[0,.19,0],wagon?[.56,.12,.70]:[.22,.12,.34]);
   if(wagon){for(const x of [-.27,.27])box('Side',[x,.29,0],[.04,.19,.7]);for(const z of [-.33,.33])box('End',[0,.29,z],[.56,.19,.04]);const h=cyl('Pull handle',[0,.32,.53],[.035,.58,.035],'#76617d');h.setLocalEulerAngles(55,0,0);}
   else {box('Cabin',[0,.29,-.015],[.17,.12,.16]);box('Window',[0,.3,.07],[.135,.07,.009],'#d8e9df');}
   for(const x of [-1,1])for(const z of [-1,1]){const w=cyl('Wheel',[x*(wagon?.30:.13),.11,z*(wagon?.23:.11)],[wagon?.19:.12,.065,wagon?.19:.12],'#76617d');w.setLocalEulerAngles(0,0,90);}
  }
  if(kind==='ramp'){const p=box('Ramp',[0,.15,0],[.35,.045,.68]);p.setLocalEulerAngles(18,0,0);box('Support',[0,.13,-.26],[.32,.25,.07]);}
  if(kind==='blanket'){box('Quilt',[0,.025,0],[1.1,.04,.85]);for(const x of [-.4,0,.4])box('Quilt stripe',[x,.048,0],[.07,.006,.82],'#e6d8cc');}
  if(kind==='paper'||kind==='book'){
   box('Cover',[0,.02,0],[.33,.035,.43]);box('Pages',[0,.043,0],[.30,.009,.4],'#fff6dc');
   if(kind==='book'){box('Spine',[-.15,.06,0],[.025,.035,.4]);for(const x of [-.08,.08])ball('Picture',[x,.055,0],[.10,.006,.15],x<0?'#c399c5':'#91bcb0');}
  }
  if(kind==='plane'||kind==='boat'){
   if(kind==='plane'){for(const x of [-1,1]){const w=box('Paper wing',[x*.10,.045,0],[.23,.012,.39]);w.setLocalEulerAngles(0,x*22,x*12);}const spine=box('Fold',[0,.03,0],[.016,.08,.32]);spine.setLocalEulerAngles(0,0,0);}
   else{box('Hull',[0,.045,0],[.3,.04,.19]);for(const x of [-1,1]){const side=box('Folded bow',[x*.11,.08,0],[.14,.015,.20]);side.setLocalEulerAngles(0,0,x*-40);}const sail=part('Fold','cone',[0,.13,0],[.16,.2,.015],'#fff2da');sail.setLocalEulerAngles(0,0,0);}
  }
  if(kind==='hat'){cyl('Brim',[0,.015,0],[.34,.025,.29]);cyl('Crown',[0,.075,0],[.21,.13,.18]);cyl('Ribbon',[0,.04,0],[.215,.03,.185],'#a976ac');}
  if(kind==='flamingo'){for(const x of [-.055,.055])cyl('Leg',[x,.25,0],[.018,.5,.018],'#a77b74');ball('Body',[0,.51,0],[.25,.21,.38]);const neck=cyl('Neck',[0,.70,.15],[.06,.38,.06]);neck.setLocalEulerAngles(14,0,0);ball('Head',[0,.87,.20],[.16,.14,.17]);ball('Beak',[0,.85,.30],[.08,.07,.14],'#453c48');}
  if(kind==='duck'){ball('Body',[0,.12,0],[.24,.20,.30]);ball('Head',[0,.25,.10],[.19,.18,.18]);ball('Beak',[0,.23,.21],[.13,.055,.1],'#d99155');eyes(.27,.175);for(const x of [-.075,.075])ball('Foot',[x,.025,.04],[.1,.035,.15],'#d99155');box('Key',[.17,.13,0],[.12,.02,.055],'#fff0d8');}
  if(kind==='jack'){box('Box',[0,.16,0],[.31,.3,.31]);box('Lid',[0,.32,0],[.33,.035,.33]);cyl('Crank',[.21,.17,0],[.035,.15,.035],'#e5ba73');ball('Surprise',[0,.5,0],[.20,.18,.17],'#96bd90');root.findByName('Surprise')!.enabled=false;}
  if(kind==='basin'||kind==='basket'||kind==='bed'){
   const w=kind==='basin'?.78:kind==='bed'?.43:.62,d=kind==='basin'?.62:kind==='bed'?.65:.5;
   box('Bottom',[0,.035,0],[w,.07,d]);for(const x of [-w/2,w/2])box('Side',[x,.12,0],[.04,.22,d]);for(const z of [-d/2,d/2])box('End',[0,.12,z],[w,.22,.04]);
   if(kind==='basin'){const water=box('Water',[0,.15,0],[w-.04,.016,d-.04],'#9bd4d9');water.enabled=false;}
   if(kind==='bed')ball('Pillow',[0,.13,-.20],[.35,.10,.20],'#dfa7b7');
  }
  if(kind==='flower'){cyl('Pot',[0,.14,0],[.32,.28,.32],'#be9179');cyl('Stem',[0,.42,0],[.03,.4,.03],'#7eac85');for(let i=0;i<5;i++)ball('Petal',[Math.sin(i*1.256)*.11,.63+Math.cos(i*1.256)*.11,0],[.14,.14,.055]);ball('Pollen',[0,.63,.025],[.10,.10,.08],'#e9c57a');}
  if(kind==='pinwheel'){cyl('Stick',[0,.23,0],[.018,.46,.018],'#d4b18a');const rotor=new Entity('Rotor',this.app);root.addChild(rotor);rotor.setLocalPosition(0,.48,0);for(let i=0;i<4;i++){const b=primitives(this.app,rotor)('Blade','box',[0,0,0],[.23,.10,.015],this.mat(i%2?color:'#b8cddd'));b.setLocalPosition(Math.sin(i*Math.PI/2)*.095,Math.cos(i*Math.PI/2)*.095,0);b.setLocalEulerAngles(0,0,i*90+25);}ball('Pin',[0,.48,.025],[.045,.045,.04],'#fff0d8');}
  if(kind==='rake'){cyl('Handle',[0,.25,0],[.025,.5,.025]);box('Rake head',[0,.02,0],[.3,.04,.04]);for(const x of [-.12,-.06,0,.06,.12])box('Tooth',[x,.02,.04],[.02,.025,.11]);}
  if(kind==='marker'){part('Marker','cone',[0,.15,0],[.22,.3,.22]);}
  if(kind==='board'){box('Frame',[0,0,0],[.55,.65,.04]);box('Cork',[0,0,.026],[.49,.59,.015],'#e7cdac');}
  return root;
 }
 destroy(){for(const m of this.materials.values())m.destroy();this.materials.clear();}
}
