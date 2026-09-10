# Open-source shortlist — 10 September 2026

Research targets for the next implementation pass. Nothing listed here is integrated in v0.1 yet.

| Area | Candidate | Why it fits | Boundary |
|---|---|---|---|
| Browser SQL | `@duckdb/duckdb-wasm` | Real analytical SQL in browser, Arrow/Parquet/CSV support | Browser memory/thread limits; not T-SQL or BigQuery engines |
| Python | Pyodide | CPython in WebAssembly; pandas/NumPy capable | Large lazy-loaded runtime; not PySpark |
| Editor | `monaco-editor` | VS Code editor core; diagnostics/highlighting/multi-language models | Heavier bundle; served HTTP/HTTPS mode preferred |
| Graph editor | `@xyflow/react` / React Flow | Mature interactive nodes/edges, pan/zoom and handles | Introduces React presentation layer |
| Graph layout | `elkjs` | Layered layouts appropriate for DAGs and architectures | Layout engine only |
| Diagram explanations | Mermaid | Useful read-only/reference diagrams and export | Do not make arbitrary Mermaid the sole editable state |
| SQL analysis | SQLGlot | Multi-dialect parser/transpiler/AST incl. BigQuery, Spark/Databricks, T-SQL and DuckDB | Parsing is not vendor-engine execution |
| Data modeling | `@dbml/core` | DBML/SQL parsing and schema conversion in JavaScript | Does not provide Power BI semantic behavior |
| Metrics visualization | Apache ECharts | Strong timelines, distributions and heatmaps for performance exercises | Use where visualization teaches a decision, not for dashboard decoration |
| Terraform HCL | `@cdktf/hcl2json` or maintained successor | Structured HCL parsing without executing Terraform | Verify current maintenance before pinning |
| Terraform metadata | `terraform-config-inspect` | Extracts resources, providers, variables, outputs and module calls | Better suited to optional local checker than static site |
| Kubernetes | versioned Kubernetes JSON schemas | Browser-side YAML structural validation | Schema validation is not API-server/controller validation |
| Kubernetes local checker | `kubeconform` | Mature native manifest validation | Optional local adapter only |
| Dockerfiles | `dockerfile-ast` | TypeScript AST suitable for deterministic Dockerfile checks | Parser alone does not provide build semantics |
| Power BI model text | PBIP/TMDL fixtures | Official text-shaped representation enables realistic offline semantic-model exercises | Do not claim TOM/DAX engine compatibility |
| Terminal surface | xterm.js | Familiar terminal UI | UI only; pair with bounded virtual command model |
| Git sandbox | isomorphic-git | Browser/Node Git behavior over a virtual filesystem | Keep exercises isolated from host filesystem |

## Recommended order

### Phase A — lab UX/runtime

1. Vite-based served app so Web Workers/WASM have a predictable origin.
2. Monaco for the interview editor.
3. React Flow + ELK for model, pipeline and architecture canvases.
4. DuckDB-Wasm for real SQL on Netlify.
5. ECharts only for result/performance visualizations.

### Phase B — domain analyzers

1. SQLGlot for dialect-aware AST feedback.
2. DBML core for arbitrary schema/model exercises.
3. HCL parser for Terraform/OpenTofu syntax and dependency extraction.
4. Kubernetes JSON schemas for YAML structural validation.
5. Dockerfile AST for build-file exercises.
6. PBIP/TMDL-shaped fixtures for BI model practice.

### Phase C — advanced sandboxes

1. isomorphic-git + virtual filesystem + xterm.js for Git/Linux drills.
2. richer Pyodide Python/pandas packs.
3. Spark event-log import or deterministic Spark-UI-like fixture packs for performance diagnosis.

## Explicit exclusions

Do not add a public arbitrary shell, cloud credentials, a fake full DAX engine, a fake Terraform plan, a fake Kubernetes API server, PySpark-in-browser claims or distributed infrastructure just to make the UI look more realistic.

Every exercise should state whether it **executes**, **analyzes**, **simulates**, or is **human-reviewed**.