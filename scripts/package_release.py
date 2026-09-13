#!/usr/bin/env python3
"""Package the tested V2.4 tree into ONE complete source/build/evidence ZIP.

No remote actions and no implicit test execution. External blocked gates remain
visible; they do not become PASS because the archive was created successfully.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED = {'.git', 'node_modules', '__pycache__', '.pytest_cache', 'release-artifacts'}
PRIVATE = {'references', 'private_handoff', 'OFFLINE_REFERENCE_LIBRARY_DO_NOT_PUBLISH',
           'REFERENCE_INDEX', 'PROTOTYPE', '09_PRIVATE_REFERENCE_LIBRARY_DO_NOT_PUBLISH'}
FORBIDDEN = {'.zip', '.ipynb', '.ttf', '.otf', '.woff', '.woff2', '.pem', '.key'}
STAMP = (2026, 9, 12, 0, 0, 0)


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load(relative: str) -> dict:
    return json.loads((ROOT / relative).read_text(encoding='utf-8'))


def candidates(root: Path) -> list[Path]:
    result: list[Path] = []
    for path in sorted(root.rglob('*')):
        rel = path.relative_to(root)
        if EXCLUDED.intersection(rel.parts) or path.suffix == '.pyc':
            continue
        if PRIVATE.intersection(rel.parts):
            raise ValueError(f'Private research must not be packaged: {rel}')
        if path.is_symlink():
            raise ValueError(f'Symlink rejected: {rel}')
        if not path.is_file():
            continue
        if path.suffix.lower() in FORBIDDEN or path.name.startswith('.env'):
            raise ValueError(f'Unexpected private or bulk release file: {rel}')
        result.append(path)
    return result


def verify_candidate() -> tuple[dict, dict]:
    if load('package.json')['version'] != '2.4.0':
        raise ValueError('This packager expects the V2.4.0 release.')
    summary = load('evidence/v24/test-results.json')
    if summary['testChecksFailed'] != 0 or summary['testChecksPassed'] != 440:
        raise ValueError('Expected complete passing local V2.4 test summary (440 checks).')
    runs = load('evidence/v24/FINAL_TEST_RUN.json')
    if not runs['completed'] or any(r['status'] == 'FAIL' for r in runs['runs']):
        raise ValueError('Final run is incomplete or contains a failing gate.')
    required = {'typecheck', 'unit-tests', 'clean-rebuild', 'fixture-content',
                'hosted-verifier-unit', 'ui-smoke', 'v22-shell', 'v23-compact',
                'v23-layout', 'v24-acceptance', 'release-integrity'}
    passed = {r['name'] for r in runs['runs'] if r['status'] == 'PASS'}
    if not required <= passed:
        raise ValueError('Missing passing local gates: ' + ', '.join(sorted(required - passed)))
    if not load('evidence/v24/SOURCE_PRESERVATION.json')['allRetainedFilesByteIdentical']:
        raise ValueError('Retained source contracts have changed.')
    if load('evidence/v24/PRIVATE_REFERENCE_AUDIT.json')['status'] != 'PASS':
        raise ValueError('Private reference audit is not green.')
    inventory = load('evidence/v24/build-files.json')
    actual = {p.relative_to(ROOT / 'dist').as_posix(): sha256(p.read_bytes())
              for p in candidates(ROOT / 'dist')}
    expected = {f['path']: f['sha256'] for f in inventory['files']}
    if actual != expected:
        raise ValueError('Build bytes differ from the tested inventory.')
    application = load('evidence/v24/TESTED_APPLICATION.json')['files']
    for name, digest in application.items():
        if not (ROOT / name).is_file() or sha256((ROOT / name).read_bytes()) != digest:
            raise ValueError(f'Tested application changed: {name}')
    return summary, inventory


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, default=ROOT.parent.parent)
    args = parser.parse_args()
    out = args.out.resolve()
    if out == ROOT or ROOT in out.parents:
        parser.error('Use an output directory outside the source tree.')
    out.mkdir(parents=True, exist_ok=True)
    summary, inventory = verify_candidate()
    files = [p for p in candidates(ROOT) if p != ROOT / 'SHA256SUMS.txt']
    manifest = ''.join(f'{sha256(p.read_bytes())}  {p.relative_to(ROOT).as_posix()}\n'
                       for p in files)
    (ROOT / 'SHA256SUMS.txt').write_text(manifest, encoding='utf-8')
    entries = {'CodeDELeet/' + p.relative_to(ROOT).as_posix(): p.read_bytes()
               for p in candidates(ROOT)}
    destination = out / 'CodeDELeet_V2_4_Complete.zip'
    with zipfile.ZipFile(destination, 'w', compression=zipfile.ZIP_DEFLATED,
                         compresslevel=9) as archive:
        for name, data in sorted(entries.items()):
            if name.startswith('/') or '..' in Path(name).parts or '\\' in name:
                raise ValueError(f'Unsafe archive path: {name}')
            info = zipfile.ZipInfo(name, date_time=STAMP)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = (0o100755 if name.endswith('.sh') else 0o100644) << 16
            archive.writestr(info, data, compresslevel=9)
    with zipfile.ZipFile(destination) as archive:
        if archive.testzip() is not None:
            raise ValueError('Archive CRC verification failed.')
        names = archive.namelist()
        if len(names) != len(set(names)) or set(names) != set(entries):
            raise ValueError('Archive membership/uniqueness verification failed.')
        for name, data in entries.items():
            if archive.read(name) != data:
                raise ValueError('Archive differs from source: ' + name)
        lines = archive.read('CodeDELeet/SHA256SUMS.txt').decode().splitlines()
        if len(lines) != len(entries) - 1:
            raise ValueError('Incomplete source hash manifest.')
        for line in lines:
            digest, name = line.split('  ', 1)
            if not re.fullmatch('[0-9a-f]{64}', digest) or sha256(archive.read('CodeDELeet/' + name)) != digest:
                raise ValueError('Source manifest mismatch: ' + name)
    verification = {
        'version': '2.4.0', 'status': 'PASS', 'artifact': destination.name,
        'bytes': destination.stat().st_size, 'sha256': sha256(destination.read_bytes()),
        'archiveFiles': len(entries), 'sourceManifestVerifiedFiles': len(entries) - 1,
        'buildFilesVerified': inventory['count'], 'buildTreeSha256': inventory['buildTreeSha256'],
        'localChecksPassed': summary['testChecksPassed'], 'localChecksFailed': summary['testChecksFailed'],
        'verification': ['ZIP CRC', 'unique safe paths', 'all source bytes', 'full source manifest',
                         'tested build inventory', 'tested application hashes'],
        'safety': {'privateReferenceDirectories': False, 'fontBinaries': False,
                   'nestedArchivesOrNotebooks': False, 'environmentOrKeyFiles': False,
                   'nodeModulesOrGitDatabase': False, 'symlinks': False},
        'promotionStatus': 'EXTERNAL GATES BLOCKED / NOT ATTEMPTED. See V24_TEST_REPORT.md.',
        'remoteActions': [],
        'note': 'One complete source ZIP includes dist and evidence. Packaging does not run tests or promote a deployment.'
    }
    proof = out / 'CodeDELeet_V2_4_Package_Verification.json'
    proof.write_text(json.dumps(verification, indent=2) + '\n', encoding='utf-8')
    sums = out / 'CodeDELeet_V2_4_SHA256SUMS.txt'
    sums.write_text(''.join(f'{sha256(p.read_bytes())}  {p.name}\n' for p in [destination, proof]), encoding='utf-8')
    print(json.dumps(verification, indent=2))
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (OSError, ValueError, KeyError, zipfile.BadZipFile) as exc:
        print(f'Packaging failed: {exc}', file=sys.stderr)
        sys.exit(1)
