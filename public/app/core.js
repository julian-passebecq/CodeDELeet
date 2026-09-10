export const WORKSPACES = {
    code: { title: 'Code lab', short: 'Code', subtitle: 'SQL, Python & everyday engineering', icon: 'code' },
    model: { title: 'BI & data modeling', short: 'Model', subtitle: 'Models, relationships & business measures', icon: 'model' },
    pipeline: { title: 'Pipeline lab', short: 'Orchestrate', subtitle: 'Dependencies, quality gates & retries', icon: 'pipeline' },
    architecture: { title: 'Architecture studio', short: 'Design', subtitle: 'Cloud systems, infrastructure & tradeoffs', icon: 'architecture' },
};
export const clone = (value) => JSON.parse(JSON.stringify(value));
export const safeId = (s) => typeof s === 'string' && /^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(s) && !['prototype', ...Object.getOwnPropertyNames(Object.prototype)].includes(s);
export const escapeHTML = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const emptyStore = () => ({ schemaVersion: 1, drafts: {}, customPacks: [], settings: { focus: false } });
const requiredStrings = ['id', 'title', 'topic', 'language', 'summary', 'task', 'starter', 'solution', 'explanation'];
function assert(cond, message) { if (!cond)
    throw new Error(message); }
function stringArray(value, max = 100) { return Array.isArray(value) && value.length <= max && value.every(s => typeof s === 'string' && s.length <= 15000); }
export function validatePack(input) {
    assert(input && typeof input === 'object', 'The content pack must be an object.');
    const p = input;
    assert(p.schemaVersion === 1, 'Unsupported pack schemaVersion. Expected 1.');
    assert(safeId(p.id), 'Pack ID must be a safe, stable identifier.');
    assert(typeof p.title === 'string' && p.title.length > 0 && p.title.length < 200, 'A pack title is required.');
    assert(Number.isInteger(p.version) && p.version > 0, 'Pack version must be a positive integer.');
    assert(Array.isArray(p.questions) && p.questions.length > 0 && p.questions.length <= 500, 'A pack needs 1 to 500 questions.');
    const ids = new Set();
    for (const q of p.questions) {
        assert(q && typeof q === 'object', 'Each question must be an object.');
        assert(safeId(q.id) && !ids.has(q.id), 'Question IDs must be safe and unique.');
        ids.add(q.id);
        for (const key of requiredStrings)
            assert(typeof q[key] === 'string' && String(q[key]).length <= 30000, `Invalid ${key} in ${q.id}.`);
        assert(q.workspace in WORKSPACES && Object.hasOwn(WORKSPACES, q.workspace), `Unknown workspace for ${q.id}.`);
        assert(['sql', 'python', 'dax-subset', 'graph', 'review'].includes(q.engine), `Unknown engine for ${q.id}.`);
        assert(['Easy', 'Medium', 'Hard'].includes(q.difficulty), 'Unknown difficulty.');
        assert(Number.isInteger(q.version) && q.version > 0, 'Question version must be positive.');
        assert(Number.isFinite(q.minutes) && q.minutes > 0 && q.minutes <= 240, 'Invalid practice duration.');
        for (const k of ['concept', 'requirements', 'hints'])
            assert(stringArray(q[k]), 'Concepts, requirements and hints must be string arrays.');
        assert(q.rubric === undefined || stringArray(q.rubric), 'Invalid rubric.');
        assert(Array.isArray(q.sources) && q.sources.length <= 20, 'Invalid source list.');
        for (const s of q.sources) {
            assert(typeof s.label === 'string' && s.label.length < 300, 'Invalid source label.');
            assert(typeof s.url === 'string' && s.url.length < 2000 && /^https:\/\//.test(s.url), 'Sources must use HTTPS.');
            new URL(s.url);
        }
        for (const k of ['template', 'dataset', 'expectedGrain', 'entrypoint'])
            assert(q[k] === undefined || typeof q[k] === 'string', `Invalid ${k}.`);
        assert(q.ordered === undefined || typeof q.ordered === 'boolean', 'ordered must be boolean.');
        if (q.pythonTests !== undefined) {
            assert(Array.isArray(q.pythonTests) && q.pythonTests.length <= 30, 'Invalid Python tests.');
            for (const t of q.pythonTests)
                assert(Array.isArray(t.args) && typeof t.label === 'string' && Object.hasOwn(t, 'expected'), 'Invalid Python test case.');
        }
    }
    return clone(p);
}
export function planPackImport(existing, incoming, builtins) {
    const p = validatePack(incoming);
    assert(!builtins.some(b => b.id === p.id), 'Built-in pack IDs are protected. Use your own pack ID.');
    const owners = [...builtins, ...existing.filter(e => e.id !== p.id)];
    const occupied = new Set(owners.flatMap(x => x.questions.map(q => q.id)));
    assert(!p.questions.some(q => occupied.has(q.id)), 'A question ID belongs to another pack. No changes were made.');
    const old = existing.find(x => x.id === p.id);
    if (old) {
        assert(p.version > old.version, 'An update needs a higher pack version.');
        for (const previous of old.questions) {
            const next = p.questions.find(q => q.id === previous.id);
            assert(next, `Update would remove ${previous.id}. Removals are not implicit; keep the question or use a new pack.`);
            assert(next.version >= previous.version, `Question version cannot decrease: ${previous.id}.`);
            assert(JSON.stringify(next) === JSON.stringify(previous) || next.version > previous.version, `Changed question ${previous.id} needs a higher question version.`);
        }
    }
    return { packs: [...existing.filter(x => x.id !== p.id), p], summary: `${old ? 'Update' : 'Add'} ${p.title}: ${p.questions.length} questions. Existing drafts stay attached to stable IDs.` };
}
export function validateGraph(g) {
    assert(g && typeof g === 'object', 'Invalid graph.');
    const graph = g;
    assert(Array.isArray(graph.nodes) && graph.nodes.length <= 40 && Array.isArray(graph.edges) && graph.edges.length <= 100, 'Graph exceeds the teaching limits (40 nodes / 100 edges).');
    const ids = new Set();
    for (const n of graph.nodes) {
        assert(safeId(n.id) && !ids.has(n.id), 'Duplicate or unsafe node ID.');
        ids.add(n.id);
        assert(typeof n.label === 'string' && n.label.length < 120 && typeof n.role === 'string' && n.role.length < 100, 'Invalid node label or role.');
        assert(Number.isFinite(n.x) && Number.isFinite(n.y) && n.x >= 0 && n.y >= 0 && n.x <= 4000 && n.y <= 4000, 'Invalid node position.');
        assert(n.fields === undefined || stringArray(n.fields, 30), 'Invalid fields.');
        assert(n.duration === undefined || (Number.isFinite(n.duration) && n.duration >= 1 && n.duration <= 1000), 'Invalid simulated duration.');
        assert(n.retries === undefined || (Number.isInteger(n.retries) && n.retries >= 0 && n.retries <= 3), 'Invalid retries.');
        assert(n.transient === undefined || typeof n.transient === 'boolean', 'Invalid failure setting.');
    }
    const edges = new Set();
    for (const e of graph.edges) {
        assert(safeId(e.id) && !edges.has(e.id), 'Duplicate or unsafe edge ID.');
        edges.add(e.id);
        assert(ids.has(e.from) && ids.has(e.to) && e.from !== e.to, 'An edge needs two distinct existing nodes.');
        assert(e.active === undefined || typeof e.active === 'boolean', 'Invalid edge state.');
        assert(e.label === undefined || typeof e.label === 'string' && e.label.length < 100, 'Invalid edge label.');
    }
    return clone(graph);
}
export function validateStore(value) {
    assert(value && typeof value === 'object', 'Invalid backup.');
    const s = value;
    assert(s.schemaVersion === 1, 'Unsupported backup schema.');
    assert(s.drafts && typeof s.drafts === 'object' && !Array.isArray(s.drafts), 'Invalid drafts.');
    assert(Object.keys(s.drafts).length <= 5000, 'Too many drafts.');
    for (const [id, d] of Object.entries(s.drafts)) {
        assert(safeId(id) && d && typeof d === 'object', 'Invalid draft identifier.');
        for (const k of ['code', 'notes', 'diagram'])
            assert(d[k] === undefined || typeof d[k] === 'string' && d[k].length <= 100000, 'Draft text is too large.');
        if (d.graph)
            validateGraph(d.graph);
        assert(d.bookmark === undefined || typeof d.bookmark === 'boolean', 'Invalid bookmark.');
        assert(d.confidence === undefined || ['New', 'Learning', 'Review', 'Confident'].includes(d.confidence), 'Invalid confidence.');
        assert(d.rubric === undefined || stringArray(d.rubric), 'Invalid draft rubric.');
        assert(d.updatedAt === undefined || typeof d.updatedAt === 'string' && Number.isFinite(Date.parse(d.updatedAt)), 'Invalid timestamp.');
        for (const k of ['country', 'category', 'grain', 'selectedTable'])
            assert(d[k] === undefined || typeof d[k] === 'string', 'Invalid selection.');
        if (d.attempts !== undefined) {
            assert(Array.isArray(d.attempts) && d.attempts.length <= 1000, 'Too many attempts.');
            for (const a of d.attempts)
                assert(typeof a.at === 'string' && Number.isFinite(Date.parse(a.at)) && typeof a.kind === 'string' && typeof a.summary === 'string' && [true, false, null].includes(a.passed), 'Invalid attempt.');
        }
        if (d.performance)
            assert(Number.isFinite(d.performance.partitions) && d.performance.partitions >= 2 && d.performance.partitions <= 12 && Number.isFinite(d.performance.skew) && d.performance.skew >= 0 && d.performance.skew <= 80 && typeof d.performance.broadcast === 'boolean', 'Invalid performance settings.');
    }
    assert(Array.isArray(s.customPacks) && s.customPacks.length <= 50, 'Invalid custom packs.');
    s.customPacks.forEach(validatePack);
    assert(s.settings && typeof s.settings === 'object' && typeof s.settings.focus === 'boolean', 'Invalid settings.');
    assert(s.settings.lastQuestion === undefined || safeId(s.settings.lastQuestion), 'Invalid last question.');
    assert(s.settings.pyodideConsent === undefined || typeof s.settings.pyodideConsent === 'boolean', 'Invalid Python setting.');
    return clone(s);
}
export function mergeStores(current, incoming, builtins) {
    const other = validateStore(incoming), result = clone(current);
    for (const p of other.customPacks) {
        const previous = result.customPacks.find(x => x.id === p.id);
        if (previous && JSON.stringify(previous) === JSON.stringify(p))
            continue;
        result.customPacks = planPackImport(result.customPacks, p, builtins).packs;
    }
    for (const [id, d] of Object.entries(other.drafts)) {
        const old = result.drafts[id];
        if (!old || (Date.parse(d.updatedAt ?? '1970-01-01') > Date.parse(old.updatedAt ?? '1970-01-01')))
            result.drafts[id] = clone(d);
    }
    return result; // Keep this device's settings and explicit runtime consent.
}
export const STORAGE_KEY = 'data-practice-studio.v1';
export function loadStore(storage = localStorage) {
    const text = storage.getItem(STORAGE_KEY);
    return text ? validateStore(JSON.parse(text)) : emptyStore();
}
export function saveStore(s, storage = localStorage) { storage.setItem(STORAGE_KEY, JSON.stringify(s)); }
export function markDraft(store, id, patch) {
    store.drafts[id] = { ...store.drafts[id], ...patch, updatedAt: new Date().toISOString() };
}
export function questionMode(q) { return ({ sql: 'Real SQL adapter', python: 'Optional browser Python', 'dax-subset': 'DAX teaching subset', graph: 'Structure checks', review: 'Guided review' })[q.engine]; }
export function formatNumber(v) { return v === null || v === undefined ? 'BLANK' : typeof v === 'number' ? new Intl.NumberFormat('en', { maximumFractionDigits: 4 }).format(v) : String(v); }
/** Stable editor IDs; getRandomValues also works in file/embedded contexts. */
export function newId(prefix = 'node') { const bytes = new Uint8Array(16); crypto.getRandomValues(bytes); return prefix + '-' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(''); }
