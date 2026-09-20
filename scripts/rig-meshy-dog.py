"""Fit the CC0 Mesh2Motion quadruped rig to Sunny Pup; bake Idle/Walk to GLB.
Run with Blender --background --python scripts/rig-meshy-dog.py.
Source files are preserved. Coordinates below are Blender Z-up, front toward -Y.
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector, Quaternion

ROOT=Path.cwd(); OUT=ROOT/'artifacts/dog-rig'; OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'scripts/assets/dog/fox-animations.glb'))
arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
scene=bpy.context.scene;scene.render.fps=30
rest={b.name:b.matrix_local.copy() for b in arm.data.bones}
clips={}
for name in ['Idle','Walk']:
 action=bpy.data.actions[name];arm.animation_data.action=action
 if action.slots:arm.animation_data.action_slot=action.slots[0]
 for track in arm.animation_data.nla_tracks:track.mute=True
 start,end=action.frame_range;frames=[]
 for i in range(33):
  f=start+(end-start)*i/32;scene.frame_set(int(f),subframe=f-int(f));bpy.context.view_layer.update()
  frames.append({p.name:p.matrix.copy() for p in arm.pose.bones})
 clips[name]=frames
arm.animation_data_clear()
for ob in list(bpy.context.scene.objects):
 if ob!=arm:bpy.data.objects.remove(ob,do_unlink=True)
for action in list(bpy.data.actions):bpy.data.actions.remove(action)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/assets/pets/Meshy_AI_Sunny_Pup_0919020946_texture.glb'))
mesh=next(o for o in bpy.context.scene.objects if o.type=='MESH')
bpy.context.view_layer.objects.active=mesh;mesh.select_set(True);arm.select_set(False)
bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
ground=min(v.co.z for v in mesh.data.vertices)
for v in mesh.data.vertices:v.co.z-=ground

# Anatomical landmarks fitted to the supplied mesh, in its unscaled native units.
heads={'root':(0,0,0),'Hips':(0,.39,.65),'Spine_1':(0,.16,.65),'Spine_2':(0,-.09,.66),'Spine_2.001':(0,-.30,.70),'Spine_3':(0,-.43,.83),'Spine_4':(0,-.52,.99),'Head':(0,-.58,1.12),'Nose':(0,-.74,1.11),'Head.tip':(0,-.90,1.07),'Chin':(0,-.73,1.01),'Chin_Tip':(0,-.86,1.01),'Stomach':(0,-.03,.54),'Stomach_tip':(0,.03,.40),'Tail_Base':(0,.47,.72),'Tail_Mid':(0,.61,.74),'Tail_Mid.001':(0,.73,.80),'Tail_End':(0,.84,.89),'Tail_Tip':(0,.91,.98)}
for side,sign in [('L',1),('R',-1)]:
 def put(name,xyz):heads[name+'_'+side]=(sign*xyz[0],xyz[1],xyz[2])
 for name,xyz in {'Ear':(.20,-.54,1.28),'Ear_Tip':(.25,-.50,1.10),'Front_Leg_Shoulder':(.10,-.27,.73),'Front_Leg_Upper':(.15,-.38,.56),'Front_Leg_Lower':(.15,-.37,.33),'Front_Leg_Ankle':(.15,-.43,.10),'Front_Leg_Foot':(.15,-.46,.055),'Front_Leg_Tip':(.15,-.54,.045),'Back_Leg_Pelvis':(.09,.28,.67),'Back_Leg_Upper':(.16,.39,.56),'Back_Leg_Lower':(.16,.30,.35),'Back_Leg_Ankle':(.16,.50,.17),'Back_Leg_Foot':(.16,.49,.065),'Back_Leg_Foot_1':(.16,.43,.045),'Back_Leg_Tip':(.16,.37,.04)}.items():put(name,xyz)
mesh.select_set(False);arm.select_set(True);bpy.context.view_layer.objects.active=arm;bpy.ops.object.mode_set(mode='EDIT')
for b in arm.data.edit_bones:b.head=heads[b.name]
for b in arm.data.edit_bones:
 children=list(b.children)
 if children:b.tail=children[0].head
 else:b.tail=b.head+Vector((0,-.06,.015))
 if (b.tail-b.head).length<.025:b.tail=b.head+Vector((0,-.07,0))
 b.use_deform=b.name not in ['root','Stomach','Stomach_tip'] and not b.name.startswith(('Ear','Chin')) and b.name not in ['Nose','Head.tip']
bpy.ops.object.mode_set(mode='OBJECT')
arm.name='SunnyPupRig';mesh.name='SunnyPup';mesh.parent=arm
modifier=mesh.modifiers.new('Quadruped skin','ARMATURE');modifier.object=arm

# Smooth anatomical envelopes avoid bone-heat leakage across close paws and loose fur.
def distance(p,a,b):
 d=b-a;t=max(0,min(1,(p-a).dot(d)/d.length_squared));return (p-(a+t*d)).length
deform=[b for b in arm.data.bones if b.use_deform]
groups={b.name:mesh.vertex_groups.new(name=b.name) for b in deform}
for v in mesh.data.vertices:
 p=v.co;weights=[]
 for b in deform:
  n=b.name
  if n.endswith('_L') and p.x<-.035 or n.endswith('_R') and p.x>.035:continue
  d=distance(p,b.head_local,b.tail_local)
  # Head/ears/eyes share one rigid bone; smooth the collar into the neck.
  if p.z>1.03 and p.y<-.36:
   if n!='Head':continue
   d=.01
  elif n=='Head':d+=max(0,.88-p.z)*2
  if n.startswith('Tail') and p.y<.43:d+=.5
  if not n.startswith('Tail') and p.y>.62 and p.z>.63:d+=.5
  if 'Front_Leg' in n and p.y>.05:d+=.7
  if 'Back_Leg' in n and p.y<.05:d+=.7
  if not 'Leg' in n and p.z<.32:d+=.8
  if 'Leg' in n and p.z>.76:d+=.7
  weights.append((1/(.035+d)**4,n))
 weights=sorted(weights,reverse=True)[:4];total=sum(w for w,n in weights)
 for w,n in weights:groups[n].add([v.index],w/total,'REPLACE')

# World-space rotation deltas preserve motion while accommodating different bind axes.
target={b.name:b.matrix_local.to_quaternion() for b in arm.data.bones}
actions=[]
for name,frames in clips.items():
 arm.animation_data_create();action=bpy.data.actions.new(name);arm.animation_data.action=action
 duration=1.2 if name=='Walk' else 1.6
 for i,frame in enumerate(frames):
  frame=frames[0] if i==32 else frame # exact seamless endpoint
  sample=1+i*duration*30/32;scene.frame_set(int(sample),subframe=sample-int(sample))
  desired={}
  for pb in arm.pose.bones:
   n=pb.name;reference=frames[0][n] if name=='Idle' else rest[n];delta=frame[n].to_quaternion() @ reference.to_quaternion().inverted()
   if n=='root':delta=Quaternion()
   elif n in ['Head','Nose','Head.tip'] or n.startswith(('Spine','Hips','Tail')):delta=Quaternion().slerp(delta,.45 if name=='Idle' else .7)
   desired[n]=delta @ target[n]
   parent=pb.parent
   localRest=(target[parent.name].inverted() @ target[n]) if parent else target[n]
   localPose=(desired[parent.name].inverted() @ desired[n]) if parent else desired[n]
   pb.rotation_mode='QUATERNION';pb.rotation_quaternion=localRest.inverted() @ localPose
   pb.location=(0,0,0);pb.scale=(1,1,1)
  bpy.context.view_layer.update()
  evaluated=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get())
  bottom=min((evaluated.matrix_world@v.co).z for v in evaluated.data.vertices)
  arm.pose.bones['root'].location=target['root'].inverted() @ Vector((0,0,-bottom))
  bpy.context.view_layer.update()
  for pb in arm.pose.bones:
   pb.keyframe_insert(data_path='rotation_quaternion',frame=sample,group=pb.name)
   pb.keyframe_insert(data_path='location',frame=sample,group=pb.name)
 actions.append(action)
arm.animation_data.action=None
for action in actions:
 track=arm.animation_data.nla_tracks.new();track.name=action.name;strip=track.strips.new(action.name,1,action);track.mute=True
scene.frame_set(1)
arm.data.pose_position='REST'
bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True);arm.select_set(True);bpy.context.view_layer.objects.active=arm
OUTFILE=ROOT/'public/assets/pets/sunny-pup.glb'
arm.data.pose_position='POSE'
bpy.ops.export_scene.gltf(filepath=str(OUTFILE),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_nla_strips=True,export_anim_slide_to_zero=True,export_force_sampling=True,export_image_format='AUTO')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'sunny-pup-rigged.blend'))
print('EXPORTED',OUTFILE)
