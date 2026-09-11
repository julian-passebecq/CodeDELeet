import type { Presentation } from './layout-controller.js';
import { THEME_DATA } from './theme-data.js';
export function applyTheme(p:Presentation):void{
 const root=document.documentElement,tokens=THEME_DATA[p.theme];root.dataset.theme=p.theme;root.dataset.terminal=p.terminal;root.dataset.density=p.density;
 for(const [name,value]of Object.entries(tokens))if(name!=='label')root.style.setProperty('--t-'+name.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),value);
 root.style.setProperty('--text-size',p.textSize+'px');root.style.colorScheme=p.theme==='slate-dark'?'dark':'light';
}
export function contrast(a:string,b:string):number{const l=(s:string)=>{const c=[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};const x=l(a),y=l(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
