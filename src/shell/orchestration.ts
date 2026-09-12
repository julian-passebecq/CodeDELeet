import type { TransientShell } from '../shell/layout-controller.js';
/** shell/orchestration: presentation orchestration, no engine ownership. */
import type { CaseStudy } from '../case-study/controller.js';
import { copyStandalone,ensureSession,restoreCheckpoint,selectPage } from '../case-study/controller.js';
import { caseTaskBar } from '../case-study/view.js';
import { escapeHTML as e,safeDeepnoteURL,validDeepnoteLinks } from '../core.js';
import { visibleRows } from '../dax.js';
import { EditorPool } from '../editor.js';
import { graphSVG } from '../graph.js';
import * as codeViews from '../renderers/code-view.js';
import type { ViewContext } from '../renderers/context.js';
import * as systemsViews from '../renderers/systems-view.js';
import { applyShellDOM } from '../shell/dom-layout.js';
import type { ModeSlot,OutputAnchor,OutputSize,Presentation,ThemeId,ToolId } from '../shell/layout-controller.js';
import { activePreferences,resolveLayout,setOutputSize,switchMode,toggleFocus } from '../shell/layout-controller.js';
import type { RunStatus } from '../shell/output-dock.js';
import { answerFingerprint,runSummary } from '../shell/output-dock.js';
import { applyTheme } from '../shell/themes.js';
import { themePanelHTML, syncThemeChoices } from './theme-panel.js';
import { THEME_DATA } from './theme-data.js';
import { railHTML,toolHeader } from '../shell/tool-rail.js';
import type { DeepnoteLink,Draft,Fixtures,Graph,Question,Store,Workspace } from '../types.js';
import { notice,options,pre,table } from '../ui.js';
export interface Bridge {
  presentation: Presentation;
  workspace: Workspace;
  shellState: TransientShell;
  editorPool: EditorPool;
  draftKey: () => string;
  current: Question;
  mapping: Record<string, DeepnoteLink[]>;
  store: Store;
  runState: RunStatus;
  draft: () => Draft;
  $: <T extends HTMLElement = HTMLElement>(s: string) => T;
  companionLinks: () => DeepnoteLink[];
  revealed: boolean;
  selectedNode: string;
  selectedEdge: string;
  inspectorElement: HTMLElement | null;
  explanationPanel: () => string;
  visualPanel: () => string;
  fixtures: Fixtures;
  deepnotePanel: () => string;
  activeCase: CaseStudy | null;
  labelMode: () => string;
  renderRail: () => void;
  renderTool: (force?: boolean) => void;
  applyLayout: () => void;
  graph: () => Graph;
  viewContext: () => ViewContext;
  rememberInputs: () => void;
  labTab: string;
  leftTab: string;
  renderHeader: () => void;
  renderQuestion: () => void;
  renderLab: () => void;
  renderCaseParts: () => void;
  renderComparison: () => void;
  renderDrawer: () => void;
  persist: (immediate?: boolean) => void;
  changeMode: (slot: ModeSlot) => void;
  openTool: (tool: ToolId, keep?: boolean) => void;
  outputTab: string;
  technology: string;
  renderLibrary: () => void;
  cases: CaseStudy[];
  navigate: (id: string, caseId?: string, taskId?: string) => void;
  code: () => string;
  search: string;
  difficulty: string;
  queue: string;
  conceptFilter: string;
  priorityFilter: string;
  toast: (message: string, error?: boolean) => void;
  patch: (p: Partial<Draft>, immediate?: boolean) => void;
  resize: (event: PointerEvent, kind: "column" | "drawer" | "tool") => void;
}
export function applyLayout(ctx: Bridge): void {
    applyTheme(ctx.presentation);
    syncThemeChoices(ctx.presentation.theme);
    applyShellDOM(ctx.presentation, ctx.workspace, ctx.shellState);
    ctx.editorPool.refresh(ctx.draftKey());
}

