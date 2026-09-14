"""Package Expo web export for offline review and an inline mobile preview.
Optional dependency for compact inline fonts: pip install fonttools
"""
from pathlib import Path
from io import BytesIO
import re,base64
from fontTools import subset
root=Path(__file__).resolve().parents[1]
out=root.parent/'deliverables';out.mkdir(exist_ok=True)
web=root/'dist'
html=(web/'index.html').read_text()
source=next((web/'_expo/static/js/web').glob('*.js')).read_text()
full=source;compact=source
for p in (web/'assets').rglob('*.ttf'):
 path='/'+str(p.relative_to(web));data=base64.b64encode(p.read_bytes()).decode()
 full=full.replace(path,'data:font/ttf;base64,'+data)
 options=subset.Options();font=subset.load_font(str(p),options);sub=subset.Subsetter(options=options)
 sub.populate(unicodes=list(range(32,256))+list(range(8192,8304))+[8594,8592]);sub.subset(font)
 b=BytesIO();font.save(b);compact=compact.replace(path,'data:font/ttf;base64,'+base64.b64encode(b.getvalue()).decode())
html=re.sub(r'<script src="[^"]+" defer></script>',lambda m:'<script>'+full.replace('</script','<\\/script')+'</script>',html)
html=re.sub(r'<link rel="icon"[^>]+>','',html)
(out/'lifeos-preview.html').write_text(html)
compact=compact.replace("document.getElementById('root')","document.getElementById('lifeos-ios-preview')").replace('window.localStorage','window.__lifeosPreviewStorage')
(root.parent/'inline-bundle.js').write_text(compact.replace('</script','<\\/script'))
print('Offline preview:',len(html),'bytes; inline JS:',len(compact),'bytes')
