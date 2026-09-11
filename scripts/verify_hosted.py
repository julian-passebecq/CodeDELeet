"""Compare an approved CodeDELeet HTTPS deployment with this checkout's build.
Read-only: no secrets, deployment operations or writes to user storage.
"""
from pathlib import Path
import hashlib, json, os, re, time, urllib.request, urllib.error
ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('BASE_URL', '').rstrip('/')
if not re.fullmatch(r'https://(?:deploy-preview-\d+--)?leetdejul\.netlify\.app', BASE):
    raise SystemExit('BASE_URL must be the existing CodeDELeet production or PR preview origin')
report = {'baseURL': BASE, 'checks': [], 'deploymentWrites': False}
def get(path):
    request = urllib.request.Request(BASE + '/' + path, headers={'Cache-Control': 'no-cache'})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read(), response.headers
try:
    # Wait for exact candidate bytes, not merely a page answering 200.
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
        assert data == p.read_bytes(), 'Deployed bytes differ: ' + name
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
    out = ROOT / 'evidence/coordinator'
    out.mkdir(parents=True, exist_ok=True)
    (out / 'hosted-integrity.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))
