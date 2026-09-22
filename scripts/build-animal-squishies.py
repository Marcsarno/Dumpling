"""Approved Dumpling Friends concept -> four original, editable Blender sculpts.
Run Blender background from repository root. Coordinates: X right, Y up, Z front.
No generated image is used as a texture: markings conform to the actual surface.
"""
import bpy, bmesh, math, json
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from math import sin, cos, pi, sqrt

ROOT=Path.cwd(); OUT=ROOT/'public/assets/squishies'; REVIEW=ROOT/'artifacts/animal-squishies'
OUT.mkdir(parents=True,exist_ok=True); REVIEW.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def xyz(p):return (p[0],-p[2],p[1])
def linear(v):return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
def rgba(h):return tuple(linear(int(h[i:i+2],16)/255) for i in (1,3,5))+(1,)
def material(name,color,rough=.46):
 m=bpy.data.materials.new(name);m.diffuse_color=rgba(color);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=rgba(color);p.inputs['Roughness'].default_value=rough
 p.inputs['Specular IOR Level'].default_value=.28
 return m
def mesh(name,verts,faces,mat):
 me=bpy.data.meshes.new(name);me.from_pydata([xyz(v) for v in verts],[],faces);me.update()
 bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(me);bm.free()
 ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);me.materials.append(mat)
 for f in me.polygons:f.use_smooth=True
 return ob
def ellipsoid(name,pos,radii,mat,angle=0,segments=32,rings=20):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=xyz(pos));o=bpy.context.object;o.name=name
 o.scale=(radii[0],radii[2],radii[1]);o.rotation_euler[1]=angle
 bpy.ops.object.transform_apply(location=False,rotation=True,scale=True);o.data.materials.append(mat)
 for p in o.data.polygons:p.use_smooth=True
 return o
def join(objects,name):
 bpy.ops.object.select_all(action='DESELECT')
 for ob in objects:ob.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=bpy.context.object;o.name=name
 bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);return o
def smooth_union(objects,name):
 ob=join(objects,name);bpy.context.view_layer.objects.active=ob
 mod=ob.modifiers.new('Continuous sculpted skin','REMESH');mod.mode='VOXEL';mod.voxel_size=.009;mod.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=mod.name)
 mod=ob.modifiers.new('Soften ear roots','SMOOTH');mod.factor=.72;mod.iterations=5;bpy.ops.object.modifier_apply(modifier=mod.name)
 mod=ob.modifiers.new('Mobile sculpt topology','DECIMATE');mod.ratio=.22;bpy.ops.object.modifier_apply(modifier=mod.name)
 for p in ob.data.polygons:p.use_smooth=True
 return ob

# Broad lower cheeks, flattened seated base, gently narrowing dome. Cubic
# interpolation avoids latitude ridges, unlike stacked primitive rings.
PROFILE=[(0,.36),(.025,.46),(.07,.54),(.15,.595),(.28,.62),(.41,.61),(.54,.56),(.66,.48),(.76,.365),(.835,.20),(.867,0)]
def radius(h):
 for i in range(len(PROFILE)-1):
  a,ra=PROFILE[i];b,rb=PROFILE[i+1]
  if h<=b:
   d=(rb-ra)/(b-a);m0=d if i==0 else (rb-PROFILE[i-1][1])/(b-PROFILE[i-1][0]);m1=d if i==len(PROFILE)-2 else (PROFILE[i+2][1]-ra)/(PROFILE[i+2][0]-a)
   t=(h-a)/(b-a);return max(0,(2*t**3-3*t*t+1)*ra+(t**3-2*t*t+t)*(b-a)*m0+(-2*t**3+3*t*t)*rb+(t**3-t*t)*(b-a)*m1)
 return 0
