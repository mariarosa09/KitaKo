#!/usr/bin/env python3
"""Bundle KitaKo into one self-contained HTML file: dist/KitaKo.html

The MVC source (index.html + assets/ + js/) already runs as-is in a browser.
This script inlines the stylesheet, every local <script>, and the images so the
whole app can be shared or opened as a single file.

Usage:  python3 tools/build.py
"""
import base64, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
html = (ROOT / 'index.html').read_text(encoding='utf-8')

def inline_css(m):
    css = (ROOT / m.group(1)).read_text(encoding='utf-8')
    return '<style>\n' + css + '\n</style>'

def inline_js(m):
    code = (ROOT / m.group(1)).read_text(encoding='utf-8')
    if '</script' in code:
        raise SystemExit(f'{m.group(1)} contains "</script" and cannot be inlined')
    return f'<script>/* {m.group(1)} */\n' + code + '\n</script>'

def inline_img(m):
    data = base64.b64encode((ROOT / m.group(1)).read_bytes()).decode()
    return 'data:image/png;base64,' + data

html = re.sub(r'<link rel="stylesheet" href="(assets/[^"]+\.css)">', inline_css, html)
html = re.sub(r'<script src="(js/[^"]+\.js)"></script>', inline_js, html)
html = re.sub(r'(assets/img/[^"]+\.png)', inline_img, html)

out = ROOT / 'dist' / 'KitaKo.html'
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding='utf-8')
print(f'Built {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB)')
