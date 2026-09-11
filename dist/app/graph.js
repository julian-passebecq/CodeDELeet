import { clone, escapeHTML as e, validateGraph } from './core.js';
export function chainTemplate(labels, ids) { const nodes = labels.map((label, i) => ({ id: ids?.[i] ?? `step${i + 1}`, label, role: i === 0 ? 'source' : i === labels.length - 1 ? 'report' : 'transform', x: 30 + (i % 3) * 228, y: 45 + Math.floor(i / 3) * 150, duration: 3 + i, retries: 0 })); return { nodes, edges: nodes.slice(1).map((n, i) => ({ id: `edge${i}`, from: nodes[i].id, to: n.id })) }; }
export function graphTemplate(name = 'fabric') {
    if (name === 'model')
        return { nodes: [{ id: 'customer', label: 'DimCustomer', role: 'dimension', x: 24, y: 35, fields: ['CustomerKey  PK', 'Name', 'Country'] }, { id: 'sales', label: 'Sales', role: 'fact', x: 260, y: 85, fields: ['SaleKey  PK', 'OrderKey', 'CustomerKey  FK', 'ProductKey  FK', 'Quantity', 'UnitPrice', 'UnitCost'] }, { id: 'product', label: 'DimProduct', role: 'dimension', x: 496, y: 35, fields: ['ProductKey  PK', 'Product', 'Category'] }], edges: [{ id: 'customer-sales', from: 'customer', to: 'sales', label: '1 : *', active: true }, { id: 'product-sales', from: 'product', to: 'sales', label: '1 : *', active: true }] };
    if (['pipeline', 'dbt', 'watermark'].includes(name)) {
        const ids = name === 'watermark' ? ['read_watermark', 'copy', 'validate', 'persist_watermark'] : name === 'dbt' ? ['source', 'staging', 'quality', 'mart'] : ['extract', 'transform', 'quality', 'publish'];
        const labels = name === 'watermark' ? ['Read watermark', 'Copy interval', 'Validate rows', 'Persist watermark'] : name === 'dbt' ? ['Raw orders', 'stg_orders', 'Quality gate', 'fct_revenue'] : ['Extract orders', 'Transform rows', 'Quality check', 'Publish mart'];
        const g = chainTemplate(labels, ids);
        g.edges[2].from = ids[1];
        g.nodes[2].transient = true;
        g.nodes[2].duration = 4;
        return g;
    }
    const t = { fabric: [['Operational source', 'Fabric pipeline', 'OneLake lakehouse', 'Semantic model', 'Power BI report'], ['source', 'ingest', 'store', 'semantic', 'report']], databricks: [['Events', 'Bronze raw', 'Silver validated', 'Gold revenue', 'BI consumer'], ['source', 'bronze', 'silver', 'gold', 'report']], bigquery: [['Application events', 'Batch ingestion', 'BigQuery tables', 'Curated SQL models', 'Dashboard'], ['source', 'ingest', 'warehouse', 'transform', 'report']], infrastructure: [['Source code', 'Image build', 'Image registry', 'Kubernetes workload', 'Logs & metrics'], ['source', 'build', 'registry', 'workload', 'monitor']], spark: [['Fact data', 'Shuffle / exchange', 'Join + aggregate', 'Output table'], ['source', 'shuffle', 'compute', 'output']], lakehouse: [['Query engine', 'Catalog / metadata', 'Parquet data files'], ['engine', 'catalog', 'files']] };
    const [labels, ids] = t[name] ?? t.fabric;
    const g = chainTemplate(labels, ids);
    g.nodes.forEach(n => n.role = n.id);
    return g;
}
export function topologicalLayers(input) { const g = validateGraph(input), indegree = new Map(g.nodes.map(n => [n.id, 0])), active = g.edges.filter(e => e.active !== false); for (const edge of active)
    indegree.set(edge.to, indegree.get(edge.to) + 1); const remaining = new Set(g.nodes.map(n => n.id)), layers = []; while (remaining.size) {
    const layer = [...remaining].filter(n => indegree.get(n) === 0);
    if (!layer.length)
        throw Error('Cycle detected. Remove a dependency before simulation.');
    layers.push(layer);
    for (const n of layer) {
        remaining.delete(n);
        for (const edge of active.filter(e => e.from === n))
            indegree.set(edge.to, indegree.get(edge.to) - 1);
    }
} return layers; }
export function simulateDAG(g) {
    const runs = [];
    for (const layer of topologicalLayers(g))
        for (const id of layer) {
            const n = g.nodes.find(n => n.id === id), incoming = g.edges.filter(e => e.active !== false && e.to === id), parents = incoming.map(e => runs.find(r => r.id === e.from));
            const start = Math.max(0, ...parents.map(p => p.end));
            let allowed = true;
            if (incoming.some(e => e.condition)) {
                allowed = incoming.every((edge, i) => { const st = parents[i].status; return edge.condition === 'Completed' ? ['success', 'failed'].includes(st) : edge.condition === 'Failed' ? st === 'failed' : edge.condition === 'Skipped' ? st === 'skipped' : st === 'success'; });
            }
            else if (n.triggerRule === 'all_done')
                allowed = true;
            else if (n.triggerRule === 'one_success')
                allowed = parents.length === 0 || parents.some(p => p.status === 'success');
            else if (n.triggerRule === 'none_failed_min_one_success')
                allowed = parents.length === 0 || (!parents.some(p => ['failed', 'upstream_failed'].includes(p.status)) && parents.some(p => p.status === 'success'));
            else
                allowed = parents.every(p => p.status === 'success');
            if (!allowed) {
                const skipped = parents.some(p => p.status === 'skipped') && !parents.some(p => p.status === 'failed' || p.status === 'upstream_failed');
                runs.push({ id, status: skipped ? 'skipped' : 'upstream_failed', start, end: start, attempts: 0, message: 'Dependency/trigger rule not satisfied in the deterministic fixture.' });
                continue;
            }
            if (n.skip) {
                runs.push({ id, status: 'skipped', start, end: start, attempts: 0, message: 'Branch fixture deliberately skipped this task.' });
                continue;
            }
            const retry = !!n.transient && (n.retries ?? 0) > 0, failed = !!n.transient && !retry, attempts = retry ? 2 : 1;
            const end = start + (n.duration ?? 3) * attempts + (retry ? (n.retryDelay ?? 0) : 0);
            runs.push({ id, status: failed ? 'failed' : 'success', start, end, attempts, message: failed ? 'Injected transient failure; no retry allowed.' : retry ? 'First attempt failed; retry succeeded.' : 'Completed in the deterministic teaching model.' });
        }
    return runs;
}
export function graphChecks(g, template) { let acyclic = true; try {
    topologicalLayers(g);
}
catch {
    acyclic = false;
} const checks = [{ label: 'No dependency cycle', passed: acyclic, detail: acyclic ? 'The graph can be topologically ordered.' : 'Remove the dependency cycle.' }]; if (['pipeline', 'watermark', 'dbt'].includes(template)) {
    const ids = graphTemplate(template).nodes.map(n => n.id);
    for (let i = 1; i < ids.length; i++)
        checks.push({ label: `${ids[i - 1]} to ${ids[i]}`, passed: g.edges.some(e => e.from === ids[i - 1] && e.to === ids[i] && e.active !== false), detail: 'Explicit active dependency required.' });
    checks.push({ label: 'No quality bypass', passed: !g.edges.some(e => e.from === ids[1] && e.to === ids[3] && e.active !== false), detail: 'Remove the direct copy/transform-to-publication dependency.' });
}
else {
    const required = graphTemplate(template).nodes.map(n => n.id);
    for (const id of required)
        checks.push({ label: `Role: ${id}`, passed: g.nodes.some(n => n.role === id || n.id === id), detail: 'Structural role only; not a production guarantee.' });
    const reachable = new Set();
    const first = g.nodes.find(n => n.id === required[0] || n.role === required[0]);
    if (first)
        reachable.add(first.id);
    for (let i = 0; i < g.nodes.length; i++)
        for (const edge of g.edges)
            if (edge.active !== false && reachable.has(edge.from))
                reachable.add(edge.to);
    const last = g.nodes.find(n => n.id === required.at(-1) || n.role === required.at(-1));
    checks.push({ label: 'Connected end-to-end path', passed: !!last && reachable.has(last.id), detail: 'Reachability, not vendor validation.' });
} return checks; }
export function autoLayout(g) { const copy = clone(g); let layers; try {
    layers = topologicalLayers(copy);
}
catch {
    layers = [copy.nodes.map(n => n.id)];
} let index = 0; for (const layer of layers)
    for (const id of layer) {
        const n = copy.nodes.find(n => n.id === id);
        n.x = 30 + (index % 3) * 228;
        n.y = 45 + Math.floor(index / 3) * 145;
        index++;
    } return copy; }