def body(mat):
 rows=54;cols=88;v=[];f=[]
 for j in range(rows):
  h=.866*j/(rows-1);r=radius(h)
  for i in range(cols):
   a=2*pi*i/cols;v.append((r*sin(a),h,r*cos(a)*.69))
 for j in range(rows-1):
  for i in range(cols):a=j*cols+i;b=j*cols+(i+1)%cols;f.append((a,b,b+cols,a+cols))
 v.extend([(0,0,0),(0,.867,0)]);bottom=len(v)-2;top=len(v)-1
 for i in range(cols):f.extend([(bottom,(i+1)%cols,i),(top,(rows-1)*cols+i,(rows-1)*cols+(i+1)%cols)])
 return mesh('Broad dumpling body',v,f,mat)
def bezier(a,b,c,d,n=18):
 return [tuple((1-t)**3*a[k]+3*(1-t)**2*t*b[k]+3*(1-t)*t*t*c[k]+t**3*d[k] for k in range(len(a))) for t in [i/n for i in range(n)]]
def cat_ear(side,mat):
 # A rounded triangular pillow, not a cone or intersecting oval.
 outline=[]
 for a,b,c,d in [((-.16,0),(-.18,.09),(-.13,.30),(-.095,.32)),((-.095,.32),(-.045,.345),(.16,.12),(.18,.025)),((.18,.025),(.15,-.045),(-.1,-.045),(-.16,0))]:outline+=bezier(a,b,c,d,20)
 v=[];f=[];n=len(outline);rows=18
 for j in range(rows+1):
  t=pi*j/rows;s=sin(t);depth=.145*cos(t)
  for x,y in outline:v.append((side*(.31-x*s),.64+.11+(y-.11)*s,.025+depth))
 for j in range(rows):
  for i in range(n):a=j*n+i;b=j*n+(i+1)%n;f.append((a,b,b+n,a+n))
 return mesh('Rounded kitten ear',v,f,mat)

def bvh(ob):
 bpy.context.view_layer.update();return BVHTree.FromObject(ob,bpy.context.evaluated_depsgraph_get())
def surface(tree,x,y):
 hit=tree.ray_cast(Vector((x,-3,y)),Vector((0,1,0)))
 return -hit[0].y if hit[0] is not None else 0
def patch(name,tree,cx,cy,rx,ry,mat,angle=0,bulge=.0018,outline=None):
 # Rings follow the body surface exactly; no UV seam, floating sticker, or
 # sphere intersecting the face. Eye lenses use the same construction.
 n=64 if name=='Cream belly' else 48;rows=14 if name=='Cream belly' else 6;v=[];f=[]
 for j in range(rows+1):
  r=j/rows
  for i in range(n):
   a=2*pi*i/n;length=outline(a) if outline else 1
   u=cos(a)*rx*r*length;w=sin(a)*ry*r*length;x=cx+u*cos(angle)-w*sin(angle);y=cy+u*sin(angle)+w*cos(angle)
   v.append((x,y,surface(tree,x,y)+.004+bulge*sqrt(max(0,1-r*r))))
 for j in range(rows):
  for i in range(n):a=j*n+i;b=j*n+(i+1)%n;f.append((a,b,b+n,a+n))
 return mesh(name,v,f,mat)
def stroke(name,tree,points,width,mat):
 curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.bevel_depth=width;curve.bevel_resolution=3;curve.use_fill_caps=True
 s=curve.splines.new('POLY');s.points.add(len(points)-1)
 for p,(x,y) in zip(s.points,points):p.co=(*xyz((x,y,surface(tree,x,y)+.005)),1)
 ob=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(ob);curve.materials.append(mat)
 bpy.ops.object.select_all(action='DESELECT');ob.select_set(True);bpy.context.view_layer.objects.active=ob;bpy.ops.object.convert(target='MESH')
 return [ob]+[ellipsoid(name+' round end',(x,y,surface(tree,x,y)+.005),(width,width,width),mat,segments=12,rings=8) for x,y in [points[0],points[-1]]]

