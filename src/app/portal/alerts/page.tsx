'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Megaphone, Activity, Utensils, CheckCircle, Info, RefreshCw } from 'lucide-react';

interface Alert {
  _id?: string;
  title: string;
  body: string;
  type: string;
  createdAt?: string;
  time?: Date | string;
}

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

function timeAgo(date: Date | string) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_META: Record<string, { icon: typeof Bell; color: string; bg: string; border: string; label: string }> = {
  broadcast: { icon: Megaphone,    color: '#FCB216', bg: 'rgba(252,178,22,0.08)',  border: 'rgba(252,178,22,0.2)',  label: 'Announcement' },
  activity:  { icon: CheckCircle,  color: '#22c55e', bg: 'rgba(34,197,94,0.07)',   border: 'rgba(34,197,94,0.2)',   label: 'Activity' },
  meal:      { icon: Utensils,     color: '#E85D24', bg: 'rgba(232,93,36,0.08)',   border: 'rgba(232,93,36,0.2)',   label: 'Meal' },
  reminder:  { icon: Info,         color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)',  label: 'Reminder' },
  default:   { icon: Bell,         color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', label: 'Alert' },
};

export default function AlertsPage() {
  const [broadcasts, setBroadcasts]       = useState<Alert[]>([]);
  const [activity, setActivity]           = useState<Alert[]>([]);
  const [loading, setLoading]             = useState(true);
  const [permission, setPermission]       = useState<PermissionState>('default');
  const [subscribing, setSubscribing]     = useState(false);
  const [subSuccess, setSubSuccess]       = useState(false);
  const [activeTab, setActiveTab]         = useState<'all' | 'broadcasts' | 'activity'>('all');
  const [refreshing, setRefreshing]       = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) {
      setPermission('unsupported');
    } else {
      setPermission(Notification.permission as PermissionState);
    }
    loadAlerts();
  }, []);

  async function loadAlerts() {
    setRefreshing(true);
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      if (data.broadcasts) setBroadcasts(data.broadcasts);
      if (data.activity) setActivity(data.activity);
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

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
  }

  const allAlerts: Alert[] = [
    ...broadcasts,
    ...activity,
  ].sort((a, b) => {
    const ta = new Date(a.createdAt || a.time || 0).getTime();
    const tb = new Date(b.createdAt || b.time || 0).getTime();
    return tb - ta;
  });

  const displayed =
    activeTab === 'all'        ? allAlerts :
    activeTab === 'broadcasts' ? broadcasts :
    activity;

  return (
    <>
      <style>{`
        .alerts-page {
          min-height: 100vh; padding: 2rem 1.5rem;
          max-width: 700px; position: relative;
        }
        .orb {
          position: fixed; border-radius: 50%; filter: blur(120px);
          pointer-events: none; z-index: 0; animation: pulse 5s ease-in-out infinite;
        }
        .orb-1 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(252,178,22,0.08), transparent 70%); top: -100px; right: -50px; }
        .orb-2 { width: 350px; height: 350px; background: radial-gradient(circle, rgba(217,27,87,0.07), transparent 70%); bottom: 100px; left: -50px; animation-delay:-2s; }
        @keyframes pulse { 0%,100%{opacity:.8;} 50%{opacity:1.1;} }

        .inner { position: relative; z-index: 1; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px);} to{opacity:1;transform:translateY(0);} }

        /* Header */
        .page-header { margin-bottom: 1.5rem; animation: fadeUp 0.5s ease both; display: flex; align-items: flex-start; justify-content: space-between; }
        .header-left {}
        .page-label { font-size: 0.65rem; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: rgba(255,255,255,0.3); margin-bottom: 0.35rem; }
        .page-title { font-size: 1.8rem; font-weight: 800; color: #fff; line-height: 1.1; }
        .gradient-text { background: linear-gradient(90deg, #FCB216, #E85D24, #D91B57); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .page-sub { font-size: 0.82rem; color: rgba(255,255,255,0.35); margin-top: 0.35rem; }

        .refresh-btn {
          width: 36px; height: 36px; border-radius: 10px; border: none; cursor: pointer;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; margin-top: 0.25rem;
          color: rgba(255,255,255,0.4);
        }
        .refresh-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .refresh-btn.spinning svg { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Permission banner */
        .perm-banner {
          border-radius: 18px; padding: 1.25rem 1.4rem;
          margin-bottom: 1.5rem; position: relative; overflow: hidden;
          animation: fadeUp 0.5s ease both 0.05s;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .perm-banner.default { background: rgba(252,178,22,0.06); border-color: rgba(252,178,22,0.2); }
        .perm-banner.granted { background: rgba(34,197,94,0.06); border-color: rgba(34,197,94,0.2); }
        .perm-banner.denied  { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.08); }

        .perm-banner::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
        }
        .perm-banner.default::before { background: linear-gradient(90deg, #FCB216, #E85D24); }
        .perm-banner.granted::before { background: linear-gradient(90deg, #22c55e, #16a34a); }

        .perm-top { display: flex; align-items: flex-start; gap: 0.85rem; margin-bottom: 0.85rem; }
        .perm-icon-wrap {
          width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .perm-icon-wrap.default { background: rgba(252,178,22,0.12); }
        .perm-icon-wrap.granted { background: rgba(34,197,94,0.12); }
        .perm-icon-wrap.denied  { background: rgba(255,255,255,0.05); }

        .perm-title { font-size: 0.92rem; font-weight: 700; color: #fff; margin-bottom: 0.2rem; }
        .perm-desc { font-size: 0.78rem; color: rgba(255,255,255,0.4); line-height: 1.5; }

        .perm-btn {
          width: 100%; padding: 0.75rem; border: none; border-radius: 12px;
          font-family: 'Poppins', sans-serif; font-size: 0.88rem; font-weight: 700;
          cursor: pointer; transition: all 0.25s ease; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        }
        .perm-btn.default {
          background: linear-gradient(90deg, #FCB216, #E85D24);
          color: #fff;
        }
        .perm-btn.default:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(232,93,36,0.3); }
        .perm-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Tabs */
        .tabs {
          display: flex; gap: 0.4rem; margin-bottom: 1.5rem;
          animation: fadeUp 0.5s ease both 0.1s;
        }
        .tab-btn {
          padding: 0.5rem 1rem; border-radius: 50px; border: none; cursor: pointer;
          font-family: 'Poppins', sans-serif; font-size: 0.75rem; font-weight: 600;
          transition: all 0.2s ease; letter-spacing: 0.3px;
        }
        .tab-btn.active {
          background: rgba(232,93,36,0.15); border: 1px solid rgba(232,93,36,0.35); color: #E85D24;
        }
        .tab-btn:not(.active) {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.4);
        }
        .tab-btn:not(.active):hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.7); }
        .tab-count {
          display: inline-flex; align-items: center; justify-content: center;
          width: 18px; height: 18px; border-radius: 50%;
          background: rgba(255,255,255,0.1); font-size: 0.6rem; font-weight: 700;
          margin-left: 0.3rem; color: rgba(255,255,255,0.5);
        }
        .tab-btn.active .tab-count { background: rgba(232,93,36,0.3); color: #E85D24; }

        /* Alert list */
        .alert-list { display: flex; flex-direction: column; gap: 0.65rem; animation: fadeUp 0.5s ease both 0.15s; }

        .alert-card {
          padding: 1rem 1.1rem; border-radius: 16px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          transition: all 0.22s ease; position: relative; overflow: hidden;
          display: flex; gap: 0.9rem; align-items: flex-start;
        }
        .alert-card:hover { transform: translateX(3px); background: rgba(255,255,255,0.05); }

        .alert-icon-wrap {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }

        .alert-body { flex: 1; min-width: 0; }
        .alert-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.25rem; }
        .alert-title { font-size: 0.88rem; font-weight: 700; color: #fff; line-height: 1.3; }
        .alert-time { font-family: 'Space Mono', monospace; font-size: 0.6rem; color: rgba(255,255,255,0.25); white-space: nowrap; flex-shrink: 0; }
        .alert-desc { font-size: 0.78rem; color: rgba(255,255,255,0.4); line-height: 1.5; margin-bottom: 0.4rem; }
        .alert-type-tag {
          font-size: 0.58rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
          padding: 0.15rem 0.5rem; border-radius: 50px;
        }

        /* Empty */
        .empty {
          text-align: center; padding: 3rem 1rem;
          animation: fadeUp 0.5s ease both;
        }
        .empty-icon { margin: 0 auto 1rem; width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; }
        .empty-title { font-size: 0.95rem; font-weight: 700; color: rgba(255,255,255,0.4); margin-bottom: 0.3rem; }
        .empty-sub { font-size: 0.78rem; color: rgba(255,255,255,0.25); }

        /* Skeleton */
        .skel { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%); background-size: 200% 100%; animation: skel 1.5s ease-in-out infinite; border-radius: 12px; }
        @keyframes skel { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }

        @media (max-width: 480px) {
          .alerts-page { padding: 1.5rem 1rem; }
          .page-title { font-size: 1.5rem; }
        }
      `}</style>

      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div className="alerts-page">
        <div className="inner">

          {/* Header */}
          <div className="page-header">
            <div className="header-left">
              <div className="page-label">Hackoverflow 4.0</div>
              <h1 className="page-title"><span className="gradient-text">Alerts</span></h1>
              <p className="page-sub">Announcements, reminders & your activity.</p>
            </div>
            <button className={`refresh-btn${refreshing ? ' spinning' : ''}`} onClick={loadAlerts}>
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Notification permission banner */}
          {permission === 'default' && (
            <div className="perm-banner default">
              <div className="perm-top">
                <div className="perm-icon-wrap default">
                  <Bell size={18} color="#FCB216" strokeWidth={2} />
                </div>
                <div>
                  <div className="perm-title">Stay in the loop</div>
                  <div className="perm-desc">Enable push notifications to get real-time announcements from the Hackoverflow team directly on your phone.</div>
                </div>
              </div>
              <button
                className="perm-btn default"
                onClick={requestPermission}
                disabled={subscribing}
              >
                <Bell size={15} strokeWidth={2.5} />
                {subscribing ? 'Setting up…' : 'Enable Notifications'}
              </button>
            </div>
          )}

          {(permission === 'granted' || subSuccess) && (
            <div className="perm-banner granted">
              <div className="perm-top">
                <div className="perm-icon-wrap granted">
                  <CheckCircle size={18} color="#22c55e" strokeWidth={2} />
                </div>
                <div>
                  <div className="perm-title">Notifications enabled</div>
                  <div className="perm-desc">You'll receive push notifications for important announcements from the organizers.</div>
                </div>
              </div>
            </div>
          )}

          {permission === 'denied' && (
            <div className="perm-banner denied">
              <div className="perm-top">
                <div className="perm-icon-wrap denied">
                  <BellOff size={18} color="rgba(255,255,255,0.3)" strokeWidth={2} />
                </div>
                <div>
                  <div className="perm-title" style={{ color: 'rgba(255,255,255,0.5)' }}>Notifications blocked</div>
                  <div className="perm-desc">You've blocked notifications. To enable them, tap the lock icon in your browser's address bar and allow notifications.</div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="tabs">
            {(['all', 'broadcasts', 'activity'] as const).map(tab => (
              <button
                key={tab}
                className={`tab-btn${activeTab === tab ? ' active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'all' ? 'All' : tab === 'broadcasts' ? 'Announcements' : 'My Activity'}
                <span className="tab-count">
                  {tab === 'all' ? allAlerts.length : tab === 'broadcasts' ? broadcasts.length : activity.length}
                </span>
              </button>
            ))}
          </div>

          {/* Alert list */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skel" style={{ height: '80px' }} />
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">
                <Bell size={22} color="rgba(255,255,255,0.2)" strokeWidth={1.5} />
              </div>
              <div className="empty-title">No alerts yet</div>
              <div className="empty-sub">Check back when the event starts</div>
            </div>
          ) : (
            <div className="alert-list">
              {displayed.map((alert, i) => {
                const meta = TYPE_META[alert.type] ?? TYPE_META.default;
                const IconComp = meta.icon;
                const timestamp = alert.createdAt || alert.time;
                return (
                  <div className="alert-card" key={alert._id || i} style={{ borderColor: meta.border }}>
                    <div className="alert-icon-wrap" style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                      <IconComp size={17} color={meta.color} strokeWidth={2} />
                    </div>
                    <div className="alert-body">
                      <div className="alert-top">
                        <div className="alert-title">{alert.title}</div>
                        {timestamp && <div className="alert-time">{timeAgo(timestamp)}</div>}
                      </div>
                      <div className="alert-desc">{alert.body}</div>
                      <span
                        className="alert-type-tag"
                        style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }}
                      >
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
    </>
  );
}