// ─────────────────────────────────────────────────────────────────────────────
// SEED DATA
// ─────────────────────────────────────────────────────────────────────────────

export const seedSeminars = [
  {
    id: "s1", name: "IROA Level I — Oslo Spring 2024",
    date: "2024-04-20", location: "Oslomarka Skytterlag", type: "Level I",
    instructor: "u1", status: "completed",
    enrollments: [
      { userId:"u3", attended:true, graduated:true,  diplomaVerified:true,  diplomaDate:"2024-04-20" },
      { userId:"u5", attended:true, graduated:true,  diplomaVerified:true,  diplomaDate:"2024-04-20" },
      { userId:"u2", attended:true, graduated:true,  diplomaVerified:true,  diplomaDate:"2024-04-20" },
    ]
  },
  {
    id: "s2", name: "IROA Level I — Bergen Autumn 2024",
    date: "2024-09-14", location: "Bergen Sportsskyttere", type: "Level I",
    instructor: "u4", status: "completed",
    enrollments: [
      { userId:"u4", attended:true, graduated:true,  diplomaVerified:true,  diplomaDate:"2024-09-14" },
      { userId:"u6", attended:true, graduated:true,  diplomaVerified:true,  diplomaDate:"2024-09-14" },
    ]
  },
  {
    id: "s3", name: "IROA Level I — Viken Winter 2026",
    date: "2026-02-08", location: "Drammen Pistolklubb", type: "Level I",
    instructor: "u1", status: "completed",
    enrollments: []
  },
  {
    id: "s4", name: "IROA Level I — Oslo Summer 2026",
    date: "2026-06-15", location: "Oslomarka Skytterlag", type: "Level I",
    instructor: "u1", status: "upcoming",
    enrollments: []
  },
];

// Per-user seminar graduation snapshots — stored on the user for fast checklist
// access. Format: { seminarId, type, graduated, diplomaVerified, diplomaDate }
export const userSeminarHistory = {
  u1: [],   // Erik is instructor, not student
  u2: [{ seminarId:"s1", type:"Level I", graduated:true, diplomaVerified:true, diplomaDate:"2024-04-20" }],
  u3: [{ seminarId:"s1", type:"Level I", graduated:true, diplomaVerified:true, diplomaDate:"2024-04-20" }],
  u4: [{ seminarId:"s2", type:"Level I", graduated:true, diplomaVerified:true, diplomaDate:"2024-09-14" }],
  u5: [{ seminarId:"s1", type:"Level I", graduated:true, diplomaVerified:true, diplomaDate:"2024-04-20" }],
  u6: [{ seminarId:"s2", type:"Level I", graduated:true, diplomaVerified:true, diplomaDate:"2024-09-14" }],
};

