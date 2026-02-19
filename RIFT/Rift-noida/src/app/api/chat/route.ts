import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const modelChain = [
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-2.0-flash",
      "gemini-2.5-flash",
    ];

    let lastStatus = 500;
    let lastError: unknown = { error: "No model attempts were made." };

    for (const model of modelChain) {
      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=` +
        encodeURIComponent(apiKey);

      const geminiRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: message }] }],
        }),
      });

      const data = await geminiRes.json().catch(() => ({}));

      if (geminiRes.ok) {
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No reply.";
        return NextResponse.json({ reply, modelUsed: model });
      }

      lastStatus = geminiRes.status;
      lastError = data;
    }

    return NextResponse.json(
      {
        error: "Chat failed",
        detail: lastError,
        attemptedModels: modelChain,
      },
      { status: lastStatus }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: "Chat failed", detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}
