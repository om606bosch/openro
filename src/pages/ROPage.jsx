import React, { useState, useMemo, useEffect, useRef } from "react";
import { certColor, roleColor, statusColor, fmtDate, certRank, canManageMatches, isAdmin, uid, inp, btnS, btnP, btnD, errInp, clubRoleColor, canManageClub, isClubPresident, docCatColor, docTypeColor, fmtFileSize, computeYearlyPoints, meetsLevelOrHigher, checkAnnualMaintenance } from "../lib/helpers";
import { CERT_LEVELS, SYSTEM_ROLES, MATCH_LEVEL_POINTS, SEMINAR_INSTRUCTOR_POINTS, POINT_RULES, IPSC_DISCIPLINES, DQ_REASONS, DEFAULT_REGIONS, DOC_CATEGORIES } from "../lib/constants";
import { Badge, StatCard, Modal, Field, InfoRow, Divider, RegionSelect, UserPicker, useAuth, useTheme } from "../components/ui";

export default function ROPage({ users, matches, regions }) {
  const [search,       setSearch]       = useState("");
  const [certFilter,   setCertFilter]   = useState("All");
  const [regionFilter, setRegionFilter] = useState("All");
  const [viewUser,     setViewUser]     = useState(null);

  const ros = users.filter(u=>u.certification!=="None"&&u.active);
  const filtered = useMemo(()=>ros.filter(u=>{
    const q=search.toLowerCase();
    return (u.name.toLowerCase().includes(q)||u.email.toLowerCase().includes(q)||(u.region||"").toLowerCase().includes(q))
      && (certFilter==="All"||u.certification===certFilter)
      && (regionFilter==="All"||(u.region||"")===regionFilter);
  }),[ros,search,certFilter,regionFilter]);

  const roMatchHistory = useMemo(()=>viewUser
    ? matches.filter(m=>m.assignments.some(a=>a.roId===viewUser.id))
        .map(m=>({...m,assignment:m.assignments.find(a=>a.roId===viewUser.id)}))
    : []
  ,[viewUser,matches]);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
        <div>
          <h1 style={{fontSize:28,fontWeight:800,margin:"0 0 4px",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.03em",color:"var(--text-primary)"}}>Range Officers</h1>
          <p style={{color:"var(--text-faint)",margin:0,fontSize:14}}>{filtered.length} certified active officers</p>
        </div>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, email, district…" style={{...inp,flex:1}} />
        <select value={certFilter} onChange={e=>setCertFilter(e.target.value)} style={{...inp,width:140}}>
          <option value="All">All Certs</option>
          {["RO-P","RO","CRO","RM"].map(c=><option key={c}>{c}</option>)}
        </select>
        <select value={regionFilter} onChange={e=>setRegionFilter(e.target.value)} style={{...inp,width:150}}>
          <option value="All">All Districts</option>
          {[...regions].sort().map(r=><option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:"var(--surface)"}}>
              {["Name","Certification","IROA","District","Matches","Points",""].map(h=>(
                <th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:"var(--text-faint)",textTransform:"uppercase",letterSpacing:"0.07em",borderBottom:"1px solid var(--border)"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u,i)=>{
              const mc=matches.filter(m=>m.assignments.some(a=>a.roId===u.id)).length;
              return (
                <tr key={u.id} style={{borderBottom:"1px solid var(--surface3)",background:i%2===0?"transparent":"var(--surface)"}}>
                  <td style={{padding:"12px 16px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:30,height:30,borderRadius:"50%",background:"#e85d2c",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff",flexShrink:0}}>{u.name.charAt(0)}</div>
                      <button onClick={()=>setViewUser(u)} style={{background:"none",border:"none",color:"var(--text-primary)",fontWeight:600,fontSize:14,cursor:"pointer",padding:0}}>{u.name}</button>
                    </div>
                  </td>
                  <td style={{padding:"12px 16px"}}><Badge label={u.certification} color={certColor(u.certification)} /></td>
                  <td style={{padding:"12px 16px"}}>
                    {u.iroa?.member
                      ? <span style={{display:"flex",alignItems:"center",gap:5}}>
                          <span style={{width:8,height:8,borderRadius:"50%",background:"#38bdf8",display:"inline-block",flexShrink:0}} />
                          <span style={{color:"#38bdf8",fontSize:12,fontWeight:600}}>IROA</span>
                        </span>
                      : <span style={{color:"var(--text-faint)",fontSize:12}}>—</span>
                    }
                  </td>
                  <td style={{padding:"12px 16px",color:"var(--text-second)",fontSize:13}}>{u.region||"—"}</td>
                  <td style={{padding:"12px 16px",color:"var(--text-muted)",fontSize:13}}>{mc}</td>
                  <td style={{padding:"12px 16px",color:"#e85d2c",fontWeight:800,fontFamily:"'Barlow Condensed',sans-serif",fontSize:15}}>{u.points}</td>
                  <td style={{padding:"12px 16px"}}><button onClick={()=>setViewUser(u)} style={{...btnS,padding:"5px 12px",fontSize:12}}>View</button></td>
                </tr>
              );
            })}
            {filtered.length===0&&<tr><td colSpan={7} style={{padding:44,textAlign:"center",color:"var(--text-faint)"}}>No certified ROs found.</td></tr>}
          </tbody>
        </table>
      </div>

      {viewUser && (
        <Modal title={`RO Profile — ${viewUser.name}`} onClose={()=>setViewUser(null)}>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}}>
            <StatCard label="Points"  value={viewUser.points}        accent="#e85d2c" />
            <StatCard label="Matches" value={roMatchHistory.length}  accent="#60a5fa" />
            <StatCard label="Cert"    value={viewUser.certification} accent={certColor(viewUser.certification)} />
          </div>
          <InfoRow label="Email"    value={viewUser.email} />
          <InfoRow label="District" value={viewUser.region||"—"} />
          <InfoRow label="Joined"   value={fmtDate(viewUser.joined)} />
          <InfoRow label="IROA Member" value={
            viewUser.iroa?.member
              ? <span style={{color:"#38bdf8",fontWeight:600}}>Yes{viewUser.iroa.since ? <span style={{color:"var(--text-faint)",fontWeight:400}}> — since {fmtDate(viewUser.iroa.since)}</span> : ""}</span>
              : "No"
          } />
          {viewUser.notes&&<InfoRow label="Notes" value={viewUser.notes}/>}
          {(viewUser.seminarHistory||[]).length>0 && (
            <>
              <h4 style={{margin:"20px 0 10px",fontSize:12,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Seminar History</h4>
              {[...viewUser.seminarHistory].reverse().map((s,i)=>(
                <div key={i} style={{display:"flex",gap:8,alignItems:"center",padding:"7px 0",borderBottom:"1px solid var(--border)",flexWrap:"wrap"}}>
                  <Badge label={s.type} color={s.type==="Level I"?"#38bdf8":"#a78bfa"} />
                  {s.graduated&&<Badge label="Graduated" color="#4ade80" />}
                  {s.diplomaVerified&&<Badge label="Verified" color="#38bdf8" />}
                  <span style={{color:"var(--text-faint)",fontSize:11,marginLeft:"auto"}}>{s.diplomaDate?fmtDate(s.diplomaDate):"—"}</span>
                </div>
              ))}
            </>
          )}
          <h4 style={{margin:"20px 0 10px",fontSize:12,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Certification History</h4>
          {(viewUser.certHistory||[]).length===0
            ? <p style={{color:"var(--text-faint)",fontSize:13}}>No cert history.</p>
            : [...(viewUser.certHistory||[])].reverse().map((c,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"center",padding:"7px 0",borderBottom:"1px solid var(--border)"}}>
                <Badge label={c.cert} color={certColor(c.cert)} />
                <span style={{color:"var(--text-muted)",fontSize:12,flex:1}}>Granted by {c.grantedBy}</span>
                <span style={{color:"var(--text-faint)",fontSize:12}}>{fmtDate(c.date)}</span>
              </div>
            ))
          }
          <h4 style={{margin:"20px 0 10px",fontSize:12,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Match History</h4>
          {roMatchHistory.length===0
            ? <p style={{color:"var(--text-faint)",fontSize:13}}>No match assignments.</p>
            : roMatchHistory.map(m=>(
              <div key={m.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
                <div style={{flex:1}}>
                  <div style={{color:"var(--text-primary)",fontSize:14,fontWeight:500}}>{m.name}</div>
                  <div style={{color:"var(--text-faint)",fontSize:12,marginTop:2}}>{fmtDate(m.date)} · {m.region}</div>
                </div>
                <Badge label={m.assignment.role} color={certColor(m.assignment.role)} />
                <span style={{color:"#e85d2c",fontWeight:800,fontFamily:"'Barlow Condensed',sans-serif",fontSize:16}}>+{m.assignment.pointsAwarded}</span>
              </div>
            ))
          }
        </Modal>
      )}
    </div>
  );
}

