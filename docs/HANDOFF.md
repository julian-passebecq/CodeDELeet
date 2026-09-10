# Developer handoff

Start with README, ARCHITECTURE, CONTENT_PACKS and TEST_REPORT. The four workspaces and starter questions are implemented. Do not replace stable question IDs or merge in third-party apps wholesale.

Strict TypeScript source is in src/; committed browser JavaScript in public/app/. Use npm run build after source changes; it also regenerates OPEN_STUDIO.html. This single-file edition is generated, not the source of truth. No npm packages were downloaded in the build environment; no package-lock or runtime vendor tree is included.

First next gate: run the normal local app on the user's browser/Windows machine and validate native storage/reload/export. Then install native DuckDB and validate it; optionally test real Pyodide loading. Do not mark those as tested based on the SQLite or embedded-harness results.

The desktop Power BI source uploads are references only. No extracted Tabular Editor / DAX Studio runtime is embedded. DAX is a bounded original teaching interpreter. Spark/ADF/Airflow/dbt/Kubernetes are learning modes with simulated or review-only behavior, not integrations.

Do not deploy server/app.py as a public untrusted judge. Static public/ hosting is separate and lacks SQL API execution. GitHub and Netlify were not changed for this delivery.
