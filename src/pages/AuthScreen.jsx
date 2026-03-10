import React, { useState, useMemo, useEffect, useRef } from "react";
import { certColor, roleColor, statusColor, fmtDate, certRank, canManageMatches, isAdmin, uid, inp, btnS, btnP, btnD, errInp, clubRoleColor, canManageClub, isClubPresident, docCatColor, docTypeColor, fmtFileSize, computeYearlyPoints, meetsLevelOrHigher, checkAnnualMaintenance } from "../lib/helpers";
import { CERT_LEVELS, SYSTEM_ROLES, MATCH_LEVEL_POINTS, SEMINAR_INSTRUCTOR_POINTS, POINT_RULES, IPSC_DISCIPLINES, DQ_REASONS, DEFAULT_REGIONS, DOC_CATEGORIES } from "../lib/constants";
import { Badge, StatCard, Modal, Field, InfoRow, Divider, RegionSelect, UserPicker, useAuth, useTheme } from "../components/ui";

export default function AuthScreen({ users, setUsers, onLogin, regions }) {
  const [mode, setMode]   = useState("login");
  const [form, setForm]   = useState({ name:"", email:"", password:"", confirm:"", region:"" });
  const [error, setError] = useState("");
  const [fe, setFe]       = useState({});   // field errors for register form

  const f = k => e => { setForm(p => ({...p,[k]:e.target.value})); setError(""); setFe(p=>({...p,[k]:false})); };

  function login() {
    const user = users.find(u => u.email.toLowerCase() === form.email.toLowerCase() && u.password === form.password);
    if (!user)        { setError("Invalid email or password."); return; }
    if (!user.active) { setError("Account deactivated. Contact an administrator."); return; }
    onLogin(user);
  }

  function register() {
    const errs = {};
    if (!form.name.trim())    errs.name     = true;
    if (!form.email.trim())   errs.email    = true;
    if (!form.password)       errs.password = true;
    if (Object.keys(errs).length) { setFe(errs); setError(""); return; }
    if (form.password !== form.confirm)  { setFe({confirm:true}); setError("Passwords do not match."); return; }
    if (form.password.length < 4)        { setFe({password:true}); setError("Password must be at least 4 characters."); return; }
    if (users.find(u => u.email.toLowerCase() === form.email.toLowerCase())) { setFe({email:true}); setError("Email already registered."); return; }
    const nu = {
      id:uid(), name:form.name.trim(), email:form.email.trim(), password:form.password,
      role:"member", certification:"None", region:form.region.trim(),
      joined:new Date().toISOString().slice(0,10), active:true, points:0, notes:"",
      iroa: { member: false, since: null },
      profilePhotoApproved: false, lastROApplication: null,
      seminarHistory: [],
      certHistory:[]
    };
    setUsers(prev => [...prev, nu]);
    onLogin(nu);
  }

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"Inter,sans-serif" }}>
      <div style={{ position:"fixed", top:"-15%", right:"-8%", width:480, height:480, borderRadius:"50%", background:"radial-gradient(circle,#e85d2c16 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"fixed", bottom:"-15%", left:"-8%", width:380, height:380, borderRadius:"50%", background:"radial-gradient(circle,#60a5fa0d 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={{ width:"100%", maxWidth:430 }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ width:60, height:60, background:"#e85d2c", borderRadius:16, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:30, marginBottom:18 }}>🎯</div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:30, fontWeight:800, color:"var(--text-primary)", letterSpacing:"0.05em" }}>OpenRO</div>
          <div style={{ fontSize:13, color:"var(--text-faint)", marginTop:4 }}>Range Officer Manager</div>
        </div>

        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:34, boxShadow:"0 24px 70px rgba(0,0,0,0.65)" }}>
          {/* Tab */}
          <div style={{ display:"flex", background:"var(--surface2)", borderRadius:9, padding:4, marginBottom:28 }}>
            {["login","register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); setFe({}); }} style={{
                flex:1, padding:"9px", border:"none", borderRadius:6, cursor:"pointer", fontSize:14, fontWeight:600,
                background:mode===m?"#e85d2c":"transparent", color:mode===m?"#fff":"var(--text-muted)", transition:"all 0.15s"
              }}>{m==="login"?"Sign In":"Register"}</button>
            ))}
          </div>

          {error && <div style={{ background:"#f8717115", border:"1px solid #f8717155", borderRadius:7, padding:"10px 14px", color:"#f87171", fontSize:13, marginBottom:18 }}>{error}</div>}

          {mode === "login" ? (
            <>
              <Field label="Email"><input style={inp} type="email" value={form.email} onChange={f("email")} placeholder="your@email.com" onKeyDown={e=>e.key==="Enter"&&login()} /></Field>
              <Field label="Password"><input style={inp} type="password" value={form.password} onChange={f("password")} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&login()} /></Field>
              <button style={{...btnP,width:"100%",padding:"12px",marginTop:4}} onClick={login}>Sign In</button>
              <Divider label="demo accounts" />
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {[
                  { label:"Admin",  email:"erik@example.com",  pass:"pass1", role:"admin"  },
                  { label:"RM",     email:"marte@example.com", pass:"pass2", role:"rm"     },
                  { label:"Member", email:"jonas@example.com", pass:"pass3", role:"member" },
                ].map(d => (
                  <button key={d.email} onClick={() => { setForm(p=>({...p,email:d.email,password:d.pass})); setError(""); }}
                    style={{...btnS,padding:"8px 14px",fontSize:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{color:"var(--text-second)"}}>{d.label}: {d.email} / {d.pass}</span>
                    <Badge label={d.role} color={roleColor(d.role)} />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <Field label="Full Name" error={fe.name?"Required":undefined}><input style={errInp(fe.name)} value={form.name} onChange={f("name")} placeholder="Your full name" /></Field>
              <Field label="Email" error={fe.email?"Required":undefined}><input style={errInp(fe.email)} type="email" value={form.email} onChange={f("email")} placeholder="your@email.com" /></Field>
              <Field label="District (optional)">
                <RegionSelect value={form.region} onChange={v=>setForm(p=>({...p,region:v}))} regions={regions} placeholder="— Select your district —" />
              </Field>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <Field label="Password" error={fe.password?"Required":undefined}><input style={errInp(fe.password)} type="password" value={form.password} onChange={f("password")} placeholder="Min. 4 chars" /></Field>
                <Field label="Confirm" error={fe.confirm?"Mismatch":undefined}><input style={errInp(fe.confirm)} type="password" value={form.confirm} onChange={f("confirm")} placeholder="Repeat" onKeyDown={e=>e.key==="Enter"&&register()} /></Field>
              </div>
              <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:7, padding:"11px 14px", fontSize:12, color:"var(--text-faint)", marginBottom:16 }}>
                New accounts start as <Badge label="member" color="#60a5fa" /> with <Badge label="No Cert" color="var(--text-faint)" />. An admin must grant your RO certification before you can be assigned to matches.
              </div>
              <button style={{...btnP,width:"100%",padding:"12px"}} onClick={register}>Create Account</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
