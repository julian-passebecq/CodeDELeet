# CodeDELeet V2.2 - implementation and migration audit

## Scope and authority

Implemented the bounded workstation/case UX pass on the uploaded **current V2 source**. Read the V2.2 handoff's `00_START_HERE.md` and `01_PRO_IMPLEMENTATION_PROMPT.md` first, then the referenced architecture/release decisions. The source was not restarted. This pass performed **no repository read/write or deployment operations**. Input ZIP hashes are recorded in `evidence/v22/provenance.json`.

The input package declared 2.0.0 and retained the superseded public Deepnote archive and Mermaid 11.4.1. V2.2 reconciles those differences with the coordinator's stated hardening: no notebook/archive assets in served output and a pinned Mermaid 11.16.1 loader. The historical upstream commit in older V2 metadata was not re-fetched during this pass.

## Delivered changes

| Area | Implemented and checked |
|---|---|
| Shared shell | Compact top bar, four labs, drill navigator, lab-aware quick filters, search/difficulty/concept/priority filters, reset-to-all action |
| Layouts | Twelve presets from one layout model; independent mode preferences; exact temporary Focus restoration |
| Tools | 48px rail; one supplementary panel; overlay default; safe-width pin, keyboard/pointer resize, expand/restore and close; explicit explanation reveal |
| Output | Separate host; artifact/context/workspace/right anchors; closed/compact/half/expanded; persistent run badge; stale-input detection |
| Code | Real retained CodeMirror document/undo; selected fixture table and typed schema; returned SQL check actual/expected evidence; conceptual visual traces |
| Model / BI | Large model canvas; typed column, key and grain inspector; selectable relationship metadata and active filtering; measure/rows comparison |
| Pipeline | Large graph canvas, zoom/Fit/undo/redo, graph/config/code views; preserved selection/camera; deterministic grid/timeline/task logs |
| Systems / Cloud | Artifact/evidence comparison without replacing existing Git, shell, Spark/config/architecture renderers |
| Cases | Four original cases, 12 tasks and independent exhibit/task cursors; separate answers; explicit copy with recoverable checkpoints |
| Themes | Sage Light, Fluent Light, Fluent Soft, Slate Dark; terminal inheritance/override; density/text size; focus and reduced-motion rules |
| Deepnote | Safe explicit links and optional preview metadata only; blank action hidden; unsafe import rejected; no public notebook ZIP |
| Maintainability | 18 new source modules across shell/case/renderers; `app.ts` reduced from 75,725 to 53,072 bytes while adding orchestration |

The bank remains **51 exercises** with **all 27 V1 IDs** retained. Cases reference the same question bank and do not silently duplicate or replace its questions. The original 58 domain/unit tests remain; new shell/case tests are additive. Current native fixture checks retain all existing SQL/Python/Spark-syntax checks while replacing the old archive-dependent Deepnote check with a links-only metadata contract.

## Migration contract

The storage key remains `data-practice-studio.v1`, schema version 1. `settings.workstation` and `caseSessions` are additive. No standalone answer IDs change. Legacy split/output sizes initialize new preferences only when those preferences are absent. Responsive geometry is resolved without writing temporary values into the user's saved layout.

On an eligible older value, `.pre-v22` retains the original serialized store. Existing `.pre-v2` recovery behavior remains. Unreadable stored data is not silently replaced: saving is blocked and raw export is available. Backup merge retains this device's preferences, uses newer per-draft/per-case-task timestamps and preserves unknown task additions. Equal timestamps keep the local draft.

Case draft storage is `caseSessions[caseId].drafts[taskId]`, not `drafts[questionId]`. Exhibit-page changes do not change the current task. Task changes retain every answer. An explicit copy records a checkpoint of the old case draft, and restoration creates another checkpoint before replacing it. Standalone work is unchanged. Programmatic editor synchronization is muted so imports/copy do not manufacture a fresh user edit or incorrectly alter the imported timestamp.

## Defects caught during this pass

The browser checks and screenshot review caught and corrected a hidden-navigator grid-track error in Focus, missing persistence after Focus restoration, and a narrow-screen tool overlay that still covered Workspace after changing mobile tabs. The new tests assert the actual editor document/undo identity, exact stored layout restoration, graph selection/camera, unsaved graph configuration, isolated case state, and a clickable mobile terminal after hiding Notes.

An older test assumption that every revisit reset the specialist tab was updated: V2.2 intentionally restores that view. Tests now explicitly select Workspace when starting a legacy scenario, while new tests separately verify restoration. No execution engine was replaced with a simulated success to make a test pass.

## Actual evidence and release boundary

See [the final test report](V2_2_TEST_REPORT.md), the JSON/logs under `evidence/v22/`, and the actual [screenshot gallery](../evidence/v22/gallery.html). Source and build are complete, but **real browser HTTP/CDN/worker promotion is unverified in this environment**, not silently passed. Local urllib confirms served bytes/MIME and the removed archive URL returns 404; that does not establish browser-origin/CSP/CDN behavior.

The coordinator owns the separate clean-install, hosted runtime and production promotion checks. [Known limitations](KNOWN_LIMITATIONS.md) explicitly distinguish the existing teaching subsets from unimplemented full vendor semantics and broader future specialist exercises.
