/**
 * Modeldagi harakatlar (animatsiya kliplari) uchun boshqaruv. Ro'yxat load event'idan keladi:
 *   - harakat yo'q   → "Harakat yo'q" yozuvi
 *   - 4 tagacha      → hammasi tugma
 *   - 4 tadan ko'p   → dastlabki 4 tasi tugma, qolgani "Yana harakatlar" ro'yxatida
 * Bosh sahifadagi demo va hujjatdagi misollar shu bitta funksiyadan foydalanadi.
 * Matnlar sahifa tilida (<html lang>).
 */
import { MOVE_LABELS, pageLang, t } from '../i18n';

export const MAX_BUTTONS = 4;

const lang = pageLang();
const text = t(lang);
export const moveLabel = (name: string) => MOVE_LABELS[lang][name] ?? name;

/** Kutilayotgan holat: model hali yuklanmagan. */
export function clearMoves(box: HTMLElement, note = text['moves.loading']) {
  const span = document.createElement('span');
  span.className = 'l3-moves-note';
  span.textContent = note;
  box.replaceChildren(span);
}

/**
 * @param names    el.animations yoki load event'idagi detail.animations
 * @param current  hozir o'ynayotgan harakat (yo'q bo'lsa null)
 * @param onPick   foydalanuvchi harakat tanlaganda
 */
export function renderMoves(box: HTMLElement, names: string[], current: string | null, onPick: (name: string) => void) {
  if (!names.length) return clearMoves(box, text['moves.none']);

  const buttons = names.slice(0, MAX_BUTTONS).map((name) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'l3-chip';
    b.dataset.move = name;
    b.textContent = moveLabel(name);
    b.addEventListener('click', () => pick(name));
    return b;
  });

  const rest = names.slice(MAX_BUTTONS);
  let more: HTMLSelectElement | null = null;
  if (rest.length) {
    more = document.createElement('select');
    more.className = 'l3-chip l3-more';
    more.setAttribute('aria-label', text['moves.more']);
    more.append(
      new Option(`${text['moves.more']} (${rest.length})`, ''),
      ...rest.map((n) => new Option(moveLabel(n), n)),
    );
    more.addEventListener('change', () => more!.value && pick(more!.value));
  }

  // Tanlangan harakat tugmalarda bo'lsa tugma bosilgan, ro'yxatda bo'lsa ro'yxat ko'k bo'ladi
  function mark(name: string | null) {
    for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.move === name));
    if (more) {
      const inList = name != null && rest.includes(name);
      more.value = inList ? name : '';
      more.classList.toggle('is-active', inList);
    }
  }
  function pick(name: string) {
    mark(name);
    onPick(name);
  }

  box.replaceChildren(...buttons, ...(more ? [more] : []));
  mark(current);
}
