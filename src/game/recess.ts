import { BoundingBox, Entity, Vec3, type Application } from 'playcanvas';
import { TRADERS, definition, type TradingDay } from '../data/trading';
import { HouseArt } from './HouseArt';
import { createDumpling } from './dumplingVisual';
import { primitives, material } from './primitives';
import type { Bedroom } from './bedroom';

/** A tiny courtyard, three seats, and today's actual offers laid out on the table. */
export function createRecess(app: Application) {
  const root = new Entity('Recess trading table', app); app.root.addChild(root);
  const art = new HouseArt(app, root), shape = primitives(app, root);
  shape('Courtyard lawn', 'box', [0,-.2,0], [24,.2,24], material('Recess grass','#aabc90'));
  shape('Schoolyard paving', 'box', [0,-.06,1], [8,.12,9], material('Recess paving','#e3cdb5'));
  shape('School garden wall', 'box', [0,.35,-3], [8,.7,.15], material('School cream','#f0e1cf'));
  const offers = new Entity('Squishies on the table', app); root.addChild(offers);
  const seats = TRADERS.map((trader, i) => {
    const x = (i-1)*1.75;
    art.add('furniture','tableCoffee',[x,0,0],.65);
    art.add('furniture','chairCushion',[x,0,-1.15],.85,180,'height',{carpet:trader.color});
    // Small placeholder schoolmates; the supplied Arianna and Lilah assets are untouched.
    const shirt = material(trader.name+' shirt',trader.color), skin = material(trader.name+' skin',['#c9916d','#e7b898','#ae785b'][i]);
    shape(trader.name+' body','capsule',[x,.89,-1.1],[.47,.57,.35],shirt);
    shape(trader.name+' head','sphere',[x,1.34,-1.08],[.43,.46,.42],skin);
    shape(trader.name+' hair','sphere',[x,1.49,-1.12],[.46,.26,.43],material(trader.name+' hair',['#534354','#745140','#393746'][i]));
    const ink = material(trader.name+' eyes','#493a49');
    for (const side of [-1,1]) {
      shape(trader.name+' eye','sphere',[x+side*.085,1.35,-.88],[.04,.045,.025],ink);
      shape(trader.name+' arm','capsule',[x+side*.25,.89,-.9],[.14,.38,.14],skin);
    }
    const glow = shape('Trading spot','cylinder',[x,.012,1.5],[.85,.025,.85],material(trader.name+' cue',trader.color),false);
    return { id:trader.id, anchor:new Vec3(x,0,1.5), glow };
  });
  art.add('nature','tree_oak',[-4,0,-2],3.8); art.add('nature','tree_oak',[4.5,0,-1],3.5);
  art.add('furniture','benchCushion',[-3,0,3.6],.7,90);
  const room: Bedroom = { root, halfWidth:3.6, halfDepth:4.7,
    walkable:[{minX:-3.6,maxX:3.6,minZ:-2.3,maxZ:5}],
    obstacles:[new BoundingBox(new Vec3(0,0,-.3),new Vec3(2.6,1,1.25)),new BoundingBox(new Vec3(-3,0,3.6),new Vec3(.45,1,.8))],
    ready:art.finish(), artStats:()=>art.snapshot() };
  root.enabled = false;
  const sync = (day: TradingDay) => {
    for (const child of [...offers.children]) child.destroy();
    TRADERS.forEach((trader,i) => { if(day.traders[trader.id].done)return;
      day.traders[trader.id].offer.forEach((id,j) => {
        const model=createDumpling(app,offers,definition(id));model.setLocalScale(.3,.3,.3);model.setLocalPosition((i-1)*1.75+(j-1)*.36,.65,.15);
      });
    });
  };
  return {...room,seats,sync};
}
