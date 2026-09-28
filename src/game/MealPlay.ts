import {Entity,Vec3,type Application} from 'playcanvas';
import {propPoint,propYaw} from '../editor/PropSpace';
import type {createCharacter} from '../components/CharacterVisual';
import type {PlayerController} from '../components/PlayerController';
import {HousePath} from '../components/HousePath';
import type {Bedroom} from './bedroom';
import type {DailyLife} from './DailyLife';
import type {CleanupGame} from './CleanupGame';
import type {HomePlay} from './HomePlay';
import type {FamilyDinner} from './FamilyDinner';
import type {Plate} from '../systems/HomePlayStore';
import type {Point} from '../data/homePlay';
import type {CleanupItem} from './cleanupProps';
import {MealArt,mealGrip} from './MealArt';
import {primitives} from './primitives';
type Context='dinner'|'lunch';
type Seat={id:string;context:Context;approach:Vec3;sit:Vec3;plate:Vec3;yaw:number};
/** Same plate identity moves from serving to hand to table, and survives every transition. */
export class MealPlay{
 readonly root:Entity;private art:MealArt;private dinner?:FamilyDinner;
 private plates=new Map<Context,CleanupItem>();private signatures=new Map<Context,string>();private platter:Entity;private platterSignature='';
 private seat:Seat|null=null;private entry:Vec3|null=null;private seatTime=0;private standing=false;private actionItem:Entity|null=null;private mode='';
 private selectedMain:'pizza'|'sandwich'='pizza';private selectedFruit:'apple'|'orange'='apple';private mealCue:Entity;private menu:Entity;private serveTime=0;private serveStart=1.1;private actionSource='';
 private school:Bedroom;private lastGreeting=0;private day=0;
 private boosters=new Map<string,Entity>();
 constructor(private app:Application,private home:HomePlay,private character:ReturnType<typeof createCharacter>,private controller:PlayerController,private cleanup:CleanupGame,private daily:DailyLife,school:Bedroom,private house:Bedroom,private say:(s:string)=>void){
  this.school=school;this.root=new Entity('Optional meals',app);app.root.addChild(this.root);this.art=new MealArt(app,home.art);
  this.platter=new Entity('Dinner portions',app);this.root.addChild(this.platter);
  for(const context of ['dinner','lunch'] as const){const e=new Entity(context==='dinner'?'Arianna’s dinner plate':'Arianna’s lunch tray',app);this.root.addChild(e);this.plates.set(context,{id:'home-'+(context==='dinner'?'dinner-plate':'lunch-tray'),name:e.name,icon:'🍽',entity:e,home:[0,1,0],carryGrip:[0,.08,0],carryPace:'walk'});}
  const s=primitives(app,this.root);this.mealCue=s('Vacant seat cue','cylinder',[0,0,0],[.38,.008,.38],home.art.mat('#e5d2a1'),false);
  this.menu=new Entity('Lunch counter choices',app);this.root.addChild(this.menu);this.menu.setPosition(4.6,1.34,-20.8);
  for(const [i,food] of ['pizza','sandwich'].entries()){const option=new Entity(food,app);this.menu.addChild(option);option.setLocalPosition((i-.5)*.52,0,0);this.art.plate(option,false);void this.art.food(option,food);}
  for(const [i,color]of ['#c98276','#dfaf67'].entries())primitives(app,this.menu)(i?'Orange option':'Apple option','sphere',[.75+i*.20,.065,0],[.12,.12,.12],home.art.mat(color));
  const rack=new Entity('Tray return rack',app);this.root.addChild(rack);rack.setPosition(9.5,.05,-20.3);const r=primitives(app,rack);r('Rack back','box',[0,.65,0],[.6,1.3,.06],home.art.mat('#a8bfc2'));for(const y of [.15,.55,.95])r('Tray shelf','box',[0,y,.20],[.6,.05,.4],home.art.mat('#d3d0bd'));
  for(const seat of this.seats()){const pad=s('Child seat cushion','box',[seat.sit.x,seat.plate.y-.39,seat.sit.z],[.36,.18,.32],home.art.mat('#c8b5d7'));pad.setEulerAngles(0,seat.yaw,0);this.boosters.set(seat.id,pad);}
 }
 bindDinner(dinner:FamilyDinner){this.dinner=dinner;dinner.portionManaged=true;this.platter.reparent(dinner.tray);this.platter.setLocalPosition(0,.025,0);}
 get locked(){return !!this.seat;}
 private seats():Seat[]{return[
  {id:'home-north',context:'dinner',approach:propPoint('dining',new Vec3(.55,.09,11.9)),sit:propPoint('dining',new Vec3(.55,.09,12.49)),plate:propPoint('dining',new Vec3(.55,.99,13.28)),yaw:propYaw('dining',0)},
  // The front stools of the two real north cafeteria tables; friends occupy the back stools.
  {id:'lunch-left',context:'lunch',approach:new Vec3(1.6,.09,-15.65),sit:new Vec3(1.6,.09,-16.36),plate:new Vec3(1.6,.96,-17.0),yaw:180},
  {id:'lunch-right',context:'lunch',approach:new Vec3(7.15,.09,-15.65),sit:new Vec3(7.15,.09,-16.36),plate:new Vec3(7.15,.96,-17.0),yaw:180},
 ];}
 private context():Context{return this.mode==='recess'?'lunch':'dinner';}
 private plate(context=this.context()){return this.home.store.plate(context);}
 private commit(change:()=>void){try{change();this.sync();}catch(e){this.say('Your meal could not be saved. Please try again.');console.error('Meal save',e);}}
 private sync(){
  for(const [context,item]of this.plates){const p=this.plate(context);item.entity.enabled=!!p&&(p.owner==='held'||(context==='dinner'?['cleanup','outdoors'].includes(this.mode):this.mode==='recess'));
   if(!p)continue;const signature=JSON.stringify([p.id,p.bites,p.drink,p.fruitBites]);
   if(this.signatures.get(context)!==signature){for(const c of [...item.entity.children])c.destroy();this.art.plate(item.entity,context==='lunch');const food=new Entity('Edible serving',this.app);item.entity.addChild(food);food.setLocalPosition(context==='lunch'?-.09:0,.028,0);void this.art.food(food,p.food,p.bites,Number(p.id.split('-').at(-1))||0);
    const cup=this.home.art.make('cup','#bad4dc');cup.name='Drinking cup';item.entity.addChild(cup);cup.setLocalScale(.65,.65,.65);cup.setLocalPosition(.15,.025,-.14);
    if(context==='lunch'&&p.fruitBites<2){const fruit=primitives(this.app,item.entity)('Fruit','sphere',[.15,.07,.08],[.12*(1-p.fruitBites*.35),.11,.12],this.home.art.mat(p.fruit==='apple'?'#c98276':'#dfaf67'));fruit.name='Edible fruit';}
    this.signatures.set(context,signature);
   }
   if(this.actionItem&&context===this.context()){const source=item.entity.findByName(this.actionSource);if(source)source.enabled=false;}
   if(p.owner==='held'){if(!this.cleanup.carry.item){this.cleanup.carry.pickUp(item);this.character.animator.setCarrying(true);}}
   else {if(item.entity.parent!==this.root)item.entity.reparent(this.root);item.entity.setPosition(...p.position);item.entity.setEulerAngles(0,0,0);}
  }
  const state=this.home.store.data.dinner,signature=JSON.stringify([this.daily.clock.state.day,state.served,state.portions]);
  if(signature!==this.platterSignature){this.platterSignature=signature;for(const c of [...this.platter.children])c.destroy();
   if(state.served){const food=(['pizza','taco','turkey'] as const)[(this.daily.clock.state.day-1)%3];if(food==='pizza')void this.art.pizzaPlatter(this.platter,state.portions);else for(let i=0;i<state.portions.length;i++)if(state.portions[i]){const part=new Entity('Remaining portion '+i,this.app);this.platter.addChild(part);part.setLocalPosition(Math.sin(i*Math.PI/4)*.19,0,Math.cos(i*Math.PI/4)*.19);part.setLocalEulerAngles(0,i*45,0);void this.art.food(part,food,0,i,.17);}}}
 }
 private transfer(owner:string,point:Vec3){const context=this.context();this.commit(()=>{this.home.store.transact(s=>{const p=context==='dinner'?s.dinner.plate:s.lunch;if(p){p.owner=owner;p.position=point.toArray() as Point;}});if(this.cleanup.carry.item===this.plates.get(context))this.cleanup.carry.release(this.root,point.toArray() as Point);this.character.animator.setCarrying(!!this.cleanup.carry.item);});}
 private take(){if(this.cleanup.carry.item)return;this.transfer('held',this.character.player.getPosition());}
 private sit(seat:Seat){
  if(this.seat||this.character.animator.busy)return;const p=this.character.player.getPosition(),planner=new HousePath(seat.context==='dinner'?this.house:this.school,.24);
  if(!planner.free(seat.approach.x,seat.approach.z)||!planner.line(p,seat.approach)){this.say('Come around to the open side of this chair.');return;}
  // Reserving synchronously prevents double taps from starting two entries.
  this.seat=seat;this.entry=seat.approach.clone();this.seatTime=0;this.standing=false;this.controller.reset();this.character.player.setPosition(seat.approach);this.character.visual.setLocalEulerAngles(0,seat.yaw,0);this.character.animator.setCarrying(false);this.character.animator.setIdleClip('MealIdle');this.character.animator.playAction('MealSit',.65);if(this.character.grounding)this.character.grounding.surfaceHeight=.07;
  if(this.plate()?.owner==='held')this.transfer(seat.id,seat.plate);
  if(seat.context==='lunch')this.app.fire('home-play:lunch-arrive',seat.id==='lunch-left'?'series':'cute');
  if(performance.now()-this.lastGreeting>15000){this.say(seat.context==='lunch'?'There’s room beside us!':'A little time together at the table.');this.lastGreeting=performance.now();}
 }
 private stand(){if(!this.seat)return;this.cancelBite();this.standing=true;this.seatTime=0;this.character.animator.setIdleClip('Idle');this.character.animator.playAction('MealStand',.65);}
 private finishSeat(){if(this.entry)this.character.player.setPosition(this.entry);this.seat=null;this.entry=null;this.standing=false;this.character.animator.setIdleClip('Idle');if(this.character.grounding)this.character.grounding.surfaceHeight=null;this.character.animator.setCarrying(!!this.cleanup.carry.item);}
 cancelBite(){this.character.animator.cancelAction();if(this.actionItem){this.actionItem.destroy();this.actionItem=null;}this.signatures.clear();this.sync();}
 private bite(drink=false,fruit=false){const context=this.context(),p=this.plate(context);if(!this.seat||!p||this.character.animator.busy||p.owner!==this.seat.id)return;
  const identity=p.id,expected=p[fruit?'fruitBites':'bites'];if(!drink&&expected>=(fruit?2:3))return;
  const prop=new Entity(drink?'Cup at mouth':'Food at mouth',this.app);this.cleanup.carry.socket.addChild(prop);mealGrip(prop,drink,fruit);this.actionItem=prop;
  if(drink){prop.addChild(this.home.art.make('cup','#bad4dc'));}else if(fruit)primitives(this.app,prop)('Fruit bite','sphere',[0,0,0],[.10,.10,.10],this.home.art.mat(p.fruit==='apple'?'#c98276':'#dfaf67'));else void this.art.food(prop,p.food,p.bites,Number(p.id.split('-').at(-1))||0,.18);
  this.actionSource=drink?'Drinking cup':fruit?'Edible fruit':'Edible serving';const original=this.plates.get(context)!.entity.findByName(this.actionSource);if(original)original.enabled=false;
  this.character.animator.playAction(drink?'MealDrink':'MealBite',1.35,()=>this.commit(()=>{
   if(this.plate(context)?.id!==identity||!this.seat)return;
   if(drink)this.home.store.transact(s=>{const plate=context==='dinner'?s.dinner.plate:s.lunch;if(plate)plate.drink=Math.min(3,plate.drink+1);});else this.home.store.bite(context,identity,expected,fruit);
  }));
 }
 suspend(){this.serveTime=0;if(this.seat){this.cancelBite();this.finishSeat();}this.home.extraCommands=[];this.home.extraFocus=null;}
 update(dt:number,mode:string,available:boolean){
  if(mode!==this.mode){this.suspend();this.mode=mode;this.sync();}
  this.home.extraCommands=[];this.home.extraFocus=null;
  const day=this.daily.clock.state,breakfastActive=day.phase==='morning'&&day.breakfast!=='done';
  if(this.day!==day.day){this.suspend();this.day=day.day;}
  if(day.dinnerServed&&!this.home.store.data.dinner.served)this.commit(()=>{this.home.store.transact(s=>{s.dinner.served=true;});});
  const p=this.character.player.getPosition(),context=this.context(),plate=this.plate(),item=this.plates.get(context)!;
  this.menu.enabled=mode==='recess';this.root.findByName('Tray return rack')!.enabled=mode==='recess';this.mealCue.enabled=false;
  for(const seat of this.seats())this.boosters.get(seat.id)!.enabled=seat.context==='lunch'?mode==='recess':mode==='cleanup'&&!breakfastActive;
  if(this.serveTime>0){this.serveTime-=dt;
   if(this.serveTime<=0&&this.plate('lunch')?.owner==='counter'&&this.mode==='recess'&&p.distance(new Vec3(4.6,.09,-20.15))<1.5&&!this.cleanup.carry.item)this.character.animator.playAction('PickUp',.8,()=>{if(this.mode==='recess'&&this.plate('lunch')?.owner==='counter')this.take();});
  }
  if(this.seat){this.seatTime+=dt;const t=Math.min(1,this.seatTime/.65),from=this.standing?this.seat.sit:this.seat.approach,to=this.standing?this.seat.approach:this.seat.sit;this.character.player.setPosition(new Vec3().lerp(from,to,t));if(this.character.grounding)this.character.grounding.surfaceHeight=.07+.18*(this.standing?1-t:t);if(this.standing&&t>=1)this.finishSeat();}
  if(this.actionItem&&!this.character.animator.busy){this.actionItem.destroy();this.actionItem=null;this.signatures.clear();this.sync();}
  if(!available||!['cleanup','outdoors','recess'].includes(mode)||this.cleanup.mode!=='day'||context==='dinner'&&breakfastActive)return;
  const add=(title:string,run:()=>void)=>this.home.extraCommands.push({title,run});let detail='';
  if(this.seat){detail='At the table';if(plate?.owner===this.seat.id){if(plate.bites<3)add('Eat',()=>this.bite());if(context==='lunch'&&plate.fruitBites<2)add('Eat fruit',()=>this.bite(false,true));add('Drink',()=>this.bite(true));}add('Stand up',()=>this.stand());if(this.character.animator.busy)add('Stop bite',()=>this.cancelBite());}
  else if(context==='dinner'&&day.dinnerServed&&Math.hypot(p.x-propPoint('dining',new Vec3(.55,0,11.9)).x,p.z-propPoint('dining',new Vec3(.55,0,11.9)).z)<1.0&&!plate&&!this.cleanup.carry.item){detail='Dad’s dinner';if(this.home.store.data.dinner.portions.some(Boolean))add('Take a portion',()=>this.character.animator.playAction('PickUp',.8,()=>this.commit(()=>{if(this.mode==='cleanup')this.home.store.claimDinner();})));}
  if(!this.seat&&context==='lunch'&&Math.hypot(p.x-4.6,p.z+20.15)<1.45&&!plate&&!this.cleanup.carry.item){detail=`${this.selectedMain==='pizza'?'Pizza':'Sandwich'} · ${this.selectedFruit}`;
   add('Take lunch',()=>{this.commit(()=>{if(this.home.store.lunch(this.selectedMain,this.selectedFruit,true)){this.serveTime=this.serveStart;this.app.fire('home-play:serve');}});});add(this.selectedMain==='pizza'?'Choose sandwich':'Choose pizza',()=>{this.selectedMain=this.selectedMain==='pizza'?'sandwich':'pizza';});add(this.selectedFruit==='apple'?'Choose orange':'Choose apple',()=>{this.selectedFruit=this.selectedFruit==='apple'?'orange':'apple';});
  }
  if(!this.seat){const nearest=this.seats().filter(s=>s.context===context&&p.distance(s.approach)<.95)[0];if(nearest){this.mealCue.enabled=true;this.mealCue.setPosition(nearest.approach.x,.09,nearest.approach.z);if(plate?.owner==='held'){add('Set plate down',()=>this.character.animator.playAction('PutDown',.8,()=>this.transfer(nearest.id,nearest.plate)));detail='An open place';}if(!this.cleanup.carry.item||plate?.owner==='held')add('Sit down',()=>this.sit(nearest));}
   if(nearest&&context==='dinner'&&plate?.owner==='held'&&plate.bites===3&&this.home.store.data.dinner.portions.some(Boolean))add('Take another portion',()=>this.character.animator.playAction('PickUp',.8,()=>this.commit(()=>{this.home.store.refillDinner();})));
   if(plate&&plate.owner!=='held'&&!this.cleanup.carry.item&&Math.hypot(p.x-plate.position[0],p.z-plate.position[2])<1.65){add('Pick up plate',()=>this.character.animator.playAction('PickUp',.8,()=>this.take()));detail='Your meal';}
   if(plate?.owner==='held'){const atReturn=context==='dinner'?p.distance(propPoint('sink',new Vec3(-1.7,.09,11.45)))<1.1:p.distance(new Vec3(9.5,.09,-19.65))<1.15;
    if(atReturn){add(context==='dinner'?'Return plate':'Return tray',()=>this.commit(()=>{this.home.store.returnPlate(context);this.cleanup.carry.release(this.root,[0,0,0]);item.entity.enabled=false;this.character.animator.setCarrying(false);}));detail=context==='dinner'?'Kitchen sink':'Tray rack';}
    add('Leave plate here',()=>{const planner=new HousePath(context==='dinner'?this.house:this.school,.1);if(planner.free(p.x,p.z))this.transfer('world',new Vec3(p.x,.09,p.z));});detail=detail||'Your meal';
   }
  }
  if(this.home.extraCommands.length)this.home.extraFocus={title:'',detail:detail||'Meal time',icon:'🍽',enabled:true};
  this.sync();
  if(this.serveTime>0&&this.plate('lunch')?.owner==='counter'){const phase=1-this.serveTime/this.serveStart,t=Math.max(0,(phase-.4)/.6),e=this.plates.get('lunch')!.entity;e.setPosition(4.6,1.34+Math.sin(t*Math.PI)*.04,-21.5+t*.7);for(const name of ['Edible serving','Edible fruit']){const part=e.findByName(name);if(part)part.enabled=phase>=.4;}}
 }
 snapshot(){return{seat:this.seat?.id,standing:this.standing,plate:this.plate(),seats:this.seats().map(s=>({...s,approach:s.approach.toArray(),sit:s.sit.toArray(),plate:s.plate.toArray()})),main:this.selectedMain,fruit:this.selectedFruit};}
 destroy(){this.suspend();this.root.destroy();this.art.destroy();}
}
