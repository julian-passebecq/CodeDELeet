# CodeDELeet V2.3 - compact-shell implementation report

## Scope and source provenance

This is a presentation-only compact-shell update to the supplied released V2.2
Git archive, not an application restart. Its archive comment identifies commit
`4212550ca4260390b5a756d81882c3a75a5f912b`. Input bytes and the immutable contract
comparison are recorded in [V23_BASELINE_PROVENANCE.json](V23_BASELINE_PROVENANCE.json).
The source ZIP was inspected and the broad baseline suite was run before edits.
No remote repository or hosting operation was performed in this pass.

## Implemented behavior

The separate desktop topbar is removed from the DOM. A single `#exercise-header`
now owns hamburger, four existing neutral lab icons, technology/difficulty and
execution boundary, exercise title, bookmark, timer, previous/next, result status
and the original primary action. Its reserving height is 52px at widths of 760px
and above. The title can ellipsize; its complete text remains in the title tooltip.
Critical attempt controls are not hidden at 1366px or 1024px.

Lab buttons reuse the existing Code / Model / Pipeline / Systems icon vocabulary.
They have 40px targets, explicit labels, title tooltips, an exclusive visible active
state and `aria-pressed`. Header refresh preserves focus on the corresponding
control. Existing keyboard navigation and library/filter selection behavior remain.
Product identity is retained in browser title, documentation and Settings, not
in the routine workstation header.

The existing rail's 1/2/3 controls are the only permanent layout-mode controls.
The redundant mode dropdown and header theme selector are removed rather than
hidden as a second interactive control. Focus remains a single rail action.
The right rail now ends with Theme and Settings. Secondary reading tools can
scroll in a short viewport while modes, Focus, Theme and Settings retain their
comfortable targets. Blank Deepnote and irrelevant Inspector actions stay conditional.

Theme opens a compact, exclusive rail panel with four native radio choices:
Sage Light, Fluent Light, Fluent Soft and Slate Dark. Selection persists through
the existing presentation storage. Native radio arrow keys remain usable. Escape
and Close dismiss the panel and return focus to its launcher. Theme is a transient
320px overlay, deliberately not pinnable; it does not alter another tool's saved
pin, width, expansion or output sizing. Terminal inheritance/overrides remain in
Settings. The light application does not impose a black terminal.

At 1024px, the existing narrow-screen tab/overlay model is retained. The rail and
panels sit below the compact header and do not cover the primary action. Temporary
responsive fallback does not rewrite desktop preferences. At 390px, the header
uses two internal compact lines totaling 94px so all attempt controls fit; the
four lab switches are discoverable in the navigator drawer. Context / Workspace /
Output / Tools remain unchanged. Existing canvas pan/zoom handles large diagrams;
there is no new global document horizontal scrolling.

## Measured space gain

The measurements use actual Chromium DOM/CSS at DPR 1, the same four viewports,
default work mode, closed output and fresh state. Baseline was captured before
source edits. The two transport runs use the existing compiled-file harness; it
substitutes fetch/storage only, not layout. These are not hosted browser results.

| Viewport | V2.2 chrome | V2.3 chrome | Workstation before | Workstation after | Gain |
|---|---:|---:|---:|---:|---:|
| 1600x900 | 134.5px | 52px | 741.5px | 824px | +82.5px |
| 1366x768 | 133.25px | 52px | 610.75px | 692px | +81.25px |
| 1024x768 | 132px | 52px | 574px | 654px | +80px |
| 390x844 | 138px | 94px | 644px | 688px | +44px |

The 32px minimum gain is exceeded at both required wide desktop sizes. The gain
is larger than simply removing the old topbar: the exercise identity and action
stacks also fit within one header without reducing their measured font sizes.
The body font and exercise-title font are compared explicitly against the baseline.
Graph templates, nodes and renderer source are unchanged.

At 1366x768 the Pipeline graph canvas grows from 481.75px to 563px, and Systems
from 522.75px to 604px. At 1600x900 those values are 612.5px to 695px and 653.5px
to 736px. All four labs are measured at every viewport, not just one screenshot.
See [full rectangles and assertions](../evidence/v23/V23_LAYOUT_METRICS.json),
including header/stage bounds, renderer/canvas sizes, overflow and primary-action
visibility. The [gallery](../evidence/v23/gallery.html) links paired baseline and
candidate images as well as Theme, case, responsive, Fluent Soft and dark examples.

## Architecture and compatibility

`src/shell/header.ts` owns compact-header markup and safe focus restoration.
`src/shell/theme-panel.ts` owns theme preference markup and native radio sync.
The existing scaffold, orchestration, layout resolver, DOM layout and rail are
extended in place. app.ts delegates the header rather than absorbing new shell
logic. CSS is a bounded V2.3 override block on the existing shell geometry.

The original 51 exercise IDs, 27 V1 IDs, 12 lab/mode combinations and four authored
cases/twelve tasks remain. Case session/page/task logic is unchanged. No schema
migration or new storage namespace is introduced. Notes, bookmarks, confidence,
history, drafts, merge/export, pre-upgrade snapshots and case isolation use the
same code as before. Output remains independent of reading tools and Theme.

A recorded **52-file byte comparison** covers the unchanged learning engines,
core storage/validation, editor, case and renderer modules, runtime workers,
content/case packs, vendored editor/license files, runtime adapters, Netlify
configuration and hosted verifier. Runtime dependency versions are unchanged.
No SQL/Python execution code or artificial runtime substitution was added.

Existing UI tests were adapted only where they addressed removed UI selectors:
mode-dropdown selection becomes the corresponding rail button; theme-dropdown
selection becomes the Theme radio panel. Assertions, workloads and truth labels
were retained. The real-runtime smoke test has exactly one selector-only change
for its Mermaid layout setup; all fifteen runtime checks and their timeouts are
otherwise retained. This necessary locator change is not represented as a
byte-identical test file. Real engine/worker files are byte-identical.

The local CI YAML retains existing contracts, real-origin runtime, Netlify-preview
and production-audit steps; V2.3 UI/measurement checks are added. No workflow was
executed remotely for this candidate in this session.

## Private research and publication boundary

The private handoff prototype and reference metadata/README guidance informed
presentation review only. No source, binary, vendor icon, notebook or asset was
copied from that library. No new runtime dependency or font was introduced.
Public build and full-release guards reject private research directories and
notebook/archive files. Licenses remain intact. As release hygiene, the historical
nested `reference/legacy-trainer/leetcodedataeng-main.zip` found in the baseline
is omitted and replaced by an explanatory README; it is not an app dependency.
This is listed explicitly as a removed file in the change inventory.

## Audit findings and verification boundaries

Development checks caught stale selector assumptions and a test string escape.
The V2.3 test adapters
use explicit button/rail selectors rather than ambiguous `[data-mode]` matches.
Browser suites were rerun serially on a stable build after a parallel harness run
exhausted browser resources. A browser-title version mismatch was also corrected
and covered by a metadata assertion. No learning-engine assertions were removed.

[The test report](V23_TEST_REPORT.md) separates deterministic results from blocked
npm-registry and browser-origin gates. Chromium desktop/phone-sized testing is not
native Safari testing or a full assistive-technology certification. Prior V2.2
production success is not V2.3 promotion evidence. The coordinator must run clean
install/audit, served-origin browser/runtime and hosted asset/header checks before
merging or publishing this source.

Final interaction inspection also corrected mobile navigator aria-expanded after
selecting an exercise: the drawer closes before the header renders. The mobile
acceptance now checks that automatic close as well as explicit hamburger toggles.
