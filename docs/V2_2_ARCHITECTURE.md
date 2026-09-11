# V2.2 architecture

## State boundaries

**Learning state** remains in the schema-1 store: standalone `drafts[exerciseId]`, imported packs and the existing fields for code, graph, virtual Git/shell state, notes, attempts, confidence and bookmarks. Additive `caseSessions[caseId].drafts[taskId]` isolates case answers. Explicit standalone copying checkpoints the previous case answer. Backups merge per-task timestamps and preserve unknown case tasks rather than deleting additions.

**Presentation preferences** live in `settings.workstation` (version 1): theme, terminal appearance, density, text size, navigator width, the selected preset for each lab and independent geometry/docking preferences for each preset. The resolver computes narrow-screen fallbacks without mutating these preferences. Legacy split/output height are used only when the new preferences are absent.

**Transient view state** includes current tool, Focus snapshot, editor instances, result snapshots and fingerprints, graph camera, selection, unsaved view text, runtime handles and resize state. Case/standalone view-memory keys are distinct. A real CodeMirror instance and document are reparented rather than recreated when a view changes. Focus restores all prior layout preferences and tool expansion; focus-only output is temporary. On a phone, Workspace hides the tool overlay without deleting the remembered Notes/tool state.

## Module responsibilities

| Module | Responsibility |
|---|---|
| `src/app.ts` | Boot, learning-state bridge, navigation and input/engine dispatch |
| `src/shell/layout-controller.ts` | Twelve presets, normalization, pure viewport resolver, exact Focus restoration |
| `src/shell/scaffold.ts`, `dom-layout.ts` | Shared regions and DOM reparenting; separate output anchor hosts |
| `src/shell/orchestration.ts` | Modes, rail/tools, reference/case composition and per-mode resizing |
| `src/shell/tool-rail.ts`, `output-dock.ts` | Supplementary tools vs independent run output, stale-input fingerprints |
| `src/shell/reading-panels.ts`, `settings.ts` | Explicit solution reveal, visual/reference tools, configuration/import flows |
| `src/shell/themes.ts`, `theme-data.ts` | Four palettes and terminal-only override |
| `src/case-study/controller.ts`, `view.ts` | Case/page/task schema, isolated sessions, checkpoints, reference/task composition |
| `src/renderers/workspace.ts`, `code-view.ts` | Specialist composition, code/data/schema/trace views |
| `src/renderers/model-view.ts`, `pipeline-view.ts` | Semantic contracts, graph editing, run-grid/timeline/log snapshot views |
| `src/renderers/systems-view.ts` | Connected virtual Git/terminal and evidence-based comparison views |
| `src/editor.ts` | Bundled editor loader and retained-document pool |
| `src/core.ts` | Existing validation, migration, packs, storage, additive case validation/merge |
| `runtime.ts`, `git.ts`, `terminal.ts`, `graph.ts`, `dax.ts`, `checks.ts` | Existing execution/teaching engines; no replacement cloud or shell execution |

## Output truth

A completed attempt stores its input fingerprint and returned result in transient run state. Editing evaluated code, graph, model filters or virtual repository/shell state invalidates that result; notes and presentation do not. Opening a tool never hides or replaces the output host. Right/context docking can fall back at narrow widths without changing the saved anchor. A stale pipeline snapshot retains its original logs/timing; it is not relabelled as a new simulation.

Data & Debug shows a selected input table and column contract alongside the editor. The real SQL adapter returns actual/expected rows and column names from each fixture check. Review-only/configuration checks do not invent those row tables. Code visual traces are conceptual teaching steps, not parsed execution plans of a learner's draft.

## Static release

`tsc` emits ES modules to `public/app/`; `scripts/build.mjs` rejects archives/notebooks, then copies public assets to `dist/`. No backend or credentials are introduced. Bundled CodeMirror works without runtime CDN downloads. Optional DuckDB/Pyodide/Mermaid retain explicit availability errors. Engine startup and hosted browser behavior have a separate required promotion gate.
