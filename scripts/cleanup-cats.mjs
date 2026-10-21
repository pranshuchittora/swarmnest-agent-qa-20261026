// One-off: category cleanup (Oct 20, 2026). Merges categories, moves misplaced entries, regroups, records legacy URLs.
import fs from 'node:fs';
const J=f=>JSON.parse(fs.readFileSync(f,'utf8')), W=(f,o)=>fs.writeFileSync(f,JSON.stringify(o,null,1)+'\n');
const MERGE = { // retired -> survivor
 'open-data-portals':'open-data','web-search-engines':'search-apis','captcha-solvers':'captcha-bot-protection',
 'mac-local-llm-runners':'local-inference','ml-training-platforms':'fine-tuning','synthetic-data':'data-labeling',
 'agent-standards-specs':'agent-protocols','agent-payment-protocols':'agent-payments',
 'mcp-directories':'ai-tool-directories','api-marketplaces':'agent-marketplaces','macos-mcp-servers':'mcp-servers',
 'mac-computer-use':'mac-ai-agent-apps','team-chat':'chat-platforms','chat-bot-libraries':'chat-sdks',
 'live-chat-support':'support-helpdesk','video-conferencing-oss':'meetings-conferencing','scheduling-time':'calendars-scheduling',
 'form-backends':'form-builders','survey-tools':'form-builders','public-health-data':'government-statistics',
 'prompt-libraries':'prompt-management','speaker-diarization':'speech-transcription','email-testing':'email-verification',
 'cultural-heritage':'museum-collections','library-catalogs':'museum-collections','nutrition-data':'recipes-cooking',
 'drinks-beverages':'recipes-cooking','gifs-stickers':'stock-photos','icon-libraries':'stock-photos','web-fonts':'stock-photos',
 'live-streaming':'video-hosting','web-animation':'3d-graphics','vulnerability-intel':'code-security'};
const RENAME = {
 'open-data':['Open Data','Open datasets, public APIs and government and city open data portals.'],
 'search-apis':['Web Search APIs & Engines','Web search and retrieval APIs that give agents fresh information, plus the public search engines behind them.'],
 'site-search-engines':['Site Search','Self-hostable and hosted search engines for your own data.'],
 'captcha-bot-protection':['CAPTCHA Solving & Bot Protection','CAPTCHA and bot-detection services, and services that solve CAPTCHAs.'],
 'local-inference':['Local Inference','Run models on your own hardware, including Apple Silicon Macs (use the macOS filter).'],
 'fine-tuning':['Training & Fine-Tuning','Libraries, platforms and experiment tracking for training, fine-tuning and aligning models.'],
 'data-labeling':['Data Labeling & Synthetic Data','Annotation tools and generators for synthetic, fake and privacy-safe data.'],
 'agent-protocols':['Agent Protocols & Standards','Open protocols and web standards for agent-to-agent communication, tool use and agent-readable sites.'],
 'agent-payments':['Agent Payments','Payment rails and protocols that let AI agents pay and transact.'],
 'ai-tool-directories':['AI Tool & MCP Directories','Directories, registries and launch platforms that list AI tools and MCP servers.'],
 'agent-marketplaces':['Agent & API Marketplaces','Marketplaces and catalogs where agents, skills, tools and public APIs are published.'],
 'mcp-servers':['MCP Servers','Model Context Protocol servers and tooling that plug agents into other software, including Mac apps (use the macOS filter).'],
 'mac-ai-agent-apps':['Mac Agent Apps & Computer Use','Native AI agent apps for macOS, and computer-use agents and tools that operate a desktop by seeing the screen.'],
 'chat-platforms':['Team Chat & Messaging Platforms','Messaging platform APIs for bots, and open, self-hostable team chat.'],
 'chat-sdks':['Chat SDKs & Bot Libraries','Embeddable in-app chat SDKs and language libraries for building chat bots.'],
 'support-helpdesk':['Customer Support & Live Chat','Helpdesk platforms, website live chat and customer messaging with APIs.'],
 'meetings-conferencing':['Video Meetings & Conferencing','Video meeting APIs, meeting bots and self-hostable video conferencing.'],
 'calendars-scheduling':['Calendars, Scheduling & Time','Calendar, booking, time zone and holiday APIs for agents that manage time.'],
 'form-builders':['Forms & Surveys','Form builders, form backends and survey platforms with APIs.'],
 'government-statistics':['Government & Public Health Statistics','Official national, international and public health statistics APIs.'],
 'prompt-management':['Prompt Management & Libraries','Prompt registries, versioning and optimization tools, plus prompt collections and guides.'],
 'speech-transcription':['Speech-to-Text & Transcription','Speech recognition engines, transcription APIs and speaker diarization toolkits.'],
 'email-verification':['Email Testing & Verification','APIs that validate email addresses, and SMTP sandboxes for testing email.'],
 'museum-collections':['Museums, Libraries & Archives','Museum, cultural heritage, library and archive collection APIs.'],
 'recipes-cooking':['Food, Drink & Nutrition','Recipe, meal-planning, nutrition, cocktail and beverage data APIs.'],
 'stock-photos':['Stock Media & Design Assets','Stock photos, GIFs, icons and web fonts with search APIs.'],
 'video-hosting':['Video Hosting & Streaming','Video hosting, encoding, delivery and live streaming platforms with APIs.'],
 '3d-graphics':['3D, Graphics & Animation','3D engines, graphics and animation libraries for web, app and desktop.'],
 'code-security':['Security Scanning & Threat Intel','Static analysis, dependency and secret scanning, plus vulnerability and threat intelligence data.'],
};
const MOVES = { // entries misfiled in mcp-servers
 'google-vertex-ai':'model-hosting-inference','hugging-face-spaces':'model-hosting-inference','modelscope-hub':'model-hosting-inference',
 'ai21-labs-api':'llm-apis','stability-ai-api':'image-generation','stability-sdk-python':'image-generation',
 'openai-sdk-python':'llm-sdks-structured','cohere-sdk-python':'llm-sdks-structured','groq-sdk-python':'llm-sdks-structured',
 'openai-sdk-javascript':'llm-sdks-structured','groq-sdk-javascript':'llm-sdks-structured','openai-api-gateway-openapi-spec':'llm-sdks-structured'};
