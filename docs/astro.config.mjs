import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// Sayt kutubxonani to'g'ridan-to'g'ri ../src dan oladi: build qilmasdan har doim eng so'nggi kod.
const lib = fileURLToPath(new URL('../src/index.ts', import.meta.url));

// Sidebar guruhlari: sahifa sarlavhalari har bir tilning o'z faylidan olinadi
const group = (label, translations, items) => ({ label, translations, items });

export default defineConfig({
  // GitHub Pages: https://jasurbek0424.github.io/lite-3d/
  site: 'https://jasurbek0424.github.io',
  base: '/lite-3d',
  integrations: [
    starlight({
      title: 'lite3d',
      description: 'A lightweight web component for putting a 3D product viewer on your site with a single tag.',
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        uz: { label: "O'zbekcha", lang: 'uz' },
        ru: { label: 'Русский', lang: 'ru' },
      },
      favicon: '/favicon.svg',
      // Kod bloklari ramkasiz: fon rangi o'zi ajratib turadi
      expressiveCode: { styleOverrides: { borderColor: 'transparent' } },
      customCss: [
        '@fontsource/schibsted-grotesk/400.css',
        '@fontsource/schibsted-grotesk/500.css',
        '@fontsource/schibsted-grotesk/700.css',
        '@fontsource/martian-mono/400.css',
        '@fontsource/martian-mono/500.css',
        './src/styles/theme.css',
      ],
      components: {
        Header: './src/components/Header.astro',
        Hero: './src/components/Hero.astro',
        MobileMenuFooter: './src/components/MobileMenuFooter.astro',
      },
      sidebar: [
        group('Getting started', { uz: 'Boshlash', ru: 'Начало работы' }, [
          'start/introduction',
          'start/installation',
          'start/first-model',
        ]),
        group('Guides', { uz: "Qo'llanmalar", ru: 'Руководства' }, [
          'guides/loading',
          'guides/hotspots',
          'guides/variants',
          'guides/animations',
          'guides/poster',
          'guides/ar',
          'guides/styling',
          'guides/preparing-models',
        ]),
        group('Frameworks', { uz: 'Frameworklar', ru: 'Фреймворки' }, [
          'frameworks/html',
          'frameworks/react',
          'frameworks/nextjs',
        ]),
        group('Reference', { uz: "Ma'lumotnoma", ru: 'Справочник' }, [
          'reference/attributes',
          'reference/api',
          'reference/events',
        ]),
      ],
    }),
  ],
  vite: {
    resolve: { alias: { lite3d: lib } },
    server: { fs: { allow: ['..'] } },
  },
});
