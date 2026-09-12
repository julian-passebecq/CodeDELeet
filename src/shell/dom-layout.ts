import type { Workspace } from '../types.js';
import type { Presentation,TransientShell } from './layout-controller.js';
import { resolveLayout } from './layout-controller.js';
/** Reparent existing panel nodes; never remount an editor or a domain engine. */
export function applyShellDOM(p:Presentation,lab:Workspace,ui:TransientShell):void{
 const r=resolveLayout(p,lab,window.innerWidth,ui),root=document.querySelector<HTMLElement>('#app')!,ws=document.querySelector<HTMLElement>('#workstation')!,stage=document.querySelector<HTMLElement>('#workstation-stage')!;
 root.dataset.nav=r.navWidth===0?'hidden':r.navWidth===56?'compact':'full';root.style.setProperty('--nav-width',r.navWidth+'px');root.dataset.focus=String(ui.focus);
 stage.dataset.pinned=String(r.pinned);stage.dataset.tool=ui.tool??'';stage.style.setProperty('--tool-width',r.toolWidth+'px');
 ws.dataset.mode=r.preset.slot;ws.dataset.lab=lab;ws.dataset.context=String(r.context);ws.dataset.swapped=String(r.requested.swapped);ws.dataset.mobile=ui.mobile;ws.dataset.narrow=String(r.narrow);ws.dataset.output=r.outputSize;ws.dataset.anchor=r.outputAnchor;
 ws.classList.toggle('focus-lab',ui.focus);ws.classList.toggle('drawer-collapsed',r.outputSize==='closed');ws.style.setProperty('--split',r.split+'%');ws.style.setProperty('--output-width',r.requested.outputWidth+'px');
 document.querySelector('.navigator-toggle')?.setAttribute('aria-expanded',String(innerWidth<760?document.body.classList.contains('library-open'):r.navWidth>56));
 const tool=document.querySelector<HTMLElement>('#tool-panel')!;tool.hidden=!ui.tool||(r.narrow&&ui.mobile!=='tools');tool.style.width=r.toolWidth+'px';
 const anchor=document.querySelector<HTMLElement>('#'+r.outputAnchor+'-output')!,output=document.querySelector<HTMLElement>('#output-dock')!;
 if(output.parentElement!==anchor)anchor.append(output);
 document.querySelectorAll<HTMLElement>('.output-anchor').forEach(el=>el.hidden=el!==anchor||r.outputSize==='closed');
 output.hidden=r.outputSize==='closed';
 const available=Math.max(240,r.outputAnchor==='workspace'||r.outputAnchor==='right'?ws.clientHeight:anchor.parentElement!.clientHeight);
 const requested=r.outputSize==='half'?available*.48:r.outputSize==='expanded'?available*.78:r.requested.outputHeight;
 const height=Math.max(120,Math.min(requested,Math.max(120,available-154)));
 ws.style.setProperty('--output-height',height+'px');
 document.querySelector('#column-separator')?.setAttribute('aria-valuenow',String(r.split));document.querySelector('#drawer-separator')?.setAttribute('aria-valuenow',String(r.outputAnchor==='right'?r.requested.outputWidth:Math.round(height)));document.querySelector('#drawer-separator')?.setAttribute('aria-orientation',r.outputAnchor==='right'?'vertical':'horizontal');document.querySelector('#tool-separator')?.setAttribute('aria-valuenow',String(r.toolWidth));
 document.querySelectorAll<HTMLElement>('[data-mobile]').forEach(b=>b.classList.toggle('active',({question:'context',lab:'artifact',drawer:'output',tools:'tools'} as Record<string,string>)[b.dataset.mobile!]===ui.mobile));
}
