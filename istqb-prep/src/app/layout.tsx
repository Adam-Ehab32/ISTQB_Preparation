import './globals.css';import {ThemeProvider} from 'next-themes';import {Schibsted_Grotesk,Newsreader} from 'next/font/google';import Shell from '@/components/Shell';import {AuthProvider} from '@/lib/auth';import {ProfileProvider} from '@/lib/profile';
const sans=Schibsted_Grotesk({subsets:['latin'],variable:'--f-sans'});
const serif=Newsreader({subsets:['latin'],variable:'--f-serif'});
export const metadata={title:'ISTQB v4.0 Prep Master'};
export default function Root({children}:{children:React.ReactNode}){
 return <html lang="en" suppressHydrationWarning className={`${sans.variable} ${serif.variable}`}><body className="font-sans">
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}><AuthProvider><ProfileProvider><Shell>{children}</Shell></ProfileProvider></AuthProvider></ThemeProvider></body></html>}
