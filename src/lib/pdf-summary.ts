// Vector PDF renderer for the printable summary.
// We build the layout with jsPDF primitives rather than rasterising the DOM.
// html2canvas can't parse modern oklch() colours (which the theme uses),
// and text-first PDFs are smaller, sharper and copy-paste friendly.

import { jsPDF } from "jspdf";
import type { VisitGroup } from "@/lib/medsafe-types";

export type PdfResult = { blob: Blob; filename: string; url: string };

// Brand — MedSafe terracotta ≈ oklch(0.42 0.16 28)
const BRAND = '#a83318';
const INK = '#1a1a1a';
const MUTED = '#6e6e6e';
const RULE = '#dcdcdc';

export function renderSummaryPdf(
  patientName: string,
  visits: VisitGroup[],
): PdfResult {
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 48; // margin
  let y = M;

  const ensureRoom = (needed: number) => {
    if (y + needed > pageH - M) {
      doc.addPage();
      y = M;
    }
  };

  // ── Letterhead ────────────────────────────────────────────────────────
  // Logo pill
  doc.setFillColor(BRAND);
  doc.circle(M + 14, y + 14, 14, "F");
  // Heart glyph inside pill
  doc.setDrawColor(255);
  doc.setFillColor(255);
  drawHeart(doc, M + 14, y + 14, 6);

  // Wordmark
  doc.setTextColor(INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("med", M + 38, y + 14);
  const medW = doc.getTextWidth("med");
  doc.setTextColor(BRAND);
  doc.text("Safe", M + 38 + medW, y + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(MUTED);
  doc.text("ONE FAMILY · ONE HEALTH RECORD", M + 38, y + 26);

  // Right-side: generated date
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  const gen = `Generated ${new Date().toLocaleDateString("en-IN")}`;
  doc.text(gen, pageW - M, y + 14, { align: "right" });

  y += 44;
  doc.setDrawColor(RULE);
  doc.line(M, y, pageW - M, y);
  y += 22;

  // ── Title ─────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(BRAND);
  doc.text("CLINICAL SUMMARY REPORT", M, y);
  y += 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(INK);
  doc.text(`${patientName} — Health summary`, M, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(MUTED);
  const sub = visits.length >= 2
    ? `Based on your last ${visits.length} visits, ${visits[1].endDate} → ${visits[0].startDate}.`
    : visits[0]
      ? "Based on your most recent visit."
      : "No visits recorded yet.";
  doc.text(sub, M, y);
  y += 24;

  // ── Visit blocks ──────────────────────────────────────────────────────
  visits.forEach((v, i) => {
    ensureRoom(60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(INK);
    doc.text(i === 0 ? "Most recent visit" : "Previous visit", M, y);

    const meta = [
      v.startDate === v.endDate ? v.startDate : `${v.startDate} → ${v.endDate}`,
      v.doctor ? `Dr. ${v.doctor}` : null,
      v.hospital,
    ].filter(Boolean).join(" · ");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(MUTED);
    doc.text(meta, pageW - M, y, { align: "right" });
    y += 16;

    const summary = v.docs.find((d) => d.summary)?.summary;
    if (summary) {
      doc.setFontSize(10);
      doc.setTextColor(INK);
      const lines = doc.splitTextToSize(summary, pageW - M * 2);
      ensureRoom(lines.length * 12 + 8);
      doc.text(lines, M, y);
      y += lines.length * 12 + 6;
    }

    const dx = Array.from(new Set(v.docs.flatMap((d) => d.diagnoses ?? [])));
    if (dx.length) {
      y = section(doc, "Diagnoses", y, M, pageW, ensureRoom);
      dx.forEach((d) => { y = bullet(doc, d, y, M, pageW, ensureRoom); });
      y += 6;
    }

    const meds = v.docs.flatMap((d) => d.medicines ?? []);
    if (meds.length) {
      y = section(doc, "Medicines", y, M, pageW, ensureRoom);
      meds.forEach((m) => {
        const line = [m.name, m.dose, m.frequency, m.duration].filter(Boolean).join(" · ");
        y = bullet(doc, line, y, M, pageW, ensureRoom);
      });
      y += 6;
    }

    const labs = v.docs.flatMap((d) => d.labValues ?? []);
    if (labs.length) {
      y = section(doc, "Lab values", y, M, pageW, ensureRoom);
      // Simple 4-col table
      const col = [M, M + 210, M + 320, M + 430];
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(MUTED);
      ensureRoom(16);
      doc.text("Test", col[0], y);
      doc.text("Value", col[1], y);
      doc.text("Ref", col[2], y);
      doc.text("Flag", col[3], y);
      y += 4;
      doc.setDrawColor(RULE);
      doc.line(M, y, pageW - M, y);
      y += 10;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(INK);
      doc.setFontSize(10);
      labs.forEach((l) => {
        ensureRoom(14);
        doc.text(String(l.name ?? ""), col[0], y, { maxWidth: 200 });
        doc.text(`${l.value ?? ""}${l.unit ? " " + l.unit : ""}`, col[1], y);
        doc.text(String(l.refRange ?? "—"), col[2], y, { maxWidth: 100 });
        const flag = String(l.flag ?? "—");
        if (flag !== "—" && flag !== "normal") doc.setTextColor(190, 70, 20);
        doc.text(flag, col[3], y);
        doc.setTextColor(INK);
        y += 14;
      });
      y += 6;
    }

    ensureRoom(18);
    doc.setFontSize(8);
    doc.setTextColor(MUTED);
    doc.text(`${v.docs.length} document${v.docs.length > 1 ? "s" : ""}`, M, y);
    y += 22;
  });

  // ── Footer disclaimer on every page ───────────────────────────────────
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setDrawColor(RULE);
    doc.line(M, pageH - M + 6, pageW - M, pageH - M + 6);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(MUTED);
    doc.text(
      "Generated from your uploaded records — not a substitute for medical advice. Discuss with your physician before any change. — MedSafe",
      M, pageH - M + 18, { maxWidth: pageW - M * 2 },
    );
    doc.text(`Page ${p} / ${pageCount}`, pageW - M, pageH - M + 18, { align: "right" });
  }

  const blob = doc.output("blob");
  const safe = patientName.replace(/[^a-z0-9-_ ]/gi, "").trim().replace(/\s+/g, "_") || "patient";
  const filename = `MedSafe_Summary_${safe}_${new Date().toISOString().slice(0, 10)}.pdf`;
  const url = URL.createObjectURL(blob);
  return { blob, filename, url };
}

function section(
  doc: jsPDF, title: string, y: number, M: number, pageW: number,
  ensureRoom: (n: number) => void,
) {
  ensureRoom(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  doc.text(title.toUpperCase(), M, y);
  y += 6;
  doc.setDrawColor(RULE);
  doc.line(M, y, pageW - M, y);
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(INK);
  return y;
}

function bullet(
  doc: jsPDF, text: string, y: number, M: number, pageW: number,
  ensureRoom: (n: number) => void,
) {
  const lines = doc.splitTextToSize(text, pageW - M * 2 - 12);
  ensureRoom(lines.length * 12 + 2);
  doc.setFillColor(BRAND);
  doc.circle(M + 3, y - 3, 1.6, "F");
  doc.text(lines, M + 12, y);
  return y + lines.length * 12 + 2;
}

function drawHeart(doc: jsPDF, cx: number, cy: number, size: number) {
  // Two circles + downward triangle — clean heart glyph
  const r = size / 2;
  doc.circle(cx - r * 0.9, cy - r * 0.2, r, "F");
  doc.circle(cx + r * 0.9, cy - r * 0.2, r, "F");
  doc.triangle(
    cx - r * 1.8, cy + r * 0.2,
    cx + r * 1.8, cy + r * 0.2,
    cx, cy + r * 2.2,
    "F",
  );
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
