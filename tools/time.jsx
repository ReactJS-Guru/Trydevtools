// Time category — timestamp converter
const { useState, useEffect } = React;

function relativeTime(d) {
  const diff = (Date.now() - d.getTime()) / 1000;
  const abs = Math.abs(diff);
  const sign = diff > 0 ? "ago" : "from now";
  if (abs < 60) return `${Math.round(abs)}s ${sign}`;
  if (abs < 3600) return `${Math.round(abs/60)}m ${sign}`;
  if (abs < 86400) return `${Math.round(abs/3600)}h ${sign}`;
  if (abs < 86400*30) return `${Math.round(abs/86400)}d ${sign}`;
  return `${Math.round(abs/86400/30)}mo ${sign}`;
}

// ════════════════════════════════════════════════════════════════════════════
// TIMESTAMP CONVERTER
// ════════════════════════════════════════════════════════════════════════════
function TimestampTool() {
  const [ts, setTs] = useState(Math.floor(Date.now()/1000));
  const [iso, setIso] = useState(new Date().toISOString());
  useEffect(() => { setIso(new Date(ts*1000).toISOString()); }, [ts]);
  const d = new Date(ts*1000);
  const rows = [
    ["Unix (seconds)", String(ts)],
    ["Unix (ms)",      String(ts*1000)],
    ["ISO 8601",       d.toISOString()],
    ["UTC",            d.toUTCString()],
    ["Local",          d.toString()],
    ["Relative",       relativeTime(d)],
    ["Day of year",    `${Math.floor((d - new Date(d.getFullYear(),0,0))/86400000)}`],
    ["Week of year",   `${Math.ceil(((d - new Date(d.getFullYear(),0,1))/86400000 + new Date(d.getFullYear(),0,1).getDay()+1)/7)}`],
  ];
  return (
    <>
      <div style={{display:"flex", gap:8, marginBottom:14, alignItems:"center", flexWrap:"wrap"}}>
        <button className="btn btn-secondary btn-sm" onClick={()=>setTs(Math.floor(Date.now()/1000))}>Now</button>
        <span className="chip">
          <input type="number" value={ts} onChange={e=>setTs(+e.target.value)} style={{background:"transparent", border:0, outline:0, fontFamily:"var(--mono)", fontSize:13, color:"var(--ink)", width:120}}/>
        </span>
        <span style={{fontSize:12, color:"var(--ink-3)"}}>or</span>
        <input type="datetime-local" value={iso.slice(0,16)} onChange={e=>setTs(Math.floor(new Date(e.target.value).getTime()/1000))} className="search-box" style={{width:240, fontSize:13}}/>
      </div>
      <div className="card" style={{padding:0, overflow:"hidden"}}>
        {rows.map(([k,v],i) => (
          <div key={k} style={{display:"flex", alignItems:"center", padding:"12px 16px", borderBottom: i<rows.length-1?"1px solid var(--line)":0, gap:16}}>
            <span className="mono" style={{fontSize:11, color:"var(--ink-3)", width:140, textTransform:"uppercase", letterSpacing:".06em"}}>{k}</span>
            <span className="mono" style={{flex:1, fontSize:13.5, color:"var(--ink)"}}>{v}</span>
            <button className="btn btn-ghost btn-sm" onClick={()=>navigator.clipboard.writeText(v)}><Icon.Copy/></button>
          </div>
        ))}
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
window.LIVE_TOOLS = window.LIVE_TOOLS || {};
Object.assign(window.LIVE_TOOLS, {
  "timestamp-converter": { render: () => <TimestampTool/> },
});
