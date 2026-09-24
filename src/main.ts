import {performanceSettings} from './ui/PerformanceSettings';
import {SCHOOL_REVIEW,OUTDOOR_REVIEW} from './systems/SaveNamespace';
import {createAudioSettings} from './ui/AudioSettings';
import {captureWorld} from './editor/LayoutBridge';
import {DogRoaming} from './game/DogRoaming';
import {HouseMusic} from './ui/HouseMusic';
import {loadSquishyArt} from './game/SquishyArt';
import { Application, Color, Entity, FILLMODE_NONE, RESOLUTION_AUTO, SHADOW_PCF3_32F, Vec3 } from 'playcanvas';
import { createHouse } from './game/house';
import { IsometricCamera } from './game/IsometricCamera';
import { createCharacter, loadArianna } from './components/CharacterVisual';
import { PlayerController } from './components/PlayerController';
import { RUN_SPEED, WALK_SPEED } from './components/MovementPace';
import { VirtualJoystick } from './ui/VirtualJoystick';
import { createHouseProps } from './game/houseProps';
import { CleanupGame } from './game/CleanupGame';
import { GameLoop } from './game/GameLoop';
import { HouseNavigation } from './ui/HouseNavigation';
import { Lilah } from './game/Lilah';
import { LilahTornado } from './game/LilahTornado';
import { Marc } from './game/Marc';
import './ui/styles.css';
import './ui/cleanup.css';
import './ui/collection.css';
import './ui/house.css';

