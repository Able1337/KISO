import type { EjuCourse, EjuPack } from './eju-types.ts';
export async function loadEjuPack(
  course: EjuCourse,
  variant = 1,
): Promise<EjuPack> {
  if (!Number.isInteger(variant) || variant < 1 || variant > 10)
    throw new Error('Invalid EJU variant');
  if (variant > 1)
    return (await import('../data/eju-variants.ts')).variantPack(
      course,
      variant,
    );
  if (course === 'japanese')
    return (await import('../data/eju-japanese')).japanesePack;
  return (await import('../data/eju-math')).mathPack(course);
}
