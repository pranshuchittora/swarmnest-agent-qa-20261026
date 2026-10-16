/* Swarmnest search core — shared by the browser (public/search.js) and /api/v1/search. Do not edit the generated copies. */
var SwarmSearchCore=(function(){
var SW={to:1,'for':1,the:1,a:1,an:1,and:1,of:1,'in':1,on:1,'with':1,api:1,apis:1,tool:1,tools:1};
function stem(t){return t.length>5?t.replace(/ations?$/,'at').replace(/(ings?|ions?|ers?|es|ed|s|e)$/,''):t}
function nz(x){return x.toLowerCase().replace(/[-_\/]+/g,' ')}
function words(s){return s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)}
function norm(q){return q.toLowerCase().replace(/[^a-z0-9+#.\s-]/g,' ').replace(/\s+/g,' ').trim().slice(0,200)}
function osa(a,b,max){var m=a.length,n=b.length;if(Math.abs(m-n)>max)return max+1;var p2=null,p=[],i,j;for(j=0;j<=n;j++)p[j]=j;
for(i=1;i<=m;i++){var c=[i],lo=i;for(j=1;j<=n;j++){var v=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a.charCodeAt(i-1)===b.charCodeAt(j-1)?0:1));
if(i>1&&j>1&&a.charCodeAt(i-1)===b.charCodeAt(j-2)&&a.charCodeAt(i-2)===b.charCodeAt(j-1))v=Math.min(v,p2[j-2]+1);c[j]=v;if(v<lo)lo=v}
if(lo>max)return max+1;p2=p;p=c}return p[n]}
// vocab: array of [word,freq] ; returns best correction for an unknown term or null
function correct(t,vocab,known){if(t.length<4||known[t]||/[0-9.+#]/.test(t))return null;var max=t.length>=8?2:1,best=null,bd=9,bf=-1;
for(var i=0;i<vocab.length;i++){var w=vocab[i][0];if(Math.abs(w.length-t.length)>max)continue;var d=osa(t,w,max);if(d>max)continue;
if(d<bd||(d===bd&&vocab[i][1]>bf)){best=w;bd=d;bf=vocab[i][1]}}return best}
function prepare(rows){rows.forEach(function(e){if(e._n!==undefined)return;e._n=e.name.toLowerCase();e._c=(e.category_name+' '+e.category).toLowerCase();e._d=e.description.toLowerCase();e._x=e.auth+' '+e.pricing;e._cn=nz(e.category_name);e._nn=nz(e.name);e._dn=nz(e.description)});return rows}
function mkVocab(vocab){var k={};vocab.forEach(function(v){k[v[0]]=1});return k}
function score(e,ts){var s=0;for(var i=0;i<ts.length;i++){var t=ts[i],m=0;if(e._n===t)m=12;else if(e._n.indexOf(t)===0)m=9;else if(e._n.indexOf(t)>-1)m=7;else if(e._c.indexOf(t)>-1)m=4;else if(e._d.indexOf(t)>-1)m=2;else if(e._x.indexOf(t)>-1)m=1;if(!m)return 0;s+=m}return s}
function bonus(e,Q,ts){if(Q.indexOf(' ')<0)return 0;var b=0;if(e._cn.indexOf(Q)>-1)b+=20;if(e._nn.indexOf(Q)>-1)b+=15;if(e._dn.indexOf(Q)>-1)b+=5;return b}
function run(rows,vocab,known,q,o){o=o||{};q=norm(q||'');var filt=rows.filter(function(e){return(!o.category||e.category===o.category)&&(!o.auth||e.auth===o.auth)&&(!o.pricing||e.pricing===o.pricing)});
var raw=q.split(' ').filter(Boolean).slice(0,8),corrected=false,fixed=raw.map(function(t){return t});
function pick(list){var k=list.filter(function(t){return !SW[t]});return k.length?k:list}
function go(list,Q){var ts=pick(list).map(stem);return filt.map(function(e){var s=ts.length?score(e,ts):1;return[s&&ts.length?s+bonus(e,Q,ts):s,e]}).filter(function(h){return h[0]>0})}
var hits=go(raw,raw.join(' '));
if(!hits.length&&raw.length){fixed=raw.map(function(t){var c=correct(t,vocab,known);if(c){corrected=true;return c}return t});
 if(corrected)hits=go(fixed,fixed.join(' '))}
// uncorrected terms may still be fine when another term is wrong: try correcting only terms that matched nothing alone
hits.sort(function(a,b){return b[0]-a[0]||a[1].name.length-b[1].name.length||(a[1].name<b[1].name?-1:1)});
return{query:q,corrected:corrected?fixed.join(' '):null,total:hits.length,hits:hits.map(function(h){return{score:h[0],e:h[1]}})}}
return{run:run,prepare:prepare,mkVocab:mkVocab,norm:norm,words:words}})();

export default SwarmSearchCore;
