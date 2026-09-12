# CodeDELeet V2.3 - actual test report

## Verdict

**PASS for executable local checks; release/promotion gates remain BLOCKED.**
The final local run has **305 passing named tests/checks, zero failures** across
unit, reference, browser-UI, layout and static-integrity families. That aggregate
is not a claim of 305 runtime executions. No blocked gate contributes a pass.
No GitHub, Netlify, production deployment or remote CI run was performed.

The source starts from the supplied V2.2 archive at
`4212550ca4260390b5a756d81882c3a75a5f912b`. The actual machine-readable summary is
[test-results.json](../evidence/v23/test-results.json). Raw successful logs,
blocked-attempt logs, JSON and browser screenshots are retained under evidence/v23.

## Environment

Node 22.16.0; npm 10.9.2; installed TypeScript 5.8.3; Python 3.13.5;
Chromium 144.0.7559.96. The installed compiler exactly matches the lockfile.
Registry access failed with EAI_AGAIN. No clean-install or current vulnerability
scan success is claimed. UI screenshots and bounding boxes use device scale factor 1.

## Before-edit baseline

The same execution environment ran the original source before shell changes:

| Family | Baseline result |
|---|---:|
| Typecheck and build | Passed |
| Node domain/layout/case tests | 80 passed |
| Native fixture/reference checks | 42 passed |
| Hosted-verifier regression checks | 9 passed |
| Exercise browser regressions | 68 passed |
| V2.2 shell/case browser checks | 30 passed |
| Static/local-HTTP release integrity | 22 passed |
| Clean npm install / npm audit | Blocked: registry DNS |
| Served-origin UI and real runtime tests | Blocked: browser navigation policy |

Baseline logs and command exit statuses are in
[baseline/](../evidence/v23/baseline/). Actual baseline images/rectangles are in
[baseline-layout/](../evidence/v23/baseline-layout/), not reconstructed from prose.
The archive commit comment and hashes were checked before edits; no remote
repository verification is implied by that provenance check.

## Final V2.3 local results

| Family | Command | Result | Scope |
|---|---|---:|---|
| Typecheck | npm run check | Passed | Installed pinned compiler |
| Build and units | npm test | 88 passed | Original 80 plus 8 compact-shell tests |
| Hosted-verifier negative cases | python -m unittest discover -s tests -p test_hosted_verifier.py | 9 passed | Existing verifier behavior; not a live hosted audit |
| Native fixtures | python tests/fixture_check.py | 42 passed | Native reference logic/content, not browser runtimes |
| Original exercise UI | python tests/ui_smoke.py | 68 passed | Actual compiled UI, existing file/storage harness |
| V2.2 shell/cases | python tests/v22_ui.py | 30 passed | Original state/layout/case contracts |
| V2.3 compact-shell UI | python tests/v23_ui.py | 30 passed | Single header, four labs, all modes, Theme, keyboard, output, Focus, cases and responsive behavior |
| Measured layout matrix | python tests/v23_layout.py | 16 passed | Four labs at four specified viewports, real DOM/CSS |
| Static integrity/local HTTP | python scripts/validate_release.py | 22 passed | Asset parity, imports, versions, privacy, local HTTP bytes/MIME and removed archive 404 |

The three successful UI runs report no uncaught page errors. Browser suites were
run serially against a stable compiled build. A final rebuild/typecheck/unit pass
covered the browser-title metadata correction. All 64 static build assets are
recorded in [build-files.json](../evidence/v23/build-files.json); public assets
match their dist counterparts. Archive verification is a separate packaging step,
not included in the 305-test total.

## V2.3 acceptance details

V23-01 through V23-11 verify one 52px desktop header, absence of the routine
wordmark/version block and duplicated selectors, four labeled 40px lab controls,
exclusive active state, all twelve lab/mode combinations and visible attempt
controls at 1600, 1366 and 1024 widths. Theme is in the rail, has four keyboard
radio choices and persists through fresh app boots with the existing draft intact.

V23-12/13 cover every output anchor and requested size while switching themes,
Focus restoration of the prior tool/presentation, the identical CodeMirror editor
object, unchanged undo history and a usable undo operation. V23-14 checks independent
case page/task cursors, multiple isolated case answers and the standalone answer
through lab/mode/theme roundtrips. Existing suites retain Git/terminal graph state,
DAG retries, DAX/filter context, history, draft/backup and migration assertions.

