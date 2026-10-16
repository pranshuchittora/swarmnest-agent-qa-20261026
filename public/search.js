(function(){
var data=null;
function load(){return data?Promise.resolve(data):fetch('/search-index.json').then(function(r){return r.json()}).then(function(a){data=a.map(function(r){return{name:r[0],description:r[1],category:r[2],category_name:r[3],auth:r[4],pricing:r[5],swarmnest_url:r[6]}});return data})}
var SW={to:1,'for':1,the:1,a:1,an:1,and:1,of:1,'in':1,on:1,'with':1,api:1,apis:1,tool:1,tools:1};
function stem(t){return t.length>5?t.replace(/ations?$/,'at').replace(/(ings?|ions?|ers?|es|ed|s|e)$/,''):t}
function terms(q){var w=q.split(/\s+/).filter(Boolean),k=w.filter(function(t){return !SW[t]});return (k.length?k:w).map(stem)}
var nz=function(x){return x.toLowerCase().replace(/[-_\/]+/g,' ')};
function bonus(e,q){if(!q||q.indexOf(' ')<0)return 0;var Q=nz(q),b=0,cn=nz(e.category_name);if(cn.indexOf(Q)>-1)b+=20;if(nz(e.name).indexOf(Q)>-1)b+=15;if(nz(e.description).indexOf(Q)>-1)b+=5;return b}
function score(e,ts){var n=e.name.toLowerCase(),c=(e.category_name+' '+e.category).toLowerCase(),d=e.description.toLowerCase(),x=(e.auth+' '+e.pricing).toLowerCase(),s=0;
for(var i=0;i<ts.length;i++){var t=ts[i],m=0;if(n===t)m=12;else if(n.indexOf(t)===0)m=9;else if(n.indexOf(t)>-1)m=7;else if(c.indexOf(t)>-1)m=4;else if(d.indexOf(t)>-1)m=2;else if(x.indexOf(t)>-1)m=1;if(!m)return 0;s+=m}return s}

function lev(a,b){var m=a.length,n=b.length,p=[],i,j;for(j=0;j<=n;j++)p[j]=j;for(i=1;i<=m;i++){var c=[i];for(j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c}return p[n]}
function fscore(e,ts){var nm=e.name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean),words=nm.concat((e.category_name+' '+e.description).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)),s=0;
for(var i=0;i<ts.length;i++){var t=ts[i],best=9,tol=t.length>=7?2:1;for(var j=0;j<words.length;j++){var w=words[j],d;if(w.indexOf(t)===0)d=0;else if(t.length<4)continue;else d=Math.min(lev(t,w.slice(0,t.length)),lev(t,w));if(d<=tol&&(d+=Math.abs(w.length-t.length)*0.05)<best){best=d;if(j<nm.length)best-=0.5}}if(best===9)return 0;s+=4-best}return s}
window.swarmSearch=function(input,out,opts){opts=opts||{};var max=opts.max||30;
function run(){var q=input.value.trim().toLowerCase();if(!q){out.classList.add('hidden');out.replaceChildren();return}
load().then(function(all){var ts=terms(q),hits=all.map(function(e){var sc=score(e,ts);return[sc?sc+bonus(e,q):0,e]}).filter(function(h){return h[0]>0}).sort(function(a,b){return b[0]-a[0]}).slice(0,max);var fz=false;if(!hits.length){fz=true;hits=all.map(function(e){return[fscore(e,ts),e]}).filter(function(h){return h[0]>0}).sort(function(a,b){return b[0]-a[0]}).slice(0,max)}
out.classList.remove('hidden');
if(!hits.length){out.textContent='No matches. Try fewer words, or submit the tool at /submit/.';return}
out.replaceChildren.apply(out,hits.map(function(h){var e=h[1],a=document.createElement('a');a.className='card';a.href=e.swarmnest_url;var t=document.createElement('h3');t.textContent=e.name;var p=document.createElement('p');p.textContent=e.description;var b=document.createElement('span');b.className='badge';b.textContent=e.category_name;a.append(t,p,b);return a}))})}
var tm;input.addEventListener('input',function(){clearTimeout(tm);if(!input.value.trim())run();else tm=setTimeout(run,60)});input.addEventListener('focus',load,{once:true});if(input.value)run()}})();
