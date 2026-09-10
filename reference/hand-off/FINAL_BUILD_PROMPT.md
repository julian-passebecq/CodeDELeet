# CodeDELeet v2 - Final Pro Build Prompt

Build CodeDELeet v2 from the attached complete v1 repository ZIP. Also inspect the attached Deepnote 3-Project Interview Suite ZIP as the optional long-form notebook companion.

Do not redesign the application from scratch. The current v1 visual style is good. Preserve its clean light visual identity, four-lab navigation, stable exercise IDs, content-pack behavior, user progress, notes, drafts, bookmarks, review state, and existing working simulations.

The objective is to make v2 feel like a serious personal Data Engineering interview laboratory rather than a documentation site, a generic LeetCode clone, or a fake cloud console.

## 1. Product architecture

Preserve four primary workspaces:

- Code Lab
- Model / BI Lab
- Pipeline Lab
- Systems / Cloud Lab

Use one shared attempt shell, but allow specialist renderers inside it. Do not force SQL, Power BI modeling, Airflow DAGs, Spark performance, Kubernetes, and Git into the same generic editor layout.

The product model is:

```text
                         CodeDELeet
                              |
            +-----------------+-----------------+
            |                 |                 |
           SQL              Python            PySpark
            |                 |                 |
       DuckDB-Wasm         Pyodide       CodeDELeet editor
            |                 |          + expected result
            |                 |          + visual explanation
            +------ optional Deepnote companion ------+
                              |
                  SQL / Python / Spark notebooks

             Model / Pipeline / Systems / Cloud
                              |
             specialist learning interfaces
                              |
              diagrams + simulations + logs
              + metrics + deterministic fixtures
                              |
                  optional Deepnote links
```

CodeDELeet must remain useful without Deepnote.

## 2. Core UX - one-screen interview workstation

Convert normal desktop attempts to a dense one-screen workspace:

```text
+------------------------------------------------------------------------+
| Technology | Concept | Difficulty | Timer | Bookmark       Prev / Next |
+--------------------------------+---------------------------------------+
| QUESTION                       | EDITOR / CANVAS / TERMINAL            |
|                                |                                       |
| Task | Data | Schema | Hints   |                                       |
|                                |                                       |
| problem statement              | editable answer                       |
| sample data                    | or specialist interactive view        |
| constraints                    |                                       |
| schema                         |                                       |
+--------------------------------+---------------------------------------+
| Results | Explanation | Visual | Deepnote | Notes | History       ^    |
+------------------------------------------------------------------------+
```

Required behavior:

- resizable left/right split;
- resizable bottom drawer;
- collapsed drawer mode;
- persist pane widths and drawer height locally;
- no normal full-page scrolling during a desktop attempt;
- each pane may scroll internally;
- Results automatically opens after Run/Check;
- Explanation never auto-opens;
- Solution is deliberately revealed by user action;
- Data and Schema remain visible before solution reveal;
- previous/next navigation;
- bookmark;
- status/confidence/review controls;
- attempt history;
- notes;
- optional timer;
- keyboard shortcuts;
- tablet/mobile fallback uses stacked tabs.

Keep v1 visual styling and color restraint.

## 3. Renderer and execution contracts

Separate technology, renderer, and execution behavior.

Suggested renderers:

- `sql-editor`
- `code-editor`
- `pyspark-editor`
- `semantic-model`
- `dag-editor`
- `pipeline-investigation`
- `architecture-editor`
- `performance-investigation`
- `config-editor`
- `terminal`
- `git-visual`
- `multi-choice-reasoning`
- `concept-case`

Execution modes:

- `execute`
- `analyze`
- `simulate`
- `review`
- `external`

Examples:

```text
SQL              -> sql-editor              + execute
Python           -> code-editor             + execute
PySpark          -> pyspark-editor           + review/external
Power BI model   -> semantic-model          + simulate/review
Airflow          -> dag-editor              + simulate
ADF              -> dag-editor              + simulate
Spark perf       -> performance-investigation + review
OpenTofu         -> config-editor           + analyze
Kubernetes       -> config-editor           + analyze/simulate
Bash             -> terminal                + simulate
PowerShell       -> terminal                + simulate
Git              -> git-visual/terminal     + execute or simulate
Cloud arch       -> architecture-editor     + review
```

The UI must clearly label the mode. Never claim a vendor engine executed when it did not.

