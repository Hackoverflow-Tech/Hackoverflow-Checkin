'use client';

import { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  FlaskConical,
  Wifi,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Users,
  FolderGit2,
  Copy,
  Check,
  Loader2,
  LogOut,
  Eye,
  EyeOff,
  UtensilsCrossed,
} from 'lucide-react';
import type { DBParticipant } from '@/types';
import { MEAL_LABELS } from '@/types';

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [participant, setParticipant] = useState<DBParticipant | null>(null);
  const [loading, setLoading]         = useState(true);
  const [copied, setCopied]           = useState<string | null>(null);
  const [showPass, setShowPass]       = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const authRes  = await fetch('/api/auth/verify');
        const authData = await authRes.json();
        if (!authData.participantId) return;

        const partRes  = await fetch(`/api/participant/${authData.participantId}`);
        const partData = await partRes.json();
        if (alive && partData.participant) setParticipant(partData.participant);
      } catch (err) {
        console.error('[ProfilePage] fetch error:', err);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => { alive = false; };
  }, []);

  function copyText(text: string, key: string) {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  function getInitials(name: string) {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  const p = participant;

  // Meal rows from MealStatus + MEAL_LABELS
  const mealRows = p?.meals
    ? (Object.keys(MEAL_LABELS) as Array<keyof typeof MEAL_LABELS>).map(key => ({
        key,
        label: MEAL_LABELS[key],
        collected: p.meals![key],
      }))
    : [];

  function formatDate(d?: Date | string) {
    if (!d) return null;
    return new Date(d).toLocaleString([], {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400 ;600;700;800&display=swap');

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
        .orb-tl { width: clamp(200px,40vw,500px); height: clamp(200px,40vw,500px); top: -12%; right: -8%; background: radial-gradient(circle, #63205F 0%, transparent 70%); opacity: 0.07; }
        .orb-br { width: clamp(180px,35vw,440px); height: clamp(180px,35vw,440px); bottom: -12%; left: -8%; background: radial-gradient(circle, #E85D24 0%, transparent 70%); opacity: 0.06; animation-delay: -3s; }
        @keyframes orbPulse { from { opacity: 0.05; transform: scale(1); } to { opacity: 0.11; transform: scale(1.08); } }

        /* Animations */
        @keyframes fadeUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        .au { animation: fadeUp 0.5s ease both; }
        .d1 { animation-delay: 0.04s; } .d2 { animation-delay: 0.12s; } .d3 { animation-delay: 0.20s; } .d4 { animation-delay: 0.28s; } .d5 { animation-delay: 0.36s; }

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

        /* Card */
        .card { background: var(--glass); border: 1px solid var(--border); border-radius: var(--r); padding: clamp(1rem,3vw,1.5rem); position: relative; overflow: hidden; width: 100%; backdrop-filter: blur(10px); transition: background 0.3s, border-color 0.3s; }
        .card:hover { background: var(--glass-h); border-color: var(--border-h); }
        .card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.025) 0%, transparent 60%); pointer-events: none; }
        .card-accent::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--grad); border-radius: var(--r) var(--r) 0 0; }
        .lbl { font-size: 0.62rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 1.8px; display: flex; align-items: center; gap: 0.4rem; margin-bottom: 1rem; }

        /* Grid */
        .g2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        @media (max-width: 540px) { .g2 { grid-template-columns: 1fr; } }
        .span2 { grid-column: 1 / -1; }

        /* ── Avatar hero card ── */
        .hero { display: flex; align-items: center; gap: 1.2rem; flex-wrap: wrap; }
        .avatar-wrap { position: relative; flex-shrink: 0; }
        .avatar {
          width: clamp(64px,12vw,80px); height: clamp(64px,12vw,80px);
          border-radius: 20px;
          background: linear-gradient(135deg, #E85D24 0%, #63205F 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: clamp(1.2rem,3vw,1.6rem); font-weight: 800;
          color: #fff; flex-shrink: 0;
          border: 2px solid rgba(255,255,255,0.1);
        }
        .avatar-ring {
          position: absolute; inset: -4px; border-radius: 24px;
          background: var(--grad); opacity: 0.3; z-index: -1;
          filter: blur(4px);
        }

        .hero-info { flex: 1; min-width: 0; }
        .hero-name { font-size: clamp(1.2rem,4vw,1.7rem); font-weight: 800; line-height: 1.2; word-break: break-word; }
        .hero-role { font-size: 0.72rem; color: var(--muted); margin-top: 0.2rem; }
        .hero-id {
          display: inline-flex; align-items: center; gap: 0.4rem;
          margin-top: 0.5rem;
          font-size: 0.62rem; color: var(--muted);
          font-family: 'Courier New', monospace;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          padding: 0.2rem 0.6rem; border-radius: 6px;
        }
        .copy-btn { background: none; border: none; cursor: pointer; color: var(--muted); display: flex; align-items: center; padding: 0; transition: color 0.2s; font-family: inherit; }
        .copy-btn:hover { color: var(--gold); }

        /* ── Info rows ── */
        .info-list { display: flex; flex-direction: column; gap: 0; }
        .info-row {
          display: flex; align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          gap: 0.75rem;
        }
        .info-row:first-child { padding-top: 0; }
        .info-row:last-child { border-bottom: none; padding-bottom: 0; }

        .info-icon { width: 32px; height: 32px; border-radius: 9px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; color: var(--gold); flex-shrink: 0; }
        .info-key { font-size: 0.6rem; color: var(--muted); text-transform: uppercase; letter-spacing: 1.2px; font-weight: 600; }
        .info-val { font-size: clamp(0.78rem,2vw,0.88rem); font-weight: 600; word-break: break-all; margin-top: 1px; }
        .info-body { flex: 1; min-width: 0; }

        /* ── Meal rows ── */
        .meal-grid { display: flex; flex-direction: column; gap: 0; }
        .meal-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.65rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          gap: 0.75rem;
        }
        .meal-row:last-child { border-bottom: none; }
        .meal-label { font-size: 0.82rem; font-weight: 600; }

        /* ── WiFi card ── */
        .wifi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 400px) { .wifi-grid { grid-template-columns: 1fr; } }
        .wifi-item { display: flex; flex-direction: column; gap: 0.25rem; }
        .wifi-key { font-size: 0.6rem; color: var(--muted); text-transform: uppercase; letter-spacing: 1.2px; font-weight: 600; }
        .wifi-val { font-size: 0.9rem; font-weight: 700; color: var(--gold); display: flex; align-items: center; gap: 0.4rem; word-break: break-all; }
        .pass-toggle { background: none; border: none; cursor: pointer; color: var(--muted); display: flex; align-items: center; font-family: inherit; transition: color 0.2s; }
        .pass-toggle:hover { color: var(--gold); }

        /* ── Logout button ── */
        .logout-btn {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          width: 100%; padding: 0.75rem 1.5rem;
          border-radius: 12px; border: 1px solid rgba(217,27,87,0.3);
          background: rgba(217,27,87,0.06);
          color: rgba(217,27,87,0.8); font-size: 0.78rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 1px;
          cursor: pointer; transition: 0.25s; font-family: 'Poppins', sans-serif;
        }
        .logout-btn:hover { background: rgba(217,27,87,0.12); border-color: rgba(217,27,87,0.5); color: var(--pink); }
      `}</style>

      <div className="root">
        <div className="orb orb-tl" />
        <div className="orb orb-br" />

        <div className="page">
          {loading ? (
            <div className="card loading-wrap au d1">
              <Loader2 size={26} className="spin" style={{ color: 'var(--orange)' }} />
              <span className="loading-txt">Loading Profile</span>
            </div>
          ) : p ? (
            <>
              {/* Header */}
              <div className="au d1" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span className="badge"><span className="badge-dot" />HackOverflow 4.0</span>
                <h1 className="title">Your <span className="grad-text">Profile</span></h1>
              </div>

              {/* Avatar hero */}
              <div className="card card-accent au d2">
                <div className="hero">
                  <div className="avatar-wrap">
                    <div className="avatar">{getInitials(p.name)}</div>
                    <div className="avatar-ring" />
                  </div>
                  <div className="hero-info">
                    <div className="hero-name">{p.name}</div>
                    <div className="hero-role">{p.role || 'Participant'}{p.institute ? ` · ${p.institute}` : ''}</div>
                    <div className="hero-id">
                      <span>{p.participantId}</span>
                      <button className="copy-btn" onClick={() => copyText(p.participantId, 'pid')}>
                        {copied === 'pid'
                          ? <Check size={11} style={{ color: 'var(--success)' }} />
                          : <Copy size={11} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main grid */}
              <div className="g2 au d3">

                {/* Personal Info */}
                <div className="card">
                  <div className="lbl"><User size={12} />Personal Info</div>
                  <div className="info-list">
                    {[
                      { icon: Mail,      key: 'Email',    val: p.email },
                      { icon: Phone,     key: 'Phone',    val: p.phone },
                      { icon: Building2, key: 'Institute',val: p.institute },
                      { icon: MapPin,    key: 'State',    val: p.state },
                    ].filter(r => r.val).map((row, i) => {
                      const Icon = row.icon;
                      return (
                        <div className="info-row" key={i}>
                          <div className="info-icon"><Icon size={14} /></div>
                          <div className="info-body">
                            <div className="info-key">{row.key}</div>
                            <div className="info-val">{row.val}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Team & Project */}
                <div className="card">
                  <div className="lbl"><Users size={12} />Team & Project</div>
                  <div className="info-list">
                    {[
                      { icon: Users,        key: 'Team Name',    val: p.teamName },
                      { icon: ShieldCheck,  key: 'Team ID',      val: p.teamId },
                      { icon: FolderGit2,   key: 'Project',      val: p.projectName },
                      { icon: FlaskConical, key: 'Lab Allotted', val: p.labAllotted },
                    ].filter(r => r.val).map((row, i) => {
                      const Icon = row.icon;
                      return (
                        <div className="info-row" key={i}>
                          <div className="info-icon"><Icon size={14} /></div>
                          <div className="info-body">
                            <div className="info-key">{row.key}</div>
                            <div className="info-val">{row.val}</div>
                          </div>
                        </div>
                      );
                    })}
                    {!p.teamName && !p.projectName && !p.labAllotted && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>No team assigned yet.</p>
                    )}
                  </div>
                </div>

                {/* Meal Status */}
                {p.meals && (
                  <div className="card">
                    <div className="lbl"><UtensilsCrossed size={12} />Meal Status</div>
                    <div className="meal-grid">
                      {mealRows.map((m) => (
                        <div className="meal-row" key={m.key}>
                          <span className="meal-label">{m.label}</span>
                          <span className={`status-pill ${m.collected ? 'sp-yes' : 'sp-no'}`}>
                            {m.collected
                              ? <><CheckCircle2 size={9} /> Collected</>
                              : <><Clock size={9} /> Pending</>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* WiFi Credentials */}
                {(p.wifiCredentials?.ssid || p.wifiCredentials?.password) && (
                  <div className="card">
                    <div className="lbl"><Wifi size={12} />WiFi Credentials</div>
                    <div className="wifi-grid">
                      {p.wifiCredentials.ssid && (
                        <div className="wifi-item">
                          <span className="wifi-key">Network (SSID)</span>
                          <div className="wifi-val">
                            {p.wifiCredentials.ssid}
                            <button className="copy-btn" onClick={() => copyText(p.wifiCredentials!.ssid!, 'ssid')}>
                              {copied === 'ssid' ? <Check size={11} style={{ color: 'var(--success)' }} /> : <Copy size={11} />}
                            </button>
                          </div>
                        </div>
                      )}
                      {p.wifiCredentials.password && (
                        <div className="wifi-item">
                          <span className="wifi-key">Password</span>
                          <div className="wifi-val">
                            <span style={{ letterSpacing: showPass ? '0' : '2px' }}>
                              {showPass ? p.wifiCredentials.password : '••••••••'}
                            </span>
                            <button className="pass-toggle" onClick={() => setShowPass(v => !v)}>
                              {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                            <button className="copy-btn" onClick={() => copyText(p.wifiCredentials!.password!, 'pass')}>
                              {copied === 'pass' ? <Check size={11} style={{ color: 'var(--success)' }} /> : <Copy size={11} />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* Logout */}
              <div className="au d5">
                <button className="logout-btn" onClick={handleLogout}>
                  <LogOut size={15} />
                  Sign Out of Portal
                </button>
              </div>
            </>
          ) : (
            <div className="card loading-wrap au d1">
              <User size={30} style={{ opacity: 0.2 }} />
              <span className="loading-txt">Profile not found</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}