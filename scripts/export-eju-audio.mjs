import fs from 'node:fs';
import { japanesePack } from '../data/eju-japanese.ts';
import { japaneseVariant } from '../data/eju-japanese-variants.ts';
const packs = [
  japanesePack,
  ...Array.from({ length: 9 }, (_, i) => japaneseVariant(i + 2)),
];
fs.mkdirSync('work', { recursive: true });
fs.writeFileSync(
  'work/eju-audio.json',
  JSON.stringify(
    packs.flatMap((p) =>
      p.questions
        .filter((q) => q.audio)
        .map((q) => ({
          id: q.audio.split('/').at(-1).replace('.mp3', ''),
          text: q.audioText,
        })),
    ),
  ),
);
console.log('Exported 270 recording scripts');
