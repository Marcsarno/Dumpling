"""Original Maple Lane toys, built in Blender. No character or rig is modified.
Named empty pivots expose the small moving parts to the game. glTF metres, Y up.
"""
import bpy, math, random, json
from pathlib import Path
from mathutils import Vector
out=Path.cwd()/'public/assets/outdoors'; source=Path.cwd()/'artifacts/daily-play'; source.mkdir(parents=True,exist_ok=True)
report=[]; random.seed(420)
def xyz(p): return (p[0],-p[2],p[1])
def begin(name):
 global mats,root,static,kind
 kind=name;bpy.ops.wm.read_factory_settings(use_empty=True)
 colors={'cream':(.96,.88,.71),'mint':(.35,.65,.52),'lilac':(.61,.43,.76),'coral':(.88,.40,.32),'gold':(.94,.67,.20),'blue':(.32,.62,.76),'ink':(.13,.12,.19),'wood':(.57,.36,.20),'brown':(.54,.31,.16),'pink':(.94,.56,.64),'leaf':(.35,.53,.21),'white':(.97,.97,.89)}
 mats={}
 for n,c in colors.items():
  m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=.48;mats[n]=m
 root=empty('Play '+name);static=empty('Scenery')
def empty(name,p=(0,0,0)):
 e=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(e);e.location=xyz(p);return e
def finish(o,name,color,par):
 o.name=name;o.data.materials.append(mats[color]);bpy.context.view_layer.update()
 if par is not None: w=o.matrix_world.copy();o.parent=par;o.matrix_world=w
 return o
def box(name,p,size,c='cream',par=None,bevel=.025):
 bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(p));o=bpy.context.object;o.dimensions=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  m=o.modifiers.new('Soft edges','BEVEL');m.width=bevel;m.segments=3;bpy.ops.object.modifier_apply(modifier=m.name)
  m=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=m.name)
 return finish(o,name,c,static if par is None else par)
def orb(name,p,size,c='cream',par=None):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10,radius=1,location=xyz(p));o=bpy.context.object;o.scale=(size[0]/2,size[2]/2,size[1]/2);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 for f in o.data.polygons:f.use_smooth=True
 return finish(o,name,c,static if par is None else par)
def rod(name,a,b,r,c='cream',par=None):
 a,b=Vector(xyz(a)),Vector(xyz(b));bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=r,depth=(b-a).length,location=(a+b)/2);o=bpy.context.object;o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
 for f in o.data.polygons:f.use_smooth=True
 return finish(o,name,c,static if par is None else par)
def ring(name,p,r,t,c='cream',par=None,vertical=False):
 bpy.ops.mesh.primitive_torus_add(major_segments=24,minor_segments=6,location=xyz(p),major_radius=r,minor_radius=t);o=bpy.context.object
 if vertical:o.rotation_euler.x=math.pi/2
 for f in o.data.polygons:f.use_smooth=True
 return finish(o,name,c,static if par is None else par)
def mesh(name,verts,faces,c,par):
 m=bpy.data.meshes.new(name);m.from_pydata([xyz(v) for v in verts],[],faces);m.update();o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);return finish(o,name,c,par)
def stand(x,z):
 box('Round-edged display top',(x,.62,z),(.65,.10,.55),'wood')
 for dx in [-.22,.22]:
  for dz in [-.17,.17]:rod('Display leg',(x+dx,.05,z+dz),(x+dx,.57,z+dz),.035,'mint')
def eyes(x,y,z,par,spacing=.08):
 for dx in [-spacing,spacing]:orb('Bright eye',(x+dx,y,z),(.055,.07,.035),'ink',par);orb('Eye glint',(x+dx-.008,y+.016,z+.014),(.014,.017,.01),'white',par)
def beachball(name,p,r=.19):
 part=empty(name,p);o=orb('Striped soft ball',p,(r*2,r*2,r*2),'cream',part)
 for c in ['coral','blue','gold']:o.data.materials.append(mats[c])
 for f in o.data.polygons:f.material_index=int((math.atan2(f.center.y,f.center.x)+math.pi)/math.pi*2)%4
 ring('Ball stitched seam',p,r+.001,.006,'white',part);return part
