import test from 'node:test';
import assert from 'node:assert/strict';
import {DUMPLINGS} from '../src/data/collection.ts';
import {SERIES,STORES,rollSeries} from '../src/data/hunt.ts';
import {DailyClock,AFTERNOON_EXTRAS} from '../src/systems/DailyClock.ts';
import {ProgressStore} from '../src/systems/ProgressStore.ts';
import {squishPose} from '../src/game/SquishPlay.ts';
import {boardPool} from '../src/data/squishyPop.ts';
test('Every store and series has exactly the agreed tier odds',()=>{
 for(const store of STORES)for(const series of SERIES){const counts={Common:0,Rare:0,Epic:0,Legendary:0};for(let i=0;i<10000;i++){let n=0;counts[rollSeries(series.id,store,()=>n++?0:(i+.5)/10000).rarity]++;}assert.deepEqual(counts,{Common:6500,Rare:2500,Epic:800,Legendary:200});}
 assert.equal(DUMPLINGS.filter(d=>d.special).length,8);
 assert.ok(DUMPLINGS.filter(d=>!d.special).every(d=>['Common','Rare'].includes(d.rarity)));
});
test('A finished reveal can advance directly, and receipts remain exactly once across reload',()=>{
 let raw=null;const repo={read:()=>raw,write:s=>raw=s};let serial=0;const s=new ProgressStore(repo,()=>0,()=>String(++serial));
 s.creditRound('test',20);s.startTrip();s.purchase();s.purchase();s.goHome();const receipt=s.openNext();assert.deepEqual(s.openNext(),receipt);
 s.finishReveal();const r=new ProgressStore(repo);assert.equal(r.data.collection.mochi,1);r.openNext();assert.equal(r.data.collection.mochi,2);assert.equal(r.data.boxes.length,0);assert.equal(r.data.balance,12);
});
test('New daily mixes cover all eleven household tasks, survive reload, and keep unfinished chores at 7 PM',()=>{
 let seed=88;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const seen=new Set(),sets=new Set();const clock=new DailyClock(random);
 for(let i=0;i<300;i++){clock.state.phase='afternoon';const ids=clock.tasks.map(t=>t.id);assert.equal(new Set(ids).size,5);ids.forEach(id=>seen.add(id));sets.add([...ids].sort().join());assert.deepEqual(new DailyClock(random,clock.state).tasks,clock.tasks);assert.equal(clock.sleep(true),false);clock.state.minutes=1140;clock.advance(40);assert.equal(clock.state.phase,'afternoon');clock.tasks.forEach(t=>clock.complete(t.id));assert.equal(clock.sleep(true),true);}
 assert.ok(sets.size>100);for(const t of AFTERNOON_EXTRAS)assert.ok(seen.has(t.id),t.id);
});
test('All three squishes return to rest with positive volume-preserving scales',()=>{
 for(const style of [0,1,2]){for(let t=0;t<1;t+=.01){const p=squishPose(t,style);assert.ok(p.scale.every(n=>n>0));assert.ok(Math.abs(p.scale.reduce((a,b)=>a*b,1)-1)<1e-8);}assert.deepEqual(squishPose(1,style),{scale:[1,1,1],roll:0});}
});
test('Pop can use every earned new friend without missing identities',()=>{
 const owned=Object.fromEntries(DUMPLINGS.map(d=>[d.id,3]));for(let i=0;i<30;i++)assert.equal(boardPool(owned).length,5);
});