export const seedUsers = [
  {
    id: "u1", name: "Erik Haugen",  email: "erik@example.com",  password: "pass1",
    role: "admin", certification: "RM",  region: "Oslo",    joined: "2021-03-15",
    active: true, points: 28, notes: "Level 3 certified",
    profilePhotoApproved: true, lastROApplication: null,
    iroa: { member: true, since: "2022-01-10" },
    seminarHistory: userSeminarHistory.u1,
    certHistory: [
      { cert: "RO-P", grantedBy: "System",      date: "2021-03-15", note: "Founding member" },
      { cert: "RO",   grantedBy: "System",      date: "2021-06-01", note: "" },
      { cert: "CRO",  grantedBy: "System",      date: "2021-09-01", note: "" },
      { cert: "RM",   grantedBy: "System",      date: "2022-06-10", note: "Passed Level 3 exam" },
    ]
  },
  {
    id: "u2", name: "Marte Lund",   email: "marte@example.com", password: "pass2",
    role: "rm",    certification: "CRO", region: "Bergen",  joined: "2022-07-01",
    active: true, points: 14, notes: "",
    profilePhotoApproved: true, lastROApplication: null,
    iroa: { member: true, since: "2023-05-20" },
    seminarHistory: userSeminarHistory.u2,
    certHistory: [
      { cert: "RO-P", grantedBy: "Erik Haugen", date: "2022-07-01", note: "" },
      { cert: "RO",   grantedBy: "Erik Haugen", date: "2022-11-15", note: "" },
      { cert: "CRO",  grantedBy: "Erik Haugen", date: "2023-03-15", note: "" },
    ]
  },
  {
    id: "u3", name: "Jonas Berg",   email: "jonas@example.com", password: "pass3",
    role: "member", certification: "RO", region: "Oslo",   joined: "2023-02-20",
    active: true, points: 7, notes: "New shooter background",
    profilePhotoApproved: true, lastROApplication: "2025-09-01",
    iroa: { member: false, since: null },
    seminarHistory: userSeminarHistory.u3,
    certHistory: [
      { cert: "RO-P", grantedBy: "Erik Haugen", date: "2023-02-20", note: "Passed intro course" },
      { cert: "RO",   grantedBy: "Erik Haugen", date: "2023-08-10", note: "" },
    ]
  },
  {
    id: "u4", name: "Silje Dahl",   email: "silje@example.com", password: "pass4",
    role: "rm",    certification: "CRO", region: "Nord",   joined: "2020-11-05",
    active: true, points: 22, notes: "",
    profilePhotoApproved: true, lastROApplication: null,
    iroa: { member: false, since: null },
    seminarHistory: userSeminarHistory.u4,
    certHistory: [
      { cert: "RO-P", grantedBy: "System",      date: "2020-11-05", note: "" },
      { cert: "RO",   grantedBy: "System",      date: "2021-02-20", note: "" },
      { cert: "CRO",  grantedBy: "System",      date: "2021-05-20", note: "" },
    ]
  },
  {
    id: "u5", name: "Lars Vik",     email: "lars@example.com",  password: "pass5",
    role: "member", certification: "RO-P", region: "Bergen", joined: "2023-09-10",
    active: true, points: 5, notes: "USPSA background",
    profilePhotoApproved: false, lastROApplication: null,
    iroa: { member: false, since: null },
    seminarHistory: userSeminarHistory.u5,
    certHistory: [
      { cert: "RO-P", grantedBy: "Marte Lund",  date: "2023-09-10", note: "" },
    ]
  },
  {
    id: "u6", name: "Anna Solberg", email: "anna@example.com",  password: "pass6",
    role: "admin", certification: "RM",  region: "Oslo",   joined: "2019-06-22",
    active: false, points: 31, notes: "On leave",
    profilePhotoApproved: true, lastROApplication: null,
    iroa: { member: true, since: "2020-03-01" },
    seminarHistory: userSeminarHistory.u6,
    certHistory: [
      { cert: "RO-P", grantedBy: "System",      date: "2019-06-22", note: "" },
      { cert: "RO",   grantedBy: "System",      date: "2019-10-15", note: "" },
      { cert: "CRO",  grantedBy: "System",      date: "2019-12-01", note: "" },
      { cert: "RM",   grantedBy: "System",      date: "2020-08-15", note: "" },
    ]
  },
  // ── Extra seed users for experimentation ──────────────────────────────────
  {
    id: "u7", name: "Tobias Nygård", email: "tobias@example.com", password: "pass7",
    role: "member", certification: "RO-P", region: "Viken-Øst", joined: "2024-01-15",
    active: true, points: 2, notes: "Just started, keen shooter",
    profilePhotoApproved: false, lastROApplication: null,
    iroa: { member: false, since: null },
    seminarHistory: [],
    certHistory: [
      { cert: "RO-P", grantedBy: "Erik Haugen", date: "2024-01-15", note: "Passed intro module" },
    ]
  },
  {
    id: "u8", name: "Ingrid Hoff", email: "ingrid@example.com", password: "pass8",
    role: "member", certification: "RO", region: "Sør", joined: "2022-04-10",
    active: true, points: 11, notes: "Competes in Rifle and Handgun",
    profilePhotoApproved: true, lastROApplication: "2024-11-20",
    iroa: { member: false, since: null },
    seminarHistory: [{ seminarId:"s1", type:"Level I", graduated:true, diplomaVerified:true, diplomaDate:"2024-04-20" }],
    certHistory: [
      { cert: "RO-P", grantedBy: "Silje Dahl",  date: "2022-04-10", note: "" },
      { cert: "RO",   grantedBy: "Silje Dahl",  date: "2022-10-05", note: "" },
    ]
  },
  {
    id: "u9", name: "Henrik Strand", email: "henrik@example.com", password: "pass9",
    role: "rm", certification: "CRO", region: "Innlandet", joined: "2021-08-22",
    active: true, points: 19, notes: "PCC specialist",
    profilePhotoApproved: true, lastROApplication: null,
    iroa: { member: true, since: "2022-09-01" },
    seminarHistory: [{ seminarId:"s2", type:"Level I", graduated:true, diplomaVerified:true, diplomaDate:"2024-09-14" }],
    certHistory: [
      { cert: "RO-P", grantedBy: "System",      date: "2021-08-22", note: "" },
      { cert: "RO",   grantedBy: "System",      date: "2021-12-15", note: "" },
      { cert: "CRO",  grantedBy: "Erik Haugen", date: "2022-06-01", note: "" },
    ]
  },
  {
    id: "u10", name: "Camilla Ås", email: "camilla@example.com", password: "pass10",
    role: "member", certification: "None", region: "Midt", joined: "2025-03-01",
    active: true, points: 0, notes: "Brand new member — awaiting first seminar",
    profilePhotoApproved: false, lastROApplication: null,
    iroa: { member: false, since: null },
    seminarHistory: [],
    certHistory: []
  },
  {
    id: "u11", name: "Frode Bakken", email: "frode@example.com", password: "pass11",
    role: "member", certification: "RO", region: "Viken-Vest", joined: "2021-05-17",
    active: true, points: 9, notes: "Former military background",
    profilePhotoApproved: true, lastROApplication: null,
    iroa: { member: false, since: null },
    seminarHistory: [],
    certHistory: [
      { cert: "RO-P", grantedBy: "System",      date: "2021-05-17", note: "" },
      { cert: "RO",   grantedBy: "Anna Solberg", date: "2021-11-20", note: "" },
    ]
  },
  {
    id: "u12", name: "Ragnhild Persen", email: "ragnhild@example.com", password: "pass12",
    role: "rm", certification: "CRO", region: "Nord", joined: "2020-06-08",
    active: true, points: 26, notes: "Coordinates Nord district matches",
    profilePhotoApproved: true, lastROApplication: null,
    iroa: { member: true, since: "2021-04-15" },
    seminarHistory: [],
    certHistory: [
      { cert: "RO-P", grantedBy: "System",      date: "2020-06-08", note: "" },
      { cert: "RO",   grantedBy: "System",      date: "2020-09-22", note: "" },
      { cert: "CRO",  grantedBy: "Anna Solberg", date: "2021-02-14", note: "" },
    ]
  },
  {
    id: "u13", name: "Ole Mørk", email: "ole@example.com", password: "pass13",
    role: "member", certification: "RO-P", region: "Sør-Vest", joined: "2023-11-03",
    active: true, points: 4, notes: "Shotgun discipline focus",
    profilePhotoApproved: true, lastROApplication: null,
    iroa: { member: false, since: null },
    seminarHistory: [{ seminarId:"s3", type:"Level I", graduated:true, diplomaVerified:true, diplomaDate:"2026-02-08" }],
    certHistory: [
      { cert: "RO-P", grantedBy: "Marte Lund",  date: "2023-11-03", note: "" },
    ]
  },
  {
    id: "u14", name: "Vibeke Thorsen", email: "vibeke@example.com", password: "pass14",
    role: "member", certification: "RO", region: "Bergen", joined: "2022-09-14",
    active: false, points: 8, notes: "Inactive — moved abroad temporarily",
    profilePhotoApproved: true, lastROApplication: null,
    iroa: { member: false, since: null },
    seminarHistory: [],
    certHistory: [
      { cert: "RO-P", grantedBy: "Marte Lund",  date: "2022-09-14", note: "" },
      { cert: "RO",   grantedBy: "Marte Lund",  date: "2023-02-28", note: "" },
    ]
  },
  {
    id: "u15", name: "Kristoffer Lie", email: "kristoffer@example.com", password: "pass15",
    role: "member", certification: "RO-P", region: "Nord-Vest", joined: "2024-06-20",
    active: true, points: 3, notes: "Mini-Rifle specialist, working towards RO",
    profilePhotoApproved: true, lastROApplication: null,
    iroa: { member: false, since: null },
    seminarHistory: [{ seminarId:"s3", type:"Level I", graduated:true, diplomaVerified:true, diplomaDate:"2026-02-08" }],
    certHistory: [
      { cert: "RO-P", grantedBy: "Henrik Strand", date: "2024-06-20", note: "" },
    ]
  },
  {
    id: "u16", name: "Astrid Kolberg", email: "astrid@example.com", password: "pass16",
    role: "member", certification: "RO", region: "Oslo", joined: "2020-02-11",
    active: true, points: 13, notes: "Long-time competitor, first-time RO",
    profilePhotoApproved: true, lastROApplication: "2025-06-15",
    iroa: { member: false, since: null },
    seminarHistory: [{ seminarId:"s1", type:"Level I", graduated:true, diplomaVerified:true, diplomaDate:"2024-04-20" }],
    certHistory: [
      { cert: "RO-P", grantedBy: "Erik Haugen", date: "2020-02-11", note: "" },
      { cert: "RO",   grantedBy: "Erik Haugen", date: "2020-08-03", note: "" },
    ]
  },
  {
    id: "u17", name: "Petter Elstad", email: "petter@example.com", password: "pass17",
    role: "member", certification: "CRO", region: "Oslo", joined: "2019-10-30",
    active: true, points: 18, notes: "Experienced — eligible for RM application",
    profilePhotoApproved: true, lastROApplication: null,
    iroa: { member: true, since: "2021-07-10" },
    seminarHistory: [{ seminarId:"s2", type:"Level I", graduated:true, diplomaVerified:true, diplomaDate:"2024-09-14" }],
    certHistory: [
      { cert: "RO-P", grantedBy: "System",      date: "2019-10-30", note: "" },
      { cert: "RO",   grantedBy: "System",      date: "2020-03-15", note: "" },
      { cert: "CRO",  grantedBy: "Anna Solberg", date: "2020-09-10", note: "" },
    ]
  },
  {
    id: "u18", name: "Tuva Meland", email: "tuva@example.com", password: "pass18",
    role: "member", certification: "None", region: "Midt", joined: "2025-10-05",
    active: true, points: 0, notes: "Enrolled in upcoming seminar",
    profilePhotoApproved: false, lastROApplication: null,
    iroa: { member: false, since: null },
    seminarHistory: [],
    certHistory: []
  },
];

