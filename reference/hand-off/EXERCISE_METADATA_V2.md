# Exercise Metadata v2

Extend v1 content additively. Old exercises must continue to load through defaults/migrations.

Suggested shape:

```json
{
  "id": "stable-existing-id",
  "revision": 2,
  "workspace": "code",
  "technology": "Git",
  "concept": ["rebase", "history"],
  "difficulty": "intermediate",
  "interviewPriority": "high",
  "estimatedMinutes": 8,
  "renderer": "git-visual",
  "executionMode": "execute",
  "prompt": {},
  "fixtures": {},
  "diagram": {},
  "visualExplanation": {},
  "followUps": [],
  "deepnoteLinks": [],
  "deepnoteEmbedUrl": null
}
```

## Suggested renderer values

- sql-editor
- code-editor
- pyspark-editor
- semantic-model
- dag-editor
- pipeline-investigation
- architecture-editor
- performance-investigation
- config-editor
- terminal
- git-visual
- multi-choice-reasoning
- concept-case

## Suggested executionMode values

- execute
- analyze
- simulate
- review
- external

## Suggested interviewPriority values

- essential
- high
- normal
- secondary

## Suggested terminal metadata

```json
{
  "renderer": "terminal",
  "terminal": {
    "shell": "powershell",
    "filesystemFixture": "sales-files-v1",
    "allowedCommands": ["Import-Csv", "Where-Object", "Sort-Object"]
  }
}
```

Shell values:

- bash
- git-bash
- powershell

## Suggested Git metadata

```json
{
  "renderer": "git-visual",
  "gitFixture": {
    "repository": "merge-basic-v1",
    "targetState": "merged",
    "views": ["terminal", "graph", "working-tree", "staging", "diff"]
  }
}
```

## Suggested visual types

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