def duck(name,p,scale=1):
 x,y,z=p;part=empty(name,p)
 orb('Duck body',(x,y+.18*scale,z),(.48*scale,.35*scale,.60*scale),'gold',part)
 orb('Duck head',(x,y+.40*scale,z+.17*scale),(.30*scale,.32*scale,.30*scale),'gold',part)
 box('Duck bill',(x,y+.365*scale,z+.35*scale),(.25*scale,.09*scale,.23*scale),'coral',part,.04*scale)
 for dx in [-.14,.14]:orb('Duck eye',(x+dx*scale,y+.45*scale,z+.27*scale),(.035*scale,.045*scale,.025*scale),'ink',part)
 for dx in [-.22,.22]:orb('Carved wing',(x+dx*scale,y+.20*scale,z),(.10*scale,.19*scale,.32*scale),'cream',part)
 return part
def leaf(name,p,c,par=None):
 x,y,z=p;return mesh(name,[(x-.09,y,z),(x,y+.02,z-.18),(x+.09,y,z),(x,y+.01,z+.18),(x,y+.04,z)],[(0,1,4),(1,2,4),(2,3,4),(3,0,4)],c,static if par is None else par)
def export():
 # Join meshes within a moving pivot; preserve all pivots and material slots.
 for par in [o for o in bpy.data.objects if o.type=='EMPTY']:
  children=[c for c in par.children if c.type=='MESH']
  if len(children)>1:
   bpy.ops.object.select_all(action='DESELECT')
   for c in children:c.select_set(True)
   bpy.context.view_layer.objects.active=children[0];bpy.ops.object.join();children[0].name=par.name+' surfaces'
 for o in list(bpy.data.objects):
  if o!=root and o.parent is None:
   bpy.context.view_layer.update();w=o.matrix_world.copy();o.parent=root;o.matrix_world=w
 bpy.ops.wm.save_as_mainfile(filepath=str(source/('play-'+kind+'.blend')))
 bpy.ops.export_scene.gltf(filepath=str(out/('play-'+kind+'.glb')),export_format='GLB',export_animations=False,export_cameras=False,export_lights=False)
 report.append({'id':kind,'polygons':sum(len(o.data.polygons) for o in bpy.data.objects if o.type=='MESH'),'bytes':(out/('play-'+kind+'.glb')).stat().st_size})

begin('goal');beachball('Ball',(0,.20,.95))
for x in [-.8,.8]:rod('Mint goalpost',(x,.05,-1.25),(x,.95,-1.25),.045,'mint');rod('Rear goal support',(x,.1,-1.85),(x,.95,-1.25),.022,'wood')
rod('Goal crossbar',(-.8,.95,-1.25),(.8,.95,-1.25),.045,'mint')
for x in [-.7,-.5,-.3,-.1,.1,.3,.5,.7]:rod('Cotton net',(x,.1,-1.85),(x,.9,-1.28),.006,'cream')
for y in [.15,.35,.55,.75]:rod('Cotton net cross',(-.8,y,-1.85+y*.6),(.8,y,-1.85+y*.6),.006,'cream')
box('Goal line',(0,.008,-1.22),(1.6,.016,.055),'white');export()

begin('bowling');beachball('Ball',(0,.18,1.05),.17)
box('Bowling mat',(0,.015,-.1),(1.6,.025,3.0),'mint')
for i,(x,z) in enumerate([(0,-.8),(-.24,-1.16),(.24,-1.16),(-.47,-1.5),(0,-1.5),(.47,-1.5)]):
 p=empty('Pin'+str(i),(x,0,z));orb('Pin belly',(x,.18,z),(.19,.33,.19),'cream',p);rod('Pin neck',(x,.23,z),(x,.43,z),.046,'cream',p);orb('Pin head',(x,.45,z),(.115,.12,.115),'cream',p);ring('Coral pin band',(x,.35,z),.05,.014,'coral',p)
export()

