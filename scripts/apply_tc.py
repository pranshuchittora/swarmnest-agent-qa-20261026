import re,json,glob,sys
sys.path.insert(0,'scripts')
from titlecase import tc,seg,TAGBRACE
files=glob.glob('src/pages/**/*.astro',recursive=True)+glob.glob('src/components/*.astro')+['src/layouts/Base.astro']
# headings
H=re.compile(r'(<h[1-4]\b[^>]*>)(.*?)(</h[1-4]>)')
BTN=re.compile(r'(<(?:a|span|button)\b[^>]*\bclass="btn[^"]*"[^>]*>)(.*?)(</(?:a|span|button)>)')
def fix_line(line,fn):
    o=line
    line=H.sub(lambda m:m.group(1)+seg(m.group(2),TAGBRACE)+m.group(3),line)
    line=BTN.sub(lambda m:m.group(1)+seg(m.group(2),TAGBRACE)+m.group(3),line)
    if re.search(r'<(Base|Legal)\b',line):
        line=re.sub(r'\b(title|heading)="([^"]*)"',lambda m:f'{m.group(1)}="{tc(m.group(2))}"',line)
        line=re.sub(r'\btitle=\{`([^`]*)`\}',lambda m:'title={`'+seg(m.group(1),r'\$\{[^}]*\}')+'`}',line)
    line=re.sub(r'\bbutton="([^"]*)"',lambda m:f'button="{tc(m.group(1))}"',line)
    return line
for f in files:
    L=open(f).read().split('\n'); N=[]
    for i,l in enumerate(L):
        n=fix_line(l,f)
        if f.endswith('Base.astro') and (l.startswith(' <nav>') or (l.startswith(' <p class="small"><a'))):
            n=re.sub(r'(<a\b(?![^>]*mailto)[^>]*>)([^<]*)(</a>)',lambda m:m.group(1)+(m.group(2) if '.' in m.group(2) else tc(m.group(2)))+m.group(3),n)
        if f.endswith('Base.astro') and '<strong>Sponsor' in l:
            n=n.replace('<strong>Sponsor / advertise</strong>','<strong>Sponsor / Advertise</strong>').replace('>Get in touch<','>Get in Touch<')
        N.append(n)
    open(f,'w').write('\n'.join(N))
# data
for fn,key in (('data/categories.json','name'),('data/groups.json','name')):
    d=json.load(open(fn))
    for x in d: x[key]=tc(x[key])
    open(fn,'w').write(json.dumps(d,indent=1,ensure_ascii=False)+'\n')
# content.ts / legal.ts
for fn,pat in (('src/lib/content.ts',r"(slug:'[^']*', name:')([^']*)(', goal:)"),('src/lib/legal.ts',r"(\['/[a-z-]+/','))([^']*)(',')")):
    pass
s=open('src/lib/content.ts').read()
s=re.sub(r"(slug:'[^']*', name:')([^']*)(', goal:)",lambda m:m.group(1)+tc(m.group(2))+m.group(3),s)
open('src/lib/content.ts','w').write(s)
s=open('src/lib/legal.ts').read()
s=re.sub(r"(\['/[a-z-]+/',')([^']*)(',')",lambda m:m.group(1)+tc(m.group(2))+m.group(3),s)
open('src/lib/legal.ts','w').write(s)
