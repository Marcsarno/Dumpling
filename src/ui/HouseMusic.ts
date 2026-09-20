/** Two gentle CC0 tracks, quiet matched levels, soft starts and space between repeats. */
export class HouseMusic {
 private audio=new Audio();private unlocked=false;private wanted=false;private muted=false;
 private button=document.createElement('button');private night=false;private index=0;private gap=0;private pending=false;
 private tracks=['/assets/audio/sunny-house.mp3','/assets/audio/evening-house.mp3'];
 constructor(){
  try{this.muted=localStorage.getItem('arianna.house-music.muted')==='true';}catch{}
  this.audio.volume=0;this.audio.preload='none';this.audio.src=this.tracks[0];
  this.audio.addEventListener('ended',()=>{this.gap=12;this.audio.volume=0;});
  this.button.id='house-music';this.button.type='button';this.paint();document.querySelector('footer')!.prepend(this.button);
  this.button.onclick=()=>{this.muted=!this.muted;try{localStorage.setItem('arianna.house-music.muted',String(this.muted));}catch{}this.paint();this.sync();};
  const unlock=()=>{this.unlocked=true;this.sync();};document.addEventListener('pointerdown',unlock,{once:true});document.addEventListener('keydown',unlock,{once:true});
  document.addEventListener('visibilitychange',()=>this.sync());
 }
 private paint(){this.button.textContent=this.muted?'♫ Off':'♫ Music';this.button.title=(this.index?'Gentle piano':'Sunny ukulele')+' · tap to '+(this.muted?'play':'mute');this.button.setAttribute('aria-label',this.muted?'Turn house music on':'Mute house music');this.button.setAttribute('aria-pressed',String(!this.muted));}
 private sync(){if(this.wanted&&this.unlocked&&!this.muted&&!document.hidden&&!this.gap){if(this.audio.paused&&!this.pending){this.pending=true;void this.audio.play().catch(()=>{}).finally(()=>{this.pending=false;});}}else{this.audio.pause();this.audio.volume=0;}}
 private track(index:number){this.index=index;this.audio.pause();this.audio.src=this.tracks[index];this.audio.volume=0;this.gap=0;this.paint();this.sync();}
 update(active:boolean,night=false,dt=0){
  if(this.night!==night){this.night=night;this.track(night?1:0);}
  if(this.wanted!==active){this.wanted=active;this.sync();}
  if(!active||this.muted||document.hidden)return;
  if(this.gap){this.gap=Math.max(0,this.gap-Math.min(dt,.1));if(!this.gap)this.track(this.night?1:1-this.index);return;}
  if(!this.audio.paused){const left=this.audio.duration-this.audio.currentTime,target=Number.isFinite(left)?Math.min(.32,Math.max(0,left/3)*.32):.32;this.audio.volume=Math.max(0,Math.min(target,this.audio.volume+dt*.12));}
 }
 snapshot(){return{playing:!this.audio.paused,muted:this.muted,track:this.index?'Gentle piano':'Sunny ukulele',volume:this.audio.volume,gap:this.gap,duration:this.audio.duration,error:this.audio.error?.message??null};}
}
