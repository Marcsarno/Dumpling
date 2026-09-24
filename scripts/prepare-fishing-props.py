import bpy
from pathlib import Path
from mathutils import Vector
root=Path.cwd();out=root/'public/assets/outdoors'
for name in ['Puffer','FishingRod_Lvl1']:
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.fbx(filepath=str(root/'artifacts/outdoors/source'/f'{name}.fbx'))
 pts=[o.matrix_world@Vector(v) for o in bpy.context.scene.objects if o.type=='MESH' for v in o.bound_box];print(name,'BOUNDS',[(min(v[i] for v in pts),max(v[i] for v in pts)) for i in range(3)])
 bpy.ops.export_scene.gltf(filepath=str(out/(name.lower()+'.glb')),export_format='GLB',export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True)
