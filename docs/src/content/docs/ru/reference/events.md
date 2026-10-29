---
title: События
description: События элемента <lite-3d> и их данные.
---

| Событие | `e.detail` | Когда |
|---|---|---|
| `progress` | `{ progress }` | Пока загружается модель, от 0 до 1 |
| `load` | `{ url, ms, variants, animations, materials }` | Когда модель готова и нарисован первый кадр |
| `error` | `{ error }` | Если не загрузилась модель или 3D-движок |
| `camera-change` | — | Когда пользователь или autorotate двигает камеру |
| `animation-finish` | `{ name }` | Когда закончилась анимация с `animation-loop="false"` |

```js
el.addEventListener('load', (e) => {
  const { url, ms, variants, animations } = e.detail;
  console.log(`${url} загружен за ${ms} мс`);
});

el.addEventListener('error', (e) => {
  console.error('Модель не открылась:', e.detail.error);
});
```

## Атрибут состояния

Кроме событий, элемент хранит текущее состояние в атрибуте `data-state`: `idle`, `loading`, `ready`, `error`, `fallback`. Во время загрузки ставится `aria-busy="true"`.
