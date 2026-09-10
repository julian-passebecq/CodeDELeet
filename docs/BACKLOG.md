# Bounded backlog

## Delivered in v0.1

Four workspaces; 27 original examples; searchable library; task/concept/hint/reference tabs; guided review; browser-local progress; notes/bookmarks; stable-ID packs with previewed imports; backup merge; protected corrupt-state recovery; focus mode; real local SQLite with fixture suites; optional unvalidated DuckDB/Pyodide adapters; bounded DAX interpreter and model preview; dependency simulator; diagram DSL/SVG/Mermaid; synthetic Spark reasoning controls; no-install study HTML; source, tests and documentation.

## Next: v0.2 - improve the small engine, not cloud infrastructure

| Priority | Bounded change | Release evidence |
|---|---|---|
| P1 | Browser DuckDB-Wasm adapter in a worker | Same SQL fixture suite on SQLite, native DuckDB and Wasm; cancellation/memory/access controls; no dialect-mismatch claims |
| P1 | Native browser/OS smoke matrix | Real Chrome/Edge/Firefox navigation, storage reload, Windows launcher, file edition and backup downloads, not just embedded harness |
| P1 | Validate optional runtimes | Actual DuckDB installation and real Pyodide download; timeout, errors, consent/revocation, worker cleanup and cached startup |
| P1 | Pluggable fixture/test registry | Schema validation, trusted local test registration, per-pack test identity, versioning and no client-side false certification |
| P2 | Extend model authoring | Add entities/columns and relationship metadata; validate grain/cardinality; keep DAX support visibly bounded |
| P2 | Better graph ergonomics | Pan/zoom, keyboard movement, undo/redo, ports, orthogonal layout and graph reset confirmation |
| P2 | Richer code editor | Optional syntax highlighting with a properly licensed lightweight editor; preserve zero-install fallback |
| P2 | Content author editor | Form-driven question editing, preview, IDs/version validation and export; no giant question bank yet |

## Later, only after those gates

Add a small curated exercise pack per topic, concept-to-practice navigation, a better rubric viewer and optional notebook exports. Real SQL Server/BigQuery/dbt/Spark runners would need explicit isolated adapter contracts and should remain opt-in. Do not add cloud accounts, paid AI grading, Kubernetes hosting, distributed storage or a pretend Power BI engine just to enlarge the platform.

## Explicit non-goals for v0.1

Production judge infrastructure, hostile-code sandbox guarantees, real Airflow/ADF execution, complete DAX/C# execution, PBIX import, actual Docker/Kubernetes/OpenTofu deployment, AI diagram generation, automatic architecture grading, authentication, multi-user collaboration and server/cloud synchronization.
