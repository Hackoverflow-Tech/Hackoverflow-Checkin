'use client';

import { useEffect, useState } from 'react';
import {
  Utensils,
  Coffee,
  Sun,
  Moon,
  CheckCircle2,
  Clock,
  Lock,
  Loader2,
  ChevronRight,
  Flame,
} from 'lucide-react';
import type { MealStatus, MealTimeConfig } from '@/types';
import { MEAL_LABELS, countMealsTaken } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MealWindowInfo {
  mealKey: keyof MealStatus;
  opensAt: string;   // ISO string from JSON
  closesAt: string;
  isEnabled: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MEAL_ORDER: (keyof MealStatus)[] = [
  'day1_dinner',
  'day2_breakfast',
  'day2_lunch',
  'day2_dinner',
  'day3_breakfast',
  'day3_lunch',
];

const DAY_GROUPS: { day: string; label: string; keys: (keyof MealStatus)[] }[] = [
  { day: '1', label: 'Day 1 — Friday', keys: ['day1_dinner'] },
  { day: '2', label: 'Day 2 — Saturday', keys: ['day2_breakfast', 'day2_lunch', 'day2_dinner'] },
  { day: '3', label: 'Day 3 — Sunday', keys: ['day3_breakfast', 'day3_lunch'] },
];

// Icon per meal slot
function MealIcon({ mealKey, size = 14 }: { mealKey: keyof MealStatus; size?: number }) {
  if (mealKey.includes('breakfast')) return <Coffee size={size} />;
  if (mealKey.includes('lunch'))     return <Sun size={size} />;
  if (mealKey.includes('dinner'))    return <Moon size={size} />;
  return <Utensils size={size} />;
}

// Meal window status helpers
function getMealWindowStatus(window?: MealWindowInfo): 'open' | 'upcoming' | 'closed' | 'unknown' {
  if (!window) return 'unknown';
  if (!window.isEnabled) return 'closed';
  const now = Date.now();
  const opens  = new Date(window.opensAt).getTime();
  const closes = new Date(window.closesAt).getTime();
  if (now < opens)  return 'upcoming';
  if (now > closes) return 'closed';
  return 'open';
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FoodPage() {
  const [meals, setMeals]       = useState<MealStatus | null>(null);
  const [windows, setWindows]   = useState<MealWindowInfo[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        // 1. Auth
        const authRes  = await fetch('/api/auth/verify');
        const authData = await authRes.json();
        if (!authData.participantId) return;

        // 2. Participant data (meals)
        const partRes  = await fetch(`/api/participant/${authData.participantId}`);
        const partData = await partRes.json();

        // 3. Portal config (meal schedule windows)
        const cfgRes  = await fetch('/api/portal/config');
        const cfgData = await cfgRes.json();

        if (!alive) return;

        if (partData.participant?.meals) setMeals(partData.participant.meals);
        if (cfgData.config?.mealSchedule) setWindows(cfgData.config.mealSchedule);
      } catch (err) {
        console.error('[FoodPage] fetch error:', err);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => { alive = false; };
  }, []);

  const taken = meals ? countMealsTaken(meals) : 0;
  const total = 6;
  const pct   = Math.round((taken / total) * 100);

  function getWindow(key: keyof MealStatus): MealWindowInfo | undefined {
    return windows.find(w => w.mealKey === key);
  }

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
          --success: #4ade80;
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
        .orb-br { width: clamp(180px,35vw,440px); height: clamp(180px,35vw,440px); bottom: -12%; left: -8%; background: radial-gradient(circle, #D91B57 0%, transparent 70%); opacity: 0.07; animation-delay: -3s; }
        @keyframes orbPulse { from { opacity: 0.05; transform: scale(1); } to { opacity: 0.11; transform: scale(1.08); } }

        /* Animations */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
        .au { animation: fadeUp 0.55s ease both; }
        .d1 { animation-delay: 0.05s; } .d2 { animation-delay: 0.14s; } .d3 { animation-delay: 0.22s; } .d4 { animation-delay: 0.30s; }

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
        .card { background: var(--glass); border: 1px solid var(--border); border-radius: var(--r); padding: clamp(1rem,3vw,1.5rem); position: relative; overflow: hidden; width: 100%; backdrop-filter: blur(10px); transition: background 0.3s, border-color 0.3s; }
        .card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.025) 0%, transparent 60%); pointer-events: none; }
        .card-accent::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--grad); border-radius: var(--r) var(--r) 0 0; }
        .lbl { font-size: 0.62rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 1.8px; display: flex; align-items: center; gap: 0.4rem; margin-bottom: 1rem; }

        /* ── Progress Hero ── */
        .progress-hero { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
        .progress-count { font-size: clamp(2.5rem,8vw,4rem); font-weight: 800; line-height: 1; }
        .progress-denom { font-size: 1.2rem; color: rgba(255,255,255,0.2); font-weight: 400; }
        .progress-label { font-size: 0.7rem; color: var(--muted); margin-top: 0.2rem; text-transform: uppercase; letter-spacing: 1.2px; }

        .big-track { height: 10px; background: rgba(255,255,255,0.06); border-radius: 10px; overflow: hidden; margin: 0.8rem 0 0.4rem; }
        .big-fill { height: 100%; background: var(--grad); border-radius: 10px; transition: width 1.2s cubic-bezier(0.34,1.56,0.64,1); }
        .pct-label { font-size: 0.65rem; color: var(--pink); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }

        /* Flame indicator for today's open meal */
        .open-pulse { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.8rem; border-radius: var(--pill); background: rgba(232,93,36,0.15); border: 1px solid rgba(232,93,36,0.4); font-size: 0.62rem; font-weight: 700; color: var(--orange); animation: glowPulse 2s ease-in-out infinite; }
        @keyframes glowPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(232,93,36,0.2); } 50% { box-shadow: 0 0 12px 2px rgba(232,93,36,0.25); } }

        /* ── Day group ── */
        .day-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
        .day-line { flex: 1; height: 1px; background: rgba(255,255,255,0.07); }
        .day-tag { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--muted); white-space: nowrap; }

        /* ── Meal row ── */
        .meal-row {
          display: flex; align-items: center;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          border: 1px solid transparent;
          gap: 0.9rem;
          transition: background 0.25s, border-color 0.25s, transform 0.25s;
          margin-bottom: 0.5rem;
          cursor: default;
        }
        .meal-row:last-child { margin-bottom: 0; }
        .meal-row.taken { background: rgba(74,222,128,0.05); border-color: rgba(74,222,128,0.18); }
        .meal-row.open  { background: rgba(231,88,41,0.06); border-color: rgba(231,88,41,0.28); }
        .meal-row.upcoming { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07); }
        .meal-row.closed { background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.05); }
        .meal-row.unknown { background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.05); }

        .meal-icon-wrap { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .meal-icon-taken    { background: rgba(74,222,128,0.12); color: var(--success); }
        .meal-icon-open     { background: rgba(231,88,41,0.15); color: var(--gold); }
        .meal-icon-upcoming { background: rgba(255,255,255,0.06); color: var(--muted); }
        .meal-icon-closed   { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.25); }

        .meal-info { flex: 1; min-width: 0; }
        .meal-name { font-size: clamp(0.78rem,2vw,0.88rem); font-weight: 600; }
        .meal-time { font-size: 0.62rem; color: var(--muted); margin-top: 2px; display: flex; align-items: center; gap: 0.3rem; }

        .meal-status-badge { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.22rem 0.65rem; border-radius: var(--pill); font-size: 0.58rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; white-space: nowrap; flex-shrink: 0; }
        .msb-taken    { background: rgba(74,222,128,0.12); border: 1px solid rgba(74,222,128,0.3); color: var(--success); }
        .msb-open     { background: rgba(231,88,41,0.15); border: 1px solid rgba(231,88,41,0.4); color: var(--orange); }
        .msb-upcoming { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: var(--muted); }
        .msb-closed   { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.3); }

        /* ── Day section spacing ── */
        .day-section { display: flex; flex-direction: column; gap: 0; }
        .day-section + .day-section { margin-top: 1.2rem; }
      `}</style>

      <div className="root">
        <div className="orb orb-tl" />
        <div className="orb orb-br" />

        <div className="page">
          {loading ? (
            <div className="card loading-wrap au d1">
              <Loader2 size={26} className="spin" style={{ color: 'var(--orange)' }} />
              <span className="loading-txt">Loading Meal Data</span>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="au d1" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span className="badge"><span className="badge-dot" />HackOverflow 4.0</span>
                <h1 className="title">Meal <span className="grad-text">Tracker</span></h1>
                <p className="subtitle">
                  <Utensils size={13} />
                  <span>Track your meals across 3 days</span>
                </p>
              </div>

              {/* Progress Hero */}
              <div className="card card-accent au d2">
                <div className="lbl"><Flame size={12} />Progress Overview</div>
                <div className="progress-hero">
                  <div>
                    <div className="progress-count">
                      {taken}<span className="progress-denom">/{total}</span>
                    </div>
                    <div className="progress-label">Meals Collected</div>
                  </div>
                  {/* Show currently open meal if any */}
                  {windows.some(w => getMealWindowStatus(w) === 'open') && (
                    <span className="open-pulse">
                      <Flame size={11} />
                      Meal Window Open Now
                    </span>
                  )}
                </div>
                <div className="big-track">
                  <div className="big-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="pct-label">{total - taken} remaining · {pct}% complete</div>
              </div>

              {/* Meal schedule */}
              <div className="card au d3">
                <div className="lbl"><Utensils size={12} />Meal Schedule</div>

                {DAY_GROUPS.map(group => (
                  <div className="day-section" key={group.day}>
                    <div className="day-header">
                      <div className="day-line" />
                      <span className="day-tag">{group.label}</span>
                      <div className="day-line" />
                    </div>

                    {group.keys.map(key => {
                      const taken      = meals?.[key] ?? false;
                      const win        = getWindow(key);
                      const winStatus  = getMealWindowStatus(win);
                      const label      = MEAL_LABELS[key];

                      // Determine display state
                      let displayState: 'taken' | 'open' | 'upcoming' | 'closed' | 'unknown';
                      if (taken)                   displayState = 'taken';
                      else if (winStatus === 'open')     displayState = 'open';
                      else if (winStatus === 'upcoming') displayState = 'upcoming';
                      else if (winStatus === 'closed')   displayState = 'closed';
                      else                               displayState = 'unknown';

                      const iconClass = {
                        taken:    'meal-icon-taken',
                        open:     'meal-icon-open',
                        upcoming: 'meal-icon-upcoming',
                        closed:   'meal-icon-closed',
                        unknown:  'meal-icon-closed',
                      }[displayState];

                      const badgeClass = {
                        taken:    'msb-taken',
                        open:     'msb-open',
                        upcoming: 'msb-upcoming',
                        closed:   'msb-closed',
                        unknown:  'msb-closed',
                      }[displayState];

                      const badgeLabel = {
                        taken:    'Collected',
                        open:     'Open Now',
                        upcoming: 'Upcoming',
                        closed:   'Closed',
                        unknown:  'Not Set',
                      }[displayState];

                      const BadgeIcon = {
                        taken:    CheckCircle2,
                        open:     Flame,
                        upcoming: Clock,
                        closed:   Lock,
                        unknown:  Clock,
                      }[displayState];

                      return (
                        <div className={`meal-row ${displayState}`} key={key}>
                          <div className={`meal-icon-wrap ${iconClass}`}>
                            <MealIcon mealKey={key} size={15} />
                          </div>
                          <div className="meal-info">
                            <div className="meal-name">{label}</div>
                            {win && (
                              <div className="meal-time">
                                <Clock size={10} />
                                {formatTime(win.opensAt)} — {formatTime(win.closesAt)}
                              </div>
                            )}
                          </div>
                          <span className={`meal-status-badge ${badgeClass}`}>
                            <BadgeIcon size={9} />
                            {badgeLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}