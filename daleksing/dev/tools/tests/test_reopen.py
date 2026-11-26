"""Reopening the last song on refresh."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from common import *
import asyncio, http.server, threading, functools
from playwright.async_api import async_playwright
BASE = serve(8882)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
        pg = await (await b.new_context(viewport={'width':390,'height':844})).new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        U=BASE + '/daleksing/dev/'; st=lambda: pg.inner_text('#statustext')
        await pg.goto(U); await pg.wait_for_timeout(600); print('0 first visit ->', await st(), '| clip', await pg.evaluate('!!clip'))
        await pg.select_option('#model',''); await pg.set_input_files('#file',ASSET('test-clip.wav')); await pg.wait_for_timeout(800); await pg.wait_for_function("clip && !suggesting", timeout=30000); await pg.wait_for_timeout(300); await pg.evaluate("()=>{clip.parts=clip.parts.filter(p=>!p.held);renderParts()}")
        await pg.evaluate("()=>{setRegion(0.1,1.5);addPart();setRegion(2.5,4.4);addPart()}"); await pg.wait_for_function("clip.parts.every(p=>p.done) && !analysing", timeout=60000)
        await pg.click('#part-1'); await pg.wait_for_timeout(1200); score=await pg.input_value('#score')
        await pg.reload(); await pg.wait_for_function("clip && clip.parts.length===2", timeout=15000); await pg.wait_for_timeout(400)
        print('1 refresh ->', await st(), '| score same', (await pg.input_value('#score'))==score, '| selected part', await pg.evaluate('clip.sel+1'), '| editor open', not await pg.evaluate("$('timing').hidden"))
        await pg.click('#sing'); await pg.wait_for_timeout(500); print('  SING after refresh ->', await st(), '| audio', await pg.evaluate('ctx.state')); await pg.click('#stop')
        # stems
        await pg.set_input_files('#file', sorted(glob(ASSET('stems/*.wav')))); await pg.wait_for_timeout(1500); await pg.wait_for_function("clip && !suggesting", timeout=30000); await pg.wait_for_timeout(300); await pg.evaluate("()=>{clip.parts=clip.parts.filter(p=>!p.held);renderParts()}")
        await pg.reload(); await pg.wait_for_function("clip && clip.stems", timeout=15000); await pg.wait_for_timeout(300); print('2 refresh after stems ->', await st())
        # demo, then refresh: stays on the demo
        await pg.click('#demo'); await pg.reload(); await pg.wait_for_timeout(1500); print('3 demo then refresh ->', await st(), '| clip', await pg.evaluate('!!clip'))
        # delete the remembered song: refresh starts on the demo
        await pg.click('#open-1'); await pg.wait_for_function("clip && clip.parts.length===2", timeout=15000); name=await pg.evaluate('clip.name')
        await pg.click('#delsong-0') if await pg.evaluate("document.querySelector('#saved .cur') && document.querySelector('#saved .saved').classList.contains('cur')") else await pg.click('#delsong-1')
        await pg.wait_for_timeout(100)
        btn = '#delsong-0' if (await pg.inner_text('#delsong-0'))=='SURE?' else '#delsong-1'
        await pg.click(btn); await pg.wait_for_timeout(500); print('4 deleted', name, '->', await st())
        await pg.reload(); await pg.wait_for_timeout(1500); print('  refresh ->', await st(), '| clip', await pg.evaluate('!!clip'))
        print('errors', errs); await b.close()
asyncio.run(main())
