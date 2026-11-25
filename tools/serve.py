#!/usr/bin/env python3
"""Serve KitaKo locally at http://localhost:5500 without browser caching,
so edits show up on a normal reload.

Usage:  python tools/serve.py [port]
"""
import http.server, os, sys

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
port = int(sys.argv[1]) if len(sys.argv) > 1 else 5500
print(f'Serving HTTP on http://localhost:{port} (press Ctrl+C to stop)', flush=True)
http.server.ThreadingHTTPServer(('', port), NoCache).serve_forever()
