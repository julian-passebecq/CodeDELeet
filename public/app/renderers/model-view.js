/** Visible contract of the intentionally bounded three-table semantic model. */
import { escapeHTML as e } from '../core.js';
import { notice, table } from '../ui.js';
export function modelInspector(ctx) {
    const g = ctx.graph(), n = g.nodes.find(n => n.id === ctx.selectedNode), edge = g.edges.find(x => x.id === ctx.selectedEdge);
    if (edge) {
        const from = g.nodes.find(n => n.id === edge.from), to = g.nodes.find(n => n.id === edge.to);
        return `<section class="model-inspector"><span class="eyebrow">RELATIONSHIP CONTRACT</span><h3>${e(from?.label)} to ${e(to?.label)}</h3><dl><dt>Cardinality</dt><dd>One dimension key to many fact rows</dd><dt>Filter direction</dt><dd>Dimension to fact (single direction)</dd><dt>Status</dt><dd>${edge.active === false ? 'Inactive - slicer does not propagate' : 'Active - slicer propagates'}</dd></dl><label class="checkbox-label"><input type="checkbox" data-edge-active="${e(edge.id)}" ${edge.active !== false ? 'checked' : ''}>Active relationship</label>${notice('Bounded relationship semantics', 'The teaching evaluator supports the supplied customer/product-to-sales keys and direction. Relabeling a node does not change its key mapping. Bridges, bidirectional filtering and role-playing relationships require an external semantic engine.')}</section>`;
    }
    const known = { customer: { table: 'DimCustomer', key: 'CustomerKey', grain: 'One customer' }, product: { table: 'DimProduct', key: 'ProductKey', grain: 'One product' }, sales: { table: 'Sales', key: 'SaleKey', grain: 'One order line' } };
    const meta = n && known[n.id];
    if (!n || !meta)
        return `<section><h3>Inspect the semantic model</h3><p>Select a table for its typed columns, keys, grain and fixture rows. Use Inspect beside a relationship for filter propagation.</p>${notice('Model contract', 'Declare one order line for Sales. Active dimension-to-fact relationships propagate the country and product-category slicers.')}</section>`;
    const data = ctx.fixtures[meta.table];
    const columns = data.columns.map(c => ({ column: c.name, type: c.type, key: c.name === meta.key ? 'PK' : n.id === 'sales' && ['CustomerKey', 'ProductKey'].includes(c.name) ? 'FK' : '' }));
    return `<section class="model-inspector"><span class="eyebrow">TABLE / GRAIN / KEYS</span><h3>${e(n.label)}</h3><p><strong>Fixture table:</strong> ${e(meta.table)}<br><strong>Grain:</strong> ${e(meta.grain)}</p>${table(columns)}<details open><summary>Fixture preview (${data.rows.length} rows)</summary>${table(data.rows)}</details>${notice('Teach the key, not just the label', 'The stable table ID identifies the supplied schema. Column and grain metadata describe the fixture; they do not create a new DAX storage engine.')}</section>`;
}
