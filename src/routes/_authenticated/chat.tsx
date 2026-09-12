import { createFileRoute, Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import { Send, Square, Stethoscope, User, Sparkles, Trash2, Paperclip, Loader2, FileCheck2 } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateChatThread, getChatThreadMessages, clearChatThread } from "@/lib/chat.functions";
import { useActiveMember } from "@/lib/active-member";
import { extractClinicalDoc } from "@/lib/extract.functions";
import { createMedicalDoc } from "@/lib/medsafe.functions";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "MedSafe Buddy — your private medical assistant" },
      { name: "description", content: "Ask MedSafe Buddy anything about your records. Every answer is searched out of your own prescriptions and lab reports." },
      { property: "og:title", content: "MedSafe Buddy — your private medical assistant" },
      { property: "og:description", content: "Answers grounded in your own prescriptions and lab reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChatPage,
});

const STARTERS = [
  "Summarise my latest lab report in plain language",
  "Which of my recent values are out of range, and why does it matter?",
  "List all medicines I'm currently taking, with their purpose",
  "Compare my last two visits — what improved, what got worse?",
];

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
            <div className="text-xs uppercase tracking-wider text-primary">Ask MedSafe</div>
            <h1 className="font-display text-3xl">
              {active ? `Talking about ${active.name}` : "Your private medical assistant"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Grounded in {active?.name || "your"} uploaded prescriptions and lab reports. Private to your account.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {tLoading || mLoading || !thread ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Loading your assistant…</div>
          ) : (
            <ChatWindow
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

function ChatWindow({
  threadId,
  memberId,
  initialMessages,
  onCleared,
}: {
  threadId: string;
  memberId: string | null;
  initialMessages: UIMessage[];
  onCleared: () => void;
}) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: async ({ messages }) => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          const headers: Record<string, string> = {};
          if (token) headers.Authorization = `Bearer ${token}`;
          return { body: { messages, threadId, memberId }, headers };
        },
      }),
    [threadId, memberId],
  );

  const { messages, sendMessage, status, stop, error, setMessages } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
  });

  const [input, setInput] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    taRef.current?.focus();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  const busy = status === "submitted" || status === "streaming";
  const empty = messages.length === 0;

  async function submit(text?: string) {
    const value = (text ?? input).trim();
    if (!value || busy) return;
    if (!text) setInput("");
    await sendMessage({ text: value });
    requestAnimationFrame(() => taRef.current?.focus());
  }

  const clear = useServerFn(clearChatThread);
  async function clearChat() {
    await clear({ data: { threadId } });
    setMessages([]);
    onCleared();
  }

  // ---- Attach a report/prescription image or PDF from chat ----
  const { active } = useActiveMember();
  const qc = useQueryClient();
  const extract = useServerFn(extractClinicalDoc);
  const createDoc = useServerFn(createMedicalDoc);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [savedDoc, setSavedDoc] = useState<{ title: string } | null>(null);

  async function onAttach(file: File) {
    setUploadError(null);
    setSavedDoc(null);
    setUploading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const dataUrl: string = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = () => rej(new Error("read failed"));
        r.readAsDataURL(file);
      });
      const parsed: any = await extract({
        data: { fileDataUrl: dataUrl, mimeType: file.type || "image/jpeg", hint: "auto" },
      });
      const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
      const path = `${u.user.id}/${crypto.randomUUID()}${ext}`;
      const { error: upErr } = await supabase.storage
        .from("medical-documents")
        .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
      if (upErr) throw upErr;
      await createDoc({
        data: {
          storagePath: path,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
          parsed,
          memberId: active?.id,
        },
      });
      qc.invalidateQueries({ queryKey: ["medsafe-docs"] });
      setSavedDoc({ title: parsed?.title || file.name });
      // Kick off a chat summary so the user gets an immediate readout
      const bits: string[] = [];
      if (parsed?.summary) bits.push(parsed.summary);
      if (Array.isArray(parsed?.diagnoses) && parsed.diagnoses.length)
        bits.push(`Diagnoses noted: ${parsed.diagnoses.join(", ")}.`);
      if (Array.isArray(parsed?.labValues) && parsed.labValues.length) {
        const flagged = parsed.labValues.filter((l: any) => l.flag && l.flag !== "normal");
        if (flagged.length) bits.push(`Flagged values: ${flagged.map((l: any) => `${l.name} ${l.value}${l.unit ? " " + l.unit : ""} [${l.flag}]`).join("; ")}.`);
      }
      const context = bits.join(" ");
      const prompt = context
        ? `I just uploaded my report "${parsed?.title || file.name}" (${parsed?.date || "recent"}). Here is what was extracted: ${context}\n\nPlease summarise it in plain language and flag anything I should watch.`
        : `I just uploaded a report "${file.name}". Please read it from my records and summarise it in plain language.`;
      submit(prompt);
    } catch (e: any) {
      setUploadError(e?.message || "Couldn't process that file");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-18rem)] min-h-[480px] flex-col">
      <div
        ref={scrollRef}
        className="chat-scroll flex-1 overflow-y-auto px-4 py-6 sm:px-8"
      >
        {empty ? (
          <EmptyState onPick={(t) => submit(t)} />
        ) : (
          <div className="space-y-5">
            {messages.map((m) => (
              <Message key={m.id} message={m} />
            ))}
            {status === "submitted" && <TypingDots />}
            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error.message || "Something went wrong."}
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="border-t border-border bg-background p-3">
        {(uploading || uploadError || savedDoc) && (
          <div className="mb-2 flex items-center gap-2 text-xs">
            {uploading && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Reading your document…
              </span>
            )}
            {savedDoc && !uploading && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-primary">
                <FileCheck2 className="h-3 w-3" /> Saved to your uploads: {savedDoc.title}
                <Link to="/upload" className="ml-1 underline">View</Link>
              </span>
            )}
            {uploadError && (
              <span className="rounded-md bg-destructive/10 px-2.5 py-1 text-destructive">{uploadError}</span>
            )}
          </div>
        )}
        <div className="flex items-end gap-2">
          {!empty && (
            <button
              onClick={clearChat}
              className="inline-flex h-11 items-center gap-1 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground transition hover:bg-accent"
              aria-label="Clear chat"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onAttach(f); e.target.value = ""; }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading || busy}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card transition hover:bg-accent disabled:opacity-40"
            aria-label="Attach a report or prescription"
            title="Attach a report or prescription"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          </button>
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder="Ask about your reports, medicines, lab trends… or attach a new one"
            className="chat-input max-h-40 min-h-[44px] flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
          />
          {busy ? (
            <button
              onClick={() => stop()}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card transition hover:bg-accent"
              aria-label="Stop"
            >
              <Square className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => submit()}
              disabled={!input.trim()}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground transition hover:bg-primary/90 active:scale-95 disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 py-8 text-center animate-fade-in">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
        <Sparkles className="h-7 w-7" />
      </div>
      <div>
        <h2 className="font-display text-2xl">How can I help today?</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Pick a starter — or type your own. Answers come from your own records.
        </p>
      </div>
      <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
        {STARTERS.map((p, i) => (
          <button
            key={p}
            onClick={() => onPick(p)}
            style={{ animationDelay: `${i * 60}ms` }}
            className="suggestion-card animate-fade-in rounded-xl border border-border bg-background px-4 py-3 text-left text-sm transition-transform hover:scale-[1.02] hover:border-primary/40 hover:bg-accent active:scale-[0.98]"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground">
        <Stethoscope className="h-3.5 w-3.5" />
      </div>
      <span className="typing-dots inline-flex gap-1">
        <span /> <span /> <span />
      </span>
    </div>
  );
}

function Message({ message }: { message: UIMessage }) {
  const text = (message.parts ?? []).map((p: any) => (p.type === "text" ? p.text : "")).join("");
  if (message.role === "user") {
    return (
      <div className="flex justify-end gap-3 animate-fade-in">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {text}
        </div>
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
          <User className="h-3.5 w-3.5" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
        <Stethoscope className="h-3.5 w-3.5" />
      </div>
      <div className="prose prose-sm max-w-none flex-1 text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary">
        <ReactMarkdown>{text || "…"}</ReactMarkdown>
      </div>
    </div>
  );
}
