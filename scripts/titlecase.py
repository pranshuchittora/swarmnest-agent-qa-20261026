import re,sys,json,glob
SMALL={'a','an','the','and','or','of','to','in','for','on','with','at','by','but','nor','as','vs','via'}
def tok(w,first,last):
    if not w: return w
    if '-' in w and not re.search(r'[&;@/\\._]',w):
        parts=w.split('-'); n=len(parts)
        return '-'.join(tok(p,first and i==0,last and i==n-1) if i in (0,n-1) or p.lower() not in SMALL else p.lower() for i,p in enumerate(parts))
    if re.search(r'[&;@/\\._]|\d',w): return w
    m=re.match(r"^([^A-Za-z]*)([A-Za-z'’]+)([^A-Za-z]*)$",w)
    if not m: return w
    a,core,b=m.groups()
    if core!=core.lower(): return w   # mixed/caps/already titled
    if core in SMALL and not first and not last: return w
    return a+core[0].upper()+core[1:]+b
def tc(s,first=True,last=True):
    ws=s.split(' ')
    idx=[i for i,w in enumerate(ws) if w!='']
    out=list(ws); clause_start=first
    for k,i in enumerate(idx):
        w=ws[i]
        nxt=ws[idx[k+1]] if k+1<len(idx) else None
        isfirst=(first and k==0) or clause_start
        islast=(last and k==len(idx)-1) or nxt in ('—','|','–')
        out[i]=tok(w,isfirst,islast)
        clause_start = w in ('—','|','–') or w.endswith(':') or w.endswith('—')
    return ' '.join(out)
def seg(s,pat):
    """title-case static text outside regions matching pat (tags/braces); keep first/last logic by position"""
    parts=re.split('('+pat+')',s)
    res=[];n=len(parts)
    statics=[i for i in range(0,n,2) if parts[i].strip()]
    for i in range(0,n,2):
        if not parts[i].strip():
            res.append(parts[i])
            if i+1<n: res.append(parts[i+1])
            continue
        f= i==statics[0] and not any(parts[j] for j in range(1,i,2) if not parts[j].startswith('<'))
        l= i==statics[-1] and not any(parts[j] for j in range(i+1,n,2) if not parts[j].startswith('<'))
        lead=re.match(r'\s*(\d+\.|[A-Z]\.)?\s*',parts[i]); 
        t=parts[i]; m=re.match(r'^(\s*(?:\d+\.|[A-D]\.)\s*)(.*)$',t,re.S)
        lw=re.match(r'^\s*',t).group(0); tw=re.search(r'\s*$',t).group(0)
        if m: res.append(m.group(1)+tc(m.group(2).strip(),True,l)+tw)
        else: res.append(lw+tc(t.strip(),f,l)+tw)
        res[-1]=res[-1]
        if i+1<n: res.append(parts[i+1])
    return ''.join(res)
TAGBRACE=r'<[^>]*>|\{[^{}]*\}'
if __name__=='__main__':
    for t in sys.argv[1:]: print(tc(t))
