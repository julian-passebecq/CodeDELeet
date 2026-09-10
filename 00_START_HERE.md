# Start here - full V2 source delivery

1. Extract this archive. Its root contains `package.json`, `src/`, `public/`, `dist/` and documentation.
2. Keep production and the current default branch untouched. This delivery author performed read-only GitHub inspection only; no branch, commit, site or deploy was created.
3. On the existing app, export progress from Settings before testing a different domain. Import it through **Merge backup** on the V2 preview.
4. To try the included build locally: `node scripts/serve.mjs`, then open `http://127.0.0.1:5173`.
5. For a new branch, place these **extracted files** in the repository root. Do not add another nested project folder or commit a ZIP as the application.
6. Read `docs/NEXT_AI_HANDOFF.md`. Run the external-runtime/HTTP-origin release gates there before treating the preview as production-ready.

## The important distinction

The workstation, virtual labs, migration and content have actual local test evidence. Browser navigation is blocked by policy in the build environment. The browser UI tests therefore render the built files in a documented in-memory harness; they do not prove real-origin loading, CDN access, WebAssembly worker startup or hosted persistence. Those unverified gates are clearly reported, not silently passed.

## Included

Complete TypeScript source, built static `dist/`, offline editor assets, 51 exercises, migration/backups, tests and machine-readable evidence, actual rendered screenshots, the supplied Deepnote companion ZIP, original handoff specs, and the older uploaded trainer ZIP as a reference only.
