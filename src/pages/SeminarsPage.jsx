import React, { useState, useMemo, useEffect, useRef } from "react";
import { certColor, roleColor, statusColor, fmtDate, certRank, canManageMatches, isAdmin, uid, inp, btnS, btnP, btnD, errInp, clubRoleColor, canManageClub, isClubPresident, docCatColor, docTypeColor, fmtFileSize, computeYearlyPoints, meetsLevelOrHigher, checkAnnualMaintenance } from "../lib/helpers";
import { CERT_LEVELS, SYSTEM_ROLES, MATCH_LEVEL_POINTS, SEMINAR_INSTRUCTOR_POINTS, POINT_RULES, IPSC_DISCIPLINES, DQ_REASONS, DEFAULT_REGIONS, DOC_CATEGORIES } from "../lib/constants";
import { Badge, StatCard, Modal, Field, InfoRow, Divider, RegionSelect, UserPicker, useAuth, useTheme } from "../components/ui";

export default function SeminarsPage({ users, setUsers, seminars, setSeminars }) {
  const { currentUser } = useAuth();
  const canEdit = canManageMatches(currentUser);

  const blank = { name:"", date:new Date().toISOString().slice(0,10), location:"", type:"Level I", instructor:"", status:"upcoming", enrollments:[] };
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(blank);
  const [semFe, setSemFe]   = useState({});
  const [detail, setDetail] = useState(null);

  function createSeminar() {
    const errs = {};
    if (!form.name.trim())       errs.name       = true;
    if (!form.location.trim())   errs.location   = true;
    if (!form.instructor)        errs.instructor = true;
    if (Object.keys(errs).length) { setSemFe(errs); return; }
    setSemFe({});
    const s = { ...form, id:"s"+(seminars.length+1)+(Date.now()%10000) };
    setSeminars(prev=>[...prev, s]);
    setShowCreate(false); setForm(blank);
  }

  function updateSeminar(updated) {
    setSeminars(prev=>prev.map(s=>s.id===updated.id?updated:s));
    if (detail?.id===updated.id) setDetail(updated);
  }

  function completeSeminar(seminar) {
    // Graduate enrolled users who attended
    setUsers(prev=>prev.map(u=>{
      const e = seminar.enrollments.find(en=>en.userId===u.id && en.attended && en.graduated);
      if (!e) return u;
      if (certRank(u.certification) > 0) return u;
      const entry = { cert:"RO-P", grantedBy:"System (Seminar)", date:new Date().toISOString().slice(0,10), note:`Graduated: ${seminar.name}` };
      const semEntry = { seminarId:seminar.id, type:seminar.type, graduated:true, diplomaVerified:e.diplomaVerified, diplomaDate:e.diplomaDate||new Date().toISOString().slice(0,10) };
      return { ...u, certification:"RO-P", certHistory:[...(u.certHistory||[]),entry], seminarHistory:[...(u.seminarHistory||[]),semEntry] };
    }));
    const completed = { ...seminar, status:"completed" };
    updateSeminar(completed);
  }

  const upcoming  = seminars.filter(s=>s.status==="upcoming");
  const completed = seminars.filter(s=>s.status==="completed");

  function SemCard({ s }) {
    const instructor = users.find(u=>u.id===s.instructor);
    return (
      <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:10,padding:"16px 18px",display:"flex",alignItems:"center",gap:16}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
            <span style={{color:"var(--text-primary)",fontWeight:700,fontSize:15}}>{s.name}</span>
            <Badge label={s.type} color="#7c8cf8" />
            <Badge label={s.status} color={statusColor(s.status)} />
          </div>
          <div style={{display:"flex",gap:16,fontSize:12,color:"var(--text-muted)",flexWrap:"wrap"}}>
            <span>📅 {fmtDate(s.date)}</span>
            <span>📍 {s.location}</span>
            <span>👤 {instructor?.name||"Unknown"}</span>
            <span>👥 {s.enrollments.length} enrolled</span>
          </div>
        </div>
        <button style={{...btnS,padding:"7px 14px",fontSize:13}} onClick={()=>setDetail(s)}>View</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div>
          <h1 style={{margin:"0 0 4px",fontSize:26,fontWeight:800,color:"var(--text-primary)",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.04em"}}>Seminars</h1>
          <p style={{margin:0,color:"var(--text-muted)",fontSize:14}}>IROA Level I/II seminars and graduation records.</p>
        </div>
        {canEdit&&<button style={{...btnP,padding:"10px 18px"}} onClick={()=>{setShowCreate(true);setSemFe({});}}>+ Create Seminar</button>}
      </div>

      {showCreate && (
        <Modal title="Create Seminar" onClose={()=>{setShowCreate(false);setSemFe({});}}>
          <Field label="Name" error={semFe.name?"Required":undefined}><input style={errInp(semFe.name)} value={form.name} onChange={e=>{setForm(f=>({...f,name:e.target.value}));setSemFe(p=>({...p,name:false}));}} placeholder="e.g. IROA Level I — Oslo Spring 2026" /></Field>
          <Field label="Date"><input style={inp} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></Field>
          <Field label="Location" error={semFe.location?"Required":undefined}><input style={errInp(semFe.location)} value={form.location} onChange={e=>{setForm(f=>({...f,location:e.target.value}));setSemFe(p=>({...p,location:false}));}} placeholder="Venue / club name" /></Field>
          <Field label="Type">
            <select style={inp} value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
              <option>Level I</option><option>Level II</option>
            </select>
          </Field>
          <Field label="Instructor" error={semFe.instructor?"Required":undefined}>
            <UserPicker users={users.filter(u=>u.active&&certRank(u.certification)>=3)} value={form.instructor} onChange={id=>{setForm(f=>({...f,instructor:id}));setSemFe(p=>({...p,instructor:false}));}} placeholder="— Select instructor —" hasError={semFe.instructor} />
          </Field>
          <div style={{display:"flex",gap:10,marginTop:6}}>
            <button style={{...btnP,flex:1}} onClick={createSeminar} disabled={!form.name||!form.location}>Create Seminar</button>
            <button style={{...btnS}} onClick={()=>setShowCreate(false)}>Cancel</button>
          </div>
        </Modal>
      )}

      {detail && (
        <SeminarDetailModal
          seminar={detail}
          users={users}
          setUsers={setUsers}
          canEdit={canEdit}
          onClose={()=>setDetail(null)}
          onUpdate={updateSeminar}
          onComplete={completeSeminar}
        />
      )}

      {upcoming.length>0&&(
        <div style={{marginBottom:24}}>
          <div style={{fontSize:12,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Upcoming</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {upcoming.map(s=><SemCard key={s.id} s={s} />)}
          </div>
        </div>
      )}
      {completed.length>0&&(
        <div>
          <div style={{fontSize:12,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Completed</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {completed.map(s=><SemCard key={s.id} s={s} />)}
          </div>
        </div>
      )}
      {seminars.length===0&&<p style={{color:"var(--text-faint)",fontSize:14}}>No seminars yet.</p>}
    </div>
  );
}

function SeminarDetailModal({ seminar, users, setUsers, canEdit, onClose, onUpdate, onComplete }) {
  const [tab, setTab] = useState("roster");
  const [enrollId, setEnrollId] = useState("");

  const enrolled = seminar.enrollments || [];
  const notEnrolled = users.filter(u=>u.active&&!enrolled.find(e=>e.userId===u.id));
  const instructor = users.find(u=>u.id===seminar.instructor);

  function enroll(userId) {
    if (!userId) return;
    const updated = { ...seminar, enrollments:[...enrolled, { userId, attended:false, graduated:false, diplomaVerified:false, diplomaDate:"" }] };
    onUpdate(updated);
    setEnrollId("");
  }

  function updateEnrollment(userId, patch) {
    const updated = { ...seminar, enrollments:enrolled.map(e=>e.userId===userId?{...e,...patch}:e) };
    onUpdate(updated);
  }

  function removeEnrollment(userId) {
    const updated = { ...seminar, enrollments:enrolled.filter(e=>e.userId!==userId) };
    onUpdate(updated);
  }

  return (
    <Modal title={seminar.name} onClose={onClose} wide>
      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
        <StatCard label="Date"       value={fmtDate(seminar.date)}       accent="#60a5fa" />
        <StatCard label="Enrolled"   value={seminar.enrollments.length}  accent="var(--text-second)" />
        <StatCard label="Graduated"  value={enrolled.filter(e=>e.graduated).length} accent="#4ade80" />
        <StatCard label="Instructor" value={instructor?.name||"—"}       accent="#f97316" />
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,marginBottom:16,borderBottom:"1px solid var(--border)",paddingBottom:0}}>
        {["roster","enroll"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            background:"none",border:"none",borderBottom:tab===t?"2px solid #e85d2c":"2px solid transparent",
            color:tab===t?"var(--text-primary)":"var(--text-muted)",padding:"8px 14px",cursor:"pointer",
            fontSize:13,fontWeight:tab===t?700:400,marginBottom:-1,textTransform:"capitalize"
          }}>{t==="enroll"?"+ Enroll":t.charAt(0).toUpperCase()+t.slice(1)}</button>
        ))}
      </div>

      {tab==="enroll" && canEdit && seminar.status!=="completed" && (
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <div style={{flex:1}}>
            <UserPicker users={notEnrolled} value={enrollId} onChange={setEnrollId} placeholder="— Select user to enroll —" />
          </div>
          <button style={{...btnP,padding:"9px 16px"}} onClick={()=>enroll(enrollId)} disabled={!enrollId}>Enroll</button>
        </div>
      )}

      {tab==="roster" && (
        <div>
          {enrolled.length===0&&<p style={{color:"var(--text-faint)",fontSize:14}}>No one enrolled yet.</p>}
          {enrolled.map(e=>{
            const u=users.find(u=>u.id===e.userId);
            return (
              <div key={e.userId} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:"#e85d2c",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff",flexShrink:0}}>{u?.name.charAt(0)||"?"}</div>
                <div style={{flex:1}}>
                  <div style={{color:"var(--text-primary)",fontWeight:600,fontSize:14}}>{u?.name||"Unknown"}</div>
                  <div style={{color:"var(--text-muted)",fontSize:12}}>{u?.certification||"—"} · {u?.region||"—"}</div>
                </div>
                {canEdit&&seminar.status!=="completed"&&(
                  <div style={{display:"flex",gap:8,alignItems:"center",fontSize:12}}>
                    <label style={{display:"flex",gap:4,alignItems:"center",color:"var(--text-second)",cursor:"pointer"}}>
                      <input type="checkbox" checked={e.attended} onChange={ev=>updateEnrollment(e.userId,{attended:ev.target.checked})} />
                      Attended
                    </label>
                    <label style={{display:"flex",gap:4,alignItems:"center",color:"var(--text-second)",cursor:"pointer"}}>
                      <input type="checkbox" checked={e.graduated} onChange={ev=>updateEnrollment(e.userId,{graduated:ev.target.checked})} />
                      Graduated
                    </label>
                    <label style={{display:"flex",gap:4,alignItems:"center",color:"var(--text-second)",cursor:"pointer"}}>
                      <input type="checkbox" checked={e.diplomaVerified} onChange={ev=>updateEnrollment(e.userId,{diplomaVerified:ev.target.checked})} />
                      Diploma
                    </label>
                    <button onClick={()=>removeEnrollment(e.userId)} style={{...btnD,padding:"3px 8px",fontSize:11}}>✕</button>
                  </div>
                )}
                {(seminar.status==="completed"||!canEdit)&&(
                  <div style={{display:"flex",gap:6}}>
                    {e.attended&&<Badge label="Attended" color="#60a5fa" />}
                    {e.graduated&&<Badge label="Graduated" color="#4ade80" />}
                    {e.diplomaVerified&&<Badge label="Diploma ✓" color="#f97316" />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canEdit&&seminar.status==="upcoming"&&(
        <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid var(--border)",display:"flex",gap:10}}>
          <button style={{...btnP,background:"#16a34a"}} onClick={()=>onComplete(seminar)}>
            ✓ Complete Seminar &amp; Graduate Attendees
          </button>
          <button style={{...btnS}} onClick={onClose}>Close</button>
        </div>
      )}
    </Modal>
  );
}
