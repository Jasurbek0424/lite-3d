import { statSync } from 'node:fs';
import { join } from 'node:path';
import type { Lang } from '../i18n';

/** Saytdagi barcha namunaviy modellar: bosh sahifa, Modellar sahifasi va hujjatlar shu ro'yxatdan oladi. */
interface ModelSource {
  id: string;
  file: string;
  /** Kod namunasida ko'rinadigan fayl nomi */
  sample: Record<Lang, string>;
  name: Record<Lang, string>;
  /** Chip'dagi qisqa nom */
  short: Record<Lang, string>;
  category: Record<Lang, string>;
  note: Record<Lang, string>;
  credit: Record<Lang, string>;
  attrs?: Record<string, string>;
}

/** Bitta tilga o'girilgan model: sahifalar shu ko'rinishda ishlatadi. */
export interface DemoModel {
  id: string;
  file: string;
  sample: string;
  name: string;
  short: string;
  category: string;
  note: string;
  credit: string;
  attrs?: Record<string, string>;
}

const sources: ModelSource[] = [
  {
    id: 'chair',
    file: 'SheenChair.glb',
    sample: { en: 'chair.glb', uz: 'kreslo.glb', ru: 'chair.glb' },
    name: { en: 'Velvet chair', uz: 'Baxmal kreslo', ru: 'Бархатное кресло' },
    short: { en: 'Chair', uz: 'Kreslo', ru: 'Кресло' },
    category: { en: 'Furniture', uz: 'Mebel', ru: 'Мебель' },
    note: {
      en: 'Two fabric variants, velvet sheen',
      uz: 'Ikki mato varianti, baxmal yaltirashi',
      ru: 'Два варианта ткани, бархатный блеск',
    },
    credit: {
      en: 'Wayfair, Eric Chadwick, CC0',
      uz: 'Wayfair, Eric Chadwick, CC0',
      ru: 'Wayfair, Eric Chadwick, CC0',
    },
  },
  {
    id: 'watch',
    file: 'Watch.glb',
    sample: { en: 'watch.glb', uz: 'soat.glb', ru: 'watch.glb' },
    name: { en: 'Chronograph watch', uz: 'Xronograf soat', ru: 'Часы-хронограф' },
    short: { en: 'Watch', uz: 'Soat', ru: 'Часы' },
    category: { en: 'Accessory', uz: 'Aksessuar', ru: 'Аксессуар' },
    note: {
      en: 'Ticking second hand, 4 color variants, glass',
      uz: 'Yuruvchi sekund strelkasi, 4 ta rang varianti, shisha',
      ru: 'Идущая секундная стрелка, 4 цветовых варианта, стекло',
    },
    credit: {
      en: 'Darmstadt Graphics Group, Eric Chadwick; original by graphiccompressor, CC-BY 4.0',
      uz: 'Darmstadt Graphics Group, Eric Chadwick; asli graphiccompressor, CC-BY 4.0',
      ru: 'Darmstadt Graphics Group, Eric Chadwick; оригинал graphiccompressor, CC-BY 4.0',
    },
    attrs: { autoplay: '' },
  },
  {
    id: 'robot',
    file: 'Robot.glb',
    sample: { en: 'robot.glb', uz: 'robot.glb', ru: 'robot.glb' },
    name: { en: 'Robot', uz: 'Robot', ru: 'Робот' },
    short: { en: 'Robot', uz: 'Robot', ru: 'Робот' },
    category: { en: 'Character', uz: 'Personaj', ru: 'Персонаж' },
    note: {
      en: '14 animations: walk, run, dance',
      uz: '14 ta animatsiya: yurish, yugurish, raqs',
      ru: '14 анимаций: ходьба, бег, танец',
    },
    credit: {
      en: 'Tomás Laulhé (Quaternius), CC0; modified by Don McCurdy',
      uz: "Tomás Laulhé (Quaternius), CC0; Don McCurdy o'zgartirishlari",
      ru: 'Tomás Laulhé (Quaternius), CC0; доработка Don McCurdy',
    },
    attrs: { autoplay: '', 'animation-name': 'Walking' },
  },
  {
    id: 'car',
    file: 'ToyCar.glb',
    sample: { en: 'car.glb', uz: 'mashina.glb', ru: 'car.glb' },
    name: { en: 'Toy car', uz: "O'yinchoq mashina", ru: 'Игрушечная машинка' },
    short: { en: 'Car', uz: 'Mashina', ru: 'Машинка' },
    category: { en: 'Toy', uz: "O'yinchoq", ru: 'Игрушка' },
    note: {
      en: 'Glass, fabric and clearcoat materials',
      uz: 'Shisha, mato va lak materiallari',
      ru: 'Стекло, ткань и лаковое покрытие',
    },
    credit: {
      en: 'Guido Odendahl, materials by Eric Chadwick, CC0',
      uz: 'Guido Odendahl, materiallar Eric Chadwick, CC0',
      ru: 'Guido Odendahl, материалы Eric Chadwick, CC0',
    },
  },
];

export function getModels(lang: Lang): DemoModel[] {
  return sources.map((m) => ({
    id: m.id,
    file: m.file,
    sample: m.sample[lang],
    name: m.name[lang],
    short: m.short[lang],
    category: m.category[lang],
    note: m.note[lang],
    credit: m.credit[lang],
    attrs: m.attrs,
  }));
}

/** Model faylining posteri (public/posters/{id}.webp): 3D yuklanguncha shu rasm ko'rinadi. */
export function posterFor(file: string): string | undefined {
  const m = sources.find((s) => s.file === file);
  return m && `/posters/${m.id}.webp`;
}

/** Fayl hajmi build paytida diskdan o'qiladi, qo'lda yozilmaydi. */
export function fileSize(m: DemoModel): string {
  // import.meta.url build'da dist/ ichini ko'rsatadi, shuning uchun loyiha ildizidan olamiz
  const bytes = statSync(join(process.cwd(), 'public', 'models', m.file)).size;
  return bytes > 1e6 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export const GITHUB_URL = 'https://github.com/Jasurbek0424/lite-3d';
