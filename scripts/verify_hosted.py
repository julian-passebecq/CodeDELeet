"""Compare the approved HTTPS deployment with the committed build; read-only."""
from pathlib import Path
import difflib, hashlib, json, os, re, time, urllib.request, urllib.error
ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('BASE_URL', '').rstrip('/')
if not re.fullmatch(r'https://(?:deploy-preview-\d+--)?leetdejul\.netlify\.app', BASE):
    raise SystemExit('BASE_URL must be the existing CodeDELeet production or PR preview origin')
OUT = ROOT / 'evidence/coordinator'
OUT.mkdir(parents=True, exist_ok=True)
report = {'baseURL': BASE, 'checks': [], 'deploymentWrites': False}
def get(path):
    request = urllib.request.Request(BASE + '/' + path, headers={'Cache-Control': 'no-cache'})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read(), response.headers
try:
    expected = (ROOT / 'dist/app/app.js').read_bytes()
    for attempt in range(30):
        try:
            data, _ = get('app/app.js')
            if data == expected:
                break
        except (OSError, urllib.error.URLError):
            pass
        time.sleep(10)
    else:
        raise RuntimeError('Netlify did not serve the exact candidate within the retry budget')
    for p in sorted((ROOT / 'dist').rglob('*')):
        if not p.is_file():
            continue
        name = p.relative_to(ROOT / 'dist').as_posix()
        data, headers = get(name)
        expected = p.read_bytes()
        if data != expected:
            mismatch = OUT / 'hosted-mismatch'
            mismatch.mkdir(exist_ok=True)
            (mismatch / 'expected.bin').write_bytes(expected)
            (mismatch / 'observed.bin').write_bytes(data)
            report['mismatch'] = {'asset': name, 'expectedSHA256': hashlib.sha256(expected).hexdigest(), 'observedSHA256': hashlib.sha256(data).hexdigest(), 'expectedBytes': len(expected), 'observedBytes': len(data)}
            try:
                diff = ''.join(difflib.unified_diff(expected.decode('utf-8').splitlines(True), data.decode('utf-8').splitlines(True), fromfile='committed/'+name, tofile='served/'+name))
                (mismatch / 'difference.diff').write_text(diff)
                print('STRICT DEPLOYMENT MISMATCH\n' + diff[:18000], flush=True)
            except UnicodeDecodeError:
                pass
            raise AssertionError('Deployed bytes differ: ' + name)
        report['checks'].append({'asset': name, 'sha256': hashlib.sha256(data).hexdigest(), 'passed': True})
    _, headers = get('index.html')
    assert headers.get('X-Content-Type-Options') == 'nosniff'
    assert headers.get('Referrer-Policy') == 'strict-origin-when-cross-origin'
    assert 'microphone=()' in headers.get('Permissions-Policy', '')
    assert 'no-cache' in headers.get('Cache-Control', '')
    try:
        get('companion/Deepnote_Interview_Suite_v1_4.zip')
    except urllib.error.HTTPError as exc:
        assert exc.code == 404
    else:
        raise AssertionError('Removed notebook archive remains public')
    report.update(status='PASS', matchedAssets=len(report['checks']), headers='PASS', removedArchive='404')
except Exception as exc:
    report.update(status='FAIL', error=str(exc))
    raise
finally:
    (OUT / 'hosted-integrity.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))
