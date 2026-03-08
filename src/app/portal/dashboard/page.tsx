'use client';

import { useEffect, useState } from 'react';
import { DBParticipant, MEAL_LABELS, MealStatus, countMealsTaken } from '@/types';

export default function DashboardPage() {
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

  const meals = participant?.meals;
  const mealsTaken = meals ? countMealsTaken(meals) : 0;
  const totalMeals = 6;

  const checkIns = [
    { label: 'College', status: participant?.collegeCheckIn?.status, time: participant?.collegeCheckIn?.time, icon: '🏛️' },
    { label: 'Lab', status: participant?.labCheckIn?.status, time: participant?.labCheckIn?.time, icon: '🔬' },
  ];

  return (
    <>
      <style>{`
        .dash {
          min-height: 100vh; padding: 2rem 1.5rem;
          position: relative; overflow: hidden;
          max-width: 900px;
        }

        .orb {
          position: fixed; border-radius: 50%; filter: blur(120px);
          pointer-events: none; z-index: 0;
          animation: pulse 5s ease-in-out infinite;
        }
        .orb-1 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(252,178,22,0.07), transparent 70%); top: -100px; right: 0; }
        .orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(217,27,87,0.06), transparent 70%); bottom: 0; left: 20%; animation-delay: -2s; }
        @keyframes pulse { 0%,100% { opacity:0.8; } 50% { opacity:1.1; } }

        .inner { position: relative; z-index: 1; }

        /* Header */
        .header { margin-bottom: 2rem; animation: fadeUp 0.5s ease both; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }

        .greeting {
          font-size: 0.7rem; font-weight: 600; letter-spacing: 3px;
          text-transform: uppercase; color: rgba(255,255,255,0.35); margin-bottom: 0.35rem;
        }
        .name {
          font-size: 2rem; font-weight: 800; color: #fff; line-height: 1.1; margin-bottom: 0.5rem;
        }
        .gradient-text {
          background: linear-gradient(90deg, #FCB216, #E85D24, #D91B57);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }

        .meta-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .meta-chip {
          font-size: 0.72rem; font-weight: 600; padding: 0.3rem 0.75rem;
          border-radius: 50px; letter-spacing: 0.5px;
        }
        .chip-team { background: rgba(99,32,95,0.2); border: 1px solid rgba(99,32,95,0.4); color: #D91B57; }
        .chip-lab { background: rgba(232,93,36,0.12); border: 1px solid rgba(232,93,36,0.3); color: #FCB216; }
        .chip-role { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); }

        /* Grid */
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem; }

        /* Cards */
        .card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px; padding: 1.25rem;
          animation: fadeUp 0.5s ease both;
          position: relative; overflow: hidden;
        }
        .card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, #FCB216, #E85D24, #D91B57, #63205F);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .card:hover::before { opacity: 1; }

        .card-1 { animation-delay: 0.1s; }
        .card-2 { animation-delay: 0.15s; }
        .card-3 { animation-delay: 0.2s; }
        .card-4 { animation-delay: 0.25s; }
        .card-5 { animation-delay: 0.3s; }

        .card-icon {
          width: 40px; height: 40px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; margin-bottom: 0.75rem;
          background: rgba(232,93,36,0.1); border: 1px solid rgba(232,93,36,0.2);
        }
        .card-label { font-size: 0.65rem; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.35); margin-bottom: 0.3rem; }
        .card-value { font-size: 1.6rem; font-weight: 800; color: #fff; line-height: 1; margin-bottom: 0.2rem; }
        .card-sub { font-size: 0.75rem; color: rgba(255,255,255,0.35); }

        /* Status dots */
        .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 0.4rem; flex-shrink: 0; }
        .dot-green { background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.5); }
        .dot-gray { background: rgba(255,255,255,0.2); }

        /* Check-in list */
        .checkin-list { display: flex; flex-direction: column; gap: 0.6rem; }
        .checkin-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.65rem 0.85rem; border-radius: 10px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
        }
        .checkin-left { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 600; color: #fff; }
        .checkin-time { font-size: 0.7rem; color: rgba(255,255,255,0.3); font-family: 'Space Mono', monospace; }
        .badge-done { font-size: 0.65rem; font-weight: 700; letter-spacing: 1px; padding: 0.2rem 0.6rem; border-radius: 50px; background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.3); color: #22c55e; }
        .badge-pending { font-size: 0.65rem; font-weight: 700; letter-spacing: 1px; padding: 0.2rem 0.6rem; border-radius: 50px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.3); }

        /* Progress bar */
        .progress-wrap { margin: 0.75rem 0; }
        .progress-track { height: 6px; background: rgba(255,255,255,0.07); border-radius: 3px; overflow: hidden; }
        .progress-fill {
          height: 100%; border-radius: 3px;
          background: linear-gradient(90deg, #FCB216, #E85D24, #D91B57);
          transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .progress-labels { display: flex; justify-content: space-between; margin-top: 0.4rem; }
        .progress-label { font-size: 0.68rem; color: rgba(255,255,255,0.3); }

        /* Meal grid */
        .meal-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-top: 0.75rem; }
        .meal-item {
          padding: 0.5rem; border-radius: 10px; text-align: center;
          font-size: 0.65rem; font-weight: 600; letter-spacing: 0.5px;
          transition: all 0.2s;
        }
        .meal-done { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25); color: #22c55e; }
        .meal-pending { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.25); }

        /* Full-width card */
        .card-full { grid-column: 1 / -1; }

        /* Wifi card */
        .wifi-row { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .wifi-row:last-child { border-bottom: none; }
        .wifi-key { font-size: 0.72rem; color: rgba(255,255,255,0.35); }
        .wifi-val { font-family: 'Space Mono', monospace; font-size: 0.78rem; color: #fff; font-weight: 700; }

        /* Skeleton */
        .skel { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%); background-size: 200% 100%; animation: skel 1.5s ease-in-out infinite; border-radius: 12px; }
        @keyframes skel { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }

        @media (max-width: 480px) {
          .dash { padding: 1.5rem 1rem; }
          .name { font-size: 1.6rem; }
          .grid { grid-template-columns: 1fr; }
          .grid-3 { grid-template-columns: 1fr 1fr; }
          .meal-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div className="dash">
        <div className="inner">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="skel" style={{ height: '80px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="skel" style={{ height: '120px' }} />
                <div className="skel" style={{ height: '120px' }} />
                <div className="skel" style={{ height: '160px' }} />
                <div className="skel" style={{ height: '160px' }} />
              </div>
            </div>
          ) : participant ? (
            <>
              {/* Header */}
              <div className="header">
                <div className="greeting">Good to see you 👋</div>
                <h1 className="name">
                  <span className="gradient-text">{participant.name.split(' ')[0]}</span>
                  {participant.name.split(' ').length > 1 && (
                    <> {participant.name.split(' ').slice(1).join(' ')}</>
                  )}
                </h1>
                <div className="meta-row">
                  {participant.role && <span className="meta-chip chip-role">{participant.role}</span>}
                  {participant.teamName && <span className="meta-chip chip-team">👥 {participant.teamName}</span>}
                  {participant.labAllotted && <span className="meta-chip chip-lab">🔬 {participant.labAllotted}</span>}
                </div>
              </div>

              {/* Row 1: Check-ins + Meals */}
              <div className="grid">
                {/* Check-in status */}
                <div className="card card-1">
                  <div className="card-icon">✅</div>
                  <div className="card-label">Check-In Status</div>
                  <div className="checkin-list" style={{ marginTop: '0.5rem' }}>
                    {checkIns.map((c, i) => (
                      <div className="checkin-row" key={i}>
                        <div className="checkin-left">
                          <span>{c.icon}</span>
                          {c.label}
                        </div>
                        {c.status
                          ? <span className="badge-done">✓ Done</span>
                          : <span className="badge-pending">Pending</span>
                        }
                      </div>
                    ))}
                  </div>
                </div>

                {/* Meals */}
                <div className="card card-2">
                  <div className="card-icon">🍽️</div>
                  <div className="card-label">Meals Collected</div>
                  <div className="card-value gradient-text">{mealsTaken}<span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.3)', WebkitTextFillColor: 'rgba(255,255,255,0.3)' }}>/{totalMeals}</span></div>
                  <div className="progress-wrap">
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${(mealsTaken / totalMeals) * 100}%` }} />
                    </div>
                    <div className="progress-labels">
                      <span className="progress-label">meals eaten</span>
                      <span className="progress-label">{totalMeals - mealsTaken} left</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Meal breakdown */}
              {meals && (
                <div className="card card-3" style={{ marginBottom: '1rem' }}>
                  <div className="card-icon">📋</div>
                  <div className="card-label">Meal Schedule</div>
                  <div className="meal-grid">
                    {(Object.entries(MEAL_LABELS) as [keyof MealStatus, string][]).map(([key, label]) => (
                      <div
                        key={key}
                        className={`meal-item ${meals[key] ? 'meal-done' : 'meal-pending'}`}
                      >
                        {meals[key] ? '✓ ' : ''}{label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Row 3: Team + WiFi */}
              <div className="grid">
                {/* Team info */}
                {(participant.teamName || participant.projectName) && (
                  <div className="card card-4">
                    <div className="card-icon">👥</div>
                    <div className="card-label">Team Info</div>
                    {participant.teamName && (
                      <>
                        <div className="card-value" style={{ fontSize: '1.1rem', marginTop: '0.4rem' }}>{participant.teamName}</div>
                        {participant.teamId && <div className="card-sub" style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.65rem' }}>{participant.teamId}</div>}
                      </>
                    )}
                    {participant.projectName && (
                      <div style={{ marginTop: '0.75rem', padding: '0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="card-label" style={{ marginBottom: '0.2rem' }}>Project</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{participant.projectName}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* WiFi */}
                {participant.wifiCredentials?.ssid && (
                  <div className="card card-5">
                    <div className="card-icon">📶</div>
                    <div className="card-label">Wi-Fi Access</div>
                    <div style={{ marginTop: '0.5rem' }}>
                      <div className="wifi-row">
                        <span className="wifi-key">Network</span>
                        <span className="wifi-val">{participant.wifiCredentials.ssid}</span>
                      </div>
                      {participant.wifiCredentials.password && (
                        <div className="wifi-row">
                          <span className="wifi-key">Password</span>
                          <span className="wifi-val">{participant.wifiCredentials.password}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}