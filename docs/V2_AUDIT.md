# V2 implementation audit

## Inputs and authority

The uploaded V2 handoff is retained under `reference/hand-off/`. The inspected current GitHub baseline is commit `d3c7c21ba79a082da21925b5ee0dce69212577fe`. The older uploaded `leetcodedataeng-main.zip` was inspected as a reference only; it is a separate React trainer and is not the current TypeScript migration baseline. The supplied Deepnote suite is retained and used for verified references.

No GitHub or Netlify mutation occurred. V2 source and static build were authored locally.

## Acceptance gate assessment

| Gate | Delivered evidence / boundary |
|---|---|
| Stable IDs and state | All 27 baseline IDs retained; V1 key/schema preserved; migration and merge tests; browser boot snapshot test. Cross-origin export/import required. |
| Shared shell | One fixed-height workstation, resizable columns/drawer, persisted layout, focus and mobile panels. Browser interactions and real screenshots included. |
| Solutions | No automatic solution reveal; explicit reveal per exercise; draft remains separate. |
| SQL/Python | Implemented real-engine adapters, lazy load, timeout/cancel and source tests. **External startup/worker release gates unverified here.** |
| PySpark | Specific review renderer with schema/sample rows/plan/reference mapping; no false runtime badge. |
| Model/BI | Functional teaching-model filters, grain/relationship checks and bounded DAX. Arbitrary semantic-model execution is deferred. |
| Pipeline | Functional canonical graph editing and deterministic rules/retries/skip; separate dbt investigation. No real orchestration or transaction execution. |
| Spark/config | Supplied meaningful task/plan/event/layer evidence plus bounded diagnosis/checks. Values never presented as learner-code measurements. |
| Terminal/Git | Connected virtual state, separate shell semantics, state-based Git goal checks, command/unit/UI evidence. |
| Architecture | Original editable custom graph/script retained; optional Mermaid source/renderer/export added. Mermaid CDN-render cases remain an open network gate. |
| Representative content | 51 curated questions covering all 13 renderer types. No bulk legacy-bank import claim. |
| Tests | Node, native fixture and built-file Chromium UI evidence included. HTTP-origin/network/Firefox/Netlify not claimed passed. |

## Defects found and corrected during this pass

- The extra hidden mobile-row grid made the desktop workspace collapse: explicit main grid row assignment fixed it.
- Hiding the collapsed drawer splitter moved its tabs into the wrong row: explicit workstation row assignment fixed it.
- Spark metric fixtures were objects while the panel expected arrays: the renderer now handles both and displays formatted values.
- UI test harness passed an argument positionally where Playwright required `arg=`; corrected the test, not the app.
- Mobile smoke awaited a question panel that is intentionally hidden in lab mode; now waits for attachment, then tests visibility by selected tab.
- PowerShell output type is visually uppercase via CSS; the test now compares case-insensitively while underlying objects remain unchanged.
- Git fetch now imports remote objects only during fetch; index/working-tree isolation, conflict staging and untracked file cases have unit tests.
- Original diagram script and Mermaid now use separate fields; legacy saved scripts are not reinterpreted.
- Deepnote headings corrected to exact supplied references, then asserted in fixture tests.
- SQL trailing comments and bounded query validation, Python execution-phase timeout, generation-aware worker cancellation, DAX blank display and code-editor modes received corrective checks.
- The lockfile was checked against actual registry metadata and validated with offline npm package-lock update and an npm ci dry run. Cold package download remains a target-environment check.
- Stale success toasts are cleared when navigating to a different exercise.

## Test replacement / baseline scope

The original Node/Python/server/UI test files were not copied wholesale: V2 replaces the old local-server SQL architecture with a static-browser adapter and a new shared shell. The submitted tests target the retained contracts and new state machines. This is an explicit test-suite replacement, not a claim that every original test was rerun unchanged. Actual results and skipped gates are in `V2_TEST_REPORT.md`.

## Release decision

Deliver as a **full source release candidate for an isolated preview**. Promotion to production is gated on the real-origin/runtime checks and the next AI's branch review. Do not turn an unverified external adapter into a checked box merely because its source compiles.
