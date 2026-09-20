"""Reuse original merchandise geometry as lightweight display LODs; add one missing arched shelf.
Original source models are never overwritten. Game axes X right, Y up, Z front.
"""
import bpy, math
from pathlib import Path
ROOT=Path.cwd(); OUT=ROOT/'public/assets/store-kit'; OUT.mkdir(parents=True,exist_ok=True)
def clear():
 bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def export(name):
 bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),export_format='GLB',export_yup=True,export_animations=False)
for name,ratio in [('bao-squishy',.13),('bamboo-steamer-shelf',.17)]:
 clear(); bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/assets/squishies'/(name+'.glb')))
 for o in list(bpy.context.scene.objects):
  if o.type!='MESH': continue
  bpy.context.view_layer.objects.active=o
  if len(o.data.polygons)>80:
   m=o.modifiers.new('Display LOD preserves source silhouette','DECIMATE');m.ratio=ratio
   bpy.ops.object.modifier_apply(modifier=m.name)
 export(name+'-display')
clear()
def rgb(h):
 vals=[int(h[i:i+2],16)/255 for i in (1,3,5)]
 return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in vals)+(1,)
def mat(name,c):
 m=bpy.data.materials.new(name);m.diffuse_color=rgb(c);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=rgb(c);p.inputs['Roughness'].default_value=.8;return m
wood=mat('Kit light wood','#e7c59d');cream=mat('Kit cream','#fff1dc');paint=mat('Kit accent','#c5bbdd')
def box(n,p,s,m):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=n;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 b=o.modifiers.new('Soft toy edges','BEVEL');b.width=.025;b.segments=3;bpy.ops.object.modifier_apply(modifier=b.name)
 o.modifiers.new('Weighted corners','WEIGHTED_NORMAL');return o
for y in [.18,.72,1.26]:box('Shelf board',(0,y,0),(2.5,.095,.88),wood)
box('Painted center divider',(0,.72,0),(2.36,1.08,.075),paint)
for x in [-1.2,1.2]:
 box('Rounded end',(x,.78,0),(.13,1.45,.9),cream)
 # Rounded endcap arch runs across shelf depth; a beveled semicircular profile.
 pts=[(-.45,1.46),(.45,1.46)]+[(.45*math.cos(a),1.46+.45*math.sin(a)) for a in [i*math.pi/16 for i in range(17)]]
 verts=[(x+side,-z,y) for side in [-.065,.065] for z,y in pts];n=len(pts);faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 mesh=bpy.data.meshes.new('Arch');mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new('Soft arch endcap',mesh);bpy.context.collection.objects.link(o);o.data.materials.append(cream)
 for z in [-.31,.31]:box('Shelf foot',(x,.08,z),(.18,.16,.18),paint)
export('arched-display-shelf')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'store-kit.blend'))
print('STORE_KIT_COMPLETE')
