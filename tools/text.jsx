// Text category — case, word counter, line sorter, dedupe, slugify, etc.
const { useState, useMemo } = React;

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

function TextTransformTool({ fn, inputLabel, outputLabel, defaultInput }) {
  const [input, setInput] = useState(defaultInput);
  const out = fn(input);
  return <IOFrame input={input} setInput={setInput} inputLabel={inputLabel} outputLabel={outputLabel} output={out} controls={<><div style={{flex:1}}/><CopyBtn value={out}/></>}/>;
}

// ════════════════════════════════════════════════════════════════════════════
// CASE CONVERTER
// ════════════════════════════════════════════════════════════════════════════
function CaseTool() {
  const [input, setInput] = useState("The quick brown fox jumps over the lazy dog");
  const words = input.split(/[\s_\-]+|(?=[A-Z])/).filter(Boolean).map(w => w.toLowerCase());
  const cases = {
    "camelCase":    words.map((w,i) => i ? w[0].toUpperCase()+w.slice(1) : w).join(""),
    "PascalCase":   words.map(w => w[0]?.toUpperCase()+w.slice(1)).join(""),
    "snake_case":   words.join("_"),
    "kebab-case":   words.join("-"),
    "CONSTANT_CASE":words.join("_").toUpperCase(),
    "dot.case":     words.join("."),
    "Title Case":   words.map(w => w[0]?.toUpperCase()+w.slice(1)).join(" "),
    "UPPER CASE":   input.toUpperCase(),
    "lower case":   input.toLowerCase(),
    "Sentence case":input.charAt(0).toUpperCase() + input.slice(1).toLowerCase(),
  };
  return (
    <>
      <div style={{marginBottom:14}}>
        <div className="io-pane" style={{border:"1px solid var(--line)", borderRadius:"var(--r-lg)", background:"var(--bg-1)", minHeight:100}}>
          <div className="io-pane-header"><span>input</span><span style={{color:"var(--ink-3)"}}>{input.length} chars · {words.length} words</span></div>
          <div className="io-pane-body"><textarea value={input} onChange={e=>setInput(e.target.value)} spellCheck="false" style={{padding:"14px 18px", whiteSpace:"pre-wrap"}}/></div>
        </div>
      </div>
      <div className="card" style={{padding:0, overflow:"hidden"}}>
        {Object.entries(cases).map(([k, v], i) => (
          <div key={k} style={{display:"flex", alignItems:"center", padding:"12px 16px", borderBottom: i < Object.keys(cases).length-1 ? "1px solid var(--line)" : "0", gap:16}}>
            <span className="mono" style={{fontSize:12, color:"var(--ink-3)", width:140}}>{k}</span>
            <span className="mono" style={{flex:1, fontSize:13, color:"var(--ink)", wordBreak:"break-word"}}>{v}</span>
            <button className="btn btn-ghost btn-sm" onClick={()=>navigator.clipboard.writeText(v)}><Icon.Copy/></button>
          </div>
        ))}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// WORD COUNTER
// ════════════════════════════════════════════════════════════════════════════
function WordCounterTool() {
  const [input, setInput] = useState("");
  const stats = useMemo(() => {
    const chars = input.length;
    const charsNoSpaces = input.replace(/\s/g,"").length;
    const words = (input.trim().match(/\S+/g) || []).length;
    const lines = input ? input.split("\n").length : 0;
    const sentences = (input.match(/[.!?]+\s+[A-Z]|[.!?]+$/g) || []).length;
    const paragraphs = (input.match(/\n\s*\n/g) || []).length + (input.trim() ? 1 : 0);
    return { chars, charsNoSpaces, words, lines, sentences, paragraphs, readingMin: (words / 238).toFixed(1) };
  }, [input]);
  return (
    <>
      <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:10, marginBottom:14}}>
        {[
          ["Characters", stats.chars],
          ["No spaces",  stats.charsNoSpaces],
          ["Words",      stats.words],
          ["Lines",      stats.lines],
          ["Sentences",  stats.sentences],
          ["Paragraphs", stats.paragraphs],
          ["Reading time", `${stats.readingMin}m`],
          ["Speaking time",`${(stats.words/140).toFixed(1)}m`],
        ].map(([k, v]) => (
          <div key={k} className="card" style={{padding:"16px 18px"}}>
            <div className="mono" style={{fontSize:22, color:"var(--ink)", fontWeight:500}}>{v}</div>
            <div className="mono" style={{fontSize:11, color:"var(--ink-3)", marginTop:4, textTransform:"uppercase", letterSpacing:".06em"}}>{k}</div>
          </div>
        ))}
      </div>
      <div className="io-pane" style={{border:"1px solid var(--line)", borderRadius:"var(--r-lg)", background:"var(--bg-1)", minHeight:320}}>
        <div className="io-pane-header"><span>input</span></div>
        <div className="io-pane-body"><textarea value={input} onChange={e=>setInput(e.target.value)} spellCheck="false" placeholder="Start typing or paste text here…"/></div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TEXT DIFF (line-level)
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
    if (al[i] === bl[j]) { out.push({ kind: "eq", text: al[i] }); i++; j++; }
    else if (dp[i+1][j] >= dp[i][j+1]) { out.push({ kind: "del", text: al[i] }); i++; }
    else { out.push({ kind: "add", text: bl[j] }); j++; }
  }
  while (i < n) { out.push({ kind: "del", text: al[i++] }); }
  while (j < m) { out.push({ kind: "add", text: bl[j++] }); }
  return out;
}
function TextDiffTool() {
  const [left, setLeft] = useState("the quick brown fox\njumps over\nthe lazy dog");
  const [right, setRight] = useState("the quick red fox\njumps over\nthe sleepy dog\nand barks");
  const diff = useMemo(() => diffLines(left, right), [left, right]);
  const stats = useMemo(() => ({
    added:   diff.filter(d => d.kind === "add").length,
    removed: diff.filter(d => d.kind === "del").length,
    same:    diff.filter(d => d.kind === "eq").length,
  }), [diff]);
  return (
    <>
      <div className="io-panel" style={{marginBottom:14}}>
        <div className="io-pane">
          <div className="io-pane-header"><span>left · A</span><span style={{color:"var(--ink-3)"}}>{left.length}b</span></div>
          <div className="io-pane-body"><textarea value={left} onChange={e=>setLeft(e.target.value)} spellCheck="false"/></div>
        </div>
        <div className="io-pane">
          <div className="io-pane-header"><span>right · B</span><span style={{color:"var(--ink-3)"}}>{right.length}b</span></div>
          <div className="io-pane-body"><textarea value={right} onChange={e=>setRight(e.target.value)} spellCheck="false"/></div>
        </div>
      </div>
      <div style={{display:"flex", gap:10, marginBottom:12, fontFamily:"var(--mono)", fontSize:12}}>
        <span className="chip" style={{color:"var(--ok)"}}>+{stats.added} added</span>
        <span className="chip" style={{color:"var(--err)"}}>−{stats.removed} removed</span>
        <span className="chip">{stats.same} unchanged</span>
      </div>
      <div className="card" style={{padding:0, fontFamily:"var(--mono)", fontSize:13}}>
        {diff.map((d, i) => (
          <div key={i} style={{display:"flex", padding:"4px 14px", gap:14, borderBottom: i < diff.length-1 ? "1px solid var(--line)" : "none", background: d.kind === "add" ? "rgba(52,211,153,.06)" : d.kind === "del" ? "rgba(248,113,113,.06)" : "transparent"}}>
            <span style={{width:18, color: d.kind === "add" ? "var(--ok)" : d.kind === "del" ? "var(--err)" : "var(--ink-3)", fontWeight:700}}>{d.kind === "add" ? "+" : d.kind === "del" ? "−" : " "}</span>
            <span style={{flex:1, color: d.kind === "eq" ? "var(--ink-2)" : "var(--ink)", whiteSpace:"pre"}}>{d.text || " "}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FIND & REPLACE
// ════════════════════════════════════════════════════════════════════════════
function FindReplaceTool() {
  const [text, setText] = useState("the quick brown fox jumps over the lazy dog. the dog barks.");
  const [find, setFind] = useState("the");
  const [repl, setRepl] = useState("a");
  const [useRegex, setUseRegex] = useState(false);
  const [caseInsensitive, setCi] = useState(false);
  const result = useMemo(() => {
    if (!find) return { ok: true, output: text, count: 0 };
    try {
      let count = 0;
      const flags = "g" + (caseInsensitive ? "i" : "");
      const re = useRegex ? new RegExp(find, flags) : new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);
      const output = text.replace(re, (m) => { count++; return repl; });
      return { ok: true, output, count };
    } catch (e) { return { ok: false, error: e.message }; }
  }, [text, find, repl, useRegex, caseInsensitive]);
  return (
    <>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14}}>
        <div className="search-box" style={{padding:"10px 14px"}}>
          <span style={{color:"var(--ink-3)", fontFamily:"var(--mono)", fontSize:12}}>find</span>
          <input value={find} onChange={e=>setFind(e.target.value)} spellCheck="false" placeholder={useRegex ? "regex pattern" : "text to find"}/>
        </div>
        <div className="search-box" style={{padding:"10px 14px"}}>
          <span style={{color:"var(--ink-3)", fontFamily:"var(--mono)", fontSize:12}}>replace</span>
          <input value={repl} onChange={e=>setRepl(e.target.value)} spellCheck="false" placeholder="replacement"/>
        </div>
      </div>
      <div style={{display:"flex", gap:8, marginBottom:14, alignItems:"center"}}>
        <label className="chip" style={{cursor:"pointer"}}><input type="checkbox" checked={useRegex} onChange={e=>setUseRegex(e.target.checked)} style={{margin:0}}/> regex</label>
        <label className="chip" style={{cursor:"pointer"}}><input type="checkbox" checked={caseInsensitive} onChange={e=>setCi(e.target.checked)} style={{margin:0}}/> case-insensitive</label>
        <span className="chip accent">{result.ok ? `${result.count} replacement${result.count !== 1 ? "s" : ""}` : "regex error"}</span>
        <div style={{flex:1}}/>
        <CopyBtn value={result.ok ? result.output : ""}/>
      </div>
      <div className="io-panel">
        <div className="io-pane">
          <div className="io-pane-header"><span>input</span><span style={{color:"var(--ink-3)"}}>{text.length}b</span></div>
          <div className="io-pane-body"><textarea value={text} onChange={e=>setText(e.target.value)} spellCheck="false"/></div>
        </div>
        <div className="io-pane">
          <div className="io-pane-header"><span>output</span><span style={{color: result.ok ? "var(--ok)" : "var(--err)"}}>{result.ok ? "✓ ok" : "✗ error"}</span></div>
          <div className="io-pane-body"><pre style={result.ok ? undefined : {color:"var(--err)"}}>{result.ok ? result.output : result.error}</pre></div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TEXT REPEATER
// ════════════════════════════════════════════════════════════════════════════
function TextRepeaterTool() {
  const [text, setText] = useState("hello ");
  const [count, setCount] = useState(10);
  const [sep, setSep] = useState("");
  const out = useMemo(() => {
    const n = Math.max(0, Math.min(count, 100000));
    if (!sep) return text.repeat(n);
    return Array(n).fill(text).join(sep);
  }, [text, count, sep]);
  return (
    <>
      <div style={{display:"flex", gap:10, marginBottom:14, alignItems:"center", flexWrap:"wrap"}}>
        <span className="chip" style={{padding:"2px 10px 2px 12px"}}>
          repeat <input type="range" min="1" max="500" value={count} onChange={e=>setCount(+e.target.value)} style={{width:120, margin:"0 8px"}}/><span className="mono" style={{minWidth:28}}>{count}</span>
        </span>
        <span className="chip" style={{padding:"2px 10px"}}>
          separator <input value={sep} onChange={e=>setSep(e.target.value)} placeholder="(none)" style={{background:"transparent", border:0, outline:0, fontFamily:"var(--mono)", fontSize:12.5, color:"var(--ink)", width:60, marginLeft:6}}/>
        </span>
        <div style={{flex:1}}/>
        <CopyBtn value={out}/>
      </div>
      <div className="io-panel">
        <div className="io-pane">
          <div className="io-pane-header"><span>input · text to repeat</span><span style={{color:"var(--ink-3)"}}>{text.length}b</span></div>
          <div className="io-pane-body"><textarea value={text} onChange={e=>setText(e.target.value)} spellCheck="false"/></div>
        </div>
        <div className="io-pane">
          <div className="io-pane-header"><span>output</span><span style={{color:"var(--ok)"}}>{out.length.toLocaleString()} chars</span></div>
          <div className="io-pane-body"><pre>{out}</pre></div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COUNT OCCURRENCES
// ════════════════════════════════════════════════════════════════════════════
function CountOccurrencesTool() {
  const [text, setText] = useState("The quick brown fox jumps over the lazy dog. The dog barks.");
  const [needle, setNeedle] = useState("the");
  const [useRegex, setUseRegex] = useState(false);
  const [ci, setCi] = useState(true);
  const result = useMemo(() => {
    if (!needle) return { ok: true, count: 0, positions: [] };
    try {
      const flags = "g" + (ci ? "i" : "");
      const re = useRegex ? new RegExp(needle, flags) : new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);
      const matches = [...text.matchAll(re)];
      return { ok: true, count: matches.length, positions: matches.map(m => ({ at: m.index, text: m[0] })) };
    } catch (e) { return { ok: false, error: e.message }; }
  }, [text, needle, useRegex, ci]);
  return (
    <>
      <div style={{display:"flex", gap:10, marginBottom:14, alignItems:"center", flexWrap:"wrap"}}>
        <div className="search-box" style={{flex:1, minWidth:240, fontFamily:"var(--mono)"}}>
          <span style={{color:"var(--ink-3)"}}>find</span>
          <input value={needle} onChange={e=>setNeedle(e.target.value)} spellCheck="false" style={{color:"var(--ink)", fontSize:14}}/>
        </div>
        <label className="chip" style={{cursor:"pointer"}}><input type="checkbox" checked={useRegex} onChange={e=>setUseRegex(e.target.checked)} style={{margin:0}}/> regex</label>
        <label className="chip" style={{cursor:"pointer"}}><input type="checkbox" checked={ci} onChange={e=>setCi(e.target.checked)} style={{margin:0}}/> case-insensitive</label>
        <span className="chip accent">{result.ok ? `${result.count} matches` : "error"}</span>
      </div>
      <div className="io-pane" style={{border:"1px solid var(--line)", borderRadius:"var(--r-lg)", background:"var(--bg-1)", marginBottom:14, minHeight:160}}>
        <div className="io-pane-header"><span>input</span><span style={{color:"var(--ink-3)"}}>{text.length}b · {(text.match(/\S+/g) || []).length} words</span></div>
        <div className="io-pane-body"><textarea value={text} onChange={e=>setText(e.target.value)} spellCheck="false"/></div>
      </div>
      {!result.ok ? <pre style={{color:"var(--err)", padding:14, background:"var(--bg-1)", borderRadius:"var(--r)"}}>{result.error}</pre>
        : result.positions.length === 0 ? <div className="card" style={{padding:24, textAlign:"center", color:"var(--ink-3)"}}>No matches</div>
        : (<div className="card" style={{padding:0, maxHeight:300, overflow:"auto"}}>
            {result.positions.slice(0, 200).map((p, i) => (
              <div key={i} style={{display:"flex", gap:14, padding:"8px 14px", borderBottom: i < Math.min(result.positions.length, 200)-1 ? "1px solid var(--line)" : "none", fontFamily:"var(--mono)", fontSize:13}}>
                <span style={{color:"var(--ink-3)", width:48}}>#{i+1}</span>
                <span style={{color:"var(--ink-3)", width:80}}>at {p.at}</span>
                <span style={{flex:1, color:"var(--ink)"}}>{p.text}</span>
              </div>
            ))}
            {result.positions.length > 200 && <div style={{padding:"10px 14px", textAlign:"center", color:"var(--ink-3)", fontSize:12}}>… {result.positions.length - 200} more</div>}
          </div>)}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TEXT ↔ BINARY
// ════════════════════════════════════════════════════════════════════════════
function TextToBinaryTool() {
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
// UNICODE INSPECTOR
// ════════════════════════════════════════════════════════════════════════════
function unicodeCategory(cp) {
  if (cp < 0x80) {
    if (cp >= 48 && cp <= 57) return "Digit";
    if ((cp >= 65 && cp <= 90) || (cp >= 97 && cp <= 122)) return "Latin Letter";
    if (cp === 32) return "Space";
    if (cp < 32 || cp === 127) return "Control";
    return "ASCII Symbol";
  }
  if (cp >= 0x80 && cp <= 0xFF) return "Latin-1";
  if (cp >= 0x300 && cp <= 0x36F) return "Combining Mark";
  if (cp >= 0x400 && cp <= 0x4FF) return "Cyrillic";
  if (cp >= 0x600 && cp <= 0x6FF) return "Arabic";
  if (cp >= 0x900 && cp <= 0x97F) return "Devanagari";
  if (cp >= 0x2000 && cp <= 0x206F) return "Punctuation";
  if (cp >= 0x2070 && cp <= 0x209F) return "Super/Subscript";
  if (cp >= 0x20A0 && cp <= 0x20CF) return "Currency";
  if (cp >= 0x2190 && cp <= 0x21FF) return "Arrow";
  if (cp >= 0x2200 && cp <= 0x22FF) return "Math Operator";
  if (cp >= 0x2500 && cp <= 0x257F) return "Box Drawing";
  if (cp >= 0x2600 && cp <= 0x26FF) return "Miscellaneous Symbol";
  if (cp >= 0x2700 && cp <= 0x27BF) return "Dingbat";
  if (cp >= 0x3040 && cp <= 0x309F) return "Hiragana";
  if (cp >= 0x30A0 && cp <= 0x30FF) return "Katakana";
  if (cp >= 0x4E00 && cp <= 0x9FFF) return "CJK Ideograph";
  if (cp >= 0x1F300 && cp <= 0x1F9FF) return "Emoji";
  return "Other";
}
function utf8Bytes(cp) {
  if (cp < 0x80) return [cp];
  if (cp < 0x800) return [0xC0 | (cp >> 6), 0x80 | (cp & 0x3F)];
  if (cp < 0x10000) return [0xE0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F)];
  return [0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3F), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F)];
}
function UnicodeInspectorTool() {
  const [text, setText] = useState("Hello 世界 🚀 café");
  const codepoints = useMemo(() => {
    const out = [];
    for (const ch of text) {
      const cp = ch.codePointAt(0);
      out.push({
        char: ch,
        cp,
        hex: "U+" + cp.toString(16).toUpperCase().padStart(4, "0"),
        cat: unicodeCategory(cp),
        utf8: utf8Bytes(cp).map(b => b.toString(16).padStart(2, "0").toUpperCase()).join(" "),
      });
    }
    return out;
  }, [text]);
  return (
    <>
      <div className="io-pane" style={{border:"1px solid var(--line)", borderRadius:"var(--r-lg)", background:"var(--bg-1)", marginBottom:14, minHeight:120}}>
        <div className="io-pane-header"><span>input</span><span style={{color:"var(--ink-3)"}}>{codepoints.length} codepoints · {text.length} JS chars</span></div>
        <div className="io-pane-body"><textarea value={text} onChange={e=>setText(e.target.value)} spellCheck="false"/></div>
      </div>
      <div className="card" style={{padding:0, maxHeight:480, overflow:"auto"}}>
        <table style={{width:"100%", borderCollapse:"collapse", fontSize:13, fontFamily:"var(--mono)"}}>
          <thead style={{position:"sticky", top:0, background:"var(--bg-2)"}}>
            <tr>
              <th style={{padding:"10px 14px", textAlign:"left", borderBottom:"1px solid var(--line)", color:"var(--ink-2)", width:60}}>#</th>
              <th style={{padding:"10px 14px", textAlign:"left", borderBottom:"1px solid var(--line)", color:"var(--ink-2)", width:80}}>char</th>
              <th style={{padding:"10px 14px", textAlign:"left", borderBottom:"1px solid var(--line)", color:"var(--ink-2)"}}>codepoint</th>
              <th style={{padding:"10px 14px", textAlign:"left", borderBottom:"1px solid var(--line)", color:"var(--ink-2)"}}>category</th>
              <th style={{padding:"10px 14px", textAlign:"left", borderBottom:"1px solid var(--line)", color:"var(--ink-2)"}}>UTF-8</th>
              <th style={{padding:"10px 14px", textAlign:"left", borderBottom:"1px solid var(--line)", color:"var(--ink-2)"}}>dec</th>
            </tr>
          </thead>
          <tbody>
            {codepoints.slice(0, 500).map((c, i) => (
              <tr key={i} style={{borderBottom: i < codepoints.length-1 ? "1px solid var(--line)" : "none"}}>
                <td style={{padding:"8px 14px", color:"var(--ink-3)"}}>{i}</td>
                <td style={{padding:"8px 14px", color:"var(--ink)", fontSize:18, fontFamily:"system-ui"}}>{c.char}</td>
                <td style={{padding:"8px 14px", color:"var(--accent-hi)"}}>{c.hex}</td>
                <td style={{padding:"8px 14px", color:"var(--ink-2)"}}>{c.cat}</td>
                <td style={{padding:"8px 14px", color:"var(--ink-2)"}}>{c.utf8}</td>
                <td style={{padding:"8px 14px", color:"var(--ink-3)"}}>{c.cp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {codepoints.length > 500 && <div style={{marginTop:10, fontSize:12, color:"var(--ink-3)", fontFamily:"var(--mono)"}}>showing 500 of {codepoints.length}</div>}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ZALGO GENERATOR
// ════════════════════════════════════════════════════════════════════════════
function ZalgoTool() {
  const [text, setText] = useState("trydevtools");
  const [intensity, setIntensity] = useState(8);
  const out = useMemo(() => {
    const ZALGO_UP = "̍̎̄̅̿̑̆̐͒͗͑̇̈̊͂̓̈́͊͋͌̃̂̌͐̀́̋̏̒̓̔̽̉ͣͤͥͦͧͨͩͪͫͬͭͮͯ̾͛͆̚";
    const ZALGO_MID = "̴̵̶̡̢̧̨̛̀́̕͘͏̸̷͜͟͢͝͞͠͡҉";
    const ZALGO_DOWN = "̖̗̘̙̜̝̞̟̠̤̥̦̩̪̫̬̭̮̯̰̱̲̳̹̺̻̼͇͈͉͍͎͓͔͕͖͙͚̣ͅ";
    let result = "";
    for (const ch of text) {
      result += ch;
      if (ch === " " || ch === "\n") continue;
      const total = Math.floor(intensity * (1 + Math.random() * 0.5));
      for (let k = 0; k < total; k++) {
        const r = Math.random();
        const pool = r < 0.4 ? ZALGO_UP : r < 0.6 ? ZALGO_MID : ZALGO_DOWN;
        result += pool[Math.floor(Math.random() * pool.length)];
      }
    }
    return result;
  }, [text, intensity]);
  return (
    <>
      <div style={{display:"flex", gap:10, marginBottom:14, alignItems:"center", flexWrap:"wrap"}}>
        <span className="chip" style={{padding:"2px 10px 2px 12px"}}>
          intensity <input type="range" min="1" max="20" value={intensity} onChange={e=>setIntensity(+e.target.value)} style={{width:140, margin:"0 8px"}}/><span className="mono" style={{minWidth:22}}>{intensity}</span>
        </span>
        <button className="btn btn-ghost btn-sm" onClick={()=>setText(t => t + "")}>↻ Reroll</button>
        <div style={{flex:1}}/>
        <CopyBtn value={out}/>
      </div>
      <div className="io-panel">
        <div className="io-pane">
          <div className="io-pane-header"><span>input</span></div>
          <div className="io-pane-body"><textarea value={text} onChange={e=>setText(e.target.value)} spellCheck="false"/></div>
        </div>
        <div className="io-pane">
          <div className="io-pane-header"><span>output · cursed</span><span style={{color:"var(--ok)"}}>✓ ok</span></div>
          <div className="io-pane-body"><pre style={{lineHeight:2.4, fontSize:18, fontFamily:"system-ui"}}>{out}</pre></div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FANCY TEXT (Unicode mathematical alphanumeric variants)
// ════════════════════════════════════════════════════════════════════════════
function buildOffsetMap(upperStart, lowerStart, digitStart) {
  const m = {};
  for (let i = 0; i < 26; i++) {
    if (upperStart) m[String.fromCharCode(65 + i)] = String.fromCodePoint(upperStart + i);
    if (lowerStart) m[String.fromCharCode(97 + i)] = String.fromCodePoint(lowerStart + i);
  }
  if (digitStart) for (let i = 0; i < 10; i++) m[String(i)] = String.fromCodePoint(digitStart + i);
  return m;
}
const FANCY_STYLES = {
  "𝐁𝐨𝐥𝐝":           { ...buildOffsetMap(0x1D400, 0x1D41A, 0x1D7CE) },
  "𝐼𝑡𝑎𝑙𝑖𝑐":          { ...buildOffsetMap(0x1D434, 0x1D44E), h: "ℎ" },
  "𝑩𝒐𝒍𝒅 𝑰𝒕𝒂𝒍𝒊𝒄":     { ...buildOffsetMap(0x1D468, 0x1D482) },
  "𝖲𝖺𝗇𝗌-𝗌𝖾𝗋𝗂𝖿":       { ...buildOffsetMap(0x1D5A0, 0x1D5BA, 0x1D7E2) },
  "𝗦𝗮𝗻𝘀 𝗕𝗼𝗹𝗱":        { ...buildOffsetMap(0x1D5D4, 0x1D5EE, 0x1D7EC) },
  "𝙼𝚘𝚗𝚘𝚜𝚙𝚊𝚌𝚎":         { ...buildOffsetMap(0x1D670, 0x1D68A, 0x1D7F6) },
  "𝔻𝕠𝕦𝕓𝕝𝕖-𝕊𝕥𝕣𝕦𝕔𝕜":     {
    ...buildOffsetMap(0x1D538, 0x1D552, 0x1D7D8),
    C: "ℂ", H: "ℍ", N: "ℕ", P: "ℙ", Q: "ℚ", R: "ℝ", Z: "ℤ",
  },
  "𝓢𝓬𝓻𝓲𝓹𝓽":             { ...buildOffsetMap(0x1D4D0, 0x1D4EA) },
  "ＦＵＬＬＷＩＤＴＨ":      (() => {
    const m = {};
    for (let i = 0; i < 26; i++) { m[String.fromCharCode(65+i)] = String.fromCodePoint(0xFF21+i); m[String.fromCharCode(97+i)] = String.fromCodePoint(0xFF41+i); }
    for (let i = 0; i < 10; i++) m[String(i)] = String.fromCodePoint(0xFF10+i);
    m[" "] = "　";
    return m;
  })(),
};
function transformFancy(text, map) {
  let out = "";
  for (const ch of text) out += map[ch] ?? ch;
  return out;
}
function FancyTextTool() {
  const [text, setText] = useState("Hello TryDevTools 123");
  return (
    <>
      <div className="io-pane" style={{border:"1px solid var(--line)", borderRadius:"var(--r-lg)", background:"var(--bg-1)", marginBottom:14, minHeight:120}}>
        <div className="io-pane-header"><span>input · ASCII</span><span style={{color:"var(--ink-3)"}}>{text.length} chars</span></div>
        <div className="io-pane-body"><textarea value={text} onChange={e=>setText(e.target.value)} spellCheck="false"/></div>
      </div>
      <div className="card" style={{padding:0, overflow:"hidden"}}>
        {Object.entries(FANCY_STYLES).map(([name, map], i, arr) => {
          const out = transformFancy(text, map);
          return (
            <div key={name} style={{display:"flex", alignItems:"center", padding:"12px 16px", borderBottom: i < arr.length-1 ? "1px solid var(--line)" : "none", gap:16}}>
              <span style={{fontSize:18, color:"var(--ink-2)", width:200, fontFamily:"system-ui"}}>{name}</span>
              <span style={{flex:1, fontSize:18, color:"var(--ink)", fontFamily:"system-ui", wordBreak:"break-word"}}>{out}</span>
              <button className="btn btn-ghost btn-sm" onClick={()=>navigator.clipboard.writeText(out)}><Icon.Copy/></button>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Register text tools
// ────────────────────────────────────────────────────────────────────────────
window.LIVE_TOOLS = window.LIVE_TOOLS || {};
Object.assign(window.LIVE_TOOLS, {
  "case-converter":     { render: () => <CaseTool/> },
  "word-counter":       { render: () => <WordCounterTool/> },
  "line-sorter":        { render: () => <TextTransformTool defaultInput={"banana\napple\ncherry\napple"} fn={s => [...new Set(s.split("\n"))].sort().join("\n")} inputLabel="input · lines" outputLabel="output · sorted & unique"/> },
  "remove-duplicates":  { render: () => <TextTransformTool defaultInput={"one\ntwo\none\nthree\ntwo"} fn={s => [...new Set(s.split("\n"))].join("\n")} inputLabel="input · lines" outputLabel="output · deduped"/> },
  "text-diff":          { render: () => <TextDiffTool/> },
  "lorem-ipsum":        { render: () => <TextTransformTool defaultInput="5" fn={n => Array(+n||5).fill("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.").join("\n\n")} inputLabel="paragraphs" outputLabel="output"/> },
  "find-replace":       { render: () => <FindReplaceTool/> },
  "slugify":            { render: () => <TextTransformTool defaultInput="Hello World! This is TryDevTools" fn={s => s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")} inputLabel="input · any string" outputLabel="output · slug"/> },
  "whitespace-cleaner": { render: () => <TextTransformTool defaultInput="   hello    world  \n\n\n  trailing   " fn={s => s.split("\n").map(l=>l.trim().replace(/\s+/g," ")).filter(Boolean).join("\n")} inputLabel="input" outputLabel="output · cleaned"/> },
  "reverse-text":       { render: () => <TextTransformTool defaultInput="trydevtools" fn={s => s.split("").reverse().join("")} inputLabel="input" outputLabel="output · reversed"/> },
  "text-repeater":      { render: () => <TextRepeaterTool/> },
  "count-occurrences":  { render: () => <CountOccurrencesTool/> },
  "text-to-binary":     { render: () => <TextToBinaryTool/> },
  "unicode-inspector":  { render: () => <UnicodeInspectorTool/> },
  "zalgo-generator":    { render: () => <ZalgoTool/> },
  "fancy-text":         { render: () => <FancyTextTool/> },
});
