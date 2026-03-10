import { useState, useMemo, useRef, useEffect, createContext, useContext } from "react";
import { certColor, roleColor, inp, btnS, btnP, btnD, errInp } from "../lib/helpers";
export { inp, btnS, btnP, btnD, errInp } from "../lib/helpers";

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXTS
// ─────────────────────────────────────────────────────────────────────────────

export const AuthCtx  = createContext(null);
export function useAuth()  { return useContext(AuthCtx); }

export const ThemeCtx = createContext("dark");
export function useTheme() { return useContext(ThemeCtx); }

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

export function Badge({ label, color }) {
  return (
    <span style={{
      display:"inline-block", padding:"2px 9px", borderRadius:3, fontSize:11,
      fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase",
      background:color+"22", color, border:`1px solid ${color}55`
    }}>{label}</span>
  );
}

export function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, padding:"18px 22px", minWidth:120, flex:1 }}>
      <div style={{ fontSize:28, fontWeight:800, color:accent||"var(--text-primary)", fontFamily:"'Barlow Condensed',sans-serif" }}>{value}</div>
      <div style={{ fontSize:12, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginTop:2 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:"var(--text-faint)", marginTop:4 }}>{sub}</div>}
    </div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{
      position:"fixed", inset:0, background:"var(--backdrop)", zIndex:1000,
      display:"flex", alignItems:"flex-start", justifyContent:"center",
      padding:"20px 20px", overflowY:"auto"
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12,
        width:"100%", maxWidth:wide?820:640,
        boxShadow:"var(--shadow-lg)", margin:"auto", flexShrink:0
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 26px", borderBottom:"1px solid var(--border)", position:"sticky", top:0, background:"var(--surface)", zIndex:10, borderRadius:"12px 12px 0 0" }}>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:"var(--text-primary)", fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"0.04em" }}>{title}</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:22, lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:"26px" }}>{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, hint, error }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:600, color:error?"#f87171":"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>{label}{error&&<span style={{fontWeight:400,textTransform:"none",marginLeft:6}}>— {error}</span>}</label>
      {children}
      {hint && !error && <div style={{ fontSize:11, color:"var(--text-faint)", marginTop:4 }}>{hint}</div>}
    </div>
  );
}

export function InfoRow({ label, value }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid var(--surface3)", fontSize:13 }}>
      <span style={{ color:"var(--text-faint)" }}>{label}</span>
      <span style={{ color:"var(--text-second)", fontWeight:500 }}>{value}</span>
    </div>
  );
}

export function Divider({ label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, margin:"20px 0" }}>
      <div style={{ flex:1, height:1, background:"var(--border)" }} />
      {label && <span style={{ color:"var(--text-faint)", fontSize:11, textTransform:"uppercase", letterSpacing:"0.09em" }}>{label}</span>}
      <div style={{ flex:1, height:1, background:"var(--border)" }} />
    </div>
  );
}

// RegionSelect — dropdown built from the live regions list.
// Shows an "Other / free text" escape so users can still type a custom value
// if their region isn't in the list yet. Admins can permanently add new
// regions via the User Database → Region Settings panel.
export function RegionSelect({ value, onChange, regions, placeholder = "— Select district —", style, hasError }) {
  const knownRegion = !value || regions.includes(value);
  const [showCustom, setShowCustom] = useState(!knownRegion && !!value);

  function handleSelect(e) {
    if (e.target.value === "__other__") {
      setShowCustom(true);
      onChange("");
    } else {
      setShowCustom(false);
      onChange(e.target.value);
    }
  }

  if (showCustom) {
    return (
      <div style={{ display:"flex", gap:8 }}>
        <input
          style={{ ...inp, ...(style||{}), flex:1, ...(hasError ? {border:"1.5px solid #f87171",background:"#f8717108"} : {}) }}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Type district name…"
          autoFocus
        />
        <button
          onClick={() => { setShowCustom(false); onChange(""); }}
          style={{ ...btnS, padding:"9px 12px", fontSize:12, whiteSpace:"nowrap" }}
        >↩ List</button>
      </div>
    );
  }

  return (
    <select
      style={{ ...inp, ...(style||{}), ...(hasError ? {border:"1.5px solid #f87171",background:"#f8717108"} : {}) }}
      value={regions.includes(value) ? value : ""}
      onChange={handleSelect}
    >
      <option value="">{placeholder}</option>
      {[...regions].sort().map(r => <option key={r} value={r}>{r}</option>)}
      <option value="__other__">Other / not listed…</option>
    </select>
  );
}

// inp/btnS/btnP/btnD/errInp come from helpers (re-exported at top of file)

