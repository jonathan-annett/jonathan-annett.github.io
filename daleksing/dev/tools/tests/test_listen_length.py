"""HEAR as a stop toggle, LISTEN for a selection, syllable length box."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from common import *
import asyncio, json, http.server, threading, functools
from playwright.async_api import async_playwright
BASE = serve(8884)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
        pg = await (await b.new_context(viewport={'width':390,'height':844})).new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(BASE + '/daleksing/dev/'); await pg.wait_for_timeout(400); await pg.select_option('#model','')
        st=lambda: pg.inner_text('#statustext'); lines=lambda: pg.evaluate("partLines(clip.parts[0]).join(' | ')")
        await pg.set_input_files('#file',ASSET('test-clip.wav')); await pg.wait_for_timeout(800); await pg.wait_for_function("clip && !suggesting", timeout=30000); await pg.wait_for_timeout(300); await pg.evaluate("()=>{clip.parts=clip.parts.filter(p=>!p.held);renderParts()}")
        await pg.evaluate("()=>{setRegion(2.2,4.4);addPart()}"); await pg.wait_for_function("clip.parts[0].done && !analysing", timeout=60000)
        await pg.evaluate("()=>{setScoreRange(2.2,4.4,'2.57 robot G4:0.25 G4:0.25\\n3.07 voices E4:0.51 A3:0.51'); clip.parts[0].text='robot voices'; edSync(true)}")
        # 1 HEAR toggles
        await pg.click('#hear-0'); await pg.wait_for_timeout(300); a=(await pg.inner_text('#hear-0'), await pg.evaluate('!!playing'))
        await pg.click('#hear-0'); await pg.wait_for_timeout(200); b_=(await pg.inner_text('#hear-0'), await pg.evaluate('!!playing'), await st())
        print('1 HEAR ->', a, '| HEAR again ->', b_)
        # 2 LISTEN plays only the selection
        await pg.evaluate("edSelect({w:1,j:0})")
        print('2 syllable selected: length box', await pg.input_value('#edlen'), '| LISTEN enabled', not await pg.evaluate("$('edlisten2').disabled"))
        await pg.click('#edlisten2'); await pg.wait_for_timeout(250)
        print('  robot syllables queued', await pg.evaluate("(()=>{const pr=prepare(),sp=edSelSpan();return windowFor(pr,{part:ed.p,from:sp.a-0.25,to:sp.b+0.25,evFrom:sp.a-0.01,evTo:sp.b-0.005}).events.map(e=>e.start.toFixed(2)).join(',')})()"))
        print('  listen -> from', round(await pg.evaluate('playing.offset'),2), '| status', await st(), '| button', await pg.inner_text('#edlisten2'), '| PLAY button', await pg.inner_text('#edplay'))
        await pg.wait_for_timeout(1300); print('  after ~1.5 s ->', await pg.evaluate('!!playing'), '|', await st(), '| button', await pg.inner_text('#edlisten2'))
        await pg.click('#edlisten2'); await pg.wait_for_timeout(100); await pg.click('#edword'); await pg.click('#edprev'); await pg.click('#edlisten2'); await pg.wait_for_timeout(200)
        print('  phrase listen -> from', round(await pg.evaluate('playing.offset'),2), '| length box disabled', await pg.evaluate("$('edlen').disabled")); await pg.click('#edlisten2'); print('  pressed again ->', await pg.evaluate('!!playing'), await pg.inner_text('#edlisten2'))
        # 3 length box
        await pg.evaluate("edSelect({w:0,j:0})"); print('3 "ro" length', await pg.input_value('#edlen'), '| lines', await lines())
        await pg.fill('#edlen','0.40'); await pg.press('#edlen','Enter'); print('  set 0.40 ->', await lines(), '| box', await pg.input_value('#edlen'))
        await pg.focus('#edlen'); await pg.keyboard.press('ArrowUp'); await pg.keyboard.press('ArrowUp'); await pg.dispatch_event('#edlen','change'); print('  spinner up x2 ->', await lines(), '| box', await pg.input_value('#edlen'))
        await pg.fill('#edlen','3'); await pg.press('#edlen','Enter'); print('  set 3 ->', await lines(), '|', await st())
        await pg.evaluate("edSelect({w:1,j:1})"); await pg.fill('#edlen','0.30'); await pg.press('#edlen','Enter'); print('  last syllable 0.30 ->', await lines())
        for _ in range(4): await pg.click('#edundo')
        print('  undo x4 ->', await lines())
        await pg.locator('#timing').screenshot(path=OUTP('editor2.png'))
        print('errors', errs); await b.close()
asyncio.run(main())
