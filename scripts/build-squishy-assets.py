"""Reference-led original squishy + hinged steamer. Blender 5.2, no external assets.
Run from project root: blender -b --python scripts/build-squishy-assets.py
Game coordinates in helpers: X right, Y up, Z front. Blender: X, -Z, Y.
"""
import bpy, math, json, random
import numpy as np
from mathutils import Vector
from pathlib import Path
from math import sin, cos, pi, sqrt, exp

ROOT=Path.cwd(); OUT=ROOT/'public/assets/squishies'; REVIEW=ROOT/'artifacts/squishy-art'
OUT.mkdir(parents=True,exist_ok=True); REVIEW.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
random.seed(24)
def coord(p): return (p[0],-p[2],p[1])
def linear(v): return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
def rgb(h): return tuple(linear(int(h[i:i+2],16)/255) for i in (1,3,5))+(1,)
def mat(name,color,rough=.4):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=rgb(color)
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=rgb(color);p.inputs['Roughness'].default_value=rough
 return m
def texture(m,name,arr):
 h,w=arr.shape[:2];im=bpy.data.images.new(name,width=w,height=h,alpha=True);im.pixels.foreach_set(arr.astype(np.float32).ravel());im.pack()
 n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=im;m.node_tree.links.new(n.outputs['Color'],m.node_tree.nodes.get('Principled BSDF').inputs['Base Color']);return im
def objmesh(name,verts,faces,m,uv=None):
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.data.materials.append(m)
 for p in mesh.polygons:p.use_smooth=True
 if uv:
  layer=mesh.uv_layers.new(name='UVMap')
  for p in mesh.polygons:
   for i in p.loop_indices:layer.data[i].uv=uv[mesh.loops[i].vertex_index]
 return o
def empty(name):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);return o
def parent(o,p):o.parent=p
def sphere(name,pos,scale,m,segments=32,rings=20):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=coord(pos));o=bpy.context.object;o.name=name;o.scale=(scale[0],scale[2],scale[1]);o.data.materials.append(m)
 for p in o.data.polygons:p.use_smooth=True
 return o
def tube(name,pts,r,m,res=3):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=res;c.resolution_u=16;c.use_fill_caps=True
 s=c.splines.new('POLY');s.points.add(len(pts)-1)
 for p,v in zip(s.points,pts):p.co=(*coord(v),1)
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(m);bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False);return o
def bevel(o,width=.008,segments=3):
 bpy.context.view_layer.objects.active=o;mod=o.modifiers.new('Soft manufactured edges','BEVEL');mod.width=width;mod.segments=segments;bpy.ops.object.modifier_apply(modifier=mod.name)