## 4. Editor foundation

Use Monaco Editor or another mature open-source editor where practical. Lazy-load it.

Support syntax highlighting for:

- SQL
- Python
- PySpark
- YAML
- JSON
- HCL
- Dockerfile
- DAX/plain text
- Bash
- PowerShell

Keep the editor focused on learning, not full IDE emulation.

Useful features:

- line numbers;
- bracket matching;
- indentation;
- search;
- reset starter code;
- copy;
- solution comparison/diff where useful;
- keyboard Run/Check shortcut.

## 5. SQL - real lightweight browser execution

Implement DuckDB-Wasm locally in the browser for small deterministic SQL exercise databases.

Requirements:

- no backend DB;
- no Netlify Function;
- no paid service;
- no cloud account;
- no credentials;
- deterministic fixture reset;
- timeout/cancellation/worker reset;
- visible engine label;
- lazy-load on first SQL Run;
- result row cap;
- clear error messages.

Use real SQL execution for compatible exercises.

For T-SQL, BigQuery SQL, Spark SQL, Databricks SQL, or Fabric SQL features that DuckDB cannot faithfully execute, keep dialect analysis separate from execution. Do not claim DuckDB validates the target dialect.

Representative SQL topics:

- SELECT / WHERE;
- GROUP BY / HAVING;
- joins;
- CTE;
- subqueries;
- window functions;
- ranking;
- deduplication;
- gaps/islands;
- date logic;
- incremental/watermark patterns;
- merge/upsert reasoning;
- data-quality checks;
- grain reasoning.

Visual tab examples:

- join trace;
- logical SQL processing order;
- GROUP BY grain before/after;
- window partition/order/frame;
- CTE tree;
- column lineage;
- before/after row flow.

## 6. Python and Pandas

Use Pyodide or the current safe browser-Python mechanism for small exercises.

Focus on Data Engineering interview programming, not only algorithms:

- lists/dicts/sets/tuples;
- loops/comprehensions;
- functions;
- exceptions;
- files;
- JSON;
- APIs;
- pagination;
- chunking/batching;
- iterators/generators;
- parsing;
- transformations;
- grouping/deduplication;
- Pandas basics;
- ETL-style tasks.

Classical algorithm practice may remain but should not dominate.

## 7. PySpark - first-class CodeDELeet practice plus Deepnote

PySpark must use the same fast practice pattern as SQL/Python:

```text
PYSPARK QUESTION                YOUR CODE

Task                            result = (
Schema                              df
Sample rows                         .groupBy(...)
Expected output                     .agg(...)
Hints                           )

Expected | Explanation | Visual | Spark Plan | Deepnote | Notes
```

CodeDELeet should provide:

- question;
- starter code;
- editable PySpark answer;
- schema;
- sample rows;
- expected output;
- hints;
- solution;
- explanation;
- transformation diagram;
- optional logical/physical-plan teaching view;
- interview follow-up questions.

Do not attempt to run Spark in-browser.

Use labels such as:

- Check approach
- Compare expected result
- Reveal solution
- Run full exercise in Deepnote

Never say Spark executed unless Deepnote or another real Spark runtime actually ran it.

Representative PySpark topics:

- select/filter;
- withColumn;
- groupBy/agg;
- joins;
- windows;
- explode;
- arrays/maps;
- null handling;
- deduplication;
- repartition/coalesce;
- caching;
- built-ins vs UDF;
- partitioning;
- schema evolution;
- Delta-style merge reasoning;
- small-files reasoning.

## 8. Deepnote integration across the product

Deepnote is an optional companion environment, not a dependency.

Support Deepnote metadata for:

- SQL;
- Python;
- Pandas;
- PySpark;
- DE conceptual interview topics;
- architecture/design topics;
- longer mocks.

Suggested metadata:

```json
{
  "deepnoteLinks": [
    {
      "type": "exercise",
      "label": "Run full Spark exercise",
      "url": "",
      "exerciseRef": "PS-04"
    },
    {
      "type": "concept",
      "label": "Open Spark joins notebook",
      "url": "",
      "exerciseRef": "SPARK-JOINS"
    }
  ],
  "deepnoteEmbedUrl": null
}
```

Allowed link types:

- exercise
- concept
- mock
- reference
- project

Rules:

