/** shell/reading-panels: presentation orchestration, no engine ownership. */
import { escapeHTML as e,safeDeepnoteURL } from '../core.js';
import type { GitState } from '../git.js';
import { gitGraphSVG } from '../git.js';
import { graphSVG } from '../graph.js';
import type { DeepnoteLink,Draft,Graph,QueryResult,Question } from '../types.js';
import { icon,notice,pre,steps,table } from '../ui.js';
export interface Bridge {
  busy: boolean;
  result: QueryResult | null;
  actionLabel: () => string;
  current: Question;
  revealed: boolean;
  draft: () => Draft;
  graph: () => Graph;
  selectedNode: string;
  runStatuses: Record<string, string>;
  git: () => GitState;
  selectedCommit: string;
  companionLinks: () => DeepnoteLink[];
  mapping: Record<string, DeepnoteLink[]>;
}
export function resultPanel(ctx: Bridge): string {
    if (ctx.busy)
        return notice('Running', ctx.result?.notice ?? 'Preparing your attempt. You can cancel without losing the answer.');
    if (!ctx.result)
        return `<div class="result-empty"><span class="empty-icon">${icon('play')}</span><div><h3>Your next attempt starts here</h3><p>Inspect the question, try a solution, then <strong>${e(ctx.actionLabel())}</strong>. Explanation stays closed until you choose it.</p></div></div>`;
    const r = ctx.result, checks = r.checks ?? [], passed = checks.filter(c => c.passed).length;
    return `<div class="result-header"><span class="result-state ${r.error ? 'error' : checks.length && passed < checks.length ? 'attention' : 'success'}">${r.error ? 'NOT EXECUTED / ERROR' : checks.length ? `${passed} / ${checks.length} checks` : 'Review recorded'}</span><span>${e(r.engine)}</span><span class="muted">${r.mode === 'execute' ? Math.round(r.elapsedMs) + ' ms including adapter work' : e(r.mode ?? 'review')}</span></div>${r.error ? notice('Attempt could not complete', r.error, 'error') : ''}${r.notice ? `<p class="result-notice">${e(r.notice)}</p>` : ''}${checks.length ? `<div class="checks">${checks.map(c => `<details class="check-item ${c.passed ? 'pass' : 'fail'}"><summary><span>${c.passed ? '&#10003;' : '&#215;'}</span>${e(c.label)}</summary><p>${e(c.detail)}</p></details>`).join('')}</div>` : ''}${r.rows.length ? table(r.rows, r.columns) : ''}${r.output ? pre(r.output) : ''}${r.truncated ? notice('Display capped', 'Only the first 200 rows are shown.') : ''}`;
}

export function explanationPanel(ctx: Bridge): string {
    const q = ctx.current;
    if (!ctx.revealed)
        return `<div class="reveal-card"><span class="eyebrow">LEARN AFTER YOUR ATTEMPT</span><h3>Keep the answer out of sight until you are ready.</h3><p>Revealing does not overwrite your draft or mark the exercise as solved.</p><button class="secondary" data-action="reveal">Reveal explanation and reference</button></div>`;
    return `<div class="explanation-grid"><section><span class="eyebrow">WHY THIS WORKS</span><p>${e(q.explanation)}</p><h4>Self-review checklist</h4>${(q.rubric ?? q.requirements).map((r, i) => `<label class="rubric-item"><input type="checkbox" data-rubric="${i}" ${(ctx.draft().rubric ?? []).includes(String(i)) ? 'checked' : ''}><span>${e(r)}</span></label>`).join('')}<h4>Official references</h4><div class="source-links">${q.sources.map(s => `<a href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${e(s.label)} &nearr;</a>`).join('')}</div></section><section><div class="section-header"><span class="eyebrow">REFERENCE APPROACH</span><button class="text-button" data-action="compare">Compare with my draft</button></div>${pre(q.solution)}<div id="comparison"></div></section></div>`;
}

export function visualPanel(ctx: Bridge): string { let html = `<div class="visual-panel"><span class="eyebrow">MAKE THE CONCEPT VISIBLE</span>${steps(ctx.current.visual?.steps ?? ctx.current.concept)}${ctx.current.visual?.detail ? `<p>${e(ctx.current.visual.detail)}</p>` : ''}`; if (['dag-editor', 'architecture-editor', 'semantic-model'].includes(ctx.current.renderer!))
    html += graphSVG(ctx.graph(), ctx.selectedNode, ctx.runStatuses); if (ctx.current.renderer === 'git-visual')
    html += gitGraphSVG(ctx.git(), ctx.selectedCommit); if (ctx.current.renderer === 'pyspark-editor')
    html += `<h3>Expected sample output</h3>${table(ctx.current.fixture?.expected ?? [])}${pre(ctx.current.fixture?.plan)}`; return html + '</div>'; }

export function deepnotePanel(ctx: Bridge): string {
    const links = ctx.companionLinks(), refs = [...(ctx.current.deepnoteLinks ?? []), ...(ctx.mapping[ctx.current.id] ?? [])];
    return `<div class="deepnote-panel"><span class="eyebrow">OPTIONAL EXTERNAL COMPANION</span><h3>Extended notebook practice</h3><p>No answer, code or progress is uploaded automatically. Your CodeDELeet attempt stays here.</p>${links.length ? links.map(l => `<a class="secondary" href="${e(l.url)}" target="_blank" rel="noopener noreferrer">${e(new URL(l.url).pathname.startsWith('/app/') ? 'Open companion app (not an editable notebook)' : l.label || 'Open in Deepnote')} &nearr;</a>`).join('') : notice('No notebook URL configured', 'Configure a safe, explicit Deepnote URL in Settings. The external-open button stays hidden otherwise.')}${refs.length ? `<details><summary>Mapped sections</summary>${refs.map(l => `<p>${e(l.notebook ?? l.label)}<br>${e(l.exerciseRef ?? '')}</p>`).join('')}</details>` : ''}<h4>Your current draft</h4><button class="secondary" data-action="export-code">Export my draft</button>${safeDeepnoteURL(ctx.current.deepnoteEmbedUrl, true) ? '<button class="secondary" data-action="embed-deepnote">Load configured public preview</button>' : ''}<div id="deepnote-embed"></div><p class="muted">PySpark execution depends on the external notebook runtime. No Deepnote account or notebook archive is required by this app.</p></div>`;
}
