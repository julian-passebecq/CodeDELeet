# Known limitations - V2.3

## Compact-shell scope

V2.3 changes shell/navigation presentation only. The current implementation was
verified with Chromium, including phone-sized and touch-emulated layouts. Native
iOS Safari, Firefox, physical devices and a full screen-reader audit were not run.
The 52px single-row header applies from 760px upward. At phone widths, the header
uses two compact internal lines (94px total) to retain every critical attempt action;
lab switches are reachable in the exercise drawer rather than forced into that row.
Theme is a transient rail overlay and intentionally cannot be pinned; other tools'
saved pin and sizing preferences remain unchanged. Identity is in Settings/browser title.

## Promotion gate, not a passed test

Actual browser URL navigation is blocked in this build environment (`net::ERR_BLOCKED_BY_ADMINISTRATOR`). The delivered deterministic browser tests exercise the actual compiled app, editor and teaching engines through a built-file transport/storage harness. Real HTTP-origin browser reload, DuckDB-Wasm startup, Pyodide execution/cancellation/restart, and Mermaid flowchart/ER/architecture-beta rendering are **UNVERIFIED here**. Run the supplied network gate and UI_MODE=http versions of all three UI suites in an allowed browser environment before V2.3 promotion. Prior V2.2 production successes do not prove V2.3 runtime behavior. Native SQLite and CPython reference checks are not browser-runtime verification.

Registry DNS was unavailable. `npm ci --ignore-scripts` could not complete here; the build/typecheck used the installed TypeScript 5.8.3, matching the existing lockfile. No current npm vulnerability audit or fresh dependency installation is claimed.

## Intentional teaching limits

The 51-exercise bank is preserved, not expanded into hundreds of questions. Four original cases reuse stable exercise references; each task's artifact is independent. This is a learning workflow, not a scored certification exam or hidden-test judge.

The DAX evaluator supports the existing fixed three-table model and documented subset. The new inspector exposes fixture types, PK/FK roles, grain, one-to-many direction, active status and row previews. It does not implement arbitrary semantic schemas, bridge-table propagation, bidirectional relationships, role-playing dimension engines, semi-additive time intelligence or full Power BI. Such topics remain conceptual or future carefully scoped fixtures.

DAG simulation supports the existing explicit dependency conditions, trigger-rule subset, branching/skips and one recoverable injected transient failure. Grid, timeline and task logs show a deterministic run snapshot using declared time units. No Airflow/ADF scheduler, sensors, concurrency pool, ForEach/Until engine or real dbt compilation is created. Mermaid and code/config views do not infer a runnable workflow from arbitrary source text.

Git, Bash and PowerShell remain the existing connected virtual state machines with documented command subsets. There is no host filesystem, real repository, remote authentication or command execution. Broader new exercises for pull/revert/stash/cherry-pick/safe-force scenarios were not added in this shell-focused pass. Unsaved virtual-file text survives layout/tab changes; switching the selected file still requires deliberate Save/Stage to retain that file's edit. Do not use virtual commands as proof of a real repository operation.

Spark metrics, Kubernetes events/logs, Terraform plan fragments, Docker layers and architecture comparisons are supplied evidence. Config checks are bounded teaching checks, not vendor parsers. Changing the draft never fabricates new cloud logs, timings, costs, a Spark physical plan or deployment status. PySpark remains review-only.

## Persistence and interface

Local progress is browser-origin-specific and unencrypted. Export before changing domains or clearing storage. Merge uses timestamps with local values winning ties; this is not multi-device real-time collaboration. New case-session fields round-trip in V2.2, but an older app may not expose them. Pre-upgrade snapshots are recovery values, not a full version history.

Editor undo, current graph camera and unsaved supplementary view text survive in-session layout/navigation. They are not a promise of full undo restoration after a browser restart. Run snapshots/selected open tools are transient; saved attempts and learning state survive reload. A temporary narrow viewport does not overwrite desktop preferences. Screen-reader access has explicit labels, keyboard controls and focus styles, but no full assistive-technology certification or exhaustive accessibility audit is claimed.

Deepnote is links-only. No URLs are invented and no notebook archive is shipped. Optional embeds depend on provider policy/access; a Data App preview is not an editable notebook. Official references are external links, not republished vendor posters.
