import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  fileDataUrl: z.string().min(20),
  mimeType: z.string(),
  hint: z.enum(["report", "prescription", "auto"]).default("auto"),
});

const SYSTEM = `You are a clinical document parser for an Indian medical records app (MedSafe).
Given a scanned medical report or prescription image/PDF, extract structured clinical events.
Return STRICT JSON only, matching this TypeScript shape:
{
  "kind": "report" | "prescription",
  "title": string,
  "date": "YYYY-MM-DD",
  "doctor": string | null,
  "hospital": string | null,
  "patientName": string | null,
  "patientAge": string | null,
  "patientGender": string | null,
  "summary": string,
  "diagnoses": string[],
  "medicines": [{ "name": string, "dose": string, "frequency": string, "duration": string }],
  "labValues": [{ "name": string, "value": string | number, "unit": string, "refRange": string, "flag": "normal"|"high"|"low"|"critical" }],
  "notes": string
}
Use empty arrays if not applicable. Do not include markdown fences.`;

export const extractClinicalDoc = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const isPdf = data.mimeType === "application/pdf";
    const userContent: any[] = [
      { type: "text", text: `Parse this ${data.hint === "auto" ? "medical document" : data.hint}. Return JSON only.` },
    ];
    if (isPdf) {
      userContent.push({ type: "file", file: { filename: "doc.pdf", file_data: data.fileDataUrl } });
    } else {
      userContent.push({ type: "image_url", image_url: { url: data.fileDataUrl } });
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      if (resp.status === 429) throw new Error("AI rate limit reached. Please retry shortly.");
      if (resp.status === 402) throw new Error("AI credits exhausted. Please add credits in Workspace settings.");
      throw new Error(`AI extraction failed: ${resp.status} ${txt.slice(0, 200)}`);
    }
    const json = await resp.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    }
    return parsed;
  });
