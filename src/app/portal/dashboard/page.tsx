'use client';

import { useRef, useState, useTransition, useEffect } from 'react';
import { DBParticipant } from '@/types';
import {
  Loader2, CheckCircle2, Clock, LogIn, LogOut,
  AlertTriangle, Users, Lock, XCircle, KeyRound,
  X, Delete, Wifi, FolderGit2, RefreshCw, Sparkles,
} from 'lucide-react';
import {
  getSelf,
  collegeCheckInAction,
  labCheckInAction,
  labCheckOutAction,
} from '@/actions/dashboard';

// ─── Helper ───────────────────────────────────────────────────────────────────

function fmtTime(d?: Date | string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({ open, isPending, onConfirm, onClose }: {
  open: boolean; isPending: boolean; onConfirm: () => void; onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('overlay')) onClose(); }}>
      <div className="modal">
        <button className="modal-x" onClick={onClose} disabled={isPending}><X size={14} /></button>
        <div className="modal-icon" style={{ background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.25)' }}>
          <LogOut size={20} color="var(--danger)" />
        </div>
        <h3 className="modal-title">Leave the Lab?</h3>
        <p className="modal-msg">You'll need a fresh OTP from a volunteer to re-enter.</p>
        <div className="modal-row">
          <button className="btn btn-ghost" onClick={onClose} disabled={isPending}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={isPending}>
            {isPending ? <><Loader2 size={13} className="spin" /> Checking Out…</> : 'Yes, Leave'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── OTP Modal ────────────────────────────────────────────────────────────────

function OTPModal({ open, isPending, error, onClose, onSubmit }: {
  open: boolean; isPending: boolean; error: string | null;
  onClose: () => void; onSubmit: (otp: string) => void;
}) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    if (open) { setDigits(['', '', '', '']); setTimeout(() => refs[0].current?.focus(), 80); }
  }, [open]);

  function setDigit(idx: number, val: string) {
    const ch = val.replace(/\D/g, '').slice(-1);
    const next = [...digits]; next[idx] = ch; setDigits(next);
    if (ch && idx < 3) refs[idx + 1].current?.focus();
  }

  function onKey(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace') {
      if (digits[idx]) { const n = [...digits]; n[idx] = ''; setDigits(n); }
      else if (idx > 0) refs[idx - 1].current?.focus();
    }
    if (e.key === 'Enter' && digits.join('').length === 4) onSubmit(digits.join(''));
  }

  function onPaste(e: React.ClipboardEvent) {
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (p.length === 4) { setDigits(p.split('')); refs[3].current?.focus(); }
    e.preventDefault();
  }

  function numpad(n: string) {
    const idx = digits.findIndex(d => d === '');
    if (idx === -1) return;
    const next = [...digits]; next[idx] = n; setDigits(next);
    if (idx < 3) refs[idx + 1].current?.focus();
  }

  function del() {
    const rev = [...digits].reverse().findIndex(d => d !== '');
    if (rev === -1) return;
    const ri = 3 - rev;
    const next = [...digits]; next[ri] = ''; setDigits(next);
    refs[ri].current?.focus();
  }

  const otp = digits.join('');
  const ready = otp.length === 4;

  if (!open) return null;
  return (
    <div className="overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('overlay')) onClose(); }}>
      <div className="modal modal-otp">
        <button className="modal-x" onClick={onClose} disabled={isPending}><X size={14} /></button>
        <div className="modal-icon"><KeyRound size={20} color="var(--gold)" /></div>
        <h3 className="modal-title">Lab Check-In</h3>
        <p className="modal-msg">Ask your volunteer for the current 4-digit OTP.</p>

        <div className="otp-row" onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i} ref={refs[i]}
              className={`otp-box${d ? ' filled' : ''}${error ? ' errored' : ''}`}
              type="text" inputMode="numeric" maxLength={1} value={d}
              onChange={e => setDigit(i, e.target.value)}
              onKeyDown={e => onKey(i, e)}
              disabled={isPending}
            />
          ))}
        </div>

        {error && <div className="otp-err"><AlertTriangle size={11} />{error}</div>}

        <div className="numpad">
          {['1','2','3','4','5','6','7','8','9','','0'].map((n, i) =>
            n
              ? <button key={i} className="np" onClick={() => numpad(n)} disabled={isPending || ready}>{n}</button>
              : <div key={i} />
          )}
          <button className="np np-del" onClick={del} disabled={isPending}><Delete size={14} /></button>
        </div>

        <button
          className={`btn btn-full${ready ? ' btn-primary' : ' btn-ghost'}`}
          onClick={() => ready && onSubmit(otp)}
          disabled={!ready || isPending}
        >
          {isPending
            ? <><Loader2 size={14} className="spin" /> Verifying…</>
            : <><KeyRound size={14} /> Verify & Enter Lab</>}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [p, setP]                 = useState<DBParticipant | null>(null);
  const [loading, setLoading]     = useState(true);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [otpOpen, setOtpOpen]     = useState(false);
  const [otpErr, setOtpErr]       = useState<string | null>(null);
  const [confirmOpen, setConfirm] = useState(false);
  const [isPending, startT]       = useTransition();

  useEffect(() => {
    getSelf().then(data => { setP(data); setLoading(false); });
  }, []);

  function run(fn: () => Promise<{ success: boolean; data?: DBParticipant; error?: string }>) {
    setActionErr(null);
    startT(async () => {
      const res = await fn();
      if (res.success && res.data) setP(res.data);
      else setActionErr(res.error ?? 'Something went wrong.');
    });
  }

  function handleCollegeCheckIn() { run(collegeCheckInAction); }
  function handleCheckout()       { setConfirm(false); run(labCheckOutAction); }
  function handleOtpSubmit(otp: string) {
    setOtpErr(null);
    startT(async () => {
      const res = await labCheckInAction(otp);
      if (res.success && res.data) { setP(res.data); setOtpOpen(false); setActionErr(null); }
      else setOtpErr(res.error ?? 'Invalid OTP. Try again.');
    });
  }

  const collegeIn = p?.collegeCheckIn?.status ?? false;
  const labIn     = p?.labCheckIn?.status ?? false;
  const labOut    = p?.labCheckOut?.status ?? false;
  const inLab     = labIn && !labOut;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:#0F0F0F; --grad:linear-gradient(90deg,#FCB216 0%,#E85D24 35%,#D91B57 70%,#63205F 100%);
          --orange:#E85D24; --gold:#FCB216; --success:#4ade80; --warn:#fb923c; --danger:#f87171; --info:#38bdf8;
          --text:#FFFFFF; --muted:rgba(255,255,255,.55); --glass:rgba(255,255,255,.04); --glass-h:rgba(231,88,41,.07);
          --border:rgba(255,255,255,.09); --border-h:rgba(231,88,41,.35); --r:18px; --pill:50px;
        }
        html,body { background:var(--bg); color:var(--text); font-family:'Poppins',sans-serif; -webkit-font-smoothing:antialiased; }

        .root    { min-height:100dvh; padding:clamp(1rem,4vw,2.5rem) clamp(1rem,4vw,2rem); position:relative; overflow:hidden; }
        .content { max-width:880px; margin:0 auto; position:relative; z-index:1; display:flex; flex-direction:column; gap:1.25rem; }

        .orb    { position:fixed; border-radius:50%; pointer-events:none; z-index:0; }
        .orb-tl { width:clamp(280px,45vw,550px); height:clamp(280px,45vw,550px); top:-18%; right:-10%; background:radial-gradient(circle,#FCB216 0%,transparent 70%); opacity:.06; }
        .orb-br { width:clamp(240px,40vw,480px); height:clamp(240px,40vw,480px); bottom:-18%; left:-10%; background:radial-gradient(circle,#D91B57 0%,transparent 70%); opacity:.07; }

        @keyframes fadeUp   { from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:none;} }
        @keyframes spin     { to{transform:rotate(360deg);} }
        @keyframes blink    { 0%,100%{opacity:1;}50%{opacity:.3;} }
        @keyframes shake    { 0%,100%{transform:translateX(0);}20%,60%{transform:translateX(-4px);}40%,80%{transform:translateX(4px);} }
        @keyframes overlayIn{ from{opacity:0;}to{opacity:1;} }
        @keyframes modalUp  { from{opacity:0;transform:translateY(24px) scale(.97);}to{opacity:1;transform:none;} }
        .anim{animation:fadeUp .5s ease both;} .a1{animation-delay:.05s;} .a2{animation-delay:.12s;} .a3{animation-delay:.2s;} .a4{animation-delay:.28s;}
        .spin{animation:spin .9s linear infinite;} .shake{animation:shake .4s ease;}

        .card { background:var(--glass); border:1px solid var(--border); border-radius:var(--r); padding:clamp(1rem,3vw,1.4rem); backdrop-filter:blur(12px); position:relative; overflow:hidden; transition:background .3s,border-color .3s,transform .3s; width:100%; }
        .card::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,.025) 0%,transparent 60%); pointer-events:none; }
        .card:hover   { background:var(--glass-h); border-color:var(--border-h); transform:translateY(-2px); }
        .card-nh:hover{ background:var(--glass)!important; border-color:var(--border)!important; transform:none!important; }
        .card-bar::after { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:var(--grad); border-radius:var(--r) var(--r) 0 0; }
        .d-center { display:flex; flex-direction:column; align-items:center; justify-content:center; }

        .t-green  { background:rgba(74,222,128,.05)!important;  border-color:rgba(74,222,128,.2)!important; }
        .t-green::after  { background:linear-gradient(90deg,#4ade80,#16a34a)!important; }
        .t-blue   { background:rgba(56,189,248,.05)!important;  border-color:rgba(56,189,248,.2)!important; }
        .t-blue::after   { background:linear-gradient(90deg,#38bdf8,#0284c7)!important; }
        .t-orange { background:rgba(251,146,60,.05)!important;  border-color:rgba(251,146,60,.22)!important; }
        .t-orange::after { background:linear-gradient(90deg,#fb923c,#ea580c)!important; }
        .t-disabled { opacity:.35; pointer-events:none; }

        .grid-2 { display:grid; grid-template-columns:repeat(2,1fr); gap:1.1rem; }
        .col-full { grid-column:1/-1; }
        @media(max-width:540px){ .grid-2{grid-template-columns:1fr;} }

        .badge-pill { display:inline-flex; align-items:center; gap:.4rem; padding:.28rem .85rem; border-radius:var(--pill); font-size:.62rem; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; background:rgba(231,88,41,.1); border:1px solid rgba(231,88,41,.28); color:var(--gold); }
        .bdot  { width:6px; height:6px; border-radius:50%; background:var(--gold); animation:blink 2s ease-in-out infinite; }
        .page-title { font-size:clamp(1.8rem,5.5vw,2.8rem); font-weight:800; line-height:1.15; letter-spacing:-.4px; }
        .grad-text  { background:var(--grad); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
        .sub-line   { font-size:.72rem; color:var(--muted); display:flex; align-items:center; gap:.4rem; flex-wrap:wrap; margin-top:.3rem; }
        .sep { width:3px; height:3px; border-radius:50%; background:var(--muted); }

        .card-label { font-size:.59rem; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:1.8px; display:flex; align-items:center; gap:.4rem; margin-bottom:.85rem; }
        .ci-head  { display:flex; align-items:flex-start; justify-content:space-between; gap:.7rem; margin-bottom:.85rem; }
        .ci-title { font-size:clamp(.88rem,2.5vw,1.02rem); font-weight:700; line-height:1.2; }
        .ci-sub   { font-size:.63rem; color:var(--muted); margin-top:.15rem; }
        .ci-time  { font-size:.61rem; color:var(--muted); font-family:'Courier New',monospace; display:flex; align-items:center; gap:.3rem; margin-bottom:.72rem; }
        .ci-time svg { opacity:.5; flex-shrink:0; }
        .meta-key { font-size:.58rem; color:var(--muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:.2rem; }

        .sb      { display:inline-flex; align-items:center; gap:.3rem; padding:.2rem .6rem; border-radius:var(--pill); font-size:.57rem; font-weight:800; text-transform:uppercase; letter-spacing:1px; flex-shrink:0; }
        .sb-ok   { background:rgba(74,222,128,.1);  border:1px solid rgba(74,222,128,.25);  color:var(--success); }
        .sb-wait { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); color:var(--muted); }
        .sb-info { background:rgba(56,189,248,.1);   border:1px solid rgba(56,189,248,.22); color:var(--info); }
        .sb-out  { background:rgba(248,113,113,.1);  border:1px solid rgba(248,113,113,.2); color:var(--danger); }

        .btn      { display:flex; align-items:center; justify-content:center; gap:.42rem; padding:.7rem 1rem; border-radius:12px; border:none; font-family:'Poppins',sans-serif; font-size:clamp(.74rem,2vw,.83rem); font-weight:700; cursor:pointer; transition:transform .2s,box-shadow .2s,background .2s; white-space:nowrap; }
        .btn:disabled { opacity:.4; cursor:not-allowed; }
        .btn:not(:disabled):hover  { transform:translateY(-1px); }
        .btn:not(:disabled):active { transform:scale(.98); }
        .btn-full    { width:100%; }
        .btn-primary { background:var(--grad); color:#fff; box-shadow:0 4px 16px rgba(232,93,36,.25); }
        .btn-primary:not(:disabled):hover { box-shadow:0 6px 22px rgba(232,93,36,.35); }
        .btn-orange  { background:rgba(251,146,60,.1);  border:1px solid rgba(251,146,60,.28);  color:var(--warn); }
        .btn-orange:not(:disabled):hover  { background:rgba(251,146,60,.18); }
        .btn-danger  { background:rgba(248,113,113,.1); border:1px solid rgba(248,113,113,.28); color:var(--danger); }
        .btn-danger:not(:disabled):hover  { background:rgba(248,113,113,.18); }
        .btn-ghost   { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); color:var(--muted); }
        .btn-ghost:not(:disabled):hover   { background:rgba(255,255,255,.1); color:var(--text); }

        .done-banner { display:flex; align-items:center; justify-content:center; gap:.45rem; padding:.58rem 1rem; border-radius:10px; font-size:.63rem; font-weight:800; text-transform:uppercase; letter-spacing:1px; }
        .db-green { background:rgba(74,222,128,.07); border:1px solid rgba(74,222,128,.18); color:var(--success); }

        .profile-bar { display:flex; flex-wrap:wrap; }
        .pi { flex:1; min-width:110px; padding:0 1rem; border-right:1px solid var(--border); }
        .pi:first-child { padding-left:0; } .pi:last-child { border-right:none; }
        .pi-key { font-size:.57rem; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:var(--muted); margin-bottom:.2rem; }
        .pi-val { font-size:clamp(.8rem,2.2vw,.93rem); font-weight:700; line-height:1.3; }
        .pi-sub { font-size:.59rem; color:var(--muted); font-family:'Courier New',monospace; }
        @media(max-width:480px){ .profile-bar{flex-direction:column;gap:.85rem;} .pi{border-right:none;border-bottom:1px solid var(--border);padding:0 0 .85rem;} .pi:last-child{border-bottom:none;padding-bottom:0;} }

        .err-box { display:flex; align-items:flex-start; gap:.5rem; padding:.78rem 1rem; border-radius:12px; background:rgba(248,113,113,.07); border:1px solid rgba(248,113,113,.22); color:var(--danger); font-size:.75rem; line-height:1.5; }
        .err-box svg { flex-shrink:0; margin-top:2px; }

        .load-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1rem; min-height:200px; }
        .load-txt  { font-size:.68rem; letter-spacing:2px; text-transform:uppercase; color:var(--muted); }

        .overlay { position:fixed; inset:0; z-index:100; background:rgba(0,0,0,.72); backdrop-filter:blur(14px); display:flex; align-items:center; justify-content:center; padding:1rem; animation:overlayIn .22s ease both; }
        .modal { width:100%; max-width:350px; background:#141414; border:1px solid rgba(255,255,255,.1); border-radius:22px; padding:clamp(1.4rem,5vw,1.9rem); position:relative; display:flex; flex-direction:column; align-items:center; animation:modalUp .3s cubic-bezier(0.34,1.56,0.64,1) both; box-shadow:0 28px 70px rgba(0,0,0,.6); }
        .modal::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:var(--grad); border-radius:22px 22px 0 0; }
        .modal-otp { max-width:390px; }
        .modal-x { position:absolute; top:.85rem; right:.85rem; width:28px; height:28px; border-radius:8px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); display:flex; align-items:center; justify-content:center; color:var(--muted); cursor:pointer; transition:.2s; }
        .modal-x:hover { background:rgba(255,255,255,.12); color:var(--text); }
        .modal-icon { width:50px; height:50px; border-radius:14px; background:rgba(252,178,22,.1); border:1px solid rgba(252,178,22,.25); display:flex; align-items:center; justify-content:center; margin-bottom:.85rem; }
        .modal-title { font-size:1.05rem; font-weight:800; text-align:center; margin-bottom:.3rem; }
        .modal-msg   { font-size:.72rem; color:var(--muted); text-align:center; line-height:1.55; margin-bottom:1.1rem; }
        .modal-row   { display:flex; gap:.6rem; width:100%; }
        .modal-row .btn { flex:1; }

        .otp-row { display:flex; gap:.65rem; margin-bottom:.85rem; }
        .otp-box { width:clamp(52px,13vw,62px); height:clamp(54px,14vw,66px); border-radius:13px; background:rgba(255,255,255,.05); border:2px solid rgba(255,255,255,.1); color:var(--text); text-align:center; font-family:'Poppins',sans-serif; font-size:clamp(1.3rem,4vw,1.75rem); font-weight:800; outline:none; caret-color:transparent; transition:border-color .2s,background .2s,transform .15s; }
        .otp-box:focus  { border-color:rgba(252,178,22,.6); background:rgba(252,178,22,.06); transform:scale(1.04); }
        .otp-box.filled { border-color:rgba(232,93,36,.5);  background:rgba(232,93,36,.08); }
        .otp-box.errored{ border-color:rgba(248,113,113,.6); background:rgba(248,113,113,.06); animation:shake .4s ease; }
        .otp-err { display:flex; align-items:center; gap:.35rem; font-size:.7rem; color:var(--danger); font-weight:600; margin-bottom:.6rem; }

        .numpad { display:grid; grid-template-columns:repeat(3,1fr); gap:.42rem; width:100%; margin-bottom:.85rem; }
        .np { height:46px; border-radius:11px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); color:var(--text); font-family:'Poppins',sans-serif; font-size:1rem; font-weight:700; cursor:pointer; transition:background .18s,transform .15s; display:flex; align-items:center; justify-content:center; }
        .np:hover:not(:disabled)  { background:rgba(255,255,255,.1); transform:scale(1.04); }
        .np:active:not(:disabled) { transform:scale(.96); }
        .np:disabled { opacity:.3; cursor:not-allowed; }
        .np-del { background:rgba(248,113,113,.07); border-color:rgba(248,113,113,.15); color:var(--danger); }
        .np-del:hover:not(:disabled) { background:rgba(248,113,113,.15); }
      `}</style>

      <ConfirmModal open={confirmOpen} isPending={isPending} onConfirm={handleCheckout} onClose={() => setConfirm(false)} />
      <OTPModal open={otpOpen} isPending={isPending} error={otpErr} onClose={() => { setOtpOpen(false); setOtpErr(null); }} onSubmit={handleOtpSubmit} />

      <div className="root">
        <div className="orb orb-tl" /><div className="orb orb-br" />
        <div className="content">

          {/* Loading */}
          {loading && (
            <div className="card load-wrap anim">
              <Loader2 size={28} className="spin" style={{ color: 'var(--orange)' }} />
              <span className="load-txt">Loading Dashboard</span>
            </div>
          )}

          {/* No session */}
          {!loading && !p && (
            <div className="card load-wrap d-center anim">
              <Sparkles size={28} style={{ color: 'var(--orange)' }} />
              <p style={{ color: 'var(--muted)', fontSize: '.75rem', marginTop: '.75rem', textAlign: 'center' }}>
                No active session found.<br />Please scan your QR code to log in.
              </p>
            </div>
          )}

          {/* Dashboard */}
          {!loading && p && (
            <>
              {/* Header */}
              <div className="anim a1">
                <div className="badge-pill"><span className="bdot" />HackOverflow 4.0</div>
                <h1 className="page-title" style={{ marginTop: '.5rem' }}>
                  Hey, <span className="grad-text">{p.name.split(' ')[0]}</span> 👋
                </h1>
                <div className="sub-line">
                  <span>{p.role || 'Competitor'}</span>
                  {p.labAllotted && <><span className="sep" /><span>{p.labAllotted}</span></>}
                  {p.teamName    && <><span className="sep" /><span>{p.teamName}</span></>}
                </div>
              </div>

              {/* Cards */}
              <div className="grid-2 anim a2">

                {/* College */}
                <div className={`card card-nh card-bar${collegeIn ? ' t-green' : ''}`}>
                  <div className="ci-head">
                    <div>
                      <div className="ci-title">College Entry</div>
                      <div className="ci-sub">Event attendance</div>
                    </div>
                    <span className={`sb ${collegeIn ? 'sb-ok' : 'sb-wait'}`}>
                      {collegeIn ? <><CheckCircle2 size={9} /> Done</> : <><Clock size={9} /> Pending</>}
                    </span>
                  </div>
                  {collegeIn ? (
                    <>
                      <div className="ci-time"><Clock size={11} />{fmtTime(p.collegeCheckIn?.time)}</div>
                      <div className="done-banner db-green"><CheckCircle2 size={12} /> Checked In</div>
                    </>
                  ) : (
                    <button className="btn btn-primary btn-full" onClick={handleCollegeCheckIn} disabled={isPending}>
                      {isPending ? <Loader2 size={14} className="spin" /> : <LogIn size={14} />}
                      Confirm Arrival
                    </button>
                  )}
                </div>

                {/* Lab */}
                <div className={`card card-nh card-bar${
                  !collegeIn ? ' t-disabled' : inLab ? ' t-blue' : labOut ? ' t-orange' : ''
                }`}>
                  <div className="ci-head">
                    <div>
                      <div className="ci-title">Lab Workspace</div>
                      <div className="ci-sub">{p.labAllotted || 'Assigned Lab'}</div>
                    </div>
                    <span className={`sb ${!collegeIn ? 'sb-wait' : inLab ? 'sb-info' : labOut ? 'sb-out' : 'sb-wait'}`}>
                      {!collegeIn ? <><Lock size={9} /> Locked</>
                       : inLab    ? <><CheckCircle2 size={9} /> Active</>
                       : labOut   ? <><XCircle size={9} /> Out</>
                       :            <><Clock size={9} /> Pending</>}
                    </span>
                  </div>

                  {/* Never entered lab */}
                  {!labIn && !labOut && (
                    <button className="btn btn-primary btn-full" onClick={() => { setOtpErr(null); setOtpOpen(true); }} disabled={!collegeIn || isPending}>
                      <KeyRound size={14} />
                      {!collegeIn ? 'Check Into College First' : 'Enter Lab (OTP)'}
                    </button>
                  )}

                  {/* Inside lab */}
                  {inLab && (
                    <>
                      <div className="ci-time"><Clock size={11} />In since {fmtTime(p.labCheckIn?.time)}</div>
                      <button className="btn btn-danger btn-full" onClick={() => setConfirm(true)} disabled={isPending}>
                        {isPending ? <Loader2 size={14} className="spin" /> : <LogOut size={13} />}
                        Leave Lab
                      </button>
                    </>
                  )}

                  {/* Checked out — re-entry */}
                  {labOut && !inLab && (
                    <>
                      <div className="ci-time"><Clock size={11} />Left at {fmtTime(p.labCheckOut?.time)}</div>
                      <button className="btn btn-orange btn-full" onClick={() => { setOtpErr(null); setOtpOpen(true); }} disabled={isPending}>
                        <RefreshCw size={13} /> Re-Enter Lab (OTP)
                      </button>
                    </>
                  )}
                </div>

                {/* WiFi */}
                {(p.wifiCredentials?.ssid || p.wifiCredentials?.password) && (
                  <div className="card col-full anim a3">
                    <div className="card-label"><Wifi size={12} />WiFi</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {p.wifiCredentials.ssid && (
                        <div>
                          <div className="meta-key">Network</div>
                          <div style={{ fontWeight: 700, color: 'var(--gold)' }}>{p.wifiCredentials.ssid}</div>
                        </div>
                      )}
                      {p.wifiCredentials.password && (
                        <div>
                          <div className="meta-key">Password</div>
                          <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>{p.wifiCredentials.password}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Project */}
                {p.projectName && (
                  <div className="card col-full anim a3">
                    <div className="card-label"><FolderGit2 size={12} />Project</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '.35rem' }}>{p.projectName}</div>
                    {p.teamName && (
                      <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>
                        Team: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{p.teamName}</span>
                        {p.teamId && <span style={{ fontFamily: 'monospace', marginLeft: '.4rem', opacity: .6 }}>({p.teamId})</span>}
                      </div>
                    )}
                    {p.projectDescription && (
                      <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: '.4rem', lineHeight: 1.6 }}>{p.projectDescription}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Profile */}
              <div className="card card-bar anim a4">
                <div className="card-label" style={{ marginBottom: '1rem' }}><Users size={12} />Your Info</div>
                <div className="profile-bar">
                  <div className="pi">
                    <div className="pi-key">Name</div>
                    <div className="pi-val">{p.name}</div>
                    <div className="pi-sub">{p.participantId}</div>
                  </div>
                  <div className="pi">
                    <div className="pi-key">Institute</div>
                    <div className="pi-val">{p.institute || 'N/A'}</div>
                    <div className="pi-sub">{p.state || 'India'}</div>
                  </div>
                  <div className="pi">
                    <div className="pi-key">Lab</div>
                    <div className="pi-val">{p.labAllotted || 'TBA'}</div>
                    <div className="pi-sub">{p.role || 'Participant'}</div>
                  </div>
                </div>
              </div>

              {/* Error */}
              {actionErr && (
                <div className="err-box shake anim">
                  <AlertTriangle size={14} /><span>{actionErr}</span>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </>
  );
}