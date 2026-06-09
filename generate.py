#!/usr/bin/env python3
"""Build PROGRESS.html with Mermaid.js diagram, export to PROGRESS.pdf via Playwright."""

import markdown, os, re
from playwright.sync_api import sync_playwright

OUT = "/mnt/EXT4_512GB/evan/3d-unet-snn/email-phishing-agent"

css = """
@page { size: A4; margin: 0.8cm; @bottom-center { content: counter(page); font-size: 7pt; color: #666; } }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif; background:#fff; color:#000; font-size: 7.5pt; line-height: 1.25; margin:0; padding:0; }
h1 { color:#000; font-size:12pt; border-bottom:1px solid #ccc; padding-bottom:2pt; margin:0 0 3pt 0; }
h2 { color:#000; font-size:9pt; margin:3pt 0 1pt 0; }
h3 { color:#444; font-size:8pt; margin:2pt 0 1pt 0; }
p { margin: 2pt 0; }
table { width:100%; border-collapse:collapse; margin:2pt 0; font-size:8pt; }
th,td { border:1px solid #ccc; padding:2pt 3pt; text-align:left; }
th { background:#eee; color:#000; font-weight:600; }
pre, code { background:#f5f5f5; font-family: 'SF Mono', 'Fira Code', monospace; }
pre { border:1px solid #ccc; border-radius:3px; padding:3pt 6pt; font-size:7pt; white-space:pre-wrap; }
code { padding:1pt 2pt; border-radius:2pt; font-size:7.5pt; }
ul { margin:1pt 0; padding-left:12pt; }
li { margin:0; }
.page { page-break-before: always; }
.page:first-of-type { page-break-before: auto; }
.mermaid { text-align:center; margin:8pt 0; max-width:100%; }
"""

with open(f"{OUT}/PROGRESS.md") as f:
    raw = f.read()

parts = raw.split("<!-- PAGE -->")
pages_html = ""
for part in parts:
    part = part.strip()
    if part:
        pages_html += f"<div class='page'>{markdown.markdown(part, extensions=['tables', 'fenced_code'])}</div>"

# Replace mermaid code blocks with div.mermaid for HTML rendering
pages_html = re.sub(
    r'<pre><code class="language-mermaid">(.*?)</code></pre>',
    r'<div class="mermaid">\1</div>',
    pages_html,
    flags=re.DOTALL
)

html = f"""<!DOCTYPE html><html><head><meta charset="utf-8">
<style>{css}</style>
<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
<script>mermaid.initialize({{startOnLoad:true, theme:'base', themeVariables:{{primaryColor:'#fff', primaryTextColor:'#000', primaryBorderColor:'#333', lineColor:'#666', secondaryColor:'#eee', tertiaryColor:'#fff', fontSize:'11px'}}}})</script>
</head><body>{"".join(pages_html)}</body></html>"""

html_path = f"{OUT}/PROGRESS.html"
with open(html_path, "w") as f:
    f.write(html)
print("PROGRESS.html written")

# Export to PDF via Playwright
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto(f"file://{html_path}", wait_until="networkidle")
    page.wait_for_timeout(2000)
    page.pdf(path=f"{OUT}/PROGRESS.pdf", format="A4", print_background=True)
    browser.close()
print("PROGRESS.pdf generated")
