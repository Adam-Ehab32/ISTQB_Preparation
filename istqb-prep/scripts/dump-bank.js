// node scripts/dump-bank.js > /tmp/bank.json  (stem -> correct index, K, difficulty, set, chapter) for E2E tests
const ts=require('typescript'),fs=require('fs');
const js=ts.transpileModule(fs.readFileSync('src/lib/data.ts','utf8'),{compilerOptions:{module:'commonjs'}}).outputText,m={exports:{}};new Function('module','exports',js)(m,m.exports);
const o={};for(const q of m.exports.QS)o[q.stem]={c:q.correct,k:q.k,d:q.d,set:q.set||null,ch:q.ch};process.stdout.write(JSON.stringify(o));