def cube(name,pos,scale,m,rounding=.01):
 bpy.ops.mesh.primitive_cube_add(size=1,location=coord(pos));o=bpy.context.object;o.name=name;o.scale=(scale[0],scale[2],scale[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m);bevel(o,rounding);return o
def join(name,objects):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=bpy.context.object;o.name=name;return o
def lathe(name,profile,m,n=96):
 verts=[];uv=[]
 for j,(r,h) in enumerate(profile):
  for k in range(n+1):a=2*pi*k/n;verts.append(coord((r*sin(a),h,r*cos(a))));uv.append((h*2,k/n))
 faces=[]
 for j in range(len(profile)-1):
  for k in range(n):a=j*(n+1)+k;faces.append((a,a+1,a+n+2,a+n+1))
 return objmesh(name,verts,faces,m,uv)

# One continuous dough skin, with nine tapered, slightly twisted pinch valleys.
DOUGH=mat('Dough tint','#fff0d7',.32);p=DOUGH.node_tree.nodes.get('Principled BSDF');p.inputs['Subsurface Weight'].default_value=.075
INK=mat('Glossy chocolate eyes','#241412',.14);BROWN=mat('Warm iris rim','#70442b',.25);WHITE=mat('Eye catchlights','#ffffff',.16)
wp=WHITE.node_tree.nodes.get('Principled BSDF');wp.inputs['Emission Color'].default_value=(1,1,1,1);wp.inputs['Emission Strength'].default_value=.15
MOUTH=mat('Cocoa smile','#392119',.32);BLUSH=mat('Strawberry cheek marks','#f28f99',.42);ACCENT=mat('Accessory tint','#e6a6b8',.34);LEAF=mat('Leaf vein','#fff4ce',.45)
N=1024;yy,xx=np.mgrid[0:N,0:N];theta=xx/N*2*pi;v=yy/N
noise=np.random.default_rng(12).normal(0,.002,(N,N));shade=.98-.065*(1-v)**5+noise
arr=np.ones((N,N,4),dtype=np.float32);arr[:,:,:3]=shade[:,:,None]*np.array([1,.984,.956])
for a in [.57,2*pi-.57]:
 d=np.arctan2(np.sin(theta-a),np.cos(theta-a));b=np.exp(-((d/.155)**2+((v-.30)/.065)**2))* .28
 arr[:,:,:3]=arr[:,:,:3]*(1-b[:,:,None])+np.array([1,.37,.43])*b[:,:,None]
texture(DOUGH,'Dough satin and painted blush',arr)
# Monotone Hermite interpolation prevents ridges at profile stations.
profile=[(0,.29),(.016,.39),(.045,.465),(.105,.518),(.22,.556),(.36,.56),(.49,.533),(.60,.481),(.69,.408),(.77,.315),(.83,.230),(.879,.147),(.913,.073)]
def radius(h):
 for i in range(len(profile)-1):
  a,ra=profile[i];b,rb=profile[i+1]
  if h<=b:
   slope=(rb-ra)/(b-a);m0=slope if i==0 else (rb-profile[i-1][1])/(b-profile[i-1][0]);m1=slope if i==len(profile)-2 else (profile[i+2][1]-ra)/(profile[i+2][0]-a)
   t=(h-a)/(b-a);return (2*t**3-3*t*t+1)*ra+(t**3-2*t*t+t)*(b-a)*m0+(-2*t**3+3*t*t)*rb+(t**3-t*t)*(b-a)*m1
 return profile[-1][1]
def radial(h,a):
 amp=.081*exp(-((h-.752)/.148)**2)+.020*exp(-((h-.87)/.06)**2)
 grooves=(.5+.5*cos(9*(a+.20*(h-.45)) +pi))**4.5
 return radius(h)-amp*grooves
def front(x,h):
 a=math.asin(max(-.99,min(.99,x/radius(h))));return radial(h,a)*cos(a)*.80
root=empty('Squishy');verts=[];uv=[];faces=[];body_rows=76;cap_rows=24;cols=144;rows=body_rows+cap_rows-1
for j in range(rows+1):
 vcap=max(0,(j-body_rows)/cap_rows);h=.86*j/body_rows if j<=body_rows else .86+.086*sin(vcap*pi*.9)
 for k in range(cols+1):
  a=k*2*pi/cols;groove=(.5+.5*cos(9*(a+.20*(.86-.45))+pi))**4.5
  r=radial(h,a) if j<=body_rows else radius(.86)*cos(vcap*pi/2)-(.081*exp(-((.86-.752)/.148)**2)+.020*exp(-((.86-.87)/.06)**2))*groove*(1-vcap)**1.4
  lift=.009*cos(9*a)*sin(vcap*pi) if j>body_rows else 0
  verts.append(coord((r*sin(a),h+lift,r*cos(a)*.80)));uv.append((k/cols,h/.94))
for j in range(rows):
 for k in range(cols):a=j*(cols+1)+k;faces.append((a,a+1,a+cols+2,a+cols+1))
bottom=len(verts);verts.append(coord((0,0,0)));uv.append((.5,0));top=len(verts);verts.append(coord((0,.86+.086*sin(pi*.9),0)));uv.append((.5,1))
for k in range(cols):faces.append((bottom,k+1,k));a=rows*(cols+1)+k;faces.append((a,a+1,top))
body=objmesh('Dough',verts,faces,DOUGH,uv);parent(body,root)
# Face fits the skin; large domed pupils and two deliberate studio glints per eye.
for side,x in [('L',-.204),('R',.204)]:
 group=empty('EyeOpen'+side);parent(group,root);h=.353;z=front(x,h)
 for o in [sphere('Iris'+side,(x,h,z+.005),(.071,.089,.028),BROWN),sphere('Pupil'+side,(x,h+.009,z+.013),(.065,.079,.029),INK),sphere('Catchlight'+side,(x+.018,h+.044,z+.040),(.021,.026,.007),WHITE,24,12),sphere('CatchlightSmall'+side,(x-.005,h+.004,z+.044),(.007,.008,.004),WHITE,16,10)]:parent(o,group)
 sleepy=empty('EyeClosed'+side);parent(sleepy,root)
 pts=[]
 for i in range(25):t=i/24;x1=x+(t-.5)*.115;y1=.357-.021*sin(pi*t);pts.append((x1,y1,front(x1,y1)+.014))
 parent(tube('Sleepy eyelid'+side,pts,.008,MOUTH),sleepy)
 sleepy.hide_render=True
for sign in [-1,1]:
 for j in range(3):
  x=sign*(.283+j*.034);h=.253-j*.008
  pts=[(x+(t-.5)*.015,h+(t-.5)*.034,front(x+(t-.5)*.015,h+(t-.5)*.034)+.008) for t in np.linspace(0,1,9)]
  parent(tube('Cheek mark',pts,.0075,BLUSH),root)
pts=[]
for t in np.linspace(0,pi,44):x=-.055*cos(t);h=.286-.063*sin(t);pts.append((x,h,front(x,h)+.012))
parent(tube('Happy U smile',pts,.011,MOUTH),root)
for x in [-.055,.055]:parent(sphere('Smile soft end',(x,.286,front(x,.286)+.012),(.011,.011,.011),MOUTH,16,10),root)

# Small, rounded charms with real silhouettes, selected per saved collectible.
accessories={}
for name in ['leaf','bow','star','crown']:
 accessories[name]=empty('Accessory_'+name);parent(accessories[name],root)
g=accessories['leaf'];lv=[];lf=[];lu=[]
for j in range(25):
 t=j/24;w=.077*sin(pi*t)**.8
 for k in range(9):s=k/4-1;lv.append(coord((.07+.26*t,.872+.075*t+.022*sin(pi*t)*(1-abs(s)),.015+w*s)));lu.append((t,(s+1)/2))
for j in range(24):
 for k in range(8):a=j*9+k;lf.append((a,a+9,a+10,a+1))
o=objmesh('Satin leaf',lv,lf,ACCENT,lu);parent(o,g);solid=o.modifiers.new('Leaf thickness','SOLIDIFY');solid.thickness=.01;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=solid.name)
parent(tube('Leaf vein',[(.075+.255*t,.88+.075*t+.022*sin(pi*t),.015) for t in np.linspace(0,1,24)],.003,LEAF,2),g)
g=accessories['bow']
for s in [-1,1]:
 o=sphere('Bow soft loop',(.29+s*.071,.776,.17),(.079,.061,.035),ACCENT);o.rotation_euler[1]=s*.18;parent(o,g)
