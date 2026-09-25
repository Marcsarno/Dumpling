import {Color,Entity,Mesh,MeshInstance,Texture,StandardMaterial,ADDRESS_REPEAT,FILTER_LINEAR_MIPMAP_LINEAR,type Application} from 'playcanvas';
import {material} from './primitives';
/** Small original painted surfaces, shared by the entire outdoor area. No extra lights. */
export function outdoorSurface(app:Application,kind:'grass'|'path'|'roof'){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d')!;let seed=137;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 ctx.fillStyle=kind==='grass'?'#8da46c':kind==='path'?'#d9c6a4':'#bc8179';ctx.fillRect(0,0,256,256);
 // Large overlapping translucent brush marks soften the tiling; small marks add restrained grain.
 for(let i=0;i<1500;i++){const x=random()*256,y=random()*256,r=i<90?14+random()*27:random()*1.2+.2;ctx.filter=i<90?'blur(10px)':'none';ctx.globalAlpha=i<90?.22:.65;ctx.fillStyle=kind==='grass'?(i%2?'rgba(75,105,59,.075)':'rgba(226,219,159,.10)'):kind==='path'?(i%2?'rgba(122,104,80,.12)':'rgba(255,246,217,.22)'):(i%2?'rgba(129,71,68,.07)':'rgba(245,189,151,.10)');for(const dx of [-256,0,256])for(const dy of [-256,0,256]){ctx.beginPath();ctx.ellipse(x+dx,y+dy,r,r*.75,0,0,Math.PI*2);ctx.fill();}}
 ctx.filter='none';ctx.globalAlpha=1;
 if(kind==='roof'){for(let y=0;y<256;y+=32){ctx.strokeStyle='rgba(101,63,65,.27)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,y+30);ctx.lineTo(256,y+30);ctx.stroke();for(let x=(y/32%2)*32;x<256;x+=64){ctx.strokeStyle='rgba(101,63,65,.16)';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+30);ctx.stroke();}ctx.strokeStyle='rgba(246,190,165,.30)';ctx.beginPath();ctx.moveTo(0,y+2);ctx.lineTo(256,y+2);ctx.stroke();}}
 const texture=new Texture(app.graphicsDevice,{name:'Painted outdoor '+kind,width:256,height:256,mipmaps:true,addressU:ADDRESS_REPEAT,addressV:ADDRESS_REPEAT,minFilter:FILTER_LINEAR_MIPMAP_LINEAR});texture.setSource(canvas);
 const mat=material('Painted '+kind,'#ffffff');mat.diffuseMap=texture;mat.gloss=.05;mat.specular.set(.025,.025,.025);if(kind==='roof')mat.diffuseMapTiling.set(2,3);mat.update();return mat;
}
export function gardenGround(app:Application,parent:Entity,grass:StandardMaterial,group:number){
 const positions:number[]=[],normals:number[]=[],uv:number[]=[],colors:number[]=[],indices:number[]=[];
 // World-aligned UVs and broad color drifts keep the large lawn from becoming a single flat rectangle.
 const patch=(x0:number,z0:number,w:number,d:number)=>{const nx=Math.ceil(w),nz=Math.ceil(d),start=positions.length/3;for(let z=0;z<=nz;z++)for(let x=0;x<=nx;x++){const wx=x0+x*w/nx,wz=z0+z*d/nz,v=1+.035*Math.sin(wx*.37+wz*.23)+.025*Math.sin(wx*.89-wz*.38);positions.push(wx,-.029,wz);normals.push(0,1,0);uv.push(wx/5,wz/5);colors.push(v,v,.99*v,1);}for(let z=0;z<nz;z++)for(let x=0;x<nx;x++){const i=start+z*(nx+1)+x;indices.push(i,i+nx+1,i+1,i+1,i+nx+1,i+nx+2);}};
 patch(-20,-36,54,40);patch(-9,4,4.8,6);
 const mesh=new Mesh(app.graphicsDevice);mesh.setPositions(positions);mesh.setNormals(normals);mesh.setUvs(0,uv);mesh.setColors(colors);mesh.setIndices(indices);mesh.update();grass.diffuseVertexColor=true;grass.update();const e=new Entity('World painted meadow',app);parent.addChild(e);e.addComponent('render',{meshInstances:[new MeshInstance(mesh,grass)],castShadows:false,batchGroupId:group});
}
/** Low, composed meadow fringes. One combined mesh; clear paths and fishing sightlines. */
export function meadowFringes(app:Application,parent:Entity,group:number){
 const p:number[]=[],n:number[]=[],c:number[]=[],idx:number[]=[];let seed=27;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const palette=['#758e55','#899f60','#aabd76','#b4bd79'].map(h=>new Color().fromString(h).linear());
 for(const [cx,cz,rx,rz,count] of [[-11.7,-8,1.3,1.3,80],[-11.5,-15,1.5,1.1,90],[-8.6,-16.5,2.3,.7,90],[-1.5,-5.7,1,.5,50],[4,-8,1.8,1,90],[-8.1,4.5,.35,2.3,65],[15.3,-31.2,1.4,1,70],[29,-30.7,1.1,1.3,70]]){
  for(let i=0;i<count;i++){const a=random()*Math.PI*2,r=Math.sqrt(random()),x=cx+Math.cos(a)*rx*r,z=cz+Math.sin(a)*rz*r,color=palette[i%4];for(let j=0;j<3;j++){const angle=random()*Math.PI*2,w=.025+random()*.025,h=.10+random()*.16,dx=Math.cos(angle)*w,dz=Math.sin(angle)*w,k=p.length/3;p.push(x-dx,.015,z-dz,x+dx,.015,z+dz,x+dx*2,h,z+dz*2);for(let q=0;q<3;q++){n.push(0,1,0);c.push(color.r,color.g,color.b,1);}idx.push(k,k+2,k+1,k+1,k+2,k);}}}
 const petals=['#f4df94','#e9aebe','#f7edce'].map(h=>new Color().fromString(h).linear()),heart=new Color().fromString('#cfa45a').linear();
 const disc=(x:number,y:number,z:number,r:number,color:Color)=>{const k=p.length/3;p.push(x,y+.008,z);n.push(0,1,0);c.push(color.r,color.g,color.b,1);for(let j=0;j<=8;j++){const a=j*Math.PI/4;p.push(x+Math.cos(a)*r,y,z+Math.sin(a)*r);n.push(0,1,0);c.push(color.r,color.g,color.b,1);if(j<8)idx.push(k,k+j+2,k+j+1);}};
 for(const [cx,cz,count] of [[-11.1,-8.4,7],[-10.5,-15.2,8],[-1.3,-5.8,6],[15.3,-30.7,7],[28.4,-30.6,7]])for(let i=0;i<count;i++){const a=i*2.4,x=cx+Math.cos(a)*(.2+i*.07),z=cz+Math.sin(a)*(.2+i*.05),y=.17+(i%3)*.045;for(let k=0;k<4;k++){const a=k*Math.PI/2;disc(x+Math.cos(a)*.045,y,z+Math.sin(a)*.045,.04,petals[i%3]);}disc(x,y+.014,z,.025,heart);}
 const mesh=new Mesh(app.graphicsDevice);mesh.setPositions(p);mesh.setNormals(n);mesh.setColors(c);mesh.setIndices(idx);mesh.update();const mat=material('Meadow edge blades and flowers','#ffffff');mat.diffuseVertexColor=true;mat.update();const e=new Entity('Composed meadow fringes',app);parent.addChild(e);e.addComponent('render',{meshInstances:[new MeshInstance(mesh,mat)],castShadows:false,batchGroupId:group});
}
