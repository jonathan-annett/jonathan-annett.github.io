"""Dev copy isolation from the live page."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from common import *
import asyncio, http.server, threading, functools
from playwright.async_api import async_playwright
BASE = serve(8879)
LIVE=BASE + '/daleksing/'; DEV=BASE + '/daleksing/dev/'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
        cx = await b.new_context(viewport={'width':390,'height':844}); pg = await cx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        st=lambda: pg.inner_text('#statustext')
        # live page as it is today: one song with one analysed part
        await pg.goto(LIVE); await pg.wait_for_timeout(500); await pg.select_option('#model','Xenova/whisper-tiny.en'); await pg.select_option('#model','')
        await pg.set_input_files('#file',ASSET('test-clip.wav')); await pg.wait_for_timeout(1000)
        await pg.evaluate("()=>{setRegion(2.5,4.4);addPart()}"); await pg.wait_for_function("clip.parts[0].done && !analysing", timeout=60000); await pg.wait_for_timeout(1200)
        live_score = await pg.input_value('#score')
        print('LIVE: devtag present', await pg.evaluate("!!document.getElementById('devtag')"), '| parts', await pg.evaluate('clip.parts.length'))
        # dev copy, first visit
        await pg.goto(DEV); await pg.wait_for_function("clip && clip.parts.length", timeout=20000); await pg.wait_for_timeout(500)
        print('DEV first visit: DEV tag', not await pg.evaluate("$('devtag').hidden"), '| title', await pg.title(), '| model', repr(await pg.input_value('#model')))
        print('  saved list:', (await pg.inner_text('#saved')).replace('\n',' / '), '| reopened', await pg.evaluate('clip.name'), '| score same as live', (await pg.input_value('#score'))==live_score)
        # work in dev: a new song with suggested parts, and change the imported song
        await pg.set_input_files('#file',ASSET('long/Long Song.wav')); await pg.wait_for_function("clip && clip.name==='Long Song.wav' && clip.parts.length && !suggesting", timeout=60000); await pg.wait_for_timeout(1200)
        print('DEV: new song ->', await st())
        await pg.click('#open-1'); await pg.wait_for_function("clip && clip.name==='test-clip.wav'", timeout=20000); await pg.wait_for_timeout(300)
        await pg.click('#parts .part:first-child .prow:first-child button:last-child'); await pg.wait_for_timeout(1200); print('DEV: removed the imported song part ->', await pg.evaluate('clip.parts.length'))
        # live is untouched
        await pg.goto(LIVE); await pg.wait_for_function("clip", timeout=20000); await pg.wait_for_timeout(600)
        print('LIVE after dev work: saved list:', (await pg.inner_text('#saved')).replace('\n',' / '), '| parts', await pg.evaluate('clip.parts.length'), '| score unchanged', (await pg.input_value('#score'))==live_score)
        # dev again: no second import, picks up where it left off
        await pg.goto(DEV); await pg.wait_for_function("clip", timeout=20000); await pg.wait_for_timeout(600)
        print('DEV again: ->', await st(), '| songs', await pg.evaluate("document.querySelectorAll('#saved .saved').length"), '| test-clip parts', await pg.evaluate('clip.name==="test-clip.wav" ? clip.parts.length : "-"'))
        # a browser that never used the live page: dev must not create the live storage
        cx2 = await b.new_context(); pg2 = await cx2.new_page(); pg2.on('pageerror', lambda e: errs.append(str(e)))
        await pg2.goto(DEV); await pg2.wait_for_timeout(1500)
        print('fresh browser, DEV only: databases', await pg2.evaluate("indexedDB.databases().then(d=>d.map(x=>x.name).join(','))"), '|', await pg2.inner_text('#statustext'))
        await pg2.goto(LIVE); await pg2.wait_for_timeout(800); await pg2.set_input_files('#file',ASSET('test-clip.wav')); await pg2.wait_for_timeout(1500)
        print('  then LIVE still saves fine:', (await pg2.inner_text('#saved')).replace('\n',' / '))
        print('errors', errs); await b.close()
asyncio.run(main())
