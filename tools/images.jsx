// Images category — QR generator
const { useState, useEffect, useMemo } = React;

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

// ────────────────────────────────────────────────────────────────────────────
window.LIVE_TOOLS = window.LIVE_TOOLS || {};
Object.assign(window.LIVE_TOOLS, {
  "qr-generator": { render: () => <QrTool/> },
});
