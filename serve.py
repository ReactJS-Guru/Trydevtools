#!/usr/bin/env python3
"""Tiny dev server that gives TryDevTools clean URLs.

  /                       → index.html
  /category/<slug>        → category.html  (component reads slug from URL path)
  /tool/<slug>            → tool.html      (component reads slug from URL path)
  anything else           → served as a normal static file

Run:  python serve.py
"""
import http.server
import socketserver
import os
import re

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 5173

class CleanUrlHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # strip query / fragment for matching
        clean = path.split("?", 1)[0].split("#", 1)[0]
        # Match both new (/category, /tool) and legacy (/c, /t) prefixes
        if re.match(r"^/(category|c)/[^/]+/?$", clean):
            return os.path.join(ROOT, "category.html")
        if re.match(r"^/(tool|t)/[^/]+/?$", clean):
            return os.path.join(ROOT, "tool.html")
        return super().translate_path(path)

    def log_message(self, fmt, *args):
        # quieter logs
        print(f"{self.address_string()} - {fmt % args}")

if __name__ == "__main__":
    os.chdir(ROOT)
    with socketserver.TCPServer(("127.0.0.1", PORT), CleanUrlHandler) as httpd:
        print(f"TryDevTools dev server: http://127.0.0.1:{PORT}/")
        httpd.serve_forever()
