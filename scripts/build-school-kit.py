"""Reference-led school interiors. CC0 Kenney props + original beveled furniture.
Coordinates below use game axes (X right, Y up, Z toward viewer).
No downloaded art is traced; text, surfaces and decorative flowers are original.
"""
import bpy, math, random, json
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path.cwd(); OUT=ROOT/'public/assets/school-kit'; OUT.mkdir(parents=True,exist_ok=True)
random.seed(23)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
M={}; CACHE={}; obstacles=[]
def rgb(h):
 v=[int(h[i:i+2],16)/255 for i in (1,3,5)]
 return tuple(x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in v)+(1,)
def mat(n,h):
 if n in M:return M[n]
 m=bpy.data.materials.new(n);m.diffuse_color=rgb(h);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=rgb(h);p.inputs['Roughness'].default_value=.83;M[n]=m;return m
cream=mat('Warm ivory','#f6ebd4');wood=mat('Honey maple','#ddb57d');mint=mat('Painted sage','#87b9ac');mintdark=mat('Sage shadow','#68968d');pink=mat('Blush pink','#e8a9c7');lavender=mat('Lilac','#b79bce');blue=mat('Cornflower','#9cbcd0');gold=mat('Butter yellow','#f3d47c');paper=mat('Warm white','#fff6e7');metal=mat('Soft silver','#b6bac2');dark=mat('Slate','#555568');chalk=mat('Chalkboard','#3c5051');coral=mat('Terracotta door','#d88760');green=mat('Plant green','#6f9363')
def box(n,p,s,m,bevel=.025):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=n;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:
  b=o.modifiers.new('Softened edges','BEVEL');b.width=min(bevel,min(s)*.25);b.segments=2;bpy.ops.object.modifier_apply(modifier=b.name)
  b=o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=b.name)
 return o
def cyl(n,p,r,d,m,vertices=24):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=d,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=n;o.data.materials.append(m)
 b=o.modifiers.new('Rounded edge','BEVEL');b.width=min(.015,d/5);b.segments=2;bpy.ops.object.modifier_apply(modifier=b.name);o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');return o
