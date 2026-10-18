import json,re,subprocess,os
from playwright.sync_api import expect
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANK=json.loads(subprocess.check_output(['node','scripts/dump-bank.js'],cwd=ROOT))
OPT='button:has(> span.mr-3)'
PRESET={('K1',):'K1 only',('K2',):'K2 only',('K3',):'K3 only',('K1','K2'):'K1 + K2',('K1','K3'):'K1 + K3',('K2','K3'):'K2 + K3',('K1','K2','K3'):'All K1/K2/K3'}
def cidx(pg):
    s=pg.locator('main h1').first.inner_text()
    if s in BANK: return BANK[s]['c']
    raise AssertionError('unknown question: '+s)
def configure(pg,count=None,levels=None,diff=None,ch=None,qset=None):
    d=pg.get_by_role('dialog')
    if ch is not None: d.get_by_role('button',name=('All chapters' if ch==0 else f'Ch{ch}'),exact=True).click()
    if count: d.get_by_role('button',name=str(count),exact=True).click()
    if levels: d.get_by_role('button',name=PRESET[tuple(levels)],exact=True).click()
    if diff: d.get_by_role('button',name=diff,exact=True).click()
    if qset: d.get_by_role('button',name=qset,exact=True).click()
def start_quiz(pg,count=6,levels=('K1','K2'),**kw):
    pg.get_by_role('dialog').wait_for();configure(pg,count,levels,**kw)
    pg.get_by_role('dialog').get_by_role('button',name='Start quiz').click();pg.wait_for_selector(OPT);expect(pg.get_by_role('dialog')).to_have_count(0)
