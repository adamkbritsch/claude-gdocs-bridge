#!/usr/bin/env python3
"""Put an HTML file on the macOS clipboard as an HTML flavor.

Google Docs (and most rich editors) will honor the markup on paste,
including inline styles and data: URI images.

Usage: python3 html_to_clipboard.py page.html
"""
import subprocess
import sys
import tempfile


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    html = open(sys.argv[1], encoding="utf-8").read()
    hexdata = html.encode("utf-8").hex()
    script = "set the clipboard to {«class HTML»:«data HTML" + hexdata + "»}"
    # osascript via file: immune to shell arg-length limits on big payloads
    with tempfile.NamedTemporaryFile("w", suffix=".applescript", delete=False) as f:
        f.write(script)
        path = f.name
    subprocess.run(["osascript", path], check=True)
    print(f"clipboard set: {len(html)} bytes of HTML")


if __name__ == "__main__":
    main()
