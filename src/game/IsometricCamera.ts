import { Entity, Color, PROJECTION_ORTHOGRAPHIC, Vec3, type Application } from 'playcanvas';

export class IsometricCamera {
  readonly entity: Entity;
  constructor(app: Application) {
    this.entity = new Entity('Fixed isometric camera', app);
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
    // Camera stays fixed during movement; only viewport changes affect framing.
    this.entity.camera!.orthoHeight = Math.max(5.85, 5.15 / aspect);
    if (aspect > 1.35 && height < 600) this.entity.camera!.orthoHeight = 5.5;
  }
}
