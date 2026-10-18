import type {NewQ} from './types';import type {K} from './data';
const L='ABCDEF';
export function parseQs(t:string,defCh=1):NewQ[]{
 try{const j=JSON.parse(t);if(Array.isArray(j))return j.map((x:any)=>norm({k:x.k,ch:x.ch??x.c,stem:x.stem??x.q,options:x.options??x.o,correct:x.correct??x.a,hint:x.hint??x.h,explanation:x.explanation??x.w},defCh)).filter(Boolean) as NewQ[]}catch{}
 const blocks:string[][]=[];let cur:string[]|null=null;
 for(const raw of t.split(/\r?\n/)){const l=raw.trim();if(!l)continue;
  const m=l.match(/^(?:Q\s*\d*\s*[:.)]|\d+\s*[.):])\s*(.*)/i);
  if(m){cur=[m[1]];blocks.push(cur)}else if(cur)cur.push(l)}
 return blocks.map(b=>{const x:any={options:[],stem:'',k:'K2',ch:defCh};let inOpts=false;
  for(const l of b){let m;
   if(m=l.match(/^(?:ans(?:wer)?|correct)\s*[:=-]?\s*\(?([A-F])\b/i))x.correct=L.indexOf(m[1].toUpperCase());
   else if(m=l.match(/^K(?:-?level)?\s*[:=]\s*K?([123])/i))x.k='K'+m[1];
   else if(m=l.match(/^(?:ch|chapter)\s*[:=]\s*([1-6])/i))x.ch=+m[1];
   else if(m=l.match(/^hint\s*[:=]\s*(.+)/i))x.hint=m[1];
   else if(m=l.match(/^(?:why|explanation)\s*[:=]\s*(.+)/i))x.explanation=m[1];
   else if(m=l.match(/^\(?([A-Fa-f])[.)]\s+(.+)/)){inOpts=true;x.options.push(m[2])}
   else if(inOpts&&x.options.length)x.options[x.options.length-1]+=' '+l;else x.stem+=(x.stem?' ':'')+l}
  return norm(x,defCh)}).filter(Boolean) as NewQ[]}
function norm(x:any,defCh:number):NewQ|null{
 if(!x||!x.stem||!Array.isArray(x.options)||x.options.length<2||typeof x.correct!=='number'||x.correct<0||x.correct>=x.options.length)return null;
 const ch=Math.min(6,Math.max(1,+x.ch||defCh));
 return {k:(/^K[123]$/.test(x.k)?x.k:'K2') as K,ch,stem:String(x.stem).trim(),options:x.options.map(String),correct:x.correct,hint:x.hint||'Revisit the related syllabus chapter.',explanation:x.explanation||'No explanation supplied with this question.'}}
export async function pdfText(f:File){
 // @ts-ignore legacy build has no bundled types
 const pdf=await import('pdfjs-dist/legacy/build/pdf.mjs');pdf.GlobalWorkerOptions.workerSrc='/pdf.worker.min.mjs';
 const doc=await pdf.getDocument({data:await f.arrayBuffer()}).promise;let out='';
 for(let i=1;i<=doc.numPages;i++){const c=await (await doc.getPage(i)).getTextContent();let y:number|null=null;
  for(const it of c.items as any[]){const ny=it.transform[5];out+=(y!==null&&Math.abs(ny-y)>2?'\n':'')+it.str;y=ny}out+='\n'}
 return out}
