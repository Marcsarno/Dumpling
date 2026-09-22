import { BLEND_NORMAL, CULLFACE_NONE, Color, Entity, Mesh, MeshInstance, PRIMITIVE_TRIANGLES, StandardMaterial, type Application } from 'playcanvas';
import { SQUISHY_PRESENTATION, type SquishyPresentation } from '../data/squishyPresentation';
import type { Rarity } from '../data/collection';

/** One bounded, unlit mesh: soft halo, expanding ring, stars and gold rays.
 * No particle entities, textures, extra lights or screen filters; CPU buffers are reused.
 */
export class SquishyRevealVfx {
  readonly root:Entity;
  private readonly mesh:Mesh;
  private readonly material=new StandardMaterial();
  private readonly positions=new Float32Array(1536*3);
  private readonly colors=new Float32Array(1536*4);
  private readonly indices=new Uint16Array(4096);
  private vertices=0;private triangles=0;private previous=-100;
  private style:SquishyPresentation=SQUISHY_PRESENTATION.Common;
  private color=new Color();
  constructor(app:Application,parent:Entity){
    this.root=new Entity('Rarity halo and celebration',app);parent.addChild(this.root);
    this.root.setLocalPosition(0,1.02,-.10);this.root.setLocalEulerAngles(-14,10,0);
    this.material.name='Soft rarity light';this.material.useLighting=false;
    this.material.diffuse.set(0,0,0);this.material.emissive.set(1,1,1);
    this.material.emissiveVertexColor=true;this.material.opacityVertexColor=true;
    this.material.opacityVertexColorChannel='a';this.material.blendType=BLEND_NORMAL;
    this.material.cull=CULLFACE_NONE;this.material.depthWrite=false;this.material.useTonemap=false;this.material.update();
    this.mesh=new Mesh(app.graphicsDevice);this.mesh.clear(true,false,1536,4096);
    // MeshInstance caches available vertex channels at construction.
    this.mesh.setPositions([0,0,0,0,0,0,0,0,0]);this.mesh.setColors([1,1,1,0,1,1,1,0,1,1,1,0]);this.mesh.setIndices([0,1,2]);this.mesh.update(PRIMITIVE_TRIANGLES);
    const instance=new MeshInstance(this.mesh,this.material);instance.mask=16;
    this.root.addComponent('render',{meshInstances:[instance],castShadows:false,receiveShadows:false});
    this.root.enabled=false;
  }
  configure(rarity:Rarity){this.style=SQUISHY_PRESENTATION[rarity];this.color.fromString(this.style.color);this.previous=-100;}
  private vertex(x:number,y:number,a:number,white=0){const i=this.vertices++,p=i*3,c=i*4;this.positions[p]=x;this.positions[p+1]=y;this.positions[p+2]=0;this.colors[c]=this.color.r+(1-this.color.r)*white;this.colors[c+1]=this.color.g+(1-this.color.g)*white;this.colors[c+2]=this.color.b+(1-this.color.b)*white;this.colors[c+3]=a;return i;}
  private triangle(a:number,b:number,c:number){this.indices[this.triangles++]=a;this.indices[this.triangles++]=b;this.indices[this.triangles++]=c;}
  private disk(radius:number,alpha:number){const center=this.vertex(0,0,alpha,.35),edge=this.vertices;for(let i=0;i<=64;i++){const a=i*Math.PI/32;this.vertex(Math.cos(a)*radius,Math.sin(a)*radius,0);}for(let i=0;i<64;i++)this.triangle(center,edge+i,edge+i+1);}
  private ring(radius:number,width:number,alpha:number){const start=this.vertices;for(let i=0;i<=64;i++){const a=i*Math.PI/32;for(const r of [radius-width,radius,radius+width])this.vertex(Math.cos(a)*r,Math.sin(a)*r,r===radius?alpha:0,.35);}for(let i=0;i<64;i++)for(let j=0;j<2;j++){const a=start+i*3+j;this.triangle(a,a+3,a+1);this.triangle(a+1,a+3,a+4);}}
  private star(x:number,y:number,r:number,rotation:number,alpha:number){const center=this.vertex(x,y,alpha,.65),start=this.vertices;for(let i=0;i<=8;i++){const a=rotation+i*Math.PI/4,s=i%2?.24:1;this.vertex(x+Math.cos(a)*r*s,y+Math.sin(a)*r*s,alpha,.2);}for(let i=0;i<8;i++)this.triangle(center,start+i,start+i+1);}
  update(time:number,reduced:boolean){
    this.root.enabled=time>=0;if(time<0)return;
    if(time-this.previous<1/30&&time>=this.previous)return;this.previous=time;
    this.vertices=0;this.triangles=0;const s=this.style,t=Math.max(0,time),burst=reduced?0:Math.max(0,1-t/1.6);
    this.color.fromString(s.color);this.disk(1.25,s.halo+burst*s.burst);
    if(s.rays){this.ring(.84,.042,.28+(reduced?0:Math.sin(t*1.7)*.06));this.ring(1.03,.018,.14);}
    if(s.sparkles&&!reduced){
      this.color.fromString(s.spark);this.ring(.60+Math.min(t,1.5)*.27,s.rays?.035:.025,burst*.60);
      for(let i=0;i<s.sparkles;i++){
        const a=i*2.39996,r=.65+(1-Math.exp(-t*2.4))*(.20+(i%5)*.035);
        this.star(Math.cos(a)*r,Math.sin(a)*r+.10+t*.02,(.029+(i%3)*.014)*s.intensity,a+t*.35,burst*burst);
      }
      for(let i=0;i<s.rays;i++){
        const a=i*Math.PI*2/s.rays+.13,start=this.vertices,r=.80+Math.min(t,1.6)*.04,len=.20*burst;
        this.vertex(Math.cos(a-.028)*r,Math.sin(a-.028)*r,burst*.40);
        this.vertex(Math.cos(a)* (r+len),Math.sin(a)*(r+len),0,.5);
        this.vertex(Math.cos(a+.028)*r,Math.sin(a+.028)*r,burst*.40);
        this.triangle(start,start+1,start+2);
      }
      // Gentle persistent glitter distinguishes the high tiers after the initial reveal.
      const count=s.rays?12:s.sparkles>10?8:3;
      for(let i=0;i<count;i++){
        const a=.5+i*2.4,phase=(Math.sin(t*1.3+i*2.3)+1)/2,fade=Math.min(1,Math.max(0,t-1.3));
        this.star(Math.cos(a)*.94,Math.sin(a)*.83+.14,.022+.012*phase,a,phase**3*(s.rays?.9:s.sparkles>10?.65:.38)*fade);
      }
    }
    this.mesh.setPositions(this.positions,3,this.vertices);this.mesh.setColors(this.colors,4,this.vertices);
    this.mesh.setIndices(this.indices,this.triangles);this.mesh.update(PRIMITIVE_TRIANGLES);
  }
  hide(){this.root.enabled=false;this.previous=-100;}
  snapshot(){return {enabled:this.root.enabled,drawCalls:this.root.enabled?1:0,triangles:this.triangles/3,burstStars:this.style.sparkles,maxIdleGlints:this.style.rays?12:this.style.sparkles>10?8:this.style.sparkles?3:0};}
  destroy(){this.root.destroy();this.mesh.destroy();this.material.destroy();}
}
