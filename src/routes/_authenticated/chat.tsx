import { createFileRoute, Link } from "@tanstack/react-router";
import type { UIMessage } from "ai";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { HelpCircle } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { MedBuddyChatWindow } from "@/components/MedBuddyChat";
import { getOrCreateChatThread, getChatThreadMessages } from "@/lib/chat.functions";
import { useActiveMember } from "@/lib/active-member";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "MedBuddy Assistant — your private medical assistant" },
      { name: "description", content: "Ask MedBuddy Assistant anything about your records. Every answer is searched out of your own prescriptions and lab reports." },
      { property: "og:title", content: "MedBuddy Assistant — your private medical assistant" },
      { property: "og:description", content: "Answers grounded in your own prescriptions and lab reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { active } = useActiveMember();
  const memberId = active?.id ?? null;

  const ensure = useServerFn(getOrCreateChatThread);
  const fetchMessages = useServerFn(getChatThreadMessages);

  const { data: thread, isLoading: tLoading, refetch: refetchThread } = useQuery({
    queryKey: ["chat-thread", memberId],
    queryFn: () => ensure({ data: { memberId } }) as Promise<{ id: string }>,
    enabled: true,
  });

  const { data: initialMessages, isLoading: mLoading } = useQuery({
    queryKey: ["chat-messages", thread?.id],
    queryFn: () => fetchMessages({ data: { threadId: thread!.id } }),
    enabled: !!thread?.id,
  });

  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-primary">MedBuddy Assistant</div>
            <h1 className="font-display text-3xl">
              {active ? `Talking about ${active.name}` : "Your private medical assistant"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              MedBuddy searches {active?.name ? `${active.name}'s` : "your"} own prescriptions and lab reports before answering, and names
              the document it used. Private to your account.
            </p>
          </div>
          <Link
            to="/faq"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground transition hover:bg-accent"
          >
            <HelpCircle className="h-3.5 w-3.5 text-primary" /> Common questions
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {tLoading || mLoading || !thread ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Loading your assistant…</div>
          ) : (
            <MedBuddyChatWindow
              key={thread.id}
              threadId={thread.id}
              memberId={memberId}
              initialMessages={(initialMessages as unknown as UIMessage[]) ?? []}
              onCleared={refetchThread}
            />
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
