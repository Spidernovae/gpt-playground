// Three.js via esm.sh to avoid bare import issues in example modules
import * as THREE from 'https://esm.sh/three@0.161.0';
import { OrbitControls } from 'https://esm.sh/three@0.161.0/examples/jsm/controls/OrbitControls.js';
import { resumeData } from './resumeData.js';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0b1020, 0.012);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 6, 18);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(0, 2.6, 0);

// Lights
scene.add(new THREE.AmbientLight(0xbadfff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 1.0);
dir.position.set(8, 16, 8);
dir.castShadow = false;
scene.add(dir);

// Starfield backdrop
const starGeo = new THREE.BufferGeometry();
const starCount = 600;
const positions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  positions[i * 3 + 0] = (Math.random() - 0.5) * 300;
  positions[i * 3 + 1] = Math.random() * 140 + 10;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 300;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const stars = new THREE.Points(
  starGeo,
  new THREE.PointsMaterial({ color: 0x9ec5ff, size: 0.8, sizeAttenuation: true })
);
scene.add(stars);

// Ground plane (subtle)
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(150, 64),
  new THREE.MeshPhongMaterial({ color: 0x0e1430, emissive: 0x06091a, side: THREE.DoubleSide })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
scene.add(ground);

// Utilities
function makeLabelSprite(text, color = '#ffffff') {
  const pad = 12; const fontSize = 38; const font = 'bold ' + fontSize + 'px Inter, Arial Black, system-ui';
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2;
  const h = fontSize + pad * 2;
  ctx.canvas.width = w; ctx.canvas.height = h;
  // redraw after resize
  ctx.font = font; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(15,21,48,0.9)';
  ctx.strokeStyle = '#2b335b';
  ctx.lineWidth = 4; const r = 16;
  // rounded rect
  ctx.beginPath();
  ctx.moveTo(r, 0); ctx.lineTo(w - r, 0); ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r); ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(r, h); ctx.quadraticCurveTo(0, h, 0, h - r);
  ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = color; ctx.fillText(text, w / 2, h / 2 + 1);
  const tex = new THREE.CanvasTexture(ctx.canvas);
  tex.anisotropy = 4; tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(w / 80, h / 80, 1);
  return sprite;
}

function ringGlow(radius = 5, color = 0x7cf9d2) {
  const geo = new THREE.RingGeometry(radius * 0.95, radius, 64);
  const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
  const mesh = new THREE.Mesh(geo, mat); mesh.rotation.x = -Math.PI / 2; mesh.position.y = 0.02; return mesh;
}

function makeTrophy(color = 0xffd166) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.2, 0.4, 24), new THREE.MeshStandardMaterial({ color: 0x8c6b3e, metalness: .6, roughness: .4 }));
  base.position.y = 0.2; g.add(base);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.4, 1.2, 24, 1, true), new THREE.MeshStandardMaterial({ color, metalness: .9, roughness: .2, side: THREE.DoubleSide }));
  cup.position.y = 1.2; g.add(cup);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.06, 12, 40), new THREE.MeshStandardMaterial({ color }));
  rim.position.y = 1.8; g.add(rim);
  return g;
}

function makeLaptop() {
  const g = new THREE.Group();
  const screen = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1, 0.06), new THREE.MeshStandardMaterial({ color: 0x111a33, emissive: 0x0e204a, metalness: .2, roughness: .6 }));
  screen.position.set(0, 1.1, 0);
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 1.2), new THREE.MeshStandardMaterial({ color: 0x0f1530, metalness: .4, roughness: .4 }));
  base.position.set(0, 0.55, 0.32);
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 18), new THREE.MeshStandardMaterial({ color: 0x7cf9d2 }));
  hinge.rotation.z = Math.PI / 2; hinge.position.set(0, 0.58, -0.25);
  g.add(screen, base, hinge);
  return g;
}

function makeBlocks() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x6aa9ff, roughness: .4, metalness: .3 });
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), mat.clone());
    m.position.set((Math.random() - .5) * 2, 0.3 + i * 0.02, (Math.random() - .5) * 2);
    m.rotation.set(Math.random() * 0.2, Math.random() * 0.2, Math.random() * 0.2);
    g.add(m);
  }
  return g;
}

