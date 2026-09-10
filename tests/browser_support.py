"""Portable Playwright executable selection; never modifies browser policies."""
import os, shutil

def launch_browser(playwright):
    executable = os.getenv('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser')
    options = {'headless': True, 'args': ['--no-sandbox']}
    if executable:
        options['executable_path'] = executable
    return playwright.chromium.launch(**options)
