import { redirect } from 'next/navigation';

export default function RootPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Space+Mono:wght@700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0F0F0F; font-family: 'Poppins', sans-serif; }

        .page {
          min-height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 2rem 1rem; position: relative; overflow: hidden;
        }

        .orb {
          position: fixed; border-radius: 50%; filter: blur(120px);
          pointer-events: none; z-index: 0;
        }
        .orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(252,178,22,0.09), transparent 70%); top: -150px; left: -150px; }
        .orb-2 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(217,27,87,0.07), transparent 70%); bottom: -100px; right: -100px; }

        .inner {
          position: relative; z-index: 1; text-align: center;
          animation: fadeUp 0.7s ease both;
        }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }

        .badge {
          font-family: 'Space Mono', monospace; font-size: 0.65rem; font-weight: 700;
          letter-spacing: 3px; text-transform: uppercase; padding: 0.4rem 1rem;
          border-radius: 50px; background: rgba(232,93,36,0.12);
          border: 1px solid rgba(232,93,36,0.35); color: #FCB216;
          display: inline-block; margin-bottom: 2rem;
        }

        .title {
          font-size: 3rem; font-weight: 800; color: #fff;
          line-height: 1.1; margin-bottom: 0.5rem;
        }

        .gradient-text {
          background: linear-gradient(90deg, #FCB216 0%, #E85D24 35%, #D91B57 70%, #63205F 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }

        .sub {
          font-size: 1rem; color: rgba(255,255,255,0.4);
          max-width: 360px; margin: 0 auto 2.5rem; line-height: 1.6;
        }

        .qr-box {
          display: inline-flex; flex-direction: column; align-items: center; gap: 0.75rem;
          padding: 1.5rem 2rem;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
        }

        .qr-icon { font-size: 3rem; }
        .qr-text { font-size: 0.85rem; color: rgba(255,255,255,0.35); }
        .qr-text strong { color: rgba(255,255,255,0.6); display: block; margin-bottom: 0.2rem; }

        @media (max-width: 480px) {
          .title { font-size: 2rem; }
        }
      `}</style>

      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div className="page">
        <div className="inner">
          <span className="badge">⚡ Hackoverflow 4.0</span>
          <h1 className="title">
            Participant<br />
            <span className="gradient-text">Check-In Portal</span>
          </h1>
          <p className="sub">
            This portal is accessed by scanning the QR code on your ID card.
            Please do not visit this page directly.
          </p>
          <div className="qr-box">
            <div className="qr-icon">📷</div>
            <div className="qr-text">
              <strong>Scan your ID card QR code</strong>
              to begin check-in
            </div>
          </div>
        </div>
      </div>
    </>
  );
}