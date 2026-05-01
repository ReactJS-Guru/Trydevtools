// Web category — 10 tools
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

function NetNotice({ text }) {
  return (
    <div className="card" style={{padding:"10px 14px", marginBottom:14, fontSize:12.5, color:"var(--ink-2)", background:"rgba(99,102,241,.06)", borderColor:"rgba(99,102,241,.25)", display:"flex", alignItems:"center", gap:10}}>
      <span style={{color:"var(--accent-hi)"}}>ⓘ</span>
      <span>{text}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 1. HTTP STATUS CODES (searchable list)
// ════════════════════════════════════════════════════════════════════════════
const HTTP_CODES = [
  { code: 100, name: "Continue", desc: "Request received, continue with body." },
  { code: 101, name: "Switching Protocols", desc: "Server is switching protocols per Upgrade header." },
  { code: 102, name: "Processing", desc: "WebDAV — server is still processing the request." },
  { code: 103, name: "Early Hints", desc: "Used to return preliminary hints (e.g. Link headers) before the final response." },
  { code: 200, name: "OK", desc: "Standard success response." },
  { code: 201, name: "Created", desc: "Resource created — typically returned from POST. Should include a Location header." },
  { code: 202, name: "Accepted", desc: "Request accepted but not yet processed (async work)." },
  { code: 204, name: "No Content", desc: "Success with no body — typical for DELETE or PUT." },
  { code: 206, name: "Partial Content", desc: "Range request succeeded — used by video streaming and resumable downloads." },
  { code: 301, name: "Moved Permanently", desc: "Permanent redirect. Browsers cache aggressively. Updates bookmarks." },
  { code: 302, name: "Found", desc: "Temporary redirect, but most clients change method to GET. Prefer 307 for non-GET." },
  { code: 303, name: "See Other", desc: "Always redirect with GET (e.g. POST → results page)." },
  { code: 304, name: "Not Modified", desc: "Cache hit — body not sent. Used with ETag / If-Modified-Since." },
  { code: 307, name: "Temporary Redirect", desc: "Like 302 but preserves the request method." },
  { code: 308, name: "Permanent Redirect", desc: "Like 301 but preserves the request method." },
  { code: 400, name: "Bad Request", desc: "Malformed syntax — generic client error." },
  { code: 401, name: "Unauthorized", desc: "Authentication required or failed. Server should send WWW-Authenticate." },
  { code: 402, name: "Payment Required", desc: "Reserved for future use. Sometimes used by APIs for rate-limit/billing." },
  { code: 403, name: "Forbidden", desc: "Authenticated but not authorised — different from 401." },
  { code: 404, name: "Not Found", desc: "Resource doesn't exist. Don't leak whether it existed before." },
  { code: 405, name: "Method Not Allowed", desc: "Resource exists but doesn't support this HTTP method. Should send Allow header." },
  { code: 406, name: "Not Acceptable", desc: "Server can't produce a response matching the Accept header." },
  { code: 408, name: "Request Timeout", desc: "Client took too long to send the request." },
  { code: 409, name: "Conflict", desc: "Request conflicts with current state — e.g. concurrent edit, duplicate key." },
  { code: 410, name: "Gone", desc: "Permanently deleted. Stronger than 404." },
  { code: 411, name: "Length Required", desc: "Server requires Content-Length." },
  { code: 412, name: "Precondition Failed", desc: "If-Match / If-Unmodified-Since check failed." },
  { code: 413, name: "Payload Too Large", desc: "Body exceeds server limit." },
  { code: 414, name: "URI Too Long", desc: "URL exceeds server limit." },
  { code: 415, name: "Unsupported Media Type", desc: "Content-Type isn't supported by the endpoint." },
  { code: 418, name: "I'm a teapot", desc: "April Fools' RFC. Don't use for real APIs." },
  { code: 422, name: "Unprocessable Entity", desc: "Syntactically valid but semantically wrong (e.g. validation errors)." },
  { code: 423, name: "Locked", desc: "WebDAV — resource is locked." },
  { code: 424, name: "Failed Dependency", desc: "Previous request in chain failed." },
  { code: 425, name: "Too Early", desc: "Server unwilling to risk processing a request that might be replayed." },
  { code: 426, name: "Upgrade Required", desc: "Client must switch to a different protocol." },
  { code: 428, name: "Precondition Required", desc: "Server requires the request to be conditional (If-Match etc.)." },
  { code: 429, name: "Too Many Requests", desc: "Rate-limited. Should send Retry-After." },
  { code: 431, name: "Request Header Fields Too Large", desc: "Headers exceed server limit." },
  { code: 451, name: "Unavailable For Legal Reasons", desc: "Blocked by court order, government, etc." },
  { code: 500, name: "Internal Server Error", desc: "Generic 'something broke' on the server." },
  { code: 501, name: "Not Implemented", desc: "Server doesn't support the request method." },
  { code: 502, name: "Bad Gateway", desc: "Upstream server returned an invalid response." },
  { code: 503, name: "Service Unavailable", desc: "Server overloaded or down for maintenance." },
  { code: 504, name: "Gateway Timeout", desc: "Upstream server didn't respond in time." },
  { code: 505, name: "HTTP Version Not Supported", desc: "Server doesn't support the HTTP version in the request." },
  { code: 507, name: "Insufficient Storage", desc: "WebDAV — server out of storage." },
  { code: 508, name: "Loop Detected", desc: "WebDAV — infinite loop detected." },
  { code: 510, name: "Not Extended", desc: "Further extensions to the request are required." },
  { code: 511, name: "Network Authentication Required", desc: "Captive portal — sign in to Wi-Fi etc." },
];
function HttpStatusTool() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q.trim()) return HTTP_CODES;
    const n = q.toLowerCase();
    return HTTP_CODES.filter(c => String(c.code).includes(n) || c.name.toLowerCase().includes(n) || c.desc.toLowerCase().includes(n));
  }, [q]);
  const groupColor = (c) => c < 200 ? "var(--ink-3)" : c < 300 ? "var(--ok)" : c < 400 ? "var(--accent-hi)" : c < 500 ? "#fbbf24" : "var(--err)";
  return (
    <>
      <div style={{display:"flex", gap:10, marginBottom:14, alignItems:"center"}}>
        <div className="search-box" style={{flex:1}}>
          <Icon.Search style={{color:"var(--ink-3)"}}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search code, name or description (e.g. 404, redirect, auth)" spellCheck="false" style={{fontSize:14}}/>
          {q && <button onClick={()=>setQ("")} style={{color:"var(--ink-3)", display:"flex"}}><Icon.X/></button>}
        </div>
        <span className="chip accent">{filtered.length} of {HTTP_CODES.length}</span>
      </div>
      <div className="card" style={{padding:0, overflow:"hidden"}}>
        {filtered.map((c, i) => (
          <div key={c.code} style={{display:"flex", alignItems:"flex-start", padding:"12px 16px", borderBottom: i < filtered.length-1 ? "1px solid var(--line)" : "none", gap:16}}>
            <span className="mono" style={{fontSize:18, fontWeight:700, color: groupColor(c.code), width:60, flexShrink:0}}>{c.code}</span>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:14, fontWeight:600, color:"var(--ink)", marginBottom:2}}>{c.name}</div>
              <div style={{fontSize:13, color:"var(--ink-2)", lineHeight:1.5}}>{c.desc}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={()=>navigator.clipboard.writeText(`${c.code} ${c.name}`)}><Icon.Copy/></button>
          </div>
        ))}
        {filtered.length === 0 && <div style={{padding:32, textAlign:"center", color:"var(--ink-3)"}}>No matches</div>}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 2. MIME TYPES (searchable lookup)
