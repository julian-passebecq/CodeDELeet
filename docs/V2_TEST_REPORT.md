# V2 test report - 2026-09-10

## Actual completed runs

| Check | Result | Evidence |
|---|---|---|
| Strict TypeScript type check | PASS, TypeScript 5.8.3 | `evidence/typecheck.log` |
| Static source build | PASS, Node 22.16.0 | Generated `public/app/`, `dist/` |
| Node unit/contract tests | 58 passed, 0 failed | `evidence/unit-tests.tap` |
| Native reference/content checks | 42 passed, 0 failed | `evidence/fixture-report.json` |
| Chromium built-file UI checks | 68 passed, 0 failed, 0 page errors | `evidence/ui-report.json`, `ui-console.log` |
| Lockfile validation | Offline package-lock update and npm ci **dry run** passed | `evidence/lockfile-validation.log` |
| Static asset, archive and documentation integrity | See machine-readable final release check | `evidence/release-integrity-report.json` |
| GitHub served-origin promotion gate | ACTIVE; deterministic/static HTTP checks pass, runtime job pending rerun after navigation-readiness fix | GitHub Actions `runtime-smoke` |

## What those runs actually tested

**58 Node checks:** V1 migration and field preservation, merge rules, pack versions and stable IDs, unsafe IDs/source URLs, runtime-badge normalization, URL filtering, SQL guard and result comparison, graph/DAG rules, DAX context, connected Git transitions and conflicts, Bash text streams and PowerShell object pipelines.

**42 native checks:** SQL reference results under SQLite 3.46.1 for the portable fixtures; Python references under native CPython 3.13.5 and pandas; PySpark source syntax only; and Deepnote mapping metadata. SQLite is not DuckDB, native CPython is not browser Pyodide, and syntax checking is not Spark execution.

**68 UI checks:** actual V2 compiled JavaScript, CSS, CodeMirror, event handlers and engine code rendered in Chromium. Includes all 51 question/renderer/view paths, explicit solution reveal, saved drafts, pane resize/collapse/focus, search/filtering, Bash and PowerShell form execution, Git merge/prediction/conflict, DAG JSON/retry flow, DAX/KPI filters, supplied configuration and Spark evidence, Deepnote URL mapping, backup file import, V1 boot snapshot and phone tabs/library.

## Browser harness and served-origin gate

`tests/ui_smoke.py` defaults to a documented in-memory **delivery harness** that renders the actual built JavaScript, CSS, CodeMirror and DOM. `UI_MODE=http` uses the same interaction suite against a real served origin.

GitHub Actions now contains a separate `runtime-smoke` promotion job. Static HTTP delivery and release-integrity checks pass there. A prior run timed out because Playwright waited for `networkidle`; that condition is inappropriate for an app that may keep legitimate CDN/runtime requests active. The harness now uses `DOMContentLoaded` plus an explicit application-shell readiness assertion. The next CI run must prove that served-origin interaction path and then execute `tests/network_runtime_smoke.py`.

## External runtime gates

The promotion job is responsible for proving, on a real HTTP origin with network access:

- DuckDB-Wasm cold startup and representative SQL execution;
- Pyodide download/worker execution, error path, cancellation, timeout and restart;
- HTTP-origin localStorage reload/persistence;
- Mermaid flowchart, ER and `architecture-beta` rendering using the pinned patched runtime;
- no fallback that silently substitutes SQLite/native Python/simulated results for those browser runtimes.

## Deepnote policy

Deepnote is links-first only. No notebook archive is bundled or published by the site. Built-in mappings are blank examples keyed by stable exercise ID; buttons appear only after the user configures an allowed HTTPS Deepnote URL. The app does not invent notebook URLs, credentials or editable embeds.

## Test reproducibility

`npm ci --ignore-scripts && npm test`, then install `requirements-dev.txt` for the Python/browser suites. Run `python tests/fixture_check.py` and `python tests/ui_smoke.py` for the deterministic checks. Start the server and use `UI_MODE=http` for served-origin UI checks; run `python tests/network_runtime_smoke.py` for the network/worker gates. Do not quietly substitute SQLite or simulated output when a browser runtime fails.

## Screenshots

Ten actual rendered captures in `evidence/`: shared code workstation, Bash, PowerShell, Git, DAG retries, DAX filters, Kubernetes evidence, PySpark guided review, Spark performance fixture and mobile. Images use synthetic teaching data.

## Release decision

Full source release candidate suitable for an isolated review preview. Merge to production only after the GitHub `runtime-smoke` job is green on the current PR head and the corresponding Netlify deploy preview is healthy.
