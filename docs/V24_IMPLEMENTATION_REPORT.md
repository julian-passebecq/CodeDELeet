# CodeDELeet V2.4 - implementation report

## Delivered candidate

This is a continuation of the supplied V2.3 repository, not a new application.
The full working source, regenerated static build, tests, measurements and actual
browser captures are delivered together in one complete source ZIP. No GitHub
or Netlify read/write/deployment was attempted. The local branch is
`v2.4-learning-navigation-pro`.

The input ZIP has no Git database. Its declared upstream target is
`a4aad2e4ad5fe3163c5ad725456ea7e84df28964`, but that Git object was not independently
verified. [Source preservation](../evidence/v24/SOURCE_PRESERVATION.json) records
the exact input archive hash, local baseline and per-file byte comparisons.

## Learning and navigation

The existing shell now has a real Practice/Learn switch. Lab icons open explicit
Code, Model, Pipeline and Systems homes; none is a disguised arbitrary exercise.
Each home has exactly five primary category cards with counts and progress.
Continue actions, grouped search, bookmarks, review and unfinished queues remain
available. Categories show their subgroups, progress and a Start/Continue action;
related case studies stay distinct from standalone practice attempts.

The taxonomy explicitly maps all 51 existing exercise IDs. Imported content with
valid category metadata uses it; content without it remains discoverable in the
fifth category's Imported / Other subgroup. There is never a sixth primary card.
BI serving intentionally has a lesson but no invented exercise. Breadcrumbs,
legacy exercise/case URLs and browser Back/Forward coexist with explicit new
home/category/lesson hashes.

The navigator displays categories, the current category's nearby exercises, or
a lesson outline. It no longer depends on an arbitrary selected exercise while
a home or lesson is open. The global mode switch preserves the last active
in-session Practice exercise/case and its editor instance, draft, cursor and undo
history. Learn opens the same lab with a Continue Learning action. Explicit lab
icons always return home. A previously saved case still resumes from a blank URL.

## Deterministic shell behavior

At 1,200px and above, the navigator respects the saved expanded/compact preference.
At 760-1,199px it reserves 56px and opens a transient 320px overlay without narrowing
the workstation. Below 760px it starts hidden and opens a bounded mobile drawer.
Focus temporarily hides the navigator and restores the effective prior state.
Destination selection, breakpoint changes, Escape and backdrop dismissal are
explicit transitions. ARIA, focus return and Tab trapping follow visible state.
The old offscreen mobile transform is no longer able to contradict an expanded flag.

Practice rail groups are Layout, Run/Inspect, Reference, Personal and Preferences.
Output and Inspector remain context-dependent. Learn exposes Notes, Theme and
Settings without fake Run, Output or duplicate Visual/Explanation tools. Switching
surfaces closes irrelevant tools and normalizes Focus. Theme remains a transient
320px panel. All four existing themes and the original 12 presentation presets
remain available. The desktop header remains 52px. On phones a dedicated icon row
retains all four global labs rather than hiding them behind a desktop-only control.

## Structured lessons

Twenty original seed lessons cover exactly one topic in every primary category.
The validated local JSON catalog supports 14 typed block kinds: introduction,
concept, bullets, steps, code, table, diagram, comparison, when-to-use, pitfall,
worked example, checkpoint, key takeaways and related Practice links. Lessons
include objectives, prerequisites, an estimated reading/work time and official
HTTPS resources. Code examples are instructional text, not a new execution engine.

Diagrams are original locally rendered SVG with accessible labels, captions and
text edge alternatives. Code and tables scroll inside their own containers on
small screens. A lesson has section navigation, previous/next navigation, copy-code,
self-check reveal, completion and exact related-exercise links. One seed per category
is the deliberate release scope, not a claim of a complete training curriculum.

