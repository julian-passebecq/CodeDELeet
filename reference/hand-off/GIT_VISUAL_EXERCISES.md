# Git Visual Lab Specification

Git visual exercises are a major v2 feature. The learner must connect commands to repository state, not memorize commands in isolation.

## Core synchronized views

A Git exercise should expose some or all of:

- Terminal
- Commit Graph
- Working Tree
- Staging / Index
- Diff
- Branch / HEAD inspector
- Local vs Remote refs
- Explanation
- History of attempted commands

The commit graph is part of the exercise state and must update when the repository state changes.

## Preferred engine

If practical, use `isomorphic-git` with an in-memory filesystem so common Git commands create genuine browser-side repository state. Never execute the host Git binary.

If a command is not supported, a deterministic simulation is acceptable if clearly labeled and tested.

## Visual semantics

Display:

- commit nodes;
- parent edges;
- merge parents;
- branch pointers;
- HEAD;
- remote tracking refs such as origin/main;
- ahead/behind counts;
- working-tree modifications;
- staged files;
- untracked files;
- conflicts;
- stash state where relevant.

Use consistent visual grammar across exercises.

## Exercise families

### 1. Working tree and staging

Scenario:

```text
Working tree:
  modified: transform.py
  modified: README.md
  untracked: scratch.csv

Goal:
  commit only transform.py
```

Learner must stage the correct file and inspect the staging diagram before commit.

### 2. Branch pointer exercise

Given:

```text
A---B---C  main, HEAD
     \
      D---E  feature
```

Ask which commit each ref points to, then perform `git switch feature` and show HEAD changing from main to feature.

### 3. Fast-forward merge

Given:

```text
A---B---C  main
         \
          D---E  feature
```

After main has not moved, learner merges feature and predicts/observes the fast-forward result.

### 4. Merge commit

Given:

```text
A---B---C  main
     \
      D---E  feature
```

After both sides diverge, learner merges and sees a two-parent merge node.

### 5. Rebase

Before:

```text
A---B---C  main
     \
      D---E  feature
```

After rebasing feature on main:

```text
A---B---C---D'---E'  feature
```

Explain rewritten commit identities.

### 6. Merge conflict

Show two branches editing the same lines. The learner performs merge, sees a conflict state, edits/resolves the file, stages it, and completes the merge.

Visuals should show the repository in a blocked/conflicted state until resolution is complete.

### 7. Detached HEAD

Start with HEAD attached to a branch, then check out a historical commit. Ask what happens to new commits and how to recover by creating/switching a branch.

### 8. Reset variants

Teach the difference between:

- `reset --soft`
- `reset --mixed`
- `reset --hard`

Visualize which layers move/change:

```text
HEAD / branch ref
index / staging
working tree
```

### 9. Revert vs reset

Provide a scenario where a bad commit is already pushed. Ask for the safer public-history action and visualize the new revert commit rather than rewriting history.

### 10. Fetch vs pull

Remote:

```text
A---B---C---D  origin/main
```

Local before fetch:

```text
A---B---C  main, origin/main
```

After fetch:

```text
A---B---C  main
         \
          D  origin/main
```

Working tree must remain unchanged. Then compare merge/rebase pull behavior.

### 11. Local ahead/behind

Give local and remote divergence and ask learner to calculate or identify ahead/behind counts.

### 12. Stash

Dirty working tree prevents safe branch switching in a scenario. Learner stashes, switches, then restores.

### 13. Cherry-pick

Display an unrelated feature commit and ask learner to bring only that commit onto another branch.

### 14. Restore / checkout file

Teach restoring a file from index/HEAD without moving branch history.

### 15. Reflog recovery

Advanced optional case: a local commit becomes unreachable after reset. Use a deterministic reflog fixture to teach recovery without encouraging unsafe behavior.

## Diagram exercise modes

Implement at least four kinds:

1. Predict next graph
2. Reconstruct command sequence
3. Manipulate refs/branches to target state
4. Diagnose current repository state

Optional interaction ideas:

- drag branch labels to commits;
- choose the target graph after a command;
- build a command sequence from cards;
- click the commit HEAD should point to;
- stage files by clicking checkboxes then verify with terminal;
- compare merge vs rebase side by side.

## Static explanations

Mermaid `gitGraph` may be used for static solution/explanation diagrams if convenient. Do not use it as the sole interactive Git engine.

## Required representative exercises for v2

At minimum:

- GIT-01 Working tree vs staging
- GIT-02 Branch and HEAD
- GIT-03 Merge vs fast-forward
- GIT-04 Rebase rewrite
- GIT-05 Fetch vs pull and remote divergence
- GIT-06 Conflict resolution

Keep exercises deterministic and resettable.

