"""Stems: roles, exact singer removal, levels, MP3 downloads, saving."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from common import *
import asyncio, json, http.server, threading, functools
from playwright.async_api import async_playwright
BASE = serve(8887)
LAME=open(LAME,'rb').read()
STEMS=sorted(glob(ASSET('stems/*.wav')))
CHECK="""async (name)=>{const b=await fetch(URL.createObjectURL(window.__last)).then(r=>r.arrayBuffer());const a=await ctx.decodeAudioData(b);
  const d=a.getChannelData(0);let pk=0,e=0;for(const x of d){pk=Math.max(pk,Math.abs(x));e+=x*x}return {name, kb:Math.round(window.__last.size/1024), type:window.__last.type, sec:+a.duration.toFixed(2), peak:+pk.toFixed(2), rms:+Math.sqrt(e/d.length).toFixed(3)}}"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
        cx = await b.new_context(viewport={'width':390,'height':844}, accept_downloads=True); pg = await cx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        lame_hits=[]
        async def lame(route): lame_hits.append(1); await route.fulfill(status=200, content_type='text/javascript', headers={'access-control-allow-origin':'*'}, body=LAME)
        await pg.route('https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js', lame)
        await pg.add_init_script("(()=>{const o=URL.createObjectURL;URL.createObjectURL=function(x){if(x instanceof Blob&&/audio/.test(x.type))window.__last=x;return o.call(URL,x)}})()")
        await pg.goto(BASE + '/daleksing/dev/'); await pg.wait_for_timeout(500)
        st=lambda: pg.inner_text('#statustext')
        await pg.select_option('#model','')
        # ---- 1 load stems
        await pg.set_input_files('#file', STEMS); await pg.wait_for_timeout(1500); await pg.wait_for_function("clip && !suggesting", timeout=30000); await pg.wait_for_timeout(300); await pg.evaluate("()=>{clip.parts=clip.parts.filter(p=>!p.held);renderParts()}")
        print('1 load ->', await st()); print('  info:', await pg.inner_text('#clipinfo'))
        print('  roles:', await pg.evaluate("clip.stems.map(s=>s.name.replace('Robot Test ','')+'='+s.role).join(', ')"), '| vocal track', await pg.evaluate("!!clip.vocal"))
        # ---- 2 analysis reads the vocal stem
        await pg.evaluate("()=>{setRegion(0.1,1.5);addPart();setRegion(2.5,4.4);addPart()}"); await pg.wait_for_function("clip.parts.every(p=>p.done) && !analysing", timeout=60000)
        print('2 analysis ->', await st()); print('  score:', (await pg.input_value('#score')).replace('\n',' | '))
        # ---- 3 replacing the singer leaves the vocal stem out exactly
        await pg.click('#mode-1')
        r = await pg.evaluate("""()=>{const m=mixBuffer(),L=m.getChannelData(0),sr=clip.sr;const music=clip.stems.filter(s=>s.role==='music');
          let inErr=0,inVoc=0,outErr=0;const O=clip.origBuf.getChannelData(0),V=clip.stems.find(s=>s.role==='vocal').buf.getChannelData(0);
          for(let i=Math.floor(2.6*sr);i<4.3*sr;i++){let mu=0;for(const s of music)mu+=s.buf.getChannelData(0)[i];inErr=Math.max(inErr,Math.abs(L[i]-mu));inVoc=Math.max(inVoc,Math.abs(V[i]))}
          for(let i=0;i<2.4*sr;i++)outErr=Math.max(outErr,Math.abs(L[i]-O[i]));return {insidePartMaxDiffFromMusicStems:+inErr.toFixed(5),vocalPeakThere:+inVoc.toFixed(2),outsidePartMaxDiff:outErr}}""")
        print('3 singer removed in part 2:', json.dumps(r))
        # ---- 4 levels and roles
        await pg.fill('#stemlvl-0','50'); await pg.dispatch_event('#stemlvl-0','change'); print('4 drums at 50 ->', await pg.evaluate("clip.stems[0].lvl"), '| mix rebuilt', await pg.evaluate("clip.mix===null || clip.mixKey===''"))
        await pg.select_option('#stemrole-0','vocal'); r1=await st()
        await pg.wait_for_function("clip.parts.every(p=>p.done) && !analysing", timeout=60000)
        print('  drums marked vocal ->', r1, '| then ->', (await st())[:90])
        await pg.select_option('#stemrole-0','music'); await pg.wait_for_function("clip.parts.every(p=>p.done) && !analysing", timeout=60000)
        print('  back to music, score:', (await pg.input_value('#score')).replace('\n',' | '))
        # ---- 5 MP3 downloads
        await pg.check('#mp3')
        async with pg.expect_download() as dl: await pg.click('#dlmix')
        d=await dl.value; print('5 mp3 mix ->', d.suggested_filename, '|', await st(), '|', json.dumps(await pg.evaluate(CHECK, 'mix')), '| encoder fetched', len(lame_hits))
        async with pg.expect_download() as dl: await pg.click('#dlrobots')
        d=await dl.value; print('  mp3 robots ->', d.suggested_filename, '|', json.dumps(await pg.evaluate(CHECK, 'robots')), '| encoder fetched', len(lame_hits))
        await pg.uncheck('#mp3')
        async with pg.expect_download() as dl: await pg.click('#dlmix')
        d=await dl.value; print('  wav mix still works ->', d.suggested_filename, '|', json.dumps(await pg.evaluate(CHECK, 'wav')))
        await pg.check('#mp3'); await pg.wait_for_timeout(1200)
        # ---- 6 saved and reopened
        await pg.reload(); await pg.wait_for_timeout(800)
        print('6 saved list:', (await pg.inner_text('#saved')).replace('\n',' / '))
        await pg.click('#open-0'); await pg.wait_for_function("clip && clip.stems && clip.parts.length===2", timeout=20000); await pg.wait_for_timeout(300)
        print('  opened ->', await st(), '| roles', await pg.evaluate("clip.stems.map(s=>s.role+'@'+s.lvl).join(', ')"), '| part 2 replaces', await pg.evaluate('clip.parts[1].remove'), '| vocal centres', await pg.evaluate("clip.parts.map(p=>!!p.centre).join(',')"), '| mp3 box', await pg.is_checked('#mp3'))
        await pg.click('#demo'); await pg.set_input_files('#file', STEMS); await pg.wait_for_timeout(1800); await pg.wait_for_function("clip && !suggesting", timeout=30000); await pg.wait_for_timeout(300); await pg.evaluate("()=>{clip.parts=clip.parts.filter(p=>!p.held);renderParts()}")
        print('7 same stems again ->', await st(), '| parts', await pg.evaluate('clip.parts.length'))
        await pg.set_input_files('#file',ASSET('test-clip.wav')); await pg.wait_for_timeout(1200); await pg.wait_for_function("clip && !suggesting", timeout=30000); await pg.wait_for_timeout(300); await pg.evaluate("()=>{clip.parts=clip.parts.filter(p=>!p.held);renderParts()}")
        print('8 single file after stems -> stems box hidden', await pg.evaluate("$('stemsbox').hidden"), '| clip.stems', await pg.evaluate('clip.stems'), '|', await pg.inner_text('#clipinfo'))
        await pg.set_input_files('#file', STEMS); await pg.wait_for_timeout(1500); await pg.wait_for_function("clip && !suggesting", timeout=30000); await pg.wait_for_timeout(300); await pg.evaluate("()=>{clip.parts=clip.parts.filter(p=>!p.held);renderParts()}")
        await pg.locator('#stemsbox').screenshot(path=OUTP('stems.png'))
        await pg.locator('#dlmix').scroll_into_view_if_needed(); await pg.locator('#dlmix').locator('xpath=../..').screenshot(path=OUTP('dl.png'))
        print('errors', errs); await b.close()
asyncio.run(main())
