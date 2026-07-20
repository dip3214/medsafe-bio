// Client-side PDF generator for the printable summary.
// Uses html2canvas to snapshot the rendered article then paginates it into
// a jsPDF A4 document — no server-side headless browser needed (which would
// not run in Cloudflare Workers anyway).

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export type PdfResult = { blob: Blob; filename: string; url: string };

export async function renderSummaryPdf(
  el: HTMLElement,
  patientName: string,
): Promise<PdfResult> {
  // Force a light background for a clean, printable PDF regardless of theme.
  const canvas = await html2canvas(el, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
    logging: false,
    windowWidth: el.scrollWidth,
  });

  const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const imgW = pageW - margin * 2;
  const imgH = (canvas.height * imgW) / canvas.width;

  if (imgH <= pageH - margin * 2) {
    pdf.addImage(canvas, "PNG", margin, margin, imgW, imgH, undefined, "FAST");
  } else {
    // Paginate: slice the source canvas into page-sized chunks.
    const pxPerPt = canvas.width / imgW;
    const pageChunkPx = (pageH - margin * 2) * pxPerPt;
    let y = 0;
    while (y < canvas.height) {
      const sliceH = Math.min(pageChunkPx, canvas.height - y);
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = sliceH;
      const ctx = slice.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
      const h = (sliceH / canvas.width) * imgW;
      if (y > 0) pdf.addPage();
      pdf.addImage(slice, "PNG", margin, margin, imgW, h, undefined, "FAST");
      y += sliceH;
    }
  }

  const blob = pdf.output("blob");
  const safe = patientName.replace(/[^a-z0-9-_ ]/gi, "").trim().replace(/\s+/g, "_") || "patient";
  const filename = `MedSafe_Summary_${safe}_${new Date().toISOString().slice(0, 10)}.pdf`;
  const url = URL.createObjectURL(blob);
  return { blob, filename, url };
}

export function triggerDownload({ url, filename }: { url: string; filename: string }) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => a.remove(), 200);
}