parent(sphere('Bow knot',(.29,.777,.194),(.031,.034,.031),ACCENT),g)
def charm(name,outline,depth,m,pos):
 vs=[coord((x+pos[0],y+pos[1],z+pos[2])) for z in [-depth/2,depth/2] for x,y in outline];n=len(outline);fs=[tuple(reversed(range(n))),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 o=objmesh(name,vs,fs,m);bevel(o,.009,3);return o
outline=[((.11 if i%2==0 else .052)*sin(i*pi/5),(.11 if i%2==0 else .052)*cos(i*pi/5)) for i in range(10)]
parent(charm('Puffy star charm',outline,.045,ACCENT,(.22,.805,.17)),accessories['star'])
outline=[(-.16,0),(-.17,.145),(-.075,.09),(0,.19),(.075,.09),(.17,.145),(.16,0)]
parent(charm('Rounded crown',outline,.065,ACCENT,(0,.879,.01)),accessories['crown'])
for x in [-.16,0,.16]:parent(sphere('Crown pearl',(x,.879+(.19 if x==0 else .145),.01),(.018,.018,.022),ACCENT,16,10),accessories['crown'])
for g in accessories.values():g.hide_render=True
# Merge tiny face elements to avoid one draw call per cheek stroke/end cap.
for prefix,name in [('Cheek mark','Painted cheeks'),('Happy U smile','Smile')]:
 parts=[o for o in root.children if o.name.startswith(prefix)]
 if prefix=='Happy U smile':parts += [o for o in root.children if o.name.startswith('Smile soft end')]
 o=join(name,parts);parent(o,root)

# Export all optional shapes. Visibility is selected by the game's saved definition.
def export_tree(o,path):
 bpy.ops.object.select_all(action='DESELECT')
 for c in [o,*o.children_recursive]:c.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_animations=False)
