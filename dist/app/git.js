/** Deterministic Git teaching state machine. No host git, network, filesystem or eval. */
import { clone, escapeHTML as esc } from './core.js';
export function headId(s) { return s.head ? s.branches[s.head] : s.detached; }
export function commitAt(s, id) { const c = s.commits.find(c => c.id === id); if (!c)
    throw Error(`Unknown commit ${id}.`); return c; }
export function resolveRef(s, ref = 'HEAD') { const m = /^(.*?)(?:~(\d*))?$/.exec(ref); let id = m[1] === 'HEAD' ? headId(s) : s.branches[m[1]] ?? s.tracking[m[1]] ?? s.commits.find(c => c.id === m[1])?.id; if (!id)
    throw Error(`Unknown ref: ${ref}`); if (m[2] !== undefined) {
    const n = m[2] === '' ? 1 : Number(m[2]);
    for (let i = 0; i < n; i++) {
        id = commitAt(s, id).parents[0];
        if (!id)
            throw Error('No parent at requested depth.');
    }
} return id; }
export function gitFixture(kind = 'merge') {
    const A = { id: 'A', parents: [], message: 'Initial pipeline', tree: { 'pipeline.py': 'print("ingest")\n', 'README.md': 'Data platform\n' } };
    const B = { id: 'B', parents: ['A'], message: 'Add schema contract', tree: { ...A.tree, 'schema.json': '{"id":"integer"}\n' } };
    const C = { id: 'C', parents: ['B'], message: 'Document deployment', tree: { ...B.tree, 'README.md': 'Data platform\nDeploy after validation.\n' } };
    const D = { id: 'D', parents: ['B'], message: 'Validate records', tree: { ...B.tree, 'pipeline.py': 'print("ingest and validate")\n' } };
    const E = { id: 'E', parents: ['D'], message: 'Add a data quality test', tree: { ...D.tree, 'test_pipeline.py': 'assert 1 + 1 == 2\n' } };
    const R = { id: 'R', parents: ['C'], message: 'Remote monitoring change', tree: { ...C.tree, 'monitor.py': 'print("health check")\n' } };
    let commits = [A, B, C, D, E], branches = { main: 'C', feature: 'E' }, head = 'main', detached = null;
    if (kind === 'staging') {
        commits = [A, B, C];
        branches = { main: 'C', feature: 'B' };
    }
    if (kind === 'rebase')
        head = 'feature';
    if (kind === 'detached') {
        head = null;
        detached = 'B';
    }
    if (kind === 'conflict') {
        C.tree['pipeline.py'] = 'print("main implementation")\n';
    }
    const tree = clone(commits.find(c => c.id === (head ? branches[head] : detached)).tree);
    const s = { commits, branches, tracking: { 'origin/main': 'C' }, remote: { 'origin/main': kind === 'staging' ? 'C' : 'R' }, remoteCommits: kind === 'staging' ? [] : [{ ...R, tree: { ...C.tree, 'monitor.py': 'print("health check")\n' } }], head, detached, files: clone(tree), index: clone(tree), seq: 0, history: [] };
    if (kind === 'staging') {
        s.files['pipeline.py'] = 'print("ingest and validate")\n';
        s.files['notes.md'] = 'Private interview notes\n';
    }
    return s;
}
export function ancestors(s, id) { const result = new Set(), todo = [id]; while (todo.length) {
    const x = todo.pop();
    if (result.has(x))
        continue;
    result.add(x);
    todo.push(...commitAt(s, x).parents);
} return result; }
export function aheadBehind(s, local = headId(s), remote = s.tracking['origin/main']) { const a = ancestors(s, local), b = ancestors(s, remote); return { ahead: [...a].filter(x => !b.has(x)).length, behind: [...b].filter(x => !a.has(x)).length }; }
function same(a, b) { const ks = new Set([...Object.keys(a), ...Object.keys(b)]); return [...ks].every(k => a[k] === b[k]); }
export function changes(a, b) { return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(k => a[k] !== b[k]).sort(); }
export function gitDiff(a, b) { return changes(a, b).map(k => `diff -- ${k}\n--- ${k}\n+++ ${k}\n${(a[k] ?? '').split('\n').map(l => '- ' + l).join('\n')}\n${(b[k] ?? '').split('\n').map(l => '+ ' + l).join('\n')}`).join('\n\n') || 'No differences.'; }
function untrackedFiles(s) { return Object.fromEntries(Object.entries(s.files).filter(([k]) => !Object.hasOwn(s.index, k) && !Object.hasOwn(commitAt(s, headId(s)).tree, k))); }
function clean(s) { if (s.pendingMerge || changes(s.index, s.files).some(k => Object.hasOwn(s.index, k)) || !same(s.index, commitAt(s, headId(s)).tree))
    throw Error('Commit or stash your working changes first.'); }
