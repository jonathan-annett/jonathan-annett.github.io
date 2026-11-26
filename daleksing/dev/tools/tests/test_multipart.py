"""Several parts, singer replacement per part, whole-song and parts-only playback."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from common import *
import asyncio, json, http.server, threading, functools
from playwright.async_api import async_playwright
BASE = serve(8897)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width':390,'height':844}); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(BASE + '/daleksing/dev/'); await pg.wait_for_timeout(600)
        st=lambda: pg.inner_text('#statustext')
        sc=lambda: pg.input_value('#score')
        async def mark(a,b_):
            await pg.fill('#from',str(a)); await pg.dispatch_event('#from','change'); await pg.fill('#to',str(b_)); await pg.dispatch_event('#to','change')
        await pg.click('#sing'); await pg.wait_for_timeout(900); print('0 demo sings ->', await st()); await pg.click('#stop')
        await pg.set_input_files('#file',ASSET('test-clip.wav')); await pg.wait_for_timeout(1000); await pg.wait_for_function("clip && !suggesting", timeout=30000); await pg.wait_for_timeout(300); await pg.evaluate("()=>{clip.parts=clip.parts.filter(p=>!p.held);renderParts()}"); print('1 load ->', await st(), '| score empty', (await sc())=='')
        await mark(0.1,1.5); await pg.click('#addpart'); a1=await st()
        await mark(2.5,4.4); await pg.click('#addpart'); a2=await st()
        await mark(1.0,3.0); await pg.click('#addpart'); print('2 add ->', a1,'|',a2,'|',await st())
        await pg.wait_for_function("clip.parts.every(p=>p.done) && !analysing", timeout=120000)
        print('3 find ->', (await st())[:230]); print('  score:', (await sc()).replace('\n',' | ')); print('  parts:', (await pg.inner_text('#parts')).replace('\n',' / '))
        await pg.click('#part-1'); await pg.fill('#lyrics','exterminate today'); await pg.dispatch_event('#lyrics','change'); print('4 fit part 2 ->', await st()); print('  score:', (await sc()).replace('\n',' | '))
        await pg.click('#mode-1'); print('5 mode ->', await st())
        await pg.click('#sing'); await pg.wait_for_timeout(800)
        print('6 sing whole ->', await st(), '| mix used', await pg.evaluate('musicSrc.buffer!==clip.origBuf'), '| playhead', round(await pg.evaluate('clipPos()'),2), '| words shown', await pg.evaluate("document.querySelectorAll('#readout span').length"))
        r=await pg.evaluate("""()=>{const m=clip.mix.getChannelData(0),o=clip.origBuf.getChannelData(0),sr=clip.sr;const e=(x,a,b)=>{let s=0;for(let i=Math.floor(a*sr);i<b*sr;i++)s+=x[i]*x[i];return s};let d=0;for(let i=0;i<Math.floor(2.4*sr);i++)d=Math.max(d,Math.abs(m[i]-o[i]));return {outsideMaxDiff:d,part2orig:e(o,2.7,4.2),part2mix:e(m,2.7,4.2)}}""")
        print('  mix check', json.dumps(r)); await pg.wait_for_timeout(4800); print('  after ->', await st())
        await pg.select_option('#span','parts'); await pg.click('#sing'); await pg.wait_for_timeout(500); print('7 parts only -> playhead', round(await pg.evaluate('clipPos()'),2)); await pg.click('#stop')
        await pg.click('#part-1'); await pg.wait_for_function("clip.parts.every(p=>p.done) && !analysing", timeout=120000); print('8 redo part 2 ->', (await st())[:120])
        await pg.click('#parts .part:first-child .prow:first-child button:last-child'); print('9 delete part 1 ->', await st(), '| score:', (await sc()).replace('\n',' | '), '| parts:', (await pg.inner_text('#parts')).replace('\n',' / '))
        await pg.screenshot(path=OUTP('parts.png'), clip={'x':0,'y':800,'width':390,'height':520}, full_page=True)
        await pg.click('#demo'); await pg.click('#sing'); await pg.wait_for_timeout(600); print('10 demo again ->', await st()); print('errors', errs); await b.close()
asyncio.run(main())
