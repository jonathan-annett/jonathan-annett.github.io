"""Progress bars (uses the stand-in speech library)."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from common import *
import asyncio, json, http.server, threading, functools
from playwright.async_api import async_playwright
BASE = serve(8876)
FAKE=open(FAKE_TF).read(); LAME=open(LAME,'rb').read()
SAMPLE="""()=>{const p=clip&&clip.parts.find(q=>q._prog!=null);return {part:p?clip.parts.indexOf(p)+1:0, stage:p?p._stage:'', pct:p?Math.round(p._prog*100):null, est:p?p._est:null,
  label:p?$('part-'+clip.parts.indexOf(p)).textContent.split('  ').pop():'', bar:$('busy').hidden?'hidden':($('busy').classList.contains('ind')?'striped':$('busy').style.width)}}"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
        cx = await b.new_context(viewport={'width':390,'height':844}, accept_downloads=True); pg = await cx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        async def tf(route): await route.fulfill(status=200, content_type='text/javascript', headers={'access-control-allow-origin':'*'}, body=FAKE)
        async def lame(route): await route.fulfill(status=200, content_type='text/javascript', headers={'access-control-allow-origin':'*'}, body=LAME)
        await pg.route('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1', tf)
        await pg.route('https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js', lame)
        await pg.goto(BASE + '/daleksing/dev/'); await pg.wait_for_timeout(600); await pg.select_option('#model','Xenova/whisper-tiny.en')
        await pg.set_input_files('#file',ASSET('long/Long Song.wav'))
        seen=set(); bars=[]
        for _ in range(60):
            await pg.wait_for_timeout(50); bars.append(await pg.evaluate("$('busy').hidden?'-':($('busy').classList.contains('ind')?'striped':$('busy').style.width)"))
            if await pg.evaluate("clip && clip.parts.length===3 && !suggesting"): break
        print('1 loading + looking for singing, status bar:', ' '.join(x for i,x in enumerate(bars) if i==0 or x!=bars[i-1])[:200])
        print('  after:', await pg.evaluate("$('busy').hidden"), '|', await pg.inner_text('#statustext'))
        await pg.click('#parts .part:nth-child(3) .prow:first-child button:last-child')    # keep two parts
        await pg.click('#findall'); shot=False; log=[]
        while True:
            s=await pg.evaluate(SAMPLE)
            if s['part']: 
                k=(s['part'], s['stage'])
                if k not in seen or len(log)%6==0: log.append(s); seen.add(k)
                if s['stage']=='WORDS' and not shot:
                    await pg.locator('#wave').scroll_into_view_if_needed(); await pg.locator('#wave').screenshot(path=OUTP('prog-ov.png')); await pg.locator('#parts').screenshot(path=OUTP('prog-parts.png')); shot=True
            if await pg.evaluate("clip.parts.every(p=>p.done) && !analysing"): break
            await pg.wait_for_timeout(60)
        print('2 analysing two parts (samples):')
        for x in log: print('   part', x['part'], x['stage'].ljust(6), str(x['pct']).rjust(3)+'%', 'estimate' if x['est'] else '        ', '| label', x['label'].ljust(12), '| status bar', x['bar'])
        print('  after:', await pg.evaluate("$('busy').hidden"), '| overlays left', await pg.evaluate("clip.parts.filter(p=>p._prog!=null).length"), '|', (await pg.inner_text('#statustext'))[:90])
        print('  score:', (await pg.input_value('#score')).replace('\n',' | '))
        # downloads
        await pg.check('#mp3'); dl=[]
        async with pg.expect_download() as d:
            await pg.click('#dlmix')
            for _ in range(200):
                v=await pg.evaluate("$('dlbar').hidden?'-':($('dlbar').classList.contains('ind')?'striped':$('dlbar').firstElementChild.style.width)")
                if not dl or dl[-1]!=v: dl.append(v)
                await pg.wait_for_timeout(15)
                if not await pg.evaluate('rendering'): break
        await d.value
        print('3 MP3 download bar:', ' '.join(dl)[:220]); await pg.wait_for_timeout(800); print('  after:', await pg.evaluate("$('dlbar').hidden"), await pg.evaluate("$('busy').hidden"))
        print('errors', errs); await b.close()
asyncio.run(main())
