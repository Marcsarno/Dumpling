import {Vec3,type Application,type Entity} from 'playcanvas';
import type {createCharacter} from '../components/CharacterVisual';
import type {GameLoop} from '../game/GameLoop';
import type {DailyLife} from '../game/DailyLife';
import {propPoint} from '../editor/PropSpace';

/** Repeatable local setup; all meal actions still use the normal game controls. */
export function mealReview(app:Application,character:ReturnType<typeof createCharacter>,camera:Entity,loop:GameLoop,daily:DailyLife){
 const params=new URLSearchParams(location.search),context=params.get('meal-review');
 if(params.get('preview')!=='home-play'||!['dinner','lunch'].includes(context??''))return;
 if(context==='dinner'){
  loop.developerCommand('phase','afternoon');daily.clock.state.dinnerServed=true;daily.save();
  character.player.setPosition(propPoint('dining',new Vec3(.55,.09,11.9)));
 }else{loop.developerCommand('recess');character.player.setPosition(4.6,.09,-20.15);}
 if(!loop.developerSummary().clockFrozen)loop.developerCommand('freeze-clock');
 const cameraControls=document.createElement('div');cameraControls.style.cssText='position:fixed;top:70px;left:12px;z-index:50;display:flex;gap:6px';
 let side=false;for(const label of ['Front view','Side view']){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{side=label==='Side view';};cameraControls.append(b);}document.body.append(cameraControls);
 let stopAtContact=false;const contact=document.createElement('button');contact.textContent='Inspect next bite';contact.onclick=()=>{stopAtContact=true;app.timeScale=1;};cameraControls.append(contact);
 const resume=document.createElement('button');resume.textContent='Resume';resume.onclick=()=>{stopAtContact=false;app.timeScale=1;};cameraControls.append(resume);
 app.on('postrender',()=>{const animation=character.animator.snapshot();if(stopAtContact&&['MealBite','MealDrink'].includes(animation.action??'')&&animation.clipTime>=.65){app.timeScale=0;stopAtContact=false;}});
 const diagnostic=document.createElement('output');diagnostic.id='meal-review-state';diagnostic.style.cssText='position:fixed;top:102px;left:12px;z-index:50;background:#fff8edcc;color:#493958;padding:4px;font:12px system-ui';document.body.append(diagnostic);
 app.on('prerender',()=>{const s=loop.meals.snapshot();if(s.seat){const p=character.player.getPosition(),yaw=context==='lunch'?-1:1;camera.setPosition(p.x+(side?3:0),2,p.z+(side?0:3*yaw));camera.lookAt(p.x,.7,p.z);camera.camera!.orthoHeight=1.6;}diagnostic.value=`${s.plate?.food??'No plate'} · ${s.plate?.owner??'unclaimed'} · bites ${s.plate?.bites??0} · drink ${s.plate?.drink??0}`;});
}
