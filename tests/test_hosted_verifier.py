"""No-network regression tests: only the observed platform snippet is accepted."""
from pathlib import Path
import sys
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from hosted_bytes import compare_asset

EXPECTED = b'<html><body><script src="app.js"></script></body></html>\n'
SNIPPET = (b'<div data-netlify-deploy-id="6aa35ae6669a950008db016e" '
           b'data-netlify-site-id="3ae5ab13-da0f-4e61-a1a2-106d869fbff0" '
           b'data-vcs="github" style="position:fixed">\n  \n  '
           b'<script async src="/.netlify/scripts/cdp"></script>\n</div>\n')
def html(snippet=SNIPPET):
    return EXPECTED.replace(b'</body>', snippet + b'</body>')

class HostedByteTests(unittest.TestCase):
    def check(self, observed, path='index.html', preview=True):
        return compare_asset(EXPECTED, observed, path=path, preview=preview)
    def test_exact_production_bytes(self):
        self.assertEqual(self.check(EXPECTED, preview=False)['comparison'], 'exact-bytes')
    def test_exact_observed_drawer_only(self):
        self.assertEqual(self.check(html())['drawerDeployId'], '6aa35ae6669a950008db016e')
    def test_no_production_normalization(self):
        with self.assertRaises(ValueError): self.check(html(), preview=False)
    def test_unknown_script_fails(self):
        with self.assertRaises(ValueError): self.check(html(SNIPPET.replace(b'/cdp', b'/other')))
    def test_wrong_site_fails(self):
        with self.assertRaises(ValueError): self.check(html(SNIPPET.replace(b'3ae5ab13', b'aaaaaaaa')))
    def test_changed_application_still_fails(self):
        with self.assertRaises(ValueError): self.check(html().replace(b'app.js', b'changed.js'))
    def test_duplicate_snippet_fails(self):
        with self.assertRaises(ValueError): self.check(html(SNIPPET + SNIPPET))
    def test_no_non_html_normalization(self):
        with self.assertRaises(ValueError): self.check(html(), path='app/app.js')
    def test_unsafe_deploy_id_fails(self):
        with self.assertRaises(ValueError): self.check(html(SNIPPET.replace(b'6aa35ae6669a950008db016e', b'evil.example/../../test')))

if __name__ == '__main__': unittest.main()
