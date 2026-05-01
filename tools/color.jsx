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
            <input value={hex} onChange={e=>setHex(e.target.value)} style={{flex:1, fontSize:15, padding:"10px 14px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}}/>
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
            <input value={fg} onChange={e=>setFg(e.target.value)} style={{flex:1, fontSize:14, padding:"8px 12px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}}/>
          </div>
        </div>
        <div className="card" style={{padding:18}}>
          <div className="eyebrow" style={{marginBottom:10}}>background</div>
          <div style={{display:"flex", gap:10}}>
            <input type="color" value={bg} onChange={e=>setBg(e.target.value)} style={{width:44, height:44, border:0, background:"transparent", cursor:"pointer"}}/>
            <input value={bg} onChange={e=>setBg(e.target.value)} style={{flex:1, fontSize:14, padding:"8px 12px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}}/>
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

// ── color-space helpers used below ─────────────────────────────────────────
function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h/30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(255 * f(0)), g: Math.round(255 * f(8)), b: Math.round(255 * f(4)) };
}
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")).join("");
}
function rotateHue(hex, deg) {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const nh = (h + deg + 360) % 360;
  const out = hslToRgb(nh, s, l);
  return rgbToHex(out.r, out.g, out.b);
}
function adjustLight(hex, deltaL) {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const nl = Math.max(0, Math.min(100, l + deltaL));
  const out = hslToRgb(h, s, nl);
  return rgbToHex(out.r, out.g, out.b);
}

// ════════════════════════════════════════════════════════════════════════════
// PALETTE GENERATOR
// ════════════════════════════════════════════════════════════════════════════
const HARMONIES = {
  "complementary":      [0, 180],
  "analogous":          [-30, 0, 30],
  "triadic":            [0, 120, 240],
  "tetradic":           [0, 90, 180, 270],
  "split-complementary":[0, 150, 210],
  "monochromatic":      "mono",
};
function PaletteGeneratorTool() {
  const [base, setBase] = useState("#6366f1");
  const [harmony, setHarmony] = useState("complementary");
  const colors = useMemo(() => {
    const h = HARMONIES[harmony];
    if (h === "mono") {
      return [-30, -15, 0, 15, 30].map(d => adjustLight(base, d));
    }
    return h.map(deg => rotateHue(base, deg));
  }, [base, harmony]);
  return (
    <>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14}}>
        <div className="card" style={{padding:18}}>
          <div className="eyebrow" style={{marginBottom:10}}>base color</div>
          <div style={{display:"flex", gap:10}}>
            <input type="color" value={base} onChange={e=>setBase(e.target.value)} style={{width:60, height:60, border:0, background:"transparent", cursor:"pointer"}}/>
            <input value={base} onChange={e=>setBase(e.target.value)} style={{flex:1, fontSize:16, padding:"10px 14px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}}/>
          </div>
        </div>
        <div className="card" style={{padding:18}}>
          <div className="eyebrow" style={{marginBottom:10}}>harmony</div>
          <select value={harmony} onChange={e=>setHarmony(e.target.value)} style={{width:"100%", padding:"10px 14px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", fontSize:14, cursor:"pointer", outline:"none"}}>
            {Object.keys(HARMONIES).map(k => <option key={k} value={k} style={{background:"var(--bg-2)"}}>{k}</option>)}
          </select>
        </div>
      </div>
      <div style={{display:"grid", gridTemplateColumns:`repeat(${colors.length}, 1fr)`, gap:10, marginBottom:14}}>
        {colors.map((c, i) => {
          const { r, g, b } = hexToRgb(c);
          const lum = luminance(r, g, b);
          return (
            <div key={i} style={{borderRadius:"var(--r-lg)", overflow:"hidden", border:"1px solid var(--line)"}}>
              <div onClick={()=>navigator.clipboard.writeText(c.toUpperCase())} style={{background:c, height:120, cursor:"pointer", display:"flex", alignItems:"flex-end", padding:12, color: lum > 0.5 ? "#111" : "#fff", fontFamily:"var(--mono)", fontSize:13, fontWeight:600}}>
                {c.toUpperCase()}
              </div>
              <div style={{padding:"10px 12px", fontFamily:"var(--mono)", fontSize:11, color:"var(--ink-2)", background:"var(--bg-1)"}}>
                rgb({r}, {g}, {b})
              </div>
            </div>
          );
        })}
      </div>
      <div style={{padding:"12px 16px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r-lg)", display:"flex", alignItems:"center", gap:14}}>
        <span style={{fontSize:12, color:"var(--ink-3)", fontFamily:"var(--mono)"}}>copy as CSS</span>
        <code style={{flex:1, fontSize:12, color:"var(--ink)", fontFamily:"var(--mono)", wordBreak:"break-all"}}>{colors.map((c, i) => `--c-${i+1}: ${c};`).join(" ")}</code>
        <button className="btn btn-ghost btn-sm" onClick={()=>navigator.clipboard.writeText(colors.map((c, i) => `--c-${i+1}: ${c};`).join("\n"))}><Icon.Copy/></button>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// GRADIENT GENERATOR
// ════════════════════════════════════════════════════════════════════════════
function GradientGeneratorTool() {
  const [stops, setStops] = useState([
    { color: "#6366f1", pos: 0 },
    { color: "#ec4899", pos: 100 },
  ]);
  const [type, setType] = useState("linear");
  const [angle, setAngle] = useState(135);
  const [shape, setShape] = useState("circle");
  const css = useMemo(() => {
    const stopsStr = stops.map(s => `${s.color} ${s.pos}%`).join(", ");
    if (type === "linear") return `linear-gradient(${angle}deg, ${stopsStr})`;
    if (type === "radial") return `radial-gradient(${shape}, ${stopsStr})`;
    return `conic-gradient(from ${angle}deg, ${stopsStr})`;
  }, [stops, type, angle, shape]);
  const updateStop = (i, key, val) => setStops(prev => prev.map((s, j) => j === i ? { ...s, [key]: key === "pos" ? +val : val } : s));
  const addStop = () => setStops(prev => [...prev, { color: "#ffffff", pos: 50 }].sort((a, b) => a.pos - b.pos));
  const removeStop = (i) => setStops(prev => prev.length > 2 ? prev.filter((_, j) => j !== i) : prev);
  return (
    <>
      <div style={{height:200, borderRadius:"var(--r-lg)", border:"1px solid var(--line)", background:css, marginBottom:14}}/>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14}}>
        <div className="card" style={{padding:18}}>
          <div className="eyebrow" style={{marginBottom:10}}>type</div>
          <div className="segmented" style={{width:"100%"}}>
            {["linear","radial","conic"].map(t => <button key={t} className={type===t?"active":""} onClick={()=>setType(t)}>{t}</button>)}
          </div>
        </div>
        <div className="card" style={{padding:18}}>
          {(type === "linear" || type === "conic") ? (
            <>
              <div className="eyebrow" style={{marginBottom:10}}>angle · {angle}°</div>
              <input type="range" min="0" max="360" value={angle} onChange={e=>setAngle(+e.target.value)} style={{width:"100%"}}/>
            </>
          ) : (
            <>
              <div className="eyebrow" style={{marginBottom:10}}>shape</div>
              <div className="segmented" style={{width:"100%"}}>
                {["circle","ellipse"].map(s => <button key={s} className={shape===s?"active":""} onClick={()=>setShape(s)}>{s}</button>)}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="card" style={{padding:0, overflow:"hidden", marginBottom:14}}>
        {stops.map((s, i) => (
          <div key={i} style={{display:"flex", alignItems:"center", padding:"10px 14px", borderBottom: i < stops.length-1 ? "1px solid var(--line)" : "none", gap:12}}>
            <input type="color" value={s.color} onChange={e=>updateStop(i, "color", e.target.value)} style={{width:36, height:36, border:0, background:"transparent", cursor:"pointer"}}/>
            <input value={s.color} onChange={e=>updateStop(i, "color", e.target.value)} style={{width:100, padding:"6px 10px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", fontSize:12.5, outline:"none"}}/>
            <input type="range" min="0" max="100" value={s.pos} onChange={e=>updateStop(i, "pos", e.target.value)} style={{flex:1}}/>
            <span className="mono" style={{width:50, fontSize:13, color:"var(--ink-2)"}}>{s.pos}%</span>
            <button className="btn btn-ghost btn-sm" onClick={()=>removeStop(i)} disabled={stops.length <= 2}><Icon.Trash/></button>
          </div>
        ))}
      </div>
      <div style={{display:"flex", gap:10, marginBottom:14}}>
        <button className="btn btn-ghost btn-sm" onClick={addStop}>+ Add stop</button>
        <div style={{flex:1}}/>
        <CopyBtn value={`background: ${css};`} label="Copy CSS"/>
      </div>
      <div style={{padding:"12px 16px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r-lg)"}}>
        <code style={{fontSize:12.5, color:"var(--ink)", fontFamily:"var(--mono)", wordBreak:"break-all"}}>background: {css};</code>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COLOR BLINDNESS SIMULATION
// ════════════════════════════════════════════════════════════════════════════
const CB_MATRICES = {
  "Protanopia (no red)":         [[0.567,0.433,0],[0.558,0.442,0],[0,0.242,0.758]],
  "Protanomaly (weak red)":      [[0.817,0.183,0],[0.333,0.667,0],[0,0.125,0.875]],
  "Deuteranopia (no green)":     [[0.625,0.375,0],[0.7,0.3,0],[0,0.3,0.7]],
  "Deuteranomaly (weak green)":  [[0.8,0.2,0],[0.258,0.742,0],[0,0.142,0.858]],
  "Tritanopia (no blue)":        [[0.95,0.05,0],[0,0.433,0.567],[0,0.475,0.525]],
  "Tritanomaly (weak blue)":     [[0.967,0.033,0],[0,0.733,0.267],[0,0.183,0.817]],
  "Achromatopsia (no color)":    [[0.299,0.587,0.114],[0.299,0.587,0.114],[0.299,0.587,0.114]],
  "Achromatomaly (weak color)":  [[0.618,0.320,0.062],[0.163,0.775,0.062],[0.163,0.320,0.516]],
};
function applyMatrix(hex, m) {
  const { r, g, b } = hexToRgb(hex);
  const nr = Math.round(m[0][0]*r + m[0][1]*g + m[0][2]*b);
  const ng = Math.round(m[1][0]*r + m[1][1]*g + m[1][2]*b);
  const nb = Math.round(m[2][0]*r + m[2][1]*g + m[2][2]*b);
  return rgbToHex(nr, ng, nb);
}
function ColorBlindnessTool() {
  const [colors, setColors] = useState(["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"]);
  const updateColor = (i, v) => setColors(prev => prev.map((c, j) => j === i ? v : c));
  return (
    <>
      <div className="card" style={{padding:18, marginBottom:14}}>
        <div className="eyebrow" style={{marginBottom:10}}>colors to test (5 slots)</div>
        <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
          {colors.map((c, i) => (
            <div key={i} style={{display:"flex", gap:6, alignItems:"center"}}>
              <input type="color" value={c} onChange={e=>updateColor(i, e.target.value)} style={{width:36, height:36, border:0, background:"transparent", cursor:"pointer"}}/>
              <input value={c} onChange={e=>updateColor(i, e.target.value)} style={{width:90, padding:"6px 8px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", fontSize:12, outline:"none"}}/>
            </div>
          ))}
        </div>
      </div>
      <div className="eyebrow" style={{marginBottom:10}}>simulated under 8 color-vision deficiencies</div>
      <div className="card" style={{padding:0, overflow:"hidden"}}>
        <div style={{display:"flex", padding:"12px 16px", borderBottom:"1px solid var(--line)", gap:6, background:"var(--bg-2)"}}>
          <span className="mono" style={{flex:1, fontSize:11, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em"}}>Original (your view)</span>
          <div style={{display:"flex", gap:4}}>
            {colors.map((c, i) => <div key={i} style={{width:42, height:24, borderRadius:4, background: c}}/>)}
          </div>
        </div>
        {Object.entries(CB_MATRICES).map(([name, m], i, arr) => (
          <div key={name} style={{display:"flex", padding:"12px 16px", borderBottom: i < arr.length-1 ? "1px solid var(--line)" : "none", gap:6, alignItems:"center"}}>
            <span className="mono" style={{flex:1, fontSize:12, color:"var(--ink-2)"}}>{name}</span>
            <div style={{display:"flex", gap:4}}>
              {colors.map(c => applyMatrix(c, m)).map((c, i) => <div key={i} style={{width:42, height:24, borderRadius:4, background: c}}/>)}
            </div>
          </div>
        ))}
      </div>
      <div style={{marginTop:14, padding:"12px 16px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r-lg)", fontSize:12.5, color:"var(--ink-2)", lineHeight:1.6}}>
        <span style={{color:"var(--ink-3)", fontFamily:"var(--mono)", fontSize:11, textTransform:"uppercase", letterSpacing:".06em"}}>note · </span>
        About 1 in 12 men and 1 in 200 women have some form of color-vision deficiency. Pairs of swatches that look identical in any row signal a contrast problem in your design.
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAILWIND COLOR FINDER (full v3 palette)
// ════════════════════════════════════════════════════════════════════════════
const TW_PALETTE = {
  slate:   ["#f8fafc","#f1f5f9","#e2e8f0","#cbd5e1","#94a3b8","#64748b","#475569","#334155","#1e293b","#0f172a","#020617"],
  gray:    ["#f9fafb","#f3f4f6","#e5e7eb","#d1d5db","#9ca3af","#6b7280","#4b5563","#374151","#1f2937","#111827","#030712"],
  zinc:    ["#fafafa","#f4f4f5","#e4e4e7","#d4d4d8","#a1a1aa","#71717a","#52525b","#3f3f46","#27272a","#18181b","#09090b"],
  neutral: ["#fafafa","#f5f5f5","#e5e5e5","#d4d4d4","#a3a3a3","#737373","#525252","#404040","#262626","#171717","#0a0a0a"],
  stone:   ["#fafaf9","#f5f5f4","#e7e5e4","#d6d3d1","#a8a29e","#78716c","#57534e","#44403c","#292524","#1c1917","#0c0a09"],
  red:     ["#fef2f2","#fee2e2","#fecaca","#fca5a5","#f87171","#ef4444","#dc2626","#b91c1c","#991b1b","#7f1d1d","#450a0a"],
  orange:  ["#fff7ed","#ffedd5","#fed7aa","#fdba74","#fb923c","#f97316","#ea580c","#c2410c","#9a3412","#7c2d12","#431407"],
  amber:   ["#fffbeb","#fef3c7","#fde68a","#fcd34d","#fbbf24","#f59e0b","#d97706","#b45309","#92400e","#78350f","#451a03"],
  yellow:  ["#fefce8","#fef9c3","#fef08a","#fde047","#facc15","#eab308","#ca8a04","#a16207","#854d0e","#713f12","#422006"],
  lime:    ["#f7fee7","#ecfccb","#d9f99d","#bef264","#a3e635","#84cc16","#65a30d","#4d7c0f","#3f6212","#365314","#1a2e05"],
  green:   ["#f0fdf4","#dcfce7","#bbf7d0","#86efac","#4ade80","#22c55e","#16a34a","#15803d","#166534","#14532d","#052e16"],
  emerald: ["#ecfdf5","#d1fae5","#a7f3d0","#6ee7b7","#34d399","#10b981","#059669","#047857","#065f46","#064e3b","#022c22"],
  teal:    ["#f0fdfa","#ccfbf1","#99f6e4","#5eead4","#2dd4bf","#14b8a6","#0d9488","#0f766e","#115e59","#134e4a","#042f2e"],
  cyan:    ["#ecfeff","#cffafe","#a5f3fc","#67e8f9","#22d3ee","#06b6d4","#0891b2","#0e7490","#155e75","#164e63","#083344"],
  sky:     ["#f0f9ff","#e0f2fe","#bae6fd","#7dd3fc","#38bdf8","#0ea5e9","#0284c7","#0369a1","#075985","#0c4a6e","#082f49"],
  blue:    ["#eff6ff","#dbeafe","#bfdbfe","#93c5fd","#60a5fa","#3b82f6","#2563eb","#1d4ed8","#1e40af","#1e3a8a","#172554"],
  indigo:  ["#eef2ff","#e0e7ff","#c7d2fe","#a5b4fc","#818cf8","#6366f1","#4f46e5","#4338ca","#3730a3","#312e81","#1e1b4b"],
  violet:  ["#f5f3ff","#ede9fe","#ddd6fe","#c4b5fd","#a78bfa","#8b5cf6","#7c3aed","#6d28d9","#5b21b6","#4c1d95","#2e1065"],
  purple:  ["#faf5ff","#f3e8ff","#e9d5ff","#d8b4fe","#c084fc","#a855f7","#9333ea","#7e22ce","#6b21a8","#581c87","#3b0764"],
  fuchsia: ["#fdf4ff","#fae8ff","#f5d0fe","#f0abfc","#e879f9","#d946ef","#c026d3","#a21caf","#86198f","#701a75","#4a044e"],
  pink:    ["#fdf2f8","#fce7f3","#fbcfe8","#f9a8d4","#f472b6","#ec4899","#db2777","#be185d","#9d174d","#831843","#500724"],
  rose:    ["#fff1f2","#ffe4e6","#fecdd3","#fda4af","#fb7185","#f43f5e","#e11d48","#be123c","#9f1239","#881337","#4c0519"],
};
const TW_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
function colorDist(a, b) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return Math.sqrt((A.r-B.r)**2 + (A.g-B.g)**2 + (A.b-B.b)**2);
}
function TailwindColorFinderTool() {
  const [input, setInput] = useState("#84cc16");
  const matches = useMemo(() => {
    const all = [];
    for (const [name, shades] of Object.entries(TW_PALETTE)) {
      shades.forEach((hex, i) => all.push({ name: `${name}-${TW_SHADES[i]}`, hex, dist: colorDist(input, hex) }));
    }
    return all.sort((a, b) => a.dist - b.dist).slice(0, 12);
  }, [input]);
  return (
    <>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14}}>
        <div className="card" style={{padding:18}}>
          <div className="eyebrow" style={{marginBottom:10}}>your color</div>
          <div style={{display:"flex", gap:10}}>
            <input type="color" value={input} onChange={e=>setInput(e.target.value)} style={{width:60, height:60, border:0, background:"transparent", cursor:"pointer"}}/>
            <input value={input} onChange={e=>setInput(e.target.value)} style={{flex:1, fontSize:18, padding:"10px 14px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}}/>
          </div>
        </div>
        <div className="card" style={{padding:18, display:"flex", alignItems:"center", justifyContent:"center"}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:22, fontFamily:"var(--mono)", fontWeight:600, color:"var(--accent-hi)"}}>{matches[0]?.name}</div>
            <div style={{fontSize:12, color:"var(--ink-3)", fontFamily:"var(--mono)", marginTop:4}}>closest match · Δ {matches[0]?.dist.toFixed(1)}</div>
          </div>
        </div>
      </div>
      <div className="eyebrow" style={{marginBottom:10}}>top 12 closest Tailwind colors</div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:8}}>
        {matches.map((m, i) => (
          <button key={m.name} onClick={()=>navigator.clipboard.writeText(m.name)} className="card" style={{padding:"10px 12px", display:"flex", alignItems:"center", gap:10, cursor:"pointer", textAlign:"left", background:"var(--bg-1)"}}>
            <div style={{width:40, height:40, borderRadius:"var(--r)", background: m.hex, flexShrink:0, border:"1px solid var(--line)"}}/>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontFamily:"var(--mono)", fontSize:13, color:"var(--ink)", fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{m.name}</div>
              <div style={{fontFamily:"var(--mono)", fontSize:11, color:"var(--ink-3)"}}>{m.hex.toUpperCase()} · Δ {m.dist.toFixed(1)}</div>
            </div>
            {i === 0 && <span style={{fontSize:14, color:"var(--ok)"}}>★</span>}
          </button>
        ))}
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Register color tools
// ────────────────────────────────────────────────────────────────────────────
window.LIVE_TOOLS = window.LIVE_TOOLS || {};
Object.assign(window.LIVE_TOOLS, {
  "color-picker":           { render: () => <ColorTool/> },
  "color-converter":        { render: () => <ColorTool/> },
  "contrast-checker":       { render: () => <ContrastTool/> },
  "palette-generator":      { render: () => <PaletteGeneratorTool/> },
  "gradient-generator":     { render: () => <GradientGeneratorTool/> },
  "color-blindness":        { render: () => <ColorBlindnessTool/> },
  "tailwind-color-finder":  { render: () => <TailwindColorFinderTool/> },
});