export const seedMatches = [
  {
    // Small local match — one person is both MD and RM
    id: "m1", name: "Oslo Club Match #12", date: "2025-11-15", region: "Oslo", hostClubId: "c1",
    level: "Level I", stages: 6, status: "completed",
    combinedMDRM: true, md: "u1", rm: "u1",
    assignments: [
      { roId: "u1", role: "MD/RM", stages: [1,2], pointsAwarded: 1 },
      { roId: "u2", role: "CRO",   stages: [3,4], pointsAwarded: 1 },
      { roId: "u3", role: "RO",    stages: [5,6], pointsAwarded: 1 },
    ]
  },
  {
    // Larger regional — separate MD and RM
    id: "m2", name: "Bergen Regional 2025", date: "2025-12-01", region: "Bergen", hostClubId: "c2",
    level: "Level II", stages: 12, status: "completed",
    combinedMDRM: false, md: "u4", rm: "u1",
    assignments: [
      { roId: "u4", role: "MD",  stages: [],    pointsAwarded: 2 },
      { roId: "u1", role: "RM",  stages: [],    pointsAwarded: 2 },
      { roId: "u2", role: "CRO", stages: [1,2], pointsAwarded: 2 },
      { roId: "u5", role: "RO",  stages: [3,4], pointsAwarded: 2 },
      { roId: "u3", role: "RO",  stages: [5,6], pointsAwarded: 2 },
    ]
  },
  {
    id: "m3", name: "Oslo Winter League #1", date: "2026-01-18", region: "Oslo",
    level: "Level I", stages: 6, status: "upcoming",
    combinedMDRM: true, md: "u1", rm: "u1",
    assignments: []
  },
];


