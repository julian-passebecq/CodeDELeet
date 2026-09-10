# V2 implementation audit

## Inputs and authority

The current clean V2 candidate is maintained on `v2-clean-audit` and reviewed through PR #4. The inspected production baseline remains commit `d3c7c21ba79a082da21925b5ee0dce69212577fe` until promotion. The older uploaded trainer ZIP remains a reference only and is not loaded by the application.

Deepnote is now deliberately **link/template only**. No Deepnote notebook archive is retained in `public/` or `dist/`; blank mapping examples preserve the future Open-in-Deepnote workflow without publishing notebook contents.

## Acceptance gate assessment

| Gate | Delivered evidence / boundary |
|---|---|
| Stable IDs and state | All 27 baseline IDs retained; V1 key/schema preserved; migration and merge tests; browser boot snapshot test. Cross-origin export/import required. |
| Shared shell | One fixed-height workstation, resizable columns/drawer, persisted layout, focus and mobile panels. Browser interactions and real screenshots included. |
| Solutions | No automatic solution reveal; explicit reveal per exercise; draft remains separate. |
| SQL/Python | Real browser adapters are implemented and lazy-loaded. DuckDB-Wasm and Pyodide are checked by a separate real-origin/runtime CI job before promotion. |
| PySpark | Specific review renderer with schema/sample rows/plan and optional blank Deepnote mapping; no false Spark runtime badge. |
| Model/BI | Functional teaching-model filters, grain/relationship checks and bounded DAX. Arbitrary semantic-model execution is deferred. |
| Pipeline | Functional canonical graph editing and deterministic rules/retries/skip; separate dbt investigation. No real orchestration or transaction execution. |
| Spark/config | Supplied meaningful task/plan/event/layer evidence plus bounded diagnosis/checks. Values never presented as learner-code measurements. |
| Terminal/Git | Connected virtual state, separate Bash/PowerShell semantics, state-based Git goal checks, command/unit/UI evidence. |
| Architecture | Original editable conceptual graph/script plus Mermaid source/renderer/export. Mermaid is pinned to 11.16.1 for this release; real browser/CDN rendering belongs to the runtime promotion gate. |
| Representative content | 51 curated questions covering all 13 renderer types. No bulk legacy-bank import claim. |
| Tests | Deterministic Node, fixture and built-file Chromium suites plus a separate served-origin/runtime promotion job. Do not count blocked external runtime checks as passing. |

## Release hardening after the original V2 build

- Removed stale V1 files from the clean candidate branch.
- Added a dedicated served-origin runtime CI job while retaining the fast deterministic contracts job.
- Updated GitHub Actions to current v7 majors used by the release branch.
- Raised Mermaid from 11.4.1 to the patched 11.16.1 release baseline.
- Removed the publicly downloadable Deepnote example archive and converted the integration to blank URL templates/user-configured links.
- Kept production `main` separate while PR #4 is audited.

## Defects corrected during V2 implementation

- Desktop workspace grid and drawer-row collapse bugs.
- Spark metric fixture shape mismatch.
- Playwright harness argument/waiting issues.
- PowerShell output casing expectation while retaining object semantics.
- Git fetch/index/working-tree isolation and conflict staging cases.
- Diagram-script versus Mermaid field separation.
- SQL trailing-comment and read-only validation cases.
- Python execution timeout/cancellation generation handling.
- DAX blank display and code-editor mode checks.
- Stale success toasts after exercise navigation.

## V2.1 direction

The next implementation pass should preserve this release baseline while introducing the lab-specific layout architecture: three modes per lab, right utility rail, independent output docking, case-study navigation and coordinated light/soft themes. `src/app.ts` should be modularized before significant shell expansion rather than becoming a larger monolith.

## Release decision

PR #4 is the clean promotion candidate. Merge only after its latest deterministic and real-origin/runtime checks complete successfully and the Netlify deploy preview is verified on the same head commit. Application-development models should return source/build ZIPs; GitHub/Netlify promotion remains a release-coordinator responsibility.
