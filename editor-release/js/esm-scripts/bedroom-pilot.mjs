import { Script, BoundingBox, Vec3, Color, TONEMAP_LINEAR, Entity, PROJECTION_ORTHOGRAPHIC, Vec2, KEY_D, KEY_RIGHT, KEY_A, KEY_LEFT, KEY_W, KEY_UP, KEY_S, KEY_DOWN, Keyboard, Mat4, Texture, ADDRESS_REPEAT, FILTER_LINEAR_MIPMAP_LINEAR, Asset, StandardMaterial, AnimStateGraph, math, SEMANTIC_BLENDINDICES, SEMANTIC_BLENDWEIGHT, Quat, AnimTrack, AnimData, AnimCurve, INTERPOLATION_LINEAR } from '../playcanvas-stable.min.mjs';

function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
// src/components/MovementPace.ts
var RUN_SPEED = 3.15;
var WALK_SPEED = 1.65;
var RUN_PALM_AXES = {
    Left: new Vec3(-0.084140846, 0.99499861, -0.05383385).normalize(),
    Right: new Vec3(-0.16291618, 0.98452002, 0.06464243).normalize()
};
var RUN_WRIST_LIMIT = 12;
function balancedRun(model, track) {
    const bindings = track.curves.map((curve)=>({
            curve,
            path: curve.paths[0]
        }));
    const nodes = bindings.map(({ path })=>model.findByName(path.entityPath.at(-1)));
    const rest = nodes.map((n)=>({
            p: n.getLocalPosition().clone(),
            q: n.getLocalRotation().clone(),
            s: n.getLocalScale().clone()
        }));
    const restore = ()=>nodes.forEach((n, i)=>{
            n.setLocalPosition(rest[i].p);
            n.setLocalRotation(rest[i].q);
            n.setLocalScale(rest[i].s);
        });
    const names = [
        "Hips",
        "Spine02",
        "Spine01",
        "Spine",
        "LeftShoulder",
        "LeftArm",
        "LeftForeArm",
        "LeftHand",
        "RightShoulder",
        "RightArm",
        "RightForeArm",
        "RightHand"
    ];
    const bones = Object.fromEntries(names.map((name)=>[
            name,
            model.findByName(name)
        ]));
    const bind = Object.fromEntries(names.map((name)=>[
            name,
            bones[name].getRotation().clone()
        ]));
    const start = Math.min(...track.inputs.map((i)=>i.data[0])), duration = track.duration - start;
    const sample = (phase)=>{
        const time = start + phase * duration;
        bindings.forEach(({ curve, path }, i)=>{
            const times = track.inputs[curve.input].data, out = track.outputs[curve.output], data = out.data, c = out.components;
            let lo = 0;
            while(lo < times.length - 2 && times[lo + 1] < time)lo++;
            const hi = Math.min(lo + 1, times.length - 1), alpha = Math.max(0, Math.min(1, (time - times[lo]) / (times[hi] - times[lo] || 1)));
            const a = Array.from(data.slice(lo * c, lo * c + c)), b = Array.from(data.slice(hi * c, hi * c + c));
            if (path.propertyPath[0] === "localRotation") nodes[i].setLocalRotation(new Quat().slerp(new Quat(...a), new Quat(...b), alpha));
            else {
                const v = a.map((v2, k)=>v2 + (b[k] - v2) * alpha);
                if (path.propertyPath[0] === "localPosition") nodes[i].setLocalPosition(v[0], v[1], v[2]);
                else nodes[i].setLocalScale(v[0], v[1], v[2]);
            }
        });
    };
    const delta = (name)=>new Quat().mul2(bones[name].getRotation(), bind[name].clone().invert());
    const mirror = (q)=>new Quat(q.x, -q.y, -q.z, q.w);
    const palmAlignment = new Quat().setFromDirections(RUN_PALM_AXES.Left, new Vec3(-RUN_PALM_AXES.Right.x, RUN_PALM_AXES.Right.y, RUN_PALM_AXES.Right.z));
    const settleRightWrist = ()=>{
        const hand = bones.RightHand, fore = bones.RightForeArm;
        const direction = hand.getPosition().clone().sub(fore.getPosition()).normalize();
        const rotation = hand.getRotation().clone(), palm = rotation.transformVector(RUN_PALM_AXES.Right).normalize();
        const angle = Math.acos(Math.max(-1, Math.min(1, palm.dot(direction)))) * 180 / Math.PI;
        const straight = new Quat().mul2(new Quat().setFromDirections(palm, direction), rotation);
        hand.setRotation(new Quat().slerp(straight, rotation, Math.min(1, RUN_WRIST_LIMIT / Math.max(angle, 1e-3))));
    };
    const frames = [];
    const count = 40;
    let fixedLeftWrist;
    for(let f = 0; f <= count; f++){
        const phase = f === count ? 0 : f / count;
        sample((phase + 0.5) % 1);
        settleRightWrist();
        const opposite = Object.fromEntries(names.map((name)=>[
                name,
                delta(name)
            ]));
        const oppositeX = bones.Hips.getLocalPosition().x;
        sample(phase);
        settleRightWrist();
        const central = names.slice(0, 4).map((name)=>new Quat().slerp(delta(name), mirror(opposite[name]), 0.5));
        const p = bones.Hips.getLocalPosition().clone();
        p.x = (p.x - oppositeX) * 0.5 + rest[nodes.indexOf(bones.Hips)].p.x;
        bones.Hips.setLocalPosition(p);
        names.slice(0, 4).forEach((name, i)=>bones[name].setRotation(new Quat().mul2(central[i], bind[name])));
        for (const part of [
            "Shoulder",
            "Arm",
            "ForeArm",
            "Hand"
        ]){
            const left = "Left" + part, right = "Right" + part;
            bones[left].setRotation(mirror(new Quat().mul2(opposite[right], bind[right])));
        }
        bones.LeftHand.setRotation(new Quat().mul2(bones.LeftHand.getRotation(), palmAlignment));
        fixedLeftWrist ?? (fixedLeftWrist = bones.LeftHand.getLocalRotation().clone());
        bones.LeftHand.setLocalRotation(fixedLeftWrist);
        frames.push(bindings.map(({ path }, i)=>path.propertyPath[0] === "localRotation" ? nodes[i].getLocalRotation().toArray() : (path.propertyPath[0] === "localPosition" ? nodes[i].getLocalPosition() : nodes[i].getLocalScale()).toArray()));
    }
    restore();
    return new AnimTrack("Run", duration, [
        new AnimData(1, frames.map((_, i)=>i * duration / count))
    ], bindings.map((_, i)=>new AnimData(frames[0][i].length, frames.flatMap((frame)=>frame[i]))), bindings.map(({ curve }, i)=>new AnimCurve(curve.paths, 0, i, INTERPOLATION_LINEAR)));
}
// src/components/MeshyGameplayAdapter.ts
function meshyGameplay(model, source, chore) {
    const walking = source.find((track)=>track.name === "Walking");
    if (!walking) throw new Error("The new Arianna is missing Walking.");
    const required = (name)=>{
        const track = source.find((track2)=>track2.name === name);
        if (!track) throw new Error("Missing Arianna clip: " + name);
        return track;
    };
    const running = required("Running"), authoredCarryWalk = required("CarryWalk"), authoredCarryRun = required("CarryRun"), idle = required("Idle");
    const paths = (curve)=>curve.paths;
    const channels = walking.curves.flatMap((curve)=>paths(curve).map((path)=>({
                path,
                node: model.findByName(path.entityPath.at(-1)),
                property: path.propertyPath[0]
            })));
    if (channels.some((channel)=>!channel.node)) throw new Error("Arianna animation targets do not match her rig.");
    const read = (node, property)=>property === "localRotation" ? [
            node.getLocalRotation().x,
            node.getLocalRotation().y,
            node.getLocalRotation().z,
            node.getLocalRotation().w
        ] : (property === "localPosition" ? node.getLocalPosition() : node.getLocalScale()).toArray();
    const capture = ()=>channels.map(({ node, property })=>read(node, property));
    const rest = capture();
    const restore = ()=>channels.forEach(({ node, property }, i)=>{
            const v = rest[i];
            if (property === "localRotation") node.setLocalRotation(v[0], v[1], v[2], v[3]);
            else if (property === "localPosition") node.setLocalPosition(v[0], v[1], v[2]);
            else node.setLocalScale(v[0], v[1], v[2]);
        });
    const aim = (node, child, target)=>{
        const from = child.getPosition().clone().sub(node.getPosition()).normalize();
        const to = target.clone().sub(node.getPosition()).normalize();
        node.setRotation(new Quat().mul2(new Quat().setFromDirections(from, to), node.getRotation()));
    };
    const crouch = ()=>{
        const feet = [
            "Left",
            "Right"
        ].map((side)=>({
                side,
                node: model.findByName(side + "Foot"),
                point: model.findByName(side + "Foot").getPosition().clone(),
                rotation: model.findByName(side + "Foot").getRotation().clone()
            }));
        const hips2 = model.findByName("Hips"), p = hips2.getLocalPosition();
        hips2.setLocalPosition(p.x, p.y - 0.29, p.z - 0.06);
        for (const foot of feet){
            const thigh = model.findByName(foot.side + "UpLeg"), shin = model.findByName(foot.side + "Leg"), origin = thigh.getPosition().clone();
            const upper = origin.distance(shin.getPosition()), lower = shin.getPosition().distance(foot.node.getPosition()), delta = foot.point.clone().sub(origin), length = delta.length();
            delta.normalize();
            const pole = model.getWorldTransform().transformVector(new Vec3(0, 0, 1));
            pole.sub(delta.clone().mulScalar(pole.dot(delta))).normalize();
            const along = (upper * upper - lower * lower + length * length) / (2 * length), knee = origin.clone().add(delta.clone().mulScalar(along)).add(pole.mulScalar(Math.sqrt(Math.max(0, upper * upper - along * along))));
            aim(thigh, shin, knee);
            aim(shin, foot.node, foot.point);
            foot.node.setRotation(foot.rotation);
        }
    };
    const arms = (y, z, wide = 0.11, motion)=>{
        for (const [side, sign] of [
            [
                "Left",
                1
            ],
            [
                "Right",
                -1
            ]
        ]){
            const arm = model.findByName(side + "Arm"), fore = model.findByName(side + "ForeArm"), hand = model.findByName(side + "Hand");
            const i = side === "Right" ? 0 : 3;
            const shoulder = arm.getPosition().clone(), target = model.getWorldTransform().transformPoint(new Vec3(sign * wide + (motion?.[i] ?? 0) * 0.09, y + (motion?.[i + 1] ?? 0) * 0.055, z + (motion?.[i + 2] ?? 0) * 0.09));
            const upper = shoulder.distance(fore.getPosition()), lower = fore.getPosition().distance(hand.getPosition());
            const direction = target.clone().sub(shoulder), distance = Math.min(direction.length(), upper + lower - 2e-3);
            direction.normalize();
            const pole = model.getWorldTransform().transformVector(new Vec3(sign, -0.6, -0.3));
            pole.sub(direction.clone().mulScalar(pole.dot(direction))).normalize();
            const along = (upper * upper - lower * lower + distance * distance) / (2 * distance);
            const elbow = shoulder.clone().add(direction.clone().mulScalar(along)).add(pole.mulScalar(Math.sqrt(Math.max(0, upper * upper - along * along))));
            aim(arm, fore, elbow);
            aim(fore, hand, shoulder.clone().add(direction.mulScalar(distance)));
        }
    };
    for (const curve of authoredCarryWalk.curves)for (const path of paths(curve)){
        const name = path.entityPath.at(-1);
        if (!/^(Left|Right)(Shoulder|Arm|ForeArm|Hand)/.test(name)) continue;
        const node = model.findByName(name), v = authoredCarryWalk.outputs[curve.output].data;
        if (path.propertyPath[0] === "localRotation") node.setLocalRotation(v[0], v[1], v[2], v[3]);
        else if (path.propertyPath[0] === "localPosition") node.setLocalPosition(v[0], v[1], v[2]);
        else node.setLocalScale(v[0], v[1], v[2]);
    }
    const carry = capture();
    restore();
    const spine = model.findByName("Spine02");
    const axis = model.getWorldTransform().transformVector(Vec3.RIGHT).normalize();
    spine.setRotation(new Quat().mul2(new Quat().setFromAxisAngle(axis, 28), spine.getRotation()));
    arms(0.47, 0.3);
    const reach = capture();
    restore();
    arms(1.02, 0.06, 0.23);
    const happy = capture();
    restore();
    const pose = (name, frames, times)=>new AnimTrack(name, times.at(-1), [
            new AnimData(1, times)
        ], channels.map((_, i)=>new AnimData(rest[i].length, frames.flatMap((frame)=>frame[i]))), channels.map(({ path }, i)=>new AnimCurve([
                path
            ], 0, i, INTERPOLATION_LINEAR)));
    restore();
    const hips = model.findByName("Hips"), hipPosition = hips.getLocalPosition().clone();
    hips.setLocalPosition(hipPosition.x, hipPosition.y - 0.2, hipPosition.z);
    for (const side of [
        "Left",
        "Right"
    ]){
        const thigh = model.findByName(side + "UpLeg"), shin = model.findByName(side + "Leg"), foot = model.findByName(side + "Foot");
        const origin = thigh.getPosition().clone(), upper = origin.distance(shin.getPosition()), lower = shin.getPosition().distance(foot.getPosition());
        aim(thigh, shin, origin.clone().add(new Vec3(0, -0.04, upper)));
        aim(shin, foot, shin.getPosition().clone().add(new Vec3(0, -lower, 0.035)));
    }
    arms(0.67, 0.27, 0.12);
    const seated = capture();
    arms(0.94, 0.22, 0.1);
    const eating = capture();
    restore();
    const loop = (track, name)=>{
        const start = Math.min(...track.inputs.map((input)=>input.data[0]));
        return new AnimTrack(name, track.duration - start, track.inputs.map((input)=>new AnimData(input.components, Array.from(input.data, (t)=>t - start))), track.outputs, track.curves);
    };
    const tracks = [
        ...source.filter((track)=>![
                "Idle",
                "CarryWalk",
                "CarryRun"
            ].includes(track.name)),
        loop(walking, "Walk"),
        balancedRun(model, running),
        loop(authoredCarryWalk, "CarryWalk"),
        loop(authoredCarryRun, "CarryRun"),
        loop(idle, "Idle"),
        pose("CarryIdle", [
            carry,
            carry
        ], [
            0,
            2
        ]),
        pose("EatSit", [
            rest,
            seated,
            seated,
            eating,
            seated,
            seated,
            rest
        ], [
            0,
            0.55,
            0.9,
            1.55,
            2.15,
            3.6,
            4.2
        ]),
        pose("PickUp", [
            rest,
            reach,
            carry
        ], [
            0,
            0.4,
            0.8
        ]),
        pose("PutDown", [
            carry,
            reach,
            rest
        ], [
            0,
            0.4,
            0.8
        ]),
        pose("Celebrate", [
            rest,
            happy,
            happy,
            rest
        ], [
            0,
            0.3,
            0.7,
            1
        ]),
        pose("SitCar", [
            rest,
            rest
        ], [
            0,
            2
        ])
    ];
    if (chore) for (const [kind, name, y, z, bend] of [
        [
            "wipe",
            "Wipe",
            0.02,
            0.29,
            80
        ],
        [
            "vacuum",
            "Vacuum",
            0.6,
            0.32,
            12
        ]
    ]){
        const data = chore[kind], frames = data.samples.map((sample)=>{
            restore();
            if (kind === "wipe") crouch();
            const workingSpine = spine;
            workingSpine.setRotation(new Quat().mul2(new Quat().setFromAxisAngle(axis, bend), workingSpine.getRotation()));
            arms(y, z, 0.09, sample);
            return capture();
        });
        tracks.push(pose(name, frames, frames.map((_, i)=>i / data.fps)));
        restore();
    }
    const manifest = {
        animations: tracks.map((track)=>({
                name: track.name,
                duration_seconds: track.duration,
                loop: ![
                    "PickUp",
                    "PutDown",
                    "Celebrate"
                ].includes(track.name)
            })),
        scale: {
            rest_height_m: 1.20309758
        },
        locomotion: {
            Walk: {
                travel_speed_mps: WALK_SPEED
            },
            Run: {
                travel_speed_mps: RUN_SPEED
            },
            CarryWalk: {
                travel_speed_mps: WALK_SPEED
            },
            CarryRun: {
                travel_speed_mps: RUN_SPEED
            }
        },
        interaction_events: {
            PickUp: [
                {
                    time_seconds: 0.4,
                    event: "attach"
                }
            ],
            PutDown: [
                {
                    time_seconds: 0.4,
                    event: "release"
                }
            ]
        },
        hand_joints: [
            "LeftHand",
            "RightHand"
        ],
        action_playback: 1,
        walk_playback: 1
    };
    return {
        tracks,
        manifest
    };
}
function material(name, hex) {
    const mat = new StandardMaterial();
    mat.name = name;
    mat.diffuse = new Color().fromString(hex);
    mat.gloss = 0.15;
    mat.specular.set(0.08, 0.07, 0.09);
    mat.update();
    return mat;
}
function primitives(app, parent, batchGroupId = -1) {
    return (name, shape, position, scale, mat, shadows = true)=>{
        const entity = new Entity(name, app);
        entity.addComponent("render", {
            type: shape,
            material: mat,
            castShadows: shadows,
            receiveShadows: true,
            batchGroupId
        });
        entity.setLocalPosition(...position);
        entity.setLocalScale(...scale);
        parent.addChild(entity);
        return entity;
    };
}
var CharacterAnimator = class {
    get currentState() {
        return this.state;
    }
    get busy() {
        return this.action !== null;
    }
    get actionName() {
        return this.action?.name ?? null;
    }
    attach(model, animations, manifest, scale) {
        const tracks = new Map(animations.map((track)=>[
                track.name,
                track
            ]));
        for (const clip of manifest.animations){
            const track = tracks.get(clip.name);
            if (!track || Math.abs(track.duration - clip.duration_seconds) > 0.01) throw new Error("Missing or mismatched Arianna clip: " + clip.name);
        }
        const hands = (manifest.hand_joints ?? [
            "hand.L",
            "hand.R"
        ]).map((name)=>model.findByName(name)).filter(Boolean);
        if (hands.length !== 2) throw new Error("Arianna hand joints are missing.");
        model.addComponent("anim", {
            activate: true
        });
        model.anim.loadStateGraph(new AnimStateGraph({
            layers: [
                {
                    name: "Base",
                    states: [
                        {
                            name: "START"
                        },
                        ...manifest.animations.map((clip)=>({
                                name: clip.name,
                                speed: 1,
                                loop: clip.loop
                            }))
                    ],
                    transitions: [
                        {
                            from: "START",
                            to: "Idle"
                        }
                    ]
                }
            ],
            parameters: {}
        }));
        for (const clip of manifest.animations)model.anim.assignAnimation(clip.name, tracks.get(clip.name), void 0, 1, clip.loop);
        this.model = model;
        this.manifest = manifest;
        this.scale = scale;
        for (const clip of manifest.animations)this.clips.set(clip.name, tracks.get(clip.name));
        this.hands = hands;
        this.state = "";
        this.transition("Idle", 0);
    }
    bindCarrySocket(socket) {
        this.socket = socket;
    }
    setCarrying(value) {
        this.carrying = value;
    }
    setIdleClip(name) {
        this.idleClip = name;
    }
    setWorkClip(name, target) {
        this.workClip = name;
        this.faceTowards(target ?? null);
    }
    setCarryPace(value) {
        this.carryPace = value;
    }
    faceTowards(target) {
        this.faceTarget = target?.clone() ?? null;
    }
    /** Events use the imported clip clock, not guessed wall-clock delays. */ playAction(name, fallbackDuration, commit, target) {
        const duration = this.clips.get(name)?.duration ?? fallbackDuration;
        const eventTime = this.manifest?.interaction_events[name]?.[0]?.time_seconds ?? fallbackDuration / 2;
        const rate = name === "PickUp" || name === "PutDown" ? this.manifest?.action_playback ?? 3 : 1;
        this.action = {
            name,
            elapsed: 0,
            duration,
            eventTime,
            rate,
            fired: false,
            commit
        };
        this.faceTarget = target?.clone() ?? null;
        if (this.model) {
            this.model.anim.speed = rate;
            this.transition(name, 0.08);
        }
    }
    cancelAction() {
        this.action = null;
        this.faceTarget = null;
    }
    reset() {
        this.carrying = false;
        this.idleClip = "Idle";
        this.workClip = null;
        this.cancelAction();
        this.state = "";
        this.time = 0;
        this.lastEvent = null;
        this.placeholder.setLocalPosition(0, 0, 0);
        this.placeholder.setLocalEulerAngles(0, 0, 0);
        if (this.model) {
            this.model.anim.speed = 1;
            this.transition("Idle", 0);
        }
    }
    transition(name, seconds) {
        if (!this.model || !this.clips.has(name)) return;
        const layer = this.model.anim.baseLayer;
        const gaitBlend = [
            "Walk",
            "Run",
            "CarryWalk",
            "CarryRun"
        ].includes(this.state) && [
            "Walk",
            "Run",
            "CarryWalk",
            "CarryRun"
        ].includes(name);
        const phase = gaitBlend ? layer.activeStateCurrentTime / layer.activeStateDuration % 1 : void 0;
        layer.transition(name, seconds * this.model.anim.speed, phase);
        this.state = name;
    }
    update(dt, velocity, frameDuration = dt) {
        this.frameScale = dt / Math.max(frameDuration, 1e-3);
        const speed = velocity.length(), moving = speed > 0.03;
        this.facing.copy(velocity);
        if (this.faceTarget) this.facing.sub2(this.faceTarget, this.visual.getPosition());
        if (moving || this.faceTarget) {
            const target = Math.atan2(this.facing.x, this.facing.z) * math.RAD_TO_DEG;
            const current = Math.atan2(-this.visual.forward.x, -this.visual.forward.z) * math.RAD_TO_DEG;
            this.visual.setLocalEulerAngles(0, moving ? target : math.lerpAngle(current, target, 1 - Math.exp(-18 * dt)), 0);
        }
        const action = this.action;
        if (action) {
            action.elapsed = this.model ? this.model.anim.baseLayer.activeStateCurrentTime : action.elapsed + dt * action.rate;
            if (!action.fired && action.elapsed >= action.eventTime) {
                action.fired = true;
                this.lastEvent = {
                    name: this.manifest?.interaction_events[action.name]?.[0]?.event ?? action.name,
                    clip: action.name,
                    time: action.elapsed
                };
                action.commit?.();
            }
            if (action.elapsed >= action.duration) this.cancelAction();
        }
        if (this.model) {
            const run = this.clips.has("Run") && speed > (this.state.includes("Run") ? 1.05 : 1.3);
            const gait = this.carrying ? run && this.carryPace === "run" ? "CarryRun" : "CarryWalk" : run ? "Run" : "Walk";
            const desired = this.action?.name ?? this.workClip ?? (moving ? gait : this.carrying ? "CarryIdle" : this.idleClip);
            const travel = this.manifest?.locomotion[desired]?.travel_speed_mps;
            const cadence = this.manifest?.walk_playback ?? 1.5;
            this.model.anim.speed = this.action?.rate ?? (travel ? Math.min(cadence, speed / (this.manifest?.walk_playback ? travel : 2.25) * cadence) * this.frameScale : 1);
            if (desired !== this.state) this.transition(desired, 0.14);
            if (this.socket && this.hands.length === 2) {
                this.grip.add2(this.hands[0].getPosition(), this.hands[1].getPosition()).mulScalar(0.5);
                this.inverse.copy(this.visual.getWorldTransform()).invert().transformPoint(this.grip, this.grip);
                this.grip.z += 0.025;
                this.socket.setLocalPosition(this.grip);
            }
        } else {
            this.time += dt * (moving ? speed * 5 : 2);
            const celebrating = this.action?.name === "Celebrate";
            this.placeholder.setLocalPosition(0, celebrating ? Math.abs(Math.sin(this.time * 5)) * 0.12 : moving ? Math.abs(Math.sin(this.time)) * 0.035 : 0, 0);
            this.placeholder.setLocalEulerAngles(this.action && !celebrating ? 12 : 0, 0, 0);
        }
    }
    snapshot() {
        return {
            state: this.state,
            busy: this.busy,
            action: this.actionName,
            clipTime: this.model?.anim?.baseLayer?.activeStateCurrentTime ?? 0,
            playbackRate: this.model?.anim?.speed ?? 1,
            frameScale: this.frameScale,
            scale: this.scale,
            groundY: this.model?.getPosition().y,
            lastEvent: this.lastEvent,
            clips: this.manifest?.animations,
            yaw: Math.atan2(-this.visual.forward.x, -this.visual.forward.z) * math.RAD_TO_DEG,
            hands: this.hands.map((hand)=>hand.getPosition().toArray()),
            socket: this.socket?.getPosition().toArray(),
            materials: this.model?.findComponents("render").flatMap((render)=>render.meshInstances.map((mesh)=>mesh.material.name)),
            feet: (this.manifest?.hand_joints ? [
                "LeftFoot",
                "RightFoot",
                "LeftToeBase",
                "RightToeBase"
            ] : [
                "foot.L",
                "foot.R",
                "toe.L",
                "toe.R"
            ]).map((name)=>this.model?.findByName(name)?.getPosition().toArray())
        };
    }
    /** Read-only CPU skinning for development QA; never called by the game loop. */ geometrySnapshot() {
        const result = [];
        for (const render of this.model?.findComponents("render") ?? [])for (const instance of render.meshInstances){
            const skin = instance.skinInstance;
            if (!skin) continue;
            const positions = [], joints = [], weights = [];
            const vertices = instance.mesh.getPositions(positions);
            instance.mesh.getVertexStream(SEMANTIC_BLENDINDICES, joints);
            instance.mesh.getVertexStream(SEMANTIC_BLENDWEIGHT, weights);
            const matrices = skin.bones.map((bone, i)=>new Mat4().mul2(bone.getWorldTransform(), skin.skin.inverseBindPose[i]));
            let minY = Infinity, maxY = -Infinity, leftSole = Infinity, rightSole = Infinity;
            const source = new Vec3(), transformed = new Vec3(), world = new Vec3();
            for(let v = 0; v < vertices; v++){
                source.set(positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]);
                world.set(0, 0, 0);
                let foot = "";
                for(let influence = 0; influence < 4; influence++){
                    const index = v * 4 + influence, weight = weights[index];
                    if (!weight) continue;
                    const joint = joints[index];
                    matrices[joint].transformPoint(source, transformed);
                    world.add(transformed.mulScalar(weight));
                    if (weight > 0.5 && /^(?:(foot|toe)\.|(?:Left|Right)(?:Foot|Toe))/.test(skin.bones[joint].name)) foot = skin.bones[joint].name;
                }
                minY = Math.min(minY, world.y);
                maxY = Math.max(maxY, world.y);
                if (foot.endsWith(".L") || foot.startsWith("Left")) leftSole = Math.min(leftSole, world.y);
                if (foot.endsWith(".R") || foot.startsWith("Right")) rightSole = Math.min(rightSole, world.y);
            }
            result.push({
                vertices,
                joints: skin.bones.length,
                minY,
                maxY,
                leftSole,
                rightSole,
                vertexColors: Boolean(instance.material.diffuseVertexColor)
            });
        }
        return result;
    }
    constructor(visual, placeholder){
        _define_property(this, "visual", void 0);
        _define_property(this, "placeholder", void 0);
        _define_property(this, "model", null);
        _define_property(this, "manifest", null);
        _define_property(this, "scale", 1);
        _define_property(this, "frameScale", 1);
        _define_property(this, "clips", /* @__PURE__ */ new Map());
        _define_property(this, "state", "");
        _define_property(this, "time", 0);
        _define_property(this, "carrying", false);
        _define_property(this, "idleClip", "Idle");
        _define_property(this, "workClip", null);
        _define_property(this, "carryPace", "run");
        _define_property(this, "action", null);
        _define_property(this, "socket", null);
        _define_property(this, "hands", []);
        _define_property(this, "inverse", new Mat4());
        _define_property(this, "grip", new Vec3());
        _define_property(this, "facing", new Vec3());
        _define_property(this, "faceTarget", null);
        _define_property(this, "lastEvent", null);
        this.visual = visual;
        this.placeholder = placeholder;
    }
};
// src/components/CharacterGrounding.ts
var CharacterGrounding = class {
    update() {
        const p = this.player.getPosition();
        let ground = 0;
        for (const { entity, oval, bounds } of this.surfaces){
            if (!entity.enabled) continue;
            const x = (p.x - bounds.center.x) / bounds.halfExtents.x, z = (p.z - bounds.center.z) / bounds.halfExtents.z;
            if (oval ? x * x + z * z <= 1 : Math.abs(x) <= 1 && Math.abs(z) <= 1) ground = Math.max(ground, bounds.center.y + bounds.halfExtents.y);
        }
        this.alignment.setLocalPosition(0, (this.surfaceHeight ?? ground) + 2e-3 - p.y, 0);
    }
    constructor(root, player, alignment){
        _define_property(this, "player", void 0);
        _define_property(this, "alignment", void 0);
        _define_property(this, "surfaceHeight", null);
        _define_property(this, "surfaces", void 0);
        this.player = player;
        this.alignment = alignment;
        this.surfaces = root.findComponents("render").filter((render)=>/(?:floor|rug|runner|mat)$/i.test(render.entity.name)).flatMap((render)=>render.meshInstances.map((mesh)=>({
                    entity: render.entity,
                    oval: render.type === "cylinder",
                    bounds: mesh.aabb.clone()
                })));
    }
};
function bedEntryTrack(model, source, sleep) {
    const bindings = source.curves.map((c)=>({
            curve: c,
            path: c.paths[0]
        })), nodes = bindings.map((b)=>model.findByName(b.path.entityPath.at(-1)));
    const read = ()=>nodes.map((n, i)=>bindings[i].path.propertyPath[0] === "localRotation" ? n.getLocalRotation().toArray() : bindings[i].path.propertyPath[0] === "localPosition" ? n.getLocalPosition().toArray() : n.getLocalScale().toArray());
    const rest = read(), apply = (frame)=>nodes.forEach((n, i)=>{
            const v = frame[i], p = bindings[i].path.propertyPath[0];
            if (p === "localRotation") n.setLocalRotation(...v);
            else if (p === "localPosition") n.setLocalPosition(...v);
            else n.setLocalScale(...v);
        });
    const meshy = !!model.findByName("Hips"), hips = model.findByName(meshy ? "Hips" : "pelvis"), initial = hips.getLocalPosition().clone();
    const bone = (s, p)=>model.findByName(meshy ? s + ({
            arm: "Arm",
            fore: "ForeArm",
            hand: "Hand",
            thigh: "UpLeg",
            shin: "Leg",
            foot: "Foot"
        })[p] : ({
            arm: "upper_arm",
            fore: "forearm",
            hand: "hand",
            thigh: "thigh",
            shin: "shin",
            foot: "foot"
        })[p] + "." + s[0]);
    const aim = (n, child, d)=>n.setRotation(new Quat().mul2(new Quat().setFromDirections(child.getPosition().clone().sub(n.getPosition()).normalize(), d.normalize()), n.getRotation()));
    const frames = [];
    for(let stage = 0; stage < 4; stage++){
        apply(rest);
        hips.setLocalPosition(initial.x, [
            initial.y,
            initial.y - 0.12,
            0.17,
            0.12
        ][stage], initial.z);
        for (const [s, sign] of [
            [
                "Left",
                1
            ],
            [
                "Right",
                -1
            ]
        ]){
            aim(bone(s, "arm"), bone(s, "fore"), stage === 1 ? new Vec3(sign * 0.2, 0.25, 0.8) : stage === 2 ? new Vec3(sign * 0.25, -0.3, 0.7) : new Vec3(sign * 0.12, -1, 0.06));
            aim(bone(s, "fore"), bone(s, "hand"), stage === 1 ? new Vec3(0, 0.2, 0.8) : new Vec3(0, -0.7, 0.35));
            const tuck = stage >= 2 ? 1 : stage === 1 && s === "Left" ? 0.6 : 0;
            aim(bone(s, "thigh"), bone(s, "shin"), new Vec3(sign * 0.04, -1 + tuck, tuck));
            aim(bone(s, "shin"), bone(s, "foot"), new Vec3(0, -1, stage >= 2 ? -0.15 : 0));
        }
        frames.push(read());
    }
    frames.push(bindings.map((b, i)=>Array.from(sleep.outputs[sleep.curves[i].output].data.slice(0, rest[i].length))));
    apply(rest);
    return new AnimTrack("SleepEnter", 3.2, [
        new AnimData(1, [
            0,
            0.5,
            1.2,
            1.9,
            3.2
        ])
    ], bindings.map((_, i)=>new AnimData(rest[i].length, frames.flatMap((f)=>f[i]))), bindings.map(({ curve }, i)=>new AnimCurve(curve.paths, 0, i, INTERPOLATION_LINEAR)));
}
function sleepingTrack(model, source, motion) {
    const bindings = source.curves.map((c)=>({
            curve: c,
            path: c.paths[0]
        }));
    const nodes = bindings.map((b)=>model.findByName(b.path.entityPath.at(-1)));
    const read = (i)=>bindings[i].path.propertyPath[0] === "localRotation" ? nodes[i].getLocalRotation().toArray() : bindings[i].path.propertyPath[0] === "localPosition" ? nodes[i].getLocalPosition().toArray() : nodes[i].getLocalScale().toArray();
    const rest = nodes.map((_, i)=>read(i));
    const restore = ()=>nodes.forEach((n, i)=>{
            const v = rest[i], p = bindings[i].path.propertyPath[0];
            if (p === "localRotation") n.setLocalRotation(...v);
            else if (p === "localPosition") n.setLocalPosition(...v);
            else n.setLocalScale(...v);
        });
    const meshy = !!model.findByName("Hips"), bone = (side, part)=>model.findByName(meshy ? side + ({
            thigh: "UpLeg",
            shin: "Leg",
            foot: "Foot",
            arm: "Arm",
            fore: "ForeArm",
            hand: "Hand"
        })[part] : ({
            thigh: "thigh",
            shin: "shin",
            foot: "foot",
            arm: "upper_arm",
            fore: "forearm",
            hand: "hand"
        })[part] + "." + side[0]);
    const hips = model.findByName(meshy ? "Hips" : "pelvis"), chest = model.findByName(meshy ? "Spine02" : "chest");
    const aim = (n, child, direction)=>{
        const from = child.getPosition().clone().sub(n.getPosition()).normalize();
        n.setRotation(new Quat().mul2(new Quat().setFromDirections(from, direction.clone().normalize()), n.getRotation()));
    };
    const frames = [];
    for(let f = 0; f <= 24; f++){
        restore();
        const breath = Math.sin(f / 24 * Math.PI * 2) * 3e-3;
        for (const [side, knee, elbow] of [
            [
                "Left",
                motion.leftKnee,
                motion.leftElbow
            ],
            [
                "Right",
                motion.rightKnee,
                motion.rightElbow
            ]
        ]){
            const sign = side === "Left" ? 1 : -1, rad = knee * Math.PI / 180;
            aim(bone(side, "thigh"), bone(side, "shin"), new Vec3(sign * 0.05, -Math.cos(rad / 2), Math.sin(rad / 2)));
            aim(bone(side, "shin"), bone(side, "foot"), new Vec3(0, -Math.cos(rad / 2), -Math.sin(rad / 2)));
            aim(bone(side, "arm"), bone(side, "fore"), new Vec3(sign * 0.15, -1, 0.05));
            aim(bone(side, "fore"), bone(side, "hand"), new Vec3(-sign * 0.12, -1, Math.sin(elbow * Math.PI / 180) * 0.4));
        }
        chest.rotateLocal(breath * 50, 0, 0);
        hips.setRotation(new Quat().mul2(new Quat().setFromEulerAngles(-90, 0, 0), hips.getRotation()));
        const p = hips.getLocalPosition().clone();
        hips.setLocalPosition(p.x, 0.12 + breath, 0);
        frames.push(nodes.map((_, i)=>read(i)));
    }
    frames[24] = frames[0];
    restore();
    return new AnimTrack("Sleep", 4, [
        new AnimData(1, frames.map((_, i)=>i / 6))
    ], bindings.map((_, i)=>new AnimData(rest[i].length, frames.flatMap((f)=>f[i]))), bindings.map(({ curve }, i)=>new AnimCurve(curve.paths, 0, i, INTERPOLATION_LINEAR)));
}
// src/components/CharacterVisual.ts
function createCharacter(app) {
    const player = new Entity("Arianna", app);
    app.root.addChild(player);
    player.setPosition(0, 0.09, 0.9);
    const visual = new Entity("Character visual pivot", app);
    player.addChild(visual);
    visual.setLocalEulerAngles(0, 30, 0);
    const placeholder = new Entity("Temporary capsule", app);
    visual.addChild(placeholder);
    const shape = primitives(app, placeholder);
    const lilac = material("Arianna lavender", "#b294dc");
    const cream = material("Arianna cream", "#ffe5cc");
    const rose = material("Arianna pink", "#efafc7");
    const ink = material("Arianna eyes", "#5e4c6b");
    shape("Capsule body", "capsule", [
        0,
        0.47,
        0
    ], [
        0.51,
        0.72,
        0.45
    ], lilac);
    shape("Placeholder head", "sphere", [
        0,
        0.94,
        0
    ], [
        0.49,
        0.47,
        0.46
    ], cream);
    shape("Left shoe", "capsule", [
        -0.14,
        0.1,
        0.06
    ], [
        0.21,
        0.19,
        0.3
    ], rose);
    shape("Right shoe", "capsule", [
        0.14,
        0.1,
        0.06
    ], [
        0.21,
        0.19,
        0.3
    ], rose);
    for (const x of [
        -0.095,
        0.095
    ])shape("Eye", "sphere", [
        x,
        0.97,
        0.215
    ], [
        0.052,
        0.061,
        0.03
    ], ink, false);
    for (const x of [
        -0.15,
        0.15
    ])shape("Cheek", "sphere", [
        x,
        0.895,
        0.202
    ], [
        0.065,
        0.034,
        0.025
    ], rose, false);
    const marker = primitives(app, player)("Player floor marker", "cylinder", [
        0,
        -0.027,
        0
    ], [
        0.72,
        0.012,
        0.72
    ], material("Player marker", "#efe0f6"), false);
    marker.render.receiveShadows = false;
    const animator = new CharacterAnimator(visual, placeholder);
    return {
        player,
        visual,
        placeholder,
        animator,
        grounding: null
    };
}
async function loadArianna(app, character, resolveAsset = (path)=>`${"/"}${path}`) {
    const configResponse = await fetch(resolveAsset("assets/characters/arianna/character.json"));
    if (!configResponse.ok) return;
    const config = await configResponse.json();
    if (!config.url) return;
    const response = await fetch(resolveAsset(`assets/characters/arianna/${config.manifest}`));
    if (!response.ok) throw new Error("Arianna manifest could not load.");
    let manifest = await response.json();
    const asset = new Asset("Arianna GLB", "container", {
        url: resolveAsset(`assets/characters/arianna/${config.url}`)
    });
    await new Promise((resolve, reject)=>{
        asset.once("load", ()=>resolve());
        asset.once("error", reject);
        app.assets.add(asset);
        app.assets.load(asset);
    });
    const resource = asset.resource;
    const model = resource.instantiateRenderEntity({
        castShadows: true
    });
    let tracks = (resource.animations ?? []).map((asset2)=>asset2.resource);
    if (config.adapter === "meshy") {
        const motion = await fetch(resolveAsset("assets/animations/chores/cmu-trajectories.json"));
        if (!motion.ok) throw new Error("Chore motion library could not load.");
        ({ tracks, manifest } = meshyGameplay(model, tracks, await motion.json()));
        const sleep = sleepingTrack(model, tracks.find((t)=>t.name === "Idle"), await (await fetch(resolveAsset("assets/animations/rest/sleep.json"))).json());
        tracks.push(sleep, bedEntryTrack(model, tracks.find((t)=>t.name === "Idle"), sleep));
        manifest.animations.push({
            name: "Sleep",
            duration_seconds: 4,
            loop: true
        }, {
            name: "SleepEnter",
            duration_seconds: 3.2,
            loop: false
        });
    }
    const bounds = new BoundingBox();
    let first = true;
    for (const render of model.findComponents("render")){
        for (const mesh of render.meshInstances){
            if (first) {
                bounds.copy(mesh.aabb);
                first = false;
            } else bounds.add(mesh.aabb);
        }
    }
    if (first || bounds.halfExtents.y < 1e-3) {
        model.destroy();
        throw new Error("Arianna GLB has no usable visible geometry.");
    }
    const scale = (config.height ?? manifest.scale.rest_height_m) / manifest.scale.rest_height_m;
    const alignment = new Entity("GLB alignment", app);
    alignment.addChild(model);
    model.setLocalScale(scale, scale, scale);
    alignment.setLocalEulerAngles(0, config.yaw ?? 0, 0);
    character.visual.addChild(alignment);
    try {
        character.animator.attach(model, tracks, manifest, scale);
    } catch (error) {
        alignment.destroy();
        throw error;
    }
    character.grounding = new CharacterGrounding(app.root, character.player, alignment);
    character.grounding.update();
    character.placeholder.enabled = false;
}
var PlayerController = class {
    get approaching() {
        return this.approach !== null;
    }
    /** Find a reachable standing point beside the actual prop, respecting inflated furniture. */ approachProp(point, arrived, cancelled) {
        const start = this.entity.getPosition().clone(), candidates = [];
        const free = (p)=>{
            this.candidate.copy(p);
            return !this.blocked();
        };
        const clear = (p)=>{
            const count = Math.ceil(start.distance(p) / 0.06);
            for(let i = 1; i <= count; i++)if (!free(new Vec3().lerp(start, p, i / count))) return false;
            return true;
        };
        for(let radius = 0.32; radius <= 1.8; radius += 0.06)for(let angle = 0; angle < Math.PI * 2; angle += Math.PI / 24){
            const p = new Vec3(point.x + Math.sin(angle) * radius, start.y, point.z + Math.cos(angle) * radius);
            if (p.distance(start) < 2.2 && free(p) && clear(p)) candidates.push(p);
        }
        candidates.sort((a, b)=>Math.hypot(a.x - point.x, a.z - point.z) * 3 + a.distance(start) - Math.hypot(b.x - point.x, b.z - point.z) * 3 - b.distance(start));
        if (!candidates.length) {
            cancelled();
            return;
        }
        this.approach = {
            point: candidates[0],
            arrived,
            cancelled
        };
    }
    setRoom(room) {
        this.room = room;
        this.bounds = room.obstacles.map((box)=>{
            const expanded = box.clone();
            expanded.halfExtents.x += this.radius;
            expanded.halfExtents.z += this.radius;
            return expanded;
        });
    }
    axis(positive, negative) {
        return Number(positive.some((key)=>this.keyboard.isPressed(key))) - Number(negative.some((key)=>this.keyboard.isPressed(key)));
    }
    update(dt) {
        if (!this.enabled) {
            this.input.set(0, 0);
            this.velocity.set(0, 0, 0);
            this.keyboard.update();
            return;
        }
        this.input.copy(this.joystick);
        this.input.x += this.axis([
            KEY_D,
            KEY_RIGHT
        ], [
            KEY_A,
            KEY_LEFT
        ]);
        this.input.y += this.axis([
            KEY_W,
            KEY_UP
        ], [
            KEY_S,
            KEY_DOWN
        ]);
        if (this.input.lengthSq() > 1) this.input.normalize();
        if (document.hidden) this.input.set(0, 0);
        if (this.approach) {
            const pending = this.approach;
            if (this.input.lengthSq() > 0.04 || document.hidden) {
                this.approach = null;
                pending.cancelled();
            } else {
                const delta = pending.point.clone().sub(this.entity.getPosition());
                delta.y = 0;
                if (delta.length() < 0.045) {
                    this.approach = null;
                    pending.arrived();
                    this.velocity.set(0, 0, 0);
                    this.keyboard.update();
                    return;
                }
                const magnitude = Math.min(1, delta.length() / Math.max(this.speed * dt, 1e-3));
                delta.normalize();
                this.input.set(delta.dot(this.right) * magnitude, delta.dot(this.forward) * magnitude);
            }
        }
        const dx = (this.right.x * this.input.x + this.forward.x * this.input.y) * this.speed * dt;
        const dz = (this.right.z * this.input.x + this.forward.z * this.input.y) * this.speed * dt;
        const start = this.entity.getPosition();
        const oldX = start.x, oldZ = start.z;
        this.candidate.copy(start);
        const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) / 0.08));
        for(let i = 0; i < steps; i++){
            const x = this.candidate.x;
            this.candidate.x = Math.max(-this.room.halfWidth + this.radius, Math.min(this.room.halfWidth - this.radius, x + dx / steps));
            if (this.blocked()) this.candidate.x = x;
            const z = this.candidate.z;
            this.candidate.z = Math.max(-this.room.halfDepth + this.radius, Math.min(this.room.halfDepth - this.radius, z + dz / steps));
            if (this.blocked()) this.candidate.z = z;
        }
        this.entity.setPosition(this.candidate);
        this.velocity.set((this.candidate.x - oldX) / Math.max(dt, 1e-3), 0, (this.candidate.z - oldZ) / Math.max(dt, 1e-3));
        this.keyboard.update();
    }
    blocked() {
        if (this.room.walkable) {
            for (const x of [
                this.candidate.x - this.radius,
                this.candidate.x + this.radius
            ]){
                for (const z of [
                    this.candidate.z - this.radius,
                    this.candidate.z + this.radius
                ]){
                    if (!this.room.walkable.some((floor)=>x >= floor.minX && x <= floor.maxX && z >= floor.minZ && z <= floor.maxZ)) return true;
                }
            }
        }
        return this.bounds.some((box)=>box.containsPoint(this.candidate));
    }
    destroy() {
        this.abort.abort();
        this.keyboard.detach();
    }
    constructor(entity, camera, room, joystick){
        _define_property(this, "entity", void 0);
        _define_property(this, "room", void 0);
        _define_property(this, "joystick", void 0);
        _define_property(this, "enabled", true);
        _define_property(this, "input", new Vec2());
        _define_property(this, "velocity", new Vec3());
        _define_property(this, "radius", 0.24);
        _define_property(this, "speed", RUN_SPEED);
        _define_property(this, "right", void 0);
        _define_property(this, "forward", void 0);
        _define_property(this, "candidate", new Vec3());
        _define_property(this, "bounds", []);
        _define_property(this, "keyboard", void 0);
        _define_property(this, "abort", new AbortController());
        _define_property(this, "approach", null);
        _define_property(this, "reset", ()=>{
            const pending = this.approach;
            this.approach = null;
            pending?.cancelled();
            this.keyboard.detach();
            this.keyboard.attach(window);
            this.input.set(0, 0);
            this.velocity.set(0, 0, 0);
        });
        this.entity = entity;
        this.room = room;
        this.joystick = joystick;
        this.right = camera.right.clone();
        this.right.y = 0;
        this.right.normalize();
        this.forward = camera.forward.clone();
        this.forward.y = 0;
        this.forward.normalize();
        this.setRoom(room);
        this.keyboard = new Keyboard(window, {
            preventDefault: false
        });
        window.addEventListener("keydown", (event)=>{
            if (event.key === " " && event.target?.closest("button,dialog")) return;
            if ([
                "ArrowUp",
                "ArrowDown",
                "ArrowLeft",
                "ArrowRight",
                " "
            ].includes(event.key)) event.preventDefault();
        }, {
            signal: this.abort.signal
        });
        window.addEventListener("blur", this.reset, {
            signal: this.abort.signal
        });
        document.addEventListener("visibilitychange", this.reset, {
            signal: this.abort.signal
        });
    }
};
var CarrySystem = class {
    pickUp(item) {
        if (this.item) return false;
        this.item = item;
        const bounds = new BoundingBox();
        let first = true;
        for (const render of item.entity.findComponents("render"))for (const mesh of render.meshInstances){
            if (first) {
                bounds.copy(mesh.aabb);
                first = false;
            } else bounds.add(mesh.aabb);
        }
        const center = item.carryGrip ? new Vec3(...item.carryGrip) : first ? new Vec3() : new Mat4().copy(item.entity.getWorldTransform()).invert().transformPoint(bounds.center);
        item.entity.reparent(this.socket);
        const scale = item.carriedScale ?? 1;
        item.entity.setLocalScale(scale, scale, scale);
        item.entity.setLocalPosition(center.mulScalar(-scale));
        item.entity.setLocalEulerAngles(0, 0, 0);
        return true;
    }
    release(parent, position) {
        if (!this.item) return null;
        const item = this.item;
        item.entity.reparent(parent);
        item.entity.setLocalScale(1, 1, 1);
        item.entity.setLocalPosition(...position);
        item.entity.setLocalEulerAngles(0, 0, 0);
        this.item = null;
        return item;
    }
    constructor(app, visual){
        _define_property(this, "socket", void 0);
        _define_property(this, "item", null);
        this.socket = new Entity("Carry socket", app);
        this.socket.setLocalPosition(0, 0.43, 0.43);
        visual.addChild(this.socket);
    }
};
var CAMERA_PRESETS = {
    CHORE: {
        zoom: 0.76
    }};
