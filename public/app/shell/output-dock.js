/** Output has its own host and lifecycle; it is never a supplementary tool tab. */
import { escapeHTML as e } from '../core.js';
import { icon, notice, options, pre, table } from '../ui.js';
export const newRunStatus = () => ({ phase: 'idle', fingerprint: '', result: null });
/** Excludes notes, personal status, layout, theme and selection; includes actual task inputs. */
export function answerFingerprint(d, starter) { return JSON.stringify([d.code ?? starter, d.graph ?? null, d.labState ?? null, d.country ?? 'All', d.category ?? 'All', d.grain ?? '', d.answer ?? '', d.diagnosis ?? '']); }
export function runSummary(run, fingerprint) {
    const stale = run.phase !== 'idle' && run.phase !== 'running' && run.fingerprint !== fingerprint;
    let label = 'Not run', state = 'idle';
    if (run.phase === 'running') {
        label = 'Running';
        state = 'running';
    }
    else if (run.phase === 'cancelled') {
        label = 'Cancelled';
        state = 'cancelled';
    }
    else if (run.phase === 'unavailable') {
        label = 'Runtime unavailable';
        state = 'error';
    }
    else if (run.phase === 'error') {
        label = 'Attempt error';
        state = 'error';
    }
    else if (run.result) {
        const c = run.result.checks ?? [], passed = c.filter(c => c.passed).length;
        label = c.length ? `${passed}/${c.length} checks${passed < c.length ? ' - ' + (c.length - passed) + ' failing' : ''}` : 'Review saved';
        state = c.length && passed < c.length ? 'fail' : 'pass';
    }
    if (stale) {
        label = 'Stale - ' + label;
        state = 'stale';
    }
    return { label, state, stale };
}
export function outputControls(m, size, tab) { return `<div class="output-title"><strong>Output</strong><nav aria-label="Output views">${['Summary', 'Checks', 'Actual', 'Expected', 'Console'].map(x => `<button data-output-tab="${x}" class="${tab === x ? 'active' : ''}" aria-pressed="${tab === x}">${x}</button>`).join('')}</nav></div><div class="output-controls"><select id="output-anchor" aria-label="Output position">${options(['artifact', 'context', 'workspace', 'right'], m.outputAnchor, { artifact: 'Below editor / canvas', context: 'Below instructions', workspace: 'Below workspace', right: 'Right side' })}</select><select id="output-size" aria-label="Output size">${options(['closed', 'compact', 'half', 'expanded'], size, { closed: 'Closed', compact: 'Compact', half: 'Half height', expanded: 'Expanded' })}</select><button class="icon-button" data-shell="output-close" aria-label="Close output" title="Close output">${icon('close')}</button></div>`; }
export function outputDetail(result, tab, summary) {
    if (!result)
        return notice('No attempt yet', 'Run, simulate or record a review. This panel never substitutes fixture values for actual execution.');
    if (tab === 'Summary')
        return summary();
    if (tab === 'Actual')
        return result.rows.length ? table(result.rows, result.columns) : notice('No row result', result.error ?? 'This attempt produced no tabular rows. Inspect checks or console output.');
    if (tab === 'Console')
        return result.output ? pre(result.output) : notice(result.engine, result.error ?? result.notice ?? 'No console output for this attempt.');
    const checks = result.checks ?? [];
    if (!checks.length)
        return notice('No automated checks', 'Guided reviews do not claim executable correctness.');
    return checks.map((c, i) => { const detail = c; return `<details class="check-evidence" ${!c.passed || tab === 'Expected' ? 'open' : ''}><summary>${c.passed ? 'PASS' : 'FAIL'} - ${e(c.label)}</summary><p>${e(c.detail)}</p>${tab === 'Expected' ? (detail.expected ? table(detail.expected, detail.columns) : notice('Expected contract', 'Use the exercise criteria or Data view. This checker has no row-table expectation.')) : `${detail.actual ? '<h4>Actual</h4>' + table(detail.actual, detail.actualColumns ?? detail.columns) : ''}${detail.expected ? '<h4>Expected</h4>' + table(detail.expected, detail.columns) : ''}`}</details>`; }).join('');
}