// Shared shell orchestration. Domain engines remain in their original modules.
export function companionLinks(ctx: Bridge): DeepnoteLink[] { return validDeepnoteLinks(ctx.current, { ...ctx.mapping, ...ctx.store.settings.deepnoteMap }); }

export function updateRunBadge(ctx: Bridge): void {
    if (!ctx.current)
        return;
    const badge = document.querySelector<HTMLElement>('#run-status');
    if (!badge)
        return;
    const s = runSummary(ctx.runState, answerFingerprint(ctx.draft(), ctx.current.starter));
    badge.textContent = s.label;
    badge.title = s.label + ' - Open output';
    badge.className = 'run-status ' + s.state;
    badge.setAttribute('aria-label', 'Run status: ' + s.label + '. Open output');
    const old = document.querySelector<HTMLElement>('#stale-marker');
    if (s.stale && !old) {
        const body = document.querySelector('#drawer-body');
        body?.insertAdjacentHTML('afterbegin', '<div id="stale-marker" class="stale-banner">Stale result - inputs changed. Run again.</div>');
    }
    else if (!s.stale)
        old?.remove();
}

export function renderRail(ctx: Bridge): void {
    const rail = ctx.$('#tool-rail'), focused = document.activeElement as HTMLElement | null;
    const key = focused && rail.contains(focused) ? ['data-mode', 'data-tool', 'data-action', 'data-shell'].find(k => focused.hasAttribute(k)) : undefined;
    const value = key ? focused!.getAttribute(key) : null;
    rail.innerHTML = railHTML(ctx.presentation, ctx.workspace, ctx.shellState, ctx.companionLinks().length > 0 || !!safeDeepnoteURL(ctx.current.deepnoteEmbedUrl, true), ['semantic-model', 'dag-editor', 'architecture-editor'].includes(ctx.current.renderer!));
    if (key && value) rail.querySelector<HTMLElement>(`[${key}="${value}"]`)?.focus({ preventScroll: true });
}

