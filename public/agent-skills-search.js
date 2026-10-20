/* Agent Skills search + filters. Client-side only; loads the static index lazily on first focus/use. */
(function(){var f=document.getElementById('ss');if(!f||!window.SwarmSearchCore)return;f.hidden=false;
var $=function(i){return document.getElementById(i)},q=$('ssq'),sp=$('ssp'),sf=$('ssf'),sx=$('sss'),so=$('sso'),st=$('ss-status'),out=$('ss-results'),list=$('ss-list');
var scope={cat:f.dataset.cat||'',plat:f.dataset.plat||'',fmt:f.dataset.fmt||''},data=null,loading=null,SC=SwarmSearchCore;
var PN={};try{[].slice.call((sp||{options:[]}).options).forEach(function(o){PN[o.value]=o.text})}catch(e){}
function load(){if(loading)return loading;loading=Promise.all([fetch('/agent-skills-index.json').then(function(r){return r.json()}),fetch('/agent-skills-vocab.json').then(function(r){return r.json()})]).then(function(a){
data={rows:SC.prepare(a[0].map(function(r){return{name:r[0],description:r[1],category:r[2],category_name:r[3],auth:r[4],pricing:r[6],plats:' '+r[5]+' ',path:r[7],fmtname:r[8],os:r[9]||''}})),vocab:a[1],known:SC.mkVocab(a[1])}}).catch(function(){loading=null;throw 0});return loading}
function val(el){return el?el.value:''}
function pass(e){var p=scope.plat||val(sp);if(p&&e.plats.indexOf(' '+p+' ')<0)return false;var os=val(so);if(os){var l=(' '+e.os.toLowerCase()+' ');if(os==='any'){if(e.os)return false}else if(l.indexOf(' '+os+' ')<0)return false}return true}
function badge(t,c){var b=document.createElement('span');b.className='badge'+(c?' '+c:'');b.textContent=t;return b}
function card(e){var a=document.createElement('a');a.className='card';a.href=e.path;var h=document.createElement('h3');h.textContent=e.name;var p=document.createElement('p');p.textContent=e.description;
a.append(h,p,badge(e.pricing==='s'?'Includes Scripts':e.pricing==='i'?'Instructions Only':'Scripts Unknown',e.pricing==='s'?'warn':e.pricing==='i'?'ok':''),badge('Third-Party'),badge(e.fmtname));if(e.os)e.os.split(' ').forEach(function(o){a.append(badge(o,'os'))});return a}
function apply(){var term=q.value.trim(),fm=scope.fmt||val(sf),sc=val(sx),pl=scope.plat||val(sp),os=val(so),active=term||fm||sc||pl||os;
if(!active){out.hidden=true;out.replaceChildren();if(list)list.hidden=false;st.textContent='';return}
load().then(function(){if(q.value.trim()!==term)return;var o={};if(scope.cat)o.category=scope.cat;if(fm)o.auth=fm;if(sc)o.pricing=sc;
var r=SC.run(data.rows,data.vocab,data.known,term,o),hits=r.hits.filter(function(h){return pass(h.e)});
if(list)list.hidden=true;out.hidden=false;
if(!hits.length){var p=document.createElement('p');p.textContent='No matches. Try fewer words or clear the filters.';out.replaceChildren(p);st.textContent='0 results';return}
var cap=term?hits:hits.slice().sort(function(a,b){return a.e.name<b.e.name?-1:1});
out.replaceChildren.apply(out,cap.slice(0,120).map(function(h){return card(h.e)}));
st.textContent=hits.length+' result'+(hits.length===1?'':'s')+(r.corrected?' — showing results for "'+r.corrected+'"':'')+(hits.length>120?' (first 120 shown)':'')+(val(so)&&val(so)!=='any'?'. Showing only skills made for this OS. Most other skills work on any OS. Clear the OS filter to see them all.':'')}).catch(function(){if(list)list.hidden=false;out.hidden=true;st.textContent='Search is unavailable right now. Browse the lists on this page.'})}
var tm;q.addEventListener('focus',function(){load().catch(function(){})},{once:true});q.addEventListener('input',function(){clearTimeout(tm);tm=setTimeout(apply,60)});
[sp,sf,sx,so].forEach(function(el){if(el)el.addEventListener('change',apply)});if(so)so.addEventListener('change',function(){try{var u=new URL(location.href);if(so.value)u.searchParams.set('os',so.value);else u.searchParams.delete('os');history.replaceState(null,'',u)}catch(e){}});
try{var u=new URLSearchParams(location.search);if(u.get('q')){q.value=u.get('q')}if(u.get('platform')&&sp)sp.value=u.get('platform');if(u.get('format')&&sf)sf.value=u.get('format');if(u.get('scripts')&&sx)sx.value=u.get('scripts');if(u.get('os')&&so){so.value=String(u.get('os')).toLowerCase();if(!so.value)so.value=''}if(location.search)apply()}catch(e){}
})();
