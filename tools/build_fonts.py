"""Fetch the page's web fonts from Google Fonts and embed them in fonts.css as data URIs.

Usage (from the JinnanWeather folder): python -I tools/build_fonts.py index.html <empty_download_dir> fonts.css
"""
import base64
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
page, dl_dir, out_css = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
dl_dir.mkdir(parents=True, exist_ok=True)


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as res:
        return res.read()


def faces(css_url: str, keep_subsets=None):
    css = get(css_url).decode("utf-8")
    out = []
    for m in re.finditer(r"(/\* ([\w-]+) \*/\s*)?@font-face\s*{([^}]*)}", css):
        subset, body = m.group(2), m.group(3)
        if keep_subsets and subset not in keep_subsets:
            continue
        out.append((subset, body))
    return out


sources = [
    ("https://fonts.googleapis.com/css2?family=Outfit:wght@200..700&display=swap", {"latin", "latin-ext"}),
]

rules = []
for css_url, keep in sources:
    for subset, body in faces(css_url, keep):
        src = re.search(r"url\((https://[^)]+)\)", body).group(1)
        family = re.search(r"font-family:\s*'([^']+)'", body).group(1)
        style = re.search(r"font-style:\s*(\w+)", body).group(1)
        weight = re.search(r"font-weight:\s*([\d ]+);", body).group(1).strip()
        urange = re.search(r"unicode-range:\s*([^;]+);", body)
        name = f"{family.replace(' ', '')}-{style}-{subset or 'subset'}.woff2"
        data = get(src)
        (dl_dir / name).write_bytes(data)
        print(f"{name}: {len(data) / 1024:.1f} KB")
        b64 = base64.b64encode(data).decode("ascii")
        rule = (
            "@font-face {\n"
            f"  font-family: '{family}';\n  font-style: {style};\n  font-weight: {weight};\n  font-display: swap;\n"
            f"  src: url(data:font/woff2;base64,{b64}) format('woff2');\n"
        )
        if urange:
            rule += f"  unicode-range: {urange.group(1).strip()};\n"
        rules.append(f"/* {family} {style} {subset or 'page subset'} */\n" + rule + "}\n")

header = "/* Web fonts for Jinnan Weather, embedded so the page works offline and without Google access.\n" \
         "   Outfit is under the SIL Open Font License. Rebuild with tools/build_fonts.py. */\n\n"
out_css.write_text(header + "\n".join(rules), encoding="utf-8")
print(f"wrote {out_css} ({out_css.stat().st_size / 1024:.0f} KB)")
