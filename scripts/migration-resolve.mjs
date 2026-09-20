import {readFileSync as read,writeFileSync as write,mkdirSync} from 'node:fs';
const layout=JSON.parse(read('migration/editor-layout.json')),mats=JSON.parse(read('migration/material-ids.json')),templates=JSON.parse(read('migration/native-templates.json'));
function resolve(n){
 if(n.material){n.components.render.materialAssets=[mats[n.material]];delete n.material;}
 if(n.model){
  const name='layout__'+n.model.replaceAll('/','__').replace(/\.glb$/,''),template=templates.find(t=>t.name===name);if(!template)throw Error('Missing native model '+name);
  const source=template.data.entities;let mi=0;
  function tree(r){const c=structuredClone(r.components||{});if(c.render)c.render.materialAssets=(c.render.materialAssets||[]).map(()=>mats[n.materials[mi++]]);return{name:r.name,position:r.position,rotation:r.rotation,scale:r.scale,enabled:r.enabled,components:c,children:r.children.map(id=>tree(source[id]))};}
  n.children=Object.values(source).filter(r=>!r.parent).map(tree);delete n.model;delete n.materials;
 }
 n.children?.forEach(resolve);return n;
}
layout.roots.forEach(resolve);write('migration/resolved-layout.json',JSON.stringify(layout.roots));
mkdirSync('migration/entity-batches',{recursive:true});let count=0;const batches=[];
for(const [scope,root] of layout.roots.entries())for(let i=0;i<root.children.length;i+=25){const file=`migration/entity-batches/${count++}.json`;write(file,JSON.stringify({scope,children:root.children.slice(i,i+25)}));batches.push(file);}
write('migration/entity-batches/index.json',JSON.stringify(batches));console.log(JSON.stringify({batches:batches.length,scopes:layout.roots.map(r=>({name:r.name,tags:r.tags,enabled:r.enabled}))}));
