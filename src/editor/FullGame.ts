import {Script,type Application} from 'playcanvas';
import {useEditorAssets,assetUrl} from './AssetUrls';
import page from '../../index.html';
import styles from '../../migration/local.css';
export async function startEditorGame(app:Application){
 (window as any).__editorMode=true;
 useEditorAssets(app);
 const style=document.createElement('style');style.textContent=styles+'\nhtml,body{margin:0;width:100%;height:100%;overflow:hidden}';document.head.append(style);
 const icon=document.createElement('link');icon.rel='icon';icon.href='data:,';document.head.append(icon);
 const parsed=new DOMParser().parseFromString(page,'text/html'),game=parsed.querySelector('#game')!;
 const canvas=app.graphicsDevice.canvas as HTMLCanvasElement;canvas.id='game-canvas';canvas.style.cssText='';game.querySelector('canvas')!.replaceWith(canvas);document.body.append(game);
 const credits=game.querySelector<HTMLAnchorElement>('.asset-credits')!;credits.href=assetUrl('assets/asset-credits.html');
 const {startGame}=await import('../main');await startGame(app);
}
export class FullGame extends Script{
 static scriptName='fullGame';
 initialize(){void startEditorGame(this.app as Application).catch(e=>{console.error('Full game migration failed',e);const error=document.querySelector<HTMLElement>('#error');if(error)error.hidden=false;});}
}
