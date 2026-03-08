'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Crown,
  Github,
  Linkedin,
  Mail,
  FlaskConical,
  FolderGit2,
  Loader2,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface TeamMember {
  id: string;
  name: string;
  email?: string;
  role?: string;
  github?: string;
  linkedin?: string;
  labAllotted?: string;
  collegeCheckIn?: { status: boolean };
  labCheckIn?: { status: boolean };
}

interface TeamData {
  teamId: string;
  teamName: string;
  projectName?: string;
  projectDescription?: string;
  techStack?: string[];
  githubRepo?: string;
  leader: TeamMember;
  members: TeamMember[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
}

function nameToHue(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % 360;
}

export default function TeamPage() {
  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        // Step 1: Verify user and get ID
        const authRes = await fetch('/api/auth/verify');
        const authData = await authRes.json();

        if (authData.participantId) {
          // Step 2: Fetch team details using ID
          const teamRes = await fetch(`/api/team/${authData.participantId}`);
          const teamData = await teamRes.json();

          if (isMounted && teamData.team) {
            setTeam(teamData.team);
          }
        }
      } catch (err) {
        console.error("Data fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, []);

  function copyToClipboard(text: string, id: string) {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  // Combine leader and members while ensuring the leader isn't duplicated
  const allMembers: TeamMember[] = team
    ? [team.leader, ...team.members.filter(m => m.id !== team.leader.id)]
    : [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:      #0F0F0F;
          --bg2:      #1a1a1a;
          --grad:      linear-gradient(90deg, #FCB216 0%, #E85D24 35%, #D91B57 70%, #63205F 100%);
          --orange:    #E85D24;
          --gold:      #FCB216;
          --pink:      #D91B57;
          --purple:    #63205F;
          --success:   #4ade80;
          --text:      #FFFFFF;
          --muted:     rgba(255,255,255,0.55);
          --glass:     rgba(255,255,255,0.04);
          --glass-h:   rgba(231, 88, 41, 0.07);
          --border:    rgba(255,255,255,0.09);
          --border-h:  rgba(231, 88, 41, 0.35);
          --r:          18px;
          --pill:      50px;
        }

        html, body {
          background: var(--bg);
          color: var(--text);
          font-family: 'Poppins', sans-serif;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        .root {
          min-height: 100dvh;
          padding: clamp(1rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem);
          position: relative;
          overflow: hidden;
        }

        .page {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .orb {
          position: fixed; border-radius: 50%;
          pointer-events: none; z-index: 0;
          animation: orbPulse 6s ease-in-out infinite alternate;
        }
        .orb-tl {
          width: clamp(200px, 40vw, 520px); height: clamp(200px, 40vw, 520px);
          top: -12%; right: -8%;
          background: radial-gradient(circle, #FCB216 0%, transparent 70%);
          opacity: 0.06;
        }
        .orb-br {
          width: clamp(180px, 35vw, 460px); height: clamp(180px, 35vw, 460px);
          bottom: -12%; left: -8%;
          background: radial-gradient(circle, #63205F 0%, transparent 70%);
          opacity: 0.08; animation-delay: -3s;
        }
        @keyframes orbPulse {
          from { opacity: 0.05; transform: scale(1); }
          to   { opacity: 0.11; transform: scale(1.08); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .au  { animation: fadeUp 0.55s ease both; }
        .d1  { animation-delay: 0.05s; }
        .d2  { animation-delay: 0.14s; }
        .d3  { animation-delay: 0.23s; }
        .d4  { animation-delay: 0.32s; }

        .loading-wrap {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 1rem; min-height: 220px;
        }
        .loading-txt {
          font-size: 0.68rem; letter-spacing: 2px;
          text-transform: uppercase; color: var(--muted);
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }

        .badge {
          display: inline-flex; align-items: center; gap: 0.4rem;
          width: fit-content; padding: 0.35rem 1rem;
          border-radius: var(--pill);
          font-size: clamp(0.58rem, 1.4vw, 0.68rem);
          font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;
          background: rgba(231,88,41,0.12);
          border: 1px solid rgba(231,88,41,0.35);
          color: var(--gold);
        }
        .badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--gold);
          animation: blink 2s ease-in-out infinite;
        }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.2; } }

        .header { display: flex; flex-direction: column; gap: 0.4rem; }
        .title {
          font-size: clamp(1.8rem, 6vw, 3rem);
          font-weight: 800; line-height: 1.15; letter-spacing: -0.5px;
        }
        .grad-text {
          background: var(--grad);
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .subtitle {
          font-size: clamp(0.74rem, 2vw, 0.84rem);
          color: var(--muted);
          display: flex; align-items: center; gap: 0.4rem;
        }
        .dot-sep {
          width: 3px; height: 3px; border-radius: 50%;
          background: var(--muted); display: inline-block;
        }

        .card {
          background: var(--glass);
          border: 1px solid var(--border);
          border-radius: var(--r);
          padding: clamp(1rem, 3vw, 1.5rem);
          transition: background 0.3s, border-color 0.3s, transform 0.3s;
          position: relative; overflow: hidden; width: 100%;
          backdrop-filter: blur(10px);
        }
        .card:hover { background: var(--glass-h); border-color: var(--border-h); }
        .card::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.025) 0%, transparent 60%);
          pointer-events: none;
        }

        .card-accent::after {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: var(--grad); border-radius: var(--r) var(--r) 0 0;
        }

        .lbl {
          font-size: 0.62rem; font-weight: 700;
          color: var(--muted); text-transform: uppercase;
          letter-spacing: 1.8px;
          display: flex; align-items: center; gap: 0.4rem;
          margin-bottom: 1rem;
        }

        .g2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        @media (max-width: 540px) { .g2 { grid-template-columns: 1fr; } }

        .team-name-big {
          font-size: clamp(1.4rem, 5vw, 2.2rem);
          font-weight: 800; letter-spacing: -0.3px;
          margin-bottom: 0.3rem;
        }
        .team-id {
          font-size: 0.65rem; color: var(--muted);
          font-family: 'Courier New', monospace;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .copy-btn {
          background: none; border: none; cursor: pointer;
          color: var(--muted); transition: color 0.2s;
          display: flex; align-items: center; padding: 0;
        }
        .copy-btn:hover { color: var(--gold); }

        .proj-name {
          font-size: clamp(1rem, 3vw, 1.3rem);
          font-weight: 700; margin-bottom: 0.5rem;
        }
        .proj-desc {
          font-size: clamp(0.75rem, 2vw, 0.85rem);
          color: var(--muted); line-height: 1.6;
          margin-bottom: 1rem;
        }
        .tech-pills { display: flex; flex-wrap: wrap; gap: 0.45rem; }
        .tech-pill {
          padding: 0.25rem 0.75rem;
          border-radius: var(--pill);
          font-size: 0.62rem; font-weight: 600;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.8);
        }

        .repo-link {
          display: inline-flex; align-items: center; gap: 0.4rem;
          margin-top: 1rem;
          padding: 0.45rem 1rem;
          border-radius: var(--pill);
          border: 1px solid rgba(255,255,255,0.12);
          font-size: 0.7rem; font-weight: 600;
          color: var(--muted);
          text-decoration: none;
          transition: border-color 0.25s, color 0.25s;
          width: fit-content;
        }
        .repo-link:hover { border-color: var(--gold); color: var(--gold); }

        .members-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }
        @media (max-width: 420px) { .members-grid { grid-template-columns: 1fr; } }

        .member-card {
          background: var(--glass);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 1.1rem;
          display: flex; flex-direction: column; gap: 0.8rem;
          transition: 0.3s;
          position: relative; overflow: hidden;
        }
        .member-card:hover {
          background: var(--glass-h);
          border-color: var(--border-h);
          transform: translateY(-4px);
        }
        .member-card.is-leader { border-color: rgba(252, 178, 22, 0.3); }
        .member-card.is-leader::after {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, #FCB216, #E85D24);
        }

        .avatar {
          width: 48px; height: 48px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: var(--text); flex-shrink: 0;
          position: relative;
        }
        .avatar-inner {
          position: absolute; inset: 0; border-radius: inherit;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.95rem; font-weight: 800;
          z-index: 1;
        }
        .leader-crown {
          position: absolute; top: -6px; right: -6px;
          width: 18px; height: 18px;
          background: var(--gold);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          z-index: 2; border: 2px solid var(--bg);
        }

        .member-name { font-size: 0.92rem; font-weight: 700; line-height: 1.2; }
        .member-role { font-size: 0.62rem; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }
        .member-lab { font-size: 0.65rem; color: var(--muted); display: flex; align-items: center; gap: 0.3rem; }

        .socials { display: flex; align-items: center; gap: 0.5rem; margin-top: auto; }
        .social-btn {
          width: 28px; height: 28px;
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          color: var(--muted); transition: 0.2s;
        }
        .social-btn:hover { background: rgba(231,88,41,0.15); border-color: rgba(231,88,41,0.4); color: var(--gold); }

        .member-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 0 -0.2rem; }

        .stat-row { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
        .stat-item { display: flex; flex-direction: column; gap: 0.15rem; }
        .stat-val {
          font-size: 1.6rem; font-weight: 800;
          background: var(--grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .stat-lbl { font-size: 0.6rem; color: var(--muted); text-transform: uppercase; letter-spacing: 1.5px; }
        .stat-sep { width: 1px; height: 32px; background: rgba(255,255,255,0.08); }

        .empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.6rem; min-height: 180px; color: var(--muted); text-align: center; }
      `}</style>

      <div className="root">
        <div className="orb orb-tl" />
        <div className="orb orb-br" />

        <div className="page">
          {loading ? (
            <div className="card loading-wrap au d1">
              <Loader2 size={26} className="spin" style={{ color: 'var(--orange)' }} />
              <span className="loading-txt">Syncing Team Data</span>
            </div>
          ) : team ? (
            <>
              <div className="header au d1">
                <span className="badge">
                  <span className="badge-dot" />
                  HackOverflow 4.0
                </span>
                <h1 className="title">Your <span className="grad-text">Team</span> Profile</h1>
                <p className="subtitle">
                  <Users size={13} />
                  <span>{allMembers.length} Hackers</span>
                  {team.projectName && <><span className="dot-sep" /><span>Project Active</span></>}
                </p>
              </div>

              <div className="g2 au d2">
                <div className="card card-accent" style={{ gridColumn: '1 / -1' }}>
                  <div className="lbl"><Users size={12} />Overview</div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div className="team-name-big grad-text">{team.teamName}</div>
                      <div className="team-id">
                        <span>ID: {team.teamId}</span>
                        <button className="copy-btn" onClick={() => copyToClipboard(team.teamId, 'tid')}>
                          {copiedId === 'tid' ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                    <div className="stat-row">
                      <div className="stat-item">
                        <span className="stat-val">{allMembers.length}</span>
                        <span className="stat-lbl">Members</span>
                      </div>
                      <div className="stat-sep" />
                      <div className="stat-item">
                        <span className="stat-val">{team.techStack?.length || 0}</span>
                        <span className="stat-lbl">Stack</span>
                      </div>
                    </div>
                  </div>
                </div>

                {team.projectName && (
                  <div className="card au d3">
                    <div className="lbl"><FolderGit2 size={12} />Project Description</div>
                    <div className="proj-name">{team.projectName}</div>
                    <p className="proj-desc">{team.projectDescription || "No description provided."}</p>
                    {team.techStack && (
                      <div className="tech-pills">
                        {team.techStack.map((t, i) => <span className="tech-pill" key={i}>{t}</span>)}
                      </div>
                    )}
                    {team.githubRepo && (
                      <a href={team.githubRepo} target="_blank" className="repo-link">
                        <Github size={12} /> Repository <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                )}

                <div className="card au d3">
                  <div className="lbl"><FlaskConical size={12} />Workspace</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--gold)' }}>
                    {team.leader.labAllotted || "TBD"}
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.3rem' }}>
                    Allocated laboratory for the event duration.
                  </p>
                </div>
              </div>

              <div className="au d4">
                <div className="lbl" style={{ marginLeft: '0.5rem' }}><Users size={12} />The Crew</div>
                <div className="members-grid">
                  {allMembers.map((m, idx) => {
                    const isLeader = m.id === team.leader.id;
                    const hue = nameToHue(m.name);
                    const avatarGrad = `linear-gradient(135deg, hsl(${hue},70%,35%) 0%, hsl(${(hue + 40) % 360},80%,25%) 100%)`;
                    return (
                      <div key={m.id} className={`member-card${isLeader ? ' is-leader' : ''}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="avatar" style={{ background: avatarGrad }}>
                            <span className="avatar-inner">{getInitials(m.name)}</span>
                            {isLeader && <span className="leader-crown"><Crown size={9} color="#0F0F0F" fill="#0F0F0F" /></span>}
                          </div>
                          <div>
                            <div className="member-name">{m.name}</div>
                            <div className="member-role">{isLeader ? 'Lead Hacker' : m.role || 'Contributor'}</div>
                          </div>
                        </div>
                        {m.labAllotted && (
                          <div className="member-lab">
                            <FlaskConical size={11} style={{ opacity: 0.5 }} /> {m.labAllotted}
                          </div>
                        )}
                        <div className="member-divider" />
                        <div className="socials">
                          {m.github && <a href={`https://github.com/${m.github}`} target="_blank" className="social-btn"><Github size={12} /></a>}
                          {m.linkedin && <a href={m.linkedin} target="_blank" className="social-btn"><Linkedin size={12} /></a>}
                          {m.email && <a href={`mailto:${m.email}`} className="social-btn"><Mail size={12} /></a>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="card au d1 empty">
              <Users size={32} style={{ opacity: 0.2 }} />
              <p>Team data is currently unavailable.</p>
              <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>Check back once your registration is finalized.</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}