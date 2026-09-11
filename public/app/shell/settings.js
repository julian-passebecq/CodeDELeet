/** shell/settings: presentation orchestration, no engine ownership. */
import { escapeHTML as e, mergeStores, planPackImport, safeDeepnoteURL, safeId, STORAGE_KEY } from '../core.js';
import { cancelRuntime, RUNTIME_VERSIONS } from '../runtime.js';
import { activePreferences, defaultPresentation, newTransient } from '../shell/layout-controller.js';
import { download, icon, notice, options } from '../ui.js';
export function settings(ctx) {
    const dialog = ctx.$('#modal');
    dialog.innerHTML = `<form method="dialog" class="dialog-header"><div><span class="eyebrow">LOCAL-FIRST WORKSPACE</span><h2>Settings & backups</h2></div><button class="icon-button" aria-label="Close settings">${icon('close')}</button></form><div class="dialog-body"><div class="settings-section"><h3>Your progress belongs to you</h3><p>Drafts, graphs, virtual repositories, notes, confidence and history live in this browser. A new domain or branch preview has separate storage: export here and import there.</p><div class="inline-actions"><button class="primary" id="settings-export">Export my backup</button><label class="secondary file-label">Merge backup<input type="file" id="backup-import" accept="application/json,.json"></label><button class="secondary" id="snapshot-export">Export pre-V2 snapshot</button></div>${ctx.storageBlocked ? notice('Storage needs attention', 'Saving is blocked to avoid overwriting an unreadable backup. Download the raw stored value, then deliberately start a fresh local session.', 'error') + '<div class="inline-actions"><button class="secondary" id="raw-export">Download raw stored value</button><button class="secondary danger" id="storage-reset">Start fresh local storage</button></div>' : ''}</div><div class="settings-section"><h3>Content packs</h3><p>Import a versioned JSON pack. Built-in exercise IDs are protected. Updating a pack never detaches drafts or silently removes questions.</p><label class="secondary file-label">Import / update a pack<input type="file" id="pack-import" accept="application/json,.json"></label><div>${ctx.store.customPacks.map(p => `<div class="custom-pack"><strong>${e(p.title)}</strong><span>v${p.version} &middot; ${p.questions.length} exercises</span><button class="text-button" data-export-pack="${e(p.id)}">Export</button></div>`).join('')}</div></div><div class="settings-section"><h3>Deepnote companion links</h3><p>Download the blank mapping, paste your own project/notebook URLs, then import it. Only explicit HTTPS Deepnote links are displayed; no API credentials are required.</p><div class="inline-actions"><button class="secondary" id="map-export">Download URL template</button><label class="secondary file-label">Import URL mapping<input type="file" id="map-import" accept="application/json,.json"></label></div></div><div class="settings-section"><h3>Runtime & layout</h3><p>SQL: DuckDB-Wasm ${RUNTIME_VERSIONS.duckdb}. Python: Pyodide ${RUNTIME_VERSIONS.pyodide}. Optional Mermaid: ${RUNTIME_VERSIONS.mermaid}. Downloads start only on explicit use. This page contains no service credentials or backend runner.</p><div class="inline-actions"><button class="secondary" id="runtime-reset">Reset workers & download consent</button><div class="settings-presentation"><h3>Presentation preferences</h3><label>Terminal theme<select id="terminal-theme">${options(['inherit', 'light', 'dark'], ctx.presentation.terminal)}</select></label><label>Density<select id="density">${options(['comfortable', 'compact'], ctx.presentation.density)}</select></label><label>Text size<select id="text-size">${options(['13', '14', '15', '16', '17', '18'], String(ctx.presentation.textSize))}</select></label><label>Navigator width<input id="nav-width" type="range" min="200" max="320" step="8" value="${ctx.presentation.navWidth}"></label><button class="secondary" id="swap-panes">Swap context and workspace sides</button></div><button class="secondary" id="layout-reset">Reset panel layout</button></div><p class="muted">Only run code you trust. Browser workers are not a security boundary against every form of hostile JavaScript/Python interoperability.</p></div><p class="muted">Version 2.2.0 &middot; Source, tests and migration notes are included in the delivery ZIP.</p></div>`;
    dialog.showModal();
    ctx.$('#settings-export').onclick = ctx.exportBackup;
    ctx.$('#snapshot-export').onclick = () => {
        const raw = localStorage.getItem(STORAGE_KEY + '.pre-v2');
        if (raw)
            download('CodeDELeet-pre-v2.json', raw);
        else
            ctx.toast('No pre-upgrade value was present in this browser.');
    };
    if (ctx.storageBlocked) {
        ctx.$('#raw-export').onclick = () => download('CodeDELeet-raw-recovery.txt', localStorage.getItem(STORAGE_KEY) ?? 'No value available.', 'text/plain');
        ctx.$('#storage-reset').onclick = () => {
            if (confirm('Start fresh local storage? Download your raw backup first. This replaces the unreadable active value, not the pre-V2 snapshot.')) {
                ctx.storageBlocked = false;
                ctx.persist(true);
                dialog.close();
            }
        };
    }
    ctx.$('#backup-import').onchange = () => void ctx.readJSONFile(ctx.$('#backup-import'), value => { ctx.store = mergeStores(ctx.store, value, ctx.builtins); ctx.recalc(); ctx.persist(true); dialog.close(); ctx.syncImportedDraft(); ctx.toast('Backup merged. Newer drafts win; this device\'s settings are retained.'); });
    ctx.$('#pack-import').onchange = () => void ctx.readJSONFile(ctx.$('#pack-import'), value => { const plan = planPackImport(ctx.store.customPacks, value, ctx.builtins); ctx.store.customPacks = plan.packs; ctx.recalc(); ctx.persist(true); dialog.close(); ctx.shellHTML(); ctx.toast(plan.summary); });
    ctx.$('#map-export').onclick = () => download('deepnote-url-mapping.json', JSON.stringify({ schemaVersion: 1, links: ctx.mapping }, null, 2));
    ctx.$('#map-import').onchange = () => void ctx.readJSONFile(ctx.$('#map-import'), value => {
        if (value.schemaVersion !== 1 || !value.links || typeof value.links !== 'object' || Array.isArray(value.links))
            throw Error('Expected schemaVersion 1 with a links object.');
        const clean = {};
        for (const [id, links] of Object.entries(value.links)) {
            if (!safeId(id) || !Array.isArray(links) || links.length > 15)
                throw Error('Invalid mapping entry.');
            clean[id] = links.map(l => {
                if (typeof l.url !== 'string' || l.url && !safeDeepnoteURL(l.url) || !['exercise', 'concept', 'mock', 'reference', 'project'].includes(l.type) || typeof l.label !== 'string')
                    throw Error('Unsafe or invalid Deepnote link.');
                return l;
            });
        }
        ctx.store.settings.deepnoteMap = { ...ctx.store.settings.deepnoteMap, ...clean };
        ctx.persist(true);
        dialog.close();
        ctx.renderDrawer();
        ctx.toast('Deepnote links saved. Blank URLs remain hidden.');
    });
    dialog.onchange = ev => { ctx.handleShellChange(ev.target); };
    ctx.$('#swap-panes').onclick = () => { activePreferences(ctx.presentation, ctx.workspace).swapped = !activePreferences(ctx.presentation, ctx.workspace).swapped; ctx.applyLayout(); ctx.persist(true); };
    ctx.$('#runtime-reset').onclick = () => { cancelRuntime(); ctx.runEpoch++; ctx.busy = false; ctx.store.settings.runtimeConsent = false; ctx.store.settings.pyodideConsent = false; ctx.persist(true); ctx.renderHeader(); ctx.toast('Workers stopped. The next execution will ask before downloading.'); };
    ctx.$('#layout-reset').onclick = () => { ctx.presentation = defaultPresentation(); ctx.shellState = newTransient(); ctx.persist(); ctx.renderHeader(); ctx.renderLab(); ctx.renderDrawer(); ctx.applyLayout(); ctx.toast('Panel layout reset.'); };
    dialog.querySelectorAll('[data-export-pack]').forEach(b => b.onclick = () => { const p = ctx.store.customPacks.find(p => p.id === b.dataset.exportPack); download(p.id + '.json', JSON.stringify(p, null, 2)); });
}
export async function readJSONFile(ctx, input, apply) {
    const file = input.files?.[0];
    if (!file)
        return;
    try {
        if (file.size > 8000000)
            throw Error('Import limit: 8 MB.');
        const value = JSON.parse(await file.text());
        apply(value);
    }
    catch (error) {
        ctx.toast(error.message, true);
    }
    finally {
        input.value = '';
    }
}
