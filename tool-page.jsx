// Tool Page — full-width layout, no sidebar, more tools below
const { useState, useEffect, useMemo, useRef, useCallback } = React;

function FaqItem({ q, a, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{borderBottom:"1px solid var(--line)", padding:"18px 0"}}>
      <div onClick={() => setOpen(o => !o)}
        style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,cursor:"pointer",userSelect:"none"}}>
        <span style={{fontSize:15,fontWeight:600,color:"var(--ink)",lineHeight:1.4}}>{q}</span>
        <span style={{color:"var(--ink-3)",transition:"transform 160ms",transform:open?"rotate(90deg)":"none",flexShrink:0}}>
          <Icon.Chevron/>
        </span>
      </div>
      {open && <div style={{marginTop:10,fontSize:14,color:"var(--ink-2)",lineHeight:1.65}}>{a}</div>}
    </div>
  );
}

// Focus Mode button
function FocusBtn({ focus, onToggle }) {
  return (
    <button onClick={onToggle}
      title={focus ? "Exit focus mode (F)" : "Focus mode — hide details (F)"}
      style={{
        display:"inline-flex", alignItems:"center", gap:7,
        padding:"7px 13px", borderRadius:"var(--r)",
        fontSize:12.5, fontWeight:600, fontFamily:"var(--mono)",
        border:`1px solid ${focus ? "var(--accent)" : "var(--line-strong)"}`,
        background: focus ? "var(--accent-soft)" : "var(--bg-2)",
        color: focus ? "var(--accent-hi)" : "var(--ink-2)",
        cursor:"pointer", transition:"all 140ms", flexShrink:0,
      }}>
      {focus ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 0 2-2h3M3 16h3a2 2 0 0 0 2 2v3"/>
          </svg>
          Exit focus
        </>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
          </svg>
          Focus mode
        </>
      )}
      <span style={{fontSize:10,padding:"1px 5px",borderRadius:4,background:"var(--bg-3)",color:"var(--ink-3)",fontFamily:"var(--mono)",border:"1px solid var(--line)"}}>F</span>
    </button>
  );
}

