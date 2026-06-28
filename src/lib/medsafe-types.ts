export type DocKind = "report" | "prescription";

export type LabValue = {
  name: string;
  value: number | string;
  unit?: string;
  refRange?: string;
  flag?: "normal" | "high" | "low" | "critical";
};

export type Medicine = { name: string; dose?: string; frequency?: string; duration?: string };

export type MedicalDoc = {
  id: string;
  kind: DocKind;
  title: string;
  date: string;
  doctor?: string;
  hospital?: string;
  patientName?: string;
  patientAge?: string;
  patientGender?: string;
  summary?: string;
  diagnoses?: string[];
  medicines?: Medicine[];
  labValues?: LabValue[];
  notes?: string;
  fileName?: string;
  filePreviewUrl?: string;
  storagePath?: string;
  createdAt: string;
};

export type VisitGroup = {
  id: string;
  startDate: string;
  endDate: string;
  doctor?: string;
  hospital?: string;
  docs: MedicalDoc[];
};

const DAY = 24 * 60 * 60 * 1000;

export function groupDocs(docs: MedicalDoc[]): VisitGroup[] {
  const sorted = [...docs].sort((a, b) => a.date.localeCompare(b.date));
  const groups: VisitGroup[] = [];
  for (const d of sorted) {
    const t = new Date(d.date).getTime();
    const match = groups.find((g) => {
      const within =
        Math.abs(new Date(g.startDate).getTime() - t) <= 10 * DAY ||
        Math.abs(new Date(g.endDate).getTime() - t) <= 10 * DAY;
      if (!within) return false;
      if (!g.doctor || !d.doctor) return true;
      return g.doctor.toLowerCase().trim() === d.doctor.toLowerCase().trim();
    });
    if (match) {
      match.docs.push(d);
      if (d.date < match.startDate) match.startDate = d.date;
      if (d.date > match.endDate) match.endDate = d.date;
      if (!match.doctor && d.doctor) match.doctor = d.doctor;
      if (!match.hospital && d.hospital) match.hospital = d.hospital;
    } else {
      groups.push({
        id: `g_${d.id}`,
        startDate: d.date,
        endDate: d.date,
        doctor: d.doctor,
        hospital: d.hospital,
        docs: [d],
      });
    }
  }
  return groups.sort((a, b) => b.startDate.localeCompare(a.startDate));
}