def ball(n,p,s,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=1,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.name=n;o.scale=(s[0],s[2],s[1]);o.data.materials.append(m)
 for f in o.data.polygons:f.use_smooth=True
 return o
fontpath=Path('C:/Windows/Fonts/comicbd.ttf');FONT=bpy.data.fonts.load(str(fontpath)) if fontpath.exists() else None
def text(n,words,p,size,m,align='CENTER'):
 c=bpy.data.curves.new(n,'FONT');c.body=words;c.size=size;c.align_x=align;c.align_y='CENTER';c.space_line=1.25;c.extrude=.001;c.resolution_u=3
 if FONT:c.font=FONT
 o=bpy.data.objects.new(n,c);bpy.context.collection.objects.link(o);o.location=(p[0],-p[2],p[1]);o.rotation_euler=(math.pi/2,0,0);o.data.materials.append(m);return o
def block(x,z,w,d):obstacles.append({'center':[x,0,z],'half':[w/2,1,d/2]})
def asset(pack,name,p,size=.4,yaw=0,width=False):
 path=(ROOT/'artifacts/food-kit/source/Models/GLB format'/f'{name}.glb') if pack=='food' else ROOT/'public/assets/environment/kenney'/pack/f'{name}.glb'
 key=str(path)
 if key not in CACHE:
  before=set(bpy.context.scene.objects);bpy.ops.import_scene.gltf(filepath=key);parts=list(set(bpy.context.scene.objects)-before);bpy.context.view_layer.update()
  verts=[o.matrix_world@Vector(c) for o in parts if o.type=='MESH' for c in o.bound_box];lo=Vector(tuple(min(v[i] for v in verts) for i in range(3)));hi=Vector(tuple(max(v[i] for v in verts) for i in range(3)))
  for o in parts:
   for col in list(o.users_collection):col.objects.unlink(o)
  CACHE[key]=(parts,lo,hi)
 parts,lo,hi=CACHE[key];scale=size/(hi.x-lo.x if width else hi.z-lo.z)
 holder=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(holder);holder.location=(p[0],-p[2],p[1]);holder.rotation_euler.z=math.radians(yaw)
 norm=bpy.data.objects.new('Model normalization',None);bpy.context.collection.objects.link(norm);norm.parent=holder;norm.scale=(scale,)*3;norm.location=(-(lo.x+hi.x)/2*scale,-(lo.y+hi.y)/2*scale,-lo.z*scale)
 copies={o:o.copy() for o in parts}
 for source,o in copies.items():
  bpy.context.collection.objects.link(o);o.parent=copies.get(source.parent,norm)
 return holder
def flower(x,y,z,r=.15,petal=paper,wall=False):
 for i in range(5):
  a=i*math.tau/5
  if wall:ball('Flower petal',(x+math.cos(a)*r*.62,y+math.sin(a)*r*.62,z),(r*.5,r*.5,.016),petal)
  else:ball('Flower petal',(x+math.cos(a)*r*.62,y,z+math.sin(a)*r*.62),(r*.5,.012,r*.5),petal)
 if wall:ball('Flower heart',(x,y,z+.02),(r*.32,r*.32,.016),gold)
 else:cyl('Flower heart',(x,y+.015,z),r*.32,.018,gold)
def poster(x,y,z,words,w=1,h=1.5,color=pink):
 box('Poster ivory border',(x,y,z),(w,.0+h,.035),paper,.01);box('Pastel poster',(x,y,z+.025),(w-.09,h-.09,.016),color,.003)
 text('Kind classroom words',words,(x,y+.12,z+.04),.16,dark);flower(x,y-h*.3,z+.065,.13,wall=True)
def plant(x,y,z,h=.55):
 # Broad, softly rounded leaves match the reference better than miniature conifers.
 pot=h*.29;radius=h*.18
 bpy.ops.mesh.primitive_cone_add(vertices=16,radius1=radius*.75,radius2=radius,depth=pot,location=(x,-z,y+pot/2));bpy.context.object.name='Ivory plant pot';bpy.context.object.data.materials.append(paper)
 cyl('Pot soil',(x,y+pot,z),radius*.86,.018,mat('Pot soil','#8e785f'),16)
 for i in range(7):
  a=i*2.39996;spread=h*(.13 if i<5 else .045);height=h*(.53+(i%3)*.075)
  leaf=ball('Broad soft leaf',(x+math.cos(a)*spread,y+height,z+math.sin(a)*spread),(h*.095,h*.25,h*.043),[green,mat('Leaf highlight','#92af73'),mat('Leaf shade','#638569')][i%3])
  leaf.rotation_euler=(math.sin(a)*.40,math.cos(a)*.40,a)
def books(x,y,z,h=.22):asset('furniture','books',(x,y,z),h)
def backpack(x,z,color):
 box('School backpack',(x,.33,z),(.36,.60,.24),color,.07);box('Front pocket',(x,.23,z+.13),(.29,.24,.075),color,.04)
 box('Bag zipper',(x,.355,z+.171),(.23,.017,.01),paper,.002)
 for dx in [-.09,.09]:box('Bag handle',(x+dx,.66,z),(.04,.12,.04),color,.01)
 box('Bag handle top',(x,.72,z),(.22,.04,.04),color,.01)
def shelf(x,z,w=1.25,h=1.65,color=mint):
 box('Shelf backing',(x,h/2,z-.22),(w,h,.07),color)
 for dx in [-w/2,w/2]:box('Shelf upright',(x+dx,h/2,z),(.075,h,.52),color)
 for y in [.08,h*.34,h*.66,h]:box('Shelf board',(x,y,z),(w,.07,.54),color)
 for level in range(3):
  for i in range(5):
   bx=x-w*.38+i*w*.17;bh=.24+.04*((level+i)%3)
   box('Pastel library book',(bx,.12+level*h*.32+bh/2,z+.01),(.13,bh,.28),[pink,blue,gold,lavender,mint][(i+level)%5],.012)
 block(x,z,w+.08,.6)
def clock(x,y,z):
 o=cyl('Mint wall clock',(x,y,z),.36,.06,mint,32);o.rotation_euler.x=math.pi/2
 o=cyl('Clock face',(x,y,z+.04),.30,.025,paper,32);o.rotation_euler.x=math.pi/2
 box('Clock minute',(x,y+.075,z+.063),(.018,.17,.018),dark,.002);o=box('Clock hour',(x+.06,y-.035,z+.063),(.15,.019,.018),dark,.002);o.rotation_euler.y=-.5
 for i in range(12):
  a=i*math.tau/12;ball('Clock tick',(x+.253*math.sin(a),y+.253*math.cos(a),z+.065),(.012,.012,.009),dark)
def door(x,z,label):
 # Open hinged leaf is parked against the jamb; the doorway is physically clear.
 for dx in [-.83,.83]:box('Door frame',(x+dx,1.35,z),(.1,2.7,.24),paper)
 box('Door lintel',(x,2.73,z),(1.76,.12,.25),paper)
 box('Open coral door',(x+.74,1.31,z-.69),(.09,2.6,1.36),coral)
 box('Door window',(x+.68,1.72,z-.69),(.016,.93,.44),blue)
 box('Door handle',(x+.66,1.0,z-1.15),(.06,.28,.06),metal)
 text('Door destination',label,(x,3.02,z+.13),.18,dark)
def room_shell(cafe=False):
 floorA=mat('Cafeteria ivory tile' if cafe else 'Classroom limestone','#eee6d5');floorB=mat('Pale gray tile','#d0d1d2');floorP=mat('Pink floor accents','#e9cad8')
 for iz in range(14):
  for ix in range(12):
   m=([floorA,floorA,floorB,floorA,floorP][(ix*7+iz*3)%5] if cafe else floorA)
   box('Individual floor tile',(-5.5+ix,-.035,-6.5+iz),(.992,.10,.992),m,0)
 box('Foundation',(0,-.17,0),(12.25,.18,14.25),cream)
 # back wall divided around the door at x=4.6
 for x,w in [(-1.12,9.76),(5.74,.52)]:
  box('Warm plaster back wall',(x,1.7,-7),(w,3.4,.16),cream,.01);box('Mint wainscot',(x,.41,-6.9),(w,.82,.07),mint,.005)
  box('Wainscot cap',(x,.85,-6.84),(w,.045,.09),paper,.005)
 if cafe:
  for x in [i*.28-5.8 for i in range(34)]:box('Wainscot groove',(x,.40,-6.85),(.018,.72,.012),mintdark,.002)
 box('Left lower wall',(-6,.36,0),(.17,.72,14),cream)
 box('Window lintel',(-6,3.22,0),(.17,.36,14),cream)
 for z in [-6.9,-3.5,0,3.5,6.9]:box('Window pillar',(-6,1.92,z),(.2,2.55,.16),paper)
 for z in [-5.2,-1.75,1.75,5.2]:
  box('Window sill',(-5.87,.84,z),(.42,.14,3.15),paper)
  box('Window horizontal frame',(-6,1.96,z),(.13,.065,3.2),paper)
  for dz in [-.8,0,.8]:box('Window vertical frame',(-6,2.03,z+dz),(.13,2.25,.05),paper)
  # Pale sky beyond the open window, lower greenery outside; no expensive glass pass.
  box('Pastel sky outside',(-6.17,2,z),(.035,2.25,3.15),mat('Window daylight','#c2dce3'),0)
  box('Garden beyond window',(-6.12,1.02,z),(.035,.35,3.15),mat('Outside green','#aac791'),0)
 for x,w in [(-3.55,4.9),(3.55,4.9)]:box('Low front cutaway wall',(x,.28,7),(w,.56,.16),cream)
 box('Low right cutaway wall',(6,.28,0),(.16,.56,14),cream)
 # Front opening stays clear; cafe entry is central, matching the concept.
 block(-6.05,0,.1,14);block(6.05,0,.1,14);block(-1.12,-7,9.76,.2);block(5.74,-7,.52,.2)
 if not cafe:door(4.6,-7,'CAFETERIA  ↑')
 else:
  # The pictured back door is decorative. Navigation returns through the front opening.
  box('Coral pantry door',(4.6,1.3,-6.98),(1.5,2.6,.1),coral);box('Pantry window',(4.6,1.68,-6.90),(.43,.95,.02),blue);box('Pantry handle',(5.14,.95,-6.86),(.055,.28,.06),metal);block(4.6,-7,1.65,.2)
def desk(x,z,double=True):
 w=2.05 if double else 1.05
 box('Student maple desktop',(x,.80,z),(w,.12,.85),wood,.04)
 if double:box('Paired desk seam',(x,.864,z),(.012,.002,.8),mat('Desk seam','#c59c69'),0)
 for dx in [-w/2+.12,w/2-.12]:
  for dz in [-.3,.3]:box('Desk metal leg',(x+dx,.38,z+dz),(.065,.76,.065),metal,.012)
 for dx in ([-.51,.51] if double else [0]):
  chair(x+dx,z-.80,mint);chair(x+dx,z+.8,mint,True)
 block(x,z,w+.1,2.15)
def chair(x,z,color,reverse=False):
 box('Chair seat',(x,.43,z),(.48,.095,.48),color,.035)
 for dx in [-.2,.2]:
  for dz in [-.18,.18]:box('Chair leg',(x+dx,.215,z+dz),(.045,.43,.045),metal,.009)
 back=z+(.21 if reverse else -.21);box('Chair back',(x,.76,back),(.49,.36,.055),color,.035)
 for dx in [-.21,.21]:box('Chair upright',(x+dx,.64,back),(.04,.44,.045),metal,.008)
def rug(x,z,w,d,color,round=False):
 color=mat(color.name+' woven','#b69bcf' if color==lavender else '#e6b5cb')
 if round:
  o=cyl('Flower reading rug',(x,.025,z),w/2,.025,color,64);o.scale.y=d/w
 else:box('Soft woven rug',(x,.023,z),(w,.022,d),color,.01)
def tray(x,y,z,color=lavender):
 box('Lunch tray',(x,y,z),(.67,.055,.47),color,.035)
 for dx in [-.315,.315]:box('Tray rim',(x+dx,y+.027,z),(.027,.04,.44),metal,.008)
 for dz in [-.215,.215]:box('Tray rim',(x,y+.027,z+dz),(.63,.04,.027),metal,.008)
 asset('food','pizza',(x-.1,y+.04,z),.31,width=True);asset('food','apple',(x+.2,y+.04,z+.1),.115)
def classroom():
 room_shell()
 # Broad chalkboard, teacher work area, pinboard and daylight library.
 box('Wood chalkboard frame',(-.2,2.05,-6.84),(5.8,1.75,.14),wood)
 box('Slate board',(-.2,2.05,-6.75),(5.57,1.53,.025),chalk,.004)
 box('Club paper on board',(-1.20,2.27,-6.715),(3.2,.9,.015),paper,.004)
 text('Trading club heading','TRADING CLUB',(-1.15,2.44,-6.69),.30,dark);text('Trading club caption','Bring extras. Make friends.',(-1.18,2.04,-6.69),.165,dark)
 text('Chalkboard kindness','Be kind\nShare\nTrade\nCollect\nHave fun!',(1.67,2.12,-6.70),.18,paper)
 box('Chalk ledge',(-.2,1.16,-6.70),(5.9,.075,.21),wood)
 box('Board eraser',(-1.82,1.23,-6.63),(.26,.09,.1),blue)
 shelf(-4.9,-6.3,1.25,2.35);plant(-4.93,2.4,-6.35,.40)
 box('Cork frame',(-3.5,2.20,-6.80),(1.25,1.7,.12),wood);box('Cork board',(-3.5,2.2,-6.73),(1.1,1.54,.025),mat('Cork','#c99f79'))
 for i in range(6):box('Pinned note',(-3.77+(i%2)*.50,1.7+(i//2)*.48,-6.69),(.31,.37,.01),[pink,paper,gold,blue][i%4],.002)
 rug(-.3,-4.95,4.0,2.1,lavender);box('Teacher desktop',(-.3,1.03,-5.0),(2.9,.16,1.1),mint,.04);box('Teacher modesty panel',(-.3,.5,-4.60),(2.7,.86,.1),mintdark)
 for dx in [-1.28,1.28]:box('Teacher desk side',(-.3+dx,.51,-5),(.10,.92,.95),mint)
 chair(-.3,-5.95,mat('Teacher chair plum','#a68d9c'));plant(.65,1.13,-5.0,.37);books(.12,1.13,-5.05,.19)
 box('Pencil cup',(-1.32,1.27,-4.97),(.21,.30,.21),mintdark)
 for i in range(6):cyl('Yellow pencil',(-1.39+i*.026,1.49,-4.98),.012,.28,gold,8)
 block(-.3,-5.12,3.1,1.8)
 asset('furniture','trashcan',(1.52,0,-5.0),.55);asset('furniture','sideTableDrawers',(3.10,0,-6.28),.95);plant(3.10,.97,-6.28,.4);block(3.1,-6.28,.72,.72)
 clock(3.12,2.83,-6.83)
 poster(3.12,1.83,-6.8,'SHARE\nA SMILE',.90,1.25,pink)
 # Four paired clusters, with clear central and right-hand routes to the door.
 for x,z in [(-3.1,-1.75),(2.65,-1.75),(0,1.5),(-3.2,2.5)]:
  desk(x,z);books(x-.48,.88,z,.14);backpack(x+1.05,z+.54,[blue,pink,lavender][int(abs(x))%3])
 for z in [-3.5,.0,3.7]:
  # low window library, kept below the glazing
  shelf(-5.42,z,.7,.8,gold);plant(-5.42,.88,z,.34)
 asset('furniture','coatRackStanding',(-5.0,0,5.8),1.65)
 rug(-2.9,5.35,3.45,2.45,lavender,True)
 for x,z,r in [(-3.9,4.7,.23),(-2.45,4.4,.22),(-3.75,5.9,.18),(-1.72,5.62,.20),(-2.5,6.2,.14)]:flower(x,.055,z,r)
 for x,z,c in [(-4.0,5.15,pink),(-1.76,5.7,lavender)]:ball('Reading pouf',(x,.23,z),(.48,.24,.44),c)
 cyl('Reading table',(-2.75,.52,5.2),.53,.09,paper);cyl('Reading table pedestal',(-2.75,.26,5.2),.095,.5,wood);plant(-2.75,.575,5.2,.32);block(-2.75,5.2,1.05,1.0)
 rug(3.02,4.52,3.7,3.05,pink);box('Squishy display table',(3.02,.77,4.4),(3.25,.12,.90),paper,.035)
 for dx in [-1.4,1.4]:
  for dz in [-.30,.30]:box('Display table leg',(3.02+dx,.38,4.4+dz),(.09,.72,.09),wood)
 for i,c in enumerate([lavender,blue,mint]):box('Collection storage bin',(2.0+i*.96,.24,4.4),(.78,.39,.60),c,.05)
 box('Squishy friends sign',(3.05,1.32,4.14),(1.42,.60,.07),paper)
 text('Squishy friends','SQUISHY\nFRIENDS',(3.05,1.34,4.19),.19,dark);block(3.02,4.4,3.35,1.03)
 for x in [5.28,-5.30]:plant(x,0,6.18,1.0);block(x,6.18,.7,.7)
 books(4.23,.85,4.4,.19)
 # Globe on the right shelf.
 shelf(5.37,.78,.70,.82,gold);cyl('Globe stand',(5.37,.91,.78),.19,.14,wood)
 ball('Globe sea',(5.37,1.29,.78),(.30,.30,.30),blue)
 for lat,lon in [(35,-35),(10,-20),(-15,-5),(45,90),(20,110),(-12,90),(-35,160)]:
  a=math.radians(lat);b=math.radians(lon);v=Vector((math.cos(a)*math.cos(b),math.cos(a)*math.sin(b),math.sin(a)))
  patch=ball('Globe continent',(5.37+v.x*.285,1.29+v.z*.285,.78-v.y*.285),(.09,.016,.13),gold);patch.rotation_euler=v.to_track_quat('Z','Y').to_euler()
 # A supply cart and a little classroom trophy fill the same areas as the reference.
 for y in [.14,.54,.96]:box('Rolling art cart shelf',(-3.77,y,-5.26),(.67,.07,.48),blue)
 for dx in [-.29,.29]:
  for dz in [-.20,.20]:
   box('Art cart upright',(-3.77+dx,.56,-5.26+dz),(.035,1.05,.035),metal)
   ball('Cart caster',(-3.77+dx,.08,-5.26+dz),(.055,.055,.055),dark)
 books(-3.77,.61,-5.26,.16);books(-3.77,.21,-5.26,.18);box('Art supplies cup',(-3.77,1.09,-5.26),(.2,.24,.2),lavender)
 for i in range(5):cyl('Cart colored pencil',(-3.83+i*.03,1.28,-5.25),.013,.28,[pink,gold,blue][i%3],8)
 block(-3.77,-5.26,.75,.57)
 cyl('Trophy pedestal',(-4.65,2.45,-6.3),.16,.12,wood);cyl('Trophy stem',(-4.65,2.58,-6.3),.045,.18,gold)
 bpy.ops.mesh.primitive_cone_add(vertices=20,radius1=.085,radius2=.18,depth=.26,location=(-4.65,6.3,2.77));bpy.context.object.data.materials.append(gold)
def lunch_table(x,z,index):
 box('Cafeteria maple table',(x,.87,z),(3.2,.15,1.4),wood,.06)
 for dx in [-1.2,1.2]:
  box('Table leg',(x+dx,.40,z),(.12,.8,.12),metal);box('Table floor rail',(x+dx,.10,z),(.13,.1,2.15),metal)
 for side in [-1,1]:
  box('Stool shared frame',(x,.22,z+side*1.06),(2.65,.065,.065),metal)
  for i in range(3):
   sx=x+(i-1)*1.15;cyl('Pastel round stool',(sx,.48,z+side*1.08),.29,.115,[pink,gold,mint,blue][(i+index+side)%4]);cyl('Stool stem',(sx,.27,z+side*1.08),.044,.42,metal,12)
 plant(x,.96,z,.3);tray(x+.9,.98,z+.15)
 asset('food','carton-small',(x+1.23,.965,z-.43),.30)
 box('Napkin holder',(x-.85,1.11,z),(.3,.3,.27),pink);box('Napkin stack',(x-.85,1.21,z),(.25,.21,.23),paper,.012)
 backpack(x+1.6,z+.7,[blue,lavender,pink][index%3]);block(x,z,3.35,2.8)
def cafeteria():
 room_shell(True)
 # Stainless counter with five visibly different food wells and a framed sneeze guard.
 box('Service base',(0,.60,-5.55),(7.25,1.2,1.25),metal,.045)
 box('Counter front inset',(0,.62,-4.895),(6.85,.82,.04),mat('Counter warm silver','#c5c8cd'))
 box('Counter toe kick',(0,.10,-4.86),(7.20,.17,.05),dark)
 box('Service worktop',(0,1.22,-5.48),(7.55,.13,1.5),paper,.04)
 for i in range(5):
  x=-2.6+i*1.26;box('Recessed food well',(x,1.285,-5.48),(1.10,.08,.85),dark,.04)
  for dx in [-.55,.55]:box('Steel well lip',(x+dx,1.33,-5.48),(.04,.06,.87),metal)
  for dz in [-.435,.435]:box('Steel well lip',(x,1.33,-5.48+dz),(1.14,.06,.035),metal)
  for j in range(4):
   name=['broccoli','pizza','bread','corn','cookie'][i]
   asset('food',name,(x+(j%2-.5)*.43,1.34,-5.48+(j//2-.5)*.33),.31,width=True)
 for x in [-3.56,0,3.56]:box('Glass guard post',(x,1.60,-5.04),(.04,.60,.055),metal)
 box('Glass guard top',(0,1.90,-5.04),(7.17,.045,.065),metal)
 # Thin transparent glass is one surface, not stacked transparent geometry.
 glass=mat('Cafeteria guard glass','#d5ebee');bs=glass.node_tree.nodes.get('Principled BSDF');bs.inputs['Alpha'].default_value=.18;glass.surface_render_method='DITHERED'
 box('Sneeze guard glass',(0,1.60,-5.03),(7.05,.53,.015),glass,0)
 for i in range(8):box('Stacked lunch trays',(3.16,1.31+i*.047,-5.53),(.60,.038,.67),paper,.018)
 block(0,-5.6,7.65,1.8)
 box('Serving hatch',(0,2.5,-6.85),(6.6,1.55,.10),mat('Kitchen hatch shade','#bcb7bb'))
 box('Cafe banner frame',(-.2,3.03,-6.74),(5.8,1.14,.10),paper)
 box('Cafe lilac banner',(-.2,3.03,-6.67),(5.57,.93,.035),lavender)
 text('Good food banner','GOOD FOOD\nBRIGHT DAYS',(-.2,3.03,-6.62),.30,mat('Sign blue','#496d95'))
 flower(-2.5,3.02,-6.59,.20,pink,True);flower(2.08,3.02,-6.59,.20,pink,True)
 # Snack cabinet, bottled water, plants and menu board.
 box('Pink snack machine',(-4.82,1.1,-6.20),(1.1,2.2,.85),pink,.055);box('Snack dark window',(-4.82,1.13,-5.755),(.88,1.60,.018),dark)
 box('Snack header',(-4.82,2.00,-5.74),(.88,.28,.025),paper);text('Snacks heading','SNACKS',(-4.82,2.01,-5.715),.17,dark)
 for row in range(3):
  for i in range(3):
   box('Colorful snack carton',(-5.08+i*.26,.60+row*.43,-5.70),(.19,.30,.10),[gold,mint,lavender,pink][(i+row)%4],.018)
 block(-4.82,-6.2,1.2,.95)
 box('Water cooler',(-3.70,.67,-6.21),(.63,1.34,.62),paper);bottle=cyl('Blue water jug',(-3.7,1.66,-6.21),.24,.65,blue)
 for dx,c in [(-.11,blue),(.11,pink)]:box('Water tap',(-3.7+dx,1.08,-5.87),(.08,.08,.09),c)
 poster(3.16,2.38,-6.72,'TODAY’S LUNCH\nPizza\nFruit cups\nSalad\nMilk',1.28,1.54,chalk)
 # White chalk text over the menu panel.
 box('Menu slate',(3.16,2.38,-6.65),(1.13,1.39,.02),chalk);text('Lunch menu','TODAY’S LUNCH\nPizza\nFruit cups\nSalad\nMilk\nBe kind',(3.16,2.40,-6.60),.14,paper)
 clock(5.54,3.05,-6.82)
 for x,z in [(-5.35,-4.15),(-5.35,5.8),(5.20,5.02)]:plant(x,0,z,1.0);block(x,z,.68,.68)
 for i,(x,z) in enumerate([(-3,-1.5),(2.55,-1.5),(-3,3.10),(2.55,3.10)]):lunch_table(x,z,i)
 # Tray return and clearly differentiated recycling bins by the exit.
 for x,c,title in [(4.73,mint,'RECYCLE'),(5.52,lavender,'TRASH')]:
  box('Cafeteria sorting bin',(x,.53,6.0),(.66,1.06,.65),c,.025);box('Bin opening',(x,1.075,6.0),(.45,.025,.37),dark,.01);text('Bin label',title,(x,.67,6.34),.11,paper)
 block(5.10,6.0,1.50,.75)
 for i in range(3):
  x=-5.46;z=-1.5+i*2;box('Window ledge cabinet',(x,.37,z),(.65,.74,1.35),wood);plant(x,.77,z,.36);block(x,z,.7,1.4)
 # Small pendant shades, without extra runtime shadow-casting lights.
 for x in [-2,0,2]:
  cyl('Pendant cable',(x,3.38,-5.6),.015,.6,dark,8);bpy.ops.mesh.primitive_cone_add(vertices=24,radius1=.22,radius2=.1,depth=.22,location=(x,5.6,3.00));bpy.context.object.data.materials.append(mint)
 text('Return to classroom','CLASSROOM  ↓',(0,.16,6.81),.21,dark)
def finish(name):
 # Small embedded, original surface textures: painted plaster, maple grain and rug weave.
 for m in M.values():
  if m.get('surface_done') or not any(s in m.name for s in ['maple','plaster','ivory tile','limestone','woven']):continue
  m['surface_done']=True;image=bpy.data.images.new(m.name+' surface',width=128,height=128);pixels=[];base=[12.92*c if c<=.0031308 else 1.055*c**(1/2.4)-.055 for c in m.diffuse_color[:3]]
  for yy in range(128):
   for xx in range(128):
    grain=(math.sin(yy*.52+math.sin(xx*.055)*1.4)*.021+math.sin(yy*2.2)*.008) if 'maple' in m.name else (math.sin(xx*math.pi/2)*math.sin(yy*math.pi/2)*.03 if 'woven' in m.name else math.sin(xx*17.3+yy*23.7)*.008)
    pixels.extend([max(0,min(1,c*(1+grain))) for c in base[:3]]+[1])
  image.pixels=pixels;image.pack();node=m.node_tree.nodes.new('ShaderNodeTexImage');node.image=image;m.node_tree.links.new(node.outputs['Color'],m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
 # Convert and join static geometry, then bake gentle local contact shading into COLOR_0.
 bpy.ops.object.select_all(action='DESELECT')
 for o in list(bpy.context.scene.objects):
  if o.type in ['MESH','FONT']:
   o.select_set(True)
 bpy.context.view_layer.objects.active=next(o for o in bpy.context.selected_objects if o.type=='MESH');bpy.ops.object.convert(target='MESH');bpy.ops.object.join();o=bpy.context.object;o.name=name
 bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
 mesh=o.data;tree=BVHTree.FromPolygons([v.co for v in mesh.vertices],[tuple(p.vertices) for p in mesh.polygons],all_triangles=False)
 col=mesh.color_attributes.new(name='Soft contact shading',type='BYTE_COLOR',domain='CORNER');mesh.color_attributes.active_color=col
 cache={}
 for face in mesh.polygons:
  center=face.center;normal=face.normal
  for li in face.loop_indices:
   v=mesh.vertices[mesh.loops[li].vertex_index];key=(v.index,round(normal.x,2),round(normal.y,2),round(normal.z,2))
   if key not in cache:
    p=v.co.lerp(center,.08)+normal*.018;axis=normal.cross(Vector((0,0,1)))
    if axis.length<.1:axis=normal.cross(Vector((1,0,0)))
    axis.normalize();other=normal.cross(axis);hits=0
    for i in range(7):
     a=i*2.39996;direction=(normal*.65+axis*math.cos(a)*.76+other*math.sin(a)*.76).normalized();hit=tree.ray_cast(p,direction,.65)
     if hit[0] is not None:hits+=max(0,1-hit[3]/.65)
    cache[key]=max(.67,1-hits*.055)
   c=cache[key];col.data[li].color=(c,c,c,1)
 # Drop disconnected template objects; export the selected, merged school room only.
 bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),export_format='GLB',use_selection=True,export_yup=True,export_animations=False,export_vertex_color='ACTIVE')
 (OUT/(name+'-collision.json')).write_text(json.dumps(obstacles))
 print('SCHOOL_ROOM',name,len(mesh.vertices),'vertices',len(mesh.polygons),'faces',flush=True)
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);obstacles.clear()
import sys
if 'cafeteria-only' not in sys.argv:classroom();finish('classroom')
cafeteria();finish('cafeteria')
print('SCHOOL_KIT_COMPLETE',flush=True)
