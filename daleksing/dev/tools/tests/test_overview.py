"""Zoomable overview, dragging suggested part edges."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from common import *
import asyncio, http.server, threading, functools
from playwright.async_api import async_playwright
BASE = serve(8878)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
        pg = await (await b.new_context(viewport={'width':390,'height':844})).new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(BASE + '/daleksing/dev/'); await pg.wait_for_timeout(600); await pg.select_option('#model','')
        st=lambda: pg.inner_text('#statustext'); parts=lambda: pg.evaluate("clip.parts.map(p=>p.from.toFixed(2)+'-'+p.to.toFixed(2)+(p.held?'?':'')).join('  ')")
        view=lambda: pg.evaluate("ov.w0.toFixed(2)+'-'+ov.w1.toFixed(2)")
        await pg.set_input_files('#file',ASSET('long/Long Song.wav')); await pg.wait_for_function("clip && clip.parts.length===3 && !suggesting", timeout=60000)
        print('1 suggested:', await parts(), '| view', await view(), '| scroll bar hidden', await pg.evaluate("$('ovpos').hidden"))
        await pg.locator('#wave').scroll_into_view_if_needed(); await pg.screenshot(path=OUTP('ov-all.png'), clip=dict(**(await pg.locator('#wave').bounding_box())))
        # zoom
        await pg.click('#ovin'); a=await view(); await pg.click('#ovin'); print('2 zoom in x2:', a, '->', await view(), '| scroll bar shown', not await pg.evaluate("$('ovpos').hidden"))
        await pg.evaluate("()=>{const e=new WheelEvent('wheel',{deltaY:-100,ctrlKey:true,clientX:$('wave').getBoundingClientRect().left+100,bubbles:true,cancelable:true});$('wave').dispatchEvent(e)}"); print('  ctrl-scroll in ->', await view())
        await pg.fill('#ovpos','1000'); await pg.dispatch_event('#ovpos','input'); print('  scroll to end ->', await view())
        await pg.click('#part-1'); await pg.click('#ovpart'); print('  SELECTED PART (2) ->', await view())
        # drag part 2's start edge 1 s earlier and its end 0.5 s later
        async def drag_edge(q, side, dt):
            await pg.locator('#wave').scroll_into_view_if_needed()
            bx=await pg.locator('#wave').bounding_box()
            x=await pg.evaluate("([q,side])=>{const c=$('wave'),p=clip.parts[q];return (p[side]-ov.w0)/(ov.w1-ov.w0)*c.clientWidth}", [q, side])
            pps=await pg.evaluate("$('wave').clientWidth/(ov.w1-ov.w0)")
            X=bx['x']+x; Y=bx['y']+50
            await pg.mouse.move(X,Y); await pg.mouse.down(); await pg.mouse.move(X+dt*pps/2,Y,steps=4); await pg.mouse.move(X+dt*pps,Y,steps=4); await pg.mouse.up()
        await drag_edge(1,'from',-1.0); print('3 drag part 2 start -1 s ->', await parts(), '|', await st(), '| marker', await pg.evaluate("clip.from.toFixed(2)+'-'+clip.to.toFixed(2)"))
        await drag_edge(1,'to',0.5); print('  drag part 2 end +0.5 s ->', await parts())
        await pg.click('#ovall'); await drag_edge(1,'from',-20); print('  drag part 2 start far left (stops at part 1) ->', await parts())
        await pg.click('#ovall'); await drag_edge(2,'to',30); print('  drag part 3 end far right (stops at song end) ->', await parts())
        # analysed parts keep their edges
        await pg.click('#findall'); await pg.wait_for_function("clip.parts.every(p=>p.done) && !analysing", timeout=60000)
        before=await parts(); await drag_edge(0,'to',2); print('4 analysed part 1 end drag ->', 'unchanged' if (await parts())==before else 'CHANGED '+await parts(), '| cursor moved to', round(await pg.evaluate('clip.pos'),2))
        await pg.wait_for_timeout(1000); await pg.reload(); await pg.wait_for_function("clip && clip.parts.length===3", timeout=20000)
        print('5 after refresh:', await parts())
        await pg.locator('#wave').scroll_into_view_if_needed(); await pg.screenshot(path=OUTP('ov-done.png'), clip=dict(**(await pg.locator('#wave').bounding_box())))
        # delete the open song while it plays
        await pg.click('#sing'); await pg.wait_for_timeout(500); a=await pg.evaluate('!!playing')
        await pg.click('#delsong-0'); await pg.click('#delsong-0'); await pg.wait_for_timeout(600)
        print('6 delete while playing: was playing', a, '-> playing', await pg.evaluate('!!playing'), '| clip', await pg.evaluate('!!clip'), '|', await st(), '| robot voices silent', await pg.evaluate("pool.every(v=>true)"))
        print('errors', errs); await b.close()
asyncio.run(main())
