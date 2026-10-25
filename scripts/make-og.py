from PIL import Image, ImageDraw, ImageFont, ImageChops
src=Image.open('/workspace/swarmnest-site/public/og-v2.png').convert('RGB')
BG=(17,24,39); W,H=1200,630
# extract logo (left of text)
reg=src.crop((0,0,420,630))
m=ImageChops.difference(reg,Image.new('RGB',reg.size,BG)).convert('L').point(lambda v:255 if v>30 else 0)
logo=reg.crop(m.getbbox()); print('logo',logo.size)
LH=330; logo=logo.resize((round(logo.width*LH/logo.height),LH),Image.LANCZOS)
F='/usr/share/fonts/truetype/sand-box/google/Inter/Inter-VariableFont_opsz,wght.ttf'
def font(sz,w):
    f=ImageFont.truetype(F,sz)
    try: f.set_variation_by_axes([32,w] if len(f.get_variation_axes())==2 else [w])
    except Exception as e: print(e)
    return f
f1,f2,f3=font(112,800),font(36,600),font(28,400)
lines=[('Swarmnest',f1,(255,255,255)),('Find the Tools. Build the Swarm.',f2,(251,191,36)),('The Directory for AI Agents',f3,(156,163,175))]
gaps=[26,18]
d=ImageDraw.Draw(Image.new('RGB',(1,1)))
bbs=[d.textbbox((0,0),t,font=f) for t,f,_ in lines]
tw=max(b[2]-b[0] for b in bbs); th=sum(b[3]-b[1] for b in bbs)+sum(gaps)
GAP=56; gw=logo.width+GAP+tw
x0=(W-gw)//2; cy=300  # a touch above center (315) to clear X's bottom title overlay
im=Image.new('RGB',(W,H),BG); dr=ImageDraw.Draw(im)
im.paste(logo,(x0,cy-LH//2))
tx=x0+logo.width+GAP; y=cy-th//2
for (t,f,c),b,g in zip(lines,bbs,gaps+[0]):
    dr.text((tx-b[0],y-b[1]),t,font=f,fill=c); y+=b[3]-b[1]+g
im.save('/workspace/swarmnest-site/public/og-v3.png',optimize=True); im.save('/workspace/og/og-v3-preview.png')
m=ImageChops.difference(im,Image.new('RGB',im.size,BG)).convert('L').point(lambda v:255 if v>30 else 0);print('bbox',m.getbbox())
