// Converters category — 10 tools
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

// ── lazy-load js-yaml ──────────────────────────────────────────────────────
function loadJsYaml() {
  if (window.jsyaml) return Promise.resolve(window.jsyaml);
  if (window.__yamlLoading) return window.__yamlLoading;
  window.__yamlLoading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js";
    s.onload = () => resolve(window.jsyaml);
    s.onerror = () => reject(new Error("Failed to load js-yaml"));
    document.head.appendChild(s);
  });
  return window.__yamlLoading;
}
function useJsYaml() {
  const [ready, setReady] = useState(!!window.jsyaml);
  const [error, setError] = useState(null);
  useEffect(() => { if (!ready) loadJsYaml().then(() => setReady(true)).catch(e => setError(e.message)); }, []);
  return { ready, error };
}

// ════════════════════════════════════════════════════════════════════════════
// 1. YAML ↔ JSON
// ════════════════════════════════════════════════════════════════════════════
function YamlToJsonTool() {
  const [mode, setMode] = useState("toJson");
  const [input, setInput] = usePersistentState("dth_yaml_json_in", `name: trydevtools
version: 1
features:
  - fast
  - private
  - free
config:
  theme: dark
  density: compact`);
  const { ready, error: loadError } = useJsYaml();
  const result = useMemo(() => {
    if (loadError) return { ok: false, error: loadError };
    if (!ready) return { ok: true, output: "loading js-yaml…" };
    if (!input.trim()) return { ok: true, output: "" };
    try {
      if (mode === "toJson") {
        const obj = window.jsyaml.load(input);
        return { ok: true, output: JSON.stringify(obj, null, 2) };
      } else {
        const obj = JSON.parse(input);
        return { ok: true, output: window.jsyaml.dump(obj, { lineWidth: 120, noRefs: true }) };
      }
    } catch (e) { return { ok: false, error: e.message }; }
  }, [input, mode, ready, loadError]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel={`input · ${mode === "toJson" ? "YAML" : "JSON"}`}
      outputLabel={`output · ${mode === "toJson" ? "JSON" : "YAML"}`}
      isError={!result.ok}
      output={result.ok ? result.output : result.error}
      controls={<>
        <div className="segmented" style={{width:240}}>
          <button className={mode==="toJson"?"active":""} onClick={()=>setMode("toJson")}>YAML → JSON</button>
          <button className={mode==="toYaml"?"active":""} onClick={()=>setMode("toYaml")}>JSON → YAML</button>
        </div>
        <div style={{flex:1}}/>
        <CopyBtn value={result.ok ? result.output : ""}/>
      </>}
      outputRich={result.ok && mode === "toJson" ? <pre dangerouslySetInnerHTML={{__html: highlightJSON(result.output)}}/> : undefined}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 2. XML ↔ JSON
// ════════════════════════════════════════════════════════════════════════════
function xmlNodeToJson(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const t = node.nodeValue.trim();
    return t || null;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  const result = {};
  if (node.attributes && node.attributes.length) {
    for (const attr of node.attributes) result[`@${attr.name}`] = attr.value;
  }
  const children = Array.from(node.childNodes).filter(c => c.nodeType === Node.ELEMENT_NODE || (c.nodeType === Node.TEXT_NODE && c.nodeValue.trim()));
  if (children.length === 0) return Object.keys(result).length ? result : null;
  if (children.length === 1 && children[0].nodeType === Node.TEXT_NODE) {
    if (Object.keys(result).length === 0) return children[0].nodeValue.trim();
    result["#text"] = children[0].nodeValue.trim();
    return result;
  }
  for (const child of children) {
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const childData = xmlNodeToJson(child);
    if (result[child.nodeName] !== undefined) {
      if (!Array.isArray(result[child.nodeName])) result[child.nodeName] = [result[child.nodeName]];
      result[child.nodeName].push(childData);
    } else {
      result[child.nodeName] = childData;
    }
  }
  return result;
}
function jsonToXml(obj, name = "root", indent = 0) {
  const pad = "  ".repeat(indent);
  if (obj === null || obj === undefined) return `${pad}<${name}/>`;
  if (typeof obj !== "object") return `${pad}<${name}>${String(obj).replace(/&/g,"&amp;").replace(/</g,"&lt;")}</${name}>`;
  if (Array.isArray(obj)) return obj.map(v => jsonToXml(v, name, indent)).join("\n");
  const keys = Object.keys(obj);
  const attrs = keys.filter(k => k.startsWith("@"));
  const text = keys.includes("#text") ? obj["#text"] : null;
  const childKeys = keys.filter(k => !k.startsWith("@") && k !== "#text");
  const attrStr = attrs.length ? " " + attrs.map(a => `${a.slice(1)}="${String(obj[a]).replace(/"/g,"&quot;")}"`).join(" ") : "";
  if (childKeys.length === 0 && text === null) return `${pad}<${name}${attrStr}/>`;
  if (childKeys.length === 0 && text !== null) return `${pad}<${name}${attrStr}>${text}</${name}>`;
  const inner = childKeys.map(k => jsonToXml(obj[k], k, indent + 1)).join("\n");
  return `${pad}<${name}${attrStr}>\n${inner}\n${pad}</${name}>`;
}
function XmlToJsonTool() {
  const [mode, setMode] = useState("toJson");
  const [input, setInput] = usePersistentState("dth_xml_json_in", `<?xml version="1.0"?>
<library>
  <book id="1">
    <title>Hyperion</title>
    <author>Dan Simmons</author>
  </book>
  <book id="2">
    <title>Dune</title>
    <author>Frank Herbert</author>
  </book>
</library>`);
  const result = useMemo(() => {
    if (!input.trim()) return { ok: true, output: "" };
    try {
      if (mode === "toJson") {
        const doc = new DOMParser().parseFromString(input, "text/xml");
        const err = doc.querySelector("parsererror");
        if (err) throw new Error(err.textContent.split("\n")[0]);
        const root = doc.documentElement;
        const obj = { [root.nodeName]: xmlNodeToJson(root) };
        return { ok: true, output: JSON.stringify(obj, null, 2) };
      } else {
        const obj = JSON.parse(input);
        const keys = Object.keys(obj);
        if (keys.length !== 1) throw new Error("Top-level JSON must have exactly one root key");
        const xml = jsonToXml(obj[keys[0]], keys[0]);
        return { ok: true, output: `<?xml version="1.0" encoding="UTF-8"?>\n${xml}` };
      }
    } catch (e) { return { ok: false, error: e.message }; }
  }, [input, mode]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel={`input · ${mode === "toJson" ? "XML" : "JSON"}`}
      outputLabel={`output · ${mode === "toJson" ? "JSON" : "XML"}`}
      isError={!result.ok}
      output={result.ok ? result.output : result.error}
      controls={<>
        <div className="segmented" style={{width:240}}>
          <button className={mode==="toJson"?"active":""} onClick={()=>setMode("toJson")}>XML → JSON</button>
          <button className={mode==="toXml"?"active":""} onClick={()=>setMode("toXml")}>JSON → XML</button>
        </div>
        <div style={{flex:1}}/>
        <CopyBtn value={result.ok ? result.output : ""}/>
      </>}
      outputRich={result.ok && mode === "toJson" ? <pre dangerouslySetInnerHTML={{__html: highlightJSON(result.output)}}/> : undefined}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 3. TOML → JSON (basic parser, common cases)
// ════════════════════════════════════════════════════════════════════════════
function parseTomlValue(s) {
  s = s.trim();
  if (!s) return null;
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1).replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  if (s === "true") return true;
  if (s === "false") return false;
  if (/^-?\d+$/.test(s.replace(/_/g, ""))) return parseInt(s.replace(/_/g, ""), 10);
  if (/^-?\d+\.\d+$/.test(s.replace(/_/g, ""))) return parseFloat(s.replace(/_/g, ""));
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s;
  if (s.startsWith("[") && s.endsWith("]")) {
    const inner = s.slice(1, -1);
    return splitTomlList(inner).map(parseTomlValue);
  }
  if (s.startsWith("{") && s.endsWith("}")) {
    const inner = s.slice(1, -1);
    const obj = {};
    for (const part of splitTomlList(inner)) {
      const eq = part.indexOf("=");
      if (eq < 0) continue;
      obj[part.slice(0, eq).trim().replace(/^"|"$/g, "")] = parseTomlValue(part.slice(eq + 1));
    }
    return obj;
  }
  return s;
}
function splitTomlList(s) {
  const out = []; let depth = 0, inStr = false, q = null, cur = "";
  for (const c of s) {
    if (inStr) { if (c === q) inStr = false; cur += c; }
    else if (c === '"' || c === "'") { inStr = true; q = c; cur += c; }
    else if (c === "[" || c === "{") { depth++; cur += c; }
    else if (c === "]" || c === "}") { depth--; cur += c; }
    else if (c === "," && depth === 0) { if (cur.trim()) out.push(cur.trim()); cur = ""; }
    else cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
function parseToml(src) {
  const root = {};
  let cur = root;
  const lines = src.split("\n");
  let buf = "";
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // strip comments outside strings (basic — not perfect)
    const hashIdx = (() => {
      let inStr = false, q = null;
      for (let j = 0; j < line.length; j++) {
        const c = line[j];
        if (inStr) { if (c === q && line[j-1] !== "\\") inStr = false; }
        else if (c === '"' || c === "'") { inStr = true; q = c; }
        else if (c === "#") return j;
      }
      return -1;
    })();
    if (hashIdx >= 0) line = line.slice(0, hashIdx);
    line = line.trim();
    if (!line && !buf) continue;
    // multi-line array continuation
    if (buf) line = buf + " " + line;
    const opens = (line.match(/[\[{]/g) || []).length, closes = (line.match(/[\]}]/g) || []).length;
    if (opens > closes) { buf = line; continue; }
    buf = "";
    // [[array of tables]]
    let m = /^\[\[(.+?)\]\]$/.exec(line);
    if (m) {
      const path = m[1].split(".").map(s => s.trim().replace(/^"|"$/g, ""));
      let node = root;
      for (let j = 0; j < path.length - 1; j++) {
        if (!node[path[j]]) node[path[j]] = {};
        node = node[path[j]];
      }
      const last = path[path.length - 1];
      if (!node[last]) node[last] = [];
      const item = {}; node[last].push(item); cur = item;
      continue;
    }
    // [table]
    m = /^\[(.+?)\]$/.exec(line);
    if (m) {
      const path = m[1].split(".").map(s => s.trim().replace(/^"|"$/g, ""));
      let node = root;
      for (const p of path) { if (!node[p]) node[p] = {}; node = node[p]; }
      cur = node;
      continue;
    }
    // key = value
    const eq = line.indexOf("=");
    if (eq < 0) throw new Error(`Cannot parse line ${i+1}: ${line}`);
    const key = line.slice(0, eq).trim().replace(/^"|"$/g, "");
    cur[key] = parseTomlValue(line.slice(eq + 1));
  }
  return root;
}
function TomlToJsonTool() {
  const [input, setInput] = usePersistentState("dth_toml_json_in", `# TryDevTools config
title = "TryDevTools"
version = 1
debug = false

[server]
host = "localhost"
port = 5173

[features]
enabled = ["json", "text", "encoding"]

[[users]]
name = "Ada"
admin = true

[[users]]
name = "Alan"
admin = false`);
  const result = useMemo(() => {
    if (!input.trim()) return { ok: true, output: "" };
    try { return { ok: true, output: JSON.stringify(parseToml(input), null, 2) }; }
    catch (e) { return { ok: false, error: e.message }; }
  }, [input]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel="input · TOML"
      outputLabel="output · JSON"
      isError={!result.ok}
      output={result.ok ? result.output : result.error}
      controls={<><div style={{flex:1}}/><CopyBtn value={result.ok ? result.output : ""}/></>}
      outputRich={result.ok ? <pre dangerouslySetInnerHTML={{__html: highlightJSON(result.output)}}/> : undefined}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 4. SQL INSERT → JSON
// ════════════════════════════════════════════════════════════════════════════
function parseSqlInserts(sql) {
  // Find INSERT INTO <table> (cols) VALUES (vals), (vals)... — multiple inserts allowed
  const stmts = sql.split(/;\s*/).map(s => s.trim()).filter(Boolean);
  const tables = {};
  for (const stmt of stmts) {
    const m = /INSERT\s+INTO\s+([`"\[\]\w.]+)\s*\(([^)]+)\)\s*VALUES\s*(.+)/is.exec(stmt);
    if (!m) continue;
    const tableName = m[1].replace(/[`"\[\]]/g, "");
    const cols = m[2].split(",").map(c => c.trim().replace(/[`"\[\]]/g, ""));
    const valuesStr = m[3];
    const rows = [];
    let depth = 0, cur = "", inStr = false, q = null;
    for (let i = 0; i < valuesStr.length; i++) {
      const c = valuesStr[i];
      if (inStr) {
        if (c === q && valuesStr[i+1] === q) { cur += c + c; i++; }
        else if (c === q) { inStr = false; cur += c; }
        else cur += c;
      } else if (c === "'" || c === '"') { inStr = true; q = c; cur += c; }
      else if (c === "(") { if (depth > 0) cur += c; depth++; }
      else if (c === ")") { depth--; if (depth === 0) { rows.push(cur); cur = ""; } else cur += c; }
      else if (depth > 0) cur += c;
    }
    const parsedRows = rows.map(r => {
      const vals = []; let d = 0, c = "", iS = false, qq = null;
      for (let i = 0; i < r.length; i++) {
        const ch = r[i];
        if (iS) {
          if (ch === qq && r[i+1] === qq) { c += ch + ch; i++; }
          else if (ch === qq) { iS = false; c += ch; }
          else c += ch;
        } else if (ch === "'" || ch === '"') { iS = true; qq = ch; c += ch; }
        else if (ch === "(") { d++; c += ch; }
        else if (ch === ")") { d--; c += ch; }
        else if (ch === "," && d === 0) { vals.push(c.trim()); c = ""; }
        else c += ch;
      }
      if (c.trim()) vals.push(c.trim());
      return vals.map(v => {
        if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) return v.slice(1, -1).replace(/''/g, "'").replace(/""/g, '"');
        if (/^NULL$/i.test(v)) return null;
        if (/^true$/i.test(v)) return true;
        if (/^false$/i.test(v)) return false;
        if (/^-?\d+$/.test(v)) return parseInt(v, 10);
        if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
        return v;
      });
    });
    if (!tables[tableName]) tables[tableName] = [];
    for (const row of parsedRows) {
      const obj = {};
      cols.forEach((c, i) => obj[c] = row[i]);
      tables[tableName].push(obj);
    }
  }
  return tables;
}
function SqlToJsonTool() {
  const [input, setInput] = usePersistentState("dth_sql_json_in", `INSERT INTO users (id, name, email, active) VALUES
  (1, 'Ada Lovelace', 'ada@example.com', true),
  (2, 'Alan Turing', 'alan@example.com', true),
  (3, 'Grace Hopper', 'grace@example.com', false);

INSERT INTO products (id, name, price) VALUES (1, 'Widget', 9.99);`);
  const result = useMemo(() => {
    if (!input.trim()) return { ok: true, output: "" };
    try {
      const tables = parseSqlInserts(input);
      const tableCount = Object.keys(tables).length;
      if (tableCount === 0) return { ok: false, error: "No INSERT statements found" };
      const out = tableCount === 1 ? Object.values(tables)[0] : tables;
      return { ok: true, output: JSON.stringify(out, null, 2), tables: tableCount, rows: Object.values(tables).reduce((n, r) => n + r.length, 0) };
    } catch (e) { return { ok: false, error: e.message }; }
  }, [input]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel="input · SQL INSERT statements"
      outputLabel="output · JSON"
      isError={!result.ok}
      controls={<><div style={{flex:1}}/><CopyBtn value={result.ok ? result.output : ""}/></>}
      outputRich={result.ok ? <pre dangerouslySetInnerHTML={{__html: highlightJSON(result.output)}}/> : <pre style={{color:"var(--err)"}}>{result.error}</pre>}
      meta={result.ok ? <><span>{result.tables} table{result.tables !== 1 ? "s" : ""}</span><span>·</span><span>{result.rows} row{result.rows !== 1 ? "s" : ""}</span></> : <span>parse error</span>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// curl parser (shared by curl-to-fetch and curl-to-code)
// ════════════════════════════════════════════════════════════════════════════
function tokenizeShell(s) {
  // Handle line continuations
  s = s.replace(/\\\n/g, " ").replace(/\\\r\n/g, " ");
  const tokens = []; let cur = "", q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === "\\" && q === '"' && i + 1 < s.length) { cur += s[++i]; continue; }
      if (c === q) { q = null; }
      else cur += c;
    } else if (c === '"' || c === "'") { q = c; }
    else if (/\s/.test(c)) { if (cur) { tokens.push(cur); cur = ""; } }
    else cur += c;
  }
  if (cur) tokens.push(cur);
  return tokens;
}
function parseCurl(cmd) {
  const tokens = tokenizeShell(cmd.trim().replace(/^curl\s+/i, ""));
  const req = { url: "", method: "GET", headers: {}, body: null, auth: null };
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "-X" || t === "--request") { req.method = tokens[++i] || "GET"; }
    else if (t === "-H" || t === "--header") {
      const h = tokens[++i] || "";
      const idx = h.indexOf(":");
      if (idx > 0) req.headers[h.slice(0, idx).trim()] = h.slice(idx + 1).trim();
    }
    else if (t === "-d" || t === "--data" || t === "--data-raw" || t === "--data-binary") {
      req.body = tokens[++i] || "";
      if (req.method === "GET") req.method = "POST";
    }
    else if (t === "-u" || t === "--user") { req.auth = tokens[++i] || ""; }
    else if (t === "--url") { req.url = tokens[++i] || ""; }
    else if (t.startsWith("http://") || t.startsWith("https://") || t.startsWith("//")) { req.url = t; }
    else if (!t.startsWith("-") && !req.url) { req.url = t; }
  }
  if (req.auth) {
    req.headers["Authorization"] = "Basic " + btoa(req.auth);
  }
  return req;
}

// ════════════════════════════════════════════════════════════════════════════
// 5. cURL → fetch()
// ════════════════════════════════════════════════════════════════════════════
function curlToFetch(req) {
  const opts = { method: req.method };
  if (Object.keys(req.headers).length) opts.headers = req.headers;
  if (req.body !== null) opts.body = req.body;
  const optsStr = JSON.stringify(opts, null, 2);
  return `const res = await fetch(${JSON.stringify(req.url)}, ${optsStr});\nconst data = await res.json();`;
}
function CurlToFetchTool() {
  const [input, setInput] = usePersistentState("dth_curl_fetch_in", `curl -X POST https://api.example.com/users \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer abc123" \\
  -d '{"name":"Ada","email":"ada@example.com"}'`);
  const result = useMemo(() => {
    if (!input.trim()) return { ok: true, output: "" };
    try { const req = parseCurl(input); if (!req.url) throw new Error("No URL found"); return { ok: true, output: curlToFetch(req) }; }
    catch (e) { return { ok: false, error: e.message }; }
  }, [input]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel="input · curl command"
      outputLabel="output · JavaScript fetch()"
      isError={!result.ok}
      output={result.ok ? result.output : result.error}
      controls={<><div style={{flex:1}}/><CopyBtn value={result.ok ? result.output : ""}/></>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 6. cURL → multi-language code
// ════════════════════════════════════════════════════════════════════════════
function curlToPython(req) {
  const lines = [`import requests`, ``];
  if (Object.keys(req.headers).length) lines.push(`headers = ${JSON.stringify(req.headers, null, 4).replace(/^/gm, "")}`);
  if (req.body !== null) lines.push(`payload = ${JSON.stringify(req.body)}`);
  let call = `requests.${req.method.toLowerCase()}(${JSON.stringify(req.url)}`;
  if (Object.keys(req.headers).length) call += `, headers=headers`;
  if (req.body !== null) call += `, data=payload`;
  call += `)`;
  lines.push(``, `response = ${call}`, `print(response.json())`);
  return lines.join("\n");
}
function curlToGo(req) {
  let body = req.body !== null ? `strings.NewReader(${JSON.stringify(req.body)})` : "nil";
  const lines = [
    `package main`, ``,
    `import (`, `\t"fmt"`, `\t"io"`, `\t"net/http"`,
  ];
  if (req.body !== null) lines.push(`\t"strings"`);
  lines.push(`)`, ``, `func main() {`);
  lines.push(`\treq, _ := http.NewRequest(${JSON.stringify(req.method)}, ${JSON.stringify(req.url)}, ${body})`);
  for (const [k, v] of Object.entries(req.headers)) lines.push(`\treq.Header.Set(${JSON.stringify(k)}, ${JSON.stringify(v)})`);
  lines.push(`\tresp, err := http.DefaultClient.Do(req)`, `\tif err != nil { panic(err) }`, `\tdefer resp.Body.Close()`, `\tbody, _ := io.ReadAll(resp.Body)`, `\tfmt.Println(string(body))`, `}`);
  return lines.join("\n");
}
function curlToNode(req) {
  const opts = { method: req.method };
  if (Object.keys(req.headers).length) opts.headers = req.headers;
  if (req.body !== null) opts.body = req.body;
  return `const res = await fetch(${JSON.stringify(req.url)}, ${JSON.stringify(opts, null, 2)});\nconst data = await res.json();\nconsole.log(data);`;
}
function curlToPhp(req) {
  const lines = [`<?php`, `$ch = curl_init(${JSON.stringify(req.url)});`, `curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);`, `curl_setopt($ch, CURLOPT_CUSTOMREQUEST, ${JSON.stringify(req.method)});`];
  if (Object.keys(req.headers).length) {
    const hdr = Object.entries(req.headers).map(([k,v]) => JSON.stringify(`${k}: ${v}`)).join(", ");
    lines.push(`curl_setopt($ch, CURLOPT_HTTPHEADER, [${hdr}]);`);
  }
  if (req.body !== null) lines.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, ${JSON.stringify(req.body)});`);
  lines.push(`$response = curl_exec($ch);`, `curl_close($ch);`, `echo $response;`);
  return lines.join("\n");
}
function curlToRust(req) {
  const lines = [`use reqwest::Client;`, ``, `#[tokio::main]`, `async fn main() -> Result<(), Box<dyn std::error::Error>> {`, `    let client = Client::new();`];
  let chain = `    let res = client.${req.method.toLowerCase()}(${JSON.stringify(req.url)})`;
  for (const [k, v] of Object.entries(req.headers)) chain += `\n        .header(${JSON.stringify(k)}, ${JSON.stringify(v)})`;
  if (req.body !== null) chain += `\n        .body(${JSON.stringify(req.body)})`;
  chain += `\n        .send()\n        .await?\n        .text()\n        .await?;`;
  lines.push(chain, `    println!("{}", res);`, `    Ok(())`, `}`);
  return lines.join("\n");
}
function CurlToCodeTool() {
  const [input, setInput] = usePersistentState("dth_curl_code_in", `curl -X POST https://api.example.com/users \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Ada"}'`);
  const [lang, setLang] = useState("python");
  const result = useMemo(() => {
    if (!input.trim()) return { ok: true, output: "" };
    try {
      const req = parseCurl(input);
      if (!req.url) throw new Error("No URL found in curl command");
      const fn = { python: curlToPython, go: curlToGo, node: curlToNode, php: curlToPhp, rust: curlToRust, fetch: (r) => curlToFetch(r) }[lang];
      return { ok: true, output: fn(req) };
    } catch (e) { return { ok: false, error: e.message }; }
  }, [input, lang]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel="input · curl command"
      outputLabel={`output · ${lang}`}
      isError={!result.ok}
      output={result.ok ? result.output : result.error}
      controls={<>
        <div className="segmented" style={{width:420}}>
          {[["fetch","fetch()"],["python","Python"],["go","Go"],["node","Node"],["php","PHP"],["rust","Rust"]].map(([k, l]) => (
            <button key={k} className={lang===k?"active":""} onClick={()=>setLang(k)}>{l}</button>
          ))}
        </div>
        <div style={{flex:1}}/>
        <CopyBtn value={result.ok ? result.output : ""}/>
      </>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 7. NUMBER BASE CONVERTER
// ════════════════════════════════════════════════════════════════════════════
function NumberBaseTool() {
  const [value, setValue] = useState("255");
  const [base, setBase] = useState(10);
  const result = useMemo(() => {
    try {
      const v = value.trim().replace(/[_\s]/g, "");
      if (!v) return { ok: true, n: 0n };
      const n = BigInt(parseInt(v, base));
      if (isNaN(Number(n))) throw new Error("invalid");
      return { ok: true, n };
    } catch { return { ok: false, error: "Invalid number for base " + base }; }
  }, [value, base]);
  const bases = [
    ["Binary",       2,  "0b"],
    ["Octal",        8,  "0o"],
    ["Decimal",      10, ""],
    ["Hexadecimal",  16, "0x"],
    ["Base-32",      32, ""],
    ["Base-36",      36, ""],
  ];
  return (
    <>
      <div style={{display:"flex", gap:10, marginBottom:14, alignItems:"center", flexWrap:"wrap"}}>
        <span className="chip" style={{padding:"2px 4px 2px 10px"}}>
          input base
          <span className="segmented" style={{border:0, background:"transparent", padding:0, gridTemplateColumns:"repeat(4,1fr)", marginLeft:6}}>
            {[2, 8, 10, 16].map(b => <button key={b} className={base===b?"active":""} onClick={()=>setBase(b)}>{b === 2 ? "bin" : b === 8 ? "oct" : b === 10 ? "dec" : "hex"}</button>)}
          </span>
        </span>
        <input value={value} onChange={e=>setValue(e.target.value)} placeholder="enter a number…" style={{flex:1, fontSize:18, padding:"10px 14px", background:"var(--bg-1)", border:`1px solid ${result.ok ? "var(--line)" : "var(--err)"}`, borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}} spellCheck="false"/>
      </div>
      {!result.ok ? <div className="card" style={{padding:14, color:"var(--err)"}}>{result.error}</div> : (
        <div className="card" style={{padding:0, overflow:"hidden"}}>
          {bases.map(([name, b, prefix], i) => {
            const repr = result.n.toString(b);
            return (
              <div key={b} style={{display:"flex", alignItems:"center", padding:"12px 16px", borderBottom: i < bases.length-1 ? "1px solid var(--line)" : "none", gap:16}}>
                <span className="mono" style={{fontSize:11, color:"var(--ink-3)", width:130, textTransform:"uppercase", letterSpacing:".06em"}}>{name} (base-{b})</span>
                <span className="mono" style={{flex:1, fontSize:14, color:"var(--ink)", wordBreak:"break-all"}}>{prefix}{repr}</span>
                <button className="btn btn-ghost btn-sm" onClick={()=>navigator.clipboard.writeText(prefix + repr)}><Icon.Copy/></button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 8. UNIT CONVERTER
// ════════════════════════════════════════════════════════════════════════════
const UNIT_GROUPS = {
  Length: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 },
  Mass:   { mg: 0.000001, g: 0.001, kg: 1, oz: 0.0283495, lb: 0.453592, ton: 1000 },
  Time:   { ms: 0.001, s: 1, min: 60, hr: 3600, day: 86400, week: 604800, year: 31557600 },
  Volume: { mL: 0.001, L: 1, "fl oz": 0.0295735, cup: 0.236588, qt: 0.946353, gal: 3.78541 },
  Data:   { B: 1, KB: 1000, MB: 1e6, GB: 1e9, TB: 1e12, KiB: 1024, MiB: 1048576, GiB: 1073741824, TiB: 1099511627776 },
  Speed:  { "m/s": 1, "km/h": 0.277778, mph: 0.44704, knot: 0.514444 },
};
function convertTemp(v, from, to) {
  let c;
  if (from === "°C") c = v;
  else if (from === "°F") c = (v - 32) * 5/9;
  else if (from === "K") c = v - 273.15;
  else return NaN;
  if (to === "°C") return c;
  if (to === "°F") return c * 9/5 + 32;
  if (to === "K") return c + 273.15;
  return NaN;
}
function UnitConverterTool() {
  const [group, setGroup] = useState("Length");
  const [from, setFrom] = useState("m");
  const [to, setTo] = useState("ft");
  const [value, setValue] = useState("100");
  const switchGroup = (g) => {
    setGroup(g);
    if (g === "Temperature") { setFrom("°C"); setTo("°F"); }
    else {
      const u = Object.keys(UNIT_GROUPS[g]);
      setFrom(u[0]); setTo(u[1] || u[0]);
    }
  };
  const units = group === "Temperature" ? ["°C", "°F", "K"] : Object.keys(UNIT_GROUPS[group]);
  const result = useMemo(() => {
    const v = parseFloat(value);
    if (!Number.isFinite(v)) return null;
    let r;
    if (group === "Temperature") r = convertTemp(v, from, to);
    else {
      const m = UNIT_GROUPS[group];
      if (!m[from] || !m[to]) return null;
      r = v * m[from] / m[to];
    }
    return Number.isFinite(r) ? r : null;
  }, [value, from, to, group]);
  return (
    <>
      <div style={{display:"flex", gap:8, marginBottom:14, flexWrap:"wrap"}}>
        {Object.keys(UNIT_GROUPS).concat("Temperature").map(g => (
          <button key={g} className={`chip ${group===g?"accent":""}`} onClick={()=>switchGroup(g)} style={{cursor:"pointer"}}>{g}</button>
        ))}
      </div>
      <div style={{display:"grid", gridTemplateColumns:"1fr 60px 1fr", gap:14, alignItems:"center"}}>
        <div className="card" style={{padding:18}}>
          <div className="eyebrow" style={{marginBottom:10}}>from</div>
          <div style={{display:"flex", gap:8}}>
            <input type="number" value={value} onChange={e=>setValue(e.target.value)} style={{flex:1, fontSize:24, padding:"10px 14px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none", minWidth:0}}/>
            <select value={from} onChange={e=>setFrom(e.target.value)} style={{padding:"10px 14px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none", cursor:"pointer", fontSize:14, minWidth:90}}>
              {units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div style={{textAlign:"center", color:"var(--ink-3)", fontSize:24}}>→</div>
        <div className="card" style={{padding:18}}>
          <div className="eyebrow" style={{marginBottom:10}}>to</div>
          <div style={{display:"flex", gap:8}}>
            <div style={{flex:1, fontSize:24, padding:"10px 14px", background:"var(--bg-2)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", overflow:"auto", minHeight:48, minWidth:0, whiteSpace:"nowrap"}}>
              {result === null ? <span style={{color:"var(--ink-3)"}}>—</span> : result.toLocaleString(undefined, { maximumFractionDigits: 8 })}
            </div>
            <select value={to} onChange={e=>setTo(e.target.value)} style={{padding:"10px 14px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none", cursor:"pointer", fontSize:14, minWidth:90}}>
              {units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
      </div>
      {result !== null && (
        <div style={{marginTop:14, fontFamily:"var(--mono)", fontSize:13, color:"var(--ink-2)", textAlign:"center"}}>
          {value} {from} = <span style={{color:"var(--accent-hi)"}}>{result.toLocaleString(undefined, { maximumFractionDigits: 8 })}</span> {to}
        </div>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 9. BYTE SIZE CONVERTER
// ════════════════════════════════════════════════════════════════════════════
function ByteSizeTool() {
  const [bytes, setBytes] = useState("1048576");
  const parsed = useMemo(() => {
    const cleaned = String(bytes).replace(/[_\s,]/g, "").trim();
    if (!cleaned) return { ok: true, n: 0n };
    // Accept fractional numbers too (round to nearest byte)
    if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(cleaned)) {
      const num = Number(cleaned);
      if (!Number.isFinite(num)) return { ok: false };
      try { return { ok: true, n: BigInt(Math.round(num)) }; }
      catch { return { ok: false }; }
    }
    return { ok: false };
  }, [bytes]);
  const valid = parsed.ok;
  const n = valid ? parsed.n : 0n;
  const fmt = (n, divisor) => (Number(n * 100000n / divisor) / 100000).toLocaleString(undefined, { maximumFractionDigits: 5 });
  const rows = [
    ["Bytes",      "B",   1n],
    ["Kilobytes",  "KB",  1000n],
    ["Megabytes",  "MB",  1000n * 1000n],
    ["Gigabytes",  "GB",  1000n * 1000n * 1000n],
    ["Terabytes",  "TB",  1000n * 1000n * 1000n * 1000n],
    ["Kibibytes",  "KiB", 1024n],
    ["Mebibytes",  "MiB", 1024n * 1024n],
    ["Gibibytes",  "GiB", 1024n * 1024n * 1024n],
    ["Tebibytes",  "TiB", 1024n * 1024n * 1024n * 1024n],
    ["Bits",       "bit", 1n, true],
  ];
  const human = (() => {
    const num = Number(n);
    const units = ["B", "KB", "MB", "GB", "TB", "PB"];
    let i = 0; let v = num;
    while (v >= 1000 && i < units.length - 1) { v /= 1000; i++; }
    return `${v.toFixed(2)} ${units[i]}`;
  })();
  const humanIec = (() => {
    const num = Number(n);
    const units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];
    let i = 0; let v = num;
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
    return `${v.toFixed(2)} ${units[i]}`;
  })();
  return (
    <>
      <div style={{display:"flex", gap:10, marginBottom:14, alignItems:"center"}}>
        <input value={bytes} onChange={e=>setBytes(e.target.value)} placeholder="enter a number of bytes…" style={{flex:1, fontSize:24, padding:"12px 16px", background:"var(--bg-1)", border:`1px solid ${valid ? "var(--line)" : "var(--err)"}`, borderRadius:"var(--r-lg)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}} spellCheck="false"/>
      </div>
      {!valid && <div className="card" style={{padding:"10px 14px", marginBottom:14, color:"var(--err)", borderColor:"rgba(248,113,113,.3)", background:"rgba(248,113,113,.06)", fontSize:13, fontFamily:"var(--mono)"}}>Invalid number — enter an integer or decimal.</div>}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14}}>
        <div className="card" style={{padding:18, textAlign:"center"}}>
          <div className="eyebrow" style={{marginBottom:8}}>SI (decimal · 1 KB = 1000 B)</div>
          <div style={{fontSize:28, fontFamily:"var(--mono)", color:"var(--accent-hi)"}}>{human}</div>
        </div>
        <div className="card" style={{padding:18, textAlign:"center"}}>
          <div className="eyebrow" style={{marginBottom:8}}>IEC (binary · 1 KiB = 1024 B)</div>
          <div style={{fontSize:28, fontFamily:"var(--mono)", color:"var(--accent-hi)"}}>{humanIec}</div>
        </div>
      </div>
      <div className="card" style={{padding:0, overflow:"hidden"}}>
        {rows.map(([name, sym, divisor, isBits], i) => (
          <div key={sym} style={{display:"flex", alignItems:"center", padding:"10px 16px", borderBottom: i < rows.length-1 ? "1px solid var(--line)" : "none", gap:16}}>
            <span className="mono" style={{fontSize:11, color:"var(--ink-3)", width:120, textTransform:"uppercase", letterSpacing:".06em"}}>{name}</span>
            <span className="mono" style={{flex:1, fontSize:14, color:"var(--ink)"}}>{isBits ? fmt(n * 8n, 1n) : fmt(n, divisor)} {sym}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 10. CSS UNIT CONVERTER
// ════════════════════════════════════════════════════════════════════════════
function CssUnitsTool() {
  const [px, setPx] = useState(16);
  const [base, setBase] = useState(16);
  const [vw, setVw] = useState(1920);
  const [vh, setVh] = useState(1080);
  const rows = [
    ["px",    px],
    ["rem",   px / base],
    ["em",    px / base],
    ["pt",    px * 0.75],
    ["pc",    px / 16],
    ["%",     `${(px / base * 100).toFixed(2)}% (of base)`],
    ["vw",    `${(px / vw * 100).toFixed(4)}vw`],
    ["vh",    `${(px / vh * 100).toFixed(4)}vh`],
    ["mm",    `${(px * 0.264583).toFixed(3)}mm`],
    ["in",    `${(px / 96).toFixed(4)}in`],
  ];
  return (
    <>
      <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:14, marginBottom:14}}>
        <div className="card" style={{padding:18}}>
          <div className="eyebrow" style={{marginBottom:8}}>pixel value</div>
          <input type="number" value={px} onChange={e=>setPx(parseFloat(e.target.value)||0)} style={{width:"100%", fontSize:24, padding:"10px 14px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}}/>
        </div>
        <div className="card" style={{padding:18}}>
          <div className="eyebrow" style={{marginBottom:8}}>base font-size (px)</div>
          <input type="number" value={base} onChange={e=>setBase(parseFloat(e.target.value)||16)} style={{width:"100%", fontSize:24, padding:"10px 14px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}}/>
        </div>
        <div className="card" style={{padding:18}}>
          <div className="eyebrow" style={{marginBottom:8}}>viewport (px)</div>
          <div style={{display:"flex", gap:8}}>
            <input type="number" value={vw} onChange={e=>setVw(parseFloat(e.target.value)||1920)} style={{flex:1, fontSize:14, padding:"10px 12px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}}/>
            <span style={{alignSelf:"center", color:"var(--ink-3)"}}>×</span>
            <input type="number" value={vh} onChange={e=>setVh(parseFloat(e.target.value)||1080)} style={{flex:1, fontSize:14, padding:"10px 12px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}}/>
          </div>
        </div>
      </div>
      <div className="card" style={{padding:0, overflow:"hidden"}}>
        {rows.map(([unit, val], i) => {
          const display = typeof val === "number" ? `${val.toFixed(4).replace(/\.?0+$/, "")}${unit}` : val;
          return (
            <div key={unit} style={{display:"flex", alignItems:"center", padding:"10px 16px", borderBottom: i < rows.length-1 ? "1px solid var(--line)" : "none", gap:16}}>
              <span className="mono" style={{fontSize:11, color:"var(--ink-3)", width:50, textTransform:"uppercase"}}>{unit}</span>
              <span className="mono" style={{flex:1, fontSize:14, color:"var(--ink)"}}>{display}</span>
              <button className="btn btn-ghost btn-sm" onClick={()=>navigator.clipboard.writeText(String(display))}><Icon.Copy/></button>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Register converters tools
// ────────────────────────────────────────────────────────────────────────────
window.LIVE_TOOLS = window.LIVE_TOOLS || {};
Object.assign(window.LIVE_TOOLS, {
  "yaml-to-json":    { render: () => <YamlToJsonTool/> },
  "xml-to-json":     { render: () => <XmlToJsonTool/> },
  "toml-to-json":    { render: () => <TomlToJsonTool/> },
  "sql-to-json":     { render: () => <SqlToJsonTool/> },
  "curl-to-fetch":   { render: () => <CurlToFetchTool/> },
  "curl-to-code":    { render: () => <CurlToCodeTool/> },
  "number-base":     { render: () => <NumberBaseTool/> },
  "unit-converter":  { render: () => <UnitConverterTool/> },
  "byte-size":       { render: () => <ByteSizeTool/> },
  "css-units":       { render: () => <CssUnitsTool/> },
});
