import {saveKey} from '../systems/SaveNamespace';
import {assetUrl} from '../editor/AssetUrls';
export interface MusicScene {
 mode:'cleanup'|'home'|'store'|'recess'; phase:string; store:string;
 paused:boolean; revealing:boolean;
}
const tracks={
 home:{file:'Squishy home clean.mp3',name:'Home · morning & night'},
 chores:{file:'Squishy Home clean v2.mp3',name:'Home · after-school chores'},
 school:{file:'Squishy school trading.mp3',name:'School trading'},
 shop:{file:'Squishy shopping.mp3',name:'Shopping · 1'},
 shop2:{file:'Squishy shopping v2.mp3',name:'Shopping · 2'},
} as const;
type Track=keyof typeof tracks;

/** One music voice across scenes. Pop owns its separate, unchanged soundtrack. */
export class HouseMusic {
 private audio=new Audio();private unlocked=false;private wanted=false;private muted=false;
 private button=document.createElement('button');private abort=new AbortController();
 private current:Track='home';private desired:Track='home';private lastStore='';private secondStore=false;
 private gap=0;private pending=false;
 constructor(){
  try{this.muted=localStorage.getItem(saveKey('house-music.muted'))==='true';}catch{}
  this.audio.volume=0;this.audio.preload='none';this.audio.src=this.url(this.current);
  this.audio.addEventListener('ended',()=>{this.gap=5;this.audio.volume=0;},{signal:this.abort.signal});
  this.button.id='house-music';this.button.type='button';this.paint();document.querySelector('footer')!.prepend(this.button);
  this.button.onclick=()=>{this.muted=!this.muted;try{localStorage.setItem(saveKey('house-music.muted'),String(this.muted));}catch{}this.paint();this.sync();};
  const unlock=()=>{this.unlocked=true;this.sync();};
  document.addEventListener('pointerdown',unlock,{signal:this.abort.signal});
  document.addEventListener('keydown',unlock,{signal:this.abort.signal});
  document.addEventListener('visibilitychange',()=>this.sync(),{signal:this.abort.signal});
 }
 private url(track:Track){return assetUrl(`${import.meta.env.BASE_URL}assets/audio/${encodeURIComponent(tracks[track].file)}`);}
 private paint(){this.button.textContent=this.muted?'♫ Off':'♫ Music';this.button.title=tracks[this.desired].name+' · tap to '+(this.muted?'play':'mute');this.button.setAttribute('aria-label',this.muted?'Turn music on':'Mute music');this.button.setAttribute('aria-pressed',String(!this.muted));}
 private sync(){
  if(this.wanted&&this.unlocked&&!this.muted&&!document.hidden&&!this.gap){
   if(this.audio.paused&&!this.pending){this.pending=true;void this.audio.play().catch(()=>{}).finally(()=>{this.pending=false;});}
  }else{this.audio.pause();this.audio.volume=0;}
 }
 private switchTrack(){this.current=this.desired;this.audio.pause();this.audio.src=this.url(this.current);this.audio.volume=0;this.gap=0;this.sync();}
 update(scene:MusicScene,dt=0){
  // Temporarily pausing for Pop or DEV must not count as a store visit.
  if(scene.mode==='store'&&scene.store!==this.lastStore){if(this.lastStore)this.secondStore=!this.secondStore;this.lastStore=scene.store;}
  const choice:Track=scene.mode==='store'?(this.secondStore?'shop2':'shop'):scene.mode==='recess'?'school':scene.phase==='afternoon'?'chores':'home';
  if(this.desired!==choice){this.desired=choice;this.paint();}
  this.wanted=!scene.paused;
  if(!this.wanted||this.muted||document.hidden){this.sync();return;}
  const step=Math.min(.1,Math.max(0,dt));
  if(this.current!==this.desired){
   this.audio.volume=Math.max(0,this.audio.volume-step*.45);
   if(this.audio.volume<=.001||this.audio.paused)this.switchTrack();
   return;
  }
  if(this.gap){this.gap=Math.max(0,this.gap-step);if(!this.gap){this.audio.currentTime=0;this.sync();}return;}
  this.sync();
  if(!this.audio.paused){
   const left=this.audio.duration-this.audio.currentTime,level=scene.revealing?.09:.28;
   const target=Number.isFinite(left)?Math.min(level,Math.max(0,left/3)*level):level;
   this.audio.volume=Math.max(0,Math.min(1,this.audio.volume+Math.max(-step*.45,Math.min(step*.14,target-this.audio.volume))));
  }
 }
 snapshot(){return{playing:!this.audio.paused,muted:this.muted,track:tracks[this.current].name,requested:tracks[this.desired].name,source:decodeURIComponent(this.audio.src),position:this.audio.currentTime,volume:this.audio.volume,gap:this.gap,duration:this.audio.duration,error:this.audio.error?.message??null};}
 destroy(){this.abort.abort();this.audio.pause();this.audio.removeAttribute('src');this.audio.load();this.button.remove();}
}
