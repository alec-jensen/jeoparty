// Three.js JEOPARTY intro — real 3D extruded mesh with gold material.
//
// Sequence (driven by the page):
//   runFlyIn()      — 10s dramatic fly-in, ends settled at center facing forward
//   settleToTop()   — ~0.7s reposition to the top of the frame, then idles gently
//   runFlyOut()     — ~2.5s exit: zooms toward camera and dissolves

import * as THREE from 'three';
import { FontLoader, type Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface IntroController {
  runFlyIn(): Promise<void>;
  settleToTop(): Promise<void>;
  runFlyOut(): Promise<void>;
  dispose(): void;
}

interface LogoIdleOptions {
  canvasExpand?: number;
}

type Vec = { x: number; y: number; z: number; rx: number; ry: number; s: number; o: number };
type Keyframe = { t: number; v: Vec };

const FLY_IN_DURATION = 10000;
const SETTLE_DURATION = 700;
const FLY_OUT_DURATION = 2500;

// Final centered pose at end of fly-in
const POSE_CENTER: Vec = { x: 0, y: 0, z: 0, rx: 0, ry: 0, s: 1.0, o: 1 };
// Resting pose at top of frame
const POSE_TOP: Vec = { x: 0, y: 300, z: 0, rx: 0, ry: 0, s: 0.42, o: 1 };

// Fly-in: one full Y spin while zooming in, ending settled. No tumbling.
const FLY_IN_KEYS: Keyframe[] = [
  { t: 0.00, v: { x: 0, y: 0, z: -2800, rx: 0, ry: 540, s: 0.3,  o: 0 } },
  { t: 0.12, v: { x: 0, y: 0, z: -1800, rx: 0, ry: 450, s: 0.45, o: 1 } },
  { t: 0.45, v: { x: 0, y: 0, z: -400,  rx: 0, ry: 180, s: 0.85, o: 1 } },
  { t: 0.70, v: { x: 0, y: 0, z: 100,   rx: 0, ry: 30,  s: 1.08, o: 1 } },
  { t: 0.85, v: { x: 0, y: 0, z: 0,     rx: 0, ry: 0,   s: 0.98, o: 1 } },
  { t: 1.00, v: POSE_CENTER },
];

// Settle to top: simple lerp from center pose to top pose
const SETTLE_KEYS: Keyframe[] = [
  { t: 0.00, v: POSE_CENTER },
  { t: 1.00, v: POSE_TOP },
];

// Fly-out: from top, zoom toward camera and dissolve
const FLY_OUT_KEYS: Keyframe[] = [
  { t: 0.00, v: POSE_TOP },
  { t: 0.35, v: { x: 0, y: 150, z: 200, rx: 0, ry: 0, s: 0.7, o: 1 } },
  { t: 0.70, v: { x: 0, y: 0,   z: 600, rx: 0, ry: 0, s: 1.4, o: 1 } },
  { t: 1.00, v: { x: 0, y: 0,   z: 1800, rx: 0, ry: 0, s: 2.5, o: 0 } },
];

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function sampleKeys(keys: Keyframe[], t: number): Vec {
  if (t <= keys[0]!.t) return keys[0]!.v;
  if (t >= keys[keys.length - 1]!.t) return keys[keys.length - 1]!.v;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i]!, b = keys[i + 1]!;
    if (t >= a.t && t <= b.t) {
      const k = (t - a.t) / (b.t - a.t);
      return {
        x: lerp(a.v.x, b.v.x, k),
        y: lerp(a.v.y, b.v.y, k),
        z: lerp(a.v.z, b.v.z, k),
        rx: lerp(a.v.rx, b.v.rx, k),
        ry: lerp(a.v.ry, b.v.ry, k),
        s: lerp(a.v.s, b.v.s, k),
        o: lerp(a.v.o, b.v.o, k),
      };
    }
  }
  return keys[keys.length - 1]!.v;
}

