// Utilities category — UUID, Nano ID, password generator
const { useState, useMemo } = React;

// ── shared primitive (CopyBtn) ─────────────────────────────────────────────
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

// ════════════════════════════════════════════════════════════════════════════
// UUID GENERATOR
// ════════════════════════════════════════════════════════════════════════════
function genUuid(v) {
  if (v === "v7") {
    const ts = Date.now().toString(16).padStart(12, "0");
    const r = crypto.getRandomValues(new Uint8Array(10));
    const hex = Array.from(r, b => b.toString(16).padStart(2, "0")).join("");
    return `${ts.slice(0,8)}-${ts.slice(8,12)}-7${hex.slice(0,3)}-${((parseInt(hex.slice(3,4),16) & 0x3) | 0x8).toString(16)}${hex.slice(4,7)}-${hex.slice(7,19)}`;
  }
  return crypto.randomUUID();
}
function UuidTool() {
  const [version, setVersion] = useState("v4");
  const [count, setCount] = useState(8);
  const [seed, setSeed] = useState(0);
  const ids = useMemo(() => Array.from({length: count}, () => genUuid(version)), [version, count, seed]);
  return (
    <>
      <div style={{display:"flex", gap:8, marginBottom:14, alignItems:"center", flexWrap:"wrap"}}>
        <div className="segmented" style={{width:240}}>
          <button className={version==="v4"?"active":""} onClick={()=>setVersion("v4")}>v4 (random)</button>
          <button className={version==="v7"?"active":""} onClick={()=>setVersion("v7")}>v7 (time-sorted)</button>
        </div>
        <span className="chip" style={{padding:"2px 10px 2px 12px"}}>
          count <input type="range" min="1" max="50" value={count} onChange={e=>setCount(+e.target.value)} style={{width:100, margin:"0 8px"}}/>
          <span className="mono" style={{minWidth:22}}>{count}</span>
        </span>
        <button className="btn btn-ghost btn-sm" onClick={()=>setSeed(s=>s+1)}>↻ Regenerate</button>
        <div style={{flex:1}}/>
        <CopyBtn value={ids.join("\n")} label="Copy all"/>
      </div>
      <div className="card" style={{padding:0, maxHeight:420, overflow:"auto"}}>
        {ids.map((id, i) => (
          <div key={i} style={{display:"flex", alignItems:"center", padding:"10px 16px", borderBottom: i<ids.length-1 ? "1px solid var(--line)" : "none", fontFamily:"var(--mono)", fontSize:13}}>
            <span style={{color:"var(--ink-3)", width:32}}>{String(i+1).padStart(2,"0")}</span>
            <span style={{flex:1, color:"var(--ink)"}}>{id}</span>
            <button className="btn btn-ghost btn-sm" onClick={()=>navigator.clipboard.writeText(id)}><Icon.Copy/></button>
          </div>
        ))}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// NANO ID GENERATOR
// ════════════════════════════════════════════════════════════════════════════
const NANOID_ALPHABETS = {
  "default":     "_-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  "url-safe":    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  "no-look-alikes": "346789ABCDEFGHJKLMNPQRTUVWXYabcdefghijkmnpqrtwxyz",
  "numbers":     "0123456789",
  "lowercase":   "abcdefghijklmnopqrstuvwxyz",
  "hex":         "0123456789abcdef",
};
function genNanoId(size, alphabet) {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  let id = "";
  for (let i = 0; i < size; i++) id += alphabet[bytes[i] % alphabet.length];
  return id;
}
function NanoIdTool() {
  const [size, setSize] = useState(21);
  const [count, setCount] = useState(8);
  const [alpha, setAlpha] = useState("default");
  const [seed, setSeed] = useState(0);
  const ids = useMemo(() => Array.from({length: count}, () => genNanoId(size, NANOID_ALPHABETS[alpha])), [size, count, alpha, seed]);
  const collisionYears = useMemo(() => {
    const A = NANOID_ALPHABETS[alpha].length;
    const bits = size * Math.log2(A);
    return Math.pow(2, bits / 2) / 1000 / 31536000;
  }, [size, alpha]);
  return (
    <>
      <div style={{display:"flex", gap:8, marginBottom:14, alignItems:"center", flexWrap:"wrap"}}>
        <span className="chip" style={{padding:"2px 10px 2px 12px"}}>
          size <input type="range" min="6" max="36" value={size} onChange={e=>setSize(+e.target.value)} style={{width:100, margin:"0 8px"}}/>
          <span className="mono" style={{minWidth:22}}>{size}</span>
        </span>
        <span className="chip" style={{padding:"2px 10px 2px 12px"}}>
          count <input type="range" min="1" max="50" value={count} onChange={e=>setCount(+e.target.value)} style={{width:100, margin:"0 8px"}}/>
          <span className="mono" style={{minWidth:22}}>{count}</span>
        </span>
        <span className="chip" style={{padding:"2px 10px"}}>
          alphabet
          <select value={alpha} onChange={e=>setAlpha(e.target.value)} style={{background:"transparent", border:0, outline:0, fontFamily:"var(--mono)", fontSize:12.5, color:"var(--ink)", marginLeft:6, cursor:"pointer"}}>
            {Object.keys(NANOID_ALPHABETS).map(k => <option key={k} value={k} style={{background:"var(--bg-2)"}}>{k} ({NANOID_ALPHABETS[k].length})</option>)}
          </select>
        </span>
        <button className="btn btn-ghost btn-sm" onClick={()=>setSeed(s=>s+1)}>↻ Regenerate</button>
        <div style={{flex:1}}/>
        <CopyBtn value={ids.join("\n")} label="Copy all"/>
      </div>
      <div className="card" style={{padding:"12px 16px", marginBottom:14, fontFamily:"var(--mono)", fontSize:12, color:"var(--ink-2)"}}>
        ~1% collision after generating <span style={{color:"var(--accent-hi)"}}>{collisionYears > 1e9 ? `${(collisionYears/1e9).toFixed(1)}B years` : collisionYears > 1e6 ? `${(collisionYears/1e6).toFixed(1)}M years` : collisionYears > 1000 ? `${(collisionYears/1000).toFixed(1)}K years` : `${collisionYears.toFixed(1)} years`}</span> of IDs at 1000 IDs/sec
      </div>
      <div className="card" style={{padding:0, maxHeight:420, overflow:"auto"}}>
        {ids.map((id, i) => (
          <div key={i} style={{display:"flex", alignItems:"center", padding:"10px 16px", borderBottom: i < ids.length-1 ? "1px solid var(--line)" : "none", fontFamily:"var(--mono)", fontSize:13}}>
            <span style={{color:"var(--ink-3)", width:32}}>{String(i+1).padStart(2,"0")}</span>
            <span style={{flex:1, color:"var(--ink)"}}>{id}</span>
            <button className="btn btn-ghost btn-sm" onClick={()=>navigator.clipboard.writeText(id)}><Icon.Copy/></button>
          </div>
        ))}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PASSWORD GENERATOR
// ════════════════════════════════════════════════════════════════════════════
function poolSize(o) { return (o.upper?26:0)+(o.lower?26:0)+(o.num?10:0)+(o.sym?28:0); }
function PasswordTool() {
  const [len, setLen] = useState(20);
  const [opts, setOpts] = useState({ upper: true, lower: true, num: true, sym: true });
  const [seed, setSeed] = useState(0);
  const pw = useMemo(() => {
    let pool = "";
    if (opts.upper) pool += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (opts.lower) pool += "abcdefghijklmnopqrstuvwxyz";
    if (opts.num) pool += "0123456789";
    if (opts.sym) pool += "!@#$%^&*()_-+=[]{}|;:,.<>?/~";
    if (!pool) return "";
    const arr = crypto.getRandomValues(new Uint32Array(len));
    return Array.from(arr, n => pool[n % pool.length]).join("");
  }, [len, opts, seed]);
  const entropy = Math.log2(poolSize(opts) || 1) * len;
  const strength = entropy < 40 ? "weak" : entropy < 80 ? "ok" : entropy < 120 ? "strong" : "excellent";
  return (
    <>
      <div className="card" style={{padding:"24px 24px 20px", marginBottom:14}}>
        <div style={{display:"flex", alignItems:"center", gap:16}}>
          <div className="mono" style={{fontSize:22, color:"var(--ink)", wordBreak:"break-all", flex:1, minHeight:30}}>{pw}</div>
          <button className="icon-btn" onClick={()=>setSeed(s=>s+1)} title="Regenerate"><Icon.Sparkles/></button>
          <CopyBtn value={pw}/>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:10, marginTop:16}}>
          <div style={{flex:1, height:4, background:"var(--bg-3)", borderRadius:999, overflow:"hidden"}}>
            <div style={{height:"100%", width:`${Math.min(100,entropy/1.5)}%`, background: strength==="weak" ? "var(--err)" : strength==="ok" ? "#fbbf24" : "var(--accent)", transition:"all 200ms"}}/>
          </div>
          <span className="chip" style={{fontFamily:"var(--mono)", fontSize:11}}>{strength} · {entropy.toFixed(0)} bits</span>
        </div>
      </div>
      <div style={{display:"grid", gridTemplateColumns:"2fr 3fr", gap:14}}>
        <div className="card" style={{padding:18}}>
          <div className="eyebrow" style={{marginBottom:10}}>length</div>
          <div style={{display:"flex", alignItems:"center", gap:12}}>
            <input type="range" min="6" max="64" value={len} onChange={e=>setLen(+e.target.value)} style={{flex:1}}/>
            <span className="mono" style={{fontSize:18}}>{len}</span>
          </div>
        </div>
        <div className="card" style={{padding:18}}>
          <div className="eyebrow" style={{marginBottom:10}}>include</div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8}}>
            {[["upper","A-Z"],["lower","a-z"],["num","0-9"],["sym","!@#"]].map(([k,l]) => (
              <label key={k} className="chip" style={{cursor:"pointer", justifyContent:"center"}}>
                <input type="checkbox" checked={opts[k]} onChange={e=>setOpts(o=>({...o, [k]:e.target.checked}))} style={{margin:0}}/> {l}
              </label>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Register utility tools
// ────────────────────────────────────────────────────────────────────────────
window.LIVE_TOOLS = window.LIVE_TOOLS || {};
Object.assign(window.LIVE_TOOLS, {
  "uuid-generator":     { render: () => <UuidTool/> },
  "nanoid-generator":   { render: () => <NanoIdTool/> },
  "password-generator": { render: () => <PasswordTool/> },
});
