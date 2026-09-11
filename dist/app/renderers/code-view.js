import { escapeHTML as e } from '../core.js';
import { notice, options, pre, steps, table } from '../ui.js';
export function dataPanel(ctx) {
    const q = ctx.current, f = q.fixture ?? {};
    let html = '<span class="eyebrow">SMALL, DETERMINISTIC DATA</span><h2>Inspect the inputs</h2>';
    if (q.engine === 'sql' || q.renderer === 'semantic-model') {
        const names = q.renderer === 'semantic-model' ? ['Sales', 'DimCustomer', 'DimProduct'] : ['customers', 'orders'], name = names.includes(ctx.draft().selectedTable ?? '') ? ctx.draft().selectedTable : names[0];
        const fixture = ctx.fixtures[name];
        html += `<label class="stacked-label">Fixture table<select id="fixture-table">${options(names, name)}</select></label><h3>${e(name)} <span class="muted">${fixture.rows.length} rows</span></h3>${table(fixture.rows)}<details open><summary>Column contract</summary>${table(fixture.columns)}</details>`;
        if (f.sqlTests)
            html += `<details><summary>Expected result for the base fixture</summary>${table(f.sqlTests[0].rows, f.sqlTests[0].columns)}</details>`;
    }
    else if (q.pythonTests?.length)
        html += q.pythonTests.map(t => `<details open><summary>${e(t.label)}</summary><h4>Arguments</h4>${pre(t.args)}<h4>Expected return</h4>${pre(t.expected)}</details>`).join('');
    else if (f.tables) {
        for (const [name, rows] of Object.entries(f.tables))
            html += `<h3>${e(name)}</h3>${Array.isArray(rows) ? table(rows) : pre(rows)}`;
        if (f.expected)
            html += '<h3>Expected output</h3>' + table(f.expected);
    }
    else if (q.renderer === 'terminal') {
        const t = ctx.terminal();
        for (const [path, content] of Object.entries(t.files))
            html += `<details><summary>${e(path)}</summary>${pre(content)}</details>`;
    }
    else if (q.renderer === 'git-visual') {
        const s = ctx.git();
        html += notice('Virtual repository', 'All files, commits and references stay inside this exercise. No connection to GitHub or your filesystem.');
        html += table(Object.entries(s.branches).map(([branch, commit]) => ({ branch, commit })));
        for (const [path, content] of Object.entries(s.files))
            html += `<details><summary>${e(path)}</summary>${pre(content)}</details>`;
    }
    else if (f.tasks)
        html += '<h3>Observed task metrics</h3>' + table(f.tasks);
    else if (f.events)
        html += '<h3>Events (supplied evidence)</h3>' + table(f.events);
    else if (f.run_results)
        html += '<h3>Run results</h3>' + table(f.run_results.results);
    else
        html += notice('Design / reasoning case', 'There is no hidden dataset. Use the task constraints and the evidence provided in the lab.');
    return html;
}
export function schemaPanel(ctx) {
    const q = ctx.current;
    let html = '<span class="eyebrow">CONTRACT & GRAIN</span><h2>Know what a row means</h2>';
    if (q.engine === 'sql' || q.renderer === 'semantic-model') {
        for (const name of q.renderer === 'semantic-model' ? ['Sales', 'DimCustomer', 'DimProduct'] : ['customers', 'orders'])
            html += `<h3>${name}</h3>${table(ctx.fixtures[name].columns)}`;
        html += notice('Grain', q.renderer === 'semantic-model' ? 'Sales: one order line. Dimensions: one row per key.' : 'customers: one customer. orders: one order. Do not multiply rows accidentally.');
    }
    else if (q.fixture?.schema)
        html += pre(q.fixture.schema);
    else if (q.renderer === 'dag-editor' || q.renderer === 'architecture-editor')
        html += notice('Graph contract', 'Nodes have stable IDs, labels, roles and positions. Edges connect existing nodes. Cycles are rejected for DAG simulation. The Config tab edits the same graph as the canvas.');
    else if (q.renderer === 'terminal')
        html += notice('Pipeline contract', ctx.terminal().shell === 'powershell' ? 'PowerShell uses objects. Import-Csv initially creates string-valued properties; numeric comparisons need an explicit cast.' : 'Bash uses text streams. The virtual shell implements a documented subset, not a host shell.');
    else if (q.renderer === 'git-visual')
        html += steps(['Working tree: editable files', 'Index: next commit snapshot', 'Commit: immutable tree + parent(s)', 'Branch: movable reference; HEAD is symbolic or detached']);
    else
        html += notice('Interface contract', q.entrypoint ? `Implement ${q.entrypoint} with the parameters shown in the starter. Return the expected data structure; do not mutate inputs.` : 'This case is evidence-led review. State assumptions and validate the real platform separately.');
    return html;
}
export function tracePanel(q, fixtures) {
    if (q.engine !== 'sql' && q.renderer !== 'pyspark-editor' && q.renderer !== 'code-editor')
        return '';
    const trace = q.id.includes('latest') || q.id.includes('dedup') ? ['Partition records by the business key.', 'Sort within each partition by event time and a stable tie-breaker.', 'Assign a row number without collapsing the row.', 'Keep the chosen row; project away helper columns.'] : q.id.includes('revenue') || q.id.includes('join') ? ['Begin at the required output grain: every customer.', 'Match eligible orders. Unmatched customers still contribute a row.', 'Group by the customer key, not the order key.', 'Aggregate amounts; decide explicitly how NULL becomes zero.'] : ['Read the input contract and identify one row.', 'Transform or group using an explicit key.', 'Check duplicates, empty inputs and missing values.', 'Return the required shape and ordering.'];
    return `<section class="concept-trace"><h3>Data-flow trace</h3><p class="muted">Conceptual steps, not an executed plan of your draft.</p>${steps(trace)}${q.engine === 'sql' ? '<h4>Logical SQL order</h4>' + steps(['FROM / JOIN', 'WHERE', 'GROUP BY / aggregates', 'HAVING', 'Window calculations', 'SELECT / DISTINCT', 'ORDER BY / LIMIT']) : ''}</section>`;
}
