import { Entity, Color, PROJECTION_ORTHOGRAPHIC, Vec3, type Application } from 'playcanvas';

export class IsometricCamera {
  readonly entity: Entity;
  private readonly offset = new Vec3();
  private readonly desired = new Vec3();
  constructor(app: Application) {
    this.entity = new Entity('Following isometric camera', app);
    this.entity.addComponent('camera', {
      projection: PROJECTION_ORTHOGRAPHIC,
      orthoHeight: 7,
      nearClip: 0.1,
      farClip: 60,
      clearColor: new Color().fromString('#ede6f4'),
    });
    this.entity.setPosition(10, 15, 13);
    this.entity.lookAt(new Vec3(0, 0.8, 0));
    app.root.addChild(this.entity);
  }
  resize(width: number, height: number) {
    const aspect = width / height;
    // Fit the 9.9-unit projected room width on phones, with a stable angle on every screen.
    // Following changes translation only. Room changes never alter angle or readable player scale.
    this.entity.camera!.orthoHeight = Math.max(9, 5.15 / aspect);
    if (aspect < 1 && height < 740) this.entity.camera!.orthoHeight = Math.max(10.7, 5.15 / aspect);
    if (aspect > 1.35 && height < 600) this.entity.camera!.orthoHeight = 5.5;
  }
  follow(player: Vec3, dt: number) {
    this.desired.set(player.x, 0, player.z - .9);
    this.offset.lerp(this.offset, this.desired, 1 - Math.exp(-6 * dt));
    this.entity.setPosition(10 + this.offset.x, 15, 13 + this.offset.z);
  }
  reset() { this.offset.set(0, 0, 0); this.entity.setPosition(10, 15, 13); }
}
