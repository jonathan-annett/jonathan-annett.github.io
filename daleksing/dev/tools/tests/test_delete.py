"""Deleting parts and songs stops playback and resets the page."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from common import *
import asyncio, http.server, threading, functools
from playwright.async_api import async_playwright
BASE = serve(8877)
UI = """()=>({ parts: $('parts').children.length, partsbox: $('partsbox').hidden, findall: $('findall').hidden, timing: $('timing').hidden,
  stems: $('stemsbox').hidden, overview: $('wave').hidden, zoomrow: $('ovrow').hidden, scroll: $('ovpos').hidden, marks: $('marks').hidden,
  soundFor: $('soundfor').options.length, info: $('clipinfo').textContent, lyrics: $('lyrics').value.slice(0,12), playing: !!playing, suggesting, clip: !!clip })"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
        pg = await (await b.new_context(viewport={'width':390,'height':844})).new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(BASE + '/daleksing/dev/'); await pg.wait_for_timeout(600); await pg.select_option('#model','')
        st=lambda: pg.inner_text('#statustext')
        # deleting parts while they play
        await pg.set_input_files('#file',ASSET('long/Long Song.wav')); await pg.wait_for_function("clip && clip.parts.length===3 && !suggesting", timeout=60000)
        await pg.click('#hear-1'); await pg.wait_for_timeout(300); a=await pg.evaluate('!!playing')
        await pg.click('#parts .part:nth-child(2) .prow:first-child button:last-child'); await pg.wait_for_timeout(200)
        print('1 delete a part during its HEAR: was', a, '-> playing', await pg.evaluate('!!playing'), '|', await st())
        await pg.click('#hear-0'); await pg.wait_for_timeout(300)
        await pg.click('#parts .part:nth-child(2) .prow:first-child button:last-child'); await pg.wait_for_timeout(200)
        print('2 delete a different part during HEAR of part 1 -> still playing', await pg.evaluate('!!playing')); await pg.click('#hear-0')
        await pg.click('#findall'); await pg.wait_for_function("clip.parts.every(p=>p.done) && !analysing", timeout=60000)
        await pg.click('#part-0'); await pg.click('#edplay'); await pg.wait_for_timeout(300); a=await pg.evaluate('!!playing')
        await pg.click('#parts .part:nth-child(1) .prow:first-child button:last-child'); await pg.wait_for_timeout(200)
        print('3 delete the part playing in the timing editor: was', a, '-> playing', await pg.evaluate('!!playing'), '| editor hidden', await pg.evaluate("$('timing').hidden"))
        await pg.evaluate("()=>{setRegion(30.7,34.3);addPart()}"); await pg.wait_for_function("clip.parts.every(p=>p.done) && !analysing", timeout=60000)
        await pg.click('#sing'); await pg.wait_for_timeout(300); a=await pg.evaluate('!!playing')
        await pg.click('#parts .part:nth-child(1) .prow:first-child button:last-child'); await pg.wait_for_timeout(200)
        print('4 delete a part while the whole song sings: was', a, '-> playing', await pg.evaluate('!!playing'))
        await pg.click('#play'); await pg.wait_for_timeout(300); a=await pg.evaluate('playing && playing.kind')
        # deleting a song resets everything, including while suggestions are being found
        await pg.set_input_files('#file', sorted(glob(ASSET('long/Long Song (*).wav')))); await pg.wait_for_function("clip && clip.stems && clip.parts.length && !suggesting", timeout=60000)
        await pg.click('#ovin'); await pg.click('#part-1'); await pg.click('#hear-1'); await pg.wait_for_timeout(300)
        print('5 before delete:', await pg.evaluate(UI))
        await pg.click('#delsong-0'); await pg.click('#delsong-0'); await pg.wait_for_timeout(600)
        print('  after delete :', await pg.evaluate(UI)); print('  ', await st())
        await pg.set_input_files('#file',ASSET('long/Long Song.wav')); await pg.wait_for_timeout(300)
        await pg.click('#delsong-0'); await pg.click('#delsong-0'); await pg.wait_for_timeout(3000)
        print('6 deleted while suggestions were being found:', await pg.evaluate(UI), '| saved songs left', await pg.evaluate("dbAll('meta').then(x=>x.length)"))
        await pg.set_input_files('#file',ASSET('long/Long Song.wav'))
        await pg.click('#demo'); await pg.wait_for_timeout(100)
        try: await pg.click('#delsong-0', timeout=3000); await pg.click('#delsong-0', timeout=3000)
        except Exception: pass
        await pg.wait_for_timeout(3000)
        print('7 delete right after choosing the file: saved songs left', await pg.evaluate("dbAll('meta').then(x=>x.map(m=>m.name).join(',')||'none')"), '| clip', await pg.evaluate('clip && clip.name'))
        print('errors', errs); await b.close()
asyncio.run(main())
