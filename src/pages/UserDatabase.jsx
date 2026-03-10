import React, { useState, useMemo, useEffect, useRef } from "react";
import { certColor, roleColor, statusColor, fmtDate, certRank, canManageMatches, isAdmin, uid, inp, btnS, btnP, btnD, errInp, clubRoleColor, canManageClub, isClubPresident, docCatColor, docTypeColor, fmtFileSize, computeYearlyPoints, meetsLevelOrHigher, checkAnnualMaintenance } from "../lib/helpers";
import { CERT_LEVELS, SYSTEM_ROLES, MATCH_LEVEL_POINTS, SEMINAR_INSTRUCTOR_POINTS, POINT_RULES, IPSC_DISCIPLINES, DQ_REASONS, DEFAULT_REGIONS, DOC_CATEGORIES } from "../lib/constants";
import { Badge, StatCard, Modal, Field, InfoRow, Divider, RegionSelect, UserPicker, useAuth, useTheme } from "../components/ui";

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

export default function UserDatabase({ users, setUsers, regions, setRegions, applications, setApplications, matches }) {
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

function GrantCertModal({ user, granterName, onClose, onSave }) {
  const [cert,      setCert]      = useState("RO-P");
  const [newRole,   setNewRole]   = useState(user.role);
  const [note,      setNote]      = useState("");

  function handleCertChange(c) {
    setCert(c);
    // Auto-suggest role upgrade: RM cert → rm role
    if (c==="RM" && user.role==="member") setNewRole("rm");
    else setNewRole(user.role);
  }

  return (
    <Modal title={`Grant Certification — ${user.name}`} onClose={onClose}>
      <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:16,marginBottom:20}}>
        <div style={{fontSize:13,color:"var(--text-second)",display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          Current cert: <Badge label={user.certification||"None"} color={certColor(user.certification)} />
          Current role: <Badge label={user.role} color={roleColor(user.role)} />
        </div>
      </div>
      <Field label="Certification to Grant" hint="This will be appended to the user's certification history.">
        <select style={inp} value={cert} onChange={e=>handleCertChange(e.target.value)}>
          {["RO-P","RO","CRO","RM"].map(c=><option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Update System Role" hint="Adjust account privileges to match. RM cert → rm role is recommended.">
        <select style={inp} value={newRole} onChange={e=>setNewRole(e.target.value)}>
          {SYSTEM_ROLES.map(r=><option key={r}>{r}</option>)}
        </select>
      </Field>
      <Field label="Notes / Reason (optional)">
        <input style={inp} value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. Passed RO exam at Bergen Regional 2026" />
      </Field>
      <div style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:6,padding:"11px 14px",fontSize:12,color:"var(--text-muted)",marginBottom:22}}>
        <strong style={{color:"var(--text-second)"}}>Note:</strong> Granting a cert <em>adds</em> a history entry. The user's displayed certification updates only if the new cert is equal or higher rank than the current one. All cert grants are logged with your name ({granterName}) and today's date.
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button style={btnS} onClick={onClose}>Cancel</button>
        <button style={btnP} onClick={()=>onSave(user.id,cert,newRole,note)}>Grant {cert} Certification</button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLICATIONS TAB  (used inside UserDatabase)
// ─────────────────────────────────────────────────────────────────────────────

function ApplicationsTab({ applications, users, matches, currentUser, onApprove, onReject }) {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [reviewingId,  setReviewingId]  = useState(null);
  const [reviewNote,   setReviewNote]   = useState("");

  const filtered = (applications||[])
    .filter(a => statusFilter==="all" || a.status===statusFilter)
    .sort((a,b)=>new Date(b.date)-new Date(a.date));

  const appTypeColor = t => ({RO:"#4ade80",CRO:"#facc15",RM:"#f97316",IROA:"#38bdf8",club_membership:"#7c8cf8"})[t]||"#9ca3af";

  function handleApprove(app) {
    onApprove(app, reviewNote);
    setReviewingId(null); setReviewNote("");
  }
  function handleReject(app) {
    onReject(app, reviewNote);
    setReviewingId(null); setReviewNote("");
  }

  return (
    <div>
      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",gap:4,background:"var(--surface)",padding:4,borderRadius:7}}>
          {["pending","approved","rejected","all"].map(s=>(
            <button key={s} onClick={()=>setStatusFilter(s)} style={{
              padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",border:"none",borderRadius:5,
              background:statusFilter===s?"#e85d2c":"transparent",color:statusFilter===s?"#fff":"var(--text-muted)",textTransform:"capitalize"
            }}>{s}</button>
          ))}
        </div>
        <span style={{color:"var(--text-faint)",fontSize:13}}>{filtered.length} application{filtered.length!==1?"s":""}</span>
      </div>

      {filtered.length===0 ? (
        <div style={{textAlign:"center",padding:60,color:"var(--text-faint)",fontSize:14}}>
          No {statusFilter==="all"?"":statusFilter} applications.
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map(app=>{
            const applicant = users.find(u=>u.id===app.userId);
            const isReviewing = reviewingId===app.id;
            return (
              <div key={app.id} style={{background:"var(--surface2)",border:`1px solid ${app.status==="pending"?"var(--border2)":"var(--border)"}`,borderRadius:10,overflow:"hidden"}}>
                <div style={{padding:"16px 20px",display:"flex",gap:14,alignItems:"flex-start",flexWrap:"wrap"}}>
                  {/* Applicant avatar */}
                  <div style={{width:38,height:38,borderRadius:"50%",background:"#e85d2c",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:"#fff",flexShrink:0}}>
                    {(applicant?.name||app.userName||"?").charAt(0)}
                  </div>
                  <div style={{flex:1,minWidth:200}}>
                    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                      <span style={{fontWeight:700,color:"var(--text-primary)",fontSize:14}}>{applicant?.name||app.userName}</span>
                      <Badge label={app.type==="club_membership" ? "Club Membership" : `Apply: ${app.type}`} color={appTypeColor(app.type)} />
                      {app.clubId && app.type==="club_membership" && (()=>{
                        // Note: clubs not in scope here — show clubId as fallback
                        return null;
                      })()}
                      <Badge label={app.status} color={app.status==="pending"?"#60a5fa":app.status==="approved"?"#4ade80":"#f87171"} />
                    </div>
                    <div style={{fontSize:12,color:"var(--text-faint)",display:"flex",gap:14,flexWrap:"wrap"}}>
                      <span>Current cert: <span style={{color:"var(--text-second)"}}>{applicant?.certification||app.userCert||"—"}</span></span>
                      <span>District: <span style={{color:"var(--text-second)"}}>{applicant?.region||app.userRegion||"—"}</span></span>
                      <span>Submitted: <span style={{color:"var(--text-second)"}}>{fmtDate(app.date)}</span></span>
                    </div>
                    {app.note&&<div style={{marginTop:6,fontSize:13,color:"var(--text-muted)",fontStyle:"italic"}}>"{app.note}"</div>}
                    {app.status!=="pending"&&app.reviewedBy&&(
                      <div style={{marginTop:6,fontSize:12,color:"var(--text-faint)"}}>
                        {app.status==="approved"?"✅":"❌"} {app.status} by {app.reviewedBy} on {fmtDate(app.reviewedDate)}
                        {app.reviewNote&&<span style={{color:"var(--text-muted)"}}> — "{app.reviewNote}"</span>}
                      </div>
                    )}
                    {/* Show automated RO checklist inline for RO applications */}
                    {app.type==="RO" && app.status==="pending" && applicant && (()=>{
                      const checklist = computeROChecklist(applicant, matches);
                      const allPass   = checklist.every(c=>c.pass);
                      return (
                        <div style={{marginTop:10,padding:"10px 12px",background:"var(--surface)",borderRadius:7,border:"1px solid var(--border)"}}>
                          <div style={{fontSize:11,fontWeight:700,color:"var(--text-faint)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8}}>
                            Automated RO checklist {allPass?<span style={{color:"#4ade80"}}>— All pass ✅</span>:<span style={{color:"#f87171"}}>— Fails detected ❌</span>}
                          </div>
                          <div style={{display:"flex",flexDirection:"column",gap:4}}>
                            {checklist.map(item=>(
                              <div key={item.key} style={{display:"flex",gap:8,alignItems:"center",fontSize:12}}>
                                <span>{item.pass?"✅":"❌"}</span>
                                <span style={{color:item.pass?"#86efac":"#fca5a5"}}>{item.label}</span>
                                {item.detail&&<span style={{color:"var(--text-faint)",fontSize:11}}>— {item.detail}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  {/* Action buttons for pending */}
                  {app.status==="pending" && !isReviewing && (
                    <div style={{display:"flex",gap:8,flexShrink:0,alignSelf:"center"}}>
                      <button style={{...btnP,padding:"7px 14px",fontSize:12,background:"#16a34a"}} onClick={()=>{setReviewingId(app.id);setReviewNote("");}}>Approve</button>
                      <button style={{...btnD,padding:"7px 14px",fontSize:12}} onClick={()=>{setReviewingId(app.id);setReviewNote("");}}>Reject</button>
                    </div>
                  )}
                </div>
                {/* Inline review panel */}
                {isReviewing && (
                  <div style={{padding:"14px 20px",borderTop:"1px solid var(--border)",background:"var(--surface)"}}>
                    <Field label="Review note (optional)">
                      <input style={inp} value={reviewNote} onChange={e=>setReviewNote(e.target.value)} placeholder="Reason for decision, optional…" />
                    </Field>
                    <div style={{display:"flex",gap:8,marginTop:4}}>
                      <button style={{...btnP,background:"#16a34a",padding:"8px 18px",fontSize:13}} onClick={()=>handleApprove(app)}>✓ Confirm Approve</button>
                      <button style={{...btnD,padding:"8px 18px",fontSize:13}} onClick={()=>handleReject(app)}>✕ Confirm Reject</button>
                      <button style={{...btnS,padding:"8px 14px",fontSize:13}} onClick={()=>setReviewingId(null)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RANGE OFFICERS PAGE