function moveHead(s, id) { if (s.head)
    s.branches[s.head] = id;
else
    s.detached = id; }
function checkoutTree(s, id) { const untracked = untrackedFiles(s), tree = clone(commitAt(s, id).tree); for (const [k, v] of Object.entries(untracked))
    if (Object.hasOwn(tree, k) && tree[k] !== v)
        throw Error('An untracked file would be overwritten: ' + k); s.index = tree; s.files = { ...untracked, ...clone(tree) }; }
function newCommit(s, message, parents = [headId(s)], original) { const id = 'N' + (++s.seq); s.commits.push({ id, parents, message, tree: clone(s.index), ...(original ? { original } : {}) }); moveHead(s, id); s.pendingMerge = undefined; s.unmerged = undefined; return id; }
function commonBase(s, a, b) { const aa = ancestors(s, a); const todo = [b], seen = new Set(); while (todo.length) {
    const x = todo.shift();
    if (aa.has(x))
        return x;
    if (!seen.has(x)) {
        seen.add(x);
        todo.push(...commitAt(s, x).parents);
    }
} throw Error('Unrelated histories are not supported.'); }
function mergeTrees(base, ours, theirs) { const tree = clone(ours), conflicts = []; for (const k of new Set([...Object.keys(base), ...Object.keys(ours), ...Object.keys(theirs)])) {
    if (theirs[k] === base[k] || ours[k] === theirs[k])
        continue;
    if (ours[k] !== base[k]) {
        conflicts.push(k);
        tree[k] = `<<<<<<< HEAD\n${ours[k] ?? ''}=======\n${theirs[k] ?? ''}>>>>>>> incoming\n`;
    }
    else if (theirs[k] === undefined)
        delete tree[k];
    else
        tree[k] = theirs[k];
} return { tree, conflicts }; }
export function shellWords(line) { const words = []; let buf = '', quote = '', started = false; for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
        if (c === quote)
            quote = '';
        else if (c === '\\' && line[i + 1] === quote) {
            buf += line[++i];
        }
        else
            buf += c;
        started = true;
    }
    else if (c === '"' || c === "'") {
        quote = c;
        started = true;
    }
    else if (/\s/.test(c)) {
        if (started) {
            words.push(buf);
            buf = '';
            started = false;
        }
    }
    else {
        buf += c;
        started = true;
    }
} if (quote)
    throw Error('Unclosed quote.'); if (started)
    words.push(buf); return words; }
