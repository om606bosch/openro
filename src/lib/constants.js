// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const CERT_LEVELS  = ["None", "RO-P", "RO", "CRO", "RM", "Admin"];
export const SYSTEM_ROLES = ["member", "rm", "admin"];
// Points per match role. MD and RM are separate by default.
// MD/RM combined role is only available for Level I matches.
// RO-P (Provisional) earns the same points as a full RO while working towards upgrade.
// Points are awarded per match level (NROI Handbook 2026, p.9), not per role.
// Role determines cert-maintenance eligibility, not point value.
export const MATCH_LEVEL_POINTS = { "Level I": 1, "Level II": 2, "Level III": 3, "Level IV": 4, "Level V": 5 };
export const SEMINAR_INSTRUCTOR_POINTS = 3;  // IROA/NROI Level I or II seminar as instructor

// Legacy role-based lookup kept only for display fallback
export const POINT_RULES  = { "RO-P": 1, RO: 1, CRO: 2, RM: 3, MD: 3, "MD/RM": 4 };

export const IPSC_DISCIPLINES = ["Handgun", "Rifle", "Shotgun", "Pistol Caliber Carbine", "Mini-Rifle"];

// DQ reasons sourced from IPSC Combined Competition Rules, Chapter 10 (Jan 2026 edition).
// Grouped by section; discipline tags (where they appear) are included in the label.
export const DQ_REASONS = [
  {
    group: "10.4 — Accidental Discharge",
    rules: [
      { code:"10.4.1",  label:"Shot travels over backstop, berm or in an unsafe direction" },
      { code:"10.4.2",  label:"Shot strikes ground within 3 metres of competitor" },
      { code:"10.4.3",  label:"Shot fired during loading, reloading or unloading" },
      { code:"10.4.4",  label:"Shot fired during remedial action for a malfunction" },
      { code:"10.4.5",  label:"Shot fired while transferring firearm between hands/shoulders" },
      { code:"10.4.6",  label:"Shot fired during movement (not while actually shooting at targets)" },
      { code:"10.4.7",  label:"Shot fired at metal target below minimum safe distance" },
      { code:"10.4.9",  label:"[Shotgun] Shot fired using slug ammo on a non-slug course" },
      { code:"10.4.10", label:"[Shotgun] Shot fired using buckshot on a birdshot-only course" },
    ]
  },
  {
    group: "10.5 — Unsafe Gun Handling",
    rules: [
      { code:"10.5.1",  label:"Handling firearm outside Safety Area or without RO supervision" },
      { code:"10.5.2",  label:"Muzzle pointed uprange or past safe angle of fire" },
      { code:"10.5.3",  label:"Dropped or caused firearm to fall during course of fire" },
      { code:"10.5.4",  label:"[Handgun] Drawing or holstering inside a tunnel" },
      { code:"10.5.5",  label:"Muzzle sweeping competitor's own body (during course of fire)" },
      { code:"10.5.6",  label:"Muzzle pointing at another person's body" },
      { code:"10.5.7",  label:"[Handgun] Loaded muzzle pointing rearward past 1 m radius during draw/re-holster" },
      { code:"10.5.8",  label:"Wearing or using more than one firearm during course of fire" },
      { code:"10.5.9",  label:"Finger in trigger guard while clearing malfunction (muzzle off targets)" },
      { code:"10.5.10", label:"Finger in trigger guard during loading, reloading or unloading" },
      { code:"10.5.11", label:"Finger in trigger guard during movement (Rule 8.5.1)" },
      { code:"10.5.12", label:"[Handgun] Loaded and holstered in unsafe/uncocked condition" },
      { code:"10.5.13", label:"Handling live or dummy ammunition in a Safety Area" },
      { code:"10.5.14", label:"Loaded firearm when not specifically authorised by RO" },
      { code:"10.5.15", label:"Competitor retrieved own dropped firearm" },
      { code:"10.5.16", label:"Using prohibited/unsafe ammunition or prohibited firearm" },
    ]
  },
  {
    group: "10.6 — Unsportsmanlike Conduct",
    rules: [
      { code:"10.6.1", label:"Unsportsmanlike conduct (cheating, dishonesty, failure to comply with Match Official, bringing sport into disrepute)" },
      { code:"10.6.2", label:"Intentionally removed/caused loss of eye or ear protection to gain reshoot or advantage" },
    ]
  },
  {
    group: "10.7 — Prohibited Substances",
    rules: [
      { code:"10.7", label:"Under influence of alcohol, non-prescription drugs, illegal or performance-enhancing substances" },
    ]
  },
  {
    group: "Other",
    rules: [
      { code:"10.2.12", label:"Second violation of automatic/burst fire rule" },
      { code:"other",   label:"Other reason (describe in notes)" },
    ]
  },
];

// Default subregions — seeded with IPSC Norway's official subregions.
// Stored in app state and fully manageable by admins at runtime, so any
// other IPSC Region (nation) can replace or extend the list without code changes.
export const DEFAULT_REGIONS = [
  "Nord", "Midt", "Nord-Vest", "Bergen", "Sør-Vest",
  "Sør", "Viken-Vest", "Oslo", "Viken-Øst", "Innlandet",
];

export const DOC_CATEGORIES = ["NROI", "IROA", "IPSC", "Other"];

export const THEMES = {
  dark: {
    bg:          "#080c10",
    surface:     "#0d1117",
    surface2:    "#111418",
    surface3:    "#131922",
    border:      "#1e2530",
    border2:     "#2a3441",
    textPrimary: "#e2e8f0",
    textSecond:  "#94a3b8",
    textMuted:   "#64748b",
    textFaint:   "#475569",
    inpBg:       "#0d1117",
    inpBorder:   "#2a3441",
    inpText:     "#e2e8f0",
    scrollBg:    "#0d1117",
    scrollThumb: "#2a3441",
    backdrop:    "rgba(0,0,0,0.82)",
    selectOption:"#111418",
    shadowLg:    "0 24px 80px rgba(0,0,0,0.85)",
  },
  light: {
    bg:          "#f1f5f9",
    surface:     "#ffffff",
    surface2:    "#f8fafc",
    surface3:    "#f1f5f9",
    border:      "#e2e8f0",
    border2:     "#cbd5e1",
    textPrimary: "#0f172a",
    textSecond:  "#334155",
    textMuted:   "#64748b",
    textFaint:   "#94a3b8",
    inpBg:       "#ffffff",
    inpBorder:   "#cbd5e1",
    inpText:     "#0f172a",
    scrollBg:    "#f1f5f9",
    scrollThumb: "#cbd5e1",
    backdrop:    "rgba(15,23,42,0.55)",
    selectOption:"#ffffff",
    shadowLg:    "0 24px 80px rgba(15,23,42,0.18)",
  }
};
