import {saveKey} from '../systems/SaveNamespace';

/** Original synthesized household foley: no downloads, loops stop with the action. */
export class ChoreAudio {
 private context?:AudioContext;private master?:GainNode;private source?:AudioBufferSourceNode;private hum?:OscillatorNode;
 private envelope?:GainNode;private kind='';private next=0;private muted=false;private abort=new AbortController();
 private button=document.createElement('button');
 constructor(){
  try{this.muted=localStorage.getItem(saveKey('house-effects.muted'))==='true';}catch{}
  this.button.id='house-effects';this.button.type='button';this.paint();document.querySelector('footer')!.prepend(this.button);
  this.button.onclick=()=>{this.muted=!this.muted;try{localStorage.setItem(saveKey('house-effects.muted'),String(this.muted));}catch{}this.paint();if(this.master)this.master.gain.value=this.muted?0:.22;};
  const unlock=()=>{this.context??=new AudioContext();if(!this.master){this.master=this.context.createGain();this.master.gain.value=this.muted?0:.22;this.master.connect(this.context.destination);}void this.context.resume().catch(()=>{});};
  document.addEventListener('pointerdown',unlock,{signal:this.abort.signal});document.addEventListener('keydown',unlock,{signal:this.abort.signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)this.stop();},{signal:this.abort.signal});
 }
 private paint(){this.button.textContent=this.muted?'◖ Off':'◖ Sounds';this.button.setAttribute('aria-label',this.muted?'Turn house sounds on':'Mute house sounds');this.button.setAttribute('aria-pressed',String(!this.muted));}
 start(id:string){
  this.stop();const ctx=this.context;if(!ctx||!this.master||document.hidden)return;
  this.kind=/vacuum|dirt|mess-2/.test(id)?'vacuum':/eat/.test(id)?'munch':/wipe|wash|teeth|mess-1/.test(id)?'swish':/sleep|lilah-bed/.test(id)?'soft':'touch';
  const buffer=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),data=buffer.getChannelData(0);let smooth=0;
  for(let i=0;i<data.length;i++){smooth=(smooth+(Math.random()*2-1)*.12)/1.12;data[i]=smooth;}
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;source.loop=true;
  filter.type='bandpass';filter.frequency.value=this.kind==='vacuum'?460:this.kind==='munch'?1350:2100;filter.Q.value=.65;
  gain.gain.value=0;source.connect(filter).connect(gain).connect(this.master);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};source.start();this.source=source;this.envelope=gain;this.next=0;
  if(this.kind==='vacuum'){gain.gain.setTargetAtTime(.65,ctx.currentTime,.1);const hum=ctx.createOscillator(),g=ctx.createGain();hum.type='triangle';hum.frequency.value=115;g.gain.value=.08;hum.connect(g).connect(this.master);hum.onended=()=>{hum.disconnect();g.disconnect();};hum.start();this.hum=hum;}
 }
 update(){const ctx=this.context,gain=this.envelope;if(!ctx||!gain||this.kind==='vacuum'||ctx.currentTime<this.next)return;
  const t=ctx.currentTime,munch=this.kind==='munch',soft=this.kind==='soft';this.next=t+(munch?.36:this.kind==='swish'?.42:.65);
  gain.gain.cancelScheduledValues(t);gain.gain.setValueAtTime(.001,t);gain.gain.linearRampToValueAtTime(soft?.12:munch?.7:.5,t+.04);gain.gain.exponentialRampToValueAtTime(.001,t+(munch?.17:.3));
 }
 stop(){this.source?.stop();this.hum?.stop();this.source=undefined;this.hum=undefined;this.envelope=undefined;this.kind='';}
 snapshot(){return{kind:this.kind,playing:!!this.source,muted:this.muted,state:this.context?.state};}
 destroy(){this.stop();this.abort.abort();this.button.remove();void this.context?.close();}
}
