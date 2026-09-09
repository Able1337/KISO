export const ROADMAP_STORAGE_KEY='kiso-roadmap-v1';
export function readRoadmapProgress(raw:string|null,validIds:ReadonlySet<string>):Record<string,true>{
 try{const data=JSON.parse(raw??'null');if(data?.version!==1||!Array.isArray(data.completed))return {};
 return Object.fromEntries(data.completed.filter((id:unknown)=>typeof id==='string'&&validIds.has(id)).map((id:string)=>[id,true]));}catch{return {};}
}
export function updateRoadmapProgress(current:Record<string,true>,ids:string[],checked:boolean){const next={...current};for(const id of ids){if(checked)next[id]=true;else delete next[id];}return next;}
export function serializeRoadmapProgress(progress:Record<string,true>){return JSON.stringify({version:1,completed:Object.keys(progress).sort()});}
