#!/usr/bin/env python3
"""Local-only static host and read-only fixture SQL adapter. No shell/Python execution API.

DuckDB is preferred when installed. Otherwise SQLite (Python standard library) is used
and clearly identified in every response. Never expose this development server publicly.
"""
from __future__ import annotations
import argparse, collections, concurrent.futures, copy, importlib.util, json, os, pathlib, re
import secrets, socket, sqlite3, subprocess, sys, threading, time, urllib.parse, webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
ENGINE = 'DuckDB' if importlib.util.find_spec('duckdb') else 'SQLite (lightweight fallback)'
MAX_CODE = 30_000
MAX_ROWS = 500
CAPACITY = threading.BoundedSemaphore(2)

def strip_sql(sql: str) -> str:
    """Remove comments and string contents for conservative statement policy checks."""
    pattern = r"--[^\n]*|/\*[\s\S]*?\*/|'(?:''|[^'])*'|\"(?:\"\"|[^\"])*\""
    return re.sub(pattern, lambda m: "''" if m.group(0).startswith(("'", '"')) else ' ', sql)

def validate_sql(sql: Any) -> str:
    if not isinstance(sql, str) or not sql.strip() or len(sql) > MAX_CODE:
        raise ValueError('Enter a SQL query between 1 and 30,000 characters.')
    stripped = strip_sql(sql).strip().rstrip(';').strip()
    if not re.match(r'^(SELECT|WITH)\b', stripped, re.I):
        raise ValueError('This fixture lab allows a single read-only SELECT or WITH query.')
    if ';' in stripped:
        raise ValueError('Only one SQL statement is allowed per run.')
    forbidden = r'\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|ATTACH|DETACH|COPY|INSTALL|LOAD|EXPORT|IMPORT|PRAGMA|SET|RESET|CALL|VACUUM|REPLACE|PIVOT_WIDER)\b'
    if re.search(forbidden, stripped, re.I):
        raise ValueError('DDL, data mutation, external access and configuration commands are disabled.')
    if re.search(r'\b(read_\w+|sqlite_scan|postgres_scan|mysql_scan|httpfs|glob|query|query_table|duckdb_settings|duckdb_secrets|load_extension)\s*\(', stripped, re.I):
        raise ValueError('External/table-introspection functions are disabled in this fixture lab.')
    return sql.strip().rstrip(';').strip()

def fixtures() -> dict:
    return json.loads((PUBLIC / 'packs/fixtures.json').read_text(encoding='utf-8'))

def connect_seed(data: dict, force_sqlite: bool = False):
    if ENGINE == 'DuckDB' and not force_sqlite:
        import duckdb
        conn = duckdb.connect(':memory:', config={
            'enable_external_access': 'false', 'autoinstall_known_extensions': 'false',
            'autoload_known_extensions': 'false', 'threads': '1',
            'memory_limit': '128MB', 'max_temp_directory_size': '0B',
        })
    else:
        conn = sqlite3.connect(':memory:')
    for name, table in data.items():
        fields = ', '.join('"%s" %s' % (c['name'], c['type']) for c in table['columns'])
        conn.execute('CREATE TABLE "%s" (%s)' % (name, fields))
        cols = [c['name'] for c in table['columns']]
        rows = [[r.get(c) for c in cols] for r in table['rows']]
        if rows:
            conn.executemany('INSERT INTO "%s" VALUES (%s)' % (name, ','.join('?' for _ in cols)), rows)
    if isinstance(conn, sqlite3.Connection):
        conn.commit()
        conn.execute('PRAGMA query_only = ON')
        deadline = time.monotonic() + 3
        conn.set_progress_handler(lambda: 1 if time.monotonic() > deadline else 0, 1000)
        denied = {getattr(sqlite3, key) for key in ['SQLITE_ATTACH','SQLITE_DETACH','SQLITE_INSERT','SQLITE_UPDATE','SQLITE_DELETE','SQLITE_ALTER_TABLE','SQLITE_DROP_TABLE','SQLITE_CREATE_TABLE','SQLITE_PRAGMA']}
        def authorize(action, arg1, arg2, _db, _trigger):
            if action in denied or (action == sqlite3.SQLITE_FUNCTION and str(arg2).lower() == 'load_extension'):
                return sqlite3.SQLITE_DENY
            return sqlite3.SQLITE_OK
        conn.set_authorizer(authorize)
    return conn

