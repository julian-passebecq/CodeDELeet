# CodeDELeet v2 Feature Matrix

| Area | Primary renderer | Execution | Required v2 interaction |
|---|---|---|---|
| SQL | sql-editor | Real browser DuckDB where compatible | schema + editor + result + tests + visual |
| Python | code-editor | Real browser Python | editor + tests + explanation |
| Pandas | code-editor | Real browser Python | small DataFrame fixtures |
| PySpark | pyspark-editor | Review + external Deepnote | editable syntax + expected result + Spark visual |
| Power BI / DAX | semantic-model | Simulate/review | model + data + filters + KPI + measure |
| Data modeling | semantic-model | Review | ERD + grain + relationship manipulation |
| Airflow | dag-editor | Simulate | Graph/Grid/logs/timeline |
| ADF | dag-editor | Simulate | activity graph + dependency conditions |
| dbt | pipeline-investigation | Review | lineage + config + tests + run artifacts |
| Spark performance | performance-investigation | Review | stages/tasks/shuffle/partitions/executors |
| OpenTofu/Terraform | config-editor | Analyze | HCL + dependency graph + plan fixture |
| Kubernetes | config-editor | Analyze/simulate | YAML + object graph + events/logs |
| Docker | config-editor | Analyze | Dockerfile + layers + diagnostics |
| Bash/Linux | terminal | Virtual terminal | data/log/file tasks |
| Git/Git Bash | git-visual + terminal | Browser Git or deterministic simulation | commit DAG + staging + diff + refs |
| PowerShell | terminal | Virtual terminal | object-pipeline exercises |
| Cloud architecture | architecture-editor | Review | Mermaid/custom diagram + constraints + comparison |
| DE concepts | concept-case | Review | answer + visual + model explanation + Deepnote |

## Interaction priority

1. Shared one-screen shell
2. Specialist renderer correctness
3. Visual explanations
4. State persistence
5. Representative exercises
6. Runtime enhancements
7. Content expansion

