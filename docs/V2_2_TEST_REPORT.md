# CodeDELeet V2.2 - actual test report

**Release:** 2.2.0. **Recorded:** 2026-09-10T19:15:07.036272+00:00. **Disposition:** local validation complete; real-origin preview promotion is pending.

This report records executed tests against the delivered compiled build. It does not substitute a native Python check for Pyodide, SQLite for DuckDB-Wasm, or a built-file browser harness for hosted-origin validation. No GitHub or Netlify activity occurred during this pass.

## Executed validation

| Gate | Result | Evidence |
| --- | --- | --- |
| `npm run check` | PASS | [Compiler log](../evidence/v22/typecheck-final.log) |
| `npm run build` | PASS | [Build log](../evidence/v22/build-final.log) |
| `npm test` | **80 passed, 0 failed** | [Complete Node test output](../evidence/v22/unit-final.log) |
| `python tests/fixture_check.py` | **42 passed, 0 failed** | [Native/reference JSON](../evidence/v22/fixture-report.json) |
| `python tests/ui_smoke.py` | **68 passed, 0 failed**, no page errors | [All-exercise UI JSON](../evidence/v22/ui-legacy-report.json) |
| `python tests/v22_ui.py` | **30 passed, 0 failed**, no page errors | [New shell/case UI JSON](../evidence/v22/ui-shell-report.json) |
| `python scripts/validate_release.py` | **22 passed, 0 failed** | [Static/local HTTP integrity JSON](../evidence/v22/release-integrity-report.json) |
| `python tests/network_runtime_smoke.py` | **UNVERIFIED**; navigation blocked before test cases | [Exact origin error JSON](../evidence/v22/network-runtime-report.json) |
| `npm ci --ignore-scripts` | **BLOCKED**; registry DNS failure | [Actual npm error](../evidence/v22/npm-ci.log) |

The five counted deterministic suites total **242 passing checks**. Typecheck and build are separate gates, not additional test cases. Browser/runtime cases that did not execute are **not** counted as passed. A current dependency vulnerability audit was not run.

## Exact environment

Node v22.16.0; TypeScript 5.8.3 (preinstalled global compiler, matching the exact package/lockfile version); Python 3.13.5; pandas 2.2.3; SQLite 3.46.1; Playwright 1.57.0; Chromium 144.0.7559.96. The clean npm install failed with `EAI_AGAIN` for `registry.npmjs.org`; the build did not silently use a different compiler.

Browser tests exercised 1600 x 1000, 1920 x 1080, 1024 x 768, and 390 x 844 viewports. The browser could not navigate even to the local HTTP origin: `net::ERR_BLOCKED_BY_ADMINISTRATOR`. The built-file harness supplies the compiled modules/assets and a storage/transport adapter, but preserves the real UI, CodeMirror instance, DOM events, layout, and bounded domain engines. It does not fake successful worker or CDN execution. Separately, actual urllib HTTP requests proved eight static asset byte/MIME responses and the removed archive's 404.

## Coverage and acceptance evidence

**Existing contracts retained.** All original 58 unit tests remain passing, with 22 new unit tests for the shell, case sessions, safe metadata, migration, themes, output fingerprints and presentation state. The 68-case browser suite renders all 51 questions and exercises the inherited code, Git, terminal, DAG, DAX, configuration and import workflows. Existing public IDs are not renumbered: all 51 V2 IDs and all 27 original V1 IDs remain present.

**New shell and state.** The 30 browser checks prove all 12 lab/mode combinations; switching a preset does not implicitly start a case; real CodeMirror Doc identity, undo, cursor and answer survive view changes; Focus restores the exact saved layout/tool state; all four output anchors are independent of the reading tool; resized preferences persist; a narrow viewport falls back without overwriting the desktop layout; running/failing/stale evidence is separate from a closed output pane. Notes survive closure. Tests exercise overlay/pin behavior and theme/terminal controls rather than only checking class names.

**Specialist views.** Tests cover selected model tables and relationships with typed columns, keys, grain, direction and active state; pipeline graph selection, zoom, retries, configuration text, timeline and log evidence; connected Git commits and unsaved virtual-file text across layout modes; PowerShell object-session preservation. These remain bounded teaching views, not host/cloud control planes.

**Authored cases.** Four cases contain 16 reference/exhibit pages and 12 independent tasks in total. Page and task cursors move independently, drafts remain isolated from standalone exercise attempts, deliberate copy creates recoverable checkpoints, and a fresh app boot restores the case cursor and saved answers. Case mode alone is a layout preference, not an attempt mutation.

**Migration and content policy.** V1 boot preserves the original learning fields and a byte-equivalent pre-upgrade recovery snapshot. Safe explicit Deepnote links show a button; absent links hide it; deceptive hosts are rejected without replacing a prior good mapping. No notebook/ZIP is in `public/` or `dist/`, and the build includes a rejection guard. Mermaid is pinned to 11.16.1 in runtime and build metadata. Tests verify the pin and loading contract, **not** actual CDN rendering.

## Native/reference checks are labelled by what ran

The 42 reference checks comprise **12 SQLite portable-SQL checks**, **15 native CPython/pandas reference checks**, **3 PySpark syntax-only checks**, and **12 Deepnote mapping-contract checks**. The latter compare metadata retained from the original mapping record; they did not open notebooks or verify a live Deepnote workspace. No Spark cluster was used.

## Actual screenshots

The [screenshot gallery](../evidence/v22/gallery.html) contains seven V2.2 captures: Code/Solve, Model/Designer, Pipeline/Designer, Systems/Compare and Diagnose, authored case navigation, Fluent Soft with inherited terminal, and the phone workspace. Ten additional exercise-regression captures remain in `evidence/`. These are screenshots from the actual compiled application, not generated visual concepts. Automated test inputs (including distinctive SQL values used to detect draft leakage) can appear in the captures; they are not advertised solutions.

The final phone capture was visually reviewed after fixing an overlay that covered the workspace after switching back from Tools. The new regression explicitly checks that the tool panel is hidden and the terminal input accepts a pointer click, rather than relying only on the underlying element's visibility.

## Remaining real-origin release gates

Before preview promotion, the coordinator must run a clean dependency install/audit, then the supplied [real-origin test](../tests/network_runtime_smoke.py) and full UI suite with `UI_MODE=http`. Required runtime checks include actual SQL and Python/pandas reference execution, first-time worker/CDN download, invalid input, cancellation, timeout/restart, subsequent success, origin storage reload, and Mermaid flowchart, ER and architecture-beta rendering. No network result is inferred from the local reference suites. The test exits **2** with an explicit unverified report when setup/navigation cannot run.

See [known limitations](KNOWN_LIMITATIONS.md) for domain-engine scope and [coordinator handoff](NEXT_AI_HANDOFF.md) for integration instructions. A final rebuild matched all 62 tested build assets byte-for-byte; see [rebuild evidence](../evidence/v22/rebuild-reproducibility.json). Current source/build file hashes are in the release manifest and [build inventory](../evidence/v22/build-files.json); the source archive also contains `SHA256SUMS.txt`. The separate delivery verification file records actual ZIP CRC, byte and manifest verification.
