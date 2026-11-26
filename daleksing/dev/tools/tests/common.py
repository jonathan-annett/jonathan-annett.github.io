"""Shared settings for the browser tests. Run tests from anywhere: python3 tests/e2e5.py"""
import os, glob as _glob, http.server, threading, functools
HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.dirname(HERE)
ROOT = os.path.abspath(os.path.join(TOOLS, '..', '..', '..'))      # the repository root, served as the site
PAGE = os.path.join(ROOT, 'daleksing', 'dev', 'index.html')
ASSETS = os.path.join(TOOLS, 'assets')
OUT = os.path.join(TOOLS, 'out'); os.makedirs(OUT, exist_ok=True)   # screenshots
FAKE_TF = os.path.join(TOOLS, 'fake-tf.js')
LAME = os.environ.get('LAME_JS') or os.path.join(TOOLS, 'node_modules', 'lamejs', 'lame.min.js')
_chrome = os.environ.get('CHROME') or '/usr/bin/google-chrome'
CHROME = _chrome if os.path.exists(_chrome) else None    # None: Playwright's own Chromium
def ASSET(p): return os.path.join(ASSETS, p)
def OUTP(p): return os.path.join(OUT, p)
def glob(p): return _glob.glob(p)
def serve(port):
    """Serves the repository on 127.0.0.1:port and returns the base URL."""
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', port), h); srv.RequestHandlerClass.log_message = lambda *a: None
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return 'http://127.0.0.1:%d' % port
