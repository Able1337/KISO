# EJU in KISO

## Scope of release 02

Three independent courses, each supporting learning, untimed mock and timed exam modes:

| Course | Original Kiso content | Timing in exam mode |
| --- | --- | --- |
| Mathematics Course 1 | 20 numeric-response tasks in four groups | 80 minutes |
| Mathematics Course 2 | 20 numeric-response tasks in four groups | 80 minutes |
| Japanese | Choose one of two writing prompts; 25 reading, 15 integrated listening/reading, 12 audio-only items | Writing 30, reading 40, combined listening 55 minutes |

These are independently authored practice papers, not rewritten or rehosted JASSO past papers. They target the published skill categories. They are not calibrated for equivalence of difficulty, raw-score weighting or scaled EJU scores. Ten practice papers per course are included (30 total). Variants share instructional templates but change numerical parameters, situations, texts and tables. Repeating the selected paper keeps its content; switching papers selects different content.

The mathematics learning route is Course 1 followed by Course 2. Both remain accessible independently. Japanese is an independent parallel route. A real EJU sitting uses one mathematics course.

## Format references

Reviewed on 2026-10-03:

- [JASSO subject structure and timing](https://www.jasso.go.jp/en/ryugaku/eju/examinee/procedure/subject.html)
- [Mathematics syllabus applicable from the first 2026 sitting](https://www.jasso.go.jp/en/ryugaku/eju/examinee/syllabus/mathematics.html)
- [Japanese syllabus and assessed skills](https://www.jasso.go.jp/en/ryugaku/eju/examinee/syllabus/japanese.html)
- [Past-paper catalogue](https://www.jasso.go.jp/en/ryugaku/eju/examinee/pastpaper_sample/index.html)

The references establish subject structure and skills, not the answer keys for the Kiso-authored items. The public repository contains no EJU past-paper PDFs, extracted passages, cropped figures or official audio.

## Learning and assessment behavior

- Learning: no clock; answers can be edited until submitted for feedback, then are locked. Numeric cells accept one digit or minus each. Full-width numeric input is normalized.
- Mock: no clock or explanations before completing the attempt. Answers can be revised within the current section.
- Exam: absolute section deadlines persist across reloads. Completing a section locks it; the next section starts on explicit confirmation. Timed listening follows 27 equally spaced slots over 55 minutes. Each original recording lasts less than its slot, leaving answering time. This is Kiso pacing, not a reproduction of an official audio track.
- In audio-only questions, mock and exam show numbered choices; their wording is heard in the recording. Learning and review expose the written options and transcript.
- Results show raw practice accuracy, counting a mathematics item correct only if every cell is correct. No official scaled EJU score or pass prediction is calculated.
- Writing saves a topic choice and essay. An approximate whitespace-excluding character counter, guidance and two 400–500-character model responses support human self-review. No automatic 0–50 mark is assigned.
- Three-language UI and topic overviews; detailed subtopic lessons are in Russian, mathematical derivations and task text remain Japanese. Math prompts currently have no English-language exam edition.

## Architecture and persistence

- `lib/eju-types.ts`: EJU pack and question types.
- `lib/eju-session.ts`: section transitions, absolute deadlines, validation, scoring and storage serialization.
- `lib/eju-catalog.ts`: lazy course loading.
- `data/eju-math.ts`, `data/eju-japanese.ts`: authored tasks and explanations.
- `data/eju-topics.ts`: 7 Math 1, 13 additional Math 2 and 7 Japanese study blocks. `data/eju-curriculum.ts` expands these into detailed subtopic lessons, worked examples, pitfalls and linked practice.
- `app/page.tsx`: shared system/course/paper/mode form. Selecting EJU keeps the same setup screen. `app/eju-hub.tsx`: session-card controls and a separate full-width session screen for starting, resuming and reviewing attempts. Returning to setup preserves the selected course, paper, mode and saved answers. The workspace stays mounted across this transition so timers and pending saves remain active.
- `app/roadmap-hub.tsx`: five separate roadmap tracks.
- `app/eju-roadmap.tsx`: lessons, self-check examples and per-course checkboxes.

Exam storage keys are `kiso-eju-v1:<pack-id>`; roadmap keys are `kiso-eju-roadmap-v1:<course>`. Each paper keeps one active attempt and up to 30 completed attempts. Storage failures remain visible; in-memory answers are retained while the page stays open. Web Locks and state comparison guard cross-tab writes. Existing ITPEC/IPA exam keys are unchanged.

ITPEC/IPA roadmap marks now use `kiso-roadmap-v1:ITPEC` and `kiso-roadmap-v1:IPA`. If a system-specific key is absent, existing marks in `kiso-roadmap-v1` provide initial values. A subsequent edit writes only the selected system's key, preserving the old data.

## Audio generation and attribution

The browser plays static files and requires no speech API or installed Japanese system voice. A short sound check must finish before starting/resuming Japanese. Audio errors are displayed; in a timed exam the clock continues. Browser autoplay restrictions offer an explicit playback button, seeking to the current slot position rather than restarting its clock.

Audio was synthesized locally with **pyopenjtalk-plus / Open JTalk**, using the **Mei** HTS voice, released by the **MMDAgent Project Team**, copyright © 2009–2013 Nagoya Institute of Technology, Department of Computer Science. Voice license: **CC BY 3.0**. Original Kiso scripts are synthesized at speed 0.92, normalized with headroom and encoded to mono MP3. This does not imply endorsement by the voice authors.

- [Voice license](public/eju/audio/LICENSE-Mei.txt)
- [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)
- [pyopenjtalk-plus](https://github.com/tsukumijima/pyopenjtalk-plus)

Generation dependencies are optional and not needed to run/build the website:

```bash
python -m pip install pyopenjtalk-plus numpy lameenc
node --experimental-strip-types scripts/export-eju-audio.mjs
python scripts/build-eju-audio.py
```

The generator writes MP3, VTT transcripts, the voice license and a manifest with durations and SHA-256 hashes for audio and source text. Regenerate audio after changing any script and review pronunciation. Synthetic narration differs from a human examination recording.

## Validation

`tests/eju.test.mjs` covers all courses and modes, every incorrect Japanese choice, independent mathematical calculations, first-answer locking, section restrictions, timeout boundaries, storage corruption, restoration, essay lengths, topic links and integrity/duration of every recording.

```bash
npm test
npm run typecheck
npm run build:static
```

Browser checks cover numeric entry and feedback, reload/resume, mock-mode hint suppression, essay preservation, section expiry, timed audio progression, cross-tab synchronization, roadmap isolation, language switching and mobile overflow. Tests do not establish equivalence to official EJU difficulty or replace editorial review of all authored content.

## Variant bank and lessons

`data/eju-variants.ts` builds Math 1/2 papers 02–10 from explicit solvable constraints. `data/eju-japanese-variants.ts` builds Japanese papers 02–10 with five reading situations, 27 listening items and two writing prompts per paper. Static audio is exported for all 270 listening items plus the sound check; unchanged scripts reuse verified files during generation. Paper identity isolates persistence.

Roadmap topic marks from release 01 expand to all child lessons on read. Each subtopic has separate self-assessment; marking a topic updates its children. Search includes lesson text, and practice can be switched across all ten papers. Some enrichment sections use linked prerequisite exercises; they do not claim a dedicated exam item for every syllabus detail.

The 27 unique topics contain 85 detailed subtopics. Math 1 paper 01 now uses identity `eju-math1-kiso-01-r2`, because its first problem was replaced. Earlier attempts remain untouched under the old browser key and are not regraded against changed content. The "Choose another paper" action prefers papers with fewer completed attempts and avoids active papers when alternatives exist.

### Roadmap review — 2026-10-04

The roadmap was checked against [JASSO mathematics syllabus effective from 2026](https://www.jasso.go.jp/en/ryugaku/eju/examinee/syllabus/mathematics.html), [Japanese skills](https://www.jasso.go.jp/en/ryugaku/eju/examinee/syllabus/japanese.html), and [writing criteria](https://www.jasso.go.jp/en/ryugaku/eju/about/score/writing.html). The [2018 paper and answer archive](https://www.jasso.go.jp/en/ryugaku/eju/examinee/pastpaper_sample/pastpaper_2018_1.html) is a separate practice reference, not a specification of the 2026 scope.

`data/eju-roadmap-plan.ts` defines 3 Math 1 stages, 7 Math 2 stages, and 4 Japanese stages with prerequisites and learning objectives. Course 2 includes all seven foundation topics before its thirteen advanced topics. Foundation lessons load Math 1 practice, without mixing roadmap progress or changing exam papers. Stage navigation resets filters and preserves stable topic numbering.

`data/eju-curriculum-supplement.ts` adds 21 independently authored lessons, including integer solutions, spatial geometry, binomial trials, covariance, polar coordinates, continuity, motion, volume and curve length, as well as Japanese parsing, inference, combined information, listening notes and essay revision. Each includes a worked example and a separate self-check with a revealable solution. These exercises are explicitly not mapped to paper questions; existing 64 lessons retain their practice links. This expands study coverage, not the exam bank, and does not claim exhaustive instruction or official difficulty equivalence.

Original numbered lesson IDs stay stable. Legacy topic marks expand only to original numbered lessons; new named lessons start unchecked. Math 2 foundation progress is stored independently from Math 1. `tests/eju-roadmap.test.mjs` checks scope, foundation practice routing and progress migration.

`tests/eju-variants.test.mjs` additionally checks all 30 paper identities and lifecycles, all generated math keys by independent constraints, curriculum links, essay lengths, displayed table constraints and all 270 recording hashes and scripts. New EJU modules pass targeted lint; the existing main-page effects retain the repository's pre-existing React compiler lint findings.
