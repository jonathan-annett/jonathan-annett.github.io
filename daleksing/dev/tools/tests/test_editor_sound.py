"""Automatic analysis, word refit, per-part sound, timing editor and phrase moves."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from common import *
import asyncio, json, http.server, threading, functools
from playwright.async_api import async_playwright
BASE = serve(8893)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
        cx = await b.new_context(viewport={'width':390,'height':844}); pg = await cx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(BASE + '/daleksing/dev/'); await pg.wait_for_timeout(600)
        st=lambda: pg.inner_text('#statustext'); sc=lambda: pg.input_value('#score')
        async def mark(a,b_):
            await pg.fill('#from',str(a)); await pg.dispatch_event('#from','change'); await pg.fill('#to',str(b_)); await pg.dispatch_event('#to','change')
        await pg.select_option('#model','')
        await pg.set_input_files('#file',ASSET('test-clip.wav')); await pg.wait_for_timeout(1000); await pg.wait_for_function("clip && !suggesting", timeout=30000); await pg.wait_for_timeout(300); await pg.evaluate("()=>{clip.parts=clip.parts.filter(p=>!p.held);renderParts()}")
        # ---- 1 automatic analysis
        await mark(0.1,1.5); await pg.click('#addpart'); a1=await st()
        await mark(2.5,4.4); await pg.click('#addpart')
        await pg.wait_for_function("clip.parts.length===2 && clip.parts.every(p=>p.done) && !analysing", timeout=60000)
        print('1 auto analysis -> on add:', a1, '| end:', await st()); print('  parts:', (await pg.inner_text('#parts')).replace('\n',' / '))
        print('  timing editor shown', not await pg.evaluate("$('timing').hidden"), '| for part', await pg.evaluate("clip.parts.indexOf(ed.p)+1"))
        # ---- 2 words refit
        await pg.click('#part-1'); await pg.fill('#lyrics','robot voices'); await pg.dispatch_event('#lyrics','change'); r=await st()
        print('2 spread 2 words over part 2 ->', r); print('  part 2 lines:', await pg.evaluate("partLines(clip.parts[1]).join(' | ')"))
        before = await pg.evaluate("partLines(clip.parts[1]).join(' | ')")
        await pg.fill('#lyrics','dalek choir'); await pg.dispatch_event('#lyrics','input'); await pg.wait_for_timeout(1200)
        print('  same count retyped ->', await st(), '|', await pg.evaluate("partLines(clip.parts[1]).join(' | ')"))
        await pg.fill('#lyrics','dalek choir sings'); await pg.dispatch_event('#lyrics','input'); await pg.wait_for_timeout(1200); print('  more words while typing ->', await st())
        await pg.click('#edundo'); await pg.click('#edundo'); print('  undo x2 ->', await pg.evaluate("partLines(clip.parts[1]).join(' | ')"), '| equals first fit', (await pg.evaluate("partLines(clip.parts[1]).join(' | ')")).replace('dalek','robot').replace('choir','voices') == before)
        # ---- 3 per-part sound
        await pg.select_option('#soundfor','1'); print('3 scope part 2: controls disabled', await pg.evaluate("$('soundbox').disabled"), '| button:', await pg.inner_text('#ownsound'))
        await pg.click('#ownsound'); await pg.select_option('#preset','trio'); await pg.click('#ring'); await pg.select_option('#octave','-2')
        print('  own sound set:', await pg.evaluate("JSON.stringify(clip.parts[1].sound)"), '| default untouched:', await pg.evaluate("JSON.stringify(baseSound)"))
        await pg.select_option('#soundfor','-1'); print('  back to default: preset shows', await pg.input_value('#preset'), '| ring', await pg.get_attribute('#ring','aria-pressed'))
        r = await pg.evaluate("""async()=>{const prep=prepare(),sr=44100,oc=new OfflineAudioContext(2,sr*5,sr),made=[];const log=[];
           const orig=createVoice; const res=perform(i=>made[i]||(made[i]=(()=>{const v=createVoice(oc,oc.destination);const s0=v.sing;return Object.assign({},v,{sing:(l,o)=>{log.push({slot:i,n:l.length,rings:[...new Set(l.map(e=>e.ring))],fmin:Math.round(Math.min(...l.map(e=>e.f)))});return s0(l,o)}})})()),prep.all,0,prep,settings());
           const b=await oc.startRendering();let nan=0;for(const x of b.getChannelData(0))if(x!==x)nan++;return {log,nan,events:prep.all.map(e=>clip.parts.indexOf(e.part)+1).join('')}}""")
        print('  slots:', json.dumps(r))
        print('  parts label:', (await pg.inner_text('#part-1')))
        # ---- 4 timing editor
        await pg.click('#part-1'); await pg.wait_for_timeout(200)
        await pg.locator('#ed').scroll_into_view_if_needed(); box=await pg.locator('#ed').bounding_box()
        geo = await pg.evaluate("(()=>{const G=edGeo(),w=ed.words[0],x=w.notes[0];return {x0:G.X(x.at),x1:G.X(x.at+x.dur),y:G.Y(x.midi)+G.rowH/2,pps:G.pps,rowH:G.rowH,wy:ED_RULER+ED_WAVE+ED_WORDS/2}})()")
        print('4 editor geometry', {k:round(v,1) for k,v in geo.items()}, '| words', await pg.evaluate("ed.words.map(w=>w.word+':'+w.notes.map(n=>n.label).join('/')).join(' ')"))
        L0 = await pg.evaluate("partLines(clip.parts[1]).join(' | ')"); u0 = await pg.evaluate('scoreUndo.length')
        X=box['x']; Y=box['y']
        # drag the first syllable right by 0.12 s
        sx = X+(geo['x0']+geo['x1'])/2-6; sy=Y+geo['y']
        await pg.mouse.move(sx,sy); await pg.mouse.down(); await pg.mouse.move(sx+0.06*geo['pps'],sy,steps=3); await pg.mouse.move(sx+0.12*geo['pps'],sy,steps=3); await pg.mouse.up()
        L1 = await pg.evaluate("partLines(clip.parts[1]).join(' | ')"); print('  move syllable:', L0, '=>', L1, '|', await pg.inner_text('#edinfo'))
        # drag it up two rows
        geo = await pg.evaluate("(()=>{const G=edGeo(),x=ed.words[0].notes[0];return {x0:G.X(x.at),x1:G.X(x.at+x.dur),y:G.Y(x.midi)+G.rowH/2}})()")
        sx = X+(geo['x0']+geo['x1'])/2-6; sy=Y+geo['y']
        await pg.mouse.move(sx,sy); await pg.mouse.down(); await pg.mouse.move(sx,sy-geo2 if False else sy-1.0*await pg.evaluate('edGeo().rowH'),steps=3); await pg.mouse.move(sx,sy-2.1*await pg.evaluate('edGeo().rowH'),steps=3); await pg.mouse.up()
        print('  pitch up 2:', await pg.evaluate("partLines(clip.parts[1]).join(' | ')"))
        # resize via right edge
        geo = await pg.evaluate("(()=>{const G=edGeo(),x=ed.words[0].notes[0];return {x1:G.X(x.at+x.dur),y:G.Y(x.midi)+G.rowH/2,pps:G.pps}})()")
        sx = X+geo['x1']-5; sy=Y+geo['y']
        await pg.mouse.move(sx,sy); await pg.mouse.down(); await pg.mouse.move(sx-0.05*geo['pps'],sy,steps=3); await pg.mouse.move(sx-0.1*geo['pps'],sy,steps=3); await pg.mouse.up()
        print('  shorten by 0.1:', await pg.evaluate("partLines(clip.parts[1]).join(' | ')"))
        # move the second word in the word row
        geo = await pg.evaluate("(()=>{const G=edGeo(),w=ed.words[1];return {x0:G.X(w.notes[0].at),x1:G.X(w.notes[w.notes.length-1].at+w.notes[w.notes.length-1].dur),wy:ED_RULER+ED_WAVE+ED_WORDS/2,pps:G.pps}})()")
        sx = X+(geo['x0']+geo['x1'])/2; sy=Y+geo['wy']
        await pg.mouse.move(sx,sy); await pg.mouse.down(); await pg.mouse.move(sx+0.04*geo['pps'],sy,steps=3); await pg.mouse.move(sx+0.08*geo['pps'],sy,steps=3); await pg.mouse.up()
        print('  move word 2:', await pg.evaluate("partLines(clip.parts[1]).join(' | ')"))
        # keyboard nudge
        await pg.focus('#ed'); await pg.keyboard.press('ArrowLeft'); await pg.keyboard.press('Shift+ArrowLeft')
        print('  keys left 0.11:', await pg.evaluate("partLines(clip.parts[1]).join(' | ')"))
        # group: syllable -> SELECT WORD -> ADD NEXT WORD, then drag one of its syllables
        await pg.evaluate("edSelect({w:0,j:0})"); await pg.click('#edword'); a=await pg.inner_text('#edinfo'); await pg.click('#ednext'); b_=await pg.inner_text('#edinfo')
        print('  select word ->', a, '| add next ->', b_, '| next now disabled', await pg.evaluate("$('ednext').disabled"))
        G0 = await pg.evaluate("ed.words.map(w=>w.notes.map(n=>n.at.toFixed(2)).join(',')).join(' / ')")
        geo = await pg.evaluate("(()=>{const G=edGeo(),x=ed.words[1].notes[0];return {x0:G.X(x.at),x1:G.X(x.at+x.dur),y:G.Y(x.midi)+G.rowH/2,pps:G.pps}})()")
        sx = X+(geo['x0']+geo['x1'])/2-6; sy=Y+geo['y']
        await pg.mouse.move(sx,sy); await pg.mouse.down(); await pg.mouse.move(sx-0.05*geo['pps'],sy,steps=3); await pg.mouse.move(sx-0.1*geo['pps'],sy,steps=3); await pg.mouse.up()
        print('  drag syllable in phrase: before', G0, '=> after', await pg.evaluate("ed.words.map(w=>w.notes.map(n=>n.at.toFixed(2)).join(',')).join(' / ')"), '| still phrase', await pg.evaluate("ed.sel.j<0 && selEnd(ed.sel)===1"))
        await pg.keyboard.press('ArrowUp'); print('  phrase up a semitone:', await pg.evaluate("partLines(clip.parts[1]).join(' | ')"))
        await pg.mouse.click(sx-0.1*geo['pps'],sy); print('  tap a syllable in the phrase -> selects', await pg.evaluate("JSON.stringify(ed.sel)"))
        wy = await pg.evaluate("ED_RULER+ED_WAVE+ED_WORDS/2"); w0x = await pg.evaluate("(()=>{const G=edGeo(),w=ed.words[0];return (G.X(w.notes[0].at)+G.X(w.notes[0].at+w.notes[0].dur))/2})()"); w1x = await pg.evaluate("(()=>{const G=edGeo(),w=ed.words[1];return G.X(w.notes[0].at)+4})()")
        await pg.mouse.click(X+w0x,Y+wy); await pg.keyboard.down('Shift'); await pg.mouse.click(X+w1x,Y+wy); await pg.keyboard.up('Shift')
        print('  word, then shift-click next word ->', await pg.evaluate("JSON.stringify(ed.sel)"), '|', await pg.inner_text('#edinfo'))
        await pg.click('#edall'); print('  select all ->', await pg.inner_text('#edinfo'))
        # zoom, pan, cursor
        await pg.locator('#ed').scroll_into_view_if_needed(); box=await pg.locator('#ed').bounding_box(); X=box['x']; Y=box['y']
        await pg.click('#edin'); await pg.click('#edin'); z=await pg.evaluate("[ed.v0,ed.v1].map(x=>x.toFixed(2)).join('-')")
        await pg.mouse.move(X+200,Y+40); await pg.mouse.down(); await pg.mouse.move(X+150,Y+40,steps=4); await pg.mouse.up(); pn=await pg.evaluate("[ed.v0,ed.v1].map(x=>x.toFixed(2)).join('-')")
        await pg.mouse.click(X+100,Y+40); print('  zoom in x2 ->', z, '| pan ->', pn, '| tap sets cursor', round(await pg.evaluate('ed.cursor'),2), '| scroll bar', await pg.input_value('#edpos'))
        await pg.click('#edfit')
        # listen modes
        await pg.click('#edplay'); await pg.wait_for_timeout(300); print('  play voice+robot ->', await st(), '| buffer is vocal', await pg.evaluate("musicSrc.buffer===clip.parts[1]._vb"), '| button', await pg.inner_text('#edplay'))
        await pg.click('#edplay'); await pg.select_option('#edlisten','solo'); await pg.click('#edplay'); await pg.wait_for_timeout(300); print('  play singer only ->', await st()); await pg.click('#edplay')
        # undo everything back
        n=await pg.evaluate('scoreUndo.length')
        for _ in range(n-u0): await pg.click('#edundo')
        print('  undo all editor edits ->', await pg.evaluate("partLines(clip.parts[1]).join(' | ')"), '| matches start', (await pg.evaluate("partLines(clip.parts[1]).join(' | ')"))==L0, '| stack was', n)
        await pg.locator('#timing').screenshot(path=OUTP('editor.png'))
        # ---- 5 saved: own sound and @ timing survive a reload
        await pg.evaluate("()=>{edApply({w:0,j:0},'move',0.1,{at:ed.words[0].notes[0].at,dur:ed.words[0].notes[0].dur,midi:ed.words[0].notes[0].midi});edWrite()}")
        await pg.wait_for_timeout(1200); keep=await sc()
        await pg.reload(); await pg.wait_for_timeout(800); await pg.click('#open-0'); await pg.wait_for_function("clip && clip.parts.length===2", timeout=15000); await pg.wait_for_timeout(300)
        print('5 reopened: score same', (await sc())==keep, '| part 2 sound', await pg.evaluate("JSON.stringify(clip.parts[1].sound)"), '| scope list', (await pg.inner_text('#soundfor')).replace('\n',' / '))
        print('errors', errs); await b.close()
asyncio.run(main())
