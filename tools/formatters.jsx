// Formatters category — 9 tools
const { useState, useEffect, useMemo } = React;

// ── shared primitives ──────────────────────────────────────────────────────
function usePersistentState(key, init) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; } catch { return init; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }, [key, v]);
  return [v, setV];
}

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

function IOFrame({ inputLabel, outputLabel, input, setInput, output, isError, controls, meta, stacked }) {
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
          <div className="io-pane-body"><pre style={isError ? {color:"var(--err)"} : undefined}>{output}</pre></div>
        </div>
      </div>
      {meta && (<div className="tool-status"><span className={`status-dot ${isError ? "err" : ""}`}/>{meta}<div style={{flex:1}}/><span>processed locally · 0ms network</span></div>)}
    </>
  );
}

// ── lazy-load Prettier 3 + plugins from CDN ────────────────────────────────
// Use a `new Function` indirection so Babel-Standalone's import-to-require
// transform doesn't touch the dynamic import() — we need real ES module loading.
const PRETTIER_BASE = "https://cdn.jsdelivr.net/npm/prettier@3.3.3";
const __dynamicImport = new Function("u", "return import(u)");
const __prettierCache = { core: null, plugins: {} };
async function loadPrettier(pluginNames) {
  if (!__prettierCache.core) __prettierCache.core = await __dynamicImport(`${PRETTIER_BASE}/standalone.mjs`);
  for (const name of pluginNames) {
    if (!__prettierCache.plugins[name]) {
      __prettierCache.plugins[name] = await __dynamicImport(`${PRETTIER_BASE}/plugins/${name}.mjs`);
    }
  }
  const prettier = __prettierCache.core.default || __prettierCache.core;
  const plugins = pluginNames.map(n => __prettierCache.plugins[n].default || __prettierCache.plugins[n]);
  return { prettier, plugins };
}

