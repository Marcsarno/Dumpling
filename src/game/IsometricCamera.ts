import { Entity, Color, PROJECTION_ORTHOGRAPHIC, TONEMAP_LINEAR, Vec3, type Application } from 'playcanvas';

export type CameraState='EXPLORE'|'CHORE'|'REVIEW'|'BOX_OPENING'|'TRADE';
export const CAMERA_PRESETS={EXPLORE:{zoom:1},CHORE:{zoom:.76},REVIEW:{zoom:.65},BOX_OPENING:{zoom:.7},TRADE:{zoom:.85}} as const;

export class IsometricCamera {
  readonly entity: Entity;
  private readonly offset = new Vec3();
  private readonly desired = new Vec3();
  private readonly basePosition = new Vec3(6,14,18.9);
  private readonly baseTarget = new Vec3(0,.8,.9);
  private readonly zoomFactor:number;
  state:CameraState='EXPLORE';
  private target:Vec3|null=null;
  private returnZoom:number|null=null;
  private returning=false;
  private interactionLift=0;
  get exploreHeight(){return this.returnZoom??this.entity.camera!.orthoHeight;}
  beginChore(player:Vec3,object:Vec3){
    if(this.returnZoom===null)this.returnZoom=this.entity.camera!.orthoHeight;
    this.target=new Vec3().lerp(player,object,.4);this.state='CHORE';this.returning=false;
  }
  endChore(){if(this.state==='CHORE'){this.state='EXPLORE';this.target=null;this.returning=true;}}
  constructor(app: Application, existing?: Entity) {
    this.zoomFactor=(existing?.camera?.orthoHeight??7)/7;
    if(existing){this.basePosition.copy(existing.getPosition());this.baseTarget.copy(existing.getPosition()).add(existing.forward.clone().mulScalar(new Vec3(6,14,18.9).distance(new Vec3(0,.8,.9))));}
    this.entity = existing ?? new Entity('Following isometric camera', app);
    if (!this.entity.camera) this.entity.addComponent('camera', {
      projection: PROJECTION_ORTHOGRAPHIC,
      orthoHeight: 7,
      nearClip: 0.1,
      farClip: 60,
      clearColor: new Color().fromString('#ede6f4'),
    });
    this.entity.setPosition(this.basePosition);
    this.entity.lookAt(this.baseTarget);
    if (!existing) app.root.addChild(this.entity);
  }
  resize(width: number, height: number) {
    const aspect = width / height;
    // Show a readable slice of the home, instead of fitting its entire width into a phone.
    const zoom=(aspect < 1 ? Math.max(5.1, 2.65 / aspect) : 5.1)*this.zoomFactor;
    if(this.returnZoom!==null)this.returnZoom=zoom;
    this.entity.camera!.orthoHeight = zoom*(this.state==='CHORE'?CAMERA_PRESETS.CHORE.zoom:1);
  }
  follow(player: Vec3, dt: number) {
    const focus=this.target??player;
    this.desired.set(focus.x, 0, focus.z - .9);
    this.offset.lerp(this.offset, this.desired, 1 - Math.exp(-(this.target||this.returning?5:10) * dt));
    if(this.returnZoom!==null){const wanted=this.returnZoom*(this.state==='CHORE'?CAMERA_PRESETS.CHORE.zoom:1);this.entity.camera!.orthoHeight+=(wanted-this.entity.camera!.orthoHeight)*(1-Math.exp(-5*dt));if(this.returning&&Math.abs(wanted-this.entity.camera!.orthoHeight)<.005){this.entity.camera!.orthoHeight=wanted;this.returnZoom=null;this.returning=false;}}
    this.interactionLift+=((this.state==='CHORE'?6:0)-this.interactionLift)*(1-Math.exp(-5*dt));
    this.entity.setPosition(this.basePosition.x + this.offset.x, this.basePosition.y+this.interactionLift, this.basePosition.z + this.offset.z);
    this.entity.lookAt(new Vec3(this.baseTarget.x+this.offset.x,this.baseTarget.y,this.baseTarget.z+this.offset.z));
  }
  reset() { this.entity.camera!.toneMapping=TONEMAP_LINEAR;if(this.returnZoom!==null)this.entity.camera!.orthoHeight=this.returnZoom;this.returnZoom=null;this.returning=false;this.interactionLift=0;this.target=null;this.state='EXPLORE';this.offset.set(0, 0, 0); this.entity.setPosition(this.basePosition);this.entity.lookAt(this.baseTarget); }
}
