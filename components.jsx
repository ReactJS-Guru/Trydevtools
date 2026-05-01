// TryDevTools — shared components v2
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  Search:   (p) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  Sun:      (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>,
  Moon:     (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>,
  Arrow:    (p) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M7 17 17 7M7 7h10v10"/></svg>,
  Copy:     (p) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Download: (p) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>,
  Trash:    (p) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>,
  Check:    (p) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 6 9 17l-5-5"/></svg>,
  Chevron:  (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m9 18 6-6-6-6"/></svg>,
  X:        (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>,
  Zap:      (p) => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  Sparkles: (p) => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z"/><path d="M5 3l.9 2.6L8.5 6.5 5.9 7.4 5 10l-.9-2.6L1.5 6.5l2.6-.9L5 3z" opacity=".6"/></svg>,
  Grid:     (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  List:     (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>,
  Star:     (p) => <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  Globe:    (p) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
};

// ── Theme / Accent / Density hooks ──────────────────────────────────────────
function useTheme() {
  const [t, setT] = useState(() => localStorage.getItem("dth_theme") || "dark");
  useEffect(() => { document.documentElement.dataset.theme = t; localStorage.setItem("dth_theme", t); }, [t]);
  return [t, setT];
}

const ACCENTS = {
  indigo: { accent: "#6366f1", hi: "#818cf8", soft: "rgba(99,102,241,0.12)", label: "Indigo" },
  violet: { accent: "#7c3aed", hi: "#a78bfa", soft: "rgba(124,58,237,0.12)", label: "Violet" },
  rose:   { accent: "#e11d48", hi: "#fb7185", soft: "rgba(225,29,72,0.1)",   label: "Rose" },
  cyan:   { accent: "#0891b2", hi: "#22d3ee", soft: "rgba(8,145,178,0.1)",   label: "Cyan" },
  emerald:{ accent: "#059669", hi: "#34d399", soft: "rgba(5,150,105,0.1)",   label: "Emerald" },
};
function useAccent() {
  const [n, setN] = useState(() => localStorage.getItem("dth_accent") || "indigo");
  useEffect(() => {
    const a = ACCENTS[n] || ACCENTS.indigo;
    const r = document.documentElement.style;
    r.setProperty("--accent", a.accent);
    r.setProperty("--accent-hi", a.hi);
    r.setProperty("--accent-soft", a.soft);
    r.setProperty("--accent-glow", a.soft.replace("0.12","0.25").replace("0.1","0.2"));
    localStorage.setItem("dth_accent", n);
  }, [n]);
  return [n, setN];
}

function useDensity() {
  const [d, setD] = useState(() => localStorage.getItem("dth_density") || "comfortable");
  useEffect(() => { document.documentElement.dataset.density = d; localStorage.setItem("dth_density", d); }, [d]);
  return [d, setD];
}

// ── Path helpers ─────────────────────────────────────────────────────────────
const PFX = window.__PATH_PREFIX__ || "";
function toolUrl(t) {
  return `${PFX}tool.html?t=${t.slug}`;
}
function catUrl(c) { return `${PFX}category.html?c=${c.slug}`; }
function homeUrl() { return `${PFX}index.html`; }

// ── Logo ─────────────────────────────────────────────────────────────────────
function Logo({ href }) {
  return (
    <a className="logo" href={href || homeUrl()}>
      <div className="logo-mark">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M3 5l5 4-5 4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 13h5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="logo-text">
        <span className="brand">TryDevTools</span>
        <span className="tagline">developer utilities</span>
      </div>
    </a>
  );
}

// ── Header ───────────────────────────────────────────────────────────────────
function Header({ active, onOpenCmdK }) {
  const [theme, setTheme] = useTheme();
  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Logo/>
        <nav className="header-nav">
          <a href={homeUrl()} className={active === "home" ? "active" : ""}>Tools</a>
          <a href={`${PFX}category.html?c=json`} className={active === "categories" ? "active" : ""}>Categories</a>
          <a href="#">Changelog</a>
          <a href="#">API</a>
        </nav>
        <div className="header-search" onClick={onOpenCmdK}>
          <div className="search-trigger">
            <Icon.Search/>
            <span className="label">Search {window.TOOLS.length} tools…</span>
            <span className="kbd">⌘K</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
            {theme === "dark" ? <Icon.Sun/> : <Icon.Moon/>}
          </button>
          <a className="btn btn-primary btn-sm" href="#" style={{fontSize:13}}>Sign in</a>
        </div>
      </div>
    </header>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const cats = window.CATEGORIES.slice(0, 4);
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Logo/>
            <p style={{fontSize:13.5, color:"var(--ink-2)", maxWidth:"30ch", marginTop:16, lineHeight:1.65}}>
              150+ privacy-first developer utilities. Everything runs in your browser — no accounts, no uploads, no tracking.
            </p>
            <div style={{display:"flex", gap:8, marginTop:20, flexWrap:"wrap"}}>
              <a href="#" className="chip">changelog</a>
              <a href="#" className="chip">privacy policy</a>
              <a href="#" className="chip">contact</a>
            </div>
          </div>
          {cats.map(c => (
            <div className="footer-col" key={c.slug}>
              <h5>{c.name}</h5>
              <ul>
                {window.TOOLS.filter(t => t.category === c.slug).slice(0, 5).map(t => (
                  <li key={t.slug}><a href={toolUrl(t)}>{t.name}</a></li>
                ))}
                <li><a href={catUrl(c)} style={{color:"var(--accent-hi)"}}>All {c.name} →</a></li>
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© 2026 TryDevTools. All rights reserved.</span>
          <span>v5.0 · runs in your browser</span>
        </div>
      </div>
    </footer>
  );
}

// ── Cards ────────────────────────────────────────────────────────────────────
function ToolCard({ tool, showCategory = false }) {
  const cat = window.CATEGORIES.find(c => c.slug === tool.category);
  const isLive = !!window.LIVE_TOOLS?.[tool.slug];
  return (
    <a href={toolUrl(tool)} className="card card-hoverable tool-card">
      {showCategory && <span className="tool-card-cat">{cat?.name}</span>}
      <div className="tool-card-name">{tool.name}</div>
      <div className="tool-card-desc">{tool.desc}</div>
      <div className="tool-card-footer">
        {isLive && <><span className="tool-live-dot"/><span style={{fontSize:11, fontFamily:"var(--mono)", color:"var(--ok)"}}>live</span></>}
        {tool.popular && <span style={{fontSize:11, fontFamily:"var(--mono)", color:"var(--accent-hi)", display:"flex", alignItems:"center", gap:3}}><Icon.Star/> popular</span>}
        <span className="tool-card-arrow">open <Icon.Arrow/></span>
      </div>
    </a>
  );
}

function CategoryCard({ cat }) {
  const count = window.TOOLS.filter(t => t.category === cat.slug).length;
  return (
    <a href={catUrl(cat)} className="card card-hoverable cat-card">
      <div className="cat-stripe" style={{background: cat.color}}/>
      <div className="cat-glyph">{cat.glyph}</div>
      <div className="cat-name">{cat.name}</div>
      <div className="cat-desc">{cat.description}</div>
      <div className="cat-meta">{count} tools</div>
    </a>
  );
}

// ── Command Palette ──────────────────────────────────────────────────────────
function CommandPalette({ open, onClose }) {
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(0);
  const inputRef = useRef(null);

  const results = useMemo(() => {
    const needle = q.toLowerCase().trim();
    if (!needle) return window.TOOLS.filter(t => t.popular).slice(0, 10);
    return window.TOOLS.filter(t =>
      (t.name + " " + t.slug + " " + t.desc + " " + t.category).toLowerCase().includes(needle)
    ).slice(0, 12);
  }, [q]);

  useEffect(() => {
    if (open) { setQ(""); setFocus(0); setTimeout(() => inputRef.current?.focus(), 10); }
  }, [open]);
  useEffect(() => { setFocus(0); }, [q]);

  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowDown") { e.preventDefault(); setFocus(f => Math.min(f+1, results.length-1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setFocus(f => Math.max(f-1, 0)); }
      else if (e.key === "Enter") { const t = results[focus]; if (t) window.location.href = toolUrl(t); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, results, focus, onClose]);

  if (!open) return null;
  return (
    <div className="cmdk-overlay" onClick={onClose}>
      <div className="cmdk" onClick={e => e.stopPropagation()}>
        <div className="cmdk-input">
          <Icon.Search style={{color:"var(--ink-3)", flexShrink:0}}/>
          <input ref={inputRef} placeholder="Search tools, categories…" value={q} onChange={e => setQ(e.target.value)}/>
          {q && <button className="icon-btn" style={{width:28, height:28, flexShrink:0}} onClick={() => setQ("")}><Icon.X/></button>}
          <span className="kbd">ESC</span>
        </div>
        <div className="cmdk-list">
          <div className="cmdk-section">{q ? `${results.length} result${results.length !== 1 ? "s" : ""}` : "Popular"}</div>
          {results.length === 0 && (
            <div style={{padding:"28px 16px", color:"var(--ink-3)", fontSize:13, textAlign:"center"}}>
              Nothing found for "<span style={{color:"var(--ink)"}}>{q}</span>"
            </div>
          )}
          {results.map((t, i) => {
            const cat = window.CATEGORIES.find(c => c.slug === t.category);
            const isLive = !!window.LIVE_TOOLS?.[t.slug];
            return (
              <div key={t.slug}
                className={`cmdk-item ${i === focus ? "focused" : ""}`}
                onMouseEnter={() => setFocus(i)}
                onClick={() => window.location.href = toolUrl(t)}>
                <span className="cmdk-slug">/{cat?.slug}</span>
                <span className="cmdk-name">{t.name}</span>
                {isLive && <span style={{width:6, height:6, background:"var(--ok)", borderRadius:"50%", flexShrink:0}}/>}
                <span className="cmdk-desc">{t.desc}</span>
              </div>
            );
          })}
        </div>
        <div className="cmdk-footer">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
          <span style={{marginLeft:"auto"}}>{window.TOOLS.length} tools</span>
        </div>
      </div>
    </div>
  );
}

// ── Tweaks Panel ─────────────────────────────────────────────────────────────
function TweaksPanel({ visible, onClose }) {
  const [theme, setTheme] = useTheme();
  const [accent, setAccent] = useAccent();
  const [density, setDensity] = useDensity();
  if (!visible) return null;
  return (
    <div className="tweaks-panel">
      <h5>
        <span>Tweaks</span>
        <button onClick={onClose} style={{cursor:"pointer", color:"var(--ink-3)"}}><Icon.X/></button>
      </h5>
      <div className="tweak-row">
        <span className="tweak-label">Theme</span>
        <div className="segmented">
          <button className={theme==="dark"?"active":""} onClick={()=>setTheme("dark")}>Dark</button>
          <button className={theme==="light"?"active":""} onClick={()=>setTheme("light")}>Light</button>
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-label">Accent</span>
        <div className="swatches">
          {Object.entries(ACCENTS).map(([k,v]) => (
            <div key={k} className={`swatch ${accent===k?"active":""}`}
              style={{background: v.accent}} title={v.label}
              onClick={()=>setAccent(k)}/>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <span className="tweak-label">Density</span>
        <div className="segmented">
          <button className={density==="comfortable"?"active":""} onClick={()=>setDensity("comfortable")}>Normal</button>
          <button className={density==="compact"?"active":""} onClick={()=>setDensity("compact")}>Compact</button>
        </div>
      </div>
      <p style={{fontSize:11, color:"var(--ink-3)", fontFamily:"var(--mono)", marginTop:4}}>persisted to localStorage</p>
    </div>
  );
}

// ── App Shell ─────────────────────────────────────────────────────────────────
function AppShell({ active, children }) {
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [tweaksOpen, setTweaksOpen] = useState(false);

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmdkOpen(v => !v); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    const handleMsg = (e) => {
      if (e.data?.type === "__activate_edit_mode") setTweaksOpen(true);
      if (e.data?.type === "__deactivate_edit_mode") setTweaksOpen(false);
    };
    window.addEventListener("message", handleMsg);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", handleMsg);
  }, []);

  return (
    <>
      <Header active={active} onOpenCmdK={() => setCmdkOpen(true)}/>
      {children}
      <Footer/>
      <CommandPalette open={cmdkOpen} onClose={() => setCmdkOpen(false)}/>
      <TweaksPanel visible={tweaksOpen} onClose={() => { setTweaksOpen(false); window.parent.postMessage({type:"__edit_mode_dismissed"},"*"); }}/>
    </>
  );
}

// Expose globals
Object.assign(window, {
  Icon, Logo, Header, Footer, ToolCard, CategoryCard,
  CommandPalette, TweaksPanel, AppShell,
  toolUrl, catUrl, homeUrl,
  useTheme, useAccent, useDensity, ACCENTS,
});