export function UserPicker({ users, value, onChange, placeholder = "— Select user —", labelFn, style, hasError }) {
  const defaultLabel = u => u.certification && u.certification !== "None"
    ? `${u.name} (${u.certification})`
    : u.name;
  const label = labelFn || defaultLabel;

  const selected = users.find(u => u.id === value) || null;

  const [open,    setOpen]    = useState(false);
  const [query,   setQuery]   = useState("");
  const [dropPos, setDropPos] = useState({ top:0, left:0, width:0 });
  const inputRef  = React.useRef(null);
  const triggerRef = React.useRef(null);
  const wrapRef   = React.useRef(null);

  // Position the fixed dropdown relative to the trigger button
  function calcPos() {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    // Decide whether to open upward if too close to bottom
    const spaceBelow = window.innerHeight - r.bottom;
    const dropH = Math.min(300, users.length * 38 + 60);
    const openUp = spaceBelow < dropH && r.top > dropH;
    setDropPos({
      top: openUp ? r.top - dropH - 4 : r.bottom + 4,
      left: r.left,
      width: r.width,
      openUp
    });
  }

  // Close on outside click or scroll
  React.useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target) &&
          !document.getElementById("userpicker-portal")?.contains(e.target)) {
        setOpen(false); setQuery("");
      }
    }
    function onScroll() { if (open) { calcPos(); } }
    document.addEventListener("mousedown", handler);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return q ? users.filter(u => label(u).toLowerCase().includes(q)) : users;
  }, [users, query]);

  function select(id) { onChange(id); setOpen(false); setQuery(""); }

  function handleTriggerClick() {
    calcPos();
    setOpen(o => !o);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 30);
  }

  const theme = useTheme();

  return (
    <div ref={wrapRef} style={{ position:"relative", width:"100%", ...(style||{}) }}>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        style={{
          ...inp, textAlign:"left", cursor:"pointer", display:"flex",
          alignItems:"center", justifyContent:"space-between", gap:8,
          paddingRight:10, userSelect:"none",
          ...(hasError ? {border:"1.5px solid #f87171",background:"#f8717108"} : {})
        }}
      >
        <span style={{ color: selected ? "var(--text-primary)" : "var(--text-faint)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>
          {selected ? label(selected) : placeholder}
        </span>
        <span style={{ color:"var(--text-faint)", fontSize:11, flexShrink:0 }}>{open ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown — rendered via a portal-like fixed div to escape any overflow:hidden/auto parent */}
      {open && (
        <div
          id="userpicker-portal"
          style={{
            position:"fixed",
            top: dropPos.top,
            left: dropPos.left,
            width: dropPos.width,
            zIndex: 9999,
            background:"var(--surface)",
            border:"1px solid var(--border2)",
            borderRadius:8,
            boxShadow: theme === "dark"
              ? "0 12px 40px rgba(0,0,0,0.75)"
              : "0 8px 32px rgba(0,0,0,0.18)",
            overflow:"hidden"
          }}
        >
          {/* Search input */}
          <div style={{ padding:"8px 10px", borderBottom:"1px solid var(--border)" }}>
            <input
              ref={inputRef}
              style={{ ...inp, padding:"7px 10px", fontSize:13 }}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type to search…"
              onClick={e => e.stopPropagation()}
            />
          </div>
          {/* Option list */}
          <div style={{ maxHeight:220, overflowY:"auto" }}>
            <div
              onClick={() => select("")}
              style={{
                padding:"9px 14px", cursor:"pointer", fontSize:13,
                color: !value ? "#e85d2c" : "var(--text-faint)",
                background: !value ? "var(--surface3)" : "transparent",
                borderBottom:"1px solid var(--border)"
              }}
            >{placeholder}</div>
            {filtered.length === 0 && (
              <div style={{ padding:"12px 14px", color:"var(--text-faint)", fontSize:13 }}>No results for "{query}"</div>
            )}
            {filtered.map(u => (
              <div
                key={u.id}
                onClick={() => select(u.id)}
                style={{
                  padding:"9px 14px", cursor:"pointer", fontSize:13,
                  color: u.id === value ? "#e85d2c" : "var(--text-primary)",
                  background: u.id === value ? "var(--surface3)" : "transparent",
                  borderBottom:"1px solid var(--surface3)",
                  transition:"background 0.1s"
                }}
                onMouseEnter={e => { if (u.id !== value) e.currentTarget.style.background = "var(--surface3)"; }}
                onMouseLeave={e => { if (u.id !== value) e.currentTarget.style.background = "transparent"; }}
              >
                {label(u)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
