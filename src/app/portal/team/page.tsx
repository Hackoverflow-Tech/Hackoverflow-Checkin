'use client';

import { useEffect, useState } from 'react';
import { getTeam } from '@/actions/team';
import {
  Users, Crown, Github, Linkedin, Mail,
  FlaskConical, FolderGit2, Loader2,
  Copy, Check, ExternalLink,
} from 'lucide-react';

type Member = {
  id: string; name: string; email?: string | null;
  role?: string | null; github?: string | null;
  linkedin?: string | null; labAllotted?: string | null;
};
type Team = {
  teamId: string; teamName: string;
  projectName?: string | null; projectDescription?: string | null;
  techStack?: string[]; githubRepo?: string | null;
  leader: Member; members: Member[];
};

const initials = (n: string) => n.split(' ').slice(0,2).map(x=>x[0]).join('').toUpperCase();
const toHue = (n: string) => { let h=0; for(let i=0;i<n.length;i++) h=n.charCodeAt(i)+((h<<5)-h); return Math.abs(h)%360; };

export default function TeamPage() {
  const [team, setTeam]       = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    getTeam().then(data => { setTeam(data); setLoading(false); });
  }, []);

  const all = team ? [team.leader, ...team.members.filter(m => m.id !== team.leader.id)] : [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --bg:#0F0F0F;
          --grad:linear-gradient(90deg,#FCB216 0%,#E85D24 35%,#D91B57 70%,#63205F 100%);
          --gold:#FCB216;--orange:#E85D24;--success:#4ade80;
          --muted:rgba(255,255,255,.55);
          --glass:rgba(255,255,255,.04);--glass-h:rgba(231,88,41,.07);
          --border:rgba(255,255,255,.09);--border-h:rgba(231,88,41,.35);
          --r:18px;--pill:50px;
        }
        body{background:var(--bg);color:#fff;font-family:'Poppins',sans-serif;-webkit-font-smoothing:antialiased}
        .wrap{min-height:100dvh;padding:clamp(1rem,4vw,3rem) clamp(1rem,4vw,2rem);position:relative;overflow:hidden}
        .page{max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:1.5rem;position:relative;z-index:1}
        .orb{position:fixed;border-radius:50%;pointer-events:none;z-index:0;animation:orb 6s ease-in-out infinite alternate}
        .o1{width:clamp(200px,40vw,520px);height:clamp(200px,40vw,520px);top:-12%;right:-8%;background:radial-gradient(circle,#FCB216,transparent 70%);opacity:.06}
        .o2{width:clamp(180px,35vw,460px);height:clamp(180px,35vw,460px);bottom:-12%;left:-8%;background:radial-gradient(circle,#63205F,transparent 70%);opacity:.08;animation-delay:-3s}
        @keyframes orb{from{opacity:.05;transform:scale(1)}to{opacity:.11;transform:scale(1.08)}}
        @keyframes up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
        .u1{animation:up .5s ease both .05s}.u2{animation:up .5s ease both .15s}.u3{animation:up .5s ease both .25s}.u4{animation:up .5s ease both .35s}
        .card{background:var(--glass);border:1px solid var(--border);border-radius:var(--r);padding:clamp(1rem,3vw,1.5rem);position:relative;overflow:hidden;width:100%;backdrop-filter:blur(10px);transition:.3s}
        .card:hover{background:var(--glass-h);border-color:var(--border-h)}
        .card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.025),transparent 60%);pointer-events:none}
        .card.top::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--grad);border-radius:var(--r) var(--r) 0 0}
        .lbl{font-size:.62rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1.8px;display:flex;align-items:center;gap:.4rem;margin-bottom:1rem}
        .badge{display:inline-flex;align-items:center;gap:.4rem;padding:.35rem 1rem;border-radius:var(--pill);font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;background:rgba(231,88,41,.12);border:1px solid rgba(231,88,41,.35);color:var(--gold);width:fit-content}
        .bdot{width:6px;height:6px;border-radius:50%;background:var(--gold);animation:blink 2s ease-in-out infinite}
        .title{font-size:clamp(1.8rem,6vw,3rem);font-weight:800;line-height:1.15}
        .grad{background:var(--grad);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
        .sub{font-size:.82rem;color:var(--muted);display:flex;align-items:center;gap:.4rem}
        .dot{width:3px;height:3px;border-radius:50%;background:var(--muted)}
        .g2{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem}
        @media(max-width:540px){.g2{grid-template-columns:1fr}}
        .tname{font-size:clamp(1.4rem,5vw,2.2rem);font-weight:800;margin-bottom:.25rem}
        .tid{font-size:.65rem;color:var(--muted);font-family:monospace;display:flex;align-items:center;gap:.5rem}
        .cpbtn{background:none;border:none;cursor:pointer;color:var(--muted);display:flex;align-items:center;padding:0;transition:.2s}
        .cpbtn:hover{color:var(--gold)}
        .srow{display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap}
        .sv{font-size:1.6rem;font-weight:800;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .sl{font-size:.6rem;color:var(--muted);text-transform:uppercase;letter-spacing:1.5px}
        .pname{font-size:clamp(1rem,3vw,1.3rem);font-weight:700;margin-bottom:.4rem}
        .pdesc{font-size:.83rem;color:var(--muted);line-height:1.6;margin-bottom:.8rem}
        .pills{display:flex;flex-wrap:wrap;gap:.4rem}
        .pill{padding:.25rem .75rem;border-radius:var(--pill);font-size:.62rem;font-weight:600;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.8)}
        .repo{display:inline-flex;align-items:center;gap:.4rem;margin-top:.8rem;padding:.45rem 1rem;border-radius:var(--pill);border:1px solid rgba(255,255,255,.12);font-size:.7rem;font-weight:600;color:var(--muted);text-decoration:none;transition:.25s;width:fit-content}
        .repo:hover{border-color:var(--gold);color:var(--gold)}
        .mgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem}
        @media(max-width:420px){.mgrid{grid-template-columns:1fr}}
        .mc{background:var(--glass);border:1px solid var(--border);border-radius:14px;padding:1.1rem;display:flex;flex-direction:column;gap:.8rem;transition:.3s;position:relative;overflow:hidden}
        .mc:hover{background:var(--glass-h);border-color:var(--border-h);transform:translateY(-4px)}
        .mc.lead{border-color:rgba(252,178,22,.3)}
        .mc.lead::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#FCB216,#E85D24)}
        .av{width:48px;height:48px;border-radius:12px;flex-shrink:0;position:relative}
        .avi{position:absolute;inset:0;border-radius:inherit;display:flex;align-items:center;justify-content:center;font-size:.95rem;font-weight:800}
        .crown{position:absolute;top:-6px;right:-6px;width:18px;height:18px;background:var(--gold);border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg)}
        .mn{font-size:.92rem;font-weight:700;line-height:1.2}
        .mr{font-size:.62rem;color:var(--muted);text-transform:uppercase;letter-spacing:1px}
        .mlab{font-size:.65rem;color:var(--muted);display:flex;align-items:center;gap:.3rem}
        .mdiv{height:1px;background:rgba(255,255,255,.06)}
        .socs{display:flex;align-items:center;gap:.5rem;margin-top:auto}
        .sb{width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;color:var(--muted);transition:.2s}
        .sb:hover{background:rgba(231,88,41,.15);border-color:rgba(231,88,41,.4);color:var(--gold)}
        .center{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.6rem;min-height:220px;color:var(--muted);text-align:center}
      `}</style>

      <div className="wrap">
        <div className="orb o1" /><div className="orb o2" />
        <div className="page">

          {/* Loading */}
          {loading && (
            <div className="card center u1">
              <Loader2 size={26} style={{ color:'var(--orange)', animation:'spin 1s linear infinite' }} />
              <span style={{ fontSize:'.68rem', letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)' }}>
                Syncing Team Data
              </span>
            </div>
          )}

          {/* No team */}
          {!loading && !team && (
            <div className="card center u1">
              <Users size={32} style={{ opacity:.2 }} />
              <p>No team assigned yet.</p>
              <span style={{ fontSize:'.7rem', opacity:.6 }}>Check back once your registration is finalised.</span>
            </div>
          )}

          {/* Team */}
          {!loading && team && (
            <>
              {/* Header */}
              <div className="u1" style={{ display:'flex', flexDirection:'column', gap:'.4rem' }}>
                <span className="badge"><span className="bdot" />HackOverflow 4.0</span>
                <h1 className="title">Your <span className="grad">Team</span> Profile</h1>
                <p className="sub">
                  <Users size={13} />
                  <span>{all.length} Hackers</span>
                  {team.projectName && <><span className="dot" /><span>Project Active</span></>}
                </p>
              </div>

              <div className="g2 u2">
                {/* Overview */}
                <div className="card top" style={{ gridColumn:'1/-1' }}>
                  <div className="lbl"><Users size={12} />Overview</div>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
                    <div>
                      <div className="tname grad">{team.teamName}</div>
                      <div className="tid">
                        <span>ID: {team.teamId}</span>
                        <button className="cpbtn" onClick={() => { navigator.clipboard?.writeText(team.teamId); setCopied(true); setTimeout(()=>setCopied(false),2000); }}>
                          {copied ? <Check size={12} style={{ color:'var(--success)' }} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                    <div className="srow">
                      <div style={{ display:'flex', flexDirection:'column', gap:'.15rem' }}>
                        <span className="sv">{all.length}</span><span className="sl">Members</span>
                      </div>
                      <div style={{ width:1, height:32, background:'rgba(255,255,255,.08)' }} />
                      <div style={{ display:'flex', flexDirection:'column', gap:'.15rem' }}>
                        <span className="sv">{team.techStack?.length || 0}</span><span className="sl">Stack</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project */}
                {team.projectName && (
                  <div className="card u3">
                    <div className="lbl"><FolderGit2 size={12} />Project</div>
                    <div className="pname">{team.projectName}</div>
                    <p className="pdesc">{team.projectDescription || 'No description provided.'}</p>
                    {!!team.techStack?.length && (
                      <div className="pills">
                        {team.techStack.map((t,i) => <span className="pill" key={i}>{t}</span>)}
                      </div>
                    )}
                    {team.githubRepo && (
                      <a href={team.githubRepo} target="_blank" rel="noreferrer" className="repo">
                        <Github size={12} /> Repository <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                )}

                {/* Lab */}
                <div className="card u3">
                  <div className="lbl"><FlaskConical size={12} />Workspace</div>
                  <div style={{ fontSize:'1.6rem', fontWeight:800, color:'var(--gold)' }}>
                    {team.leader.labAllotted || 'TBD'}
                  </div>
                  <p style={{ fontSize:'.7rem', color:'var(--muted)', marginTop:'.3rem' }}>
                    Allocated laboratory for the event duration.
                  </p>
                </div>
              </div>

              {/* Crew */}
              <div className="u4">
                <div className="lbl" style={{ marginLeft:'.5rem' }}><Users size={12} />The Crew</div>
                <div className="mgrid">
                  {all.map(m => {
                    const isLead = m.id === team.leader.id;
                    const h = toHue(m.name);
                    return (
                      <div key={m.id} className={`mc${isLead?' lead':''}`}>
                        <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
                          <div className="av" style={{ background:`linear-gradient(135deg,hsl(${h},70%,35%),hsl(${(h+40)%360},80%,25%))` }}>
                            <span className="avi">{initials(m.name)}</span>
                            {isLead && <span className="crown"><Crown size={9} color="#0F0F0F" fill="#0F0F0F" /></span>}
                          </div>
                          <div>
                            <div className="mn">{m.name}</div>
                            <div className="mr">{isLead ? 'Lead Hacker' : m.role || 'Contributor'}</div>
                          </div>
                        </div>
                        {m.labAllotted && <div className="mlab"><FlaskConical size={11} style={{ opacity:.5 }} />{m.labAllotted}</div>}
                        <div className="mdiv" />
                        <div className="socs">
                          {m.github   && <a href={`https://github.com/${m.github}`} target="_blank" rel="noreferrer" className="sb"><Github   size={12} /></a>}
                          {m.linkedin && <a href={m.linkedin}                        target="_blank" rel="noreferrer" className="sb"><Linkedin size={12} /></a>}
                          {m.email    && <a href={`mailto:${m.email}`}                                               className="sb"><Mail     size={12} /></a>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}