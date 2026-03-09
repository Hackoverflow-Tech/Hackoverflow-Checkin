'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTeamMembersAction, loginAction, TeamMemberPreview } from '@/actions/login';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'team' | 'member' | 'password';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('team');
  const [teamId, setTeamId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState<TeamMemberPreview[]>([]);
  const [selectedMember, setSelectedMember] = useState<TeamMemberPreview | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const teamInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'team') teamInputRef.current?.focus();
    if (step === 'password') setTimeout(() => passwordInputRef.current?.focus(), 100);
  }, [step]);

  function triggerShake(msg: string) {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 600);
  }

  // Step 1: find team
  async function handleFindTeam() {
    if (!teamId.trim()) { triggerShake('Enter your Team ID from your ID card.'); return; }
    setLoading(true);
    setError('');
    const res = await getTeamMembersAction(teamId);
    setLoading(false);
    if (!res.success || !res.members) { triggerShake(res.error ?? 'Team not found.'); return; }
    setMembers(res.members);
    setTeamName(res.teamName ?? '');
    setStep('member');
  }

  // Step 2: pick member
  function handlePickMember(m: TeamMemberPreview) {
    setSelectedMember(m);
    setPassword('');
    setError('');
    setStep('password');
  }

  // Step 3: login
  async function handleLogin() {
    if (!password.trim()) { triggerShake('Enter your password.'); return; }
    if (!selectedMember) return;
    setLoading(true);
    setError('');
    const res = await loginAction(selectedMember.participantId, password);
    setLoading(false);
    if (!res.success) { triggerShake(res.error ?? 'Login failed.'); return; }
    router.push('/portal/dashboard');
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0F0F0F;
          --card: rgba(255,255,255,0.04);
          --border: rgba(255,255,255,0.08);
          --border-hover: rgba(255,255,255,0.18);
          --g1: #FCB216;
          --g2: #E85D24;
          --g3: #D91B57;
          --g4: #63205F;
          --text: #FFFFFF;
          --muted: rgba(255,255,255,0.45);
        }

        body { background: var(--bg); color: var(--text); font-family: 'Poppins', sans-serif; min-height: 100vh; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-20px) scale(1.04); }
        }
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes memberIn {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(252,178,22,0.3); }
          50%       { box-shadow: 0 0 0 8px rgba(252,178,22,0); }
        }

        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem 1rem;
          position: relative;
          overflow: hidden;
        }

        /* Orb backgrounds */
        .orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          animation: orbFloat 8s ease-in-out infinite;
        }
        .orb-1 {
          width: 340px; height: 340px;
          background: radial-gradient(circle, rgba(252,178,22,0.18) 0%, transparent 70%);
          top: -80px; right: -80px;
          animation-delay: 0s;
        }
        .orb-2 {
          width: 280px; height: 280px;
          background: radial-gradient(circle, rgba(217,27,87,0.15) 0%, transparent 70%);
          bottom: -60px; left: -60px;
          animation-delay: -3s;
        }
        .orb-3 {
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(99,32,95,0.2) 0%, transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: -5s;
        }

        /* Card */
        .card {
          width: 100%;
          max-width: 420px;
          background: var(--card);
          border: 1px solid var(--border);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 2.5rem 2rem;
          animation: fadeUp 0.5s ease forwards;
          position: relative;
          z-index: 1;
        }

        /* Logo / brand */
        .brand {
          text-align: center;
          margin-bottom: 2rem;
        }
        .brand-logo {
          font-size: 1rem;
          font-weight: 800;
          letter-spacing: 0.15em;
          background: linear-gradient(90deg, var(--g1), var(--g2), var(--g3), var(--g4));
          background-size: 300% 300%;
          animation: gradientShift 4s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.3rem;
        }
        .brand-sub {
          font-size: 0.72rem;
          letter-spacing: 0.1em;
          color: var(--muted);
          font-weight: 600;
        }

        /* Step indicator */
        .steps {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          margin-bottom: 2rem;
        }
        .step-dot {
          width: 28px; height: 4px;
          border-radius: 2px;
          background: var(--border);
          transition: all 0.3s ease;
        }
        .step-dot.active {
          background: linear-gradient(90deg, var(--g1), var(--g2));
          width: 44px;
        }
        .step-dot.done {
          background: rgba(74,222,128,0.5);
        }

        /* Heading */
        .step-title {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 0.4rem;
          line-height: 1.25;
        }
        .step-desc {
          font-size: 0.8rem;
          color: var(--muted);
          margin-bottom: 1.75rem;
          line-height: 1.5;
        }

        /* Input */
        .input-wrap {
          position: relative;
          margin-bottom: 1rem;
        }
        .input-label {
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: var(--muted);
          margin-bottom: 0.45rem;
          display: block;
        }
        .input-field {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 0.85rem 1rem;
          font-size: 1rem;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          color: var(--text);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          letter-spacing: 0.05em;
          -webkit-appearance: none;
        }
        .input-field::placeholder { color: rgba(255,255,255,0.2); font-weight: 400; }
        .input-field:focus {
          border-color: rgba(252,178,22,0.5);
          box-shadow: 0 0 0 3px rgba(252,178,22,0.08);
        }
        .input-field.password-field { padding-right: 3rem; }

        .pw-toggle {
          position: absolute;
          right: 1rem;
          bottom: 0.85rem;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--muted);
          font-size: 0.85rem;
          padding: 0;
          line-height: 1;
          transition: color 0.2s;
        }
        .pw-toggle:hover { color: var(--text); }

        /* Primary button */
        .btn-primary {
          width: 100%;
          padding: 0.9rem 1rem;
          background: linear-gradient(135deg, var(--g1), var(--g2), var(--g3));
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 0.85rem;
          font-weight: 700;
          font-family: 'Poppins', sans-serif;
          letter-spacing: 0.12em;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
          margin-top: 0.5rem;
          -webkit-appearance: none;
        }
        .btn-primary:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; animation: none; background: rgba(255,255,255,0.1); }

        /* Back button */
        .btn-back {
          background: none;
          border: none;
          color: var(--muted);
          font-size: 0.78rem;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0;
          margin-bottom: 1.5rem;
          transition: color 0.2s;
          letter-spacing: 0.05em;
        }
        .btn-back:hover { color: var(--text); }

        /* Error */
        .error-msg {
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.25);
          border-radius: 8px;
          padding: 0.7rem 0.9rem;
          font-size: 0.78rem;
          color: #f87171;
          margin-top: 0.75rem;
          line-height: 1.45;
          font-weight: 500;
        }

        /* Shake */
        .shake { animation: shake 0.5s ease; }

        /* Spinner */
        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }

        /* Member grid */
        .member-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.65rem;
          margin-bottom: 0.5rem;
        }
        @media (max-width: 340px) {
          .member-grid { grid-template-columns: 1fr; }
        }

        .member-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1rem 0.85rem;
          cursor: pointer;
          text-align: left;
          font-family: 'Poppins', sans-serif;
          color: var(--text);
          transition: border-color 0.2s, background 0.2s, transform 0.15s;
          animation: memberIn 0.3s ease forwards;
          opacity: 0;
          -webkit-appearance: none;
        }
        .member-card:hover {
          border-color: rgba(252,178,22,0.35);
          background: rgba(252,178,22,0.06);
          transform: translateY(-2px);
        }
        .member-card:active { transform: translateY(0); }
        .member-card .m-name {
          font-size: 0.88rem;
          font-weight: 700;
          line-height: 1.3;
          margin-bottom: 0.25rem;
        }
        .member-card .m-role {
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--muted);
          text-transform: uppercase;
        }
        .member-card .m-avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--g1), var(--g3));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 0.5rem;
        }

        /* Selected member chip */
        .selected-chip {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(252,178,22,0.08);
          border: 1px solid rgba(252,178,22,0.25);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          margin-bottom: 1.5rem;
          animation: pulse 2.5s ease-in-out infinite;
        }
        .selected-chip .chip-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--g1), var(--g3));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: 800;
          color: #fff;
          flex-shrink: 0;
        }
        .selected-chip .chip-name {
          font-size: 0.95rem;
          font-weight: 700;
        }
        .selected-chip .chip-role {
          font-size: 0.65rem;
          color: var(--muted);
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* Team badge */
        .team-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 0.3rem 0.75rem;
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--muted);
          letter-spacing: 0.08em;
          margin-bottom: 1.25rem;
        }
        .team-badge span { color: var(--g1); }
      `}</style>

      <div className="page">
        {/* Orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <div className={`card ${shake ? 'shake' : ''}`}>
          {/* Brand */}
          <div className="brand">
            <div className="brand-logo">HACKOVERFLOW 4.0</div>
            <div className="brand-sub">PARTICIPANT PORTAL</div>
          </div>

          {/* Step dots */}
          <div className="steps">
            <div className={`step-dot ${step === 'team' ? 'active' : 'done'}`} />
            <div className={`step-dot ${step === 'member' ? 'active' : step === 'password' ? 'done' : ''}`} />
            <div className={`step-dot ${step === 'password' ? 'active' : ''}`} />
          </div>

          {/* ── Step 1: Enter Team ID ──────────────────────────────── */}
          {step === 'team' && (
            <div>
              <div className="step-title">Find your team</div>
              <div className="step-desc">Enter the Team ID printed on your ID card.</div>

              <label className="input-label">TEAM ID</label>
              <input
                ref={teamInputRef}
                className="input-field"
                placeholder="e.g. T042"
                value={teamId}
                onChange={e => { setTeamId(e.target.value.toUpperCase()); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleFindTeam()}
                maxLength={10}
                autoComplete="off"
                autoCapitalize="characters"
              />

              {error && <div className="error-msg">⚠ {error}</div>}

              <button className="btn-primary" onClick={handleFindTeam} disabled={loading}>
                {loading ? <span className="spinner" /> : 'FIND TEAM →'}
              </button>
            </div>
          )}

          {/* ── Step 2: Pick your name ─────────────────────────────── */}
          {step === 'member' && (
            <div>
              <button className="btn-back" onClick={() => { setStep('team'); setError(''); }}>
                ← BACK
              </button>

              <div className="team-badge">TEAM <span>{teamName || teamId}</span></div>

              <div className="step-title">Who are you?</div>
              <div className="step-desc">Tap your name from the list below.</div>

              <div className="member-grid">
                {members.map((m, i) => (
                  <button
                    key={m.participantId}
                    className="member-card"
                    style={{ animationDelay: `${i * 60}ms` }}
                    onClick={() => handlePickMember(m)}
                  >
                    <div className="m-avatar">{m.name.charAt(0).toUpperCase()}</div>
                    <div className="m-name">{m.name}</div>
                    {m.role && <div className="m-role">{m.role}</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 3: Enter password ─────────────────────────────── */}
          {step === 'password' && selectedMember && (
            <div>
              <button className="btn-back" onClick={() => { setStep('member'); setError(''); setPassword(''); }}>
                ← BACK
              </button>

              {/* Selected member chip */}
              <div className="selected-chip">
                <div className="chip-avatar">{selectedMember.name.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="chip-name">{selectedMember.name}</div>
                  {selectedMember.role && <div className="chip-role">{selectedMember.role}</div>}
                </div>
              </div>

              <div className="step-title">Enter password</div>
              <div className="step-desc">Use the password you were given during registration.</div>

              <label className="input-label">PASSWORD</label>
              <div className="input-wrap">
                <input
                  ref={passwordInputRef}
                  className="input-field password-field"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  autoComplete="current-password"
                />
                <button
                  className="pw-toggle"
                  onClick={() => setShowPassword(p => !p)}
                  type="button"
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>

              {error && <div className="error-msg">⚠ {error}</div>}

              <button className="btn-primary" onClick={handleLogin} disabled={loading}>
                {loading ? <span className="spinner" /> : 'LOG IN →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}