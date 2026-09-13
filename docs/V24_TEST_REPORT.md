# CodeDELeet V2.4 - actual test report

## Result

**440 reported checks passed, zero failed in the completed local suites.**
TypeScript check, build-time taxonomy/lesson validation and a clean generated-file
rebuild also pass. External gates are explicitly blocked or not attempted, not
included in that passing count. This is a complete local implementation and
source/build/evidence delivery, not a claim that all promotion gates are cleared.

The authoritative command record is [FINAL_TEST_RUN.json](../evidence/v24/FINAL_TEST_RUN.json).
It records real exit codes, command arguments, transport, durations and blocked
reasons. [test-results.json](../evidence/v24/test-results.json) aggregates suite
reports; each reported test may contain several individual assertions.

## Passing local suites

| Suite | Passed | Failed | Evidence |
|---|---:|---:|---|
| Node domain/state/shell/learning tests | 136 | 0 | [TAP log](../evidence/v24/logs/final/unit-tests.log) |
| Native fixture/content reference validation | 42 | 0 | [Fixture report](../evidence/v24/regression/fixture-report.json) |
| Existing full exercise browser smoke | 68 | 0 | [UI report](../evidence/v24/regression/ui-legacy-report.json) |
| V2.2 shell, state and isolated case regressions | 30 | 0 | [Shell report](../evidence/v24/regression/ui-shell-report.json) |
| V2.3 compact-shell acceptance | 30 | 0 | [Compact report](../evidence/v24/regression/acceptance-report.json) |
| V2.3 before/after measured layout scenarios | 16 | 0 | [Layout report](../evidence/v24/regression/V23_LAYOUT_METRICS.json) |
| V2.4 learning/navigation/renderer/state/viewport acceptance | 83 | 0 | [V2.4 report](../evidence/v24/V24_ACCEPTANCE_REPORT.json) |
| Hosted verifier's local negative/unit tests | 9 | 0 | [Unit log](../evidence/v24/logs/final/hosted-verifier-unit.log) |
| Static release and actual local HTTP bytes/MIME checks | 26 | 0 | [Integrity report](../evidence/v24/regression/release-integrity-report.json) |
| **Total** | **440** | **0** | |

There are 48 new Node tests beyond the retained 88. The Node runner reports zero
skipped or cancelled tests. Browser reports contain no uncaught page errors.
No worker/CDN assertion is silently counted as passed by the built-file harness.

## Additional successful gates

`npm run check` passes. `npm test` runs the actual TypeScript build and the catalog
gate before its unit tests. The catalog validates all 51 unchanged exercise IDs,
20 categories and exactly 20 lessons, one per category.

[Clean rebuild](../evidence/v24/CLEAN_REBUILD_REPORT.json) deletes `public/app/`
and `dist/`, rebuilds from TypeScript/source assets, and compares all **116**
generated files before/after: **zero differences**. The compiler used is installed
TypeScript 5.8.3, exactly matching the lockfile. The current source/build hashes
are in [TESTED_APPLICATION.json](../evidence/v24/TESTED_APPLICATION.json) and
[build-files.json](../evidence/v24/build-files.json).

[Source preservation](../evidence/v24/SOURCE_PRESERVATION.json) confirms 45 retained
engine/editor/renderer/worker/vendor/fixture/case files are byte-identical to the
uploaded V2.3 archive. All 51 exercise IDs, 13 renderer kinds, four authored cases
and 12 independent case tasks remain intact. The private-reference audit finds
no byte-identical copy of any of the 12 supplied reference images in the delivery.
The package script verifies source manifests, tested build bytes, ZIP CRCs and
membership separately; archive verification is not an execution/runtime test.

## What the V2.4 acceptance run actually covers

Navigation covers both modes for all four lab homes (five cards, no fake attempt
actions), all 20 categories in both modes with fresh route boots, breadcrumbs,
legacy exercise and case links, browser history and global mode switching. It
checks actual editor instance identity, cursor, undo history and draft preservation.
Case resumption from a blank URL is covered by the retained V2.2 suite.

