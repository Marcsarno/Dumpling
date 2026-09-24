import {Entity,Mat4,Mesh,MeshInstance,Vec3,type Application,type RenderComponent} from 'playcanvas';
/** Deform only the few hundred vertices in the original rod; keep its reel and cork detail. */
export function flexibleRod(app:Application,root:Entity,source:Entity){
 const inverse=new Mat4().copy(root.getWorldTransform()).invert(),parts:{mesh:Mesh;positions:number[];normals:number[]}[]=[];
 const output=new Entity('Flexible rod mesh',app);root.addChild(output);const instances:MeshInstance[]=[];
 for(const render of source.findComponents('render') as RenderComponent[]){for(const original of render.meshInstances){
  const positions:number[]=[],normals:number[]=[],indices:number[]=[],uv:number[]=[];original.mesh.getPositions(positions);original.mesh.getNormals(normals);original.mesh.getIndices(indices);original.mesh.getUvs(0,uv);const transform=new Mat4().mul2(inverse,original.node.getWorldTransform());
  for(let i=0;i<positions.length;i+=3){const p=transform.transformPoint(new Vec3(positions[i],positions[i+1],positions[i+2])),n=transform.transformVector(new Vec3(normals[i],normals[i+1],normals[i+2])).normalize();positions.splice(i,3,p.x,p.y,p.z);normals.splice(i,3,n.x,n.y,n.z);}
  const mesh=new Mesh(app.graphicsDevice);mesh.setPositions(positions);mesh.setNormals(normals);if(uv.length)mesh.setUvs(0,uv);mesh.setIndices(indices);mesh.update();instances.push(new MeshInstance(mesh,original.material,output));parts.push({mesh,positions,normals});
 }render.enabled=false;}
 output.addComponent('render',{meshInstances:instances,castShadows:true});let bend=0;
 return{update(amount:number,dt:number){bend+=(amount-bend)*Math.min(1,dt*12);for(const p of parts){const positions=p.positions.slice(),normals=p.normals.slice();for(let i=0;i<positions.length;i+=3){const t=Math.max(0,Math.min(1,(positions[i+1]-.35)/1.47));positions[i+2]+=bend*t*t;const n=new Vec3(normals[i],normals[i+1]-2*bend*t/1.47*normals[i+2],normals[i+2]).normalize();normals[i]=n.x;normals[i+1]=n.y;normals[i+2]=n.z;}p.mesh.setPositions(positions);p.mesh.setNormals(normals);p.mesh.update();}},tip:()=>root.getWorldTransform().transformPoint(new Vec3(0,1.82,bend))};
}
