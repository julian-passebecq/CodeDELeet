/** Compact global/exercise header. Learning state and navigation remain owned by app.ts. */
import { WORKSPACES, escapeHTML as e } from '../core.js';
import type { Question, Workspace } from '../types.js';
import { icon } from '../ui.js';
import { runSummary } from './output-dock.js';

export interface HeaderContext {
    categoryId?: string;
    categoryLabel?: string;
    workspace: Workspace;
    current: Question;
    bookmark: boolean;
    caseAttempt: boolean;
    previousDisabled: boolean;
    nextDisabled: boolean;
    busy: boolean;
    navExpanded?: boolean;
    clock: string;
    executionLabel: string;
    actionLabel: string;
    result: ReturnType<typeof runSummary>;
}

export function labButtons(workspace: Workspace): string {
    return Object.entries(WORKSPACES).map(([key, lab]) =>
        `<button type="button" class="lab-switch ${key === workspace ? 'active' : ''}" data-workspace="${key}" aria-label="${e(lab.title)}" title="${e(lab.title)}" aria-pressed="${key === workspace}">${icon(lab.icon)}<span class="lab-name">${e(lab.short)}</span></button>`
    ).join('');
}

export function modeButton(mode:'practice'|'learn'):string{return `<button class="app-mode-switch" data-app-mode title="Switch to ${mode==='practice'?'Learn':'Practice'}" aria-label="Switch to ${mode==='practice'?'Learn':'Practice'}">${icon(mode==='practice'?'code':'book')}<span>${mode==='practice'?'Practice':'Learn'}</span></button>`;}

export function headerHTML(c: HeaderContext): string {
    return `<div class="compact-nav">${modeButton('practice')}<button type="button" class="icon-button navigator-toggle" data-shell="nav-toggle" aria-label="Toggle exercise navigator" aria-controls="exercise-library" aria-expanded="${c.navExpanded ?? true}" title="Exercise navigator">${icon('menu')}</button><nav class="workspace-nav" aria-label="Global labs">${labButtons(c.workspace)}</nav></div>
    <div class="exercise-title"><div class="breadcrumb" title="${e(c.current.technology)} / ${e(c.current.difficulty)} / ${e(c.executionLabel)}"><button class="text-button" data-nav-home>${e(WORKSPACES[c.workspace].short)}</button>${c.categoryId?'<span aria-hidden="true">/</span><button class="text-button header-category" data-nav-category="'+e(c.categoryId)+'">'+e(c.categoryLabel??c.categoryId)+'</button>':''}<span>${e(c.current.technology)}</span><span class="level ${c.current.difficulty.toLowerCase()}">${c.current.difficulty}</span>${c.caseAttempt ? '<span class="chip">Case attempt</span>' : ''}<span class="mode-label">${e(c.executionLabel)}</span></div><h1 title="${e(c.current.title)}">${e(c.current.title)}</h1></div>
    <div class="exercise-actions"><button class="icon-button ${c.bookmark ? 'is-bookmarked' : ''}" data-action="bookmark" aria-label="Bookmark exercise" title="Bookmark exercise" aria-pressed="${c.bookmark}">${icon('bookmark')}</button><button class="timer-button" data-action="timer" aria-label="Start or pause practice timer" title="Start or pause practice timer">${icon('clock')}<span id="timer-value">${e(c.clock)}</span></button><div class="navigation-buttons"><button class="icon-button previous" data-action="previous" aria-label="Previous exercise" title="Previous exercise (Alt + Left)" ${c.previousDisabled ? 'disabled' : ''}>${icon('chevron')}</button><button class="icon-button" data-action="next" aria-label="Next exercise" title="Next exercise (Alt + Right)" ${c.nextDisabled ? 'disabled' : ''}>${icon('chevron')}</button></div><div class="run-cluster"><button id="run-status" class="run-status ${c.result.state}" data-shell="output-toggle" title="${e(c.result.label)} - Open output" aria-label="Run status: ${e(c.result.label)}. Open output" aria-live="polite">${e(c.result.label)}</button><button class="primary run-button" data-action="run" title="${e(c.actionLabel)} (Ctrl + Enter)">${icon(c.busy ? 'close' : 'play')}<span>${e(c.actionLabel)}</span></button></div></div>`;
}

export function renderHeaderDOM(host: HTMLElement, context: HeaderContext): void {
    const focused = document.activeElement as HTMLElement | null;
    const key = focused && host.contains(focused) ? ['data-action', 'data-shell', 'data-workspace'].find(k => focused.hasAttribute(k)) : undefined;
    const value = key ? focused!.getAttribute(key) : null;
    host.innerHTML = headerHTML(context);
    if (key && value) host.querySelector<HTMLElement>(`[${key}="${value}"]`)?.focus({ preventScroll: true });
}

export function discoveryHeader(workspace:Workspace,mode:'practice'|'learn',title:string,complete?:{id:string;done:boolean}):string {
 return `<div class="compact-nav">${modeButton(mode)}<button class="icon-button navigator-toggle" data-shell="nav-toggle" aria-controls="exercise-library" aria-expanded="false" aria-label="Open navigator" title="Open navigator">${icon('menu')}</button><nav class="workspace-nav" aria-label="Global labs">${labButtons(workspace)}</nav></div><div class="exercise-title"><div class="breadcrumb"><span>${mode==='learn'?'Learn':'Practice'}</span><button class="text-button" data-nav-home>${e(WORKSPACES[workspace].short)} home</button></div><h1 title="${e(title)}">${e(title)}</h1></div><div class="discovery-actions">${complete?`<button class="primary" data-lesson-complete="${e(complete.id)}" ${complete.done?'disabled':''}>${complete.done?'Completed':'Mark complete'}</button>`:'<button class="secondary" data-nav-search>Search</button>'}</div>`;
}
