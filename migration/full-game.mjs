var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/editor/AssetUrls.ts
function useEditorAssets(app) {
  application = app;
}
function containerOptions(sourcePath) {
  return { crossOrigin: "anonymous", image: { preprocess(image) {
    if (application && image.uri && !/^(data:|https?:)/.test(image.uri)) {
      const path = new URL(image.uri, new URL(sourcePath, "https://asset-path.invalid/")).pathname;
      image.uri = assetUrl(path);
    }
  } } };
}
function assetUrl(path) {
  if (!application) return path;
  const key = decodeURIComponent(path.replace(/^\/?assets\//, ""));
  const asset = application.assets.find("game__" + key.replaceAll("/", "__") + (key.endsWith(".glb") ? ".bin" : ""));
  if (!asset) throw new Error("Missing migrated asset: " + key);
  return new URL(asset.getFileUrl(), document.baseURI).href;
}
var application;
var init_AssetUrls = __esm({
  "src/editor/AssetUrls.ts"() {
    "use strict";
  }
});

// src/ui/PerformanceSettings.ts
function performanceSettings(app, blocked) {
  const details = document.createElement("details"), summary = document.createElement("summary"), readout = document.createElement("p");
  summary.textContent = "Performance information";
  details.append(summary, readout);
  document.querySelector(".audio-settings").append(details);
  let frames = 0, fps = 0, start = performance.now();
  const counted = () => {
    frames++;
    const now = performance.now();
    if (now - start >= 1e3) {
      fps = Math.round(frames * 1e3 / (now - start));
      frames = 0;
      start = now;
    }
  };
  app.on("postrender", counted);
  const timer = setInterval(() => {
    if (details.open) readout.textContent = `Last active render rate: ${fps} FPS \xB7 Textures: ${Math.round(app.stats.vram.tex / 1048576)} MiB. Rendering pauses behind menus.`;
  }, 500);
  const render = () => {
    const paused = document.hidden || blocked() || !!document.querySelector("dialog[open]");
    app.autoRender = !paused;
    app.renderNextFrame = !paused;
  };
  app.on("framerender", render);
  return () => {
    clearInterval(timer);
    app.off("postrender", counted);
    app.off("framerender", render);
    details.remove();
    app.autoRender = true;
  };
}
var init_PerformanceSettings = __esm({
  "src/ui/PerformanceSettings.ts"() {
    "use strict";
  }
});

// src/systems/SaveNamespace.ts
var SCHOOL_REVIEW, OPENING_REVIEW, SAVE_PREFIX, saveKey;
var init_SaveNamespace = __esm({
  "src/systems/SaveNamespace.ts"() {
    "use strict";
    SCHOOL_REVIEW = new URLSearchParams(globalThis.location?.search ?? "").get("preview") === "school";
    OPENING_REVIEW = new URLSearchParams(globalThis.location?.search ?? "").get("preview") === "opening";
    SAVE_PREFIX = OPENING_REVIEW ? "dumpling.openingReview" : SCHOOL_REVIEW ? "dumpling.schoolReview" : globalThis.__productionRelease ? "arianna" : "dumpling.editorMigration";
    saveKey = (suffix) => `${SAVE_PREFIX}.${suffix}`;
  }
});

// src/ui/AudioSettings.ts
function audioLevel(channel) {
  if (values[channel] === void 0) {
    let value = channel === "music" ? 0.5 : 1;
    try {
      const saved = localStorage.getItem(saveKey("audio." + channel));
      if (saved !== null && Number.isFinite(Number(saved))) value = Math.max(0, Math.min(1, Number(saved)));
    } catch {
    }
    values[channel] = value;
  }
  return values[channel];
}
function onAudioChange(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function createAudioSettings() {
  const button2 = document.createElement("button");
  button2.id = "audio-settings";
  button2.textContent = "\u266B Volume";
  button2.type = "button";
  const dialog = document.createElement("dialog");
  dialog.className = "audio-settings";
  dialog.setAttribute("aria-label", "Sound settings");
  dialog.innerHTML = "<h2>Sound & performance</h2>" + ["music", "effects"].map((channel) => `<label>${channel === "music" ? "Music" : "Sound effects"} <output id="${channel}-level"></output><input type="range" min="0" max="100" step="1" data-channel="${channel}" aria-label="${channel === "music" ? "Music volume" : "Sound effects volume"}"></label>`).join("") + '<p>0 is silent. Your volume is saved.</p><button type="button">Done</button>';
  for (const slider of dialog.querySelectorAll("input")) {
    const channel = slider.dataset.channel, output = dialog.querySelector("#" + channel + "-level");
    slider.value = String(Math.round(audioLevel(channel) * 100));
    output.value = slider.value + "%";
    slider.oninput = () => {
      values[channel] = Number(slider.value) / 100;
      output.value = slider.value + "%";
      try {
        localStorage.setItem(saveKey("audio." + channel), String(values[channel]));
      } catch {
      }
      listeners.forEach((fn) => fn());
    };
  }
  button2.onclick = () => dialog.showModal();
  dialog.querySelector("button").onclick = () => dialog.close();
  document.querySelector("footer").prepend(button2);
  document.body.append(dialog);
  const muteRow = document.createElement("div");
  muteRow.className = "audio-mutes";
  for (const id of ["house-music", "house-effects"]) {
    const mute = document.getElementById(id);
    if (mute) muteRow.append(mute);
  }
  dialog.insertBefore(muteRow, dialog.querySelector("p"));
  const popButton = button2.cloneNode(true);
  popButton.id = "pop-volume";
  popButton.onclick = () => dialog.showModal();
  document.querySelector("#squishy-pop .pop-title")?.append(popButton);
  return () => {
    dialog.remove();
    button2.remove();
    popButton.remove();
  };
}
var listeners, values;
var init_AudioSettings = __esm({
  "src/ui/AudioSettings.ts"() {
    "use strict";
    init_SaveNamespace();
    listeners = /* @__PURE__ */ new Set();
    values = {};
  }
});

// src/editor/PropSpace.ts
import { Vec3 } from "playcanvas";
function registerPropSpace(key, entity, origin) {
  spaces.set(key, { entity, origin });
}
function propPoint(key, point) {
  const s = spaces.get(key);
  return s ? s.entity.getWorldTransform().transformPoint(point.clone().sub(s.origin)) : point.clone();
}
function propTuple(key, point) {
  return propPoint(key, new Vec3(...point)).toArray();
}
function propYaw(key, yaw) {
  return yaw + (spaces.get(key)?.entity.getEulerAngles().y ?? 0);
}
function propHeight(key, y) {
  const s = spaces.get(key);
  return s ? s.entity.getPosition().y + y * s.entity.getLocalScale().y : y;
}
var spaces;
var init_PropSpace = __esm({
  "src/editor/PropSpace.ts"() {
    "use strict";
    spaces = /* @__PURE__ */ new Map();
  }
});

// src/editor/LayoutBridge.ts
import { BoundingBox, Vec3 as Vec32 } from "playcanvas";
function trackArt(task) {
  artTasks.push(task);
}
function recordLayout(entity, parent, model) {
  if (!scopes.has(parent.name) && !parent.tags.has("migration.store")) return;
  if (/Nearby display aura|Trading spot|Paper wiping|Puppy kibble/.test(entity.name)) return;
  const key = parent.name + "/" + entity.name, index = counts.get(key) ?? 0;
  counts.set(key, index + 1);
  records.push({ key: key + "/" + index, entity, model });
}
function recordArt(entity, parent, model) {
  recordLayout(entity, parent, model);
}
async function captureWorld(app, house, props, loop, editor) {
  await Promise.all([house.ready, ...loop.stores.map((s) => s.ready), loop.recess.ready, ...artTasks]);
  const rooms = [house, ...loop.stores, loop.recess];
  for (const room of rooms) if (room.artStats?.().errors.length) throw Error("Environment assets failed: " + room.root.name + " " + room.artStats().errors.join(", "));
  const serialize = (r) => {
    const e = r.entity, m = e.render?.meshInstances[0]?.material;
    return { key: r.key, name: e.name, model: r.model, modelMaterials: r.model ? e.findComponents("render").flatMap((r2) => r2.meshInstances.map((mi) => {
      const mat = mi.material;
      return { name: mat.name, diffuse: [mat.diffuse.r, mat.diffuse.g, mat.diffuse.b], specular: [mat.specular.r, mat.specular.g, mat.specular.b], emissive: [mat.emissive.r, mat.emissive.g, mat.emissive.b], useLighting: mat.useLighting };
    })) : void 0, position: e.getLocalPosition().toArray(), rotation: e.getLocalEulerAngles().toArray(), scale: e.getLocalScale().toArray(), scope: e.parent.name, enabled: e.enabled, render: e.render ? { type: e.render.type, castShadows: e.render.castShadows } : void 0, material: m ? { name: m.name, diffuse: [m.diffuse.r, m.diffuse.g, m.diffuse.b], specular: [m.specular.r, m.specular.g, m.specular.b], emissive: [m.emissive.r, m.emissive.g, m.emissive.b], useLighting: m.useLighting } : void 0, normalization: r.model ? e.children[0].getLocalScale().toArray() : void 0, offset: r.model ? e.children[0].getLocalPosition().toArray() : void 0 };
  };
  const data = { records: records.map(serialize), rooms: rooms.map((r) => ({ name: r.root.name, walkable: r.walkable, obstacles: r.obstacles.map((b) => ({ center: b.center.toArray(), half: b.halfExtents.toArray() })) })), interactions: props.interactions.filter((i) => i.kind === "place" || i.kind === "daily" && !/play-lilah|wipe-|vacuum-|put-tool/.test(i.id)).map((i) => ({ id: i.id, anchor: i.anchor.toArray(), marker: i.marker.toArray(), placement: i.placement })), stores: loop.stores.map((s) => ({ name: s.root.name, sites: s.sites.map((t) => ({ id: t.id, anchor: t.anchor.toArray(), marker: t.marker.toArray() })), exit: s.exitAnchor.toArray() })) };
  window.__migrationSource = data;
  data.lights = house.lighting?.snapshot().lights;
  window.__migration = { ready: false, source: data };
  if (editor) {
    const authored = app.root.findByTag("migration.environment");
    if (!authored.length) throw Error("This Editor scene is missing its authored game environments.");
    const entities = /* @__PURE__ */ new Map();
    for (const e of app.root.findByTag("migration.record")) {
      const key = e.tags.list().find((t) => t.startsWith("key:")).slice(4);
      entities.set(key, e);
    }
    const variants = /* @__PURE__ */ new Map(), emission = [];
    const paintMaterial = (source, paint) => {
      const key = source.id + ":" + paint.id;
      if (variants.has(key)) return variants.get(key);
      const m = source.clone();
      m.diffuse.copy(paint.diffuse);
      m.specular.copy(paint.specular);
      m.gloss = paint.gloss;
      m.metalness = paint.metalness;
      if (paint.diffuseMap) {
        m.diffuseMap = paint.diffuseMap;
        m.diffuseMapTiling.copy(paint.diffuseMapTiling);
      }
      m.update();
      variants.set(key, m);
      emission.push({ source, target: m });
      return m;
    };
    for (const r of records) {
      const e = entities.get(r.key);
      if (!e) throw Error("Missing Editor layout entity: " + r.key);
      const original = r.entity;
      for (const preview of e.findByTag("migration.preview")) {
        const paints = preview.findComponents("render").flatMap((r2) => r2.meshInstances.map((m) => m.material));
        original.findComponents("render").flatMap((r2) => r2.meshInstances).forEach((mesh, i) => {
          if (paints[i]) mesh.material = paintMaterial(mesh.material, paints[i]);
        });
        preview.enabled = false;
      }
      if (e.render) {
        const paint = e.render.meshInstances[0]?.material, material2 = original.render?.meshInstances[0]?.material;
        if (material2 && paint) {
          original.render.material = paintMaterial(material2, paint);
          original.render.type = e.render.type;
        }
        e.render.enabled = false;
      }
      original.reparent(e);
      original.setLocalPosition(0, 0, 0);
      original.setLocalEulerAngles(0, 0, 0);
      original.setLocalScale(1, 1, 1);
    }
    for (const env of authored) {
      const name = env.tags.list().find((t) => t.startsWith("scope:")).slice(6);
      if (name === "Classroom trading club" && loop.recess.usesReferenceLayout) {
        env.enabled = false;
        continue;
      }
      const runtime = rooms.find((r) => r.root.name === name)?.root ?? (name === "Bedroom" ? house.root.findByName("Bedroom") : name === "Cleanup props" ? props.root : props.daily.root);
      if (!runtime) throw Error("Unknown layout scope " + name);
      env.reparent(runtime);
      env.enabled = true;
    }
    for (const n of app.root.findByTag("migration.light")) {
      const name = n.tags.list().find((t) => t.startsWith("light:")).slice(6), light = house.root.findComponents("light").find((l) => l.entity !== n && l.entity.name === name);
      if (light) {
        light.entity.reparent(n);
        light.entity.setLocalPosition(0, 0, 0);
        light.entity.setLocalEulerAngles(0, 0, 0);
        light.color.copy(n.light.color);
        light.range = n.light.range;
        n.light.enabled = false;
      }
    }
    for (const [key, x, z] of [["bed", -2.05, -1.7], ["crib", 9.8, -1.7], ["dining", 0.55, 13.85], ["marc-seat", 4.5, 7.35], ["stove", -2.72, 12.65], ["fridge", -2.65, 14.55], ["clothes", -0.7, 3.05]]) {
      const index = data.rooms[0].obstacles.findIndex((b) => Math.abs(b.center[0] - x) < 0.01 && Math.abs(b.center[2] - z) < 0.01), e = app.root.findByTag("prop:Maple cottage:" + index)[0];
      if (e) registerPropSpace(key, e, new Vec32(x, 0, z));
    }
    for (const item of props.items) {
      const key = item.id === "daily-outfit" ? "clothes" : item.id === "breakfast-egg" ? "fridge" : item.id === "breakfast-plate" ? "stove" : null;
      if (key) item.home.splice(0, 3, ...propTuple(key, item.home));
    }
    const bounds = new BoundingBox(new Vec32(), new Vec32(0.5, 0.5, 0.5));
    for (const r of rooms) {
      if (r === loop.recess && loop.recess.usesReferenceLayout) continue;
      const enabled = r.root.enabled;
      r.root.enabled = true;
      const nodes = app.root.findByTag("collision:" + r.root.name).filter((n) => n.enabled);
      r.obstacles.splice(0, r.obstacles.length, ...nodes.map((n) => {
        const box = new BoundingBox();
        box.setFromTransformedAabb(bounds, n.getWorldTransform());
        return box;
      }));
      r.root.enabled = enabled;
    }
    for (const r of rooms.filter((r2) => r2 !== loop.recess || !loop.recess.usesReferenceLayout)) for (const n of app.root.findByTag("walkable:" + r.root.name)) {
      const index = Number(n.tags.list().find((t) => t.startsWith("index:")).slice(6)), b = new BoundingBox();
      b.setFromTransformedAabb(bounds, n.getWorldTransform());
      if (r.walkable?.[index]) Object.assign(r.walkable[index], { minX: b.center.x - b.halfExtents.x, maxX: b.center.x + b.halfExtents.x, minZ: b.center.z - b.halfExtents.z, maxZ: b.center.z + b.halfExtents.z });
    }
    for (const i of props.interactions) {
      const a = app.root.findByTag("anchor:" + i.id)[0], marker = app.root.findByTag("marker:" + i.id)[0], p = app.root.findByTag("placement:" + i.id)[0];
      if (a) i.anchor.copy(a.getPosition());
      if (marker) i.marker.copy(marker.getPosition());
      if (p && i.placement) i.placement.splice(0, 3, ...p.getPosition().toArray());
    }
    for (const s of loop.stores) {
      for (const site of s.sites) {
        for (const field of ["anchor", "marker"]) {
          const e = app.root.findByTag(s.root.name + ":" + site.id + ":" + field)[0];
          if (e) site[field].copy(e.getPosition());
        }
      }
      const exit = app.root.findByTag("exit:" + s.root.name)[0];
      if (exit) s.exitAnchor.copy(exit.getPosition());
    }
    for (const s of loop.stores) for (let i = 0; i < s.sites.length; i++) {
      const group = app.root.findByTag("prop:" + s.root.name + ":" + i)[0], origin = data.rooms.find((r) => r.name === s.root.name).obstacles[i].center;
      for (const child of [...s.boxes[i], s.glows[i]]) {
        const p = child.getLocalPosition().clone().sub(new Vec32(origin[0], 0, origin[2]));
        child.reparent(group);
        child.setLocalPosition(p);
      }
    }
    for (const s of loop.stores) {
      for (let i = 0; i < s.sites.length; i++) {
        s.boxes[i].forEach((box, n) => {
          const socket = app.root.findByTag("stock:" + s.root.name + ":" + i + ":" + n)[0];
          if (socket) {
            box.setLocalPosition(socket.getLocalPosition());
            box.setLocalEulerAngles(socket.getLocalEulerAngles());
            box.setLocalScale(socket.getLocalScale());
          }
        });
        const anchor = app.root.findByTag(s.root.name + ":" + i + ":anchor")[0];
        if (anchor) s.glows[i].setLocalPosition(anchor.getLocalPosition().clone().add(new Vec32(0, 0.027, 0)));
      }
      const batch = app.batcher.addGroup("Store art " + s.root.name, false, 32);
      for (const e of s.root.findByTag("store.art")) for (const r of e.findComponents("render")) r.batchGroupId = batch.id;
    }
    const classroom = app.root.findByTag("prop:Classroom trading club:0")[0];
    if (classroom) loop.recess.bindLayout(classroom);
    const batchIds = [...new Set(app.root.findComponents("render").map((r) => r.batchGroupId).filter((id) => id >= 0))];
    app.batcher.generate(batchIds);
    app.on("update", () => {
      for (const { source, target } of emission) if (target.emissiveIntensity !== source.emissiveIntensity || !target.emissive.equals(source.emissive)) {
        target.emissive.copy(source.emissive);
        target.emissiveIntensity = source.emissiveIntensity;
        target.update();
      }
    });
  }
  window.__migration.ready = true;
}
var records, counts, artTasks, scopes;
var init_LayoutBridge = __esm({
  "src/editor/LayoutBridge.ts"() {
    "use strict";
    init_PropSpace();
    records = [];
    counts = /* @__PURE__ */ new Map();
    artTasks = [];
    scopes = /* @__PURE__ */ new Set(["Bedroom", "Maple cottage", "Cleanup props", "Daily routines"]);
  }
});

// src/components/HousePath.ts
import { Vec3 as Vec33 } from "playcanvas";
var HousePath;
var init_HousePath = __esm({
  "src/components/HousePath.ts"() {
    "use strict";
    HousePath = class {
      constructor(house, radius = 0.17) {
        this.house = house;
        this.radius = radius;
      }
      house;
      radius;
      free(x, z) {
        for (const a of [x - this.radius, x + this.radius]) for (const b of [z - this.radius, z + this.radius]) if (!this.house.walkable?.some((r) => a >= r.minX && a <= r.maxX && b >= r.minZ && b <= r.maxZ)) return false;
        return !this.house.obstacles.some((o) => Math.abs(x - o.center.x) <= o.halfExtents.x + this.radius && Math.abs(z - o.center.z) <= o.halfExtents.z + this.radius);
      }
      line(a, b) {
        const n = Math.ceil(a.distance(b) / 0.02);
        for (let i = 1; i <= n; i++) if (!this.free(a.x + (b.x - a.x) * i / n, a.z + (b.z - a.z) * i / n)) return false;
        return true;
      }
      route(start, end) {
        if (!this.free(end.x, end.z)) return [];
        if (this.line(start, end)) return [end.clone()];
        const step = 0.25, key = (x, z) => x + "," + z;
        const open = [], cost = /* @__PURE__ */ new Map();
        let finish;
        for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
          const x = Math.round(start.x / step) + dx, z = Math.round(start.z / step) + dz, p = new Vec33(x * step, 0, z * step);
          if (!this.free(p.x, p.z) || !this.line(start, p)) continue;
          const g = start.distance(p) / step;
          cost.set(key(x, z), g);
          open.push({ x, z, g, f: g + p.distance(end) / step });
        }
        for (let iterations = 0; open.length && iterations < 5e3; iterations++) {
          open.sort((a, b) => a.f - b.f);
          const current = open.shift(), p = new Vec33(current.x * step, 0, current.z * step);
          if (p.distance(end) < 0.4 && this.line(p, end)) {
            finish = current;
            break;
          }
          for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
            const x = current.x + dx, z = current.z + dz, v = new Vec33(x * step, 0, z * step), g = current.g + Math.hypot(dx, dz), k = key(x, z);
            if (g >= (cost.get(k) ?? Infinity) || !this.free(v.x, v.z) || !this.line(p, v)) continue;
            cost.set(k, g);
            open.push({ x, z, g, f: g + v.distance(end) / step, parent: current });
          }
        }
        if (!finish) return [];
        const path = [end.clone()];
        while (finish) {
          path.unshift(new Vec33(finish.x * step, 0, finish.z * step));
          finish = finish.parent;
        }
        path.unshift(start.clone());
        const result = [];
        for (let i = 0; i < path.length - 1; ) {
          let j = path.length - 1;
          while (j > i + 1 && !this.line(path[i], path[j])) j--;
          result.push(path[j]);
          i = j;
        }
        return result;
      }
    };
  }
});

// src/game/DogRoaming.ts
import { Vec3 as Vec34 } from "playcanvas";
var DogRoaming;
var init_DogRoaming = __esm({
  "src/game/DogRoaming.ts"() {
    "use strict";
    init_HousePath();
    DogRoaming = class {
      constructor(house, root, daily) {
        this.root = root;
        this.daily = daily;
        this.path = new HousePath(house, 0.19);
      }
      root;
      daily;
      path;
      route = [];
      wait = 4;
      blocked = 0;
      last = -1;
      spots = [[4.7, 6], [3.3, 5.8], [1.2, 7.8], [0.6, 10.8], [1.6, 11.8], [4.7, 11.6], [1.1, 4.6]];
      state = "roaming";
      bowlWait = 20 + Math.random() * 20;
      meals = 0;
      update(dt, active, people) {
        if (!active) {
          this.route = [];
          this.wait = 3;
          this.state = "roaming";
          return;
        }
        this.bowlWait -= dt;
        if (this.state === "eating") {
          this.wait -= dt;
          if (this.wait <= 0) {
            this.daily.consumeDogFood();
            this.meals++;
            this.state = "roaming";
            this.wait = 5;
            this.bowlWait = 40 + Math.random() * 30;
          }
          return;
        }
        if (this.wait > 0) {
          this.wait -= dt;
          return;
        }
        const p = this.root.getPosition();
        if (this.state === "roaming" && this.bowlWait <= 0 && this.daily.hasDogFood) {
          const bowl = this.daily.bowlPosition;
          for (const [dx, dz] of [[0, 0.5], [-0.5, 0], [0, -0.5], [0.5, 0]]) {
            const goal = new Vec34(bowl.x + dx, 0, bowl.z + dz);
            if (!this.path.free(goal.x, goal.z)) continue;
            const route = this.path.route(new Vec34(p.x, 0, p.z), goal);
            if (route.length) {
              this.route = route;
              this.state = "to-bowl";
              break;
            }
          }
          this.bowlWait = 20;
        }
        if (!this.route.length && this.state === "to-bowl") {
          const bowl = this.daily.bowlPosition;
          if (Math.hypot(p.x - bowl.x, p.z - bowl.z) < 0.75) {
            this.state = "eating";
            this.wait = 3 + Math.random() * 2;
            this.root.setEulerAngles(0, Math.atan2(bowl.x - p.x, bowl.z - p.z) * 180 / Math.PI, 0);
            return;
          }
          this.state = "roaming";
        }
        if (!this.route.length) {
          const candidates = this.spots.map((s, i) => ({ i, p: new Vec34(s[0], 0, s[1]) })).filter((s) => s.i !== this.last && this.path.free(s.p.x, s.p.z) && s.p.distance(p) > 1);
          const choice = candidates[Math.floor(Math.random() * candidates.length)];
          if (choice) {
            this.route = this.path.route(new Vec34(p.x, 0, p.z), choice.p);
            this.last = choice.i;
          }
          if (!this.route.length) this.wait = 3;
          return;
        }
        const next = this.route[0], delta = new Vec34(next.x - p.x, 0, next.z - p.z), distance = delta.length();
        if (distance < 0.015) {
          this.route.shift();
          if (!this.route.length && this.state === "roaming") this.wait = 4 + Math.random() * 6;
          return;
        }
        delta.normalize();
        const q = p.clone().add(delta.clone().mulScalar(Math.min(distance, dt * 0.3)));
        if (people.some((person) => Math.hypot(person.x - q.x, person.z - q.z) < 0.48) || !this.path.free(q.x, q.z)) {
          this.blocked += dt;
          if (this.blocked > 2) {
            this.route = [];
            this.state = "roaming";
            this.wait = 2;
            this.blocked = 0;
          }
          return;
        }
        this.blocked = 0;
        this.root.setPosition(q.x, 0.04, q.z);
        this.root.setEulerAngles(0, Math.atan2(delta.x, delta.z) * 180 / Math.PI, 0);
      }
      snapshot() {
        return { state: this.state, meals: this.meals, food: this.daily.hasDogFood, route: this.route.map((p) => p.toArray()) };
      }
    };
  }
});

// src/ui/HouseMusic.ts
var tracks, HouseMusic;
var init_HouseMusic = __esm({
  "src/ui/HouseMusic.ts"() {
    "use strict";
    init_AudioSettings();
    init_SaveNamespace();
    init_AssetUrls();
    tracks = {
      home: { file: "Squishy home clean.mp3", name: "Home \xB7 morning & night" },
      chores: { file: "Squishy Home clean v2.mp3", name: "Home \xB7 after-school chores" },
      school: { file: "Squishy school trading.mp3", name: "School trading" },
      shop: { file: "Squishy shopping.mp3", name: "Shopping \xB7 1" },
      shop2: { file: "Squishy shopping v2.mp3", name: "Shopping \xB7 2" }
    };
    HouseMusic = class {
      audio = new Audio();
      unlocked = false;
      wanted = false;
      muted = false;
      button = document.createElement("button");
      abort = new AbortController();
      current = "home";
      desired = "home";
      lastStore = "";
      secondStore = false;
      gap = 0;
      pending = false;
      constructor() {
        try {
          this.muted = localStorage.getItem(saveKey("house-music.muted")) === "true";
        } catch {
        }
        this.audio.volume = 0;
        this.audio.preload = "none";
        this.audio.src = this.url(this.current);
        this.audio.addEventListener("ended", () => {
          this.gap = 5;
          this.audio.volume = 0;
        }, { signal: this.abort.signal });
        this.button.id = "house-music";
        this.button.type = "button";
        this.paint();
        document.querySelector("footer").prepend(this.button);
        this.button.onclick = () => {
          this.muted = !this.muted;
          try {
            localStorage.setItem(saveKey("house-music.muted"), String(this.muted));
          } catch {
          }
          this.paint();
          this.sync();
        };
        const unlock = () => {
          this.unlocked = true;
          this.sync();
        };
        document.addEventListener("pointerdown", unlock, { signal: this.abort.signal });
        document.addEventListener("keydown", unlock, { signal: this.abort.signal });
        document.addEventListener("visibilitychange", () => this.sync(), { signal: this.abort.signal });
      }
      url(track) {
        return assetUrl(`${"/"}assets/audio/${encodeURIComponent(tracks[track].file)}`);
      }
      paint() {
        this.button.textContent = this.muted ? "\u266B Off" : "\u266B Music";
        this.button.title = tracks[this.desired].name + " \xB7 tap to " + (this.muted ? "play" : "mute");
        this.button.setAttribute("aria-label", this.muted ? "Turn music on" : "Mute music");
        this.button.setAttribute("aria-pressed", String(!this.muted));
      }
      sync() {
        if (this.wanted && this.unlocked && !this.muted && !document.hidden && !this.gap) {
          if (this.audio.paused && !this.pending) {
            this.pending = true;
            void this.audio.play().catch(() => {
            }).finally(() => {
              this.pending = false;
            });
          }
        } else {
          this.audio.pause();
          this.audio.volume = 0;
        }
      }
      switchTrack() {
        this.current = this.desired;
        this.audio.pause();
        this.audio.src = this.url(this.current);
        this.audio.volume = 0;
        this.gap = 0;
        this.sync();
      }
      update(scene, dt = 0) {
        if (scene.mode === "store" && scene.store !== this.lastStore) {
          if (this.lastStore) this.secondStore = !this.secondStore;
          this.lastStore = scene.store;
        }
        const choice = scene.mode === "store" ? this.secondStore ? "shop2" : "shop" : scene.mode === "recess" ? "school" : scene.phase === "afternoon" ? "chores" : "home";
        if (this.desired !== choice) {
          this.desired = choice;
          this.paint();
        }
        this.wanted = !scene.paused;
        if (!this.wanted || this.muted || document.hidden) {
          this.sync();
          return;
        }
        const step = Math.min(0.1, Math.max(0, dt));
        if (this.current !== this.desired) {
          this.audio.volume = Math.max(0, this.audio.volume - step * 0.45);
          if (this.audio.volume <= 1e-3 || this.audio.paused) this.switchTrack();
          return;
        }
        if (this.gap) {
          this.gap = Math.max(0, this.gap - step);
          if (!this.gap) {
            this.audio.currentTime = 0;
            this.sync();
          }
          return;
        }
        this.sync();
        if (!this.audio.paused) {
          const left = this.audio.duration - this.audio.currentTime, level = (scene.revealing ? 0.081 : 0.252) * audioLevel("music");
          const target = Number.isFinite(left) ? Math.min(level, Math.max(0, left / 3) * level) : level;
          this.audio.volume = Math.max(0, Math.min(1, this.audio.volume + Math.max(-step * 0.45, Math.min(step * 0.14, target - this.audio.volume))));
        }
      }
      snapshot() {
        return { playing: !this.audio.paused, muted: this.muted, track: tracks[this.current].name, requested: tracks[this.desired].name, source: decodeURIComponent(this.audio.src), position: this.audio.currentTime, volume: this.audio.volume, gap: this.gap, duration: this.audio.duration, error: this.audio.error?.message ?? null };
      }
      destroy() {
        this.abort.abort();
        this.audio.pause();
        this.audio.removeAttribute("src");
        this.audio.load();
        this.button.remove();
      }
    };
  }
});

// src/game/AnimalSquishy.ts
import { Color, Texture } from "playcanvas";
function catMask(app, data) {
  let cache = catMasks.get(app);
  if (!cache) {
    cache = /* @__PURE__ */ new Map();
    catMasks.set(app, cache);
  }
  const key = data.color + data.accent;
  let result = cache.get(key);
  if (result) return result;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d"), pixels = ctx.createImageData(512, 512);
  const linear = (v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  const srgb = (v) => v <= 31308e-7 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  const base = new Color().fromString(data.color), accent = new Color().fromString(data.accent);
  const colors = data.id === "nebula-dragon" ? ["#e7b386", "#cba57f", "#c68777", "#aa8074"] : ["#c9b5dc", "#bba4ce", "#ac91bd", "#9780ac"];
  const ratios = colors.map((hex) => {
    const c = new Color().fromString(hex);
    return [c.r, c.g, c.b].map((v, i) => linear(v) / linear([base.r, base.g, base.b][i]));
  });
  for (let row = 0; row < 512; row++) for (let col = 0; col < 512; col++) {
    const x = col / 512 * 1.5 - 0.75, y = (1 - row / 512) * 1.4;
    const distance = Math.min(...[-1, 1].map((s) => ((x - s * 0.36) / 0.23) ** 2 + ((y - 0.87) / 0.25) ** 2));
    const a = Math.max(0, Math.min(1, (1.02 - distance) / 0.04));
    const t = Math.max(0, Math.min(1, (y - 0.76) / 0.2)), blend = t * t * (3 - 2 * t), side = x < 0 ? 0 : 1;
    const offset = (row * 512 + col) * 4;
    for (let c = 0; c < 3; c++) {
      const ratio = ratios[side][c] * (1 - blend) + ratios[side + 2][c] * blend;
      pixels.data[offset + c] = Math.round(255 * srgb(1 - a * (1 - ratio)));
    }
    pixels.data[offset + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  result = new Texture(app.graphicsDevice, { name: "Seamless kitten cap mask", width: 512, height: 512, mipmaps: true, flipY: false });
  result.setSource(canvas);
  cache.set(key, result);
  return result;
}
function animalModel(app, resource, data) {
  const model = resource.instantiateRenderEntity({ castShadows: true });
  const materials = /* @__PURE__ */ new Map();
  for (const renderer of model.findComponents("render")) for (const mesh of renderer.meshInstances) {
    const original = mesh.material;
    if (!materials.has(original)) {
      const mat = original.clone();
      mat.diffuseMap = null;
      mat.normalMap = null;
      mat.glossMap = null;
      mat.diffuseVertexColor = false;
      mat.aoVertexColor = true;
      mat.aoVertexColorChannel = "r";
      mat.aoIntensity = 0.78;
      mat.occludeDirect = false;
      mat.glossInvert = true;
      mat.metalness = 0;
      mat.gloss = 0.48;
      mat.specularityFactor = 0.4;
      mat.clearCoat = 0.035;
      mat.clearCoatGloss = 0.55;
      if (original.name.startsWith("Dough tint")) {
        mat.diffuse = new Color().fromString(data.color);
        if (data.special === "cat") mat.diffuseMap = catMask(app, data);
      }
      if (original.name.startsWith("Animal accent")) {
        mat.diffuse = new Color().fromString(data.accent);
        mat.gloss = 0.58;
        mat.specularityFactor = 0.32;
        mat.clearCoat = 0.015;
      }
      if (original.name.startsWith("Animal eyes")) {
        mat.gloss = 0.18;
        mat.specularityFactor = 0.75;
        mat.diffuse = new Color().fromString("#392a2e");
      }
      if (original.name.startsWith("Animal ink")) {
        mat.gloss = 0.45;
        mat.diffuse = new Color().fromString("#463039");
      }
      if (original.name.startsWith("Animal blush")) {
        mat.gloss = 0.6;
        mat.clearCoat = 0;
        mat.diffuse = new Color().fromString("#f2a0ab");
      }
      mat.update();
      materials.set(original, mat);
    }
    mesh.material = materials.get(original);
  }
  model.on("destroy", () => {
    for (const mat of materials.values()) mat.destroy();
  });
  return model;
}
var catMasks;
var init_AnimalSquishy = __esm({
  "src/game/AnimalSquishy.ts"() {
    "use strict";
    catMasks = /* @__PURE__ */ new WeakMap();
  }
});

// src/data/squishyPresentation.ts
var SQUISHY_PRESENTATION, REVEAL_POP_TIME, REVEAL_SETTLE_TIME, revealDuration;
var init_squishyPresentation = __esm({
  "src/data/squishyPresentation.ts"() {
    "use strict";
    SQUISHY_PRESENTATION = {
      Common: { color: "#dacbdf", spark: "#ab92b7", ink: "#665070", wash: "#f4edf5", symbol: "\u2661", roughness: 0.52, coat: 0.06, accentCoat: 0.12, sparkles: 0, rays: 0, halo: 0.08, burst: 0.16, rim: 0, punch: 0, intensity: 0.85, hold: 0.3, notes: [659.25, 783.99] },
      Rare: { color: "#81c8ff", spark: "#479fed", ink: "#225784", wash: "#e4f3ff", symbol: "\u2727", roughness: 0.5, coat: 0.28, accentCoat: 0.2, sparkles: 10, rays: 0, halo: 0.13, burst: 0.32, rim: 0.1, punch: 8e-3, intensity: 1, hold: 0.5, notes: [659.25, 830.61, 987.77] },
      Epic: { color: "#c19af6", spark: "#a36ed6", ink: "#674091", wash: "#f0e6ff", symbol: "\u2726", roughness: 0.49, coat: 0.65, accentCoat: 0.3, sparkles: 18, rays: 0, halo: 0.32, burst: 0.43, rim: 0.4, punch: 0.013, intensity: 1.15, hold: 0.7, notes: [659.25, 830.61, 987.77, 1318.51] },
      Legendary: { color: "#f6cd68", spark: "#dea52e", ink: "#775215", wash: "#fff3cb", symbol: "\u2739", roughness: 0.48, coat: 0.9, accentCoat: 0.4, sparkles: 28, rays: 12, halo: 0.48, burst: 0.55, rim: 0.7, punch: 0.018, intensity: 1.3, hold: 0.95, notes: [523.25, 659.25, 783.99, 1046.5, 1318.51] }
    };
    REVEAL_POP_TIME = 0.98;
    REVEAL_SETTLE_TIME = 2.85;
    revealDuration = (rarity) => REVEAL_SETTLE_TIME + SQUISHY_PRESENTATION[rarity].hold;
  }
});

// src/game/SquishyArt.ts
import { Asset, Color as Color2 } from "playcanvas";
async function loadSquishyArt(app) {
  const load = (name) => new Promise((resolve, reject) => {
    const asset = new Asset(name, "container", { url: assetUrl(`${"/"}assets/squishies/${name}.glb`) });
    asset.once("load", () => resolve(asset.resource));
    asset.once("error", reject);
    app.assets.add(asset);
    app.assets.load(asset);
  });
  const texture = (name) => new Promise((resolve, reject) => {
    const asset = new Asset(name, "texture", { url: assetUrl(`${"/"}assets/squishies/materials/${name}.png`) });
    asset.once("load", () => resolve(asset.resource));
    asset.once("error", reject);
    app.assets.add(asset);
    app.assets.load(asset);
  });
  const [bao, steamer, shelf, color, surface, panda, frog, bunny, cat] = await Promise.all([load("bao-squishy"), load("bamboo-steamer"), load("bamboo-steamer-shelf"), texture("satin-color"), texture("satin-surface"), load("animal-panda"), load("animal-frog"), load("animal-bunny"), load("animal-cat")]);
  loaded.set(app, { bao, steamer, shelf, color, surface, animals: { panda, frog, bunny, cat } });
}
function squishyModel(app, data) {
  if (data.special) return animalModel(app, loaded.get(app).animals[data.special], data);
  const model = loaded.get(app).bao.instantiateRenderEntity({ castShadows: true });
  for (const name of ["leaf", "bow", "star", "crown"]) model.findByName("Accessory_" + name).enabled = data.accessory === name;
  for (const side of ["L", "R"]) {
    const closed = data.face === "sleepy" || data.face === "wink" && side === "R";
    model.findByName("EyeOpen" + side).enabled = !closed;
    model.findByName("EyeClosed" + side).enabled = closed;
  }
  const materials = /* @__PURE__ */ new Map();
  const finish = SQUISHY_PRESENTATION[data.rarity], maps = loaded.get(app);
  for (const renderer of model.findComponents("render")) for (const mesh of renderer.meshInstances) {
    const original = mesh.material;
    if (!materials.has(original)) {
      const mat = original.clone();
      mat.glossInvert = true;
      mat.metalness = 0;
      if (original.name === "Dough tint") {
        mat.diffuse = new Color2().fromString(data.color);
        mat.diffuseMap = maps.color;
        mat.opacityMap = null;
        mat.normalMap = maps.surface;
        mat.bumpiness = 0.24;
        mat.glossMap = maps.surface;
        mat.glossMapChannel = "a";
        mat.gloss = finish.roughness;
        mat.specularityFactor = 0.65;
        mat.clearCoat = finish.coat;
        mat.clearCoatGloss = 0.65;
      } else if (original.name === "Accessory tint") {
        mat.diffuse = new Color2().fromString(data.accent);
        mat.gloss = 0.38;
        mat.clearCoat = finish.accentCoat;
        mat.clearCoatGloss = 0.72;
        mat.specularityFactor = 0.8;
      } else if (original.name === "Glossy chocolate eyes") {
        mat.gloss = 0.23;
        mat.specularityFactor = 0.8;
      } else if (original.name === "Warm iris rim") {
        mat.gloss = 0.32;
        mat.specularityFactor = 0.65;
      } else if (original.name === "Cocoa smile" || original.name === "Strawberry cheek marks") {
        mat.gloss = 0.55;
        mat.specularityFactor = 0.35;
      }
      mat.update();
      materials.set(original, mat);
    }
    mesh.material = materials.get(original);
  }
  model.on("destroy", () => {
    for (const mat of materials.values()) mat.destroy();
  });
  return model;
}
function steamerModel(app, small = false) {
  return loaded.get(app)[small ? "shelf" : "steamer"].instantiateRenderEntity({ castShadows: true });
}
function animateSquishy(model, time, strength = 0.012) {
  const y = 1 + Math.sin(time * 2.4) * strength, x = 1 / Math.sqrt(y);
  model.setLocalScale(x, y, x);
}
var loaded;
var init_SquishyArt = __esm({
  "src/game/SquishyArt.ts"() {
    "use strict";
    init_AnimalSquishy();
    init_AssetUrls();
    init_squishyPresentation();
    loaded = /* @__PURE__ */ new WeakMap();
  }
});

// src/data/house.ts
var HOUSE_ROOMS, HOUSE_DOORS, HOUSE_TASKS, EXTRA_HOUSE_TASKS;
var init_house = __esm({
  "src/data/house.ts"() {
    "use strict";
    HOUSE_ROOMS = [
      { id: "bedroom", name: "Bedroom", title: "A little room of her own.", minX: -3.3, maxX: 3.3, minZ: -3.6, maxZ: 3.6 },
      { id: "hall", name: "Landing", title: "Little everyday arrivals.", minX: 3.3, maxX: 6.5, minZ: 0.4, maxZ: 3.6 },
      { id: "bathroom", name: "Bathroom", title: "Freshen up.", minX: 3.3, maxX: 6.5, minZ: -3.6, maxZ: 0.4 },
      { id: "living", name: "Living room", title: "Make yourself at home.", minX: -3.3, maxX: 6.5, minZ: 3.6, maxZ: 9.5 },
      { id: "kitchen", name: "Kitchen & dining", title: "Something good cooking.", minX: -3.3, maxX: 2.6, minZ: 9.5, maxZ: 16.3 },
      { id: "laundry", name: "Utility room", title: "Fresh little folds.", minX: 2.6, maxX: 6.5, minZ: 9.5, maxZ: 13.2 },
      { id: "nursery", name: "Lilah\u2019s room", title: "Little dreams, big adventures.", minX: 6.5, maxX: 11, minZ: -3.6, maxZ: 3.6 },
      { id: "marc-bedroom", name: "Marc\u2019s room", title: "Dad\u2019s little quiet corner.", minX: 6.5, maxX: 11, minZ: 3.6, maxZ: 13.2 }
    ];
    HOUSE_DOORS = [
      { id: "bedroom-hall", a: "bedroom", b: "hall", x: 3.3, z: 2.7, axis: "z", width: 1.35 },
      { id: "bedroom-living", a: "bedroom", b: "living", x: 0.25, z: 3.6, axis: "x", width: 1.8 },
      { id: "hall-living", a: "hall", b: "living", x: 4.8, z: 3.6, axis: "x", width: 1.7 },
      { id: "hall-bathroom", a: "hall", b: "bathroom", x: 4.8, z: 0.4, axis: "x", width: 1.45 },
      { id: "living-kitchen", a: "living", b: "kitchen", x: 0.25, z: 9.5, axis: "x", width: 2.1 },
      { id: "living-laundry", a: "living", b: "laundry", x: 4.8, z: 9.5, axis: "x", width: 1.7 },
      { id: "kitchen-laundry", a: "kitchen", b: "laundry", x: 2.6, z: 11.5, axis: "z", width: 1.5 },
      { id: "landing-nursery", a: "hall", b: "nursery", x: 6.5, z: 2.05, axis: "z", width: 1.5 },
      { id: "living-marc", a: "living", b: "marc-bedroom", x: 6.5, z: 6.1, axis: "z", width: 1.6 },
      { id: "nursery-marc", a: "nursery", b: "marc-bedroom", x: 7.7, z: 3.6, axis: "x", width: 1.45 }
    ];
    HOUSE_TASKS = [
      { id: "book", name: "Book", icon: "\u{1F4D8}", room: "Bedroom" },
      { id: "living-toy", name: "Toy", icon: "\u{1F9F8}", room: "Living room" },
      { id: "kitchen-dish", name: "Dish", icon: "\u{1F37D}", room: "Kitchen" },
      { id: "kitchen-trash", name: "Trash", icon: "\u267B", room: "Kitchen" },
      { id: "laundry-clothes", name: "Laundry", icon: "\u{1F455}", room: "Laundry room" },
      { id: "bath-towel", name: "Towel", icon: "\u25A4", room: "Bathroom" }
    ];
    EXTRA_HOUSE_TASKS = [
      { id: "hall-shoes", name: "Shoes", icon: "\u{1F45F}", room: "Hall" },
      { id: "hall-mail", name: "Mail", icon: "\u2709", room: "Hall" },
      { id: "living-cushion", name: "Cushion", icon: "\u2661", room: "Living room" },
      { id: "laundry-clean", name: "Folded clothes", icon: "\u25A4", room: "Laundry room" },
      { id: "bath-bottle", name: "Toiletries", icon: "\u2667", room: "Bathroom" }
    ];
  }
});

// src/game/primitives.ts
import { Color as Color3, Entity as Entity3, StandardMaterial as StandardMaterial2 } from "playcanvas";
function material(name, hex) {
  const mat = new StandardMaterial2();
  mat.name = name;
  mat.diffuse = new Color3().fromString(hex);
  mat.gloss = 0.15;
  mat.specular.set(0.08, 0.07, 0.09);
  mat.update();
  return mat;
}
function primitives(app, parent, batchGroupId = -1) {
  return (name, shape, position, scale, mat, shadows = true) => {
    const entity = new Entity3(name, app);
    entity.addComponent("render", { type: shape, material: mat, castShadows: shadows, receiveShadows: true, batchGroupId });
    entity.setLocalPosition(...position);
    entity.setLocalScale(...scale);
    parent.addChild(entity);
    recordLayout(entity, parent);
    return entity;
  };
}
var init_primitives = __esm({
  "src/game/primitives.ts"() {
    "use strict";
    init_LayoutBridge();
  }
});

// src/game/bedroom.ts
import { BoundingBox as BoundingBox2, Entity as Entity4, Vec3 as Vec35 } from "playcanvas";
function createBedroom(app) {
  const root = new Entity4("Bedroom", app);
  app.root.addChild(root);
  const group = app.batcher.addGroup("Static bedroom", false, 30);
  const shape = primitives(app, root, group.id);
  const m = {
    wall: material("Warm blush plaster", "#eed1d2"),
    sideWall: material("Lilac plaster", "#d4c7e4"),
    trim: material("Ivory trim", "#fff1df"),
    wood: material("Honey birch", "#d4a778"),
    floor: material("Light oak", "#e3bd91"),
    seam: material("Floor seams", "#d5ae86"),
    pink: material("Rose", "#e99db9"),
    pinkLight: material("Petal pink", "#f6c8d7"),
    purple: material("Soft lavender", "#b39ad7"),
    rug: material("Lilac rug", "#c1abd9"),
    petals: material("Rug daisies", "#decee9"),
    yellow: material("Butter yellow", "#f3d68f"),
    mint: material("Soft sage", "#96baa1"),
    green: material("Leaf green", "#709975"),
    blue: material("Powder blue", "#9cbed5"),
    dark: material("Dark details", "#76647e"),
    sky: material("Window sky", "#c4e4ea"),
    lamp: material("Bedside lamp shade", "#f3d68f")
  };
  const obstacles = [];
  const block = (x, z, w, d) => obstacles.push(new BoundingBox2(new Vec35(x, 0.7, z), new Vec35(w / 2, 1.4, d / 2)));
  shape("Room foundation", "box", [0, -0.22, 0], [6.8, 0.4, 7.4], m.purple);
  shape("Oak floor", "box", [0, -0.025, 0], [6.6, 0.1, 7.2], m.floor);
  for (let z = -3.3; z < 3.5; z += 0.45) shape("Plank joint", "box", [0, 0.03, z], [6.6, 4e-3, 0.012], m.seam, false);
  for (let i = 0; i < 15; i++) {
    const z = -3.375 + i * 0.45;
    for (let x = -2.8 + i % 3 * 0.75; x < 3.3; x += 2.25) shape("Staggered plank end", "box", [x, 0.031, z], [0.012, 3e-3, 0.44], m.seam, false);
  }
  shape("Back wall", "box", [0, 1.4, -3.65], [6.8, 2.8, 0.15], m.wall);
  shape("Left wall", "box", [-3.35, 1.4, 0], [0.15, 2.8, 7.3], m.sideWall);
  shape("Back skirting", "box", [0, 0.16, -3.53], [6.6, 0.23, 0.09], m.trim);
  shape("Left skirting", "box", [-3.23, 0.16, 0], [0.09, 0.23, 7.1], m.trim);
  shape("Back wall cap", "box", [0, 2.83, -3.65], [6.87, 0.09, 0.23], m.trim);
  shape("Left wall cap", "box", [-3.35, 2.83, 0], [0.23, 0.09, 7.4], m.trim);
  shape("Window frame", "box", [-3.22, 1.86, -0.8], [0.16, 1.62, 2.12], m.trim);
  shape("Window glass", "box", [-3.12, 1.86, -0.8], [0.018, 1.42, 1.92], m.sky, false);
  shape("Window crossbar", "box", [-3.09, 1.86, -0.8], [0.04, 0.055, 1.97], m.trim);
  shape("Window mullion", "box", [-3.09, 1.86, -0.8], [0.04, 1.44, 0.065], m.trim);
  shape("Window sill", "box", [-3.08, 1.06, -0.8], [0.42, 0.09, 2.3], m.trim);
  for (const z of [-2, 0.4]) {
    shape("Curtain", "box", [-3.04, 1.83, z], [0.14, 1.87, 0.38], m.pink);
    shape("Curtain tie", "box", [-2.94, 1.38, z], [0.045, 0.1, 0.4], m.pinkLight);
  }
  block(-2.05, -1.7, 1.76, 2.95);
  shape("Bed frame", "box", [-2.05, 0.42, -1.7], [1.65, 0.28, 2.85], m.trim);
  for (const x of [-2.77, -1.33]) for (const z of [-3.03, -0.37]) shape("Bed leg", "box", [x, 0.24, z], [0.13, 0.45, 0.13], m.trim);
  shape("Headboard", "box", [-2.05, 0.92, -3.03], [1.75, 1.3, 0.13], m.trim);
  shape("Headboard inset", "box", [-2.05, 1.03, -2.94], [1.47, 0.55, 0.055], m.pinkLight);
  shape("Mattress", "box", [-2.05, 0.64, -1.65], [1.55, 0.23, 2.65], m.trim);
  shape("Pink duvet", "box", [-2.05, 0.79, -1.16], [1.59, 0.19, 1.7], m.pink);
  shape("Folded lavender blanket", "box", [-2.05, 0.895, -0.73], [1.62, 0.035, 0.47], m.purple);
  const pillow = shape("Pillow", "sphere", [-2.05, 0.88, -2.5], [1.12, 0.24, 0.58], m.pinkLight);
  pillow.setEulerAngles(0, -5, 0);
  shape("Pillow button", "sphere", [-2.05, 1.015, -2.48], [0.19, 0.035, 0.19], m.pink, false);
  shape("Round rug", "cylinder", [0, 0.055, 0.7], [3.65, 0.025, 3.65], m.rug, false);
  for (const [x, z] of [[-0.8, 0.2], [0.65, 0.1], [-0.65, 1.55], [0.8, 1.35]]) {
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      const petal = shape("Daisy petal", "sphere", [x + Math.sin(a) * 0.2, 0.078, z + Math.cos(a) * 0.2], [0.27, 9e-3, 0.42], m.petals, false);
      petal.setEulerAngles(0, a * 180 / Math.PI, 0);
    }
    shape("Daisy center", "cylinder", [x, 0.084, z], [0.19, 5e-3, 0.19], m.yellow, false);
  }
  block(1.12, -3.05, 1.65, 0.73);
  shape("Shelf back", "box", [1.12, 0.99, -3.31], [1.6, 1.9, 0.1], m.wood);
  for (const x of [0.32, 1.92]) shape("Shelf side", "box", [x, 1.02, -3.04], [0.12, 1.97, 0.65], m.trim);
  for (const y of [0.15, 0.73, 1.31, 1.97]) shape("Shelf board", "box", [1.12, y, -3.02], [1.76, 0.1, 0.75], m.trim);
  [m.purple, m.pink, m.blue, m.mint, m.yellow].forEach((mat, i) => shape("Book", "box", [0.54 + i * 0.235, 1.56, -3.03], [0.17, 0.41 + i % 2 * 0.11, 0.38], mat));
  shape("Storage basket", "box", [1.14, 0.43, -3.02], [1.2, 0.44, 0.52], m.pink);
  shape("Basket label", "box", [1.14, 0.44, -2.75], [0.29, 0.13, 0.018], m.pinkLight);
  for (let i = 0; i < 3; i++) shape("Stacked book", "box", [0.81, 0.83 + i * 0.09, -2.99], [0.65 - i * 0.05, 0.075, 0.4], [m.blue, m.yellow, m.purple][i]);
  block(-0.53, -2.8, 0.83, 0.75);
  shape("Nightstand", "box", [-0.53, 0.44, -2.83], [0.75, 0.78, 0.68], m.trim);
  shape("Drawer", "box", [-0.53, 0.61, -2.475], [0.64, 0.23, 0.027], m.pinkLight);
  shape("Drawer pull", "sphere", [-0.53, 0.61, -2.435], [0.07, 0.07, 0.07], m.wood);
  shape("Lamp base", "cylinder", [-0.53, 0.88, -2.83], [0.32, 0.06, 0.32], m.yellow);
  shape("Lamp stem", "cylinder", [-0.53, 1.09, -2.83], [0.05, 0.41, 0.05], m.wood);
  shape("Lamp shade", "cone", [-0.53, 1.39, -2.83], [0.53, 0.49, 0.53], m.lamp);
  block(2.48, -1.55, 1.15, 1.36);
  shape("Toy chest", "box", [2.48, 0.4, -1.55], [1.08, 0.7, 1.22], m.wood);
  shape("Toy chest lid", "box", [2.48, 0.78, -1.55], [1.16, 0.1, 1.32], m.yellow);
  shape("Chest label", "box", [2.48, 0.46, -0.927], [0.52, 0.21, 0.015], m.trim);
  block(2.33, 1.24, 1.54, 1.05);
  shape("Desk top", "box", [2.33, 1.05, 1.24], [1.55, 0.13, 1.03], m.trim);
  for (const x of [1.72, 2.94]) for (const z of [0.87, 1.63]) shape("Desk leg", "box", [x, 0.53, z], [0.1, 1, 0.1], m.wood);
  shape("Notebook", "box", [2.32, 1.145, 1.31], [0.5, 0.05, 0.62], m.pink);
  shape("Notebook pages", "box", [2.32, 1.178, 1.31], [0.44, 0.015, 0.56], m.trim);
  block(2.05, 2.15, 0.69, 0.69);
  shape("Stool cushion", "cylinder", [2.05, 0.56, 2.15], [0.66, 0.17, 0.66], m.pink);
  for (const x of [1.84, 2.26]) for (const z of [1.94, 2.36]) shape("Stool leg", "box", [x, 0.27, z], [0.07, 0.49, 0.07], m.wood);
  function plant(x, y, z, scale = 1) {
    shape("Plant pot", "cylinder", [x, y + 0.18 * scale, z], [0.4 * scale, 0.36 * scale, 0.4 * scale], m.trim);
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      const leaf = shape("Plant leaf", "sphere", [x + Math.sin(a) * 0.16 * scale, y + 0.51 * scale, z + Math.cos(a) * 0.16 * scale], [0.2 * scale, 0.56 * scale, 0.15 * scale], i % 2 ? m.green : m.mint);
      leaf.setEulerAngles(Math.cos(a) * 30, 0, Math.sin(a) * -30);
    }
  }
  plant(1.62, 2.03, -3.04, 0.7);
  plant(2.69, 1.12, 1.02, 0.55);
  plant(-2.66, 0.03, 2.45, 1.25);
  block(-2.66, 2.45, 0.6, 0.6);
  shape("Picture frame", "box", [-1, 2.03, -3.52], [0.89, 1.07, 0.08], m.wood);
  shape("Picture paper", "box", [-1, 2.03, -3.47], [0.75, 0.93, 0.018], m.trim);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    shape("Picture petal", "sphere", [-1 + Math.sin(a) * 0.16, 2.08 + Math.cos(a) * 0.16, -3.445], [0.2, 0.2, 0.016], m.pink, false);
  }
  shape("Picture center", "sphere", [-1, 2.08, -3.425], [0.17, 0.17, 0.015], m.yellow, false);
  shape("Picture caption", "box", [-1, 1.72, -3.435], [0.3, 0.025, 0.01], m.purple, false);
  app.batcher.generate([group.id]);
  return { root, obstacles, halfWidth: 3.3, halfDepth: 3.6, materials: m };
}
var init_bedroom = __esm({
  "src/game/bedroom.ts"() {
    "use strict";
    init_primitives();
  }
});

// src/game/HouseArt.ts
import { Asset as Asset2, BoundingBox as BoundingBox3, Color as Color4, Entity as Entity5 } from "playcanvas";
var PALETTE, HouseArt;
var init_HouseArt = __esm({
  "src/game/HouseArt.ts"() {
    "use strict";
    init_AssetUrls();
    init_LayoutBridge();
    PALETTE = {
      wood: "#c9a078",
      woodDark: "#987453",
      woodBark: "#987653",
      carpet: "#afc3af",
      carpetDarker: "#879f8e",
      carpetBlue: "#a8b8d4",
      carpetWhite: "#efe7dc",
      metal: "#eee9df",
      metalLight: "#fff6e7",
      metalDark: "#55535e",
      metalMedium: "#aaa99e",
      plant: "#789c67",
      leafsGreen: "#77965c",
      grass: "#88a66c",
      dirt: "#9d8162",
      glass: "#aac7ca",
      lamp: "#ffe7b3",
      fur: "#be9a75",
      colorPurple: "#b69bc9",
      colorYellow: "#eed587"
    };
    HouseArt = class {
      constructor(app, root, surfaces) {
        this.app = app;
        this.root = root;
        this.surfaces = surfaces;
        this.group = app.batcher.addGroup("Cottage imported art", false, 12);
      }
      app;
      root;
      surfaces;
      assets = /* @__PURE__ */ new Map();
      materials = /* @__PURE__ */ new Map();
      pending = [];
      group;
      loaded = 0;
      errors = [];
      lampMaterials = [];
      add(pack, name, position, size, yaw = 0, dimension = "height", colors = {}, exterior = pack === "nature", pitch = 0, finish = "natural") {
        const key = `${pack}/${name}`;
        if (!this.assets.has(key)) this.assets.set(key, new Promise((resolve, reject) => {
          const path = `${"/"}assets/environment/${pack === "nursery" || pack === "school" ? "" : "kenney/"}${key}.glb`;
          const asset = new Asset2(key, "container", { url: assetUrl(path) }, {}, containerOptions(path));
          asset.once("load", () => resolve(asset.resource));
          asset.once("error", reject);
          this.app.assets.add(asset);
          this.app.assets.load(asset);
        }));
        const task = this.assets.get(key).then((resource) => {
          const model = resource.instantiateRenderEntity({ castShadows: true });
          const renderers = model.findComponents("render");
          const bounds = new BoundingBox3();
          let first = true;
          for (const render of renderers) for (const mesh of render.meshInstances) {
            if (first) {
              bounds.copy(mesh.aabb);
              first = false;
            } else bounds.add(mesh.aabb);
            const original = mesh.material, color = colors[original.name] ?? PALETTE[original.name];
            const paletteKey = `${pack}/${original.name}/${color ?? "original"}/${finish}`;
            if (!this.materials.has(paletteKey)) {
              const material2 = original.clone();
              material2.name = `Cottage ${paletteKey}`;
              if (color) material2.diffuse = new Color4().fromString(color);
              material2.metalness = 0;
              material2.gloss = 0.15;
              material2.update();
              if (pack === "furniture" && /^carpet/.test(original.name)) this.surfaces?.apply(material2, "fabric", 0.12);
              else if (pack === "furniture" && finish === "natural" && /^(wood|woodDark)$/.test(original.name)) this.surfaces?.apply(material2, "wood", 0.12);
              this.materials.set(paletteKey, material2);
              if (original.name === "lamp") this.lampMaterials.push(material2);
            }
            mesh.material = this.materials.get(paletteKey);
            mesh.mask = exterior ? 8 : 1;
          }
          const scale = size / (2 * (dimension === "height" ? bounds.halfExtents.y : bounds.halfExtents.x));
          if (name === "loungeChairUpright") bounds.center.z = -0.33735;
          const anchor = new Entity5(`Art ${name}`, this.app), normalization = new Entity5("Art normalization", this.app);
          normalization.addChild(model);
          anchor.addChild(normalization);
          this.root.addChild(anchor);
          normalization.setLocalScale(scale, scale, scale);
          normalization.setLocalPosition(-bounds.center.x * scale, -(bounds.center.y - bounds.halfExtents.y) * scale, -bounds.center.z * scale);
          anchor.setLocalPosition(...position);
          anchor.setLocalEulerAngles(pitch, yaw, 0);
          if (this.root.name === "Maple cottage" && position[0] === 5.95 && position[2] === 4.9 && ["bookcaseOpenLow", "books"].includes(name)) anchor.enabled = false;
          recordArt(anchor, this.root, `environment/${pack === "nursery" || pack === "school" ? "" : "kenney/"}${key}.glb`);
          for (const render of renderers) render.batchGroupId = this.group.id;
          this.loaded++;
        }).catch((error) => {
          this.errors.push(key);
          console.error(`Could not load house art ${key}`, error);
        });
        this.pending.push(task);
        trackArt(task);
      }
      async finish() {
        await Promise.all(this.pending);
        this.app.batcher.generate([this.group.id]);
      }
      snapshot() {
        return {
          loaded: this.loaded,
          models: this.assets.size,
          errors: this.errors,
          texturedMaterials: [...this.materials.values()].filter((m) => m.diffuseMap?.name.startsWith("Subtle")).map((m) => ({ name: m.name, texture: m.diffuseMap.name }))
        };
      }
    };
  }
});

// src/game/HouseLighting.ts
import { Color as Color5, Entity as Entity6 } from "playcanvas";
var HouseLighting;
var init_HouseLighting = __esm({
  "src/game/HouseLighting.ts"() {
    "use strict";
    init_primitives();
    HouseLighting = class {
      constructor(app, root, bedside, importedShades) {
        this.importedShades = importedShades;
        const shade = material("Warm household light glass", "#fff0d8");
        this.shades = [bedside, shade];
        const shape = primitives(app, root);
        const brass = material("Light fixture brass", "#b59169");
        const addLight = (name, position, intensity, range) => {
          const entity = new Entity6(name, app);
          root.addChild(entity);
          entity.setLocalPosition(...position);
          entity.addComponent("light", {
            type: "omni",
            color: new Color5(1, 0.84, 0.67),
            intensity: 0,
            range,
            castShadows: false
          });
          entity.light.mask = 1;
          entity.enabled = false;
          this.lights.push({ entity, intensity });
        };
        addLight("Bedside lamp light", [-0.53, 1.39, -2.83], 2.4, 3.8);
        addLight("Reading floor lamp light", [5.65, 1.58, 7.7], 2.3, 3.5);
        addLight("Lilah nursery lamp", [7.1, 1.48, -1.15], 2.3, 6);
        addLight("Marc bedside lamp", [10.6, 0.94, 4.5], 2.3, 6);
        addLight("Marc reading lamp", [10.55, 1.48, 8], 2.3, 6);
        for (const [name, x, y, z, leftWall, floorLamp] of [
          ["Bedroom", 0.55, 2.2, -3.46, false, false],
          ["Landing", 6.1, 1.58, 3.28, false, true],
          ["Bathroom", 4.7, 2.2, -3.43, false, false],
          ["Living room", -3.08, 2.2, 4.35, true, false],
          ["Kitchen", -3.08, 2.48, 10.1, true, false],
          ["Dining", -3.08, 2.2, 15.3, true, false],
          ["Utility", 6.1, 1.58, 11.45, false, true]
        ]) {
          if (!floorLamp) {
            shape(name + " sconce back", "box", [x, y, z], leftWall ? [0.055, 0.4, 0.25] : [0.25, 0.4, 0.055], brass, false);
            shape(name + " sconce glass", "sphere", [x + (leftWall ? 0.08 : 0), y, z + (leftWall ? 0 : 0.08)], leftWall ? [0.19, 0.31, 0.2] : [0.2, 0.31, 0.19], shade, false);
          }
          addLight(name + " fixture light", [x + (leftWall ? 0.22 : 0), y, z + (leftWall || floorLamp ? 0 : 0.22)], 2.1, 5.5);
        }
        const fill = new Entity6("Warm interior bounce", app);
        root.addChild(fill);
        fill.addComponent("light", { type: "directional", color: new Color5(1, 0.88, 0.74), intensity: 0, castShadows: false });
        fill.light.mask = 1;
        fill.setEulerAngles(45, -30, 0);
        fill.enabled = false;
        this.lights.push({ entity: fill, intensity: 0.55 });
      }
      importedShades;
      amount = 0;
      shadedCount = -1;
      get nightAmount() {
        return this.amount;
      }
      lights = [];
      shades;
      update(night, dt) {
        const target = night ? 1 : 0;
        if (this.amount === target && this.shadedCount === this.importedShades.length) return;
        this.shadedCount = this.importedShades.length;
        this.amount += Math.sign(target - this.amount) * Math.min(Math.abs(target - this.amount), dt / 1.2);
        for (const { entity, intensity } of this.lights) {
          entity.enabled = this.amount > 1e-3;
          const authored = entity.parent?.light;
          entity.light.intensity = (authored?.intensity ?? intensity) * this.amount;
        }
        for (const shade of [...this.shades, ...this.importedShades]) {
          shade.emissive.set(1, 0.67, 0.3);
          shade.emissiveIntensity = this.amount * 0.8;
          shade.update();
        }
      }
      snapshot() {
        return {
          amount: this.amount,
          lights: this.lights.map(({ entity, intensity }) => ({
            name: entity.name,
            enabled: entity.enabled,
            maxIntensity: intensity,
            intensity: entity.light.intensity,
            mask: entity.light.mask,
            position: entity.getPosition().toArray()
          })),
          glowingShades: this.shades.length + this.importedShades.length,
          exteriorMask: 8
        };
      }
    };
  }
});

// src/game/SurfaceTextures.ts
import { ADDRESS_REPEAT, FILTER_LINEAR_MIPMAP_LINEAR, Texture as Texture2 } from "playcanvas";
var SurfaceTextures;
var init_SurfaceTextures = __esm({
  "src/game/SurfaceTextures.ts"() {
    "use strict";
    SurfaceTextures = class {
      constructor(app) {
        this.app = app;
      }
      app;
      maps = /* @__PURE__ */ new Map();
      apply(material2, kind, tiling = kind === "rug" ? 4 : 2) {
        if (!this.maps.has(kind)) {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 256;
          const context = canvas.getContext("2d"), pixels = context.createImageData(256, 256);
          for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
            const weave = Math.sin(x * Math.PI / 8) * Math.sin(y * Math.PI / 8);
            const grain = Math.sin(y * Math.PI / 16 + Math.sin(x * Math.PI / 128) * 0.7);
            const fiber = Math.sin(x * Math.PI / 4 + y * Math.PI / 8) * 2;
            const value = kind === "checker" ? (Math.floor(x / 128) + Math.floor(y / 128)) % 2 ? 218 : 255 : kind === "tile" ? x < 4 || y < 4 ? 210 : 250 : kind === "terrazzo" ? Math.sin(x * 12.9898 + y * 78.233) * 43758.5453 % 1 > 0.87 ? 195 : 247 : kind === "wood" ? 244 + grain * 7 + Math.sin(y * Math.PI / 2) * 2 : kind === "rug" ? 240 + weave * 8 + Math.sin(y * Math.PI / 8) * 3 + fiber : 242 + weave * 9 + fiber;
            const i = (y * 256 + x) * 4;
            pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value;
            pixels.data[i + 3] = 255;
          }
          context.putImageData(pixels, 0, 0);
          const texture = new Texture2(this.app.graphicsDevice, {
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
    };
  }
});

// src/game/house.ts
import { BoundingBox as BoundingBox4, Entity as Entity7, Vec3 as Vec36 } from "playcanvas";
function createHouse(app) {
  const bedroom = createBedroom(app), m = bedroom.materials;
  const surfaces = new SurfaceTextures(app);
  surfaces.apply(m.wood, "wood");
  surfaces.apply(m.rug, "rug");
  const root = new Entity7("Maple cottage", app);
  app.root.addChild(root);
  bedroom.root.reparent(root);
  const obstacles = bedroom.obstacles;
  const group = app.batcher.addGroup("Cottage architecture", false, 14);
  const makeShape = primitives(app, root, group.id);
  let exterior = false;
  const shape = (...args) => {
    const entity = makeShape(...args);
    for (const mesh of entity.render.meshInstances) mesh.mask = exterior ? 8 : 1;
    return entity;
  };
  const art = new HouseArt(app, root, surfaces);
  const block = (x, z, w, d) => obstacles.push(new BoundingBox4(new Vec36(x, 0.7, z), new Vec36(w / 2, 1.4, d / 2)));
  const box = (name, x, y, z, w, h, d, mat = m.trim) => shape(name, "box", [x, y, z], [w, h, d], mat);
  const oval = (name, x, y, z, w, h, d, mat = m.rug) => shape(name, "cylinder", [x, y, z], [w, h, d], mat, false);
  function furniture(name, x, z, size, yaw = 0, dimension = "height", foot, y = 0.027, colors = {}, finish = "natural") {
    art.add("furniture", name, [x, y, z], size, yaw, dimension, colors, exterior, 0, finish);
    if (foot) block(x, z, ...foot);
  }
  const oak = material("Cottage oak boards", "#dec69e"), tile = material("Warm checker stone", "#d9dcd1"), grout = material("Stone grout", "#eeeadd");
  const sage = material("Kitchen sage paint", "#aebea9"), blue = material("Bathroom powder paint", "#cadce0");
  const grass = material("Garden lawn", "#9db77d"), grassDark = material("Lawn edge", "#8ea66d"), path = material("Garden limestone", "#d4c8ac");
  const asphalt = material("Warm driveway gravel", "#afa698"), soil = material("Flower bed earth", "#9a8265");
  const dadCarpet = material("Marc slate woven carpet", "#aab7bd");
  surfaces.apply(dadCarpet, "fabric", 12);
  for (const room of HOUSE_ROOMS.filter((room2) => room2.id !== "bedroom")) {
    const w = room.maxX - room.minX, d = room.maxZ - room.minZ, x = (room.maxX + room.minX) / 2, z = (room.maxZ + room.minZ) / 2;
    box(room.name + " foundation", x, -0.17, z, w, 0.32, d, m.wood);
    box(room.name + " floor", x, -0.025, z, w, 0.1, d, room.id === "marc-bedroom" ? dadCarpet : room.id === "bathroom" || room.id === "laundry" ? tile : oak);
    if (room.id === "bathroom" || room.id === "laundry") {
      for (let a = room.minX + 0.05; a < room.maxX; a += 0.6) box("Tile grout", a, 0.029, z, 0.013, 6e-3, d, grout);
      for (let b = room.minZ + 0.05; b < room.maxZ; b += 0.6) box("Tile grout", x, 0.029, b, w, 6e-3, 0.013, grout);
    } else if (room.id !== "marc-bedroom") {
      for (let b = room.minZ + 0.05; b < room.maxZ; b += 0.38) {
        box("Oak board seam", x, 0.029, b, w, 5e-3, 9e-3, m.seam);
        for (let a = room.minX + 0.5 + Math.round(b * 10) % 3 * 0.4; a < room.maxX; a += 1.9) box("Oak board end", a, 0.031, b + 0.19, 9e-3, 3e-3, 0.36, m.seam);
      }
    }
  }
  function wall(axis, fixed, from, to, height = 0.48, mat = m.sideWall) {
    const gaps = HOUSE_DOORS.filter((d) => d.axis === axis && Math.abs((axis === "x" ? d.z : d.x) - fixed) < 0.01).map((d) => ({ a: (axis === "x" ? d.x : d.z) - d.width / 2, b: (axis === "x" ? d.x : d.z) + d.width / 2 })).filter((d) => d.b > from && d.a < to).sort((a, b) => a.a - b.a);
    function segment(a, b) {
      if (b - a < 0.01) return;
      const x = axis === "x" ? (a + b) / 2 : fixed, z = axis === "z" ? (a + b) / 2 : fixed, w = axis === "x" ? b - a : 0.14, d = axis === "z" ? b - a : 0.14;
      box("Painted cottage wall", x, height / 2, z, w, height, d, mat);
      box("Ivory wall cap", x, height + 0.025, z, w + 0.035, 0.05, d + 0.035, m.trim);
      box("Cottage skirting", x, 0.12, z, w + 0.035, 0.16, d + 0.035, m.trim);
      block(x, z, w, d);
    }
    let cursor = from;
    for (const gap of gaps) {
      segment(cursor, Math.max(cursor, gap.a));
      cursor = Math.max(cursor, gap.b);
    }
    segment(cursor, to);
  }
  wall("z", 3.3, -3.6, 3.6);
  wall("x", 0.4, 3.3, 6.5);
  wall("x", 3.6, -3.3, 6.5);
  wall("x", 9.5, -3.3, 6.5);
  wall("z", 2.6, 9.5, 13.2);
  wall("x", 13.2, 2.6, 6.5);
  wall("x", 16.3, -3.3, 2.6);
  wall("z", 2.6, 13.2, 16.3);
  wall("z", 6.5, -3.6, 13.2);
  wall("x", -3.6, 6.5, 11, 2.65, m.wall);
  wall("x", 3.6, 6.5, 11);
  wall("z", 11, -3.6, 13.2);
  wall("x", 13.2, 6.5, 11);
  wall("x", -3.6, 3.3, 6.5, 2.65, blue);
  wall("z", -3.3, 3.6, 9.5, 2.65, m.wall);
  wall("z", -3.3, 9.5, 16.3, 2.65, sage);
  block(-3.35, 0, 0.15, 7.3);
  block(0, -3.65, 6.8, 0.15);
  for (const door of HOUSE_DOORS) {
    box("Flush doorway threshold", door.x, 0.026, door.z, door.axis === "x" ? door.width : 0.17, 0.012, door.axis === "z" ? door.width : 0.17, m.trim);
    for (const side of [-1, 1]) box("Door frame cutaway", door.x + (door.axis === "x" ? side * door.width / 2 : 0), 0.46, door.z + (door.axis === "z" ? side * door.width / 2 : 0), 0.15, 0.92, 0.15, m.trim);
  }
  function windowOnLeft(z, w = 1.8) {
    box("Garden window frame", -3.18, 1.85, z, 0.12, 1.35, w, m.trim);
    box("Garden window glass", -3.1, 1.85, z, 0.018, 1.16, w - 0.18, m.sky);
    box("Window middle", -3.07, 1.85, z, 0.03, 1.18, 0.055, m.trim);
    box("Window cross", -3.07, 1.85, z, 0.03, 0.055, w - 0.13, m.trim);
    box("Deep window sill", -3.01, 1.14, z, 0.42, 0.08, w + 0.1, m.trim);
    for (const dz of [-w / 2 - 0.14, w / 2 + 0.14]) box("Linen curtain", -3.02, 1.82, z + dz, 0.16, 1.63, 0.27, m.pinkLight);
  }
  windowOnLeft(5.9, 2.25);
  windowOnLeft(11.45, 2);
  box("Front door timber", -3.19, 1.15, 8.25, 0.09, 2.2, 0.94, m.wood);
  box("Front door inset", -3.12, 1.48, 8.25, 0.03, 0.85, 0.67, m.sky);
  shape("Door brass handle", "sphere", [-3.075, 1, 7.92], [0.08, 0.08, 0.08], m.yellow);
  for (const z of [7.7, 8.8]) box("Entry door casing", -3.1, 1.17, z, 0.19, 2.34, 0.09, m.trim);
  box("Entry lintel", -3.1, 2.32, 8.25, 0.19, 0.09, 1.19, m.trim);
  furniture("benchCushion", 6.02, 3.05, 0.8, -90, "width", [0.5, 0.8], 0.027, { carpet: "#b9a7cd" });
  furniture("coatRackStanding", 3.8, 1, 1.55, 0, "height", [0.4, 0.4]);
  furniture("sideTableDrawers", 5.8, 1.1, 0.72, 0, "height", [0.75, 0.45]);
  furniture("plantSmall1", 5.8, 1.1, 0.28, 0, "height", void 0, 0.76);
  furniture("lampRoundFloor", 6.1, 3.28, 1.8, 0, "height", [0.35, 0.35]);
  oval("Landing rug", 4.7, 0.054, 2.15, 1.75, 0.025, 1.55, m.rug);
  box("Mail tray", 5.55, 0.8, 1.1, 0.42, 0.08, 0.3, m.wood);
  furniture("loungeSofa", -2.3, 6.05, 3.05, 90, "width", [1.2, 3.05]);
  furniture("tableCoffee", -0.48, 6.3, 1.3, 0, "width", [1.3, 0.75]);
  furniture("books", -0.58, 6.3, 0.34, 0, "width", void 0, 0.54);
  furniture("plantSmall2", -0.15, 6.3, 0.23, 0, "height", void 0, 0.54);
  const livingRug = material("Living oatmeal rug", "#dbbf9e");
  surfaces.apply(livingRug, "rug");
  oval("Living rug", -0.9, 0.052, 6.2, 4, 0.025, 4.2, livingRug);
  for (const z of [4.7, 7.7]) box("Rug woven border", -0.9, 0.067, z, 3.2, 4e-3, 0.035, m.trim);
  furniture("cabinetTelevision", 2, 4.2, 1.8, 0, "width", [1.8, 0.6]);
  furniture("televisionModern", 2, 4.2, 1.28, 0, "width", void 0, 0.68, { metal: "#718d91" });
  furniture("loungeChairUpright", 4.5, 7.35, 1, -35, "height", [1.1, 1.1], 0.027, { carpet: "#d9b7c3" });
  furniture("lampRoundFloor", 5.65, 7.7, 1.8, 0, "height", [0.35, 0.35]);
  furniture("sideTable", 5.65, 6.6, 0.55, 0, "height", [0.5, 0.5]);
  furniture("radio", 5.65, 6.6, 0.32, 0, "width", void 0, 0.61);
  furniture("bookcaseOpenLow", 5.95, 4.9, 1.45, -90, "width", [0.6, 1.45]);
  furniture("books", 5.95, 4.9, 0.65, -90, "width", void 0, 1.03);
  furniture("pottedPlant", 5.9, 8.75, 1.1, 0, "height", [0.5, 0.5]);
  oval("Reading rug", 4.7, 0.053, 7.3, 2.5, 0.025, 2.5, m.rug);
  box("Living toy basket", 1.95, 0.24, 8.55, 0.82, 0.43, 0.6, m.wood);
  block(1.95, 8.55, 0.82, 0.6);
  box("Basket fabric lining", 1.95, 0.465, 8.55, 0.75, 0.035, 0.54, m.pinkLight);
  furniture("bear", 2.13, 8.55, 0.28, 0, "height", void 0, 0.48);
  furniture("kitchenCabinetDrawer", -2.72, 10.25, 1, 90, "height", [0.95, 1.1]);
  furniture("kitchenSink", -2.72, 11.45, 1, 90, "height", [0.95, 1.2]);
  furniture("kitchenStove", -2.72, 12.65, 1, 90, "height", [0.95, 1.1]);
  furniture("kitchenFridge", -2.65, 14.55, 1.85, 90, "height", [1.05, 1.05]);
  furniture("kitchenCabinetUpperDouble", -2.98, 10.25, 0.57, 90, "height", void 0, 1.75);
  furniture("hoodModern", -2.98, 12.65, 0.5, 90, "height", void 0, 1.75);
  furniture("kitchenCoffeeMachine", -2.63, 10.1, 0.36, 90, "height", void 0, 1.05);
  furniture("toaster", -2.65, 10.55, 0.23, 90, "height", void 0, 1.05);
  furniture("tableRound", 0.55, 13.85, 1.75, 0, "width", [1.65, 1.65]);
  for (const [x, z, yaw] of [[0.55, 12.55, 0], [0.55, 15.05, 180], [1.78, 13.85, -90], [-0.7, 13.85, 90]]) furniture("chairCushion", x, z, window.__editorMode ? 0.82 : 0.943, yaw, "height", [0.55, 0.55]);
  furniture("plantSmall1", 0.55, 13.85, 0.28, 0, "height", void 0, 0.95);
  furniture("trashcan", 1.95, 10.3, 0.6, 0, "height", [0.4, 0.4]);
  box("Kitchen woven runner", -1.65, 0.05, 11.35, 0.65, 0.025, 2.7, m.mint);
  furniture("washer", 3.35, 10.2, 1.02, 0, "height", [1.05, 0.95]);
  furniture("dryer", 3.25, 12.4, 1.02, 90, "height", [1.05, 0.95]);
  box("Folding counter", 5.78, 0.43, 12.63, 1.05, 0.81, 0.9, m.trim);
  block(5.78, 12.63, 1.05, 0.9);
  box("Birch worktop", 5.78, 0.88, 12.63, 1.14, 0.1, 0.95, m.wood);
  box("Clean laundry basket", 5.85, 0.23, 10.5, 0.65, 0.43, 0.6, m.pinkLight);
  block(5.85, 10.5, 0.65, 0.6);
  for (let i = 0; i < 3; i++) box("Folded towels", 5.6, 0.98 + i * 0.07, 12.65, 0.55, 0.055, 0.32, [m.blue, m.pinkLight, m.mint][i]);
  furniture("plantSmall2", 6.1, 12.65, 0.3, 0, "height", void 0, 0.95);
  furniture("lampRoundFloor", 6.1, 11.45, 1.8, 0, "height", [0.35, 0.35]);
  furniture("bathroomSink", 4.12, -3.08, 0.9, 0, "height", [1, 0.7]);
  furniture("bathroomMirror", 4.12, -3.15, 0.9, 0, "height", void 0, 1.35, { metal: "#a5c6cc" });
  furniture("bathtub", 5.75, -2.12, 2.15, 90, "width", [0.94, 2.15]);
  furniture("toilet", 5.98, -0.32, 0.8, -90, "height", [0.8, 0.58]);
  box("Bath mat", 4.6, 0.054, -1.55, 1.1, 0.025, 1.4, m.rug);
  for (const z of [-0.85, -0.2]) box("Towel rail leg", 3.62, 0.44, z, 0.055, 0.88, 0.055, m.wood);
  box("Towel rail bar", 3.62, 0.88, -0.525, 0.06, 0.055, 0.7, m.wood);
  block(3.62, -0.525, 0.16, 0.8);
  furniture("plantSmall1", 4.35, -3.12, 0.22, 0, "height", void 0, 0.95);
  furniture("bear", -2.53, -2.5, 0.32, 0, "height", void 0, 0.92);
  furniture("books", 2.45, 1.05, 0.3, 20, "width", void 0, 1.18);
  const nurseryRug = material("Nursery butter rug", "#e7d5aa");
  surfaces.apply(nurseryRug, "rug");
  oval("Nursery play rug", 8.55, 0.052, 0.35, 2.6, 0.025, 2.4, nurseryRug);
  art.add("nursery", "crib", [9.8, 0.035, -1.7], 1.25, 0, "height", { "_crayfishdiffuse": "#e9dbc5", "03___Default": "#c5d4cf", "02___Default": "#ecd59d" });
  block(9.8, -1.7, 1.6, 2);
  furniture("cabinetBedDrawer", 7.3, -2.85, 0.88, 0, "height", [0.9, 0.7], 0.027, { wood: "#e8e5df" }, "paint");
  art.add("furniture", "pillowLong", [7.3, 0.96, -3.03], 0.68, 0, "width", { carpet: "#e7c7bd" }, false, 90);
  furniture("bookcaseOpenLow", 10.55, 1.55, 1.1, -90, "height", [0.6, 1.5], 0.027, { wood: "#e8e5df" }, "paint");
  furniture("bear", 10.5, 1.35, 0.29, 0, "height", void 0, 0.55);
  furniture("books", 10.5, 1.85, 0.34, 90, "width", void 0, 0.55);
  furniture("loungeChairRelax", 7.15, -0.1, 0.83, 45, "height", [0.85, 0.85], 0.027, { carpet: "#b9c5ac" });
  furniture("lampRoundFloor", 7.1, -1.15, 1.65, 0, "height", [0.3, 0.3]);
  furniture("bear", 8.65, 0.4, 0.3, 20, "height", void 0, 0.075);
  box("Nursery toy basket", 9.45, 0.22, 2.8, 0.6, 0.38, 0.55, m.mint);
  block(9.45, 2.8, 0.6, 0.55);
  furniture("bear", 9.45, 2.8, 0.24, 0, "height", void 0, 0.39);
  box("Nursery window frame", 8.2, 1.8, -3.51, 1.55, 1.15, 0.1, m.trim);
  box("Nursery window glass", 8.2, 1.8, -3.44, 1.35, 0.95, 0.035, m.sky);
  box("Nursery window cross", 8.2, 1.8, -3.4, 0.055, 1, 0.04, m.trim);
  const dadRug = material("Marc ivory bedside rug", "#e5e1d5");
  surfaces.apply(dadRug, "rug");
  oval("Marc bedside rug", 9.35, 0.052, 5.65, 3.05, 0.025, 3.55, dadRug);
  furniture("bedDouble", 9.3, 5.15, 1.9, 0, "width", [1.95, 2.4], 0.035, { wood: "#566d7d", carpet: "#667f91", carpetWhite: "#eee9de", metal: "#b6a176" }, "paint");
  for (const x of [8, 10.6]) furniture("cabinetBedDrawerTable", x, 4.5, 0.55, 0, "height", [0.55, 0.5], 0.027, { wood: "#ede9df", metal: "#657780" }, "paint");
  furniture("lampRoundTable", 10.6, 4.5, 0.42, 0, "height", void 0, 0.6, { metal: "#b79c70" });
  furniture("books", 8, 4.5, 0.27, 0, "width", void 0, 0.6);
  box("Dad folded throw", 9.3, 0.675, 5.8, 1.68, 0.035, 0.4, material("Terracotta throw", "#c58b70"));
  furniture("bookcaseClosedDoors", 7.02, 8.45, 1.7, 90, "height", [0.75, 1.55], 0.027, { wood: "#657c89", metal: "#c9b68c" }, "paint");
  furniture("desk", 8.45, 12.65, 1.8, 180, "width", [1.8, 0.75], 0.027, { wood: "#ece8de", metal: "#5d707d" }, "paint");
  furniture("laptop", 8.45, 12.6, 0.52, 180, "width", void 0, 0.92);
  furniture("chairModernFrameCushion", 8.45, 11.55, 0.88, 180, "height", [0.65, 0.65], 0.027, { metal: "#526777", carpetBlue: "#c38e72" });
  furniture("plantSmall2", 9.08, 12.62, 0.22, 0, "height", void 0, 0.92);
  furniture("loungeDesignChair", 10.05, 9.15, 0.95, -45, "height", [1.1, 1.1], 0.027, { carpetBlue: "#b97f65", metal: "#576d77" });
  furniture("tableCoffeeGlassSquare", 9.9, 10.6, 0.62, 0, "width", [0.62, 0.62], 0.027, { metal: "#566a76", glass: "#b9d2d3" });
  furniture("books", 9.9, 10.6, 0.25, 0, "width", void 0, 0.36);
  furniture("lampRoundFloor", 10.55, 8, 1.65, 0, "height", [0.3, 0.3], 0.027, { metal: "#b59b76" });
  furniture("pottedPlant", 10.5, 12.4, 0.95, 0, "height", [0.5, 0.5]);
  furniture("cabinetBedDrawer", -2.72, 15.65, 1, 90, "height", [0.95, 0.9]);
  furniture("kitchenMicrowave", -2.72, 15.65, 0.29, 90, "height", void 0, 1.035);
  furniture("pillowLong", -2.3, 6.8, 0.66, 90, "width", void 0, 0.62, { carpet: "#b5c9bc" });
  exterior = true;
  box("Garden terrain", 0, -0.3, 7, 70, 0.3, 80, grass);
  box("Lawn edging", -5.15, -0.12, 8.8, 0.22, 0.12, 19, grassDark);
  box("Gravel driveway", -7.2, -0.135, 12, 3.8, 0.045, 17.5, asphalt);
  box("Driveway curb", -9.18, -0.07, 12, 0.12, 0.15, 17.6, m.trim);
  box("Front path", -4.3, -0.07, 8.25, 2.2, 0.14, 1.8, path);
  box("Entry porch", -3.88, -0.025, 8.25, 1.25, 0.19, 2.6, m.wood);
  for (let z = 7.05; z < 9.5; z += 0.19) box("Porch board", -3.88, 0.074, z, 1.25, 8e-3, 0.012, m.seam);
  box("Patio terrace", 4.55, -0.105, 14.4, 4, 0.08, 2.4, path);
  for (let x = 3; x < 6.5; x += 0.55) box("Terrace joint", x, -0.06, 14.4, 0.012, 6e-3, 2.4, m.trim);
  furniture("benchCushion", 4.65, 14.5, 1.6, 0, "width", void 0, -0.06);
  for (const [x, z, w, d] of [[-4.05, 2, 1.05, 6], [-4.1, 12.15, 1, 4.2], [11.75, 5.5, 1.05, 11], [0.3, -4.35, 8, 1]]) box("Raised flower border", x, -0.07, z, w, 0.11, d, soil);
  const treePositions = [[-6.2, 0, -3.5], [-8.5, 0, 2], [-5.5, 0, 16.6], [8.2, 0, -7.2], [13.6, 0, 3], [13.3, 0, 8.3], [9.4, 0, 16.9], [-9.5, 0, 20], [4.2, 0, -6], [-10.7, 0, 11]];
  treePositions.forEach(([x, , z], i) => art.add("nature", i % 2 ? "tree_oak" : "tree_detailed", [x, -0.14, z], 3 + i % 3 * 0.45, i * 57));
  for (let i = 0; i < 28; i++) {
    const left = i < 14, x = left ? -4.12 : 11.75, z = -2.7 + i % 14 * 1.14;
    if (left && z > 6.8 && z < 9.8) continue;
    art.add("nature", "plant_bushDetailed", [x, -0.1, z], 0.48 + i % 3 * 0.08, i * 41);
    art.add("nature", i % 2 ? "flower_purpleA" : "flower_yellowC", [x + 0.35, -0.07, z + 0.25], 0.26 + i % 3 * 0.03, i * 23);
  }
  for (let i = 0; i < 30; i++) art.add("nature", "grass_large", [-11 + i % 10 * 2.4, -0.14, i < 10 ? -6.3 : i < 20 ? 18.4 : 21.5], 0.15 + i % 3 * 0.03, i * 17);
  for (let z = -6; z < 20; z += 2) art.add("nature", "fence_planksDouble", [15, -0.14, z], 0.82, 90);
  for (let x = -10; x < 15; x += 2) art.add("nature", "fence_planksDouble", [x, -0.14, -6], 0.82, 0);
  for (let x = -4.7; x < 15; x += 2) art.add("nature", "fence_planksDouble", [x, -0.14, 20], 0.82, 0);
  box("Mailbox post", -5.15, 0.45, 18, 0.12, 1.15, 0.12, m.wood);
  box("Mailbox body", -5.15, 1.03, 18, 0.43, 0.36, 0.6, m.pink);
  box("Mailbox door", -5.15, 1.03, 18.315, 0.36, 0.29, 0.035, m.trim);
  app.batcher.generate([group.id]);
  const ready = art.finish();
  const lighting = new HouseLighting(app, root, m.lamp, art.lampMaterials);
  return { root, obstacles, materials: m, halfWidth: 11.1, halfDepth: 16.4, walkable: [...HOUSE_ROOMS], ready, artStats: () => art.snapshot(), lighting };
}
var init_house2 = __esm({
  "src/game/house.ts"() {
    "use strict";
    init_house();
    init_bedroom();
    init_primitives();
    init_HouseArt();
    init_HouseLighting();
    init_SurfaceTextures();
  }
});

// src/game/IsometricCamera.ts
import { Entity as Entity8, Color as Color6, PROJECTION_ORTHOGRAPHIC, TONEMAP_LINEAR, Vec3 as Vec37 } from "playcanvas";
var CAMERA_PRESETS, IsometricCamera;
var init_IsometricCamera = __esm({
  "src/game/IsometricCamera.ts"() {
    "use strict";
    CAMERA_PRESETS = { EXPLORE: { zoom: 1 }, CHORE: { zoom: 0.608 }, REVIEW: { zoom: 0.65 }, BOX_OPENING: { zoom: 0.7 }, TRADE: { zoom: 0.85 } };
    IsometricCamera = class {
      entity;
      offset = new Vec37();
      desired = new Vec37();
      basePosition = new Vec37(6, 14, 18.9);
      baseTarget = new Vec37(0, 0.8, 0.9);
      zoomFactor;
      state = "EXPLORE";
      target = null;
      returnZoom = null;
      returning = false;
      interactionLift = 0;
      get exploreHeight() {
        return this.returnZoom ?? this.entity.camera.orthoHeight;
      }
      beginChore(player, object) {
        if (this.returnZoom === null) this.returnZoom = this.entity.camera.orthoHeight;
        this.target = new Vec37().lerp(player, object, 0.4);
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
      constructor(app, existing) {
        this.zoomFactor = (existing?.camera?.orthoHeight ?? 7) / 7;
        if (existing) {
          this.basePosition.copy(existing.getPosition());
          this.baseTarget.copy(existing.getPosition()).add(existing.forward.clone().mulScalar(new Vec37(6, 14, 18.9).distance(new Vec37(0, 0.8, 0.9))));
        }
        this.entity = existing ?? new Entity8("Following isometric camera", app);
        if (!this.entity.camera) this.entity.addComponent("camera", {
          projection: PROJECTION_ORTHOGRAPHIC,
          orthoHeight: 7,
          nearClip: 0.1,
          farClip: 60,
          clearColor: new Color6().fromString("#ede6f4")
        });
        this.entity.setPosition(this.basePosition);
        this.entity.lookAt(this.baseTarget);
        if (!existing) app.root.addChild(this.entity);
      }
      resize(width, height) {
        const aspect = width / height;
        const zoom = (aspect < 1 ? Math.max(5.1, 2.65 / aspect) : 5.1) * this.zoomFactor;
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
        this.interactionLift += ((this.state === "CHORE" ? -2 : 0) - this.interactionLift) * (1 - Math.exp(-5 * dt));
        this.entity.setPosition(this.basePosition.x + this.offset.x, this.basePosition.y + this.interactionLift, this.basePosition.z + this.offset.z);
        this.entity.lookAt(new Vec37(this.baseTarget.x + this.offset.x, this.baseTarget.y, this.baseTarget.z + this.offset.z));
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
        this.entity.setPosition(this.basePosition);
        this.entity.lookAt(this.baseTarget);
      }
    };
  }
});

// src/components/MovementPace.ts
var RUN_SPEED, WALK_SPEED;
var init_MovementPace = __esm({
  "src/components/MovementPace.ts"() {
    "use strict";
    RUN_SPEED = 3.15;
    WALK_SPEED = 1.65;
  }
});

// src/components/RunningPose.ts
import { AnimCurve, AnimData, AnimTrack, Quat, Vec3 as Vec38, INTERPOLATION_LINEAR } from "playcanvas";
function balancedRun(model, track) {
  const bindings = track.curves.map((curve) => ({ curve, path: curve.paths[0] }));
  const nodes = bindings.map(({ path }) => model.findByName(path.entityPath.at(-1)));
  const rest = nodes.map((n) => ({ p: n.getLocalPosition().clone(), q: n.getLocalRotation().clone(), s: n.getLocalScale().clone() }));
  const restore = () => nodes.forEach((n, i) => {
    n.setLocalPosition(rest[i].p);
    n.setLocalRotation(rest[i].q);
    n.setLocalScale(rest[i].s);
  });
  const names = ["Hips", "Spine02", "Spine01", "Spine", "LeftShoulder", "LeftArm", "LeftForeArm", "LeftHand", "RightShoulder", "RightArm", "RightForeArm", "RightHand"];
  const bones = Object.fromEntries(names.map((name) => [name, model.findByName(name)]));
  const bind = Object.fromEntries(names.map((name) => [name, bones[name].getRotation().clone()]));
  const start = Math.min(...track.inputs.map((i) => i.data[0])), duration = track.duration - start;
  const sample = (phase) => {
    const time = start + phase * duration;
    bindings.forEach(({ curve, path }, i) => {
      const times = track.inputs[curve.input].data, out = track.outputs[curve.output], data = out.data, c = out.components;
      let lo = 0;
      while (lo < times.length - 2 && times[lo + 1] < time) lo++;
      const hi = Math.min(lo + 1, times.length - 1), alpha = Math.max(0, Math.min(1, (time - times[lo]) / (times[hi] - times[lo] || 1)));
      const a = Array.from(data.slice(lo * c, lo * c + c)), b = Array.from(data.slice(hi * c, hi * c + c));
      if (path.propertyPath[0] === "localRotation") nodes[i].setLocalRotation(new Quat().slerp(new Quat(...a), new Quat(...b), alpha));
      else {
        const v = a.map((v2, k) => v2 + (b[k] - v2) * alpha);
        if (path.propertyPath[0] === "localPosition") nodes[i].setLocalPosition(v[0], v[1], v[2]);
        else nodes[i].setLocalScale(v[0], v[1], v[2]);
      }
    });
  };
  const delta = (name) => new Quat().mul2(bones[name].getRotation(), bind[name].clone().invert());
  const mirror = (q) => new Quat(q.x, -q.y, -q.z, q.w);
  const palmAlignment = new Quat().setFromDirections(RUN_PALM_AXES.Left, new Vec38(-RUN_PALM_AXES.Right.x, RUN_PALM_AXES.Right.y, RUN_PALM_AXES.Right.z));
  const settleRightWrist = () => {
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
  for (let f = 0; f <= count; f++) {
    const phase = f === count ? 0 : f / count;
    sample((phase + 0.5) % 1);
    settleRightWrist();
    const opposite = Object.fromEntries(names.map((name) => [name, delta(name)]));
    const oppositeX = bones.Hips.getLocalPosition().x;
    sample(phase);
    settleRightWrist();
    const central = names.slice(0, 4).map((name) => new Quat().slerp(delta(name), mirror(opposite[name]), 0.5));
    const p = bones.Hips.getLocalPosition().clone();
    p.x = (p.x - oppositeX) * 0.5 + rest[nodes.indexOf(bones.Hips)].p.x;
    bones.Hips.setLocalPosition(p);
    names.slice(0, 4).forEach((name, i) => bones[name].setRotation(new Quat().mul2(central[i], bind[name])));
    for (const part of ["Shoulder", "Arm", "ForeArm", "Hand"]) {
      const left = "Left" + part, right = "Right" + part;
      bones[left].setRotation(mirror(new Quat().mul2(opposite[right], bind[right])));
    }
    bones.LeftHand.setRotation(new Quat().mul2(bones.LeftHand.getRotation(), palmAlignment));
    fixedLeftWrist ??= bones.LeftHand.getLocalRotation().clone();
    bones.LeftHand.setLocalRotation(fixedLeftWrist);
    frames.push(bindings.map(({ path }, i) => path.propertyPath[0] === "localRotation" ? nodes[i].getLocalRotation().toArray() : (path.propertyPath[0] === "localPosition" ? nodes[i].getLocalPosition() : nodes[i].getLocalScale()).toArray()));
  }
  restore();
  return new AnimTrack(
    "Run",
    duration,
    [new AnimData(1, frames.map((_, i) => i * duration / count))],
    bindings.map((_, i) => new AnimData(frames[0][i].length, frames.flatMap((frame) => frame[i]))),
    bindings.map(({ curve }, i) => new AnimCurve(curve.paths, 0, i, INTERPOLATION_LINEAR))
  );
}
var RUN_PALM_AXES, RUN_WRIST_LIMIT;
var init_RunningPose = __esm({
  "src/components/RunningPose.ts"() {
    "use strict";
    RUN_PALM_AXES = { Left: new Vec38(-0.084140846, 0.99499861, -0.05383385).normalize(), Right: new Vec38(-0.16291618, 0.98452002, 0.06464243).normalize() };
    RUN_WRIST_LIMIT = 12;
  }
});

// src/components/MeshyGameplayAdapter.ts
import { AnimCurve as AnimCurve2, AnimData as AnimData2, AnimTrack as AnimTrack2, Quat as Quat2, Vec3 as Vec39, INTERPOLATION_LINEAR as INTERPOLATION_LINEAR2 } from "playcanvas";
function meshyGameplay(model, source, chore) {
  const walking = source.find((track) => track.name === "Walking");
  if (!walking) throw new Error("The new Arianna is missing Walking.");
  const required = (name) => {
    const track = source.find((track2) => track2.name === name);
    if (!track) throw new Error("Missing Arianna clip: " + name);
    return track;
  };
  const running = required("Running"), authoredCarryWalk = required("CarryWalk"), authoredCarryRun = required("CarryRun"), idle = required("Idle");
  const paths = (curve) => curve.paths;
  const channels = walking.curves.flatMap((curve) => paths(curve).map((path) => ({
    path,
    node: model.findByName(path.entityPath.at(-1)),
    property: path.propertyPath[0]
  })));
  if (channels.some((channel) => !channel.node)) throw new Error("Arianna animation targets do not match her rig.");
  const read = (node, property) => property === "localRotation" ? [node.getLocalRotation().x, node.getLocalRotation().y, node.getLocalRotation().z, node.getLocalRotation().w] : (property === "localPosition" ? node.getLocalPosition() : node.getLocalScale()).toArray();
  const capture = () => channels.map(({ node, property }) => read(node, property));
  const rest = capture();
  const restore = () => channels.forEach(({ node, property }, i) => {
    const v = rest[i];
    if (property === "localRotation") node.setLocalRotation(v[0], v[1], v[2], v[3]);
    else if (property === "localPosition") node.setLocalPosition(v[0], v[1], v[2]);
    else node.setLocalScale(v[0], v[1], v[2]);
  });
  const aim = (node, child, target) => {
    const from = child.getPosition().clone().sub(node.getPosition()).normalize();
    const to = target.clone().sub(node.getPosition()).normalize();
    node.setRotation(new Quat2().mul2(new Quat2().setFromDirections(from, to), node.getRotation()));
  };
  const crouch = () => {
    const feet = ["Left", "Right"].map((side) => ({ side, node: model.findByName(side + "Foot"), point: model.findByName(side + "Foot").getPosition().clone(), rotation: model.findByName(side + "Foot").getRotation().clone() }));
    const hips2 = model.findByName("Hips"), p = hips2.getLocalPosition();
    hips2.setLocalPosition(p.x, p.y - 0.29, p.z - 0.06);
    for (const foot of feet) {
      const thigh = model.findByName(foot.side + "UpLeg"), shin = model.findByName(foot.side + "Leg"), origin = thigh.getPosition().clone();
      const upper = origin.distance(shin.getPosition()), lower = shin.getPosition().distance(foot.node.getPosition()), delta = foot.point.clone().sub(origin), length = delta.length();
      delta.normalize();
      const pole = model.getWorldTransform().transformVector(new Vec39(0, 0, 1));
      pole.sub(delta.clone().mulScalar(pole.dot(delta))).normalize();
      const along = (upper * upper - lower * lower + length * length) / (2 * length), knee = origin.clone().add(delta.clone().mulScalar(along)).add(pole.mulScalar(Math.sqrt(Math.max(0, upper * upper - along * along))));
      aim(thigh, shin, knee);
      aim(shin, foot.node, foot.point);
      foot.node.setRotation(foot.rotation);
    }
  };
  const arms = (y, z, wide = 0.11, motion) => {
    for (const [side, sign] of [["Left", 1], ["Right", -1]]) {
      const arm = model.findByName(side + "Arm"), fore = model.findByName(side + "ForeArm"), hand = model.findByName(side + "Hand");
      const i = side === "Right" ? 0 : 3;
      const shoulder = arm.getPosition().clone(), target = model.getWorldTransform().transformPoint(new Vec39(sign * wide + (motion?.[i] ?? 0) * 0.09, y + (motion?.[i + 1] ?? 0) * 0.055, z + (motion?.[i + 2] ?? 0) * 0.09));
      const upper = shoulder.distance(fore.getPosition()), lower = fore.getPosition().distance(hand.getPosition());
      const direction = target.clone().sub(shoulder), distance = Math.min(direction.length(), upper + lower - 2e-3);
      direction.normalize();
      const pole = model.getWorldTransform().transformVector(new Vec39(sign, -0.6, -0.3));
      pole.sub(direction.clone().mulScalar(pole.dot(direction))).normalize();
      const along = (upper * upper - lower * lower + distance * distance) / (2 * distance);
      const elbow = shoulder.clone().add(direction.clone().mulScalar(along)).add(pole.mulScalar(Math.sqrt(Math.max(0, upper * upper - along * along))));
      aim(arm, fore, elbow);
      aim(fore, hand, shoulder.clone().add(direction.mulScalar(distance)));
    }
  };
  for (const curve of authoredCarryWalk.curves) for (const path of paths(curve)) {
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
  const axis = model.getWorldTransform().transformVector(Vec39.RIGHT).normalize();
  spine.setRotation(new Quat2().mul2(new Quat2().setFromAxisAngle(axis, 28), spine.getRotation()));
  arms(0.47, 0.3);
  const reach = capture();
  restore();
  arms(1.02, 0.06, 0.23);
  const happy = capture();
  restore();
  const pose = (name, frames, times) => new AnimTrack2(
    name,
    times.at(-1),
    [new AnimData2(1, times)],
    channels.map((_, i) => new AnimData2(rest[i].length, frames.flatMap((frame) => frame[i]))),
    channels.map(({ path }, i) => new AnimCurve2([path], 0, i, INTERPOLATION_LINEAR2))
  );
  restore();
  const hips = model.findByName("Hips"), hipPosition = hips.getLocalPosition().clone();
  hips.setLocalPosition(hipPosition.x, hipPosition.y - 0.2, hipPosition.z);
  for (const side of ["Left", "Right"]) {
    const thigh = model.findByName(side + "UpLeg"), shin = model.findByName(side + "Leg"), foot = model.findByName(side + "Foot");
    const origin = thigh.getPosition().clone(), upper = origin.distance(shin.getPosition()), lower = shin.getPosition().distance(foot.getPosition());
    aim(thigh, shin, origin.clone().add(new Vec39(0, -0.04, upper)));
    aim(shin, foot, shin.getPosition().clone().add(new Vec39(0, -lower, 0.035)));
  }
  arms(0.67, 0.27, 0.12);
  const seated = capture();
  arms(0.94, 0.22, 0.1);
  const eating = capture();
  restore();
  const loop = (track, name) => {
    const start = Math.min(...track.inputs.map((input) => input.data[0]));
    return new AnimTrack2(name, track.duration - start, track.inputs.map((input) => new AnimData2(input.components, Array.from(input.data, (t) => t - start))), track.outputs, track.curves);
  };
  const tracks2 = [
    ...source.filter((track) => !["Idle", "CarryWalk", "CarryRun"].includes(track.name)),
    loop(walking, "Walk"),
    balancedRun(model, running),
    loop(authoredCarryWalk, "CarryWalk"),
    loop(authoredCarryRun, "CarryRun"),
    loop(idle, "Idle"),
    pose("CarryIdle", [carry, carry], [0, 2]),
    pose("EatSit", [rest, seated, seated, eating, seated, seated, rest], [0, 0.55, 0.9, 1.55, 2.15, 3.6, 4.2]),
    pose("PickUp", [rest, reach, carry], [0, 0.4, 0.8]),
    pose("PutDown", [carry, reach, rest], [0, 0.4, 0.8]),
    pose("Celebrate", [rest, happy, happy, rest], [0, 0.3, 0.7, 1]),
    pose("SitCar", [rest, rest], [0, 2])
  ];
  if (chore) for (const [kind, name, y, z, bend] of [["wipe", "Wipe", 0.02, 0.29, 80], ["vacuum", "Vacuum", 0.6, 0.32, 12]]) {
    const data = chore[kind], frames = data.samples.map((sample) => {
      restore();
      if (kind === "wipe") crouch();
      const workingSpine = spine;
      workingSpine.setRotation(new Quat2().mul2(new Quat2().setFromAxisAngle(axis, bend), workingSpine.getRotation()));
      arms(y, z, 0.09, sample);
      return capture();
    });
    tracks2.push(pose(name, frames, frames.map((_, i) => i / data.fps)));
    restore();
  }
  const manifest = {
    animations: tracks2.map((track) => ({ name: track.name, duration_seconds: track.duration, loop: !["PickUp", "PutDown", "Celebrate"].includes(track.name) })),
    scale: { rest_height_m: 1.20309758 },
    locomotion: { Walk: { travel_speed_mps: WALK_SPEED }, Run: { travel_speed_mps: RUN_SPEED }, CarryWalk: { travel_speed_mps: WALK_SPEED }, CarryRun: { travel_speed_mps: RUN_SPEED } },
    interaction_events: { PickUp: [{ time_seconds: 0.4, event: "attach" }], PutDown: [{ time_seconds: 0.4, event: "release" }] },
    hand_joints: ["LeftHand", "RightHand"],
    action_playback: 1,
    walk_playback: 1
  };
  return { tracks: tracks2, manifest };
}
var init_MeshyGameplayAdapter = __esm({
  "src/components/MeshyGameplayAdapter.ts"() {
    "use strict";
    init_MovementPace();
    init_RunningPose();
  }
});

// src/components/CharacterAnimator.ts
import { AnimStateGraph, Mat4, Vec3 as Vec310, math, SEMANTIC_BLENDINDICES, SEMANTIC_BLENDWEIGHT } from "playcanvas";
var CharacterAnimator;
var init_CharacterAnimator = __esm({
  "src/components/CharacterAnimator.ts"() {
    "use strict";
    CharacterAnimator = class {
      constructor(visual, placeholder) {
        this.visual = visual;
        this.placeholder = placeholder;
      }
      visual;
      placeholder;
      model = null;
      manifest = null;
      scale = 1;
      frameScale = 1;
      clips = /* @__PURE__ */ new Map();
      state = "";
      time = 0;
      carrying = false;
      idleClip = "Idle";
      workClip = null;
      carryPace = "run";
      action = null;
      socket = null;
      hands = [];
      inverse = new Mat4();
      grip = new Vec310();
      facing = new Vec310();
      faceTarget = null;
      lastEvent = null;
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
        const tracks2 = new Map(animations.map((track) => [track.name, track]));
        for (const clip of manifest.animations) {
          const track = tracks2.get(clip.name);
          if (!track || Math.abs(track.duration - clip.duration_seconds) > 0.01) throw new Error("Missing or mismatched Arianna clip: " + clip.name);
        }
        const hands = (manifest.hand_joints ?? ["hand.L", "hand.R"]).map((name) => model.findByName(name)).filter(Boolean);
        if (hands.length !== 2) throw new Error("Arianna hand joints are missing.");
        model.addComponent("anim", { activate: true });
        model.anim.loadStateGraph(new AnimStateGraph({
          layers: [{
            name: "Base",
            states: [{ name: "START" }, ...manifest.animations.map((clip) => ({ name: clip.name, speed: 1, loop: clip.loop }))],
            transitions: [{ from: "START", to: "Idle" }]
          }],
          parameters: {}
        }));
        for (const clip of manifest.animations) model.anim.assignAnimation(clip.name, tracks2.get(clip.name), void 0, 1, clip.loop);
        this.model = model;
        this.manifest = manifest;
        this.scale = scale;
        for (const clip of manifest.animations) this.clips.set(clip.name, tracks2.get(clip.name));
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
      /** Events use the imported clip clock, not guessed wall-clock delays. */
      playAction(name, fallbackDuration, commit, target) {
        const duration = this.clips.get(name)?.duration ?? fallbackDuration;
        const eventTime = this.manifest?.interaction_events[name]?.[0]?.time_seconds ?? fallbackDuration / 2;
        const rate = name === "PickUp" || name === "PutDown" ? this.manifest?.action_playback ?? 3 : 1;
        this.action = { name, elapsed: 0, duration, eventTime, rate, fired: false, commit };
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
        const gaitBlend = ["Walk", "Run", "CarryWalk", "CarryRun"].includes(this.state) && ["Walk", "Run", "CarryWalk", "CarryRun"].includes(name);
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
            this.lastEvent = { name: this.manifest?.interaction_events[action.name]?.[0]?.event ?? action.name, clip: action.name, time: action.elapsed };
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
          hands: this.hands.map((hand) => hand.getPosition().toArray()),
          socket: this.socket?.getPosition().toArray(),
          materials: this.model?.findComponents("render").flatMap((render) => render.meshInstances.map((mesh) => mesh.material.name)),
          feet: (this.manifest?.hand_joints ? ["LeftFoot", "RightFoot", "LeftToeBase", "RightToeBase"] : ["foot.L", "foot.R", "toe.L", "toe.R"]).map((name) => this.model?.findByName(name)?.getPosition().toArray())
        };
      }
      /** Read-only CPU skinning for development QA; never called by the game loop. */
      geometrySnapshot() {
        const result = [];
        for (const render of this.model?.findComponents("render") ?? []) for (const instance of render.meshInstances) {
          const skin = instance.skinInstance;
          if (!skin) continue;
          const positions = [], joints = [], weights = [];
          const vertices = instance.mesh.getPositions(positions);
          instance.mesh.getVertexStream(SEMANTIC_BLENDINDICES, joints);
          instance.mesh.getVertexStream(SEMANTIC_BLENDWEIGHT, weights);
          const matrices = skin.bones.map((bone, i) => new Mat4().mul2(bone.getWorldTransform(), skin.skin.inverseBindPose[i]));
          let minY = Infinity, maxY = -Infinity, leftSole = Infinity, rightSole = Infinity;
          const source = new Vec310(), transformed = new Vec310(), world = new Vec310();
          for (let v = 0; v < vertices; v++) {
            source.set(positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]);
            world.set(0, 0, 0);
            let foot = "";
            for (let influence = 0; influence < 4; influence++) {
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
    };
  }
});

// src/components/CharacterGrounding.ts
var CharacterGrounding;
var init_CharacterGrounding = __esm({
  "src/components/CharacterGrounding.ts"() {
    "use strict";
    CharacterGrounding = class {
      constructor(root, player, alignment) {
        this.player = player;
        this.alignment = alignment;
        this.surfaces = root.findComponents("render").filter((render) => /(?:floor|rug|runner|mat)$/i.test(render.entity.name)).flatMap((render) => render.meshInstances.map((mesh) => ({ entity: render.entity, oval: render.type === "cylinder", bounds: mesh.aabb.clone() })));
      }
      player;
      alignment;
      surfaceHeight = null;
      surfaces;
      update() {
        const p = this.player.getPosition();
        let ground = 0;
        for (const { entity, oval, bounds } of this.surfaces) {
          if (!entity.enabled) continue;
          const x = (p.x - bounds.center.x) / bounds.halfExtents.x, z = (p.z - bounds.center.z) / bounds.halfExtents.z;
          if (oval ? x * x + z * z <= 1 : Math.abs(x) <= 1 && Math.abs(z) <= 1) ground = Math.max(ground, bounds.center.y + bounds.halfExtents.y);
        }
        this.alignment.setLocalPosition(0, (this.surfaceHeight ?? ground) + 2e-3 - p.y, 0);
      }
    };
  }
});

// src/components/RestingPose.ts
import { AnimCurve as AnimCurve3, AnimData as AnimData3, AnimTrack as AnimTrack3, Quat as Quat3, Vec3 as Vec311, INTERPOLATION_LINEAR as INTERPOLATION_LINEAR3 } from "playcanvas";
function bedEntryTrack(model, source, sleep) {
  const bindings = source.curves.map((c) => ({ curve: c, path: c.paths[0] })), nodes = bindings.map((b) => model.findByName(b.path.entityPath.at(-1)));
  const read = () => nodes.map((n, i) => bindings[i].path.propertyPath[0] === "localRotation" ? n.getLocalRotation().toArray() : bindings[i].path.propertyPath[0] === "localPosition" ? n.getLocalPosition().toArray() : n.getLocalScale().toArray());
  const rest = read(), apply = (frame) => nodes.forEach((n, i) => {
    const v = frame[i], p = bindings[i].path.propertyPath[0];
    if (p === "localRotation") n.setLocalRotation(...v);
    else if (p === "localPosition") n.setLocalPosition(...v);
    else n.setLocalScale(...v);
  });
  const meshy = !!model.findByName("Hips"), hips = model.findByName(meshy ? "Hips" : "pelvis"), initial = hips.getLocalPosition().clone();
  const bone = (s, p) => model.findByName(meshy ? s + { arm: "Arm", fore: "ForeArm", hand: "Hand", thigh: "UpLeg", shin: "Leg", foot: "Foot" }[p] : { arm: "upper_arm", fore: "forearm", hand: "hand", thigh: "thigh", shin: "shin", foot: "foot" }[p] + "." + s[0]);
  const aim = (n, child, d) => n.setRotation(new Quat3().mul2(new Quat3().setFromDirections(child.getPosition().clone().sub(n.getPosition()).normalize(), d.normalize()), n.getRotation()));
  const frames = [];
  for (let stage = 0; stage < 4; stage++) {
    apply(rest);
    hips.setLocalPosition(initial.x, [initial.y, initial.y - 0.12, 0.17, 0.12][stage], initial.z);
    for (const [s, sign] of [["Left", 1], ["Right", -1]]) {
      aim(bone(s, "arm"), bone(s, "fore"), stage === 1 ? new Vec311(sign * 0.2, 0.25, 0.8) : stage === 2 ? new Vec311(sign * 0.25, -0.3, 0.7) : new Vec311(sign * 0.12, -1, 0.06));
      aim(bone(s, "fore"), bone(s, "hand"), stage === 1 ? new Vec311(0, 0.2, 0.8) : new Vec311(0, -0.7, 0.35));
      const tuck = stage >= 2 ? 1 : stage === 1 && s === "Left" ? 0.6 : 0;
      aim(bone(s, "thigh"), bone(s, "shin"), new Vec311(sign * 0.04, -1 + tuck, tuck));
      aim(bone(s, "shin"), bone(s, "foot"), new Vec311(0, -1, stage >= 2 ? -0.15 : 0));
    }
    frames.push(read());
  }
  frames.push(bindings.map((b, i) => Array.from(sleep.outputs[sleep.curves[i].output].data.slice(0, rest[i].length))));
  apply(rest);
  return new AnimTrack3("SleepEnter", 3.2, [new AnimData3(1, [0, 0.5, 1.2, 1.9, 3.2])], bindings.map((_, i) => new AnimData3(rest[i].length, frames.flatMap((f) => f[i]))), bindings.map(({ curve }, i) => new AnimCurve3(curve.paths, 0, i, INTERPOLATION_LINEAR3)));
}
function sleepingTrack(model, source, motion) {
  const bindings = source.curves.map((c) => ({ curve: c, path: c.paths[0] }));
  const nodes = bindings.map((b) => model.findByName(b.path.entityPath.at(-1)));
  const read = (i) => bindings[i].path.propertyPath[0] === "localRotation" ? nodes[i].getLocalRotation().toArray() : bindings[i].path.propertyPath[0] === "localPosition" ? nodes[i].getLocalPosition().toArray() : nodes[i].getLocalScale().toArray();
  const rest = nodes.map((_, i) => read(i));
  const restore = () => nodes.forEach((n, i) => {
    const v = rest[i], p = bindings[i].path.propertyPath[0];
    if (p === "localRotation") n.setLocalRotation(...v);
    else if (p === "localPosition") n.setLocalPosition(...v);
    else n.setLocalScale(...v);
  });
  const meshy = !!model.findByName("Hips"), bone = (side, part) => model.findByName(meshy ? side + { thigh: "UpLeg", shin: "Leg", foot: "Foot", arm: "Arm", fore: "ForeArm", hand: "Hand" }[part] : { thigh: "thigh", shin: "shin", foot: "foot", arm: "upper_arm", fore: "forearm", hand: "hand" }[part] + "." + side[0]);
  const hips = model.findByName(meshy ? "Hips" : "pelvis"), chest = model.findByName(meshy ? "Spine02" : "chest");
  const aim = (n, child, direction) => {
    const from = child.getPosition().clone().sub(n.getPosition()).normalize();
    n.setRotation(new Quat3().mul2(new Quat3().setFromDirections(from, direction.clone().normalize()), n.getRotation()));
  };
  const frames = [];
  for (let f = 0; f <= 24; f++) {
    restore();
    const breath = Math.sin(f / 24 * Math.PI * 2) * 3e-3;
    for (const [side, knee, elbow] of [["Left", motion.leftKnee, motion.leftElbow], ["Right", motion.rightKnee, motion.rightElbow]]) {
      const sign = side === "Left" ? 1 : -1, rad = knee * Math.PI / 180;
      aim(bone(side, "thigh"), bone(side, "shin"), new Vec311(sign * 0.05, -Math.cos(rad / 2), Math.sin(rad / 2)));
      aim(bone(side, "shin"), bone(side, "foot"), new Vec311(0, -Math.cos(rad / 2), -Math.sin(rad / 2)));
      aim(bone(side, "arm"), bone(side, "fore"), new Vec311(sign * 0.15, -1, 0.05));
      aim(bone(side, "fore"), bone(side, "hand"), new Vec311(-sign * 0.12, -1, Math.sin(elbow * Math.PI / 180) * 0.4));
    }
    chest.rotateLocal(breath * 50, 0, 0);
    hips.setRotation(new Quat3().mul2(new Quat3().setFromEulerAngles(-90, 0, 0), hips.getRotation()));
    const p = hips.getLocalPosition().clone();
    hips.setLocalPosition(p.x, 0.12 + breath, 0);
    frames.push(nodes.map((_, i) => read(i)));
  }
  frames[24] = frames[0];
  restore();
  return new AnimTrack3("Sleep", 4, [new AnimData3(1, frames.map((_, i) => i / 6))], bindings.map((_, i) => new AnimData3(rest[i].length, frames.flatMap((f) => f[i]))), bindings.map(({ curve }, i) => new AnimCurve3(curve.paths, 0, i, INTERPOLATION_LINEAR3)));
}
var init_RestingPose = __esm({
  "src/components/RestingPose.ts"() {
    "use strict";
  }
});

// src/components/CharacterVisual.ts
import { Asset as Asset3, BoundingBox as BoundingBox5, Entity as Entity13 } from "playcanvas";
function createCharacter(app) {
  const player = new Entity13("Arianna", app);
  app.root.addChild(player);
  player.setPosition(0, 0.09, 0.9);
  const visual = new Entity13("Character visual pivot", app);
  player.addChild(visual);
  visual.setLocalEulerAngles(0, 30, 0);
  const placeholder = new Entity13("Temporary capsule", app);
  visual.addChild(placeholder);
  const shape = primitives(app, placeholder);
  const lilac = material("Arianna lavender", "#b294dc");
  const cream = material("Arianna cream", "#ffe5cc");
  const rose = material("Arianna pink", "#efafc7");
  const ink = material("Arianna eyes", "#5e4c6b");
  shape("Capsule body", "capsule", [0, 0.47, 0], [0.51, 0.72, 0.45], lilac);
  shape("Placeholder head", "sphere", [0, 0.94, 0], [0.49, 0.47, 0.46], cream);
  shape("Left shoe", "capsule", [-0.14, 0.1, 0.06], [0.21, 0.19, 0.3], rose);
  shape("Right shoe", "capsule", [0.14, 0.1, 0.06], [0.21, 0.19, 0.3], rose);
  for (const x of [-0.095, 0.095]) shape("Eye", "sphere", [x, 0.97, 0.215], [0.052, 0.061, 0.03], ink, false);
  for (const x of [-0.15, 0.15]) shape("Cheek", "sphere", [x, 0.895, 0.202], [0.065, 0.034, 0.025], rose, false);
  const marker = primitives(app, player)("Player floor marker", "cylinder", [0, -0.027, 0], [0.72, 0.012, 0.72], material("Player marker", "#efe0f6"), false);
  marker.render.receiveShadows = false;
  const animator = new CharacterAnimator(visual, placeholder);
  return { player, visual, placeholder, animator, grounding: null };
}
async function loadArianna(app, character, resolveAsset = (path) => assetUrl(`${"/"}${path}`)) {
  const configResponse = await fetch(resolveAsset("assets/characters/arianna/character.json"));
  if (!configResponse.ok) return;
  const config = await configResponse.json();
  if (!config.url) return;
  const response = await fetch(resolveAsset(`assets/characters/arianna/${config.manifest}`));
  if (!response.ok) throw new Error("Arianna manifest could not load.");
  let manifest = await response.json();
  const asset = new Asset3("Arianna GLB", "container", { url: resolveAsset(`assets/characters/arianna/${config.url}`) });
  await new Promise((resolve, reject) => {
    asset.once("load", () => resolve());
    asset.once("error", reject);
    app.assets.add(asset);
    app.assets.load(asset);
  });
  const resource = asset.resource;
  const model = resource.instantiateRenderEntity({ castShadows: true });
  let tracks2 = (resource.animations ?? []).map((asset2) => asset2.resource);
  if (config.adapter === "meshy") {
    const motion = await fetch(resolveAsset("assets/animations/chores/cmu-trajectories.json"));
    if (!motion.ok) throw new Error("Chore motion library could not load.");
    ({ tracks: tracks2, manifest } = meshyGameplay(model, tracks2, await motion.json()));
    const sleep = sleepingTrack(model, tracks2.find((t) => t.name === "Idle"), await (await fetch(resolveAsset("assets/animations/rest/sleep.json"))).json());
    tracks2.push(sleep, bedEntryTrack(model, tracks2.find((t) => t.name === "Idle"), sleep));
    manifest.animations.push({ name: "Sleep", duration_seconds: 4, loop: true }, { name: "SleepEnter", duration_seconds: 3.2, loop: false });
  }
  const bounds = new BoundingBox5();
  let first = true;
  for (const render of model.findComponents("render")) {
    for (const mesh of render.meshInstances) {
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
  const alignment = new Entity13("GLB alignment", app);
  alignment.addChild(model);
  model.setLocalScale(scale, scale, scale);
  alignment.setLocalEulerAngles(0, config.yaw ?? 0, 0);
  character.visual.addChild(alignment);
  try {
    character.animator.attach(model, tracks2, manifest, scale);
  } catch (error) {
    alignment.destroy();
    throw error;
  }
  character.grounding = new CharacterGrounding(app.root, character.player, alignment);
  character.grounding.update();
  character.placeholder.enabled = false;
}
var init_CharacterVisual = __esm({
  "src/components/CharacterVisual.ts"() {
    "use strict";
    init_AssetUrls();
    init_MeshyGameplayAdapter();
    init_primitives();
    init_CharacterAnimator();
    init_CharacterGrounding();
    init_RestingPose();
  }
});

// src/components/PlayerController.ts
import { Keyboard, Vec2, Vec3 as Vec312, KEY_A, KEY_D, KEY_S, KEY_W, KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT } from "playcanvas";
var PlayerController;
var init_PlayerController = __esm({
  "src/components/PlayerController.ts"() {
    "use strict";
    init_MovementPace();
    PlayerController = class {
      constructor(entity, camera, room, joystick) {
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
        this.keyboard = new Keyboard(window, { preventDefault: false });
        window.addEventListener("keydown", (event) => {
          if (event.key === " " && event.target?.closest("button,dialog")) return;
          if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
        }, { signal: this.abort.signal });
        window.addEventListener("blur", this.reset, { signal: this.abort.signal });
        document.addEventListener("visibilitychange", this.reset, { signal: this.abort.signal });
      }
      entity;
      room;
      joystick;
      enabled = true;
      input = new Vec2();
      velocity = new Vec312();
      radius = 0.24;
      speed = RUN_SPEED;
      right;
      forward;
      candidate = new Vec312();
      bounds = [];
      keyboard;
      abort = new AbortController();
      approach = null;
      get approaching() {
        return this.approach !== null;
      }
      /** Find a reachable standing point beside the actual prop, respecting inflated furniture. */
      approachProp(point, arrived, cancelled) {
        const start = this.entity.getPosition().clone(), candidates = [];
        const free = (p) => {
          this.candidate.copy(p);
          return !this.blocked();
        };
        const clear = (p) => {
          const count = Math.ceil(start.distance(p) / 0.06);
          for (let i = 1; i <= count; i++) if (!free(new Vec312().lerp(start, p, i / count))) return false;
          return true;
        };
        for (let radius = 0.32; radius <= 1.8; radius += 0.06) for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 24) {
          const p = new Vec312(point.x + Math.sin(angle) * radius, start.y, point.z + Math.cos(angle) * radius);
          if (p.distance(start) < 2.2 && free(p) && clear(p)) candidates.push(p);
        }
        candidates.sort((a, b) => Math.hypot(a.x - point.x, a.z - point.z) * 3 + a.distance(start) - Math.hypot(b.x - point.x, b.z - point.z) * 3 - b.distance(start));
        if (!candidates.length) {
          cancelled();
          return;
        }
        this.approach = { point: candidates[0], arrived, cancelled };
      }
      setRoom(room) {
        this.room = room;
        this.bounds = room.obstacles.map((box) => {
          const expanded = box.clone();
          expanded.halfExtents.x += this.radius;
          expanded.halfExtents.z += this.radius;
          return expanded;
        });
      }
      axis(positive, negative) {
        return Number(positive.some((key) => this.keyboard.isPressed(key))) - Number(negative.some((key) => this.keyboard.isPressed(key)));
      }
      update(dt) {
        if (!this.enabled) {
          this.input.set(0, 0);
          this.velocity.set(0, 0, 0);
          this.keyboard.update();
          return;
        }
        this.input.copy(this.joystick);
        this.input.x += this.axis([KEY_D, KEY_RIGHT], [KEY_A, KEY_LEFT]);
        this.input.y += this.axis([KEY_W, KEY_UP], [KEY_S, KEY_DOWN]);
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
        for (let i = 0; i < steps; i++) {
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
          for (const x of [this.candidate.x - this.radius, this.candidate.x + this.radius]) {
            for (const z of [this.candidate.z - this.radius, this.candidate.z + this.radius]) {
              if (!this.room.walkable.some((floor) => x >= floor.minX && x <= floor.maxX && z >= floor.minZ && z <= floor.maxZ)) return true;
            }
          }
        }
        return this.bounds.some((box) => box.containsPoint(this.candidate));
      }
      reset = () => {
        const pending = this.approach;
        this.approach = null;
        pending?.cancelled();
        this.keyboard.detach();
        this.keyboard.attach(window);
        this.input.set(0, 0);
        this.velocity.set(0, 0, 0);
      };
      destroy() {
        this.abort.abort();
        this.keyboard.detach();
      }
    };
  }
});

// src/ui/VirtualJoystick.ts
import { Vec2 as Vec22 } from "playcanvas";
var VirtualJoystick;
var init_VirtualJoystick = __esm({
  "src/ui/VirtualJoystick.ts"() {
    "use strict";
    VirtualJoystick = class {
      constructor(element, knob) {
        this.element = element;
        this.knob = knob;
        const options = { signal: this.abort.signal };
        element.addEventListener("pointerdown", this.down, options);
        element.addEventListener("pointermove", this.move, options);
        element.addEventListener("pointerup", this.up, options);
        element.addEventListener("pointercancel", this.up, options);
        element.addEventListener("lostpointercapture", this.up, options);
        window.addEventListener("blur", this.reset, options);
        window.addEventListener("resize", this.reset, options);
        document.addEventListener("visibilitychange", this.reset, options);
        element.addEventListener("contextmenu", (event) => event.preventDefault(), options);
      }
      element;
      knob;
      value = new Vec22();
      pointer = null;
      abort = new AbortController();
      down = (event) => {
        if (this.pointer !== null || event.button !== 0) return;
        event.preventDefault();
        this.pointer = event.pointerId;
        this.element.setPointerCapture(event.pointerId);
        this.element.classList.add("dragging");
        this.move(event);
      };
      move = (event) => {
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
      };
      up = (event) => {
        if (event.pointerId === this.pointer) this.reset();
      };
      reset = () => {
        const id = this.pointer;
        this.pointer = null;
        if (id !== null && this.element.hasPointerCapture(id)) this.element.releasePointerCapture(id);
        this.value.set(0, 0);
        this.knob.style.transform = "";
        this.element.classList.remove("dragging");
      };
      destroy() {
        this.reset();
        this.abort.abort();
      }
    };
  }
});

// src/game/cleanupProps.ts
import { BoundingBox as BoundingBox6, Entity as Entity15, Vec3 as Vec313 } from "playcanvas";
function createCleanupProps(app, room) {
  const root = new Entity15("Cleanup props", app);
  app.root.addChild(root);
  const m = {
    bear: material("Teddy caramel", "#ba865e"),
    muzzle: material("Teddy cream", "#f5d4a3"),
    pink: material("Cleanup rose", "#e486ad"),
    blue: material("Cleanup book blue", "#739fcf"),
    purple: material("Vacuum lavender", "#9c7ac3"),
    cream: material("Cleanup ivory", "#fff0dc"),
    dark: material("Cleanup detail", "#65506e"),
    yellow: material("Crayon yellow", "#f1cd75"),
    mint: material("Crayon mint", "#89b99f"),
    dirt: material("Dust mauve", "#a9949d")
  };
  function item(id, name, icon, home) {
    const entity = new Entity15(name, app);
    root.addChild(entity);
    entity.setLocalPosition(...home);
    return { id, name, icon, entity, home };
  }
  const items = [
    item("teddy", "Teddy", "\u{1F9F8}", [-0.7, 0.11, 1.55]),
    item("shirt", "Shirt", "\u{1F455}", [-1.7, 0.12, 0.55]),
    item("book", "Book", "\u{1F4D8}", [0.25, 0.12, -0.8]),
    item("vacuum", "Vacuum", "\u2726", [4.65, 0.1, 12.15])
  ];
  const teddy = primitives(app, items[0].entity);
  teddy("Teddy body", "sphere", [0, 0.16, 0], [0.3, 0.34, 0.25], m.bear);
  teddy("Teddy head", "sphere", [0, 0.4, 0], [0.33, 0.3, 0.28], m.bear);
  for (const x of [-0.13, 0.13]) {
    teddy("Teddy ear", "sphere", [x, 0.52, 0], [0.13, 0.13, 0.09], m.bear);
    teddy("Teddy foot", "sphere", [x, 0.045, 0.07], [0.15, 0.12, 0.18], m.bear);
    teddy("Teddy paw", "sphere", [x * 1.4, 0.2, 0], [0.12, 0.2, 0.13], m.bear);
    teddy("Teddy eye", "sphere", [x * 0.5, 0.43, 0.135], [0.035, 0.04, 0.02], m.dark, false);
  }
  teddy("Teddy muzzle", "sphere", [0, 0.36, 0.13], [0.15, 0.1, 0.075], m.muzzle);
  const shirt = primitives(app, items[1].entity);
  shirt("Shirt body", "box", [0, 0.035, 0], [0.4, 0.055, 0.46], m.pink);
  for (const x of [-0.26, 0.26]) {
    const sleeve = shirt("Sleeve", "box", [x, 0.035, -0.14], [0.22, 0.06, 0.18], m.pink);
    sleeve.setLocalEulerAngles(0, x < 0 ? -25 : 25, 0);
  }
  shirt("Shirt flower", "sphere", [0, 0.065, -0.04], [0.13, 0.012, 0.13], m.cream, false);
  const book = primitives(app, items[2].entity);
  book("Book pages", "box", [0, 0.055, 0], [0.36, 0.09, 0.46], m.cream);
  for (const y of [5e-3, 0.11]) book("Book cover", "box", [0, y, 0], [0.4, 0.02, 0.5], m.blue);
  book("Book spine", "box", [-0.19, 0.055, 0], [0.025, 0.12, 0.5], m.blue);
  book("Cover star", "sphere", [0, 0.125, 0], [0.12, 0.012, 0.12], m.yellow, false);
  items[3].carryPace = "walk";
  items[3].carryGrip = [0, 0.92, 0];
  items[3].carriedScale = 0.75;
  const vacuum = primitives(app, items[3].entity);
  vacuum("Vacuum head", "box", [0, 0.06, 0.12], [0.45, 0.13, 0.3], m.purple);
  vacuum("Vacuum tank", "capsule", [0, 0.36, 0], [0.24, 0.49, 0.21], m.purple);
  vacuum("Vacuum handle", "cylinder", [0, 0.72, 0], [0.055, 0.44, 0.055], m.dark);
  vacuum("Vacuum grip", "box", [0, 0.92, 0], [0.23, 0.06, 0.07], m.dark);
  const fixed = primitives(app, root);
  const hamperPosition = [-2.55, 0, 1];
  fixed("Laundry hamper", "cylinder", [-2.55, 0.33, 1], [0.67, 0.64, 0.67], m.cream);
  fixed("Hamper opening", "cylinder", [-2.55, 0.655, 1], [0.53, 0.013, 0.53], m.purple, false);
  for (const y of [0.14, 0.28, 0.42, 0.56]) fixed("Hamper weave", "cylinder", [-2.55, y, 1], [0.69, 0.025, 0.69], m.muzzle);
  room.obstacles.push(new BoundingBox6(new Vec313(...hamperPosition), new Vec313(0.35, 1, 0.35)));
  const crayonMess = new Entity15("Scattered crayons", app);
  root.addChild(crayonMess);
  crayonMess.setLocalPosition(2.23, 1.2, 0.97);
  const crayons = primitives(app, crayonMess);
  [m.pink, m.blue, m.yellow, m.mint].forEach((mat, i) => {
    const pen = crayons("Scattered crayon", "cylinder", [-0.33 + i * 0.2, 0.015, i % 2 * 0.17], [0.065, 0.31, 0.065], mat);
    pen.setLocalEulerAngles(90, i * 43, 0);
  });
  const tidyCrayons = new Entity15("Tidy crayon cup", app);
  root.addChild(tidyCrayons);
  tidyCrayons.setLocalPosition(1.86, 1.14, 1.05);
  const tidy = primitives(app, tidyCrayons);
  tidy("Pencil cup", "cylinder", [0, 0.1, 0], [0.2, 0.2, 0.2], m.purple);
  [m.pink, m.blue, m.yellow, m.mint].forEach((mat, i) => tidy("Tidy crayon", "cylinder", [(i % 2 - 0.5) * 0.07, 0.22, (Math.floor(i / 2) - 0.5) * 0.07], [0.045, 0.25, 0.045], mat));
  tidyCrayons.enabled = false;
  const dirt = new Entity15("Dirt pile", app);
  root.addChild(dirt);
  dirt.setLocalPosition(-1.4, 0.085, 2.65);
  const dust = primitives(app, dirt);
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4;
    dust("Dust clump", "sphere", [Math.sin(a) * 0.24, 0.012, Math.cos(a) * 0.24], [0.25 + i % 2 * 0.12, 0.05, 0.23], m.dirt, false);
  }
  const interactions = items.map((item2) => ({
    id: `pickup-${item2.id}`,
    name: item2.name,
    icon: item2.icon,
    kind: "pickup",
    item: item2.id,
    anchor: new Vec313(...item2.home),
    marker: new Vec313(item2.home[0], item2.home[1] + (item2.id === "vacuum" ? 0.82 : 0.62), item2.home[2]),
    range: 0.85
  }));
  interactions.push(
    { id: "toy-chest", name: "Toy chest", icon: "\u{1F9F8}", kind: "place", item: "teddy", task: "teddy", anchor: new Vec313(2.48, 0, -0.79), marker: new Vec313(2.48, 1.45, -1.55), range: 1.1, placement: [2.48, 0.85, -1.55] },
    { id: "hamper", name: "Laundry hamper", icon: "\u{1F455}", kind: "place", item: "shirt", task: "shirt", anchor: new Vec313(-2.55, 0, 1), marker: new Vec313(-2.55, 1.04, 1), range: 1.05, placement: [-2.55, 0.69, 1] },
    { id: "bookshelf", name: "Bookshelf", icon: "\u{1F4D8}", kind: "place", item: "book", task: "book", anchor: new Vec313(1.12, 0, -2.55), marker: new Vec313(1.12, 2.35, -3.05), range: 1.05, placement: [1.51, 0.79, -2.99] },
    { id: "crayons", name: "Crayons", icon: "\u{1F58D}", kind: "crayons", task: "crayons", anchor: new Vec313(1.6, 0, 1.05), marker: new Vec313(2.15, 1.68, 1.04), range: 0.88 },
    { id: "dirt", name: "Dirt pile", icon: "\u2726", kind: "vacuum", item: "vacuum", task: "dirt", anchor: new Vec313(-1.4, 0, 2.65), marker: new Vec313(-1.4, 0.55, 2.65), range: 1 }
  );
  const reset = () => {
    for (const item2 of items) {
      item2.entity.reparent(root);
      item2.entity.setLocalPosition(...item2.home);
      item2.entity.setLocalEulerAngles(0, 0, 0);
      item2.entity.setLocalScale(1, 1, 1);
      item2.entity.enabled = true;
    }
    crayonMess.enabled = true;
    crayonMess.setLocalScale(1, 1, 1);
    dirt.enabled = true;
    dirt.setLocalScale(1, 1, 1);
    tidyCrayons.enabled = false;
  };
  return { root, items, interactions, crayonMess, tidyCrayons, dirt, reset };
}
var init_cleanupProps = __esm({
  "src/game/cleanupProps.ts"() {
    "use strict";
    init_primitives();
  }
});

// src/game/ImportedProp.ts
import { Asset as Asset4, BoundingBox as BoundingBox7 } from "playcanvas";
async function importProp(app, parent, name, height, idle = false, rotation = [0, 0, 0]) {
  const asset = new Asset4(name, "container", { url: assetUrl(`${"/"}assets/pets/${name}.glb`) });
  await new Promise((resolve, reject) => {
    asset.once("load", resolve);
    asset.once("error", reject);
    app.assets.add(asset);
    app.assets.load(asset);
  });
  const resource = asset.resource, model = resource.instantiateRenderEntity();
  parent.addChild(model);
  model.setLocalEulerAngles(...rotation);
  const bounds = new BoundingBox7();
  let first = true;
  for (const component of model.findComponents("render")) for (const mesh of component.meshInstances) {
    if (first) {
      bounds.copy(mesh.aabb);
      first = false;
    } else bounds.add(mesh.aabb);
  }
  const origin = parent.getPosition(), scale = height / (bounds.halfExtents.y * 2);
  model.setLocalScale(scale, scale, scale);
  model.setLocalPosition(-(bounds.center.x - origin.x) * scale, -(bounds.center.y - bounds.halfExtents.y - origin.y) * scale, -(bounds.center.z - origin.z) * scale);
  if (idle && resource.animations.length) {
    const clip = resource.animations.find((a) => /idle/i.test(a.resource.name)) ?? resource.animations[0];
    model.addComponent("anim", { activate: true });
    model.anim.assignAnimation("Idle", clip.resource, void 0, 1, true);
    const walk = resource.animations.find((a) => /^walk$/i.test(a.resource.name));
    if (walk) model.anim.assignAnimation("Walk", walk.resource, void 0, 1, true);
  }
  return model;
}
var init_ImportedProp = __esm({
  "src/game/ImportedProp.ts"() {
    "use strict";
    init_AssetUrls();
  }
});

// src/game/DogAnimator.ts
import { BoundingBox as BoundingBox8, Vec3 as Vec314 } from "playcanvas";
var DogAnimator;
var init_DogAnimator = __esm({
  "src/game/DogAnimator.ts"() {
    "use strict";
    DogAnimator = class {
      constructor(root, model) {
        this.root = root;
        this.model = model;
        this.previous.copy(root.getPosition());
        const bounds = new BoundingBox8();
        let first = true;
        for (const component of model.findComponents("render")) for (const mesh of component.meshInstances) {
          if (first) {
            bounds.copy(mesh.aabb);
            first = false;
          } else bounds.add(mesh.aabb);
        }
        this.height = bounds.halfExtents.y * 2;
        model.anim.playing = false;
        model.anim.baseLayer.transition("Idle", 0);
        model.anim.update(0);
      }
      root;
      model;
      previous = new Vec314();
      state = "Idle";
      speed = 0;
      height = 0;
      update(dt) {
        const p = this.root.getPosition(), distance = Math.hypot(p.x - this.previous.x, p.z - this.previous.z);
        this.previous.copy(p);
        if (dt <= 0) return;
        this.speed = distance < 0.1 ? distance / dt : 0;
        const next = this.speed > 0.015 ? "Walk" : "Idle";
        if (next !== this.state) {
          this.state = next;
          this.model.anim.baseLayer.transition(next, 0.16);
        }
        this.model.anim.speed = next === "Walk" ? Math.max(0.35, Math.min(2.5, this.speed / 0.2)) : 1;
        this.model.anim.update(dt);
      }
      snapshot() {
        return { state: this.state, speed: this.speed, time: this.model.anim.baseLayer.activeStateCurrentTime, position: this.root.getPosition().toArray(), height: this.height, asset: "sunny-pup.glb" };
      }
    };
  }
});

// src/game/PetCleanup.ts
import { Entity as Entity17, Vec3 as Vec315 } from "playcanvas";
var PET_TASKS, PetCleanup;
var init_PetCleanup = __esm({
  "src/game/PetCleanup.ts"() {
    "use strict";
    init_ImportedProp();
    init_primitives();
    init_DogAnimator();
    PET_TASKS = [{ id: "pet-care", name: "Scoop \xB7 flush \xB7 wash", icon: "\u{1F43E}", room: "Living room & bathroom" }];
    PetCleanup = class {
      constructor(app, props) {
        this.props = props;
        const tool = new Entity17("Pooper scooper", app);
        props.root.addChild(tool);
        this.tool = { id: "scooper", name: "Scooper", icon: "\u{1F944}", entity: tool, home: [3.8, 0.04, 3], carryPace: "walk" };
        tool.setLocalPosition(...this.tool.home);
        props.items.push(this.tool);
        this.poop = new Entity17("Dog poop", app);
        props.root.addChild(this.poop);
        this.poop.setLocalPosition(3.7, 0.04, 5.3);
        const dog = this.dog = new Entity17("Sunny pup", app);
        props.root.addChild(dog);
        dog.setLocalPosition(4.8, 0.04, 5.85);
        const paper = new Entity17("Bathroom toilet paper", app);
        props.root.addChild(paper);
        paper.setLocalPosition(6.21, 0.7, -0.8);
        const soap = new Entity17("Hand soap", app);
        props.root.addChild(soap);
        soap.setLocalPosition(3.96, 0.9, -3.24);
        void Promise.all([
          importProp(app, tool, "shovel", 0.75, false, [180, 0, 0]),
          importProp(app, this.poop, "poop", 0.18),
          importProp(app, dog, "sunny-pup", 0.48, true).then((model) => {
            this.dogAnimator = new DogAnimator(dog, model);
          }),
          importProp(app, paper, "paper", 0.24),
          importProp(app, soap, "soap", 0.21)
        ]).then(() => {
          this.loaded = true;
          dog.setLocalEulerAngles(0, 30, 0);
        }).catch((error) => {
          this.errors.push(String(error));
          console.error("Pet assets failed to load", error);
        });
        const shape = primitives(app, props.root), mint = material("Clean water", "#9bdae7");
        this.water = shape("Toilet flushing water", "cylinder", [5.78, 0.48, -0.36], [0.33, 0.015, 0.28], mint, false);
        this.bubbles = new Entity17("Handwashing bubbles", app);
        props.root.addChild(this.bubbles);
        this.bubbles.setLocalPosition(4.1, 0.98, -2.98);
        const bubble = primitives(app, this.bubbles);
        for (let i = 0; i < 8; i++) bubble("Soap bubble", "sphere", [Math.sin(i * 2) * 0.17, i % 3 * 0.065, Math.cos(i * 2) * 0.12], [0.08, 0.08, 0.08], mint, false);
        props.interactions.push(
          { id: "pickup-scooper", name: "Scooper", icon: "\u{1F944}", kind: "pickup", item: "scooper", task: "pet-care", anchor: new Vec315(...this.tool.home), marker: new Vec315(3.8, 1, 3), range: 0.85, available: (carried) => this.loaded && this.stage === "tool" && !carried },
          { id: "scoop-poop", name: "Dog poop", icon: "\u{1F4A9}", kind: "pet", actionLabel: "Scoop", task: "pet-care", item: "scooper", anchor: new Vec315(3.7, 0, 5.3), marker: new Vec315(3.7, 0.55, 5.3), range: 0.9, available: (carried) => this.stage === "scoop" && carried === "scooper" },
          { id: "flush-poop", name: "Toilet", icon: "\u{1F6BD}", kind: "pet", actionLabel: "Flush", task: "pet-care", item: "scooper", anchor: new Vec315(5.15, 0, -0.38), marker: new Vec315(5.87, 1, -0.38), range: 0.85, available: (carried) => this.stage === "flush" && carried === "scooper" },
          { id: "wash-hands", name: "Wash your hands", icon: "\u{1FAE7}", kind: "pet", actionLabel: "Wash hands", task: "pet-care", anchor: new Vec315(4.12, 0, -2.35), marker: new Vec315(4.1, 1.45, -3.08), range: 0.9, available: (carried) => this.stage === "wash" && !carried }
        );
        this.reset(false);
      }
      props;
      stage = "tool";
      active = false;
      loaded = false;
      errors = [];
      tool;
      poop;
      dog;
      dogAnimator;
      bubbles;
      water;
      flushStart = 0;
      allows(target) {
        return !this.active || this.stage !== "wash" || target.task === "pet-care";
      }
      pickedUp() {
        if (this.stage === "tool") this.stage = "scoop";
      }
      scoop() {
        if (this.stage !== "scoop") return;
        this.poop.reparent(this.tool.entity);
        this.poop.setLocalPosition(0, 0.08, 0.045);
        this.stage = "flush";
      }
      flush(now) {
        if (this.stage !== "flush") return;
        this.poop.reparent(this.props.root);
        this.poop.setLocalPosition(5.78, 0.5, -0.36);
        this.flushStart = now;
        this.stage = "wash";
        this.tool.entity.enabled = false;
      }
      update(now, washProgress = 0, hands) {
        this.bubbles.enabled = this.active && washProgress > 0;
        if (this.bubbles.enabled) {
          if (hands) this.bubbles.setPosition(hands);
          this.bubbles.setLocalEulerAngles(0, now / 8, 0);
          this.bubbles.setLocalScale(1 + washProgress * 0.4, 1, 1);
        }
        this.water.enabled = this.active && this.flushStart > 0 && now - this.flushStart < 900;
        if (this.water.enabled) {
          const t = Math.min(1, (now - this.flushStart) / 900), size = Math.max(0.01, 1 - t);
          this.poop.setLocalPosition(5.78 + Math.cos(t * 14) * 0.09 * size, 0.5 - t * 0.17, -0.36 + Math.sin(t * 14) * 0.09 * size);
          this.poop.setLocalScale(size, size, size);
          this.water.setLocalEulerAngles(0, t * 400, 0);
        } else if (this.stage === "wash" || this.stage === "done") this.poop.enabled = false;
      }
      finish() {
        this.stage = "done";
        this.bubbles.enabled = false;
      }
      reset(active) {
        this.active = active;
        this.stage = "tool";
        this.flushStart = 0;
        this.tool.entity.reparent(this.props.root);
        this.tool.entity.setLocalPosition(...this.tool.home);
        this.tool.entity.setLocalEulerAngles(0, 0, 0);
        this.tool.entity.enabled = active;
        this.poop.reparent(this.props.root);
        this.poop.setLocalPosition(3.7, 0.04, 5.3);
        this.poop.setLocalScale(1, 1, 1);
        this.poop.enabled = active;
        this.water.enabled = false;
        this.bubbles.enabled = false;
      }
      get hint() {
        if (!this.active || this.stage === "done") return null;
        return { tool: "\u{1F43E} Pick up the scooper by the landing, then find the poop.", scoop: "\u{1F944} Carry the scooper to the dog poop, then tap Scoop.", flush: "\u{1F6BD} Take the loaded scooper to the bathroom toilet and tap Flush.", wash: "\u{1FAE7} Almost done! Go to the bathroom sink and wash your hands." }[this.stage];
      }
      snapshot() {
        return { stage: this.stage, loaded: this.loaded, errors: this.errors, poopVisible: this.poop.enabled, poopParent: this.poop.parent?.name, washing: this.bubbles.enabled, flushing: this.water.enabled };
      }
    };
  }
});

// src/systems/DailyClock.ts
var DUST_LOCATIONS, SPILL_LOCATIONS, DAILY_TASKS, AFTERNOON_EXTRAS, afternoonCatalog, DailyClock;
var init_DailyClock = __esm({
  "src/systems/DailyClock.ts"() {
    "use strict";
    DUST_LOCATIONS = [[1.2, 5.2], [3.3, 6.1], [1.1, 7.2], [1, 8.3], [0.2, 10.6], [2.2, 11.6]];
    SPILL_LOCATIONS = [[0.1, 11.1], [1.7, 10.7], [-0.8, 11.5]];
    DAILY_TASKS = {
      morning: [{ id: "teeth", name: "Brush teeth", icon: "\u{1FAA5}" }, { id: "outfit", name: "Choose clothes", icon: "\u{1F455}" }, { id: "breakfast", name: "Make breakfast", icon: "\u{1F373}" }],
      school: [],
      afternoon: [{ id: "dust-0", name: "Vacuum", icon: "\u2726" }, { id: "dust-1", name: "Vacuum", icon: "\u2726" }, { id: "dust-2", name: "Vacuum", icon: "\u2726" }, { id: "spill", name: "Wipe kitchen spill", icon: "\u{1F9FB}" }, { id: "laundry-clothes", name: "Put laundry in washer", icon: "\u{1F455}" }],
      night: [{ id: "teeth", name: "Brush teeth", icon: "\u{1FAA5}" }, { id: "outfit", name: "Put clothes away", icon: "\u{1F455}" }, { id: "read", name: "Bedtime book", icon: "\u{1F4D8}" }]
    };
    AFTERNOON_EXTRAS = [
      { id: "laundry-clothes", name: "Put laundry in washer", icon: "\u{1F455}" },
      { id: "living-toy", name: "Put toys away", icon: "\u{1F9F8}" },
      { id: "kitchen-dish", name: "Take dish to sink", icon: "\u{1F37D}" },
      { id: "kitchen-trash", name: "Recycle trash", icon: "\u267B" },
      { id: "bath-towel", name: "Hang a towel", icon: "\u25A4" },
      { id: "hall-shoes", name: "Put shoes away", icon: "\u{1F45F}" },
      { id: "hall-mail", name: "Sort the mail", icon: "\u2709" },
      { id: "living-cushion", name: "Straighten a cushion", icon: "\u2661" },
      { id: "laundry-clean", name: "Put folded clothes away", icon: "\u25A4" },
      { id: "bath-bottle", name: "Put toiletries away", icon: "\u2667" },
      { id: "book", name: "Put a book away", icon: "\u{1F4D8}" }
    ];
    afternoonCatalog = [...DAILY_TASKS.afternoon, ...AFTERNOON_EXTRAS, { id: "feed-dog", name: "Fill puppy\u2019s bowl", icon: "\u{1F43E}" }, { id: "pet-care", name: "Scoop \xB7 flush \xB7 wash", icon: "\u{1F43E}" }];
    DailyClock = class {
      constructor(random = Math.random, saved) {
        this.random = random;
        this.state = this.newDay(1);
        const s = saved;
        if (s?.version === 1 && Number.isInteger(s.day) && s.day > 0 && ["morning", "school", "afternoon", "night"].includes(s.phase) && Number.isFinite(s.minutes) && s.minutes >= 420 && s.minutes <= 1260 && Array.isArray(s.done) && s.done.every((x) => typeof x === "string") && Array.isArray(s.dust) && s.dust.length === 3 && new Set(s.dust).size === 3 && s.dust.every((x) => Number.isInteger(x) && x >= 0 && x < DUST_LOCATIONS.length) && ["eggs", "spill", "cook", "serve", "done"].includes(s.breakfast) && [true, false, null].includes(s.eggDrop) && Number.isFinite(s.schoolSeconds)) this.state = structuredClone(s);
      }
      random;
      state;
      newDay(day) {
        const random = () => Math.max(0, Math.min(1 - Number.EPSILON, this.random()));
        const pool = DUST_LOCATIONS.map((_, i) => i), dust = [];
        while (dust.length < 3) dust.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
        const chores = [...AFTERNOON_EXTRAS];
        for (let i = chores.length - 1; i > 0; i--) {
          const j = Math.floor(random() * (i + 1));
          [chores[i], chores[j]] = [chores[j], chores[i]];
        }
        const petTask = random() < 0.5 ? "feed-dog" : "pet-care";
        const afternoonTasks = ["dust-0", random() < 0.5 ? "dust-1" : "spill", chores[0].id, chores[1].id, petTask];
        return { afternoonTasks, version: 1, day, minutes: 420, phase: "morning", done: [], eggDrop: null, breakfast: "eggs", dust, schoolSeconds: 0, petTask, spillSite: Math.floor(random() * SPILL_LOCATIONS.length), sideTask: ["laundry-clothes", "living-toy", "kitchen-dish"][Math.floor(random() * 3)] };
      }
      get tasks() {
        if (this.state.phase === "afternoon" && Array.isArray(this.state.afternoonTasks) && this.state.afternoonTasks.length === 5 && new Set(this.state.afternoonTasks).size === 5 && this.state.afternoonTasks.every((id) => afternoonCatalog.some((t) => t.id === id))) return this.state.afternoonTasks.map((id) => afternoonCatalog.find((t) => t.id === id));
        const tasks = DAILY_TASKS[this.state.phase];
        if (this.state.phase !== "afternoon" || !this.state.petTask) return tasks;
        return [...tasks.filter((t) => t.id !== "dust-2" && t.id !== "laundry-clothes"), this.state.sideTask === "living-toy" ? { id: "living-toy", name: "Put toys away", icon: "\u{1F9F8}" } : this.state.sideTask === "kitchen-dish" ? { id: "kitchen-dish", name: "Take dish to sink", icon: "\u{1F37D}" } : { id: "laundry-clothes", name: "Put laundry in washer", icon: "\u{1F455}" }, this.state.petTask === "feed-dog" ? { id: "feed-dog", name: "Fill puppy\u2019s bowl", icon: "\u{1F43E}" } : { id: "pet-care", name: "Scoop \xB7 flush \xB7 wash", icon: "\u{1F43E}" }];
      }
      get ready() {
        return this.tasks.every((t) => this.state.done.includes(t.id));
      }
      get canShop() {
        return this.state.phase === "afternoon" && this.state.minutes < 1140;
      }
      get schoolDue() {
        return this.state.phase === "morning" && (this.ready || this.state.minutes >= 510);
      }
      get canSleep() {
        return this.state.phase === "night" && (this.ready || this.state.minutes >= 1260);
      }
      complete(id) {
        if (!this.tasks.some((t) => t.id === id) || this.state.done.includes(id)) return false;
        this.state.done.push(id);
        return true;
      }
      crackEgg() {
        if (this.state.eggDrop === null) this.state.eggDrop = this.random() < 0.5;
        this.state.breakfast = this.state.eggDrop ? "spill" : "cook";
      }
      goSchool() {
        if (!this.schoolDue) return false;
        this.state.phase = "school";
        this.state.minutes = 510;
        this.state.schoolSeconds = 3;
        return true;
      }
      sleep(early = false) {
        if (!this.canSleep && !(early && this.state.phase === "afternoon" && this.ready)) return false;
        const old = this.state, next = this.newDay(old.day + 1);
        if (next.sideTask === old.sideTask) next.sideTask = old.sideTask === "laundry-clothes" ? "living-toy" : old.sideTask === "living-toy" ? "kitchen-dish" : "laundry-clothes";
        if (next.dust.slice(0, 2).every((i) => old.dust.slice(0, 2).includes(i))) next.dust = next.dust.map((i) => (i + 2) % DUST_LOCATIONS.length);
        if (next.afternoonTasks?.slice().sort().join() === old.afternoonTasks?.slice().sort().join()) {
          const choices = AFTERNOON_EXTRAS.filter((t) => !next.afternoonTasks.includes(t.id));
          next.afternoonTasks[2] = choices[Math.floor(this.random() * choices.length)].id;
        }
        this.state = next;
        return true;
      }
      advance(seconds) {
        if (!Number.isFinite(seconds) || seconds <= 0) return;
        if (this.state.phase === "school") {
          this.state.schoolSeconds = Math.max(0, this.state.schoolSeconds - seconds);
          if (!this.state.schoolSeconds) {
            this.state.phase = "afternoon";
            this.state.minutes = 900;
            this.state.done = [];
          }
          return;
        }
        this.state.minutes += seconds * 0.5;
        if (this.state.phase === "morning") this.state.minutes = Math.min(510, this.state.minutes);
        if (this.state.phase === "afternoon" && this.state.minutes >= 1140 && this.ready) {
          this.state.phase = "night";
          this.state.minutes = 1140;
          this.state.done = [];
        }
        if (this.state.phase === "afternoon") this.state.minutes = Math.min(1140, this.state.minutes);
        if (this.state.phase === "night") this.state.minutes = Math.min(1260, this.state.minutes);
      }
      get label() {
        const m = Math.floor(this.state.minutes), h = Math.floor(m / 60);
        return `${h > 12 ? h - 12 : h}:${String(m % 60).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
      }
    };
  }
});

// src/game/LilahMesses.ts
import { Entity as Entity18, Vec3 as Vec316 } from "playcanvas";
var LilahMesses;
var init_LilahMesses = __esm({
  "src/game/LilahMesses.ts"() {
    "use strict";
    init_SaveNamespace();
    init_primitives();
    LilahMesses = class {
      constructor(app, parent, props, active) {
        this.props = props;
        this.active = active;
        const colors = ["#db9fc9", "#accce1", "#e6c779", "#b3c59f"].map((c, i) => material("Lilah toy " + i, c));
        const juice = material("Lilah juice", "#e5b763"), crumb = material("Lilah cracker crumbs", "#ba9363");
        for (let i = 0; i < 3; i++) {
          const root = new Entity18("Lilah " + this.kinds[i], app);
          parent.addChild(root);
          this.roots.push(root);
          root.enabled = false;
          const shape = primitives(app, root);
          for (let n = 0; n < (i === 0 ? 4 : 8); n++) shape(
            this.kinds[i],
            i === 0 ? "box" : "sphere",
            [Math.sin(n * 2.4) * 0.23, i === 0 ? 0.07 : 0.018, Math.cos(n * 2.4) * 0.2],
            i === 0 ? [0.13, 0.13, 0.13] : i === 1 ? [0.3, 0.025, 0.25] : [0.09, 0.035, 0.08],
            i === 0 ? colors[n] : i === 1 ? juice : crumb,
            false
          );
          const id = "lilah-mess-" + i;
          props.interactions.push({
            id,
            task: id,
            kind: "daily",
            name: ["Lilah\u2019s toy trail", "Lilah\u2019s juice spill", "Lilah\u2019s crumbs"][i],
            icon: ["\u{1F9F8}", "\u{1F9FB}", "\u2726"][i],
            actionLabel: ["Tidy Lilah\u2019s toys", "Hold to wipe", "Hold to vacuum"][i],
            anchor: new Vec316(),
            marker: new Vec316(),
            range: 1,
            duration: i === 0 ? 600 : 1200,
            hold: i !== 0,
            mess: root,
            available: (held) => this.active() && !!this.records[i] && !this.records[i].done && (i === 0 ? !held : held === (i === 1 ? "paper-towel" : "vacuum"))
          });
        }
      }
      props;
      active;
      day = 0;
      records = [];
      roots = [];
      tasks = [];
      kinds = ["toys", "spill", "crumbs"];
      onClean = (_actor) => {
      };
      syncDay(day) {
        if (this.day === day) return;
        this.day = day;
        this.records = [];
        try {
          const saved = JSON.parse(localStorage.getItem(saveKey("lilah.v1")) || "null");
          if (saved?.day === day && Array.isArray(saved.messes) && saved.messes.length <= 3 && saved.messes.every((m) => Number.isFinite(m.x) && Number.isFinite(m.z) && typeof m.done === "boolean")) this.records = saved.messes;
        } catch {
        }
        this.refresh();
      }
      save(records2) {
        try {
          localStorage.setItem(saveKey("lilah.v1"), JSON.stringify({ day: this.day, messes: records2 }));
          return true;
        } catch {
          return false;
        }
      }
      refresh() {
        this.tasks = this.records.map((_, i) => ({ id: "lilah-mess-" + i, name: ["Lilah\u2019s toys", "Lilah\u2019s spill", "Lilah\u2019s crumbs"][i], icon: ["\u{1F9F8}", "\u{1F9FB}", "\u2726"][i] }));
        this.roots.forEach((root, i) => {
          const m = this.records[i];
          root.enabled = !!m && !m.done;
          root.setLocalScale(1, 1, 1);
          if (m) {
            root.setLocalPosition(m.x, 0.035, m.z);
            const target = this.props.interactions.find((t) => t.id === "lilah-mess-" + i);
            target.anchor.set(m.x, 0, m.z);
            target.marker.set(m.x, 0.3, m.z);
          }
        });
      }
      get count() {
        return this.records.length;
      }
      get activeCount() {
        return this.records.filter((m) => !m.done).length;
      }
      get completed() {
        return this.records.flatMap((m, i) => m.done ? ["lilah-mess-" + i] : []);
      }
      needs(kind) {
        const i = this.kinds.indexOf(kind);
        return !!this.records[i] && !this.records[i].done;
      }
      add(position) {
        if (this.count >= 3 || this.activeCount >= 2) return false;
        const records2 = [...this.records, { x: position.x, z: position.z, done: false }];
        if (!this.save(records2)) return false;
        this.records = records2;
        this.refresh();
        return true;
      }
      complete(id, actor = "arianna") {
        const i = this.tasks.findIndex((t) => t.id === id);
        if (i < 0 || this.records[i].done) return false;
        const records2 = this.records.map((m, j) => j === i ? { ...m, done: true, cleanedBy: actor } : m);
        if (!this.save(records2)) return false;
        this.records = records2;
        this.roots[i].enabled = false;
        this.onClean(actor);
        return true;
      }
      snapshot() {
        return { day: this.day, messes: this.records.map((m, i) => ({ ...m, id: "lilah-mess-" + i, kind: this.kinds[i], visible: this.roots[i].enabled })), budget: 3 };
      }
    };
  }
});

// src/game/DailyLife.ts
import { BoundingBox as BoundingBox9, Entity as Entity19, Vec3 as Vec317 } from "playcanvas";
var SAVE_KEY, DailyLife;
var init_DailyLife = __esm({
  "src/game/DailyLife.ts"() {
    "use strict";
    init_SaveNamespace();
    init_PropSpace();
    init_DailyClock();
    init_ImportedProp();
    init_HouseArt();
    init_primitives();
    init_LilahMesses();
    SAVE_KEY = saveKey("daily.v1");
    DailyLife = class {
      constructor(app, props, house) {
        this.props = props;
        let saved;
        try {
          saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
        } catch {
        }
        this.clock = new DailyClock(Math.random, saved);
        this.root = new Entity19("Daily routines", app);
        props.root.addChild(this.root);
        this.lilahMesses = new LilahMesses(app, this.root, props, () => this.active && this.clock.state.phase !== "school");
        this.lilahMesses.syncDay(this.clock.state.day);
        this.lilahTarget = { id: "play-lilah", name: "Play with Lilah", actionLabel: "Play with Lilah", icon: "\u{1F495}", kind: "daily", anchor: new Vec317(), marker: new Vec317(), range: 1.1, duration: 650, available: (h) => this.active && this.lilahAvailable && !h };
        props.interactions.push(this.lilahTarget);
        const shape = primitives(app, this.root), m = house.materials;
        const item = (id, name, icon, home) => {
          const entity = new Entity19(name, app);
          this.root.addChild(entity);
          entity.setLocalPosition(...home);
          const it = { id, name, icon, home, entity };
          props.items.push(it);
          return it;
        };
        this.outfit = item("daily-outfit", "Clothes", "\u{1F455}", [-0.7, 0.7, 3.05]);
        const clothes = primitives(app, this.outfit.entity);
        clothes("Shirt", "box", [0, 0.03, 0], [0.38, 0.06, 0.32], m.pink);
        for (const x of [-0.23, 0.23]) clothes("Sleeve", "box", [x, 0.03, -0.1], [0.18, 0.06, 0.15], m.pink);
        const art = new HouseArt(app, this.root);
        art.add("furniture", "sideTableDrawers", [-0.7, 0.025, 3.05], 0.85, 180);
        void art.finish();
        house.obstacles.push(new BoundingBox9(new Vec317(-0.7, 0.5, 3.05), new Vec317(0.35, 1, 0.35)));
        this.towel = item("paper-towel", "Paper towel", "\u{1F9FB}", [-2.65, 1.02, 10.5]);
        void importProp(app, this.towel.entity, "paper", 0.23);
        this.egg = item("breakfast-egg", "Egg", "\u{1F95A}", [-2.68, 1.15, 14.55]);
        const eggShape = primitives(app, this.egg.entity);
        eggShape("Egg placeholder", "sphere", [0, 0.1, 0], [0.14, 0.2, 0.14], m.trim);
        const pan = shape("Breakfast pan", "cylinder", [-2.63, 1.08, 12.65], [0.55, 0.06, 0.55], m.dark);
        shape("Pan handle", "box", [-2.2, 1.09, 12.65], [0.5, 0.04, 0.08], m.dark);
        this.cooked = new Entity19("Cooked breakfast", app);
        this.root.addChild(this.cooked);
        this.cooked.setLocalPosition(...propTuple("stove", [-2.63, 1.12, 12.65]));
        const food = primitives(app, this.cooked);
        food("Egg white", "sphere", [0, 0, 0], [0.37, 0.025, 0.3], m.trim);
        food("Egg yolk", "sphere", [0, 0.025, 0], [0.15, 0.05, 0.15], m.yellow);
        this.plate = item("breakfast-plate", "Egg on a plate", "\u{1F373}", [-2.63, 1.13, 12.65]);
        this.plate.carryPace = "walk";
        const plate = primitives(app, this.plate.entity);
        plate("Breakfast plate rim", "cylinder", [0, 0, 0], [0.53, 0.035, 0.53], m.blue);
        plate("Breakfast plate", "cylinder", [0, 0.021, 0], [0.46, 0.012, 0.46], m.trim);
        plate("Plated egg white", "sphere", [0, 0.039, 0], [0.35, 0.025, 0.3], m.trim);
        plate("Plated egg yolk", "sphere", [0, 0.06, 0], [0.15, 0.055, 0.15], m.yellow);
        const makeSpill = (name, position) => {
          const root = new Entity19(name, app);
          this.root.addChild(root);
          root.setLocalPosition(...position);
          const s = primitives(app, root);
          for (let i = 0; i < 7; i++) s("Puddle", "sphere", [Math.sin(i * 2) * 0.22, 0.01, Math.cos(i * 2) * 0.16], [0.35, 0.022, 0.3], i === 0 ? m.yellow : m.trim, false);
          return root;
        };
        this.spill = makeSpill("Kitchen spill", [0.1, 0.04, 11.1]);
        this.eggSpill = makeSpill("Dropped egg", [-1.5, 0.04, 12.55]);
        const dustMaterial = material("House dust", "#a69182");
        for (let k = 0; k < 3; k++) {
          const root = new Entity19("Random dirt " + k, app);
          this.root.addChild(root);
          const s = primitives(app, root);
          for (let i = 0; i < 10; i++) s("Dust fleck", "sphere", [Math.sin(i * 2) * 0.26, 0.016, Math.cos(i * 2) * 0.24], [0.18, 0.045, 0.15], dustMaterial, false);
          this.dust.push(root);
        }
        this.bubbles = new Entity19("Routine feedback", app);
        this.root.addChild(this.bubbles);
        const b = primitives(app, this.bubbles);
        for (let i = 0; i < 6; i++) b("Foam", "sphere", [Math.sin(i) * 0.12, i * 0.025, Math.cos(i) * 0.1], [0.065, 0.065, 0.065], m.sky, false);
        this.wipingPaper = shape("Paper wiping the floor", "box", [0, 0.09, 0], [0.28, 0.012, 0.23], m.trim, false);
        this.wipingPaper.enabled = false;
        shape("Toothbrush cup", "cylinder", [4.4, 0.99, -3.04], [0.13, 0.17, 0.13], m.blue);
        shape("Toothbrush", "box", [4.4, 1.15, -3.04], [0.025, 0.24, 0.025], m.pink);
        shape("Toothbrush bristles", "box", [4.4, 1.28, -3.02], [0.035, 0.065, 0.04], m.trim);
        const target = (id, name, icon, anchor, marker, available, duration = 650, task, hold = false, mess) => {
          props.interactions.push({ id, name, icon, kind: "daily", actionLabel: name, anchor: new Vec317(...anchor), marker: new Vec317(...marker), range: 1, task, duration, hold, mess, available: (carried) => this.active && available(carried) });
        };
        const phase = () => this.clock.state.phase, notDone = (id) => !this.clock.state.done.includes(id);
        shape("Puppy bowl", "cylinder", [4.95, 0.1, 8.55], [0.48, 0.16, 0.48], m.blue);
        shape("Puppy bowl inside", "cylinder", [4.95, 0.185, 8.55], [0.37, 0.012, 0.37], m.dark);
        this.dogFood = shape("Puppy kibble", "sphere", [4.95, 0.19, 8.55], [0.33, 0.055, 0.33], material("Kibble", "#b58655"));
        target("feed-dog", "Fill puppy\u2019s bowl", "\u{1F43E}", [4.8, 0, 8.8], [4.95, 0.2, 8.55], (h) => !h && phase() === "afternoon" && this.clock.state.petTask === "feed-dog" && notDone("feed-dog"), 1400, "feed-dog");
        target("daily-teeth", "Brush teeth", "\u{1FAA5}", [4.12, 0, -2.35], [4.12, 1.15, -3.03], (h) => !h && (phase() === "morning" || phase() === "night") && notDone("teeth"), 1800, "teeth");
        target("choose-clothes", "Choose clothes", "\u{1F455}", [-0.7, 0, 2.4], [-0.7, 0.8, 3.05], (h) => !h && phase() === "morning" && notDone("outfit"), 0);
        target("get-dressed", "Get dressed", "\u{1F455}", [-0.85, 0, -0.65], [-1.35, 0.9, -0.65], (h) => h === "daily-outfit" && phase() === "morning", 850, "outfit");
        target("night-clothes", "Pick up clothes", "\u{1F455}", [-0.85, 0, -0.65], [-1.35, 0.9, -0.65], (h) => !h && phase() === "night" && notDone("outfit"), 0);
        target("clothes-drawer", "Put clothes inside", "\u{1F455}", [-0.7, 0, 2.4], [-0.7, 0.8, 3.05], (h) => h === "daily-outfit" && phase() === "night", 0, "outfit");
        target("take-egg", "Take an egg", "\u{1F95A}", [-1.8, 0, 14.55], [-2.6, 1.1, 14.55], (h) => !h && phase() === "morning" && this.clock.state.breakfast === "eggs", 0);
        target("crack-egg", "Crack egg", "\u{1F95A}", [-1.8, 0, 12.65], [-2.63, 1.15, 12.65], (h) => h === "breakfast-egg", 0);
        target("cook-egg", "Cook breakfast", "\u{1F373}", [-1.8, 0, 12.65], [-2.63, 1.15, 12.65], (h) => !h && phase() === "morning" && this.clock.state.breakfast === "cook", 2200);
        target("take-breakfast", "Carry breakfast", "\u{1F373}", [-1.8, 0, 12.65], [-2.63, 1.15, 12.65], (h) => !h && phase() === "morning" && this.clock.state.breakfast === "serve" && this.clock.state.breakfastAtTable === false, 0);
        target("serve-breakfast", "Put breakfast on table", "\u{1F37D}", [0.55, 0, 11.9], [0.55, 0.9, 13.15], (h) => h === "breakfast-plate", 0);
        target("eat-breakfast", "Eat breakfast", "\u{1F37D}", [0.55, 0, 11.9], [0.55, 0.9, 13.15], (h) => !h && phase() === "morning" && this.clock.state.breakfast === "serve" && this.clock.state.breakfastAtTable !== false, 4200, "breakfast");
        target("take-towel", "Take paper towel", "\u{1F9FB}", [-1.8, 0, 10.5], [-2.65, 1.15, 10.5], (h) => !h && (this.clock.state.breakfast === "spill" || phase() === "afternoon" && this.needsTask("spill") || this.lilahMesses.needs("spill")), 0);
        target("wipe-egg", "Wipe dropped egg", "\u{1F9FB}", [-1.5, 0, 12.55], [-1.5, 0.12, 12.55], (h) => h === "paper-towel" && this.clock.state.breakfast === "spill", 1200, void 0, true, this.eggSpill);
        target("wipe-spill", "Wipe spill", "\u{1F9FB}", [0.1, 0, 11.1], [0.1, 0.12, 11.1], (h) => h === "paper-towel" && phase() === "afternoon" && notDone("spill"), 1200, "spill", true, this.spill);
        const vacuum = props.items.find((i) => i.id === "vacuum");
        target("daily-vacuum", "Pick up vacuum", "\u2726", vacuum.home, [vacuum.home[0], 1, vacuum.home[2]], (h) => !h && (phase() === "afternoon" && this.clock.tasks.some((t) => t.id.startsWith("dust-") && notDone(t.id)) || this.lilahMesses.needs("crumbs")), 0);
        for (let i = 0; i < 3; i++) target("vacuum-" + i, "Hold to vacuum", "\u2726", [0, 0, 0], [0, 0.3, 0], (h) => h === "vacuum" && phase() === "afternoon" && this.clock.tasks.some((t) => t.id === "dust-" + i) && notDone("dust-" + i), 1150, "dust-" + i, true, this.dust[i]);
        target("put-tool-away", "Put tool away", "\u21A9", [0, 0, 0], [0, 0.8, 0], (h) => h === "vacuum" || h === "paper-towel", 0);
        target("bedtime-book", "Read a bedtime book", "\u{1F4D8}", [-0.85, 0, -0.8], [-1.4, 0.9, -0.8], (h) => !h && phase() === "night" && notDone("read"), 1600, "read");
        target("school-door", "Go to school", "\u{1F392}", [-2.35, 0, 8.2], [-3.1, 1.1, 8.2], (h) => !h && this.clock.schoolDue, 0);
        target("shop-door", "Choose a store", "\u{1F6CD}", [-2.35, 0, 8.2], [-3.1, 1.1, 8.2], (h) => !h && this.clock.canShop && this.clock.ready, 0);
        target("sleep", "Go to bed", "\u{1F319}", [-0.85, 0, -1.6], [-1.4, 0.8, -1.6], (h) => !h && this.canSleep, 6500);
        target("lilah-bed", "Put Lilah to bed", "\u{1F319}", [8.55, 0, -1.3], [9.1, 0.9, -1.7], (h) => !h && this.clock.state.minutes >= 1095 && ["afternoon", "night"].includes(phase()) && !this.clock.state.lilahAsleep, 1e3);
        this.refresh();
        void pan;
      }
      props;
      clock;
      active = false;
      shoppingDone = false;
      onLilahBed = () => {
      };
      get canSleep() {
        return this.tasks.every((t) => this.completed.includes(t.id)) && (this.clock.state.phase === "night" || this.clock.state.phase === "afternoon" && this.shoppingDone);
      }
      needsTask(id) {
        return this.clock.tasks.some((t) => t.id === id) && !this.clock.state.done.includes(id);
      }
      root;
      outfit;
      towel;
      egg;
      plate;
      dust = [];
      spill;
      eggSpill;
      lilahMesses;
      lilahTarget;
      lilahAvailable = false;
      onPlayLilah = () => {
      };
      taskCache = [];
      taskKey = "";
      cooked;
      bubbles;
      wipingPaper;
      dogFood;
      eggFall = 0;
      held = null;
      last = 0;
      lastSave = 0;
      phase = "";
      onPhaseChange = () => {
      };
      onReward = () => {
      };
      onStore = () => {
      };
      get tasks() {
        const key = this.clock.state.phase + "-" + this.clock.state.day + "-" + this.lilahMesses.count;
        if (key !== this.taskKey) {
          this.taskKey = key;
          this.taskCache = [...this.clock.tasks, ...this.lilahMesses.tasks];
        }
        return this.taskCache;
      }
      get completed() {
        return [...this.clock.state.done, ...this.lilahMesses.completed];
      }
      get bowlPosition() {
        return this.dogFood.getPosition().clone();
      }
      get hasDogFood() {
        return this.dogFood.enabled;
      }
      consumeDogFood() {
        if (!this.hasDogFood) return;
        this.clock.state.dogFoodEmpty = true;
        this.dogFood.enabled = false;
        this.save();
      }
      save() {
        try {
          localStorage.setItem(SAVE_KEY, JSON.stringify(this.clock.state));
        } catch {
          document.querySelector("#save-message").textContent = "Daily progress could not be saved.";
        }
      }
      setActive(active) {
        this.active = active;
        this.root.enabled = active;
        this.last = 0;
        this.refresh();
      }
      refresh() {
        const s = this.clock.state;
        const spill = SPILL_LOCATIONS[s.spillSite ?? 0] ?? SPILL_LOCATIONS[0];
        this.spill.setLocalPosition(spill[0], 0.04, spill[1]);
        const spillTarget = this.props.interactions.find((t) => t.id === "wipe-spill");
        spillTarget.anchor.set(spill[0], 0, spill[1]);
        spillTarget.marker.set(spill[0], 0.12, spill[1]);
        this.dogFood.enabled = !s.dogFoodEmpty && (s.done.includes("feed-dog") || s.phase !== "afternoon" || s.petTask !== "feed-dog");
        this.lilahMesses.syncDay(s.day);
        this.lilahMesses.refresh();
        if (s.done.includes("pet-care")) {
          this.props.pet?.finish();
          this.props.pet.poop.enabled = false;
        }
        for (const mess of [...this.dust, this.spill, this.eggSpill]) mess.setLocalScale(1, 1, 1);
        for (let i = 0; i < 3; i++) {
          const p = DUST_LOCATIONS[s.dust[i]], t = this.props.interactions.find((t2) => t2.id === "vacuum-" + i);
          this.dust[i].setLocalPosition(p[0], 0.04, p[1]);
          t.anchor.set(p[0], 0, p[1]);
          t.marker.set(p[0], 0.35, p[1]);
          this.dust[i].enabled = s.phase === "afternoon" && this.clock.tasks.some((t2) => t2.id === "dust-" + i) && !s.done.includes("dust-" + i);
        }
        this.spill.enabled = s.phase === "afternoon" && this.needsTask("spill");
        this.eggSpill.enabled = s.breakfast === "spill" && s.phase === "morning";
        this.cooked.enabled = s.phase === "morning" && s.breakfast === "cook";
        this.cooked.setLocalPosition(-2.63, 1.12, 12.65);
        this.plate.entity.reparent(this.root);
        this.plate.entity.enabled = s.phase === "morning" && s.breakfast === "serve";
        this.plate.entity.setLocalPosition(...s.breakfastAtTable === false ? this.plate.home : propTuple("dining", [0.55, 0.975, 13.28]));
        this.props.items.find((i) => i.id === "vacuum").entity.enabled = s.phase === "afternoon" || this.lilahMesses.needs("crumbs");
        for (const item of [this.outfit, this.towel, this.egg]) if (item.entity.parent !== this.root) {
          item.entity.reparent(this.root);
          item.entity.setLocalPosition(...item.home);
        }
        this.outfit.entity.enabled = (s.phase === "morning" || s.phase === "night") && !s.done.includes("outfit");
        this.outfit.entity.setLocalPosition(...s.phase === "night" ? propTuple("bed", [-1.4, 0.91, -0.65]) : this.outfit.home);
        this.egg.entity.enabled = s.phase === "morning" && s.breakfast === "eggs";
        this.egg.entity.setLocalEulerAngles(0, 0, 0);
        this.towel.entity.enabled = true;
        this.bubbles.enabled = false;
        this.wipingPaper.enabled = false;
        this.eggFall = 0;
      }
      pause(now) {
        this.last = now;
      }
      developerPhase(phase, nextDay = false) {
        const s = this.clock.state;
        if (nextDay) s.day++;
        if (s.phase !== phase || nextDay) s.done = [];
        s.phase = phase;
        s.minutes = phase === "morning" ? 420 : phase === "afternoon" ? 900 : 1140;
        s.schoolSeconds = 0;
        if (phase === "morning") {
          s.breakfast = s.done.includes("breakfast") ? "done" : "eggs";
          s.eggDrop = null;
        }
        this.phase = phase;
        this.pause(performance.now());
        this.refresh();
        this.save();
      }
      developerComplete() {
        this.clock.state.done = this.clock.tasks.map((t) => t.id);
        if (this.clock.state.phase === "morning") this.clock.state.breakfast = "done";
        for (const task of this.lilahMesses.tasks) this.lilahMesses.complete(task.id);
        this.refresh();
        this.save();
      }
      update(now, held, busy) {
        if (!this.active) {
          this.last = now;
          return;
        }
        this.held = held;
        this.lilahMesses.syncDay(this.clock.state.day);
        if (this.lilahMesses.needs("crumbs")) this.props.items.find((i) => i.id === "vacuum").entity.enabled = true;
        if (this.eggFall) {
          const t = Math.min(1, (now - this.eggFall) / 420);
          this.egg.entity.setLocalPosition(...propTuple("stove", [-2.63 + 1.13 * t, 1.12 * (1 - t * t), 12.65 - 0.1 * t]));
          this.egg.entity.setLocalEulerAngles(0, 0, t * 140);
          if (t === 1) {
            this.eggFall = 0;
            this.egg.entity.enabled = false;
            this.eggSpill.enabled = true;
          }
        }
        if (this.last && !document.hidden && !busy) this.clock.advance(Math.min(2, (now - this.last) / 1e3));
        this.last = now;
        if (this.phase !== this.clock.state.phase && !busy) {
          this.phase = this.clock.state.phase;
          this.onPhaseChange();
        }
        if (now - this.lastSave > 1e3) {
          this.lastSave = now;
          this.save();
        }
        const tool = this.props.interactions.find((t) => t.id === "put-tool-away");
        const pos = held === "vacuum" ? this.props.items.find((i) => i.id === "vacuum").home : this.towel.home;
        tool.anchor.set(...pos);
        tool.marker.set(pos[0], pos[1] + 0.8, pos[2]);
      }
      complete(id) {
        if (id.startsWith("lilah-mess-")) {
          if (!this.lilahMesses.complete(id)) return false;
          this.onReward(`day-${this.clock.state.day}-${id}`);
          return true;
        }
        if (this.clock.complete(id)) {
          this.onReward(`day-${this.clock.state.day}-${this.clock.state.phase}-${id}`);
          this.save();
          return true;
        }
        return false;
      }
      perform(target, carry) {
        const take = (item) => {
          item.entity.enabled = true;
          carry.pickUp(item);
        };
        const release = () => {
          const item = carry.item;
          if (item) {
            carry.release(this.root, item.home);
            item.entity.enabled = false;
          }
        };
        if (target.id.startsWith("lilah-mess-")) {
          if (this.complete(target.id) && target.hold && carry.item?.id === "paper-towel") release();
          this.save();
          return;
        }
        switch (target.id) {
          case "feed-dog":
            this.clock.state.dogFoodEmpty = false;
            this.dogFood.enabled = true;
            break;
          case "play-lilah":
            this.onPlayLilah();
            break;
          case "choose-clothes":
          case "night-clothes":
            take(this.outfit);
            break;
          case "take-egg":
            take(this.egg);
            break;
          case "take-towel":
            take(this.towel);
            break;
          case "daily-vacuum":
            take(this.props.items.find((i) => i.id === "vacuum"));
            break;
          case "put-tool-away": {
            const item = carry.item;
            if (item) {
              carry.release(this.props.root, item.home);
              item.entity.enabled = true;
            }
            break;
          }
          case "crack-egg":
            release();
            this.clock.crackEgg();
            this.eggSpill.enabled = false;
            this.cooked.enabled = this.clock.state.breakfast === "cook";
            if (!this.cooked.enabled) {
              this.egg.entity.enabled = true;
              this.eggFall = performance.now();
            }
            break;
          case "wipe-egg":
            this.eggSpill.enabled = false;
            release();
            this.clock.state.breakfast = "cook";
            this.cooked.enabled = true;
            break;
          case "wipe-spill":
            this.spill.enabled = false;
            release();
            break;
          case "cook-egg":
            this.clock.state.breakfast = "serve";
            this.clock.state.breakfastAtTable = false;
            this.cooked.enabled = false;
            take(this.plate);
            break;
          case "take-breakfast":
            take(this.plate);
            break;
          case "serve-breakfast":
            carry.release(this.root, propTuple("dining", [0.55, 0.975, 13.28]));
            this.clock.state.breakfastAtTable = true;
            break;
          case "eat-breakfast":
            this.plate.entity.enabled = false;
            this.clock.state.breakfast = "done";
            break;
          case "get-dressed":
          case "clothes-drawer":
            release();
            break;
          case "school-door":
            this.clock.goSchool();
            break;
          case "shop-door":
            this.onStore();
            break;
          case "lilah-bed":
            if (!this.clock.state.lilahAsleep) {
              this.clock.state.lilahAsleep = true;
              this.onLilahBed();
              this.onReward(`day-${this.clock.state.day}-lilah-bed`);
            }
            break;
          case "sleep":
            if (this.canSleep) this.clock.sleep(true);
            break;
        }
        if (target.task) this.complete(target.task);
        if (target.mess) target.mess.enabled = false;
        this.save();
      }
      effect(target, progress, hands) {
        this.bubbles.enabled = !!target && target.id === "daily-teeth" && progress > 0;
        if (this.bubbles.enabled) {
          this.bubbles.setPosition(hands);
          this.bubbles.translate(0, 0.24, 0);
        }
        if (target?.mess) {
          const scale = 1 - progress * 0.95;
          target.mess.setLocalScale(scale, scale, scale);
        }
        this.wipingPaper.enabled = !!target && (target.id.startsWith("wipe-") || target.id === "lilah-mess-1") && progress > 0;
        if (this.wipingPaper.enabled && target) {
          this.wipingPaper.setPosition(hands.x, Math.max(0.08, hands.y - 0.035), hands.z);
          this.wipingPaper.setLocalEulerAngles(0, 0, 0);
        }
      }
      get hint() {
        const s = this.clock.state;
        if (s.phase === "school") return "At school \xB7 See you after class!";
        if (this.clock.schoolDue) return "\u{1F392} Time for school. Walk to the front door in the living room.";
        if (s.phase === "morning" && s.breakfast === "spill") return "Oops! Get a paper towel and hold Action over the dropped egg.";
        if (this.canSleep) return "\u{1F319} All done! Walk to your bed whenever you\u2019re ready.";
        if (s.phase === "afternoon") return "After school \xB7 Help a little, then visit two stores. Take your time!";
        return s.phase === "morning" ? "A fresh morning \xB7 Brush, choose clothes, and make breakfast." : "Wind down \xB7 Brush teeth, put clothes away, and read.";
      }
      snapshot() {
        return { ...this.clock.state, clock: this.clock.label, canShop: this.clock.canShop, held: this.held, dirt: this.dust.map((e) => ({ visible: e.enabled, position: e.getPosition().toArray(), scale: e.getLocalScale().toArray() })), eggSpill: this.eggSpill.enabled, lilah: this.lilahMesses.snapshot() };
      }
    };
  }
});

// src/game/RoundMesses.ts
import { Vec3 as Vec318 } from "playcanvas";
var RoundMesses;
var init_RoundMesses = __esm({
  "src/game/RoundMesses.ts"() {
    "use strict";
    init_HousePath();
    init_house();
    RoundMesses = class {
      constructor(props, house) {
        this.props = props;
        this.planner = new HousePath(house, 0.29);
      }
      props;
      planner;
      previous = /* @__PURE__ */ new Map();
      lastTasks = "";
      houseTasks(random = Math.random) {
        const pool = [...HOUSE_TASKS, ...EXTRA_HOUSE_TASKS];
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        let result = pool.slice(0, 6), key = result.map((t) => t.id).sort().join();
        if (key === this.lastTasks) {
          result = [...result.slice(0, 5), pool[6]];
          key = result.map((t) => t.id).sort().join();
        }
        this.lastTasks = key;
        return result;
      }
      apply(mode, random = Math.random) {
        const used = [];
        const bedroom = [[-0.55, 0.2], [0.65, -0.7], [0.45, 1.7], [-0.85, 2.55], [1.3, 2.6], [1.7, -1.5], [0.25, -2.1]];
        const living = [[1.2, 5.2], [3.3, 6.1], [1.1, 7.2], [0.5, 8.2], [3.5, 8.7]];
        const pools = { bedroom, living, kitchen: [[0.2, 10.6], [1.5, 11.4], [-0.6, 11.6], [0.15, 12]], laundry: [[4.55, 10.5], [4.65, 11.8], [5.35, 11.65]], hall: [[4.4, 2.4], [4.5, 1.5], [5.3, 1.8]], bath: [[4.6, -1.4], [4.6, -2.15], [5.1, -0.7]] };
        const choose = (id, pool) => {
          const candidates = pool.map(([x, z]) => new Vec318(x, 0, z)).filter((p2) => this.planner.free(p2.x, p2.z) && used.every((q) => q.distance(p2) > 0.65) && this.planner.route(new Vec318(0, 0, 0.9), p2).length);
          const fresh2 = candidates.filter((p2) => p2.x + "," + p2.z !== this.previous.get(id)), options = fresh2.length ? fresh2 : candidates;
          const p = options[Math.floor(random() * options.length)];
          if (p) {
            used.push(p);
            this.previous.set(id, p.x + "," + p.z);
          }
          return p;
        };
        for (const item of this.props.items) {
          const target = this.props.interactions.find((t) => t.id === "pickup-" + item.id);
          if (!target) continue;
          target.anchor.set(...item.home);
          target.marker.set(item.home[0], item.home[1] + (item.id === "vacuum" ? 0.82 : 0.62), item.home[2]);
          if (mode === "day" || mode === "pet" || !item.entity.enabled || ["vacuum", "scooper"].includes(item.id)) continue;
          const room = item.id.includes("-") ? item.id.split("-")[0] : "bedroom", p = choose(item.id, pools[room] ?? bedroom);
          if (!p) continue;
          item.entity.setLocalPosition(p.x, 0.09, p.z);
          item.entity.setLocalEulerAngles(0, random() * 90 - 45, 0);
          target.anchor.copy(p);
          target.marker.set(p.x, 0.71, p.z);
        }
        if (mode === "day" || mode === "pet") return;
        const dirt = choose("dirt", [...living, ...pools.kitchen]);
        if (dirt) {
          this.props.dirt.setPosition(dirt.x, 0.085, dirt.z);
          const t = this.props.interactions.find((t2) => t2.id === "dirt");
          t.anchor.copy(dirt);
          t.marker.set(dirt.x, 0.55, dirt.z);
        }
        const crayons = choose("crayons", bedroom);
        if (crayons) {
          this.props.crayonMess.setPosition(crayons.x, 0.06, crayons.z);
          const t = this.props.interactions.find((t2) => t2.id === "crayons");
          t.anchor.copy(crayons);
          t.marker.set(crayons.x, 0.6, crayons.z);
        }
      }
    };
  }
});

// src/game/houseProps.ts
import { Entity as Entity20, Vec3 as Vec319 } from "playcanvas";
function createHouseProps(app, house) {
  const props = createCleanupProps(app, house), m = house.materials, extras = [];
  let active = [];
  function pair(id, name, icon, home, destination, anchor, placement, visual, range = 0.95) {
    const entity = new Entity20(name, app);
    props.root.addChild(entity);
    entity.setLocalPosition(...home);
    const item = { id, name, icon, entity, home };
    extras.push(item);
    props.items.push(item);
    const shape = primitives(app, entity);
    if (visual === "toy") {
      shape("Toy body", "sphere", [0, 0.19, 0], [0.34, 0.36, 0.28], m.yellow);
      shape("Toy head", "sphere", [0, 0.44, 0], [0.33, 0.29, 0.27], m.yellow);
      for (const x of [-0.13, 0.13]) shape("Toy ear", "sphere", [x, 0.56, 0], [0.13, 0.13, 0.1], m.yellow);
      for (const x of [-0.065, 0.065]) shape("Toy eye", "sphere", [x, 0.46, 0.13], [0.035, 0.04, 0.02], m.dark, false);
      shape("Toy nose", "sphere", [0, 0.4, 0.14], [0.05, 0.035, 0.025], m.dark, false);
    } else if (visual === "cloth") {
      shape("Folded fabric", "box", [0, 0.07, 0], [0.44, 0.12, 0.33], id.includes("towel") ? m.blue : m.pink);
      shape("Fabric stripe", "box", [0, 0.134, 0], [0.32, 0.015, 0.07], m.trim, false);
    } else if (visual === "plate") {
      shape("Dish rim", "cylinder", [0, 0.035, 0], [0.45, 0.05, 0.45], m.trim);
      shape("Dish center", "cylinder", [0, 0.063, 0], [0.3, 8e-3, 0.3], m.sky, false);
    } else if (visual === "bottle") {
      shape("Toiletry bottle", "cylinder", [0, 0.17, 0], [0.19, 0.31, 0.19], m.mint);
      shape("Bottle cap", "cylinder", [0, 0.35, 0], [0.12, 0.06, 0.12], m.trim);
    } else if (visual === "mail") {
      shape("Envelope", "box", [0, 0.04, 0], [0.35, 0.045, 0.24], m.trim);
      shape("Envelope stamp", "box", [0.1, 0.067, 0.06], [0.065, 0.012, 0.065], m.pink, false);
    } else if (visual === "shoes") {
      for (const x of [-0.11, 0.11]) shape("Little shoe", "capsule", [x, 0.09, 0], [0.16, 0.15, 0.32], m.purple);
    } else {
      for (let i = 0; i < 3; i++) shape("Crumpled paper", "box", [(i - 1) * 0.09, 0.07 + i * 0.025, 0], [0.16, 0.13, 0.16], i % 2 ? m.pinkLight : m.trim);
    }
    props.interactions.push(
      { id: `pickup-${id}`, name, icon, kind: "pickup", item: id, task: id, anchor: new Vec319(...home), marker: new Vec319(home[0], home[1] + 0.6, home[2]), range: 0.85 },
      { id: `place-${id}`, name: destination, icon, kind: "place", item: id, task: id, anchor: new Vec319(...anchor), marker: new Vec319(placement[0], placement[1] + 0.65, placement[2]), range, placement, placedStyle: id === "bath-towel" ? "hang" : ["kitchen-trash", "laundry-clothes"].includes(id) ? "hide" : void 0 }
    );
  }
  pair("hall-shoes", "Shoes", "\u{1F45F}", [4.45, 0.09, 2.25], "Shoe bench", [5.15, 0, 2.5], [5.85, 0.58, 2.5], "shoes");
  pair("hall-mail", "Mail", "\u2709", [4.05, 0.09, 1.55], "Mail tray", [5.15, 0, 1.1], [5.55, 0.86, 1.1], "mail");
  pair("living-toy", "Living-room toy", "\u{1F9F8}", [1, 0.09, 5.25], "Toy basket", [1.95, 0, 7.85], [1.8, 0.49, 8.55], "toy");
  pair("living-cushion", "Cushion", "\u2661", [1, 0.09, 6.8], "Sofa", [-1.3, 0, 6], [-2, 0.72, 6], "cloth", 1.05);
  pair("kitchen-dish", "Dish", "\u{1F37D}", [-0.55, 0.09, 11.6], "Kitchen sink", [-1.7, 0, 11.45], [-2.65, 1.04, 11.45], "plate", 1.05);
  pair("kitchen-trash", "Trash", "\u267B", [0.4, 0.09, 10.5], "Trash bin", [1.3, 0, 10.3], [1.95, 0.65, 10.3], "trash");
  pair("laundry-clothes", "Dirty laundry", "\u{1F455}", [4.3, 0.09, 10.9], "Washer", [3.35, 0, 11.15], [3.35, 0.53, 10.7], "cloth");
  pair("laundry-clean", "Clean laundry", "\u25A4", [5.85, 0.48, 10.5], "Folding counter", [5.8, 0, 11.75], [5.78, 0.97, 12.63], "cloth");
  pair("bath-towel", "Bath towel", "\u25A4", [4.65, 0.09, -1.45], "Towel rack", [4.05, 0, -0.525], [3.62, 0.84, -0.525], "cloth");
  pair("bath-bottle", "Toiletries", "\u2667", [4.7, 0.09, -2.15], "Vanity", [4.12, 0, -2.35], [4.1, 0.96, -3.08], "bottle");
  const resetBedroom = props.reset;
  props.pet = new PetCleanup(app, props);
  props.daily = new DailyLife(app, props, house);
  function visibility() {
    for (const item of props.items) item.entity.enabled = active.includes(item.id === "vacuum" ? "dirt" : item.id);
    props.dirt.enabled = active.includes("dirt");
    props.crayonMess.enabled = active.includes("crayons");
    props.tidyCrayons.enabled = !active.includes("crayons");
  }
  props.reset = () => {
    resetBedroom();
    for (const item of extras) {
      item.entity.reparent(props.root);
      item.entity.setLocalPosition(...item.home);
      item.entity.setLocalEulerAngles(0, 0, 0);
    }
    visibility();
    props.pet.reset(active.includes("pet-care"));
    if (props.daily.active) props.daily.refresh();
  };
  props.configure = (tasks) => {
    active = tasks;
    props.reset();
  };
  props.roundMesses = new RoundMesses(props, house);
  return props;
}
var init_houseProps = __esm({
  "src/game/houseProps.ts"() {
    "use strict";
    init_cleanupProps();
    init_primitives();
    init_PetCleanup();
    init_DailyLife();
    init_RoundMesses();
  }
});

// src/ui/ChoreAudio.ts
var ChoreAudio;
var init_ChoreAudio = __esm({
  "src/ui/ChoreAudio.ts"() {
    "use strict";
    init_SaveNamespace();
    init_AssetUrls();
    init_AudioSettings();
    ChoreAudio = class {
      context;
      master;
      source;
      kind = "";
      muted = false;
      abort = new AbortController();
      button = document.createElement("button");
      buffers = /* @__PURE__ */ new Map();
      loading;
      generation = 0;
      voices = /* @__PURE__ */ new Set();
      failures = [];
      unsubscribe = onAudioChange(() => this.volume());
      constructor() {
        try {
          this.muted = localStorage.getItem(saveKey("house-effects.muted")) === "true";
        } catch {
        }
        this.button.id = "house-effects";
        this.button.type = "button";
        this.paint();
        document.querySelector("footer").prepend(this.button);
        this.button.onclick = () => {
          this.muted = !this.muted;
          try {
            localStorage.setItem(saveKey("house-effects.muted"), String(this.muted));
          } catch {
          }
          this.paint();
          this.volume();
        };
        const unlock = () => {
          void this.unlock();
        };
        document.addEventListener("pointerdown", unlock, { signal: this.abort.signal });
        document.addEventListener("keydown", unlock, { signal: this.abort.signal });
        document.addEventListener("visibilitychange", () => {
          if (document.hidden) this.silence();
        }, { signal: this.abort.signal });
      }
      volume() {
        if (this.master) this.master.gain.value = this.muted ? 0 : audioLevel("effects");
      }
      async unlock() {
        this.context ??= new AudioContext();
        if (!this.master) {
          this.master = this.context.createGain();
          this.master.connect(this.context.destination);
          this.volume();
        }
        await this.context.resume().catch(() => {
        });
        const names = ["vacuum", "munch", "wipe", "water", "handle"];
        this.loading ??= Promise.all(names.map(async (name) => {
          try {
            const response = await fetch(assetUrl(`/assets/audio/foley/${name}.mp3`));
            if (!response.ok) throw Error(name);
            this.buffers.set(name, await this.context.decodeAudioData(await response.arrayBuffer()));
          } catch {
            this.failures.push(name);
          }
        })).then(() => {
        });
        await this.loading;
      }
      paint() {
        this.button.textContent = this.muted ? "\u25D6 Off" : "\u25D6 Sounds";
        this.button.setAttribute("aria-label", this.muted ? "Turn house sounds on" : "Mute house sounds");
        this.button.setAttribute("aria-pressed", String(!this.muted));
      }
      play(name, volume, loop = false) {
        const ctx = this.context, buffer = this.buffers.get(name);
        if (!ctx || !buffer || !this.master || document.hidden || this.voices.size >= 5) return;
        const source = ctx.createBufferSource(), gain = ctx.createGain();
        source.buffer = buffer;
        source.loop = loop;
        gain.gain.value = volume;
        source.connect(gain).connect(this.master);
        this.voices.add(source);
        source.onended = () => {
          source.disconnect();
          gain.disconnect();
          this.voices.delete(source);
        };
        source.start();
        return source;
      }
      start(id) {
        this.stop();
        const token = this.generation;
        const kind = /vacuum|dirt|mess-2/.test(id) ? "vacuum" : /eat/.test(id) ? "munch" : /wipe|mess-1/.test(id) ? "wipe" : /wash|teeth/.test(id) ? "water" : /sleep|lilah-bed/.test(id) ? "" : "handle";
        if (!kind) return;
        this.kind = kind;
        void this.unlock().then(() => {
          if (token !== this.generation || document.hidden) return;
          this.source = this.play(kind, kind === "vacuum" ? 0.23 : kind === "water" ? 0.3 : kind === "munch" ? 0.5 : 0.4, kind !== "handle");
        });
      }
      update() {
      }
      stop() {
        this.generation++;
        this.source?.stop();
        this.source = void 0;
        this.kind = "";
      }
      silence() {
        this.stop();
        for (const voice of this.voices) {
          try {
            voice.stop();
          } catch {
          }
        }
      }
      snapshot() {
        return { kind: this.kind, playing: !!this.source, muted: this.muted, state: this.context?.state, decoded: this.buffers.size, failures: this.failures, steps: 0 };
      }
      destroy() {
        this.silence();
        this.unsubscribe();
        this.abort.abort();
        this.button.remove();
        void this.context?.close();
      }
    };
  }
});

// src/components/CarrySystem.ts
import { BoundingBox as BoundingBox10, Entity as Entity21, Mat4 as Mat42, Vec3 as Vec320 } from "playcanvas";
var CarrySystem;
var init_CarrySystem = __esm({
  "src/components/CarrySystem.ts"() {
    "use strict";
    CarrySystem = class {
      socket;
      item = null;
      constructor(app, visual) {
        this.socket = new Entity21("Carry socket", app);
        this.socket.setLocalPosition(0, 0.43, 0.43);
        visual.addChild(this.socket);
      }
      pickUp(item) {
        if (this.item) return false;
        this.item = item;
        const bounds = new BoundingBox10();
        let first = true;
        for (const render of item.entity.findComponents("render")) for (const mesh of render.meshInstances) {
          if (first) {
            bounds.copy(mesh.aabb);
            first = false;
          } else bounds.add(mesh.aabb);
        }
        const center = item.carryGrip ? new Vec320(...item.carryGrip) : first ? new Vec320() : new Mat42().copy(item.entity.getWorldTransform()).invert().transformPoint(bounds.center);
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
    };
  }
});

// src/systems/MissionSystem.ts
var TASKS, MissionSystem;
var init_MissionSystem = __esm({
  "src/systems/MissionSystem.ts"() {
    "use strict";
    TASKS = [
      { id: "teddy", name: "Teddy", icon: "\u{1F9F8}" },
      { id: "shirt", name: "Shirt", icon: "\u{1F455}" },
      { id: "book", name: "Book", icon: "\u{1F4D8}" },
      { id: "crayons", name: "Crayons", icon: "\u{1F58D}" },
      { id: "dirt", name: "Dirt", icon: "\u2726" }
    ];
    MissionSystem = class {
      duration = 6e4;
      reward = 1;
      allCleanBonus = 2;
      completed = /* @__PURE__ */ new Set();
      state = "ready";
      reason = null;
      allowance = 0;
      bonus = 0;
      remaining = this.duration;
      finishedAt = 0;
      deadline = 0;
      tasks = TASKS;
      timed = true;
      continuous = false;
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
        if (this.state !== "running" || this.completed.has(task) || !this.tasks.some((entry) => entry.id === task)) return false;
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
    };
  }
});

// src/systems/InteractionSystem.ts
var InteractionSystem;
var init_InteractionSystem = __esm({
  "src/systems/InteractionSystem.ts"() {
    "use strict";
    InteractionSystem = class {
      constructor(interactions, guard = () => true) {
        this.interactions = interactions;
        this.guard = guard;
      }
      interactions;
      guard;
      focus = null;
      available(target, carried, mission) {
        if (mission.state === "finished") return false;
        if (!this.guard(target)) return false;
        if (target.kind === "daily") return target.available?.(carried) ?? false;
        const task = target.task ?? (target.item === "vacuum" ? "dirt" : target.item);
        if (task && !mission.tasks.some((entry) => entry.id === task)) return false;
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
        for (const target of this.interactions) {
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
    };
  }
});

// src/ui/ActionButton.ts
var ActionButton;
var init_ActionButton = __esm({
  "src/ui/ActionButton.ts"() {
    "use strict";
    ActionButton = class {
      constructor(element, press, cancel) {
        this.element = element;
        this.press = press;
        this.cancel = cancel;
        const options = { signal: this.abort.signal };
        element.addEventListener("pointerdown", (event) => {
          if (!this.enabled || event.button !== 0 || this.held || element.disabled) return;
          event.preventDefault();
          this.pointer = event.pointerId;
          element.setPointerCapture(event.pointerId);
          this.held = true;
          this.press();
        }, options);
        for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) {
          element.addEventListener(name, (event) => {
            if (event.pointerId === this.pointer) this.reset();
          }, options);
        }
        element.addEventListener("contextmenu", (event) => event.preventDefault(), options);
        element.addEventListener("click", (event) => {
          if (this.enabled && event.detail === 0 && !this.held && !element.disabled) {
            this.press();
            this.cancel();
          }
        }, options);
        window.addEventListener("keydown", (event) => {
          const target = event.target;
          if (!this.enabled || !["Space", "KeyE"].includes(event.code) || target?.closest("dialog") || target?.closest("button") && target !== element) return;
          event.preventDefault();
          if (event.repeat || this.held || element.disabled) return;
          this.key = event.code;
          this.held = true;
          this.press();
        }, options);
        window.addEventListener("keyup", (event) => {
          if (event.code === this.key) {
            event.preventDefault();
            this.reset();
          }
        }, options);
        window.addEventListener("blur", this.reset, options);
        window.addEventListener("resize", this.reset, options);
        document.addEventListener("visibilitychange", this.reset, options);
      }
      element;
      press;
      cancel;
      enabled = true;
      held = false;
      pointer = null;
      key = null;
      abort = new AbortController();
      reset = () => {
        const pointer = this.pointer;
        this.pointer = null;
        this.key = null;
        this.held = false;
        if (pointer !== null && this.element.hasPointerCapture(pointer)) this.element.releasePointerCapture(pointer);
        this.cancel();
      };
      destroy() {
        this.reset();
        this.abort.abort();
      }
    };
  }
});

// src/systems/InteractionGuidance.ts
function guidanceCandidates(available, carried) {
  if (!carried) return available.filter((target) => target.id === "wash-hands");
  const next = available.filter((target) => target.id !== "put-tool-away" && ["place", "vacuum", "pet", "daily"].includes(target.kind));
  return next.length ? next : available.filter((target) => target.id === "put-tool-away");
}
var init_InteractionGuidance = __esm({
  "src/systems/InteractionGuidance.ts"() {
    "use strict";
  }
});

// src/ui/CleanupFeedback.ts
import { Entity as Entity22, Mesh, MeshInstance, TorusGeometry, Vec3 as Vec321 } from "playcanvas";
var CleanupFeedback;
var init_CleanupFeedback = __esm({
  "src/ui/CleanupFeedback.ts"() {
    "use strict";
    init_primitives();
    init_InteractionGuidance();
    CleanupFeedback = class {
      constructor(app, camera, layer, targets) {
        this.camera = camera;
        this.layer = layer;
        this.mesh = Mesh.fromGeometry(app.graphicsDevice, new TorusGeometry({ tubeRadius: 0.055, ringRadius: 0.43, segments: 32, sides: 8 }));
        this.glow = material("Interaction glow", "#ffe6a2");
        this.glow.useLighting = false;
        this.glow.emissive.set(1, 0.81, 0.42);
        this.glow.update();
        for (const target of targets) {
          const ring = new Entity22(`${target.name} highlight`, app);
          ring.addComponent("render", { meshInstances: [new MeshInstance(this.mesh, this.glow)], castShadows: false, receiveShadows: false });
          ring.setPosition(target.anchor.x, 0.105, target.anchor.z);
          app.root.addChild(ring);
          const label = document.createElement("div");
          label.className = "cleanup-marker";
          label.textContent = target.icon;
          label.dataset.target = target.id;
          label.setAttribute("aria-hidden", "true");
          layer.append(label);
          this.markers.push({ target, ring, label });
        }
      }
      camera;
      layer;
      markers = [];
      mesh;
      glow;
      screen = new Vec321();
      popups = [];
      reward(point, text, now) {
        const element = document.createElement("div");
        element.className = "coin-popup";
        const amount = document.createElement("strong");
        amount.textContent = text;
        element.append(amount);
        for (let i = 0; i < 6; i++) {
          const sparkle = document.createElement("span");
          sparkle.textContent = "\u2726";
          sparkle.style.setProperty("--spark-x", `${Math.sin(i * Math.PI / 3) * 42}px`);
          sparkle.style.setProperty("--spark-y", `${Math.cos(i * Math.PI / 3) * 35}px`);
          element.append(sparkle);
        }
        this.layer.append(element);
        this.popups.push({ element, point: point.clone(), until: now + 950 });
      }
      update(now, interactions, carry, mission) {
        const carried = carry.item?.id ?? null;
        const availableTargets = this.markers.map((m) => m.target).filter((t) => interactions.available(t, carried, mission));
        const candidates = guidanceCandidates(availableTargets, carried);
        const position = carry.socket.getPosition();
        const primary = candidates.sort((a, b) => interactions.distance(a, position) - interactions.distance(b, position))[0];
        for (const { target, ring, label } of this.markers) {
          const available = availableTargets.includes(target);
          const destination = target === primary;
          const nearby = interactions.focus === target && available && !(target.id === "put-tool-away" && primary && primary !== target);
          ring.enabled = nearby || destination || available && !carried && target.id !== "play-lilah";
          ring.setPosition(target.anchor.x, 0.105, target.anchor.z);
          const scale = (destination ? 1.3 : nearby ? 1.1 : 0.85) + Math.sin(now / 300) * (destination ? 0.1 : 0.035);
          ring.setLocalScale(scale, 1, scale);
          label.hidden = !nearby && !destination;
          if (target.id === "play-lilah") label.hidden = true;
          label.classList.toggle("nearby", nearby);
          label.classList.toggle("destination", destination);
          label.dataset.guided = String(destination);
          const text = target.icon;
          if (label.textContent !== text) label.textContent = text;
          this.camera.camera.worldToScreen(target.marker, this.screen);
          const x = Math.max(30, Math.min(this.layer.clientWidth - 30, this.screen.x));
          const y = Math.max(this.layer.clientHeight * 0.29, Math.min(this.layer.clientHeight * 0.7, this.screen.y));
          const offscreen = x !== this.screen.x || y !== this.screen.y;
          if (offscreen && !destination) label.hidden = true;
          label.classList.toggle("offscreen", offscreen && destination);
          label.style.setProperty("--guide-angle", `${Math.atan2(this.screen.y - y, this.screen.x - x)}rad`);
          label.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
        }
        for (let i = this.popups.length - 1; i >= 0; i--) {
          const popup = this.popups[i];
          if (now >= popup.until) {
            popup.element.remove();
            this.popups.splice(i, 1);
            continue;
          }
          this.camera.camera.worldToScreen(popup.point, this.screen);
          popup.element.style.left = `${this.screen.x}px`;
          popup.element.style.top = `${this.screen.y}px`;
        }
      }
      reset() {
        for (const popup of this.popups) popup.element.remove();
        this.popups.length = 0;
      }
      hide() {
        this.reset();
        for (const marker of this.markers) {
          marker.ring.enabled = false;
          marker.label.hidden = true;
        }
      }
      hideWorkingLabel(_id) {
        for (const marker of this.markers) {
          marker.label.hidden = true;
          marker.ring.enabled = false;
        }
      }
      destroy() {
        this.reset();
        for (const marker of this.markers) {
          marker.ring.destroy();
          marker.label.remove();
        }
        this.mesh.destroy();
        this.glow.destroy();
      }
    };
  }
});

// src/ui/CleanupHUD.ts
var CleanupHUD;
var init_CleanupHUD = __esm({
  "src/ui/CleanupHUD.ts"() {
    "use strict";
    CleanupHUD = class {
      constructor(button2, replay) {
        this.button = button2;
        document.querySelector("#replay").addEventListener("click", replay, { signal: this.abort.signal });
        this.dialog.addEventListener("cancel", (event) => event.preventDefault(), { signal: this.abort.signal });
      }
      button;
      clock = document.querySelector("#mission-clock");
      allowance = document.querySelector("#allowance");
      count = document.querySelector("#task-count");
      hint = document.querySelector("#cleanup-hint");
      actionTitle = document.querySelector("#action-title");
      actionDetail = document.querySelector("#action-detail");
      actionIcon = document.querySelector("#action-icon");
      tasks = document.querySelector("#task-list");
      announcement = document.querySelector("#cleanup-announcement");
      dialog = document.querySelector("#results");
      abort = new AbortController();
      taskDefinitions = null;
      setTasks(tasks) {
        if (this.taskDefinitions === tasks) return;
        this.taskDefinitions = tasks;
        this.tasks.replaceChildren();
        for (const task of tasks) {
          const entry = document.createElement("li");
          entry.dataset.task = task.id;
          entry.title = task.room ? `${task.room}: ${task.name}` : task.name;
          const icon = document.createElement("span");
          icon.textContent = task.icon;
          icon.setAttribute("aria-hidden", "true");
          const name = document.createElement("span");
          name.textContent = task.name;
          entry.append(icon, name);
          this.tasks.append(entry);
        }
      }
      text(element, value) {
        if (element.textContent !== value) element.textContent = value;
      }
      announce(text) {
        this.announcement.textContent = text;
      }
      update(mission, carry, focus, busy, progress, animation = null, petHint) {
        this.setTasks(mission.tasks);
        const seconds = Math.ceil(mission.remaining / 1e3);
        this.text(this.clock, mission.timed ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` : "\u221E");
        this.clock.classList.toggle("soon", seconds <= 10 && mission.state === "running");
        this.text(this.allowance, `$${mission.allowance}`);
        this.text(this.count, `${mission.completed.size} / ${mission.tasks.length}`);
        for (const task of mission.tasks) {
          const entry = this.tasks.querySelector(`[data-task="${task.id}"]`);
          const done = mission.completed.has(task.id);
          this.text(entry.firstElementChild, done ? "\u2713" : task.icon);
          entry.classList.toggle("done", done);
          entry.setAttribute("aria-label", `${task.room ? `${task.room}: ` : ""}${task.name}: ${done ? "complete" : "to do"}`);
        }
        const enabled = !!focus && !busy && !animation && mission.state !== "finished";
        this.button.disabled = !enabled;
        this.button.dataset.target = enabled ? focus.id : "";
        this.button.style.setProperty("--hold-progress", `${progress * 360}deg`);
        this.button.classList.toggle("holding", progress > 0);
        let title = "Action", detail = "Come closer", icon = "\u270B";
        if (focus) {
          title = focus.actionLabel ?? { pickup: "Pick up", place: "Put away", crayons: "Tidy up", vacuum: "Hold to clean", pet: "Action", daily: "Action" }[focus.kind];
          detail = focus.name;
          icon = focus.icon;
        }
        if (busy) {
          title = focus?.kind === "pet" ? "Washing\u2026" : focus?.kind === "daily" ? `${focus.name}\u2026` : "Tidying\u2026";
          detail = "One moment";
        }
        if (animation) {
          title = animation === "PickUp" ? "Picking up\u2026" : animation === "PutDown" ? "Putting away\u2026" : "Lovely!";
          detail = "One moment";
        }
        if (mission.state === "finished") {
          title = "Well done";
          detail = "Round complete";
          icon = "\u2661";
        }
        this.text(this.actionTitle, title);
        this.text(this.actionDetail, detail);
        this.text(this.actionIcon, icon);
        this.button.setAttribute("aria-label", `${title}: ${detail}${focus?.kind === "vacuum" ? ". Hold for just over one second." : ""}`);
        let hint = "Find an item. Walk close, then tap Action.";
        if (mission.state === "ready") hint = "Move to start \xB7 60 seconds \xB7 $1 per task";
        else if (carry.item) {
          const destination = document.querySelector(".cleanup-marker.destination")?.textContent;
          hint = carry.item.id === "vacuum" ? "\u2726 Go to the dirt, then hold Action to vacuum." : `${carry.item.icon} Take ${carry.item.name.toLowerCase()} to ${destination || "the glowing destination"}.`;
        } else if (focus?.kind === "crayons") hint = "\u{1F58D} Tap Action to put the crayons in their cup.";
        if (mission.state === "finished") hint = "Every little bit helps. Nice work, Arianna!";
        if (!mission.timed && !carry.item && mission.state !== "finished") hint = "Explore freely \xB7 Practice tasks \xB7 No timer or allowance";
        if (petHint && mission.state !== "finished" && (mission.tasks.length === 1 || carry.item?.id === "scooper" || petHint.startsWith("\u{1FAE7}"))) hint = petHint;
        this.text(this.hint, hint);
      }
      showResults(mission) {
        if (this.dialog.open) return;
        document.querySelector("#results-title").textContent = mission.reason === "complete" ? mission.tasks.length === 6 ? "House ready!" : mission.tasks.length === 5 ? "Room ready!" : "All tidied up!" : "Nice helping!";
        document.querySelector("#results-summary").textContent = mission.reason === "complete" ? `All ${mission.tasks.length} tasks done. A little helping makes a happy home!` : mission.completed.size ? "Look at what you did in one little minute." : "A little practice goes a long way. Let\u2019s try again!";
        document.querySelector("#results-tasks").textContent = `${mission.completed.size} / ${mission.tasks.length}`;
        document.querySelector("#results-money").textContent = `$${mission.allowance}`;
        const bonus = document.querySelector("#results-bonus");
        bonus.hidden = !mission.bonus;
        bonus.textContent = `Includes a $${mission.bonus} all-clean bonus \u2726`;
        const list = document.querySelector("#results-list");
        list.replaceChildren();
        for (const task of mission.tasks) {
          const row = document.createElement("li");
          row.textContent = `${mission.completed.has(task.id) ? "\u2713" : "\u25CB"} ${task.name}`;
          row.classList.toggle("done", mission.completed.has(task.id));
          list.append(row);
        }
        this.dialog.showModal();
        document.querySelector("#replay").focus();
      }
      reset() {
        this.dialog.close();
        this.announcement.textContent = "";
      }
      destroy() {
        this.abort.abort();
        this.dialog.close();
        this.tasks.replaceChildren();
      }
    };
  }
});

// src/systems/saveId.ts
function saveId() {
  return Array.from(crypto.getRandomValues(new Uint32Array(4)), (value) => value.toString(16).padStart(8, "0")).join("");
}
var init_saveId = __esm({
  "src/systems/saveId.ts"() {
    "use strict";
  }
});

// src/components/BedEntry.ts
import { Vec3 as Vec322 } from "playcanvas";
function bedEntry(start, startYaw, crib, progress) {
  const end = crib ? new Vec322(9.8, 0.09, -1.7) : new Vec322(-2.05, 0.09, -1.85), yaw = crib ? 90 : 0;
  const keys = crib ? [
    { t: 0, p: start, h: 0.027, y: startYaw },
    { t: 0.2, p: new Vec322(8.55, 0.09, -1.3), h: 0.12, y: 90 },
    { t: 0.43, p: new Vec322(8.76, 0.09, -1.5), h: 1.22, y: 90 },
    { t: 0.65, p: new Vec322(9.45, 0.09, -1.7), h: 1.22, y: 90 },
    { t: 1, p: end, h: 0.65, y: yaw }
  ] : [
    { t: 0, p: start, h: 0.027, y: startYaw },
    { t: 0.2, p: new Vec322(-1, 0.09, -1.75), h: 0.08, y: 90 },
    { t: 0.43, p: new Vec322(-1.35, 0.09, -1.85), h: 0.91, y: 90 },
    { t: 0.65, p: new Vec322(-1.8, 0.09, -1.85), h: 0.91, y: 35 },
    { t: 1, p: end, h: 0.91, y: yaw }
  ];
  const space = crib ? "crib" : "bed";
  for (let i2 = 1; i2 < keys.length; i2++) {
    keys[i2].p = propPoint(space, keys[i2].p);
    keys[i2].h = propHeight(space, keys[i2].h);
    keys[i2].y = propYaw(space, keys[i2].y);
  }
  const t = Math.max(0, Math.min(1, progress)), b = keys.findIndex((k) => k.t >= t), i = Math.max(1, b), a = keys[i - 1], z = keys[i], raw = (t - a.t) / (z.t - a.t), u = raw * raw * (3 - 2 * raw), delta = (z.y - a.y + 540) % 360 - 180;
  return { position: new Vec322().lerp(a.p, z.p, u), height: a.h + (z.h - a.h) * u, yaw: a.y + delta * u };
}
var BED_ENTRY_SECONDS;
var init_BedEntry = __esm({
  "src/components/BedEntry.ts"() {
    "use strict";
    init_PropSpace();
    BED_ENTRY_SECONDS = 3.2;
  }
});

// src/game/CleanupGame.ts
import { Vec3 as Vec323 } from "playcanvas";
var CleanupGame;
var init_CleanupGame = __esm({
  "src/game/CleanupGame.ts"() {
    "use strict";
    init_ChoreAudio();
    init_PropSpace();
    init_CarrySystem();
    init_MissionSystem();
    init_house();
    init_InteractionSystem();
    init_ActionButton();
    init_CleanupFeedback();
    init_CleanupHUD();
    init_saveId();
    init_PetCleanup();
    init_BedEntry();
    CleanupGame = class {
      constructor(app, character, props, camera, resetMovement, controller, interactionCamera) {
        this.character = character;
        this.props = props;
        this.resetMovement = resetMovement;
        this.controller = controller;
        this.interactionCamera = interactionCamera;
        this.carry = new CarrySystem(app, character.visual);
        character.animator.bindCarrySocket(this.carry.socket);
        this.interactions = new InteractionSystem(props.interactions, (target) => props.pet?.allows(target) ?? true);
        const button2 = document.querySelector("#action-button");
        this.hud = new CleanupHUD(button2, this.replay);
        this.feedback = new CleanupFeedback(app, camera, document.querySelector("#cleanup-effects"), props.interactions);
        this.action = new ActionButton(button2, this.press, this.cancelHold);
        this.bedtimeFade.id = "bedtime-fade";
        this.bedtimeFade.hidden = true;
        this.bedtimeFade.setAttribute("aria-hidden", "true");
        document.querySelector("#game").append(this.bedtimeFade);
        this.configure("day");
      }
      character;
      props;
      resetMovement;
      controller;
      interactionCamera;
      roundId = saveId();
      onFinished = () => {
      };
      beforeReplay = () => true;
      onReplay = () => {
      };
      mode = "day";
      mission = new MissionSystem();
      carry;
      interactions;
      action;
      feedback;
      hud;
      activity = null;
      progress = 0;
      finishedHandled = false;
      celebrationStarted = false;
      aligning = null;
      seatReturn = null;
      bedYaw = 0;
      workingId = "";
      audio = new ChoreAudio();
      bedtimeFade = document.createElement("div");
      get movementLocked() {
        return this.character.animator.busy || !!this.activity;
      }
      get activeInteractionId() {
        return this.activity?.target.id ?? this.aligning?.id ?? null;
      }
      configure(mode) {
        if (this.mission.state === "running" && this.mission.timed) return;
        this.mode = mode;
        this.props.daily.setActive(mode === "day");
        this.mission.continuous = mode === "day";
        const tasks = mode === "day" ? this.props.daily.tasks : mode === "pet" ? PET_TASKS : mode === "bedroom" ? TASKS : mode === "house" ? HOUSE_TASKS : [...TASKS, ...HOUSE_TASKS.filter((task) => task.id !== "book"), ...EXTRA_HOUSE_TASKS, ...PET_TASKS];
        this.mission.configure(tasks, mode !== "practice" && mode !== "day");
        this.props.configure?.(tasks.map((task) => task.id));
        this.replay();
      }
      refreshFocus() {
        this.interactions.update(this.character.player.getPosition(), this.carry.item?.id ?? null, this.mission);
      }
      press = () => {
        const now = performance.now();
        this.mission.tick(now);
        this.refreshFocus();
        const target = this.interactions.focus;
        if (!target || this.activity || this.aligning || this.movementLocked || this.mission.state === "finished") return;
        this.mission.start(now);
        {
          this.aligning = target;
          const point = target.placement ? new Vec323(...target.placement) : target.kind === "pickup" ? this.props.items.find((item) => item.id === target.item).entity.getPosition() : target.marker;
          this.controller.approachProp(point, () => {
            this.aligning = null;
            this.mission.tick(performance.now());
            if (this.mission.state !== "finished") this.perform(target);
          }, () => {
            this.aligning = null;
          });
          return;
        }
      };
      perform(target) {
        const now = performance.now();
        this.workingId = target.id;
        this.audio.start(target.id);
        const facing = target.placement ? new Vec323(...target.placement) : target.marker;
        if (target.kind === "daily") {
          if (["school-door", "shop-door"].includes(target.id)) {
            this.props.daily.perform(target, this.carry);
            return;
          }
          this.interactionCamera.beginChore(this.character.player.getPosition(), facing);
          if (target.duration === 0) {
            const pickup = ["choose-clothes", "night-clothes", "take-egg", "take-towel", "daily-vacuum", "take-breakfast"].includes(target.id);
            this.character.animator.playAction(pickup ? "PickUp" : "PutDown", 0.3, () => {
              this.props.daily.perform(target, this.carry);
              this.character.animator.setCarrying(!!this.carry.item);
              if (target.task) {
                this.mission.completed.add(target.task);
                this.feedback.reward(target.marker, "+$1", performance.now());
              }
            }, facing);
          } else {
            this.activity = { target, start: now, duration: target.duration ?? 1e3 };
            if (target.id === "lilah-bed") {
              this.bedtimeFade.hidden = false;
              this.bedtimeFade.style.opacity = "0";
            }
            if (target.id === "sleep") {
              this.seatReturn = this.character.player.getPosition().clone();
              this.bedYaw = this.character.visual.getLocalEulerAngles().y;
              this.controller.reset();
              this.character.animator.setCarrying(false);
              this.character.animator.setWorkClip("SleepEnter");
              return;
            }
            if (target.id === "eat-breakfast") {
              this.seatReturn = this.character.player.getPosition().clone();
              this.controller.reset();
              this.character.player.setPosition(propPoint("dining", new Vec323(0.55, 0.09, 12.49)));
              this.character.visual.setLocalEulerAngles(0, propYaw("dining", 0), 0);
              this.character.animator.setCarrying(false);
              if (this.character.grounding) this.character.grounding.surfaceHeight = 0.07;
              this.character.animator.setWorkClip("EatSit", propPoint("dining", new Vec323(0.55, 1, 13.85)));
              return;
            }
            if (target.id.startsWith("wipe-") || target.id === "lilah-mess-1") this.character.animator.setWorkClip("Wipe", facing);
            else if (target.id.includes("vacuum") || target.id === "lilah-mess-2") this.character.animator.setWorkClip("Vacuum", facing);
            if (!target.hold) {
              this.character.animator.setCarrying(true);
              this.character.animator.faceTowards(facing);
            }
          }
          return;
        }
        this.interactionCamera.beginChore(this.character.player.getPosition(), facing);
        if (target.kind === "pickup") {
          const item = this.props.items.find((item2) => item2.id === target.item);
          this.character.animator.playAction("PickUp", 0.25, () => {
            this.mission.tick(performance.now());
            if (this.mission.state !== "finished" && this.carry.pickUp(item)) {
              this.character.animator.setCarrying(true);
              if (item.id === "scooper") this.props.pet?.pickedUp();
              this.hud.announce(`Picked up ${item.name}. Follow the glowing destination.`);
            }
          }, facing);
        } else if (target.kind === "pet" && target.id !== "wash-hands") {
          this.character.animator.playAction(target.id === "scoop-poop" ? "PickUp" : "PutDown", 0.4, () => {
            this.mission.tick(performance.now());
            if (this.mission.state === "finished") return;
            if (target.id === "scoop-poop") this.props.pet.scoop();
            else {
              this.carry.release(this.props.root, this.props.pet.tool.home);
              this.character.animator.setCarrying(false);
              this.props.pet.flush(performance.now());
            }
            this.hud.announce(this.props.pet.hint);
          }, facing);
        } else if (target.kind === "place") {
          if (!this.carry.item || this.carry.item.id !== target.item) return;
          this.character.animator.playAction("PutDown", 0.3, () => {
            const eventNow = performance.now();
            if (this.mission.complete(target.task, eventNow)) {
              if (this.mode === "day") this.props.daily.complete(target.task);
              const placed = this.carry.release(this.props.root, target.placement);
              if (placed && target.placedStyle === "hide") placed.entity.enabled = false;
              if (placed && target.placedStyle === "hang") placed.entity.setLocalEulerAngles(90, 0, 0);
              this.character.animator.setCarrying(false);
              this.reward(target, eventNow);
            }
          }, facing);
        } else {
          this.activity = { target, start: now, duration: target.kind === "pet" ? 1600 : target.kind === "vacuum" ? 1150 : 450 };
          if (target.kind === "vacuum") this.character.animator.setWorkClip("Vacuum", facing);
          if (target.kind === "pet") {
            this.character.animator.setCarrying(true);
            this.character.animator.faceTowards(target.marker);
          }
        }
        this.refreshFocus();
      }
      cancelActivity() {
        this.audio.stop();
        this.bedtimeFade.hidden = true;
        this.leaveSeat();
        this.character.animator.setWorkClip(null);
        this.interactionCamera.endChore();
        if (this.activity?.target.kind === "pet" || this.activity?.target.kind === "daily") {
          this.character.animator.setCarrying(!!this.carry.item);
          this.character.animator.faceTowards(null);
        }
        this.activity?.target.mess?.setLocalScale(1, 1, 1);
        this.activity = null;
        this.progress = 0;
        this.props.dirt.setLocalScale(1, 1, 1);
        this.props.crayonMess.setLocalScale(1, 1, 1);
      }
      cancelHold = () => {
        if (this.aligning && (this.aligning.kind === "vacuum" || this.aligning.hold)) {
          this.controller.reset();
          this.aligning = null;
        }
        if (this.activity?.target.kind === "vacuum" || this.activity?.target.hold) this.cancelActivity();
      };
      leaveSeat() {
        if (this.seatReturn) {
          this.character.player.setPosition(this.seatReturn);
          this.seatReturn = null;
          this.character.animator.setWorkClip(null);
          if (this.character.grounding) this.character.grounding.surfaceHeight = null;
        }
      }
      reward(target, now) {
        this.feedback.reward(target.marker, this.mission.timed || this.mode === "day" ? "+$1" : "\u2713", now);
        this.hud.announce(`${target.name} cleaned up. ${this.mission.timed ? "Earned $1. " : ""}${this.mission.completed.size} of ${this.mission.tasks.length} tasks complete.`);
      }
      update(now, movementIntent) {
        if (!this.activity && !this.character.animator.busy) {
          this.audio.stop();
          this.workingId = "";
          this.character.animator.setWorkClip(null);
          this.interactionCamera.endChore();
        }
        if (this.mode === "day") {
          this.mission.tasks = this.props.daily.tasks;
          for (const id of this.props.daily.completed) this.mission.completed.add(id);
        }
        if (movementIntent) this.mission.start(now);
        this.mission.tick(now);
        this.refreshFocus();
        if (this.mission.state === "finished") {
          if (!this.finishedHandled) {
            this.finishedHandled = true;
            this.cancelActivity();
            this.action.reset();
            this.resetMovement();
            this.onFinished(this.roundId, this.mission.allowance);
            if (this.mission.reason !== "complete") this.character.animator.cancelAction();
          }
          if (this.mission.reason === "complete" && !this.character.animator.busy && !this.celebrationStarted) {
            this.celebrationStarted = true;
            this.character.animator.playAction("Celebrate", 0.65);
          } else if (!this.character.animator.busy) this.hud.showResults(this.mission);
        } else if (this.activity) {
          const { target, start, duration } = this.activity;
          if (target.id === "lilah-bed") {
            const p = (now - start) / duration;
            this.bedtimeFade.style.opacity = String(Math.min(1, p * 2.5));
          }
          if (target.id === "sleep" && this.seatReturn) {
            const t = (now - start) / (BED_ENTRY_SECONDS * 1e3), pose = bedEntry(this.seatReturn, this.bedYaw, false, t);
            this.character.player.setPosition(pose.position);
            this.character.visual.setLocalEulerAngles(0, pose.yaw, 0);
            if (this.character.grounding) this.character.grounding.surfaceHeight = pose.height;
            if (t >= 1) this.character.animator.setWorkClip("Sleep");
          }
          const inRange = !!this.seatReturn || this.interactions.distance(target, this.character.player.getPosition()) <= target.range + 0.1;
          if (!inRange || document.hidden || (target.kind === "vacuum" || target.hold) && !this.action.held) this.cancelActivity();
          else {
            this.progress = Math.min(1, (now - start) / duration);
            const messy = target.kind === "daily" ? target.mess : target.kind === "pet" ? null : target.kind === "vacuum" ? this.props.dirt : this.props.crayonMess;
            const size = 1 - this.progress * 0.92;
            messy?.setLocalScale(size, size, size);
            if (this.progress >= 1 && target.kind === "daily") {
              this.props.daily.perform(target, this.carry);
              if (target.id === "lilah-bed") {
                this.bedtimeFade.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450, fill: "forwards" }).onfinish = () => {
                  this.bedtimeFade.hidden = true;
                };
              }
              this.leaveSeat();
              if (target.task) this.mission.completed.add(target.task);
              this.character.animator.setCarrying(!!this.carry.item);
              this.character.animator.faceTowards(null);
              this.feedback.reward(target.marker, target.task || target.id === "lilah-bed" ? "+$1" : "\u2713", now);
              this.activity = null;
              this.progress = 0;
            } else if (this.progress >= 1 && this.mission.complete(target.task, now)) {
              if (messy) messy.enabled = false;
              if (target.kind === "pet") {
                this.props.pet.finish();
                if (this.mode === "day") this.props.daily.complete("pet-care");
                this.character.animator.setCarrying(false);
                this.character.animator.faceTowards(null);
              } else if (target.kind === "crayons") this.props.tidyCrayons.enabled = true;
              else {
                const vacuum = this.props.items.find((item) => item.id === "vacuum");
                this.character.animator.playAction("PutDown", 0.3, () => {
                  this.carry.release(this.props.root, vacuum.home);
                  this.character.animator.setCarrying(false);
                }, target.anchor);
              }
              this.activity = null;
              this.progress = 0;
              this.reward(target, now);
              this.refreshFocus();
            }
          }
        }
        this.feedback.update(now, this.interactions, this.carry, this.mission);
        if (this.activity || this.character.animator.busy) this.feedback.hideWorkingLabel(this.workingId);
        this.audio.update();
        this.props.pet?.update(now, this.activity?.target.kind === "pet" ? this.progress : 0, this.carry.socket.getPosition());
        this.props.daily?.effect(this.activity?.target.kind === "daily" ? this.activity.target : null, this.progress, this.carry.socket.getPosition());
        this.hud.update(this.mission, this.carry, this.activity?.target ?? this.interactions.focus, this.activity?.target.kind === "crayons" || this.activity?.target.kind === "pet" || this.activity?.target.kind === "daily" && !this.activity.target.hold, this.progress, this.character.animator.actionName, this.props.pet?.hint);
        if (this.mode === "day") {
          document.querySelector("#mission-clock").textContent = this.props.daily.clock.label;
          document.querySelector("#cleanup-hint").textContent = this.props.daily.hint;
        }
        if (this.aligning) {
          document.querySelector("#action-button").disabled = true;
          document.querySelector("#action-title").textContent = "Moving closer\u2026";
        }
      }
      replay = () => {
        if (!this.beforeReplay()) return;
        this.roundId = saveId();
        this.action.reset();
        this.cancelActivity();
        this.carry.item = null;
        if (this.mode === "house") {
          const tasks = this.props.roundMesses.houseTasks();
          this.mission.configure(tasks, true);
          this.props.configure?.(tasks.map((t) => t.id));
        }
        this.props.reset();
        this.props.roundMesses?.apply(this.mode);
        this.mission.reset();
        this.feedback.reset();
        this.hud.reset();
        if (this.mode === "day") for (const id of this.props.daily.completed) this.mission.completed.add(id);
        this.character.animator.reset();
        this.character.player.setPosition(0, 0.09, 0.9);
        this.character.visual.setLocalEulerAngles(0, 30, 0);
        this.finishedHandled = false;
        this.celebrationStarted = false;
        this.interactions.focus = null;
        this.resetMovement();
        this.onReplay();
        document.querySelector("#game-canvas").focus({ preventScroll: true });
      };
      setActive(active) {
        this.action.enabled = active;
        this.action.reset();
        if (!active) {
          this.audio.stop();
          this.feedback.hide();
          this.hud.dialog.close();
        }
      }
      developerCancel() {
        this.action.reset();
        this.cancelActivity();
        this.aligning = null;
        this.resetMovement();
        this.character.animator.cancelAction();
        if (this.carry.item) {
          const item = this.carry.item;
          this.carry.release(this.props.root, item.home);
          item.entity.enabled = true;
        }
        this.character.animator.setCarrying(false);
      }
      developerComplete() {
        this.developerCancel();
        if (this.mode === "day") {
          this.props.daily.developerComplete();
          for (const id of this.props.daily.completed) this.mission.completed.add(id);
          return;
        }
        for (const task of this.mission.tasks) {
          this.mission.completed.add(task.id);
          const target = this.props.interactions.find((t) => t.task === task.id && t.kind === "place");
          if (target?.item) {
            const item = this.props.items.find((i) => i.id === target.item);
            if (item) {
              item.entity.reparent(this.props.root);
              if (target.placement) item.entity.setLocalPosition(...target.placement);
              if (target.placedStyle === "hide") item.entity.enabled = false;
              if (target.placedStyle === "hang") item.entity.setLocalEulerAngles(90, 0, 0);
            }
          }
        }
        this.props.dirt.enabled = false;
        this.props.crayonMess.enabled = false;
        this.props.tidyCrayons.enabled = true;
        if (this.mission.tasks.some((t) => t.id === "pet-care")) {
          this.props.pet.finish();
          this.props.pet.poop.enabled = false;
        }
        this.mission.state = "finished";
        this.mission.reason = "complete";
        this.mission.allowance = 0;
        this.mission.bonus = 0;
        this.finishedHandled = true;
      }
      snapshot() {
        return {
          state: this.mission.state,
          reason: this.mission.reason,
          remaining: this.mission.remaining,
          mode: this.mode,
          tasks: this.mission.tasks.map((task) => task.id),
          timed: this.mission.timed,
          pet: this.props.pet?.snapshot(),
          daily: this.props.daily?.snapshot(),
          completed: [...this.mission.completed],
          allowance: this.mission.allowance,
          bonus: this.mission.bonus,
          audio: this.audio.snapshot(),
          carrying: this.carry.item?.id ?? null,
          carriedParent: this.carry.item?.entity.parent?.name ?? null,
          carriedPosition: this.carry.item?.entity.getPosition().toArray() ?? null,
          focus: this.interactions.focus?.id ?? null,
          holding: this.action.held,
          progress: this.progress,
          aligning: this.aligning?.id ?? null,
          dirtVisible: this.props.dirt.enabled,
          crayonsVisible: this.props.crayonMess.enabled,
          tidyCrayonsVisible: this.props.tidyCrayons.enabled,
          items: this.props.items.map((item) => ({ id: item.id, position: item.entity.getPosition().toArray(), home: item.home })),
          targets: this.props.interactions.map((target) => ({ id: target.id, position: target.anchor.toArray(), range: target.range }))
        };
      }
      destroy() {
        this.audio.destroy();
        this.bedtimeFade.remove();
        this.action.destroy();
        this.feedback.destroy();
        this.hud.destroy();
      }
    };
  }
});

// src/data/collection.ts
function randomUnit() {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
}
function rollDumpling(random = randomUnit) {
  const tiers = Object.entries(RARITIES);
  const draw = random(), choice = random();
  if (![draw, choice].every((value) => Number.isFinite(value) && value >= 0 && value < 1)) throw new Error("Random values must be in [0, 1).");
  let remaining = draw * tiers.reduce((sum, [, data]) => sum + data.weight, 0);
  for (const [tier, data] of tiers) {
    if (remaining < data.weight) {
      const options = DUMPLINGS.filter((dumpling) => dumpling.rarity === tier);
      if (!options.length) throw new Error(`No dumplings configured for ${tier}.`);
      return options[Math.floor(choice * options.length)];
    }
    remaining -= data.weight;
  }
  throw new Error("Invalid rarity configuration.");
}
var RARITIES, DUMPLINGS, STORE_INVENTORY;
var init_collection = __esm({
  "src/data/collection.ts"() {
    "use strict";
    RARITIES = {
      Common: { weight: 65, color: "#c4b7d1", sparkles: 5, pitch: 1 },
      Rare: { weight: 25, color: "#78b8ec", sparkles: 10, pitch: 1.12 },
      Epic: { weight: 8, color: "#be87e6", sparkles: 16, pitch: 1.26 },
      Legendary: { weight: 2, color: "#f2c661", sparkles: 24, pitch: 1.5 }
    };
    DUMPLINGS = [
      { id: "mochi", name: "Mochi", rarity: "Common", color: "#fff0d7", accent: "#edafbd", face: "smile", accessory: "none" },
      { id: "rosie", name: "Rosie", rarity: "Common", color: "#f2bed1", accent: "#d679a5", face: "wink", accessory: "bow" },
      { id: "minty", name: "Minty", rarity: "Common", color: "#b6d9bd", accent: "#7da887", face: "sleepy", accessory: "leaf" },
      { id: "blueberry", name: "Blueberry", rarity: "Rare", color: "#b5d5f3", accent: "#829ecd", face: "smile", accessory: "leaf" },
      { id: "sunny", name: "Sunny", rarity: "Rare", color: "#f5dfa1", accent: "#e2ae76", face: "wink", accessory: "bow" },
      { id: "lavendream", name: "Lavendream", rarity: "Rare", color: "#d5baf1", accent: "#aa80d0", face: "sleepy", accessory: "star" },
      { id: "peachy", name: "Peachy", rarity: "Rare", color: "#f4c3aa", accent: "#db9c8c", face: "smile", accessory: "star" },
      { id: "stardrop", name: "Stardrop", rarity: "Rare", color: "#ffe6a0", accent: "#d6a540", face: "wink", accessory: "crown" },
      { id: "shortcake", name: "Shortcake", rarity: "Common", color: "#f5bfd0", accent: "#df729b", face: "smile", accessory: "bow" },
      { id: "custard", name: "Custard", rarity: "Common", color: "#f5dea0", accent: "#d9ae6a", face: "sleepy", accessory: "none" },
      { id: "cocoa", name: "Cocoa Puff", rarity: "Rare", color: "#b88570", accent: "#f3cfb1", face: "wink", accessory: "bow" },
      { id: "macaron", name: "Macaron", rarity: "Rare", color: "#b5d4be", accent: "#f5c2d9", face: "smile", accessory: "leaf" },
      { id: "sorbet", name: "Sorbet", rarity: "Rare", color: "#e4b9ef", accent: "#fdc5ac", face: "wink", accessory: "star" },
      { id: "sugarstar", name: "Sugar Star", rarity: "Rare", color: "#fff1c0", accent: "#e6b867", face: "smile", accessory: "crown" },
      { id: "bunny", name: "Bunny Bun", rarity: "Common", color: "#fae8dd", accent: "#e8aec5", face: "smile", accessory: "bow" },
      { id: "kitten", name: "Peaches the Kitten", rarity: "Common", color: "#eec0a1", accent: "#d89594", face: "sleepy", accessory: "none" },
      { id: "panda", name: "Panda Puff", rarity: "Rare", color: "#eee7ec", accent: "#77748a", face: "smile", accessory: "none" },
      { id: "fox", name: "Little Fox", rarity: "Rare", color: "#d99c79", accent: "#fff1df", face: "wink", accessory: "leaf" },
      { id: "sleepykoala", name: "Sleepy Koala", rarity: "Rare", color: "#bac0da", accent: "#f0c5d6", face: "sleepy", accessory: "star" },
      { id: "goldenbear", name: "Honey Bear", rarity: "Rare", color: "#efcf83", accent: "#b59162", face: "smile", accessory: "crown" },
      { id: "moonbean", name: "Moonbean", rarity: "Common", color: "#c6c4e4", accent: "#f5e4ad", face: "sleepy", accessory: "star" },
      { id: "comet", name: "Comet", rarity: "Common", color: "#a8c6de", accent: "#c9a8e4", face: "wink", accessory: "star" },
      { id: "nebula", name: "Nebula", rarity: "Rare", color: "#d2a5d9", accent: "#99c9dc", face: "smile", accessory: "bow" },
      { id: "orbit", name: "Orbit", rarity: "Rare", color: "#a5d7d1", accent: "#edcde9", face: "wink", accessory: "star" },
      { id: "aurora", name: "Aurora", rarity: "Rare", color: "#bbb0f2", accent: "#b0ead7", face: "sleepy", accessory: "crown" },
      { id: "supernova", name: "Supernova", rarity: "Rare", color: "#fae3a1", accent: "#b6a4ed", face: "smile", accessory: "crown" },
      // Stable IDs preserve earlier preview receipts; the rejected designs are replaced.
      { id: "dewdrop-unicorn", name: "Matcha Frog", rarity: "Epic", color: "#b6d48b", accent: "#8eae67", face: "smile", accessory: "none", special: "frog" },
      { id: "sunbeam-unicorn", name: "Lotus Frog", rarity: "Legendary", color: "#acd6c5", accent: "#729f91", face: "smile", accessory: "none", special: "frog" },
      { id: "sugarplum-bunny", name: "Peach Blossom Bunny", rarity: "Epic", color: "#ffdac4", accent: "#eeabb4", face: "smile", accessory: "none", special: "bunny" },
      { id: "opal-bunny", name: "Lilac Blossom Bunny", rarity: "Legendary", color: "#e9dff5", accent: "#c79fc8", face: "smile", accessory: "none", special: "bunny" },
      { id: "starlight-panda", name: "Lavender Panda", rarity: "Epic", color: "#ffe2ca", accent: "#8b7891", face: "smile", accessory: "none", special: "panda" },
      { id: "moonwish-panda", name: "Honey Panda", rarity: "Legendary", color: "#fff0d6", accent: "#b59272", face: "smile", accessory: "none", special: "panda" },
      { id: "nebula-dragon", name: "Biscuit Kitty", rarity: "Epic", color: "#ffe4c7", accent: "#c49172", face: "smile", accessory: "none", special: "cat" },
      { id: "solstice-dragon", name: "Lilac Kitty", rarity: "Legendary", color: "#f3eafa", accent: "#aa94c2", face: "smile", accessory: "none", special: "cat" }
    ];
    STORE_INVENTORY = {
      id: "little-surprises",
      name: "Dumpling blind box",
      price: 4,
      tripLimit: 3
    };
  }
});

// src/data/ticketPrizes.ts
function ticketPrizes(day) {
  return ["Common", "Common", "Rare", "Epic"].map((rarity, i) => {
    const pool = DUMPLINGS.filter((d) => d.rarity === rarity);
    return { item: pool[(day * 3 + i) % pool.length], cost: [1, 3, 5, 8][i], slot: String(i) };
  });
}
var init_ticketPrizes = __esm({
  "src/data/ticketPrizes.ts"() {
    "use strict";
    init_collection();
  }
});

// src/data/popIdentity.ts
var POP_IDENTITY, visuallyDistinct;
var init_popIdentity = __esm({
  "src/data/popIdentity.ts"() {
    "use strict";
    POP_IDENTITY = {
      mochi: { shape: "dumpling", tone: "cream" },
      rosie: { shape: "dumpling", tone: "pink" },
      minty: { shape: "dumpling", tone: "green" },
      blueberry: { shape: "dumpling", tone: "blue" },
      peachy: { shape: "dumpling", tone: "pink" },
      sunny: { shape: "pudding", tone: "yellow" },
      custard: { shape: "pudding", tone: "yellow" },
      lavendream: { shape: "bunny", tone: "purple" },
      bunny: { shape: "bunny", tone: "cream" },
      moonbean: { shape: "bunny", tone: "cream" },
      stardrop: { shape: "star", tone: "yellow" },
      sugarstar: { shape: "star", tone: "yellow" },
      comet: { shape: "star", tone: "blue" },
      supernova: { shape: "star", tone: "yellow" },
      shortcake: { shape: "cake", tone: "pink" },
      cocoa: { shape: "cake", tone: "brown" },
      sorbet: { shape: "cake", tone: "pink" },
      macaron: { shape: "macaron", tone: "green" },
      kitten: { shape: "cat", tone: "cream" },
      fox: { shape: "cat", tone: "orange" },
      aurora: { shape: "cat", tone: "purple" },
      panda: { shape: "bear", tone: "cream" },
      sleepykoala: { shape: "bear", tone: "blue" },
      goldenbear: { shape: "bear", tone: "yellow" },
      nebula: { shape: "cloud", tone: "pink" },
      orbit: { shape: "planet", tone: "green" },
      "dewdrop-unicorn": { shape: "frog", tone: "green" },
      "sunbeam-unicorn": { shape: "frog", tone: "green" },
      "sugarplum-bunny": { shape: "bunny", tone: "cream" },
      "opal-bunny": { shape: "bunny", tone: "purple" },
      "starlight-panda": { shape: "bear", tone: "cream" },
      "moonwish-panda": { shape: "bear", tone: "yellow" },
      "nebula-dragon": { shape: "cat", tone: "cream" },
      "solstice-dragon": { shape: "cat", tone: "purple" }
    };
    visuallyDistinct = (a, b) => POP_IDENTITY[a].shape !== POP_IDENTITY[b].shape && POP_IDENTITY[a].tone !== POP_IDENTITY[b].tone;
  }
});

// src/data/squishyPop.ts
function boardPool(collection, random = Math.random) {
  const eligible = [.../* @__PURE__ */ new Set([...DUMPLINGS.filter((d) => collection[d.id] > 0).map((d) => d.id), ...POP_STARTERS])];
  for (let i = eligible.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
  }
  let best = [], ownedBest = -1;
  const choose = (pool, start, owned) => {
    if (pool.length === POP_RULES.activeTypes) {
      if (owned > ownedBest) {
        best = [...pool];
        ownedBest = owned;
      }
      return;
    }
    for (let i = start; i < eligible.length; i++) if (pool.every((id) => visuallyDistinct(id, eligible[i]))) choose([...pool, eligible[i]], i + 1, owned + (collection[eligible[i]] > 0 ? 1 : 0));
  };
  choose([], 0, 0);
  return best;
}
var POP_RULES, POP_STARTERS, powerForChain, starLevel, roundTickets, PopBoard;
var init_squishyPop = __esm({
  "src/data/squishyPop.ts"() {
    "use strict";
    init_collection();
    init_popIdentity();
    POP_RULES = {
      columns: 6,
      rows: 6,
      seconds: 60,
      minimum: 3,
      activeTypes: 5,
      scorePerPiece: 10,
      pointsPerTicket: 500,
      minimumTickets: 1,
      maximumTickets: 8,
      couponTickets: 40,
      couponValue: 1,
      frenzySeconds: 7
    };
    POP_STARTERS = ["rosie", "lavendream", "macaron", "stardrop", "panda", "fox", "comet", "sunny", "minty", "mochi"];
    powerForChain = (n) => n >= 10 ? "mega" : n >= 7 ? "rainbow" : n >= 5 ? "bomb" : void 0;
    starLevel = (copies) => copies >= 5 ? 3 : copies >= 2 ? 2 : copies >= 1 ? 1 : 0;
    roundTickets = (score) => Math.min(POP_RULES.maximumTickets, POP_RULES.minimumTickets + Math.floor(Math.max(0, score) / POP_RULES.pointsPerTicket));
    PopBoard = class {
      constructor(pool, collection = {}, random = Math.random) {
        this.pool = pool;
        this.collection = collection;
        this.random = random;
        if (pool.length < 3 || pool.some((id) => !DUMPLINGS.some((d) => d.id === id))) throw Error("Squishy Pop needs a valid starter pool.");
        this.pieces = Array.from({ length: POP_RULES.columns * POP_RULES.rows }, () => this.newPiece());
        this.ensurePlayable();
      }
      pool;
      collection;
      random;
      pieces = [];
      chain = [];
      score = 0;
      bestChain = 0;
      pops = 0;
      shuffles = 0;
      frenzyMeter = 0;
      frenzyUntil = 0;
      lastStrong = -100;
      serial = 0;
      newPiece() {
        return { id: ++this.serial, kind: this.pool[Math.floor(this.random() * this.pool.length)] };
      }
      adjacent(a, b) {
        return a !== b && Math.abs(a % 6 - b % 6) <= 1 && Math.abs(Math.floor(a / 6) - Math.floor(b / 6)) <= 1;
      }
      begin(index) {
        this.chain = [];
        return this.extend(index);
      }
      extend(index) {
        if (!Number.isInteger(index) || index < 0 || index >= this.pieces.length) return false;
        if (this.chain.length > 1 && index === this.chain.at(-2)) {
          this.chain.pop();
          return true;
        }
        if (this.chain.includes(index)) return false;
        const base = this.chain.find((i) => this.pieces[i].power !== "rainbow");
        if (this.chain.length && (!this.adjacent(this.chain.at(-1), index) || base !== void 0 && this.pieces[index].power !== "rainbow" && this.pieces[index].kind !== this.pieces[base].kind)) return false;
        this.chain.push(index);
        return true;
      }
      cancel() {
        this.chain = [];
      }
      affected(chain, finale = false) {
        const removed = new Set(chain), effects = [];
        for (const index of removed) {
          const piece = this.pieces[index], power = piece.power;
          if (!power) continue;
          const targets = power === "rainbow" ? finale ? this.pieces.flatMap((p, i) => p.kind === piece.kind ? [i] : []) : chain : this.pieces.flatMap((_, i) => Math.abs(i % 6 - index % 6) <= (power === "mega" ? 2 : 1) && Math.abs(Math.floor(i / 6) - Math.floor(index / 6)) <= (power === "mega" ? 2 : 1) ? [i] : []);
          targets.forEach((i) => removed.add(i));
          effects.push({ power, index, targets });
        }
        return { removed, effects };
      }
      preview() {
        const valid = this.chain.length >= 3 || this.chain.length === 1 && ["bomb", "mega"].includes(this.pieces[this.chain[0]].power ?? "");
        return { valid, created: powerForChain(this.chain.length), ...this.affected(valid ? this.chain : []) };
      }
      finale(now = 0) {
        const powers = this.pieces.flatMap((p, i) => p.power ? [i] : []);
        this.cancel();
        return powers.length ? this.resolve(powers, now, true) : null;
      }
      findChain(minimum = 3) {
        const walk = (path) => {
          if (path.length >= minimum) return path;
          const at = path.at(-1);
          const base = path.find((i) => this.pieces[i].power !== "rainbow");
          for (let i = 0; i < this.pieces.length; i++) if (!path.includes(i) && this.adjacent(at, i) && (base === void 0 || this.pieces[i].power === "rainbow" || this.pieces[i].kind === this.pieces[base].kind)) {
            const found = walk([...path, i]);
            if (found.length) return found;
          }
          return [];
        };
        for (let i = 0; i < this.pieces.length; i++) {
          const found = walk([i]);
          if (found.length) return found;
        }
        return [];
      }
      ensurePlayable() {
        if (this.findChain().length) return false;
        for (let attempt = 0; attempt < 8; attempt++) {
          for (let i = this.pieces.length - 1; i > 0; i--) {
            const j = Math.floor(this.random() * (i + 1));
            [this.pieces[i], this.pieces[j]] = [this.pieces[j], this.pieces[i]];
          }
          if (this.findChain().length) {
            this.shuffles++;
            return true;
          }
        }
        const row = Math.floor(this.random() * 6) * 6, kind = this.pool[0];
        for (let i = 0; i < 3; i++) this.pieces[row + i].kind = kind;
        this.shuffles++;
        return true;
      }
      release(now = 0) {
        const chain = [...this.chain];
        this.cancel();
        const tapPower = chain.length === 1 && ["bomb", "mega"].includes(this.pieces[chain[0]].power ?? "");
        if (chain.length < 3 && !tapPower) return null;
        return this.resolve(chain, now);
      }
      resolve(chain, now, finale = false) {
        const { removed, effects } = this.affected(chain, finale), activated = effects.map((e) => e.power), moves = [];
        const cleared = [...removed].map((index) => ({ index, piece: this.pieces[index] }));
        const created = finale ? void 0 : powerForChain(chain.length);
        if (created) {
          const at = chain.at(-1);
          this.pieces[at] = { ...this.newPiece(), kind: this.pieces[at].kind, power: created };
          removed.delete(at);
        }
        for (let column = 0; column < 6; column++) {
          const kept = this.pieces.map((piece, index) => ({ piece, index })).filter((x) => x.index % 6 === column && !removed.has(x.index));
          for (let row = 5; row >= 0; row--) {
            const old = kept.pop(), to = row * 6 + column, piece = old?.piece ?? this.newPiece();
            this.pieces[to] = piece;
            moves.push({ piece, from: old?.index ?? (row - 6) * 6 + column, to });
          }
        }
        const bonus = finale ? 1 : chain.length >= 10 ? 3 : chain.length >= 7 ? 2 : chain.length >= 5 ? 1.5 : 1;
        if (!finale && chain.length >= 5 && now >= this.frenzyUntil) {
          this.frenzyMeter = Math.min(100, Math.max(0, this.frenzyMeter - Math.max(0, now - this.lastStrong - 4) * 4) + chain.length * 5 + (now - this.lastStrong < 4 ? 10 : 0));
          this.lastStrong = now;
          if (this.frenzyMeter >= 100) {
            this.frenzyUntil = now + POP_RULES.frenzySeconds;
            this.frenzyMeter = 0;
          }
        }
        const frenzy = !finale && now < this.frenzyUntil;
        const score = Math.round(cleared.reduce((sum, c) => sum + POP_RULES.scorePerPiece * (1 + Math.max(0, starLevel(this.collection[c.piece.kind] || 0) - 1) * 0.02), 0) * bonus * (frenzy ? 2 : 1));
        this.score += score;
        if (!finale) {
          this.bestChain = Math.max(this.bestChain, chain.length);
          this.pops++;
        }
        const before = this.pieces.map((p) => p.id), shuffled = this.ensurePlayable();
        if (shuffled) {
          moves.length = 0;
          this.pieces.forEach((piece, to) => moves.push({ piece, from: before.indexOf(piece.id), to }));
        }
        return { chain: finale ? 0 : chain.length, cleared, moves, score, label: finale ? "LAST LITTLE POPS!" : chain.length >= 10 ? "SUPER SQUISH!" : chain.length >= 7 ? "GREAT!" : chain.length >= 5 ? "NICE!" : "POP!", shuffled, created, activated, effects, frenzy };
      }
    };
  }
});

// src/data/popLevels.ts
function levelUnlocked(level, records2 = {}) {
  const index = POP_LEVELS.findIndex((l) => l.id === level.id);
  return index === 0 || index > 0 && !!records2[POP_LEVELS[index - 1].id]?.completed;
}
function createLevelBoard(level, collection, random = Math.random) {
  const board = new PopBoard(boardPool(collection, random).slice(0, level.board.types), collection, random);
  [12, 13, 14, 15, 16, 17].slice(0, level.board.openingChain).forEach((i) => board.pieces[i].kind = board.pool[0]);
  for (const p of level.board.powers) board.pieces[p.index].power = p.power;
  return board;
}
function levelStars(level, values2, score) {
  return level.objectives.every((o, i) => values2[i] >= o.target) ? 1 + Number(score >= level.stars[0]) + Number(score >= level.stars[1]) : 0;
}
var POP_LEVELS, PopLevelRun;
var init_popLevels = __esm({
  "src/data/popLevels.ts"() {
    "use strict";
    init_squishyPop();
    POP_LEVELS = [
      {
        id: "little-chains",
        name: "Little chains",
        hint: "Connect 3 or more matching friends.",
        seconds: 60,
        board: { types: 4, openingChain: 3, powers: [] },
        objectives: [{ kind: "score", target: 300 }],
        stars: [600, 1e3]
      },
      {
        id: "big-squishes",
        name: "Big squishes",
        hint: "Connect 5 or more in one drag. Do it twice!",
        seconds: 60,
        board: { types: 4, openingChain: 5, powers: [] },
        objectives: [{ kind: "chains", length: 5, target: 2 }],
        stars: [800, 1400]
      },
      {
        id: "friend-party",
        name: "Friend party",
        hint: "Pop your pictured friend. Tap Bombs or chain through Rainbows!",
        seconds: 60,
        board: { types: 5, openingChain: 5, powers: [{ index: 28, power: "bomb" }, { index: 14, power: "rainbow" }] },
        objectives: [{ kind: "friend", slot: 0, target: 12 }, { kind: "use", target: 2 }],
        stars: [900, 1600]
      }
    ];
    PopLevelRun = class {
      constructor(level, pool) {
        this.level = level;
        this.pool = pool;
        this.values = level.objectives.map(() => 0);
      }
      level;
      pool;
      values;
      frenzyUntil = 0;
      observe(result, score, finale = false, frenzyUntil = 0) {
        this.level.objectives.forEach((o, i) => {
          if (o.kind === "score") this.values[i] = score;
          else if (o.kind === "friend") this.values[i] += result.cleared.filter((c) => c.piece.kind === this.pool[o.slot]).length;
          else if (!finale) {
            if (o.kind === "chains" && result.chain >= o.length) this.values[i]++;
            if (o.kind === "create" && result.created && (!o.power || result.created === o.power)) this.values[i]++;
            if (o.kind === "use") this.values[i] += result.activated.filter((p) => !o.power || p === o.power).length;
            if (o.kind === "frenzy" && result.frenzy && frenzyUntil > this.frenzyUntil) this.values[i]++;
          }
        });
        this.frenzyUntil = Math.max(this.frenzyUntil, frenzyUntil);
      }
      get completed() {
        return this.level.objectives.every((o, i) => this.values[i] >= o.target);
      }
      attempt(bestChain) {
        return { levelId: this.level.id, values: [...this.values], bestChain };
      }
    };
  }
});

// src/data/hunt.ts
function unit(random) {
  const n = random();
  if (!Number.isFinite(n) || n < 0 || n >= 1) throw Error("Invalid random source.");
  return n;
}
function weighted(entries, random) {
  let n = unit(random) * entries.reduce((sum, e) => sum + e.weight, 0);
  for (const e of entries) {
    n -= e.weight;
    if (n < 0) return e.value;
  }
  return entries[entries.length - 1].value;
}
function createHuntDay(day, random = randomUnit) {
  const stores = {};
  for (const store of STORES) {
    const quantity = unit(random) < store.lowStockChance ? 1 : store.stock[0] + Math.floor(unit(random) * (store.stock[1] - store.stock[0] + 1));
    const sites = STOCK_SITES.map((_, i) => i), slots = [];
    for (let i = sites.length - 1; i > 0; i--) {
      const j = Math.floor(unit(random) * (i + 1));
      [sites[i], sites[j]] = [sites[j], sites[i]];
    }
    const assortment = [];
    const pool = store.series.map((e) => ({ value: e.id, weight: e.weight }));
    const assortmentSize = store.id === "toys" ? 3 : 2;
    while (assortment.length < Math.min(assortmentSize, store.series.length)) {
      const id = weighted(pool, random);
      assortment.push(id);
      pool.splice(pool.findIndex((p) => p.value === id), 1);
    }
    for (let i = 0; i < quantity; i++) {
      if (i < 6) slots.push({ site: sites[i], series: assortment[i % assortment.length], remaining: 1, discovered: false });
      else slots[i % 6].remaining++;
    }
    const clue = unit(random);
    const rumor = quantity === 1 ? "Low stock \u2014 a quiet shelf kind of day." : clue < 0.3 ? "Recently restocked. Worth a little look?" : clue < 0.6 ? `${seriesById(assortment[0]).name} spotted today.` : clue < 0.8 ? "A friend heard an unusual box might be here." : "Unknown inventory. A little mystery awaits.";
    stores[store.id] = { slots, rumor, visited: false };
  }
  return { day, stores, activeStore: null, clockFloor: 0 };
}
function rollSeries(series, store, random = randomUnit) {
  const pool = DUMPLINGS.filter((d) => seriesById(series).items.includes(d.id));
  const rarity = weighted(Object.keys(store.odds).filter((r) => pool.some((d) => d.rarity === r)).map((r) => ({ value: r, weight: store.odds[r] })), random);
  const options = pool.filter((d) => d.rarity === rarity);
  return options[Math.floor(unit(random) * options.length)];
}
var HUNT_RULES, SERIES, STORES, STOCK_SITES, seriesById, storeById, boxPrice;
var init_hunt = __esm({
  "src/data/hunt.ts"() {
    "use strict";
    init_collection();
    HUNT_RULES = { closingMinute: 1140, minimumSearchMinutes: 18, bagLimit: 3, inspectMilliseconds: 650 };
    SERIES = [
      { id: "garden", name: "Garden Friends", price: 4, color: "#bbd8b8", items: ["mochi", "rosie", "minty", "blueberry", "sunny", "lavendream", "peachy", "stardrop", "dewdrop-unicorn", "sunbeam-unicorn"] },
      { id: "treats", name: "Sweet Treats", price: 5, color: "#f1baca", items: ["shortcake", "custard", "cocoa", "macaron", "sorbet", "sugarstar", "sugarplum-bunny", "opal-bunny"] },
      { id: "animals", name: "Pocket Pals", price: 5, color: "#efd7a0", items: ["bunny", "kitten", "panda", "fox", "sleepykoala", "goldenbear", "starlight-panda", "moonwish-panda"] },
      { id: "galaxy", name: "Galaxy Dreams", price: 7, color: "#bab4e9", items: ["moonbean", "comet", "nebula", "orbit", "aurora", "supernova", "nebula-dragon", "solstice-dragon"] }
    ];
    STORES = [
      {
        id: "corner",
        name: "Clover Corner",
        subtitle: "A tiny neighborhood treasure stop",
        icon: "\u2618",
        travelMinutes: 55,
        markup: 0,
        stock: [3, 5],
        lowStockChance: 0.22,
        series: [{ id: "garden", weight: 6 }, { id: "treats", weight: 4 }],
        odds: { Common: 65, Rare: 25, Epic: 8, Legendary: 2 },
        palette: ["#b6d1ba", "#f4dfab", "#f7eedc"],
        layout: 0
      },
      {
        id: "toys",
        name: "Peachy Playroom",
        subtitle: "Colorful aisles, more places to peek",
        icon: "\u273F",
        travelMinutes: 90,
        markup: 1,
        stock: [5, 8],
        lowStockChance: 0.12,
        series: [{ id: "garden", weight: 2 }, { id: "treats", weight: 3 }, { id: "animals", weight: 5 }, { id: "galaxy", weight: 1 }],
        odds: { Common: 65, Rare: 25, Epic: 8, Legendary: 2 },
        palette: ["#ecb7cb", "#c4bbe3", "#fff0dc"],
        layout: 1
      },
      {
        id: "collector",
        name: "Moonbeam Finds",
        subtitle: "Small batches of unusual little friends",
        icon: "\u263E",
        travelMinutes: 165,
        markup: 2,
        stock: [2, 4],
        lowStockChance: 0.2,
        series: [{ id: "galaxy", weight: 7 }, { id: "animals", weight: 2 }, { id: "treats", weight: 1 }],
        odds: { Common: 65, Rare: 25, Epic: 8, Legendary: 2 },
        palette: ["#b7b5db", "#a7cfcd", "#eee4f3"],
        layout: 2
      }
    ];
    STOCK_SITES = ["Main shelf", "Endcap", "Checkout display", "Basket", "Lower shelf", "Special display"];
    seriesById = (id) => SERIES.find((s) => s.id === id);
    storeById = (id) => {
      const s = STORES.find((s2) => s2.id === id);
      if (!s) throw Error("That store is unavailable.");
      return s;
    };
    boxPrice = (store, series) => seriesById(series).price + store.markup;
  }
});

// src/data/trading.ts
function valueFor(id, trader, series) {
  const d = definition(id);
  if (!d) throw Error("Unknown squishy.");
  if (trader === "rarity") return { Common: 1, Rare: 4, Epic: 10, Legendary: 24 }[d.rarity];
  if (trader === "series") return { Common: 1, Rare: 2, Epic: 4, Legendary: 7 }[d.rarity] * (SERIES.find((s) => s.id === series)?.items?.includes(id) ? 4 : 1);
  return { Common: 1, Rare: 2, Epic: 3, Legendary: 5 }[d.rarity] * (cuteIds.includes(id) || d.accessory === "bow" ? 4 : 1);
}
function willing(day, trader, give) {
  const npc = day.traders[trader];
  return !npc.done && give.length > 0 && give.length <= 3 && !give.some((id) => npc.offer.includes(id)) && offerValue(give, trader, day.series) >= offerValue(npc.offer, trader, day.series);
}
function createTradingDay(day) {
  let seed = day * 2654435761 >>> 0;
  const random = () => (seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296;
  const traders = {};
  for (const [i, trader] of TRADERS.entries()) {
    const pool = DUMPLINGS.map((d) => d.id);
    for (let j = pool.length - 1; j > 0; j--) {
      const k = Math.floor(random() * (j + 1));
      [pool[j], pool[k]] = [pool[k], pool[j]];
    }
    const stock = pool.slice(0, 6);
    stock.sort((a, b) => valueFor(a, trader.id, SERIES[(day - 1) % SERIES.length].id) - valueFor(b, trader.id, SERIES[(day - 1) % SERIES.length].id));
    traders[trader.id] = { stock, offer: stock.slice(0, i + 1), asks: 0, revision: 0, done: false, message: "Here\u2019s what I brought. What would you trade?" };
  }
  return { day, series: SERIES[(day - 1) % SERIES.length].id, traders };
}
function negotiate(day, trader, give) {
  const npc = day.traders[trader];
  if (npc.done || npc.asks >= 4) throw Error("That\u2019s my final offer for today. Take your time deciding.");
  if (!give.length) throw Error("Put a squishy on your side first.");
  npc.asks++;
  npc.revision++;
  const offered = offerValue(give, trader, day.series);
  const extras = npc.stock.filter((id) => !npc.offer.includes(id) && !give.includes(id));
  const add = extras.find((id) => npc.offer.length < 3 && offered >= offerValue([...npc.offer, id], trader, day.series));
  if (add) {
    npc.offer.push(add);
    npc.message = "Okay! I\u2019ll add " + definition(add).name + ".";
    return;
  }
  if (npc.asks % 2 === 0) {
    const swap = extras[0];
    if (swap) {
      const old = npc.offer.pop();
      npc.offer.push(swap);
      npc.message = `What about ${definition(swap).name} instead of ${definition(old).name}? Look again before you agree.`;
      return;
    }
  }
  npc.message = "I\u2019ll keep these on my side. Try something I love, or we can walk away.";
}
var TRADERS, cuteIds, definition, offerValue;
var init_trading = __esm({
  "src/data/trading.ts"() {
    "use strict";
    init_collection();
    init_hunt();
    TRADERS = [
      { id: "rarity", name: "Jules", title: "Rarity Hunter", icon: "\u2726", color: "#bca4e4", hint: "Rare finds make my day. A legendary? Even better!" },
      { id: "series", name: "Remy", title: "Series Collector", icon: "\u273F", color: "#a9cfb5", hint: "I\u2019m filling the gaps in my series!" },
      { id: "cute", name: "Poppy", title: "Cute Collector", icon: "\u2661", color: "#edb3cc", hint: "Pink, purple, and little bows. Those are my favorites!" }
    ];
    cuteIds = ["rosie", "shortcake", "lavendream", "sorbet", "nebula"];
    definition = (id) => DUMPLINGS.find((d) => d.id === id);
    offerValue = (ids, trader, series) => ids.reduce((sum, id) => sum + valueFor(id, trader, series), 0);
  }
});

// src/systems/ProgressStore.ts
function parse(raw) {
  if (raw === null) return fresh();
  const value = JSON.parse(raw);
  if (value?.version !== 1 || !Number.isSafeInteger(value.balance) || value.balance < 0 || !value.collection || Object.values(value.collection).some((count) => !Number.isSafeInteger(count) || count < 0) || !Array.isArray(value.boxes) || value.boxes.some((box) => typeof box.id !== "string" || !validId(box.dumplingId)) || !Array.isArray(value.creditedRounds) || value.creditedRounds.some((id) => typeof id !== "string") || !value.trip || typeof value.trip.active !== "boolean" || !Number.isSafeInteger(value.trip.purchases) || value.trip.purchases < 0 || !["cleanup", "store", "home", "collection"].includes(value.location) || value.reveal !== null && (!value.reveal || !validId(value.reveal.dumplingId) || typeof value.reveal.id !== "string" || !Number.isSafeInteger(value.reveal.count) || value.reveal.count < 1)) {
    throw new Error("Saved progress could not be read. It has not been overwritten.");
  }
  if (value.hunt) {
    const h = value.hunt;
    if (!Number.isInteger(h.day) || h.day < 1 || !Number.isFinite(h.clockFloor) || h.clockFloor < 0 || h.clockFloor > HUNT_RULES.closingMinute || h.activeStore !== null && !STORES.some((s) => s.id === h.activeStore) || !h.stores || STORES.some((store) => {
      const s = h.stores[store.id];
      return !s || typeof s.rumor !== "string" || typeof s.visited !== "boolean" || !Array.isArray(s.slots) || s.slots.length > 6 || new Set(s.slots.map((slot) => slot.site)).size !== s.slots.length || s.slots.some((slot) => !Number.isInteger(slot.site) || slot.site < 0 || slot.site > 5 || !SERIES.some((series) => series.id === slot.series) || !Number.isInteger(slot.remaining) || slot.remaining < 0 || slot.remaining > 2 || typeof slot.discovered !== "boolean");
    })) throw Error("Daily store save could not be read.");
  }
  if (value.prizes && (!Number.isSafeInteger(value.prizes.day) || value.prizes.day < 1 || !Array.isArray(value.prizes.sold) || value.prizes.sold.some((s) => !["0", "1", "2", "3"].includes(s)) || new Set(value.prizes.sold).size !== value.prizes.sold.length)) throw Error("Prize shelf could not be read.");
  if (value.protections && (typeof value.protections !== "object" || Array.isArray(value.protections) || Object.entries(value.protections).some(([id, p]) => !validId(id) || !p || typeof p.favorite !== "boolean" || typeof p.locked !== "boolean"))) throw Error("Collection protections could not be read.");
  if (value.trading) {
    const t = value.trading;
    if (!Number.isSafeInteger(t.day) || t.day < 1 || !SERIES.some((s) => s.id === t.series) || !t.traders || TRADERS.some(({ id }) => {
      const n = t.traders[id];
      return !n || !Array.isArray(n.stock) || n.stock.length !== 6 || n.stock.some((id2) => !validId(id2)) || new Set(n.stock).size !== n.stock.length || !Array.isArray(n.offer) || n.offer.length < 1 || n.offer.length > 3 || n.offer.some((id2) => !n.stock.includes(id2)) || new Set(n.offer).size !== n.offer.length || !Number.isInteger(n.asks) || n.asks < 0 || n.asks > 4 || !Number.isSafeInteger(n.revision) || n.revision < 0 || typeof n.done !== "boolean" || typeof n.message !== "string";
    })) throw Error("Trading save could not be read.");
  }
  if (value.pop) {
    const p = value.pop;
    if (!Number.isSafeInteger(p.tickets) || p.tickets < 0 || !Number.isSafeInteger(p.bestScore) || p.bestScore < 0 || !Array.isArray(p.rounds) || p.rounds.some((id) => typeof id !== "string") || typeof p.tutorialSeen !== "boolean" || !Number.isSafeInteger(p.couponDay) || p.couponDay < 0) throw Error("Squishy Pop save could not be read.");
  }
  if (value.pop?.levels) {
    const levels = value.pop.levels;
    if (typeof levels !== "object" || Array.isArray(levels) || Object.values(levels).some((l) => !l || typeof l.completed !== "boolean" || ![l.stars, l.bestScore, l.bestChain, l.attempts].every((n) => Number.isSafeInteger(n) && n >= 0) || l.stars > 3 || l.completed !== l.stars > 0)) throw Error("Squishy Pop levels could not be read.");
  }
  return value;
}
var SAVE_KEY2, LocalSaveRepository, fresh, validId, ProgressStore;
var init_ProgressStore = __esm({
  "src/systems/ProgressStore.ts"() {
    "use strict";
    init_SaveNamespace();
    init_collection();
    init_saveId();
    init_ticketPrizes();
    init_squishyPop();
    init_popLevels();
    init_trading();
    init_hunt();
    SAVE_KEY2 = saveKey("progress.v1");
    LocalSaveRepository = class {
      read() {
        return localStorage.getItem(SAVE_KEY2);
      }
      write(value) {
        localStorage.setItem(SAVE_KEY2, value);
      }
    };
    fresh = () => ({ version: 1, balance: 0, collection: {}, boxes: [], creditedRounds: [], trip: { active: false, purchases: 0 }, location: "cleanup", reveal: null });
    validId = (id) => typeof id === "string" && DUMPLINGS.some((d) => d.id === id);
    ProgressStore = class {
      constructor(repository, random, makeId = saveId) {
        this.repository = repository;
        this.random = random;
        this.makeId = makeId;
        try {
          this.data = parse(repository.read());
        } catch {
          this.problem = "Saved progress is unavailable. Allow local storage and reload; existing data has not been replaced.";
        }
      }
      repository;
      random;
      makeId;
      data = fresh();
      problem = "";
      commit(change) {
        let draft;
        try {
          draft = parse(this.repository.read());
        } catch {
          throw new Error("Unable to read your save. No progress was changed.");
        }
        const result = change(draft);
        try {
          this.repository.write(JSON.stringify(draft));
        } catch {
          throw new Error("Unable to save. Please allow local storage and try again.");
        }
        this.data = draft;
        this.problem = "";
        return result;
      }
      refresh() {
        this.data = parse(this.repository.read());
      }
      /** Developer tools use the same read/validate/write transaction as gameplay. */
      developerEdit(change) {
        return this.commit((data) => {
          change(data);
          parse(JSON.stringify(data));
        });
      }
      completePopRound(id, score, attempt) {
        if (!id || !Number.isSafeInteger(score) || score < 0) throw Error("Invalid Squishy Pop round.");
        return this.commit((data) => {
          const p = data.pop ??= { tickets: 0, bestScore: 0, rounds: [], tutorialSeen: false, couponDay: 0 };
          if (!p.rounds.includes(id)) {
            if (attempt) {
              const level = POP_LEVELS.find((l) => l.id === attempt.levelId);
              if (!level || !levelUnlocked(level, p.levels) || !Array.isArray(attempt.values) || attempt.values.length !== level.objectives.length || !attempt.values.every((n) => Number.isSafeInteger(n) && n >= 0) || !Number.isSafeInteger(attempt.bestChain) || attempt.bestChain < 0 || attempt.bestChain > 36) throw Error("Invalid Squishy Pop level result.");
              const stars = levelStars(level, attempt.values, score), levels = p.levels ??= {}, old = levels[level.id];
              levels[level.id] = { completed: !!old?.completed || stars > 0, stars: Math.max(old?.stars ?? 0, stars), bestScore: Math.max(old?.bestScore ?? 0, score), bestChain: Math.max(old?.bestChain ?? 0, attempt.bestChain), attempts: (old?.attempts ?? 0) + 1 };
            }
            p.tickets += roundTickets(score);
            p.bestScore = Math.max(p.bestScore, score);
            p.rounds.push(id);
            p.tutorialSeen = true;
          }
          return p.tickets;
        });
      }
      // Saved tickets are now spent deliberately at the prize shelf, never auto-spent.
      popDiscount(_data = this.data) {
        return 0;
      }
      redeemPrize(day, slot) {
        return this.commit((data) => {
          if (data.hunt?.day !== day) throw Error("The prize shelf changed. Open it again.");
          const prize = ticketPrizes(day).find((p) => p.slot === slot);
          if (!prize) throw Error("Choose a prize.");
          const shelf = data.prizes?.day === day ? data.prizes : data.prizes = { day, sold: [] };
          if (shelf.sold.includes(slot)) throw Error("This prize is sold out today. More arrive tomorrow!");
          if (!data.pop || data.pop.tickets < prize.cost) throw Error("Play another round to earn more tickets.");
          data.pop.tickets -= prize.cost;
          shelf.sold.push(slot);
          data.collection[prize.item.id] = (data.collection[prize.item.id] ?? 0) + 1;
          return prize.item.name;
        });
      }
      creditRound(id, amount) {
        if (!Number.isSafeInteger(amount) || amount < 0) throw new Error("Invalid allowance reward.");
        return this.commit((data) => {
          if (data.creditedRounds.includes(id)) return false;
          data.balance += amount;
          data.creditedRounds.push(id);
          data.creditedRounds = data.creditedRounds.slice(-100);
          return true;
        });
      }
      startTrip() {
        this.commit((data) => {
          if (!data.trip.active) data.trip = { active: true, purchases: 0 };
          data.location = "store";
        });
      }
      ensureTradingDay(day) {
        if (!Number.isSafeInteger(day) || day < 1) throw Error("Invalid trading day.");
        if (this.data.trading?.day === day) return;
        this.commit((data) => {
          if (!data.trading || data.trading.day < day) data.trading = createTradingDay(day);
        });
      }
      protect(id, kind, enabled) {
        this.commit((data) => {
          if (!validId(id) || !data.collection[id]) throw Error("Collect this squishy first.");
          const p = (data.protections ??= {})[id] ??= { favorite: false, locked: false };
          p[kind] = enabled;
        });
      }
      checkTrade(data, day, trader, revision, give, includeLast) {
        const t = data.trading, n = t?.traders[trader];
        if (!t || t.day !== day || !n || n.done || n.revision !== revision) throw Error("This offer changed. Reopen the table to see the latest offer.");
        if (!give.length || give.length > 3 || give.some((id) => !validId(id))) throw Error("Choose one to three squishies.");
        for (const id of new Set(give)) {
          const count = give.filter((item) => item === id).length, p = data.protections?.[id];
          if (p?.favorite || p?.locked) throw Error("Favorites and locked squishies stay safe in your collection.");
          if ((data.collection[id] || 0) - count < (includeLast ? 0 : 1)) throw Error("Your collection changed, or this is your last copy. Choose again.");
          if (n.offer.includes(id)) throw Error("Choose a different squishy from the ones on their side.");
        }
        return t;
      }
      askTrade(day, trader, revision, give, includeLast = false) {
        this.commit((data) => {
          const t = this.checkTrade(data, day, trader, revision, give, includeLast);
          negotiate(t, trader, give);
        });
      }
      executeTrade(day, trader, revision, give, includeLast = false) {
        return this.commit((data) => {
          const t = this.checkTrade(data, day, trader, revision, give, includeLast);
          if (!willing(t, trader, give)) throw Error("They aren\u2019t ready to agree. Try a different offer.");
          const received = [...t.traders[trader].offer];
          for (const id of give) data.collection[id]--;
          for (const id of received) data.collection[id] = (data.collection[id] || 0) + 1;
          t.traders[trader].done = true;
          t.traders[trader].revision++;
          t.traders[trader].message = "Deal! Thanks, Arianna. I\u2019ll bring more tomorrow.";
          return received;
        });
      }
      ensureHuntDay(day) {
        if (this.data.hunt?.day === day) return;
        this.commit((data) => {
          if (data.hunt?.day !== day) {
            data.hunt = createHuntDay(day, this.random);
            data.trip = { active: false, purchases: 0 };
            if (data.location === "store") data.location = "cleanup";
          }
        });
      }
      visitStore(id, day, minutes) {
        return this.commit((data) => {
          if (!data.hunt || data.hunt.day !== day) throw Error("The stores need a fresh daily delivery. Try again.");
          storeById(id);
          if (minutes < 900) throw Error("Visit after school.");
          if (data.hunt.stores[id].visited) throw Error("You already visited this store today. Choose another!");
          if (Object.values(data.hunt.stores).filter((s) => s.visited).length >= 2) throw Error("Two lovely stops today. More shopping tomorrow!");
          data.hunt.activeStore = id;
          data.hunt.stores[id].visited = true;
          data.trip = { active: true, purchases: 0 };
          data.location = "store";
          return minutes;
        });
      }
      discover(site) {
        this.commit((data) => {
          const id = data.hunt?.activeStore, slot = id ? data.hunt.stores[id].slots.find((s) => s.site === site) : null;
          if (data.location !== "store" || !slot || slot.remaining < 1) throw Error("This display is empty. Keep looking!");
          slot.discovered = true;
        });
      }
      purchaseStock(site) {
        return this.commit((data) => {
          const id = data.hunt?.activeStore, slot = id ? data.hunt.stores[id].slots.find((s) => s.site === site) : null;
          if (data.location !== "store" || !data.trip.active || !id || !slot || slot.remaining < 1) throw Error("This display has sold out.");
          if (!slot.discovered) throw Error("Take a look at this box first.");
          if (data.trip.purchases >= HUNT_RULES.bagLimit) throw Error("Your bag is full. Bring your surprises home!");
          const store = storeById(id), discount = this.popDiscount(data), price = boxPrice(store, slot.series) - discount;
          if (data.balance < price) throw Error(`This series costs $${price}. Save a little more allowance.`);
          const box = { id: this.makeId(), dumplingId: rollSeries(slot.series, store, this.random).id, series: slot.series };
          data.balance -= price;
          slot.remaining--;
          data.boxes.push(box);
          data.trip.purchases++;
          if (discount) {
            data.pop.tickets -= POP_RULES.couponTickets;
            data.pop.couponDay = data.hunt.day;
          }
          return box.id;
        });
      }
      purchase() {
        return this.commit((data) => {
          if (data.location !== "store" || !data.trip.active) throw new Error("Visit the store to buy a box.");
          if (data.trip.purchases >= STORE_INVENTORY.tripLimit) throw new Error("Your bag is full for this trip. Time to go home!");
          if (data.balance < STORE_INVENTORY.price) throw new Error(`A box costs $${STORE_INVENTORY.price}. Earn a little more allowance first.`);
          const box = { id: this.makeId(), dumplingId: rollDumpling(this.random).id };
          data.balance -= STORE_INVENTORY.price;
          data.boxes.push(box);
          data.trip.purchases++;
          return box.id;
        });
      }
      goHome() {
        this.commit((data) => {
          data.location = "home";
          data.trip.active = false;
          if (data.hunt) data.hunt.activeStore = null;
        });
      }
      openNext() {
        return this.commit((data) => {
          if (data.location !== "home") throw new Error("Open your boxes at home.");
          if (data.reveal) return data.reveal;
          const box = data.boxes.shift();
          if (!box) throw new Error("No unopened boxes. A little cleanup earns your next one!");
          const count = (data.collection[box.dumplingId] || 0) + 1;
          data.collection[box.dumplingId] = count;
          data.reveal = { ...box, count, isNew: count === 1 };
          return data.reveal;
        });
      }
      finishReveal() {
        this.commit((data) => {
          data.reveal = null;
        });
      }
      showCollection() {
        this.commit((data) => {
          data.reveal = null;
          data.location = "collection";
          data.trip.active = false;
        });
      }
      startCleanup() {
        this.commit((data) => {
          data.location = "cleanup";
          data.trip.active = false;
          data.reveal = null;
          if (data.hunt) data.hunt.activeStore = null;
        });
      }
    };
  }
});

// src/game/dumplingVisual.ts
import { Entity as Entity23 } from "playcanvas";
function createBlindBox(app, parent, compact = false) {
  const root = new Entity23("Bamboo surprise steamer", app);
  parent.addChild(root);
  const model = steamerModel(app, compact);
  root.addChild(model);
  const lid = compact ? new Entity23("Static shelf lid", app) : model.findByName("LidHinge");
  if (compact) root.addChild(lid);
  return { root, lid };
}
function createDumpling(app, parent, data) {
  const root = new Entity23(data.name, app);
  parent.addChild(root);
  root.addChild(squishyModel(app, data));
  return root;
}
function dumplingPortrait(data, locked) {
  if (!locked) return assetUrl(`${"/"}assets/squishies/portraits/${data.id}.webp`);
  return `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M14 62C11 43 27 31 39 24C37 17 44 14 48 20C48 12 57 12 59 20C66 14 72 21 68 27C81 36 90 48 88 65C84 89 17 90 14 62Z" fill="#d8d1df"/><g fill="none" stroke="#c7bed0" stroke-width="2" stroke-linecap="round"><path d="M43 26Q33 39 28 47M54 25Q52 38 57 47M65 29Q71 37 76 43"/></g><text x="51" y="66" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="bold" fill="#fff">?</text></svg>')}`;
}
var init_dumplingVisual = __esm({
  "src/game/dumplingVisual.ts"() {
    "use strict";
    init_AssetUrls();
    init_SquishyArt();
  }
});

// src/game/store.ts
import { BoundingBox as BoundingBox11, Color as Color7, Entity as Entity24, Vec3 as Vec324 } from "playcanvas";
function createStore(app, definition2) {
  const root = new Entity24(definition2.name, app);
  app.root.addChild(root);
  root.tags.add("migration.store");
  const surfaces = new SurfaceTextures(app), art = new HouseArt(app, root, surfaces), shape = primitives(app, root), obstacles = [];
  const [accent, secondary, ivory] = definition2.palette;
  const width = definition2.layout === 1 ? 4.1 : 3.4, depth = definition2.layout === 0 ? 7.2 : definition2.layout === 1 ? 9 : 8.4;
  const floor = material(definition2.name + " floor", ["#c3d1b5", "#efd7e2", "#b9bfd4"][definition2.layout]);
  surfaces.apply(floor, ["tile", "checker", "rug"][definition2.layout], definition2.layout === 2 ? 5 : 8);
  const wall = material("Shop cream", ivory), trim = material("Shop accent", accent), rug = material("Shop woven rug", secondary);
  surfaces.apply(rug, "rug", 2);
  shape("Maple floor", "box", [0, -0.12, 0], [width * 2, 0.24, depth * 2], floor);
  shape("Back wall", "box", [0, 1.55, -depth - 0.08], [width * 2, 3.1, 0.16], wall);
  shape("Left wall", "box", [-width - 0.08, 1.55, 0], [0.16, 3.1, depth * 2], wall);
  shape("Store skirting", "box", [0, 0.13, -depth + 0.015], [width * 2, 0.26, 0.06], trim);
  shape("Shop garden surroundings", "box", [0, -0.22, 0], [26, 0.18, 40], material("Shop grass", "#a6bc89"), false);
  for (let x = -3; x <= 3; x += 2) art.add("building", "floor", [x, -0.08, depth + 1], 2, 0, "width");
  art.add("nature", "tree_oak", [-width - 1.8, -0.07, depth + 2.3], 3.5);
  art.add("nature", "tree_oak", [width + 2, -0.07, depth + 1.2], 3.8);
  const exitAnchor = new Vec324(0, 0, depth - 0.65);
  shape("Welcome mat", "box", [0, 0.012, exitAnchor.z], [1.75, 0.025, 0.95], rug, false);
  shape("Center rug", "box", [0.1, 0.014, -0.2], [2.5, 0.025, 3], rug, false);
  art.add("building", "wall-window-wide-round", [-width + 0.06, 0.02, -1.9], 2.55, 0, "height");
  art.add("building", "wall-doorway-round", [width - 1, 0.01, -depth + 0.05], 2.65, 90);
  art.add("building", "door-rotate-round-a", [width - 1, 0.02, -depth + 0.1], 2.1, 90);
  const offset = definition2.layout === 2 ? 0.7 : 0;
  const sites = [
    { fixture: [-1.8, 0, -depth + 0.55], point: [-1.8, 0, -depth + 1.45], box: [-1.8, 0.87, -depth + 0.65], kind: "bookcaseOpen" },
    { fixture: [-2.35, 0, -0.7 - offset], point: [-1.35, 0, -0.7 - offset], box: [-2.17, 1.04, -0.7 - offset], kind: "shelf-end" },
    { fixture: [2.3, 0, depth - 2.4], point: [1.2, 0, depth - 2.4], box: [2.18, 1.04, depth - 2.1], kind: "kitchenCabinetDrawer" },
    { fixture: [-2.5, 0, depth - 1.45], point: [-1.65, 0, depth - 1.45], box: [-2.5, 0.24, depth - 1.45], kind: "shopping-basket" },
    { fixture: [2.4, 0, -depth + 2.1], point: [1.4, 0, -depth + 2.1], box: [2.25, 0.35, -depth + 2.1], kind: "bookcaseOpenLow" },
    { fixture: [0.65, 0, 0.45 - offset], point: [0.65, 0, 1.8 - offset], box: [0.65, definition2.layout === 2 ? 0.8 : 0.53, 0.45 - offset], kind: definition2.layout === 2 ? "tableRound" : "tableCoffee" }
  ];
  const boxes = [], glows = [];
  for (const [i, site] of sites.entries()) {
    const market = ["shelf-end", "shopping-basket"].includes(site.kind);
    const sizes = [2.05, 1.35, 1, 0.46, 1.05, 1.5];
    art.add(market ? "market" : "furniture", site.kind, site.fixture, sizes[i], i === 1 ? 90 : i === 4 ? -90 : 0, i === 5 ? "width" : "height", { carpet: accent, wood: accent, woodDark: secondary, metal: ivory }, false, 0, "paint");
    const half = i === 0 ? [0.48, 0.3] : i === 1 ? [0.3, 0.55] : i === 2 ? [0.53, 0.55] : i === 3 ? [0.36, 0.4] : i === 4 ? [0.34, 0.53] : [0.76, definition2.layout === 2 ? 0.88 : 0.46];
    obstacles.push(new BoundingBox11(new Vec324(site.fixture[0], 0, site.fixture[2]), new Vec324(half[0], 1, half[1])));
    boxes.push([0, 1].map((n) => {
      const box = createBlindBox(app, root, true).root;
      box.name = `${STOCK_SITES[i]} surprise ${n}`;
      box.setLocalScale(0.24, 0.24, 0.24);
      const sideways = i === 1 || i === 4;
      const spread = (n - 0.5) * 0.34;
      box.setLocalPosition(site.box[0] + (sideways || i === 3 ? 0 : spread), site.box[1] + (i === 3 ? n * 0.16 : 0), site.box[2] + (sideways ? spread : 0));
      box.setLocalEulerAngles(0, i === 1 ? 90 : i === 4 ? -90 : 0, 0);
      box.enabled = false;
      return box;
    }));
    const glow = shape("Nearby display aura", "cylinder", [site.point[0], 0.027, site.point[2]], [0.85, 0.02, 0.85], material("Soft golden aura", "#ffe8ad"), false);
    glow.enabled = false;
    glows.push(glow);
  }
  art.add("market", "cash-register", [2.3, 1.03, depth - 2.65], 0.3, 90);
  art.add("market", "shopping-cart", [-width + 0.6, 0.02, 1.35], 0.85, 180);
  obstacles.push(new BoundingBox11(new Vec324(-width + 0.6, 0, 1.35), new Vec324(0.38, 1, 0.55)));
  art.add("market", "shelf-bags", [-width + 0.48, 0.02, -depth + 2.2], 1.1, 90);
  obstacles.push(new BoundingBox11(new Vec324(-width + 0.48, 0, -depth + 2.2), new Vec324(0.32, 1, 0.65)));
  art.add("furniture", "bear", [-1.65, 1.43, -depth + 0.62], 0.3);
  art.add("furniture", "plantSmall1", [2.56, 1.03, depth - 2.1], 0.27);
  art.add("furniture", "pottedPlant", [width - 0.45, 0.02, -0.2], 1.05);
  obstacles.push(new BoundingBox11(new Vec324(width - 0.45, 0, -0.2), new Vec324(0.33, 1, 0.33)));
  art.add("furniture", "lampRoundFloor", [-0.2, 0.02, -depth + 0.45], 1.9);
  if (definition2.layout === 1) {
    art.add("furniture", "bear", [2.5, 1.08, -depth + 2.1], 0.42);
    art.add("furniture", "benchCushion", [0.8, 0.02, -depth + 1], 0.75, 0, "height", { carpet: accent });
    obstacles.push(new BoundingBox11(new Vec324(0.8, 0, -depth + 1), new Vec324(0.65, 1, 0.42)));
    art.add("furniture", "bookcaseOpen", [-3.3, 0.02, -4.3], 1.8, 90);
    obstacles.push(new BoundingBox11(new Vec324(-3.3, 0, -4.3), new Vec324(0.3, 1, 0.5)));
    art.add("furniture", "bear", [-3.3, 0.68, -4.2], 0.38);
    art.add("furniture", "benchCushion", [3.3, 0.02, 1.9], 0.6, 90, "height", { carpet: accent });
    obstacles.push(new BoundingBox11(new Vec324(3.3, 0, 1.9), new Vec324(0.35, 1, 0.6)));
  }
  if (definition2.layout === 2) art.add("furniture", "plantSmall2", [0.65, 0.8, 0.08 - offset], 0.3);
  const room = { root, obstacles, halfWidth: width, halfDepth: depth, walkable: [{ minX: -width, maxX: width, minZ: -depth, maxZ: depth }], ready: art.finish(), artStats: () => art.snapshot() };
  root.enabled = false;
  const sync = (stock) => {
    for (let i = 0; i < sites.length; i++) {
      const slot = stock.slots.find((s) => s.site === i);
      boxes[i].forEach((box, n) => {
        box.enabled = !!slot && slot.remaining > n;
        if (slot) {
          for (const render of box.findComponents("render")) for (const mesh of render.meshInstances) {
            const original = mesh.material;
            if (!original.name.startsWith("Series ")) {
              const m = original.clone();
              m.name = "Series " + original.name;
              mesh.material = m;
            }
            if (mesh.material.name.includes("Box blush")) {
              const m = mesh.material;
              m.diffuse = new Color7().fromString(seriesById(slot.series).color);
              m.update();
            }
          }
        }
      });
    }
  };
  return { ...room, definition: definition2, sites: sites.map((s, i) => ({ id: i, name: STOCK_SITES[i], anchor: new Vec324(...s.point), marker: new Vec324(s.box[0], s.box[1] + 0.6, s.box[2]) })), boxes, glows, exitAnchor, sync };
}
var init_store = __esm({
  "src/game/store.ts"() {
    "use strict";
    init_primitives();
    init_dumplingVisual();
    init_hunt();
    init_HouseArt();
    init_SurfaceTextures();
  }
});

// src/game/SquishPlay.ts
function squishPose(time, style) {
  const t = Math.max(0, Math.min(1, time / 0.95)), wave = Math.sin(t * Math.PI), bounce = Math.sin(t * Math.PI * 4) * (1 - t);
  if (style === 1) {
    const y2 = 1 + 0.38 * wave;
    return { scale: [1 / Math.sqrt(y2), y2, 1 / Math.sqrt(y2)], roll: 0 };
  }
  if (style === 2) {
    const x = 1 + 0.2 * bounce;
    return { scale: [x, 1 / Math.sqrt(x), 1 / Math.sqrt(x)], roll: 12 * bounce || 0 };
  }
  const y = 1 - 0.3 * wave;
  return { scale: [1 / Math.sqrt(y), y, 1 / Math.sqrt(y)], roll: 0 };
}
var init_SquishPlay = __esm({
  "src/game/SquishPlay.ts"() {
    "use strict";
  }
});

// src/game/SquishyMotion.ts
function squishyOpeningPose(seconds, intensity = 1) {
  if (seconds >= SQUISHY_REVEAL_SECONDS) return { lid: -112, height: 0.34, scale: [1, 1, 1], wiggle: 0 };
  const launch = smooth((seconds - 0.92) / 0.62), fall = smooth((seconds - 1.54) / 0.67);
  const height = 0.11 + 1.02 * launch - 0.79 * fall;
  const size = 0.51 + 0.49 * launch;
  const stretch = 1 + 0.17 * intensity * Math.sin(launch * Math.PI) - 0.16 * intensity * Math.sin(smooth((seconds - 2.12) / 0.5) * Math.PI);
  const lid = -112 * smooth((seconds - 0.76) / 0.4) - 9 * Math.sin(smooth((seconds - 1.16) / 0.35) * Math.PI);
  const tension = clamp(seconds / 0.76);
  return { lid, height: height + 0.02 * Math.sin(smooth((seconds - 2.21) / 0.64) * Math.PI), scale: [size / Math.sqrt(stretch), size * stretch, size / Math.sqrt(stretch)], wiggle: seconds < 0.76 ? Math.sin(seconds * 42) * tension * tension * 4 : 0 };
}
var clamp, smooth, SQUISHY_REVEAL_SECONDS;
var init_SquishyMotion = __esm({
  "src/game/SquishyMotion.ts"() {
    "use strict";
    clamp = (n) => Math.max(0, Math.min(1, n));
    smooth = (n) => {
      const x = clamp(n);
      return x * x * (3 - 2 * x);
    };
    SQUISHY_REVEAL_SECONDS = 2.85;
  }
});

// src/game/SquishyRevealVfx.ts
import { BLEND_NORMAL, CULLFACE_NONE, Color as Color8, Entity as Entity25, Mesh as Mesh2, MeshInstance as MeshInstance2, PRIMITIVE_TRIANGLES, StandardMaterial as StandardMaterial4 } from "playcanvas";
var SquishyRevealVfx;
var init_SquishyRevealVfx = __esm({
  "src/game/SquishyRevealVfx.ts"() {
    "use strict";
    init_squishyPresentation();
    SquishyRevealVfx = class {
      root;
      mesh;
      material = new StandardMaterial4();
      positions = new Float32Array(1536 * 3);
      colors = new Float32Array(1536 * 4);
      indices = new Uint16Array(4096);
      vertices = 0;
      triangles = 0;
      previous = -100;
      style = SQUISHY_PRESENTATION.Common;
      color = new Color8();
      constructor(app, parent) {
        this.root = new Entity25("Rarity halo and celebration", app);
        parent.addChild(this.root);
        this.root.setLocalPosition(0, 1.02, -0.1);
        this.root.setLocalEulerAngles(-14, 10, 0);
        this.material.name = "Soft rarity light";
        this.material.useLighting = false;
        this.material.diffuse.set(0, 0, 0);
        this.material.emissive.set(1, 1, 1);
        this.material.emissiveVertexColor = true;
        this.material.opacityVertexColor = true;
        this.material.opacityVertexColorChannel = "a";
        this.material.blendType = BLEND_NORMAL;
        this.material.cull = CULLFACE_NONE;
        this.material.depthWrite = false;
        this.material.useTonemap = false;
        this.material.update();
        this.mesh = new Mesh2(app.graphicsDevice);
        this.mesh.clear(true, false, 1536, 4096);
        this.mesh.setPositions([0, 0, 0, 0, 0, 0, 0, 0, 0]);
        this.mesh.setColors([1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0]);
        this.mesh.setIndices([0, 1, 2]);
        this.mesh.update(PRIMITIVE_TRIANGLES);
        const instance = new MeshInstance2(this.mesh, this.material);
        instance.mask = 16;
        this.root.addComponent("render", { meshInstances: [instance], castShadows: false, receiveShadows: false });
        this.root.enabled = false;
      }
      configure(rarity) {
        this.style = SQUISHY_PRESENTATION[rarity];
        this.color.fromString(this.style.color);
        this.previous = -100;
      }
      vertex(x, y, a, white = 0) {
        const i = this.vertices++, p = i * 3, c = i * 4;
        this.positions[p] = x;
        this.positions[p + 1] = y;
        this.positions[p + 2] = 0;
        this.colors[c] = this.color.r + (1 - this.color.r) * white;
        this.colors[c + 1] = this.color.g + (1 - this.color.g) * white;
        this.colors[c + 2] = this.color.b + (1 - this.color.b) * white;
        this.colors[c + 3] = a;
        return i;
      }
      triangle(a, b, c) {
        this.indices[this.triangles++] = a;
        this.indices[this.triangles++] = b;
        this.indices[this.triangles++] = c;
      }
      disk(radius, alpha) {
        const center = this.vertex(0, 0, alpha, 0.35), edge = this.vertices;
        for (let i = 0; i <= 64; i++) {
          const a = i * Math.PI / 32;
          this.vertex(Math.cos(a) * radius, Math.sin(a) * radius, 0);
        }
        for (let i = 0; i < 64; i++) this.triangle(center, edge + i, edge + i + 1);
      }
      ring(radius, width, alpha) {
        const start = this.vertices;
        for (let i = 0; i <= 48; i++) {
          const a = i * Math.PI / 24;
          for (const r of [radius - width, radius, radius + width]) this.vertex(Math.cos(a) * r, Math.sin(a) * r, r === radius ? alpha : 0, 0.35);
        }
        for (let i = 0; i < 48; i++) for (let j = 0; j < 2; j++) {
          const a = start + i * 3 + j;
          this.triangle(a, a + 3, a + 1);
          this.triangle(a + 1, a + 3, a + 4);
        }
      }
      star(x, y, r, rotation, alpha) {
        const center = this.vertex(x, y, alpha, 0.65), start = this.vertices;
        for (let i = 0; i <= 8; i++) {
          const a = rotation + i * Math.PI / 4, s = i % 2 ? 0.24 : 1;
          this.vertex(x + Math.cos(a) * r * s, y + Math.sin(a) * r * s, alpha, 0.2);
        }
        for (let i = 0; i < 8; i++) this.triangle(center, start + i, start + i + 1);
      }
      update(time, reduced) {
        this.root.enabled = time >= 0;
        if (time < 0) return;
        if (time - this.previous < 1 / 30 && time >= this.previous) return;
        this.previous = time;
        this.vertices = 0;
        this.triangles = 0;
        const s = this.style, t = Math.max(0, time), burst = reduced ? 0 : Math.max(0, 1 - t / 1.6);
        this.color.fromString(s.color);
        if (!reduced && t < 1.05) {
          const fade = Math.sin(Math.min(1, t / 1.05) * Math.PI), start = this.vertices;
          this.vertex(-0.18, -0.55, fade * 0.42, 0.6);
          this.vertex(0.18, -0.55, fade * 0.42, 0.6);
          this.vertex(0.4, 1.3, 0, 0.8);
          this.vertex(-0.4, 1.3, 0, 0.8);
          this.triangle(start, start + 1, start + 2);
          this.triangle(start, start + 2, start + 3);
        }
        this.disk(1.25, s.halo + burst * s.burst);
        if (s.rays) {
          this.ring(0.84, 0.042, 0.28 + (reduced ? 0 : Math.sin(t * 1.7) * 0.06));
          this.ring(1.03, 0.018, 0.14);
        }
        if (s.sparkles && !reduced) {
          this.color.fromString(s.spark);
          if (burst > 0) {
            this.ring(0.6 + Math.min(t, 1.5) * 0.27, s.rays ? 0.035 : 0.025, burst * 0.6);
            for (let i = 0; i < s.sparkles; i++) {
              const a = i * 2.39996, r = 0.65 + (1 - Math.exp(-t * 2.4)) * (0.2 + i % 5 * 0.035);
              this.star(Math.cos(a) * r, Math.sin(a) * r + 0.1 + t * 0.02, (0.029 + i % 3 * 0.014) * s.intensity, a + t * 0.35, burst * burst);
            }
            for (let i = 0; i < s.rays; i++) {
              const a = i * Math.PI * 2 / s.rays + 0.13, start = this.vertices, r = 0.8 + Math.min(t, 1.6) * 0.04, len = 0.2 * burst;
              this.vertex(Math.cos(a - 0.028) * r, Math.sin(a - 0.028) * r, burst * 0.4);
              this.vertex(Math.cos(a) * (r + len), Math.sin(a) * (r + len), 0, 0.5);
              this.vertex(Math.cos(a + 0.028) * r, Math.sin(a + 0.028) * r, burst * 0.4);
              this.triangle(start, start + 1, start + 2);
            }
          }
          const count = s.rays ? 12 : s.sparkles > 10 ? 8 : 3;
          for (let i = 0; i < count; i++) {
            const a = 0.5 + i * 2.4, phase = (Math.sin(t * 1.3 + i * 2.3) + 1) / 2, fade = Math.min(1, Math.max(0, t - 1.3));
            this.star(Math.cos(a) * 0.94, Math.sin(a) * 0.83 + 0.14, 0.022 + 0.012 * phase, a, phase ** 3 * (s.rays ? 0.9 : s.sparkles > 10 ? 0.65 : 0.38) * fade);
          }
        }
        this.mesh.setPositions(this.positions, 3, this.vertices);
        this.mesh.setColors(this.colors, 4, this.vertices);
        this.mesh.setIndices(this.indices, this.triangles);
        this.mesh.update(PRIMITIVE_TRIANGLES);
      }
      hide() {
        this.root.enabled = false;
        this.previous = -100;
      }
      snapshot() {
        return { enabled: this.root.enabled, drawCalls: this.root.enabled ? 1 : 0, triangles: this.triangles / 3, burstStars: this.style.sparkles, maxIdleGlints: this.style.rays ? 12 : this.style.sparkles > 10 ? 8 : this.style.sparkles ? 3 : 0 };
      }
      destroy() {
        this.root.destroy();
        this.mesh.destroy();
        this.material.destroy();
      }
    };
  }
});

// src/game/SquishyRevealAudio.ts
var SquishyRevealAudio;
var init_SquishyRevealAudio = __esm({
  "src/game/SquishyRevealAudio.ts"() {
    "use strict";
    init_AudioSettings();
    SquishyRevealAudio = class {
      context = null;
      voices = /* @__PURE__ */ new Set();
      note(frequency, delay, duration, volume) {
        try {
          this.context ??= new AudioContext();
          void this.context.resume().catch(() => {
          });
          if (this.voices.size >= 8) return;
          const c = this.context, osc = c.createOscillator(), gain = c.createGain(), t = c.currentTime + delay;
          osc.type = "sine";
          osc.frequency.setValueAtTime(frequency, t);
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(volume * audioLevel("effects"), t + 0.012);
          gain.gain.exponentialRampToValueAtTime(1e-4, t + duration);
          osc.connect(gain);
          gain.connect(c.destination);
          this.voices.add(osc);
          osc.onended = () => {
            osc.disconnect();
            gain.disconnect();
            this.voices.delete(osc);
          };
          osc.start(t);
          osc.stop(t + duration + 0.02);
        } catch {
        }
      }
      anticipate() {
        this.stop();
        this.note(392, 0, 0.16, 0.025);
        this.note(523.25, 0.13, 0.2, 0.022);
      }
      lid() {
        this.note(784, 0, 0.16, 0.018);
      }
      celebrate(notes) {
        notes.forEach((n, i) => this.note(n, i * 0.075, 0.48, 0.025 / Math.sqrt(notes.length / 2)));
      }
      squish() {
        this.note(440, 0, 0.13, 0.025);
        this.note(659.25, 0.08, 0.19, 0.02);
      }
      stop() {
        for (const voice of this.voices) {
          try {
            voice.stop();
          } catch {
          }
        }
        this.voices.clear();
      }
      destroy() {
        this.stop();
        void this.context?.close();
      }
    };
  }
});

// src/game/OpeningSequence.ts
import { Entity as Entity26, Color as Color9, Vec3 as Vec325, StandardMaterial as StandardMaterial5, CULLFACE_NONE as CULLFACE_NONE2, TONEMAP_ACES } from "playcanvas";
var OpeningSequence;
var init_OpeningSequence = __esm({
  "src/game/OpeningSequence.ts"() {
    "use strict";
    init_collection();
    init_hunt();
    init_squishyPresentation();
    init_dumplingVisual();
    init_SquishPlay();
    init_primitives();
    init_SquishyArt();
    init_SquishyMotion();
    init_SquishyRevealVfx();
    init_AssetUrls();
    init_SquishyRevealAudio();
    OpeningSequence = class {
      constructor(app) {
        this.app = app;
        this.backdrop = new Entity26("Cozy bedroom opening artwork", app);
        const bg = this.backdropMaterial;
        bg.useLighting = false;
        bg.diffuse.set(0, 0, 0);
        bg.emissive.set(1, 1, 1);
        bg.useTonemap = false;
        bg.cull = CULLFACE_NONE2;
        bg.update();
        this.backdrop.addComponent("render", { type: "plane", material: bg, castShadows: false, receiveShadows: false });
        this.backdrop.enabled = false;
        app.assets.loadFromUrl(assetUrl("assets/backgrounds/squishy-bedroom.png"), "texture", (err, asset) => {
          if (err || !asset) return;
          const texture = asset.resource;
          bg.emissiveMap = texture;
          bg.update();
          this.backdropAspect = texture.width / texture.height;
          this.sizeBackdrop();
        });
        this.root = new Entity26("Home surprise presentation", app);
        app.root.addChild(this.root);
        this.root.setPosition(-0.25, 0.6, 1.35);
        this.root.setEulerAngles(0, -10, 0);
        const stage = primitives(app, this.root), ivory = material("Reward porcelain", "#f6e8d7");
        ivory.gloss = 0.35;
        ivory.update();
        stage("Little presentation pedestal", "cylinder", [0, -0.045, 0], [1.68, 0.09, 1.68], ivory);
        for (const [name, power, pitch, yaw] of [["Reward key", 0.88, 38, -35], ["Reward fill", 0.4, 25, 65], ["Reward rim", 0.6, 55, 180]]) {
          const light = new Entity26(name, app);
          light.addComponent("light", { type: "directional", color: new Color9(1, 0.98, 0.96), intensity: power, mask: 16, castShadows: name === "Reward key", shadowResolution: 1024, shadowDistance: 8, normalOffsetBias: 0.025, shadowBias: 0.12 });
          light.setLocalEulerAngles(pitch, yaw, 0);
          this.root.addChild(light);
        }
        this.rim = this.root.findByName("Reward rim");
        this.box = createBlindBox(app, this.root);
        this.vfx = new SquishyRevealVfx(app, this.root);
        this.studioMask(this.root);
        this.root.enabled = false;
        this.panel.setAttribute("role", "status");
        this.panel.setAttribute("aria-live", "polite");
        this.panel.setAttribute("aria-atomic", "true");
        this.squishButton.id = "squish-friend";
        this.squishButton.type = "button";
        this.squishButton.textContent = "Squish \u2661";
        this.squishButton.setAttribute("aria-label", "Gently squish your new friend");
        this.squishButton.hidden = true;
        document.querySelector("#game").append(this.squishButton);
        this.squishButton.onclick = () => {
          if (this.phase === "revealed") {
            if (this.idle - this.squish < 0.95) return;
            this.squishStyle = (this.squishStyle + 1 + Math.floor(Math.random() * 2)) % 3;
            this.squish = this.idle;
            this.audio.squish();
          }
        };
      }
      app;
      root;
      box;
      model = null;
      elapsed = 0;
      last = 0;
      idle = 0;
      squish = -10;
      squishStyle = 0;
      squishButton = document.createElement("button");
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
      phase = "closed";
      receipt = null;
      audio = new SquishyRevealAudio();
      vfx;
      rim;
      rarity = "Common";
      camera = null;
      cameraHeight = 1.5;
      backdrop;
      backdropMaterial = new StandardMaterial5();
      backdropAspect = 941 / 1672;
      lidSounded = false;
      sounded = false;
      panel = document.querySelector("#reveal-copy");
      studioMask(root) {
        for (const r of root.findComponents("render")) for (const mesh of r.meshInstances) mesh.mask = 16;
      }
      sizeBackdrop() {
        if (!this.camera?.camera) return;
        const h = this.cameraHeight * 2, w = h * this.camera.camera.aspectRatio;
        const imageH = Math.max(h, w / this.backdropAspect);
        this.backdrop.setLocalScale(imageH * this.backdropAspect, 1, imageH);
      }
      frame(camera, width, height) {
        const compact = height <= 650;
        this.camera = camera;
        camera.camera.toneMapping = TONEMAP_ACES;
        this.cameraHeight = Math.max(1.85, (compact ? 1.3 : 1.12) / (width / height));
        camera.camera.orthoHeight = this.cameraHeight;
        camera.setPosition(-0.25, 2.35, 6.9);
        camera.lookAt(new Vec325(-0.25, compact ? 1.05 : width > height ? 1.1 : 1.35, 0.4));
        if (this.backdrop.parent !== camera) {
          this.backdrop.reparent(camera);
          this.backdrop.setLocalPosition(0, 0, -35);
          this.backdrop.setLocalEulerAngles(90, 0, 0);
        }
        this.sizeBackdrop();
      }
      show(receipt) {
        this.root.enabled = true;
        this.backdrop.enabled = true;
        this.panel.hidden = false;
        this.model?.destroy();
        this.model = null;
        this.box.root.enabled = true;
        this.box.root.setLocalEulerAngles(0, 0, 0);
        this.box.root.setLocalScale(1, 1, 1);
        this.box.lid.setLocalEulerAngles(0, 0, 0);
        this.last = 0;
        this.elapsed = 0;
        this.idle = 0;
        this.squish = -10;
        this.squishButton.hidden = true;
        this.phase = "closed";
        this.receipt = null;
        this.panel.replaceChildren();
        this.panel.classList.remove("has-reveal");
        delete this.panel.dataset.rarity;
        this.vfx.hide();
        this.audio.stop();
        this.restoreCamera();
        this.light(0);
        this.panel.textContent = "A little bamboo basket. Who\u2019s tucked inside?";
        if (receipt) {
          this.prepare(receipt);
          this.phase = "revealed";
          this.reveal(false);
          this.vfx.update(4, this.reduced.matches);
          this.squishButton.hidden = false;
        }
      }
      begin(receipt, now) {
        this.prepare(receipt);
        this.elapsed = 0;
        this.last = now;
        this.phase = "opening";
        this.sounded = false;
        this.lidSounded = false;
        this.panel.textContent = "Someone\u2019s waking up\u2026";
        this.audio.anticipate();
        if (this.reduced.matches) {
          this.phase = "revealed";
          this.reveal(false);
          this.vfx.update(4, true);
          this.squishButton.hidden = false;
        }
      }
      prepare(receipt) {
        this.receipt = receipt;
        const data = DUMPLINGS.find((d) => d.id === receipt.dumplingId);
        this.rarity = data.rarity;
        this.vfx.configure(data.rarity);
        this.vfx.hide();
        this.model?.destroy();
        this.model = createDumpling(this.app, this.root, data);
        this.studioMask(this.model);
        this.model.enabled = false;
      }
      restoreCamera() {
        if (this.camera?.camera) this.camera.camera.orthoHeight = this.cameraHeight;
      }
      light(burst) {
        const s = SQUISHY_PRESENTATION[this.rarity], color = new Color9().fromString(s.color), amount = this.phase === "closed" ? 0 : s.rim;
        this.rim.light.color = new Color9(1 + (color.r - 1) * amount, 1 + (color.g - 1) * amount, 1 + (color.b - 1) * amount);
        this.rim.light.intensity = 0.6 + burst * amount;
      }
      reveal(animate) {
        const data = DUMPLINGS.find((d) => d.id === this.receipt.dumplingId), rarity = SQUISHY_PRESENTATION[data.rarity];
        this.box.root.enabled = true;
        this.box.lid.setLocalEulerAngles(-112, 0, 0);
        this.model.enabled = true;
        if (!animate) {
          this.model.setLocalPosition(0, 0.34, 0);
          this.model.setLocalScale(1, 1, 1);
        }
        this.panel.replaceChildren();
        this.panel.style.setProperty("--rarity", rarity.color);
        this.panel.style.setProperty("--rarity-ink", rarity.ink);
        this.panel.style.setProperty("--rarity-wash", rarity.wash);
        this.panel.dataset.rarity = data.rarity;
        this.panel.classList.add("has-reveal");
        const badges = document.createElement("div");
        badges.className = "reveal-badges";
        const badge = document.createElement("small");
        badge.className = "reveal-rarity";
        badge.textContent = `${rarity.symbol} ${data.rarity}`;
        const status = document.createElement("small");
        status.className = "reveal-status";
        status.textContent = this.receipt.isNew ? "NEW!" : `DUPLICATE \xB7 \xD7${this.receipt.count}`;
        badges.append(badge, status);
        const title = document.createElement("h2");
        title.textContent = data.name;
        const series = SERIES.find((s) => s.items.includes(data.id));
        const hint = document.createElement("p");
        hint.textContent = `${series?.name ?? "Little friends"} \xB7 Saved \u2661`;
        this.panel.append(badges, title, hint);
        if (animate) this.audio.celebrate(rarity.notes);
        this.light(0);
      }
      update(now) {
        if (!this.root.enabled) return;
        const dt = this.last ? Math.min(0.05, Math.max(0, (now - this.last) / 1e3)) : 0;
        this.last = now;
        if (document.hidden) {
          this.audio.stop();
          return;
        }
        if (this.phase === "opening") {
          if (this.reduced.matches) {
            this.phase = "revealed";
            this.reveal(false);
            this.vfx.update(4, true);
            this.restoreCamera();
            this.squishButton.hidden = false;
            return;
          }
          this.elapsed += dt;
          const t = this.elapsed, s = SQUISHY_PRESENTATION[this.rarity], p = squishyOpeningPose(t, s.intensity);
          this.box.root.setLocalEulerAngles(0, p.wiggle, p.wiggle * 0.35);
          const tension = Math.sin(Math.min(1, t / 0.82) * Math.PI) * 0.055;
          this.box.root.setLocalScale(1 + tension, 1 - tension, 1 + tension);
          this.box.lid.setLocalEulerAngles(p.lid, 0, 0);
          if (t > 0.92) this.model.enabled = true;
          this.model.setLocalPosition(0, p.height, 0);
          this.model.setLocalScale(...p.scale);
          if (t > 0.82 && !this.lidSounded) {
            this.lidSounded = true;
            this.audio.lid();
          }
          const sincePop = t - REVEAL_POP_TIME, emphasis = sincePop >= 0 ? Math.sin(Math.min(1, sincePop / 0.65) * Math.PI) : 0;
          this.vfx.update(sincePop, false);
          this.light(emphasis);
          if (this.camera?.camera) this.camera.camera.orthoHeight = this.cameraHeight * (1 - s.punch * emphasis);
          if (t > REVEAL_POP_TIME && !this.sounded) {
            this.sounded = true;
            this.audio.celebrate(s.notes);
          }
          if (t > revealDuration(this.rarity)) {
            this.phase = "revealed";
            this.reveal(false);
            this.box.root.setLocalScale(1, 1, 1);
            this.box.root.setLocalEulerAngles(0, 0, 0);
            this.restoreCamera();
            this.squishButton.hidden = false;
          }
        }
        if (this.phase === "revealed" && this.model) {
          this.idle += dt;
          this.vfx.update(Math.max(4, this.elapsed - REVEAL_POP_TIME) + this.idle, this.reduced.matches);
          this.model.setLocalPosition(0, 0.34, 0);
          animateSquishy(this.model, this.idle, this.reduced.matches ? 0 : 0.01);
          const t = this.idle - this.squish;
          this.model.setLocalEulerAngles(0, 0, 0);
          if (t < 0.95 && !this.reduced.matches) {
            const pose = squishPose(t, this.squishStyle);
            this.model.setLocalScale(...pose.scale);
            this.model.setLocalEulerAngles(0, 0, pose.roll);
          }
        }
      }
      snapshot() {
        return { squishStyle: this.squishStyle, phase: this.phase, elapsed: this.elapsed, rarity: this.rarity, vfx: this.vfx.snapshot(), lidAngle: this.box.lid.getLocalEulerAngles().x, modelPosition: this.model?.getLocalPosition().toArray(), modelScale: this.model?.getLocalScale().toArray() };
      }
      hide() {
        this.restoreCamera();
        this.vfx.hide();
        this.audio.stop();
        this.root.enabled = false;
        this.backdrop.enabled = false;
        this.panel.hidden = true;
        this.squishButton.hidden = true;
      }
      destroy() {
        this.backdrop.destroy();
        this.backdropMaterial.destroy();
        this.squishButton.remove();
        this.vfx.destroy();
        this.root.destroy();
        this.audio.destroy();
      }
    };
  }
});

// src/ui/HuntUI.ts
var HuntUI;
var init_HuntUI = __esm({
  "src/ui/HuntUI.ts"() {
    "use strict";
    init_hunt();
    HuntUI = class {
      dialog = document.createElement("dialog");
      time = document.createElement("p");
      panel = document.createElement("section");
      travel = document.createElement("section");
      cards = /* @__PURE__ */ new Map();
      balance = document.createElement("p");
      notice = document.createElement("p");
      constructor(choose) {
        this.dialog.id = "hunt-routes";
        this.dialog.setAttribute("aria-labelledby", "hunt-title");
        this.dialog.innerHTML = '<span class="eyebrow">AN AFTERNOON OF LITTLE FINDS</span><h2 id="hunt-title">Where shall we look?</h2>';
        this.balance.className = "hunt-budget";
        this.dialog.append(this.balance);
        for (const store of STORES) {
          const card = document.createElement("button");
          card.type = "button";
          card.className = "store-choice";
          card.dataset.store = store.id;
          const prices = store.series.map((s) => SERIES.find((x) => x.id === s.id).price + store.markup);
          card.innerHTML = `<span class="store-icon" aria-hidden="true">${store.icon}</span><span><strong>${store.name}</strong><small>$${Math.min(...prices)}\u2013${Math.max(...prices)} / box \xB7 Take your time</small><small>${store.subtitle}</small><em class="rumor"></em><small class="route-status"></small></span>`;
          card.style.setProperty("--shop-color", store.palette[0]);
          card.addEventListener("click", () => choose(store.id));
          this.cards.set(store.id, card);
          this.dialog.append(card);
        }
        this.notice.className = "hunt-explainer";
        this.notice.textContent = "Visit two different stores each day. No shopping timer! Stock refreshes tomorrow.";
        this.dialog.append(this.notice);
        const back = document.createElement("button");
        back.className = "loop-button";
        back.textContent = "Back to game";
        back.addEventListener("click", () => this.dialog.close());
        back.classList.add("dialog-top-action");
        this.dialog.prepend(back);
        this.time.id = "shopping-time";
        this.time.hidden = true;
        this.panel.id = "hunt-find";
        this.panel.hidden = true;
        this.panel.setAttribute("aria-live", "polite");
        this.travel.id = "hunt-travel";
        this.travel.hidden = true;
        this.travel.setAttribute("role", "status");
        document.querySelector("#game").append(this.dialog, this.time, this.panel, this.travel);
        document.querySelector("#day-label").after(this.time);
      }
      routes(hunt, minutes, balance) {
        this.refresh(hunt, minutes, balance);
        if (!this.dialog.open) this.dialog.showModal();
      }
      refresh(hunt, minutes, balance) {
        const used = Object.values(hunt.stores).filter((s) => s.visited).length;
        this.balance.textContent = `${Math.max(0, 2 - used)} store visits left today \xB7 Wallet $${balance}`;
        for (const store of STORES) {
          const card = this.cards.get(store.id);
          card.disabled = used >= 2 || hunt.stores[store.id].visited;
          card.querySelector(".rumor").textContent = hunt.stores[store.id].rumor;
          card.querySelector(".route-status").textContent = hunt.stores[store.id].visited ? "Visited today" : used >= 2 ? "More adventures tomorrow" : "Travel here \u2192";
        }
      }
      showTravel(name) {
        this.dialog.close();
        this.travel.innerHTML = "<span>\u{1F6CD}</span><h2></h2><p>A little outing\u2026</p>";
        this.travel.querySelector("h2").textContent = name;
        this.travel.hidden = false;
      }
      clock(_minutes, _visible) {
        this.time.hidden = true;
      }
      find(title, detail, note) {
        this.panel.hidden = false;
        this.panel.replaceChildren();
        const h = document.createElement("strong"), p = document.createElement("p"), small = document.createElement("small");
        h.textContent = title;
        p.textContent = detail;
        small.textContent = note;
        this.panel.append(h, p, small);
      }
      destroy() {
        this.dialog.remove();
        this.time.remove();
        this.panel.remove();
        this.travel.remove();
      }
    };
  }
});

// src/data/tradeHelp.ts
function loves(id, trader, day) {
  const d = DUMPLINGS.find((d2) => d2.id === id);
  return trader === "rarity" ? d.rarity !== "Common" : trader === "series" ? SERIES.find((s) => s.id === day.series).items.includes(id) : cuteIds.includes(id) || d.accessory === "bow";
}
function dailyWish(day, trader) {
  const pool = DUMPLINGS.filter((d) => loves(d.id, trader, day) && !day.traders[trader].offer.includes(d.id));
  return pool[(day.day + ["rarity", "series", "cute"].indexOf(trader)) % pool.length] ?? DUMPLINGS[0];
}
function suggestTrade(day, trader, collection, protections = {}) {
  const ids = DUMPLINGS.filter((d) => (collection[d.id] ?? 0) > 1 && !protections[d.id]?.favorite && !protections[d.id]?.locked && !day.traders[trader].offer.includes(d.id)).map((d) => d.id);
  let best = null, cost = Infinity;
  const search = (offer, start) => {
    if (willing(day, trader, offer)) {
      const score = offer.reduce((s, id) => s + { Common: 1, Rare: 4, Epic: 12, Legendary: 30 }[DUMPLINGS.find((d) => d.id === id).rarity], 0) * 10 + offer.length;
      if (score < cost) {
        best = [...offer];
        cost = score;
      }
      return;
    }
    if (offer.length === 3) return;
    for (let i = start; i < ids.length; i++) {
      const id = ids[i];
      if (offer.filter((x) => x === id).length < (collection[id] ?? 0) - 1) search([...offer, id], i);
    }
  };
  search([], 0);
  return best;
}
var init_tradeHelp = __esm({
  "src/data/tradeHelp.ts"() {
    "use strict";
    init_collection();
    init_hunt();
    init_trading();
  }
});

// src/ui/TradingUI.ts
var TradingUI;
var init_TradingUI = __esm({
  "src/ui/TradingUI.ts"() {
    "use strict";
    init_collection();
    init_hunt();
    init_trading();
    init_dumplingVisual();
    init_tradeHelp();
    TradingUI = class {
      constructor(save, changed, exit) {
        this.save = save;
        this.changed = changed;
        this.exit = exit;
        this.dialog.id = "trading-dialog";
        this.dialog.setAttribute("aria-labelledby", "trade-title");
        let pressed = null;
        this.dialog.addEventListener("pointerdown", (e) => {
          pressed = e.target;
        });
        this.dialog.addEventListener("click", (e) => {
          if (e.detail > 0 && pressed !== e.target) {
            e.preventDefault();
            e.stopImmediatePropagation();
          }
          pressed = null;
        }, true);
        this.dialog.addEventListener("cancel", (e) => {
          e.preventDefault();
          this.close();
        });
        this.leave.id = "leave-recess";
        this.leave.className = "loop-button";
        this.leave.textContent = "Leave recess \u2192";
        this.leave.hidden = true;
        this.leave.onclick = exit;
        document.querySelector("#game").append(this.dialog, this.leave);
      }
      save;
      changed;
      exit;
      dialog = document.createElement("dialog");
      leave = document.createElement("button");
      trader = "rarity";
      give = [];
      includeLast = false;
      notice = "";
      day = 1;
      revision = 0;
      open(id, day) {
        this.save.refresh();
        this.save.ensureTradingDay(day);
        this.trader = id;
        this.day = day;
        this.give = [];
        this.includeLast = false;
        this.notice = "";
        this.render();
        this.dialog.showModal();
        this.dialog.querySelector(".trade-scroll").scrollTop = 0;
      }
      close() {
        this.dialog.close();
        this.give = [];
      }
      attempt(fn) {
        try {
          fn();
        } catch (error) {
          this.notice = error.message;
          this.give = [];
          try {
            this.save.refresh();
          } catch {
          }
        }
        this.render();
      }
      picture(id) {
        const img = document.createElement("img");
        img.src = dumplingPortrait(definition(id), false);
        img.alt = "";
        return img;
      }
      render() {
        const scrollTop = this.dialog.querySelector(".trade-scroll")?.scrollTop ?? 0;
        const trader = TRADERS.find((t) => t.id === this.trader), day = this.save.data.trading, npc = day.traders[this.trader];
        this.revision = npc.revision;
        const series = SERIES.find((s) => s.id === day.series).name;
        this.dialog.style.setProperty("--trader", trader.color);
        this.dialog.innerHTML = `<header class="trade-header"><span class="eyebrow">CLASSROOM CLUB \xB7 DAY ${this.day}</span><h2 id="trade-title">${trader.icon} ${trader.name}</h2><strong>${trader.title}</strong><p>${this.trader === "series" ? `I\u2019m collecting ${series}. I\u2019ll trade extra for those!` : trader.hint}</p><small>Today\u2019s wish: ${dailyWish(day, this.trader).name} \xB7 Other favorites welcome!</small></header>
      <div class="trade-scroll"><section><h3>Their side <small>you receive</small></h3><div id="npc-offer" class="trade-slots"></div></section>
      <p class="trade-speech" role="status" aria-live="polite"></p>
      <section><h3>Your side <small>tap to take back \xB7 ${this.give.length}/3</small></h3><div id="player-offer" class="trade-slots"></div></section>
      <div class="trade-bag-heading"><h3>Your trading bag</h3><label><input id="trade-singles" type="checkbox" ${this.includeLast ? "checked" : ""}> Include last copies</label></div>
      <p class="trade-safety">Extras first. Keep one of each. \u2665 favorites and \u{1F512} locks cannot be traded.</p><button id="trade-suggest">Help me make an offer</button><p class="trade-help">Suggests spare friends only. You decide whether to trade.</p><div id="trade-inventory"></div></div>
      <div class="trade-footer"><p id="trade-readiness"></p><div class="trade-controls"><button id="trade-cancel" aria-label="Walk away">\u2715<small>Walk away</small></button><button id="trade-add" aria-label="Ask them to add">+<small>Add more?</small></button><button id="trade-accept" aria-label="Accept trade">\u2713<small>Trade</small></button></div></div>`;
        const q = (selector) => this.dialog.querySelector(selector);
        q(".trade-speech").textContent = this.notice || npc.message;
        for (const id of npc.offer) {
          const card = document.createElement("article");
          card.className = "trade-item";
          card.dataset.id = id;
          const label = document.createElement("strong");
          label.textContent = definition(id).name;
          const rarity = document.createElement("small");
          rarity.textContent = `${definition(id).rarity}${this.save.data.collection[id] ? "" : " \xB7 NEW!"}`;
          card.append(this.picture(id), label, rarity);
          q("#npc-offer").append(card);
        }
        this.give.forEach((id, index) => {
          const b = document.createElement("button");
          b.className = "trade-item";
          b.setAttribute("aria-label", `Remove ${definition(id).name}`);
          const label = document.createElement("strong");
          label.textContent = definition(id).name;
          b.append(this.picture(id), label);
          b.onclick = () => {
            this.give.splice(index, 1);
            this.notice = "";
            this.render();
          };
          q("#player-offer").append(b);
        });
        if (!this.give.length) q("#player-offer").innerHTML = `<p class="trade-empty">${npc.done ? "All done! Bring your next finds tomorrow." : "Pick up to three squishies below."}</p>`;
        const owned = DUMPLINGS.filter((d) => this.save.data.collection[d.id] > 0).sort((a, b) => (this.save.data.collection[b.id] > 1 ? 1 : 0) - (this.save.data.collection[a.id] > 1 ? 1 : 0));
        for (const d of owned) {
          const count = this.save.data.collection[d.id], selected = this.give.filter((id) => id === d.id).length, p = this.save.data.protections?.[d.id];
          const protectedItem = p?.favorite || p?.locked;
          const b = document.createElement("button");
          b.className = "trade-bag-item";
          b.dataset.id = d.id;
          b.disabled = npc.done || !!protectedItem || count - selected <= (this.includeLast ? 0 : 1) || this.give.length >= 3 || npc.offer.includes(d.id);
          b.setAttribute("aria-label", `Offer ${d.name}`);
          const text = document.createElement("span");
          const name = document.createElement("strong");
          name.textContent = d.name;
          const detail = document.createElement("small");
          detail.textContent = `${d.rarity} \xB7 \xD7${count} \xB7 ${protectedItem ? p?.favorite ? "\u2665 Favorite" : "\u{1F512} Locked" : npc.offer.includes(d.id) ? "On their side" : count === 1 ? "Last copy" : `${Math.max(0, count - selected - 1)} spare`}`;
          if (loves(d.id, this.trader, day)) {
            detail.textContent += " \xB7 They love this!";
            b.classList.add("trade-loved");
          }
          text.append(name, detail);
          b.append(this.picture(d.id), text);
          b.onclick = () => {
            this.give.push(d.id);
            this.notice = "";
            this.render();
          };
          q("#trade-inventory").append(b);
        }
        if (!owned.length) q("#trade-inventory").innerHTML = '<p class="trade-empty">Your bag is empty. Open store boxes at home, then bring your extras to recess. Your classmates will be here!</p>';
        const ready = willing(day, this.trader, this.give);
        q("#trade-readiness").textContent = npc.done ? "Trade complete \xB7 More tomorrow" : ready ? "\u201CYes! I\u2019d make that trade.\u201D" : this.give.length ? "\u201CCould you try a different offer?\u201D" : "Choose your offer. You can always walk away.";
        q("#trade-add").disabled = npc.done || !this.give.length || npc.asks >= 4;
        q("#trade-accept").disabled = !ready;
        q("#trade-cancel").onclick = () => this.close();
        q("#trade-suggest").disabled = npc.done;
        q("#trade-suggest").onclick = () => {
          const offer = suggestTrade(day, this.trader, this.save.data.collection, this.save.data.protections);
          this.give = offer ?? [];
          this.includeLast = false;
          this.notice = offer ? "Try these extras! Review both sides, then tap Trade if you like it." : "No matching deal from your extras yet. Try another classmate or bring more doubles tomorrow.";
          this.render();
          this.dialog.querySelector(".trade-scroll").scrollTop = 0;
        };
        q("#trade-singles").onchange = (e) => {
          this.includeLast = e.target.checked;
          this.give = [];
          this.notice = "";
          this.render();
        };
        q("#trade-add").onclick = () => {
          this.attempt(() => {
            this.notice = "";
            this.save.askTrade(this.day, this.trader, this.revision, this.give, this.includeLast);
            this.changed();
          });
          this.dialog.querySelector(".trade-scroll").scrollTop = 0;
        };
        q("#trade-accept").onclick = () => {
          this.attempt(() => {
            const last = [...new Set(this.give)].filter((id) => this.save.data.collection[id] === this.give.filter((x) => x === id).length);
            if (last.length && !window.confirm(`Trade your last ${last.map((id) => definition(id).name).join(", ")}? You will have none left.`)) return;
            const received = this.save.executeTrade(this.day, this.trader, this.revision, this.give, this.includeLast);
            this.notice = `Deal! You received ${received.map((id) => definition(id).name).join(", ")}. Saved to your collection.`;
            this.give = [];
            this.changed();
          });
          this.dialog.querySelector(".trade-scroll").scrollTop = 0;
        };
        q(".trade-scroll").scrollTop = scrollTop;
      }
      destroy() {
        this.dialog.remove();
        this.leave.remove();
      }
    };
  }
});

// src/game/SchoolCook.ts
import { Asset as Asset5, BoundingBox as BoundingBox12, Entity as Entity27 } from "playcanvas";
async function schoolCook(app, parent) {
  const path = "/assets/characters/classmates/character-male-a.glb";
  const asset = new Asset5("School lunch attendant", "container", { url: assetUrl(path) }, {}, containerOptions(path));
  app.assets.add(asset);
  await new Promise((resolve, reject) => {
    asset.once("load", resolve);
    asset.once("error", reject);
    app.assets.load(asset);
  });
  const resource = asset.resource, model = resource.instantiateRenderEntity({ castShadows: true }), bounds = new BoundingBox12();
  let first = true;
  for (const r of model.findComponents("render")) for (const m of r.meshInstances) {
    if (first) {
      bounds.copy(m.aabb);
      first = false;
    } else bounds.add(m.aabb);
  }
  const scale = 1.9 / (2 * bounds.halfExtents.y), idle = resource.animations.map((a) => a.resource).find((a) => a.name === "idle");
  for (const curve of idle.curves) for (const path2 of curve.paths) {
    const n = model.findByName(path2.entityPath.at(-1)), v = idle.outputs[curve.output].data;
    if (path2.propertyPath[0] === "localRotation") n.setLocalRotation(v[0], v[1], v[2], v[3]);
    else if (path2.propertyPath[0] === "localPosition") n.setLocalPosition(v[0], v[1], v[2]);
  }
  const root = new Entity27("Friendly lunch cook", app);
  parent.addChild(root);
  root.setLocalPosition(0.3, 0.37, -6.18);
  root.addChild(model);
  model.setLocalScale(scale, scale, scale);
  const shape = primitives(app, root), white = material("Chef cotton", "#fff8e9");
  shape("Chef hat band", "cylinder", [0, 2, 0], [0.72, 0.17, 0.65], white);
  for (const x of [-0.2, 0, 0.2]) shape("Soft chef cap", "sphere", [x, 2.16, 0], [0.38, 0.3, 0.55], white);
  shape("Chef apron bib", "box", [0, 1.1, 0.22], [0.35, 0.48, 0.025], white, false);
  primitives(app, parent)("Kitchen standing platform", "box", [0.3, 0.175, -6.18], [1.1, 0.35, 0.8], material("Kitchen platform", "#b6bac2"));
  return root;
}
var init_SchoolCook = __esm({
  "src/game/SchoolCook.ts"() {
    "use strict";
    init_AssetUrls();
    init_primitives();
  }
});

// src/game/Classmates.ts
import { Asset as Asset6, BoundingBox as BoundingBox13, Entity as Entity28, Quat as Quat4, Texture as Texture3, StandardMaterial as StandardMaterial6, CULLFACE_NONE as CULLFACE_NONE3 } from "playcanvas";
function classroomSign(app, parent, name, text, position, width = 1, height = 0.26, color = "#5c496e") {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 256;
  const texture = new Texture3(app.graphicsDevice, { mipmaps: false });
  texture.setSource(canvas);
  const material2 = new StandardMaterial6();
  material2.diffuseMap = texture;
  material2.emissiveMap = texture;
  material2.emissive.set(0.45, 0.45, 0.45);
  material2.cull = CULLFACE_NONE3;
  material2.update();
  const sign = new Entity28(name, app);
  parent.addChild(sign);
  sign.addComponent("render", { type: "plane", material: material2, castShadows: false });
  sign.setLocalPosition(...position);
  sign.setLocalEulerAngles(90, 0, 0);
  sign.setLocalScale(width, 1, height);
  const paint = (words) => {
    const c = canvas.getContext("2d");
    c.fillStyle = "#fff6df";
    c.fillRect(0, 0, 768, 256);
    c.strokeStyle = color;
    c.lineWidth = 16;
    c.strokeRect(10, 10, 748, 236);
    c.fillStyle = "#514365";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = "bold 56px Trebuchet MS";
    words.split("\n").forEach((line, i, a) => c.fillText(line, 384, 128 + (i - (a.length - 1) / 2) * 76, 720));
    texture.upload();
  };
  paint(text);
  return paint;
}
var Classmates;
var init_Classmates = __esm({
  "src/game/Classmates.ts"() {
    "use strict";
    init_AssetUrls();
    init_trading();
    init_tradeHelp();
    Classmates = class {
      constructor(app, parent, placements, showNames = true) {
        this.app = app;
        const names = ["character-male-a", "character-female-b", "character-female-f"];
        this.ready = Promise.all(TRADERS.map(async (t, i) => {
          const x = placements?.[i].x ?? (i - 1) * 1.75, z = placements?.[i].z ?? -0.74;
          if (showNames) this.signs[i] = classroomSign(app, parent, t.name + " nameplate", t.name + "\n" + t.title, [x, 0.92, z + 1.12], 1, 0.24, t.color);
          try {
            const path = "/assets/characters/classmates/" + names[i] + ".glb";
            const asset = new Asset6(t.name + " classmate", "container", { url: assetUrl(path) }, {}, containerOptions(path));
            await new Promise((resolve, reject) => {
              asset.once("load", resolve);
              asset.once("error", reject);
              app.assets.add(asset);
              app.assets.load(asset);
            });
            const resource = asset.resource, model = resource.instantiateRenderEntity({ castShadows: true });
            const bounds = new BoundingBox13();
            let first = true;
            for (const r of model.findComponents("render")) for (const m of r.meshInstances) {
              if (first) {
                bounds.copy(m.aabb);
                first = false;
              } else bounds.add(m.aabb);
            }
            const scale = 1.15 / (2 * bounds.halfExtents.y), sit = resource.animations.map((a) => a.resource).find((a) => a.name === "sit");
            for (const curve of sit.curves) for (const path2 of curve.paths) {
              const n = model.findByName(path2.entityPath.at(-1)), v = sit.outputs[curve.output].data;
              if (path2.propertyPath[0] === "localRotation") n.setLocalRotation(v[0], v[1], v[2], v[3]);
              else if (path2.propertyPath[0] === "localPosition") n.setLocalPosition(v[0], v[1], v[2]);
            }
            parent.addChild(model);
            model.setLocalScale(scale, scale, scale);
            model.setLocalPosition(x, 0.45 - 0.02625 * scale, z);
            const head = model.findByName("head"), arm = model.findByName("arm-right");
            this.actors.push({ model, head, arm, headRest: head.getLocalRotation().clone(), armRest: arm.getLocalRotation().clone(), id: t.id, hello: -10, near: false });
            this.loaded++;
          } catch (e) {
            this.errors.push(t.name);
            console.error("Classmate failed to load", e);
          }
        })).then(() => {
        });
      }
      app;
      ready;
      errors = [];
      loaded = 0;
      time = 0;
      last = 0;
      actors = [];
      signs = [];
      sync(day) {
        TRADERS.forEach((t, i) => this.signs[i]?.(t.name + "\n" + (day.traders[t.id].done ? "Thanks for trading!" : "Wishes for " + dailyWish(day, t.id).name)));
      }
      attachLayout(group) {
        const nodes = [...this.actors.map((a) => a.model), ...TRADERS.map((t) => group.root.findByName(t.name + " nameplate"))];
        for (const node of nodes) {
          const p = node.getLocalPosition().clone();
          node.reparent(group);
          node.setLocalPosition(p.x, p.y, p.z + 0.3);
        }
      }
      update(now, focus) {
        const dt = this.last ? Math.min(0.04, (now - this.last) / 1e3) : 0;
        this.last = now;
        this.time += dt;
        for (const a of this.actors) {
          if (focus === a.id && !a.near) a.hello = this.time;
          a.near = focus === a.id;
          const greeting = this.time - a.hello, wave = greeting < 1.5 ? Math.sin(greeting * Math.PI / 1.5) * 0.7 : 0;
          a.arm.setLocalRotation(new Quat4().mul2(a.armRest, new Quat4().setFromEulerAngles(0, 0, wave * 45 + Math.sin(greeting * 14) * wave * 12)));
          a.head.setLocalRotation(new Quat4().mul2(a.headRest, new Quat4().setFromEulerAngles(Math.sin(this.time * 1.4) * 2, a.near ? 0 : Math.sin(this.time * 0.5) * 5, 0)));
        }
      }
      snapshot() {
        return { loaded: this.loaded, errors: [...this.errors] };
      }
    };
  }
});

// public/assets/school-kit/classroom-collision.json
var classroom_collision_default;
var init_classroom_collision = __esm({
  "public/assets/school-kit/classroom-collision.json"() {
    classroom_collision_default = [{ center: [-6.05, 0, 0], half: [0.05, 1, 7] }, { center: [6.05, 0, 0], half: [0.05, 1, 7] }, { center: [-1.12, 0, -7], half: [4.88, 1, 0.1] }, { center: [5.74, 0, -7], half: [0.26, 1, 0.1] }, { center: [-4.9, 0, -6.3], half: [0.665, 1, 0.3] }, { center: [-0.3, 0, -5.12], half: [1.55, 1, 0.9] }, { center: [3.1, 0, -6.28], half: [0.36, 1, 0.36] }, { center: [-3.1, 0, -1.75], half: [1.075, 1, 1.075] }, { center: [2.65, 0, -1.75], half: [1.075, 1, 1.075] }, { center: [0, 0, 1.5], half: [1.075, 1, 1.075] }, { center: [-3.2, 0, 2.5], half: [1.075, 1, 1.075] }, { center: [-5.42, 0, -3.5], half: [0.38999999999999996, 1, 0.3] }, { center: [-5.42, 0, 0], half: [0.38999999999999996, 1, 0.3] }, { center: [-5.42, 0, 3.7], half: [0.38999999999999996, 1, 0.3] }, { center: [-2.75, 0, 5.2], half: [0.525, 1, 0.5] }, { center: [3.02, 0, 4.4], half: [1.675, 1, 0.515] }, { center: [5.28, 0, 6.18], half: [0.35, 1, 0.35] }, { center: [-5.3, 0, 6.18], half: [0.35, 1, 0.35] }, { center: [5.37, 0, 0.78], half: [0.38999999999999996, 1, 0.3] }, { center: [-3.77, 0, -5.26], half: [0.375, 1, 0.285] }];
  }
});

// public/assets/school-kit/cafeteria-collision.json
var cafeteria_collision_default;
var init_cafeteria_collision = __esm({
  "public/assets/school-kit/cafeteria-collision.json"() {
    cafeteria_collision_default = [{ center: [-6.05, 0, 0], half: [0.05, 1, 7] }, { center: [6.05, 0, 0], half: [0.05, 1, 7] }, { center: [-1.12, 0, -7], half: [4.88, 1, 0.1] }, { center: [5.74, 0, -7], half: [0.26, 1, 0.1] }, { center: [4.6, 0, -7], half: [0.825, 1, 0.1] }, { center: [0, 0, -5.6], half: [3.825, 1, 0.9] }, { center: [-4.82, 0, -6.2], half: [0.6, 1, 0.475] }, { center: [-5.35, 0, -4.15], half: [0.34, 1, 0.34] }, { center: [-5.35, 0, 5.8], half: [0.34, 1, 0.34] }, { center: [5.2, 0, 5.02], half: [0.34, 1, 0.34] }, { center: [-3, 0, -1.5], half: [1.675, 1, 1.4] }, { center: [2.55, 0, -1.5], half: [1.675, 1, 1.4] }, { center: [-3, 0, 3.1], half: [1.675, 1, 1.4] }, { center: [2.55, 0, 3.1], half: [1.675, 1, 1.4] }, { center: [5.1, 0, 6], half: [0.75, 1, 0.375] }, { center: [-5.46, 0, -1.5], half: [0.35, 1, 0.7] }, { center: [-5.46, 0, 0.5], half: [0.35, 1, 0.7] }, { center: [-5.46, 0, 2.5], half: [0.35, 1, 0.7] }];
  }
});

// src/game/recess.ts
import { Asset as Asset7, BoundingBox as BoundingBox14, Entity as Entity29, Vec3 as Vec326 } from "playcanvas";
function createRecess(app) {
  const root = new Entity29("Classroom trading club", app);
  app.root.addChild(root);
  const classroom = new Entity29("Reference classroom", app), cafeteria = new Entity29("Reference cafeteria", app);
  root.addChild(classroom);
  root.addChild(cafeteria);
  cafeteria.setLocalPosition(4.6, 0, -16);
  const errors = [];
  const cream = material("School corridor plaster", "#f6ebd4"), floor = material("School corridor tile", "#e8dfce");
  const corridor = new Entity29("School connecting doorway", app);
  root.addChild(corridor);
  const hall = primitives(app, corridor);
  hall("Walkable door threshold", "box", [4.6, -0.055, -8], [1.8, 0.11, 2.1], floor, false);
  for (const x of [3.65, 5.55]) hall("Corridor side", "box", [x, 1.3, -8], [0.1, 2.6, 2.1], cream);
  let loaded2 = 0;
  const load = async (name, parent) => {
    try {
      const a = new Asset7("School " + name, "container", { url: assetUrl(`/assets/school-kit/${name}.glb`) });
      app.assets.add(a);
      await new Promise((resolve, reject) => {
        a.once("load", resolve);
        a.once("error", reject);
        app.assets.load(a);
      });
      const model = a.resource.instantiateRenderEntity({ castShadows: true });
      parent.addChild(model);
      loaded2++;
    } catch (e) {
      errors.push(name);
      console.error("School art failed", name, e);
    }
  };
  const desks = [{ x: -3.1, z: -1.75 }, { x: 2.65, z: -1.75 }, { x: 0, z: 1.5 }];
  const classmates = new Classmates(app, classroom, desks.map((p) => ({ x: p.x - 0.51, z: p.z - 0.8 })));
  const lunchFriends = new Classmates(app, cafeteria, [{ x: -4.15, z: -2.58 }, { x: -1.85, z: -2.58 }, { x: 2.55, z: -2.58 }], false);
  const offers = new Entity29("Today\u2019s trading squishies", app);
  classroom.addChild(offers);
  const display = new Entity29("Squishy friends display", app);
  classroom.addChild(display);
  for (const [i, id] of ["bunny", "rosie", "mochi", "panda", "lavendream"].entries()) {
    const model = createDumpling(app, display, definition(id));
    model.setLocalScale(0.27, 0.27, 0.27);
    model.setLocalPosition(1.82 + i * 0.49, 0.855, 4.55);
  }
  const seats = TRADERS.map((trader, i) => {
    const d = desks[i], anchor = new Vec326(d.x, 0, d.z + 1.55);
    const glow = primitives(app, classroom)("Trading spot", "cylinder", [anchor.x, 0.016, anchor.z], [0.82, 0.022, 0.82], material(trader.name + " cue", trader.color), false);
    return { id: trader.id, anchor, glow };
  });
  const obstacles = [...classroom_collision_default.map((b) => new BoundingBox14(new Vec326(...b.center), new Vec326(...b.half))), ...cafeteria_collision_default.map((b) => new BoundingBox14(new Vec326(b.center[0] + 4.6, 0, b.center[2] - 16), new Vec326(...b.half))), ...[3.65, 5.55].map((x) => new BoundingBox14(new Vec326(x, 0, -8), new Vec326(0.05, 1, 1.05)))];
  const room = { root, halfWidth: 12, halfDepth: 24, walkable: [{ minX: -5.9, maxX: 5.9, minZ: -6.96, maxZ: 6.9 }, { minX: 3.7, maxX: 5.5, minZ: -9.2, maxZ: -6.7 }, { minX: -1.3, maxX: 10.5, minZ: -22.9, maxZ: -9 }], obstacles, ready: Promise.all([load("classroom", classroom), load("cafeteria", cafeteria), classmates.ready, lunchFriends.ready, schoolCook(app, cafeteria).catch((e) => {
    errors.push("School cook");
    console.error(e);
  })]).then(() => {
  }), artStats: () => ({ loaded: loaded2, models: 2, errors: [...errors, ...classmates.errors, ...lunchFriends.errors], classmates: classmates.snapshot(), cafeteria: lunchFriends.snapshot() }) };
  let area = "Classroom";
  root.enabled = false;
  const sync = (day) => {
    classmates.sync(day);
    for (const child of [...offers.children]) child.destroy();
    TRADERS.forEach((t, i) => {
      if (day.traders[t.id].done) return;
      day.traders[t.id].offer.forEach((id, j) => {
        const model = createDumpling(app, offers, definition(id));
        model.setLocalScale(0.22, 0.22, 0.22);
        model.setLocalPosition(desks[i].x + (j - 1) * 0.4, 0.875, desks[i].z + 0.12);
      });
    });
  };
  return { ...room, usesReferenceLayout: true, seats, sync, bindLayout: (_group) => {
  }, get area() {
    return area;
  }, update: (now, focus, p) => {
    area = p.z < -8 ? "Cafeteria" : "Classroom";
    classroom.enabled = p.z > -9.2;
    cafeteria.enabled = p.z < -5.8;
    classmates.update(now, focus);
    lunchFriends.update(now, "");
  }, door: new Vec326(4.6, 0, -8), cafeteriaCenter: new Vec326(4.6, 0, -15) };
}
var init_recess = __esm({
  "src/game/recess.ts"() {
    "use strict";
    init_AssetUrls();
    init_trading();
    init_SchoolCook();
    init_Classmates();
    init_dumplingVisual();
    init_primitives();
    init_classroom_collision();
    init_cafeteria_collision();
  }
});

// src/ui/PopAudio.ts
var PopAudio;
var init_PopAudio = __esm({
  "src/ui/PopAudio.ts"() {
    "use strict";
    init_AudioSettings();
    init_AssetUrls();
    PopAudio = class {
      musicGain;
      unsubscribe = onAudioChange(() => this.applyVolumes());
      applyVolumes() {
        if (this.master) this.master.gain.value = this.muted ? 0 : 0.5 * audioLevel("effects");
        if (this.musicGain) this.musicGain.gain.value = this.muted ? 0 : 0.117 * audioLevel("music");
      }
      context;
      master;
      music;
      buffers = /* @__PURE__ */ new Map();
      voices = /* @__PURE__ */ new Set();
      loading;
      musicWanted = false;
      suspended = false;
      muted = false;
      failures = [];
      played = 0;
      async unlock() {
        this.context ??= new AudioContext();
        if (!this.master) {
          this.master = this.context.createGain();
          this.master.connect(this.context.destination);
        }
        this.applyVolumes();
        try {
          await this.context.resume();
        } catch {
          return;
        }
        this.loading ??= Promise.all(["click_001", "drop_001", "drop_002", "drop_003", "pluck_001", "confirmation_001", "happy-adventure"].map(async (name) => {
          try {
            const response = await fetch(assetUrl(`/assets/pop/audio/${name}.${name === "happy-adventure" ? "mp3" : "wav"}`));
            if (!response.ok) throw Error(name);
            this.buffers.set(name, await this.context.decodeAudioData(await response.arrayBuffer()));
          } catch {
            this.failures.push(name);
          }
        })).then(() => {
        });
        await this.loading;
        if (this.musicWanted && !this.suspended) this.startMusic();
      }
      sample(name, pitch = 1, volume = 0.45) {
        const ctx = this.context, buffer = this.buffers.get(name);
        if (!ctx || !buffer || this.voices.size >= 20 || this.suspended) return;
        const source = ctx.createBufferSource(), gain = ctx.createGain();
        source.buffer = buffer;
        source.playbackRate.value = pitch;
        gain.gain.value = volume;
        source.connect(gain).connect(this.master);
        this.voices.add(source);
        source.onended = () => {
          source.disconnect();
          gain.disconnect();
          this.voices.delete(source);
        };
        source.start();
        this.played++;
      }
      note(hz, time = 0, length = 0.17, volume = 0.1, type = "sine") {
        const ctx = this.context;
        if (!ctx || this.voices.size >= 20 || this.suspended) return;
        const node = ctx.createOscillator(), gain = ctx.createGain(), at = ctx.currentTime + time;
        node.type = type;
        node.frequency.setValueAtTime(hz, at);
        node.frequency.exponentialRampToValueAtTime(hz * 0.82, at + length);
        gain.gain.setValueAtTime(1e-3, at);
        gain.gain.exponentialRampToValueAtTime(volume, at + 9e-3);
        gain.gain.exponentialRampToValueAtTime(1e-3, at + length);
        node.connect(gain).connect(this.master);
        this.voices.add(node);
        node.onended = () => {
          node.disconnect();
          gain.disconnect();
          this.voices.delete(node);
        };
        node.start(at);
        node.stop(at + length + 0.02);
        this.played++;
      }
      select(n) {
        this.sample(n % 3 ? "click_001" : "pluck_001", 0.9 + Math.min(n, 12) * 0.035 + Math.random() * 0.04, 0.22);
        this.note(650 + n * 28, 0, 0.05, 0.035);
      }
      pop(chain) {
        this.sample(`drop_00${1 + Math.floor(Math.random() * 3)}`, 0.92 + Math.random() * 0.16, 0.65);
        if (chain >= 8) {
          this.sample("confirmation_001", 1.12, 0.65);
          [523, 659, 784, 1047, 1319, 1568].forEach((n, i) => this.note(n, i * 0.075, 0.3, 0.15));
          [262, 330, 392].forEach((n) => this.note(n, 0.42, 0.55, 0.08, "triangle"));
        } else if (chain >= 5) {
          [523, 659, 784, 1047].forEach((n, i) => this.note(n, i * 0.07, 0.26, 0.14));
        }
      }
      power(kind) {
        if (kind === "bomb") {
          this.note(140, 0, 0.3, 0.25, "triangle");
          this.sample("drop_003", 0.6, 0.7);
        } else if (kind === "mega") {
          [110, 220, 440, 880].forEach((n, i) => this.note(n, i * 0.065, 0.35, 0.2, "triangle"));
        } else if (kind === "rainbow") {
          [523, 587, 659, 698, 784, 880, 988, 1047].forEach((n, i) => this.note(n, i * 0.06, 0.3, 0.13));
        } else [660, 880, 1100, 1320].forEach((n, i) => this.note(n, i * 0.05, 0.2, 0.1));
      }
      countdown(n) {
        this.note(n ? 440 : 880, 0, 0.13, 0.12);
      }
      warning() {
        this.note(784, 0, 0.08, 0.085);
      }
      celebrate() {
        this.stopMusic();
        this.sample("confirmation_001", 1, 0.65);
        [523, 659, 784, 1047, 1319].forEach((n, i) => this.note(n, i * 0.1, 0.3, 0.13));
      }
      setMusic(enabled) {
        this.musicWanted = enabled;
        if (enabled && !this.suspended) this.startMusic();
        else this.stopMusic();
      }
      startMusic() {
        const ctx = this.context, buffer = this.buffers.get("happy-adventure");
        if (!ctx || !buffer || this.music) return;
        const node = ctx.createBufferSource(), gain = ctx.createGain();
        node.buffer = buffer;
        node.loop = true;
        node.loopStart = 0.03;
        node.loopEnd = buffer.duration - 0.08;
        this.musicGain = gain;
        gain.gain.value = this.muted ? 0 : 0.117 * audioLevel("music");
        node.connect(gain).connect(ctx.destination);
        node.onended = () => {
          node.disconnect();
          gain.disconnect();
        };
        node.start();
        this.music = node;
      }
      energy(frenzy, urgent) {
        if (this.music && this.context) this.music.playbackRate.setTargetAtTime(frenzy ? 1.08 : urgent ? 1.035 : 1, this.context.currentTime, 0.3);
      }
      stopMusic() {
        this.music?.stop();
        this.music = void 0;
        this.musicGain = void 0;
      }
      pause(paused) {
        this.suspended = paused;
        if (paused) {
          this.stopMusic();
          for (const node of this.voices) node.stop();
        } else if (this.musicWanted) this.startMusic();
      }
      mute() {
        this.muted = !this.muted;
        this.applyVolumes();
        return this.muted;
      }
      snapshot() {
        return { state: this.context?.state, decoded: this.buffers.size, failures: [...this.failures], voices: this.voices.size, music: !!this.music, played: this.played, muted: this.muted };
      }
      stop() {
        this.musicWanted = false;
        this.pause(true);
      }
      destroy() {
        this.unsubscribe();
        this.stop();
        void this.context?.close();
      }
    };
  }
});

// src/ui/PopArt.ts
var PopArt;
var init_PopArt = __esm({
  "src/ui/PopArt.ts"() {
    "use strict";
    init_collection();
    init_dumplingVisual();
    init_AssetUrls();
    PopArt = class {
      friends = /* @__PURE__ */ new Map();
      powers = /* @__PURE__ */ new Map();
      ready;
      load() {
        return this.ready ??= this.loadAll().catch((error) => {
          this.ready = void 0;
          throw error;
        });
      }
      async atlas(file, ids, columns, target, power = false) {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.src = assetUrl("/assets/pop/" + file + ".png");
        await image.decode();
        const rows = Math.ceil(ids.length / columns);
        ids.forEach((id, index) => {
          const canvas = document.createElement("canvas");
          canvas.width = 192;
          canvas.height = 192;
          const c = canvas.getContext("2d");
          const sx = index % columns * image.width / columns, sy = power ? (index < 3 ? 0.1 : 0.55) * image.height : Math.floor(index / columns) * image.height / rows;
          const sw = image.width / columns, sh = power ? image.height * (index < 3 ? 0.43 : 0.35) : image.height / rows;
          const inset = sw * 0.028, inner = sw - inset * 2, scale = Math.min(192 / inner, 192 / sh), w = inner * scale, h = sh * scale;
          c.drawImage(image, sx + inset, sy, inner, sh, (192 - w) / 2, (192 - h) / 2, w, h);
          target.set(id, canvas);
        });
      }
      async loadAll() {
        await Promise.all([
          this.atlas("garden-atlas", ["mochi", "rosie", "minty", "blueberry", "sunny", "lavendream", "peachy", "stardrop"], 4, this.friends),
          this.atlas("treats-cutout", ["shortcake", "custard", "cocoa", "macaron", "sorbet", "sugarstar"], 3, this.friends),
          this.atlas("animals-cutout", ["bunny", "kitten", "panda", "fox", "sleepykoala", "goldenbear"], 3, this.friends),
          this.atlas("cosmic-cutout", ["moonbean", "comet", "nebula", "orbit", "aurora", "supernova"], 3, this.friends),
          this.atlas("power-atlas", ["bomb", "rainbow", "mega", "ticket", "frenzy", "heart"], 3, this.powers, true)
        ]);
        await Promise.all(DUMPLINGS.filter((d) => d.special).map(async (d) => {
          const image = new Image();
          image.crossOrigin = "anonymous";
          image.src = dumplingPortrait(d, false);
          await image.decode();
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 192;
          canvas.getContext("2d").drawImage(image, 0, 0, 192, 192);
          this.friends.set(d.id, canvas);
        }));
      }
    };
  }
});

// src/ui/SquishyPopUI.ts
var SquishyPopUI;
var init_SquishyPopUI = __esm({
  "src/ui/SquishyPopUI.ts"() {
    "use strict";
    init_squishyPop();
    init_collection();
    init_PopAudio();
    init_PopArt();
    init_popLevels();
    SquishyPopUI = class {
      constructor(collection, award, onOpen, firstPlay = () => true, record = () => ({ bestScore: 0, tickets: 0 })) {
        this.collection = collection;
        this.award = award;
        this.onOpen = onOpen;
        this.firstPlay = firstPlay;
        this.record = record;
        this.launch.id = "play-squishy-pop";
        this.launch.className = "pop-launch";
        this.launch.innerHTML = "<span>\u273F</span> PLAY SQUISHY POP <small>Little pops. Big smiles. \xB7 60 sec</small>";
        this.launch.hidden = true;
        document.querySelector("#game").append(this.launch);
        this.dialog.id = "squishy-pop";
        this.dialog.setAttribute("aria-label", "Squishy Pop");
        this.dialog.innerHTML = `<div class="pop-shell"><header class="pop-title"><div><small>ARIANNA\u2019S LITTLE ARCADE</small><h2>SQUISHY <em>POP</em></h2></div><button class="pop-pause" aria-label="Pause">\u2161</button><button class="pop-sound" aria-label="Mute sound">\u266A</button></header><div class="pop-stats"><div><small>TIME</small><strong data-time>1:00</strong></div><div><small>SCORE</small><strong data-score>0</strong></div><div><small>TICKETS</small><strong data-tickets>\u273F 1</strong><progress data-tickets-bar max="500" value="0"></progress></div></div><div class="pop-tray"><canvas aria-label="Drag through three or more adjacent matching squishies"></canvas><div class="pop-feedback" aria-live="polite"></div><div class="pop-cover"></div></div><div class="pop-frenzy"><span>\u2726 FRENZY</span><progress max="100" value="0"></progress><b>\xD72</b></div><p class="pop-hint">Drag through matching Squishies!</p><div class="pop-friends"></div><div class="pop-footer">Your main collection plays here too. More copies earn more stars.</div></div>`;
        document.body.append(this.dialog);
        this.canvas = this.dialog.querySelector("canvas");
        this.ctx = this.canvas.getContext("2d");
        const goals = document.createElement("div");
        goals.className = "pop-goals";
        goals.setAttribute("aria-live", "polite");
        this.q(".pop-tray").before(goals);
        const cue = document.createElement("div");
        cue.className = "pop-chain-cue";
        cue.hidden = true;
        cue.setAttribute("aria-live", "polite");
        this.q(".pop-tray").append(cue);
        const signal = this.abort.signal;
        this.dialog.addEventListener("pointerdown", () => {
          void this.audio.unlock();
        }, { signal });
        this.dialog.addEventListener("keydown", () => {
          void this.audio.unlock();
        }, { signal });
        const prizes = document.createElement("button");
        prizes.className = "pop-prizes";
        prizes.textContent = "\u{1F39F} Prizes";
        prizes.setAttribute("aria-label", "Spend tickets on squishy prizes");
        this.q(".pop-title").append(prizes);
        prizes.addEventListener("click", () => {
          if (["playing", "countdown", "finale"].includes(this.state)) {
            this.q(".pop-hint").textContent = "Finish this round, then pick your prize!";
            return;
          }
          this.close();
          this.onPrizes();
        }, { signal });
        this.launch.addEventListener("click", () => this.open(), { signal });
        this.dialog.addEventListener("cancel", (e) => {
          e.preventDefault();
          this.togglePause();
        }, { signal });
        this.dialog.querySelector(".pop-pause").addEventListener("click", () => this.togglePause(), { signal });
        this.dialog.querySelector(".pop-sound").addEventListener("click", () => {
          void this.audio.unlock();
          const muted = this.audio.mute();
          this.q(".pop-sound").textContent = muted ? "\u266B\u0338" : "\u266A";
          this.q(".pop-sound").setAttribute("aria-label", muted ? "Unmute sound" : "Mute sound");
        }, { signal });
        this.canvas.addEventListener("pointerdown", (e) => this.down(e), { signal });
        this.canvas.addEventListener("pointermove", (e) => this.move(e), { signal });
        this.canvas.addEventListener("pointerup", (e) => this.up(e), { signal });
        for (const name of ["pointercancel", "lostpointercapture"]) this.canvas.addEventListener(name, () => this.cancel(), { signal });
        document.addEventListener("visibilitychange", () => {
          if (document.hidden && this.isOpen && this.state !== "results") {
            this.cancel();
            if (!this.paused) this.togglePause();
          }
        }, { signal });
        this.observer = new ResizeObserver(() => this.resize());
        this.observer.observe(this.canvas);
      }
      collection;
      award;
      onOpen;
      firstPlay;
      record;
      onPrizes = () => {
      };
      dialog = document.createElement("dialog");
      launch = document.createElement("button");
      canvas;
      ctx;
      board = new PopBoard(boardPool({}));
      art = new PopArt();
      images = this.art.friends;
      state = "levels";
      level;
      levelRun;
      goalMarkup = "";
      remaining = POP_RULES.seconds;
      countdown = 3.8;
      activeTime = 0;
      last = 0;
      frame = 0;
      pointer = null;
      previous = null;
      lockedUntil = 0;
      moves = /* @__PURE__ */ new Map();
      particles = Array.from({ length: 90 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, color: "", shape: 0 }));
      burst = 0;
      feedback = "";
      feedbackUntil = 0;
      paused = false;
      abort = new AbortController();
      observer;
      size = 360;
      receipt = "";
      saved = false;
      audio = new PopAudio();
      lastSecond = 60;
      lastCount = 4;
      frenzyWas = false;
      gone = [];
      lastResult;
      frameSamples = [];
      reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      developerHold = false;
      developerPractice = false;
      developerFreeze = false;
      prepared = false;
      prepareVersion = 0;
      finaleAt = 0;
      finaleDone = false;
      resultsAt = 0;
      previousBest = 0;
      ticketTotal = 0;
      lessonDoneAt = 0;
      chainCue = "";
      get isOpen() {
        return this.dialog.open;
      }
      q(s) {
        return this.dialog.querySelector(s);
      }
      chooseLevels() {
        this.cancel();
        this.paused = false;
        this.state = "levels";
        this.audio.setMusic(false);
        this.showCover();
      }
      objective(o, live = false, i = 0) {
        const value = Math.min(this.levelRun?.values[i] ?? 0, o.target), count = live ? `${value} / ${o.target}` : String(o.target);
        const icon = (power) => `<img src="${this.art.powers.get(power).toDataURL()}" alt="">`;
        if (o.kind === "score") return `\u2726 ${count} points`;
        if (o.kind === "chains") return `\u{1F517} ${count} chains of ${o.length}+`;
        if (o.kind === "friend") {
          const id = this.board.pool[o.slot], name = DUMPLINGS.find((d) => d.id === id).name;
          return `<img src="${this.images.get(id).toDataURL()}" alt="${name}"> Pop ${count}`;
        }
        if (o.kind === "frenzy") return `${icon("frenzy")} ${count} Frenzy`;
        return `${icon(o.power ?? "bomb")} ${o.kind === "create" ? "Make" : "Use"} ${count} ${o.power ?? "powers"}`;
      }
      updateGoals() {
        const markup = this.level && this.levelRun ? `<small>LEVEL ${POP_LEVELS.indexOf(this.level) + 1}</small>` + this.level.objectives.map((o, i) => `<span class="${this.levelRun.values[i] >= o.target ? "done" : ""}">${this.levelRun.values[i] >= o.target ? "\u2713 " : ""}${this.objective(o, true, i)}</span>`).join("") : "";
        if (markup !== this.goalMarkup) {
          this.goalMarkup = markup;
          this.q(".pop-goals").innerHTML = markup;
        }
        this.q(".pop-goals").hidden = !markup;
      }
      open() {
        if (this.isOpen) return;
        void this.audio.unlock();
        this.audio.pause(false);
        this.onOpen(true);
        this.launch.hidden = true;
        this.dialog.showModal();
        void this.prepare();
      }
      async prepare() {
        const version = ++this.prepareVersion;
        this.prepared = false;
        this.q(".pop-cover").hidden = false;
        this.q(".pop-cover").innerHTML = "<h3>Gathering squishy friends\u2026</h3>";
        try {
          await this.art.load();
          if (!this.isOpen || version !== this.prepareVersion) return;
          this.prepared = true;
          this.level = void 0;
          this.start();
          this.chooseLevels();
          this.last = performance.now();
          this.frame = requestAnimationFrame(this.tick);
        } catch {
          if (!this.isOpen || version !== this.prepareVersion) return;
          this.q(".pop-cover").innerHTML = "<h3>Friends need a moment.</h3><button data-retry>Try again</button><button data-back>Back to game</button>";
          this.q("[data-retry]").onclick = () => void this.prepare();
          this.q("[data-back]").onclick = () => this.close();
        }
      }
      start() {
        this.board = this.level ? createLevelBoard(this.level, { ...this.collection() }) : new PopBoard(boardPool(this.collection()), { ...this.collection() });
        this.levelRun = this.level ? new PopLevelRun(this.level, this.board.pool) : void 0;
        this.remaining = this.level?.seconds ?? POP_RULES.seconds;
        this.activeTime = 0;
        this.countdown = 3.8;
        this.paused = false;
        this.saved = false;
        this.receipt = crypto.randomUUID();
        this.moves.clear();
        this.particles.forEach((p) => p.life = 0);
        this.lockedUntil = 0;
        this.feedbackUntil = 0;
        this.previousBest = this.record().bestScore;
        this.ticketTotal = this.record().tickets;
        this.finaleDone = false;
        this.lessonDoneAt = 0;
        this.chainCue = "";
        this.q(".pop-hint").textContent = "Connect 3 or more matching friends";
        this.state = this.level ? "briefing" : this.firstPlay() ? "intro" : "countdown";
        this.cancel();
        this.lastSecond = 60;
        this.lastCount = 4;
        this.frenzyWas = false;
        this.gone = [];
        this.lastResult = void 0;
        this.frameSamples = [];
        this.audio.pause(false);
        this.audio.setMusic(false);
        this.q(".pop-friends").innerHTML = this.board.pool.map((id) => {
          const d = DUMPLINGS.find((d2) => d2.id === id);
          const stars = starLevel(this.collection()[id] || 0);
          return `<span title="${d.name}: ${stars ? stars + " stars" : "starter friend"}"><img src="${this.images.get(id).toDataURL()}" alt="${d.name}"><small>${stars ? "\u2605".repeat(stars) : "\u2661"}</small></span>`;
        }).join("");
        this.updateGoals();
        this.showCover();
        this.resize();
        if (this.state === "countdown") this.audio.setMusic(true);
        this.q("[data-tickets-bar]").max = POP_RULES.pointsPerTicket;
        const ticket = this.art.powers.get("ticket");
        this.q("[data-tickets]").style.backgroundImage = `url(${ticket.toDataURL()})`;
        const frenzyLabel = this.q(".pop-frenzy span");
        frenzyLabel.textContent = "FRENZY";
        frenzyLabel.style.backgroundImage = `url(${this.art.powers.get("frenzy").toDataURL()})`;
      }
      showCover() {
        this.dialog.classList.toggle("showing-results", this.state === "results" || this.state === "levels" || this.state === "briefing");
        const cover = this.q(".pop-cover");
        cover.hidden = ["playing", "lesson", "finale"].includes(this.state) && !this.paused;
        if (this.paused) {
          cover.innerHTML = "<h3>A little breather \u2661</h3><button data-resume>Keep popping</button><button data-quit>Back to game</button>";
          cover.querySelector("[data-resume]").addEventListener("click", () => this.togglePause());
          cover.querySelector("[data-quit]").addEventListener("click", () => this.close());
        } else if (this.state === "levels") {
          cover.innerHTML = '<h3>Your squishy trail</h3><p>1 \u2192 2 \u2192 3 \xB7 A new goal each round</p><div class="pop-level-list">' + POP_LEVELS.map((level, i) => {
            const r = this.record().levels?.[level.id], unlocked = levelUnlocked(level, this.record().levels);
            return '<button data-level="' + i + '" ' + (unlocked ? "" : "disabled") + "><b>" + (unlocked ? i + 1 : "\u{1F512}") + " \xB7 " + level.name + "</b><small>" + (r?.completed ? "\u2605".repeat(r.stars) + " \xB7 Best " + r.bestScore : unlocked ? "Ready to play" : "Finish Level " + i + " to unlock") + "</small></button>";
          }).join("") + '</div><button data-classic>Classic \xB7 60 seconds</button><button class="pop-link" data-back>Back to game</button>';
          cover.querySelectorAll("[data-level]").forEach((b) => b.onclick = () => {
            const level = POP_LEVELS[Number(b.dataset.level)];
            if (!levelUnlocked(level, this.record().levels)) return;
            this.level = level;
            this.start();
          });
          this.q("[data-classic]").onclick = () => {
            this.level = void 0;
            this.start();
          };
          this.q("[data-back]").onclick = () => this.close();
        } else if (this.state === "briefing") {
          cover.innerHTML = "<small>LEVEL " + (POP_LEVELS.indexOf(this.level) + 1) + " \xB7 " + this.remaining + " seconds</small><h3>" + this.level.name + '</h3><div class="pop-objectives">' + this.level.objectives.map((o) => "<span>" + this.objective(o) + "</span>").join("") + "</div><p>" + this.level.hint + "</p><small>\u2605 Finish the goal \xB7 \u2605\u2605 " + this.level.stars[0] + " points \xB7 \u2605\u2605\u2605 " + this.level.stars[1] + '</small><button data-play-level>Let\u2019s pop!</button><button class="pop-link" data-levels>Choose a level</button>';
          this.q("[data-play-level]").onclick = () => {
            this.state = this.firstPlay() ? "intro" : "countdown";
            this.audio.setMusic(this.state === "countdown");
            this.showCover();
          };
          this.q("[data-levels]").onclick = () => this.chooseLevels();
        } else if (this.state === "intro") {
          cover.innerHTML = `<h3>Little chains.<br>Big squishes!</h3><div class="pop-demo">${Array.from({ length: 3 }, () => `<img src="${this.images.get(this.board.pool[0]).toDataURL()}" alt="">`).join("")}<b>\u261D</b></div><p>Let\u2019s try one together. No timer yet!</p><button data-start>Show me how</button><button class="pop-link" data-back>Back to game</button>`;
          cover.querySelector("[data-start]").addEventListener("click", () => {
            void this.audio.unlock();
            this.state = "lesson";
            [12, 13, 14].forEach((i) => this.board.pieces[i].kind = this.board.pool[0]);
            this.q(".pop-hint").textContent = "Follow the glow: connect these 3 friends";
            this.showCover();
          });
          cover.querySelector("[data-back]").addEventListener("click", () => this.close());
        } else if (this.state === "countdown") cover.innerHTML = '<strong class="pop-count">3</strong>';
        else if (this.state === "results") this.results();
      }
      results() {
        let total = this.ticketTotal, error = "";
        try {
          if (!this.developerPractice && !this.saved) total = this.award(this.receipt, this.board.score, this.levelRun?.attempt(this.board.bestChain));
          this.ticketTotal = total;
          this.saved = true;
        } catch (e) {
          error = e.message;
        }
        this.resultsAt = this.activeTime;
        const record = !this.developerPractice && !error && this.board.score > this.previousBest;
        const cover = this.q(".pop-cover");
        cover.hidden = false;
        cover.innerHTML = `<span class="pop-result-star">${record ? "\u2605" : "\u2726"}</span><h3>${record ? "A new personal best!" : "So squishy!"}</h3><div class="pop-result-numbers"><span>Score<b data-result-score>${this.board.score.toLocaleString()}</b></span><span>Best chain<b>${this.board.bestChain}</b></span></div><small class="pop-previous-best">Previous best ${this.previousBest.toLocaleString()}</small><div class="pop-ticket-flight" aria-hidden="true">${Array.from({ length: this.developerPractice || error ? 0 : roundTickets(this.board.score) }, (_, i) => `<img style="--i:${i}" src="${this.art.powers.get("ticket").toDataURL()}" alt="">`).join("")}</div><strong class="pop-ticket-prize">${error ? "Tickets not saved yet" : `+${roundTickets(this.board.score)} Squishy Tickets`}</strong><p>${error || `${total} tickets saved \xB7 Pick a squishy from the prize shelf, starting at 1 ticket!`}</p><progress max="8" value="${Math.min(total, 8)}"></progress><button data-replay>${error ? "Retry saving" : "PLAY AGAIN"}</button><button data-back>BACK TO GAME</button>`;
        cover.querySelector("[data-replay]").addEventListener("click", () => {
          if (this.saved) this.start();
          else this.results();
        });
        cover.querySelector("[data-back]").addEventListener("click", () => {
          if (this.saved) this.close();
          else this.results();
        });
        if (this.level && this.levelRun) {
          const stars = levelStars(this.level, this.levelRun.values, this.board.score), won = stars > 0;
          cover.querySelector("h3").textContent = won ? "Level " + (POP_LEVELS.indexOf(this.level) + 1) + " complete!" : "A little closer!";
          cover.querySelector(".pop-result-star").textContent = won ? "\u2605".repeat(stars) : "\u2661";
          cover.querySelector(".pop-previous-best").innerHTML = this.level.objectives.map((o, i) => this.objective(o, true, i)).join(" \xB7 ");
          const next = POP_LEVELS[POP_LEVELS.indexOf(this.level) + 1];
          if (this.saved && !this.developerPractice && won && next) {
            const button2 = document.createElement("button");
            button2.dataset.nextLevel = "";
            button2.textContent = "Next \xB7 " + next.name;
            button2.onclick = () => {
              this.level = next;
              this.start();
            };
            cover.querySelector("[data-replay]").before(button2);
          }
          cover.querySelector("[data-replay]").textContent = error ? "Retry saving" : won ? "Replay this level" : "Try again \xB7 you keep your tickets";
        }
        if (this.saved) {
          const button2 = document.createElement("button");
          button2.className = "pop-link";
          button2.dataset.levels = "";
          button2.textContent = "Choose a level";
          button2.onclick = () => this.chooseLevels();
          cover.querySelector("[data-back]").before(button2);
        }
        cover.querySelector("[data-back]").textContent = "Back to game";
        if (this.developerPractice) {
          cover.querySelector(".pop-ticket-prize").textContent = "Developer practice \xB7 no rewards saved";
          cover.querySelector("p").textContent = "Your tickets and best score are unchanged.";
          cover.querySelector("progress").hidden = true;
        }
        const actions = document.createElement("div");
        actions.className = "pop-result-actions";
        cover.querySelectorAll("button").forEach((button2) => actions.append(button2));
        cover.append(actions);
      }
      close() {
        this.prepareVersion++;
        this.cancel();
        this.audio.stop();
        this.dialog.close();
        cancelAnimationFrame(this.frame);
        this.developerPractice = false;
        this.developerFreeze = false;
        this.onOpen(false);
      }
      togglePause() {
        if (!this.isOpen || ["results", "intro", "levels", "briefing"].includes(this.state)) return;
        this.cancel();
        this.paused = !this.paused;
        this.audio.pause(this.paused);
        if (!this.paused) void this.audio.unlock();
        this.showCover();
      }
      resize() {
        const rect = this.canvas.getBoundingClientRect();
        if (!rect.width) return;
        this.size = rect.width;
        const ratio = Math.min(devicePixelRatio, 2);
        this.canvas.width = Math.round(rect.width * ratio);
        this.canvas.height = this.canvas.width;
        this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      }
      point(e) {
        const r = this.canvas.getBoundingClientRect();
        return { x: (e.clientX - r.left) / r.width * 6, y: (e.clientY - r.top) / r.height * 6 };
      }
      hit(p) {
        if (p.x < 0 || p.y < 0 || p.x >= 6 || p.y >= 6) return -1;
        const x = Math.floor(p.x), y = Math.floor(p.y);
        return Math.hypot(p.x - x - 0.5, p.y - y - 0.5) <= 0.61 ? y * 6 + x : -1;
      }
      selectable(index) {
        if (index < 0) return false;
        if (this.state === "lesson") return !this.lessonDoneAt && [12, 13, 14].includes(index);
        const move = this.moves.get(this.board.pieces[index].id);
        return this.activeTime >= this.lockedUntil || !move || move.from === move.to;
      }
      down(e) {
        if (this.pointer !== null || !["playing", "lesson"].includes(this.state) || this.paused || this.developerHold || this.remaining <= 0 || e.button !== 0) return;
        e.preventDefault();
        const p = this.point(e), index = this.hit(p);
        if (!this.selectable(index)) return;
        this.pointer = e.pointerId;
        this.previous = p;
        this.canvas.setPointerCapture(e.pointerId);
        this.board.begin(index);
        this.audio.select(1);
      }
      move(e) {
        if (e.pointerId !== this.pointer || !this.previous) return;
        e.preventDefault();
        const next = this.point(e), old = this.previous, steps = Math.max(1, Math.ceil(Math.hypot(next.x - old.x, next.y - old.y) * 5));
        for (let i = 1; i <= steps; i++) {
          const index = this.hit({ x: old.x + (next.x - old.x) * i / steps, y: old.y + (next.y - old.y) * i / steps });
          if (this.selectable(index) && this.board.extend(index)) this.audio.select(this.board.chain.length);
        }
        this.previous = next;
      }
      up(e) {
        if (e.pointerId !== this.pointer) return;
        this.move(e);
        this.pointer = null;
        this.previous = null;
        const result = this.board.release(this.activeTime);
        if (result) {
          this.pop(result);
          if (this.state === "lesson") {
            this.lessonDoneAt = this.activeTime + 0.8;
            this.feedback = "You did it!";
            this.feedbackUntil = this.lessonDoneAt;
          }
        }
        if (this.remaining <= 0) this.finish();
      }
      cancel() {
        this.pointer = null;
        this.previous = null;
        this.board.cancel();
      }
      pop(result) {
        if (this.state !== "lesson") {
          this.levelRun?.observe(result, this.board.score, this.state === "finale", this.board.frenzyUntil);
          this.updateGoals();
        }
        this.gone = result.cleared;
        this.lastResult = result;
        this.audio.pop(result.chain);
        for (const power of new Set(result.activated)) this.audio.power(power);
        const rainbow = result.activated.includes("rainbow"), tier = rainbow ? "rainbow" : result.chain >= 8 ? "super" : result.chain >= 5 ? "great" : "normal";
        this.q(".pop-feedback").dataset.tier = tier;
        this.q(".pop-tray").dataset.celebration = tier;
        this.burst = this.activeTime;
        this.lockedUntil = this.activeTime + 0.35;
        this.moves = new Map(result.moves.map((m) => [m.piece.id, { from: m.from, to: m.to }]));
        this.feedback = result.shuffled ? "A little shuffle!" : `${rainbow ? "RAINBOW MAGIC!" : result.chain >= 8 ? "SUPER SQUISH!" : result.chain >= 5 ? "AMAZING CHAIN!" : result.label} +${result.score}`;
        this.feedbackUntil = this.activeTime + (tier === "normal" ? 0.8 : 1.6);
        this.q(".pop-hint").textContent = result.created === "rainbow" ? "Rainbow joins any matching chain!" : result.created ? "Tap your new " + (result.created === "mega" ? "Mega Squish!" : "Pop Bomb!") : "Drag through matching Squishies!";
        if (this.levelRun?.completed) this.q(".pop-hint").textContent = "Goal complete! Keep popping for stars.";
        if (!this.reduced) for (const c of result.cleared) {
          for (let i = 0; i < Math.min(5, 2 + Math.floor(result.chain / 5)); i++) {
            const p = this.particles.find((p2) => p2.life <= 0);
            if (!p) break;
            Object.assign(p, { x: c.index % 6 + 0.5, y: Math.floor(c.index / 6) + 0.5, vx: (Math.random() - 0.5) * 3, vy: -1 - Math.random() * 3, life: 0.55 + Math.random() * 0.3, color: ["#ff86b8", "#fff0a5", "#fff", "#9ee1e7"][i % 4], shape: i % 3 });
          }
        }
      }
      finish() {
        if (this.state === "finale" || this.state === "results") return;
        this.state = "finale";
        this.cancel();
        this.audio.setMusic(false);
        this.finaleAt = Math.max(this.activeTime + 0.25, this.burst + 0.65);
        this.finaleDone = false;
        this.q(".pop-hint").textContent = "One last little celebration\u2026";
        this.showCover();
      }
      chainFeedback() {
        const cue = this.q(".pop-chain-cue"), chain = this.board.chain;
        cue.hidden = !chain.length || this.paused;
        if (!chain.length) {
          this.chainCue = "";
          return;
        }
        const preview = this.board.preview(), power = preview.created, n = chain.length, key = n + ":" + power;
        if (key !== this.chainCue) {
          const prior = powerForChain(Number(this.chainCue.split(":")[0]));
          if (power && power !== prior) this.audio.power("rainbow");
          this.chainCue = key;
          cue.innerHTML = `<b>${n}</b><span>${power ? `<img src="${this.art.powers.get(power).toDataURL()}" alt="">${power === "mega" ? "Mega!" : power === "rainbow" ? "Rainbow!" : "Pop Bomb!"}` : preview.valid ? "Release to pop!" : `${3 - n} more to pop`}</span>`;
          cue.classList.remove("pulse");
          void cue.offsetWidth;
          cue.classList.add("pulse");
        }
        const last = chain.at(-1);
        cue.style.left = `${Math.max(24, Math.min(76, (last % 6 + 0.5) / 6 * 100))}%`;
        cue.style.top = `${Math.max(0, (Math.floor(last / 6) - 0.55) / 6 * 100)}%`;
      }
      tick = (now) => {
        if (document.hidden || document.querySelector(".audio-settings[open]")) {
          this.last = now;
          if (this.isOpen) this.frame = requestAnimationFrame(this.tick);
          return;
        }
        const dt = Math.max(0, (now - this.last) / 1e3);
        this.last = now;
        this.q(".pop-footer").textContent = this.developerPractice ? `DEV PRACTICE \xB7 no rewards saved${this.developerFreeze ? " \xB7 timer frozen" : ""}` : "Soft friends. Happy little chains.";
        if (this.developerHold) {
          this.audio.pause(true);
          if (this.isOpen) this.frame = requestAnimationFrame(this.tick);
          return;
        }
        if (this.state === "playing" && !this.paused) {
          this.frameSamples.push(dt * 1e3);
          if (this.frameSamples.length > 600) this.frameSamples.shift();
        }
        if (!this.paused && !document.hidden) {
          this.activeTime += dt;
          if (this.state === "lesson" && this.lessonDoneAt && this.activeTime >= this.lessonDoneAt) {
            this.board = this.level ? createLevelBoard(this.level, { ...this.collection() }) : new PopBoard(this.board.pool, { ...this.collection() });
            this.levelRun = this.level ? new PopLevelRun(this.level, this.board.pool) : void 0;
            this.updateGoals();
            this.moves.clear();
            this.gone = [];
            this.lastResult = void 0;
            this.feedbackUntil = 0;
            this.state = "countdown";
            this.q(".pop-hint").textContent = "Connect 3 or more matching friends";
            this.audio.setMusic(true);
            this.showCover();
          }
          if (this.state === "countdown") {
            this.countdown -= dt;
            this.q(".pop-count").textContent = this.countdown > 0.8 ? String(Math.ceil(this.countdown - 0.8)) : "POP!";
            if (this.countdown <= 0) {
              this.state = "playing";
              this.showCover();
            }
          } else if (this.state === "playing") {
            if (!this.developerFreeze) this.remaining = Math.max(0, this.remaining - dt);
            if (!this.remaining && this.pointer === null) this.finish();
          } else if (this.state === "finale" && this.activeTime >= this.finaleAt) {
            if (!this.finaleDone) {
              this.finaleDone = true;
              const result = this.board.finale(this.activeTime);
              if (result) this.pop(result);
              this.finaleAt = this.activeTime + (result ? 0.9 : 0.25);
            } else {
              this.state = "results";
              this.audio.celebrate();
              this.showCover();
            }
          }
        }
        this.q("[data-time]").textContent = `${Math.floor(Math.ceil(this.remaining) / 60)}:${String(Math.ceil(this.remaining) % 60).padStart(2, "0")}`;
        this.q("[data-time]").classList.toggle("urgent", this.remaining <= 10);
        this.q("[data-score]").textContent = this.board.score.toLocaleString();
        this.q("[data-tickets]").textContent = String(roundTickets(this.board.score));
        this.q("[data-tickets-bar]").value = roundTickets(this.board.score) === POP_RULES.maximumTickets ? POP_RULES.pointsPerTicket : this.board.score % POP_RULES.pointsPerTicket;
        const count = Math.max(0, Math.ceil(this.countdown - 0.8));
        if (this.state === "countdown" && count !== this.lastCount) {
          this.audio.countdown(count);
          this.lastCount = count;
        }
        const second = Math.ceil(this.remaining);
        if (this.state === "playing" && second <= 10 && second > 0 && second !== this.lastSecond) this.audio.warning();
        this.lastSecond = second;
        const frenzy = this.state === "playing" && this.activeTime < this.board.frenzyUntil;
        if (frenzy && !this.frenzyWas) {
          this.audio.power("frenzy");
          if (this.activeTime >= this.feedbackUntil || this.q(".pop-feedback").dataset.tier === "normal") {
            this.q(".pop-feedback").dataset.tier = "normal";
            this.feedback = "FRENZY! \xD72";
            this.feedbackUntil = this.activeTime + 1;
          }
        }
        this.frenzyWas = frenzy;
        this.dialog.classList.toggle("is-frenzy", frenzy);
        this.q(".pop-frenzy progress").value = frenzy ? (this.board.frenzyUntil - this.activeTime) / POP_RULES.frenzySeconds * 100 : this.board.frenzyMeter;
        this.audio.energy(frenzy, second <= 10);
        this.q(".pop-frenzy b").textContent = frenzy ? `${Math.ceil(this.board.frenzyUntil - this.activeTime)}s \xB7 \xD72` : "\xD72";
        this.chainFeedback();
        if (this.state === "results") {
          const score = this.q("[data-result-score]");
          if (score) score.textContent = Math.round(this.board.score * (this.reduced ? 1 : Math.min(1, (this.activeTime - this.resultsAt) / 0.9))).toLocaleString();
        }
        const feedback = this.q(".pop-feedback");
        feedback.hidden = this.activeTime >= this.feedbackUntil;
        feedback.textContent = feedback.hidden ? "" : this.feedback;
        if (feedback.hidden) this.q(".pop-tray").dataset.celebration = "normal";
        this.draw(this.paused ? 0 : Math.min(dt, 0.05));
        if (this.isOpen) this.frame = requestAnimationFrame(this.tick);
      };
      draw(dt) {
        const c = this.ctx, s = this.size / 6;
        c.clearRect(0, 0, this.size, this.size);
        c.save();
        c.scale(s, s);
        const age = this.activeTime - this.burst;
        const base = this.board.chain.find((i) => this.board.pieces[i].power !== "rainbow"), matching = base === void 0 ? null : this.board.pieces[base].kind, preview = this.board.preview();
        if (!this.reduced && age < 0.18 && (this.lastResult?.chain ?? 0) >= 10) c.translate(Math.sin(age * 90) * 0.025, Math.cos(age * 80) * 0.02);
        for (let i = 0; i < 36; i++) {
          const piece = this.board.pieces[i], selected = this.board.chain.includes(i);
          let x = i % 6 + 0.5, y = Math.floor(i / 6) + 0.5;
          const move = this.moves.get(piece.id);
          if (move && age < 0.35 && !this.reduced) {
            const t = Math.max(0, Math.min(1, (age - 0.07) / 0.28)), ease = 1 - Math.pow(1 - t, 3);
            y = Math.floor(move.from / 6) + 0.5 + (Math.floor(i / 6) - Math.floor(move.from / 6)) * ease;
            if (this.lastResult?.shuffled) x = move.from % 6 + 0.5 + (i % 6 - move.from % 6) * ease;
          }
          c.save();
          c.translate(x, y);
          if (matching && piece.kind !== matching && piece.power !== "rainbow" && !preview.removed.has(i) || this.state === "lesson" && !this.lessonDoneAt && ![12, 13, 14].includes(i)) c.globalAlpha = 0.3;
          c.fillStyle = "#78569718";
          c.beginPath();
          c.ellipse(0, 0.31, 0.36, 0.075, 0, 0, Math.PI * 2);
          c.fill();
          if (preview.valid && preview.effects.length && preview.removed.has(i)) {
            c.fillStyle = "#fff2b977";
            c.strokeStyle = "#fffaf0";
            c.lineWidth = 0.025;
            c.beginPath();
            c.roundRect(-0.47, -0.47, 0.94, 0.94, 0.18);
            c.fill();
            c.stroke();
          }
          if (this.state === "lesson" && !this.lessonDoneAt && [12, 13, 14].includes(i)) {
            c.strokeStyle = "#fff";
            c.lineWidth = this.reduced ? 0.05 : 0.05 + Math.sin(this.activeTime * 5) * 0.018;
            c.beginPath();
            c.roundRect(-0.47, -0.47, 0.94, 0.94, 0.22);
            c.stroke();
          }
          if (selected) {
            c.shadowColor = "#ff85ca";
            c.shadowBlur = s * 0.2;
            c.fillStyle = "#fff9";
            c.beginPath();
            c.ellipse(0, 0, 0.49, 0.44, 0, 0, Math.PI * 2);
            c.fill();
            if (!this.reduced) c.rotate(Math.sin(this.activeTime * 15 + i) * 0.045);
          }
          const bounce = this.reduced ? 1 : selected ? 1.1 : move && move.from !== move.to && age < 0.47 && age > 0.33 ? 1 + Math.sin((age - 0.33) / 0.14 * Math.PI) * 0.09 : this.frenzyWas ? 1 + Math.sin(this.activeTime * 7 + i) * 0.018 : 1;
          c.scale(bounce, selected ? 0.95 : 1 / bounce);
          const img = piece.power ? this.art.powers.get(piece.power) : this.images.get(piece.kind);
          if (img) c.drawImage(img, -0.5, -0.52, 1, 1);
          if (piece.power && piece.power !== "rainbow") {
            c.shadowBlur = 0;
            const buddy = this.images.get(piece.kind);
            c.fillStyle = "#fff";
            c.beginPath();
            c.arc(0.3, 0.29, 0.17, 0, Math.PI * 2);
            c.fill();
            if (buddy) c.drawImage(buddy, 0.1, 0.09, 0.4, 0.4);
          }
          c.restore();
        }
        if (age < 0.3 && !this.reduced) {
          this.gone.forEach(({ piece, index }, n) => {
            const image = piece.power ? this.art.powers.get(piece.power) : this.images.get(piece.kind);
            if (!image) return;
            const t = Math.max(0, (age - Math.min(n, 9) * 0.012) / 0.18);
            if (t >= 1) return;
            c.save();
            c.translate(index % 6 + 0.5, Math.floor(index / 6) + 0.5);
            c.globalAlpha = 1 - t;
            c.scale(1 + t * 0.35, Math.max(0.1, 1 - t * 0.9));
            c.drawImage(image, -0.5, -0.52, 1, 1);
            c.restore();
          });
        }
        if (age < 0.65 && this.lastResult) {
          for (const effect of this.lastResult.effects) {
            c.save();
            const x = effect.index % 6 + 0.5, y = Math.floor(effect.index / 6) + 0.5, t = Math.min(1, age / 0.65);
            c.globalAlpha = (1 - t) * 0.8;
            if (effect.power === "rainbow") {
              for (const [n, index] of effect.targets.entries()) {
                c.strokeStyle = ["#ef85b6", "#86ccd9", "#b49adc", "#f0cb72"][n % 4];
                c.lineWidth = 0.065;
                c.beginPath();
                c.moveTo(x, y);
                c.quadraticCurveTo((x + index % 6 + 0.5) / 2, y - 0.7, index % 6 + 0.5, Math.floor(index / 6) + 0.5);
                c.stroke();
              }
            } else {
              const radius = effect.power === "mega" ? 2.9 : 1.65;
              c.strokeStyle = effect.power === "mega" ? "#f6ca64" : "#cf99ef";
              c.lineWidth = effect.power === "mega" ? 0.13 : 0.08;
              c.beginPath();
              c.arc(x, y, this.reduced ? radius : radius * (1 - Math.pow(1 - t, 3)), 0, Math.PI * 2);
              c.stroke();
              if (effect.power === "mega") {
                c.strokeStyle = "#fff";
                c.lineWidth = 0.055;
                c.beginPath();
                c.arc(x, y, this.reduced ? radius * 0.8 : radius * t * 0.8, 0, Math.PI * 2);
                c.stroke();
              }
            }
            c.restore();
          }
        }
        if (this.state === "lesson" && !this.lessonDoneAt && !this.board.chain.length) {
          c.save();
          c.strokeStyle = "#fff9";
          c.lineWidth = 0.055;
          c.setLineDash([0.12, 0.13]);
          c.beginPath();
          c.moveTo(0.5, 2.5);
          c.lineTo(2.5, 2.5);
          c.stroke();
          c.setLineDash([]);
          c.fillStyle = "#fff";
          c.beginPath();
          c.arc(this.reduced ? 1.5 : 0.5 + this.activeTime % 2, 2.5, 0.1, 0, Math.PI * 2);
          c.fill();
          c.restore();
        }
        if (this.board.chain.length) {
          const path = this.board.chain;
          c.save();
          c.lineCap = "round";
          c.lineJoin = "round";
          c.shadowColor = "#ff6fb5";
          c.shadowBlur = s * 0.16;
          c.strokeStyle = "#ffb2da";
          c.lineWidth = 0.13;
          c.beginPath();
          path.forEach((i, n) => {
            const x = i % 6 + 0.5, y = Math.floor(i / 6) + 0.5;
            n ? c.lineTo(x, y) : c.moveTo(x, y);
          });
          c.stroke();
          c.strokeStyle = "#fff";
          c.lineWidth = 0.065;
          c.stroke();
          c.restore();
        }
        for (const p of this.particles) {
          if (p.life <= 0) continue;
          p.life -= dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 5 * dt;
          c.globalAlpha = Math.min(1, p.life * 3);
          c.fillStyle = p.color;
          const heart = this.art.powers.get("heart");
          if (p.shape === 1 && heart) c.drawImage(heart, p.x - 0.16, p.y - 0.16, 0.32, 0.32);
          else {
            c.font = ".28px sans-serif";
            c.fillText(p.shape ? "\u2727" : "\u2726", p.x, p.y);
          }
        }
        c.globalAlpha = 1;
        c.restore();
      }
      snapshot() {
        const sorted = [...this.frameSamples].sort((a, b) => a - b);
        return { open: this.isOpen, level: this.level?.id, objectives: this.levelRun?.values, completed: this.levelRun?.completed, state: this.state, remaining: this.remaining, paused: this.paused, practice: this.developerPractice, timerFrozen: this.developerFreeze, chain: [...this.board.chain], pieces: this.board.pieces.map((p) => ({ ...p })), score: this.board.score, bestChain: this.board.bestChain, valid: this.board.findChain(), pool: this.board.pool, particles: this.particles.filter((p) => p.life > 0).length, frenzy: this.frenzyWas, frenzyMeter: this.board.frenzyMeter, lastResult: this.lastResult ? { chain: this.lastResult.chain, created: this.lastResult.created, activated: this.lastResult.activated, shuffled: this.lastResult.shuffled } : null, audio: this.audio.snapshot(), frameP95: sorted[Math.floor(sorted.length * 0.95)] ?? 0, artFriends: this.images.size };
      }
      developerPause(paused) {
        this.developerHold = paused;
        this.cancel();
        this.last = performance.now();
        this.audio.pause(paused || this.paused);
      }
      developerStatus() {
        return { ready: this.prepared, practice: this.developerPractice, freeze: this.developerFreeze, held: this.developerHold };
      }
      developerControl(command, value) {
        if (command === "close") {
          if (this.isOpen) this.close();
          return;
        }
        if (!this.isOpen || !this.prepared) throw Error("Open Squishy Pop first and wait for the art to load.");
        if (command === "normal") {
          this.level = void 0;
          this.developerPractice = false;
          this.developerFreeze = false;
          this.start();
          return;
        }
        this.developerPractice = true;
        this.cancel();
        if (command === "restart" || command === "tutorial") {
          this.start();
          if (command === "tutorial") {
            this.state = "intro";
            this.showCover();
          }
          return;
        }
        if (command === "finish") {
          if (this.state === "results") return;
          this.remaining = 0;
          if (!this.finaleDone) this.board.finale(this.activeTime);
          this.finaleDone = true;
          this.state = "results";
          this.audio.setMusic(false);
          this.showCover();
          return;
        }
        if (this.state === "results") throw Error("Start a new practice round first.");
        this.state = "playing";
        this.paused = false;
        this.showCover();
        this.audio.setMusic(true);
        if (command === "freeze") {
          this.developerFreeze = !this.developerFreeze;
          return;
        }
        if (command === "time") {
          this.remaining = Math.max(1, Math.min(300, value ?? 60));
          return;
        }
        if (command === "frenzy") {
          this.board.frenzyUntil = this.activeTime + 7;
          return;
        }
        this.moves.clear();
        this.gone = [];
        this.lockedUntil = 0;
        if (command === "chain") {
          const n = Math.max(3, Math.min(12, value ?? 7)), path = [12, 13, 14, 15, 16, 17, 23, 22, 21, 20, 19, 18];
          this.board.pieces.forEach((p, i) => {
            p.kind = this.board.pool[(i % 6 + Math.floor(i / 6) * 2) % this.board.pool.length];
            delete p.power;
          });
          path.slice(0, n).forEach((i) => this.board.pieces[i].kind = this.board.pool[0]);
        } else if (["bomb", "rainbow", "mega"].includes(command)) {
          this.board.pieces[14].power = command;
          this.board.pieces[13].kind = this.board.pieces[15].kind = this.board.pieces[14].kind;
        } else if (command === "shuffle") {
          for (let i = 35; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.board.pieces[i], this.board.pieces[j]] = [this.board.pieces[j], this.board.pieces[i]];
          }
          this.board.ensurePlayable();
        } else if (command === "deadlock") {
          this.board.pieces.forEach((p, i) => {
            p.kind = this.board.pool[(i % 6 + Math.floor(i / 6) * 2) % this.board.pool.length];
            delete p.power;
          });
          this.board.ensurePlayable();
        } else throw Error("Unknown Pop lab control.");
        this.feedback = command === "deadlock" ? "Deadlock recovered!" : "Ready to test!";
        this.feedbackUntil = this.activeTime + 1;
      }
      destroy() {
        this.close();
        this.audio.destroy();
        this.abort.abort();
        this.observer.disconnect();
        this.dialog.remove();
        this.launch.remove();
      }
    };
  }
});

// src/ui/TicketShop.ts
var TicketShop;
var init_TicketShop = __esm({
  "src/ui/TicketShop.ts"() {
    "use strict";
    init_ticketPrizes();
    init_PopArt();
    TicketShop = class {
      constructor(save, day, changed) {
        this.save = save;
        this.day = day;
        this.changed = changed;
        this.dialog.id = "ticket-shop";
        this.dialog.setAttribute("aria-label", "Squishy ticket prizes");
        document.body.append(this.dialog);
        this.dialog.addEventListener("click", (e) => {
          const b = e.target.closest("button");
          if (!b) return;
          if (b.hasAttribute("data-close")) this.dialog.close();
          else if (b.dataset.prize) {
            try {
              this.notice = this.save.redeemPrize(this.day(), b.dataset.prize) + " joined your collection!";
              this.changed();
            } catch (e2) {
              this.notice = e2.message;
            }
            this.render();
          }
        });
      }
      save;
      day;
      changed;
      dialog = document.createElement("dialog");
      art = new PopArt();
      notice = "";
      async open() {
        this.notice = "";
        try {
          this.save.ensureHuntDay(this.day());
        } catch (e) {
          this.notice = e.message;
        }
        this.render();
        this.dialog.showModal();
        try {
          await this.art.load();
          this.render();
        } catch {
          this.notice = "Prize pictures are loading slowly. Names and prices are ready.";
          this.render();
        }
      }
      render() {
        const day = this.day(), sold = this.save.data.prizes?.day === day ? this.save.data.prizes.sold : [], tickets = this.save.data.pop?.tickets ?? 0;
        this.dialog.innerHTML = `<small>YOUR POPS BECOME REAL PRIZES</small><h2>Squishy prize shelf</h2><strong>\u{1F39F} ${tickets} tickets</strong><p>Pick the friend you want! One of each today. New friends arrive after sleep.</p><div class="ticket-prizes"></div><p role="status"></p><small>Every finished round earns at least 1 ticket. Your tickets never expire.</small><button data-close>Back to game</button>`;
        this.dialog.prepend(this.dialog.querySelector("[data-close]"));
        for (const p of ticketPrizes(day)) {
          const card = document.createElement("article"), img = this.art.friends.get(p.item.id), owned = this.save.data.collection[p.item.id] ?? 0;
          card.innerHTML = `${img ? `<img src="${img.toDataURL()}" alt="">` : ""}<strong>${p.item.name}</strong><small>${p.item.rarity} \xB7 ${owned ? "Owned \xD7" + owned : "New friend!"}</small><button data-prize="${p.slot}" ${sold.includes(p.slot) || tickets < p.cost ? "disabled" : ""}>${sold.includes(p.slot) ? "Sold out" : `\u{1F39F} ${p.cost} \xB7 Pick me!`}</button>`;
          this.dialog.querySelector(".ticket-prizes").append(card);
        }
        this.dialog.querySelector('[role="status"]').textContent = this.notice;
      }
    };
  }
});

// src/game/GameLoop.ts
import { Vec3 as Vec327 } from "playcanvas";
var el, GameLoop;
var init_GameLoop = __esm({
  "src/game/GameLoop.ts"() {
    "use strict";
    init_collection();
    init_collection();
    init_ProgressStore();
    init_ActionButton();
    init_store();
    init_OpeningSequence();
    init_dumplingVisual();
    init_hunt();
    init_HuntUI();
    init_TradingUI();
    init_recess();
    init_trading();
    init_SquishyPopUI();
    init_squishyPop();
    init_TicketShop();
    el = (id) => document.querySelector(id);
    GameLoop = class {
      constructor(app, camera, character, room, props, cleanup, controller, joystick) {
        this.camera = camera;
        this.character = character;
        this.room = room;
        this.props = props;
        this.cleanup = cleanup;
        this.controller = controller;
        this.joystick = joystick;
        this.stores = STORES.map((definition2) => createStore(app, definition2));
        this.opening = new OpeningSequence(app);
        this.huntUI = new HuntUI((id) => this.attempt(() => this.visit(id)));
        this.ticketShop = new TicketShop(this.save, () => this.props.daily.clock.state.day, () => this.wallet());
        this.popUI = new SquishyPopUI(() => this.save.data.collection, (id, score, attempt) => this.save.completePopRound(id, score, attempt), (open) => {
          this.joystick.reset();
          this.controller.reset();
          this.controller.enabled = !open;
          this.props.daily.pause(performance.now());
          app.autoRender = !open;
          app.renderNextFrame = !open;
          if (open) {
            this.action.enabled = false;
            this.huntUI.panel.hidden = true;
          } else {
            this.action.enabled = true;
            this.findCopy = "";
            this.wallet();
          }
        }, () => !this.save.data.pop?.tutorialSeen, () => ({ bestScore: this.save.data.pop?.bestScore ?? 0, tickets: this.save.data.pop?.tickets ?? 0, levels: this.save.data.pop?.levels ?? {} }));
        this.recess = createRecess(app);
        this.popUI.onPrizes = () => {
          void this.ticketShop.open();
          this.controller.reset();
        };
        const prizes = document.createElement("button");
        prizes.className = "loop-button";
        prizes.textContent = "\u{1F39F} Spend tickets \xB7 Squishy prize shelf";
        prizes.onclick = () => {
          el("#collection-dialog").close();
          void this.ticketShop.open();
        };
        el("#collection-actions").append(prizes);
        this.nextStore.id = "travel-next-store";
        this.nextStore.textContent = "Travel to next store \u2192";
        this.nextStore.hidden = true;
        this.nextStore.onclick = () => this.attempt(() => this.chooseStore());
        el("#game").append(this.nextStore);
        this.tradingUI = new TradingUI(this.save, () => {
          this.wallet();
          this.recess.sync(this.save.data.trading);
        }, () => this.attempt(() => this.leaveRecess()));
        const daily = this.props.daily;
        daily.onReward = (id) => {
          this.pendingCredit = { id, amount: 1 };
          this.creditPending();
        };
        daily.onStore = () => this.attempt(() => this.chooseStore());
        daily.onPhaseChange = () => {
          if (this.cleanup.mode !== "day") return;
          if (daily.clock.state.phase === "school") {
            this.attempt(() => this.enterRecess(true));
            return;
          }
          if (this.mode === "store") return;
          const away = this.mode !== "cleanup";
          if (away && daily.clock.state.phase !== "night") return;
          this.huntUI.dialog.close();
          const position = this.character.player.getPosition().clone();
          if (this.mode !== "cleanup" && daily.clock.state.phase === "night") this.startCleanup();
          this.cleanup.configure("day");
          if (daily.clock.state.phase === "afternoon" || away) this.character.player.setPosition(-2.1, 0.09, 8.2);
          else if (daily.clock.state.phase !== "morning") this.character.player.setPosition(position);
        };
        el("#game").dataset.scene = "cleanup";
        this.action = new ActionButton(el("#action-button"), this.press, () => {
        });
        this.action.enabled = false;
        const on = (id, fn) => el(id).addEventListener("click", fn, { signal: this.abort.signal });
        on("#go-shopping", () => this.attempt(() => this.chooseStore()));
        on("#collection-button", () => this.attempt(() => this.collection()));
        const popShortcut = document.createElement("button");
        popShortcut.id = "squishy-pop-shortcut";
        popShortcut.type = "button";
        popShortcut.textContent = "\u273F Squishy Pop";
        popShortcut.title = "Jump straight into Squishy Pop";
        el("footer").insertBefore(popShortcut, el("#collection-button"));
        popShortcut.addEventListener("click", () => this.attempt(() => {
          if (this.tornado?.active || this.character.animator.busy || this.cleanup.movementLocked || this.opening.phase === "opening" || this.travelUntil || this.inspecting || this.mode === "cleanup" && this.cleanup.mission.timed && this.cleanup.mission.state === "running") {
            this.message("Finish this action or round, then jump into Squishy Pop!");
            return;
          }
          if (this.creditPending()) this.popUI.open();
        }), { signal: this.abort.signal });
        on("#back-cleanup", () => this.attempt(() => this.startCleanup()));
        on("#open-next", () => this.attempt(() => {
          this.save.goHome();
          this.enterHome();
        }));
        const tradeButton = document.createElement("button");
        tradeButton.id = "visit-recess";
        tradeButton.className = "loop-button pink-button";
        tradeButton.textContent = "Visit classroom trading club";
        el("#collection-actions").append(tradeButton);
        tradeButton.addEventListener("click", () => this.attempt(() => this.enterRecess(false)), { signal: this.abort.signal });
        for (const mode of ["day", "house", "bedroom", "pet", "practice"]) on(`#mission-${mode}`, () => {
          if (this.mode === "cleanup" && this.creditPending()) this.cleanup.configure(mode);
        });
        el("#collection-dialog").addEventListener("cancel", (e) => e.preventDefault(), { signal: this.abort.signal });
        cleanup.onFinished = (id, amount) => {
          this.pendingCredit = { id, amount };
          this.creditPending();
        };
        cleanup.beforeReplay = () => this.creditPending();
        cleanup.onReplay = () => this.camera.reset();
        this.wallet();
        this.attempt(() => this.save.ensureHuntDay(daily.clock.state.day));
        if (this.save.data.hunt?.day === daily.clock.state.day && daily.clock.canShop) {
          daily.clock.state.minutes = Math.max(daily.clock.state.minutes, this.save.data.hunt.clockFloor);
          daily.save();
        }
        const location2 = this.save.data.location;
        if (location2 === "store" && daily.clock.canShop && this.save.data.hunt?.activeStore) {
          this.activeStoreId = this.save.data.hunt.activeStore;
          this.enterStore();
        } else if (location2 === "store") this.attempt(() => {
          this.save.goHome();
          this.enterHome();
        });
        else if (location2 === "home") this.enterHome();
        else if (location2 === "collection") {
          this.enterHome();
          this.renderCollection();
        }
        if (this.save.problem) this.message(this.save.problem, true);
      }
      camera;
      character;
      room;
      props;
      cleanup;
      controller;
      joystick;
      tornado;
      save = new ProgressStore(new LocalSaveRepository());
      stores;
      activeStoreId = "corner";
      get store() {
        return this.stores.find((s) => s.definition.id === this.activeStoreId);
      }
      huntUI;
      tradingUI;
      popUI;
      ticketShop;
      nextStore = document.createElement("button");
      recess;
      recessFromSchool = false;
      travelUntil = 0;
      inspecting = null;
      findCopy = "";
      lastHuntRefresh = 0;
      opening;
      mode = "cleanup";
      focus = "";
      action;
      abort = new AbortController();
      messageUntil = 0;
      pendingCredit = null;
      baseZoom = 9;
      screen = new Vec327();
      markerPoint = new Vec327();
      developerPaused = false;
      developerClockFrozen = false;
      chooseStore() {
        const daily = this.props.daily;
        if (!daily.clock.canShop) {
          this.message("Shopping is an after-school adventure. Finish your morning and come back this afternoon.");
          return;
        }
        if (daily.clock.state.phase === "afternoon" && !daily.clock.ready) {
          this.message("Finish your afternoon helping first. Every chore earns spending money!");
          return;
        }
        if (!this.creditPending()) return;
        this.save.ensureHuntDay(daily.clock.state.day);
        el("#results").close();
        this.joystick.reset();
        this.controller.reset();
        this.huntUI.routes(this.save.data.hunt, daily.clock.state.minutes, this.save.data.balance);
      }
      visit(id) {
        const daily = this.props.daily;
        if (!daily.clock.canShop || daily.clock.state.phase === "afternoon" && !daily.clock.ready) throw Error("Shopping starts after your afternoon helping.");
        const minutes = this.save.visitStore(id, daily.clock.state.day, daily.clock.state.minutes);
        daily.clock.state.minutes = minutes;
        daily.save();
        this.activeStoreId = id;
        this.huntUI.showTravel(storeById(id).name);
        this.travelUntil = performance.now() + 1100;
        this.joystick.reset();
        this.controller.reset();
      }
      attempt(fn) {
        try {
          fn();
        } catch (error) {
          this.message(error instanceof Error ? error.message : "Please try again.", true);
        }
      }
      message(value, persistent = false) {
        el("#save-message").textContent = value;
        el("#save-message").hidden = false;
        el("#cleanup-announcement").textContent = value;
        this.messageUntil = persistent ? Infinity : performance.now() + 2600;
      }
      creditPending() {
        if (!this.pendingCredit) return true;
        try {
          this.save.creditRound(this.pendingCredit.id, this.pendingCredit.amount);
          this.pendingCredit = null;
          this.wallet();
          el("#results-wallet").textContent = `Saved to your wallet \xB7 $${this.save.data.balance}`;
          return true;
        } catch (error) {
          el("#results-wallet").textContent = "Allowance not saved yet. Replay or shopping will retry.";
          this.message(error.message, true);
          return false;
        }
      }
      wallet() {
        const data = this.save.data, discovered = DUMPLINGS.filter((d) => data.collection[d.id] > 0).length;
        el("#wallet").textContent = `$${data.balance}`;
        el("#trip-balance").textContent = `$${data.balance}`;
        el("#collection-button").textContent = `Collection \xB7 ${discovered} / ${DUMPLINGS.length}${data.boxes.length ? ` \xB7 \u{1F381} ${data.boxes.length}` : ""}`;
      }
      transition(mode) {
        if (this.mode === "cleanup" && mode !== "cleanup") {
          this.props.reset();
          this.cleanup.carry.item = null;
          this.character.animator.reset();
        }
        this.mode = mode;
        this.cleanup.setActive(mode === "cleanup");
        this.action.enabled = mode !== "cleanup";
        this.action.reset();
        this.camera.reset();
        this.joystick.reset();
        this.controller.reset();
        this.opening.hide();
        this.room.root.enabled = mode === "cleanup";
        this.props.root.enabled = mode === "cleanup";
        this.recess.root.enabled = mode === "recess";
        this.tradingUI.leave.hidden = mode !== "recess";
        this.tradingUI.close();
        for (const store of this.stores) store.root.enabled = mode === "store" && store.definition.id === this.activeStoreId;
        this.huntUI.panel.hidden = true;
        this.huntUI.dialog.close();
        this.findCopy = "";
        this.inspecting = null;
        el("#move-tip").hidden = false;
        this.character.player.enabled = mode !== "home";
        el("#player-label").hidden = mode === "home";
        el("#store-markers").hidden = mode !== "store";
        el("#game").dataset.scene = mode;
        el("#task-list").hidden = mode !== "cleanup";
        el("#task-count").hidden = mode !== "cleanup";
        el("#mission-picker").hidden = mode !== "cleanup";
        el("#mission-clock").hidden = mode !== "cleanup";
        el(".allowance-label").hidden = mode !== "cleanup";
        el("#trip-wallet").hidden = mode === "cleanup";
        el("#home-vignette").hidden = mode !== "home";
        el("#scene-subtitle").hidden = mode === "cleanup";
        el("#collection-dialog").close();
        this.camera.entity.camera.orthoHeight = this.baseZoom;
        if (mode === "home") {
          this.character.player.setPosition(0.48, 0.09, -0.8);
          this.character.visual.setLocalEulerAngles(0, 15, 0);
          this.character.animator.reset();
        }
        if (mode === "home") this.opening.frame(this.camera.entity, el("#game").clientWidth, el("#game").clientHeight);
        el("#action-button").classList.remove("holding");
        this.focus = "";
        el("#save-message").hidden = true;
      }
      enterStore() {
        if (this.cleanup.mode !== "day") this.cleanup.configure("day");
        this.transition("store");
        this.controller.setRoom(this.store);
        this.character.player.setPosition(0, 0.09, this.store.exitAnchor.z - 0.4);
        this.store.sync(this.save.data.hunt.stores[this.activeStoreId]);
        this.character.animator.reset();
        this.character.visual.setLocalEulerAngles(0, 30, 0);
        el("#scene-kicker").textContent = this.store.definition.name;
        el("h1").textContent = "A little treasure hunt.";
        el("#scene-subtitle").textContent = "Peek at shelves, baskets & little displays.";
      }
      enterRecess(fromSchool) {
        this.save.ensureTradingDay(this.props.daily.clock.state.day);
        this.recessFromSchool = fromSchool;
        this.transition("recess");
        this.controller.setRoom(this.recess);
        this.character.player.setPosition(0, 0.09, 3.3);
        this.character.animator.reset();
        this.recess.sync(this.save.data.trading);
        el("#scene-kicker").textContent = "CLASSROOM TRADING CLUB";
        el("h1").textContent = "Got any doubles?";
        el("#scene-subtitle").textContent = "Bring extras. Find a new favorite.";
        this.tradingUI.leave.textContent = fromSchool ? "Finish school \u2192" : "Back to collection \u2192";
      }
      leaveRecess() {
        this.tradingUI.close();
        if (this.recessFromSchool) {
          this.props.daily.clock.advance(3);
          this.props.daily.save();
          this.startCleanup();
          this.character.player.setPosition(-2.1, 0.09, 8.2);
        } else {
          this.save.showCollection();
          this.enterHome();
          this.renderCollection();
        }
      }
      enterHome() {
        this.transition("home");
        el("#scene-kicker").textContent = "A LITTLE SURPRISE";
        el("h1").textContent = "Hello, little surprise.";
        el("#scene-subtitle").textContent = `${this.save.data.boxes.length} unopened ${this.save.data.boxes.length === 1 ? "basket" : "baskets"}`;
        this.opening.show(this.save.data.reveal);
        if (!this.save.data.boxes.length && !this.save.data.reveal) {
          this.opening.root.enabled = false;
          this.opening.panel.textContent = "Your next little friend starts with a little helping.";
        }
        this.wallet();
      }
      collection() {
        if (this.mode === "cleanup" && this.cleanup.mission.state === "running" && this.cleanup.mission.timed) return;
        if (!this.creditPending()) return;
        this.save.showCollection();
        this.enterHome();
        this.renderCollection();
      }
      renderCollection() {
        const grid = el("#collection-grid");
        grid.replaceChildren();
        let discovered = 0, total = 0;
        for (const series of SERIES) {
          const heading = document.createElement("strong");
          heading.className = "series-heading";
          heading.textContent = `${series.name} \xB7 ${series.items.filter((id) => this.save.data.collection[id] > 0).length}/${series.items.length}`;
          grid.append(heading);
          for (const data of DUMPLINGS.filter((d) => series.items.includes(d.id))) {
            const count = this.save.data.collection[data.id] || 0;
            if (count) discovered++;
            total += count;
            const card = document.createElement("article");
            card.className = `dumpling-card${count ? " owned" : ""}`;
            card.dataset.id = data.id;
            card.style.setProperty("--rarity", `${RARITIES[data.rarity].color}66`);
            const image = document.createElement("img");
            image.src = dumplingPortrait(data, !count);
            image.alt = count ? data.name : "Undiscovered dumpling";
            image.loading = "lazy";
            image.width = 320;
            image.height = 320;
            const name = document.createElement("strong");
            name.textContent = count ? data.name : "???";
            const tier = document.createElement("small");
            tier.textContent = data.rarity;
            const copies = document.createElement("small");
            copies.className = "copies";
            copies.textContent = count ? `\xD7${count} \xB7 Pop ${"\u2605".repeat(starLevel(count))}` : "Locked";
            card.append(image, name, tier, copies);
            grid.append(card);
            if (count) for (const [kind, icon, label] of [["favorite", "\u2665", "Favorite"], ["locked", "\u{1F512}", "Lock"]]) {
              const button2 = document.createElement("button");
              button2.className = "collection-protection";
              button2.textContent = icon;
              button2.setAttribute("aria-label", `${label} ${data.name}`);
              button2.setAttribute("aria-pressed", String(!!this.save.data.protections?.[data.id]?.[kind]));
              let pressed = false;
              button2.onpointerdown = () => {
                pressed = true;
              };
              button2.onclick = (e) => {
                if (e.detail > 0 && !pressed) return;
                pressed = false;
                this.attempt(() => {
                  this.save.protect(data.id, kind, !this.save.data.protections?.[data.id]?.[kind]);
                  button2.setAttribute("aria-pressed", String(this.save.data.protections?.[data.id]?.[kind]));
                });
              };
              card.append(button2);
            }
          }
        }
        el("#collection-summary").textContent = `${discovered} / ${DUMPLINGS.length} discovered \xB7 ${total} collected \xB7 Wallet $${this.save.data.balance}`;
        el("#open-next").hidden = !this.save.data.boxes.length;
        el("#open-next").textContent = `Open next box \xB7 ${this.save.data.boxes.length} waiting`;
        el("#collection-dialog").showModal();
        el("#collection-dialog").scrollTop = 0;
        this.joystick.reset();
        this.controller.reset();
        this.action.enabled = false;
      }
      startCleanup() {
        if (!this.creditPending()) return;
        this.save.startCleanup();
        this.transition("cleanup");
        this.controller.setRoom(this.room);
        this.cleanup.replay();
        el("#scene-kicker").textContent = "ONE COZY MINUTE";
        el("h1").textContent = "Home, sweet home.";
        this.wallet();
      }
      press = () => this.attempt(() => {
        if (this.travelUntil || this.inspecting) return;
        if (this.mode === "recess") {
          const seat = this.recess.seats.find((s) => s.id === this.focus && this.character.player.getPosition().distance(s.anchor) < 1.05);
          if (seat) {
            this.joystick.reset();
            this.controller.reset();
            this.tradingUI.open(seat.id, this.props.daily.clock.state.day);
          }
          return;
        }
        if (this.mode === "store") {
          this.storeFocus();
          if (this.focus.startsWith("hunt-site-")) {
            const site = Number(this.focus.slice(10)), slot = this.save.data.hunt.stores[this.activeStoreId].slots.find((s) => s.site === site);
            if (!slot.discovered) {
              this.inspecting = { site, until: performance.now() + HUNT_RULES.inspectMilliseconds };
              this.joystick.reset();
              this.controller.reset();
            } else {
              this.save.purchaseStock(site);
              this.store.sync(this.save.data.hunt.stores[this.activeStoreId]);
              this.wallet();
              this.message("A sealed surprise, tucked into your bag!");
            }
          } else if (this.focus === "go-home") {
            this.save.goHome();
            this.enterHome();
          }
        } else if (this.mode === "home") {
          if (this.opening.phase !== "opening" && this.save.data.boxes.length) {
            if (this.opening.phase === "revealed") {
              this.save.finishReveal();
              this.opening.show(null);
            }
            const receipt = this.save.openNext();
            this.wallet();
            this.opening.begin(receipt, performance.now());
            el("#scene-subtitle").textContent = `${this.save.data.boxes.length} unopened ${this.save.data.boxes.length === 1 ? "basket" : "baskets"} waiting`;
          } else if (this.opening.phase !== "opening") this.collection();
        }
      });
      storeFocus() {
        const p = this.character.player.getPosition();
        const stock = this.save.data.hunt.stores[this.activeStoreId];
        const nearby = this.store.sites.filter((site) => stock.slots.some((s) => s.site === site.id && s.remaining > 0) && Math.hypot(p.x - site.anchor.x, p.z - site.anchor.z) <= 0.95).sort((a, b) => p.distance(a.anchor) - p.distance(b.anchor))[0];
        this.focus = nearby ? `hunt-site-${nearby.id}` : Math.hypot(p.x, p.z - this.store.exitAnchor.z) <= 0.9 ? "go-home" : "";
      }
      beforeMovement(now) {
        const daily = this.props.daily;
        daily.shoppingDone = this.save.data.hunt?.day === daily.clock.state.day && Object.values(this.save.data.hunt.stores).filter((s) => s.visited).length >= 2;
        if (this.tornado?.active) {
          this.tornado.beforeMovement(now);
          return;
        }
        if (this.popUI.isOpen) {
          this.props.daily.pause(now);
          this.controller.enabled = false;
          return;
        }
        if (this.developerClockFrozen) this.props.daily.pause(now);
        if (this.mode === "store" || this.mode === "home" || this.travelUntil || this.huntUI.dialog.open || this.ticketShop.dialog.open) this.props.daily.pause(now);
        else if (this.mode !== "recess") this.props.daily.update(now, this.cleanup.carry.item?.id ?? null, this.cleanup.movementLocked || this.controller.approaching || this.opening.phase === "opening");
        else this.props.daily.pause(now);
        const school = this.cleanup.mode === "day" && this.props.daily.clock.state.phase === "school";
        el("#school-transition").hidden = !school || this.mode === "recess";
        if (this.mode === "cleanup") this.cleanup.mission.tick(now);
        this.controller.enabled = (!school || this.mode === "recess") && !this.ticketShop.dialog.open && !this.tradingUI.dialog.open && !this.travelUntil && !this.inspecting && !this.huntUI.dialog.open && (this.mode === "recess" || this.mode === "store" || this.mode === "cleanup" && this.cleanup.mission.state !== "finished" && !this.cleanup.movementLocked) && !el("#collection-dialog").open;
      }
      update(now) {
        this.nextStore.hidden = this.mode !== "store" || this.popUI.isOpen || !!this.travelUntil || Object.values(this.save.data.hunt?.stores ?? {}).filter((s) => s.visited).length >= 2;
        if (this.tornado?.active) return;
        this.popUI.launch.hidden = this.mode !== "store" || this.popUI.isOpen || !!this.travelUntil || !!this.inspecting || this.huntUI.dialog.open || this.focus.startsWith("hunt-site-");
        if (this.popUI.isOpen) return;
        const daily = this.cleanup.mode === "day", clock = this.props.daily.clock;
        if (now - this.lastHuntRefresh > 1e3) {
          this.lastHuntRefresh = now;
          this.attempt(() => this.save.ensureHuntDay(clock.state.day));
          if (this.huntUI.dialog.open && this.save.data.hunt) this.huntUI.refresh(this.save.data.hunt, clock.state.minutes, this.save.data.balance);
        }
        this.huntUI.clock(clock.state.minutes, daily && clock.canShop && !this.huntUI.dialog.open && this.mode !== "home" && this.mode !== "recess");
        if (this.travelUntil) {
          if (now < this.travelUntil) return;
          this.travelUntil = 0;
          this.huntUI.travel.hidden = true;
          this.enterStore();
        }
        el("#day-label").hidden = !daily;
        if (daily) {
          el("#day-label").textContent = `Day ${clock.state.day} \xB7 ${clock.state.phase === "afternoon" ? "After school" : clock.state.phase}`;
          el("#mission-clock").hidden = this.mode === "store";
          el("#mission-clock").textContent = clock.label;
        }
        if (this.mode === "recess") el("#day-label").textContent = `Day ${clock.state.day} \xB7 ${this.recess.area}`;
        const running = this.mode === "cleanup" && this.cleanup.mission.state === "running" && this.cleanup.mission.timed;
        for (const mode of ["day", "house", "bedroom", "pet", "practice"]) {
          const button3 = el(`#mission-${mode}`);
          button3.disabled = running;
          button3.setAttribute("aria-pressed", String(this.cleanup.mode === mode));
        }
        el("#game").dataset.mission = this.cleanup.mode;
        el("#collection-button").disabled = running || this.mode === "store" || this.mode === "recess" || this.opening.phase === "opening";
        if (now > this.messageUntil) el("#save-message").hidden = true;
        if (this.mode === "cleanup") {
          el("#task-list").hidden = this.cleanup.mode === "practice";
          this.cleanup.update(now, this.controller.input.lengthSq() > 0);
          if (this.cleanup.mode === "day") {
            el("#allowance").textContent = `$${this.save.data.balance}`;
            el("#day-label").textContent = `Day ${this.props.daily.clock.state.day} \xB7 ${this.props.daily.clock.state.phase === "afternoon" ? "After school" : this.props.daily.clock.state.phase}`;
          }
          el("#day-label").hidden = this.cleanup.mode !== "day";
          return;
        }
        let title = "Action", detail = "Come closer", icon = "\u270B", enabled = false;
        if (this.mode === "recess") {
          const p = this.character.player.getPosition();
          const seat = this.recess.seats.filter((s) => p.distance(s.anchor) < 1.05).sort((a, b) => p.distance(a.anchor) - p.distance(b.anchor))[0];
          this.focus = seat?.id ?? "";
          this.recess.update(now, this.focus, p);
          el("h1").textContent = this.recess.area;
          el("#scene-kicker").textContent = this.recess.area === "Cafeteria" ? "GOOD FOOD \xB7 BRIGHT DAYS" : "CLASSROOM \xB7 TRADING CLUB";
          this.recess.seats.forEach((s) => s.glow.enabled = s === seat);
          const trader = TRADERS.find((t) => t.id === seat?.id);
          el("#cleanup-hint").textContent = this.recess.area === "Cafeteria" ? "Good food, bright days. Walk through the front doorway to return to class." : "Trade at a classmate\u2019s desk, or walk through the back door to the cafeteria.";
          if (trader) {
            title = "Trade with " + trader.name;
            detail = trader.title;
            icon = trader.icon;
            enabled = !this.tradingUI.dialog.open;
          }
        } else if (this.mode === "store") {
          this.storeFocus();
          const data = this.save.data;
          const stock = data.hunt.stores[this.activeStoreId];
          if (this.inspecting && now >= this.inspecting.until) {
            const site2 = this.inspecting.site;
            this.inspecting = null;
            this.attempt(() => this.save.discover(site2));
            this.findCopy = "";
          }
          const allGone = stock.slots.every((s) => !s.remaining);
          el("#cleanup-hint").textContent = `Bag ${data.trip.purchases} / ${HUNT_RULES.bagLimit} \xB7 ${allGone ? "All the boxes are gone today." : "Look around for little ribboned boxes."} Return at the welcome mat.`;
          let copy = "";
          const slot = this.save.data.hunt.stores[this.activeStoreId].slots.find((s) => `hunt-site-${s.site}` === this.focus);
          if (slot) {
            icon = "\u{1F381}";
            if (this.inspecting) {
              title = "Taking a peek\u2026";
              detail = "What series is it?";
            } else if (!slot.discovered) {
              title = "Take a look";
              detail = this.store.sites[slot.site].name;
              enabled = true;
            } else {
              const series = seriesById(slot.series), price = boxPrice(this.store.definition, slot.series) - this.save.popDiscount(), full = data.trip.purchases >= HUNT_RULES.bagLimit, short = data.balance < price;
              const owned = series.items.filter((id) => data.collection[id] > 0).length;
              title = full ? "Bag full" : short ? "Save a little" : "Buy box";
              detail = full ? "Bring your finds home" : short ? `Need $${price - data.balance} more` : `$${price} \xB7 Sealed surprise`;
              enabled = !full && !short;
              copy = `${series.name}|$${price}${this.save.popDiscount() ? " \xB7 $1 ticket coupon included" : ""} \xB7 Owned ${owned}/${series.items.length}|${slot.remaining === 1 ? "Last box at this display." : "A couple of boxes here."} The friend inside is a surprise.`;
            }
          } else if (this.focus === "go-home") {
            title = "Go Home";
            detail = data.boxes.length ? "Open your boxes" : "Back to the cottage";
            icon = "\u2302";
            enabled = true;
          }
          if (copy !== this.findCopy) {
            this.findCopy = copy;
            if (copy) {
              const [a, b, c] = copy.split("|");
              this.huntUI.find(a, b, c);
            } else this.huntUI.panel.hidden = true;
          }
          el("#move-tip").hidden = !!copy;
          const site = this.store.sites.find((s) => `hunt-site-${s.id}` === this.focus);
          this.store.glows.forEach((g, i) => g.enabled = site?.id === i);
          const marker = el("#shop-display-marker");
          marker.hidden = !site;
          if (site) {
            marker.textContent = "\u2726";
            this.camera.entity.camera.worldToScreen(site.marker, this.screen);
            marker.style.transform = `translate(${this.screen.x - marker.offsetWidth / 2}px,${this.screen.y - marker.offsetHeight}px)`;
          }
          this.markerPoint.copy(this.store.exitAnchor);
          this.markerPoint.y = 0.1;
          this.camera.entity.camera.worldToScreen(this.markerPoint, this.screen);
          const exit = el("#shop-exit-marker");
          exit.style.transform = `translate(${this.screen.x - exit.offsetWidth / 2}px,${this.screen.y}px)`;
          exit.classList.toggle("nearby", this.focus === "go-home");
        } else {
          this.opening.update(now);
          const opening = this.opening.phase === "opening", canOpen = this.opening.phase !== "opening" && this.save.data.boxes.length > 0;
          title = opening ? "A surprise\u2026" : canOpen ? this.opening.phase === "revealed" ? "Open next" : "Open basket" : "Collection";
          detail = opening ? "Here it comes" : canOpen ? "Meet your squishy" : "Meet your friends";
          icon = canOpen ? "\u{1F381}" : "\u2726";
          enabled = !opening;
          this.focus = canOpen ? "open-box" : opening ? "" : "collection";
        }
        const button2 = el("#action-button");
        button2.disabled = !enabled || this.tradingUI.dialog.open || el("#collection-dialog").open;
        button2.dataset.target = enabled ? this.focus : "";
        el("#action-title").textContent = title;
        el("#action-detail").textContent = detail;
        el("#action-icon").textContent = icon;
        button2.setAttribute("aria-label", `${title}: ${detail}`);
      }
      developerHold(paused) {
        this.tornado?.pause(paused);
        this.developerPaused = paused;
        this.joystick.reset();
        this.controller.reset();
        this.props.daily.pause(performance.now());
        if (paused) this.cleanup.developerCancel();
        this.action.enabled = !paused && this.mode !== "cleanup" && !this.popUI.isOpen;
        this.cleanup.action.enabled = !paused && this.mode === "cleanup" && !this.tornado?.active;
        this.popUI.developerPause(paused);
      }
      developerTick(now, elapsed) {
        this.props.daily.pause(now);
        this.cleanup.mission.pauseFor(elapsed * 1e3);
        if (this.travelUntil) this.travelUntil += elapsed * 1e3;
        if (this.inspecting) this.inspecting.until += elapsed * 1e3;
      }
      developerSummary() {
        return { scene: this.mode, store: this.mode === "store" ? this.store.definition.name : null, day: this.props.daily.clock.state.day, time: this.props.daily.clock.label, phase: this.props.daily.clock.state.phase, clockFrozen: this.developerClockFrozen, balance: this.save.data.balance, tickets: this.save.data.pop?.tickets ?? 0, discovered: DUMPLINGS.filter((d) => this.save.data.collection[d.id] > 0).length, boxes: this.save.data.boxes.length, cleanup: this.cleanup.mode, completed: this.cleanup.mission.completed.size, tasks: this.cleanup.mission.tasks.length, pop: this.popUI.snapshot(), popDev: this.popUI.developerStatus() };
      }
      developerCommand(command, value = "") {
        const daily = this.props.daily;
        const home = () => {
          this.tornado?.close();
          this.popUI.developerControl("close");
          this.travelUntil = 0;
          this.inspecting = null;
          this.huntUI.travel.hidden = true;
          this.cleanup.developerCancel();
          this.cleanup.mission.reset();
          this.cleanup.configure("day");
          this.startCleanup();
          this.character.player.setPosition(-2.1, 0.09, 8.2);
          this.camera.reset();
        };
        const phase = (p, next = false) => {
          home();
          daily.developerPhase(p, next);
          this.save.ensureHuntDay(daily.clock.state.day);
          this.save.developerEdit((data) => {
            if (data.hunt) data.hunt.clockFloor = daily.clock.state.minutes;
          });
          this.cleanup.configure("day");
          this.character.player.setPosition(-2.1, 0.09, 8.2);
        };
        if (command.startsWith("pop:")) {
          this.popUI.developerControl(command.slice(4), Number(value) || void 0);
          return;
        }
        switch (command) {
          case "tornado":
            home();
            this.tornado?.open(["dog", "basket", "none"].includes(value) ? value : void 0);
            break;
          case "play-pop":
          case "store": {
            const id = command === "play-pop" ? "toys" : value;
            if (!STORES.some((s) => s.id === id)) throw Error("Choose a store.");
            phase("afternoon");
            daily.developerComplete();
            this.cleanup.developerComplete();
            this.save.developerEdit((data) => {
              data.location = "store";
              data.trip = { active: true, purchases: 0 };
              data.hunt.activeStore = id;
              data.hunt.stores[id].visited = true;
            });
            this.activeStoreId = id;
            this.enterStore();
            if (command === "play-pop") this.popUI.open();
            break;
          }
          case "home":
            home();
            break;
          case "collection":
            home();
            this.collection();
            break;
          case "recess":
            home();
            this.enterRecess(false);
            break;
          case "complete-current":
            if (this.mode !== "cleanup") throw Error("Return home to finish the current cleaning activity.");
            this.cleanup.developerComplete();
            break;
          case "skip-chores":
            phase("afternoon");
            this.cleanup.developerComplete();
            break;
          case "phase":
            if (!["morning", "afternoon", "night"].includes(value)) throw Error("Choose a time of day.");
            phase(value);
            break;
          case "next-day":
            phase("morning", true);
            break;
          case "freeze-clock":
            this.developerClockFrozen = !this.developerClockFrozen;
            break;
          case "restart-chores":
            home();
            daily.clock.state.done = [];
            if (daily.clock.state.phase === "morning") daily.clock.state.breakfast = "eggs";
            daily.refresh();
            daily.save();
            this.cleanup.replay();
            break;
          case "unstick":
            this.popUI.developerControl("close");
            this.cleanup.developerCancel();
            if (this.mode === "store") {
              this.character.player.setPosition(0, 0.09, this.store.exitAnchor.z - 0.4);
            } else if (this.mode === "recess") this.character.player.setPosition(0, 0.09, 3.3);
            else home();
            this.character.animator.reset();
            this.camera.reset();
            break;
          case "cash":
            this.save.developerEdit((data) => {
              data.balance = Math.min(999999, data.balance + 20);
            });
            break;
          case "tickets":
            this.save.developerEdit((data) => {
              const p = data.pop ??= { tickets: 0, bestScore: 0, rounds: [], tutorialSeen: false, couponDay: 0 };
              p.tickets = Math.min(999999, p.tickets + 40);
            });
            break;
          case "unlock":
          case "duplicates":
            this.save.developerEdit((data) => {
              for (const d of DUMPLINGS) data.collection[d.id] = Math.max(data.collection[d.id] ?? 0, command === "duplicates" ? 5 : 1);
            });
            break;
          case "give-item":
          case "give-box":
            if (!DUMPLINGS.some((d) => d.id === value)) throw Error("Choose a squishy.");
            this.save.developerEdit((data) => {
              if (command === "give-item") data.collection[value] = Math.min(999999, (data.collection[value] ?? 0) + 1);
              else data.boxes.push({ id: crypto.randomUUID(), dumplingId: value });
            });
            break;
          case "restock":
            this.save.developerEdit((data) => {
              const fresh2 = createHuntDay(daily.clock.state.day);
              if (data.hunt) {
                fresh2.activeStore = data.hunt.activeStore;
                fresh2.clockFloor = data.hunt.clockFloor;
              }
              data.hunt = fresh2;
              data.trip.purchases = 0;
            });
            for (const store of this.stores) store.sync(this.save.data.hunt.stores[store.definition.id]);
            break;
          default:
            throw Error("Unknown developer control.");
        }
        this.wallet();
        if (el("#collection-dialog").open) this.renderCollection();
        this.findCopy = "";
        this.props.daily.pause(performance.now());
      }
      resized() {
        this.baseZoom = this.camera.exploreHeight;
        if (this.mode === "home") this.opening.frame(this.camera.entity, el("#game").clientWidth, el("#game").clientHeight);
      }
      snapshot() {
        return {
          mode: this.mode,
          balance: this.save.data.balance,
          boxes: this.save.data.boxes.length,
          purchases: this.save.data.trip.purchases,
          collection: { ...this.save.data.collection },
          phase: this.opening.phase,
          reveal: this.save.data.reveal ? { ...this.save.data.reveal } : null,
          focus: this.focus,
          opening: this.opening.snapshot(),
          pop: this.popUI.snapshot(),
          popSave: this.save.data.pop,
          trading: this.save.data.trading,
          recess: this.mode === "recess" ? { area: this.recess.area, door: this.recess.door.toArray(), cafeteriaCenter: this.recess.cafeteriaCenter.toArray(), walkable: this.recess.walkable, obstacles: this.recess.obstacles.map((b) => ({ center: b.center.toArray(), halfExtents: b.halfExtents.toArray() })), seats: this.recess.seats.map((s) => ({ id: s.id, position: s.anchor.toArray() })), art: this.recess.artStats?.() } : null,
          hunt: this.save.data.hunt,
          store: this.mode === "store" ? { id: this.activeStoreId, sites: this.store.sites.map((s) => ({ id: s.id, position: s.anchor.toArray() })), exit: this.store.exitAnchor.toArray(), walkable: this.store.walkable, obstacles: this.store.obstacles.map((b) => ({ center: b.center.toArray(), halfExtents: b.halfExtents.toArray() })), art: this.store.artStats?.() } : null
        };
      }
      destroy() {
        this.popUI.destroy();
        this.abort.abort();
        document.querySelector("#squishy-pop-shortcut")?.remove();
        this.action.destroy();
        this.opening.destroy();
        this.huntUI.destroy();
        this.tradingUI.destroy();
      }
    };
  }
});

// src/ui/HouseNavigation.ts
import { Vec3 as Vec328 } from "playcanvas";
var HouseNavigation;
var init_HouseNavigation = __esm({
  "src/ui/HouseNavigation.ts"() {
    "use strict";
    init_house();
    HouseNavigation = class {
      current = "bedroom";
      root = document.querySelector("#house-doors");
      point = new Vec328();
      screen = new Vec328();
      labels = HOUSE_DOORS.map((door) => {
        const label = document.createElement("span");
        label.className = "door-label";
        this.root.append(label);
        return { door, label };
      });
      update(position, camera, enabled, mission) {
        this.root.hidden = true;
        document.querySelector("#room-connections").hidden = true;
        if (!enabled) return;
        const room = HOUSE_ROOMS.find((room2) => position.x >= room2.minX && position.x <= room2.maxX && position.z >= room2.minZ && position.z <= room2.maxZ);
        if (room) this.current = room.id;
        const current = HOUSE_ROOMS.find((room2) => room2.id === this.current);
        document.querySelector("h1").textContent = current.title;
        document.querySelector("#scene-kicker").textContent = `${mission === "day" ? "EVERYDAY LIFE" : mission === "practice" ? "FREE EXPLORING" : mission === "pet" ? "PUPPY CLEANUP" : mission === "house" ? "HOUSE CLEANUP" : "BEDROOM CLEANUP"}`;
        const neighbors = [];
        for (const { door, label } of this.labels) {
          const connected = door.a === this.current || door.b === this.current;
          const other = HOUSE_ROOMS.find((room2) => room2.id === (door.a === this.current ? door.b : door.a));
          if (connected) neighbors.push(other.name);
          this.point.set(door.x, 0.6, door.z);
          camera.camera.worldToScreen(this.point, this.screen);
          label.hidden = !connected || this.screen.x < 25 || this.screen.x > this.root.clientWidth - 25 || this.screen.y < this.root.clientHeight * 0.27 || this.screen.y > this.root.clientHeight * 0.72;
          label.textContent = `${other.name} \u203A`;
          label.style.transform = `translate(${this.screen.x}px,${this.screen.y}px) translate(-50%,-100%)`;
        }
        document.querySelector("#room-connections").textContent = `Walk through to ${neighbors.join(" \xB7 ")}`;
      }
      destroy() {
        this.root.replaceChildren();
      }
    };
  }
});

// src/game/Lilah.ts
import { Asset as Asset8, BoundingBox as BoundingBox15, Entity as Entity30, Vec3 as Vec329 } from "playcanvas";
var Lilah;
var init_Lilah = __esm({
  "src/game/Lilah.ts"() {
    "use strict";
    init_PropSpace();
    init_AssetUrls();
    init_CharacterAnimator();
    init_CharacterGrounding();
    init_HousePath();
    init_RestingPose();
    init_BedEntry();
    init_primitives();
    Lilah = class {
      constructor(app, house, daily) {
        this.app = app;
        this.house = house;
        this.daily = daily;
        this.root = new Entity30("Lilah \xB7 age 2", app);
        app.root.addChild(this.root);
        this.root.setPosition(1, 0.09, 0.7);
        this.visual = new Entity30("Lilah visual", app);
        this.root.addChild(this.visual);
        const placeholder = new Entity30("Lilah loading", app);
        this.visual.addChild(placeholder);
        this.animator = new CharacterAnimator(this.visual, placeholder);
        this.planner = new HousePath(house);
        this.socket = new Entity30("Lilah toy grip", app);
        this.visual.addChild(this.socket);
        this.animator.bindCarrySocket(this.socket);
        this.toy = primitives(app, this.socket)("Favorite block", "box", [0, 0, 0], [0.13, 0.13, 0.13], material("Lilah favorite block", "#edb867"));
        this.toy.enabled = false;
        this.label.id = "lilah-label";
        this.label.className = "lilah-label";
        this.label.hidden = true;
        document.querySelector("#game").append(this.label);
        this.say("Hi, Ari!");
        this.daily.onPlayLilah = () => this.playTogether();
        this.daily.onLilahBed = () => this.restInCrib();
        this.daily.lilahMesses.onClean = (actor) => {
          if (!this.animator.busy) {
            this.say(actor === "marc" ? "Daddy fixed it! I supervised!" : "All better! I helped!");
            this.animator.playAction("Celebrate", 1.6);
          }
        };
        void this.load().catch((error) => {
          console.error("Lilah could not load:", error);
          this.label.textContent = "Lilah is still loading";
        });
      }
      app;
      house;
      daily;
      root;
      visual;
      animator;
      planner;
      toy;
      socket;
      grounding = null;
      label = document.createElement("div");
      route = [];
      destination = "";
      nextDecision = 0;
      nextMess = 8;
      time = 0;
      day = 0;
      height = 0.86465625;
      loaded = false;
      carrying = false;
      state = "watching";
      bedStart = null;
      speech = "Hi, Ari!";
      speechUntil = 0;
      visited = /* @__PURE__ */ new Set();
      scripted = false;
      job = null;
      get ready() {
        return this.loaded;
      }
      get working() {
        return !!this.job;
      }
      beginTornado() {
        this.scripted = true;
        this.job = null;
        this.route = [];
        this.animator.cancelAction();
        this.carrying = false;
        this.toy.enabled = false;
        this.animator.setCarrying(false);
        this.say("\u{1F32A}\uFE0F Ready, Ari?");
      }
      endTornado() {
        this.scripted = false;
        this.job = null;
        this.route = [];
        this.animator.cancelAction();
        this.animator.setCarrying(false);
        this.toy.enabled = false;
        this.carrying = false;
        this.state = "watching";
        this.nextDecision = this.time + 10;
        this.say("\u2728 We did it together!");
      }
      visitForMess(point, icon, drop) {
        if (!this.scripted || this.job) return false;
        const start = this.root.getPosition().clone();
        start.y = 0;
        const route = new HousePath(this.house, 0.27).route(start, point);
        if (!route.length) return false;
        this.route = route;
        this.job = { point: point.clone(), icon, drop, wait: 0, blocked: 0 };
        this.state = "tornado-travel";
        this.toy.enabled = true;
        this.carrying = true;
        this.animator.setCarrying(true);
        this.say(icon + "  I have an idea!");
        return true;
      }
      updateTornado(dt, arianna, velocity) {
        const job = this.job;
        if (!job || this.animator.busy) return;
        if (this.route.length) {
          const p = this.root.getPosition(), next = this.route[0], delta = new Vec329(next.x - p.x, 0, next.z - p.z), distance = delta.length();
          if (distance < 0.035) {
            this.route.shift();
            return;
          }
          delta.normalize();
          const q = p.clone().add(delta.clone().mulScalar(Math.min(distance, 1.05 * dt)));
          const separation = Math.hypot(q.x - arianna.x, q.z - arianna.z), previousSeparation = Math.hypot(p.x - arianna.x, p.z - arianna.z);
          if (separation < 0.43 && separation <= previousSeparation) {
            job.blocked += dt;
            if (job.blocked > 0.45) {
              const obstacle = new BoundingBox15(new Vec329(arianna.x, 0, arianna.z), new Vec329(0.27, 2, 0.27)), planner = new HousePath({ ...this.house, obstacles: [...this.house.obstacles, obstacle] }, 0.18), start = new Vec329(p.x, 0, p.z);
              let path = planner.route(start, job.point);
              if (!path.length) {
                for (let i = 0; i < 16; i++) {
                  const angle = i * Math.PI / 8, escape = new Vec329(p.x + Math.sin(angle) * 0.65, 0, p.z + Math.cos(angle) * 0.65);
                  if (Math.hypot(escape.x - arianna.x, escape.z - arianna.z) < 0.55 || (escape.x - p.x) * (p.x - arianna.x) + (escape.z - p.z) * (p.z - arianna.z) <= 0 || !this.planner.line(start, escape)) continue;
                  const rest = planner.route(escape, job.point);
                  if (rest.length) {
                    path = [escape, ...rest];
                    break;
                  }
                }
              }
              if (path.length) this.route = path;
              job.blocked = 0;
            }
            return;
          }
          if (this.planner.free(q.x, q.z)) {
            this.root.setPosition(q);
            velocity.copy(delta).mulScalar(1.05);
          } else {
            this.route = this.planner.route(new Vec329(p.x, 0, p.z), job.point);
          }
        } else {
          if (!job.wait) {
            this.say(job.icon + "  \u2026");
            this.state = "tornado-thinking";
          }
          job.wait += dt;
          if (job.wait < 1.1) return;
          this.state = "tornado-drop";
          this.animator.playAction("PutDown", 0.8, () => {
            if (this.job !== job || !this.scripted) return;
            this.toy.enabled = false;
            this.carrying = false;
            this.animator.setCarrying(false);
            this.job = null;
            job.drop();
            this.say(job.icon === "\u{1F9FA}" ? "Oops! ALL the toys!" : "Ta-da! Your turn, Ari!");
          }, new Vec329(job.point.x, 0.1, job.point.z + 0.3));
        }
      }
      async load() {
        const config = await (await fetch(assetUrl(`${"/"}assets/characters/arianna/character.json`))).json();
        this.height = config.height * 0.625;
        const asset = new Asset8("Lilah Meshy review", "container", { url: assetUrl(`${"/"}assets/characters/lilah/lilah.glb`) });
        await new Promise((resolve, reject) => {
          asset.once("load", resolve);
          asset.once("error", reject);
          this.app.assets.add(asset);
          this.app.assets.load(asset);
        });
        const resource = asset.resource;
        const model = resource.instantiateRenderEntity({ castShadows: true }), tracks2 = resource.animations.map((a) => a.resource);
        const sleep = sleepingTrack(model, tracks2.find((t) => t.name === "Idle"), await (await fetch(assetUrl("/assets/animations/rest/sleep.json"))).json());
        tracks2.push(sleep, bedEntryTrack(model, tracks2.find((t) => t.name === "Idle"), sleep));
        const manifest = {
          animations: tracks2.map((t) => ({ name: t.name, duration_seconds: t.duration, loop: !["PickUp", "PutDown", "Celebrate", "SleepEnter"].includes(t.name) })),
          scale: { rest_height_m: 1.03 },
          locomotion: { Walk: { travel_speed_mps: 0.7 }, CarryWalk: { travel_speed_mps: 0.7 } },
          interaction_events: { PickUp: [{ time_seconds: 1.1, event: "take-toy" }], PutDown: [{ time_seconds: 1.3, event: "drop-toy" }] },
          action_playback: 3,
          walk_playback: 1
        };
        for (const required of ["Idle", "Walk", "CarryIdle", "CarryWalk", "PickUp", "PutDown", "Celebrate"]) if (!tracks2.some((t) => t.name === required)) throw new Error("Missing Lilah clip " + required);
        const alignment = new Entity30("Lilah ground alignment", this.app);
        this.visual.addChild(alignment);
        alignment.addChild(model);
        model.setLocalScale(this.height / 1.03, this.height / 1.03, this.height / 1.03);
        this.animator.attach(model, tracks2, manifest, this.height / 1.03);
        this.grounding = new CharacterGrounding(this.app.root, this.root, alignment);
        this.loaded = true;
      }
      say(text) {
        this.speech = text;
        this.label.textContent = text;
        this.speechUntil = performance.now() + 2600;
      }
      go(point, purpose) {
        const p = this.root.getPosition().clone();
        p.y = 0;
        this.route = this.planner.route(p, point);
        this.destination = purpose;
        return this.route.length > 0;
      }
      playTogether() {
        if (!this.loaded) return;
        this.route = [];
        this.carrying = false;
        this.toy.enabled = false;
        this.animator.setCarrying(false);
        this.animator.cancelAction();
        this.state = "playing";
        this.say("Again! Again!");
        this.nextMess = this.time + 75;
        this.nextDecision = this.time + 10;
        this.animator.playAction("Celebrate", 1.6);
      }
      restInCrib() {
        this.route = [];
        this.bedStart = null;
        this.animator.cancelAction();
        this.carrying = false;
        this.toy.enabled = false;
        this.animator.setCarrying(false);
        const pose = bedEntry(this.root.getPosition(), 0, true, 1);
        this.root.setPosition(pose.position);
        this.visual.setLocalEulerAngles(0, pose.yaw, 0);
        if (this.grounding) this.grounding.surfaceHeight = pose.height;
        this.animator.setWorkClip(null);
        this.animator.setIdleClip("Sleep");
        this.state = "sleeping";
        this.say("Night night, Ari\u2026");
      }
      decide(arianna) {
        const clock = this.daily.clock;
        if (clock.state.minutes >= 1095) {
          this.state = "sleepy";
          this.say("Sleepy\u2026");
          this.carrying = false;
          this.toy.enabled = false;
          this.animator.setCarrying(false);
          this.go(propPoint("crib", new Vec329(8.55, 0, -1.3)), "bedtime");
          this.nextDecision = this.time + 30;
          return;
        }
        if (Math.random() < 0.55) {
          for (const [x, z] of [[0.9, 0.7], [-0.9, 0.7], [0.9, -0.7], [-0.9, -0.7]]) if (this.go(new Vec329(arianna.x + x, 0, arianna.z + z), "follow")) break;
          this.state = "following";
          this.say(["Ari! Wait for me!", "I do it too!", "Whatcha doing?"][Math.floor(Math.random() * 3)]);
        } else {
          const spots = [[1.1, 1.3], [3.8, 2], [1.4, 5.6], [0.5, 10.8], [4.3, 11.4], [8.4, 0.5]], p = spots[Math.floor(Math.random() * spots.length)];
          this.go(new Vec329(p[0], 0, p[1]), "explore");
          this.state = "exploring";
          this.say("Ooh! What\u2019s that?");
        }
        this.nextDecision = this.time + 12;
      }
      update(dt, elapsed, visible, canMischief, arianna, camera) {
        this.root.enabled = visible && this.loaded;
        this.label.hidden = !this.root.enabled;
        this.daily.lilahAvailable = this.root.enabled && !this.animator.busy && this.state !== "sleeping" && this.state !== "sleepy" && !this.bedStart;
        const target = this.daily.lilahTarget;
        target.anchor.copy(this.root.getPosition());
        target.marker.copy(target.anchor);
        target.marker.y += this.height + 0.08;
        if (!this.root.enabled || document.hidden) return;
        if (this.day !== this.daily.clock.state.day) {
          this.day = this.daily.clock.state.day;
          this.time = 0;
          this.nextMess = 8;
          this.nextDecision = 3;
          this.route = [];
          this.animator.reset();
          this.carrying = false;
          this.toy.enabled = false;
          if (this.grounding) this.grounding.surfaceHeight = null;
          if (this.state === "sleeping" || this.bedStart) this.root.setPosition(propPoint("crib", new Vec329(8.55, 0.09, -1.3)));
          this.bedStart = null;
          this.state = "watching";
        }
        if ((this.state === "sleeping" || this.bedStart) && !this.daily.clock.state.lilahAsleep && this.daily.clock.state.minutes < 1095) {
          this.root.setPosition(propPoint("crib", new Vec329(8.55, 0.09, -1.3)));
          this.state = "watching";
          this.bedStart = null;
          this.animator.setWorkClip(null);
          this.animator.setIdleClip("Idle");
          if (this.grounding) this.grounding.surfaceHeight = null;
        }
        if (this.daily.clock.state.lilahAsleep && this.state !== "sleeping") this.restInCrib();
        if (canMischief) this.time += dt;
        if (!this.scripted && canMischief && this.daily.clock.state.minutes >= 1095 && this.state !== "sleepy" && this.state !== "sleeping" && !this.bedStart) {
          this.route = [];
          this.animator.cancelAction();
          this.decide(arianna);
        }
        const velocity = new Vec329();
        if (this.scripted) this.updateTornado(dt, arianna, velocity);
        else if (this.bedStart) {
          const entry = this.bedStart;
          if (canMischief) entry.elapsed += dt;
          const t = entry.elapsed / BED_ENTRY_SECONDS, pose = bedEntry(entry.position, entry.yaw, true, t);
          this.root.setPosition(pose.position);
          this.visual.setLocalEulerAngles(0, pose.yaw, 0);
          if (this.grounding) this.grounding.surfaceHeight = pose.height;
          if (t >= 1) {
            this.bedStart = null;
            this.state = "sleeping";
            this.animator.setWorkClip(null);
            this.animator.setIdleClip("Sleep");
            this.say("Zzz\u2026");
          }
        } else if (canMischief && !this.animator.busy && this.state !== "sleeping") {
          if (this.route.length) {
            const p2 = this.root.getPosition(), next = this.route[0], dx = next.x - p2.x, dz = next.z - p2.z, distance = Math.hypot(dx, dz);
            if (distance < 1e-4) {
              this.route.shift();
              if (!this.route.length) this.arrive();
            } else {
              const step = Math.min(distance, 0.7 * dt), x = p2.x + dx / distance * step, z = p2.z + dz / distance * step;
              if (Math.hypot(x - arianna.x, z - arianna.z) > 0.4 && this.planner.free(x, z)) {
                this.root.setPosition(x, p2.y, z);
                velocity.set(dx / distance * 0.7, 0, dz / distance * 0.7);
              } else {
                this.route = [];
                this.nextDecision = this.time + 2;
              }
            }
          } else if (this.time >= this.nextDecision) this.decide(arianna);
        }
        this.grounding?.update();
        this.animator.update(dt, velocity, elapsed);
        const p = this.root.getPosition();
        this.visited.add(p.z < 3 ? "bedroom" : p.z < 9 ? "living" : "kitchen");
        const screen = camera.camera.worldToScreen(new Vec329(p.x, p.y + this.height + 0.12, p.z));
        const viewport = document.querySelector("#game").getBoundingClientRect();
        this.label.hidden = performance.now() > this.speechUntil || screen.x < 10 || screen.x > viewport.width - 10 || screen.y < 130 || screen.y > viewport.height - 130;
        this.label.style.transform = `translate(${Math.max(4, Math.min(viewport.width - this.label.offsetWidth - 4, screen.x - this.label.offsetWidth / 2))}px,${screen.y - this.label.offsetHeight}px)`;
      }
      arrive() {
        this.nextDecision = this.time + 7;
        if (this.destination === "mess") {
          this.animator.playAction("PutDown", 0.8, () => {
            const made = this.daily.clock.state.phase !== "night" && this.daily.lilahMesses.add(this.root.getPosition());
            this.carrying = false;
            this.toy.enabled = false;
            this.animator.setCarrying(false);
            this.say(made ? ["Ta-da! I helping!", "Uh-oh. All wet!", "Crumbs are confetti!"][this.daily.lilahMesses.count - 1] : "I did it!");
            this.nextMess = this.time + 50;
            this.state = "proud";
          });
        } else if (this.destination === "bedtime") {
          this.state = "sleepy";
          this.nextDecision = this.time + 30;
          this.say("Tuck me in, Ari?");
        } else {
          this.state = "watching";
          this.say(this.destination === "follow" ? "You\u2019re my favorite, Ari!" : "Ooh\u2026");
        }
      }
      snapshot() {
        return { loaded: this.loaded, height: this.height, position: this.root.getPosition().toArray(), state: this.state, scripted: this.scripted, job: this.job ? { point: this.job.point.toArray(), icon: this.job.icon, wait: this.job.wait } : null, speech: this.speech, carrying: this.carrying, animation: this.animator.snapshot(), visited: [...this.visited], routeLength: this.route.length, time: this.time, nextMess: this.nextMess };
      }
      geometry() {
        return this.animator.geometrySnapshot();
      }
      destroy() {
        this.label.remove();
        this.root.destroy();
      }
    };
  }
});

// src/systems/TornadoRules.ts
function chooseInterruption(random = Math.random()) {
  return random < 0.2 ? "dog" : random < 0.4 ? "basket" : "none";
}
var TORNADO_SECONDS, INTERRUPTIONS, TornadoScore;
var init_TornadoRules = __esm({
  "src/systems/TornadoRules.ts"() {
    "use strict";
    TORNADO_SECONDS = 55;
    INTERRUPTIONS = { dog: { icon: "\u{1F4A9}", bonus: 10 }, basket: { icon: "\u{1F9FA}", bonus: 10 } };
    TornadoScore = class {
      score = 0;
      cleaned = 0;
      streak = 0;
      bestStreak = 0;
      lastClean = -Infinity;
      clean(at, special = "none") {
        this.streak = at - this.lastClean <= 8 ? Math.min(3, this.streak + 1) : 1;
        this.lastClean = at;
        this.bestStreak = Math.max(this.bestStreak, this.streak);
        this.cleaned++;
        const points = 10 + (this.streak - 1) * 2 + (special === "none" ? 0 : INTERRUPTIONS[special].bonus);
        this.score += points;
        return points;
      }
      get stars() {
        return this.score >= 70 ? 3 : this.score >= 30 ? 2 : 1;
      }
      get reward() {
        return this.stars;
      }
    };
  }
});

// src/game/LilahTornado.ts
import { Entity as Entity31, Vec3 as Vec330 } from "playcanvas";
var roomOf, TYPES, get, LilahTornado;
var init_LilahTornado = __esm({
  "src/game/LilahTornado.ts"() {
    "use strict";
    init_HousePath();
    init_primitives();
    init_ActionButton();
    init_PopAudio();
    init_saveId();
    init_TornadoRules();
    roomOf = (p) => p.x > 6.5 ? p.z < 3.6 ? "nursery" : "dad" : p.z < 3.6 ? "bedroom" : p.z < 9.5 ? "living" : p.x > 2.6 ? "laundry" : "kitchen";
    TYPES = [{ name: "Blocks", icon: "\u{1F9F1}" }, { name: "Crayons", icon: "\u{1F58D}\uFE0F" }, { name: "Laundry", icon: "\u{1F455}" }, { name: "Juice spill", icon: "\u{1F9C3}" }, { name: "Toys", icon: "\u{1F9F8}" }];
    get = (id) => document.querySelector(id);
    LilahTornado = class {
      constructor(app, house, props, cleanup, loop, character, controller, camera, lilah) {
        this.app = app;
        this.props = props;
        this.cleanup = cleanup;
        this.loop = loop;
        this.character = character;
        this.controller = controller;
        this.camera = camera;
        this.lilah = lilah;
        this.planner = new HousePath(house, 0.28);
        this.sight = new HousePath(house, 0.04);
        this.launch.id = "tornado-launch";
        this.launch.textContent = "\u{1F32A}\uFE0F Lilah Tornado";
        get("#mission-picker").append(this.launch);
        this.hud.id = "tornado-hud";
        this.hud.hidden = true;
        this.hud.innerHTML = `<header><div><small>TEAM ARIANNA + LILAH</small><h2>Lilah Tornado</h2></div><strong data-time>0:55</strong><button data-sound aria-label="Mute event sounds">\u266B</button></header><div class="tornado-meter-row"><span>\u{1F9FA} Mess meter</span><span data-count>0 / 3</span></div><meter min="0" max="3" value="0" aria-label="Unfinished messes"></meter><div class="tornado-score"><b data-score>0 points</b><b data-streak>Let\u2019s team up!</b></div><p data-notice role="status"></p>`;
        this.overlay.id = "tornado-effects";
        this.dialog.id = "tornado-dialog";
        this.dialog.setAttribute("aria-label", "Lilah Tornado");
        get("#game").append(this.hud, this.overlay, this.dialog);
        this.cloth = primitives(app, props.root)("Tornado cleaning cloth", "box", [0, 0, 0], [0.22, 0.014, 0.17], material("Tornado cloth", "#f9efe1"), false);
        this.cloth.enabled = false;
        this.action = new ActionButton(get("#action-button"), () => this.clean(), () => {
        });
        this.action.enabled = false;
        const signal = this.abort.signal;
        this.launch.addEventListener("click", () => this.open(), { signal });
        this.hud.querySelector("[data-sound]").addEventListener("click", (e) => {
          e.currentTarget.textContent = this.audio.mute() ? "\u266A\u0338" : "\u266B";
        }, { signal });
        this.dialog.addEventListener("cancel", (e) => {
          e.preventDefault();
          if (this.phase === "intro") this.close();
        }, { signal });
        this.dialog.addEventListener("click", (e) => {
          const action = e.target.closest("button")?.dataset.action;
          if (action === "begin") this.begin();
          if (action === "back") this.close();
          if (action === "retry") this.finish();
          if (action === "again" && this.paid) {
            this.close();
            this.open();
          }
        }, { signal });
        document.addEventListener("visibilitychange", () => this.audio.pause(document.hidden), { signal });
      }
      app;
      props;
      cleanup;
      loop;
      character;
      controller;
      camera;
      lilah;
      phase = "idle";
      elapsed = 0;
      score = new TornadoScore();
      round = "";
      paid = false;
      special = "none";
      specialStarted = false;
      created = 0;
      nextDrop = 0;
      messes = [];
      cleaning = null;
      planner;
      sight;
      audio = new PopAudio();
      launch = document.createElement("button");
      hud = document.createElement("section");
      dialog = document.createElement("dialog");
      overlay = document.createElement("div");
      action;
      abort = new AbortController();
      colors = ["#edabbe", "#a5c9e1", "#ecc76c", "#b3c895"].map((c, i) => material("Tornado toy " + i, c));
      juice = material("Tornado juice", "#eeb360");
      cloth;
      spots = [];
      lastSpot = -1;
      notice = "Follow Lilah\u2019s little trail!";
      noticeUntil = 0;
      recentSpots = [];
      lastType = -1;
      dog = null;
      popups = [];
      get active() {
        return this.phase !== "idle";
      }
      get playing() {
        return this.phase === "playing";
      }
      get canMove() {
        return this.playing && (!this.cleaning || this.cleaning.aligning) && !this.character.animator.busy;
      }
      available() {
        return this.loop.mode === "cleanup" && this.cleanup.mode === "day" && this.props.daily.clock.state.phase !== "school" && this.props.daily.clock.state.phase !== "night" && !this.cleanup.carry.item && !this.cleanup.movementLocked && this.lilah.ready && !this.character.placeholder.enabled && !document.querySelector("dialog[open]");
      }
      open(forced) {
        if (this.active || !this.available()) return;
        this.phase = "intro";
        this.special = forced ?? chooseInterruption();
        this.cleanup.setActive(false);
        this.controller.reset();
        this.camera.endChore();
        get("#game").dataset.tornado = "true";
        this.launch.hidden = true;
        this.dialog.innerHTML = `<div class="tornado-emblem">\u{1F32A}\uFE0F</div><small>A LITTLE CHAOS. A LOT OF TEAMWORK.</small><h2>Lilah Tornado</h2><p>Lilah has big ideas! Follow her thought bubbles and help tidy her trail.</p><div class="tornado-instructions"><span>\u{1F463} Move close</span><span>\u2728 Tap Action to tidy</span><span>\u23F1\uFE0F 55 seconds</span></div><p>Clean again within 8 seconds for a streak. Everyone earns a star and allowance!</p><button data-action="begin">Ready, Lilah! \u2192</button><button data-action="back" class="secondary">Maybe later</button>`;
        this.dialog.showModal();
      }
      begin() {
        this.dialog.close();
        this.phase = "playing";
        this.elapsed = 0;
        this.nextDrop = 0.6;
        this.created = 0;
        this.lastSpot = -1;
        this.recentSpots = [];
        this.specialStarted = false;
        this.score = new TornadoScore();
        this.round = saveId();
        this.paid = false;
        this.hud.hidden = false;
        this.action.enabled = true;
        this.notice = "Follow Lilah\u2019s thought bubbles. Tap Action near a mess!";
        this.noticeUntil = 6;
        this.spots = [[1.1, 2.1], [1.1, 4.8], [0.7, 8.1], [0.5, 10.3], [1.8, 11.3], [4.8, 11.5], [3.7, 6.4], [3.8, 2], [8.4, 0.8], [8.1, 7]].map(([x, z]) => new Vec330(x, 0, z)).filter((p) => this.planner.free(p.x, p.z) && this.planner.route(new Vec330(this.character.player.getPosition().x, 0, this.character.player.getPosition().z), p).length > 0);
        this.lilah.beginTornado();
        void this.audio.unlock();
        this.audio.pause(false);
        get("#game-canvas").focus({ preventScroll: true });
      }
      /** Called before movement so daily time and other action listeners cannot compete. */
      beforeMovement(now) {
        if (!this.active) return;
        this.props.daily.pause(now);
        this.cleanup.action.enabled = false;
        this.controller.enabled = this.canMove && !document.hidden;
      }
      update(dt) {
        this.launch.hidden = this.active || this.loop.mode !== "cleanup" || this.cleanup.mode !== "day";
        if (!this.active) {
          this.launch.disabled = !this.available();
          this.launch.title = this.cleanup.carry.item ? "Put your item away first." : "A 55-second family cleanup game";
          return;
        }
        this.action.enabled = this.playing && !this.loop.developerPaused && !document.hidden;
        if (!this.playing) return;
        if (document.hidden) return;
        this.elapsed += dt;
        if (this.elapsed >= TORNADO_SECONDS) {
          this.finish();
          return;
        }
        if (!this.lilah.working && this.elapsed >= this.nextDrop && this.messes.length < 3) {
          const position = this.lilah.root.getPosition();
          const candidates = this.spots.map((p, i) => ({ p, i, d: Math.hypot(p.x - position.x, p.z - position.z) })).filter((v) => v.i !== this.lastSpot && v.d > 0.8 && v.d < 12 && !this.messes.some((m) => m.point.distance(v.p) < 1));
          const room = roomOf(position);
          candidates.sort((a, b) => Number(roomOf(a.p) === room) - Number(roomOf(b.p) === room) || Number(this.recentSpots.includes(a.i)) - Number(this.recentSpots.includes(b.i)) || a.d - b.d);
          const otherRooms = candidates.filter((c) => roomOf(c.p) !== room);
          if (otherRooms.length) {
            const nearby = otherRooms.filter((c) => c.d < otherRooms[0].d + 3);
            const chosen = nearby[Math.floor(Math.random() * nearby.length)];
            candidates.splice(candidates.indexOf(chosen), 1);
            candidates.unshift(chosen);
          }
          const spot = candidates[0];
          if (spot) {
            const basket = this.special === "basket" && !this.specialStarted && this.elapsed > 14, type = (this.lastType + 1 + Math.floor(Math.random() * (TYPES.length - 1))) % TYPES.length;
            this.lastType = type;
            if (this.lilah.visitForMess(spot.p, basket ? "\u{1F9FA}" : TYPES[type].icon, () => {
              if (!this.playing) return;
              this.spawn(spot.p, type, basket ? "basket" : "none");
              this.nextDrop = this.elapsed + 1.1;
            })) {
              this.lastSpot = spot.i;
              this.recentSpots.push(spot.i);
              this.recentSpots = this.recentSpots.slice(-3);
              if (basket) this.specialStarted = true;
            }
          }
          this.nextDrop = this.elapsed + 1;
        }
        if (this.special === "dog" && !this.specialStarted && this.elapsed > 17 && this.messes.length < 2 && !this.dog) {
          this.startDog();
        }
        this.updateDog(dt);
        if (this.cleaning && !this.cleaning.aligning) {
          const job = this.cleaning;
          job.elapsed += dt;
          const progress = Math.min(1, job.elapsed / 1.45);
          job.mess.label.hidden = true;
          job.mess.root.children.forEach((child, i) => {
            child.enabled = i >= Math.floor(progress * job.mess.root.children.length);
          });
          if (job.mess.type === 3) {
            this.cloth.enabled = true;
            this.cloth.setPosition(this.cleanup.carry.socket.getPosition());
          }
          if (progress >= 1) {
            this.complete(job.mess);
            this.cleaning = null;
            this.cloth.enabled = false;
            this.character.animator.setWorkClip(null);
            this.camera.endChore();
          }
        }
        this.paint();
      }
      spawn(point, type, special) {
        if (this.messes.length >= 3) return;
        const root = new Entity31("Tornado " + (special === "none" ? TYPES[type].name : special), this.app);
        this.props.root.addChild(root);
        root.setPosition(point.x, 0.06, point.z);
        const shape = primitives(this.app, root), n = special === "basket" ? 12 : type === 3 ? 5 : 6;
        if (special === "dog") {
          const poop = this.props.pet.poop.clone();
          root.addChild(poop);
          poop.setLocalPosition(0, 0, 0);
          poop.enabled = true;
        } else for (let i = 0; i < n; i++) {
          const x = Math.sin(i * 2.4) * 0.26, z = Math.cos(i * 2.4) * 0.22;
          const part = shape("Mess piece", type === 3 ? "sphere" : type === 1 ? "cylinder" : "box", [x, type === 3 ? 0.02 : 0.07, z], type === 3 ? [0.35, 0.025, 0.27] : type === 1 ? [0.04, 0.23, 0.04] : type === 2 ? [0.19, 0.04, 0.16] : [0.13, 0.13, 0.13], type === 3 ? this.juice : this.colors[i % 4], false);
          if (type === 1) part.setLocalEulerAngles(90, 0, i * 38);
        }
        if (special === "basket") {
          const basket = shape("Empty toy basket", "box", [0.35, 0.14, 0], [0.24, 0.26, 0.33], this.colors[3], false);
          basket.setLocalEulerAngles(0, 0, 65);
        }
        const label = document.createElement("div");
        label.className = "tornado-marker";
        label.textContent = special === "dog" ? "\u{1F4A9} +10" : special === "basket" ? "\u{1F9FA} +10" : TYPES[type].icon;
        this.overlay.append(label);
        this.messes.push({ id: ++this.created, root, point: point.clone(), type, special, label, born: this.elapsed });
        this.audio.power(special === "none" ? "bomb" : "mega");
        this.notice = special === "dog" ? "Arianna: \u201CThat is NOT a toy, buddy!\u201D \u{1F4A9}" : special === "basket" ? "Lilah: \u201CThe basket sneezed!\u201D \u{1F9FA}" : "Lilah: \u201CTa-da! I made a little something!\u201D";
        this.noticeUntil = this.elapsed + 3;
      }
      focus() {
        const p = this.character.player.getPosition();
        return this.messes.filter((m) => Math.hypot(p.x - m.point.x, p.z - m.point.z) < 1.15 && this.sight.line(new Vec330(p.x, 0, p.z), m.point)).sort((a, b) => a.point.distance(p) - b.point.distance(p))[0];
      }
      clean() {
        if (!this.playing || this.cleaning || this.character.animator.busy) return;
        const mess = this.focus();
        if (!mess) return;
        this.cleaning = { mess, elapsed: 0, aligning: true };
        this.controller.enabled = true;
        this.controller.approachProp(mess.point, () => {
          if (!this.playing || !this.cleaning) return;
          this.cleaning.aligning = false;
          this.camera.beginChore(this.character.player.getPosition(), mess.point);
          if (mess.type === 3) this.character.animator.setWorkClip("Wipe", mess.point);
          else this.character.animator.playAction("PickUp", 0.8, void 0, mess.point);
          this.audio.select(1);
        }, () => {
          this.cleaning = null;
        });
      }
      complete(mess) {
        const points = this.score.clean(this.elapsed, mess.special);
        mess.root.destroy();
        mess.label.remove();
        this.messes = this.messes.filter((m) => m !== mess);
        this.audio.pop(this.score.streak * 3);
        this.notice = this.score.streak > 1 ? `CLEAN STREAK \xD7${this.score.streak} \xB7 +${points}` : `Lovely helping! +${points}`;
        this.noticeUntil = this.elapsed + 2.5;
        const element = document.createElement("div");
        element.className = "tornado-sparkles";
        element.textContent = `\u2726 +${points} \u2726`;
        this.overlay.append(element);
        this.popups.push({ element, point: mess.point.clone(), until: this.elapsed + 1 });
      }
      startDog() {
        const pet = this.props.pet;
        if (!pet.loaded) return;
        const p = pet.dog.getPosition(), point = this.spots.filter((v) => !this.messes.some((m) => m.point.distance(v) < 1)).sort((a, b) => a.distance(p) - b.distance(p))[0];
        if (!point) return;
        const path = this.planner.route(new Vec330(p.x, 0, p.z), point);
        if (!path.length) {
          this.specialStarted = true;
          return;
        }
        this.specialStarted = true;
        this.dog = { home: p.clone(), angles: pet.dog.getEulerAngles().clone(), route: path, point: point.clone(), wait: 0 };
        this.notice = "\u{1F43E} A very innocent walk\u2026";
        this.noticeUntil = this.elapsed + 4;
      }
      updateDog(dt) {
        const dog = this.dog;
        if (!dog || dog.wait < 0 && !dog.route.length) return;
        const root = this.props.pet.dog;
        if (dog.route.length) {
          const p = root.getPosition(), next = dog.route[0], delta = new Vec330(next.x - p.x, 0, next.z - p.z), distance = delta.length();
          if (distance < 0.04) {
            dog.route.shift();
            return;
          }
          delta.normalize();
          root.setPosition(p.x + delta.x * Math.min(distance, dt * 0.3), 0.04, p.z + delta.z * Math.min(distance, dt * 0.3));
          root.setEulerAngles(0, Math.atan2(delta.x, delta.z) * 180 / Math.PI, 0);
        } else {
          dog.wait += dt;
          if (dog.wait > 1.2 && this.messes.length < 3) {
            root.setPosition(dog.point.x, 0.04, dog.point.z);
            this.spawn(dog.point, 0, "dog");
            dog.wait = -1;
            dog.route = this.planner.route(dog.point, new Vec330(dog.home.x, 0, dog.home.z));
          }
        }
      }
      paint() {
        const nearest = this.focus(), button2 = get("#action-button");
        button2.disabled = !!this.cleaning || !nearest;
        button2.dataset.target = nearest ? "tornado-" + nearest.id : "";
        get("#action-title").textContent = this.cleaning ? "Tidying\u2026" : nearest ? "Clean up" : "Follow Lilah";
        get("#action-detail").textContent = this.cleaning ? "You\u2019ve got this!" : nearest ? nearest.special === "none" ? TYPES[nearest.type].name : "Bonus cleanup" : "Find her little trail";
        get("#action-icon").textContent = nearest ? TYPES[nearest.type].icon : "\u{1F32A}\uFE0F";
        const progress = this.cleaning && !this.cleaning.aligning ? this.cleaning.elapsed / 1.45 : 0;
        button2.style.setProperty("--hold-progress", `${progress * 360}deg`);
        button2.classList.toggle("holding", progress > 0);
        const set = (selector, value) => {
          const node = this.hud.querySelector(selector);
          if (node.textContent !== value) node.textContent = value;
        };
        set("[data-time]", `0:${String(Math.ceil(TORNADO_SECONDS - this.elapsed)).padStart(2, "0")}`);
        set("[data-count]", `${this.messes.length} / 3`);
        this.hud.querySelector("meter").value = this.messes.length;
        set("[data-score]", `${this.score.score} points`);
        set("[data-streak]", this.score.streak > 1 && this.elapsed - this.score.lastClean <= 8 ? `CLEAN STREAK \xD7${this.score.streak}` : "Little hands. Big help.");
        set("[data-notice]", this.elapsed < this.noticeUntil ? this.notice : this.messes.length === 3 ? "Lilah takes a breather. Pick any mess!" : "\u{1F463} Follow Lilah \xB7 \u2728 Tap Action to tidy");
        const bounds = get("#game").getBoundingClientRect();
        for (const m of this.messes) {
          const p = this.camera.entity.camera.worldToScreen(new Vec330(m.point.x, 0.4, m.point.z)), x = Math.max(24, Math.min(bounds.width - 24, p.x)), y = Math.max(this.hud.offsetTop + this.hud.offsetHeight + 40, Math.min(bounds.height - 180, p.y));
          m.label.classList.toggle("near", m === nearest);
          m.label.style.transform = `translate(${x}px,${y}px) translate(-50%,-100%)`;
          m.label.classList.toggle("edge", x !== p.x || y !== p.y);
          m.label.style.setProperty("--angle", `${Math.atan2(p.y - y, p.x - x)}rad`);
        }
        this.popups = this.popups.filter((p) => {
          if (this.elapsed > p.until) {
            p.element.remove();
            return false;
          }
          const v = this.camera.entity.camera.worldToScreen(p.point);
          p.element.style.left = v.x + "px";
          p.element.style.top = v.y + "px";
          return true;
        });
      }
      clearScene() {
        this.cleaning = null;
        this.controller.reset();
        this.character.animator.cancelAction();
        this.character.animator.setWorkClip(null);
        this.camera.endChore();
        this.cloth.enabled = false;
        this.lilah.endTornado();
        for (const m of this.messes) {
          m.root.destroy();
          m.label.remove();
        }
        this.messes = [];
        if (this.dog) {
          this.props.pet.dog.setPosition(this.dog.home);
          this.props.pet.dog.setEulerAngles(this.dog.angles);
          this.dog = null;
        }
        for (const p of this.popups) p.element.remove();
        this.popups = [];
      }
      finish() {
        if (this.phase !== "playing" && this.phase !== "result") return;
        if (this.phase === "playing") {
          this.phase = "result";
          this.elapsed = TORNADO_SECONDS;
          this.action.enabled = false;
          this.clearScene();
          this.audio.celebrate();
        }
        let error = "";
        try {
          if (!this.paid) {
            this.loop.save.creditRound(this.round, this.score.reward);
            this.paid = true;
          }
        } catch {
          error = "Your reward is ready, but saving failed. Retry before leaving.";
        }
        this.dialog.innerHTML = `<div class="tornado-stars">${"\u2605".repeat(this.score.stars)}${"\u2606".repeat(3 - this.score.stars)}</div><small>LILAH TORNADO \xB7 ALL DONE!</small><h2>${this.score.stars === 3 ? "House hero!" : this.score.stars === 2 ? "Super helper!" : "A little help, a big smile!"}</h2><p>Lilah: \u201CWe make a good team, Ari!\u201D</p><div class="tornado-totals"><span><b>${this.score.score}</b>points</span><span><b>${this.score.cleaned}</b>tidied</span><span><b>\xD7${this.score.bestStreak}</b>best streak</span></div><p class="tornado-earned">${this.paid ? `+$${this.score.reward} saved \xB7 wallet $${this.loop.save.data.balance}` : error}</p>${this.paid ? '<button data-action="again">Play together again \u21BB</button><button data-action="back" class="secondary">Back to the house</button>' : '<button data-action="retry">Retry saving reward</button>'}`;
        if (!this.dialog.open) this.dialog.showModal();
      }
      close() {
        if (this.phase === "result" && !this.paid) return;
        this.clearScene();
        this.phase = "idle";
        this.hud.hidden = true;
        this.dialog.close();
        this.action.enabled = false;
        this.audio.stop();
        delete get("#game").dataset.tornado;
        this.cleanup.setActive(this.loop.mode === "cleanup");
        this.props.daily.pause(performance.now());
        get("#wallet").textContent = "$" + this.loop.save.data.balance;
        get("#action-button").classList.remove("holding");
      }
      pause(paused) {
        this.audio.pause(paused);
        this.action.enabled = !paused && this.playing;
        if (!paused && this.cleaning && !this.cleaning.aligning) {
          this.camera.beginChore(this.character.player.getPosition(), this.cleaning.mess.point);
          if (this.cleaning.mess.type === 3) this.character.animator.setWorkClip("Wipe", this.cleaning.mess.point);
        }
      }
      snapshot() {
        return { phase: this.phase, elapsed: this.elapsed, score: this.score.score, cleaned: this.score.cleaned, streak: this.score.streak, bestStreak: this.score.bestStreak, stars: this.score.stars, reward: this.score.reward, paid: this.paid, special: this.special, specialStarted: this.specialStarted, created: this.created, cleaning: this.cleaning?.mess.id, aligning: this.cleaning?.aligning, spots: this.spots.map((p) => p.toArray()), messes: this.messes.map((m) => ({ id: m.id, point: m.point.toArray(), type: m.type, special: m.special })), audio: this.audio.snapshot() };
      }
      destroy() {
        this.clearScene();
        this.abort.abort();
        this.action.destroy();
        this.audio.destroy();
        this.launch.remove();
        this.hud.remove();
        this.overlay.remove();
        this.dialog.remove();
        this.cloth.destroy();
        for (const m of this.colors) m.destroy();
        this.juice.destroy();
      }
    };
  }
});

// src/game/FamilyDinner.ts
import { Asset as Asset9, BoundingBox as BoundingBox16, Entity as Entity32, Vec3 as Vec331 } from "playcanvas";
var FamilyDinner;
var init_FamilyDinner = __esm({
  "src/game/FamilyDinner.ts"() {
    "use strict";
    init_AssetUrls();
    init_PropSpace();
    init_HousePath();
    init_primitives();
    FamilyDinner = class {
      constructor(app, house, daily, root, visual, animator, say) {
        this.app = app;
        this.house = house;
        this.daily = daily;
        this.root = root;
        this.visual = visual;
        this.animator = animator;
        this.say = say;
        this.planner = new HousePath(house, 0.25);
        this.socket = new Entity32("Dad serving hands", app);
        visual.addChild(this.socket);
        animator.bindCarrySocket(this.socket);
        this.tray = new Entity32("Family dinner", app);
        house.root.addChild(this.tray);
        this.tray.enabled = false;
        primitives(app, this.tray)("Dinner platter", "cylinder", [0, 0, 0], [0.72, 0.025, 0.58], material("Dinner china", "#fff2d9"), false);
        void Promise.all(["pizza", "taco", "turkey"].map(async (name) => {
          const a = new Asset9("Family " + name, "container", { url: assetUrl(`/assets/food/${name}.glb`) });
          app.assets.add(a);
          await new Promise((resolve, reject) => {
            a.once("load", resolve);
            a.once("error", reject);
            app.assets.load(a);
          });
          const model = a.resource.instantiateRenderEntity({ castShadows: true }), bounds = new BoundingBox16();
          let first = true;
          for (const r of model.findComponents("render")) for (const m of r.meshInstances) {
            if (first) {
              bounds.copy(m.aabb);
              first = false;
            } else bounds.add(m.aabb);
          }
          const scale = 0.57 / (bounds.halfExtents.x * 2);
          model.setLocalScale(scale, scale, scale);
          model.setLocalPosition(-bounds.center.x * scale, 0.02 - (bounds.center.y - bounds.halfExtents.y) * scale, -bounds.center.z * scale);
          model.name = name;
          this.tray.addChild(model);
          model.enabled = false;
          return model;
        })).then((models) => {
          this.models = models;
          this.ready = true;
        }).catch((e) => console.error("Dinner models failed", e));
      }
      app;
      house;
      daily;
      root;
      visual;
      animator;
      say;
      tray;
      socket;
      models = [];
      ready = false;
      day = 0;
      stage = "idle";
      route = [];
      goal = new Vec331();
      timer = 0;
      blocked = 0;
      retry = 0;
      planner;
      serving = "pizza";
      table() {
        this.tray.reparent(this.house.root);
        this.tray.setPosition(propPoint("dining", new Vec331(0.55, 0.99, 14.35)));
        this.tray.setEulerAngles(0, propYaw("dining", 0), 0);
        this.tray.enabled = true;
      }
      go(p, stage) {
        const at = this.root.getPosition();
        this.goal.copy(p);
        this.route = this.planner.route(new Vec331(at.x, 0, at.z), p);
        this.stage = stage;
        this.blocked = 0;
        return this.route.length > 0;
      }
      finish() {
        this.stage = "idle";
        this.route = [];
        this.animator.setCarrying(false);
        this.animator.setIdleClip("Idle");
        this.animator.cancelAction();
        this.animator.faceTowards(null);
        this.retry = 15;
      }
      get active() {
        return this.stage !== "idle";
      }
      due() {
        const s = this.daily.clock.state;
        return this.ready && !s.dinnerServed && s.phase === "afternoon" && s.minutes >= 930 + s.day * 37 % 90 && s.minutes < 1140 && this.retry <= 0;
      }
      update(dt, canStart, people, velocity) {
        const s = this.daily.clock.state;
        this.retry = Math.max(0, this.retry - dt);
        if (this.day !== s.day) {
          this.day = s.day;
          this.finish();
          this.retry = 0;
          this.tray.enabled = false;
          this.serving = ["pizza", "taco", "turkey"][(s.day - 1) % 3];
          this.models.forEach((m) => m.enabled = m.name === this.serving);
          if (s.dinnerServed) this.table();
        }
        if (!this.ready) return false;
        this.models.forEach((m) => m.enabled = m.name === this.serving);
        if (this.stage === "idle") {
          if (s.dinnerServed && !this.tray.enabled) this.table();
          if (!canStart || !this.due()) return false;
          if (!this.go(propPoint("fridge", new Vec331(-1.65, 0, 14.55)), "fetch")) {
            this.finish();
            return false;
          }
          this.say(["I\u2019ll put some pizza out for us.", "Taco night! I\u2019ll set the table.", "Something warm for dinner today."][(s.day - 1) % 3]);
        }
        if (["fetch", "carry", "seat"].includes(this.stage)) {
          const p = this.root.getPosition(), next = this.route[0];
          if (next) {
            const delta = new Vec331(next.x - p.x, 0, next.z - p.z), distance = delta.length(), step = Math.min(distance, dt * 1.05);
            delta.normalize();
            const q = p.clone().add(delta.clone().mulScalar(step));
            if (people.some((v) => Math.hypot(v.x - q.x, v.z - q.z) < 0.6) || !this.planner.free(q.x, q.z)) {
              this.blocked += dt;
              if (this.blocked > 3) {
                this.route = this.planner.route(new Vec331(p.x, 0, p.z), this.goal);
                this.blocked = 0;
              }
              return true;
            }
            this.root.setPosition(q.x, 0.09, q.z);
            if (dt > 0) velocity.copy(delta).mulScalar(step / dt);
            if (distance <= step + 0.01) this.route.shift();
            return true;
          }
          if (Math.hypot(p.x - this.goal.x, p.z - this.goal.z) > 0.5) {
            this.tray.enabled = !!s.dinnerServed;
            this.finish();
            return false;
          }
          if (this.stage === "fetch") {
            this.stage = "pickup";
            this.timer = 1.4;
            this.animator.setIdleClip("Cleaning");
            this.animator.faceTowards(propPoint("fridge", new Vec331(-2.65, 1, 14.55)));
          } else if (this.stage === "carry") {
            this.stage = "place";
            this.timer = 1.1;
            this.animator.faceTowards(propPoint("dining", new Vec331(0.55, 1, 13.85)));
          } else {
            this.stage = "sitting";
            this.timer = 1.3;
            this.visual.setLocalEulerAngles(0, propYaw("dining", 180), 0);
            this.animator.setIdleClip("SitIdle");
            this.animator.playAction("SitDown", 1.3);
          }
        } else {
          this.timer -= dt;
          if (this.stage === "sitting" || this.stage === "standing") {
            const down = this.stage === "sitting", t = Math.max(0, Math.min(1, 1 - this.timer / (down ? 1.3 : 1.2))), z = down ? 15.65 - 0.55 * t : 15.1 + 0.55 * t;
            this.root.setPosition(propPoint("dining", new Vec331(0.55, 0.09, z)));
          }
          if (this.timer > 0) return true;
          if (this.stage === "pickup") {
            this.animator.faceTowards(null);
            this.animator.setIdleClip("Idle");
            this.animator.setCarrying(true);
            this.tray.reparent(this.socket);
            this.tray.setLocalPosition(0, 0.035, 0.06);
            this.tray.setLocalEulerAngles(0, 0, 0);
            this.tray.enabled = true;
            if (!this.go(propPoint("dining", new Vec331(0.55, 0, 15.65)), "carry")) {
              this.tray.enabled = false;
              this.finish();
            }
          } else if (this.stage === "place") {
            this.animator.setCarrying(false);
            this.animator.faceTowards(null);
            this.table();
            s.dinnerServed = true;
            this.daily.save();
            this.say("Dinner is ready whenever you are, sweetie.");
            this.stage = "sitting";
            this.timer = 1.3;
            this.visual.setLocalEulerAngles(0, propYaw("dining", 180), 0);
            this.animator.setIdleClip("SitIdle");
            this.animator.playAction("SitDown", 1.3);
          } else if (this.stage === "sitting") {
            this.stage = "seated";
            this.timer = 12 + s.day % 4 * 2;
            this.root.setPosition(propPoint("dining", new Vec331(0.55, 0.09, 15.1)));
          } else if (this.stage === "seated") {
            this.stage = "standing";
            this.timer = 1.2;
            this.animator.setIdleClip("Idle");
            this.animator.playAction("StandUp", 1.2);
          } else if (this.stage === "standing") {
            this.root.setPosition(propPoint("dining", new Vec331(0.55, 0.09, 15.65)));
            this.finish();
            return false;
          }
        }
        return true;
      }
      snapshot() {
        return { ready: this.ready, stage: this.stage, food: this.serving, served: !!this.daily.clock.state.dinnerServed, position: this.tray.getPosition().toArray(), visible: this.tray.enabled, route: this.route.map((p) => p.toArray()) };
      }
      destroy() {
        this.tray.destroy();
        this.socket.destroy();
      }
    };
  }
});

// src/game/Marc.ts
import { Asset as Asset10, AnimData as AnimData4, AnimTrack as AnimTrack4, Entity as Entity33, Quat as Quat5, Vec3 as Vec332 } from "playcanvas";
var SEAT, YAW, FORWARD, ENTRY, SEATED, PATROL, REMARKS, Marc;
var init_Marc = __esm({
  "src/game/Marc.ts"() {
    "use strict";
    init_FamilyDinner();
    init_PropSpace();
    init_AssetUrls();
    init_CharacterAnimator();
    init_CharacterGrounding();
    init_HousePath();
    init_house();
    init_primitives();
    SEAT = new Vec332(4.5, 0, 7.35);
    YAW = -35;
    FORWARD = new Vec332(Math.sin(YAW * Math.PI / 180), 0, Math.cos(YAW * Math.PI / 180));
    ENTRY = SEAT.clone().add(FORWARD.clone().mulScalar(1.02));
    SEATED = SEAT.clone().add(FORWARD.clone().mulScalar(0.28));
    PATROL = [[8.4, 0.5], [8.1, 9.6], [0.4, 11.2], [3.8, 2], [1.25, 5.6]];
    REMARKS = ["Need a hand, sweetie?", "I came. I saw. I stepped on a block.", "Sweetie, is this a house or a tiny toy museum?", "My coffee has been reheated three times. A new record.", "The laundry and I are in a long-term relationship.", "Nice collecting, sweetie. I collect missing socks."];
    Marc = class {
      constructor(app, house, daily) {
        this.app = app;
        this.house = house;
        this.daily = daily;
        this.root = new Entity33("Marc", app);
        app.root.addChild(this.root);
        this.root.setPosition(3.5, 0.09, 6.2);
        this.visual = new Entity33("Marc visual", app);
        this.root.addChild(this.visual);
        const placeholder = new Entity33("Marc loading", app);
        this.visual.addChild(placeholder);
        this.animator = new CharacterAnimator(this.visual, placeholder);
        this.planner = new HousePath(house, 0.25);
        this.dinner = new FamilyDinner(app, house, daily, this.root, this.visual, this.animator, (text) => this.say(text));
        this.label.id = "marc-label";
        this.label.className = "lilah-label marc-label";
        this.label.hidden = true;
        document.querySelector("#game").append(this.label);
        const colors = ["#cda678", "#c5d9dd", "#b8c39d"];
        for (let i = 0; i < 3; i++) {
          const tool = new Entity33(["Marc toy tidy", "Marc wiping cloth", "Marc crumb brush"][i], app);
          this.root.addChild(tool);
          const shape = primitives(app, tool);
          shape("Dad cleanup tool", "box", [0, 0, 0], i === 0 ? [0.25, 0.16, 0.23] : i === 1 ? [0.3, 0.025, 0.23] : [0.3, 0.07, 0.13], material("Dad tool " + i, colors[i]));
          if (i === 2) shape("Brush handle", "capsule", [0, 0.18, 0], [0.055, 0.35, 0.055], material("Brush wood", "#ac8158"));
          tool.enabled = false;
          this.tools.push(tool);
        }
        void this.load().catch((error) => console.error("Marc could not load:", error));
      }
      app;
      house;
      daily;
      root;
      visual;
      animator;
      grounding = null;
      planner;
      dinner;
      label = document.createElement("div");
      tools = [];
      route = [];
      loaded = false;
      height = 1.798485;
      state = "idle";
      purpose = "seat";
      time = 0;
      until = 1;
      transitionStart = 0;
      day = 0;
      target = null;
      seen = /* @__PURE__ */ new Map();
      speech = "";
      speechUntil = 0;
      nextSpeech = 6;
      lineIndex = 0;
      patrolIndex = 0;
      cleaned = 0;
      standCount = 0;
      sitCount = 0;
      visited = /* @__PURE__ */ new Set();
      velocity = new Vec332();
      blockedFor = 0;
      nextScan = 0;
      async load() {
        const config = await (await fetch(assetUrl(`${"/"}assets/characters/arianna/character.json`))).json();
        this.height = config.height * 1.3;
        const asset = new Asset10("Marc animation v2", "container", { url: assetUrl(`${"/"}assets/characters/marc/marc.glb`) });
        await new Promise((resolve, reject) => {
          asset.once("load", resolve);
          asset.once("error", reject);
          this.app.assets.add(asset);
          this.app.assets.load(asset);
        });
        const resource = asset.resource;
        const model = resource.instantiateRenderEntity({ castShadows: true }), source = resource.animations.map((a) => a.resource);
        const required = (name) => {
          const track = source.find((t) => t.name === name);
          if (!track) throw Error("Missing Marc clip " + name);
          return track;
        };
        for (const name of ["SitDown", "SitIdle", "StandUp", "Idle", "Walk_Basic"]) required(name);
        const walk = required("Walk_Basic"), idle = required("Idle");
        const tracks2 = [...source, new AnimTrack4("Walk", walk.duration, walk.inputs, walk.outputs, walk.curves)];
        const carry = required("CarryWalk"), carryOutputs = carry.outputs.map((o) => new AnimData4(o.components, Array.from(o.data, (v, i) => o.data[i % o.components])));
        tracks2.push(new AnimTrack4("CarryIdle", carry.duration, carry.inputs, carryOutputs, carry.curves));
        const outputs = idle.outputs.map((o) => new AnimData4(o.components, Array.from(o.data)));
        for (const curve of idle.curves) {
          const paths = curve.paths;
          if (paths.some((p) => p.entityPath.at(-1) === "Spine02" && p.propertyPath[0] === "localRotation")) {
            const data = outputs[curve.output].data;
            for (let i = 0; i < data.length; i += 4) {
              const q = new Quat5(data[i], data[i + 1], data[i + 2], data[i + 3]).mul(new Quat5().setFromEulerAngles(24, 0, 0));
              data[i] = q.x;
              data[i + 1] = q.y;
              data[i + 2] = q.z;
              data[i + 3] = q.w;
            }
          }
        }
        tracks2.push(new AnimTrack4("Cleaning", idle.duration, idle.inputs, outputs, idle.curves));
        const manifest = { animations: tracks2.map((t) => ({ name: t.name, duration_seconds: t.duration, loop: !["SitDown", "StandUp"].includes(t.name) })), locomotion: { Walk: { travel_speed_mps: 1.2 }, CarryWalk: { travel_speed_mps: 1.05 } }, interaction_events: {}, scale: { rest_height_m: 1.8 }, hand_joints: ["LeftHand", "RightHand"], walk_playback: 1 };
        const alignment = new Entity33("Marc ground alignment", this.app);
        this.visual.addChild(alignment);
        alignment.addChild(model);
        model.setLocalScale(this.height / 1.8, this.height / 1.8, this.height / 1.8);
        this.animator.attach(model, tracks2, manifest, this.height / 1.8);
        this.grounding = new CharacterGrounding(this.house.root, this.root, alignment);
        this.loaded = true;
      }
      say(text) {
        this.speech = text;
        this.label.textContent = text;
        this.speechUntil = performance.now() + 3800;
        this.nextSpeech = this.time + 24;
      }
      go(point, purpose) {
        const start = this.root.getPosition().clone();
        start.y = 0;
        this.route = this.planner.route(start, point);
        this.purpose = purpose;
        if (this.route.length) {
          this.state = "walking";
          this.animator.setIdleClip("Idle");
          return true;
        }
        return false;
      }
      mess() {
        return this.daily.lilahMesses.snapshot().messes.find((m) => m.id === this.target && !m.done);
      }
      approachMess() {
        const m = this.mess();
        if (!m) return false;
        const p = this.root.getPosition(), candidates = [];
        for (const radius of [0.65, 0.85]) for (let i = 0; i < 12; i++) {
          const a = i * Math.PI / 6, v = new Vec332(m.x + Math.cos(a) * radius, 0, m.z + Math.sin(a) * radius);
          if (this.planner.free(v.x, v.z)) candidates.push(v);
        }
        candidates.sort((a, b) => a.distance(p) - b.distance(p));
        for (const point of candidates) if (this.go(point, "mess")) return true;
        return false;
      }
      stand() {
        this.state = "standing-up";
        this.transitionStart = this.time;
        this.until = this.time + 1;
        this.animator.setIdleClip("Idle");
        this.animator.playAction("StandUp", 1);
        this.standCount++;
      }
      settle() {
        this.state = "idle";
        this.until = this.time + 4;
        this.target = null;
        this.animator.setIdleClip("Idle");
        this.animator.faceTowards(null);
        this.tools.forEach((t) => t.enabled = false);
      }
      update(dt, elapsed, visible, active, arianna, lilah, playerTarget, camera) {
        this.root.enabled = visible && this.loaded;
        this.label.hidden = true;
        if (!this.root.enabled || document.hidden) return;
        if (!active) {
          this.animator.update(0, new Vec332(), Math.max(elapsed, 1e-3));
          return;
        }
        this.time += dt;
        this.velocity.set(0, 0, 0);
        if (this.day !== this.daily.clock.state.day) {
          this.day = this.daily.clock.state.day;
          this.seen.clear();
          this.target = null;
          if (this.state === "cleaning") this.settle();
        }
        if (this.dinner.due() && !this.target && this.state === "seated") this.stand();
        const dining = this.dinner.update(dt, !this.target && ["idle", "walking"].includes(this.state) && !this.animator.busy, [arianna, lilah], this.velocity);
        if (dining) {
          this.route = [];
          this.state = "idle";
          this.target = null;
          this.until = this.time + 4;
          this.tools.forEach((t) => t.enabled = false);
        } else {
          const messes = this.daily.lilahMesses.snapshot().messes;
          for (const m2 of messes) if (!this.seen.has(m2.id)) this.seen.set(m2.id, this.time);
          const eligible = () => messes.find((m2) => !m2.done && m2.id !== playerTarget && Math.hypot(m2.x - arianna.x, m2.z - arianna.z) > 1.65 && this.time - (this.seen.get(m2.id) ?? this.time) > 8);
          if (!this.target && this.time >= this.nextScan && this.state !== "sitting-down" && this.state !== "standing-up") {
            this.nextScan = this.time + 1;
            const m2 = eligible();
            if (m2) {
              this.target = m2.id;
              if (this.state === "seated") {
                this.say("Just sat down. The tiny boss has other plans!");
                this.stand();
              } else if (!this.approachMess()) this.target = null;
            }
          }
          const m = this.mess();
          if (this.target && this.state !== "standing-up" && (!m || playerTarget === this.target || Math.hypot(m.x - arianna.x, m.z - arianna.z) < 1.35)) {
            this.route = [];
            if (m && playerTarget === this.target) this.say("You\u2019ve got this, sweetie. I\u2019ll be over here.");
            this.settle();
          }
          if (this.state === "walking") {
            const p2 = this.root.getPosition(), next = this.route[0];
            if (!next) {
              this.state = "idle";
              this.until = this.time;
            } else {
              const dx = next.x - p2.x, dz = next.z - p2.z, distance = Math.hypot(dx, dz), step = Math.min(distance, 1.2 * dt);
              const x = p2.x + dx / Math.max(distance, 1e-3) * step, z = p2.z + dz / Math.max(distance, 1e-3) * step;
              if (Math.hypot(x - arianna.x, z - arianna.z) > 0.6 && Math.hypot(x - lilah.x, z - lilah.z) > 0.48 && this.planner.free(x, z)) {
                this.blockedFor = 0;
                if (dt > 0) this.velocity.set((x - p2.x) / dt, 0, (z - p2.z) / dt);
                this.root.setPosition(x, p2.y, z);
                if (distance <= step + 1e-5) {
                  this.route.shift();
                  if (!this.route.length) {
                    if (this.purpose === "seat") {
                      this.state = "sitting-down";
                      this.transitionStart = this.time;
                      this.until = this.time + 1.3;
                      this.visual.setLocalEulerAngles(0, propYaw("marc-seat", YAW), 0);
                      this.animator.setIdleClip("SitIdle");
                      this.animator.playAction("SitDown", 1.3);
                      this.sitCount++;
                    } else if (this.purpose === "mess" && this.mess()) {
                      this.state = "cleaning";
                      this.transitionStart = this.time;
                      this.until = this.time + 3;
                      this.animator.setIdleClip("Cleaning");
                      const mess = this.mess();
                      this.animator.faceTowards(new Vec332(mess.x, 0, mess.z));
                      this.say(["These blocks are plotting against my feet.", "Ah, floor juice. My least favorite flavor.", "Crumbs: the glitter of snack time."][Number(mess.id.at(-1))]);
                    } else {
                      this.state = "idle";
                      this.until = this.time + 6;
                    }
                  }
                }
              } else {
                this.blockedFor += dt;
                if (this.blockedFor > 2) {
                  this.route = [];
                  this.target = null;
                  this.state = "idle";
                  this.until = this.time + 3;
                  this.blockedFor = 0;
                }
              }
            }
          } else if (this.state === "sitting-down" || this.state === "standing-up") {
            const down = this.state === "sitting-down", t = Math.min(1, (this.time - this.transitionStart) / (down ? 1.3 : 1)), smooth2 = t * t * (3 - 2 * t);
            const p2 = new Vec332().lerp(propPoint("marc-seat", down ? ENTRY : SEATED), propPoint("marc-seat", down ? SEATED : ENTRY), smooth2);
            this.root.setPosition(p2.x, 0.09, p2.z);
            this.visual.setLocalEulerAngles(0, propYaw("marc-seat", YAW), 0);
            if (this.time >= this.until && !this.animator.busy) {
              if (down) {
                this.state = "seated";
                this.until = this.time + 18;
              } else {
                this.state = "idle";
                this.until = this.time + 1;
                if (this.target && !this.approachMess()) this.target = null;
              }
            }
          } else if (this.state === "cleaning") {
            const mess = this.mess();
            if (mess) {
              const i = Number(mess.id.at(-1)), tool = this.tools[i];
              tool.enabled = true;
              tool.setPosition(mess.x + Math.sin(this.time * 8) * 0.16, 0.1 + (i === 0 ? 0.05 : 0), mess.z + Math.cos(this.time * 5) * 0.12);
              if (this.time >= this.until) {
                if (this.daily.lilahMesses.complete(mess.id, "marc")) {
                  this.cleaned++;
                  this.say("All tidy, sweetie. Until the sequel.");
                }
                this.settle();
              }
            }
          } else if (this.state === "seated") {
            if (this.time >= this.until) this.stand();
          } else if (this.time >= this.until) {
            if (this.purpose === "seat" || this.purpose === "mess") {
              const point = PATROL[this.patrolIndex++ % PATROL.length];
              if (!this.go(new Vec332(point[0], 0, point[1]), "wander")) this.until = this.time + 3;
            } else if (!this.go(propPoint("marc-seat", ENTRY), "seat")) this.until = this.time + 3;
          }
          if (this.time < 2 && this.state === "idle") {
            this.go(propPoint("marc-seat", ENTRY), "seat");
          }
          if (this.time >= this.nextSpeech && arianna.distance(this.root.getPosition()) < 5 && this.state !== "cleaning") this.say(REMARKS[this.lineIndex++ % REMARKS.length]);
        }
        this.grounding?.update();
        this.animator.update(dt, this.velocity, elapsed);
        const p = this.root.getPosition(), room = HOUSE_ROOMS.find((r) => p.x >= r.minX && p.x <= r.maxX && p.z >= r.minZ && p.z <= r.maxZ);
        if (room) this.visited.add(room.id);
        const screen = camera.camera.worldToScreen(new Vec332(p.x, p.y + this.height + 0.1, p.z)), viewport = document.querySelector("#game").getBoundingClientRect();
        this.label.hidden = performance.now() > this.speechUntil || screen.x < 0 || screen.x > viewport.width || screen.y < 135 || screen.y > viewport.height - 145;
        this.label.style.transform = `translate(${Math.max(6, Math.min(viewport.width - this.label.offsetWidth - 6, screen.x - this.label.offsetWidth / 2))}px,${screen.y - this.label.offsetHeight}px)`;
      }
      snapshot() {
        return { dinner: this.dinner.snapshot(), loaded: this.loaded, height: this.height, position: this.root.getPosition().toArray(), state: this.state, target: this.target, route: this.route.map((p) => p.toArray()), speech: this.speech, cleaned: this.cleaned, sitCount: this.sitCount, standCount: this.standCount, visited: [...this.visited], animation: this.animator.snapshot(), seat: { center: SEAT.toArray(), entry: ENTRY.toArray(), anchor: SEATED.toArray() } };
      }
      geometry() {
        return this.animator.geometrySnapshot();
      }
      destroy() {
        this.dinner.destroy();
        this.label.remove();
        this.root.destroy();
      }
    };
  }
});

// src/dev/DeveloperSaves.ts
var KEYS, CHECKPOINT, DeveloperSaves;
var init_DeveloperSaves = __esm({
  "src/dev/DeveloperSaves.ts"() {
    "use strict";
    init_SaveNamespace();
    KEYS = [saveKey("progress.v1"), saveKey("daily.v1"), saveKey("lilah.v1")];
    CHECKPOINT = saveKey("developer.checkpoint.v1");
    DeveloperSaves = class {
      capture() {
        const checkpoint = { version: 1, created: (/* @__PURE__ */ new Date()).toISOString(), values: Object.fromEntries(KEYS.map((key) => [key, localStorage.getItem(key)])) };
        localStorage.setItem(CHECKPOINT, JSON.stringify(checkpoint));
        return checkpoint;
      }
      ensure() {
        return this.read() ?? this.capture();
      }
      read() {
        const raw = localStorage.getItem(CHECKPOINT);
        if (!raw) return null;
        const c = JSON.parse(raw);
        if (c.version !== 1 || typeof c.created !== "string" || !c.values || KEYS.some((k) => c.values[k] !== null && typeof c.values[k] !== "string")) throw Error("Developer checkpoint is unreadable; it has not been overwritten.");
        return c;
      }
      restore() {
        const c = this.read();
        if (!c) throw Error("No checkpoint yet.");
        this.write(c.values);
      }
      reset() {
        this.ensure();
        this.write(Object.fromEntries(KEYS.map((k) => [k, null])));
      }
      current() {
        return { version: 1, created: (/* @__PURE__ */ new Date()).toISOString(), values: Object.fromEntries(KEYS.map((k) => [k, localStorage.getItem(k)])) };
      }
      write(values2) {
        const old = this.current().values;
        try {
          for (const k of KEYS) values2[k] === null ? localStorage.removeItem(k) : localStorage.setItem(k, values2[k]);
        } catch (error) {
          for (const k of KEYS) {
            try {
              old[k] === null ? localStorage.removeItem(k) : localStorage.setItem(k, old[k]);
            } catch {
            }
          }
          throw error;
        }
      }
    };
  }
});

// src/dev/DeveloperPanel.ts
var DeveloperPanel_exports = {};
__export(DeveloperPanel_exports, {
  DeveloperPanel: () => DeveloperPanel
});
var button, DeveloperPanel;
var init_DeveloperPanel = __esm({
  "src/dev/DeveloperPanel.ts"() {
    "use strict";
    init_collection();
    init_hunt();
    init_DeveloperSaves();
    button = (label, command, value = "", exit = false) => `<button type="button" data-command="${command}" data-value="${value}" ${exit ? "data-exit" : ""}>${label}</button>`;
    DeveloperPanel = class {
      constructor(loop, metrics) {
        this.loop = loop;
        this.metrics = metrics;
        this.dialog.id = "developer-panel";
        this.dialog.setAttribute("aria-labelledby", "dev-title");
        this.dialog.innerHTML = `<div class="dev-shell">
      <header class="dev-header"><div><span class="dev-eyebrow"><i></i> GOD MODE \xB7 PLAYTEST TOOLS</span><h2 id="dev-title">Developer studio<span>\u2726</span></h2><p>Less walking. More playtesting.</p></div><button class="dev-close" aria-label="Close developer panel">\xD7</button></header>
      <div class="dev-live"><span data-scene></span><span data-clock></span><span data-wallet></span></div>
      <nav class="dev-tabs" role="tablist" aria-label="Developer tools">${["Jump in", "World", "Pop lab", "Save & tools"].map((name, i) => `<button role="tab" id="dev-tab-${i}" aria-controls="dev-section-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-tab="${i}">${name}</button>`).join("")}</nav>
      <div class="dev-content">
        <section role="tabpanel" id="dev-section-0" aria-labelledby="dev-tab-0">
          <button class="dev-hero" data-command="play-pop" data-exit><span class="dev-hero-icon">\u273F</span><span><small>STRAIGHT TO THE GOOD STUFF</small><strong>Play Squishy Pop</strong><span>Finish chores \xB7 teleport to Peachy Playroom \xB7 open game</span></span><b>\u2197</b></button>
          <div class="dev-card"><h3>Lilah Tornado lab</h3><p>Play a complete 55-second house round.</p><div class="dev-grid">${button("\u{1F32A}\uFE0F Normal round", "tornado", "", true)}${button("Quiet round", "tornado", "none", true)}${button("\u{1F43E} Dog cameo", "tornado", "dog", true)}${button("\u{1F9FA} Basket surprise", "tornado", "basket", true)}</div></div><div class="dev-card"><h3>Skip the routine</h3><p>Afternoon chores and current Lilah messes done. No allowance awarded.</p><div class="dev-grid">${button("\u2713 Finish chores \u2192 afternoon", "skip-chores", "", true)}${button("\u2713 Finish current cleaning", "complete-current")}</div></div>
          <div class="dev-card"><h3>Go somewhere</h3><p>Store jumps set 3 PM, finish chores and refresh your shopping bag limit.</p><div class="dev-grid">${STORES.map((s) => button(s.icon + " " + s.name, "store", s.id, true)).join("")}${button("\u2302 Home", "home", "", true)}${button("\u2661 Collection", "collection", "", true)}${button("\u21C4 School trading", "recess", "", true)}</div></div>
        </section>
        <section role="tabpanel" id="dev-section-1" aria-labelledby="dev-tab-1" hidden>
          <div class="dev-card"><h3>Day & cleaning</h3><p>Time presets return home. A new day resets daily stock and routines.</p><div class="dev-grid">${button("7 AM \xB7 morning", "phase", "morning")}${button("3 PM \xB7 afternoon", "phase", "afternoon")}${button("7 PM \xB7 night", "phase", "night")}${button("Next day", "next-day")}${button("Finish current cleaning", "complete-current")}${button("Restart daily chores", "restart-chores")}${button("Freeze world clock", "freeze-clock")}</div></div>
          <div class="dev-card"><h3>Resources & collection</h3><p>Favorites and locks stay protected. Copies are added without removing anything.</p><div class="dev-grid">${button("+$20 allowance", "cash")}${button("+40 tickets", "tickets")}${button("Discover all 26", "unlock")}${button("At least 5 of each", "duplicates")}${button("Restock all stores", "restock")}</div><label class="dev-select-label" for="dev-friend">Choose a collectible</label><select id="dev-friend">${DUMPLINGS.map((d) => `<option value="${d.id}">${d.name} \xB7 ${d.rarity}</option>`).join("")}</select><div class="dev-grid">${button("Add one copy", "give-item")}${button("Add sealed box", "give-box")}</div></div>
        </section>
        <section role="tabpanel" id="dev-section-2" aria-labelledby="dev-tab-2" hidden>
          <div class="dev-notice"><strong data-pop-state>Open Squishy Pop to use the lab.</strong><p>Changing a round makes it practice: no tickets or records saved. Choose \u201CNew normal round\u201D to earn rewards again.</p></div>
          <div class="dev-card"><h3>Round controls</h3><div class="dev-grid">${button("New normal round", "pop:normal")}${button("Restart practice", "pop:restart")}${button("Show tutorial", "pop:tutorial")}${button("Finish practice now", "pop:finish")}${button("Freeze round timer", "pop:freeze")}${button("Set 10 seconds", "pop:time", "10")}${button("Set 60 seconds", "pop:time", "60")}</div></div>
          <div class="dev-card"><h3>Repeatable test boards</h3><p>Chains begin at the left of row 3, go right, then back along row 4. Resume to drag them.</p><div class="dev-grid">${[3, 5, 7, 10].map((n) => button(`${n}-chain${n === 5 ? " \u2192 Bomb" : n === 7 ? " \u2192 Rainbow" : n === 10 ? " \u2192 Mega" : ""}`, "pop:chain", String(n))).join("")}${button("Place Pop Bomb", "pop:bomb")}${button("Place Rainbow", "pop:rainbow")}${button("Place Mega", "pop:mega")}${button("Trigger Frenzy", "pop:frenzy")}${button("Shuffle board", "pop:shuffle")}${button("Test no-move recovery", "pop:deadlock")}</div></div>
          <button class="dev-resume">Resume game \u2197</button>
        </section>
        <section role="tabpanel" id="dev-section-3" aria-labelledby="dev-tab-3" hidden>
          <div class="dev-card"><h3>A way back</h3><p data-checkpoint></p><div class="dev-grid"><button data-tool="capture">Save checkpoint now</button><button data-tool="restore">Restore checkpoint</button><button data-tool="export">Download save</button><button data-tool="reset" class="dev-danger">Fresh test save</button></div><p>Restore and fresh save reload the game. Your checkpoint stays available until you replace it.</p></div>
          <div class="dev-card"><h3>Recovery & diagnostics</h3><div class="dev-grid">${button("Unstick + reset camera", "unstick", "", true)}<button data-tool="diagnostics">Download diagnostics</button></div><pre data-diagnostics></pre></div>
        </section>
      </div>
      <footer class="dev-bottom"><span>\u2161 World paused while this panel is open</span><small>Changes affect this local save. A checkpoint is kept before your first change.</small><div data-status role="status">Ready when you are.</div></footer>
    </div>`;
        document.body.append(this.dialog);
        this.launch(document.body, "dev-launch", "DEV \xB7 F2");
        for (const selector of ["#squishy-pop .pop-title", "#collection-dialog", "#trading-dialog", "#results", "#hunt-routes"]) {
          const host = document.querySelector(selector);
          if (host) {
            const launcher = this.launch(host, "dev-inline", "DEV");
            const observer = new MutationObserver(() => {
              if (!launcher.isConnected) (host.querySelector("header") ?? host).append(launcher);
            });
            observer.observe(host, { childList: true });
            this.observers.push(observer);
          }
        }
        const signal = this.abort.signal;
        this.dialog.addEventListener("cancel", (e) => {
          e.preventDefault();
          this.close();
        }, { signal });
        this.dialog.querySelector(".dev-close").addEventListener("click", () => this.close(), { signal });
        this.dialog.querySelector(".dev-resume").addEventListener("click", () => this.close(), { signal });
        this.dialog.addEventListener("click", (e) => {
          const target = e.target.closest("button");
          if (!target) return;
          if (target.dataset.tab !== void 0) {
            this.tab(Number(target.dataset.tab));
            return;
          }
          if (target.dataset.command) {
            let value = target.dataset.value ?? "";
            if (["give-item", "give-box"].includes(target.dataset.command)) value = this.dialog.querySelector("#dev-friend").value;
            this.run(target.dataset.command, value, target.hasAttribute("data-exit"));
          }
          if (target.dataset.tool) this.tool(target.dataset.tool);
        }, { signal });
        this.dialog.querySelector(".dev-tabs").addEventListener("keydown", (e) => {
          const event = e;
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const current = Number(event.target.dataset.tab);
          const next = event.key === "Home" ? 0 : event.key === "End" ? 3 : (current + (event.key === "ArrowRight" ? 1 : 3)) % 4;
          this.tab(next);
          this.dialog.querySelector(`[data-tab="${next}"]`).focus();
        }, { signal });
        window.addEventListener("keydown", (e) => {
          if (e.repeat) return;
          if (e.key !== "F2" && e.code !== "Backquote") return;
          if (e.code === "Backquote" && e.target.matches('input,textarea,select,[contenteditable="true"]')) return;
          e.preventDefault();
          e.stopImmediatePropagation();
          this.dialog.open ? this.close() : this.open();
        }, { signal, capture: true });
        this.timer = window.setInterval(() => {
          if (this.dialog.open) this.refresh();
        }, 500);
      }
      loop;
      metrics;
      dialog = document.createElement("dialog");
      saves = new DeveloperSaves();
      abort = new AbortController();
      timer;
      launchers = [];
      observers = [];
      log = [];
      launch(host, style, text) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = style;
        b.textContent = text;
        b.setAttribute("aria-label", "Open developer panel");
        b.addEventListener("click", () => this.open(), { signal: this.abort.signal });
        host.append(b);
        this.launchers.push(b);
        return b;
      }
      open() {
        if (this.dialog.open) return;
        this.loop.developerHold(true);
        this.dialog.showModal();
        this.refresh();
      }
      close() {
        if (!this.dialog.open) return;
        this.dialog.close();
        this.loop.developerHold(false);
      }
      tab(n) {
        this.dialog.querySelectorAll("[data-tab]").forEach((b, i) => {
          b.setAttribute("aria-selected", String(i === n));
          b.tabIndex = i === n ? 0 : -1;
        });
        this.dialog.querySelectorAll('[role="tabpanel"]').forEach((p, i) => p.hidden = i !== n);
        this.dialog.querySelector(".dev-content").scrollTop = 0;
        this.refresh();
      }
      message(text, error = false) {
        this.log.unshift(`${(/* @__PURE__ */ new Date()).toLocaleTimeString()} \xB7 ${text}`);
        this.log.length = Math.min(this.log.length, 6);
        const status = this.dialog.querySelector("[data-status]");
        status.textContent = text;
        status.dataset.error = String(error);
      }
      run(command, value, exit) {
        try {
          this.saves.ensure();
          if (exit) this.close();
          this.loop.developerCommand(command, value);
          this.message("Done \xB7 " + command.replaceAll("-", " ").replace("pop:", "Pop lab: "));
          this.refresh();
        } catch (e) {
          if (!this.dialog.open) this.open();
          this.message(e.message, true);
        }
      }
      tool(action) {
        try {
          if (action === "capture") {
            if (this.saves.read() && !confirm("Replace the existing checkpoint with your current saved game?")) return;
            this.saves.capture();
            this.message("Checkpoint saved.");
          } else if (action === "restore") {
            if (!confirm("Restore your developer checkpoint? Current game progress will be replaced and the game will reload.")) return;
            this.saves.restore();
            location.reload();
          } else if (action === "reset") {
            if (!confirm("Start a fresh test save? Current progress will be cleared; your developer checkpoint will remain available.")) return;
            this.saves.reset();
            location.reload();
          } else if (action === "export") {
            this.download("arianna-save", this.saves.current());
            this.message("Save downloaded.");
          } else if (action === "diagnostics") {
            this.download("arianna-diagnostics", { at: (/* @__PURE__ */ new Date()).toISOString(), game: this.loop.developerSummary(), render: this.metrics(), recentActions: this.log });
            this.message("Diagnostics downloaded.");
          }
          this.refresh();
        } catch (e) {
          this.message(e.message, true);
        }
      }
      download(name, data) {
        const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = name + ".json";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1e3);
      }
      refresh() {
        const s = this.loop.developerSummary(), m = this.metrics();
        const set = (selector, text) => {
          this.dialog.querySelector(selector).textContent = text;
        };
        set("[data-scene]", s.store ?? (s.scene === "cleanup" ? "Home \xB7 " + s.cleanup : s.scene));
        set("[data-clock]", `Day ${s.day} \xB7 ${s.time}`);
        set("[data-wallet]", `$${s.balance} \xB7 ${s.tickets} tickets`);
        const popReady = s.pop.open && s.popDev.ready;
        set("[data-pop-state]", popReady ? `${s.popDev.practice ? "PRACTICE" : "NORMAL ROUND"} \xB7 ${s.pop.state} \xB7 ${Math.ceil(s.pop.remaining)} seconds${s.popDev.freeze ? " \xB7 timer frozen" : ""}` : "Open Squishy Pop from Jump in to use the lab.");
        this.dialog.querySelectorAll('[data-command^="pop:"]').forEach((b) => b.disabled = !popReady);
        for (const [cmd, pressed] of [["freeze-clock", s.clockFrozen], ["pop:freeze", s.popDev.freeze]]) {
          const b = this.dialog.querySelector(`[data-command="${cmd}"]`);
          b.setAttribute("aria-pressed", String(pressed));
        }
        set("[data-diagnostics]", `Scene: ${s.scene} / ${s.phase}
Render: ${Math.round(m.fps)} FPS \xB7 ${m.drawCalls} draw calls
Position: ${m.position.map((v) => v.toFixed(2)).join(", ")}
Collection: ${s.discovered}/26 \xB7 sealed boxes: ${s.boxes}
Cleaning: ${s.completed}/${s.tasks}
Pop: ${s.pop.score} points \xB7 best chain ${s.pop.bestChain}
Pop frame p95: ${s.pop.frameP95.toFixed(1)} ms
Particles: ${s.pop.particles}/90 \xB7 art: ${s.pop.artFriends}/26
Playable chain: ${s.pop.valid.length} pieces`);
        try {
          const c = this.saves.read();
          set("[data-checkpoint]", c ? `Checkpoint: ${new Date(c.created).toLocaleString()}` : "No checkpoint yet. One is captured automatically before your first developer change.");
          this.dialog.querySelector('[data-tool="restore"]').disabled = !c;
        } catch (e) {
          set("[data-checkpoint]", e.message);
        }
      }
      destroy() {
        this.close();
        clearInterval(this.timer);
        this.abort.abort();
        this.observers.forEach((o) => o.disconnect());
        this.launchers.forEach((b) => b.remove());
        this.dialog.remove();
      }
    };
  }
});

// src/main.ts
var main_exports = {};
__export(main_exports, {
  startGame: () => startGame
});
import { Application, Color as Color10, Entity as Entity34, FILLMODE_NONE, RESOLUTION_AUTO, SHADOW_PCF3_32F, Vec3 as Vec333 } from "playcanvas";
async function startGame(editorApp) {
  const canvas = document.querySelector("#game-canvas");
  const app = editorApp ?? new Application(canvas, { graphicsDeviceOptions: { alpha: false, antialias: true, powerPreference: "low-power" } });
  app.graphicsDevice.maxPixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
  app.setCanvasFillMode(FILLMODE_NONE);
  app.setCanvasResolution(RESOLUTION_AUTO);
  await loadSquishyArt(app);
  const ambientBase = editorApp ? app.scene.ambientLight.clone() : new Color10(0.72, 0.68, 0.77);
  app.scene.ambientLight = ambientBase.clone();
  const sun = editorApp?.root.findByTag("migration.sun")[0] ?? new Entity34("Soft afternoon sunlight", app);
  if (!sun.light) sun.addComponent("light", {
    type: "directional",
    color: new Color10(1, 0.92, 0.83),
    intensity: 1.2,
    castShadows: true,
    shadowResolution: 1024,
    shadowDistance: 35,
    shadowType: SHADOW_PCF3_32F,
    shadowBias: 0.2,
    normalOffsetBias: 0.04
  });
  if (!editorApp) sun.setEulerAngles(48, -30, 0);
  const sunBase = { intensity: sun.light.intensity, color: sun.light.color.clone() };
  if (!sun.parent) app.root.addChild(sun);
  sun.light.mask = 9;
  const room = createHouse(app);
  const props = createHouseProps(app, room);
  const camera = new IsometricCamera(app, editorApp?.root.findByTag("migration.camera")[0]);
  const character = createCharacter(app);
  const joystick = new VirtualJoystick(document.querySelector("#joystick"), document.querySelector("#joystick-knob"));
  const controller = new PlayerController(character.player, camera.entity, room, joystick.value);
  const cleanup = new CleanupGame(app, character, props, camera.entity, () => {
    joystick.reset();
    controller.reset();
  }, controller, camera);
  const loop = new GameLoop(app, camera, character, room, props, cleanup, controller, joystick);
  const navigation = new HouseNavigation();
  const lilah = new Lilah(app, room, props.daily);
  const marc = new Marc(app, room, props.daily);
  const tornado = new LilahTornado(app, room, props, cleanup, loop, character, controller, camera, lilah);
  loop.tornado = tornado;
  const label = document.querySelector("#player-label");
  const screenPoint = new Vec333();
  const headPoint = new Vec333();
  const viewport = document.querySelector("#game");
  const resize = () => {
    const { width, height } = viewport.getBoundingClientRect();
    app.resizeCanvas(width, height);
    camera.resize(width, height);
    loop.resized();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(viewport);
  resize();
  const houseMusic = new HouseMusic();
  const destroyAudioSettings = createAudioSettings();
  const destroyPerformance = performanceSettings(app, () => loop.popUI.isOpen || loop.developerPaused);
  const dogRoaming = new DogRoaming(room, props.pet.dog, props.daily);
  app.on("update", (elapsed) => {
    houseMusic.update({ mode: loop.mode, phase: props.daily.clock.state.phase, store: loop.mode === "store" ? loop.store.definition.id : "", paused: loop.popUI.isOpen || loop.developerPaused || tornado.active, revealing: loop.opening.phase === "opening" }, Math.min(elapsed, 0.1));
    const now = performance.now();
    if (loop.developerPaused || loop.popUI.isOpen || document.hidden) cleanup.audio.silence();
    if (loop.developerPaused) {
      loop.developerTick(now, elapsed);
      return;
    }
    loop.beforeMovement(now);
    if (loop.popUI.isOpen) return;
    const bulky = cleanup.carry.item?.carryPace === "walk";
    controller.speed = bulky ? WALK_SPEED * (["vacuum", "scooper"].includes(cleanup.carry.item?.id ?? "") ? 1.5 : 1) : RUN_SPEED;
    character.animator.setCarryPace(bulky ? "walk" : "run");
    const night = cleanup.mode === "day" && props.daily.clock.state.phase === "night" && loop.mode === "cleanup";
    const dt = document.hidden ? 0 : Math.min(elapsed, 0.04);
    room.lighting.update(night, dt);
    const dusk = room.lighting.nightAmount;
    sun.light.intensity = sunBase.intensity * (1 - 0.98 / 1.2 * dusk);
    sun.light.color.set(sunBase.color.r * (1 - 0.28 * dusk), sunBase.color.g * (1 - 0.12 / 0.92 * dusk), sunBase.color.b * (1 + 0.17 / 0.83 * dusk));
    app.scene.ambientLight.set(ambientBase.r * (1 - 0.42 / 0.72 * dusk), ambientBase.g * (1 - 0.36 / 0.68 * dusk), ambientBase.b * (1 - 0.31 / 0.77 * dusk));
    if (loop.mode === "home") app.scene.ambientLight.set(0.7, 0.68, 0.65);
    controller.update(dt);
    if (loop.mode !== "home") camera.follow(character.player.getPosition(), dt);
    loop.update(now);
    tornado.update(document.hidden ? 0 : Math.min(elapsed, 0.1));
    dogRoaming.update(dt, loop.mode === "cleanup" && !tornado.active && !!props.pet?.loaded, [character.player.getPosition(), lilah.root.getPosition(), marc.root.getPosition()]);
    props.pet?.dogAnimator?.update(dt);
    navigation.update(character.player.getPosition(), camera.entity, loop.mode === "cleanup", cleanup.mode);
    character.grounding?.update();
    character.animator.update(dt, controller.velocity, elapsed);
    lilah.update(dt, elapsed, loop.mode === "cleanup" && props.daily.clock.state.phase !== "school", cleanup.mode === "day" && !cleanup.movementLocked, character.player.getPosition(), camera.entity);
    marc.update(dt, elapsed, loop.mode === "cleanup" && props.daily.clock.state.phase !== "school", cleanup.mode === "day" && !tornado.active, character.player.getPosition(), lilah.root.getPosition(), cleanup.activeInteractionId, camera.entity);
    headPoint.copy(character.player.getPosition());
    headPoint.y += 1.52;
    camera.entity.camera.worldToScreen(headPoint, screenPoint);
    label.style.transform = `translate(${screenPoint.x - label.offsetWidth / 2}px, ${screenPoint.y - label.offsetHeight - 5}px)`;
  });
  await captureWorld(app, room, props, loop, !!editorApp);
  props.daily.refresh();
  controller.setRoom(loop.mode === "store" ? loop.store : loop.mode === "recess" ? loop.recess : room);
  if (editorApp && loop.mode === "store") {
    character.player.setPosition(loop.store.exitAnchor.x, 0.09, loop.store.exitAnchor.z - 0.4);
    camera.reset();
  }
  if (SCHOOL_REVIEW) {
    loop.developerCommand("recess");
    if (new URLSearchParams(location.search).get("room") === "cafeteria") character.player.setPosition(4.6, 0.09, -14.8);
  }
  if (!editorApp) app.start();
  document.querySelector("#loading").remove();
  document.querySelector("#game").setAttribute("data-ready", "true");
  void loadArianna(app, character).catch((error) => console.warn("Keeping the Arianna placeholder:", error));
  if (true) {
    Object.defineProperty(window, "__roomTest", { configurable: true, value: {
      characterGeometry: () => character.animator.geometrySnapshot(),
      nearbyGeometry: () => app.root.findComponents("render").flatMap((r) => r.meshInstances.filter((m) => m.node.enabled && m.aabb.center.distance(character.player.getPosition()) < 3).map((m) => ({ name: m.node.name, parent: m.node.parent?.name, center: m.aabb.center.toArray(), half: m.aabb.halfExtents.toArray() }))),
      furnitureGeometry: () => ["Art tableRound", "Art loungeChairUpright", "Art crib"].map((name) => {
        const n = app.root.findByName(name);
        return { name, position: n?.getPosition().toArray(), meshes: n?.findComponents("render").flatMap((r) => r.meshInstances.map((m) => ({ center: m.aabb.center.toArray(), half: m.aabb.halfExtents.toArray() }))) };
      }),
      lilahGeometry: () => lilah.geometry(),
      marcGeometry: () => marc.geometry(),
      snapshot: () => ({
        position: character.player.getPosition().toArray(),
        velocity: controller.velocity.toArray(),
        input: controller.input.toArray(),
        joystick: joystick.value.toArray(),
        cameraPosition: camera.entity.getPosition().toArray(),
        cameraAngles: camera.entity.getEulerAngles().toArray(),
        cameraHeight: camera.entity.camera.orthoHeight,
        room: navigation.current,
        playerScreen: camera.entity.camera.worldToScreen(character.player.getPosition()).toArray(),
        drawCalls: app.stats.drawCalls.total,
        fps: app.stats.frame.fps,
        resolution: [app.graphicsDevice.width, app.graphicsDevice.height],
        characterLoaded: !character.placeholder.enabled,
        houseArt: room.artStats?.(),
        walkable: room.walkable,
        cameraRight: camera.entity.right.toArray(),
        cameraForward: camera.entity.forward.toArray(),
        animationState: character.animator.currentState,
        character: character.animator.snapshot(),
        lilah: lilah.snapshot(),
        marc: marc.snapshot(),
        dog: props.pet?.dogAnimator?.snapshot(),
        dogRoaming: dogRoaming.snapshot(),
        houseMusic: houseMusic.snapshot(),
        lighting: room.lighting.snapshot(),
        cleanup: cleanup.snapshot(),
        tornado: tornado.snapshot(),
        cameraState: camera.state,
        loop: loop.snapshot(),
        obstacles: room.obstacles.map((box) => ({ center: box.center.toArray(), halfExtents: box.halfExtents.toArray() }))
      })
    } });
  }
  let developerPanel;
  let disposed = false;
  void Promise.resolve().then(() => (init_DeveloperPanel(), DeveloperPanel_exports)).then(({ DeveloperPanel: DeveloperPanel2 }) => {
    if (!disposed) developerPanel = new DeveloperPanel2(loop, () => ({ fps: app.stats.frame.fps, drawCalls: app.stats.drawCalls.total, position: character.player.getPosition().toArray() }));
  });
  if (import.meta.hot) import.meta.hot.dispose(() => {
    disposed = true;
    developerPanel?.destroy();
    houseMusic.destroy();
    destroyPerformance();
    destroyAudioSettings();
    observer.disconnect();
    tornado.destroy();
    marc.destroy();
    lilah.destroy();
    navigation.destroy();
    loop.destroy();
    cleanup.destroy();
    joystick.destroy();
    controller.destroy();
    app.destroy();
    delete window.__roomTest;
  });
}
var init_main = __esm({
  "src/main.ts"() {
    "use strict";
    init_PerformanceSettings();
    init_SaveNamespace();
    init_AudioSettings();
    init_LayoutBridge();
    init_DogRoaming();
    init_HouseMusic();
    init_SquishyArt();
    init_house2();
    init_IsometricCamera();
    init_CharacterVisual();
    init_PlayerController();
    init_MovementPace();
    init_VirtualJoystick();
    init_houseProps();
    init_CleanupGame();
    init_GameLoop();
    init_HouseNavigation();
    init_Lilah();
    init_LilahTornado();
    init_Marc();
    if (!window.__editorMode) void startGame().catch((error) => {
      console.error("Unable to start the bedroom:", error);
      document.querySelector("#loading")?.remove();
      document.querySelector("#error").hidden = false;
    });
  }
});

// src/editor/FullGame.ts
init_AssetUrls();
import { Script } from "playcanvas";

// index.html
var index_default = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#ede6f4" />
    <meta name="description" content="A little room, a little adventure. Explore Arianna's cozy 3D bedroom." />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>Arianna \xB7 A little room</title>
  </head>
  <body>
    <main id="game" aria-label="Arianna's bedroom game">
      <canvas id="game-canvas" aria-label="3D bedroom. Move Arianna with the joystick or arrow keys." tabindex="0"></canvas>
      <div id="home-vignette" hidden aria-hidden="true"></div>
      <header class="topbar">
        <div class="wordmark"><span class="flower" aria-hidden="true">\u273F</span><span>Arianna<small>LITTLE EVERYDAY ADVENTURES</small></span></div>
        <div class="mission-stats"><span id="mission-clock" aria-label="Time remaining">1:00</span><span class="allowance-label">ALLOWANCE <b id="allowance">$0</b></span><span id="trip-wallet" hidden>WALLET <b id="trip-balance">$0</b></span></div>
      </header>
      <section class="room-title" aria-label="Current room">
        <span class="eyebrow"><i></i> <span id="scene-kicker">ONE COZY MINUTE</span> <span id="task-count">0 / 5</span></span>
        <h1>Home, sweet home.</h1>
        <ul id="task-list" class="task-list" aria-label="Cleanup tasks"></ul>
        <p id="day-label">Day 1 \xB7 Morning</p><div id="mission-picker" aria-label="Choose a cleanup mission"><button id="mission-day" type="button" aria-pressed="true">Daily life</button><button id="mission-house" type="button" aria-pressed="true">House \xB7 6</button><button id="mission-bedroom" type="button" aria-pressed="false">Bedroom \xB7 5</button><button id="mission-pet" type="button" aria-pressed="false">Puppy \xB7 1</button><button id="mission-practice" type="button" aria-pressed="false">Explore</button></div>
        <p id="room-connections"></p>
        <p id="scene-subtitle" hidden></p>
      </section>
      <div id="player-label" class="player-label" aria-hidden="true">Arianna <span>\u2661</span></div>
      <div id="cleanup-effects" aria-hidden="true"></div>
      <div id="house-doors" aria-hidden="true"></div>
      <div id="store-markers" hidden><span id="shop-display-marker" class="cleanup-marker">\u{1F381} Blind boxes</span><span id="shop-exit-marker" class="cleanup-marker">\u2302 Go Home</span></div>
      <div id="reveal-copy" hidden aria-live="polite"></div>
      <div id="save-message" role="status" hidden></div>
      <div class="move-tip cleanup-tip" id="move-tip"><span id="cleanup-hint">Move to start \xB7 60 seconds \xB7 $1 per task</span></div>
      <div id="cleanup-announcement" class="sr-only" role="status" aria-live="polite"></div>
      <div class="controls">
        <div class="joystick-group">
          <div id="joystick" role="group" aria-label="Movement joystick. Drag to move. Arrow keys or WASD also work.">
            <span class="direction up" aria-hidden="true">\u2303</span><span class="direction right" aria-hidden="true">\u203A</span><span class="direction down" aria-hidden="true">\u2304</span><span class="direction left" aria-hidden="true">\u2039</span>
            <div id="joystick-knob"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 5v22M5 16h22M12 9l4-4 4 4M12 23l4 4 4-4M9 12l-4 4 4 4M23 12l4 4-4 4"/></svg></div>
          </div>
          <span class="control-label">LET\u2019S EXPLORE</span>
        </div>
        <div class="action-group">
          <button id="action-button" type="button" disabled><span id="action-icon" aria-hidden="true">\u270B</span><strong id="action-title">Action</strong><small id="action-detail">Come closer</small></button>
          <span class="control-label">ACTION \xB7 SPACE / E</span>
        </div>
      </div>
      <section id="school-transition" hidden><span>\u{1F392}</span><h2>A little time at school</h2><p>See you after class!</p></section><footer><span class="build-badge">WALLET <b id="wallet">$0</b></span><a class="asset-credits" href="./asset-credits.html" target="_blank" rel="noopener">Art credits</a><button id="collection-button" type="button">Collection \xB7 0 / 8</button></footer>
      <dialog id="results" aria-labelledby="results-title" aria-describedby="results-summary">
        <div class="results-flower" aria-hidden="true">\u273F</div><span class="eyebrow">A LITTLE HELP GOES A LONG WAY</span>
        <h2 id="results-title">Nice helping!</h2><p id="results-summary"></p>
        <div class="results-totals"><div><strong id="results-tasks">0 / 5</strong><span>tasks completed</span></div><div><strong id="results-money">$0</strong><span>allowance earned</span></div></div>
        <p id="results-bonus" hidden></p><ul id="results-list" aria-label="Completed tasks"></ul>
        <p id="results-wallet"></p><button id="go-shopping" class="loop-button pink-button" type="button">Go Shopping \u2192</button>
        <button id="replay" type="button" autofocus>Play again <span aria-hidden="true">\u21BB</span></button>
      </dialog>
      <dialog id="collection-dialog" aria-labelledby="collection-title">
        <span class="eyebrow">LITTLE FRIENDS, LITTLE JOYS</span><h2 id="collection-title">Your dumplings</h2>
        <p id="collection-summary"></p><div id="collection-actions">
        <button id="open-next" class="loop-button pink-button" type="button">Open a box</button>
        <button id="back-cleanup" class="loop-button" type="button">Back to house \u2192</button>
          </div><div id="collection-grid"></div>
      </dialog>
      <div id="loading" role="status"><span class="loading-flower">\u273F</span><p>Making room for you\u2026</p></div>
      <div id="error" role="alert" hidden><h2>We couldn\u2019t open your room.</h2><p>Please use a browser with WebGL 2 enabled, then refresh.</p></div>
    </main>
    <script type="module" src="/src/main.ts"><\/script>
  </body>
</html>
`;

// migration/local.css
var local_default = '/* src/ui/hunt.css */\n#hunt-routes {\n  width: min(420px, calc(100% - 24px));\n  max-height: calc(100dvh - 28px);\n  overflow: auto;\n  border: 2px solid white;\n  border-radius: 26px;\n  padding: 23px 16px 14px;\n  color: #57496b;\n  background: #faf5ef;\n}\n#hunt-routes::backdrop {\n  background: #46395480;\n  backdrop-filter: blur(4px);\n}\n#hunt-routes h2 {\n  font-size: 25px;\n  letter-spacing: -.8px;\n  margin: 12px 0 7px;\n}\n.hunt-budget {\n  font-size: 13px;\n  color: #59765e;\n  font-weight: 800;\n  margin: 0 0 15px;\n}\n.store-choice {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  width: 100%;\n  padding: 13px 10px;\n  margin: 9px 0;\n  text-align: left;\n  border: 1px solid #fff;\n  border-radius: 18px;\n  background:\n    linear-gradient(\n      110deg,\n      var(--shop-color),\n      #fff7ee);\n  color: #514863;\n  box-shadow: 0 3px 8px #69546710;\n  cursor: pointer;\n}\n.store-choice:disabled {\n  opacity: .5;\n  cursor: default;\n}\n.store-icon {\n  display: grid;\n  place-items: center;\n  width: 43px;\n  min-width: 43px;\n  height: 43px;\n  border-radius: 50%;\n  background: #fff8;\n  font-size: 28px;\n}\n.store-choice strong {\n  display: block;\n  font-size: 17px;\n  margin-bottom: 4px;\n}\n.store-choice small {\n  display: block;\n  font-size: 10px;\n  line-height: 1.5;\n}\n.store-choice em {\n  display: block;\n  font-size: 11px;\n  line-height: 1.35;\n  margin: 7px 0 4px;\n  font-style: normal;\n  font-weight: 700;\n}\n.route-status {\n  color: #5e795b;\n}\n.hunt-explainer {\n  font-size: 10px;\n  line-height: 1.5;\n  color: #8d7b8b;\n  margin: 12px 4px;\n}\n#shopping-time {\n  display: inline-block;\n  padding: 6px 10px;\n  margin: 3px 0;\n  background: #fffaeeed;\n  color: #66795b;\n  border-radius: 12px;\n  font-size: 10px;\n  font-weight: 700;\n  pointer-events: none;\n}\n#hunt-find {\n  position: absolute;\n  left: 16px;\n  right: 16px;\n  bottom: 220px;\n  max-width: 360px;\n  margin: auto;\n  padding: 12px 14px;\n  border: 1px solid white;\n  border-radius: 18px;\n  background: #fff8eff2;\n  color: #655371;\n  box-shadow: 0 4px 18px #56466320;\n  pointer-events: none;\n}\n#hunt-find strong {\n  font-size: 17px;\n}\n#hunt-find p {\n  font-size: 12px;\n  margin: 5px 0;\n  color: #59816b;\n  font-weight: 700;\n}\n#hunt-find small {\n  font-size: 10px;\n}\n#game[data-scene=store] #save-message {\n  bottom: auto;\n  top: 190px;\n  left: 16px;\n  width: calc(100% - 32px);\n  padding: 9px 12px;\n}\n#game[data-scene=store] #cleanup-hint {\n  background: #fff9efdf;\n  border-radius: 12px;\n  padding: 7px 9px;\n}\n#game[data-scene=store] #shop-display-marker {\n  background: transparent;\n  color: #ffe6a0;\n  border: 0;\n  padding: 0;\n  box-shadow: none;\n  font-size: 23px;\n  text-shadow: 0 0 4px white, 0 0 9px #e6b761;\n}\n#hunt-travel {\n  position: absolute;\n  inset: 0;\n  z-index: 45;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  background: #f5edf7f5;\n  color: #705b83;\n}\n#hunt-travel span {\n  font-size: 65px;\n  animation: hunt-bob .6s ease-in-out infinite alternate;\n}\n#hunt-travel h2 {\n  font-size: 27px;\n}\n@keyframes hunt-bob {\n  to {\n    transform: translateY(-10px) rotate(6deg);\n  }\n}\n.series-heading {\n  grid-column: 1/-1;\n  text-align: left;\n  padding: 10px 3px 4px;\n  font-size: 14px;\n}\n#game[data-scene=store] .room-title h1 {\n  display: none;\n}\n#game[data-scene=store] #day-label,\n#game[data-scene=store] #scene-subtitle {\n  display: none;\n}\n#game[data-scene=store] .room-title .eyebrow {\n  font-size: 12px;\n  letter-spacing: .7px;\n  margin-bottom: 4px;\n}\n@media (max-height: 740px) {\n  #hunt-find {\n    bottom: 190px;\n    padding: 8px 12px;\n  }\n  #hunt-routes {\n    padding-top: 14px;\n  }\n  .store-choice {\n    padding: 9px;\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  #hunt-travel span {\n    animation: none;\n  }\n}\n#hunt-routes .dialog-top-action {\n  position: sticky;\n  top: 0;\n  z-index: 2;\n  box-shadow: 0 0 0 5px #faf5fb;\n}\n\n/* src/ui/trading.css */\n#trading-dialog {\n  box-sizing: border-box;\n  width: min(460px, calc(100% - 16px));\n  max-height: calc(100dvh - 16px);\n  padding: 0;\n  border: 2px solid white;\n  border-radius: 24px;\n  background: #fcf7ef;\n  color: #514365;\n  overflow: hidden;\n}\n#trading-dialog[open] {\n  display: flex;\n  flex-direction: column;\n}\n#trading-dialog::backdrop {\n  background: #44355288;\n  backdrop-filter: blur(3px);\n}\n#trading-dialog button {\n  font: inherit;\n  color: inherit;\n  cursor: pointer;\n  touch-action: manipulation;\n}\n#trading-dialog button:disabled {\n  opacity: .48;\n  cursor: default;\n}\n.trade-header {\n  padding: 14px 18px 10px;\n  background:\n    linear-gradient(\n      120deg,\n      #fff,\n      var(--trader));\n  flex-shrink: 0;\n}\n.trade-header h2 {\n  margin: 4px 0;\n  font-size: 27px;\n}\n.trade-header strong {\n  font-size: 12px;\n}\n.trade-header p {\n  margin: 6px 0 0;\n  font-size: 12px;\n  line-height: 1.4;\n}\n.trade-scroll {\n  overflow-y: auto;\n  overscroll-behavior: contain;\n  padding: 0 14px 12px;\n  min-height: 0;\n}\n#trading-dialog h3 {\n  font-size: 13px;\n  margin: 12px 0 7px;\n  display: flex;\n  justify-content: space-between;\n  gap: 4px;\n}\n#trading-dialog h3 small {\n  font-size: 10px;\n  font-weight: normal;\n}\n.trade-slots {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 6px;\n  min-height: 65px;\n  background: #e9dfef;\n  padding: 7px;\n  border-radius: 15px;\n}\n.trade-item {\n  border: 1px solid #fff;\n  background: #fffbf8;\n  border-radius: 12px;\n  padding: 4px;\n  text-align: center;\n  min-width: 0;\n}\n.trade-item img {\n  width: 100%;\n  height: 52px;\n  object-fit: contain;\n}\n.trade-item strong,\n.trade-item small {\n  display: block;\n  font-size: 10px;\n}\n.trade-item small {\n  font-size: 9px;\n  margin-top: 3px;\n}\n.trade-speech {\n  font-size: 12px;\n  line-height: 1.45;\n  background: #fff1cd;\n  border-radius: 13px;\n  padding: 10px;\n  margin: 10px 0;\n}\n.trade-empty {\n  grid-column: 1/-1;\n  margin: 10px;\n  font-size: 12px;\n  line-height: 1.5;\n}\n.trade-bag-heading label {\n  display: flex;\n  gap: 6px;\n  align-items: center;\n  font-size: 12px;\n  min-height: 32px;\n}\n.trade-bag-heading input {\n  width: 20px;\n  height: 20px;\n  accent-color: #8573a2;\n}\n.trade-safety {\n  font-size: 10px;\n  line-height: 1.4;\n  margin: 5px 0 10px;\n  color: #796b87;\n}\n#trade-inventory {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 6px;\n}\n.trade-bag-item {\n  display: flex;\n  align-items: center;\n  min-height: 62px;\n  padding: 4px;\n  border: 1px solid #ded2e6;\n  background: white;\n  border-radius: 12px;\n  text-align: left;\n  min-width: 0;\n}\n.trade-bag-item img {\n  width: 38px;\n  flex-shrink: 0;\n}\n.trade-bag-item strong {\n  font-size: 11px;\n  display: block;\n}\n.trade-bag-item small {\n  font-size: 9px;\n  display: block;\n  margin-top: 3px;\n}\n.trade-footer {\n  flex-shrink: 0;\n  padding: 8px 12px 12px;\n  background: #fcf7ef;\n  border-top: 1px solid #e8ddea;\n}\n.trade-footer p {\n  margin: 0 0 8px;\n  text-align: center;\n  font-size: 12px;\n  font-weight: bold;\n}\n.trade-controls {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 9px;\n}\n.trade-controls button {\n  border: 2px solid white;\n  border-radius: 18px;\n  font-size: 32px !important;\n  font-weight: bold !important;\n  min-height: 68px;\n  background: #f0c6cc;\n}\n.trade-controls button small {\n  display: block;\n  font-size: 10px;\n}\n.trade-controls #trade-add {\n  background: #f6dfa1;\n}\n.trade-controls #trade-accept {\n  background: #bad6b9;\n}\n#leave-recess {\n  position: absolute;\n  top: 76px;\n  right: 14px;\n  width: auto;\n  font-size: 12px;\n  padding: 9px 13px;\n  z-index: 5;\n}\n.collection-protection {\n  border: 0;\n  background: #fff9;\n  border-radius: 8px;\n  margin: 4px 1px 0;\n  min-width: 30px;\n  min-height: 32px;\n  font-size: 14px;\n  cursor: pointer;\n}\n.collection-protection[aria-pressed=true] {\n  background: #e5c6e9;\n  outline: 1px solid #b68ec0;\n}\n#game[data-scene=recess] #trip-wallet,\n#game[data-scene=recess] #mission-clock {\n  display: none !important;\n}\n@media (max-height: 650px) {\n  .trade-header {\n    padding: 8px 12px;\n  }\n  .trade-header h2 {\n    font-size: 21px;\n  }\n  .trade-header p {\n    font-size: 11px;\n  }\n  .trade-item img {\n    height: 42px;\n  }\n  .trade-controls button {\n    min-height: 60px;\n  }\n  .trade-footer {\n    padding: 6px 10px;\n  }\n}\n#trade-suggest {\n  width: 100%;\n  min-height: 44px;\n  border: 2px solid #b4d4bd;\n  border-radius: 16px;\n  background: #edf8ed;\n  font-weight: 800;\n}\n.trade-help {\n  font-size: 11px;\n  color: #6d6477;\n}\n.trade-loved {\n  border-color: #bad8bb !important;\n}\n.trade-header > small {\n  display: block;\n  margin-top: 7px;\n  font-size: 11px;\n}\n\n/* src/ui/squishy-pop.css */\n.pop-launch {\n  position: fixed;\n  z-index: 20;\n  bottom: max(160px, 22vh);\n  left: 50%;\n  transform: translateX(-50%);\n  width: min(310px, 85vw);\n  border: 3px solid #fff9;\n  border-radius: 30px;\n  padding: 13px 16px;\n  background:\n    linear-gradient(\n      135deg,\n      #ffe7ee,\n      #efa6d4);\n  color: #655082;\n  box-shadow: 0 6px 22px #4f3b6240;\n  font-weight: 900;\n  font-size: 17px;\n  cursor: pointer;\n}\n.pop-launch span {\n  margin-right: 8px;\n}\n.pop-launch small {\n  display: block;\n  font-size: 11px;\n  letter-spacing: .5px;\n  margin-top: 5px;\n  font-weight: 600;\n}\n#squishy-pop {\n  padding: 0;\n  border: 0;\n  background: transparent;\n  color: #5d497d;\n  max-width: none;\n  max-height: none;\n  width: 100%;\n  height: 100dvh;\n  inset: 0;\n  margin: 0;\n  overflow: auto;\n  font-family: inherit;\n}\n#squishy-pop::backdrop {\n  background: #46345495;\n  backdrop-filter: blur(9px);\n}\n#squishy-pop * {\n  box-sizing: border-box;\n}\n#squishy-pop button {\n  font: inherit;\n  cursor: pointer;\n  min-height: 44px;\n  color: #654e83;\n  border: 2px solid #fff;\n  border-radius: 25px;\n  background: linear-gradient(#ffe1ef, #f9aed5);\n  font-weight: 800;\n  padding: 9px 17px;\n  box-shadow: 0 3px 0 #c997c136;\n}\n#squishy-pop button:active {\n  transform: scale(.96);\n}\n#squishy-pop button:focus-visible {\n  outline: 3px solid #8a5fb4;\n  outline-offset: 2px;\n}\n.pop-shell {\n  width: min(100%, 480px);\n  min-height: 100%;\n  margin: auto;\n  padding: max(16px, env(safe-area-inset-top)) 18px max(14px, env(safe-area-inset-bottom));\n  background:\n    radial-gradient(\n      ellipse at 10% 45%,\n      #fff5d2aa,\n      transparent 60%),\n    linear-gradient(\n      155deg,\n      #fff8f1f5,\n      #f1e5fff5 60%,\n      #ffe9f1f5);\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  gap: 14px;\n}\n.pop-title {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n.pop-title > div {\n  flex: 1;\n}\n.pop-title small {\n  font-size: 9px;\n  letter-spacing: 2px;\n}\n.pop-title h2 {\n  font-size: 30px;\n  letter-spacing: -1px;\n  line-height: 1.1;\n  margin: 6px 0;\n  font-weight: 1000;\n  color: #9878b9;\n  text-shadow: 0 2px 0 white;\n}\n.pop-title em {\n  font-style: normal;\n  color: #ed83b0;\n}\n.pop-title button {\n  width: 44px;\n  padding: 5px !important;\n  background: #ffffffad !important;\n}\n.pop-stats {\n  display: grid;\n  grid-template-columns: 1fr 1.1fr 1.1fr;\n  gap: 8px;\n}\n.pop-stats > div {\n  border-radius: 22px;\n  padding: 11px 5px;\n  background: #ffffffc7;\n  border: 2px solid #fff;\n  text-align: center;\n  box-shadow: 0 4px 0 #cbb4e227;\n}\n.pop-stats small {\n  display: block;\n  font-size: 10px;\n  letter-spacing: 1.6px;\n  color: #957bad;\n  font-weight: 800;\n}\n.pop-stats strong {\n  display: block;\n  font-size: 27px;\n  line-height: 1.3;\n}\n.pop-stats progress {\n  height: 6px;\n  width: 65%;\n  display: block;\n  margin: 4px auto 0;\n}\n.pop-tray {\n  position: relative;\n  border: 6px solid #f6eeff;\n  border-radius: 35px;\n  background:\n    linear-gradient(\n      135deg,\n      #d1b9ee,\n      #c4a6df);\n  padding: 9px;\n  box-shadow:\n    inset 0 6px 9px #9973bb50,\n    0 7px 0 #bca1d8,\n    0 14px 25px #76609330;\n  isolation: isolate;\n}\n.pop-tray canvas {\n  width: 100%;\n  aspect-ratio: 1;\n  display: block;\n  touch-action: none;\n  border-radius: 21px;\n  background:\n    radial-gradient(\n      ellipse,\n      #fff2 40%,\n      transparent 70%);\n  user-select: none;\n}\n.pop-feedback {\n  position: absolute;\n  pointer-events: none;\n  inset: 40% 0 auto;\n  text-align: center;\n  font-size: 29px;\n  font-weight: 1000;\n  color: #ec65a9;\n  text-shadow:\n    2px 3px white,\n    -2px -2px white,\n    0 4px 6px #8a5fad;\n  transform: rotate(-6deg);\n  z-index: 2;\n}\n.pop-cover {\n  position: absolute;\n  inset: 0;\n  z-index: 3;\n  border-radius: 28px;\n  background: #fff5f2ef;\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  align-items: center;\n  text-align: center;\n  gap: 10px;\n  padding: 20px;\n  backdrop-filter: blur(4px);\n}\n.pop-cover[hidden] {\n  display: none;\n}\n.pop-cover h3 {\n  font-size: 23px;\n  line-height: 1.2;\n  margin: 0;\n}\n.pop-cover p {\n  font-size: 12px;\n  margin: 0;\n  max-width: 260px;\n}\n.pop-cover button {\n  width: 85%;\n  font-size: 14px !important;\n}\n.pop-cover .pop-link {\n  border: 0;\n  background: none;\n  box-shadow: none;\n  font-size: 12px !important;\n}\n.pop-count {\n  font-size: 80px;\n  color: #e778af;\n  animation: pop-count .8s infinite;\n}\n.pop-demo {\n  position: relative;\n  display: flex;\n  gap: 15px;\n  padding: 8px 10px 25px;\n  font-size: 40px;\n  color: #ec87b6;\n}\n.pop-demo b {\n  position: absolute;\n  left: 10%;\n  bottom: 0;\n  font-size: 32px;\n  animation: pop-finger 2s infinite;\n}\n.pop-frenzy {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  font-size: 10px;\n  letter-spacing: 1px;\n  font-weight: 900;\n  margin-top: 3px;\n}\n.pop-frenzy progress {\n  flex: 1;\n  min-width: 0;\n}\n.pop-frenzy b {\n  color: #e788b5;\n}\n.pop-hint {\n  text-align: center;\n  font-size: 14px;\n  font-weight: 700;\n  margin: 0;\n}\n.pop-friends {\n  display: flex;\n  justify-content: center;\n  gap: 7px;\n}\n.pop-friends span {\n  width: 40px;\n  text-align: center;\n}\n.pop-friends img {\n  width: 40px;\n  height: 35px;\n  object-fit: contain;\n  display: block;\n}\n.pop-friends small {\n  font-size: 9px;\n  color: #b18a52;\n  display: block;\n}\n.pop-footer {\n  text-align: center;\n  font-size: 10px;\n  color: #a58fb0;\n  letter-spacing: 1px;\n}\n.pop-result-star {\n  font-size: 35px;\n  color: #f5c960;\n}\n.pop-result-numbers {\n  display: flex;\n  justify-content: space-around;\n  width: 100%;\n  font-size: 11px;\n}\n.pop-result-numbers b {\n  display: block;\n  font-size: 24px;\n}\n.pop-ticket-prize {\n  font-size: 15px;\n  color: #d26f9f;\n}\n.pop-cover progress {\n  width: 70%;\n  height: 9px;\n}\n#squishy-pop progress {\n  appearance: none;\n  border: 0;\n  border-radius: 20px;\n  background: #e1d4ed;\n  height: 9px;\n  overflow: hidden;\n}\n#squishy-pop progress::-webkit-progress-bar {\n  background: #e1d4ed;\n  border-radius: 20px;\n}\n#squishy-pop progress::-webkit-progress-value {\n  background:\n    linear-gradient(\n      90deg,\n      #bd95e0,\n      #f49abe);\n  border-radius: 20px;\n  transition: width .2s;\n}\n.urgent {\n  color: #df608a;\n  animation: pop-count 1s infinite;\n}\n@keyframes pop-finger {\n  0%, 15% {\n    left: 10%;\n  }\n  70%, 100% {\n    left: 75%;\n  }\n}\n@keyframes pop-count {\n  0% {\n    transform: scale(1.08);\n  }\n  70% {\n    transform: scale(1);\n  }\n}\n@media (max-height: 700px) {\n  .pop-shell {\n    gap: 9px;\n    padding: 10px 15px;\n  }\n  .pop-title h2 {\n    font-size: 25px;\n  }\n  .pop-stats > div {\n    padding: 7px 3px;\n  }\n  .pop-stats strong {\n    font-size: 23px;\n  }\n  .pop-friends {\n    display: none;\n  }\n  .pop-footer {\n    display: none;\n  }\n  .pop-tray {\n    border-width: 5px;\n    padding: 6px;\n  }\n  .pop-cover {\n    gap: 7px;\n    padding: 10px;\n  }\n  .pop-cover h3 {\n    font-size: 20px;\n  }\n  .pop-result-star {\n    display: none;\n  }\n}\n@media (min-width: 500px) {\n  .pop-shell {\n    max-width: min(480px, 70dvh);\n    border-radius: 32px;\n    min-height: 0;\n    margin: 20px auto;\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  #squishy-pop * {\n    animation: none !important;\n  }\n}\n.pop-demo img {\n  width: 58px;\n  height: 58px;\n  object-fit: contain;\n}\n.pop-demo:before {\n  content: "";\n  position: absolute;\n  height: 5px;\n  background: #ffaad4;\n  left: 25px;\n  right: 25px;\n  top: 45%;\n  z-index: -1;\n  border-radius: 10px;\n}\n.pop-demo {\n  isolation: isolate;\n}\n.is-frenzy .pop-tray {\n  box-shadow:\n    inset 0 6px 9px #9973bb50,\n    0 7px 0 #e7afd5,\n    0 0 30px #ffb8d5;\n}\n.is-frenzy .pop-frenzy {\n  color: #cf639e;\n}\n.pop-launch[hidden] {\n  display: none;\n}\n.pop-cover .pop-result-star {\n  animation: pop-count .8s 2;\n}\n#squishy-pop {\n  font-family:\n    "Trebuchet MS",\n    "Arial Rounded MT Bold",\n    Arial,\n    sans-serif;\n}\n[data-tickets] {\n  background-repeat: no-repeat;\n  background-position: calc(50% - 15px) center;\n  background-size: 35px;\n  padding-left: 26px;\n}\n.pop-launch {\n  animation: pop-entrance .3s ease-out;\n}\n@keyframes pop-entrance {\n  from {\n    opacity: 0;\n  }\n  to {\n    opacity: 1;\n  }\n}\n.pop-frenzy span {\n  padding: 7px 0 7px 24px;\n  background-repeat: no-repeat;\n  background-position: left center;\n  background-size: 25px;\n}\n#squishy-pop[open] .pop-shell {\n  animation: pop-entrance .2s ease-out;\n}\n.pop-chain-cue {\n  position: absolute;\n  z-index: 4;\n  transform: translate(-50%, -100%);\n  display: flex;\n  align-items: center;\n  gap: 7px;\n  padding: 5px 10px 5px 5px;\n  border: 2px solid white;\n  border-radius: 22px;\n  background: #fff6fc;\n  color: #6c4487;\n  box-shadow: 0 3px 12px #855a9955;\n  pointer-events: none;\n  white-space: nowrap;\n  font-size: 11px;\n  font-weight: 800;\n}\n.pop-chain-cue[hidden] {\n  display: none;\n}\n.pop-chain-cue > b {\n  display: grid;\n  place-items: center;\n  background: #e88bbb;\n  color: white;\n  border-radius: 50%;\n  width: 30px;\n  height: 30px;\n  font-size: 20px;\n}\n.pop-chain-cue span {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n}\n.pop-chain-cue img {\n  width: 30px;\n  height: 30px;\n  object-fit: contain;\n}\n.pop-chain-cue.pulse > b {\n  animation: pop-count .22s ease-out;\n}\n.pop-feedback {\n  inset: 3px 0 auto;\n  font-size: 22px;\n  transform: none;\n  line-height: 1.2;\n}\n.is-frenzy .pop-tray {\n  border-color: #fff0b5;\n  box-shadow:\n    inset 0 4px 10px #9973bb40,\n    0 7px 0 #e6a6d6,\n    0 0 24px #ffc8d7;\n}\n.is-frenzy .pop-frenzy {\n  background: #fff6d4;\n  border-radius: 18px;\n  padding: 3px 8px;\n}\n.pop-frenzy b {\n  min-width: 46px;\n  text-align: right;\n}\n.pop-hint {\n  font-size: 13px;\n  min-height: 18px;\n}\n.pop-previous-best {\n  font-size: 11px;\n  color: #957aac;\n}\n.pop-ticket-flight {\n  height: 34px;\n  width: 100%;\n  position: relative;\n  overflow: hidden;\n}\n.pop-ticket-flight img {\n  position: absolute;\n  left: calc(18% + var(--i)*8%);\n  width: 35px;\n  height: 28px;\n  object-fit: contain;\n  animation: pop-ticket-bank .95s calc(var(--i)*.07s) both;\n}\n.pop-ticket-prize {\n  font-size: 17px;\n}\n@keyframes pop-ticket-bank {\n  0% {\n    transform: translateY(23px) rotate(-18deg);\n    opacity: 0;\n  }\n  30% {\n    opacity: 1;\n  }\n  70% {\n    transform: translateY(-4px) rotate(8deg);\n    opacity: 1;\n  }\n  100% {\n    transform: translateY(8px) scale(.65);\n    opacity: 0;\n  }\n}\n.showing-results .pop-stats,\n.showing-results .pop-frenzy,\n.showing-results .pop-hint,\n.showing-results .pop-friends {\n  display: none;\n}\n.showing-results .pop-tray {\n  height: min(480px, calc(100dvh - 140px));\n  flex-shrink: 0;\n}\n.showing-results .pop-tray canvas {\n  position: absolute;\n  visibility: hidden;\n}\n.showing-results .pop-cover {\n  gap: 12px;\n  padding: 18px;\n  overflow: auto;\n}\n.showing-results .pop-cover h3 {\n  font-size: 24px;\n}\n.showing-results .pop-result-star {\n  display: block;\n  line-height: 1;\n  font-size: 32px;\n}\n.showing-results .pop-cover button {\n  flex-shrink: 0;\n  min-height: 44px;\n}\n.showing-results .pop-cover p {\n  line-height: 1.4;\n}\n@media (max-height: 700px) {\n  .showing-results .pop-cover {\n    gap: 8px;\n    padding: 12px;\n  }\n  .showing-results .pop-cover h3 {\n    font-size: 21px;\n  }\n  .showing-results .pop-result-star {\n    font-size: 24px;\n  }\n  .pop-chain-cue {\n    font-size: 10px;\n  }\n  .pop-feedback {\n    font-size: 18px;\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  .pop-ticket-flight img {\n    animation: none;\n    opacity: 1;\n  }\n  .pop-chain-cue.pulse > b {\n    animation: none;\n  }\n}\n@media (max-width: 360px) {\n  .pop-title {\n    gap: 5px;\n  }\n  .pop-title > div {\n    min-width: 0;\n  }\n  .pop-title small {\n    font-size: 7px;\n    letter-spacing: .6px;\n  }\n  .pop-title h2 {\n    font-size: 20px;\n  }\n  .showing-results .pop-tray {\n    height: calc(100dvh - 145px);\n  }\n}\n#squishy-pop-shortcut {\n  pointer-events: auto;\n  border: 2px solid #fff;\n  border-radius: 22px;\n  padding: 9px 14px;\n  background:\n    linear-gradient(\n      135deg,\n      #ffe6f0,\n      #efb5dd);\n  color: #604c80;\n  font: 800 13px "Trebuchet MS", sans-serif;\n  box-shadow: 0 3px 10px #72538b26;\n  cursor: pointer;\n}\n#squishy-pop-shortcut:hover {\n  background: #f6c7e5;\n}\n#squishy-pop-shortcut:focus-visible {\n  outline: 3px solid #7855ae;\n  outline-offset: 3px;\n}\n@media (max-width: 600px) {\n  footer .asset-credits {\n    display: none;\n  }\n  #squishy-pop-shortcut {\n    font-size: 11px;\n    padding: 8px 10px;\n  }\n}\n#squishy-pop-shortcut {\n  min-height: 44px;\n}\n.pop-result-actions {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 8px;\n  width: 100%;\n}\n.pop-cover .pop-result-actions button {\n  width: 100%;\n  font-size: 12px !important;\n  padding: 8px;\n  line-height: 1.2;\n}\n.pop-result-actions button:first-child:last-child {\n  grid-column: 1/-1;\n}\n.pop-goals {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 8px;\n  padding: 7px 9px;\n  border: 2px solid white;\n  border-radius: 18px;\n  background: #fff6dc;\n  font-size: 12px;\n  font-weight: 800;\n  flex-wrap: wrap;\n}\n.pop-goals[hidden],\n.showing-results .pop-goals {\n  display: none;\n}\n.pop-goals small {\n  font-size: 9px;\n  color: #9878b9;\n}\n.pop-goals span,\n.pop-objectives span {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n}\n.pop-goals img,\n.pop-objectives img,\n.pop-previous-best img {\n  width: 30px;\n  height: 30px;\n  object-fit: contain;\n  vertical-align: middle;\n}\n.pop-goals .done {\n  color: #487865;\n}\n.pop-level-list {\n  display: flex;\n  flex-direction: column;\n  gap: 9px;\n  width: 100%;\n}\n.pop-level-list button {\n  width: 100%;\n  text-align: left;\n}\n.pop-level-list small {\n  display: block;\n  margin-top: 4px;\n  font-size: 11px;\n  font-weight: 600;\n}\n#squishy-pop button:disabled {\n  opacity: .55;\n  cursor: default;\n  transform: none;\n  background: #e5dfeb;\n}\n.pop-objectives {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 12px;\n  padding: 12px;\n  font-size: 18px;\n  font-weight: 800;\n}\n.showing-results .pop-cover {\n  justify-content: flex-start;\n}\n.showing-results .pop-cover > h3:first-child {\n  margin-top: 8px;\n}\n.pop-previous-best {\n  line-height: 1.5;\n}\n.showing-results .pop-cover > * {\n  flex-shrink: 0;\n}\n.showing-results .pop-cover .pop-link {\n  min-height: 44px;\n  padding: 7px;\n}\n@media (max-height: 700px) {\n  .pop-shell {\n    gap: 7px;\n  }\n  .pop-goals {\n    font-size: 11px;\n    padding: 4px 6px;\n    gap: 5px;\n  }\n  .pop-goals img {\n    width: 24px;\n    height: 24px;\n  }\n  .showing-results .pop-cover {\n    gap: 7px;\n  }\n  .pop-level-list {\n    gap: 6px;\n  }\n}\n.pop-prizes {\n  min-height: 44px !important;\n  width: auto !important;\n  padding: 5px 10px !important;\n  font-size: 12px !important;\n}\n.pop-feedback[data-tier=great] {\n  font-size: clamp(22px, 6vw, 32px);\n  color: #fff6a0;\n  text-shadow: 0 3px 0 #7d4690, 0 0 18px #fff;\n}\n.pop-feedback[data-tier=super] {\n  font-size: clamp(26px, 7vw, 38px);\n  color: #fff;\n  border: 3px solid #ffdf65;\n  border-radius: 20px;\n  background: #9554bde8;\n  padding: 12px;\n  box-shadow: 0 0 24px #ffda6a;\n}\n.pop-feedback[data-tier=rainbow] {\n  font-size: clamp(24px, 6.5vw, 36px);\n  color: #fff;\n  background:\n    linear-gradient(\n      110deg,\n      #ea76a7,\n      #d0a554,\n      #61bca4,\n      #618ddb,\n      #a278c8);\n  border: 3px solid white;\n  border-radius: 20px;\n  padding: 12px;\n  text-shadow: 0 2px 2px #65377c;\n}\n.pop-tray[data-celebration=super] {\n  box-shadow: 0 0 0 5px #ffe393, 0 0 35px #f1abde;\n}\n.pop-tray[data-celebration=rainbow] {\n  box-shadow:\n    -10px 0 24px #ff9cad,\n    0 -8px 24px #fff09e,\n    10px 0 24px #98daff,\n    0 8px 24px #b5a1ff;\n}\n.pop-feedback[hidden] {\n  display: none;\n}\n.pop-feedback[data-tier=great],\n.pop-feedback[data-tier=super],\n.pop-feedback[data-tier=rainbow] {\n  animation: pop-reward .32s ease-out;\n}\n@keyframes pop-reward {\n  from {\n    transform: translateY(8px) scale(.88);\n    opacity: .5;\n  }\n  to {\n    transform: none;\n    opacity: 1;\n  }\n}\n.pop-feedback[data-tier=super] {\n  text-shadow: 0 2px 2px #65377c;\n}\n.pop-launch {\n  position: absolute;\n  top: 175px;\n  bottom: auto;\n  left: 18px;\n  transform: none;\n  width: auto;\n  max-width: 180px;\n  padding: 9px 13px;\n  font-size: 12px;\n  border-width: 2px;\n  box-shadow: 0 3px 10px #4f3b6220;\n}\n.pop-launch small {\n  display: none;\n}\n@media (max-height: 650px) {\n  .pop-launch {\n    top: 135px;\n  }\n}\n\n/* src/ui/ticket-shop.css */\n#ticket-shop {\n  width: min(92vw, 520px);\n  max-height: 88dvh;\n  overflow: auto;\n  border: 3px solid #efb6d2;\n  border-radius: 26px;\n  background: #fff8ed;\n  color: #604861;\n  padding: 22px;\n  text-align: center;\n}\n#ticket-shop::backdrop {\n  background: #403347a8;\n}\n.ticket-prizes {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 12px;\n  margin: 16px 0;\n}\n.ticket-prizes article {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 6px;\n  padding: 10px;\n  border-radius: 18px;\n  background: #f1e7fa;\n}\n.ticket-prizes img {\n  width: 96px;\n  height: 96px;\n  object-fit: contain;\n}\n#ticket-shop button {\n  min-height: 44px;\n  border: 0;\n  border-radius: 16px;\n  padding: 10px 14px;\n  background: #805ba6;\n  color: white;\n  font-weight: 700;\n  cursor: pointer;\n}\n#ticket-shop button:disabled {\n  background: #d3c4d5;\n  color: #665b69;\n  cursor: default;\n}\n#ticket-shop [data-close] {\n  display: block;\n  width: 100%;\n  margin-top: 16px;\n}\n#ticket-shop [role=status] {\n  font-weight: 700;\n  color: #566b40;\n}\n#travel-next-store {\n  position: absolute;\n  right: 12px;\n  top: 175px;\n  z-index: 12;\n  max-width: 170px;\n  min-height: 44px;\n  border: 2px solid #d9c5ec;\n  border-radius: 15px;\n  padding: 8px 12px;\n  background: #fff4e6;\n  color: #604861;\n  font-weight: 700;\n}\n#ticket-shop {\n  box-sizing: border-box;\n}\n#ticket-shop [data-close] {\n  position: sticky;\n  bottom: 0;\n  box-shadow: 0 0 0 5px #fff8ed;\n}\n.ticket-prizes article {\n  min-width: 0;\n}\n.ticket-prizes button {\n  width: 100%;\n}\n@media (max-width: 360px) {\n  #ticket-shop {\n    padding: 14px;\n  }\n  .ticket-prizes {\n    gap: 8px;\n  }\n  .ticket-prizes img {\n    width: 76px;\n    height: 76px;\n  }\n  .ticket-prizes article {\n    padding: 8px;\n  }\n  .ticket-prizes button {\n    padding: 8px;\n    font-size: 12px;\n  }\n}\n#ticket-shop [data-close] {\n  top: 0;\n  bottom: auto;\n  z-index: 2;\n}\n\n/* src/ui/tornado.css */\n#game[data-tornado] .room-title,\n#game[data-tornado] #cleanup-effects,\n#game[data-tornado] #house-doors,\n#game[data-tornado] #move-tip,\n#game[data-tornado] .mission-stats {\n  visibility: hidden;\n}\n#tornado-hud {\n  position: absolute;\n  z-index: 8;\n  top: 110px;\n  left: 22px;\n  width: min(340px, calc(100% - 44px));\n  padding: 15px 18px;\n  border: 2px solid #fff9;\n  border-radius: 23px;\n  background: #fff9f1ef;\n  color: #59476e;\n  box-shadow: 0 8px 25px #52416620;\n  pointer-events: none;\n  box-sizing: border-box;\n}\n#tornado-hud[hidden] {\n  display: none;\n}\n#tornado-hud header {\n  display: flex;\n  gap: 12px;\n  align-items: center;\n}\n#tornado-hud small {\n  font-size: 8px;\n  letter-spacing: 1.6px;\n  color: #907ca6;\n}\n#tornado-hud h2 {\n  font-size: 23px;\n  margin: 3px 0 10px;\n}\n#tornado-hud [data-time] {\n  font-size: 28px;\n  font-variant-numeric: tabular-nums;\n  margin-left: auto;\n}\n#tornado-hud [data-sound] {\n  pointer-events: auto;\n  border: 0;\n  background: #ece0f3;\n  color: #69517e;\n  border-radius: 50%;\n  width: 32px;\n  height: 32px;\n  cursor: pointer;\n}\n.tornado-meter-row,\n.tornado-score {\n  display: flex;\n  justify-content: space-between;\n  gap: 8px;\n  font-size: 11px;\n}\n.tornado-score {\n  margin-top: 7px;\n  color: #71865c;\n}\n.tornado-score [data-streak] {\n  color: #a65585;\n  font-size: 10px;\n}\n#tornado-hud meter {\n  display: block;\n  width: 100%;\n  height: 17px;\n  margin-top: 4px;\n}\n#tornado-hud meter::-webkit-meter-bar {\n  background: #eee5f3;\n  border: 0;\n  border-radius: 10px;\n}\n#tornado-hud meter::-webkit-meter-optimum-value {\n  background:\n    linear-gradient(\n      90deg,\n      #c3cde8,\n      #e8adbe);\n  border-radius: 10px;\n}\n#tornado-hud p {\n  font-size: 11px;\n  line-height: 1.4;\n  min-height: 30px;\n  margin: 9px 0 0;\n}\n#tornado-effects {\n  position: absolute;\n  inset: 0;\n  pointer-events: none;\n  overflow: hidden;\n  z-index: 7;\n}\n.tornado-marker {\n  position: absolute;\n  font-size: 24px;\n  border: 2px solid #fff;\n  background: #fff4d9ed;\n  box-shadow: 0 4px 12px #71603c30;\n  border-radius: 14px;\n  padding: 3px 7px;\n}\n.tornado-marker.near {\n  background: #dcf3c8;\n  box-shadow: 0 0 20px #fff3a1;\n}\n.tornado-marker.edge::after {\n  content: "\\27a4";\n  position: absolute;\n  left: 50%;\n  top: 50%;\n  color: #9c729d;\n  transform: translate(-50%, -50%) rotate(var(--angle)) translateX(32px);\n}\n.tornado-sparkles {\n  position: absolute;\n  color: #8a599f;\n  text-shadow: 0 2px #fff;\n  font-weight: bold;\n  font-size: 26px;\n  animation: tornado-pop 1s ease-out forwards;\n  white-space: nowrap;\n}\n@keyframes tornado-pop {\n  from {\n    transform: translate(-50%, 0) scale(.6);\n  }\n  50% {\n    opacity: 1;\n  }\n  to {\n    transform: translate(-50%, -80px) scale(1.2);\n    opacity: 0;\n  }\n}\n#tornado-dialog {\n  box-sizing: border-box;\n  width: min(430px, calc(100% - 28px));\n  max-height: calc(100dvh - 28px);\n  overflow: auto;\n  padding: 28px;\n  border: 2px solid white;\n  border-radius: 28px;\n  background: #fff8f1;\n  color: #5c4773;\n  text-align: center;\n  box-shadow: 0 20px 80px #51416650;\n}\n#tornado-dialog::backdrop {\n  background: #594d7666;\n  backdrop-filter: blur(3px);\n}\n#tornado-dialog small {\n  font-size: 9px;\n  letter-spacing: 1.4px;\n}\n#tornado-dialog h2 {\n  font-size: 29px;\n  line-height: 1.1;\n  margin: 12px 0;\n}\n#tornado-dialog p {\n  font-size: 14px;\n  line-height: 1.6;\n  color: #8b7094;\n}\n.tornado-emblem {\n  font-size: 60px;\n}\n.tornado-stars {\n  font-size: 48px;\n  color: #e4ae4e;\n  letter-spacing: 7px;\n}\n.tornado-instructions {\n  display: grid;\n  gap: 10px;\n  background: #efe6f4;\n  padding: 16px;\n  border-radius: 18px;\n  text-align: left;\n}\n.tornado-totals {\n  display: flex;\n  justify-content: space-around;\n  background: #efe6f4;\n  padding: 16px 4px;\n  border-radius: 18px;\n  font-size: 11px;\n}\n.tornado-totals b {\n  display: block;\n  font-size: 25px;\n  margin-bottom: 5px;\n}\n#tornado-dialog button {\n  display: block;\n  width: 100%;\n  padding: 14px;\n  border: 2px solid white;\n  border-radius: 16px;\n  margin-top: 10px;\n  background: #b8cfae;\n  color: #466240;\n  font: 700 16px system-ui;\n  cursor: pointer;\n}\n#tornado-dialog button.secondary {\n  background: #eee3f1;\n  color: #705285;\n}\n#tornado-dialog .tornado-earned {\n  color: #5b824e;\n  font-weight: bold;\n}\n@media (max-width: 500px) {\n  #tornado-hud {\n    top: 87px;\n    left: 12px;\n    width: calc(100% - 24px);\n    padding: 10px 13px;\n  }\n  #tornado-hud h2 {\n    font-size: 20px;\n    margin-bottom: 5px;\n  }\n  #tornado-hud p {\n    min-height: 16px;\n    margin-top: 5px;\n  }\n  #tornado-hud [data-time] {\n    font-size: 25px;\n  }\n  .tornado-marker {\n    font-size: 20px;\n  }\n}\n@media (max-height: 600px) and (orientation: landscape) {\n  #tornado-hud {\n    top: 80px;\n    width: 275px;\n    padding: 9px 12px;\n  }\n  #tornado-hud p {\n    min-height: 0;\n  }\n  #tornado-hud h2 {\n    font-size: 18px;\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  .tornado-sparkles {\n    animation: none;\n  }\n}\n\n/* src/ui/styles.css */\n:root {\n  font-family:\n    "Trebuchet MS",\n    ui-rounded,\n    system-ui,\n    sans-serif;\n  color: #51466a;\n  background: #ede6f4;\n  font-synthesis: none;\n  -webkit-tap-highlight-color: transparent;\n}\n* {\n  box-sizing: border-box;\n}\nhtml,\nbody,\n#game {\n  margin: 0;\n  width: 100%;\n  height: 100%;\n  overflow: hidden;\n  overscroll-behavior: none;\n}\nbody {\n  position: fixed;\n  inset: 0;\n}\n#game {\n  height: 100dvh;\n  position: relative;\n  isolation: isolate;\n  user-select: none;\n  -webkit-user-select: none;\n}\n#game-canvas {\n  display: block;\n  width: 100%;\n  height: 100%;\n  outline: none;\n  touch-action: none;\n}\n#game-canvas:focus-visible {\n  outline: 3px solid #9b86bd;\n  outline-offset: -3px;\n}\n.topbar {\n  position: absolute;\n  top: max(22px, env(safe-area-inset-top));\n  left: 28px;\n  right: 28px;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  pointer-events: none;\n}\n.wordmark {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  font-size: 26px;\n  font-weight: 800;\n  letter-spacing: -1px;\n}\n.wordmark small {\n  display: block;\n  font-size: 7px;\n  letter-spacing: 1.8px;\n  margin-top: 2px;\n  font-weight: 700;\n}\n.flower {\n  color: #a18abd;\n  font-size: 43px;\n  line-height: 1;\n}\n.chapter {\n  font-size: 10px;\n  font-weight: 800;\n  letter-spacing: 2px;\n}\n.chapter span {\n  color: #b8a8c9;\n  margin: 0 5px;\n}\n.room-title {\n  position: absolute;\n  top: 14%;\n  width: 100%;\n  text-align: center;\n  pointer-events: none;\n}\n.eyebrow {\n  font-size: 9px;\n  letter-spacing: 2.3px;\n  font-weight: 700;\n  color: #8c7a9f;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  gap: 7px;\n}\n.eyebrow i {\n  width: 5px;\n  height: 5px;\n  border-radius: 50%;\n  background: #90ac95;\n}\nh1 {\n  font-size: clamp(26px, 4vw, 37px);\n  letter-spacing: -1.2px;\n  margin: 10px 0 7px;\n  font-weight: 800;\n}\n.room-title p {\n  font-size: 12px;\n  color: #8c7a9f;\n  margin: 0;\n}\n.player-label {\n  position: absolute;\n  top: 0;\n  left: 0;\n  padding: 5px 10px;\n  background: #fffaf4ee;\n  border: 1px solid #fff;\n  border-radius: 12px;\n  font-size: 10px;\n  font-weight: 800;\n  pointer-events: none;\n  box-shadow: 0 3px 10px #71608518;\n  will-change: transform;\n}\n.player-label span {\n  color: #d592ad;\n  margin-left: 4px;\n}\n.room-caption {\n  position: absolute;\n  bottom: 26%;\n  width: 100%;\n  text-align: center;\n  font-size: 10px;\n  letter-spacing: .5px;\n  color: #9e8db0;\n  pointer-events: none;\n}\n.room-caption span {\n  margin: 0 12px;\n  color: #b9a3cc;\n}\n.move-tip {\n  position: absolute;\n  bottom: 19%;\n  left: 50%;\n  transform: translateX(-50%);\n  display: flex;\n  gap: 10px;\n  align-items: center;\n  width: max-content;\n  max-width: calc(100% - 36px);\n  transition: opacity .6s;\n  pointer-events: none;\n}\n.tip-icon {\n  display: grid;\n  place-items: center;\n  width: 34px;\n  height: 34px;\n  background: #fbf7fcbb;\n  border: 1px solid #fff9;\n  border-radius: 12px;\n  font-size: 22px;\n  color: #a389bb;\n}\n.move-tip strong,\n.move-tip div > span {\n  display: block;\n}\n.move-tip strong {\n  font-size: 12px;\n  margin-bottom: 3px;\n}\n.move-tip div > span {\n  font-size: 10px;\n  color: #9686a7;\n}\n.move-tip.explored {\n  opacity: 0;\n}\n.controls {\n  position: absolute;\n  left: max(27px, env(safe-area-inset-left));\n  right: max(27px, env(safe-area-inset-right));\n  bottom: max(42px, calc(env(safe-area-inset-bottom) + 24px));\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  pointer-events: none;\n}\n.joystick-group {\n  text-align: center;\n  pointer-events: auto;\n}\n#joystick {\n  position: relative;\n  width: 120px;\n  height: 120px;\n  border: 2px solid #fff9;\n  background:\n    linear-gradient(\n      140deg,\n      #fffc,\n      #ded1ec99);\n  border-radius: 50%;\n  box-shadow: 0 7px 22px #82709516, inset 0 1px 8px #fff8;\n  touch-action: none;\n  cursor: grab;\n}\n#joystick.dragging {\n  cursor: grabbing;\n}\n#joystick-knob {\n  position: absolute;\n  left: 34px;\n  top: 34px;\n  width: 48px;\n  height: 48px;\n  border-radius: 50%;\n  border: 2px solid #fff;\n  background:\n    linear-gradient(\n      145deg,\n      #cdbce5,\n      #aa93c9);\n  box-shadow: 0 5px 8px #6c51813b;\n  pointer-events: none;\n  display: grid;\n  place-items: center;\n  will-change: transform;\n}\n#joystick-knob svg {\n  width: 22px;\n  height: 22px;\n  fill: none;\n  stroke: #fff;\n  stroke-width: 2;\n  stroke-linecap: round;\n  stroke-linejoin: round;\n  opacity: .8;\n}\n.direction {\n  position: absolute;\n  color: #ae9abd;\n  font-size: 22px;\n  line-height: 20px;\n}\n.up {\n  top: 5px;\n  left: 51px;\n}\n.down {\n  bottom: 7px;\n  left: 51px;\n}\n.left {\n  top: 47px;\n  left: 9px;\n}\n.right {\n  top: 47px;\n  right: 9px;\n}\n.control-label {\n  display: block;\n  font-size: 8px;\n  letter-spacing: 1.5px;\n  font-weight: 800;\n  color: #9581a8;\n  margin-top: 11px;\n}\n.explore-note {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  margin-top: 30px;\n  color: #8f7ba3;\n}\n.tiny-house {\n  font-size: 31px;\n  color: #ad98bd;\n}\n.explore-note > span:last-child {\n  font-size: 12px;\n  font-weight: 700;\n}\n.explore-note small {\n  display: block;\n  font-size: 9px;\n  font-weight: 400;\n  margin-top: 5px;\n}\nfooter {\n  position: absolute;\n  bottom: max(12px, env(safe-area-inset-bottom));\n  left: 28px;\n  right: 28px;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  font-size: 8px;\n  color: #a591b7;\n  letter-spacing: .6px;\n  pointer-events: none;\n}\n.build-badge {\n  font-size: 7px;\n  letter-spacing: 1.4px;\n}\n.keyboard-hint {\n  font-size: 8px;\n}\n#loading,\n#error {\n  position: absolute;\n  inset: 0;\n  background: #ede6f4;\n  display: grid;\n  place-content: center;\n  text-align: center;\n  padding: 32px;\n  z-index: 9;\n}\n#loading .loading-flower {\n  font-size: 60px;\n  color: #a18abd;\n  animation: breathe 1.2s infinite alternate;\n}\n#loading p {\n  font-size: 14px;\n}\n#error[hidden] {\n  display: none;\n}\n#error h2 {\n  font-size: 22px;\n}\n#error p {\n  font-size: 14px;\n  max-width: 320px;\n  line-height: 1.6;\n}\n@keyframes breathe {\n  to {\n    transform: scale(.85);\n    opacity: .5;\n  }\n}\n@media (min-width: 700px) {\n  .topbar {\n    left: 40px;\n    right: 40px;\n    top: 28px;\n  }\n  .room-title {\n    top: 12%;\n  }\n  .controls {\n    left: 45px;\n    right: 45px;\n    bottom: 50px;\n  }\n  .room-caption {\n    bottom: 15%;\n  }\n  .move-tip {\n    bottom: 7%;\n  }\n  .explore-note {\n    margin-top: 0;\n  }\n  footer {\n    left: 40px;\n    right: 40px;\n  }\n  .keyboard-hint {\n    font-size: 10px;\n  }\n}\n@media (max-height: 650px) and (orientation: portrait) {\n  .topbar {\n    top: 14px;\n  }\n  .room-title {\n    top: 13%;\n  }\n  h1 {\n    font-size: 25px;\n  }\n  .room-title p {\n    font-size: 10px;\n  }\n  .room-caption {\n    display: none;\n  }\n  .move-tip {\n    bottom: 23%;\n  }\n  .controls {\n    bottom: 35px;\n  }\n  #joystick {\n    width: 102px;\n    height: 102px;\n  }\n  #joystick-knob {\n    left: 25px;\n    top: 25px;\n  }\n  .up,\n  .down {\n    left: 42px;\n  }\n  .left,\n  .right {\n    top: 38px;\n  }\n  .keyboard-hint {\n    display: none;\n  }\n}\n@media (orientation: landscape) and (max-height: 600px) {\n  .room-title {\n    top: 24%;\n    text-align: left;\n    padding-left: 28px;\n    width: 220px;\n  }\n  .eyebrow {\n    justify-content: flex-start;\n    font-size: 7px;\n    letter-spacing: 1px;\n  }\n  h1 {\n    font-size: 24px;\n  }\n  .room-title p {\n    font-size: 10px;\n  }\n  .topbar {\n    top: 14px;\n  }\n  .room-caption,\n  .move-tip,\n  .explore-note {\n    display: none;\n  }\n  .controls {\n    bottom: 35px;\n  }\n  .wordmark {\n    font-size: 21px;\n  }\n  #joystick {\n    width: 102px;\n    height: 102px;\n  }\n  #joystick-knob {\n    left: 25px;\n    top: 25px;\n  }\n  .up,\n  .down {\n    left: 42px;\n  }\n  .left,\n  .right {\n    top: 38px;\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  #loading .loading-flower {\n    animation: none;\n  }\n  .move-tip {\n    transition: none;\n  }\n}\n@media (max-width: 699px) {\n  .room-caption {\n    display: none;\n  }\n  .move-tip {\n    bottom: calc(max(42px, env(safe-area-inset-bottom)) + 156px);\n  }\n}\n@media (max-width: 380px) {\n  .topbar {\n    left: 18px;\n    right: 18px;\n  }\n  .wordmark {\n    font-size: 24px;\n  }\n  .wordmark small {\n    font-size: 6px;\n    letter-spacing: 1.2px;\n    white-space: nowrap;\n  }\n  .chapter {\n    font-size: 8px;\n    letter-spacing: 1px;\n    white-space: nowrap;\n  }\n  .eyebrow {\n    font-size: 7px;\n    letter-spacing: 1.6px;\n  }\n}\n@media (max-height: 650px) and (orientation: portrait) {\n  .move-tip {\n    display: none;\n  }\n  .explore-note {\n    max-width: 125px;\n  }\n  .room-title {\n    top: 15%;\n  }\n}\n@media (max-height: 740px) and (orientation: portrait) {\n  .move-tip {\n    display: none;\n  }\n}\n#house-music {\n  pointer-events: auto;\n  border: 0;\n  border-radius: 18px;\n  background: #eee2f3;\n  color: #725283;\n  font-family: inherit;\n  font-weight: 700;\n  font-size: 10px;\n  line-height: 1.2;\n  padding: 8px;\n  min-height: 40px;\n  min-width: 54px;\n  cursor: pointer;\n}\nfooter {\n  gap: 6px;\n}\nfooter .keyboard-hint {\n  display: none;\n}\n@media (max-width: 380px) {\n  footer {\n    left: 12px;\n    right: 12px;\n  }\n  #collection-button {\n    font-size: 9px !important;\n  }\n}\n#audio-settings {\n  pointer-events: auto;\n  border: 0;\n  border-radius: 18px;\n  background: #eee2f3;\n  color: #725283;\n  font-family: inherit;\n  font-weight: 700;\n  font-size: 11px;\n  padding: 8px;\n  min-height: 40px;\n  cursor: pointer;\n}\n.audio-settings {\n  width: min(340px, 85vw);\n  border: 0;\n  border-radius: 22px;\n  background: #fff9f1;\n  color: #534565;\n  padding: 24px;\n  font-family: inherit;\n}\n.audio-settings::backdrop {\n  background: #30283880;\n}\n.audio-settings label {\n  display: block;\n  margin: 22px 0;\n  font-weight: 700;\n}\n.audio-settings output {\n  float: right;\n}\n.audio-settings input {\n  display: block;\n  width: 100%;\n  height: 40px;\n  accent-color: #9873b5;\n}\n.audio-settings button {\n  min-height: 44px;\n  width: 100%;\n  border: 0;\n  border-radius: 15px;\n  background: #e1d1ed;\n  color: #493659;\n  font-weight: 700;\n}\n.audio-settings p {\n  font-size: 12px;\n}\nfooter {\n  flex-wrap: wrap;\n}\n.audio-settings {\n  max-height: calc(100dvh - 28px);\n  overflow: auto;\n  box-sizing: border-box;\n}\n.audio-mutes {\n  display: flex;\n  gap: 8px;\n}\n.audio-mutes button {\n  flex: 1;\n  width: auto !important;\n}\n.audio-settings summary {\n  font-size: 13px;\n  cursor: pointer;\n}\n.audio-settings details p {\n  line-height: 1.5;\n}\n@media (max-height: 650px) {\n  .audio-settings {\n    padding: 16px;\n  }\n  .audio-settings h2 {\n    font-size: 20px;\n    margin: 0 0 10px;\n  }\n  .audio-settings label {\n    margin: 10px 0;\n  }\n}\n#game[data-scene=recess] .room-title {\n  top: 84px;\n  left: 18px;\n  right: auto;\n  width: auto;\n  max-width: 65%;\n  text-align: left;\n  padding: 10px 16px;\n  background: #fff8ece8;\n  border-radius: 18px;\n  pointer-events: none;\n}\n#game[data-scene=recess] .room-title h1 {\n  font-size: 22px;\n  margin: 3px 0;\n}\n#game[data-scene=recess] #scene-subtitle,\n#game[data-scene=recess] #day-label,\n#game[data-scene=recess] #room-connections {\n  display: none;\n}\n#game[data-scene=recess] .topbar {\n  background: #fff8ece8;\n  border-radius: 20px;\n  padding: 10px 18px;\n}\n#game[data-scene=recess] .cleanup-tip {\n  max-width: 70%;\n  background: #fff8ece6;\n  border-radius: 16px;\n  padding: 9px;\n}\n#game[data-scene=recess] #leave-recess {\n  top: 36px;\n  right: 44px;\n}\n@media (max-width: 600px) {\n  #game[data-scene=recess] .topbar {\n    left: 12px;\n    right: 12px;\n    padding: 9px 12px;\n  }\n  #game[data-scene=recess] .wordmark {\n    font-size: 20px;\n    gap: 6px;\n  }\n  #game[data-scene=recess] .wordmark .flower {\n    font-size: 29px;\n  }\n  #game[data-scene=recess] .wordmark small {\n    display: none;\n  }\n  #game[data-scene=recess] #leave-recess {\n    top: 28px;\n    right: 24px;\n    font-size: 11px;\n    padding: 9px 10px;\n  }\n  #game[data-scene=recess] .room-title {\n    top: 78px;\n    padding: 6px 12px;\n  }\n  #game[data-scene=recess] .room-title .eyebrow {\n    display: none;\n  }\n  #game[data-scene=recess] .room-title h1 {\n    font-size: 20px;\n    margin: 0;\n  }\n}\n\n/* src/ui/cleanup.css */\n.mission-stats {\n  display: flex;\n  flex-direction: column;\n  align-items: flex-end;\n  gap: 2px;\n}\n#mission-clock {\n  font-size: 23px;\n  font-weight: 800;\n  font-variant-numeric: tabular-nums;\n  letter-spacing: -1px;\n}\n#mission-clock.soon {\n  color: #b77795;\n}\n.allowance-label {\n  font-size: 7px;\n  letter-spacing: 1px;\n  color: #9581a8;\n}\n#allowance {\n  font-size: 13px;\n  color: #6e856c;\n  margin-left: 3px;\n}\n#task-count {\n  letter-spacing: 1px;\n  color: #6e856c;\n}\n.task-list {\n  display: flex;\n  list-style: none;\n  justify-content: center;\n  gap: 9px;\n  padding: 0;\n  margin: 6px 0 0;\n  height: 22px;\n}\n.task-list li {\n  display: flex;\n  align-items: center;\n  gap: 3px;\n  font-size: 9px;\n  color: #9784a6;\n  border-bottom: 2px solid transparent;\n}\n.task-list li > span:first-child {\n  font-size: 13px;\n}\n.task-list li.done {\n  color: #69866f;\n  border-color: #a6c5a6;\n}\n.task-list li.done > span:first-child {\n  color: #69866f;\n}\n.action-group {\n  pointer-events: auto;\n  text-align: center;\n}\n#action-button {\n  --hold-progress: 0deg;\n  width: 120px;\n  height: 120px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  flex-direction: column;\n  gap: 3px;\n  border: 3px solid #fff9;\n  border-radius: 50%;\n  background:\n    linear-gradient(\n      145deg,\n      #f6b5d0,\n      #d888b6);\n  box-shadow: 0 6px 0 #ad739441, 0 8px 22px #82709522;\n  color: #663f6a;\n  cursor: pointer;\n  touch-action: none;\n  padding: 8px;\n  font-family: inherit;\n  position: relative;\n  -webkit-user-select: none;\n  user-select: none;\n}\n#action-button:disabled {\n  background:\n    linear-gradient(\n      145deg,\n      #f7f1f9,\n      #ddd0e8);\n  color: #a38caf;\n  box-shadow: 0 4px 0 #a58db222;\n  cursor: default;\n}\n#action-button:not(:disabled):active {\n  box-shadow: 0 2px 0 #ad739441;\n}\n#action-button:focus-visible,\n#replay:focus-visible {\n  outline: 3px solid #7960a5;\n  outline-offset: 4px;\n}\n#action-button.holding {\n  background: conic-gradient(#97c6a0 var(--hold-progress), #ecc0dd 0deg);\n}\n#action-icon {\n  font-size: 26px;\n  line-height: 29px;\n}\n#action-title {\n  font-size: 15px;\n  line-height: 18px;\n}\n#action-detail {\n  font-size: 10px;\n  max-width: 100%;\n  line-height: 13px;\n}\n.cleanup-tip {\n  text-align: center;\n  width: calc(100% - 36px);\n  max-width: 460px;\n  justify-content: center;\n  font-size: 11px;\n  line-height: 16px;\n  color: #887298;\n  min-height: 32px;\n}\n#cleanup-effects {\n  position: absolute;\n  inset: 0;\n  pointer-events: none;\n  overflow: hidden;\n}\n.cleanup-marker {\n  position: absolute;\n  left: 0;\n  top: 0;\n  border-radius: 9px;\n  min-width: 22px;\n  padding: 3px 5px;\n  background: #fffaf2db;\n  border: 1px solid #fffc;\n  box-shadow: 0 2px 5px #62507722;\n  font-size: 13px;\n  line-height: 16px;\n  color: #775672;\n  will-change: transform;\n  white-space: nowrap;\n}\n.cleanup-marker[hidden] {\n  display: none;\n}\n.cleanup-marker.destination {\n  font-size: 16px !important;\n  border-radius: 50%;\n  padding: 7px !important;\n  box-shadow: 0 0 14px #fff2a8a0;\n}\n.cleanup-marker.offscreen::after {\n  content: "\\27a4";\n  position: absolute;\n  left: 50%;\n  top: 50%;\n  color: #fff1aa;\n  font-size: 17px;\n  text-shadow: 0 1px 3px #504760;\n  transform: translate(-50%, -50%) rotate(var(--guide-angle)) translateX(26px);\n}\n.cleanup-marker.tool {\n  font-size: 10px;\n}\n.cleanup-marker.nearby {\n  background: #fff0b9;\n  border-color: #fff;\n  box-shadow: 0 0 10px #fff3a4bb;\n}\n.cleanup-marker.destination {\n  background: #f5ffe7ed;\n  color: #547457;\n  font-size: 10px;\n  font-weight: 800;\n  padding: 5px 7px;\n  border: 2px solid #fff9;\n}\n.coin-popup {\n  position: absolute;\n  color: #63845d;\n  font-size: 22px;\n  font-weight: 800;\n  z-index: 2;\n  transform: translate(-50%, -100%);\n  animation: reward-rise .95s ease-out forwards;\n  text-shadow: 0 2px 0 #fff;\n}\n.coin-popup strong {\n  display: block;\n  padding: 3px 8px;\n  background: #fff9e4ed;\n  border-radius: 12px;\n}\n.coin-popup > span {\n  position: absolute;\n  left: 50%;\n  top: 50%;\n  color: #e9bd61;\n  font-size: 17px;\n  animation: sparkle .75s ease-out forwards;\n}\n@keyframes reward-rise {\n  0% {\n    opacity: 0;\n    margin-top: 0;\n  }\n  20% {\n    opacity: 1;\n  }\n  75% {\n    opacity: 1;\n  }\n  100% {\n    opacity: 0;\n    margin-top: -40px;\n  }\n}\n@keyframes sparkle {\n  from {\n    transform: translate(-50%, -50%) scale(.3);\n    opacity: 1;\n  }\n  to {\n    transform: translate(var(--spark-x), var(--spark-y)) scale(.7);\n    opacity: 0;\n  }\n}\n.sr-only {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  padding: 0;\n  margin: -1px;\n  clip-path: inset(50%);\n  overflow: hidden;\n  white-space: nowrap;\n}\n#results {\n  border: 2px solid #fff;\n  border-radius: 28px;\n  padding: 26px 22px 22px;\n  width: min(350px, calc(100% - 32px));\n  max-height: calc(100dvh - 32px);\n  overflow: auto;\n  background: #faf5fb;\n  color: #51466a;\n  text-align: center;\n  box-shadow: 0 16px 60px #55436140;\n}\n#results::backdrop {\n  background: #52416666;\n  backdrop-filter: blur(4px);\n}\n.results-flower {\n  font-size: 43px;\n  line-height: 1;\n  color: #af94cb;\n  margin-bottom: 16px;\n}\n#results .eyebrow {\n  font-size: 7px;\n  letter-spacing: 1.6px;\n}\n#results h2 {\n  margin: 12px 0 8px;\n  font-size: 30px;\n  letter-spacing: -1px;\n}\n#results-summary {\n  font-size: 12px;\n  line-height: 1.6;\n  color: #927d9e;\n}\n.results-totals {\n  display: flex;\n  justify-content: space-evenly;\n  padding: 14px 0;\n  margin: 12px 0 0;\n  background: #eee5f5;\n  border-radius: 17px;\n}\n.results-totals strong {\n  display: block;\n  font-size: 28px;\n}\n.results-totals span {\n  font-size: 10px;\n  color: #8e789f;\n}\n#results-money {\n  color: #708b6b;\n}\n#results-bonus {\n  font-size: 11px;\n  color: #788f6c;\n}\n#results-list {\n  list-style: none;\n  padding: 0;\n  display: flex;\n  justify-content: center;\n  flex-wrap: wrap;\n  gap: 6px 12px;\n  margin: 18px 0;\n  font-size: 10px;\n  color: #a58eb1;\n}\n#results-list .done {\n  color: #638269;\n}\n#replay {\n  width: 100%;\n  border: 2px solid #fff8;\n  border-radius: 17px;\n  padding: 15px;\n  background: #b3cea9;\n  color: #3b613f;\n  font:\n    800 16px "Trebuchet MS",\n    system-ui,\n    sans-serif;\n  box-shadow: 0 4px 0 #8caa8555;\n  cursor: pointer;\n  touch-action: manipulation;\n}\n#replay span {\n  margin-left: 7px;\n  font-size: 21px;\n}\n@media (max-width: 380px) {\n  .task-list {\n    gap: 6px;\n  }\n  .task-list li {\n    font-size: 8px;\n  }\n  #mission-clock {\n    font-size: 21px;\n  }\n  .allowance-label {\n    font-size: 6px;\n    letter-spacing: .5px;\n  }\n}\n@media (max-height: 650px) and (orientation: portrait), (orientation: landscape) and (max-height: 600px) {\n  #action-button {\n    width: 102px;\n    height: 102px;\n  }\n  #action-title {\n    font-size: 13px;\n  }\n  #action-icon {\n    font-size: 22px;\n    line-height: 24px;\n  }\n}\n@media (max-height: 740px) and (orientation: portrait) {\n  .task-list {\n    height: 18px;\n    margin-top: 2px;\n  }\n  .task-list li {\n    font-size: 8px;\n  }\n  .task-list li > span:first-child {\n    font-size: 11px;\n  }\n}\n@media (orientation: landscape) and (max-height: 600px) {\n  .task-list {\n    flex-wrap: wrap;\n    height: auto;\n    justify-content: flex-start;\n    max-width: 175px;\n    gap: 5px 10px;\n  }\n  #results {\n    padding: 12px 18px;\n  }\n  .results-flower {\n    display: none;\n  }\n  #results h2 {\n    font-size: 24px;\n    margin: 7px 0;\n  }\n  .results-totals {\n    padding: 7px 0;\n  }\n  #results-list {\n    margin: 10px 0;\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  .coin-popup {\n    animation: none;\n  }\n  .coin-popup > span {\n    display: none;\n  }\n}\n\n/* src/ui/collection.css */\n[hidden] {\n  display: none !important;\n}\n#collection-button {\n  pointer-events: auto;\n  border: 0;\n  background: transparent;\n  color: #78628f;\n  font:\n    700 10px "Trebuchet MS",\n    system-ui,\n    sans-serif;\n  cursor: pointer;\n  padding: 8px 0 8px 10px;\n}\n#collection-button:disabled {\n  opacity: .45;\n}\n#wallet {\n  margin-left: 4px;\n  color: #638269;\n}\n.loop-button {\n  width: 100%;\n  border: 2px solid #fff9;\n  border-radius: 16px;\n  padding: 13px;\n  background: #b3cea9;\n  color: #3b613f;\n  font:\n    800 15px "Trebuchet MS",\n    system-ui,\n    sans-serif;\n  cursor: pointer;\n  margin: 5px 0;\n  touch-action: manipulation;\n}\n.pink-button {\n  background: #e8b5d2;\n  color: #704b75;\n}\n.loop-button:disabled {\n  opacity: .55;\n  cursor: default;\n}\n#results-wallet {\n  font-size: 12px;\n  color: #6f8869;\n}\n#go-shopping {\n  margin-bottom: 10px;\n}\n#collection-dialog {\n  border: 2px solid #fff;\n  border-radius: 26px;\n  width: min(410px, calc(100% - 24px));\n  max-height: calc(100dvh - 24px);\n  padding: 22px 17px 17px;\n  overflow: auto;\n  background: #faf5fb;\n  color: #51466a;\n  text-align: center;\n}\n#collection-dialog::backdrop {\n  background: #52416688;\n  backdrop-filter: blur(4px);\n}\n#collection-dialog h2 {\n  margin: 10px 0 6px;\n  font-size: 28px;\n  letter-spacing: -1px;\n}\n#collection-summary {\n  font-size: 11px;\n  color: #947c9e;\n}\n#collection-grid {\n  display: grid;\n  grid-template-columns: repeat(4, minmax(0, 1fr));\n  gap: 7px;\n  margin: 17px 0;\n}\n.dumpling-card {\n  background: #efe7f4;\n  border: 1px solid #fff;\n  border-radius: 14px;\n  padding: 6px 2px 9px;\n  min-width: 0;\n}\n.dumpling-card.owned {\n  background: linear-gradient(#fff9, var(--rarity));\n}\n.dumpling-card img {\n  width: 100%;\n  height: auto;\n  display: block;\n}\n.dumpling-card strong {\n  font-size: 10px;\n  display: block;\n}\n.dumpling-card small {\n  display: block;\n  font-size: 8px;\n  margin-top: 3px;\n}\n.dumpling-card .copies {\n  font-size: 10px;\n  font-weight: 800;\n  margin-top: 5px;\n}\n#store-markers {\n  position: absolute;\n  inset: 0;\n  pointer-events: none;\n}\n#shop-display-marker {\n  background: #f5ffe7ed;\n  color: #547457;\n  font-size: 10px;\n  font-weight: 800;\n  padding: 5px 7px;\n  border: 2px solid #fff9;\n}\n#reveal-copy {\n  position: absolute;\n  top: 71%;\n  left: 6%;\n  width: 88%;\n  text-align: center;\n  color: var(--rarity-ink,#775887);\n  font-size: 13px;\n  pointer-events: none;\n}\n.reveal-badges {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 6px;\n}\n#reveal-copy small {\n  color: var(--rarity-ink,#665070);\n  padding: 5px 10px;\n  border: 1px solid var(--rarity,#dacbdf);\n  border-radius: 20px;\n  background: var(--rarity-wash,#f4edf5);\n  font-size: 11px;\n  line-height: 1.2;\n  font-weight: 800;\n  letter-spacing: .4px;\n}\n#reveal-copy .reveal-status {\n  background: #fffc;\n  border-color: #fff;\n  color: #64556c;\n}\n#reveal-copy h2 {\n  margin: 7px 0 4px;\n  font-size: 32px;\n  line-height: 1.1;\n  letter-spacing: -.8px;\n}\n#reveal-copy p {\n  font-size: 11px;\n  margin: 0;\n  color: #74647e;\n}\n#reveal-copy[data-rarity=Legendary] .reveal-rarity {\n  box-shadow: 0 0 0 2px #fff8, 0 2px 10px #dbb14b30;\n}\n#reveal-copy.has-reveal {\n  animation: reveal-caption .4s ease-out;\n}\n@keyframes reveal-caption {\n  from {\n    transform: translateY(6px);\n    opacity: 0;\n  }\n  to {\n    transform: translateY(0);\n    opacity: 1;\n  }\n}\n#save-message {\n  position: absolute;\n  bottom: 26%;\n  left: 8%;\n  width: 84%;\n  padding: 12px;\n  border-radius: 14px;\n  background: #fff5de;\n  color: #796143;\n  font-size: 12px;\n  text-align: center;\n  z-index: 8;\n  pointer-events: none;\n}\n#game[data-scene=home] .joystick-group {\n  visibility: hidden;\n}\n#game[data-scene=home] .cleanup-tip {\n  display: none;\n}\n#squish-friend {\n  position: absolute;\n  left: 8%;\n  bottom: 12%;\n  min-width: 100px;\n  min-height: 48px;\n  padding: 12px 20px;\n  border: 2px solid #fff;\n  border-radius: 25px;\n  background: #f1d6dd;\n  color: #795268;\n  font: 800 16px "Trebuchet MS", sans-serif;\n  box-shadow: 0 4px 12px #75534a15;\n  cursor: pointer;\n  touch-action: manipulation;\n}\n#home-vignette {\n  position: absolute;\n  inset: 0;\n  pointer-events: none;\n  background:\n    linear-gradient(\n      #ede6f4ed,\n      transparent 29%,\n      transparent 75%,\n      #ede6f4dd);\n}\n#trip-wallet {\n  font-size: 8px;\n  letter-spacing: 1px;\n  color: #887298;\n  text-align: right;\n}\n#trip-balance {\n  display: block;\n  font-size: 24px;\n  letter-spacing: -1px;\n  color: #638269;\n}\n#reveal-copy {\n  isolation: isolate;\n}\n#game[data-scene=home] .topbar,\n#game[data-scene=home] .room-title,\n#game[data-scene=home] footer {\n  text-shadow: 0 1px 8px #fff;\n}\n@media (max-height: 740px) {\n  #reveal-copy {\n    top: 68%;\n  }\n  #reveal-copy h2 {\n    font-size: 27px;\n  }\n  #collection-dialog {\n    padding-top: 15px;\n  }\n  #collection-grid {\n    margin: 10px 0;\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  #reveal-copy.has-reveal {\n    animation: none;\n  }\n}\n#game[data-scene=home] .controls {\n  bottom: max(70px, calc(54px + env(safe-area-inset-bottom)));\n  right: 18px;\n  justify-content: flex-end;\n}\n#game[data-scene=home] .joystick-group,\n#game[data-scene=home] .control-label {\n  display: none;\n}\n#game[data-scene=home] #action-button {\n  width: 136px;\n  height: 48px;\n  border-radius: 25px;\n  display: flex;\n  flex-direction: row;\n  align-items: center;\n  justify-content: center;\n  gap: 8px;\n}\n#game[data-scene=home] #action-icon {\n  font-size: 20px;\n  margin: 0;\n}\n#game[data-scene=home] #action-title {\n  font-size: 13px;\n  margin: 0;\n}\n#game[data-scene=home] #action-detail {\n  display: none;\n}\n#game[data-scene=home] #squish-friend {\n  bottom: max(70px, calc(54px + env(safe-area-inset-bottom)));\n  left: 18px;\n  min-width: 130px;\n  font-size: 14px;\n}\nbody:has(#game[data-scene=home]) .dev-launch {\n  top: 77px;\n  right: 18px;\n  left: auto;\n  bottom: auto;\n  transform: none;\n  min-width: 60px;\n}\n@media (max-height: 650px) {\n  #game[data-scene=home] .room-title {\n    top: 83px;\n    left: 20px;\n    right: 88px;\n    text-align: left;\n  }\n  #game[data-scene=home] .room-title .eyebrow,\n  #game[data-scene=home] #day-label {\n    display: none;\n  }\n  #game[data-scene=home] .room-title h1 {\n    font-size: 20px;\n    margin: 2px 0 4px;\n  }\n  #game[data-scene=home] .room-title p {\n    margin: 0;\n    font-size: 10px;\n  }\n  #game[data-scene=home] #reveal-copy {\n    top: 64%;\n  }\n  #game[data-scene=home] #reveal-copy h2 {\n    margin: 7px 0 3px;\n    font-size: 24px;\n  }\n  #game[data-scene=home] #reveal-copy small {\n    font-size: 10px;\n    padding: 4px 8px;\n  }\n  #game[data-scene=home] #reveal-copy p {\n    font-size: 10px;\n  }\n}\n#collection-actions {\n  position: sticky;\n  top: -1px;\n  z-index: 2;\n  background: #faf5fb;\n  padding: 4px 0;\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 5px;\n}\n#collection-actions .loop-button {\n  font-size: 12px;\n  padding: 10px 5px;\n  margin: 0;\n  min-height: 44px;\n}\n#collection-actions #open-next {\n  grid-column: 1/-1;\n}\n#reveal-copy {\n  background: #fff9;\n  border-radius: 18px;\n  padding: 8px;\n  left: 8%;\n  width: 84%;\n}\n#home-vignette {\n  background:\n    linear-gradient(\n      #ede6f4a0,\n      transparent 25%,\n      transparent 70%,\n      #ede6f4a0);\n}\n#game[data-scene=home] #home-vignette {\n  background:\n    linear-gradient(\n      180deg,\n      #21112465,\n      transparent 27%,\n      transparent 65%,\n      #21112450);\n}\n#game[data-scene=home] .room-title,\n#game[data-scene=home] .topbar,\n#game[data-scene=home] footer {\n  color: #fff7ee;\n  text-shadow: 0 2px 5px #341c40;\n}\n#game[data-scene=home] #reveal-copy {\n  background: #fff8f0ed;\n  box-shadow: 0 5px 24px #49254920;\n}\n#game[data-scene=home] #reveal-copy {\n  top: auto;\n  bottom: 140px;\n}\n@media (max-height: 650px) {\n  #game[data-scene=home] #reveal-copy {\n    top: auto;\n    bottom: 132px;\n    padding: 6px;\n  }\n  #game[data-scene=home] #reveal-copy h2 {\n    font-size: 20px;\n    margin: 5px 0 3px;\n  }\n}\n#game[data-scene=home] #reveal-copy {\n  width: min(84%, 380px);\n  left: 50%;\n  translate: -50% 0;\n}\n@media (min-height: 651px) {\n  #game[data-scene=home] #reveal-copy {\n    bottom: 125px;\n  }\n}\n\n/* src/ui/house.css */\n#mission-picker {\n  display: flex;\n  gap: 5px;\n  justify-content: center;\n  margin: 9px auto 0;\n  pointer-events: auto;\n}\n#mission-picker button {\n  border: 1px solid #fff9;\n  border-radius: 12px;\n  background: #f6f0f9db;\n  padding: 5px 10px;\n  color: #8c739d;\n  font:\n    700 10px "Trebuchet MS",\n    system-ui,\n    sans-serif;\n  cursor: pointer;\n  touch-action: manipulation;\n}\n#mission-picker button[aria-pressed=true] {\n  color: #614d7c;\n  background: #d6c4e8;\n}\n#mission-picker button:disabled {\n  opacity: .65;\n  cursor: default;\n}\n#room-connections {\n  margin: 7px 12px 0;\n  font-size: 10px;\n  color: #816b90;\n}\n#house-doors {\n  position: absolute;\n  inset: 0;\n  pointer-events: none;\n}\n.door-label {\n  position: absolute;\n  left: 0;\n  top: 0;\n  white-space: nowrap;\n  padding: 3px 6px;\n  font-size: 9px;\n  font-weight: 700;\n  color: #756085;\n  background: #fff6e7dc;\n  border: 1px solid #fff8;\n  border-radius: 7px;\n}\n.room-title {\n  text-shadow: 0 1px 6px #ede6f4;\n}\n#game[data-mission=practice] #task-count {\n  font-size: 9px;\n}\n@media (max-height: 740px) and (orientation: portrait) {\n  #mission-picker {\n    margin-top: 5px;\n  }\n  #mission-picker button {\n    padding: 4px 8px;\n    font-size: 9px;\n  }\n  #room-connections {\n    margin-top: 4px;\n    font-size: 9px;\n  }\n}\n@media (orientation: landscape) and (max-height: 600px) {\n  #mission-picker {\n    justify-content: flex-start;\n    flex-wrap: wrap;\n    width: 180px;\n    margin-left: 0;\n  }\n  #room-connections {\n    max-width: 165px;\n    margin-left: 0;\n  }\n}\n#game[data-scene=cleanup] .topbar {\n  top: max(12px, env(safe-area-inset-top));\n  left: 16px;\n  right: 16px;\n  padding: 10px 13px;\n  border: 1px solid #fff9;\n  border-radius: 20px;\n  background: #fff9efed;\n  box-shadow: 0 4px 20px #66564412;\n}\n#game[data-scene=cleanup] .wordmark {\n  font-size: 22px;\n}\n#game[data-scene=cleanup] .wordmark small {\n  font-size: 6px;\n}\n#game[data-scene=cleanup] .flower {\n  font-size: 34px;\n}\n#game[data-scene=cleanup] .room-title {\n  top: 96px;\n  padding: 0 14px;\n  text-align: left;\n  width: 100%;\n}\n#game[data-scene=cleanup] .eyebrow {\n  justify-content: flex-start;\n  font-size: 8px;\n  letter-spacing: 1.1px;\n  color: #5c6e52;\n}\n#game[data-scene=cleanup] h1 {\n  font-size: 21px;\n  margin: 5px 0;\n  letter-spacing: -.6px;\n}\n#game[data-scene=cleanup] .task-list {\n  justify-content: flex-start;\n  background: #fff8efdc;\n  border-radius: 9px;\n  padding: 4px 7px;\n  width: max-content;\n  max-width: 100%;\n  height: auto;\n}\n#game[data-scene=cleanup] #mission-picker {\n  justify-content: flex-start;\n  margin: 7px 0 0;\n}\n#game[data-scene=cleanup] #room-connections {\n  display: none;\n}\n#game[data-scene=cleanup] .player-label {\n  font-size: 9px;\n  padding: 3px 7px;\n}\n#game[data-scene=cleanup] .controls {\n  bottom: max(40px, calc(env(safe-area-inset-bottom) + 24px));\n  left: 20px;\n  right: 20px;\n}\n#game[data-scene=cleanup] .control-label {\n  color: #50624c;\n  text-shadow: 0 1px 3px #ffff;\n}\n#game[data-scene=cleanup] #cleanup-hint {\n  background: #fff9efed;\n  width: calc(100% - 32px);\n  left: 16px;\n  padding: 7px 10px;\n  border-radius: 12px;\n  color: #596651;\n  bottom: calc(max(40px, env(safe-area-inset-bottom)) + 150px);\n  font-size: 10px;\n}\n#game[data-scene=cleanup] footer {\n  left: 16px;\n  right: 16px;\n  background: #fff9efed;\n  padding: 5px 9px;\n  border-radius: 12px;\n  bottom: 8px;\n  color: #6c795e;\n}\n@media (max-height: 740px) and (orientation: portrait) {\n  #game[data-scene=cleanup] .room-title {\n    top: 85px;\n  }\n  #game[data-scene=cleanup] h1 {\n    display: none;\n  }\n  #game[data-scene=cleanup] #mission-picker {\n    margin-top: 5px;\n  }\n  #game[data-scene=cleanup] #cleanup-hint {\n    bottom: calc(max(36px, env(safe-area-inset-bottom)) + 144px);\n    font-size: 9px;\n  }\n}\n@media (orientation: landscape) and (max-height: 600px) {\n  #game[data-scene=cleanup] .topbar {\n    width: 235px;\n  }\n  #game[data-scene=cleanup] .room-title {\n    top: 95px;\n    width: 210px;\n  }\n  #game[data-scene=cleanup] h1 {\n    display: none;\n  }\n  #game[data-scene=cleanup] .task-list {\n    flex-wrap: wrap;\n  }\n  #game[data-scene=cleanup] #cleanup-hint {\n    width: 40%;\n    left: 30%;\n    bottom: 12px;\n  }\n  #game[data-scene=cleanup] footer {\n    display: flex;\n    flex-wrap: wrap;\n    top: 12px;\n    bottom: auto;\n    left: 270px;\n    right: 16px;\n    justify-content: flex-end;\n  }\n}\n.asset-credits {\n  color: inherit;\n  font-size: 9px;\n  text-decoration: none;\n  padding: 5px;\n}\n#day-label {\n  margin: 5px 0;\n  font-size: 11px;\n  font-weight: 700;\n  color: #667b5b;\n  text-transform: capitalize;\n}\n#mission-picker {\n  flex-wrap: wrap;\n}\n#game[data-mission=day] .task-list {\n  flex-wrap: wrap;\n  font-size: 9px;\n}\n#game[data-mission=day] #mission-clock {\n  font-size: 19px;\n  white-space: nowrap;\n}\n#school-transition {\n  position: absolute;\n  z-index: 30;\n  inset: 0;\n  background: #f6eafaed;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  flex-direction: column;\n  color: #65517b;\n}\n#school-transition[hidden] {\n  display: none;\n}\n#school-transition span {\n  font-size: 64px;\n}\n.lilah-label {\n  position: absolute;\n  top: 0;\n  left: 0;\n  max-width: 165px;\n  padding: 7px 10px;\n  border-radius: 15px 15px 15px 3px;\n  background: #fff2ceeF;\n  color: #735978;\n  font-size: 12px;\n  font-weight: 700;\n  pointer-events: none;\n  box-shadow: 0 3px 12px #7c627525;\n  z-index: 5;\n  text-align: center;\n}\n.lilah-label[hidden] {\n  display: none;\n}\n.marc-label {\n  background: #e7f0e4ef;\n  color: #4f655c;\n}\n#player-label,\n#house-doors,\n#room-connections {\n  display: none !important;\n}\n#game[data-scene=cleanup] .room-title h1 {\n  display: none;\n}\n#game[data-scene=store] .topbar {\n  top: max(12px, env(safe-area-inset-top));\n  left: 16px;\n  right: 16px;\n  padding: 10px 13px;\n  border-radius: 20px;\n  background: #fff9efed;\n}\n#game[data-scene=store] .wordmark {\n  font-size: 22px;\n}\n#game[data-scene=store] .wordmark small {\n  font-size: 6px;\n}\n#game[data-scene=store] .flower {\n  font-size: 34px;\n}\n#game[data-scene=store] .room-title {\n  top: 96px;\n  padding: 0 14px;\n  text-align: left;\n  width: 100%;\n}\n#game[data-scene=store] .eyebrow {\n  justify-content: flex-start;\n  font-size: 8px;\n  letter-spacing: 1px;\n}\n#game[data-scene=store] h1 {\n  font-size: 21px;\n  margin: 5px 0;\n}\n#game[data-scene=store] #scene-subtitle {\n  font-size: 11px;\n}\n@media (orientation: landscape) and (max-height: 600px) {\n  #game[data-scene=store] .topbar {\n    width: 235px;\n  }\n  #game[data-scene=store] .room-title {\n    width: 210px;\n  }\n}\n#bedtime-fade {\n  position: absolute;\n  inset: 0;\n  background: #161325;\n  z-index: 80;\n  pointer-events: none;\n}\n#house-effects {\n  pointer-events: auto;\n  border: 0;\n  background: transparent;\n  color: #78628f;\n  font: 700 10px "Trebuchet MS", sans-serif;\n  min-height: 36px;\n  cursor: pointer;\n  padding: 4px 6px;\n}\n\n/* src/dev/developer-panel.css */\n.dev-launch,\n.dev-inline {\n  font: 800 11px/1.2 system-ui, sans-serif !important;\n  letter-spacing: .08em;\n  background: #27263c !important;\n  color: #e6dcff !important;\n  border: 1px solid #b9a4e8 !important;\n  border-radius: 12px !important;\n  min-height: 44px;\n  min-width: 44px;\n  padding: 10px !important;\n  cursor: pointer;\n}\n.dev-launch {\n  position: fixed;\n  z-index: 90;\n  bottom: 64px;\n  left: 50%;\n  transform: translateX(-50%);\n  box-shadow: 0 4px 18px #29223a40;\n}\n.dev-launch {\n  bottom: calc(64px + env(safe-area-inset-bottom, 0px));\n}\n#developer-panel {\n  height: min(850px, calc(100dvh - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)));\n}\n.dev-inline {\n  margin: 6px;\n  flex-shrink: 0;\n}\n.pop-title .dev-inline {\n  font-size: 9px !important;\n  letter-spacing: 0;\n  margin: 0;\n  min-width: 38px;\n  padding: 5px !important;\n}\n#developer-panel {\n  width: min(720px, calc(100vw - 24px));\n  max-width: none;\n  max-height: none;\n  height: min(850px, calc(100dvh - 24px));\n  margin: auto;\n  padding: 0;\n  overflow: hidden;\n  border: 1px solid #b6a4d764;\n  border-radius: 24px;\n  background: #181926;\n  color: #eeeaf8;\n  box-shadow: 0 28px 100px #100c23a6;\n  font: 14px/1.45 system-ui, sans-serif;\n  text-align: left;\n}\n#developer-panel::backdrop {\n  background: #121020a6;\n  backdrop-filter: blur(5px);\n}\n#developer-panel * {\n  box-sizing: border-box;\n}\n#developer-panel [hidden] {\n  display: none !important;\n}\n#developer-panel .dev-shell {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  min-height: 0;\n}\n#developer-panel button {\n  font: 650 13px/1.35 system-ui, sans-serif;\n  cursor: pointer;\n  min-height: 44px;\n  border: 1px solid #494458;\n  background: #303043;\n  color: #f3efff;\n  border-radius: 12px;\n  padding: 11px 13px;\n  box-shadow: none;\n  text-transform: none;\n  letter-spacing: 0;\n  transition: background .12s;\n}\n#developer-panel button:hover {\n  background: #414057;\n}\n#developer-panel button:focus-visible,\n#developer-panel select:focus-visible {\n  outline: 3px solid #d1bcff;\n  outline-offset: 2px;\n}\n#developer-panel button:disabled {\n  opacity: .4;\n  cursor: not-allowed;\n}\n#developer-panel button[aria-pressed=true] {\n  background: #b5dccc;\n  color: #1d3830;\n  border-color: #b5dccc;\n}\n#developer-panel .dev-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-start;\n  padding: 24px 26px 16px;\n  background:\n    radial-gradient(\n      ellipse at 90% 10%,\n      #76588b45,\n      transparent 60%);\n}\n#developer-panel .dev-eyebrow {\n  color: #c0b7d5;\n  font-size: 10px;\n  font-weight: 800;\n  letter-spacing: .16em;\n  display: flex;\n  align-items: center;\n  gap: 7px;\n}\n#developer-panel .dev-eyebrow i {\n  width: 7px;\n  height: 7px;\n  border-radius: 50%;\n  background: #aaddc4;\n  box-shadow: 0 0 12px #aaddc440;\n}\n#developer-panel h2 {\n  color: #f5f0ff;\n  font-size: 29px;\n  letter-spacing: -1px;\n  margin: 5px 0 2px;\n  font-weight: 750;\n}\n#developer-panel h2 span {\n  color: #d9baf5;\n  margin-left: 10px;\n}\n#developer-panel .dev-header p {\n  color: #b7afc8;\n  margin: 0;\n  font-size: 12px;\n}\n#developer-panel .dev-close {\n  font-size: 25px;\n  padding: 2px;\n  width: 44px;\n  background: #ffffff08;\n  border-color: #ffffff20;\n}\n#developer-panel .dev-live {\n  display: flex;\n  gap: 8px;\n  flex-wrap: wrap;\n  padding: 0 26px 16px;\n  color: #d2cddd;\n  font-size: 11px;\n}\n#developer-panel .dev-live span {\n  padding: 5px 9px;\n  border: 1px solid #ffffff15;\n  border-radius: 7px;\n  background: #ffffff05;\n}\n#developer-panel .dev-tabs {\n  display: grid;\n  grid-template-columns: repeat(4, 1fr);\n  gap: 4px;\n  border-block: 1px solid #ffffff12;\n  padding: 6px 20px;\n  background: #20202e;\n}\n#developer-panel .dev-tabs button {\n  background: transparent;\n  border-color: transparent;\n  color: #aaa2bc;\n  border-radius: 9px;\n  padding: 10px 4px;\n  font-size: 12px;\n}\n#developer-panel .dev-tabs button[aria-selected=true] {\n  background: #cab7ea;\n  color: #302640;\n}\n#developer-panel .dev-content {\n  overflow-y: auto;\n  min-height: 0;\n  padding: 20px 26px;\n  flex: 1;\n  overscroll-behavior: contain;\n  scrollbar-width: thin;\n  scrollbar-color: #6b597f transparent;\n}\n#developer-panel .dev-hero {\n  display: flex;\n  align-items: center;\n  gap: 16px;\n  width: 100%;\n  padding: 22px 18px;\n  text-align: left;\n  background:\n    linear-gradient(\n      120deg,\n      #d7c6f2,\n      #efc8da);\n  border: 0;\n  color: #392e4b;\n  margin-bottom: 16px;\n}\n#developer-panel .dev-hero:hover {\n  background:\n    linear-gradient(\n      120deg,\n      #e2d5f8,\n      #f6d8e5);\n}\n#developer-panel .dev-hero-icon {\n  font-size: 38px;\n  line-height: 1;\n}\n#developer-panel .dev-hero small {\n  display: block;\n  letter-spacing: .13em;\n  font-size: 9px;\n  font-weight: 800;\n  opacity: .75;\n}\n#developer-panel .dev-hero strong {\n  display: block;\n  font-size: 22px;\n  letter-spacing: -.6px;\n  margin: 3px 0;\n}\n#developer-panel .dev-hero span span {\n  display: block;\n  font-size: 11px;\n  font-weight: 500;\n}\n#developer-panel .dev-hero b {\n  font-size: 25px;\n  margin-left: auto;\n}\n#developer-panel .dev-card {\n  background: #232333;\n  border: 1px solid #ffffff10;\n  border-radius: 16px;\n  padding: 18px;\n  margin-bottom: 14px;\n}\n#developer-panel h3 {\n  font-size: 15px;\n  margin: 0 0 8px;\n  color: #f0eafa;\n  font-weight: 700;\n}\n#developer-panel p {\n  color: #b8b0c9;\n  font-size: 12px;\n  margin: 0 0 13px;\n  line-height: 1.55;\n}\n#developer-panel .dev-card > p:last-child {\n  margin: 12px 0 0;\n}\n#developer-panel .dev-grid {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 8px;\n}\n#developer-panel .dev-grid button {\n  text-align: left;\n}\n#developer-panel .dev-select-label {\n  display: block;\n  font-size: 11px;\n  color: #b9b1ca;\n  margin: 15px 0 6px;\n}\n#developer-panel select {\n  display: block;\n  width: 100%;\n  border: 1px solid #58506b;\n  background: #181926;\n  color: #eeeaf8;\n  border-radius: 10px;\n  min-height: 44px;\n  padding: 10px;\n  margin-bottom: 8px;\n  font: 13px system-ui, sans-serif;\n}\n#developer-panel .dev-notice {\n  padding: 16px;\n  border-radius: 14px;\n  background: #30342f;\n  border: 1px solid #b8d4bb30;\n  margin-bottom: 14px;\n  color: #c8e5d1;\n}\n#developer-panel .dev-notice strong {\n  font-size: 12px;\n}\n#developer-panel .dev-notice p {\n  margin: 6px 0 0;\n  color: #b4c2b6;\n}\n#developer-panel .dev-resume {\n  width: 100%;\n  background: #cab7ea;\n  color: #302640;\n}\n#developer-panel .dev-danger {\n  color: #ffc4bf;\n  border-color: #965e6455;\n}\n#developer-panel pre {\n  white-space: pre-wrap;\n  font: 11px/1.8 ui-monospace, monospace;\n  color: #bbb4cd;\n  margin: 16px 0 0;\n  overflow-wrap: anywhere;\n}\n#developer-panel .dev-bottom {\n  padding: 13px 26px 15px;\n  border-top: 1px solid #ffffff12;\n  background: #20202e;\n}\n#developer-panel .dev-bottom > span {\n  display: block;\n  font-size: 11px;\n  color: #bce1cd;\n}\n#developer-panel .dev-bottom small {\n  display: block;\n  font-size: 10px;\n  color: #aaa1bc;\n  margin-top: 3px;\n}\n#developer-panel [data-status] {\n  font-size: 11px;\n  color: #d6c4f3;\n  margin-top: 8px;\n}\n#developer-panel [data-status][data-error=true] {\n  color: #ffc1b7;\n}\n@media (max-width: 480px) {\n  #developer-panel {\n    width: calc(100vw - 12px);\n    height: calc(100dvh - 12px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));\n    border-radius: 18px;\n  }\n  #developer-panel .dev-header {\n    padding: 17px 16px 12px;\n  }\n  #developer-panel h2 {\n    font-size: 25px;\n  }\n  #developer-panel .dev-live {\n    padding: 0 16px 12px;\n    gap: 5px;\n  }\n  #developer-panel .dev-tabs {\n    padding: 5px 10px;\n  }\n  #developer-panel .dev-content {\n    padding: 14px;\n  }\n  #developer-panel .dev-card {\n    padding: 14px;\n  }\n  #developer-panel .dev-bottom {\n    padding: 11px 16px;\n  }\n  #developer-panel .dev-hero {\n    padding: 16px 13px;\n    gap: 10px;\n  }\n  #developer-panel .dev-hero strong {\n    font-size: 20px;\n  }\n  #developer-panel .dev-hero-icon {\n    font-size: 28px;\n  }\n  #developer-panel .dev-grid button {\n    font-size: 12px;\n    padding: 10px;\n  }\n  #developer-panel .dev-bottom small {\n    font-size: 9px;\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  #developer-panel button {\n    transition: none;\n  }\n}\n#developer-panel .dev-bottom {\n  position: static;\n  display: block;\n  flex-shrink: 0;\n  letter-spacing: 0;\n  pointer-events: auto;\n}\n#squishy-pop:has(.dev-inline) .pop-footer {\n  display: block;\n}\n#squishy-pop .pop-title .dev-inline {\n  background: #27263c !important;\n  color: #e6dcff !important;\n}\n';

// src/editor/FullGame.ts
async function startEditorGame(app) {
  window.__editorMode = true;
  useEditorAssets(app);
  const style = document.createElement("style");
  style.textContent = local_default + "\nhtml,body{margin:0;width:100%;height:100%;overflow:hidden}";
  document.head.append(style);
  const icon = document.createElement("link");
  icon.rel = "icon";
  icon.href = "data:,";
  document.head.append(icon);
  const parsed = new DOMParser().parseFromString(index_default, "text/html"), game = parsed.querySelector("#game");
  const canvas = app.graphicsDevice.canvas;
  canvas.id = "game-canvas";
  canvas.style.cssText = "";
  game.querySelector("canvas").replaceWith(canvas);
  document.body.append(game);
  const credits = game.querySelector(".asset-credits");
  credits.href = assetUrl("assets/asset-credits.html");
  const { startGame: startGame2 } = await Promise.resolve().then(() => (init_main(), main_exports));
  await startGame2(app);
}
class FullGame extends Script {
  static scriptName = "fullGame";
  initialize() {
    void startEditorGame(this.app).catch((e) => {
      console.error("Full game migration failed", e);
      const error = document.querySelector("#error");
      if (error) error.hidden = false;
    });
  }
};
export {
  FullGame,
  startEditorGame
};
