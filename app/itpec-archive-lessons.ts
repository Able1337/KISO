import {ip2025Autumn} from './itpec-ip-2025-autumn-lessons.ts';
import {ip2025AutumnNext} from './itpec-ip-2025-autumn-next.ts';
import {ip2025AutumnFinal} from './itpec-ip-2025-autumn-final.ts';
import {ip2025Spring} from './itpec-ip-2025-spring-lessons.ts';
import {ip2025SpringNext} from './itpec-ip-2025-spring-next.ts';
import {ip2025SpringFinal} from './itpec-ip-2025-spring-final.ts';
import {fe2025AutumnA} from './itpec-fe-2025-autumn-a.ts';
import {fe2025AutumnANext} from './itpec-fe-2025-autumn-a-next.ts';
import {fe2025AutumnAFinal} from './itpec-fe-2025-autumn-a-final.ts';
import {fe2025AutumnB} from './itpec-fe-2025-autumn-b.ts';
import {fe2025AutumnBFinal} from './itpec-fe-2025-autumn-b-final.ts';
import type {Entry} from './fe-lessons.ts';
import type {OfficialLesson} from './official-lessons';
import type {UiLanguage} from './kiso-i18n';
import {ip2024Autumn} from './itpec-ip-2024-autumn-lessons.ts';
import {ip2024AutumnNext} from './itpec-ip-2024-autumn-next.ts';
import {ip2024AutumnSecurity} from './itpec-ip-2024-autumn-security.ts';
import {ip2024AutumnManagement} from './itpec-ip-2024-autumn-management.ts';
import {ip2024AutumnFinal} from './itpec-ip-2024-autumn-final.ts';
import {ip2024Spring,ip2024SpringReused} from './itpec-ip-2024-spring-lessons.ts';
import {ip2024SpringNext} from './itpec-ip-2024-spring-next.ts';
import {ip2024SpringManagement} from './itpec-ip-2024-spring-management.ts';
import {ip2024SpringFinal} from './itpec-ip-2024-spring-final.ts';
import {fe2025SpringA} from './itpec-fe-2025-spring-a.ts';
import {fe2025SpringANext} from './itpec-fe-2025-spring-a-next.ts';
import {fe2025SpringAFinal} from './itpec-fe-2025-spring-a-final.ts';
import {fe2025SpringB} from './itpec-fe-2025-spring-b.ts';
import {fe2024SpringA} from './itpec-fe-2024-spring-a.ts';
import {fe2024SpringANext} from './itpec-fe-2024-spring-a-next.ts';
import {fe2024SpringAFinal} from './itpec-fe-2024-spring-a-final.ts';
import {fe2024SpringB} from './itpec-fe-2024-spring-b.ts';
import {fe2024AutumnA} from './itpec-fe-2024-autumn-a.ts';
import {fe2024AutumnANext} from './itpec-fe-2024-autumn-a-next.ts';
import {fe2024AutumnAFinal} from './itpec-fe-2024-autumn-a-final.ts';
import {fe2024AutumnB} from './itpec-fe-2024-autumn-b.ts';
// Never fall back to a lesson from another session with the same question number.
export const archiveLessonEntries:Record<string,Entry[]>={
 'itpec-ip-2024-spring':[...ip2024Spring,...ip2024SpringReused,...ip2024SpringNext,...ip2024SpringManagement,...ip2024SpringFinal],
 'itpec-ip-2024-autumn':[...ip2024Autumn,...ip2024AutumnNext,...ip2024AutumnSecurity,...ip2024AutumnManagement,...ip2024AutumnFinal],
 'itpec-ip-2025-spring':[...ip2025Spring,...ip2025SpringNext,...ip2025SpringFinal],
 'itpec-ip-2025-autumn':[...ip2025Autumn,...ip2025AutumnNext,...ip2025AutumnFinal],
};
export const feArchiveLessonEntries:Record<string,Record<string,Entry[]>>={
 'itpec-fe-2024-autumn':{A:[...fe2024AutumnA,...fe2024AutumnANext,...fe2024AutumnAFinal],B:fe2024AutumnB},
 'itpec-fe-2024-spring':{A:[...fe2024SpringA,...fe2024SpringANext,...fe2024SpringAFinal],B:fe2024SpringB},
 'itpec-fe-2025-spring':{A:[...fe2025SpringA,...fe2025SpringANext,...fe2025SpringAFinal],B:fe2025SpringB},
 'itpec-fe-2025-autumn':{A:[...fe2025AutumnA,...fe2025AutumnANext,...fe2025AutumnAFinal],B:[...fe2025AutumnB,...fe2025AutumnBFinal]},
};
export function itpecArchiveLesson(packId:string,part:string|undefined,number:number,language:UiLanguage):OfficialLesson|null{
 const entries=part?feArchiveLessonEntries[packId]?.[part]:archiveLessonEntries[packId];
 const entry=entries?.find(e=>e[0]===number);
 if(!entry)return null;
 const [core,detail,search,next]=entry[language==='ru'?2:language==='en'?3:4];
 const sources:NonNullable<OfficialLesson['sources']>=[];
 const topic=entry[3].join(' ');
 if(/GPL/.test(topic))sources.push({title:'GNU · GPL FAQ',url:'https://www.gnu.org/licenses/gpl-faq.en.html'});
 if(/Scrum/.test(topic))sources.push({title:'Scrum Guide',url:'https://scrumguides.org/scrum-guide.html'});
 if(/ransomware/i.test(topic))sources.push({title:'CISA · Ransomware Guide',url:'https://www.cisa.gov/stopransomware/ransomware-guide'});
 if(/CPRM/.test(topic))sources.push({title:'SD Association · CPRM',url:'https://www.sdcard.org/consumers/about-sd-memory-card-choices/copyright-protection-for-digital-data-cprm/'});
 if(/SPF/.test(topic))sources.push({title:'RFC 7208 · Sender Policy Framework',url:'https://www.rfc-editor.org/rfc/rfc7208'});
 if(/ISO.?14001/.test(topic))sources.push({title:'ISO · Environmental management',url:'https://www.iso.org/standards/popular/iso-14000-family'});
 return {core,detail,search,next,...(sources.length?{sources}:{})};
}
