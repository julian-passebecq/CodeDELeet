import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { headerHTML, labButtons } from '../public/app/shell/header.js';
import { themePanelHTML } from '../public/app/shell/theme-panel.js';
import { railHTML, toolHeader } from '../public/app/shell/tool-rail.js';
import { defaultPresentation, newTransient, resolveLayout, toggleFocus, PRESETS } from '../public/app/shell/layout-controller.js';

const question = {technology:'SQL', difficulty:'Easy', title:'<Latest "order">'};
const context = {workspace:'code',current:question,bookmark:false,caseAttempt:false,previousDisabled:true,nextDisabled:false,busy:false,clock:'00:00',executionLabel:'EXECUTE / DUCKDB-WASM',actionLabel:'Run & test',result:{state:'idle',label:'Not run'}};

test('V23 header contains four neutral labeled lab switches, not a brand or mode/theme select', () => {
    const html = headerHTML(context);
    assert.equal((html.match(/data-workspace=/g)||[]).length,4);
    for (const label of ['Code Lab','Model / BI Lab','Pipeline Lab','Systems / Cloud Lab']) assert.ok(html.includes(`aria-label="${label}"`));
    assert.ok(!html.includes('CodeDELeet'));
    for (const root of ['public','dist']) assert.match(fs.readFileSync(root+'/index.html','utf8'), /<title>CodeDELeet V2\.3 - Interview Workstation<\/title>/);
    assert.ok(!html.includes('<select'));
    assert.ok(html.includes('&lt;Latest &quot;order&quot;&gt;'));
    assert.ok(html.includes('title="&lt;Latest &quot;order&quot;&gt;"'));
});
test('V23 active lab is exclusive and accessible in each workspace', () => {
    for (const lab of ['code','model','pipeline','architecture']) {
        const html = labButtons(lab);
        assert.equal((html.match(/aria-pressed="true"/g)||[]).length,1);
        assert.match(html,new RegExp(`data-workspace="${lab}"[^>]+aria-pressed="true"`));
    }
});
test('V23 header retains all attempt actions, state and case navigation guard', () => {
    const html = headerHTML({...context,caseAttempt:true,bookmark:true,nextDisabled:true});
    for (const action of ['bookmark','timer','previous','next','run']) assert.ok(html.includes(`data-action="${action}"`));
    assert.ok(html.includes('id="timer-value"')); assert.ok(html.includes('id="run-status"'));
    assert.ok(html.includes('Case attempt')); assert.equal((html.match(/disabled/g)||[]).length,2);
    assert.ok(headerHTML({...context,busy:true,actionLabel:'Cancel'}).includes('<span>Cancel</span>'));
});
test('V23 rail owns modes, Focus, Theme and Settings, retaining conditional Deepnote/Inspector', () => {
    for (const lab of ['code','model','pipeline','architecture']) {
        const p=defaultPresentation(), ui=newTransient(), html=railHTML(p,lab,ui,false,false);
        for (const preset of PRESETS.filter(x=>x.lab===lab)) assert.ok(html.includes(`data-mode="${preset.slot}"`));
        assert.equal((html.match(/data-action="focus"/g)||[]).length,1);
        assert.ok(html.includes('data-tool="Theme"')); assert.ok(html.includes('data-action="settings"'));
        assert.ok(!html.includes('data-tool="Deepnote"')); assert.ok(!html.includes('data-tool="Inspector"'));
        const configured=railHTML(p,lab,ui,true,true);
        assert.ok(configured.includes('data-tool="Deepnote"')); assert.ok(configured.includes('data-tool="Inspector"'));
    }
});
test('V23 Theme uses four named native radios and an exclusive selection', () => {
    for (const id of ['sage-light','fluent-light','fluent-soft','slate-dark']) {
        const html=themePanelHTML(id);
        assert.equal((html.match(/type="radio"/g)||[]).length,4);
        assert.equal((html.match(/ checked/g)||[]).length,1);
        assert.ok(html.includes(`value="${id}" checked`));
    }
});
test('V23 Theme never steals pinned width or mutates saved tool sizing', () => {
    const p=defaultPresentation(); const ui=newTransient(); ui.tool='Theme';
    p.layouts['code.solve'].toolPinned=true; p.layouts['code.solve'].toolWidth=510;
    const before=JSON.stringify(p);
    for (const width of [1920,1600,1366,1024,390]) {
        const r=resolveLayout(p,'code',width,ui);
        assert.equal(r.pinned,false); assert.equal(r.toolWidth,320); assert.equal(JSON.stringify(p),before);
    }
    const header=toolHeader('Theme',ui,true,true);
    assert.ok(header.includes('tool-close')); assert.ok(!header.includes('tool-pin')); assert.ok(!header.includes('tool-expand'));
});
test('V23 Theme and Focus restore the pre-focus tool/layout while retaining theme choice', () => {
    const p=defaultPresentation(),ui=newTransient();ui.tool='Notes';p.layouts['code.solve'].outputAnchor='right';
    const before=structuredClone(p.layouts);
    toggleFocus(ui,p);ui.tool='Theme';p.theme='fluent-soft';toggleFocus(ui,p);
    assert.equal(ui.tool,'Notes');assert.deepEqual(p.layouts,before);assert.equal(p.theme,'fluent-soft');
});
test('V23 published files contain no research or notebook archives', () => {
    const banned=new Set(['OFFLINE_REFERENCE_LIBRARY_DO_NOT_PUBLISH','REFERENCE_INDEX','PROTOTYPE']);
    for(const root of ['public','dist']) for(const file of fs.readdirSync(root,{recursive:true})) {
        assert.ok(!file.split(/[\\/]/).some(x=>banned.has(x)),file);
        assert.ok(!/\.(zip|ipynb|deepnote|tar|tgz|gz)$/i.test(file),file);
    }
});
