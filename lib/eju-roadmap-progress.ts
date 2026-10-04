import type { EjuUnit } from '../data/eju-curriculum.ts';

export function readEjuRoadmapProgress(
  raw: string | null,
  units: EjuUnit[],
): string[] {
  try {
    const value: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(value)) return [];
    return units
      .filter(
        (u) =>
          value.includes(u.id) ||
          // Old topic marks covered only the original numbered lessons.
          (/\/unit-\d+$/.test(u.id) && value.includes(u.id.split('/')[0])),
      )
      .map((u) => u.id);
  } catch {
    return [];
  }
}
