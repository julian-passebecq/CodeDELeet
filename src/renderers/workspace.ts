/** renderers/workspace: presentation orchestration, no engine ownership. */
import { escapeHTML as e,formatNumber } from '../core.js';
import { DAX_SUPPORT,evaluateDax,visibleRows } from '../dax.js';
import { graphSVG,toDiagram,toMermaid } from '../graph.js';
import type { ViewContext } from '../renderers/context.js';
import * as pipelineViews from '../renderers/pipeline-view.js';
import type { RunStatus } from '../shell/output-dock.js';
import { answerFingerprint,runSummary } from '../shell/output-dock.js';
import type { Draft,Fixtures,Graph,Question } from '../types.js';
import { notice,options,pre,steps,table } from '../ui.js';
export interface Bridge {
  current: Question;
  labEpoch: number;
  labTabs: () => string[];
  labTab: string;
  $: <T extends HTMLElement = HTMLElement>(s: string) => T;
  tabs: (items: string[], active: string, attr: string) => string;
  gitPanel: () => string;
  terminalPanel: () => string;
  semanticKPI: () => string;
  draft: () => Draft;
  mountCode: (epoch: number) => Promise<void>;
  graphPanel: (model: boolean) => string;
  fixtures: Fixtures;
  graph: () => Graph;
  codePanel: (text: string) => string;
  viewContext: () => ViewContext;
  runState: RunStatus;
  mermaidPanel: () => string;
  performancePanel: () => string;
  configEvidence: () => string;
  dataPanel: () => string;
  code: () => string;
}
export function labTabs(ctx: Bridge): string[] { switch (ctx.current.renderer) {
    case 'git-visual': return ['Workspace', 'Files', 'Diff', 'Predict'];
    case 'terminal': return ['Workspace', 'Files'];
    case 'semantic-model': return ['Workspace', 'Model', 'Rows'];
    case 'dag-editor': return ['Workspace', 'Config', 'Code', 'Run grid', 'Timeline', 'Logs'];
    case 'architecture-editor': return ['Workspace', 'Config', 'Script', 'Mermaid', 'Trade-offs'];
    case 'performance-investigation': return ['Workspace', 'Evidence', 'Code'];
    case 'pipeline-investigation': return ['Workspace', 'Artifacts', 'Code'];
    case 'config-editor': return ['Workspace', 'Evidence'];
    default: return ['Workspace', ...(ctx.current.renderer === 'pyspark-editor' ? ['Plan', 'Sample rows'] : [])];
} }

