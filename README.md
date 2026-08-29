# claude-gdocs-bridge

Give an AI coding agent (Claude Code, or anything that can drive Chrome and run
shell commands) real, programmatic control over Google Docs — without a service
account, without the Docs API quota dance, and without any third-party
extension.

Two complementary techniques:

## 1. Rich import: clipboard-HTML paste

Google Docs' paste handler is the highest-fidelity importer Google ships.
Styled HTML pasted from the clipboard preserves fonts, colors, cell shading,
table borders, and even `data:` URI images (Docs uploads them natively) —
things the Drive API's HTML import routinely mangles.

macOS lets you put an HTML *flavor* on the clipboard from the shell:

```bash
python3 src/html_to_clipboard.py my-styled-page.html
```

Then drive Chrome to a fresh doc (`docs.new`) and send `Cmd+V`.

Known post-paste fixups:
- Docs defaults to 1" margins (File > Page setup). The margin fields **append**
  on triple-click — select-all first.
- Tables keep-together, so blocks may jump a page until margins are restored.

## 2. Ongoing control: a bound Apps Script bridge

For edits after import, a container-bound Apps Script project gives you the
full `DocumentApp` API — every color, border, style, and structural operation
Docs supports, executed server-side in one shot.

Setup (once per document):
1. In the doc: **Extensions > Apps Script** — creates a bound project.
2. Paste in `src/toolkit.gs`. If synthetic `Cmd+V` doesn't reach the Monaco
   editor (it often doesn't), inject through Monaco's own API from the page
   context:
   ```js
   monaco.editor.getModels()[0].setValue(CODE_STRING);
   ```
3. Save, pick a function, **Run**. The first run pops Google's OAuth consent —
   the human clicks Allow (the script runs as *them*, scoped to Docs).

After that, the agent's loop is: edit the model via Monaco injection → save →
run → screenshot the doc to verify. No API keys, no cloud project setup.

## What's in here

| file | purpose |
|---|---|
| `src/html_to_clipboard.py` | put any HTML file on the macOS clipboard as an HTML flavor |
| `src/toolkit.gs` | generic bound-script helpers: structure dump, color remap, text replace |
| `examples/recolor-monochrome.gs` | real-world example: strip a document's accent palette so photos carry the color |

## Security notes

- Everything runs locally + in the user's own Google account. Nothing is sent
  to any third party.
- The bound script's OAuth grant is scoped to Docs and is visible/revocable at
  <https://myaccount.google.com/permissions>.
- The consent click is deliberately left to the human.

MIT licensed.
