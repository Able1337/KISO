import type { ExamPack } from './exam-session';

export const examCatalog=[
  {id:'itpec-ip-2026-spring',system:'ITPEC',level:'IP',year:2026,load:()=>import('../data/exams/itpec-ip-2026-spring.json')},
  {id:'itpec-fe-2026-spring',system:'ITPEC',level:'FE',year:2026,load:()=>import('../data/exams/itpec-fe-2026-spring.json')},
];
export async function loadExam(system:string,level:string,year:number):Promise<ExamPack|null> {
  const item=examCatalog.find(p=>p.system===system&&p.level===level&&p.year===year);
  return item?(await item.load()).default as ExamPack:null;
}
