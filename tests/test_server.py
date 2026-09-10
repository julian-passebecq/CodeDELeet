"""Stdlib tests. Optional DuckDB is skipped when not installed, never substituted silently."""
import unittest, importlib.util, pathlib, json, threading, urllib.request, urllib.error
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('studio_server',ROOT/'server/app.py')
s=importlib.util.module_from_spec(spec);spec.loader.exec_module(s)
PACK=json.loads((ROOT/'public/packs/starter.json').read_text())
SQL=[q for q in PACK['questions'] if q['engine']=='sql']
class SQLPolicy(unittest.TestCase):
 def test_select_with_and_comments(self):
  for sql in ["SELECT 1", "-- hello\nWITH x AS (SELECT 1 AS a) SELECT a FROM x", "SELECT 'DROP TABLE; it''s fine' AS text"]:self.assertTrue(s.validate_sql(sql))
 def test_blank_nontext_and_oversize(self):
  for code in ['',None,[], ' '*30001]:
   with self.subTest(code=str(code)[:15]),self.assertRaises(ValueError):s.validate_sql(code)
 def test_multiple_statements(self):
  with self.assertRaises(ValueError):s.validate_sql('SELECT 1; SELECT 2')
 def test_mutation_and_config(self):
  for code in ['DELETE FROM orders','WITH a AS (SELECT 1) DELETE FROM orders','SELECT 1; DROP TABLE orders','PRAGMA database_list','ATTACH DATABASE \'/tmp/x\' AS test','INSTALL httpfs','COPY orders TO \'/tmp/x\'']:
   with self.subTest(code=code),self.assertRaises(ValueError):s.validate_sql(code)
 def test_external_functions(self):
  for code in ["SELECT * FROM read_csv('x')","SELECT load_extension('x')","SELECT * FROM query('DROP TABLE x')","SELECT * FROM glob('/etc/*')"]:
   with self.subTest(code=code),self.assertRaises(ValueError):s.validate_sql(code)
class SQLExecution(unittest.TestCase):
 def test_reference_solutions_all_cases(self):
  for q in SQL:
   with self.subTest(question=q['id']):
    result=s.execute({'code':q['solution'],'questionId':q['id'],'tests':True},True)
    self.assertEqual(len(result['checks']),3);self.assertTrue(all(c['passed'] for c in result['checks']));self.assertIn('SQLite',result['engine'])
 def test_wrong_starter_is_not_certified(self):
  for q in SQL:self.assertFalse(all(c['passed'] for c in s.execute({'code':q['starter'],'questionId':q['id'],'tests':True},True)['checks']))
 def test_missing_custom_test_is_explicit(self):
  result=s.execute({'code':'SELECT 1 AS value','questionId':'my-custom','tests':True},True)
  self.assertNotIn('checks',result);self.assertIn('no trusted',result['notice'])
 def test_sql_error_is_reported(self):
  with self.assertRaises(Exception):s.query('SELECT not_a_column FROM orders',s.fixtures(),True)
 def test_each_connection_has_fresh_fixture(self):
  a=s.query('SELECT COUNT(*) AS n FROM orders',s.fixtures(),True);b=s.query('SELECT COUNT(*) AS n FROM orders',s.fixtures(),True);self.assertEqual(a,b)
 def test_fixture_read_only_even_below_policy(self):
  conn=s.connect_seed(s.fixtures(),True)
  try:
   with self.assertRaises(Exception):conn.execute('DELETE FROM orders')
  finally:conn.close()
 def test_output_truncation_is_explicit(self):
  cols,rows,trunc=s.query('WITH RECURSIVE nums(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM nums WHERE n<600) SELECT n FROM nums',s.fixtures(),True)
  self.assertEqual(len(rows),500);self.assertTrue(trunc)
 def test_references_return_all_customers_for_paid_revenue(self):
  q=next(q for q in SQL if q['id']=='sql-paid-revenue');r=s.execute({'code':q['solution']},True)
  self.assertEqual(len(r['rows']),4);self.assertTrue(any(row[-1]==0 for row in r['rows']))
 def test_python_reference_examples(self):
  for q in PACK['questions']:
   if q['engine']=='python':
    scope={};exec(q['solution'],scope)
    for case in q['pythonTests']:
     with self.subTest(question=q['id'],case=case['label']):self.assertEqual(scope[q.get('entrypoint','solve')](*case['args']),case['expected'])
 @unittest.skipUnless(importlib.util.find_spec('duckdb'),'Optional DuckDB not installed; not validated in this environment')
 def test_optional_duckdb_reference_suites(self):
  for q in SQL:self.assertTrue(all(c['passed'] for c in s.execute({'code':q['solution'],'questionId':q['id'],'tests':True})['checks']))
