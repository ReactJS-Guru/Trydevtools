// Images category — 9 tools
const { useState, useEffect, useMemo, useRef } = React;

// Lazy-load qrcode-generator from CDN
function loadQrLib() {
  if (window.qrcode) return Promise.resolve(window.qrcode);
  if (window.__qrLoading) return window.__qrLoading;
  window.__qrLoading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js";
    s.onload = () => resolve(window.qrcode);
    s.onerror = () => reject(new Error("Failed to load QR library"));
    document.head.appendChild(s);
  });
  return window.__qrLoading;
}

// ════════════════════════════════════════════════════════════════════════════
// QR GENERATOR
// ════════════════════════════════════════════════════════════════════════════
function QrTool() {
  const [input, setInput] = useState("https://trydevtools.com");
  const [size, setSize] = useState(280);
  const [ecLevel, setEcLevel] = useState("M");
  const [ready, setReady] = useState(!!window.qrcode);
  const [error, setError] = useState(null);
  useEffect(() => { loadQrLib().then(() => setReady(true)).catch(e => setError(e.message)); }, []);

  const cells = useMemo(() => {
    if (!ready || !input) return null;
    try {
      const qr = window.qrcode(0, ecLevel);
      qr.addData(input); qr.make();
      const N = qr.getModuleCount();
      return Array.from({length:N}, (_, y) => Array.from({length:N}, (_, x) => qr.isDark(y, x) ? 1 : 0));
    } catch (e) { return { error: e.message }; }
  }, [input, ready, ecLevel]);

  const downloadSvg = () => {
    if (!cells || cells.error) return;
    const N = cells.length;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N+8} ${N+8}" width="${size}" height="${size}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/>${cells.map((row,y)=>row.map((c,x)=>c?`<rect x="${x+4}" y="${y+4}" width="1" height="1" fill="#000"/>`:"").join("")).join("")}</svg>`;
    const blob = new Blob([svg], {type:"image/svg+xml"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "qr.svg"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:20}}>
      <div>
        <div className="io-pane" style={{border:"1px solid var(--line)", borderRadius:"var(--r-lg)", background:"var(--bg-1)", minHeight:220}}>
          <div className="io-pane-header"><span>data</span><span style={{color:"var(--ink-3)"}}>{input.length} chars</span></div>
          <div className="io-pane-body"><textarea value={input} onChange={e=>setInput(e.target.value)} spellCheck="false"/></div>
        </div>
        <div style={{marginTop:14, display:"flex", gap:10, alignItems:"center", flexWrap:"wrap"}}>
          <span className="chip" style={{padding:"2px 10px"}}>
            size <input type="range" min="160" max="480" value={size} onChange={e=>setSize(+e.target.value)} style={{width:120, margin:"0 8px"}}/><span className="mono">{size}px</span>
          </span>
          <span className="chip" style={{padding:"2px 4px 2px 10px"}}>
            error correction
            <span className="segmented" style={{border:0, background:"transparent", padding:0, gridTemplateColumns:"repeat(4,1fr)", marginLeft:6}}>
              {["L","M","Q","H"].map(l => <button key={l} className={ecLevel===l?"active":""} onClick={()=>setEcLevel(l)}>{l}</button>)}
            </span>
          </span>
          <button className="btn btn-ghost btn-sm" onClick={downloadSvg} disabled={!cells || cells.error}>Download SVG</button>
        </div>
        {cells && !cells.error && <div style={{marginTop:10, fontSize:12, fontFamily:"var(--mono)", color:"var(--ink-3)"}}>{cells.length}×{cells.length} modules · ECC {ecLevel}</div>}
      </div>
      <div style={{display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r-lg)", padding:24, minHeight:280}}>
        {error ? <div style={{color:"var(--err)", fontSize:13}}>{error}</div>
          : !ready ? <div style={{color:"var(--ink-3)", fontSize:13, fontFamily:"var(--mono)"}}>loading qr library…</div>
          : !cells ? <div style={{color:"var(--ink-3)"}}>(empty)</div>
          : cells.error ? <div style={{color:"var(--err)", fontSize:13, padding:16, textAlign:"center"}}>{cells.error}</div>
          : <svg viewBox={`0 0 ${cells.length+8} ${cells.length+8}`} width={size} height={size} style={{background:"#fff", borderRadius:8, shapeRendering:"crispEdges"}}>
              <rect width="100%" height="100%" fill="#fff"/>
              {cells.map((row, y) => row.map((c, x) => c ? <rect key={`${x}-${y}`} x={x+4} y={y+4} width="1" height="1" fill="#000"/> : null))}
            </svg>}
      </div>
    </div>
  );
}

// ── shared primitives ──────────────────────────────────────────────────────
function CopyBtn({ value, label = "Copy" }) {
  const [ok, setOk] = useState(false);
  return (
    <button className="btn btn-primary btn-sm" onClick={() => {
      navigator.clipboard.writeText(value || "");
      setOk(true); setTimeout(() => setOk(false), 1200);
    }} style={{minWidth: 90}}>
      {ok ? <><Icon.Check/> Copied</> : <><Icon.Copy/> {label}</>}
    </button>
  );
}

function FileDrop({ accept = "image/*", onFile, hint = "drop an image or click to choose" }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const handleFile = (file) => { if (file) onFile(file); };
  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
      style={{
        border: `2px dashed ${dragOver ? "var(--accent)" : "var(--line-strong)"}`,
        borderRadius: "var(--r-lg)",
        padding: "32px 24px", textAlign: "center", cursor: "pointer",
        background: dragOver ? "var(--accent-soft)" : "var(--bg-1)",
        transition: "all 120ms",
        marginBottom: 14,
      }}>
      <input ref={inputRef} type="file" accept={accept} onChange={e => handleFile(e.target.files[0])} style={{display:"none"}}/>
      <div style={{fontSize:14, color: dragOver ? "var(--accent-hi)" : "var(--ink-2)", fontFamily:"var(--mono)"}}>{hint}</div>
    </div>
  );
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024*1024) return `${(n/1024).toFixed(1)} KB`;
  return `${(n/1024/1024).toFixed(2)} MB`;
}
async function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { resolve({ img, url }); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to decode image")); };
    img.src = url;
  });
}

// ════════════════════════════════════════════════════════════════════════════
// IMAGE COMPRESSOR
// ════════════════════════════════════════════════════════════════════════════
function ImageCompressorTool() {
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState("jpeg");
  const [out, setOut] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    setBusy(true);
    (async () => {
      try {
        const { img } = await fileToImage(file);
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        canvas.getContext("2d").drawImage(img, 0, 0);
        const blob = await new Promise(r => canvas.toBlob(r, `image/${format}`, quality/100));
        if (cancelled) return;
        setOut({ blob, url: URL.createObjectURL(blob), w: img.naturalWidth, h: img.naturalHeight });
      } catch (e) { if (!cancelled) setOut({ error: e.message }); }
      finally { if (!cancelled) setBusy(false); }
    })();
    return () => { cancelled = true; };
  }, [file, quality, format]);
  return (
    <>
      <FileDrop onFile={setFile}/>
      {file && (
        <>
          <div style={{display:"flex", gap:14, marginBottom:14, flexWrap:"wrap", alignItems:"center"}}>
            <span className="chip" style={{padding:"2px 4px 2px 10px"}}>
              format
              <span className="segmented" style={{border:0, background:"transparent", padding:0, gridTemplateColumns:"repeat(3,1fr)", marginLeft:6}}>
                {["jpeg","webp","png"].map(f => <button key={f} className={format===f?"active":""} onClick={()=>setFormat(f)}>{f}</button>)}
              </span>
            </span>
            {format !== "png" && (
              <span className="chip" style={{padding:"2px 10px 2px 12px"}}>
                quality <input type="range" min="10" max="100" value={quality} onChange={e=>setQuality(+e.target.value)} style={{width:160, margin:"0 8px"}}/><span className="mono" style={{minWidth:30}}>{quality}%</span>
              </span>
            )}
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>
            <div className="card" style={{padding:14}}>
              <div className="eyebrow" style={{marginBottom:8}}>original · {fmtBytes(file.size)}</div>
              <img src={URL.createObjectURL(file)} style={{width:"100%", borderRadius:"var(--r)", maxHeight:400, objectFit:"contain", background:"var(--bg-2)"}}/>
            </div>
            <div className="card" style={{padding:14}}>
              <div className="eyebrow" style={{marginBottom:8}}>compressed · {out?.blob ? fmtBytes(out.blob.size) : busy ? "processing…" : "—"}{out?.blob && file.size > 0 && <span style={{color: out.blob.size < file.size ? "var(--ok)" : "var(--err)", marginLeft:8}}>{out.blob.size < file.size ? `−${(100 - out.blob.size/file.size*100).toFixed(1)}%` : `+${(out.blob.size/file.size*100 - 100).toFixed(1)}%`}</span>}</div>
              {out?.url ? <img src={out.url} style={{width:"100%", borderRadius:"var(--r)", maxHeight:400, objectFit:"contain", background:"var(--bg-2)"}}/> : <div style={{height:200, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--ink-3)"}}>{out?.error || "…"}</div>}
              {out?.blob && <button className="btn btn-primary btn-sm" onClick={()=>downloadBlob(out.blob, `compressed.${format}`)} style={{marginTop:10, width:"100%"}}>Download</button>}
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// IMAGE RESIZER
// ════════════════════════════════════════════════════════════════════════════
function ImageResizerTool() {
  const [file, setFile] = useState(null);
  const [origW, setOrigW] = useState(0);
  const [origH, setOrigH] = useState(0);
  const [w, setW] = useState(800);
  const [h, setH] = useState(600);
  const [keepAspect, setKeepAspect] = useState(true);
  const [out, setOut] = useState(null);
  useEffect(() => {
    if (!file) return;
    fileToImage(file).then(({ img }) => {
      setOrigW(img.naturalWidth); setOrigH(img.naturalHeight);
      setW(img.naturalWidth); setH(img.naturalHeight);
    });
  }, [file]);
  useEffect(() => {
    if (!file || !w || !h) return;
    let cancelled = false;
    (async () => {
      const { img } = await fileToImage(file);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      const blob = await new Promise(r => canvas.toBlob(r, file.type || "image/png"));
      if (!cancelled) setOut({ blob, url: URL.createObjectURL(blob) });
    })();
    return () => { cancelled = true; };
  }, [file, w, h]);
  const updateW = (v) => { setW(v); if (keepAspect && origW) setH(Math.round(v * origH / origW)); };
  const updateH = (v) => { setH(v); if (keepAspect && origH) setW(Math.round(v * origW / origH)); };
  const setPct = (p) => { setW(Math.round(origW * p / 100)); setH(Math.round(origH * p / 100)); };
  return (
    <>
      <FileDrop onFile={setFile}/>
      {file && (
        <>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:14}}>
            <div className="card" style={{padding:14}}>
              <div className="eyebrow" style={{marginBottom:8}}>width</div>
              <input type="number" value={w} onChange={e=>updateW(+e.target.value)} style={{width:"100%", fontSize:18, padding:"8px 12px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}}/>
              <div style={{fontSize:11, color:"var(--ink-3)", marginTop:4}}>was {origW}px</div>
            </div>
            <div className="card" style={{padding:14}}>
              <div className="eyebrow" style={{marginBottom:8}}>height</div>
              <input type="number" value={h} onChange={e=>updateH(+e.target.value)} style={{width:"100%", fontSize:18, padding:"8px 12px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}}/>
              <div style={{fontSize:11, color:"var(--ink-3)", marginTop:4}}>was {origH}px</div>
            </div>
            <div className="card" style={{padding:14}}>
              <div className="eyebrow" style={{marginBottom:8}}>quick scale</div>
              <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
                {[25, 50, 75, 100, 150, 200].map(p => <button key={p} className="chip" style={{cursor:"pointer", padding:"4px 10px", fontSize:11.5}} onClick={()=>setPct(p)}>{p}%</button>)}
              </div>
              <label className="chip" style={{cursor:"pointer", marginTop:8}}>
                <input type="checkbox" checked={keepAspect} onChange={e=>setKeepAspect(e.target.checked)} style={{margin:0}}/> keep aspect ratio
              </label>
            </div>
          </div>
          {out && (
            <div className="card" style={{padding:14}}>
              <div className="eyebrow" style={{marginBottom:8}}>preview · {w}×{h} · {fmtBytes(out.blob.size)}</div>
              <img src={out.url} style={{maxWidth:"100%", maxHeight:500, display:"block", margin:"0 auto", borderRadius:"var(--r)", background:"var(--bg-2)"}}/>
              <button className="btn btn-primary btn-sm" onClick={()=>downloadBlob(out.blob, `resized-${w}x${h}.png`)} style={{marginTop:14, width:"100%"}}>Download</button>
            </div>
          )}
        </>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// IMAGE → BASE64 (data URI)
// ════════════════════════════════════════════════════════════════════════════
function ImageToBase64Tool() {
  const [file, setFile] = useState(null);
  const [dataUri, setDataUri] = useState("");
  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => setDataUri(e.target.result);
    reader.readAsDataURL(file);
  }, [file]);
  return (
    <>
      <FileDrop onFile={setFile}/>
      {file && dataUri && (
        <>
          <div style={{display:"grid", gridTemplateColumns:"240px 1fr", gap:14, marginBottom:14}}>
            <div className="card" style={{padding:14}}>
              <div className="eyebrow" style={{marginBottom:8}}>preview · {fmtBytes(file.size)}</div>
              <img src={dataUri} style={{width:"100%", borderRadius:"var(--r)", maxHeight:200, objectFit:"contain", background:"var(--bg-2)"}}/>
            </div>
            <div className="card" style={{padding:14}}>
              <div className="eyebrow" style={{marginBottom:8}}>file info</div>
              <div className="mono" style={{fontSize:12.5, color:"var(--ink-2)", lineHeight:1.7}}>
                <div><span style={{color:"var(--ink-3)"}}>name:</span> {file.name}</div>
                <div><span style={{color:"var(--ink-3)"}}>type:</span> {file.type}</div>
                <div><span style={{color:"var(--ink-3)"}}>size:</span> {fmtBytes(file.size)}</div>
                <div><span style={{color:"var(--ink-3)"}}>base64 chars:</span> {dataUri.length.toLocaleString()}</div>
                <div><span style={{color:"var(--ink-3)"}}>overhead:</span> +{((dataUri.length / file.size - 1) * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>
          {[
            ["data URI", dataUri],
            ["HTML <img>", `<img src="${dataUri}" alt=""/>`],
            ["CSS background", `background-image: url("${dataUri}");`],
          ].map(([label, val], i) => (
            <div key={label} className="card" style={{padding:"10px 14px", marginBottom:10, display:"flex", alignItems:"center", gap:14}}>
              <span className="mono" style={{fontSize:11, color:"var(--ink-3)", width:120, textTransform:"uppercase", letterSpacing:".06em"}}>{label}</span>
              <span className="mono" style={{flex:1, fontSize:12, color:"var(--ink)", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis", maxWidth:0}}>{val.slice(0, 200)}{val.length > 200 ? "…" : ""}</span>
              <CopyBtn value={val}/>
            </div>
          ))}
        </>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// WEBP CONVERTER
// ════════════════════════════════════════════════════════════════════════════
function WebpConverterTool() {
  const [file, setFile] = useState(null);
  const [direction, setDirection] = useState("toWebp");
  const [quality, setQuality] = useState(85);
  const [out, setOut] = useState(null);
  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    (async () => {
      try {
        const { img } = await fileToImage(file);
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        canvas.getContext("2d").drawImage(img, 0, 0);
        const fmt = direction === "toWebp" ? "image/webp" : "image/png";
        const blob = await new Promise(r => canvas.toBlob(r, fmt, quality/100));
        if (!cancelled) setOut({ blob, url: URL.createObjectURL(blob) });
      } catch (e) { if (!cancelled) setOut({ error: e.message }); }
    })();
    return () => { cancelled = true; };
  }, [file, direction, quality]);
  return (
    <>
      <FileDrop onFile={setFile} hint="drop a PNG, JPG or WebP image"/>
      {file && (
        <>
          <div style={{display:"flex", gap:14, marginBottom:14, flexWrap:"wrap", alignItems:"center"}}>
            <div className="segmented" style={{width:280}}>
              <button className={direction==="toWebp"?"active":""} onClick={()=>setDirection("toWebp")}>PNG/JPG → WebP</button>
              <button className={direction==="toPng"?"active":""} onClick={()=>setDirection("toPng")}>WebP → PNG</button>
            </div>
            {direction === "toWebp" && (
              <span className="chip" style={{padding:"2px 10px 2px 12px"}}>
                quality <input type="range" min="10" max="100" value={quality} onChange={e=>setQuality(+e.target.value)} style={{width:140, margin:"0 8px"}}/><span className="mono" style={{minWidth:30}}>{quality}%</span>
              </span>
            )}
          </div>
          {out?.url && (
            <div className="card" style={{padding:14}}>
              <div className="eyebrow" style={{marginBottom:8}}>{fmtBytes(file.size)} → {fmtBytes(out.blob.size)} <span style={{color: out.blob.size < file.size ? "var(--ok)" : "var(--err)", marginLeft:8}}>{out.blob.size < file.size ? `−${(100 - out.blob.size/file.size*100).toFixed(1)}%` : `+${(out.blob.size/file.size*100 - 100).toFixed(1)}%`}</span></div>
              <img src={out.url} style={{maxWidth:"100%", maxHeight:400, display:"block", margin:"0 auto", borderRadius:"var(--r)", background:"var(--bg-2)"}}/>
              <button className="btn btn-primary btn-sm" onClick={()=>downloadBlob(out.blob, `converted.${direction === "toWebp" ? "webp" : "png"}`)} style={{marginTop:14, width:"100%"}}>Download</button>
            </div>
          )}
        </>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SVG OPTIMIZER (basic)
// ════════════════════════════════════════════════════════════════════════════
function optimizeSvg(src) {
  let out = src;
  out = out.replace(/<!--[\s\S]*?-->/g, "");
  out = out.replace(/<\?xml[\s\S]*?\?>/g, "");
  out = out.replace(/<!DOCTYPE[\s\S]*?>/g, "");
  out = out.replace(/\s+xmlns:(?!xlink)[a-z]+="[^"]*"/gi, "");
  out = out.replace(/\s+(id|class)="[^"]*"/gi, "");
  out = out.replace(/>\s+</g, "><");
  out = out.replace(/\s{2,}/g, " ");
  out = out.replace(/\s+\/>/g, "/>");
  out = out.replace(/=\s+"/g, '="');
  out = out.replace(/(\d+)\.0+(?=\D)/g, "$1");
  out = out.replace(/(\d*\.\d*?)0+(?=\D)/g, "$1");
  return out.trim();
}
function SvgOptimizerTool() {
  const [input, setInput] = useState(`<?xml version="1.0" encoding="UTF-8"?>
<!-- some comment -->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://example.com" width="100.00" height="100.00" viewBox="0 0 100 100" id="svg1">
    <circle cx="50.00" cy="50.00" r="40.000" fill="red" id="circle1"/>
    <rect x="10" y="10" width="20.0" height="20.0"/>
</svg>`);
  const out = useMemo(() => optimizeSvg(input), [input]);
  const ratio = input.length ? (1 - out.length / input.length) * 100 : 0;
  return (
    <>
      <div className="io-panel">
        <div className="io-pane">
          <div className="io-pane-header"><span>input · SVG</span><span style={{color:"var(--ink-3)"}}>{fmtBytes(input.length)}</span></div>
          <div className="io-pane-body"><textarea value={input} onChange={e=>setInput(e.target.value)} spellCheck="false"/></div>
        </div>
        <div className="io-pane">
          <div className="io-pane-header"><span>output · optimized</span><span style={{color:"var(--ok)"}}>−{ratio.toFixed(1)}%</span></div>
          <div className="io-pane-body"><pre>{out}</pre></div>
        </div>
      </div>
      <div className="tool-status"><span className="status-dot"/><span>{fmtBytes(input.length)} in</span><span>·</span><span>{fmtBytes(out.length)} out</span><span>·</span><span style={{color:"var(--ok)"}}>−{(input.length-out.length).toLocaleString()} bytes saved</span><div style={{flex:1}}/><CopyBtn value={out}/></div>
      <div style={{marginTop:14, display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>
        <div className="card" style={{padding:14}}>
          <div className="eyebrow" style={{marginBottom:8}}>before</div>
          <div style={{height:200, background:"#fff", borderRadius:"var(--r)", display:"flex", alignItems:"center", justifyContent:"center"}} dangerouslySetInnerHTML={{__html: input}}/>
        </div>
        <div className="card" style={{padding:14}}>
          <div className="eyebrow" style={{marginBottom:8}}>after</div>
          <div style={{height:200, background:"#fff", borderRadius:"var(--r)", display:"flex", alignItems:"center", justifyContent:"center"}} dangerouslySetInnerHTML={{__html: out}}/>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FAVICON GENERATOR
// ════════════════════════════════════════════════════════════════════════════
const FAVICON_SIZES = [16, 32, 48, 64, 96, 128, 180, 192, 256, 512];
function FaviconGeneratorTool() {
  const [file, setFile] = useState(null);
  const [variants, setVariants] = useState([]);
  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    (async () => {
      const { img } = await fileToImage(file);
      const out = [];
      for (const size of FAVICON_SIZES) {
        const canvas = document.createElement("canvas");
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, size, size);
        const blob = await new Promise(r => canvas.toBlob(r, "image/png"));
        out.push({ size, blob, url: URL.createObjectURL(blob) });
      }
      if (!cancelled) setVariants(out);
    })();
    return () => { cancelled = true; };
  }, [file]);
  const downloadAll = () => variants.forEach(v => downloadBlob(v.blob, `favicon-${v.size}.png`));
  return (
    <>
      <FileDrop onFile={setFile} hint="drop a square image (best 512×512+)"/>
      {variants.length > 0 && (
        <>
          <div style={{display:"flex", marginBottom:14, gap:10}}>
            <button className="btn btn-primary btn-sm" onClick={downloadAll}>Download all {variants.length} sizes</button>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:10}}>
            {variants.map(v => (
              <div key={v.size} className="card" style={{padding:12, textAlign:"center"}}>
                <img src={v.url} style={{width:Math.min(v.size, 96), height:Math.min(v.size, 96), imageRendering: v.size < 32 ? "pixelated" : "auto", margin:"0 auto", display:"block", background:"var(--bg-2)"}}/>
                <div className="mono" style={{fontSize:11, color:"var(--ink-2)", marginTop:8}}>{v.size}×{v.size}</div>
                <div className="mono" style={{fontSize:10, color:"var(--ink-3)"}}>{fmtBytes(v.blob.size)}</div>
                <button className="btn btn-ghost btn-sm" onClick={()=>downloadBlob(v.blob, `favicon-${v.size}.png`)} style={{marginTop:6, width:"100%", fontSize:11}}>Download</button>
              </div>
            ))}
          </div>
          <div style={{marginTop:14, padding:"12px 16px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r-lg)", fontSize:12, color:"var(--ink-2)", lineHeight:1.7, fontFamily:"var(--mono)"}}>
            <div style={{color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", fontSize:11, marginBottom:6}}>HTML to add</div>
            {`<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">`}<br/>
            {`<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">`}<br/>
            {`<link rel="apple-touch-icon" sizes="180x180" href="/favicon-180.png">`}<br/>
            {`<link rel="manifest" href="/site.webmanifest">`}
          </div>
        </>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// EXIF VIEWER (lazy-load exifr)
// ════════════════════════════════════════════════════════════════════════════
function loadExifr() {
  if (window.exifr) return Promise.resolve(window.exifr);
  if (window.__exifrLoading) return window.__exifrLoading;
  window.__exifrLoading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/exifr@7.1.3/dist/full.umd.js";
    s.onload = () => resolve(window.exifr);
    s.onerror = () => reject(new Error("Failed to load exifr"));
    document.head.appendChild(s);
  });
  return window.__exifrLoading;
}
function ExifViewerTool() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!file) return;
    setError(null); setData(null);
    loadExifr().then(async exifr => {
      try {
        const meta = await exifr.parse(file, true);
        setData(meta || {});
      } catch (e) { setError(e.message); }
    }).catch(e => setError(e.message));
  }, [file]);
  const stripExif = async () => {
    const { img } = await fileToImage(file);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    canvas.getContext("2d").drawImage(img, 0, 0);
    const blob = await new Promise(r => canvas.toBlob(r, "image/jpeg", 0.92));
    downloadBlob(blob, `stripped-${file.name}`);
  };
  return (
    <>
      <FileDrop onFile={setFile} hint="drop a JPG with EXIF data"/>
      {error && <div className="card" style={{padding:14, color:"var(--err)"}}>{error}</div>}
      {file && data && (
        <>
          <div style={{display:"flex", gap:10, marginBottom:14}}>
            <span className="chip accent">{Object.keys(data).length} EXIF fields</span>
            {file.type === "image/jpeg" && Object.keys(data).length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={stripExif}>Download stripped (no EXIF)</button>
            )}
          </div>
          {Object.keys(data).length === 0 ? (
            <div className="card" style={{padding:32, textAlign:"center", color:"var(--ink-3)"}}>No EXIF data found in this image.</div>
          ) : (
            <div className="card" style={{padding:0, overflow:"hidden", maxHeight:600, overflowY:"auto"}}>
              {Object.entries(data).map(([k, v], i, a) => (
                <div key={k} style={{display:"flex", padding:"8px 16px", borderBottom: i < a.length-1 ? "1px solid var(--line)" : "none", gap:14, fontFamily:"var(--mono)", fontSize:12.5}}>
                  <span style={{width:200, color:"var(--accent-hi)"}}>{k}</span>
                  <span style={{flex:1, color:"var(--ink)", wordBreak:"break-all"}}>{v instanceof Date ? v.toISOString() : typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// BARCODE GENERATOR (lazy-load JsBarcode)
// ════════════════════════════════════════════════════════════════════════════
function loadJsBarcode() {
  if (window.JsBarcode) return Promise.resolve(window.JsBarcode);
  if (window.__jsbcLoading) return window.__jsbcLoading;
  window.__jsbcLoading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js";
    s.onload = () => resolve(window.JsBarcode);
    s.onerror = () => reject(new Error("Failed to load JsBarcode"));
    document.head.appendChild(s);
  });
  return window.__jsbcLoading;
}
function BarcodeGeneratorTool() {
  const [text, setText] = useState("12345678");
  const [format, setFormat] = useState("CODE128");
  const [ready, setReady] = useState(!!window.JsBarcode);
  const [error, setError] = useState(null);
  const svgRef = useRef(null);
  useEffect(() => { if (!ready) loadJsBarcode().then(() => setReady(true)).catch(e => setError(e.message)); }, []);
  useEffect(() => {
    if (!ready || !svgRef.current) return;
    try {
      window.JsBarcode(svgRef.current, text, { format, displayValue: true, height: 80, fontSize: 16, background: "#fff", lineColor: "#000", margin: 10 });
      setError(null);
    } catch (e) { setError(e.message); }
  }, [text, format, ready]);
  const downloadSvg = () => {
    if (!svgRef.current) return;
    const xml = new XMLSerializer().serializeToString(svgRef.current);
    downloadBlob(new Blob([xml], { type: "image/svg+xml" }), `barcode-${format}.svg`);
  };
  return (
    <>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14}}>
        <div className="card" style={{padding:14}}>
          <div className="eyebrow" style={{marginBottom:8}}>data</div>
          <input value={text} onChange={e=>setText(e.target.value)} spellCheck="false" style={{width:"100%", fontSize:18, padding:"8px 12px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}}/>
        </div>
        <div className="card" style={{padding:14}}>
          <div className="eyebrow" style={{marginBottom:8}}>format</div>
          <select value={format} onChange={e=>setFormat(e.target.value)} style={{width:"100%", fontSize:13, padding:"8px 12px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", cursor:"pointer", outline:"none"}}>
            {["CODE128","CODE39","EAN13","EAN8","UPC","ITF14","MSI","pharmacode","codabar"].map(f => <option key={f} value={f} style={{background:"var(--bg-2)"}}>{f}</option>)}
          </select>
        </div>
      </div>
      {error && <div className="card" style={{padding:14, color:"var(--err)", marginBottom:14}}>{error}</div>}
      {!ready && !error && <div style={{fontFamily:"var(--mono)", fontSize:12, color:"var(--ink-3)", marginBottom:14}}>loading JsBarcode…</div>}
      <div className="card" style={{padding:"24px", display:"flex", justifyContent:"center", background:"var(--bg-1)"}}>
        <svg ref={svgRef} style={{maxWidth:"100%"}}/>
      </div>
      <div style={{display:"flex", gap:10, marginTop:14}}>
        <button className="btn btn-primary btn-sm" onClick={downloadSvg} disabled={!ready || !!error}>Download SVG</button>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
window.LIVE_TOOLS = window.LIVE_TOOLS || {};
Object.assign(window.LIVE_TOOLS, {
  "qr-generator":        { render: () => <QrTool/> },
  "image-compressor":    { render: () => <ImageCompressorTool/> },
  "image-resizer":       { render: () => <ImageResizerTool/> },
  "image-to-base64":     { render: () => <ImageToBase64Tool/> },
  "webp-converter":      { render: () => <WebpConverterTool/> },
  "svg-optimizer":       { render: () => <SvgOptimizerTool/> },
  "favicon-generator":   { render: () => <FaviconGeneratorTool/> },
  "exif-viewer":         { render: () => <ExifViewerTool/> },
  "barcode-generator":   { render: () => <BarcodeGeneratorTool/> },
});
