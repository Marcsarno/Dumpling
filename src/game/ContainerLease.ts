import {Asset,type Application,type ContainerResource} from 'playcanvas';
type Entry={asset:Asset;refs:number;promise:Promise<ContainerResource>};
const registries=new WeakMap<Application,Map<string,Entry>>();
/** The engine caches containers by URL. Unloading a duplicate Asset would destroy
 * geometry still used by another section, so every section shares one owner. */
export function leaseContainer(app:Application,url:string,name:string){
 let registry=registries.get(app);if(!registry){registry=new Map();registries.set(app,registry);}
 let entry=registry.get(url);
 if(!entry){const asset=new Asset(name,'container',{url});entry={asset,refs:0,promise:new Promise<ContainerResource>((resolve,reject)=>{asset.once('load',()=>resolve(asset.resource as ContainerResource));asset.once('error',reject);})};registry.set(url,entry);app.assets.add(asset);app.assets.load(asset);}
 entry.refs++;let released=false;const current=entry,owners=registry;
 return{asset:current.asset,ready:current.promise,release(){if(released)return;released=true;current.refs--;const dispose=()=>{if(current.refs===0&&owners.get(url)===current){owners.delete(url);current.asset.unload();app.assets.remove(current.asset);}};if(current.asset.loaded)dispose();else void current.promise.then(dispose,dispose);}};
}
