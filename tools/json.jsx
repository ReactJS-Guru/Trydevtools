// JSON category — 17 tools
const { useState, useEffect, useMemo } = React;

// ── helpers used by these tools ────────────────────────────────────────────
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

// ── JSON-specific helpers ──────────────────────────────────────────────────
function tryParse(s) {
  try { return { ok: true, value: JSON.parse(s) }; }
  catch (e) {
    const m = /position (\d+)/.exec(e.message);
    return { ok: false, error: e.message, pos: m ? +m[1] : null };
  }
}
function positionToLineCol(s, pos) {
  if (pos == null) return { line: null, col: null };
  let line = 1, col = 1;
  for (let i = 0; i < pos && i < s.length; i++) { if (s[i] === "\n") { line++; col = 1; } else col++; }
  return { line, col };
}
function jsonSnippet(s, pos, around = 32) {
  if (pos == null) return "";
  const start = Math.max(0, pos - around), end = Math.min(s.length, pos + around);
  return `${s.slice(start, pos)}<<HERE>>${s.slice(pos, end)}`;
}
function sortKeysDeep(v) {
  if (Array.isArray(v)) return v.map(sortKeysDeep);
  if (v && typeof v === "object") { const o = {}; Object.keys(v).sort().forEach(k => o[k] = sortKeysDeep(v[k])); return o; }
  return v;
}
function countKeys(v) {
  if (Array.isArray(v)) return v.reduce((n,x)=>n+countKeys(x),0);
  if (v && typeof v === "object") return Object.keys(v).length + Object.values(v).reduce((n,x)=>n+countKeys(x),0);
  return 0;
}
function depthOf(v) {
  if (Array.isArray(v)) return 1 + Math.max(0, ...v.map(depthOf));
  if (v && typeof v === "object") return 1 + Math.max(0, ...Object.values(v).map(depthOf));
  return 0;
}
function flattenObj(obj, sep = ".", prefix = "", out = {}) {
  if (obj === null || typeof obj !== "object") { out[prefix || ""] = obj; return out; }
  if (Array.isArray(obj)) {
    if (obj.length === 0) out[prefix] = [];
    obj.forEach((v, i) => flattenObj(v, sep, prefix ? `${prefix}${sep}${i}` : String(i), out));
    return out;
  }
  const keys = Object.keys(obj);
  if (keys.length === 0 && prefix) out[prefix] = {};
  for (const k of keys) flattenObj(obj[k], sep, prefix ? `${prefix}${sep}${k}` : k, out);
  return out;
}
function unflattenObj(flat, sep = ".") {
  const root = {};
  for (const [k, v] of Object.entries(flat)) {
    const parts = k.split(sep);
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i], next = parts[i + 1];
      const isIdx = /^\d+$/.test(next);
      if (node[key] == null) node[key] = isIdx ? [] : {};
      node = node[key];
    }
    node[parts[parts.length - 1]] = v;
  }
  return root;
}
function statusCard(ok, msg, sub) {
  return (
    <div className="card" style={{padding:"14px 18px", marginBottom:14, display:"flex", alignItems:"center", gap:12, borderColor: ok ? "rgba(52,211,153,.3)" : "rgba(248,113,113,.3)", background: ok ? "rgba(52,211,153,.06)" : "rgba(248,113,113,.06)"}}>
      <span style={{width:9, height:9, borderRadius:"50%", background: ok ? "var(--ok)" : "var(--err)"}}/>
      <div style={{flex:1}}>
        <div style={{fontSize:14, fontWeight:600, color: ok ? "var(--ok)" : "var(--err)"}}>{msg}</div>
        {sub && <div style={{fontSize:12.5, color:"var(--ink-2)", fontFamily:"var(--mono)", marginTop:3}}>{sub}</div>}
      </div>
    </div>
  );
}

