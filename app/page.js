"use client";

import { useEffect, useState, useMemo } from "react";

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { day: "2-digit", month: "short" }) +
    " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Pulse({ count }) {
  const bars = Array.from({ length: 24 }, (_, i) => {
    const h = 4 + Math.round(Math.abs(Math.sin(i * 1.3 + count)) * 20);
    return h;
  });
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 28 }}>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: h,
            background: i % 5 === 0 ? "var(--signal)" : "var(--ink-line)",
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState("messages");
  const [threads, setThreads] = useState([]);
  const [calls, setCalls] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [compose, setCompose] = useState("");
  const [channel, setChannel] = useState("sms");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [showAddNumber, setShowAddNumber] = useState(false);
  const [newNumber, setNewNumber] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [mRes, cRes] = await Promise.all([
        fetch("/api/messages").then((r) => r.json()),
        fetch("/api/calls").then((r) => r.json()),
      ]);
      if (mRes.error) throw new Error(mRes.error);
      if (cRes.error) throw new Error(cRes.error);
      setThreads(mRes.threads || []);
      setCalls(cRes.calls || []);
      if (mRes.threads?.length && !selected) setSelected(mRes.threads[0].number);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!compose.trim() || !selected) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: selected, body: compose.trim(), channel }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCompose("");
      await load();
    } catch (e) {
      setSendError(e.message);
    } finally {
      setSending(false);
    }
  }

  function addNumber() {
    const num = newNumber.trim();
    if (!num) return;
    if (!threads.find((t) => t.number === num)) {
      setThreads((prev) => [...prev, { number: num, messages: [] }]);
    }
    setSelected(num);
    setNewNumber("");
    setShowAddNumber(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeThread = useMemo(
    () => threads.find((t) => t.number === selected),
    [threads, selected]
  );

  const totalMessages = threads.reduce((sum, t) => sum + t.messages.length, 0);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          padding: "20px 28px",
          borderBottom: "1px solid var(--ink-line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: "0.15em",
              color: "var(--signal)",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Signal · Personal Line
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
            {totalMessages} messages · {calls.length} calls
          </h1>
        </div>
        <Pulse count={totalMessages} />
      </header>

      <nav
        style={{
          display: "flex",
          gap: 4,
          padding: "12px 28px 0",
          borderBottom: "1px solid var(--ink-line)",
        }}
      >
        {["messages", "calls"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: "none",
              border: "none",
              color: tab === t ? "var(--paper)" : "var(--paper-dim)",
              padding: "8px 16px",
              fontSize: 14,
              fontWeight: 600,
              borderBottom: tab === t ? "2px solid var(--signal)" : "2px solid transparent",
              marginBottom: -1,
              textTransform: "capitalize",
            }}
          >
            {t}
          </button>
        ))}
        <button
          onClick={load}
          style={{
            marginLeft: "auto",
            background: "none",
            border: "1px solid var(--ink-line)",
            color: "var(--paper-dim)",
            borderRadius: 6,
            padding: "6px 12px",
            fontSize: 12,
            fontFamily: "var(--mono)",
            height: "fit-content",
          }}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </nav>

      {error && (
        <div style={{ margin: 24, padding: 16, background: "#2a1618", border: "1px solid var(--danger)", borderRadius: 8, color: "var(--danger)", fontFamily: "var(--mono)", fontSize: 13 }}>
          Couldn't reach Twilio: {error}. Check your env vars in Vercel.
        </div>
      )}

      {!error && tab === "messages" && (
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          <div
            style={{
              width: 320,
              borderRight: "1px solid var(--ink-line)",
              overflowY: "auto",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--ink-line)" }}>
              {showAddNumber ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="text"
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addNumber(); if (e.key === "Escape") { setShowAddNumber(false); setNewNumber(""); } }}
                    placeholder="+91xxxxxxxxxx"
                    autoFocus
                    style={{
                      flex: 1,
                      background: "var(--ink-raised)",
                      border: "1px solid var(--ink-line)",
                      borderRadius: 6,
                      padding: "6px 10px",
                      color: "var(--paper)",
                      fontSize: 12,
                      fontFamily: "var(--mono)",
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={addNumber}
                    style={{
                      background: "var(--signal)",
                      color: "var(--ink)",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: "var(--mono)",
                      cursor: "pointer",
                    }}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setShowAddNumber(false); setNewNumber(""); }}
                    style={{
                      background: "none",
                      border: "1px solid var(--ink-line)",
                      color: "var(--paper-dim)",
                      borderRadius: 6,
                      padding: "6px 8px",
                      fontSize: 11,
                      fontFamily: "var(--mono)",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddNumber(true)}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "1px dashed var(--ink-line)",
                    color: "var(--paper-dim)",
                    borderRadius: 6,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontFamily: "var(--mono)",
                    cursor: "pointer",
                  }}
                >
                  + New Number
                </button>
              )}
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {threads.length === 0 && !loading && (
                <div style={{ padding: 24, color: "var(--paper-dim)", fontSize: 13 }}>
                  No messages yet. Click "+ New Number" to start a conversation.
                </div>
              )}
              {threads.map((t) => {
                const last = t.messages[t.messages.length - 1];
                return (
                  <button
                    key={t.number}
                    onClick={() => setSelected(t.number)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      background: selected === t.number ? "var(--ink-raised)" : "transparent",
                      border: "none",
                      borderBottom: "1px solid var(--ink-line)",
                      padding: "14px 20px",
                      color: "var(--paper)",
                    }}
                  >
                    <div style={{ fontFamily: "var(--mono)", fontSize: 13, marginBottom: 4 }}>
                      {t.number}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--paper-dim)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {last?.direction?.startsWith("outbound") ? "You: " : ""}
                      {last?.body || "No messages yet"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--paper-dim)", marginTop: 4, fontFamily: "var(--mono)" }}>
                      {last ? formatTime(last?.dateSent) : ""}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
              {selected ? (
                <>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--paper-dim)", marginBottom: 16 }}>
                    {selected}
                  </div>
                  {activeThread?.messages.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {activeThread.messages.map((m) => {
                        const out = m.direction.startsWith("outbound");
                        return (
                          <div
                            key={m.sid}
                            style={{
                              alignSelf: out ? "flex-end" : "flex-start",
                              maxWidth: "70%",
                              background: out ? "var(--signal-dim)" : "var(--ink-raised)",
                              borderRadius: 10,
                              padding: "10px 14px",
                            }}
                          >
                            <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{m.body}</div>
                            <div style={{ fontSize: 10, color: "var(--paper-dim)", marginTop: 6, fontFamily: "var(--mono)" }}>
                              {formatTime(m.dateSent)} · {m.status}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ color: "var(--paper-dim)", fontSize: 13 }}>
                      No messages yet. Send one below to start the conversation.
                    </div>
                  )}
                </>
              ) : (
                <div style={{ color: "var(--paper-dim)" }}>Select a conversation or add a new number</div>
              )}
            </div>

            {selected && (
              <div style={{ borderTop: "1px solid var(--ink-line)", padding: "12px 16px" }}>
                {sendError && (
                  <div style={{ marginBottom: 8, fontSize: 12, color: "var(--danger)", fontFamily: "var(--mono)" }}>
                    {sendError}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button
                      onClick={() => setChannel("sms")}
                      style={{
                        background: channel === "sms" ? "var(--signal-dim)" : "none",
                        border: "1px solid var(--ink-line)",
                        color: channel === "sms" ? "var(--paper)" : "var(--paper-dim)",
                        borderRadius: 6,
                        padding: "6px 10px",
                        fontSize: 11,
                        fontFamily: "var(--mono)",
                        fontWeight: channel === "sms" ? 600 : 400,
                      }}
                    >
                      SMS
                    </button>
                    <button
                      onClick={() => setChannel("whatsapp")}
                      style={{
                        background: channel === "whatsapp" ? "var(--signal-dim)" : "none",
                        border: "1px solid var(--ink-line)",
                        color: channel === "whatsapp" ? "var(--paper)" : "var(--paper-dim)",
                        borderRadius: 6,
                        padding: "6px 10px",
                        fontSize: 11,
                        fontFamily: "var(--mono)",
                        fontWeight: channel === "whatsapp" ? 600 : 400,
                      }}
                    >
                      WhatsApp
                    </button>
                  </div>
                  <input
                    type="text"
                    value={compose}
                    onChange={(e) => setCompose(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Type a message..."
                    disabled={sending}
                    style={{
                      flex: 1,
                      background: "var(--ink-raised)",
                      border: "1px solid var(--ink-line)",
                      borderRadius: 8,
                      padding: "10px 14px",
                      color: "var(--paper)",
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !compose.trim()}
                    style={{
                      background: "var(--signal)",
                      color: "var(--ink)",
                      border: "none",
                      borderRadius: 8,
                      padding: "10px 18px",
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "var(--mono)",
                      cursor: sending || !compose.trim() ? "not-allowed" : "pointer",
                      opacity: sending || !compose.trim() ? 0.5 : 1,
                      flexShrink: 0,
                    }}
                  >
                    {sending ? "Sending…" : "Send"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!error && tab === "calls" && (
        <div style={{ padding: 24, overflowY: "auto" }}>
          {calls.length === 0 && !loading && (
            <div style={{ color: "var(--paper-dim)", fontSize: 13 }}>
              No calls yet. Incoming calls to your Twilio number will show up here.
            </div>
          )}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--paper-dim)", fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase" }}>
                <th style={{ padding: "8px 12px", borderBottom: "1px solid var(--ink-line)" }}>From</th>
                <th style={{ padding: "8px 12px", borderBottom: "1px solid var(--ink-line)" }}>To</th>
                <th style={{ padding: "8px 12px", borderBottom: "1px solid var(--ink-line)" }}>Direction</th>
                <th style={{ padding: "8px 12px", borderBottom: "1px solid var(--ink-line)" }}>Status</th>
                <th style={{ padding: "8px 12px", borderBottom: "1px solid var(--ink-line)" }}>Duration</th>
                <th style={{ padding: "8px 12px", borderBottom: "1px solid var(--ink-line)" }}>When</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c) => (
                <tr key={c.sid}>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--ink-line)", fontFamily: "var(--mono)" }}>{c.from}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--ink-line)", fontFamily: "var(--mono)" }}>{c.to}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--ink-line)" }}>{c.direction}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--ink-line)" }}>
                    <span style={{ color: c.status === "completed" ? "var(--ok)" : c.status === "failed" || c.status === "no-answer" ? "var(--danger)" : "var(--paper-dim)" }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--ink-line)", fontFamily: "var(--mono)" }}>{c.duration}s</td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--ink-line)", fontFamily: "var(--mono)" }}>{formatTime(c.startTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
