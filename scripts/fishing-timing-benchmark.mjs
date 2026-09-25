import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {FishingRound} from '../src/systems/FishingRound.ts';
const rows=[];
for(const seed of [.13,.35,.60,.85])for(const steer of [true,false]){const r=new FishingRound(()=>seed);r.start('timing');let t=0,rest=false,reaction=0;while(t<100){if(r.phase==='prepare')r.tap();if(r.phase==='bite'){reaction+=.01;if(reaction>=.35)r.tap();}if(r.phase==='reel'){if(r.tension>.76)rest=true;else if(r.tension<.28)rest=false;r.holdReel(!rest);r.steer(steer?r.desiredDirection:0);}r.update(.01);t+=.01;if(r.phase==='catch')break;}rows.push({seed,steer,seconds:+t.toFixed(2),fightTime:+r.fightTime.toFixed(2),phase:r.phase});}
// Baseline measured against d453aba with this same policy, dt, seeds and reaction time.
const baseline=[15.37,21.19,15.71,21.10,16.15,24.64,16.78,24.23];
rows.forEach((row,i)=>{assert.equal(row.phase,'catch');const ratio=row.seconds/baseline[i];assert.ok(ratio>.72&&ratio<.78,JSON.stringify(row));row.fasterPercent=+((1-ratio)*100).toFixed(1);});
console.log(rows);await writeFile(process.argv[2]??'artifacts/refinement/timing-after.json',JSON.stringify(rows,null,2));
