import { PopBoard, boardPool, POP_RULES, roundTickets, starLevel, powerForChain, type PopResult } from '../data/squishyPop';
import { DUMPLINGS } from '../data/collection';
import { PopAudio } from './PopAudio';
import { PopArt } from './PopArt';
import './squishy-pop.css';

type Particle={x:number;y:number;vx:number;vy:number;life:number;color:string;shape:number};
/** One canvas and a bounded effects pool; the store remains loaded behind the dialog. */
export class SquishyPopUI {
  readonly dialog=document.createElement('dialog');
  readonly launch=document.createElement('button');
  private canvas!:HTMLCanvasElement;private ctx!:CanvasRenderingContext2D;
  private board=new PopBoard(boardPool({}));
  private art=new PopArt();private images=this.art.friends;
  private state:'intro'|'lesson'|'countdown'|'playing'|'finale'|'results'='intro';
  private remaining:number=POP_RULES.seconds;private countdown=3.8;private activeTime=0;private last=0;private frame=0;
  private pointer:number|null=null;private previous:{x:number;y:number}|null=null;
  private lockedUntil=0;private moves=new Map<number,{from:number;to:number}>();
  private particles:Particle[]=Array.from({length:90},()=>({x:0,y:0,vx:0,vy:0,life:0,color:'',shape:0}));
  private burst=0;private feedback='';private feedbackUntil=0;private paused=false;
  private abort=new AbortController();private observer:ResizeObserver;private size=360;
  private receipt='';private saved=false;
  private audio=new PopAudio();private lastSecond=60;private lastCount=4;private frenzyWas=false;
  private gone:PopResult['cleared']=[];private lastResult?:PopResult;private frameSamples:number[]=[];
  private reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  private developerHold=false;private developerPractice=false;private developerFreeze=false;private prepared=false;
  private prepareVersion=0;
  private finaleAt=0;private finaleDone=false;private resultsAt=0;private previousBest=0;private ticketTotal=0;private lessonDoneAt=0;private chainCue='';
  constructor(private collection:()=>Record<string,number>,private award:(id:string,score:number)=>number,private onOpen:(open:boolean)=>void,private firstPlay:()=>boolean=()=>true,private record:()=>{bestScore:number;tickets:number}=()=>({bestScore:0,tickets:0})){
    this.launch.id='play-squishy-pop';this.launch.className='pop-launch';this.launch.innerHTML='<span>✿</span> PLAY SQUISHY POP <small>Little pops. Big smiles. · 60 sec</small>';this.launch.hidden=true;document.body.append(this.launch);
    this.dialog.id='squishy-pop';this.dialog.setAttribute('aria-label','Squishy Pop');
    this.dialog.innerHTML=`<div class="pop-shell"><header class="pop-title"><div><small>ARIANNA’S LITTLE ARCADE</small><h2>SQUISHY <em>POP</em></h2></div><button class="pop-pause" aria-label="Pause">Ⅱ</button><button class="pop-sound" aria-label="Mute sound">♪</button></header><div class="pop-stats"><div><small>TIME</small><strong data-time>1:00</strong></div><div><small>SCORE</small><strong data-score>0</strong></div><div><small>TICKETS</small><strong data-tickets>✿ 1</strong><progress data-tickets-bar max="500" value="0"></progress></div></div><div class="pop-tray"><canvas aria-label="Drag through three or more adjacent matching squishies"></canvas><div class="pop-feedback" aria-live="polite"></div><div class="pop-cover"></div></div><div class="pop-frenzy"><span>✦ FRENZY</span><progress max="100" value="0"></progress><b>×2</b></div><p class="pop-hint">Drag through matching Squishies!</p><div class="pop-friends"></div><div class="pop-footer">Soft friends. Happy little chains.</div></div>`;
    document.body.append(this.dialog);this.canvas=this.dialog.querySelector('canvas')!;this.ctx=this.canvas.getContext('2d')!;
    const cue=document.createElement('div');cue.className='pop-chain-cue';cue.hidden=true;cue.setAttribute('aria-live','polite');this.q('.pop-tray').append(cue);
    const signal=this.abort.signal;
    this.launch.addEventListener('click',()=>this.open(),{signal});
    this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.togglePause();},{signal});
    this.dialog.querySelector('.pop-pause')!.addEventListener('click',()=>this.togglePause(),{signal});
    this.dialog.querySelector('.pop-sound')!.addEventListener('click',()=>{const muted=this.audio.mute();this.q('.pop-sound').textContent=muted?'♫̸':'♪';this.q('.pop-sound').setAttribute('aria-label',muted?'Unmute sound':'Mute sound');},{signal});
    this.canvas.addEventListener('pointerdown',e=>this.down(e),{signal});
    this.canvas.addEventListener('pointermove',e=>this.move(e),{signal});
    this.canvas.addEventListener('pointerup',e=>this.up(e),{signal});
    for(const name of ['pointercancel','lostpointercapture'])this.canvas.addEventListener(name,()=>this.cancel(),{signal});
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.isOpen&&this.state!=='results'){this.cancel();if(!this.paused)this.togglePause();}},{signal});
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(this.canvas);
  }
  get isOpen(){return this.dialog.open;}
  private q<T extends HTMLElement=HTMLElement>(s:string){return this.dialog.querySelector<T>(s)!;}
  open(){if(this.isOpen)return;void this.audio.unlock();this.audio.pause(false);this.onOpen(true);this.launch.hidden=true;this.dialog.showModal();void this.prepare();}
  private async prepare(){const version=++this.prepareVersion;this.prepared=false;this.q('.pop-cover').hidden=false;this.q('.pop-cover').innerHTML='<h3>Gathering squishy friends…</h3>';try{await this.art.load();if(!this.isOpen||version!==this.prepareVersion)return;this.prepared=true;this.start();this.last=performance.now();this.frame=requestAnimationFrame(this.tick);}catch{if(!this.isOpen||version!==this.prepareVersion)return;this.q('.pop-cover').innerHTML='<h3>Friends need a moment.</h3><button data-retry>Try again</button><button data-back>Back to store</button>';this.q('[data-retry]').onclick=()=>void this.prepare();this.q('[data-back]').onclick=()=>this.close();}}
  private start(){
    this.board=new PopBoard(boardPool(this.collection()),{...this.collection()});this.remaining=POP_RULES.seconds;this.activeTime=0;this.countdown=3.8;this.paused=false;this.saved=false;this.receipt=crypto.randomUUID();this.moves.clear();this.particles.forEach(p=>p.life=0);this.lockedUntil=0;this.feedbackUntil=0;
    this.previousBest=this.record().bestScore;this.ticketTotal=this.record().tickets;this.finaleDone=false;this.lessonDoneAt=0;this.chainCue='';this.q('.pop-hint').textContent='Connect 3 or more matching friends';
    this.state=this.firstPlay()?'intro':'countdown';this.cancel();
    this.lastSecond=60;this.lastCount=4;this.frenzyWas=false;this.gone=[];this.lastResult=undefined;this.frameSamples=[];this.audio.pause(false);this.audio.setMusic(false);
    this.q('.pop-friends').innerHTML=this.board.pool.map(id=>{const d=DUMPLINGS.find(d=>d.id===id)!;const stars=starLevel(this.collection()[id]||0);return `<span title="${d.name}: ${stars?stars+' stars':'starter friend'}"><img src="${this.images.get(id)!.toDataURL()}" alt="${d.name}"><small>${stars?'★'.repeat(stars):'♡'}</small></span>`;}).join('');
    this.showCover();this.resize();if(this.state==='countdown')this.audio.setMusic(true);
    this.q<HTMLProgressElement>('[data-tickets-bar]').max=POP_RULES.pointsPerTicket;
    const ticket=this.art.powers.get('ticket')!;this.q('[data-tickets]').style.backgroundImage=`url(${ticket.toDataURL()})`;
    const frenzyLabel=this.q('.pop-frenzy span');frenzyLabel.textContent='FRENZY';frenzyLabel.style.backgroundImage=`url(${this.art.powers.get('frenzy')!.toDataURL()})`;
  }
  private showCover(){
    this.dialog.classList.toggle('showing-results',this.state==='results');
    const cover=this.q('.pop-cover');cover.hidden=['playing','lesson','finale'].includes(this.state)&&!this.paused;
    if(this.paused){cover.innerHTML='<h3>A little breather ♡</h3><button data-resume>Keep popping</button><button data-quit>Back to store</button>';cover.querySelector('[data-resume]')!.addEventListener('click',()=>this.togglePause());cover.querySelector('[data-quit]')!.addEventListener('click',()=>this.close());}
    else if(this.state==='intro'){cover.innerHTML=`<h3>Little chains.<br>Big squishes!</h3><div class="pop-demo">${Array.from({length:3},()=>`<img src="${this.images.get(this.board.pool[0])!.toDataURL()}" alt="">`).join('')}<b>☝</b></div><p>Let’s try one together. No timer yet!</p><button data-start>Show me how</button><button class="pop-link" data-back>Back to store</button>`;cover.querySelector('[data-start]')!.addEventListener('click',()=>{void this.audio.unlock();this.state='lesson';[12,13,14].forEach(i=>this.board.pieces[i].kind=this.board.pool[0]);this.q('.pop-hint').textContent='Follow the glow: connect these 3 friends';this.showCover();});cover.querySelector('[data-back]')!.addEventListener('click',()=>this.close());}
    else if(this.state==='countdown')cover.innerHTML='<strong class="pop-count">3</strong>';
    else if(this.state==='results')this.results();
  }
  private results(){
    let total=this.ticketTotal,error='';try{if(!this.developerPractice&&!this.saved)total=this.award(this.receipt,this.board.score);this.ticketTotal=total;this.saved=true;}catch(e){error=(e as Error).message;}
    this.resultsAt=this.activeTime;const record=!this.developerPractice&&!error&&this.board.score>this.previousBest;
    const cover=this.q('.pop-cover');cover.hidden=false;cover.innerHTML=`<span class="pop-result-star">${record?'★':'✦'}</span><h3>${record?'A new personal best!':'So squishy!'}</h3><div class="pop-result-numbers"><span>Score<b data-result-score>${this.board.score.toLocaleString()}</b></span><span>Best chain<b>${this.board.bestChain}</b></span></div><small class="pop-previous-best">Previous best ${this.previousBest.toLocaleString()}</small><div class="pop-ticket-flight" aria-hidden="true">${Array.from({length:this.developerPractice||error?0:roundTickets(this.board.score)},(_,i)=>`<img style="--i:${i}" src="${this.art.powers.get('ticket')!.toDataURL()}" alt="">`).join('')}</div><strong class="pop-ticket-prize">${error?'Tickets not saved yet':`+${roundTickets(this.board.score)} Squishy Tickets`}</strong><p>${error||`${total} tickets in your wallet · ${total>=POP_RULES.couponTickets?'$1 box coupon funded · one per day.':`${POP_RULES.couponTickets-total} more for a $1 box coupon.`}`}</p><progress max="${POP_RULES.couponTickets}" value="${Math.min(total,POP_RULES.couponTickets)}"></progress><button data-replay>${error?'Retry saving':'PLAY AGAIN'}</button><button data-back>BACK TO STORE</button>`;
    cover.querySelector('[data-replay]')!.addEventListener('click',()=>{if(this.saved)this.start();else this.results();});cover.querySelector('[data-back]')!.addEventListener('click',()=>{if(this.saved)this.close();else this.results();});
    if(this.developerPractice){cover.querySelector('.pop-ticket-prize')!.textContent='Developer practice · no rewards saved';cover.querySelector('p')!.textContent='Your tickets and best score are unchanged.';cover.querySelector('progress')!.hidden=true;}
  }
  private close(){this.prepareVersion++;this.cancel();this.audio.stop();this.dialog.close();cancelAnimationFrame(this.frame);this.developerPractice=false;this.developerFreeze=false;this.onOpen(false);}
  private togglePause(){if(!this.isOpen||this.state==='results'||this.state==='intro')return;this.cancel();this.paused=!this.paused;this.audio.pause(this.paused);if(!this.paused)void this.audio.unlock();this.showCover();}
  private resize(){const rect=this.canvas.getBoundingClientRect();if(!rect.width)return;this.size=rect.width;const ratio=Math.min(devicePixelRatio,2);this.canvas.width=Math.round(rect.width*ratio);this.canvas.height=this.canvas.width;this.ctx.setTransform(ratio,0,0,ratio,0,0);}
  private point(e:PointerEvent){const r=this.canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*6,y:(e.clientY-r.top)/r.height*6};}
  private hit(p:{x:number;y:number}){if(p.x<0||p.y<0||p.x>=6||p.y>=6)return -1;const x=Math.floor(p.x),y=Math.floor(p.y);return Math.hypot(p.x-x-.5,p.y-y-.5)<=.61?y*6+x:-1;}
  private selectable(index:number){if(index<0)return false;if(this.state==='lesson')return !this.lessonDoneAt&&[12,13,14].includes(index);const move=this.moves.get(this.board.pieces[index].id);return this.activeTime>=this.lockedUntil||!move||move.from===move.to;}
  private down(e:PointerEvent){if(this.pointer!==null||!['playing','lesson'].includes(this.state)||this.paused||this.developerHold||this.remaining<=0||e.button!==0)return;e.preventDefault();const p=this.point(e),index=this.hit(p);if(!this.selectable(index))return;this.pointer=e.pointerId;this.previous=p;this.canvas.setPointerCapture(e.pointerId);this.board.begin(index);this.audio.select(1);}
  private move(e:PointerEvent){if(e.pointerId!==this.pointer||!this.previous)return;e.preventDefault();const next=this.point(e),old=this.previous,steps=Math.max(1,Math.ceil(Math.hypot(next.x-old.x,next.y-old.y)*5));for(let i=1;i<=steps;i++){const index=this.hit({x:old.x+(next.x-old.x)*i/steps,y:old.y+(next.y-old.y)*i/steps});if(this.selectable(index)&&this.board.extend(index))this.audio.select(this.board.chain.length);}this.previous=next;}
  private up(e:PointerEvent){if(e.pointerId!==this.pointer)return;this.move(e);this.pointer=null;this.previous=null;const result=this.board.release(this.activeTime);if(result){this.pop(result);if(this.state==='lesson'){this.lessonDoneAt=this.activeTime+.8;this.feedback='You did it!';this.feedbackUntil=this.lessonDoneAt;}}if(this.remaining<=0)this.finish();}
  private cancel(){this.pointer=null;this.previous=null;this.board.cancel();}
  private pop(result:PopResult){
    this.gone=result.cleared;this.lastResult=result;this.audio.pop(result.chain);for(const power of new Set(result.activated))this.audio.power(power);
    this.burst=this.activeTime;this.lockedUntil=this.activeTime+.35;this.moves=new Map(result.moves.map(m=>[m.piece.id,{from:m.from,to:m.to}]));this.feedback=result.shuffled?'A little shuffle!':`${result.label} +${result.score}`;this.feedbackUntil=this.activeTime+.8;
    this.q('.pop-hint').textContent=result.created==='rainbow'?'Rainbow joins any matching chain!':result.created?'Tap your new '+(result.created==='mega'?'Mega Squish!':'Pop Bomb!'):'Drag through matching Squishies!';
    if(!this.reduced)for(const c of result.cleared){for(let i=0;i<Math.min(5,2+Math.floor(result.chain/5));i++){const p=this.particles.find(p=>p.life<=0);if(!p)break;Object.assign(p,{x:c.index%6+.5,y:Math.floor(c.index/6)+.5,vx:(Math.random()-.5)*3,vy:-1-Math.random()*3,life:.55+Math.random()*.3,color:['#ff86b8','#fff0a5','#fff','#9ee1e7'][i%4],shape:i%3});}}
  }
  private finish(){if(this.state==='finale'||this.state==='results')return;this.state='finale';this.cancel();this.audio.setMusic(false);this.finaleAt=Math.max(this.activeTime+.25,this.burst+.65);this.finaleDone=false;this.q('.pop-hint').textContent='One last little celebration…';this.showCover();}
  private chainFeedback(){
    const cue=this.q('.pop-chain-cue'),chain=this.board.chain;cue.hidden=!chain.length||this.paused;
    if(!chain.length){this.chainCue='';return;}
    const preview=this.board.preview(),power=preview.created,n=chain.length,key=n+':'+power;
    if(key!==this.chainCue){const prior=powerForChain(Number(this.chainCue.split(':')[0]));if(power&&power!==prior)this.audio.power('rainbow');this.chainCue=key;cue.innerHTML=`<b>${n}</b><span>${power?`<img src="${this.art.powers.get(power)!.toDataURL()}" alt="">${power==='mega'?'Mega!':power==='rainbow'?'Rainbow!':'Pop Bomb!'}`:preview.valid?'Release to pop!':`${3-n} more to pop`}</span>`;cue.classList.remove('pulse');void cue.offsetWidth;cue.classList.add('pulse');}
    const last=chain.at(-1)!;cue.style.left=`${Math.max(24,Math.min(76,(last%6+.5)/6*100))}%`;cue.style.top=`${Math.max(0,(Math.floor(last/6)-.55)/6*100)}%`;
  }
  private tick=(now:number)=>{
    const dt=Math.max(0,(now-this.last)/1000);this.last=now;
    if(import.meta.env.DEV)this.q('.pop-footer').textContent=this.developerPractice?`DEV PRACTICE · no rewards saved${this.developerFreeze?' · timer frozen':''}`:'Soft friends. Happy little chains.';
    if(this.developerHold){this.audio.pause(true);if(this.isOpen)this.frame=requestAnimationFrame(this.tick);return;}
    if(this.state==='playing'&&!this.paused){this.frameSamples.push(dt*1000);if(this.frameSamples.length>600)this.frameSamples.shift();}
    if(!this.paused&&!document.hidden){this.activeTime+=dt;if(this.state==='lesson'&&this.lessonDoneAt&&this.activeTime>=this.lessonDoneAt){this.board=new PopBoard(this.board.pool,{...this.collection()});this.moves.clear();this.gone=[];this.lastResult=undefined;this.feedbackUntil=0;this.state='countdown';this.q('.pop-hint').textContent='Connect 3 or more matching friends';this.audio.setMusic(true);this.showCover();}if(this.state==='countdown'){this.countdown-=dt;this.q('.pop-count').textContent=this.countdown> .8?String(Math.ceil(this.countdown-.8)):'POP!';if(this.countdown<=0){this.state='playing';this.showCover();}}else if(this.state==='playing'){if(!this.developerFreeze)this.remaining=Math.max(0,this.remaining-dt);if(!this.remaining&&this.pointer===null)this.finish();}else if(this.state==='finale'&&this.activeTime>=this.finaleAt){if(!this.finaleDone){this.finaleDone=true;const result=this.board.finale(this.activeTime);if(result)this.pop(result);this.finaleAt=this.activeTime+(result?.9:.25);}else{this.state='results';this.audio.celebrate();this.showCover();}}}
    this.q('[data-time]').textContent=`${Math.floor(Math.ceil(this.remaining)/60)}:${String(Math.ceil(this.remaining)%60).padStart(2,'0')}`;this.q('[data-time]').classList.toggle('urgent',this.remaining<=10);
    this.q('[data-score]').textContent=this.board.score.toLocaleString();this.q('[data-tickets]').textContent=String(roundTickets(this.board.score));this.q<HTMLProgressElement>('[data-tickets-bar]').value=roundTickets(this.board.score)===POP_RULES.maximumTickets?POP_RULES.pointsPerTicket:this.board.score%POP_RULES.pointsPerTicket;
    const count=Math.max(0,Math.ceil(this.countdown-.8));if(this.state==='countdown'&&count!==this.lastCount){this.audio.countdown(count);this.lastCount=count;}
    const second=Math.ceil(this.remaining);if(this.state==='playing'&&second<=10&&second>0&&second!==this.lastSecond)this.audio.warning();this.lastSecond=second;
    const frenzy=this.state==='playing'&&this.activeTime<this.board.frenzyUntil;if(frenzy&&!this.frenzyWas){this.audio.power('frenzy');this.feedback='FRENZY! ×2';this.feedbackUntil=this.activeTime+1;}
    this.frenzyWas=frenzy;this.dialog.classList.toggle('is-frenzy',frenzy);this.q<HTMLProgressElement>('.pop-frenzy progress').value=frenzy?(this.board.frenzyUntil-this.activeTime)/POP_RULES.frenzySeconds*100:this.board.frenzyMeter;this.audio.energy(frenzy,second<=10);
    this.q('.pop-frenzy b').textContent=frenzy?`${Math.ceil(this.board.frenzyUntil-this.activeTime)}s · ×2`:'×2';
    this.chainFeedback();
    if(this.state==='results'){const score=this.q('[data-result-score]');if(score)score.textContent=Math.round(this.board.score*(this.reduced?1:Math.min(1,(this.activeTime-this.resultsAt)/.9))).toLocaleString();}
    this.q('.pop-feedback').textContent=this.activeTime<this.feedbackUntil?this.feedback:'';
    this.draw(this.paused?0:Math.min(dt,.05));if(this.isOpen)this.frame=requestAnimationFrame(this.tick);
  };
  private draw(dt:number){
    const c=this.ctx,s=this.size/6;c.clearRect(0,0,this.size,this.size);c.save();c.scale(s,s);
    const age=this.activeTime-this.burst;
    const base=this.board.chain.find(i=>this.board.pieces[i].power!=='rainbow'),matching=base===undefined?null:this.board.pieces[base].kind,preview=this.board.preview();
    if(!this.reduced&&age<.18&&(this.lastResult?.chain??0)>=10)c.translate(Math.sin(age*90)*.025,Math.cos(age*80)*.02);
    for(let i=0;i<36;i++){const piece=this.board.pieces[i],selected=this.board.chain.includes(i);let x=i%6+.5,y=Math.floor(i/6)+.5;const move=this.moves.get(piece.id);if(move&&age<.35&&!this.reduced){const t=Math.max(0,Math.min(1,(age-.07)/.28)),ease=1-Math.pow(1-t,3);y=Math.floor(move.from/6)+.5+(Math.floor(i/6)-Math.floor(move.from/6))*ease;if(this.lastResult?.shuffled)x=move.from%6+.5+(i%6-move.from%6)*ease;}
      c.save();c.translate(x,y);
      if((matching&&piece.kind!==matching&&piece.power!=='rainbow'&&!preview.removed.has(i))||(this.state==='lesson'&&!this.lessonDoneAt&&![12,13,14].includes(i)))c.globalAlpha=.3;
      c.fillStyle='#78569718';c.beginPath();c.ellipse(0,.31,.36,.075,0,0,Math.PI*2);c.fill();
      if(preview.valid&&preview.effects.length&&preview.removed.has(i)){c.fillStyle='#fff2b977';c.strokeStyle='#fffaf0';c.lineWidth=.025;c.beginPath();c.roundRect(-.47,-.47,.94,.94,.18);c.fill();c.stroke();}
      if(this.state==='lesson'&&!this.lessonDoneAt&&[12,13,14].includes(i)){c.strokeStyle='#fff';c.lineWidth=this.reduced?.05:.05+Math.sin(this.activeTime*5)*.018;c.beginPath();c.roundRect(-.47,-.47,.94,.94,.22);c.stroke();}
      if(selected){c.shadowColor='#ff85ca';c.shadowBlur=s*.2;c.fillStyle='#fff9';c.beginPath();c.ellipse(0,0,.49,.44,0,0,Math.PI*2);c.fill();if(!this.reduced)c.rotate(Math.sin(this.activeTime*15+i)*.045);}
      const bounce=this.reduced?1:selected?1.1:move&&move.from!==move.to&&age<.47&&age>.33?1+Math.sin((age-.33)/.14*Math.PI)*.09:this.frenzyWas?1+Math.sin(this.activeTime*7+i)*.018:1;c.scale(bounce,selected?.95:1/bounce);
      const img=piece.power?this.art.powers.get(piece.power):this.images.get(piece.kind);if(img)c.drawImage(img,-.50,-.52,1,1);
      if(piece.power&&piece.power!=='rainbow'){c.shadowBlur=0;const buddy=this.images.get(piece.kind);c.fillStyle='#fff';c.beginPath();c.arc(.3,.29,.17,0,Math.PI*2);c.fill();if(buddy)c.drawImage(buddy,.10,.09,.40,.40);}c.restore();
    }
    if(age<.30&&!this.reduced){this.gone.forEach(({piece,index},n)=>{const image=piece.power?this.art.powers.get(piece.power):this.images.get(piece.kind);if(!image)return;const t=Math.max(0,(age-Math.min(n,9)*.012)/.18);if(t>=1)return;c.save();c.translate(index%6+.5,Math.floor(index/6)+.5);c.globalAlpha=1-t;c.scale(1+t*.35,Math.max(.1,1-t*.9));c.drawImage(image,-.50,-.52,1,1);c.restore();});}
    // Bounded power choreography, using the same target cells as the rules preview.
    if(age<.65&&this.lastResult){for(const effect of this.lastResult.effects){c.save();const x=effect.index%6+.5,y=Math.floor(effect.index/6)+.5,t=Math.min(1,age/.65);c.globalAlpha=(1-t)*.8;
      if(effect.power==='rainbow'){for(const [n,index] of effect.targets.entries()){c.strokeStyle=['#ef85b6','#86ccd9','#b49adc','#f0cb72'][n%4];c.lineWidth=.065;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo((x+index%6+.5)/2,y-.7,index%6+.5,Math.floor(index/6)+.5);c.stroke();}}
      else{const radius=effect.power==='mega'?2.9:1.65;c.strokeStyle=effect.power==='mega'?'#f6ca64':'#cf99ef';c.lineWidth=effect.power==='mega'?.13:.08;c.beginPath();c.arc(x,y,this.reduced?radius:radius*(1-Math.pow(1-t,3)),0,Math.PI*2);c.stroke();if(effect.power==='mega'){c.strokeStyle='#fff';c.lineWidth=.055;c.beginPath();c.arc(x,y,this.reduced?radius*.8:radius*t*.8,0,Math.PI*2);c.stroke();}}
      c.restore();}}
    if(this.state==='lesson'&&!this.lessonDoneAt&&!this.board.chain.length){c.save();c.strokeStyle='#fff9';c.lineWidth=.055;c.setLineDash([.12,.13]);c.beginPath();c.moveTo(.5,2.5);c.lineTo(2.5,2.5);c.stroke();c.setLineDash([]);c.fillStyle='#fff';c.beginPath();c.arc(this.reduced?1.5:.5+(this.activeTime%2),2.5,.10,0,Math.PI*2);c.fill();c.restore();}
    if(this.board.chain.length){const path=this.board.chain;c.save();c.lineCap='round';c.lineJoin='round';c.shadowColor='#ff6fb5';c.shadowBlur=s*.16;c.strokeStyle='#ffb2da';c.lineWidth=.13;c.beginPath();path.forEach((i,n)=>{const x=i%6+.5,y=Math.floor(i/6)+.5;n?c.lineTo(x,y):c.moveTo(x,y);});c.stroke();c.strokeStyle='#fff';c.lineWidth=.065;c.stroke();c.restore();}
    for(const p of this.particles){if(p.life<=0)continue;p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=5*dt;c.globalAlpha=Math.min(1,p.life*3);c.fillStyle=p.color;const heart=this.art.powers.get('heart');if(p.shape===1&&heart)c.drawImage(heart,p.x-.16,p.y-.16,.32,.32);else{c.font='.28px sans-serif';c.fillText(p.shape?'✧':'✦',p.x,p.y);}}c.globalAlpha=1;c.restore();
  }
  snapshot(){const sorted=[...this.frameSamples].sort((a,b)=>a-b);return{open:this.isOpen,state:this.state,remaining:this.remaining,paused:this.paused,practice:this.developerPractice,timerFrozen:this.developerFreeze,chain:[...this.board.chain],pieces:this.board.pieces.map(p=>({...p})),score:this.board.score,bestChain:this.board.bestChain,valid:this.board.findChain(),pool:this.board.pool,particles:this.particles.filter(p=>p.life>0).length,frenzy:this.frenzyWas,frenzyMeter:this.board.frenzyMeter,lastResult:this.lastResult?{chain:this.lastResult.chain,created:this.lastResult.created,activated:this.lastResult.activated,shuffled:this.lastResult.shuffled}:null,audio:this.audio.snapshot(),frameP95:sorted[Math.floor(sorted.length*.95)]??0,artFriends:this.images.size};}
  developerPause(paused:boolean){if(!import.meta.env.DEV)return;this.developerHold=paused;this.cancel();this.last=performance.now();this.audio.pause(paused||this.paused);}
  developerStatus(){return{ready:this.prepared,practice:this.developerPractice,freeze:this.developerFreeze,held:this.developerHold};}
  developerControl(command:string,value?:number){
    if(!import.meta.env.DEV)return;
    if(command==='close'){if(this.isOpen)this.close();return;}
    if(!this.isOpen||!this.prepared)throw Error('Open Squishy Pop first and wait for the art to load.');
    if(command==='normal'){this.developerPractice=false;this.developerFreeze=false;this.start();return;}
    this.developerPractice=true;this.cancel();
    if(command==='restart'||command==='tutorial'){this.start();if(command==='tutorial'){this.state='intro';this.showCover();}return;}
    if(command==='finish'){if(this.state==='results')return;this.remaining=0;if(!this.finaleDone)this.board.finale(this.activeTime);this.finaleDone=true;this.state='results';this.audio.setMusic(false);this.showCover();return;}
    if(this.state==='results')throw Error('Start a new practice round first.');
    this.state='playing';this.paused=false;this.showCover();this.audio.setMusic(true);
    if(command==='freeze'){this.developerFreeze=!this.developerFreeze;return;}
    if(command==='time'){this.remaining=Math.max(1,Math.min(300,value??60));return;}
    if(command==='frenzy'){this.board.frenzyUntil=this.activeTime+7;return;}
    this.moves.clear();this.gone=[];this.lockedUntil=0;
    if(command==='chain'){
      const n=Math.max(3,Math.min(12,value??7)),path=[12,13,14,15,16,17,23,22,21,20,19,18];
      this.board.pieces.forEach((p,i)=>{p.kind=this.board.pool[(i%6+Math.floor(i/6)*2)%this.board.pool.length];delete p.power;});
      path.slice(0,n).forEach(i=>this.board.pieces[i].kind=this.board.pool[0]);
    }else if(['bomb','rainbow','mega'].includes(command)){this.board.pieces[14].power=command as 'bomb'|'rainbow'|'mega';this.board.pieces[13].kind=this.board.pieces[15].kind=this.board.pieces[14].kind;}
    else if(command==='shuffle'){for(let i=35;i>0;i--){const j=Math.floor(Math.random()*(i+1));[this.board.pieces[i],this.board.pieces[j]]=[this.board.pieces[j],this.board.pieces[i]];}this.board.ensurePlayable();}
    else if(command==='deadlock'){this.board.pieces.forEach((p,i)=>{p.kind=this.board.pool[(i%6+Math.floor(i/6)*2)%this.board.pool.length];delete p.power;});this.board.ensurePlayable();}
    else throw Error('Unknown Pop lab control.');
    this.feedback=command==='deadlock'?'Deadlock recovered!':'Ready to test!';this.feedbackUntil=this.activeTime+1;
  }
  destroy(){this.close();this.audio.destroy();this.abort.abort();this.observer.disconnect();this.dialog.remove();this.launch.remove();}
}