export function renderTool(ctx: Bridge, force = false): void {
    const panel = ctx.$('#tool-panel'), body = ctx.$('#tool-body'), tool = ctx.shellState.tool;
    if (!tool) {
        panel.hidden = true;
        return;
    }
    const r = resolveLayout(ctx.presentation, ctx.workspace, innerWidth, ctx.shellState);
    panel.hidden = false;
    ctx.$('#tool-header').innerHTML = toolHeader(tool, ctx.shellState, r.pinned, innerWidth - r.navWidth - r.toolWidth - 48 >= 820);
    const key = [ctx.draftKey(), tool, ctx.revealed, tool === 'History' ? ctx.draft().attempts?.length : '', tool === 'Inspector' ? ctx.selectedNode + '|' + ctx.selectedEdge : ''].join('|');
    if (!force && body.dataset.renderKey === key && tool !== 'Inspector')
        return;
    body.dataset.renderKey = key;
    if (tool === 'Inspector') {
        body.replaceChildren();
        if (ctx.inspectorElement)
            body.append(ctx.inspectorElement);
        else
            body.innerHTML = notice('Inspector', 'Select a model table, node or relationship in the canvas.');
        return;
    }
    if (tool === 'Theme')
        body.innerHTML = themePanelHTML(ctx.presentation.theme);
    else if (tool === 'Explanation')
        body.innerHTML = ctx.explanationPanel();
    else if (tool === 'Visual')
        body.innerHTML = ctx.visualPanel() + codeViews.tracePanel(ctx.current, ctx.fixtures);
    else if (tool === 'Deepnote')
        body.innerHTML = ctx.deepnotePanel();
    else if (tool === 'Notes')
        body.innerHTML = `<div class="notes-panel"><span class="eyebrow">${ctx.activeCase ? 'PRIVATE CASE TASK NOTES' : 'PRIVATE EXERCISE NOTES'}</span><textarea id="notes" placeholder="Invariant, mistake to avoid, interview explanation..." aria-label="Personal exercise notes">${e(ctx.draft().notes ?? '')}</textarea><div class="notes-settings"><label>Status<select id="status">${options(['not-started', 'in-progress', 'completed', 'review'], ctx.draft().status ?? 'not-started')}</select></label><label>Confidence<select id="confidence">${options(['New', 'Learning', 'Review', 'Confident'], ctx.draft().confidence ?? 'New')}</select></label></div><p class="muted">Saved on this device; included in your export.</p></div>`;
    else if (tool === 'References')
        body.innerHTML = `<div class="references-panel"><span class="eyebrow">OFFICIAL REFERENCE PAGES</span><p>External links; no credentials are needed by CodeDELeet.</p>${ctx.current.sources.map(s => `<a href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${e(s.label)} &nearr;</a>`).join('')}${notice('Execution boundary', ctx.labelMode())}<p>${e(ctx.current.visual?.detail ?? 'Diagrams are original teaching views or supplied fixture evidence, not vendor-certified architectures.')}</p></div>`;
    else
        body.innerHTML = `<div class="history-panel">${ctx.draft().attempts?.length ? [...ctx.draft().attempts!].reverse().map(a => `<details class="history-entry"><summary><span class="result-dot ${a.passed === true ? 'pass' : a.passed === false ? 'fail' : 'review'}"></span><time>${e(new Date(a.at).toLocaleString())}</time><strong>${e(a.kind)}</strong><span>${e(a.summary)}</span></summary>${a.code ? pre(a.code) : '<p>No code snapshot for this attempt.</p>'}</details>`).join('') : notice('No attempts yet', 'Your case tasks and standalone exercises have independent attempt histories.')}${ctx.activeCase ? ensureSession(ctx.store, ctx.activeCase).checkpoints.filter(c => c.taskId === ensureSession(ctx.store, ctx.activeCase!).currentTaskId).map(c => `<div class="checkpoint"><p>${e(c.reason)} - ${e(c.at)}</p><button class="secondary" data-checkpoint="${e(c.id)}">Restore saved case checkpoint</button></div>`).join('') : ''}</div>`;
}

export function openTool(ctx: Bridge, tool: ToolId, keep = false): void {
    if (tool === 'Deepnote' && !ctx.companionLinks().length && !safeDeepnoteURL(ctx.current.deepnoteEmbedUrl, true))
        return;
    const previous = ctx.shellState.tool;
    ctx.shellState.tool = !keep && previous === tool && (innerWidth >= 1080 || ctx.shellState.mobile === 'tools') ? null : tool;
    ctx.shellState.toolExpanded = false;
    if (ctx.shellState.tool && innerWidth < 1080)
        ctx.shellState.mobile = 'tools';
    if (!ctx.shellState.tool && innerWidth < 1080) ctx.shellState.mobile = 'artifact';
    ctx.renderRail();
    ctx.renderTool();
    ctx.applyLayout();
    if (ctx.shellState.tool && previous !== ctx.shellState.tool)
        document.querySelector<HTMLElement>(ctx.shellState.tool === 'Theme' ? '#tool-body input:checked' : '#tool-header [data-shell="tool-close"]')?.focus({ preventScroll: true });
}

export function closeTool(ctx: Bridge): void {
    const tool = ctx.shellState.tool;
    ctx.shellState.tool = null;
    ctx.shellState.mobile = 'artifact';
    ctx.renderRail();
    ctx.renderTool();
    ctx.applyLayout();
    document.querySelector<HTMLElement>(`#tool-rail [data-tool="${tool}"]`)?.focus({ preventScroll: true });
}

export function renderCaseParts(ctx: Bridge): void {
    ctx.$('#case-task-host').innerHTML = ctx.activeCase ? caseTaskBar(ctx.activeCase, ensureSession(ctx.store, ctx.activeCase), ctx.current) : ctx.presentation.modes[ctx.workspace] === 'case' ? `<div class="standalone-case-label"><span class="chip">STANDALONE CASE VIEW</span><span>Same exercise, same answer. Open an authored case from the navigator for multiple tasks.</span></div>` : '';
}

