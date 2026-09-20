import { Entity,Color,Vec3,TONEMAP_ACES, type Application, type RenderComponent } from 'playcanvas';
import { DUMPLINGS, type Rarity } from '../data/collection';
import { SERIES } from '../data/hunt';
import { SQUISHY_PRESENTATION, REVEAL_POP_TIME, revealDuration } from '../data/squishyPresentation';
import type { RevealReceipt } from '../systems/ProgressStore';
import { createBlindBox, createDumpling } from './dumplingVisual';
import {material,primitives} from './primitives';
import {animateSquishy} from './SquishyArt';
import {squishyOpeningPose} from './SquishyMotion';
import { SquishyRevealVfx } from './SquishyRevealVfx';
import { SquishyRevealAudio } from './SquishyRevealAudio';

/** Presentation only: the receipt is committed before this animation starts. */
export class OpeningSequence {
  readonly root: Entity;
  private readonly box: ReturnType<typeof createBlindBox>;
  private model: Entity | null = null;
  private elapsed = 0;
  private last = 0;
  private idle = 0;
  private squish=-10;
  private readonly squishButton=document.createElement('button');
  private readonly reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  phase: 'closed' | 'opening' | 'revealed' = 'closed';
  private receipt: RevealReceipt | null = null;
  private readonly audio = new SquishyRevealAudio();
  private readonly vfx:SquishyRevealVfx;
  private readonly rim:Entity;
  private rarity:Rarity='Common';
  private camera:Entity|null=null;
  private cameraHeight=1.5;
  private lidSounded=false;
  private sounded = false;
  readonly panel = document.querySelector<HTMLElement>('#reveal-copy')!;
  constructor(private readonly app: Application) {
    this.root = new Entity('Home surprise presentation', app); app.root.addChild(this.root);
    this.root.setPosition(0, .08, 0); this.root.setEulerAngles(0, -10, 0);
    const stage=primitives(app,this.root),ivory=material('Reward porcelain','#f6e8d7');ivory.gloss=.35;ivory.update();
    stage('Little presentation pedestal','cylinder',[0,-.045,0],[1.68,.09,1.68],ivory);
    const paper=material('Warm studio backdrop','#f7eee8');paper.useLighting=false;paper.diffuse.set(0,0,0);paper.emissive=new Color().fromString('#f6f0ec');paper.useTonemap=false;paper.update();
    const backdrop=new Entity('Reward backdrop',app);this.root.addChild(backdrop);backdrop.addComponent('render',{type:'plane',material:paper,castShadows:false,receiveShadows:false});backdrop.setLocalPosition(0,-.095,0);backdrop.setLocalScale(100,1,100);
    for(const [name,power,pitch,yaw] of [['Reward key',.88,38,-35],['Reward fill',.40,25,65],['Reward rim',.6,55,180]] as const){const light=new Entity(name,app);light.addComponent('light',{type:'directional',color:new Color(1,.98,.96),intensity:power,mask:16,castShadows:name==='Reward key',shadowResolution:1024,shadowDistance:8,normalOffsetBias:.025,shadowBias:.12});light.setLocalEulerAngles(pitch,yaw,0);this.root.addChild(light);}
    this.rim=this.root.findByName('Reward rim') as Entity;
    this.box = createBlindBox(app, this.root);this.vfx=new SquishyRevealVfx(app,this.root);this.studioMask(this.root); this.root.enabled = false;
    this.panel.setAttribute('role','status');this.panel.setAttribute('aria-live','polite');this.panel.setAttribute('aria-atomic','true');
    this.squishButton.id='squish-friend';this.squishButton.type='button';this.squishButton.textContent='Squish ♡';this.squishButton.setAttribute('aria-label','Gently squish your new friend');this.squishButton.hidden=true;document.querySelector('#game')!.append(this.squishButton);
    this.squishButton.onclick=()=>{if(this.phase==='revealed'){this.squish=this.idle;this.audio.squish();}};
  }
  private studioMask(root:Entity){for(const r of root.findComponents('render') as RenderComponent[])for(const mesh of r.meshInstances)mesh.mask=16;}
  frame(camera:Entity,width:number,height:number){const compact=height<=650;this.camera=camera;camera.camera!.toneMapping=TONEMAP_ACES;this.cameraHeight=Math.max(1.50,(compact?1.32:1.0)/(width/height));camera.camera!.orthoHeight=this.cameraHeight;camera.setPosition(0,2.05,4.6);camera.lookAt(new Vec3(0,compact?.50:.85,0));}
  show(receipt: RevealReceipt | null) {
    this.root.enabled = true; this.panel.hidden = false; this.model?.destroy(); this.model = null;
    this.box.root.enabled = true; this.box.root.setLocalEulerAngles(0, 0, 0);
    this.box.root.setLocalScale(1, 1, 1); this.box.lid.setLocalEulerAngles(0, 0, 0);this.last=0;this.elapsed=0;this.idle=0;this.squish=-10;this.squishButton.hidden=true;
    this.phase = 'closed'; this.receipt = null; this.panel.replaceChildren(); this.panel.classList.remove('has-reveal');delete this.panel.dataset.rarity;this.vfx.hide();this.audio.stop();this.restoreCamera();this.light(0);
    this.panel.textContent = 'A little bamboo basket. Who’s tucked inside?';
    if (receipt) { this.prepare(receipt); this.phase = 'revealed'; this.reveal(false);this.vfx.update(4,this.reduced.matches);this.squishButton.hidden=false; }
  }
  begin(receipt: RevealReceipt, now: number) {
    this.prepare(receipt); this.elapsed=0;this.last=now; this.phase = 'opening'; this.sounded = false;this.lidSounded=false;
    this.panel.textContent = 'Someone’s waking up…'; this.audio.anticipate();
    if(this.reduced.matches){this.phase='revealed';this.reveal(false);this.vfx.update(4,true);this.squishButton.hidden=false;}
  }
  private prepare(receipt: RevealReceipt) {
    this.receipt = receipt;
    const data = DUMPLINGS.find(d => d.id === receipt.dumplingId)!;
    this.rarity=data.rarity;this.vfx.configure(data.rarity);this.vfx.hide();
    this.model?.destroy(); this.model = createDumpling(this.app, this.root, data); this.studioMask(this.model);this.model.enabled = false;
  }
  private restoreCamera(){if(this.camera?.camera)this.camera.camera.orthoHeight=this.cameraHeight;}
  private light(burst:number){const s=SQUISHY_PRESENTATION[this.rarity],color=new Color().fromString(s.color),amount=this.phase==='closed'?0:s.rim;this.rim.light!.color=new Color(1+(color.r-1)*amount,1+(color.g-1)*amount,1+(color.b-1)*amount);this.rim.light!.intensity=.6+burst*amount;}
  private reveal(animate: boolean) {
    const data = DUMPLINGS.find(d => d.id === this.receipt!.dumplingId)!, rarity = SQUISHY_PRESENTATION[data.rarity];
    this.box.root.enabled = true;this.box.lid.setLocalEulerAngles(-112,0,0); this.model!.enabled = true;
    if(!animate){this.model!.setLocalPosition(0,.34,0);this.model!.setLocalScale(1,1,1);}
    this.panel.replaceChildren(); this.panel.style.setProperty('--rarity', rarity.color);this.panel.style.setProperty('--rarity-ink',rarity.ink);this.panel.style.setProperty('--rarity-wash',rarity.wash);this.panel.dataset.rarity=data.rarity;this.panel.classList.add('has-reveal');
    const badges=document.createElement('div');badges.className='reveal-badges';
    const badge = document.createElement('small');badge.className='reveal-rarity';badge.textContent=`${rarity.symbol} ${data.rarity}`;
    const status=document.createElement('small');status.className='reveal-status';status.textContent=this.receipt!.isNew?'NEW!':`DUPLICATE · ×${this.receipt!.count}`;badges.append(badge,status);
    const title = document.createElement('h2'); title.textContent = data.name;
    const series=SERIES.find(s=>(s.items as readonly string[]).includes(data.id));
    const hint = document.createElement('p');hint.textContent=`${series?.name??'Little friends'} · Saved ♡`;this.panel.append(badges,title,hint);
    if (animate)this.audio.celebrate(rarity.notes);
    this.light(0);
  }
  update(now: number) {
    if (!this.root.enabled) return;
    const dt=this.last?Math.min(.05,Math.max(0,(now-this.last)/1000)):0;this.last=now;
    if(document.hidden){this.audio.stop();return;}
    if (this.phase === 'opening') {
      if(this.reduced.matches){this.phase='revealed';this.reveal(false);this.vfx.update(4,true);this.restoreCamera();this.squishButton.hidden=false;return;}
      this.elapsed+=dt;const t=this.elapsed,s=SQUISHY_PRESENTATION[this.rarity],p=squishyOpeningPose(t,s.intensity);
      this.box.root.setLocalEulerAngles(0,p.wiggle,0);this.box.lid.setLocalEulerAngles(p.lid,0,0);
      if(t>.80)this.model!.enabled=true;
      this.model!.setLocalPosition(0,p.height,0);this.model!.setLocalScale(...p.scale);
      if(t>.45&&!this.lidSounded){this.lidSounded=true;this.audio.lid();}
      const sincePop=t-REVEAL_POP_TIME,emphasis=sincePop>=0?Math.sin(Math.min(1,sincePop/.65)*Math.PI):0;
      this.vfx.update(sincePop,false);this.light(emphasis);
      if(this.camera?.camera)this.camera.camera.orthoHeight=this.cameraHeight*(1-s.punch*emphasis);
      if (t > REVEAL_POP_TIME && !this.sounded) { this.sounded = true; this.reveal(true); }
      if (t > revealDuration(this.rarity)){this.phase = 'revealed';this.box.root.setLocalEulerAngles(0,0,0);this.restoreCamera();this.squishButton.hidden=false;}
    }
    if(this.phase==='revealed'&&this.model){this.idle+=dt;this.vfx.update(Math.max(4,this.elapsed-REVEAL_POP_TIME)+this.idle,this.reduced.matches);this.model.setLocalPosition(0,.34,0);animateSquishy(this.model,this.idle,this.reduced.matches?0:.010);const t=this.idle-this.squish;if(t<.85&&!this.reduced.matches){const y=1-.23*Math.sin(t/.85*Math.PI)*Math.exp(-t*1.5);this.model.setLocalScale(1/Math.sqrt(y),y,1/Math.sqrt(y));}}
  }
  snapshot(){return {phase:this.phase,elapsed:this.elapsed,rarity:this.rarity,vfx:this.vfx.snapshot(),lidAngle:this.box.lid.getLocalEulerAngles().x,modelPosition:this.model?.getLocalPosition().toArray(),modelScale:this.model?.getLocalScale().toArray()};}
  hide() { this.restoreCamera();this.vfx.hide();this.audio.stop();this.root.enabled = false; this.panel.hidden = true;this.squishButton.hidden=true; }
  destroy() { this.squishButton.remove();this.vfx.destroy();this.root.destroy();this.audio.destroy(); }
}