class Comparator(unittest.TestCase):
 def test_unordered_bag_preserves_duplicates(self):
  self.assertFalse(s.equivalent((['a'],[[1],[1]],False),(['a'],[[1],[2]],False),False))
 def test_order_respected(self):
  a=(['a'],[[1],[2]],False);b=(['a'],[[2],[1]],False)
  self.assertTrue(s.equivalent(a,b,False));self.assertFalse(s.equivalent(a,b,True))
 def test_columns_and_nulls_respected(self):
  self.assertFalse(s.equivalent((['a'],[[None]],False),(['a'],[[0]],False),False));self.assertFalse(s.equivalent((['a'],[[1]],False),(['b'],[[1]],False),False))
 def test_case_insensitive_column_names_and_numeric_tolerance(self):self.assertTrue(s.equivalent((['A'],[[1.000000001]],False),(['a'],[[1]],False),False))
 def test_truncated_results_never_pass(self):self.assertFalse(s.equivalent((['a'],[[1]],True),(['a'],[[1]],True),False))
class HTTPBoundary(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.server=s.ThreadingHTTPServer(('127.0.0.1',0),s.Handler);cls.server.verbose=False
  cls.port=cls.server.server_port;cls.base=f'http://127.0.0.1:{cls.port}';cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True);cls.thread.start()
 @classmethod
 def tearDownClass(cls):cls.server.shutdown();cls.server.server_close();cls.thread.join()
 def request(self,path='/api/sql',body=None,headers=None):
  req=urllib.request.Request(self.base+path,data=json.dumps(body).encode() if body is not None else None,headers=headers or {})
  try:
   with urllib.request.urlopen(req,timeout=15) as response:return response.status,response.read(),response.headers
  except urllib.error.HTTPError as ex:return ex.code,ex.read(),ex.headers
 def good_headers(self):return {'Content-Type':'application/json','X-Studio-Request':'1','Origin':self.base}
 def test_health(self):
  status,raw,headers=self.request('/api/health');self.assertEqual(status,200);self.assertTrue(json.loads(raw)['localOnly']);self.assertEqual(headers['X-Content-Type-Options'],'nosniff')
 def test_static_entry_and_modules(self):
  for path in ['/','/app/app.js','/styles.css','/packs/starter.json']:
   with self.subTest(path=path):self.assertEqual(self.request(path)[0],200)
 def test_correct_origin_runs_disposable_query(self):
  status,raw,_=self.request(body={'code':'SELECT 42 AS answer'},headers=self.good_headers());self.assertEqual(status,200);self.assertEqual(json.loads(raw)['rows'],[[42]])
 def test_missing_origin_and_foreign_origin_rejected(self):
  for origin in [None,'https://other.example','null']:
   h=self.good_headers()
   if origin is None:h.pop('Origin')
   else:h['Origin']=origin
   self.assertEqual(self.request(body={'code':'SELECT 1'},headers=h)[0],403)
 def test_missing_intent_header_rejected(self):
  h=self.good_headers();h.pop('X-Studio-Request');self.assertEqual(self.request(body={'code':'SELECT 1'},headers=h)[0],403)
 def test_host_header_rejected(self):self.assertEqual(self.request('/api/health',headers={'Host':'evil.example'})[0],403)
 def test_mutation_returns_error_without_query(self):self.assertEqual(self.request(body={'code':'DELETE FROM orders'},headers=self.good_headers())[0],400)
 def test_unknown_endpoint_rejected(self):self.assertEqual(self.request('/api/python',{'code':'print(1)'},self.good_headers())[0],404)
 def test_request_size_cap(self):self.assertEqual(self.request(body={'code':'x'*51000},headers=self.good_headers())[0],413)
if __name__=='__main__':unittest.main()
