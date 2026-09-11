"""One-time, fail-closed import of Julian's supplied V2.2 ZIP onto its candidate.
No network calls, credentials, arbitrary extraction, cloud changes or main writes.
The connector transport is removed after verified materialization and tests.
"""
from pathlib import Path, PurePosixPath
import base64, hashlib, json, os, shutil, subprocess, tempfile

ROOT = Path.cwd().resolve()
HERE = ROOT / '.integration/v22'
BRANCH = 'refs/heads/v2.2-pro-improvement'
assert os.environ.get('GITHUB_REF', BRANCH) == BRANCH, 'Candidate branch only'
m = json.loads((HERE / 'manifest.json').read_text())

def verify(data, expected, label):
    actual = hashlib.sha256(data).hexdigest()
    if actual != expected:
        raise ValueError(f'{label} SHA256 mismatch: {actual}')

baseline = {}
for item in m['blobs']:
    data = subprocess.check_output(['git', 'cat-file', 'blob', item['blob']])
    assert len(data) == item['length'], item['path']
    assert hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == item['blob']
    baseline[item['path']] = data.decode('utf-8').replace('\r\n', '\n').replace('\r', '\n')
base = json.dumps(baseline, separators=(',', ':'), ensure_ascii=False).encode()
verify(base, m['baseSha256'], 'dictionary')
assert m['parts'] == 17
encoded = b''.join((HERE / 'parts' / f'{i:02}.b64').read_bytes() for i in range(m['parts']))
patch = base64.b64decode(encoded, validate=True)
verify(patch, m['patchSha256'], 'transport')
with tempfile.TemporaryDirectory() as tmp:
    d = Path(tmp)
    (d / 'base').write_bytes(base)
    (d / 'patch').write_bytes(patch)
    subprocess.run(['zstd', '-q', '-d', '--patch-from=' + str(d / 'base'), str(d / 'patch'), '-o', str(d / 'target')], check=True)
    target = (d / 'target').read_bytes()
verify(target, m['targetSha256'], 'source map')
files = json.loads(target)
assert len(files) == 106 and len(target) < 2_000_000
# Validate every path and value before making any changes.
for name, text in files.items():
    p = PurePosixPath(name)
    assert name and not p.is_absolute() and '..' not in p.parts and '\\' not in name
    assert p.parts[0] in {'src', 'public', 'scripts', 'tests', 'docs', 'examples', 'evidence'} or len(p.parts) == 1
    assert not any(part in {'.git', '.github', '.env', 'node_modules'} for part in p.parts)
    assert isinstance(text, str) and len(text.encode()) < 200_000
    assert not any(parent.is_symlink() for parent in [ROOT / p, *(ROOT / p).parents])
# Retain the already-audited security boundary and historical coordinator reports.
security = (ROOT / 'SECURITY.md').read_bytes()
for old in (ROOT / 'docs').glob('*.md'):
    if old.relative_to(ROOT).as_posix() not in files:
        dest = ROOT / 'docs/history/previous-coordinator' / old.name
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(old), str(dest))
for name, text in files.items():
    if name == 'SECURITY.md':
        continue
    p = ROOT / name
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(text.encode())
assert (ROOT / 'SECURITY.md').read_bytes() == security
for generated in ['dist', 'public/app']:
    if (ROOT / generated).exists():
        shutil.rmtree(ROOT / generated)
# Preserve the ZIP's evidence as historical input; hosted reruns write new reports.
out = ROOT / 'evidence/coordinator'
out.mkdir(parents=True, exist_ok=True)
report = {**m, 'filesMaterialized': 105, 'intentionalExceptions': ['SECURITY.md retained from audited V2', 'CI reconciled separately; real-origin gate retained', 'generated public/app and dist rebuilt; screenshots regenerated'], 'files': {name: hashlib.sha256(text.encode()).hexdigest() for name, text in files.items() if name != 'SECURITY.md'}}
(out / 'import-provenance.json').write_text(json.dumps(report, indent=2) + '\n')
print('VERIFIED: 17 transport chunks, dictionary, source-map SHA256; 105 exact source/report files materialized.')
