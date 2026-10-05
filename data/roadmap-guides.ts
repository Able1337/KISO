import { computingGuides } from './roadmap-guides-computing.ts';
import { dataSecurityGuides } from './roadmap-guides-data-security.ts';
import { managementGuides } from './roadmap-guides-management.ts';
import type { RoadmapGuide } from '../lib/roadmap-guide-types.ts';
export const roadmapGuides: Record<string, RoadmapGuide> = {
  ...computingGuides,
  ...dataSecurityGuides,
  ...managementGuides,
};
export const guideResources = {
  IPA: {
    title: 'IPA · Syllabus IP / FE и язык псевдокода',
    url: 'https://www.ipa.go.jp/en/it-examinations/reference.html',
  },
  ITPEC: {
    title: 'ITPEC · Учебные материалы IP / FE',
    url: 'https://www.itpec.org/about/learning-materials.html',
  },
  law: {
    title: 'PPC · Японские нормы о персональных данных',
    url: 'https://www.ppc.go.jp/en/legal/',
  },
  ux: {
    title: 'W3C WAI · Подписи элементов формы',
    url: 'https://www.w3.org/WAI/tutorials/forms/labels/',
  },
};
