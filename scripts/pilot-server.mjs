import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=resolve('.');
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.wav':'audio/wav','.glb':'model/gltf-binary'};
createServer(async(req,res)=>{try{
 const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const relative=p==='/engine.mjs'?'node_modules/playcanvas/build/playcanvas.mjs':p.startsWith('/assets/')||p==='/favicon.svg'?'public'+p:p==='/'?'pilot/index.html':p.slice(1);
 const file=resolve(root,relative);if(!file.startsWith(root+'\\'))throw Error('Outside preview');
 const data=await readFile(file);res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.setHeader('Accept-Ranges','bytes');
 const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);if(range){const start=Number(range[1]),end=Math.min(Number(range[2]||data.length-1),data.length-1);if(start>end){res.writeHead(416,{'Content-Range':`bytes */${data.length}`});res.end();return;}res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${data.length}`,'Content-Length':end-start+1});res.end(data.subarray(start,end+1));}else{res.setHeader('Content-Length',data.length);res.end(data);}
 }catch{res.statusCode=404;res.end('Not found');}
}).listen(5186,'127.0.0.1',()=>console.log('Isolated migration: http://127.0.0.1:5186/migration/index.html'));