export function renderComparison(ctx: Bridge): void {
    const host = ctx.$('#compare-companion');
    if (ctx.workspace === 'model' && ctx.presentation.modes[ctx.workspace] === 'inspect' && ctx.current.renderer === 'semantic-model') {
        host.innerHTML = `<div class="panel-scroll"><span class="eyebrow">LIVE FILTER CONTEXT</span><h3>${e(ctx.draft().country ?? 'All')} / ${e(ctx.draft().category ?? 'All')}</h3><p class="muted">These rows follow the current teaching-model relationships.</p>${table(visibleRows('Sales', ctx.fixtures, ctx.graph(), { country: ctx.draft().country ?? 'All', category: ctx.draft().category ?? 'All' }))}<details><summary>Compact model and filter direction</summary>${graphSVG(ctx.graph())}</details><button class="secondary" data-tool="Inspector">Inspect model fields</button></div>`;
    }
    else if (ctx.workspace === 'architecture' && ctx.presentation.modes[ctx.workspace] === 'inspect')
        host.innerHTML = systemsViews.comparisonPanel(ctx.viewContext());
    else {
        host.innerHTML = '';
        host.hidden = true;
        return;
    }
    host.hidden = false;
    const toolbar = ctx.$('#lab-toolbar');
    if (!toolbar.querySelector('.comparison-switch'))
        toolbar.insertAdjacentHTML('beforeend', '<div class="comparison-switch"><button class="text-button" data-compare-pane="artifact">Working artifact</button><button class="text-button" data-compare-pane="evidence">Evidence / data</button></div>');
}

export function changeMode(ctx: Bridge, slot: ModeSlot): void {
    if (ctx.presentation.modes[ctx.workspace] === slot)
        return;
    ctx.rememberInputs();
    if (ctx.shellState.focus)
        toggleFocus(ctx.shellState, ctx.presentation);
    const prior = ctx.labTab, preset = switchMode(ctx.presentation, ctx.workspace, slot);
    ctx.leftTab = slot === 'inspect' && ctx.workspace === 'code' ? 'Data' : 'Task';
    if (ctx.workspace === 'model' && ctx.current.renderer === 'semantic-model')
        ctx.labTab = slot === 'work' ? 'Model' : 'Workspace';
    else if (ctx.workspace === 'pipeline' && ctx.current.renderer === 'dag-editor')
        ctx.labTab = slot === 'inspect' ? 'Run grid' : 'Workspace';
    ctx.renderHeader();
    ctx.renderQuestion();
    if (prior !== ctx.labTab)
        ctx.renderLab();
    else {
        ctx.renderCaseParts();
        ctx.renderComparison();
    }
    ctx.renderDrawer();
    ctx.applyLayout();
    ctx.persist(true);
}

