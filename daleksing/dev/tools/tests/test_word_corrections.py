"""Correcting misheard words keeps the timing of the rest."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from common import *
import asyncio, json, http.server, threading, functools
from playwright.async_api import async_playwright
BASE = serve(8886)
SCORE = "2.57 i G4:0.30\n2.90 needed G4:0.22 E4:0.28\n3.45 more E4:0.40\n3.90 love A3:0.45"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
        pg = await (await b.new_context(viewport={'width':390,'height':844})).new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(BASE + '/daleksing/dev/'); await pg.wait_for_timeout(400); await pg.select_option('#model','')
        await pg.set_input_files('#file',ASSET('test-clip.wav')); await pg.wait_for_timeout(800); await pg.wait_for_function("clip && !suggesting", timeout=30000); await pg.wait_for_timeout(300); await pg.evaluate("()=>{clip.parts=clip.parts.filter(p=>!p.held);renderParts()}")
        await pg.evaluate("()=>{setRegion(2.5,4.4);addPart()}"); await pg.wait_for_function("clip.parts[0].done && !analysing", timeout=60000)
        lines = lambda: pg.evaluate("partLines(clip.parts[0]).join(' | ')")
        async def start():
            await pg.evaluate("s=>{setScoreRange(clip.parts[0].from, clip.parts[0].to, s); clip.parts[0].text='i needed more love'; $('lyrics').value='i needed more love'}", SCORE)
        async def typed(t):
            await pg.fill('#lyrics', t); await pg.dispatch_event('#lyrics','change'); await pg.wait_for_timeout(100)
        await start(); print('Whisper heard :', await lines())
        await typed('i knee deep more love'); print('1 corrected   :', await lines()); print('  ', await pg.inner_text('#statustext'))
        await start(); await typed('i knee deep in more love'); print('2 word added  :', await lines())
        await start(); await typed('i needed love'); print('3 word removed:', await lines())
        await start(); await typed('i needed more love'); print('4 unchanged   :', await lines(), '| undo stack', await pg.evaluate('scoreUndo.length'))
        await typed('i knee deep more love'); await pg.click('#respread'); print('5 spread evenly button:', await lines())
        await pg.click('#edundo'); print('  undo ->', await lines())
        # editor retype
        await start(); await pg.evaluate("edSync(true); edSelect({w:1,j:0})"); print('6 editor: syllable of "needed" selected, box shows:', repr(await pg.input_value('#edtext')))
        await pg.fill('#edtext','knee deep'); await pg.press('#edtext','Enter'); print('  after CHANGE WORDS:', await lines()); print('  ', await pg.inner_text('#statustext'), '| selection', await pg.evaluate('JSON.stringify(ed.sel)'), '| words box', repr(await pg.input_value('#lyrics')), '| label', await pg.inner_text('#part-0'))
        await pg.click('#edundo'); print('  undo ->', await lines())
        # the demo, with no song loaded
        await pg.click('#demo'); await pg.fill('#lyrics', (await pg.input_value('#lyrics')).replace('Daisy Daisy','Robot Robot')); await pg.dispatch_event('#lyrics','change')
        print('7 demo retimed:', (await pg.input_value('#score')).split('\n')[:3], '|', await pg.inner_text('#statustext'))
        print('errors', errs); await b.close()
asyncio.run(main())
