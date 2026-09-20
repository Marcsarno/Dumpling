import { Asset, BoundingBox, Entity, type Application, type ContainerResource, type RenderComponent, type AnimTrack } from 'playcanvas';

/** Unbatched imported props can be carried and animated without baking their transforms. */
export async function importProp(app: Application, parent: Entity, name: string, height: number, idle = false, rotation: [number, number, number] = [0, 0, 0]) {
  const asset = new Asset(name, 'container', { url: `${import.meta.env.BASE_URL}assets/pets/${name}.glb` });
  await new Promise<void>((resolve, reject) => { asset.once('load', resolve); asset.once('error', reject); app.assets.add(asset); app.assets.load(asset); });
  const resource = asset.resource as ContainerResource & { animations: Asset[] }, model = resource.instantiateRenderEntity();
  parent.addChild(model);
  model.setLocalEulerAngles(...rotation);
  const bounds = new BoundingBox(); let first = true;
  for (const component of model.findComponents('render')) for (const mesh of (component as RenderComponent).meshInstances) {
    if (first) { bounds.copy(mesh.aabb); first = false; } else bounds.add(mesh.aabb);
  }
  // These prop parents have only a translation while their model is normalized.
  const origin = parent.getPosition(), scale = height / (bounds.halfExtents.y * 2);
  model.setLocalScale(scale, scale, scale);
  model.setLocalPosition(-(bounds.center.x - origin.x) * scale, -(bounds.center.y - bounds.halfExtents.y - origin.y) * scale, -(bounds.center.z - origin.z) * scale);
  if (idle && resource.animations.length) {
    const clip = resource.animations.find(a => /idle/i.test((a.resource as AnimTrack).name)) ?? resource.animations[0];
    model.addComponent('anim', { activate: true });
    model.anim!.assignAnimation('Idle', clip.resource as AnimTrack, undefined, 1, true);
    const walk = resource.animations.find(a => /^walk$/i.test((a.resource as AnimTrack).name));
    if (walk) model.anim!.assignAnimation('Walk', walk.resource as AnimTrack, undefined, 1, true);
  }
  return model;
}