// ════════════════════════════════════════════════════════════════════════════
const MIME_TYPES = [
  { ext: "html",  type: "text/html",                   cat: "Web" },
  { ext: "css",   type: "text/css",                    cat: "Web" },
  { ext: "js",    type: "application/javascript",      cat: "Web" },
  { ext: "mjs",   type: "application/javascript",      cat: "Web" },
  { ext: "json",  type: "application/json",            cat: "Data" },
  { ext: "xml",   type: "application/xml",             cat: "Data" },
  { ext: "yaml",  type: "application/yaml",            cat: "Data" },
  { ext: "yml",   type: "application/yaml",            cat: "Data" },
  { ext: "csv",   type: "text/csv",                    cat: "Data" },
  { ext: "toml",  type: "application/toml",            cat: "Data" },
  { ext: "txt",   type: "text/plain",                  cat: "Text" },
  { ext: "md",    type: "text/markdown",               cat: "Text" },
  { ext: "rtf",   type: "application/rtf",             cat: "Text" },
  { ext: "pdf",   type: "application/pdf",             cat: "Document" },
  { ext: "doc",   type: "application/msword",          cat: "Document" },
  { ext: "docx",  type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", cat: "Document" },
  { ext: "xls",   type: "application/vnd.ms-excel",    cat: "Document" },
  { ext: "xlsx",  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", cat: "Document" },
  { ext: "ppt",   type: "application/vnd.ms-powerpoint", cat: "Document" },
  { ext: "pptx",  type: "application/vnd.openxmlformats-officedocument.presentationml.presentation", cat: "Document" },
  { ext: "png",   type: "image/png",                   cat: "Image" },
  { ext: "jpg",   type: "image/jpeg",                  cat: "Image" },
  { ext: "jpeg",  type: "image/jpeg",                  cat: "Image" },
  { ext: "gif",   type: "image/gif",                   cat: "Image" },
  { ext: "webp",  type: "image/webp",                  cat: "Image" },
  { ext: "svg",   type: "image/svg+xml",               cat: "Image" },
  { ext: "ico",   type: "image/vnd.microsoft.icon",    cat: "Image" },
  { ext: "avif",  type: "image/avif",                  cat: "Image" },
  { ext: "bmp",   type: "image/bmp",                   cat: "Image" },
  { ext: "tiff",  type: "image/tiff",                  cat: "Image" },
  { ext: "mp3",   type: "audio/mpeg",                  cat: "Audio" },
  { ext: "wav",   type: "audio/wav",                   cat: "Audio" },
  { ext: "ogg",   type: "audio/ogg",                   cat: "Audio" },
  { ext: "flac",  type: "audio/flac",                  cat: "Audio" },
  { ext: "aac",   type: "audio/aac",                   cat: "Audio" },
  { ext: "m4a",   type: "audio/mp4",                   cat: "Audio" },
  { ext: "mp4",   type: "video/mp4",                   cat: "Video" },
  { ext: "webm",  type: "video/webm",                  cat: "Video" },
  { ext: "mov",   type: "video/quicktime",             cat: "Video" },
  { ext: "avi",   type: "video/x-msvideo",             cat: "Video" },
  { ext: "mkv",   type: "video/x-matroska",            cat: "Video" },
  { ext: "zip",   type: "application/zip",             cat: "Archive" },
  { ext: "tar",   type: "application/x-tar",           cat: "Archive" },
  { ext: "gz",    type: "application/gzip",            cat: "Archive" },
  { ext: "7z",    type: "application/x-7z-compressed", cat: "Archive" },
  { ext: "rar",   type: "application/vnd.rar",         cat: "Archive" },
  { ext: "ttf",   type: "font/ttf",                    cat: "Font" },
  { ext: "otf",   type: "font/otf",                    cat: "Font" },
  { ext: "woff",  type: "font/woff",                   cat: "Font" },
  { ext: "woff2", type: "font/woff2",                  cat: "Font" },
  { ext: "wasm",  type: "application/wasm",            cat: "Binary" },
  { ext: "bin",   type: "application/octet-stream",    cat: "Binary" },
];
function MimeTypesTool() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q.trim()) return MIME_TYPES;
    const n = q.toLowerCase().replace(/^\./, "");
    return MIME_TYPES.filter(m => m.ext.includes(n) || m.type.includes(n) || m.cat.toLowerCase().includes(n));
  }, [q]);
  return (
    <>
      <div style={{display:"flex", gap:10, marginBottom:14, alignItems:"center"}}>
        <div className="search-box" style={{flex:1}}>
          <Icon.Search style={{color:"var(--ink-3)"}}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by extension or MIME type (e.g. png, video, json)" spellCheck="false" style={{fontSize:14}}/>
          {q && <button onClick={()=>setQ("")} style={{color:"var(--ink-3)", display:"flex"}}><Icon.X/></button>}
        </div>
        <span className="chip accent">{filtered.length} of {MIME_TYPES.length}</span>
      </div>
      <div className="card" style={{padding:0, overflow:"hidden", maxHeight:600, overflowY:"auto"}}>
        {filtered.map((m, i) => (
          <div key={m.ext + m.type} style={{display:"flex", alignItems:"center", padding:"10px 16px", borderBottom: i < filtered.length-1 ? "1px solid var(--line)" : "none", gap:16}}>
            <span className="mono" style={{fontSize:13, fontWeight:600, color:"var(--accent-hi)", width:80}}>.{m.ext}</span>
            <span className="mono" style={{flex:1, fontSize:13, color:"var(--ink)"}}>{m.type}</span>
            <span className="chip" style={{padding:"2px 8px", fontSize:11}}>{m.cat}</span>
            <button className="btn btn-ghost btn-sm" onClick={()=>navigator.clipboard.writeText(m.type)}><Icon.Copy/></button>
          </div>
        ))}
        {filtered.length === 0 && <div style={{padding:32, textAlign:"center", color:"var(--ink-3)"}}>No matches</div>}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 3. USER-AGENT PARSER (lazy-load ua-parser-js)
// ════════════════════════════════════════════════════════════════════════════
function loadUaParser() {
  if (window.UAParser) return Promise.resolve(window.UAParser);
  if (window.__uaLoading) return window.__uaLoading;
  window.__uaLoading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/ua-parser-js@1.0.37/dist/ua-parser.min.js";
    s.onload = () => resolve(window.UAParser);
    s.onerror = () => reject(new Error("Failed to load ua-parser-js"));
    document.head.appendChild(s);
  });
  return window.__uaLoading;
}
function UserAgentTool() {
  const [input, setInput] = usePersistentState("dth_ua_in", navigator.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
  const [ready, setReady] = useState(!!window.UAParser);
  const [error, setError] = useState(null);
  useEffect(() => { if (!ready) loadUaParser().then(() => setReady(true)).catch(e => setError(e.message)); }, []);
  const result = useMemo(() => {
    if (!ready) return null;
    try { return new window.UAParser(input).getResult(); } catch (e) { return null; }
  }, [input, ready]);
  return (
    <>
      <div className="card" style={{padding:18, marginBottom:14}}>
        <div className="eyebrow" style={{marginBottom:10}}>user-agent string</div>
        <textarea value={input} onChange={e=>setInput(e.target.value)} spellCheck="false" style={{width:"100%", minHeight:80, padding:"10px 12px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", fontSize:13, resize:"vertical", outline:"none"}}/>
        <div style={{display:"flex", gap:8, marginTop:10}}>
          <button className="btn btn-ghost btn-sm" onClick={()=>setInput(navigator.userAgent)}>Use my UA</button>
        </div>
      </div>
      {error && <div className="card" style={{padding:14, color:"var(--err)"}}>{error}</div>}
      {!ready && !error && <div style={{fontSize:12, fontFamily:"var(--mono)", color:"var(--ink-3)"}}>loading ua-parser-js…</div>}
      {result && (
        <div className="card" style={{padding:0, overflow:"hidden"}}>
          {[
            ["Browser",  `${result.browser.name || "?"} ${result.browser.version || ""}`.trim()],
            ["Engine",   `${result.engine.name || "?"} ${result.engine.version || ""}`.trim()],
            ["OS",       `${result.os.name || "?"} ${result.os.version || ""}`.trim()],
            ["Device",   result.device.type ? `${result.device.vendor || ""} ${result.device.model || ""} (${result.device.type})`.trim() : "Desktop"],
            ["CPU",      result.cpu.architecture || "?"],
          ].map(([k, v], i, a) => (
            <div key={k} style={{display:"flex", alignItems:"center", padding:"12px 16px", borderBottom: i < a.length-1 ? "1px solid var(--line)" : "none", gap:16}}>
              <span className="mono" style={{fontSize:11, color:"var(--ink-3)", width:90, textTransform:"uppercase", letterSpacing:".06em"}}>{k}</span>
              <span style={{flex:1, fontSize:14, color:"var(--ink)"}}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 4. URL PARSER
// ════════════════════════════════════════════════════════════════════════════
function UrlParserTool() {
  const [input, setInput] = usePersistentState("dth_url_in", "https://user:pass@api.example.com:8443/v1/users/42?fields=name,email&active=true&tags=a&tags=b#section-2");
  const result = useMemo(() => {
    if (!input.trim()) return { ok: true, empty: true };
    try {
      const u = new URL(input);
      const params = [];
      for (const [k, v] of u.searchParams.entries()) params.push({ key: k, value: v });
      return { ok: true, url: u, params };
    } catch (e) { return { ok: false, error: e.message }; }
  }, [input]);
  return (
    <>
      <div className="card" style={{padding:18, marginBottom:14}}>
        <div className="eyebrow" style={{marginBottom:10}}>URL</div>
        <input value={input} onChange={e=>setInput(e.target.value)} spellCheck="false" style={{width:"100%", padding:"10px 14px", background:"var(--bg-1)", border:`1px solid ${result.ok ? "var(--line)" : "var(--err)"}`, borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", fontSize:14, outline:"none"}}/>
      </div>
      {result.empty ? null : !result.ok ? (
        <div className="card" style={{padding:14, color:"var(--err)"}}>{result.error}</div>
      ) : (
        <>
          <div className="card" style={{padding:0, overflow:"hidden", marginBottom:14}}>
            {[
              ["Protocol",  result.url.protocol],
              ["Username",  result.url.username || "—"],
              ["Password",  result.url.password ? "•".repeat(result.url.password.length) : "—"],
              ["Hostname",  result.url.hostname],
              ["Port",      result.url.port || "(default)"],
              ["Pathname",  result.url.pathname],
              ["Search",    result.url.search || "—"],
              ["Hash",      result.url.hash || "—"],
              ["Origin",    result.url.origin],
            ].map(([k, v], i, a) => (
              <div key={k} style={{display:"flex", alignItems:"center", padding:"10px 16px", borderBottom: i < a.length-1 ? "1px solid var(--line)" : "none", gap:16}}>
                <span className="mono" style={{fontSize:11, color:"var(--ink-3)", width:90, textTransform:"uppercase", letterSpacing:".06em"}}>{k}</span>
                <span className="mono" style={{flex:1, fontSize:13, color:"var(--ink)", wordBreak:"break-all"}}>{v}</span>
                <button className="btn btn-ghost btn-sm" onClick={()=>navigator.clipboard.writeText(String(v).startsWith("•") ? "" : v)}><Icon.Copy/></button>
              </div>
            ))}
          </div>
          {result.params.length > 0 && (
            <>
              <div className="eyebrow" style={{marginBottom:10}}>query parameters · {result.params.length}</div>
              <div className="card" style={{padding:0, overflow:"hidden"}}>
                {result.params.map((p, i) => (
                  <div key={i} style={{display:"flex", alignItems:"center", padding:"10px 16px", borderBottom: i < result.params.length-1 ? "1px solid var(--line)" : "none", gap:16}}>
                    <span className="mono" style={{fontSize:13, fontWeight:600, color:"var(--accent-hi)", width:140}}>{p.key}</span>
                    <span className="mono" style={{flex:1, fontSize:13, color:"var(--ink)", wordBreak:"break-all"}}>{p.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 5. IP ADDRESS INFO
// ════════════════════════════════════════════════════════════════════════════
function parseIpv4(s) {
  const parts = s.trim().split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map(p => +p);
  if (nums.some(n => Number.isNaN(n) || n < 0 || n > 255 || !/^\d+$/.test(String(parts[nums.indexOf(n)])))) return null;
  return nums;
}
function ipv4Class(o) {
  if (o[0] === 10) return { name: "Private (Class A — 10.0.0.0/8)", isPrivate: true };
  if (o[0] === 172 && o[1] >= 16 && o[1] <= 31) return { name: "Private (Class B — 172.16.0.0/12)", isPrivate: true };
  if (o[0] === 192 && o[1] === 168) return { name: "Private (Class C — 192.168.0.0/16)", isPrivate: true };
  if (o[0] === 127) return { name: "Loopback (127.0.0.0/8)", isPrivate: true };
  if (o[0] === 169 && o[1] === 254) return { name: "Link-Local (169.254.0.0/16)", isPrivate: true };
  if (o[0] >= 224 && o[0] <= 239) return { name: "Multicast (224.0.0.0/4)", isPrivate: false };
  if (o[0] >= 240) return { name: "Reserved (240.0.0.0/4)", isPrivate: false };
  if (o[0] === 0) return { name: "Reserved (0.0.0.0/8)", isPrivate: false };
  if (o[0] < 128) return { name: "Public (Class A range)", isPrivate: false };
  if (o[0] < 192) return { name: "Public (Class B range)", isPrivate: false };
  if (o[0] < 224) return { name: "Public (Class C range)", isPrivate: false };
  return { name: "Unknown", isPrivate: false };
}
function IpLookupTool() {
  const [input, setInput] = useState("8.8.8.8");
  const result = useMemo(() => {
    const s = input.trim();
    if (!s) return null;
    if (s.includes(":") && !s.includes(".")) {
      // IPv6
      try {
        // Validate by attempting parse
        const segments = s.split(":");
        if (segments.length < 3 || segments.length > 8) return { ok: false, error: "Invalid IPv6" };
        return { ok: true, family: "IPv6", address: s, info: "IPv6 — 128-bit address, see RFC 4291" };
      } catch { return { ok: false, error: "Invalid IPv6" }; }
    }
    const o = parseIpv4(s);
    if (!o) return { ok: false, error: "Invalid IPv4 address" };
    const intVal = (o[0] << 24 >>> 0) + (o[1] << 16) + (o[2] << 8) + o[3];
    const cls = ipv4Class(o);
    return {
      ok: true,
      family: "IPv4",
      address: o.join("."),
      decimal: intVal,
      hex: "0x" + intVal.toString(16).toUpperCase().padStart(8, "0"),
      binary: o.map(n => n.toString(2).padStart(8, "0")).join("."),
      reverseDns: o.slice().reverse().join(".") + ".in-addr.arpa",
      type: cls.name,
      isPrivate: cls.isPrivate,
    };
  }, [input]);
  return (
    <>
      <div className="card" style={{padding:18, marginBottom:14}}>
        <div className="eyebrow" style={{marginBottom:10}}>IP address (v4 or v6)</div>
        <input value={input} onChange={e=>setInput(e.target.value)} spellCheck="false" placeholder="e.g. 192.168.1.1 or 2001:4860:4860::8888" style={{width:"100%", padding:"10px 14px", background:"var(--bg-1)", border:`1px solid ${!result || result.ok ? "var(--line)" : "var(--err)"}`, borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", fontSize:18, outline:"none"}}/>
      </div>
      {!result ? null : !result.ok ? (
        <div className="card" style={{padding:14, color:"var(--err)"}}>{result.error}</div>
      ) : result.family === "IPv6" ? (
        <div className="card" style={{padding:18}}>
          <div style={{fontSize:14, color:"var(--ink-2)"}}>Detected: <span style={{color:"var(--accent-hi)"}}>{result.family}</span></div>
          <div style={{marginTop:10, fontSize:13, color:"var(--ink-2)"}}>{result.info}</div>
        </div>
      ) : (
        <div className="card" style={{padding:0, overflow:"hidden"}}>
          {[
            ["Address (dotted)",  result.address],
            ["Type",              result.type],
            ["Decimal",           String(result.decimal)],
            ["Hexadecimal",       result.hex],
            ["Binary",            result.binary],
            ["Reverse DNS (PTR)", result.reverseDns],
          ].map(([k, v], i, a) => (
            <div key={k} style={{display:"flex", alignItems:"center", padding:"10px 16px", borderBottom: i < a.length-1 ? "1px solid var(--line)" : "none", gap:16}}>
              <span className="mono" style={{fontSize:11, color:"var(--ink-3)", width:160, textTransform:"uppercase", letterSpacing:".06em"}}>{k}</span>
              <span className="mono" style={{flex:1, fontSize:13, color:"var(--ink)", wordBreak:"break-all"}}>{v}</span>
              <button className="btn btn-ghost btn-sm" onClick={()=>navigator.clipboard.writeText(String(v))}><Icon.Copy/></button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 6. DNS LOOKUP (via Cloudflare DoH — uses network)
// ════════════════════════════════════════════════════════════════════════════
function DnsLookupTool() {
  const [host, setHost] = useState("example.com");
  const [type, setType] = useState("A");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const lookup = async () => {
    setBusy(true); setError(null); setResult(null);
    try {
      const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`, { headers: { Accept: "application/dns-json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult(await res.json());
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  return (
    <>
      <NetNotice text="DNS resolution can't run in the browser — this tool queries Cloudflare's public DNS-over-HTTPS resolver (1.1.1.1). Your hostname is sent to Cloudflare."/>
      <div style={{display:"flex", gap:10, marginBottom:14, flexWrap:"wrap"}}>
        <input value={host} onChange={e=>setHost(e.target.value)} spellCheck="false" placeholder="hostname (e.g. example.com)" style={{flex:1, minWidth:240, padding:"10px 14px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", fontSize:14, outline:"none"}}/>
        <select value={type} onChange={e=>setType(e.target.value)} style={{padding:"10px 14px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", fontSize:13, cursor:"pointer", outline:"none"}}>
          {["A","AAAA","CNAME","MX","TXT","NS","SOA","SRV","CAA","PTR"].map(t => <option key={t} value={t} style={{background:"var(--bg-2)"}}>{t}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={lookup} disabled={busy || !host}>{busy ? "looking up…" : "Look up"}</button>
      </div>
      {error && <div className="card" style={{padding:14, color:"var(--err)"}}>{error}</div>}
      {result && (
        <div className="card" style={{padding:0, overflow:"hidden"}}>
          {!result.Answer || result.Answer.length === 0 ? (
            <div style={{padding:20, color:"var(--ink-3)", textAlign:"center"}}>No records found{result.Status !== 0 ? ` (status ${result.Status})` : ""}.</div>
          ) : result.Answer.map((a, i) => (
            <div key={i} style={{display:"flex", alignItems:"center", padding:"12px 16px", borderBottom: i < result.Answer.length-1 ? "1px solid var(--line)" : "none", gap:16, fontFamily:"var(--mono)", fontSize:13}}>
              <span style={{width:50, color:"var(--accent-hi)", fontWeight:600}}>{type}</span>
              <span style={{flex:1, color:"var(--ink)", wordBreak:"break-all"}}>{a.data}</span>
              <span style={{color:"var(--ink-3)"}}>TTL {a.TTL}s</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 7. CORS TESTER
// ════════════════════════════════════════════════════════════════════════════
function CorsTesterTool() {
  const [url, setUrl] = useState("https://api.github.com/zen");
  const [method, setMethod] = useState("GET");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const test = async () => {
    setBusy(true); setResult(null);
    const start = performance.now();
    try {
      const res = await fetch(url, { method, mode: "cors" });
      const elapsed = (performance.now() - start).toFixed(0);
      const headers = {};
      for (const [k, v] of res.headers.entries()) headers[k] = v;
      let body = "";
      try { body = (await res.text()).slice(0, 500); } catch {}
      setResult({ ok: true, status: res.status, statusText: res.statusText, headers, body, elapsed, type: res.type });
    } catch (e) {
      setResult({ ok: false, error: e.message, elapsed: (performance.now() - start).toFixed(0) });
    } finally { setBusy(false); }
  };
  const corsHeaderKeys = result?.headers ? Object.keys(result.headers).filter(k => k.toLowerCase().startsWith("access-control")) : [];
  return (
    <>
      <NetNotice text="This tool sends a real HTTP request from your browser. Only headers exposed by CORS are visible to JavaScript."/>
      <div style={{display:"flex", gap:10, marginBottom:14, flexWrap:"wrap"}}>
        <select value={method} onChange={e=>setMethod(e.target.value)} style={{padding:"10px 14px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", fontSize:13, cursor:"pointer", outline:"none"}}>
          {["GET","POST","PUT","PATCH","DELETE","OPTIONS"].map(m => <option key={m} value={m} style={{background:"var(--bg-2)"}}>{m}</option>)}
        </select>
        <input value={url} onChange={e=>setUrl(e.target.value)} spellCheck="false" placeholder="https://api.example.com/endpoint" style={{flex:1, minWidth:240, padding:"10px 14px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", fontSize:14, outline:"none"}}/>
        <button className="btn btn-primary btn-sm" onClick={test} disabled={busy || !url}>{busy ? "testing…" : "Send"}</button>
      </div>
      {result && (
        <>
          <div className="card" style={{padding:"12px 16px", marginBottom:14, display:"flex", alignItems:"center", gap:14, borderColor: result.ok ? "rgba(52,211,153,.3)" : "rgba(248,113,113,.3)", background: result.ok ? "rgba(52,211,153,.06)" : "rgba(248,113,113,.06)"}}>
            <span style={{width:9, height:9, borderRadius:"50%", background: result.ok ? "var(--ok)" : "var(--err)"}}/>
            {result.ok ? (
              <span style={{flex:1, fontFamily:"var(--mono)", fontSize:14, color:"var(--ink)"}}><span style={{color:"var(--ok)", fontWeight:600}}>{result.status} {result.statusText}</span> · {result.elapsed}ms · type={result.type}</span>
            ) : (
              <span style={{flex:1, fontFamily:"var(--mono)", fontSize:14, color:"var(--err)"}}>CORS / network error: {result.error} ({result.elapsed}ms)</span>
            )}
          </div>
          {result.ok && (
            <>
              <div className="eyebrow" style={{marginBottom:10}}>Access-Control-* headers · {corsHeaderKeys.length}</div>
              <div className="card" style={{padding:0, marginBottom:14}}>
                {corsHeaderKeys.length === 0 ? (
                  <div style={{padding:14, color:"var(--ink-3)", fontSize:13}}>No CORS headers in response — the server may not allow cross-origin requests, or this is a same-origin request.</div>
                ) : corsHeaderKeys.map((k, i) => (
                  <div key={k} style={{display:"flex", padding:"8px 14px", borderBottom: i < corsHeaderKeys.length-1 ? "1px solid var(--line)" : "none", gap:14, fontFamily:"var(--mono)", fontSize:12.5}}>
                    <span style={{width:280, color:"var(--accent-hi)"}}>{k}</span>
                    <span style={{flex:1, color:"var(--ink)", wordBreak:"break-all"}}>{result.headers[k]}</span>
                  </div>
                ))}
              </div>
              <div className="eyebrow" style={{marginBottom:10}}>all visible response headers · {Object.keys(result.headers).length}</div>
              <div className="card" style={{padding:0}}>
                {Object.entries(result.headers).map(([k, v], i, a) => (
                  <div key={k} style={{display:"flex", padding:"6px 14px", borderBottom: i < a.length-1 ? "1px solid var(--line)" : "none", gap:14, fontFamily:"var(--mono)", fontSize:12}}>
                    <span style={{width:240, color:"var(--ink-2)"}}>{k}</span>
                    <span style={{flex:1, color:"var(--ink)", wordBreak:"break-all"}}>{v}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 8. HEADERS ANALYZER (security headers)
// ════════════════════════════════════════════════════════════════════════════
const SECURITY_HEADERS = [
  { key: "strict-transport-security", name: "Strict-Transport-Security (HSTS)", desc: "Forces HTTPS for the domain. Recommended: max-age=31536000; includeSubDomains" },
  { key: "content-security-policy",   name: "Content-Security-Policy (CSP)",   desc: "Restricts which sources can load. Critical for XSS prevention." },
  { key: "x-content-type-options",    name: "X-Content-Type-Options",          desc: "Should be 'nosniff' to prevent MIME confusion attacks." },
  { key: "x-frame-options",           name: "X-Frame-Options",                 desc: "Anti-clickjacking. Use 'DENY' or 'SAMEORIGIN'. Largely superseded by CSP frame-ancestors." },
  { key: "referrer-policy",           name: "Referrer-Policy",                 desc: "Controls Referer header on outbound requests. 'strict-origin-when-cross-origin' is a safe default." },
  { key: "permissions-policy",        name: "Permissions-Policy",              desc: "Controls browser features (camera, geolocation, etc.). Replaces Feature-Policy." },
  { key: "cross-origin-opener-policy", name: "Cross-Origin-Opener-Policy",     desc: "Isolates browsing contexts. 'same-origin' enables certain advanced features." },
  { key: "cross-origin-embedder-policy", name: "Cross-Origin-Embedder-Policy", desc: "Required with COOP for SharedArrayBuffer support." },
  { key: "cross-origin-resource-policy", name: "Cross-Origin-Resource-Policy", desc: "Restricts which origins can load this resource." },
];
function HeadersAnalyzerTool() {
  const [url, setUrl] = useState("https://example.com");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const analyze = async () => {
    setBusy(true); setResult(null);
    try {
      const res = await fetch(url, { method: "GET", mode: "cors" });
      const headers = {};
      for (const [k, v] of res.headers.entries()) headers[k.toLowerCase()] = v;
      setResult({ ok: true, status: res.status, headers });
    } catch (e) { setResult({ ok: false, error: e.message }); }
    finally { setBusy(false); }
  };
  const score = result?.ok ? SECURITY_HEADERS.filter(h => result.headers[h.key]).length : 0;
  const grade = result?.ok ? (score >= 7 ? "A" : score >= 5 ? "B" : score >= 3 ? "C" : score >= 1 ? "D" : "F") : null;
  return (
    <>
      <NetNotice text="Fetches the given URL and inspects the response. Many sites block cross-origin requests — works best on your own URLs or sites with permissive CORS."/>
      <div style={{display:"flex", gap:10, marginBottom:14}}>
        <input value={url} onChange={e=>setUrl(e.target.value)} spellCheck="false" placeholder="https://example.com" style={{flex:1, padding:"10px 14px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", fontSize:14, outline:"none"}}/>
        <button className="btn btn-primary btn-sm" onClick={analyze} disabled={busy || !url}>{busy ? "analyzing…" : "Analyze"}</button>
      </div>
      {result && !result.ok && <div className="card" style={{padding:14, color:"var(--err)"}}>Network/CORS error: {result.error}</div>}
      {result && result.ok && (
        <>
          <div className="card" style={{padding:"16px 20px", marginBottom:14, display:"flex", alignItems:"center", gap:20}}>
            <div style={{fontSize:48, fontWeight:800, color: grade === "A" ? "var(--ok)" : grade === "F" ? "var(--err)" : "var(--accent-hi)", lineHeight:1, fontFamily:"var(--mono)"}}>{grade}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:14, fontWeight:600, color:"var(--ink)"}}>{score} of {SECURITY_HEADERS.length} security headers present</div>
              <div style={{fontSize:13, color:"var(--ink-2)", marginTop:2}}>HTTP {result.status} · {Object.keys(result.headers).length} total headers visible to JS</div>
            </div>
          </div>
          <div className="card" style={{padding:0, overflow:"hidden"}}>
            {SECURITY_HEADERS.map((h, i) => {
              const v = result.headers[h.key];
              return (
                <div key={h.key} style={{padding:"14px 16px", borderBottom: i < SECURITY_HEADERS.length-1 ? "1px solid var(--line)" : "none", display:"flex", alignItems:"flex-start", gap:14}}>
                  <span style={{width:24, color: v ? "var(--ok)" : "var(--err)", fontWeight:700, fontSize:18, lineHeight:1.2}}>{v ? "✓" : "✗"}</span>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:13.5, fontWeight:600, color: v ? "var(--ink)" : "var(--ink-2)", marginBottom:3}}>{h.name}</div>
                    <div style={{fontSize:12.5, color:"var(--ink-3)", marginBottom:6, lineHeight:1.5}}>{h.desc}</div>
                    {v && <div className="mono" style={{fontSize:12, color:"var(--accent-hi)", wordBreak:"break-all", padding:"6px 10px", background:"var(--bg-1)", borderRadius:"var(--r)"}}>{v}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 9. ROBOTS.TXT TESTER
// ════════════════════════════════════════════════════════════════════════════
function parseRobots(src) {
  const groups = []; let current = null;
  const sitemaps = [];
  for (let raw of src.split("\n")) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const val = line.slice(idx + 1).trim();
    if (key === "user-agent") {
      if (!current || current.rules.length > 0) { current = { agents: [val], rules: [] }; groups.push(current); }
      else current.agents.push(val);
    } else if (key === "allow" || key === "disallow") {
      if (current) current.rules.push({ kind: key, path: val });
    } else if (key === "sitemap") {
      sitemaps.push(val);
    } else if (current) {
      current.rules.push({ kind: key, path: val });
    }
  }
  return { groups, sitemaps };
}
function matchRobots(parsed, agent, path) {
  // find best matching group (specific agent > *)
  let group = parsed.groups.find(g => g.agents.some(a => a.toLowerCase() === agent.toLowerCase()));
  if (!group) group = parsed.groups.find(g => g.agents.includes("*"));
  if (!group) return { allowed: true, reason: "no rules" };
  // longest matching rule wins
  let best = null;
  for (const r of group.rules) {
    if (r.kind !== "allow" && r.kind !== "disallow") continue;
    if (!r.path) { if (r.kind === "disallow") continue; }
    if (r.path && path.startsWith(r.path.replace(/\*/g, ""))) {
      if (!best || r.path.length > best.path.length) best = r;
    }
  }
  if (!best) return { allowed: true, reason: "no matching rule" };
  return { allowed: best.kind === "allow", reason: `${best.kind}: ${best.path}` };
}
function RobotsTesterTool() {
  const [input, setInput] = usePersistentState("dth_robots_in", `# Example robots.txt
User-agent: *
Disallow: /admin
Disallow: /private
Allow: /private/public

User-agent: Googlebot
Disallow: /no-google

User-agent: Bingbot
Crawl-delay: 10

Sitemap: https://example.com/sitemap.xml
`);
  const [agent, setAgent] = useState("*");
  const [path, setPath] = useState("/admin/dashboard");
  const parsed = useMemo(() => parseRobots(input), [input]);
  const match = useMemo(() => matchRobots(parsed, agent, path), [parsed, agent, path]);
  return (
    <>
      <div className="io-panel" style={{marginBottom:14}}>
        <div className="io-pane">
          <div className="io-pane-header"><span>robots.txt</span><span style={{color:"var(--ink-3)"}}>{input.length}b</span></div>
          <div className="io-pane-body"><textarea value={input} onChange={e=>setInput(e.target.value)} spellCheck="false"/></div>
        </div>
        <div className="io-pane">
          <div className="io-pane-header"><span>parsed groups</span><span style={{color:"var(--ok)"}}>{parsed.groups.length} group{parsed.groups.length !== 1 ? "s" : ""}</span></div>
          <div className="io-pane-body" style={{padding:"14px 18px"}}>
            {parsed.groups.map((g, i) => (
              <div key={i} style={{marginBottom:14, fontFamily:"var(--mono)", fontSize:12.5}}>
                <div style={{color:"var(--accent-hi)", marginBottom:4}}>User-agent: {g.agents.join(", ")}</div>
                {g.rules.map((r, j) => (
                  <div key={j} style={{color: r.kind === "allow" ? "var(--ok)" : r.kind === "disallow" ? "var(--err)" : "var(--ink-2)", paddingLeft:12}}>{r.kind}: {r.path}</div>
                ))}
              </div>
            ))}
            {parsed.sitemaps.length > 0 && (
              <div style={{fontFamily:"var(--mono)", fontSize:12.5, color:"var(--ink-2)", marginTop:14}}>
                <div style={{color:"var(--ink-3)", marginBottom:4}}>Sitemaps:</div>
                {parsed.sitemaps.map((s, i) => <div key={i}>{s}</div>)}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="card" style={{padding:18}}>
        <div className="eyebrow" style={{marginBottom:10}}>test a path against the rules</div>
        <div style={{display:"flex", gap:10, marginBottom:12}}>
          <input value={agent} onChange={e=>setAgent(e.target.value)} placeholder="user-agent" style={{flex:1, padding:"8px 12px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", fontSize:13, outline:"none"}}/>
          <input value={path} onChange={e=>setPath(e.target.value)} placeholder="/path/to/test" style={{flex:2, padding:"8px 12px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", fontSize:13, outline:"none"}}/>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:"var(--r)", background: match.allowed ? "rgba(52,211,153,.06)" : "rgba(248,113,113,.06)", border: `1px solid ${match.allowed ? "rgba(52,211,153,.3)" : "rgba(248,113,113,.3)"}`}}>
          <span style={{width:9, height:9, borderRadius:"50%", background: match.allowed ? "var(--ok)" : "var(--err)"}}/>
          <span style={{fontSize:14, fontWeight:600, color: match.allowed ? "var(--ok)" : "var(--err)"}}>{match.allowed ? "✓ allowed" : "✗ disallowed"}</span>
          <span style={{fontFamily:"var(--mono)", fontSize:12, color:"var(--ink-3)"}}>{match.reason}</span>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 10. .HTACCESS TESTER
// ════════════════════════════════════════════════════════════════════════════
function parseHtaccess(src) {
  const directives = [];
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].replace(/#.*$/, "").trim();
    if (!line) continue;
    // Continuation
    while (line.endsWith("\\") && i + 1 < lines.length) { i++; line = line.slice(0, -1) + " " + lines[i].trim(); }
    const parts = line.split(/\s+/);
    const name = parts[0];
    if (!name) continue;
    directives.push({ name, args: parts.slice(1), line: i + 1, raw: line });
  }
  return directives;
}
function describeHtaccess(d) {
  const n = d.name.toLowerCase();
  if (n === "rewriteengine") return d.args[0]?.toLowerCase() === "on" ? "✓ Rewrite engine enabled" : "✗ Rewrite engine disabled";
  if (n === "rewritebase") return `Sets URL prefix to: ${d.args[0]}`;
  if (n === "rewritecond") return `Condition — only apply next rule if: ${d.args.join(" ")}`;
  if (n === "rewriterule") {
    const flags = d.args[2] ? d.args[2].replace(/[\[\]]/g, "") : "";
    const flagDesc = flags.match(/R=?(\d+)?/) ? ` (HTTP ${flags.match(/R=(\d+)/)?.[1] || "302"} redirect)` : flags.includes("L") ? " (last rule)" : "";
    return `Rewrite ${d.args[0]} → ${d.args[1]}${flagDesc}`;
  }
  if (n === "redirect") return `${d.args[0]} → ${d.args[1]}`;
  if (n === "redirectmatch") return `Pattern ${d.args[0]} → ${d.args[1]}`;
  if (n === "errordocument") return `Error ${d.args[0]} → ${d.args.slice(1).join(" ")}`;
  if (n === "options") return `Server options: ${d.args.join(" ")}`;
  if (n === "deny" || n === "allow") return `${d.name} access from ${d.args.join(" ")}`;
  if (n === "require") return `Require: ${d.args.join(" ")}`;
  if (n === "header") return `${d.args[0]} header ${d.args[1]}: ${d.args.slice(2).join(" ")}`;
  if (n === "addtype") return `Map .${d.args[1]?.replace(/^\./, "")} → ${d.args[0]}`;
  return `Directive: ${d.name}`;
}
function HtaccessTesterTool() {
  const [input, setInput] = usePersistentState("dth_htaccess_in", `# Sample .htaccess
RewriteEngine On
RewriteBase /

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]

# Remove trailing slash
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.+)/$ /$1 [R=301,L]

# Pretty URLs
RewriteRule ^blog/([0-9]+)/?$ /blog.php?id=$1 [L]

# Custom error pages
ErrorDocument 404 /404.html
ErrorDocument 500 /500.html

# Cache static assets
<FilesMatch "\\.(jpg|jpeg|png|webp|css|js)$">
  Header set Cache-Control "max-age=31536000, public"
</FilesMatch>

# Block .git
RedirectMatch 404 /\\.git
`);
  const directives = useMemo(() => parseHtaccess(input), [input]);
  return (
    <>
      <div className="io-pane" style={{border:"1px solid var(--line)", borderRadius:"var(--r-lg)", background:"var(--bg-1)", marginBottom:14, minHeight:220}}>
        <div className="io-pane-header"><span>input · .htaccess</span><span style={{color:"var(--ink-3)"}}>{directives.length} directive{directives.length !== 1 ? "s" : ""}</span></div>
        <div className="io-pane-body"><textarea value={input} onChange={e=>setInput(e.target.value)} spellCheck="false"/></div>
      </div>
      <div className="card" style={{padding:0, overflow:"hidden"}}>
        {directives.map((d, i) => (
          <div key={i} style={{display:"flex", alignItems:"flex-start", padding:"10px 16px", borderBottom: i < directives.length-1 ? "1px solid var(--line)" : "none", gap:14, fontFamily:"var(--mono)", fontSize:13}}>
            <span style={{width:40, color:"var(--ink-3)", fontSize:11, paddingTop:2}}>L{d.line}</span>
            <span style={{width:140, color:"var(--accent-hi)", fontWeight:600}}>{d.name}</span>
            <span style={{flex:1, color:"var(--ink-2)", fontSize:12.5, lineHeight:1.5}}>{describeHtaccess(d)}</span>
          </div>
        ))}
        {directives.length === 0 && <div style={{padding:24, textAlign:"center", color:"var(--ink-3)"}}>No directives parsed</div>}
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Register web tools
// ────────────────────────────────────────────────────────────────────────────
window.LIVE_TOOLS = window.LIVE_TOOLS || {};
Object.assign(window.LIVE_TOOLS, {
  "http-status":       { render: () => <HttpStatusTool/> },
  "mime-types":        { render: () => <MimeTypesTool/> },
  "user-agent-parser": { render: () => <UserAgentTool/> },
  "url-parser":        { render: () => <UrlParserTool/> },
  "ip-lookup":         { render: () => <IpLookupTool/> },
  "dns-lookup":        { render: () => <DnsLookupTool/> },
  "cors-tester":       { render: () => <CorsTesterTool/> },
  "headers-analyzer":  { render: () => <HeadersAnalyzerTool/> },
  "robots-tester":     { render: () => <RobotsTesterTool/> },
  "htaccess-tester":   { render: () => <HtaccessTesterTool/> },
});
