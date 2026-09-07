import type { ExamPack } from './exam-session';

export const examCatalog=[
  {id:'ipa-fe-2022-sample',system:'IPA',level:'FE',year:2022,load:()=>import('../data/exams/ipa-fe-2022-sample.json')},
  {id:'ipa-fe-2023-public',system:'IPA',level:'FE',year:2023,load:()=>import('../data/exams/ipa-fe-2023-public.json')},
  {id:'ipa-fe-2024-public',system:'IPA',level:'FE',year:2024,load:()=>import('../data/exams/ipa-fe-2024-public.json')},
  {id:'ipa-fe-2025-public',system:'IPA',level:'FE',year:2025,load:()=>import('../data/exams/ipa-fe-2025-public.json')},
  {id:'ipa-ip-2026-public',system:'IPA',level:'IP',year:2026,load:()=>import('../data/exams/ipa-ip-2026-public.json')},
  {id:'ipa-fe-2026-public',system:'IPA',level:'FE',year:2026,load:()=>import('../data/exams/ipa-fe-2026-public.json')},
  {id:'itpec-ip-2026-spring',system:'ITPEC',level:'IP',year:2026,load:()=>import('../data/exams/itpec-ip-2026-spring.json')},
  {id:'itpec-fe-2026-spring',system:'ITPEC',level:'FE',year:2026,load:()=>import('../data/exams/itpec-fe-2026-spring.json')},
];
export async function loadExam(system:string,level:string,year:number):Promise<ExamPack|null> {
  const item=examCatalog.find(p=>p.system===system&&p.level===level&&p.year===year);
  return item?(await item.load()).default as ExamPack:null;
}
