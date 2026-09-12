# Known limitations - V2.4

## Learning and navigation scope

The release includes 20 substantial seed lessons, exactly one for each primary
category. It is not a full course, lesson authoring/import platform, hosted account
system or new execution engine. Model / BI Serving has a real lesson but no
artificially repurposed Practice exercise. The retained bank has 51 exercises.

Chromium was exercised at 1600x900, 1366x768, 1190x800, 1024x768, 768x1024 and
390x844. Native Safari/Firefox, physical touch devices and a full screen-reader
audit were not performed. Diagram text alternatives, labels, keyboard focus,
overlay trapping and internal code/table scrolling have automated coverage.
Desktop chrome is 52px; mobile chrome uses additional rows to keep global lab
icons and essential Practice actions visible. Theme remains a transient panel.

## Explicit blocked promotion gates

`net::ERR_BLOCKED_BY_ADMINISTRATOR` prevents Chromium navigation to the local HTTP
origin. Built-file tests run the real compiled app, CodeMirror and teaching views
with documented fixture-fetch and in-memory storage transport. They do not prove
real-origin storage, DuckDB-Wasm startup, Pyodide execution/timeout/restart, or
external Mermaid flowchart/ER/architecture rendering. Those commands were attempted
and recorded as blocked. Actual local HTTP byte/MIME checks use urllib, not a
browser, and are reported separately.

The npm registry cannot be resolved and the compiler tarball is absent from the
offline cache. Build/check use preinstalled TypeScript 5.8.3, matching the unchanged
compiler lock entry. Clean install and current high-threshold vulnerability audit
are blocked; neither is treated as successful. Hosted preview/security-header
checks were not attempted because the user explicitly prohibited GitHub/Netlify
operations. Run these gates in an allowed environment before promotion.

## Intentional teaching limits

The 51-exercise bank is preserved, not expanded into hundreds of questions. Four original cases reuse stable exercise references; each task's artifact is independent. This is a learning workflow, not a scored certification exam or hidden-test judge.

The DAX evaluator supports the existing fixed three-table model and documented subset. The new inspector exposes fixture types, PK/FK roles, grain, one-to-many direction, active status and row previews. It does not implement arbitrary semantic schemas, bridge-table propagation, bidirectional relationships, role-playing dimension engines, semi-additive time intelligence or full Power BI. Such topics remain conceptual or future carefully scoped fixtures.

DAG simulation supports the existing explicit dependency conditions, trigger-rule subset, branching/skips and one recoverable injected transient failure. Grid, timeline and task logs show a deterministic run snapshot using declared time units. No Airflow/ADF scheduler, sensors, concurrency pool, ForEach/Until engine or real dbt compilation is created. Mermaid and code/config views do not infer a runnable workflow from arbitrary source text.

Git, Bash and PowerShell remain the existing connected virtual state machines with documented command subsets. There is no host filesystem, real repository, remote authentication or command execution. Broader new exercises for pull/revert/stash/cherry-pick/safe-force scenarios were not added in this bounded navigation/learning pass. Unsaved virtual-file text survives layout/tab changes; switching the selected file still requires deliberate Save/Stage to retain that file's edit. Do not use virtual commands as proof of a real repository operation.

Spark metrics, Kubernetes events/logs, Terraform plan fragments, Docker layers and architecture comparisons are supplied evidence. Config checks are bounded teaching checks, not vendor parsers. Changing the draft never fabricates new cloud logs, timings, costs, a Spark physical plan or deployment status. PySpark remains review-only.

## Persistence and interface

Local progress is browser-origin-specific and unencrypted. Export before changing domains or clearing storage. Merge uses timestamps with local values winning ties; this is not multi-device real-time collaboration. Case-session fields continue to round-trip, but an older app may not expose them. Pre-upgrade snapshots are recovery values, not a full version history.

Editor undo, current graph camera and unsaved supplementary view text survive in-session layout/navigation. They are not a promise of full undo restoration after a browser restart. Run snapshots/selected open tools are transient; saved attempts and learning state survive reload. A temporary narrow viewport does not overwrite desktop preferences. Screen-reader access has explicit labels, keyboard controls and focus styles, but no full assistive-technology certification or exhaustive accessibility audit is claimed.

Deepnote is links-only. No URLs are invented and no notebook archive is shipped. Optional embeds depend on provider policy/access; a Data App preview is not an editable notebook. Official references are external links, not republished vendor posters.
