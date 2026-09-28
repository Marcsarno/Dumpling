import {StandardMaterial,Vec3,Quat,type Application,type Entity,type GraphNode} from 'playcanvas';
import {schoolPerson,personMeshes} from './SchoolPerson';
import {material,primitives} from './primitives';
export async function schoolCook(app:Application,parent:Entity){
 const person=await schoolPerson(app,parent,'remy','Friendly lunch cook',1.84);person.root.setLocalPosition(.3,.37,-6.18);
 for(const mesh of personMeshes(person.model)){if(/red|LightBrown/i.test(mesh.material.name)){const mat=mesh.material.clone() as StandardMaterial;mat.diffuse.set(.93,.91,.84);mat.update();mesh.material=mat;}}
 const head=person.model.findByName('Head')! as Entity,shape=primitives(app,head),white=material('Chef cotton','#fff8e9'),size=.24/person.scale;
 shape('Chef hat band','cylinder',[0,size*.96,0],[size*1.65,size*.32,size*1.4],white);
 for(const x of [-.5,0,.5])shape('Soft chef cap','sphere',[x*size,size*1.25,0],[size*.95,size*.66,size*1.5],white);
 primitives(app,parent)('Kitchen standing platform','box',[.3,.175,-6.18],[1.1,.35,.8],material('Kitchen platform','#b6bac2'));
 let serving=0;const begin=()=>{serving=1.1;};
 const aim=(node:GraphNode,child:GraphNode,target:Vec3,weight:number)=>{const original=node.getRotation().clone(),from=child.getPosition().clone().sub(node.getPosition()).normalize(),to=target.clone().sub(node.getPosition()).normalize();node.setRotation(new Quat().slerp(original,new Quat().mul2(new Quat().setFromDirections(from,to),original),weight));};
 const update=(dt:number)=>{if(serving<=0)return;serving=Math.max(0,serving-dt);const t=1-serving/1.1,weight=Math.sin(Math.PI*t);for(const [side,sign]of [['L',1],['R',-1]] as const){const arm=person.model.findByName('UpperArm.'+side)!,fore=person.model.findByName('LowerArm.'+side)!,hand=person.model.findByName('Wrist.'+side)!,origin=arm.getPosition().clone(),target=new Vec3(4.6+sign*.18,1.4,-21.5+Math.max(0,(t-.4)/.6)*.7),a=origin.distance(fore.getPosition()),b=fore.getPosition().distance(hand.getPosition()),delta=target.clone().sub(origin),d=Math.min(delta.length(),a+b-.005);delta.normalize();const pole=new Vec3(sign,-.5,0);pole.sub(delta.clone().mulScalar(pole.dot(delta))).normalize();const along=(a*a-b*b+d*d)/(2*d),elbow=origin.clone().add(delta.clone().mulScalar(along)).add(pole.mulScalar(Math.sqrt(Math.max(0,a*a-along*along))));aim(arm,fore,elbow,weight);aim(fore,hand,target,weight);}};
 app.on('home-play:serve',begin);app.on('postupdate',update);person.root.once('destroy',()=>{app.off('home-play:serve',begin);app.off('postupdate',update);white.destroy();});
 return person.root;
}
