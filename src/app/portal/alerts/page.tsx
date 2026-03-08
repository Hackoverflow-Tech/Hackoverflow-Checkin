'use client';

import { useEffect, useState } from 'react';
import {
  Bell,
  BellOff,
  Megaphone,
  Activity,
  Utensils,
  CheckCircle2,
  Info,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Zap,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Alert {
  _id?: string;
  title: string;
  body: string;
  type: string;
  createdAt?: string;
  time?: Date | string;
}

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date | string) {
  const d    = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

// ─── Category config ──────────────────────────────────────────────────────────

type AlertMeta = { Icon: React.ElementType; color: string; bg: string; border: string; label: string };

const TYPE_META: Record<string, AlertMeta> = {
  broadcast: { Icon: Megaphone,    color: '#FCB216', bg: 'rgba(252,178,22,0.10)', border: 'rgba(252,178,22,0.28)', label: 'Announcement' },
  activity:  { Icon: Activity,     color: '#4ade80', bg: 'rgba(74,222,128,0.09)', border: 'rgba(74,222,128,0.28)', label: 'Activity'     },
  meal:      { Icon: Utensils,     color: '#E85D24', bg: 'rgba(232,93,36,0.10)',  border: 'rgba(232,93,36,0.28)',  label: 'Meal'         },
  reminder:  { Icon: Info,         color: '#38bdf8', bg: 'rgba(56,189,248,0.09)', border: 'rgba(56,189,248,0.28)', label: 'Reminder'     },
  urgent:    { Icon: Zap,          color: '#D91B57', bg: 'rgba(217,27,87,0.10)',  border: 'rgba(217,27,87,0.28)',  label: 'Urgent'       },
  default:   { Icon: Bell,         color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', label: 'Alert' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const [broadcasts, setBroadcasts] = useState<Alert[]>([]);
  const [activity,   setActivity]   = useState<Alert[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [permission, setPermission] = useState<PermissionState>('default');
  const [subscribing,setSubscribing]= useState(false);
  const [subSuccess, setSubSuccess] = useState(false);
  const [activeTab,  setActiveTab]  = useState<'all' | 'broadcasts' | 'activity'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) setPermission('unsupported');
    else setPermission(Notification.permission as PermissionState);
    loadAlerts();
  }, []);

  async function loadAlerts() {
    setRefreshing(true);
    try {
      const res  = await fetch('/api/alerts');
      const data = await res.json();
      if (data.broadcasts) setBroadcasts(data.broadcasts);
      if (data.activity)   setActivity(data.activity);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function requestPermission() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    setSubscribing(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as PermissionState);
      if (perm !== 'granted') return;

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });

      await fetch('/api/alerts/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub }),
      });

      setSubSuccess(true);
    } catch (err) {
      console.error('Push subscription error:', err);
    } finally {
      setSubscribing(false);
    }
  }

  const allAlerts: Alert[] = [...broadcasts, ...activity].sort((a, b) => {
    const ta = new Date(a.createdAt || a.time || 0).getTime();
    const tb = new Date(b.createdAt || b.time || 0).getTime();
    return tb - ta;
  });

  const displayed =
    activeTab === 'all'        ? allAlerts  :
    activeTab === 'broadcasts' ? broadcasts :
    activity;

  const isGranted = permission === 'granted' || subSuccess;

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

        html, body {
          background: var(--bg);
          color: var(--text);
          font-family: 'Poppins', sans-serif;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        /* ── Root ── */
        .root {
          min-height: 100dvh;
          padding: clamp(1rem,4vw,3rem) clamp(1rem,4vw,2rem);
          position: relative;
          overflow: hidden;
        }

        .page {
          width: 100%; max-width: 860px;
          margin: 0 auto;
          position: relative; z-index: 1;
          display: flex; flex-direction: column; gap: 1.5rem;
        }

        /* ── Orbs ── */
        .orb { position: fixed; border-radius: 50%; pointer-events: none; z-index: 0; animation: orbPulse 6s ease-in-out infinite alternate; }
        .orb-tl { width: clamp(200px,40vw,500px); height: clamp(200px,40vw,500px); top: -12%; right: -8%; background: radial-gradient(circle, #FCB216 0%, transparent 70%); opacity: 0.06; }
        .orb-br { width: clamp(180px,35vw,440px); height: clamp(180px,35vw,440px); bottom: -12%; left: -8%; background: radial-gradient(circle, #D91B57 0%, transparent 70%); opacity: 0.07; animation-delay: -3s; }
        @keyframes orbPulse { from { opacity: 0.05; transform: scale(1); } to { opacity: 0.11; transform: scale(1.08); } }

        /* ── Animations ── */
        @keyframes fadeUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        .au  { animation: fadeUp 0.5s ease both; }
        .d1  { animation-delay: 0.04s; }
        .d2  { animation-delay: 0.12s; }
        .d3  { animation-delay: 0.20s; }
        .d4  { animation-delay: 0.28s; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.9s linear infinite; }

        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.2; } }

        /* ── Badge ── */
        .badge { display: inline-flex; align-items: center; gap: 0.4rem; width: fit-content; padding: 0.35rem 1rem; border-radius: var(--pill); font-size: clamp(0.58rem,1.4vw,0.68rem); font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; background: rgba(231,88,41,0.12); border: 1px solid rgba(231,88,41,0.35); color: var(--gold); }
        .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); animation: blink 2s ease-in-out infinite; }

        /* ── Header ── */
        .header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
        .header-left { display: flex; flex-direction: column; gap: 0.4rem; }
        .title { font-size: clamp(1.8rem,6vw,3rem); font-weight: 800; line-height: 1.15; letter-spacing: -0.5px; }
        .grad-text { background: var(--grad); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .subtitle { font-size: clamp(0.72rem,2vw,0.82rem); color: var(--muted); display: flex; align-items: center; gap: 0.4rem; }

        .refresh-btn {
          width: 38px; height: 38px;
          border-radius: 12px; border: 1px solid var(--border);
          background: var(--glass); color: var(--muted);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.2s, border-color 0.2s, color 0.2s;
          flex-shrink: 0; margin-top: 0.2rem;
        }
        .refresh-btn:hover { background: var(--glass-h); border-color: var(--border-h); color: var(--gold); }

        /* ── Card ── */
        .card {
          background: var(--glass);
          border: 1px solid var(--border);
          border-radius: var(--r);
          padding: clamp(1rem,3vw,1.5rem);
          position: relative; overflow: hidden; width: 100%;
          backdrop-filter: blur(10px);
          transition: background 0.3s, border-color 0.3s;
        }
        .card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.025) 0%, transparent 60%); pointer-events: none; }
        .card-accent::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--grad); border-radius: var(--r) var(--r) 0 0; }
        .lbl { font-size: 0.62rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 1.8px; display: flex; align-items: center; gap: 0.4rem; margin-bottom: 1rem; }

        /* ── Permission banner ── */
        .perm-banner {
          border-radius: var(--r);
          padding: clamp(1rem,3vw,1.4rem);
          position: relative; overflow: hidden;
          backdrop-filter: blur(10px);
        }
        .perm-banner::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; border-radius: var(--r) var(--r) 0 0; }

        .perm-banner.perm-default { background: rgba(252,178,22,0.06); border: 1px solid rgba(252,178,22,0.22); }
        .perm-banner.perm-default::before { background: linear-gradient(90deg, #FCB216, #E85D24); }

        .perm-banner.perm-granted { background: rgba(74,222,128,0.05); border: 1px solid rgba(74,222,128,0.22); }
        .perm-banner.perm-granted::before { background: linear-gradient(90deg, #4ade80, #16a34a); }

        .perm-banner.perm-denied { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); }

        .perm-row { display: flex; align-items: flex-start; gap: 0.85rem; margin-bottom: 1rem; }
        .perm-row:last-child { margin-bottom: 0; }

        .perm-icon {
          width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .perm-icon.pi-default { background: rgba(252,178,22,0.14); }
        .perm-icon.pi-granted { background: rgba(74,222,128,0.14); }
        .perm-icon.pi-denied  { background: rgba(255,255,255,0.06); }

        .perm-title { font-size: clamp(0.85rem,2.2vw,0.95rem); font-weight: 700; margin-bottom: 0.2rem; }
        .perm-desc  { font-size: clamp(0.72rem,2vw,0.78rem); color: var(--muted); line-height: 1.55; }

        .perm-btn {
          width: 100%; padding: 0.78rem 1rem;
          border: none; border-radius: 12px;
          font-family: 'Poppins', sans-serif;
          font-size: clamp(0.78rem,2vw,0.88rem); font-weight: 700;
          cursor: pointer; transition: transform 0.25s, box-shadow 0.25s;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          background: var(--grad); color: #fff;
        }
        .perm-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(232,93,36,0.3); }
        .perm-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        /* ── Tabs ── */
        .tabs { display: flex; gap: 0.45rem; flex-wrap: wrap; }

        .tab-btn {
          padding: 0.48rem 1rem; border-radius: var(--pill);
          background: var(--glass); border: 1px solid var(--border);
          color: var(--muted);
          font-family: 'Poppins', sans-serif; font-size: clamp(0.68rem,1.8vw,0.76rem); font-weight: 700;
          cursor: pointer; transition: 0.22s;
          display: flex; align-items: center; gap: 0.4rem;
        }
        .tab-btn:hover { background: var(--glass-h); border-color: var(--border-h); color: var(--text); }
        .tab-btn.active { background: rgba(231,88,41,0.12); border-color: rgba(231,88,41,0.4); color: var(--gold); }

        .tab-count {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 0 0.4rem; height: 17px; border-radius: 6px;
          background: rgba(255,255,255,0.08);
          font-size: 0.58rem; font-weight: 800; color: var(--muted);
        }
        .tab-btn.active .tab-count { background: rgba(252,178,22,0.2); color: var(--gold); }

        /* ── Alert List ── */
        .alert-list { display: flex; flex-direction: column; gap: 0.6rem; }

        /* ── Alert Card ── */
        .alert-card {
          display: flex; align-items: flex-start; gap: 0.85rem;
          padding: clamp(0.85rem,2.5vw,1.1rem);
          border-radius: 14px;
          background: var(--glass);
          border: 1px solid var(--border);
          position: relative; overflow: hidden;
          transition: background 0.25s, border-color 0.25s, transform 0.25s;
          backdrop-filter: blur(8px);
          animation: fadeUp 0.4s ease both;
        }
        .alert-card:hover { background: var(--glass-h); transform: translateX(3px); }
        .alert-card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 60%); pointer-events: none; }

        /* Left accent stripe coloured by type */
        .alert-card::after { content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 3px; border-radius: 14px 0 0 14px; }

        .alert-icon-wrap {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }

        .alert-body { flex: 1; min-width: 0; }

        .alert-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.25rem; }
        .alert-title { font-size: clamp(0.82rem,2.2vw,0.9rem); font-weight: 700; line-height: 1.3; }
        .alert-time { font-size: 0.6rem; color: rgba(255,255,255,0.28); white-space: nowrap; flex-shrink: 0; margin-top: 2px; }

        .alert-desc { font-size: clamp(0.72rem,2vw,0.78rem); color: var(--muted); line-height: 1.55; margin-bottom: 0.5rem; }

        .alert-type-pill {
          display: inline-flex; align-items: center; gap: 0.25rem;
          padding: 0.18rem 0.6rem; border-radius: var(--pill);
          font-size: 0.56rem; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.8px;
        }

        /* ── Skeleton ── */
        .skel-wrap { display: flex; flex-direction: column; gap: 0.6rem; }
        .skel { border-radius: 14px; background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%); background-size: 200% 100%; animation: shimmer 1.5s ease-in-out infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        /* ── Empty ── */
        .empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.6rem; min-height: 200px; color: var(--muted); text-align: center; }
        .empty-icon { width: 52px; height: 52px; border-radius: 50%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; }
        .empty-title { font-size: 0.9rem; font-weight: 700; color: rgba(255,255,255,0.3); }
        .empty-sub { font-size: 0.72rem; color: rgba(255,255,255,0.2); }

        /* ── Loading center ── */
        .loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; min-height: 240px; }
        .loading-txt { font-size: 0.68rem; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); }
      `}</style>

      <div className="root">
        <div className="orb orb-tl" />
        <div className="orb orb-br" />

        <div className="page">

          {/* ── Header ── */}
          <div className="header au d1">
            <div className="header-left">
              <span className="badge"><span className="badge-dot" />HackOverflow 4.0</span>
              <h1 className="title"><span className="grad-text">Alerts</span></h1>
              <p className="subtitle">
                <Bell size={13} />
                <span>Announcements, reminders &amp; your activity</span>
              </p>
            </div>
            <button
              className="refresh-btn"
              onClick={loadAlerts}
              title="Refresh alerts"
              disabled={refreshing}
            >
              <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            </button>
          </div>

          {/* ── Permission Banner ── */}
          {permission === 'default' && (
            <div className="perm-banner perm-default card-accent au d2">
              <div className="perm-row">
                <div className="perm-icon pi-default">
                  <Bell size={18} color="#FCB216" />
                </div>
                <div>
                  <div className="perm-title">Stay in the loop</div>
                  <div className="perm-desc">
                    Enable push notifications to receive real-time announcements from the HackOverflow team directly on your device.
                  </div>
                </div>
              </div>
              <button
                className="perm-btn"
                onClick={requestPermission}
                disabled={subscribing}
              >
                {subscribing
                  ? <><Loader2 size={14} className="spin" /> Setting up…</>
                  : <><Bell size={14} /> Enable Notifications</>}
              </button>
            </div>
          )}

          {isGranted && (
            <div className="perm-banner perm-granted au d2">
              <div className="perm-row" style={{ marginBottom: 0 }}>
                <div className="perm-icon pi-granted">
                  <ShieldCheck size={18} color="var(--success)" />
                </div>
                <div>
                  <div className="perm-title" style={{ color: 'var(--success)' }}>Notifications enabled</div>
                  <div className="perm-desc">
                    You'll receive push notifications for important announcements from the organizers.
                  </div>
                </div>
              </div>
            </div>
          )}

          {permission === 'denied' && (
            <div className="perm-banner perm-denied au d2">
              <div className="perm-row" style={{ marginBottom: 0 }}>
                <div className="perm-icon pi-denied">
                  <BellOff size={18} color="rgba(255,255,255,0.3)" />
                </div>
                <div>
                  <div className="perm-title" style={{ color: 'rgba(255,255,255,0.45)' }}>Notifications blocked</div>
                  <div className="perm-desc">
                    Tap the lock icon in your browser's address bar and allow notifications to stay updated.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Tabs ── */}
          <div className="tabs au d3">
            {([
              { key: 'all',        label: 'All',           count: allAlerts.length    },
              { key: 'broadcasts', label: 'Announcements', count: broadcasts.length   },
              { key: 'activity',   label: 'My Activity',   count: activity.length     },
            ] as const).map(tab => (
              <button
                key={tab.key}
                className={`tab-btn${activeTab === tab.key ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                <span className="tab-count">{tab.count}</span>
              </button>
            ))}
          </div>

          {/* ── Alert List ── */}
          <div className="au d4">
            {loading ? (
              <div className="skel-wrap">
                {[90, 75, 90, 75].map((h, i) => (
                  <div key={i} className="skel" style={{ height: `${h}px` }} />
                ))}
              </div>
            ) : displayed.length === 0 ? (
              <div className="card">
                <div className="empty">
                  <div className="empty-icon">
                    <Bell size={22} color="rgba(255,255,255,0.2)" strokeWidth={1.5} />
                  </div>
                  <div className="empty-title">No alerts yet</div>
                  <div className="empty-sub">
                    {activeTab === 'activity' ? 'Your activity will appear here once the event begins.' : 'Check back when the event starts.'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert-list">
                {displayed.map((alert, i) => {
                  const meta      = TYPE_META[alert.type] ?? TYPE_META.default;
                  const Icon      = meta.Icon;
                  const timestamp = alert.createdAt || alert.time;

                  return (
                    <div
                      key={alert._id || i}
                      className="alert-card"
                      style={{
                        borderColor: meta.border,
                        animationDelay: `${i * 0.04}s`,
                      }}
                    >
                      {/* Coloured left stripe */}
                      <style>{`.alert-card:nth-child(${i + 1})::after { background: ${meta.color}; opacity: 0.5; }`}</style>

                      {/* Icon */}
                      <div
                        className="alert-icon-wrap"
                        style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
                      >
                        <Icon size={16} color={meta.color} />
                      </div>

                      {/* Body */}
                      <div className="alert-body">
                        <div className="alert-top">
                          <div className="alert-title">{alert.title}</div>
                          {timestamp && (
                            <div className="alert-time">{timeAgo(timestamp)}</div>
                          )}
                        </div>
                        <div className="alert-desc">{alert.body}</div>
                        <span
                          className="alert-type-pill"
                          style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }}
                        >
                          <Icon size={8} />
                          {meta.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}