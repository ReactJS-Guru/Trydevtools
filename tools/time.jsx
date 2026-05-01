// Time & Date category — 8 tools
const { useState, useEffect, useMemo } = React;

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
        <input type="datetime-local" value={iso.slice(0,16)} onChange={e=>setTs(Math.floor(new Date(e.target.value).getTime()/1000))} style={{width:240, fontSize:13, padding:"8px 12px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r)", color:"var(--ink)", fontFamily:"var(--mono)", outline:"none"}}/>
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

// ── shared input style ─────────────────────────────────────────────────────
const inputStyle = {
  background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: "var(--r)",
  color: "var(--ink)", fontFamily: "var(--mono)", outline: "none",
};

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
// TIMEZONE CONVERTER
// ════════════════════════════════════════════════════════════════════════════
const POPULAR_TZ = [
  "UTC",
  "America/Los_Angeles", "America/Denver", "America/Chicago", "America/New_York",
  "America/Sao_Paulo", "Europe/London", "Europe/Berlin", "Europe/Athens", "Europe/Moscow",
  "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Asia/Shanghai", "Asia/Tokyo",
  "Australia/Sydney", "Pacific/Auckland",
];
function formatInTz(date, tz) {
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", second:"2-digit", hour12: false, timeZoneName: "shortOffset" });
    const parts = fmt.formatToParts(date);
    const get = (t) => parts.find(p => p.type === t)?.value || "";
    return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}:${get("second")}`, offset: get("timeZoneName") };
  } catch (e) { return null; }
}
function TimezoneConverterTool() {
  const [iso, setIso] = useState(new Date().toISOString().slice(0, 16));
  const [sourceTz, setSourceTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const date = useMemo(() => {
    if (!iso) return new Date();
    // Treat the local-style input as wall-clock time IN sourceTz
    try {
      // Compute UTC such that when displayed in sourceTz it equals iso
      const [d, t] = iso.split("T");
      const fakeUtc = new Date(`${d}T${t || "00:00"}:00.000Z`);
      const tzNow = formatInTz(fakeUtc, sourceTz);
      if (!tzNow) return fakeUtc;
      // Difference between fakeUtc and what it would display as in sourceTz
      const displayIso = `${tzNow.date}T${tzNow.time}.000Z`;
      const offsetMs = new Date(displayIso).getTime() - fakeUtc.getTime();
      return new Date(fakeUtc.getTime() - offsetMs);
    } catch { return new Date(); }
  }, [iso, sourceTz]);
  return (
    <>
      <div style={{display:"grid", gridTemplateColumns:"2fr 1fr", gap:14, marginBottom:14}}>
        <div className="card" style={{padding:18}}>
          <div className="eyebrow" style={{marginBottom:10}}>date · time</div>
          <input type="datetime-local" value={iso} onChange={e=>setIso(e.target.value)} style={{...inputStyle, width:"100%", fontSize:18, padding:"10px 14px"}}/>
        </div>
        <div className="card" style={{padding:18}}>
          <div className="eyebrow" style={{marginBottom:10}}>source timezone</div>
          <select value={sourceTz} onChange={e=>setSourceTz(e.target.value)} style={{...inputStyle, width:"100%", fontSize:13, padding:"10px 14px", cursor:"pointer"}}>
            {POPULAR_TZ.map(tz => <option key={tz} value={tz} style={{background:"var(--bg-2)"}}>{tz}</option>)}
          </select>
        </div>
      </div>
      <div className="eyebrow" style={{marginBottom:10}}>same instant in other zones</div>
      <div className="card" style={{padding:0, overflow:"hidden"}}>
        {POPULAR_TZ.map((tz, i) => {
          const r = formatInTz(date, tz);
          if (!r) return null;
          const isSource = tz === sourceTz;
          return (
            <div key={tz} style={{display:"flex", alignItems:"center", padding:"10px 16px", borderBottom: i < POPULAR_TZ.length-1 ? "1px solid var(--line)" : "none", gap:14, background: isSource ? "var(--accent-soft)" : "transparent"}}>
              <span className="mono" style={{fontSize:12, color: isSource ? "var(--accent-hi)" : "var(--ink-2)", width:200, fontWeight: isSource ? 600 : 400}}>{tz}{isSource && " ← source"}</span>
              <span className="mono" style={{flex:1, fontSize:13.5, color:"var(--ink)"}}>{r.date} {r.time}</span>
              <span className="mono" style={{fontSize:12, color:"var(--ink-3)"}}>{r.offset}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CRON PARSER
// ════════════════════════════════════════════════════════════════════════════
const CRON_FIELD_NAMES = ["minute", "hour", "day-of-month", "month", "day-of-week"];
const CRON_FIELD_BOUNDS = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 6]];
const CRON_DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const CRON_MONTHS = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function parseCronField(spec, [lo, hi]) {
  if (spec === "*") return { all: true, vals: range(lo, hi) };
  const out = new Set();
  for (const part of spec.split(",")) {
    let [base, step] = part.split("/");
    const s = step ? +step : 1;
    if (base === "*") {
      for (let i = lo; i <= hi; i += s) out.add(i);
    } else if (base.includes("-")) {
      const [a, b] = base.split("-").map(Number);
      for (let i = a; i <= b; i += s) out.add(i);
    } else {
      out.add(+base);
    }
  }
  return { all: false, vals: [...out].sort((a,b)=>a-b) };
}
function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }
function explainCron(expr) {
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) throw new Error(`Expected 5 fields, got ${fields.length}`);
  const parsed = fields.map((f, i) => parseCronField(f, CRON_FIELD_BOUNDS[i]));
  const desc = [];
  desc.push(parsed[0].all ? "every minute" : `at minute ${parsed[0].vals.join(",")}`);
  if (!parsed[1].all) desc.push(`at hour${parsed[1].vals.length > 1 ? "s" : ""} ${parsed[1].vals.join(",")}`);
  if (!parsed[2].all) desc.push(`on day-of-month ${parsed[2].vals.join(",")}`);
  if (!parsed[3].all) desc.push(`in ${parsed[3].vals.map(n => CRON_MONTHS[n]).join(",")}`);
  if (!parsed[4].all) desc.push(`on ${parsed[4].vals.map(n => CRON_DAYS[n]).join(",")}`);
  return { fields, parsed, desc: desc.join(", ") };
}
function nextCronRuns(parsed, count = 5, from = new Date()) {
  const out = [];
  let d = new Date(from.getTime());
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1);
  let safety = 0;
  while (out.length < count && safety++ < 366*24*60) {
    const m = d.getMinutes(), h = d.getHours(), dom = d.getDate(), mo = d.getMonth()+1, dow = d.getDay();
    if (parsed[0].vals.includes(m) && parsed[1].vals.includes(h) && parsed[2].vals.includes(dom) && parsed[3].vals.includes(mo) && parsed[4].vals.includes(dow)) {
      out.push(new Date(d.getTime()));
    }
    d.setMinutes(d.getMinutes() + 1);
  }
  return out;
}
function CronParserTool() {
  const [expr, setExpr] = useState("0 9 * * 1-5");
  const result = useMemo(() => {
    try { const p = explainCron(expr); return { ok: true, ...p, runs: nextCronRuns(p.parsed) }; }
    catch (e) { return { ok: false, error: e.message }; }
  }, [expr]);
  return (
    <>
      <div className="card" style={{padding:18, marginBottom:14}}>
        <div className="eyebrow" style={{marginBottom:10}}>cron expression</div>
        <input value={expr} onChange={e=>setExpr(e.target.value)} placeholder="* * * * *" style={{...inputStyle, width:"100%", fontSize:22, padding:"12px 16px", borderColor: result.ok ? "var(--line)" : "var(--err)"}}/>
        <div style={{marginTop:10, display:"flex", gap:6, flexWrap:"wrap"}}>
          {[
            ["* * * * *", "every minute"],
            ["0 * * * *", "hourly"],
            ["0 0 * * *", "daily at midnight"],
            ["0 9 * * 1-5", "weekdays at 9am"],
            ["*/15 * * * *", "every 15 min"],
            ["0 0 1 * *", "1st of month"],
            ["0 0 * * 0", "Sundays"],
          ].map(([e, l]) => <button key={e} className="chip" style={{cursor:"pointer", padding:"4px 10px", fontSize:11.5}} onClick={()=>setExpr(e)}>{l}</button>)}
        </div>
      </div>
      {!result.ok ? <div className="card" style={{padding:14, color:"var(--err)"}}>{result.error}</div> : (
        <>
          <div style={{display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:8, marginBottom:14}}>
            {result.fields.map((f, i) => (
              <div key={i} className="card" style={{padding:"10px 12px"}}>
                <div className="mono" style={{fontSize:11, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em"}}>{CRON_FIELD_NAMES[i]}</div>
                <div className="mono" style={{fontSize:18, color:"var(--accent-hi)", marginTop:2}}>{f}</div>
                <div className="mono" style={{fontSize:11, color:"var(--ink-2)", marginTop:4}}>{result.parsed[i].all ? "any" : result.parsed[i].vals.length > 5 ? `${result.parsed[i].vals.length} values` : result.parsed[i].vals.join(",")}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{padding:"14px 18px", marginBottom:14, background:"var(--accent-soft)", borderColor:"rgba(99,102,241,.3)"}}>
            <div style={{fontSize:11, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", fontFamily:"var(--mono)", marginBottom:4}}>schedule</div>
            <div style={{fontSize:14.5, color:"var(--ink)"}}>Runs <span style={{color:"var(--accent-hi)", fontWeight:600}}>{result.desc}</span></div>
          </div>
          <div className="eyebrow" style={{marginBottom:10}}>next 5 runs</div>
          <div className="card" style={{padding:0, overflow:"hidden"}}>
            {result.runs.map((d, i) => (
              <div key={i} style={{display:"flex", padding:"10px 16px", borderBottom: i < result.runs.length-1 ? "1px solid var(--line)" : "none", gap:14, fontFamily:"var(--mono)", fontSize:13}}>
                <span style={{width:24, color:"var(--ink-3)"}}>#{i+1}</span>
                <span style={{flex:1, color:"var(--ink)"}}>{d.toLocaleString(undefined, { weekday:"short", year:"numeric", month:"short", day:"2-digit", hour:"2-digit", minute:"2-digit" })}</span>
                <span style={{color:"var(--ink-3)"}}>{Math.round((d.getTime() - Date.now()) / 60000)} min from now</span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CRON BUILDER (visual)
// ════════════════════════════════════════════════════════════════════════════
function CronBuilderTool() {
  const [preset, setPreset] = useState("custom");
  const [m, setM] = useState("0");
  const [h, setH] = useState("9");
  const [dom, setDom] = useState("*");
  const [mo, setMo] = useState("*");
  const [dow, setDow] = useState("1-5");
  const expr = `${m} ${h} ${dom} ${mo} ${dow}`;
  let explained = "";
  try { explained = explainCron(expr).desc; } catch { explained = "Invalid expression"; }
  const apply = (a, b, c, d, e) => { setM(a); setH(b); setDom(c); setMo(d); setDow(e); setPreset("custom"); };
  return (
    <>
      <div className="card" style={{padding:18, marginBottom:14}}>
        <div className="eyebrow" style={{marginBottom:10}}>quick presets</div>
        <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
          {[
            ["Every minute", "*","*","*","*","*"],
            ["Every 5 min",  "*/5","*","*","*","*"],
            ["Every 15 min", "*/15","*","*","*","*"],
            ["Hourly",       "0","*","*","*","*"],
            ["Daily 9am",    "0","9","*","*","*"],
            ["Weekdays 9am", "0","9","*","*","1-5"],
            ["Sun midnight", "0","0","*","*","0"],
            ["1st of month", "0","0","1","*","*"],
            ["Yearly Jan 1", "0","0","1","1","*"],
          ].map(([label, ...vals]) => <button key={label} className="chip" style={{cursor:"pointer", padding:"4px 10px", fontSize:11.5}} onClick={()=>apply(...vals)}>{label}</button>)}
        </div>
      </div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:10, marginBottom:14}}>
        {[
          ["minute", m, setM, "0-59"],
          ["hour", h, setH, "0-23"],
          ["day-of-month", dom, setDom, "1-31 or *"],
          ["month", mo, setMo, "1-12 or *"],
          ["day-of-week", dow, setDow, "0-6 or *"],
        ].map(([label, val, setter, hint]) => (
          <div key={label} className="card" style={{padding:14}}>
            <div className="mono" style={{fontSize:11, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:6}}>{label}</div>
            <input value={val} onChange={e=>setter(e.target.value)} style={{...inputStyle, width:"100%", fontSize:18, padding:"8px 10px", textAlign:"center"}}/>
            <div className="mono" style={{fontSize:10, color:"var(--ink-3)", marginTop:4}}>{hint}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{padding:"18px 22px", display:"flex", alignItems:"center", gap:18}}>
        <div style={{flex:1}}>
          <div className="eyebrow" style={{marginBottom:6}}>expression</div>
          <div className="mono" style={{fontSize:24, color:"var(--accent-hi)", fontWeight:600}}>{expr}</div>
          <div style={{fontSize:13, color:"var(--ink-2)", marginTop:6}}>Runs <span style={{color:"var(--accent-hi)"}}>{explained}</span></div>
        </div>
        <CopyBtn value={expr}/>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DURATION CALCULATOR
// ════════════════════════════════════════════════════════════════════════════
function DurationCalcTool() {
  const [a, setA] = useState(new Date().toISOString().slice(0, 16));
  const [b, setB] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16));
  const diffMs = useMemo(() => new Date(b).getTime() - new Date(a).getTime(), [a, b]);
  const abs = Math.abs(diffMs);
  const breakdown = {
    milliseconds: abs,
    seconds: Math.floor(abs / 1000),
    minutes: Math.floor(abs / 60000),
    hours:   Math.floor(abs / 3600000),
    days:    Math.floor(abs / 86400000),
    weeks:   Math.floor(abs / (86400000 * 7)),
  };
  const human = (() => {
    let ms = abs;
    const parts = [];
    const yrs = Math.floor(ms / (365.25 * 86400000)); ms -= yrs * 365.25 * 86400000;
    const days = Math.floor(ms / 86400000); ms -= days * 86400000;
    const hrs = Math.floor(ms / 3600000); ms -= hrs * 3600000;
    const mins = Math.floor(ms / 60000); ms -= mins * 60000;
    const secs = Math.floor(ms / 1000);
    if (yrs) parts.push(`${yrs}y`); if (days) parts.push(`${days}d`); if (hrs) parts.push(`${hrs}h`); if (mins) parts.push(`${mins}m`); if (secs && parts.length < 3) parts.push(`${secs}s`);
    return parts.join(" ") || "0s";
  })();
  return (
    <>
      <div style={{display:"grid", gridTemplateColumns:"1fr 60px 1fr", gap:14, alignItems:"center", marginBottom:14}}>
        <div className="card" style={{padding:18}}>
          <div className="eyebrow" style={{marginBottom:10}}>start</div>
          <input type="datetime-local" value={a} onChange={e=>setA(e.target.value)} style={{...inputStyle, width:"100%", fontSize:16, padding:"10px 12px"}}/>
        </div>
        <div style={{textAlign:"center", color:"var(--ink-3)", fontSize:24}}>→</div>
        <div className="card" style={{padding:18}}>
          <div className="eyebrow" style={{marginBottom:10}}>end</div>
          <input type="datetime-local" value={b} onChange={e=>setB(e.target.value)} style={{...inputStyle, width:"100%", fontSize:16, padding:"10px 12px"}}/>
        </div>
      </div>
      <div className="card" style={{padding:"22px 26px", marginBottom:14, textAlign:"center", background: diffMs < 0 ? "rgba(248,113,113,.06)" : "var(--bg-1)"}}>
        <div className="eyebrow" style={{marginBottom:6}}>{diffMs < 0 ? "end is before start" : "duration"}</div>
        <div style={{fontSize:34, fontFamily:"var(--mono)", fontWeight:700, color: diffMs < 0 ? "var(--err)" : "var(--accent-hi)"}}>{diffMs < 0 ? "−" : ""}{human}</div>
      </div>
      <div className="card" style={{padding:0, overflow:"hidden"}}>
        {Object.entries(breakdown).map(([k, v], i, a) => (
          <div key={k} style={{display:"flex", alignItems:"center", padding:"10px 16px", borderBottom: i < a.length-1 ? "1px solid var(--line)" : "none", gap:14}}>
            <span className="mono" style={{fontSize:11, color:"var(--ink-3)", width:140, textTransform:"uppercase", letterSpacing:".06em"}}>{k}</span>
            <span className="mono" style={{flex:1, fontSize:14, color:"var(--ink)"}}>{v.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DATE FORMATTER (custom tokens)
// ════════════════════════════════════════════════════════════════════════════
const MONTHS_LONG = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS_LONG = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
function formatDate(date, fmt) {
  const pad = (n, w = 2) => String(n).padStart(w, "0");
  const Y = date.getFullYear(), M = date.getMonth() + 1, D = date.getDate();
  const H = date.getHours(), m = date.getMinutes(), s = date.getSeconds(), ms = date.getMilliseconds();
  const dow = date.getDay();
  const h12 = H % 12 === 0 ? 12 : H % 12;
  const offset = -date.getTimezoneOffset();
  const tzSign = offset >= 0 ? "+" : "-";
  const tzH = pad(Math.floor(Math.abs(offset) / 60)), tzM = pad(Math.abs(offset) % 60);
  const TOKENS = {
    YYYY: pad(Y, 4), YY: pad(Y % 100), Y: String(Y),
    MMMM: MONTHS_LONG[M-1], MMM: MONTHS_SHORT[M-1], MM: pad(M), M: String(M),
    DD: pad(D), D: String(D), DDDD: DAYS_LONG[dow], DDD: DAYS_SHORT[dow],
    HH: pad(H), H: String(H), hh: pad(h12), h: String(h12),
    mm: pad(m), m: String(m), ss: pad(s), s: String(s), SSS: pad(ms, 3),
    A: H < 12 ? "AM" : "PM", a: H < 12 ? "am" : "pm",
    Z: `${tzSign}${tzH}:${tzM}`, ZZ: `${tzSign}${tzH}${tzM}`,
  };
  return fmt.replace(/\[([^\]]+)\]|YYYY|YY|Y|MMMM|MMM|MM|M|DDDD|DDD|DD|D|HH|H|hh|h|mm|m|ss|s|SSS|A|a|ZZ|Z/g, (match, escaped) => escaped !== undefined ? escaped : TOKENS[match] ?? match);
}
function DateFormatterTool() {
  const [iso, setIso] = useState(new Date().toISOString().slice(0, 19));
  const [fmt, setFmt] = useState("YYYY-MM-DD HH:mm:ss");
  const date = useMemo(() => { const d = new Date(iso); return isNaN(d.getTime()) ? new Date() : d; }, [iso]);
  const result = useMemo(() => { try { return formatDate(date, fmt); } catch { return "Error"; } }, [date, fmt]);
  const presets = [
    ["YYYY-MM-DD HH:mm:ss",        "ISO basic"],
    ["YYYY-MM-DDTHH:mm:ssZ",       "ISO 8601"],
    ["DDD, D MMM YYYY HH:mm:ss Z", "RFC 2822"],
    ["MMM D, YYYY",                "US short"],
    ["DDDD, MMMM D, YYYY",         "US long"],
    ["D/M/YYYY",                   "EU short"],
    ["h:mm A",                     "12-hour"],
    ["[Year:] YYYY [Q:] M",        "with literals"],
  ];
  return (
    <>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14}}>
        <div className="card" style={{padding:18}}>
          <div className="eyebrow" style={{marginBottom:10}}>date</div>
          <input type="datetime-local" value={iso.slice(0,16)} onChange={e=>setIso(e.target.value)} style={{...inputStyle, width:"100%", fontSize:16, padding:"10px 12px"}}/>
        </div>
        <div className="card" style={{padding:18}}>
          <div className="eyebrow" style={{marginBottom:10}}>format string</div>
          <input value={fmt} onChange={e=>setFmt(e.target.value)} style={{...inputStyle, width:"100%", fontSize:16, padding:"10px 12px"}}/>
        </div>
      </div>
      <div className="card" style={{padding:"22px 26px", marginBottom:14, textAlign:"center"}}>
        <div className="eyebrow" style={{marginBottom:6}}>output</div>
        <div style={{fontSize:24, fontFamily:"var(--mono)", color:"var(--accent-hi)", wordBreak:"break-all"}}>{result}</div>
      </div>
      <div className="eyebrow" style={{marginBottom:10}}>preset formats</div>
      <div className="card" style={{padding:0, overflow:"hidden"}}>
        {presets.map(([f, n], i) => (
          <div key={f} style={{display:"flex", alignItems:"center", padding:"10px 16px", borderBottom: i < presets.length-1 ? "1px solid var(--line)" : "none", gap:14, cursor:"pointer"}} onClick={()=>setFmt(f)}>
            <span className="mono" style={{fontSize:12, color:"var(--ink-3)", width:120}}>{n}</span>
            <span className="mono" style={{width:230, fontSize:12, color:"var(--accent-hi)"}}>{f}</span>
            <span style={{flex:1, fontSize:13, color:"var(--ink)"}}>{formatDate(date, f)}</span>
          </div>
        ))}
      </div>
      <div style={{marginTop:14, padding:"12px 16px", background:"var(--bg-1)", border:"1px solid var(--line)", borderRadius:"var(--r-lg)", fontSize:12.5, color:"var(--ink-2)", lineHeight:1.7}}>
        <div style={{fontFamily:"var(--mono)", color:"var(--ink-3)", fontSize:11, marginBottom:6, textTransform:"uppercase", letterSpacing:".06em"}}>tokens</div>
        <code style={{color:"var(--accent-hi)"}}>YYYY/YY/Y</code> year · <code style={{color:"var(--accent-hi)"}}>MMMM/MMM/MM/M</code> month · <code style={{color:"var(--accent-hi)"}}>DDDD/DDD/DD/D</code> day · <code style={{color:"var(--accent-hi)"}}>HH/H/hh/h</code> hour · <code style={{color:"var(--accent-hi)"}}>mm/m</code> minute · <code style={{color:"var(--accent-hi)"}}>ss/s</code> second · <code style={{color:"var(--accent-hi)"}}>A/a</code> AM/PM · <code style={{color:"var(--accent-hi)"}}>Z/ZZ</code> tz · <code style={{color:"var(--accent-hi)"}}>[literal]</code> escape
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// AGE CALCULATOR
// ════════════════════════════════════════════════════════════════════════════
function AgeCalculatorTool() {
  const [birth, setBirth] = useState("2000-01-15");
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const result = useMemo(() => {
    const b = new Date(birth);
    if (isNaN(b.getTime())) return null;
    const n = new Date(now);
    let years = n.getFullYear() - b.getFullYear();
    let months = n.getMonth() - b.getMonth();
    let days = n.getDate() - b.getDate();
    if (days < 0) { months--; const lastMonth = new Date(n.getFullYear(), n.getMonth(), 0); days += lastMonth.getDate(); }
    if (months < 0) { years--; months += 12; }
    const totalMs = n.getTime() - b.getTime();
    return {
      years, months, days,
      totalDays: Math.floor(totalMs / 86400000),
      totalHours: Math.floor(totalMs / 3600000),
      totalMinutes: Math.floor(totalMs / 60000),
      totalSeconds: Math.floor(totalMs / 1000),
      nextBirthday: (() => {
        const next = new Date(n.getFullYear(), b.getMonth(), b.getDate());
        if (next < n) next.setFullYear(next.getFullYear() + 1);
        return Math.ceil((next.getTime() - n.getTime()) / 86400000);
      })(),
    };
  }, [birth, now]);
  return (
    <>
      <div className="card" style={{padding:18, marginBottom:14}}>
        <div className="eyebrow" style={{marginBottom:10}}>date of birth</div>
        <input type="date" value={birth} onChange={e=>setBirth(e.target.value)} style={{...inputStyle, fontSize:18, padding:"10px 14px", colorScheme:"dark"}}/>
      </div>
      {!result ? <div className="card" style={{padding:14, color:"var(--err)"}}>Invalid date</div> : (
        <>
          <div className="card" style={{padding:"24px 28px", marginBottom:14, textAlign:"center"}}>
            <div className="eyebrow" style={{marginBottom:6}}>age</div>
            <div style={{fontSize:38, fontFamily:"var(--mono)", fontWeight:700, color:"var(--accent-hi)"}}>{result.years}<span style={{fontSize:18, color:"var(--ink-3)"}}>y</span> {result.months}<span style={{fontSize:18, color:"var(--ink-3)"}}>mo</span> {result.days}<span style={{fontSize:18, color:"var(--ink-3)"}}>d</span></div>
            <div style={{fontSize:13, color:"var(--ink-2)", marginTop:8}}>{result.nextBirthday} day{result.nextBirthday !== 1 ? "s" : ""} until next birthday 🎂</div>
          </div>
          <div className="card" style={{padding:0, overflow:"hidden"}}>
            {[
              ["Total days",    result.totalDays],
              ["Total hours",   result.totalHours],
              ["Total minutes", result.totalMinutes],
              ["Total seconds", result.totalSeconds],
            ].map(([k, v], i, a) => (
              <div key={k} style={{display:"flex", alignItems:"center", padding:"10px 16px", borderBottom: i < a.length-1 ? "1px solid var(--line)" : "none", gap:14}}>
                <span className="mono" style={{fontSize:11, color:"var(--ink-3)", width:140, textTransform:"uppercase", letterSpacing:".06em"}}>{k}</span>
                <span className="mono" style={{flex:1, fontSize:14, color:"var(--ink)"}}>{v.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// WEEK NUMBER
// ════════════════════════════════════════════════════════════════════════════
function isoWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { week: weekNo, year: d.getUTCFullYear() };
}
function dayOfYear(date) {
  return Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
}
function WeekNumberTool() {
  const [iso, setIso] = useState(new Date().toISOString().slice(0, 10));
  const date = useMemo(() => { const d = new Date(iso); return isNaN(d.getTime()) ? new Date() : d; }, [iso]);
  const isoWk = isoWeekNumber(date);
  const usWk = Math.ceil((dayOfYear(date) + new Date(date.getFullYear(), 0, 1).getDay()) / 7);
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const yearDays = isLeap(date.getFullYear()) ? 366 : 365;
  const weekStart = (() => { const d = new Date(date); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return d; })();
  return (
    <>
      <div className="card" style={{padding:18, marginBottom:14}}>
        <div className="eyebrow" style={{marginBottom:10}}>date</div>
        <input type="date" value={iso} onChange={e=>setIso(e.target.value)} style={{...inputStyle, fontSize:18, padding:"10px 14px", colorScheme:"dark"}}/>
      </div>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14}}>
        <div className="card" style={{padding:"22px 26px", textAlign:"center"}}>
          <div className="eyebrow" style={{marginBottom:6}}>ISO 8601 week (Mon-start)</div>
          <div style={{fontSize:42, fontFamily:"var(--mono)", fontWeight:700, color:"var(--accent-hi)"}}>W{isoWk.week}</div>
          <div style={{fontSize:13, color:"var(--ink-3)", fontFamily:"var(--mono)", marginTop:4}}>{isoWk.year}-W{String(isoWk.week).padStart(2,"0")}</div>
        </div>
        <div className="card" style={{padding:"22px 26px", textAlign:"center"}}>
          <div className="eyebrow" style={{marginBottom:6}}>US week (Sun-start)</div>
          <div style={{fontSize:42, fontFamily:"var(--mono)", fontWeight:700, color:"var(--accent-hi)"}}>W{usWk}</div>
          <div style={{fontSize:13, color:"var(--ink-3)", fontFamily:"var(--mono)", marginTop:4}}>{date.getFullYear()}-W{String(usWk).padStart(2,"0")}</div>
        </div>
      </div>
      <div className="card" style={{padding:0, overflow:"hidden"}}>
        {[
          ["Day of week",     date.toLocaleDateString(undefined, { weekday: "long" })],
          ["Day of month",    `${date.getDate()} of ${new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()}`],
          ["Day of year",     `${dayOfYear(date)} of ${yearDays}`],
          ["Quarter",         `Q${quarter}`],
          ["Week start (Mon)",weekStart.toLocaleDateString(undefined, { weekday: "short", year:"numeric", month:"short", day:"2-digit" })],
          ["Year is leap?",   isLeap(date.getFullYear()) ? "Yes" : "No"],
        ].map(([k, v], i, a) => (
          <div key={k} style={{display:"flex", alignItems:"center", padding:"10px 16px", borderBottom: i < a.length-1 ? "1px solid var(--line)" : "none", gap:14}}>
            <span className="mono" style={{fontSize:11, color:"var(--ink-3)", width:160, textTransform:"uppercase", letterSpacing:".06em"}}>{k}</span>
            <span className="mono" style={{flex:1, fontSize:14, color:"var(--ink)"}}>{v}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
window.LIVE_TOOLS = window.LIVE_TOOLS || {};
Object.assign(window.LIVE_TOOLS, {
  "timestamp-converter":  { render: () => <TimestampTool/> },
  "timezone-converter":   { render: () => <TimezoneConverterTool/> },
  "cron-parser":          { render: () => <CronParserTool/> },
  "cron-builder":         { render: () => <CronBuilderTool/> },
  "duration-calculator":  { render: () => <DurationCalcTool/> },
  "date-formatter":       { render: () => <DateFormatterTool/> },
  "age-calculator":       { render: () => <AgeCalculatorTool/> },
  "week-number":          { render: () => <WeekNumberTool/> },
});
