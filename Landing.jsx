import { Link } from "react-router-dom";

/**
 * Marketing landing (from `code (1).html`).
 * App lives at /app.
 */
export default function Landing() {
  return (
    <div className="dark landing-grid-bg min-h-screen bg-background font-body text-on-surface selection:bg-secondary selection:text-on-secondary">
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#131313]/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="font-headline text-2xl font-bold tracking-tighter text-white">
            YuktiAI
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a className="font-headline tracking-tight text-white/70 transition-colors duration-100 hover:text-[#14F195]" href="#features">
              Features
            </a>
            <a className="font-headline tracking-tight text-white/70 transition-colors duration-100 hover:text-[#14F195]" href="#how">
              How It Works
            </a>
            <a className="font-headline tracking-tight text-white/70 transition-colors duration-100 hover:text-[#14F195]" href="#pricing">
              Pricing
            </a>
            <a className="font-headline tracking-tight text-white/70 transition-colors duration-100 hover:text-[#14F195]" href="#docs">
              Docs
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/app"
              className="hidden font-headline text-sm font-semibold text-secondary hover:text-white sm:inline"
            >
              Open app
            </Link>
            <button
              type="button"
              className="scale-95 bg-[#9945FF] px-6 py-2 font-headline font-bold text-white transition-transform active:scale-90"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </nav>

      <main className="relative overflow-hidden pt-24">
        <div className="kinetic-glow-purple absolute -left-20 top-0 -z-10 h-[500px] w-[500px]" />
        <div className="kinetic-glow-green absolute -right-20 top-40 -z-10 h-[600px] w-[600px]" />

        <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-32 pt-20 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 border border-outline-variant/30 bg-surface-container-high px-3 py-1 font-headline text-xs uppercase tracking-widest text-secondary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
              </span>
              Solana Mainnet Live
            </div>
            <h1 className="font-headline text-6xl font-bold leading-[0.95] tracking-tighter text-white md:text-7xl">
              Build Trading Strategies at the <span className="text-primary-container">Speed of Light.</span>
            </h1>
            <p className="max-w-xl text-xl leading-relaxed text-on-surface-variant">
              Harness the power of AI to synthesize, backtest, and deploy high-frequency trading strategies on Solana in seconds, not weeks.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                to="/app"
                className="bg-secondary-container px-8 py-4 font-headline text-lg font-bold text-on-secondary-container transition-all hover:shadow-[0_0_20px_rgba(0,236,145,0.4)] active:scale-95"
              >
                Get Started Free
              </Link>
              <a
                href="#features"
                className="border-2 border-outline-variant/30 px-8 py-4 font-headline text-lg font-bold text-white transition-all hover:bg-white/5 active:scale-95"
              >
                View Live Demo
              </a>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-container to-secondary-container opacity-20 blur-xl transition-opacity group-hover:opacity-30" />
            <div className="relative p-1 glass-panel">
              <div className="space-y-6 bg-surface-container-lowest p-6">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-error/40" />
                    <div className="h-3 w-3 rounded-full bg-secondary/40" />
                    <div className="h-3 w-3 rounded-full bg-primary/40" />
                  </div>
                  <span className="font-headline text-[10px] uppercase tracking-widest text-outline">yukti_engine_v1.0.4</span>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <span className="font-headline text-secondary">Prompt &gt;</span>
                    <p className="text-sm italic text-white">
                      &quot;Create a mean-reversion strategy for SOL/USDC using 5m timeframe with 2x leverage.&quot;
                    </p>
                  </div>
                  <div className="border-l-2 border-primary-container bg-surface-container p-4">
                    <div className="mb-4 flex items-start justify-between">
                      <h4 className="font-headline text-xs uppercase text-primary">Strategy Synthesized</h4>
                      <span className="text-[10px] text-outline">Confidence: 98.4%</span>
                    </div>
                    <div className="flex h-32 w-full items-end gap-1">
                      <div className="h-1/2 w-full bg-secondary/20" />
                      <div className="h-3/4 w-full bg-secondary/30" />
                      <div className="h-2/3 w-full bg-secondary/40" />
                      <div className="h-full w-full border-t-2 border-secondary bg-secondary/60" />
                      <div className="h-1/2 w-full border-t-2 border-error bg-error/40" />
                      <div className="h-1/4 w-full bg-secondary/20" />
                      <div className="h-5/6 w-full border-t-2 border-secondary bg-secondary/50" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="border border-outline-variant/10 p-2">
                      <div className="text-[10px] uppercase text-outline">APY Est.</div>
                      <div className="font-headline font-bold text-secondary">142%</div>
                    </div>
                    <div className="border border-outline-variant/10 p-2">
                      <div className="text-[10px] uppercase text-outline">Drawdown</div>
                      <div className="font-headline font-bold text-error">4.2%</div>
                    </div>
                    <div className="border border-outline-variant/10 p-2">
                      <div className="text-[10px] uppercase text-outline">Sharpe</div>
                      <div className="font-headline font-bold text-primary">3.1</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-16 flex flex-col items-end justify-between gap-6 md:flex-row">
            <div className="max-w-2xl">
              <h2 className="mb-4 font-headline text-xs font-bold uppercase tracking-[0.3em] text-secondary">The Engine</h2>
              <h3 className="font-headline text-4xl font-bold leading-tight text-white md:text-5xl">Advanced tools for the high-frequency era.</h3>
            </div>
            <p className="max-w-sm text-on-surface-variant md:text-right">Precision-engineered modules designed to maximize alpha in the most competitive environments.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-12">
            <div className="group relative overflow-hidden glass-panel p-8 md:col-span-8">
              <div className="absolute -bottom-20 -right-20 h-64 w-64 bg-primary-container/10 blur-[100px] transition-all group-hover:bg-primary-container/20" />
              <span className="material-symbols-outlined mb-6 text-4xl text-primary-container">psychology</span>
              <h4 className="mb-4 font-headline text-2xl font-bold text-white">AI Strategy Engine</h4>
              <p className="mb-8 max-w-md leading-relaxed text-on-surface-variant">
                Natural language processing meets quantitative finance. Describe your market thesis and watch YuktiAI convert it into executable Rust code for Solana programs.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <img
                  className="h-48 w-full object-cover grayscale transition-all duration-500 hover:grayscale-0"
                  alt="Neural networks and data streams"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkKDzjh9XL9CNnpTSmDFYdn7EgD7texRDTQ9OdjXuxGkbCa38xMamyieS7MeaPGt1pD-9Jv20XcMDt7Y4OfT3QhppI0rFypAib2o6f5aV3tzX8hcPguFQyUDySfFsUuSSWGZhGZHvcXk2V0USyDK5A4PzS5Ar9_Klk-wS_G_UWHo-Yym-fua24crgU0UL5RRj7S1XteeFA_HEgP9Z_wa1Kyw06lmWD-B_6ntN5I_2od-p7R466Mpv6OSZkF3YaBIIQJqYxz35s2IM"
                />
                <img
                  className="h-48 w-full object-cover grayscale transition-all duration-500 hover:grayscale-0"
                  alt="Blockchain data structures"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEzgFBfnYGF4ghWN_LjHn7tDd-kf_vZOlmuiVX6FBPta7hIi6W6Qz0aCSU0-Mp3JjMUL9zhq5957acm2gnhxNaisaDquGqot7n37fqjFJmIA8eBB2Ub27wx9hwsQmE6UeTpvwMi-miOg_Ujyg_69UkRmQe3MqjZuwyiasAhjfQzl2c2qTOawey5Q3yWBlgOa64yD9Y-frWl39PQBA6Cz-LUd4xQvsPSc12PGKfLkAqAhz1UhBkr-BWwALU5A__r5nG-172CsKiGIg"
                />
              </div>
            </div>
            <div className="glass-panel p-8 transition-colors hover:bg-surface-container-high md:col-span-4">
              <span className="material-symbols-outlined mb-6 text-4xl text-secondary">speed</span>
              <h4 className="mb-4 font-headline text-2xl font-bold text-white">Solana-Ready</h4>
              <p className="leading-relaxed text-on-surface-variant">
                Sub-second execution speeds. Yukti leverages Solana&apos;s parallel processing to ensure your trades hit the block before the competition.
              </p>
              <div className="mt-8 flex items-center justify-between border-t border-outline-variant/20 pt-8">
                <span className="font-headline text-xs uppercase text-outline">Execution Latency</span>
                <span className="font-headline font-bold text-secondary">~400ms</span>
              </div>
            </div>
            <div id="how" className="glass-panel p-8 transition-colors hover:bg-surface-container-high md:col-span-4">
              <span className="material-symbols-outlined mb-6 text-4xl text-primary">query_stats</span>
              <h4 className="mb-4 font-headline text-2xl font-bold text-white">Advanced Backtesting</h4>
              <p className="leading-relaxed text-on-surface-variant">
                Simulate strategies against years of historical Solana L1 data in seconds. Accurate fee and slippage modeling included.
              </p>
            </div>
            <div className="group overflow-hidden glass-panel p-8 md:col-span-8">
              <div className="flex flex-col items-center gap-8 md:flex-row">
                <div className="flex-1">
                  <span className="material-symbols-outlined mb-6 text-4xl text-secondary">api</span>
                  <h4 className="mb-4 font-headline text-2xl font-bold text-white">API-Based Trading</h4>
                  <p className="leading-relaxed text-on-surface-variant">
                    Seamlessly connect to Jupiter, Drift, and Phoenix. Execute complex multi-hop trades with a single API call.
                  </p>
                </div>
                <div className="w-full border border-outline-variant/10 bg-surface-container-lowest p-4 font-mono text-[10px] text-primary/80 md:w-1/3">
                  <div className="text-secondary">// Deploying Agent...</div>
                  <div>POST /v1/execute</div>
                  <div>Authorization: Bearer *******</div>
                  <div>{`{ "pair": "SOL/USDC", "side": "buy" }`}</div>
                  <div className="animate-pulse">_</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl border-y border-outline-variant/10 px-6 py-24">
          <div className="mb-20 text-center">
            <h2 className="mb-6 font-headline text-4xl font-bold text-white md:text-6xl">The New Standard of Performance.</h2>
            <p className="mx-auto max-w-2xl text-on-surface-variant">Traditional quant tools are slow, expensive, and disconnected. YuktiAI is built for the synchronous future.</p>
          </div>
          <div className="grid gap-px bg-outline-variant/20 md:grid-cols-2">
            <div className="space-y-8 bg-surface p-12">
              <h4 className="font-headline text-xs font-bold uppercase tracking-widest text-outline">The Old Way</h4>
              <ul className="space-y-6">
                <li className="flex items-start gap-4 opacity-50">
                  <span className="material-symbols-outlined text-error">close</span>
                  <div>
                    <p className="font-headline font-bold text-white">Manual Python Scripts</p>
                    <p className="text-sm text-on-surface-variant">Hours spent debugging boilerplate code and API integrations.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4 opacity-50">
                  <span className="material-symbols-outlined text-error">close</span>
                  <div>
                    <p className="font-headline font-bold text-white">Lagging Data Feeds</p>
                    <p className="text-sm text-on-surface-variant">Centralized or slow RPCs that miss critical price movements.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4 opacity-50">
                  <span className="material-symbols-outlined text-error">close</span>
                  <div>
                    <p className="font-headline font-bold text-white">Fragmented Execution</p>
                    <p className="text-sm text-on-surface-variant">Switching between multiple tabs and tools to manage trades.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="relative space-y-8 overflow-hidden bg-surface p-12">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent" />
              <h4 className="font-headline text-xs font-bold uppercase tracking-widest text-secondary">The Yukti Way</h4>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-secondary">check_circle</span>
                  <div>
                    <p className="font-headline font-bold text-white">AI Prompt Synthesis</p>
                    <p className="text-sm text-on-surface-variant">Turn thoughts into strategies instantly with our LLM-bridge.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-secondary">check_circle</span>
                  <div>
                    <p className="font-headline font-bold text-white">Direct L1 Integration</p>
                    <p className="text-sm text-on-surface-variant">Read-access to the global state at the speed of the chain.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-secondary">check_circle</span>
                  <div>
                    <p className="font-headline font-bold text-white">Unified Terminal</p>
                    <p className="text-sm text-on-surface-variant">One interface for strategy design, testing, and live execution.</p>
                  </div>
                </li>
              </ul>
              <div className="pt-8">
                <Link
                  to="/app"
                  className="block w-full border border-secondary py-4 text-center font-headline font-bold text-secondary transition-all hover:bg-secondary hover:text-on-secondary"
                >
                  Switch to Yukti
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-6 py-24">
          <div className="kinetic-glow-purple pointer-events-none absolute left-1/2 top-1/2 -z-10 h-full w-full -translate-x-1/2 -translate-y-1/2 opacity-5" />
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="space-y-12">
              <div>
                <h2 className="mb-4 font-headline text-xs font-bold uppercase tracking-[0.3em] text-primary">Future Vision</h2>
                <h3 className="font-headline text-4xl font-bold leading-tight text-white md:text-5xl">The Decentralized Quant Network.</h3>
              </div>
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-primary-container font-headline font-bold text-primary-container">01</div>
                  <div>
                    <h5 className="mb-2 font-headline text-lg font-bold text-white">Tokenized Strategies</h5>
                    <p className="text-sm text-on-surface-variant">Turn your AI-generated strategies into tradable NFTs. Earn royalties whenever others use your alpha.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-primary-container font-headline font-bold text-primary-container">02</div>
                  <div>
                    <h5 className="mb-2 font-headline text-lg font-bold text-white">RWA Integration</h5>
                    <p className="text-sm text-on-surface-variant">Bridge on-chain intelligence with real-world assets. Trade stocks and commodities through synthetic Solana accounts.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-primary-container font-headline font-bold text-primary-container">03</div>
                  <div>
                    <h5 className="mb-2 font-headline text-lg font-bold text-white">Solana DeFi 2.0</h5>
                    <p className="text-sm text-on-surface-variant">Automated liquidity provision and yield farming managed by Yukti agents across the entire ecosystem.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative aspect-square">
              <img
                className="h-full w-full object-cover opacity-60 grayscale"
                alt="Decentralized network cityscape"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuARtIqK6zzvo3AIdC80xD6YeSDz4n8No7Oew8ZLAleow3eCh65ZUMI-KlOwzS-3_CrjHVC6qCA5JQfXrz2pE3RcMEgFcUOoajjiN1sIslCoyVrrd3UrLBtKadY6ahQ-Hwf4qw032AtOv0DcXmV4zagCT5YsgOkgKVKVzaFP9yJPyo3HQ_RalojU0LDUKw_QAs5wrHAaZWxlBghh3gCJ01rhzqWtLy4MG41my3h3x5ELrZQEsnPS40OHnDz9YvudMz4v_i-efaxGAG0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              <div className="glass-panel absolute left-10 top-10 border-secondary/30 p-3">
                <div className="font-headline text-[10px] uppercase text-secondary">Live Alpha</div>
                <div className="font-bold text-white">$2.4M Volume</div>
              </div>
              <div className="glass-panel absolute bottom-20 right-10 border-primary-container/30 p-3">
                <div className="font-headline text-[10px] uppercase text-primary">Tokenized Flow</div>
                <div className="font-bold text-white">42 Active Vaults</div>
              </div>
            </div>
          </div>
        </section>

        <section id="docs" className="mx-auto mb-32 max-w-7xl px-6 py-24">
          <div className="relative overflow-hidden bg-primary-container p-12 text-center md:p-24">
            <div className="absolute right-0 top-0 h-96 w-96 -rotate-45 bg-white/10 blur-[100px]" />
            <div className="relative z-10">
              <h2 className="mb-8 font-headline text-4xl font-bold tracking-tighter text-white md:text-6xl">Ready to outpace the market?</h2>
              <div className="flex flex-col justify-center gap-4 md:flex-row">
                <Link
                  to="/app"
                  className="bg-white px-10 py-5 font-headline text-xl font-bold text-primary-container transition-colors hover:bg-white/90"
                >
                  Launch YuktiAI
                </Link>
                <a
                  href="#"
                  className="border-2 border-white/30 px-10 py-5 font-headline text-xl font-bold text-white transition-colors hover:bg-white/10"
                >
                  Read the Whitepaper
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-white/5 bg-[#131313] py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-8 md:flex-row">
          <div className="flex flex-col gap-2">
            <div className="font-headline text-lg font-bold text-white">YuktiAI</div>
            <p className="font-headline text-sm text-white/50">Built for the Digital Sovereign</p>
          </div>
          <div className="flex gap-8">
            <a className="font-headline text-sm text-white/50 transition-colors hover:text-white" href="#">
              Twitter
            </a>
            <a className="font-headline text-sm text-white/50 transition-colors hover:text-white" href="#">
              Discord
            </a>
            <a className="font-headline text-sm text-white/50 transition-colors hover:text-white" href="#">
              GitHub
            </a>
            <Link className="font-headline text-sm text-white/50 transition-colors hover:text-white" to="/app">
              App
            </Link>
          </div>
          <div className="font-headline text-sm text-white/50">Copyright 2024 YuktiAI</div>
        </div>
      </footer>
    </div>
  );
}
