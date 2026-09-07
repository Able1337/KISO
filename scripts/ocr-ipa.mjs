// Optional import dependency only; never shipped to the browser.
// Usage: node scripts/ocr-ipa.mjs <absolute tesseract.js module path>
import {createRequire} from 'node:module';
import {readdir,writeFile,access} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {createWorker}=require(process.argv[2]);
const dir=path.resolve(process.argv[3] || 'work/release-import/ipa-2026');
const worker=await createWorker('jpn',1,{cachePath:path.resolve('work/release-import/ipa-2026')});
try{
 for(const file of (await readdir(dir)).filter(f=>/^ip-\d+\.png$/.test(f)).sort()){
  const out=path.join(dir,file.replace('.png','.json'));
  try{await access(out);continue;}catch{}
  const {data}=await worker.recognize(path.join(dir,file),{},{text:true,blocks:true});
  await writeFile(out,JSON.stringify({text:data.text,blocks:data.blocks}),'utf8');
  console.log(file);
 }
}finally{await worker.terminate();}