// ─────────────────────────────────────────────────────────────────────────────
// CLUBS
// ─────────────────────────────────────────────────────────────────────────────

// Club role tiers (scoped to each club)
export const CLUB_ROLES = ["member", "secretary", "president"];

// Color helper for club roles
function clubRoleColor(r) {
  return { president:"#f97316", secretary:"#facc15", member:"#60a5fa" }[r] || "#9ca3af";
}

// Can this user manage a specific club? (secretary/president OR system admin)
function canManageClub(currentUser, club) {
  if (!currentUser || !club) return false;
  if (currentUser.role === "admin") return true;
  const m = (club.members||[]).find(m=>m.userId===currentUser.id&&m.status==="active");
  return m && (m.role==="secretary"||m.role==="president");
}
function isClubPresident(currentUser, club) {
  if (!currentUser || !club) return false;
  if (currentUser.role === "admin") return true;
  const m = (club.members||[]).find(m=>m.userId===currentUser.id&&m.status==="active");
  return m && m.role==="president";
}

export const seedClubs = [
  {
    id: "c1",
    name: "Oslomarka Skytterlag",
    shortName: "OSL",
    region: "Oslo",
    website: "https://oslomarka.no",
    contactEmail: "post@oslomarka.no",
    founded: "2001-03-10",
    active: true,
    description: "One of the largest IPSC clubs in Oslo, running weekly club matches and hosting regional competitions.",
    members: [
      { userId:"u1", role:"president", since:"2021-03-15", status:"active" },
      { userId:"u3", role:"member",    since:"2023-02-20", status:"active" },
      { userId:"u6", role:"secretary", since:"2019-06-22", status:"active" },
      { userId:"u7", role:"member",    since:"2023-10-05", status:"active" },
      { userId:"u16",role:"member",    since:"2024-01-12", status:"active" },
    ]
  },
  {
    id: "c2",
    name: "Bergen Sportsskyttere",
    shortName: "BSS",
    region: "Bergen",
    website: "",
    contactEmail: "bergen.ipsc@example.com",
    founded: "2005-09-01",
    active: true,
    description: "IPSC club based in Bergen, running monthly practical shooting competitions.",
    members: [
      { userId:"u2", role:"president", since:"2022-07-01", status:"active" },
      { userId:"u5", role:"member",    since:"2023-09-10", status:"active" },
      { userId:"u14",role:"secretary", since:"2022-11-01", status:"active" },
    ]
  },
  {
    id: "c3",
    name: "Drammen Pistolklubb",
    shortName: "DPK",
    region: "Viken-Vest",
    website: "",
    contactEmail: "dpk@example.com",
    founded: "2010-04-22",
    active: true,
    description: "Active club in the Drammen area hosting Level I matches and training days.",
    members: [
      { userId:"u9",  role:"president", since:"2020-01-10", status:"active" },
      { userId:"u11", role:"secretary", since:"2021-05-14", status:"active" },
    ]
  },
  {
    id: "c4",
    name: "Trondheim IPSC",
    shortName: "TIPSC",
    region: "Midt",
    website: "",
    contactEmail: "trondheim.ipsc@example.com",
    founded: "2008-11-15",
    active: true,
    description: "The main IPSC club in the Trondheim area.",
    members: [
      { userId:"u10", role:"member", since:"2024-03-01", status:"active" },
      { userId:"u18", role:"member", since:"2025-01-05", status:"active" },
    ]
  },
];

