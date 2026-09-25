"""Three reference-led student sculpts on the existing Quaternius skeleton/peaceful clips.
Original authored mesh, vertex-color palette, one body material plus glossy eyes.
Blender 5.2. Run from repository root; source rig files are ignored local inputs.
"""
import bpy, math, json, random
from mathutils import Vector
from pathlib import Path
ROOT=Path.cwd();OUT=ROOT/'public/assets/people';REPORT={}
def rgb(h):
 h=h.lstrip('#');v=[int(h[i:i+2],16)/255 for i in (0,2,4)]
 return tuple(((x+.055)/1.055)**2.4 if x>.04045 else x/12.92 for x in v)+(1,)
def material(name,rough):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;bs=n.get('Principled BSDF');bs.inputs['Roughness'].default_value=rough;bs.inputs['Specular IOR Level'].default_value=.25
 col=n.new('ShaderNodeVertexColor');col.layer_name='Col';m.node_tree.links.new(col.outputs['Color'],bs.inputs['Base Color']);return m
def finish(obj,color,bone,gloss=False,blink=None):
 bpy.context.view_layer.objects.active=obj;obj.select_set(True);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 obj.data.materials.clear();obj.data.materials.append(EYE if gloss else SATIN)
 colors=obj.data.color_attributes.new(name='Col',type='FLOAT_COLOR',domain='CORNER');c=rgb(color)
 for d in colors.data:d.color=c
 for p in obj.data.polygons:p.use_smooth=True
 obj.vertex_groups.new(name=bone).add(list(range(len(obj.data.vertices))),1,'REPLACE')
 if blink:obj.vertex_groups.new(name=blink).add(list(range(len(obj.data.vertices))),1,'REPLACE')
 PARTS.append(obj);obj.select_set(False);return obj
def ell(name,pos,scale,color,bone='Head',segments=16,rings=10,gloss=False,blink=None):
 bpy.ops.object.select_all(action='DESELECT');bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=pos);o=bpy.context.object;o.name=name;o.scale=scale;return finish(o,color,bone,gloss,blink)
def tube(name,points,radii,color,bone='Head',sides=10):
 vertices=[];faces=[];points=[Vector(p) for p in points]
 for i,p in enumerate(points):
  d=(points[min(i+1,len(points)-1)]-points[max(0,i-1)]).normalized();axis=d.cross(Vector((0,1,0)))
  if axis.length<.01:axis=d.cross(Vector((1,0,0)))
  axis.normalize();other=d.cross(axis).normalized();radius=radii[i] if isinstance(radii,list) else radii
  for k in range(sides):
   a=k*math.tau/sides;vertices.append(p+radius*(math.cos(a)*axis+math.sin(a)*other))
  if i:
   for k in range(sides):a=(i-1)*sides+k;b=(i-1)*sides+(k+1)%sides;faces.append((a,b,b+sides,a+sides))
 faces.append(tuple(reversed(range(sides))));faces.append(tuple((len(points)-1)*sides+k for k in range(sides)))
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);return finish(o,color,bone)
def bezier(name,control,width,color,bone='Head',sides=10,steps=14):
 a,b,c,d=map(Vector,control);pts=[];rs=[]
 for i in range(steps):
  t=i/(steps-1);pts.append((1-t)**3*a+3*(1-t)**2*t*b+3*(1-t)*t*t*c+t**3*d);rs.append(max(.005,width*math.sin(math.pi*(.10+.87*t))**.6))
 return tube(name,pts,rs,color,bone,sides)
def segment(name,a,b,width,depth,color,bone):
 a,b=Vector(a),Vector(b);o=ell(name,(a+b)/2,(width,depth,(b-a).length/2+width*.5),color,bone,12,8);o.rotation_mode='QUATERNION';o.rotation_quaternion=(b-a).to_track_quat('Z','Y');return o
