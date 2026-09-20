import { Color, Entity, StandardMaterial, type Application } from 'playcanvas';
import {recordLayout} from '../editor/LayoutBridge';

export type Shape = 'box' | 'sphere' | 'cylinder' | 'capsule' | 'cone';
export type Triple = [number, number, number];

export function material(name: string, hex: string): StandardMaterial {
  const mat = new StandardMaterial();
  mat.name = name;
  mat.diffuse = new Color().fromString(hex);
  mat.gloss = 0.15;
  mat.specular.set(0.08, 0.07, 0.09);
  mat.update();
  return mat;
}

/** A small construction helper; everything it creates is a normal PlayCanvas entity. */
export function primitives(app: Application, parent: Entity, batchGroupId = -1) {
  return (name: string, shape: Shape, position: Triple, scale: Triple, mat: StandardMaterial, shadows = true) => {
    const entity = new Entity(name, app);
    entity.addComponent('render', { type: shape, material: mat, castShadows: shadows, receiveShadows: true, batchGroupId });
    entity.setLocalPosition(...position);
    entity.setLocalScale(...scale);
    parent.addChild(entity);
    recordLayout(entity,parent);
    return entity;
  };
}
