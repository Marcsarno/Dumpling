import fs from 'node:fs';
import {Mat4,Vec3,Quat} from 'playcanvas';
const read=p=>JSON.parse(fs.readFileSync(p));
const before=read('stores/before-scene.json').entities,catalog=read('stores/asset-catalog.json');
const templates=[...catalog.templates.filter(t=>!t.name.startsWith('kit__')&&!t.name.startsWith('merch__')),...read('stores/new-templates.json')];
const mats=read('stores/new-materials.json'),palette=catalog.paletteIds,defs=read('stores/collectibles.json');
const matName=id=>mats.find(m=>m.id===id)?.name||'';
const variant=(id,part)=>mats.find(m=>m.name===`Merch · ${id} · ${part}`).id;
const paints=['mint','blush','lavender','butter','blue'];
const boundsCache=new Map();
function bounds(path){if(boundsCache.has(path))return boundsCache.get(path);const b=fs.readFileSync(path),g=JSON.parse(b.subarray(20,20+b.readUInt32LE(12))),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 function walk(i,parent){const n=g.nodes[i],local=new Mat4();if(n.matrix)local.set(n.matrix);else local.setTRS(new Vec3(...(n.translation||[0,0,0])),new Quat(...(n.rotation||[0,0,0,1])),new Vec3(...(n.scale||[1,1,1])));const w=new Mat4().mul2(parent,local);
  if(n.mesh!==undefined)for(const p of g.meshes[n.mesh].primitives){const a=g.accessors[p.attributes.POSITION];for(let mask=0;mask<8;mask++){const v=w.transformPoint(new Vec3(...a.min.map((x,k)=>mask&(1<<k)?a.max[k]:x))).toArray();v.forEach((x,k)=>{min[k]=Math.min(min[k],x);max[k]=Math.max(max[k],x);});}}
  for(const c of n.children||[])walk(c,w);
 }for(const i of g.scenes[g.scene||0].nodes)walk(i,new Mat4());const result={min,max,size:max.map((x,i)=>x-min[i]),center:max.map((x,i)=>(x+min[i])/2)};boundsCache.set(path,result);return result;
}
function clean(c){if(Array.isArray(c))return c.map(clean);if(c&&typeof c==='object')return Object.fromEntries(Object.entries(c).filter(([,v])=>v!==null).map(([k,v])=>[k,clean(v)]));return c;}
function model(name,key,p,dims,yaw=0,paint,collectible){
 const t=templates.find(t=>t.name===key);if(!t)throw Error('Missing '+key);
 const source=t.data.entities,def=collectible&&defs.find(d=>d.id===collectible);
 function tree(r){
  if(def&&r.name.startsWith('Accessory_')&&r.name!=='Accessory_'+def.accessory)return null;
  if(def&&/^Eye(Open|Closed)[LR]$/.test(r.name)){const closed=def.face==='sleepy'||def.face==='wink'&&r.name.endsWith('R');if(r.name.includes('Closed')!==closed)return null;}
  const components=clean(structuredClone(r.components||{}));
  if(components.render){components.render.castShadows=true;components.render.materialAssets=components.render.materialAssets.map(id=>{
   const n=matName(id);if(def){if(n==='Dough tint')return variant(def.id,'body');if(n==='Accessory tint')return variant(def.id,'accent');}
   if(/^(plant|leafsGreen|leafs)$/.test(n))return palette.leaf;
   if(paint){if(/Kit accent|carpet|woodDark/.test(n))return palette[paint];if(/Kit light wood|^wood$/.test(n))return palette.wood;if(/Kit cream|metalLight|^metal$/.test(n))return palette.cream;}
   return id;
  });}
  return{name:r.name,position:r.position,rotation:r.rotation,scale:r.scale,enabled:r.enabled,components,children:(r.children||[]).map(id=>tree(source[id])).filter(Boolean)};
 }
 const path=key.startsWith('layout__')?'public/assets/'+key.slice(8).replaceAll('__','/')+'.glb':key==='merch__bao-squishy'?'public/assets/store-kit/bao-squishy-display.glb':key==='merch__bamboo-steamer-shelf'?'public/assets/store-kit/bamboo-steamer-shelf-display.glb':'public/assets/store-kit/'+key.slice(5)+'.glb';
 const b=bounds(path),scale=Array.isArray(dims)?dims.map((x,i)=>x/b.size[i]):b.size.map(()=>dims/b.size[1]);
 return{name,position:p,rotation:[0,yaw,0],scale,tags:['store.art',...(def?['store.merchandise','collectible:'+def.id]:[])],children:[{name:'Original asset geometry',position:[-b.center[0],-b.min[1],-b.center[2]],children:Object.values(source).filter(r=>!r.parent).map(tree).filter(Boolean)}]};
}
const shape=(name,type,p,s,mat,rotation=[0,0,0])=>({name,position:p,scale:s,rotation,tags:['store.art'],components:{render:{type,materialAssets:[palette[mat]],castShadows:true,receiveShadows:true}}});
const box=(name,p,s,mat)=>shape(name,'box',p,s,mat);
const modelKey=(pack,name)=>'layout__environment__kenney__'+pack+'__'+name;
const plant=(p,size=.85)=>model('Reused potted plant',modelKey('furniture','pottedPlant'),p,size);
function merch(id,p,size=.45,yaw=0){return model('Display · '+id,'merch__bao-squishy',p,size,yaw,null,id);}
function steamer(p,size=.3){return model('Bamboo surprise containers','merch__bamboo-steamer-shelf',p,size);}
function flower(p,size,mat='lavender',upright=false){const ns=[];for(let i=0;i<6;i++){const a=i*Math.PI/3,offset=[Math.sin(a)*size*.29,Math.cos(a)*size*.29];ns.push(shape('Flower petal','cylinder',upright?[p[0]+offset[0],p[1]+offset[1],p[2]]:[p[0]+offset[0],p[1],p[2]+offset[1]],upright?[size*.52,.03,size*.52]:[size*.55,.018,size*.55],mat,upright?[90,0,0]:[0,0,0]));}ns.push(shape('Flower heart','cylinder',[p[0],p[1]+(upright?0:.01),p[2]+(upright?.02:0)],[size*.3,.028,size*.3],'butter',upright?[90,0,0]:[0,0,0]));return ns;}
function gift(p,color='blush',size=.34){return{name:'Gift box · '+color,position:p,tags:['store.art'],children:[box('Gift carton',[0,size/2,0],[size,size,size*.8],color),box('Lid',[0,size+.02,0],[size+.025,.05,size*.8+.02],color),box('Label',[0,size*.52,size*.405],[size*.48,size*.24,.012],'paper')]};}
function shelfContents(length=2.3,top=1.31,ids=['rosie','minty','sunny','lavendream']){const out=[];for(let i=0;i<4;i++){const x=-length*.37+i*length*.245;out.push(merch(ids[i%ids.length],[x,top,.05],.48));out.push(gift([x,.22,.12],paints[i],.34));out.push(steamer([x,.77,.05],.25));}return out;}
function counter(){return[box('Cream countertop',[0,1.08,0],[2.45,.13,.95],'cream'),box('Mint counter base',[0,.52,0],[2.25,1,.81],'mint'),box('Butter inset',[0,.56,.418],[1.88,.57,.02],'butter'),box('Counter toe',[0,.08,0],[2.32,.16,.86],'wood')];}
function table(w=2.65,d=1.6,h=.9,paint='wood'){const out=[box('Soft display tabletop',[0,h,0],[w,.12,d],'cream'),box('Lower display shelf',[0,.24,0],[w-.15,.08,d-.15],paint)];for(const x of [-w*.43,w*.43])for(const z of [-d*.4,d*.4])out.push(box('Table leg',[x,h*.5,z],[.13,h,.13],paint));return out;}
function bin(){return[box('Bin base',[0,.18,0],[1.3,.15,.8],'wood'),box('Bin front',[0,.45,.39],[1.3,.45,.07],'mint'),box('Bin back',[0,.45,-.39],[1.3,.45,.07],'mint'),...[-.63,.63].map(x=>box('Bin side',[x,.45,0],[.07,.45,.8],'mint'))];}
function poster(p,yaw=0){return{name:'Framed daisy poster',position:p,rotation:[0,yaw,0],tags:['store.art'],children:[box('Light wood frame',[0,0,0],[.95,1.15,.085],'wood'),box('Print',[0,0,.05],[.8,1,.015],'paper'),...flower([0,.1,.08],.51,'pink',true),box('Stem',[0,-.24,.09],[.035,.3,.02],'leaf')]};}
const layouts=[
 {id:'corner',name:'Clover Corner',root:'14039551-dd61-4464-aa63-9bdf895a4eb0',w:4.8,d:5.8,sign:'clover',accent:'mint',sites:[
  {p:[1.45,0,-4.77],kind:'wall',dims:[3.15,1.55,.82],stand:[0,0,1.2],stock:[-.45,.98,.35]},
  {p:[-2.55,0,-.75],kind:'aisle',yaw:90,stand:[0,0,1.15],stock:[.35,1.33,.26]},
  {p:[-2.35,0,-4.65],kind:'counter',stand:[0,0,1.3],stock:[.7,1.16,.1]},
  {p:[-3.05,0,3.5],kind:'bin',stand:[1.05,0,0],stock:[.24,.42,0]},
  {p:[1.25,0,-.65],kind:'aisle',stand:[0,0,1.25],stock:[.35,1.33,.26]},
  {p:[.6,0,3.35],kind:'hero',stand:[-1.9,0,0],stock:[.72,.97,.45]}],extra:[[-4.05,0,1.5],[-4.05,0,-3.15],[4.05,0,3.45]]},
 {id:'toys',name:'Peachy Playroom',root:'5e9030c1-ded8-4c64-9616-e95ddde5ec21',w:5.2,d:6.5,sign:'peachy',accent:'blush',sites:[
  {p:[-3.4,0,-5.65],kind:'wall',dims:[2.45,1.85,.72],stand:[0,0,1.2],stock:[-.35,1.16,.36]},
  {p:[-1.15,0,.7],kind:'aisle',yaw:90,stretch:1.25,stand:[0,0,1.15],stock:[.35,1.33,.26]},
  {p:[3.8,0,4.7],kind:'counter',small:.7,stand:[-1.25,0,0],stock:[.7,1.16,.1]},
  {p:[-.25,0,4.2],kind:'gifts',stand:[-1.9,0,0],stock:[.5,.8,.3]},
  {p:[2.15,0,.7],kind:'aisle',yaw:90,stretch:1.25,stand:[0,0,1.15],stock:[.35,1.33,.26]},
  {p:[.55,0,-3.55],kind:'hero',stand:[0,0,1.5],stock:[.72,.97,.45]}],extra:[[-4.4,0,3.7],[.1,0,-5.7],[4.45,0,-1.7]]},
 {id:'collector',name:'Moonbeam Finds',root:'9e321cf5-8691-4077-932a-008b64724b6f',w:5.1,d:6.8,sign:'moonbeam',accent:'lavender',sites:[
  {p:[-.25,0,-5.68],kind:'wall',dims:[4.25,1.55,.83],stand:[0,0,1.2],stock:[-.45,.98,.35]},
  {p:[-1.7,0,-.05],kind:'aisle',yaw:90,stretch:1.6,stand:[0,0,1.15],stock:[.35,1.33,.26]},
  {p:[3.52,0,-4.25],kind:'counter',stand:[0,0,1.3],stock:[.7,1.16,.1]},
  {p:[-.15,0,4.45],kind:'gifts',stand:[-1.9,0,0],stock:[.5,.8,.3]},
  {p:[1.65,0,-.05],kind:'aisle',yaw:90,stretch:1.6,stand:[0,0,1.15],stock:[.35,1.33,.26]},
  {p:[3.8,0,2.65],kind:'round',stand:[-1.35,0,0],stock:[.45,.72,.15]}],extra:[[-4.22,0,2.9],[-4.15,0,-3.3],[-4.25,0,4.9]]}
];
for(const l of layouts){const edits=[],additions=[];const edit=(id,path,value)=>edits.push({id,path,value});const record=(name,index=0)=>before.find(e=>e.tags.includes('key:'+l.name+'/'+name+'/'+index));const entityTag=tag=>before.find(e=>e.tags.includes(tag));
 const setRecord=(name,p,s,paint,index=0)=>{const e=record(name,index);if(!e)return;if(p)edit(e.resource_id,'position',p);if(s)edit(e.resource_id,'scale',s);if(paint)edit(e.resource_id,'components.render.materialAssets',[palette[paint]]);};
 // Keep stable migration keys; disable replaced visuals reversibly.
 for(const e of before.filter(e=>e.tags.some(t=>t.startsWith('key:'+l.name+'/')))){
  if(['Maple floor','Center rug','Art shelf-end','Art shelf-bags','Art bear','Art kitchenCabinetDrawer','Art shopping-basket','Art bookcaseOpenLow','Art tableCoffee','Art tableRound','Art bookcaseOpen'].includes(e.name))edit(e.resource_id,'enabled',false);
 }
 setRecord('Back wall',[0,1.55,-l.d-.08],[l.w*2,3.1,.16],'wall');setRecord('Left wall',[-l.w-.08,1.55,0],[.16,3.1,l.d*2],'wall');setRecord('Store skirting',[0,.23,-l.d+.015],[l.w*2,.46,.065],l.accent);
 setRecord('Welcome mat',[0,.015,l.d-.65],[2.25,.03,1.0],'butter');edit(entityTag('exit:'+l.name).resource_id,'position',[0,0,l.d-.65]);
 const walk=entityTag('walkable:'+l.name);edit(walk.resource_id,'position',[0,0,0]);edit(walk.resource_id,'scale',[l.w*2,1,l.d*2]);
 setRecord('Art wall-window-wide-round',[-l.w+.05,.02,-1.6],[1,1.05,1]);setRecord('Art wall-doorway-round',[l.w-1.0,.01,-l.d+.05]);setRecord('Art door-rotate-round-a',[l.w-1.0,.02,-l.d+.1]);
 if(l.id==='toys')setRecord('Art wall-window-wide-round',[-5.14,.02,2.6],[1,.85,.65]);
 if(l.id==='collector')edit(record('Art plantSmall2').resource_id,'enabled',false);
 setRecord('Art lampRoundFloor',[-.6,.02,-l.d+.45]);setRecord('Art tree_oak',[-l.w-1.8,-.07,l.d+.5],null,null,0);setRecord('Art tree_oak',[l.w+1.8,-.07,l.d+.5],null,null,1);
 for(let i=0;i<4;i++)setRecord('Art floor',[-3+i*2,-.08,l.d+1],null,null,i);
 const stage={name:l.name+' · pastel store kit',tags:['store.art','store.stage:'+l.id],children:[box('Sage tile floor',[0,-.12,0],[l.w*2,.24,l.d*2],'floor'),box('Left mint dado',[-l.w+.01,.26,0],[.05,.52,l.d*2],l.accent),box('Open right skirting',[l.w-.01,.08,0],[.1,.16,l.d*2],'cream'),box('Front threshold',[0,-.01,l.d],[l.w*2,.12,.12],'cream')]};
 for(let x=-l.w+1.15;x<l.w;x+=1.15)stage.children.push(box('Fine tile joint',[x,.006,0],[.013,.009,l.d*2],'seam'));
 for(let z=-l.d+1.15;z<l.d;z+=1.15)stage.children.push(box('Fine tile joint',[0,.006,z],[l.w*2,.009,.013],'seam'));
 stage.children.push(model('Store identity','kit__sign-'+l.sign,l.id==='toys'?[-l.w+.11,1.85,-.8]:[l.id==='corner'?1.35:-.25,1.93,-l.d+.06],l.id==='toys'?1.15:1.0,l.id==='toys'?90:0));
 stage.children.push(poster([-l.w+.13,1.65,l.id==='toys'?4.45:3.1],90),poster([l.w-2.0,2.0,-l.d+.12]));
 stage.children.push({name:'Soft shop fill',rotation:[35,150,0],components:{light:{type:'directional',color:[1,.95,.9],intensity:.28,castShadows:false}}});
 const collection=l.id==='collector'?['moonbean','orbit','lavendream','supernova']:['rosie','minty','sunny','mochi'];
 for(let i=0;i<6;i++){
  const cfg=l.sites[i],group=entityTag('prop:'+l.name+':'+i),yaw=cfg.yaw||0,stretch=cfg.stretch||1,small=cfg.small||1;
  edit(group.resource_id,'name',l.id+' · '+['Back-wall collection','Browse shelf A','Checkout','Gift & container display','Browse shelf B','Feature display'][i]);edit(group.resource_id,'position',cfg.p);edit(group.resource_id,'rotation',[0,yaw,0]);edit(group.resource_id,'scale',[1,1,1]);
  const col=before.find(e=>e.parent===group.resource_id&&e.tags.includes('migration.collider'));
  const sizes={wall:[cfg.dims?.[0]||3,2,cfg.dims?.[2]||.8],aisle:[2.52*stretch,2,.92],counter:[2.45*small,2,.95*small],bin:[1.3,1,.8],hero:[2.7,1.5,1.65],gifts:[2.8,1.3,1.1],round:[1.65,2,1.65]};edit(col.resource_id,'scale',sizes[cfg.kind]);edit(col.resource_id,'position',[0,.5,0]);
  edit(entityTag(l.name+':'+i+':anchor').resource_id,'position',cfg.stand);edit(entityTag(l.name+':'+i+':marker').resource_id,'position',[cfg.stock[0],cfg.stock[1]+.5,cfg.stock[2]]);
  const art={name:'Merchandising · '+cfg.kind,tags:['store.art','store.display:'+l.id+':'+i],children:[]};
  if(cfg.kind==='wall'){
   art.children.push(model('Reused wide bookcase',modelKey('furniture','bookcaseOpen'),[0,0,0],cfg.dims,0,l.accent));
   for(let n=0;n<4;n++){const x=(n-1.5)*cfg.dims[0]/4.6;art.children.push(merch(collection[n%4],[x,cfg.dims[1]+.015,.03],n===0?.66:.51));art.children.push(gift([x,.13,.05],paints[n],.38));art.children.push(steamer([x,cfg.dims[1]*.6,.05],.26));}
  }else if(cfg.kind==='aisle'){
   art.children.push(model('Arched browse shelf','kit__arched-display-shelf',[0,0,0],[2.52*stretch,1.9,.92],0,l.accent));art.children.push(...shelfContents(2.3*stretch,1.31,collection));
   for(let n=0;n<4;n++)art.children.push(gift([(n-1.5)*.54*stretch,.77,-.22],paints[(n+i)%5],.29));
  }else if(cfg.kind==='counter'){
   art.children.push({name:'Reusable checkout kit',scale:[small,small,small],children:counter()});
   const reg=record('Art cash-register');edit(reg.resource_id,'position',[-.6*small,1.16*small,0]);const pl=record('Art plantSmall1');edit(pl.resource_id,'position',[.9*small,1.16*small,-.18]);
  }else if(cfg.kind==='bin'){
   art.children.push(...bin());for(let n=0;n<4;n++)art.children.push(merch(collection[n],[n%2*.55-.27,.26,Math.floor(n/2)*.35-.16],.43));
  }else if(cfg.kind==='hero'){
   art.children.push(...table(),merch(collection[0],[-.45,.97,-.2],.95),merch(collection[1],[.62,.97,-.3],.58),merch(collection[2],[-1,.97,.34],.42));
   for(let n=0;n<3;n++)art.children.push(steamer([(n-1)*.73,.29,.08],.4));art.children.push(gift([-.2,.97,.47],l.accent,.29));
   stage.children.push(box('Butter feature rug',[cfg.p[0],.016,cfg.p[2]],[3.6,.018,2.7],'butter'));
   if(l.id==='corner')stage.children.push(...flower([cfg.p[0],.04,cfg.p[2]],4.3,'lavender'));
  }else if(cfg.kind==='gifts'){
   art.children.push(...table(2.8,1.1,.72,l.accent));for(let n=0;n<4;n++){art.children.push(gift([(n-1.5)*.59,.78,-.12],paints[n],.42));art.children.push(steamer([(n-1.5)*.58,.29,0],.27));}art.children.push(merch(collection[0],[-.7,.8,.25],.48));
   stage.children.push(box('Gift display rug',[cfg.p[0],.016,cfg.p[2]],[3.5,.018,2.1],'butter'));
  }else if(cfg.kind==='round'){
   art.children.push(shape('Tiered display base','cylinder',[0,.2,0],[1.7,.4,1.7],'blush'),shape('Lower tier','cylinder',[0,.67,0],[1.65,.11,1.65],'cream'),shape('Upper tier stem','cylinder',[0,.95,0],[.36,.6,.36],'lavender'),shape('Upper tier','cylinder',[0,1.25,0],[.95,.1,.95],'cream'));
   art.children.push(merch('supernova',[0,1.31,0],.72),merch('moonbean',[-.4,.73,.28],.48),merch('orbit',[.4,.73,-.28],.46));for(let n=0;n<5;n++){const a=n*Math.PI*2/5;art.children.push(gift([Math.sin(a)*.59,.12,Math.cos(a)*.59],paints[n],.26));}
  }
  for(let n=0;n<2;n++)art.children.push({name:'Purchasable stock '+n,tags:['stock:'+l.name+':'+i+':'+n],position:[cfg.stock[0]+(n-.5)*.36,cfg.stock[1]*(cfg.small||1),cfg.stock[2]],scale:[.28,.28,.28]});
  // Stock sockets must be direct children of the prop so all attachment coordinates agree.
  const sockets=art.children.filter(n=>n.tags?.some(t=>t.startsWith('stock:')));art.children=art.children.filter(n=>!sockets.includes(n));additions.push({parent:group.resource_id,entity:art},...sockets.map(entity=>({parent:group.resource_id,entity})));
 }
 for(let j=0;j<3;j++){const group=entityTag('prop:'+l.name+':'+(j+6));edit(group.resource_id,'position',l.extra[j]);if(j===1){edit(group.resource_id,'rotation',[0,l.id==='collector'?90:0,0]);additions.push({parent:group.resource_id,entity:{name:'Reused narrow storage shelf',tags:['store.art'],children:[model('Bookcase',modelKey('furniture','bookcaseOpen'),[0,0,0],[1.0,2.2,.5],0,l.accent),plant([0,2.2,0],.48),gift([0,.18,.06],'lavender',.36),gift([0,.86,.06],'blush',.36),steamer([0,1.56,.06],.3)]}});}}
 if(l.id==='toys'){
  const bench=entityTag('prop:'+l.name+':9');edit(bench.resource_id,'enabled',false);for(const i of [10,11])edit(entityTag('prop:'+l.name+':'+i).resource_id,'enabled',false);
  stage.children.push(shape('Squishy lounge rug','cylinder',[-3.94,.024,-.55],[1.95,.025,4.05],'lavender'));
  for(const [i,id] of ['mochi','minty','rosie'].entries())stage.children.push(merch(id,[-4.0,.05,-1.9+i*1.36],1.1,35));
  stage.children.push({name:'Squishy corner collision',tags:['migration.collider','collision:'+l.name,'index:90'],position:[-4,.5,-.55],scale:[1.35,2,3.8]});
  stage.children.push(model('Extra small gift cubby',modelKey('furniture','bookcaseOpenLow'),[1.0,0,-5.65],[1.6,1.3,.6],0,'mint'));
  for(let i=0;i<3;i++)stage.children.push(gift([.5+i*.48,1.3,-5.65],paints[i],.28));
 }
 stage.children.push(plant([-l.w+.5,0,l.d-1.0],1.0),plant([l.w-.55,0,-l.d+2.5],1.05));
 if(l.id==='corner')stage.children.push({name:'Clover refinement · side crate and greenery',tags:['store.art','store.refinement:corner'],children:[
  {name:'Side merchandise crate',position:[3.65,0,1.45],children:[...bin(),...['rosie','minty','sunny','lavendream'].map((id,n)=>merch(id,[n%2*.55-.27,.26,Math.floor(n/2)*.35-.16],.43)),{name:'Crate collision',tags:['migration.collider','collision:'+l.name,'index:91'],position:[0,.4,0],scale:[1.3,.8,.8]}]},
  model('Leafy checkout plant',modelKey('furniture','plantSmall1'),[-3.1,1.17,-4.75],.55),model('Leafy top shelf plant',modelKey('furniture','plantSmall1'),[-4.05,2.2,-3.15],.55),
  shape('Pendant shade','cone',[-2.3,3.25,-4.25],[.55,.6,.55],'butter'),shape('Pendant cable','cylinder',[-2.3,3.9,-4.25],[.025,.75,.025],'dark')
 ]});
 if(l.id==='toys')stage.children.push({name:'Peachy refinement · hanging charm display',tags:['store.art','store.refinement:toys'],children:[
  {name:'Hanging squishy stand',position:[3.0,0,-5.35],children:[box('Display base',[0,.1,0],[1.4,.2,.7],'wood'),box('Top rail',[0,1.85,0],[1.35,.09,.12],'wood'),...[-.6,.6].map(x=>box('Upright',[x,.94,0],[.09,1.8,.09],'wood')),...['rosie','blueberry','sunny','mochi','minty','peachy'].flatMap((id,n)=>{const x=(n%3-1)*.4,y=n<3?1.4:.7;return[merch(id,[x,y-.3,.1],.34),shape('Charm cord','cylinder',[x,(y+1.85)/2,.1],[.016,1.85-y,.016],'plum')];}),{name:'Display stand collision',tags:['migration.collider','collision:'+l.name,'index:92'],position:[0,.5,0],scale:[1.4,1,.7]}]},
  model('Leafy gift cubby plant',modelKey('furniture','plantSmall1'),[1.55,1.3,-5.65],.55),...flower([-3.8,.045,1.2],.72,'cream')
 ]});
 if(l.id==='collector')stage.children.push({name:'Moonbeam refinement · signature arch and endcap flowers',tags:['store.art','store.refinement:collector'],children:[
  box('Pink feature arch base',[-.25,1.05,-6.775],[4.8,2.1,.025],'blush'),shape('Pink feature arch crown','cylinder',[-.25,2.08,-6.775],[4.8,.025,1.95],'blush',[90,0,0]),
  ...[-1.7,1.65].map(x=>({name:'Daisy endcap sign',position:[x,1.17,2.03],children:[box('Cream frame',[0,0,0],[.63,.75,.065],'cream'),box('Lavender print',[0,0,.042],[.52,.64,.016],'lavender'),...flower([0,.02,.068],.38,'paper',true)]})),
  model('Tall leafy showcase plant',modelKey('furniture','plantSmall2'),[-3.25,0,-5.8],1.4),model('Leafy counter plant',modelKey('furniture','plantSmall2'),[4.18,1.17,-4.4],.56),model('Leafy collector shelf plant',modelKey('furniture','plantSmall2'),[-4.15,2.2,-3.3],.6),
  {name:'Showcase plant collision',tags:['migration.collider','collision:'+l.name,'index:93'],position:[-3.25,.5,-5.8],scale:[.7,1,.7]}
 ]});
 additions.push({parent:l.root,entity:stage});
 fs.writeFileSync('stores/plans/'+l.id+'.json',JSON.stringify({layout:l,edits,additions},null,2));console.log(l.id,edits.length+' edits',additions.length+' roots');
}
