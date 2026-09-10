# Known limitations - V2.0.0

## Release gates still open

The environment blocks browser URL navigation and external downloads. Real DuckDB-Wasm, Pyodide, Mermaid CDN startup, HTTP-origin delivery, full-origin persistence, Netlify deployment and Firefox could not be verified here. The adapters and opt-in network smoke test are implemented. Do not call these gates passed until the next AI runs them in a normal network-enabled browser environment.

## Runtime and safety

The app is a personal learning tool, not a secure multi-tenant judge. Solutions/fixtures ship to the browser. Only run trusted code. A Web Worker separates responsiveness, but Python's JS interoperability is not a complete security boundary. Do not store secrets or run arbitrary untrusted downloaded code. SQL is conservatively restricted to one read-only SELECT/WITH against small fixtures; this may reject legitimate advanced SQL, and vendor dialects remain review-only. Numeric SQL results cast large integers to JavaScript numbers; do not use fixtures that require exact integers beyond JavaScript's safe range. Results are bounded to 200 visible rows. There is no service worker/offline installation of heavy runtimes.

## Specialist boundaries

- PySpark: editor, supplied schema/rows/plan and review only. No Spark execution, AQE predictor or real cluster timing. Spark task numbers are explicit synthetic teaching fixtures, not measurements from the learner's draft.
- Model/BI: supplied Sales/DimCustomer/DimProduct teaching model only; a subset of DAX and fixed country/category filter propagation. General custom semantic models, context transition, RLS, full DAX and XMLA are not implemented. Editing labels does not create a new Power BI table.
- DAG: selected simplified trigger rules, skips, retry delay and ADF-style edge conditions. No real scheduler, pools/concurrency simulator, live backfill execution or persistent destination/watermark transaction model. Correct dependencies and a successful simulated run are distinct observations.
- dbt: curated manifest and run-results evidence. No Jinja compiler, actual `dbt build` or regenerated artifacts from edited code.
- Terraform/OpenTofu/Kubernetes/Docker: fixed-vocabulary text checks plus supplied plan/object/event/log/layer evidence. Not an HCL/YAML type checker, provider, kubectl, Docker daemon or state backend. These checks are intentionally partial, not correctness proofs.
- Git: deterministic virtual repository, whole-file teaching conflicts, linear rebase, one-slot stash and fast-forward-only pull. Rebase-conflict continuation is not modeled. Stash pop restores the saved index in this teaching model, unlike plain real-Git defaults. Whole-file diff is not a minimal diff algorithm. No push/network/real repository access.
- Shells: bounded grammar and command sets, not POSIX Bash or complete PowerShell. Bash grep is literal; no complete regex, job control, pipefail or exact exit-code model. Quote/variable-expansion semantics are simplified. PowerShell uses objects for supported cases but lacks full type coercion, case-insensitive property resolution and script language behavior. Small virtual fixtures only.
- Mermaid: network-loaded optional renderer, strict mode, plain labels only. Preview excludes foreignObject/images/scripts. Native editable canvas and .mmd export work without it. Official platform icons are not bundled; original neutral SVGs are used.
- Deepnote: links are intentionally blank until actual URLs are supplied. Embedded preview, where configured, depends on provider permissions and is not an editable remote IDE. No account API integration or invented URLs.

## State / UX

Backup merge is whole-draft newest-wins, not field-level conflict resolution. localStorage can be unavailable or full; export backups. Branch-preview domains do not share storage. Custom packs can be imported/updated/exported; UI removal of packs is deferred rather than risking accidental orphan deletion. Switching shell modes resets virtual command history. Last shell output must be run again after reload before its goal can be checked. Accessibility has keyboard paths and labels but no complete screen-reader/WCAG audit was run.

The source uses a pinned older CodeMirror 5 distribution copied from installed licensed assets. No dependency security audit is claimed. The lockfile uses verified registry metadata, but a cold `npm ci` download/install must still be checked in the target environment.
