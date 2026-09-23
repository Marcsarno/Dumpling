"""Remove only the footrest from Kenney's CC0 lounge chair. Preserve source GLB."""
import bpy,bmesh
from pathlib import Path
root=Path.cwd()
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(root/'public/assets/environment/kenney/furniture/loungeChairRelax.glb'))
removed=0
for obj in bpy.context.scene.objects:
 if obj.type!='MESH':continue
 bm=bmesh.new();bm.from_mesh(obj.data)
 faces=[f for f in bm.faces if max((obj.matrix_world@v.co).y for v in f.verts)<=.22471 and max((obj.matrix_world@v.co).z for v in f.verts)<=.23001 and min((obj.matrix_world@v.co).x for v in f.verts)>=.09 and max((obj.matrix_world@v.co).x for v in f.verts)<=.40001]
 removed+=len(faces);bmesh.ops.delete(bm,geom=faces,context='FACES');bm.to_mesh(obj.data);bm.free()
bpy.ops.export_scene.gltf(filepath=str(root/'public/assets/environment/kenney/furniture/loungeChairUpright.glb'),export_format='GLB')
print('Removed footrest faces:',removed)