export function parseDiagram(text, old) { if (text.length > 15000)
    throw Error('Diagram source limit: 15,000 characters.'); const nodes = new Map(), edges = []; const node = (token) => { const m = /^([A-Za-z][A-Za-z0-9_-]{0,79})(?:\[([^\]\r\n]{1,110})\])?$/.exec(token.trim()); if (!m)
    throw Error(`Invalid node: ${token}. Use id[Label] -> id[Label].`); const [, id, label] = m; if (!nodes.has(id)) {
    const prev = old?.nodes.find(n => n.id === id);
    nodes.set(id, { ...prev, id, label: label ?? prev?.label ?? id, role: prev?.role ?? id, x: prev?.x ?? 30 + (nodes.size % 3) * 228, y: prev?.y ?? 45 + Math.floor(nodes.size / 3) * 145 });
}
else if (label)
    nodes.get(id).label = label; return id; }; for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#'))
        continue;
    const ids = line.split(/\s*->\s*/).map(node);
    for (let i = 1; i < ids.length; i++)
        if (!edges.some(e => e.from === ids[i - 1] && e.to === ids[i])) {
            const prev = old?.edges.find(e => e.from === ids[i - 1] && e.to === ids[i]);
            edges.push({ ...prev, id: `edge${edges.length}`, from: ids[i - 1], to: ids[i] });
        }
} if (!nodes.size)
    throw Error('Add at least one node.'); return validateGraph({ nodes: [...nodes.values()], edges }); }
