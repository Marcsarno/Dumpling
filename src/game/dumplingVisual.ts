import { Entity, type Application } from 'playcanvas';
import { material, primitives } from './primitives';
import type { DumplingDefinition } from '../data/collection';

/** Replace these visual factories with container assets without changing purchases or reveals. */
export function createBlindBox(app: Application, parent: Entity) {
  const root = new Entity('Sealed dumpling box', app); parent.addChild(root);
  const shape = primitives(app, root);
  const pink = material('Box blush', '#eaa9c9'), cream = material('Box ribbon', '#fff1dd');
  shape('Box', 'box', [0, .38, 0], [.72, .72, .72], pink);
  shape('Ribbon', 'box', [0, .39, .366], [.12, .69, .02], cream);
  const lid = shape('Lid', 'box', [0, .78, 0], [.8, .13, .8], material('Lilac lid', '#bea5dc'));
  shape('Surprise seal', 'sphere', [.18, .4, .38], [.19, .19, .04], cream);
  return { root, lid };
}
export function createDumpling(app: Application, parent: Entity, data: DumplingDefinition) {
  const root = new Entity(data.name, app); parent.addChild(root);
  const shape = primitives(app, root), body = material(data.name, data.color), accent = material(`${data.name} accent`, data.accent);
  const ink = material('Dumpling face', '#584465');
  root.on('destroy', () => { body.destroy(); accent.destroy(); ink.destroy(); });
  shape('Soft dumpling', 'sphere', [0, .42, 0], [1.05, .8, .83], body);
  for (const x of [-.19, 0, .19]) {
    const fold = shape('Dough pleat', 'capsule', [x, .77, 0], [.12, .3, .17], body);
    fold.setLocalEulerAngles(0, 0, -x * 90);
  }
  for (const x of [-.19, .19]) {
    const sleepy = data.face === 'sleepy' || (data.face === 'wink' && x > 0);
    shape('Eye', 'sphere', [x, .48, .383], [sleepy ? .105 : .065, sleepy ? .024 : .085, .04], ink, false);
    shape('Rosy cheek', 'sphere', [x * 1.55, .36, .343], [.14, .065, .025], accent, false);
  }
  shape('Smile', 'sphere', [0, .365, .406], [.09, .055, .025], ink, false);
  if (data.accessory === 'leaf') {
    const leaf = shape('Little leaf', 'sphere', [.2, .85, 0], [.35, .075, .17], accent); leaf.setLocalEulerAngles(0, 0, 30);
  } else if (data.accessory === 'bow') {
    for (const x of [-.1, .1]) shape('Bow loop', 'sphere', [.3 + x, .76, .13], [.23, .17, .13], accent);
  } else if (data.accessory === 'star' || data.accessory === 'crown') {
    for (const x of [-.16, 0, .16]) shape('Crown point', 'cone', [x, .92 + (x === 0 ? .06 : 0), 0], [.17, .28, .17], accent);
  }
  return root;
}

export function dumplingPortrait(data: DumplingDefinition, locked: boolean) {
  const color = locked ? '#d8d1df' : data.color, accent = locked ? '#d8d1df' : data.accent;
  const eyes = data.face === 'sleepy' ? '<path d="M34 48h7m18 0h7"/>' : '<ellipse cx="37" cy="48" rx="2.5" ry="3.5"/><ellipse cx="63" cy="48" rx="2.5" ry="3.5"/>';
  const accessory = data.accessory === 'none' ? '' : data.accessory === 'leaf' ? '<ellipse cx="64" cy="25" rx="12" ry="4" transform="rotate(-25 64 25)"/>' : data.accessory === 'bow' ? '<path d="M66 26l-10-7v15l10-6 10 6V19z"/>' : '<path d="M38 27l-2-14 10 7 4-12 5 12 10-7-2 14z"/>';
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90"><ellipse cx="50" cy="76" rx="32" ry="5" fill="#655477" opacity=".08"/><path d="M18 55c0-18 12-29 23-30l-1-11 10 10 7-13 3 16c16 4 23 15 23 28 0 26-65 26-65 0" fill="${color}"/><g fill="${accent}">${accessory}</g>${locked ? '<text x="50" y="61" text-anchor="middle" font-size="27" fill="#fff">?</text>' : `<g fill="#584465" stroke="#584465" stroke-width="2" stroke-linecap="round">${eyes}<path d="M46 57q4 5 8 0" fill="none"/></g><g fill="${accent}"><ellipse cx="28" cy="56" rx="6" ry="3"/><ellipse cx="72" cy="56" rx="6" ry="3"/></g>`}</svg>`)}`;
}
