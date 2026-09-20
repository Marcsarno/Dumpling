import { BoundingBox, Vec3, type Entity, type RenderComponent } from 'playcanvas';

/** Advances only with the world, so arcade/developer pauses freeze the dog too. */
export class DogAnimator {
  private previous=new Vec3();
  private state='Idle';
  private speed=0;
  private height=0;
  constructor(private root:Entity,private model:Entity){
    this.previous.copy(root.getPosition());
    const bounds=new BoundingBox();let first=true;
    for(const component of model.findComponents('render'))for(const mesh of (component as RenderComponent).meshInstances){if(first){bounds.copy(mesh.aabb);first=false;}else bounds.add(mesh.aabb);}
    this.height=bounds.halfExtents.y*2;
    model.anim!.playing=false; // Manual update below; avoid a second engine-system tick.
    model.anim!.baseLayer!.transition('Idle',0);
    model.anim!.update(0);
  }
  update(dt:number){
    const p=this.root.getPosition(),distance=Math.hypot(p.x-this.previous.x,p.z-this.previous.z);
    this.previous.copy(p);
    if(dt<=0)return;
    this.speed=distance<.1?distance/dt:0; // Scene resets/teleports are not strides.
    const next=this.speed>.015?'Walk':'Idle';
    if(next!==this.state){this.state=next;this.model.anim!.baseLayer!.transition(next,.16);}
    this.model.anim!.speed=next==='Walk'?Math.max(.35,Math.min(2.5,this.speed/.20)):1;
    this.model.anim!.update(dt);
  }
  snapshot(){return{state:this.state,speed:this.speed,time:this.model.anim!.baseLayer!.activeStateCurrentTime,position:this.root.getPosition().toArray(),height:this.height,asset:'sunny-pup.glb'};}
}
