import {ipaFeA,ipaFeB} from './ipa-fe-lessons.ts';
import {ipaIp} from './ipa-ip-lessons.ts';
import {ipaIpSources} from './ipa-ip-sources.ts';
import {ipaFeCollections,collectionSources} from './ipa-fe-collections-lessons.ts';
export {ipaFeA,ipaFeB,ipaIp};
export function ipaLesson(level:string,part:string|undefined,number:number,language:'ru'|'en'|'ja',packId=`ipa-${level.toLowerCase()}-2026-public`){
 const collection=ipaFeCollections[packId];
 const entries=collection&&level==='FE'?(part==='A'?collection.A:part==='B'?collection.B:[]):packId===`ipa-${level.toLowerCase()}-2026-public`?(level==='IP'?ipaIp:part==='A'?ipaFeA:part==='B'?ipaFeB:[]):[];
 const entry=entries.find(e=>e[0]===number);if(!entry)return null;
 const [core,detail,search,next]=entry[language==='ru'?2:language==='en'?3:4];
 return {core,detail,search,next,sources:collection?collectionSources(packId,part,number):level==='IP'?ipaIpSources[number]:level==='FE'&&part==='A'&&number===20?[{title:'Japan Copyright Act · Articles 19, 59',url:'https://www.japaneselawtranslation.go.jp/en/laws/view/4207'}]:undefined};
}