var IsometricCamera = class {
    get exploreHeight() {
        return this.returnZoom ?? this.entity.camera.orthoHeight;
    }
    beginChore(player, object) {
        if (this.returnZoom === null) this.returnZoom = this.entity.camera.orthoHeight;
        this.target = new Vec3().lerp(player, object, 0.4);
        this.state = "CHORE";
        this.returning = false;
    }
    endChore() {
        if (this.state === "CHORE") {
            this.state = "EXPLORE";
            this.target = null;
            this.returning = true;
        }
    }
    resize(width, height) {
        const aspect = width / height;
        const zoom = aspect < 1 ? Math.max(5.1, 2.65 / aspect) : 5.1;
        if (this.returnZoom !== null) this.returnZoom = zoom;
        this.entity.camera.orthoHeight = zoom * (this.state === "CHORE" ? CAMERA_PRESETS.CHORE.zoom : 1);
    }
    follow(player, dt) {
        const focus = this.target ?? player;
        this.desired.set(focus.x, 0, focus.z - 0.9);
        this.offset.lerp(this.offset, this.desired, 1 - Math.exp(-(this.target || this.returning ? 5 : 10) * dt));
        if (this.returnZoom !== null) {
            const wanted = this.returnZoom * (this.state === "CHORE" ? CAMERA_PRESETS.CHORE.zoom : 1);
            this.entity.camera.orthoHeight += (wanted - this.entity.camera.orthoHeight) * (1 - Math.exp(-5 * dt));
            if (this.returning && Math.abs(wanted - this.entity.camera.orthoHeight) < 5e-3) {
                this.entity.camera.orthoHeight = wanted;
                this.returnZoom = null;
                this.returning = false;
            }
        }
        this.interactionLift += ((this.state === "CHORE" ? 6 : 0) - this.interactionLift) * (1 - Math.exp(-5 * dt));
        this.entity.setPosition(6 + this.offset.x, 14 + this.interactionLift, 18.9 + this.offset.z);
        this.entity.lookAt(new Vec3(this.offset.x, 0.8, 0.9 + this.offset.z));
    }
    reset() {
        this.entity.camera.toneMapping = TONEMAP_LINEAR;
        if (this.returnZoom !== null) this.entity.camera.orthoHeight = this.returnZoom;
        this.returnZoom = null;
        this.returning = false;
        this.interactionLift = 0;
        this.target = null;
        this.state = "EXPLORE";
        this.offset.set(0, 0, 0);
        this.entity.setPosition(6, 14, 18.9);
        this.entity.lookAt(new Vec3(0, 0.8, 0.9));
    }
    constructor(app, existing){
        _define_property(this, "entity", void 0);
        _define_property(this, "offset", new Vec3());
        _define_property(this, "desired", new Vec3());
        _define_property(this, "state", "EXPLORE");
        _define_property(this, "target", null);
        _define_property(this, "returnZoom", null);
        _define_property(this, "returning", false);
        _define_property(this, "interactionLift", 0);
        this.entity = existing ?? new Entity("Following isometric camera", app);
        if (!this.entity.camera) this.entity.addComponent("camera", {
            projection: PROJECTION_ORTHOGRAPHIC,
            orthoHeight: 7,
            nearClip: 0.1,
            farClip: 60,
            clearColor: new Color().fromString("#ede6f4")
        });
        this.entity.setPosition(6, 14, 18.9);
        this.entity.lookAt(new Vec3(0, 0.8, 0.9));
        if (!existing) app.root.addChild(this.entity);
    }
};
var VirtualJoystick = class {
    destroy() {
        this.reset();
        this.abort.abort();
    }
    constructor(element, knob){
        _define_property(this, "element", void 0);
        _define_property(this, "knob", void 0);
        _define_property(this, "value", new Vec2());
        _define_property(this, "pointer", null);
        _define_property(this, "abort", new AbortController());
        _define_property(this, "down", (event)=>{
            if (this.pointer !== null || event.button !== 0) return;
            event.preventDefault();
            this.pointer = event.pointerId;
            this.element.setPointerCapture(event.pointerId);
            this.element.classList.add("dragging");
            this.move(event);
        });
        _define_property(this, "move", (event)=>{
            if (event.pointerId !== this.pointer) return;
            event.preventDefault();
            const rect = this.element.getBoundingClientRect();
            const radius = rect.width * 0.29;
            const x = event.clientX - rect.left - rect.width / 2;
            const y = event.clientY - rect.top - rect.height / 2;
            const length = Math.hypot(x, y);
            const scale = length > radius ? radius / length : 1;
            this.knob.style.transform = `translate(${x * scale}px, ${y * scale}px)`;
            const magnitude = Math.max(0, (Math.min(length / radius, 1) - 0.12) / 0.88);
            this.value.set(length ? x / length * magnitude : 0, length ? -y / length * magnitude : 0);
        });
        _define_property(this, "up", (event)=>{
            if (event.pointerId === this.pointer) this.reset();
        });
        _define_property(this, "reset", ()=>{
            const id = this.pointer;
            this.pointer = null;
            if (id !== null && this.element.hasPointerCapture(id)) this.element.releasePointerCapture(id);
            this.value.set(0, 0);
            this.knob.style.transform = "";
            this.element.classList.remove("dragging");
        });
        this.element = element;
        this.knob = knob;
        const options = {
            signal: this.abort.signal
        };
        element.addEventListener("pointerdown", this.down, options);
        element.addEventListener("pointermove", this.move, options);
        element.addEventListener("pointerup", this.up, options);
        element.addEventListener("pointercancel", this.up, options);
        element.addEventListener("lostpointercapture", this.up, options);
        window.addEventListener("blur", this.reset, options);
        window.addEventListener("resize", this.reset, options);
        document.addEventListener("visibilitychange", this.reset, options);
        element.addEventListener("contextmenu", (event)=>event.preventDefault(), options);
    }
};
// src/ui/ActionButton.ts
var ActionButton = class {
    destroy() {
        this.reset();
        this.abort.abort();
    }
    constructor(element, press, cancel){
        _define_property(this, "element", void 0);
        _define_property(this, "press", void 0);
        _define_property(this, "cancel", void 0);
        _define_property(this, "enabled", true);
        _define_property(this, "held", false);
        _define_property(this, "pointer", null);
        _define_property(this, "key", null);
        _define_property(this, "abort", new AbortController());
        _define_property(this, "reset", ()=>{
            const pointer = this.pointer;
            this.pointer = null;
            this.key = null;
            this.held = false;
            if (pointer !== null && this.element.hasPointerCapture(pointer)) this.element.releasePointerCapture(pointer);
            this.cancel();
        });
        this.element = element;
        this.press = press;
        this.cancel = cancel;
        const options = {
            signal: this.abort.signal
        };
        element.addEventListener("pointerdown", (event)=>{
            if (!this.enabled || event.button !== 0 || this.held || element.disabled) return;
            event.preventDefault();
            this.pointer = event.pointerId;
            element.setPointerCapture(event.pointerId);
            this.held = true;
            this.press();
        }, options);
        for (const name of [
            "pointerup",
            "pointercancel",
            "lostpointercapture"
        ]){
            element.addEventListener(name, (event)=>{
                if (event.pointerId === this.pointer) this.reset();
            }, options);
        }
        element.addEventListener("contextmenu", (event)=>event.preventDefault(), options);
        element.addEventListener("click", (event)=>{
            if (this.enabled && event.detail === 0 && !this.held && !element.disabled) {
                this.press();
                this.cancel();
            }
        }, options);
        window.addEventListener("keydown", (event)=>{
            const target = event.target;
            if (!this.enabled || ![
                "Space",
                "KeyE"
            ].includes(event.code) || target?.closest("dialog") || target?.closest("button") && target !== element) return;
            event.preventDefault();
            if (event.repeat || this.held || element.disabled) return;
            this.key = event.code;
            this.held = true;
            this.press();
        }, options);
        window.addEventListener("keyup", (event)=>{
            if (event.code === this.key) {
                event.preventDefault();
                this.reset();
            }
        }, options);
        window.addEventListener("blur", this.reset, options);
        window.addEventListener("resize", this.reset, options);
        document.addEventListener("visibilitychange", this.reset, options);
    }
};
// src/systems/MissionSystem.ts
var TASKS = [
    {
        id: "teddy",
        name: "Teddy",
        icon: "\u{1F9F8}"
    },
    {
        id: "shirt",
        name: "Shirt",
        icon: "\u{1F455}"
    },
    {
        id: "book",
        name: "Book",
        icon: "\u{1F4D8}"
    },
    {
        id: "crayons",
        name: "Crayons",
        icon: "\u{1F58D}"
    },
    {
        id: "dirt",
        name: "Dirt",
        icon: "\u2726"
    }
];
var MissionSystem = class {
    configure(tasks, timed = true) {
        this.tasks = tasks;
        this.timed = timed;
        this.reset();
    }
    start(now) {
        if (this.state !== "ready") return;
        this.state = "running";
        this.deadline = now + this.duration;
    }
    tick(now) {
        if (this.state !== "running" || !this.timed) return;
        this.remaining = Math.max(0, this.deadline - now);
        if (this.remaining === 0) this.finish("time", now);
    }
    pauseFor(milliseconds) {
        if (this.state === "running" && this.timed) this.deadline += Math.max(0, milliseconds);
    }
    complete(task, now) {
        this.tick(now);
        if (this.state !== "running" || this.completed.has(task) || !this.tasks.some((entry)=>entry.id === task)) return false;
        this.completed.add(task);
        this.allowance += this.timed ? this.reward : 0;
        if (!this.continuous && this.completed.size === this.tasks.length) {
            this.bonus = this.timed ? this.allCleanBonus : 0;
            this.allowance += this.bonus;
            this.finish("complete", now);
        }
        return true;
    }
    finish(reason, now) {
        this.state = "finished";
        this.reason = reason;
        this.finishedAt = now;
    }
    reset() {
        this.state = "ready";
        this.reason = null;
        this.allowance = 0;
        this.bonus = 0;
        this.remaining = this.duration;
        this.deadline = 0;
        this.finishedAt = 0;
        this.completed.clear();
    }
    constructor(){
        _define_property(this, "duration", 6e4);
        _define_property(this, "reward", 1);
        _define_property(this, "allCleanBonus", 2);
        _define_property(this, "completed", /* @__PURE__ */ new Set());
        _define_property(this, "state", "ready");
        _define_property(this, "reason", null);
        _define_property(this, "allowance", 0);
        _define_property(this, "bonus", 0);
        _define_property(this, "remaining", this.duration);
        _define_property(this, "finishedAt", 0);
        _define_property(this, "deadline", 0);
        _define_property(this, "tasks", TASKS);
        _define_property(this, "timed", true);
        _define_property(this, "continuous", false);
    }
};
// src/systems/InteractionSystem.ts
var InteractionSystem = class {
    available(target, carried, mission) {
        if (mission.state === "finished") return false;
        if (!this.guard(target)) return false;
        if (target.kind === "daily") return target.available?.(carried) ?? false;
        const task = target.task ?? (target.item === "vacuum" ? "dirt" : target.item);
        if (task && !mission.tasks.some((entry)=>entry.id === task)) return false;
        if (target.task && mission.completed.has(target.task)) return false;
        if (target.available) return target.available(carried);
        if (target.kind === "place" || target.kind === "vacuum") return carried === target.item;
        if (carried) return false;
        if (target.kind === "pickup") return !mission.completed.has(target.item === "vacuum" ? "dirt" : target.item);
        return true;
    }
    distance(target, position) {
        return Math.hypot(target.anchor.x - position.x, target.anchor.z - position.z);
    }
    update(position, carried, mission) {
        let nearest = null;
        let nearestDistance = Infinity;
        for (const target of this.interactions){
            if (!this.available(target, carried, mission)) continue;
            const distance = this.distance(target, position);
            const range = target.range + (target === this.focus ? 0.1 : 0);
            const score = distance + (target.id === "put-tool-away" ? 100 : 0);
            if (distance <= range && score < nearestDistance) {
                nearest = target;
                nearestDistance = score;
            }
        }
        this.focus = nearest;
    }
    constructor(interactions, guard = ()=>true){
        _define_property(this, "interactions", void 0);
        _define_property(this, "guard", void 0);
        _define_property(this, "focus", null);
        this.interactions = interactions;
        this.guard = guard;
    }
};
var SurfaceTextures = class {
    apply(material2, kind, tiling = kind === "rug" ? 4 : 2) {
        if (!this.maps.has(kind)) {
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 256;
            const context = canvas.getContext("2d"), pixels = context.createImageData(256, 256);
            for(let y = 0; y < 256; y++)for(let x = 0; x < 256; x++){
                const weave = Math.sin(x * Math.PI / 8) * Math.sin(y * Math.PI / 8);
                const grain = Math.sin(y * Math.PI / 16 + Math.sin(x * Math.PI / 128) * 0.7);
                const fiber = Math.sin(x * Math.PI / 4 + y * Math.PI / 8) * 2;
                const value = kind === "checker" ? (Math.floor(x / 128) + Math.floor(y / 128)) % 2 ? 218 : 255 : kind === "tile" ? x < 4 || y < 4 ? 210 : 250 : kind === "terrazzo" ? Math.sin(x * 12.9898 + y * 78.233) * 43758.5453 % 1 > 0.87 ? 195 : 247 : kind === "wood" ? 244 + grain * 7 + Math.sin(y * Math.PI / 2) * 2 : kind === "rug" ? 240 + weave * 8 + Math.sin(y * Math.PI / 8) * 3 + fiber : 242 + weave * 9 + fiber;
                const i = (y * 256 + x) * 4;
                pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value;
                pixels.data[i + 3] = 255;
            }
            context.putImageData(pixels, 0, 0);
            const texture = new Texture(this.app.graphicsDevice, {
                name: `Subtle ${kind} surface`,
                mipmaps: true,
                minFilter: FILTER_LINEAR_MIPMAP_LINEAR,
                addressU: ADDRESS_REPEAT,
                addressV: ADDRESS_REPEAT
            });
            texture.setSource(canvas);
            this.maps.set(kind, texture);
        }
        material2.diffuseMap = this.maps.get(kind);
        material2.diffuseMapTiling.set(tiling, tiling);
        material2.update();
    }
    constructor(app){
        _define_property(this, "app", void 0);
        _define_property(this, "maps", /* @__PURE__ */ new Map());
        this.app = app;
    }
};
// src/pilot/BedroomPilot.ts
var SAVE = "dumpling.editorPilot.book.v1";
var css = `html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#ede6f4;font-family:system-ui,sans-serif;touch-action:none}canvas{display:block!important;position:fixed;inset:0;width:100%!important;height:100%!important}#pilot-ui{position:fixed;inset:0;pointer-events:none;color:#51445b}#pilot-ui header{position:absolute;top:max(16px,env(safe-area-inset-top));left:16px;right:16px;background:#fff8f0ed;border:1px solid #e4d4e6;border-radius:18px;padding:14px 16px;box-shadow:0 4px 18px #5b396914}#pilot-ui h1{font-size:19px;margin:0 0 4px}#pilot-ui p{font-size:13px;line-height:1.4;margin:0}#pilot-ui button{pointer-events:auto;touch-action:none;cursor:pointer;font:600 14px system-ui;border:1px solid #d4badb;border-radius:18px;background:#fff7fa;color:#51445b}#joystick{position:absolute;left:22px;bottom:max(28px,env(safe-area-inset-bottom));width:116px;height:116px;border:2px solid #bba2c5;border-radius:50%;background:#f9f0f9bc;pointer-events:auto;touch-action:none;display:grid;place-items:center}#joystick-knob{width:48px;height:48px;border-radius:50%;background:#b99aca;border:4px solid #fff5;box-shadow:0 3px 8px #70587e30}#action-button{position:absolute;right:20px;bottom:max(38px,env(safe-area-inset-bottom));width:138px;min-height:88px;padding:12px}#action-button:disabled{opacity:.65}#pilot-reset{position:absolute;right:16px;top:114px;padding:8px 12px;font-size:11px!important}#pilot-status{position:absolute;bottom:170px;left:24px;right:24px;text-align:center;font-size:13px;background:#fff9efde;border-radius:12px;padding:8px} @media(max-height:600px){#pilot-ui header{padding:8px 12px;top:8px}#pilot-ui h1{font-size:16px}#pilot-reset{top:93px}#pilot-status{bottom:141px}#joystick{width:98px;height:98px;bottom:20px}#action-button{bottom:25px;min-height:78px;width:126px}}`;
async function startPilot(app) {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.append(style);
    const ui = document.createElement("div");
    ui.id = "pilot-ui";
    ui.innerHTML = `<header><h1>Arianna\u2019s bedroom</h1><p>Pick up the blue book and put it back on the bookshelf.</p></header><button id="pilot-reset">Try again</button><div id="pilot-status" role="status">Getting ready\u2026</div><div id="joystick" role="group" aria-label="Movement joystick"><div id="joystick-knob"></div></div><button id="action-button" disabled>Come closer</button>`;
    document.body.append(ui);
    const root = app.root.findByName("Arianna bedroom");
    if (!root) throw Error("Saved Editor bedroom is missing");
    const find = (name)=>{
        const e = root.findByName(name);
        if (!e) throw Error("Missing scene entity " + name);
        return e;
    };
    const shelf = find("Bookshelf"), placement = find("Book placement"), destination = find("Book standing point"), marker = find("Book marker"), book = root.findByTag("pilot.book")[0];
    if (!book) throw Error("Missing tagged chore book");
    const bounds = find("Room bounds"), boundsBox = new BoundingBox();
    boundsBox.setFromTransformedAabb(new BoundingBox(new Vec3(), new Vec3(0.5, 0.5, 0.5)), bounds.getWorldTransform());
    const room = {
        root,
        obstacles: [],
        halfWidth: 3.3,
        halfDepth: 3.6,
        walkable: [
            {
                minX: boundsBox.center.x - boundsBox.halfExtents.x,
                maxX: boundsBox.center.x + boundsBox.halfExtents.x,
                minZ: boundsBox.center.z - boundsBox.halfExtents.z,
                maxZ: boundsBox.center.z + boundsBox.halfExtents.z
            }
        ]
    };
    const colliderNodes = root.findByTag("pilot.collider");
    const refreshBounds = ()=>{
        room.obstacles = colliderNodes.map((e)=>{
            const b = new BoundingBox();
            b.setFromTransformedAabb(new BoundingBox(new Vec3(), new Vec3(0.5, 0.5, 0.5)), e.getWorldTransform());
            return b;
        });
    };
    refreshBounds();
    const camera = new IsometricCamera(app, app.root.findByName("Camera"));
    camera.entity.camera.projection = 1;
    camera.entity.camera.clearColor = new Color().fromString("#ede6f4");
    camera.entity.camera.farClip = 60;
    const character = createCharacter(app);
    character.player.setPosition(find("Player start").getPosition());
    const joystick = new VirtualJoystick(document.querySelector("#joystick"), document.querySelector("#joystick-knob"));
    const controller = new PlayerController(character.player, camera.entity, room, joystick.value);
    const carry = new CarrySystem(app, character.visual);
    character.animator.bindCarrySocket(carry.socket);
    const mission = new MissionSystem();
    mission.configure([
        {
            id: "book",
            name: "Book",
            icon: "\u{1F4D8}"
        }
    ], false);
    mission.start(performance.now());
    const bookHome = book.getPosition().clone();
    const item = {
        id: "book",
        name: "Book",
        icon: "\u{1F4D8}",
        entity: book,
        home: bookHome.toArray()
    };
    const pickup = {
        id: "pickup-book",
        name: "Book",
        icon: "\u{1F4D8}",
        kind: "pickup",
        item: "book",
        anchor: bookHome.clone(),
        marker: bookHome.clone().add(new Vec3(0, 0.6, 0)),
        range: 0.85
    };
    const drop = {
        id: "bookshelf",
        name: "Bookshelf",
        icon: "\u{1F4D8}",
        kind: "place",
        item: "book",
        task: "book",
        anchor: destination.getPosition().clone(),
        marker: marker.getPosition().clone(),
        range: 1.05,
        placement: placement.getPosition().toArray()
    };
    const interactions = new InteractionSystem([
        pickup,
        drop
    ]);
    let ready = false, aligning = false;
    const button = document.querySelector("#action-button"), status = document.querySelector("#pilot-status");
    const atShelf = ()=>{
        book.reparent(shelf);
        book.setLocalPosition(placement.getLocalPosition());
        book.setLocalEulerAngles(0, 0, 0);
    };
    if (localStorage.getItem(SAVE) === "complete") {
        mission.complete("book", performance.now());
        atShelf();
    }
    document.querySelector("#pilot-reset").addEventListener("click", ()=>{
        localStorage.removeItem(SAVE);
        location.reload();
    });
    const events = [];
    new ActionButton(button, ()=>{
        interactions.update(character.player.getPosition(), carry.item?.id ?? null, mission);
        const target = interactions.focus;
        if (!ready || !target || aligning || character.animator.busy) return;
        const point = (target === pickup ? book.getPosition() : placement.getPosition()).clone();
        aligning = true;
        controller.approachProp(point, ()=>{
            aligning = false;
            camera.beginChore(character.player.getPosition(), point);
            character.animator.playAction(target === pickup ? "PickUp" : "PutDown", target === pickup ? 0.25 : 0.3, ()=>{
                if (target === pickup) {
                    if (carry.pickUp(item)) {
                        character.animator.setCarrying(true);
                        events.push("pickup");
                    }
                } else if (carry.item?.id === "book" && mission.complete("book", performance.now())) {
                    carry.release(app.root, placement.getPosition().toArray());
                    atShelf();
                    character.animator.setCarrying(false);
                    localStorage.setItem(SAVE, "complete");
                    events.push("placed");
                }
            }, point);
        }, ()=>{
            aligning = false;
        });
    }, ()=>{});
    const surfaces = new SurfaceTextures(app);
    for (const a of app.assets.list()){
        if (a.type === "material" && a.resource) {
            const m = a.resource;
            if (m.name === "Honey birch") surfaces.apply(m, "wood");
            if (m.name === "Lilac rug") surfaces.apply(m, "rug");
        }
    }
    const resolveAsset = (path)=>{
        const name = path.endsWith("arianna.glb") ? "pilot-arianna-original.bin" : "pilot-" + path.split("/").pop();
        const asset = app.assets.find(name);
        return asset?.getFileUrl() ?? "/" + path;
    };
    app.graphicsDevice.maxPixelRatio = Math.min(devicePixelRatio || 1, 1.75);
    const resize = ()=>{
        app.resizeCanvas(innerWidth, innerHeight);
        camera.resize(innerWidth, innerHeight);
    };
    resize();
    window.addEventListener("resize", resize);
    let lastBounds = "";
    app.on("update", (elapsed)=>{
        const dt = document.hidden ? 0 : Math.min(elapsed, 0.04); performance.now();
        const signature = colliderNodes.map((e)=>Array.from(e.getWorldTransform().data).join(",")).join(";");
        if (signature !== lastBounds) {
            refreshBounds();
            controller.setRoom(room);
            lastBounds = signature;
        }
        drop.anchor.copy(destination.getPosition());
        drop.marker.copy(marker.getPosition());
        drop.placement = placement.getPosition().toArray();
        if (!carry.item && !mission.completed.has("book")) pickup.anchor.copy(book.getPosition());
        controller.enabled = ready && !character.animator.busy;
        controller.update(dt);
        camera.follow(character.player.getPosition(), dt);
        character.animator.update(dt, controller.velocity, elapsed);
        character.grounding?.update();
        if (!character.animator.busy) camera.endChore();
        interactions.update(character.player.getPosition(), carry.item?.id ?? null, mission);
        button.disabled = !ready || !interactions.focus || aligning || character.animator.busy;
        button.textContent = aligning ? "Moving closer\u2026" : character.animator.actionName ?? (mission.completed.has("book") ? "All tidy!" : interactions.focus === pickup ? "Pick up book" : interactions.focus === drop ? "Put book away" : "Come closer");
        status.textContent = !ready ? "Getting ready\u2026" : mission.completed.has("book") ? "Lovely! The book is back where it belongs." : carry.item ? "Take the book to the bookshelf." : "Find the blue book on the floor.";
    });
    window.__pilot = {
        snapshot: ()=>({
                ready,
                position: character.player.getPosition().toArray(),
                velocity: controller.velocity.toArray(),
                cameraRight: camera.entity.right.toArray(),
                cameraForward: camera.entity.forward.toArray(),
                character: character.animator.snapshot(),
                animation: character.animator.currentState,
                carrying: carry.item?.id ?? null,
                completed: mission.completed.has("book"),
                focus: interactions.focus?.id,
                aligning,
                book: book.getPosition().toArray(),
                shelf: shelf.getPosition().toArray(),
                destination: destination.getPosition().toArray(),
                placement: placement.getPosition().toArray(),
                obstacles: room.obstacles.map((b)=>({
                        center: b.center.toArray(),
                        half: b.halfExtents.toArray()
                    })),
                events: [
                    ...events
                ],
                saveKeys: Object.keys(localStorage),
                drawCalls: app.stats.drawCalls.total
            }),
        geometry: ()=>character.animator.geometrySnapshot()
    };
    await loadArianna(app, character, resolveAsset);
    if (character.placeholder.enabled) throw Error("Original Arianna did not load");
    ready = true;
    document.body.dataset.pilotReady = "true";
}
class BedroomPilot extends Script {
    initialize() {
        startPilot(this.app).catch((e)=>{
            console.error(e);
            const label = document.querySelector("#pilot-status");
            if (label) label.textContent = "Unable to load the bedroom.";
        });
    }
}
_define_property(BedroomPilot, "scriptName", "bedroomPilot");

export { BedroomPilot, startPilot };
