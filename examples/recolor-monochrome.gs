/**
 * Real-world example: a letter used a teal accent palette; the owner wanted
 * the photos to be the only source of color. This strips the palette to
 * near-monochrome in one run.
 *
 * ACCENT/ACCENT_TINT: the palette being removed.
 */
const ACCENT = '#0b6e5f';
const ACCENT_TINT = '#f1f7f5';

function recolorMonochrome() {
  const body = DocumentApp.getActiveDocument().getBody();

  body.getTables().forEach(function (table) {
    let isCallout = false;
    for (let r = 0; r < table.getNumRows(); r++) {
      const row = table.getRow(r);
      for (let c = 0; c < row.getNumCells(); c++) {
        const cell = row.getCell(c);
        const bg = (cell.getBackgroundColor() || '').toLowerCase();
        if (bg === ACCENT) {
          // solid accent fills: headline band -> pale grey, thin rule -> near-black
          cell.setBackgroundColor(cell.getText().trim().length > 5 ? '#f2f2f2' : '#1a1a1a');
        } else if (bg === ACCENT_TINT) {
          cell.setBackgroundColor('#ffffff');
          isCallout = true;
        }
        recolorText_(cell.editAsText(), bg === ACCENT_TINT ? '#595959' : '#1a1a1a');
      }
    }
    if (isCallout) table.setBorderColor('#c8c8c8');
  });

  for (let i = 0; i < body.getNumChildren(); i++) {
    const child = body.getChild(i);
    if (child.getType() === DocumentApp.ElementType.PARAGRAPH) {
      recolorText_(child.asParagraph().editAsText(), '#1a1a1a');
    }
  }
}

function recolorText_(text, target) {
  const s = text.getText();
  if (!s) return;
  const idx = text.getTextAttributeIndices();
  for (let i = 0; i < idx.length; i++) {
    const start = idx[i];
    const end = (i + 1 < idx.length ? idx[i + 1] : s.length) - 1;
    if (end < start) continue;
    const col = (text.getForegroundColor(start) || '').toLowerCase();
    if (col === ACCENT || col === '#ffffff') {
      text.setForegroundColor(start, end, target);
    }
  }
}
