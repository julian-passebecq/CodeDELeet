# Build and test report - Data Practice Studio 0.1.0

Build date: 10 September 2026. This report distinguishes tested behavior from optional adapters and environmental limitations.

## Results

| Suite | Result | What it covers |
|---|---|---|
| Strict TypeScript compilation | Passed | All source modules compile to the committed browser build |
| Node core/DAX/graph tests | 51 passed, 0 failed | Pack schema and ownership, stable-ID update rules, backup merge, graph validation, topology/retries, diagram escaping, DAX fixture/filter/BLANK behavior, toy performance bounds |
| Python stdlib tests | 28 passed, 1 skipped, 0 failed | Actual SQLite queries and reference scenarios, wrong answers, output comparison, query policy, fixture read-only enforcement, HTTP origin/Host/intent controls, output/body bounds, original Python reference algorithms |
| Embedded UI integration harness | 30 passed, 0 failed | Four workspaces, actual HTTP SQL checks, code/notes navigation, review queue, consent prompt, DAX slicers and relationships, DAG repair/retry, diagram edits, pack import preview/apply, focus, storage recovery, single-file edition and responsive overflow checks |

**109 passing automated checks in total, plus compilation; 1 explicitly skipped optional-engine test.** Counts group some parameterized assertions into one test, so they should not be compared to another project's test counts as a quality score.

## Browser test boundaries

The environment's managed Chromium policy blocks normal URL navigation. No administrator policy was modified. Instead, an explicit embedded harness supplies this repository's own compiled application code and files directly to Chromium. It uses a memory-backed localStorage stand-in and a file/request bridge. SQL requests from that bridge reach the actual local HTTP adapter and disposable SQLite process; the SQL answers are not mocked.

This proves selected DOM interactions and application logic in that harness. It does **not** prove native localStorage across reloads, ordinary navigation/hosting headers, browser file-opening behavior, real downloads, cross-browser compatibility, Windows launcher operation or external Python loading. These remain manual/native-browser gates for the next release. The app has not been deployed or tested against the user's machine.

The UI harness rendered all 27 exercise routes, tested five principal pages at widths 768 and 390 without document-level horizontal overflow, and observed no uncaught JavaScript errors in its main test page. Responsive correctness is not a full accessibility or mobile-device audit.

## Runtime limits that were not hidden

- **DuckDB:** optional package unavailable in the build environment; its adapter test is skipped. Real SQL tests used explicitly labeled SQLite, not a DuckDB substitute presented as DuckDB.
- **Pyodide:** remote runtime download unavailable in this network-restricted environment. Consent UI and export/review path were tested; actual worker CPython startup/execution in the browser was not. The supplied Python reference functions were separately executed with local CPython against their fixture assertions.
- **Spark / Power BI / Airflow / dbt / cloud / .NET:** not installed, connected or invoked by the design. The implemented teaching calculations and graph simulations were tested as such.
- **npm dependencies:** no registry installation was possible. A preinstalled TypeScript compiler produced and checked the build. The repository pins the development compiler; no generated npm lockfile or vendor tree is falsely claimed.

## Fixes found during validation

Stale output/checks now disappear when code changes. BI reference calculations respond to active relationships rather than always applying slicers. Same-column CALCULATE replacement and unrelated-filter preservation are tested. Empty aggregate rows return the teaching BLANK value. Iterated measure references requiring context transition are refused.

DAG repairs update the actual graph, cycles are refused, failed parents block downstream tasks, and a permitted transient retry recovers the run. Editor IDs use random bytes rather than assuming randomUUID exists in every embedded/file context. Graph layout now follows a clearer serpentine path instead of crossing the diagram between wrapped rows.

Unreadable browser state is protected from automatic writes until deliberate recovery. The original raw storage can be exported. Pack changes must increase both relevant versions, and updates cannot silently remove question IDs. Import previews precede writes. A single-file study edition cannot silently claim a local SQL/Python engine.

## Interface captures

`preview/` contains captures of the actual rendered app from the embedded harness, not image-generated mockups. The SQL screenshot shows the supplied reference passing the three real SQLite-backed cases. BI shows the teaching interpreter; DAG and Spark show explicitly synthetic outcomes. Screenshots can include a self-rated review state created by the tests; delivery does not include those test drafts as user defaults.

## Repeatable commands

```sh
npm run check
npm test
python -m unittest discover -s tests -p "test_*.py"
python tests/ui_smoke.py
```

The final command requires optional Playwright/Chromium and is documented as an embedded harness. `npm run build` rebuilds browser modules and the single-file edition. Python's DuckDB test runs only when the optional module is installed.

## Remaining acceptance checks on the user's laptop

Open OPEN_STUDIO.html normally; try BI/DAG/diagram controls; export/import a backup. Launch START_WINDOWS.bat or `python server/app.py --open`; run both SQL examples and an error case. Reload to verify persisted draft behavior on that browser. Optionally install DuckDB and verify the engine label and reference test suites. Optionally grant Python download consent and test both basic examples, including an error or an infinite-loop cancellation.

This is a tested first-version training platform, not a claim of production readiness or an audited secure public judge.