const GROUPS = [
 ['agent-building','Agent Building','MCP servers, frameworks, memory, protocols and marketplaces for agents.',['mcp-servers','agent-frameworks','agent-memory','code-execution','mac-ai-agent-apps','agent-protocols','agent-payments','voice-agents','visual-agent-builders','workflow-automation','workflow-orchestration','research-assistants','ai-tool-directories','agent-marketplaces','chat-sdks']],
 ['ai-models','AI Models & Inference','Model APIs, hosting, training, evaluation and safety.',['llm-apis','model-hosting-inference','local-inference','gpu-cloud','fine-tuning','embeddings-rerankers','llm-sdks-structured','llm-benchmarks','prompt-management','nlp-text-analysis','computer-vision','ocr-document-parsing','data-labeling','security-guardrails','ai-content-detection']],
 ['coding-developer-tools','Coding & Developer Tools','Coding agents, hosting, CI, testing, observability and security.',['ai-coding-assistants','developer-tools','code-hosting-apis','api-testing-mocking','ci-cd','cloud-dev-environments','serverless-hosting','container-orchestration','observability-evals','uptime-monitoring','feature-flags-config','domains-dns','cms-content','auth-identity','secrets-management','code-security','pdf-document-generation','qr-barcode']],
 ['web-search-scraping','Web, Search & Scraping','Search, scraping, browsers, proxies and web data.',['search-apis','site-search-engines','web-scraping-apis','scraping-libraries','no-code-scrapers','browser-automation','content-extraction','proxy-services','captcha-bot-protection','screenshot-apis','url-utilities','rss-feeds','seo-tools','web-analytics','ip-geolocation']],
 ['data-storage','Data & Databases','Vector, relational and other databases, storage, pipelines and datasets.',['vector-databases','relational-databases','nosql-key-value-stores','graph-databases','time-series-databases','data-warehouses','backend-as-a-service','no-code-databases','cloud-storage','data-etl','data-viz-bi','message-queues','event-streaming','datasets','spreadsheet-apis']],
 ['media-ai','Media: Image, Video & Audio','Generate, edit, host and transcribe images, video, speech and music.',['image-generation','image-editing-apis','video-generation','avatar-video','video-editing','programmatic-video','video-hosting','media-servers','media-cdn','speech-transcription','text-to-speech','voice-cloning','ai-dubbing','speech-datasets','meeting-notes-ai','stock-photos','sound-effects-audio','podcasts','music-apis','ai-music-generation','3d-graphics']],
 ['communication','Communication','Email, messaging, chat, meetings, social and translation.',['email-apis','email-verification','newsletters','sms-voice','push-notifications','chat-platforms','secure-messaging','support-helpdesk','meetings-conferencing','calendars-scheduling','social-media-apis','content-moderation','translation-apis']],
 ['business','Business, Commerce & Finance','Payments, commerce, CRM, HR, productivity and market data.',['payment-processing','merchant-of-record','buy-now-pay-later','cross-border-payouts','billing-invoicing','accounting-tax','ecommerce-platforms','shipping-logistics','crm-sales','lead-enrichment','project-management','e-signature','form-builders','presentations-slides','diagrams-whiteboards','job-search-apis','applicant-tracking','hr-payroll','finance-market-data','forex-rates','crypto-market-data','blockchain-infrastructure']],
 ['science-public-data','Science & Public Data','Open data, statistics, research, health, climate and reference.',['open-data','government-statistics','nonprofit-charity-apis','science-data','academic-research','patents','space-astronomy','weather','environment-hazards','energy-climate','animals-nature','medical-data-apis','wearable-health-data','education','knowledge-bases','dictionaries-language','company-registries','legal-data']],
 ['world-lifestyle','Maps, Travel, Culture & Lifestyle','Maps, travel, transport, news, sports, culture, food and home.',['maps-geo','geocoding-address','travel-booking','flight-tracking','public-transit','vehicles-automotive','real-estate','iot-smart-home','news','sports-data','movies-tv-data','games-data','books-apis','museum-collections','recipes-cooking','read-later-bookmarks']],
];
const entries=J('data/entries.json'), cats=J('data/categories.json'), legacy=J('data/legacy.json'), catmap=J('data/catmap.json');
// 0. OS overrides from the Mac categories before they merge
const macCats=new Set(['macos-mcp-servers','mac-local-llm-runners','mac-ai-agent-apps','mac-computer-use']);
const osTags={}; for(const e of entries) if(macCats.has(e.category)) osTags[e.slug]=['macOS'];
W('data/entry-os.json',osTags);
// 1. legacy snapshot: every current URL
const lc=new Set(legacy.cats); for(const c of cats) if(!lc.has(c.slug)) legacy.cats.push(c.slug);
const le=new Set(legacy.entries.map(x=>x.join('/'))); for(const e of entries) if(!le.has(e.category+'/'+e.slug)) legacy.entries.push([e.category,e.slug]);
W('data/legacy.json',legacy);
// 2. raw.txt
const before=entries.map(e=>e.slug).sort().join(',');
let moved=0; const raw=fs.readFileSync('data/raw.txt','utf8').split('\n');
const slugify = s => s.toLowerCase().replace(/&/g,' and ').replace(/\./g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const out=raw.map(l=>{ if(!l) return l; const p=l.split('|'); const s=slugify(p[1]); let c=MOVES[s]||MERGE[p[0]]||p[0]; if(c!==p[0]){moved++; p[0]=c;} return p.join('|'); });
fs.writeFileSync('data/raw.txt',out.join('\n'));
// 3. categories
const keep=cats.filter(c=>!MERGE[c.slug]).map(c=>RENAME[c.slug]?{...c,name:RENAME[c.slug][0],blurb:RENAME[c.slug][1]}:c);
W('data/categories.json',keep);
// 4. catmap
for(const [a,b] of Object.entries(MERGE)) catmap[a]=b;
for(const k of Object.keys(catmap)) { let t=catmap[k], n=0; while(MERGE[t]&&n++<5) t=MERGE[t]; catmap[k]=t; }
fs.writeFileSync('data/catmap.json',JSON.stringify(catmap));
// 5. groups
const all=GROUPS.flatMap(g=>g[3]); const ks=new Set(keep.map(c=>c.slug));
const dup=all.filter((s,i)=>all.indexOf(s)!==i), missing=[...ks].filter(s=>!all.includes(s)), unknown=all.filter(s=>!ks.has(s));
if(dup.length||missing.length||unknown.length) throw new Error(JSON.stringify({dup,missing,unknown}));
W('data/groups.json',GROUPS.map(([slug,name,blurb,c])=>({slug,name,blurb,cats:c})));
console.log({cats_before:cats.length,cats_after:keep.length,retired:Object.keys(MERGE).length,moved,groups:GROUPS.length,sizes:GROUPS.map(g=>g[0]+':'+g[3].length).join(' ')});
