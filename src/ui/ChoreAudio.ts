import {saveKey} from '../systems/SaveNamespace';
import {assetUrl} from '../editor/AssetUrls';
import {audioLevel,onAudioChange} from './AudioSettings';

/** Recorded CC0 foley. One action loop with cached decoded buffers. */
export class ChoreAudio {
 private context?:AudioContext;private master?:GainNode;private source?:AudioBufferSourceNode;
 private kind='';private muted=false;private abort=new AbortController();private button=document.createElement('button');
 private buffers=new Map<string,AudioBuffer>();private loading?:Promise<void>;private generation=0;
 private voices=new Set<AudioBufferSourceNode>();private failures:string[]=[];
 private unsubscribe=onAudioChange(()=>this.volume());
 constructor(){
  try{this.muted=localStorage.getItem(saveKey('house-effects.muted'))==='true';}catch{}
  this.button.id='house-effects';this.button.type='button';this.paint();document.querySelector('footer')!.prepend(this.button);
  this.button.onclick=()=>{this.muted=!this.muted;try{localStorage.setItem(saveKey('house-effects.muted'),String(this.muted));}catch{}this.paint();this.volume();};
  const unlock=()=>{void this.unlock();};document.addEventListener('pointerdown',unlock,{signal:this.abort.signal});document.addEventListener('keydown',unlock,{signal:this.abort.signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)this.silence();},{signal:this.abort.signal});
 }
 private volume(){if(this.master)this.master.gain.value=this.muted?0:audioLevel('effects');}
 private async unlock(){
  this.context??=new AudioContext();if(!this.master){this.master=this.context.createGain();this.master.connect(this.context.destination);this.volume();}
  await this.context.resume().catch(()=>{});
  const names=['vacuum','munch','wipe','water','handle'];
  this.loading??=Promise.all(names.map(async name=>{try{const response=await fetch(assetUrl(`/assets/audio/foley/${name}.mp3`));if(!response.ok)throw Error(name);this.buffers.set(name,await this.context!.decodeAudioData(await response.arrayBuffer()));}catch{this.failures.push(name);}})).then(()=>{});
  await this.loading;
 }
 private paint(){this.button.textContent=this.muted?'◖ Off':'◖ Sounds';this.button.setAttribute('aria-label',this.muted?'Turn house sounds on':'Mute house sounds');this.button.setAttribute('aria-pressed',String(!this.muted));}
 private play(name:string,volume:number,loop=false){
  const ctx=this.context,buffer=this.buffers.get(name);if(!ctx||!buffer||!this.master||document.hidden||this.voices.size>=5)return;
  const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;source.loop=loop;gain.gain.value=volume;
  source.connect(gain).connect(this.master);this.voices.add(source);source.onended=()=>{source.disconnect();gain.disconnect();this.voices.delete(source);};source.start();return source;
 }
 start(id:string){
  this.stop();const token=this.generation;
  const kind=/vacuum|dirt|mess-2/.test(id)?'vacuum':/eat/.test(id)?'munch':/wipe|mess-1/.test(id)?'wipe':/wash|teeth/.test(id)?'water':/sleep|lilah-bed/.test(id)?'':'handle';
  if(!kind)return;this.kind=kind;
  void this.unlock().then(()=>{if(token!==this.generation||document.hidden)return;this.source=this.play(kind,kind==='vacuum'?.23:kind==='water'?.3:kind==='munch'?.5:.4,kind!=='handle');});
 }
 update(){}
 stop(){this.generation++;this.source?.stop();this.source=undefined;this.kind='';}
 silence(){this.stop();for(const voice of this.voices){try{voice.stop();}catch{}}}
 snapshot(){return{kind:this.kind,playing:!!this.source,muted:this.muted,state:this.context?.state,decoded:this.buffers.size,failures:this.failures,steps:0};}
 destroy(){this.silence();this.unsubscribe();this.abort.abort();this.button.remove();void this.context?.close();}
}
