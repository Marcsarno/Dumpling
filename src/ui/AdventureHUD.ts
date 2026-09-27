import './adventure.css';

const icons = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  book: '<path d="M12 6C9 3 5 3 2 4v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-7-1-10 2Zm0 0v15M6 8h2m-2 4h2m8-4h2m-2 4h2"/>',
  flower: '<path d="M12 9c-7-10-12 1-5 4-9 4 0 12 5 4 5 8 14 0 5-4 7-3 2-14-5-4Z"/><circle cx="12" cy="13" r="2"/>',
  bag: '<path d="M5 8h14l1 13H4L5 8Zm4 1V6a3 3 0 0 1 6 0v3"/>',
  sound: '<path d="m4 9 4 0 5-4v14l-5-4H4V9Zm12-1c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/>',
  menu: '<path d="M4 7h16M4 12h11M4 17h16"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  spark: '<path d="m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8L12 2Z"/>',
};
export function hudIcon(name: keyof typeof icons) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
}
export type AdventureState = {
  scene: string; location: string; day: number; time: string; phase: string;
  timed: boolean; mode: string; remaining: string; running: boolean; revealing: boolean;
  tasks: readonly { id: string; name: string; room?: string }[];
  completed: ReadonlySet<string>; hint: string;
};

/** Presentation owns layout; existing controls still own their game commands and guards. */
export class AdventureHUD {
  private game = document.querySelector<HTMLElement>('#game')!;
  private root = document.createElement('div');
  private menu = document.createElement('dialog');
  private journal = document.createElement('dialog');
  private abort = new AbortController();
  private taskSignature = '';
  private modePicker = document.querySelector<HTMLElement>('#mission-picker')!;
  private modeParent = this.modePicker.parentElement!;
  private routeButtons = new Map<HTMLButtonElement, string>();
  private lastFocus?: HTMLElement;
  private actionGlyph = document.createElement('span');
  private actionKey = document.createElement('kbd');
  private observer: MutationObserver;
  private hasModal = false;
  constructor(private resetInput: () => void) {
    this.game.classList.add('adventure-ui');
    this.game.dataset.input = matchMedia('(pointer:coarse)').matches ? 'touch' : 'pointer';
    this.root.id = 'adventure-hud';
    this.root.innerHTML = `<div class="adventure-status"><div class="day-seal">${hudIcon('sun')}</div><div class="place-copy"><span id="adventure-time"></span><strong id="adventure-place"></strong></div><button id="adventure-today" aria-label="Open today's journal">${hudIcon('book')}<span>Today <b id="adventure-count"></b></span></button></div><div class="adventure-tools"><div class="adventure-wallet" aria-label="Wallet">${hudIcon('bag')}<strong id="adventure-balance"></strong></div><button id="adventure-menu-open" aria-label="Open game menu">${hudIcon('menu')}<span>Menu</span></button></div><div class="adventure-timer" hidden><small>TIME LEFT</small><strong></strong></div><div class="adventure-keyboard" aria-hidden="true"><kbd>W A S D</kbd><span>Move</span></div>`;
    this.menu.id = 'adventure-menu';this.menu.className = 'adventure-panel';this.menu.setAttribute('aria-labelledby','adventure-menu-title');
    this.menu.innerHTML = `<header class="adventure-panel-head"><div><span class="adventure-overline">A LITTLE TIME FOR YOU</span><h2 id="adventure-menu-title">Arianna<span class="brand-petal">${hudIcon('flower')}</span></h2></div><button class="adventure-close" aria-label="Close menu">${hudIcon('close')}</button></header><div class="adventure-panel-body"><button class="adventure-resume">Back to the adventure ${hudIcon('arrow')}</button><nav class="adventure-destinations" aria-label="Game menu"><button data-journal>${hudIcon('book')}<span><strong>Today's journal</strong><small>Your little things to do</small></span>${hudIcon('arrow')}</button><button data-route="#collection-button">${hudIcon('bag')}<span><strong>My collection</strong><small data-collection-count>Your squishy friends</small></span>${hudIcon('arrow')}</button><button data-route="#squishy-pop-shortcut">${hudIcon('flower')}<span><strong>Squishy Pop</strong><small>A little arcade break</small></span>${hudIcon('arrow')}</button><button data-route="#audio-settings">${hudIcon('sound')}<span><strong>Sound & settings</strong><small>Make yourself comfortable</small></span>${hudIcon('arrow')}</button></nav><p class="adventure-availability" hidden>Collection opens after your round or outing.</p><details class="adventure-activities"><summary>Choose an activity</summary><p>Daily life, a quick cleanup, or time to explore.</p><div data-modes></div></details><details class="adventure-help"><summary>How to play</summary><p>Drag the movement stick, or use WASD / arrow keys. Walk close to something, then use the large action button or E / Space. Outside, use Jump or J. Hold the action button when it says “Hold to clean.”</p><p data-help></p></details><p class="adventure-clock-note"></p><div class="adventure-menu-foot"><a href="./asset-credits.html" target="_blank" rel="noopener">Art credits</a><button data-developer hidden>Developer tools</button></div></div>`;
    this.journal.id='adventure-journal';this.journal.className='adventure-panel';this.journal.setAttribute('aria-labelledby','adventure-journal-title');
    this.journal.innerHTML=`<header class="adventure-panel-head"><div><span class="adventure-overline" data-journal-day></span><h2 id="adventure-journal-title">A lovely little day.</h2></div><button class="adventure-close" aria-label="Close journal">${hudIcon('close')}</button></header><div class="adventure-panel-body"><div class="journal-summary">${hudIcon('book')}<span data-summary></span></div><ol class="journal-tasks"></ol><div class="journal-hint"><span class="adventure-overline">A LITTLE NUDGE</span><p data-hint></p></div><p class="adventure-clock-note"></p><button class="adventure-resume">Let's go ${hudIcon('arrow')}</button></div>`;
    this.menu.querySelector('[data-modes]')!.append(this.modePicker);
    this.game.append(this.root,this.menu,this.journal);
    const signal=this.abort.signal;
    for(const button of document.querySelectorAll<HTMLButtonElement>('[data-collection-filter]'))button.addEventListener('click',()=>{
      document.querySelector<HTMLElement>('#collection-dialog')!.dataset.filter=button.dataset.collectionFilter;
      for(const peer of document.querySelectorAll('[data-collection-filter]'))peer.setAttribute('aria-pressed',String(peer===button));
    },{signal});
    const credits=this.menu.querySelector<HTMLAnchorElement>('.adventure-menu-foot a')!;
    credits.href=document.querySelector<HTMLAnchorElement>('.asset-credits')!.href;
    this.root.querySelector('#adventure-menu-open')!.addEventListener('click',()=>this.open(this.menu),{signal});
    this.root.querySelector('#adventure-today')!.addEventListener('click',()=>this.open(this.journal),{signal});
    for(const dialog of [this.menu,this.journal]) {
      for(const button of dialog.querySelectorAll('.adventure-close,.adventure-resume'))button.addEventListener('click',()=>this.close(),{signal});
      dialog.addEventListener('cancel',e=>{e.preventDefault();this.close();},{signal});
      dialog.addEventListener('close',()=>this.resetInput(),{signal});
    }
    this.menu.querySelector('[data-journal]')!.addEventListener('click',()=>{this.menu.close();this.open(this.journal);},{signal});
    for(const button of this.menu.querySelectorAll<HTMLButtonElement>('[data-route]')) {
      const selector=button.dataset.route!;this.routeButtons.set(button,selector);
      button.addEventListener('click',()=>{const target=document.querySelector<HTMLButtonElement>(selector);if(!target||target.disabled)return;this.close();target.click();},{signal});
    }
    this.modePicker.addEventListener('click',e=>{if((e.target as HTMLElement).closest('button:not(:disabled)'))this.close();},{capture:true,signal});
    this.menu.querySelector('[data-developer]')!.addEventListener('click',()=>{this.close();document.querySelector<HTMLButtonElement>('.dev-launch')?.click();},{signal});
    this.actionGlyph.className='adventure-action-glyph';this.actionGlyph.innerHTML=hudIcon('spark');
    this.actionKey.className='adventure-action-key';this.actionKey.textContent='E';
    document.querySelector('#action-button')!.append(this.actionGlyph,this.actionKey);
    window.addEventListener('pointerdown',e=>{this.game.dataset.input=e.pointerType==='touch'?'touch':'pointer';},{signal});
    window.addEventListener('keydown',e=>{
      if(e.code==='Tab')this.game.dataset.input='keyboard';
      if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)&&!document.querySelector('dialog[open]')){this.game.dataset.input='keyboard';document.querySelector<HTMLElement>('#game-canvas')!.focus({preventScroll:true});}
      if(e.code==='Escape'&&!document.querySelector('dialog[open]')){e.preventDefault();this.open(this.menu);}
    },{signal});
    // Reset held movement/actions at all modal boundaries, including specialist game panels.
    this.observer=new MutationObserver(()=>this.syncModal());
    this.observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
  }
  private syncModal(){
    const opened=!!document.querySelector('dialog[open]');
    if(opened!==this.hasModal){this.resetInput();this.hasModal=opened;}
    this.game.dataset.modal=String(opened);
    if(this.isOpen&&document.querySelector('dialog[open]:not(#adventure-menu):not(#adventure-journal)'))this.close();
  }
  get isOpen(){return this.menu.open||this.journal.open;}
  private open(dialog:HTMLDialogElement){
    if(document.querySelector('dialog[open]'))return;
    if(document.activeElement instanceof HTMLElement&&!document.activeElement.closest('dialog'))this.lastFocus=document.activeElement;
    this.resetInput();dialog.showModal();this.syncModal();
    dialog.querySelector<HTMLElement>('.adventure-close')!.focus({preventScroll:true});
  }
  private close(){
    this.menu.close();this.journal.close();this.resetInput();
    if(!document.querySelector('dialog[open]'))this.lastFocus?.focus({preventScroll:true});
  }
  private text(scope:ParentNode,selector:string,value:string){const node=scope.querySelector(selector)!;if(node.textContent!==value)node.textContent=value;}
  update(state:AdventureState){
    const completed=state.tasks.filter(task=>state.completed.has(task.id)).length;
    this.text(this.root,'#adventure-place',state.location);
    this.text(this.root,'#adventure-time',`Day ${state.day} · ${state.time}`);
    this.text(this.root,'#adventure-balance',document.querySelector('#wallet')!.textContent??'$0');
    this.text(this.root,'#adventure-count',state.mode==='practice'?'':`${completed}/${state.tasks.length}`);
    this.game.dataset.revealing=String(state.revealing);
    const timer=this.root.querySelector<HTMLElement>('.adventure-timer')!;
    timer.hidden=!state.timed||state.scene!=='cleanup';this.text(timer,'strong',state.remaining);
    timer.classList.toggle('urgent',document.querySelector('#mission-clock')!.classList.contains('soon'));
    for(const [button,selector] of this.routeButtons)button.disabled=!!document.querySelector<HTMLButtonElement>(selector)?.disabled;
    this.text(this.menu,'[data-collection-count]',(document.querySelector('#collection-button')!.textContent??'').replace('Collection · ',''));
    this.menu.querySelector<HTMLElement>('.adventure-availability')!.hidden=!document.querySelector<HTMLButtonElement>('#collection-button')!.disabled;
    this.menu.querySelector<HTMLElement>('[data-developer]')!.hidden=!document.querySelector('.dev-launch');
    this.text(this.menu,'[data-help]',state.hint);
    this.menu.querySelector<HTMLElement>('.adventure-activities')!.hidden=state.scene!=='cleanup';
    const clockNote=state.timed&&state.running?'Your round timer keeps running while you browse.':state.scene==='cleanup'&&state.mode==='day'?'Your day continues while you browse.':'';
    for(const panel of [this.menu,this.journal])this.text(panel,'.adventure-clock-note',clockNote);
    this.text(this.journal,'[data-journal-day]',`DAY ${state.day} · ${state.phase.toUpperCase()}`);
    this.text(this.journal,'[data-summary]',state.mode==='practice'?'Take your time. Explore freely.':`${completed} of ${state.tasks.length} little things done`);
    this.text(this.journal,'[data-hint]',state.hint);
    const signature=JSON.stringify([state.mode,state.tasks,[...state.completed]]);
    if(signature!==this.taskSignature){
      this.taskSignature=signature;const list=this.journal.querySelector('.journal-tasks')!;list.replaceChildren();
      if(state.mode==='practice'){const p=document.createElement('li');p.textContent='No checklist today. See what you can discover.';list.append(p);}
      else for(const task of state.tasks){
        const row=document.createElement('li'),mark=document.createElement('span'),copy=document.createElement('div'),name=document.createElement('strong'),place=document.createElement('small');
        const done=state.completed.has(task.id);row.classList.toggle('done',done);mark.className='journal-check';mark.textContent=done?'✓':'';mark.setAttribute('aria-label',done?'Complete':'To do');
        const rooms:Record<string,string>={teeth:'Bathroom',outfit:'Bedroom',breakfast:'Kitchen',read:'Bedroom'};
        name.textContent=task.name;place.textContent=task.room??rooms[task.id]??'';copy.append(name);if(place.textContent)copy.append(place);row.append(mark,copy);list.append(row);
      }
    }
    const action=document.querySelector<HTMLButtonElement>('#action-button')!;
    this.game.dataset.action=action.disabled?'idle':'ready';
  }
  destroy(){this.observer.disconnect();this.abort.abort();this.modeParent.append(this.modePicker);this.root.remove();this.menu.remove();this.journal.remove();this.actionGlyph.remove();this.actionKey.remove();this.game.classList.remove('adventure-ui');}
}
