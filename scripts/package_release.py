#!/usr/bin/env python3
"""Create and verify source, static-build and evidence ZIPs without remote actions.

Run after the release tests. Uses only the standard library; never uploads files.
The output directory must not be inside a packaged source directory.
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
FONT_SUFFIXES = {'.ttf', '.otf', '.woff', '.woff2'}
STAMP = (2026, 9, 10, 0, 0, 0)


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def candidates(root: Path) -> list[Path]:
    files: list[Path] = []
    for path in sorted(root.rglob('*')):
        relative = path.relative_to(root)
        if EXCLUDED.intersection(relative.parts) or path.suffix == '.pyc':
            continue
        if path.is_symlink():
            raise ValueError(f'Symlink is not permitted in release: {relative}')
        if not path.is_file():
            continue
        if (path.suffix.lower() in FONT_SUFFIXES | {'.zip', '.ipynb'}
                or path.name.startswith('.env')):
            raise ValueError(f'Unexpected private/bulk file in release: {relative}')
        files.append(path)
    return files


def write_zip(destination: Path, entries: dict[str, bytes]) -> None:
    with zipfile.ZipFile(destination, 'w', compression=zipfile.ZIP_DEFLATED,
                         compresslevel=9) as archive:
        for name, data in sorted(entries.items()):
            if name.startswith('/') or '..' in Path(name).parts or '\\' in name:
                raise ValueError(f'Unsafe entry: {name}')
            info = zipfile.ZipInfo(name, date_time=STAMP)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = (0o100755 if name.endswith('.sh') else 0o100644) << 16
            archive.writestr(info, data, compresslevel=9)
    with zipfile.ZipFile(destination) as archive:
        if archive.testzip() is not None:
            raise ValueError(f'CRC verification failed: {destination}')
        if len(archive.namelist()) != len(set(archive.namelist())):
            raise ValueError('Duplicate archive entry')
        if set(archive.namelist()) != set(entries):
            raise ValueError('Archive membership mismatch')
        for name, expected in entries.items():
            if archive.read(name) != expected:
                raise ValueError(f'Byte comparison failed: {name}')


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, default=ROOT / 'release-artifacts')
    args = parser.parse_args()
    out = args.out.resolve()
    if out == ROOT or (ROOT in out.parents and out != ROOT / 'release-artifacts'):
        parser.error('Use an external output directory or the default release-artifacts.')
    out.mkdir(parents=True, exist_ok=True)
    package = json.loads((ROOT / 'package.json').read_text())
    if package['version'] != '2.2.0':
        raise ValueError('This release packager expects version 2.2.0.')
    test_report = json.loads((ROOT / 'evidence/v22/test-results.json').read_text())
    if test_report['testChecksFailed'] or test_report['testChecksPassed'] != 242:
        raise ValueError('Expected V2.2 test summary was not found.')
    # These check reports remain evidence of their runs, not a fresh CI invocation.
    for name, expected in [('fixture-report.json', 42), ('ui-legacy-report.json', 68),
                           ('ui-shell-report.json', 30), ('release-integrity-report.json', 22)]:
        report = json.loads((ROOT / 'evidence/v22' / name).read_text())
        if report['passed'] != expected or report['failed'] or report.get('pageErrors'):
            raise ValueError(f'Release check is not green: {name}')
    files = [p for p in candidates(ROOT) if p != ROOT / 'SHA256SUMS.txt']
    manifest = ''.join(f'{sha256(p.read_bytes())}  {p.relative_to(ROOT).as_posix()}\n'
                       for p in files)
    (ROOT / 'SHA256SUMS.txt').write_text(manifest, encoding='utf-8')
    source_entries = {p.relative_to(ROOT).as_posix(): p.read_bytes()
                      for p in candidates(ROOT)}
    build_entries = {p.relative_to(ROOT / 'dist').as_posix(): p.read_bytes()
                     for p in candidates(ROOT / 'dist')}
    inventory = json.loads((ROOT / 'evidence/v22/build-files.json').read_text())
    if len(build_entries) != inventory['count']:
        raise ValueError('Build asset count differs from tested inventory.')
    for item in inventory['files']:
        if sha256(build_entries[item['path']]) != item['sha256']:
            raise ValueError(f'Build changed since recorded tests: {item["path"]}')
    source_path = out / 'CodeDELeet_V2_2_Full_Source.zip'
    build_path = out / 'CodeDELeet_V2_2_Static_Build.zip'
    write_zip(source_path, source_entries)
    write_zip(build_path, build_entries)
    with zipfile.ZipFile(source_path) as archive:
        lines = archive.read('SHA256SUMS.txt').decode('utf-8').splitlines()
        if len(lines) != len(source_entries) - 1:
            raise ValueError('Source manifest completeness failed.')
        for line in lines:
            expected, name = line.split('  ', 1)
            if not re.fullmatch('[0-9a-f]{64}', expected) or sha256(archive.read(name)) != expected:
                raise ValueError(f'Source manifest verification failed: {name}')
    verification = {
        'version': '2.2.0',
        'status': 'PASS: actual archive CRC, membership, bytes and source manifest verified',
        'source': {'file': source_path.name, 'entries': len(source_entries),
                   'bytes': source_path.stat().st_size, 'sha256': sha256(source_path.read_bytes()),
                   'manifestVerifiedFiles': len(source_entries) - 1},
        'build': {'file': build_path.name, 'entries': len(build_entries),
                  'bytes': build_path.stat().st_size, 'sha256': sha256(build_path.read_bytes()),
                  'treeSha256': inventory['buildTreeSha256'], 'allFilesMatchTestedInventory': True},
        'safety': {'duplicateEntries': False, 'unsafePaths': False, 'symlinks': False,
                   'embeddedNotebooksOrZipArchives': False, 'fontBinaries': False,
                   'nodeModulesOrEnvironmentFiles': False},
        'runtimePromotion': 'UNVERIFIED: not implied by archive validation',
        'note': 'This script packages existing local evidence; it does not rerun tests, upload or deploy.'
    }
    verification_bytes = (json.dumps(verification, indent=2) + '\n').encode()
    (out / 'CodeDELeet_V2_2_Package_Verification.json').write_bytes(verification_bytes)
    evidence_entries = {name: data for name, data in source_entries.items()
                        if ((name.startswith('docs/') and not name.startswith('docs/history/'))
                            or name.startswith('evidence/') or name.startswith('tests/')
                            or name.startswith('scripts/'))}
    evidence_entries['PACKAGE_VERIFICATION.json'] = verification_bytes
    evidence_entries['00_EVIDENCE_START_HERE.md'] = (
        '# CodeDELeet V2.2 - actual evidence\n\n'
        'Start with `docs/V2_2_TEST_REPORT.md`, `evidence/v22/test-results.json`, '
        'and `evidence/v22/gallery.html`. `PACKAGE_VERIFICATION.json` records the '
        'actual source/build archive hashes and byte/CRC verification.\n\n'
        'Tests and scripts are included for inspection. Run them from the complete '
        'source ZIP, not this evidence-only ZIP. The runtime network gate is '
        'explicitly UNVERIFIED; local passes are not hosted-runtime proof.\n\n'
        'Seven new shell screenshots and ten exercise regression screenshots '
        'are actual compiled-UI captures. No GitHub or Netlify operation was performed.\n'
    ).encode()
    evidence_path = out / 'CodeDELeet_V2_2_Evidence.zip'
    write_zip(evidence_path, evidence_entries)
    paths = [source_path, build_path, evidence_path, out / 'CodeDELeet_V2_2_Package_Verification.json']
    (out / 'CodeDELeet_V2_2_SHA256SUMS.txt').write_text(
        ''.join(f'{sha256(p.read_bytes())}  {p.name}\n' for p in paths), encoding='utf-8')
    print(json.dumps({'artifacts': [{'file': str(p), 'bytes': p.stat().st_size,
                                    'sha256': sha256(p.read_bytes())} for p in paths],
                      'zipVerification': 'PASS', 'runtimePromotion': 'UNVERIFIED'}, indent=2))
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (OSError, ValueError, KeyError, zipfile.BadZipFile) as exc:
        print(f'Packaging failed: {exc}', file=sys.stderr)
        sys.exit(1)
