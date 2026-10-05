export type RoadmapGuide = {
  before: string;
  terms: string;
  outcome: string;
  sections: [string, string][];
  example: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  advanced: string;
};
export function guide(
  before: string,
  terms: string,
  outcome: string,
  sections: [string, string][],
  example: string,
  question: string,
  options: string[],
  correct: number,
  explanation: string,
  advanced: string,
): RoadmapGuide {
  return {
    before,
    terms,
    outcome,
    sections,
    example,
    question,
    options,
    correct,
    explanation,
    advanced,
  };
}
