/**
 * Generic helpers for a container-bound Apps Script project.
 * Bind to a doc via Extensions > Apps Script, then run from the editor
 * (or let your agent drive it).
 */

/**
 * Log the document's structure: element types, table shapes, cell
 * backgrounds, and the distinct text colors in use. Read the output in
 * the editor's Execution log — the cheapest way for an agent to "see"
 * a doc before editing it.
 */
function dumpStructure() {
  const body = DocumentApp.getActiveDocument().getBody();
  const colors = {};
  for (let i = 0; i < body.getNumChildren(); i++) {
    const child = body.getChild(i);
    const type = String(child.getType());
    if (child.getType() === DocumentApp.ElementType.TABLE) {
      const t = child.asTable();
      const bgs = [];
      for (let r = 0; r < t.getNumRows(); r++) {
        for (let c = 0; c < t.getRow(r).getNumCells(); c++) {
          bgs.push(t.getRow(r).getCell(c).getBackgroundColor());
        }
      }
      Logger.log('[%s] TABLE %sx%s cellBg=%s', i, t.getNumRows(),
                 t.getRow(0).getNumCells(), JSON.stringify(bgs));
    } else {
      const text = child.asText ? child.getText() : '';
      Logger.log('[%s] %s "%s"', i, type, text.slice(0, 60));
    }
    collectColors_(child, colors);
  }
  Logger.log('text colors in use: %s', JSON.stringify(Object.keys(colors)));
}

/**
 * Remap text colors document-wide, e.g.
 *   remapTextColors({'#0b6e5f': '#1a1a1a', '#ffffff': '#1a1a1a'})
 */
function remapTextColors(map) {
  walkText_(DocumentApp.getActiveDocument().getBody(), function (text) {
    const s = text.getText();
    if (!s) return;
    const idx = text.getTextAttributeIndices();
    for (let i = 0; i < idx.length; i++) {
      const start = idx[i];
      const end = (i + 1 < idx.length ? idx[i + 1] : s.length) - 1;
      if (end < start) continue;
      const col = (text.getForegroundColor(start) || '').toLowerCase();
      if (map[col]) text.setForegroundColor(start, end, map[col]);
    }
  });
}

/**
 * Remap table-cell backgrounds document-wide, e.g.
 *   remapCellBackgrounds({'#f1f7f5': '#ffffff'})
 */
function remapCellBackgrounds(map) {
  DocumentApp.getActiveDocument().getBody().getTables().forEach(function (t) {
    for (let r = 0; r < t.getNumRows(); r++) {
      const row = t.getRow(r);
      for (let c = 0; c < row.getNumCells(); c++) {
        const cell = row.getCell(c);
        const bg = (cell.getBackgroundColor() || '').toLowerCase();
        if (map[bg]) cell.setBackgroundColor(map[bg]);
      }
    }
  });
}

/** Regex find/replace across the whole document. */
function replaceAll(pattern, replacement) {
  DocumentApp.getActiveDocument().getBody().replaceText(pattern, replacement);
}

// ---------- internals ----------

function walkText_(el, fn) {
  if (el.editAsText && el.getType() !== DocumentApp.ElementType.TEXT) {
    // containers with text: paragraphs, list items, cells...
  }
  const type = el.getType();
  if (type === DocumentApp.ElementType.PARAGRAPH ||
      type === DocumentApp.ElementType.LIST_ITEM) {
    fn(el.editAsText());
    return;
  }
  if (el.getNumChildren) {
    for (let i = 0; i < el.getNumChildren(); i++) walkText_(el.getChild(i), fn);
  }
}

function collectColors_(el, out) {
  walkText_(el, function (text) {
    const s = text.getText();
    if (!s) return;
    const idx = text.getTextAttributeIndices();
    for (let i = 0; i < idx.length; i++) {
      out[(text.getForegroundColor(idx[i]) || 'default')] = true;
    }
  });
}
