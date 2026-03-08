'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { DBParticipant, countMealsTaken } from '@/types';
import {
  Wifi,
  Utensils,
  ShieldCheck,
  FlaskConical,
  Building2,
  FolderGit2,
  Loader2,
  CheckCircle2,
  Clock,
  LogIn,
  LogOut,
  AlertTriangle,
  ArrowLeftRight,
  RotateCcw,
  Users,
  Lock,
  XCircle,
  KeyRound,
  X,
  Delete,
} from 'lucide-react';
import {
  collegeCheckInAction,
  labCheckInAction,
  labCheckOutAction,
  tempLabCheckOutAction,
  collegeCheckOutAction,
} from '@/actions';

// ─── Helper ───────────────────────────────────────────────────────────────────

function fmtTime(d?: Date | string | null) {
  if (!d) return null;
  return new Date(d).toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── OTP Modal ────────────────────────────────────────────────────────────────

interface OTPModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (otp: string) => void;
  isPending: boolean;
  error: string | null;
}

function OTPModal({ open, onClose, onSubmit, isPending, error }: OTPModalProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Reset on open
  useEffect(() => {
    if (open) {
      setDigits(['', '', '', '']);
      setTimeout(() => inputRefs[0].current?.focus(), 80);
    }
  }, [open]);

  function handleDigit(idx: number, val: string) {
    const ch = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = ch;
    setDigits(next);
    if (ch && idx < 3) inputRefs[idx + 1].current?.focus();
  }

  function handleKey(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = [...digits]; next[idx] = ''; setDigits(next);
      } else if (idx > 0) {
        inputRefs[idx - 1].current?.focus();
      }
    }
    if (e.key === 'Enter') {
      const otp = digits.join('');
      if (otp.length === 4) onSubmit(otp);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (paste.length === 4) {
      setDigits(paste.split(''));
      inputRefs[3].current?.focus();
    }
    e.preventDefault();
  }

  function handleNumpad(n: string) {
    const idx = digits.findIndex(d => d === '');
    if (idx === -1) return;
    const next = [...digits]; next[idx] = n; setDigits(next);
    if (idx < 3) inputRefs[idx + 1].current?.focus();
  }

  function handleDelete() {
    const lastFilled = [...digits].reverse().findIndex(d => d !== '');
    if (lastFilled === -1) return;
    const realIdx = 3 - lastFilled;
    const next = [...digits]; next[realIdx] = ''; setDigits(next);
    inputRefs[realIdx].current?.focus();
  }

  const otp = digits.join('');
  const isComplete = otp.length === 4;

  if (!open) return null;

  return (
    <div className="otp-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('otp-overlay')) onClose(); }}>
      <div className="otp-modal">
        {/* Close */}
        <button className="otp-close" onClick={onClose} disabled={isPending}>
          <X size={16} />
        </button>

        {/* Icon */}
        <div className="otp-icon-wrap">
          <KeyRound size={24} color="var(--gold)" />
        </div>

        {/* Heading */}
        <h2 className="otp-title">Lab Check-in</h2>
        <p className="otp-ask">Ask your volunteer for the OTP</p>
        <p className="otp-hint">Enter the 4-digit code displayed at your lab station</p>

        {/* OTP input row */}
        <div className="otp-inputs" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              className={`otp-digit${d ? ' filled' : ''}${error ? ' errored' : ''}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              disabled={isPending}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="otp-error">
            <AlertTriangle size={12} />
            {error}
          </div>
        )}

        {/* Numpad */}
        <div className="numpad">
          {['1','2','3','4','5','6','7','8','9','','0'].map((n, i) => (
            n
              ? <button key={i} className="np-btn" onClick={() => handleNumpad(n)} disabled={isPending || isComplete}>{n}</button>
              : <div key={i} />
          ))}
          <button className="np-btn np-del" onClick={handleDelete} disabled={isPending}>
            <Delete size={16} />
          </button>
        </div>

        {/* Submit */}
        <button
          className={`otp-submit${isComplete ? ' ready' : ''}`}
          onClick={() => isComplete && onSubmit(otp)}
          disabled={!isComplete || isPending}
        >
          {isPending
            ? <><Loader2 size={16} className="spin" /> Verifying…</>
            : <><KeyRound size={16} /> Verify & Check In</>}
        </button>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [participant,  setParticipant]  = useState<DBParticipant | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [actionError,  setActionError]  = useState<string | null>(null);
  const [otpOpen,      setOtpOpen]      = useState(false);
  const [otpError,     setOtpError]     = useState<string | null>(null);
  const [isPending,    startTransition] = useTransition();

  // ── Data fetch ──
  useEffect(() => {
    fetch('/api/auth/verify')
      .then(r => r.json())
      .then(data => {
        if (data.participantId) {
          fetch(`/api/participant/${data.participantId}`)
            .then(r => r.json())
            .then(d => { if (d.participant) setParticipant(d.participant); })
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Generic action ──
  function runAction(actionFn: (id: string) => Promise<any>) {
    if (!participant?.participantId) return;
    startTransition(async () => {
      const result = await actionFn(participant.participantId);
      if (result.success) {
        setParticipant(result.data?.participant ?? result.data);
        setActionError(null);
      } else {
        setActionError(result.error ?? 'Something went wrong.');
      }
    });
  }

  function runConfirmedAction(actionFn: (id: string) => Promise<any>, msg: string) {
    if (window.confirm(msg)) runAction(actionFn);
  }

  // ── OTP lab check-in ──
  function handleOtpSubmit(otp: string) {
    if (!participant?.participantId) return;
    setOtpError(null);
    startTransition(async () => {
      // Pass OTP to the action — your server action should accept (id, otp)
      const result = await labCheckInAction(participant.participantId, otp);
      if (result.success) {
        setParticipant(result.data?.participant ?? result.data);
        setOtpOpen(false);
        setOtpError(null);
      } else {
        setOtpError(result.error ?? 'Invalid OTP. Please try again.');
      }
    });
  }

  // ── Derived state ──
  const meals       = participant?.meals;
  const mealsTaken  = meals ? countMealsTaken(meals) : 0;
  const totalMeals  = 6;
  const mealPercent = Math.round((mealsTaken / totalMeals) * 100);

  const collegeIn  = participant?.collegeCheckIn?.status;
  const labIn      = participant?.labCheckIn?.status;
  const collegeOut = participant?.collegeCheckOut?.status;
  const labOut     = participant?.labCheckOut?.status;
  const tempOut    = participant?.tempLabCheckOut?.status;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:      #0F0F0F;
          --grad:    linear-gradient(90deg, #FCB216 0%, #E85D24 35%, #D91B57 70%, #63205F 100%);
          --orange:  #E85D24;
          --gold:    #FCB216;
          --pink:    #D91B57;
          --purple:  #63205F;
          --success: #4ade80;
          --warn:    #fb923c;
          --danger:  #f87171;
          --info:    #38bdf8;
          --text:    #FFFFFF;
          --muted:   rgba(255,255,255,0.55);
          --glass:   rgba(255,255,255,0.04);
          --glass-h: rgba(231,88,41,0.07);
          --border:  rgba(255,255,255,0.09);
          --border-h:rgba(231,88,41,0.35);
          --r: 18px; --pill: 50px;
        }

        html, body {
          background: var(--bg); color: var(--text);
          font-family: 'Poppins', sans-serif;
          -webkit-font-smoothing: antialiased; overflow-x: hidden;
        }

        /* ── Layout ── */
        .dash-root { min-height: 100dvh; width: 100%; background: var(--bg); padding: clamp(1rem,4vw,3rem) clamp(1rem,4vw,2rem); position: relative; overflow: hidden; }
        .content { width: 100%; max-width: 880px; margin: 0 auto; position: relative; z-index: 1; display: flex; flex-direction: column; gap: 1.5rem; }

        /* ── Orbs ── */
        .orb { position: fixed; border-radius: 50%; pointer-events: none; z-index: 0; animation: orbPulse 6s ease-in-out infinite alternate; }
        .orb-tl { width: clamp(250px,45vw,550px); height: clamp(250px,45vw,550px); top: -15%; right: -10%; background: radial-gradient(circle, #FCB216 0%, transparent 70%); opacity: 0.06; }
        .orb-br { width: clamp(200px,40vw,500px); height: clamp(200px,40vw,500px); bottom: -15%; left: -10%; background: radial-gradient(circle, #D91B57 0%, transparent 70%); opacity: 0.07; animation-delay: -3s; }
        @keyframes orbPulse { from{opacity:.05;transform:scale(1);} to{opacity:.1;transform:scale(1.08);} }

        /* ── Animations ── */
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px);} to{opacity:1;transform:translateY(0);} }
        .anim{animation:fadeUp .6s ease both;}
        .a1{animation-delay:.05s;} .a2{animation-delay:.15s;} .a3{animation-delay:.25s;} .a4{animation-delay:.35s;} .a5{animation-delay:.45s;}
        @keyframes spin  { to{transform:rotate(360deg);} }
        @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:.3;} }
        @keyframes shake { 0%,100%{transform:translateX(0);} 20%,60%{transform:translateX(-4px);} 40%,80%{transform:translateX(4px);} }
        @keyframes modalIn { from{opacity:0;transform:translateY(30px) scale(.96);} to{opacity:1;transform:translateY(0) scale(1);} }
        @keyframes overlayIn { from{opacity:0;} to{opacity:1;} }
        .spin  { animation: spin  .9s linear infinite; }
        .shake { animation: shake .45s ease; }

        /* ── Badge ── */
        .badge-pill { display: inline-flex; align-items: center; gap: .4rem; width: fit-content; padding: .35rem 1rem; border-radius: var(--pill); font-size: clamp(.6rem,1.5vw,.7rem); font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; background: rgba(231,88,41,.12); border: 1px solid rgba(231,88,41,.35); color: var(--gold); }
        .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); animation: blink 2s ease-in-out infinite; }

        /* ── Header ── */
        .header { display: flex; flex-direction: column; gap: .4rem; }
        .page-title { font-size: clamp(1.8rem,6vw,3rem); font-weight: 800; line-height: 1.15; letter-spacing: -.5px; }
        .grad-text  { background: var(--grad); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .sub-text   { font-size: clamp(.75rem,2vw,.85rem); color: var(--muted); display: flex; align-items: center; gap: .4rem; }
        .sub-sep    { width: 3px; height: 3px; border-radius: 50%; background: var(--muted); }

        /* ── Grid ── */
        .grid-2 { display: grid; grid-template-columns: repeat(2,1fr); gap: 1rem; }
        .col-full { grid-column: 1/-1; }
        @media(max-width:540px){ .grid-2{grid-template-columns:1fr;} }

        /* ── Base Card ── */
        .card { background: var(--glass); border: 1px solid var(--border); border-radius: var(--r); padding: clamp(1rem,3vw,1.5rem); transition: background .3s, border-color .3s, transform .3s; position: relative; overflow: hidden; width: 100%; backdrop-filter: blur(10px); }
        .card:hover { background: var(--glass-h); border-color: var(--border-h); transform: translateY(-3px); }
        .card::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,.025) 0%,transparent 60%); pointer-events:none; }
        .card-nohover:hover { transform: none; background: var(--glass); border-color: var(--border); }
        .card-accent::after { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:var(--grad); border-radius:var(--r) var(--r) 0 0; }

        /* Tints */
        .tint-green  { background: rgba(74,222,128,0.05)  !important; border-color: rgba(74,222,128,0.22)  !important; }
        .tint-green::after  { background: linear-gradient(90deg,#4ade80,#16a34a) !important; }
        .tint-blue   { background: rgba(56,189,248,0.05)  !important; border-color: rgba(56,189,248,0.22)  !important; }
        .tint-blue::after   { background: linear-gradient(90deg,#38bdf8,#0284c7) !important; }
        .tint-orange { background: rgba(251,146,60,0.05)  !important; border-color: rgba(251,146,60,0.25)  !important; }
        .tint-orange::after { background: linear-gradient(90deg,#fb923c,#ea580c) !important; }
        .tint-red    { background: rgba(248,113,113,0.05) !important; border-color: rgba(248,113,113,0.22) !important; }
        .tint-red::after    { background: linear-gradient(90deg,#f87171,#dc2626) !important; }
        .tint-disabled { opacity: .45; pointer-events: none; }

        /* ── Card label ── */
        .card-label { font-size: .62rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 1.8px; display: flex; align-items: center; gap: .4rem; margin-bottom: 1rem; }

        /* ── Status badge ── */
        .status-badge { display: inline-flex; align-items: center; gap: .3rem; padding: .25rem .7rem; border-radius: var(--pill); font-size: .6rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; flex-shrink: 0; }
        .sb-ok   { background: rgba(74,222,128,.12);  border:1px solid rgba(74,222,128,.3);   color: var(--success); }
        .sb-wait { background: rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1);  color: var(--muted); }
        .sb-warn { background: rgba(251,146,60,.12);  border:1px solid rgba(251,146,60,.3);   color: var(--warn); }
        .sb-out  { background: rgba(248,113,113,.1);  border:1px solid rgba(248,113,113,.2);  color: var(--danger); }
        .sb-info { background: rgba(56,189,248,.1);   border:1px solid rgba(56,189,248,.25);  color: var(--info); }

        /* ── Verify rows ── */
        .verify-row { display: flex; align-items: center; justify-content: space-between; padding: .7rem 0; border-bottom: 1px solid rgba(255,255,255,.05); }
        .verify-row:last-child  { border-bottom: none; padding-bottom: 0; }
        .verify-row:first-child { padding-top: 0; }
        .verify-left { display: flex; align-items: center; gap: .6rem; }
        .vi-icon { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.05); flex-shrink: 0; }
        .vi-name { font-size: clamp(.78rem,2vw,.88rem); font-weight: 600; }
        .vi-desc { font-size: .65rem; color: var(--muted); margin-top: 1px; }

        /* ── Meal tracker ── */
        .meal-count { font-size: clamp(2rem,7vw,2.8rem); font-weight: 800; line-height: 1; margin-bottom: .6rem; }
        .meal-denom { font-size: 1rem; color: rgba(255,255,255,.2); font-weight: 400; }
        .track-bar  { height: 8px; background: rgba(255,255,255,.06); border-radius: 10px; overflow: hidden; margin: .6rem 0; }
        .track-fill { height: 100%; background: var(--grad); border-radius: 10px; transition: width 1s ease; }
        .meal-rem   { font-size: .65rem; font-weight: 700; color: var(--pink); text-transform: uppercase; letter-spacing: 1px; }

        /* ── WiFi ── */
        .info-grid  { display: grid; grid-template-columns: repeat(auto-fit,minmax(150px,1fr)); gap: 1.2rem; }
        .info-block { display: flex; flex-direction: column; gap: .3rem; }
        .info-val   { font-size: clamp(.85rem,2.5vw,1rem); font-weight: 700; color: var(--gold); word-break: break-all; }
        .info-val-w { color: var(--text); }
        .info-sub   { font-size: .65rem; color: var(--muted); }
        .info-div   { width: 1px; background: var(--border); align-self: stretch; }
        @media(max-width:400px){ .info-div{display:none;} .info-grid{grid-template-columns:1fr;} }

        /* ── Section divider ── */
        .section-divider { display: flex; align-items: center; gap: .6rem; font-size: clamp(.6rem,1.5vw,.66rem); font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 2px; }
        .section-divider::before, .section-divider::after { content:''; flex:1; height:1px; background:rgba(255,255,255,.07); }

        /* ── Check-in card internals ── */
        .ci-head  { display: flex; align-items: flex-start; justify-content: space-between; gap: .75rem; margin-bottom: 1rem; }
        .ci-title { font-size: clamp(.9rem,2.5vw,1.05rem); font-weight: 700; line-height: 1.2; }
        .ci-sub   { font-size: .65rem; color: var(--muted); margin-top: .2rem; }
        .ci-time  { font-size: .62rem; color: var(--muted); font-family: 'Courier New', monospace; display: flex; align-items: center; gap: .3rem; margin-bottom: .85rem; }
        .ci-time svg { opacity: .5; flex-shrink: 0; }

        /* ── Action buttons ── */
        .action-btn { display: flex; align-items: center; justify-content: center; gap: .5rem; width: 100%; padding: .72rem 1rem; border-radius: 12px; border: none; font-family: 'Poppins', sans-serif; font-size: clamp(.75rem,2vw,.84rem); font-weight: 700; cursor: pointer; transition: transform .2s, box-shadow .2s, background .2s; white-space: nowrap; overflow: hidden; }
        .action-btn:disabled { opacity: .4; cursor: not-allowed; }
        .action-btn:not(:disabled):hover  { transform: translateY(-1px); }
        .action-btn:not(:disabled):active { transform: scale(.98); }
        .btn-primary { background: var(--grad); color: #fff; box-shadow: 0 4px 16px rgba(232,93,36,.25); }
        .btn-primary:not(:disabled):hover { box-shadow: 0 6px 22px rgba(232,93,36,.35); }
        .btn-green  { background: rgba(74,222,128,.1);   border: 1px solid rgba(74,222,128,.3);   color: var(--success); }
        .btn-green:not(:disabled):hover  { background: rgba(74,222,128,.18); }
        .btn-orange { background: rgba(251,146,60,.1);   border: 1px solid rgba(251,146,60,.3);   color: var(--warn); }
        .btn-orange:not(:disabled):hover { background: rgba(251,146,60,.18); }
        .btn-red    { background: rgba(248,113,113,.1);  border: 1px solid rgba(248,113,113,.25);  color: var(--danger); }
        .btn-red:not(:disabled):hover    { background: rgba(248,113,113,.18); }
        .btn-locked { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07); color: rgba(255,255,255,.25); cursor: not-allowed; font-size: clamp(.65rem,1.8vw,.75rem); }
        .btn-row    { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; }
        .done-banner { display: flex; align-items: center; justify-content: center; gap: .5rem; padding: .65rem 1rem; border-radius: 10px; font-size: .65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
        .done-green { background: rgba(74,222,128,.08);  border: 1px solid rgba(74,222,128,.2);  color: var(--success); }
        .done-red   { background: rgba(248,113,113,.08); border: 1px solid rgba(248,113,113,.2); color: var(--danger); }

        /* ── Profile bar ── */
        .profile-bar { display: flex; flex-wrap: wrap; }
        .pi { flex: 1; min-width: 130px; padding: 0 1rem; border-right: 1px solid var(--border); }
        .pi:first-child { padding-left: 0; }
        .pi:last-child  { border-right: none; }
        .pi-key { font-size: .58rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--muted); margin-bottom: .25rem; }
        .pi-val { font-size: clamp(.82rem,2.2vw,.95rem); font-weight: 700; line-height: 1.3; }
        .pi-sub { font-size: .62rem; color: var(--muted); font-family: 'Courier New', monospace; }
        @media(max-width:480px){ .profile-bar{flex-direction:column;gap:1rem;} .pi{border-right:none;border-bottom:1px solid var(--border);padding:0 0 1rem;} .pi:last-child{border-bottom:none;padding-bottom:0;} }

        /* ── Error ── */
        .err-banner { display: flex; align-items: flex-start; gap: .6rem; padding: .85rem 1rem; border-radius: 12px; background: rgba(248,113,113,.08); border: 1px solid rgba(248,113,113,.25); color: var(--danger); font-size: .78rem; line-height: 1.5; }
        .err-banner svg { flex-shrink: 0; margin-top: 1px; }

        /* ── Loading ── */
        .loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; min-height: 200px; }
        .loading-text { font-size: .7rem; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); }

        /* ════════════════════════════════════════════ */
        /* ── OTP MODAL                              ── */
        /* ════════════════════════════════════════════ */

        .otp-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(12px);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          animation: overlayIn .25s ease both;
        }

        .otp-modal {
          width: 100%; max-width: 380px;
          background: #141414;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: clamp(1.5rem,5vw,2rem);
          position: relative;
          display: flex; flex-direction: column; align-items: center; gap: 0;
          animation: modalIn .3s cubic-bezier(0.34,1.56,0.64,1) both;
          box-shadow: 0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05);
        }
        /* Gradient top accent */
        .otp-modal::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:var(--grad); border-radius:24px 24px 0 0; }

        /* Close */
        .otp-close {
          position: absolute; top: 1rem; right: 1rem;
          width: 30px; height: 30px; border-radius: 8px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          color: var(--muted); cursor: pointer; transition: .2s;
        }
        .otp-close:hover { background: rgba(255,255,255,0.1); color: var(--text); }

        /* Icon */
        .otp-icon-wrap {
          width: 56px; height: 56px; border-radius: 16px;
          background: rgba(252,178,22,0.1);
          border: 1px solid rgba(252,178,22,0.25);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 1rem;
        }

        /* Text */
        .otp-title { font-size: clamp(1.1rem,3vw,1.3rem); font-weight: 800; text-align: center; margin-bottom: .3rem; }
        .otp-ask   { font-size: clamp(.82rem,2.2vw,.92rem); font-weight: 700; color: var(--gold); text-align: center; margin-bottom: .3rem; }
        .otp-hint  { font-size: .7rem; color: var(--muted); text-align: center; line-height: 1.5; margin-bottom: 1.5rem; }

        /* OTP digit inputs */
        .otp-inputs {
          display: flex; gap: .75rem; margin-bottom: 1rem;
        }
        .otp-digit {
          width: clamp(52px,13vw,64px); height: clamp(56px,14vw,68px);
          border-radius: 14px;
          background: rgba(255,255,255,0.05);
          border: 2px solid rgba(255,255,255,0.1);
          color: var(--text); text-align: center;
          font-family: 'Poppins', sans-serif;
          font-size: clamp(1.3rem,4vw,1.8rem); font-weight: 800;
          outline: none; caret-color: transparent;
          transition: border-color .2s, background .2s, transform .15s;
        }
        .otp-digit:focus { border-color: rgba(252,178,22,0.6); background: rgba(252,178,22,0.06); transform: scale(1.04); }
        .otp-digit.filled { border-color: rgba(232,93,36,0.5); background: rgba(232,93,36,0.08); }
        .otp-digit.errored { border-color: rgba(248,113,113,0.6); background: rgba(248,113,113,0.06); animation: shake .4s ease; }

        /* OTP error */
        .otp-error { display: flex; align-items: center; gap: .4rem; font-size: .72rem; color: var(--danger); font-weight: 600; margin-bottom: .5rem; text-align: center; }

        /* Numpad */
        .numpad {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: .5rem; width: 100%; margin-bottom: 1rem;
        }
        .np-btn {
          height: 50px; border-radius: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: var(--text); font-family: 'Poppins', sans-serif;
          font-size: 1.1rem; font-weight: 700;
          cursor: pointer; transition: background .18s, transform .15s;
          display: flex; align-items: center; justify-content: center;
        }
        .np-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); transform: scale(1.04); }
        .np-btn:active:not(:disabled){ transform: scale(.96); }
        .np-btn:disabled { opacity: .3; cursor: not-allowed; }
        .np-del { background: rgba(248,113,113,0.07); border-color: rgba(248,113,113,0.15); color: var(--danger); }
        .np-del:hover:not(:disabled) { background: rgba(248,113,113,0.15); }

        /* Submit */
        .otp-submit {
          width: 100%; padding: .82rem 1rem; border-radius: 14px; border: none;
          font-family: 'Poppins', sans-serif; font-size: .9rem; font-weight: 700;
          cursor: pointer; transition: transform .2s, box-shadow .2s, opacity .2s;
          display: flex; align-items: center; justify-content: center; gap: .5rem;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          color: var(--muted);
        }
        .otp-submit.ready {
          background: var(--grad); color: #fff; border: none;
          box-shadow: 0 4px 20px rgba(232,93,36,.35);
        }
        .otp-submit.ready:hover { transform: translateY(-1px); box-shadow: 0 6px 26px rgba(232,93,36,.45); }
        .otp-submit:disabled { opacity: .5; cursor: not-allowed; }
      `}</style>

      {/* ── OTP Modal ── */}
      <OTPModal
        open={otpOpen}
        onClose={() => { setOtpOpen(false); setOtpError(null); }}
        onSubmit={handleOtpSubmit}
        isPending={isPending}
        error={otpError}
      />

      <div className="dash-root">
        <div className="orb orb-tl" />
        <div className="orb orb-br" />

        <div className="content">
          {loading ? (
            <div className="loading-wrap card anim">
              <Loader2 size={28} className="spin" style={{ color: 'var(--orange)' }} />
              <span className="loading-text">Loading System</span>
            </div>
          ) : participant ? (
            <>
              {/* ── Header ── */}
              <div className="header anim a1">
                <span className="badge-pill"><span className="badge-dot" />HackOverflow 4.0</span>
                <h1 className="page-title">Welcome, <span className="grad-text">{participant.name.split(' ')[0]}</span></h1>
                <p className="sub-text">
                  <span>{participant.role || 'Competitor'}</span>
                  <span className="sub-sep" />
                  <span>{participant.labAllotted || 'General Hall'}</span>
                </p>
              </div>

              {/* ── Quick stats ── */}
              <div className="grid-2 anim a2">
                {/* Status overview */}
                <div className="card">
                  <div className="card-label"><ShieldCheck size={13} />Status Overview</div>
                  <div className="verify-row">
                    <div className="verify-left">
                      <div className="vi-icon"><Building2 size={16} style={{ color: 'var(--gold)' }} /></div>
                      <div>
                        <div className="vi-name">College Entry</div>
                        <div className="vi-desc">{collegeIn ? (collegeOut ? 'Checked out' : `Since ${fmtTime(participant.collegeCheckIn?.time)}`) : 'Not yet arrived'}</div>
                      </div>
                    </div>
                    <span className={`status-badge ${collegeOut ? 'sb-out' : collegeIn ? 'sb-ok' : 'sb-wait'}`}>
                      {collegeOut ? <><XCircle size={9}/> Out</> : collegeIn ? <><CheckCircle2 size={9}/> In</> : <><Clock size={9}/> Pending</>}
                    </span>
                  </div>
                  <div className="verify-row">
                    <div className="verify-left">
                      <div className="vi-icon"><FlaskConical size={16} style={{ color: 'var(--gold)' }} /></div>
                      <div>
                        <div className="vi-name">Lab Access</div>
                        <div className="vi-desc">{labOut ? 'Session ended' : tempOut ? `Away · ${fmtTime(participant.tempLabCheckOut?.time)}` : labIn ? `Active · ${participant.labAllotted || 'Lab'}` : 'Not yet checked in'}</div>
                      </div>
                    </div>
                    <span className={`status-badge ${labOut ? 'sb-out' : tempOut ? 'sb-warn' : labIn ? 'sb-info' : 'sb-wait'}`}>
                      {labOut ? <><XCircle size={9}/> Ended</> : tempOut ? <><AlertTriangle size={9}/> Away</> : labIn ? <><CheckCircle2 size={9}/> Active</> : <><Clock size={9}/> Pending</>}
                    </span>
                  </div>
                </div>

                {/* Meal tracker */}
                <div className="card">
                  <div className="card-label"><Utensils size={13} />Meal Tracker</div>
                  <div className="meal-count">{mealsTaken}<span className="meal-denom">/{totalMeals}</span></div>
                  <div className="track-bar"><div className="track-fill" style={{ width: `${mealPercent}%` }} /></div>
                  <div className="meal-rem">{totalMeals - mealsTaken} meals remaining</div>
                </div>

                {/* WiFi + Project */}
                <div className="card col-full anim a3">
                  <div className="info-grid">
                    <div className="info-block">
                      <div className="card-label" style={{ marginBottom: '.4rem' }}><Wifi size={13} />WiFi Credentials</div>
                      <div className="info-val">{participant.wifiCredentials?.ssid || 'HO_GUEST_4.0'}</div>
                      {participant.wifiCredentials?.password && <div className="info-sub">Pass: {participant.wifiCredentials.password}</div>}
                    </div>
                    {participant.projectName && (
                      <>
                        <div className="info-div" />
                        <div className="info-block">
                          <div className="card-label" style={{ marginBottom: '.4rem' }}><FolderGit2 size={13} />Active Project</div>
                          <div className="info-val info-val-w">{participant.projectName}</div>
                          {participant.teamName && <div className="info-sub">Team: {participant.teamName}</div>}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Section divider ── */}
              <div className="anim a4">
                <div className="section-divider"><ShieldCheck size={11} />Check-In Controls</div>
              </div>

              {/* ── Check-in cards ── */}
              <div className="grid-2 anim a4">

                {/* College card */}
                <div className={`card card-nohover card-accent ${collegeOut ? 'tint-red' : collegeIn ? 'tint-green' : ''}`}>
                  <div className="ci-head">
                    <div>
                      <div className="ci-title">Event Attendance</div>
                      <div className="ci-sub">College-wide tracking</div>
                    </div>
                    <span className={`status-badge ${collegeOut ? 'sb-out' : collegeIn ? 'sb-ok' : 'sb-wait'}`}>
                      {collegeOut ? <><XCircle size={9}/> Checked Out</> : collegeIn ? <><CheckCircle2 size={9}/> Present</> : <><Clock size={9}/> Pending</>}
                    </span>
                  </div>

                  {!collegeIn && (
                    <button className="action-btn btn-primary" onClick={() => runAction(collegeCheckInAction)} disabled={isPending}>
                      {isPending ? <Loader2 size={15} className="spin" /> : <LogIn size={15} />}
                      Confirm Arrival
                    </button>
                  )}

                  {collegeIn && !collegeOut && (
                    <>
                      <div className="ci-time"><Clock size={11} />Arrived {fmtTime(participant.collegeCheckIn?.time)}</div>
                      <button
                        className={`action-btn ${labOut ? 'btn-red' : 'btn-locked'}`}
                        onClick={() => runConfirmedAction(collegeCheckOutAction, 'Permanently check out from the event? This action is final.')}
                        disabled={isPending || !labOut}
                      >
                        {isPending ? <Loader2 size={15} className="spin" /> : !labOut ? <><Lock size={13}/> Locked — finish Lab Exit first</> : <><LogOut size={14}/> Final Event Check-out</>}
                      </button>
                    </>
                  )}

                  {collegeOut && (
                    <>
                      <div className="ci-time"><Clock size={11} />Left at {fmtTime(participant.collegeCheckOut?.time)}</div>
                      <div className="done-banner done-red"><XCircle size={13}/> Permanently Checked Out</div>
                    </>
                  )}
                </div>

                {/* ── Lab card ── */}
                <div className={`card card-nohover card-accent ${
                  !collegeIn ? 'tint-disabled' :
                  labOut     ? 'tint-red'      :
                  tempOut    ? 'tint-orange'   :
                  labIn      ? 'tint-blue'     : ''
                }`}>
                  <div className="ci-head">
                    <div>
                      <div className="ci-title">Lab Workspace</div>
                      <div className="ci-sub">{participant.labAllotted || 'Assigned Lab'}</div>
                    </div>
                    <span className={`status-badge ${
                      !collegeIn ? 'sb-wait' : labOut ? 'sb-out' : tempOut ? 'sb-warn' : labIn ? 'sb-info' : 'sb-wait'
                    }`}>
                      {!collegeIn ? <><Lock size={9}/> Locked</> : labOut ? <><XCircle size={9}/> Ended</> : tempOut ? <><AlertTriangle size={9}/> Away</> : labIn ? <><CheckCircle2 size={9}/> Active</> : <><Clock size={9}/> Pending</>}
                    </span>
                  </div>

                  {/* Not checked into lab — OTP button */}
                  {!labIn && (
                    <button
                      className="action-btn btn-primary"
                      onClick={() => { setOtpError(null); setOtpOpen(true); }}
                      disabled={!collegeIn}
                    >
                      <KeyRound size={15} />
                      Lab Check-in
                    </button>
                  )}

                  {/* In lab, not out */}
                  {labIn && !labOut && (
                    <>
                      <div className="ci-time">
                        <Clock size={11} />
                        {tempOut ? <>Away since {fmtTime(participant.tempLabCheckOut?.time)}</> : <>Active since {fmtTime(participant.labCheckIn?.time)}</>}
                      </div>
                      <div className="btn-row">
                        <button
                          className={`action-btn ${tempOut ? 'btn-green' : 'btn-orange'}`}
                          onClick={() => runAction(tempLabCheckOutAction)}
                          disabled={isPending}
                        >
                          {isPending ? <Loader2 size={14} className="spin" /> : tempOut ? <><RotateCcw size={13}/> I'm Back</> : <><ArrowLeftRight size={13}/> Lab Checkin</>}
                        </button>
                        <button
                          className="action-btn btn-red"
                          onClick={() => runConfirmedAction(labCheckOutAction, 'End your lab session permanently? You cannot re-enter after this.')}
                          disabled={isPending}
                        >
                          {isPending ? <Loader2 size={14} className="spin" /> : <><LogOut size={13}/> Lab Exit</>}
                        </button>
                      </div>
                    </>
                  )}

                  {/* Lab ended */}
                  {labIn && labOut && (
                    <>
                      <div className="ci-time"><Clock size={11} />Exited at {fmtTime(participant.labCheckOut?.time)}</div>
                      <div className="done-banner done-red"><XCircle size={13}/> Lab Session Ended</div>
                    </>
                  )}
                </div>
              </div>

              {/* ── Profile bar ── */}
              <div className="card card-accent anim a5">
                <div className="card-label" style={{ marginBottom: '1rem' }}><Users size={13} />Participant Summary</div>
                <div className="profile-bar">
                  <div className="pi">
                    <div className="pi-key">Participant</div>
                    <div className="pi-val">{participant.name}</div>
                    <div className="pi-sub">{participant.participantId}</div>
                  </div>
                  <div className="pi">
                    <div className="pi-key">Team</div>
                    <div className="pi-val">{participant.teamName || 'Individual'}</div>
                    <div className="pi-sub">{participant.role || 'Developer'}</div>
                  </div>
                  <div className="pi">
                    <div className="pi-key">Assigned Lab</div>
                    <div className="pi-val">{participant.labAllotted || 'TBA'}</div>
                    <div className="pi-sub">{participant.institute || 'Check venue map'}</div>
                  </div>
                </div>
              </div>

              {/* Error */}
              {actionError && (
                <div className="err-banner shake anim">
                  <AlertTriangle size={16} />
                  <span>{actionError}</span>
                </div>
              )}
            </>
          ) : (
            <div className="card loading-wrap">
              <p className="loading-text">No participant data found.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}