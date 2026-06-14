#!/usr/bin/env python3
import re
import shutil
from pathlib import Path

ROOT = Path('.')
html_files = list(ROOT.rglob('*.html'))
changed = []

# regex to match href variants pointing to index.html with optional fragment
href_re = re.compile(r'href=(?P<q>["\'])(?:https?://cocoabridge\.com/)?(?:\./|/|\.\./)?index\.html(?P<frag>#[^"\']*)?(?P=q)')
# markdown link [Home](index.html)
md_re = re.compile(r'\[Home\]\((?:https?://cocoabridge\.com/)?(?:/)?index\.html\)')

for fp in html_files:
    text = fp.read_text(encoding='utf-8')
    new = href_re.sub(lambda m: f'href={m.group("q")}/{m.group("frag") or ""}{m.group("q")}', text)
    new = md_re.sub('[Home](/)', new)
    if new != text:
        bak = fp.with_suffix(fp.suffix + '.bak')
        shutil.copy2(fp, bak)
        fp.write_text(new, encoding='utf-8')
        changed.append(str(fp))

print('Updated files:')
for f in changed:
    print(f)
print(f'Total: {len(changed)}')
