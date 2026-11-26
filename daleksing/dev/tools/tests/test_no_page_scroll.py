"""Playing never scrolls the window."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from common import *
import asyncio, http.server, threading, functools
from playwright.async_api import async_playwright
BASE = serve(8890)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
        pg = await (await b.new_context(viewport={'width':390,'height':844})).new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(BASE + '/daleksing/dev/'); await pg.wait_for_timeout(400)
        # demo: long lyric, so the word box has to scroll; window parked lower down the page
        await pg.evaluate("window.scrollTo(0, 1400)"); y0=await pg.evaluate('scrollY')
        await pg.evaluate("singNow()"); await pg.wait_for_timeout(14000)
        print('demo sing: window', y0, '->', await pg.evaluate('scrollY'), '| word box scrolled to', await pg.evaluate('readout.scrollTop'), 'of', await pg.evaluate('readout.scrollHeight-readout.clientHeight'), '| lit:', await pg.evaluate("(document.querySelector('#readout .on')||{}).textContent"))
        await pg.evaluate("stopAll()")
        # song: HEAR and the editor's play, with the window at the editor
        await pg.select_option('#model',''); await pg.set_input_files('#file',ASSET('test-clip.wav')); await pg.wait_for_timeout(800); await pg.wait_for_function("clip && !suggesting", timeout=30000); await pg.wait_for_timeout(300); await pg.evaluate("()=>{clip.parts=clip.parts.filter(p=>!p.held);renderParts()}")
        await pg.evaluate("()=>{setRegion(0.1,1.5);addPart();setRegion(2.5,4.4);addPart()}"); await pg.wait_for_function("clip.parts.every(p=>p.done) && !analysing", timeout=60000)
        await pg.locator('#edplay').scroll_into_view_if_needed(); y0=await pg.evaluate('scrollY')
        await pg.click('#edplay'); y1=await pg.evaluate('scrollY'); await pg.wait_for_timeout(3500); print('editor play: window', y0, '-> at click', y1, '-> after 3.5 s', await pg.evaluate('scrollY'))
        await pg.click('#edplay'); await pg.locator('#hear-1').scroll_into_view_if_needed(); y0=await pg.evaluate('scrollY')
        await pg.click('#hear-1'); await pg.wait_for_timeout(3500); print('HEAR part 2: window', y0, '->', await pg.evaluate('scrollY'))
        print('errors', errs); await b.close()
asyncio.run(main())
