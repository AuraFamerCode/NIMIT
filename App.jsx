import { useState, useRef, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const API_URL = "http://localhost:8000";

// ─── Design tokens (ChatGPT-inspired dark theme) ───────────────────────────
const C = {
  bg:        "#212121",
  surface:   "#2f2f2f",
  surface2:  "#3a3a3a",
  border:    "#4a4a4a",
  cyan:      "#10a37f",
  green:     "#20c997",
  red:       "#fa5252",
  text:      "#ececec",
  dim:       "#8b8b8b",
  muted:     "#6e6e6e",
  inputBg:   "#404040",
  hover:     "#505050",
};
const mono = "'SF Mono','Cascadia Code','Fira Code',monospace";

const S = {
  shell:     { display:"flex", height:"100vh", fontFamily:mono, background:C.bg, color:C.text, overflow:"hidden" },
  // Sidebar
  sidebar:   { width:280, minWidth:280, background:"#171717", borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", overflow:"hidden" },
  sideHead:  { padding:"16px 16px 12px", display:"flex", alignItems:"center", justifyContent:"space-between" },
  sideTitle: { fontSize:11, letterSpacing:"0.12em", color:C.dim, textTransform:"uppercase", fontWeight:600 },
  newChat:   { background:C.cyan, border:"none", borderRadius:6, color:"#fff", fontFamily:mono, fontSize:11, fontWeight:700, padding:"8px 14px", cursor:"pointer", letterSpacing:"0.05em" },
  sideScroll:{ flex:1, overflowY:"auto", padding:"4px 0" },
  histItem:  (active, ok) => ({ padding:"10px 16px", cursor:"pointer", background: active ? "#1e1e1e" : "transparent", borderLeft:`3px solid ${active ? C.cyan : "transparent"}`, borderBottom:`1px solid ${C.border}33`, opacity: ok ? 1 : 0.5 }),
  histStrat: { fontSize:11, color:C.text, marginBottom:4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", lineHeight:1.4 },
  histMeta:  { display:"flex", gap:8, alignItems:"center", fontSize:10 },
  badge:     (ok) => ({ padding:"1px 6px", borderRadius:4, background: ok ? "#0d2818" : "#2d1212", color: ok ? C.green : C.red, border:`1px solid ${ok ? "#14532d" : "#7f1d1d"}`, fontSize:9, fontWeight:600 }),
  retVal:    (v) => ({ fontSize:11, fontWeight:700, color: v > 0 ? C.green : C.red, fontFamily:mono }),
  histDate:  { fontSize:10, color:C.muted },
  delBtn:    { background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:14, padding:"0 2px", marginLeft:"auto", lineHeight:1, opacity:0.6 },
  sideEmpty: { padding:32, textAlign:"center", fontSize:11, color:C.muted, lineHeight:1.8 },
  statsBox:  { borderTop:`1px solid ${C.border}`, padding:"12px 16px", display:"flex", flexDirection:"column", gap:6, background:"#171717" },
  statRow:   { display:"flex", justifyContent:"space-between", fontSize:10, color:C.dim },
  statVal:   { color:C.text, fontWeight:600 },
  // Main area
  main:      { flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:C.bg },
  topBar:    { padding:"12px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${C.border}44`, flexShrink:0 },
  topTitle:  { fontSize:13, color:C.text, fontWeight:600, letterSpacing:"-0.02em" },
  topSub:    { fontSize:10, color:C.dim, marginLeft:12 },
  // Toggle
  toggleWrap:{ display:"flex", alignItems:"center", gap:2, background:"#171717", borderRadius:6, padding:2, border:`1px solid ${C.border}66` },
  toggleBtn: (active) => ({ background: active ? C.cyan : "transparent", border:"none", borderRadius:4, color: active ? "#fff" : C.dim, fontFamily:mono, fontSize:10, fontWeight:700, padding:"5px 10px", cursor:"pointer", transition:"all 0.15s" }),
  // Pills
  pills:     { padding:"12px 24px 4px", display:"flex", gap:8, flexWrap:"wrap", flexShrink:0 },
  pill:      { background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, color:C.dim, fontSize:10, padding:"5px 12px", cursor:"pointer", fontFamily:mono, transition:"all 0.15s" },
  // Chat area
  chatWrap:  { flex:1, overflowY:"auto", display:"flex", flexDirection:"column" },
  chatInner: { maxWidth:820, width:"100%", margin:"0 auto", padding:"24px 24px 16px", display:"flex", flexDirection:"column", gap:0, flex:1 },
  // Messages
  msgUser:   { alignSelf:"flex-end", background:"#34373e", borderRadius:"18px 18px 4px 18px", padding:"10px 16px", maxWidth:"70%", fontSize:12, color:C.text, lineHeight:1.6, margin:"8px 0" },
  msgBot:    { alignSelf:"flex-start", width:"100%", maxWidth:820, padding:"4px 0", fontSize:12, lineHeight:1.7, color:C.text },
  msgText:   { padding:"12px 0", fontSize:12, lineHeight:1.7, color:"#d4d4d4" },
  errBox:    { background:"#2d1212", borderLeft:"3px solid #7f1d1d", borderRadius:"0 6px 6px 0", padding:"10px 14px", fontSize:11, color:C.red, marginTop:8 },
  tag:       { display:"inline-block", background:"#0d2818", border:"1px solid #14532d", borderRadius:4, padding:"2px 8px", fontSize:9, color:C.green, marginBottom:10, letterSpacing:"0.1em", fontWeight:600 },
  // Metrics grid
  mGrid:     { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:8, margin:"12px 0" },
  mCard:     { background:C.surface, border:`1px solid ${C.border}66`, borderRadius:8, padding:"10px 12px" },
  mLabel:    { fontSize:8, color:C.dim, letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:600, marginBottom:4 },
  mVal:      (pos) => ({ fontSize:18, fontWeight:700, color: pos ? C.green : C.red }),
  // Chart
  chartWrap: { margin:"12px 0", height:180, background:C.surface, borderRadius:8, padding:12, border:`1px solid ${C.border}44` },
  // Code toggle
  codeBtn:   { background:"none", border:`1px solid ${C.border}`, borderRadius:6, fontFamily:mono, fontSize:10, color:C.dim, cursor:"pointer", padding:"6px 12px", marginTop:8, transition:"all 0.15s" },
  codeBlock: { background:"#171717", border:`1px solid ${C.border}44`, borderRadius:6, padding:12, fontSize:10, color:"#8b8b8b", overflowX:"auto", marginTop:8, maxHeight:200, overflowY:"auto", whiteSpace:"pre", lineHeight:1.5 },
  // Input area
  inputWrap: { flexShrink:0, padding:"16px 24px 20px", background:`linear-gradient(transparent, ${C.bg} 20%)` },
  inputInner:{ maxWidth:820, margin:"0 auto", width:"100%" },
  inputRow:  { display:"flex", gap:10, alignItems:"flex-end", background:C.inputBg, borderRadius:12, padding:"8px 12px", border:`1px solid ${C.border}66`, boxShadow:"0 2px 12px rgba(0,0,0,0.3)" },
  textarea:  { flex:1, background:"transparent", border:"none", color:C.text, fontFamily:mono, fontSize:12, padding:"6px 4px", resize:"none", outline:"none", lineHeight:1.5, minHeight:20, maxHeight:120 },
  runBtn:    { background:C.cyan, border:"none", borderRadius:8, color:"#fff", fontFamily:mono, fontSize:11, fontWeight:700, padding:"8px 16px", cursor:"pointer", whiteSpace:"nowrap", transition:"all 0.15s", letterSpacing:"0.05em" },
  runBtnD:   { opacity:0.4, cursor:"not-allowed" },
  loader:    { display:"flex", alignItems:"center", gap:8, padding:"12px 0", fontSize:11, color:C.dim },
  // Admin login
  loginWrap:  { display:"flex", alignItems:"center", justifyContent:"center", height:"100%", background:C.bg },
  loginBox:   { background:"#171717", border:`1px solid ${C.border}`, borderRadius:12, padding:"48px 40px", width:400, boxShadow:"0 8px 32px rgba(0,0,0,0.5)" },
  loginTitle:{ fontSize:20, fontWeight:700, color:C.text, marginBottom:8, textAlign:"center" },
  loginSub:  { fontSize:11, color:C.dim, textAlign:"center", marginBottom:32 },
  loginField:{ width:"100%", background:C.inputBg, border:`1px solid ${C.border}66`, borderRadius:8, padding:"10px 14px", color:C.text, fontFamily:mono, fontSize:12, outline:"none", marginBottom:16, boxSizing:"border-box" },
  loginBtn:  { width:"100%", background:C.cyan, border:"none", borderRadius:8, color:"#fff", fontFamily:mono, fontSize:12, fontWeight:700, padding:"12px", cursor:"pointer", letterSpacing:"0.05em", transition:"all 0.15s" },
  loginErr:  { color:C.red, fontSize:10, marginBottom:12, textAlign:"center" },
  // Admin dashboard
  adminWrap: { flex:1, overflowY:"auto", padding:"24px 32px" },
  adminInner:{ maxWidth:1200, width:"100%", margin:"0 auto" },
  adminTitle:{ fontSize:20, fontWeight:700, color:C.text, marginBottom:4 },
  adminSub:  { fontSize:11, color:C.dim, marginBottom:24 },
  adminCard: { background:"#171717", border:`1px solid ${C.border}`, borderRadius:10, padding:"20px", marginBottom:20 },
  adminCardTitle:{ fontSize:14, fontWeight:700, color:C.text, marginBottom:16, display:"flex", alignItems:"center", gap:8 },
  tableWrap: { overflowX:"auto", marginTop:12 },
  table:     { width:"100%", borderCollapse:"collapse", fontSize:11, color:C.text },
  th:        { padding:"10px 12px", textAlign:"left", borderBottom:`2px solid ${C.border}`, color:C.dim, fontSize:9, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:600 },
  td:        { padding:"10px 12px", borderBottom:`1px solid ${C.border}33`, fontSize:11 },
  tdGreen:  { color:C.green, fontWeight:600 },
  tdRed:    { color:C.red, fontWeight:600 },
  tdMuted:  { color:C.dim },
  badge2:    (ok) => ({ display:"inline-block", padding:"2px 8px", borderRadius:4, background: ok ? "#0d2818" : "#2d1212", color: ok ? C.green : C.red, border:`1px solid ${ok ? "#14532d" : "#7f1d1d"}`, fontSize:9, fontWeight:600 }),
  statsGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:16, marginBottom:24 },
  statCard:  { background:"#171717", border:`1px solid ${C.border}`, borderRadius:10, padding:"20px", textAlign:"center" },
  statNum:   { fontSize:28, fontWeight:700, color:C.cyan, margin:"8px 0" },
  statLabel: { fontSize:9, color:C.dim, textTransform:"uppercase", letterSpacing:"0.12em", fontWeight:600 },
  logoutBtn: { background:"none", border:`1px solid ${C.border}`, borderRadius:6, color:C.dim, fontFamily:mono, fontSize:10, padding:"6px 14px", cursor:"pointer", transition:"all 0.15s" },
  tabWrap:   { display:"flex", gap:2, background:"#171717", borderRadius:8, padding:3, border:`1px solid ${C.border}66`, marginBottom:24, width:"fit-content" },
  tabBtn:    (active) => ({ background: active ? C.cyan : "transparent", border:"none", borderRadius:6, color: active ? "#fff" : C.dim, fontFamily:mono, fontSize:11, fontWeight:600, padding:"8px 20px", cursor:"pointer", transition:"all 0.15s" }),
  delBtn2:   { background:"none", border:`1px solid ${C.red}44`, borderRadius:4, color:C.red, fontFamily:mono, fontSize:9, padding:"4px 10px", cursor:"pointer", opacity:0.7, transition:"all 0.15s" },
};

// ─── Components ──────────────────────────────────────────────────────────────
function MCard({ label, value, raw }) {
  return (
    <div style={S.mCard}>
      <div style={S.mLabel}>{label}</div>
      <div style={S.mVal(raw >= 0)}>{value}</div>
    </div>
  );
}

function EquityChart({ data }) {
  if (!data?.length) return null;
  const base = data[0]?.value || 100000;
  const pts = data.map(d => ({ ...d, pct: +((d.value - base) / base * 100).toFixed(2) }));
  return (
    <div style={S.chartWrap}>
      <div style={{ fontSize:9, color:C.dim, marginBottom:6, letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:600 }}>Equity Curve (%)</div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={pts}>
          <XAxis dataKey="date" hide />
          <YAxis tick={{ fontSize:9, fill:C.dim }} width={38} tickFormatter={v=>`${v}%`} />
          <Tooltip contentStyle={{ background:"#171717", border:`1px solid ${C.border}`, fontSize:10, fontFamily:mono, borderRadius:6 }}
            formatter={v=>[`${v}%`,"Return"]} />
          <ReferenceLine y={0} stroke={C.border} strokeDasharray="4 4" />
          <Line type="monotone" dataKey="pct" stroke={C.cyan} dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function SolanaInstructionsDisplay({ solanaInstructions, runId }) {
  if (!solanaInstructions) return null;
  const { strategy_name, ticker, direction, action, token_in, token_out, amount_in_usd, instructions, execution_bot_prompt, risk_management, position_sizing, metadata } = solanaInstructions;

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(solanaInstructions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `solana_instructions_${runId?.slice(0,8)}_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(execution_bot_prompt || "").then(() => {
      alert("Execution prompt copied to clipboard!");
    });
  };

  return (
    <div style={{ marginTop:16, background:"linear-gradient(135deg, #1a1030, #171717)", border:`1px solid ${C.cyan}44`, borderRadius:10, padding:"16px 20px" }}>
      <div style={{ fontSize:9, color:C.cyan, letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:700, marginBottom:12, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span>🟣 Solana Execution Instructions</span>
        <span style={{ display:"flex", gap:8 }}>
          <button onClick={handleDownload} style={{ background:C.cyan, border:"none", borderRadius:4, color:"#fff", fontFamily:mono, fontSize:9, fontWeight:700, padding:"4px 10px", cursor:"pointer" }}>⬇ Download JSON</button>
          {execution_bot_prompt && <button onClick={handleCopyPrompt} style={{ background:"none", border:`1px solid ${C.cyan}`, borderRadius:4, color:C.cyan, fontFamily:mono, fontSize:9, fontWeight:700, padding:"4px 10px", cursor:"pointer" }}>📋 Copy Prompt</button>}
        </span>
      </div>

      {(strategy_name || ticker) && (
        <div style={{ display:"flex", gap:16, marginBottom:12, fontSize:10, color:C.dim }}>
          {strategy_name && <span>Strategy: <span style={{ color:C.text, fontWeight:600 }}>{strategy_name}</span></span>}
          {ticker && <span>Pair: <span style={{ color:C.text, fontWeight:600 }}>{ticker}</span></span>}
          {(direction || action) && <span>{direction} / {action}</span>}
        </div>
      )}

      {/* Token addresses */}
      {(token_in || token_out) && (
        <div style={{ marginBottom:12, fontSize:10 }}>
          <div style={{ color:C.dim, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.08em" }}>Tokens</div>
          {token_in && <div style={{ marginBottom:2 }}><span style={{ color:C.dim }}>Input: </span><span style={{ color:C.cyan, fontFamily:mono, fontSize:9 }}>{token_in}</span></div>}
          {token_out && <div style={{ marginBottom:2 }}><span style={{ color:C.dim }}>Output: </span><span style={{ color:C.cyan, fontFamily:mono, fontSize:9 }}>{token_out}</span></div>}
          {amount_in_usd && <div><span style={{ color:C.dim }}>Size: </span><span style={{ color:C.text }}>${amount_in_usd} USD</span></div>}
        </div>
      )}

      {/* Position sizing */}
      {position_sizing && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:9, color:C.dim, letterSpacing:"0.08em", marginBottom:6, textTransform:"uppercase" }}>Position Sizing</div>
          <div style={{ fontSize:11, color:C.text, background:C.surface, padding:"8px 12px", borderRadius:6, lineHeight:1.6 }}>
            Type: <span style={{ color:C.cyan }}>{position_sizing.type}</span>
            {position_sizing.usd_amount && <> &nbsp;|&nbsp; Amount: <span style={{ color:C.cyan }}>${position_sizing.usd_amount}</span></>}
            {position_sizing.description && <div style={{ fontSize:9, color:C.dim, marginTop:4 }}>{position_sizing.description}</div>}
          </div>
        </div>
      )}

      {/* Risk management */}
      {risk_management && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:9, color:C.dim, letterSpacing:"0.08em", marginBottom:6, textTransform:"uppercase", fontWeight:600 }}>Risk Management</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:6 }}>
            {risk_management.stop_loss_pct != null && (
              <div style={{ background:C.surface, padding:"6px 10px", borderRadius:6, fontSize:10 }}>
                <div style={{ color:C.dim, fontSize:8, textTransform:"uppercase", letterSpacing:"0.1em" }}>Stop Loss</div>
                <div style={{ color:C.red, fontWeight:700, fontSize:14 }}>{risk_management.stop_loss_pct}%</div>
              </div>
            )}
            {risk_management.take_profit_pct != null && (
              <div style={{ background:C.surface, padding:"6px 10px", borderRadius:6, fontSize:10 }}>
                <div style={{ color:C.dim, fontSize:8, textTransform:"uppercase", letterSpacing:"0.1em" }}>Take Profit</div>
                <div style={{ color:C.green, fontWeight:700, fontSize:14 }}>{risk_management.take_profit_pct}%</div>
              </div>
            )}
            {risk_management.max_slippage_bps != null && (
              <div style={{ background:C.surface, padding:"6px 10px", borderRadius:6, fontSize:10 }}>
                <div style={{ color:C.dim, fontSize:8, textTransform:"uppercase", letterSpacing:"0.1em" }}>Max Slippage</div>
                <div style={{ color:C.cyan, fontWeight:700, fontSize:14 }}>{risk_management.max_slippage_bps} bps</div>
              </div>
            )}
            {risk_management.max_position_usd != null && (
              <div style={{ background:C.surface, padding:"6px 10px", borderRadius:6, fontSize:10 }}>
                <div style={{ color:C.dim, fontSize:8, textTransform:"uppercase", letterSpacing:"0.1em" }}>Max Position</div>
                <div style={{ color:C.text, fontWeight:700, fontSize:14 }}>${risk_management.max_position_usd}</div>
              </div>
            )}
            {risk_management.description && <div style={{ fontSize:9, color:C.dim, marginTop:8, lineHeight:1.5, gridColumn: "1 / -1" }}>{risk_management.description}</div>}
          </div>
        </div>
      )}

      {/* Execution steps */}
      {instructions?.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:9, color:C.dim, letterSpacing:"0.08em", marginBottom:6, textTransform:"uppercase", fontWeight:600 }}>Execution Steps</div>
          {instructions.map((step, i) => (
            <div key={i} style={{ fontSize:11, color:C.text, marginBottom:8, paddingLeft:12, borderLeft:`2px solid ${C.cyan}33` }}>
              <span style={{ fontWeight:700, color:C.cyan }}>Step {step.step}:</span> {step.description}
              {step.type === "swap" && (
                <div style={{ fontSize:9, color:C.dim, marginTop:4 }}>
                  <div>Jupiter Swap: {step.method} → <span style={{ color:C.cyan }}>{step.jupiter_swap_post_url}</span></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Execution bot prompt */}
      {execution_bot_prompt && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:9, color:C.dim, letterSpacing:"0.08em", marginBottom:6, textTransform:"uppercase", fontWeight:600 }}>🤖 Bot Execution Prompt</div>
          <div style={{ background:"#0d1117", border:`1px solid ${C.border}`, borderRadius:6, padding:"10px 12px", fontSize:10, color:"#8b9d6e", fontFamily:mono, lineHeight:1.5, whiteSpace:"pre-wrap" }}>
            {execution_bot_prompt}
          </div>
        </div>
      )}

      {/* Required programs */}
      {solanaInstructions?.required_solana_programs?.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:9, color:C.dim, letterSpacing:"0.08em", marginBottom:6, textTransform:"uppercase", fontWeight:600 }}>Required Solana Programs</div>
          {solanaInstructions.required_solana_programs.map((p, i) => (
            <div key={i} style={{ fontSize:10, color:C.text, marginBottom:4, paddingLeft:12, borderLeft:`2px solid ${C.dim}33` }}>
              <span style={{ fontWeight:600 }}>{p.name}</span>
              <div style={{ fontSize:9, color:C.dim, fontFamily:mono, wordBreak:"break-all" }}>{p.address}</div>
            </div>
          ))}
        </div>
      )}

      {/* RPC endpoints */}
      {solanaInstructions?.rpc_endpoints?.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:9, color:C.dim, letterSpacing:"0.08em", marginBottom:6, textTransform:"uppercase", fontWeight:600 }}>RPC Endpoints</div>
          {solanaInstructions.rpc_endpoints.map((ep, i) => (
            <div key={i} style={{ fontSize:9, color:C.dim, fontFamily:mono, wordBreak:"break-all" }}>{ep}</div>
          ))}
        </div>
      )}

      {/* Metadata */}
      {metadata && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:9, color:C.dim, letterSpacing:"0.08em", marginBottom:6, textTransform:"uppercase", fontWeight:600 }}>Metadata</div>
          <div style={{ fontSize:10, color:C.dim, lineHeight:1.8 }}>
            {metadata.generated_at && <div>Generated: {metadata.generated_at}</div>}
            {metadata.model_used && <div>Model: <span style={{ color:C.text }}>{metadata.model_used}</span></div>}
            {metadata.backtest_metrics && (
              <div style={{ marginTop:4 }}>
                Backtest: Sharpe {metadata.backtest_metrics.sharpe_ratio} · Win Rate {(metadata.backtest_metrics.win_rate*100).toFixed(0)}% · {metadata.backtest_metrics.num_trades} trades
              </div>
            )}
            {metadata.confidence && <div>Confidence: <span style={{ color: metadata.confidence === "high" ? C.green : metadata.confidence === "medium" ? "yellow" : C.red, fontWeight:700 }}>{metadata.confidence.toUpperCase()}</span></div>}
          </div>
          {metadata.warnings?.length > 0 && (
            <div style={{ marginTop:8, background:"#2d121233", borderLeft:`3px solid ${C.red}66`, padding:"8px 12px", borderRadius:"0 6px 6px 0", fontSize:9, color:C.red, lineHeight:1.5 }}>
              {metadata.warnings.map((w,i) => <div key={i}>⚠ {w}</div>)}
            </div>
          )}
          {metadata.notes?.length > 0 && (
            <div style={{ marginTop:8, fontSize:9, color:C.dim, lineHeight:1.5 }}>
              {metadata.notes.map((n,i) => <div key={i}>📝 {n}</div>)}
            </div>
          )}
          {metadata.audit_links?.length > 0 && (
            <div style={{ marginTop:8, fontSize:9, color:C.dim }}>
              Audit: {metadata.audit_links.map((l,i) => <a key={i} href={l} target="_blank" rel="noopener" style={{ color:C.cyan }}>{l}</a>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InstructionsDisplay({ instructions }) {
  if (!instructions) return null;
  const { strategy_name, ticker, data_source, parameters, entry_rules, exit_rules, position_sizing, risk_management, execution_notes, warnings } = instructions;
  return (
    <div style={{ marginTop:16, background:"#171717", border:`1px solid ${C.border}66`, borderRadius:10, padding:"16px 20px" }}>
      <div style={{ fontSize:9, color:C.cyan, letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:700, marginBottom:12, display:"flex", alignItems:"center", gap:6 }}>
        ⚡ Trading Instructions
        {strategy_name && <span style={{ fontSize:10, color:C.text, fontWeight:400, textTransform:"none", letterSpacing:"0em" }}>{strategy_name}</span>}
      </div>

      {(ticker || data_source) && (
        <div style={{ display:"flex", gap:16, marginBottom:12, fontSize:10, color:C.dim }}>
          {ticker && <span>Ticker: <span style={{ color:C.text, fontWeight:600 }}>{ticker}</span></span>}
          {data_source && <span>Source: <span style={{ color:C.text, fontWeight:600 }}>{data_source}</span></span>}
        </div>
      )}

      {parameters && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:9, color:C.dim, letterSpacing:"0.08em", marginBottom:6, textTransform:"uppercase" }}>Parameters</div>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap", fontSize:11 }}>
            {Object.entries(parameters).map(([k,v]) => (
              <span key={k} style={{ background:C.surface, padding:"3px 8px", borderRadius:4, color:C.text }}>
                {k}: <span style={{ color:C.cyan }}>{v}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {entry_rules?.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:9, color:C.green, letterSpacing:"0.08em", marginBottom:6, textTransform:"uppercase", fontWeight:600 }}>Buy Rules</div>
          {entry_rules.map((r,i) => (
            <div key={i} style={{ fontSize:11, color:C.text, marginBottom:4, paddingLeft:12, borderLeft:`2px solid ${C.green}33` }}>
              <span style={{ fontWeight:600 }}>{r.action}</span>: {r.description}
              <div style={{ fontSize:9, color:C.dim, marginTop:2 }}>{r.condition}</div>
            </div>
          ))}
        </div>
      )}

      {exit_rules?.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:9, color:C.red, letterSpacing:"0.08em", marginBottom:6, textTransform:"uppercase", fontWeight:600 }}>Sell Rules</div>
          {exit_rules.map((r,i) => (
            <div key={i} style={{ fontSize:11, color:C.text, marginBottom:4, paddingLeft:12, borderLeft:`2px solid ${C.red}33` }}>
              <span style={{ fontWeight:600 }}>{r.action}</span>: {r.description}
              <div style={{ fontSize:9, color:C.dim, marginTop:2 }}>{r.condition}</div>
            </div>
          ))}
        </div>
      )}

      {position_sizing && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:9, color:C.dim, letterSpacing:"0.08em", marginBottom:6, textTransform:"uppercase", fontWeight:600 }}>Position Sizing</div>
          <div style={{ fontSize:11, color:C.text, background:C.surface, padding:"8px 12px", borderRadius:6, lineHeight:1.6 }}>
            Type: <span style={{ color:C.cyan }}>{position_sizing.type}</span> &nbsp;|&nbsp; Value: <span style={{ color:C.cyan }}>{position_sizing.value}</span> &nbsp;|&nbsp; Max: <span style={{ color:C.cyan }}>{position_sizing.max_position_pct}%</span>
            {position_sizing.description && <div style={{ fontSize:9, color:C.dim, marginTop:4 }}>{position_sizing.description}</div>}
          </div>
        </div>
      )}

      {risk_management && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:9, color:C.dim, letterSpacing:"0.08em", marginBottom:6, textTransform:"uppercase", fontWeight:600 }}>Risk Management</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:6 }}>
            {risk_management.stop_loss_pct != null && (
              <div style={{ background:C.surface, padding:"6px 10px", borderRadius:6, fontSize:10 }}>
                <div style={{ color:C.dim, fontSize:8, textTransform:"uppercase", letterSpacing:"0.1em" }}>Stop Loss</div>
                <div style={{ color:C.red, fontWeight:700, fontSize:14 }}>{risk_management.stop_loss_pct}%</div>
              </div>
            )}
            {risk_management.take_profit_pct != null && (
              <div style={{ background:C.surface, padding:"6px 10px", borderRadius:6, fontSize:10 }}>
                <div style={{ color:C.dim, fontSize:8, textTransform:"uppercase", letterSpacing:"0.1em" }}>Take Profit</div>
                <div style={{ color:C.green, fontWeight:700, fontSize:14 }}>{risk_management.take_profit_pct}%</div>
              </div>
            )}
            {risk_management.max_drawdown_exit != null && (
              <div style={{ background:C.surface, padding:"6px 10px", borderRadius:6, fontSize:10 }}>
                <div style={{ color:C.dim, fontSize:8, textTransform:"uppercase", letterSpacing:"0.1em" }}>Max Drawdown Exit</div>
                <div style={{ color:C.red, fontWeight:700, fontSize:14 }}>{risk_management.max_drawdown_exit}%</div>
              </div>
            )}
            {risk_management.trailing_stop_pct != null && (
              <div style={{ background:C.surface, padding:"6px 10px", borderRadius:6, fontSize:10 }}>
                <div style={{ color:C.dim, fontSize:8, textTransform:"uppercase", letterSpacing:"0.1em" }}>Trailing Stop</div>
                <div style={{ color:C.cyan, fontWeight:700, fontSize:14 }}>{risk_management.trailing_stop_pct}%</div>
              </div>
            )}
            {risk_management.sell_half_at != null && (
              <div style={{ background:C.surface, padding:"6px 10px", borderRadius:6, fontSize:10 }}>
                <div style={{ color:C.dim, fontSize:8, textTransform:"uppercase", letterSpacing:"0.1em" }}>Sell Half At</div>
                <div style={{ color:C.yellow, fontWeight:700, fontSize:14 }}>{risk_management.sell_half_at}%</div>
              </div>
            )}
          </div>
          {risk_management.description && <div style={{ fontSize:9, color:C.dim, marginTop:8, lineHeight:1.5 }}>{risk_management.description}</div>}
        </div>
      )}

      {execution_notes?.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:9, color:C.dim, letterSpacing:"0.08em", marginBottom:6, textTransform:"uppercase", fontWeight:600 }}>Execution Notes</div>
          {execution_notes.map((note,i) => (
            <div key={i} style={{ fontSize:10, color:C.dim, marginBottom:3, paddingLeft:12, position:"relative" }}>
              <span style={{ position:"absolute", left:0, color:C.cyan }}>•</span>
              {note}
            </div>
          ))}
        </div>
      )}

      {warnings?.length > 0 && (
        <div style={{ marginTop:12, background:"#2d121233", borderLeft:`3px solid ${C.red}66`, padding:"8px 12px", borderRadius:"0 6px 6px 0", fontSize:10, color:C.red, lineHeight:1.5 }}>
          <div style={{ fontWeight:700, marginBottom:4, fontSize:9, textTransform:"uppercase", letterSpacing:"0.1em" }}>Warnings</div>
          {warnings.map((w,i) => <div key={i}>• {w}</div>)}
        </div>
      )}
    </div>
  );
}

function CodeToggle({ code }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <button style={S.codeBtn} onClick={() => setShow(s => !s)}
        onMouseEnter={e=>e.target.style.background=C.hover}
        onMouseLeave={e=>e.target.style.background="none"}>
        {show ? "Hide code ↑" : "View code ↓"}
      </button>
      {show && <pre style={S.codeBlock}>{code}</pre>}
    </>
  );
}

function ResultMsg({ result, code, instructions, solanaInstructions, runId }) {
  const m   = result.metrics || {};
  const fmt = (v, pct=true) => v != null ? (pct ? `${(v*100).toFixed(2)}%` : v.toFixed(2)) : "—";
  return (
    <div style={S.msgBot}>
      <div style={S.tag}>Backtest Complete</div>
      {result.summary && <div style={{...S.msgText, color:"#b0b0b0"}}>{result.summary}</div>}
      <div style={S.mGrid}>
        <MCard label="Total Return"  value={fmt(m.total_return)}          raw={m.total_return}  />
        <MCard label="Annual Return" value={fmt(m.annual_return)}         raw={m.annual_return} />
        <MCard label="Sharpe Ratio"  value={fmt(m.sharpe_ratio, false)}   raw={m.sharpe_ratio}  />
        <MCard label="Max Drawdown"  value={fmt(m.max_drawdown)}          raw={m.max_drawdown}  />
        <MCard label="Win Rate"      value={fmt(m.win_rate)}              raw={m.win_rate-0.5}  />
        <MCard label="Trades"        value={m.num_trades ?? "—"}          raw={1}               />
        {m.profit_factor != null && <MCard label="Profit Factor" value={fmt(m.profit_factor,false)} raw={m.profit_factor-1} />}
      </div>
      <EquityChart data={result.equity_curve} />
      <InstructionsDisplay instructions={instructions} />
      <SolanaInstructionsDisplay solanaInstructions={solanaInstructions} runId={runId} />
      <CodeToggle code={code} />
    </div>
  );
}

function Spinner() {
  const frames = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(()=>setI(x=>(x+1)%10), 80); return ()=>clearInterval(t); }, []);
  return <span style={{ color:C.cyan, fontWeight:700 }}>{frames[i]}</span>;
}

const EXAMPLES_STOCKS = [
  "SMA 50/200 golden cross on SPY 2019–2024",
  "RSI(14) mean reversion AAPL: buy<30, sell>70",
  "Bollinger Band squeeze TSLA 2020–2023",
  "MACD crossover QQQ 2021–2024",
];

const EXAMPLES_CRYPTO = [
  "Momentum strategy on BTC-USD past 30 days",
  "RSI(14) mean reversion ETH-USD: buy<30, sell>70",
  "Bollinger Band squeeze BNB-USD 2023–2024",
  "MACD crossover SOL-USD 2024–2025",
];

// ─── Admin Login Screen ──────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === "admin" && password === "admin") {
      setError("");
      onLogin();
    } else {
      setError("Invalid credentials. Use admin / admin");
    }
  };

  return (
    <div style={S.loginWrap}>
      <div style={S.loginBox}>
        <div style={S.loginTitle}>🔒 Admin Panel</div>
        <div style={S.loginSub}>Enter your credentials to continue</div>
        {error && <div style={S.loginErr}>{error}</div>}
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => { setUsername(e.target.value); setError(""); }}
            style={S.loginField}
            autoFocus
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(""); }}
            style={S.loginField}
          />
          <button type="submit" style={S.loginBtn}
            onMouseEnter={e=>e.target.style.opacity=0.85}
            onMouseLeave={e=>e.target.style.opacity=1}>
            Sign In
          </button>
        </form>
        <div style={{ fontSize:9, color:C.muted, textAlign:"center", marginTop:20, lineHeight:1.6 }}>
          Default credentials:<br/>
          Username: <span style={{color:C.cyan}}>admin</span> &nbsp;
          Password: <span style={{color:C.cyan}}>admin</span>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ────────────────────────────────────────────────────────
function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState("runs");
  const [allRuns, setAllRuns] = useState([]);
  const [stats, setStats] = useState(null);
  const [runsTotal, setRunsTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [runsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/history?take=1000`),
        fetch(`${API_URL}/stats`)
      ]);
      const runsData = await runsRes.json();
      setAllRuns(runsData.items || []);
      setRunsTotal(runsData.total || 0);
      setStats(await statsRes.json());
    } catch (e) {
      console.error("Admin load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this run?")) return;
    try {
      await fetch(`${API_URL}/history/${id}`, { method:"DELETE" });
      loadData();
    } catch {}
  };

  const handleDeleteAll = async () => {
    if (!confirm("Delete ALL runs? This cannot be undone.")) return;
    for (const run of allRuns) {
      try { await fetch(`${API_URL}/history/${run.id}`, { method:"DELETE" }); } catch {}
    }
    loadData();
  };

  return (
    <div style={S.adminWrap}>
      <div style={S.adminInner}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
          <div>
            <div style={S.adminTitle}>Admin Dashboard</div>
            <div style={S.adminSub}>Manage all backtest data</div>
          </div>
          <button style={S.logoutBtn}
            onClick={onLogout}
            onMouseEnter={e=>{e.target.style.background=C.hover; e.target.style.color=C.text;}}
            onMouseLeave={e=>{e.target.style.background="none"; e.target.style.color=C.dim;}}>
            ← Back to App
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div style={S.statsGrid}>
            <div style={S.statCard}>
              <div style={S.statLabel}>Total Runs</div>
              <div style={S.statNum}>{stats.totalRuns}</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statLabel}>Success Rate</div>
              <div style={{...S.statNum, color: stats.totalRuns ? C.green : C.text, fontSize:24 }}>
                {stats.totalRuns ? Math.round(stats.successRuns/stats.totalRuns*100) : 0}%
              </div>
            </div>
            <div style={S.statCard}>
              <div style={S.statLabel}>Failed Runs</div>
              <div style={{...S.statNum, color: C.red, fontSize:24 }}>{stats.totalRuns - stats.successRuns}</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statLabel}>Best Sharpe</div>
              <div style={{...S.statNum, color: C.cyan, fontSize:24 }}>
                {stats.bestSharpe != null ? stats.bestSharpe.toFixed(2) : "—"}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={S.tabWrap}>
          <button style={S.tabBtn(activeTab === "runs")} onClick={()=>setActiveTab("runs")}>All Runs ({runsTotal})</button>
          <button style={S.tabBtn(activeTab === "stats")} onClick={()=>setActiveTab("stats")}>Statistics</button>
        </div>

        {/* Runs Table */}
        {activeTab === "runs" && (
          <div style={S.adminCard}>
            <div style={S.adminCardTitle}>
              📊 Backtest Runs
              <button style={S.delBtn2} onClick={handleDeleteAll}
                onMouseEnter={e=>e.target.style.opacity=1}
                onMouseLeave={e=>e.target.style.opacity=0.7}>
                Delete All
              </button>
            </div>
            {loading ? (
              <div style={{padding:20, textAlign:"center", color:C.dim}}><Spinner/> Loading…</div>
            ) : allRuns.length === 0 ? (
              <div style={{padding:20, textAlign:"center", color:C.dim}}>No runs found.</div>
            ) : (
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Date</th>
                      <th style={S.th}>Strategy</th>
                      <th style={S.th}>Model</th>
                      <th style={S.th}>Status</th>
                      <th style={S.th}>Return</th>
                      <th style={S.th}>Sharpe</th>
                      <th style={S.th}>Trades</th>
                      <th style={S.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRuns.map(run => {
                      const date = new Date(run.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
                      const pct = run.totalReturn != null ? `${(run.totalReturn*100).toFixed(2)}%` : "—";
                      return (
                        <tr key={run.id} style={{transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="#1a1a1a"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <td style={S.td}>{date}</td>
                          <td style={{...S.td, maxWidth:280, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}} title={run.strategy}>{run.strategy}</td>
                          <td style={{...S.td, ...S.tdMuted}}>{run.model || "—"}</td>
                          <td style={S.td}><span style={S.badge2(run.success)}>{run.success ? "OK" : "ERR"}</span></td>
                          <td style={{...S.td, fontWeight:700, color: run.totalReturn > 0 ? C.green : run.totalReturn < 0 ? C.red : C.text }}>{pct}</td>
                          <td style={{...S.td, ...S.tdMuted}}>{run.sharpeRatio?.toFixed(2) ?? "—"}</td>
                          <td style={{...S.td, ...S.tdMuted}}>{run.numTrades ?? "—"}</td>
                          <td style={S.td}>
                            <button style={S.delBtn2} onClick={()=>handleDelete(run.id)}
                              onMouseEnter={e=>e.target.style.opacity=1}
                              onMouseLeave={e=>e.target.style.opacity=0.7}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === "stats" && stats && (
          <div style={S.adminCard}>
            <div style={S.adminCardTitle}>📈 Detailed Statistics</div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))", gap:16}}>
              <div>
                <div style={{fontSize:9, color:C.dim, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12}}>Overview</div>
                <div style={{fontSize:12, lineHeight:2.2}}>
                  <div style={{display:"flex", justifyContent:"space-between"}}><span style={{color:C.dim}}>Total Runs</span><span style={{color:C.text, fontWeight:600}}>{stats.totalRuns}</span></div>
                  <div style={{display:"flex", justifyContent:"space-between"}}><span style={{color:C.dim}}>Success</span><span style={{color:C.green, fontWeight:600}}>{stats.successRuns}</span></div>
                  <div style={{display:"flex", justifyContent:"space-between"}}><span style={{color:C.dim}}>Failed</span><span style={{color:C.red, fontWeight:600}}>{stats.failedRuns}</span></div>
                  <div style={{display:"flex", justifyContent:"space-between"}}><span style={{color:C.dim}}>Success Rate</span><span style={{color:C.cyan, fontWeight:600}}>{stats.totalRuns ? Math.round(stats.successRuns/stats.totalRuns*100) : 0}%</span></div>
                </div>
              </div>
              <div>
                <div style={{fontSize:9, color:C.dim, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12}}>Best Performance</div>
                <div style={{fontSize:12, lineHeight:2.2}}>
                  <div style={{display:"flex", justifyContent:"space-between"}}><span style={{color:C.dim}}>Best Sharpe</span><span style={{color:C.cyan, fontWeight:600}}>{stats.bestSharpe?.toFixed(2) ?? "—"}</span></div>
                  <div style={{display:"flex", justifyContent:"space-between"}}><span style={{color:C.dim}}>Best Strategy</span><span style={{color:C.text, fontWeight:600, maxWidth:180, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", textAlign:"right"}} title={stats.bestStrategy}>{stats.bestStrategy ?? "—"}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────
export default function App() {
  const [messages, setMessages]   = useState([{ role:"bot", type:"text", content:"Describe a trading strategy in plain English. I'll generate the code, run the backtest, and show you the results." }]);
  const [input,    setInput]      = useState("");
  const [loading,  setLoading]    = useState(false);
  const [history,  setHistory]    = useState([]);
  const [stats,    setStats]      = useState(null);
  const [activeId, setActiveId]   = useState(null);
  const [showSide, setShowSide]   = useState(true);
  const [dataSource, setDataSource] = useState("stocks"); // "stocks" or "crypto"
  const [isAdmin,   setIsAdmin]   = useState(false);
  const bottomRef = useRef(null);

  const EXAMPLES = dataSource === "stocks" ? EXAMPLES_STOCKS : EXAMPLES_CRYPTO;

  useEffect(() => { if (!isAdmin) { loadHistory(); loadStats(); } }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  const loadHistory = useCallback(async () => {
    try { const r = await fetch(`${API_URL}/history?take=50`); setHistory((await r.json()).items || []); } catch {}
  }, []);

  const loadStats = useCallback(async () => {
    try { const r = await fetch(`${API_URL}/stats`); setStats(await r.json()); } catch {}
  }, []);

  const loadRun = async (id) => {
    setActiveId(id);
    try {
      const run = await (await fetch(`${API_URL}/history/${id}`)).json();
      const msgs = [{ role:"user", type:"text", content: run.strategy }];
      if (run.success) {
        msgs.push({ role:"bot", type:"result", code: run.code, result: {
          success:true, summary: run.summary,
          metrics: { total_return:run.totalReturn, annual_return:run.annualReturn, sharpe_ratio:run.sharpeRatio, max_drawdown:run.maxDrawdown, win_rate:run.winRate, num_trades:run.numTrades, profit_factor:run.profitFactor },
          equity_curve: run.equityCurve || [],
          trades:       run.trades      || [],
        }, instructions: run.instructions || null });
      } else {
        msgs.push({ role:"bot", type:"error", content: run.error, code: run.code });
      }
      setMessages(msgs);
    } catch(e) { console.error(e); }
  };

  const deleteRun = async (id) => {
    try {
      await fetch(`${API_URL}/history/${id}`, { method:"DELETE" });
      setHistory(h => h.filter(r => r.id !== id));
      if (activeId === id) { setActiveId(null); setMessages([{ role:"bot", type:"text", content:"Describe a trading strategy in plain English. I'll generate the code, run the backtest, and show you the results." }]); }
      loadStats();
    } catch {}
  };

  const newChat = () => {
    setMessages([{ role:"bot", type:"text", content:"Describe a trading strategy in plain English. I'll generate the code, run the backtest, and show you the results." }]);
    setInput("");
    setActiveId(null);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setActiveId(null);
    setMessages(prev => [...prev, { role:"user", type:"text", content:text }]);
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/backtest`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ strategy:text, data_source: dataSource }) });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role:"bot", type:"result", result:data.result, code:data.code, instructions: data.instructions }]);
        setActiveId(data.id);
      } else {
        setMessages(prev => [...prev, { role:"bot", type:"error", content:data.error, code:data.code }]);
      }
      loadHistory(); loadStats();
    } catch (err) {
      setMessages(prev => [...prev, { role:"bot", type:"error", content:`Connection error: ${err.message}\n\nIs the server running at ${API_URL}?` }]);
    } finally { setLoading(false); }
  };

  const onKey = (e) => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  // ── Admin Login Screen ──────────────────────────────────────────────────
  if (isAdmin === "login") {
    return <AdminLogin onLogin={() => setIsAdmin(true)} />;
  }

  // ── Admin Dashboard ──────────────────────────────────────────────────────
  if (isAdmin === true) {
    return <AdminDashboard onLogout={() => setIsAdmin(false)} />;
  }

  // ── Main Chat UI ─────────────────────────────────────────────────────────
  return (
    <div style={S.shell}>

      {/* Sidebar */}
      {showSide && (
        <div style={S.sidebar}>
          <div style={S.sideHead}>
            <span style={S.sideTitle}>History</span>
            <button style={S.newChat} onClick={newChat}>New Chat</button>
          </div>
          <div style={S.sideScroll}>
            {history.length === 0
              ? <div style={S.sideEmpty}>No runs yet.<br/>Run a strategy to start.</div>
              : history.map(item => {
                  const pct = item.totalReturn != null ? `${(item.totalReturn*100).toFixed(1)}%` : null;
                  const date = new Date(item.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric"});
                  return (
                    <div key={item.id} style={S.histItem(activeId===item.id, item.success)} onClick={()=>loadRun(item.id)}>
                      <div style={S.histStrat}>{item.strategy}</div>
                      <div style={S.histMeta}>
                        <span style={S.badge(item.success)}>{item.success?"OK":"ERR"}</span>
                        {pct && <span style={S.retVal(item.totalReturn)}>{pct}</span>}
                        <span style={S.histDate}>{date}</span>
                        <button style={S.delBtn} title="Delete" onClick={e=>{e.stopPropagation();deleteRun(item.id);}}>×</button>
                      </div>
                    </div>
                  );
                })
            }
          </div>
          {stats && (
            <div style={S.statsBox}>
              <div style={S.statRow}><span>Runs</span><span style={S.statVal}>{stats.totalRuns}</span></div>
              <div style={S.statRow}><span>Success</span><span style={{...S.statVal, color:C.green}}>{stats.totalRuns ? Math.round(stats.successRuns/stats.totalRuns*100) : 0}%</span></div>
              {stats.bestSharpe != null && <div style={S.statRow}><span>Best Sharpe</span><span style={{...S.statVal, color:C.cyan}}>{stats.bestSharpe.toFixed(2)}</span></div>}
            </div>
          )}
        </div>
      )}

      {/* Main */}
      <div style={S.main}>
        <div style={S.topBar}>
          <div style={{display:"flex", alignItems:"center", gap:8}}>
            {!showSide && (
              <button onClick={()=>setShowSide(true)} style={{background:"none",border:"none",color:C.dim,cursor:"pointer",fontSize:18,padding:4}}>☰</button>
            )}
            <span style={S.topTitle}>AlgoBacktest</span>
            <span style={S.topSub}>AI-powered strategy testing</span>
          </div>
          <div style={{display:"flex", alignItems:"center", gap:12}}>
            <div style={S.toggleWrap}>
              <button style={S.toggleBtn(dataSource === "stocks")} onClick={()=>setDataSource("stocks")}>Stocks</button>
              <button style={S.toggleBtn(dataSource === "crypto")} onClick={()=>setDataSource("crypto")}>Crypto</button>
            </div>
            <button style={{...S.logoutBtn, fontSize:10, padding:"5px 12px"}} onClick={() => setIsAdmin("login")}
              onMouseEnter={e=>{e.target.style.background=C.hover; e.target.style.color=C.text;}}
              onMouseLeave={e=>{e.target.style.background="none"; e.target.style.color=C.dim;}}>
              Admin
            </button>
            <span style={{fontSize:10,color:C.muted}}>tencent/hy3-preview · OpenRouter</span>
          </div>
        </div>

        <div style={S.pills}>
          {EXAMPLES.map((ex,i)=>(
            <button key={i} style={S.pill} onClick={()=>setInput(ex)}
              onMouseEnter={e=>{e.target.style.color=C.text;e.target.style.borderColor=C.cyan;}}
              onMouseLeave={e=>{e.target.style.color=C.dim;e.target.style.borderColor=C.border;}}>
              {ex}
            </button>
          ))}
        </div>

        <div style={S.chatWrap}>
          <div style={S.chatInner}>
            {messages.map((m,i) => {
              if (m.role==="user")   return <div key={i} style={S.msgUser}>{m.content}</div>;
              if (m.type==="result") return <ResultMsg key={i} result={m.result} code={m.code} instructions={m.instructions} />;
              if (m.type==="error")  return <div key={i} style={S.msgBot}><div style={S.errBox}>{m.content}</div>{m.code&&<CodeToggle code={m.code}/>}</div>;
              return <div key={i} style={S.msgBot}><div style={S.msgText}>{m.content}</div></div>;
            })}
            {loading && <div style={S.loader}><Spinner/> Generating and running backtest…</div>}
            <div ref={bottomRef} />
          </div>
        </div>

        <div style={S.inputWrap}>
          <div style={S.inputInner}>
            <div style={S.inputRow}>
              <textarea style={S.textarea} rows={1}
                placeholder={dataSource === "crypto" ? "Describe your crypto strategy… e.g. 'Momentum on BTC-USD past 30 days'" : "Describe your strategy… e.g. 'RSI mean reversion on QQQ 2020–2024'"}
                value={input} onChange={e=>setInput(e.target.value)} onKeyDown={onKey} />
              <button style={{...S.runBtn, ...(loading ? S.runBtnD : {})}} onClick={send} disabled={loading}>
                {loading ? "Running…" : "Run ▶"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
