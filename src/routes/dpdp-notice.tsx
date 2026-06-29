import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/dpdp-notice")({
  head: () => ({
    meta: [
      { title: "DPDP Notice — MedSafe" },
      { name: "description", content: "Statutory notice under Section 5 of India's Digital Personal Data Protection Act, 2023, describing the personal data MedSafe processes and your rights as a Data Principal." },
    ],
  }),
  component: DpdpNotice,
});

function DpdpNotice() {
  return (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-4 py-10 prose prose-sm prose-neutral">
        <div className="not-prose text-xs uppercase tracking-wider text-primary">DPDP Notice</div>
        <h1 className="font-display text-4xl">Notice to Data Principals</h1>
        <p className="text-muted-foreground">Issued under Section 5, DPDP Act, 2023.</p>

        <h2>1. Data Fiduciary</h2>
        <p>MedSafe (operated by DeRiskBio), Kolkata, India.</p>

        <h2>2. Personal data processed</h2>
        <ul>
          <li>Identifiers: email, full name, family member names and relationships.</li>
          <li>Health data: prescriptions, lab reports, diagnoses, medicines, lab values, clinical notes, images.</li>
          <li>Interaction data: chat history with the in-app assistant.</li>
        </ul>

        <h2>3. Purposes</h2>
        <ul>
          <li>Maintaining your personal health record.</li>
          <li>Generating clinical summaries, trends and reminders.</li>
          <li>Powering the AI assistant strictly grounded in your records.</li>
        </ul>

        <h2>4. Legal basis</h2>
        <p>Consent — granted at sign-up and at the consent banner; granular toggles in <Link to="/account">Privacy & account</Link>.</p>

        <h2>5. Sharing</h2>
        <p>We do not share personal data with third parties for marketing. Processors: Supabase (storage), Lovable AI gateway (AI inference).</p>

        <h2>6. Rights of the Data Principal</h2>
        <ul>
          <li>Right to access and correction.</li>
          <li>Right to portability — export as JSON from <Link to="/account">Privacy & account</Link>.</li>
          <li>Right to erasure — delete account from <Link to="/account">Privacy & account</Link>.</li>
          <li>Right to withdraw consent at any time.</li>
          <li>Right to nominate another individual on your incapacity or death.</li>
          <li>Right of grievance redressal.</li>
        </ul>

        <h2>7. Grievance redressal</h2>
        <p>Email <a href="mailto:grievance@medsafe.in">grievance@medsafe.in</a>. We respond within 7 working days.</p>

        <h2>8. Cross-border transfers</h2>
        <p>Storage and processing primarily in India and other jurisdictions notified by the Government of India.</p>

        <h2>9. Children</h2>
        <p>Health profiles for minors may be created and managed only by a parent or verifiable guardian.</p>
      </article>
    </SiteLayout>
  );
}
