import { createFileRoute, Outlet, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2, MessageSquare } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { listChatThreads, createChatThread, deleteChatThread } from "@/lib/chat.functions";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatLayout,
});

function ChatLayout() {
  const list = useServerFn(listChatThreads);
  const create = useServerFn(createChatThread);
  const del = useServerFn(deleteChatThread);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { threadId?: string };
  const activeId = params.threadId;

  const { data: threads = [] } = useQuery({
    queryKey: ["chatThreads"],
    queryFn: () => list(),
  });

  const newThread = useMutation({
    mutationFn: () => create({ data: { title: "New chat" } }),
    onSuccess: async ({ id }) => {
      await qc.invalidateQueries({ queryKey: ["chatThreads"] });
      navigate({ to: "/chat/$threadId", params: { threadId: id } });
    },
  });

  const removeThread = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: async (_, id) => {
      await qc.invalidateQueries({ queryKey: ["chatThreads"] });
      if (activeId === id) navigate({ to: "/chat" });
    },
  });

  return (
    <SiteLayout>
      <div className="mx-auto grid h-[calc(100vh-9rem)] max-w-7xl grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[260px_1fr]">
        <aside className="flex flex-col rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-3 py-3">
            <div className="text-sm font-semibold">Conversations</div>
            <button
              onClick={() => newThread.mutate()}
              disabled={newThread.isPending}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> New
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {threads.length === 0 && (
              <div className="px-2 py-4 text-xs text-muted-foreground">
                No chats yet. Start one to ask about your records.
              </div>
            )}
            <ul className="space-y-1">
              {threads.map((t) => (
                <li key={t.id} className="group flex items-center gap-1">
                  <Link
                    to="/chat/$threadId"
                    params={{ threadId: t.id }}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent"
                    activeProps={{ className: "bg-accent text-accent-foreground" }}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{t.title || "New chat"}</span>
                  </Link>
                  <button
                    onClick={() => removeThread.mutate(t.id)}
                    className="opacity-0 transition group-hover:opacity-100"
                    aria-label="Delete chat"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
        <section className="min-h-0 overflow-hidden rounded-xl border border-border bg-card">
          <Outlet />
        </section>
      </div>
    </SiteLayout>
  );
}
