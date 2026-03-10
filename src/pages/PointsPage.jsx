import React, { useState, useMemo, useEffect, useRef } from "react";
import { certColor, roleColor, statusColor, fmtDate, certRank, canManageMatches, isAdmin, uid, inp, btnS, btnP, btnD, errInp, clubRoleColor, canManageClub, isClubPresident, docCatColor, docTypeColor, fmtFileSize } from "../lib/helpers";
import { CERT_LEVELS, SYSTEM_ROLES, MATCH_LEVEL_POINTS, SEMINAR_INSTRUCTOR_POINTS, POINT_RULES, IPSC_DISCIPLINES, DQ_REASONS, DEFAULT_REGIONS, DOC_CATEGORIES } from "../lib/constants";
import { Badge, StatCard, Modal, Field, InfoRow, Divider, RegionSelect, UserPicker, useAuth, useTheme } from "../components/ui";

export default function PointsPage({ users, setUsers, matches }) {
  const { currentUser } = useAuth();
  const adminAccess = isAdmin(currentUser);

  const [adjustId,     setAdjustId]     = useState("");
  const [adjustAmt,    setAdjustAmt]    = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustLog,    setAdjustLog]    = useState([]);
  const [maintenanceId,setMaintenanceId]= useState(null);  // expanded user in maintenance table
  const [ledgerFilter, setLedgerFilter] = useState("all"); // "all" | userId

  const thisYear = new Date().getFullYear().toString();
  const sorted   = [...users].filter(u=>u.active).sort((a,b)=>b.points-a.points);
  const max      = sorted[0]?.points||1;

  function applyAdjust() {
    const amt=parseInt(adjustAmt);
    if (!adjustId||isNaN(amt)||amt===0) return;
    const ro=users.find(u=>u.id===adjustId);
    if (!ro) return;
    setUsers(prev=>prev.map(u=>u.id===adjustId?{...u,points:u.points+amt}:u));
    setAdjustLog(prev=>[{roId:adjustId,roName:ro.name,amt,reason:adjustReason||"Manual adjustment",date:new Date().toISOString().slice(0,10)},...prev]);
    setAdjustId(""); setAdjustAmt(""); setAdjustReason("");
  }

  // Build ledger from completed matches
  const matchLedger = [];
  matches.forEach(m=>{
    if (m.status!=="completed") return;
    m.assignments.forEach(a=>{
      const ro=users.find(u=>u.id===a.roId);
      if (ro) matchLedger.push({ roId:a.roId, name:ro.name, matchName:m.name, matchLevel:m.level, date:m.date, role:a.role, amt:a.pointsAwarded });
    });
  });
  adjustLog.forEach(e=>matchLedger.push({roId:e.roId,name:e.roName,matchName:"Manual adjustment",matchLevel:"—",date:e.date,role:"Adj.",amt:e.amt,reason:e.reason}));
  matchLedger.sort((a,b)=>b.date.localeCompare(a.date));

  const visibleLedger = ledgerFilter==="all" ? matchLedger : matchLedger.filter(e=>e.roId===ledgerFilter);

  // Compute yearly point totals per user (for maintenance table)
  const yearlyMap = React.useMemo(()=>{
    const map = {};
    users.forEach(u=>{ map[u.id] = computeYearlyPoints(u.id, matches); });
    return map;
  },[users, matches]);

  // All years that appear in the data
  const allYears = React.useMemo(()=>{
    const ys = new Set();
    Object.values(yearlyMap).forEach(byYear=>Object.keys(byYear).forEach(y=>ys.add(y)));
    return [...ys].sort((a,b)=>b.localeCompare(a));
  },[yearlyMap]);

  // Maintenance status for a user in a given year
  function maintenanceStatus(user, year) {
    const cert = user.certification;
    if (cert==="None"||cert==="RO-P"||cert==="Admin") return null; // no maintenance req
    const entries = yearlyMap[user.id]?.[year]?.entries || [];
    return checkAnnualMaintenance(cert, entries);
  }

  const certifiedUsers = users.filter(u=>u.active && ["RO","CRO","RM"].includes(u.certification));

  return (
    <div>
      <h1 style={{margin:"0 0 6px",fontSize:26,fontWeight:800,color:"var(--text-primary)",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.04em"}}>Points Ledger</h1>
      <p style={{margin:"0 0 28px",color:"var(--text-muted)",fontSize:14}}>
        RO activity points per NROI Handbook 2026 — 1pt L1, 2pt L2, 3pt L3, 4pt L4, 5pt L5.
        Points are tracked both cumulatively and year-by-year for annual maintenance.
      </p>

      {/* ── Annual Maintenance Status ── */}
      {certifiedUsers.length > 0 && (
        <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:10,padding:"18px 22px",marginBottom:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Annual Maintenance Status</div>
            <div style={{fontSize:11,color:"var(--text-faint)"}}>≥6 pts/year + level qualifier required — per NROI Handbook 2026</div>
          </div>

          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{background:"var(--surface3)"}}>
                  <th style={{padding:"8px 12px",textAlign:"left",fontSize:11,fontWeight:700,color:"var(--text-faint)",textTransform:"uppercase",letterSpacing:"0.07em",borderBottom:"1px solid var(--border)",minWidth:130}}>RO</th>
                  <th style={{padding:"8px 12px",textAlign:"center",fontSize:11,fontWeight:700,color:"var(--text-faint)",textTransform:"uppercase",letterSpacing:"0.07em",borderBottom:"1px solid var(--border)",width:70}}>Cert</th>
                  {allYears.slice(0,4).map(y=>(
                    <th key={y} style={{padding:"8px 12px",textAlign:"center",fontSize:11,fontWeight:700,color:y===thisYear?"#e85d2c":"var(--text-faint)",textTransform:"uppercase",letterSpacing:"0.07em",borderBottom:"1px solid var(--border)",width:100}}>
                      {y}{y===thisYear?" ★":""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {certifiedUsers.map((u,ri)=>{
                  const expanded = maintenanceId===u.id;
                  return (
                    <React.Fragment key={u.id}>
                      <tr
                        style={{background:ri%2===0?"transparent":"var(--surface3)",cursor:"pointer"}}
                        onMouseEnter={e=>e.currentTarget.style.background="var(--surface)"}
                        onMouseLeave={e=>e.currentTarget.style.background=ri%2===0?"transparent":"var(--surface3)"}
                        onClick={()=>setMaintenanceId(expanded?null:u.id)}
                      >
                        <td style={{padding:"10px 12px"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{width:28,height:28,borderRadius:"50%",background:"#e85d2c",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff",flexShrink:0}}>{u.name.charAt(0)}</div>
                            <span style={{color:"var(--text-primary)",fontWeight:600,fontSize:13}}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{padding:"10px 12px",textAlign:"center"}}>
                          <Badge label={u.certification} color={certColor(u.certification)} />
                        </td>
                        {allYears.slice(0,4).map(y=>{
                          const status = maintenanceStatus(u,y);
                          const yearPts = yearlyMap[u.id]?.[y]?.total||0;
                          if (!status) return <td key={y} style={{padding:"10px 12px",textAlign:"center",color:"var(--text-faint)",fontSize:12}}>—</td>;
                          const pass = status.totalPass && status.qualPass;
                          return (
                            <td key={y} style={{padding:"10px 12px",textAlign:"center"}}>
                              <div style={{display:"inline-flex",flexDirection:"column",alignItems:"center",gap:2}}>
                                <span style={{fontSize:16}}>{pass?"✅":"❌"}</span>
                                <span style={{fontSize:11,color:pass?"#4ade80":"#f87171",fontWeight:700}}>{yearPts}pt</span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                      {expanded && (
                        <tr>
                          <td colSpan={2+Math.min(allYears.length,4)} style={{padding:"0 12px 12px",background:"var(--surface)"}}>
                            <div style={{padding:"12px 14px",background:"var(--surface2)",borderRadius:8,border:"1px solid var(--border)"}}>
                              <div style={{fontSize:11,fontWeight:700,color:"var(--text-faint)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:10}}>
                                {u.name} — Yearly breakdown
                              </div>
                              {allYears.slice(0,4).map(y=>{
                                const status = maintenanceStatus(u,y);
                                if (!status) return null;
                                const entries = yearlyMap[u.id]?.[y]?.entries||[];
                                return (
                                  <div key={y} style={{marginBottom:12}}>
                                    <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6}}>
                                      <span style={{fontWeight:700,color:"var(--text-primary)",fontSize:13}}>{y}</span>
                                      <span style={{fontSize:12,color:status.totalPass?"#4ade80":"#f87171"}}>{status.total}pt / 6pt min {status.totalPass?"✓":"✗"}</span>
                                      <span style={{fontSize:11,color:"var(--text-faint)"}}>·</span>
                                      <span style={{fontSize:11,color:status.qualPass?"#4ade80":"#f87171"}}>{status.qualLabel} {status.qualPass?"✓":"✗"}</span>
                                    </div>
                                    {entries.length===0
                                      ? <div style={{fontSize:12,color:"var(--text-faint)",fontStyle:"italic"}}>No activity this year.</div>
                                      : entries.map((e,ei)=>(
                                          <div key={ei} style={{display:"flex",gap:10,fontSize:12,color:"var(--text-muted)",paddingLeft:8,marginBottom:3}}>
                                            <span style={{color:"var(--text-faint)",minWidth:85}}>{fmtDate(e.date)}</span>
                                            <Badge label={e.role} color={certColor(e.role)} />
                                            <span style={{color:"var(--text-second)"}}>{e.matchName}</span>
                                            <Badge label={e.matchLevel} color="#7c8cf8" />
                                            <span style={{color:"#e85d2c",fontWeight:700,marginLeft:"auto"}}>+{e.pts}pt</span>
                                          </div>
                                        ))
                                    }
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{marginTop:10,fontSize:11,color:"var(--text-faint)"}}>
            Click a row to expand yearly detail. RO: min 1×L2+; CRO: min 1×L3+; RM: min 2×L3+.
          </div>
        </div>
      )}

      {/* ── Cumulative Leaderboard ── */}
      <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:10,padding:"18px 22px",marginBottom:24}}>
        <div style={{fontSize:12,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>Cumulative Leaderboard</div>
        {sorted.map((u,i)=>(
          <div key={u.id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
            <div style={{width:22,textAlign:"right",color:"var(--text-faint)",fontSize:12,fontWeight:700}}>{i+1}</div>
            <div style={{width:32,height:32,borderRadius:"50%",background:"#e85d2c",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff",flexShrink:0}}>{u.name.charAt(0)}</div>
            <div style={{flex:1}}>
              <div style={{color:"var(--text-primary)",fontWeight:600,fontSize:14}}>{u.name}</div>
              <div style={{background:"var(--border)",borderRadius:4,height:6,overflow:"hidden",marginTop:4}}>
                <div style={{width:`${(u.points/max)*100}%`,background:`hsl(${Math.max(0,120-i/sorted.length*90)},70%,50%)`,height:"100%",borderRadius:4}} />
              </div>
            </div>
            <div style={{color:"#e85d2c",fontWeight:800,fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,minWidth:48,textAlign:"right"}}>{u.points} pts</div>
          </div>
        ))}
      </div>

      {/* ── Manual adjustment (admin only) ── */}
      {adminAccess && (
        <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:10,padding:"18px 22px",marginBottom:24}}>
          <div style={{fontSize:12,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>Manual Adjustment</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 100px 1fr auto",gap:8}}>
            <UserPicker users={users.filter(u=>u.active)} value={adjustId} onChange={setAdjustId} placeholder="— Select RO —" />
            <input style={inp} type="number" value={adjustAmt} onChange={e=>setAdjustAmt(e.target.value)} placeholder="±pts" />
            <input style={inp} value={adjustReason} onChange={e=>setAdjustReason(e.target.value)} placeholder="Reason (optional)" />
            <button style={{...btnP,padding:"9px 16px"}} onClick={applyAdjust} disabled={!adjustId||!adjustAmt}>Apply</button>
          </div>
        </div>
      )}

      {/* ── Activity Log ── */}
      <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:10,overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",borderBottom:"1px solid var(--border)"}}>
          <div style={{fontSize:12,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Activity Log</div>
          <select style={{...inp,width:180,padding:"5px 10px",fontSize:12}} value={ledgerFilter} onChange={e=>setLedgerFilter(e.target.value)}>
            <option value="all">All ROs</option>
            {[...users].sort((a,b)=>a.name.localeCompare(b.name)).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <span style={{fontSize:11,color:"var(--text-faint)",marginLeft:"auto"}}>{visibleLedger.length} entries</span>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:"var(--surface3)"}}>
                {["RO","Match","Level","Date","Role","Points"].map(h=>(
                  <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:"var(--text-faint)",textTransform:"uppercase",letterSpacing:"0.07em",borderBottom:"1px solid var(--border)"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleLedger.map((e,i)=>(
                <tr key={i} style={{background:i%2===0?"transparent":"var(--surface3)"}}>
                  <td style={{padding:"10px 14px",color:"var(--text-primary)",fontSize:13,fontWeight:600}}>{e.name}</td>
                  <td style={{padding:"10px 14px",color:"var(--text-second)",fontSize:13}}>{e.matchName}</td>
                  <td style={{padding:"10px 14px"}}><Badge label={e.matchLevel||"—"} color="#7c8cf8" /></td>
                  <td style={{padding:"10px 14px",color:"var(--text-muted)",fontSize:12}}>{fmtDate(e.date)}</td>
                  <td style={{padding:"10px 14px"}}><Badge label={e.role} color={certColor(e.role)} /></td>
                  <td style={{padding:"10px 14px",color:e.amt>0?"#4ade80":"#f87171",fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",fontSize:15}}>{e.amt>0?"+":"-"}{Math.abs(e.amt)} pts</td>
                </tr>
              ))}
              {visibleLedger.length===0&&<tr><td colSpan={6} style={{padding:"20px 14px",color:"var(--text-faint)",fontSize:13,textAlign:"center"}}>No activity yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RO CHECKLIST
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// NROI HANDBOOK 2026 — points & maintenance rules
// ─────────────────────────────────────────────────────────────────────────────

// Compute year-by-year point totals for a user from match assignments.
// `matches` must be passed in; we derive from all completed matches.
// Returns: { [year]: { total, byRole: { roId, role, matchLevel, pts, date, matchName }[] } }
function computeYearlyPoints(userId, matches) {
  const byYear = {};
  (matches||[]).forEach(m => {
    if (m.status !== "completed") return;
    const year = (m.date||"").slice(0,4);
    if (!year) return;
    const a = (m.assignments||[]).find(a=>a.roId===userId);
    if (!a) return;
    if (!byYear[year]) byYear[year] = { total:0, entries:[] };
    byYear[year].total += a.pointsAwarded;
    byYear[year].entries.push({
      role: a.role,
      matchLevel: m.level,
      pts: a.pointsAwarded,
      date: m.date,
      matchName: m.name,
    });
  });
  return byYear;
}

// Check annual maintenance requirement for a certification level.
// Returns { pass, details } per the handbook:
//   RO:  ≥6 pts/year, incl. min 1×Level II+ as RO or higher
//   CRO: ≥6 pts/year, incl. min 1×Level III+ as RO or higher
//   RM:  ≥6 pts/year, incl. min 2×Level III+ as RO or higher
const LEVEL_ORDER = ["Level I","Level II","Level III","Level IV","Level V"];
function meetsLevelOrHigher(matchLevel, minLevel) {
  return LEVEL_ORDER.indexOf(matchLevel) >= LEVEL_ORDER.indexOf(minLevel);
}
const RO_ROLES_COUNTING = ["RO-P","RO","CRO","RM","MD","MD/RM"]; // all RO roles count for maintenance

function checkAnnualMaintenance(cert, yearEntries) {
  const entries = yearEntries || [];
  const total   = entries.reduce((s,e)=>s+e.pts, 0);
  const qualifies = e => RO_ROLES_COUNTING.includes(e.role);

  let qualCount = 0, qualLabel = "", minLevel = "Level I";
  if (cert === "RO") {
    minLevel  = "Level II";
    qualCount = entries.filter(e=>qualifies(e)&&meetsLevelOrHigher(e.matchLevel,minLevel)).length;
    qualLabel = `≥1×Level II+ match as RO or higher (found ${qualCount})`;
  } else if (cert === "CRO") {
    minLevel  = "Level III";
    qualCount = entries.filter(e=>qualifies(e)&&meetsLevelOrHigher(e.matchLevel,minLevel)).length;
    qualLabel = `≥1×Level III+ match as RO or higher (found ${qualCount})`;
  } else if (cert === "RM") {
    minLevel  = "Level III";
    qualCount = entries.filter(e=>qualifies(e)&&meetsLevelOrHigher(e.matchLevel,minLevel)).length;
    qualLabel = `≥2×Level III+ matches as RO or higher (found ${qualCount})`;
  }

  const minQual = cert==="RM" ? 2 : cert==="CRO"||cert==="RO" ? 1 : 0;
  return {
    totalPass:    total >= 6,
    qualPass:     minQual===0 || qualCount >= minQual,
    total, qualCount, qualLabel,
  };
}

// RO-P → RO promotion checklist (NROI Handbook 2026, p.7)
// Requirements:
//   • Current cert is RO-P
//   • Account active
//   • Member ≥ 1 year
//   • Completed IROA Level I seminar and graduated
//   • Accumulated provisional points: 6 pts as combination of L1+L2+ with min 2×L2
//   • Profile photo approved
//   • No quarantine (2 years after a rejected application)
const RO_UPGRADE_CONFIG = {
  provisionalMinPts:   6,
  provisionalMinL2:    2,
  minMemberYears:      1,
  quarantineYears:     2,
};

function computeROChecklist(user, matches) {
  const now       = new Date();
  const joinDate  = new Date(user.joined);
  const yearsActive = (now - joinDate) / (1000*60*60*24*365.25);
  const lastApp   = user.lastROApplication ? new Date(user.lastROApplication) : null;
  const daysSinceLastApp = lastApp ? (now - lastApp) / (1000*60*60*24) : Infinity;

  // Provisional match points accumulated (as RO-P)
  const provEntries = (matches||[])
    .filter(m=>m.status==="completed")
    .flatMap(m=>(m.assignments||[])
      .filter(a=>a.roId===user.id && a.role==="RO-P")
      .map(a=>({ pts:a.pointsAwarded, level:m.level }))
    );
  const provTotal = provEntries.reduce((s,e)=>s+e.pts,0);
  const provL2    = provEntries.filter(e=>meetsLevelOrHigher(e.level,"Level II")).length;

  // IROA Level I seminar completed and graduated
  const hasLevelI = (user.seminarHistory||[]).some(
    s=>s.type==="Level I"&&s.graduated&&s.diplomaVerified
  );

  return [
    {
      key:"cert",
      label:"Current certification is RO-P",
      pass: user.certification==="RO-P",
    },
    {
      key:"active",
      label:"Account is active",
      pass: user.active,
    },
    {
      key:"member_age",
      label:`Member ≥ 1 year (currently ${yearsActive.toFixed(1)} yrs)`,
      pass: yearsActive >= RO_UPGRADE_CONFIG.minMemberYears,
    },
    {
      key:"photo",
      label:"Profile photo approved",
      pass: !!user.profilePhotoApproved,
    },
    {
      key:"seminar",
      label:"Completed & verified IROA Level I seminar",
      pass: hasLevelI,
    },
    {
      key:"prov_pts",
      label:`Provisional points ≥ ${RO_UPGRADE_CONFIG.provisionalMinPts} (earned: ${provTotal})`,
      pass: provTotal >= RO_UPGRADE_CONFIG.provisionalMinPts,
      detail: "Points from matches worked as Provisional RO",
    },
    {
      key:"prov_l2",
      label:`≥ ${RO_UPGRADE_CONFIG.provisionalMinL2}×Level II+ matches as RO-P (count: ${provL2})`,
      pass: provL2 >= RO_UPGRADE_CONFIG.provisionalMinL2,
      detail: "Provisional period must include at least 2 Level II or higher matches",
    },
    {
      key:"quarantine",
      label:`No rejected application in last 2 years`,
      pass: daysSinceLastApp >= RO_UPGRADE_CONFIG.quarantineYears * 365,
      detail: lastApp ? `Last application: ${lastApp.toLocaleDateString("en-GB")}` : "No previous application",
    },
  ];
}

