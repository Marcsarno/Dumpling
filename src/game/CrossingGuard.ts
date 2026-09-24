import {Entity,Vec3,Texture,StandardMaterial,CULLFACE_NONE,type Application} from 'playcanvas';
import {material,primitives} from './primitives';
import {schoolPerson} from './SchoolPerson';
/** The actual Quaternius Worker, with her original vest and safety helmet. */
export async function crossingGuard(app:Application,parent:Entity){
 const person=await schoolPerson(app,parent,'crossing-guard','Ms Maple crossing guard',1.8);person.root.setLocalPosition(20,.09,-18);
 const paddle=new Entity('Handheld STOP paddle',app);parent.addChild(paddle);const shape=primitives(app,paddle);shape('Paddle handle','cylinder',[0,.12,0],[.026,.4,.026],material('Paddle handle','#eee4d0'));
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d')!;c.beginPath();for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;c.lineTo(128+118*Math.cos(a),128+118*Math.sin(a));}c.closePath();c.fillStyle='#bd5b5c';c.fill();c.lineWidth=10;c.strokeStyle='#fff5e7';c.stroke();c.fillStyle='#fff5e7';c.font='bold 62px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('STOP',128,131);
 const texture=new Texture(app.graphicsDevice,{mipmaps:false});texture.setSource(canvas);const mat=new StandardMaterial();mat.diffuseMap=texture;mat.opacityMap=texture;mat.opacityMapChannel='a';mat.alphaTest=.5;mat.cull=CULLFACE_NONE;mat.update();const face=new Entity('Octagonal STOP sign',app);paddle.addChild(face);face.addComponent('render',{type:'plane',material:mat,castShadows:false});face.setLocalPosition(0,.4,0);face.setLocalScale(.45,1,.45);face.setLocalEulerAngles(90,0,0);
 let last=-10,near=false;return{root:person.root,update(t:number,p:Vec3){const close=p.distance(person.root.getPosition())<5,greet=close&&!near&&t-last>5;if(greet)last=t;person.update(t,greet);near=close;paddle.setPosition(person.model.findByName('Wrist.L')!.getPosition());paddle.setEulerAngles(0,0,-12);}};
}
