// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function uid() { return "u" + Math.random().toString(36).slice(2, 9); }

export function certColor(c) {
  return { "RO-P":"#86efac", RO:"#4ade80", CRO:"#facc15", RM:"#f97316", MD:"#e85d2c", Admin:"#c084fc", "MD/RM":"#fb923c", None:"var(--text-faint)" }[c] || "#9ca3af";
}
export function roleColor(r) {
  return { admin:"#c084fc", rm:"#f97316", member:"#60a5fa" }[r] || "#9ca3af";
}
export function statusColor(s) {
  return { upcoming:"#60a5fa", active:"#4ade80", completed:"#6b7280" }[s] || "#9ca3af";
}
export function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
}
export function certRank(c) { return { None:0, "RO-P":1, RO:2, CRO:3, RM:4, Admin:5 }[c] || 0; }
export function canManageMatches(u) { return u && (u.role === "rm" || u.role === "admin"); }
export function isAdmin(u) { return u && u.role === "admin"; }

export function docCatColor(cat) {
  return { NROI:"#f97316", IROA:"#38bdf8", IPSC:"#4ade80", Other:"#a78bfa" }[cat] || "#9ca3af";
}
export function docTypeColor(ext) {
  const e = (ext||"").toLowerCase();
  if (e==="pdf")                         return "#f87171";
  if (e==="doc"||e==="docx")             return "#60a5fa";
  if (e==="xls"||e==="xlsx")             return "#4ade80";
  if (e==="ppt"||e==="pptx")             return "#fb923c";
  if (["png","jpg","jpeg","gif","webp"].includes(e)) return "#c084fc";
  return "#94a3b8";
}
export function fmtFileSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024)    return bytes + " B";
  if (bytes < 1048576) return (bytes/1024).toFixed(1) + " KB";
  return (bytes/1048576).toFixed(1) + " MB";
}

export function clubRoleColor(r) {
  return { president:"#f97316", secretary:"#facc15", treasurer:"#38bdf8", "range-officer":"#4ade80", member:"#60a5fa" }[r] || "#9ca3af";
}
export function canManageClub(currentUser, club) {
  if (!currentUser || !club) return false;
  if (currentUser.role === "admin") return true;
  const member = club.members?.find(m => m.userId === currentUser.id);
  return member && ["president","secretary"].includes(member.role);
}
export function isClubPresident(currentUser, club) {
  if (!currentUser || !club) return false;
  if (currentUser.role === "admin") return true;
  const member = club.members?.find(m => m.userId === currentUser.id);
  return member?.role === "president";
}

// Points computation helpers
export function computeYearlyPoints(userId, matches) {
  const byYear = {};
  for (const m of matches) {
    if (m.status !== "completed") continue;
    const year = new Date(m.date).getFullYear();
    if (!byYear[year]) byYear[year] = [];
    const asgn = (m.assignments || []).find(a => a.userId === userId);
    if (asgn) {
      byYear[year].push({
        matchId: m.id, matchName: m.name, date: m.date,
        level: m.level, role: asgn.role,
        points: asgn.pointsAwarded ?? 0,
        matchLevel: m.level,
      });
    }
  }
  return byYear;
}

export function meetsLevelOrHigher(matchLevel, minLevel) {
  const levels = ["Level I","Level II","Level III","Level IV","Level V"];
  return levels.indexOf(matchLevel) >= levels.indexOf(minLevel);
}

export function checkAnnualMaintenance(cert, yearEntries) {
  // yearEntries: array of { level, role, points }
  // Returns { met: bool, reason: string }
  if (!yearEntries || yearEntries.length === 0) return { met: false, reason: "No points this year" };
  const total = yearEntries.reduce((s,e) => s + e.points, 0);
  if (cert === "RO" || cert === "RO-P") {
    const hasL2 = yearEntries.some(e => meetsLevelOrHigher(e.matchLevel, "Level II"));
    if (total < 6) return { met: false, reason: `Only ${total}/6 pts` };
    if (!hasL2)    return { met: false, reason: "Needs ≥1×L2" };
    return { met: true, reason: `${total} pts, has L2+` };
  }
  if (cert === "CRO") {
    const hasL3 = yearEntries.some(e => meetsLevelOrHigher(e.matchLevel, "Level III"));
    if (total < 6) return { met: false, reason: `Only ${total}/6 pts` };
    if (!hasL3)    return { met: false, reason: "Needs ≥1×L3" };
    return { met: true, reason: `${total} pts, has L3+` };
  }
  if (cert === "RM") {
    const l3Count = yearEntries.filter(e => meetsLevelOrHigher(e.matchLevel, "Level III")).length;
    if (total < 6)    return { met: false, reason: `Only ${total}/6 pts` };
    if (l3Count < 2)  return { met: false, reason: `Only ${l3Count}/2×L3` };
    return { met: true, reason: `${total} pts, ${l3Count}×L3` };
  }
  return { met: true, reason: "N/A" };
}

// CSS-in-JS style constants (shared across pages)
export const inp  = { width:"100%", boxSizing:"border-box", background:"var(--inp-bg)", border:"1px solid var(--inp-border)", borderRadius:6, padding:"9px 12px", color:"var(--inp-text)", fontSize:14, outline:"none", fontFamily:"inherit" };
export const btnS = { background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:6, color:"var(--text-second)", padding:"10px 20px", fontSize:14, fontWeight:600, cursor:"pointer" };
export const btnP = { background:"#e85d2c", border:"none", borderRadius:6, color:"#fff", padding:"10px 20px", fontSize:14, fontWeight:700, cursor:"pointer", letterSpacing:"0.04em" };
export const btnD = { background:"var(--surface2)", border:"1px solid #f8717144", borderRadius:6, color:"#f87171", padding:"10px 20px", fontSize:14, fontWeight:600, cursor:"pointer" };
export function errInp(err) { return err ? { ...inp, border:"1.5px solid #f87171", background:"#f8717108" } : inp; }
