import { BoundingBox, Entity, Vec3, type Application } from 'playcanvas';
import { TRADERS, definition, type TradingDay } from '../data/trading';
import { HouseArt } from './HouseArt';
import { createDumpling } from './dumplingVisual';
import { primitives, material } from './primitives';
import type { Bedroom } from './bedroom';
import {SurfaceTextures} from './SurfaceTextures';
import {Classmates,classroomSign} from './Classmates';

/** A classroom, three seated classmates, and today's actual offers on their desks. */
export function createRecess(app: Application) {
  const root = new Entity('Classroom trading club', app); app.root.addChild(root);
  const surfaces=new SurfaceTextures(app),art = new HouseArt(app, root,surfaces), shape = primitives(app, root);
  const floor=material('Classroom pale blue terrazzo','#cbdfe0');surfaces.apply(floor,'terrazzo',10);
  shape('Classroom floor', 'box', [0,-.06,0], [8,.12,11],floor);
  const wall=material('Classroom warm ivory','#f4ebce'),rail=material('Classroom teal','#70a9a5');
  shape('Classroom back wall','box',[0,1.55,-5.2],[8,3.1,.16],wall);
  shape('Classroom side wall','box',[-4,1.55,0],[.16,3.1,10.5],wall);
  shape('Classroom wall rail','box',[0,.6,-5.08],[8,.12,.08],rail);
  art.add('school','blackboard',[.1,1.05,-4.95],3.2,0,'width');
  art.add('school','bulletin-board',[-3.85,1.25,-2.8],1.5,90,'width');
  const schoolColors={wood:'#89b8b2',woodDark:'#49797e',carpet:'#e5b45f',metal:'#556c79'};
  art.add('furniture','desk',[1.5,.02,-3.9],.88,180,'height',schoolColors,false,0,'paint');
  art.add('furniture','chairDesk',[1.5,0,-4.65],.95,0,'height',schoolColors,false,0,'paint');
  art.add('furniture','books',[1.5,.91,-3.9],.22);
  art.add('furniture','bookcaseOpen',[-3.35,.02,-4.2],1.7,90,'height',schoolColors,false,0,'paint');
  art.add('furniture','books',[-3.25,.8,-4.2],.25);
  art.add('furniture','coatRackStanding',[-3.3,0,2.6],1.5,0,'height',schoolColors,false,0,'paint');
  art.add('furniture','trashcan',[3.3,0,-4.6],.55,0,'height',{metal:'#679899'});
  art.add('furniture','pottedPlant',[3.3,0,-2.8],.9);
  const offers = new Entity('Squishies on the table', app); root.addChild(offers);
  const seats = TRADERS.map((trader, i) => {
    const x = (i-1)*1.75;
    art.add('furniture','desk',[x,0,0],.78,0,'height',schoolColors,false,0,'paint');
    art.add('furniture','chairDesk',[x,0,-.75],.78,180,'height',{...schoolColors,carpet:trader.color},false,0,'paint');
    art.add('furniture','books',[x-.35,.80,-.1],.14);
    const glow = shape('Trading spot','cylinder',[x,.012,1.5],[.85,.025,.85],material(trader.name+' cue',trader.color),false);
    return { id:trader.id, anchor:new Vec3(x,0,1.5), glow };
  });
  const classmates=new Classmates(app,root);
  classroomSign(app,root,'Class kindness poster','BE KIND\nSHARE A SMILE',[-2.35,2.15,-5.05],1.55,.65,'#518d89');
  classroomSign(app,root,'Trading club board','TRADING CLUB\nBring extras. Make friends.',[.2,2.25,-4.91],2.75,.7,'#496d61');
  const clock=shape('Classroom clock','cylinder',[2.8,2.5,-5.02],[.52,.035,.52],wall);clock.setLocalEulerAngles(90,0,0);
  shape('Clock minute hand','box',[2.8,2.58,-4.99],[.025,.20,.025],rail);shape('Clock hour hand','box',[2.86,2.5,-4.98],[.15,.025,.025],rail);
  art.add('furniture','benchCushion',[-3,0,3.6],.7,90,'height',schoolColors,false,0,'paint');
  const room: Bedroom = { root, halfWidth:3.6, halfDepth:4.7,
    walkable:[{minX:-3.6,maxX:3.6,minZ:-2.3,maxZ:5}],
    obstacles:[new BoundingBox(new Vec3(0,0,-.3),new Vec3(2.6,1,1.25)),new BoundingBox(new Vec3(-3,0,3.6),new Vec3(.45,1,.8))],
    ready:Promise.all([art.finish(),classmates.ready]).then(()=>{}), artStats:()=>({...art.snapshot(),classmates:classmates.snapshot()}) };
  root.enabled = false;
  const sync = (day: TradingDay) => {
    classmates.sync(day);
    for (const child of [...offers.children]) child.destroy();
    TRADERS.forEach((trader,i) => { if(day.traders[trader.id].done)return;
      day.traders[trader.id].offer.forEach((id,j) => {
        const model=createDumpling(app,offers,definition(id));model.setLocalScale(.3,.3,.3);model.setLocalPosition((i-1)*1.75+(j-1)*.36,.80,.15);
      });
    });
  };
  return {...room,seats,sync,update:(dt:number,focus:string)=>classmates.update(dt,focus)};
}