export function toDiagram(g) { return [...g.nodes.map(n => `${n.id}[${n.label.replace(/[\]\r\n]/g, ' ')}]`), ...g.edges.filter(e => e.active !== false).map(e => `${e.from} -> ${e.to}`)].join('\n'); }
export function toMermaid(g) { return 'flowchart LR\n' + g.nodes.map(n => `  ${n.id}["${n.label.replace(/["<>\r\n]/g, ' ')}"]`).join('\n') + '\n' + g.edges.filter(e => e.active !== false).map(e => `  ${e.from} --> ${e.to}`).join('\n'); }
let svgSequence = 0;
export function graphSVG(g, selected = '', statuses = {}) {
    const markerId = 'graph-arrow-' + (++svgSequence), dotsId = 'graph-dots-' + svgSequence;
    const model = g.nodes.some(n => n.fields), width = Math.max(720, ...g.nodes.map(n => n.x + 215)), height = Math.max(model ? 335 : 260, ...g.nodes.map(n => n.y + (n.fields ? 80 + n.fields.length * 20 : 95)));
    const edges = g.edges.map(edge => { const a = g.nodes.find(n => n.id === edge.from), b = g.nodes.find(n => n.id === edge.to); if (!a || !b)
        return ''; const forward = b.x > a.x, x1 = a.x + (forward ? 195 : 0), x2 = b.x + (forward ? 0 : 195), y1 = a.y + 35, y2 = b.y + 35, mid = (x1 + x2) / 2; const path = Math.abs(a.x - b.x) < 30 ? `M${a.x + 97},${a.y + 75} L${b.x + 97},${b.y}` : `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`; return `<g class="graph-edge" ${model ? `data-model-edge="${e(edge.id)}" tabindex="0" role="button" aria-label="Inspect relationship ${e(a.label)} to ${e(b.label)}"` : ""}><path d="${path}" fill="none" stroke="${edge.active === false ? '#b7bfc0' : '#81948c'}" stroke-width="1.6" ${edge.active === false ? 'stroke-dasharray="5 5"' : ''} marker-end="url(#${markerId})"/><text x="${mid}" y="${(y1 + y2) / 2 - 7}" text-anchor="middle" fill="#65776e" font-size="10">${e(edge.condition ?? edge.label ?? '')}${edge.active === false ? ' inactive' : ''}</text></g>`; }).join('');
    const nodes = g.nodes.map(n => { const h = n.fields ? 68 + n.fields.length * 20 : 75; const status = statuses[n.id]; return `<g class="graph-node" aria-selected="${n.id === selected}" data-node="${e(n.id)}" tabindex="0" role="button" aria-label="Select ${e(n.label)}" transform="translate(${n.x},${n.y})"><rect width="195" height="${h}" rx="9" fill="#fff" stroke="${selected === n.id ? '#237768' : status === 'failed' ? '#b95840' : '#d6ded9'}" stroke-width="${selected === n.id ? 2 : 1.2}"/><rect x="12" y="14" width="23" height="23" rx="5" fill="#eaf0ec"/><path d="M18 21h11m-11 5h11m-11 5h7" stroke="#527066" stroke-width="1.5"/><text x="43" y="29" font-size="11.5" font-weight="600" fill="#253d35">${e(n.label.length > 23 ? n.label.slice(0, 22) + '...' : n.label)}</text><text x="14" y="55" font-size="10" fill="#738079">${e(status ?? n.role)}</text>${(n.fields ?? []).map((f, i) => `<text x="14" y="${80 + i * 20}" font-size="11" fill="#62746b">${e(f)}</text>`).join('')}</g>`; }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="graph-svg" role="img" aria-label="${model ? 'Semantic model' : 'Dependency graph'}"><defs><marker id="${markerId}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#81948c"/></marker><pattern id="${dotsId}" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".6" fill="#dfe5e1"/></pattern></defs><rect width="100%" height="100%" fill="#fafcfb"/><rect width="100%" height="100%" fill="url(#${dotsId})"/>${edges}${nodes}</svg>`;
}
// Retained for v1 drafts only; unitless toy work, never a timing estimate.
export function performanceModel(partitions, skew, broadcast) { const p = Math.max(2, Math.min(12, Math.round(partitions))), s = Math.max(0, Math.min(80, skew)), base = (100 - s) / p; return Array.from({ length: p }, (_, i) => Math.round((base + (i === 0 ? s : 0)) * (broadcast ? .65 : 1) + 4)); }
