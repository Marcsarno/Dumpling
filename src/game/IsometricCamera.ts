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
    this.entity.setPosition(6, 14, 18.9);
    this.entity.lookAt(new Vec3(0, .8, .9));
    app.root.addChild(this.entity);
  }
  resize(width: number, height: number) {
    const aspect = width / height;
    // Show a readable slice of the home, instead of fitting its entire width into a phone.
    this.entity.camera!.orthoHeight = aspect < 1 ? Math.max(5.1, 2.65 / aspect) : 5.1;
  }
  follow(player: Vec3, dt: number) {
    this.desired.set(player.x, 0, player.z - .9);
    this.offset.lerp(this.offset, this.desired, 1 - Math.exp(-10 * dt));
    this.entity.setPosition(6 + this.offset.x, 14, 18.9 + this.offset.z);
  }
  reset() { this.offset.set(0, 0, 0); this.entity.setPosition(6, 14, 18.9); }
}
