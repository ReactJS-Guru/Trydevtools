// Encoding category — base64, url, jwt, html-entities, hex, sha-256
const { useState, useEffect, useMemo } = React;

// ── shared primitives (also defined in other category files) ──
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

function IOFrame({ inputLabel, outputLabel, input, setInput, output, isError, controls, meta, stacked, outputRich }) {
  return (
    <>
      {controls && <div style={{display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:14}}>{controls}</div>}
      <div className="io-panel" style={stacked ? {gridTemplateColumns:"1fr"} : {}}>
        <div className="io-pane">
          <div className="io-pane-header"><span>{inputLabel}</span><span style={{color:"var(--ink-3)"}}>{input?.length?.toLocaleString() || 0} bytes</span></div>
          <div className="io-pane-body"><textarea value={input} onChange={e => setInput(e.target.value)} spellCheck="false"/></div>
        </div>
        <div className="io-pane" style={stacked ? {borderLeft:0, borderTop:"1px solid var(--line)"} : {}}>
          <div className="io-pane-header"><span>{outputLabel}</span><span style={{color: isError ? "var(--err)" : "var(--ok)"}}>{isError ? "✗ error" : "✓ ok"}</span></div>
          <div className="io-pane-body">{outputRich || (<pre style={isError ? {color:"var(--err)"} : undefined}>{output}</pre>)}</div>
        </div>
      </div>
      {meta && (<div className="tool-status"><span className={`status-dot ${isError ? "err" : ""}`}/>{meta}<div style={{flex:1}}/><span>processed locally · 0ms network</span></div>)}
    </>
  );
}

function highlightJSON(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/("(?:\\.|[^"\\])*")(\s*:)/g, '<span class="tok-key">$1</span>$2')
    .replace(/: ("(?:\\.|[^"\\])*")/g, ': <span class="tok-str">$1</span>')
    .replace(/\b(-?\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g, '<span class="tok-num">$1</span>')
    .replace(/\b(true|false)\b/g, '<span class="tok-bool">$1</span>')
    .replace(/\b(null)\b/g, '<span class="tok-null">$1</span>');
}

function TextTransformTool({ fn, inputLabel, outputLabel, defaultInput }) {
  const [input, setInput] = useState(defaultInput);
  const out = fn(input);
  return <IOFrame input={input} setInput={setInput} inputLabel={inputLabel} outputLabel={outputLabel} output={out} controls={<><div style={{flex:1}}/><CopyBtn value={out}/></>}/>;
}