function makeIsland({ name, position, color, radius = 5, propFactory }) {
  const group = new THREE.Group(); group.name = name;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.06, 0.6, 48), new THREE.MeshStandardMaterial({ color, roughness: .6, metalness: .1 }));
  top.position.y = 0.3; group.add(top);
  const label = makeLabelSprite(name, '#7cf9d2'); label.position.set(0, 1.8, 0); group.add(label);
  const ring = ringGlow(radius, 0x7cf9d2); group.add(ring);
  const prop = propFactory ? propFactory() : new THREE.AxesHelper(2); prop.position.y = 0.6; group.add(prop);
  group.position.copy(position);
  // Area for raycasting
  // Invisible-but-raycastable hit area (material must be visible for raycast)
  const hit = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 1.6, 24),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0, depthWrite: false })
  );
  hit.position.y = 0.8; group.add(hit); group.userData.hit = hit;
  scene.add(group);
  return group;
}

const islands = new Map();
islands.set('Experience', makeIsland({ name: 'Experience', position: new THREE.Vector3(0, 0, 0), color: 0x18224b, radius: 5, propFactory: makeLaptop }));
islands.set('Projects', makeIsland({ name: 'Projects', position: new THREE.Vector3(12, 0, -16), color: 0x1a2a5c, radius: 4.5, propFactory: makeBlocks }));
islands.set('Certifications', makeIsland({ name: 'Certifications', position: new THREE.Vector3(-14, 0, -10), color: 0x1a244f, radius: 4.5, propFactory: makeTrophy }));

// Update brand from data
document.getElementById('brandName').textContent = resumeData.hero.name;
document.getElementById('brandRole').textContent = resumeData.hero.role;

// Camera tweening
let tween = null;
function tweenCamera(toPos, toTarget, duration = 1400) {
  const fromPos = camera.position.clone();
  const fromTarget = controls.target.clone();
  const start = performance.now();
  tween = { stop: false };
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
  function step(now) {
    if (tween.stop) return;
    const t = Math.min(1, (now - start) / duration);
    const e = easeInOut(t);
    camera.position.lerpVectors(fromPos, toPos, e);
    controls.target.lerpVectors(fromTarget, toTarget, e);
    if (t < 1) requestAnimationFrame(step);
    else tween = null;
  }
  requestAnimationFrame(step);
}

function travelTo(name) {
  const g = islands.get(name); if (!g) return;
  const target = new THREE.Vector3().copy(g.position).add(new THREE.Vector3(0, 1.6, 0));
  const pos = new THREE.Vector3().copy(g.position).add(new THREE.Vector3(0, 4.5, 8));
  tweenCamera(pos, target, 1200);
  showSection(name);
}

// Raycasting for clicks
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoverHit = false;
function onClick(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = [];
  islands.forEach((g) => hits.push(...raycaster.intersectObject(g.userData.hit)));
  if (hits[0]) {
    const name = hits[0].object.parent.name;
    travelTo(name);
  }
}
renderer.domElement.addEventListener('click', onClick);

function onMove(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = [];
  islands.forEach((g) => hits.push(...raycaster.intersectObject(g.userData.hit)));
  const hovering = Boolean(hits[0]);
  if (hovering !== hoverHit) {
    hoverHit = hovering;
    renderer.domElement.style.cursor = hovering ? 'pointer' : 'grab';
  }
}
renderer.domElement.addEventListener('mousemove', onMove);

// UI wiring
document.querySelectorAll('nav button[data-target]').forEach((btn) => {
  btn.addEventListener('click', () => travelTo(btn.dataset.target));
});
document.getElementById('resetView').addEventListener('click', () => {
  tweenCamera(new THREE.Vector3(0, 6, 18), new THREE.Vector3(0, 2.6, 0), 1000);
  setPanel('Welcome', 'Click an island or a nav button to travel.');
});

const panelTitle = document.getElementById('panelTitle');
const panelContent = document.getElementById('panelContent');
function setPanel(title, html) {
  panelTitle.textContent = title; panelContent.innerHTML = html;
}

function toItems(items) {
  return items
    .map((it) => {
      const meta = it.org ? `${it.org} • ${it.location || ''} • ${it.period || ''}`.replace(/\s•\s$/,'') : (it.meta || '');
      const desc = it.desc ? `<div class="desc">${it.desc}</div>` : (it.bullets ? `<div class="desc">• ${it.bullets.join('<br>• ')}</div>` : '');
      return `<div class="item"><div class="title">${it.title}</div><div class="meta">${meta}</div>${desc}</div>`;
    })
    .join('');
}

function showSection(name) {
  const data = resumeData.sections[name];
  if (!data) return;
  setPanel(name, toItems(data));
}

// Animate
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  stars.rotation.y += 0.0006;
  renderer.render(scene, camera);
}
animate();

// Resize
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
