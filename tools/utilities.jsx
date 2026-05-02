// Utilities category — 10 tools
const { useState, useEffect, useMemo, useRef } = React;

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

// ════════════════════════════════════════════════════════════════════════════
// RANDOM NUMBER GENERATOR
// ════════════════════════════════════════════════════════════════════════════
function RandomNumberTool() {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [count, setCount] = useState(10);
  const [type, setType] = useState("int");
  const [unique, setUnique] = useState(false);
  const [seed, setSeed] = useState(0);
  const numbers = useMemo(() => {
    const lo = Math.min(min, max), hi = Math.max(min, max);
    const range = hi - lo;
    const out = [];
    if (type === "int" && unique) {
      const span = Math.floor(range) + 1;
      const n = Math.min(count, span);
      const pool = Array.from({length: span}, (_, i) => lo + i);
      const arr = crypto.getRandomValues(new Uint32Array(n));
      for (let i = 0; i < n; i++) {
        const j = arr[i] % pool.length;
        out.push(pool.splice(j, 1)[0]);
      }
      return out;
    }
    const arr = crypto.getRandomValues(new Uint32Array(count));
    for (let i = 0; i < count; i++) {
      if (type === "int") out.push(lo + Math.floor(arr[i] / 0xffffffff * (range + 1)));
      else out.push(lo + arr[i] / 0xffffffff * range);
    }
    return out;
  }, [min, max, count, type, unique, seed]);
  return (
    <>
      <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:10, marginBottom:14}}>
        <div className="card" style={{padding:14}}>
          <div className="eyebrow" style={{marginBottom:6}}>min</div>
          <input type="number" value={min} onChange={e=>setMin(+e.target.value)} style={{width:"100%", fontSize:18, padding:"8px 12px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}}/>
        </div>
        <div className="card" style={{padding:14}}>
          <div className="eyebrow" style={{marginBottom:6}}>max</div>
          <input type="number" value={max} onChange={e=>setMax(+e.target.value)} style={{width:"100%", fontSize:18, padding:"8px 12px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}}/>
        </div>
        <div className="card" style={{padding:14}}>
          <div className="eyebrow" style={{marginBottom:6}}>count</div>
          <input type="number" value={count} onChange={e=>setCount(Math.max(1, Math.min(1000, +e.target.value)))} style={{width:"100%", fontSize:18, padding:"8px 12px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}}/>
        </div>
        <div className="card" style={{padding:14}}>
          <div className="eyebrow" style={{marginBottom:6}}>type</div>
          <div className="segmented" style={{width:"100%"}}>
            <button className={type==="int"?"active":""} onClick={()=>setType("int")}>int</button>
            <button className={type==="float"?"active":""} onClick={()=>setType("float")}>float</button>
          </div>
        </div>
      </div>
      <div style={{display:"flex", gap:10, marginBottom:14, alignItems:"center"}}>
        {type === "int" && (
          <label className="chip" style={{cursor:"pointer"}}>
            <input type="checkbox" checked={unique} onChange={e=>setUnique(e.target.checked)} style={{margin:0}}/> unique values
          </label>
        )}
        <button className="btn btn-primary btn-sm" onClick={()=>setSeed(s=>s+1)}>↻ Regenerate</button>
        <div style={{flex:1}}/>
        <CopyBtn value={numbers.map(n => type === "int" ? n : n.toFixed(6)).join("\n")} label="Copy all"/>
      </div>
      <div className="card" style={{padding:0, maxHeight:400, overflow:"auto"}}>
        {numbers.map((n, i) => (
          <div key={i} style={{display:"flex", alignItems:"center", padding:"8px 16px", borderBottom: i < numbers.length-1 ? "1px solid var(--line)" : "none", fontFamily:"var(--mono)", fontSize:13}}>
            <span style={{color:"var(--ink-3)", width:40}}>#{i+1}</span>
            <span style={{flex:1, color:"var(--ink)"}}>{type === "int" ? n : n.toFixed(6)}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// RANDOM PICKER
// ════════════════════════════════════════════════════════════════════════════
function RandomPickerTool() {
  const [list, setList] = useState("Ada Lovelace\nAlan Turing\nGrace Hopper\nLinus Torvalds\nMargaret Hamilton\nDonald Knuth\nBarbara Liskov\nDennis Ritchie\nKen Thompson\nBjarne Stroustrup");
  const [pickCount, setPickCount] = useState(3);
  const [withReplacement, setWithReplacement] = useState(false);
  const [seed, setSeed] = useState(0);
  const items = list.split("\n").map(s => s.trim()).filter(Boolean);
  const picked = useMemo(() => {
    if (items.length === 0) return [];
    const out = [];
    const pool = withReplacement ? null : [...items];
    const n = withReplacement ? pickCount : Math.min(pickCount, items.length);
    const arr = crypto.getRandomValues(new Uint32Array(n));
    for (let i = 0; i < n; i++) {
      if (withReplacement) out.push(items[arr[i] % items.length]);
      else { const j = arr[i] % pool.length; out.push(pool.splice(j, 1)[0]); }
    }
    return out;
  }, [list, pickCount, withReplacement, seed]);
  return (
    <>
      <div className="card" style={{padding:14, marginBottom:14}}>
        <div className="eyebrow" style={{marginBottom:8}}>pool · {items.length} item{items.length !== 1 ? "s" : ""} (one per line)</div>
        <textarea value={list} onChange={e=>setList(e.target.value)} spellCheck="false" style={{width:"100%", minHeight:140, padding:"10px 12px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", fontSize:13, resize:"vertical", outline:"none"}}/>
      </div>
      <div style={{display:"flex", gap:10, marginBottom:14, alignItems:"center", flexWrap:"wrap"}}>
        <span className="chip" style={{padding:"2px 10px 2px 12px"}}>
          pick <input type="range" min="1" max={Math.max(items.length, 100)} value={pickCount} onChange={e=>setPickCount(+e.target.value)} style={{width:140, margin:"0 8px"}}/><span className="mono" style={{minWidth:22}}>{pickCount}</span>
        </span>
        <label className="chip" style={{cursor:"pointer"}}>
          <input type="checkbox" checked={withReplacement} onChange={e=>setWithReplacement(e.target.checked)} style={{margin:0}}/> with replacement
        </label>
        <button className="btn btn-primary btn-sm" onClick={()=>setSeed(s=>s+1)}>↻ Pick again</button>
        <div style={{flex:1}}/>
        <CopyBtn value={picked.join("\n")}/>
      </div>
      <div className="eyebrow" style={{marginBottom:8}}>picked · {picked.length} item{picked.length !== 1 ? "s" : ""}</div>
      <div className="card" style={{padding:0, overflow:"hidden"}}>
        {picked.length === 0 ? <div style={{padding:24, textAlign:"center", color:"var(--ink-3)"}}>(empty)</div> :
          picked.map((p, i) => (
            <div key={i} style={{display:"flex", alignItems:"center", padding:"10px 16px", borderBottom: i < picked.length-1 ? "1px solid var(--line)" : "none", gap:14, fontFamily:"var(--mono)", fontSize:14}}>
              <span style={{color:"var(--accent-hi)", width:32, fontWeight:600}}>#{i+1}</span>
              <span style={{flex:1, color:"var(--ink)"}}>{p}</span>
            </div>
          ))}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DIFF CHECKER (line-level with stats)
// ════════════════════════════════════════════════════════════════════════════
function diffLines(a, b) {
  const al = a.split("\n"), bl = b.split("\n");
  const n = al.length, m = bl.length;
  const dp = Array.from({length:n+1}, () => new Int32Array(m+1));
  for (let i = n-1; i >= 0; i--) for (let j = m-1; j >= 0; j--) {
    dp[i][j] = al[i] === bl[j] ? dp[i+1][j+1] + 1 : Math.max(dp[i+1][j], dp[i][j+1]);
  }
  const out = []; let i = 0, j = 0;
  while (i < n && j < m) {
    if (al[i] === bl[j]) { out.push({ kind: "eq", text: al[i], aLine: i+1, bLine: j+1 }); i++; j++; }
    else if (dp[i+1][j] >= dp[i][j+1]) { out.push({ kind: "del", text: al[i], aLine: i+1, bLine: null }); i++; }
    else { out.push({ kind: "add", text: bl[j], aLine: null, bLine: j+1 }); j++; }
  }
  while (i < n) out.push({ kind: "del", text: al[i++], aLine: i, bLine: null });
  while (j < m) out.push({ kind: "add", text: bl[j++], aLine: null, bLine: j });
  return out;
}
function DiffCheckerTool() {
  const [a, setA] = useState("function fizzbuzz(n) {\n  for (let i = 1; i <= n; i++) {\n    if (i % 15 === 0) console.log('FizzBuzz');\n    else if (i % 3 === 0) console.log('Fizz');\n    else console.log(i);\n  }\n}");
  const [b, setB] = useState("function fizzbuzz(n) {\n  const out = [];\n  for (let i = 1; i <= n; i++) {\n    if (i % 15 === 0) out.push('FizzBuzz');\n    else if (i % 3 === 0) out.push('Fizz');\n    else if (i % 5 === 0) out.push('Buzz');\n    else out.push(String(i));\n  }\n  return out;\n}");
  const diff = useMemo(() => diffLines(a, b), [a, b]);
  const stats = useMemo(() => ({
    added:   diff.filter(d => d.kind === "add").length,
    removed: diff.filter(d => d.kind === "del").length,
    same:    diff.filter(d => d.kind === "eq").length,
  }), [diff]);
  return (
    <>
      <div className="io-panel" style={{marginBottom:14}}>
        <div className="io-pane">
          <div className="io-pane-header"><span>file A · old</span><span style={{color:"var(--ink-3)"}}>{a.split("\n").length} lines</span></div>
          <div className="io-pane-body"><textarea value={a} onChange={e=>setA(e.target.value)} spellCheck="false"/></div>
        </div>
        <div className="io-pane">
          <div className="io-pane-header"><span>file B · new</span><span style={{color:"var(--ink-3)"}}>{b.split("\n").length} lines</span></div>
          <div className="io-pane-body"><textarea value={b} onChange={e=>setB(e.target.value)} spellCheck="false"/></div>
        </div>
      </div>
      <div style={{display:"flex", gap:10, marginBottom:12, fontFamily:"var(--mono)", fontSize:12}}>
        <span className="chip" style={{color:"var(--ok)"}}>+{stats.added} added</span>
        <span className="chip" style={{color:"var(--err)"}}>−{stats.removed} removed</span>
        <span className="chip">{stats.same} unchanged</span>
        <span className="chip">Δ {stats.added + stats.removed} changes</span>
      </div>
      <div className="card" style={{padding:0, fontFamily:"var(--mono)", fontSize:12.5, maxHeight:500, overflow:"auto"}}>
        {diff.map((d, i) => (
          <div key={i} style={{display:"flex", padding:"3px 14px", gap:14, borderBottom: i < diff.length-1 ? "1px solid var(--line)" : "none", background: d.kind === "add" ? "rgba(52,211,153,.06)" : d.kind === "del" ? "rgba(248,113,113,.06)" : "transparent"}}>
            <span style={{width:36, color:"var(--ink-3)", textAlign:"right"}}>{d.aLine ?? ""}</span>
            <span style={{width:36, color:"var(--ink-3)", textAlign:"right"}}>{d.bLine ?? ""}</span>
            <span style={{width:18, color: d.kind === "add" ? "var(--ok)" : d.kind === "del" ? "var(--err)" : "var(--ink-3)", fontWeight:700}}>{d.kind === "add" ? "+" : d.kind === "del" ? "−" : " "}</span>
            <span style={{flex:1, color: d.kind === "eq" ? "var(--ink-2)" : "var(--ink)", whiteSpace:"pre"}}>{d.text || " "}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PLACEHOLDER IMAGE GENERATOR (canvas-based, fully local)
// ════════════════════════════════════════════════════════════════════════════
function LoremPixelTool() {
  const [w, setW] = useState(640);
  const [h, setH] = useState(480);
  const [bg, setBg] = useState("#1e2330");
  const [fg, setFg] = useState("#9ba3b8");
  const [text, setText] = useState("auto");
  const [pattern, setPattern] = useState("solid");
  const canvasRef = useRef(null);
  const [dataUrl, setDataUrl] = useState("");
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    if (pattern === "checker") {
      const cell = Math.max(20, Math.min(w, h) / 16);
      ctx.fillStyle = fg + "20";
      for (let y = 0; y < h; y += cell) {
        for (let x = 0; x < w; x += cell) {
          if (((x / cell) + (y / cell)) % 2 === 0) ctx.fillRect(x, y, cell, cell);
        }
      }
    } else if (pattern === "diagonal") {
      ctx.strokeStyle = fg + "30";
      ctx.lineWidth = 2;
      for (let i = -h; i < w + h; i += 24) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + h, h); ctx.stroke(); }
    } else if (pattern === "dots") {
      ctx.fillStyle = fg + "30";
      for (let y = 12; y < h; y += 24) for (let x = 12; x < w; x += 24) {
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.fillStyle = fg;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const fontSize = Math.min(w, h) * 0.12;
    ctx.font = `${fontSize}px ui-sans-serif, system-ui, sans-serif`;
    const label = text === "auto" ? `${w} × ${h}` : text;
    ctx.fillText(label, w/2, h/2);
    setDataUrl(canvas.toDataURL("image/png"));
  }, [w, h, bg, fg, text, pattern]);
  const download = () => { canvasRef.current.toBlob(b => downloadBlob(b, `placeholder-${w}x${h}.png`), "image/png"); };
  return (
    <>
      <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:10, marginBottom:14}}>
        <div className="card" style={{padding:14}}>
          <div className="eyebrow" style={{marginBottom:6}}>width</div>
          <input type="number" value={w} onChange={e=>setW(Math.max(16, Math.min(2048, +e.target.value)))} style={{width:"100%", fontSize:16, padding:"8px 12px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}}/>
        </div>
        <div className="card" style={{padding:14}}>
          <div className="eyebrow" style={{marginBottom:6}}>height</div>
          <input type="number" value={h} onChange={e=>setH(Math.max(16, Math.min(2048, +e.target.value)))} style={{width:"100%", fontSize:16, padding:"8px 12px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}}/>
        </div>
        <div className="card" style={{padding:14}}>
          <div className="eyebrow" style={{marginBottom:6}}>pattern</div>
          <select value={pattern} onChange={e=>setPattern(e.target.value)} style={{width:"100%", fontSize:13, padding:"8px 12px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", cursor:"pointer", outline:"none"}}>
            {["solid","checker","diagonal","dots"].map(p => <option key={p} value={p} style={{background:"var(--bg-2)"}}>{p}</option>)}
          </select>
        </div>
      </div>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 2fr", gap:10, marginBottom:14}}>
        <div className="card" style={{padding:14}}>
          <div className="eyebrow" style={{marginBottom:6}}>background</div>
          <div style={{display:"flex", gap:6}}><input type="color" value={bg} onChange={e=>setBg(e.target.value)} style={{width:36, height:36, border:0, background:"transparent", cursor:"pointer"}}/><input value={bg} onChange={e=>setBg(e.target.value)} style={{flex:1, fontSize:12, padding:"6px 10px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}}/></div>
        </div>
        <div className="card" style={{padding:14}}>
          <div className="eyebrow" style={{marginBottom:6}}>foreground</div>
          <div style={{display:"flex", gap:6}}><input type="color" value={fg} onChange={e=>setFg(e.target.value)} style={{width:36, height:36, border:0, background:"transparent", cursor:"pointer"}}/><input value={fg} onChange={e=>setFg(e.target.value)} style={{flex:1, fontSize:12, padding:"6px 10px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}}/></div>
        </div>
        <div className="card" style={{padding:14}}>
          <div className="eyebrow" style={{marginBottom:6}}>label text</div>
          <input value={text} onChange={e=>setText(e.target.value)} placeholder='"auto" or custom' style={{width:"100%", fontSize:14, padding:"8px 12px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}}/>
        </div>
      </div>
      <div className="card" style={{padding:14, textAlign:"center"}}>
        <canvas ref={canvasRef} style={{maxWidth:"100%", maxHeight:500, display:"block", margin:"0 auto", borderRadius:"var(--r)"}}/>
      </div>
      <div style={{display:"flex", gap:10, marginTop:14}}>
        <button className="btn btn-primary btn-sm" onClick={download}>Download PNG</button>
        <button className="btn btn-ghost btn-sm" onClick={()=>navigator.clipboard.writeText(dataUrl)}>Copy data URL</button>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHECKSUM VERIFIER (drag a file → SHA hashes; compare against expected)
// ════════════════════════════════════════════════════════════════════════════
function ChecksumVerifierTool() {
  const [file, setFile] = useState(null);
  const [hashes, setHashes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [expected, setExpected] = useState("");
  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    setBusy(true); setError(null); setHashes(null);
    (async () => {
      try {
        const buf = await file.arrayBuffer();
        const hash = async (algo) => {
          const d = await crypto.subtle.digest(algo, buf);
          return Array.from(new Uint8Array(d), b => b.toString(16).padStart(2, "0")).join("");
        };
        const [s1, s256, s384, s512] = await Promise.all([hash("SHA-1"), hash("SHA-256"), hash("SHA-384"), hash("SHA-512")]);
        if (!cancelled) setHashes({ "SHA-1": s1, "SHA-256": s256, "SHA-384": s384, "SHA-512": s512 });
      } catch (e) { if (!cancelled) setError(e.message); }
      finally { if (!cancelled) setBusy(false); }
    })();
    return () => { cancelled = true; };
  }, [file]);
  const inputRef = useRef(null);
  const match = expected && hashes ? Object.entries(hashes).find(([_, v]) => v.toLowerCase() === expected.trim().toLowerCase()) : null;
  return (
    <>
      <div onClick={()=>inputRef.current?.click()} onDrop={e=>{e.preventDefault(); setFile(e.dataTransfer.files[0]);}} onDragOver={e=>e.preventDefault()}
        style={{border:"2px dashed var(--line-strong)", borderRadius:"var(--r-lg)", padding:"32px 24px", textAlign:"center", cursor:"pointer", background:"var(--bg-1)", marginBottom:14}}>
        <input ref={inputRef} type="file" onChange={e=>setFile(e.target.files[0])} style={{display:"none"}}/>
        <div style={{fontSize:14, color:"var(--ink-2)", fontFamily:"var(--mono)"}}>{file ? `${file.name} · ${(file.size / 1024).toFixed(1)} KB` : "drop any file or click to choose"}</div>
      </div>
      {busy && <div style={{fontFamily:"var(--mono)", fontSize:13, color:"var(--ink-3)", textAlign:"center"}}>computing hashes…</div>}
      {error && <div className="card" style={{padding:14, color:"var(--err)"}}>{error}</div>}
      {hashes && (
        <>
          <div className="card" style={{padding:0, overflow:"hidden", marginBottom:14}}>
            {Object.entries(hashes).map(([algo, hex], i, a) => (
              <div key={algo} style={{display:"flex", alignItems:"center", padding:"10px 16px", borderBottom: i < a.length-1 ? "1px solid var(--line)" : "none", gap:14}}>
                <span className="mono" style={{fontSize:11, color:"var(--ink-3)", width:80, textTransform:"uppercase", letterSpacing:".06em"}}>{algo}</span>
                <span className="mono" style={{flex:1, fontSize:12, color:"var(--ink)", wordBreak:"break-all"}}>{hex}</span>
                <button className="btn btn-ghost btn-sm" onClick={()=>navigator.clipboard.writeText(hex)}><Icon.Copy/></button>
              </div>
            ))}
          </div>
          <div className="card" style={{padding:14}}>
            <div className="eyebrow" style={{marginBottom:8}}>verify against expected hash</div>
            <input value={expected} onChange={e=>setExpected(e.target.value)} placeholder="paste expected hash here…" spellCheck="false" style={{width:"100%", fontSize:13, padding:"8px 12px", background:"var(--bg-1)", border:`1px solid ${expected ? (match ? "var(--ok)" : "var(--err)") : "var(--line)"}`, borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}}/>
            {expected && (
              <div style={{marginTop:10, display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:"var(--r)", background: match ? "rgba(52,211,153,.06)" : "rgba(248,113,113,.06)", border: `1px solid ${match ? "rgba(52,211,153,.3)" : "rgba(248,113,113,.3)"}`}}>
                <span style={{width:9, height:9, borderRadius:"50%", background: match ? "var(--ok)" : "var(--err)"}}/>
                <span style={{fontSize:14, color: match ? "var(--ok)" : "var(--err)", fontWeight:600}}>{match ? `✓ matches ${match[0]}` : "✗ doesn't match any algorithm"}</span>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// KEYCODE INFO
// ════════════════════════════════════════════════════════════════════════════
function KeycodeInfoTool() {
  const [event, setEvent] = useState(null);
  useEffect(() => {
    const h = (e) => { e.preventDefault(); setEvent({ key: e.key, code: e.code, keyCode: e.keyCode, which: e.which, location: e.location, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, altKey: e.altKey, metaKey: e.metaKey, repeat: e.repeat }); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  return (
    <>
      <div className="card" style={{padding:"60px 40px", textAlign:"center", marginBottom:14, minHeight:200, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column"}}>
        {event ? (
          <>
            <div style={{fontSize:80, fontWeight:700, fontFamily:"var(--mono)", color:"var(--accent-hi)", lineHeight:1}}>{event.key === " " ? "Space" : event.key.length > 6 ? event.key : event.key}</div>
            <div style={{fontSize:14, color:"var(--ink-2)", fontFamily:"var(--mono)", marginTop:14}}>press any key to update</div>
          </>
        ) : (
          <div style={{fontSize:18, color:"var(--ink-3)", fontFamily:"var(--mono)"}}>Press any key…</div>
        )}
      </div>
      {event && (
        <div className="card" style={{padding:0, overflow:"hidden"}}>
          {[
            ["event.key",      JSON.stringify(event.key)],
            ["event.code",     event.code],
            ["event.keyCode",  String(event.keyCode)],
            ["event.which",    String(event.which)],
            ["event.location", String(event.location)],
            ["modifiers",      [event.ctrlKey && "Ctrl", event.shiftKey && "Shift", event.altKey && "Alt", event.metaKey && "Meta"].filter(Boolean).join(" + ") || "none"],
            ["repeat",         event.repeat ? "true" : "false"],
          ].map(([k, v], i, a) => (
            <div key={k} style={{display:"flex", alignItems:"center", padding:"10px 16px", borderBottom: i < a.length-1 ? "1px solid var(--line)" : "none", gap:14}}>
              <span className="mono" style={{fontSize:12, color:"var(--ink-3)", width:160}}>{k}</span>
              <span className="mono" style={{flex:1, fontSize:14, color:"var(--accent-hi)"}}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MOCK DATA GENERATOR
// ════════════════════════════════════════════════════════════════════════════
const FIRST_NAMES = ["Ada","Alan","Grace","Linus","Margaret","Donald","Barbara","Dennis","Ken","Bjarne","Tim","Vint","Brian","Niklaus","John","Anita","Radia","Hedy","Edsger","Guido","Yukihiro","James","Bill","Steve","Sergey","Larry","Jeff","Marc","Tom","Mary","Sara","Emma","Liam","Noah","Olivia","Sophia","Mia","Charlotte"];
const LAST_NAMES = ["Lovelace","Turing","Hopper","Torvalds","Hamilton","Knuth","Liskov","Ritchie","Thompson","Stroustrup","Berners-Lee","Cerf","Kernighan","Wirth","McCarthy","Borg","Perlman","Lamarr","Dijkstra","van Rossum","Matsumoto","Gosling","Gates","Jobs","Brin","Page","Bezos","Andreessen","Hanks","Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis"];
const STREETS = ["Maple","Oak","Pine","Cedar","Elm","Walnut","Park","Main","Hill","Lake","River","Sunset","Spring","Highland","Ridge","Forest","Meadow","Valley","Garden","Church"];
const STREET_TYPES = ["St","Ave","Rd","Blvd","Ln","Dr","Ct","Pl","Way"];
const CITIES = ["Springfield","Riverside","Greenville","Bristol","Clinton","Fairview","Salem","Madison","Georgetown","Arlington","Burlington","Dover","Lincoln","Newport","Oxford"];
const STATES = ["CA","NY","TX","FL","IL","PA","OH","GA","NC","MI","NJ","VA","WA","AZ","MA","TN","IN","MO","MD","WI"];
const COMPANIES = ["Acme","Globex","Initech","Umbrella","Wayne","Stark","Tyrell","Cyberdyne","Soylent","Pied Piper","Dunder Mifflin","Hooli","Krusty","Enron","Massive","Vandelay"];
const COMPANY_TYPES = ["Corp","Inc","LLC","Co","Group","Industries","Solutions","Systems"];
const DOMAINS = ["example.com","test.org","sample.io","mock.dev","demo.net","trydev.app","fake.co"];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const FIELDS = {
  id:     () => Math.floor(Math.random() * 100000) + 1,
  uuid:   () => crypto.randomUUID(),
  firstName: () => pick(FIRST_NAMES),
  lastName:  () => pick(LAST_NAMES),
  fullName:  () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
  email:  () => `${pick(FIRST_NAMES).toLowerCase()}.${pick(LAST_NAMES).toLowerCase().replace(/[^a-z]/g,"")}@${pick(DOMAINS)}`,
  phone:  () => `(${randInt(200,999)}) ${randInt(200,999)}-${String(randInt(0,9999)).padStart(4,"0")}`,
  address: () => `${randInt(1,9999)} ${pick(STREETS)} ${pick(STREET_TYPES)}`,
  city:   () => pick(CITIES),
  state:  () => pick(STATES),
  zip:    () => String(randInt(10000, 99999)),
  country: () => pick(["USA","Canada","UK","Germany","France","Japan","Australia","Brazil","India","Mexico"]),
  company: () => `${pick(COMPANIES)} ${pick(COMPANY_TYPES)}`,
  jobTitle: () => pick(["Engineer","Manager","Designer","Analyst","Developer","Architect","Director","Lead","Specialist","Consultant"]),
  age:    () => randInt(18, 80),
  birthDate: () => { const y = randInt(1940, 2005); return `${y}-${String(randInt(1,12)).padStart(2,"0")}-${String(randInt(1,28)).padStart(2,"0")}`; },
  bool:   () => Math.random() < 0.5,
  ipv4:   () => `${randInt(1,255)}.${randInt(0,255)}.${randInt(0,255)}.${randInt(1,254)}`,
  url:    () => `https://${pick(DOMAINS)}/${pick(["users","posts","articles","items"])}/${randInt(1,9999)}`,
};
const PRESETS = {
  user:     ["id","firstName","lastName","email","age"],
  contact:  ["fullName","email","phone","address","city","state","zip"],
  employee: ["id","fullName","email","jobTitle","company","phone"],
  geo:      ["id","city","state","country","ipv4"],
  custom:   [],
};
function MockDataTool() {
  const [preset, setPreset] = useState("user");
  const [fields, setFields] = useState(PRESETS.user);
  const [count, setCount] = useState(10);
  const [format, setFormat] = useState("json");
  const [seed, setSeed] = useState(0);
  const choosePreset = (p) => { setPreset(p); if (p !== "custom") setFields(PRESETS[p]); };
  const toggleField = (f) => { setPreset("custom"); setFields(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]); };
  const data = useMemo(() => Array.from({length: count}, () => Object.fromEntries(fields.map(f => [f, FIELDS[f]?.()]))), [fields, count, seed]);
  const output = useMemo(() => {
    if (data.length === 0) return "";
    if (format === "json") return JSON.stringify(data, null, 2);
    if (format === "csv") {
      const escape = (v) => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v;
      return [fields.join(","), ...data.map(row => fields.map(f => escape(row[f])).join(","))].join("\n");
    }
    if (format === "sql") {
      const tableName = preset === "custom" ? "items" : preset + "s";
      const escape = (v) => v === null ? "NULL" : typeof v === "number" || typeof v === "boolean" ? v : `'${String(v).replace(/'/g, "''")}'`;
      return `INSERT INTO ${tableName} (${fields.join(", ")}) VALUES\n${data.map(row => "  (" + fields.map(f => escape(row[f])).join(", ") + ")").join(",\n")};`;
    }
    return "";
  }, [data, format, fields, preset]);
  return (
    <>
      <div className="card" style={{padding:14, marginBottom:14}}>
        <div className="eyebrow" style={{marginBottom:8}}>preset</div>
        <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
          {Object.keys(PRESETS).map(p => <button key={p} className={`chip ${preset===p?"accent":""}`} onClick={()=>choosePreset(p)} style={{cursor:"pointer"}}>{p}</button>)}
        </div>
      </div>
      <div className="card" style={{padding:14, marginBottom:14}}>
        <div className="eyebrow" style={{marginBottom:8}}>fields ({fields.length})</div>
        <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
          {Object.keys(FIELDS).map(f => (
            <label key={f} className="chip" style={{cursor:"pointer", padding:"4px 10px", fontSize:11.5, background: fields.includes(f) ? "var(--accent-soft)" : "var(--bg-2)", borderColor: fields.includes(f) ? "var(--accent)" : "var(--line)", color: fields.includes(f) ? "var(--accent-hi)" : "var(--ink-2)"}}>
              <input type="checkbox" checked={fields.includes(f)} onChange={()=>toggleField(f)} style={{display:"none"}}/>
              {f}
            </label>
          ))}
        </div>
      </div>
      <div style={{display:"flex", gap:10, marginBottom:14, alignItems:"center", flexWrap:"wrap"}}>
        <span className="chip" style={{padding:"2px 10px 2px 12px"}}>
          rows <input type="range" min="1" max="500" value={count} onChange={e=>setCount(+e.target.value)} style={{width:140, margin:"0 8px"}}/><span className="mono" style={{minWidth:30}}>{count}</span>
        </span>
        <div className="segmented" style={{width:200}}>
          {["json","csv","sql"].map(f => <button key={f} className={format===f?"active":""} onClick={()=>setFormat(f)}>{f}</button>)}
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>setSeed(s=>s+1)}>↻ Regenerate</button>
        <div style={{flex:1}}/>
        <CopyBtn value={output} label="Copy"/>
      </div>
      <div className="card" style={{padding:0, maxHeight:500, overflow:"auto"}}>
        <pre style={{padding:"14px 16px", fontFamily:"var(--mono)", fontSize:12.5, color:"var(--ink)", margin:0}}>{output || "(no fields selected)"}</pre>
      </div>
    </>
  );
}

// ── helper: download blob ──
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ────────────────────────────────────────────────────────────────────────────
// Register utility tools
// ────────────────────────────────────────────────────────────────────────────
window.LIVE_TOOLS = window.LIVE_TOOLS || {};
Object.assign(window.LIVE_TOOLS, {
  "uuid-generator":     { render: () => <UuidTool/> },
  "nanoid-generator":   { render: () => <NanoIdTool/> },
  "password-generator": { render: () => <PasswordTool/> },
  "random-number":      { render: () => <RandomNumberTool/> },
  "random-picker":      { render: () => <RandomPickerTool/> },
  "diff-checker":       { render: () => <DiffCheckerTool/> },
  "lorem-pixel":        { render: () => <LoremPixelTool/> },
  "checksum-verifier":  { render: () => <ChecksumVerifierTool/> },
  "keycode-info":       { render: () => <KeycodeInfoTool/> },
  "mock-data":          { render: () => <MockDataTool/> },
});