// ── Tool Page ────────────────────────────────────────────────────────────────
function ToolPage({ slug }) {
  const tool = window.TOOLS.find(t => t.slug === slug) || window.TOOLS[0];
  const cat = window.CATEGORIES.find(c => c.slug === tool.category);
  const allCatTools = window.TOOLS.filter(t => t.category === cat.slug && t.slug !== tool.slug);
  const live = window.LIVE_TOOLS?.[tool.slug];

  // Focus mode
  const [focus, setFocus] = useState(() => new URLSearchParams(location.search).get("focus") === "1");
  const toggleFocus = useCallback(() => {
    setFocus(f => {
      const next = !f;
      const url = new URL(location.href);
      if (next) url.searchParams.set("focus", "1");
      else url.searchParams.delete("focus");
      history.replaceState(null, "", url.toString());
      return next;
    });
  }, []);

  // Keyboard shortcut F
  useEffect(() => {
    const h = (e) => {
      if ((e.key === "f" || e.key === "F") && !["INPUT","TEXTAREA"].includes(document.activeElement.tagName)) {
        e.preventDefault();
        toggleFocus();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [toggleFocus]);

  // Track recents + page title
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("dth_recents") || "[]");
      localStorage.setItem("dth_recents", JSON.stringify([tool.slug, ...raw.filter(s => s !== tool.slug)].slice(0, 8)));
    } catch {}
    document.title = `${tool.name} — TryDevTools`;
  }, [tool.slug]);

  return (
    <AppShell active="home">
      <div className="container" style={{paddingBottom:96}}>

        {/* Breadcrumbs */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 0 0"}}>
          <div className="crumbs">
            <a href={homeUrl()}>home</a>
            <span className="sep">/</span>
            <a href="/categories">categories</a>
            <span className="sep">/</span>
            <a href={catUrl(cat)}>{cat.slug}</a>
            <span className="sep">/</span>
            <span style={{color:"var(--ink)"}}>{tool.slug}</span>
          </div>
          <FocusBtn focus={focus} onToggle={toggleFocus}/>
        </div>

        {/* ── Tool header ─────────────────────────────────────────────── */}
        {!focus && (
          <header style={{padding:"28px 0 24px", borderBottom:"1px solid var(--line)", marginBottom:28}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:24}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
                  <a href={catUrl(cat)} className="chip accent" style={{gap:4}}>
                    <span style={{opacity:.7}}>/</span>{cat.slug}
                  </a>
                  {tool.popular && <span className="chip" style={{gap:4}}><Icon.Star style={{color:"var(--accent-hi)"}}/> popular</span>}
                  {live && (
                    <span className="chip" style={{gap:5}}>
                      <span style={{width:6,height:6,borderRadius:"50%",background:"var(--ok)",display:"inline-block"}}/>
                      live demo
                    </span>
                  )}
                  {!live && <span className="chip">coming soon</span>}
                </div>
                <h1 style={{fontSize:40,fontWeight:800,letterSpacing:"-0.03em",margin:"0 0 12px",lineHeight:1.1}}>
                  {tool.name}
                </h1>
                <p style={{fontSize:16,color:"var(--ink-2)",maxWidth:"70ch",margin:0,lineHeight:1.65}}>
                  {tool.desc} Runs entirely in your browser — nothing is ever sent to a server.
                </p>
              </div>

              {/* At-a-glance card */}
              <div className="card" style={{padding:"18px 22px",flexShrink:0,minWidth:220}}>
                <dl style={{margin:0,display:"grid",gridTemplateColumns:"auto 1fr",gap:"10px 16px",fontSize:12.5}}>
                  <dt style={{fontFamily:"var(--mono)",color:"var(--ink-3)"}}>category</dt>
                  <dd style={{fontFamily:"var(--mono)",margin:0,color:"var(--ink-2)"}}>/{cat.slug}</dd>
                  <dt style={{fontFamily:"var(--mono)",color:"var(--ink-3)"}}>privacy</dt>
                  <dd style={{fontFamily:"var(--mono)",margin:0,color:"var(--ok)"}}>100% local</dd>
                  <dt style={{fontFamily:"var(--mono)",color:"var(--ink-3)"}}>account</dt>
                  <dd style={{fontFamily:"var(--mono)",margin:0}}>not needed</dd>
                  <dt style={{fontFamily:"var(--mono)",color:"var(--ink-3)"}}>focus mode</dt>
                  <dd style={{margin:0,display:"flex",alignItems:"center",gap:5}}>
                    <span style={{fontSize:10,padding:"1px 5px",borderRadius:4,background:"var(--bg-3)",color:"var(--ink-2)",fontFamily:"var(--mono)",border:"1px solid var(--line)"}}>F</span>
                    <span style={{fontFamily:"var(--mono)",fontSize:12}}>key</span>
                  </dd>
                </dl>
              </div>
            </div>
          </header>
        )}

        {/* Focus mode minimal header */}
        {focus && (
          <div style={{padding:"16px 0 20px"}}>
            <h1 style={{fontSize:24,fontWeight:700,letterSpacing:"-0.02em",margin:0}}>{tool.name}</h1>
          </div>
        )}

        {/* ── Live tool ───────────────────────────────────────────────── */}
        {live ? live.render() : (
          <div className="card" style={{padding:"48px 40px",textAlign:"center"}}>
            <div style={{fontSize:13,fontFamily:"var(--mono)",color:"var(--ink-3)",letterSpacing:".08em",textTransform:"uppercase",marginBottom:12}}>coming soon</div>
            <div style={{fontSize:18,fontWeight:600,marginBottom:8}}>{tool.name}</div>
            <div style={{fontSize:14,color:"var(--ink-2)",marginBottom:24}}>This tool is on the roadmap. Try a live tool:</div>
            <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
              {Object.keys(window.LIVE_TOOLS || {}).slice(0, 6).map(s => {
                const t = window.TOOLS.find(x => x.slug === s);
                return t && <a key={s} href={toolUrl(t)} className="chip accent">{t.name}</a>;
              })}
            </div>
          </div>
        )}

        {/* ── Everything below hidden in focus mode ───────────────────── */}
        {!focus && (
          <>
            {/* ── About section ─────────────────────────────────────── */}
            <section style={{marginTop:64}}>
              <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:48,alignItems:"start"}}>
                <div>
                  <div className="eyebrow" style={{marginBottom:8}}>about this tool</div>
                  <h2 className="h2" style={{marginBottom:16}}>What the {tool.name} does</h2>
                  <p style={{fontSize:15,color:"var(--ink-2)",lineHeight:1.7,margin:"0 0 14px"}}>
                    {tool.desc} Designed for the real-world developer workflow — paste something in, get an answer immediately, no round-trips required.
                  </p>
                  <p style={{fontSize:15,color:"var(--ink-2)",lineHeight:1.7,margin:0}}>
                    Because this tool runs entirely in JavaScript in your browser tab, you can safely paste secrets, tokens, internal URLs, or any proprietary data.
                  </p>
                </div>
                <div>
                  <div className="eyebrow" style={{marginBottom:12}}>frequently asked</div>
                  {[
                    { q:"Is my data sent anywhere?", a:"Never. All computation runs in your browser. Zero network requests happen when you use any tool on TryDevTools." },
                    { q:"What is Focus Mode?", a:"Press F to hide the description, about section and related tools — leaving just the input/output panel. URL updates to ?focus=1 so you can share or bookmark the focused view." },
                    { q:"Do I need an account?", a:"No. Every tool is free and requires no sign-up. Your recently used tools are saved locally in your browser." },
                  ].map((f, i) => <FaqItem key={i} q={f.q} a={f.a} defaultOpen={i===0}/>)}
                </div>
              </div>
            </section>

            {/* ── More tools in this category ───────────────────────── */}
            {allCatTools.length > 0 && (
              <section style={{marginTop:72}}>
                <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:20}}>
                  <div>
                    <div className="eyebrow" style={{marginBottom:6}}>more in /{cat.slug}</div>
                    <h2 className="h2">Other {cat.name} tools</h2>
                  </div>
                  <a href={catUrl(cat)} style={{fontFamily:"var(--mono)",fontSize:12,color:"var(--ink-2)"}}>
                    View all {cat.name} tools →
                  </a>
                </div>
                <div className="grid-auto">
                  {allCatTools.map(t => <ToolCard key={t.slug} tool={t}/>)}
                </div>
              </section>
            )}

            {/* ── All categories strip ───────────────────────────────── */}
            <section style={{marginTop:72,padding:"28px 32px",background:"var(--bg-1)",borderRadius:"var(--r-xl)",border:"1px solid var(--line)"}}>
              <div className="eyebrow" style={{marginBottom:12}}>explore more tools</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {window.CATEGORIES.map(c => (
                  <a key={c.slug} href={catUrl(c)} className="chip"
                    style={{transition:"all 120ms",cursor:"pointer"}}
                    onMouseOver={e=>{e.currentTarget.style.borderColor="var(--accent)";e.currentTarget.style.color="var(--accent-hi)";}}
                    onMouseOut={e=>{e.currentTarget.style.borderColor="";e.currentTarget.style.color="";}}>
                    {c.name}
                    <span style={{opacity:.5,marginLeft:3}}>{window.TOOLS.filter(t=>t.category===c.slug).length}</span>
                  </a>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Focus mode floating exit bar */}
      {focus && (
        <div style={{position:"fixed",bottom:24,left:24,zIndex:80,display:"flex",gap:10}}>
          <button onClick={toggleFocus} style={{
            display:"inline-flex",alignItems:"center",gap:8,
            padding:"10px 16px",borderRadius:10,
            background:"var(--bg-1)",border:"1px solid var(--line-strong)",
            color:"var(--ink-2)",fontSize:13,fontWeight:600,
            cursor:"pointer",boxShadow:"var(--shadow-lg)",fontFamily:"var(--font)",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 0 2-2h3M3 16h3a2 2 0 0 0 2 2v3"/>
            </svg>
            Exit focus
            <span style={{fontSize:10,padding:"1px 5px",borderRadius:4,background:"var(--bg-3)",color:"var(--ink-3)",fontFamily:"var(--mono)",border:"1px solid var(--line)"}}>F</span>
          </button>
          <a href={catUrl(cat)} style={{
            display:"inline-flex",alignItems:"center",gap:6,
            padding:"10px 14px",borderRadius:10,
            background:"var(--bg-1)",border:"1px solid var(--line-strong)",
            color:"var(--ink-2)",fontSize:13,fontWeight:500,
            boxShadow:"var(--shadow-lg)",
          }}>
            ← All {cat.name} tools
          </a>
        </div>
      )}
    </AppShell>
  );
}

window.ToolPage = ToolPage;
