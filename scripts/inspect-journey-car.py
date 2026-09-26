import bpy,collections
from pathlib import Path
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(Path.cwd()/'public/assets/outdoors/family-car.glb'))
for o in bpy.data.objects:
 if o.type!='MESH' or o.name!='body':continue
 uv=o.data.uv_layers.active.data;im=next(n.image for n in o.data.materials[0].node_tree.nodes if n.type=='TEX_IMAGE');pixels=list(im.pixels);w,h=im.size;groups=collections.defaultdict(list)
 for p in o.data.polygons:
  u=uv[p.loop_indices[0]].uv;x=min(w-1,int(u.x*w));y=min(h-1,int(u.y*h));color=tuple(round(v,2) for v in pixels[(y*w+x)*4:(y*w+x)*4+3]);groups[color].append(tuple(round(v,2) for v in p.center))
 print('CAR PALETTE',[(c,len(v),v[:2]) for c,v in groups.items()])