begin('cans');stand(-1,.85);bag=empty('Beanbag',(-1,.75,.85));box('Soft beanbag',(-1,.75,.85),(.26,.14,.23),'lilac',bag,.055)
box('Tin tower plinth',(0,.3,-.8),(1.35,.60,.65),'mint')
for i,(x,y) in enumerate([(-.29,.76),(0,.76),(.29,.76),(-.15,1.02),(.15,1.02),(0,1.28)]):
 p=empty('Can'+str(i),(x,y,-.8));rod('Enamel tin',(x,y-.125,-.8),(x,y+.125,-.8),.13,['coral','gold','blue'][i%3],p);ring('Tin rim',(x,y+.125,-.8),.12,.012,'cream',p)
export()

begin('cart');part=empty('Cart',(0,0,.60))
box('Mint trolley basket',(0,.48,.60),(.72,.35,.75),'mint',part,.08)
box('Parcel with bow',(0,.75,.60),(.48,.29,.48),'cream',part,.045)
box('Parcel ribbon',(0,.90,.60),(.05,.016,.49),'coral',part)
for side in [-1,1]:
 rod('Handle upright',(side*.30,.42,.98),(side*.30,.83,1.10),.024,'wood',part)
 for z in [.30,.9]:rod('Trolley wheel',(side*.38-.035,.17,z),(side*.38+.035,.17,z),.13,'ink',part)
rod('Trolley grip',(-.30,.83,1.10),(.30,.83,1.10),.035,'lilac',part)
for x in [-.55,.55]:box('Delivery bay line',(x,.009,-1.10),(.055,.018,1.1),'gold')
for z in [-1.65,-.55]:box('Delivery bay end',(0,.009,z),(1.15,.018,.055),'gold')
surprise=empty('Surprise',(0,.82,.6));orb('Surprise star',(0,.82,.6),(.30,.30,.12),'pink',surprise);export()

begin('boat');stand(1.45,.8);boat=empty('Boat',(1.45,.76,.8))
# Open folded hull and a separate central paper peak, with visible creases.
mesh('Folded paper hull',[(1.03,.82,.8),(1.2,.83,.62),(1.7,.83,.62),(1.87,.82,.8),(1.7,.83,.98),(1.2,.83,.98),(1.20,.67,.8),(1.70,.67,.8)],[(0,6,1),(1,6,7,2),(2,7,3),(3,7,4),(4,7,6,5),(5,6,0),(6,5,4,7)],'cream',boat)
mesh('Tall folded paper peak',[(1.20,.78,.79),(1.70,.78,.79),(1.45,1.10,.8),(1.20,.78,.81),(1.70,.78,.81)],[(0,2,1),(3,4,2),(0,3,2),(1,2,4)],'white',boat)
for a,b in [((1.03,.82,.8),(1.2,.83,.62)),((1.2,.83,.62),(1.7,.83,.62)),((1.7,.83,.62),(1.87,.82,.8)),((1.03,.82,.8),(1.2,.83,.98)),((1.2,.83,.98),(1.7,.83,.98)),((1.7,.83,.98),(1.87,.82,.8))]:rod('Folded rim crease',a,b,.008,'gold',boat)
box('Water trough',(0,.12,-.35),(1.5,.24,2.4),'mint',bevel=.10)
box('Trough water',(0,.245,-.35),(1.32,.02,2.20),'blue',bevel=.06)
for x in [-.73,.73]:box('Trough rolled rim',(x,.26,-.35),(.09,.12,2.40),'cream')
export()

begin('duck');duck('Duck',(0,0,0));key=empty('Key',(.34,.23,-.12));rod('Winding spindle',(.20,.23,-.12),(.42,.23,-.12),.028,'wood',key);ring('Wind-up key',(.42,.27,-.12),.065,.018,'cream',key,True)
for i in range(3):duck('Duckling'+str(i),(0,0,-.6-i*.40),.47)
for dx in [-.13,.13]:box('Waddle foot',(dx,.045,.1),(.15,.035,.23),'coral')
export()

begin('bubbles');stand(0,.65);bottle=empty('Bottle',(0,.73,.65));rod('Bubble bottle',(0,.67,.65),(0,.95,.65),.13,'lilac',bottle);ring('Bubble bottle lip',(0,.95,.65),.095,.018,'gold',bottle)
wand=empty('Wand',(.32,.80,.65));rod('Wand handle',(.32,.68,.65),(.32,.96,.65),.014,'gold',wand);ring('Bubble loop',(.32,1.04,.65),.085,.012,'gold',wand,True)
for i in range(10):
 p=empty('Bubble'+str(i),(0,.8,0));ring('Iridescent bubble rim',(0,.8,0),.13+i%3*.025,.008,['pink','blue','lilac'][i%3],p,True);orb('Bubble glint',(-.06,.86,.025),(.045,.035,.02),'white',p)
