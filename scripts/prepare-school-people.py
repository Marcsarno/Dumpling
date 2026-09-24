"""Selected CC0 Quaternius models; retain only peaceful clips needed by the game."""
import bpy, bmesh, json
from pathlib import Path
root=Path.cwd(); out=root/'public/assets/people'; out.mkdir(parents=True,exist_ok=True)
report={}
for source,name in [('Worker','crossing-guard'),('Hoodie','jules'),('CasualBoy','remy'),('CasualWoman','poppy')]:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.gltf(filepath=str(root/'artifacts/npc-upgrade/source'/f'{source}.gltf'))
 for obj in bpy.data.objects:
  if obj.type=='ARMATURE':
   if obj.animation_data:
    obj.animation_data.action=None
    for track in list(obj.animation_data.nla_tracks): obj.animation_data.nla_tracks.remove(track)
 for action in list(bpy.data.actions):
  if action.name not in ['Idle_Neutral','Wave','Interact']: bpy.data.actions.remove(action)
 for mesh in [o for o in bpy.data.objects if o.type=='MESH']:
  bm=bmesh.new(); bm.from_mesh(mesh.data); bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=0.00001); bm.to_mesh(mesh.data); bm.free()
  for face in mesh.data.polygons: face.use_smooth=True
  mesh.data.normals_split_custom_set([(0.0,0.0,0.0)]*len(mesh.data.loops))
 for mat in bpy.data.materials:
  if mat.use_nodes:
   for n in mat.node_tree.nodes:
    if n.type=='BSDF_PRINCIPLED':
     n.inputs['Roughness'].default_value=.78
     n.inputs['Metallic'].default_value=0
     n.inputs['Alpha'].default_value=1
 report[name]={'objects':[o.name for o in bpy.data.objects],'animations':[a.name for a in bpy.data.actions]}
 bpy.ops.export_scene.gltf(filepath=str(out/f'{name}.glb'),export_format='GLB',export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_yup=True)
(root/'artifacts/npc-upgrade/conversion.json').write_text(json.dumps(report,indent=2))
