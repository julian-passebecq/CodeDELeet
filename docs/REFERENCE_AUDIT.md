# Uploaded-source review

## Scope and reuse decision

All 20 supplied ZIP archives were inventoried programmatically. Root readme/license material, frontend manifests and selected relevant model/UI source were inspected where present. This is not a claim of having compiled or read every file in these large projects. Selected deeper inspection focused on Tabular Editor model/measure definitions, SQLBI Whiteboard objects, Bravo model/UI structure and code-practice frontends.

**No code, logos, icons, screenshots, binaries, exercise banks or license text from these archives was copied into the application.** Original TypeScript, CSS, SVG rendering, fixture data and examples implement general workbench patterns. The delivered MIT license covers that original work, not the reference projects.

The Power BI references are mostly desktop .NET tools rather than drop-in browser components. The web model/editor/inspector is an original teaching UI, not an extraction of their actual runtime. The DAX subset does not claim to implement their engines or Microsoft Tabular.

## Inventory

License labels below describe the root material observed in the supplied snapshot, not a legal review of every file, dependency or later repository version. A missing root license is not permission to reuse.

| Supplied archive | Root license observation | Role in design |
|---|---|---|
| `airflow-main (1).zip` | Apache-2.0 | DAG, retries and state concepts; no scheduler/executor bundled. |
| `airflow-ui-main.zip` | Apache-2.0 | Graph/task inspector visual pattern; original renderer and simulator. |
| `algo-bytes-main(1).zip` | No root license found in inspected archive entries; no reuse permission assumed. | Algorithm-practice organization reference only. |
| `Bravo-main (1).zip` | MIT-style root license | Measure/model inspection workflow; no Power BI engine embedded. |
| `dashboard-master.zip` | Apache-2.0 | Kubernetes dashboard context; no live cluster metrics reused. |
| `DaxFormatter-master (4).zip` | MIT-style root license | Formatting/editor UX context; no formatter or remote formatting service copied/called. |
| `DaxStudio-master (2).zip` | Microsoft Reciprocal License (root RTF) | Query/measure editor plus output panels; no desktop code reused. |
| `dbt-core-main(1).zip` | Apache-2.0 | Lineage/testing concepts; no dbt compiler/runtime bundled. |
| `dbt-core-main.zip` | Apache-2.0 | Lineage/testing concepts; no dbt compiler/runtime bundled. |
| `diagrams-js-main.zip` | MIT-style root license | Diagram-as-code context; original narrow DSL/SVG implementation, no icon library copied. |
| `ducklake-main.zip` | MIT-style root license | Catalog/table-format learning topic; no DuckLake engine/catalog instantiated. |
| `FireCode-main(1).zip` | MIT-style root license | Exercise/editor presentation reference only. |
| `leetcode-clone-main (4)(1).zip` | No root license found in inspected archive entries; no reuse permission assumed. | Code editor / task split reference only. |
| `LeetPrep-master (1)(1).zip` | MIT-style root license | Question/progress organization, not a copied question bank. |
| `motherduck-cookbook-main (1).zip` | Apache-2.0 | Lightweight SQL example context; no MotherDuck service connection. |
| `open-solve-main (1)(1).zip` | No root license found in inspected archive entries; no reuse permission assumed. | Code-practice layout reference only. |
| `opentofu-main.zip` | MPL-2.0 | Infrastructure plan/review topic; no resource provisioning. |
| `SQLBI-Whiteboard-main (2).zip` | MIT-style root license | Model/diagram canvas context; original SVG canvas implemented instead. |
| `TabularEditor-master (2).zip` | MIT-style root license; separate component licenses also present | Semantic-model object and C# scripting workflow; no desktop/.NET code reused. |
| `zillacode-master (3)(1).zip` | Apache-2.0 | Split instructions, editor and tests; backend microservices deliberately not adopted. |

The two dbt-core uploads were treated as two supplied snapshots of the same project, not two independent engines or exercise banks. `dashboard-master.zip` contains Kubernetes dashboard material, not a Spark cluster dashboard.

## Why not combine the existing applications?

Copying six coding frontends, several Windows BI tools, an orchestrator, a Kubernetes dashboard and a storage engine would produce incompatible runtimes and licensing obligations without improving a small personal learning tool. The delivered platform instead has one question schema, one state model, four tailored views and small explicit execution adapters.

## Optional dependencies

TypeScript is a pinned development compiler, not a browser runtime. Optional DuckDB and remote Pyodide retain their own upstream licensing and distribution terms. They are not vendored here. Consult official packages before redistribution of those runtimes. No copied SQLBI/DAX Studio assets are needed to run the app.

`reference-inventory.json` records exact archive names, roots and entry counts used during the audit. Uploaded source archives themselves are intentionally not duplicated in the final ZIP.
