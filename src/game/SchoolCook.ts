import {StandardMaterial,type Application,type Entity,type RenderComponent} from 'playcanvas';
import {schoolPerson} from './SchoolPerson';
import {material,primitives} from './primitives';
export async function schoolCook(app:Application,parent:Entity){
 const person=await schoolPerson(app,parent,'remy','Friendly lunch cook',1.84);person.root.setLocalPosition(.3,.37,-6.18);
 for(const render of person.model.findComponents('render') as RenderComponent[])for(const mesh of render.meshInstances){if(/red|LightBrown/i.test(mesh.material.name)){const mat=mesh.material.clone() as StandardMaterial;mat.diffuse.set(.93,.91,.84);mat.update();mesh.material=mat;}}
 const head=person.model.findByName('Head')! as Entity,shape=primitives(app,head),white=material('Chef cotton','#fff8e9'),size=.24/person.scale;
 shape('Chef hat band','cylinder',[0,size*.96,0],[size*1.65,size*.32,size*1.4],white);
 for(const x of [-.5,0,.5])shape('Soft chef cap','sphere',[x*size,size*1.25,0],[size*.95,size*.66,size*1.5],white);
 primitives(app,parent)('Kitchen standing platform','box',[.3,.175,-6.18],[1.1,.35,.8],material('Kitchen platform','#b6bac2'));
 return person.root;
}
