'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { setPasswordAction } from '@/actions/password';

export default function SetPasswordPage() {
  const { participantId } = useParams<{ participantId: string }>();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    setError('');
    if (!password) { setError('Please enter a password.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const result = await setPasswordAction(participantId, password);
      if (!result.success) { setError(result.error ?? 'Something went wrong.'); return; }
      setDone(true);
      setTimeout(() => router.push(`/lab-checkin/${participantId}`), 1500);
    } finally {
      setLoading(false);
    }
  }

  const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    body { background:#0F0F0F; font-family:'Poppins',sans-serif; min-height:100vh; overflow-x:hidden; }
    .page { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2rem 1rem; position:relative; overflow:hidden; }
    .orb { position:fixed; border-radius:50%; filter:blur(120px); pointer-events:none; z-index:0; animation:pulse 5s ease-in-out infinite; }
    .orb-1 { width:500px; height:500px; background:radial-gradient(circle,rgba(252,178,22,0.1),transparent 70%); top:-150px; left:-150px; }
    .orb-2 { width:600px; height:600px; background:radial-gradient(circle,rgba(217,27,87,0.08),transparent 70%); bottom:-200px; right:-150px; animation-delay:-2.5s; }
    .orb-3 { width:400px; height:400px; background:radial-gradient(circle,rgba(232,93,36,0.07),transparent 70%); top:50%; left:50%; transform:translate(-50%,-50%); animation-delay:-1.5s; }
    @keyframes pulse { 0%,100%{opacity:.8;transform:scale(1);}50%{opacity:1;transform:scale(1.08);} }
    .card { position:relative; z-index:1; width:100%; max-width:420px; background:rgba(255,255,255,0.03); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.1); border-radius:24px; padding:2.5rem 2rem; animation:fadeUp .7s ease both; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(30px);}to{opacity:1;transform:translateY(0);} }
    .logo-row { display:flex; align-items:center; justify-content:center; margin-bottom:2rem; }
    .logo-badge { font-family:'Space Mono',monospace; font-size:.7rem; font-weight:700; letter-spacing:3px; text-transform:uppercase; padding:.4rem 1rem; border-radius:50px; background:rgba(232,93,36,0.12); border:1px solid rgba(232,93,36,0.35); color:#FCB216; }
    .gradient-text { background:linear-gradient(90deg,#FCB216 0%,#E85D24 35%,#D91B57 70%,#63205F 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
    .step-row { display:flex; align-items:center; justify-content:center; gap:.5rem; margin-bottom:1.75rem; }
    .step { display:flex; align-items:center; gap:.4rem; font-size:.7rem; font-weight:600; letter-spacing:1px; text-transform:uppercase; }
    .step-dot { width:8px; height:8px; border-radius:50%; }
    .step-done .step-dot{background:#FCB216;} .step-done span{color:rgba(255,255,255,0.5);}
    .step-active .step-dot{background:linear-gradient(90deg,#E85D24,#D91B57);box-shadow:0 0 8px rgba(232,93,36,0.6);} .step-active span{color:#fff;}
    .step-pending .step-dot{background:rgba(255,255,255,0.15);} .step-pending span{color:rgba(255,255,255,0.25);}
    .step-line { width:20px; height:1px; background:rgba(255,255,255,0.1); }
    .section-label { font-size:.75rem; font-weight:600; letter-spacing:3px; text-transform:uppercase; color:rgba(255,255,255,0.4); text-align:center; margin-bottom:.5rem; }
    .title { font-size:2rem; font-weight:800; text-align:center; line-height:1.15; }
    .subtitle { text-align:center; color:rgba(255,255,255,0.4); font-size:.85rem; margin-top:.5rem; line-height:1.5; }
    .divider { width:60px; height:3px; background:linear-gradient(90deg,#FCB216,#E85D24,#D91B57); border-radius:2px; margin:1rem auto 1.75rem; }
    .field-group { display:flex; flex-direction:column; gap:1rem; }
    .field { display:flex; flex-direction:column; gap:.4rem; }
    .field-label { font-size:.7rem; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:rgba(255,255,255,0.4); padding-left:.25rem; }
    .input-wrap { position:relative; }
    .input { width:100%; padding:.85rem 1rem; padding-right:3rem; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:#fff; font-family:'Poppins',sans-serif; font-size:.95rem; font-weight:500; outline:none; transition:border-color .2s,box-shadow .2s; }
    .input::placeholder{color:rgba(255,255,255,0.2);}
    .input:focus{border-color:rgba(232,93,36,0.5);box-shadow:0 0 0 3px rgba(232,93,36,0.1);}
    .toggle-btn { position:absolute; right:.85rem; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:rgba(255,255,255,0.3); padding:.25rem; display:flex; align-items:center; transition:color .2s; }
    .toggle-btn:hover{color:rgba(255,255,255,0.7);}
    .btn-primary { width:100%; padding:1rem; border:none; border-radius:14px; background:linear-gradient(90deg,#FCB216 0%,#E85D24 35%,#D91B57 70%,#63205F 100%); color:#fff; font-family:'Poppins',sans-serif; font-size:1rem; font-weight:700; letter-spacing:1px; cursor:pointer; transition:all .3s ease; position:relative; overflow:hidden; margin-top:.5rem; }
    .btn-primary::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent);transform:translateX(-100%);animation:shimmer 2.5s ease-in-out infinite;}
    @keyframes shimmer{0%{transform:translateX(-100%);}100%{transform:translateX(100%);}}
    .btn-primary:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 30px rgba(232,93,36,0.4);}
    .btn-primary:disabled{opacity:.7;cursor:not-allowed;}
    .error-box{padding:.75rem 1rem;background:rgba(217,27,87,0.1);border:1px solid rgba(217,27,87,0.3);border-radius:12px;color:#D91B57;font-size:.85rem;text-align:center;}
    .success-state{text-align:center;animation:fadeUp .5s ease both;}
    .success-icon{width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#FCB216,#E85D24);display:flex;align-items:center;justify-content:center;font-size:1.8rem;margin:0 auto 1rem;animation:pop .4s cubic-bezier(0.34,1.56,0.64,1) both;}
    @keyframes pop{from{transform:scale(0);opacity:0;}to{transform:scale(1);opacity:1;}}
    .success-title{font-size:1.3rem;font-weight:700;color:#fff;margin-bottom:.3rem;}
    .success-sub{font-size:.85rem;color:rgba(255,255,255,0.5);}
    .dot{position:fixed;width:4px;height:4px;border-radius:50%;opacity:.4;animation:float 3s ease-in-out infinite;z-index:0;}
    @keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-15px);}}
  `;

  const DOTS = [
    { top:'15%', left:'8%',   color:'#FCB216', delay:'0s'   },
    { top:'25%', right:'10%', color:'#E85D24', delay:'0.5s' },
    { top:'70%', left:'5%',   color:'#D91B57', delay:'1s'   },
    { top:'80%', right:'8%',  color:'#FCB216', delay:'1.5s' },
    { top:'45%', left:'92%',  color:'#63205F', delay:'0.8s' },
  ];

  return (
    <>
      <style>{STYLES}</style>
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      {DOTS.map((d, i) => (
        <div key={i} className="dot" style={{ top:d.top, left:(d as any).left, right:(d as any).right, background:d.color, animationDelay:d.delay }} />
      ))}

      <div className="page">
        <div className="card">
          <div className="logo-row"><span className="logo-badge">⚡ Hackoverflow 4.0</span></div>

          <div className="step-row">
            <div className="step step-done"><div className="step-dot" /><span>Check-In</span></div>
            <div className="step-line" />
            <div className="step step-active"><div className="step-dot" /><span>Password</span></div>
            <div className="step-line" />
            <div className="step step-pending"><div className="step-dot" /><span>Lab</span></div>
            <div className="step-line" />
            <div className="step step-pending"><div className="step-dot" /><span>Portal</span></div>
          </div>

          {done ? (
            <div className="success-state">
              <div className="success-icon">🔐</div>
              <p className="success-title">Password Set!</p>
              <p className="success-sub">Taking you to lab check-in…</p>
            </div>
          ) : (
            <>
              <p className="section-label">Almost there</p>
              <h1 className="title gradient-text">Create Password</h1>
              <p className="subtitle">Set a password to access your portal throughout the event.</p>
              <div className="divider" />

              <div className="field-group">
                <div className="field">
                  <label className="field-label">Password</label>
                  <div className="input-wrap">
                    <input className="input" type={showPassword ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)} placeholder="Choose a password" />
                    <button className="toggle-btn" type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)}>
                      {showPassword ? (
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">Confirm Password</label>
                  <input className="input" type={showPassword ? 'text' : 'password'} value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter your password"
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                </div>

                {error && <div className="error-box">{error}</div>}

                <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Saving…' : '🔐 Set Password & Continue →'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}