- do not invent URLs;
- if no URL exists, hide the button;
- create a mapping/template file ready for the real URLs;
- prefer exact exercise/block target if valid;
- otherwise specific notebook;
- otherwise project;
- show exercise reference ID prominently when the deep link cannot target an exact editable block;
- optional public iframe preview only when a safe explicit `deepnoteEmbedUrl` exists;
- do not describe a Deepnote Data App/block as the editable notebook IDE.

Add a bottom `Deepnote` tab with the relevant links and exercise references.

## 9. Model / BI Lab v2

Expand the existing semantic-model lab without recreating Power BI Desktop.

Support exercise-defined:

- tables;
- columns;
- data types;
- primary keys;
- foreign keys;
- fact/dimension role;
- grain;
- sample rows;
- relationships;
- one-to-many;
- many-to-many;
- active/inactive;
- cross-filter direction;
- slicers/filters;
- measures;
- KPI cards.

The learner should often see model + data + measure + filter + result simultaneously.

Representative topics:

- choose fact-table grain;
- repair star schema;
- fact vs dimension;
- SCD1/SCD2;
- many-to-many bridge;
- role-playing date dimension;
- accumulating snapshot;
- periodic snapshot;
- transaction fact;
- semi-additive inventory;
- measures vs calculated columns;
- filter context;
- context transition;
- inactive relationships;
- USERELATIONSHIP reasoning;
- incorrect totals;
- KPI design;
- P&L modeling;
- PBIP/TMDL-shaped model review.

DAX execution is optional. Teaching correctness and context visualization matter more.

Visual tab examples:

- filter propagation;
- active vs inactive relationship;
- SCD2 timeline;
- many-to-many bridge;
- role-playing dimension;
- KPI grain.

## 10. Pipeline Lab v2

Preserve and enhance the existing interactive DAG. Graph and code/config must share the same exercise state.

### Airflow-style cases

Views:

- Graph
- Grid
- Task Details
- Code/Config
- Logs
- Timeline
- Explanation

Support:

- dependencies;
- retries/retry delay;
- trigger rules;
- branching;
- ShortCircuit concepts;
- sensors;
- deferred/waiting concepts;
- pools;
- concurrency;
- catchup;
- backfill;
- failure/skipped/upstream_failed states;
- task logs/duration.

Do not run Airflow.

### Azure Data Factory-style cases

Node types:

- Copy;
- Lookup;
- Get Metadata;
- ForEach;
- Until;
- If Condition;
- Set Variable;
- Execute Pipeline;
- Stored Procedure;
- Notebook/activity placeholder.

Support:

- parameters;
- variables;
- expressions;
- watermark/incremental load patterns;
- retries;
- dependency conditions: Succeeded, Failed, Skipped, Completed;
- integration-runtime selection as conceptual metadata.

### dbt cases

Views:

- Lineage
- SQL
- Model config
- Tests
- Execution
- Explanation

Use realistic small artifact-shaped fixtures inspired by:

- manifest.json
- run_results.json

Support source -> staging -> intermediate -> fact/dimension -> mart flows, tests, freshness, snapshots, incremental strategies, unique keys, materializations, and downstream failure reasoning.

## 11. Systems Lab - Spark Performance Investigator

Build deterministic Spark-UI-inspired troubleshooting exercises.

Example fixture:

```text
Input                    480 GB
Rows                     2.4 B
Files                    28,000
Partitions               200
Median task              7 s
Slowest task             96 s
Shuffle read             390 GB
Shuffle write            420 GB
Spill                    85 GB
Largest partition        18.2 GB
Median partition         1.7 GB
Executors                8
Cores/executor           4
Memory/executor          12 GB
fact_sales               470 GB
dim_country              4 MB
Join strategy            SortMergeJoin
```

Views:

- Overview
- Stage DAG
- Tasks
- Executors
- SQL Plan
- Partitions
- Files
- Join Strategy

Teach diagnosis of:

- skew;
- excessive shuffle;
- partition count;
- small files;
- broadcast opportunities;
- sort-merge joins;
- spill;
- executor sizing reasoning;
- cache misuse;
- Python UDF overhead;
- repartition vs coalesce;
- partition pruning;
- predicate pushdown;
- AQE concepts.

Do not predict exact real-cluster runtime from a toy formula.

## 12. Terraform / OpenTofu

Create a specialist infrastructure practice view:

```text
HCL | Dependency Graph | Plan Fixture | Explanation
```