export()

begin('flower');stand(1.30,.65);can=empty('Can',(1.30,.78,.65));orb('Watering can belly',(1.30,.79,.65),(.42,.30,.30),'mint',can);rod('Can spout',(1.1,.78,.65),(.90,.98,.65),.035,'mint',can);ring('Can handle',(1.49,.83,.65),.14,.025,'gold',can,True)
pot=empty('Pot',(0,0,-.45));rod('Flower pot',(0,.03,-.45),(0,.32,-.45),.26,'coral',pot);ring('Rolled pot rim',(0,.32,-.45),.26,.035,'cream',pot)
rod('Flower stem',(0,.3,-.45),(0,1.03,-.45),.025,'leaf');head=empty('Flower',(0,1.07,-.45))
for i in range(8):
 a=i*math.tau/8;orb('Plush petal',(math.sin(a)*.21,1.07+math.cos(a)*.21,-.45),(.20,.25,.09),'gold',head)
orb('Flower smiling middle',(0,1.07,-.39),(.24,.24,.10),'brown',head);eyes(0,1.10,-.33,head,.042)
for side in [-1,1]:orb('Flower leaf',(side*.12,.6,-.45),(.25,.10,.13),'leaf')
for i in range(8):
 d=empty('Droplet'+str(i),(.35,1,-.35));orb('Water drop',(.35,1,-.35),(.035,.065,.035),'blue',d)
export()

begin('pinwheel');rod('Pinwheel post',(0,.03,-.35),(0,1.13,-.35),.035,'wood');wheel=empty('Wheel',(0,1.17,-.29))
for i in range(4):
 a=i*math.pi/2;pts=[]
 for x,y,z in [(0,0,0),(.30,.32,-.02),(.03,.34,.08)]:pts.append((x*math.cos(a)-y*math.sin(a),1.17+x*math.sin(a)+y*math.cos(a),-.29+z))
 mesh('Folded pinwheel blade',pts,[(0,1,2)],['coral','mint','lilac','gold'][i],wheel)
orb('Pinwheel brass hub',(0,1.17,-.23),(.08,.08,.08),'gold',wheel)
for i in range(8):
 p=((i-4)*.07,.85,-.35);r=empty('Ribbon'+str(i),p);leaf('Silk streamer',p,['pink','blue'][i%2],r)
export()

begin('jack');box('Music box',(0,.28,0),(.66,.56,.56),'lilac',bevel=.07)
for x in [-.29,.29]:box('Box corner trim',(x,.30,.29),(.035,.45,.025),'gold')
lid=empty('Lid',(0,.56,-.28));box('Hinged lid',(0,.58,0),(.72,.08,.62),'mint',lid)
crank=empty('Crank',(.39,.28,0));rod('Crank axle',(.3,.28,0),(.49,.28,0),.026,'wood',crank);rod('Crank bend',(.49,.28,0),(.49,.43,0),.026,'wood',crank);orb('Crank knob',(.55,.43,0),(.13,.09,.09),'gold',crank)
frog=empty('Frog',(0,.45,0));orb('Frog plush body',(0,.55,0),(.36,.37,.30),'mint',frog)
for x in [-.12,.12]:orb('Frog eye mound',(x,.75,.03),(.15,.15,.13),'mint',frog);orb('Frog eye',(x,.76,.10),(.06,.07,.04),'ink',frog)
for i in range(8):ring('Surprise spring',(0,.08+i*.065,0),.12,.012,'gold',frog)
export()

begin('puddles')
for i,(x,z) in enumerate([(-.72,-.65),(.72,-.65),(-.72,.65),(.72,.65)]):
 p=empty('Puddle'+str(i),(x,0,z));orb('Shallow musical puddle',(x,.014,z),(.88,.025,.74),'blue',p);ring('Chalk note circle',(x,.024,z),.43,.014,['coral','gold','mint','lilac'][i],p);box('Puddle highlight',(x-.16,.03,z-.05),(.22,.008,.02),'white',p)
