'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Zap,
  Calendar,
  Utensils,
  Users,
  Wifi,
  MapPin,
  HelpCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
}

interface Suggestion {
  label: string;
  prompt: string;
  Icon: React.ElementType;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SUGGESTIONS: Suggestion[] = [
  { label: 'Event Schedule',    prompt: 'What is the event schedule for HackOverflow 4.0?',  Icon: Calendar  },
  { label: 'Meal Timings',      prompt: 'When are the meal timings during the hackathon?',    Icon: Utensils  },
  { label: 'My Team Details',   prompt: 'Tell me about my team and lab assignment.',           Icon: Users     },
  { label: 'WiFi & Resources',  prompt: 'How do I connect to the WiFi? Any other resources?', Icon: Wifi      },
  { label: 'Submission Rules',  prompt: 'What are the project submission guidelines?',         Icon: Zap       },
  { label: 'Venue & Location',  prompt: 'Where is the venue and how do I navigate the labs?', Icon: MapPin    },
];

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Hey! I'm **HackBot** — your AI assistant for HackOverflow 4.0. I can help you with schedules, meal timings, team details, lab assignments, submission guidelines, and anything else about the event.\n\nWhat can I help you with?",
  timestamp: new Date(),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Very minimal markdown → JSX: bold, line breaks */
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  return lines.map((line, li) => {
    // Bold (**text**)
    const parts = line.split(/\*\*(.*?)\*\*/g);
    const nodes = parts.map((p, i) =>
      i % 2 === 1 ? <strong key={i}>{p}</strong> : p
    );
    return (
      <span key={li}>
        {nodes}
        {li < lines.length - 1 && <br />}
      </span>
    );
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatbotPage() {
  const [messages,   setMessages]   = useState<Message[]>([WELCOME_MESSAGE]);
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [participantName, setParticipantName] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(true);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLTextAreaElement>(null);
  const listRef     = useRef<HTMLDivElement>(null);

  // Fetch participant name for personalisation
  useEffect(() => {
    async function init() {
      try {
        const authRes  = await fetch('/api/auth/verify');
        const authData = await authRes.json();
        if (!authData.participantId) return;
        const partRes  = await fetch(`/api/participant/${authData.participantId}`);
        const partData = await partRes.json();
        if (partData.participant?.name) {
          setParticipantName(partData.participant.name.split(' ')[0]);
        }
      } catch { /* silent */ }
    }
    init();
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  }, [input]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput('');
    setShowSuggestions(false);

    const userMsg: Message = {
      id: uid(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Build history for API (exclude welcome + system messages)
      const history = messages
        .filter(m => m.id !== 'welcome' && !m.isError)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history,
        }),
      });

      const data = await res.json();

      const botMsg: Message = {
        id: uid(),
        role: 'assistant',
        content: data.reply || data.message || 'Sorry, I could not process that request.',
        timestamp: new Date(),
        isError: !res.ok,
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const errMsg: Message = {
        id: uid(),
        role: 'assistant',
        content: 'Connection error. Please check your network and try again.',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [loading, messages]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function clearChat() {
    setMessages([WELCOME_MESSAGE]);
    setShowSuggestions(true);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:      #0F0F0F;
          --bg2:     #141414;
          --grad:    linear-gradient(90deg, #FCB216 0%, #E85D24 35%, #D91B57 70%, #63205F 100%);
          --orange:  #E85D24;
          --gold:    #FCB216;
          --pink:    #D91B57;
          --purple:  #63205F;
          --text:    #FFFFFF;
          --muted:   rgba(255,255,255,0.50);
          --glass:   rgba(255,255,255,0.04);
          --glass-h: rgba(231,88,41,0.07);
          --border:  rgba(255,255,255,0.09);
          --border-h:rgba(231,88,41,0.35);
          --r: 18px; --pill: 50px;
          --chat-max: 860px;
          --input-h: auto;
        }

        html, body {
          background: var(--bg);
          color: var(--text);
          font-family: 'Poppins', sans-serif;
          -webkit-font-smoothing: antialiased;
          overflow: hidden; /* prevent double scrollbar */
          height: 100%;
        }

        /* ── Page Shell — full height, flex column ── */
        .chat-root {
          height: 100dvh;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          background: var(--bg);
        }

        /* ── Orbs ── */
        .orb { position: fixed; border-radius: 50%; pointer-events: none; z-index: 0; animation: orbPulse 6s ease-in-out infinite alternate; }
        .orb-tl { width: clamp(200px,40vw,480px); height: clamp(200px,40vw,480px); top: -10%; right: -8%; background: radial-gradient(circle, #FCB216 0%, transparent 70%); opacity: 0.055; }
        .orb-br { width: clamp(180px,35vw,420px); height: clamp(180px,35vw,420px); bottom: -10%; left: -8%; background: radial-gradient(circle, #D91B57 0%, transparent 70%); opacity: 0.065; animation-delay: -3s; }
        @keyframes orbPulse { from { opacity: 0.04; transform: scale(1); } to { opacity: 0.10; transform: scale(1.08); } }

        /* ── Top bar ── */
        .topbar {
          flex-shrink: 0;
          padding: clamp(0.75rem,2.5vw,1.1rem) clamp(1rem,4vw,2rem);
          border-bottom: 1px solid var(--border);
          background: rgba(15,15,15,0.85);
          backdrop-filter: blur(16px);
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .topbar-left { display: flex; align-items: center; gap: 0.85rem; }

        /* Bot avatar */
        .bot-avatar {
          width: clamp(36px,6vw,44px);
          height: clamp(36px,6vw,44px);
          border-radius: 12px;
          background: linear-gradient(135deg, #E85D24 0%, #63205F 100%);
          display: flex; align-items: center; justify-content: center;
          position: relative; flex-shrink: 0;
        }
        .bot-online {
          position: absolute; bottom: -2px; right: -2px;
          width: 10px; height: 10px; border-radius: 50%;
          background: #4ade80;
          border: 2px solid var(--bg);
          animation: blink 2.5s ease-in-out infinite;
        }
        @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0.3;} }

        .topbar-info {}
        .topbar-name { font-size: clamp(0.85rem,2.5vw,1rem); font-weight: 700; line-height: 1.2; }
        .topbar-status { font-size: 0.62rem; color: #4ade80; font-weight: 600; display: flex; align-items: center; gap: 0.3rem; }
        .status-dot { width: 5px; height: 5px; border-radius: 50%; background: #4ade80; animation: blink 2s ease-in-out infinite; }

        .grad-text { background: var(--grad); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }

        .topbar-right { display: flex; align-items: center; gap: 0.5rem; }

        .icon-btn {
          width: 36px; height: 36px; border-radius: 10px;
          background: var(--glass); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          color: var(--muted); cursor: pointer;
          transition: background 0.2s, border-color 0.2s, color 0.2s;
        }
        .icon-btn:hover { background: var(--glass-h); border-color: var(--border-h); color: var(--gold); }

        .badge-sm {
          display: inline-flex; align-items: center; gap: 0.3rem;
          padding: 0.25rem 0.7rem; border-radius: var(--pill);
          font-size: 0.58rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 1.2px;
          background: rgba(231,88,41,0.12); border: 1px solid rgba(231,88,41,0.3);
          color: var(--gold);
        }
        .badge-sm-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--gold); animation: blink 2s ease-in-out infinite; }

        /* ── Messages area ── */
        .messages-area {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: clamp(1rem,3vw,1.5rem) clamp(1rem,4vw,2rem);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          z-index: 1;
          /* Scrollbar */
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.08) transparent;
        }
        .messages-area::-webkit-scrollbar { width: 4px; }
        .messages-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .messages-area::-webkit-scrollbar-track { background: transparent; }

        .messages-inner {
          width: 100%;
          max-width: var(--chat-max);
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        /* ── Animations ── */
        @keyframes msgIn { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
        .msg-anim { animation: msgIn 0.3s ease both; }

        /* ── Message rows ── */
        .msg-row {
          display: flex;
          gap: 0.65rem;
          align-items: flex-end;
          max-width: 85%;
        }
        .msg-row.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .msg-row.assistant { align-self: flex-start; }

        @media (max-width: 540px) { .msg-row { max-width: 92%; } }

        /* ── Avatar ── */
        .msg-avatar {
          width: 30px; height: 30px;
          border-radius: 9px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 2px;
        }
        .msg-avatar.bot-av  { background: linear-gradient(135deg, #E85D24 0%, #63205F 100%); }
        .msg-avatar.user-av { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); }

        /* ── Bubble ── */
        .bubble {
          padding: clamp(0.7rem,2.5vw,0.9rem) clamp(0.9rem,3vw,1.1rem);
          border-radius: 18px;
          font-size: clamp(0.78rem,2vw,0.88rem);
          line-height: 1.65;
          word-break: break-word;
          position: relative;
        }
        /* Bot bubble */
        .bubble.bot {
          background: var(--glass);
          border: 1px solid var(--border);
          border-bottom-left-radius: 6px;
          backdrop-filter: blur(10px);
          color: var(--text);
        }
        .bubble.bot::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 60%);
          border-radius: inherit; pointer-events: none;
        }
        /* Error bubble */
        .bubble.bot.error {
          background: rgba(217,27,87,0.07);
          border-color: rgba(217,27,87,0.25);
        }

        /* User bubble */
        .bubble.user {
          background: linear-gradient(135deg, #E85D24 0%, #D91B57 100%);
          border-bottom-right-radius: 6px;
          color: #fff;
          box-shadow: 0 4px 20px rgba(232,93,36,0.25);
        }

        /* ── Timestamp ── */
        .msg-time {
          font-size: 0.55rem;
          color: rgba(255,255,255,0.2);
          margin-top: 0.3rem;
          display: block;
        }
        .msg-row.user  .msg-time { text-align: right; }
        .msg-row.assistant .msg-time { text-align: left; padding-left: 2.4rem; }

        /* ── Typing indicator ── */
        .typing-row {
          display: flex; gap: 0.65rem; align-items: flex-end;
          align-self: flex-start;
          animation: msgIn 0.3s ease both;
        }
        .typing-bubble {
          padding: 0.75rem 1rem;
          background: var(--glass);
          border: 1px solid var(--border);
          border-radius: 18px; border-bottom-left-radius: 6px;
          display: flex; align-items: center; gap: 0.3rem;
          backdrop-filter: blur(10px);
        }
        .typing-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--muted);
          animation: typingBounce 1.2s ease-in-out infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingBounce {
          0%,60%,100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }

        /* ── Suggestions ── */
        .suggestions-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 0.25rem;
          padding-left: 2.4rem; /* align with bot bubble */
        }
        .suggestions-label {
          font-size: 0.6rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 1.5px;
          color: rgba(255,255,255,0.25);
        }
        .suggestions-grid {
          display: flex; flex-wrap: wrap; gap: 0.45rem;
        }
        .suggestion-chip {
          display: inline-flex; align-items: center; gap: 0.35rem;
          padding: 0.4rem 0.85rem;
          border-radius: var(--pill);
          border: 1px solid var(--border);
          background: var(--glass);
          font-size: clamp(0.62rem,1.8vw,0.7rem); font-weight: 600;
          color: var(--muted); cursor: pointer;
          transition: background 0.22s, border-color 0.22s, color 0.22s, transform 0.22s;
          font-family: 'Poppins', sans-serif;
          backdrop-filter: blur(8px);
          animation: msgIn 0.4s ease both;
        }
        .suggestion-chip:nth-child(2) { animation-delay: 0.05s; }
        .suggestion-chip:nth-child(3) { animation-delay: 0.10s; }
        .suggestion-chip:nth-child(4) { animation-delay: 0.15s; }
        .suggestion-chip:nth-child(5) { animation-delay: 0.20s; }
        .suggestion-chip:nth-child(6) { animation-delay: 0.25s; }
        .suggestion-chip:hover {
          background: rgba(231,88,41,0.1);
          border-color: rgba(231,88,41,0.4);
          color: var(--gold);
          transform: translateY(-1px);
        }
        .suggestion-chip svg { flex-shrink: 0; opacity: 0.7; }

        /* ── Input area ── */
        .input-area {
          flex-shrink: 0;
          padding: clamp(0.75rem,2vw,1rem) clamp(1rem,4vw,2rem);
          border-top: 1px solid var(--border);
          background: rgba(15,15,15,0.9);
          backdrop-filter: blur(20px);
          z-index: 10;
        }

        .input-inner {
          width: 100%;
          max-width: var(--chat-max);
          margin: 0 auto;
          display: flex;
          align-items: flex-end;
          gap: 0.65rem;
        }

        .input-box {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 0.75rem 1rem;
          display: flex; align-items: flex-end; gap: 0.5rem;
          transition: border-color 0.25s, background 0.25s;
        }
        .input-box:focus-within {
          border-color: rgba(231,88,41,0.45);
          background: rgba(231,88,41,0.04);
          box-shadow: 0 0 0 3px rgba(231,88,41,0.06);
        }

        .chat-textarea {
          flex: 1;
          background: none; border: none; outline: none;
          color: var(--text);
          font-family: 'Poppins', sans-serif;
          font-size: clamp(0.82rem,2vw,0.9rem);
          line-height: 1.55;
          resize: none;
          min-height: 24px;
          max-height: 140px;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .chat-textarea::-webkit-scrollbar { display: none; }
        .chat-textarea::placeholder { color: rgba(255,255,255,0.22); }

        .send-btn {
          width: 40px; height: 40px; border-radius: 12px;
          background: var(--grad);
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 14px rgba(232,93,36,0.3);
        }
        .send-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(232,93,36,0.4); }
        .send-btn:active:not(:disabled) { transform: scale(0.95); }
        .send-btn:disabled { opacity: 0.35; cursor: not-allowed; box-shadow: none; }

        .input-hint {
          text-align: center;
          font-size: 0.58rem;
          color: rgba(255,255,255,0.18);
          margin-top: 0.5rem;
          letter-spacing: 0.3px;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.9s linear infinite; }
      `}</style>

      <div className="chat-root">
        <div className="orb orb-tl" />
        <div className="orb orb-br" />

        {/* ── Top Bar ── */}
        <div className="topbar">
          <div className="topbar-left">
            <div className="bot-avatar">
              <Bot size={20} color="#fff" />
              <span className="bot-online" />
            </div>
            <div className="topbar-info">
              <div className="topbar-name">
                <span className="grad-text">HackBot</span>
                {participantName && (
                  <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '0.8rem' }}>
                    {' '}· Hey {participantName}!
                  </span>
                )}
              </div>
              <div className="topbar-status">
                <span className="status-dot" />
                Online · AI Assistant
              </div>
            </div>
          </div>

          <div className="topbar-right">
            <span className="badge-sm">
              <span className="badge-sm-dot" />
              HackOverflow 4.0
            </span>
            <button className="icon-btn" onClick={clearChat} title="Clear chat">
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="messages-area" ref={listRef}>
          <div className="messages-inner">

            {messages.map((msg, idx) => {
              const isBot  = msg.role === 'assistant';
              const isLast = idx === messages.length - 1;

              return (
                <div key={msg.id}>
                  <div className={`msg-row ${msg.role} msg-anim`} style={{ animationDelay: '0s' }}>
                    {/* Avatar */}
                    <div className={`msg-avatar ${isBot ? 'bot-av' : 'user-av'}`}>
                      {isBot
                        ? <Bot size={15} color="#fff" />
                        : <User size={14} color="rgba(255,255,255,0.6)" />}
                    </div>

                    {/* Bubble */}
                    <div className={`bubble ${isBot ? 'bot' : 'user'}${msg.isError ? ' error' : ''}`}>
                      {isBot
                        ? <>{renderMarkdown(msg.content)}</>
                        : msg.content}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className={`msg-row ${msg.role}`} style={{ maxWidth: '85%', alignSelf: isBot ? 'flex-start' : 'flex-end' }}>
                    <span className="msg-time">{formatTime(msg.timestamp)}</span>
                  </div>

                  {/* Suggestions after welcome message */}
                  {msg.id === 'welcome' && showSuggestions && (
                    <div className="suggestions-wrap msg-anim" style={{ animationDelay: '0.2s' }}>
                      <span className="suggestions-label">Quick Questions</span>
                      <div className="suggestions-grid">
                        {SUGGESTIONS.map((s, si) => {
                          const SIcon = s.Icon;
                          return (
                            <button
                              key={si}
                              className="suggestion-chip"
                              onClick={() => sendMessage(s.prompt)}
                              disabled={loading}
                            >
                              <SIcon size={11} />
                              {s.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing indicator */}
            {loading && (
              <div className="typing-row">
                <div className="msg-avatar bot-av">
                  <Bot size={15} color="#fff" />
                </div>
                <div className="typing-bubble">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* ── Input Area ── */}
        <div className="input-area">
          <div className="input-inner">
            <div className="input-box">
              <textarea
                ref={inputRef}
                className="chat-textarea"
                placeholder="Ask anything about HackOverflow 4.0…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={loading}
              />
            </div>
            <button
              className="send-btn"
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              title="Send message"
            >
              {loading
                ? <Loader2 size={16} color="#fff" className="spin" />
                : <Send size={16} color="#fff" />}
            </button>
          </div>
          <p className="input-hint">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </>
  );
}