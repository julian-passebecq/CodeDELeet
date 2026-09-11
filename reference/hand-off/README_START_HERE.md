# CodeDELeet v2 Pro Handoff

This ZIP is a feature/specification handoff for a fresh Pro-model build chat.

Use it together with:

1. The complete CodeDELeet v1 repository ZIP.
2. The Deepnote 3-Project Interview Suite ZIP.

Read `FINAL_BUILD_PROMPT.md` first. Treat it as authoritative for v2 scope and priorities. The supporting files give more precise requirements for Git visual exercises, Deepnote integration, renderer contracts, state migration, and acceptance tests.

## Important scope rule

Do not redesign CodeDELeet from scratch. Preserve the current v1 visual identity and working four-lab structure. The main v2 change is to turn the app into a dense one-screen interview workstation with specialist renderers.

Do not spend this pass on GitHub, Netlify administration, authentication, cloud accounts, or large-scale infrastructure. The output should be a complete v2 source ZIP plus audit/test/migration docs.

## Product thesis

CodeDELeet should feel like a purpose-built Data Engineering interview workstation:

- fast coding drills for SQL and Python;
- first-class PySpark practice with optional Deepnote execution links;
- semantic-model and DAX reasoning;
- Airflow/ADF/dbt pipeline debugging;
- Spark performance investigation;
- Terraform/OpenTofu and Kubernetes troubleshooting;
- Docker practice;
- Bash, Git/Git Bash, and PowerShell terminal exercises;
- cloud architecture comparison and diagram exercises;
- strong visual explanations everywhere.

