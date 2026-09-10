export const WORKSPACES = { code: { title: 'Code Lab', short: 'Code', subtitle: 'SQL, Python & PySpark', icon: 'code' }, model: { title: 'Model / BI Lab', short: 'Model', subtitle: 'Grain, filters & measures', icon: 'model' }, pipeline: { title: 'Pipeline Lab', short: 'Pipeline', subtitle: 'DAGs, quality & orchestration', icon: 'pipeline' }, architecture: { title: 'Systems / Cloud Lab', short: 'Systems', subtitle: 'Performance, infrastructure & Git', icon: 'architecture' } };
export const RENDERERS = ['sql-editor', 'code-editor', 'pyspark-editor', 'semantic-model', 'dag-editor', 'pipeline-investigation', 'architecture-editor', 'performance-investigation', 'config-editor', 'terminal', 'git-visual', 'multi-choice-reasoning', 'concept-case'];
export const MODES = ['execute', 'analyze', 'simulate', 'review', 'external'];
export const clone = (v) => JSON.parse(JSON.stringify(v));
export const safeId = (s) => typeof s === 'string' && /^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(s) && !['prototype', ...Object.getOwnPropertyNames(Object.prototype)].includes(s);
export const escapeHTML = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const STORAGE_KEY = 'data-practice-studio.v1'; // Keep the v1 key and schema: reversible, additive migration.
export const emptyStore = () => ({ schemaVersion: 1, drafts: {}, customPacks: [], settings: { focus: false } });
function assert(c, m) { if (!c)
    throw Error(m); }
