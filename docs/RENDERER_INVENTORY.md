# Renderer and content contracts

The global four-workspace navigation is stable: code/model/pipeline/architecture. `renderer` chooses an exercise's specialist view. `engine` is the legacy dispatch contract; `executionMode` labels execution truth. `normalizeQuestion` downgrades imported metadata that would incorrectly give a specialist a real-execution badge.

| Renderer | Count | Boundary |
|---|---:|---|
| architecture-editor | 5 | Conceptual graph review; optional Mermaid |
| code-editor | 5 | Python adapter when engine=python, otherwise review |
| concept-case | 6 | Guided written answer |
| config-editor | 4 | Bounded text analysis, static evidence |
| dag-editor | 4 | Deterministic simulation |
| git-visual | 6 | Virtual repository state machine |
| multi-choice-reasoning | 1 | Choice plus saved reasoning |
| performance-investigation | 2 | Supplied Spark evidence; no predictor |
| pipeline-investigation | 1 | Supplied dbt artifact review |
| pyspark-editor | 3 | Review only; no Spark runtime |
| semantic-model | 4 | Fixed teaching model and DAX subset |
| sql-editor | 6 | Real DuckDB adapter; external startup still to verify |
| terminal | 4 | Virtual shell simulation |

## Pack format

Pack: schemaVersion 1 or 2, safe stable id, title, positive integer version, questions (1-500). Question: id/version/title/workspace/topic/difficulty/minutes/engine/language/summary/concept/task/requirements/starter/solution/explanation/hints/sources. V2 fields add renderer/executionMode/technology/interviewPriority/followUps/fixture/visual/deepnoteLinks.

Sources require HTTPS. IDs cannot shadow prototype keys or built-ins. Packs are additive/update-only; changed questions must increase their version. Unknown additional teaching metadata is preserved, but it is not executed as arbitrary check code. Python packages are explicitly selected by adapter metadata, and config check vocabulary is built into `checks.ts`.

See `examples/custom-pack.json`, `examples/content-pack.schema.json` and runtime validation in `src/core.ts`. The JSON schema documents the portable envelope; the app still performs its own validation. Fixtures remain trusted learning data; a full per-renderer schema/fuzz audit is on the backlog.

## V2.2 source layout

See [the shared-shell architecture](V2_2_ARCHITECTURE.md) for presentation, case and renderer modules. The renderer/engine dispatch contract and all 51 exercise IDs remain stable. The four authored cases reference this same bank without copying a second question bank or adding duplicate IDs.

Presentation presets do not change the renderer's execution boundary. Inspector cards expose the supplied teaching model, not a general semantic engine. Run-investigation views render saved simulation snapshots, not a second scheduler.
