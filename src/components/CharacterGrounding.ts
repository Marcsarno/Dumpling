import { type Entity, type RenderComponent } from 'playcanvas';

/** Visual-only ground contact on the existing flat floors and thin rugs. */
export class CharacterGrounding {
  surfaceHeight:number|null=null;
  private readonly surfaces;
  constructor(root: Entity, private readonly player: Entity, private readonly alignment: Entity) {
    this.surfaces = (root.findComponents('render') as RenderComponent[])
      .filter(render => /(?:floor|rug|runner|mat)$/i.test(render.entity.name))
      .flatMap(render => render.meshInstances.map(mesh => ({ entity: render.entity, oval: render.type === 'cylinder', bounds: mesh.aabb.clone() })));
  }
  update() {
    const p = this.player.getPosition();
    let ground = 0;
    for (const { entity, oval, bounds } of this.surfaces) {
      if (!entity.enabled) continue;
      const x = (p.x - bounds.center.x) / bounds.halfExtents.x, z = (p.z - bounds.center.z) / bounds.halfExtents.z;
      if (oval ? x * x + z * z <= 1 : Math.abs(x) <= 1 && Math.abs(z) <= 1) ground = Math.max(ground, bounds.center.y + bounds.halfExtents.y);
    }
    this.alignment.setLocalPosition(0, (this.surfaceHeight??ground) + .002 - p.y, 0);
  }
}