export function renderLabContent(ctx: Bridge): void {
    const epoch = ++ctx.labEpoch;
    if (!ctx.labTabs().includes(ctx.labTab))
        ctx.labTab = 'Workspace';
    ctx.$('#lab-toolbar').innerHTML = `<nav class="panel-tabs compact" aria-label="Specialist lab views">${ctx.tabs(ctx.labTabs(), ctx.labTab, 'data-lab-tab')}</nav><div class="lab-tools"><button class="text-button" data-shell="context-toggle">Task</button><button class="text-button" data-action="reset-lab">Reset</button></div>`;
    const host = ctx.$('#lab-content'), q = ctx.current, r = q.renderer;
    if (r === 'git-visual') {
        host.innerHTML = ctx.gitPanel();
        return;
    }
    if (r === 'terminal') {
        host.innerHTML = ctx.terminalPanel();
        return;
    }
    if (r === 'semantic-model') {
        if (ctx.labTab === 'Workspace') {
            host.innerHTML = `<div class="semantic-summary"><div><span class="eyebrow">SALES TEACHING MODEL</span><strong id="kpi-value">${ctx.semanticKPI()}</strong><small>Current measure preview</small></div><div class="slicers"><label>Country<select id="country">${options(['All', 'Norway', 'Sweden', 'Denmark'], ctx.draft().country ?? 'All')}</select></label><label>Category<select id="category">${options(['All', 'Hardware', 'Accessories'], ctx.draft().category ?? 'All')}</select></label></div></div><div class="code-context"><span>${e(q.language)}</span><small>${e(q.engine === 'dax-subset' ? 'DAX teaching subset - not Power BI' : 'Record your grain and relationship reasoning')}</small></div><div id="editor-host" class="editor-host"></div><div class="lab-footnote">${e(DAX_SUPPORT)}</div>`;
            ctx.mountCode(epoch);
        }
        else if (ctx.labTab === 'Model')
            host.innerHTML = ctx.graphPanel(true);
        else
            host.innerHTML = `<div class="panel-scroll"><h3>Visible Sales rows</h3>${table(visibleRows('Sales', ctx.fixtures, ctx.graph(), { country: ctx.draft().country ?? 'All', category: ctx.draft().category ?? 'All' }))}<p class="muted">Change country/category in Workspace, or deactivate a relationship in Model.</p></div>`;
        return;
    }
    if (r === 'dag-editor' || r === 'architecture-editor') {
        if (ctx.labTab === 'Workspace')
            host.innerHTML = ctx.graphPanel(false);
        else if (ctx.labTab === 'Config')
            host.innerHTML = `<div class="config-graph"><div class="notice compact-notice"><strong>One source of truth</strong><p>This JSON and the canvas share the saved graph. Apply to validate IDs, edges and coordinates.</p></div><textarea id="graph-config" class="code-fallback" aria-label="Graph configuration JSON">${e(JSON.stringify(ctx.graph(), null, 2))}</textarea><div class="inline-actions"><button class="primary" data-action="apply-graph">Apply graph configuration</button><button class="secondary" data-action="export-graph">Export JSON</button></div></div>`;
        else if (ctx.labTab === 'Code') {
            host.innerHTML = ctx.codePanel('Illustrative source - simulation uses the graph configuration, not this code.');
            ctx.mountCode(epoch);
        }
        else if (['Run grid', 'Timeline', 'Logs'].includes(ctx.labTab))
            host.innerHTML = pipelineViews.runInvestigator(ctx.viewContext(), ctx.labTab, runSummary(ctx.runState, answerFingerprint(ctx.draft(), ctx.current.starter)).stale);
        else if (ctx.labTab === 'Script')
            host.innerHTML = `<div class="config-graph"><div class="notice compact-notice"><strong>Original diagram script</strong><p>Use a[Label] -&gt; b[Label]. Applying updates the same saved graph and preserves existing node settings.</p></div><textarea id="diagram-script" class="code-fallback" aria-label="Original diagram script">${e(ctx.draft().diagram ?? toDiagram(ctx.graph()))}</textarea><div class="inline-actions"><button class="primary" data-action="apply-script">Apply diagram script</button><button class="secondary" data-action="export-svg">Export SVG</button></div></div>`;
        else if (ctx.labTab === 'Mermaid')
            host.innerHTML = ctx.mermaidPanel();
        else
            host.innerHTML = `<div class="panel-scroll"><h3>Compare the design choices</h3>${q.fixture?.comparison ? table(q.fixture.comparison) : steps(q.visual?.steps ?? q.concept)}${q.fixture?.constraints ? pre(q.fixture.constraints) : ''}${notice('Explain trade-offs', 'A connected diagram is not proof of production security, sizing, reliability or correctness.')}</div>`;
        return;
    }
    if (r === 'performance-investigation') {
        if (ctx.labTab === 'Code') {
            host.innerHTML = ctx.codePanel('Propose a change. No Spark cluster or performance predictor is running.');
            ctx.mountCode(epoch);
        }
        else if (ctx.labTab === 'Evidence')
            host.innerHTML = `<div class="panel-scroll"><h3>Task-level evidence</h3>${table(q.fixture?.tasks ?? [])}<h3>Supplied plan excerpt</h3>${pre(q.fixture?.plan ?? '')}</div>`;
        else
            host.innerHTML = ctx.performancePanel();
        return;
    }
    if (r === 'pipeline-investigation') {
        if (ctx.labTab === 'Code') {
            host.innerHTML = ctx.codePanel('Suggested model repair - not compiled by dbt.');
            ctx.mountCode(epoch);
        }
        else if (ctx.labTab === 'Artifacts')
            host.innerHTML = `<div class="panel-scroll"><h3>manifest.json (curated subset)</h3>${pre(q.fixture?.manifest)}<h3>run_results.json (curated subset)</h3>${pre(q.fixture?.run_results)}</div>`;
        else
            host.innerHTML = `<div class="panel-scroll"><div class="section-header"><span class="eyebrow">DBT RUN INVESTIGATION</span><span class="chip">Fixture evidence</span></div>${graphSVG(ctx.graph())}<h3>What failed, and what was skipped?</h3>${table(q.fixture?.run_results?.results ?? [])}<label class="stacked-label">Your diagnosis<textarea id="diagnosis" placeholder="Name the upstream failure and the downstream consequence...">${e(ctx.draft().diagnosis ?? '')}</textarea></label>${notice('Lineage is not a scheduler trace', 'The graph reflects the supplied manifest relationships; run status is supplied evidence. Edits do not regenerate dbt artifacts.')}</div>`;
        return;
    }
    if (r === 'config-editor' && ctx.labTab === 'Evidence') {
        host.innerHTML = ctx.configEvidence();
        return;
    }
    if (r === 'multi-choice-reasoning') {
        host.innerHTML = `<div class="panel-scroll"><span class="eyebrow">CHOOSE, THEN EXPLAIN</span><h2>Which diagnosis fits?</h2><div class="choice-list">${(q.fixture?.options ?? []).map((o: any) => `<label class="choice"><input type="radio" name="answer" value="${e(o.id)}" ${ctx.draft().answer === o.id ? 'checked' : ''}><span>${e(o.label)}</span></label>`).join('')}</div><label class="stacked-label">Reasoning<textarea id="diagnosis" placeholder="Explain why, and why not the other choices...">${e(ctx.draft().diagnosis ?? '')}</textarea></label></div>`;
        return;
    }
    if (r === 'pyspark-editor' && ctx.labTab === 'Plan') {
        host.innerHTML = `<div class="panel-scroll"><h3>Illustrative transformation plan</h3>${steps(q.visual?.steps ?? [])}${pre(q.fixture?.plan)}${notice('Not a live physical plan', q.fixture?.planNotice ?? 'This is a supplied plan sketch. It is not generated from your draft, and no Spark execution is claimed.')}</div>`;
        return;
    }
    if (r === 'pyspark-editor' && ctx.labTab === 'Sample rows') {
        host.innerHTML = `<div class="panel-scroll">${ctx.dataPanel()}</div>`;
        return;
    }
    host.innerHTML = ctx.codePanel(r === 'pyspark-editor' ? 'PySpark draft - sample rows and plan are supplied, not computed. Use Deepnote for an actual runtime.' : r === 'config-editor' ? 'Bounded text checks only. No terraform apply, kubectl, or Docker daemon.' : q.executionMode === 'review' ? 'Guided review - your reasoning is saved; no interpreter is claimed.' : q.engine === 'sql' ? 'Real SQL on small in-memory fixtures. First Run loads DuckDB-Wasm.' : 'Real Python in a disposable worker. First Run loads Pyodide.');
    ctx.mountCode(epoch);
}

