(function(){
var data=null;
function load(){return data?Promise.resolve(data):fetch('/directory.json').then(function(r){return r.json()}).then(function(d){data=d.entries;return data})}
var SW={to:1,'for':1,the:1,a:1,an:1,and:1,of:1,'in':1,on:1,'with':1,api:1,apis:1,tool:1,tools:1};
function stem(t){return t.length>5?t.replace(/ations?$/,'at').replace(/(ings?|ions?|ers?|es|ed|s|e)$/,''):t}
function terms(q){var w=q.split(/\s+/).filter(Boolean),k=w.filter(function(t){return !SW[t]});return (k.length?k:w).map(stem)}
function score(e,ts){var n=e.name.toLowerCase(),c=(e.category_name+' '+e.category).toLowerCase(),d=e.description.toLowerCase(),x=(e.auth+' '+e.pricing).toLowerCase(),s=0;
for(var i=0;i<ts.length;i++){var t=ts[i],m=0;if(n===t)m=12;else if(n.indexOf(t)===0)m=9;else if(n.indexOf(t)>-1)m=7;else if(c.indexOf(t)>-1)m=4;else if(d.indexOf(t)>-1)m=2;else if(x.indexOf(t)>-1)m=1;if(!m)return 0;s+=m}return s}
window.swarmSearch=function(input,out,opts){opts=opts||{};var max=opts.max||30;
function run(){var q=input.value.trim().toLowerCase();if(!q){out.classList.add('hidden');out.replaceChildren();return}
load().then(function(all){var ts=terms(q),hits=all.map(function(e){return[score(e,ts),e]}).filter(function(h){return h[0]>0}).sort(function(a,b){return b[0]-a[0]}).slice(0,max);
out.classList.remove('hidden');
if(!hits.length){out.textContent='No matches. Try fewer words, or submit the tool at /submit/.';return}
out.replaceChildren.apply(out,hits.map(function(h){var e=h[1],a=document.createElement('a');a.className='card';a.href=e.swarmnest_url;var t=document.createElement('h3');t.textContent=e.name;var p=document.createElement('p');p.textContent=e.description;var b=document.createElement('span');b.className='badge';b.textContent=e.category_name;a.append(t,p,b);return a}))})}
input.addEventListener('input',run);if(input.value)run()}})();
