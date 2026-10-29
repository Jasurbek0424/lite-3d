# Contributing to lite3d

Thanks for helping out. Bug reports, docs fixes, translations and features are all welcome.

## Workflow

1. **Fork** the repository on GitHub and clone your fork:
   ```bash
   git clone https://github.com/<your-name>/lite-3d.git
   cd lite-3d
   ```
2. Create a branch: `git checkout -b fix-hotspot-offset`.
3. Make your change, commit, and push to **your fork**: `git push origin fix-hotspot-offset`.
4. Open a pull request against `main` in `Jasurbek0424/lite-3d`.

Nobody pushes to `main` directly. Every change goes through a pull request, and CI must be green before it is merged. After a merge, the docs site is redeployed automatically.

For larger features, please open an issue first so we can agree on the approach.

## Local setup

Requires Node.js 22+.

```bash
npm i
npm run build        # library → dist/
npm run typecheck
npm run size         # first-load size check (must stay under 5 KB gzip)
```

The docs site lives in `docs/` (Astro Starlight) and imports the library straight from `src/`, so you can see your change live:

```bash
cd docs
npm i
npm run dev          # http://localhost:4321/lite-3d/
```

## Project layout

| Path | What it is |
|---|---|
| `src/index.ts` | The `<lite-3d>` element. Loaded on every page, so keep it small and free of three.js imports. |
| `src/renderer.ts` | The three.js renderer, loaded lazily with a dynamic import. |
| `src/react.ts` | React wrapper (`lite3d/react`). |
| `scripts/` | Model tools (`subdivide.mjs`, `glb-to-gltf.mjs`) and the size check. |
| `docs/` | Documentation site in English (`src/content/docs/`), Uzbek (`uz/`) and Russian (`ru/`). |

## Guidelines

- **Size matters.** `src/index.ts` must not import three.js or anything heavy. CI fails if the first load goes over 5 KB gzip.
- **Accessibility.** Keep keyboard access, `alt` text and `prefers-reduced-motion` behavior working.
- **Docs.** If you add or change an attribute, method or event, update `docs/src/content/docs/reference/`. Translations into Uzbek and Russian are appreciated but not required; a maintainer can fill them in.
- **Models.** Only add sample models with a license that allows redistribution (CC0 or CC-BY), and credit the author in `docs/src/data/models.ts`.

## Releases

Maintainers publish to npm by creating a GitHub Release; the `Release` workflow builds and publishes the package.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
