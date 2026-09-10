import { emptyStore, loadStore, saveStore, markDraft, validatePack, planPackImport, mergeStores, validateStore, clone, WORKSPACES, escapeHTML as e, STORAGE_KEY, newId } from './core.js';
import { graphTemplate, graphSVG, topologicalLayers, simulateDAG, graphChecks, parseDiagram, toDiagram, toMermaid, autoLayout } from './graph.js';
import { evaluateDax } from './dax.js';
import { serverHealth, runSQL, runPython } from './runtime.js';
import * as UI from './ui.js';
const app = document.getElementById('app'), modal = document.getElementById('modal');
let store = emptyStore(), builtins = [], questions = [], fixtures = {}, engine = 'Detecting SQL adapter...', sqlAvailable = false;
let query = '', difficulty = '', toastTimer, pendingImport = null;
let storageFailed = false, storageReadBlocked = false, bootWarning = '';
const tabs = new Map(), designTabs = new Map(), selection = new Map(), results = new Map(), runs = new Map(), busy = new Set(), statuses = new Map();
let lessonModal = false;
function route() { const [path, params] = (location.hash.replace(/^#\/?/, '') || 'home').split('?'); const [page, id = ''] = path.split('/'); return { page, id, workspace: new URLSearchParams(params).get('workspace') ?? '' }; }
const current = () => questions.find(q => q.id === route().id);
const draft = (q) => store.drafts[q.id] ?? {};
const graph = (q) => clone(draft(q).graph ?? graphTemplate(q.template));
function toast(text, error = false) { const el = document.getElementById('toast'); el.textContent = text; el.className = `show ${error ? 'toast-error' : ''}`; clearTimeout(toastTimer); toastTimer = setTimeout(() => el.className = '', 5500); }
function persist() { if (storageReadBlocked) {
    storageFailed = true;
    return false;
} try {
    saveStore(store);
    storageFailed = false;
    return true;
}
catch {
    storageFailed = true;
    toast('Browser storage is unavailable or full. Keep this tab open and export your backup now.', true);
    return false;
} }
function patch(q, part) { markDraft(store, q.id, part); persist(); }
function setGraph(q, g) { patch(q, { graph: g }); runs.delete(q.id); results.delete(q.id); }
function go(path) { const next = `#/${path}`; if (location.hash === next)
    render();
else
    location.hash = next; }
function record(q, kind, passed, summary) { const d = draft(q); patch(q, { attempts: [...(d.attempts ?? []), { at: new Date().toISOString(), kind, passed, summary }].slice(-1000), confidence: d.confidence ?? 'Learning' }); }
function saveDownload(name, text, mime = 'application/json') { const url = URL.createObjectURL(new Blob([text], { type: mime })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1500); }
function exportBackup() { saveDownload(`data-practice-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(store, null, 2)); toast('Backup exported. It includes drafts, graphs, notes and custom packs.'); }
function showModal(title, body) { modal.innerHTML = `<div class="modal-heading"><h2>${e(title)}</h2>${UI.button('close-modal', '', 'close', 'icon-button', 'aria-label="Close dialog"')}</div><div class="modal-body">${body}</div>`; if (!modal.open)
    modal.showModal(); }
function showLesson(q, tab) { lessonModal = true; if (tab)
    tabs.set(q.id, tab); showModal(q.title, UI.lesson(q, tabs.get(q.id) ?? 'Task')); }
function showChecks(q, checks, kind) {
    results.set(q.id, { engine: kind, columns: [], rows: [], elapsedMs: 0, checks });
    record(q, kind, checks.every(c => c.passed), `${checks.filter(c => c.passed).length}/${checks.length} limited checks passed.`);
    render();
}
function clearEvaluation(q) {
    results.delete(q.id);
    if (current()?.id !== q.id)
        return;
    const output = document.querySelector('.result-card');
    if (output && !busy.has(q.id))
        output.innerHTML = UI.results();
    document.querySelector('.inline-result')?.remove();
    const kpi = document.querySelector('.kpi-user strong');
    if (kpi)
        kpi.textContent = '\u2014';
}
function render() {
    const r = route(), q = current();
    let label = 'Overview', body = '';
    if (r.page === 'practice' && q) {
        label = WORKSPACES[q.workspace].title;
        const d = draft(q);
        const header = UI.practiceHeader(q, d, questions), g = graph(q), sel = selection.get(q.id) ?? g.nodes[0]?.id ?? '';
        let workspace = '';
        if (q.workspace === 'code')
            workspace = UI.codeWorkspace(q, d, tabs.get(q.id) ?? 'Task', results.get(q.id), busy.has(q.id), statuses.get(q.id) ?? '', engine, fixtures);
        if (q.workspace === 'model')
            workspace = UI.modelWorkspace(q, d, g, sel, fixtures, results.get(q.id));
        if (q.workspace === 'pipeline')
            workspace = UI.pipelineWorkspace(q, d, g, sel, runs.get(q.id), results.get(q.id));
        if (q.workspace === 'architecture')
            workspace = UI.architectureWorkspace(q, d, g, sel, results.get(q.id), designTabs.get(q.id) ?? 'diagram');
        body = `<section class="practice-page workspace-${q.workspace}">${header}${workspace}</section>`;
    }
    else if (r.page === 'library' || r.page === 'review') {
        label = r.page === 'review' ? 'Review queue' : WORKSPACES[r.workspace]?.title ?? 'Exercise library';
        body = UI.library(questions, store, r.workspace, query, difficulty, r.page === 'review');
    }
    else if (r.page === 'settings') {
        label = 'Packs & settings';
        body = UI.settings(store, engine, sqlAvailable, builtins.flatMap(p => p.questions).length);
    }
    else if (r.page === 'practice') {
        body = '<div class="empty-state"><h1>Exercise not found</h1><p>The stable ID is not installed in this library. Import its content pack or return to the exercise library.</p><a href="#/library" class="button primary">Open library</a></div>';
    }
    else
        body = UI.home(questions, store);
    app.innerHTML = `<div class="app-shell ${store.settings.focus ? 'focus-mode' : ''}">${UI.sidebar(r.page === 'practice' && q ? `library?workspace=${q.workspace}` : `${r.page}${r.workspace ? '?workspace=' + r.workspace : ''}`, store)}<div class="main-column">${UI.topbar(label, store.settings.focus, query)}<main id="main" tabindex="-1">${storageFailed ? UI.note(storageReadBlocked ? 'Saved data could not be read. Original browser storage is protected from overwriting; current work stays in memory. Export both backups in Settings before recovery.' : 'Saving is unavailable. Export a backup before closing this tab.', 'warning') : ''}${body}</main></div></div>`;
    if (storageFailed) {
        const indicator = document.querySelector('.save-indicator');
        if (indicator)
            indicator.textContent = 'Not saved: export a backup';
    }
    if (storageReadBlocked && r.page === 'settings') {
        const card = document.createElement('section');
        card.className = 'settings-card';
        card.innerHTML = '<h3>Protected storage recovery</h3><p>Download the unreadable original and your current in-memory progress before deliberately replacing storage.</p>' + UI.button('export-original', 'Download original storage', 'download', 'secondary') + UI.button('recover-storage', 'Review recovery', '', 'secondary');
        document.querySelector('.settings-page')?.prepend(card);
    }
    if (q && busy.has(q.id)) {
        const editor = document.querySelector('[data-field="code"]');
        if (editor)
            editor.readOnly = true;
    }
    const search = document.getElementById('search-form');
    search?.addEventListener('submit', event => { event.preventDefault(); query = document.getElementById('global-search').value.trim(); go('library'); });
}
function rebuildQuestions() { questions = [...builtins, ...store.customPacks].flatMap(p => p.questions); }
async function boot() {
    try {
        try {
            store = loadStore();
        }
        catch {
            bootWarning = 'Stored progress could not be read. It has not been overwritten. Export or inspect the original data before saving new work.';
            storageFailed = true;
            storageReadBlocked = true;
        }
        const [manifest, data] = await Promise.all([fetch('./packs/index.json').then(r => { if (!r.ok)
                throw new Error('Content-pack manifest is missing.'); return r.json(); }), fetch('./packs/fixtures.json').then(r => r.json())]);
        fixtures = data;
        if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.packs))
            throw new Error('Invalid pack manifest.');
        for (const path of manifest.packs) {
            if (typeof path !== 'string' || !/^\.\/packs\/[A-Za-z0-9._/-]+\.json$/.test(path) || path.includes('..'))
                throw new Error('Unsafe manifest path.');
            builtins.push(validatePack(await fetch(path).then(r => r.json())));
        }
        const packIds = new Set(), qids = new Set();
        for (const pack of builtins) {
            if (packIds.has(pack.id))
                throw new Error('Duplicate built-in pack ID.');
            packIds.add(pack.id);
            for (const q of pack.questions) {
                if (qids.has(q.id))
                    throw new Error('Duplicate question ID in repository packs.');
                qids.add(q.id);
            }
        }
        let accepted = [];
        for (const p of store.customPacks)
            accepted = planPackImport(accepted, p, builtins).packs;
        store.customPacks = accepted;
        rebuildQuestions();
        render();
        if (bootWarning)
            toast(bootWarning, true);
        const health = await serverHealth();
        engine = health.engine;
        sqlAvailable = health.available;
        render();
    }
    catch (error) {
        app.innerHTML = `<div class="boot-error"><h1>The studio could not start.</h1><p>${e(error instanceof Error ? error.message : String(error))}</p><p>Use START_WINDOWS.bat or run <code>python server/app.py</code> from the extracted repository. Do not open index.html directly.</p><p>Your local progress has not been cleared.</p></div>`;
    }
}
async function execute(q, mode, tests = false) {
    if (busy.has(q.id))
        return;
    if (mode === 'sql' && !sqlAvailable) {
        showModal('Enable real SQL locally', `<p>The static site has no SQL execution service. The learning UI still works.</p><p>Start the supplied launcher for a read-only local SQL adapter:</p><pre>python server/app.py</pre><p>It uses DuckDB when installed and otherwise clearly labeled SQLite. No cloud database is required.</p>`);
        return;
    }
    if (mode === 'python' && globalThis.__STUDIO_STANDALONE__) {
        showModal('Python in the local edition', `<p>This single-file edition supports study, graphs and DAX teaching previews without installation. Launch the full repository to enable optional browser Python, or export this code to your own notebook.</p><pre>python server/app.py --open</pre>`);
        return;
    }
    if (mode === 'python' && !store.settings.pyodideConsent) {
        showModal('Enable optional browser Python?', `<p>This downloads the pinned Pyodide runtime from jsDelivr. After loading, your basic Python solution runs inside a browser worker, not the local server.</p><p>Only run code you trust. A worker is not a security boundary for malicious network-aware code.</p>${UI.button('enable-and-run-python', 'Enable download & run', 'play', 'primary')}`);
        return;
    }
    busy.add(q.id);
    statuses.set(q.id, 'Running your solution...');
    render();
    try {
        const code = draft(q).code ?? q.starter;
        let result;
        if (mode === 'sql')
            result = await runSQL(code, q, tests);
        else if (mode === 'python')
            result = await runPython(q, code, status => { statuses.set(q.id, status); if (current()?.id === q.id)
                render(); });
        else {
            const start = performance.now();
            const d = draft(q), value = evaluateDax(code, fixtures, graph(q), { country: d.country ?? 'All', category: d.category ?? 'All' });
            result = { engine: 'DAX teaching subset (JavaScript, not Power BI)', columns: ['Measure', 'Value', 'Visible fixture rows'], rows: [[value.name, value.value, value.rowCount]], elapsedMs: Math.round(performance.now() - start) };
        }
        results.set(q.id, result);
        const passed = result.checks?.length ? result.checks.every(c => c.passed) : null;
        record(q, mode === 'dax' ? 'Teaching DAX preview' : result.engine, passed, result.checks?.length ? `${result.checks.filter(c => c.passed).length}/${result.checks.length} fixture checks passed.` : 'Output generated; not a correctness verdict.');
    }
    catch (error) {
        results.set(q.id, { engine: mode, columns: [], rows: [], elapsedMs: 0, error: error instanceof Error ? error.message : String(error) });
        record(q, `${mode} evaluation`, null, 'Evaluation unavailable or failed; no passing verdict.');
    }
    finally {
        busy.delete(q.id);
        statuses.delete(q.id);
        render();
    }
}
function selectedNode(q, g) { return g.nodes.find(n => n.id === (selection.get(q.id) ?? g.nodes[0]?.id)); }
function modelChecks(q) {
    const g = graph(q), d = draft(q), checks = [{ label: 'Fact grain is order line', passed: d.grain === 'order-line', detail: 'Sales.SaleKey identifies a line; OrderKey can repeat.' }];
    for (const [id, table, key] of [['customer', 'DimCustomer', 'CustomerKey'], ['product', 'DimProduct', 'ProductKey']]) {
        const vals = fixtures[table].rows.map(r => r[key]);
        checks.push({ label: `${table} keys are unique and non-null`, passed: !vals.includes(null) && new Set(vals).size === vals.length, detail: 'Uniqueness is checked on the visible teaching fixture.' });
        checks.push({ label: `${table} actively filters Sales`, passed: g.edges.some(e => e.from === id && e.to === 'sales' && e.active !== false), detail: 'This model uses one-way dimension-to-fact filtering.' });
        checks.push({ label: `Sales foreign keys exist in ${table}`, passed: fixtures.Sales.rows.every(r => vals.includes(r[key])), detail: 'A small fixture check, not a full data-quality engine.' });
    }
    showChecks(q, checks, 'Teaching model structure checks');
}
async function onAction(action, target) {
    const q = current();
    switch (action) {
        case 'skip-main':
            document.getElementById('main')?.focus();
            return;
        case 'back':
            history.back();
            return;
        case 'forward':
            history.forward();
            return;
        case 'focus':
            store.settings.focus = !store.settings.focus;
            persist();
            render();
            return;
        case 'export-backup':
            exportBackup();
            return;
        case 'export-original': {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw === null)
                throw new Error('No original storage value is accessible.');
            saveDownload('data-practice-original-storage.txt', raw, 'text/plain');
            return;
        }
        case 'recover-storage':
            showModal('Replace protected storage?', `<p>This deliberately replaces unreadable original browser storage with your current in-memory progress. First download the original and export a current backup. This cannot be undone without those files.</p>${UI.button('export-original', 'Download original', 'download', 'secondary')}${UI.button('export-backup', 'Export current backup', 'download', 'secondary')}${UI.button('confirm-recover-storage', 'Replace protected storage', 'check', 'primary')}`);
            return;
        case 'confirm-recover-storage':
            saveStore(store);
            storageReadBlocked = false;
            storageFailed = false;
            modal.close();
            render();
            toast('Current progress saved. Keep your recovery backups.');
            return;
        case 'close-modal':
            modal.close();
            lessonModal = false;
            pendingImport = null;
            return;
        case 'clear-search':
            query = '';
            render();
            return;
        case 'import-pack':
            document.getElementById('pack-file')?.click();
            return;
        case 'import-backup':
            document.getElementById('backup-file')?.click();
            return;
        case 'apply-import':
            pendingImport?.();
            pendingImport = null;
            modal.close();
            lessonModal = false;
            return;
        case 'download-example': {
            const example = await fetch('./packs/starter.json').then(r => r.json());
            const sample = clone(example.questions[0]);
            sample.id = 'my-first-question';
            sample.title = 'My first personal SQL question';
            saveDownload('my-practice-pack.json', JSON.stringify({ schemaVersion: 1, id: 'my-practice-pack', title: 'My personal questions', version: 1, questions: [sample] }, null, 2));
            return;
        }
        case 'python-consent':
            store.settings.pyodideConsent = !store.settings.pyodideConsent;
            persist();
            render();
            return;
        case 'show-about':
            showModal('A small platform with clear boundaries', `<h3>Four workspaces, one content schema</h3><p>TypeScript → browser modules. Versioned JSON packs → questions. Local storage → drafts and progress. SVG → editable diagrams. An optional local SQL adapter → DuckDB or SQLite.</p><h3>Keyboard shortcuts</h3><p><kbd>/</kbd> Search · <kbd>Ctrl+Enter</kbd> Run/check the current task · <kbd>Tab</kbd> Indent in the code editor · browser back/forward for navigation.</p><h3>Limits that matter</h3><p>No real Spark cluster, Power BI engine, .NET runner, dbt compiler, shell or Kubernetes deployment. A graph passing structure checks is not a production-ready design. No cloud resources, authentication or telemetry are created.</p>`);
            return;
    }
    if (!q)
        return;
    const d = draft(q), g = graph(q);
    switch (action) {
        case 'bookmark':
            patch(q, { bookmark: !d.bookmark });
            render();
            return;
        case 'lesson-tab':
            tabs.set(q.id, target.dataset.tab ?? 'Task');
            if (modal.open && lessonModal)
                showLesson(q);
            else
                render();
            return;
        case 'open-lesson':
            showLesson(q);
            return;
        case 'open-solution':
            showLesson(q, 'Solution');
            return;
        case 'use-solution':
            showModal('Replace your current draft?', `<p>Your current code will be replaced with the reference. Your notes, graph and attempt history stay unchanged.</p>${UI.button('confirm-use-solution', 'Replace code with reference', 'code', 'primary')}`);
            lessonModal = false;
            return;
        case 'confirm-use-solution':
            patch(q, { code: q.solution });
            clearEvaluation(q);
            modal.close();
            render();
            toast('Reference copied. This does not mark the exercise as solved.');
            return;
        case 'reset-code':
            showModal('Reset to the starter?', `<p>This replaces only the code editor for this exercise. Notes and progress are kept.</p>${UI.button('confirm-reset-code', 'Reset code', 'reset', 'primary')}`);
            lessonModal = false;
            return;
        case 'confirm-reset-code':
            patch(q, { code: q.starter });
            clearEvaluation(q);
            modal.close();
            render();
            return;
        case 'export-code':
            saveDownload(`${q.id}.${q.engine === 'sql' ? 'sql' : q.language.includes('Python') || q.language === 'PySpark' ? 'py' : q.language === 'DAX' ? 'dax' : q.language === 'C#' ? 'cs' : q.language === 'HCL' ? 'tf' : q.language === 'YAML' ? 'yaml' : 'txt'}`, d.code ?? q.starter, 'text/plain');
            return;
        case 'run-sql':
            await execute(q, 'sql', false);
            return;
        case 'test-sql':
            await execute(q, 'sql', true);
            return;
        case 'run-python':
            await execute(q, 'python');
            return;
        case 'enable-and-run-python':
            store.settings.pyodideConsent = true;
            persist();
            modal.close();
            await execute(q, 'python');
            return;
        case 'run-dax':
            await execute(q, 'dax');
            return;
        case 'record-review':
            record(q, 'Self-review', null, `${d.rubric?.length ?? 0}/${(q.rubric ?? q.requirements).length} checklist items self-confirmed; not an automatic correctness verdict.`);
            toast('Review recorded. Set your confidence or bookmark this exercise.');
            render();
            return;
        case 'check-model':
            modelChecks(q);
            return;
        case 'check-graph':
            showChecks(q, graphChecks(g, q.template ?? 'fabric'), 'Limited graph structure checks');
            return;
        case 'simulate-dag': {
            const output = simulateDAG(g);
            runs.set(q.id, output);
            record(q, 'DAG teaching simulation', null, `${output.filter(r => r.status === 'success').length}/${output.length} tasks succeeded in the toy run.`);
            render();
            return;
        }
        case 'toggle-edge': {
            const edge = g.edges.find(edge => edge.id === target.dataset.edge);
            if (edge)
                edge.active = edge.active === false;
            setGraph(q, g);
            render();
            return;
        }
        case 'remove-edge':
            g.edges = g.edges.filter(edge => edge.id !== target.dataset.edge);
            setGraph(q, g);
            render();
            return;
        case 'add-edge': {
            const from = document.getElementById('edge-from').value, to = document.getElementById('edge-to').value;
            if (from === to)
                throw new Error('A task cannot depend on itself.');
            if (g.edges.some(edge => edge.from === from && edge.to === to))
                throw new Error('This dependency already exists.');
            g.edges.push({ id: newId('edge'), from, to });
            topologicalLayers(g);
            setGraph(q, g);
            render();
            return;
        }
        case 'add-node':
            showModal('Add a component', `<label class="block-label">Label<input id="new-node-label" value="New step" maxlength="100"></label><label class="block-label">Role<input id="new-node-role" value="transform" maxlength="70"></label>${UI.button('confirm-add-node', 'Add to canvas', 'plus', 'primary')}`);
            lessonModal = false;
            return;
        case 'confirm-add-node': {
            if (g.nodes.length >= 40)
                throw new Error('The teaching canvas is limited to 40 nodes.');
            const label = document.getElementById('new-node-label').value.trim(), role = document.getElementById('new-node-role').value.trim();
            if (!label || !role)
                throw new Error('A label and role are required.');
            const id = newId('node');
            g.nodes.push({ id, label, role, x: 35 + (g.nodes.length % 3) * 235, y: 50 + Math.floor(g.nodes.length / 3) * 155, duration: 3, retries: 0 });
            setGraph(q, g);
            selection.set(q.id, id);
            modal.close();
            render();
            return;
        }
        case 'remove-node': {
            const node = selectedNode(q, g);
            if (!node)
                return;
            g.nodes = g.nodes.filter(n => n.id !== node.id);
            g.edges = g.edges.filter(edge => edge.from !== node.id && edge.to !== node.id);
            setGraph(q, g);
            selection.delete(q.id);
            render();
            return;
        }
        case 'save-node': {
            const node = selectedNode(q, g);
            if (!node)
                return;
            const label = document.getElementById('node-label').value.trim(), role = document.getElementById('node-role').value.trim();
            if (!label || !role)
                throw new Error('Label and role cannot be blank.');
            node.label = label;
            node.role = role;
            setGraph(q, g);
            render();
            return;
        }
        case 'layout': {
            if (q.workspace === 'model') {
                const original = graphTemplate(q.template);
                for (const node of g.nodes) {
                    const pos = original.nodes.find(n => n.id === node.id);
                    if (pos) {
                        node.x = pos.x;
                        node.y = pos.y;
                    }
                }
                setGraph(q, g);
            }
            else
                setGraph(q, autoLayout(g));
            render();
            return;
        }
        case 'export-svg':
            saveDownload(`${q.id}-diagram.svg`, graphSVG(g, '', {}, true), 'image/svg+xml');
            return;
        case 'export-mermaid':
            saveDownload(`${q.id}.mmd`, toMermaid(g), 'text/plain');
            return;
        case 'design-tab':
            designTabs.set(q.id, target.dataset.tab ?? 'diagram');
            render();
            return;
        case 'sync-diagram':
            patch(q, { diagram: toDiagram(g) });
            render();
            toast('Current canvas copied into diagram script.');
            return;
        case 'render-diagram': {
            const next = parseDiagram(d.diagram ?? toDiagram(g), g);
            topologicalLayers(next);
            setGraph(q, next);
            render();
            toast('Diagram updated. Existing IDs kept their positions.');
            return;
        }
    }
}
document.addEventListener('click', event => { const target = event.target.closest('[data-action]'); if (!target)
    return; event.preventDefault(); void onAction(target.dataset.action, target).catch(error => toast(error instanceof Error ? error.message : String(error), true)); });
document.addEventListener('input', event => {
    const target = event.target;
    const q = current();
    if (!q)
        return;
    const field = target.dataset.field;
    if (['code', 'notes', 'diagram'].includes(field ?? '')) {
        patch(q, { [field]: target.value });
        if (field === 'code')
            clearEvaluation(q);
        if (target.classList.contains('code-editor')) {
            const numbers = target.parentElement?.querySelector('.line-numbers');
            if (numbers)
                numbers.textContent = Array.from({ length: Math.max(10, target.value.split('\n').length) }, (_, i) => i + 1).join('\n');
        }
    }
});
document.addEventListener('scroll', event => { const target = event.target; if (target.classList?.contains('code-editor')) {
    const numbers = target.parentElement?.querySelector('.line-numbers');
    if (numbers)
        numbers.scrollTop = target.scrollTop;
} }, true);
document.addEventListener('change', event => {
    const target = event.target;
    try {
        if (target.id === 'exercise-jump') {
            go(`practice/${target.value}`);
            return;
        }
        if (target.dataset.filter === 'difficulty') {
            difficulty = target.value;
            render();
            return;
        }
        if (target.id === 'pack-file' || target.id === 'backup-file') {
            void importFile(target).catch(error => toast(String(error), true));
            return;
        }
        const q = current();
        if (!q)
            return;
        const d = draft(q), g = graph(q), field = target.dataset.field;
        if (['country', 'category', 'grain', 'selectedTable', 'confidence'].includes(field ?? '')) {
            patch(q, { [field]: target.value });
            if (field !== 'confidence' && field !== 'selectedTable')
                clearEvaluation(q);
            render();
        }
        if (target.dataset.rubric !== undefined) {
            const key = target.dataset.rubric, values = new Set(d.rubric ?? []);
            if (target.checked)
                values.add(key);
            else
                values.delete(key);
            patch(q, { rubric: [...values] });
        }
        if (target.id === 'task-retries' || target.id === 'task-failure') {
            const node = selectedNode(q, g);
            if (node) {
                if (target.id === 'task-retries')
                    node.retries = Number(target.value);
                else
                    node.transient = target.checked;
                setGraph(q, g);
                render();
            }
        }
        if (target.dataset.performance) {
            const p = d.performance ?? { partitions: 6, skew: 40, broadcast: false };
            if (target.dataset.performance === 'broadcast')
                p.broadcast = target.checked;
            else if (target.dataset.performance === 'partitions')
                p.partitions = Number(target.value);
            else
                p.skew = Number(target.value);
            patch(q, { performance: p });
            render();
        }
    }
    catch (error) {
        toast(error instanceof Error ? error.message : String(error), true);
    }
});
async function importFile(input) {
    if (storageReadBlocked)
        throw new Error('Recover protected browser storage from Settings before importing. Your original data has not been overwritten.');
    const file = input.files?.[0];
    if (!file)
        return;
    if (file.size > 2_000_000)
        throw new Error('Imports are limited to 2 MB. No changes were made.');
    const value = JSON.parse(await file.text());
    let next, summary;
    if (input.id === 'pack-file') {
        const plan = planPackImport(store.customPacks, validatePack(value), builtins);
        next = { ...clone(store), customPacks: plan.packs };
        summary = plan.summary;
    }
    else {
        next = mergeStores(store, validateStore(value), builtins);
        summary = `Merge this backup with current progress. Result: ${Object.keys(next.drafts).length} drafts and ${next.customPacks.length} custom packs. The newer timestamp wins for each draft. Device runtime consent stays unchanged.`;
    }
    lessonModal = false;
    showModal('Review the import', `<p>${e(summary)}</p>${UI.note('No changes have been made yet. Export a backup first to preserve both versions of any conflicting draft.')}<div class="settings-buttons">${UI.button('export-backup', 'Export current backup', 'download', 'secondary')}${UI.button('apply-import', 'Apply import', 'check', 'primary')}</div>`);
    pendingImport = () => { saveStore(next); store = next; rebuildQuestions(); render(); toast('Import applied. Stable IDs kept your progress attached.'); };
    input.value = '';
}
// Pointer dragging uses window listeners, so replacing the SVG during a drag is safe.
app.addEventListener('pointerdown', event => {
    const nodeEl = event.target.closest('[data-node]');
    const q = current();
    if (!nodeEl || !q || event.button !== 0)
        return;
    const g = graph(q), node = g.nodes.find(n => n.id === nodeEl.dataset.node);
    if (!node)
        return;
    event.preventDefault();
    const svg = nodeEl.ownerSVGElement, rect = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
    const initial = { x: node.x, y: node.y, px: event.clientX, py: event.clientY };
    selection.set(q.id, node.id);
    const move = (ev) => { node.x = Math.round(Math.max(8, Math.min(vb.width - 205, initial.x + (ev.clientX - initial.px) * vb.width / rect.width))); node.y = Math.round(Math.max(8, Math.min(vb.height - 90, initial.y + (ev.clientY - initial.py) * vb.height / rect.height))); const surface = document.getElementById('graph-surface'); if (surface)
        surface.innerHTML = graphSVG(g, node.id, Object.fromEntries((runs.get(q.id) ?? []).map(r => [r.id, r.status]))); };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); patch(q, { graph: g }); render(); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
});
document.addEventListener('keydown', event => {
    const target = event.target, typing = target.matches('input,textarea,select');
    if (event.key === '/' && !typing) {
        event.preventDefault();
        document.getElementById('global-search')?.focus();
    }
    if (event.key === 'Tab' && target.classList.contains('code-editor')) {
        event.preventDefault();
        const t = target;
        t.setRangeText('    ', t.selectionStart, t.selectionEnd, 'end');
        t.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !modal.open) {
        const q = current();
        if (!q)
            return;
        event.preventDefault();
        const action = q.engine === 'sql' ? 'test-sql' : q.engine === 'python' ? 'run-python' : q.engine === 'dax-subset' ? 'run-dax' : q.workspace === 'model' && q.engine === 'graph' ? 'check-model' : q.engine === 'graph' ? 'check-graph' : 'record-review';
        void onAction(action, target).catch(error => toast(String(error), true));
    }
    if ((event.key === 'Enter' || event.key === ' ') && target.hasAttribute('data-node')) {
        event.preventDefault();
        const q = current();
        if (q) {
            selection.set(q.id, target.dataset.node);
            render();
        }
    }
});
window.addEventListener('hashchange', () => { const q = current(); if (q) {
    store.settings.lastQuestion = q.id;
    persist();
} modal.close(); lessonModal = false; render(); window.scrollTo(0, 0); });
modal.addEventListener('cancel', () => { lessonModal = false; pendingImport = null; });
void boot();
