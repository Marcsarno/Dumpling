import bpy, math
from pathlib import Path
ROOT=Path.cwd(); OUT=ROOT/'public/assets/store-kit'
def mat(name,h):
 m=bpy.data.materials.new(name); vals=[int(h[i:i+2],16)/255 for i in (1,3,5)];c=tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in vals)+(1,);m.diffuse_color=c;m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=c;p.inputs['Roughness'].default_value=.82;return m
pink=mat('Sign pink','#efaaca');cream=mat('Sign cream','#fff5e4');ink=mat('Sign lavender ink','#9770af');yellow=mat('Sign flower heart','#f4d880')
font=bpy.data.fonts.load('C:/Windows/Fonts/comicbd.ttf')
def cube(name,p,s,m,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=name;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:
  b=o.modifiers.new('Rounded sign','BEVEL');b.width=bevel;b.segments=6;bpy.ops.object.modifier_apply(modifier=b.name)
 return o
def text(words,p,size,m):
 c=bpy.data.curves.new(words,'FONT');c.body=words;c.font=font;c.align_x='CENTER';c.align_y='CENTER';c.size=size;c.extrude=.006;c.bevel_depth=.0015;c.bevel_resolution=1;c.resolution_u=5
 o=bpy.data.objects.new(words,c);bpy.context.collection.objects.link(o);o.location=(p[0],-p[2],p[1]);o.rotation_euler=(math.pi/2,0,0);o.data.materials.append(m)
def flower(p,r):
 for i in range(5):
  a=i*math.tau/5;bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=6,location=(p[0]+math.sin(a)*r*.68,-p[2],p[1]+math.cos(a)*r*.68));o=bpy.context.object;o.scale=(r*.49,r*.12,r*.49);o.data.materials.append(cream)
 bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=6,location=(p[0],-p[2]-.015,p[1]));o=bpy.context.object;o.scale=(r*.34,r*.15,r*.34);o.data.materials.append(yellow)
for slug,title,subtitle in [('clover','Squishy Pop','CLOVER CORNER'),('peachy','Squishy Section','PEACHY PLAYROOM'),('moonbeam','Squishy Pop','MOONBEAM FINDS'),('smiles','Small squishies','Big smiles')]:
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 cube('Rounded pastel sign',(0,.5,0),(3,.98,.14),pink,.16)
 text(title,(0,.62,.09),.37 if slug=='peachy' else .43,cream);text(subtitle,(0,.22,.09),.18,ink)
 flower((-1.27,.52,.1),.17);flower((1.27,.52,.1),.17)
 bpy.ops.export_scene.gltf(filepath=str(OUT/('sign-'+slug+'.glb')),export_format='GLB',export_yup=True,export_animations=False)
print('STORE_SIGNS_COMPLETE')
