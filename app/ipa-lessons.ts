import {ipaFeA,ipaFeB} from './ipa-fe-lessons.ts';
import {ipaIp} from './ipa-ip-lessons.ts';
export {ipaFeA,ipaFeB,ipaIp};
export function ipaLesson(level:string,part:string|undefined,number:number,language:'ru'|'en'|'ja'){
 const entries=level==='IP'?ipaIp:part==='A'?ipaFeA:part==='B'?ipaFeB:[];
 const entry=entries.find(e=>e[0]===number);if(!entry)return null;
 const [core,detail,search,next]=entry[language==='ru'?2:language==='en'?3:4];
 return {core,detail,search,next,sources:level==='FE'&&part==='A'&&number===20?[{title:'Japan Copyright Act · Articles 19, 59',url:'https://www.japaneselawtranslation.go.jp/en/laws/view/4207'}]:undefined};
}
