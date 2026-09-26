import {audioLevel} from './AudioSettings';
import {saveKey} from '../systems/SaveNamespace';
/** Original short toy sounds. No looping sources, downloads, or timers. */
export class PlayAudio{
 private context:AudioContext|null=null;
 unlock(){this.context??=new AudioContext();void this.context.resume().catch(()=>{});}
 tone(frequency=440,duration=.18,type:OscillatorType='sine',bend=.6){
  let muted=false;try{muted=localStorage.getItem(saveKey('house-effects.muted'))==='true';}catch{}
  if(muted||document.hidden||!this.context)return;
  const c=this.context,t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type=type;
  o.frequency.setValueAtTime(frequency,t);o.frequency.exponentialRampToValueAtTime(Math.max(35,frequency*bend),t+duration);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.09*audioLevel('effects'),t+.01);g.gain.exponentialRampToValueAtTime(.001,t+duration);
  o.connect(g).connect(c.destination);o.start();o.stop(t+duration+.01);o.onended=()=>{o.disconnect();g.disconnect();};
 }
 pop(){this.tone(850,.1,'sine',.35);}
 honk(){this.tone(260,.35,'triangle',1.3);}
 win(){this.tone(523,.5,'triangle',1.5);}
 destroy(){void this.context?.close();}
}
