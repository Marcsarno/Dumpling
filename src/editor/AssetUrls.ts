import type {Application} from 'playcanvas';
let application:Application|undefined;
export function useEditorAssets(app:Application){application=app;}
export function containerOptions(sourcePath:string){return {crossOrigin:'anonymous' as const,image:{preprocess(image:{uri?:string}){
 if(application&&image.uri&&!/^(data:|https?:)/.test(image.uri)){
  const path=new URL(image.uri,new URL(sourcePath,'https://asset-path.invalid/')).pathname;
  image.uri=assetUrl(path);
 }
}}};}
export function assetUrl(path:string){
  if(!application)return path;
  const key=decodeURIComponent(path.replace(/^\/?assets\//,''));
  const asset=application.assets.find('game__'+key.replaceAll('/','__')+(key.endsWith('.glb')?'.bin':''));
  if(!asset)throw new Error('Missing migrated asset: '+key);
  return new URL(asset.getFileUrl()!,document.baseURI).href;
}
