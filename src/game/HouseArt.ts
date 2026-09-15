import { Asset, BoundingBox, Color, Entity, StandardMaterial, type Application, type ContainerResource, type RenderComponent } from 'playcanvas';
import type { Triple } from './primitives';

const PALETTE: Record<string, string> = {
  wood: '#c9a078', woodDark: '#987453', woodBark: '#987653', carpet: '#afc3af', carpetDarker: '#879f8e',
  carpetBlue: '#a8b8d4', carpetWhite: '#efe7dc', metal: '#eee9df', metalLight: '#fff6e7', metalDark: '#55535e',
  metalMedium: '#aaa99e', plant: '#789c67', leafsGreen: '#77965c', grass: '#88a66c', dirt: '#9d8162',
  glass: '#aac7ca', lamp: '#ffe7b3', fur: '#be9a75', colorPurple: '#b69bc9', colorYellow: '#eed587',
};

/** Shared imported models + a small warm palette, batched after loading. Original GLBs stay untouched. */
export class HouseArt {
  private readonly assets = new Map<string, Promise<ContainerResource>>();
  private readonly materials = new Map<string, StandardMaterial>();
  private readonly pending: Promise<void>[] = [];
  private readonly group;
  loaded = 0;
  readonly errors: string[] = [];
  constructor(private readonly app: Application, private readonly root: Entity) {
    this.group = app.batcher.addGroup('Cottage imported art', false, 12);
  }
  add(pack: 'furniture' | 'nature' | 'market', name: string, position: Triple, size: number, yaw = 0, dimension: 'height' | 'width' = 'height', colors: Record<string, string> = {}) {
    const key = `${pack}/${name}`;
    if (!this.assets.has(key)) this.assets.set(key, new Promise<ContainerResource>((resolve, reject) => {
      const asset = new Asset(key, 'container', { url: `${import.meta.env.BASE_URL}assets/environment/kenney/${key}.glb` });
      asset.once('load', () => resolve(asset.resource as ContainerResource)); asset.once('error', reject);
      this.app.assets.add(asset); this.app.assets.load(asset);
    }));
    const task = this.assets.get(key)!.then(resource => {
      const model = resource.instantiateRenderEntity({ castShadows: true });
      const renderers = model.findComponents('render') as RenderComponent[];
      const bounds = new BoundingBox(); let first = true;
      for (const render of renderers) for (const mesh of render.meshInstances) {
        if (first) { bounds.copy(mesh.aabb); first = false; } else bounds.add(mesh.aabb);
        const original = mesh.material as StandardMaterial, color = colors[original.name] ?? PALETTE[original.name];
        const paletteKey = `${original.name}/${color ?? 'original'}`;
        if (!this.materials.has(paletteKey)) {
          const material = original.clone(); material.name = `Cottage ${paletteKey}`;
          if (color) material.diffuse = new Color().fromString(color);
          material.metalness = 0; material.gloss = .15; material.update();
          this.materials.set(paletteKey, material);
        }
        mesh.material = this.materials.get(paletteKey)!;
      }
      const scale = size / (2 * (dimension === 'height' ? bounds.halfExtents.y : bounds.halfExtents.x));
      const anchor = new Entity(`Art ${name}`, this.app), normalization = new Entity('Art normalization', this.app);
      normalization.addChild(model); anchor.addChild(normalization); this.root.addChild(anchor);
      normalization.setLocalScale(scale, scale, scale);
      normalization.setLocalPosition(-bounds.center.x * scale, -(bounds.center.y - bounds.halfExtents.y) * scale, -bounds.center.z * scale);
      anchor.setLocalPosition(...position); anchor.setLocalEulerAngles(0, yaw, 0);
      for (const render of renderers) render.batchGroupId = this.group.id;
      this.loaded++;
    }).catch(error => { this.errors.push(key); console.error(`Could not load house art ${key}`, error); });
    this.pending.push(task);
  }
  async finish() { await Promise.all(this.pending); this.app.batcher.generate([this.group.id]); }
  snapshot() { return { loaded: this.loaded, models: this.assets.size, errors: this.errors }; }
}
