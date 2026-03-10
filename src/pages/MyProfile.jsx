import React, { useState, useMemo, useEffect, useRef } from "react";
import { certColor, roleColor, statusColor, fmtDate, certRank, canManageMatches, isAdmin, uid, inp, btnS, btnP, btnD, errInp, clubRoleColor, canManageClub, isClubPresident, docCatColor, docTypeColor, fmtFileSize, computeYearlyPoints, meetsLevelOrHigher, checkAnnualMaintenance } from "../lib/helpers";
import { CERT_LEVELS, SYSTEM_ROLES, MATCH_LEVEL_POINTS, SEMINAR_INSTRUCTOR_POINTS, POINT_RULES, IPSC_DISCIPLINES, DQ_REASONS, DEFAULT_REGIONS, DOC_CATEGORIES } from "../lib/constants";
import { Badge, StatCard, Modal, Field, InfoRow, Divider, RegionSelect, UserPicker, useAuth, useTheme } from "../components/ui";

export default function MyProfile({ users, setUsers, matches, seminars, regions, applications, setApplications, clubs, setClubs }) {
  const { currentUser } = useAuth();
  const user = users.find(u=>u.id===currentUser.id) || currentUser;

  const [editMode,  setEditMode]  = useState(false);
  const [form,      setForm]      = useState({ name:user.name, region:user.region, notes:user.notes, email:user.email, iroa: user.iroa || { member:false, since:null } });
  const [profileFe, setProfileFe] = useState({});
  const [pwForm,    setPwForm]    = useState({ current:"", next:"", confirm:"" });
  const [pwError,   setPwError]   = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const myMatches = useMemo(() =>
    matches.filter(m=>m.assignments.some(a=>a.roId===user.id))
      .map(m=>({...m, assignment:m.assignments.find(a=>a.roId===user.id)}))
  ,[matches,user.id]);

  const mySeminars = useMemo(()=>{
    return (seminars||[]).filter(s=>s.enrollments.some(e=>e.userId===user.id))
      .map(s=>({ ...s, enrollment:s.enrollments.find(e=>e.userId===user.id) }));
  },[seminars,user.id]);

  const myApplications = useMemo(()=>
    (applications||[]).filter(a=>a.userId===user.id)
      .sort((a,b)=>new Date(b.date)-new Date(a.date))
  ,[applications,user.id]);

  const myClubs = useMemo(()=>
    (clubs||[]).filter(c=>(c.members||[]).some(m=>m.userId===user.id&&m.status==="active"))
      .map(c=>({ ...c, membership:(c.members||[]).find(m=>m.userId===user.id) }))
  ,[clubs,user.id]);

  const myPendingClubApps = useMemo(()=>
    (applications||[]).filter(a=>a.type==="club_membership"&&a.userId===user.id&&a.status==="pending")
  ,[applications,user.id]);

  // Which cert/IROA types already have a pending application?
  const pendingTypes = new Set(myApplications.filter(a=>a.status==="pending").map(a=>a.type));

  function saveProfile() {
    if (!form.name.trim()) { setProfileFe({name:true}); return; }
    setProfileFe({});
    const upd = {...user,name:form.name.trim(),region:form.region.trim(),notes:form.notes,email:form.email.trim(),iroa:form.iroa};
    setUsers(prev=>prev.map(u=>u.id===user.id?upd:u));
    setEditMode(false);
  }

  function changePw() {
    setPwError(""); setPwSuccess(false);
    if (pwForm.current!==user.password) { setPwError("Current password is incorrect."); return; }
    if (pwForm.next.length<4)           { setPwError("New password must be at least 4 characters."); return; }
    if (pwForm.next!==pwForm.confirm)   { setPwError("New passwords do not match."); return; }
    setUsers(prev=>prev.map(u=>u.id===user.id?{...u,password:pwForm.next}:u));
    setPwForm({current:"",next:"",confirm:""}); setPwSuccess(true);
  }

  const pf = k => e => setPwForm(p=>({...p,[k]:e.target.value}));

  function submitApplication(type, note) {
    const today = new Date().toISOString().slice(0,10);
    const app = {
      id: "app" + Date.now(),
      userId: user.id, userName: user.name,
      userCert: user.certification, userRegion: user.region,
      type, date: today, note: note||"",
      status: "pending", reviewedBy: null, reviewedDate: null, reviewNote: ""
    };
    setApplications(prev=>[...prev, app]);
    // Record last application date on the user (used by quarantine check for RO)
    if (type==="RO") setUsers(prev=>prev.map(u=>u.id===user.id?{...u,lastROApplication:today}:u));
  }

  return (
    <div>
      <h1 style={{fontSize:28,fontWeight:800,margin:"0 0 4px",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.03em",color:"var(--text-primary)"}}>My Profile</h1>
      <p style={{color:"var(--text-faint)",marginBottom:28,fontSize:14}}>Your account, certifications and match history</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        {/* Left */}
        <div>
          <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:24,marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
              <div style={{width:54,height:54,borderRadius:"50%",background:"#e85d2c",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color:"#fff",fontFamily:"'Barlow Condensed',sans-serif",flexShrink:0}}>{user.name.charAt(0)}</div>
              <div>
                <div style={{fontSize:18,fontWeight:700,color:"var(--text-primary)"}}>{user.name}</div>
                <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
                  <Badge label={user.role}                  color={roleColor(user.role)} />
                  <Badge label={user.certification||"No Cert"} color={certColor(user.certification)} />
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:10,marginBottom:20}}>
              <StatCard label="Points"  value={user.points}       accent="#e85d2c" />
              <StatCard label="Matches" value={myMatches.length}  accent="#60a5fa" />
              <StatCard label="Clubs"   value={myClubs.length}   accent="#7c8cf8" />
            </div>
            {!editMode ? (
              <>
                <InfoRow label="Email"    value={user.email} />
                <InfoRow label="District" value={user.region||"—"} />
                <InfoRow label="Joined"   value={fmtDate(user.joined)} />
                <InfoRow label="IROA Member" value={
                  user.iroa?.member
                    ? <span>Yes {user.iroa.since ? <span style={{color:"var(--text-faint)",fontSize:12}}>since {fmtDate(user.iroa.since)}</span> : ""}</span>
                    : "No"
                } />
                {user.notes&&<InfoRow label="Notes" value={user.notes}/>}
                <button style={{...btnS,marginTop:14}} onClick={()=>setEditMode(true)}>Edit Profile</button>
              </>
            ) : (
              <>
                <Field label="Full Name"><input style={errInp(profileFe.name)} value={form.name}   onChange={e=>{setForm(f=>({...f,name:e.target.value}));setProfileFe(p=>({...p,name:false}));}} /></Field>
                <Field label="Email">    <input style={inp} type="email" value={form.email}  onChange={e=>setForm(f=>({...f,email:e.target.value}))} /></Field>
                <Field label="District">
                  <RegionSelect value={form.region} onChange={v=>setForm(f=>({...f,region:v}))} regions={regions} />
                </Field>
                <Field label="Notes">   <textarea style={{...inp,height:60,resize:"vertical"}} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} /></Field>
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 0",borderBottom:"1px solid var(--surface3)",marginBottom:12}}>
                  <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",flex:1}}>
                    <input type="checkbox" checked={!!form.iroa?.member}
                      onChange={e=>setForm(f=>({...f,iroa:{...f.iroa,member:e.target.checked,since:e.target.checked?(f.iroa?.since||new Date().toISOString().slice(0,10)):null}}))}
                      style={{width:16,height:16,accentColor:"#e85d2c"}} />
                    <span style={{fontSize:13,color:"var(--text-primary)",fontWeight:600}}>IROA Member</span>
                  </label>
                  {form.iroa?.member && (
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <label style={{fontSize:11,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.07em",whiteSpace:"nowrap"}}>Since</label>
                      <input type="date" style={{...inp,width:140,padding:"6px 10px",fontSize:12}}
                        value={form.iroa?.since||""}
                        onChange={e=>setForm(f=>({...f,iroa:{...f.iroa,since:e.target.value}}))} />
                    </div>
                  )}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button style={btnP} onClick={saveProfile}>Save</button>
                  <button style={btnS} onClick={()=>setEditMode(false)}>Cancel</button>
                </div>
              </>
            )}
          </div>
          <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:24}}>
            <h3 style={{margin:"0 0 14px",fontSize:13,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Change Password</h3>
            {pwError   && <div style={{background:"#f8717115",border:"1px solid #f8717155",borderRadius:6,padding:"9px 13px",color:"#f87171",fontSize:13,marginBottom:12}}>{pwError}</div>}
            {pwSuccess && <div style={{background:"#0a2a15",border:"1px solid #164a20",borderRadius:6,padding:"9px 13px",color:"#4ade80",fontSize:13,marginBottom:12}}>Password updated successfully.</div>}
            <Field label="Current Password"><input style={inp} type="password" value={pwForm.current} onChange={pf("current")} /></Field>
            <Field label="New Password">    <input style={inp} type="password" value={pwForm.next}    onChange={pf("next")} /></Field>
            <Field label="Confirm New">     <input style={inp} type="password" value={pwForm.confirm} onChange={pf("confirm")} /></Field>
            <button style={btnP} onClick={changePw}>Update Password</button>
          </div>
        </div>
        {/* Right */}
        <div>
          <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:24,marginBottom:16}}>
            <h3 style={{margin:"0 0 16px",fontSize:13,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Certification History</h3>
            {(!user.certHistory||user.certHistory.length===0)
              ? <p style={{color:"var(--text-faint)",fontSize:13}}>No certifications on record yet. Contact an administrator.</p>
              : [...user.certHistory].reverse().map((c,i,arr)=>(
                <div key={i} style={{display:"flex",gap:12,paddingBottom:i<arr.length-1?14:0}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:certColor(c.cert),flexShrink:0,marginTop:4}} />
                    {i<arr.length-1&&<div style={{width:2,flex:1,background:"var(--border)",marginTop:4}}/>}
                  </div>
                  <div style={{flex:1,paddingBottom:4}}>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}><Badge label={c.cert} color={certColor(c.cert)} /><span style={{color:"var(--text-muted)",fontSize:12}}>{fmtDate(c.date)}</span></div>
                    <div style={{color:"var(--text-faint)",fontSize:12,marginTop:4}}>Granted by: {c.grantedBy}</div>
                    {c.note&&<div style={{color:"var(--text-muted)",fontSize:12,fontStyle:"italic",marginTop:2}}>{c.note}</div>}
                  </div>
                </div>
              ))
            }
          </div>

          {/* RO Upgrade Checklist — only shown for RO-P holders */}
          {user.certification==="RO-P" && (()=>{
            const checklist = computeROChecklist(user, matches);
            const allPass   = checklist.every(c=>c.pass);
            return (
              <div style={{background:"var(--surface2)",border:`1px solid ${allPass?"#4ade8066":"var(--border)"}`,borderRadius:8,padding:24,marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <h3 style={{margin:0,fontSize:13,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em"}}>RO Upgrade Checklist</h3>
                  {allPass && <Badge label="All Requirements Met" color="#4ade80" />}
                </div>
                <p style={{fontSize:12,color:"var(--text-faint)",margin:"0 0 16px"}}>
                  These checks must all pass before applying for a full <Badge label="RO" color="#4ade80" /> upgrade. If you believe a result is incorrect, contact NROI directly.
                </p>
                <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
                  {checklist.map(item=>(
                    <div key={item.key} style={{
                      display:"flex",alignItems:"flex-start",gap:12,
                      padding:"10px 12px",borderRadius:7,
                      background:item.pass?"#4ade8015":"#f8717115",
                      border:`1px solid ${item.pass?"#4ade8066":"#f8717155"}`
                    }}>
                      <span style={{fontSize:16,flexShrink:0,marginTop:1}}>{item.pass ? "✅" : "❌"}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600,color:item.pass?"#86efac":"#fca5a5"}}>{item.label}</div>
                        <div style={{fontSize:11,color:"var(--text-faint)",marginTop:2}}>{item.desc}</div>
                        {item.detail&&<div style={{fontSize:11,color:"var(--text-muted)",marginTop:2,fontStyle:"italic"}}>{item.detail}</div>}
                      </div>
                    </div>
                  ))}
                </div>
                {pendingTypes.has("RO") ? (
                  <div style={{background:"#60a5fa15",border:"1px solid #60a5fa44",borderRadius:7,padding:"12px 14px",color:"#60a5fa",fontSize:13}}>
                    ⏳ RO upgrade application is pending review.
                  </div>
                ) : allPass ? (
                  <button style={{...btnP,background:"#16a34a",width:"100%"}} onClick={()=>submitApplication("RO")}>
                    Apply for RO Upgrade
                  </button>
                ) : (
                  <button style={{...btnS,width:"100%",cursor:"not-allowed",opacity:0.5}} disabled>
                    Apply for RO Upgrade — Requirements Not Met
                  </button>
                )}
              </div>
            );
          })()}

          {/* Certification upgrade applications — CRO, RM, IROA */}
          <CertApplicationPanel user={user} pendingTypes={pendingTypes} submitApplication={submitApplication} />

          {/* Club memberships */}
          {(myClubs.length > 0 || myPendingClubApps.length > 0) && (
            <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:24,marginBottom:16}}>
              <h3 style={{margin:"0 0 14px",fontSize:13,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Club Memberships</h3>
              {myClubs.map(c=>(
                <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
                  <div style={{width:36,height:36,borderRadius:8,background:"#e85d2c",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff",letterSpacing:"0.05em",fontFamily:"'Barlow Condensed',sans-serif",flexShrink:0}}>
                    {c.shortName.slice(0,3)}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{color:"var(--text-primary)",fontWeight:600,fontSize:14}}>{c.name}</div>
                    <div style={{fontSize:12,color:"var(--text-faint)",marginTop:2}}>
                      {c.region} · Member since {fmtDate(c.membership?.since)}
                    </div>
                  </div>
                  <Badge label={c.membership?.role||"member"} color={clubRoleColor(c.membership?.role)} />
                </div>
              ))}
              {myPendingClubApps.map(a=>{
                const club = (clubs||[]).find(c=>c.id===a.clubId);
                return (
                  <div key={a.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid var(--border)",opacity:0.7}}>
                    <div style={{width:36,height:36,borderRadius:8,background:"var(--surface3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"var(--text-faint)",fontFamily:"'Barlow Condensed',sans-serif",flexShrink:0}}>
                      {(club?.shortName||"?").slice(0,3)}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{color:"var(--text-primary)",fontWeight:600,fontSize:14}}>{club?.name||"Unknown Club"}</div>
                      <div style={{fontSize:12,color:"var(--text-faint)",marginTop:2}}>Applied {fmtDate(a.date)}</div>
                    </div>
                    <Badge label="⏳ pending" color="#60a5fa" />
                  </div>
                );
              })}
            </div>
          )}
          {/* My application history */}
          {myApplications.length > 0 && (
            <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:24,marginBottom:16}}>
              <h3 style={{margin:"0 0 14px",fontSize:13,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em"}}>My Applications</h3>
              {myApplications.map(app=>(
                <div key={app.id} style={{padding:"11px 0",borderBottom:"1px solid var(--border)",display:"flex",gap:12,alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                      <span style={{fontWeight:600,color:"var(--text-primary)",fontSize:13}}>
                        {app.type==="IROA" ? "IROA Membership"
                          : app.type==="club_membership"
                            ? `Club Membership: ${(clubs||[]).find(c=>c.id===app.clubId)?.name||"Unknown Club"}`
                            : `${app.type} Certification`}
                      </span>
                      <Badge
                        label={app.status}
                        color={app.status==="pending"?"#60a5fa":app.status==="approved"?"#4ade80":"#f87171"}
                      />
                    </div>
                    <div style={{color:"var(--text-faint)",fontSize:11,marginTop:3}}>Submitted {fmtDate(app.date)}</div>
                    {app.note&&<div style={{color:"var(--text-muted)",fontSize:12,marginTop:3,fontStyle:"italic"}}>{app.note}</div>}
                    {app.reviewNote&&<div style={{color:"var(--text-second)",fontSize:12,marginTop:3}}>Review note: {app.reviewNote}</div>}
                    {app.reviewedBy&&<div style={{color:"var(--text-faint)",fontSize:11,marginTop:2}}>Reviewed by {app.reviewedBy} on {fmtDate(app.reviewedDate)}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Seminar History */}
          <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:24,marginBottom:16}}>
            <h3 style={{margin:"0 0 14px",fontSize:13,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Seminar History</h3>
            {mySeminars.length===0
              ? <p style={{color:"var(--text-faint)",fontSize:13}}>No seminars on record.</p>
              : mySeminars.map(s=>(
                <div key={s.id} style={{padding:"10px 0",borderBottom:"1px solid var(--border)",display:"flex",gap:12,alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{color:"var(--text-primary)",fontSize:13,fontWeight:600}}>{s.name}</div>
                    <div style={{color:"var(--text-faint)",fontSize:11,marginTop:3}}>{fmtDate(s.date)} {s.location?"· "+s.location:""}</div>
                    <div style={{display:"flex",gap:6,marginTop:5,flexWrap:"wrap"}}>
                      <Badge label={s.type} color={s.type==="Level I"?"#38bdf8":"#a78bfa"} />
                      {s.enrollment.graduated&&<Badge label="Graduated" color="#4ade80" />}
                      {s.enrollment.diplomaVerified&&<Badge label="Diploma Verified" color="#38bdf8" />}
                    </div>
                  </div>
                  {s.enrollment.diplomaDate&&<span style={{color:"var(--text-faint)",fontSize:11,whiteSpace:"nowrap"}}>{fmtDate(s.enrollment.diplomaDate)}</span>}
                </div>
              ))
            }
          </div>

          <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:24}}>
            <h3 style={{margin:"0 0 14px",fontSize:13,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Match History</h3>
            {myMatches.length===0
              ? <p style={{color:"var(--text-faint)",fontSize:13}}>No match assignments yet.</p>
              : myMatches.map(m=>(
                <div key={m.id} style={{display:"flex",gap:12,alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
                  <div style={{flex:1}}>
                    <div style={{color:"var(--text-primary)",fontSize:14,fontWeight:500}}>{m.name}</div>
                    <div style={{color:"var(--text-faint)",fontSize:12,marginTop:2}}>{fmtDate(m.date)} · {m.region}</div>
                  </div>
                  <Badge label={m.assignment.role} color={certColor(m.assignment.role)} />
                  <span style={{color:"#e85d2c",fontWeight:800,fontFamily:"'Barlow Condensed',sans-serif",fontSize:16}}>+{m.assignment.pointsAwarded}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CERT APPLICATION PANEL  (shown in My Profile)
// ─────────────────────────────────────────────────────────────────────────────

const CERT_APP_OPTIONS = [
  {
    type: "RO",
    label: "Range Officer (RO)",
    color: "#4ade80",
    minCert: "RO-P",
    desc: "Full RO status. Requires passing the automated checklist above.",
    showIf: u => u.certification === "RO-P",
  },
  {
    type: "CRO",
    label: "Chief Range Officer (CRO)",
    color: "#facc15",
    minCert: "RO",
    desc: "Requires at least RO certification and demonstrated experience as an RO at matches.",
    showIf: u => certRank(u.certification) === certRank("RO"),
  },
  {
    type: "RM",
    label: "Range Master (RM)",
    color: "#f97316",
    minCert: "CRO",
    desc: "Requires CRO certification, completion of Level II seminar, and approval by NROI.",
    showIf: u => certRank(u.certification) === certRank("CRO"),
  },
  {
    type: "IROA",
    label: "IROA Membership",
    color: "#38bdf8",
    minCert: null,
    desc: "Apply to become an IROA member. Requires an active RO-P or higher certification.",
    showIf: u => certRank(u.certification) >= certRank("RO-P") && !u.iroa?.member,
  },
];

function CertApplicationPanel({ user, pendingTypes, submitApplication }) {
  const [expanded, setExpanded] = useState(null);
  const [noteText, setNoteText]  = useState({});

  const visible = CERT_APP_OPTIONS.filter(o => o.showIf(user));
  if (visible.length === 0) return null;

  return (
    <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:24,marginBottom:16}}>
      <h3 style={{margin:"0 0 6px",fontSize:13,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Apply for Upgrade</h3>
      <p style={{fontSize:12,color:"var(--text-faint)",margin:"0 0 16px"}}>Submit an application for a higher certification or IROA membership. Applications are reviewed by admins and RMs.</p>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {visible.map(opt => {
          const isPending  = pendingTypes.has(opt.type);
          const isExpanded = expanded === opt.type;
          return (
            <div key={opt.type} style={{border:`1px solid ${isPending?"#60a5fa55":isExpanded?"var(--border2)":"var(--border)"}`,borderRadius:8,overflow:"hidden"}}>
              <div style={{
                display:"flex",alignItems:"center",gap:12,padding:"12px 16px",
                background:isExpanded?"#0d1520":"transparent",cursor:isPending?"default":"pointer"
              }} onClick={()=>!isPending&&setExpanded(isExpanded?null:opt.type)}>
                <Badge label={opt.type} color={opt.color} />
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:"var(--text-primary)"}}>{opt.label}</div>
                  <div style={{fontSize:11,color:"var(--text-faint)",marginTop:2}}>{opt.desc}</div>
                </div>
                {isPending
                  ? <span style={{fontSize:11,color:"#60a5fa",whiteSpace:"nowrap"}}>⏳ Pending</span>
                  : <span style={{color:"var(--text-faint)",fontSize:14}}>{isExpanded?"▲":"▼"}</span>
                }
              </div>
              {isExpanded && !isPending && (
                <div style={{padding:"14px 16px",borderTop:"1px solid var(--border)",background:"var(--surface)"}}>
                  <Field label="Supporting note (optional)" hint="Any context you want reviewers to see — match experience, seminar dates, etc.">
                    <textarea
                      style={{...inp,height:64,resize:"vertical"}}
                      value={noteText[opt.type]||""}
                      onChange={e=>setNoteText(p=>({...p,[opt.type]:e.target.value}))}
                      placeholder="e.g. I've worked 8 matches as RO and completed Level II seminar in Bergen 2025."
                    />
                  </Field>
                  <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                    <button style={btnS} onClick={()=>setExpanded(null)}>Cancel</button>
                    <button style={{...btnP,background:opt.color==="color"?opt.color:"#e85d2c"}} onClick={()=>{
                      submitApplication(opt.type, noteText[opt.type]||"");
                      setExpanded(null);
                      setNoteText(p=>({...p,[opt.type]:""}));
                    }}>Submit Application</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: USER DATABASE
// ─────────────────────────────────────────────────────────────────────────────

function UserDatabase({ users, setUsers, regions, setRegions, applications, setApplications, matches }) {
  const { currentUser } = useAuth();
  const adminAccess = isAdmin(currentUser);
  const [tab,          setTab]          = useState("users");  // "users" | "apps" | "regions"
  const [search,       setSearch]       = useState("");
  const [roleFilter,   setRoleFilter]   = useState("All");
  const [certFilter,   setCertFilter]   = useState("All");
  const [regionFilter, setRegionFilter] = useState("All");
  const [viewUser,     setViewUser]     = useState(null);
  const [certTarget,   setCertTarget]   = useState(null);

  // Region management state
  const [newRegionName, setNewRegionName] = useState("");
  const [regionError,   setRegionError]   = useState("");
  const [regionFieldErr,setRegionFieldErr]= useState(false);

  const filtered = useMemo(() => users.filter(u=>{
    const q=search.toLowerCase();
    return (u.name.toLowerCase().includes(q)||u.email.toLowerCase().includes(q)||(u.region||"").toLowerCase().includes(q))
      && (roleFilter==="All"||u.role===roleFilter)
      && (certFilter==="All"||u.certification===certFilter)
      && (regionFilter==="All"||(u.region||"")=== regionFilter);
  }),[users,search,roleFilter,certFilter,regionFilter]);

  function setRole(id,role) {
    setUsers(prev=>prev.map(u=>u.id===id?{...u,role}:u));
    setViewUser(v=>v?.id===id?{...v,role}:v);
  }
  function toggleActive(id) {
    setUsers(prev=>prev.map(u=>u.id===id?{...u,active:!u.active}:u));
    setViewUser(v=>v?.id===id?{...v,active:!v.active}:v);
  }
  function deleteUser(id) {
    if (id===currentUser.id) return alert("You cannot delete your own account.");
    if (window.confirm("Permanently remove this user?")) { setUsers(prev=>prev.filter(u=>u.id!==id)); setViewUser(null); }
  }
  function grantCert(userId, cert, newRole, note) {
    const granter = currentUser.name;
    const entry = { cert, grantedBy:granter, date:new Date().toISOString().slice(0,10), note };
    setUsers(prev=>prev.map(u=>{
      if (u.id!==userId) return u;
      const shouldUpgrade = certRank(cert) >= certRank(u.certification);
      return { ...u, certification:shouldUpgrade?cert:u.certification, role:newRole||u.role, certHistory:[...(u.certHistory||[]),entry] };
    }));
    setCertTarget(null);
  }

  function approveApplication(app, reviewNote) {
    const today = new Date().toISOString().slice(0,10);
    setApplications(prev=>prev.map(a=>a.id===app.id
      ? {...a, status:"approved", reviewedBy:currentUser.name, reviewedDate:today, reviewNote:reviewNote||""}
      : a
    ));
    // Auto-grant: cert applications grant the cert; IROA marks membership
    if (app.type === "IROA") {
      setUsers(prev=>prev.map(u=>u.id===app.userId
        ? {...u, iroa:{member:true, since:today}}
        : u
      ));
    } else {
      const entry = { cert:app.type, grantedBy:currentUser.name, date:today, note:`Approved application${reviewNote?": "+reviewNote:""}` };
      setUsers(prev=>prev.map(u=>{
        if (u.id!==app.userId) return u;
        const shouldUpgrade = certRank(app.type) >= certRank(u.certification);
        return { ...u, certification:shouldUpgrade?app.type:u.certification, certHistory:[...(u.certHistory||[]),entry] };
      }));
    }
  }

  function rejectApplication(app, reviewNote) {
    const today = new Date().toISOString().slice(0,10);
    setApplications(prev=>prev.map(a=>a.id===app.id
      ? {...a, status:"rejected", reviewedBy:currentUser.name, reviewedDate:today, reviewNote:reviewNote||""}
      : a
    ));
  }

  // Region management
  function addRegion() {
    const name = newRegionName.trim();
    if (!name) { setRegionError("Region name cannot be empty."); setRegionFieldErr(true); return; }
    setRegionFieldErr(false);
    if (regions.includes(name)) { setRegionError(`"${name}" already exists.`); setRegionFieldErr(true); return; }
    setRegions(prev => [...prev, name].sort());
    setNewRegionName(""); setRegionError("");
  }
  function removeRegion(name) {
    const usedBy = users.filter(u=>(u.region||"")=== name).length;
    const matchUsed = /* we can't access matches here but warn generically */ false;
    if (usedBy > 0) {
      if (!window.confirm(`"${name}" is assigned to ${usedBy} user${usedBy!==1?"s":""}. Remove it from the list anyway? Existing assignments are kept.`)) return;
    } else if (!window.confirm(`Remove district "${name}" from the list?`)) return;
    setRegions(prev => prev.filter(r=>r!==name));
    if (regionFilter === name) setRegionFilter("All");
  }

  const pendingApps = (applications||[]).filter(a=>a.status==="pending");
  const liveUser = id => users.find(u=>u.id===id);
  const tabBtn = t => ({
    padding:"8px 20px", fontSize:13, fontWeight:600, cursor:"pointer", border:"none", borderRadius:6,
    background: tab===t ? "#e85d2c" : "transparent", color: tab===t ? "#fff" : "var(--text-muted)",
    display:"flex", alignItems:"center", gap:6
  });

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
        <div>
          <h1 style={{fontSize:28,fontWeight:800,margin:"0 0 4px",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.03em",color:"var(--text-primary)"}}>{adminAccess?"User Database":"Applications"}</h1>
          <p style={{color:"var(--text-faint)",margin:0,fontSize:14}}>
            {tab==="users" ? `${filtered.length} of ${users.length} users`
             : tab==="apps" ? `${pendingApps.length} pending application${pendingApps.length!==1?"s":""}` 
             : `${regions.length} districts configured`}
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{display:"flex",gap:4,marginBottom:24,background:"var(--surface)",padding:4,borderRadius:8,width:"fit-content"}}>
        {adminAccess&&<button style={tabBtn("users")}   onClick={()=>setTab("users")}>👥 Users</button>}
        <button style={tabBtn("apps")} onClick={()=>setTab("apps")}>
          📋 Applications
          {pendingApps.length>0&&<span style={{background:"#e85d2c",color:"#fff",borderRadius:10,fontSize:10,fontWeight:800,padding:"1px 6px"}}>{pendingApps.length}</span>}
        </button>
        {adminAccess&&<button style={tabBtn("regions")} onClick={()=>setTab("regions")}>🗺️ Districts</button>}
      </div>

      {adminAccess && tab === "users" && (<>
        <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, email, district…" style={{...inp,flex:1,minWidth:200}} />
          <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} style={{...inp,width:130}}>
            <option value="All">All Roles</option>
            {SYSTEM_ROLES.map(r=><option key={r}>{r}</option>)}
          </select>
          <select value={certFilter} onChange={e=>setCertFilter(e.target.value)} style={{...inp,width:130}}>
            <option value="All">All Certs</option>
            {CERT_LEVELS.map(c=><option key={c}>{c}</option>)}
          </select>
          <select value={regionFilter} onChange={e=>setRegionFilter(e.target.value)} style={{...inp,width:150}}>
            <option value="All">All Districts</option>
            {[...regions].sort().map(r=><option key={r} value={r}>{r}</option>)}
            <option value="">— No district —</option>
          </select>
        </div>
        <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:"var(--surface)"}}>
                {["User","Email","Role","Certification","District","Points","Status","Actions"].map(h=>(
                  <th key={h} style={{padding:"12px 13px",textAlign:"left",fontSize:11,fontWeight:700,color:"var(--text-faint)",textTransform:"uppercase",letterSpacing:"0.07em",borderBottom:"1px solid var(--border)"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u,i)=>(
                <tr key={u.id} style={{borderBottom:"1px solid var(--surface3)",background:i%2===0?"transparent":"var(--surface)"}}>
                  <td style={{padding:"11px 13px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:9}}>
                      <div style={{width:30,height:30,borderRadius:"50%",background:"#e85d2c",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff",flexShrink:0}}>{u.name.charAt(0)}</div>
                      <button onClick={()=>setViewUser(u)} style={{background:"none",border:"none",color:"var(--text-primary)",fontWeight:600,fontSize:14,cursor:"pointer",padding:0}}>{u.name}</button>
                      {u.id===currentUser.id&&<span style={{fontSize:10,color:"var(--text-faint)"}}>(you)</span>}
                    </div>
                  </td>
                  <td style={{padding:"11px 13px",color:"var(--text-muted)",fontSize:13}}>{u.email}</td>
                  <td style={{padding:"11px 13px"}}><Badge label={u.role} color={roleColor(u.role)} /></td>
                  <td style={{padding:"11px 13px"}}><Badge label={u.certification||"None"} color={certColor(u.certification)} /></td>
                  <td style={{padding:"11px 13px",color:"var(--text-second)",fontSize:13}}>{u.region||"—"}</td>
                  <td style={{padding:"11px 13px",color:"#e85d2c",fontWeight:800,fontFamily:"'Barlow Condensed',sans-serif",fontSize:15}}>{u.points}</td>
                  <td style={{padding:"11px 13px"}}><Badge label={u.active?"Active":"Inactive"} color={u.active?"#4ade80":"#6b7280"} /></td>
                  <td style={{padding:"11px 13px"}}>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>setCertTarget(u)} style={{...btnS,padding:"5px 10px",fontSize:11}}>Certs</button>
                      <button onClick={()=>setViewUser(u)}   style={{...btnS,padding:"5px 10px",fontSize:11}}>View</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length===0&&<tr><td colSpan={8} style={{padding:44,textAlign:"center",color:"var(--text-faint)"}}>No users found.</td></tr>}
            </tbody>
          </table>
        </div>
      </>)}

      {/* ── Applications tab ── */}
      {tab === "apps" && (
        <ApplicationsTab
          applications={applications}
          users={users}
          matches={matches}
          currentUser={currentUser}
          onApprove={approveApplication}
          onReject={rejectApplication}
        />
      )}

      {adminAccess && tab === "regions" && (
        <div>
          <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:24,marginBottom:20}}>
            <h3 style={{margin:"0 0 6px",fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>District List</h3>
            <p style={{margin:"0 0 20px",fontSize:13,color:"var(--text-faint)"}}>
              These districts appear in all district dropdowns throughout the system — for user profiles, match creation, and filters.
              Add or remove them here to configure the system for your IPSC Region. Removing a district from the list does <em style={{color:"var(--text-second)"}}>not</em> clear it from users or matches that already have it set.
            </p>

            {/* Add new district */}
            <div style={{display:"flex",gap:10,marginBottom:20,alignItems:"flex-end"}}>
              <Field label="New District Name" hint="e.g. 'Midtøst' or 'Capital District'">
                <input
                  style={{...errInp(regionFieldErr),width:260}}
                  value={newRegionName}
                  onChange={e=>{ setNewRegionName(e.target.value); setRegionError(""); setRegionFieldErr(false); }}
                  placeholder="District name…"
                  onKeyDown={e=>e.key==="Enter"&&addRegion()}
                />
              </Field>
              <button style={{...btnP,marginBottom:16}} onClick={addRegion}>Add District</button>
            </div>
            {regionError && <div style={{background:"#f8717115",border:"1px solid #f8717155",borderRadius:6,padding:"9px 13px",color:"#f87171",fontSize:13,marginBottom:16}}>{regionError}</div>}

            {/* District grid */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
              {[...regions].sort().map(r => {
                const userCount = users.filter(u=>(u.region||"")===r).length;
                return (
                  <div key={r} style={{
                    background:"var(--surface)", border:"1px solid var(--border)", borderRadius:8,
                    padding:"12px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:10
                  }}>
                    <div>
                      <div style={{color:"var(--text-primary)",fontWeight:600,fontSize:14}}>{r}</div>
                      <div style={{color:"var(--text-faint)",fontSize:12,marginTop:2}}>{userCount} user{userCount!==1?"s":""}</div>
                    </div>
                    <button onClick={()=>removeRegion(r)} style={{
                      background:"none", border:"1px solid var(--border2)", borderRadius:5,
                      color:"var(--text-muted)", cursor:"pointer", padding:"4px 9px", fontSize:12,
                      lineHeight:1
                    }} title={`Remove ${r}`}>✕</button>
                  </div>
                );
              })}
            </div>

            {regions.length === 0 && (
              <div style={{textAlign:"center",padding:40,color:"var(--text-faint)",fontSize:13}}>
                No districts configured. Add one above, or district fields will fall back to free text.
              </div>
            )}
          </div>

          <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:18}}>
            <div style={{fontSize:12,color:"var(--text-faint)"}}>
              <strong style={{color:"var(--text-muted)"}}>Note for other IPSC Regions:</strong> This system ships with IPSC Norway's ten official districts as the default. Replace them here with your own nation's district breakdown. The software does not hard-code any district names — this list is the sole source of truth for all dropdowns.
            </div>
          </div>

          {/* ── Data & Storage ── */}
          <div style={{background:"var(--surface2)",border:"1px solid #f8717144",borderRadius:8,padding:24,marginTop:20}}>
            <h3 style={{margin:"0 0 6px",fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>⚠️ Data &amp; Storage</h3>
            <p style={{margin:"0 0 16px",fontSize:13,color:"var(--text-faint)"}}>
              All application data — users, matches, clubs, seminars, documents, and settings — is stored in your browser's <strong style={{color:"var(--text-muted)"}}>localStorage</strong>.
              Data persists across page refreshes and browser restarts on this device, but is <strong style={{color:"var(--text-muted)"}}>not shared between browsers or devices</strong>.
              Clearing browser site data will erase all records.
            </p>
            <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{fontSize:12,color:"var(--text-faint)"}}>
                Storage used: <strong style={{color:"var(--text-second)"}}>
                  {(()=>{try{const used=Object.values(LS_KEYS).reduce((s,k)=>{const v=localStorage.getItem(k);return s+(v?v.length:0);},0);return used<1024?used+" B":used<1048576?(used/1024).toFixed(1)+" KB":(used/1048576).toFixed(1)+" MB";}catch{return "—";}})()}
                </strong>
              </div>
              <button
                style={{...btnD, padding:"9px 18px", marginLeft:"auto"}}
                onClick={()=>{
                  if (window.confirm("Reset ALL data to factory defaults?\n\nThis will permanently delete all users, matches, clubs, seminars, documents and settings you have created. The seed demo data will be restored.\n\nThis cannot be undone.")) {
                    wipeAndReset();
                  }
                }}
              >
                🗑️ Reset to Factory Defaults
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View/manage user modal */}
      {viewUser && (
        <Modal title={`User: ${viewUser.name}`} onClose={()=>setViewUser(null)} wide>
          {(() => {
            const u = liveUser(viewUser.id) || viewUser;
            return (
              <div style={{display:"flex",gap:26}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
                    <div style={{width:50,height:50,borderRadius:"50%",background:"#e85d2c",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:"#fff"}}>{u.name.charAt(0)}</div>
                    <div>
                      <div style={{fontSize:18,fontWeight:700,color:"var(--text-primary)"}}>{u.name}</div>
                      <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
                        <Badge label={u.role} color={roleColor(u.role)} />
                        <Badge label={u.certification||"No Cert"} color={certColor(u.certification)} />
                        <Badge label={u.active?"Active":"Inactive"} color={u.active?"#4ade80":"#6b7280"} />
                      </div>
                    </div>
                  </div>
                  <InfoRow label="Email"     value={u.email} />
                  <InfoRow label="District"  value={u.region||"—"} />
                  <InfoRow label="Joined"    value={fmtDate(u.joined)} />
                  <InfoRow label="Points"    value={u.points} />
                  <InfoRow label="IROA Member" value={
                    u.iroa?.member
                      ? `Yes${u.iroa.since ? " — since " + fmtDate(u.iroa.since) : ""}`
                      : "No"
                  } />
                  {u.notes&&<InfoRow label="Notes" value={u.notes}/>}
                  {u.id!==currentUser.id && (
                    <>
                      <Divider label="Admin Controls" />
                      <Field label="System Role">
                        <select style={inp} value={u.role} onChange={e=>setRole(u.id,e.target.value)}>
                          {SYSTEM_ROLES.map(r=><option key={r}>{r}</option>)}
                        </select>
                      </Field>
                      <Field label="District">
                        <RegionSelect
                          value={u.region||""}
                          onChange={v=>setUsers(prev=>prev.map(x=>x.id===u.id?{...x,region:v}:x))}
                          regions={regions}
                        />
                      </Field>
                      <Field label="IROA Membership">
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
                            <input type="checkbox"
                              checked={!!(u.iroa?.member)}
                              onChange={e=>{
                                const member=e.target.checked;
                                setUsers(prev=>prev.map(x=>x.id===u.id?{...x,iroa:{member,since:member?(x.iroa?.since||new Date().toISOString().slice(0,10)):null}}:x));
                              }}
                              style={{width:16,height:16,accentColor:"#e85d2c"}} />
                            <span style={{fontSize:13,color:"var(--text-primary)"}}>IROA Member</span>
                          </label>
                          {u.iroa?.member && (
                            <input type="date"
                              style={{...inp,width:150,padding:"6px 10px",fontSize:12}}
                              value={u.iroa?.since||""}
                              onChange={e=>setUsers(prev=>prev.map(x=>x.id===u.id?{...x,iroa:{...x.iroa,since:e.target.value}}:x))}
                            />
                          )}
                        </div>
                      </Field>
                      <Field label="Profile Photo">
                        <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
                          <input type="checkbox"
                            checked={!!u.profilePhotoApproved}
                            onChange={e=>setUsers(prev=>prev.map(x=>x.id===u.id?{...x,profilePhotoApproved:e.target.checked}:x))}
                            style={{width:16,height:16,accentColor:"#e85d2c"}} />
                          <span style={{fontSize:13,color:"var(--text-primary)"}}>Profile photo approved</span>
                        </label>
                      </Field>
                      <div style={{display:"flex",gap:8,marginTop:4}}>
                        <button style={{...btnS,padding:"8px 14px",fontSize:13}} onClick={()=>toggleActive(u.id)}>{u.active?"Deactivate":"Reactivate"} Account</button>
                        <button style={{...btnD,padding:"8px 14px",fontSize:13}} onClick={()=>deleteUser(u.id)}>Delete User</button>
                      </div>
                    </>
                  )}
                </div>
                <div style={{width:250}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <h4 style={{margin:0,fontSize:12,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Cert History</h4>
                    <button style={{...btnP,padding:"5px 10px",fontSize:11}} onClick={()=>{setCertTarget(u);setViewUser(null);}}>+ Grant</button>
                  </div>
                  {(!u.certHistory||u.certHistory.length===0)
                    ? <p style={{color:"var(--text-faint)",fontSize:13}}>No certifications.</p>
                    : [...u.certHistory].reverse().map((c,i)=>(
                      <div key={i} style={{padding:"9px 0",borderBottom:"1px solid var(--border)"}}>
                        <div style={{display:"flex",gap:6,alignItems:"center"}}><Badge label={c.cert} color={certColor(c.cert)} /><span style={{color:"var(--text-muted)",fontSize:11}}>{fmtDate(c.date)}</span></div>
                        <div style={{color:"var(--text-faint)",fontSize:11,marginTop:4}}>By: {c.grantedBy}</div>
                        {c.note&&<div style={{color:"var(--text-muted)",fontSize:11,fontStyle:"italic"}}>{c.note}</div>}
                      </div>
                    ))
                  }
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Grant Cert Modal */}
      {certTarget && (
        <GrantCertModal
          user={liveUser(certTarget.id)||certTarget}
          granterName={currentUser.name}
          onClose={()=>setCertTarget(null)}
          onSave={grantCert}
        />
      )}
    </div>
  );
}

