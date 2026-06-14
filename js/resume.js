// ─── Resume Parser (PDF.js) ───────────────────────────────────────────────────
// PDF.js worker is loaded from CDN. Set the worker src to match the CDN version.
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

const Resume = {
  async parse(file) {
    if (!file) return null;
    if (file.type !== 'application/pdf') {
      console.warn('[Resume] Only PDF files are supported. Got:', file.type);
      return null;
    }
    if (typeof pdfjsLib === 'undefined') {
      console.warn('[Resume] PDF.js not loaded');
      return null;
    }
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      const pageCount = Math.min(pdf.numPages, 5); // max 5 pages
      for (let i = 1; i <= pageCount; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        text += pageText + '\n';
      }
      const cleaned = text
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();
      return cleaned.slice(0, 4000); // cap at 4000 chars for prompt safety
    } catch (e) {
      console.warn('[Resume] PDF parse failed:', e);
      return null;
    }
  }
};
