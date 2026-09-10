# CodeDELeet

**Open-source personal interview lab for data engineering, analytics engineering, BI and cloud systems.**

Live site: https://leetdejul.netlify.app/

The v0.1 prototype uses four specialist practice workspaces rather than forcing every topic into a single LeetCode-style code editor:

- **Code Lab** — SQL, Python, pandas, PySpark syntax/review, T-SQL, BigQuery SQL, Git and Linux.
- **Model Lab** — dimensional modeling, Power BI/DAX concepts, KPI/filter context and semantic-model reasoning.
- **Pipeline Lab** — Airflow, Azure Data Factory, dbt, retries, dependencies, quality gates and idempotency.
- **Systems Lab** — Fabric, Databricks, BigQuery, Terraform/OpenTofu, Kubernetes/Docker, Spark performance and table formats.

## Current status

The full v0.1 source is now committed on `main` and Netlify publishes the committed `public/` directory.

Validation on the merged source:

- TypeScript type-check: **pass**
- Build: **pass**
- Node tests: **pass**
- Python/server tests: **pass**
- Chromium embedded UI smoke tests: **pass**
- Netlify production deploy: **ready**

The application intentionally distinguishes real execution from analysis/simulation. SQL has a local execution path; DAX, DAGs, Spark performance and cloud/system exercises are bounded teaching simulations or reasoning exercises unless a real engine is explicitly connected.

## Project documents

- `docs/AUDIT_2026-09-10.md` — product/UX and workspace audit.
- `docs/RESEARCH_SHORTLIST_2026-09-10.md` — open-source libraries worth considering.
- `docs/PRO_MODEL_NEXT_PASS.md` — bounded implementation brief for the next coding pass.
- `docs/RELEASE_STATUS_2026-09-10.md` — post-push GitHub/CI/Netlify status.
- `docs/ARCHITECTURE.md` — current architecture.
- `docs/CONTENT_PACKS.md` — exercise-pack format and extension path.
- `.github/workflows/ci.yml` — automated core and UI validation.

## Product direction

The next release should prioritize a **one-screen interview-lab shell** over adding hundreds of questions: question/data/schema on the left, editor or interactive canvas on the right, and a collapsible lower drawer for Results / Explanation / Visual / Notes / History. Each exercise should declare both a renderer and an execution contract so specialized labs can evolve without becoming four hard-coded page types.

MIT-licensed original project code and exercises. Vendor names identify learning topics only; the project is not affiliated with Microsoft, Databricks, Google, dbt Labs, Apache Software Foundation, HashiCorp, OpenTofu or LeetCode.
