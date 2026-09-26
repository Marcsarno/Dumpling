"""Three original, reusable shop exteriors, with intentionally different silhouettes."""
import bpy,math
from pathlib import Path
from mathutils import Vector
root=Path.cwd();out=root/'public/assets/outdoors'
def material(name,c):
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=.65;return m
def pos(p):return p[0],-p[2],p[1]
def box(name,p,d,m,bevel=.03):
 bpy.ops.mesh.primitive_cube_add(size=1,location=pos(p));o=bpy.context.object;o.name=name;o.dimensions=d[0],d[2],d[1];bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:
  mod=o.modifiers.new('Soft edges','BEVEL');mod.width=bevel;mod.segments=2;bpy.ops.object.modifier_apply(modifier=mod.name);mod=o.modifiers.new('Corner normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=mod.name)
 return o
def ball(name,p,d,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=1,location=pos(p));o=bpy.context.object;o.name=name;o.scale=d[0],d[2],d[1];o.data.materials.append(m);return o
for i,name in enumerate(['clover','peachy','moonbeam']):
 bpy.ops.wm.read_factory_settings(use_empty=True)
 cream=material('Buttercream plaster',(.92,.84,.66));trim=material('Ivory joinery',(.97,.91,.77));wood=material('Honey oak',(.58,.38,.23));glass=material('Blue shop glazing',(.32,.54,.62));dark=material('Window depth',(.16,.25,.30))
 color=material(['Sage green','Peach pink','Dusty lilac'][i],[(.43,.64,.50),(.80,.43,.48),(.44,.40,.66)][i]);roof=material('Terracotta roof',[(.64,.38,.31),(.61,.36,.42),(.28,.34,.46)][i])
 width=[7,9,6.6][i];height=[3.7,4.4,4.7][i]
 box('Shop foundation',(0,.13,0),(width+.45,.26,4.5),wood)
 box('Shop plaster',(0,height/2,0),(width,height,4.2),cream)
 for x in [-width/2+.16,width/2-.16]:box('Painted corner board',(x,height/2,2.14),(.18,height,.13),color)
 for zsign in [-1,1]:
  panel=box('Pitched tiled roof',(0,height+.47,zsign*1.13),(width+.65,.18,2.55),roof);panel.rotation_euler.x=math.radians(zsign*23)
 for x in [-width/2+.7,0,width/2-.7]:
  if abs(x)<.1:
   box('Door surround',(x,1.35,2.16),(1.25,2.7,.16),color);box('Glass door',(x,1.43,2.26),(1.02,2.43,.07),glass);box('Door lower panel',(x,.35,2.31),(1.04,.6,.08),color);ball('Brass doorknob',(.37,1.2,2.34),(.05,.05,.035),wood)
  else:
   wx=x*.82;box('Recessed window',(wx,1.67,2.13),(1.75,1.94,.12),dark);box('Window pane',(wx,1.68,2.22),(1.59,1.78,.09),glass)
   for dx in [-.88,0,.88]:box('Window mullion',(wx+dx,1.68,2.30),(.065,1.96,.065),trim)
   for y in [.7,1.67,2.65]:box('Window transom',(wx,y,2.30),(1.82,.065,.065),trim)
   box('Oak sill',(wx,.64,2.35),(1.96,.15,.38),wood)
   for k in range(3):ball('Window squishy display',(wx+(k-1)*.40,1.04,2.27),(.16,.21,.12),color)
 awningWidth=width-.8
 for k in range(12):
  x=-awningWidth/2+(k+.5)*awningWidth/12;panel=box('Striped fabric awning',(x,2.96,2.77),(awningWidth/12+.006,.07,1.3),color if k%2 else trim,.012);panel.rotation_euler.x=math.radians(-14)
  ball('Scalloped awning edge',(x,2.74,3.37),(awningWidth/24,.14,.048),color if k%2 else trim)
 box('Shop sign frame',(0,3.52,2.24),(width*.66,.60,.16),wood);box('Shop sign face',(0,3.52,2.34),(width*.66-.13,.47,.065),trim)
 for x in [-width/2-.13,width/2+.13]:
  box('Window planter',(x,.36,2.31),(.72,.64,.75),color)
  for k in range(3):ball('Planter leaf',(x+(k-1)*.17,.8,2.31),(.23,.35,.23),material('Leaf '+str(k),(.28+k*.045,.43+k*.035,.28)))
 if i==0:
  box('Little chimney',(-2.2,height+.65,-.3),(.56,1.30,.56),cream);box('Chimney cap',(-2.2,height+1.32,-.3),(.69,.10,.69),roof)
 elif i==1:
  for x in [-3.5,3.5]:box('Playroom raised corner',(x,height+.28,-.1),(1.1,.8,3.8),color)
  for k in range(5):ball('Cheerful roof bead',((k-2)*.7,height+.88,.5),(.2,.2,.2),color if k%2 else trim)
 else:
  box('Moonbeam stepped parapet',(0,height+.14,1.6),(3,.65,.65),color)
  ball('Moon shop medallion',(0,height+.65,1.63),(.35,.35,.10),trim)
 bpy.ops.wm.save_as_mainfile(filepath=str(root/f'artifacts/journeys/shop-{name}.blend'))
 bpy.ops.export_scene.gltf(filepath=str(out/f'shop-{name}.glb'),export_format='GLB',export_animations=False)
# Keep Kenney's UVs/material palette and wheel nodes. Embed the source image.
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(root/'artifacts/journeys/source/car-kit/Models/GLB format/sedan.glb'))
for image in bpy.data.images:
 if image.size[0]>256:image.scale(256,256)
bpy.ops.wm.save_as_mainfile(filepath=str(root/'artifacts/journeys/family-car.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'family-car.glb'),export_format='GLB',export_animations=False)
