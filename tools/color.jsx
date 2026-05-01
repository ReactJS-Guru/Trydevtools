// Color category — picker / converter / contrast
const { useState, useMemo } = React;

// ── color helpers ──────────────────────────────────────────────────────────
function hexToRgb(h) { h = h.replace("#",""); if(h.length===3) h = h.split("").map(c=>c+c).join(""); const n = parseInt(h, 16); return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 }; }
function rgbToHsl(r,g,b) {
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b); let h, s, l=(max+min)/2;
  if (max===min) { h=s=0; }
  else {
    const d=max-min; s = l>0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) { case r: h=(g-b)/d+(g<b?6:0); break; case g: h=(b-r)/d+2; break; case b: h=(r-g)/d+4; break; }
    h/=6;
  }
  return { h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100) };
}
function luminance(r,g,b) { const a=[r,g,b].map(v=>{v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);}); return a[0]*0.2126+a[1]*0.7152+a[2]*0.0722; }
function oklchApprox(r,g,b) { const hsl=rgbToHsl(r,g,b); return `${(hsl.l/100).toFixed(2)} ${(hsl.s/100*0.2).toFixed(2)} ${hsl.h}`; }
function closestTailwind(r,g,b) {
  const TW = {"slate-500":[100,116,139],"gray-500":[107,114,128],"red-500":[239,68,68],"orange-500":[249,115,22],"amber-500":[245,158,11],"yellow-500":[234,179,8],"lime-500":[132,204,22],"green-500":[34,197,94],"emerald-500":[16,185,129],"teal-500":[20,184,166],"cyan-500":[6,182,212],"sky-500":[14,165,233],"blue-500":[59,130,246],"indigo-500":[99,102,241],"violet-500":[139,92,246],"purple-500":[168,85,247],"fuchsia-500":[217,70,239],"pink-500":[236,72,153],"rose-500":[244,63,94]};
  let best="", bestD=1e9;
  for (const [k,[cr,cg,cb]] of Object.entries(TW)) { const d=(cr-r)**2+(cg-g)**2+(cb-b)**2; if(d<bestD){bestD=d;best=k;} }
  return best;
}