Support:

- resources;
- variables;
- outputs;
- locals;
- modules;
- providers;
- data sources;
- for_each/count;
- dependencies;
- lifecycle;
- state concepts;
- drift;
- plan interpretation;
- replacement reasoning.

Use deterministic fixture plan/state data. Never call it a real plan unless a real tool ran.

## 13. Kubernetes

Create:

```text
YAML | Object Graph | Events | Logs | Explain
```

Support objects such as:

- Pod;
- Deployment;
- ReplicaSet;
- Service;
- ConfigMap;
- Secret metadata;
- Namespace;
- StatefulSet;
- Job/CronJob;
- PVC;
- Ingress.

Troubleshooting examples:

- CrashLoopBackOff;
- ImagePullBackOff;
- Pending;
- OOMKilled;
- probe failure;
- selector mismatch;
- service routing issue;
- missing ConfigMap/env;
- requests/limits;
- scheduling reasoning.

No real cluster required.

## 14. Docker

Add Dockerfile/config practice with views such as:

```text
Dockerfile | Layers | Diagnostics | Explanation
```

Topics:

- multi-stage builds;
- layer ordering;
- image size;
- caching;
- COPY ordering;
- .dockerignore;
- CMD vs ENTRYPOINT;
- ports;
- non-root users;
- build context;
- environment variables;
- Docker Compose reasoning.

No Docker daemon required.

## 15. Terminal Lab - Bash, Git/Git Bash, PowerShell

Terminal training is required.

Create three first-class modes:

- Bash / Linux
- Git / Git Bash
- PowerShell

Never expose the host shell or deployment machine.

Use a deterministic virtual filesystem/command model. For Git, prefer real browser Git state transitions through a safe library such as isomorphic-git plus an in-memory filesystem if integration is reasonable. If not, build a deterministic Git state engine, but keep the diagrams/state transitions truthful.

### Bash / Linux

Support common interview/data-engineering commands:

- pwd, ls, cd, mkdir, cp, mv, rm;
- cat, head, tail, wc;
- grep, find, sort, uniq, cut, tr, xargs;
- sed, awk;
- curl/jq concepts;
- chmod;
- ps;
- env/export;
- pipes and redirection.

Exercises should use logs, CSV, JSON, and data directories rather than generic shell trivia.

### PowerShell

PowerShell is not Bash with different command names. Teach object pipelines.

Support representative commands/concepts:

- Get-ChildItem;
- Set-Location;
- Get-Content;
- Set-Content/Add-Content;
- Copy-Item/Move-Item/Remove-Item;
- Test-Path;
- Select-String;
- Where-Object;
- ForEach-Object;
- Select-Object;
- Sort-Object;
- Group-Object;
- Measure-Object;
- Import-Csv/Export-Csv;
- ConvertFrom-Json/ConvertTo-Json;
- Get-Process;
- Get-Command/Get-Help;
- Invoke-RestMethod/Invoke-WebRequest concepts;
- `$env:VARIABLE`;
- basic `.ps1` scripting.

Use data-engineering flavored scenarios: CSV transforms, JSON API outputs, logs, file automation, environment variables.

## 16. Git visual exercises - major v2 feature

Git must have both terminal practice and true visual exercises.

Do not limit Git training to typing commands into a fake prompt.

Provide a synchronized Git workspace with:

```text
+--------------------------+--------------------------------------------+
| SCENARIO                 | TERMINAL / ACTIONS                         |
|                          |                                            |
| goal / constraints       | git status                                 |
| repo state               | git switch feature                         |
| files                    | git merge main                             |
+--------------------------+--------------------------------------------+
| Commit Graph | Working Tree | Staging | Diff | Explanation | History |
+------------------------------------------------------------------------+
```

The visual state should update when the learner performs Git actions.

Preferred implementation:

- use `isomorphic-git` or another safe browser Git implementation with an in-memory filesystem when practical;
- generate the commit DAG from the actual in-memory Git state;
- if a particular command is unsupported, simulate it explicitly and label it;
- never invoke the host Git binary.

### Required visual Git concepts

1. Working tree vs staging area vs repository

```text
working tree  ->  staging/index  ->  local commit
     git add          git commit
```

2. Branch pointers and HEAD

```text
A---B---C  main, HEAD
     \
      D---E  feature
```

3. Merge