// ── csv parser (used by csv-to-json) ───────────────────────────────────────
function parseCsv(text, delim = ",") {
  const rows = []; let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else {
      if (c === '"') q = true;
      else if (c === delim) { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") {}
      else field += c;
    }
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// ── json → yaml ────────────────────────────────────────────────────────────
function needsYamlQuotes(s) {
  if (s === "") return true;
  if (/^(true|false|null|yes|no|on|off|~)$/i.test(s)) return true;
  if (/^-?\d+(\.\d+)?$/.test(s)) return true;
  if (/^[\s"'`{}\[\],&*#?|<>=!%@:\-]/.test(s)) return true;
  if (/[:#]\s/.test(s) || /[\n\r\t]/.test(s)) return true;
  return false;
}
function jsonToYaml(value, indent = 0) {
  const pad = "  ".repeat(indent);
  if (value === null) return "null";
  if (typeof value === "string") return needsYamlQuotes(value) ? JSON.stringify(value) : value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value.map(v => {
      if (v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length) {
        return `${pad}-\n${jsonToYaml(v, indent + 1)}`;
      }
      return `${pad}- ${jsonToYaml(v, 0)}`;
    }).join("\n");
  }
  if (typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) return "{}";
    return keys.map(k => {
      const v = value[k];
      if (v === null || typeof v !== "object") return `${pad}${k}: ${jsonToYaml(v, 0)}`;
      if (Array.isArray(v) && v.length === 0) return `${pad}${k}: []`;
      if (!Array.isArray(v) && Object.keys(v).length === 0) return `${pad}${k}: {}`;
      return `${pad}${k}:\n${jsonToYaml(v, indent + 1)}`;
    }).join("\n");
  }
  return String(value);
}

// ── json → xml ─────────────────────────────────────────────────────────────
function xmlEscape(s) { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function jsonToXml(v, name, indent) {
  const pad = "  ".repeat(indent);
  const tag = String(name).replace(/[^a-zA-Z0-9_-]/g, "_") || "item";
  if (v === null) return `${pad}<${tag}/>`;
  if (typeof v !== "object") return `${pad}<${tag}>${xmlEscape(v)}</${tag}>`;
  if (Array.isArray(v)) return v.map(x => jsonToXml(x, tag, indent)).join("\n");
  const keys = Object.keys(v);
  if (keys.length === 0) return `${pad}<${tag}/>`;
  return `${pad}<${tag}>\n${keys.map(k => jsonToXml(v[k], k, indent + 1)).join("\n")}\n${pad}</${tag}>`;
}

// ── json diff ──────────────────────────────────────────────────────────────
function jsonDiff(a, b, path = "$", out = []) {
  const ta = a === null ? "null" : Array.isArray(a) ? "array" : typeof a;
  const tb = b === null ? "null" : Array.isArray(b) ? "array" : typeof b;
  if (ta !== tb) { out.push({ kind: "change", path, from: a, to: b }); return out; }
  if (ta === "array") {
    const max = Math.max(a.length, b.length);
    for (let i = 0; i < max; i++) {
      if (i >= a.length) out.push({ kind: "add", path: `${path}[${i}]`, value: b[i] });
      else if (i >= b.length) out.push({ kind: "remove", path: `${path}[${i}]`, value: a[i] });
      else jsonDiff(a[i], b[i], `${path}[${i}]`, out);
    }
  } else if (ta === "object") {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      const np = `${path}.${k}`;
      if (!(k in a)) out.push({ kind: "add", path: np, value: b[k] });
      else if (!(k in b)) out.push({ kind: "remove", path: np, value: a[k] });
      else jsonDiff(a[k], b[k], np, out);
    }
  } else if (a !== b) out.push({ kind: "change", path, from: a, to: b });
  return out;
}

// ── jsonpath ───────────────────────────────────────────────────────────────
function jsonPath(value, expr) {
  if (!expr || expr === "$") return [value];
  let cur = [value];
  let s = expr.startsWith("$") ? expr.slice(1) : expr;
  const tokens = []; let i = 0;
  while (i < s.length) {
    if (s[i] === ".") {
      if (s[i + 1] === ".") {
        i += 2;
        let name = ""; while (i < s.length && /[a-zA-Z0-9_]/.test(s[i])) { name += s[i++]; }
        tokens.push({ kind: "descend", name });
      } else {
        i++;
        let name = ""; while (i < s.length && /[a-zA-Z0-9_]/.test(s[i])) { name += s[i++]; }
        if (name) tokens.push({ kind: "prop", name });
      }
    } else if (s[i] === "[") {
      const end = s.indexOf("]", i); if (end < 0) throw new Error("unmatched [");
      const inner = s.slice(i + 1, end).trim();
      if (inner === "*") tokens.push({ kind: "all" });
      else if (/^-?\d+$/.test(inner)) tokens.push({ kind: "index", n: +inner });
      else if (/^['"].*['"]$/.test(inner)) tokens.push({ kind: "prop", name: inner.slice(1, -1) });
      else throw new Error(`unsupported bracket: [${inner}]`);
      i = end + 1;
    } else i++;
  }
  for (const t of tokens) {
    const next = [];
    for (const v of cur) {
      if (t.kind === "prop") { if (v && typeof v === "object" && t.name in v) next.push(v[t.name]); }
      else if (t.kind === "index") { if (Array.isArray(v) && v[t.n] !== undefined) next.push(v[t.n]); }
      else if (t.kind === "all") {
        if (Array.isArray(v)) next.push(...v);
        else if (v && typeof v === "object") next.push(...Object.values(v));
      } else if (t.kind === "descend") {
        const stack = [v];
        while (stack.length) {
          const x = stack.shift();
          if (x && typeof x === "object") {
            if (Array.isArray(x)) stack.push(...x);
            else { if (t.name in x) next.push(x[t.name]); stack.push(...Object.values(x)); }
          }
        }
      }
    }
    cur = next;
  }
  return cur;
}

// ── schema validator (Draft-07 subset) ─────────────────────────────────────
function jsonSchemaType(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (Number.isInteger(v)) return "integer";
  return typeof v;
}
function validateSchema(v, sch, path, errs) {
  if (!sch || typeof sch !== "object") return;
  if (sch.type) {
    const t = jsonSchemaType(v);
    const want = Array.isArray(sch.type) ? sch.type : [sch.type];
    if (!want.some(w => w === t || (w === "number" && t === "integer"))) errs.push({ path, msg: `expected type ${want.join("|")}, got ${t}` });
  }
  if (sch.enum && !sch.enum.some(x => JSON.stringify(x) === JSON.stringify(v))) errs.push({ path, msg: `value not in enum [${sch.enum.map(x=>JSON.stringify(x)).join(", ")}]` });
  if (typeof v === "string") {
    if (sch.minLength != null && v.length < sch.minLength) errs.push({ path, msg: `string length ${v.length} < minLength ${sch.minLength}` });
    if (sch.maxLength != null && v.length > sch.maxLength) errs.push({ path, msg: `string length ${v.length} > maxLength ${sch.maxLength}` });
    if (sch.pattern && !new RegExp(sch.pattern).test(v)) errs.push({ path, msg: `value does not match pattern /${sch.pattern}/` });
  }
  if (typeof v === "number") {
    if (sch.minimum != null && v < sch.minimum) errs.push({ path, msg: `${v} < minimum ${sch.minimum}` });
    if (sch.maximum != null && v > sch.maximum) errs.push({ path, msg: `${v} > maximum ${sch.maximum}` });
  }
  if (Array.isArray(v)) {
    if (sch.minItems != null && v.length < sch.minItems) errs.push({ path, msg: `array length ${v.length} < minItems ${sch.minItems}` });
    if (sch.maxItems != null && v.length > sch.maxItems) errs.push({ path, msg: `array length ${v.length} > maxItems ${sch.maxItems}` });
    if (sch.items) v.forEach((item, i) => validateSchema(item, sch.items, `${path}[${i}]`, errs));
  }
  if (v && typeof v === "object" && !Array.isArray(v)) {
    if (Array.isArray(sch.required)) for (const k of sch.required) if (!(k in v)) errs.push({ path: `${path}.${k}`, msg: "required property missing" });
    if (sch.properties) for (const k of Object.keys(sch.properties)) if (k in v) validateSchema(v[k], sch.properties[k], `${path}.${k}`, errs);
  }
}

// ── code generators ────────────────────────────────────────────────────────
function pascalCase(s) { return String(s).split(/[^a-zA-Z0-9]/).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join("") || "Item"; }
function jsonToTypescript(value, rootName) {
  const interfaces = []; const seen = new Set();
  const inferType = (v, name) => {
    if (v === null) return "null";
    if (Array.isArray(v)) {
      if (v.length === 0) return "any[]";
      const elems = new Set(v.map(x => inferType(x, pascalCase(name) + "Item")));
      const t = elems.size === 1 ? [...elems][0] : `(${[...elems].join(" | ")})`;
      return `${t}[]`;
    }
    if (typeof v === "object") {
      const tname = pascalCase(name);
      if (!seen.has(tname)) {
        seen.add(tname);
        const lines = Object.entries(v).map(([k, val]) => {
          const opt = val === null ? "?" : "";
          const fn = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
          return `  ${fn}${opt}: ${inferType(val, k)};`;
        });
        interfaces.push(`export interface ${tname} {\n${lines.join("\n")}\n}`);
      }
      return tname;
    }
    if (typeof v === "string") return "string";
    if (typeof v === "number") return "number";
    if (typeof v === "boolean") return "boolean";
    return "any";
  };
  inferType(value, rootName);
  return interfaces.reverse().join("\n\n");
}
function jsonToGo(value, rootName) {
  const structs = []; const seen = new Set();
  const goType = (v, name) => {
    if (v === null) return "interface{}";
    if (Array.isArray(v)) {
      if (v.length === 0) return "[]interface{}";
      return `[]${goType(v[0], pascalCase(name))}`;
    }
    if (typeof v === "object") {
      const tname = pascalCase(name);
      if (!seen.has(tname)) {
        seen.add(tname);
        const fields = Object.entries(v).map(([k, val]) => `\t${pascalCase(k)} ${goType(val, k)} \`json:"${k}"\``);
        structs.push(`type ${tname} struct {\n${fields.join("\n")}\n}`);
      }
      return tname;
    }
    if (typeof v === "string") return "string";
    if (typeof v === "boolean") return "bool";
    if (typeof v === "number") return Number.isInteger(v) ? "int" : "float64";
    return "interface{}";
  };
  goType(value, rootName);
  return structs.reverse().join("\n\n");
}

// ── jq-style query ─────────────────────────────────────────────────────────
function runJq(input, query) {
  const q = query.trim();
  if (!q || q === ".") return [input];
  if (q === "length") return [Array.isArray(input) || typeof input === "string" ? input.length : input && typeof input === "object" ? Object.keys(input).length : 0];
  if (q === "keys") { if (input && typeof input === "object" && !Array.isArray(input)) return [Object.keys(input).sort()]; throw new Error("keys: input must be object"); }
  if (q.includes("|")) {
    const parts = q.split("|").map(p => p.trim());
    let cur = [input];
    for (const p of parts) { const next = []; for (const v of cur) next.push(...runJq(v, p)); cur = next; }
    return cur;
  }
  if (!q.startsWith(".")) throw new Error(`unsupported: ${q}`);
  let cur = [input]; let s = q.slice(1);
  while (s.length) {
    if (s.startsWith("[]")) {
      const next = [];
      for (const v of cur) {
        if (Array.isArray(v)) next.push(...v);
        else if (v && typeof v === "object") next.push(...Object.values(v));
        else throw new Error("[]: needs array or object");
      }
      cur = next; s = s.slice(2); continue;
    }
    const idxM = /^\[(-?\d+)\]/.exec(s);
    if (idxM) {
      const n = +idxM[1]; const next = [];
      for (const v of cur) if (Array.isArray(v)) { const i = n < 0 ? v.length + n : n; if (v[i] !== undefined) next.push(v[i]); }
      cur = next; s = s.slice(idxM[0].length); continue;
    }
    const propM = /^\.([a-zA-Z_][a-zA-Z0-9_]*)/.exec("." + s);
    if (propM) {
      const name = propM[1]; const next = [];
      for (const v of cur) if (v && typeof v === "object" && name in v) next.push(v[name]);
      cur = next; s = s.slice(propM[0].length - 1); continue;
    }
    if (s.startsWith(".")) { s = s.slice(1); continue; }
    throw new Error(`could not parse near: ${s}`);
  }
  return cur;
}

// ════════════════════════════════════════════════════════════════════════════
// 1. JSON FORMATTER
// ════════════════════════════════════════════════════════════════════════════
function JsonFormatterTool() {
  const [input, setInput] = usePersistentState("dth_json_in", `{
  "user": {
    "id": 128,
    "name": "Ada Lovelace",
    "email": "ada@analytical.engine",
    "roles": ["admin", "engineer"],
    "active": true,
    "last_seen": "2026-04-18T09:12:00Z",
    "preferences": { "theme": "dark", "density": "compact", "notifications": null }
  },
  "requests": [
    { "id": "req_01", "method": "POST", "path": "/api/auth", "ms": 42 },
    { "id": "req_02", "method": "GET",  "path": "/api/me",   "ms": 18 },
    { "id": "req_03", "method": "PATCH","path": "/api/me",   "ms": 73 }
  ],
  "count": 3,
  "cursor": null
}`);
  const [indent, setIndent] = useState(2);
  const [sort, setSort] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return { ok: true, output: "", keys: 0, depth: 0, type: "empty", bytes: 0 };
    try {
      let obj = JSON.parse(input);
      if (sort) obj = sortKeysDeep(obj);
      const out = indent === 0 ? JSON.stringify(obj) : JSON.stringify(obj, null, indent === -1 ? "\t" : indent);
      return { ok: true, output: out, keys: countKeys(obj), depth: depthOf(obj), type: Array.isArray(obj) ? "array" : obj === null ? "null" : typeof obj, bytes: out.length };
    } catch (e) {
      const m = /position (\d+)/.exec(e.message);
      const pos = m ? +m[1] : null;
      const { line, col } = positionToLineCol(input, pos);
      return { ok: false, error: e.message, pos, line, col, snippet: jsonSnippet(input, pos) };
    }
  }, [input, indent, sort]);

  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel="input · raw JSON"
      outputLabel={indent === 0 ? "output · minified" : "output · formatted"}
      isError={!result.ok}
      controls={<>
        <span className="chip" style={{padding:"2px 4px 2px 10px"}}>
          <span style={{marginRight:8}}>indent</span>
          <span className="segmented" style={{border:0, background:"transparent", padding:0, gridTemplateColumns:"repeat(4,1fr)"}}>
            <button className={indent===2?"active":""} onClick={()=>setIndent(2)}>2sp</button>
            <button className={indent===4?"active":""} onClick={()=>setIndent(4)}>4sp</button>
            <button className={indent===-1?"active":""} onClick={()=>setIndent(-1)}>tab</button>
            <button className={indent===0?"active":""} onClick={()=>setIndent(0)}>min</button>
          </span>
        </span>
        <label className="chip" style={{cursor:"pointer"}}>
          <input type="checkbox" checked={sort} onChange={e=>setSort(e.target.checked)} style={{margin:0}}/>
          sort keys
        </label>
        <button className="btn btn-ghost btn-sm" onClick={()=>{ if (result.ok && result.output) setInput(result.output); }} disabled={!result.ok}>Apply to input</button>
        <button className="btn btn-ghost btn-sm" onClick={async()=>{ try { const t = await navigator.clipboard.readText(); if (t) setInput(t); } catch {} }}>Paste</button>
        <button className="btn btn-ghost btn-sm" onClick={()=>setInput("")}>Clear</button>
        <div style={{flex:1}}/>
        <CopyBtn value={result.ok ? result.output : ""}/>
      </>}
      outputRich={result.ok
        ? <pre dangerouslySetInnerHTML={{__html: highlightJSON(result.output)}}/>
        : <pre style={{color:"var(--err)", margin:0}}>
            <span style={{color:"var(--ink-3)"}}>// SyntaxError</span>
            {result.line != null && <span style={{color:"var(--ink-3)"}}>{` at line ${result.line}, column ${result.col} (byte ${result.pos})`}</span>}
            {"\n\n"}<span style={{color:"var(--err)"}}>{result.error}</span>
            {result.snippet && <>{"\n\n"}<span style={{color:"var(--ink-3)"}}>// context</span>{"\n"}<span style={{color:"var(--ink-2)"}}>{result.snippet}</span></>}
          </pre>}
      meta={<>
        {result.ok
          ? <>
              <span style={{color:"var(--ok)"}}>valid</span><span>·</span>
              <span>{result.type}</span><span>·</span>
              <span>{result.keys.toLocaleString()} keys</span><span>·</span>
              <span>depth {result.depth}</span><span>·</span>
              <span>{result.bytes.toLocaleString()} bytes out</span>
            </>
          : <>
              <span style={{color:"var(--err)"}}>invalid</span><span>·</span>
              <span>{result.line != null ? `line ${result.line}, col ${result.col}` : "parse error"}</span>
            </>}
      </>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 2. JSON VALIDATOR
// ════════════════════════════════════════════════════════════════════════════
function JsonValidatorTool() {
  const [input, setInput] = usePersistentState("dth_json_validator_in", `{
  "name": "ada",
  "active": true,
  "roles": ["admin", "engineer"],
  "score": 99
}`);
  const result = useMemo(() => {
    if (!input.trim()) return { ok: true, empty: true };
    const r = tryParse(input);
    if (!r.ok) {
      const { line, col } = positionToLineCol(input, r.pos);
      return { ok: false, error: r.error, pos: r.pos, line, col, snippet: jsonSnippet(input, r.pos) };
    }
    return { ok: true, value: r.value, keys: countKeys(r.value), depth: depthOf(r.value), bytes: input.length, type: Array.isArray(r.value) ? "array" : r.value === null ? "null" : typeof r.value };
  }, [input]);

  return (
    <>
      {!result.empty && (result.ok
        ? statusCard(true, "Valid JSON · RFC 8259 compliant", `${result.type} · ${result.keys} keys · depth ${result.depth} · ${result.bytes.toLocaleString()} bytes`)
        : statusCard(false, result.error, result.pos != null ? `at byte ${result.pos} · line ${result.line}, column ${result.col}` : null))}
      <div className="io-panel">
        <div className="io-pane">
          <div className="io-pane-header"><span>input · JSON</span><span style={{color:"var(--ink-3)"}}>{input.length.toLocaleString()} bytes</span></div>
          <div className="io-pane-body"><textarea value={input} onChange={e=>setInput(e.target.value)} spellCheck="false"/></div>
        </div>
        <div className="io-pane">
          <div className="io-pane-header"><span>{result.ok ? "value preview" : "error context"}</span><span style={{color: result.ok ? "var(--ok)" : "var(--err)"}}>{result.empty ? "empty" : result.ok ? "✓ valid" : "✗ invalid"}</span></div>
          <div className="io-pane-body">
            {result.empty ? <pre style={{color:"var(--ink-3)"}}>(paste JSON to validate)</pre>
              : result.ok ? <pre dangerouslySetInnerHTML={{__html: highlightJSON(JSON.stringify(result.value, null, 2))}}/>
              : <pre style={{color:"var(--err)"}}>{result.snippet}</pre>}
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 3. JSON MINIFIER
// ════════════════════════════════════════════════════════════════════════════
function JsonMinifierTool() {
  const [input, setInput] = usePersistentState("dth_json_min_in", `{\n  "user":  {  "id": 1,  "name": "Ada"  },\n  "tags":   [ "alpha", "beta" ]\n}`);
  const result = useMemo(() => {
    if (!input.trim()) return { ok: true, output: "", saved: 0, pct: 0 };
    const r = tryParse(input);
    if (!r.ok) return { ok: false, error: r.error };
    const out = JSON.stringify(r.value);
    const saved = input.length - out.length;
    return { ok: true, output: out, saved, pct: input.length ? saved/input.length*100 : 0, before: input.length, after: out.length };
  }, [input]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel="input · JSON" outputLabel="output · minified"
      isError={!result.ok}
      output={result.ok ? result.output : result.error}
      controls={<>
        <button className="btn btn-ghost btn-sm" onClick={()=>{ const r = tryParse(input); if (r.ok) setInput(JSON.stringify(r.value, null, 2)); }}>Pretty-print</button>
        <button className="btn btn-ghost btn-sm" onClick={()=>setInput("")}>Clear</button>
        <div style={{flex:1}}/>
        <CopyBtn value={result.ok ? result.output : ""}/>
      </>}
      meta={result.ok ? <>
        <span>{result.before?.toLocaleString() || 0} bytes in</span><span>·</span>
        <span>{result.after?.toLocaleString() || 0} bytes out</span><span>·</span>
        <span style={{color:"var(--ok)"}}>{result.saved > 0 ? `−${result.saved.toLocaleString()} bytes (${result.pct.toFixed(1)}% smaller)` : "already minimal"}</span>
      </> : <span>invalid JSON</span>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 4. JSON SORT KEYS
// ════════════════════════════════════════════════════════════════════════════
function JsonSortKeysTool() {
  const [input, setInput] = usePersistentState("dth_json_sort_in", `{\n  "zeta": 1,\n  "alpha": 2,\n  "nested": { "z": 1, "a": { "y": 1, "b": 2 } }\n}`);
  const [order, setOrder] = useState("asc");
  const [deep, setDeep] = useState(true);
  const [ci, setCi] = useState(false);
  const [indent, setIndent] = useState(2);

  const result = useMemo(() => {
    if (!input.trim()) return { ok: true, output: "" };
    const r = tryParse(input);
    if (!r.ok) return { ok: false, error: r.error };
    const cmp = (a, b) => {
      const A = ci ? a.toLowerCase() : a, B = ci ? b.toLowerCase() : b;
      const r = A < B ? -1 : A > B ? 1 : 0;
      return order === "desc" ? -r : r;
    };
    const sort = (v) => {
      if (Array.isArray(v)) return deep ? v.map(sort) : v;
      if (v && typeof v === "object") { const o = {}; Object.keys(v).sort(cmp).forEach(k => o[k] = deep ? sort(v[k]) : v[k]); return o; }
      return v;
    };
    return { ok: true, output: JSON.stringify(sort(r.value), null, indent) };
  }, [input, order, deep, ci, indent]);

  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel="input · JSON" outputLabel="output · sorted"
      isError={!result.ok}
      controls={<>
        <div className="segmented" style={{width:140}}>
          <button className={order==="asc"?"active":""} onClick={()=>setOrder("asc")}>A → Z</button>
          <button className={order==="desc"?"active":""} onClick={()=>setOrder("desc")}>Z → A</button>
        </div>
        <label className="chip" style={{cursor:"pointer"}}>
          <input type="checkbox" checked={deep} onChange={e=>setDeep(e.target.checked)} style={{margin:0}}/> deep
        </label>
        <label className="chip" style={{cursor:"pointer"}}>
          <input type="checkbox" checked={ci} onChange={e=>setCi(e.target.checked)} style={{margin:0}}/> case-insensitive
        </label>
        <span className="chip" style={{padding:"2px 4px 2px 10px"}}>
          indent
          <span className="segmented" style={{border:0, background:"transparent", padding:0, gridTemplateColumns:"repeat(3,1fr)", marginLeft:6}}>
            {[2,4,0].map(n => <button key={n} className={indent===n?"active":""} onClick={()=>setIndent(n)}>{n===0?"min":`${n}sp`}</button>)}
          </span>
        </span>
        <div style={{flex:1}}/>
        <CopyBtn value={result.ok ? result.output : ""}/>
      </>}
      outputRich={result.ok ? <pre dangerouslySetInnerHTML={{__html: highlightJSON(result.output)}}/> : <pre style={{color:"var(--err)"}}>{result.error}</pre>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 5. JSON ESCAPE / UNESCAPE
// ════════════════════════════════════════════════════════════════════════════
function JsonEscapeTool() {
  const [mode, setMode] = useState("escape");
  const [input, setInput] = useState(`hello "world"\nnew line\ttab`);
  const result = useMemo(() => {
    try {
      if (mode === "escape") return { ok: true, output: JSON.stringify(input).slice(1, -1) };
      return { ok: true, output: JSON.parse(`"${input.replace(/(?<!\\)"/g, '\\"')}"`) };
    } catch (e) { return { ok: false, error: e.message }; }
  }, [input, mode]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel={mode === "escape" ? "input · raw text" : "input · escaped string"}
      outputLabel={mode === "escape" ? "output · JSON-escaped" : "output · raw text"}
      isError={!result.ok}
      output={result.ok ? result.output : result.error}
      controls={<>
        <div className="segmented" style={{width:180}}>
          <button className={mode==="escape"?"active":""} onClick={()=>setMode("escape")}>Escape</button>
          <button className={mode==="unescape"?"active":""} onClick={()=>setMode("unescape")}>Unescape</button>
        </div>
        <div style={{flex:1}}/>
        <CopyBtn value={result.ok ? result.output : ""}/>
      </>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 6. JSON → CSV
// ════════════════════════════════════════════════════════════════════════════
function JsonToCsvTool() {
  const [input, setInput] = usePersistentState("dth_json_csv_in", `[
  { "id": 1, "name": "Ada Lovelace",   "role": "admin",    "active": true  },
  { "id": 2, "name": "Alan Turing",    "role": "engineer", "active": true  },
  { "id": 3, "name": "Grace Hopper",   "role": "admiral",  "active": false }
]`);
  const [delim, setDelim] = useState(",");
  const [header, setHeader] = useState(true);
  const [flatten, setFlatten] = useState(false);
  const result = useMemo(() => {
    if (!input.trim()) return { ok: true, output: "" };
    const r = tryParse(input);
    if (!r.ok) return { ok: false, error: r.error };
    let arr = r.value; if (!Array.isArray(arr)) arr = [arr];
    if (flatten) arr = arr.map(x => flattenObj(x));
    const cols = Array.from(arr.reduce((set, row) => { Object.keys(row || {}).forEach(k => set.add(k)); return set; }, new Set()));
    const escape = (v) => { if (v == null) return ""; const s = typeof v === "object" ? JSON.stringify(v) : String(v); return /[",\n\r]/.test(s) || s.includes(delim) ? `"${s.replace(/"/g, '""')}"` : s; };
    const lines = arr.map(row => cols.map(c => escape(row?.[c])).join(delim));
    return { ok: true, output: (header ? cols.join(delim) + "\n" : "") + lines.join("\n"), rows: arr.length, cols: cols.length };
  }, [input, delim, header, flatten]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel="input · JSON array" outputLabel="output · CSV"
      isError={!result.ok}
      output={result.ok ? result.output : result.error}
      controls={<>
        <span className="chip" style={{padding:"2px 4px 2px 10px"}}>
          delim
          <span className="segmented" style={{border:0, background:"transparent", padding:0, gridTemplateColumns:"repeat(3,1fr)", marginLeft:6}}>
            <button className={delim===","?"active":""} onClick={()=>setDelim(",")}>,</button>
            <button className={delim==="\t"?"active":""} onClick={()=>setDelim("\t")}>tab</button>
            <button className={delim===";"?"active":""} onClick={()=>setDelim(";")}>;</button>
          </span>
        </span>
        <label className="chip" style={{cursor:"pointer"}}><input type="checkbox" checked={header} onChange={e=>setHeader(e.target.checked)} style={{margin:0}}/> header row</label>
        <label className="chip" style={{cursor:"pointer"}}><input type="checkbox" checked={flatten} onChange={e=>setFlatten(e.target.checked)} style={{margin:0}}/> flatten nested</label>
        <div style={{flex:1}}/>
        <CopyBtn value={result.ok ? result.output : ""}/>
      </>}
      meta={result.ok ? <><span>{result.rows} rows</span><span>·</span><span>{result.cols} columns</span></> : <span>invalid JSON</span>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 7. CSV → JSON
// ════════════════════════════════════════════════════════════════════════════
function CsvToJsonTool() {
  const [input, setInput] = usePersistentState("dth_csv_json_in", `id,name,role,active\n1,Ada Lovelace,admin,true\n2,Alan Turing,engineer,true\n3,"Grace Hopper",admiral,false`);
  const [delim, setDelim] = useState("auto");
  const [hasHeader, setHasHeader] = useState(true);
  const [coerce, setCoerce] = useState(true);
  const [indent, setIndent] = useState(2);
  const result = useMemo(() => {
    if (!input.trim()) return { ok: true, output: "" };
    try {
      const d = delim === "auto" ? (input.indexOf("\t") > -1 ? "\t" : input.indexOf(";") > -1 && input.indexOf(",") < 0 ? ";" : ",") : delim;
      const rows = parseCsv(input, d);
      if (rows.length === 0) return { ok: true, output: "[]" };
      const cast = (v) => { if (!coerce) return v; if (v === "") return null; if (v === "true") return true; if (v === "false") return false; if (v === "null") return null; if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v); return v; };
      let arr;
      if (hasHeader) { const head = rows[0]; arr = rows.slice(1).map(r => Object.fromEntries(head.map((h, i) => [h, cast(r[i] ?? "")]))); }
      else arr = rows.map(r => r.map(cast));
      return { ok: true, output: JSON.stringify(arr, null, indent), rows: arr.length, cols: hasHeader ? rows[0].length : rows[0]?.length || 0 };
    } catch (e) { return { ok: false, error: e.message }; }
  }, [input, delim, hasHeader, coerce, indent]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel="input · CSV" outputLabel="output · JSON"
      isError={!result.ok}
      controls={<>
        <span className="chip" style={{padding:"2px 4px 2px 10px"}}>
          delim
          <span className="segmented" style={{border:0, background:"transparent", padding:0, gridTemplateColumns:"repeat(4,1fr)", marginLeft:6}}>
            {["auto",",","\t",";"].map(d => <button key={d} className={delim===d?"active":""} onClick={()=>setDelim(d)}>{d==="auto"?"auto":d==="\t"?"tab":d}</button>)}
          </span>
        </span>
        <label className="chip" style={{cursor:"pointer"}}><input type="checkbox" checked={hasHeader} onChange={e=>setHasHeader(e.target.checked)} style={{margin:0}}/> first row is header</label>
        <label className="chip" style={{cursor:"pointer"}}><input type="checkbox" checked={coerce} onChange={e=>setCoerce(e.target.checked)} style={{margin:0}}/> coerce types</label>
        <div style={{flex:1}}/>
        <CopyBtn value={result.ok ? result.output : ""}/>
      </>}
      outputRich={result.ok ? <pre dangerouslySetInnerHTML={{__html: highlightJSON(result.output)}}/> : <pre style={{color:"var(--err)"}}>{result.error}</pre>}
      meta={result.ok ? <><span>{result.rows} rows</span><span>·</span><span>{result.cols} columns</span></> : <span>parse error</span>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 8. JSON → YAML
// ════════════════════════════════════════════════════════════════════════════
function JsonToYamlTool() {
  const [input, setInput] = usePersistentState("dth_json_yaml_in", `{\n  "name": "trydevtools",\n  "version": 1,\n  "tags": ["fast", "private"],\n  "config": { "theme": "dark", "items": [1, 2, 3] }\n}`);
  const result = useMemo(() => {
    if (!input.trim()) return { ok: true, output: "" };
    const r = tryParse(input);
    if (!r.ok) return { ok: false, error: r.error };
    return { ok: true, output: jsonToYaml(r.value) };
  }, [input]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel="input · JSON" outputLabel="output · YAML"
      isError={!result.ok}
      output={result.ok ? result.output : result.error}
      controls={<><div style={{flex:1}}/><CopyBtn value={result.ok ? result.output : ""}/></>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 9. JSON → XML
// ════════════════════════════════════════════════════════════════════════════
function JsonToXmlTool() {
  const [input, setInput] = usePersistentState("dth_json_xml_in", `{\n  "user": {\n    "id": 1,\n    "name": "Ada",\n    "roles": ["admin", "engineer"]\n  }\n}`);
  const [rootName, setRootName] = useState("root");
  const [decl, setDecl] = useState(true);
  const result = useMemo(() => {
    if (!input.trim()) return { ok: true, output: "" };
    const r = tryParse(input);
    if (!r.ok) return { ok: false, error: r.error };
    const xml = jsonToXml(r.value, rootName, 0);
    return { ok: true, output: (decl ? `<?xml version="1.0" encoding="UTF-8"?>\n` : "") + xml };
  }, [input, rootName, decl]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel="input · JSON" outputLabel="output · XML"
      isError={!result.ok}
      output={result.ok ? result.output : result.error}
      controls={<>
        <span className="chip" style={{padding:"2px 10px"}}>
          root <input value={rootName} onChange={e=>setRootName(e.target.value || "root")} style={{background:"transparent", border:0, outline:0, fontFamily:"var(--mono)", fontSize:13, color:"var(--ink)", width:80, marginLeft:6}}/>
        </span>
        <label className="chip" style={{cursor:"pointer"}}><input type="checkbox" checked={decl} onChange={e=>setDecl(e.target.checked)} style={{margin:0}}/> XML declaration</label>
        <div style={{flex:1}}/>
        <CopyBtn value={result.ok ? result.output : ""}/>
      </>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 10. JSON → TABLE
// ════════════════════════════════════════════════════════════════════════════
function JsonToTableTool() {
  const [input, setInput] = usePersistentState("dth_json_table_in", `[
  { "id": 1, "name": "Ada Lovelace",  "role": "admin",    "score": 99 },
  { "id": 2, "name": "Alan Turing",   "role": "engineer", "score": 95 },
  { "id": 3, "name": "Grace Hopper",  "role": "admiral",  "score": 100 }
]`);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const result = useMemo(() => {
    if (!input.trim()) return { ok: true, rows: [], cols: [] };
    const r = tryParse(input); if (!r.ok) return { ok: false, error: r.error };
    let arr = r.value; if (!Array.isArray(arr)) arr = [arr];
    arr = arr.map(x => (x && typeof x === "object" && !Array.isArray(x)) ? x : { value: x });
    const cols = Array.from(arr.reduce((s, row) => { Object.keys(row || {}).forEach(k => s.add(k)); return s; }, new Set()));
    return { ok: true, rows: arr, cols };
  }, [input]);
  const sorted = useMemo(() => {
    if (!result.ok || !sortKey) return result.rows || [];
    return [...result.rows].sort((a, b) => {
      const av = a?.[sortKey], bv = b?.[sortKey];
      if (av == null) return 1; if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
      const r = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? r : -r;
    });
  }, [result, sortKey, sortDir]);
  return (
    <>
      <div className="io-pane" style={{border:"1px solid var(--line)", borderRadius:"var(--r-lg)", background:"var(--bg-1)", marginBottom:14, minHeight:120}}>
        <div className="io-pane-header"><span>input · JSON array of objects</span><span style={{color:"var(--ink-3)"}}>{input.length} bytes</span></div>
        <div className="io-pane-body"><textarea value={input} onChange={e=>setInput(e.target.value)} spellCheck="false"/></div>
      </div>
      {!result.ok ? <pre style={{color:"var(--err)", padding:14, background:"var(--bg-1)", borderRadius:"var(--r)"}}>{result.error}</pre> : (
        <div className="card" style={{padding:0, overflow:"auto", maxHeight:520}}>
          <table style={{width:"100%", borderCollapse:"collapse", fontSize:13.5, fontFamily:"var(--mono)"}}>
            <thead style={{position:"sticky", top:0, background:"var(--bg-2)", zIndex:1}}>
              <tr>{result.cols.map(c => (
                <th key={c} onClick={()=>{ if (sortKey === c) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortKey(c); setSortDir("asc"); } }}
                  style={{padding:"10px 14px", textAlign:"left", borderBottom:"1px solid var(--line)", cursor:"pointer", userSelect:"none", color: sortKey === c ? "var(--accent-hi)" : "var(--ink-2)", fontWeight:600, whiteSpace:"nowrap"}}>
                  {c} {sortKey === c && (sortDir === "asc" ? "↑" : "↓")}
                </th>))}</tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <tr key={i} style={{borderBottom: i < sorted.length - 1 ? "1px solid var(--line)" : "none"}}>
                  {result.cols.map(c => { const v = row?.[c]; const display = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v); return <td key={c} style={{padding:"9px 14px", color:"var(--ink)", whiteSpace:"nowrap", maxWidth:320, overflow:"hidden", textOverflow:"ellipsis"}} title={display}>{display}</td>; })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {result.ok && <div style={{marginTop:10, fontSize:12, fontFamily:"var(--mono)", color:"var(--ink-3)"}}>{result.rows.length} rows · {result.cols.length} columns · click any header to sort</div>}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 11. JSON DIFF
// ════════════════════════════════════════════════════════════════════════════
function JsonDiffTool() {
  const [left, setLeft] = useState(`{ "id": 1, "name": "Ada", "role": "admin", "tags": ["a","b"] }`);
  const [right, setRight] = useState(`{ "id": 1, "name": "Ada Lovelace", "role": "admin", "tags": ["a","c"], "active": true }`);
  const result = useMemo(() => {
    const a = tryParse(left), b = tryParse(right);
    if (!a.ok || !b.ok) return { ok: false, error: !a.ok ? `left: ${a.error}` : `right: ${b.error}` };
    return { ok: true, diff: jsonDiff(a.value, b.value) };
  }, [left, right]);
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
      {!result.ok ? <pre style={{color:"var(--err)", padding:14, background:"var(--bg-1)", borderRadius:"var(--r)"}}>{result.error}</pre> : (
        <div className="card" style={{padding:0, fontFamily:"var(--mono)", fontSize:13}}>
          {result.diff.length === 0 ? (
            <div style={{padding:"24px", textAlign:"center", color:"var(--ok)"}}>✓ identical — no differences</div>
          ) : result.diff.map((d, i) => (
            <div key={i} style={{display:"flex", padding:"8px 14px", gap:14, borderBottom: i < result.diff.length - 1 ? "1px solid var(--line)" : "none", background: d.kind === "add" ? "rgba(52,211,153,.06)" : d.kind === "remove" ? "rgba(248,113,113,.06)" : "rgba(99,102,241,.06)"}}>
              <span style={{width:24, color: d.kind === "add" ? "var(--ok)" : d.kind === "remove" ? "var(--err)" : "var(--accent-hi)", fontWeight:700}}>{d.kind === "add" ? "+" : d.kind === "remove" ? "−" : "~"}</span>
              <span style={{width:200, color:"var(--ink-2)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{d.path}</span>
              <span style={{flex:1, color:"var(--ink)"}}>
                {d.kind === "change" ? <><span style={{color:"var(--err)"}}>{JSON.stringify(d.from)}</span> → <span style={{color:"var(--ok)"}}>{JSON.stringify(d.to)}</span></> : JSON.stringify(d.value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 12. JSONPATH TESTER
// ════════════════════════════════════════════════════════════════════════════
function JsonPathTesterTool() {
  const [input, setInput] = usePersistentState("dth_jsonpath_in", `{
  "store": {
    "books": [
      { "title": "Hyperion",  "author": "Dan Simmons", "price": 14 },
      { "title": "Dune",      "author": "Frank Herbert", "price": 12 },
      { "title": "Snow Crash","author": "Neal Stephenson", "price": 16 }
    ],
    "owner": "Ada"
  }
}`);
  const [path, setPath] = useState("$.store.books[*].title");
  const result = useMemo(() => {
    const r = tryParse(input); if (!r.ok) return { ok: false, error: r.error };
    try { return { ok: true, matches: jsonPath(r.value, path) }; } catch (e) { return { ok: false, error: e.message }; }
  }, [input, path]);
  return (
    <>
      <div style={{display:"flex", gap:8, marginBottom:14, alignItems:"center"}}>
        <div className="search-box" style={{flex:1, fontFamily:"var(--mono)"}}>
          <span style={{color:"var(--ink-3)"}}>path</span>
          <input value={path} onChange={e=>setPath(e.target.value)} spellCheck="false" style={{color:"var(--ink)", fontSize:14}}/>
        </div>
        <span className="chip accent">{result.ok ? `${result.matches.length} matches` : "error"}</span>
      </div>
      <div className="io-panel">
        <div className="io-pane">
          <div className="io-pane-header"><span>input · JSON</span><span style={{color:"var(--ink-3)"}}>{input.length}b</span></div>
          <div className="io-pane-body"><textarea value={input} onChange={e=>setInput(e.target.value)} spellCheck="false"/></div>
        </div>
        <div className="io-pane">
          <div className="io-pane-header"><span>matches</span><span style={{color: result.ok ? "var(--ok)" : "var(--err)"}}>{result.ok ? "✓ ok" : "✗ error"}</span></div>
          <div className="io-pane-body">
            {result.ok ? <pre dangerouslySetInnerHTML={{__html: highlightJSON(JSON.stringify(result.matches, null, 2))}}/> : <pre style={{color:"var(--err)"}}>{result.error}</pre>}
          </div>
        </div>
      </div>
      <div style={{marginTop:14, padding:"12px 16px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r-lg)", fontSize:12.5, color:"var(--ink-2)", lineHeight:1.7}}>
        <div style={{fontFamily:"var(--mono)", color:"var(--ink-3)", fontSize:11, marginBottom:6, textTransform:"uppercase", letterSpacing:".06em"}}>supported syntax</div>
        <code style={{color:"var(--accent-hi)"}}>$</code> root · <code style={{color:"var(--accent-hi)"}}>.foo</code> property · <code style={{color:"var(--accent-hi)"}}>[N]</code> index · <code style={{color:"var(--accent-hi)"}}>[*]</code> all · <code style={{color:"var(--accent-hi)"}}>..key</code> recursive descent
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 13. JSON SCHEMA VALIDATOR
// ════════════════════════════════════════════════════════════════════════════
function JsonSchemaValidatorTool() {
  const [data, setData] = useState(`{ "id": 1, "name": "Ada", "age": 36, "tags": ["alpha"] }`);
  const [schema, setSchema] = useState(`{
  "type": "object",
  "required": ["id", "name"],
  "properties": {
    "id":   { "type": "integer" },
    "name": { "type": "string", "minLength": 1 },
    "age":  { "type": "number", "minimum": 0 },
    "tags": { "type": "array", "items": { "type": "string" } }
  }
}`);
  const result = useMemo(() => {
    const d = tryParse(data), s = tryParse(schema);
    if (!d.ok) return { ok: false, error: `data: ${d.error}` };
    if (!s.ok) return { ok: false, error: `schema: ${s.error}` };
    const errs = []; validateSchema(d.value, s.value, "$", errs);
    return { ok: true, errs };
  }, [data, schema]);
  return (
    <>
      <div className="io-panel" style={{marginBottom:14}}>
        <div className="io-pane">
          <div className="io-pane-header"><span>data</span><span style={{color:"var(--ink-3)"}}>{data.length}b</span></div>
          <div className="io-pane-body"><textarea value={data} onChange={e=>setData(e.target.value)} spellCheck="false"/></div>
        </div>
        <div className="io-pane">
          <div className="io-pane-header"><span>schema</span><span style={{color:"var(--ink-3)"}}>{schema.length}b</span></div>
          <div className="io-pane-body"><textarea value={schema} onChange={e=>setSchema(e.target.value)} spellCheck="false"/></div>
        </div>
      </div>
      {!result.ok ? statusCard(false, result.error)
        : result.errs.length === 0 ? statusCard(true, "Data conforms to schema", "0 violations")
        : (<>
            {statusCard(false, `${result.errs.length} validation error${result.errs.length !== 1 ? "s" : ""}`)}
            <div className="card" style={{padding:0, fontFamily:"var(--mono)", fontSize:13}}>
              {result.errs.map((e, i) => (
                <div key={i} style={{display:"flex", gap:14, padding:"10px 14px", borderBottom: i < result.errs.length - 1 ? "1px solid var(--line)" : "none"}}>
                  <span style={{width:24, color:"var(--err)", fontWeight:700}}>✗</span>
                  <span style={{width:240, color:"var(--ink-2)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{e.path}</span>
                  <span style={{flex:1, color:"var(--ink)"}}>{e.msg}</span>
                </div>
              ))}
            </div>
          </>)}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 14. JSON → TYPESCRIPT
// ════════════════════════════════════════════════════════════════════════════
function JsonToTypescriptTool() {
  const [input, setInput] = usePersistentState("dth_json_ts_in", `{\n  "user": { "id": 1, "name": "Ada", "active": true, "roles": ["admin"] },\n  "count": 12,\n  "cursor": null\n}`);
  const [rootName, setRootName] = useState("Root");
  const result = useMemo(() => {
    if (!input.trim()) return { ok: true, output: "" };
    const r = tryParse(input); if (!r.ok) return { ok: false, error: r.error };
    return { ok: true, output: jsonToTypescript(r.value, rootName) };
  }, [input, rootName]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel="input · JSON sample" outputLabel="output · TypeScript"
      isError={!result.ok}
      output={result.ok ? result.output : result.error}
      controls={<>
        <span className="chip" style={{padding:"2px 10px"}}>name <input value={rootName} onChange={e=>setRootName(e.target.value || "Root")} style={{background:"transparent", border:0, outline:0, fontFamily:"var(--mono)", fontSize:13, color:"var(--ink)", width:100, marginLeft:6}}/></span>
        <div style={{flex:1}}/>
        <CopyBtn value={result.ok ? result.output : ""}/>
      </>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 15. JSON → GO STRUCT
// ════════════════════════════════════════════════════════════════════════════
function JsonToGoStructTool() {
  const [input, setInput] = usePersistentState("dth_json_go_in", `{\n  "user_id": 1,\n  "name": "Ada",\n  "is_active": true,\n  "tags": ["alpha","beta"]\n}`);
  const [rootName, setRootName] = useState("Root");
  const result = useMemo(() => {
    if (!input.trim()) return { ok: true, output: "" };
    const r = tryParse(input); if (!r.ok) return { ok: false, error: r.error };
    return { ok: true, output: jsonToGo(r.value, rootName) };
  }, [input, rootName]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel="input · JSON sample" outputLabel="output · Go struct"
      isError={!result.ok}
      output={result.ok ? result.output : result.error}
      controls={<>
        <span className="chip" style={{padding:"2px 10px"}}>name <input value={rootName} onChange={e=>setRootName(e.target.value || "Root")} style={{background:"transparent", border:0, outline:0, fontFamily:"var(--mono)", fontSize:13, color:"var(--ink)", width:100, marginLeft:6}}/></span>
        <div style={{flex:1}}/>
        <CopyBtn value={result.ok ? result.output : ""}/>
      </>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 16. JSON FLATTENER
// ════════════════════════════════════════════════════════════════════════════
function JsonFlattenerTool() {
  const [mode, setMode] = useState("flatten");
  const [input, setInput] = usePersistentState("dth_json_flat_in", `{\n  "user": {\n    "name": "Ada",\n    "address": { "city": "London", "zip": "EC1" }\n  },\n  "tags": ["alpha", "beta"]\n}`);
  const [sep, setSep] = useState(".");
  const result = useMemo(() => {
    if (!input.trim()) return { ok: true, output: "" };
    const r = tryParse(input); if (!r.ok) return { ok: false, error: r.error };
    try {
      const out = mode === "flatten" ? flattenObj(r.value, sep) : unflattenObj(r.value, sep);
      return { ok: true, output: JSON.stringify(out, null, 2), keys: Object.keys(out).length };
    } catch (e) { return { ok: false, error: e.message }; }
  }, [input, mode, sep]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel={`input · JSON ${mode === "flatten" ? "(nested)" : "(flat)"}`}
      outputLabel={`output · ${mode === "flatten" ? "flat" : "nested"}`}
      isError={!result.ok}
      controls={<>
        <div className="segmented" style={{width:200}}>
          <button className={mode==="flatten"?"active":""} onClick={()=>setMode("flatten")}>Flatten</button>
          <button className={mode==="unflatten"?"active":""} onClick={()=>setMode("unflatten")}>Unflatten</button>
        </div>
        <span className="chip" style={{padding:"2px 10px"}}>sep <input value={sep} onChange={e=>setSep(e.target.value || ".")} maxLength={3} style={{background:"transparent", border:0, outline:0, fontFamily:"var(--mono)", fontSize:13, color:"var(--ink)", width:36, marginLeft:6, textAlign:"center"}}/></span>
        <div style={{flex:1}}/>
        <CopyBtn value={result.ok ? result.output : ""}/>
      </>}
      outputRich={result.ok ? <pre dangerouslySetInnerHTML={{__html: highlightJSON(result.output)}}/> : <pre style={{color:"var(--err)"}}>{result.error}</pre>}
      meta={result.ok ? <><span>{result.keys ?? 0} keys</span></> : <span>error</span>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 17. JSON QUERY (jq subset)
// ════════════════════════════════════════════════════════════════════════════
function JsonQueryTool() {
  const [input, setInput] = usePersistentState("dth_jq_in", `{\n  "users": [\n    { "name": "Ada",   "score": 99 },\n    { "name": "Alan",  "score": 95 },\n    { "name": "Grace", "score": 100 }\n  ],\n  "total": 3\n}`);
  const [query, setQuery] = useState(".users[].name");
  const result = useMemo(() => {
    const r = tryParse(input); if (!r.ok) return { ok: false, error: r.error };
    try {
      const out = runJq(r.value, query);
      const formatted = Array.isArray(out) && out.length === 1 ? JSON.stringify(out[0], null, 2) : out.map(x => JSON.stringify(x, null, 2)).join("\n");
      return { ok: true, output: formatted, count: out.length };
    } catch (e) { return { ok: false, error: e.message }; }
  }, [input, query]);
  return (
    <>
      <div style={{display:"flex", gap:8, marginBottom:14, alignItems:"center"}}>
        <div className="search-box" style={{flex:1, fontFamily:"var(--mono)"}}>
          <span style={{color:"var(--ink-3)"}}>jq</span>
          <input value={query} onChange={e=>setQuery(e.target.value)} spellCheck="false" style={{color:"var(--ink)", fontSize:14}} placeholder=".users[].name"/>
        </div>
        <span className="chip accent">{result.ok ? `${result.count} result${result.count !== 1 ? "s" : ""}` : "error"}</span>
      </div>
      <div className="io-panel">
        <div className="io-pane">
          <div className="io-pane-header"><span>input · JSON</span><span style={{color:"var(--ink-3)"}}>{input.length}b</span></div>
          <div className="io-pane-body"><textarea value={input} onChange={e=>setInput(e.target.value)} spellCheck="false"/></div>
        </div>
        <div className="io-pane">
          <div className="io-pane-header"><span>output</span><span style={{color: result.ok ? "var(--ok)" : "var(--err)"}}>{result.ok ? "✓ ok" : "✗ error"}</span></div>
          <div className="io-pane-body">
            {result.ok ? <pre dangerouslySetInnerHTML={{__html: highlightJSON(result.output)}}/> : <pre style={{color:"var(--err)"}}>{result.error}</pre>}
          </div>
        </div>
      </div>
      <div style={{marginTop:14, padding:"12px 16px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r-lg)", fontSize:12.5, color:"var(--ink-2)", lineHeight:1.7}}>
        <div style={{fontFamily:"var(--mono)", color:"var(--ink-3)", fontSize:11, marginBottom:6, textTransform:"uppercase", letterSpacing:".06em"}}>supported syntax</div>
        <code style={{color:"var(--accent-hi)"}}>.</code> identity · <code style={{color:"var(--accent-hi)"}}>.foo</code> property · <code style={{color:"var(--accent-hi)"}}>.foo.bar</code> chain · <code style={{color:"var(--accent-hi)"}}>.[]</code> iterate · <code style={{color:"var(--accent-hi)"}}>.foo[]</code> · <code style={{color:"var(--accent-hi)"}}>.foo[N]</code> · <code style={{color:"var(--accent-hi)"}}>length</code> · <code style={{color:"var(--accent-hi)"}}>keys</code>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Register all 17 JSON tools
// ────────────────────────────────────────────────────────────────────────────
window.LIVE_TOOLS = window.LIVE_TOOLS || {};
Object.assign(window.LIVE_TOOLS, {
  "json-formatter":         { render: () => <JsonFormatterTool/> },
  "json-validator":         { render: () => <JsonValidatorTool/> },
  "json-minifier":          { render: () => <JsonMinifierTool/> },
  "json-sort-keys":         { render: () => <JsonSortKeysTool/> },
  "json-escape":            { render: () => <JsonEscapeTool/> },
  "json-to-csv":            { render: () => <JsonToCsvTool/> },
  "csv-to-json":            { render: () => <CsvToJsonTool/> },
  "json-to-yaml":           { render: () => <JsonToYamlTool/> },
  "json-to-xml":            { render: () => <JsonToXmlTool/> },
  "json-to-table":          { render: () => <JsonToTableTool/> },
  "json-diff":              { render: () => <JsonDiffTool/> },
  "jsonpath-tester":        { render: () => <JsonPathTesterTool/> },
  "json-schema-validator":  { render: () => <JsonSchemaValidatorTool/> },
  "json-to-typescript":     { render: () => <JsonToTypescriptTool/> },
  "json-to-go-struct":      { render: () => <JsonToGoStructTool/> },
  "json-flattener":         { render: () => <JsonFlattenerTool/> },
  "json-query":             { render: () => <JsonQueryTool/> },
});
