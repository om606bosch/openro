import React, { useState, useMemo, useEffect } from "react";
import { certColor, roleColor, canManageMatches } from "./lib/helpers";
import { THEMES, DEFAULT_REGIONS } from "./lib/constants";
import { seedUsers, seedMatches, seedSeminars, seedClubs, seedDocs } from "./lib/seedData";
import { AuthCtx, ThemeCtx, Badge } from "./components/ui";

import AuthScreen   from "./pages/AuthScreen";
import Dashboard    from "./pages/Dashboard";
import MyProfile    from "./pages/MyProfile";
import UserDatabase from "./pages/UserDatabase";
import ROPage       from "./pages/ROPage";
import MatchesPage  from "./pages/MatchesPage";
import ClubsPage    from "./pages/ClubsPage";
import DocsPage     from "./pages/DocsPage";
import PointsPage   from "./pages/PointsPage";
import SeminarsPage from "./pages/SeminarsPage";

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) return (
      <div style={{padding:40,color:"#f87171",fontFamily:"monospace"}}>
        <strong>Page error:</strong><br/><br/>
        {this.state.error.message}<br/><br/>
        <pre style={{fontSize:11,whiteSpace:"pre-wrap"}}>{this.state.error.stack}</pre>
        <button onClick={()=>this.setState({error:null})} style={{marginTop:16,padding:"8px 16px",cursor:"pointer"}}>Dismiss</button>
      </div>
    );
    return this.props.children;
  }
}


const LS_KEYS = {
  users:"openro_users", matches:"openro_matches", seminars:"openro_seminars",
  applications:"openro_applications", clubs:"openro_clubs", docs:"openro_docs",
  regions:"openro_regions", theme:"openro_theme",
};

function lsGet(key, fallback) {
  try { const raw=localStorage.getItem(key); return raw===null?fallback:JSON.parse(raw); }
  catch { return fallback; }
}
function lsSet(key, value) {
  try {
    if (key===LS_KEYS.matches && Array.isArray(value))
      value=value.map(m=>{const{_pointsToDistribute,...rest}=m;return rest;});
    localStorage.setItem(key,JSON.stringify(value));
  } catch(e){ console.warn("localStorage write failed:",e); }
}
function initState() {
  return {
    users:lsGet(LS_KEYS.users,seedUsers), matches:lsGet(LS_KEYS.matches,seedMatches),
    seminars:lsGet(LS_KEYS.seminars,seedSeminars), applications:lsGet(LS_KEYS.applications,[]),
    clubs:lsGet(LS_KEYS.clubs,seedClubs), docs:lsGet(LS_KEYS.docs,seedDocs),
    regions:lsGet(LS_KEYS.regions,DEFAULT_REGIONS), theme:lsGet(LS_KEYS.theme,"dark"),
  };
}
export function wipeAndReset() {
  Object.values(LS_KEYS).forEach(k=>localStorage.removeItem(k)); window.location.reload();
}

