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

## What those runs actually tested

**58 Node checks:** V1 migration and field preservation, merge rules, pack versions and stable IDs, unsafe IDs/source URLs, runtime-badge normalization, URL filtering, SQL guard and result comparison, graph/DAG rules, DAX context, connected Git transitions and conflicts, Bash text streams and PowerShell object pipelines.

**42 native checks:** SQL reference results under SQLite 3.46.1 for the portable fixtures; Python references under native CPython 3.13.5 and pandas; PySpark source syntax only; and 12 exact supplied Deepnote notebook section references. SQLite is not DuckDB, native CPython is not browser Pyodide, and syntax checking is not Spark execution.

**68 UI checks:** actual V2 compiled JavaScript, CSS, CodeMirror, event handlers and engine code rendered in Chromium 144.0.7559.96. Includes all 51 question/renderer/view paths, explicit solution reveal, saved drafts, pane resize/collapse/focus, search/filtering, Bash and PowerShell form execution, Git merge/prediction/conflict, DAG JSON/retry flow, DAX/KPI filters, supplied configuration and Spark evidence, Deepnote URL mapping, backup file import, V1 boot snapshot and phone tabs/library.

## Browser harness - not an end-to-end deployment claim

Managed Chromium blocks all URL navigation in this environment, including localhost. `tests/browser_harness.py` loads the **actual built files** into a page with `set_content` and module injection, substituting delivery/fetch/localStorage transport only. It does not replace the application UI or lab functions with screenshots/mocks. Screenshots show actual rendered DOM, not AI-generated concept art.

This proves the tested interactions in that harness, not an HTTP origin, browser-storage implementation, MIME delivery, runtime CDN or worker startup. The final static integrity script independently checks local HTTP bytes/MIME through urllib, which still does not prove browser execution.

## Explicitly unverified gates

`tests/network_runtime_smoke.py` was actually attempted. Its report is **UNVERIFIED: origin unavailable or navigation blocked**, with `net::ERR_BLOCKED_BY_ADMINISTRATOR` from Chromium. Zero network checks executed; the report is not counted as passing tests.

Unverified: real DuckDB-Wasm cold startup and results; Pyodide download/worker execution; cancellation and timeout against those real loaded engines; optional Mermaid flowchart/ER/architecture CDN rendering; HTTP-origin reload/persistence; hosted Netlify behavior; Firefox; cold npm dependency download/install. Source implementations and a normal-environment smoke test are included for the next AI.

## Test reproducibility

`npm ci --ignore-scripts && npm test`, then install `requirements-dev.txt` for the Python/browser suites. Run `python tests/fixture_check.py` and `python tests/ui_smoke.py` for the documented local checks. Start the server and use `UI_MODE=http` for actual served-origin UI checks; run `python tests/network_runtime_smoke.py` for network/worker gates. Do not quietly substitute SQLite or simulated output when a browser runtime fails.

## Screenshots

Ten actual rendered captures in `evidence/`: shared code workstation, Bash, PowerShell, Git, DAG retries, DAX filters, Kubernetes evidence, PySpark guided review, Spark performance fixture and mobile. Images use synthetic teaching data.

## Release decision

Full source release candidate suitable for an isolated review preview. **Not a claim of production certification or all acceptance gates passed.** The next AI must record real-origin/runtime results before promoting production.