Content covers all 20 lessons and all 14 block kinds, with real DOM screenshot
coverage for each block. Checkpoints reveal their own explanations. Section
anchors, copy-code, completion, previous/next and exact related Practice links
work. Mobile code/tables scroll internally; diagrams expose accessible labels.
All four themes apply to reading surfaces without changing the Practice engine.

State coverage includes opening/in-progress/completion/section/notes, a fresh
page boot from serialized state, actual browser backup export to a Blob and import
through the file input, old-backup merge, atomic newer/tie timestamp behavior,
unknown safe future lesson IDs and rejection of malformed learning payloads.
Practice drafts, case artifacts and Learn state remain independent. Custom pack
fallback, grouped search, bookmarks and empty-filter recovery are exercised.

The six-width navigator matrix covers **1600x900, 1366x768, 1190x800, 1024x768,
768x1024 and 390x844**. It exercises layout modes 1/2/3, Theme, Notes, Focus,
expanded/compact/overlay/drawer state, ARIA, destination close, Escape, backdrop,
focus return, Tab wrapping and no page-level horizontal overflow. Medium overlays
keep measured main and workstation widths unchanged. The desktop header remains
52px, persistent compact nav 56px, overlay/drawer 320px, rail 48px, Theme panel
320px, and reading-column maximum 870px at applicable viewports. Exact per-scenario
values, visible card counts and mobile headers are in
[V24_LAYOUT_METRICS.json](../evidence/v24/V24_LAYOUT_METRICS.json).

## Blocked or deliberately unattempted gates

| Gate | Actual outcome | Consequence |
|---|---|---|
| Clean registry install | `EAI_AGAIN` resolving registry.npmjs.org; offline retry `ENOTCACHED` | No fresh install claimed; exact preinstalled compiler used |
| `npm audit --audit-level=high` | Audit endpoint DNS failure | No current vulnerability result claimed |
| All four served-origin browser suites | `net::ERR_BLOCKED_BY_ADMINISTRATOR` at localhost | Could not execute served-origin UI assertions |
| Real DuckDB/Pyodide/worker/persistence/Mermaid suite | Setup blocked before any of its 15 retained runtime checks | Runtime checks **unverified**, not passed |
| Hosted preview, exact-commit byte/security-header verification | Not attempted: user explicitly prohibited GitHub/Netlify operations | No remote/deployment claim |

The [runtime report](../evidence/v24/regression/network-runtime-report.json) records
zero executed runtime checks and the actual Page.goto blocking error. Passing the
nine hosted-verifier unit tests only proves its local rejection/comparison logic,
not a site's security headers. The 26 integrity checks use local urllib HTTP to
verify bytes/MIME; they do not override Chromium's navigation restriction.

## Transport and test maintenance

Built-file tests load the actual compiled ES modules, CSS and bundled CodeMirror.
The existing harness provides fixture fetch and in-memory storage; it does not
pretend to execute DuckDB, Pyodide or Mermaid. A real import map replaced recursive
module embedding to avoid duplicate shared modules and excessive memory use.
All final browser suites were run serially on the same unchanged built candidate.

Earlier failing investigation logs are retained outside `logs/final/`. The saved
case resume defect and mobile Theme width defect were fixed and their suites
rerun. Earlier parallel-process memory exhaustion is not a final test result.
Old tests were adapted only for deliberately changed lab-home/mobile/version/filter
contracts, with replacement assertions; desktop geometry and unchanged state/runtime
assertions were retained. See [implementation report](V24_IMPLEMENTATION_REPORT.md).

## Required before promotion

Repeat clean dependency installation, the current audit, all served-origin UI
suites and all real runtime checks in an environment that permits them. A future
separately authorized preview must be checked against the exact candidate commit
and build inventory. Native Safari/Firefox and full assistive-technology auditing
remain outside this local Chromium pass. No production merge/deployment occurred.
