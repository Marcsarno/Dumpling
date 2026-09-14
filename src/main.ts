import { Application, Color, Entity, FILLMODE_NONE, RESOLUTION_AUTO, SHADOW_PCF3_32F, Vec3 } from 'playcanvas';
import { createHouse } from './game/house';
import { IsometricCamera } from './game/IsometricCamera';
import { createCharacter, loadArianna } from './components/CharacterVisual';
import { PlayerController } from './components/PlayerController';
import { VirtualJoystick } from './ui/VirtualJoystick';
import { createHouseProps } from './game/houseProps';
import { CleanupGame } from './game/CleanupGame';
import { GameLoop } from './game/GameLoop';
import { HouseNavigation } from './ui/HouseNavigation';
import './ui/styles.css';
import './ui/cleanup.css';
import './ui/collection.css';
import './ui/house.css';

function start() {
  const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!;
  const app = new Application(canvas, { graphicsDeviceOptions: { alpha: false, antialias: true, powerPreference: 'low-power' } });
  app.graphicsDevice.maxPixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
  app.setCanvasFillMode(FILLMODE_NONE);
  app.setCanvasResolution(RESOLUTION_AUTO);
  app.scene.ambientLight = new Color(0.72, 0.68, 0.77);
  const sun = new Entity('Soft afternoon sunlight', app);
  sun.addComponent('light', {
    type: 'directional', color: new Color(1, 0.92, 0.83), intensity: 1.2,
    castShadows: true, shadowResolution: 1024, shadowDistance: 35,
    shadowType: SHADOW_PCF3_32F, shadowBias: 0.2, normalOffsetBias: 0.04,
  });
  sun.setEulerAngles(48, -30, 0);
  app.root.addChild(sun);
  const room = createHouse(app);
  const props = createHouseProps(app, room);
  const camera = new IsometricCamera(app);
  const character = createCharacter(app);
  const joystick = new VirtualJoystick(document.querySelector('#joystick')!, document.querySelector('#joystick-knob')!);
  const controller = new PlayerController(character.player, camera.entity, room, joystick.value);
  const cleanup = new CleanupGame(app, character, props, camera.entity, () => { joystick.reset(); controller.reset(); });
  const loop = new GameLoop(app, camera, character, room, props, cleanup, controller, joystick);
  const navigation = new HouseNavigation();
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
  app.on('update', (elapsed: number) => {
    const now = performance.now();
    loop.beforeMovement(now);
    const dt = document.hidden ? 0 : Math.min(elapsed, 0.04);
    controller.update(dt);
    if (loop.mode === 'cleanup') camera.follow(character.player.getPosition(), dt);
    loop.update(now);
    navigation.update(character.player.getPosition(), camera.entity, loop.mode === 'cleanup', cleanup.mode);
    character.animator.update(dt, controller.velocity);
    headPoint.copy(character.player.getPosition());
    headPoint.y += 1.52;
    camera.entity.camera!.worldToScreen(headPoint, screenPoint);
    // worldToScreen is already expressed in CSS/client pixels in PlayCanvas.
    label.style.transform = `translate(${screenPoint.x - label.offsetWidth / 2}px, ${screenPoint.y - label.offsetHeight - 5}px)`;
  });
  app.start();
  document.querySelector('#loading')!.remove();
  document.querySelector('#game')!.setAttribute('data-ready', 'true');
  void loadArianna(app, character).catch(error => console.warn('Keeping the Arianna placeholder:', error));

  // Read-only diagnostics for local playtests, excluded from production by Vite.
  if (import.meta.env.DEV) {
    Object.defineProperty(window, '__roomTest', { configurable: true, value: {
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
        animationState: character.animator.currentState,
        cleanup: cleanup.snapshot(),
        loop: loop.snapshot(),
        obstacles: room.obstacles.map(box => ({ center: box.center.toArray(), halfExtents: box.halfExtents.toArray() })),
      }),
    } });
  }
  if (import.meta.hot) import.meta.hot.dispose(() => {
    observer.disconnect(); navigation.destroy(); loop.destroy(); cleanup.destroy(); joystick.destroy(); controller.destroy(); app.destroy();
    delete (window as unknown as Record<string, unknown>).__roomTest;
  });
}

try { start(); } catch (error) {
  console.error('Unable to start the bedroom:', error);
  document.querySelector('#loading')?.remove();
  document.querySelector<HTMLElement>('#error')!.hidden = false;
}
