import {saveKey} from '../systems/SaveNamespace';

type Channel='music'|'effects';
const listeners=new Set<()=>void>();
const values:Partial<Record<Channel,number>>={};
export function audioLevel(channel:Channel){
 if(values[channel]===undefined){
  let value=channel==='music'?.5:1;
  try{const saved=localStorage.getItem(saveKey('audio.'+channel));if(saved!==null&&Number.isFinite(Number(saved)))value=Math.max(0,Math.min(1,Number(saved)));}catch{}
  values[channel]=value;
 }
 return values[channel]!;
}
export function onAudioChange(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
export function createAudioSettings(){
 const button=document.createElement('button');button.id='audio-settings';button.textContent='♫ Volume';button.type='button';
 const dialog=document.createElement('dialog');dialog.className='audio-settings';dialog.setAttribute('aria-label','Sound settings');
 dialog.innerHTML='<h2>Sound & performance</h2>'+(['music','effects'] as const).map(channel=>`<label>${channel==='music'?'Music':'Sound effects'} <output id="${channel}-level"></output><input type="range" min="0" max="100" step="1" data-channel="${channel}" aria-label="${channel==='music'?'Music volume':'Sound effects volume'}"></label>`).join('')+'<p>0 is silent. Your volume is saved.</p><button type="button">Done</button>';
 for(const slider of dialog.querySelectorAll<HTMLInputElement>('input')){
  const channel=slider.dataset.channel as Channel,output=dialog.querySelector<HTMLOutputElement>('#'+channel+'-level')!;
  slider.value=String(Math.round(audioLevel(channel)*100));output.value=slider.value+'%';
  slider.oninput=()=>{values[channel]=Number(slider.value)/100;output.value=slider.value+'%';try{localStorage.setItem(saveKey('audio.'+channel),String(values[channel]));}catch{}listeners.forEach(fn=>fn());};
 }
 button.onclick=()=>dialog.showModal();dialog.querySelector('button')!.onclick=()=>dialog.close();
 document.querySelector('footer')!.prepend(button);document.body.append(dialog);
 const muteRow=document.createElement('div');muteRow.className='audio-mutes';
 for(const id of ['house-music','house-effects']){const mute=document.getElementById(id);if(mute)muteRow.append(mute);}
 dialog.insertBefore(muteRow,dialog.querySelector('p'));
 const popButton=button.cloneNode(true) as HTMLButtonElement;popButton.id='pop-volume';popButton.onclick=()=>dialog.showModal();document.querySelector('#squishy-pop .pop-title')?.append(popButton);
 return()=>{dialog.remove();button.remove();popButton.remove();};
}
