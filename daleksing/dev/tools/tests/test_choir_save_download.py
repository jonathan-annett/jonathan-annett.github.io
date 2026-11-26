"""Choir, key and harmony, levels, saving and restoring, WAV downloads, deleting."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from common import *
import asyncio, json, http.server, threading, functools, wave, struct
from playwright.async_api import async_playwright
BASE = serve(8895)
U=BASE + '/daleksing/dev/'
def wavinfo(path):
    w=wave.open(path); n=w.getnframes(); ch=w.getnchannels(); sr=w.getframerate(); d=w.readframes(n); w.close()
    s=struct.unpack('<%dh'%(len(d)//2), d); peak=max(abs(x) for x in s[::7])
    def rms(a,b):
        seg=s[int(a*sr)*ch:int(b*sr)*ch:3]; return (sum(x*x for x in seg)/max(1,len(seg)))**.5
    return {'sec':round(n/sr,2),'ch':ch,'sr':sr,'peak':peak,'rms_0_1.5':round(rms(0,1.5)),'rms_2.6_4':round(rms(2.6,4))}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
        cx = await b.new_context(viewport={'width':390,'height':844}, accept_downloads=True)
        pg = await cx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(U); await pg.wait_for_timeout(700)
        st=lambda: pg.inner_text('#statustext')
        async def mark(a,b_):
            await pg.fill('#from',str(a)); await pg.dispatch_event('#from','change'); await pg.fill('#to',str(b_)); await pg.dispatch_event('#to','change')
        # --- choir on the demo
        await pg.select_option('#preset','trio'); print('1 trio voices:', await pg.evaluate("baseSound.voices.map(v=>v.iv+'@'+v.lvl).join(' ')"), '| key row shown', not await pg.evaluate("$('keyrow').hidden"))
        await pg.click('#sing'); await pg.wait_for_timeout(700); print('  sing ->', await st(), '| live voices', await pg.evaluate('pool.length')); await pg.click('#stop')
        r = await pg.evaluate("""async()=>{const prep=prepare(),sr=44100,oc=new OfflineAudioContext(2,sr*6,sr),made=[];
           perform(i=>made[i]||(made[i]=createVoice(oc,oc.destination)),prep.all.filter(e=>e.start<5),0.05,prep,settings());
           const b=await oc.startRendering(),L=b.getChannelData(0),R=b.getChannelData(1);let l=0,r=0,nan=0;for(let i=0;i<L.length;i++){l+=L[i]*L[i];r+=R[i]*R[i];if(L[i]!==L[i])nan++}
           return {voices:made.length, rmsL:Math.sqrt(l/L.length).toFixed(3), rmsR:Math.sqrt(r/R.length).toFixed(3), nan, pans:baseSound.voices.map((v,i)=>panOf(baseSound.voices,i).toFixed(2))}}""")
        print('  offline trio render', json.dumps(r))
        async with pg.expect_download() as dl: await pg.click('#dlrobots')
        d=await dl.value; await d.save_as(OUTP('demo.wav')); print('2 demo download ->', d.suggested_filename, '|', await st(), '|', wavinfo(OUTP('demo.wav')))
        await pg.select_option('#preset','solo')
        # --- load a song, parts, preview, level
        await pg.set_input_files('#file',ASSET('test-clip.wav')); await pg.wait_for_timeout(1200); await pg.wait_for_function("clip && !suggesting", timeout=30000); await pg.wait_for_timeout(300); await pg.evaluate("()=>{clip.parts=clip.parts.filter(p=>!p.held);renderParts()}"); print('3 load ->', await st())
        await pg.wait_for_timeout(500); print('  saved list:', (await pg.inner_text('#saved')).replace('\n',' / '))
        await mark(0.1,1.5); await pg.click('#addpart'); await mark(2.5,4.4); await pg.click('#addpart')
        await pg.wait_for_function("clip.parts.every(p=>p.done) && !analysing", timeout=60000); print('4 analyse ->', await st())
        await pg.click('#hear-1'); await pg.wait_for_timeout(400)
        print('5 HEAR part 2 ->', await st(), '| music from', round(await pg.evaluate('playing.offset'),2), '| kind', await pg.evaluate('playing.kind'))
        await pg.wait_for_timeout(3500); print('  after ->', await st())
        await pg.fill('#plv-1','40'); await pg.dispatch_event('#plv-1','input'); await pg.click('#mode-1')
        lv = await pg.evaluate("prepare().all.map(e=>e.level).join(',')"); print('6 levels per event:', lv)
        await pg.select_option('#preset','duet'); await pg.fill('#vrobot','120'); await pg.dispatch_event('#vrobot','input')
        # --- scrub while singing carries on singing
        await pg.click('#sing'); await pg.wait_for_timeout(500)
        await pg.evaluate("()=>{const s=$('scrub');s.value=2.4;s.dispatchEvent(new Event('input'));s.dispatchEvent(new Event('change'))}"); await pg.wait_for_timeout(300)
        print('7 scrub during sing -> kind', await pg.evaluate('playing && playing.kind'), '| from', round(await pg.evaluate('playing.offset'),2), '|', await st()); await pg.click('#stop')
        # --- download the mix with the clip
        async with pg.expect_download() as dl: await pg.click('#dlmix')
        d=await dl.value; await d.save_as(OUTP('mix.wav')); print('8 mix download ->', d.suggested_filename, '|', wavinfo(OUTP('mix.wav')))
        async with pg.expect_download() as dl: await pg.click('#dlrobots')
        d=await dl.value; await d.save_as(OUTP('robots.wav')); print('  robots only ->', d.suggested_filename, '|', wavinfo(OUTP('robots.wav')))
        await pg.wait_for_timeout(1000)
        before = {'score': await pg.input_value('#score'), 'voices': await pg.evaluate("JSON.stringify(baseSound)"), 'vrobot': await pg.input_value('#vrobot')}
        # --- reload: saved list and restore
        await pg.reload(); await pg.wait_for_timeout(900)
        print('9 after reload, saved list:', (await pg.inner_text('#saved')).replace('\n',' / '))
        await pg.click('#open-0'); await pg.wait_for_function("clip && clip.parts.length===2", timeout=15000); await pg.wait_for_timeout(300)
        print('  open ->', await st())
        print('  parts:', (await pg.inner_text('#parts')).replace('\n',' / '))
        print('  score same', (await pg.input_value('#score'))==before['score'], '| voices same', (await pg.evaluate("JSON.stringify(baseSound)"))==before['voices'], '| robot vol', await pg.input_value('#vrobot'), '| part2 level', await pg.input_value('#plv-1'), '| vocals restored', await pg.evaluate("clip.parts.map(p=>!!p.centre).join(',')"), '| mix differs', await pg.evaluate("mixBuffer()!==clip.origBuf"))
        # --- loading the same file again restores
        await pg.click('#demo'); await pg.set_input_files('#file',ASSET('test-clip.wav')); await pg.wait_for_timeout(1500); await pg.wait_for_function("clip && !suggesting", timeout=30000); await pg.wait_for_timeout(300); await pg.evaluate("()=>{clip.parts=clip.parts.filter(p=>!p.held);renderParts()}")
        print('10 same file again ->', await st(), '| parts', await pg.evaluate('clip.parts.length'))
        await pg.screenshot(path=OUTP('v5-top.png'), full_page=False)
        await pg.screenshot(path=OUTP('v5-parts.png'), clip={'x':0,'y':1100,'width':390,'height':700}, full_page=True)
        # --- delete
        await pg.click('#delsong-0'); a=await pg.inner_text('#delsong-0'); await pg.click('#delsong-0'); await pg.wait_for_timeout(500)
        print('11 delete ->', a, '|', await st(), '| list hidden', await pg.evaluate("$('savedbox').hidden"), '| vocals left', await pg.evaluate("dbAll('vocals').then(x=>x.length)"))
        print('errors', errs); await b.close()
asyncio.run(main())
