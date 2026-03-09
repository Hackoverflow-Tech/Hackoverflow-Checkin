'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  Utensils, Coffee, Sun, Moon, CheckCircle2, Clock,
  Lock, Loader2, Flame, AlertTriangle, Ticket, Camera,
  ChevronRight,
} from 'lucide-react';
import type { DBParticipant, MealStatus, ParticipantPortalConfig } from '@/types';
import { MEAL_LABELS, countMealsTaken } from '@/types';
import { getSelfWithMeals, getMealPortalConfig, claimMealAction } from '@/actions/food';

// ─── Constants ────────────────────────────────────────────────────────────────

const MEAL_ORDER: (keyof MealStatus)[] = [
  'day1_dinner',
  'day2_breakfast', 'day2_lunch', 'day2_dinner',
  'day3_breakfast', 'day3_lunch',
];

const DAY_GROUPS: { day: string; label: string; keys: (keyof MealStatus)[] }[] = [
  { day: '1', label: 'Day 1 — Friday',   keys: ['day1_dinner'] },
  { day: '2', label: 'Day 2 — Saturday', keys: ['day2_breakfast', 'day2_lunch', 'day2_dinner'] },
  { day: '3', label: 'Day 3 — Sunday',   keys: ['day3_breakfast', 'day3_lunch'] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function MealIcon({ mealKey, size = 14 }: { mealKey: keyof MealStatus; size?: number }) {
  if (mealKey.includes('breakfast')) return <Coffee size={size} />;
  if (mealKey.includes('lunch'))     return <Sun size={size} />;
  if (mealKey.includes('dinner'))    return <Moon size={size} />;
  return <Utensils size={size} />;
}

type WindowStatus = 'open' | 'upcoming' | 'closed' | 'disabled' | 'unknown';

interface MealWindow {
  mealKey: keyof MealStatus;
  opensAt: string;
  closesAt: string;
  isEnabled: boolean;
}

function getWindowStatus(win?: MealWindow): WindowStatus {
  if (!win) return 'unknown';
  if (!win.isEnabled) return 'disabled';
  const now  = Date.now();
  const open = new Date(win.opensAt).getTime();
  const close = new Date(win.closesAt).getTime();
  if (now < open)  return 'upcoming';
  if (now > close) return 'closed';
  return 'open';
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtFull(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

// ─── Coupon ───────────────────────────────────────────────────────────────────

function MealCoupon({
  participant, mealKey, claimedAt,
}: {
  participant: DBParticipant;
  mealKey: keyof MealStatus;
  claimedAt?: string;
}) {
  return (
    <div className="coupon">
      <div className="coupon-top-bar" />

      {/* Perforation line */}
      <div className="coupon-perf" />

      <div className="coupon-body">
        <div className="coupon-event">HackOverflow 4.0</div>
        <div className="coupon-meal-name">{MEAL_LABELS[mealKey]}</div>

        <div className="coupon-divider" />

        <div className="coupon-row">
          <span className="coupon-key">Name</span>
          <span className="coupon-val">{participant.name}</span>
        </div>
        <div className="coupon-row">
          <span className="coupon-key">ID</span>
          <span className="coupon-val mono">{participant.participantId}</span>
        </div>
        {participant.teamName && (
          <div className="coupon-row">
            <span className="coupon-key">Team</span>
            <span className="coupon-val">{participant.teamName}</span>
          </div>
        )}
        {participant.labAllotted && (
          <div className="coupon-row">
            <span className="coupon-key">Lab</span>
            <span className="coupon-val">{participant.labAllotted}</span>
          </div>
        )}

        <div className="coupon-divider" />

        <div className="coupon-row">
          <span className="coupon-key">Claimed</span>
          <span className="coupon-val mono" style={{ fontSize: '.68rem' }}>
            {claimedAt ? fmtFull(claimedAt) : fmtFull(new Date().toISOString())}
          </span>
        </div>

        {/* Barcode decoration */}
        <div className="coupon-barcode">
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className="bc-bar"
              style={{ height: i % 5 === 0 ? 28 : i % 3 === 0 ? 22 : 16 }}
            />
          ))}
        </div>

        <div className="coupon-id-small">{participant.participantId}</div>
      </div>

      {/* Instruction strip */}
      <div className="coupon-instruction">
        <Camera size={13} style={{ flexShrink: 0 }} />
        <span>Screenshot this coupon and show it to the volunteer at the food counter to receive your meal.</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FoodPage() {
  const [participant, setParticipant] = useState<DBParticipant | null>(null);
  const [portalConfig, setPortalConfig] = useState<ParticipantPortalConfig | null>(null);
  const [loading, setLoading]           = useState(true);
  const [claimingKey, setClaimingKey]   = useState<keyof MealStatus | null>(null);
  const [errors, setErrors]             = useState<Partial<Record<keyof MealStatus, string>>>({});
  const [activeCoupon, setActiveCoupon] = useState<keyof MealStatus | null>(null);
  const [isPending, startT]             = useTransition();

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([getSelfWithMeals(), getMealPortalConfig()]).then(([p, cfg]) => {
      setParticipant(p);
      setPortalConfig(cfg);
      setLoading(false);
    });
  }, []);

  // ── Claim ───────────────────────────────────────────────────────────────────
  function handleClaim(mealKey: keyof MealStatus) {
    setErrors(prev => ({ ...prev, [mealKey]: undefined }));
    setClaimingKey(mealKey);
    startT(async () => {
      const res = await claimMealAction(mealKey);
      setClaimingKey(null);
      if (res.success && res.data) {
        setParticipant(res.data);
        setActiveCoupon(mealKey);     // auto-show coupon on success
      } else {
        setErrors(prev => ({ ...prev, [mealKey]: res.error ?? 'Something went wrong.' }));
      }
    });
  }

  // ── Derived ──────────────────────────────────────────────────────────────────
  const meals  = participant?.meals ?? ({} as MealStatus);
  const taken  = countMealsTaken(meals);
  const total  = 6;
  const pct    = Math.round((taken / total) * 100);

  function getWindow(key: keyof MealStatus): MealWindow | undefined {
    return (portalConfig?.mealSchedule ?? []).find(w => w.mealKey === key) as MealWindow | undefined;
  }

  const anyOpen = MEAL_ORDER.some(key => getWindowStatus(getWindow(key)) === 'open');

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:#0F0F0F; --grad:linear-gradient(90deg,#FCB216 0%,#E85D24 35%,#D91B57 70%,#63205F 100%);
          --orange:#E85D24; --gold:#FCB216; --pink:#D91B57;
          --success:#4ade80; --warn:#fb923c; --danger:#f87171; --info:#38bdf8;
          --text:#FFFFFF; --muted:rgba(255,255,255,.55);
          --glass:rgba(255,255,255,.04); --glass-h:rgba(231,88,41,.07);
          --border:rgba(255,255,255,.09); --border-h:rgba(231,88,41,.35);
          --r:18px; --pill:50px;
        }
        html,body { background:var(--bg); color:var(--text); font-family:'Poppins',sans-serif; -webkit-font-smoothing:antialiased; overflow-x:hidden; }

        .root { min-height:100dvh; padding:clamp(1rem,4vw,2.5rem) clamp(1rem,4vw,2rem); position:relative; overflow:hidden; }
        .page { max-width:860px; margin:0 auto; position:relative; z-index:1; display:flex; flex-direction:column; gap:1.4rem; }

        .orb { position:fixed; border-radius:50%; pointer-events:none; z-index:0; }
        .orb-tl { width:clamp(220px,40vw,500px); height:clamp(220px,40vw,500px); top:-14%; right:-9%; background:radial-gradient(circle,#FCB216 0%,transparent 70%); opacity:.06; }
        .orb-br { width:clamp(200px,35vw,440px); height:clamp(200px,35vw,440px); bottom:-14%; left:-9%; background:radial-gradient(circle,#D91B57 0%,transparent 70%); opacity:.07; }

        @keyframes fadeUp  { from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:none;} }
        @keyframes spin    { to{transform:rotate(360deg);} }
        @keyframes blink   { 0%,100%{opacity:1;}50%{opacity:.25;} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 0 0 rgba(232,93,36,.2);}50%{box-shadow:0 0 14px 3px rgba(232,93,36,.28);} }
        @keyframes overlayIn { from{opacity:0;}to{opacity:1;} }
        @keyframes slideUp   { from{opacity:0;transform:translateY(40px) scale(.97);}to{opacity:1;transform:none;} }
        .au{animation:fadeUp .5s ease both;} .d1{animation-delay:.05s;} .d2{animation-delay:.13s;} .d3{animation-delay:.21s;} .d4{animation-delay:.29s;}
        .spin{animation:spin .9s linear infinite;}

        /* Card */
        .card { background:var(--glass); border:1px solid var(--border); border-radius:var(--r); padding:clamp(1rem,3vw,1.5rem); position:relative; overflow:hidden; backdrop-filter:blur(12px); transition:background .3s,border-color .3s; }
        .card::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,.025) 0%,transparent 60%); pointer-events:none; }
        .card-bar::after { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:var(--grad); border-radius:var(--r) var(--r) 0 0; }

        /* Header */
        .badge-pill { display:inline-flex; align-items:center; gap:.4rem; padding:.28rem .85rem; border-radius:var(--pill); font-size:.62rem; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; background:rgba(231,88,41,.1); border:1px solid rgba(231,88,41,.28); color:var(--gold); }
        .bdot  { width:6px; height:6px; border-radius:50%; background:var(--gold); animation:blink 2s ease-in-out infinite; }
        .page-title { font-size:clamp(1.8rem,5.5vw,2.8rem); font-weight:800; line-height:1.15; letter-spacing:-.4px; }
        .grad-text  { background:var(--grad); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
        .sub-line   { font-size:.72rem; color:var(--muted); display:flex; align-items:center; gap:.4rem; margin-top:.3rem; }

        /* Label */
        .lbl { font-size:.59rem; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:1.8px; display:flex; align-items:center; gap:.4rem; margin-bottom:.9rem; }

        /* Progress */
        .progress-hero { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem; }
        .progress-count { font-size:clamp(2.5rem,8vw,3.8rem); font-weight:800; line-height:1; }
        .progress-denom { font-size:1.1rem; color:rgba(255,255,255,.2); font-weight:400; }
        .progress-sub   { font-size:.68rem; color:var(--muted); margin-top:.2rem; text-transform:uppercase; letter-spacing:1.2px; }
        .open-pill { display:inline-flex; align-items:center; gap:.35rem; padding:.28rem .8rem; border-radius:var(--pill); background:rgba(232,93,36,.15); border:1px solid rgba(232,93,36,.4); font-size:.62rem; font-weight:700; color:var(--orange); animation:glowPulse 2s ease-in-out infinite; }
        .big-track { height:9px; background:rgba(255,255,255,.06); border-radius:9px; overflow:hidden; margin:.8rem 0 .4rem; }
        .big-fill  { height:100%; background:var(--grad); border-radius:9px; transition:width 1.2s cubic-bezier(0.34,1.56,0.64,1); }
        .pct-label { font-size:.63rem; color:var(--pink); font-weight:700; text-transform:uppercase; letter-spacing:1px; }

        /* Day sections */
        .day-section + .day-section { margin-top:1.2rem; }
        .day-header { display:flex; align-items:center; gap:.7rem; margin-bottom:.7rem; }
        .day-line   { flex:1; height:1px; background:rgba(255,255,255,.07); }
        .day-tag    { font-size:.6rem; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:var(--muted); white-space:nowrap; }

        /* Meal row */
        .meal-row {
          display:flex; align-items:center; gap:.85rem;
          padding:.75rem 1rem; border-radius:13px; border:1px solid transparent;
          margin-bottom:.5rem; transition:background .25s,border-color .25s;
        }
        .meal-row:last-child { margin-bottom:0; }
        .meal-row.claimed  { background:rgba(74,222,128,.05);  border-color:rgba(74,222,128,.18); }
        .meal-row.open     { background:rgba(231,88,41,.06);   border-color:rgba(231,88,41,.28); }
        .meal-row.upcoming { background:rgba(255,255,255,.03); border-color:rgba(255,255,255,.07); }
        .meal-row.closed   { background:rgba(255,255,255,.02); border-color:rgba(255,255,255,.05); }
        .meal-row.disabled { background:rgba(255,255,255,.02); border-color:rgba(255,255,255,.04); opacity:.5; }

        .meal-icon-wrap { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .ic-claimed  { background:rgba(74,222,128,.12); color:var(--success); }
        .ic-open     { background:rgba(231,88,41,.15);  color:var(--gold); }
        .ic-upcoming { background:rgba(255,255,255,.06); color:var(--muted); }
        .ic-closed   { background:rgba(255,255,255,.04); color:rgba(255,255,255,.25); }

        .meal-info { flex:1; min-width:0; }
        .meal-name { font-size:clamp(.78rem,2vw,.88rem); font-weight:600; }
        .meal-time { font-size:.61rem; color:var(--muted); margin-top:2px; display:flex; align-items:center; gap:.3rem; }

        .meal-right { display:flex; flex-direction:column; align-items:flex-end; gap:.45rem; flex-shrink:0; }

        /* Status badge */
        .sb { display:inline-flex; align-items:center; gap:.28rem; padding:.2rem .6rem; border-radius:var(--pill); font-size:.56rem; font-weight:800; text-transform:uppercase; letter-spacing:.8px; white-space:nowrap; }
        .sb-claimed  { background:rgba(74,222,128,.1);  border:1px solid rgba(74,222,128,.28);  color:var(--success); }
        .sb-open     { background:rgba(231,88,41,.12);  border:1px solid rgba(231,88,41,.35);   color:var(--orange); }
        .sb-upcoming { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); color:var(--muted); }
        .sb-closed   { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07);color:rgba(255,255,255,.3); }

        /* Buttons */
        .btn { display:flex; align-items:center; justify-content:center; gap:.4rem; padding:.55rem 1rem; border-radius:10px; border:none; font-family:'Poppins',sans-serif; font-size:.78rem; font-weight:700; cursor:pointer; transition:transform .2s,box-shadow .2s,background .2s; white-space:nowrap; }
        .btn:disabled { opacity:.4; cursor:not-allowed; }
        .btn:not(:disabled):hover  { transform:translateY(-1px); }
        .btn:not(:disabled):active { transform:scale(.98); }
        .btn-claim { background:var(--grad); color:#fff; box-shadow:0 3px 14px rgba(232,93,36,.3); font-size:.75rem; padding:.5rem .9rem; }
        .btn-claim:not(:disabled):hover { box-shadow:0 5px 20px rgba(232,93,36,.4); }
        .btn-coupon { background:rgba(74,222,128,.1); border:1px solid rgba(74,222,128,.28); color:var(--success); font-size:.72rem; padding:.45rem .85rem; }
        .btn-coupon:not(:disabled):hover { background:rgba(74,222,128,.18); }

        /* Error inline */
        .meal-err { display:flex; align-items:center; gap:.3rem; font-size:.65rem; color:var(--danger); font-weight:600; }

        /* Loading */
        .load-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1rem; min-height:200px; }
        .load-txt  { font-size:.68rem; letter-spacing:2px; text-transform:uppercase; color:var(--muted); }

        /* ── Coupon overlay ─────────────────────────────────────── */
        .coupon-overlay {
          position:fixed; inset:0; z-index:100;
          background:rgba(0,0,0,.82); backdrop-filter:blur(16px);
          display:flex; align-items:center; justify-content:center; padding:1.25rem;
          animation:overlayIn .25s ease both;
        }
        .coupon-wrap {
          display:flex; flex-direction:column; align-items:center; gap:1.1rem;
          width:100%; max-width:340px;
          animation:slideUp .35s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        .coupon-label { font-size:.62rem; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:var(--muted); }
        .coupon-close { padding:.5rem 1.25rem; border-radius:10px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); color:var(--muted); font-family:'Poppins',sans-serif; font-size:.76rem; font-weight:700; cursor:pointer; transition:background .2s,color .2s; width:100%; }
        .coupon-close:hover { background:rgba(255,255,255,.1); color:var(--text); }

        /* Coupon card */
        .coupon {
          width:100%; background:#fff; border-radius:16px;
          overflow:hidden; box-shadow:0 24px 60px rgba(0,0,0,.7);
          position:relative;
        }
        .coupon-top-bar { height:6px; background:linear-gradient(90deg,#FCB216,#E85D24,#D91B57,#63205F); }
        .coupon-perf {
          height:1px; margin:0 1.2rem;
          background:repeating-linear-gradient(90deg,rgba(0,0,0,.12) 0,rgba(0,0,0,.12) 6px,transparent 6px,transparent 12px);
        }
        .coupon-body { padding:1.25rem 1.4rem; background:#fff; color:#111; }
        .coupon-event { font-size:.62rem; font-weight:700; text-transform:uppercase; letter-spacing:2px; color:rgba(0,0,0,.35); margin-bottom:.2rem; }
        .coupon-meal-name { font-size:1.35rem; font-weight:800; letter-spacing:-.3px; color:#111; margin-bottom:.9rem; }
        .coupon-divider { height:1px; background:rgba(0,0,0,.08); margin:.7rem 0; }
        .coupon-row { display:flex; justify-content:space-between; align-items:baseline; gap:.5rem; margin-bottom:.3rem; }
        .coupon-key { font-size:.6rem; font-weight:700; text-transform:uppercase; letter-spacing:1.2px; color:rgba(0,0,0,.35); flex-shrink:0; }
        .coupon-val { font-size:.82rem; font-weight:700; color:#111; text-align:right; }
        .mono { font-family:'Courier New',monospace; font-size:.72rem; }
        .coupon-barcode { display:flex; align-items:flex-end; gap:2px; margin:1rem 0 .35rem; justify-content:center; }
        .bc-bar { width:2px; background:#111; border-radius:1px; opacity:.15; }
        .coupon-id-small { text-align:center; font-family:'Courier New',monospace; font-size:.58rem; color:rgba(0,0,0,.3); letter-spacing:1px; }
        .coupon-instruction {
          display:flex; align-items:flex-start; gap:.55rem;
          padding:.85rem 1.4rem;
          background:linear-gradient(135deg,rgba(252,178,22,.08),rgba(232,93,36,.06));
          border-top:1px dashed rgba(0,0,0,.1);
          font-size:.7rem; color:rgba(0,0,0,.55); line-height:1.55;
        }
        .coupon-instruction svg { color:#E85D24; margin-top:2px; }
      `}</style>

      {/* ── Coupon overlay ── */}
      {activeCoupon && participant && (
        <div className="coupon-overlay" onClick={() => setActiveCoupon(null)}>
          <div className="coupon-wrap" onClick={e => e.stopPropagation()}>
            <div className="coupon-label">Your Meal Coupon</div>
            <MealCoupon
              participant={participant}
              mealKey={activeCoupon}
            />
            <button className="coupon-close" onClick={() => setActiveCoupon(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      <div className="root">
        <div className="orb orb-tl" /><div className="orb orb-br" />

        <div className="page">

          {/* Loading */}
          {loading && (
            <div className="card load-wrap au d1">
              <Loader2 size={26} className="spin" style={{ color: 'var(--orange)' }} />
              <span className="load-txt">Loading Meal Data</span>
            </div>
          )}

          {!loading && (
            <>
              {/* Header */}
              <div className="au d1" style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                <span className="badge-pill"><span className="bdot" />HackOverflow 4.0</span>
                <h1 className="page-title">Meal <span className="grad-text">Tracker</span></h1>
                <p className="sub-line"><Utensils size={13} /><span>Track and claim your meals across 3 days</span></p>
              </div>

              {/* Progress hero */}
              <div className="card card-bar au d2">
                <div className="lbl"><Flame size={12} />Progress</div>
                <div className="progress-hero">
                  <div>
                    <div className="progress-count">
                      {taken}<span className="progress-denom">/{total}</span>
                    </div>
                    <div className="progress-sub">Meals Collected</div>
                  </div>
                  {anyOpen && (
                    <span className="open-pill">
                      <Flame size={11} /> Meal Window Open Now
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
                      const isClaimed   = meals?.[key] ?? false;
                      const win         = getWindow(key);
                      const winStatus   = getWindowStatus(win);
                      const isLoading   = claimingKey === key && isPending;

                      // Display state
                      type DisplayState = 'claimed' | 'open' | 'upcoming' | 'closed' | 'disabled';
                      const state: DisplayState = isClaimed ? 'claimed'
                        : winStatus === 'open'     ? 'open'
                        : winStatus === 'upcoming' ? 'upcoming'
                        : winStatus === 'closed'   ? 'closed'
                        : 'disabled';

                      const iconClass = {
                        claimed:  'ic-claimed',
                        open:     'ic-open',
                        upcoming: 'ic-upcoming',
                        closed:   'ic-closed',
                        disabled: 'ic-closed',
                      }[state];

                      const badgeClass = {
                        claimed:  'sb-claimed',
                        open:     'sb-open',
                        upcoming: 'sb-upcoming',
                        closed:   'sb-closed',
                        disabled: 'sb-closed',
                      }[state];

                      const badgeLabel = {
                        claimed:  'Collected ✓',
                        open:     'Open Now',
                        upcoming: 'Upcoming',
                        closed:   'Closed',
                        disabled: 'Not Set',
                      }[state];

                      const rowErr = errors[key];

                      return (
                        <div className={`meal-row ${state}`} key={key}>
                          {/* Icon */}
                          <div className={`meal-icon-wrap ${iconClass}`}>
                            <MealIcon mealKey={key} size={15} />
                          </div>

                          {/* Info */}
                          <div className="meal-info">
                            <div className="meal-name">{MEAL_LABELS[key]}</div>
                            {win?.opensAt && win?.closesAt && (
                              <div className="meal-time">
                                <Clock size={10} />
                                {fmtTime(win.opensAt)} — {fmtTime(win.closesAt)}
                              </div>
                            )}
                            {rowErr && (
                              <div className="meal-err" style={{ marginTop: '.3rem' }}>
                                <AlertTriangle size={11} />{rowErr}
                              </div>
                            )}
                          </div>

                          {/* Right side: badge + action */}
                          <div className="meal-right">
                            <span className={`sb ${badgeClass}`}>{badgeLabel}</span>

                            {/* Claim button — only when open and not claimed */}
                            {state === 'open' && !isClaimed && (
                              <button
                                className="btn btn-claim"
                                onClick={() => handleClaim(key)}
                                disabled={isLoading || isPending}
                              >
                                {isLoading
                                  ? <><Loader2 size={13} className="spin" /> Claiming…</>
                                  : <><Utensils size={13} /> Claim Meal</>}
                              </button>
                            )}

                            {/* Show coupon button — when claimed */}
                            {isClaimed && (
                              <button
                                className="btn btn-coupon"
                                onClick={() => setActiveCoupon(key)}
                              >
                                <Ticket size={13} /> Show Coupon
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* No session fallback */}
              {!participant && (
                <div className="card load-wrap au d4">
                  <AlertTriangle size={26} style={{ color: 'var(--warn)' }} />
                  <p style={{ color: 'var(--muted)', fontSize: '.75rem', textAlign: 'center' }}>
                    No session found.<br />Please scan your QR code to log in.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}