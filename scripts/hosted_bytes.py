"""Narrow byte comparator for Netlify's observed Deploy Preview drawer injection.
Production and every non-HTML asset remain exact-byte comparisons.
"""
import hashlib
import re

SITE_ID = '3ae5ab13-da0f-4e61-a1a2-106d869fbff0'
DRAWER = re.compile(
    rb'<div data-netlify-deploy-id="([a-f0-9]{24})" '
    + b'data-netlify-site-id="' + SITE_ID.encode() + b'" '
    + rb'data-vcs="github" style="position:fixed">\s*'
    + rb'<script async src="/\.netlify/scripts/cdp"></script>\s*</div>\s*(?=</body>)'
)

def compare_asset(expected: bytes, observed: bytes, *, path: str, preview: bool) -> dict:
    result = {'asset': path, 'sha256': hashlib.sha256(observed).hexdigest(),
              'expectedSHA256': hashlib.sha256(expected).hexdigest(), 'passed': True}
    if observed == expected:
        return {**result, 'comparison': 'exact-bytes'}
    if not preview or path != 'index.html':
        raise ValueError('Deployed bytes differ: ' + path)
    matches = list(DRAWER.finditer(observed))
    if len(matches) != 1:
        raise ValueError('Preview HTML does not contain exactly one recognized Netlify drawer')
    match = matches[0]
    restored = observed[:match.start()] + observed[match.end():]
    if restored != expected:
        raise ValueError('Preview HTML differs beyond the recognized Netlify drawer')
    return {**result, 'comparison': 'exact-after-observed-preview-drawer-removal',
            'drawerDeployId': match.group(1).decode(), 'drawerSiteId': SITE_ID,
            'removedBytes': match.end() - match.start()}
