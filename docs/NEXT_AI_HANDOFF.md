# Handoff to the branch / deployment AI

## User boundary

User requested a local ZIP, no pushes or deployments by the V2 builder. That boundary was respected. You must obtain any required authorization for your own branch/deployment operations from your conversation with the user. Do not modify production by default.

## Baseline and files

Read-only source baseline: `julian-passebecq/CodeDELeet` commit `d3c7c21ba79a082da21925b5ee0dce69212577fe`. The current four-lab TypeScript app, not the uploaded older React trainer, is the migration baseline. Relevant core, graph, DAX, type and complete starter-content contracts were inspected and refactored. The shared shell/editor/investigation views are V2 implementations, not a claim of a byte-for-byte overlay of every original source file.

Extract the V2 ZIP **at the branch root**. Keep `src`, `public`, `scripts`, tests, docs, examples, the license and build config. `dist` is a build artifact supplied for immediate inspection, not a second source of truth. `reference/legacy-trainer` is not loaded by the app. No `node_modules`, account tokens or serverless runner is required.

## First validation

```sh
npm ci --ignore-scripts
npm run check
npm test
python -m pip install -r requirements-dev.txt
python tests/fixture_check.py
python -m playwright install chromium
npm start
```

With the server running, use another terminal:

```sh
UI_MODE=http python tests/ui_smoke.py
python tests/network_runtime_smoke.py
```

On Windows, set environment variables with PowerShell `$env:UI_MODE='http'` rather than POSIX prefix syntax. `BASE_URL` defaults to `http://127.0.0.1:5173`. `CHROMIUM_PATH` is optional.

The included lockfile uses verified npm registry metadata and integrity. Run `npm ci` in the target environment to verify a clean download/install. The submitted release was type-checked with exactly TypeScript 5.8.3.

## Required promotion gates (not passed by the local harness)

- Real-origin asset loading, CodeMirror lazy script delivery, page reload and persistent localStorage on the preview domain.
- DuckDB-Wasm SQL: cold startup, reference answers, column/row comparison, nulls/empty/tie fixtures, invalid queries, timeout/cancel/restart.
- Pyodide: cold startup, Python and pandas references, error output, infinite-loop termination and successful run after cancellation.
- Mermaid flowchart, ER and architecture-beta via the pinned CDN, including unavailable-CDN fallback.
- Chromium plus Firefox (where practical), desktop 1366px/1600px, tablet and phone. The actual local screenshots are in evidence/.
- A manually exported V1 backup restored on the preview; notes and bookmarks still present after a **full browser reload**.
- Optional real Deepnote URLs: import the mapping only after the user supplies their actual project/notebook URLs. Never invent them or configure a foreign account.

## Deployment settings

Node 22; build command `npm run build`; publish directory `dist`; no backend/functions; no secrets. Preserve the current production site. A manual static preview can publish the contents of `dist`. Run `scripts/build.mjs` through `npm run build` after any content or source edit.

## Do not re-architect this release

First close the real-origin/runtime gates and fix only demonstrated defects. Read `docs/V2_1_BACKLOG.md` for deliberately deferred work. Do not disguise simulations as Spark/Airflow/Power BI executions. Do not bulk-import the legacy exercise bank without a provenance and content audit. Do not treat built-in solutions as secret tests.

## Raw companion material review

The static build currently includes the supplied Deepnote suite as a downloadable companion. Review its embedded source/license notices and any personal notes before making the preview public. Remove `public/companion/` and its download link if the suite should remain private. The old trainer archive under `reference/legacy-trainer/` is repository reference material, not a running app dependency; it can be omitted from a public branch after your review. No archive was uploaded or published by this builder.
