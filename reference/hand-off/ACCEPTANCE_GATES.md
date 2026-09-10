# CodeDELeet v2 Acceptance Gates

The v2 build is not complete merely because pages render. These gates define the release threshold.

## A. Migration and state

- Existing stable exercise IDs remain stable.
- Existing v1 progress loads without manual intervention.
- Drafts survive migration.
- Notes survive migration.
- Bookmarks survive migration.
- Review/confidence/status survive migration.
- Imported content packs still load.
- Removing/reloading packs does not corrupt built-in state.
- Backup/import remains functional.

## B. One-screen shell

- Desktop attempt uses a fixed-height workspace rather than long-page scrolling.
- Left/right split is resizable.
- Bottom drawer is resizable and collapsible.
- Pane sizes persist.
- Results opens after Run/Check.
- Explanation and Solution never auto-reveal.
- Keyboard shortcuts work.
- Previous/next exercise works.
- Mobile/tablet fallback remains usable.

## C. SQL/Python/PySpark honesty

- SQL browser execution is labeled by actual engine.
- DuckDB worker can reset/cancel/timeout.
- Python worker can reset/cancel/timeout.
- Heavy runtimes lazy-load.
- PySpark never claims browser Spark execution.
- PySpark can still be completed as a learning exercise without Deepnote.
- Deepnote button appears only with valid metadata.

## D. Specialist labs

- Model Lab supports exercise-defined tables/relationships and visual filter/model reasoning.
- Pipeline DAG remains editable and deterministic.
- Airflow and ADF concepts are visibly differentiated.
- dbt lineage fixture is realistic enough for failure/dependency reasoning.
- Spark Performance Investigator exposes meaningful metrics rather than toy speed estimates.
- OpenTofu plan view is explicitly a fixture unless real tooling ran.
- Kubernetes view clearly separates YAML, object graph, events, and logs.
- Docker view has at least one layer/caching diagnostic case.

## E. Terminal and Git

- Bash and PowerShell are separate modes.
- PowerShell uses object-pipeline semantics in teaching examples.
- Terminal never exposes host shell.
- Git has a commit DAG renderer.
- Branch labels and HEAD update with Git state.
- Working tree, staging/index, and diff are visible.
- Merge and rebase produce visibly different graphs.
- Fetch updates remote tracking state without silently changing the working tree.
- Git exercises reset cleanly.

## F. Architecture visuals

- Mermaid flowchart works.
- Mermaid ER works.
- Mermaid architecture syntax works if supported by chosen version.
- Existing/custom interactive architecture rendering is preserved where superior.
- Official icon usage is documented.
- Official diagrams are linked rather than copied unless reuse is clearly permitted.

## G. Representative content

At least one strong working v2 exercise exists for every major renderer, and at least 2-4 for the most important new renderers.

## H. Tests and delivery

- Existing tests remain green or are deliberately replaced by stronger equivalents.
- New shell, migration, Deepnote, terminal, Git visual, and specialist renderers have automated tests.
- Chromium smoke test passes.
- Firefox smoke test passes where practical.
- Final ZIP contains full source, not only a patch.
- Migration, audit, test report, known limitations, and v2.1 backlog are included.

