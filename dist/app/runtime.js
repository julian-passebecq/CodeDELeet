export const RUNTIME_VERSIONS = { duckdb: '1.29.0', pyodide: '0.27.7', mermaid: '11.16.1' };
/** Remove comments and literal contents before enforcing a read-only teaching contract. */
export function sqlTokens(sql) {
    let out = '', quote = '', line = false, block = false;
    for (let i = 0; i < sql.length; i++) {
        const c = sql[i], n = sql[i + 1];
        if (line) {
            if (c === '\n') {
                line = false;
                out += ' ';
            }
            continue;
        }
        if (block) {
            if (c === '*' && n === '/') {
                block = false;
                i++;
                out += ' ';
            }
            continue;
        }
        if (quote) {
            if (c === quote) {
                if (n === quote) {
                    i++;
                    continue;
                }
                quote = '';
                out += ' ';
            }
            continue;
        }
        if (c === '-' && n === '-') {
            line = true;
            i++;
            continue;
        }
        if (c === '/' && n === '*') {
            block = true;
            i++;
            continue;
        }
        if (c === "'") {
            quote = c;
            out += ' literal ';
            continue;
        }
        if (c === '"') {
            out += ' ';
            continue;
        }
        out += c;
    }
    if (quote || block)
        throw Error('Unclosed SQL string or block comment.');
    return out;
}
export function removeSQLComments(sql) { let out = '', quote = '', line = false, block = false; for (let i = 0; i < sql.length; i++) {
    const c = sql[i], n = sql[i + 1];
    if (line) {
        if (c === '\n') {
            line = false;
            out += '\n';
        }
        continue;
    }
    if (block) {
        if (c === '*' && n === '/') {
            block = false;
            i++;
            out += ' ';
        }
        continue;
    }
    if (quote) {
        out += c;
        if (c === quote) {
            if (n === quote) {
                out += n;
                i++;
            }
            else
                quote = '';
        }
        continue;
    }
    if (c === "'" || c === '"') {
        quote = c;
        out += c;
    }
    else if (c === '-' && n === '-') {
        line = true;
        i++;
    }
    else if (c === '/' && n === '*') {
        block = true;
        i++;
    }
    else
        out += c;
} return out; }
export function validateSQL(sql) {
    if (sql.length > 50000)
        throw Error('SQL limit: 50,000 characters.');
    const tokens = sqlTokens(sql).trim();
    if (!/^(SELECT|WITH)\b/i.test(tokens))
        throw Error('This fixture adapter accepts one SELECT or WITH query only.');
    if (tokens.replace(/;\s*$/, '').includes(';'))
        throw Error('Run one query at a time.');
    if (/\b(insert|update|delete|merge|create|drop|alter|copy|attach|detach|install|load|pragma|set|call|export|import|vacuum)\b/i.test(tokens))
        throw Error('Only read-only fixture queries are allowed.');
    if (/\b(read_\w+|\w+_scan|glob|query|query_table|httpfs|sqlite_attach)\s*\(/i.test(tokens))
        throw Error('External files, extensions and dynamic queries are disabled.');
    return removeSQLComments(sql).trim().replace(/;\s*$/, '');
}
function normalize(v) { if (typeof v === 'bigint')
    return Number(v); if (v instanceof Date)
    return v.toISOString(); if (ArrayBuffer.isView(v))
    return Array.from(v); return v; }
export function compareRows(actual, expected, ordered = true) {
    const canonical = (r) => JSON.stringify(r.map(normalize));
    const a = actual.map(canonical), b = expected.map(canonical);
    if (!ordered) {
        a.sort();
        b.sort();
    }
    return JSON.stringify(a) === JSON.stringify(b);
}
let db = null, sqlWorker = null, pythonWorker = null, sqlInit = null, generation = 0, pendingCancel = null;
export function cancelRuntime() { generation++; sqlWorker?.terminate(); pythonWorker?.terminate(); sqlWorker = null; pythonWorker = null; db = null; sqlInit = null; pendingCancel?.(); pendingCancel = null; }
function timeout(promise, ms, onTimeout) { return new Promise((resolve, reject) => { const timer = setTimeout(() => { onTimeout(); reject(Error('Runtime timed out and was reset. Your draft is preserved.')); }, ms); promise.then(v => { clearTimeout(timer); resolve(v); }, e => { clearTimeout(timer); reject(e); }); }); }
async function sqlDatabase(progress) {
    if (db)
        return db;
    if (sqlInit)
        return sqlInit;
    const g = generation;
    sqlInit = (async () => {
        progress('Loading DuckDB-Wasm from jsDelivr. First use needs internet.');
        const url = `https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@${RUNTIME_VERSIONS.duckdb}/+esm`;
        const duckdb = await import(/* @vite-ignore */ url);
        if (g !== generation)
            throw Error('Cancelled.');
        const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles());
        const blobURL = URL.createObjectURL(new Blob([`importScripts(${JSON.stringify(bundle.mainWorker)});`], { type: 'application/javascript' }));
        sqlWorker = new Worker(blobURL);
        try {
            const instance = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(duckdb.LogLevel.ERROR), sqlWorker);
            await instance.instantiate(bundle.mainModule, bundle.pthreadWorker);
            if (g !== generation)
                throw Error('Cancelled.');
            await instance.open({ query: { castBigIntToDouble: true }, maximumThreads: 1 });
            const c = await instance.connect();
            try {
                await c.query('SET enable_external_access = false');
            }
            finally {
                await c.close();
            }
            db = instance;
            return instance;
        }
        finally {
            URL.revokeObjectURL(blobURL);
        }
    })();
    try {
        return await timeout(sqlInit, 90000, () => { if (g === generation)
            cancelRuntime(); });
    }
    catch (e) {
        if (g === generation)
            cancelRuntime();
        throw e;
    }
}
function literal(v) { if (v === null || v === undefined)
    return 'NULL'; if (typeof v === 'number') {
    if (!Number.isFinite(v))
        throw Error('Non-finite SQL fixture number.');
    return String(v);
} if (typeof v === 'boolean')
    return v ? 'TRUE' : 'FALSE'; return "'" + String(v).replace(/'/g, "''") + "'"; }
const identifier = (v) => '"' + v.replace(/"/g, '""') + '"';
async function loadFixtures(conn, fixtures, overrides = {}) {
    for (const [name, t] of Object.entries(fixtures)) {
        const rows = overrides[name] ?? t.rows;
        if (!Array.isArray(rows) || rows.length > 1000)
            throw Error('Fixture row limit exceeded.');
        await conn.query(`DROP TABLE IF EXISTS ${identifier(name)}`);
        await conn.query(`CREATE TABLE ${identifier(name)} (${t.columns.map(c => `${identifier(c.name)} ${['INTEGER', 'REAL', 'TEXT', 'VARCHAR', 'DOUBLE', 'BOOLEAN'].includes(c.type) ? c.type : 'VARCHAR'}`).join(', ')})`);
        if (rows.length)
            await conn.query(`INSERT INTO ${identifier(name)} VALUES ${rows.map(r => '(' + t.columns.map(c => literal(r[c.name])).join(',') + ')').join(',')}`);
    }
}
async function queryPreview(conn, sql) { const t = await conn.query(`SELECT * FROM (${sql}) AS __studio_preview LIMIT 201`); const columns = t.schema.fields.map((f) => f.name); const all = t.toArray().map((row) => columns.map((c) => normalize(row[c]))); return { columns, rows: all.slice(0, 200), truncated: all.length > 200 }; }
export async function executeSQL(q, code, fixtures, progress) {
    const sql = validateSQL(code), start = performance.now(), g = generation, instance = await sqlDatabase(progress);
    return timeout((async () => { if (g !== generation)
        throw Error('Cancelled.'); progress('Executing your query against deterministic fixture tables.'); const conn = await instance.connect(); try {
        await loadFixtures(conn, fixtures);
        const preview = await queryPreview(conn, sql), checks = [];
        for (const test of q.fixture?.sqlTests ?? []) {
            if (g !== generation)
                throw Error('Cancelled.');
            await loadFixtures(conn, fixtures, test.overrides ?? {});
            const actual = await queryPreview(conn, sql);
            checks.push({ label: test.label, passed: JSON.stringify(actual.columns) === JSON.stringify(test.columns) && !actual.truncated && compareRows(actual.rows, test.rows, q.ordered !== false), detail: `Compared column names, ${test.rows.length} expected rows${q.ordered !== false ? ' and order' : ''}.` });
        }
        return { engine: 'DuckDB-Wasm ' + RUNTIME_VERSIONS.duckdb, mode: 'execute', ...preview, elapsedMs: performance.now() - start, checks, notice: 'Real browser SQL. Read-only in-memory fixtures; 200 displayed rows. Checks are public learning tests, not a hidden judge.' };
    }
    finally {
        await conn.close();
    } })(), 10000, () => { if (g === generation)
        cancelRuntime(); });
}
export async function executePython(q, code, progress) {
    if (code.length > 100000)
        throw Error('Python code limit exceeded.');
    pythonWorker?.terminate();
    pythonWorker = new Worker(new URL('../workers/python.js', import.meta.url));
    const worker = pythonWorker, start = performance.now();
    let executionTimer;
    const work = new Promise((resolve, reject) => {
        pendingCancel = () => reject(Error('Execution cancelled; worker terminated.'));
        worker.onerror = () => reject(Error('The Python worker could not start. Check network/runtime policy.'));
        worker.onmessage = (event) => { const m = event.data; if (m.type === 'progress') {
            progress(m.message);
            if (m.phase === 'executing')
                executionTimer = setTimeout(() => { worker.terminate(); reject(Error('Python exceeded the 10-second execution limit. Worker reset; draft preserved.')); }, 10000);
            return;
        } if (m.type === 'error')
            reject(Error(m.error));
        else if (m.type === 'result')
            resolve({ ...m.result, engine: 'CPython / Pyodide ' + RUNTIME_VERSIONS.pyodide, mode: 'execute', elapsedMs: performance.now() - start }); };
        worker.postMessage({ code, tests: q.pythonTests ?? [], entrypoint: q.entrypoint ?? 'solve', packages: q.fixture?.packages ?? [], version: RUNTIME_VERSIONS.pyodide });
    });
    try {
        return await timeout(work, 90000, () => worker.terminate());
    }
    finally {
        clearTimeout(executionTimer);
        worker.terminate();
        if (worker === pythonWorker) {
            pythonWorker = null;
            pendingCancel = null;
        }
    }
}
