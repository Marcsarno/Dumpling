import { Entity, type Application } from 'playcanvas';
import type { DumplingDefinition } from '../data/collection';
import { squishyModel, steamerModel } from './SquishyArt';

/** Original Blender assets; presentation changes do not touch collectible receipts. */
export function createBlindBox(app: Application, parent: Entity, compact=false) {
  const root = new Entity('Bamboo surprise steamer', app); parent.addChild(root);
  const model=steamerModel(app,compact);root.addChild(model);
  const lid=compact?new Entity('Static shelf lid',app):model.findByName('LidHinge') as Entity;
  if(compact)root.addChild(lid);
  return {root,lid};
}
export function createDumpling(app: Application, parent: Entity, data: DumplingDefinition) {
  const root=new Entity(data.name,app);parent.addChild(root);root.addChild(squishyModel(app,data));return root;
}
export function dumplingPortrait(data: DumplingDefinition, locked: boolean) {
  if(!locked)return `${import.meta.env.BASE_URL}assets/squishies/portraits/${data.id}.webp`;
  return `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M14 62C11 43 27 31 39 24C37 17 44 14 48 20C48 12 57 12 59 20C66 14 72 21 68 27C81 36 90 48 88 65C84 89 17 90 14 62Z" fill="#d8d1df"/><g fill="none" stroke="#c7bed0" stroke-width="2" stroke-linecap="round"><path d="M43 26Q33 39 28 47M54 25Q52 38 57 47M65 29Q71 37 76 43"/></g><text x="51" y="66" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="bold" fill="#fff">?</text></svg>')}`;
}