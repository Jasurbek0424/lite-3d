/**
 * lite3d — yengil 3D mahsulot ko'rsatkichi (web component).
 *
 * Bu fayl ataylab three.js'ni import QILMAYDI. Element sahifada darhol
 * (bir necha KB) ro'yxatdan o'tadi, poster ko'rsatadi va og'ir 3D dvigatelni
 * faqat kerak bo'lganda — element ekranga chiqqanda yoki foydalanuvchi
 * bosganda — dinamik import bilan yuklaydi.
 */

import type {
  HotspotPlacement,
  ModelInfo,
  PosterOptions,
  Renderer,
  RendererOptions,
  Vec3,
} from './renderer';

export type { ModelInfo, PosterOptions };

export type LoadingMode = 'lazy' | 'eager' | 'interaction';

const TAG = 'lite-3d';

const OBSERVED = [
  'src',
  'poster',
  'alt',
  'loading',
  'autorotate',
  'autorotate-speed',
  'camera-controls',
  'exposure',
  'tone-mapping',
  'environment',
  'shadow',
  'ar',
  'ios-src',
  'background',
  'draco-decoder',
  'variant',
  'autoplay',
  'animation-name',
  'animation-speed',
  'animation-loop',
] as const;

const POSTER_KEY = 'lite3d:poster:';

const style = /* css */ `
:host {
  --lite3d-bg: transparent;
  --lite3d-accent: #111;
  --lite3d-accent-fg: #fff;
  --lite3d-radius: 12px;
  display: block;
  position: relative;
  aspect-ratio: var(--lite3d-aspect, 4 / 3);
  background: var(--lite3d-bg);
  border-radius: var(--lite3d-radius);
  overflow: hidden;
  contain: content;
  touch-action: pan-y;
}
:host([hidden]) { display: none; }
.stage, canvas, .poster { position: absolute; inset: 0; width: 100%; height: 100%; }
canvas { display: block; outline: none; }
.poster { object-fit: contain; transition: opacity .35s ease; pointer-events: none; }
:host([data-state="ready"]) .poster { opacity: 0; }
.stage { transition: opacity .35s ease; }
/* src almashganda eski model yangi poster ustida qolib ketmasin */
:host(:not([data-state="ready"])) .poster:not([hidden]) ~ .stage { opacity: 0; }
.progress {
  position: absolute; left: 0; bottom: 0; height: 3px; width: 0;
  background: var(--lite3d-accent); transition: width .2s ease, opacity .3s ease;
}
:host([data-state="ready"]) .progress, :host([data-state="idle"]) .progress { opacity: 0; }
button {
  font: 500 13px/1 system-ui, sans-serif;
  border: 0; cursor: pointer;
  background: var(--lite3d-accent); color: var(--lite3d-accent-fg);
  border-radius: 999px; padding: 10px 16px;
}
button:focus-visible { outline: 2px solid var(--lite3d-accent); outline-offset: 3px; }
.activate {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  box-shadow: 0 4px 16px rgb(0 0 0 / .18);
}
:host(:not([data-state="idle"])) .activate { display: none; }
.ar { position: absolute; right: 12px; bottom: 12px; display: none; }
:host([data-ar-ready]) .ar { display: inline-flex; }
.fallback { display: none; }
:host([data-state="fallback"]) .fallback { display: block; }
:host([data-state="fallback"]) .activate,
:host([data-state="fallback"]) canvas { display: none; }
.hotspots { position: absolute; inset: 0; pointer-events: none; }
:host(:not([data-state="ready"])) .hotspots { visibility: hidden; }
::slotted([slot="hotspot"]) {
  position: absolute; left: 0; top: 0; pointer-events: auto;
  transform: translate(var(--lite3d-x, -999px), var(--lite3d-y, -999px)) translate(-50%, -50%);
  transition: opacity .2s ease;
}
::slotted([slot="hotspot"][data-visible="false"]) { opacity: 0; pointer-events: none; }
@media (prefers-reduced-motion: reduce) {
  .poster, .stage, .progress, ::slotted([slot="hotspot"]) { transition: none; }
}
`;

/** WebGL bormi va qurilma 3D'ni ko'tara oladimi — arzon tekshiruv. */
function canRender3D(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return false;
  } catch {
    return false;
  }
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };
  if (nav.connection?.saveData) return false;
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 1) return false;
  return true;
}

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isIOS(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && navigator.maxTouchPoints > 1);
}
function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent);
}

// SSR (Next.js, Nuxt, Astro): serverda HTMLElement yo'q. Import yiqilmasligi uchun
// bo'sh klassdan meros olamiz; element baribir faqat brauzerda ro'yxatdan o'tadi.
const Base = (typeof HTMLElement === 'undefined' ? class {} : HTMLElement) as typeof HTMLElement;