export()

begin('leaves')
for i in range(32):
 x=random.uniform(-.62,.62);z=random.uniform(-.62,.62);y=.05+.24*max(0,1-math.hypot(x,z));p=empty('Leaf'+str(i),(x,y,z));o=leaf('Curled autumn leaf',(x,y,z),['coral','gold','brown'][i%3],p)
duck('HiddenDuck',(0,0,0),.60);export()

begin('plane');stand(1.3,.85);p=empty('Plane',(1.3,.75,.85));mesh('Folded letter plane',[(1.3,.79,.45),(.95,.72,1.1),(1.3,.74,.94),(1.65,.72,1.1),(1.3,.88,.97)],[(0,1,2),(0,2,3),(0,4,2)],'cream',p)
for i,z in enumerate([.10,-.75,-1.6]):
 ring('Paper flight hoop',(0,.85,z),.40,.025,['mint','coral','gold'][i],vertical=True);rod('Hoop stem',(0,.05,z),(0,.45,z),.02,'wood')
export()

begin('flamingo');stand(-1,.75);hat=empty('Hat',(-1,.77,.75));rod('Top hat crown',(-1,.74,.75),(-1,.95,.75),.14,'lilac',hat);rod('Hat brim',(-1,.715,.75),(-1,.75,.75),.24,'lilac',hat);ring('Hat ribbon',(-1,.77,.75),.144,.017,'gold',hat)
bird=empty('Bird',(.45,0,-.60));orb('Flamingo body',(.45,.72,-.60),(.53,.44,.39),'pink',bird)
for x in [.33,.57]:rod('Flamingo leg',(x,.03,-.6),(x,.55,-.6),.022,'coral',bird);box('Flamingo foot',(x,.035,-.52),(.12,.05,.23),'coral',bird)
rod('Long curved neck',(.63,.82,-.60),(.73,1.18,-.60),.05,'pink',bird);rod('Neck curl',(.73,1.18,-.60),(.53,1.35,-.54),.06,'pink',bird)
orb('Flamingo head',(.48,1.35,-.53),(.26,.25,.23),'pink',bird);box('Flamingo bill',(.45,1.27,-.34),(.15,.10,.23),'cream',bird);box('Dark bill tip',(.45,1.21,-.25),(.13,.12,.08),'ink',bird);eyes(.48,1.4,-.416,bird,.061);export()

begin('picnic');box('Picnic blanket',(0,.008,.15),(2.4,.015,2.8),'pink',bevel=.015)
for x in [-1,-.5,0,.5,1]:box('Blanket woven stripe',(x,.019,.15),(.07,.01,2.72),'cream')
bear=empty('Teddy',(0,0,-.95));orb('Teddy tummy',(0,.38,-.95),(.55,.62,.44),'brown',bear);orb('Teddy head',(0,.80,-.95),(.54,.5,.43),'brown',bear);orb('Soft muzzle',(0,.72,-.70),(.28,.17,.14),'cream',bear);orb('Teddy nose',(0,.78,-.62),(.075,.065,.05),'ink',bear);eyes(0,.87,-.73,bear,.10)
for x in [-.24,.24]:orb('Teddy ear',(x,1.01,-.95),(.20,.22,.13),'brown',bear);orb('Teddy paw',(x,.11,-.70),(.26,.20,.32),'brown',bear);orb('Teddy arm',(x,.43,-.81),(.22,.40,.23),'brown',bear)
box('Picnic basket',(-1,.24,.75),(.52,.48,.55),'wood',bevel=.06)
for i in range(3):
 x=-1+(i-1)*.14;p=empty('Treat'+str(i),(x,.57,.75));orb('Picnic treat',(x,.57,.75),(.19,.18,.19),['coral','gold','mint'][i],p)
for i,(x,z) in enumerate([(-.55,-.10),(.55,-.10),(0,.55)]):rod('Teddy plate',(x,.025,z),(x,.05,z),.24,'cream')
export()
(out/'play-props.json').write_text(json.dumps({'author':'Original Maple Lane props, made in Blender','assets':report},indent=2))
print(json.dumps(report,indent=2))

