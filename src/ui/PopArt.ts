import {assetUrl} from '../editor/AssetUrls';
/** Reference-led 2D art only. No unfinished world models are used in Squishy Pop. */
export class PopArt {
  readonly friends=new Map<string,HTMLCanvasElement>();
  readonly powers=new Map<string,HTMLCanvasElement>();
  private ready?:Promise<void>;
  load(){return this.ready??=this.loadAll().catch(error=>{this.ready=undefined;throw error;});}
  private async atlas(file:string,ids:string[],columns:number,target:Map<string,HTMLCanvasElement>,power=false){
    const image=new Image();image.crossOrigin='anonymous';image.src=assetUrl('/assets/pop/'+file+'.png');await image.decode();const rows=Math.ceil(ids.length/columns);
    ids.forEach((id,index)=>{const canvas=document.createElement('canvas');canvas.width=192;canvas.height=192;const c=canvas.getContext('2d')!;
      const sx=index%columns*image.width/columns,sy=power?(index<3?.10:.55)*image.height:Math.floor(index/columns)*image.height/rows;
      const sw=image.width/columns,sh=power?image.height*(index<3?.43:.35):image.height/rows;
      // Trim a small atlas gutter so a neighboring orbit/fuse cannot leak into a cell.
      const inset=sw*.028,inner=sw-inset*2,scale=Math.min(192/inner,192/sh),w=inner*scale,h=sh*scale;c.drawImage(image,sx+inset,sy,inner,sh,(192-w)/2,(192-h)/2,w,h);target.set(id,canvas);
    });
  }
  private async loadAll(){await Promise.all([
    this.atlas('garden-atlas',['mochi','rosie','minty','blueberry','sunny','lavendream','peachy','stardrop'],4,this.friends),
    this.atlas('treats-cutout',['shortcake','custard','cocoa','macaron','sorbet','sugarstar'],3,this.friends),
    this.atlas('animals-cutout',['bunny','kitten','panda','fox','sleepykoala','goldenbear'],3,this.friends),
    this.atlas('cosmic-cutout',['moonbean','comet','nebula','orbit','aurora','supernova'],3,this.friends),
    this.atlas('power-atlas',['bomb','rainbow','mega','ticket','frenzy','heart'],3,this.powers,true)
  ]);}
}