export class Lite3DElement extends Base {
  static get observedAttributes(): readonly string[] {
    return OBSERVED;
  }

  #root: ShadowRoot;
  #stage: HTMLDivElement;
  #poster: HTMLImageElement;
  #progress: HTMLDivElement;
  #activate: HTMLButtonElement;
  #arBtn: HTMLButtonElement;
  #renderer: Renderer | null = null;
  #booting: Promise<void> | null = null;
  #io: IntersectionObserver | null = null;
  #hsSlot: HTMLSlotElement;
  #hotspots: HTMLElement[] = [];
  #mo: MutationObserver | null = null;
  #info: ModelInfo | null = null;
  #autoRole = false;
  #visible = false;
  #loadToken = 0;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: 'open', delegatesFocus: true });
    this.#root.innerHTML = `
      <style>${style}</style>
      <img class="poster" part="poster" alt="" decoding="async" />
      <div class="stage" part="stage"></div>
      <div class="hotspots" part="hotspots"><slot name="hotspot"></slot></div>
      <div class="progress" part="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100"></div>
      <button class="activate" part="activate-button" type="button"><slot name="activate-label">View in 3D</slot></button>
      <button class="ar" part="ar-button" type="button"><slot name="ar-label">View in AR</slot></button>
      <div class="fallback" part="fallback"><slot name="fallback"></slot></div>
    `;
    this.#stage = this.#root.querySelector('.stage')!;
    this.#poster = this.#root.querySelector('.poster')!;
    this.#progress = this.#root.querySelector('.progress')!;
    this.#activate = this.#root.querySelector('.activate')!;
    this.#arBtn = this.#root.querySelector('.ar')!;
    this.#hsSlot = this.#root.querySelector('slot[name="hotspot"]')!;

    this.#activate.addEventListener('click', () => this.activate());
    this.#arBtn.addEventListener('click', () => this.activateAR());
    this.#hsSlot.addEventListener('slotchange', () => this.#syncHotspots());
  }

  // ---------- public API ----------

  get src(): string | null { return this.getAttribute('src'); }
  set src(v: string | null) { v == null ? this.removeAttribute('src') : this.setAttribute('src', v); }

  get loading(): LoadingMode {
    const v = this.getAttribute('loading');
    return v === 'eager' || v === 'interaction' ? v : 'lazy';
  }
  set loading(v: LoadingMode | null) { v == null ? this.removeAttribute('loading') : this.setAttribute('loading', v); }

  /** Model yuklanib tayyor bo'lganmi. */
  get loaded(): boolean { return this.dataset.state === 'ready'; }

  /** 3D'ni darhol yuklash (loading="interaction" uchun ham). */
  activate(): Promise<void> {
    return this.#boot();
  }

  /** Kamerani boshlang'ich holatga qaytaradi. */
  resetCamera(): void {
    this.#renderer?.resetCamera();
  }

  /** Kamera burchaklari (gradus). `camera-change` event'i bilan birga ishlatiladi. */
  getCameraOrbit(): { azimuth: number; polar: number; distance: number } | null {
    return this.#renderer?.orbit() ?? null;
  }

  /** Joriy kadrni PNG data URL sifatida qaytaradi (screenshot). */
  toDataURL(type = 'image/png'): string | null {
    return this.#renderer?.toDataURL(type) ?? null;
  }

  /** Boshlang'ich kameradan toza poster rasm (standart: 1024px WebP). */
  createPoster(opts?: PosterOptions): Blob | null {
    return (this.loaded && this.#renderer?.posterBlob(opts)) || null;
  }

  /** Modeldagi variant nomlari (KHR_materials_variants). */
  get variants(): string[] { return this.#info?.variants ?? []; }
  /** Modeldagi animatsiya nomlari. */
  get animations(): string[] { return this.#info?.animations ?? []; }
  /** Sahnadagi joriy material nomlari (setMaterialColor uchun, variantga qarab o'zgaradi). */
  get materials(): string[] { return (this.loaded && this.#renderer?.info().materials) || []; }

  /** Animatsiyani ijro etish. Nom berilmasa joriy yoki birinchisi. */
  play(name?: string): void { this.#renderer?.play(name); }
  pause(): void { this.#renderer?.pause(); }
  get paused(): boolean { return this.#renderer?.paused ?? true; }

  /** Material rangini almashtiradi, null вЂ” asl rangiga qaytaradi. */
  setMaterialColor(material: string, color: string | null): boolean {
    return this.#renderer?.setMaterialColor(material, color) ?? false;
  }

  /**
   * Ekrandagi nuqta ostidagi model sirti: hotspot'ning data-position va
   * data-normal qiymatlari uchun tayyor satrlar.
   */
  positionFromPoint(clientX: number, clientY: number): { position: string; normal: string | null } | null {
    return this.#renderer?.pick(clientX, clientY) ?? null;
  }

  // ---------- lifecycle ----------

  connectedCallback(): void {
    if (!this.hasAttribute('role')) {
      this.#autoRole = true;
      this.setAttribute('role', 'img');
    }
    this.#syncAlt();
    this.#syncPoster();

    if (!canRender3D()) {
      this.#setState('fallback');
      return;
    }
    this.#setState('idle');
    this.#syncAR();

    this.#io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          this.#visible = e.isIntersecting;
          this.#renderer?.setActive(this.#visible && !document.hidden);
          if (this.#visible && this.loading === 'lazy') this.#boot();
        }
      },
      { rootMargin: '200px' },
    );
    this.#io.observe(this);
    document.addEventListener('visibilitychange', this.#onVisibility);
    this.#mo = new MutationObserver(() => this.#syncHotspots());
    this.#mo.observe(this, { subtree: true, attributeFilter: ['data-position', 'data-normal'] });

    if (this.loading === 'eager') this.#boot();
  }

  disconnectedCallback(): void {
    this.#io?.disconnect();
    this.#io = null;
    this.#mo?.disconnect();
    this.#mo = null;
    document.removeEventListener('visibilitychange', this.#onVisibility);
    this.#renderer?.dispose();
    this.#renderer = null;
    this.#booting = null;
    if (this.dataset.state !== 'fallback') this.#setState('idle');
  }

  attributeChangedCallback(name: string, oldV: string | null, newV: string | null): void {
    if (oldV === newV) return;
    switch (name) {
      case 'alt': this.#syncAlt(); break;
      case 'poster': this.#syncPoster(); break;
      case 'src':
        if (this.#renderer && newV) this.#loadModel(newV);
        this.#syncAR();
        this.#syncPoster();
        break;
      case 'ar':
      case 'ios-src':
        this.#syncAR();
        break;
      case 'loading':
        if (newV === 'eager' && this.isConnected) this.#boot();
        break;
      default:
        this.#renderer?.update(this.#options());
    }
  }

  // ---------- internals ----------

  #onVisibility = (): void => {
    this.#renderer?.setActive(this.#visible && !document.hidden);
  };

  #setState(s: 'idle' | 'loading' | 'ready' | 'error' | 'fallback'): void {
    this.dataset.state = s;
    this.setAttribute('aria-busy', String(s === 'loading'));
  }

  #syncAlt(): void {
    this.setAttribute('aria-label', this.getAttribute('alt') || '3D model');
  }

  #posterKey(): string | null {
    return this.src && POSTER_KEY + new URL(this.src, location.href).href;
  }

  /** poster="auto": avvalgi tashrifda shu modeldan olingan kadr. */
  #syncPoster(): void {
    let p = this.getAttribute('poster');
    if (p === 'auto') {
      const key = this.#posterKey();
      try {
        p = key && localStorage.getItem(key);
      } catch {
        p = null;
      }
    }
    if (p) {
      this.#poster.src = p;
      this.#poster.hidden = false;
    } else {
      this.#poster.removeAttribute('src');
      this.#poster.hidden = true;
    }
  }

  #syncAR(): void {
    const wants = this.hasAttribute('ar');
    const ok = wants && ((isIOS() && !!this.getAttribute('ios-src')) || (isAndroid() && !!this.src));
    this.toggleAttribute('data-ar-ready', ok);
  }

  /** slot="hotspot" elementlarini o'qib, renderer'ga uzatadi. */
  #syncHotspots(): void {
    const vec = (s: string | undefined): Vec3 | null => {
      const v = (s ?? '').trim().split(/[\s,]+/).map(Number);
      return v.length === 3 && v.every(Number.isFinite) ? (v as Vec3) : null;
    };
    const els = this.#hsSlot.assignedElements() as HTMLElement[];
    this.#hotspots = els.filter((el) => vec(el.dataset.position));
    if (this.#autoRole) this.setAttribute('role', els.length ? 'group' : 'img');
    this.#renderer?.setHotspots(
      this.#hotspots.map((el) => ({
        position: vec(el.dataset.position)!,
        normal: vec(el.dataset.normal),
      })),
    );
  }

  #placeHotspots = (list: HotspotPlacement[]): void => {
    list.forEach((p, i) => {
      const el = this.#hotspots[i];
      if (!el) return;
      el.style.setProperty('--lite3d-x', p.x.toFixed(1) + 'px');
      el.style.setProperty('--lite3d-y', p.y.toFixed(1) + 'px');
      el.dataset.visible = String(p.visible);
    });
  };

  #savePoster(): void {
    const key = this.#posterKey();
    if (!key || this.getAttribute('poster') !== 'auto') return;
    const run = () => {
      const url = this.loaded && this.#renderer?.poster({ width: 640, quality: 0.8 });
      try {
        if (url) localStorage.setItem(key, url);
      } catch {
        // kvota tugagan yoki storage yopiq: poster shunchaki saqlanmaydi
      }
    };
    // timeout shart: animatsiya yoki autorotate bo'lsa brauzer hech qachon "bo'sh" bo'lmaydi
    'requestIdleCallback' in window ? requestIdleCallback(run, { timeout: 1500 }) : setTimeout(run, 200);
  }

  #options(): RendererOptions {
    const num = (n: string, d: number) => {
      const v = parseFloat(this.getAttribute(n) ?? '');
      return Number.isFinite(v) ? v : d;
    };
    const reduced = prefersReducedMotion();
    const tm = this.getAttribute('tone-mapping');
    return {
      autorotate: this.hasAttribute('autorotate') && !reduced,
      autorotateSpeed: num('autorotate-speed', 1),
      cameraControls: this.getAttribute('camera-controls') !== 'false',
      exposure: num('exposure', 1),
      toneMapping: tm === 'aces' || tm === 'agx' ? tm : 'neutral',
      environment: this.getAttribute('environment') !== 'none',
      shadow: this.hasAttribute('shadow'),
      background: this.getAttribute('background'),
      dracoDecoderPath: this.getAttribute('draco-decoder'),
      variant: this.getAttribute('variant'),
      autoplay: this.hasAttribute('autoplay') && !reduced,
      animationName: this.getAttribute('animation-name'),
      animationSpeed: num('animation-speed', 1),
      animationLoop: this.getAttribute('animation-loop') !== 'false',
    };
  }

  #boot(): Promise<void> {
    if (this.#booting) return this.#booting;
    if (this.dataset.state === 'fallback') return Promise.resolve();
    this.#setState('loading');
    this.#booting = (async () => {
      // Model three.js bilan bir vaqtda yuklana boshlaydi, navbat kutmaydi
      const src = this.src;
      const early = src ? fetch(src) : null;
      early?.catch(() => {});
      try {
        const { createRenderer } = await import('./renderer');
        if (!this.isConnected) return;
        this.#renderer = createRenderer(this.#stage, this.#options(), {
          onCameraChange: () => this.dispatchEvent(new CustomEvent('camera-change')),
          onHotspots: this.#placeHotspots,
          onAnimationFinish: (name) =>
            this.dispatchEvent(new CustomEvent('animation-finish', { detail: { name } })),
        });
        this.#renderer.setActive(this.#visible && !document.hidden);
        this.#syncHotspots();
        if (this.src) await this.#loadModel(this.src, this.src === src ? early : null);
      } catch (err) {
        this.#fail(err);
      }
    })();
    return this.#booting;
  }

  async #loadModel(url: string, early?: Promise<Response> | null): Promise<void> {
    if (!this.#renderer) return;
    const token = ++this.#loadToken;
    this.#info = null;
    this.#setState('loading');
    this.#progress.style.width = '0%';
    const t0 = performance.now();
    try {
      const info = await this.#renderer.load(url, (p) => {
        if (token !== this.#loadToken) return;
        const pct = Math.round(p * 100);
        this.#progress.style.width = pct + '%';
        this.#progress.setAttribute('aria-valuenow', String(pct));
        this.dispatchEvent(new CustomEvent('progress', { detail: { progress: p } }));
      }, early);
      if (token !== this.#loadToken) return;
      this.#info = info;
      this.#setState('ready');
      this.dispatchEvent(
        new CustomEvent('load', { detail: { url, ms: Math.round(performance.now() - t0), ...info } }),
      );
      this.#savePoster();
    } catch (err) {
      if (token === this.#loadToken) this.#fail(err);
    }
  }

  #fail(err: unknown): void {
    this.#setState('error');
    this.dispatchEvent(new CustomEvent('error', { detail: { error: err } }));
    console.error('[lite3d]', err);
  }

  activateAR(): void {
    if (isIOS()) {
      const usdz = this.getAttribute('ios-src');
      if (!usdz) return;
      const a = document.createElement('a');
      a.rel = 'ar';
      a.href = new URL(usdz, location.href).href;
      a.appendChild(document.createElement('img')); // Quick Look talabi
      a.click();
      return;
    }
    if (isAndroid() && this.src) {
      const file = new URL(this.src, location.href).href;
      const fallback = encodeURIComponent(location.href);
      location.href =
        `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(file)}&mode=ar_preferred` +
        `#Intent;scheme=https;package=com.google.android.googlequicksearchbox;` +
        `action=android.intent.action.VIEW;S.browser_fallback_url=${fallback};end;`;
    }
  }
}

if (typeof customElements !== 'undefined' && !customElements.get(TAG)) {
  customElements.define(TAG, Lite3DElement);
}

declare global {
  interface HTMLElementTagNameMap {
    'lite-3d': Lite3DElement;
  }
}
