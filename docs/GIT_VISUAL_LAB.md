# Git Visual Lab

## Source of truth

`src/git.ts` owns an explicit virtual repository: immutable commits with parent IDs and tree snapshots, local branches, remote-tracking refs, a separate remote fixture, symbolic/detached HEAD, working files, staging/index, command history and a bounded stash. `src/app.ts` renders that state. Goal checks inspect state, not command substrings.

Use Workspace for the DAG, refs, HEAD, commit inspection and command console. Use Files to edit a virtual file and save/stage it. Diff compares working tree against index and index against HEAD. Predict asks what changes before showing a separate target topology; it never changes live refs.

## Supported teaching operations

`git status`, `log`, `show`, `diff`, `branch`, `switch`, `checkout`, `add`, `restore`, `commit -m`, `merge`, linear `rebase`, `fetch`, fast-forward `pull`, `reset --soft/--mixed/--hard`, `revert`, `cherry-pick`, one-slot `stash`/`stash pop`, and `help`. Type `git help` for the bounded command vocabulary. Nothing calls a host process, GitHub or an actual remote. `push` is not supported.

Merge may fast-forward or create a new two-parent commit. Rebase replays changes as new IDs and preserves old snapshots for inspection. Fetch imports fixture objects and advances tracking only, leaving the local branch, index and working files unchanged. Conflict exercises use whole-file conflict markers; stage every resolved path before committing. Reset modes demonstrate the separate HEAD/index/working-tree layers.

## Exercise inventory

The legacy `git-safe-undo` ID remains. New cases: `v2-git-stage`, `v2-git-merge`, `v2-git-rebase`, `v2-git-fetch`, `v2-git-conflict`, `v2-git-detached`. These cover index-only commits, divergent merge, linear rebase, remote tracking, explicit conflict resolution and rescuing detached HEAD.

## Limits and tests

This is not libgit2 or an operating-system Git executable. Conflicts and diffs are whole-file; rebase conflict continuation is deferred; pull requires fast-forward; a one-slot stash restores its saved index explicitly as a teaching deviation. Unsupported/failed operations retain the original semantic repository state and record the error. The state-machine tests cover transitions, conflict staging, parent counts, fetch isolation, reset layers, untracked-file preservation and failed-command atomicity. Browser tests exercise merge, predictions and file-based conflict resolution.