for file,source,kind,skin,hair,coat,pants in [
 ('jules','Hoodie','sweep','#efb98c','#825037','#7da9e7','#54799c'),
 ('remy','CasualBoy','curls','#b97650','#47302d','#93c9b6','#497f7b'),
 ('poppy','CasualWoman','pony','#f4bc96','#e9b951','#c49ae5','#af80cb')]:
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(ROOT/'artifacts/npc-upgrade/source'/f'{source}.gltf'))
 rig=next(o for o in bpy.data.objects if o.type=='ARMATURE')
 if rig.animation_data:
  rig.animation_data.action=None
  for track in list(rig.animation_data.nla_tracks):rig.animation_data.nla_tracks.remove(track)
 for action in list(bpy.data.actions):
  if action.name not in ['Idle_Neutral','Wave','Interact']:bpy.data.actions.remove(action)
 for o in list(bpy.data.objects):
  if o.type!='ARMATURE':bpy.data.objects.remove(o,do_unlink=True)
 for p in rig.pose.bones:p.matrix_basis.identity()
 PARTS=[];SATIN=material('Student soft satin',.73);EYE=material('Student eye gleam',.28)
 # Round cheeks and soft jaw: a deliberately larger head, not a scaled adult face.
 ell('Soft cheek head',(0,-.043,1.79),(.346,.274,.325),skin,segments=28,rings=16)
 for side in [-1,1]:
  ell('Ear',(side*.344,-.04,1.755),(.074,.060,.101),skin,segments=16)
  ell('Ear inset',(side*.367,-.090,1.755),(.036,.014,.054),'#df927a' if kind!='curls' else '#a76347',segments=12)
  x=side*.133;eyeZ=1.825;eyeY=-.302
  ell('Eye white',(x,eyeY,eyeZ),(.080,.015,.106),'#fff7e8',segments=20,rings=12,blink='Blink_'+str(side))
  ell('Chocolate eye',(x+side*.007,eyeY-.017,eyeZ),(.065,.010,.089),'#33242c',segments=20,rings=12,gloss=True,blink='Blink_'+str(side))
  ell('Eye catchlight',(x-.017,eyeY-.027,eyeZ+.044),(.012,.004,.016),'#fffdf4',segments=12,rings=8,gloss=True,blink='Blink_'+str(side))
  ell('Small eye sparkle',(x+.020,eyeY-.027,eyeZ-.038),(.007,.004,.009),'#eadad0',segments=8,rings=6,gloss=True,blink='Blink_'+str(side))
  pts=[(x+(i/8-.5)*.132,-.277,1.958+.014*math.sin(math.pi*i/8)) for i in range(9)];tube('Kind eyebrow',pts,.010,hair)
  ell('Blush',(side*.228,-.251,1.705),(.053,.008,.027),'#edaa97' if kind!='curls' else '#c78266',segments=16,rings=8)
 ell('Button nose',(0,-.320,1.713),(.027,.025,.028), '#e9a17c' if kind!='curls' else '#a46343',segments=16)
 pts=[((i/14-.5)*.154,-.279-.013*math.sin(math.pi*i/14),1.667-.024*math.sin(math.pi*i/14)) for i in range(15)];tube('Happy smile',pts,.009,'#794638' if kind!='curls' else '#623b30',sides=8)
 # Neck and clean, soft clothing. The original shoulder/elbow and finger hierarchy stays intact.
 segment('Neck',(0,-.043,1.46),(0,-.043,1.585),.068,.070,skin,'Neck')
 ell('Shirt body',(0,-.034,1.232),(.221,.145,.252),'#fff0cb' if kind=='curls' else '#f2afca' if kind=='pony' else '#fff5e8','Torso',24,16)
 for side in [-1,1]:
  bone='UpperArm.'+('L' if side>0 else 'R');fore='LowerArm.'+('L' if side>0 else 'R');hand='Wrist.'+('L' if side>0 else 'R')
  a=rig.data.bones[bone].head_local;b=rig.data.bones[fore].head_local;c=rig.data.bones[hand].head_local
  segment('Rounded jacket sleeve',a,b,.112,.111,coat,bone);segment('Sleeve forearm',b,c,.091,.089,coat,fore)
  point=b.lerp(c,.90);segment('Soft cuff',point,c,.085,.087,coat,fore)
  h=c+(c-b).normalized()*.064;ell('Mitten hand',h,(.089,.053,.068),skin,hand,16,10);ell('Thumb',h+Vector((0,-.048,-.024)),(.038,.038,.041),skin,hand,12,8)
  ell('Jacket front',(side*.134,-.069,1.236),(.102,.128,.253),coat,'Torso',20,12)
  tube('Jacket opening edge',[(side*.060,-.180,1.043),(side*.071,-.187,1.25),(side*.068,-.161,1.43)],.013,coat,'Torso',8)
  # Hem, drawcords and pocket seams remain readable without noisy fabric maps.
  tube('Pocket seam',[(side*.109,-.186,1.14),(side*.173,-.175,1.18)],.007,coat,'Torso',6)
  tube('Hood drawcord',[(side*.082,-.161,1.40),(side*.088,-.19,1.31)],.008,'#f6eedf','Chest',6)
 ell('Hood behind neck',(0,.069,1.429),(.20,.15,.104),coat,'Chest',20,12)
 # Slim trousers with rounded knees and real sneaker silhouettes, sized to the unchanged leg bones.
 ell('Trousers hips',(0,-.031,.98),(.209,.133,.120),pants,'Hips',20,12)
 for side in [-1,1]:
  suf='L' if side>0 else 'R';upper='UpperLeg.'+suf;lower='LowerLeg.'+suf;foot='Foot.'+suf
  a=rig.data.bones[upper].head_local;b=rig.data.bones[lower].head_local;c=rig.data.bones[lower].tail_local
  # One continuous cloth surface with a soft knee weight blend prevents segmented 'bead' legs.
  x=side*.1206
  trouser=tube('Continuous soft trousers',[(x,-.045,.99),(x,-.060,.86),(x,-.080,.62),(x,-.087,.533),(x,-.082,.44),(x,-.075,.29),(x,-.066,.105)],[.097,.106,.101,.096,.096,.092,.087],pants,upper,14)
  low=trouser.vertex_groups.new(name=lower);up=trouser.vertex_groups[upper]
  for v in trouser.data.vertices:
   weight=max(0,min(1,(.625-v.co.z)/.185));up.add([v.index],1-weight,'REPLACE');low.add([v.index],weight,'REPLACE')
  segment('Turned up cuff',b.lerp(c,.85),c,.101,.098,coat,lower)
  x=side*.1206;ell('Sneaker sole',(x,-.146,.029),(.111,.205,.038),'#f5efdf',foot,20,10)
  ell('Sneaker upper',(x,-.133,.090),(.101,.173,.084),coat,foot,20,12)
  ell('Sneaker toe',(x,-.257,.064),(.101,.077,.053),'#fff7e7',foot,16,10)
  for y in [-.13,-.19]:
   strap=[]
   for k in range(9):
    sx=(k/8-.5)*.165;sz=.09+.084*math.sqrt(max(.01,1-(sx/.101)**2-((y+.133)/.173)**2))+.008;strap.append((x+sx,y,sz))
   tube('Shoe strap',strap,.012,'#fff7e7',foot,6)
 # Sculpted hair masses with distinct silhouettes and restrained highlight colors.
 hair_start=len(PARTS)
 if kind=='curls':
  ell('Curly hair base',(0,-.015,2.018),(.348,.276,.204),hair,segments=24,rings=14)
  rng=random.Random(22)
  for row in range(4):
   theta=.30+row*.38;count=5+row*4
   for j in range(count):
    a=j/count*math.tau+row*.28;pos=(math.sin(theta)*math.cos(a)*.33,-.025+math.sin(theta)*math.sin(a)*.265,2.006+math.cos(theta)*.205);radius=.057+rng.random()*.015
    ell('Soft curl',pos,(radius,radius,radius*1.03),['#47302d','#513832','#5b3c32'][j%3],segments=10,rings=6)
 else:
  # Cap stops above the forehead at the front and reaches the nape behind the head.
  verts=[];faces=[];rings=13;segments=32
  for j in range(rings):
   t=j/(rings-1)
   for k in range(segments):
    a=k/segments*math.tau;limit=1.48+.48*math.sin(a);theta=.03+t*limit
    verts.append((.355*math.sin(theta)*math.cos(a),-.025+.283*math.sin(theta)*math.sin(a),1.877+.29*math.cos(theta)))
  for j in range(rings-1):
   for k in range(segments):n=j*segments+k;m=j*segments+(k+1)%segments;faces.append((n,n+segments,m+segments,m))
  mesh=bpy.data.meshes.new('Hair cap');mesh.from_pydata(verts,[],faces);o=bpy.data.objects.new('Hair cap',mesh);bpy.context.collection.objects.link(o);bpy.context.view_layer.objects.active=o;o.select_set(True)
  solid=o.modifiers.new('Hair cap volume','SOLIDIFY');solid.thickness=.045;solid.offset=-1;bpy.ops.object.modifier_apply(modifier=solid.name);finish(o,hair,'Head')
  if kind=='sweep':
   for i in range(4):
    start=(.17-i*.055,-.16+i*.006,2.095+i*.019);end=(-.29+i*.045,-.21,1.941+i*.02)
    bezier('Swept fringe',[start,(-.08,-.33,2.10+i*.018),(-.27,-.34,2.015+i*.015),end],.085,['#825037','#915d3e','#986645','#895739'][i])
   bezier('Little cowlick',[(.02,.045,2.10),(.13,.04,2.17),(.27,-.06,2.26),(.30,-.16,2.20)],.055,hair)
  else:
   for i in range(3):bezier('Golden side fringe',[(.12+i*.035,-.11,2.12),(.05,-.33,2.14),(-.22,-.32,2.04),(-.29+i*.045,-.24,1.93+i*.02)],.067,['#e9b951','#f0c76b','#edbf60'][i])
   ell('Ponytail tie',(-.18,.18,2.135),(.12,.092,.06),'#e37cbb',segments=16)
   bezier('Bouncy ponytail',[(-.19,.19,2.15),(-.51,.22,2.35),(-.58,.16,1.83),(-.46,.13,1.74)],.14,'#eabd5c',steps=22,sides=16)
   bezier('Ponytail highlight',[(-.23,.11,2.18),(-.48,.10,2.32),(-.52,.025,1.9),(-.47,.01,1.80)],.035,'#f2cd79',steps=18)
  for side in [-1,1]:bezier('Face framing lock',[(side*.30,-.04,2.015),(side*.36,-.10,1.91),(side*.32,-.12,1.80),(side*.30,-.14,1.77)],.037,hair)
 # Fuse overlapping hair clumps into one smooth sculpt instead of visible intersecting tubes.
 if kind!='curls':
  pieces=[o for o in PARTS[hair_start:] if o.name!='Ponytail tie'];bpy.ops.object.select_all(action='DESELECT')
  for o in pieces:o.select_set(True)
  bpy.context.view_layer.objects.active=pieces[0];bpy.ops.object.join();o=pieces[0]
  bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
  remesh=o.modifiers.new('Joined clay hair','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.012;bpy.ops.object.modifier_apply(modifier=remesh.name)
  smooth=o.modifiers.new('Soften sculpt transitions','SMOOTH');smooth.factor=.7;smooth.iterations=3;bpy.ops.object.modifier_apply(modifier=smooth.name)
  dec=o.modifiers.new('Game hair budget','DECIMATE');dec.ratio=.20;bpy.ops.object.modifier_apply(modifier=dec.name)
  PARTS=[part for part in PARTS if part not in pieces];o.vertex_groups.clear()
  for attribute in list(o.data.color_attributes):o.data.color_attributes.remove(attribute)
  finish(o,hair,'Head')
 # Join to two draw surfaces; all vertex weights survive the join.
 bpy.ops.object.select_all(action='DESELECT')
 for o in PARTS:o.select_set(True)
 bpy.context.view_layer.objects.active=PARTS[0];bpy.ops.object.join();body=bpy.context.object;body.name='Student_'+file
 bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
 body.data.validate(verbose=False,clean_customdata=False)
 body.parent=rig;mod=body.modifiers.new('Original character skin','ARMATURE');mod.object=rig
 # Blink morph compresses the actual eye surfaces, preserving a thin closed lash line.
 body.shape_key_add(name='Basis');blink=body.shape_key_add(name='Blink')
 blinkGroups={g.index for g in body.vertex_groups if g.name.startswith('Blink_')}
 for v in body.data.vertices:
  if any(g.group in blinkGroups for g in v.groups):blink.data[v.index].co.z=1.825+(v.co.z-1.825)*.07
 body.data.shape_keys.key_blocks['Blink'].value=0
 bpy.ops.object.select_all(action='DESELECT');body.select_set(True);rig.select_set(True);bpy.context.view_layer.objects.active=rig
 bpy.ops.export_scene.gltf(filepath=str(OUT/('student-'+file+'.glb')),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_yup=True,export_morph=True)
 body.data.calc_loop_triangles();REPORT[file]={'vertices':len(body.data.vertices),'triangles':len(body.data.loop_triangles),'materials':len(body.data.materials),'fileBytes':(OUT/('student-'+file+'.glb')).stat().st_size,'clips':[a.name for a in bpy.data.actions]}
(ROOT/'artifacts/refinement/student-build.json').write_text(json.dumps(REPORT,indent=2))