export function runGit(input, command) {
    const s = clone(input);
    try {
        const w = shellWords(command.trim());
        if (w.shift() !== 'git')
            throw Error('Git visual mode accepts git commands. Edit fixture files in Working tree.');
        const cmd = w.shift() ?? 'help';
        let output = '';
        switch (cmd) {
            case 'help':
                output = 'Simulation commands: status, log, show, diff, branch, switch, checkout, add, restore, commit, merge, rebase, fetch, pull, reset, revert, stash, cherry-pick. No host or remote access.';
                break;
            case 'status': {
                const st = changes(commitAt(s, headId(s)).tree, s.index), wt = changes(s.index, s.files);
                output = `${s.head ? 'On branch ' + s.head : 'HEAD detached at ' + headId(s)}\nStaged: ${st.join(', ') || '(none)'}\nUnstaged/untracked: ${wt.join(', ') || '(none)'}${s.pendingMerge ? '\nMerge pending: resolve conflicts and commit.' : ''}`;
                break;
            }
            case 'log': {
                const reachable = w.includes('--all') ? new Set(s.commits.map(c => c.id)) : ancestors(s, headId(s));
                output = s.commits.filter(c => reachable.has(c.id)).reverse().map(c => `${c.id} ${c.message} (${c.parents.join(',') || 'root'})`).join('\n');
                break;
            }
            case 'show': {
                const c = commitAt(s, resolveRef(s, w.find(x => !x.startsWith('-')) ?? 'HEAD'));
                output = `${c.id} ${c.message}\n` + gitDiff(c.parents.length ? commitAt(s, c.parents[0]).tree : {}, c.tree);
                break;
            }
            case 'diff':
                output = w.includes('--staged') || w.includes('--cached') ? gitDiff(commitAt(s, headId(s)).tree, s.index) : gitDiff(s.index, s.files);
                break;
            case 'branch': if (!w.length) {
                output = Object.entries(s.branches).map(([k, v]) => `${k === s.head ? '*' : ' '} ${k} ${v}`).join('\n');
                break;
            }
            else {
                const name = w[0];
                if (!/^[A-Za-z][A-Za-z0-9_/-]{0,39}$/.test(name) || Object.hasOwn(s.branches, name) || ['__proto__', 'constructor', 'prototype'].includes(name))
                    throw Error('Invalid or existing branch name.');
                s.branches[name] = resolveRef(s, w[1] ?? 'HEAD');
                output = `Created ${name} at ${s.branches[name]}; HEAD has not moved.`;
                break;
            }
            case 'switch':
            case 'checkout': {
                clean(s);
                const create = w[0] === '-c' || w[0] === '-b', detach = w[0] === '--detach';
                if (create) {
                    const name = w[1];
                    if (!name || !/^[A-Za-z][A-Za-z0-9_/-]{0,39}$/.test(name) || Object.hasOwn(s.branches, name) || ['__proto__', 'prototype', 'constructor'].includes(name))
                        throw Error('Invalid or existing branch.');
                    s.branches[name] = resolveRef(s, w[2] ?? 'HEAD');
                    s.head = name;
                    s.detached = null;
                }
                else if (detach) {
                    s.detached = resolveRef(s, w[1]);
                    s.head = null;
                }
                else if (Object.hasOwn(s.branches, w[0])) {
                    s.head = w[0];
                    s.detached = null;
                }
                else if (cmd === 'checkout') {
                    s.detached = resolveRef(s, w[0]);
                    s.head = null;
                }
                else
                    throw Error('Unknown branch. Use --detach for a commit.');
                checkoutTree(s, headId(s));
                output = `HEAD -> ${s.head ?? headId(s)}`;
                break;
            }
            case 'add': {
                if (!w.length)
                    throw Error('Specify a file or .');
                const files = w.includes('.') ? [...new Set([...Object.keys(s.files), ...Object.keys(s.index)])] : w;
                for (const f of files) {
                    if (!Object.hasOwn(s.files, f) && !Object.hasOwn(s.index, f))
                        throw Error(`No such fixture file: ${f}`);
                    if (Object.hasOwn(s.files, f))
                        s.index[f] = s.files[f];
                    else
                        delete s.index[f];
                    s.unmerged = s.unmerged?.filter(x => x !== f);
                }
                output = `Staged ${files.length} file(s).`;
                break;
            }
            case 'restore': {
                const staged = w.includes('--staged'), target = w.filter(x => !x.startsWith('-'));
                if (!target.length)
                    throw Error('Specify a file.');
                const from = staged ? commitAt(s, headId(s)).tree : s.index, to = staged ? s.index : s.files;
                for (const f of target) {
                    if (!Object.hasOwn(from, f) && !Object.hasOwn(s.index, f))
                        throw Error('Unknown tracked file: ' + f);
                    if (Object.hasOwn(from, f))
                        to[f] = from[f];
                    else
                        delete to[f];
                }
                output = staged ? 'Index restored; working files unchanged.' : 'Working file restored from index.';
                break;
            }
            case 'commit': {
                const mi = w.indexOf('-m');
                if (mi < 0 || !w[mi + 1])
                    throw Error('Use git commit -m "message".');
                if (s.unmerged?.length)
                    throw Error('Unmerged paths: resolve and stage ' + s.unmerged.join(', '));
                if (s.pendingMerge && Object.values(s.index).some(x => x.includes('<<<<<<< HEAD')))
                    throw Error('Resolve and stage the conflict markers before committing.');
                if (!s.pendingMerge && same(s.index, commitAt(s, headId(s)).tree))
                    throw Error('Nothing staged to commit.');
                const id = newCommit(s, w[mi + 1], s.pendingMerge ?? [headId(s)]);
                output = `[${s.head ?? 'detached'} ${id}] ${w[mi + 1]}`;
                break;
            }
            case 'merge': {
                clean(s);
                const target = resolveRef(s, w[0]), head = headId(s);
                if (ancestors(s, head).has(target)) {
                    output = 'Already up to date.';
                    break;
                }
                if (ancestors(s, target).has(head)) {
                    moveHead(s, target);
                    checkoutTree(s, target);
                    output = `Fast-forward to ${target}. No merge commit.`;
                    break;
                }
                const base = commonBase(s, head, target), r = mergeTrees(commitAt(s, base).tree, commitAt(s, head).tree, commitAt(s, target).tree);
                s.files = { ...untrackedFiles(s), ...r.tree };
                if (r.conflicts.length) {
                    s.index = clone(r.tree);
                    for (const file of r.conflicts) {
                        if (commitAt(s, head).tree[file] === undefined)
                            delete s.index[file];
                        else
                            s.index[file] = commitAt(s, head).tree[file];
                    }
                    s.pendingMerge = [head, target];
                    s.unmerged = r.conflicts;
                    output = `Conflict in ${r.conflicts.join(', ')}. Edit files, git add, then git commit.`;
                }
                else {
                    s.index = clone(r.tree);
                    const id = newCommit(s, `Merge ${w[0]}`, [head, target]);
                    output = `Created merge ${id} with parents ${head}, ${target}.`;
                }
                break;
            }
            case 'rebase': {
                clean(s);
                if (!s.head)
                    throw Error('Create or switch to a branch before rebasing.');
                const target = resolveRef(s, w[0]), original = headId(s), base = commonBase(s, original, target), replay = [];
                let c = commitAt(s, original);
                while (c.id !== base) {
                    if (c.parents.length !== 1)
                        throw Error('This bounded rebase supports a linear feature branch only.');
                    replay.unshift(c);
                    c = commitAt(s, c.parents[0]);
                }
                moveHead(s, target);
                checkoutTree(s, target);
                for (const old of replay) {
                    const r = mergeTrees(commitAt(s, old.parents[0]).tree, s.index, old.tree);
                    if (r.conflicts.length)
                        throw Error('Rebase conflict: simulation leaves original state unchanged. Use the merge-conflict case to practice resolution.');
                    s.index = r.tree;
                    newCommit(s, old.message, [headId(s)], old.id);
                    s.files = clone(s.index);
                }
                output = `Replayed ${replay.length} commit(s) onto ${w[0]}. New IDs; old commits retained for inspection.`;
                break;
            }
            case 'fetch': {
                for (const c of s.remoteCommits ?? [])
                    if (!s.commits.some(x => x.id === c.id))
                        s.commits.push(clone(c));
                s.tracking = { ...s.tracking, ...s.remote };
                output = 'Updated origin/main from the remote fixture. Local branches, index and working tree did not change.';
                break;
            }
            case 'pull': {
                clean(s);
                for (const c of s.remoteCommits ?? [])
                    if (!s.commits.some(x => x.id === c.id))
                        s.commits.push(clone(c));
                s.tracking = { ...s.tracking, ...s.remote };
                const target = s.tracking['origin/main'];
                if (!ancestors(s, target).has(headId(s)))
                    throw Error('Diverged history. Choose an explicit merge or rebase after fetch; no silent policy.');
                moveHead(s, target);
                checkoutTree(s, target);
                output = `Fast-forwarded to ${target} after fetching the remote fixture.`;
                break;
            }
            case 'reset': {
                const mode = w.find(x => x.startsWith('--')) ?? '--mixed';
                if (!['--soft', '--mixed', '--hard'].includes(mode))
                    throw Error('Use --soft, --mixed or --hard.');
                const untracked = untrackedFiles(s);
                const target = resolveRef(s, w.find(x => !x.startsWith('--')) ?? 'HEAD');
                moveHead(s, target);
                if (mode !== '--soft')
                    s.index = clone(commitAt(s, target).tree);
                if (mode === '--hard')
                    s.files = { ...untracked, ...clone(s.index) };
                s.pendingMerge = undefined;
                s.unmerged = undefined;
                output = `${mode}: HEAD moved to ${target}; ${mode === '--soft' ? 'index and working tree kept' : mode === '--mixed' ? 'index reset, working tree kept' : 'index and working tree reset'}.`;
                break;
            }
            case 'revert':
            case 'cherry-pick': {
                clean(s);
                const c = commitAt(s, resolveRef(s, w[0])), base = c.parents[0] ? commitAt(s, c.parents[0]).tree : {};
                const r = cmd === 'revert' ? mergeTrees(c.tree, s.index, base) : mergeTrees(base, s.index, c.tree);
                if (r.conflicts.length)
                    throw Error('Patch conflicts; original state unchanged in this bounded case.');
                s.index = r.tree;
                const id = newCommit(s, `${cmd === 'revert' ? 'Revert' : 'Cherry-pick'} ${c.id}: ${c.message}`);
                s.files = clone(s.index);
                output = `Created ${id}; existing history preserved.`;
                break;
            }
            case 'stash':
                if (w[0] === 'pop') {
                    if (!s.stash)
                        throw Error('No stash.');
                    clean(s);
                    const extra = untrackedFiles(s);
                    s.files = { ...extra, ...s.stash.files };
                    s.index = s.stash.index;
                    delete s.stash;
                    output = 'Restored the fixture stash, including its saved index (teaching behavior).';
                }
                else {
                    if (s.stash)
                        throw Error('One fixture stash is supported. Pop it before saving another.');
                    const untracked = untrackedFiles(s), include = w.includes('-u') || w.includes('--include-untracked');
                    s.stash = { files: include ? clone(s.files) : Object.fromEntries(Object.entries(s.files).filter(([k]) => !Object.hasOwn(untracked, k))), index: clone(s.index) };
                    s.index = clone(commitAt(s, headId(s)).tree);
                    s.files = { ...(include ? {} : untracked), ...clone(s.index) };
                    output = 'Saved tracked changes' + (include ? ' and untracked files' : ' (untracked files kept)') + ' in the one-slot fixture stash.';
                }
                break;
            default: throw Error(`Unsupported simulated git command: ${cmd}. Type git help. Nothing was executed on the host.`);
        }
        s.history = [...s.history, command + '\n' + output.slice(0, 12000)].slice(-100);
        if (s.commits.length > 150)
            throw Error('Repository teaching limit reached. Reset the lab.');
        return { state: s, output, ok: true };
    }
    catch (error) {
        const state = clone(input), output = error.message;
        state.history = [...state.history, command + '\nERROR: ' + output].slice(-100);
        return { state, output, ok: false };
    }
}
export function gitGraphSVG(s, selected = '') {
    const active = new Set([headId(s), ...Object.values(s.branches), ...Object.values(s.tracking)].flatMap(id => [...ancestors(s, id)]));
    const commits = s.commits.filter(c => c.id !== 'R' || active.has('R'));
    const w = Math.max(680, commits.length * 84 + 90), h = 226;
    const positions = new Map();
    commits.forEach((c, i) => { const feature = ['D', 'E'].includes(c.id) || c.original; positions.set(c.id, { x: 40 + i * 78, y: feature ? 150 : 65 }); });
    const edges = commits.flatMap(c => c.parents.map(p => { const a = positions.get(p), b = positions.get(c.id); if (!a || !b)
        return ''; return `<path d="M${a.x},${a.y} C${(a.x + b.x) / 2},${a.y} ${(a.x + b.x) / 2},${b.y} ${b.x},${b.y}" fill="none" stroke="${active.has(c.id) ? '#8b9e94' : '#d5dcd7'}" stroke-width="2"/>`; })).join('');
    const nodes = commits.map(c => { const p = positions.get(c.id), refs = [...Object.entries(s.branches), ...Object.entries(s.tracking)].filter(([, id]) => id === c.id).map(([name]) => name), isHead = headId(s) === c.id; return `<g data-commit="${esc(c.id)}" tabindex="0" role="button" aria-label="Commit ${esc(c.id)} ${esc(c.message)}"><circle cx="${p.x}" cy="${p.y}" r="${isHead ? 13 : 10}" fill="${selected === c.id ? '#dcece4' : '#fff'}" stroke="${isHead ? '#237768' : '#8ba095'}" stroke-width="${isHead ? 3 : 2}"/><text x="${p.x}" y="${p.y + 30}" text-anchor="middle" fill="#314c3e" font-size="12" font-weight="600">${esc(c.id)}${c.original ? ' (new)' : ''}</text><text x="${p.x}" y="${p.y - 25}" text-anchor="middle" fill="#237768" font-size="10">${esc(refs.join(' / '))}</text>${isHead ? `<text x="${p.x}" y="${p.y - 40}" text-anchor="middle" fill="#237768" font-size="10" font-weight="700">HEAD</text>` : ''}</g>`; }).join('');
    return `<svg class="git-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Commit DAG with branch refs and HEAD">${edges}${nodes}</svg>`;
}
