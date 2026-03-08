'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DBParticipant } from '@/types';

type Step = 'lab-checkin' | 'password' | 'success';

export default function LabCheckinPage() {
  const { participantId } = useParams<{ participantId: string }>();
  const router = useRouter();

  const [participant, setParticipant] = useState<DBParticipant | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('lab-checkin');
  const [checking, setChecking] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    fetch(`/api/participant/${participantId}`)
      .then(r => r.json())
      .then(data => {
        if (data.participant) {
          setParticipant(data.participant);
          // Skip lab checkin step if already done
          if (data.participant.labCheckIn?.status) setStep('password');
        }
      })
      .finally(() => setLoading(false));
  }, [participantId]);

  async function handleLabCheckIn() {
    setChecking(true);
    setError('');
    try {
      const res = await fetch('/api/checkin/lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('password');
      } else {
        setError(data.error || 'Lab check-in failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setChecking(false);
    }
  }

  async function handleLogin() {
    if (!password.trim()) { setError('Please enter your password'); return; }
    setLoggingIn(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, password }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('success');
        setTimeout(() => router.push('/portal/dashboard'), 1500);
      } else {
        setError(data.error || 'Invalid password');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoggingIn(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Space+Mono:wght@700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0F0F0F; font-family: 'Poppins', sans-serif; min-height: 100vh; }

        .page {
          min-height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 2rem 1rem; position: relative; overflow: hidden;
        }

        .orb {
          position: fixed; border-radius: 50%; filter: blur(120px);
          pointer-events: none; z-index: 0; animation: pulse 5s ease-in-out infinite;
        }
        .orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(252,178,22,0.09), transparent 70%); top: -150px; right: -100px; }
        .orb-2 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(99,32,95,0.1), transparent 70%); bottom: -100px; left: -100px; animation-delay: -2.5s; }
        .orb-3 { width: 300px; height: 300px; background: radial-gradient(circle, rgba(217,27,87,0.07), transparent 70%); top: 40%; left: 40%; animation-delay: -1s; }
        @keyframes pulse { 0%,100% { opacity:0.8; } 50% { opacity:1.1; } }

        .card {
          position: relative; z-index: 1; width: 100%; max-width: 400px;
          background: rgba(255,255,255,0.03); backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 24px;
          padding: 2.5rem 2rem; animation: fadeUp 0.6s ease both;
        }
        @keyframes fadeUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }

        .badge {
          font-family: 'Space Mono', monospace; font-size: 0.65rem; font-weight: 700;
          letter-spacing: 3px; text-transform: uppercase; padding: 0.35rem 0.9rem;
          border-radius: 50px; background: rgba(232,93,36,0.12);
          border: 1px solid rgba(232,93,36,0.35); color: #FCB216;
          display: inline-block; margin-bottom: 1.75rem;
        }

        .gradient-text {
          background: linear-gradient(90deg, #FCB216, #E85D24, #D91B57);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }

        .step-indicator {
          display: flex; align-items: center; gap: 0.5rem;
          margin-bottom: 1.75rem;
        }
        .step-pip {
          height: 4px; border-radius: 2px; flex: 1;
          background: rgba(255,255,255,0.1); transition: all 0.4s ease;
        }
        .step-pip.active {
          background: linear-gradient(90deg, #FCB216, #E85D24);
        }
        .step-pip.done {
          background: linear-gradient(90deg, #E85D24, #D91B57);
        }

        .icon-wrap {
          width: 64px; height: 64px; border-radius: 50%;
          background: rgba(232,93,36,0.1); border: 2px solid rgba(232,93,36,0.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.8rem; margin-bottom: 1.25rem;
          animation: pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        @keyframes pop { from { transform:scale(0); opacity:0; } to { transform:scale(1); opacity:1; } }

        h2 { font-size: 1.5rem; font-weight: 800; color: #fff; margin-bottom: 0.35rem; }
        .desc { font-size: 0.85rem; color: rgba(255,255,255,0.45); line-height: 1.6; margin-bottom: 1.75rem; }

        .name-chip {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.4rem 0.9rem; border-radius: 50px;
          background: rgba(252,178,22,0.08); border: 1px solid rgba(252,178,22,0.2);
          font-size: 0.82rem; font-weight: 600; color: #FCB216;
          margin-bottom: 1.75rem;
        }

        .lab-info {
          padding: 1rem; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07); border-radius: 14px;
          margin-bottom: 1.5rem;
          display: flex; align-items: center; gap: 0.75rem;
        }
        .lab-icon {
          width: 40px; height: 40px; border-radius: 10px;
          background: rgba(99,32,95,0.2); border: 1px solid rgba(99,32,95,0.4);
          display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;
        }
        .lab-text-label { font-size: 0.65rem; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.35); font-weight: 600; }
        .lab-text-val { font-size: 0.95rem; font-weight: 700; color: #fff; }

        .primary-btn {
          width: 100%; padding: 1rem; border: none; border-radius: 14px;
          background: linear-gradient(90deg, #FCB216, #E85D24, #D91B57, #63205F);
          color: #fff; font-family: 'Poppins', sans-serif; font-size: 1rem;
          font-weight: 700; letter-spacing: 0.5px; cursor: pointer;
          transition: all 0.3s ease; position: relative; overflow: hidden;
        }
        .primary-btn::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          transform: translateX(-100%); animation: shimmer 2.5s ease-in-out infinite;
        }
        @keyframes shimmer { 0% { transform:translateX(-100%); } 100% { transform:translateX(100%); } }
        .primary-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(232,93,36,0.35); }
        .primary-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .input-wrap { position: relative; margin-bottom: 1rem; }
        .pw-input {
          width: 100%; padding: 0.9rem 3rem 0.9rem 1rem;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; color: #fff; font-family: 'Poppins', sans-serif;
          font-size: 1rem; outline: none; transition: all 0.3s ease;
          letter-spacing: 0.05em;
        }
        .pw-input:focus {
          border-color: rgba(232,93,36,0.5);
          background: rgba(255,255,255,0.07);
          box-shadow: 0 0 0 3px rgba(232,93,36,0.1);
        }
        .pw-input::placeholder { color: rgba(255,255,255,0.25); letter-spacing: 0; }

        .toggle-btn {
          position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; font-size: 1.1rem;
          color: rgba(255,255,255,0.4); transition: color 0.2s;
          padding: 0.25rem;
        }
        .toggle-btn:hover { color: rgba(255,255,255,0.8); }

        .hint {
          font-size: 0.75rem; color: rgba(255,255,255,0.3);
          text-align: center; margin-bottom: 1.25rem; line-height: 1.5;
        }
        .hint span { color: rgba(232,93,36,0.7); }

        .error-box {
          padding: 0.75rem 1rem; background: rgba(217,27,87,0.1);
          border: 1px solid rgba(217,27,87,0.3); border-radius: 12px;
          color: #D91B57; font-size: 0.82rem; text-align: center; margin-top: 0.75rem;
          animation: fadeUp 0.3s ease both;
        }

        .success-wrap {
          text-align: center; animation: fadeUp 0.5s ease both;
        }
        .success-circle {
          width: 72px; height: 72px; border-radius: 50%;
          background: linear-gradient(135deg, #FCB216, #E85D24);
          display: flex; align-items: center; justify-content: center;
          font-size: 2rem; margin: 0 auto 1.25rem;
          animation: pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
          box-shadow: 0 0 40px rgba(232,93,36,0.4);
        }
        .success-title { font-size: 1.4rem; font-weight: 800; color: #fff; margin-bottom: 0.4rem; }
        .success-sub { font-size: 0.85rem; color: rgba(255,255,255,0.45); }

        .skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%; animation: skel 1.5s ease-in-out infinite; border-radius: 8px;
        }
        @keyframes skel { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
      `}</style>

      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="page">
        <div className="card">
          <span className="badge">⚡ Hackoverflow 4.0</span>

          {/* Step indicator */}
          <div className="step-indicator">
            <div className={`step-pip ${step === 'lab-checkin' ? 'active' : 'done'}`} />
            <div className={`step-pip ${step === 'password' ? 'active' : step === 'success' ? 'done' : ''}`} />
            <div className={`step-pip ${step === 'success' ? 'done' : ''}`} />
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="skeleton" style={{ height: '64px', width: '64px', borderRadius: '50%' }} />
              <div className="skeleton" style={{ height: '32px', width: '60%' }} />
              <div className="skeleton" style={{ height: '80px' }} />
              <div className="skeleton" style={{ height: '52px' }} />
            </div>
          ) : step === 'lab-checkin' ? (
            <>
              <div className="icon-wrap">🔬</div>
              <h2>You've <span className="gradient-text">Arrived!</span></h2>
              <p className="desc">
                Confirm you've reached your lab. This records your lab check-in
                and unlocks the participant portal.
              </p>

              {participant?.name && (
                <div className="name-chip">👤 {participant.name}</div>
              )}

              {participant?.labAllotted && (
                <div className="lab-info">
                  <div className="lab-icon">🏷️</div>
                  <div>
                    <div className="lab-text-label">Assigned Lab</div>
                    <div className="lab-text-val">{participant.labAllotted}</div>
                  </div>
                </div>
              )}

              <button
                className="primary-btn"
                onClick={handleLabCheckIn}
                disabled={checking}
              >
                {checking ? 'Recording…' : '✅ I\'ve Reached the Lab'}
              </button>

              {error && <div className="error-box">{error}</div>}
            </>
          ) : step === 'password' ? (
            <>
              <div className="icon-wrap" style={{ animationDelay: '0s' }}>🔑</div>
              <h2>Enter your <span className="gradient-text">Password</span></h2>
              <p className="desc">
                Your password was sent to your registered email. Enter it below to
                access the participant portal.
              </p>

              {participant?.email && (
                <p className="hint">
                  Sent to <span>{participant.email}</span>
                </p>
              )}

              <div className="input-wrap">
                <input
                  className="pw-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  autoComplete="current-password"
                  autoFocus
                />
                <button
                  className="toggle-btn"
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              <button
                className="primary-btn"
                onClick={handleLogin}
                disabled={loggingIn}
              >
                {loggingIn ? 'Signing in…' : '🚀 Enter Portal'}
              </button>

              {error && <div className="error-box">{error}</div>}
            </>
          ) : (
            <div className="success-wrap">
              <div className="success-circle">🎉</div>
              <p className="success-title">Welcome to the Portal!</p>
              <p className="success-sub">Redirecting to your dashboard…</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
