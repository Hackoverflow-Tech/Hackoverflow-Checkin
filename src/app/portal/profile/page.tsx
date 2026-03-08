'use client';

import { useEffect, useState } from 'react';
import { DBParticipant } from '@/types';

export default function ProfilePage() {
  const [participant, setParticipant] = useState<DBParticipant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/verify')
      .then(r => r.json())
      .then(data => {
        if (data.participantId) {
          fetch(`/api/participant/${data.participantId}`)
            .then(r => r.json())
            .then(d => { if (d.participant) setParticipant(d.participant); })
            .finally(() => setLoading(false));
        }
      });
  }, []);

  const initials = participant?.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?';

  const formatTime = (time?: Date) => {
    if (!time) return '—';
    return new Date(time).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  };

  const formatDate = (time?: Date) => {
    if (!time) return '';
    return new Date(time).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short',
    });
  };

  return (
    <>
      <style>{`
        .profile-page {
          min-height: 100vh;
          padding: 2rem 1.5rem;
          max-width: 700px;
          position: relative;
        }

        .orb {
          position: fixed; border-radius: 50%; filter: blur(120px);
          pointer-events: none; z-index: 0; animation: pulse 5s ease-in-out infinite;
        }
        .orb-1 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(99,32,95,0.1), transparent 70%); top: -100px; right: -100px; }
        .orb-2 { width: 350px; height: 350px; background: radial-gradient(circle, rgba(252,178,22,0.07), transparent 70%); bottom: 100px; left: -50px; animation-delay: -2s; }
        @keyframes pulse { 0%,100%{opacity:.8;} 50%{opacity:1.1;} }

        .inner { position: relative; z-index: 1; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);} }

        /* Hero card */
        .hero-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 24px;
          padding: 2rem;
          margin-bottom: 1.25rem;
          position: relative; overflow: hidden;
          animation: fadeUp 0.5s ease both;
        }
        .hero-card::before {
          content: ''; position: absolute;
          top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, #FCB216, #E85D24, #D91B57, #63205F);
        }

        .hero-top {
          display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.5rem;
        }

        .avatar-ring {
          width: 72px; height: 72px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #FCB216, #E85D24, #D91B57, #63205F);
          padding: 3px;
          animation: pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both 0.2s;
        }
        @keyframes pop { from{transform:scale(0);opacity:0;} to{transform:scale(1);opacity:1;} }

        .avatar-inner {
          width: 100%; height: 100%; border-radius: 50%;
          background: #1a1a1a;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem; font-weight: 800; color: #fff;
          font-family: 'Space Mono', monospace;
        }

        .hero-info { flex: 1; min-width: 0; }
        .hero-name {
          font-size: 1.5rem; font-weight: 800; color: #fff;
          margin-bottom: 0.25rem; line-height: 1.2;
        }
        .gradient-text {
          background: linear-gradient(90deg, #FCB216, #E85D24, #D91B57);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .hero-id {
          font-family: 'Space Mono', monospace; font-size: 0.7rem;
          color: rgba(255,255,255,0.35); letter-spacing: 1px;
        }

        .badge-row { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .badge {
          font-size: 0.68rem; font-weight: 600; padding: 0.25rem 0.7rem;
          border-radius: 50px; letter-spacing: 0.5px;
        }
        .badge-orange { background: rgba(232,93,36,0.12); border: 1px solid rgba(232,93,36,0.3); color: #E85D24; }
        .badge-purple { background: rgba(99,32,95,0.2); border: 1px solid rgba(99,32,95,0.4); color: #D91B57; }
        .badge-gray { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.4); }

        /* Info grid */
        .info-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;
          border-top: 1px solid rgba(255,255,255,0.06); padding-top: 1.25rem;
        }

        .info-item { display: flex; flex-direction: column; gap: 0.2rem; }
        .info-label {
          font-size: 0.62rem; font-weight: 600; letter-spacing: 2px;
          text-transform: uppercase; color: rgba(255,255,255,0.3);
        }
        .info-value {
          font-size: 0.88rem; font-weight: 600; color: #fff;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .info-value.mono { font-family: 'Space Mono', monospace; font-size: 0.78rem; }

        /* Section cards */
        .section-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px; padding: 1.4rem;
          margin-bottom: 1.25rem;
          animation: fadeUp 0.5s ease both;
        }
        .section-card:nth-child(2) { animation-delay: 0.1s; }
        .section-card:nth-child(3) { animation-delay: 0.15s; }
        .section-card:nth-child(4) { animation-delay: 0.2s; }

        .section-header {
          display: flex; align-items: center; gap: 0.6rem;
          margin-bottom: 1rem;
        }
        .section-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(232,93,36,0.1); border: 1px solid rgba(232,93,36,0.2);
          display: flex; align-items: center; justify-content: center; font-size: 1rem;
        }
        .section-title {
          font-size: 0.78rem; font-weight: 700; letter-spacing: 2px;
          text-transform: uppercase; color: rgba(255,255,255,0.5);
        }

        /* Check-in timeline */
        .timeline { display: flex; flex-direction: column; gap: 0.6rem; }
        .tl-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.75rem 1rem; border-radius: 12px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.2s;
        }
        .tl-row:hover { background: rgba(255,255,255,0.05); }
        .tl-left { display: flex; align-items: center; gap: 0.6rem; }
        .tl-icon { font-size: 1.1rem; }
        .tl-name { font-size: 0.85rem; font-weight: 600; color: #fff; }
        .tl-date { font-size: 0.68rem; color: rgba(255,255,255,0.3); margin-top: 0.1rem; font-family: 'Space Mono', monospace; }
        .tl-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.2rem; }
        .tl-time { font-family: 'Space Mono', monospace; font-size: 0.72rem; color: rgba(255,255,255,0.4); }

        .status-pill {
          font-size: 0.62rem; font-weight: 700; letter-spacing: 1px;
          padding: 0.2rem 0.6rem; border-radius: 50px;
        }
        .pill-done { background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.3); color: #22c55e; }
        .pill-pending { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.25); }

        /* Project card */
        .project-box {
          padding: 1rem; border-radius: 14px;
          background: rgba(99,32,95,0.08); border: 1px solid rgba(99,32,95,0.2);
        }
        .project-name { font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 0.4rem; }
        .project-desc { font-size: 0.82rem; color: rgba(255,255,255,0.4); line-height: 1.6; }

        /* WiFi */
        .wifi-table { display: flex; flex-direction: column; gap: 0; }
        .wifi-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 0.6rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .wifi-row:last-child { border-bottom: none; }
        .wifi-k { font-size: 0.72rem; color: rgba(255,255,255,0.35); }
        .wifi-v { font-family: 'Space Mono', monospace; font-size: 0.8rem; font-weight: 700; color: #fff; letter-spacing: 1px; }

        /* Skeleton */
        .skel { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%); background-size: 200% 100%; animation: skel 1.5s ease-in-out infinite; border-radius: 12px; }
        @keyframes skel { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }

        @media (max-width: 480px) {
          .profile-page { padding: 1.5rem 1rem; }
          .hero-name { font-size: 1.3rem; }
          .info-grid { grid-template-columns: 1fr; }
          .avatar-ring { width: 60px; height: 60px; }
          .avatar-inner { font-size: 1.2rem; }
        }
      `}</style>

      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div className="profile-page">
        <div className="inner">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="skel" style={{ height: '180px', borderRadius: '20px' }} />
              <div className="skel" style={{ height: '140px', borderRadius: '20px' }} />
              <div className="skel" style={{ height: '160px', borderRadius: '20px' }} />
            </div>
          ) : participant ? (
            <>
              {/* Hero */}
              <div className="hero-card">
                <div className="hero-top">
                  <div className="avatar-ring">
                    <div className="avatar-inner">{initials}</div>
                  </div>
                  <div className="hero-info">
                    <div className="hero-name gradient-text">{participant.name}</div>
                    <div className="hero-id">{participant.participantId}</div>
                  </div>
                </div>

                <div className="badge-row" style={{ marginBottom: '1.25rem' }}>
                  {participant.role && <span className="badge badge-orange">{participant.role}</span>}
                  {participant.teamId && <span className="badge badge-purple">{participant.teamId}</span>}
                  {participant.institute && <span className="badge badge-gray">{participant.institute}</span>}
                </div>

                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Email</span>
                    <span className="info-value" style={{ fontSize: '0.78rem' }}>{participant.email}</span>
                  </div>
                  {participant.phone && (
                    <div className="info-item">
                      <span className="info-label">Phone</span>
                      <span className="info-value mono">{participant.phone}</span>
                    </div>
                  )}
                  {participant.teamName && (
                    <div className="info-item">
                      <span className="info-label">Team</span>
                      <span className="info-value">{participant.teamName}</span>
                    </div>
                  )}
                  {participant.labAllotted && (
                    <div className="info-item">
                      <span className="info-label">Lab Allotted</span>
                      <span className="info-value">{participant.labAllotted}</span>
                    </div>
                  )}
                  {participant.state && (
                    <div className="info-item">
                      <span className="info-label">State</span>
                      <span className="info-value">{participant.state}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Check-in Timeline */}
              <div className="section-card">
                <div className="section-header">
                  <div className="section-icon">📍</div>
                  <span className="section-title">Check-In Status</span>
                </div>
                <div className="timeline">
                  {[
                    { icon: '🏛️', name: 'College Check-In', data: participant.collegeCheckIn },
                    { icon: '🔬', name: 'Lab Check-In',     data: participant.labCheckIn },
                    { icon: '🚪', name: 'College Check-Out', data: participant.collegeCheckOut },
                    { icon: '🔓', name: 'Lab Check-Out',    data: participant.labCheckOut },
                  ].map((item, i) => (
                    <div className="tl-row" key={i}>
                      <div className="tl-left">
                        <span className="tl-icon">{item.icon}</span>
                        <div>
                          <div className="tl-name">{item.name}</div>
                          {item.data?.time && (
                            <div className="tl-date">{formatDate(item.data.time)}</div>
                          )}
                        </div>
                      </div>
                      <div className="tl-right">
                        <span className={`status-pill ${item.data?.status ? 'pill-done' : 'pill-pending'}`}>
                          {item.data?.status ? '✓ Done' : 'Pending'}
                        </span>
                        {item.data?.status && item.data.time && (
                          <span className="tl-time">{formatTime(item.data.time)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Project */}
              {(participant.projectName || participant.projectDescription) && (
                <div className="section-card">
                  <div className="section-header">
                    <div className="section-icon">💡</div>
                    <span className="section-title">Project</span>
                  </div>
                  <div className="project-box">
                    {participant.projectName && (
                      <div className="project-name">{participant.projectName}</div>
                    )}
                    {participant.projectDescription && (
                      <div className="project-desc">{participant.projectDescription}</div>
                    )}
                  </div>
                </div>
              )}

              {/* WiFi */}
              {participant.wifiCredentials?.ssid && (
                <div className="section-card">
                  <div className="section-header">
                    <div className="section-icon">📶</div>
                    <span className="section-title">Wi-Fi Credentials</span>
                  </div>
                  <div className="wifi-table">
                    <div className="wifi-row">
                      <span className="wifi-k">Network (SSID)</span>
                      <span className="wifi-v">{participant.wifiCredentials.ssid}</span>
                    </div>
                    {participant.wifiCredentials.password && (
                      <div className="wifi-row">
                        <span className="wifi-k">Password</span>
                        <span className="wifi-v">{participant.wifiCredentials.password}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}