def query(sql: str, data: dict, force_sqlite: bool = False) -> tuple[list[str], list[list], bool]:
    conn = connect_seed(data, force_sqlite)
    try:
        cursor = conn.execute(validate_sql(sql))
        columns = [str(c[0]) for c in cursor.description or []]
        rows = [list(row) for row in cursor.fetchmany(MAX_ROWS + 1)]
        return columns, rows[:MAX_ROWS], len(rows) > MAX_ROWS
    finally:
        conn.close()

def equivalent(actual: tuple, expected: tuple, ordered: bool) -> bool:
    ac, ar, at = actual; ec, er, et = expected
    if at or et or [c.lower() for c in ac] != [c.lower() for c in ec] or len(ar) != len(er):
        return False
    def normalize(rows):
        return [json.dumps([round(float(v), 7) if isinstance(v, (float, int)) and not isinstance(v, bool) else v for v in row], sort_keys=True, default=str) for row in rows]
    a, e = normalize(ar), normalize(er)
    return a == e if ordered else collections.Counter(a) == collections.Counter(e)

def scenario_fixtures(data: dict) -> list[tuple[str, dict]]:
    empty = copy.deepcopy(data); empty['orders']['rows'] = []
    ties = copy.deepcopy(data)
    ties['orders']['rows'].extend([
        {'order_id': 999, 'customer_id': 1, 'order_date': '2026-01-05', 'amount': 80, 'status': 'paid'},
        {'order_id': 998, 'customer_id': 3, 'order_date': '2026-01-07', 'amount': None, 'status': 'paid'},
    ])
    return [('Visible retail fixture', data), ('Customers with no orders', empty), ('Date ties, repeated amounts and NULL', ties)]