// Seed documents — stored as plain-text blobs so download works without a server
export const seedDocs = (() => {
  function make(id, name, category, description, ext, uploadedByName, date, body) {
    return { id, name, category, description, fileType:ext,
             fileSize: body.length, uploadedByName, uploadDate: date,
             dataUrl: "data:text/plain;charset=utf-8," + encodeURIComponent(body) };
  }
  return [
    make("d1","NROI RO Handbook 2024.pdf","NROI",
      "Official NROI handbook covering RO duties, procedures and match etiquette.",
      "pdf","Erik Haugen","2024-01-15",
      "NROI Range Officer Handbook\n\n1. INTRODUCTION\nRange Officers are essential to safe and fair competition.\n\n2. DUTIES\n- Safety oversight at all times\n- Stage preparation and reset\n- Competitor briefings before each run\n- Scoring assistance\n\n3. PROCEDURES\nAll ROs must follow the current IPSC rulebook and NROI guidelines at all times.\n\nVersion 2024.1"),
    make("d2","IROA Level I Curriculum.pdf","IROA",
      "Curriculum and learning objectives for IROA Level I seminars.",
      "pdf","Erik Haugen","2024-02-20",
      "IROA Level I Seminar Curriculum\n\nLearning Objectives:\n1. IPSC safety rules\n2. Stage setup and reset\n3. Competitor briefing techniques\n4. Score verification\n5. DQ procedures\n\nDuration: 1 day (8 hours)\nExam: Written + practical assessment"),
    make("d3","IPSC Combined Competition Rules Jan 2026.pdf","IPSC",
      "Full IPSC Combined Competition Rules, effective January 2026.",
      "pdf","Erik Haugen","2026-01-05",
      "IPSC Combined Competition Rules — January 2026\n\nChapter 1  Competitor Requirements\nChapter 2  Course Design\nChapter 3  Scoring\nChapter 4  Range Commands\nChapter 5  Penalties\nChapter 6  Targets\nChapter 7  Equipment\nChapter 8  Malfunctions\nChapter 9  Appeals\nChapter 10 Disqualifications\n\n© IPSC 2026"),
    make("d4","NROI Match Director Checklist.docx","NROI",
      "Pre-match and day-of checklist for Match Directors running NROI-sanctioned competitions.",
      "docx","Anna Solberg","2025-03-10",
      "NROI Match Director Checklist\n\nPRE-MATCH (1 week before)\n[ ] Confirm range booking\n[ ] Submit match to NROI calendar\n[ ] Assign RO staff\n[ ] Order targets and supplies\n\nDAY BEFORE\n[ ] Brief all ROs\n[ ] Set up stages\n[ ] Test timing equipment\n\nMATCH DAY\n[ ] Safety briefing\n[ ] Open registration\n\nPOST-MATCH\n[ ] Submit results to NROI\n[ ] File incident reports if any"),
    make("d5","IPSC Handgun Equipment Rules 2025.pdf","IPSC",
      "Equipment specifications and legal requirements for the IPSC Handgun division.",
      "pdf","Erik Haugen","2025-06-01",
      "IPSC Handgun Division Equipment Rules 2025\n\nOpen: No restrictions, min 9mm, PF 160 Major\nStandard: No optics, 15+1 max, PF 125 Minor\nProduction: Factory guns, 10+1 max, PF 125 Minor\nProduction Optics: As Production with optic sight\nClassic: 1911-style, 8+1 max\nRevolver: Double-action revolvers, 6 rounds\n\nSee full rules at ipsc.org"),
    make("d6","NROI Contacts 2026.xlsx","NROI",
      "Contact information for NROI board members and regional representatives.",
      "xlsx","Anna Solberg","2026-01-20",
      "NROI Contact List 2026\n\nNational Board\nPresident        [on file]\nVice President   [on file]\nSecretary        [on file]\n\nRegional Representatives\nOslo             [on file]\nBergen           [on file]\nNord             [on file]\nMidt             [on file]\nSør              [on file]"),
  ];
})();
