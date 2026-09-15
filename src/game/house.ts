import { BoundingBox, Entity, Vec3, type Application } from 'playcanvas';
import { HOUSE_DOORS, HOUSE_ROOMS } from '../data/house';
import { createBedroom, type Bedroom } from './bedroom';
import { material, primitives, type Triple } from './primitives';
import { HouseArt } from './HouseArt';
import { HouseLighting } from './HouseLighting';
import { SurfaceTextures } from './SurfaceTextures';

/** A continuous, deep cottage with short private circulation and connected family spaces. */
export function createHouse(app: Application): Bedroom {
  const bedroom = createBedroom(app), m = bedroom.materials!;
  const surfaces = new SurfaceTextures(app);
  surfaces.apply(m.wood,'wood');surfaces.apply(m.rug,'rug');
  const root = new Entity('Maple cottage', app); app.root.addChild(root); bedroom.root.reparent(root);
  const obstacles = bedroom.obstacles;
  const group = app.batcher.addGroup('Cottage architecture', false, 14);
  const makeShape = primitives(app, root, group.id);
  let exterior = false;
  const shape: typeof makeShape = (...args) => {
    const entity = makeShape(...args);
    for(const mesh of entity.render!.meshInstances) mesh.mask = exterior ? 8 : 1;
    return entity;
  };
  const art = new HouseArt(app, root, surfaces);
  const block = (x: number, z: number, w: number, d: number) => obstacles.push(new BoundingBox(new Vec3(x,.7,z),new Vec3(w/2,1.4,d/2)));
  const box = (name: string,x: number,y: number,z: number,w: number,h: number,d: number,mat=m.trim) => shape(name,'box',[x,y,z],[w,h,d],mat);
  const oval = (name: string,x: number,y: number,z: number,w: number,h: number,d: number,mat=m.rug) => shape(name,'cylinder',[x,y,z],[w,h,d],mat,false);
  function furniture(name: string, x: number,z: number,size: number,yaw=0,dimension: 'height'|'width'='height',foot?: [number,number],y=.027,colors: Record<string,string>={}) {
    art.add('furniture',name,[x,y,z],size,yaw,dimension,colors,exterior); if(foot)block(x,z,...foot);
  }
  const oak = material('Cottage oak boards','#dec69e'), tile=material('Warm checker stone','#d9dcd1'), grout=material('Stone grout','#eeeadd');
  const sage=material('Kitchen sage paint','#aebea9'), blue=material('Bathroom powder paint','#cadce0');
  const grass=material('Garden lawn','#9db77d'), grassDark=material('Lawn edge','#8ea66d'), path=material('Garden limestone','#d4c8ac');
  const asphalt=material('Warm driveway gravel','#afa698'), soil=material('Flower bed earth','#9a8265');

  for(const room of HOUSE_ROOMS.filter(room=>room.id!=='bedroom')){
    const w=room.maxX-room.minX,d=room.maxZ-room.minZ,x=(room.maxX+room.minX)/2,z=(room.maxZ+room.minZ)/2;
    box(room.name+' foundation',x,-.17,z,w,.32,d,m.wood);
    box(room.name+' floor',x,-.025,z,w,.1,d,room.id==='bathroom'||room.id==='laundry'?tile:oak);
    if(room.id==='bathroom'||room.id==='laundry'){
      for(let a=room.minX+.05;a<room.maxX;a+=.6)box('Tile grout',a,.029,z,.013,.006,d,grout);
      for(let b=room.minZ+.05;b<room.maxZ;b+=.6)box('Tile grout',x,.029,b,w,.006,.013,grout);
    } else {
      for(let b=room.minZ+.05;b<room.maxZ;b+=.38){
        box('Oak board seam',x,.029,b,w,.005,.009,m.seam);
        for(let a=room.minX+.5+((Math.round(b*10)%3)*.4);a<room.maxX;a+=1.9)box('Oak board end',a,.031,b+.19,.009,.003,.36,m.seam);
      }
    }
  }
  function wall(axis:'x'|'z',fixed:number,from:number,to:number,height=.48,mat=m.sideWall){
    const gaps=HOUSE_DOORS.filter(d=>d.axis===axis&&Math.abs((axis==='x'?d.z:d.x)-fixed)<.01)
      .map(d=>({a:(axis==='x'?d.x:d.z)-d.width/2,b:(axis==='x'?d.x:d.z)+d.width/2}))
      .filter(d=>d.b>from&&d.a<to).sort((a,b)=>a.a-b.a);
    function segment(a:number,b:number){
      if(b-a<.01)return;
      const x=axis==='x'?(a+b)/2:fixed,z=axis==='z'?(a+b)/2:fixed,w=axis==='x'?b-a:.14,d=axis==='z'?b-a:.14;
      box('Painted cottage wall',x,height/2,z,w,height,d,mat);
      box('Ivory wall cap',x,height+.025,z,w+.035,.05,d+.035,m.trim);
      box('Cottage skirting',x,.12,z,w+.035,.16,d+.035,m.trim);
      block(x,z,w,d);
    }
    let cursor=from;for(const gap of gaps){segment(cursor,Math.max(cursor,gap.a));cursor=Math.max(cursor,gap.b);}segment(cursor,to);
  }
  // Far exterior walls provide a backdrop. Foreground/internal walls are intentional cutaways.
  wall('z',3.3,-3.6,3.6); wall('x',.4,3.3,6.5);
  wall('x',3.6,-3.3,6.5); wall('x',9.5,-3.3,6.5);
  wall('z',2.6,9.5,13.2); wall('x',13.2,2.6,6.5);
  wall('x',16.3,-3.3,2.6); wall('z',2.6,13.2,16.3);
  wall('z',6.5,-3.6,13.2);
  wall('x',-3.6,3.3,6.5,2.65,blue);
  wall('z',-3.3,3.6,9.5,2.65,m.wall); wall('z',-3.3,9.5,16.3,2.65,sage);
  block(-3.35,0,.15,7.3);block(0,-3.65,6.8,.15);
  for(const door of HOUSE_DOORS){
    box('Flush doorway threshold',door.x,.026,door.z,door.axis==='x'?door.width:.17,.012,door.axis==='z'?door.width:.17,m.trim);
    for(const side of [-1,1])box('Door frame cutaway',door.x+(door.axis==='x'?side*door.width/2:0),.46,door.z+(door.axis==='z'?side*door.width/2:0),.15,.92,.15,m.trim);
  }
  function windowOnLeft(z:number,w=1.8){
    box('Garden window frame',-3.18,1.85,z,.12,1.35,w,m.trim);
    box('Garden window glass',-3.1,1.85,z,.018,1.16,w-.18,m.sky);
    box('Window middle',-3.07,1.85,z,.03,1.18,.055,m.trim);
    box('Window cross',-3.07,1.85,z,.03,.055,w-.13,m.trim);
    box('Deep window sill',-3.01,1.14,z,.42,.08,w+.1,m.trim);
    for(const dz of [-w/2-.14,w/2+.14])box('Linen curtain',-3.02,1.82,z+dz,.16,1.63,.27,m.pinkLight);
  }
  windowOnLeft(5.9,2.25);windowOnLeft(11.45,2.0);
  // Front entry on the side of the shared living room; the porch connects to the driveway outside.
  box('Front door timber',-3.19,1.15,8.25,.09,2.2,.94,m.wood);
  box('Front door inset',-3.12,1.48,8.25,.03,.85,.67,m.sky);
  shape('Door brass handle','sphere',[-3.075,1.0,7.92],[.08,.08,.08],m.yellow);
  for(const z of [7.7,8.8])box('Entry door casing',-3.1,1.17,z,.19,2.34,.09,m.trim);
  box('Entry lintel',-3.1,2.32,8.25,.19,.09,1.19,m.trim);

  // Landing is a small furnished room, not a corridor through the house.
  furniture('benchCushion',5.85,2.5,1.15,-90,'width',[.55,1.15],.027,{carpet:'#b9a7cd'});
  furniture('coatRackStanding',3.8,1.0,1.55,0,'height',[.4,.4]);
  furniture('sideTableDrawers',5.8,1.1,.72,0,'height',[.75,.45]);
  furniture('plantSmall1',5.8,1.1,.28,0,'height',undefined,.76);
  furniture('lampRoundFloor',6.1,3.28,1.8,0,'height',[.35,.35]);
  oval('Landing rug',4.7,.054,2.15,1.75,.025,1.55,m.rug);
  box('Mail tray',5.55,.8,1.1,.42,.08,.3,m.wood);

  // Living room: sofa and coffee table, television, and a separate reading nook.
  furniture('loungeSofa',-2.3,6.05,3.05,90,'width',[1.2,3.05]);
  furniture('tableCoffee',-.48,6.3,1.3,0,'width',[1.3,.75]);
  furniture('books',-.58,6.3,.34,0,'width',undefined,.54);
  furniture('plantSmall2',-.15,6.3,.23,0,'height',undefined,.54);
  const livingRug = material('Living oatmeal rug','#dbbf9e');surfaces.apply(livingRug,'rug');
  oval('Living rug',-.9,.052,6.2,4.0,.025,4.2,livingRug);
  for(const z of [4.7,7.7])box('Rug woven border',-.9,.067,z,3.2,.004,.035,m.trim);
  furniture('cabinetTelevision',2.0,4.2,1.8,0,'width',[1.8,.6]);
  furniture('televisionModern',2.0,4.2,1.28,0,'width',undefined,.68,{metal:'#718d91'});
  furniture('loungeChairRelax',4.5,7.35,1.0,-35,'height',[1.1,1.1],.027,{carpet:'#d9b7c3'});
  furniture('lampRoundFloor',5.65,7.7,1.8,0,'height',[.35,.35]);
  furniture('sideTable',5.65,6.6,.55,0,'height',[.5,.5]);
  furniture('radio',5.65,6.6,.32,0,'width',undefined,.61);
  furniture('bookcaseOpenLow',5.95,4.9,1.45,-90,'width',[.6,1.45]);
  furniture('books',5.95,4.9,.65,-90,'width',undefined,1.03);
  furniture('pottedPlant',5.9,8.75,1.1,0,'height',[.5,.5]);
  oval('Reading rug',4.7,.053,7.3,2.5,.025,2.5,m.rug);
  box('Living toy basket',1.95,.24,8.55,.82,.43,.6,m.wood);block(1.95,8.55,.82,.6);
  box('Basket fabric lining',1.95,.465,8.55,.75,.035,.54,m.pinkLight);
  furniture('bear',2.13,8.55,.28,0,'height',undefined,.48);

  // Kitchen has a working wall and an actual dining table, with clear circulation between them.
  furniture('kitchenCabinetDrawer',-2.72,10.25,1.0,90,'height',[.95,1.1]);
  furniture('kitchenSink',-2.72,11.45,1.0,90,'height',[.95,1.2]);
  furniture('kitchenStove',-2.72,12.65,1.0,90,'height',[.95,1.1]);
  furniture('kitchenFridge',-2.65,14.55,1.85,90,'height',[1.05,1.05]);
  furniture('kitchenCabinetUpperDouble',-2.98,10.25,.57,90,'height',undefined,1.75);
  furniture('hoodModern',-2.98,12.65,.5,90,'height',undefined,1.75);
  furniture('kitchenCoffeeMachine',-2.63,10.1,.36,90,'height',undefined,1.05);
  furniture('toaster',-2.65,10.55,.23,90,'height',undefined,1.05);
  furniture('tableRound',.55,13.85,1.75,0,'width',[1.65,1.65]);
  for(const [x,z,yaw] of [[.55,12.55,0],[.55,15.05,180],[1.78,13.85,-90],[-.7,13.85,90]])furniture('chairCushion',x,z,.82,yaw,'height',[.55,.55]);
  furniture('plantSmall1',.55,13.85,.28,0,'height',undefined,.95);
  furniture('trashcan',1.95,10.3,.6,0,'height',[.4,.4]);
  box('Kitchen woven runner',-1.65,.05,11.35,.65,.025,2.7,m.mint);

  // Utility room, directly accessible from both kitchen and living room.
  furniture('washer',3.35,10.2,1.02,0,'height',[1.05,.95]);
  furniture('dryer',3.25,12.4,1.02,90,'height',[1.05,.95]);
  box('Folding counter',5.78,.43,12.63,1.05,.81,.9,m.trim);block(5.78,12.63,1.05,.9);
  box('Birch worktop',5.78,.88,12.63,1.14,.1,.95,m.wood);
  box('Clean laundry basket',5.85,.23,10.5,.65,.43,.6,m.pinkLight);block(5.85,10.5,.65,.6);
  for(let i=0;i<3;i++)box('Folded towels',5.6,.98+i*.07,12.65,.55,.055,.32,[m.blue,m.pinkLight,m.mint][i]);
  furniture('plantSmall2',6.1,12.65,.3,0,'height',undefined,.95);
  furniture('lampRoundFloor',6.1,11.45,1.8,0,'height',[.35,.35]);

  // Compact private bathroom, with no passage through the bathing area.
  furniture('bathroomSink',4.12,-3.08,.9,0,'height',[1.0,.7]);
  furniture('bathroomMirror',4.12,-3.49,.9,0,'height',undefined,1.35,{metal:'#a5c6cc'});
  furniture('bathtub',5.75,-2.12,2.15,90,'width',[.94,2.15]);
  // Cistern against the east wall; the seat projects west into the room.
  furniture('toilet',5.98,-.32,.8,-90,'height',[.8,.58]);
  box('Bath mat',4.6,.054,-1.55,1.1,.025,1.4,m.rug);
  for(const z of [-.85,-.2])box('Towel rail leg',3.62,.44,z,.055,.88,.055,m.wood);
  box('Towel rail bar',3.62,.88,-.525,.06,.055,.7,m.wood);block(3.62,-.525,.16,.8);
  furniture('plantSmall1',4.35,-3.12,.22,0,'height',undefined,.95);

  // A few small imported details enrich the original bedroom without moving its cleanup furniture.
  furniture('pillow',-2.08,-1.97,.6,0,'width',undefined,.91,{carpet:'#bba4d4'});
  furniture('bear',-2.53,-2.5,.32,0,'height',undefined,.92);
  furniture('books',2.45,1.05,.3,20,'width',undefined,1.18);

  // The visible world continues beyond the cutaway: lawn, planting, porch, drive and fence.
  exterior = true;
  box('Garden terrain',0,-.3,7,70,.3,80,grass);
  box('Lawn edging',-5.15,-.12,8.8,.22,.12,19,grassDark);
  box('Gravel driveway',-7.2,-.135,12.0,3.8,.045,17.5,asphalt);
  box('Driveway curb',-9.18,-.07,12,.12,.15,17.6,m.trim);
  box('Front path',-4.3,-.07,8.25,2.2,.14,1.8,path);
  box('Entry porch',-3.88,-.025,8.25,1.25,.19,2.6,m.wood);
  for(let z=7.05;z<9.5;z+=.19)box('Porch board',-3.88,.074,z,1.25,.008,.012,m.seam);
  box('Patio terrace',4.55,-.105,14.4,4,.08,2.4,path);
  for(let x=3;x<6.5;x+=.55)box('Terrace joint',x,-.06,14.4,.012,.006,2.4,m.trim);
  furniture('benchCushion',4.65,14.5,1.6,0,'width',undefined,-.06);
  for(const [x,z,w,d] of [[-4.05,2.0,1.05,6],[-4.1,12.15,1,4.2],[7.25,3.0,1.05,13],[.3,-4.35,8,1.0]])box('Raised flower border',x,-.07,z,w,.11,d,soil);
  const treePositions: Triple[]=[[-6.2,0,-3.5],[-8.5,0,2],[-5.5,0,16.6],[8.2,0,-4],[9.6,0,3],[8.3,0,8.3],[7.4,0,16.9],[-.8,0,18.6],[4.2,0,-6],[-10.7,0,11]];
  treePositions.forEach(([x,,z],i)=>art.add('nature',i%2?'tree_oak':'tree_detailed',[x,-.14,z],3.0+(i%3)*.45,i*57));
  for(let i=0;i<28;i++){
    const left=i<14,x=left?-4.12:7.22,z=-2.7+(i%14)*1.14;
    if(left&&z>6.8&&z<9.8)continue;
    art.add('nature','plant_bushDetailed',[x,-.1,z],.48+(i%3)*.08,i*41);
    art.add('nature',i%2?'flower_purpleA':'flower_yellowC',[x+.35,-.07,z+.25],.26+(i%3)*.03,i*23);
  }
  for(let i=0;i<30;i++)art.add('nature','grass_large',[-11+(i%10)*2.4,-.14,i<10?-6.3:i<20?18.4:21.5],.15+(i%3)*.03,i*17);
  // A deliberately low fence keeps foreground landscaping from obscuring the player.
  for(let z=-6;z<20;z+=2)art.add('nature','fence_planksDouble',[10.5,-.14,z],.82,90);
  for(let x=-10;x<10.5;x+=2)art.add('nature','fence_planksDouble',[x,-.14,-6],.82,0);
  for(let x=-4.7;x<10.5;x+=2)art.add('nature','fence_planksDouble',[x,-.14,20],.82,0);
  // Mailbox by the driveway entrance.
  box('Mailbox post',-5.15,.45,18,.12,1.15,.12,m.wood);
  box('Mailbox body',-5.15,1.03,18,.43,.36,.6,m.pink);
  box('Mailbox door',-5.15,1.03,18.315,.36,.29,.035,m.trim);
  app.batcher.generate([group.id]);
  const ready=art.finish();
  const lighting = new HouseLighting(app, root, m.lamp, art.lampMaterials);
  return {root,obstacles,materials:m,halfWidth:6.6,halfDepth:16.4,walkable:[...HOUSE_ROOMS],ready,artStats:()=>art.snapshot(),lighting};
}
