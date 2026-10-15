import { SITE, ALL } from '../lib/data';
const entry = { type:'object', properties:{ name:{type:'string'}, slug:{type:'string'}, category:{type:'string'}, category_name:{type:'string'}, description:{type:'string'}, url:{type:'string',format:'uri'}, docs_url:{type:'string',format:'uri'}, auth:{type:'string',enum:['none','key','oauth']}, pricing:{type:'string',enum:['free','freemium','paid']}, http_status:{type:['integer','null']}, last_checked_at:{type:'string'}, status:{type:'string'}, swarmnest_url:{type:'string',format:'uri'} } };
const json = (schema:any)=>({ '200':{ description:'OK', content:{'application/json':{schema}} } });
export const GET = () => new Response(JSON.stringify({
 openapi:'3.1.0', info:{ title:'Swarmnest Directory API', version:'1.0.0', description:`Read-only, static JSON snapshots of the Swarmnest directory of tools, APIs and data sources for AI agents (${ALL.length} entries). No authentication required.`, contact:{email:'hello@swarmnest.ai'} },
 servers:[{url:SITE}],
 paths:{
  '/api/v1/directory.json':{get:{operationId:'listDirectory',summary:'List all directory entries',responses:json({type:'object',properties:{count:{type:'integer'},entries:{type:'array',items:entry}}})}},
  '/api/v1/directory/{slug}.json':{get:{operationId:'getEntry',summary:'Get one entry by slug',parameters:[{name:'slug',in:'path',required:true,schema:{type:'string'}}],responses:{...json(entry),'404':{description:'Not found'}}}},
  '/api/v1/categories.json':{get:{operationId:'listCategories',summary:'List categories with entry counts',responses:json({type:'object'})}},
  '/directory.json':{get:{operationId:'directoryJson',summary:'Full directory snapshot (same data as /api/v1/directory.json)',responses:json({type:'object'})}}
 }},null,1),{headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*'}});
