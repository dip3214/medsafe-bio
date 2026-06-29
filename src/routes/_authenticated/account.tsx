import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, ShieldCheck, Trash2, AlertTriangle } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { getMyConsent, upsertMyConsent } from "@/lib/consents.functions";
import { exportMyData, deleteMyAccount } from "@/lib/account.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "Privacy & account — MedSafe" },
      { name: "description", content: "Manage your DPDP consents, export your data, or delete your account and records permanently." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const get = useServerFn(getMyConsent);
  const save = useServerFn(upsertMyConsent);
  const exp = useServerFn(exportMyData);
  const del = useServerFn(deleteMyAccount);

  const { data: consent, refetch } = useQuery({ queryKey: ["consent"], queryFn: () => get() });

  const [storage, setStorage] = useState(true);
  const [aiC, setAiC] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (consent) {
      setStorage(consent.storage_consent);
      setAiC(consent.ai_processing_consent);
      setAnalytics(consent.analytics_consent);
    }
  }, [consent]);

  async function onSave() {
    setSaving(true);
    try {
      await save({ data: { storage_consent: storage, ai_processing_consent: aiC, analytics_consent: analytics } });
      await refetch();
    } finally {
      setSaving(false);
    }
  }

  const exportMut = useMutation({
    mutationFn: () => exp() as Promise<Record<string, unknown>>,
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `medsafe-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => del(),
    onSuccess: async () => {
      await supabase.auth.signOut();
      navigate({ to: "/" });
    },
  });

  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-10">
        <div className="text-xs uppercase tracking-wider text-primary">Privacy & account</div>
        <h1 className="mt-1 font-display text-3xl">Your rights, your data</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Under India's Digital Personal Data Protection Act (DPDP), 2023, you control your data at all times.
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-primary" /> Consent preferences
          </div>
          <div className="mt-4 space-y-3">
            <ConsentRow
              title="Store my medical records"
              desc="Required to use MedSafe. Disabling this removes your records."
              value={storage}
              onChange={setStorage}
              required
            />
            <ConsentRow
              title="Use AI to organize & answer questions"
              desc="Lets MedSafe parse reports into structured data and power the assistant."
              value={aiC}
              onChange={setAiC}
            />
            <ConsentRow
              title="Anonymized usage analytics"
              desc="Helps us improve the product. No medical data is included."
              value={analytics}
              onChange={setAnalytics}
            />
          </div>
          <div className="mt-5 flex justify-end">
            <button
              onClick={onSave}
              disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save preferences"}
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Download className="h-4 w-4 text-primary" /> Right to data portability
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Download a complete copy of your MedSafe data as JSON — profiles, documents, lab values, medicines,
            chat history.
          </p>
          <button
            onClick={() => exportMut.mutate()}
            disabled={exportMut.isPending}
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> {exportMut.isPending ? "Preparing…" : "Export my data"}
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <AlertTriangle className="h-4 w-4" /> Right to erasure
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Permanently delete your account, every uploaded report and all generated insights.
            This cannot be undone.
          </p>
          <button
            onClick={() => {
              if (confirm("This permanently deletes your account and ALL records. Continue?")) {
                deleteMut.mutate();
              }
            }}
            disabled={deleteMut.isPending}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" /> {deleteMut.isPending ? "Deleting…" : "Delete my account"}
          </button>
        </div>
      </section>
    </SiteLayout>
  );
}

function ConsentRow({
  title,
  desc,
  value,
  onChange,
  required,
}: {
  title: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
  required?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-3 hover:bg-accent/40">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        disabled={required}
        className="mt-1 h-4 w-4 accent-primary"
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">
          {title} {required && <span className="ml-1 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] uppercase">Required</span>}
        </div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </label>
  );
}
