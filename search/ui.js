(function(){var rows=null,vocab=null,known=null;
function load(){return rows?Promise.resolve():Promise.all([fetch('/search-index.json').then(function(r){return r.json()}),fetch('/search-vocab.json').then(function(r){return r.json()})]).then(function(a){rows=SwarmSearchCore.prepare(a[0].map(function(r){return{name:r[0],description:r[1],category:r[2],category_name:r[3],auth:r[4],pricing:r[5],swarmnest_url:r[6]}}));vocab=a[1];known=SwarmSearchCore.mkVocab(vocab)})}
window.swarmSearch=function(input,out,opts){opts=opts||{};var max=opts.max||30;
function run(){var q=input.value.trim();if(!q){out.classList.add('hidden');out.replaceChildren();return}
load().then(function(){var r=SwarmSearchCore.run(rows,vocab,known,q),hits=r.hits.slice(0,max);out.classList.remove('hidden');
if(!hits.length){out.textContent='No matches. Try fewer words, or submit the tool at /submit/.';return}
var head=document.createElement('p');head.className='small';head.style.gridColumn='1/-1';head.setAttribute('data-total',r.total);head.textContent=r.total+' result'+(r.total===1?'':'s')+(r.corrected?' — showing results for "'+r.corrected+'"':'');
out.replaceChildren.apply(out,[head].concat(hits.map(function(h){var e=h.e,a=document.createElement('a');a.className='card';a.href=e.swarmnest_url;var t=document.createElement('h3');t.textContent=e.name;var p=document.createElement('p');p.textContent=e.description;var b=document.createElement('span');b.className='badge';b.textContent=e.category_name;a.append(t,p,b);return a})))})}
var tm;input.addEventListener('input',function(){clearTimeout(tm);if(!input.value.trim())run();else tm=setTimeout(run,60)});input.addEventListener('focus',load,{once:true});if(input.value)run()}})();
