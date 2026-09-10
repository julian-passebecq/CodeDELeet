# Start here - full V2 source delivery

1. This branch contains the complete V2 source root: `package.json`, `src/`, `public/`, `dist`, tests and documentation.
2. Production `main` remains separate until the clean audit/promotion gates pass.
3. Export progress from Settings before testing a different domain. Import it through **Merge backup** on the V2 preview.
4. To try the included build locally: `node scripts/serve.mjs`, then open `http://127.0.0.1:5173`.
5. Read `docs/NEXT_AI_HANDOFF.md` and the GitHub CI results before promoting the preview.
6. V2.1 application development is handled from the separate Pro handoff; GitHub/Netlify release coordination stays outside that implementation pass.

## The important distinction

The workstation, virtual labs, migration and content have deterministic test evidence. A separate served-origin/runtime CI gate now exists for browser navigation, CDN access, WebAssembly/worker startup and hosted-style persistence. Do not silently replace an unavailable external runtime with a fake passing result.

## Included

Complete TypeScript source, built static `dist/`, offline editor assets, 51 exercises, migration/backups, tests and machine-readable evidence, actual rendered screenshots, optional Deepnote link-template integration, original handoff specs, and the older uploaded trainer ZIP as a reference only. Deepnote notebook archives are not part of the public site.
