import {Application,BoundingBox,Color,Entity,Script,Vec3,StandardMaterial} from 'playcanvas';
import {createCharacter,loadArianna} from '../components/CharacterVisual';
import {PlayerController} from '../components/PlayerController';
import {CarrySystem} from '../components/CarrySystem';
import {IsometricCamera} from '../game/IsometricCamera';
import {VirtualJoystick} from '../ui/VirtualJoystick';
import {ActionButton} from '../ui/ActionButton';
import {MissionSystem} from '../systems/MissionSystem';
import {InteractionSystem} from '../systems/InteractionSystem';
import {SurfaceTextures} from '../game/SurfaceTextures';
import type {Bedroom} from '../game/bedroom';
import type {CleanupItem,Interaction} from '../game/cleanupProps';
const SAVE='dumpling.editorPilot.book.v1';
const css=`html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#ede6f4;font-family:system-ui,sans-serif;touch-action:none}canvas{display:block!important;position:fixed;inset:0;width:100%!important;height:100%!important}#pilot-ui{position:fixed;inset:0;pointer-events:none;color:#51445b}#pilot-ui header{position:absolute;top:max(16px,env(safe-area-inset-top));left:16px;right:16px;background:#fff8f0ed;border:1px solid #e4d4e6;border-radius:18px;padding:14px 16px;box-shadow:0 4px 18px #5b396914}#pilot-ui h1{font-size:19px;margin:0 0 4px}#pilot-ui p{font-size:13px;line-height:1.4;margin:0}#pilot-ui button{pointer-events:auto;touch-action:none;cursor:pointer;font:600 14px system-ui;border:1px solid #d4badb;border-radius:18px;background:#fff7fa;color:#51445b}#joystick{position:absolute;left:22px;bottom:max(28px,env(safe-area-inset-bottom));width:116px;height:116px;border:2px solid #bba2c5;border-radius:50%;background:#f9f0f9bc;pointer-events:auto;touch-action:none;display:grid;place-items:center}#joystick-knob{width:48px;height:48px;border-radius:50%;background:#b99aca;border:4px solid #fff5;box-shadow:0 3px 8px #70587e30}#action-button{position:absolute;right:20px;bottom:max(38px,env(safe-area-inset-bottom));width:138px;min-height:88px;padding:12px}#action-button:disabled{opacity:.65}#pilot-reset{position:absolute;right:16px;top:114px;padding:8px 12px;font-size:11px!important}#pilot-status{position:absolute;bottom:170px;left:24px;right:24px;text-align:center;font-size:13px;background:#fff9efde;border-radius:12px;padding:8px} @media(max-height:600px){#pilot-ui header{padding:8px 12px;top:8px}#pilot-ui h1{font-size:16px}#pilot-reset{top:93px}#pilot-status{bottom:141px}#joystick{width:98px;height:98px;bottom:20px}#action-button{bottom:25px;min-height:78px;width:126px}}`;

