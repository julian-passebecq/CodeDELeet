# Release status — 2026-09-10

## Baseline

The v0.1 application source is now present on `main` after the local `v1` commit was merged with the remote documentation/CI baseline.

Release commit used for the first successful production deployment:

- `af465290c6630a78ab0bc8c315d5b68ab255bd79`

## GitHub source verification

Verified on `main`:

- `package.json`
- `netlify.toml`
- `public/index.html`
- `public/app/`
- `public/packs/`
- `public/workers/`
- source, scripts, server and tests
- architecture/content/test documentation
- preview screenshots

`netlify.toml` publishes `public/` and applies the repository security headers.

## CI

GitHub Actions run `34485778200` completed successfully on the merged application source.

Both jobs passed:

- `core`: checkout, Node/Python setup, TypeScript install, type-check, build, Node tests and Python tests.
- `ui-smoke`: Playwright/Chromium setup and embedded UI smoke tests.

This supersedes the earlier failed CI run, which failed only because the repository did not yet contain `package.json` or the app source.

## Netlify

Project: `leetdejul`

Production deploy `6aa2b6fc6e0d18000885d746` completed with state `ready` from commit `af465290c6630a78ab0bc8c315d5b68ab255bd79`.

Netlify reports:

- 13 new files uploaded;
- generated page: `index.html`;
- 12 other assets changed;
- repository header rule processed successfully;
- no Functions or Edge Functions required.

Production URL: https://leetdejul.netlify.app/

## Current quality assessment

The current v0.1 is a sound prototype and a valid content/execution foundation. The main remaining weakness is product ergonomics rather than basic correctness: each specialist workspace is currently vertically expansive and feels closer to a teaching dashboard than to a constrained interview workstation.

Do not expand the question bank heavily before fixing the attempt shell.

## Next implementation order

1. **P0 — desktop interview shell**: resizable Question/Data/Schema left pane, Editor/Canvas right pane, collapsible Results/Explanation/Visual/Notes/History bottom drawer.
2. **P0 — Monaco + DuckDB-Wasm**: production-grade editor and real in-browser SQL for static Netlify mode.
3. **P1 — artifact-driven specialist labs**: Airflow-style run/grid states, dbt manifest/run-results fixtures, ADF dependency conditions, Spark-UI-style diagnostics, OpenTofu plan JSON review and Kubernetes schema/troubleshooting exercises.
4. **P1 — Model Lab v2**: arbitrary star schemas, relationship/filter propagation, SCD/bridge/role-playing dimensions and richer DAX investigation.
5. **P2 — bounded terminal drills**: Git/Linux exercises through a browser terminal backed by a virtual filesystem rather than host shell access.

The implementation details and acceptance gates are maintained in `docs/PRO_MODEL_NEXT_PASS.md`.
