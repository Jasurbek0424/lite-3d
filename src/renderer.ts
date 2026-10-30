/**
 * Og'ir qism: three.js renderer. Bu modul alohida chunk bo'lib build qilinadi
 * va faqat <lite-3d> faollashganda yuklanadi.
 *
 * Tamoyillar:
 *  - On-demand render: hech narsa o'zgarmasa kadr chizilmaydi (batareya tejaladi).
 *  - Ekrandan tashqarida yoki tab yashirin bo'lsa loop to'xtaydi.
 *  - DPR 2 bilan cheklanadi.
 *  - Draco faqat kerak bo'lsa, Meshopt alohida chunk'da yuklanadi.
 */

import {
  ACESFilmicToneMapping,
  AgXToneMapping,
  AnimationMixer,
  Box3,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  LoaderUtils,
  LoopOnce,
  LoopRepeat,
  Mesh,
  MeshBasicMaterial,
  MeshDepthMaterial,
  NeutralToneMapping,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Raycaster,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Sphere,
  Texture,
  UniformsUtils,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
  type AnimationAction,
  type AnimationClip,
  type Material,
  type MeshStandardMaterial,
} from 'three';
import { GLTFLoader, type GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader.js';

export type ToneMapping = 'neutral' | 'aces' | 'agx';

export interface RendererOptions {
  autorotate: boolean;
  autorotateSpeed: number;
  cameraControls: boolean;
  exposure: number;
  toneMapping: ToneMapping;
  environment: boolean;
  shadow: boolean;
  background: string | null;
  dracoDecoderPath: string | null;
  variant: string | null;
  autoplay: boolean;
  animationName: string | null;
  animationSpeed: number;
  animationLoop: boolean;
}

export type Vec3 = [number, number, number];

/** Model ichidagi ma'lumot: load'dan keyin element orqali ochiladi. */
export interface ModelInfo {
  variants: string[];
  animations: string[];
  materials: string[];
}

/** Hotspot model koordinatalarida (glTF sahnasining o'z o'qlari). */
export interface HotspotSpec {
  position: Vec3;
  normal: Vec3 | null;
}

/** Hotspot'ning elementga nisbatan ekrandagi joyi (CSS px). */
export interface HotspotPlacement {
  x: number;
  y: number;
  visible: boolean;
}

export interface PosterOptions {
  /** Rasm kengligi px'da, balandlik element nisbatidan olinadi. */
  width?: number;
  type?: string;
  quality?: number;
}

export interface RendererEvents {
  onCameraChange(): void;
  onHotspots(placements: HotspotPlacement[]): void;
  onAnimationFinish(name: string): void;
}

export interface Renderer {
  /** `early` — element oldindan boshlab qo'ygan so'rov; bo'lmasa shu yerda yuklanadi. */
  load(url: string, onProgress: (p: number) => void, early?: Promise<Response> | null): Promise<ModelInfo>;
  info(): ModelInfo;
  update(opts: RendererOptions): void;
  setActive(active: boolean): void;
  resetCamera(): void;
  /** Kamera holati: gradusda azimut (-180..180) va qutb burchagi, masofa sahna birligida. */
  orbit(): { azimuth: number; polar: number; distance: number };
  toDataURL(type?: string): string;
  poster(opts?: PosterOptions): string;
  posterBlob(opts?: PosterOptions): Blob;
  setHotspots(list: HotspotSpec[]): void;
  /** data-position / data-normal uchun tayyor satrlar. */
  pick(clientX: number, clientY: number): { position: string; normal: string | null } | null;
  play(name?: string | null): void;
  pause(): void;
  readonly paused: boolean;
  setMaterialColor(name: string, color: string | null): boolean;
  dispose(): void;
}

interface VariantsExt {
  mappings: { material: number; variants: number[] }[];
}

const TONE_MAPPING = { neutral: NeutralToneMapping, aces: ACESFilmicToneMapping, agx: AgXToneMapping };

/**
 * Kontakt soya: model pastdan ortografik kamera bilan chuqurlik bo'yicha chiziladi
 * (yerga yaqin joy — to'qroq), keyin ikki marta xiralashtiriladi. Model yerga
 * "tegib turgandek" ko'rinadi. Faqat model o'zgarganda yoki animatsiyada qayta chiziladi.
 */
function createContactShadow(renderer: WebGLRenderer) {
  const size = 512;
  const rt = new WebGLRenderTarget(size, size);
  const rtBlur = new WebGLRenderTarget(size, size);
  rt.texture.generateMipmaps = rtBlur.texture.generateMipmaps = false;

  const group = new Group();
  const geo = new PlaneGeometry(1, 1).rotateX(Math.PI / 2);
  const planeMat = new MeshBasicMaterial({ map: rt.texture, opacity: 0.8, transparent: true, depthWrite: false });
  const plane = new Mesh(geo, planeMat);
  plane.renderOrder = -1;
  const blurPlane = new Mesh(geo);
  blurPlane.visible = false;
  const cam = new OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1);
  cam.rotation.x = Math.PI / 2; // yerdan yuqoriga qaraydi
  group.add(plane, blurPlane, cam);

  const depth = new MeshDepthMaterial({ depthTest: false, depthWrite: false });
  depth.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace(
      'gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );',
      'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * 1.5 );',
    );
  };
  // Uniform'lar nusxalanadi: sahifada bir nechta <lite-3d> bo'lsa bir-biriga xalaqit bermasin
  const blurMat = (shader: typeof HorizontalBlurShader | typeof VerticalBlurShader) =>
    new ShaderMaterial({ ...shader, uniforms: UniformsUtils.clone(shader.uniforms), depthTest: false });
  const hBlur = blurMat(HorizontalBlurShader);
  const vBlur = blurMat(VerticalBlurShader);

  const blur = (amount: number) => {
    blurPlane.visible = true;
    blurPlane.material = hBlur;
    hBlur.uniforms.tDiffuse.value = rt.texture;
    hBlur.uniforms.h.value = amount / 256;
    renderer.setRenderTarget(rtBlur);
    renderer.render(blurPlane, cam);
    blurPlane.material = vBlur;
    vBlur.uniforms.tDiffuse.value = rtBlur.texture;
    vBlur.uniforms.v.value = amount / 256;
    renderer.setRenderTarget(rt);
    renderer.render(blurPlane, cam);
    blurPlane.visible = false;
  };

  return {
    group,
    /** width — soya maydoni, height — soya qancha balandlikdagi qismlardan tushadi. */
    fit(width: number, height: number) {
      plane.scale.set(width, -1, width);
      blurPlane.scale.set(width, 1, width);
      cam.left = cam.bottom = -width / 2;
      cam.right = cam.top = width / 2;
      cam.far = height;
      cam.updateProjectionMatrix();
    },
    update(scene: Scene) {
      // Fon rangi soyaning xiralashgan chetiga aralashmasin: shaffof qora bilan tozalaymiz
      const color = renderer.getClearColor(new Color());
      const alpha = renderer.getClearAlpha();
      plane.visible = false;
      scene.overrideMaterial = depth;
      renderer.setClearColor(0x000000, 0);
      renderer.setRenderTarget(rt);
      renderer.clear();
      renderer.render(scene, cam);
      scene.overrideMaterial = null;
      blur(3);
      blur(1.2);
      renderer.setRenderTarget(null);
      renderer.setClearColor(color, alpha);
      plane.visible = true;
    },
    dispose() {
      rt.dispose();
      rtBlur.dispose();
      geo.dispose();
      [planeMat, depth, hBlur, vBlur].forEach((m) => m.dispose());
    },
  };
}

