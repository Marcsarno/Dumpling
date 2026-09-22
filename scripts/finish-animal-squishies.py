"""Bake soft local occlusion into approved meshes without changing geometry.
Run after build-animal-squishies.py; reopen its editable master, export final GLBs.
Vertex colors carry ambient visibility, not a painted directional shadow.
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path.cwd();OUT=ROOT/'public/assets/squishies';REVIEW=ROOT/'artifacts/animal-squishies'
bpy.ops.wm.open_mainfile(filepath=str(REVIEW/'dumpling-friends-master.blend'))
SAMPLES=64;directions=[]
for i in range(SAMPLES):
 r=math.sqrt((i+.5)/SAMPLES);a=i*2.39996323
 directions.append((r*math.cos(a),r*math.sin(a),math.sqrt(1-r*r)))
report=[]
for kind in ['panda','frog','bunny','cat']:
 root=bpy.data.objects['Animal_'+kind];objects=list(root.children);verts=[];faces=[]
 for ob in objects:
  offset=len(verts);verts.extend([ob.matrix_world@v.co for v in ob.data.vertices]);faces.extend([tuple(offset+i for i in p.vertices) for p in ob.data.polygons])
 tree=BVHTree.FromPolygons(verts,faces);values=[]
 for ob in objects:
  mesh=ob.data;colors=mesh.color_attributes.get('SoftOcclusion') or mesh.color_attributes.new(name='SoftOcclusion',type='FLOAT_COLOR',domain='POINT')
  mesh.color_attributes.active_color=colors
  for vertex in mesh.vertices:
   pos=ob.matrix_world@vertex.co;normal=(ob.matrix_world.to_3x3()@vertex.normal).normalized()
   tangent=normal.cross(Vector((0,0,1)) if abs(normal.z)<.9 else Vector((0,1,0))).normalized();bitangent=normal.cross(tangent)
   occluded=0
   for x,y,z in directions:
    ray=tangent*x+bitangent*y+normal*z
    hit,_,_,distance=tree.ray_cast(pos+normal*.005,ray,.23)
    if hit is not None:occluded+=(1-distance/.23)**1.2
   visibility=max(.48,1-.80*occluded/SAMPLES)
   colors.data[vertex.index].color=(visibility,visibility,visibility,1);values.append(visibility)
 bpy.ops.object.select_all(action='DESELECT')
 for ob in [root,*objects]:ob.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(OUT/('animal-'+kind+'.glb')),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_animations=False,export_vertex_color='ACTIVE')
 report.append({'kind':kind,'samples':SAMPLES,'minimum':min(values),'mean':sum(values)/len(values),'vertices':len(values)})
bpy.ops.wm.save_as_mainfile(filepath=str(REVIEW/'dumpling-friends-finished.blend'))
(REVIEW/'finish-report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
