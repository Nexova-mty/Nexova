import re, os

src = os.path.join(os.path.dirname(__file__), 'index-dev.html')
dst = os.path.join(os.path.dirname(__file__), 'index.html')

with open(src, 'r', encoding='utf-8') as f:
    html = f.read()

# Collapse whitespace in CSS blocks (between <style> tags)
def minify_css(m):
    css = m.group(1)
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)  # remove comments
    css = re.sub(r'\s+', ' ', css)                         # collapse whitespace
    # Remove spaces around CSS operators — EXCLUDE + and - to preserve calc()
    css = re.sub(r'\s*([{}:;,>~])\s*', r'\1', css)
    css = css.strip()
    return '<style>' + css + '</style>'

html = re.sub(r'<style>(.*?)</style>', minify_css, html, flags=re.DOTALL)

# Minify JS blocks
def minify_js(m):
    js = m.group(1)
    js = re.sub(r'(?<!:)//[^\n]*', '', js)  # remove // comments but preserve URLs (https://, http://)
    js = re.sub(r'/\*.*?\*/', '', js, flags=re.DOTALL)  # remove block comments
    js = re.sub(r'\s+', ' ', js)           # collapse whitespace
    js = js.strip()
    return '<script>' + js + '</script>'

html = re.sub(r'<script>(.*?)</script>', minify_js, html, flags=re.DOTALL)

# Collapse HTML whitespace (but keep content between tags)
html = re.sub(r'>\s+<', '><', html)
html = re.sub(r'\s{2,}', ' ', html)

with open(dst, 'w', encoding='utf-8') as f:
    f.write(html)

src_kb = os.path.getsize(src) // 1024
dst_kb = os.path.getsize(dst) // 1024
print(f'Minified: {src_kb}KB → {dst_kb}KB')
