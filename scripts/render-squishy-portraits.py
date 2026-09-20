"""Render collection portraits from the exact editable model, preserving all saved IDs."""
import bpy,re,math
from pathlib import Path
from mathutils import Vector
ROOT=Path.cwd();OUT=ROOT/'artifacts/squishy-art/portraits';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'artifacts/squishy-art/squishy-master.blend'))
scene=bpy.context.scene;scene.render.resolution_x=320;scene.render.resolution_y=320;scene.cycles.samples=24
scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
bpy.data.objects['Studio floor'].hide_render=True
cam=scene.camera;cam.location=(.10,-3.1,1.05);cam.rotation_euler=(Vector((0,0,.50))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=1.30
root=bpy.data.objects['Squishy'];mat=bpy.data.materials['Dough tint'];mix=next(n for n in mat.node_tree.nodes if n.type=='MIX_RGB')
def color(h):
 def lin(v):return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
 return tuple(lin(int(h[i:i+2],16)/255) for i in (1,3,5))+(1,)
def visible(o,show):
 for c in [o,*o.children_recursive]:c.hide_render=not show
text=(ROOT/'src/data/collection.ts').read_text(encoding='utf-8');count=0
for row in re.findall(r'\{\s*id\s*:[^}]+\}',text):
 d=dict(re.findall(r"(\w+)\s*:\s*'([^']*)'",row))
 if not all(k in d for k in ['id','face','color','accent','accessory']):continue
 visible(root,True)
 for name in ['leaf','bow','star','crown']:visible(bpy.data.objects['Accessory_'+name],d['accessory']==name)
 for side in ['L','R']:
  closed=d['face']=='sleepy' or d['face']=='wink' and side=='R';visible(bpy.data.objects['EyeOpen'+side],not closed);visible(bpy.data.objects['EyeClosed'+side],closed)
 mix.inputs[2].default_value=color(d['color']);bpy.data.materials['Accessory tint'].node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=color(d['accent'])
 scene.render.filepath=str(OUT/(d['id']+'.png'));bpy.ops.render.render(write_still=True);count+=1
print('Rendered collectible portraits:',count)
