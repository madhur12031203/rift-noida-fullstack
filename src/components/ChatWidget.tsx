"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! I am Ryzen Guide. Tell me your city and what you want: tourist spots, food, or a full day plan.",
    },
  ]);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const json = await res.json();
      if (!res.ok) {
        const detailMessage =
          json?.detail?.error?.message || json?.detail?.message || json?.error || "Something went wrong";
        setMessages((m) => [
          ...m,
          { role: "assistant", content: `Error: ${detailMessage}` },
        ]);
        return;
      }

      setMessages((m) => [...m, { role: "assistant", content: json.reply ?? "No reply." }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Network error." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-emerald-600 px-5 py-3 font-semibold text-white shadow-lg hover:bg-emerald-700"
      >
        {open ? "Close" : "Chat"}
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-[360px] max-w-[90vw] overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 shadow-2xl backdrop-blur">
          <div className="border-b border-white/10 px-4 py-3 text-white">
            <div className="font-bold">Ryzen Guide</div>
            <div className="text-xs text-white/60">Tourist places • Food • Local tips</div>
          </div>

          <div className="max-h-[380px] space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto max-w-[85%] bg-emerald-600 text-white"
                    : "mr-auto max-w-[85%] bg-white/10 text-white"
                }`}
              >
                {m.content}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-2 border-t border-white/10 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => (e.key === "Enter" ? send() : null)}
              placeholder="Ask: Best places in Jaipur?"
              className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading}
              className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