export default function App() {
  const init=useMemo(initState,[]);
  const [users,setUsersRaw]=useState(init.users);
  const [matchesRaw,setMatchesRaw]=useState(init.matches);
  const [seminars,setSeminarsRaw]=useState(init.seminars);
  const [applications,setApplicationsRaw]=useState(init.applications);
  const [clubs,setClubsRaw]=useState(init.clubs);
  const [docs,setDocsRaw]=useState(init.docs);
  const [regions,setRegionsRaw]=useState(init.regions);
  const [theme,setThemeRaw]=useState(init.theme);
  const [currentUserId,setCurrentUserId]=useState(null);
  const [page,setPage]=useState("dashboard");
  const [menuOpen,setMenuOpen]=useState(false);

  const currentUser=currentUserId?users.find(u=>u.id===currentUserId)||null:null;
  const setUsers=setUsersRaw,setSeminars=setSeminarsRaw,setApplications=setApplicationsRaw;
  const setClubs=setClubsRaw,setDocs=setDocsRaw,setRegions=setRegionsRaw,setTheme=setThemeRaw;

  function setMatches(updater) {
    setMatchesRaw(prev=>{
      const next=typeof updater==="function"?updater(prev):updater;
      next.forEach(m=>{
        if(m._pointsToDistribute){
          setUsersRaw(u=>u.map(user=>{
            const a=m.assignments.find(a=>a.roId===user.id);
            return a?{...user,points:user.points+a.pointsAwarded}:user;
          }));
          m._pointsToDistribute=false;
        }
      });
      return next;
    });
  }

  useEffect(()=>{lsSet(LS_KEYS.users,users);},[users]);
  useEffect(()=>{lsSet(LS_KEYS.matches,matchesRaw);},[matchesRaw]);
  useEffect(()=>{lsSet(LS_KEYS.seminars,seminars);},[seminars]);
  useEffect(()=>{lsSet(LS_KEYS.applications,applications);},[applications]);
  useEffect(()=>{lsSet(LS_KEYS.clubs,clubs);},[clubs]);
  useEffect(()=>{lsSet(LS_KEYS.docs,docs);},[docs]);
  useEffect(()=>{lsSet(LS_KEYS.regions,regions);},[regions]);
  useEffect(()=>{lsSet(LS_KEYS.theme,theme);},[theme]);

  function login(user){setCurrentUserId(user.id);setPage("dashboard");setMenuOpen(false);}
  function logout(){setCurrentUserId(null);setPage("dashboard");setMenuOpen(false);}

  const pendingApps=applications.filter(a=>a.status==="pending");
  const canMatch=currentUser&&canManageMatches(currentUser);
  const T=THEMES[theme];

  const cssVars=`
    :root{--bg:${T.bg};--surface:${T.surface};--surface2:${T.surface2};--surface3:${T.surface3};
    --border:${T.border};--border2:${T.border2};--text-primary:${T.textPrimary};
    --text-second:${T.textSecond};--text-muted:${T.textMuted};--text-faint:${T.textFaint};
    --inp-bg:${T.inpBg};--inp-border:${T.inpBorder};--inp-text:${T.inpText};
    --shadow-lg:${T.shadowLg};--backdrop:${T.backdrop};
    --scroll-bg:${T.scrollBg};--scroll-thumb:${T.scrollThumb};}
  `;
  const NAV=[
    {id:"dashboard",label:"Dashboard",icon:"📊",show:true},
    {id:"ro",label:"Range Officers",icon:"👥",show:true},
    {id:"matches",label:"Matches",icon:"🎯",show:true},
    {id:"clubs",label:"Clubs",icon:"🏛️",show:true},
    {id:"docs",label:"Documentation",icon:"📄",show:true},
    {id:"seminars",label:"Seminars",icon:"🎓",show:true},
    {id:"points",label:"Points Ledger",icon:"📈",show:true},
    {id:"users",label:"User Database",icon:"🛡️",show:canMatch,badge:pendingApps.length>0?pendingApps.length:null},
    {id:"profile",label:"My Profile",icon:"👤",show:true},
  ].filter(n=>n.show);

  const globalStyle=`body{margin:0;background:var(--bg);color:var(--text-primary);font-family:'Inter','Segoe UI',sans-serif;}*{box-sizing:border-box;}input,select,textarea{background:var(--inp-bg);border-color:var(--inp-border);color:var(--inp-text);}select option{background:var(--surface);color:var(--inp-text);}::-webkit-scrollbar{width:6px;background:var(--scroll-bg);}::-webkit-scrollbar-thumb{background:var(--scroll-thumb);border-radius:3px;}`;

  if(!currentUser) return(
    <ThemeCtx.Provider value={theme}><AuthCtx.Provider value={{currentUser}}>
      <style>{cssVars}</style><style>{globalStyle}</style>
      <AuthScreen users={users} setUsers={setUsers} onLogin={login} regions={regions}/>
    </AuthCtx.Provider></ThemeCtx.Provider>
  );

  return(
    <ThemeCtx.Provider value={theme}><AuthCtx.Provider value={{currentUser}}>
      <style>{cssVars}</style>
      <style>{`${globalStyle}
        .ro-sidebar{display:flex;flex-direction:column;transition:transform 0.25s ease;position:fixed;top:0;left:0;bottom:0;width:228px;background:var(--surface);border-right:1px solid var(--border);z-index:200;}
        .mobile-topbar{display:none;}
        .mobile-close{display:none;}
        .ro-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:199;}
        .ro-main{margin-left:228px;width:calc(100% - 228px);min-height:100vh;background:var(--bg);padding:28px clamp(16px,2.5vw,40px);box-sizing:border-box;overflow-x:hidden;}
        @media(max-width:700px){
          .ro-sidebar{transform:translateX(-100%);}
          .ro-sidebar.open{transform:translateX(0);}
          .ro-overlay.open{display:block;}
          .mobile-topbar{display:flex !important;}
          .mobile-close{display:block !important;}
          .ro-main{margin-left:0 !important;width:100% !important;padding-top:68px !important;}
        }
      `}</style>
      <div style={{display:"flex",minHeight:"100vh",background:"var(--bg)"}}>
        <aside className={`ro-sidebar${menuOpen?" open":""}`}>
          <div style={{padding:"18px 20px 14px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:8,background:"#e85d2c",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🎯</div>
              <div>
                <div style={{fontWeight:800,fontSize:15,color:"var(--text-primary)",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.06em"}}>OpenRO</div>
                <div style={{fontSize:10,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Range Officer Manager</div>
              </div>
            </div>
            <button onClick={()=>setMenuOpen(false)} style={{background:"none",border:"none",color:"var(--text-muted)",cursor:"pointer",fontSize:18}} className="mobile-close">×</button>
          </div>
          <nav style={{flex:1,overflowY:"auto",padding:"10px 0"}}>
            {NAV.map(n=>(
              <button key={n.id} onClick={()=>{setPage(n.id);setMenuOpen(false);}} style={{display:"flex",alignItems:"center",gap:10,width:"calc(100% - 16px)",padding:"10px 16px",background:page===n.id?"#e85d2c22":"none",border:page===n.id?"1px solid #e85d2c44":"1px solid transparent",borderRadius:6,margin:"1px 8px",color:page===n.id?"#e85d2c":"var(--text-muted)",cursor:"pointer",fontSize:14,fontWeight:page===n.id?700:400,textAlign:"left"}}>
                <span style={{fontSize:16}}>{n.icon}</span>
                <span style={{flex:1}}>{n.label}</span>
                {n.badge&&<span style={{background:"#e85d2c",color:"#fff",borderRadius:10,fontSize:10,fontWeight:800,padding:"1px 6px"}}>{n.badge}</span>}
              </button>
            ))}
          </nav>
          <div style={{padding:"12px 14px",borderTop:"1px solid var(--border)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:"#e85d2c",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:"#fff",flexShrink:0}}>{currentUser.name.charAt(0)}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:13,color:"var(--text-primary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{currentUser.name}</div>
                <div style={{display:"flex",gap:4,marginTop:2,flexWrap:"wrap"}}>
                  <Badge label={currentUser.role.toUpperCase()} color={roleColor(currentUser.role)}/>
                  {currentUser.certification!=="None"&&<Badge label={currentUser.certification} color={certColor(currentUser.certification)}/>}
                </div>
              </div>
            </div>
            <button onClick={()=>setTheme(t=>t==="dark"?"light":"dark")} style={{width:"100%",marginBottom:8,background:"var(--surface2)",border:"1px solid var(--border2)",borderRadius:6,color:"var(--text-muted)",padding:"7px",fontSize:12,cursor:"pointer",fontWeight:600}}>{theme==="dark"?"🌙 Dark Mode":"☀️ Light Mode"}</button>
            <button onClick={logout} style={{width:"100%",background:"var(--surface2)",border:"1px solid var(--border2)",borderRadius:6,color:"var(--text-muted)",padding:"7px",fontSize:12,cursor:"pointer",fontWeight:600}}>Sign Out</button>
          </div>
        </aside>
        <div className={`ro-overlay${menuOpen?" open":""}`} onClick={()=>setMenuOpen(false)} />
        <div style={{position:"fixed",top:0,left:0,right:0,height:52,background:"var(--surface)",borderBottom:"1px solid var(--border)",zIndex:99,alignItems:"center",padding:"0 14px",gap:12}} className="mobile-topbar">
          <button onClick={()=>setMenuOpen(o=>!o)} style={{background:"none",border:"none",color:"var(--text-primary)",fontSize:22,cursor:"pointer",padding:4}}>☰</button>
          <div style={{fontWeight:800,fontSize:16,color:"var(--text-primary)",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.06em"}}>OpenRO</div>
          <div style={{flex:1}}/>
          <button onClick={()=>setTheme(t=>t==="dark"?"light":"dark")} style={{background:"none",border:"none",fontSize:18,cursor:"pointer"}}>{theme==="dark"?"🌙":"☀️"}</button>
        </div>
        <main className="ro-main"><ErrorBoundary>
          {page==="dashboard"&&<Dashboard users={users} matches={matchesRaw} seminars={seminars}/>}
          {page==="ro"&&<ROPage users={users} matches={matchesRaw} regions={regions}/>}
          {page==="matches"&&<MatchesPage users={users} matches={matchesRaw} setMatches={setMatches} regions={regions} clubs={clubs}/>}
          {page==="clubs"&&<ClubsPage users={users} clubs={clubs} setClubs={setClubs} applications={applications} setApplications={setApplications} matches={matchesRaw} regions={regions}/>}
          {page==="docs"&&<DocsPage docs={docs} setDocs={setDocs}/>}
          {page==="seminars"&&<SeminarsPage users={users} setUsers={setUsers} seminars={seminars} setSeminars={setSeminars}/>}
          {page==="points"&&<PointsPage users={users} setUsers={setUsers} matches={matchesRaw}/>}
          {page==="users"&&canMatch&&<UserDatabase users={users} setUsers={setUsers} regions={regions} setRegions={setRegions} applications={applications} setApplications={setApplications} matches={matchesRaw}/>}
          {page==="profile"&&<MyProfile users={users} setUsers={setUsers} matches={matchesRaw} seminars={seminars} regions={regions} applications={applications} setApplications={setApplications} clubs={clubs} setClubs={setClubs}/>}
        </ErrorBoundary></main>
      </div>
    </AuthCtx.Provider></ThemeCtx.Provider>
  );
}
