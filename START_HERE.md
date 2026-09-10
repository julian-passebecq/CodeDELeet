# Start here - Data Practice Studio v0.1

Your personal, open-source data-engineering practice workbench. Four interfaces, 27 example exercises, no cloud account or cluster required.

## Try it immediately - no installation

Open **OPEN_STUDIO.html** in your browser. This single file includes the interface, starter questions, tiny datasets, BI teaching interpreter and diagram/DAG simulations.

It is a usable study edition, not a screenshot. SQL execution and optional Python require the full local edition below. The study edition never pretends that a query was executed.

Browser file storage rules differ. Export your progress from the top-bar download button before closing the file. The file edition and local-server edition may use different browser storage; transfer progress with Export backup / Import backup.

## Full local edition - recommended for your laptop

Extract the whole ZIP first. Keep the folders together.

On Windows, double-click **START_WINDOWS.bat**. Python 3.10 or newer must already be installed. The launcher opens your browser and keeps a local server in a terminal window. Close that window or press Ctrl+C to stop it.

Alternatively, open a terminal in this folder:

```sh
python server/app.py --open
```

On macOS/Linux:

```sh
python3 server/app.py --open
```

The local address is printed in the terminal, normally `http://127.0.0.1:8765`.

No npm installation is needed to use this edition: compiled browser files are included. No Docker, Spark, databases, API keys or cloud subscriptions are required.

## Optional DuckDB

The local edition immediately runs the SQL examples with Python's built-in SQLite. The engine name is visible; SQLite is not described as DuckDB.

To use the implemented DuckDB adapter instead:

```sh
python -m pip install -r requirements-optional.txt
python server/app.py --open
```

Restart the launcher after installing. DuckDB was unavailable in the build environment, so that optional adapter has not been runtime-validated here. The SQLite fallback was tested.

## A first 15-minute tour

Start with **Code lab > Revenue without losing customers**. Run the deliberately incomplete starter, inspect failing checks, read Learn and Hints, and try again. Run query shows output; Run tests checks three small scenarios.

Then open **BI & data modeling > Write a revenue measure**. The model, relationships, slicers, KPI cards, DAX editor and table preview are together. Compare SUM of unit prices with SUMX of quantity times price. Switch Country to Norway and toggle the customer relationship.

Next use **Pipeline lab > Put quality checks before publication** (or choose the quality-gate repair exercise from the list). Remove transform-to-publish, connect quality-to-publish, simulate, select the quality task, and allow one retry. The run log explains what changed.

Finish with **Architecture studio > Design a Fabric analytics path**. Edit a node label in the diagram script, apply it, inspect the canvas, and export SVG or Mermaid. The diagram check is a limited structure check, not a cloud deployment validator.

## Keep your work

Drafts, notes, bookmarks, self-ratings, graph edits and attempts are saved in this browser when storage is available. Export backups regularly. There is no account, server-side profile or cross-device synchronization.

Packs & settings provides content-pack import, backup import/export, an example pack, and runtime information. Imports show a preview and require confirmation. A reference solution never automatically marks a question as mastered.

## Important boundaries

The DAX implementation is a small teaching subset, not Power BI. The pipeline simulator is not Airflow or Azure Data Factory. Spark charts are synthetic work illustrations, not cluster measurements. PySpark, pandas, T-SQL, BigQuery-specific SQL, dbt, C#, shell, HCL and YAML examples are guided practice rather than hidden cloud execution.

Optional browser Python downloads Pyodide only after consent in the full local edition. That remote download could not be tested in the build environment. Export Python/PySpark code to your own notebook when needed.

Read **docs/TEST_REPORT.md** for precise test results and limits; **docs/ARCHITECTURE.md** for what is real, simulated and intentionally deferred.
