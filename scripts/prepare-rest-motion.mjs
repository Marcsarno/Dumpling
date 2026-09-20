// Adapt the relaxed starting excerpt of CMU 140_08 (lying on back, then getting up).
// Only the first 0.1 sec supplies knee/elbow flex; the bed entry and breathing are authored.
import fs from 'node:fs';
const frames=[];let frame;
for(const line of fs.readFileSync('scripts/assets/rest/140_08.amc','utf8').split('\n')){const a=line.trim().split(/\s+/);if(/^\d+$/.test(a[0])){frame={};frames.push(frame);}else if(frame)frame[a[0]]=a.slice(1).map(Number);}
const avg=n=>frames.slice(0,12).reduce((sum,f)=>sum+f[n][0],0)/12;
fs.writeFileSync('public/assets/animations/rest/sleep.json',JSON.stringify({source:'CMU 140_08, frames 1–12; adapted resting flex',leftKnee:Math.min(32,avg('ltibia')*.4),rightKnee:Math.min(32,avg('rtibia')*.4),leftElbow:avg('lradius'),rightElbow:avg('rradius')}));
