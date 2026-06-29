import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — MedSafe" },
      { name: "description", content: "How MedSafe collects, uses, stores and protects your personal and medical data, in line with India's DPDP Act, 2023." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-4 py-10 prose prose-sm prose-neutral">
        <div className="not-prose text-xs uppercase tracking-wider text-primary">Privacy Policy</div>
        <h1 className="font-display text-4xl">Your privacy, our duty</h1>
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-IN")}</p>

        <p>
          MedSafe is a personal health record service operated by DeRiskBio. This policy describes
          what data we collect, why, and the rights you have under India's Digital Personal Data
          Protection Act, 2023 (the "DPDP Act").
        </p>

        <h2>What we collect</h2>
        <ul>
          <li><strong>Account information</strong> — email, full name and the family profiles you create.</li>
          <li><strong>Medical records</strong> — prescriptions, lab reports and images you upload.</li>
          <li><strong>Structured clinical data</strong> — diagnoses, medicines, lab values extracted from your uploads.</li>
          <li><strong>Chat history</strong> — questions you ask the assistant and its responses.</li>
          <li><strong>Technical logs</strong> — minimal logs needed to operate the service.</li>
        </ul>

        <h2>How we use it</h2>
        <ul>
          <li>To organize your records into a clinical timeline.</li>
          <li>To answer your questions through the in-app assistant, grounded in your own records.</li>
          <li>To remind you of follow-ups and flag out-of-range values.</li>
          <li>We do <strong>not</strong> sell your data, share it with insurers, or use it to train public AI models.</li>
        </ul>

        <h2>Where it lives</h2>
        <p>
          Records are stored in encrypted Supabase databases and object storage. AI processing is
          performed via the Lovable AI gateway under a data processing agreement. Service providers
          act as data processors on our instructions.
        </p>

        <h2>Your rights under the DPDP Act</h2>
        <ul>
          <li><strong>Access</strong> — see what we hold, anytime.</li>
          <li><strong>Correction</strong> — fix anything inaccurate.</li>
          <li><strong>Portability</strong> — export your data in JSON. <Link to="/account">Do it now.</Link></li>
          <li><strong>Erasure</strong> — delete your account and all records. <Link to="/account">Do it now.</Link></li>
          <li><strong>Withdraw consent</strong> — for AI processing or analytics at any time.</li>
          <li><strong>Grievance</strong> — write to our Grievance Officer (below).</li>
        </ul>

        <h2>Retention</h2>
        <p>
          We retain your records until you delete your account. On deletion, records and stored
          files are removed within 30 days from primary systems and 90 days from encrypted backups.
        </p>

        <h2>Children's data</h2>
        <p>
          Profiles for minors (MedSafe Kids) may be created and managed only by a parent or
          verifiable guardian. We do not market to children.
        </p>

        <h2>Grievance Officer</h2>
        <address className="not-italic">
          MedSafe / DeRiskBio<br />
          Email: <a href="mailto:grievance@medsafe.in">grievance@medsafe.in</a><br />
          Address: Kolkata, India
        </address>

        <p className="text-xs text-muted-foreground">
          See also: <Link to="/dpdp-notice">DPDP Notice</Link>.
        </p>
      </article>
    </SiteLayout>
  );
}
