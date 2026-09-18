import { AnimStateGraph, Entity, Mat4, Vec3, math, SEMANTIC_BLENDINDICES, SEMANTIC_BLENDWEIGHT, type AnimTrack, type Asset, type GraphNode, type RenderComponent } from 'playcanvas';

export interface CharacterManifest {
  animations: { name: string; duration_seconds: number; loop: boolean }[];
  locomotion: Record<string, { travel_speed_mps: number }>;
  interaction_events: Record<string, { time_seconds: number; event: string }[]>;
  scale: { rest_height_m: number };
  hand_joints?: string[];
  action_playback?: number;
  walk_playback?: number;
}
type Action = { name: string; elapsed: number; duration: number; eventTime: number; rate: number; fired: boolean; commit?: () => void };

/** Rig, clip clocks and grip presentation stay separate from movement and mission rules. */
export class CharacterAnimator {
  private model: Entity | null = null;
  private manifest: CharacterManifest | null = null;
  private scale = 1;
  private frameScale = 1;
  private readonly clips = new Map<string, AnimTrack>();
  private state = '';
  private time = 0;
  private carrying = false;
  private idleClip = 'Idle';
  private workClip: string | null = null;
  private carryPace: 'walk' | 'run' = 'run';
  private action: Action | null = null;
  private socket: Entity | null = null;
  private hands: GraphNode[] = [];
  private readonly inverse = new Mat4();
  private readonly grip = new Vec3();
  private readonly facing = new Vec3();
  private faceTarget: Vec3 | null = null;
  private lastEvent: { name: string; clip: string; time: number } | null = null;
  get currentState() { return this.state; }
  get busy() { return this.action !== null; }
  get actionName() { return this.action?.name ?? null; }
  constructor(private readonly visual: Entity, private readonly placeholder: Entity) {}
  attach(model: Entity, animations: AnimTrack[], manifest: CharacterManifest, scale: number) {
    const tracks = new Map(animations.map(track => [track.name, track]));
    for (const clip of manifest.animations) {
      const track = tracks.get(clip.name);
      if (!track || Math.abs(track.duration - clip.duration_seconds) > .01) throw new Error('Missing or mismatched Arianna clip: ' + clip.name);
    }
    const hands = (manifest.hand_joints ?? ['hand.L', 'hand.R']).map(name => model.findByName(name)!).filter(Boolean);
    if (hands.length !== 2) throw new Error('Arianna hand joints are missing.');
    model.addComponent('anim', { activate: true });
    model.anim!.loadStateGraph(new AnimStateGraph({
      layers: [{ name: 'Base', states: [{ name: 'START' }, ...manifest.animations.map(clip => ({ name: clip.name, speed: 1, loop: clip.loop }))],
        transitions: [{ from: 'START', to: 'Idle' }] }], parameters: {},
    }));
    for (const clip of manifest.animations) model.anim!.assignAnimation(clip.name, tracks.get(clip.name)!, undefined, 1, clip.loop);
    this.model = model; this.manifest = manifest; this.scale = scale;
    for (const clip of manifest.animations) this.clips.set(clip.name, tracks.get(clip.name)!);
    this.hands = hands;
    this.state = ''; this.transition('Idle', 0);
  }
  bindCarrySocket(socket: Entity) { this.socket = socket; }
  setCarrying(value: boolean) { this.carrying = value; }
  setIdleClip(name: string) { this.idleClip = name; }
  setWorkClip(name: string|null, target?:Vec3) { this.workClip=name; this.faceTowards(target??null); }
  setCarryPace(value: 'walk' | 'run') { this.carryPace = value; }
  faceTowards(target: Vec3 | null) { this.faceTarget = target?.clone() ?? null; }
  /** Events use the imported clip clock, not guessed wall-clock delays. */
  playAction(name: string, fallbackDuration: number, commit?: () => void, target?: Vec3) {
    const duration = this.clips.get(name)?.duration ?? fallbackDuration;
    const eventTime = this.manifest?.interaction_events[name]?.[0]?.time_seconds ?? fallbackDuration / 2;
    const rate = name === 'PickUp' || name === 'PutDown' ? (this.manifest?.action_playback ?? 3) : 1;
    this.action = { name, elapsed: 0, duration, eventTime, rate, fired: false, commit };
    this.faceTarget = target?.clone() ?? null;
    if (this.model) { this.model.anim!.speed = rate; this.transition(name, .08); }
  }
  cancelAction() { this.action = null; this.faceTarget = null; }
  reset() {
    this.carrying = false; this.idleClip='Idle'; this.workClip=null; this.cancelAction(); this.state = ''; this.time = 0; this.lastEvent = null;
    this.placeholder.setLocalPosition(0, 0, 0); this.placeholder.setLocalEulerAngles(0, 0, 0);
    if (this.model) { this.model.anim!.speed = 1; this.transition('Idle', 0); }
  }
  private transition(name: string, seconds: number) {
    if (!this.model || !this.clips.has(name)) return;
    const layer = this.model.anim!.baseLayer!;
    const gaitBlend = ['Walk', 'Run', 'CarryWalk', 'CarryRun'].includes(this.state) && ['Walk', 'Run', 'CarryWalk', 'CarryRun'].includes(name);
    const phase = gaitBlend ? (layer.activeStateCurrentTime / layer.activeStateDuration) % 1 : undefined;
    // Component speed also scales blend clocks; preserve a short real-time blend.
    layer.transition(name, seconds * this.model.anim!.speed, phase);
    this.state = name;
  }
  update(dt: number, velocity: Vec3, frameDuration = dt) {
    this.frameScale = dt / Math.max(frameDuration, .001);
    const speed = velocity.length(), moving = speed > .03;
    this.facing.copy(velocity);
    if (this.faceTarget) this.facing.sub2(this.faceTarget, this.visual.getPosition());
    if (moving || this.faceTarget) {
      const target = Math.atan2(this.facing.x, this.facing.z) * math.RAD_TO_DEG;
      const current = Math.atan2(-this.visual.forward.x, -this.visual.forward.z) * math.RAD_TO_DEG;
      // Translation uses this frame's velocity; face it in the same frame, including reversals and wall slides.
      this.visual.setLocalEulerAngles(0, moving ? target : math.lerpAngle(current, target, 1 - Math.exp(-18 * dt)), 0);
    }
    const action = this.action;
    if (action) {
      action.elapsed = this.model ? this.model.anim!.baseLayer!.activeStateCurrentTime : action.elapsed + dt * action.rate;
      if (!action.fired && action.elapsed >= action.eventTime) {
        action.fired = true;
        this.lastEvent = { name: this.manifest?.interaction_events[action.name]?.[0]?.event ?? action.name, clip: action.name, time: action.elapsed };
        action.commit?.();
      }
      if (action.elapsed >= action.duration) this.cancelAction();
    }
    if (this.model) {
      const run = this.clips.has('Run') && speed > (this.state.includes('Run') ? 1.05 : 1.3);
      const gait = this.carrying ? (run && this.carryPace==='run' ? 'CarryRun' : 'CarryWalk') : run ? 'Run' : 'Walk';
      const desired = this.action?.name ?? this.workClip ?? (moving ? gait : this.carrying ? 'CarryIdle' : this.idleClip);
      const travel = this.manifest?.locomotion[desired]?.travel_speed_mps;
      // Presentation cadence is intentionally decoupled from the asset's tiny authored stride.
      // 7.5x/12.5x looked frantic in play. Keep a relaxed gait with analog-speed response.
      const cadence=this.manifest?.walk_playback ?? 1.5;
      this.model.anim!.speed = this.action?.rate ?? (travel ? Math.min(cadence, speed / (this.manifest?.walk_playback ? travel : 2.25) * cadence) * this.frameScale : 1);
      if (desired !== this.state) this.transition(desired, .14);
      if (this.socket && this.hands.length === 2) {
        this.grip.add2(this.hands[0].getPosition(), this.hands[1].getPosition()).mulScalar(.5);
        this.inverse.copy(this.visual.getWorldTransform()).invert().transformPoint(this.grip, this.grip);
        this.grip.z += .025;
        this.socket.setLocalPosition(this.grip);
      }
    } else {
      this.time += dt * (moving ? speed * 5 : 2);
      const celebrating = this.action?.name === 'Celebrate';
      this.placeholder.setLocalPosition(0, celebrating ? Math.abs(Math.sin(this.time * 5)) * .12 : moving ? Math.abs(Math.sin(this.time)) * .035 : 0, 0);
      this.placeholder.setLocalEulerAngles(this.action && !celebrating ? 12 : 0, 0, 0);
    }
  }
  snapshot() {
    return {
      state: this.state, busy: this.busy, action: this.actionName, clipTime: this.model?.anim?.baseLayer?.activeStateCurrentTime ?? 0,
      playbackRate: this.model?.anim?.speed ?? 1, frameScale: this.frameScale, scale: this.scale, groundY: this.model?.getPosition().y, lastEvent: this.lastEvent,
      clips: this.manifest?.animations, yaw: Math.atan2(-this.visual.forward.x, -this.visual.forward.z) * math.RAD_TO_DEG,
      hands: this.hands.map(hand => hand.getPosition().toArray()), socket: this.socket?.getPosition().toArray(),
      materials: this.model?.findComponents('render').flatMap(render => (render as RenderComponent).meshInstances.map(mesh => mesh.material.name)),
      feet: (this.manifest?.hand_joints ? ['LeftFoot','RightFoot','LeftToeBase','RightToeBase'] : ['foot.L', 'foot.R', 'toe.L', 'toe.R']).map(name => this.model?.findByName(name)?.getPosition().toArray()),
    };
  }
  /** Read-only CPU skinning for development QA; never called by the game loop. */
  geometrySnapshot() {
    const result: { vertices: number; joints: number; minY: number; maxY: number; leftSole: number; rightSole: number; vertexColors: boolean }[] = [];
    for (const render of this.model?.findComponents('render') ?? []) for (const instance of (render as RenderComponent).meshInstances) {
      const skin = instance.skinInstance;
      if (!skin) continue;
      const positions: number[] = [], joints: number[] = [], weights: number[] = [];
      const vertices = instance.mesh.getPositions(positions);
      instance.mesh.getVertexStream(SEMANTIC_BLENDINDICES, joints); instance.mesh.getVertexStream(SEMANTIC_BLENDWEIGHT, weights);
      const matrices = skin.bones.map((bone, i) => new Mat4().mul2(bone.getWorldTransform(), skin.skin.inverseBindPose[i]));
      let minY = Infinity, maxY = -Infinity, leftSole = Infinity, rightSole = Infinity;
      const source = new Vec3(), transformed = new Vec3(), world = new Vec3();
      for (let v = 0; v < vertices; v++) {
        source.set(positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]); world.set(0, 0, 0);
        let foot = '';
        for (let influence = 0; influence < 4; influence++) {
          const index = v * 4 + influence, weight = weights[index];
          if (!weight) continue;
          const joint = joints[index]; matrices[joint].transformPoint(source, transformed); world.add(transformed.mulScalar(weight));
          if (weight > .5 && /^(?:(foot|toe)\.|(?:Left|Right)(?:Foot|Toe))/.test(skin.bones[joint].name)) foot = skin.bones[joint].name;
        }
        minY = Math.min(minY, world.y); maxY = Math.max(maxY, world.y);
        if (foot.endsWith('.L')||foot.startsWith('Left')) leftSole = Math.min(leftSole, world.y);
        if (foot.endsWith('.R')||foot.startsWith('Right')) rightSole = Math.min(rightSole, world.y);
      }
      result.push({ vertices, joints: skin.bones.length, minY, maxY, leftSole, rightSole,
        vertexColors: Boolean((instance.material as unknown as { diffuseVertexColor: boolean }).diffuseVertexColor) });
    }
    return result;
  }
}
