# CodeDELeet

**Open-source personal interview lab for data engineering, analytics engineering, BI and cloud systems.**

The v0.1 prototype uses four specialist practice workspaces rather than forcing every topic into a LeetCode-style code editor:

- **Code Lab** — SQL, Python, pandas, PySpark syntax/review, T-SQL, BigQuery SQL, Git and Linux.
- **Model Lab** — dimensional modeling, Power BI/DAX concepts, KPI/filter context and semantic-model reasoning.
- **Pipeline Lab** — Airflow, Azure Data Factory, dbt, retries, dependencies, quality gates and idempotency.
- **Systems Lab** — Fabric, Databricks, BigQuery, Terraform/OpenTofu, Kubernetes/Docker, Spark performance and table formats.

## Current status

The audited v0.1 package has been validated with:

- TypeScript type-check and build: **pass**
- Node core/DAX/graph tests: **51/51 pass**
- Python/server tests: **28 pass, 1 optional DuckDB test skipped**
- Embedded UI smoke tests: **30/30 pass**

The application intentionally distinguishes real execution from analysis/simulation. SQL has a local execution path; DAX, DAGs, Spark performance and cloud/system exercises are bounded teaching simulations or reasoning exercises unless a real engine is explicitly connected.

## Repository audit

The repository was initialized from an empty GitHub repository on 10 September 2026. The full tested v0.1 source package exists in the project handoff ZIP; GitHub connector limitations mean the local repository tree cannot be bulk-uploaded as a directory in one connector action. Governance and next-pass documents are being established here without pretending that unsupported binary/directory transfer occurred.

See:

- `docs/AUDIT_2026-09-10.md` — product/UX and workspace audit.
- `docs/RESEARCH_SHORTLIST_2026-09-10.md` — open-source libraries worth considering.
- `docs/PRO_MODEL_NEXT_PASS.md` — bounded implementation brief for the next coding pass.
- `.github/workflows/ci.yml` — recommended CI definition for the full source tree.

## Product direction

The next release should prioritize a **one-screen interview-lab shell** over adding hundreds of questions: question/schema on the left, editor or interactive canvas on the right, and a collapsible lower drawer for Results / Explanation / Visual / Notes / History. Each exercise should declare both a renderer and an execution contract so specialized labs can evolve without becoming four hard-coded page types.

MIT-licensed original project code and exercises. Vendor names identify learning topics only; the project is not affiliated with Microsoft, Databricks, Google, dbt Labs, Apache Software Foundation, HashiCorp, OpenTofu or LeetCode.
