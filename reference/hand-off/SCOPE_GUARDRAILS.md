# Scope Guardrails

## Build in v2

- interview-workstation UX;
- specialist renderers;
- real lightweight SQL/Python execution;
- first-class PySpark review + Deepnote links;
- richer BI/model/pipeline/system labs;
- Git visual lab;
- Bash/Git Bash/PowerShell practice;
- visual explanations;
- representative high-quality exercises;
- state-preserving migrations and tests.

## Do not spend the pass on

- GitHub repository management;
- Netlify project administration;
- authentication/accounts;
- database hosting;
- cloud credentials;
- a real Spark cluster;
- real Airflow scheduler;
- real ADF execution;
- real Kubernetes cluster;
- real Terraform provisioning;
- recreating Power BI Desktop;
- recreating Azure/AWS/GCP consoles;
- hundreds of generated questions.

## Product rule

Every complex system should be represented using the smallest authentic artifact that teaches the interview concept:

- SQL -> small executable tables
- PySpark -> code + expected output + plan/partition visual + Deepnote
- BI -> semantic model + data + filters + measures
- Airflow/ADF -> DAG + states + config + logs
- dbt -> lineage + manifest/run result fixtures
- Spark performance -> stages/tasks/metrics
- Terraform -> HCL + dependency graph + plan fixture
- Kubernetes -> YAML + object graph + events/logs
- Git -> in-memory repo + commit graph + staging/diff
- cloud architecture -> constraints + diagrams + trade-offs