let swatch: CanvasRenderingContext2D | null = null;

/**
 * CSS rangini brauzerning o'zi o'qiydi: 1×1 canvas'ga bo'yab, pikselni olamiz.
 * Shunda #rrggbbaa, rgba(), hsl(), oklch(), transparent — hammasi ishlaydi.
 */
function parseColor(css: string): { color: Color; alpha: number } | null {
  if (!CSS.supports('color', css)) return null;
  swatch ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (!swatch) return null;
  swatch.canvas.width = swatch.canvas.height = 1;
  swatch.fillStyle = css;
  swatch.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = swatch.getImageData(0, 0, 1, 1).data;
  return { color: new Color().setRGB(r / 255, g / 255, b / 255, SRGBColorSpace), alpha: a / 255 };
}

/** Javobni o'qib, progressni (0..1) xabar qiladi. Hajm noma'lum bo'lsa progress bo'lmaydi. */
async function download(pending: Promise<Response>, onProgress: (p: number) => void): Promise<ArrayBuffer> {
  const res = await pending;
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${res.url}`);
  // gzip bilan kelsa content-length siqilgan hajm bo'ladi, shuning uchun 1 dan oshirmaymiz
  const total = Number(res.headers.get('content-length'));
  if (!total || !res.body) return res.arrayBuffer();
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.length;
    onProgress(Math.min(got / total, 1));
  }
  const out = new Uint8Array(got);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out.buffer;
}

function materialsOf(m: Mesh): Material[] {
  return (Array.isArray(m.material) ? m.material : [m.material]).filter(Boolean);
}

function disposeMaterial(mat: Material): void {
  for (const v of Object.values(mat)) if (v instanceof Texture) v.dispose();
  mat.dispose();
}

function disposeObject(root: Object3D): void {
  root.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh) return;
    m.geometry?.dispose();
    materialsOf(m).forEach(disposeMaterial);
  });
}

export function createRenderer(
  host: HTMLElement,
  initial: RendererOptions,
  events: RendererEvents,
): Renderer {
  let opts = { ...initial };
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const renderer = new WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false,
  });
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.setAttribute('tabindex', '0');
  host.appendChild(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.01, 1000);

  const pmrem = new PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  // Sahifa scroll'ini o'g'irlamaslik uchun: zoom faqat ctrl/pinch bilan emas,
  // lekin g'ildirak bilan ham ishlaydi — bu klassik viewer xulqi.

  const shadow = createContactShadow(renderer);
  scene.add(shadow.group);
  let shadowDirty = true;

  // environment="none" bo'lganda PBR materiallar qora bo'lib qolmasligi uchun
  // arzon zaxira yorug'lik (environment yoqiq bo'lsa o'chiriladi).
  const fallbackLights = new Object3D();
  fallbackLights.add(new HemisphereLight(0xffffff, 0x8a8f96, 2.2));
  const key = new DirectionalLight(0xffffff, 2.5);
  key.position.set(3, 5, 4);
  fallbackLights.add(key);
  scene.add(fallbackLights);

  let model: Object3D | null = null;
  let radius = 1;
  let loadId = 0;
  const home = { pos: new Vector3(), target: new Vector3() };

  // ---------- variantlar (KHR_materials_variants) ----------
  let parser: GLTFParser | null = null;
  let variantNames: string[] = [];
  // Variant almashganda sahnadan chiqqan materiallar ham dispose qilinishi kerak
  const variantMats = new Set<Material>();
  let variantToken = 0;

  // ---------- animatsiya ----------
  let mixer: AnimationMixer | null = null;
  let clips: AnimationClip[] = [];
  let action: AnimationAction | null = null;
  let playing = false;
  let finished = false;

  // ---------- hotspot'lar ----------
  const raycaster = new Raycaster();
  const ndc = new Vector2();
  const vPos = new Vector3();
  const vCam = new Vector3();
  const vDir = new Vector3();
  let hotspots: HotspotSpec[] = [];
  let blocked: boolean[] = [];
  let lastOcclusion = 0;
  let occlusionTimer = 0;
  let viewW = 1;
  let viewH = 1;

  // Raycast qimmat: to'silishni 100ms'da bir marta tekshiramiz, harakat
  // to'xtagach esa oxirgi holat uchun yana bir marta.
  const placeHotspots = () => {
    if (!hotspots.length || !model) return;
    const now = performance.now();
    const occlusion = now - lastOcclusion > 100;
    if (occlusion) lastOcclusion = now;
    else if (!occlusionTimer) {
      occlusionTimer = window.setTimeout(() => {
        occlusionTimer = 0;
        lastOcclusion = 0;
        placeHotspots();
      }, 120);
    }
    const m = model;
    events.onHotspots(
      hotspots.map((h, i) => {
        const p = m.localToWorld(vPos.fromArray(h.position));
        const toCam = vCam.subVectors(camera.position, p);
        const dist = toCam.length();
        // Model ildizi faqat suriladi (aylantirilmaydi), shuning uchun normal o'zgarmaydi
        let hidden = !!h.normal && vDir.fromArray(h.normal).dot(toCam) <= 0;
        if (occlusion) {
          raycaster.set(camera.position, vDir.copy(toCam).divideScalar(-dist));
          raycaster.far = dist;
          const hit = raycaster.intersectObject(m, true)[0];
          blocked[i] = !!hit && hit.distance < dist - radius * 0.02;
        }
        hidden ||= !!blocked[i];
        p.project(camera);
        return { x: ((p.x + 1) / 2) * viewW, y: ((1 - p.y) / 2) * viewH, visible: !hidden };
      }),
    );
  };

  // ---------- on-demand render loop ----------
  let active = false;
  let raf = 0;
  let dirty = true;
  let interacting = false;
  let last = 0;

  const render = () => {
    if (shadowDirty && shadow.group.visible) {
      shadow.update(scene);
      shadowDirty = false;
    }
    renderer.render(scene, camera);
    dirty = false;
    placeHotspots();
  };

  const tick = () => {
    raf = 0;
    if (!active) return;
    const now = performance.now();
    if (playing && mixer) {
      mixer.update(last ? Math.min((now - last) / 1000, 0.1) : 0);
      dirty = shadowDirty = true;
    }
    last = now;
    const changed = controls.update();
    if (changed || dirty) render();
    if (opts.autorotate || changed || interacting || playing) raf = requestAnimationFrame(tick);
    else last = 0;
  };

  const invalidate = () => {
    dirty = true;
    if (active && !raf) raf = requestAnimationFrame(tick);
  };

  controls.addEventListener('start', () => { interacting = true; invalidate(); });
  controls.addEventListener('end', () => { interacting = false; invalidate(); });
  controls.addEventListener('change', () => { dirty = true; events.onCameraChange(); });

  const resize = () => {
    viewW = host.clientWidth || 1;
    viewH = host.clientHeight || 1;
    renderer.setSize(viewW, viewH, false);
    camera.aspect = viewW / viewH;
    camera.updateProjectionMatrix();
    invalidate();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  const apply = () => {
    renderer.toneMapping = TONE_MAPPING[opts.toneMapping];
    renderer.toneMappingExposure = opts.exposure;
    scene.environment = opts.environment ? envTex : null;
    fallbackLights.visible = !opts.environment;
    const bg = opts.background ? parseColor(opts.background) : null;
    renderer.setClearColor(bg?.color ?? 0x000000, bg?.alpha ?? 0);
    controls.enabled = opts.cameraControls;
    controls.autoRotate = opts.autorotate;
    controls.autoRotateSpeed = opts.autorotateSpeed * 2;
    shadow.group.visible = opts.shadow && !!model;
    shadowDirty = true;
    if (mixer) mixer.timeScale = opts.animationSpeed;
    invalidate();
  };
  apply();

  const frame = (obj: Object3D) => {
    const box = new Box3().setFromObject(obj);
    const center = box.getCenter(new Vector3());
    // Modelni markazga, pastini y=0 ga qo'yamiz
    obj.position.sub(new Vector3(center.x, box.min.y, center.z));
    obj.updateMatrixWorld(true);
    box.setFromObject(obj);
    const sphere = box.getBoundingSphere(new Sphere());
    const r = (radius = sphere.radius || 1);
    const fov = (camera.fov * Math.PI) / 180;
    const fitH = r / Math.sin(fov / 2);
    const fitW = fitH / Math.min(1, camera.aspect);
    const dist = Math.max(fitH, fitW) * 1.05;

    home.target.copy(sphere.center);
    home.pos.set(dist * 0.55, sphere.center.y + dist * 0.3, dist * 0.8);
    camera.near = dist / 100;
    camera.far = dist * 100;
    camera.updateProjectionMatrix();
    controls.minDistance = r * 1.2;
    controls.maxDistance = dist * 3;
    controls.target.copy(home.target);
    camera.position.copy(home.pos);
    controls.update();

    const size = box.getSize(new Vector3());
    // Faqat pastki yarmi soya tashlaydi: yerga tekkan joy to'q, balanddagi qismlar och
    shadow.fit(Math.max(size.x, size.z) * 1.6, size.y * 0.5);
    shadow.group.position.set(0, 0.001 * r, 0);
    shadowDirty = true;
  };

  const selectVariant = async (name: string | null) => {
    const m = model;
    const p = parser;
    if (!m || !p) return;
    const token = ++variantToken;
    const index = name == null ? -1 : variantNames.indexOf(name);
    const jobs: Promise<void>[] = [];
    m.traverse((o) => {
      const mesh = o as Mesh;
      const ext = mesh.isMesh && (mesh.userData.gltfExtensions?.KHR_materials_variants as VariantsExt | undefined);
      if (!ext) return;
      if (!mesh.userData.lite3dOriginal) {
        mesh.userData.lite3dOriginal = mesh.material;
        materialsOf(mesh).forEach((mat) => variantMats.add(mat));
      }
      const mapping = ext.mappings.find((mp) => mp.variants.includes(index));
      if (!mapping) {
        mesh.material = mesh.userData.lite3dOriginal;
        return;
      }
      jobs.push(
        p.getDependency('material', mapping.material).then((mat: Material) => {
          if (token !== variantToken || model !== m) return;
          mesh.material = mat;
          p.assignFinalMaterial(mesh);
          materialsOf(mesh).forEach((x) => variantMats.add(x));
        }),
      );
    });
    await Promise.all(jobs);
    invalidate();
  };

  const play = (name?: string | null) => {
    if (!mixer || !clips.length) return;
    const clip = name
      ? clips.find((c) => c.name === name)
      : action?.getClip() ?? clips.find((c) => c.name === opts.animationName) ?? clips[0];
    if (!clip) return;
    const next = mixer.clipAction(clip);
    if (next !== action || finished) {
      action?.stop();
      next.reset();
    }
    next.setLoop(opts.animationLoop ? LoopRepeat : LoopOnce, Infinity);
    next.clampWhenFinished = !opts.animationLoop;
    next.paused = false;
    next.play();
    action = next;
    playing = true;
    finished = false;
    last = 0;
    invalidate();
  };

  const pause = () => {
    if (action) action.paused = true;
    playing = false;
  };

  const disposeModel = () => {
    if (!model) return;
    scene.remove(model);
    mixer?.stopAllAction();
    mixer?.uncacheRoot(model);
    mixer = null;
    action = null;
    playing = false;
    disposeObject(model);
    variantMats.forEach(disposeMaterial);
    variantMats.clear();
    model = null;
    parser = null;
  };

  const info = (): ModelInfo => {
    const names = new Set<string>();
    model?.traverse((o) => {
      if ((o as Mesh).isMesh) materialsOf(o as Mesh).forEach((m) => m.name && names.add(m.name));
    });
    return { variants: variantNames, animations: clips.map((c) => c.name), materials: [...names] };
  };

  const poster = ({ width = 1024, type = 'image/webp', quality = 0.85 }: PosterOptions = {}) => {
    // Kadrni boshlang'ich kameradan, so'ralgan o'lchamda chizib, keyin qaytaramiz.
    // Hammasi bitta task ichida bo'lgani uchun ekranda miltillash bo'lmaydi.
    const pos = camera.position.clone();
    camera.position.copy(home.pos);
    camera.lookAt(home.target);
    renderer.setPixelRatio(1);
    renderer.setSize(Math.round(width), Math.round((width * viewH) / viewW), false);
    renderer.render(scene, camera);
    const url = canvas.toDataURL(type, quality);
    renderer.setPixelRatio(dpr);
    renderer.setSize(viewW, viewH, false);
    camera.position.copy(pos);
    camera.lookAt(controls.target);
    render();
    return url;
  };

  const fmt = (v: Vector3, digits: number) => v.toArray().map((n) => +n.toFixed(digits)).join(' ');

  return {
    async load(url, onProgress, early) {
      const id = ++loadId;
      const loader = new GLTFLoader();
      const dracoPath = opts.dracoDecoderPath;
      // Fayl va dekoderlar bir vaqtda yuklanadi
      const [{ MeshoptDecoder }, draco, data] = await Promise.all([
        import('three/examples/jsm/libs/meshopt_decoder.module.js'),
        dracoPath ? import('three/examples/jsm/loaders/DRACOLoader.js') : null,
        download(early ?? fetch(url), onProgress),
      ]);
      loader.setMeshoptDecoder(MeshoptDecoder);
      if (draco) loader.setDRACOLoader(new draco.DRACOLoader().setDecoderPath(dracoPath!));
      const gltf = await loader.parseAsync(data, LoaderUtils.extractUrlBase(url));
      // Tez-tez src almashsa, eski so'rov yangisini bosib ketmasin
      if (id !== loadId) {
        disposeObject(gltf.scene);
        return { variants: [], animations: [], materials: [] };
      }
      onProgress(1);
      disposeModel();
      model = gltf.scene;
      parser = gltf.parser;
      variantNames = (
        (gltf.parser.json.extensions?.KHR_materials_variants?.variants ?? []) as { name: string }[]
      ).map((v) => v.name);
      clips = gltf.animations;
      if (clips.length) {
        mixer = new AnimationMixer(model);
        mixer.addEventListener('finished', (e) => {
          playing = false;
          finished = true;
          events.onAnimationFinish((e.action as AnimationAction).getClip().name);
        });
      }
      scene.add(model);
      frame(model);
      if (opts.variant) await selectVariant(opts.variant);
      if (opts.autoplay) play(opts.animationName);
      apply();
      render();
      return info();
    },
    info,
    update(next) {
      const prev = opts;
      opts = { ...next };
      if (prev.variant !== opts.variant) selectVariant(opts.variant);
      if (prev.autoplay && !opts.autoplay) pause();
      else if (
        (opts.autoplay && !prev.autoplay) ||
        ((opts.autoplay || playing) &&
          (prev.animationName !== opts.animationName || prev.animationLoop !== opts.animationLoop))
      ) {
        play(opts.animationName);
      }
      apply();
    },
    setActive(a) {
      active = a;
      last = 0;
      if (a) invalidate();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    orbit() {
      const deg = 180 / Math.PI;
      return {
        azimuth: controls.getAzimuthalAngle() * deg,
        polar: controls.getPolarAngle() * deg,
        distance: controls.getDistance(),
      };
    },
    resetCamera() {
      camera.position.copy(home.pos);
      controls.target.copy(home.target);
      controls.update();
      invalidate();
    },
    toDataURL(type = 'image/png') {
      render();
      return canvas.toDataURL(type);
    },
    poster,
    posterBlob(o) {
      const [head, b64] = poster(o).split(',');
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      return new Blob([bytes], { type: head.slice(5, head.indexOf(';')) });
    },
    setHotspots(list) {
      hotspots = list;
      blocked = [];
      lastOcclusion = 0;
      placeHotspots();
    },
    pick(x, y) {
      if (!model) return null;
      const r = canvas.getBoundingClientRect();
      ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
      raycaster.far = Infinity;
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObject(model, true)[0];
      if (!hit) return null;
      const n = hit.face?.normal.clone().transformDirection(hit.object.matrixWorld);
      return { position: fmt(model.worldToLocal(hit.point.clone()), 4), normal: n ? fmt(n, 3) : null };
    },
    play,
    pause,
    get paused() {
      return !playing;
    },
    setMaterialColor(name, color) {
      let found = false;
      model?.traverse((o) => {
        if (!(o as Mesh).isMesh) return;
        for (const mat of materialsOf(o as Mesh) as MeshStandardMaterial[]) {
          if (mat.name !== name || !mat.color) continue;
          mat.userData.lite3dColor ??= mat.color.clone();
          if (color) mat.color.set(color);
          else mat.color.copy(mat.userData.lite3dColor);
          found = true;
        }
      });
      if (found) invalidate();
      return found;
    },
    dispose() {
      active = false;
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(occlusionTimer);
      ro.disconnect();
      controls.dispose();
      disposeModel();
      shadow.dispose();
      envTex.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
