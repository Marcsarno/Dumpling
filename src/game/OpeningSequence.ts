import { Entity,Color,Vec3,TONEMAP_ACES, type Application, type RenderComponent } from 'playcanvas';
import { DUMPLINGS, RARITIES } from '../data/collection';
import type { RevealReceipt } from '../systems/ProgressStore';
import { createBlindBox, createDumpling } from './dumplingVisual';
import {material,primitives} from './primitives';
import {animateSquishy} from './SquishyArt';
import {squishyOpeningPose,SQUISHY_REVEAL_SECONDS} from './SquishyMotion';

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
  private audio: AudioContext | null = null;
  private sounded = false;
  readonly panel = document.querySelector<HTMLElement>('#reveal-copy')!;
  constructor(private readonly app: Application) {
    this.root = new Entity('Home surprise presentation', app); app.root.addChild(this.root);
    this.root.setPosition(0, .08, 0); this.root.setEulerAngles(0, -10, 0);
    const stage=primitives(app,this.root),ivory=material('Reward porcelain','#f6e8d7');ivory.gloss=.35;ivory.update();
    stage('Little presentation pedestal','cylinder',[0,-.045,0],[1.68,.09,1.68],ivory);
    const paper=material('Warm studio backdrop','#f7eee8');paper.useLighting=false;paper.diffuse.set(0,0,0);paper.emissive=new Color().fromString('#f6f0ec');paper.useTonemap=false;paper.update();
    const backdrop=new Entity('Reward backdrop',app);this.root.addChild(backdrop);backdrop.addComponent('render',{type:'plane',material:paper,castShadows:false,receiveShadows:false});backdrop.setLocalPosition(0,-.095,0);backdrop.setLocalScale(100,1,100);
    for(const [name,power,pitch,yaw] of [['Reward key',1.0,38,-35],['Reward fill',.45,25,65],['Reward rim',.6,55,180]] as const){const light=new Entity(name,app);light.addComponent('light',{type:'directional',color:new Color(1,.95,.89),intensity:power,mask:16,castShadows:name==='Reward key',shadowResolution:2048,shadowDistance:8,normalOffsetBias:.025,shadowBias:.12});light.setLocalEulerAngles(pitch,yaw,0);this.root.addChild(light);}
    this.box = createBlindBox(app, this.root);this.studioMask(this.root); this.root.enabled = false;
    this.squishButton.id='squish-friend';this.squishButton.type='button';this.squishButton.textContent='Squish ♡';this.squishButton.setAttribute('aria-label','Gently squish your new friend');this.squishButton.hidden=true;document.querySelector('#game')!.append(this.squishButton);
    this.squishButton.onclick=()=>{if(this.phase==='revealed'){this.squish=this.idle;this.cue(420);}};
  }
  private studioMask(root:Entity){for(const r of root.findComponents('render') as RenderComponent[])for(const mesh of r.meshInstances)mesh.mask=16;}
  frame(camera:Entity,width:number,height:number){const compact=height<=650;camera.camera!.toneMapping=TONEMAP_ACES;camera.camera!.orthoHeight=Math.max(1.50,(compact?1.32:1.0)/(width/height));camera.setPosition(0,2.05,4.6);camera.lookAt(new Vec3(0,compact?.50:.85,0));}
  show(receipt: RevealReceipt | null) {
    this.root.enabled = true; this.panel.hidden = false; this.model?.destroy(); this.model = null;
    this.box.root.enabled = true; this.box.root.setLocalEulerAngles(0, 0, 0);
    this.box.root.setLocalScale(1, 1, 1); this.box.lid.setLocalEulerAngles(0, 0, 0);this.last=0;this.elapsed=0;this.idle=0;this.squish=-10;this.squishButton.hidden=true;
    this.phase = 'closed'; this.receipt = null; this.panel.replaceChildren(); this.panel.classList.remove('has-reveal');
    this.panel.textContent = 'A little bamboo basket. Who’s tucked inside?';
    if (receipt) { this.prepare(receipt); this.phase = 'revealed'; this.reveal(false);this.squishButton.hidden=false; }
  }
  begin(receipt: RevealReceipt, now: number) {
    this.prepare(receipt); this.elapsed=0;this.last=now; this.phase = 'opening'; this.sounded = false;
    this.panel.textContent = 'A little surprise is waking up…'; this.cue(480);
    if(this.reduced.matches){this.phase='revealed';this.reveal(false);this.squishButton.hidden=false;}
  }
  private prepare(receipt: RevealReceipt) {
    this.receipt = receipt;
    const data = DUMPLINGS.find(d => d.id === receipt.dumplingId)!;
    this.model?.destroy(); this.model = createDumpling(this.app, this.root, data); this.studioMask(this.model);this.model.enabled = false;
  }
  private cue(frequency: number) {
    // Temporary sound hook. An asset-backed sound bank can replace this without touching gameplay.
    try {
      this.audio ??= new AudioContext(); void this.audio.resume();
      const tone = this.audio.createOscillator(), gain = this.audio.createGain(), now = this.audio.currentTime;
      tone.type = 'sine'; tone.frequency.setValueAtTime(frequency, now); tone.frequency.exponentialRampToValueAtTime(frequency * 1.5, now + .18);
      gain.gain.setValueAtTime(.045, now); gain.gain.exponentialRampToValueAtTime(.001, now + .28);
      tone.connect(gain); gain.connect(this.audio.destination); tone.start(); tone.stop(now + .3);
    } catch { /* Silent play remains fully supported. */ }
  }
  private reveal(animate: boolean) {
    const data = DUMPLINGS.find(d => d.id === this.receipt!.dumplingId)!, rarity = RARITIES[data.rarity];
    this.box.root.enabled = true;this.box.lid.setLocalEulerAngles(-112,0,0); this.model!.enabled = true;
    if(!animate){this.model!.setLocalPosition(0,.34,0);this.model!.setLocalScale(1,1,1);}
    this.panel.replaceChildren(); this.panel.style.setProperty('--rarity', rarity.color); this.panel.classList.add('has-reveal');
    this.panel.style.setProperty('--aura-size', data.rarity === 'Legendary' ? '290px' : data.rarity === 'Common' ? '140px' : '220px');
    const badge = document.createElement('small'); badge.textContent = `${data.rarity} · ${this.receipt!.isNew ? 'NEW FRIEND' : `ANOTHER FRIEND · ×${this.receipt!.count}`}`;
    const title = document.createElement('h2'); title.textContent = data.name;
    const hint = document.createElement('p'); hint.textContent = 'Saved to your collection ♡'; this.panel.append(badge, title, hint);
    if (animate) {
      for (let i = 0; i < rarity.sparkles; i++) {
        const star = document.createElement('span'); star.className = 'reveal-spark'; star.textContent = '✦';
        star.style.setProperty('--x', `${Math.cos(i * 2.4) * (70 + i * 3)}px`);
        star.style.setProperty('--y', `${-60 + Math.sin(i * 2.4) * 100}px`); this.panel.append(star);
      }
      this.cue(620 * rarity.pitch);
    }
  }
  update(now: number) {
    if (!this.root.enabled) return;
    const dt=this.last?Math.min(.05,Math.max(0,(now-this.last)/1000)):0;this.last=now;
    if(document.hidden)return;
    if (this.phase === 'opening') {
      this.elapsed+=dt;const t=this.elapsed,p=squishyOpeningPose(t);
      this.box.root.setLocalEulerAngles(0,p.wiggle,0);this.box.lid.setLocalEulerAngles(p.lid,0,0);
      if(t>.80)this.model!.enabled=true;
      this.model!.setLocalPosition(0,p.height,0);this.model!.setLocalScale(...p.scale);
      if (t > 1.65 && !this.sounded) { this.sounded = true; this.reveal(true); }
      if (t > SQUISHY_REVEAL_SECONDS){this.phase = 'revealed';this.box.root.setLocalEulerAngles(0,0,0);this.squishButton.hidden=false;}
    }
    if(this.phase==='revealed'&&this.model){this.idle+=dt;this.model.setLocalPosition(0,.34,0);animateSquishy(this.model,this.idle,this.reduced.matches?0:.010);const t=this.idle-this.squish;if(t<.85&&!this.reduced.matches){const y=1-.23*Math.sin(t/.85*Math.PI)*Math.exp(-t*1.5);this.model.setLocalScale(1/Math.sqrt(y),y,1/Math.sqrt(y));}}
  }
  snapshot(){return {phase:this.phase,elapsed:this.elapsed,lidAngle:this.box.lid.getLocalEulerAngles().x,modelPosition:this.model?.getLocalPosition().toArray(),modelScale:this.model?.getLocalScale().toArray()};}
  hide() { this.root.enabled = false; this.panel.hidden = true;this.squishButton.hidden=true; }
  destroy() { this.squishButton.remove();this.root.destroy(); void this.audio?.close(); }
}