export async function startGame(editorApp?:Application) {
  const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!;
  const app = editorApp ?? new Application(canvas, { graphicsDeviceOptions: { alpha: false, antialias: true, powerPreference: 'low-power' } });
  app.graphicsDevice.maxPixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
  app.setCanvasFillMode(FILLMODE_NONE);
  app.setCanvasResolution(RESOLUTION_AUTO);
  await loadSquishyArt(app);
  const ambientBase=editorApp?app.scene.ambientLight.clone():new Color(0.72, 0.68, 0.77);
  app.scene.ambientLight = ambientBase.clone();
  const sun = (editorApp?.root.findByTag('migration.sun')[0] as Entity) ?? new Entity('Soft afternoon sunlight', app);
  if(!sun.light) sun.addComponent('light', {
    type: 'directional', color: new Color(1, 0.92, 0.83), intensity: 1.2,
    castShadows: true, shadowResolution: 1024, shadowDistance: 35,
    shadowType: SHADOW_PCF3_32F, shadowBias: 0.2, normalOffsetBias: 0.04,
  });
  if(!editorApp)sun.setEulerAngles(48, -30, 0);
  const sunBase={intensity:sun.light!.intensity,color:sun.light!.color.clone()};
  if(!sun.parent)app.root.addChild(sun);
  sun.light!.mask = 9;
  const room = createHouse(app);
  const props = createHouseProps(app, room);
  const camera = new IsometricCamera(app,editorApp?.root.findByTag('migration.camera')[0] as Entity|undefined);
  const character = createCharacter(app);
  const joystick = new VirtualJoystick(document.querySelector('#joystick')!, document.querySelector('#joystick-knob')!);
  const controller = new PlayerController(character.player, camera.entity, room, joystick.value);
  const cleanup = new CleanupGame(app, character, props, camera.entity, () => { joystick.reset(); controller.reset(); }, controller, camera);
  const loop = new GameLoop(app, camera, character, room, props, cleanup, controller, joystick);
  const navigation = new HouseNavigation();
  const lilah = new Lilah(app,room,props.daily!);
  const marc = new Marc(app,room,props.daily!);
  const tornado = new LilahTornado(app,room,props,cleanup,loop,character,controller,camera,lilah);loop.tornado=tornado;
  const label = document.querySelector<HTMLElement>('#player-label')!;
  const screenPoint = new Vec3();
  const headPoint = new Vec3();
  const viewport = document.querySelector<HTMLElement>('#game')!;
  const resize = () => {
    // resizeCanvas writes inline dimensions; measure the containing viewport, not the canvas.
    const { width, height } = viewport.getBoundingClientRect();
    app.resizeCanvas(width, height);
    camera.resize(width, height);
    loop.resized();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(viewport);
  resize();
  const houseMusic=new HouseMusic();const destroyAudioSettings=createAudioSettings();const destroyPerformance=performanceSettings(app,()=>loop.popUI.isOpen||loop.developerPaused);
  const dogRoaming=new DogRoaming(room,props.pet!.dog,props.daily!);
  app.on('update', (elapsed: number) => {
    houseMusic.update({mode:loop.mode,phase:props.daily!.clock.state.phase,store:loop.mode==='store'?loop.store.definition.id:'',paused:loop.popUI.isOpen||loop.developerPaused||tornado.active,revealing:loop.opening.phase==='opening'},Math.min(elapsed,.1));
    const now = performance.now();
    if(loop.developerPaused||loop.popUI.isOpen||document.hidden)cleanup.audio.silence();
    if(loop.developerPaused){loop.developerTick(now,elapsed);return;}
    loop.beforeMovement(now);
    if(loop.popUI.isOpen)return;
    const bulky = cleanup.carry.item?.carryPace === 'walk';
    controller.speed = bulky ? WALK_SPEED * (['vacuum','scooper'].includes(cleanup.carry.item?.id??'') ? 1.5 : 1) : RUN_SPEED;
    character.animator.setCarryPace(bulky ? 'walk' : 'run');
    const night=cleanup.mode==='day'&&props.daily!.clock.state.phase==='night'&&loop.mode==='cleanup';
    const dt = document.hidden ? 0 : Math.min(elapsed, 0.04);
    room.lighting!.update(night,dt);
    const dusk = room.lighting!.nightAmount;
    sun.light!.intensity = sunBase.intensity*(1-.98/1.2*dusk);
    sun.light!.color.set(sunBase.color.r*(1-.28*dusk),sunBase.color.g*(1-.12/.92*dusk),sunBase.color.b*(1+.17/.83*dusk));
    app.scene.ambientLight.set(ambientBase.r*(1-.42/.72*dusk),ambientBase.g*(1-.36/.68*dusk),ambientBase.b*(1-.31/.77*dusk));
    if(loop.mode==='home')app.scene.ambientLight.set(.7,.68,.65);
    controller.update(dt);

    if (loop.mode !== 'home') camera.follow(character.player.getPosition(), dt);
    loop.update(now);
    tornado.update(document.hidden?0:Math.min(elapsed,.1));
    dogRoaming.update(dt,loop.mode==='cleanup'&&!tornado.active&&!!props.pet?.loaded,[character.player.getPosition(),lilah.root.getPosition(),marc.root.getPosition()]);
    props.pet?.dogAnimator?.update(dt);
    navigation.update(character.player.getPosition(), camera.entity, loop.mode === 'cleanup', cleanup.mode);
    character.grounding?.update();
    character.animator.update(dt, controller.velocity, elapsed);
    lilah.update(dt,elapsed,loop.mode==='cleanup'&&props.daily!.clock.state.phase!=='school',cleanup.mode==='day'&&!cleanup.movementLocked,character.player.getPosition(),camera.entity);
    marc.update(dt,elapsed,loop.mode==='cleanup'&&props.daily!.clock.state.phase!=='school',cleanup.mode==='day'&&!tornado.active,character.player.getPosition(),lilah.root.getPosition(),cleanup.activeInteractionId,camera.entity);
    headPoint.copy(character.player.getPosition());
    headPoint.y += 1.52;
    camera.entity.camera!.worldToScreen(headPoint, screenPoint);
    // worldToScreen is already expressed in CSS/client pixels in PlayCanvas.
    label.style.transform = `translate(${screenPoint.x - label.offsetWidth / 2}px, ${screenPoint.y - label.offsetHeight - 5}px)`;
  });
  await captureWorld(app,room,props,loop,!!editorApp);
  await Promise.all([loop.outdoors.ready,loop.fishing.ready]);loop.outdoors.installDoor();
  props.daily!.refresh();
  controller.setRoom(loop.mode==='store'?loop.store:loop.mode==='recess'?loop.recess:room);
  // A saved store visit starts before the authored layout is loaded. Reposition
  // at its edited entrance after binding, rather than the original generated one.
  if(editorApp&&loop.mode==='store'){
    character.player.setPosition(loop.store.exitAnchor.x,.09,loop.store.exitAnchor.z-.4);
    camera.reset();
  }
  if(OUTDOOR_REVIEW){loop.developerCommand('phase','morning');character.player.setPosition(-2.1,.09,8.2);}
  if(SCHOOL_REVIEW){
    loop.developerCommand('recess');
    if(new URLSearchParams(location.search).get('room')==='cafeteria')character.player.setPosition(4.6,.09,-14.8);
  }
  if(!editorApp)app.start();
  document.querySelector('#loading')!.remove();
  document.querySelector('#game')!.setAttribute('data-ready', 'true');
  void loadArianna(app, character).catch(error => console.warn('Keeping the Arianna placeholder:', error));

  // Read-only diagnostics for local playtests, excluded from production by Vite.
  if (import.meta.env.DEV) {
    Object.defineProperty(window, '__roomTest', { configurable: true, value: {
      characterGeometry: () => character.animator.geometrySnapshot(),
      nearbyGeometry:()=>app.root.findComponents('render').flatMap(r=>(r as import('playcanvas').RenderComponent).meshInstances.filter(m=>m.node.enabled&&m.aabb.center.distance(character.player.getPosition())<3).map(m=>({name:m.node.name,parent:m.node.parent?.name,center:m.aabb.center.toArray(),half:m.aabb.halfExtents.toArray()}))),
      furnitureGeometry:()=>['Art tableRound','Art loungeChairUpright','Art crib'].map(name=>{const n=app.root.findByName(name) as Entity|undefined;return{name,position:n?.getPosition().toArray(),meshes:n?.findComponents('render').flatMap(r=>(r as import('playcanvas').RenderComponent).meshInstances.map(m=>({center:m.aabb.center.toArray(),half:m.aabb.halfExtents.toArray()})))};}),
      lilahGeometry: () => lilah.geometry(),
      marcGeometry: () => marc.geometry(),
      snapshot: () => ({
        position: character.player.getPosition().toArray(),
        velocity: controller.velocity.toArray(), input: controller.input.toArray(),
        joystick: joystick.value.toArray(), cameraPosition: camera.entity.getPosition().toArray(),
        cameraAngles: camera.entity.getEulerAngles().toArray(), cameraHeight: camera.entity.camera!.orthoHeight,
        room: navigation.current,
        playerScreen: camera.entity.camera!.worldToScreen(character.player.getPosition()).toArray(),
        drawCalls: app.stats.drawCalls.total, fps: app.stats.frame.fps,
        resolution: [app.graphicsDevice.width, app.graphicsDevice.height],
        characterLoaded: !character.placeholder.enabled,
        houseArt: room.artStats?.(),
        walkable: room.walkable,
        cameraRight: camera.entity.right.toArray(), cameraForward: camera.entity.forward.toArray(),
        animationState: character.animator.currentState,
        character: character.animator.snapshot(),
        lilah: lilah.snapshot(),
        marc: marc.snapshot(),
        dog:props.pet?.dogAnimator?.snapshot(),dogRoaming:dogRoaming.snapshot(),houseMusic:houseMusic.snapshot(),
        lighting: room.lighting!.snapshot(),
        cleanup: cleanup.snapshot(),tornado:tornado.snapshot(),cameraState:camera.state,
        loop: loop.snapshot(),
        obstacles: room.obstacles.map(box => ({ center: box.center.toArray(), halfExtents: box.halfExtents.toArray() })),
      }),
    } });
  }
  let developerPanel:{destroy():void}|undefined;let disposed=false;
  void import('./dev/DeveloperPanel').then(({DeveloperPanel})=>{if(!disposed)developerPanel=new DeveloperPanel(loop,()=>({fps:app.stats.frame.fps,drawCalls:app.stats.drawCalls.total,position:character.player.getPosition().toArray()}));});
  if (import.meta.hot) import.meta.hot.dispose(() => {
    disposed=true;developerPanel?.destroy();houseMusic.destroy();destroyPerformance();destroyAudioSettings();
    observer.disconnect(); tornado.destroy(); marc.destroy(); lilah.destroy(); navigation.destroy(); loop.destroy(); cleanup.destroy(); joystick.destroy(); controller.destroy(); app.destroy();
    delete (window as unknown as Record<string, unknown>).__roomTest;
  });
}

if(!(window as any).__editorMode)void startGame().catch(error => {
  console.error('Unable to start the bedroom:', error);
  document.querySelector('#loading')?.remove();
  document.querySelector<HTMLElement>('#error')!.hidden = false;
});
