"""Where the first word lands for different speech-model timings."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from common import *
import asyncio, http.server, threading, functools, sys
from playwright.async_api import async_playwright
BASE = serve(8885)
CASES = {
 'A word span covers the voice    ': "[{text:'robot',t0:0,t1:0.9},{text:'voices',t0:0.9,t1:1.9}]",
 'B first word wholly too early   ': "[{text:'robot',t0:0,t1:0.3},{text:'voices',t0:0.3,t1:1.9}]",
 'C phrase-level, spread evenly   ': "[{text:'robot',t0:0,t1:0.6},{text:'sings',t0:0.6,t1:1.2},{text:'here',t0:1.2,t1:1.8}]",
}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
        pg = await (await b.new_context()).new_page()
        await pg.goto(BASE + '/daleksing/dev/'); await pg.wait_for_timeout(400); await pg.select_option('#model','')
        await pg.set_input_files('#file',ASSET('test-clip.wav')); await pg.wait_for_timeout(800); await pg.wait_for_function("clip && !suggesting", timeout=30000); await pg.wait_for_timeout(300); await pg.evaluate("()=>{clip.parts=clip.parts.filter(p=>!p.held);renderParts()}")
        # part from 2.2 s: a rest, then the singer comes in at 2.6 s (G4), E4 at 3.1, A3 at 3.6 to 4.4
        await pg.evaluate("()=>{setRegion(2.2,4.4);addPart()}"); await pg.wait_for_function("clip.parts[0].done && !analysing", timeout=60000)
        print('detected notes :', await pg.evaluate("clip.parts[0].notes.map(n=>noteName(n.midi)+'@'+n.start.toFixed(2)).join(' ')"))
        for name, timed in CASES.items():
            print(name, '->', await pg.evaluate("fitTimedWords(%s, clip.parts[0].midi, clip.parts[0].hopSec, clip.parts[0].from).split('\\n').join(' | ')" % timed))
        await b.close()
asyncio.run(main())