export function codePanel(ctx: Bridge, text: string): string { return `<div class="code-context"><span>${e(ctx.current.language)}</span><small>${e(ctx.current.executionMode === 'execute' ? 'Runtime loads on demand' : 'No remote execution')}</small></div><div id="editor-host" class="editor-host"></div><div class="lab-footnote">${e(text)}</div>`; }

export function semanticKPI(ctx: Bridge): string { if (ctx.current.engine !== 'dax-subset')
    return 'Grain first'; try {
    return formatNumber(evaluateDax(ctx.code(), ctx.fixtures, ctx.graph(), { country: ctx.draft().country ?? 'All', category: ctx.draft().category ?? 'All' }).value);
}
catch {
    return 'Not evaluated';
} }

export function mermaidPanel(ctx: Bridge): string { return `<div class="mermaid-workspace"><div class="notice compact-notice"><strong>Mermaid preview (optional)</strong><p>Flowchart, ER and architecture-beta syntax can be rendered on demand. Rendering loads a pinned library; the offline canvas remains available.</p></div><textarea id="mermaid-source" class="code-fallback" aria-label="Mermaid source">${e(ctx.draft().mermaid ?? toMermaid(ctx.graph()))}</textarea><div class="inline-actions"><button class="primary" data-action="render-mermaid">Render Mermaid</button><button class="secondary" data-action="export-mermaid">Export .mmd</button></div><div id="mermaid-output" class="mermaid-output"></div></div>`; }
