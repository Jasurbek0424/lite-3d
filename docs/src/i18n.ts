/**
 * Saytning uch tili. Hujjat matni src/content/docs/ (en), uz/ va ru/ ichida;
 * bu yerda sahifa qismlari va client skriptlar uchun qisqa matnlar.
 * Ingliz tili asosiy: manzilda prefiks yo'q (/models/), qolganlari /uz/models/, /ru/models/.
 * Fayl brauzerda ham ishlaydi, shuning uchun node modullarini import qilmaydi.
 */
export const LANGS = ['en', 'uz', 'ru'] as const;
export type Lang = (typeof LANGS)[number];

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Til prefiksisiz sahifa yo'li: /lite-3d/uz/models/ → /models/ */
export function stripLang(pathname: string): string {
  const p = pathname.slice(BASE.length) || '/';
  return p.replace(/^\/(uz|ru)(?=\/|$)/, '') || '/';
}

export function langFromPath(pathname: string): Lang {
  const seg = (pathname.slice(BASE.length) || '/').split('/')[1];
  return seg === 'uz' || seg === 'ru' ? seg : 'en';
}

/** Shu tildagi sahifa manzili: href('uz', '/models/') → /lite-3d/uz/models/ */
export function href(lang: Lang, path: string): string {
  return BASE + (lang === 'en' ? '' : '/' + lang) + path;
}

/** [...lang] sahifalari uchun: /, /uz/, /ru/ */
export function langPaths() {
  return LANGS.map((lang) => ({ params: { lang: lang === 'en' ? undefined : lang }, props: { lang } }));
}

/** Client skriptlar uchun: Starlight <html lang="..."> ni o'zi qo'yadi. */
export function pageLang(): Lang {
  const l = document.documentElement.lang;
  return (LANGS as readonly string[]).includes(l) ? (l as Lang) : 'en';
}

const en = {
  'nav.demo': 'Demo',
  'nav.models': 'Models',
  'nav.docs': 'Docs',
  'nav.pricing': 'Pricing',
  'nav.label': 'Main sections',
  'nav.menu': 'Menu',
  'nav.github': 'Source code on GitHub',
  'logo.label': 'lite3d, home',
  'theme.toggle': 'Toggle theme',
  'footer.license': 'lite3d, MIT license. Jasurbek Khakimbekov.',
  'footer.label': 'More links',
  'footer.about': 'About',
  'footer.models': 'Models and credits',

  'viewer.activate': 'View in 3D',
  'viewer.ar': 'View in AR',
  'viewer.alt': '{name}, 3D model. Drag to rotate.',
  'viewer.variants': 'Variants',
  'viewer.original': 'Original',

  'moves.label': 'Moves',
  'moves.loading': 'Loading',
  'moves.none': 'No moves',
  'moves.more': 'More moves',

  'show.crumb': '3D model',
  'show.fullscreen': 'Fullscreen',
  'show.reset': 'Reset camera',
  'show.prev': 'Previous model',
  'show.next': 'Next model',
  'show.models': 'Models',
  'show.tag': 'Open source, MIT license',
  'show.title': 'One tag. 4.5 KB. Then 3D.',
  'show.lede':
    'A web component for showing products in rotatable 3D. The page loads 4.5 KB up front; three.js arrives only when the model gets close to the screen.',
  'show.copy': 'Copy code',
  'show.copied': 'Copied',
  'show.copyFallback': 'Press Ctrl+C to copy',
  'show.model': 'Model',
  'show.attributes': 'Attributes',
  'show.exposure': 'Brightness',
  'show.background': 'Background',
  'show.bgLabel': 'Background color',
  'show.events': 'Events',
  'show.loadError': 'model failed to load, check the file URL',
  'bg.transparent': 'Transparent',
  'bg.white': 'White',
  'bg.sand': 'Sand',
  'bg.graphite': 'Graphite',

  'size.title': 'What loads when the page opens',
  'size.text':
    "Google's model-viewer ships three.js right away. lite3d sends only the element first and loads the rest separately when a model is actually needed.",
  'size.note': 'Measured with gzip and esbuild minify. model-viewer 4.4, three 0.186. Model files not included.',
  'size.stage1': 'On page load',
  'size.stage2': 'After 3D starts, total',
};
type Dict = typeof en;

