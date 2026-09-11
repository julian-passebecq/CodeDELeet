"""Compare the approved HTTPS deployment with the committed build; read-only.
Preview HTML may contain only the separately verified, observed Netlify drawer.
Production HTML and all other assets require identical bytes, without normalization.
"""
from pathlib import Path
from datetime import datetime, timezone
import difflib, hashlib, json, os, re, time, urllib.request, urllib.error
from hosted_bytes import compare_asset
ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('BASE_URL', '').rstrip('/')
if not re.fullmatch(r'https://(?:deploy-preview-\d+--)?leetdejul\.netlify\.app', BASE):
    raise SystemExit('BASE_URL must be the existing CodeDELeet production or PR preview origin')
PREVIEW = BASE.startswith('https://deploy-preview-')
OUT = ROOT / 'evidence/coordinator'
OUT.mkdir(parents=True, exist_ok=True)
report = {'baseURL': BASE, 'checks': [], 'deploymentWrites': False,
          'startedAt': datetime.now(timezone.utc).isoformat()}
def get(path, base=BASE):
    request = urllib.request.Request(base + '/' + path, headers={'Cache-Control': 'no-cache'})
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
        try:
            result = compare_asset(expected, data, path=name, preview=PREVIEW)
            if 'drawerDeployId' in result:
                # Validate the original bytes on Netlify's immutable, drawer-free permalink too.
                permalink = 'https://' + result['drawerDeployId'] + '--leetdejul.netlify.app'
                original, _ = get('index.html', base=permalink)
                assert original == expected, 'Immutable deployment HTML differs from the build'
                result.update(immutableHTML='exact-bytes', immutableURL=permalink,
                              immutableSHA256=hashlib.sha256(original).hexdigest())
                (OUT / 'preview-index.html').write_bytes(data)
            report['checks'].append(result)
        except (ValueError, AssertionError):
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
            raise
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
    report.update(status='PASS', verifiedAssets=len(report['checks']),
                  exactAssets=sum(c['comparison']=='exact-bytes' for c in report['checks']),
                  normalizedPreviewHTML=sum('drawerDeployId' in c for c in report['checks']),
                  headers='PASS', removedArchive='404')
except Exception as exc:
    report.update(status='FAIL', error=str(exc))
    raise
finally:
    report['finishedAt'] = datetime.now(timezone.utc).isoformat()
    (OUT / 'hosted-integrity.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))
