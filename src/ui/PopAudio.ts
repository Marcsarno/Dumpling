/** Reuses decoded buffers and one music source. Every one-shot disconnects on end. */
export class PopAudio {
  private context?:AudioContext;private master?:GainNode;private music?:AudioBufferSourceNode;
  private buffers=new Map<string,AudioBuffer>();private voices=new Set<AudioBufferSourceNode|OscillatorNode>();
  private loading?:Promise<void>;private musicWanted=false;private suspended=false;
  muted=false;failures:string[]=[];played=0;
  async unlock(){
    this.context??=new AudioContext();if(!this.master){this.master=this.context.createGain();this.master.connect(this.context.destination);}this.master.gain.value=this.muted?0:.5;
    await this.context.resume();
    this.loading??=Promise.all(['click_001','drop_001','drop_002','drop_003','pluck_001','confirmation_001','happy-adventure'].map(async name=>{try{const response=await fetch(`/assets/pop/audio/${name}.${name==='happy-adventure'?'mp3':'wav'}`);if(!response.ok)throw Error(name);this.buffers.set(name,await this.context!.decodeAudioData(await response.arrayBuffer()));}catch{this.failures.push(name);}})).then(()=>{});
    await this.loading;if(this.musicWanted&&!this.suspended)this.startMusic();
  }
  private sample(name:string,pitch=1,volume=.45){const ctx=this.context,buffer=this.buffers.get(name);if(!ctx||!buffer||this.voices.size>=20||this.suspended)return;
    const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;source.playbackRate.value=pitch;gain.gain.value=volume;source.connect(gain).connect(this.master!);this.voices.add(source);source.onended=()=>{source.disconnect();gain.disconnect();this.voices.delete(source);};source.start();this.played++;
  }
  private note(hz:number,time=0,length=.17,volume=.1,type:OscillatorType='sine'){
    const ctx=this.context;if(!ctx||this.voices.size>=20||this.suspended)return;const node=ctx.createOscillator(),gain=ctx.createGain(),at=ctx.currentTime+time;node.type=type;node.frequency.setValueAtTime(hz,at);node.frequency.exponentialRampToValueAtTime(hz*.82,at+length);gain.gain.setValueAtTime(.001,at);gain.gain.exponentialRampToValueAtTime(volume,at+.009);gain.gain.exponentialRampToValueAtTime(.001,at+length);node.connect(gain).connect(this.master!);this.voices.add(node);node.onended=()=>{node.disconnect();gain.disconnect();this.voices.delete(node);};node.start(at);node.stop(at+length+.02);this.played++;
  }
  select(n:number){this.sample(n%3?'click_001':'pluck_001',.9+Math.min(n,12)*.035+Math.random()*.04,.22);this.note(650+n*28,0,.05,.035);}
  pop(chain:number){this.sample(`drop_00${1+Math.floor(Math.random()*3)}`,.92+Math.random()*.16,.65);if(chain>=5)[523,659,784,...(chain>=7?[1047]:[]),...(chain>=10?[1319]:[])].forEach((n,i)=>this.note(n,i*.045,.18,.11));}
  power(kind:string){if(kind==='bomb'){this.note(140,0,.3,.25,'triangle');this.sample('drop_003',.6,.7);}else if(kind==='mega'){[110,220,440,880].forEach((n,i)=>this.note(n,i*.065,.35,.2,'triangle'));}else[660,880,1100,1320].forEach((n,i)=>this.note(n,i*.05,.2,.1));}
  countdown(n:number){this.note(n?440:880,0,.13,.12);}
  warning(){this.note(784,0,.08,.085);}
  celebrate(){this.stopMusic();this.sample('confirmation_001',1,.65);[523,659,784,1047,1319].forEach((n,i)=>this.note(n,i*.1,.3,.13));}
  setMusic(enabled:boolean){this.musicWanted=enabled;if(enabled&&!this.suspended)this.startMusic();else this.stopMusic();}
  private startMusic(){const ctx=this.context,buffer=this.buffers.get('happy-adventure');if(!ctx||!buffer||this.music)return;const node=ctx.createBufferSource(),gain=ctx.createGain();node.buffer=buffer;node.loop=true;node.loopStart=.03;node.loopEnd=buffer.duration-.08;gain.gain.value=.15;node.connect(gain).connect(this.master!);node.onended=()=>{node.disconnect();gain.disconnect();};node.start();this.music=node;}
  energy(frenzy:boolean,urgent:boolean){if(this.music&&this.context)this.music.playbackRate.setTargetAtTime(frenzy?1.08:urgent?1.035:1,this.context.currentTime,.3);}
  private stopMusic(){this.music?.stop();this.music=undefined;}
  pause(paused:boolean){this.suspended=paused;if(paused){this.stopMusic();for(const node of this.voices)node.stop();}else if(this.musicWanted)this.startMusic();}
  mute(){this.muted=!this.muted;if(this.master)this.master.gain.value=this.muted?0:.5;return this.muted;}
  snapshot(){return{state:this.context?.state,decoded:this.buffers.size,failures:[...this.failures],voices:this.voices.size,music:!!this.music,played:this.played,muted:this.muted};}
  stop(){this.musicWanted=false;this.pause(true);}
  destroy(){this.stop();void this.context?.close();}
}
