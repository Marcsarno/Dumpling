import { ADDRESS_REPEAT, FILTER_LINEAR_MIPMAP_LINEAR, Texture, type Application, type StandardMaterial } from 'playcanvas';

/** Tiny repeating surface details; tint and silhouettes remain the approved art's own. */
export class SurfaceTextures {
  private readonly maps = new Map<string, Texture>();
  constructor(private app: Application) {}
  apply(material: StandardMaterial, kind: 'wood' | 'fabric' | 'rug', tiling=kind==='rug'?4:2) {
    if(!this.maps.has(kind)) {
      const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
      const context=canvas.getContext('2d')!, pixels=context.createImageData(256,256);
      for(let y=0;y<256;y++)for(let x=0;x<256;x++) {
        const weave=Math.sin(x*Math.PI/8)*Math.sin(y*Math.PI/8);
        const grain=Math.sin(y*Math.PI/16+Math.sin(x*Math.PI/128)*.7);
        const fiber=Math.sin(x*Math.PI/4+y*Math.PI/8)*2;
        const value=kind==='wood'?244+grain*7+Math.sin(y*Math.PI/2)*2:
          kind==='rug'?240+weave*8+Math.sin(y*Math.PI/8)*3+fiber:242+weave*9+fiber;
        const i=(y*256+x)*4;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=value;pixels.data[i+3]=255;
      }
      context.putImageData(pixels,0,0);
      const texture=new Texture(this.app.graphicsDevice,{name:`Subtle ${kind} surface`,mipmaps:true,
        minFilter:FILTER_LINEAR_MIPMAP_LINEAR,addressU:ADDRESS_REPEAT,addressV:ADDRESS_REPEAT});
      texture.setSource(canvas);this.maps.set(kind,texture);
    }
    material.diffuseMap=this.maps.get(kind)!;
    material.diffuseMapTiling.set(tiling,tiling);
    material.update();
  }
}
