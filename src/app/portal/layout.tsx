'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  CalendarDays,
  UtensilsCrossed,
  Bell,
  Bot,
  UserCircle,
  Users,
} from 'lucide-react';
import { DBParticipant } from '@/types';

const NAV_ITEMS = [
  { href: '/portal/dashboard', icon: LayoutDashboard,   label: 'Home' },
  { href: '/portal/team', icon: Users,   label: 'Team' },
  { href: '/portal/schedule',  icon: CalendarDays,      label: 'Schedule' },
  { href: '/portal/food',      icon: UtensilsCrossed,   label: 'Food' },
  { href: '/portal/alerts',    icon: Bell,              label: 'Alerts' },
  { href: '/portal/profile',   icon: UserCircle,        label: 'Profile' },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [participant, setParticipant] = useState<DBParticipant | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch('/api/auth/verify')
      .then(r => r.json())
      .then(data => {
        if (!data.authenticated) { router.replace('/'); return; }
        fetch(`/api/participant/${data.participantId}`)
          .then(r => r.json())
          .then(d => { if (d.participant) setParticipant(d.participant); });
        setAuthChecked(true);
      })
      .catch(() => router.replace('/'));
  }, [router]);

  if (!authChecked) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap');
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #0F0F0F; font-family: 'Poppins', sans-serif; }
          .loader { min-height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 1rem; }
          .spinner { width: 40px; height: 40px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.08); border-top-color: #E85D24; animation: spin 0.8s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
          .loader-text { font-size: 0.75rem; color: rgba(255,255,255,0.25); letter-spacing: 3px; text-transform: uppercase; }
        `}</style>
        <div className="loader">
          <div className="spinner" />
          <span className="loader-text">Loading Portal</span>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Space+Mono:wght@700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #0F0F0F;
          font-family: 'Poppins', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .portal-root { display: flex; min-height: 100vh; }

        /* ── SIDEBAR ── */
        .sidebar {
          width: 240px; min-height: 100vh;
          background: rgba(255,255,255,0.015);
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex; flex-direction: column;
          padding: 1.25rem 0.85rem;
          position: fixed; top: 0; left: 0; bottom: 0;
          z-index: 50; backdrop-filter: blur(12px);
        }

        /* Logo area */
        .sidebar-logo {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.5rem 0.65rem 1.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 1.25rem;
        }
        .logo-img-wrap {
          width: 38px; height: 38px; border-radius: 10px;
          overflow: hidden; flex-shrink: 0;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
        }
        .sidebar-logo-text { line-height: 1.25; }
        .logo-title {
          font-family: 'Space Mono', monospace;
          font-size: 0.72rem; font-weight: 700; letter-spacing: 1px;
          background: linear-gradient(90deg, #FCB216, #E85D24);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          display: block;
        }
        .logo-sub {
          font-size: 0.58rem; color: rgba(255,255,255,0.25);
          letter-spacing: 1.5px; text-transform: uppercase; display: block;
        }

        /* Nav links */
        .sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }

        .nav-link {
          display: flex; align-items: center; gap: 0.7rem;
          padding: 0.65rem 0.75rem; border-radius: 12px;
          text-decoration: none; color: rgba(255,255,255,0.38);
          font-size: 0.85rem; font-weight: 600;
          transition: all 0.22s ease; position: relative;
          border: 1px solid transparent;
        }
        .nav-link:hover {
          color: rgba(255,255,255,0.75);
          background: rgba(255,255,255,0.04);
        }
        .nav-link.active {
          color: #fff;
          background: rgba(232,93,36,0.1);
          border-color: rgba(232,93,36,0.18);
        }
        .nav-active-bar {
          position: absolute; left: 0; top: 22%; bottom: 22%;
          width: 3px; border-radius: 0 2px 2px 0;
          background: linear-gradient(180deg, #FCB216, #E85D24);
        }
        .nav-icon-wrap {
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.04); flex-shrink: 0;
          transition: all 0.22s ease;
        }
        .nav-link.active .nav-icon-wrap {
          background: rgba(232,93,36,0.15);
        }

        /* Footer chip */
        .sidebar-footer {
          padding-top: 1rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .participant-chip {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0.6rem 0.7rem; border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
        }
        .avatar {
          width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #FCB216, #E85D24, #D91B57);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.78rem; font-weight: 800; color: #fff;
        }
        .chip-name { font-size: 0.8rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .chip-id { font-family: 'Space Mono', monospace; font-size: 0.58rem; color: rgba(255,255,255,0.28); }

        /* Main */
        .main { flex: 1; margin-left: 240px; min-height: 100vh; }

        /* ── BOTTOM NAV (mobile) ── */
        .bottom-nav {
          display: none;
          position: fixed; bottom: 0; left: 0; right: 0;
          background: rgba(12,12,12,0.96);
          backdrop-filter: blur(24px);
          border-top: 1px solid rgba(255,255,255,0.07);
          z-index: 100;
          padding: 0.45rem 0.5rem;
          padding-bottom: calc(0.45rem + env(safe-area-inset-bottom));
        }
        .bottom-nav-inner {
          display: grid; grid-template-columns: repeat(6, 1fr);
        }
        .bottom-nav-item {
          display: flex; flex-direction: column; align-items: center; gap: 0.18rem;
          padding: 0.35rem 0.2rem; text-decoration: none;
          color: rgba(255,255,255,0.3); border-radius: 10px;
          transition: all 0.2s ease; position: relative;
        }
        .bottom-nav-item.active { color: #fff; }
        .bottom-nav-icon {
          width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;
        }
        .bottom-nav-label {
          font-size: 0.56rem; font-weight: 600; letter-spacing: 0.3px;
        }
        .bottom-nav-item.active .bottom-nav-label {
          background: linear-gradient(90deg, #FCB216, #E85D24);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .bottom-nav-item.active .bottom-nav-dot {
          display: block;
        }
        .bottom-nav-dot {
          display: none; position: absolute; bottom: 2px;
          width: 4px; height: 4px; border-radius: 50%;
          background: linear-gradient(90deg, #FCB216, #E85D24);
        }

        /* Top bar (mobile only) */
        .mobile-topbar {
          display: none;
          position: sticky; top: 0; z-index: 40;
          background: rgba(12,12,12,0.92);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 0.75rem 1rem;
          align-items: center; justify-content: space-between;
        }
        .topbar-logo {
          display: flex; align-items: center; gap: 0.5rem;
        }
        .topbar-logo-img {
          width: 28px; height: 28px; border-radius: 7px; overflow: hidden;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
        }
        .topbar-title {
          font-family: 'Space Mono', monospace; font-size: 0.68rem; font-weight: 700;
          background: linear-gradient(90deg, #FCB216, #E85D24);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          letter-spacing: 1px;
        }
        .topbar-chip {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.3rem 0.65rem; border-radius: 50px;
          background: rgba(232,93,36,0.1); border: 1px solid rgba(232,93,36,0.2);
        }
        .topbar-avatar {
          width: 22px; height: 22px; border-radius: 50%;
          background: linear-gradient(135deg, #FCB216, #E85D24);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.6rem; font-weight: 800; color: #fff;
        }
        .topbar-name { font-size: 0.72rem; font-weight: 700; color: #fff; }

        @media (max-width: 768px) {
          .sidebar { display: none; }
          .main { margin-left: 0; padding-bottom: 80px; }
          .bottom-nav { display: block; }
          .mobile-topbar { display: flex; }
        }
      `}</style>

      <div className="portal-root">

        {/* ── Desktop Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-img-wrap">
              <Image src="/HO.png" alt="Hackoverflow" width={34} height={34} style={{ objectFit: 'contain' }} />
            </div>
            <div className="sidebar-logo-text">
              <span className="logo-title">Hackoverflow</span>
              <span className="logo-sub">4.0 Portal</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href} className={`nav-link${active ? ' active' : ''}`}>
                  {active && <div className="nav-active-bar" />}
                  <div className="nav-icon-wrap">
                    <Icon size={16} strokeWidth={active ? 2.5 : 2} color={active ? '#E85D24' : 'rgba(255,255,255,0.4)'} />
                  </div>
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            {participant && (
              <div className="participant-chip">
                <div className="avatar">
                  {participant.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="chip-name">{participant.name.split(' ')[0]}</div>
                  <div className="chip-id">{participant.participantId}</div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ── Page Content ── */}
        <main className="main">
          {/* Mobile top bar */}
          <div className="mobile-topbar">
            <div className="topbar-logo">
              <div className="topbar-logo-img">
                <Image src="/HO.png" alt="HO" width={24} height={24} style={{ objectFit: 'contain' }} />
              </div>
              <span className="topbar-title">Hackoverflow 4.0</span>
            </div>
            {participant && (
              <div className="topbar-chip">
                <div className="topbar-avatar">
                  {participant.name.charAt(0).toUpperCase()}
                </div>
                <span className="topbar-name">{participant.name.split(' ')[0]}</span>
              </div>
            )}
          </div>

          {children}
        </main>

        {/* ── Mobile Bottom Nav ── */}
        <nav className="bottom-nav">
          <div className="bottom-nav-inner">
            {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href} className={`bottom-nav-item${active ? ' active' : ''}`}>
                  <div className="bottom-nav-icon">
                    <Icon
                      size={20}
                      strokeWidth={active ? 2.5 : 1.8}
                      color={active ? '#E85D24' : 'rgba(255,255,255,0.3)'}
                    />
                  </div>
                  <span className="bottom-nav-label">{label}</span>
                  <span className="bottom-nav-dot" />
                </Link>
              );
            })}
          </div>
        </nav>

      </div>
    </>
  );
}