```text
A---B---C------M  main
     \        /
      D---E---F   feature
```

4. Rebase

Before:

```text
A---B---C  main
     \
      D---E  feature
```

After:

```text
A---B---C---D'---E'  feature
```

5. Fast-forward merge
6. Merge conflict
7. Detached HEAD
8. Reset --soft / --mixed / --hard conceptual differences
9. Revert vs reset
10. Stash
11. Cherry-pick
12. Fetch vs pull
13. Local vs origin divergence
14. Tracking branches
15. Reflog as an advanced recovery concept where appropriate

### True diagram exercise types

Create interactive exercises such as:

- "Given this commit graph, which command reaches the target state?"
- "Drag branch labels to the correct commit."
- "Predict the graph after merge."
- "Predict the graph after rebase."
- "Repair a detached HEAD situation."
- "Choose reset/revert based on whether commits were pushed."
- "Stage only the intended files, then verify the staging diagram."
- "Resolve a conflict and produce the target DAG."
- "Fetch remote changes and explain why the working tree did not change."
- "Identify ahead/behind counts from the graph."
- "Reconstruct the safest command sequence from before/after diagrams."

Git diagram state is part of the answer, not decoration.

### Git Visual tab

Use Mermaid `gitGraph` only for static explanation/reference if useful. The main exercise diagram should be generated from exercise/Git state so nodes, refs, HEAD, local/remote branches, and commit transitions are interactive and truthful.

Visual elements should show:

- commits;
- commit IDs/short labels;
- parent relationships;
- branch labels;
- HEAD;
- origin/main or other remote tracking refs;
- staged/unstaged file counts;
- conflict markers/state;
- ahead/behind counts.

Include a Diff view and a Working Tree/Staging view.

Git exercises should feel like a visual debugger for repository state.

## 17. Cloud architecture and diagram exercises

Improve architecture teaching substantially.

Support:

- Mermaid flowcharts;
- Mermaid ER diagrams;
- Mermaid architecture-beta;
- current interactive architecture canvas;
- reusable reference cards;
- official cloud/vendor icons where reuse terms clearly permit training/architecture use;
- links to official architecture references rather than bulk-copying copyrighted diagrams.

Relevant service palettes may include Microsoft/Azure/Fabric, Databricks, GCP, and AWS data services.

Keep icon usage restrained and consistent with the current visual style.

Architecture exercises should include explicit scenario constraints such as:

```text
Daily volume          4 TB
Peak throughput       60 MB/s
Latency               <5 min
Workload              streaming + BI
Retention             7 years
PII                    yes
Residency              EU
Team                   SQL-heavy
Cost sensitivity      high
```

Exercise types:

- build an architecture from requirements;
- compare two candidate architectures;
- identify missing governance/security component;
- choose batch vs streaming;
- select orchestration layer;
- map equivalent services across clouds;
- explain medallion/lakehouse flow;
- identify semantic/serving layer;
- identify expensive/fragile design choice.

Score objective requirements separately from subjective trade-offs.

## 18. Official visual references

Where appropriate, include reference actions to official vendor documentation/architecture pages.

Do not bulk-copy third-party architecture images unless license/reuse terms clearly permit it.

Prefer:

```text
Interactive teaching diagram
Mermaid source
Official reference link
```

Where official architecture/service icons are clearly reusable for architecture/training, they may be stored locally or loaded safely. Keep licensing notes in documentation.

## 19. Visual explanations are first-class

Every exercise may declare a visual explanation renderer.

Examples:

- sql-join-trace
- sql-window
- sql-processing-order
- python-data-flow
- pyspark-transformations
- erd
- filter-propagation
- scd-timeline
- dag
- pipeline-timeline
- dbt-lineage
- spark-stage
- spark-partitions
- terraform-graph
- kubernetes-objects
- docker-layers
- git-commit-graph
- git-working-tree
- cloud-architecture

The Visual tab must explain the reasoning, not merely decorate the exercise.

## 20. Concept/interview cases

Not every DE topic needs code.

Support theory/reasoning cases for:

- partitioning;
- bucketing;
- shuffle;
- broadcast joins;
- CDC;
- idempotency;
- watermarks;
- exactly-once reasoning;
- SCD;
- lakehouse;
- Delta/Iceberg concepts;
- medallion architecture;
- batch vs streaming;
- OLTP vs OLAP;
- warehouse vs lakehouse;
- data contracts;
- orchestration;
- observability;
- data quality;
- CAP/consistency concepts;
- storage/file sizing;
- cost/performance trade-offs.

