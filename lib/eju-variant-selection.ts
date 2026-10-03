import type { EjuCourse } from './eju-types.ts';
/** Prefer untouched papers, then those with the fewest completed attempts. */
export function selectNextEjuVariant(
  course: EjuCourse,
  current: number,
  read: (key: string) => string | null,
  random = Math.random,
): number {
  const rows = Array.from({ length: 10 }, (_, i) => {
    const variant = i + 1;
    let attempts = 0,
      active = false;
    try {
      const suffix = course === 'math1' && variant === 1 ? '-r2' : '';
      const raw = JSON.parse(
        read(
          `kiso-eju-v1:eju-${course}-kiso-${String(variant).padStart(2, '0')}${suffix}`,
        ) ?? 'null',
      );
      if (raw?.version === 1) {
        attempts = Array.isArray(raw.history) ? raw.history.length : 0;
        active = !!raw.active;
      }
    } catch {
      /* An unreadable record is not evidence of a completed paper. */
    }
    return { variant, weight: active ? Infinity : attempts };
  }).filter((r) => r.variant !== current);
  const least = Math.min(...rows.map((r) => r.weight));
  const candidates = rows.filter((r) => r.weight === least);
  return candidates[
    Math.min(
      candidates.length - 1,
      Math.max(0, Math.floor(random() * candidates.length)),
    )
  ].variant;
}
