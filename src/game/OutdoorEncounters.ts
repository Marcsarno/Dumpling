import {Entity,StandardMaterial,type Application} from 'playcanvas';
import {primitives,material} from './primitives';
import type {createCharacter} from '../components/CharacterVisual';
import type {PlayerController} from '../components/PlayerController';
type Encounter={root:Entity;x:number;z:number;kind:'ball'|'puddle'|'crate';phase:number;moved:number;materials:StandardMaterial[]};
/** Small, readable encounters. Nothing spawns on top of the player. */
export class OutdoorEncounters {
 private encounters=new Map<number,Encounter>();private time=0;private seed=0;private cooldown=0;private jumping=0;private previousOutside=false;
 private button=document.createElement('button');private abort=new AbortController();
 hop=0;
 constructor(private app:Application,private character:ReturnType<typeof createCharacter>,private controller:PlayerController,private say:(s:string)=>void){
  this.button.id='journey-jump';this.button.className='journey-button';this.button.textContent='↥ Jump';this.button.style.bottom='220px';this.button.hidden=true;document.querySelector('#game')!.append(this.button);this.button.onclick=()=>this.jump();
  window.addEventListener('keydown',e=>{if(e.code==='KeyJ'&&!this.button.hidden&&!e.repeat)this.jump();},{signal:this.abort.signal});
 }
 jump(){if(this.button.hidden||this.jumping>0||!this.controller.enabled||this.character.placeholder.enabled)return;this.jumping=this.controller.riding?.72:1.1667;if(!this.controller.riding)this.character.animator.playAction('PlayJump',1.1667);}
 get airborne(){return this.jumping>.16;}
 private locations(){
  return[[-23,-17.8],[-36,-17.8],[-49,-17.8],[-62,-17.8],[-80,-17.8]];
 }
 update(dt:number,outside:boolean,available:boolean,day:number){
  this.button.hidden=!outside||!available;
  if(outside&&!this.previousOutside){this.seed=(Math.random()*100000)|0;}
  this.previousOutside=outside;
  if(!outside){for(const e of this.encounters.values())this.remove(e);this.encounters.clear();this.jumping=0;this.hop=0;return;}
  if(!available||dt<=0)return;
  this.time+=dt;this.cooldown=Math.max(0,this.cooldown-dt);this.jumping=Math.max(0,this.jumping-dt);this.hop=this.controller.riding?Math.sin(Math.PI*(1-this.jumping/.72))*.23:0;if(!this.jumping)this.hop=0;
  const p=this.character.player.getPosition();
  this.locations().forEach(([x,z],i)=>{
   const distance=Math.hypot(p.x-x,p.z-z),close=distance<16&&this.controller.riding;
   if(close&&!this.encounters.has(i)){const kinds=['ball','puddle','crate'] as const;this.encounters.set(i,this.create(x,z,kinds[(i+day+this.seed)%3],(i*1.73+this.seed)%7));}
   if((distance>23||!this.controller.riding)&&this.encounters.has(i)){this.remove(this.encounters.get(i)!);this.encounters.delete(i);}
  });
  for(const e of this.encounters.values()){
   const t=this.time+e.phase;
   if(e.kind==='ball'){const wave=Math.sin(t*.56);e.root.setPosition(e.x,.26,e.z+wave*1.25);e.root.setEulerAngles(wave*300,t*35,0);}
   const ep=e.root.getPosition(),distance=Math.hypot(p.x-ep.x,p.z-ep.z);
   if(e.kind==='crate'&&distance<.9&&this.controller.input.length()>.15&&e.moved<1.5){const delta=Math.min(dt*.8,1.5-e.moved);e.moved+=delta;e.root.setPosition(e.x,.34,e.z-e.moved);if(!this.controller.riding){this.character.animator.setWorkClip('CarryIdle');}if(!this.cooldown){this.say('A little push… room to pass!');this.cooldown=2;}}
   else if(e.kind!=='crate'&&distance<(e.kind==='puddle'?.62:.48)&&!this.airborne&&!this.cooldown){
    this.cooldown=2.5;this.controller.scooter.vx*=.45;this.controller.scooter.vz*=.45;this.say(e.kind==='puddle'?'Splish! Jump or scoot around the puddle.':'Boing! A runaway ball.');
   }
  }
  if(!this.controller.riding&&this.character.animator.currentState==='CarryIdle'&&![...this.encounters.values()].some(e=>e.kind==='crate'&&e.moved<1.5&&p.distance(e.root.getPosition())<1.1))this.character.animator.setWorkClip(null);
 }
 private create(x:number,z:number,kind:Encounter['kind'],phase:number):Encounter{
  const root=new Entity('Encounter '+kind,this.app);this.app.root.addChild(root);root.setPosition(x,kind==='ball'?.26:kind==='crate'?.34:.08,z);const s=primitives(this.app,root),materials:StandardMaterial[]=[];
  const m=(n:string,c:string)=>{const v=material(n,c);materials.push(v);return v;};const e:Encounter={root,x,z,kind,phase,moved:0,materials};
  if(kind==='ball'){
   s('Coral ball','sphere',[0,0,0],[.4,.4,.4],m('Ball coral','#e3a084'));const stripe=s('Cream equator','cylinder',[0,0,0],[.406,.07,.406],m('Ball stripe','#fff0c9'));stripe.setLocalEulerAngles(0,0,24);
  }else if(kind==='puddle'){
   const water=m('Sky puddle','#8db8c4'),rim=m('Damp paving','#b8aea1');s('Damp oval','cylinder',[0,-.008,0],[1.4,.01,.85],rim,false);s('Puddle','cylinder',[0,0,0],[1.18,.012,.72],water,false);s('Puddle shine','box',[.14,.009,.08],[.36,.004,.035],m('Puddle glint','#d2e4d9'),false);
  }else if(kind==='crate'){
   const wood=m('Peach delivery crate','#d6b483'),band=m('Crate straps','#f5e1b5');s('Rounded delivery box','box',[0,0,0],[.6,.52,.56],wood);for(const a of [-.22,.22])s('Crate stripe','box',[a,.006,0],[.05,.54,.58],band);s('Leaf decal','sphere',[0,.27,0],[.26,.02,.15],m('Leaf green','#82a477'));
  }
  return e;
 }
 private remove(e:Encounter){e.root.destroy();e.materials.forEach(m=>m.destroy());}
 snapshot(){return{jumping:this.jumping,hop:this.hop,encounters:[...this.encounters.values()].map(e=>({kind:e.kind,position:e.root.getPosition().toArray(),moved:e.moved}))};}
 destroy(){this.abort.abort();this.button.remove();for(const e of this.encounters.values())this.remove(e);}
}



