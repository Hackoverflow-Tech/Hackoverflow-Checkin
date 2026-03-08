'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DBParticipant } from '@/types';

export default function DirectionsPage() {
  const { participantId } = useParams<{ participantId: string }>();
  const router = useRouter();
  const [participant, setParticipant] = useState<DBParticipant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/participant/${participantId}`)
      .then(r => r.json())
      .then(data => { if (data.participant) setParticipant(data.participant); })
      .finally(() => setLoading(false));
  }, [participantId]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Space+Mono:wght@700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0F0F0F; font-family: 'Poppins', sans-serif; min-height: 100vh; }

        .page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem 1rem;
          position: relative;
          overflow: hidden;
        }

        .orb {
          position: fixed; border-radius: 50%; filter: blur(120px);
          pointer-events: none; z-index: 0; animation: pulse 5s ease-in-out infinite;
        }
        .orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(252,178,22,0.09), transparent 70%); top: -150px; left: -150px; }
        .orb-2 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(217,27,87,0.07), transparent 70%); bottom: -100px; right: -100px; animation-delay: -2s; }
        @keyframes pulse { 0%,100% { opacity:0.8; } 50% { opacity:1; } }

        .inner { position: relative; z-index: 1; width: 100%; max-width: 440px; padding-top: 1rem; animation: fadeUp 0.6s ease both; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }

        .top-badge {
          display: flex; align-items: center; justify-content: center;
          gap: 0.5rem; margin-bottom: 1.5rem;
        }
        .badge {
          font-family: 'Space Mono', monospace; font-size: 0.65rem; font-weight: 700;
          letter-spacing: 3px; text-transform: uppercase; padding: 0.35rem 0.9rem;
          border-radius: 50px; background: rgba(232,93,36,0.12);
          border: 1px solid rgba(232,93,36,0.35); color: #FCB216;
        }

        .heading { font-size: 1.6rem; font-weight: 800; color: #fff; text-align: center; margin-bottom: 0.3rem; }
        .gradient-text {
          background: linear-gradient(90deg, #FCB216, #E85D24, #D91B57);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .sub { font-size: 0.85rem; color: rgba(255,255,255,0.45); text-align: center; margin-bottom: 2rem; }

        .lab-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px; padding: 1.5rem; margin-bottom: 1.5rem;
          position: relative; overflow: hidden;
        }
        .lab-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, #FCB216, #E85D24, #D91B57, #63205F);
        }
        .lab-label { font-size: 0.65rem; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.35); font-weight: 600; margin-bottom: 0.4rem; }
        .lab-name { font-size: 1.8rem; font-weight: 800; margin-bottom: 0.2rem; }
        .lab-desc { font-size: 0.82rem; color: rgba(255,255,255,0.45); }

        .steps-title {
          font-size: 0.7rem; letter-spacing: 2px; text-transform: uppercase;
          color: rgba(255,255,255,0.35); font-weight: 600; margin-bottom: 1rem;
          padding-left: 0.25rem;
        }

        .steps { display: flex; flex-direction: column; gap: 0; margin-bottom: 2rem; }

        .step {
          display: flex; gap: 1rem; align-items: flex-start;
          animation: fadeUp 0.5s ease both;
        }
        .step:nth-child(1) { animation-delay: 0.1s; }
        .step:nth-child(2) { animation-delay: 0.2s; }
        .step:nth-child(3) { animation-delay: 0.3s; }
        .step:nth-child(4) { animation-delay: 0.4s; }

        .step-line {
          display: flex; flex-direction: column; align-items: center; flex-shrink: 0;
        }
        .step-dot {
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(232,93,36,0.12);
          border: 2px solid rgba(232,93,36,0.35);
          display: flex; align-items: center; justify-content: center;
          font-size: 1rem; flex-shrink: 0;
          transition: all 0.3s ease;
        }
        .step-connector {
          width: 2px; height: 28px;
          background: linear-gradient(to bottom, rgba(232,93,36,0.3), rgba(217,27,87,0.1));
          margin: 4px 0;
        }
        .step:last-child .step-connector { display: none; }

        .step-body { padding-bottom: 1.5rem; flex: 1; }
        .step-title { font-size: 0.9rem; font-weight: 700; color: #fff; margin-bottom: 0.2rem; line-height: 1.3; padding-top: 0.5rem; }
        .step-detail { font-size: 0.8rem; color: rgba(255,255,255,0.45); line-height: 1.5; }

        .wifi-card {
          background: rgba(99,32,95,0.1); border: 1px solid rgba(99,32,95,0.3);
          border-radius: 16px; padding: 1.25rem; margin-bottom: 1.5rem;
          display: flex; flex-direction: column; gap: 0.75rem;
        }
        .wifi-title { font-size: 0.65rem; letter-spacing: 2px; text-transform: uppercase; color: rgba(217,27,87,0.8); font-weight: 600; }
        .wifi-row { display: flex; justify-content: space-between; align-items: center; }
        .wifi-key { font-size: 0.78rem; color: rgba(255,255,255,0.45); }
        .wifi-val {
          font-family: 'Space Mono', monospace; font-size: 0.8rem;
          color: #fff; font-weight: 700; letter-spacing: 1px;
        }

        .reached-btn {
          width: 100%; padding: 1rem; border: none; border-radius: 14px;
          background: linear-gradient(90deg, #FCB216, #E85D24, #D91B57, #63205F);
          color: #fff; font-family: 'Poppins', sans-serif; font-size: 1rem;
          font-weight: 700; letter-spacing: 1px; cursor: pointer;
          transition: all 0.3s ease; position: relative; overflow: hidden;
        }
        .reached-btn::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          transform: translateX(-100%); animation: shimmer 2.5s ease-in-out infinite;
        }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .reached-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(232,93,36,0.35); }

        .skeleton { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%); background-size: 200% 100%; animation: skel 1.5s ease-in-out infinite; border-radius: 8px; }
        @keyframes skel { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div className="page">
        <div className="inner">
          <div className="top-badge">
            <span className="badge">🗺️ Directions</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="skeleton" style={{ height: '120px' }} />
              <div className="skeleton" style={{ height: '200px' }} />
              <div className="skeleton" style={{ height: '52px' }} />
            </div>
          ) : (
            <>
              <h1 className="heading">Head to your <span className="gradient-text">Lab</span></h1>
              <p className="sub">Follow the steps below to reach your assigned lab</p>

              {participant?.labAllotted && (
                <div className="lab-card">
                  <div className="lab-label">Your assigned lab</div>
                  <div className="lab-name gradient-text">{participant.labAllotted}</div>
                  <div className="lab-desc">
                    {participant.institute && `${participant.institute} · `}
                    {participant.state || 'Proceed to the venue'}
                  </div>
                </div>
              )}

              <div className="steps-title">How to get there</div>

              <div className="steps">
                {[
                  { icon: '🚪', title: 'Enter the main gate', detail: 'Show your ID card to the security personnel at the entrance.' },
                  { icon: '📍', title: 'Proceed to the main building', detail: 'Follow the Hackoverflow signboards through the campus.' },
                  { icon: '🔬', title: `Head to ${participant?.labAllotted || 'your lab'}`, detail: 'Look for the lab number on floor signs. Volunteers will be stationed to help.' },
                  { icon: '✅', title: 'Tap "Reached" when you arrive', detail: 'This will record your lab check-in and unlock the portal.' },
                ].map((s, i) => (
                  <div className="step" key={i}>
                    <div className="step-line">
                      <div className="step-dot">{s.icon}</div>
                      <div className="step-connector" />
                    </div>
                    <div className="step-body">
                      <div className="step-title">{s.title}</div>
                      <div className="step-detail">{s.detail}</div>
                    </div>
                  </div>
                ))}
              </div>

              {participant?.wifiCredentials?.ssid && (
                <div className="wifi-card">
                  <div className="wifi-title">📶 Wi-Fi Credentials</div>
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
              )}

              <button
                className="reached-btn"
                onClick={() => router.push(`/lab-checkin/${participantId}`)}
              >
                🔬 I've Reached the Lab
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}