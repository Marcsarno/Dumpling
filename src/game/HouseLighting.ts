import { Color, Entity, type Application, type StandardMaterial } from 'playcanvas';
import { material, primitives, type Triple } from './primitives';

/** Local lights affect interior geometry only (mask 1); garden batches use mask 8. */
export class HouseLighting {
  private amount = 0;
  private shadedCount = -1;
  get nightAmount() { return this.amount; }
  private readonly lights: {entity: Entity; intensity: number}[] = [];
  private readonly shades: StandardMaterial[];
  constructor(app: Application, root: Entity, bedside: StandardMaterial, private importedShades: StandardMaterial[]) {
    const shade = material('Warm household light glass', '#fff0d8');
    this.shades = [bedside, shade];
    const shape = primitives(app, root);
    const brass = material('Light fixture brass', '#b59169');
    const addLight = (name: string, position: Triple, intensity: number, range: number) => {
      const entity = new Entity(name, app); root.addChild(entity); entity.setLocalPosition(...position);
      entity.addComponent('light', {type: 'omni', color: new Color(1,.84,.67),
        intensity: 0, range, castShadows: false});
      entity.light!.mask = 1;
      entity.enabled = false;
      this.lights.push({entity, intensity});
    };
    addLight('Bedside lamp light', [-.53,1.39,-2.83], 2.4, 3.8);
    addLight('Reading floor lamp light', [5.65,1.58,7.7], 2.3, 3.5);
    addLight('Lilah nursery lamp', [7.1,1.48,-1.15], 2.3, 6);
    addLight('Marc bedside lamp', [10.6,.94,4.5], 2.3, 6);
    addLight('Marc reading lamp', [10.55,1.48,8.0], 2.3, 6);
    // Fixtures sit on real walls or imported floor lamps, never on the removed ceiling.
    for(const [name,x,y,z,leftWall,floorLamp] of [
      ['Bedroom',.55,2.2,-3.46,false,false], ['Landing',6.1,1.58,3.28,false,true],
      ['Bathroom',4.7,2.2,-3.43,false,false], ['Living room',-3.08,2.2,4.35,true,false],
      ['Kitchen',-3.08,2.48,10.1,true,false], ['Dining',-3.08,2.2,15.3,true,false],
      ['Utility',6.1,1.58,11.45,false,true],
    ] as const) {
      if(!floorLamp) {
        shape(name+' sconce back', 'box', [x,y,z], leftWall ? [.055,.4,.25] : [.25,.4,.055], brass, false);
        shape(name+' sconce glass', 'sphere', [x+(leftWall?.08:0),y,z+(leftWall?0:.08)], leftWall ? [.19,.31,.2] : [.2,.31,.19], shade, false);
      }
      addLight(name+' fixture light', [x+(leftWall?.22:0),y,z+(leftWall||floorLamp?0:.22)], 2.1, 5.5);
    }
    // Soft reflected interior light keeps faces readable away from the nearest lamp.
    const fill = new Entity('Warm interior bounce', app);root.addChild(fill);
    fill.addComponent('light',{type:'directional',color:new Color(1,.88,.74),intensity:0,castShadows:false});
    fill.light!.mask=1;fill.setEulerAngles(45,-30,0);fill.enabled=false;
    this.lights.push({entity:fill,intensity:.55});
  }
  update(night: boolean, dt: number) {
    const target = night ? 1 : 0;
    if(this.amount === target && this.shadedCount === this.importedShades.length) return;
    this.shadedCount = this.importedShades.length;
    this.amount += Math.sign(target-this.amount)*Math.min(Math.abs(target-this.amount),dt/1.2);
    for(const {entity,intensity} of this.lights) {
      entity.enabled = this.amount > .001;
      const authored=(entity.parent as Entity)?.light;
      entity.light!.intensity = (authored?.intensity??intensity)*this.amount;
    }
    for(const shade of [...this.shades,...this.importedShades]) {
      shade.emissive.set(1,.67,.3);
      shade.emissiveIntensity = this.amount*.8;
      shade.update();
    }
  }
  snapshot() {
    return {amount:this.amount, lights:this.lights.map(({entity,intensity})=>({name:entity.name,enabled:entity.enabled,maxIntensity:intensity,
      intensity:entity.light!.intensity,mask:entity.light!.mask,position:entity.getPosition().toArray()})),
      glowingShades:this.shades.length+this.importedShades.length, exteriorMask:8};
  }
}
