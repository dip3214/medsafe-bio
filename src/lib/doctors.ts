export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  area: string;
  rating: number;
  experienceYears: number;
  consultationFee: number;
};

export type Hospital = {
  id: string;
  name: string;
  area: string;
  specialties: string[];
  diagnosticsFocus: string;
};

export const KOLKATA_DOCTORS: Doctor[] = [
  { id: "d1", name: "Dr. Sumanta Chatterjee", specialty: "Cardiology", hospital: "AMRI Hospitals, Dhakuria", area: "Dhakuria", rating: 4.8, experienceYears: 22, consultationFee: 1200 },
  { id: "d2", name: "Dr. Arpita Sen", specialty: "Endocrinology / Diabetology", hospital: "Apollo Multispeciality Hospital", area: "Salt Lake", rating: 4.9, experienceYears: 18, consultationFee: 1500 },
  { id: "d3", name: "Dr. Rajat Bose", specialty: "Gastroenterology", hospital: "Fortis Hospital Anandapur", area: "Anandapur", rating: 4.7, experienceYears: 20, consultationFee: 1400 },
  { id: "d4", name: "Dr. Priyanka Roy", specialty: "Nephrology", hospital: "Rabindranath Tagore International Institute of Cardiac Sciences", area: "Mukundapur", rating: 4.6, experienceYears: 15, consultationFee: 1300 },
  { id: "d5", name: "Dr. Soumitra Ghosh", specialty: "Oncology", hospital: "Tata Medical Center", area: "New Town", rating: 4.9, experienceYears: 25, consultationFee: 1800 },
  { id: "d6", name: "Dr. Manjula Iyer", specialty: "Pulmonology", hospital: "Peerless Hospital", area: "Panchasayar", rating: 4.5, experienceYears: 17, consultationFee: 1100 },
  { id: "d7", name: "Dr. Anirban Dutta", specialty: "General Physician", hospital: "Belle Vue Clinic", area: "Loudon Street", rating: 4.6, experienceYears: 14, consultationFee: 900 },
  { id: "d8", name: "Dr. Ritwika Banerjee", specialty: "Neurology", hospital: "Medica Superspecialty Hospital", area: "Mukundapur", rating: 4.8, experienceYears: 19, consultationFee: 1600 },
  { id: "d9", name: "Dr. Kaushik Mitra", specialty: "Orthopedics", hospital: "Woodlands Multispeciality Hospital", area: "Alipore", rating: 4.7, experienceYears: 21, consultationFee: 1200 },
  { id: "d10", name: "Dr. Indrani Pal", specialty: "Gynecology", hospital: "Bhagirathi Neotia Woman & Child Care Centre", area: "Rawdon Street", rating: 4.8, experienceYears: 16, consultationFee: 1300 },
];

export const KOLKATA_HOSPITALS: Hospital[] = [
  { id: "h1", name: "Tata Medical Center", area: "New Town", specialties: ["Oncology", "Genomics", "Radiology"], diagnosticsFocus: "Cancer screening, PET-CT, molecular diagnostics" },
  { id: "h2", name: "Apollo Multispeciality Hospital", area: "Salt Lake", specialties: ["Cardiology", "Endocrinology", "Neurology"], diagnosticsFocus: "Cardiac, diabetes panel, MRI/CT" },
  { id: "h3", name: "AMRI Hospitals", area: "Dhakuria / Mukundapur / Salt Lake", specialties: ["Cardiology", "Gastro", "Ortho"], diagnosticsFocus: "Cath lab, endoscopy, pathology" },
  { id: "h4", name: "Fortis Hospital Anandapur", area: "Anandapur", specialties: ["Gastro", "Liver", "Cardiac"], diagnosticsFocus: "Liver transplant, advanced GI, cardiac" },
  { id: "h5", name: "Medica Superspecialty Hospital", area: "Mukundapur", specialties: ["Neuro", "Cardiac", "Renal"], diagnosticsFocus: "Stroke unit, dialysis, neuro imaging" },
  { id: "h6", name: "Peerless Hospital", area: "Panchasayar", specialties: ["Pulmonology", "General Medicine"], diagnosticsFocus: "Sleep lab, PFT, routine pathology" },
  { id: "h7", name: "RN Tagore International Institute of Cardiac Sciences", area: "Mukundapur", specialties: ["Cardiac", "Renal"], diagnosticsFocus: "Heart surgery, nephrology" },
  { id: "h8", name: "SRL / Dr. Lal PathLabs (multiple centers)", area: "Citywide", specialties: ["Pathology"], diagnosticsFocus: "Blood panels, HbA1c, lipid, thyroid, biopsy" },
];
