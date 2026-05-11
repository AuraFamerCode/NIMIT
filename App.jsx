import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useToasts, useAPI, useLocalStorage } from "./hooks";
import { C, S, mono } from "./styles/theme";

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

const MCard = ({ label, value, raw }) => (
  <div style={S.mCard}>
    <div style={S.mLabel}>{label}</div>
    <div style={S.mVal(raw >= 0)}>{value}</div>
  </div>
);

const EquityChart = ({ data }) => {
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
          <Tooltip contentStyle={{ background:"#121215", border:`1px solid ${C.border}`, fontSize:10, fontFamily:mono, borderRadius:6 }}
            formatter={v=>[`${v}%`,"Return"]} />
          <ReferenceLine y={0} stroke={C.border} strokeDasharray="4 4" />
          <Line type="monotone" dataKey="pct" stroke={C.cyan} dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const SolanaInstructionsDisplay = ({ solanaInstructions, runId }) => {
  const { success } = useToasts();
  if (!solanaInstructions) return null;
  const { strategy_name, ticker, direction, action, token_in, token_out, amount_in_usd, instructions, execution_bot_prompt, risk_management, position_sizing, metadata } = solanaInstructions;

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(solanaInstructions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `solana_instructions_${runId?.slice(0,8)}_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(execution_bot_prompt || "").then(() => {
      success("Execution prompt copied!");
    });
  };

  return (
    <div style={{ marginTop:16, background:"linear-gradient(135deg, #161030, #121215)", border:`1px solid ${C.cyan}33`, borderRadius:10, padding:"16px 20px" }}>
      <div style={{ fontSize:9, color:C.cyan, letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:700, marginBottom:12, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span>🟣 Solana Execution Instructions</span>
        <span style={{ display:"flex", gap:8 }}>
          <button onClick={handleDownload} style={{ background:C.cyan, border:"none", borderRadius:4, color:"#111", fontFamily:mono, fontSize:9, fontWeight:700, padding:"4px 10px", cursor:"pointer" }}>⬇ Download</button>
          {execution_bot_prompt && <button onClick={handleCopyPrompt} style={{ background:"none", border:`1px solid ${C.cyan}`, borderRadius:4, color:C.cyan, fontFamily:mono, fontSize:9, fontWeight:700, padding:"4px 10px", cursor:"pointer" }}>📋 Copy</button>}
        </span>
      </div>
      {(strategy_name || ticker) && (
        <div style={{ display:"flex", gap:16, marginBottom:12, fontSize:10, color:C.dim }}>
          {strategy_name && <span>Strategy: <span style={{ color:C.text, fontWeight:600 }}>{strategy_name}</span></span>}
          {ticker && <span>Pair: <span style={{ color:C.text, fontWeight:600 }}>{ticker}</span></span>}
          {(direction || action) && <span>{direction} / {action}</span>}
        </div>
      )}
      {(token_in || token_out) && (
        <div style={{ marginBottom:12, fontSize:10 }}>
          <div style={{ color:C.dim, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.08em" }}>Tokens</div>
          {token_in && <div style={{ marginBottom:2 }}><span style={{ color:C.dim }}>Input: </span><span style={{ color:C.cyan, fontFamily:mono, fontSize:9 }}>{token_in}</span></div>}
          {token_out && <div style={{ marginBottom:2 }}><span style={{ color:C.dim }}>Output: </span><span style={{ color:C.cyan, fontFamily:mono, fontSize:9 }}>{token_out}</span></div>}
          {amount_in_usd && <div><span style={{ color:C.dim }}>Size: </span><span style={{ color:C.text }}>${amount_in_usd} USD</span></div>}
        </div>
      )}
      {position_sizing && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:9, color:C.dim, letterSpacing:"0.08em", marginBottom:6, textTransform:"uppercase" }}>Position Sizing</div>
          <div style={{ fontSize:11, color:C.text, background:C.surface, padding:"8px 12px", borderRadius:6, lineHeight:1.6 }}>
            Type: <span style={{ color:C.cyan }}>{position_sizing.type}</span>
            {position_sizing.usd_amount && <> &nbsp;|&nbsp; ${position_sizing.usd_amount}</>}
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
      {instructions?.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:9, color:C.dim, letterSpacing:"0.08em", marginBottom:6, textTransform:"uppercase", fontWeight:600 }}>Execution Steps</div>
          {instructions.map((step, i) => (
            <div key={i} style={{ fontSize:11, color:C.text, marginBottom:8, paddingLeft:12, borderLeft:`2px solid ${C.cyan}33` }}>
              <span style={{ fontWeight:700, color:C.cyan }}>Step {step.step}:</span> {step.description}
              {step.type === "swap" && (
                <div style={{ fontSize:9, color:C.dim, marginTop:4 }}>
                  Jupiter: {step.method} → <span style={{ color:C.cyan }}>{step.jupiter_swap_post_url}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {execution_bot_prompt && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:9, color:C.dim, letterSpacing:"0.08em", marginBottom:6, textTransform:"uppercase", fontWeight:600 }}>🤖 Bot Execution Prompt</div>
          <div style={{ background:"#0d1117", border:`1px solid ${C.border}`, borderRadius:6, padding:"10px 12px", fontSize:10, color:"#8b9d6e", fontFamily:mono, lineHeight:1.5, whiteSpace:"pre-wrap" }}>
            {execution_bot_prompt}
          </div>
        </div>
      )}
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
        </div>
      )}
    </div>
  );
};

const InstructionsDisplay = ({ instructions }) => {
  if (!instructions) return null;
  const { strategy_name, ticker, data_source, parameters, entry_rules, exit_rules, position_sizing, risk_management, execution_notes, warnings } = instructions;
  return (
    <div style={{ marginTop:16, background:"#121215", border:`1px solid ${C.border}55`, borderRadius:10, padding:"16px 20px" }}>
      <div style={{ fontSize:9, color:C.cyan, letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:700, marginBottom:12 }}>
        ⚡ Trading Instructions
        {strategy_name && <span style={{ fontSize:10, color:C.text, fontWeight:400, textTransform:"none", letterSpacing:"0em" }}> — {strategy_name}</span>}
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
          <div style={{ fontSize:9, color:C.green, letterSpacing:"0.08em", marginBottom:6, textTransform:"uppercase", fontWeight:600 }}>🟢 Buy Rules</div>
          {entry_rules.map((r,i) => (
            <div key={i} style={{ fontSize:11, color:C.text, marginBottom:4, paddingLeft:12, borderLeft:`2px solid ${C.green}33` }}>
              <span style={{ fontWeight:600 }}>{r.action}:</span> {r.description}
              <div style={{ fontSize:9, color:C.dim, marginTop:2 }}>{r.condition}</div>
            </div>
          ))}
        </div>
      )}
      {exit_rules?.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:9, color:C.red, letterSpacing:"0.08em", marginBottom:6, textTransform:"uppercase", fontWeight:600 }}>🔴 Sell Rules</div>
          {exit_rules.map((r,i) => (
            <div key={i} style={{ fontSize:11, color:C.text, marginBottom:4, paddingLeft:12, borderLeft:`2px solid ${C.red}33` }}>
              <span style={{ fontWeight:600 }}>{r.action}:</span> {r.description}
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
                <div style={{ color:"yellow", fontWeight:700, fontSize:14 }}>{risk_management.sell_half_at}%</div>
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
          <div style={{ fontWeight:700, marginBottom:4, fontSize:9, textTransform:"uppercase", letterSpacing:"0.1em" }}>⚠ Warnings</div>
          {warnings.map((w,i) => <div key={i}>• {w}</div>)}
        </div>
      )}
    </div>
  );
};

const CodeToggle = ({ code }) => {
  const [show, setShow] = useState(false);
  return (
    <>
      <button style={S.codeBtn} onClick={() => setShow(s => !s)}
        onMouseEnter={e=>e.target.style.background=C.hover}
        onMouseLeave={e=>e.target.style.background="none"}>
        {show ? "▲ Hide code" : "▼ View code"}
      </button>
      {show && <pre style={S.codeBlock}>{code}</pre>}
    </>
  );
};

const ResultMsg = ({ result, code, instructions, solanaInstructions, runId }) => {
  const m = result.metrics || {};
  const fmt = (v, pct=true) => v != null ? (pct ? `${(v*100).toFixed(2)}%` : v.toFixed(2)) : "—";
  const pos = (v) => v != null ? (v > 0 ? "pos" : v < 0 ? "neg" : "zero") : "zero";
  return (
    <div style={S.msgBot}>
      <div style={S.tag}>Backtest Complete ✓</div>
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
};

const Spinner = () => {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(()=>setI(x=>(x+1)%10), 80); return ()=>clearInterval(t); }, []);
  const frames = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];
  return <span style={{ color:C.cyan, fontWeight:700 }}>{frames[i]}</span>;
};

function AdminLoginScreen({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    setErr("");
    if (username === "admin" && password === "admin") {
      onSuccess();
    } else {
      setErr("Invalid credentials. Use admin / admin");
    }
  };

  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:C.bg,flexDirection:"column"}}>
      <div style={{background:"#121215",border:`1px solid ${C.border}`,borderRadius:12,padding:"48px 40px",width:400}}>
        <div style={{fontSize:20,fontWeight:700,color:C.text,marginBottom:8,textAlign:"center"}}>🔒 Admin Panel</div>
        <div style={{fontSize:11,color:C.dim,textAlign:"center",marginBottom:32}}>Restricted access</div>
        {err && <div style={{color:C.red,fontSize:10,marginBottom:12,textAlign:"center"}}>{err}</div>}
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} style={{width:"100%",background:C.inputBg,border:`1px solid ${C.border}55`,borderRadius:8,padding:"10px 14px",color:C.text,fontFamily:mono,fontSize:12,outline:"none",marginBottom:16,boxSizing:"border-box"}} />
          <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} style={{width:"100%",background:C.inputBg,border:`1px solid ${C.border}55`,borderRadius:8,padding:"10px 14px",color:C.text,fontFamily:mono,fontSize:12,outline:"none",marginBottom:16,boxSizing:"border-box"}} />
          <button type="submit" style={{width:"100%",background:`linear-gradient(135deg, ${C.cyan}, #00b894)`,border:"none",borderRadius:8,color:"#111",fontFamily:mono,fontSize:12,fontWeight:700,padding:"12px",cursor:"pointer",letterSpacing:"0.06em",transition:"all 0.15s"}}>Sign In</button>
        </form>
        <div style={{fontSize:9,color:C.muted,textAlign:"center",marginTop:20,lineHeight:1.6}}>Default: admin / admin</div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────
function Sidebar({ history, stats, activeId, onSelect, onDelete, newChat }) {
  const EXAMPLES = [
    "SMA 50/200 golden cross on SPY 2019–2024",
    "RSI(14) mean reversion AAPL: buy<30, sell>70",
    "Bollinger Band squeeze TSLA 2020–2023",
    "MACD crossover QQQ 2021–2024",
  ];

  return (
    <div style={S.sidebar}>
      <div style={S.sideHead}>
        <span style={S.sideTitle}>History</span>
        <button style={S.newChat} onClick={newChat}>+ New</button>
      </div>
      <div style={S.sideScroll}>
        {history.length === 0 && (
          <div style={S.sideEmpty}>No runs yet.<br/>Describe a strategy to begin.</div>
        )}
        {history.map(item => {
          const pct = item.totalReturn != null ? `${(item.totalReturn*100).toFixed(1)}%` : null;
          const date = new Date(item.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric"});
          return (
            <div key={item.id} style={S.histItem(activeId===item.id, item.success)} onClick={()=>onSelect(item.id)}>
              <div style={S.histStrat}>{item.strategy}</div>
              <div style={S.histMeta}>
                <span style={S.badge(item.success)}>{item.success?"OK":"ERR"}</span>
                {pct && <span style={S.retVal(item.totalReturn)}>{pct}</span>}
                <span style={S.histDate}>{date}</span>
                <button style={S.delBtn} title="Delete" onClick={e=>{e.stopPropagation();onDelete(item.id);}}>×</button>
              </div>
            </div>
          );
        })}
      </div>
      {stats && (
        <div style={S.statsBox}>
          <div style={S.statRow}><span>Runs</span><span style={S.statVal}>{stats.totalRuns}</span></div>
          <div style={S.statRow}><span>Success</span><span style={{...S.statVal, color:C.green}}>{stats.successRate}%</span></div>
          {stats.bestSharpe != null && <div style={S.statRow}><span>Best Sharpe</span><span style={{...S.statVal, color:C.cyan}}>{stats.bestSharpe.toFixed(2)}</span></div>}
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────
export default function App() {
  const [messages, setMessages]   = useState([{ role:"bot", type:"text", content:"Describe a trading strategy in plain English. I'll generate the code, run the backtest, and show you the results." }]);
  const [input,    setInput]      = useState("");
  const [loading,  setLoading]    = useState(false);
  const [history,  setHistory]    = useLocalStorage("ab_history", []);
  const [stats,    setStats]      = useState(null);
  const [activeId, setActiveId]   = useState(null);
  const [showSide, setShowSide]   = useState(true);
  const [dataSource, setDataSource] = useState("stocks");
  const [isAdmin,   setIsAdmin]   = useState(false);
  const bottomRef = useRef(null);

  const { success, error, info } = useToasts();
  const { get, post, loading: apiLoading } = useAPI();

  const EXAMPLES = dataSource === "stocks" ? EXAMPLES_STOCKS : EXAMPLES_CRYPTO;

  useEffect(() => { if (!isAdmin) { loadHistory(); loadStats(); } }, []); // eslint-disable-line
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  const loadHistory = useCallback(async () => {
    try {
      const r = await get("/api/v1/history?take=50");
      setHistory(r.items || []);
    } catch(e) {
      info("Could not load history: " + e.message);
    }
  }, [get, info]);

  const loadStats = useCallback(async () => {
    try {
      const r = await get("/api/v1/stats");
      setStats(r);
    } catch(e) {
      info("Could not load stats: " + e.message);
    }
  }, [get, info]);

  const loadRun = async (id) => {
    setActiveId(id);
    try {
      const run = await get(`/api/v1/history/${id}`);
      const msgs = [{ role:"user", type:"text", content: run.strategy }];
      if (run.success) {
        msgs.push({ role:"bot", type:"result", code: run.code, result: {
          success:true, summary: run.summary,
          metrics: { total_return:run.totalReturn, annual_return:run.annualReturn, sharpe_ratio:run.sharpeRatio, max_drawdown:run.maxDrawdown, win_rate:run.winRate, num_trades:run.numTrades, profit_factor:run.profitFactor },
          equity_curve: run.equityCurve || [],
          trades:       run.trades      || [],
        }, instructions: run.instructions || null, solanaInstructions: run.solanaInstructions || null, runId: run.id });
        success("Loaded run: " + run.strategy.slice(0,50));
      } else {
        msgs.push({ role:"bot", type:"error", content: run.error, code: run.code });
      }
      setMessages(msgs);
    } catch(e) {
      error("Failed to load run: " + e.message);
    }
  };

  const deleteRun = async (id) => {
    if (!window.confirm("Delete this run?")) return;
    try {
      await get(`/api/v1/history/${id}`, { method:"DELETE" });
      setHistory(h => h.filter(r => r.id !== id));
      if (activeId === id) { setActiveId(null); setMessages([{ role:"bot", type:"text", content:"Describe a trading strategy in plain English." }]); }
      loadStats();
      info("Run deleted");
    } catch(e) {
      error("Delete failed: " + e.message);
    }
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
      const data = await post("/api/v1/backtest", { strategy:text, data_source: dataSource });
      if (data.success) {
        setMessages(prev => [...prev, { role:"bot", type:"result", result:data.result, code:data.code, instructions: data.instructions, solanaInstructions: data.solana_instructions, runId: data.id }]);
        setActiveId(data.id);
        success("Backtest complete! Return: " + (data.result?.metrics?.total_return * 100).toFixed(1) + "%");
      } else {
        setMessages(prev => [...prev, { role:"bot", type:"error", content:data.error, code:data.code }]);
        error(data.error || "Backtest failed");
      }
      loadHistory(); loadStats();
    } catch (err) {
      const msg = `Connection error: ${err.message}\n\nIs the server running at localhost:8000?`;
      setMessages(prev => [...prev, { role:"bot", type:"error", content: msg }]);
      error(msg);
    } finally { setLoading(false); }
  };

  const onKey = (e) => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  // ── Admin Login Screen ──────────────────────────────────────────
  if (isAdmin === "login") {
    return <AdminLoginScreen onSuccess={() => setIsAdmin(true)} />;
  }

  // ── Admin Dashboard ──────────────────────────────────────
  if (isAdmin === true) {
    return <AdminDashboard onLogout={() => setIsAdmin(false)} />;
  }

  // ── Main Chat UI ─────────────────────────────────────────
  return (
    <div style={S.shell}>
      {showSide && (
        <div style={S.sidebar}>
          <div style={S.sideHead}>
            <span style={S.sideTitle}>History</span>
            <button style={S.newChat} onClick={newChat}>+ New</button>
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
              <div style={S.statRow}><span>Success</span><span style={{...S.statVal, color:C.green}}>{stats.successRate}%</span></div>
              {stats.bestSharpe != null && <div style={S.statRow}><span>Best Sharpe</span><span style={{...S.statVal, color:C.cyan}}>{stats.bestSharpe.toFixed(2)}</span></div>}
            </div>
          )}
        </div>
      )}

      <div style={S.main}>
        <div style={S.topBar}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {!showSide && (
              <button onClick={()=>setShowSide(true)} style={{background:"none",border:"none",color:C.dim,cursor:"pointer",fontSize:18,padding:4}}>☰</button>
            )}
            <Link
              to="/"
              style={{ color: C.dim, fontSize: 10, textDecoration: "none", letterSpacing: "0.06em", flexShrink: 0 }}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.text; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = C.dim; }}
            >
              ← Home
            </Link>
            <span style={S.topTitle}>
              ⚡ AlgoBacktest
              <span style={S.topSub}>AI-Powered Strategy Testing</span>
            </span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={S.toggleWrap}>
              <button style={S.toggleBtn(dataSource === "stocks")} onClick={()=>setDataSource("stocks")}>📈 Stocks</button>
              <button style={S.toggleBtn(dataSource === "crypto")} onClick={()=>setDataSource("crypto")}>🪙 Crypto</button>
            </div>
            <button style={{...S.logoutBtn,fontSize:10,padding:"5px 12px"}} onClick={()=>setIsAdmin("login")}
              onMouseEnter={e=>{e.target.style.background=C.hover;e.target.style.color=C.text;}}
              onMouseLeave={e=>{e.target.style.background="none";e.target.style.color=C.dim;}}>
              Admin
            </button>
            <span style={{fontSize:9,color:C.dim,opacity:0.6}}>inclusionai/ring-2.6-1t · OpenRouter</span>
          </div>
        </div>

        <div style={S.pills}>
          {EXAMPLES.map((ex,i) => (
            <button key={i} style={S.pill} onClick={()=>setInput(ex)}
              onMouseEnter={e=>{e.target.style.color=C.text;e.target.style.borderColor=C.cyan;e.target.style.background=C.surface2;}}
              onMouseLeave={e=>{e.target.style.color=C.dim;e.target.style.borderColor=C.border;e.target.style.background=C.surface;}}>
              {ex}
            </button>
          ))}
        </div>

        <div style={S.chatWrap}>
          <div style={S.chatInner}>
            {messages.map((m,i) => {
              if (m.role==="user") return <div key={i} style={S.msgUser}>{m.content}</div>;
              if (m.type==="result") return <ResultMsg key={i} result={m.result} code={m.code} instructions={m.instructions} solanaInstructions={m.solanaInstructions} runId={m.runId} />;
              if (m.type==="error") return <div key={i} style={S.msgBot}><div style={S.errBox}>{m.content}</div>{m.code && <CodeToggle code={m.code}/>}</div>;
              return <div key={i} style={S.msgBot}><div style={S.msgText}>{m.content}</div></div>;
            })}
            {(loading || apiLoading) && (
              <div style={S.loader}><Spinner/> {loading ? "Generating and running backtest…" : "Loading…"}</div>
            )}
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
                {loading ? "Running…" : "▶ Run Backtest"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────
function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState("runs");
  const [allRuns, setAllRuns] = useState([]);
  const [stats, setStats]   = useState(null);
  const [runsTotal, setRunsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const { get } = useAPI();
  const { success, error, info } = useToasts();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const runsRes = await get("/api/v1/history?take=1000");
      const statsRes = await get("/api/v1/stats");
      setAllRuns(runsRes.items || []);
      setRunsTotal(runsRes.total || 0);
      setStats(statsRes);
    } catch(e) {
      error("Failed to load admin data: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [get, error]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this run?")) return;
    try {
      await get(`/api/v1/history/${id}`, { method: "DELETE" });
      setAllRuns(h => h.filter(r => r.id !== id));
      info("Run deleted");
      loadStats();
    } catch(e) {
      error("Delete failed: " + e.message);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Delete ALL runs? This cannot be undone.")) return;
    try {
      await get("/api/v1/admin/runs", { method:"DELETE" });
      setAllRuns([]);
      setStats(null);
      success("All runs deleted");
      loadData();
    } catch(e) {
      error("Delete all failed: " + e.message);
    }
  };

  const loadStats = useCallback(async () => {
    try {
      const r = await get("/api/v1/stats");
      setStats(r);
    } catch(e) {}
  }, [get]);

  return (
    <div style={S.shell}>
      <div style={S.adminWrap}>
        <div style={S.adminInner}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
            <div>
              <div style={S.adminTitle}>Admin Dashboard</div>
              <div style={S.adminSub}>Manage all backtest data</div>
            </div>
            <button style={S.logoutBtn} onClick={onLogout}
              onMouseEnter={e=>{e.target.style.background=C.hover;e.target.style.color=C.text;}}
              onMouseLeave={e=>{e.target.style.background="none";e.target.style.color=C.dim;}}>
              ← Back to App
            </button>
          </div>

          {stats && (
            <div style={S.statsGrid}>
              <div style={S.statCard}>
                <div style={S.statLabel}>Total Runs</div>
                <div style={S.statNum}>{stats.totalRuns}</div>
              </div>
              <div style={S.statCard}>
                <div style={S.statLabel}>Success Rate</div>
                <div style={{...S.statNum, color: stats.totalRuns ? C.green : C.text, fontSize:24}}>
                  {stats.totalRuns ? Math.round(stats.successRate) + "%" : 0}%
                </div>
              </div>
              <div style={S.statCard}>
                <div style={S.statLabel}>Failed Runs</div>
                <div style={{...S.statNum, color:C.red, fontSize:24}}>{stats.failedRuns}</div>
              </div>
              <div style={S.statCard}>
                <div style={S.statLabel}>Best Sharpe</div>
                <div style={{...S.statNum, color:C.cyan, fontSize:24}}>
                  {stats.bestSharpe != null ? stats.bestSharpe.toFixed(2) : "—"}
                </div>
              </div>
            </div>
          )}

          <div style={S.tabWrap}>
            <button style={S.tabBtn(activeTab === "runs")} onClick={()=>setActiveTab("runs")}>All Runs ({runsTotal})</button>
            <button style={S.tabBtn(activeTab === "stats")} onClick={()=>setActiveTab("stats")}>Statistics</button>
          </div>

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
                <div style={{padding:40,textAlign:"center",color:C.dim}}>
                  <div style={{fontSize:24,marginBottom:8}}>⏳</div>
                  Loading…
                </div>
              ) : allRuns.length === 0 ? (
                <div style={{padding:40,textAlign:"center",color:C.dim}}>No runs found.</div>
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
                        <th style={S.th}>Solana</th>
                        <th style={S.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allRuns.map(run => {
                        const date = new Date(run.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
                        const pct = run.totalReturn != null ? `${(run.totalReturn*100).toFixed(2)}%` : "—";
                        return (
                          <tr key={run.id} style={{transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="#1a1a1e"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                            <td style={S.td}>{date}</td>
                            <td style={{...S.td, maxWidth:280, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}} title={run.strategy}>{run.strategy}</td>
                            <td style={{...S.td, ...S.tdMuted}}>{run.model || "—"}</td>
                            <td style={S.td}><span style={S.badge2(run.success)}>{run.success ? "OK" : "ERR"}</span></td>
                            <td style={{...S.td, fontWeight:700, color: run.totalReturn > 0 ? C.green : run.totalReturn < 0 ? C.red : C.text }}>{pct}</td>
                            <td style={{...S.td, ...S.tdMuted}}>{run.sharpeRatio?.toFixed(2) ?? "—"}</td>
                            <td style={{...S.td, ...S.tdMuted}}>{run.numTrades ?? "—"}</td>
                            <td style={S.td}>
                              {run.success ? (
                                <button style={S.delBtn2} onClick={()=>{
                                  const blob = new Blob([JSON.stringify(run.solanaInstructions||{})], {type:"application/json"});
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href=url; a.download=`solana_${run.id.slice(0,8)}.json`;
                                  document.body.appendChild(a); a.click();
                                  document.body.removeChild(a); URL.revokeObjectURL(url);
                                  success("Solana instructions downloaded");
                                }} onMouseEnter={e=>{e.target.style.opacity=1;e.target.style.borderColor=C.cyan;}}
                                  onMouseLeave={e=>{e.target.style.opacity=0.7;e.target.style.borderColor=`${C.red}44`;}}>
                                  ↓ JSON
                                </button>
                              ) : "—"}
                            </td>
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

          {activeTab === "stats" && stats && (
            <div style={S.adminCard}>
              <div style={S.adminCardTitle}>📈 Detailed Statistics</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:16}}>
                <div>
                  <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>Overview</div>
                  <div style={{fontSize:12,lineHeight:2.2}}>
                    <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.dim}}>Total Runs</span><span style={{color:C.text,fontWeight:600}}>{stats.totalRuns}</span></div>
                    <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.dim}}>Success</span><span style={{color:C.green,fontWeight:600}}>{stats.successRuns}</span></div>
                    <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.dim}}>Failed</span><span style={{color:C.red,fontWeight:600}}>{stats.failedRuns}</span></div>
                    <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.dim}}>Success Rate</span><span style={{color:C.cyan,fontWeight:600}}>{stats.successRate}%</span></div>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>Best Performance</div>
                  <div style={{fontSize:12,lineHeight:2.2}}>
                    <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.dim}}>Best Sharpe</span><span style={{color:C.cyan,fontWeight:600}}>{stats.bestSharpe?.toFixed(2) ?? "—"}</span></div>
                    <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.dim}}>Best Strategy</span><span style={{color:C.text,fontWeight:600,maxWidth:180,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",textAlign:"right"}} title={stats.bestStrategy}>{stats.bestStrategy ?? "—"}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}