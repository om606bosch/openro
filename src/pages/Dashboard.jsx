import React, { useState, useMemo, useEffect, useRef } from "react";
import { certColor, roleColor, statusColor, fmtDate, certRank, canManageMatches, isAdmin, uid, inp, btnS, btnP, btnD, errInp, clubRoleColor, canManageClub, isClubPresident, docCatColor, docTypeColor, fmtFileSize, computeYearlyPoints, meetsLevelOrHigher, checkAnnualMaintenance } from "../lib/helpers";
import { CERT_LEVELS, SYSTEM_ROLES, MATCH_LEVEL_POINTS, SEMINAR_INSTRUCTOR_POINTS, POINT_RULES, IPSC_DISCIPLINES, DQ_REASONS, DEFAULT_REGIONS, DOC_CATEGORIES } from "../lib/constants";
import { Badge, StatCard, Modal, Field, InfoRow, Divider, RegionSelect, UserPicker, useAuth, useTheme } from "../components/ui";

export default function Dashboard({ users, matches, seminars }) {
  const activeUsers     = users.filter(u=>u.active).length;
  const certifiedROs    = users.filter(u=>u.certification!=="None"&&u.active).length;
  const upcomingMatches = matches.filter(m=>m.status==="upcoming").length;
  const completedMatches= matches.filter(m=>m.status==="completed").length;
  const totalPoints     = users.reduce((s,u)=>s+u.points,0);
  const certBreakdown   = ["RO-P","RO","CRO","RM"].map(c=>({ cert:c, count:users.filter(u=>u.certification===c&&u.active).length })).filter(x=>x.count>0);
  const upcomingSeminars= (seminars||[]).filter(s=>s.status==="upcoming").length;
  const recentMatches   = [...matches].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);

  return (
    <div>
      <h1 style={{fontSize:28,fontWeight:800,margin:"0 0 4px",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.03em",color:"var(--text-primary)"}}>Dashboard</h1>
      <p style={{color:"var(--text-faint)",marginBottom:28,fontSize:14}}>System-wide overview</p>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:28}}>
        <StatCard label="Registered Users"  value={users.length}    sub={`${activeUsers} active`}  accent="#4ade80" />
        <StatCard label="Certified ROs"     value={certifiedROs}    accent="#facc15" />
        <StatCard label="Upcoming Matches"  value={upcomingMatches} accent="#60a5fa" />
        <StatCard label="Completed Matches" value={completedMatches}accent="#6b7280" />
        <StatCard label="Seminars Scheduled"value={upcomingSeminars}accent="#38bdf8" />
        <StatCard label="Total Points"      value={totalPoints}     accent="#e85d2c" />
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
        <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:20}}>
          <h3 style={{margin:"0 0 16px",fontSize:13,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Certification Breakdown</h3>
          {certBreakdown.map(({cert,count})=>(
            <div key={cert} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <Badge label={cert} color={certColor(cert)} />
              <div style={{flex:1,background:"var(--border)",borderRadius:4,height:6,overflow:"hidden"}}>
                <div style={{width:`${(count/(certifiedROs||1))*100}%`,background:certColor(cert),height:"100%",borderRadius:4}} />
              </div>
              <span style={{color:"var(--text-second)",fontSize:13,fontWeight:600,minWidth:20}}>{count}</span>
            </div>
          ))}
        </div>
        <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:20}}>
          <h3 style={{margin:"0 0 16px",fontSize:13,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Points Leaderboard</h3>
          {[...users].filter(u=>u.active).sort((a,b)=>b.points-a.points).slice(0,6).map((u,i)=>(
            <div key={u.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <span style={{fontSize:11,color:i<3?"#facc15":"var(--text-faint)",fontWeight:700,minWidth:20}}>#{i+1}</span>
              <span style={{flex:1,color:"var(--text-primary)",fontSize:14}}>{u.name}</span>
              <Badge label={u.certification||"None"} color={certColor(u.certification)} />
              <span style={{color:"#e85d2c",fontWeight:800,fontSize:15,fontFamily:"'Barlow Condensed',sans-serif",minWidth:28,textAlign:"right"}}>{u.points}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:20}}>
        <h3 style={{margin:"0 0 16px",fontSize:13,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Recent Matches</h3>
        {recentMatches.map(m=>{
          const mdUser=users.find(u=>u.id===m.md);
          const rmUser=users.find(u=>u.id===m.rm);
          const staffStr = m.combinedMDRM
            ? `MD/RM: ${mdUser?.name||"—"}`
            : `MD: ${mdUser?.name||"—"} · RM: ${rmUser?.name||"—"}`;
          return (
            <div key={m.id} style={{display:"flex",alignItems:"center",gap:14,padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
              <Badge label={m.status} color={statusColor(m.status)} />
              <div style={{flex:1}}>
                <div style={{color:"var(--text-primary)",fontWeight:600,fontSize:14}}>{m.name}</div>
                <div style={{color:"var(--text-faint)",fontSize:12,marginTop:2}}>{fmtDate(m.date)} · {m.region} · {m.stages} stages · {staffStr}</div>
              </div>
              <Badge label={m.level} color="#7c8cf8" />
              <span style={{color:"var(--text-muted)",fontSize:12}}>{m.assignments.length} ROs</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

