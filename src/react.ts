/**
 * React wrapper. React 19 custom element'larni o'zi qo'llaydi, bu wrapper esa
 * tiplar, boolean atributlar va event'larni qulay qiladi.
 *
 *   import { Lite3D } from 'lite3d/react';
 *   <Lite3D src="/divan.glb" poster="/divan.webp" autorotate ar onLoad={...} />
 *
 * Build'da faylning boshiga 'use client' qo'shiladi (tsup banner), shuning uchun
 * Next.js App Router'da server komponent ichidan ham to'g'ridan-to'g'ri ishlatsa bo'ladi.
 */
import {
  createElement,
  forwardRef,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from 'react';
import './index.js';
import type { Lite3DElement, LoadingMode, ModelInfo } from './index.js';

export interface Lite3DProps {
  src: string;
  poster?: string;
  alt?: string;
  loading?: LoadingMode;
  autorotate?: boolean;
  autorotateSpeed?: number;
  cameraControls?: boolean;
  exposure?: number;
  environment?: boolean;
  shadow?: boolean;
  ar?: boolean;
  iosSrc?: string;
  background?: string;
  dracoDecoder?: string;
  variant?: string;
  autoplay?: boolean;
  animationName?: string;
  animationSpeed?: number;
  animationLoop?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Hotspot'lar: <button slot="hotspot" data-position="x y z">...</button> */
  children?: ReactNode;
  onLoad?: (e: CustomEvent<{ url: string; ms: number } & ModelInfo>) => void;
  onProgress?: (e: CustomEvent<{ progress: number }>) => void;
  onError?: (e: CustomEvent<{ error: unknown }>) => void;
  onAnimationFinish?: (e: CustomEvent<{ name: string }>) => void;
}

const bool = (v: boolean | undefined) => (v ? '' : undefined);

export const Lite3D = forwardRef<Lite3DElement, Lite3DProps>(function Lite3D(props, ref) {
  const inner = useRef<Lite3DElement | null>(null);
  const { onLoad, onProgress, onError, onAnimationFinish } = props;

  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    const pairs: [string, ((e: never) => void) | undefined][] = [
      ['load', onLoad],
      ['progress', onProgress],
      ['error', onError],
      ['animation-finish', onAnimationFinish],
    ];
    const bound = pairs.filter(([, fn]) => fn) as [string, EventListener][];
    bound.forEach(([n, fn]) => el.addEventListener(n, fn));
    return () => bound.forEach(([n, fn]) => el.removeEventListener(n, fn));
  }, [onLoad, onProgress, onError, onAnimationFinish]);

  const setRef = (el: Lite3DElement | null) => {
    inner.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) (ref as { current: Lite3DElement | null }).current = el;
  };

  return createElement(
    'lite-3d',
    {
      ref: setRef as Ref<HTMLElement>,
      src: props.src,
      poster: props.poster,
      alt: props.alt,
      loading: props.loading,
      autorotate: bool(props.autorotate),
      'autorotate-speed': props.autorotateSpeed,
      'camera-controls': props.cameraControls === false ? 'false' : undefined,
      exposure: props.exposure,
      environment: props.environment === false ? 'none' : undefined,
      shadow: bool(props.shadow),
      ar: bool(props.ar),
      'ios-src': props.iosSrc,
      background: props.background,
      'draco-decoder': props.dracoDecoder,
      variant: props.variant,
      autoplay: bool(props.autoplay),
      'animation-name': props.animationName,
      'animation-speed': props.animationSpeed,
      'animation-loop': props.animationLoop === false ? 'false' : undefined,
      className: props.className,
      style: props.style,
    },
    props.children,
  );
});
