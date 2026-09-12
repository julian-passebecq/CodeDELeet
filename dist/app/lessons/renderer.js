/** Original, escaped, app-native lesson blocks. No arbitrary HTML or remote artwork. */
import { escapeHTML as e } from '../core.js';
import { blockTitle } from './validate.js';
const list = (items) => '<ul>' + items.map(x => '<li>' + e(x) + '</li>').join('') + '</ul>';
function gridTable(columns, rows) { return `<div class="lesson-table-scroll" tabindex="0" role="region" aria-label="Scrollable comparison table"><table><thead><tr>${columns.map(c => '<th scope="col">' + e(c) + '</th>').join('')}</tr></thead><tbody>${rows.map(r => '<tr>' + r.map(c => '<td>' + e(c) + '</td>').join('') + '</tr>').join('')}</tbody></table></div>`; }
/** Two-column graph stays legible on phones. Text below exposes every edge. */
export function lessonDiagram(d, key) {
    const cols = d.nodes.length <= 3 ? d.nodes.length : 3, rows = Math.ceil(d.nodes.length / cols), width = cols * 230, height = rows * 118;
    const positions = Object.fromEntries(d.nodes.map((n, i) => [n.id, { x: 10 + (i % cols) * 230, y: 15 + Math.floor(i / cols) * 118 }]));
    const marker = 'arrow-' + key;
    const edges = d.edges.map(edge => { const a = positions[edge.from], b = positions[edge.to]; const same = a.y === b.y; return `<path d="M ${a.x + (same ? 206 : 103)} ${a.y + (same ? 33 : 66)} L ${b.x + (same ? -3 : 103)} ${b.y + (same ? 33 : -3)}" marker-end="url(#${marker})"/>`; }).join('');
    return `<figure class="lesson-diagram"><div class="diagram-scroll" tabindex="0" role="region" aria-label="${e(d.label)}"><svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${key}-diagram-title"><title id="${key}-diagram-title">${e(d.label)}</title><defs><marker id="${marker}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"/></marker></defs><g class="lesson-edges">${edges}</g>${d.nodes.map(n => { const p = positions[n.id]; return `<g transform="translate(${p.x},${p.y})"><rect width="206" height="66" rx="8"/><text x="103" y="${n.detail ? 27 : 38}" text-anchor="middle">${e(n.label)}</text>${n.detail ? `<text class="node-detail" x="103" y="48" text-anchor="middle">${e(n.detail)}</text>` : ''}</g>`; }).join('')}</svg></div><figcaption>${e(d.label)}</figcaption>${d.edges.length ? `<div class="diagram-paths">${d.edges.map(edge => { const from = d.nodes.find(n => n.id === edge.from), to = d.nodes.find(n => n.id === edge.to); return `<span>${e(from.label)} &rarr; ${e(to.label)}${edge.label ? ' (' + e(edge.label) + ')' : ''}</span>`; }).join('')}</div>` : ''}</figure>`;
}
export function renderBlock(b, lessonId, questions) {
    let html = '';
    switch (b.kind) {
        case 'intro':
            html = '<p class="lesson-intro">' + e(b.text) + '</p>';
            break;
        case 'concept':
            html = '<p>' + e(b.text) + '</p>' + (b.mentalModel ? '<div class="mental-model"><span class="eyebrow">MENTAL MODEL</span><p>' + e(b.mentalModel) + '</p></div>' : '');
            break;
        case 'bullets':
        case 'keyTakeaways':
            html = list(b.items);
            break;
        case 'steps':
            html = '<ol class="lesson-steps">' + b.steps.map(s => '<li><strong>' + e(s.title) + '</strong><p>' + e(s.text) + '</p></li>').join('') + '</ol>';
            break;
        case 'code':
            html = `<div class="lesson-code-head"><span>${e(b.language)}</span><button class="text-button" data-copy-block="${e(b.id)}" aria-label="Copy ${e(b.title ?? 'code example')}">Copy code</button></div><pre class="code-block" tabindex="0"><code>${e(b.code)}</code></pre>${b.caption ? '<p class="block-caption">' + e(b.caption) + '</p>' : ''}`;
            break;
        case 'table':
            html = gridTable(b.columns, b.rows);
            break;
        case 'diagram':
            html = lessonDiagram(b.diagram, lessonId + '-' + b.id) + (b.caption ? '<p class="block-caption">' + e(b.caption) + '</p>' : '');
            break;
        case 'comparison':
            html = `<div class="lesson-comparison">${[b.left, b.right].map(col => '<div><h3>' + e(col.title) + '</h3>' + list(col.items) + '</div>').join('')}</div>`;
            break;
        case 'whenToUse':
            html = gridTable(['When you see this', 'Consider this approach'], b.items.map(i => [i.signal, i.choice]));
            break;
        case 'pitfall':
            html = '<p>' + e(b.text) + '</p>' + (b.correction ? '<p><strong>Instead: </strong>' + e(b.correction) + '</p>' : '');
            break;
        case 'workedExample':
            html = '<ol>' + b.steps.map(s => '<li>' + e(s) + '</li>').join('') + '</ol>' + (b.result ? '<p class="example-result"><strong>Result: </strong>' + e(b.result) + '</p>' : '');
            break;
        case 'checkpoint':
            html = '<p>' + e(b.question) + '</p>' + (b.choices ? list(b.choices) : '') + `<details class="lesson-checkpoint"><summary>Reveal reasoning</summary><p><strong>${e(b.answer)}</strong></p><p>${e(b.explanation)}</p></details><p class="block-caption">Self-check only. This does not score a Practice attempt.</p>`;
            break;
        case 'relatedPractice':
            html = b.exerciseIds.map(id => { const q = questions.find(q => q.id === id); return q ? `<button class="related-exercise" data-question="${e(id)}"><span><strong>${e(q.title)}</strong><small>${e(q.technology ?? q.topic)} / ${e(q.difficulty)}</small></span><span aria-hidden="true">&rarr;</span></button>` : ''; }).join('');
            break;
    }
    return `<section class="lesson-block block-${b.kind}" id="section-${e(b.id)}" data-lesson-section="${e(b.id)}" data-block-kind="${b.kind}" tabindex="-1"><h2>${e(blockTitle(b))}</h2>${html}</section>`;
}
export function lessonHTML(lesson, progress, questions, siblings) {
    const done = progress?.status === 'completed', i = siblings.findIndex(l => l.id === lesson.id), previous = siblings[i - 1], next = siblings[i + 1];
    return `<article class="lesson-reading" data-lesson-id="${e(lesson.id)}"><header class="lesson-heading"><div class="eyebrow">LEARN / ${lesson.minutes} MIN WITH EXAMPLES</div><h1 tabindex="-1">${e(lesson.title)}</h1><p class="lesson-summary">${e(lesson.summary)}</p><div class="lesson-state"><span id="lesson-progress-label">${done ? 'Completed' : 'In progress'}</span><span>Progress is separate from Practice</span></div><h2>After this lesson</h2>${list(lesson.objectives)}${lesson.prerequisites?.length ? '<p class="block-caption">Before you start: ' + lesson.prerequisites.map(e).join(' / ') + '</p>' : ''}<details class="inline-contents"><summary>Contents / jump to a section</summary><nav aria-label="Lesson sections">${lesson.blocks.map(b => `<button class="text-button" data-lesson-section-link="${e(b.id)}">${e(blockTitle(b))}</button>`).join('')}</nav></details></header>${lesson.blocks.map(b => renderBlock(b, lesson.id, questions)).join('')}<section class="lesson-resources" aria-label="Lesson resources"><h2>Resources</h2><p class="block-caption">Official documentation for further reading. Core examples and diagrams are original teaching material. Platform capabilities evolve; verify deployment-specific limits.</p>${lesson.sources.map(s => `<a href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${e(s.label)} &nearr;</a>`).join('')}</section><footer class="lesson-completion"><button class="primary" data-lesson-complete="${e(lesson.id)}" ${done ? 'disabled' : ''}>${done ? 'Lesson completed' : 'Mark lesson complete'}</button><span>No exercise is marked complete by this action.</span><nav aria-label="Adjacent lessons">${previous ? `<button class="secondary" data-lesson="${e(previous.id)}">&larr; ${e(previous.title)}</button>` : ''}${next ? `<button class="secondary" data-lesson="${e(next.id)}">Next: ${e(next.title)} &rarr;</button>` : ''}</nav></footer></article>`;
}
