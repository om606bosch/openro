import React, { useState, useMemo, useEffect, useRef } from "react";
import { certColor, roleColor, statusColor, fmtDate, certRank, canManageMatches, isAdmin, uid, inp, btnS, btnP, btnD, errInp, clubRoleColor, canManageClub, isClubPresident, docCatColor, docTypeColor, fmtFileSize, computeYearlyPoints, meetsLevelOrHigher, checkAnnualMaintenance } from "../lib/helpers";
import { CERT_LEVELS, SYSTEM_ROLES, MATCH_LEVEL_POINTS, SEMINAR_INSTRUCTOR_POINTS, POINT_RULES, IPSC_DISCIPLINES, DQ_REASONS, DEFAULT_REGIONS, DOC_CATEGORIES } from "../lib/constants";
import { Badge, StatCard, Modal, Field, InfoRow, Divider, RegionSelect, UserPicker, useAuth, useTheme } from "../components/ui";

export default function MatchesPage({ users, matches, setMatches, regions, clubs }) {
  const { currentUser } = useAuth();
  const canEdit = canManageMatches(currentUser);

  const [showCreate,   setShowCreate]   = useState(false);
  const [manageMatch,  setManageMatch]  = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [regionFilter, setRegionFilter] = useState("All");
  const [search,       setSearch]       = useState("");

  const blank = { name:"", date:new Date().toISOString().slice(0,10), region:"", level:"Level I", discipline:"Handgun", stages:6, shooters:"", externalLink:"", status:"upcoming", combinedMDRM:false, md:"", mdText:"", rm:"", assignments:[], hostClubId:"" };
  const [form,        setForm]       = useState(blank);
  const [formErrors,  setFormErrors] = useState({});

  const filtered = useMemo(()=>matches.filter(m=>{
    const q=search.toLowerCase();
    return (m.name.toLowerCase().includes(q)||m.region.toLowerCase().includes(q))
      && (statusFilter==="All"||m.status===statusFilter)
      && (regionFilter==="All"||(m.region||"")===regionFilter);
  }),[matches,search,statusFilter,regionFilter]);

  function createMatch() {
    const errs = {};
    if (!form.name.trim())                                  errs.name   = true;
    if (!form.region)                                       errs.region = true;
    // RM required; MD required unless external mdText provided
    if (form.combinedMDRM) {
      if (!form.md)                                         errs.mdRm   = true;
    } else {
      if (!form.rm)                                         errs.rm     = true;
      if (!form.md && !form.mdText.trim())                  errs.md     = true;
    }
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    setMatches(prev=>[...prev,{...form,id:uid()}]);
    setShowCreate(false); setForm(blank); setFormErrors({});
  }
  function deleteMatch(id) {
    if (window.confirm("Delete this match?")) setMatches(prev=>prev.filter(m=>m.id!==id));
  }

  // MD: any active user (or free-text). RM: RO+ for L1/L2, RM cert only for L3+.
  const allActiveUsers = users.filter(u=>u.active);
  function eligibleRMs(level) {
    const highLevel = level==="Level III"||level==="Level IV";
    return users.filter(u=>u.active && certRank(u.certification) >= (highLevel ? certRank("RM") : certRank("RO")));
  }

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
        <div>
          <h1 style={{fontSize:28,fontWeight:800,margin:"0 0 4px",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.03em",color:"var(--text-primary)"}}>Matches</h1>
          <p style={{color:"var(--text-faint)",margin:0,fontSize:14}}>{filtered.length} of {matches.length} shown</p>
        </div>
        {canEdit&&<button style={btnP} onClick={()=>{setForm(blank);setFormErrors({});setShowCreate(true);}}>+ Create Match</button>}
      </div>
      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search matches…" style={{...inp,flex:1}} />
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{...inp,width:140}}>
          <option value="All">All Status</option>
          <option>upcoming</option><option>active</option><option>completed</option>
        </select>
        <select value={regionFilter} onChange={e=>setRegionFilter(e.target.value)} style={{...inp,width:150}}>
          <option value="All">All Districts</option>
          {[...regions].sort().map(r=><option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {filtered.map(m=>{
          const mdUser=users.find(u=>u.id===m.md);
          const rmUser=users.find(u=>u.id===m.rm);
          const mdName = mdUser?.name || m.mdText || null;
          const staffLabel = m.combinedMDRM
            ? `MD/RM: ${mdName||"—"}`
            : [mdName ? `MD: ${mdName}` : null, rmUser ? `RM: ${rmUser.name}` : null].filter(Boolean).join(" · ") || "—";
          return (
            <div key={m.id} style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:10,padding:"18px 22px",display:"flex",alignItems:"center",gap:16}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                  <span style={{fontSize:16,fontWeight:700,color:"var(--text-primary)"}}>{m.name}</span>
                  <Badge label={m.status} color={statusColor(m.status)} />
                  <Badge label={m.level}  color="#7c8cf8" />
                  {m.discipline && <Badge label={m.discipline} color="#0ea5e9" />}

                </div>
                <div style={{color:"var(--text-faint)",fontSize:13,display:"flex",gap:18,flexWrap:"wrap"}}>
                  <span>📅 {fmtDate(m.date)}</span><span>📍 {m.region}</span>
                  <span>🎯 {m.stages} stages</span>
                  {m.shooters ? <span>🔫 {m.shooters} shooters</span> : null}
                  <span>👔 {staffLabel}</span>
                  {m.hostClubId && (()=>{ const cl=(clubs||[]).find(c=>c.id===m.hostClubId); return cl?<span>🏛️ {cl.shortName}</span>:null; })()}
                  <span>👥 {m.assignments.length} RO{m.assignments.length!==1?"s":""}</span>
                  {m.externalLink && <a href={m.externalLink} target="_blank" rel="noopener noreferrer" style={{color:"#60a5fa",textDecoration:"none"}} onClick={e=>e.stopPropagation()}>🔗 Match page</a>}
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button style={{...btnS,padding:"8px 16px",fontSize:13}} onClick={()=>setManageMatch(m)}>{canEdit?"Manage":"View"}</button>
                {canEdit&&<button style={{...btnD,padding:"8px 16px",fontSize:13}} onClick={()=>deleteMatch(m.id)}>Delete</button>}
              </div>
            </div>
          );
        })}
        {filtered.length===0&&<div style={{textAlign:"center",padding:60,color:"var(--text-faint)"}}>No matches found.</div>}
      </div>

      {showCreate&&canEdit&&(
        <Modal title="Create Match" onClose={()=>{setShowCreate(false);setFormErrors({});}}>
          <Field label="Match Name" error={formErrors.name?"Required":undefined}><input style={errInp(formErrors.name)} value={form.name} onChange={e=>{setForm(f=>({...f,name:e.target.value}));setFormErrors(p=>({...p,name:false}));}} placeholder="e.g. Oslo Club Match #13" /></Field>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <Field label="Date"><input style={inp} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></Field>
            <Field label="District" error={formErrors.region?"Required":undefined}><RegionSelect value={form.region} onChange={v=>{setForm(f=>({...f,region:v}));setFormErrors(p=>({...p,region:false}));}} regions={regions} placeholder="— Select district —" hasError={formErrors.region} /></Field>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
            <Field label="Level"><select style={inp} value={form.level} onChange={e=>{ const lv=e.target.value; setForm(f=>({...f,level:lv,combinedMDRM:lv==="Level I"?f.combinedMDRM:false})); }}>{["Level I","Level II","Level III","Level IV"].map(l=><option key={l}>{l}</option>)}</select></Field>
            <Field label="Discipline"><select style={inp} value={form.discipline||"Handgun"} onChange={e=>setForm(f=>({...f,discipline:e.target.value}))}>{IPSC_DISCIPLINES.map(d=><option key={d}>{d}</option>)}</select></Field>
            <Field label="Status"><select style={inp} value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}><option>upcoming</option><option>active</option><option>completed</option></select></Field>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
            <Field label="Stages"><input style={inp} type="number" min={1} max={40} value={form.stages} onChange={e=>setForm(f=>({...f,stages:parseInt(e.target.value)||1}))} /></Field>
            <Field label="Number of Shooters" hint="Expected or registered competitor count">
              <input style={inp} type="number" min={0} value={form.shooters} onChange={e=>setForm(f=>({...f,shooters:e.target.value}))} placeholder="e.g. 60" />
            </Field>
            <Field label="External Link (optional)" hint="Match page, registration, or results URL">
              <input style={inp} type="url" value={form.externalLink} onChange={e=>setForm(f=>({...f,externalLink:e.target.value}))} placeholder="https://practiscore.com/…" />
            </Field>
            <Field label="Host Club (optional)" hint="Club organising or hosting this match">
              <select style={inp} value={form.hostClubId||""} onChange={e=>setForm(f=>({...f,hostClubId:e.target.value}))}>
                <option value="">— No club host —</option>
                {(clubs||[]).filter(c=>c.active).sort((a,b)=>a.name.localeCompare(b.name)).map(c=><option key={c.id} value={c.id}>{c.name} ({c.shortName})</option>)}
              </select>
            </Field>
          </div>

          {/* MD/RM section */}
          <div style={{background:"var(--surface2)",border:`1px solid ${(formErrors.md||formErrors.rm||formErrors.mdRm)?"#f8717155":"var(--border)"}`,borderRadius:8,padding:"14px 16px",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontSize:13,fontWeight:600,color:"var(--text-primary)"}}>Match Director / Rangemaster</div>
              {/* Combine toggle: only available for Level I */}
              {form.level==="Level I" && (
                <button onClick={()=>setForm(f=>({...f,combinedMDRM:!f.combinedMDRM,md:"",rm:"",mdText:""}))} style={{
                  background:form.combinedMDRM?"#e85d2c22":"var(--border)",
                  border:`1px solid ${form.combinedMDRM?"#e85d2c55":"var(--border2)"}`,
                  borderRadius:6, color:form.combinedMDRM?"#e85d2c":"var(--text-muted)",
                  padding:"6px 14px", fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap"
                }}>{form.combinedMDRM?"✓ Combined MD/RM":"Combine MD/RM"}</button>
              )}
            </div>

            {form.combinedMDRM ? (
              // Combined: Level I only — one person fills both roles
              <Field label="Match Director & Rangemaster" error={formErrors.mdRm?"Required":undefined} hint={!formErrors.mdRm?"Level I only — RO certification or above required":undefined}>
                <UserPicker
                  users={eligibleRMs(form.level)}
                  value={form.md}
                  onChange={id => {setForm(f=>({...f, md:id, rm:id, mdText:""}));setFormErrors(p=>({...p,mdRm:false}));}}
                  placeholder="— Select MD/RM —"
                  hasError={formErrors.mdRm}
                />
              </Field>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <div>
                  <Field label="Match Director (MD)" error={formErrors.md?"Required":undefined}>
                    <UserPicker
                      users={allActiveUsers}
                      value={form.md}
                      onChange={id => {setForm(f=>({...f, md:id, mdText:""}));setFormErrors(p=>({...p,md:false}));}}
                      placeholder="— Select MD —"
                      labelFn={u => u.certification && u.certification!=="None" ? `${u.name} (${u.certification})` : u.name}
                      hasError={formErrors.md && !form.mdText.trim()}
                    />
                  </Field>
                  {!form.md && (
                    <input style={formErrors.md&&!form.md ? {width:"100%",boxSizing:"border-box",border:"1.5px solid #f87171",background:"#f8717108",borderRadius:6,padding:"9px 12px",color:"var(--inp-text)",fontSize:14,outline:"none",fontFamily:"inherit",marginTop:-8} : {...inp,marginTop:-8}} value={form.mdText} onChange={e=>{setForm(f=>({...f,mdText:e.target.value}));setFormErrors(p=>({...p,md:false}));}} placeholder="Or type MD name (external)…" />
                  )}
                </div>
                <Field label="Rangemaster (RM)" error={formErrors.rm?"Required":undefined} hint={
                  !formErrors.rm ? ((form.level==="Level III"||form.level==="Level IV")
                    ? "Level III/IV requires RM certification"
                    : "Level I/II: RO certification or above") : undefined
                }>
                  <UserPicker
                    users={eligibleRMs(form.level)}
                    value={form.rm}
                    onChange={id => {setForm(f=>({...f, rm:id}));setFormErrors(p=>({...p,rm:false}));}}
                    placeholder="— Select RM —"
                    hasError={formErrors.rm}
                  />
                </Field>
              </div>
            )}
          </div>

          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button style={btnS} onClick={()=>setShowCreate(false)}>Cancel</button>
            <button style={btnP} onClick={createMatch}>Create Match</button>
          </div>
        </Modal>
      )}

      {manageMatch&&(
        <ManageMatch match={manageMatch} users={users} clubs={clubs} readonly={!canEdit}
          onClose={()=>setManageMatch(null)}
          onUpdate={upd=>{setMatches(prev=>prev.map(m=>m.id===upd.id?upd:m));setManageMatch(upd);}}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETE MATCH MODAL
// Requires user to log DQs (or tick "no DQs") and extra staff (or tick "none")
// before points can be distributed and the match marked completed.
// ─────────────────────────────────────────────────────────────────────────────

function CompleteMatchModal({ match, users, onConfirm, onClose }) {
  // ── DQ state ──
  const [noDQs,     setNoDQs]     = useState(false);
  const [dqList,    setDqList]    = useState([]);          // [{name, ruleCode, ruleLabel, notes}]
  const [dqName,    setDqName]    = useState("");
  const [dqCode,    setDqCode]    = useState(DQ_REASONS[0].rules[0].code);
  const [dqNotes,   setDqNotes]   = useState("");
  const [dqError,   setDqError]   = useState("");

  // ── Extra staff state ──
  const [noExtra,     setNoExtra]     = useState(false);
  const [extraStaff,  setExtraStaff]  = useState([]);      // [{name, role, notes}]
  const [esName,      setEsName]      = useState("");
  const [esRole,      setEsRole]      = useState("RO");
  const [esNotes,     setEsNotes]     = useState("");
  const [esError,     setEsError]     = useState("");

  // Flat list of all DQ rules for the picker
  const allRules = DQ_REASONS.flatMap(g => g.rules);
  const selectedRule = allRules.find(r => r.code === dqCode) || allRules[0];

  function addDQ() {
    if (!dqName.trim()) { setDqError("Enter the competitor's name."); return; }
    setDqList(p => [...p, { name:dqName.trim(), ruleCode:selectedRule.code, ruleLabel:selectedRule.label, notes:dqNotes.trim() }]);
    setDqName(""); setDqNotes(""); setDqError("");
  }
  function removeDQ(i) { setDqList(p => p.filter((_,j)=>j!==i)); }

  function addStaff() {
    if (!esName.trim()) { setEsError("Enter the staff member's name."); return; }
    setExtraStaff(p => [...p, { name:esName.trim(), role:esRole, notes:esNotes.trim() }]);
    setEsName(""); setEsNotes(""); setEsError("");
  }
  function removeStaff(i) { setExtraStaff(p => p.filter((_,j)=>j!==i)); }

  const dqReady    = noDQs    || dqList.length > 0;
  const staffReady = noExtra  || extraStaff.length > 0;
  const canConfirm = dqReady && staffReady;

  const sectionHead = (label, done) => (
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
      <div style={{
        width:22, height:22, borderRadius:"50%", flexShrink:0,
        background: done ? "#16a34a" : "var(--border)",
        border: `2px solid ${done ? "#4ade80" : "var(--border2)"}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:13, color: done ? "#fff" : "var(--text-faint)"
      }}>{done ? "✓" : ""}</div>
      <h3 style={{margin:0,fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>{label}</h3>
    </div>
  );

  return (
    <Modal title="Complete Match — Final Report" onClose={onClose} wide>
      <p style={{color:"var(--text-faint)",fontSize:13,margin:"0 0 22px"}}>
        Before distributing points and closing the match, confirm the DQ log and any additional staff below.
        Both sections must be filled in or checked off.
      </p>

      {/* ── SECTION 1: DQs ── */}
      <div style={{background:"var(--surface2)",border:`1px solid ${dqReady?"#4ade8066":"var(--border)"}`,borderRadius:10,padding:20,marginBottom:16}}>
        {sectionHead("Disqualifications", dqReady)}

        <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginBottom:16}}>
          <input type="checkbox" checked={noDQs} onChange={e=>{ setNoDQs(e.target.checked); if(e.target.checked) setDqList([]); }}
            style={{width:16,height:16,accentColor:"#4ade80"}} />
          <span style={{fontSize:13,color:"var(--text-primary)",fontWeight:600}}>No disqualifications at this match</span>
        </label>

        {!noDQs && (<>
          {/* DQ list */}
          {dqList.length > 0 && (
            <div style={{marginBottom:16}}>
              {dqList.map((dq,i) => (
                <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"9px 12px",background:"#f8717110",border:"1px solid #f8717144",borderRadius:7,marginBottom:6}}>
                  <div style={{flex:1}}>
                    <div style={{color:"var(--text-primary)",fontWeight:600,fontSize:13}}>{dq.name}</div>
                    <div style={{color:"#f87171",fontSize:11,marginTop:2}}>Rule {dq.ruleCode} — {dq.ruleLabel}</div>
                    {dq.notes && <div style={{color:"var(--text-muted)",fontSize:11,marginTop:2,fontStyle:"italic"}}>{dq.notes}</div>}
                  </div>
                  <button onClick={()=>removeDQ(i)} style={{...btnD,padding:"3px 8px",fontSize:11,flexShrink:0}}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Add DQ form */}
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"14px 16px"}}>
            <div style={{fontSize:12,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12}}>Add Disqualification</div>
            <Field label="Competitor Name / Alias">
              <input style={errInp(dqError)} value={dqName} onChange={e=>{setDqName(e.target.value);setDqError("");}} placeholder="e.g. Jan Hansen" />
            </Field>
            <Field label="Rule Violated">
              <select style={inp} value={dqCode} onChange={e=>setDqCode(e.target.value)}>
                {DQ_REASONS.map(g => (
                  <optgroup key={g.group} label={g.group}>
                    {g.rules.map(r => (
                      <option key={r.code} value={r.code}>{r.code} — {r.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field label="Additional notes (optional)">
              <input style={inp} value={dqNotes} onChange={e=>setDqNotes(e.target.value)} placeholder="Stage number, brief description…" />
            </Field>
            {dqError && <div style={{color:"#f87171",fontSize:12,marginBottom:8}}>{dqError}</div>}
            <button style={{...btnP,background:"#b91c1c"}} onClick={addDQ}>+ Add DQ</button>
          </div>
        </>)}
      </div>

      {/* ── SECTION 2: Extra Staff ── */}
      <div style={{background:"var(--surface2)",border:`1px solid ${staffReady?"#4ade8066":"var(--border)"}`,borderRadius:10,padding:20,marginBottom:22}}>
        {sectionHead("Additional Staff (not in RO roster)", staffReady)}
        <p style={{color:"var(--text-faint)",fontSize:12,margin:"0 0 14px"}}>
          List any officials, scorers, stats officers, setup crew etc. who worked the match but aren't on the RO roster page.
        </p>

        <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginBottom:16}}>
          <input type="checkbox" checked={noExtra} onChange={e=>{ setNoExtra(e.target.checked); if(e.target.checked) setExtraStaff([]); }}
            style={{width:16,height:16,accentColor:"#4ade80"}} />
          <span style={{fontSize:13,color:"var(--text-primary)",fontWeight:600}}>No additional staff to report</span>
        </label>

        {!noExtra && (<>
          {extraStaff.length > 0 && (
            <div style={{marginBottom:16}}>
              {extraStaff.map((s,i) => (
                <div key={i} style={{display:"flex",gap:12,alignItems:"center",padding:"9px 12px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:7,marginBottom:6}}>
                  <div style={{flex:1}}>
                    <div style={{color:"var(--text-primary)",fontWeight:600,fontSize:13}}>{s.name}</div>
                    <div style={{color:"var(--text-faint)",fontSize:11,marginTop:2}}>{s.role}{s.notes ? " — "+s.notes : ""}</div>
                  </div>
                  <button onClick={()=>removeStaff(i)} style={{...btnD,padding:"3px 8px",fontSize:11}}>✕</button>
                </div>
              ))}
            </div>
          )}

          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"14px 16px"}}>
            <div style={{fontSize:12,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12}}>Add Staff Member</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Field label="Name">
                <input style={errInp(esError)} value={esName} onChange={e=>{setEsName(e.target.value);setEsError("");}} placeholder="Full name" />
              </Field>
              <Field label="Role">
                <select style={inp} value={esRole} onChange={e=>setEsRole(e.target.value)}>
                  {["Stats Officer","Setup Crew","Scorer","Safety Officer","Statistician","Armorer","Timer Operator","Other"].map(r=><option key={r}>{r}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Notes (optional)">
              <input style={inp} value={esNotes} onChange={e=>setEsNotes(e.target.value)} placeholder="e.g. Worked stages 1–4" />
            </Field>
            {esError && <div style={{color:"#f87171",fontSize:12,marginBottom:8}}>{esError}</div>}
            <button style={btnS} onClick={addStaff}>+ Add Staff Member</button>
          </div>
        </>)}
      </div>

      {/* ── Confirm ── */}
      {!canConfirm && (
        <div style={{background:"#fbbf2415",border:"1px solid #fbbf2455",borderRadius:7,padding:"11px 14px",color:"#fbbf24",fontSize:13,marginBottom:16}}>
          ⚠️ Complete both sections above before confirming.
          {!dqReady && " — DQ log required."}
          {!staffReady && " — Extra staff report required."}
        </div>
      )}
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button style={btnS} onClick={onClose}>Cancel</button>
        <button
          style={{...btnP, background: canConfirm ? "#16a34a" : "var(--border)", cursor: canConfirm ? "pointer" : "not-allowed", opacity: canConfirm ? 1 : 0.5}}
          disabled={!canConfirm}
          onClick={()=>onConfirm(dqList, extraStaff)}
        >
          ✓ Distribute Points &amp; Complete Match
        </button>
      </div>
    </Modal>
  );
}

function ManageMatch({ match, users, clubs, readonly, onClose, onUpdate }) {
  const [addROId,       setAddROId]       = useState("");
  const [addRole,       setAddRole]       = useState("RO");
  const [addStages,     setAddStages]     = useState("");
  const [addROErr,      setAddROErr]      = useState(false);
  const [editStatus,    setEditStatus]    = useState(match.status);
  const [showComplete,  setShowComplete]  = useState(false);

  const assignedIds  = match.assignments.map(a=>a.roId);
  const availableROs = users.filter(u=>u.active&&u.certification!=="None"&&!assignedIds.includes(u.id));

  // Role options depend on whether this match has combined or separate MD/RM
  const roleOptions = match.combinedMDRM
    ? ["RO-P","RO","CRO","RM","MD/RM"]
    : ["RO-P","RO","CRO","RM","MD","MD/RM"];

  function addAssignment() {
    if (!addROId) { setAddROErr(true); return; }
    setAddROErr(false);
    const stages=addStages.split(",").map(s=>parseInt(s.trim())).filter(n=>!isNaN(n));
    const levelPts = MATCH_LEVEL_POINTS[match.level] || 1;
    onUpdate({...match,assignments:[...match.assignments,{roId:addROId,role:addRole,stages,pointsAwarded:levelPts}]});
    setAddROId(""); setAddStages("");
  }
  function removeAssignment(id) { onUpdate({...match,assignments:match.assignments.filter(a=>a.roId!==id)}); }
  function completeMatch(dqList, extraStaff) {
    onUpdate({...match, status:"completed", dqList, extraStaff, _pointsToDistribute:true});
    setShowComplete(false);
  }

  const mdUser = users.find(u=>u.id===match.md);
  const rmUser = users.find(u=>u.id===match.rm);
  const mdName = mdUser?.name || match.mdText || null;


  return (
    <Modal title={`${readonly?"View":"Manage"}: ${match.name}`} onClose={onClose} wide>
      {/* Match header info */}
      <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:"14px 18px",marginBottom:18}}>
        <div style={{display:"flex",gap:24,flexWrap:"wrap",fontSize:13,alignItems:"center"}}>
          <span style={{color:"var(--text-muted)"}}>📅 <span style={{color:"var(--text-primary)"}}>{fmtDate(match.date)}</span></span>
          <span style={{color:"var(--text-muted)"}}>📍 <span style={{color:"var(--text-primary)"}}>{match.region}</span></span>
          <span style={{color:"var(--text-muted)"}}>🎯 <span style={{color:"var(--text-primary)"}}>{match.stages} stages</span></span>
          {match.shooters ? <span style={{color:"var(--text-muted)"}}>🔫 <span style={{color:"var(--text-primary)"}}>{match.shooters} shooters</span></span> : null}
          <span style={{color:"var(--text-muted)"}}><Badge label={match.level} color="#7c8cf8" /></span>
          {match.discipline && <Badge label={match.discipline} color="#0ea5e9" />}
          {match.externalLink && <a href={match.externalLink} target="_blank" rel="noopener noreferrer" style={{color:"#60a5fa",fontSize:13,textDecoration:"none",display:"flex",alignItems:"center",gap:4}}>🔗 Match page ↗</a>}
          {match.hostClubId && clubs && (()=>{ const cl=clubs.find(c=>c.id===match.hostClubId); return cl?<span style={{color:"var(--text-muted)"}}>🏛️ <span style={{color:"var(--text-primary)",fontWeight:600}}>{cl.name}</span></span>:null; })()}
        </div>
        <div style={{marginTop:12,display:"flex",gap:24,flexWrap:"wrap",fontSize:13}}>
          {match.combinedMDRM ? (
            <span style={{color:"var(--text-muted)"}}>👔 MD/RM (combined): <span style={{color:"var(--text-primary)",fontWeight:600}}>{mdName||"—"}</span></span>
          ) : (
            <>
              {mdName && <span style={{color:"var(--text-muted)"}}>🗂️ Match Director: <span style={{color:"var(--text-primary)",fontWeight:600}}>{mdName}</span></span>}
              <span style={{color:"var(--text-muted)"}}>🛡️ Rangemaster: <span style={{color:"var(--text-primary)",fontWeight:600}}>{rmUser?.name||"—"}</span></span>
            </>
          )}
        </div>
      </div>


      {/* Add RO — always-visible compact form when editable */}
      {!readonly && (
        <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:"10px 14px",marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
            Add RO to Roster
            <span style={{fontWeight:400,textTransform:"none",letterSpacing:0,color:"var(--text-faint)",fontSize:11}}>
              {match.combinedMDRM ? "RO=1 · CRO=2 · RM=3 · MD/RM=4 pts" : "RO=1 · CRO=2 · RM/MD=3 · MD/RM=4 pts"}
            </span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 110px 130px auto",gap:8,alignItems:"center"}}>
            <UserPicker
              users={availableROs}
              value={addROId}
              onChange={id => {setAddROId(id);setAddROErr(false);}}
              placeholder="— Choose RO —"
              hasError={addROErr}
            />
            <select style={{...inp,margin:0}} value={addRole} onChange={e=>setAddRole(e.target.value)}>
              {roleOptions.map(r=><option key={r}>{r}</option>)}
            </select>
            <input style={{...inp,margin:0}} value={addStages} onChange={e=>setAddStages(e.target.value)} placeholder="Stages (opt.)" title="Comma-separated, e.g. 1, 2, 5" />
            <button style={{...btnP,whiteSpace:"nowrap",padding:"9px 14px"}} onClick={addAssignment} disabled={!addROId}>
              + Add · <span style={{color:"#fbbf24"}}>{MATCH_LEVEL_POINTS[match.level]||1}pt (L{["I","II","III","IV","V"][["Level I","Level II","Level III","Level IV","Level V"].indexOf(match.level)]})</span>
            </button>
          </div>
          {availableROs.length===0 && <p style={{color:"var(--text-faint)",fontSize:12,margin:"6px 0 0"}}>All eligible ROs are already assigned.</p>}
        </div>
      )}


      {/* RO Roster */}
      <div style={{fontSize:11,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>RO Roster</div>
      <div>
        {match.assignments.length===0&&<p style={{color:"var(--text-faint)",fontSize:14}}>No ROs assigned yet.</p>}
        {match.assignments.map(a=>{
          const ro=users.find(u=>u.id===a.roId);
          return (
            <div key={a.roId} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:"1px solid var(--border)"}}>
              <div style={{flex:1}}>
                <div style={{color:"var(--text-primary)",fontWeight:600,fontSize:14}}>{ro?.name||"Unknown"}</div>
                <div style={{color:"var(--text-faint)",fontSize:12,marginTop:2}}>
                  {ro?.certification}
                  {a.stages&&a.stages.length>0 ? ` · Stages: ${a.stages.join(", ")}` : " · No specific stages"}
                </div>
              </div>
              <Badge label={a.role} color={certColor(a.role)} />
              <span style={{color:"#e85d2c",fontWeight:800,fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,minWidth:40,textAlign:"right"}}>+{a.pointsAwarded} pts</span>
              {!readonly&&<button onClick={()=>removeAssignment(a.roId)} style={{...btnD,padding:"4px 9px",fontSize:12}}>✕</button>}
            </div>
          );
        })}
      </div>

      {/* Compact stat strip */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14,alignItems:"center"}}>
        <span style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:600,color:"#60a5fa"}}>
          {match.assignments.length} RO{match.assignments.length!==1?"s":""} assigned
        </span>
        {match.shooters ? (
          <span style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:600,color:"#a78bfa"}}>
            {match.shooters} shooters
          </span>
        ) : null}
        <span style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:600,color:"#e85d2c"}}>
          {match.assignments.reduce((s,a)=>s+a.pointsAwarded,0)} pts to give
        </span>
        {match.status==="completed" && match.dqList && (
          <span style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:600,color:match.dqList.length>0?"#f87171":"#4ade80"}}>
            {match.dqList.length===0?"No DQs":`${match.dqList.length} DQ${match.dqList.length!==1?"s":""}`}
          </span>
        )}
      </div>


      {!readonly&&(
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:20,flexWrap:"wrap"}}>
          <select style={{...inp,width:160}} value={editStatus} onChange={e=>setEditStatus(e.target.value)}>
            <option>upcoming</option><option>active</option><option>completed</option>
          </select>
          <button style={{...btnS,padding:"9px 16px"}} onClick={()=>onUpdate({...match,status:editStatus})}>Update Status</button>
          {match.status!=="completed"&&<button style={{...btnP,background:"#16a34a"}} onClick={()=>setShowComplete(true)}>✓ Complete Match…</button>}
          {match.status==="completed"&&<Badge label="Completed ✓" color="#4ade80" />}
        </div>
      )}


      {/* DQ / staff / complete modal */}
      {showComplete && (
        <CompleteMatchModal
          match={match}
          users={users}
          onConfirm={completeMatch}
          onClose={()=>setShowComplete(false)}
        />
      )}


      {/* DQ + extra staff summary (completed matches) */}
      {match.status==="completed" && (match.dqList?.length>0 || match.extraStaff?.length>0) && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
          {match.dqList?.length>0 && (
            <div style={{background:"#f8717110",border:"1px solid #f8717144",borderRadius:8,padding:"14px 16px"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#f87171",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:10}}>
                🚫 Disqualifications ({match.dqList.length})
              </div>
              {match.dqList.map((dq,i)=>(
                <div key={i} style={{padding:"7px 0",borderBottom:"1px solid var(--border)",fontSize:13}}>
                  <div style={{color:"var(--text-primary)",fontWeight:600}}>{dq.name}</div>
                  <div style={{color:"#f87171",fontSize:11,marginTop:2}}>{dq.ruleCode} — {dq.ruleLabel}</div>
                  {dq.notes && <div style={{color:"var(--text-muted)",fontSize:11,marginTop:1,fontStyle:"italic"}}>{dq.notes}</div>}
                </div>
              ))}
            </div>
          )}
          {match.extraStaff?.length>0 && (
            <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:"14px 16px"}}>
              <div style={{fontSize:12,fontWeight:700,color:"var(--text-second)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:10}}>
                👔 Additional Staff ({match.extraStaff.length})
              </div>
              {match.extraStaff.map((s,i)=>(
                <div key={i} style={{padding:"7px 0",borderBottom:"1px solid var(--border)",fontSize:13}}>
                  <div style={{color:"var(--text-primary)",fontWeight:600}}>{s.name}</div>
                  <div style={{color:"var(--text-faint)",fontSize:11,marginTop:2}}>{s.role}{s.notes ? " — "+s.notes : ""}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

