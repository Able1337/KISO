import type { ExamPack } from './exam-session';

export const examCatalog=[
  ...[
    {id:'itpec-ip-2025-spring',level:'IP',year:2025,season:'spring',load:()=>import('../data/exams/itpec-ip-2025-spring.json')},
    {id:'itpec-ip-2025-autumn',level:'IP',year:2025,season:'autumn',load:()=>import('../data/exams/itpec-ip-2025-autumn.json')},
    {id:'itpec-fe-2025-spring',level:'FE',year:2025,season:'spring',load:()=>import('../data/exams/itpec-fe-2025-spring.json')},
    {id:'itpec-fe-2025-autumn',level:'FE',year:2025,season:'autumn',load:()=>import('../data/exams/itpec-fe-2025-autumn.json')},
    {id:'itpec-ip-2024-spring',level:'IP',year:2024,season:'spring',load:()=>import('../data/exams/itpec-ip-2024-spring.json')},
    {id:'itpec-ip-2024-autumn',level:'IP',year:2024,season:'autumn',load:()=>import('../data/exams/itpec-ip-2024-autumn.json')},
    {id:'itpec-fe-2024-spring',level:'FE',year:2024,season:'spring',load:()=>import('../data/exams/itpec-fe-2024-spring.json')},
    {id:'itpec-fe-2024-autumn',level:'FE',year:2024,season:'autumn',load:()=>import('../data/exams/itpec-fe-2024-autumn.json')},
  ].map(p=>({...p,system:'ITPEC'})),
  {id:'ipa-fe-2022-sample',system:'IPA',level:'FE',year:2022,load:()=>import('../data/exams/ipa-fe-2022-sample.json')},
  {id:'ipa-fe-2023-public',system:'IPA',level:'FE',year:2023,load:()=>import('../data/exams/ipa-fe-2023-public.json')},
  {id:'ipa-fe-2024-public',system:'IPA',level:'FE',year:2024,load:()=>import('../data/exams/ipa-fe-2024-public.json')},
  {id:'ipa-fe-2025-public',system:'IPA',level:'FE',year:2025,load:()=>import('../data/exams/ipa-fe-2025-public.json')},
  {id:'ipa-ip-2026-public',system:'IPA',level:'IP',year:2026,load:()=>import('../data/exams/ipa-ip-2026-public.json')},
  {id:'ipa-fe-2026-public',system:'IPA',level:'FE',year:2026,load:()=>import('../data/exams/ipa-fe-2026-public.json')},
  {id:'itpec-ip-2026-spring',system:'ITPEC',level:'IP',year:2026,load:()=>import('../data/exams/itpec-ip-2026-spring.json')},
  {id:'itpec-fe-2026-spring',system:'ITPEC',level:'FE',year:2026,load:()=>import('../data/exams/itpec-fe-2026-spring.json')},
];
export async function loadExam(system:string,level:string,year:number,season='spring'):Promise<ExamPack|null> {
  const item=examCatalog.find(p=>p.system===system&&p.level===level&&p.year===year&&(system!=='ITPEC'||('season' in p?p.season:'spring')===season));
  return item?(await item.load()).default as ExamPack:null;
}
