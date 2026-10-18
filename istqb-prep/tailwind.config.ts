import type {Config} from 'tailwindcss';
const c=(v:string)=>`rgb(var(--${v}) / <alpha-value>)`;
export default {darkMode:'class',content:['./src/**/*.{ts,tsx}'],theme:{extend:{colors:{bg:c('bg'),sf:c('sf'),ln:c('ln'),tx:c('tx'),mu:c('mu'),ac:c('ac'),ok:c('ok'),bad:c('bad'),wn:c('wn')},fontFamily:{sans:['var(--f-sans)','system-ui','sans-serif'],serif:['var(--f-serif)','Georgia','serif']}}},plugins:[]} satisfies Config;
