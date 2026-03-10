'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DBParticipant } from '@/types';
import { verifyAndLoginAction } from '@/actions/password';

export default function LabCheckInPage() {
  const { participantId } = useParams<{ participantId: string }>();
  const router = useRouter();

  const [participant, setParticipant] = useState<DBParticipant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Step 1 — lab check-in
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);

  // Step 2 — password gate
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [logging, setLogging] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/participant/${participantId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else {
          setParticipant(data.participant);
          // Already checked in before → skip straight to password gate
          if (data.participant.labCheckIn?.status && !data.participant.labCheckOut?.status)
            setCheckedIn(true);
        }
      })
      .catch(() => setError('Failed to load participant'))
      .finally(() => setLoading(false));
  }, [participantId]);

  async function handleLabCheckIn() {
    setCheckingIn(true);
    setError('');
    try {
      const res = await fetch('/api/checkin/lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId }),
      });
      const data = await res.json();
      if (data.success) {
        setCheckedIn(true);
      } else {
        setError(data.error || 'Lab check-in failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  }

  async function handleLogin() {
    setError('');
    if (!password) { setError('Please enter your password.'); return; }
    setLogging(true);
    try {
      const result = await verifyAndLoginAction(participantId, password);
      if (!result.success) { setError(result.error ?? 'Incorrect password.'); return; }
      setDone(true);
      setTimeout(() => router.push('/portal/dashboard'), 1200);
    } finally {
      setLogging(false);
    }
  }

  const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');
    *, *::before, *::after{box-sizing:border-box;margin:0;padding:0;}
    body{background:#0F0F0F;font-family:'Poppins',sans-serif;min-height:100vh;overflow-x:hidden;}
    .page{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem 1rem;position:relative;overflow:hidden;}
    .orb{position:fixed;border-radius:50%;filter:blur(120px);pointer-events:none;z-index:0;animation:pulse 5s ease-in-out infinite;}
    .orb-1{width:500px;height:500px;background:radial-gradient(circle,rgba(252,178,22,0.1),transparent 70%);top:-150px;left:-150px;}
    .orb-2{width:600px;height:600px;background:radial-gradient(circle,rgba(217,27,87,0.08),transparent 70%);bottom:-200px;right:-150px;animation-delay:-2.5s;}
    .orb-3{width:400px;height:400px;background:radial-gradient(circle,rgba(232,93,36,0.07),transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);animation-delay:-1.5s;}
    @keyframes pulse{0%,100%{opacity:.8;transform:scale(1);}50%{opacity:1;transform:scale(1.08);}}
    .card{position:relative;z-index:1;width:100%;max-width:420px;background:rgba(255,255,255,0.03);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:2.5rem 2rem;animation:fadeUp .7s ease both;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(30px);}to{opacity:1;transform:translateY(0);}}
    .logo-row{display:flex;align-items:center;justify-content:center;margin-bottom:2rem;}
    .logo-badge{font-family:'Space Mono',monospace;font-size:.7rem;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:.4rem 1rem;border-radius:50px;background:rgba(232,93,36,0.12);border:1px solid rgba(232,93,36,0.35);color:#FCB216;}
    .gradient-text{background:linear-gradient(90deg,#FCB216 0%,#E85D24 35%,#D91B57 70%,#63205F 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
    .step-row{display:flex;align-items:center;justify-content:center;gap:.5rem;margin-bottom:1.75rem;}
    .step{display:flex;align-items:center;gap:.4rem;font-size:.7rem;font-weight:600;letter-spacing:1px;text-transform:uppercase;}
    .step-dot{width:8px;height:8px;border-radius:50%;}
    .step-done .step-dot{background:#FCB216;}.step-done span{color:rgba(255,255,255,0.5);}
    .step-active .step-dot{background:linear-gradient(90deg,#E85D24,#D91B57);box-shadow:0 0 8px rgba(232,93,36,0.6);}.step-active span{color:#fff;}
    .step-pending .step-dot{background:rgba(255,255,255,0.15);}.step-pending span{color:rgba(255,255,255,0.25);}
    .step-line{width:20px;height:1px;background:rgba(255,255,255,0.1);}
    .section-label{font-size:.75rem;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.4);text-align:center;margin-bottom:.5rem;}
    .name{font-size:2rem;font-weight:800;text-align:center;line-height:1.15;}
    .divider{width:60px;height:3px;background:linear-gradient(90deg,#FCB216,#E85D24,#D91B57);border-radius:2px;margin:1rem auto;}
    .lab-spotlight{position:relative;margin:1.25rem 0 1.5rem;padding:1.25rem 1.5rem;border-radius:16px;background:rgba(232,93,36,0.06);border:1px solid rgba(232,93,36,0.2);overflow:hidden;}
    .lab-spotlight::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(252,178,22,0.04),transparent 60%);pointer-events:none;}
    .lab-spotlight-label{font-size:.65rem;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(232,93,36,0.8);margin-bottom:.3rem;}
    .lab-spotlight-value{font-family:'Space Mono',monospace;font-size:1.6rem;font-weight:700;background:linear-gradient(90deg,#FCB216,#E85D24);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1.1;}
    .lab-spotlight-sub{font-size:.75rem;color:rgba(255,255,255,0.35);margin-top:.3rem;}
    .lab-icon{position:absolute;right:1.25rem;top:50%;transform:translateY(-50%);font-size:2.5rem;opacity:.15;}
    .info-grid{display:flex;flex-direction:column;gap:.65rem;margin-bottom:1.5rem;}
    .info-row{display:flex;align-items:center;gap:.75rem;padding:.7rem 1rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;animation:fadeUp .7s ease both;}
    .info-icon{font-size:1rem;width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:rgba(232,93,36,0.1);border-radius:8px;flex-shrink:0;}
    .info-content{flex:1;min-width:0;}
    .info-label{font-size:.62rem;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.35);}
    .info-value{font-size:.88rem;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .team-badge{font-family:'Space Mono',monospace;font-size:.62rem;padding:.2rem .6rem;border-radius:50px;background:rgba(99,32,95,0.3);border:1px solid rgba(99,32,95,0.6);color:#D91B57;letter-spacing:1px;white-space:nowrap;}
    .btn-primary{width:100%;padding:1rem;border:none;border-radius:14px;background:linear-gradient(90deg,#FCB216 0%,#E85D24 35%,#D91B57 70%,#63205F 100%);color:#fff;font-family:'Poppins',sans-serif;font-size:1rem;font-weight:700;letter-spacing:1px;cursor:pointer;transition:all .3s ease;position:relative;overflow:hidden;}
    .btn-primary::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent);transform:translateX(-100%);animation:shimmer 2.5s ease-in-out infinite;}
    @keyframes shimmer{0%{transform:translateX(-100%);}100%{transform:translateX(100%);}}
    .btn-primary:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 30px rgba(232,93,36,0.4);}
    .btn-primary:disabled{opacity:.7;cursor:not-allowed;}

    /* Password gate — slides in after check-in */
    .pw-gate{animation:fadeUp .5s ease both;}
    .pw-header{text-align:center;margin-bottom:1.5rem;}
    .pw-icon{width:52px;height:52px;border-radius:50%;background:rgba(252,178,22,0.12);border:1px solid rgba(252,178,22,0.25);display:flex;align-items:center;justify-content:center;font-size:1.4rem;margin:0 auto .75rem;}
    .pw-title{font-size:1.2rem;font-weight:700;color:#fff;margin-bottom:.25rem;}
    .pw-sub{font-size:.82rem;color:rgba(255,255,255,0.4);line-height:1.5;}
    .field{display:flex;flex-direction:column;gap:.4rem;margin-bottom:1rem;}
    .field-label{font-size:.7rem;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.4);padding-left:.25rem;}
    .input-wrap{position:relative;}
    .input{width:100%;padding:.85rem 1rem;padding-right:3rem;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:12px;color:#fff;font-family:'Poppins',sans-serif;font-size:.95rem;font-weight:500;outline:none;transition:border-color .2s,box-shadow .2s;}
    .input::placeholder{color:rgba(255,255,255,0.2);}
    .input:focus{border-color:rgba(232,93,36,0.5);box-shadow:0 0 0 3px rgba(232,93,36,0.1);}
    .toggle-btn{position:absolute;right:.85rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.3);padding:.25rem;display:flex;align-items:center;transition:color .2s;}
    .toggle-btn:hover{color:rgba(255,255,255,0.7);}
    .error-box{padding:.75rem 1rem;background:rgba(217,27,87,0.1);border:1px solid rgba(217,27,87,0.3);border-radius:12px;color:#D91B57;font-size:.85rem;text-align:center;margin-bottom:1rem;}
    .success-state{text-align:center;animation:fadeUp .5s ease both;}
    .success-icon{width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#FCB216,#E85D24);display:flex;align-items:center;justify-content:center;font-size:1.8rem;margin:0 auto 1rem;animation:pop .4s cubic-bezier(0.34,1.56,0.64,1) both;}
    @keyframes pop{from{transform:scale(0);opacity:0;}to{transform:scale(1);opacity:1;}}
    .success-title{font-size:1.3rem;font-weight:700;color:#fff;margin-bottom:.3rem;}
    .success-sub{font-size:.85rem;color:rgba(255,255,255,0.5);}
    .skeleton{background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%);background-size:200% 100%;animation:skel 1.5s ease-in-out infinite;border-radius:8px;}
    @keyframes skel{0%{background-position:200% 0;}100%{background-position:-200% 0;}}
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
            <div className="step step-done"><div className="step-dot" /><span>Password</span></div>
            <div className="step-line" />
            <div className="step step-active"><div className="step-dot" /><span>Lab</span></div>
            <div className="step-line" />
            <div className="step step-pending"><div className="step-dot" /><span>Portal</span></div>
          </div>

          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div className="skeleton" style={{ height:'16px', width:'40%', margin:'0 auto' }} />
              <div className="skeleton" style={{ height:'44px', width:'65%', margin:'0 auto' }} />
              <div className="skeleton" style={{ height:'80px', borderRadius:'16px' }} />
              <div className="skeleton" style={{ height:'52px' }} />
              <div className="skeleton" style={{ height:'52px' }} />
              <div className="skeleton" style={{ height:'52px', marginTop:'.5rem' }} />
            </div>
          ) : error && !participant ? (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>😕</div>
              <p style={{ color:'#D91B57', fontWeight:600 }}>{error}</p>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'.85rem', marginTop:'.5rem' }}>Please contact event staff for help.</p>
            </div>
          ) : participant ? (
            <>
              {done ? (
                <div className="success-state">
                  <div className="success-icon">🚀</div>
                  <p className="success-title">All Set!</p>
                  <p className="success-sub">Opening your portal…</p>
                </div>

              ) : checkedIn ? (
                /* ── Password gate ───────────────────────────────────────────── */
                <div className="pw-gate">
                  <div className="pw-header">
                    <div className="pw-icon">🔐</div>
                    <p className="pw-title">Lab Confirmed!</p>
                    <p className="pw-sub">Enter your password to open the portal.</p>
                  </div>

                  {participant.labAllotted && (
                    <div className="lab-spotlight" style={{ marginBottom:'1.25rem' }}>
                      <div className="lab-spotlight-label">Your Lab</div>
                      <div className="lab-spotlight-value">{participant.labAllotted}</div>
                      <div className="lab-icon">🔬</div>
                    </div>
                  )}

                  {error && <div className="error-box">{error}</div>}

                  <div className="field">
                    <label className="field-label">Password</label>
                    <div className="input-wrap">
                      <input className="input" type={showPassword ? 'text' : 'password'} value={password}
                        onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
                        onKeyDown={e => e.key === 'Enter' && handleLogin()} autoFocus />
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

                  <button className="btn-primary" onClick={handleLogin} disabled={logging}>
                    {logging ? 'Verifying…' : '🚀 Enter Portal →'}
                  </button>
                </div>

              ) : (
                /* ── Lab check-in view ───────────────────────────────────────── */
                <>
                  <p className="section-label">Almost there</p>
                  <h1 className="name gradient-text">{participant.name}</h1>
                  <div className="divider" />

                  <div className="lab-spotlight">
                    <div className="lab-spotlight-label">Your Lab Assignment</div>
                    <div className="lab-spotlight-value">{participant.labAllotted || 'Not assigned'}</div>
                    <div className="lab-spotlight-sub">{participant.labAllotted ? 'Head to this lab after check-in' : 'Ask a volunteer for your lab'}</div>
                    <div className="lab-icon">🔬</div>
                  </div>

                  <div className="info-grid">
                    {participant.role && (
                      <div className="info-row">
                        <div className="info-icon">🎯</div>
                        <div className="info-content"><div className="info-label">Role</div><div className="info-value">{participant.role}</div></div>
                      </div>
                    )}
                    {(participant.teamName || participant.teamId) && (
                      <div className="info-row">
                        <div className="info-icon">👥</div>
                        <div className="info-content"><div className="info-label">Team</div><div className="info-value">{participant.teamName || '—'}</div></div>
                        {participant.teamId && <span className="team-badge">{participant.teamId}</span>}
                      </div>
                    )}
                    {participant.institute && (
                      <div className="info-row">
                        <div className="info-icon">🏛️</div>
                        <div className="info-content"><div className="info-label">Institute</div><div className="info-value">{participant.institute}</div></div>
                      </div>
                    )}
                  </div>

                  {error && <div className="error-box">{error}</div>}

                  <button className="btn-primary" onClick={handleLabCheckIn} disabled={checkingIn}>
                    {checkingIn ? 'Checking in…' : '🔬 Confirm Lab Check-In'}
                  </button>
                </>
              )}
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}