/** Glue only: all room visuals/prop anchors come from the saved Editor scene. */
export async function startPilot(app:Application){
 const style=document.createElement('style');style.textContent=css;document.head.append(style);
 const ui=document.createElement('div');ui.id='pilot-ui';ui.innerHTML=`<header><h1>Arianna’s bedroom</h1><p>Pick up the blue book and put it back on the bookshelf.</p></header><button id="pilot-reset">Try again</button><div id="pilot-status" role="status">Getting ready…</div><div id="joystick" role="group" aria-label="Movement joystick"><div id="joystick-knob"></div></div><button id="action-button" disabled>Come closer</button>`;document.body.append(ui);
 const root=app.root.findByName('Arianna bedroom') as Entity;if(!root)throw Error('Saved Editor bedroom is missing');
 const find=(name:string)=>{const e=root.findByName(name) as Entity;if(!e)throw Error('Missing scene entity '+name);return e;};
 const shelf=find('Bookshelf'),placement=find('Book placement'),destination=find('Book standing point'),marker=find('Book marker'),book=root.findByTag('pilot.book')[0] as Entity;if(!book)throw Error('Missing tagged chore book');
 const bounds=find('Room bounds'),boundsBox=new BoundingBox();boundsBox.setFromTransformedAabb(new BoundingBox(new Vec3(),new Vec3(.5,.5,.5)),bounds.getWorldTransform());
 const room:Bedroom={root,obstacles:[],halfWidth:3.3,halfDepth:3.6,walkable:[{minX:boundsBox.center.x-boundsBox.halfExtents.x,maxX:boundsBox.center.x+boundsBox.halfExtents.x,minZ:boundsBox.center.z-boundsBox.halfExtents.z,maxZ:boundsBox.center.z+boundsBox.halfExtents.z}]};
 const colliderNodes=root.findByTag('pilot.collider') as Entity[];
 const refreshBounds=()=>{room.obstacles=colliderNodes.map(e=>{const b=new BoundingBox();b.setFromTransformedAabb(new BoundingBox(new Vec3(),new Vec3(.5,.5,.5)),e.getWorldTransform());return b;});};refreshBounds();
 const camera=new IsometricCamera(app,app.root.findByName('Camera') as Entity);
 camera.entity.camera!.projection=1;camera.entity.camera!.clearColor=new Color().fromString('#ede6f4');camera.entity.camera!.farClip=60;
 const character=createCharacter(app);character.player.setPosition(find('Player start').getPosition());
 const joystick=new VirtualJoystick(document.querySelector('#joystick')!,document.querySelector('#joystick-knob')!);
 const controller=new PlayerController(character.player,camera.entity,room,joystick.value);
 const carry=new CarrySystem(app,character.visual);character.animator.bindCarrySocket(carry.socket);
 const mission=new MissionSystem();mission.configure([{id:'book',name:'Book',icon:'📘'}],false);mission.start(performance.now());
 const bookHome=book.getPosition().clone();const item:CleanupItem={id:'book',name:'Book',icon:'📘',entity:book,home:bookHome.toArray() as [number,number,number]};
 const pickup:Interaction={id:'pickup-book',name:'Book',icon:'📘',kind:'pickup',item:'book',anchor:bookHome.clone(),marker:bookHome.clone().add(new Vec3(0,.6,0)),range:.85};
 const drop:Interaction={id:'bookshelf',name:'Bookshelf',icon:'📘',kind:'place',item:'book',task:'book',anchor:destination.getPosition().clone(),marker:marker.getPosition().clone(),range:1.05,placement:placement.getPosition().toArray() as [number,number,number]};
 const interactions=new InteractionSystem([pickup,drop]);let ready=false,aligning=false;const button=document.querySelector<HTMLButtonElement>('#action-button')!,status=document.querySelector<HTMLElement>('#pilot-status')!;
 const atShelf=()=>{book.reparent(shelf);book.setLocalPosition(placement.getLocalPosition());book.setLocalEulerAngles(0,0,0);};
 if(localStorage.getItem(SAVE)==='complete'){mission.complete('book',performance.now());atShelf();}
 document.querySelector('#pilot-reset')!.addEventListener('click',()=>{localStorage.removeItem(SAVE);location.reload();});
 const events:string[]=[];
 new ActionButton(button,()=>{
  interactions.update(character.player.getPosition(),carry.item?.id??null,mission);const target=interactions.focus;
  if(!ready||!target||aligning||character.animator.busy)return;
  const point=(target===pickup?book.getPosition():placement.getPosition()).clone();aligning=true;
  controller.approachProp(point,()=>{aligning=false;camera.beginChore(character.player.getPosition(),point);
   character.animator.playAction(target===pickup?'PickUp':'PutDown',target===pickup?.25:.3,()=>{
    if(target===pickup){if(carry.pickUp(item)){character.animator.setCarrying(true);events.push('pickup');}}
    else if(carry.item?.id==='book'&&mission.complete('book',performance.now())){carry.release(app.root,placement.getPosition().toArray() as [number,number,number]);atShelf();character.animator.setCarrying(false);localStorage.setItem(SAVE,'complete');events.push('placed');}
   },point);
  },()=>{aligning=false;});
 },()=>{});
 const surfaces=new SurfaceTextures(app);for(const a of app.assets.list()){if(a.type==='material'&&a.resource){const m=a.resource as StandardMaterial;if(m.name==='Honey birch')surfaces.apply(m,'wood');if(m.name==='Lilac rug')surfaces.apply(m,'rug');}}
 const resolveAsset=(path:string)=>{const name=path.endsWith('arianna.glb')?'pilot-arianna-original.bin':'pilot-'+path.split('/').pop();const asset=app.assets.find(name);return asset?.getFileUrl()??'/'+path;};
 app.graphicsDevice.maxPixelRatio=Math.min(devicePixelRatio||1,1.75);
 const resize=()=>{app.resizeCanvas(innerWidth,innerHeight);camera.resize(innerWidth,innerHeight);};resize();window.addEventListener('resize',resize);
 let lastBounds='';app.on('update',(elapsed:number)=>{
  const dt=document.hidden?0:Math.min(elapsed,.04),now=performance.now();
  const signature=colliderNodes.map(e=>Array.from(e.getWorldTransform().data).join(',')).join(';');if(signature!==lastBounds){refreshBounds();controller.setRoom(room);lastBounds=signature;}
  drop.anchor.copy(destination.getPosition());drop.marker.copy(marker.getPosition());drop.placement=placement.getPosition().toArray() as [number,number,number];
  if(!carry.item&&!mission.completed.has('book'))pickup.anchor.copy(book.getPosition());
  controller.enabled=ready&&!character.animator.busy;controller.update(dt);camera.follow(character.player.getPosition(),dt);
  character.animator.update(dt,controller.velocity,elapsed);character.grounding?.update();
  if(!character.animator.busy)camera.endChore();
  interactions.update(character.player.getPosition(),carry.item?.id??null,mission);
  button.disabled=!ready||!interactions.focus||aligning||character.animator.busy;
  button.textContent=aligning?'Moving closer…':character.animator.actionName??(mission.completed.has('book')?'All tidy!':interactions.focus===pickup?'Pick up book':interactions.focus===drop?'Put book away':'Come closer');
  status.textContent=!ready?'Getting ready…':mission.completed.has('book')?'Lovely! The book is back where it belongs.':carry.item?'Take the book to the bookshelf.':'Find the blue book on the floor.';
 });
 (window as any).__pilot={snapshot:()=>({ready,position:character.player.getPosition().toArray(),velocity:controller.velocity.toArray(),cameraRight:camera.entity.right.toArray(),cameraForward:camera.entity.forward.toArray(),character:character.animator.snapshot(),animation:character.animator.currentState,carrying:carry.item?.id??null,completed:mission.completed.has('book'),focus:interactions.focus?.id,aligning,book:book.getPosition().toArray(),shelf:shelf.getPosition().toArray(),destination:destination.getPosition().toArray(),placement:placement.getPosition().toArray(),obstacles:room.obstacles.map(b=>({center:b.center.toArray(),half:b.halfExtents.toArray()})),events:[...events],saveKeys:Object.keys(localStorage),drawCalls:app.stats.drawCalls.total}),geometry:()=>character.animator.geometrySnapshot()};
 await loadArianna(app,character,resolveAsset);if(character.placeholder.enabled)throw Error('Original Arianna did not load');ready=true;document.body.dataset.pilotReady='true';
}
export class BedroomPilot extends Script{
 static scriptName='bedroomPilot';
 initialize(){startPilot(this.app as Application).catch(e=>{console.error(e);const label=document.querySelector('#pilot-status');if(label)label.textContent='Unable to load the bedroom.';});}
}