export function handleShellClick(ctx: Bridge, button: HTMLElement): boolean {
    if (button.dataset.mode) {
        ctx.changeMode(button.dataset.mode as ModeSlot);
        return true;
    }
    if (button.dataset.tool) {
        ctx.openTool(button.dataset.tool as ToolId);
        return true;
    }
    if (button.dataset.outputTab) {
        ctx.outputTab = button.dataset.outputTab;
        ctx.renderDrawer();
        return true;
    }
    if (button.dataset.comparePane) {
        ctx.$('#renderer-wrap').dataset.comparePane = button.dataset.comparePane;
        return true;
    }
    if (button.dataset.quickFilter) {
        ctx.technology = ctx.technology === button.dataset.quickFilter ? 'All topics' : button.dataset.quickFilter;
        (ctx.$<HTMLSelectElement>('#technology')).value = ctx.technology;
        ctx.renderLibrary();
        ctx.renderHeader();
        return true;
    }
    if (button.dataset.openCase) {
        const c = ctx.cases.find(c => c.id === button.dataset.openCase)!;
        ctx.presentation.modes[c.workspace] = 'case';
        const session = ensureSession(ctx.store, c);
        ctx.navigate(c.tasks.find(t => t.id === session.currentTaskId)!.questionRef, c.id, session.currentTaskId);
        return true;
    }
    if (button.dataset.page && ctx.activeCase) {
        selectPage(ctx.store, ctx.activeCase, button.dataset.page);
        ctx.renderQuestion();
        ctx.persist(true);
        return true;
    }
    if (button.dataset.checkpoint && ctx.activeCase) {
        if (confirm('Restore this case checkpoint? The current case answer will also be checkpointed.')) {
            restoreCheckpoint(ctx.store, ctx.activeCase, button.dataset.checkpoint);
            void ctx.editorPool.replace(ctx.draftKey(), ctx.code());
            ctx.renderLab();
            ctx.renderTool(true);
            ctx.persist(true);
        }
        return true;
    }
    if (button.dataset.caseAction && ctx.activeCase) {
        if (button.dataset.caseAction === 'standalone')
            ctx.navigate(ctx.current.id);
        else if (button.dataset.caseAction === 'copy' && confirm('Copy your standalone attempt into this case task? The current case draft is checkpointed first.')) {
            copyStandalone(ctx.store, ctx.activeCase, ctx.current);
            void ctx.editorPool.replace(ctx.draftKey(), ctx.code());
            ctx.renderLab();
            ctx.renderTool(true);
            ctx.persist(true);
        }
        return true;
    }
    const action = button.dataset.shell;
    if (!action)
        return false;
    const m = activePreferences(ctx.presentation, ctx.workspace);
    if (action === 'nav-toggle') {
        if (innerWidth < 760)
            document.body.classList.toggle('library-open');
        else
            ctx.presentation.navCollapsed = !ctx.presentation.navCollapsed;
    }
    if (action === 'all-exercises') {
        ctx.search = '';
        ctx.difficulty = 'All levels';
        ctx.technology = 'All topics';
        ctx.queue = 'All exercises';
        ctx.conceptFilter = '';
        ctx.priorityFilter = 'All priorities';
        ctx.$('#search').setAttribute('value', '');
        ctx.$<HTMLInputElement>('#search').value = '';
        ctx.$<HTMLSelectElement>('#difficulty').value = ctx.difficulty;
        ctx.$<HTMLSelectElement>('#technology').value = ctx.technology;
        ctx.$<HTMLSelectElement>('#queue').value = ctx.queue;
        ctx.$<HTMLInputElement>('#concept-filter').value = '';
        ctx.$<HTMLSelectElement>('#priority-filter').value = ctx.priorityFilter;
        ctx.renderLibrary();
        ctx.renderHeader();
    }
    if (action === 'output-toggle') {
        const size = resolveLayout(ctx.presentation, ctx.workspace, innerWidth, ctx.shellState).outputSize;
        setOutputSize(ctx.presentation, ctx.workspace, ctx.shellState, size === 'closed' ? 'compact' : 'closed');
        if (innerWidth < 1080) {
            ctx.shellState.mobile = 'output';
            setOutputSize(ctx.presentation, ctx.workspace, ctx.shellState, 'expanded');
        }
    }
    if (action === 'output-close')
        setOutputSize(ctx.presentation, ctx.workspace, ctx.shellState, 'closed');
    if (action === 'tool-close') { closeTool(ctx); return true; }
    if (action === 'tool-expand')
        ctx.shellState.toolExpanded = !ctx.shellState.toolExpanded;
    if (action === 'tool-pin') {
        m.toolPinned = !m.toolPinned;
        if (m.toolPinned && innerWidth < 1500)
            ctx.toast('Pin preference saved. This viewport uses an overlay to keep the workspace readable.');
    }
    if (action === 'context-toggle') {
        m.context = !m.context;
        if (innerWidth < 1080)
            ctx.shellState.mobile = 'context';
    }
    if (action === 'swap-sides')
        m.swapped = !m.swapped;
    ctx.renderDrawer();
    ctx.applyLayout();
    ctx.persist(true);
    return true;
}

