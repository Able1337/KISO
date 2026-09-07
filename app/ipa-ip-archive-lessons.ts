import type {Entry} from './fe-lessons.ts';
import {archiveLessonEntries} from './itpec-archive-lessons.ts';
import {lessonEntries} from './official-lesson-bank.ts';
import {ipaIp} from './ipa-ip-lessons.ts';
import {ipaIp2024Strategy} from './ipa-ip-2024-strategy.ts';
import {ipaIp2024StrategyNext} from './ipa-ip-2024-strategy-next.ts';
import {ipaIp2024Management} from './ipa-ip-2024-management.ts';
import {ipaIp2024Technology} from './ipa-ip-2024-technology.ts';
import {ipaIp2024TechnologyNext} from './ipa-ip-2024-technology-next.ts';
import {ipaIp2025Strategy} from './ipa-ip-2025-strategy.ts';
import {ipaIp2025StrategyNext} from './ipa-ip-2025-strategy-next.ts';
import {ipaIp2025Management} from './ipa-ip-2025-management.ts';
import {ipaIp2025Technology} from './ipa-ip-2025-technology.ts';
import {ipaIp2025TechnologyNext} from './ipa-ip-2025-technology-next.ts';

// Explicit editorial reuse, not a nearest-topic or same-number fallback.
const sources:Record<string,Entry[]>={I26:lessonEntries,P26:ipaIp,
 S25:archiveLessonEntries['itpec-ip-2025-spring'],A25:archiveLessonEntries['itpec-ip-2025-autumn'],
 S24:archiveLessonEntries['itpec-ip-2024-spring'],A24:archiveLessonEntries['itpec-ip-2024-autumn']};
export const ipaIpArchiveReuse:Record<number,[number,string,string,number][]>={
 2024:[
  [2,'b','P26',21],[4,'b','I26',92],[6,'d','S25',72],[7,'b','A25',96],
  [8,'c','I26',72],[11,'b','I26',76],[15,'c','A25',91],[18,'c','S25',77],
  [19,'c','S25',85],[20,'b','I26',100],[21,'c','S25',78],[25,'a','S25',92],
  [29,'b','S25',100],[34,'d','A24',84],[40,'a','P26',43],[44,'a','A25',58],
  [47,'c','A25',50],[50,'d','S25',49],[55,'c','P26',47],[58,'d','S25',22],
  [59,'b','A25',23],[64,'b','A25',39],[66,'d','P26',90],[67,'c','S25',16],
  [80,'a','I26',22],[86,'c','A25',44],[89,'c','S25',45],[95,'b','A25',90],
  [96,'c','I26',34],[98,'b','A25',45],[100,'b','I26',45],
 ],
 2025:[[7,'b','S25',96],[24,'d','A25',95],[31,'b','A25',86],[56,'a','P26',81],
 [58,'c','S25',31],[67,'b','S24',12],[81,'d','A25',23],[86,'d','A24',11],
 [90,'d','P26',59],[92,'a','P26',63]],
};
export function reusedIpEntries(year:number):Entry[]{
 return (ipaIpArchiveReuse[year]??[]).map(([n,key,bank,source])=>{
  const e=sources[bank]?.find(e=>e[0]===source);
  if(!e)throw new Error(`Missing reviewed lesson ${bank}:${source}`);
  const copy:Entry=[n,key,[...e[2]],[...e[3]],[...e[4]]];
  if(year===2024&&n===40){
   copy[2][1]=copy[2][1].replace('Каждые две недели','Например, каждые две недели');
   copy[3][1]=copy[3][1].replace('Every two weeks','For example, every two weeks');
   copy[4][1]=copy[4][1].replace('二週間ごとに','例えば二週間ごとに');
  }
  return copy;
 });
}
export const ipaIpArchiveEntries:Record<string,Entry[]>={
 'ipa-ip-2024-public':[...reusedIpEntries(2024),...ipaIp2024Strategy,...ipaIp2024StrategyNext,...ipaIp2024Management,...ipaIp2024Technology,...ipaIp2024TechnologyNext],
 'ipa-ip-2025-public':[...reusedIpEntries(2025),...ipaIp2025Strategy,...ipaIp2025StrategyNext,...ipaIp2025Management,...ipaIp2025Technology,...ipaIp2025TechnologyNext],
};
