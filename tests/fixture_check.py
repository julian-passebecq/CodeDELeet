"""Independent fixture/reference checks. SQLite is NOT claimed as DuckDB execution.
Python references run with native CPython/pandas, NOT Pyodide. Spark source is
syntax-checked only; no Spark cluster or Deepnote workspace is invoked.
"""
from pathlib import Path
import json,sqlite3,ast,copy,sys,platform
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
# Validate optional Deepnote template metadata without requiring or publishing notebook files.
map_report=[]
for q in QS:
    for link in q.get('deepnoteLinks',[]):
        def check(link=link):
            assert link.get('type') in {'exercise','concept','mock','reference','project'},link
            assert isinstance(link.get('label'),str) and link['label'].strip(),link
            assert isinstance(link.get('notebook'),str) and link['notebook'].strip(),link
            assert isinstance(link.get('exerciseRef'),str) and link['exerciseRef'].strip(),link
            assert link.get('url','')=='','Example mapping must not invent a live Deepnote URL'
        record(q['id']+' / Deepnote template metadata','Deepnote mapping template',check)
        map_report.append({'exerciseId':q['id'],'type':link.get('type'),'label':link.get('label'),'notebook':link.get('notebook'),'section':link.get('exerciseRef'),'url':link.get('url',''),'status':'template-only'})
report={'environment':{'python':platform.python_version(),'sqlite':sqlite3.sqlite_version},'limitations':['SQLite is not DuckDB-Wasm.','Native CPython/pandas is not Pyodide.','Spark source was not executed.','Deepnote entries are blank URL templates only; no notebook archive or live workspace was tested.'],'passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results),'checks':results}
(ROOT/'evidence/fixture-report.json').write_text(json.dumps(report,indent=2))
(ROOT/'docs/DEEPNOTE_MAPPING_VERIFIED.json').write_text(json.dumps(map_report,indent=2))
print(json.dumps({k:report[k] for k in ['environment','passed','failed']},indent=2))
for r in results:
    if not r['passed']:print('FAIL',r)
sys.exit(bool(report['failed']))
