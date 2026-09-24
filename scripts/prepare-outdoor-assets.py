import bpy,os,json,math
from pathlib import Path
root=Path.cwd();out=root/'public/assets/outdoors';out.mkdir(parents=True,exist_ok=True)
for name in ['Goldfish','Betta','ArmoredCatfish','Puffer','FishingRod_Lvl1']:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.fbx(filepath=str(root/'artifacts/outdoors/source'/f'{name}.fbx'))
 for mat in bpy.data.materials:
  if mat.use_nodes:
   for n in mat.node_tree.nodes:
    if n.type=='BSDF_PRINCIPLED':n.inputs['Alpha'].default_value=1
 print('FISH',name,[(a.name,a.frame_range[:]) for a in bpy.data.actions])
 bpy.ops.export_scene.gltf(filepath=str(out/(name.lower()+'.glb')),export_format='GLB',export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_yup=True)
# Convert only the selected nature models. Downsample their embedded maps for phones.
for name in ['CommonTree_1','CommonTree_3','Bush_Common','Bush_Common_Flowers','Rock_Medium_1','Rock_Medium_3','Plant_1']:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.gltf(filepath=str(root/'artifacts/outdoors/source/nature/glTF'/f'{name}.gltf'))
 for im in bpy.data.images:
  if im.size[0]>512:im.scale(512,max(1,int(im.size[1]*512/im.size[0])))
 bpy.ops.export_scene.gltf(filepath=str(out/(name+'.glb')),export_format='GLB',export_animations=False,export_yup=True)