V23-15/16 verify that blank Deepnote mappings hide the action and that an explicitly
imported safe mapping creates a visible external link with target=_blank and
noopener/noreferrer. This is the new-tab/link contract only; a remote Deepnote
page was not visited. V23-17/18 are covered by unchanged migration/stable-ID tests,
frozen content hashes, publication guards and final artifact scans.

Keyboard checks exercise header tab order, Enter activation, native theme-arrow
selection, Escape and focus return, visible focus treatments in all four themes,
mode-button focus, Ctrl+Enter on the DAX teaching engine and Alt-arrow navigation.
At 1366x600, critical rail targets remain at least 40px while secondary tools scroll.
The 1024 overlay does not cover the primary action or mutate desktop pin/sizing
preferences. Touch-emulated 390px testing preserves tabs, saved notes, all four
drawer lab switches, attempt controls and an inherited light terminal.

## Measured layout

| Viewport | Workstation before | Workstation after | Gain | Header after |
|---|---:|---:|---:|---:|
| 1600x900 | 741.5px | 824px | +82.5px | 52px |
| 1366x768 | 610.75px | 692px | +81.25px | 52px |
| 1024x768 | 574px | 654px | +80px | 52px |
| 390x844 | 644px | 688px | +44px | 94px |

Every lab shares the gains at these controlled settings. Both required wide
viewports exceed the 32px threshold. No tested viewport has global document
overflow or a clipped primary action. Measured body/title font sizes are not
reduced. Renderer and graph source are byte-identical. Full before/after header,
stage, lab-panel, renderer, canvas and action rectangles plus each comparison's
assertions are in [V23_LAYOUT_METRICS.json](../evidence/v23/V23_LAYOUT_METRICS.json).

There are 58 current-pass PNG evidence files: 16 baseline screenshots, 16 candidate
layout screenshots, nine compact-shell acceptance screenshots, ten regenerated
exercise screenshots and seven regenerated V2.2 shell/case screenshots. They are
actual Chromium captures, not image-generation outputs. See the
[gallery](../evidence/v23/gallery.html) for the paired matrix and required examples.

## Blocked or unperformed release gates

**Clean installation and npm vulnerability audit:** actual attempts returned
EAI_AGAIN for registry.npmjs.org. See logs/install.log and logs/audit.log. Installed
TypeScript 5.8.3 was used; successful builds do not replace a fresh dependency audit.

**Real-origin browser tests:** the local static server responds to urllib, but
Chromium rejects URL navigation with ERR_BLOCKED_BY_ADMINISTRATOR. Attempts were
made for UI_MODE=http on all three UI suites and for the real runtime smoke.
The runtime report is explicitly UNVERIFIED, exits 2 and records zero executed
runtime checks. The raw V2.3 HTTP report has a setup failure and zero checks; the
summary classifies the known environment error as BLOCKED, not an app assertion
failure or a pass. Logs retain those original results.

The fifteen SQL/Python/pandas, worker cancellation/timeout/restart, reload and
Mermaid checks still require a network-capable browser. Runtime/worker source
and versions are unchanged. Only the removed mode-dropdown locator in the runtime
smoke's Mermaid setup was replaced with the rail button. All assertions and
workloads remain; no simulated execution was substituted for the network gate.

**Hosted delivery/CI:** no Netlify or GitHub operation was attempted, as requested.
The existing strict hosted verifier and negative tests remain unchanged. CI YAML
includes V2.3 UI/metrics while retaining the original contract/runtime/preview and
production checks. The coordinator must run them on the exact integration commit.
Native Safari/Firefox, physical-device tests and a comprehensive screen-reader
or security certification are outside this evidence.

## Development corrections and reproducibility

Test adaptations initially exposed ambiguous mode/Inspector selectors and a
JavaScript string-escape error in a new undo test. Those tests were corrected
without deleting behavior assertions. A concurrent browser-harness run exhausted
resources; final suites ran serially. The inspected browser title still carried
V2.2 metadata; it was corrected in public/dist and covered by a unit assertion.
Final successful counters above come from fresh logs/JSON, not earlier claims.

Re-run the commands above from the complete source ZIP. Layout and UI harness
results do not prove live CDN access. Follow
[NEXT_AI_HANDOFF.md](NEXT_AI_HANDOFF.md) for blocked gates, safe progress migration,
preview review and subsequent promotion. Do not restore the omitted private
research or historical nested archive when integrating the candidate.

Final interaction inspection also corrected mobile navigator aria-expanded after
selecting an exercise: the drawer closes before the header renders. The mobile
acceptance now checks that automatic close as well as explicit hamburger toggles.
