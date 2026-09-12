/** Compact global/exercise header. Learning state and navigation remain owned by app.ts. */
import { WORKSPACES, escapeHTML as e } from '../core.js';
import { icon } from '../ui.js';
export function labButtons(workspace) {
    return Object.entries(WORKSPACES).map(([key, lab]) => `<button type="button" class="lab-switch ${key === workspace ? 'active' : ''}" data-workspace="${key}" aria-label="${e(lab.title)}" title="${e(lab.title)}" aria-pressed="${key === workspace}">${icon(lab.icon)}<span class="lab-name">${e(lab.short)}</span></button>`).join('');
}
export function headerHTML(c) {
    return `<div class="compact-nav"><button type="button" class="icon-button navigator-toggle" data-shell="nav-toggle" aria-label="Toggle exercise navigator" aria-controls="exercise-library" aria-expanded="${c.navExpanded ?? true}" title="Exercise navigator">${icon('menu')}</button><nav class="workspace-nav" aria-label="Practice labs">${labButtons(c.workspace)}</nav></div>
    <div class="exercise-title"><div class="breadcrumb" title="${e(c.current.technology)} / ${e(c.current.difficulty)} / ${e(c.executionLabel)}"><span>${e(c.current.technology)}</span><span class="level ${c.current.difficulty.toLowerCase()}">${c.current.difficulty}</span>${c.caseAttempt ? '<span class="chip">Case attempt</span>' : ''}<span class="mode-label">${e(c.executionLabel)}</span></div><h1 title="${e(c.current.title)}">${e(c.current.title)}</h1></div>
    <div class="exercise-actions"><button class="icon-button ${c.bookmark ? 'is-bookmarked' : ''}" data-action="bookmark" aria-label="Bookmark exercise" title="Bookmark exercise" aria-pressed="${c.bookmark}">${icon('bookmark')}</button><button class="timer-button" data-action="timer" aria-label="Start or pause practice timer" title="Start or pause practice timer">${icon('clock')}<span id="timer-value">${e(c.clock)}</span></button><div class="navigation-buttons"><button class="icon-button previous" data-action="previous" aria-label="Previous exercise" title="Previous exercise (Alt + Left)" ${c.previousDisabled ? 'disabled' : ''}>${icon('chevron')}</button><button class="icon-button" data-action="next" aria-label="Next exercise" title="Next exercise (Alt + Right)" ${c.nextDisabled ? 'disabled' : ''}>${icon('chevron')}</button></div><div class="run-cluster"><button id="run-status" class="run-status ${c.result.state}" data-shell="output-toggle" title="${e(c.result.label)} - Open output" aria-label="Run status: ${e(c.result.label)}. Open output" aria-live="polite">${e(c.result.label)}</button><button class="primary run-button" data-action="run" title="${e(c.actionLabel)} (Ctrl + Enter)">${icon(c.busy ? 'close' : 'play')}<span>${e(c.actionLabel)}</span></button></div></div>`;
}
export function renderHeaderDOM(host, context) {
    const focused = document.activeElement;
    const key = focused && host.contains(focused) ? ['data-action', 'data-shell', 'data-workspace'].find(k => focused.hasAttribute(k)) : undefined;
    const value = key ? focused.getAttribute(key) : null;
    host.innerHTML = headerHTML(context);
    if (key && value)
        host.querySelector(`[${key}="${value}"]`)?.focus({ preventScroll: true });
}
