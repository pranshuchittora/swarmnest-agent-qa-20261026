import json,re,collections
raw=[l.rstrip('\n').split('|') for l in open('data/raw.txt') if l.strip()]
cats=json.load(open('data/categories.json'))
NEW={ # slug:(name,blurb)
'message-queues':('Message Queues','Brokers and queues that decouple services and agents with reliable, ordered job delivery.'),
'event-streaming':('Event Streaming','Log-based streaming platforms for high-volume real-time event pipelines.'),
'podcasts':('Podcasts','Podcast directories, search and hosting APIs.'),
'music-apis':('Music APIs','Music catalog, lyrics, playback and artist metadata APIs.'),
'crypto-market-data':('Crypto Prices & Exchanges','Crypto price feeds, exchange APIs and trading libraries.'),
'blockchain-infrastructure':('Blockchain & Web3 Infrastructure','Node providers, indexers, explorers and libraries for building onchain.'),
'stock-photos':('Stock Photos','Free and licensed photo and image libraries with search APIs.'),
'gifs-stickers':('GIFs & Stickers','Animated GIF, meme and sticker search APIs.'),
'sound-effects-audio':('Sound Effects & Audio Libraries','Royalty-free sound effects and audio clip libraries.'),
'team-chat':('Team Chat','Open and self-hostable team chat platforms with bot and plugin APIs.'),
'secure-messaging':('Secure & Decentralized Messaging','Federated, encrypted and peer-to-peer messaging protocols and clients.'),
'web-scraping-apis':('Web Scraping APIs','Managed scraping APIs with proxy rotation, rendering and anti-bot handling.'),
'vector-databases':('Vector Databases','Vector stores and similarity search engines for embeddings and retrieval.'),
'agent-memory':('Agent Memory','Long-term memory layers and knowledge graphs for agents.'),
'backend-as-a-service':('Backend as a Service','Hosted database, auth, storage and functions in one backend.'),
'relational-databases':('Relational Databases','SQL databases, managed Postgres and MySQL-compatible services.'),
'nosql-key-value-stores':('NoSQL & Key-Value Stores','Document, wide-column and key-value databases and storage engines.'),
'graph-databases':('Graph Databases','Databases for connected data and graph queries.'),
'data-warehouses':('Data Warehouses & Analytics Engines','Warehouses and distributed engines for large-scale analytics.'),
'payment-processing':('Payment Processing','Payment gateways and processors with card, wallet and platform APIs.'),
'merchant-of-record':('Merchant of Record & Creator Sales','Platforms that sell digital products and handle tax and compliance for you.'),
'buy-now-pay-later':('Buy Now, Pay Later','Instalment and pay-later checkout providers.'),
'cross-border-payouts':('Payouts & Money Transfer','International transfers, payouts and multi-currency accounts.'),
'ai-dubbing':('AI Dubbing & Localization','Automatic dubbing, lip-sync and voice translation for video.'),
'voice-cloning':('Voice Cloning & Voice Changing','Voice cloning, conversion and synthetic voice creation.'),
'job-search-apis':('Job Search APIs','Job listings and search data from boards and public sources.'),
'applicant-tracking':('Applicant Tracking & Recruiting','ATS and recruiting platforms with job and candidate APIs.'),
'hr-payroll':('HR & Payroll','HR, payroll and global employment APIs.'),
'books-apis':('Books & Ebooks','Book metadata, ISBN lookup and public-domain ebook APIs.'),
'library-catalogs':('Library Catalogs & Archives','National library, archive and digital library catalog APIs.'),
'museum-collections':('Museum Collections','Open art and museum collection APIs with images and metadata.'),
'cultural-heritage':('Cultural Heritage Aggregators','Aggregated cultural collections and art vocabularies.'),
'nutrition-data':('Nutrition & Food Data','Food products, ingredients and nutrient databases.'),
'recipes-cooking':('Recipes & Cooking','Recipe search and meal-planning APIs.'),
'drinks-beverages':('Drinks & Breweries','Cocktail, beer and beverage data APIs.'),
'form-builders':('Form Builders','Hosted form builders with APIs for creating and reading forms.'),
'form-backends':('Form Backends','Endpoints that receive and route HTML form submissions.'),
'survey-tools':('Survey Tools','Survey platforms and research questionnaires with APIs.'),
'live-streaming':('Live Streaming Platforms','Live video platforms with chat, stream and channel APIs.'),
'media-servers':('Media Servers','Self-hosted media libraries and streaming servers.'),
'video-editing':('Video Editing','Editors and AI clipping tools for cutting video.'),
'programmatic-video':('Programmatic Video Rendering','APIs and code frameworks that render video from templates and data.'),
'medical-data-apis':('Medical & Clinical Data','Drug, clinical trial and health-record standards and APIs.'),
'public-health-data':('Public Health Statistics','Disease and population health statistics from agencies.'),
'wearable-health-data':('Wearable & Fitness Data','Wearable and fitness-device data aggregation APIs.'),
'meeting-notes-ai':('AI Meeting Notes','Meeting recorders, transcribers and summarisers.'),
'speech-datasets':('Speech Datasets','Corpora and benchmarks for speech recognition and speaker research.'),
'speaker-diarization':('Speaker Diarization & Recognition','Who-spoke-when and speaker verification toolkits.'),
'travel-booking':('Travel Booking','Flight, hotel and travel search and booking APIs.'),
'flight-tracking':('Flight Tracking','Live flight status and aviation data.'),
'public-transit':('Public Transit','Transit schedules, routing and GTFS data.'),
}
# old_cat: (default new, {new:[names]})
R={
'message-queues-streaming':('message-queues',{'event-streaming':['Apache Pulsar','Redis Streams']}),
'podcasts-music':('music-apis',{'podcasts':['Podcast Index','ListenNotes','Buzzsprout API','iTunes Search API']}),
'crypto-web3':('blockchain-infrastructure',{'crypto-market-data':['CoinGecko API','CoinMarketCap API','CoinCap','Binance API','Kraken API','CCXT','DefiLlama API','Coinbase Exchange API']}),
'stock-photo-media':('stock-photos',{'gifs-stickers':['Giphy API','Tenor API'],'sound-effects-audio':['Freesound API'],'space-astronomy':['NASA Image and Video Library'],'cultural-heritage':['Europeana API']}),
'team-chat-selfhosted':('team-chat',{'secure-messaging':['Matrix Synapse','Element (formerly Riot)','Wire','Keybase Chat','Threema Work','Tox (decentralized chat)','Mumble (voice chat)']}),
'scraping-browsing':('web-scraping-apis',{'content-extraction':['Jina Reader','Crawl4AI'],'browser-automation':['AgentQL']}),
'memory-vector-dbs':('vector-databases',{'agent-memory':['Mem0','Zep','Zep (memory layer)','LangChain Memory','Supermemory','Cognee','Graphiti'],'relational-databases':['CockroachDB','TiDB','SingleStore'],'nosql-key-value-stores':['MongoDB'],'data-etl':['MindsDB (Open-source)']}),
'databases-backend':('relational-databases',{'backend-as-a-service':['Supabase'],'site-search-engines':['Algolia','Typesense','Meilisearch','Elasticsearch','OpenSearch','FlexSearch','Vespa','Typesense Cloud'],'data-warehouses':['Apache Pinot','Apache Spark','Databricks','Snowflake','BigQuery','Redshift','DuckDB with vector extension'],'nosql-key-value-stores':['Cassandra','ScyllaDB','RocksDB','LevelDB','Pebble','Bolt','LMDB','Redis','Redis Labs Cloud Free','Instaclustr'],'graph-databases':['RedisGraph','Neo4j Community Edition (free)','ArangoDB Community Edition (free)','Neo4j Graph Data Science with vector similarity'],'vector-databases':['Elastic Search with k-NN plugin','NMSLIB','Cohere Vector Search API (free tier)','OpenSearch Dashboards with k-NN'],'open-data-portals':['CKAN','DataHub','Socrata Open Data API (SODA) client library (Python)']}),
'payments-commerce':('payment-processing',{'merchant-of-record':['Lemon Squeezy','Paddle','Polar','Gumroad'],'buy-now-pay-later':['Klarna','Afterpay','Affirm'],'cross-border-payouts':['Wise Platform','Wise API','Payoneer','Skrill','Nickel']}),
'voice-video-dubbing':('ai-dubbing',{'voice-cloning':['Respeecher','Voice.ai','Speechify Voice Cloning','Descript Overdub','Resemble AI'],'text-to-speech':['Google Cloud Text-to-Speech','Amazon Polly','ElevenLabs Prime Voice AI','Voxygen','ReadSpeaker','Acapela Group','Baidu Speech Synthesis','Tencent Cloud TTS','Voicery','Riva (NVIDIA)'],'avatar-video':['Synthesia','DeepBrain AI AI Studios']}),
'jobs-hiring':('job-search-apis',{'applicant-tracking':['Greenhouse Harvest API','Lever API','Ashby API','Workable API','Recruitee API','Greenhouse Job Board API','Lever Postings API'],'hr-payroll':['BambooHR API','Gusto API','Deel API','Rippling API']}),
'books-library':('books-apis',{'library-catalogs':['Library of Congress API','HathiTrust Bibliographic API','DPLA API']}),
'art-museums':('museum-collections',{'cultural-heritage':['Smithsonian Open Access API','Europeana Collections','Getty Vocabularies']}),
'food-nutrition':('nutrition-data',{'recipes-cooking':['Spoonacular','TheMealDB'],'drinks-beverages':['TheCocktailDB','Brewery DB (Open Brewery DB)']}),
'forms-surveys':('form-builders',{'form-backends':['Formspree','Basin','Web3Forms','Getform','Netlify Forms'],'survey-tools':['SurveyMonkey API','LimeSurvey','Formbricks']}),
'video-hosting':('video-hosting',{'live-streaming':['Twitch API'],'media-servers':['Jellyfin API']}),
'video-editing-tools':('video-editing',{'programmatic-video':['Creatomate','Shotstack','JSON2Video','Remotion','Plainly','Cloudinary Video API']}),
'health-medical-data':('medical-data-apis',{'public-health-data':['disease.sh','CDC Data APIs','WHO Global Health Observatory API'],'wearable-health-data':['Terra API'],'nutrition-data':['Open Food Facts']}),
'speech-transcription':('speech-transcription',{'text-to-speech':['Piper TTS','Coqui TTS','Murf AI Voice & Transcription'],'ai-dubbing':['Papercup AI Dubbing & Transcription','Papercup AI Live Caption'],'meeting-notes-ai':['Fireflies.ai Meeting Assistant','Otter.ai Business','Aiva.ai Meeting Summaries','Otter.ai','Otter.ai Live Captioning'],'speech-datasets':['GigaSpeech','TIMIT','Switchboard','NIST SRE'],'speaker-diarization':['pyannote.audio','3D-Speaker','WeSpeaker']}),
'travel-transport':('travel-booking',{'flight-tracking':['AviationStack','OpenSky Network','AeroAPI (FlightAware)'],'public-transit':['Transitland','GTFS','Navitia','Rome2Rio'],'maps-geo':['Google Places API','Yelp Fusion API'],'vehicles-automotive':['OpenChargeMap']}),
}
# some default categories keep old slug (video-hosting, speech-transcription); renamed ones in RENAME
oldcats={c['slug']:c for c in cats}
moved=0
for r in raw:
    c=r[0]
    if c in R:
        d,m=R[c]; tgt=d
        for k,names in m.items():
            if r[1] in names: tgt=k
        r[0]=tgt
names_present={r[1] for r in raw}
for c,(d,m) in R.items():
    for k,ns in m.items():
        for n in ns:
            if n not in names_present: print('MISSING name',n)
used={r[0] for r in raw}
out=[];seen=set()
catsl=[c for c in cats if c['slug'] in used]
have={c['slug'] for c in catsl}
for s,(n,b) in NEW.items():
    if s in used and s not in have: catsl.append({'slug':s,'name':n,'blurb':b})
# ensure old-kept slugs updated names
for c in catsl:
    if c['slug']=='video-hosting': c.update(name='Video Hosting',blurb='Video hosting, encoding and delivery platforms with APIs.')
    if c['slug']=='speech-transcription': c.update(name='Speech-to-Text & Transcription',blurb='Speech recognition engines and transcription APIs.')
    if c['slug']=='text-to-speech': pass
missing=[u for u in used if u not in {c['slug'] for c in catsl}]
print('missing cats',missing)
open('data/raw.txt','w').write('\n'.join('|'.join(r) for r in raw)+'\n')
json.dump(catsl,open('data/categories.json','w'),indent=1,ensure_ascii=False)
print(len(catsl),'cats',len(raw))