// ════════════════════════════════════════════════════════════════════════════
// BASE64
// ════════════════════════════════════════════════════════════════════════════
function Base64Tool() {
  const [mode, setMode] = useState("encode");
  const [input, setInput] = useState("hello trydevtools");
  const [urlSafe, setUrlSafe] = useState(false);
  const result = useMemo(() => {
    try {
      if (mode === "encode") {
        let s = btoa(unescape(encodeURIComponent(input)));
        if (urlSafe) s = s.replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
        return { ok: true, output: s };
      } else {
        let s = input.replace(/-/g,"+").replace(/_/g,"/");
        while (s.length % 4) s += "=";
        return { ok: true, output: decodeURIComponent(escape(atob(s))) };
      }
    } catch (e) { return { ok: false, error: e.message }; }
  }, [input, mode, urlSafe]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel={mode === "encode" ? "input · plain text" : "input · base64"}
      outputLabel={mode === "encode" ? "output · base64" : "output · plain text"}
      isError={!result.ok}
      output={result.ok ? result.output : result.error}
      controls={<>
        <div className="segmented" style={{width:180}}>
          <button className={mode==="encode"?"active":""} onClick={()=>setMode("encode")}>Encode</button>
          <button className={mode==="decode"?"active":""} onClick={()=>setMode("decode")}>Decode</button>
        </div>
        <label className="chip" style={{cursor:"pointer"}}>
          <input type="checkbox" checked={urlSafe} onChange={e=>setUrlSafe(e.target.checked)} style={{margin:0}}/> URL-safe
        </label>
        <div style={{flex:1}}/>
        <CopyBtn value={result.ok ? result.output : ""}/>
      </>}
      meta={<><span>{result.ok ? `${result.output.length} chars out` : "error"}</span></>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// URL ENCODE
// ════════════════════════════════════════════════════════════════════════════
function UrlEncodeTool() {
  const [mode, setMode] = useState("encode");
  const [input, setInput] = useState("https://example.com/search?q=hello world&lang=en");
  const result = useMemo(() => {
    try { return { ok: true, output: mode === "encode" ? encodeURIComponent(input) : decodeURIComponent(input) }; }
    catch (e) { return { ok: false, error: e.message }; }
  }, [input, mode]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel={`input · ${mode === "encode" ? "raw URL" : "encoded URL"}`}
      outputLabel={`output · ${mode === "encode" ? "encoded" : "decoded"}`}
      isError={!result.ok}
      output={result.ok ? result.output : result.error}
      controls={<>
        <div className="segmented" style={{width:180}}>
          <button className={mode==="encode"?"active":""} onClick={()=>setMode("encode")}>Encode</button>
          <button className={mode==="decode"?"active":""} onClick={()=>setMode("decode")}>Decode</button>
        </div>
        <div style={{flex:1}}/>
        <CopyBtn value={result.ok ? result.output : ""}/>
      </>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// JWT DECODER
// ════════════════════════════════════════════════════════════════════════════
function JwtTool() {
  const [input, setInput] = useState("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsImlhdCI6MTcxMzQ1NjAwMCwiZXhwIjoxNzQ0OTkyMDAwfQ.6G7KOe3VfTT5DQNSdbT3LGmcYylF3aJNNy4jYKuv6d8");
  const parts = input.split(".");
  const decode = (b) => { try { return JSON.parse(decodeURIComponent(escape(atob(b.replace(/-/g,"+").replace(/_/g,"/") + "=".repeat((4 - b.length%4)%4))))); } catch { return null; } };
  const header = parts[0] ? decode(parts[0]) : null;
  const payload = parts[1] ? decode(parts[1]) : null;
  const fmt = (o) => o ? JSON.stringify(o, null, 2) : "invalid segment";
  const expiry = payload?.exp ? new Date(payload.exp * 1000) : null;
  const isExpired = expiry && expiry < new Date();
  return (
    <>
      <div style={{display:"flex", gap:8, marginBottom:14, alignItems:"center"}}>
        <span className="chip accent"><span className="mono">{parts.length}</span> segments</span>
        {payload?.exp && (
          <span className="chip" style={{background: isExpired ? "rgba(248,113,113,.08)" : "var(--accent-soft)"}}>
            {isExpired ? "✗ expired" : "✓ valid"} · {expiry.toLocaleString()}
          </span>
        )}
        <div style={{flex:1}}/>
        <CopyBtn value={fmt(payload)} label="Copy payload"/>
      </div>
      <div className="io-panel">
        <div className="io-pane">
          <div className="io-pane-header"><span>jwt · encoded</span><span style={{color:"var(--ink-3)"}}>{input.length}b</span></div>
          <div className="io-pane-body"><textarea value={input} onChange={e=>setInput(e.target.value)} spellCheck="false" style={{wordBreak:"break-all", whiteSpace:"pre-wrap"}}/></div>
        </div>
        <div className="io-pane" style={{display:"flex", flexDirection:"column"}}>
          <div className="io-pane-header"><span>decoded</span><span style={{color:"var(--ink-3)"}}>header + payload</span></div>
          <div className="io-pane-body" style={{position:"relative"}}>
            <pre style={{padding:"16px 18px", position:"absolute", inset:0, overflow:"auto"}}>
              <span style={{color:"var(--ink-3)"}}>// header</span>{"\n"}
              <span dangerouslySetInnerHTML={{__html: highlightJSON(fmt(header))}}/>{"\n\n"}
              <span style={{color:"var(--ink-3)"}}>// payload</span>{"\n"}
              <span dangerouslySetInnerHTML={{__html: highlightJSON(fmt(payload))}}/>{"\n\n"}
              <span style={{color:"var(--ink-3)"}}>// signature</span>{"\n"}
              <span className="mono" style={{color:"var(--ink-2)", wordBreak:"break-all"}}>{parts[2] || "—"}</span>
            </pre>
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// HTML ENTITIES
// ════════════════════════════════════════════════════════════════════════════
function HtmlEntitiesTool() {
  const [mode, setMode] = useState("encode");
  const [input, setInput] = useState("<script>alert('xss & stuff')</script>");
  const MAP = { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" };
  const out = mode === "encode"
    ? input.replace(/[&<>"']/g, c => MAP[c])
    : input.replace(/&(amp|lt|gt|quot|#39);/g, m => ({"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&#39;":"'"}[m]));
  return (
    <IOFrame input={input} setInput={setInput}
      inputLabel={mode==="encode"?"input · HTML":"input · escaped"}
      outputLabel={mode==="encode"?"output · escaped":"output · HTML"}
      output={out}
      controls={<>
        <div className="segmented" style={{width:180}}>
          <button className={mode==="encode"?"active":""} onClick={()=>setMode("encode")}>Encode</button>
          <button className={mode==="decode"?"active":""} onClick={()=>setMode("decode")}>Decode</button>
        </div>
        <div style={{flex:1}}/>
        <CopyBtn value={out}/>
      </>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SHA-256 HASH
// ════════════════════════════════════════════════════════════════════════════
function HashTool({ algo = "SHA-256" }) {
  const [input, setInput] = useState("hello trydevtools");
  const [hash, setHash] = useState("");
  useEffect(() => {
    (async () => {
      const data = new TextEncoder().encode(input);
      const buf = await crypto.subtle.digest(algo, data);
      setHash(Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2,"0")).join(""));
    })();
  }, [input, algo]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel="input · plaintext"
      outputLabel={`output · ${algo.toLowerCase()} digest`}
      output={hash}
      controls={<><div style={{flex:1}}/><CopyBtn value={hash}/></>}
      meta={<span>{hash.length * 4} bits · hex-encoded</span>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MD5 — pure JS (Web Crypto doesn't support it)
// Adapted from public-domain RFC 1321 implementation.
// ════════════════════════════════════════════════════════════════════════════
function md5Hex(text) {
  const K = [
    0xd76aa478,0xe8c7b756,0x242070db,0xc1bdceee,0xf57c0faf,0x4787c62a,0xa8304613,0xfd469501,
    0x698098d8,0x8b44f7af,0xffff5bb1,0x895cd7be,0x6b901122,0xfd987193,0xa679438e,0x49b40821,
    0xf61e2562,0xc040b340,0x265e5a51,0xe9b6c7aa,0xd62f105d,0x02441453,0xd8a1e681,0xe7d3fbc8,
    0x21e1cde6,0xc33707d6,0xf4d50d87,0x455a14ed,0xa9e3e905,0xfcefa3f8,0x676f02d9,0x8d2a4c8a,
    0xfffa3942,0x8771f681,0x6d9d6122,0xfde5380c,0xa4beea44,0x4bdecfa9,0xf6bb4b60,0xbebfbc70,
    0x289b7ec6,0xeaa127fa,0xd4ef3085,0x04881d05,0xd9d4d039,0xe6db99e5,0x1fa27cf8,0xc4ac5665,
    0xf4292244,0x432aff97,0xab9423a7,0xfc93a039,0x655b59c3,0x8f0ccc92,0xffeff47d,0x85845dd1,
    0x6fa87e4f,0xfe2ce6e0,0xa3014314,0x4e0811a1,0xf7537e82,0xbd3af235,0x2ad7d2bb,0xeb86d391,
  ];
  const S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
  const bytes = new TextEncoder().encode(text);
  const len = bytes.length;
  const padLen = ((len + 9 + 63) >>> 6) << 6;
  const padded = new Uint8Array(padLen);
  padded.set(bytes);
  padded[len] = 0x80;
  const bits = BigInt(len) * 8n;
  for (let i = 0; i < 8; i++) padded[padLen - 8 + i] = Number((bits >> BigInt(i*8)) & 0xffn);
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  const rotl = (x, n) => (x << n) | (x >>> (32 - n));
  for (let chunk = 0; chunk < padLen; chunk += 64) {
    const M = new Array(16);
    for (let i = 0; i < 16; i++) {
      M[i] = padded[chunk+i*4] | (padded[chunk+i*4+1]<<8) | (padded[chunk+i*4+2]<<16) | (padded[chunk+i*4+3]<<24);
    }
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5*i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3*i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7*i) % 16; }
      F = (F + A + K[i] + M[g]) | 0;
      A = D; D = C; C = B; B = (B + rotl(F, S[i])) | 0;
    }
    a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
  }
  const toHex = (n) => { let s = ""; for (let i = 0; i < 4; i++) s += ((n >>> (i*8)) & 0xff).toString(16).padStart(2,"0"); return s; };
  return toHex(a0) + toHex(b0) + toHex(c0) + toHex(d0);
}
function Md5HashTool() {
  const [input, setInput] = useState("hello trydevtools");
  const hash = useMemo(() => md5Hex(input), [input]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel="input · plaintext"
      outputLabel="output · md5 digest"
      output={hash}
      controls={<><div style={{flex:1}}/><CopyBtn value={hash}/></>}
      meta={<><span>128 bits · hex-encoded</span><span>·</span><span style={{color:"var(--err)"}}>insecure — don't use for passwords</span></>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// BINARY ENCODER (same as text-to-binary, but in encoding category)
// ════════════════════════════════════════════════════════════════════════════
function BinaryEncoderTool() {
  const [mode, setMode] = useState("encode");
  const [input, setInput] = useState("hello");
  const result = useMemo(() => {
    try {
      if (mode === "encode") {
        const out = Array.from(new TextEncoder().encode(input), b => b.toString(2).padStart(8, "0")).join(" ");
        return { ok: true, output: out };
      } else {
        const bytes = input.trim().split(/\s+/).map(b => parseInt(b, 2));
        if (bytes.some(b => Number.isNaN(b) || b < 0 || b > 255)) throw new Error("Each token must be a binary byte (0–255)");
        return { ok: true, output: new TextDecoder().decode(new Uint8Array(bytes)) };
      }
    } catch (e) { return { ok: false, error: e.message }; }
  }, [input, mode]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel={mode === "encode" ? "input · text" : "input · binary (space-separated bytes)"}
      outputLabel={mode === "encode" ? "output · binary" : "output · text"}
      isError={!result.ok}
      output={result.ok ? result.output : result.error}
      controls={<>
        <div className="segmented" style={{width:180}}>
          <button className={mode==="encode"?"active":""} onClick={()=>setMode("encode")}>Text → Bin</button>
          <button className={mode==="decode"?"active":""} onClick={()=>setMode("decode")}>Bin → Text</button>
        </div>
        <div style={{flex:1}}/>
        <CopyBtn value={result.ok ? result.output : ""}/>
      </>}
      meta={result.ok ? <span>{result.output.length} chars · UTF-8 bytes</span> : <span>parse error</span>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ROT13 (Caesar cipher, 13-shift)
// ════════════════════════════════════════════════════════════════════════════
function rot13(s) {
  return s.replace(/[a-zA-Z]/g, c => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode((c.charCodeAt(0) - base + 13) % 26 + base);
  });
}
function Rot13Tool() {
  const [input, setInput] = useState("Hello, TryDevTools! Encrypt and decrypt are the same operation.");
  const out = rot13(input);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel="input · text"
      outputLabel="output · rot13"
      output={out}
      controls={<>
        <button className="btn btn-ghost btn-sm" onClick={()=>setInput(out)}>↻ Apply (round-trip)</button>
        <div style={{flex:1}}/>
        <CopyBtn value={out}/>
      </>}
      meta={<><span>letters shifted by 13</span><span>·</span><span>numbers and symbols unchanged</span></>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MORSE CODE
// ════════════════════════════════════════════════════════════════════════════
const MORSE_MAP = {
  "A":".-","B":"-...","C":"-.-.","D":"-..","E":".","F":"..-.","G":"--.","H":"....","I":"..","J":".---","K":"-.-","L":".-..","M":"--","N":"-.","O":"---","P":".--.","Q":"--.-","R":".-.","S":"...","T":"-","U":"..-","V":"...-","W":".--","X":"-..-","Y":"-.--","Z":"--..",
  "0":"-----","1":".----","2":"..---","3":"...--","4":"....-","5":".....","6":"-....","7":"--...","8":"---..","9":"----.",
  ".":".-.-.-",",":"--..--","?":"..--..","'":".----.","!":"-.-.--","/":"-..-.","(":"-.--.",")":"-.--.-","&":".-...",":":"---...",";":"-.-.-.","=":"-...-","+":".-.-.","-":"-....-","_":"..--.-","\"":".-..-.","$":"...-..-","@":".--.-.",
};
const MORSE_REVERSE = Object.fromEntries(Object.entries(MORSE_MAP).map(([k,v]) => [v, k]));
function MorseCodeTool() {
  const [mode, setMode] = useState("encode");
  const [input, setInput] = useState("HELLO TRYDEVTOOLS");
  const result = useMemo(() => {
    if (mode === "encode") {
      const out = input.toUpperCase().split("").map(c => {
        if (c === " ") return "/";
        if (c === "\n") return "\n";
        return MORSE_MAP[c] ?? "";
      }).filter(Boolean).join(" ");
      return { ok: true, output: out };
    } else {
      try {
        return { ok: true, output: input.split("\n").map(line => line.split("/").map(word => word.trim().split(/\s+/).map(code => MORSE_REVERSE[code] ?? "?").join("")).join(" ")).join("\n") };
      } catch (e) { return { ok: false, error: e.message }; }
    }
  }, [input, mode]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel={mode === "encode" ? "input · text" : "input · morse (·− space-separated, / between words)"}
      outputLabel={mode === "encode" ? "output · morse" : "output · text"}
      isError={!result.ok}
      output={result.ok ? result.output : result.error}
      controls={<>
        <div className="segmented" style={{width:180}}>
          <button className={mode==="encode"?"active":""} onClick={()=>setMode("encode")}>Text → Morse</button>
          <button className={mode==="decode"?"active":""} onClick={()=>setMode("decode")}>Morse → Text</button>
        </div>
        <div style={{flex:1}}/>
        <CopyBtn value={result.ok ? result.output : ""}/>
      </>}
      meta={<><span>{Object.keys(MORSE_MAP).length} chars supported</span><span>·</span><span>/ separates words</span></>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// BASIC AUTH HEADER GENERATOR
// ════════════════════════════════════════════════════════════════════════════
function BasicAuthTool() {
  const [user, setUser] = useState("admin");
  const [pass, setPass] = useState("hunter2");
  const encoded = useMemo(() => btoa(unescape(encodeURIComponent(`${user}:${pass}`))), [user, pass]);
  const header = `Authorization: Basic ${encoded}`;
  const curl = `curl -H "${header}" https://api.example.com/`;
  return (
    <>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14}}>
        <div className="card" style={{padding:18}}>
          <div className="eyebrow" style={{marginBottom:10}}>username</div>
          <input value={user} onChange={e=>setUser(e.target.value)} style={{width:"100%", fontSize:15, padding:"10px 14px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", outline:"none"}} spellCheck="false"/>
        </div>
        <div className="card" style={{padding:18}}>
          <div className="eyebrow" style={{marginBottom:10}}>password</div>
          <input value={pass} onChange={e=>setPass(e.target.value)} style={{width:"100%", fontSize:15, padding:"10px 14px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}} spellCheck="false"/>
        </div>
      </div>
      <div className="card" style={{padding:0, overflow:"hidden"}}>
        {[
          ["Authorization header", header],
          ["Encoded token only",   `Basic ${encoded}`],
          ["Base64 (raw)",         encoded],
          ["cURL example",         curl],
        ].map(([k, v], i, arr) => (
          <div key={k} style={{display:"flex", alignItems:"center", padding:"12px 16px", borderBottom: i < arr.length-1 ? "1px solid var(--line)" : "none", gap:16}}>
            <span className="mono" style={{fontSize:11, color:"var(--ink-3)", width:170, textTransform:"uppercase", letterSpacing:".06em"}}>{k}</span>
            <span className="mono" style={{flex:1, fontSize:13, color:"var(--ink)", wordBreak:"break-all"}}>{v}</span>
            <button className="btn btn-ghost btn-sm" onClick={()=>navigator.clipboard.writeText(v)}><Icon.Copy/></button>
          </div>
        ))}
      </div>
      <div style={{marginTop:14, padding:"12px 16px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r-lg)", fontSize:12.5, color:"var(--ink-2)"}}>
        <span style={{color:"var(--err)", fontWeight:600}}>⚠ Basic Auth sends credentials with every request — only use over HTTPS.</span>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// BCRYPT HASH (lazy-loads bcryptjs from CDN)
// ════════════════════════════════════════════════════════════════════════════
function loadBcrypt() {
  if (window.dcodeIO?.bcrypt) return Promise.resolve(window.dcodeIO.bcrypt);
  if (window.bcrypt) return Promise.resolve(window.bcrypt);
  if (window.__bcryptLoading) return window.__bcryptLoading;
  window.__bcryptLoading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/bcryptjs@2.4.3/dist/bcrypt.min.js";
    s.onload = () => resolve(window.dcodeIO?.bcrypt || window.bcrypt);
    s.onerror = () => reject(new Error("Failed to load bcryptjs"));
    document.head.appendChild(s);
  });
  return window.__bcryptLoading;
}
function BcryptTool() {
  const [mode, setMode] = useState("hash");
  const [password, setPassword] = useState("hunter2");
  const [hashOut, setHashOut] = useState("");
  const [verifyHash, setVerifyHash] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [rounds, setRounds] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [bcrypt, setBcrypt] = useState(null);
  useEffect(() => { loadBcrypt().then(setBcrypt).catch(e => setError(e.message)); }, []);

  const doHash = async () => {
    if (!bcrypt) return;
    setBusy(true); setError(null);
    try { setHashOut(await new Promise((res, rej) => bcrypt.hash(password, rounds, (err, h) => err ? rej(err) : res(h)))); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const doVerify = async () => {
    if (!bcrypt) return;
    setBusy(true); setError(null); setVerifyResult(null);
    try { setVerifyResult(await new Promise((res, rej) => bcrypt.compare(password, verifyHash, (err, ok) => err ? rej(err) : res(ok)))); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <>
      <div className="segmented" style={{width:240, marginBottom:14}}>
        <button className={mode==="hash"?"active":""} onClick={()=>setMode("hash")}>Hash</button>
        <button className={mode==="verify"?"active":""} onClick={()=>setMode("verify")}>Verify</button>
      </div>
      <div className="card" style={{padding:18, marginBottom:14}}>
        <div className="eyebrow" style={{marginBottom:8}}>password</div>
        <input value={password} onChange={e=>setPassword(e.target.value)} style={{width:"100%", fontSize:15, padding:"10px 14px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}} spellCheck="false"/>
      </div>
      {mode === "hash" ? (
        <>
          <div style={{display:"flex", gap:14, alignItems:"center", marginBottom:14}}>
            <span className="chip" style={{padding:"2px 10px 2px 12px"}}>
              cost (rounds) <input type="range" min="4" max="14" value={rounds} onChange={e=>setRounds(+e.target.value)} style={{width:140, margin:"0 8px"}}/><span className="mono" style={{minWidth:22}}>{rounds}</span>
            </span>
            <span style={{fontSize:12, color:"var(--ink-3)", fontFamily:"var(--mono)"}}>~ {(Math.pow(2, rounds)/1000).toFixed(rounds < 8 ? 2 : 1)}s on a typical CPU</span>
            <div style={{flex:1}}/>
            <button className="btn btn-primary btn-sm" onClick={doHash} disabled={busy || !bcrypt}>{busy ? "hashing…" : "Generate hash"}</button>
          </div>
          {hashOut && (
            <div className="card" style={{padding:0}}>
              <div style={{display:"flex", alignItems:"center", padding:"14px 16px", gap:14}}>
                <span className="mono" style={{fontSize:11, color:"var(--ink-3)", width:60, textTransform:"uppercase"}}>hash</span>
                <span className="mono" style={{flex:1, fontSize:13, color:"var(--ink)", wordBreak:"break-all"}}>{hashOut}</span>
                <CopyBtn value={hashOut}/>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="card" style={{padding:18, marginBottom:14}}>
            <div className="eyebrow" style={{marginBottom:8}}>bcrypt hash to verify against</div>
            <input value={verifyHash} onChange={e=>setVerifyHash(e.target.value)} placeholder="$2a$10$..." style={{width:"100%", fontSize:14, padding:"10px 14px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}} spellCheck="false"/>
          </div>
          <button className="btn btn-primary btn-sm" onClick={doVerify} disabled={busy || !bcrypt || !verifyHash}>{busy ? "verifying…" : "Verify password"}</button>
          {verifyResult !== null && (
            <div className="card" style={{padding:"14px 18px", marginTop:14, display:"flex", alignItems:"center", gap:12, borderColor: verifyResult ? "rgba(52,211,153,.3)" : "rgba(248,113,113,.3)", background: verifyResult ? "rgba(52,211,153,.06)" : "rgba(248,113,113,.06)"}}>
              <span style={{width:9, height:9, borderRadius:"50%", background: verifyResult ? "var(--ok)" : "var(--err)"}}/>
              <span style={{fontSize:14, fontWeight:600, color: verifyResult ? "var(--ok)" : "var(--err)"}}>{verifyResult ? "✓ Password matches the hash" : "✗ Password does not match"}</span>
            </div>
          )}
        </>
      )}
      {error && <div className="card" style={{padding:"12px 16px", marginTop:14, color:"var(--err)", borderColor:"rgba(248,113,113,.3)"}}>{error}</div>}
      {!bcrypt && !error && <div style={{marginTop:14, fontSize:12, fontFamily:"var(--mono)", color:"var(--ink-3)"}}>loading bcryptjs…</div>}
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Register encoding tools
// ────────────────────────────────────────────────────────────────────────────
window.LIVE_TOOLS = window.LIVE_TOOLS || {};
Object.assign(window.LIVE_TOOLS, {
  "base64-encode":         { render: () => <Base64Tool/> },
  "url-encode":            { render: () => <UrlEncodeTool/> },
  "jwt-decoder":           { render: () => <JwtTool/> },
  "html-entities":         { render: () => <HtmlEntitiesTool/> },
  "md5-hash":              { render: () => <Md5HashTool/> },
  "sha256-hash":           { render: () => <HashTool algo="SHA-256"/> },
  "sha1-hash":             { render: () => <HashTool algo="SHA-1"/> },
  "sha512-hash":           { render: () => <HashTool algo="SHA-512"/> },
  "hex-encoder":           { render: () => <TextTransformTool defaultInput="hello" fn={s => Array.from(s, c => c.charCodeAt(0).toString(16).padStart(2,"0")).join(" ")} inputLabel="input · text" outputLabel="output · hex"/> },
  "binary-encoder":        { render: () => <BinaryEncoderTool/> },
  "rot13":                 { render: () => <Rot13Tool/> },
  "morse-code":            { render: () => <MorseCodeTool/> },
  "basic-auth-generator":  { render: () => <BasicAuthTool/> },
  "bcrypt-hash":           { render: () => <BcryptTool/> },
});
