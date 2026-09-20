import {Application,Asset,Entity,Color,StandardMaterial,FILLMODE_FILL_WINDOW,RESOLUTION_AUTO} from 'playcanvas';
import {startPilot} from './bedroom-pilot.mjs';
const snapshot=await(await fetch(new URL('./editor-scene.json',import.meta.url))).json();
const palette=await(await fetch(new URL('./editor-materials.json',import.meta.url))).json();
const app=new Application(document.querySelector('canvas'),{graphicsDeviceOptions:{antialias:true,alpha:false}});
app.setCanvasFillMode(FILLMODE_FILL_WINDOW);app.setCanvasResolution(RESOLUTION_AUTO);
const ambient=snapshot.settings.render.global_ambient;app.scene.ambientLight=new Color(...ambient);
const materials=new Map(palette.map(a=>{const m=new StandardMaterial();m.name=a.name;const d=a.data;m.diffuse=new Color(...d.diffuse);m.specular=new Color(...d.specular);m.shininess=d.shininess;m.useMetalness=true;m.metalness=0;m.update();const asset=new Asset(a.name,'material');asset.resource=m;asset.loaded=true;app.assets.add(asset);return [a.id,m];}));
const nodes=new Map(Object.entries(snapshot.entities).map(([id,d])=>{const e=new Entity(d.name,app);e.setGuid(id);e.setLocalPosition(...d.position);e.setLocalEulerAngles(...d.rotation);e.setLocalScale(...d.scale);e.enabled=d.enabled;e.tags.add(d.tags||[]);return [id,e];}));
for(const[id,d]of Object.entries(snapshot.entities)){const e=nodes.get(id);(nodes.get(d.parent)||app.root).addChild(e);for(const[type,raw]of Object.entries(d.components)){if(type==='script')continue;const c={...raw};delete c.offscreen;if(type==='render'){c.material=materials.get(c.materialAssets?.[0]);delete c.materialAssets;c.batchGroupId=-1;}if(type==='light')c.color=new Color(...c.color);if(type==='camera')c.clearColor=new Color(...c.clearColor);e.addComponent(type,c);}}
app.start();await startPilot(app);
