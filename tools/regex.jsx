// Regex category — 5 tools
const { useState, useEffect, useMemo } = React;

// ════════════════════════════════════════════════════════════════════════════
// REGEX TESTER
// ════════════════════════════════════════════════════════════════════════════
function RegexTool() {
  const [pattern, setPattern] = useState("\\b([A-Z][a-z]+)\\b");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("The Quick Brown Fox jumps over the Lazy Dog and meets Ada Lovelace.");
  let re, err, matches = [];
  try { re = new RegExp(pattern, flags); matches = [...text.matchAll(re)]; }
  catch (e) { err = e.message; }
  const highlighted = useMemo(() => {
    if (err || !re) return text;
    let last = 0; const parts = [];
    matches.forEach((m) => {
      parts.push(text.slice(last, m.index));
      parts.push(`<mark style="background: var(--accent-soft); color: var(--accent-hi); padding: 1px 2px; border-radius: 3px;">${m[0]}</mark>`);
      last = m.index + m[0].length;
    });
    parts.push(text.slice(last));
    return parts.join("").replace(/\n/g, "<br/>");
  }, [matches, text, err]);
  return (
    <>
      <div style={{display:"flex", gap:8, marginBottom:14, alignItems:"center"}}>
        <div className="search-box" style={{flex:1, fontFamily:"var(--mono)"}}>
          <span style={{color:"var(--ink-3)"}}>/</span>
          <input value={pattern} onChange={e=>setPattern(e.target.value)} spellCheck="false" style={{color: err?"var(--err)":"var(--ink)"}}/>
          <span style={{color:"var(--ink-3)"}}>/</span>
          <input value={flags} onChange={e=>setFlags(e.target.value)} style={{width:50, color:"var(--accent-hi)"}}/>
        </div>
        <span className="chip accent">{err ? "invalid" : `${matches.length} matches`}</span>
      </div>
      <div className="io-pane" style={{border:"1px solid var(--line)", borderRadius:"var(--r-lg)", background:"var(--bg-1)", minHeight:200}}>
        <div className="io-pane-header"><span>test string</span></div>
        <div className="io-pane-body"><textarea value={text} onChange={e=>setText(e.target.value)} spellCheck="false"/></div>
      </div>
      <div className="card" style={{marginTop:14, padding:"16px 18px", lineHeight:1.7, fontFamily:"var(--mono)", fontSize:13.5}}
        dangerouslySetInnerHTML={{__html: err ? `<span style="color:var(--err)">${err}</span>` : highlighted || "<span style='color:var(--ink-3)'>no matches</span>"}}/>
      {matches.length > 0 && (
        <div style={{marginTop:14}}>
          <div className="eyebrow" style={{marginBottom:10}}>matches ({matches.length})</div>
          <div className="card" style={{padding:0}}>
            {matches.slice(0, 20).map((m, i) => (
              <div key={i} style={{display:"flex", gap:16, padding:"8px 14px", borderBottom: i<Math.min(matches.length,20)-1 ? "1px solid var(--line)":0, fontFamily:"var(--mono)", fontSize:12.5}}>
                <span style={{color:"var(--ink-3)", width:32}}>{i}</span>
                <span style={{color:"var(--ink-3)", width:80}}>at {m.index}</span>
                <span style={{flex:1, color:"var(--ink)"}}>{m[0]}</span>
                {m[1] && <span style={{color:"var(--accent-hi)"}}>{m[1]}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
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

// ════════════════════════════════════════════════════════════════════════════
// REGEX CHEATSHEET
// ════════════════════════════════════════════════════════════════════════════
const CHEAT_GROUPS = {
  "Character classes": [
    [".",       "any character except newline"],
    ["\\d",     "a digit (0-9)"],
    ["\\D",     "non-digit"],
    ["\\w",     "word character (a-z, A-Z, 0-9, _)"],
    ["\\W",     "non-word character"],
    ["\\s",     "whitespace (space, tab, newline)"],
    ["\\S",     "non-whitespace"],
    ["[abc]",   "any of a, b or c"],
    ["[^abc]",  "anything except a, b, c"],
    ["[a-z]",   "any character a through z"],
    ["[A-Za-z0-9_]", "alphanumeric or underscore"],
  ],
  "Anchors & boundaries": [
    ["^",       "start of string (or line with /m)"],
    ["$",       "end of string (or line with /m)"],
    ["\\b",     "word boundary"],
    ["\\B",     "non-word boundary"],
    ["\\A",     "start of input (not in JS)"],
    ["\\Z",     "end of input (not in JS)"],
  ],
  "Quantifiers": [
    ["*",       "0 or more (greedy)"],
    ["+",       "1 or more (greedy)"],
    ["?",       "0 or 1 (greedy)"],
    ["{n}",     "exactly n times"],
    ["{n,}",    "n or more times"],
    ["{n,m}",   "between n and m times"],
    ["*?",      "0 or more (lazy)"],
    ["+?",      "1 or more (lazy)"],
    ["??",      "0 or 1 (lazy)"],
  ],
  "Groups & references": [
    ["(abc)",        "capturing group"],
    ["(?:abc)",      "non-capturing group"],
    ["(?<name>abc)", "named capturing group"],
    ["\\1",          "backref to first group"],
    ["\\k<name>",    "backref to named group"],
    ["a|b",          "a or b (alternation)"],
  ],
  "Lookarounds": [
    ["(?=abc)",  "lookahead — followed by abc"],
    ["(?!abc)",  "negative lookahead"],
    ["(?<=abc)", "lookbehind — preceded by abc"],
    ["(?<!abc)", "negative lookbehind"],
  ],
  "Escapes & special": [
    ["\\n",  "newline"],
    ["\\r",  "carriage return"],
    ["\\t",  "tab"],
    ["\\0",  "null character"],
    ["\\xFF", "hex byte"],
    ["\\uFFFF", "unicode codepoint"],
    ["\\.",  "literal . (escape any metachar)"],
  ],
  "Flags (JavaScript)": [
    ["g",  "global — find all matches"],
    ["i",  "case-insensitive"],
    ["m",  "multiline — ^ and $ match per line"],
    ["s",  "dotall — . matches newline"],
    ["u",  "unicode — proper handling of high codepoints"],
    ["y",  "sticky — match at lastIndex only"],
    ["d",  "indices — match.indices contains start/end"],
  ],
};
function RegexCheatsheetTool() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q.trim()) return CHEAT_GROUPS;
    const n = q.toLowerCase();
    const out = {};
    for (const [group, rows] of Object.entries(CHEAT_GROUPS)) {
      const match = rows.filter(([sym, desc]) => sym.toLowerCase().includes(n) || desc.toLowerCase().includes(n));
      if (match.length) out[group] = match;
    }
    return out;
  }, [q]);
  return (
    <>
      <div style={{display:"flex", gap:10, marginBottom:14, alignItems:"center"}}>
        <div className="search-box" style={{flex:1}}>
          <Icon.Search style={{color:"var(--ink-3)"}}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search metacharacters or descriptions" spellCheck="false" style={{fontSize:14}}/>
          {q && <button onClick={()=>setQ("")} style={{color:"var(--ink-3)", display:"flex"}}><Icon.X/></button>}
        </div>
      </div>
      {Object.entries(filtered).map(([group, rows]) => (
        <div key={group} style={{marginBottom:14}}>
          <div className="eyebrow" style={{marginBottom:8}}>{group}</div>
          <div className="card" style={{padding:0, overflow:"hidden"}}>
            {rows.map(([sym, desc], i) => (
              <div key={sym} style={{display:"flex", alignItems:"center", padding:"10px 16px", borderBottom: i < rows.length-1 ? "1px solid var(--line)" : "none", gap:14}}>
                <code style={{fontFamily:"var(--mono)", fontSize:14, color:"var(--accent-hi)", width:120, fontWeight:600}}>{sym}</code>
                <span style={{flex:1, fontSize:13.5, color:"var(--ink)"}}>{desc}</span>
                <button className="btn btn-ghost btn-sm" onClick={()=>navigator.clipboard.writeText(sym)}><Icon.Copy/></button>
              </div>
            ))}
          </div>
        </div>
      ))}
      {Object.keys(filtered).length === 0 && <div className="card" style={{padding:32, textAlign:"center", color:"var(--ink-3)"}}>No matches</div>}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// REGEX BUILDER (visual block-based)
// ════════════════════════════════════════════════════════════════════════════
const BLOCKS = [
  { id: "start",    label: "Start",          pattern: "^" },
  { id: "end",      label: "End",            pattern: "$" },
  { id: "anyChar",  label: "Any character",  pattern: "." },
  { id: "digit",    label: "Digit",          pattern: "\\d" },
  { id: "letter",   label: "Letter",         pattern: "[a-zA-Z]" },
  { id: "alphanum", label: "Alphanumeric",   pattern: "[a-zA-Z0-9]" },
  { id: "wordChar", label: "Word char",      pattern: "\\w" },
  { id: "ws",       label: "Whitespace",     pattern: "\\s" },
  { id: "wordBound",label: "Word boundary",  pattern: "\\b" },
  { id: "literal",  label: "Literal text",   pattern: "", needsValue: true, placeholder: "abc" },
  { id: "charSet",  label: "One of [...]",   pattern: "[%]", needsValue: true, placeholder: "abc" },
  { id: "notSet",   label: "None of [^...]", pattern: "[^%]", needsValue: true, placeholder: "abc" },
];
const QUANTIFIERS = [
  { id: "one",       label: "exactly 1",     suffix: "" },
  { id: "optional",  label: "0 or 1 (?)",    suffix: "?" },
  { id: "any",       label: "0 or more (*)", suffix: "*" },
  { id: "some",      label: "1 or more (+)", suffix: "+" },
  { id: "exact",     label: "exactly N",     suffix: "{%}", needsValue: true },
  { id: "atLeast",   label: "N or more",     suffix: "{%,}", needsValue: true },
  { id: "between",   label: "N to M",        suffix: "{%}", needsValue: true, placeholder: "2,5" },
];
function escapeLiteral(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function RegexBuilderTool() {
  const [parts, setParts] = useState([
    { block: "start", value: "", quant: "one", quantValue: "" },
    { block: "letter", value: "", quant: "some", quantValue: "" },
    { block: "literal", value: "@", quant: "one", quantValue: "" },
    { block: "letter", value: "", quant: "some", quantValue: "" },
    { block: "literal", value: ".com", quant: "one", quantValue: "" },
    { block: "end", value: "", quant: "one", quantValue: "" },
  ]);
  const [flags, setFlags] = useState("g");
  const [testText, setTestText] = useState("Contact ada@example.com or alan@trydev.com today!");
  const updatePart = (i, key, val) => setParts(prev => prev.map((p, j) => j === i ? { ...p, [key]: val } : p));
  const addPart = () => setParts(prev => [...prev, { block: "anyChar", value: "", quant: "one", quantValue: "" }]);
  const removePart = (i) => setParts(prev => prev.filter((_, j) => j !== i));
  const movePart = (i, dir) => setParts(prev => {
    const out = [...prev]; const j = i + dir;
    if (j < 0 || j >= out.length) return prev;
    [out[i], out[j]] = [out[j], out[i]];
    return out;
  });
  const pattern = useMemo(() => {
    let p = "";
    for (const part of parts) {
      const block = BLOCKS.find(b => b.id === part.block);
      if (!block) continue;
      let unit;
      if (block.id === "literal") unit = escapeLiteral(part.value || "");
      else if (block.needsValue) unit = block.pattern.replace("%", part.value || "");
      else unit = block.pattern;
      const q = QUANTIFIERS.find(qq => qq.id === part.quant);
      let suffix = q?.suffix || "";
      if (q?.needsValue) suffix = suffix.replace("%", part.quantValue || "1");
      p += unit + suffix;
    }
    return p;
  }, [parts]);
  let re, err, matches = [];
  try { re = new RegExp(pattern, flags); matches = [...testText.matchAll(re)]; } catch (e) { err = e.message; }
  return (
    <>
      <div className="card" style={{padding:0, overflow:"hidden", marginBottom:14}}>
        {parts.map((part, i) => {
          const block = BLOCKS.find(b => b.id === part.block);
          const q = QUANTIFIERS.find(qq => qq.id === part.quant);
          return (
            <div key={i} style={{display:"flex", alignItems:"center", padding:"10px 16px", borderBottom: i < parts.length-1 ? "1px solid var(--line)" : "none", gap:8, flexWrap:"wrap"}}>
              <span className="mono" style={{fontSize:11, color:"var(--ink-3)", width:24}}>#{i+1}</span>
              <select value={part.block} onChange={e=>updatePart(i, "block", e.target.value)} style={{padding:"6px 10px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", fontSize:12.5, cursor:"pointer", outline:"none"}}>
                {BLOCKS.map(b => <option key={b.id} value={b.id} style={{background:"var(--bg-2)"}}>{b.label}</option>)}
              </select>
              {block?.needsValue && (
                <input value={part.value} onChange={e=>updatePart(i, "value", e.target.value)} placeholder={block.placeholder} style={{width:120, padding:"6px 10px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", fontSize:12.5, outline:"none"}}/>
              )}
              <span style={{fontSize:11, color:"var(--ink-3)"}}>×</span>
              <select value={part.quant} onChange={e=>updatePart(i, "quant", e.target.value)} style={{padding:"6px 10px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", fontSize:12.5, cursor:"pointer", outline:"none"}}>
                {QUANTIFIERS.map(qq => <option key={qq.id} value={qq.id} style={{background:"var(--bg-2)"}}>{qq.label}</option>)}
              </select>
              {q?.needsValue && (
                <input value={part.quantValue} onChange={e=>updatePart(i, "quantValue", e.target.value)} placeholder={q.placeholder || "3"} style={{width:60, padding:"6px 10px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", fontSize:12.5, outline:"none"}}/>
              )}
              <div style={{flex:1}}/>
              <button className="btn btn-ghost btn-sm" onClick={()=>movePart(i, -1)} disabled={i===0}>↑</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>movePart(i, 1)} disabled={i===parts.length-1}>↓</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>removePart(i)}><Icon.Trash/></button>
            </div>
          );
        })}
      </div>
      <div style={{display:"flex", gap:10, marginBottom:14}}>
        <button className="btn btn-ghost btn-sm" onClick={addPart}>+ Add block</button>
      </div>
      <div className="card" style={{padding:"18px 22px", marginBottom:14, background: err ? "rgba(248,113,113,.06)" : "var(--accent-soft)", borderColor: err ? "rgba(248,113,113,.3)" : "rgba(99,102,241,.3)"}}>
        <div className="eyebrow" style={{marginBottom:6}}>regex</div>
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          <code style={{flex:1, fontSize:18, fontFamily:"var(--mono)", color: err ? "var(--err)" : "var(--accent-hi)", fontWeight:600, wordBreak:"break-all"}}>/{pattern || "(empty)"}/<input value={flags} onChange={e=>setFlags(e.target.value)} style={{display:"inline", width:60, marginLeft:4, padding:"2px 6px", background:"var(--bg-2)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--accent-hi)", fontFamily:"var(--mono)", fontSize:14, outline:"none"}}/></code>
          <CopyBtn value={pattern}/>
        </div>
        {err && <div style={{marginTop:8, fontSize:12.5, color:"var(--err)", fontFamily:"var(--mono)"}}>{err}</div>}
      </div>
      <div className="card" style={{padding:14}}>
        <div className="eyebrow" style={{marginBottom:8}}>test against</div>
        <textarea value={testText} onChange={e=>setTestText(e.target.value)} spellCheck="false" style={{width:"100%", padding:"10px 12px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", fontSize:13, minHeight:80, resize:"vertical", outline:"none"}}/>
        <div style={{marginTop:10, fontFamily:"var(--mono)", fontSize:12, color:err ? "var(--err)" : matches.length ? "var(--ok)" : "var(--ink-3)"}}>
          {err ? "invalid regex" : matches.length ? `${matches.length} match${matches.length !== 1 ? "es" : ""}: ${matches.slice(0, 5).map(m => `"${m[0]}"`).join(", ")}` : "no matches"}
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// REGEX LIBRARY (common patterns)
// ════════════════════════════════════════════════════════════════════════════
const REGEX_LIBRARY = [
  { name: "Email",                     pattern: "^[\\w.+-]+@[\\w-]+\\.[\\w.-]+$",                     example: "ada@example.com",          cat: "Validation" },
  { name: "URL (http/https)",          pattern: "^https?://[\\w.-]+(?:\\.[\\w.-]+)+[\\w\\-._~:/?#[\\]@!$&'()*+,;=]+$", example: "https://example.com/path", cat: "Validation" },
  { name: "IPv4 address",              pattern: "^(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$", example: "192.168.1.1", cat: "Network" },
  { name: "IPv6 address",              pattern: "^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$",        example: "2001:db8::1",              cat: "Network" },
  { name: "MAC address",               pattern: "^(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$",          example: "AA:BB:CC:DD:EE:FF",        cat: "Network" },
  { name: "UUID v4",                   pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$", example: "f47ac10b-58cc-4372-a567-0e02b2c3d479", cat: "ID" },
  { name: "Hex color",                 pattern: "^#(?:[0-9a-fA-F]{3}){1,2}$",                         example: "#84cc16",                  cat: "Format" },
  { name: "RGB color",                 pattern: "^rgb\\(\\s*\\d{1,3}\\s*,\\s*\\d{1,3}\\s*,\\s*\\d{1,3}\\s*\\)$", example: "rgb(132, 204, 22)", cat: "Format" },
  { name: "ISO 8601 date",             pattern: "^\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$", example: "2026-05-02",              cat: "Format" },
  { name: "Time HH:MM (24h)",          pattern: "^(?:[01]\\d|2[0-3]):[0-5]\\d$",                      example: "13:45",                    cat: "Format" },
  { name: "US phone number",           pattern: "^\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}$",      example: "(555) 123-4567",           cat: "Validation" },
  { name: "US ZIP code",               pattern: "^\\d{5}(?:-\\d{4})?$",                                example: "94103-1234",                cat: "Validation" },
  { name: "Credit card (any 13-19)",   pattern: "^\\d{13,19}$",                                        example: "4111111111111111",          cat: "Validation" },
  { name: "Visa card",                 pattern: "^4\\d{12}(?:\\d{3})?$",                              example: "4111111111111111",          cat: "Validation" },
  { name: "MasterCard",                pattern: "^5[1-5]\\d{14}$",                                    example: "5500000000000004",          cat: "Validation" },
  { name: "Strong password",           pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*]).{8,}$", example: "Hunter2!",              cat: "Validation" },
  { name: "Slug (URL-safe)",           pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",                          example: "my-blog-post",              cat: "Format" },
  { name: "Hashtag",                   pattern: "#[A-Za-z][A-Za-z0-9_]*",                              example: "#trydevtools",              cat: "Web" },
  { name: "Mention",                   pattern: "@[A-Za-z][A-Za-z0-9_]*",                              example: "@anthropic",                cat: "Web" },
  { name: "HTML tag (open or close)",  pattern: "</?[a-z][a-zA-Z0-9]*(?:\\s[^>]*)?>",                  example: "<a href=\"#\">",            cat: "Web" },
  { name: "Number with decimals",      pattern: "^-?\\d+(?:\\.\\d+)?$",                                example: "-3.14",                     cat: "Format" },
  { name: "Integer only",              pattern: "^-?\\d+$",                                            example: "-42",                       cat: "Format" },
  { name: "Markdown link",             pattern: "\\[([^\\]]+)\\]\\(([^)]+)\\)",                        example: "[label](url)",              cat: "Web" },
  { name: "GitHub repo path",          pattern: "^[\\w.-]+/[\\w.-]+$",                                 example: "anthropic/claude-cookbook", cat: "Web" },
];
function RegexLibraryTool() {
  const [q, setQ] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const filtered = useMemo(() => {
    if (!q.trim()) return REGEX_LIBRARY;
    const n = q.toLowerCase();
    return REGEX_LIBRARY.filter(r => r.name.toLowerCase().includes(n) || r.cat.toLowerCase().includes(n) || r.pattern.toLowerCase().includes(n));
  }, [q]);
  const active = filtered[activeIdx] || filtered[0];
  const [test, setTest] = useState(active?.example || "");
  useEffect(() => { setTest(active?.example || ""); }, [active?.pattern]);
  let m = null, err = null;
  if (active) { try { m = new RegExp(active.pattern).test(test); } catch (e) { err = e.message; } }
  return (
    <>
      <div style={{display:"flex", gap:10, marginBottom:14, alignItems:"center"}}>
        <div className="search-box" style={{flex:1}}>
          <Icon.Search style={{color:"var(--ink-3)"}}/>
          <input value={q} onChange={e=>{setQ(e.target.value); setActiveIdx(0);}} placeholder={`Search ${REGEX_LIBRARY.length} patterns…`} spellCheck="false" style={{fontSize:14}}/>
          {q && <button onClick={()=>setQ("")} style={{color:"var(--ink-3)", display:"flex"}}><Icon.X/></button>}
        </div>
        <span className="chip accent">{filtered.length} match{filtered.length !== 1 ? "es" : ""}</span>
      </div>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1.5fr", gap:14}}>
        <div className="card" style={{padding:0, overflow:"hidden", maxHeight:520, overflowY:"auto"}}>
          {filtered.map((r, i) => (
            <div key={r.name} onClick={()=>setActiveIdx(i)} style={{padding:"10px 14px", borderBottom: i < filtered.length-1 ? "1px solid var(--line)" : "none", cursor:"pointer", background: i === activeIdx ? "var(--accent-soft)" : "transparent", borderLeft: i === activeIdx ? "3px solid var(--accent)" : "3px solid transparent"}}>
              <div style={{fontSize:13, fontWeight:600, color: i === activeIdx ? "var(--accent-hi)" : "var(--ink)"}}>{r.name}</div>
              <div style={{fontSize:11, fontFamily:"var(--mono)", color:"var(--ink-3)", marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{r.cat} · {r.pattern.slice(0, 30)}…</div>
            </div>
          ))}
        </div>
        {active && (
          <div>
            <div className="card" style={{padding:18, marginBottom:14}}>
              <div className="eyebrow" style={{marginBottom:6}}>{active.name} · {active.cat}</div>
              <code style={{display:"block", fontSize:14, fontFamily:"var(--mono)", color:"var(--accent-hi)", padding:"10px 12px", background:"var(--bg-2)", borderRadius:"var(--r)", wordBreak:"break-all", marginBottom:10}}>{active.pattern}</code>
              <CopyBtn value={active.pattern} label="Copy regex"/>
            </div>
            <div className="card" style={{padding:14}}>
              <div className="eyebrow" style={{marginBottom:8}}>test value</div>
              <input value={test} onChange={e=>setTest(e.target.value)} spellCheck="false" style={{width:"100%", fontSize:14, padding:"8px 12px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}}/>
              <div style={{marginTop:10, fontFamily:"var(--mono)", fontSize:13, color: err ? "var(--err)" : m ? "var(--ok)" : "var(--err)"}}>{err ? `error: ${err}` : m ? "✓ matches" : "✗ does not match"}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// REGEX REPLACE (with capture groups)
// ════════════════════════════════════════════════════════════════════════════
function RegexReplaceTool() {
  const [text, setText] = useState("Ada Lovelace, born 1815. Alan Turing, born 1912. Grace Hopper, born 1906.");
  const [pattern, setPattern] = useState("(\\w+) (\\w+), born (\\d{4})");
  const [replacement, setReplacement] = useState("$2, $1 ($3)");
  const [flags, setFlags] = useState("g");
  const result = useMemo(() => {
    if (!pattern) return { ok: true, output: text, count: 0 };
    try {
      let count = 0;
      const re = new RegExp(pattern, flags);
      const out = text.replace(re, (...args) => { count++; return replacement.replace(/\$(\d+|&|`|')/g, (m, k) => {
        if (k === "&") return args[0];
        if (k === "`") return args[args.length - 1].slice(0, args[args.length - 2]);
        if (k === "'") return args[args.length - 1].slice(args[args.length - 2] + args[0].length);
        const idx = +k;
        return args[idx] !== undefined ? args[idx] : m;
      }); });
      return { ok: true, output: out, count };
    } catch (e) { return { ok: false, error: e.message }; }
  }, [text, pattern, replacement, flags]);
  return (
    <>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 80px", gap:10, marginBottom:14}}>
        <div className="card" style={{padding:14}}>
          <div className="eyebrow" style={{marginBottom:6}}>pattern</div>
          <input value={pattern} onChange={e=>setPattern(e.target.value)} spellCheck="false" style={{width:"100%", fontSize:14, padding:"8px 12px", background:"var(--bg-1)", border:`1px solid ${result.ok ? "var(--line)" : "var(--err)"}`, borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}}/>
        </div>
        <div className="card" style={{padding:14}}>
          <div className="eyebrow" style={{marginBottom:6}}>replacement (use $1, $2, $&)</div>
          <input value={replacement} onChange={e=>setReplacement(e.target.value)} spellCheck="false" style={{width:"100%", fontSize:14, padding:"8px 12px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}}/>
        </div>
        <div className="card" style={{padding:14}}>
          <div className="eyebrow" style={{marginBottom:6}}>flags</div>
          <input value={flags} onChange={e=>setFlags(e.target.value)} spellCheck="false" style={{width:"100%", fontSize:14, padding:"8px 12px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--accent-hi)", fontFamily:"var(--mono)", outline:"none", textAlign:"center"}}/>
        </div>
      </div>
      <div className="io-panel">
        <div className="io-pane">
          <div className="io-pane-header"><span>input</span><span style={{color:"var(--ink-3)"}}>{text.length} chars</span></div>
          <div className="io-pane-body"><textarea value={text} onChange={e=>setText(e.target.value)} spellCheck="false"/></div>
        </div>
        <div className="io-pane">
          <div className="io-pane-header"><span>output</span><span style={{color: result.ok ? "var(--ok)" : "var(--err)"}}>{result.ok ? `${result.count} replacement${result.count !== 1 ? "s" : ""}` : "✗ error"}</span></div>
          <div className="io-pane-body"><pre style={result.ok ? undefined : {color:"var(--err)"}}>{result.ok ? result.output : result.error}</pre></div>
        </div>
      </div>
      <div style={{marginTop:14, padding:"12px 16px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r-lg)", fontSize:12.5, color:"var(--ink-2)", lineHeight:1.7}}>
        <div style={{fontFamily:"var(--mono)", color:"var(--ink-3)", fontSize:11, marginBottom:6, textTransform:"uppercase", letterSpacing:".06em"}}>replacement tokens</div>
        <code style={{color:"var(--accent-hi)"}}>$1 $2 …</code> capture groups · <code style={{color:"var(--accent-hi)"}}>$&</code> entire match · <code style={{color:"var(--accent-hi)"}}>$`</code> before match · <code style={{color:"var(--accent-hi)"}}>$'</code> after match
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
window.LIVE_TOOLS = window.LIVE_TOOLS || {};
Object.assign(window.LIVE_TOOLS, {
  "regex-tester":     { render: () => <RegexTool/> },
  "regex-cheatsheet": { render: () => <RegexCheatsheetTool/> },
  "regex-builder":    { render: () => <RegexBuilderTool/> },
  "regex-library":    { render: () => <RegexLibraryTool/> },
  "regex-replace":    { render: () => <RegexReplaceTool/> },
});
