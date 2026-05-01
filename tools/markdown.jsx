// Markdown category — 9 tools
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

// ── lazy-load marked ───────────────────────────────────────────────────────
function loadMarked() {
  if (window.marked) return Promise.resolve(window.marked);
  if (window.__markedLoading) return window.__markedLoading;
  window.__markedLoading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://unpkg.com/marked@9.1.6/marked.min.js";
    s.onload = () => resolve(window.marked);
    s.onerror = () => reject(new Error("Failed to load marked"));
    document.head.appendChild(s);
  });
  return window.__markedLoading;
}
function useMarked() {
  const [ready, setReady] = useState(!!window.marked);
  const [error, setError] = useState(null);
  useEffect(() => { if (!ready) loadMarked().then(() => setReady(true)).catch(e => setError(e.message)); }, []);
  return { ready, error };
}

// ── slugify for anchors ────────────────────────────────────────────────────
function slugify(s) {
  return String(s).toLowerCase().trim()
    .replace(/[`~!@#$%^&*()_+={}\[\]\\|;:'",.<>/?]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ════════════════════════════════════════════════════════════════════════════
// 1. MARKDOWN PREVIEW (live render)
// ════════════════════════════════════════════════════════════════════════════
function MarkdownPreviewTool() {
  const [input, setInput] = usePersistentState("dth_md_in", `# TryDevTools

A **privacy-first** developer toolkit that runs entirely in your browser.

## Features

- Format JSON, validate schemas, sort keys
- Decode JWTs *without* leaking tokens
- Generate UUIDs and Nano IDs
- Convert between formats: \`JSON ↔ YAML ↔ XML\`

## Installation

\`\`\`bash
git clone https://github.com/trydevtools/trydevtools
cd trydevtools
python -m http.server 5173
\`\`\`

> Everything runs locally — your data never touches a server.

| Tool | Status |
|------|--------|
| JSON | ✅ shipped |
| Text | ✅ shipped |
| Markdown | 🔧 in progress |
`);
  const { ready, error } = useMarked();
  const html = useMemo(() => {
    if (!ready) return "";
    try { return window.marked.parse(input, { breaks: true, gfm: true }); }
    catch (e) { return `<pre style="color:var(--err)">${e.message}</pre>`; }
  }, [input, ready]);
  return (
    <div className="io-panel">
      <div className="io-pane">
        <div className="io-pane-header"><span>input · markdown</span><span style={{color:"var(--ink-3)"}}>{input.length.toLocaleString()} bytes</span></div>
        <div className="io-pane-body"><textarea value={input} onChange={e=>setInput(e.target.value)} spellCheck="false"/></div>
      </div>
      <div className="io-pane">
        <div className="io-pane-header"><span>preview · GFM</span><span style={{color: error ? "var(--err)" : ready ? "var(--ok)" : "var(--ink-3)"}}>{error ? "✗ error" : ready ? "✓ rendered" : "loading…"}</span></div>
        <div className="io-pane-body">
          {error ? <pre style={{color:"var(--err)"}}>{error}</pre>
            : !ready ? <pre style={{color:"var(--ink-3)"}}>loading marked…</pre>
            : <div className="md-preview" style={{padding:"20px 24px", overflow:"auto", height:"100%", color:"var(--ink)", lineHeight:1.65}} dangerouslySetInnerHTML={{__html: html}}/>}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 2. MARKDOWN → HTML (source view)
// ════════════════════════════════════════════════════════════════════════════
function MarkdownToHtmlTool() {
  const [input, setInput] = usePersistentState("dth_md_html_in", `# Hello

A paragraph with **bold**, *italic* and \`code\`.

- list item one
- list item two

[link to GitHub](https://github.com)
`);
  const { ready, error } = useMarked();
  const html = useMemo(() => {
    if (!ready) return "";
    try { return window.marked.parse(input, { breaks: true, gfm: true }); }
    catch (e) { return `Error: ${e.message}`; }
  }, [input, ready]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel="input · markdown"
      outputLabel="output · HTML"
      output={!ready ? "loading marked…" : html}
      isError={!!error}
      controls={<><div style={{flex:1}}/><CopyBtn value={html}/></>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 3. HTML → MARKDOWN (basic converter, zero deps)
// ════════════════════════════════════════════════════════════════════════════
function htmlToMarkdown(html) {
  const doc = new DOMParser().parseFromString(`<div id="r">${html}</div>`, "text/html");
  const root = doc.getElementById("r");
  if (!root) return "";
  const walk = (node, depth = 0, listType = null, listIndex = 1) => {
    if (node.nodeType === Node.TEXT_NODE) return node.nodeValue.replace(/\s+/g, " ");
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const tag = node.tagName.toLowerCase();
    const inner = () => Array.from(node.childNodes).map(n => walk(n, depth, listType, listIndex)).join("");
    const block = (s) => `\n${s}\n\n`;
    switch (tag) {
      case "h1": return block("# " + inner());
      case "h2": return block("## " + inner());
      case "h3": return block("### " + inner());
      case "h4": return block("#### " + inner());
      case "h5": return block("##### " + inner());
      case "h6": return block("###### " + inner());
      case "p": return block(inner().trim());
      case "br": return "  \n";
      case "hr": return "\n---\n\n";
      case "strong": case "b": return "**" + inner() + "**";
      case "em": case "i": return "_" + inner() + "_";
      case "code":
        if (node.parentElement?.tagName.toLowerCase() === "pre") return inner();
        return "`" + inner() + "`";
      case "pre": {
        const code = node.querySelector("code");
        const lang = code ? (code.className.match(/language-(\w+)/)?.[1] || "") : "";
        return block("```" + lang + "\n" + (code ? code.textContent : node.textContent) + "\n```");
      }
      case "a": return `[${inner()}](${node.getAttribute("href") || ""})`;
      case "img": return `![${node.getAttribute("alt") || ""}](${node.getAttribute("src") || ""})`;
      case "blockquote":
        return inner().split("\n").filter(Boolean).map(l => "> " + l).join("\n") + "\n\n";
      case "ul": {
        let i = 1; let s = "";
        for (const c of node.children) { if (c.tagName.toLowerCase() === "li") s += walk(c, depth, "ul", i++); }
        return "\n" + s + (depth === 0 ? "\n" : "");
      }
      case "ol": {
        let i = 1; let s = "";
        for (const c of node.children) { if (c.tagName.toLowerCase() === "li") s += walk(c, depth, "ol", i++); }
        return "\n" + s + (depth === 0 ? "\n" : "");
      }
      case "li": {
        const prefix = listType === "ol" ? `${listIndex}. ` : "- ";
        const indent = "  ".repeat(depth);
        const childText = Array.from(node.childNodes).map(n => walk(n, depth + 1, listType, listIndex)).join("").trim();
        return indent + prefix + childText.replace(/\n/g, "\n" + indent + "  ") + "\n";
      }
      case "table": {
        const rows = Array.from(node.querySelectorAll("tr"));
        if (!rows.length) return "";
        const cellText = (c) => Array.from(c.childNodes).map(n => walk(n, depth, listType, listIndex)).join("").replace(/\|/g, "\\|").trim();
        const head = Array.from(rows[0].children).map(cellText);
        const body = rows.slice(1).map(r => Array.from(r.children).map(cellText));
        const sep = head.map(() => "---");
        return "\n" + [head, sep, ...body].map(r => "| " + r.join(" | ") + " |").join("\n") + "\n\n";
      }
      default: return inner();
    }
  };
  return walk(root).replace(/\n{3,}/g, "\n\n").trim();
}
function HtmlToMarkdownTool() {
  const [input, setInput] = usePersistentState("dth_html_md_in", `<h1>Hello world</h1>
<p>A paragraph with <strong>bold</strong>, <em>italic</em> and <code>inline code</code>.</p>
<ul>
  <li>first</li>
  <li>second</li>
</ul>
<p><a href="https://example.com">a link</a> and an image: <img src="logo.png" alt="logo"/></p>
<pre><code class="language-js">const x = 42;</code></pre>
<blockquote>Stay curious.</blockquote>`);
  const md = useMemo(() => { try { return htmlToMarkdown(input); } catch (e) { return "Error: " + e.message; } }, [input]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel="input · HTML"
      outputLabel="output · markdown"
      output={md}
      controls={<><div style={{flex:1}}/><CopyBtn value={md}/></>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 4. MARKDOWN TABLE → CSV (Excel-compatible)
// ════════════════════════════════════════════════════════════════════════════
function parseMdTables(md) {
  const tables = [];
  const lines = md.split("\n");
  let i = 0;
  while (i < lines.length) {
    if (/^\s*\|.+\|\s*$/.test(lines[i]) && i + 1 < lines.length && /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(lines[i+1])) {
      const tableLines = [lines[i]];
      let j = i + 1;
      while (j < lines.length && /^\s*\|.+\|\s*$/.test(lines[j])) { tableLines.push(lines[j]); j++; }
      const splitRow = (l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(c => c.trim());
      const head = splitRow(tableLines[0]);
      const body = tableLines.slice(2).map(splitRow);
      tables.push({ head, body });
      i = j;
    } else i++;
  }
  return tables;
}
function MarkdownToExcelTool() {
  const [input, setInput] = usePersistentState("dth_md_excel_in", `# Q1 Sales

| Product | Units | Revenue |
|---------|-------|---------|
| Widget  | 1200  | $24,000 |
| Gadget  | 850   | $17,000 |
| Doohickey | 410 | $4,100  |

Some other text.

| Region | Sales |
|--------|-------|
| North  | 50    |
| South  | 80    |
`);
  const tables = useMemo(() => parseMdTables(input), [input]);
  const csv = useMemo(() => tables.map(t => {
    const escape = (v) => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    return [t.head.map(escape).join(","), ...t.body.map(r => r.map(escape).join(","))].join("\n");
  }).join("\n\n"), [tables]);
  const downloadCsv = () => {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "tables.csv"; a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel="input · markdown with tables"
      outputLabel="output · CSV (open in Excel)"
      output={csv || "(no tables found)"}
      controls={<>
        <button className="btn btn-ghost btn-sm" onClick={downloadCsv} disabled={!csv}>Download CSV</button>
        <div style={{flex:1}}/>
        <CopyBtn value={csv}/>
      </>}
      meta={<><span>{tables.length} table{tables.length !== 1 ? "s" : ""} parsed</span></>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 5. MARKDOWN TABLE GENERATOR (visual)
// ════════════════════════════════════════════════════════════════════════════
function MarkdownTableGeneratorTool() {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [aligns, setAligns] = useState(["left","left","left"]);
  const [cells, setCells] = useState([
    ["Name", "Role", "Score"],
    ["Ada", "Admin", "99"],
    ["Alan", "Engineer", "95"],
    ["Grace", "Admiral", "100"],
  ]);
  useEffect(() => {
    setCells(prev => Array.from({length: rows + 1}, (_, r) => Array.from({length: cols}, (_, c) => prev[r]?.[c] ?? "")));
    setAligns(prev => Array.from({length: cols}, (_, c) => prev[c] ?? "left"));
  }, [rows, cols]);
  const updateCell = (r, c, v) => setCells(prev => prev.map((row, i) => i === r ? row.map((cell, j) => j === c ? v : cell) : row));
  const md = useMemo(() => {
    const sepFor = (a) => a === "center" ? ":---:" : a === "right" ? "---:" : ":---";
    const lines = [
      "| " + cells[0].join(" | ") + " |",
      "| " + aligns.map(sepFor).join(" | ") + " |",
      ...cells.slice(1).map(row => "| " + row.join(" | ") + " |"),
    ];
    return lines.join("\n");
  }, [cells, aligns]);
  return (
    <>
      <div style={{display:"flex", gap:10, marginBottom:14, flexWrap:"wrap", alignItems:"center"}}>
        <span className="chip" style={{padding:"2px 10px 2px 12px"}}>
          rows <input type="range" min="1" max="20" value={rows} onChange={e=>setRows(+e.target.value)} style={{width:90, margin:"0 8px"}}/><span className="mono" style={{minWidth:22}}>{rows}</span>
        </span>
        <span className="chip" style={{padding:"2px 10px 2px 12px"}}>
          cols <input type="range" min="1" max="10" value={cols} onChange={e=>setCols(+e.target.value)} style={{width:90, margin:"0 8px"}}/><span className="mono" style={{minWidth:22}}>{cols}</span>
        </span>
        <div style={{flex:1}}/>
        <CopyBtn value={md} label="Copy MD"/>
      </div>
      <div className="card" style={{padding:0, overflow:"auto", marginBottom:14}}>
        <table style={{width:"100%", borderCollapse:"collapse"}}>
          <thead>
            <tr>
              {Array.from({length: cols}, (_, c) => (
                <th key={c} style={{padding:"6px 8px", borderBottom:"2px solid var(--line)", background:"var(--bg-2)"}}>
                  <input value={cells[0]?.[c] ?? ""} onChange={e=>updateCell(0, c, e.target.value)} style={{width:"100%", background:"transparent", border:0, outline:0, fontFamily:"var(--mono)", fontSize:13, color:"var(--ink)", fontWeight:600, padding:"4px 6px"}}/>
                  <select value={aligns[c]} onChange={e=>setAligns(prev => prev.map((a,i) => i===c ? e.target.value : a))} style={{marginTop:4, fontSize:10, fontFamily:"var(--mono)", background:"var(--bg-3)", border:"1px solid var(--line)", color:"var(--ink-2)", borderRadius:4, padding:"1px 4px", cursor:"pointer"}}>
                    <option value="left">left</option><option value="center">center</option><option value="right">right</option>
                  </select>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({length: rows}, (_, r) => (
              <tr key={r}>
                {Array.from({length: cols}, (_, c) => (
                  <td key={c} style={{padding:0, borderBottom:"1px solid var(--line)"}}>
                    <input value={cells[r+1]?.[c] ?? ""} onChange={e=>updateCell(r+1, c, e.target.value)} style={{width:"100%", background:"transparent", border:0, outline:0, fontFamily:"var(--mono)", fontSize:13, color:"var(--ink)", padding:"8px 10px"}}/>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="io-pane" style={{border:"1px solid var(--line)", borderRadius:"var(--r-lg)", background:"var(--bg-1)"}}>
        <div className="io-pane-header"><span>output · markdown</span><span style={{color:"var(--ok)"}}>✓ ok</span></div>
        <div className="io-pane-body"><pre>{md}</pre></div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 6. README GENERATOR (template-driven)
// ════════════════════════════════════════════════════════════════════════════
function ReadmeGeneratorTool() {
  const [f, setF] = usePersistentState("dth_readme_in", {
    name: "trydevtools",
    tagline: "Every developer tool, in your browser",
    description: "TryDevTools is a privacy-first collection of 150+ developer utilities — JSON, text, encoding, regex, color and more — that run entirely in your browser. No accounts, no uploads, no tracking.",
    install: "git clone https://github.com/you/trydevtools\ncd trydevtools\npython -m http.server 5173",
    usage: "Open http://localhost:5173 in your browser and start using any tool.",
    features: "Format JSON\nDecode JWTs\nGenerate UUIDs and Nano IDs\nConvert between JSON, YAML, XML and CSV",
    license: "MIT",
    author: "your-name",
  });
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const md = useMemo(() => {
    const features = f.features.split("\n").filter(Boolean).map(l => "- " + l).join("\n");
    return `# ${f.name}

> ${f.tagline}

${f.description}

## Features

${features}

## Installation

\`\`\`bash
${f.install}
\`\`\`

## Usage

${f.usage}

## License

${f.license} © ${f.author}
`;
  }, [f]);
  const Field = ({ k, label, area }) => area
    ? <label style={{display:"block", marginBottom:14}}>
        <div className="eyebrow" style={{marginBottom:6}}>{label}</div>
        <textarea value={f[k]} onChange={e=>set(k, e.target.value)} spellCheck="false" style={{width:"100%", minHeight:80, padding:"10px 12px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", fontSize:13, resize:"vertical"}}/>
      </label>
    : <label style={{display:"block", marginBottom:14}}>
        <div className="eyebrow" style={{marginBottom:6}}>{label}</div>
        <input value={f[k]} onChange={e=>set(k, e.target.value)} style={{width:"100%", padding:"10px 12px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", fontSize:13}}/>
      </label>;
  return (
    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:20}}>
      <div>
        <div className="eyebrow" style={{marginBottom:14}}>fill in your project</div>
        <Field k="name"        label="project name"/>
        <Field k="tagline"     label="tagline"/>
        <Field k="description" label="description" area/>
        <Field k="features"    label="features (one per line)" area/>
        <Field k="install"     label="install commands" area/>
        <Field k="usage"       label="usage" area/>
        <Field k="license"     label="license"/>
        <Field k="author"      label="author / org"/>
      </div>
      <div>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14}}>
          <div className="eyebrow">README.md preview</div>
          <CopyBtn value={md} label="Copy MD"/>
        </div>
        <div className="card" style={{padding:0}}>
          <pre style={{padding:"18px 20px", margin:0, fontFamily:"var(--mono)", fontSize:13, color:"var(--ink)", whiteSpace:"pre-wrap", maxHeight:600, overflow:"auto"}}>{md}</pre>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 7. MDX LINTER (basic checks)
// ════════════════════════════════════════════════════════════════════════════
function lintMdx(src) {
  const errs = [];
  const lines = src.split("\n");
  // unbalanced braces in JSX expressions
  let braceDepth = 0;
  // unclosed JSX tags (simple stack; ignores fragments and self-closing)
  const stack = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;
    // Skip code blocks
    if (/^```/.test(line)) continue;
    // braces
    for (let j = 0; j < line.length; j++) {
      if (line[j] === "{" && line[j-1] !== "\\") braceDepth++;
      else if (line[j] === "}" && line[j-1] !== "\\") {
        braceDepth--;
        if (braceDepth < 0) { errs.push({ line: lineNo, col: j+1, msg: "unmatched closing brace }" }); braceDepth = 0; }
      }
    }
    // JSX tags — find <Tag ...> and </Tag>
    const tagRe = /<\/?([A-Z][A-Za-z0-9]*)\b[^>]*?(\/?)>/g;
    let m;
    while ((m = tagRe.exec(line))) {
      const isClose = m[0].startsWith("</");
      const isSelf = m[0].endsWith("/>");
      const name = m[1];
      if (isSelf) continue;
      if (isClose) {
        if (!stack.length || stack[stack.length-1].name !== name) {
          errs.push({ line: lineNo, col: m.index+1, msg: `unexpected closing tag </${name}> (expected </${stack[stack.length-1]?.name || "?"}>)` });
        } else stack.pop();
      } else stack.push({ name, line: lineNo });
    }
    // bare {expr without closing } on the same line — only flag if line ends with open brace
    if (/\{[^}]*$/.test(line) && !/^```/.test(line)) {
      // multiline expression — OK if next line continues
    }
    // duplicate front-matter delimiter
    if (i === 0 && line === "---") {
      const end = lines.slice(1).indexOf("---");
      if (end < 0) errs.push({ line: 1, col: 1, msg: "front-matter opened with --- but never closed" });
    }
  }
  if (braceDepth > 0) errs.push({ line: lines.length, col: 1, msg: `${braceDepth} unclosed brace${braceDepth !== 1 ? "s" : ""} {` });
  for (const t of stack) errs.push({ line: t.line, col: 1, msg: `unclosed JSX tag <${t.name}>` });
  return errs;
}
function MdxLinterTool() {
  const [input, setInput] = usePersistentState("dth_mdx_lint_in", `---
title: Hello MDX
---

import { Button } from "./Button";

# Hello

A paragraph with a <Button onClick={() => alert("hi")}>click me</Button>.

<Container>
  <Item>nested</Item>
</Container>

Bad: <Unclosed>
Bad: { expr without close
`);
  const errs = useMemo(() => lintMdx(input), [input]);
  return (
    <>
      <div className="io-pane" style={{border:"1px solid var(--line)", borderRadius:"var(--r-lg)", background:"var(--bg-1)", marginBottom:14, minHeight:240}}>
        <div className="io-pane-header"><span>input · MDX</span><span style={{color: errs.length ? "var(--err)" : "var(--ok)"}}>{errs.length ? `${errs.length} issue${errs.length !== 1 ? "s" : ""}` : "✓ clean"}</span></div>
        <div className="io-pane-body"><textarea value={input} onChange={e=>setInput(e.target.value)} spellCheck="false"/></div>
      </div>
      {errs.length === 0 ? (
        <div className="card" style={{padding:24, textAlign:"center", color:"var(--ok)"}}>✓ no issues found</div>
      ) : (
        <div className="card" style={{padding:0, fontFamily:"var(--mono)", fontSize:13}}>
          {errs.map((e, i) => (
            <div key={i} style={{display:"flex", gap:14, padding:"10px 14px", borderBottom: i < errs.length-1 ? "1px solid var(--line)" : "none"}}>
              <span style={{width:80, color:"var(--err)", fontWeight:600}}>line {e.line}</span>
              <span style={{width:60, color:"var(--ink-3)"}}>col {e.col}</span>
              <span style={{flex:1, color:"var(--ink)"}}>{e.msg}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 8. TOC GENERATOR
// ════════════════════════════════════════════════════════════════════════════
function TocGeneratorTool() {
  const [input, setInput] = usePersistentState("dth_toc_in", `# Project Overview

## Getting Started

### Installation

### Configuration

## Usage

### Basic Usage

### Advanced Patterns

#### Caching

#### Streaming

## API Reference

### Endpoints

### Authentication

## License
`);
  const [maxLevel, setMaxLevel] = useState(4);
  const [skipFirst, setSkipFirst] = useState(true);
  const toc = useMemo(() => {
    const lines = input.split("\n");
    const headings = [];
    let inCode = false;
    for (const line of lines) {
      if (/^```/.test(line)) { inCode = !inCode; continue; }
      if (inCode) continue;
      const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
      if (m && m[1].length <= maxLevel) headings.push({ level: m[1].length, text: m[2].trim() });
    }
    const start = skipFirst && headings[0]?.level === 1 ? 1 : 0;
    const baseLevel = Math.min(...headings.slice(start).map(h => h.level), 6);
    const slugCounts = {};
    return headings.slice(start).map(h => {
      const indent = "  ".repeat(h.level - baseLevel);
      const baseSlug = slugify(h.text);
      slugCounts[baseSlug] = (slugCounts[baseSlug] || 0) + 1;
      const slug = slugCounts[baseSlug] === 1 ? baseSlug : `${baseSlug}-${slugCounts[baseSlug] - 1}`;
      return `${indent}- [${h.text}](#${slug})`;
    }).join("\n");
  }, [input, maxLevel, skipFirst]);
  return (
    <IOFrame
      input={input} setInput={setInput}
      inputLabel="input · markdown with headings"
      outputLabel="output · TOC"
      output={toc || "(no headings found)"}
      controls={<>
        <span className="chip" style={{padding:"2px 4px 2px 10px"}}>
          max depth
          <span className="segmented" style={{border:0, background:"transparent", padding:0, gridTemplateColumns:"repeat(6,1fr)", marginLeft:6}}>
            {[1,2,3,4,5,6].map(n => <button key={n} className={maxLevel===n?"active":""} onClick={()=>setMaxLevel(n)}>H{n}</button>)}
          </span>
        </span>
        <label className="chip" style={{cursor:"pointer"}}>
          <input type="checkbox" checked={skipFirst} onChange={e=>setSkipFirst(e.target.checked)} style={{margin:0}}/> skip H1
        </label>
        <div style={{flex:1}}/>
        <CopyBtn value={toc}/>
      </>}
      meta={<span>{toc ? toc.split("\n").length : 0} entries</span>}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 9. GITHUB EMOJI PICKER
// ════════════════════════════════════════════════════════════════════════════
const GH_EMOJI = [
  // Faces
  ["smile","😄"],["laughing","😆"],["grin","😁"],["joy","😂"],["rofl","🤣"],["smiley","😃"],["sweat_smile","😅"],["wink","😉"],["blush","😊"],["heart_eyes","😍"],["star_struck","🤩"],["kissing_heart","😘"],["yum","😋"],["sunglasses","😎"],["nerd_face","🤓"],["thinking","🤔"],["smirk","😏"],["unamused","😒"],["roll_eyes","🙄"],["grimacing","😬"],["lying_face","🤥"],["sleeping","😴"],["hushed","😯"],["frowning","😦"],["anguished","😧"],["fearful","😨"],["weary","😩"],["sob","😭"],["scream","😱"],["angry","😠"],["rage","😡"],["face_with_symbols_over_mouth","🤬"],["exploding_head","🤯"],["cold_face","🥶"],["hot_face","🥵"],["nauseated_face","🤢"],["face_vomiting","🤮"],["mask","😷"],["partying_face","🥳"],["pleading_face","🥺"],["zany_face","🤪"],["smiling_imp","😈"],["imp","👿"],["skull","💀"],["robot","🤖"],["alien","👽"],["ghost","👻"],
  // Hand & body
  ["thumbsup","👍"],["+1","👍"],["thumbsdown","👎"],["-1","👎"],["clap","👏"],["wave","👋"],["raised_hand","✋"],["raised_hands","🙌"],["pray","🙏"],["ok_hand","👌"],["pinched_fingers","🤌"],["v","✌️"],["crossed_fingers","🤞"],["love_you","🤟"],["metal","🤘"],["call_me_hand","🤙"],["point_left","👈"],["point_right","👉"],["point_up","👆"],["point_down","👇"],["fist","✊"],["punch","👊"],["fist_left","🤛"],["fist_right","🤜"],["muscle","💪"],["handshake","🤝"],["writing_hand","✍️"],["selfie","🤳"],["eyes","👀"],["brain","🧠"],["heart","❤️"],["broken_heart","💔"],["sparkling_heart","💖"],["green_heart","💚"],["yellow_heart","💛"],["blue_heart","💙"],["purple_heart","💜"],["black_heart","🖤"],["white_heart","🤍"],["orange_heart","🧡"],
  // Objects / GitHub
  ["fire","🔥"],["star","⭐"],["star2","🌟"],["sparkles","✨"],["zap","⚡"],["boom","💥"],["bulb","💡"],["bomb","💣"],["rocket","🚀"],["package","📦"],["wrench","🔧"],["hammer","🔨"],["gear","⚙️"],["nut_and_bolt","🔩"],["lock","🔒"],["unlock","🔓"],["key","🔑"],["mag","🔍"],["computer","💻"],["keyboard","⌨️"],["printer","🖨️"],["floppy_disk","💾"],["satellite","📡"],["bookmark","🔖"],["chart_with_upwards_trend","📈"],["chart_with_downwards_trend","📉"],["bar_chart","📊"],["clipboard","📋"],["pencil","✏️"],["page_facing_up","📄"],["scroll","📜"],["link","🔗"],["paperclip","📎"],
  // Status
  ["check","✅"],["white_check_mark","✅"],["x","❌"],["heavy_check_mark","✔️"],["heavy_multiplication_x","✖️"],["heavy_plus_sign","➕"],["heavy_minus_sign","➖"],["warning","⚠️"],["no_entry","⛔"],["construction","🚧"],["bug","🐛"],["lady_beetle","🐞"],["question","❓"],["exclamation","❗"],["bangbang","‼️"],["interrobang","⁉️"],["100","💯"],
  // Tech / dev
  ["sparkler","🎇"],["tada","🎉"],["confetti_ball","🎊"],["balloon","🎈"],["gift","🎁"],["trophy","🏆"],["medal","🏅"],["dart","🎯"],["soccer","⚽"],["basketball","🏀"],
  // Animals (popular GH)
  ["octocat","🐙"],["cat","🐱"],["dog","🐶"],["mouse","🐭"],["rabbit","🐰"],["fox_face","🦊"],["bear","🐻"],["panda_face","🐼"],["pig","🐷"],["frog","🐸"],["monkey","🐵"],["see_no_evil","🙈"],["hear_no_evil","🙉"],["speak_no_evil","🙊"],["unicorn","🦄"],["dragon","🐉"],
  // Food
  ["coffee","☕"],["tea","🍵"],["beer","🍺"],["pizza","🍕"],["hamburger","🍔"],["donut","🍩"],["cookie","🍪"],["cake","🎂"],["apple","🍎"],["banana","🍌"],
  // Misc
  ["earth_americas","🌎"],["earth_africa","🌍"],["earth_asia","🌏"],["sunny","☀️"],["partly_sunny","⛅"],["cloud","☁️"],["umbrella","☂️"],["snowflake","❄️"],["rainbow","🌈"],["mountain","⛰️"],["ocean","🌊"],
];
function GithubEmojiTool() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q.trim()) return GH_EMOJI;
    const n = q.toLowerCase();
    return GH_EMOJI.filter(([code]) => code.includes(n));
  }, [q]);
  const [copied, setCopied] = useState(null);
  const copy = (s) => { navigator.clipboard.writeText(s); setCopied(s); setTimeout(() => setCopied(null), 1000); };
  return (
    <>
      <div style={{display:"flex", gap:10, marginBottom:14, alignItems:"center"}}>
        <div className="search-box" style={{flex:1}}>
          <Icon.Search style={{color:"var(--ink-3)"}}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder={`Search ${GH_EMOJI.length} emoji shortcodes…`} spellCheck="false" style={{fontSize:14}}/>
          {q && <button onClick={()=>setQ("")} style={{color:"var(--ink-3)", display:"flex"}}><Icon.X/></button>}
        </div>
        <span className="chip accent">{filtered.length} match{filtered.length !== 1 ? "es" : ""}</span>
      </div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:8, maxHeight:540, overflow:"auto"}}>
        {filtered.map(([code, emoji]) => {
          const shortcode = `:${code}:`;
          return (
            <button key={code+emoji} onClick={()=>copy(shortcode)}
              className="card"
              style={{padding:"10px 12px", display:"flex", alignItems:"center", gap:10, cursor:"pointer", textAlign:"left", background: copied === shortcode ? "var(--accent-soft)" : "var(--bg-1)", borderColor: copied === shortcode ? "var(--accent)" : "var(--line)", transition:"all 120ms"}}>
              <span style={{fontSize:22, fontFamily:"system-ui"}}>{emoji}</span>
              <span style={{flex:1, fontFamily:"var(--mono)", fontSize:12, color: copied === shortcode ? "var(--accent-hi)" : "var(--ink-2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                {copied === shortcode ? "✓ copied!" : shortcode}
              </span>
            </button>
          );
        })}
      </div>
      {filtered.length === 0 && <div className="card" style={{padding:32, textAlign:"center", color:"var(--ink-3)"}}>No emoji shortcodes match "{q}"</div>}
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Register markdown tools
// ────────────────────────────────────────────────────────────────────────────
window.LIVE_TOOLS = window.LIVE_TOOLS || {};
Object.assign(window.LIVE_TOOLS, {
  "markdown-preview":          { render: () => <MarkdownPreviewTool/> },
  "markdown-to-html":          { render: () => <MarkdownToHtmlTool/> },
  "html-to-markdown":          { render: () => <HtmlToMarkdownTool/> },
  "markdown-to-excel":         { render: () => <MarkdownToExcelTool/> },
  "markdown-table-generator":  { render: () => <MarkdownTableGeneratorTool/> },
  "readme-generator":          { render: () => <ReadmeGeneratorTool/> },
  "mdx-linter":                { render: () => <MdxLinterTool/> },
  "toc-generator":             { render: () => <TocGeneratorTool/> },
  "github-emoji":              { render: () => <GithubEmojiTool/> },
});
