import {Entity,Vec3,type Application} from 'playcanvas';
import {primitives,material} from './primitives';
import type {CleanupProps} from './cleanupProps';
import type {TaskDefinition} from '../systems/MissionSystem';

type Mess={x:number;z:number;done:boolean;cleanedBy?:'arianna'|'marc'};
/** Three distinct incidents per day; cleaned chores never respawn or pay twice. */
export class LilahMesses {
  private day=0;
  private records:Mess[]=[];
  readonly roots:Entity[]=[];
  tasks:TaskDefinition[]=[];
  readonly kinds=['toys','spill','crumbs'] as const;
  onClean=(_actor:'arianna'|'marc')=>{};
  constructor(app:Application,parent:Entity,private props:CleanupProps,private active:()=>boolean){
    const colors=['#db9fc9','#accce1','#e6c779','#b3c59f'].map((c,i)=>material('Lilah toy '+i,c));
    const juice=material('Lilah juice','#e5b763'),crumb=material('Lilah cracker crumbs','#ba9363');
    for(let i=0;i<3;i++){
      const root=new Entity('Lilah '+this.kinds[i],app);parent.addChild(root);this.roots.push(root);root.enabled=false;
      const shape=primitives(app,root);
      for(let n=0;n<(i===0?4:8);n++)shape(this.kinds[i],i===0?'box':'sphere',
        [Math.sin(n*2.4)*.23,i===0?.07:.018,Math.cos(n*2.4)*.2],
        i===0?[.13,.13,.13]:i===1?[.3,.025,.25]:[.09,.035,.08],i===0?colors[n]:i===1?juice:crumb,false);
      const id='lilah-mess-'+i;
      props.interactions.push({id,task:id,kind:'daily',name:['Lilah’s toy trail','Lilah’s juice spill','Lilah’s crumbs'][i],icon:['🧸','🧻','✦'][i],
        actionLabel:['Tidy Lilah’s toys','Hold to wipe','Hold to vacuum'][i],anchor:new Vec3(),marker:new Vec3(),range:1,
        duration:i===0?600:1200,hold:i!==0,mess:root,
        available:held=>this.active()&&!!this.records[i]&&!this.records[i].done&&(i===0?!held:held===(i===1?'paper-towel':'vacuum'))});
    }
  }
  syncDay(day:number){
    if(this.day===day)return;
    this.day=day;this.records=[];
    try{const saved=JSON.parse(localStorage.getItem('arianna.lilah.v1')||'null');
      if(saved?.day===day&&Array.isArray(saved.messes)&&saved.messes.length<=3&&saved.messes.every((m:Mess)=>Number.isFinite(m.x)&&Number.isFinite(m.z)&&typeof m.done==='boolean'))this.records=saved.messes;
    }catch{}
    this.refresh();
  }
  private save(records:Mess[]){try{localStorage.setItem('arianna.lilah.v1',JSON.stringify({day:this.day,messes:records}));return true;}catch{return false;}}
  refresh(){
    this.tasks=this.records.map((_,i)=>({id:'lilah-mess-'+i,name:['Lilah’s toys','Lilah’s spill','Lilah’s crumbs'][i],icon:['🧸','🧻','✦'][i]}));
    this.roots.forEach((root,i)=>{const m=this.records[i];root.enabled=!!m&&!m.done;root.setLocalScale(1,1,1);if(m){root.setLocalPosition(m.x,.035,m.z);const target=this.props.interactions.find(t=>t.id==='lilah-mess-'+i)!;target.anchor.set(m.x,0,m.z);target.marker.set(m.x,.3,m.z);}});
  }
  get count(){return this.records.length;}
  get activeCount(){return this.records.filter(m=>!m.done).length;}
  get completed(){return this.records.flatMap((m,i)=>m.done?['lilah-mess-'+i]:[]);}
  needs(kind:'spill'|'crumbs'){const i=this.kinds.indexOf(kind);return !!this.records[i]&&!this.records[i].done;}
  add(position:Vec3){if(this.count>=3||this.activeCount>=2)return false;const records=[...this.records,{x:position.x,z:position.z,done:false}];if(!this.save(records))return false;this.records=records;this.refresh();return true;}
  complete(id:string,actor:'arianna'|'marc'='arianna'){const i=this.tasks.findIndex(t=>t.id===id);if(i<0||this.records[i].done)return false;const records=this.records.map((m,j)=>j===i?{...m,done:true,cleanedBy:actor}:m);if(!this.save(records))return false;this.records=records;this.roots[i].enabled=false;this.onClean(actor);return true;}
  snapshot(){return {day:this.day,messes:this.records.map((m,i)=>({...m,id:'lilah-mess-'+i,kind:this.kinds[i],visible:this.roots[i].enabled})),budget:3};}
}