/** Shows the logo centered and sized to fill the container. No fly-in. */
export async function createLogoIdle(
  container: HTMLElement,
  fontUrl: string,
  options: LogoIdleOptions = {},
): Promise<{ dispose(): void }> {
  const font: Font = await new Promise((resolve, reject) => {
    new FontLoader().load(fontUrl, resolve, undefined, reject);
  });

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0x000000, 0);

  // Canvas overflows the container by this factor on each side so rotation never clips.
  // e.g. 1.3 = canvas is 30% wider/taller, with 15% extra on every edge.
  const CANVAS_EXPAND = Math.max(1, options.canvasExpand ?? 1.3);
  const EDGE = (CANVAS_EXPAND - 1) / 2 * 100; // 15 (percent)

  const canvas = renderer.domElement;
  Object.assign(canvas.style, {
    position: 'absolute',
    left: `-${EDGE}%`, top: `-${EDGE}%`,
    width: `${CANVAS_EXPAND * 100}%`, height: `${CANVAS_EXPAND * 100}%`,
    zIndex: '2', pointerEvents: 'none',
  });
  container.style.overflow = 'visible';
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  const CAM_Z = 900;
  const FOV = 45;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 8000);
  camera.position.set(0, 0, CAM_Z);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  scene.add(new THREE.AmbientLight(0xffe6b0, 0.35));
  const keyLight = new THREE.DirectionalLight(0xfff2c8, 1.2);
  keyLight.position.set(400, 600, 800);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xff8a3d, 0.5);
  fillLight.position.set(-600, -200, 400);
  scene.add(fillLight);
  const rimLight = new THREE.PointLight(0xffffff, 2.5, 2000, 1.5);
  rimLight.position.set(0, 0, 300);
  scene.add(rimLight);

  const geometry = new TextGeometry('JEOPARTY', {
    font,
    size: 120,
    depth: 36,
    curveSegments: 24,
    bevelEnabled: true,
    bevelThickness: 6,
    bevelSize: 3,
    bevelOffset: 0,
    bevelSegments: 5,
  });
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox!;
  geometry.translate(-(bb.max.x + bb.min.x) / 2, -(bb.max.y + bb.min.y) / 2, -(bb.max.z + bb.min.z) / 2);
  const textHalfWidth = (bb.max.x - bb.min.x) / 2;

  const material = new THREE.MeshStandardMaterial({
    color: 0xffc83d,
    metalness: 0.92,
    roughness: 0.22,
    emissive: 0x331c00,
    emissiveIntensity: 0.35,
    transparent: true,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.visible = true;
  scene.add(mesh);

  // Visible world half-height at z=0 for this camera
  const HALF_HEIGHT = CAM_Z * Math.tan((FOV / 2) * (Math.PI / 180));
  let idleScale = 1;

  function resize() {
    const cw = container.clientWidth || window.innerWidth;
    const ch = container.clientHeight || window.innerHeight;
    // Render into the expanded canvas
    renderer.setSize(Math.round(cw * CANVAS_EXPAND), Math.round(ch * CANVAS_EXPAND), false);
    // Aspect ratio is the same (CANVAS_EXPAND cancels), so the world framing is identical
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
    // Text should fill 88% of the CONTAINER width. Since the canvas is CANVAS_EXPAND wider,
    // divide the fill fraction by CANVAS_EXPAND so pixel size stays the same.
    const visibleHalfWidth = HALF_HEIGHT * camera.aspect;
    idleScale = (visibleHalfWidth * 0.88 / CANVAS_EXPAND) / textHalfWidth;
  }
  resize();
  const onResize = () => resize();
  window.addEventListener('resize', onResize);

  let disposed = false;
  let rafId = 0;
  const startTime = performance.now();

  function tick() {
    if (disposed) return;
    const elapsed = (performance.now() - startTime) / 1000;
    rimLight.position.set(
      Math.cos(elapsed * 1.3) * 700,
      Math.sin(elapsed * 1.7) * 400,
      300 + Math.sin(elapsed * 0.9) * 200,
    );
    mesh.position.set(0, Math.sin(elapsed * 0.7) * 4 * idleScale, 0);
    mesh.rotation.set(0, THREE.MathUtils.degToRad(Math.sin(elapsed * 0.45) * 10), 0);
    mesh.scale.setScalar(idleScale);
    material.opacity = 1;
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      geometry.dispose();
      material.dispose();
      pmrem.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}

export async function createIntro(container: HTMLElement, fontUrl: string): Promise<IntroController> {
  const font: Font = await new Promise((resolve, reject) => {
    new FontLoader().load(fontUrl, resolve, undefined, reject);
  });

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0x000000, 0);

  const canvas = renderer.domElement;
  Object.assign(canvas.style, {
    position: 'absolute', inset: '0', width: '100%', height: '100%',
    zIndex: '2', pointerEvents: 'none',
  });
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 1, 8000);
  camera.position.set(0, 0, 900);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  scene.add(new THREE.AmbientLight(0xffe6b0, 0.35));
  const keyLight = new THREE.DirectionalLight(0xfff2c8, 1.2);
  keyLight.position.set(400, 600, 800);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xff8a3d, 0.5);
  fillLight.position.set(-600, -200, 400);
  scene.add(fillLight);
  const rimLight = new THREE.PointLight(0xffffff, 2.5, 2000, 1.5);
  rimLight.position.set(0, 0, 300);
  scene.add(rimLight);

  const geometry = new TextGeometry('JEOPARTY', {
    font,
    size: 120,
    depth: 36,
    curveSegments: 24,
    bevelEnabled: true,
    bevelThickness: 6,
    bevelSize: 3,
    bevelOffset: 0,
    bevelSegments: 5,
  });
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox!;
  geometry.translate(-(bb.max.x + bb.min.x) / 2, -(bb.max.y + bb.min.y) / 2, -(bb.max.z + bb.min.z) / 2);

  const material = new THREE.MeshStandardMaterial({
    color: 0xffc83d,
    metalness: 0.92,
    roughness: 0.22,
    emissive: 0x331c00,
    emissiveIntensity: 0.35,
    transparent: true,
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  mesh.visible = false;

  function resize() {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  const onResize = () => resize();
  window.addEventListener('resize', onResize);

  // Continuous render loop: drives whatever phase is active.
  // Idle phase is implicit — between settleToTop and runFlyOut, the loop
  // gently rotates the mesh at the top pose.
  type PhaseName = 'hidden' | 'flyIn' | 'settleTop' | 'idleTop' | 'flyOut' | 'done';
  let phase: PhaseName = 'hidden';
  let phaseStart = 0;
  let resolveCurrent: (() => void) | null = null;
  let disposed = false;
  let rafId = 0;

  function applyVec(v: Vec) {
    mesh.position.set(v.x, v.y, v.z);
    mesh.rotation.set(THREE.MathUtils.degToRad(v.rx), THREE.MathUtils.degToRad(v.ry), 0);
    mesh.scale.setScalar(v.s);
    material.opacity = v.o;
  }

  function tick() {
    if (disposed) return;
    const now = performance.now();
    const elapsed = now - phaseStart;
    const tSec = now / 1000;

    // Always sweep the rim light to keep highlights traveling across the mesh
    rimLight.position.set(
      Math.cos(tSec * 1.3) * 700,
      Math.sin(tSec * 1.7) * 400,
      300 + Math.sin(tSec * 0.9) * 200,
    );

    if (phase === 'flyIn') {
      const t = Math.min(1, elapsed / FLY_IN_DURATION);
      applyVec(sampleKeys(FLY_IN_KEYS, easeInOut(t)));
      if (t >= 1) phaseEnd();
    } else if (phase === 'settleTop') {
      const t = Math.min(1, elapsed / SETTLE_DURATION);
      applyVec(sampleKeys(SETTLE_KEYS, easeInOut(t)));
      if (t >= 1) {
        phase = 'idleTop';
        phaseStart = now;
        phaseEnd();
      }
    } else if (phase === 'idleTop') {
      // Gentle Y bob/rotation around the top pose
      const idleT = elapsed / 1000;
      const v: Vec = {
        ...POSE_TOP,
        ry: Math.sin(idleT * 0.45) * 12,    // ±12° gentle Y rotation
        y: POSE_TOP.y + Math.sin(idleT * 0.7) * 6, // ±6px bob
      };
      applyVec(v);
    } else if (phase === 'flyOut') {
      const t = Math.min(1, elapsed / FLY_OUT_DURATION);
      applyVec(sampleKeys(FLY_OUT_KEYS, easeInOut(t)));
      if (t >= 1) {
        phase = 'done';
        mesh.visible = false;
        phaseEnd();
      }
    }

    if (phase !== 'hidden') renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  }

  function phaseEnd() {
    const r = resolveCurrent;
    resolveCurrent = null;
    if (r) r();
  }

  function startPhase(name: 'flyIn' | 'settleTop' | 'flyOut'): Promise<void> {
    mesh.visible = true;
    phase = name;
    phaseStart = performance.now();
    return new Promise<void>((resolve) => { resolveCurrent = resolve; });
  }

  rafId = requestAnimationFrame(tick);

  return {
    runFlyIn: () => startPhase('flyIn'),
    settleToTop: () => startPhase('settleTop'),
    runFlyOut: () => startPhase('flyOut'),
    dispose() {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      geometry.dispose();
      material.dispose();
      pmrem.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
