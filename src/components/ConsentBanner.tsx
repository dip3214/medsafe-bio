import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { upsertMyConsent } from "@/lib/consents.functions";

const LS = "medsafe.consent.v1";

export function ConsentBanner() {
  const [show, setShow] = useState(false);
  const save = useServerFn(upsertMyConsent);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const accepted = localStorage.getItem(LS);
    if (!accepted) setShow(true);
  }, []);

  async function accept(all: boolean) {
    try {
      localStorage.setItem(LS, JSON.stringify({ all, at: Date.now() }));
    } catch {}
    setShow(false);
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      try {
        await save({
          data: {
            storage_consent: true,
            ai_processing_consent: all,
            analytics_consent: all,
          },
        });
      } catch (e) {
        console.error(e);
      }
    }
  }

  if (!show) return null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-2xl border border-border bg-card p-4 shadow-2xl sm:bottom-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="flex-1 text-sm">
          <div className="font-semibold">Your data, your control (DPDP)</div>
          <p className="mt-1 text-muted-foreground">
            MedSafe stores your medical records securely and uses AI to organize them. Under India's Digital
            Personal Data Protection Act, you can withdraw consent and delete your data at any time from{" "}
            <Link to="/account" className="text-primary underline">Privacy & account</Link>. Read our{" "}
            <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.
          </p>
        </div>
        <div className="flex shrink-0 gap-2 sm:flex-col">
          <button
            onClick={() => accept(false)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            Only essential
          </button>
          <button
            onClick={() => accept(true)}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
