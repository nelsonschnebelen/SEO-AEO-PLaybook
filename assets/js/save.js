/* ==========================================================================
   Handing the visitor a file.

   Normally a blob plus an anchor. Some hosted viewers (claude.ai artifacts
   among them) block anchor-driven downloads outright, but offer their own
   save dialog — use that when it is there, fall back when it is not.
   ========================================================================== */

async function saveTextFile(filename, text, mime) {
  if (window.claude && typeof window.claude.use === 'function') {
    try {
      const downloads = await window.claude.use('downloads');
      if (downloads) {
        await downloads.save({ filename: filename, data: text });
        return true;
      }
    } catch (e) {
      // Viewer declined, or saving is unavailable here. Nothing else to do:
      // the fallback below cannot work in a viewer that blocks anchors.
      return false;
    }
  }

  const blob = new Blob([text], { type: (mime || 'text/markdown') + ';charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  return true;
}

window.saveTextFile = saveTextFile;