function strings(v, max = 100) { return Array.isArray(v) && v.length <= max && v.every(s => typeof s === 'string' && s.length <= 30000); }
export function safeHTTPS(value) { try {
    const u = new URL(String(value));
    return u.protocol === 'https:' && !u.username && !u.password ? u.href : null;
}
catch {
    return null;
} }
export function safeDeepnoteURL(value, embed = false) { const str = safeHTTPS(value); if (!str)
    return null; const u = new URL(str); if (!['deepnote.com', 'www.deepnote.com'].includes(u.hostname) || u.port)
    return null; if (embed && !/^\/(embed|app)\//.test(u.pathname))
    return null; if (!embed && !/^\/(workspace|project|app|embed)\//.test(u.pathname))
    return null; return u.href; }
export function validDeepnoteLinks(q, map = {}) { return [...(q.deepnoteLinks ?? []), ...(map[q.id] ?? [])].filter(l => l && ['exercise', 'concept', 'mock', 'reference', 'project'].includes(l.type) && safeDeepnoteURL(l.url)).filter((v, i, a) => a.findIndex(x => x.url === v.url) === i); }
export function normalizeQuestion(q) {
    const n = clone(q);
    n.technology ??= n.topic;
    n.followUps ??= [];
    n.interviewPriority ??= 'high';
    if (!n.renderer) {
        n.renderer = n.engine === 'sql' ? 'sql-editor' : n.engine === 'python' ? 'code-editor' : /pyspark/i.test(n.topic) ? 'pyspark-editor' : n.workspace === 'model' ? 'semantic-model' : n.workspace === 'pipeline' ? (n.template === 'dbt' ? 'pipeline-investigation' : 'dag-editor') : n.workspace === 'architecture' ? (n.template === 'spark' ? 'performance-investigation' : 'architecture-editor') : 'concept-case';
    }
    n.executionMode ??= n.engine === 'sql' || n.engine === 'python' ? 'execute' : n.engine === 'dax-subset' || n.engine === 'graph' ? 'simulate' : 'review';
    // Spark, vendor dialects and infrastructure cannot acquire a real execution badge through imported metadata.
    if (n.renderer === 'pyspark-editor')
        n.executionMode = 'review';
    if (['git-visual', 'terminal', 'dag-editor'].includes(n.renderer))
        n.executionMode = 'simulate';
    if (n.renderer === 'config-editor')
        n.executionMode = 'analyze';
    if (['performance-investigation', 'pipeline-investigation', 'architecture-editor', 'concept-case', 'multi-choice-reasoning'].includes(n.renderer))
        n.executionMode = 'review';
    if (n.renderer === 'semantic-model')
        n.executionMode = 'simulate';
    if (n.renderer === 'code-editor' && n.engine !== 'python')
        n.executionMode = 'review';
    if (n.renderer === 'sql-editor' && n.engine !== 'sql')
        n.executionMode = 'review';
    return n;
}
export function validatePack(input) {
    assert(input && typeof input === 'object', 'The content pack must be an object.');
    const p = input;
    assert([1, 2].includes(p.schemaVersion), 'Unsupported content schema.');
    assert(safeId(p.id), 'Invalid pack identifier.');
    assert(typeof p.title === 'string' && p.title.length > 0 && p.title.length < 200, 'Pack title required.');
    assert(Number.isInteger(p.version) && p.version > 0, 'Positive pack version required.');
    assert(Array.isArray(p.questions) && p.questions.length > 0 && p.questions.length <= 500, 'A pack needs 1-500 questions.');
    const ids = new Set();
    for (const q of p.questions) {
        assert(q && typeof q === 'object' && safeId(q.id) && !ids.has(q.id), 'Duplicate or invalid question ID.');
        ids.add(q.id);
        for (const k of ['title', 'topic', 'language', 'summary', 'task', 'starter', 'solution', 'explanation'])
            assert(typeof q[k] === 'string' && q[k].length <= 100000, `Invalid ${k}: ${q.id}`);
        assert(Object.hasOwn(WORKSPACES, q.workspace), 'Unknown workspace.');
        assert(['sql', 'python', 'dax-subset', 'graph', 'review'].includes(q.engine), 'Unknown engine.');
        assert(['Easy', 'Medium', 'Hard'].includes(q.difficulty), 'Unknown difficulty.');
        assert(Number.isInteger(q.version) && q.version > 0, 'Positive question version required.');
        assert(Number.isFinite(q.minutes) && q.minutes > 0 && q.minutes <= 240, 'Invalid duration.');
        for (const k of ['concept', 'requirements', 'hints'])
            assert(strings(q[k]), `Invalid ${k}.`);
        assert(q.rubric === undefined || strings(q.rubric), 'Invalid rubric.');
        assert(Array.isArray(q.sources) && q.sources.length <= 20, 'Invalid sources.');
        for (const s of q.sources)
            assert(s && typeof s.label === 'string' && safeHTTPS(s.url), 'Invalid HTTPS source.');
        if (q.renderer)
            assert(RENDERERS.includes(q.renderer), 'Unknown renderer.');
        if (q.executionMode)
            assert(MODES.includes(q.executionMode), 'Unknown execution mode.');
        if (q.deepnoteLinks)
            assert(Array.isArray(q.deepnoteLinks) && q.deepnoteLinks.length <= 15 && q.deepnoteLinks.every(l => l && typeof l.url === 'string' && typeof l.label === 'string'), 'Invalid Deepnote links.');
        if (q.deepnoteEmbedUrl)
            assert(safeDeepnoteURL(q.deepnoteEmbedUrl, true), 'Unsafe Deepnote embed.');
        if (q.fixture) {
            assert(JSON.stringify(q.fixture).length < 300000, 'Fixture too large.');
            if (q.fixture.graph)
                validateGraph(q.fixture.graph);
        }
        if (q.pythonTests)
            assert(Array.isArray(q.pythonTests) && q.pythonTests.length <= 30 && q.pythonTests.every(t => Array.isArray(t.args) && typeof t.label === 'string' && Object.hasOwn(t, 'expected')), 'Invalid Python tests.');
    }
    return clone(p);
}
export function planPackImport(existing, incoming, builtins) {
    const p = validatePack(incoming);
    assert(!builtins.some(b => b.id === p.id), 'Built-in pack IDs are protected.');
    const occupied = new Set([...builtins, ...existing.filter(e => e.id !== p.id)].flatMap(x => x.questions.map(q => q.id)));
    assert(!p.questions.some(q => occupied.has(q.id)), 'A question ID belongs to another pack. No changes made.');
    const old = existing.find(x => x.id === p.id);
    if (old) {
        assert(p.version > old.version, 'An update needs a higher pack version.');
        for (const previous of old.questions) {
            const next = p.questions.find(q => q.id === previous.id);
            assert(next, `Update would remove ${previous.id}. Removals are not implicit.`);
            assert(next.version >= previous.version, 'Question version cannot decrease.');
            assert(JSON.stringify(next) === JSON.stringify(previous) || next.version > previous.version, `Changed question ${previous.id} needs a higher version.`);
        }
    }
    return { packs: [...existing.filter(x => x.id !== p.id), p], summary: `${old ? 'Update' : 'Add'} ${p.title}: ${p.questions.length} exercises. Drafts stay attached to stable IDs.` };
}
export function validateGraph(value) { assert(value && typeof value === 'object', 'Invalid graph.'); const g = value; assert(Array.isArray(g.nodes) && g.nodes.length <= 40 && Array.isArray(g.edges) && g.edges.length <= 100, 'Graph limit: 40 nodes / 100 edges.'); const ids = new Set(); for (const n of g.nodes) {
    assert(n && safeId(n.id) && !ids.has(n.id), 'Invalid node ID.');
    ids.add(n.id);
    assert(typeof n.label === 'string' && n.label.length < 120 && typeof n.role === 'string', 'Invalid node.');
    assert(Number.isFinite(n.x) && Number.isFinite(n.y) && n.x >= 0 && n.y >= 0 && n.x <= 4000 && n.y <= 4000, 'Invalid position.');
    if (n.fields)
        assert(strings(n.fields, 30), 'Invalid fields.');
    if (n.retries !== undefined)
        assert(Number.isInteger(n.retries) && n.retries >= 0 && n.retries <= 3, 'Retries: 0-3.');
} const edges = new Set(); for (const e of g.edges) {
    assert(e && safeId(e.id) && !edges.has(e.id) && ids.has(e.from) && ids.has(e.to) && e.from !== e.to, 'Invalid edge.');
    edges.add(e.id);
} return clone(g); }
export function validateStore(value) {
    assert(value && typeof value === 'object', 'Invalid backup.');
    const s = value;
    assert(s.schemaVersion === 1, 'Unsupported backup schema.');
    assert(s.drafts && typeof s.drafts === 'object' && !Array.isArray(s.drafts) && Object.keys(s.drafts).length <= 5000, 'Invalid drafts.');
    for (const [id, d] of Object.entries(s.drafts)) {
        assert(safeId(id) && d && typeof d === 'object', 'Invalid draft.');
        for (const k of ['code', 'notes', 'diagram', 'mermaid', 'diagnosis', 'answer'])
            assert(d[k] === undefined || typeof d[k] === 'string' && d[k].length <= 100000, 'Draft text exceeds limit.');
        if (d.graph)
            validateGraph(d.graph);
        assert(d.bookmark === undefined || typeof d.bookmark === 'boolean', 'Invalid bookmark.');
        assert(d.confidence === undefined || ['New', 'Learning', 'Review', 'Confident'].includes(d.confidence), 'Invalid confidence.');
        if (d.updatedAt)
            assert(Number.isFinite(Date.parse(d.updatedAt)), 'Invalid timestamp.');
        if (d.attempts)
            assert(Array.isArray(d.attempts) && d.attempts.length <= 1000 && d.attempts.every(a => a && typeof a.at === 'string' && Number.isFinite(Date.parse(a.at)) && typeof a.kind === 'string' && typeof a.summary === 'string' && [true, false, null].includes(a.passed)), 'Invalid attempts.');
        if (d.labState)
            assert(JSON.stringify(d.labState).length <= 1000000, 'Lab state too large.');
    }
    assert(Array.isArray(s.customPacks) && s.customPacks.length <= 50, 'Invalid packs.');
    s.customPacks.forEach(validatePack);
    assert(s.settings && typeof s.settings === 'object' && typeof s.settings.focus === 'boolean', 'Invalid settings.');
    return clone(s);
}
export function migrateStore(s) { const v = validateStore(s); v.v2 ??= { version: 2, migratedAt: new Date().toISOString() }; return v; }
export function loadStore(storage = localStorage) { const text = storage.getItem(STORAGE_KEY); return migrateStore(text ? JSON.parse(text) : emptyStore()); }
export function saveStore(s, storage = localStorage) { storage.setItem(STORAGE_KEY, JSON.stringify(s)); }
export function markDraft(s, id, patch) { s.drafts[id] = { ...s.drafts[id], ...patch, updatedAt: new Date().toISOString() }; }
export function mergeStores(current, incoming, builtins) { const other = validateStore(incoming), result = clone(current); for (const p of other.customPacks) {
    const previous = result.customPacks.find(x => x.id === p.id);
    if (previous && JSON.stringify(previous) === JSON.stringify(p))
        continue;
    result.customPacks = planPackImport(result.customPacks, p, builtins).packs;
} for (const [id, d] of Object.entries(other.drafts)) {
    const old = result.drafts[id];
    if (!old || Date.parse(d.updatedAt ?? '1970-01-01') > Date.parse(old.updatedAt ?? '1970-01-01'))
        result.drafts[id] = clone(d);
} return migrateStore(result); }
export function formatNumber(v) { return v === null || v === undefined ? 'BLANK' : typeof v === 'number' ? new Intl.NumberFormat('en', { maximumFractionDigits: 4 }).format(v) : String(v); }
export function newId(prefix = 'node') { const b = new Uint8Array(10); crypto.getRandomValues(b); return prefix + '-' + Array.from(b, x => x.toString(16).padStart(2, '0')).join(''); }
export function questionMode(q) { return q.executionMode === 'execute' ? (q.engine === 'sql' ? 'REAL EXECUTION - DuckDB-Wasm' : 'REAL EXECUTION - Pyodide') : q.renderer === 'terminal' ? 'VIRTUAL TERMINAL' : q.renderer === 'git-visual' ? 'SIMULATION - Git state' : q.executionMode === 'simulate' ? 'SIMULATION' : q.executionMode === 'analyze' ? 'ANALYZE - fixture checks' : 'REVIEW - no vendor engine'; }
export function clampLayout(split, height) { return { split: Math.max(28, Math.min(62, Number(split) || 42)), drawerHeight: Math.max(120, Math.min(520, Number(height) || 238)) }; }