def execute(payload: dict, force_sqlite: bool = False) -> dict:
    code = validate_sql(payload.get('code'))
    start = time.perf_counter(); data = fixtures()
    actual = query(code, data, force_sqlite)
    result = {'engine': 'SQLite (lightweight fallback)' if force_sqlite else ENGINE, 'columns': actual[0], 'rows': actual[1], 'truncated': actual[2], 'elapsedMs': 0}
    if payload.get('tests'):
        pack = json.loads((PUBLIC / 'packs/starter.json').read_text(encoding='utf-8'))
        question = next((q for q in pack['questions'] if q['id'] == payload.get('questionId') and q['engine'] == 'sql'), None)
        if question:
            checks=[]
            for label, fixture in scenario_fixtures(data):
                try:
                    passed = equivalent(query(code, fixture, force_sqlite), query(question['solution'], fixture, force_sqlite), question.get('ordered',False))
                    checks.append({'label':label,'passed':passed,'detail':'Output columns, row values, duplicate multiplicity and required order match.' if passed else 'Output differs from the reference. Check joins, nulls, grain and deterministic ordering.'})
                except Exception as ex:
                    checks.append({'label':label,'passed':False,'detail':str(ex)[:1000]})
            result['checks'] = checks
        else:
            result['notice'] = 'Query executed, but no trusted server-side test suite is registered for this custom question.'
    result['elapsedMs'] = round((time.perf_counter()-start)*1000, 2)
    return result

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(PUBLIC),**kwargs)
    def log_message(self,fmt,*args):
        if self.server.verbose: super().log_message(fmt,*args)
    def allowed_host(self) -> bool:
        return self.headers.get('Host','') in (f'127.0.0.1:{self.server.server_port}', f'localhost:{self.server.server_port}')
    def end_headers(self):
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Referrer-Policy','no-referrer')
        self.send_header('X-Frame-Options','DENY')
        self.send_header('Cache-Control','no-store')
        super().end_headers()
    def respond(self,status:int,data:dict):
        raw=json.dumps(data,default=str,allow_nan=False).encode('utf-8')
        self.send_response(status); self.send_header('Content-Type','application/json; charset=utf-8'); self.send_header('Content-Length',str(len(raw))); self.end_headers(); self.wfile.write(raw)
    def do_GET(self):
        if not self.allowed_host(): return self.respond(403,{'error':'Invalid Host. This app is local-only.'})
        if urllib.parse.urlsplit(self.path).path=='/api/health':
            return self.respond(200,{'engine':ENGINE,'localOnly':True,'readOnly':True,'version':'0.1.0'})
        return super().do_GET()
    def do_POST(self):
        if not self.allowed_host(): return self.respond(403,{'error':'Invalid Host.'})
        if urllib.parse.urlsplit(self.path).path!='/api/sql': return self.respond(404,{'error':'Unknown endpoint.'})
        origin=self.headers.get('Origin')
        expected=(f'http://127.0.0.1:{self.server.server_port}',f'http://localhost:{self.server.server_port}')
        if origin not in expected or self.headers.get('X-Studio-Request')!='1' or not self.headers.get('Content-Type','').startswith('application/json'):
            return self.respond(403,{'error':'Only same-origin studio requests are accepted.'})
        try: size=int(self.headers.get('Content-Length','0'))
        except ValueError: return self.respond(400,{'error':'Invalid length.'})
        if not 0<size<=50_000: return self.respond(413,{'error':'Request is too large or empty.'})
        if not CAPACITY.acquire(blocking=False):return self.respond(429,{'error':'Two queries are already running. Try again after they finish.'})
        try:
            payload=json.loads(self.rfile.read(size));validate_sql(payload.get('code'))
            # Each run is disposable. A timeout terminates the child, including expensive SQL.
            child=subprocess.run([sys.executable,str(pathlib.Path(__file__).resolve()),'--worker'],input=json.dumps(payload),capture_output=True,text=True,timeout=12,cwd=str(ROOT))
            if child.returncode: return self.respond(400,{'error':(child.stderr or 'Query worker failed')[-1500:]})
            data=json.loads(child.stdout)
            return self.respond(400 if data.get('error') else 200,data)
        except subprocess.TimeoutExpired:return self.respond(408,{'error':'Query exceeded 12 seconds and its disposable worker was terminated.'})
        except (ValueError,TypeError,AttributeError,json.JSONDecodeError) as ex:return self.respond(400,{'error':str(ex)[:1500]})
        finally: CAPACITY.release()

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port',type=int,default=8765);parser.add_argument('--open',action='store_true');parser.add_argument('--worker',action='store_true');parser.add_argument('--verbose',action='store_true')
    args=parser.parse_args()
    if args.worker:
        try:
            # Best-effort POSIX ceiling; Windows still has disposable processes/time limits.
            if os.name=='posix':
                import resource
                resource.setrlimit(resource.RLIMIT_CPU,(10,10))
                resource.setrlimit(resource.RLIMIT_AS,(768*1024*1024,768*1024*1024))
            print(json.dumps(execute(json.load(sys.stdin)),default=str,allow_nan=False))
        except Exception as ex:print(json.dumps({'error':str(ex)[:1500]}))
        return
    try:server=ThreadingHTTPServer(('127.0.0.1',args.port),Handler)
    except OSError as ex:
        print(f'Cannot open local port {args.port}: {ex}\nTry: python server/app.py --port 8766 --open',file=sys.stderr);sys.exit(1)
    server.verbose=args.verbose
    print(f'\nData Practice Studio 0.1.0\nhttp://127.0.0.1:{args.port}\nSQL engine: {ENGINE}\nLocal only. No cloud services. Press Ctrl+C to stop.\n',flush=True)
    if args.open: webbrowser.open(f'http://127.0.0.1:{args.port}')
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()

if __name__=='__main__':main()
