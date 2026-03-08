'use client';

import { useEffect, useState } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  Loader2,
  Utensils,
  Trophy,
  Zap,
  BookOpen,
  Flag,
  Coffee,
  Star,
  Circle,
  ChevronRight,
  AlarmClock,
} from 'lucide-react';
import type { ScheduleEvent, ScheduleEventCategory } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string | Date) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(start: string | Date, end?: string | Date) {
  if (!end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function isOngoing(event: ScheduleEvent) {
  const now = Date.now();
  const s = new Date(event.startTime).getTime();
  const e = event.endTime ? new Date(event.endTime).getTime() : s + 1;
  return now >= s && now <= e;
}

function isUpcoming(event: ScheduleEvent) {
  return Date.now() < new Date(event.startTime).getTime();
}

// ─── Category config ──────────────────────────────────────────────────────────

type CatConfig = { label: string; color: string; bg: string; border: string; Icon: React.ElementType };

const CATEGORY_CONFIG: Record<ScheduleEventCategory, CatConfig> = {
  opening:    { label: 'Opening',    color: '#FCB216', bg: 'rgba(252,178,22,0.12)',  border: 'rgba(252,178,22,0.35)',  Icon: Flag    },
  closing:    { label: 'Closing',    color: '#D91B57', bg: 'rgba(217,27,87,0.12)',   border: 'rgba(217,27,87,0.35)',   Icon: Trophy  },
  meal:       { label: 'Meal',       color: '#4ade80', bg: 'rgba(74,222,128,0.10)',  border: 'rgba(74,222,128,0.3)',   Icon: Utensils},
  workshop:   { label: 'Workshop',   color: '#38bdf8', bg: 'rgba(56,189,248,0.10)',  border: 'rgba(56,189,248,0.3)',   Icon: BookOpen},
  judging:    { label: 'Judging',    color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.3)',  Icon: Star    },
  submission: { label: 'Submission', color: '#E85D24', bg: 'rgba(232,93,36,0.12)',   border: 'rgba(232,93,36,0.35)',   Icon: Zap     },
  break:      { label: 'Break',      color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)',  Icon: Coffee  },
  other:      { label: 'Event',      color: '#ffffff', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.12)', Icon: Circle  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const [events, setEvents]     = useState<ScheduleEvent[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeDay, setActiveDay] = useState<1 | 2 | 3>(1);
  const [now, setNow]           = useState(Date.now());

  // Tick every minute so "ongoing" state stays live
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        // Portal config holds the schedule
        const res  = await fetch('/api/portal/config');
        const data = await res.json();

        if (!alive) return;
        if (data.config?.schedule) {
          const sorted = [...data.config.schedule].sort(
            (a: ScheduleEvent, b: ScheduleEvent) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          );
          setEvents(sorted);

          // Auto-select the day that has an ongoing event, or default to 1
          const ongoingEvent = sorted.find((e: ScheduleEvent) => isOngoing(e));
          if (ongoingEvent) setActiveDay(ongoingEvent.day as 1 | 2 | 3);
        }
      } catch (err) {
        console.error('[SchedulePage] fetch error:', err);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => { alive = false; };
  }, []);

  const days: (1 | 2 | 3)[] = [1, 2, 3];

  const dayLabels: Record<1 | 2 | 3, string> = {
    1: 'Day 1',
    2: 'Day 2',
    3: 'Day 3',
  };

  // Events for selected day, sorted by time
  const dayEvents = events.filter(e => e.day === activeDay);

  // Pinned events first
  const sorted = [
    ...dayEvents.filter(e => e.isPinned),
    ...dayEvents.filter(e => !e.isPinned),
  ];

  // Count per day for the tab badges
  function dayCount(d: number) { return events.filter(e => e.day === d).length; }
  function hasOngoing(d: number) { return events.filter(e => e.day === d).some(isOngoing); }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:      #0F0F0F;
          --grad:    linear-gradient(90deg, #FCB216 0%, #E85D24 35%, #D91B57 70%, #63205F 100%);
          --orange:  #E85D24;
          --gold:    #FCB216;
          --pink:    #D91B57;
          --purple:  #63205F;
          --text:    #FFFFFF;
          --muted:   rgba(255,255,255,0.55);
          --glass:   rgba(255,255,255,0.04);
          --glass-h: rgba(231,88,41,0.07);
          --border:  rgba(255,255,255,0.09);
          --border-h:rgba(231,88,41,0.35);
          --r: 18px; --pill: 50px;
        }

        html, body { background: var(--bg); color: var(--text); font-family: 'Poppins', sans-serif; -webkit-font-smoothing: antialiased; overflow-x: hidden; }

        .root { min-height: 100dvh; padding: clamp(1rem,4vw,3rem) clamp(1rem,4vw,2rem); position: relative; overflow: hidden; }

        .page { width: 100%; max-width: 860px; margin: 0 auto; position: relative; z-index: 1; display: flex; flex-direction: column; gap: 1.5rem; }

        /* Orbs */
        .orb { position: fixed; border-radius: 50%; pointer-events: none; z-index: 0; animation: orbPulse 6s ease-in-out infinite alternate; }
        .orb-tl { width: clamp(200px,40vw,500px); height: clamp(200px,40vw,500px); top: -12%; right: -8%; background: radial-gradient(circle, #FCB216 0%, transparent 70%); opacity: 0.06; }
        .orb-bl { width: clamp(180px,35vw,440px); height: clamp(180px,35vw,440px); bottom: -12%; left: -8%; background: radial-gradient(circle, #63205F 0%, transparent 70%); opacity: 0.07; animation-delay: -3s; }
        @keyframes orbPulse { from { opacity: 0.05; transform: scale(1); } to { opacity: 0.11; transform: scale(1.08); } }

        /* Animations */
        @keyframes fadeUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        .au { animation: fadeUp 0.5s ease both; }
        .d1 { animation-delay: 0.04s; } .d2 { animation-delay: 0.12s; } .d3 { animation-delay: 0.20s; }

        /* Loading */
        .loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; min-height: 240px; }
        .loading-txt { font-size: 0.68rem; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }

        /* Badge */
        .badge { display: inline-flex; align-items: center; gap: 0.4rem; width: fit-content; padding: 0.35rem 1rem; border-radius: var(--pill); font-size: clamp(0.58rem,1.4vw,0.68rem); font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; background: rgba(231,88,41,0.12); border: 1px solid rgba(231,88,41,0.35); color: var(--gold); }
        .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); animation: blink 2s ease-in-out infinite; }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.2; } }

        /* Header */
        .title { font-size: clamp(1.8rem,6vw,3rem); font-weight: 800; line-height: 1.15; letter-spacing: -0.5px; }
        .grad-text { background: var(--grad); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .subtitle { font-size: clamp(0.72rem,2vw,0.82rem); color: var(--muted); display: flex; align-items: center; gap: 0.4rem; margin-top: 0.3rem; }

        /* Card */
        .card { background: var(--glass); border: 1px solid var(--border); border-radius: var(--r); padding: clamp(1rem,3vw,1.5rem); position: relative; overflow: hidden; width: 100%; backdrop-filter: blur(10px); }
        .card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.025) 0%, transparent 60%); pointer-events: none; }
        .lbl { font-size: 0.62rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 1.8px; display: flex; align-items: center; gap: 0.4rem; margin-bottom: 1rem; }

        /* ── Day Tabs ── */
        .day-tabs { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .day-tab {
          position: relative;
          padding: 0.5rem 1.2rem;
          border-radius: var(--pill);
          border: 1px solid var(--border);
          background: var(--glass);
          color: var(--muted);
          font-size: 0.72rem; font-weight: 700;
          cursor: pointer;
          transition: 0.25s;
          display: flex; align-items: center; gap: 0.4rem;
          font-family: 'Poppins', sans-serif;
        }
        .day-tab:hover { background: var(--glass-h); border-color: var(--border-h); color: var(--text); }
        .day-tab.active {
          background: rgba(231,88,41,0.12);
          border-color: rgba(231,88,41,0.45);
          color: var(--gold);
        }
        .tab-count {
          font-size: 0.58rem; font-weight: 800;
          background: rgba(255,255,255,0.08);
          padding: 0.1rem 0.4rem; border-radius: 6px;
          color: var(--muted);
        }
        .day-tab.active .tab-count { background: rgba(252,178,22,0.2); color: var(--gold); }
        /* Live indicator on tab */
        .tab-live { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; animation: blink 1.5s ease-in-out infinite; }

        /* ── Timeline ── */
        .timeline { display: flex; flex-direction: column; gap: 0; position: relative; }

        /* The vertical line */
        .timeline::before {
          content: '';
          position: absolute;
          left: 19px;
          top: 8px; bottom: 8px;
          width: 2px;
          background: linear-gradient(to bottom, rgba(252,178,22,0.4), rgba(99,32,95,0.2));
          border-radius: 2px;
          z-index: 0;
        }

        /* ── Event row ── */
        .event-row {
          display: flex;
          gap: 0.9rem;
          padding: 0.5rem 0;
          position: relative;
          z-index: 1;
          animation: fadeUp 0.4s ease both;
        }

        /* Node on the timeline */
        .event-node {
          width: 40px; height: 40px;
          border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          margin-top: 0.2rem;
          position: relative;
          z-index: 2;
          transition: transform 0.25s;
        }
        .event-row:hover .event-node { transform: scale(1.08); }

        /* Ongoing pulse ring */
        .ongoing-ring {
          position: absolute; inset: -4px;
          border-radius: 50%;
          border: 2px solid currentColor;
          animation: ringPulse 2s ease-in-out infinite;
          opacity: 0.5;
        }
        @keyframes ringPulse { 0%,100% { transform: scale(1); opacity:0.5; } 50% { transform: scale(1.15); opacity:0.2; } }

        /* Event content bubble */
        .event-body {
          flex: 1; min-width: 0;
          background: var(--glass);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 0.85rem 1rem;
          transition: background 0.25s, border-color 0.25s, transform 0.25s;
          cursor: default;
          margin-bottom: 0.5rem;
          backdrop-filter: blur(8px);
        }
        .event-body:hover { transform: translateX(3px); }
        .event-body.ongoing { border-color: rgba(74,222,128,0.3); background: rgba(74,222,128,0.04); }
        .event-body.pinned  { border-color: rgba(252,178,22,0.25); }

        .event-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; }
        .event-title { font-size: clamp(0.82rem,2.2vw,0.92rem); font-weight: 700; line-height: 1.3; }

        .cat-pill { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.18rem 0.55rem; border-radius: var(--pill); font-size: 0.56rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; white-space: nowrap; flex-shrink: 0; }

        .event-desc { font-size: 0.72rem; color: var(--muted); line-height: 1.5; margin-top: 0.35rem; }

        .event-meta { display: flex; align-items: center; gap: 0.8rem; margin-top: 0.5rem; flex-wrap: wrap; }
        .meta-item { display: flex; align-items: center; gap: 0.25rem; font-size: 0.62rem; color: var(--muted); }

        .ongoing-badge { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.58rem; font-weight: 800; color: #4ade80; text-transform: uppercase; letter-spacing: 0.8px; }
        .ongoing-dot { width: 5px; height: 5px; border-radius: 50%; background: #4ade80; animation: blink 1s ease-in-out infinite; }

        .pin-mark { display: inline-flex; align-items: center; gap: 0.2rem; font-size: 0.56rem; color: var(--gold); font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; }

        /* ── Empty state ── */
        .empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.6rem; min-height: 200px; color: var(--muted); text-align: center; font-size: 0.8rem; }

        /* ── Legend ── */
        .legend { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .legend-item { display: flex; align-items: center; gap: 0.3rem; font-size: 0.6rem; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
      `}</style>

      <div className="root">
        <div className="orb orb-tl" />
        <div className="orb orb-bl" />

        <div className="page">
          {loading ? (
            <div className="card loading-wrap au d1">
              <Loader2 size={26} className="spin" style={{ color: 'var(--orange)' }} />
              <span className="loading-txt">Loading Schedule</span>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="au d1" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span className="badge"><span className="badge-dot" />HackOverflow 4.0</span>
                <h1 className="title">Event <span className="grad-text">Schedule</span></h1>
                <p className="subtitle">
                  <Calendar size={13} />
                  <span>{events.length} events over 3 days</span>
                </p>
              </div>

              {/* Day tabs */}
              <div className="au d2" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div className="day-tabs">
                  {days.map(d => (
                    <button
                      key={d}
                      className={`day-tab${activeDay === d ? ' active' : ''}`}
                      onClick={() => setActiveDay(d)}
                    >
                      {hasOngoing(d) && <span className="tab-live" />}
                      {dayLabels[d]}
                      <span className="tab-count">{dayCount(d)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div className="card au d3" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
                <div className="lbl">
                  <Clock size={12} />
                  {dayLabels[activeDay]} Events
                </div>

                {sorted.length === 0 ? (
                  <div className="empty">
                    <Calendar size={32} style={{ opacity: 0.2 }} />
                    <span>No events scheduled for this day yet.</span>
                  </div>
                ) : (
                  <div className="timeline">
                    {sorted.map((event, idx) => {
                      const cat      = CATEGORY_CONFIG[event.category] ?? CATEGORY_CONFIG.other;
                      const CatIcon  = cat.Icon;
                      const ongoing  = isOngoing(event);
                      const upcoming = isUpcoming(event);
                      const dur      = formatDuration(event.startTime, event.endTime);

                      return (
                        <div
                          className="event-row"
                          key={event.eventId}
                          style={{ animationDelay: `${idx * 0.04}s` }}
                        >
                          {/* Timeline node */}
                          <div
                            className="event-node"
                            style={{ background: cat.bg, border: `2px solid ${cat.border}`, color: cat.color }}
                          >
                            <CatIcon size={16} />
                            {ongoing && <span className="ongoing-ring" style={{ color: cat.color }} />}
                          </div>

                          {/* Event body */}
                          <div className={`event-body${ongoing ? ' ongoing' : ''}${event.isPinned ? ' pinned' : ''}`}>
                            <div className="event-top">
                              <div className="event-title">{event.title}</div>
                              <span
                                className="cat-pill"
                                style={{ background: cat.bg, border: `1px solid ${cat.border}`, color: cat.color }}
                              >
                                <CatIcon size={8} />
                                {cat.label}
                              </span>
                            </div>

                            {event.description && (
                              <p className="event-desc">{event.description}</p>
                            )}

                            <div className="event-meta">
                              <span className="meta-item">
                                <Clock size={10} />
                                {formatTime(event.startTime)}
                                {event.endTime && ` — ${formatTime(event.endTime)}`}
                              </span>

                              {dur && (
                                <span className="meta-item">
                                  <AlarmClock size={10} />
                                  {dur}
                                </span>
                              )}

                              {event.location && (
                                <span className="meta-item">
                                  <MapPin size={10} />
                                  {event.location}
                                </span>
                              )}

                              {ongoing && (
                                <span className="ongoing-badge">
                                  <span className="ongoing-dot" />
                                  Live Now
                                </span>
                              )}

                              {event.isPinned && !ongoing && (
                                <span className="pin-mark">
                                  <Star size={9} fill="currentColor" />
                                  Pinned
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="card au d3" style={{ padding: '1rem clamp(1rem,3vw,1.5rem)' }}>
                <div className="lbl" style={{ marginBottom: '0.6rem' }}><Circle size={10} />Legend</div>
                <div className="legend">
                  {(Object.entries(CATEGORY_CONFIG) as [ScheduleEventCategory, CatConfig][]).map(([key, cfg]) => (
                    <span className="legend-item" key={key}>
                      <span className="legend-dot" style={{ background: cfg.color }} />
                      {cfg.label}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}