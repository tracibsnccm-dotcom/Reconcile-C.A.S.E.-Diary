/**
 * print.ts — Browser print helper for released RN reports.
 * Opens a new window, writes a minimal HTML document with print CSS,
 * header (case identifier + printed timestamp), and the provided html as body.
 * Uses window.print(). No new dependencies.
 */

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const PRINT_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #000;
    background: #fff;
    padding: 0.75in;
    max-width: 8.5in;
    margin: 0 auto;
  }
  .print-header {
    border-bottom: 1px solid #ccc;
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
    font-size: 11pt;
    color: #333;
  }
  .print-header div { margin-bottom: 0.25rem; }
  button, a[href] { display: none !important; }
  .print-section { page-break-inside: avoid; }
  @media print {
    body { padding: 0.75in; }
    .print-header { page-break-after: avoid; }
    .print-section { page-break-inside: avoid; }
    @page { margin: 0.75in; }
  }
`;

/**
 * Opens a new window, writes a minimal HTML document with title, print CSS,
 * a header (case identifier + printed timestamp), and the provided html as body.
 * Calls win.focus() and win.print(). Optionally closes the window after a short delay.
 * If the popup is blocked, alerts and returns (no window.print fallback to avoid
 * printing the wrong page).
 *
 * @param title - Document title
 * @param html - Body content HTML (report sections); may include <style> if needed
 * @param caseIdentifier - Optional case number or human-friendly id for the header
 */
export function printHtml(
  title: string,
  html: string,
  caseIdentifier?: string
): void {
  const printedTimestamp = new Date().toLocaleString();
  const headerHtml = `
    <div class="print-header">
      ${caseIdentifier != null && caseIdentifier !== "" ? `<div><strong>Case:</strong> ${escapeHtml(caseIdentifier)}</div>` : ""}
      <div><strong>Printed:</strong> ${escapeHtml(printedTimestamp)}</div>
    </div>`;

  const doc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>${PRINT_CSS}</style>
</head>
<body>
  ${headerHtml}
  ${html}
</body>
</html>`;

  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) {
    // Popup likely blocked; do not fallback to window.print() — we cannot know if current page is print-safe.
    if (typeof window !== "undefined" && window.alert) {
      window.alert("Please allow pop-ups to print this report.");
    }
    return;
  }

  win.document.write(doc);
  win.document.close();
  win.focus();
  win.print();

  // Optionally close after printing (user may cancel print dialog)
  setTimeout(() => {
    try {
      win.close();
    } catch {
      // ignore if already closed
    }
  }, 500);
}
