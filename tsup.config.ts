import { defineConfig } from 'tsup';

// dist/ ni build skripti o'zi tozalaydi: konfiglar parallel ishlagani uchun
// bu yerda clean: true bir-birining natijasini o'chirib yuborishi mumkin.
export default defineConfig([
  // npm paketi: three — peer dependency, foydalanuvchi bundleri o'zi hal qiladi
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    target: 'es2020',
    splitting: true,
    treeshake: true,
    minify: true,
    sourcemap: true,
    outDir: 'dist',
    external: ['three'],
  },
  // React wrapper: 'use client' saqlanishi va element bitta nusxada qolishi uchun
  // alohida build, ./index.js tashqi modul sifatida qoladi.
  {
    entry: { react: 'src/react.ts' },
    format: ['esm'],
    target: 'es2020',
    minify: true,
    sourcemap: true,
    outDir: 'dist',
    external: ['three', 'react', './index.js'],
    banner: { js: "'use client';" },
  },
  // CDN build: three ichiga qo'shilgan, <script type="module"> bilan ishlaydi
  {
    entry: { 'lite3d.cdn': 'src/index.ts' },
    format: ['esm'],
    target: 'es2020',
    splitting: true,
    treeshake: true,
    minify: true,
    outDir: 'dist/cdn',
    noExternal: ['three'],
  },
]);