// ════════════════════════════════════════════════════════════════════════════
// COLOR PICKER / CONVERTER
// ════════════════════════════════════════════════════════════════════════════
function ColorTool() {
  const [hex, setHex] = useState("#84cc16");
  const { r, g, b } = useMemo(() => hexToRgb(hex), [hex]);
  const hsl = useMemo(() => rgbToHsl(r, g, b), [r, g, b]);
  const oklch = useMemo(() => `oklch(${oklchApprox(r,g,b)})`, [r, g, b]);
  const rows = [
    ["HEX",     hex.toUpperCase()],
    ["RGB",     `rgb(${r}, ${g}, ${b})`],
    ["RGBA",    `rgba(${r}, ${g}, ${b}, 1)`],
    ["HSL",     `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`],
    ["OKLCH",   oklch],
    ["Tailwind",closestTailwind(r,g,b)],
  ];
  return (
    <>
      <div style={{display:"grid", gridTemplateColumns:"240px 1fr", gap:20, marginBottom:14}}>
        <div style={{background: hex, borderRadius:"var(--r-lg)", minHeight:200, display:"flex", alignItems:"flex-end", padding:16, color: luminance(r,g,b) > 0.5 ? "#111" : "#fff", fontFamily:"var(--mono)", fontSize:13, border:"1px solid var(--line)"}}>
          {hex.toUpperCase()}
        </div>
        <div>
          <div className="io-pane-header" style={{border:"1px solid var(--line)", borderRadius:"8px 8px 0 0", borderBottom:0}}>
            <span>pick a color</span>
            <span className="mono" style={{color:"var(--ink-3)"}}>contrast-on-white: {(21/(luminance(r,g,b)*20+1)).toFixed(2)}:1</span>
          </div>
          <div style={{display:"flex", gap:8, padding:16, border:"1px solid var(--line)", borderRadius:"0 0 8px 8px", background:"var(--bg-1)"}}>
            <input type="color" value={hex} onChange={e=>setHex(e.target.value)} style={{width:60, height:60, border:0, background:"transparent", cursor:"pointer"}}/>
            <input value={hex} onChange={e=>setHex(e.target.value)} className="search-box" style={{fontSize:15, padding:"10px 14px"}}/>
          </div>
          <div style={{marginTop:14}}>
            <div className="card" style={{padding:0, overflow:"hidden"}}>
              {rows.map(([k,v],i) => (
                <div key={k} style={{display:"flex", alignItems:"center", padding:"10px 14px", borderBottom: i<rows.length-1?"1px solid var(--line)":0, gap:16, fontFamily:"var(--mono)", fontSize:13}}>
                  <span style={{fontSize:11, color:"var(--ink-3)", width:68}}>{k}</span>
                  <span style={{flex:1, color:"var(--ink)"}}>{v}</span>
                  <button className="btn btn-ghost btn-sm" onClick={()=>navigator.clipboard.writeText(v)}><Icon.Copy/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CONTRAST CHECKER
// ════════════════════════════════════════════════════════════════════════════
function ContrastTool() {
  const [fg, setFg] = useState("#111111");
  const [bg, setBg] = useState("#fafafa");
  const fgRgb = hexToRgb(fg), bgRgb = hexToRgb(bg);
  const ratio = (Math.max(luminance(fgRgb.r,fgRgb.g,fgRgb.b), luminance(bgRgb.r,bgRgb.g,bgRgb.b)) + 0.05)
              / (Math.min(luminance(fgRgb.r,fgRgb.g,fgRgb.b), luminance(bgRgb.r,bgRgb.g,bgRgb.b)) + 0.05);
  const pass = (level, size) => {
    if (size === "normal") return level === "AA" ? ratio >= 4.5 : ratio >= 7;
    return level === "AA" ? ratio >= 3 : ratio >= 4.5;
  };
  return (
    <>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14}}>
        <div className="card" style={{padding:18}}>
          <div className="eyebrow" style={{marginBottom:10}}>foreground</div>
          <div style={{display:"flex", gap:10}}>
            <input type="color" value={fg} onChange={e=>setFg(e.target.value)} style={{width:44, height:44, border:0, background:"transparent", cursor:"pointer"}}/>
            <input value={fg} onChange={e=>setFg(e.target.value)} className="search-box" style={{flex:1, fontSize:14}}/>
          </div>
        </div>
        <div className="card" style={{padding:18}}>
          <div className="eyebrow" style={{marginBottom:10}}>background</div>
          <div style={{display:"flex", gap:10}}>
            <input type="color" value={bg} onChange={e=>setBg(e.target.value)} style={{width:44, height:44, border:0, background:"transparent", cursor:"pointer"}}/>
            <input value={bg} onChange={e=>setBg(e.target.value)} className="search-box" style={{flex:1, fontSize:14}}/>
          </div>
        </div>
      </div>
      <div style={{background: bg, color: fg, padding:"40px", borderRadius:"var(--r-lg)", border:"1px solid var(--line)", marginBottom:14}}>
        <div style={{fontSize:42, fontWeight:600, letterSpacing:"-0.02em", marginBottom:12}}>Large text (24px+)</div>
        <div style={{fontSize:16, lineHeight:1.5, maxWidth:"50ch"}}>Normal body text — this is 16 pixels, regular weight. WCAG requires 4.5:1 for AA, 7:1 for AAA.</div>
      </div>
      <div className="card" style={{padding:"20px 24px", display:"flex", alignItems:"center", gap:32}}>
        <div>
          <div className="mono" style={{fontSize:40, color:"var(--ink)", fontWeight:500}}>{ratio.toFixed(2)}<span style={{fontSize:20, color:"var(--ink-3)"}}>:1</span></div>
          <div className="eyebrow" style={{marginTop:4}}>contrast ratio</div>
        </div>
        <div style={{flex:1, display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8}}>
          {[["AA", "normal"],["AAA", "normal"],["AA", "large"],["AAA", "large"]].map(([lvl, sz]) => {
            const ok = pass(lvl, sz);
            return (
              <div key={lvl+sz} className="card" style={{padding:"10px 14px", background: ok ? "var(--accent-soft)" : "transparent"}}>
                <div className="mono" style={{fontSize:11, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em"}}>{lvl} · {sz}</div>
                <div style={{fontSize:14, fontWeight:500, color: ok ? "var(--accent-hi)" : "var(--ink-3)"}}>{ok ? "✓ pass" : "✗ fail"}</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Register color tools
// ────────────────────────────────────────────────────────────────────────────
window.LIVE_TOOLS = window.LIVE_TOOLS || {};
Object.assign(window.LIVE_TOOLS, {
  "color-picker":      { render: () => <ColorTool/> },
  "color-converter":   { render: () => <ColorTool/> },
  "contrast-checker":  { render: () => <ContrastTool/> },
});
