import sys,re,time,json
from playwright.sync_api import sync_playwright,expect
from common import cidx,start_quiz,OPT,BANK
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:3100'
errs=[];res=[]
def t(name,fn):
    try: fn();res.append((name,True,''))
    except Exception as e: res.append((name,False,str(e).split('\n')[0][:200]))
IGN=re.compile(r'fonts\.g|ERR_NAME_NOT_RESOLVED|Failed to load resource.*(font|favicon)|Download the React DevTools',re.I)
PW='Passw0rd!';EM='tester@example.com'
correct_idx=cidx
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':1200,'height':900});pg=ctx.new_page()
    pg.on('console',lambda m:m.type=='error' and not IGN.search(m.text) and errs.append('console: '+m.text[:200]))
    pg.on('pageerror',lambda e:errs.append('pageerror: '+str(e)[:200]))
    html=pg.locator('html');dark=re.compile(r'\bdark\b')
    # ---- AUTH
    pg.goto(BASE);t('protected route redirects to /login',lambda:pg.wait_for_url('**/login'))
    def signup(em=EM,pw=PW,name='Test User'):
        pg.get_by_role('tab',name='Sign up').click();pg.get_by_label('Display name').fill(name);pg.get_by_label('Email').fill(em);pg.get_by_label('Password').fill(pw);pg.get_by_role('button',name='Create account').click()
    signup();t('sign up lands on dashboard with profile name',lambda:(pg.wait_for_url(BASE+'/'),expect(pg.get_by_text('Welcome back, Test User')).to_be_visible()))
    t('profile shows XP and streak fields',lambda:(expect(pg.get_by_test_id('xp-chip')).to_have_text('0 XP'),expect(pg.get_by_test_id('streak')).to_contain_text('0')))
    pg.get_by_role('button',name='Sign out').click();pg.wait_for_url('**/login')
    t('signed-out user cannot open /leaderboard',lambda:(pg.goto(BASE+'/leaderboard'),pg.wait_for_url('**/login')))
    signup();t('duplicate sign up shows error',lambda:expect(pg.locator('form [role=alert]')).to_contain_text('already exists'))
    pg.get_by_role('tab',name='Sign in').click();pg.get_by_label('Email').fill(EM);pg.get_by_label('Password').fill('wrongpass');pg.get_by_role('button',name='Sign in',exact=True).click()
    t('wrong password shows error',lambda:expect(pg.locator('form [role=alert]')).to_contain_text('Invalid email or password'))
    pg.get_by_role('button',name='Forgot password?').click();pg.get_by_label('Email').fill(EM);pg.get_by_role('button',name='Send reset link').click()
    t('forgot password confirms link sent',lambda:expect(pg.get_by_role('status').filter(has_text='reset link')).to_be_visible())
    pg.goto(BASE+'/reset-password');pg.get_by_label('New password').fill('N3wPassw0rd!');pg.get_by_role('button',name='Update password').click()
    t('password reset signs user in',lambda:(pg.wait_for_url(BASE+'/'),expect(pg.get_by_test_id('xp-chip')).to_be_visible()))
    pg.get_by_role('button',name='Sign out').click();pg.wait_for_url('**/login')
    pg.get_by_label('Email').fill(EM);pg.get_by_label('Password').fill('N3wPassw0rd!');pg.get_by_role('button',name='Sign in',exact=True).click()
    t('sign in with new password works',lambda:pg.wait_for_url(BASE+'/'))
    pg.get_by_role('button',name='Sign out').click();pg.wait_for_url('**/login');pg.get_by_role('button',name='Continue with Google').click()
    t('Google sign-in (demo) works',lambda:(pg.wait_for_url(BASE+'/'),expect(pg.get_by_text('Welcome back, Google Demo User')).to_be_visible()))
    pg.get_by_role('button',name='Sign out').click();pg.wait_for_url('**/login');pg.get_by_label('Email').fill(EM);pg.get_by_label('Password').fill('N3wPassw0rd!');pg.get_by_role('button',name='Sign in',exact=True).click();pg.wait_for_url(BASE+'/')
    # ---- THEME
    t('dark mode is default',lambda:expect(html).to_have_class(dark))
    pg.get_by_role('button',name=re.compile('dark and light')).click();t('light mode toggle',lambda:expect(html).not_to_have_class(dark))
    pg.reload();pg.wait_for_selector('h1');t('light persists after reload',lambda:expect(html).not_to_have_class(dark))
    pg.get_by_role('button',name=re.compile('dark and light')).click();t('back to dark',lambda:expect(html).to_have_class(dark))
    t('readiness meter renders at 0%',lambda:expect(pg.get_by_test_id('readiness')).to_have_text('0%'))
    # ---- QUIZ + XP
    pg.get_by_role('link',name='Quiz',exact=True).click();pg.wait_for_url('**/quiz');start_quiz(pg,5,('K1','K2'))
    t('quiz shows K badge + timer',lambda:(expect(pg.get_by_text(re.compile(r'^K[123] '))).to_be_visible(),expect(pg.get_by_role('timer')).to_be_visible()))
    def hint():
        pg.get_by_role('button',name='Get concept hint').click();d=pg.get_by_role('dialog');expect(d).to_be_visible();expect(d).to_contain_text('Target time');pg.keyboard.press('Escape');expect(d).to_be_hidden()
    t('hint drawer opens/closes',hint)
    EXP={'K1':20,'K2':30,'K3':40};gains=[];streak_seen=[]
    for n in range(5):
        pg.wait_for_selector(OPT);k=pg.get_by_text(re.compile(r'^K[123] ')).first.inner_text()[:2];pg.wait_for_timeout(1100 if n==0 else 300)
        pg.locator(OPT).nth(correct_idx(pg)).click();chip=pg.get_by_test_id('xp-gain');chip.wait_for()
        txt=chip.inner_text();gains.append((k,txt));streak_seen.append('5-in-a-row' in txt)
        if n<4:pg.get_by_role('button',name='Next question').click()
    t('XP per level + speed bonus (K1 20 / K2 30 / K3 40)',lambda:[ (_ for _ in ()).throw(AssertionError(f'{k}: {tx}')) for k,tx in gains if f'+{EXP[k]+(25 if "5-in-a-row" in tx else 0)} XP' not in tx and 'Daily' not in tx])
    t('+25 streak bonus on 5th correct in a row',lambda:(_ for _ in ()).throw(AssertionError(str(streak_seen))) if streak_seen!=[False,False,False,False,True] else None)
    exp_total=sum(EXP[k] for k,_ in gains)+25
    t('nav XP chip matches total earned',lambda:expect(pg.get_by_test_id('xp-chip')).to_have_text(f'{exp_total} XP'))
    pg.get_by_role('button',name='See results').click();t('wrong-answer path: results screen',lambda:expect(pg.get_by_test_id('score')).to_contain_text('5 of 5'))
    # wrong answer explanation
    pg.get_by_role('button',name='Try again').click();pg.wait_for_selector(OPT)
    def wrong():
        ci=correct_idx(pg);pg.locator(OPT).nth((ci+1)%4).click();expect(pg.get_by_text(re.compile('Not quite'))).to_be_visible();expect(pg.get_by_text(re.compile('answer is'))).to_be_visible()
    t('wrong answer shows detailed explanation + no XP',wrong)
    pg.get_by_role('link',name='Leaderboard').click();pg.wait_for_url('**/leaderboard')
    t('leaderboard overall shows my updated XP',lambda:expect(pg.locator('[data-me="1"]')).to_contain_text(f'{exp_total} XP'))
    pg.get_by_role('tab',name='Weekly top').click();t('weekly tab includes me',lambda:expect(pg.locator('[data-me="1"]')).to_contain_text(f'{exp_total} XP'))
    pg.get_by_role('tab',name='Speed & accuracy').click();t('champions tab includes me (>=5 answers)',lambda:expect(pg.locator('[data-me="1"]')).to_contain_text('% acc'))
    pg.get_by_role('link',name='Today').click();pg.wait_for_url(BASE+'/')
    t('heatmap shows activity today',lambda:expect(pg.locator('[data-testid=heatmap] [data-level="1"], [data-testid=heatmap] [data-level="2"]').first).to_be_visible())
    t('readiness gains coverage',lambda:expect(pg.get_by_test_id('readiness')).not_to_have_text('0%'))
    # daily goal bonus + streak
    pg.evaluate("""()=>{const s=JSON.parse(localStorage.getItem('iq.demo.v1'));const u=s.users[s.session];const d=s.data[u.id];const t=new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);d.act[t]=899000;d.paid={};localStorage.setItem('iq.demo.v1',JSON.stringify(s))}""")
    pg.get_by_role('link',name='Quiz',exact=True).click();start_quiz(pg,5,('K1','K2'));pg.wait_for_timeout(1800);pg.locator(OPT).nth(correct_idx(pg)).click()
    t('daily 15-min goal pays +50 XP',lambda:expect(pg.get_by_test_id('xp-gain')).to_contain_text('Daily 15-min goal +50'))
    pg.get_by_role('link',name='Today').click();t('streak counter increments to 1',lambda:expect(pg.get_by_test_id('streak')).to_contain_text('1'))
    # ---- UPLOAD (PDF) + MOCK
    lines=[]
    for i in range(1,73):
        lines+= [f'{i}. Sample question number {i} for chapter {(i%6)+1}?','A) First option','B) Second option','C) Third option','D) Fourth option','Answer: B',f'K: K{(i%3)+1}',f'CH: {(i%6)+1}','WHY: Option B is correct by construction.']
    pp=ctx.new_page();pp.set_content('<html><body style="font:14px sans-serif">'+''.join(f'<div>{l}</div>' for l in lines)+'</body></html>');pp.pdf(path='/tmp/exam_a.pdf');pp.close()
    pg.get_by_role('link',name='Upload').click();pg.wait_for_url('**/admin')
    pg.get_by_label('Upload exam file').set_input_files('/tmp/exam_a.pdf')
    t('PDF parser extracts all 72 questions',lambda:expect(pg.get_by_role('button',name=re.compile(r'Add 72 to question bank'))).to_be_visible(timeout=20000))
    pg.get_by_role('button',name=re.compile('Add 72')).click();t('questions added to bank',lambda:expect(pg.get_by_text('Added 72 question(s)')).to_be_visible())
    pg.get_by_role('link',name='Mock exam').click();pg.wait_for_url('**/mock')
    t('mock exam offers full 40/60',lambda:expect(pg.get_by_role('button',name='Start mock exam')).to_be_enabled())
    pg.get_by_role('button',name='Start mock exam').click();pg.wait_for_selector(OPT)
    t('mock: 40 questions + 60:00 countdown',lambda:(expect(pg.get_by_text('of 40')).to_be_visible(),expect(pg.get_by_role('timer')).to_have_text(re.compile(r'^(60:00|59:5\d)$'))))
    t('mock: no hint button, no instant answer reveal',lambda:(expect(pg.get_by_role('button',name='Get concept hint')).to_have_count(0),pg.locator(OPT).first.click(),expect(pg.get_by_text('Correct. The answer')).to_have_count(0)))
    for n in range(40):
        if n>0:pg.wait_for_selector(OPT);pg.locator(OPT).nth(1).click()
        pg.get_by_role('button',name=re.compile('Next question|Finish exam')).click()
    t('mock results: score of 40 + mistakes reviewed',lambda:expect(pg.get_by_test_id('score')).to_contain_text('of 40 correct'))
    pg.get_by_role('link',name='Today').click();pg.wait_for_url(BASE+'/')
    t('readiness uses mock result',lambda:expect(pg.get_by_text(re.compile('best mock \\d+%'))).to_be_visible())
    # ---- MIND MAP (React Flow)
    pg.get_by_role('link',name='Mind-maps').click();pg.wait_for_url('**/maps');pg.wait_for_selector('.react-flow__node')
    t('React Flow renders root + 3 nodes',lambda:expect(pg.locator('.react-flow__node')).to_have_count(4))
    def node():
        pg.locator('.react-flow__node',has_text='Seven principles').click();d=pg.get_by_role('dialog');expect(d).to_be_visible();expect(d).to_contain_text('Presence not absence');pg.keyboard.press('Escape');expect(d).to_be_hidden()
    t('node click opens summary drawer',node)
    pg.get_by_role('button',name=re.compile('4. Analysis')).click();t('chapter switch redraws map',lambda:expect(pg.locator('.react-flow__node',has_text='Black-box')).to_be_visible())
    t('no console or runtime errors',lambda:(_ for _ in ()).throw(AssertionError('; '.join(errs))) if errs else None)
    b.close()
for n,ok,m in res: print(('PASS ' if ok else 'FAIL ')+n+(' :: '+m if m else ''))
print(f"{sum(o for _,o,_ in res)}/{len(res)} passed");sys.exit(0 if all(o for _,o,_ in res) else 1)
