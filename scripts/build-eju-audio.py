"""Generate local speech for the independently authored Japanese paper.

Input: work/eju-audio.json, exported from data/eju-japanese.ts.
Dependencies: pyopenjtalk-plus, numpy, lameenc. No network speech service.
Output: public/eju/audio/*.mp3, captions and an integrity manifest.
The website only plays static audio: no runtime speech service is needed.
"""
import hashlib
import json
from pathlib import Path
import shutil
import numpy as np
import lameenc
import pyopenjtalk

ROOT = Path(__file__).resolve().parent.parent

def main():
    target = ROOT / "public/eju/audio"
    target.mkdir(parents=True, exist_ok=True)
    rows = json.loads((ROOT / "work/eju-audio.json").read_text(encoding="utf-8"))
    rows.insert(0, {"id": "check", "text": "音声の確認です。日本語が聞こえたら、準備ができています。"})
    manifest = []
    old = {r['id']: r for r in json.loads((target / 'manifest.json').read_text(encoding='utf-8'))} if (target / 'manifest.json').exists() else {}
    for row in rows:
        output = target / (row["id"] + ".mp3")
        previous = old.get(row['id'])
        if previous and previous['textSha256'] == hashlib.sha256(row['text'].encode()).hexdigest() and output.exists() and hashlib.sha256(output.read_bytes()).hexdigest() == previous['sha256'] and output.with_suffix('.vtt').exists():
            manifest.append(previous)
            continue
        waveform, rate = pyopenjtalk.tts(row["text"], speed=0.92, predict_nani=False)
        # Keep headroom and add short silence around each complete item.
        peak = max(1.0, float(np.max(np.abs(waveform))))
        pcm = np.concatenate((np.zeros(rate // 2), waveform / peak * 28000, np.zeros(rate // 2))).astype(np.int16)
        encoder = lameenc.Encoder()
        encoder.set_bit_rate(96)
        encoder.set_in_sample_rate(rate)
        encoder.set_channels(1)
        encoder.set_quality(2)
        audio = encoder.encode(pcm.tobytes()) + encoder.flush()
        output.write_bytes(audio)
        duration = len(pcm) / rate
        minutes, seconds = divmod(duration, 60)
        end = f"00:{int(minutes):02}:{seconds:06.3f}"
        (target / (row["id"] + ".vtt")).write_text(f"WEBVTT\n\n00:00:00.000 --> {end}\n{row['text']}\n", encoding="utf-8")
        manifest.append({"id": row["id"], "seconds": round(duration, 3), "sha256": hashlib.sha256(audio).hexdigest(), "textSha256": hashlib.sha256(row["text"].encode()).hexdigest()})
        print(row["id"], round(duration, 1), len(audio), flush=True)
    (target / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    shutil.copyfile(Path(pyopenjtalk.__file__).parent / "htsvoice/LICENSE_mei_normal.htsvoice", target / "LICENSE-Mei.txt")

if __name__ == "__main__":
    main()
