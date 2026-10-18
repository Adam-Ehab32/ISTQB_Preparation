import sys,re,json
from playwright.sync_api import sync_playwright,expect
from common import cidx,start_quiz,OPT,BANK
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:3100'
errs=[];res=[]
def t(name,fn):
    try: fn();res.append((name,True,''))
    except Exception as e: res.append((name,False,str(e).split('\n')[0][:220]))
IGN=re.compile(r'fonts\.g|ERR_NAME_NOT_RESOLVED|Failed to load resource.*(font|favicon)|Download the React DevTools',re.I)
FLAW={'Our suite reached 100%':1,'We ran 500 tests':1,'The login defect was fixed':0,'The valid range is 18':1,'Testers should fix':1,"A risk's level is decided":1}
PW='Passw0rd!'
def ans(pg,ok=True):
    ci=cidx(pg);pg.locator(OPT).nth(ci if ok else (ci+1)%4).click()
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':1200,'height':900});pg=ctx.new_page()
    pg.on('console',lambda m:m.type=='error' and not IGN.search(m.text) and errs.append('console: '+m.text[:200]))
    pg.on('pageerror',lambda e:errs.append('pageerror: '+str(e)[:200]))
    def hgoto(u):
        pg.wait_for_load_state('networkidle');pg.goto(u)
    def hreload():
        pg.wait_for_load_state('networkidle');pg.reload()
    def mut(js): pg.evaluate("(src)=>{const s=JSON.parse(localStorage.getItem('iq.demo.v1'));const u=s.users[s.session];const d=s.data[u.id];(new Function('d',src))(d);localStorage.setItem('iq.demo.v1',JSON.stringify(s))}",js)
    def signup(em,name):
        hgoto(BASE+'/login');pg.get_by_role('tab',name='Sign up').click();pg.get_by_label('Display name').fill(name);pg.get_by_label('Email').fill(em);pg.get_by_label('Password').fill(PW);pg.get_by_role('button',name='Create account').click();pg.wait_for_url(BASE+'/')
    ctxs=lambda:pg.get_by_test_id('xp-chip')
    nav=lambda n:pg.get_by_role('link',name=n,exact=True).click()
    # ---------- SMART COFFEE
    signup('learner@example.com','Learner')
    t('coffee widget on dashboard with 3 picks',lambda:(expect(pg.get_by_test_id('coffee-widget')).to_be_visible(),expect(pg.get_by_test_id('coffee-reason')).to_have_count(3),expect(pg.get_by_role('link',name='Brew now')).to_be_visible()))
    t('6 chapter cards start at 0% (not started)',lambda:[ (expect(pg.get_by_test_id(f'ch-card-{n}')).to_contain_text('0%'),expect(pg.get_by_test_id(f'ch-card-{n}')).to_have_attribute('data-band','none')) for n in range(1,7)])
    mut("d.vault['q5']={wrong:1,streak:0,cleared:false};d.coffee=null")
    hreload();pg.wait_for_selector('[data-testid=coffee-reason]')
    t('priority: Mistake Vault question is picked first',lambda:expect(pg.get_by_test_id('coffee-reason').first).to_have_text('Mistake Vault'))
    pg.get_by_role('link',name='Brew now').click();pg.wait_for_url('**/coffee');pg.wait_for_selector(OPT)
    t('coffee session starts with the vault question',lambda:expect(pg.locator('main h1').first).to_contain_text('An age field'))
    gains=[]
    for n in range(3):
        pg.wait_for_selector(OPT);ans(pg,True);chip=pg.get_by_test_id('xp-gain');chip.wait_for();gains.append(int(re.search(r'\+(\d+) XP',chip.inner_text()).group(1)))
        if n==0:t('vault note after 1st correct: needs 1 more',lambda:expect(pg.get_by_test_id('vault-note')).to_contain_text('1 more correct'))
        pg.get_by_role('button',name=re.compile('Next question|See results')).click();pg.wait_for_timeout(350)
    t('coffee bonus +15 XP on completion',lambda:expect(pg.get_by_test_id('coffee-bonus')).to_have_text('+15 XP'))
    t('instant XP: nav chip = answers + bonus',lambda:expect(ctxs()).to_have_text(f'{sum(gains)+15} XP'))
    hgoto(BASE+'/');t('widget shows done state',lambda:expect(pg.get_by_test_id('coffee-widget')).to_contain_text('Done for today'))
    hgoto(BASE+'/coffee');t('coffee page is closed after completion',lambda:expect(pg.get_by_text("Today's Smart Coffee is done")).to_be_visible())
    # ---------- MISTAKE VAULT
    nav('Vault');t('vault holds the q5 mistake (1 of 2 correct so far)',lambda:(expect(pg.get_by_test_id('vault-count')).to_have_text('1'),expect(pg.get_by_test_id('vault-list')).to_contain_text('An age field')))
    def retest(ok):
        pg.get_by_role('button',name=re.compile('^Retest')).click();pg.wait_for_selector(OPT);ans(pg,ok);pg.get_by_test_id('vault-note').wait_for();return pg.get_by_test_id('vault-note').inner_text()
    note=retest(False);t('a miss resets progress and re-adds to vault',lambda:(_ for _ in ()).throw(AssertionError(note)) if 'Added to your Mistake Vault' not in note else None)
    def analogy():
        btn=pg.get_by_role('button',name=re.compile('Real-World Analogy'));expect(btn).to_be_visible();expect(pg.get_by_test_id('analogy-text')).to_have_count(0);btn.click();expect(pg.get_by_test_id('analogy-text')).to_contain_text('cinema');btn.click();expect(pg.get_by_test_id('analogy-text')).to_have_count(0)
    t('Real-World Analogy drawer expands/collapses next to the explanation',analogy)
    pg.get_by_role('button',name='See results').click();pg.get_by_role('button',name='Try again').click()
    note=retest(True);t('1st correct after miss: needs one more',lambda:(_ for _ in ()).throw(AssertionError(note)) if '1 more correct' not in note else None)
    pg.get_by_role('button',name='See results').click();pg.get_by_role('button',name='Try again').click()
    t('vault still holds it after 1 correct',lambda:expect(pg.get_by_test_id('vault-count')).to_have_text('1'))
    note=retest(True);t('2nd consecutive correct clears it',lambda:(_ for _ in ()).throw(AssertionError(note)) if 'Cleared' not in note else None)
    pg.get_by_role('button',name='See results').click();pg.get_by_role('button',name='Try again').click()
    t('vault empty + cleared counter',lambda:(expect(pg.get_by_text('Your vault is empty')).to_be_visible(),expect(pg.get_by_test_id('vault-cleared')).to_have_text('1')))
    nav('Quiz');start_quiz(pg,5,('K1','K2'));stem=pg.locator('main h1').first.inner_text();ans(pg,False);pg.get_by_test_id('vault-note').wait_for()
    nav('Vault');t('wrong answer in a normal quiz is logged automatically',lambda:(expect(pg.get_by_test_id('vault-count')).to_have_text('1'),expect(pg.get_by_test_id('vault-list')).to_contain_text(stem[:30])))
    # analogy on topic drawer
    nav('Mind-maps');pg.wait_for_selector('.react-flow__node');pg.get_by_role('button',name=re.compile('4. Analysis')).click()
    def topic():
        pg.locator('.react-flow__node',has_text='Black-box').click();d=pg.get_by_role('dialog');pg.get_by_role('button',name=re.compile('Real-World Analogy')).click();expect(d).to_contain_text('vending machine');pg.keyboard.press('Escape');expect(d).to_be_hidden()
    t('mind-map drawer shows a topic analogy',topic)
    # ---------- SPOT THE BUG
    nav('Spot the bug');pg.wait_for_selector('[data-testid=claim]')
    first=True
    for n in range(6):
        pg.wait_for_selector('[data-testid=claim]');claim=pg.get_by_test_id('claim').inner_text();fi=[v for k,v in FLAW.items() if claim.startswith(k)][0]
        pg.locator('section button:has(> span.mr-3)').nth(fi if not first else (fi+1)%4).click()
        if first:
            first=False;t('wrong flaw: shows trap name + correction',lambda:(expect(pg.get_by_test_id('spot-result')).to_contain_text('Not that one'),expect(pg.get_by_test_id('trap')).to_be_visible(),expect(pg.get_by_test_id('spot-result')).to_contain_text('.')))
        pg.get_by_role('button',name=re.compile('Next card|See results')).click();pg.wait_for_timeout(350)
    t('spot-the-bug summary 5 of 6',lambda:expect(pg.get_by_test_id('spot-score')).to_have_text('5 of 6 flaws spotted'))
    # ---------- READINESS CALCULATION (fresh user, injected attempts)
    pg.get_by_role('button',name='Sign out').click();pg.wait_for_url('**/login')
    signup('calc@example.com','Calc')
    A=lambda q,ch,k,ok:{'ts':0,'ok':ok,'fast':False,'q':q,'ch':ch,'k':k}
    atts=[A('q4',4,'K2',True),A('q9',4,'K2',False),A('q5',4,'K3',True),A('q7',4,'K3',True),A('q1',1,'K1',True),A('q16',1,'K1',True),A('q19',1,'K1',True),A('q17',1,'K2',True),A('q18',1,'K2',True),A('q20',1,'K2',True),A('q2',2,'K1',False)]
    mut("d.att="+json.dumps(atts));hreload();pg.wait_for_selector('[data-testid=ch-card-4]')
    def calc():
        c4=pg.get_by_test_id('ch-card-4');expect(c4).to_have_attribute('data-readiness','59');expect(c4).to_contain_text('K1 -');expect(c4).to_contain_text('K2 50%');expect(c4).to_contain_text('K3 100%');expect(c4).to_contain_text('Coverage 27%')
    t('chapter 4 readiness = 0.6*80 + 0.4*27 = 59%',calc)
    t('color bands: ch1 high / ch4 mid / ch2 low / ch3 not started',lambda:[expect(pg.get_by_test_id(f'ch-card-{n}')).to_have_attribute('data-band',bd) for n,bd in [(1,'high'),(4,'mid'),(2,'low'),(3,'none')]])
    t('overall readiness = exam-weighted chapters x 0.6 = 22%',lambda:expect(pg.get_by_test_id('readiness')).to_have_text('22%'))
    mut("d.mocks=[{correct:30,total:40,ts:'2026-01-01'}]");hreload();pg.wait_for_selector('[data-testid=ch-card-4]')
    t('with a 75% mock: 0.4*36.2 + 0.6*75 = 59%',lambda:expect(pg.get_by_test_id('readiness')).to_have_text('59%'))
    t('no console or runtime errors',lambda:(_ for _ in ()).throw(AssertionError('; '.join(errs))) if errs else None)
    b.close()
for n,ok,m in res: print(('PASS ' if ok else 'FAIL ')+n+(' :: '+m if m else ''))
print(f"{sum(o for _,o,_ in res)}/{len(res)} passed");sys.exit(0 if all(o for _,o,_ in res) else 1)
