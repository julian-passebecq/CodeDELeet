/** Build a zero-dependency, single-file study edition from the committed browser modules.
 * This small bundler intentionally supports ONLY this repository's static imports/exports.
 * No third-party bundler/runtime code is copied into the output.
 */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function bundle(){
 let output='const __modules = {};\n';
 for(const name of ['types','core','graph','dax','runtime','ui','app']){
  let source=fs.readFileSync(path.join(ROOT,'public/app',name+'.js'),'utf8');
  const exports=[...source.matchAll(/\bexport\s+(?:async\s+)?(?:function|const|let|class)\s+(\w+)/g)].map(m=>m[1]);
  source=source.replace(/import\s+\{([^}]+)\}\s+from\s+['"]\.\/([^'"]+)['"];?/g,(_m,items,mod)=>`const {${items.replace(/\s+as\s+/g,':')}}=__modules['./${mod}'];`);
  source=source.replace(/import\s+\*\s+as\s+(\w+)\s+from\s+['"]\.\/([^'"]+)['"];?/g,(_m,id,mod)=>`const ${id}=__modules['./${mod}'];`);
  source=source.replace(/export\s*\{\s*\};?/g,'').replace(/\bexport\s+(?=(?:async\s+)?(?:function|const|let|class)\b)/g,'');
  source=source.replaceAll('import.meta.url',"new URL('./public/app/runtime.js',location.href).href");
  if(name==='ui')source=source.replaceAll('src="./favicon.svg"',`src="data:image/svg+xml;base64,${fs.readFileSync(path.join(ROOT,'public/favicon.svg')).toString('base64')}"`);
  output+=`__modules['./${name}.js']=(()=>{\n${source}\nreturn {${exports.join(',')}};})();\n`;
 }
 return output;
}
fs.mkdirSync(path.join(ROOT,'.build'),{recursive:true});fs.writeFileSync(path.join(ROOT,'.build/browser-bundle.js'),bundle());
const resources={};for(const rel of ['packs/index.json','packs/starter.json','packs/fixtures.json'])resources['./'+rel]=fs.readFileSync(path.join(ROOT,'public',rel),'utf8');
const escapeScript=s=>s.replaceAll('<','\\u003c');
const shim=`window.__STUDIO_STANDALONE__=true;\nconst __resources=${escapeScript(JSON.stringify(resources))};\nwindow.fetch=async (url)=>{const text=__resources[String(url)];return new Response(text??'{}',{status:text===undefined?404:200,headers:{'Content-Type':'application/json'}});};\n`;
let html=fs.readFileSync(path.join(ROOT,'public/index.html'),'utf8');
html=html.replace('<link rel="stylesheet" href="./styles.css">',`<style>${fs.readFileSync(path.join(ROOT,'public/styles.css'),'utf8')}</style>`);
html=html.replace('href="./favicon.svg"',`href="data:image/svg+xml;base64,${fs.readFileSync(path.join(ROOT,'public/favicon.svg')).toString('base64')}"`);
html=html.replace('<script type="module" src="./app/app.js"></script>',`<script>${shim+bundle().replace(/<\/script/gi,'<\\/script')}</script>`);
html=html.replace('<title>Data Practice Studio</title>','<title>Data Practice Studio - no-install study edition</title>');
fs.writeFileSync(path.join(ROOT,'OPEN_STUDIO.html'),html);
console.log('Built OPEN_STUDIO.html (study, DAX subset and simulations; local SQL / Python require full launcher).');
