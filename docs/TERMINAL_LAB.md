# Terminal Lab - Bash and PowerShell are distinct

`src/terminal.ts` uses a cloned virtual filesystem with explicit shell, current directory, environment and command history. It never invokes an OS shell, opens the user's real files, starts processes or makes HTTP requests. Fixture-only API commands return supplied data.

## Bash

Bash teaching commands operate on text: pwd/cd/ls, cat/echo, head/tail, wc, literal grep, sort/uniq/cut, limited tr/sed/awk/xargs, find, basic file operations, environment values and fixture commands. Output can be piped or redirected to a virtual file. Type `help` for the exact supported vocabulary.

Example:

```sh
grep -in 'error' pipeline.log | tail -n 20
cat data/sales.csv | grep ',paid' | cut -d, -f1 | sort | uniq -c
```

These examples are intentionally small. The CSV text pipeline is for the supplied unquoted simple CSV, not a general CSV parser. General quoted CSV belongs in the PowerShell Import-Csv or Python exercises.

## PowerShell

Supported commands pass objects until a command explicitly serializes them. Import-Csv returns string-valued properties; Select-Object projects object properties, Group-Object keeps grouped objects, Where-Object filters them. A numeric comparison can use an explicit `[int]`, `[decimal]` or `[double]` cast in the supported grammar.

```powershell
Import-Csv data/sales.csv | Where-Object { $_.status -eq "paid" } | Select-Object country,amount
Get-Content data/api.json | ConvertFrom-Json | Select-Object -ExpandProperty items | Where-Object { $_.status -eq "active" }
```

The console labels the output type; JSON-like presentation is the final UI format, not intermediate text conversion. Type `Get-Help` for the bounded vocabulary. Files lets you inspect/edit only virtual data. Switching the mode clears history so text and object outputs are not confused.

## Grading and limits

Run command changes virtual state and displays output. Check goal compares the last successful command's output/objects with the exercise's goal. Errors clear that candidate result. After a reload, run the command again before checking the goal. No shell-execution or pipeline correctness is implied outside the supported grammar. Exact Bash quoting/exit-code/pipefail and full PowerShell coercion/property-case rules are not implemented.

Unit tests cover text and object pipelines, numeric casts, JSON expansion, grouping, quoted CSV, no-match behavior, virtual writes, shell separation and rejection of unsupported/subprocess commands. UI tests run one full Bash and one full PowerShell case through forms and result panels.
