import React, { useState, useMemo, useEffect, useRef } from "react";
import { certColor, roleColor, statusColor, fmtDate, certRank, canManageMatches, isAdmin, uid, inp, btnS, btnP, btnD, errInp, clubRoleColor, canManageClub, isClubPresident, docCatColor, docTypeColor, fmtFileSize, computeYearlyPoints, meetsLevelOrHigher, checkAnnualMaintenance } from "../lib/helpers";
import { CERT_LEVELS, SYSTEM_ROLES, MATCH_LEVEL_POINTS, SEMINAR_INSTRUCTOR_POINTS, POINT_RULES, IPSC_DISCIPLINES, DQ_REASONS, DEFAULT_REGIONS, DOC_CATEGORIES } from "../lib/constants";
import { Badge, StatCard, Modal, Field, InfoRow, Divider, RegionSelect, UserPicker, useAuth, useTheme } from "../components/ui";

export default function ClubsPage({ users, clubs, setClubs, applications, setApplications, matches, regions }) {
  const { currentUser } = useAuth();
  const admin = isAdmin(currentUser);

  const [search,     setSearch]     = useState("");
  const [regionFilt, setRegionFilt] = useState("All");
  const [detail,     setDetail]     = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createFe,   setCreateFe]   = useState({});
  const [createForm, setCreateForm] = useState({ name:"", shortName:"", region:"", website:"", contactEmail:"", founded:"", description:"" });

  const filtered = clubs.filter(c => {
    const q = search.toLowerCase();
    return (c.name.toLowerCase().includes(q) || c.shortName.toLowerCase().includes(q))
      && (regionFilt === "All" || c.region === regionFilt);
  });

  // Membership helpers for current user
  function myMembership(club) {
    return (club.members||[]).find(m=>m.userId===currentUser.id&&m.status==="active");
  }
  function hasPendingApp(clubId) {
    return (applications||[]).some(a=>a.type==="club_membership"&&a.clubId===clubId&&a.userId===currentUser.id&&a.status==="pending");
  }

  function applyMembership(clubId) {
    const app = {
      id:"app"+Date.now(), userId:currentUser.id, userName:currentUser.name,
      userCert:currentUser.certification, userRegion:currentUser.region,
      type:"club_membership", clubId, date:new Date().toISOString().slice(0,10),
      note:"", status:"pending", reviewedBy:null, reviewedDate:null, reviewNote:""
    };
    setApplications(prev=>[...prev,app]);
  }

  function createClub() {
    const errs = {};
    if (!createForm.name.trim())      errs.name      = true;
    if (!createForm.shortName.trim()) errs.shortName = true;
    if (!createForm.region)           errs.region    = true;
    if (Object.keys(errs).length) { setCreateFe(errs); return; }
    const club = {
      ...createForm,
      id: "c"+(clubs.length+1)+(Date.now()%10000),
      active: true,
      members: [{ userId:currentUser.id, role:"president", since:new Date().toISOString().slice(0,10), status:"active" }]
    };
    setClubs(prev=>[...prev,club]);
    setShowCreate(false);
    setCreateForm({ name:"", shortName:"", region:"", website:"", contactEmail:"", founded:"", description:"" });
    setCreateFe({});
    setDetail(club);
  }

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
        <div>
          <h1 style={{margin:"0 0 4px",fontSize:26,fontWeight:800,color:"var(--text-primary)",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.04em"}}>Clubs</h1>
          <p style={{margin:0,color:"var(--text-muted)",fontSize:14}}>{clubs.length} registered club{clubs.length!==1?"s":""} · apply for membership or manage your club</p>
        </div>
        <button style={{...btnP,padding:"10px 18px"}} onClick={()=>{setShowCreate(true);setCreateFe({});}}>+ Register Club</button>
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search clubs…" style={{...inp,flex:1,minWidth:180}} />
        <select style={{...inp,width:160}} value={regionFilt} onChange={e=>setRegionFilt(e.target.value)}>
          <option value="All">All Districts</option>
          {[...new Set(clubs.map(c=>c.region))].sort().map(r=><option key={r}>{r}</option>)}
        </select>
      </div>

      {/* Club cards */}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.map(club => {
          const membership = myMembership(club);
          const pending    = hasPendingApp(club.id);
          const canManage  = canManageClub(currentUser, club);
          const matchCount = (matches||[]).filter(m=>m.hostClubId===club.id).length;

          return (
            <div key={club.id} style={{
              background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:10,
              padding:"16px 20px",display:"flex",alignItems:"center",gap:16
            }}>
              {/* Club avatar */}
              <div style={{
                width:46,height:46,borderRadius:10,background:"#e85d2c",flexShrink:0,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:14,fontWeight:800,color:"#fff",letterSpacing:"0.05em",fontFamily:"'Barlow Condensed',sans-serif"
              }}>{club.shortName.slice(0,3)}</div>

              <div style={{flex:1}}>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:15,color:"var(--text-primary)"}}>{club.name}</span>
                  <Badge label={club.shortName} color="#7c8cf8" />
                  <Badge label={club.region}    color="var(--text-faint)" />
                  {membership && <Badge label={membership.role} color={clubRoleColor(membership.role)} />}
                  {canManage  && <Badge label="⚙ Admin" color="#a855f7" />}
                </div>
                <div style={{fontSize:12,color:"var(--text-muted)",display:"flex",gap:14,flexWrap:"wrap"}}>
                  <span>👥 {(club.members||[]).filter(m=>m.status==="active").length} member{(club.members||[]).filter(m=>m.status==="active").length!==1?"s":""}</span>
                  {matchCount>0 && <span>🎯 {matchCount} match{matchCount!==1?"es":""} hosted</span>}
                  {club.website && <a href={club.website} target="_blank" rel="noopener noreferrer" style={{color:"#60a5fa",textDecoration:"none"}}>🔗 Website</a>}
                </div>
                {club.description && <div style={{fontSize:12,color:"var(--text-faint)",marginTop:4,fontStyle:"italic",maxWidth:560}}>{club.description.length>100?club.description.slice(0,100)+"…":club.description}</div>}
              </div>

              <div style={{display:"flex",gap:8,flexShrink:0,alignItems:"center"}}>
                {!membership && !pending && (
                  <button style={{...btnS,padding:"7px 14px",fontSize:13}} onClick={()=>applyMembership(club.id)}>Apply to Join</button>
                )}
                {!membership && pending && (
                  <span style={{fontSize:12,color:"#60a5fa",padding:"7px 12px"}}>⏳ Application pending</span>
                )}
                {membership && !canManage && (
                  <span style={{fontSize:12,color:"#4ade80",padding:"7px 12px"}}>✓ Member</span>
                )}
                <button style={{...btnP,padding:"7px 14px",fontSize:13}} onClick={()=>setDetail(club)}>
                  {canManage ? "Manage" : "View"}
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length===0 && <div style={{textAlign:"center",padding:60,color:"var(--text-faint)"}}>No clubs found.</div>}
      </div>

      {/* Create Club Modal */}
      {showCreate && (
        <Modal title="Register New Club" onClose={()=>{setShowCreate(false);setCreateFe({});}}>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16}}>
            <Field label="Club Name">
              <input style={errInp(createFe.name)} value={createForm.name}
                onChange={e=>{setCreateForm(f=>({...f,name:e.target.value}));setCreateFe(p=>({...p,name:false}));}}
                placeholder="e.g. Oslo Pistolklubb" />
            </Field>
            <Field label="Short Name / Abbreviation">
              <input style={errInp(createFe.shortName)} value={createForm.shortName}
                onChange={e=>{setCreateForm(f=>({...f,shortName:e.target.value.toUpperCase()}));setCreateFe(p=>({...p,shortName:false}));}}
                placeholder="e.g. OPK" maxLength={6} />
            </Field>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <Field label="District">
              <RegionSelect value={createForm.region} onChange={v=>{setCreateForm(f=>({...f,region:v}));setCreateFe(p=>({...p,region:false}));}}
                regions={regions} placeholder="— Select district —" hasError={createFe.region} />
            </Field>
            <Field label="Founded (optional)">
              <input style={inp} type="date" value={createForm.founded} onChange={e=>setCreateForm(f=>({...f,founded:e.target.value}))} />
            </Field>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <Field label="Website (optional)">
              <input style={inp} type="url" value={createForm.website} onChange={e=>setCreateForm(f=>({...f,website:e.target.value}))} placeholder="https://…" />
            </Field>
            <Field label="Contact Email (optional)">
              <input style={inp} type="email" value={createForm.contactEmail} onChange={e=>setCreateForm(f=>({...f,contactEmail:e.target.value}))} placeholder="info@club.no" />
            </Field>
          </div>
          <Field label="Description (optional)">
            <textarea style={{...inp,height:72,resize:"vertical"}} value={createForm.description}
              onChange={e=>setCreateForm(f=>({...f,description:e.target.value}))} placeholder="Brief description of the club…" />
          </Field>
          <div style={{background:"#60a5fa11",border:"1px solid #60a5fa33",borderRadius:7,padding:"10px 14px",fontSize:12,color:"var(--text-muted)",marginBottom:8}}>
            You will be added as <Badge label="president" color="#f97316" /> of this club.
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={btnS} onClick={()=>{setShowCreate(false);setCreateFe({});}}>Cancel</button>
            <button style={btnP} onClick={createClub}>Register Club</button>
          </div>
        </Modal>
      )}

      {/* Club Detail Modal */}
      {detail && (
        <ClubDetailModal
          club={clubs.find(c=>c.id===detail.id)||detail}
          users={users}
          currentUser={currentUser}
          applications={applications}
          setApplications={setApplications}
          matches={matches}
          onClose={()=>setDetail(null)}
          onUpdate={updated=>setClubs(prev=>prev.map(c=>c.id===updated.id?updated:c))}
          isAdmin={admin}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CLUB DETAIL MODAL
// Tabs: Info | Members | Applications (club admins) | Matches
// ─────────────────────────────────────────────────────────────────────────────

function ClubDetailModal({ club, users, currentUser, applications, setApplications, matches, onClose, onUpdate, isAdmin: sysAdmin }) {
  const [tab,        setTab]        = useState("info");
  const [editMode,   setEditMode]   = useState(false);
  const [editForm,   setEditForm]   = useState({ name:club.name, shortName:club.shortName, website:club.website||"", contactEmail:club.contactEmail||"", description:club.description||"" });
  const [editFe,     setEditFe]     = useState({});
  const [reviewingId,setReviewingId]= useState(null);
  const [reviewNote, setReviewNote] = useState("");

  const canManage = canManageClub(currentUser, club);
  const isPresident = isClubPresident(currentUser, club);

  const activeMembers = (club.members||[]).filter(m=>m.status==="active");
  const pendingApps   = (applications||[]).filter(a=>a.type==="club_membership"&&a.clubId===club.id&&a.status==="pending");
  const hostMatches   = (matches||[]).filter(m=>m.hostClubId===club.id);

  function saveEdit() {
    const errs = {};
    if (!editForm.name.trim())      errs.name      = true;
    if (!editForm.shortName.trim()) errs.shortName = true;
    if (Object.keys(errs).length) { setEditFe(errs); return; }
    setEditFe({});
    onUpdate({ ...club, ...editForm });
    setEditMode(false);
  }

  function approveApp(app) {
    // Add to club members
    const newMember = { userId:app.userId, role:"member", since:new Date().toISOString().slice(0,10), status:"active" };
    onUpdate({ ...club, members:[...(club.members||[]), newMember] });
    // Update application status
    setApplications(prev=>prev.map(a=>a.id===app.id
      ? {...a, status:"approved", reviewedBy:currentUser.name, reviewedDate:new Date().toISOString().slice(0,10), reviewNote}
      : a
    ));
    setReviewingId(null); setReviewNote("");
  }

  function rejectApp(app) {
    setApplications(prev=>prev.map(a=>a.id===app.id
      ? {...a, status:"rejected", reviewedBy:currentUser.name, reviewedDate:new Date().toISOString().slice(0,10), reviewNote}
      : a
    ));
    setReviewingId(null); setReviewNote("");
  }

  function setMemberRole(userId, newRole) {
    onUpdate({ ...club, members:(club.members||[]).map(m=>m.userId===userId?{...m,role:newRole}:m) });
  }

  function suspendMember(userId) {
    onUpdate({ ...club, members:(club.members||[]).map(m=>m.userId===userId?{...m,status:"suspended"}:m) });
  }

  function reinstateMember(userId) {
    onUpdate({ ...club, members:(club.members||[]).map(m=>m.userId===userId?{...m,status:"active"}:m) });
  }

  function removeMember(userId) {
    if (!window.confirm("Remove this member from the club?")) return;
    onUpdate({ ...club, members:(club.members||[]).filter(m=>m.userId!==userId) });
  }

  const TABS = [
    { id:"info",     label:"Info" },
    { id:"members",  label:`Members (${activeMembers.length})` },
    canManage && pendingApps.length > 0 && { id:"apps", label:`Applications (${pendingApps.length})`, accent:true },
    canManage && { id:"apps", label:`Applications${pendingApps.length>0?" ("+pendingApps.length+")":""}`, accent:pendingApps.length>0 },
    { id:"matches",  label:`Matches (${hostMatches.length})` },
  ].filter(Boolean);

  // Dedupe tabs (apps appears twice due to conditional logic above)
  const seenIds = new Set();
  const uniqueTabs = TABS.filter(t=>{ if(seenIds.has(t.id)){return false;} seenIds.add(t.id); return true; });

  const tabStyle = t => ({
    background:"none", border:"none",
    borderBottom: tab===t.id ? "2px solid #e85d2c" : "2px solid transparent",
    color: tab===t.id ? "var(--text-primary)" : "var(--text-muted)",
    padding:"9px 16px", cursor:"pointer", fontSize:13, fontWeight:tab===t.id?700:400,
    marginBottom:-1, whiteSpace:"nowrap",
    ...(t.accent && tab!==t.id ? {color:"#e85d2c"} : {})
  });

  return (
    <Modal title={club.name} onClose={onClose} wide>
      {/* Club header strip */}
      <div style={{display:"flex",gap:16,alignItems:"center",marginBottom:20,padding:"14px 18px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8}}>
        <div style={{width:52,height:52,borderRadius:10,background:"#e85d2c",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#fff",letterSpacing:"0.05em",fontFamily:"'Barlow Condensed',sans-serif",flexShrink:0}}>
          {club.shortName.slice(0,3)}
        </div>
        <div style={{flex:1}}>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:4}}>
            <Badge label={club.shortName} color="#7c8cf8" />
            <Badge label={club.region}    color="var(--text-faint)" />
            {!club.active && <Badge label="Inactive" color="#f87171" />}
          </div>
          <div style={{display:"flex",gap:16,fontSize:12,color:"var(--text-muted)",flexWrap:"wrap"}}>
            <span>👥 {activeMembers.length} active member{activeMembers.length!==1?"s":""}</span>
            {club.founded && <span>📅 Founded {fmtDate(club.founded)}</span>}
            {club.contactEmail && <span>✉️ {club.contactEmail}</span>}
            {club.website && <a href={club.website} target="_blank" rel="noopener noreferrer" style={{color:"#60a5fa",textDecoration:"none"}}>🔗 Website</a>}
          </div>
        </div>
        {canManage && !editMode && (
          <button style={{...btnS,padding:"7px 14px",fontSize:12}} onClick={()=>setEditMode(true)}>✏️ Edit</button>
        )}
      </div>

      {/* Tab bar */}
      <div style={{display:"flex",gap:0,borderBottom:"1px solid var(--border)",marginBottom:20,overflowX:"auto"}}>
        {uniqueTabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={tabStyle(t)}>{t.label}</button>
        ))}
      </div>

      {/* ── INFO TAB ── */}
      {tab==="info" && (
        <div>
          {editMode ? (
            <div>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16}}>
                <Field label="Club Name">
                  <input style={errInp(editFe.name)} value={editForm.name}
                    onChange={e=>{setEditForm(f=>({...f,name:e.target.value}));setEditFe(p=>({...p,name:false}));}} />
                </Field>
                <Field label="Short Name">
                  <input style={errInp(editFe.shortName)} value={editForm.shortName}
                    onChange={e=>{setEditForm(f=>({...f,shortName:e.target.value.toUpperCase()}));setEditFe(p=>({...p,shortName:false}));}}
                    maxLength={6} />
                </Field>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <Field label="Website">
                  <input style={inp} type="url" value={editForm.website} onChange={e=>setEditForm(f=>({...f,website:e.target.value}))} placeholder="https://…" />
                </Field>
                <Field label="Contact Email">
                  <input style={inp} type="email" value={editForm.contactEmail} onChange={e=>setEditForm(f=>({...f,contactEmail:e.target.value}))} />
                </Field>
              </div>
              <Field label="Description">
                <textarea style={{...inp,height:80,resize:"vertical"}} value={editForm.description} onChange={e=>setEditForm(f=>({...f,description:e.target.value}))} />
              </Field>
              <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:4}}>
                <button style={btnS} onClick={()=>{setEditMode(false);setEditFe({});}}>Cancel</button>
                <button style={btnP} onClick={saveEdit}>Save Changes</button>
              </div>
            </div>
          ) : (
            <div>
              {club.description && (
                <p style={{color:"var(--text-second)",fontSize:14,lineHeight:1.6,marginTop:0,marginBottom:20}}>{club.description}</p>
              )}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <InfoRow label="District"      value={club.region||"—"} />
                <InfoRow label="Founded"       value={club.founded?fmtDate(club.founded):"—"} />
                <InfoRow label="Contact Email" value={club.contactEmail||"—"} />
                <InfoRow label="Website"       value={club.website||"—"} />
                <InfoRow label="Active Members" value={activeMembers.length} />
                <InfoRow label="Matches Hosted" value={hostMatches.length} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MEMBERS TAB ── */}
      {tab==="members" && (
        <div>
          {/* Role legend */}
          <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
            {CLUB_ROLES.map(r=>(
              <span key={r} style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"var(--text-faint)"}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:clubRoleColor(r),display:"inline-block"}} />{r}
              </span>
            ))}
            <span style={{fontSize:12,color:"var(--text-faint)",marginLeft:8}}>· President can manage roles · Secretary can approve/reject applications</span>
          </div>

          {/* All members (active + suspended) */}
          {(club.members||[]).length===0 && <p style={{color:"var(--text-faint)",fontSize:14}}>No members yet.</p>}
          {(club.members||[]).map(m=>{
            const u = users.find(u=>u.id===m.userId);
            if (!u) return null;
            const isSelf = m.userId === currentUser.id;
            const isThisPresident = m.role==="president";
            const canChangeRole = isPresident && !isSelf;
            const canRemove = isPresident && !isSelf;

            return (
              <div key={m.userId} style={{
                display:"flex",alignItems:"center",gap:12,padding:"10px 0",
                borderBottom:"1px solid var(--border)",
                opacity: m.status==="suspended" ? 0.5 : 1
              }}>
                <div style={{width:34,height:34,borderRadius:"50%",background:"#e85d2c",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff",flexShrink:0}}>{u.name.charAt(0)}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{color:"var(--text-primary)",fontWeight:600,fontSize:14}}>{u.name}</span>
                    {isSelf && <span style={{fontSize:11,color:"var(--text-faint)"}}>(you)</span>}
                    <Badge label={m.role} color={clubRoleColor(m.role)} />
                    {m.status==="suspended" && <Badge label="Suspended" color="#f87171" />}
                    {u.certification!=="None" && <Badge label={u.certification} color={certColor(u.certification)} />}
                  </div>
                  <div style={{fontSize:12,color:"var(--text-faint)",marginTop:2}}>
                    Member since {fmtDate(m.since)} · {u.region||"—"}
                  </div>
                </div>

                {canManage && (
                  <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                    {/* Role select — only president can change roles */}
                    {canChangeRole && (
                      <select
                        style={{...inp,width:110,padding:"5px 8px",fontSize:12}}
                        value={m.role}
                        onChange={e=>setMemberRole(m.userId,e.target.value)}
                      >
                        {CLUB_ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                      </select>
                    )}
                    {m.status==="active" && canRemove && (
                      <button style={{...btnD,padding:"4px 9px",fontSize:11}} onClick={()=>suspendMember(m.userId)}>Suspend</button>
                    )}
                    {m.status==="suspended" && canRemove && (
                      <button style={{...btnS,padding:"4px 9px",fontSize:11}} onClick={()=>reinstateMember(m.userId)}>Reinstate</button>
                    )}
                    {canRemove && (
                      <button style={{...btnD,padding:"4px 9px",fontSize:11}} onClick={()=>removeMember(m.userId)}>✕</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── APPLICATIONS TAB ── */}
      {tab==="apps" && canManage && (
        <div>
          {pendingApps.length===0 && <p style={{color:"var(--text-faint)",fontSize:14}}>No pending membership applications.</p>}
          {pendingApps.map(app=>{
            const applicant = users.find(u=>u.id===app.userId);
            const isReviewing = reviewingId===app.id;
            return (
              <div key={app.id} style={{background:"var(--surface2)",border:"1px solid var(--border2)",borderRadius:10,overflow:"hidden",marginBottom:10}}>
                <div style={{padding:"14px 18px",display:"flex",gap:14,alignItems:"center"}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:"#e85d2c",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff",flexShrink:0}}>
                    {(applicant?.name||app.userName||"?").charAt(0)}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,color:"var(--text-primary)",fontSize:14,marginBottom:2}}>{applicant?.name||app.userName}</div>
                    <div style={{fontSize:12,color:"var(--text-faint)",display:"flex",gap:12,flexWrap:"wrap"}}>
                      <span>Cert: {applicant?.certification||"—"}</span>
                      <span>District: {applicant?.region||"—"}</span>
                      <span>Applied: {fmtDate(app.date)}</span>
                    </div>
                    {app.note&&<div style={{marginTop:6,fontSize:13,color:"var(--text-muted)",fontStyle:"italic"}}>&ldquo;{app.note}&rdquo;</div>}
                  </div>
                  {!isReviewing && (
                    <div style={{display:"flex",gap:8}}>
                      <button style={{...btnP,padding:"7px 14px",fontSize:12,background:"#16a34a"}} onClick={()=>{setReviewingId(app.id);setReviewNote("");}}>Approve</button>
                      <button style={{...btnD,padding:"7px 14px",fontSize:12}} onClick={()=>{setReviewingId(app.id);setReviewNote("");}}>Reject</button>
                    </div>
                  )}
                </div>
                {isReviewing && (
                  <div style={{padding:"12px 18px",borderTop:"1px solid var(--border)",background:"var(--surface)"}}>
                    <Field label="Note (optional)">
                      <input style={inp} value={reviewNote} onChange={e=>setReviewNote(e.target.value)} placeholder="Optional note for the applicant…" />
                    </Field>
                    <div style={{display:"flex",gap:8,marginTop:4}}>
                      <button style={{...btnP,background:"#16a34a",padding:"8px 16px",fontSize:13}} onClick={()=>approveApp(app)}>✓ Confirm Approve</button>
                      <button style={{...btnD,padding:"8px 16px",fontSize:13}} onClick={()=>rejectApp(app)}>✕ Confirm Reject</button>
                      <button style={{...btnS,padding:"8px 12px",fontSize:13}} onClick={()=>setReviewingId(null)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Past apps */}
          {(applications||[]).filter(a=>a.type==="club_membership"&&a.clubId===club.id&&a.status!=="pending").length>0 && (
            <div style={{marginTop:20}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--text-faint)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Past Decisions</div>
              {(applications||[]).filter(a=>a.type==="club_membership"&&a.clubId===club.id&&a.status!=="pending").map(app=>(
                <div key={app.id} style={{padding:"8px 0",borderBottom:"1px solid var(--border)",fontSize:13,display:"flex",gap:10,alignItems:"center"}}>
                  <Badge label={app.status} color={app.status==="approved"?"#4ade80":"#f87171"} />
                  <span style={{color:"var(--text-primary)"}}>{app.userName}</span>
                  <span style={{color:"var(--text-faint)",fontSize:12}}>by {app.reviewedBy} · {fmtDate(app.reviewedDate)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MATCHES TAB ── */}
      {tab==="matches" && (
        <div>
          {hostMatches.length===0 && <p style={{color:"var(--text-faint)",fontSize:14}}>No matches hosted by this club yet.</p>}
          {hostMatches.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(m=>(
            <div key={m.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
              <div style={{flex:1}}>
                <div style={{color:"var(--text-primary)",fontWeight:600,fontSize:14,marginBottom:2}}>{m.name}</div>
                <div style={{fontSize:12,color:"var(--text-faint)",display:"flex",gap:12,flexWrap:"wrap"}}>
                  <span>📅 {fmtDate(m.date)}</span>
                  <span>🎯 {m.stages} stages</span>
                  <span>{m.assignments.length} RO{m.assignments.length!==1?"s":""}</span>
                </div>
              </div>
              <Badge label={m.level}  color="#7c8cf8" />
              <Badge label={m.status} color={statusColor(m.status)} />
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}


