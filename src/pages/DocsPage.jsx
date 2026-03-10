import React, { useState, useMemo, useEffect, useRef } from "react";
import { certColor, roleColor, statusColor, fmtDate, certRank, canManageMatches, isAdmin, uid, inp, btnS, btnP, btnD, errInp, clubRoleColor, canManageClub, isClubPresident, docCatColor, docTypeColor, fmtFileSize, computeYearlyPoints, meetsLevelOrHigher, checkAnnualMaintenance } from "../lib/helpers";
import { CERT_LEVELS, SYSTEM_ROLES, MATCH_LEVEL_POINTS, SEMINAR_INSTRUCTOR_POINTS, POINT_RULES, IPSC_DISCIPLINES, DQ_REASONS, DEFAULT_REGIONS, DOC_CATEGORIES } from "../lib/constants";
import { Badge, StatCard, Modal, Field, InfoRow, Divider, RegionSelect, UserPicker, useAuth, useTheme } from "../components/ui";

export default function DocsPage({ docs, setDocs }) {
  const { currentUser } = useAuth();
  const admin = isAdmin(currentUser);

  const [search,      setSearch]      = useState("");
  const [catFilter,   setCatFilter]   = useState("All");
  const [sortCol,     setSortCol]     = useState("uploadDate");
  const [sortDir,     setSortDir]     = useState("desc");
  const [showUpload,  setShowUpload]  = useState(false);
  const [pendingFile, setPendingFile] = useState(null);   // { name, ext, size, dataUrl }
  const [uploadForm,  setUploadForm]  = useState({ category:"NROI", description:"" });
  const [uploadFe,    setUploadFe]    = useState({});
  const [dragOver,    setDragOver]    = useState(false);
  const fileInputRef = React.useRef(null);

  // ── Filtering + sorting ──────────────────────────────────────────────────
  const catCounts = React.useMemo(() => {
    const c = { All: docs.length };
    DOC_CATEGORIES.forEach(k => { c[k] = docs.filter(d=>d.category===k).length; });
    return c;
  }, [docs]);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return docs
      .filter(d =>
        (catFilter==="All" || d.category===catFilter) &&
        (d.name.toLowerCase().includes(q) ||
         (d.description||"").toLowerCase().includes(q) ||
         d.uploadedByName.toLowerCase().includes(q))
      )
      .sort((a, b) => {
        let av = a[sortCol]??"", bv = b[sortCol]??"";
        if (sortCol==="fileSize") { av=a.fileSize||0; bv=b.fileSize||0; }
        const cmp = typeof av==="number" ? av-bv : String(av).localeCompare(String(bv));
        return sortDir==="asc" ? cmp : -cmp;
      });
  }, [docs, search, catFilter, sortCol, sortDir]);

  function toggleSort(col) {
    if (sortCol===col) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

  // ── File reading (FileReader → dataUrl) ─────────────────────────────────
  function readFile(file) {
    const ext = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "bin";
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve({ name:file.name, ext, size:file.size, dataUrl:e.target.result });
      reader.readAsDataURL(file);
    });
  }

  async function acceptFile(file) {
    if (!file) return;
    const parsed = await readFile(file);
    setPendingFile(parsed);
    setUploadFe({});
  }

  // ── Upload submit ────────────────────────────────────────────────────────
  function submitUpload() {
    const errs = {};
    if (!pendingFile)          errs.file     = true;
    if (!uploadForm.category)  errs.category = true;
    if (Object.keys(errs).length) { setUploadFe(errs); return; }
    setDocs(prev => [{
      id: "d"+Date.now(),
      name: pendingFile.name,
      category: uploadForm.category,
      description: uploadForm.description.trim(),
      fileType: pendingFile.ext,
      fileSize: pendingFile.size,
      uploadedByName: currentUser.name,
      uploadDate: new Date().toISOString().slice(0,10),
      dataUrl: pendingFile.dataUrl,
    }, ...prev]);
    setPendingFile(null);
    setUploadForm({ category:"NROI", description:"" });
    setUploadFe({});
    setShowUpload(false);
  }

  // ── Download ─────────────────────────────────────────────────────────────
  function downloadDoc(doc) {
    if (!doc.dataUrl) return;
    const a = document.createElement("a");
    a.href = doc.dataUrl;
    a.download = doc.name;
    a.click();
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  function deleteDoc(id) {
    if (!window.confirm("Delete this document? This cannot be undone.")) return;
    setDocs(prev => prev.filter(d=>d.id!==id));
  }

  // ── Drag-and-drop ────────────────────────────────────────────────────────
  function onDrop(e) {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) acceptFile(file);
  }

  // ── Sortable column header ────────────────────────────────────────────────
  function TH({ col, label, width, right }) {
    const active = sortCol===col;
    return (
      <th onClick={()=>toggleSort(col)} style={{
        padding:"10px 14px", textAlign:right?"right":"left", fontSize:11, fontWeight:700,
        color:"var(--text-faint)", textTransform:"uppercase", letterSpacing:"0.07em",
        borderBottom:"1px solid var(--border)", cursor:"pointer", whiteSpace:"nowrap",
        userSelect:"none", width,
      }}>
        {label}
        <span style={{marginLeft:4, fontSize:10, color:active?"#e85d2c":"var(--text-faint)"}}>
          {active ? (sortDir==="asc"?"▲":"▼") : "⇅"}
        </span>
      </th>
    );
  }

  return (
    <div>

      {/* ── Page header ── */}
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24}}>
        <div>
          <h1 style={{margin:"0 0 4px", fontSize:26, fontWeight:800, color:"var(--text-primary)",
            fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"0.04em"}}>Documentation</h1>
          <p style={{margin:0, color:"var(--text-muted)", fontSize:14}}>
            {docs.length} document{docs.length!==1?"s":""} · official rules, handbooks and reference materials
          </p>
        </div>
        {admin && (
          <button style={{...btnP, padding:"10px 18px"}}
            onClick={()=>{ setShowUpload(s=>!s); setPendingFile(null); setUploadFe({}); }}>
            {showUpload ? "✕ Cancel" : "↑ Upload Document"}
          </button>
        )}
      </div>

      {/* ── Upload panel (admin only) ── */}
      {admin && showUpload && (
        <div style={{background:"var(--surface2)", border:"1px solid var(--border)",
          borderRadius:10, padding:"20px 24px", marginBottom:24}}>

          {/* Drop zone / file preview */}
          {!pendingFile ? (
            <div
              onDragOver={e=>{e.preventDefault();setDragOver(true);}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={onDrop}
              onClick={()=>fileInputRef.current?.click()}
              style={{
                border:`2px dashed ${dragOver?"#e85d2c":uploadFe.file?"#f87171":"var(--border2)"}`,
                borderRadius:8, padding:"30px 20px", textAlign:"center", cursor:"pointer",
                background: dragOver?"#e85d2c08":uploadFe.file?"#f8717108":"var(--surface)",
                marginBottom:16, transition:"border-color 0.15s, background 0.15s",
              }}
            >
              <div style={{fontSize:28, marginBottom:6}}>📎</div>
              <div style={{color:"var(--text-primary)", fontWeight:600, fontSize:14, marginBottom:3}}>
                Click to browse or drag &amp; drop a file
              </div>
              <div style={{color:"var(--text-faint)", fontSize:12}}>Any file type — PDF, Word, Excel, images…</div>
              {uploadFe.file && <div style={{color:"#f87171", fontSize:12, marginTop:6}}>Please select a file.</div>}
              <input ref={fileInputRef} type="file" style={{display:"none"}}
                onChange={e=>acceptFile(e.target.files?.[0])} />
            </div>
          ) : (
            <div style={{display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
              background:"var(--surface)", border:"1px solid var(--border)", borderRadius:8, marginBottom:16}}>
              <div style={{
                width:38, height:38, borderRadius:6, flexShrink:0,
                background:docTypeColor(pendingFile.ext)+"22",
                border:`1px solid ${docTypeColor(pendingFile.ext)}55`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:12, fontWeight:800, color:docTypeColor(pendingFile.ext),
                textTransform:"uppercase", fontFamily:"'Barlow Condensed',sans-serif",
              }}>.{pendingFile.ext}</div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{color:"var(--text-primary)", fontWeight:600, fontSize:13,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{pendingFile.name}</div>
                <div style={{color:"var(--text-faint)", fontSize:11, marginTop:1}}>{fmtFileSize(pendingFile.size)}</div>
              </div>
              <button onClick={()=>setPendingFile(null)}
                style={{background:"none",border:"none",color:"var(--text-muted)",cursor:"pointer",fontSize:20,lineHeight:1,padding:"0 4px"}}>×</button>
            </div>
          )}

          {/* Category + description */}
          <div style={{display:"grid", gridTemplateColumns:"150px 1fr", gap:16, marginBottom:16}}>
            <Field label="Category">
              <select style={errInp(uploadFe.category)} value={uploadForm.category}
                onChange={e=>{setUploadForm(f=>({...f,category:e.target.value}));setUploadFe(p=>({...p,category:false}));}}>
                {DOC_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Description" hint="Optional — shown in the document table">
              <input style={inp} value={uploadForm.description}
                onChange={e=>setUploadForm(f=>({...f,description:e.target.value}))}
                placeholder="e.g. Current IPSC rulebook effective January 2026" />
            </Field>
          </div>

          <div style={{display:"flex", gap:10, justifyContent:"flex-end"}}>
            <button style={btnS} onClick={()=>{setShowUpload(false);setPendingFile(null);setUploadFe({});}}>Cancel</button>
            <button style={{...btnP, opacity:pendingFile?1:0.45}} onClick={submitUpload} disabled={!pendingFile}>
              ↑ Upload
            </button>
          </div>
        </div>
      )}

      {/* ── Category filter chips + search ── */}
      <div style={{display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center"}}>
        {["All",...DOC_CATEGORIES].map(cat=>{
          const active = catFilter===cat;
          const color  = cat==="All" ? "#e85d2c" : docCatColor(cat);
          return (
            <button key={cat} onClick={()=>setCatFilter(cat)} style={{
              padding:"5px 14px", borderRadius:20, fontSize:12, fontWeight:600,
              cursor:"pointer", border:`1px solid ${active?color:"var(--border)"}`,
              background: active ? color+"22" : "var(--surface2)",
              color: active ? color : "var(--text-muted)",
              transition:"all 0.12s",
            }}>
              {cat}
              <span style={{opacity:0.7, marginLeft:5}}>({catCounts[cat]||0})</span>
            </button>
          );
        })}
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search documents…"
          style={{...inp, flex:1, minWidth:160, padding:"6px 12px", fontSize:13}} />
      </div>

      {/* ── Document table ── */}
      <div style={{background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, overflow:"hidden"}}>
        {filtered.length===0 ? (
          <div style={{textAlign:"center", padding:"60px 20px", color:"var(--text-faint)", fontSize:14}}>
            {docs.length===0 ? "No documents have been uploaded yet." : "No documents match your search."}
          </div>
        ) : (
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%", borderCollapse:"collapse"}}>
              <thead>
                <tr style={{background:"var(--surface3)"}}>
                  <TH col="category"       label="Category"    width={100} />
                  <TH col="name"           label="File Name"               />
                  <TH col="fileType"       label="Type"        width={72}  />
                  <TH col="description"    label="Description"             />
                  <TH col="fileSize"       label="Size"        width={80} right />
                  <TH col="uploadedByName" label="Uploaded By" width={130} />
                  <TH col="uploadDate"     label="Date"        width={110} />
                  <th style={{width:admin?116:90, borderBottom:"1px solid var(--border)"}} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc, i) => {
                  const rowBg = i%2===0 ? "transparent" : "var(--surface3)";
                  return (
                    <tr key={doc.id}
                      style={{background:rowBg}}
                      onMouseEnter={e=>e.currentTarget.style.background="var(--surface)"}
                      onMouseLeave={e=>e.currentTarget.style.background=rowBg}
                    >
                      {/* Category */}
                      <td style={{padding:"11px 14px", whiteSpace:"nowrap"}}>
                        <Badge label={doc.category} color={docCatColor(doc.category)} />
                      </td>

                      {/* File name */}
                      <td style={{padding:"11px 14px", maxWidth:220}}>
                        <div style={{color:"var(--text-primary)", fontWeight:600, fontSize:13,
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}
                          title={doc.name}>{doc.name}</div>
                      </td>

                      {/* File type badge */}
                      <td style={{padding:"11px 14px"}}>
                        <span style={{
                          display:"inline-block", padding:"2px 7px", borderRadius:5,
                          fontSize:11, fontWeight:800, textTransform:"uppercase",
                          letterSpacing:"0.04em", fontFamily:"'Barlow Condensed',sans-serif",
                          background:docTypeColor(doc.fileType)+"22",
                          color:docTypeColor(doc.fileType),
                          border:`1px solid ${docTypeColor(doc.fileType)}44`,
                        }}>.{doc.fileType||"?"}</span>
                      </td>

                      {/* Description */}
                      <td style={{padding:"11px 14px", maxWidth:260}}>
                        {doc.description
                          ? <div style={{color:"var(--text-second)", fontSize:12,
                              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}
                              title={doc.description}>{doc.description}</div>
                          : <span style={{color:"var(--text-faint)", fontStyle:"italic", fontSize:12}}>—</span>}
                      </td>

                      {/* Size */}
                      <td style={{padding:"11px 14px", textAlign:"right",
                        color:"var(--text-faint)", fontSize:12, whiteSpace:"nowrap"}}>
                        {fmtFileSize(doc.fileSize)}
                      </td>

                      {/* Uploaded by */}
                      <td style={{padding:"11px 14px", color:"var(--text-muted)", fontSize:12, whiteSpace:"nowrap"}}>
                        {doc.uploadedByName}
                      </td>

                      {/* Upload date */}
                      <td style={{padding:"11px 14px", color:"var(--text-faint)", fontSize:12, whiteSpace:"nowrap"}}>
                        {fmtDate(doc.uploadDate)}
                      </td>

                      {/* Actions */}
                      <td style={{padding:"11px 14px"}}>
                        <div style={{display:"flex", gap:6, justifyContent:"flex-end"}}>
                          <button
                            onClick={()=>downloadDoc(doc)}
                            disabled={!doc.dataUrl}
                            style={{...btnS, padding:"5px 11px", fontSize:12,
                              opacity:doc.dataUrl?1:0.4, cursor:doc.dataUrl?"pointer":"default"}}
                          >↓ Download</button>
                          {admin && (
                            <button onClick={()=>deleteDoc(doc.id)}
                              style={{...btnD, padding:"5px 9px", fontSize:12}}
                              title="Delete document">✕</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Row count footer */}
      {filtered.length>0 && filtered.length!==docs.length && (
        <div style={{textAlign:"right", marginTop:8, fontSize:12, color:"var(--text-faint)"}}>
          Showing {filtered.length} of {docs.length} documents
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