const uz: Dict = {
  'nav.demo': 'Demo',
  'nav.models': 'Modellar',
  'nav.docs': 'Hujjatlar',
  'nav.pricing': 'Narxlar',
  'nav.label': "Asosiy bo'limlar",
  'nav.menu': 'Menyu',
  'nav.github': "GitHub'dagi manba kodi",
  'logo.label': 'lite3d, bosh sahifa',
  'theme.toggle': 'Mavzuni almashtirish',
  'footer.license': 'lite3d, MIT litsenziya. Jasurbek Khakimbekov.',
  'footer.label': "Qo'shimcha havolalar",
  'footer.about': 'Loyiha haqida',
  'footer.models': 'Modellar va mualliflar',

  'viewer.activate': "3D ko'rish",
  'viewer.ar': "AR'da ko'rish",
  'viewer.alt': "{name}, 3D model. Aylantirish uchun torting.",
  'viewer.variants': 'Variantlar',
  'viewer.original': 'Asl',

  'moves.label': 'Harakatlar',
  'moves.loading': 'Yuklanmoqda',
  'moves.none': "Harakat yo'q",
  'moves.more': 'Yana harakatlar',

  'show.crumb': '3D model',
  'show.fullscreen': "To'liq ekran",
  'show.reset': 'Kamerani qaytarish',
  'show.prev': 'Oldingi model',
  'show.next': 'Keyingi model',
  'show.models': 'Modellar',
  'show.tag': 'Ochiq kod, MIT litsenziya',
  'show.title': 'Bitta teg. 4.5 KB. Keyin 3D.',
  'show.lede':
    "Mahsulotni saytda aylantirib ko'rsatish uchun web komponent. Sahifa ochilganda 4.5 KB yuklanadi, three.js esa model ekranga yaqinlashgandagina keladi.",
  'show.copy': 'Kodni nusxalash',
  'show.copied': 'Nusxalandi',
  'show.copyFallback': 'Ctrl+C bilan nusxalang',
  'show.model': 'Model',
  'show.attributes': 'Atributlar',
  'show.exposure': 'Yorqinlik',
  'show.background': 'Fon',
  'show.bgLabel': 'Fon rangi',
  'show.events': 'Hodisalar',
  'show.loadError': 'model ochilmadi, fayl manzilini tekshiring',
  'bg.transparent': 'Shaffof',
  'bg.white': 'Oq',
  'bg.sand': 'Qum rang',
  'bg.graphite': 'Grafit',

  'size.title': 'Sahifa ochilganda nima yuklanadi',
  'size.text':
    "Google'ning model-viewer komponenti three.js'ni darhol o'zi bilan olib keladi. lite3d avval faqat elementning o'zini beradi, qolganini model kerak bo'lganda alohida yuklaydi.",
  'size.note': "O'lchov: gzip, esbuild minify. model-viewer 4.4, three 0.186. Model fayllari hisobga olinmagan.",
  'size.stage1': 'Sahifa ochilganda',
  'size.stage2': '3D ishga tushgandan keyin, jami',
};