export_tree(root,OUT/'bao-squishy.glb')
for o in [root,*root.children_recursive]:o.hide_render=True

# Warm manufactured bamboo grain, shared by the basket and interlaced strips.
WOOD=mat('Honey bamboo','#deb172',.38);TRIM=mat('Bamboo rounded edge','#f2cc91',.32);INNER=mat('Bamboo nest','#efc68c',.44)
W=1024;H=256;yy,xx=np.mgrid[0:H,0:W];rng=np.random.default_rng(8)
grain=.007*np.sin(xx*.19+np.sin(yy*.033)*1.4)+.003*np.sin(xx*.74+np.sin(yy*.017)*2)+rng.normal(0,.002,(H,W))
arr=np.ones((H,W,4));arr[:,:,:3]=np.clip(np.array([.83,.61,.38])[None,None,:]+grain[:,:,None],0,1);texture(WOOD,'Bamboo fine grain',arr)
basket=empty('Steamer');base=lathe('Basket shell',[(0,0),(.57,0),(.621,.025),(.639,.065),(.64,.34),(.637,.38),(.623,.4),(.599,.4),(.585,.382),(.584,.11),(.55,.07),(0,.07)],WOOD);parent(base,basket)
for y in [.055,.375]:parent(lathe('Rolled bamboo binding',[(.626,y-.013),(.649,y-.005),(.65,y+.008),(.64,y+.015),(.626,y+.009),(.626,y-.013)],TRIM),basket)
liner=lathe('Molded dumpling nest',[(0,.085),(.15,.088),(.32,.092),(.43,.115),(.50,.16),(.546,.195),(.565,.19),(.566,.17),(.51,.13),(.4,.075),(0,.075)],INNER);parent(liner,basket)
hinge=empty('LidHinge');hinge.location=coord((0,.399,-.603));parent(hinge,basket)
lidparts=[]
lidparts.append(lathe('Lid rim',[(.60,.402),(.656,.405),(.667,.421),(.668,.495),(.658,.519),(.64,.531),(.609,.529),(.601,.507),(.60,.402)],WOOD))
lidparts.append(lathe('Lid rolled lip',[(.633,.513),(.651,.516),(.658,.53),(.65,.538),(.634,.536),(.627,.528),(.633,.513)],TRIM))
lidparts.append(lathe('Lid backing',[(0,.47),(.615,.47),(.62,.48),(0,.48)],INNER))
# Actual over-under strips, clipped to a circle. Soft bevels keep edges toy-like.
weaves=[]
for axis in range(2):
 for k in range(-4,5):
  center=k*.137;half=.066;vs=[];uv=[];steps=72
  for j in range(steps+1):
   t=-.618+1.236*j/steps
   for s in [-1,1]:
    cross=max(-.616,min(.616,center+s*half));length=sqrt(max(0,.616**2-cross**2));along=(-1+2*j/steps)*length
    x,z=(along,cross) if axis==0 else (cross,along)
    y=.49+.008*math.tanh(5*cos(pi*along/.137+k*pi+axis*pi))+.02*(1-(x*x+z*z)/.62**2)
    vs.append(coord((x,y,z)));uv.append(((s+1)/2,j/steps))
  fs=[(j*2,j*2+1,j*2+3,j*2+2) for j in range(steps)]
  if axis:fs=[tuple(reversed(f)) for f in fs]
  o=objmesh('Woven bamboo ribbon',vs,fs,WOOD,uv)
  mod=o.modifiers.new('Woven strip thickness','SOLIDIFY');mod.thickness=.011;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name);bevel(o,.003,2);weaves.append(o)
woven=join('Woven lid',weaves);lidparts.append(woven)
under=woven.copy();under.data=woven.data.copy();bpy.context.collection.objects.link(under);under.name='Inside woven lid'
for v in under.data.vertices:v.co.z=.965-v.co.z
# Reflection flips winding: recalculate outward normals after mirroring geometry.
import bmesh
bm=bmesh.new();bm.from_mesh(under.data);bmesh.ops.reverse_faces(bm,faces=list(bm.faces));bm.to_mesh(under.data);bm.free();lidparts.append(under)
lidparts.append(tube('Arched bamboo handle',[(.17*cos(t),.545+.105*sin(t),0) for t in np.linspace(0,pi,40)],.026,TRIM))
for x in [-.155,.155]:lidparts.append(cube('Handle foot',(x,.54,0),(.065,.035,.065),WOOD))
for o in lidparts:
 o.parent=hinge;o.matrix_parent_inverse=hinge.matrix_world.inverted()
