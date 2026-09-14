import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { UIMessage } from "ai";
import { Stethoscope, X, LogIn, ExternalLink, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveMember } from "@/lib/active-member";
import { getOrCreateChatThread, getChatThreadMessages } from "@/lib/chat.functions";
import { MedBuddyChatWindow } from "@/components/MedBuddyChat";

/**
 * MedBuddy side dock — a slim tab on the right edge of every page that opens
 * a slide-over chat panel. Signed-out visitors get a friendly sign-in prompt.
 */
export function MedBuddySide() {
  const [open, setOpen] = useState(false);
  // undefined = still checking, null = signed out, string = signed in
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  const { active } = useActiveMember();
  const memberId = active?.id ?? null;

  const ensure = useServerFn(getOrCreateChatThread);
  const fetchMessages = useServerFn(getChatThreadMessages);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const { data: thread, isLoading: tLoading, refetch: refetchThread } = useQuery({
    queryKey: ["chat-thread", memberId],
    queryFn: () => ensure({ data: { memberId } }) as Promise<{ id: string }>,
    enabled: open && !!email,
  });

  const { data: initialMessages, isLoading: mLoading } = useQuery({
    queryKey: ["chat-messages", thread?.id],
    queryFn: () => {
      if (!thread?.id) return Promise.resolve([]);
      return fetchMessages({ data: { threadId: thread.id } });
    },
    enabled: open && !!thread?.id,
  });

  return (
    <>
      {/* Right-edge tab */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open MedBuddy Assistant"
          className="fixed right-0 top-1/2 z-40 flex -translate-y-1/2 items-center gap-1.5 rounded-l-xl bg-primary py-4 pl-2.5 pr-2 text-primary-foreground shadow-lg transition hover:pl-3.5"
        >
          <Stethoscope className="h-4 w-4 shrink-0" />
          <span className="text-xs font-semibold" style={{ writingMode: "vertical-rl" }}>
            MedBuddy
          </span>
        </button>
      )}

      {/* Slide-over panel */}
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-label="MedBuddy Assistant">
          <button
            aria-label="Close MedBuddy"
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-background shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Stethoscope className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-semibold leading-tight">MedBuddy Assistant</div>
                  <div className="text-[11px] text-muted-foreground">
                    Answers from {active ? `${active.name}'s` : "your"} records
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  to="/faq"
                  onClick={() => setOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  aria-label="Common questions"
                  title="Common questions"
                >
                  <HelpCircle className="h-4 w-4" />
                </Link>
                {email && (
                  <Link
                    to="/chat"
                    onClick={() => setOpen(false)}
                    className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
                    aria-label="Open full assistant page"
                    title="Open full page"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              {email === undefined ? (
                <PanelCenter>Loading…</PanelCenter>
              ) : email === null ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Stethoscope className="h-6 w-6" />
                  </span>
                  <div>
                    <div className="font-semibold">Meet MedBuddy</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Sign in to chat with your private medical assistant — it answers from your own reports and records.
                    </p>
                  </div>
                  <Link
                    to="/auth"
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                  >
                    <LogIn className="h-4 w-4" /> Sign in to start
                  </Link>
                  <Link to="/faq" onClick={() => setOpen(false)} className="text-xs text-primary underline-offset-2 hover:underline">
                    Browse common health questions
                  </Link>
                </div>
              ) : tLoading || mLoading || !thread ? (
                <PanelCenter>Loading your assistant…</PanelCenter>
              ) : (
                <MedBuddyChatWindow
                  key={thread.id}
                  threadId={thread.id}
                  memberId={memberId}
                  initialMessages={(initialMessages as unknown as UIMessage[]) ?? []}
                  onCleared={refetchThread}
                  heightClass="min-h-0 flex-1"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PanelCenter({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">{children}</div>;
}