const ru: Dict = {
  'nav.demo': 'Демо',
  'nav.models': 'Модели',
  'nav.docs': 'Документация',
  'nav.pricing': 'Цены',
  'nav.label': 'Основные разделы',
  'nav.menu': 'Меню',
  'nav.github': 'Исходный код на GitHub',
  'logo.label': 'lite3d, главная',
  'theme.toggle': 'Сменить тему',
  'footer.license': 'lite3d, лицензия MIT. Jasurbek Khakimbekov.',
  'footer.label': 'Дополнительные ссылки',
  'footer.about': 'О проекте',
  'footer.models': 'Модели и авторы',

  'viewer.activate': 'Смотреть в 3D',
  'viewer.ar': 'Смотреть в AR',
  'viewer.alt': '{name}, 3D-модель. Потяните, чтобы повернуть.',
  'viewer.variants': 'Варианты',
  'viewer.original': 'Исходный',

  'moves.label': 'Движения',
  'moves.loading': 'Загрузка',
  'moves.none': 'Движений нет',
  'moves.more': 'Ещё движения',

  'show.crumb': '3D-модель',
  'show.fullscreen': 'Во весь экран',
  'show.reset': 'Сбросить камеру',
  'show.prev': 'Предыдущая модель',
  'show.next': 'Следующая модель',
  'show.models': 'Модели',
  'show.tag': 'Открытый код, лицензия MIT',
  'show.title': 'Один тег. 4.5 KB. Потом 3D.',
  'show.lede':
    'Веб-компонент, чтобы показывать товар в 3D с вращением. При открытии страницы грузится 4.5 KB, а three.js приходит, только когда модель приближается к экрану.',
  'show.copy': 'Скопировать код',
  'show.copied': 'Скопировано',
  'show.copyFallback': 'Нажмите Ctrl+C',
  'show.model': 'Модель',
  'show.attributes': 'Атрибуты',
  'show.exposure': 'Яркость',
  'show.background': 'Фон',
  'show.bgLabel': 'Цвет фона',
  'show.events': 'События',
  'show.loadError': 'модель не открылась, проверьте адрес файла',
  'bg.transparent': 'Прозрачный',
  'bg.white': 'Белый',
  'bg.sand': 'Песочный',
  'bg.graphite': 'Графит',

  'size.title': 'Что грузится при открытии страницы',
  'size.text':
    'Компонент model-viewer от Google сразу тянет за собой three.js. lite3d сначала отдаёт только сам элемент, а остальное грузит отдельно, когда модель действительно нужна.',
  'size.note': 'Замеры: gzip, esbuild minify. model-viewer 4.4, three 0.186. Файлы моделей не учитываются.',
  'size.stage1': 'При открытии страницы',
  'size.stage2': 'После запуска 3D, всего',
};

export const ui: Record<Lang, Dict> = { en, uz, ru };
export const t = (lang: Lang) => ui[lang];

/** Model ichidagi inglizcha harakat nomlari uchun o'qishli yorliqlar. Ro'yxatda yo'q nom o'zicha chiqadi. */
export const MOVE_LABELS: Record<Lang, Record<string, string>> = {
  en: {
    Idle: 'Idle',
    Walking: 'Walk',
    Running: 'Run',
    Dance: 'Dance',
    Wave: 'Wave',
    Jump: 'Jump',
    WalkJump: 'Walk jump',
    Death: 'Fall',
    Punch: 'Punch',
    Sitting: 'Sit down',
    Standing: 'Stand up',
    ThumbsUp: 'Thumbs up',
    Yes: 'Nod',
    No: 'Shake head',
    Seconds: 'Second hand',
  },
  uz: {
    Idle: 'Tinch turish',
    Walking: 'Yurish',
    Running: 'Yugurish',
    Dance: 'Raqs',
    Wave: "Qo'l silkitish",
    Jump: 'Sakrash',
    WalkJump: 'Yurib sakrash',
    Death: 'Yiqilish',
    Punch: 'Musht',
    Sitting: "O'tirish",
    Standing: "O'rnidan turish",
    ThumbsUp: "Barmoq ko'tarish",
    Yes: "Bosh irg'ash",
    No: 'Bosh chayqash',
    Seconds: 'Sekund strelkasi',
  },
  ru: {
    Idle: 'Покой',
    Walking: 'Ходьба',
    Running: 'Бег',
    Dance: 'Танец',
    Wave: 'Помахать',
    Jump: 'Прыжок',
    WalkJump: 'Прыжок на ходу',
    Death: 'Падение',
    Punch: 'Удар',
    Sitting: 'Сесть',
    Standing: 'Встать',
    ThumbsUp: 'Палец вверх',
    Yes: 'Кивнуть',
    No: 'Покачать головой',
    Seconds: 'Секундная стрелка',
  },
};