for x in [-.16,.16]:
 parent(cube('Hinge mount',(x,.345,-.61),(.095,.10,.067),TRIM),basket)
 parent(tube('Hinge barrel',[(x-.056,.399,-.603),(x+.056,.399,-.603)],.035,WOOD),basket)
parent(cube('Front thumb clasp',(0,.383,.638),(.17,.06,.035),TRIM),basket)
export_tree(basket,OUT/'bamboo-steamer.glb')
# Low-detail closed shelf model: shared materials, no working hinge on tiny props.
bpy.context.view_layer.update();copies=[]
for o in basket.children_recursive:
 if o.type=='MESH':
  c=o.copy();c.data=o.data.copy();bpy.context.collection.objects.link(c);c.parent=None;c.matrix_world=o.matrix_world.copy();copies.append(c)
small=join('Shelf steamer',copies);mod=small.modifiers.new('Shelf LOD','DECIMATE');mod.ratio=.22;bpy.context.view_layer.objects.active=small;bpy.ops.object.modifier_apply(modifier=mod.name);export_tree(small,OUT/'bamboo-steamer-shelf.glb');bpy.data.objects.remove(small,do_unlink=True)

# Archive editable scene and produce honest model renders for art review.
for o in [root,*root.children_recursive]:o.hide_render=False
for name in ['EyeClosedL','EyeClosedR',*['Accessory_'+n for n in accessories]]:
 o=bpy.data.objects[name]
 for c in [o,*o.children_recursive]:c.hide_render=True
for o in [basket,*basket.children_recursive]:o.hide_render=True
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.render.resolution_x=960;scene.render.resolution_y=960;scene.render.resolution_percentage=100
scene.world.color=(.7,.7,.7);scene.view_settings.view_transform='AgX'
# Match the game's per-collectible cream tint for these review renders.
nodes=DOUGH.node_tree.nodes;links=DOUGH.node_tree.links;tex=next(n for n in nodes if n.type=='TEX_IMAGE');mix=nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;mix.inputs[2].default_value=rgb('#fff0d7');links.new(tex.outputs['Color'],mix.inputs[1]);links.new(mix.outputs[0],nodes.get('Principled BSDF').inputs['Base Color'])
floor=mat('Studio ivory','#f4f0ed',.75);bpy.ops.mesh.primitive_plane_add(size=200);bpy.context.object.data.materials.append(floor);bpy.context.object.name='Studio floor'
def area(name,pos,power,size):
 bpy.ops.object.light_add(type='AREA',location=coord(pos));o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector(coord((0,.4,0)))-o.location).to_track_quat('-Z','Y').to_euler()
area('Large softbox',(-2,3,3),230,3);area('Fill',(3,2,1),150,2.5);area('Rim',(0,2,-3),250,2)
bpy.ops.object.camera_add(location=coord((.10,1.1,3.1)));cam=bpy.context.object;cam.rotation_euler=(Vector(coord((0,.46,0)))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=1.60;scene.camera=cam
bpy.ops.wm.save_as_mainfile(filepath=str(REVIEW/'squishy-master.blend'))
scene.render.filepath=str(REVIEW/'01-bao-front.png');bpy.ops.render.render(write_still=True)
cam.location=coord((1.65,1.35,2.6));cam.rotation_euler=(Vector(coord((0,.46,0)))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(REVIEW/'02-bao-three-quarter.png');bpy.ops.render.render(write_still=True)
for o in [root,*root.children_recursive]:o.hide_render=True
for o in [basket,*basket.children_recursive]:o.hide_render=False
hinge.rotation_euler[0]=math.radians(-105);cam.location=coord((1.8,2.25,3));cam.rotation_euler=(Vector(coord((0,.57,0)))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=2.35;scene.render.filepath=str(REVIEW/'03-steamer-open.png');bpy.ops.render.render(write_still=True)
print('Exported original squishy and hinged steamer:',OUT)
