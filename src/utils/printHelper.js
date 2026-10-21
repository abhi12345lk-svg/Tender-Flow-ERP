/**
 * TenderFlow ERP — Universal Print Helper
 *
 * Renders any printable element inside an isolated, unconstrained print frame.
 * This completely eliminates modal clipping, scroll clipping, and transform bugs
 * that occur in browser print engines when printing elements inside active dialogs.
 */

export function printElement(elementId = 'printable-document', options = {}) {
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) {
    console.warn(`[printElement] Element with id "${elementId}" not found. Falling back to window.print()`);
    window.print();
    return;
  }

  // Collect all styles and link tags from main document to preserve Tailwind styles & fonts
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n');

  // Clone element to prevent altering active UI
  const clonedEl = sourceEl.cloneNode(true);

  // Remove any no-print items from the cloned markup
  clonedEl.querySelectorAll('.no-print').forEach((node) => node.remove());

  // Create an invisible iframe attached to body
  const iframe = document.createElement('iframe');
  iframe.setAttribute(
    'style',
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;z-index:-9999;'
  );
  iframe.title = options.title || 'Print Document';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${options.title || 'TenderFlow ERP Document'}</title>
      ${styles}
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 10mm 15mm 10mm;
        }

        *, *:before, *:after {
          box-sizing: border-box !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #0f172a !important;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans Devanagari", sans-serif !important;
          font-size: 12px;
          line-height: 1.5;
          width: 100% !important;
          height: auto !important;
          overflow: visible !important;
        }

        #printable-document {
          display: block !important;
          visibility: visible !important;
          position: static !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
          box-shadow: none !important;
          overflow: visible !important;
        }

        table {
          width: 100% !important;
          border-collapse: collapse !important;
          page-break-inside: auto;
        }

        thead {
          display: table-header-group !important;
        }

        tfoot {
          display: table-footer-group !important;
        }

        tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        .no-print {
          display: none !important;
        }
      </style>
    </head>
    <body>
      ${clonedEl.outerHTML}
    </body>
    </html>
  `);
  doc.close();

  // Trigger print after iframe renders
  const triggerPrint = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (err) {
      console.warn('[printElement] Iframe print failed, falling back:', err.message);
      window.print();
    } finally {
      // Remove iframe from DOM after print dialog closes
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1500);
    }
  };

  // Wait for images and layout within iframe
  setTimeout(triggerPrint, 250);
}
