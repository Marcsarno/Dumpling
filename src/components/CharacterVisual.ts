import { Asset, BoundingBox, Entity, type AnimTrack, type Application, type ContainerResource, type RenderComponent } from 'playcanvas';
import { meshyGameplay, type ChoreCapture } from './MeshyGameplayAdapter';
import { material, primitives } from '../game/primitives';
import { CharacterAnimator, type CharacterManifest } from './CharacterAnimator';
import { CharacterGrounding } from './CharacterGrounding';
import {sleepingTrack,bedEntryTrack} from './RestingPose';

export function createCharacter(app: Application) {
  const player = new Entity('Arianna', app);
  app.root.addChild(player);
  player.setPosition(0, 0.09, 0.9);
  const visual = new Entity('Character visual pivot', app);
  player.addChild(visual);
  visual.setLocalEulerAngles(0, 30, 0);
  const placeholder = new Entity('Temporary capsule', app);
  visual.addChild(placeholder);
  const shape = primitives(app, placeholder);
  const lilac = material('Arianna lavender', '#b294dc');
  const cream = material('Arianna cream', '#ffe5cc');
  const rose = material('Arianna pink', '#efafc7');
  const ink = material('Arianna eyes', '#5e4c6b');
  shape('Capsule body', 'capsule', [0, 0.47, 0], [0.51, 0.72, 0.45], lilac);
  shape('Placeholder head', 'sphere', [0, 0.94, 0], [0.49, 0.47, 0.46], cream);
  shape('Left shoe', 'capsule', [-0.14, 0.1, 0.06], [0.21, 0.19, 0.3], rose);
  shape('Right shoe', 'capsule', [0.14, 0.1, 0.06], [0.21, 0.19, 0.3], rose);
  for (const x of [-0.095, 0.095]) shape('Eye', 'sphere', [x, 0.97, 0.215], [0.052, 0.061, 0.03], ink, false);
  for (const x of [-0.15, 0.15]) shape('Cheek', 'sphere', [x, 0.895, 0.202], [0.065, 0.034, 0.025], rose, false);
  const marker = primitives(app, player)('Player floor marker', 'cylinder', [0, -0.027, 0], [0.72, 0.012, 0.72], material('Player marker', '#efe0f6'), false);
  marker.render!.receiveShadows = false;
  const animator = new CharacterAnimator(visual, placeholder);
  return { player, visual, placeholder, animator, grounding: null as CharacterGrounding | null };
}

/** Optional, engine-native container loading; absent assets never block play. */
export async function loadArianna(app: Application, character: ReturnType<typeof createCharacter>): Promise<void> {
  const configResponse = await fetch(`${import.meta.env.BASE_URL}assets/characters/arianna/character.json`);
  if (!configResponse.ok) return;
  const config: { url: string | null; height?: number; yaw?: number; manifest: string; adapter?: string } = await configResponse.json();
  if (!config.url) return;
  const response = await fetch(`${import.meta.env.BASE_URL}assets/characters/arianna/${config.manifest}`);
  if (!response.ok) throw new Error('Arianna manifest could not load.');
  let manifest: CharacterManifest = await response.json();
  const asset = new Asset('Arianna GLB', 'container', { url: `${import.meta.env.BASE_URL}assets/characters/arianna/${config.url}` });
  await new Promise<void>((resolve, reject) => {
    asset.once('load', () => resolve());
    asset.once('error', reject);
    app.assets.add(asset);
    app.assets.load(asset);
  });
  const resource = asset.resource as ContainerResource;
  const model = resource.instantiateRenderEntity({ castShadows: true });
  let tracks=((resource as ContainerResource & { animations: Asset[] }).animations ?? []).map(asset=>asset.resource as AnimTrack);
  if(config.adapter==='meshy'){
    const motion=await fetch(`${import.meta.env.BASE_URL}assets/animations/chores/cmu-trajectories.json`);
    if(!motion.ok)throw new Error('Chore motion library could not load.');
    ({tracks,manifest}=meshyGameplay(model,tracks,await motion.json() as ChoreCapture));
    const sleep=sleepingTrack(model,tracks.find(t=>t.name==='Idle')!,await(await fetch('/assets/animations/rest/sleep.json')).json());tracks.push(sleep,bedEntryTrack(model,tracks.find(t=>t.name==='Idle')!,sleep));manifest.animations.push({name:'Sleep',duration_seconds:4,loop:true},{name:'SleepEnter',duration_seconds:3.2,loop:false});
  }
  // Normalize the visual only. Root position, movement and collision radius stay untouched.
  const bounds = new BoundingBox();
  let first = true;
  for (const render of model.findComponents('render')) {
    for (const mesh of (render as RenderComponent).meshInstances) {
      if (first) { bounds.copy(mesh.aabb); first = false; } else bounds.add(mesh.aabb);
    }
  }
  if (first || bounds.halfExtents.y < 0.001) { model.destroy(); throw new Error('Arianna GLB has no usable visible geometry.'); }
  const scale = (config.height ?? manifest.scale.rest_height_m) / manifest.scale.rest_height_m;
  const alignment = new Entity('GLB alignment', app);
  alignment.addChild(model);
  model.setLocalScale(scale, scale, scale);
  // Approved root is already at ground between the feet. Never recenter the rig from an AABB.
  alignment.setLocalEulerAngles(0, config.yaw ?? 0, 0);
  character.visual.addChild(alignment);
  try {
    character.animator.attach(model, tracks, manifest, scale);
  } catch (error) { alignment.destroy(); throw error; }
  character.grounding = new CharacterGrounding(app.root, character.player, alignment);
  character.grounding.update();
  character.placeholder.enabled = false;
}
