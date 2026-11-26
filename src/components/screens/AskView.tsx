"use client";

import React, { useState } from "react";
import type { AirBundle, FactItem, HouseholdProfile, Locale } from "@/engine/schema";
import { t } from "@/lib/i18n";
import type { MathDetail } from "../ui/MathDrawer";
import { Button, Card } from "../ui/Primitives";

interface ChatMsg {
  role: "user" | "assistant";
  text: string;
  verified?: boolean;
  offlineFallback?: boolean;
  facts?: Record<string, FactItem>;
}

function BubbleActions({
  m,
  locale,
  onShowMath,
  onSpeak,
}: {
  m: ChatMsg;
  locale: Locale;
  onShowMath: (d: MathDetail) => void;
  onSpeak: (s: string) => void;
}) {
  const hasFacts = Boolean(m.facts && Object.keys(m.facts).length > 0);
  const openMath = () =>
    onShowMath({
      title: t(locale, "today.showMath"),
      formula: "Engine FactSheet -> server slot substitution -> guard",
      inputs: Object.values(m.facts ?? {})
        .slice(0, 4)
        .map((f) => `${f.id}: ${f.display}`),
      source: "Deterministic pure-TS engine",
      confidence: "B",
    });
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="inline-flex min-h-[28px] items-center rounded-pill bg-brand-soft px-3 text-xs font-bold text-brand-ink">
        {m.verified ? t(locale, "ask.verified") : t(locale, "ask.offlineBadge")}
      </span>
      {hasFacts ? (
        <button
          type="button"
          onClick={openMath}
          className="min-h-[44px] px-2 text-sm font-bold text-brand-ink underline underline-offset-4"
        >
          {t(locale, "today.showMath")}
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => onSpeak(m.text)}
        className="min-h-[44px] px-2 text-xs font-semibold text-ink-2 underline"
      >
        {t(locale, "ask.readAloud")}
      </button>
    </div>
  );
}

function ChatMessageBubble({
  m,
  locale,
  onShowMath,
  onSpeak,
}: {
  m: ChatMsg;
  locale: Locale;
  onShowMath: (d: MathDetail) => void;
  onSpeak: (s: string) => void;
}) {
  const align =
    m.role === "user"
      ? "justify-self-end rounded-br-[6px] bg-brand text-on-brand"
      : "justify-self-start rounded-bl-[6px] border border-divider bg-surface text-ink";
  return (
    <div className={`max-w-[92%] rounded-lg p-3.5 text-md ${align}`}>
      <p>{m.text}</p>
      {m.role === "assistant" ? (
        <BubbleActions m={m} locale={locale} onShowMath={onShowMath} onSpeak={onSpeak} />
      ) : null}
    </div>
  );
}

function speakReply(txt: string, locale: Locale) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(txt);
  utter.lang = locale === "hi" ? "hi-IN" : "en-IN";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function AskComposer({
  input,
  loading,
  locale,
  onChange,
  onSubmit,
}: {
  input: string;
  loading: boolean;
  locale: Locale;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      className="mt-4 flex items-center gap-2 border-t border-divider pt-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <input
        aria-label={t(locale, "ask.placeholder")}
        placeholder={t(locale, "ask.placeholder")}
        value={input}
        maxLength={500}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[48px] flex-1 rounded-pill border border-line bg-bg px-4 text-ink"
      />
      <Button type="submit" variant="primary" disabled={loading || !input.trim()}>
        {t(locale, "ask.send")}
      </Button>
    </form>
  );
}

async function postChatMessage(body: Record<string, unknown>, locale: Locale): Promise<ChatMsg> {
  try {
    const data = await (
      await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })
    ).json();
    return {
      role: "assistant",
      text: data.reply ?? t(locale, "ask.offlineBadge"),
      verified: Boolean(data.verifiedByEngine),
      offlineFallback: Boolean(data.offlineFallback),
      facts: data.facts ?? {},
    };
  } catch {
    return { role: "assistant", text: t(locale, "ask.offlineBadge"), offlineFallback: true };
  }
}

function SuggestionChips({ locale, onPick }: { locale: Locale; onPick: (msg: string) => void }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {["ask.sug1", "ask.sug2", "ask.sug3"].map((k) => (
        <Button key={k} onClick={() => onPick(t(locale, k))}>
          {t(locale, k)}
        </Button>
      ))}
    </div>
  );
}

interface AskViewProps {
  profile: HouseholdProfile;
  air: AirBundle;
  focusMemberId: string;
  onShowMath: (detail: MathDetail) => void;
}

export function AskView({ profile, air, focusMemberId, onShowMath }: AskViewProps) {
  const locale = profile.locale;
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text: string) => {
    const clean = text.trim();
    if (!clean || loading) return;
    const next = [...messages, { role: "user" as const, text: clean }];
    setMessages(next);
    setInput("");
    setLoading(true);
    const history = messages.slice(-6).map((m) => ({ role: m.role, text: m.text }));
    const body = { message: clean, locale, profile, air, focusMemberId, history };
    setMessages([...next, await postChatMessage(body, locale)]);
    setLoading(false);
  };

  return (
    <div className="grid max-w-2xl gap-4">
      <Card>
        <h1 className="text-lg font-bold text-ink">{t(locale, "nav.ask")}</h1>
        <p className="text-sm text-ink-2">{t(locale, "ask.subtitle")}</p>
        <div className="mt-4 grid gap-3" aria-live="polite">
          {messages.map((m, idx) => (
            <ChatMessageBubble
              key={idx}
              m={m}
              locale={locale}
              onShowMath={onShowMath}
              onSpeak={(s) => speakReply(s, locale)}
            />
          ))}
        </div>
        <SuggestionChips locale={locale} onPick={sendMessage} />
        <AskComposer
          input={input}
          loading={loading}
          locale={locale}
          onChange={setInput}
          onSubmit={() => sendMessage(input)}
        />
        <p className="mt-2 text-xs text-ink-3">{t(locale, "ask.trust")}</p>
      </Card>
    </div>
  );
}