// ── generic Prettier-backed formatter ──────────────────────────────────────
function PrettierTool({ storageKey, parser, pluginNames, defaultInput, inputLabel, outputLabel, indentToggle = true }) {
  const [input, setInput] = usePersistentState(storageKey, defaultInput);
  const [tabWidth, setTabWidth] = useState(2);
  const [output, setOutput] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    loadPrettier(pluginNames)
      .then(async ({ prettier, plugins }) => {
        if (cancelled) return;
        try {
          const formatted = await prettier.format(input, { parser, plugins, tabWidth, useTabs: false, semi: true, singleQuote: false });
          if (!cancelled) { setOutput(formatted); setError(null); }
        } catch (e) {
          if (!cancelled) setError(e.message);
        } finally { if (!cancelled) setLoading(false); }
      })
      .catch(e => { if (!cancelled) { setError("Failed to load formatter: " + e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [input, parser, tabWidth]);

  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel={inputLabel} outputLabel={outputLabel}
      isError={!!error}
      output={loading ? "loading prettier…" : (error || output)}
      controls={<>
        {indentToggle && <span className="chip" style={{padding:"2px 4px 2px 10px"}}>
          indent
          <span className="segmented" style={{border:0, background:"transparent", padding:0, gridTemplateColumns:"repeat(3,1fr)", marginLeft:6}}>
            {[2, 4, 8].map(n => <button key={n} className={tabWidth===n?"active":""} onClick={()=>setTabWidth(n)}>{n}sp</button>)}
          </span>
        </span>}
        <div style={{flex:1}}/>
        <CopyBtn value={error ? "" : output}/>
      </>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 1. HTML FORMATTER
// ════════════════════════════════════════════════════════════════════════════
function HtmlFormatterTool() {
  return <PrettierTool
    storageKey="dth_fmt_html"
    parser="html"
    pluginNames={["html"]}
    inputLabel="input · HTML"
    outputLabel="output · formatted"
    defaultInput={`<html><head><title>Hello</title></head><body><div class="container"><h1>Title</h1><p>Some text with <strong>emphasis</strong> and <a href="#">a link</a>.</p><ul><li>one</li><li>two</li></ul></div></body></html>`}
  />;
}

// ════════════════════════════════════════════════════════════════════════════
// 2. CSS FORMATTER
// ════════════════════════════════════════════════════════════════════════════
function CssFormatterTool() {
  return <PrettierTool
    storageKey="dth_fmt_css"
    parser="css"
    pluginNames={["postcss"]}
    inputLabel="input · CSS"
    outputLabel="output · formatted"
    defaultInput={`body{font-family:sans-serif;background:#0d0f14;color:#fff;margin:0;padding:0}.btn{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border:1px solid #333;border-radius:8px;background:#181c26;color:inherit;cursor:pointer;transition:all .12s}.btn:hover{background:#232a38;border-color:#6366f1}@media(max-width:768px){.btn{padding:6px 10px;font-size:13px}}`}
  />;
}

// ════════════════════════════════════════════════════════════════════════════
// 3. JS FORMATTER
// ════════════════════════════════════════════════════════════════════════════
function JsFormatterTool() {
  return <PrettierTool
    storageKey="dth_fmt_js"
    parser="babel"
    pluginNames={["babel", "estree"]}
    inputLabel="input · JavaScript"
    outputLabel="output · formatted"
    defaultInput={`function fizzbuzz(n){const out=[];for(let i=1;i<=n;i++){if(i%15===0)out.push("FizzBuzz");else if(i%3===0)out.push("Fizz");else if(i%5===0)out.push("Buzz");else out.push(String(i));}return out;}const result=fizzbuzz(20).filter(s=>s.startsWith("F")).map((s,i)=>({index:i,word:s,length:s.length}));console.log(result);`}
  />;
}

// ════════════════════════════════════════════════════════════════════════════
// 4. TYPESCRIPT FORMATTER
// ════════════════════════════════════════════════════════════════════════════
function TsFormatterTool() {
  return <PrettierTool
    storageKey="dth_fmt_ts"
    parser="typescript"
    pluginNames={["typescript", "estree"]}
    inputLabel="input · TypeScript"
    outputLabel="output · formatted"
    defaultInput={`interface User{id:number;name:string;email?:string;roles:Array<"admin"|"user">;}type Result<T,E>=({ok:true,value:T})|({ok:false,error:E});async function fetchUser<T extends User>(id:number):Promise<Result<T,Error>>{try{const res=await fetch(\`/api/users/\${id}\`);if(!res.ok)throw new Error("not found");return{ok:true,value:await res.json() as T};}catch(e){return{ok:false,error:e as Error};}}`}
  />;
}

// ════════════════════════════════════════════════════════════════════════════
// 5. XML FORMATTER (pure JS, no deps)
// ════════════════════════════════════════════════════════════════════════════
function formatXml(src, indent = "  ") {
  // Strip whitespace between tags
  let xml = src.replace(/>\s+</g, "><").trim();
  // Tokenize on > then split
  let depth = 0;
  const lines = [];
  let i = 0;
  while (i < xml.length) {
    if (xml[i] !== "<") {
      // text content
      const end = xml.indexOf("<", i);
      const text = xml.slice(i, end < 0 ? xml.length : end).trim();
      if (text) lines.push(indent.repeat(depth) + text);
      i = end < 0 ? xml.length : end;
      continue;
    }
    const close = xml.indexOf(">", i);
    if (close < 0) break;
    const tag = xml.slice(i, close + 1);
    const isComment = tag.startsWith("<!--");
    const isDecl = tag.startsWith("<?") || tag.startsWith("<!");
    const isClosing = tag.startsWith("</");
    const isSelfClosing = tag.endsWith("/>");
    if (isComment) {
      const endComment = xml.indexOf("-->", i);
      lines.push(indent.repeat(depth) + xml.slice(i, endComment + 3));
      i = endComment + 3;
      continue;
    }
    if (isClosing) depth = Math.max(0, depth - 1);
    lines.push(indent.repeat(depth) + tag);
    if (!isClosing && !isSelfClosing && !isDecl) depth++;
    i = close + 1;
  }
  return lines.join("\n");
}
function minifyXml(src) {
  return src.replace(/>\s+</g, "><").replace(/\s+/g, " ").trim();
}
function XmlFormatterTool() {
  const [input, setInput] = usePersistentState("dth_fmt_xml", `<?xml version="1.0"?><library><book id="1"><title>Hyperion</title><author>Dan Simmons</author></book><book id="2"><title>Dune</title><author>Frank Herbert</author></book></library>`);
  const [mode, setMode] = useState("pretty");
  const [tabWidth, setTabWidth] = useState(2);
  const result = useMemo(() => {
    if (!input.trim()) return { ok: true, output: "" };
    try {
      const doc = new DOMParser().parseFromString(input, "text/xml");
      const err = doc.querySelector("parsererror");
      if (err) return { ok: false, error: err.textContent.split("\n")[0] };
      return { ok: true, output: mode === "pretty" ? formatXml(input, " ".repeat(tabWidth)) : minifyXml(input) };
    } catch (e) { return { ok: false, error: e.message }; }
  }, [input, mode, tabWidth]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel="input · XML"
      outputLabel={`output · ${mode === "pretty" ? "formatted" : "minified"}`}
      isError={!result.ok}
      output={result.ok ? result.output : result.error}
      controls={<>
        <div className="segmented" style={{width:200}}>
          <button className={mode==="pretty"?"active":""} onClick={()=>setMode("pretty")}>Pretty</button>
          <button className={mode==="minify"?"active":""} onClick={()=>setMode("minify")}>Minify</button>
        </div>
        {mode === "pretty" && <span className="chip" style={{padding:"2px 4px 2px 10px"}}>
          indent
          <span className="segmented" style={{border:0, background:"transparent", padding:0, gridTemplateColumns:"repeat(3,1fr)", marginLeft:6}}>
            {[2, 4, 8].map(n => <button key={n} className={tabWidth===n?"active":""} onClick={()=>setTabWidth(n)}>{n}sp</button>)}
          </span>
        </span>}
        <div style={{flex:1}}/>
        <CopyBtn value={result.ok ? result.output : ""}/>
      </>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 6. SQL FORMATTER (lazy-load sql-formatter from CDN)
// ════════════════════════════════════════════════════════════════════════════
function loadSqlFormatter() {
  if (window.sqlFormatter) return Promise.resolve(window.sqlFormatter);
  if (window.__sqlFmtLoading) return window.__sqlFmtLoading;
  window.__sqlFmtLoading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/sql-formatter@15.4.10/dist/sql-formatter.min.js";
    s.onload = () => resolve(window.sqlFormatter);
    s.onerror = () => reject(new Error("Failed to load sql-formatter"));
    document.head.appendChild(s);
  });
  return window.__sqlFmtLoading;
}
function SqlFormatterTool() {
  const [input, setInput] = usePersistentState("dth_fmt_sql", `select u.id,u.name,count(o.id) as orders,sum(o.total) as revenue from users u left join orders o on o.user_id=u.id where u.active=true and o.created_at>'2024-01-01' group by u.id,u.name having count(o.id)>5 order by revenue desc limit 10;`);
  const [dialect, setDialect] = useState("sql");
  const [tabWidth, setTabWidth] = useState(2);
  const [output, setOutput] = useState("loading sql-formatter…");
  const [error, setError] = useState(null);
  useEffect(() => {
    let cancelled = false;
    loadSqlFormatter().then(sf => {
      if (cancelled) return;
      try {
        const out = sf.format(input, { language: dialect, tabWidth, keywordCase: "upper" });
        setOutput(out); setError(null);
      } catch (e) { setError(e.message); }
    }).catch(e => setError(e.message));
    return () => { cancelled = true; };
  }, [input, dialect, tabWidth]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel="input · SQL"
      outputLabel="output · formatted"
      isError={!!error}
      output={error || output}
      controls={<>
        <span className="chip" style={{padding:"2px 10px"}}>
          dialect
          <select value={dialect} onChange={e=>setDialect(e.target.value)} style={{background:"transparent", border:0, outline:0, fontFamily:"var(--mono)", fontSize:12.5, color:"var(--ink)", marginLeft:6, cursor:"pointer"}}>
            {["sql","postgresql","mysql","sqlite","mariadb","tsql","db2","redshift","snowflake","bigquery","trino","spark"].map(d => <option key={d} value={d} style={{background:"var(--bg-2)"}}>{d}</option>)}
          </select>
        </span>
        <span className="chip" style={{padding:"2px 4px 2px 10px"}}>
          indent
          <span className="segmented" style={{border:0, background:"transparent", padding:0, gridTemplateColumns:"repeat(3,1fr)", marginLeft:6}}>
            {[2, 4, 8].map(n => <button key={n} className={tabWidth===n?"active":""} onClick={()=>setTabWidth(n)}>{n}sp</button>)}
          </span>
        </span>
        <div style={{flex:1}}/>
        <CopyBtn value={error ? "" : output}/>
      </>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 7. GRAPHQL FORMATTER (Prettier with graphql plugin)
// ════════════════════════════════════════════════════════════════════════════
function GraphqlFormatterTool() {
  return <PrettierTool
    storageKey="dth_fmt_gql"
    parser="graphql"
    pluginNames={["graphql"]}
    inputLabel="input · GraphQL"
    outputLabel="output · formatted"
    defaultInput={`query GetUser($id:ID!){user(id:$id){id name email roles{name permissions}orders(first:10,after:null){edges{node{id total status createdAt items{product{name}quantity}}}pageInfo{hasNextPage endCursor}}}}fragment UserSummary on User{id name email}mutation UpdateUser($id:ID!,$input:UserInput!){updateUser(id:$id,input:$input){...UserSummary}}`}
  />;
}

// ════════════════════════════════════════════════════════════════════════════
// 8. GO FORMATTER (basic indenter — gofmt isn't easily portable to browser)
// ════════════════════════════════════════════════════════════════════════════
function formatBraces(src, indent = "\t") {
  // Generic brace-based indenter. Tracks { ( [ depth, ignores chars in strings/comments.
  const lines = src.split("\n");
  const out = [];
  let depth = 0;
  for (let raw of lines) {
    let line = raw.trim();
    if (!line) { out.push(""); continue; }
    // Count opens/closes outside strings and comments
    let opens = 0, closes = 0, leadingClosers = 0;
    let inStr = false, q = null, inBlockComment = false;
    let seenNonClose = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i], next = line[i+1];
      if (inBlockComment) { if (c === "*" && next === "/") { inBlockComment = false; i++; } continue; }
      if (inStr) {
        if (c === "\\") { i++; continue; }
        if (c === q) inStr = false;
        continue;
      }
      if (c === "/" && next === "/") break; // line comment
      if (c === "/" && next === "*") { inBlockComment = true; i++; continue; }
      if (c === '"' || c === "'" || c === "`") { inStr = true; q = c; continue; }
      if (c === "{" || c === "(" || c === "[") { opens++; seenNonClose = true; }
      else if (c === "}" || c === ")" || c === "]") {
        if (!seenNonClose) leadingClosers++;
        closes++;
      } else if (!/\s/.test(c)) seenNonClose = true;
    }
    const lineDepth = Math.max(0, depth - leadingClosers);
    out.push(indent.repeat(lineDepth) + line);
    depth += opens - closes;
    if (depth < 0) depth = 0;
  }
  return out.join("\n");
}
function GoFormatterTool() {
  const [input, setInput] = usePersistentState("dth_fmt_go", `package main\nimport ("fmt" "strings")\nfunc main() {\nname := "world"\nfor i := 0; i < 3; i++ {\nif i % 2 == 0 {\nfmt.Println(strings.ToUpper(name), i)\n} else {\nfmt.Println(name, i)\n}\n}\n}`);
  const [tabWidth, setTabWidth] = useState(0);
  const result = useMemo(() => {
    try {
      const indent = tabWidth === 0 ? "\t" : " ".repeat(tabWidth);
      return { ok: true, output: formatBraces(input, indent) };
    } catch (e) { return { ok: false, error: e.message }; }
  }, [input, tabWidth]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel="input · Go"
      outputLabel="output · indented"
      isError={!result.ok}
      output={result.ok ? result.output : result.error}
      controls={<>
        <span className="chip" style={{padding:"2px 4px 2px 10px"}}>
          indent
          <span className="segmented" style={{border:0, background:"transparent", padding:0, gridTemplateColumns:"repeat(4,1fr)", marginLeft:6}}>
            <button className={tabWidth===0?"active":""} onClick={()=>setTabWidth(0)}>tab</button>
            {[2, 4, 8].map(n => <button key={n} className={tabWidth===n?"active":""} onClick={()=>setTabWidth(n)}>{n}sp</button>)}
          </span>
        </span>
        <div style={{flex:1}}/>
        <CopyBtn value={result.ok ? result.output : ""}/>
      </>}
      meta={<><span style={{color:"var(--ink-3)"}}>basic indenter — runs full <code style={{color:"var(--accent-hi)"}}>gofmt</code> locally for production code</span></>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 9. PYTHON FORMATTER (basic normalizer — Black needs Python)
// ════════════════════════════════════════════════════════════════════════════
function formatPython(src, indentSize = 4) {
  const lines = src.split("\n");
  const out = [];
  let blankRun = 0;
  for (let raw of lines) {
    // Convert tabs to spaces
    let line = raw.replace(/\t/g, " ".repeat(indentSize));
    // Strip trailing whitespace
    line = line.replace(/[ \t]+$/, "");
    if (!line.trim()) { blankRun++; if (blankRun <= 2) out.push(""); continue; }
    blankRun = 0;
    // Normalize leading whitespace to multiples of indentSize
    const leading = line.match(/^\s*/)[0];
    const level = Math.round(leading.length / indentSize);
    out.push(" ".repeat(level * indentSize) + line.trimStart());
  }
  // Remove trailing blank lines, keep one final newline
  while (out.length && out[out.length-1] === "") out.pop();
  return out.join("\n");
}
function PythonFormatterTool() {
  const [input, setInput] = usePersistentState("dth_fmt_py", `def fizzbuzz(n):\n  out=[]\n  for i in range(1,n+1):\n    if i%15==0:\n       out.append("FizzBuzz")\n    elif i%3==0:\n      out.append("Fizz")\n    elif i%5==0:\n      out.append("Buzz")\n    else:\n      out.append(str(i))\n  return out\n\n\n\nprint(fizzbuzz(20))`);
  const [indentSize, setIndentSize] = useState(4);
  const result = useMemo(() => {
    try { return { ok: true, output: formatPython(input, indentSize) }; }
    catch (e) { return { ok: false, error: e.message }; }
  }, [input, indentSize]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel="input · Python"
      outputLabel="output · normalized"
      isError={!result.ok}
      output={result.ok ? result.output : result.error}
      controls={<>
        <span className="chip" style={{padding:"2px 4px 2px 10px"}}>
          indent
          <span className="segmented" style={{border:0, background:"transparent", padding:0, gridTemplateColumns:"repeat(2,1fr)", marginLeft:6}}>
            {[2, 4].map(n => <button key={n} className={indentSize===n?"active":""} onClick={()=>setIndentSize(n)}>{n}sp</button>)}
          </span>
        </span>
        <div style={{flex:1}}/>
        <CopyBtn value={result.ok ? result.output : ""}/>
      </>}
      meta={<><span style={{color:"var(--ink-3)"}}>indent normalizer — for full PEP-8 / Black formatting, run <code style={{color:"var(--accent-hi)"}}>black</code> locally</span></>}
    />
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Register formatters
// ────────────────────────────────────────────────────────────────────────────
window.LIVE_TOOLS = window.LIVE_TOOLS || {};
Object.assign(window.LIVE_TOOLS, {
  "html-formatter":     { render: () => <HtmlFormatterTool/> },
  "css-formatter":      { render: () => <CssFormatterTool/> },
  "js-formatter":       { render: () => <JsFormatterTool/> },
  "ts-formatter":       { render: () => <TsFormatterTool/> },
  "sql-formatter":      { render: () => <SqlFormatterTool/> },
  "xml-formatter":      { render: () => <XmlFormatterTool/> },
  "graphql-formatter":  { render: () => <GraphqlFormatterTool/> },
  "go-formatter":       { render: () => <GoFormatterTool/> },
  "python-formatter":   { render: () => <PythonFormatterTool/> },
});
