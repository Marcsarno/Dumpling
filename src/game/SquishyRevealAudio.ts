/** Short, quiet major-key bells. Cues follow animation time, so pause never queues a fanfare. */
export class SquishyRevealAudio {
  private context:AudioContext|null=null;
  private voices=new Set<OscillatorNode>();
  private note(frequency:number,delay:number,duration:number,volume:number){
    try{
      this.context??=new AudioContext();void this.context.resume().catch(()=>{});
      if(this.voices.size>=8)return;
      const c=this.context,osc=c.createOscillator(),gain=c.createGain(),t=c.currentTime+delay;
      osc.type='sine';osc.frequency.setValueAtTime(frequency,t);
      gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(volume,t+.012);
      gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
      osc.connect(gain);gain.connect(c.destination);this.voices.add(osc);
      osc.onended=()=>{osc.disconnect();gain.disconnect();this.voices.delete(osc);};
      osc.start(t);osc.stop(t+duration+.02);
    }catch{/* Silent play works when audio is unavailable. */}
  }
  anticipate(){this.stop();this.note(392,0,.16,.025);this.note(523.25,.13,.20,.022);}
  lid(){this.note(784,0,.16,.018);}
  celebrate(notes:readonly number[]){notes.forEach((n,i)=>this.note(n,i*.075,.48,.025/Math.sqrt(notes.length/2)));}
  squish(){this.note(440,0,.13,.025);this.note(659.25,.08,.19,.02);}
  stop(){for(const voice of this.voices){try{voice.stop();}catch{}}this.voices.clear();}
  destroy(){this.stop();void this.context?.close();}
}
