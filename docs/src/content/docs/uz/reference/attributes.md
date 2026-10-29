---
title: Atributlar
description: <lite-3d> elementining barcha atributlari.
---

## Model va yuklash

| Atribut | Standart | Ma'nosi |
|---|---|---|
| `src` | — | Model manzili: `.glb` yoki `.gltf` |
| `alt` | `3D model` | Ekran o'quvchilar uchun tavsif |
| `loading` | `lazy` | `lazy`, `eager` yoki `interaction`. [Batafsil](../../guides/loading/) |
| `poster` | — | 3D tayyor bo'lguncha ko'rinadigan rasm. `auto` — avtomatik. [Batafsil](../../guides/poster/) |
| `draco-decoder` | — | Draco bilan siqilgan modellar uchun decoder papkasi |

## Kamera va ko'rinish

| Atribut | Standart | Ma'nosi |
|---|---|---|
| `autorotate` | yo'q | Model sekin aylanadi |
| `autorotate-speed` | `1` | Aylanish tezligi |
| `camera-controls` | yoqiq | `"false"` bo'lsa foydalanuvchi kamerani boshqara olmaydi |
| `exposure` | `1` | Umumiy yorqinlik |
| `tone-mapping` | `neutral` | `neutral` (mahsulot ranglarini saqlaydi), `aces` yoki `agx` |
| `environment` | xona yorug'ligi | `"none"` bo'lsa oddiy yorug'lik |
| `shadow` | yo'q | Model ostida kontakt soya |
| `background` | shaffof | 3D sahna foni, istalgan CSS rangi |

## Material va animatsiya

| Atribut | Standart | Ma'nosi |
|---|---|---|
| `variant` | — | Material varianti nomi. [Batafsil](../../guides/variants/) |
| `autoplay` | yo'q | Animatsiyani avtomatik boshlash |
| `animation-name` | birinchisi | Qaysi animatsiya |
| `animation-speed` | `1` | Animatsiya tezligi |
| `animation-loop` | yoqiq | `"false"` — bir marta ijro etish |

## AR

| Atribut | Standart | Ma'nosi |
|---|---|---|
| `ar` | yo'q | "AR'da ko'rish" tugmasi. [Batafsil](../../guides/ar/) |
| `ios-src` | — | iOS Quick Look uchun `.usdz` fayl |

## Slotlar

| Slot | Ma'nosi |
|---|---|
| `hotspot` | Model nuqtasiga bog'langan yorliq. [Batafsil](../../guides/hotspots/) |
| `fallback` | WebGL bo'lmaganda ko'rinadi |
| `activate-label` | "View in 3D" tugmasi matni |
| `ar-label` | "View in AR" tugmasi matni |

Atributlarni istalgan vaqtda o'zgartirish mumkin: element sahnani qayta yuklamasdan yangilaydi. Faqat `src` o'zgarsa yangi model yuklanadi.
