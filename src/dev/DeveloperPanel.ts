import type { GameLoop } from '../game/GameLoop';
import { DUMPLINGS } from '../data/collection';
import { STORES } from '../data/hunt';
import { DeveloperSaves } from './DeveloperSaves';
import './developer-panel.css';

type Metrics={fps:number;drawCalls:number;position:number[]};
const button=(label:string,command:string,value='',exit=false)=>`<button type="button" data-command="${command}" data-value="${value}" ${exit?'data-exit':''}>${label}</button>`;
/** Loaded only by Vite's development entry point. No changes just for opening it. */
export class DeveloperPanel {
  private dialog=document.createElement('dialog');
  private saves=new DeveloperSaves();
  private abort=new AbortController();
  private timer:number;
  private launchers:HTMLButtonElement[]=[];
  private observers:MutationObserver[]=[];
  private log:string[]=[];
  constructor(private loop:GameLoop,private metrics:()=>Metrics){
    this.dialog.id='developer-panel';this.dialog.setAttribute('aria-labelledby','dev-title');
    this.dialog.innerHTML=`<div class="dev-shell">
      <header class="dev-header"><div><span class="dev-eyebrow"><i></i> GOD MODE · LOCAL BUILD</span><h2 id="dev-title">Developer studio<span>✦</span></h2><p>Less walking. More playtesting.</p></div><button class="dev-close" aria-label="Close developer panel">×</button></header>
      <div class="dev-live"><span data-scene></span><span data-clock></span><span data-wallet></span></div>
      <nav class="dev-tabs" role="tablist" aria-label="Developer tools">${['Jump in','World','Pop lab','Save & tools'].map((name,i)=>`<button role="tab" id="dev-tab-${i}" aria-controls="dev-section-${i}" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-tab="${i}">${name}</button>`).join('')}</nav>
      <div class="dev-content">
        <section role="tabpanel" id="dev-section-0" aria-labelledby="dev-tab-0">
          <button class="dev-hero" data-command="play-pop" data-exit><span class="dev-hero-icon">✿</span><span><small>STRAIGHT TO THE GOOD STUFF</small><strong>Play Squishy Pop</strong><span>Finish chores · teleport to Peachy Playroom · open game</span></span><b>↗</b></button>
          <div class="dev-card"><h3>Lilah Tornado lab</h3><p>Play a complete 55-second house round.</p><div class="dev-grid">${button('🌪️ Normal round','tornado','',true)}${button('Quiet round','tornado','none',true)}${button('🐾 Dog cameo','tornado','dog',true)}${button('🧺 Basket surprise','tornado','basket',true)}</div></div><div class="dev-card"><h3>Skip the routine</h3><p>Afternoon chores and current Lilah messes done. No allowance awarded.</p><div class="dev-grid">${button('✓ Finish chores → afternoon','skip-chores','',true)}${button('✓ Finish current cleaning','complete-current')}</div></div>
          <div class="dev-card"><h3>Go somewhere</h3><p>Store jumps set 3 PM, finish chores and refresh your shopping bag limit.</p><div class="dev-grid">${STORES.map(s=>button(s.icon+' '+s.name,'store',s.id,true)).join('')}${button('⌂ Home','home','',true)}${button('♡ Collection','collection','',true)}${button('⇄ School trading','recess','',true)}</div></div>
        </section>
        <section role="tabpanel" id="dev-section-1" aria-labelledby="dev-tab-1" hidden>
          <div class="dev-card"><h3>Day & cleaning</h3><p>Time presets return home. A new day resets daily stock and routines.</p><div class="dev-grid">${button('7 AM · morning','phase','morning')}${button('3 PM · afternoon','phase','afternoon')}${button('7 PM · night','phase','night')}${button('Next day','next-day')}${button('Finish current cleaning','complete-current')}${button('Restart daily chores','restart-chores')}${button('Freeze world clock','freeze-clock')}</div></div>
          <div class="dev-card"><h3>Resources & collection</h3><p>Favorites and locks stay protected. Copies are added without removing anything.</p><div class="dev-grid">${button('+$20 allowance','cash')}${button('+40 tickets','tickets')}${button('Discover all 26','unlock')}${button('At least 5 of each','duplicates')}${button('Restock all stores','restock')}</div><label class="dev-select-label" for="dev-friend">Choose a collectible</label><select id="dev-friend">${DUMPLINGS.map(d=>`<option value="${d.id}">${d.name} · ${d.rarity}</option>`).join('')}</select><div class="dev-grid">${button('Add one copy','give-item')}${button('Add sealed box','give-box')}</div></div>
        </section>
        <section role="tabpanel" id="dev-section-2" aria-labelledby="dev-tab-2" hidden>
          <div class="dev-notice"><strong data-pop-state>Open Squishy Pop to use the lab.</strong><p>Changing a round makes it practice: no tickets or records saved. Choose “New normal round” to earn rewards again.</p></div>
          <div class="dev-card"><h3>Round controls</h3><div class="dev-grid">${button('New normal round','pop:normal')}${button('Restart practice','pop:restart')}${button('Show tutorial','pop:tutorial')}${button('Finish practice now','pop:finish')}${button('Freeze round timer','pop:freeze')}${button('Set 10 seconds','pop:time','10')}${button('Set 60 seconds','pop:time','60')}</div></div>
          <div class="dev-card"><h3>Repeatable test boards</h3><p>Chains begin at the left of row 3, go right, then back along row 4. Resume to drag them.</p><div class="dev-grid">${[3,5,7,10].map(n=>button(`${n}-chain${n===5?' → Bomb':n===7?' → Rainbow':n===10?' → Mega':''}`,'pop:chain',String(n))).join('')}${button('Place Pop Bomb','pop:bomb')}${button('Place Rainbow','pop:rainbow')}${button('Place Mega','pop:mega')}${button('Trigger Frenzy','pop:frenzy')}${button('Shuffle board','pop:shuffle')}${button('Test no-move recovery','pop:deadlock')}</div></div>
          <button class="dev-resume">Resume game ↗</button>
        </section>
        <section role="tabpanel" id="dev-section-3" aria-labelledby="dev-tab-3" hidden>
          <div class="dev-card"><h3>A way back</h3><p data-checkpoint></p><div class="dev-grid"><button data-tool="capture">Save checkpoint now</button><button data-tool="restore">Restore checkpoint</button><button data-tool="export">Download save</button><button data-tool="reset" class="dev-danger">Fresh test save</button></div><p>Restore and fresh save reload the game. Your checkpoint stays available until you replace it.</p></div>
          <div class="dev-card"><h3>Recovery & diagnostics</h3><div class="dev-grid">${button('Unstick + reset camera','unstick','',true)}<button data-tool="diagnostics">Download diagnostics</button></div><pre data-diagnostics></pre></div>
        </section>
      </div>
      <footer class="dev-bottom"><span>Ⅱ World paused while this panel is open</span><small>Changes affect this local save. A checkpoint is kept before your first change.</small><div data-status role="status">Ready when you are.</div></footer>
    </div>`;
    document.body.append(this.dialog);
    this.launch(document.body,'dev-launch','DEV · F2');
    for(const selector of ['#squishy-pop .pop-title','#collection-dialog','#trading-dialog','#results','#hunt-routes']){const host=document.querySelector(selector);if(host){const launcher=this.launch(host,'dev-inline','DEV');const observer=new MutationObserver(()=>{if(!launcher.isConnected)(host.querySelector('header')??host).append(launcher);});observer.observe(host,{childList:true});this.observers.push(observer);}}
    const signal=this.abort.signal;
    this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.close();},{signal});
    this.dialog.querySelector('.dev-close')!.addEventListener('click',()=>this.close(),{signal});
    this.dialog.querySelector('.dev-resume')!.addEventListener('click',()=>this.close(),{signal});
    this.dialog.addEventListener('click',e=>{
      const target=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!target)return;
      if(target.dataset.tab!==undefined){this.tab(Number(target.dataset.tab));return;}
      if(target.dataset.command){let value=target.dataset.value??'';if(['give-item','give-box'].includes(target.dataset.command))value=this.dialog.querySelector<HTMLSelectElement>('#dev-friend')!.value;this.run(target.dataset.command,value,target.hasAttribute('data-exit'));}
      if(target.dataset.tool)this.tool(target.dataset.tool);
    },{signal});
    this.dialog.querySelector('.dev-tabs')!.addEventListener('keydown',e=>{const event=e as KeyboardEvent;if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const current=Number((event.target as HTMLElement).dataset.tab);const next=event.key==='Home'?0:event.key==='End'?3:(current+(event.key==='ArrowRight'?1:3))%4;this.tab(next);this.dialog.querySelector<HTMLButtonElement>(`[data-tab="${next}"]`)!.focus();},{signal});
    window.addEventListener('keydown',e=>{if(e.repeat)return;if(e.key!=='F2'&&e.code!=='Backquote')return;if(e.code==='Backquote'&&(e.target as HTMLElement).matches('input,textarea,select,[contenteditable="true"]'))return;e.preventDefault();e.stopImmediatePropagation();this.dialog.open?this.close():this.open();},{signal,capture:true});
    this.timer=window.setInterval(()=>{if(this.dialog.open)this.refresh();},500);
  }
  private launch(host:Element,style:string,text:string){const b=document.createElement('button');b.type='button';b.className=style;b.textContent=text;b.setAttribute('aria-label','Open developer panel');b.addEventListener('click',()=>this.open(),{signal:this.abort.signal});host.append(b);this.launchers.push(b);return b;}
  private open(){if(this.dialog.open)return;this.loop.developerHold(true);this.dialog.showModal();this.refresh();}
  private close(){if(!this.dialog.open)return;this.dialog.close();this.loop.developerHold(false);}
  private tab(n:number){this.dialog.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b,i)=>{b.setAttribute('aria-selected',String(i===n));b.tabIndex=i===n?0:-1;});this.dialog.querySelectorAll<HTMLElement>('[role="tabpanel"]').forEach((p,i)=>p.hidden=i!==n);this.dialog.querySelector('.dev-content')!.scrollTop=0;this.refresh();}
  private message(text:string,error=false){this.log.unshift(`${new Date().toLocaleTimeString()} · ${text}`);this.log.length=Math.min(this.log.length,6);const status=this.dialog.querySelector<HTMLElement>('[data-status]')!;status.textContent=text;status.dataset.error=String(error);}
  private run(command:string,value:string,exit:boolean){try{this.saves.ensure();if(exit)this.close();this.loop.developerCommand(command,value);this.message('Done · '+command.replaceAll('-',' ').replace('pop:','Pop lab: '));this.refresh();}catch(e){if(!this.dialog.open)this.open();this.message((e as Error).message,true);}}
  private tool(action:string){try{
    if(action==='capture'){if(this.saves.read()&&!confirm('Replace the existing checkpoint with your current saved game?'))return;this.saves.capture();this.message('Checkpoint saved.');}
    else if(action==='restore'){if(!confirm('Restore your developer checkpoint? Current game progress will be replaced and the game will reload.'))return;this.saves.restore();location.reload();}
    else if(action==='reset'){if(!confirm('Start a fresh test save? Current progress will be cleared; your developer checkpoint will remain available.'))return;this.saves.reset();location.reload();}
    else if(action==='export'){this.download('arianna-save',this.saves.current());this.message('Save downloaded.');}
    else if(action==='diagnostics'){this.download('arianna-diagnostics',{at:new Date().toISOString(),game:this.loop.developerSummary(),render:this.metrics(),recentActions:this.log});this.message('Diagnostics downloaded.');}
    this.refresh();
  }catch(e){this.message((e as Error).message,true);}}
  private download(name:string,data:unknown){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  private refresh(){const s=this.loop.developerSummary(),m=this.metrics();const set=(selector:string,text:string)=>{this.dialog.querySelector(selector)!.textContent=text;};
    set('[data-scene]',s.store??(s.scene==='cleanup'?'Home · '+s.cleanup:s.scene));set('[data-clock]',`Day ${s.day} · ${s.time}`);set('[data-wallet]',`$${s.balance} · ${s.tickets} tickets`);
    const popReady=s.pop.open&&s.popDev.ready;
    set('[data-pop-state]',popReady?`${s.popDev.practice?'PRACTICE':'NORMAL ROUND'} · ${s.pop.state} · ${Math.ceil(s.pop.remaining)} seconds${s.popDev.freeze?' · timer frozen':''}`:'Open Squishy Pop from Jump in to use the lab.');
    this.dialog.querySelectorAll<HTMLButtonElement>('[data-command^="pop:"]').forEach(b=>b.disabled=!popReady);
    for(const [cmd,pressed] of [['freeze-clock',s.clockFrozen],['pop:freeze',s.popDev.freeze]] as const){const b=this.dialog.querySelector(`[data-command="${cmd}"]`)!;b.setAttribute('aria-pressed',String(pressed));}
    set('[data-diagnostics]',`Scene: ${s.scene} / ${s.phase}\nRender: ${Math.round(m.fps)} FPS · ${m.drawCalls} draw calls\nPosition: ${m.position.map(v=>v.toFixed(2)).join(', ')}\nCollection: ${s.discovered}/26 · sealed boxes: ${s.boxes}\nCleaning: ${s.completed}/${s.tasks}\nPop: ${s.pop.score} points · best chain ${s.pop.bestChain}\nPop frame p95: ${s.pop.frameP95.toFixed(1)} ms\nParticles: ${s.pop.particles}/90 · art: ${s.pop.artFriends}/26\nPlayable chain: ${s.pop.valid.length} pieces`);
    try{const c=this.saves.read();set('[data-checkpoint]',c?`Checkpoint: ${new Date(c.created).toLocaleString()}`:'No checkpoint yet. One is captured automatically before your first developer change.');this.dialog.querySelector<HTMLButtonElement>('[data-tool="restore"]')!.disabled=!c;}catch(e){set('[data-checkpoint]',(e as Error).message);}
  }
  destroy(){this.close();clearInterval(this.timer);this.abort.abort();this.observers.forEach(o=>o.disconnect());this.launchers.forEach(b=>b.remove());this.dialog.remove();}
}
