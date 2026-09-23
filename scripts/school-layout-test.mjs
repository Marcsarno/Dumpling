import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Vec3,BoundingBox} from 'playcanvas';
import {HousePath} from '../src/components/HousePath.ts';
const c=JSON.parse(readFileSync('public/assets/school-kit/classroom-collision.json')),f=JSON.parse(readFileSync('public/assets/school-kit/cafeteria-collision.json'));
const world={walkable:[{minX:-5.9,maxX:5.9,minZ:-6.96,maxZ:6.9},{minX:3.7,maxX:5.5,minZ:-9.2,maxZ:-6.7},{minX:-1.3,maxX:10.5,minZ:-22.9,maxZ:-9}],obstacles:[...c.map(b=>new BoundingBox(new Vec3(...b.center),new Vec3(...b.half))),...f.map(b=>new BoundingBox(new Vec3(b.center[0]+4.6,0,b.center[2]-16),new Vec3(...b.half))),...[3.65,5.55].map(x=>new BoundingBox(new Vec3(x,0,-8),new Vec3(.05,1,1.05)))]};
const planner=new HousePath(world,.24),spawn=new Vec3(0,0,3.3);
for(const point of [[-3.1,0,-.2],[2.65,0,-.2],[0,0,3.05],[4.6,0,-8],[4.6,0,-14.8],[4.6,0,-19.1]]){assert.ok(planner.route(spawn,new Vec3(...point)).length,'Reachable '+point);assert.ok(planner.route(new Vec3(...point),spawn).length,'Return from '+point);}
for(const point of [[0,-5.0],[2.65,-1.75],[4.6,-21.55],[1.6,-17.5]])assert.equal(planner.free(...point),false,'Furniture is solid '+point);
console.log('PASS school routes: all three trading spots, doorway, cafeteria aisle, lunch counter and return; furniture collision');