Use scenario cards, answer area, visual, model answer, follow-ups, and optional Deepnote links.

## 21. Interview follow-up questions

Many exercises should include optional follow-up questions after the main attempt.

Examples:

SQL:
- What changes if duplicates exist?
- What is the output grain?
- Could a window replace the GROUP BY?
- What happens at 2 TB scale?

Spark:
- Does this cause a shuffle?
- What if one key owns 60% of rows?
- Can the dimension be broadcast?

BI:
- Why a measure instead of calculated column?
- Which relationship propagates this filter?

Git:
- Is this safe if the commit is already pushed?
- What is the difference between fetch and pull in this state?
- Would rebase rewrite shared history?

Terminal:
- Why is this Bash pipeline text-oriented while PowerShell passes objects?

## 22. Learn vs Lab behavior

Do not create two separate apps, but allow exercise modes that naturally support:

- Learn/Theory
- Practice/Lab
- Troubleshooting/Investigation

A concept case may use:

```text
Question | Your Answer | Visual | Model Answer | Follow-ups | Deepnote
```

A coding case:

```text
Question | Editor | Results | Tests | Explanation | Deepnote
```

A troubleshooting case:

```text
Scenario | Metrics/Logs | Diagnosis | Visual | Recommended Fix | Deepnote
```

## 23. Navigation and practice queues

Extend filters with:

- workspace;
- technology;
- concept;
- difficulty;
- status;
- renderer;
- execution mode;
- estimated time;
- interview priority.

Support transparent queues such as:

- Practice next;
- Wrong answers;
- Bookmarked;
- Review;
- Weak;
- SQL only;
- PySpark only;
- BI modeling;
- Pipeline debugging;
- Systems;
- Terminal;
- Git visual;
- 15-minute session;
- 45-minute mock.

Do not build an opaque AI ranking system.

## 24. Representative content, not hundreds of questions

Do not spend the pass generating a huge bank.

Build approximately 2-4 excellent examples for each important new renderer and preserve existing questions.

Minimum representative v2 cases should include:

- SQL window;
- SQL join/grain;
- Python transformation;
- PySpark aggregation;
- PySpark window/join;
- star-schema repair;
- SCD2;
- DAX/filter-context investigation;
- Airflow retry/trigger-rule;
- ADF incremental watermark;
- dbt lineage failure;
- Spark skew/performance;
- OpenTofu dependency/plan;
- Kubernetes troubleshooting;
- Dockerfile optimization;
- Bash log/CSV exercise;
- PowerShell CSV/JSON object pipeline;
- Git working-tree/staging exercise;
- Git merge visual exercise;
- Git rebase visual exercise;
- Git remote divergence/fetch-pull exercise;
- cloud architecture comparison;
- general DE concept case.

## 25. Exercise metadata

Extend content in a backward-compatible way with fields conceptually like:

```json
{
  "id": "stable-existing-id",
  "workspace": "code",
  "technology": "Git",
  "concept": ["rebase", "history"],
  "difficulty": "intermediate",
  "interviewPriority": "high",
  "renderer": "git-visual",
  "executionMode": "execute",
  "estimatedMinutes": 8,
  "fixtures": {},
  "diagram": {},
  "visualExplanation": {},
  "deepnoteLinks": [],
  "deepnoteEmbedUrl": null
}
```

Do not require every v2 property on old content. Add migration/default behavior.

## 26. Preserve state and imports

Do not break:

- stable exercise IDs;
- drafts;
- notes;
- bookmarks;
- review state;
- solved/wrong/mastered status;
- confidence;
- attempt history;
- imported packs;
- pack ownership/versioning;
- backup/import behavior.

Add migration tests for schema changes.

## 27. Performance and lazy loading

Initial app load should not eagerly download heavy engines/libraries.

Lazy-load by renderer/action:

- DuckDB-Wasm on first SQL Run;
- Pyodide on first Python Run;
- Monaco when an editor exercise is opened if practical;
- Mermaid when a Mermaid visual is requested;
- terminal/Git runtime only when terminal/Git exercise opens;
- vendor icon packs only when architecture view requires them.

## 28. Testing

Maintain or strengthen current coverage.

Add tests for:

