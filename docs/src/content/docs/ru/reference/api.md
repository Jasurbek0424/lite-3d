---
title: Методы и свойства
description: Работа с <lite-3d> из JavaScript.
---

```js
const el = document.querySelector('lite-3d');
```

Методы, которые работают с моделью, дают результат после события `load`. До этого они возвращают `null`, `false` или пустой список.

## Методы

| Метод | Возвращает | Значение |
|---|---|---|
| `activate()` | `Promise<void>` | Загрузить 3D сейчас, независимо от `loading` |
| `resetCamera()` | — | Вернуть камеру в начальное положение |
| `getCameraOrbit()` | `{ azimuth, polar, distance }` | Углы камеры в градусах |
| `play(name?)` | — | Запустить или продолжить анимацию |
| `pause()` | — | Поставить анимацию на паузу |
| `setMaterialColor(name, color)` | `boolean` | Сменить цвет материала, `null` — исходный |
| `positionFromPoint(x, y)` | `{ position, normal }` или `null` | Поверхность модели под точкой экрана (для хотспотов) |
| `createPoster(options?)` | `Blob` или `null` | Картинка с начальной камеры |
| `toDataURL(type?)` | `string` или `null` | Текущий кадр, по умолчанию PNG |

## Свойства

| Свойство | Тип | Значение |
|---|---|---|
| `src` | `string` | Адрес модели (изменение загружает новую модель) |
| `loading` | `'lazy' \| 'eager' \| 'interaction'` | Режим загрузки |
| `loaded` | `boolean` | Готова ли модель |
| `variants` | `string[]` | Имена вариантов в модели |
| `animations` | `string[]` | Имена анимаций в модели |
| `materials` | `string[]` | Текущие имена материалов в сцене |
| `paused` | `boolean` | Стоит ли анимация на паузе |

## TypeScript

Типы идут вместе с пакетом. `document.querySelector('lite-3d')` автоматически возвращает тип `Lite3DElement`.

```ts
import type { Lite3DElement, ModelInfo, PosterOptions } from 'lite3d';
```
