export type EjuCourse = 'math1' | 'math2' | 'japanese';
export type EjuLanguage = 'ru' | 'en' | 'ja';
export type EjuText = Record<EjuLanguage, string>;
export type EjuQuestion = {
  id: string;
  section: string;
  topic: string;
  group: string;
  passage?: string;
  prompt: string;
  kind: 'numeric' | 'choice';
  /** Numeric values use one original mark-sheet cell per character, including minus. */
  answers: string[];
  labels?: string[];
  options?: string[];
  explanation: EjuText;
  audioText?: string;
  audio?: string;
  visual?: { headings: string[]; rows: string[][] };
};
export type EjuSection = {
  id: string;
  title: EjuText;
  seconds: number;
  kind: 'writing' | 'questions' | 'listening';
};
export type EjuPack = {
  id: string;
  version: 1;
  course: EjuCourse;
  title: EjuText;
  sections: EjuSection[];
  questions: EjuQuestion[];
  writing?: { prompts: string[]; guidance: EjuText; models: string[] };
};
export type EjuTopic = {
  id: string;
  courses: EjuCourse[];
  title: EjuText;
  lesson: EjuText;
  example: EjuText;
  exercise: EjuText;
  answer: string;
  solution: EjuText;
};
export const tr = (ru: string, en: string, ja: string): EjuText => ({
  ru,
  en,
  ja,
});
export const ejuNames: Record<EjuCourse, string> = {
  math1: 'EJU Math 1',
  math2: 'EJU Math 2',
  japanese: 'EJU Japanese',
};
