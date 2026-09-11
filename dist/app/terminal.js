/** Small deterministic virtual shells. Commands never touch the host. Unsupported syntax is rejected. */
import { clone } from './core.js';
import { shellWords } from './git.js';
export function terminalFixture(shell = 'bash') { return { shell, cwd: '/workspace', dirs: ['/', '/workspace', '/workspace/data', '/workspace/logs'], env: { DATA_DIR: '/workspace/data' }, files: { '/workspace/pipeline.log': 'INFO batch=41 started\nERROR source timeout\nINFO retry=1\nerror row=7 invalid country\nINFO batch=41 completed\n', '/workspace/data/sales.csv': 'country,amount,status\nNO,120,paid\nSE,60,paid\nNO,40,cancelled\nDK,20,pending\nNO,80,paid\n', '/workspace/data/api.json': JSON.stringify({ items: [{ id: 1, status: 'active' }, { id: 2, status: 'inactive' }, { id: 3, status: 'active' }], next: null }, null, 2), '/workspace/logs/job.log': '2026-09-10 INFO loaded 5 rows\n2026-09-10 ERROR duplicate key=42\n' }, history: [] }; }
export function splitPipeline(line) { const parts = []; let buf = '', quote = '', braces = 0; for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
        buf += c;
        if (c === quote && line[i - 1] !== '\\')
            quote = '';
    }
    else if (c === '"' || c === "'") {
        quote = c;
        buf += c;
    }
    else if (c === '{') {
        braces++;
        buf += c;
    }
    else if (c === '}') {
        braces--;
        buf += c;
    }
    else if (c === '|' && braces === 0) {
        parts.push(buf.trim());
        buf = '';
    }
    else
        buf += c;
} if (quote || braces !== 0)
    throw Error('Unclosed quote or object-pipeline block.'); parts.push(buf.trim()); if (parts.some(x => !x) || parts.length > 15)
    throw Error('Invalid or overly long pipeline.'); return parts; }
function path(s, p) { const full = p.startsWith('/') ? p : s.cwd + '/' + p; const out = []; for (const c of full.split('/')) {
    if (c === '..')
        out.pop();
    else if (c && c !== '.')
        out.push(c);
} return '/' + out.join('/'); }
function get(s, p) { const key = path(s, p); if (!Object.hasOwn(s.files, key))
    throw Error(`No such fixture file: ${p}`); return s.files[key]; }
function put(s, p, v) { if (v.length > 200000)
    throw Error('Virtual file limit: 200 KB.'); const key = path(s, p); if (!s.dirs.includes(key.slice(0, key.lastIndexOf('/')) || '/'))
    throw Error('Parent directory does not exist.'); s.files[key] = v; }
