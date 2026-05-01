// Regex category — regex tester
const { useState, useMemo } = React;

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

// ────────────────────────────────────────────────────────────────────────────
window.LIVE_TOOLS = window.LIVE_TOOLS || {};
Object.assign(window.LIVE_TOOLS, {
  "regex-tester": { render: () => <RegexTool/> },
});