- migration/state preservation;
- one-screen shell;
- pane resize persistence;
- bottom drawer;
- solution reveal;
- keyboard navigation;
- SQL runtime init/reset;
- Python runtime init/reset;
- PySpark no-false-execution behavior;
- Deepnote link visibility and invalid URLs;
- optional Deepnote iframe restrictions;
- semantic-model relationships;
- DAG interactions;
- Spark investigation;
- OpenTofu fixtures;
- Kubernetes fixtures;
- Docker renderer;
- Bash virtual terminal;
- PowerShell virtual terminal;
- Git repository reset;
- Git terminal commands;
- Git commit DAG rendering;
- branch/HEAD/ref updates;
- merge graph;
- rebase graph;
- working tree/staging transitions;
- remote divergence;
- architecture/Mermaid renderer;
- mobile fallback.

At least Chromium and Firefox smoke coverage where practical.

## 29. Critical honesty rules

Always distinguish:

```text
REAL EXECUTION
ANALYZE
SIMULATION
REVIEW
EXTERNAL LAB
VIRTUAL TERMINAL
```

Never claim:

- Spark executed unless a real Spark runtime ran;
- Airflow ran;
- ADF ran;
- Power BI engine executed;
- Kubernetes cluster validation occurred;
- OpenTofu/Terraform plan ran;
- Bash/PowerShell host shell access occurred;
- Git host binary ran if using browser Git/simulation.

For Git, if isomorphic-git actually changes an in-memory repository, it may be labeled real browser Git state. Unsupported simulated commands must be labeled accordingly.

## 30. Scope discipline

Do not spend significant time on:

- GitHub integration;
- Netlify administration;
- authentication;
- cloud account integration;
- real Spark infrastructure;
- real Kubernetes;
- real Terraform provisioning;
- Power BI Desktop replication;
- Azure Portal replication;
- huge question banks.

Static deployment compatibility should be preserved, but repository/deployment work belongs to the next agent.

## 31. Priority order

### P0

1. one-screen interview shell;
2. resizable panes + bottom drawer;
3. renderer/execution contracts;
4. editor improvement;
5. state/migration preservation;
6. Deepnote metadata/buttons;
7. PySpark first-class editor/review experience;
8. Git visual renderer foundation;
9. terminal shell selector foundation.

### P1

10. DuckDB-Wasm SQL;
11. Python/Pandas browser execution;
12. Model/BI v2;
13. Pipeline v2;
14. Spark Performance Investigator;
15. Git true diagram exercises;
16. Bash/Git Bash exercises;
17. PowerShell exercises;
18. OpenTofu/Kubernetes/Docker investigators;
19. Mermaid/cloud architecture improvements.

### P2

20. richer terminal command coverage;
21. more cloud comparisons;
22. broader representative content;
23. optional advanced Git recovery cases.

Do not sacrifice P0 interaction quality to finish every P2 feature.

## 32. Definition of success

After v2, a learner should be able to spend 45-90 minutes moving naturally through:

- SQL;
- Python;
- Pandas;
- PySpark;
- data modeling;
- Power BI/DAX;
- Airflow;
- ADF;
- dbt;
- Spark performance;
- Terraform/OpenTofu;
- Kubernetes;
- Docker;
- Bash/Linux;
- Git/Git Bash;
- Git visual diagrams;
- PowerShell;
- cloud architecture;
- general DE conceptual cases.

The product should feel like a purpose-built Data Engineering interview workstation.

Git in particular should become visually understandable: commands and repository state must be connected to a commit DAG, branch refs, HEAD, staging area, diff, and remote/local divergence.

## 33. Deliverables

Deliver a complete source ZIP, not only patches.

Required files in the delivery:

1. `CodeDELeet_v2_SOURCE.zip`
2. `MIGRATION_V1_TO_V2.md`
3. `V2_AUDIT.md`
4. `V2_TEST_REPORT.md`
5. `DEEPNOTE_INTEGRATION.md`
6. `GIT_VISUAL_LAB.md`
7. `TERMINAL_LAB.md`
8. updated content/renderer schema documentation
9. representative v2 exercises
10. Deepnote URL mapping/template
11. `KNOWN_LIMITATIONS.md`
12. `V2_1_BACKLOG.md`

Do not overwrite the supplied v1 archive. Build v2 in a new working directory and preserve a clear migration path.