function csv(text) {
    const rows = [];
    let row = [], field = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
            if (quoted && text[i + 1] === '"') {
                field += '"';
                i++;
            }
            else
                quoted = !quoted;
        }
        else if (c === ',' && !quoted) {
            row.push(field);
            field = '';
        }
        else if (c === '\n' && !quoted) {
            row.push(field.replace(/\r$/, ''));
            if (row.some(Boolean))
                rows.push(row);
            row = [];
            field = '';
        }
        else
            field += c;
    }
    if (quoted)
        throw Error('Invalid CSV quote.');
    if (field || row.length) {
        row.push(field);
        rows.push(row);
    }
    const headers = rows.shift() ?? [];
    if (new Set(headers).size !== headers.length)
        throw Error('Duplicate CSV headers.');
    return rows.map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
}
function lines(t) { return t.replace(/\n$/, '').split('\n').filter((x, i, a) => x !== '' || a.length > 1); }
function bash(s, segment, input) {
    if (/\$\(|`|&&|;/.test(segment))
        throw Error('Subshells, command chaining and host scripting are not supported.');
    segment = segment.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, k) => s.env[k] ?? '');
    const a = shellWords(segment), cmd = a.shift() ?? '', flags = a.filter(x => x.startsWith('-')), args = a.filter(x => !x.startsWith('-')), stdin = typeof input === 'string' ? input : '';
    const text = () => args.length ? args.map(f => get(s, f)).join('') : stdin;
    switch (cmd) {
        case 'help': return 'Virtual Bash: pwd ls cd mkdir cp mv rm cat head tail wc grep find sort uniq cut tr echo env export chmod ps curl jq. sed supports s/old/new/g; awk supports print $N. No host access.';
        case 'pwd': return s.cwd;
        case 'ls': {
            const p = path(s, args[0] ?? '.');
            if (Object.hasOwn(s.files, p))
                return p.split('/').pop();
            return [...new Set([...Object.keys(s.files), ...s.dirs].filter(f => f.startsWith(p === '/' ? '/' : p + '/') && f !== p).map(f => f.slice((p === '/' ? '' : p).length + 1).split('/')[0]))].sort().join('\n');
        }
        case 'cd': {
            const p = path(s, args[0] ?? '/workspace');
            if (!s.dirs.includes(p))
                throw Error('No such virtual directory.');
            s.cwd = p;
            return '';
        }
        case 'mkdir':
            for (const arg of args) {
                const p = path(s, arg);
                if (!s.dirs.includes(p))
                    s.dirs.push(p);
            }
            return '';
        case 'cp':
        case 'mv':
            if (args.length !== 2)
                throw Error('Use source destination.');
            put(s, args[1], get(s, args[0]));
            if (cmd === 'mv')
                delete s.files[path(s, args[0])];
            return '';
        case 'rm':
            if (flags.some(f => /[rf]/.test(f)))
                throw Error('Recursive/forced deletion is intentionally unavailable.');
            for (const f of args) {
                get(s, f);
                delete s.files[path(s, f)];
            }
            return '';
        case 'cat': return text();
        case 'echo': return a.join(' ');
        case 'export': {
            const pair = a.join(' '), i = pair.indexOf('=');
            if (i < 1)
                throw Error('Use export NAME=value.');
            s.env[pair.slice(0, i)] = pair.slice(i + 1);
            return '';
        }
        case 'env': return Object.entries(s.env).map(([k, v]) => k + '=' + v).join('\n');
        case 'head':
        case 'tail': {
            const i = a.indexOf('-n'), n = i >= 0 ? Number(a[i + 1]) : 10;
            const files = a.filter((x, j) => !x.startsWith('-') && (i < 0 || j !== i + 1));
            const tx = files.length ? files.map(f => get(s, f)).join('') : stdin;
            if (!Number.isInteger(n) || n < 0 || n > 1000)
                throw Error('Line count must be 0-1000.');
            const ls = lines(tx);
            return (cmd === 'head' ? ls.slice(0, n) : n ? ls.slice(-n) : []).join('\n');
        }
        case 'wc': {
            const tx = text();
            return flags.some(f => f.includes('l')) ? String(args.length ? (tx.match(/\n/g) ?? []).length : lines(tx).length) : String(tx.trim() ? tx.trim().split(/\s+/).length : 0);
        }
        case 'grep': {
            const pattern = args.shift();
            if (pattern === undefined)
                throw Error('Pattern required.');
            if (pattern.length > 100 || /[(){}+*\\]/.test(pattern))
                throw Error('Virtual grep supports literal text, not complex regular expressions.');
            const ignore = flags.some(f => f.includes('i')), number = flags.some(f => f.includes('n')), inverse = flags.some(f => f.includes('v')), tx = args.length ? args.map(f => get(s, f)).join('') : stdin;
            const results = lines(tx).map((l, i) => ({ l, i })).filter(({ l }) => (ignore ? l.toLowerCase().includes(pattern.toLowerCase()) : l.includes(pattern)) !== inverse);
            return results.map(({ l, i }) => (number ? `${i + 1}:` : '') + l).join('\n');
        }
        case 'find': {
            const start = path(s, args[0] ?? '.'), i = a.indexOf('-name'), pattern = i >= 0 ? a[i + 1] : '*', re = new RegExp('^' + pattern.split('*').map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
            return Object.keys(s.files).filter(f => f.startsWith(start) && re.test(f.split('/').pop())).join('\n');
        }
        case 'sort': return lines(text()).sort(flags.some(f => f.includes('n')) ? ((a, b) => Number(a) - Number(b)) : undefined).filter((x, i, a) => !flags.some(f => f.includes('u')) || i === 0 || x !== a[i - 1]).join('\n');
        case 'uniq': {
            const ls = lines(text()), out = [];
            for (let i = 0; i < ls.length;) {
                let j = i + 1;
                while (ls[j] === ls[i])
                    j++;
                out.push((flags.some(f => f.includes('c')) ? `${j - i} ` : '') + ls[i]);
                i = j;
            }
            return out.join('\n');
        }
        case 'cut': {
            const d = a.find(x => x.startsWith('-d'))?.slice(2) || a[a.indexOf('-d') + 1] || ',', f = Number(a.find(x => /^\-f\d/.test(x))?.slice(2) || a[a.indexOf('-f') + 1]);
            if (!f)
                throw Error('Use cut -d, -f1.');
            return lines(stdin).map(l => l.split(d)[f - 1] ?? '').join('\n');
        }
        case 'tr':
            if (a[0] === '[:lower:]' && a[1] === '[:upper:]')
                return stdin.toUpperCase();
            if (a[0] === '[:upper:]' && a[1] === '[:lower:]')
                return stdin.toLowerCase();
            if (a.length !== 2 || a[0].length !== 1)
                throw Error('Virtual tr supports case conversion or one-character substitution.');
            return stdin.split(a[0]).join(a[1]);
        case 'sed': {
            const m = /^s\/([^/]+)\/([^/]*)\/(g?)$/.exec(a[0] ?? '');
            if (!m)
                throw Error('Supported sed form: s/old/new/g (literal).');
            const tx = a[1] ? get(s, a[1]) : stdin;
            return m[3] ? tx.split(m[1]).join(m[2]) : tx.replace(m[1], m[2]);
        }
        case 'awk': {
            const m = /^\{\s*print\s+\$(\d+)\s*\}$/.exec(a[0] ?? '');
            if (!m)
                throw Error('Supported awk form: {print $N}.');
            return lines(stdin).map(l => l.trim().split(/\s+/)[Number(m[1]) - 1] ?? '').join('\n');
        }
        case 'xargs':
            if (a[0] !== 'echo')
                throw Error('Only xargs echo is supported; no subprocesses.');
            return stdin.trim().split(/\s+/).join(' ');
        case 'chmod': return 'SIMULATION: mode change acknowledged; no real OS permissions exist.';
        case 'ps': return 'PID COMMAND\n41 fixture-ingest\n42 fixture-validate';
        case 'curl':
            if (args[0] !== 'https://fixture.local/api')
                throw Error('Network disabled. Only https://fixture.local/api is a deterministic fixture.');
            return s.files['/workspace/data/api.json'];
        case 'jq': {
            const v = JSON.parse(stdin), expr = a[0];
            if (expr === '.')
                return JSON.stringify(v, null, 2);
            if (expr === '.items[]')
                return v.items.map((x) => JSON.stringify(x)).join('\n');
            if (expr === '.items | length')
                return String(v.items.length);
            throw Error('Supported jq: . , .items[] , .items | length.');
        }
        default: throw Error(`Unsupported virtual Bash command: ${cmd}. Type help.`);
    }
}
function powershell(s, segment, input) {
    const a = shellWords(segment), cmd = (a.shift() ?? '').toLowerCase(), arr = Array.isArray(input) ? input : input === undefined ? [] : [input], nonflags = a.filter(x => !x.startsWith('-'));
    switch (cmd) {
        case 'get-help':
        case 'get-command': return 'VIRTUAL PowerShell object pipelines: Get-ChildItem, Set-Location, Get-Content, Set-Content, Add-Content, Import-Csv, Export-Csv, ConvertFrom-Json, ConvertTo-Json, Where-Object, Select-Object, Sort-Object, Group-Object, Measure-Object, ForEach-Object, Copy-Item, Move-Item, Remove-Item, Test-Path, Get-Process. No host execution.';
        case 'get-location': return s.cwd;
        case 'set-location': {
            const p = path(s, nonflags[0]);
            if (!s.dirs.includes(p))
                throw Error('No such virtual directory.');
            s.cwd = p;
            return '';
        }
        case 'get-childitem': {
            const p = path(s, nonflags[0] ?? '.');
            return Object.entries(s.files).filter(([f]) => f.startsWith(p + '/')).map(([f, v]) => ({ Name: f.split('/').pop(), FullName: f, Length: v.length, Extension: '.' + f.split('.').pop() }));
        }
        case 'get-content': return get(s, nonflags[0]);
        case 'set-content':
        case 'add-content': {
            const dest = nonflags[0], v = nonflags.slice(1).join(' ') || String(input ?? '');
            put(s, dest, (cmd === 'add-content' ? (s.files[path(s, dest)] ?? '') : '') + v);
            return '';
        }
        case 'copy-item':
        case 'move-item':
            put(s, nonflags[1], get(s, nonflags[0]));
            if (cmd === 'move-item')
                delete s.files[path(s, nonflags[0])];
            return '';
        case 'remove-item':
            get(s, nonflags[0]);
            delete s.files[path(s, nonflags[0])];
            return '';
        case 'test-path': return Object.hasOwn(s.files, path(s, nonflags[0])) || s.dirs.includes(path(s, nonflags[0]));
        case 'import-csv': return csv(get(s, nonflags[0]));
        case 'convertfrom-json': return JSON.parse(String(input));
        case 'convertto-json': return JSON.stringify(input, null, 2);
        case 'where-object': {
            const m = /\{\s*(?:\[(int|decimal|double)\])?\s*\$_\.([A-Za-z][\w]*)\s+-(eq|ne|gt|lt|ge|le)\s+["']?([^"'}]+)["']?\s*\}/i.exec(segment);
            if (!m)
                throw Error('Use Where-Object { $_.status -eq "paid" } or a numeric cast.');
            const [, cast, key, op, raw] = m;
            return arr.filter(v => { if (!v || typeof v !== 'object')
                throw Error('Where-Object expects objects with named properties.'); const left = cast ? Number(v[key]) : v[key], right = cast ? Number(raw.trim()) : raw.trim(); return op === 'eq' ? left === right : op === 'ne' ? left !== right : op === 'gt' ? left > right : op === 'lt' ? left < right : op === 'ge' ? left >= right : left <= right; });
        }
        case 'select-object': {
            if (a.includes('-ExpandProperty')) {
                const k = a[a.indexOf('-ExpandProperty') + 1];
                return arr.flatMap(v => v[k]);
            }
            const keys = nonflags.join('').split(',');
            return arr.map(v => Object.fromEntries(keys.map(k => [k, v[k]])));
        }
        case 'sort-object': {
            const key = nonflags[0], desc = a.some(x => x.toLowerCase() === '-descending');
            return [...arr].sort((a, b) => ((a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0) * (desc ? -1 : 1)));
        }
        case 'group-object': {
            const key = nonflags[0], groups = new Map();
            for (const v of arr) {
                const k = String(v[key]);
                groups.set(k, [...(groups.get(k) ?? []), v]);
            }
            return [...groups].map(([Name, Group]) => ({ Name, Count: Group.length, Group }));
        }
        case 'measure-object': return [{ Count: arr.length }];
        case 'foreach-object': {
            const m = /\{\s*\$_\.([A-Za-z][\w]*)\s*\}/.exec(segment);
            if (!m)
                throw Error('Supported ForEach-Object block: { $_.Property }.');
            return arr.map(v => v[m[1]]);
        }
        case 'export-csv': {
            const keys = Object.keys(arr[0] ?? {}), quote = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
            put(s, nonflags[0], [keys.map(quote).join(','), ...arr.map(v => keys.map(k => quote(v[k])).join(','))].join('\n') + '\n');
            return '';
        }
        case 'select-string': {
            const pi = a.findIndex(x => x.toLowerCase() === '-pattern'), pattern = pi >= 0 ? a[pi + 1] : nonflags[0], fi = a.findIndex(x => x.toLowerCase() === '-path'), tx = fi >= 0 ? get(s, a[fi + 1]) : String(input ?? '');
            return lines(tx).map((Line, i) => ({ Line, LineNumber: i + 1 })).filter(x => x.Line.toLowerCase().includes(pattern.toLowerCase()));
        }
        case 'get-process': return [{ Id: 41, ProcessName: 'fixture-ingest', CPU: 1.2 }, { Id: 42, ProcessName: 'fixture-validate', CPU: 0.4 }];
        case 'invoke-restmethod':
            if (nonflags[0] !== 'https://fixture.local/api')
                throw Error('Only the fixture API is allowed; no network.');
            return JSON.parse(s.files['/workspace/data/api.json']);
        default:
            if (/^\$env:[a-z_]+$/i.test(cmd)) {
                if (a[0] === '=') {
                    s.env[cmd.slice(5).toUpperCase()] = a.slice(1).join(' ');
                    return '';
                }
                return s.env[cmd.slice(5).toUpperCase()] ?? '';
            }
            throw Error(`Unsupported virtual PowerShell command: ${cmd}. Type Get-Help.`);
    }
}
export function runTerminal(input, command) { const s = clone(input); try {
    if (command.length > 4000)
        throw Error('Command limit: 4,000 characters.');
    let dest, append = false;
    const rm = /\s(>>?)\s*([^\s]+)\s*$/.exec(command);
    if (rm) {
        dest = rm[2];
        append = rm[1] === '>>';
        command = command.slice(0, rm.index);
    }
    let value;
    for (const segment of splitPipeline(command))
        value = s.shell === 'bash' ? bash(s, segment, value) : powershell(s, segment, value);
    let output = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    const type = Array.isArray(value) ? (value[0] && typeof value[0] === 'object' ? 'object[]' : 'array') : typeof value;
    if (dest) {
        put(s, dest, (append ? (s.files[path(s, dest)] ?? '') : '') + output + '\n');
        output = `Wrote ${dest} in the virtual filesystem.`;
    }
    if (Object.keys(s.files).length > 100 || JSON.stringify(s.files).length > 500000)
        throw Error('Virtual filesystem teaching limit reached.');
    s.history = [...s.history, { command, output, ok: true, type }].slice(-60);
    return { state: s, output, value, type, ok: true };
}
catch (error) {
    const output = error.message;
    const state = clone(input);
    state.history = [...state.history, { command, output, ok: false, type: 'error' }].slice(-60);
    return { state, output, value: null, type: 'error', ok: false };
} }
