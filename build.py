"""HOLDEM GOSU 빌드: 소스 → 단일 HTML

사용법
  python3 build.py                 # docs/index.html (일반 웹용) + dist/poker-decision.html (Claude 아티팩트용)
  python3 build.py <공유 주소>      # 아티팩트 초대 링크의 기본 주소를 지정
"""
import glob, os, sys

share = sys.argv[1] if len(sys.argv) > 1 else ''
R = lambda p: open(p, encoding='utf-8').read()

def script(share_base):
    probs = ''.join(R(f) for f in sorted(glob.glob('problems/*.js')))
    app1 = R('src/app1.js').replace("const SHARE_BASE = '';", f"const SHARE_BASE = {share_base!r};")
    js = '\n'.join([R('src/engine.js'), 'const PROBLEMS = []; const P = o => PROBLEMS.push(o);', probs,
                    R('src/table.js'), R('src/store.js'), app1, R('src/admin.js'), R('src/simcore.js'), R('src/simview.js'), R('src/coach-config.js'), R('src/coach.js'), R('src/app2.js')])
    assert '</script' not in js
    return js

HEAD = '''<title>HOLDEM GOSU</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Noto+Sans+KR:wght@400;500;700;800;900&family=Roboto+Condensed:wght@700&display=swap">
<style>
''' + R('src/style_a.css') + '\n' + R('src/style_b.css') + '\n' + R('src/style_c.css') + '\n' + R('src/coach.css') + '\n' + R('src/academy.css') + '''
</style>
'''
BODY = R('src/body.html')

# 1) Claude 아티팩트용 조각(게시할 때 문서 뼈대가 자동으로 씌워짐)
os.makedirs('dist', exist_ok=True)
frag = HEAD + BODY + '<script>\n' + script(share) + '\n</script>\n'
open('dist/poker-decision.html', 'w', encoding='utf-8').write(frag)

# 2) 일반 웹(GitHub Pages 등)용 완전한 문서. 기록은 브라우저에만 저장됩니다.
os.makedirs('docs', exist_ok=True)
page = ('<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
        'body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n'
        + HEAD + '</head>\n<body>\n' + BODY + '<script>\n' + script('') + '\n</script>\n</body>\n</html>\n')
open('docs/index.html', 'w', encoding='utf-8').write(page)
print('built dist/poker-decision.html', len(frag.encode()), 'bytes; docs/index.html', len(page.encode()), 'bytes')
