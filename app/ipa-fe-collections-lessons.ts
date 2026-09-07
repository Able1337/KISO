import type {Entry} from './fe-lessons.ts';
import {sampleA1} from './ipa-fe-sample-a1.ts';
import {sampleA2} from './ipa-fe-sample-a2.ts';
import {sampleA3} from './ipa-fe-sample-a3.ts';
import {sampleB} from './ipa-fe-sample-b.ts';
import {archive2023A} from './ipa-fe-2023-a.ts';
import {archive2024A} from './ipa-fe-2024-a.ts';
import {archive2025A} from './ipa-fe-2025-a.ts';
import {archive2023B,archive2024B,archive2025B} from './ipa-fe-archive-b.ts';
export const ipaFeCollections:Record<string,{A:Entry[];B:Entry[]}>= {
 'ipa-fe-2022-sample':{A:[...sampleA1,...sampleA2,...sampleA3],B:sampleB},
 'ipa-fe-2023-public':{A:archive2023A,B:archive2023B},
 'ipa-fe-2024-public':{A:archive2024A,B:archive2024B},
 'ipa-fe-2025-public':{A:archive2025A,B:archive2025B},
};
export function collectionSources(id:string,part:string|undefined,number:number){
 if(id==='ipa-fe-2022-sample'&&part==='B'&&number===16)return [{title:'RFC 3629 · UTF-8 definition',url:'https://www.rfc-editor.org/rfc/rfc3629.html#section-3'}];
 if(part==='A'&&((id==='ipa-fe-2023-public'&&number===12)||(id==='ipa-fe-2024-public'&&number===12)||(id==='ipa-fe-2025-public'&&number===13)))return [{title:'The Scrum Guide',url:'https://scrumguides.org/scrum-guide.html'}];
 if(id==='ipa-fe-2022-sample'&&part==='A'&&number===60)return [{title:'Worker Dispatching Act · Article 2',url:'https://www.japaneselawtranslation.go.jp/en/laws/view/4485/en'}];
 if(id==='ipa-fe-2024-public'&&part==='A'&&number===20)return [{title:'JPO · Industrial Property Rights',url:'https://www.jpo.go.jp/e/system/patent/gaiyo/seidogaiyo/index.html'}];
 return undefined;
}
