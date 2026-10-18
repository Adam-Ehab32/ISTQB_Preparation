import sys,re
from playwright.sync_api import sync_playwright,expect
from common import *
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:3100'
errs=[];res=[];PW='Passw0rd!'
def t(name,fn):
    try: fn();res.append((name,True,''))
    except Exception as e: res.append((name,False,str(e).split('\n')[0][:230]))
IGN=re.compile(r'fonts\.g|ERR_NAME_NOT_RESOLVED|Failed to load resource.*(font|favicon)|Download the React DevTools',re.I)
def expected(levels,diff='Auto-mixed',ch=0,qset='All sets'):
    dm={'Easy':1,'Medium':2,'Hard':3}
    return sum(1 for v in BANK.values() if v['k'] in levels and (not ch or v['ch']==ch) and (qset=='All sets' or v['set']==qset[-1]) and (diff=='Auto-mixed' or v['d']==dm[diff]))
def assert_(c,m=''):
    if not c: raise AssertionError(m)
def fmt(v): return str(int(v)) if v==int(v) else str(v)
def gen_answer(s):
    m=re.search(r'optimistic (\d+) days, most likely (\d+) days, pessimistic (\d+) days',s)
    if m: a,mm,b=map(int,m.groups());return fmt(round((a+4*mm+b)/6*10)/10)
    m=re.search(r'has (\d+) independent true/false conditions',s)
    if m: return str(2**int(m.group(1)))
    m=re.search(r'component has (\d+) .*? exercises (\d+) of them',s)
    if m: S,x=map(int,m.groups());return f'{round(100*x/S)}%'
    m=re.search(r'from (\d+) to (\d+) inclusive. Using 2-value',s)
    if m: lo,hi=map(int,m.groups());return f'{lo-1}, {lo}, {hi}, {hi+1}'
    m=re.search(r'from (\d+) to (\d+) inclusive. Using 3-value',s)
    if m: lo,hi=map(int,m.groups());return f'{lo-1}, {lo}, {lo+1}, {hi-1}, {hi}, {hi+1}'
    m=re.search(r'valid totals only\): (.*)\. Using equivalence',s)
    if m: return str(len(m.group(1).split('; ')))
    return None
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':1200,'height':900});pg=ctx.new_page()
    pg.on('console',lambda m:m.type=='error' and not IGN.search(m.text) and errs.append('console: '+m.text[:200]))
    pg.on('pageerror',lambda e:errs.append('pageerror: '+str(e)[:200]))
    def signup(em,name):
        pg.goto(BASE+'/login');pg.get_by_role('tab',name='Sign up').click();pg.get_by_label('Display name').fill(name);pg.get_by_label('Email').fill(em);pg.get_by_label('Password').fill(PW);pg.get_by_role('button',name='Create account').click();pg.wait_for_url(BASE+'/')
    nav=lambda n:pg.get_by_role('link',name=n,exact=True).click()
    info=lambda:pg.get_by_test_id('match-info').inner_text()
    def run_quiz(n,verify=None):
        out=[]
        for i in range(n):
            pg.wait_for_selector(OPT);stem=pg.locator('main h1').first.inner_text();k=pg.get_by_text(re.compile(r'^K[123] ')).first.inner_text()[:2]
            opts=pg.locator(OPT);texts=[opts.nth(j).inner_text()[1:].strip() for j in range(opts.count())];idx=0;gen=None
            if stem in BANK: idx=BANK[stem]['c']
            else:
                gen=gen_answer(stem)
                if gen is not None and gen in texts: idx=texts.index(gen)
                elif gen is not None: raise AssertionError(f'generated answer {gen!r} not among options {texts} for: {stem[:80]}')
            opts.nth(idx).click()
            if gen is not None and verify is not None:
                expect(pg.get_by_text(re.compile('Correct. The answer is'))).to_be_visible();verify.append(stem)
            out.append((stem,k));pg.get_by_role('button',name=re.compile('Next question|See results')).click();pg.wait_for_timeout(250)
        return out
    # ---------- STUDY & MEMORIZE
    signup('studier@example.com','Studier');nav('Study')
    t('study opens at Chapter 1 with the first section expanded',lambda:(expect(pg.get_by_test_id('study-chapter-title')).to_have_text('Chapter 1: Fundamentals'),expect(pg.get_by_test_id('points-list').first).to_be_visible()))
    t('key terms are highlighted in the notes',lambda:expect(pg.get_by_test_id('term-mark').first).to_be_visible())
    def chapters():
        for n in range(1,7):
            pg.get_by_role('button',name=re.compile(rf'^{n}\. ')).click();expect(pg.get_by_test_id('study-chapter-title')).to_contain_text(f'Chapter {n}:');assert pg.locator('main section').count()>=2,f'chapter {n} has too few sections'
    t('all 6 chapters have summary sections',chapters)
    pg.get_by_role('button',name=re.compile(r'^4\. ')).click()
    def collapse():
        pg.get_by_role('button',name='Collapse all').click();expect(pg.get_by_test_id('points-list')).to_have_count(0)
        pg.get_by_role('button',name=re.compile('Black-box techniques')).click();expect(pg.get_by_text(re.compile('2-value BVA')).first).to_be_visible()
    t('collapsible sections: collapse all, then open one',collapse)
    def memo():
        pg.get_by_role('button',name=re.compile('^Memorize mode')).click();expect(pg.get_by_role('button',name='Memorize mode on')).to_have_attribute('aria-pressed','true')
        expect(pg.get_by_test_id('memo-list').first).to_be_visible();expect(pg.get_by_test_id('points-list')).to_have_count(0)
        card=pg.get_by_test_id('term-card').first;expect(card).to_have_attribute('data-revealed','false');assert 'blur-sm' in card.locator('span').nth(1).get_attribute('class')
        card.click();expect(card).to_have_attribute('data-revealed','true');assert 'blur-sm' not in card.locator('span').nth(1).get_attribute('class')
    t('memorization view: bullets only, definitions blurred until tapped',memo)
    t('toggling memorize mode off restores the full notes',lambda:(pg.get_by_role('button',name='Memorize mode on').click(),expect(pg.get_by_test_id('points-list').first).to_be_visible()))
    pg.get_by_role('link',name='Quiz this chapter').click();pg.wait_for_url('**/quiz?ch=4');pg.get_by_role('dialog').wait_for()
    t('Quiz this chapter opens the config with Chapter 4 preselected',lambda:(expect(pg.get_by_role('dialog').get_by_role('button',name='Ch4',exact=True)).to_have_attribute('aria-pressed','true'),assert_(f"{expected(['K1','K2','K3'],ch=4)} matching" in info(),info())))
    # ---------- CONFIG ENGINE
    A=['K1','K2','K3']
    def case(levels,diff='Auto-mixed',ch=0,qset='All sets',count=10):
        configure(pg,count,levels,diff,ch,qset);txt=info();e=expected(levels,diff,ch,qset);assert_(f'{e} matching' in txt,f'expected {e}: {txt}');return txt
    t('K-level filter K1 only: counts match the bank, no generated text',lambda:assert_('generated' not in case(['K1'],ch=0),'gen text for K1'))
    t('K-level filter K1 + K2 / K2 + K3 / All counts match',lambda:[case(l) for l in (['K1','K2'],['K2','K3'],A)])
    t('K3 only shows generated variants and the combined total',lambda:assert_('Fresh generated K3 variants' in (x:=case(['K3'],count=20)) and f"will have {min(20,expected(['K3'])+6)} questions" in x,x))
    t('difficulty filter Easy / Medium / Hard counts match',lambda:[case(A,d) for d in ('Easy','Medium','Hard')])
    t('exam set filter (Set A..D) counts match',lambda:[case(A,qset=s) for s in ('Set A','Set B','Set C','Set D')])
    t('chapter filter counts match for every chapter',lambda:[case(A,ch=c) for c in range(0,7)])
    t('count selector marks the chosen size',lambda:(configure(pg,40),expect(pg.get_by_role('dialog').get_by_role('button',name='40',exact=True)).to_have_attribute('aria-pressed','true')))
    # custom quiz: 5 questions, K1+K2 only
    configure(pg,5,['K1','K2'],'Auto-mixed',0,'All sets');pg.get_by_role('dialog').get_by_role('button',name='Start quiz').click();pg.wait_for_selector(OPT)
    t('custom quiz has exactly 5 questions',lambda:expect(pg.get_by_text('Question 1 of 5')).to_be_visible())
    r=run_quiz(5);t('custom quiz K-level filter: only K1/K2, 5 distinct questions',lambda:assert_(all(k in('K1','K2') for _,k in r) and len({s for s,_ in r})==5,str(r)))
    pg.get_by_role('button',name='Try again').click();pg.wait_for_selector(OPT)
    pg.get_by_role('button',name='Quiz settings').click();configure(pg,5,A,'Hard',0,'All sets');pg.get_by_role('dialog').get_by_role('button',name='Start quiz').click();pg.wait_for_selector(OPT)
    gv=[];r=run_quiz(5,gv);t('Hard difficulty: every bank question served is hard (d=3)',lambda:assert_(all(BANK[s]['d']==3 for s,_ in r if s in BANK),str(r)))
    # ---------- NON-REPEATING QUIZZES
    pg.get_by_role('button',name='Try again').click();pg.wait_for_selector(OPT)
    pg.get_by_role('button',name='Quiz settings').click();configure(pg,10,A,'Auto-mixed',0,'All sets');pg.get_by_role('dialog').get_by_role('button',name='Start quiz').click();pg.wait_for_selector(OPT)
    q1=[s for s,_ in run_quiz(10)];pg.get_by_role('button',name='Try again').click();pg.wait_for_selector(OPT);q2=[s for s,_ in run_quiz(10)];pg.get_by_role('button',name='Try again').click();pg.wait_for_selector(OPT);q3=[s for s,_ in run_quiz(10)]
    t('restart never repeats a question from the previous quiz (3 quizzes of 10)',lambda:assert_(not set(q1)&set(q2) and not set(q2)&set(q3) and len(q1)==len(set(q1))==10,f'{set(q1)&set(q2)} {set(q2)&set(q3)}'))
    # generated K3 variants: unique and arithmetically correct
    pg.get_by_role('button',name='Try again').click();pg.wait_for_selector(OPT);pg.get_by_role('button',name='Quiz settings').click();configure(pg,10,['K3'],'Auto-mixed',0,'All sets');pg.get_by_role('dialog').get_by_role('button',name='Start quiz').click();pg.wait_for_selector(OPT)
    v1=[];k1=run_quiz(10,v1);pg.get_by_role('button',name='Try again').click();pg.wait_for_selector(OPT);v2=[];k2=run_quiz(10,v2)
    g1={s for s,_ in k1 if s not in BANK};g2={s for s,_ in k2 if s not in BANK}
    t('generated K3 variants: answers computed correctly (all clicked answers verified Correct)',lambda:assert_(len(v1)+len(v2)>=4,f'verified only {len(v1)+len(v2)}'))
    t('generated variants are fresh on the next quiz (no repeats)',lambda:assert_(g1 and g2 and not g1&g2,f'{len(g1)} {len(g2)} {g1&g2}'))
    # ---------- unseen-first tracking (fresh user)
    pg.get_by_role('button',name='Sign out').click();pg.wait_for_url('**/login');signup('tracker@example.com','Tracker');nav('Quiz');pg.get_by_role('dialog').wait_for()
    n1=expected(['K1']);configure(pg,15,['K1'],'Auto-mixed',0,'All sets')
    t('fresh user: all K1 questions unseen',lambda:assert_(f'{n1} matching questions in the bank, {n1} unseen' in info(),info()))
    pg.get_by_role('dialog').get_by_role('button',name='Start quiz').click();pg.wait_for_selector(OPT);a=[s for s,_ in run_quiz(15)]
    pg.get_by_role('button',name='Quiz settings').click();pg.get_by_role('dialog').wait_for()
    t('after 15 of 16 K1 questions: exactly 1 unseen',lambda:assert_(f'{n1} matching questions in the bank, 1 unseen' in info(),info()))
    pg.keyboard.press('Escape');pg.get_by_role('button',name='Try again').click();pg.wait_for_selector(OPT);c2=[s for s,_ in run_quiz(15)]
    t('next quiz includes the one unseen question first (all 16 covered)',lambda:assert_(len(set(a)|set(c2))==n1,f'{len(set(a)|set(c2))} of {n1}'))
    pg.get_by_role('button',name='Quiz settings').click();pg.get_by_role('dialog').wait_for()
    t('then 0 unseen remain',lambda:assert_(f'{n1} matching questions in the bank, 0 unseen' in info(),info()))
    t('no console or runtime errors',lambda:assert_(not errs,'; '.join(errs)))
    b.close()
for n,ok,m in res: print(('PASS ' if ok else 'FAIL ')+n+(' :: '+m if m else ''))
print(f"{sum(o for _,o,_ in res)}/{len(res)} passed");sys.exit(0 if all(o for _,o,_ in res) else 1)