Build-time validation rejects unsupported blocks, unsafe URLs, raw HTML, wrong
workspace/category pairs, malformed or oversized diagrams/tables, excessive text,
duplicate lesson IDs and broken related Practice references. The renderer escapes
all text as a second boundary. The build enforces exactly 20 lessons and one per
category. No handoff artwork, reference images or private notebook archive is
copied into the application or delivery.

## State preservation

The storage key and store schema remain unchanged. Learn data lives under the
additive `settings.learning` boundary, separate from standalone drafts and case
session artifacts. It includes completion, last section, per-lesson notes and a
separate study notebook. Opening a completed lesson does not erase completion.

Backup import validates bounded entries before modifying the active store. An
old backup with no learning data cannot erase existing learning. Per-lesson merge
is atomic: strictly newer timestamps win and local data wins ties. Safe unknown
future lesson IDs remain in backups without rendering invalid routes. Practice
keeps its existing independent merge semantics. Browser acceptance exports a real
Blob, imports it through the real file input, and checks learning, drafts and case
state rather than merely calling an isolated mock function.

Navigation cancels an active Practice worker before changing surfaces, preserves
the draft and guards late mount/scroll callbacks. Real worker cancellation and
restart still require the separate origin/CDN gate; local UI checks are not a
substitute for that runtime evidence.

## Source changes

| Area | Implementation |
|---|---|
| Taxonomy and routes | `src/navigation/taxonomy.ts`, `state.ts` |
| Homes, categories and contextual navigation | `src/navigation/surfaces.ts` |
| Lesson schema, catalog, validation and renderer | `src/lessons/` |
| Independent progress/merge | `src/lessons/progress.ts`, additive `src/core.ts` boundaries |
| Shell integration | `src/app.ts`, `src/shell/`, `public/shell.css` |
| Content | `public/lessons/` and generated `dist/lessons/` |
| Validation | `tests/learning.test.mjs`, `tests/v24_acceptance.py` |
| Rebuild and delivery | `scripts/validate-learning.mjs`, `verify_rebuild.py`, `package_release.py` |

Existing engine, worker, renderer, fixture, case-controller and editor files are
byte-compared against the supplied baseline. All 51 exercises, 13 renderer kinds,
four authored cases and their 12 independent tasks are retained. Nothing in the
lesson surface claims to run Spark, arbitrary DAX, cloud deployments or host shell
commands beyond the original documented teaching boundaries.

## Test changes and defects found

No old assertion was removed to conceal a failure. Tests that directly conflicted
with the requested navigation contract were updated: lab icons now assert a real
five-card home rather than an arbitrary exercise; mobile navigation asserts the
new visible global icons and destination-closes-drawer behavior; version text is
2.4. The old mobile header-height gain assertion is not applied to the intentional
new icon row. Desktop 52px/gain, action visibility and no-overflow checks remain.
Collapsed search filters are explicitly opened before the same interaction checks.
An asynchronous import-toast check now waits for the actual toast before asserting.

Browser testing found and fixed a real saved-case resume regression and a mobile
Theme-width mismatch. Initial parallel browser processes exhausted memory; suites
were rerun serially after the built-file harness was changed from recursively
embedded modules to one import-map entry per real compiled module. No worker or
CDN success is simulated. The final reports, not earlier iteration logs, define
this candidate's validation status.

## Evidence and boundaries

Read [the test report](V24_TEST_REPORT.md), [state/routing contract](V24_STATE_AND_ROUTING.md),
[measured layout JSON](../evidence/v24/V24_LAYOUT_METRICS.json), and the
[actual browser gallery](../evidence/v24/gallery.html). Clean rebuild deletes both
generated trees and compares regenerated bytes. Packaging verifies the tested
build inventory, every ZIP member and the complete source checksum manifest.

This environment blocks Chromium URL navigation, including localhost, and cannot
resolve the npm registry. The origin/runtime/audit gates are explicitly blocked,
not reported as passed. No production-ready or hosted-runtime certification is
implied by the completed local implementation. The requested remote-free boundary
was maintained throughout.
