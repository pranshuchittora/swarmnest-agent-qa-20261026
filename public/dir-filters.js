/* Directory filters: Pricing (incl. Open Source), Auth and OS on category and group pages. Static and client-side.
   Category mode filters the entry cards (and in-category search). Group mode recounts each category card. URL params p, a, os are kept in sync. */
(function(){var f=document.getElementById('df');if(!f)return;f.hidden=false;
var mode=f.getAttribute('data-mode'),st=document.getElementById('cs-status'),sels=[].slice.call(f.querySelectorAll('select[data-f]')),q=document.getElementById('cq');
var P=new URLSearchParams(location.search);sels.forEach(function(s){var v=P.get(s.dataset.f);if(v&&[].some.call(s.options,function(o){return o.value===v}))s.value=v});
function cur(){var o={};sels.forEach(function(s){if(s.value)o[s.dataset.f]=s.value});return o}
function ok(d,o){if(o.p){if(o.p==='oss'){if(d.oss!=='1')return false}else if(d.pricing!==o.p)return false}
 if(o.a&&d.auth!==o.a)return false;if(o.os&&(' '+(d.os||'')+' ').indexOf(' '+o.os+' ')<0)return false;return true}
function sync(o){var u=new URLSearchParams(location.search);['p','a','os'].forEach(function(k){if(o[k])u.set(k,o[k]);else u.delete(k)});var s=u.toString();history.replaceState(null,'',location.pathname+(s?'?'+s:''))}
function say(t){st.textContent=t}
if(mode==='group'){var cards=[].slice.call(document.querySelectorAll('#gf-list > a'));
 cards.forEach(function(c){c._e=(c.dataset.e||'').split('|').filter(Boolean).map(function(x){var p=x.split(',');return{pricing:p[0],auth:p[1],oss:p[2],os:(p[3]||'').replace(/\./g,' ')}});c._b=c.querySelector('.cnt');c._h=c.getAttribute('href').split('?')[0]});
 var apply=function(){var o=cur(),any=Object.keys(o).length,tot=0,cats=0,qs=new URLSearchParams(o).toString();
  cards.forEach(function(c){var n=c._e.filter(function(d){return ok(d,o)}).length;tot+=n;if(n)cats++;c.hidden=any&&!n;c._b.textContent=n+(n===1?' Tool':' Tools');c.setAttribute('href',c._h+(qs?'?'+qs:''))});
  say(any?tot+' matching tools in '+cats+' categor'+(cats===1?'y':'ies'):'');sync(o)};
 sels.forEach(function(s){s.addEventListener('change',apply)});apply();return}
var list=document.getElementById('cs-list'),out=document.getElementById('cs-results'),cards=[].slice.call(list.children),cat=list.getAttribute('data-cat'),data=null,loading=null;
function load(){if(loading)return loading;loading=Promise.all([fetch('/search-index.json').then(function(r){return r.json()}),fetch('/search-vocab.json').then(function(r){return r.json()})]).then(function(a){var SC=window.SwarmSearchCore;
 var rows=SC.prepare(a[0].filter(function(r){return r[2]===cat}).map(function(r){return{name:r[0],description:r[1],category:r[2],category_name:r[3],auth:r[4],pricing:r[5],swarmnest_url:r[6]}}));data={rows:rows,vocab:a[1],known:SC.mkVocab(a[1])}}).catch(function(){loading=null;throw 0});return loading}
var byUrl={};cards.forEach(function(c){byUrl[c.getAttribute('href')]=c});
function apply(){var o=cur(),term=q?q.value.trim():'';sync(o);
 if(!term){out.hidden=true;out.replaceChildren();list.hidden=false;var n=0;cards.forEach(function(c){var y=ok(c.dataset,o);c.hidden=!y;if(y)n++});say(Object.keys(o).length?n+' result'+(n===1?'':'s'):'');return}
 load().then(function(){if(q.value.trim()!==term)return;var r=window.SwarmSearchCore.run(data.rows,data.vocab,data.known,term,{category:cat});
  var hits=r.hits.map(function(h){return byUrl[h.e.swarmnest_url.replace(/^https?:\/\/[^/]+/,'')]}).filter(function(c){return c&&ok(c.dataset,o)});
  list.hidden=true;out.hidden=false;
  if(!hits.length){var p=document.createElement('p');p.textContent='No matches in this category. Try fewer words or clear the filters, or search the whole directory.';out.replaceChildren(p);say('0 results');return}
  out.replaceChildren.apply(out,hits.map(function(c){var k=c.cloneNode(true);k.hidden=false;return k}));
  say(hits.length+' result'+(hits.length===1?'':'s')+(r.corrected?' — showing results for "'+r.corrected+'"':''))}).catch(function(){list.hidden=false;out.hidden=true;say('Search is unavailable right now. Browse the list below.')})}
var tm;if(q){q.addEventListener('focus',function(){load().catch(function(){})},{once:true});q.addEventListener('input',function(){clearTimeout(tm);tm=setTimeout(apply,60)})}
sels.forEach(function(s){s.addEventListener('change',apply)});if(Object.keys(cur()).length)apply();
})();
