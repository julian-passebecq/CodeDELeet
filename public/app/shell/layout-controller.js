export const PRESETS = [
    { id: 'code.solve', lab: 'code', slot: 'work', label: 'Solve', context: true, split: 36, output: 'artifact', view: 'Workspace' },
    { id: 'code.inspect', lab: 'code', slot: 'inspect', label: 'Data & Debug', context: true, split: 44, output: 'artifact', view: 'Workspace' },
    { id: 'code.case-study', lab: 'code', slot: 'case', label: 'Case Study', context: true, split: 36, output: 'artifact', view: 'Workspace' },
    { id: 'model.design', lab: 'model', slot: 'work', label: 'Model Designer', context: false, split: 32, output: 'workspace', view: 'Model' },
    { id: 'model.measures', lab: 'model', slot: 'inspect', label: 'Measures & Data', context: false, split: 32, output: 'artifact', view: 'Workspace' },
    { id: 'model.case-study', lab: 'model', slot: 'case', label: 'Case Study', context: true, split: 35, output: 'workspace', view: 'Workspace' },
    { id: 'pipeline.design', lab: 'pipeline', slot: 'work', label: 'Pipeline Designer', context: false, split: 30, output: 'workspace', view: 'Workspace' },
    { id: 'pipeline.investigate', lab: 'pipeline', slot: 'inspect', label: 'Run Investigator', context: false, split: 30, output: 'workspace', view: 'Run grid' },
    { id: 'pipeline.case-study', lab: 'pipeline', slot: 'case', label: 'Case Study', context: true, split: 35, output: 'workspace', view: 'Workspace' },
    { id: 'architecture.workbench', lab: 'architecture', slot: 'work', label: 'Workbench', context: true, split: 32, output: 'artifact', view: 'Workspace' },
    { id: 'architecture.investigate', lab: 'architecture', slot: 'inspect', label: 'Compare & Diagnose', context: false, split: 32, output: 'workspace', view: 'Workspace' },
    { id: 'architecture.case-study', lab: 'architecture', slot: 'case', label: 'Case Study', context: true, split: 35, output: 'workspace', view: 'Workspace' },
];
const copy = (v) => JSON.parse(JSON.stringify(v));
const clamp = (x, lo, hi, fallback) => typeof x === 'number' && Number.isFinite(x) ? Math.max(lo, Math.min(hi, x)) : fallback;
export const presetFor = (lab, slot) => PRESETS.find(p => p.lab === lab && p.slot === slot);
export function defaultMode(p) { return { split: p.split, context: p.context, swapped: false, outputAnchor: p.output, outputSize: 'closed', outputHeight: 220, outputWidth: 370, toolWidth: 380, toolPinned: false }; }
export function defaultPresentation() { return { version: 1, theme: 'sage-light', terminal: 'inherit', density: 'comfortable', textSize: 14, navWidth: 228, navCollapsed: false, modes: { code: 'work', model: 'work', pipeline: 'work', architecture: 'work' }, layouts: Object.fromEntries(PRESETS.map(p => [p.id, defaultMode(p)])) }; }
export function normalizePresentation(input, legacy) {
    const d = defaultPresentation(), v = (input && typeof input === 'object' ? input : {});
    if (['sage-light', 'fluent-light', 'fluent-soft', 'slate-dark'].includes(v.theme ?? ''))
        d.theme = v.theme;
    if (['inherit', 'light', 'dark'].includes(v.terminal ?? ''))
        d.terminal = v.terminal;
    if (v.density === 'compact')
        d.density = 'compact';
    d.textSize = clamp(v.textSize, 13, 18, 14);
    d.navWidth = clamp(v.navWidth, 200, 320, 228);
    d.navCollapsed = v.navCollapsed === true;
    for (const lab of ['code', 'model', 'pipeline', 'architecture']) {
        const mode = v.modes?.[lab];
        if (mode && ['work', 'inspect', 'case'].includes(mode))
            d.modes[lab] = mode;
    }
    for (const p of PRESETS) {
        const a = v.layouts?.[p.id];
        if (!a)
            continue;
        const m = d.layouts[p.id];
        m.split = clamp(a.split, 25, 60, m.split);
        m.context = typeof a.context === 'boolean' ? a.context : m.context;
        m.swapped = a.swapped === true;
        m.outputHeight = clamp(a.outputHeight, 120, 600, 220);
        m.outputWidth = clamp(a.outputWidth, 300, 600, 370);
        m.toolWidth = clamp(a.toolWidth, 320, 560, 380);
        m.toolPinned = a.toolPinned === true;
        if (['artifact', 'context', 'workspace', 'right'].includes(a.outputAnchor))
            m.outputAnchor = a.outputAnchor;
        if (['closed', 'compact', 'half', 'expanded'].includes(a.outputSize))
            m.outputSize = a.outputSize;
    }
    if (!input && legacy) {
        d.layouts['code.solve'].split = clamp(legacy.split, 25, 60, 36);
        d.layouts['code.solve'].outputHeight = clamp(legacy.drawerHeight, 120, 600, 220);
    }
    return d;
}
export function resolveLayout(p, lab, width, ui) {
    const preset = presetFor(lab, p.modes[lab]), m = p.layouts[preset.id], narrow = width < 1080;
    const navWidth = ui.focus ? 0 : width < 760 ? 0 : p.navCollapsed || width < 1200 ? 56 : p.navWidth;
    const context = !ui.focus && m.context;
    const available = width - navWidth - 48;
    const minWorkspace = context ? 820 : 700;
    const toolWidth = Math.max(260, Math.min(ui.toolExpanded ? Math.min(740, width - 64) : m.toolWidth, width - 56));
    const pinned = !!ui.tool && !ui.toolExpanded && !ui.focus && !narrow && m.toolPinned && available - toolWidth >= minWorkspace;
    return { preset, requested: copy(m), context, split: m.split, outputAnchor: narrow ? 'workspace' : m.outputAnchor === 'context' && !context ? 'workspace' : m.outputAnchor, outputSize: ui.focus ? (ui.focusSnapshot?.outputSize ?? 'closed') : m.outputSize, toolWidth, pinned, navWidth, narrow, focus: ui.focus };
}
export function newTransient() { return { focus: false, tool: null, toolExpanded: false, mobile: 'artifact' }; }
export function toggleFocus(ui, p) {
    if (!ui.focus) {
        ui.focusSnapshot = { tool: ui.tool, expanded: ui.toolExpanded, outputSize: 'closed', preferences: p ? copy(p) : undefined };
        ui.focus = true;
        ui.tool = null;
        ui.toolExpanded = false;
    }
    else {
        if (p && ui.focusSnapshot?.preferences) {
            const before = ui.focusSnapshot.preferences;
            p.layouts = copy(before.layouts);
            p.modes = copy(before.modes);
            p.navWidth = before.navWidth;
            p.navCollapsed = before.navCollapsed;
        }
        ui.focus = false;
        ui.tool = ui.focusSnapshot?.tool ?? null;
        ui.toolExpanded = ui.focusSnapshot?.expanded ?? false;
        ui.focusSnapshot = undefined;
    }
}
export function activePreferences(p, lab) { return p.layouts[presetFor(lab, p.modes[lab]).id]; }
export function setOutputSize(p, lab, ui, size) { if (ui.focus && ui.focusSnapshot)
    ui.focusSnapshot.outputSize = size;
else
    activePreferences(p, lab).outputSize = size; }
export function switchMode(p, lab, slot) { p.modes[lab] = slot; return presetFor(lab, slot); }
