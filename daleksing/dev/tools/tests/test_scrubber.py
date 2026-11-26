"""Scrubber, drag-to-seek, marking while paused."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from common import *
import asyncio, http.server, threading, functools
from playwright.async_api import async_playwright
BASE = serve(8896)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width':390,'height':844}); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(BASE + '/daleksing/dev/'); await pg.wait_for_timeout(500)
        st=lambda: pg.inner_text('#statustext')
        await pg.set_input_files('#file',ASSET('test-clip.wav')); await pg.wait_for_timeout(900); await pg.wait_for_function("clip && !suggesting", timeout=30000); await pg.wait_for_timeout(300); await pg.evaluate("()=>{clip.parts=clip.parts.filter(p=>!p.held);renderParts()}")
        print('1', await st(), '| scrub max', await pg.get_attribute('#scrub','max'), '| play label', await pg.inner_text('#play'))
        await pg.evaluate("()=>{const s=document.getElementById('scrub');s.value=1.2;s.dispatchEvent(new Event('input',{bubbles:true}))}")
        print('2 slider ->', await st(), '| pos', await pg.evaluate('clip.pos'), '| burst playing', await pg.evaluate('!!blipSrc'), '| readout', await pg.inner_text('#scrubt'))
        await pg.click('#mfrom'); m=await st()
        box=await pg.locator('#wave').bounding_box(); y=box['y']+box['height']/2
        await pg.mouse.move(box['x']+box['width']*0.3, y); await pg.mouse.down(); await pg.mouse.move(box['x']+box['width']*0.5, y, steps=4); await pg.mouse.move(box['x']+box['width']*0.7, y, steps=4); await pg.mouse.up()
        print('3 mark start ->', m, '| drag ->', await st(), '| pos', round(await pg.evaluate('clip.pos'),2), '(expect about', round(4.6*0.7,2), ') still paused', await pg.evaluate('!playing'))
        await pg.click('#mto'); print('4 mark end ->', await st(), '| region', await pg.input_value('#from'), await pg.input_value('#to'))
        await pg.click('#play'); await pg.wait_for_timeout(600); print('5 play ->', await st(), '| label', await pg.inner_text('#play'), '| pos', round(await pg.evaluate('clipPos()'),2))
        await pg.mouse.move(box['x']+box['width']*0.2, y); await pg.mouse.down(); await pg.mouse.move(box['x']+box['width']*0.25, y, steps=3); await pg.mouse.up(); await pg.wait_for_timeout(500)
        print('6 drag while playing -> resumes', await pg.evaluate('!!playing'), '| pos', round(await pg.evaluate('clipPos()'),2))
        await pg.click('#play'); print('7 pause ->', await st(), '| label', await pg.inner_text('#play'))
        await pg.click('#addpart'); print('8 add ->', await st())
        await pg.screenshot(path=OUTP('scrub.png'), clip={'x':0,'y':850,'width':390,'height':330}, full_page=True)
        print('errors', errs); await b.close()
asyncio.run(main())
