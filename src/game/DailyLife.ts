import { BoundingBox, Entity, Vec3, type Application } from 'playcanvas';
import { DAILY_TASKS, DailyClock, DUST_LOCATIONS } from '../systems/DailyClock';
import type { CleanupItem, CleanupProps, Interaction } from './cleanupProps';
import type { Bedroom } from './bedroom';
import type { CarrySystem } from '../components/CarrySystem';
import { importProp } from './ImportedProp';
import { HouseArt } from './HouseArt';
import { material, primitives, type Triple } from './primitives';
import { LilahMesses } from './LilahMesses';
import type { TaskDefinition } from '../systems/MissionSystem';

const SAVE_KEY='arianna.daily.v1';
export class DailyLife {
  readonly clock: DailyClock;
  active=false;
  readonly root: Entity;
  readonly outfit: CleanupItem;
  readonly towel: CleanupItem;
  readonly egg: CleanupItem;
  readonly dust: Entity[]=[];
  readonly spill: Entity;
  readonly eggSpill: Entity;
  readonly lilahMesses: LilahMesses;
  readonly lilahTarget: Interaction;
  lilahAvailable=false;
  onPlayLilah:()=>void=()=>{};
  private taskCache:TaskDefinition[]=[];
  private taskKey='';
  private readonly cooked: Entity;
  private readonly bubbles: Entity;
  private readonly wipingPaper: Entity;
  private eggFall=0;
  private held: string | null = null;
  private last=0;
  private lastSave=0;
  private phase='';
  onPhaseChange:()=>void=()=>{};
  onReward:(id:string)=>void=()=>{};
  onStore:()=>void=()=>{};
  constructor(app:Application,private readonly props:CleanupProps,house:Bedroom){
    let saved:unknown;try{saved=JSON.parse(localStorage.getItem(SAVE_KEY)||'null')}catch{}
    this.clock=new DailyClock(Math.random,saved);
    this.root=new Entity('Daily routines',app);props.root.addChild(this.root);
    this.lilahMesses=new LilahMesses(app,this.root,props,()=>this.active&&this.clock.state.phase!=='school');
    this.lilahMesses.syncDay(this.clock.state.day);
    this.lilahTarget={id:'play-lilah',name:'Play with Lilah',actionLabel:'Play with Lilah',icon:'💕',kind:'daily',anchor:new Vec3(),marker:new Vec3(),range:1.1,duration:650,available:h=>this.active&&this.lilahAvailable&&!h};
    props.interactions.push(this.lilahTarget);
    const shape=primitives(app,this.root),m=house.materials!;
    const item=(id:string,name:string,icon:string,home:Triple)=>{const entity=new Entity(name,app);this.root.addChild(entity);entity.setLocalPosition(...home);const it={id,name,icon,home,entity};props.items.push(it);return it;};
    this.outfit=item('daily-outfit','Clothes','👕',[-.7,.7,3.05]);
    const clothes=primitives(app,this.outfit.entity);clothes('Shirt','box',[0,.03,0],[.38,.06,.32],m.pink);for(const x of [-.23,.23])clothes('Sleeve','box',[x,.03,-.1],[.18,.06,.15],m.pink);
    const art=new HouseArt(app,this.root);art.add('furniture','sideTableDrawers',[-.7,.025,3.05],.85,180);void art.finish();
    house.obstacles.push(new BoundingBox(new Vec3(-.7,.5,3.05),new Vec3(.35,1,.35)));
    this.towel=item('paper-towel','Paper towel','🧻',[-2.65,1.02,10.5]);void importProp(app,this.towel.entity,'paper',.23);
    this.egg=item('breakfast-egg','Egg','🥚',[-2.68,1.15,14.55]);
    const eggShape=primitives(app,this.egg.entity);eggShape('Egg placeholder','sphere',[0,.1,0],[.14,.2,.14],m.trim);
    // Replaced by cooking assets once the pending download is approved.
    const pan=shape('Breakfast pan','cylinder',[-2.63,1.08,12.65],[.55,.06,.55],m.dark);shape('Pan handle','box',[-2.2,1.09,12.65],[.5,.04,.08],m.dark);
    this.cooked=new Entity('Cooked breakfast',app);this.root.addChild(this.cooked);this.cooked.setLocalPosition(-2.63,1.12,12.65);
    const food=primitives(app,this.cooked);food('Egg white','sphere',[0,0,0],[.37,.025,.3],m.trim);food('Egg yolk','sphere',[0,.025,0],[.15,.05,.15],m.yellow);
    // Mess geometry is separate from the cleaning controller so artists can substitute it.
    const makeSpill=(name:string,position:Triple)=>{
      const root=new Entity(name,app);this.root.addChild(root);root.setLocalPosition(...position);const s=primitives(app,root);
      for(let i=0;i<7;i++)s('Puddle','sphere',[Math.sin(i*2)*.22,.01,Math.cos(i*2)*.16],[.35,.022,.3],i===0?m.yellow:m.trim,false);
      return root;
    };
    this.spill=makeSpill('Kitchen spill',[.1,.04,11.1]);this.eggSpill=makeSpill('Dropped egg',[-1.5,.04,12.55]);
    const dustMaterial=material('House dust','#a69182');
    for(let k=0;k<3;k++){const root=new Entity('Random dirt '+k,app);this.root.addChild(root);const s=primitives(app,root);for(let i=0;i<10;i++)s('Dust fleck','sphere',[Math.sin(i*2)*.26,.016,Math.cos(i*2)*.24],[.18,.045,.15],dustMaterial,false);this.dust.push(root);}
    this.bubbles=new Entity('Routine feedback',app);this.root.addChild(this.bubbles);const b=primitives(app,this.bubbles);for(let i=0;i<6;i++)b('Foam','sphere',[Math.sin(i)*.12,i*.025,Math.cos(i)*.1],[.065,.065,.065],m.sky,false);
    this.wipingPaper=shape('Paper wiping the floor','box',[0,.09,0],[.28,.012,.23],m.trim,false);this.wipingPaper.enabled=false;
    // A compact toothbrush and cup stay on the sink until a suitable imported model is available.
    shape('Toothbrush cup','cylinder',[4.4,.99,-3.04],[.13,.17,.13],m.blue);shape('Toothbrush','box',[4.4,1.15,-3.04],[.025,.24,.025],m.pink);shape('Toothbrush bristles','box',[4.4,1.28,-3.02],[.035,.065,.04],m.trim);
    const target=(id:string,name:string,icon:string,anchor:Triple,marker:Triple,available:(held:string|null)=>boolean,duration=650,task?:string,hold=false,mess?:Entity)=>{
      props.interactions.push({id,name,icon,kind:'daily',actionLabel:name,anchor:new Vec3(...anchor),marker:new Vec3(...marker),range:1,task,duration,hold,mess,available:carried=>this.active&&available(carried)});
    };
    const phase=()=>this.clock.state.phase,notDone=(id:string)=>!this.clock.state.done.includes(id);
    target('daily-teeth','Brush teeth','🪥',[4.12,0,-2.35],[4.12,1.15,-3.03],h=>!h&&(phase()==='morning'||phase()==='night')&&notDone('teeth'),1800,'teeth');
    target('choose-clothes','Choose clothes','👕',[-.7,0,2.4],[-.7,.8,3.05],h=>!h&&phase()==='morning'&&notDone('outfit'),0);
    target('get-dressed','Get dressed','👕',[-.85,0,-.65],[-1.35,.9,-.65],h=>h==='daily-outfit'&&phase()==='morning',850,'outfit');
    target('night-clothes','Pick up clothes','👕',[-.85,0,-.65],[-1.35,.9,-.65],h=>!h&&phase()==='night'&&notDone('outfit'),0);
    target('clothes-drawer','Put clothes inside','👕',[-.7,0,2.4],[-.7,.8,3.05],h=>h==='daily-outfit'&&phase()==='night',0,'outfit');
    target('take-egg','Take an egg','🥚',[-1.8,0,14.55],[-2.6,1.1,14.55],h=>!h&&phase()==='morning'&&this.clock.state.breakfast==='eggs',0);
    target('crack-egg','Crack egg','🥚',[-1.8,0,12.65],[-2.63,1.15,12.65],h=>h==='breakfast-egg',0);
    target('cook-egg','Cook breakfast','🍳',[-1.8,0,12.65],[-2.63,1.15,12.65],h=>!h&&phase()==='morning'&&this.clock.state.breakfast==='cook',2200);
    target('eat-breakfast','Eat breakfast','🍽',[.4,0,12.5],[.55,1,13.85],h=>!h&&phase()==='morning'&&this.clock.state.breakfast==='serve',1500,'breakfast');
    target('take-towel','Take paper towel','🧻',[-1.8,0,10.5],[-2.65,1.15,10.5],h=>!h&&(this.clock.state.breakfast==='spill'||phase()==='afternoon'&&notDone('spill')||this.lilahMesses.needs('spill')),0);
    target('wipe-egg','Wipe dropped egg','🧻',[-1.5,0,12.55],[-1.5,.12,12.55],h=>h==='paper-towel'&&this.clock.state.breakfast==='spill',1200,undefined,true,this.eggSpill);
    target('wipe-spill','Wipe spill','🧻',[.1,0,11.1],[.1,.12,11.1],h=>h==='paper-towel'&&phase()==='afternoon'&&notDone('spill'),1200,'spill',true,this.spill);
    const vacuum=props.items.find(i=>i.id==='vacuum')!;
    target('daily-vacuum','Pick up vacuum','✦',vacuum.home,[vacuum.home[0],1,vacuum.home[2]],h=>!h&&(phase()==='afternoon'&&this.dust.some((_,i)=>notDone('dust-'+i))||this.lilahMesses.needs('crumbs')),0);
    for(let i=0;i<3;i++)target('vacuum-'+i,'Hold to vacuum','✦',[0,0,0],[0,.3,0],h=>h==='vacuum'&&phase()==='afternoon'&&notDone('dust-'+i),1150,'dust-'+i,true,this.dust[i]);
    target('put-tool-away','Put tool away','↩',[0,0,0],[0,.8,0],h=>h==='vacuum'||h==='paper-towel',0);
    target('bedtime-book','Read a bedtime book','📘',[-.85,0,-.8],[-1.4,.9,-.8],h=>!h&&phase()==='night'&&notDone('read'),1600,'read');
    target('school-door','Go to school','🎒',[-2.35,0,8.2],[-3.1,1.1,8.2],h=>!h&&this.clock.schoolDue,0);
    target('shop-door','Choose a store','🛍',[-2.35,0,8.2],[-3.1,1.1,8.2],h=>!h&&this.clock.canShop&&this.clock.ready,0);
    target('sleep','Go to bed','🌙',[-.85,0,-1.6],[-1.4,.8,-1.6],h=>!h&&this.clock.canSleep,0);
    this.refresh();void pan;
  }
  get tasks(){const key=this.clock.state.phase+'-'+this.clock.state.day+'-'+this.lilahMesses.count;if(key!==this.taskKey){this.taskKey=key;this.taskCache=[...this.clock.tasks,...this.lilahMesses.tasks];}return this.taskCache;}
  get completed(){return [...this.clock.state.done,...this.lilahMesses.completed];}
  save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(this.clock.state));}catch{document.querySelector('#save-message')!.textContent='Daily progress could not be saved.';}}
  setActive(active:boolean){this.active=active;this.root.enabled=active;this.last=0;this.refresh();}
  refresh(){
    const s=this.clock.state;
    this.lilahMesses.syncDay(s.day);this.lilahMesses.refresh();
    for(const mess of [...this.dust,this.spill,this.eggSpill])mess.setLocalScale(1,1,1);
    for(let i=0;i<3;i++){const p=DUST_LOCATIONS[s.dust[i]],t=this.props.interactions.find(t=>t.id==='vacuum-'+i)!;this.dust[i].setLocalPosition(p[0],.04,p[1]);t.anchor.set(p[0],0,p[1]);t.marker.set(p[0],.35,p[1]);this.dust[i].enabled=s.phase==='afternoon'&&!s.done.includes('dust-'+i);}
    this.spill.enabled=s.phase==='afternoon'&&!s.done.includes('spill');this.eggSpill.enabled=s.breakfast==='spill'&&s.phase==='morning';
    this.cooked.enabled=s.phase==='morning'&&(s.breakfast==='cook'||s.breakfast==='serve');
    this.cooked.setLocalPosition(...(s.breakfast==='serve'?[.55,.98,13.85] as Triple:[-2.63,1.12,12.65] as Triple));
    this.props.items.find(i=>i.id==='vacuum')!.entity.enabled=s.phase==='afternoon'||this.lilahMesses.needs('crumbs');
    for(const item of [this.outfit,this.towel,this.egg])if(item.entity.parent!==this.root){item.entity.reparent(this.root);item.entity.setLocalPosition(...item.home);}
    this.outfit.entity.enabled=(s.phase==='morning'||s.phase==='night')&&!s.done.includes('outfit');
    this.outfit.entity.setLocalPosition(...(s.phase==='night'?[-1.4,.91,-.65] as Triple:this.outfit.home));
    this.egg.entity.enabled=s.phase==='morning'&&s.breakfast==='eggs';this.egg.entity.setLocalEulerAngles(0,0,0);this.towel.entity.enabled=true;
    this.bubbles.enabled=false;
    this.wipingPaper.enabled=false;this.eggFall=0;
  }
  pause(now:number){this.last=now;}
  developerPhase(phase:'morning'|'afternoon'|'night',nextDay=false){
    if(!import.meta.env.DEV)return;
    const s=this.clock.state;if(nextDay)s.day++;
    if(s.phase!==phase||nextDay)s.done=[];
    s.phase=phase;s.minutes=phase==='morning'?420:phase==='afternoon'?900:1140;s.schoolSeconds=0;
    if(phase==='morning'){s.breakfast=s.done.includes('breakfast')?'done':'eggs';s.eggDrop=null;}
    this.phase=phase;this.pause(performance.now());this.refresh();this.save();
  }
  developerComplete(){
    if(!import.meta.env.DEV)return;
    this.clock.state.done=this.clock.tasks.map(t=>t.id);
    if(this.clock.state.phase==='morning')this.clock.state.breakfast='done';
    for(const task of this.lilahMesses.tasks)this.lilahMesses.complete(task.id);
    this.refresh();this.save();
  }
  update(now:number,held:string|null,busy:boolean){
    if(!this.active){this.last=now;return;}this.held=held;
    this.lilahMesses.syncDay(this.clock.state.day);
    if(this.lilahMesses.needs('crumbs'))this.props.items.find(i=>i.id==='vacuum')!.entity.enabled=true;
    if(this.eggFall){
      const t=Math.min(1,(now-this.eggFall)/420);
      this.egg.entity.setLocalPosition(-2.63+1.13*t,1.12*(1-t*t),12.65-.1*t);
      this.egg.entity.setLocalEulerAngles(0,0,t*140);
      if(t===1){this.eggFall=0;this.egg.entity.enabled=false;this.eggSpill.enabled=true;}
    }
    if(this.last&&!document.hidden)this.clock.advance(Math.min(2,(now-this.last)/1000));this.last=now;
    if(this.phase!==this.clock.state.phase&&!busy){this.phase=this.clock.state.phase;this.onPhaseChange();}
    if(now-this.lastSave>1000){this.lastSave=now;this.save();}
    const tool=this.props.interactions.find(t=>t.id==='put-tool-away')!;
    const pos=held==='vacuum'?this.props.items.find(i=>i.id==='vacuum')!.home:this.towel.home;
    tool.anchor.set(...pos);tool.marker.set(pos[0],pos[1]+.8,pos[2]);
  }
  complete(id:string){if(id.startsWith('lilah-mess-')){if(!this.lilahMesses.complete(id))return false;this.onReward(`day-${this.clock.state.day}-${id}`);return true;}if(this.clock.complete(id)){this.onReward(`day-${this.clock.state.day}-${this.clock.state.phase}-${id}`);this.save();return true;}return false;}
  perform(target:Interaction,carry:CarrySystem){
    const take=(item:CleanupItem)=>{item.entity.enabled=true;carry.pickUp(item);};
    const release=()=>{const item=carry.item;if(item){carry.release(this.root,item.home);item.entity.enabled=false;}};
    if(target.id.startsWith('lilah-mess-')){
      if(this.complete(target.id)&&target.hold&&carry.item?.id==='paper-towel')release();
      this.save();return;
    }
    switch(target.id){
      case 'play-lilah':this.onPlayLilah();break;
      case 'choose-clothes':case 'night-clothes':take(this.outfit);break;
      case 'take-egg':take(this.egg);break;
      case 'take-towel':take(this.towel);break;
      case 'daily-vacuum':take(this.props.items.find(i=>i.id==='vacuum')!);break;
      case 'put-tool-away':{const item=carry.item;if(item){carry.release(this.props.root,item.home);item.entity.enabled=true;}break;}
      case 'crack-egg':release();this.clock.crackEgg();this.eggSpill.enabled=false;this.cooked.enabled=this.clock.state.breakfast==='cook';if(!this.cooked.enabled){this.egg.entity.enabled=true;this.eggFall=performance.now();}break;
      case 'wipe-egg':this.eggSpill.enabled=false;release();this.clock.state.breakfast='cook';this.cooked.enabled=true;break;
      case 'wipe-spill':this.spill.enabled=false;release();break;
      case 'cook-egg':this.clock.state.breakfast='serve';this.cooked.setLocalPosition(.55,.98,13.85);break;
      case 'eat-breakfast':this.cooked.enabled=false;this.clock.state.breakfast='done';break;
      case 'get-dressed':case 'clothes-drawer':release();break;
      case 'school-door':this.clock.goSchool();break;
      case 'shop-door':this.onStore();break;
      case 'sleep':this.clock.sleep();break;
    }
    if(target.task)this.complete(target.task);
    if(target.mess)target.mess.enabled=false;
    this.save();
  }
  effect(target:Interaction|null,progress:number,hands:Vec3){
    this.bubbles.enabled=!!target&&target.id==='daily-teeth'&&progress>0;
    if(this.bubbles.enabled){this.bubbles.setPosition(hands);this.bubbles.translate(0,.24,0);}
    if(target?.mess){const scale=1-progress*.95;target.mess.setLocalScale(scale,scale,scale);}
    this.wipingPaper.enabled=!!target&&(target.id.startsWith('wipe-')||target.id==='lilah-mess-1')&&progress>0;
    if(this.wipingPaper.enabled&&target){this.wipingPaper.setPosition(hands.x,Math.max(.08,hands.y-.035),hands.z);this.wipingPaper.setLocalEulerAngles(0,0,0);}
  }
  get hint(){const s=this.clock.state;if(s.phase==='school')return 'At school · See you after class!';if(this.clock.schoolDue)return '🎒 Time for school. Walk to the front door in the living room.';if(s.phase==='morning'&&s.breakfast==='spill')return 'Oops! Get a paper towel and hold Action over the dropped egg.';if(s.phase==='afternoon')return 'After school · Chores earn allowance. The store closes at 7 PM.';if(this.clock.canSleep)return '🌙 Ready for bed. Walk to the bed to start a fresh day.';return s.phase==='morning'?'A fresh morning · Brush, choose clothes, and make breakfast.':'Wind down · Brush teeth, put clothes away, and read.';}
  snapshot(){return {...this.clock.state,clock:this.clock.label,canShop:this.clock.canShop,held:this.held,dirt:this.dust.map(e=>({visible:e.enabled,position:e.getPosition().toArray(),scale:e.getLocalScale().toArray()})),eggSpill:this.eggSpill.enabled,lilah:this.lilahMesses.snapshot()};}
}
