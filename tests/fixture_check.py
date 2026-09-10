"""Independent fixture/reference checks. SQLite is NOT claimed as DuckDB execution.
Python references run with native CPython/pandas, NOT Pyodide. Spark source is
syntax-checked only; no Spark cluster or Deepnote workspace is invoked.
"""
from pathlib import Path
import json,sqlite3,ast,copy,zipfile,re,sys,platform
ROOT=Path(__file__).resolve().parents[1]
PACKS=[json.loads((ROOT/'public/packs'/f'{n}.json').read_text()) for n in ['starter','v2-specialists']]
QS=[q for p in PACKS for q in p['questions']]
FIX=json.loads((ROOT/'public/packs/fixtures.json').read_text())
results=[]
def record(name,kind,fn):
    try:fn();results.append({'name':name,'kind':kind,'passed':True})
    except Exception as e:results.append({'name':name,'kind':kind,'passed':False,'error':str(e)})
def sql_check(q,t):
    conn=sqlite3.connect(':memory:')
    for name,f in FIX.items():
        cols=[c['name'] for c in f['columns']]
        conn.execute(f'CREATE TABLE "{name}" ('+', '.join('"'+c['name']+'" '+c['type'] for c in f['columns'])+')')
        for row in t.get('overrides',{}).get(name,f['rows']):conn.execute(f'INSERT INTO "{name}" VALUES ('+','.join('?' for c in cols)+')',[row.get(c) for c in cols])
    cur=conn.execute(q['solution']);got=[list(row) for row in cur.fetchall()]
    assert got==t['rows'],(got,t['rows'])
    assert [c[0] for c in cur.description]==t['columns']
    conn.close()
def python_check(q,t):
    env={};exec(compile(q['solution'],q['id'], 'exec'),env)
    args=copy.deepcopy(t['args']);out=env[q.get('entrypoint','solve')](*args)
    assert out==t['expected'],(out,t['expected'])
    assert args==t['args'],'Input mutated'
for q in QS:
    for t in q.get('fixture',{}).get('sqlTests',[]):record(q['id']+' / '+t['label'],'SQLite portable-reference check',lambda q=q,t=t:sql_check(q,t))
    if q['engine']=='python':
        for t in q.get('pythonTests',[]):record(q['id']+' / '+t['label'],'native CPython/pandas reference',lambda q=q,t=t:python_check(q,t))
    if q['renderer']=='pyspark-editor':record(q['id'],'PySpark source syntax only',lambda q=q:ast.parse(q['solution']))
# Verify actual title and section text in supplied notebook backups.
archive=ROOT/'public/companion/Deepnote_Interview_Suite_v1_4.zip'
notebooks={}
with zipfile.ZipFile(archive) as z:
    for name in z.namelist():
        if name.endswith('.ipynb'):
            notebook=json.loads(z.read(name));headings=[]
            for cell in notebook['cells']:
                if cell['cell_type']=='markdown':
                    for line in ''.join(cell['source']).splitlines():
                        if re.match(r'^#{1,6} ',line):headings.append(re.sub(r'^#+\s*','',line).strip())
            if headings:notebooks[headings[0]]={'headings':headings,'path':name}
map_report=[]
for q in QS:
    for link in q.get('deepnoteLinks',[]):
        def check(link=link):
            assert link['notebook'] in notebooks,link['notebook']
            assert link['exerciseRef'] in notebooks[link['notebook']]['headings'],link['exerciseRef']
            assert link['url']=='','No invented project URLs'
        record(q['id']+' / exact notebook section','Deepnote mapping',check)
        if link['notebook'] in notebooks:map_report.append({'exerciseId':q['id'],'notebook':link['notebook'],'section':link['exerciseRef'],'archivePath':notebooks[link['notebook']]['path'],'url':link['url']})
report={'environment':{'python':platform.python_version(),'sqlite':sqlite3.sqlite_version},'limitations':['SQLite is not DuckDB-Wasm.','Native CPython/pandas is not Pyodide.','Spark source was not executed.','Deepnote references were checked inside supplied files, not a live workspace.'],'passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results),'checks':results}
(ROOT/'evidence/fixture-report.json').write_text(json.dumps(report,indent=2))
(ROOT/'docs/DEEPNOTE_MAPPING_VERIFIED.json').write_text(json.dumps(map_report,indent=2))
print(json.dumps({k:report[k] for k in ['environment','passed','failed']},indent=2))
for r in results:
    if not r['passed']:print('FAIL',r)
sys.exit(bool(report['failed']))