export function handleShellChange(ctx: Bridge, t: HTMLInputElement): boolean {
    const m = activePreferences(ctx.presentation, ctx.workspace);
    if (t.name === 'app-theme') {
        if (!Object.hasOwn(THEME_DATA, t.value)) return true;
        ctx.presentation.theme = t.value as ThemeId;
        ctx.applyLayout();
        ctx.persist(true);
        return true;
    }
    if (t.id === 'layout-mode') {
        ctx.changeMode(t.value as ModeSlot);
        return true;
    }
    else if (t.id === 'output-anchor')
        m.outputAnchor = t.value as OutputAnchor;
    else if (t.id === 'output-size')
        setOutputSize(ctx.presentation, ctx.workspace, ctx.shellState, t.value as OutputSize);
    else if (t.id === 'priority-filter') {
        ctx.priorityFilter = t.value;
        ctx.renderLibrary();
        return true;
    }
    else if (t.id === 'case-page' && ctx.activeCase) {
        selectPage(ctx.store, ctx.activeCase, t.value);
        ctx.renderQuestion();
        ctx.persist(true);
        return true;
    }
    else if (t.id === 'case-task' && ctx.activeCase) {
        const task = ctx.activeCase.tasks.find(x => x.id === t.value)!;
        ctx.navigate(task.questionRef, ctx.activeCase.id, task.id);
        return true;
    }
    else if (t.id === 'terminal-theme')
        ctx.presentation.terminal = t.value as 'inherit' | 'light' | 'dark';
    else if (t.id === 'text-size')
        ctx.presentation.textSize = Math.max(13, Math.min(18, Number(t.value)));
    else if (t.id === 'density')
        ctx.presentation.density = t.value as 'comfortable' | 'compact';
    else if (t.id === 'nav-width')
        ctx.presentation.navWidth = Math.max(200, Math.min(320, Number(t.value)));
    else if (t.id === 'fixture-table') {
        ctx.patch({ selectedTable: t.value });
        ctx.renderQuestion();
        return true;
    }
    else
        return false;
    ctx.renderDrawer();
    ctx.applyLayout();
    ctx.persist(true);
    return true;
}

export function bindSplitters(ctx: Bridge): void {
    for (const [id, kind] of [['column-separator', 'column'], ['drawer-separator', 'drawer'], ['tool-separator', 'tool']] as const) {
        ctx.$('#' + id).onpointerdown = ev => ctx.resize(ev, kind);
        ctx.$('#' + id).onkeydown = ev => {
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(ev.key))
                return;
            ev.preventDefault();
            const m = activePreferences(ctx.presentation, ctx.workspace), minus = ['ArrowLeft', 'ArrowDown', 'Home'].includes(ev.key);
            if (kind === 'column')
                m.split = ev.key === 'Home' ? 25 : ev.key === 'End' ? 60 : Math.max(25, Math.min(60, m.split + (minus ? -2 : 2)));
            else if (kind === 'tool')
                m.toolWidth = ev.key === 'Home' ? 320 : ev.key === 'End' ? 560 : Math.max(320, Math.min(560, m.toolWidth + (minus ? -20 : 20)));
            else {
                if (m.outputAnchor === 'right')
                    m.outputWidth = Math.max(300, Math.min(600, m.outputWidth + (minus ? -20 : 20)));
                else
                    m.outputHeight = Math.max(120, Math.min(600, m.outputHeight + (minus ? -20 : 20)));
                setOutputSize(ctx.presentation, ctx.workspace, ctx.shellState, 'compact');
            }
            ctx.applyLayout();
            ctx.persist(true);
        };
    }
}
