import {readFileSync as read,writeFileSync as write,existsSync} from 'node:fs';
const data=JSON.parse(read('migration/layout-source.json','utf8'));
const envs=new Map(),materials=new Map();
if(existsSync('migration/editor-layout.json'))for(const {key,...m} of JSON.parse(read('migration/editor-layout.json','utf8')).materials)materials.set(JSON.stringify(m),{key,...m});
function mat(m){const key=JSON.stringify(m);if(!materials.has(key))materials.set(key,{key:'material-'+materials.size,...m});return materials.get(key).key;}
const env=name=>{if(!envs.has(name))envs.set(name,{name,tags:['migration.environment','scope:'+name],children:[],enabled:name==='Maple cottage'});return envs.get(name);};
const parentScope=s=>['Bedroom','Cleanup props','Daily routines'].includes(s)?'Maple cottage':s;
const groups=[];
for(const room of data.rooms){const e=env(room.name);room.obstacles.forEach((b,index)=>{
 const g={name:room.name==='Maple cottage'&&index<7?['Bed','Bookshelf','Nightstand','Toy chest','Desk','Stool','Floor plant'][index]:'Furniture '+(index+1),position:[b.center[0],0,b.center[2]],tags:['migration.prop','prop:'+room.name+':'+index],children:[],room:room.name,index,box:b};
 g.children.push({name:'Collision footprint',position:[0,b.center[1],0],scale:b.half.map(x=>x*2),tags:['migration.collider','collision:'+room.name,'index:'+index]});groups.push(g);e.children.push(g);
 });
 const areas={name:'Walkable areas',children:(room.walkable||[]).map((r,i)=>({name:r.name||'Walkable '+i,position:[(r.minX+r.maxX)/2,0,(r.minZ+r.maxZ)/2],scale:[r.maxX-r.minX,1,r.maxZ-r.minZ],tags:['walkable:'+room.name,'index:'+i]}))};e.children.push(areas);
}
function choose(scope,p,max=1.2){let best,score=Infinity;for(const g of groups.filter(g=>g.room===scope)){const dx=Math.max(0,Math.abs(p[0]-g.position[0])-g.box.half[0]),dz=Math.max(0,Math.abs(p[2]-g.position[2])-g.box.half[2]),d=Math.hypot(dx,dz)+Math.hypot(p[0]-g.position[0],p[2]-g.position[2])*.02;if(d<score&&d<max){score=d;best=g;}}return best;}
for(const r of data.records){const scope=parentScope(r.scope),e=env(scope),p=r.position;let g;
 if(r.scope==='Bedroom'){
  const i=/^(Bed |Headboard|Mattress|Pink duvet|Folded lavender|Pillow)/.test(r.name)?0:/^(Shelf |Book$|Storage basket|Basket label|Stacked book)/.test(r.name)?1:/^(Nightstand|Drawer|Lamp )/.test(r.name)?2:/^(Toy chest|Chest label)/.test(r.name)?3:/^(Desk |Notebook)/.test(r.name)?4:/^Stool/.test(r.name)?5:/^Plant/.test(r.name)?p[1]>1.8?1:p[0]>0?4:6:-1;
  if(i>=0)g=groups.find(g=>g.room===scope&&g.index===i);
 }else if(r.model||Math.max(r.scale[0],r.scale[2])<3.3)g=choose(scope,p,.65);
 const n={name:r.name,position:g?p.map((v,i)=>v-g.position[i]):p,rotation:r.rotation,scale:r.scale,tags:['migration.record','key:'+r.key],children:[]};
 if(r.render){n.material=mat(r.material);n.components={render:{...r.render,receiveShadows:true}};}
 if(r.model){n.children.push({name:'Model preview',position:r.offset,scale:r.normalization,tags:['migration.preview'],model:r.model,materials:r.modelMaterials.map(mat)});if(g&&g.name.startsWith('Furniture'))g.name=r.name.replace('Art ','');}
 (g||e).children.push(n);
}
function anchor(parent,name,pos,tags){parent.children.push({name,position:pos.map((v,i)=>v-(parent.position?.[i]||0)),tags});}
for(const i of data.interactions){const g=choose('Maple cottage',i.marker,1.6)||env('Maple cottage');anchor(g,i.id+' · stand',i.anchor,['anchor:'+i.id]);anchor(g,i.id+' · marker',i.marker,['marker:'+i.id]);if(i.placement)anchor(g,i.id+' · place',i.placement,['placement:'+i.id]);}
for(const s of data.stores){for(const i of s.sites){const g=groups.find(g=>g.room===s.name&&g.index===i.id);anchor(g,'Display '+i.id+' · stand',i.anchor,[s.name+':'+i.id+':anchor']);anchor(g,'Display '+i.id+' · marker',i.marker,[s.name+':'+i.id+':marker']);}anchor(env(s.name),'Store exit',s.exit,['exit:'+s.name]);}
function clean(n){delete n.room;delete n.index;delete n.box;n.children?.forEach(clean);}const roots=[...envs.values()];roots.forEach(clean);
write('migration/editor-layout.json',JSON.stringify({materials:[...materials.values()],roots},null,2));console.log(JSON.stringify({scopes:roots.map(r=>r.name),props:groups.length,materials:materials.size}));