PALETTES={'panda':('#fff0e4','#96859d','#efd084'),'frog':('#bcd98d','#8eae67','#f5e8cc'),'bunny':('#ffecdf','#eeabb4','#eda6ac'),'cat':('#fff0dc','#ce9c76','#edb3b6')}
roots=[];reports=[]
for kind,(base,accent,detail) in PALETTES.items():
 mats={name:material(name,color,rough) for name,color,rough in [('Dough tint',base,.47),('Animal accent',accent,.5),('Animal detail',detail,.49),('Animal blush','#efa6af',.6),('Animal ink','#352c32',.33),('Animal eyes','#302930',.2),('Animal catchlight','#fffaf3',.3)]}
 parts=[];skin=body(mats['Dough tint']);skinpieces=[skin];ears=[]
 if kind=='bunny':
  for side in [-1,1]:ears.append(ellipsoid('Thick bunny ear',(side*.275,.945,-.025),(.145,.32,.105),mats['Dough tint'],side*.12))
  skin=smooth_union([skin,*ears],'Bunny continuous body and ears')
 elif kind=='frog':
  for side in [-1,1]:ears.append(ellipsoid('Integrated frog eye mound',(side*.33,.79,-.02),(.175,.19,.14),mats['Dough tint']))
  skin=smooth_union([skin,*ears],'Frog continuous body and eye mounds')
 elif kind=='panda':
  for side in [-1,1]:parts.append(ellipsoid('Panda rounded ear',(side*.385,.79,-.09),(.155,.185,.105),mats['Animal accent'],side*.22))
 elif kind=='cat':
  skin=smooth_union([skin,*[cat_ear(side,mats['Dough tint']) for side in [-1,1]]],'Kitten continuous body and ears')
  uv=skin.data.uv_layers.new(name='Front projection')
  for face in skin.data.polygons:
   for loop in face.loop_indices:
    co=skin.data.vertices[skin.data.loops[loop].vertex_index].co
    uv.data[loop].uv=((co.x+.75)/1.5,co.z/1.4)
  # Neutral mask under the runtime tint; smooth painted caps cross the sculpted
  # ear roots without a geometric edge. Same mapping at every viewing angle.
  import numpy as np
  size=512;yy,xx=np.mgrid[0:size,0:size];x=xx/size*1.5-.75;y=yy/size*1.4
  distance=np.minimum(((x-.36)/.23)**2+((y-.87)/.25)**2,((x+.36)/.23)**2+((y-.87)/.25)**2)
  alpha=np.clip((1.02-distance)/.04,0,1)
  arr=np.ones((size,size,4),dtype=np.float32);ratio=np.array(rgba(accent)[:3])/np.array(rgba(base)[:3]);arr[:,:,:3]=1-alpha[:,:,None]*(1-ratio)
  im=bpy.data.images.new('Kitten cap color mask',width=size,height=size,alpha=True);im.pixels.foreach_set(arr.ravel());im.pack()
  node=mats['Dough tint'].node_tree.nodes.new('ShaderNodeTexImage');node.image=im
  mix=mats['Dough tint'].node_tree.nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;mix.inputs[2].default_value=rgba(base)
  mats['Dough tint'].node_tree.links.new(node.outputs['Color'],mix.inputs[1]);mats['Dough tint'].node_tree.links.new(mix.outputs[0],mats['Dough tint'].node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
 parts.append(skin);tree=bvh(skin)
 if kind=='bunny':
  for side in [-1,1]:parts.append(patch('Recessed pink inner ear',tree,side*.29,1.004,.076,.185,mats['Animal accent'],side*-.12))
 if kind=='cat':
  for side in [-1,1]:
   parts.append(patch('Kitten pink inner ear',tree,side*.368,.844,.062,.065,mats['Animal detail'],-side*.35,outline=lambda a:.86+.13*cos(3*a-pi/2)))
  parts.append(ellipsoid('Tucked kitten tail',(.565,.24,-.075),(.15,.235,.13),mats['Animal accent'],.35))
 for side in [-1,1]:
  paw=ellipsoid('Little resting paw',(side*.285,.12,.345),(.142,.136,.105),mats['Animal accent'] if kind=='panda' else mats['Dough tint'],side*-.22);parts.append(paw)
  if kind=='panda':parts.append(patch('Panda soft eye patch',tree,side*.219,.495,.102,.131,mats['Animal accent'],side*.30))
  ex=side*(.33 if kind=='frog' else .205);ey=.818 if kind=='frog' else .505
  parts.append(patch('Glossy eye',tree,ex,ey,.070 if kind=='frog' else .055,.078 if kind=='frog' else .065,mats['Animal eyes'],bulge=.018))
  parts.append(patch('Eye highlight',tree,ex+.018,ey+.027,.016,.019,mats['Animal catchlight'],bulge=.020))
  parts.append(patch('Painted blush',tree,side*.328,.62 if kind=='frog' else .361,.071,.050,mats['Animal blush']))
 if kind=='frog':
  parts.append(patch('Cream belly',tree,0,.212,.296,.193,mats['Animal detail']))
  points=bezier((-.105,.664),(-.1,.576),(.1,.576),(.105,.664),48)+[(.105,.664)]
  parts+=stroke('Frog smile',tree,points,.012,mats['Animal ink'])
  for side in [-1,1]:parts.append(patch('Tiny leaf marking',tree,.405+side*.022,.388+side*.015,.019,.040,mats['Animal accent'],-side*.48))
 elif kind in ['cat','bunny','panda']:
  parts.append(patch('Small button nose',tree,0,.417,.025,.018,mats['Animal ink'],bulge=.009))
  parts+=stroke('Philtrum',tree,[(0,.41),(0,.379)],.007,mats['Animal ink'])
  for side in [-1,1]:
   points=bezier((0,.381),(side*.014,.344),(side*.058,.343),(side*.070,.381),26)+[(side*.070,.381)]
   parts+=stroke('Little animal smile',tree,points,.0075,mats['Animal ink'])
   if kind=='cat':
    for j in range(2):parts+=stroke('Soft whisker',tree,[(side*.337,.46-j*.081),(side*.423,.45-j*.099)],.009,mats['Animal ink'])
 if kind=='panda':
  parts.append(patch('Gold star marking',tree,.47,.29,.052,.065,mats['Animal detail'],outline=lambda a:.76+.24*cos(5*(a-pi/2))))
 if kind=='bunny':
  parts.append(patch('Blossom marking',tree,.322,.659,.060,.060,mats['Animal detail'],outline=lambda a:.81+.19*cos(5*a)))
  parts.append(patch('Blossom center',tree,.322,.659,.017,.017,mats['Dough tint'],bulge=.004))
 # One shared mesh per material keeps each friend to seven draw calls.
 root=bpy.data.objects.new('Animal_'+kind,None);bpy.context.collection.objects.link(root)
 groups=[(name,[p for p in parts if p.data.materials[0]==mat]) for name,mat in mats.items()]
 for name,selected in groups:
  if selected:o=join(selected,kind+' '+name);o.parent=root
 bpy.ops.object.select_all(action='DESELECT')
 for o in [root,*root.children_recursive]:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(OUT/('animal-'+kind+'.glb')),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_animations=False)
 reports.append({'kind':kind,'vertices':sum(len(o.data.vertices) for o in root.children),'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in root.children),'materials':len(root.children)})
 roots.append(root)
 for o in root.children:o.hide_render=True

scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.render.resolution_x=800;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.world.color=(.5,.5,.5);scene.view_settings.view_transform='AgX'
floor=material('Studio floor','#f5eef0',.8);bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.012));bpy.context.object.data.materials.append(floor)
def light(pos,power,size):
 bpy.ops.object.light_add(type='AREA',location=xyz(pos));o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector(xyz((0,.45,0)))-o.location).to_track_quat('-Z','Y').to_euler()
light((-2.5,3.8,4),330,4);light((3,2,2),180,3);light((0,3,-2),250,3)
bpy.ops.object.camera_add(location=xyz((.08,1.25,4)));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=1.65;scene.camera=cam
cam.rotation_euler=(Vector(xyz((0,.58,0)))-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(REVIEW/'dumpling-friends-master.blend'))
(REVIEW/'geometry.json').write_text(json.dumps(reports,indent=2))
for root in roots:
 for o in root.children:o.hide_render=False
 scene.render.filepath=str(REVIEW/(root.name+'-front.png'));bpy.ops.render.render(write_still=True)
 for o in root.children:o.hide_render=True
print(json.dumps(reports))
