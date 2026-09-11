# CodeDELeet V2.2 - source/build handoff

This is the completed shared-workstation UX pass on the supplied V2 source. It is not a replacement app. No repository or deployment operations were performed for this pass.

## Start

Extract the source ZIP at the project root. Keep `src/`, `public/`, `dist/`, `package.json`, tests and documentation together. The separate build ZIP contains the contents of `dist/` at its root.

Run the included static build with `node scripts/serve.mjs dist`, then open the local address printed by the server. Use an HTTP origin; double-clicking `index.html` is not supported. To rebuild, run `npm ci --ignore-scripts`, `npm run check`, then `npm run build`.

Read [the coordinator handoff](docs/NEXT_AI_HANDOFF.md), [migration/audit report](docs/V2_2_AUDIT.md), [test report](docs/V2_2_TEST_REPORT.md) and [known limitations](docs/KNOWN_LIMITATIONS.md).

## Preserve personal work

Export progress from the existing site before moving to a different preview origin. Import through Settings > Merge backup on the new origin. The storage key and schema remain unchanged. Existing V1/V2 answers stay under their original exercise IDs; authored-case answers are separate.

## Important release distinction

The source/build and deterministic checks are delivered here. The real HTTP-origin browser/CDN/worker promotion gate is **UNVERIFIED** because this execution environment blocks URL navigation. It is not a passed test. The coordinator must run `npm run test:network` on an allowed local origin or isolated preview before production promotion. That gate includes DuckDB-Wasm, Pyodide, cancellation/restart, browser reload and the three Mermaid syntaxes.

## Deepnote is links-only

No notebook ZIP or `.ipynb` file is in `public/` or `dist/`. Nothing is uploaded to Deepnote. Blank mappings hide the companion action. Configure explicit safe URLs through Settings only when a companion is needed. CodeDELeet otherwise works independently.
