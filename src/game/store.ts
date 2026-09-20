import { BoundingBox, Color, Entity, Vec3, type Application, type RenderComponent, type StandardMaterial } from 'playcanvas';
import { material, primitives, type Triple } from './primitives';
import { createBlindBox } from './dumplingVisual';
import { STOCK_SITES, seriesById, type StoreDefinition, type StoreStock } from '../data/hunt';
import { HouseArt } from './HouseArt';
import { SurfaceTextures } from './SurfaceTextures';
import type { Bedroom } from './bedroom';

/** Fixtures are imported CC0 models. Only the game-specific boxes, floor and simple trim are bespoke. */
export function createStore(app:Application,definition:StoreDefinition){
  const root=new Entity(definition.name,app);app.root.addChild(root);
  const surfaces=new SurfaceTextures(app),art=new HouseArt(app,root,surfaces),shape=primitives(app,root),obstacles:BoundingBox[]=[];
  const [accent,secondary,ivory]=definition.palette;
  const width=definition.layout===1?4.1:3.4,depth=definition.layout===0?7.2:definition.layout===1?9:8.4;
  const floor=material(definition.name+' floor',['#c3d1b5','#efd7e2','#b9bfd4'][definition.layout]);surfaces.apply(floor,(['tile','checker','rug'] as const)[definition.layout],definition.layout===2?5:8);
  const wall=material('Shop cream',ivory),trim=material('Shop accent',accent),rug=material('Shop woven rug',secondary);surfaces.apply(rug,'rug',2);
  shape('Maple floor','box',[0,-.12,0],[width*2,.24,depth*2],floor);
  shape('Back wall','box',[0,1.55,-depth-.08],[width*2,3.1,.16],wall);
  shape('Left wall','box',[-width-.08,1.55,0],[.16,3.1,depth*2],wall);
  shape('Store skirting','box',[0,.13,-depth+.015],[width*2,.26,.06],trim);
  shape('Shop garden surroundings','box',[0,-.22,0],[26,.18,40],material('Shop grass','#a6bc89'),false);
  for(let x=-3;x<=3;x+=2)art.add('building','floor',[x,-.08,depth+1],2,0,'width');
  art.add('nature','tree_oak',[-width-1.8,-.07,depth+2.3],3.5);
  art.add('nature','tree_oak',[width+2,-.07,depth+1.2],3.8);
  const exitAnchor=new Vec3(0,0,depth-.65);
  shape('Welcome mat','box',[0,.012,exitAnchor.z],[1.75,.025,.95],rug,false);
  shape('Center rug','box',[.1,.014,-.2],[2.5,.025,3],rug,false);
  // Detailed arched storefront/window modules from Kenney Building Kit.
  art.add('building','wall-window-wide-round',[-width+.06,.02,-1.9],2.55,0,'height');
  art.add('building','wall-doorway-round',[width-1,.01,-depth+.05],2.65,90);
  art.add('building','door-rotate-round-a',[width-1,.02,-depth+.10],2.1,90);
  const offset=definition.layout===2?.7:0;
  const sites=[
    {fixture:[-1.8,0,-depth+.55] as Triple,point:[-1.8,0,-depth+1.45] as Triple,box:[-1.8,.87,-depth+.65] as Triple,kind:'bookcaseOpen'},
    {fixture:[-2.35,0,-.7-offset] as Triple,point:[-1.35,0,-.7-offset] as Triple,box:[-2.17,1.04,-.7-offset] as Triple,kind:'shelf-end'},
    {fixture:[2.3,0,depth-2.4] as Triple,point:[1.2,0,depth-2.4] as Triple,box:[2.18,1.04,depth-2.1] as Triple,kind:'kitchenCabinetDrawer'},
    {fixture:[-2.5,0,depth-1.45] as Triple,point:[-1.65,0,depth-1.45] as Triple,box:[-2.5,.24,depth-1.45] as Triple,kind:'shopping-basket'},
    {fixture:[2.4,0,-depth+2.1] as Triple,point:[1.4,0,-depth+2.1] as Triple,box:[2.25,.35,-depth+2.1] as Triple,kind:'bookcaseOpenLow'},
    {fixture:[.65,0,.45-offset] as Triple,point:[.65,0,1.8-offset] as Triple,box:[.65,definition.layout===2?.80:.53,.45-offset] as Triple,kind:definition.layout===2?'tableRound':'tableCoffee'},
  ];
  const boxes:Entity[][]=[],glows:Entity[]=[];
  for(const [i,site] of sites.entries()){
    const market=['shelf-end','shopping-basket'].includes(site.kind);
    const sizes=[2.05,1.35,1,.46,1.05,1.5];
    art.add(market?'market':'furniture',site.kind,site.fixture,sizes[i],i===1?90:i===4?-90:0,i===5?'width':'height',{carpet:accent,wood:accent,woodDark:secondary,metal:ivory},false,0,'paint');
    const half=i===0?[.48,.30]:i===1?[.3,.55]:i===2?[.53,.55]:i===3?[.36,.4]:i===4?[.34,.53]:[.76,definition.layout===2?.88:.46];
    obstacles.push(new BoundingBox(new Vec3(site.fixture[0],0,site.fixture[2]),new Vec3(half[0],1,half[1])));
    boxes.push([0,1].map(n=>{
      const box=createBlindBox(app,root).root;box.name=`${STOCK_SITES[i]} surprise ${n}`;box.setLocalScale(.4,.4,.4);
      const sideways=i===1||i===4;
      const spread=(n-.5)*.34;
      box.setLocalPosition(site.box[0]+(sideways||i===3?0:spread),site.box[1]+(i===3?n*.22:0),site.box[2]+(sideways?spread:0));
      box.setLocalEulerAngles(0,i===1?90:i===4?-90:0,0);box.enabled=false;return box;
    }));
    const glow=shape('Nearby display aura','cylinder',[site.point[0],.027,site.point[2]],[.85,.02,.85],material('Soft golden aura','#ffe8ad'),false);glow.enabled=false;glows.push(glow);
  }
  art.add('market','cash-register',[2.3,1.03,depth-2.65],.3,90);
  art.add('market','shopping-cart',[-width+.6,.02,1.35],.85,180);
  obstacles.push(new BoundingBox(new Vec3(-width+.6,0,1.35),new Vec3(.38,1,.55)));
  art.add('market','shelf-bags',[-width+.48,.02,-depth+2.2],1.1,90);
  obstacles.push(new BoundingBox(new Vec3(-width+.48,0,-depth+2.2),new Vec3(.32,1,.65)));
  art.add('furniture','bear',[-1.65,1.43,-depth+.62],.3);
  art.add('furniture','plantSmall1',[2.56,1.03,depth-2.1],.27);
  art.add('furniture','pottedPlant',[width-.45,.02,-.2],1.05);
  obstacles.push(new BoundingBox(new Vec3(width-.45,0,-.2),new Vec3(.33,1,.33)));
  art.add('furniture','lampRoundFloor',[-.2,.02,-depth+.45],1.9);
  if(definition.layout===1){
    art.add('furniture','bear',[2.5,1.08,-depth+2.1],.42);
    art.add('furniture','benchCushion',[.8,.02,-depth+1],.75,0,'height',{carpet:accent});obstacles.push(new BoundingBox(new Vec3(.8,0,-depth+1),new Vec3(.65,1,.42)));
    art.add('furniture','bookcaseOpen',[-3.3,.02,-4.3],1.8,90);obstacles.push(new BoundingBox(new Vec3(-3.3,0,-4.3),new Vec3(.3,1,.5)));
    art.add('furniture','bear',[-3.3,.68,-4.2],.38);
    art.add('furniture','benchCushion',[3.3,.02,1.9],.6,90,'height',{carpet:accent});obstacles.push(new BoundingBox(new Vec3(3.3,0,1.9),new Vec3(.35,1,.6)));
  }
  if(definition.layout===2)art.add('furniture','plantSmall2',[.65,.80,.08-offset],.3);
  const room:Bedroom={root,obstacles,halfWidth:width,halfDepth:depth,walkable:[{minX:-width,maxX:width,minZ:-depth,maxZ:depth}],ready:art.finish(),artStats:()=>art.snapshot()};
  root.enabled=false;
  const sync=(stock:StoreStock)=>{for(let i=0;i<sites.length;i++){
    const slot=stock.slots.find(s=>s.site===i);
    boxes[i].forEach((box,n)=>{box.enabled=!!slot&&slot.remaining>n;if(slot){
      for(const render of box.findComponents('render') as RenderComponent[])for(const mesh of render.meshInstances){
        const original=mesh.material as StandardMaterial;if(!original.name.startsWith('Series ')){const m=original.clone();m.name='Series '+original.name;mesh.material=m;}
        if(mesh.material.name.includes('Box blush')){const m=mesh.material as StandardMaterial;m.diffuse=new Color().fromString(seriesById(slot.series).color);m.update();}
      }
    }});
  }};
  return {...room,definition,sites:sites.map((s,i)=>({id:i,name:STOCK_SITES[i],anchor:new Vec3(...s.point),marker:new Vec3(s.box[0],s.box[1]+.6,s.box[2])})),boxes,glows,exitAnchor,sync};
}
