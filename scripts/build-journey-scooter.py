"""Original child-sized kick scooter. Blender 5.x; metres; glTF +Z forward.
Keep the steering and wheel pivots for gameplay, merge the stationary pieces.
"""
import bpy, math
from pathlib import Path
from mathutils import Vector
root=Path.cwd(); out=root/'public/assets/outdoors'; out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
def mat(name,color,metal=0,rough=.42):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 return m
lilac=mat('Powder coated lavender',(.51,.32,.71),.18)
mint=mat('Mint enamel',(.28,.66,.57),.15)
cream=mat('Warm cream trim',(.94,.86,.65))
rubber=mat('Soft charcoal rubber',(.07,.085,.11),0,.8)
silver=mat('Brushed aluminum',(.56,.62,.65),.7,.27)
grip=mat('Plum grip tape',(.20,.12,.29),0,.94)
gold=mat('Honey brass bell',(.83,.51,.16),.65,.25)
def pos(p):return (p[0],-p[2],p[1])
def parent(name,p=(0,0,0),par=None):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=pos(p);o.parent=par;return o
body=parent('Scooter chassis')
steer=parent('Steering pivot',(0,.12,.43))
def finish(o,name,m,par):
 o.name=name;o.data.materials.append(m)
 bpy.context.view_layer.update()
 if par:mw=o.matrix_world.copy();o.parent=par;o.matrix_world=mw
 return o
def box(name,p,size,m,bevel=.015,par=body):
 bpy.ops.mesh.primitive_cube_add(size=1,location=pos(p));o=bpy.context.object;o.dimensions=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  mod=o.modifiers.new('Soft manufactured edges','BEVEL');mod.width=bevel;mod.segments=3;bpy.ops.object.modifier_apply(modifier=mod.name)
  mod=o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=mod.name)
 return finish(o,name,m,par)
def rod(name,a,b,r,m,par=body):
 a,b=Vector(pos(a)),Vector(pos(b));bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=r,depth=(b-a).length,location=(a+b)/2);o=bpy.context.object;o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
 for p in o.data.polygons:p.use_smooth=True
 return finish(o,name,m,par)
box('Rounded deck',(0,.145,-.045),(.34,.07,.78),lilac,.042)
box('Raised grip pad',(0,.183,-.07),(.295,.012,.64),grip,.025)
for z in [-.30,-.23,-.16,-.09,-.02,.05,.12]:box('Grip tape ribs',(0,.191,z),(.25,.003,.007),lilac,.002)
for x in [-.164,.164]:box('Cream sidewall pinstripe',(x,.15,-.05),(.006,.015,.64),cream,.003)
for z in [-.45,.43]:
 wheel=parent('Rear wheel' if z<0 else 'Front wheel',(0,.115,z),body if z<0 else steer)
 # Parent at the correct world pivot before child creation.
 bpy.context.view_layer.update();wheel.matrix_world.translation=Vector(pos((0,.115,z)));bpy.context.view_layer.update()
 rod('Rounded tire',(-.045,.115,z),(.045,.115,z),.113,rubber,wheel)
 rod('Mint hub',(-.047,.115,z),(.047,.115,z),.074,mint,wheel)
 rod('Axle',(-.052,.115,z),(.052,.115,z),.021,silver,wheel)
 for a in range(0,360,60):
  y=.115+math.sin(math.radians(a))*.044;zz=z+math.cos(math.radians(a))*.044
  rod('Wheel spoke',(-.048,y,zz),(.048,y,zz),.008,cream,wheel)
for x in [-.061,.061]:
 rod('Rear dropout',(x,.115,-.45),(x,.15,-.31),.014,silver)
 rod('Front fork',(x,.115,.43),(x,.27,.405),.016,lilac,steer)
rod('Deck neck',(0,.16,.23),(0,.28,.405),.035,lilac)
rod('Lower stem',(0,.25,.405),(0,.67,.345),.031,mint,steer)
rod('Telescoping silver stem',(0,.60,.355),(0,1.005,.30),.020,silver,steer)
rod('Stem collar',(0,.60,.355),(0,.65,.348),.037,lilac,steer)
rod('T bar',(-.265,1.005,.30),(.265,1.005,.30),.021,lilac,steer)
for side in [-1,1]:
 rod('Soft handle grip',(side*.165,1.005,.30),(side*.268,1.005,.30),.028,rubber,steer)
 rod('Mint end cap',(side*.268,1.005,.30),(side*.282,1.005,.30),.033,mint,steer)
 for i in range(7):rod('Grip ring',(side*(.175+i*.012),1.005,.30),(side*(.178+i*.012),1.005,.30),.0295,lilac,steer)
box('Rear step brake',(0,.241,-.44),(.145,.025,.16),mint,.023)
rod('Bell mount',(.11,1.005,.30),(.11,1.06,.30),.01,silver,steer)
bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=.042,location=pos((.11,1.055,.30)));o=bpy.context.object;o.scale.z=.45;finish(o,'Little brass bell',gold,steer)
# A three-petal daisy inset on the stem; small bespoke detail, no texture.
for angle in range(0,360,72):
 a=math.radians(angle);bpy.ops.mesh.primitive_uv_sphere_add(segments=8,ring_count=4,radius=.017,location=pos((math.sin(a)*.016,.49+math.cos(a)*.016,.394)));o=bpy.context.object;o.scale.y=.27;finish(o,'Daisy petal',cream,steer)
for par in [body,steer]+[o for o in bpy.data.objects if o.type=='EMPTY' and 'wheel' in o.name]:
 meshes=[o for o in list(par.children) if o.type=='MESH']
 if not meshes:continue
 bpy.ops.object.select_all(action='DESELECT')
 for o in meshes:o.select_set(True)
 bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.join();meshes[0].name=par.name+' surfaces'
bpy.ops.wm.save_as_mainfile(filepath=str(root/'artifacts/journeys/scooter.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'maple-scooter.glb'),export_format='GLB',export_animations=False)
print('Scooter triangles',sum(len(o.data.polygons) for o in bpy.data.objects if o.type=='MESH'))
