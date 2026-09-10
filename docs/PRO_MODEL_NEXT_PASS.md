# Next implementation pass — coding/pro model brief

## Goal

Convert the tested v0.1 prototype into a high-repetition data-engineering interview lab while preserving stable exercise IDs, content-pack guarantees, current migration/import behavior, explicit simulation boundaries and existing test coverage.

Do not start by adding a huge question bank. Do not add cloud accounts or a distributed backend.

## P0 — one-screen attempt shell

Desktop target:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ topic / difficulty / timer / bookmark                    prev · next    │
├───────────────────────────────┬─────────────────────────────────────────┤
│ QUESTION                      │ EDITOR / CANVAS                         │
│ Task | Data | Schema | Hints  │                                         │
│ constraints / fixtures        │                                         │
├───────────────────────────────┴─────────────────────────────────────────┤
│ Results | Explanation | Visual | Notes | History             collapse  │
└─────────────────────────────────────────────────────────────────────────┘
```

Acceptance criteria:

- no full-page vertical scrolling during a normal desktop attempt;
- resizable left/right split and bottom drawer;
- drawer height persisted locally;
- Results opens after Run/Check; Explanation never auto-opens;
- Visual supports exercise-specific teaching views such as join trace, ERD, DAG, filter propagation, architecture or Spark stages;
- schema/data remains visible before solution reveal;
- keyboard shortcuts for run/check, hint, editor focus and previous/next question;
- mobile/tablet may use stacked tabs instead of desktop splits.

## P0 — renderer and execution contracts

Separate interaction renderer from technology/topic.

Suggested renderers:

- `code-editor`
- `sql-editor`
- `terminal`
- `semantic-model`
- `dag-editor`
- `architecture-editor`
- `config-editor`
- `performance-investigation`
- `multi-choice-reasoning`

Execution contract is separate:

- `execute`
- `analyze`
- `simulate`
- `review`

A Kubernetes YAML question can therefore be a `config-editor` + `analyze`; a Spark performance case can be `performance-investigation` + `review`; SQL can be `sql-editor` + `execute`.

## P0 — browser SQL

Integrate DuckDB-Wasm in a worker so the static Netlify edition can run the trusted SQL fixture suite.

Required:

- cancellation/timeout;
- worker reset/termination;
- visible engine label;
- deterministic fixture reset;
- no external DB network connection;
- keep native SQLite/DuckDB local adapters as optional alternatives.

## P0 — editor

Adopt Monaco or an equivalently capable OSS editor for served mode. Support SQL, Python, YAML, HCL, Dockerfile, JSON and DAX/plain-text highlighting. Avoid adding a second complex fallback path unless it is cheap to maintain.

## P1 — Model Lab v2

Replace fixed three-table authoring with an arbitrary exercise model:

- entities, columns, data types and keys;
- relationship cardinality, active/inactive state and filter-direction metadata;
- sample rows and grain metadata;
- DBML/JSON fixture import;
- visual filter-propagation trace;
- multiple measures per exercise;
- layout-independent answer comparison;
- PBIP/TMDL-shaped practice fixtures.

Minimum scenario set:

1. select fact-table grain;
2. repair a star schema;
3. SCD Type 2;
4. many-to-many bridge;
5. role-playing date dimension;
6. semi-additive inventory KPI;
7. DAX filter-context debugging;
8. PBIP/TMDL model/measure review.

Do not recreate Power BI Desktop.

## P1 — Pipeline Lab v2

Typed nodes and inspectors, with code/config and graph backed by the same exercise state.

### Airflow

- retries/retry delay;
- trigger rules;
- branching/short circuit;
- sensor/deferred-wait concepts;
- pools/concurrency;
- catchup/backfill reasoning;
- richer task-instance timeline.

### Azure Data Factory

- Copy, Lookup, ForEach, Until, If Condition;
- parameters/variables;
- incremental watermark flow;
- failure/retry paths;
- integration-runtime selection as conceptual metadata only.

### dbt

- source → staging → intermediate → mart lineage;
- tests/source freshness;
- incremental strategies;
- snapshots/SCD;
- manifest-shaped lineage fixtures.

## P1 — Systems Lab

### Terraform/OpenTofu

HCL editor + parser, resources/data/modules/variables/outputs, inferred dependency graph and deterministic lint-style rules. Never call this a real `plan`.

### Kubernetes/Docker

YAML/Dockerfile editor, versioned schema/AST diagnostics, object relationship visualization and troubleshooting scenarios using supplied logs/events. No cluster required.

### Spark performance investigation

Create Spark-UI-inspired deterministic fixtures containing:

- stage DAG;
- input bytes and row count;
- partitions before/after shuffle;
- task-duration distribution and skew ratio;
- shuffle read/write;
- spill and peak execution memory;
- executor count/cores/memory;
- file count/average file size;
- join strategy/broadcast candidate size.

The learner diagnoses skew, excessive shuffle, small files, bad partitioning, broadcast opportunities, cache misuse, Python UDF overhead, etc. Do not predict real runtime from a toy formula.

### Cloud architecture comparison

Use role-based service palettes and explicit scenario constraints: latency, batch/stream, data volume, SLA, governance, residency, cost sensitivity and team skills. Support Azure/Fabric/Databricks/GCP/AWS equivalence drills and comparison of two candidate architectures. Score explicit requirements and leave subjective trade-offs to a rubric.

## P1 — SQL dialect analysis and visuals

Use SQLGlot or equivalent for parser/AST feedback on BigQuery, T-SQL, Spark/Databricks and Fabric SQL. Keep parsing separate from execution.

Useful Visual tab renderers:

- join graph;
- aggregation grain before/after GROUP BY;
- window PARTITION/ORDER/frame;
- logical SQL processing order;
- CTE/subquery tree;
- column lineage.

## P2 — Git/Linux terminal drills

Use xterm.js over a bounded virtual filesystem/command model. Prefer isomorphic-git for browser Git behavior. Never expose the public host shell.

## Navigation and library

Keep the four top-level labs, but extend exercise metadata and filters with:

- workspace;
- technology;
- concept;
- difficulty;
- status;
- renderer;
- execution contract;
- estimated time;
- interview priority.

Add a transparent “Practice next” queue based on unresolved concepts rather than opaque AI ranking.

## Architecture constraints

- stable question IDs remain authoritative;
- migrations/import behavior must stay tested;
- `execute` / `analyze` / `simulate` / `review` remains explicit in UI;
- static Netlify deployment works without credentials;
- heavy workers lazy-load;
- vendor SDKs are not required to display questions;
- fixtures remain small and reset quickly;
- no scraped LeetCode or certification banks;
- original questions may cite official vendor documentation for concepts.

## QA gate for v0.2

1. Existing 109 checks remain green or are replaced by equivalent stronger tests.
2. Native Chromium and Firefox persistence/navigation smoke tests.
3. Netlify production smoke test for all four labs.
4. DuckDB-Wasm browser SQL passes trusted fixtures.
5. At least two deterministic exercises per new renderer.
6. Keyboard/accessibility coverage for editor, pane resizing, drawer and graph selection.
7. Initial shell does not eagerly load Python or DuckDB workers.
8. No UI can claim vendor-engine execution unless the named vendor engine actually ran.

## Definition of success

A learner should be able to spend 45 minutes alternating between SQL, modeling, orchestration and systems diagnosis without leaving the application, while the interface accurately reflects the engineering artifact being practiced. It should feel like an interview lab, not a documentation site and not a fake cloud console.