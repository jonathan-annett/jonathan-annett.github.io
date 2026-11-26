"""Suggested parts from a mix and from stems."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from common import *
import asyncio, http.server, threading, functools, time
from playwright.async_api import async_playwright
BASE = serve(8880)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
        pg = await (await b.new_context(viewport={'width':390,'height':844})).new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(BASE + '/daleksing/dev/'); await pg.wait_for_timeout(500); await pg.select_option('#model','')
        st=lambda: pg.inner_text('#statustext'); parts=lambda: pg.inner_text('#parts')
        for label, files in [('MIX', [ASSET('long/Long Song.wav')]), ('STEMS', [ASSET('long/Long Song (Vocals).wav'),ASSET('long/Long Song (Instrumental).wav')])]:
            t0=time.time(); await pg.set_input_files('#file', files)
            stems = len(files) > 1
            await pg.wait_for_function("clip && (!!clip.stems === %s) && clip.parts.length && !suggesting" % ('true' if stems else 'false'), timeout=60000)
            print(label, '(%.1f s)' % (time.time()-t0), '->', await st())
            print('  parts:', await pg.evaluate("clip.parts.map(p=>p.from.toFixed(1)+'-'+p.to.toFixed(1)+(p.held?' held':'')).join('  ')"), '| analysing', await pg.evaluate('analysing'), '| button:', await pg.inner_text('#findall'))
        # flow on the stems
        await pg.click('#part-0'); print('select suggested part 1 -> editor note:', await pg.inner_text('#timingnote'))
        await pg.click('#hear-1'); await pg.wait_for_timeout(300); print('HEAR suggested part 2 ->', await st(), '| playing from', round(await pg.evaluate('playing.offset'),2), '| button', await pg.inner_text('#hear-1')); await pg.click('#hear-1')
        await pg.click('#parts .part:nth-child(2) .prow:first-child button:last-child'); print('deleted part 2 ->', await st(), '| left', await pg.evaluate("clip.parts.map(p=>p.from.toFixed(1)).join(',')"), '| button:', await pg.inner_text('#findall'))
        await pg.wait_for_timeout(1000); await pg.reload(); await pg.wait_for_function("clip && clip.parts.length===2", timeout=20000); await pg.wait_for_timeout(500)
        print('after refresh: held', await pg.evaluate("clip.parts.map(p=>p.held).join(',')"), '| analysing', await pg.evaluate('analysing'), '| button shown', not await pg.evaluate("$('findall').hidden"))
        await pg.click('#findall'); await pg.wait_for_function("clip.parts.every(p=>p.done) && !analysing", timeout=60000)
        print('FIND TUNES ->', await st()); print('  parts:', (await parts()).replace('\n',' / ')); print('  button hidden', await pg.evaluate("$('findall').hidden"))
        print('  first notes of each part:', await pg.evaluate("clip.parts.map(p=>p.notes.slice(0,2).map(n=>noteName(n.midi)+'@'+n.start.toFixed(2)).join(' ')).join(' | ')"))
        # suggest again does not touch analysed parts; manual add analyses straight away
        await pg.click('#suggest'); await pg.wait_for_function("!suggesting", timeout=30000); print('SUGGEST again ->', await st(), '|', await pg.evaluate("clip.parts.map(p=>p.from.toFixed(1)+(p.held?' held':' done')).join('  ')"))
        await pg.fill('#gap','2'); await pg.dispatch_event('#gap','change'); await pg.click('#suggest'); await pg.wait_for_function("!suggesting", timeout=30000)
        print('gap 2 ->', await pg.evaluate("clip.parts.map(p=>p.from.toFixed(1)+'-'+p.to.toFixed(1)+(p.held?' held':' done')).join('  ')"))
        await pg.locator('#partsbox').screenshot(path=OUTP('suggest.png'))
        print('errors', errs); await b.close()
asyncio.run(main())
