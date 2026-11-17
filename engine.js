(function (global) {
  'use strict';

  const STORAGE_KEY = 'apexsim_state_v1';
  const STARTING_CASH = 10000;
  const FEE_RATE = 0.001; // 0.1% spot fee

  const TF_MS = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '1D': 24 * 60 * 60 * 1000
  };

  const TF_VOL_SCALE = {
    '1m': 1,
    '5m': 2.2,
    '15m': 3.8,
    '1h': 7.5,
    '1D': 24
  };

  const ASSET_DEFS = [
    // Crypto
    { id: 'BTC', symbol: 'BTC', quote: 'USDT', name: 'Bitcoin', kind: 'crypto', sector: 'Layer 1', basePrice: 91420.0, priceDecimals: 2, qtyDecimals: 5, volatility: 0.0032, beta: 1.0, avgVol: 2840000000 },
    { id: 'ETH', symbol: 'ETH', quote: 'USDT', name: 'Ethereum', kind: 'crypto', sector: 'Layer 1', basePrice: 3180.0, priceDecimals: 2, qtyDecimals: 4, volatility: 0.0038, beta: 1.12, avgVol: 1420000000 },
    { id: 'SOL', symbol: 'SOL', quote: 'USDT', name: 'Solana', kind: 'crypto', sector: 'Layer 1', basePrice: 214.5, priceDecimals: 2, qtyDecimals: 3, volatility: 0.0052, beta: 1.35, avgVol: 790000000 },
    { id: 'BNB', symbol: 'BNB', quote: 'USDT', name: 'BNB', kind: 'crypto', sector: 'Exchange', basePrice: 628.4, priceDecimals: 2, qtyDecimals: 3, volatility: 0.0030, beta: 0.85, avgVol: 410000000 },
    { id: 'XRP', symbol: 'XRP', quote: 'USDT', name: 'Ripple', kind: 'crypto', sector: 'Payments', basePrice: 1.084, priceDecimals: 4, qtyDecimals: 1, volatility: 0.0048, beta: 0.95, avgVol: 620000000 },
    { id: 'DOGE', symbol: 'DOGE', quote: 'USDT', name: 'Dogecoin', kind: 'crypto', sector: 'Meme', basePrice: 0.368, priceDecimals: 4, qtyDecimals: 0, volatility: 0.0064, beta: 1.30, avgVol: 540000000 },
    { id: 'AVAX', symbol: 'AVAX', quote: 'USDT', name: 'Avalanche', kind: 'crypto', sector: 'Layer 1', basePrice: 35.6, priceDecimals: 2, qtyDecimals: 2, volatility: 0.0050, beta: 1.25, avgVol: 215000000 },
    { id: 'TON', symbol: 'TON', quote: 'USDT', name: 'Toncoin', kind: 'crypto', sector: 'Layer 1', basePrice: 5.42, priceDecimals: 3, qtyDecimals: 1, volatility: 0.0044, beta: 0.90, avgVol: 185000000 },

    // Companies / Equities
    { id: 'NVDA', symbol: 'NVDA', quote: 'USD', name: 'NVIDIA Corp.', kind: 'stock', sector: 'Semis', basePrice: 142.8, priceDecimals: 2, qtyDecimals: 3, volatility: 0.0028, beta: 1.35, avgVol: 3920000000 },
    { id: 'AAPL', symbol: 'AAPL', quote: 'USD', name: 'Apple Inc.', kind: 'stock', sector: 'Consumer Tech', basePrice: 228.5, priceDecimals: 2, qtyDecimals: 3, volatility: 0.0016, beta: 0.90, avgVol: 1850000000 },
    { id: 'MSFT', symbol: 'MSFT', quote: 'USD', name: 'Microsoft Corp.', kind: 'stock', sector: 'Cloud & AI', basePrice: 418.2, priceDecimals: 2, qtyDecimals: 3, volatility: 0.0017, beta: 0.95, avgVol: 1410000000 },
    { id: 'TSLA', symbol: 'TSLA', quote: 'USD', name: 'Tesla Inc.', kind: 'stock', sector: 'EV & Auto', basePrice: 324.6, priceDecimals: 2, qtyDecimals: 3, volatility: 0.0038, beta: 1.45, avgVol: 2680000000 },
    { id: 'AMZN', symbol: 'AMZN', quote: 'USD', name: 'Amazon.com', kind: 'stock', sector: 'E-Commerce', basePrice: 206.4, priceDecimals: 2, qtyDecimals: 3, volatility: 0.0021, beta: 1.05, avgVol: 1320000000 },
    { id: 'GOOGL', symbol: 'GOOGL', quote: 'USD', name: 'Alphabet Inc.', kind: 'stock', sector: 'Search & AI', basePrice: 176.9, priceDecimals: 2, qtyDecimals: 3, volatility: 0.0020, beta: 1.00, avgVol: 1050000000 },
    { id: 'META', symbol: 'META', quote: 'USD', name: 'Meta Platforms', kind: 'stock', sector: 'Social & AI', basePrice: 574.3, priceDecimals: 2, qtyDecimals: 3, volatility: 0.0025, beta: 1.15, avgVol: 1180000000 },
    { id: 'JPM', symbol: 'JPM', quote: 'USD', name: 'JPMorgan Chase', kind: 'stock', sector: 'Financials', basePrice: 241.1, priceDecimals: 2, qtyDecimals: 3, volatility: 0.0014, beta: 0.72, avgVol: 780000000 }
  ];

  const NEWS_TEMPLATES = [
    { scope: 'crypto', impact: 1, title: 'Spot Crypto ETF Net Inflows Surge', desc: 'Institutional desks add Spot BTC & ETH exposure across major liquidity venues.' },
    { scope: 'crypto', impact: -1, title: 'Large Exchange Inflows Spark Caution', desc: 'On-chain trackers report elevated whale deposits ahead of options expiry.' },
    { scope: 'stock', impact: 1, title: 'US Macro Print Comes In Cooler Than Consensus', desc: 'Treasury yields ease, supporting broad upside across technology and growth equities.' },
    { scope: 'stock', impact: -1, title: 'Hawkish Central Bank Commentary Weighs on Equities', desc: 'Rate-sensitive tech multiples pull back as bond yields tick higher.' },
    { scope: 'all', impact: 1, title: 'Global Risk Appetite Strengthens in Asia & US Open', desc: 'Both digital assets and mega-cap equities catch steady bid depth.' },
    { scope: 'all', impact: -1, title: 'Broad De-Risking Ahead of Macro Data Release', desc: 'Traders trim leverage and widen spreads across crypto and stock books.' },
    { scope: 'BTC', impact: 1, title: 'Bitcoin Sovereign Reserve Proposal Advances', desc: 'Spot order books thin on the ask side as momentum buyers step in.' },
    { scope: 'ETH', impact: 1, title: 'Ethereum L2 Throughput Hits New Weekly High', desc: 'Network fee burn accelerates alongside rising staking inflows.' },
    { scope: 'SOL', impact: 1, title: 'Solana DEX Volume Leads Layer-1 Peers', desc: 'High-frequency market makers deepen SOL/USDT liquidity.' },
    { scope: 'DOGE', impact: -1, title: 'Meme Sector Rotates Lower After Sharp Run', desc: 'Short-term momentum traders lock in gains on high-beta tokens.' },
    { scope: 'NVDA', impact: 1, title: 'NVIDIA Expands Next-Gen Datacenter Shipments', desc: 'Hyperscaler capex forecasts push semiconductor demand estimates higher.' },
    { scope: 'NVDA', impact: -1, title: 'Export Licensing Review Pressures Chipmakers', desc: 'Semiconductor names see profit-taking on supply-chain headlines.' },
    { scope: 'AAPL', impact: 1, title: 'Apple Services Revenue Tops Street Estimates', desc: 'Steady margin expansion bolsters institutional accumulation.' },
    { scope: 'TSLA', impact: 1, title: 'Tesla Quarterly Delivery Beat Lifts EV Sector', desc: 'Higher factory utilization eases near-term margin concerns.' },
    { scope: 'TSLA', impact: -1, title: 'Tesla Price Cuts Trigger Margin Debate', desc: 'Analysts revise near-term automotive gross margin models lower.' },
    { scope: 'MSFT', impact: 1, title: 'Microsoft Cloud Backlog Accelerates 24% YoY', desc: 'Enterprise AI seat adoption drives recurring contract growth.' },
    { scope: 'META', impact: 1, title: 'Meta Ad Impressions and Pricing Rise Together', desc: 'Efficiency gains keep operating margins near multi-year highs.' },
    { scope: 'JPM', impact: 1, title: 'JPMorgan Net Interest Income Guidance Raised', desc: 'Large-cap financials outperform on resilient credit quality.' }
  ];

  const ACHIEVEMENTS = [
    { id: 'first_trade', title: 'First Execution', desc: 'Complete your first Buy or Sell order.' },
    { id: 'first_profit', title: 'In The Green', desc: 'Close a position with a realized profit.' },
    { id: 'diversified', title: 'Cross-Asset Desk', desc: 'Hold at least 1 Crypto and 1 Company stock simultaneously.' },
    { id: 'limit_fill', title: 'Limit Sniper', desc: 'Have a Limit order execute automatically.' },
    { id: 'ten_trades', title: 'Active Tape Reader', desc: 'Execute 10 or more trades.' },
    { id: 'eq_12500', title: 'Portfolio Builder', desc: 'Reach $12,500.00 in total account equity.' },
    { id: 'eq_25000', title: 'Institutional Size', desc: 'Reach $25,000.00 in total account equity.' }
  ];

  function randNormal() {
    // Box-Muller transform
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  function roundTo(val, decimals) {
    const f = Math.pow(10, decimals);
    return Math.round(val * f) / f;
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function formatPrice(val, decimals) {
    if (val === undefined || val === null || isNaN(val)) return '--';
    return Number(val).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function formatUsd(val) {
    const sign = val < 0 ? '-' : '';
    const abs = Math.abs(val);
    return sign + '$' + abs.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatCompactUsd(val) {
    if (val >= 1e12) return '$' + (val / 1e12).toFixed(2) + 'T';
    if (val >= 1e9) return '$' + (val / 1e9).toFixed(2) + 'B';
    if (val >= 1e6) return '$' + (val / 1e6).toFixed(1) + 'M';
    if (val >= 1e3) return '$' + (val / 1e3).toFixed(1) + 'K';
    return '$' + val.toFixed(0);
  }

  function formatQty(val, decimals) {
    if (val === undefined || val === null || isNaN(val)) return '0';
    return Number(val).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });
  }

  function generateHistoryForAsset(def) {
    const candles = {};
    const tfs = Object.keys(TF_MS);
    const now = Date.now();

    tfs.forEach((tf) => {
      const count = 88;
      const stepScale = TF_VOL_SCALE[tf] || 1;
      const stepVol = def.volatility * stepScale * 0.75;
      const list = [];

      // Walk backwards from basePrice to ensure final close matches initial live price cleanly
      let p = def.basePrice;
      const closes = [p];
      for (let i = 1; i < count; i++) {
        const ret = randNormal() * stepVol;
        p = p / Math.exp(ret);
        closes.unshift(p);
      }

      const barMs = TF_MS[tf];
      const latestBucket = Math.floor(now / barMs) * barMs;
      for (let i = 0; i < count; i++) {
        const open = i === 0 ? closes[0] * (1 + randNormal() * stepVol * 0.3) : closes[i - 1];
        const close = closes[i];
        const bodyMax = Math.max(open, close);
        const bodyMin = Math.min(open, close);
        const wickUp = Math.abs(randNormal()) * stepVol * close * 0.65;
        const wickDn = Math.abs(randNormal()) * stepVol * close * 0.65;
        const high = roundTo(bodyMax + wickUp, def.priceDecimals);
        const low = roundTo(Math.max(0.0001, bodyMin - wickDn), def.priceDecimals);
        const volBase = (def.avgVol / 1440) * (barMs / 60000) * (0.55 + Math.random() * 0.95);

        list.push({
          t: latestBucket - (count - 1 - i) * barMs,
          o: roundTo(open, def.priceDecimals),
          h: high,
          l: low,
          c: roundTo(close, def.priceDecimals),
          v: Math.round(volBase)
        });
      }
      candles[tf] = list;
    });

    return candles;
  }

  class MarketEngine {
    constructor() {
      this.listeners = new Set();
      this.ws = null;
      this.liveCryptoTimer = null;
      this.liveStockTimer = null;
      this.fallbackTimer = null;
      this.lastWsEmit = 0;
      this.liveStatus = { crypto: false, stock: false };
      this.state = null;
      this.initOrLoad();
    }

    initOrLoad() {
      let loaded = null;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) loaded = JSON.parse(raw);
      } catch (e) {
        loaded = null;
      }

      if (loaded && loaded.assets && loaded.cash !== undefined) {
        this.state = loaded;
        // Ensure any newly added fields exist
        this.state.achievements = this.state.achievements || {};
        this.state.newsFeed = this.state.newsFeed || [];
        this.state.catalysts = this.state.catalysts || [];
        this.state.watchlist = this.state.watchlist || ['BTC', 'ETH', 'NVDA', 'AAPL'];
        this.state.stats = this.state.stats || {
          totalTrades: 0,
          closingTrades: 0,
          winningTrades: 0,
          realizedPnl: 0
        };
      } else {
        this.createFreshState();
      }
    }

    createFreshState() {
      const assets = {};
      ASSET_DEFS.forEach((def) => {
        const candles = generateHistoryForAsset(def);
        const bars1m = candles['1m'];
        const ref24 = bars1m[Math.max(0, bars1m.length - 48)].o;
        let hi = def.basePrice;
        let lo = def.basePrice;
        bars1m.slice(-48).forEach((b) => {
          if (b.h > hi) hi = b.h;
          if (b.l < lo) lo = b.l;
        });

        const recentTrades = [];
        const baseTs = Date.now();
        for (let i = 0; i < 12; i++) {
          const isBuy = Math.random() > 0.48;
          const jitter = (Math.random() - 0.5) * def.volatility * def.basePrice;
          recentTrades.push({
            price: roundTo(def.basePrice + jitter, def.priceDecimals),
            qty: this.randomTradeQty(def),
            side: isBuy ? 'buy' : 'sell',
            time: baseTs - i * 4000
          });
        }

        assets[def.id] = {
          ...def,
          price: def.basePrice,
          prevPrice: def.basePrice,
          open24h: ref24,
          high24h: hi,
          low24h: lo,
          vol24h: def.avgVol,
          candles,
          recentTrades
        };
      });

      this.state = {
        cash: STARTING_CASH,
        holdings: {},
        openOrders: [],
        tradeHistory: [],
        watchlist: ['BTC', 'ETH', 'NVDA', 'AAPL'],
        tickCount: 0,
        regime: 'NEUTRAL', // BULL | BEAR | NEUTRAL
        sentiment: 54,
        catalysts: [],
        newsFeed: [
          {
            id: 'init-1',
            time: Date.now(),
            scope: 'MARKET',
            impact: 0,
            title: 'Trading Desk Initialized — $10,000.00 Capital Ready',
            desc: 'Spot markets open across 8 Crypto pairs and 8 US Company equities with 0.1% fees.'
          }
        ],
        achievements: {},
        stats: {
          totalTrades: 0,
          closingTrades: 0,
          winningTrades: 0,
          realizedPnl: 0
        },
        assets
      };

      this.saveState();
    }

    randomTradeQty(def) {
      const targetUsd = 150 + Math.random() * 4500;
      const raw = targetUsd / def.basePrice;
      return roundTo(Math.max(Math.pow(10, -def.qtyDecimals), raw), def.qtyDecimals);
    }

    saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (e) {
        // Ignore storage quota issues gracefully
      }
    }

    subscribe(fn) {
      this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    }

    emit(eventType, payload) {
      this.listeners.forEach((fn) => fn(eventType, payload));
    }

    start() {
      this.startLiveSync();
    }

    updateLiveCandles(asset, price, now = Date.now()) {
      Object.keys(TF_MS).forEach((tf) => {
        const bars = asset.candles[tf];
        if (!bars || !bars.length) return;
        const barMs = TF_MS[tf];
        const bucketTs = Math.floor(now / barMs) * barMs;
        const last = bars[bars.length - 1];

        if (last.t < bucketTs) {
          bars.push({
            t: bucketTs,
            o: price,
            h: price,
            l: price,
            c: price,
            v: Math.round(asset.avgVol / 1440)
          });
          if (bars.length > 96) bars.shift();
        } else {
          last.c = price;
          if (price > last.h) last.h = price;
          if (price < last.l) last.l = price;
        }
      });
    }

    startLiveSync() {
      this.stopLiveSync();
      if (typeof fetch !== 'undefined') {
        this.syncCryptoTickers();
        this.syncStockTickers();
        this.connectCryptoWS();

        this.liveCryptoTimer = setInterval(() => this.syncCryptoTickers(), 10000);
        this.liveStockTimer = setInterval(() => this.syncStockTickers(), 25000);
      }
      // Fallback ticker every 4s only for assets whose live feed isn't active (e.g. offline)
      this.fallbackTimer = setInterval(() => this.stepOfflineFallback(), 4000);
    }

    stopLiveSync() {
      if (this.ws) {
        try { this.ws.close(); } catch (e) {}
        this.ws = null;
      }
      if (this.liveCryptoTimer) {
        clearInterval(this.liveCryptoTimer);
        this.liveCryptoTimer = null;
      }
      if (this.liveStockTimer) {
        clearInterval(this.liveStockTimer);
        this.liveStockTimer = null;
      }
      if (this.fallbackTimer) {
        clearInterval(this.fallbackTimer);
        this.fallbackTimer = null;
      }
    }

    connectCryptoWS() {
      if (typeof WebSocket === 'undefined') return;
      const streams = ASSET_DEFS
        .filter((d) => d.kind === 'crypto')
        .map((d) => `${d.symbol.toLowerCase()}usdt@miniTicker`)
        .join('/');

      try {
        const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
        this.ws = ws;

        ws.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data);
            const d = msg && msg.data;
            if (!d || !d.s) return;
            const sym = d.s.replace('USDT', '');
            const a = this.state.assets[sym];
            if (!a) return;

            const nextP = roundTo(parseFloat(d.c), a.priceDecimals);
            if (!nextP || isNaN(nextP)) return;

            a.prevPrice = a.price;
            a.price = nextP;
            a.open24h = roundTo(parseFloat(d.o), a.priceDecimals) || a.open24h;
            a.high24h = roundTo(parseFloat(d.h), a.priceDecimals) || a.high24h;
            a.low24h = roundTo(parseFloat(d.l), a.priceDecimals) || a.low24h;
            a.vol24h = Math.round(parseFloat(d.q) || a.vol24h);

            this.updateLiveCandles(a, nextP, Date.now());
            this.liveStatus.crypto = true;
            this.processOpenOrders();

            const now = Date.now();
            if (now - this.lastWsEmit > 350) {
              this.lastWsEmit = now;
              this.evaluateAchievements();
              this.emit('tick', { live: true });
            }
          } catch (e) {}
        };

        ws.onclose = () => {
          if (this.ws === ws) {
            setTimeout(() => {
              this.connectCryptoWS();
            }, 4000);
          }
        };
      } catch (e) {}
    }

    async syncCryptoTickers() {
      if (typeof fetch === 'undefined') return;
      const syms = ASSET_DEFS.filter((d) => d.kind === 'crypto').map((d) => `"${d.symbol}USDT"`);
      const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent('[' + syms.join(',') + ']')}`;
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const list = await res.json();
        if (!Array.isArray(list)) return;

        list.forEach((item) => {
          const sym = item.symbol.replace('USDT', '');
          const a = this.state.assets[sym];
          if (!a) return;
          a.prevPrice = a.price;
          a.price = roundTo(parseFloat(item.lastPrice), a.priceDecimals);
          a.open24h = roundTo(parseFloat(item.openPrice), a.priceDecimals);
          a.high24h = roundTo(parseFloat(item.highPrice), a.priceDecimals);
          a.low24h = roundTo(parseFloat(item.lowPrice), a.priceDecimals);
          a.vol24h = Math.round(parseFloat(item.quoteVolume) || a.vol24h);

          this.updateLiveCandles(a, a.price, Date.now());
        });

        this.liveStatus.crypto = true;
        this.processOpenOrders();
        this.saveState();
        this.emit('tick', { live: true });
      } catch (e) {}
    }

    async syncStockTickers() {
      if (typeof fetch === 'undefined') return;
      const stocks = ASSET_DEFS.filter((d) => d.kind === 'stock');
      const tasks = stocks.map(async (def) => {
        const target = `https://query1.finance.yahoo.com/v8/finance/chart/${def.symbol}?interval=5m&range=1d`;
        const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`;
        const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = ctrl ? setTimeout(() => ctrl.abort(), 7000) : null;
        try {
          const res = await fetch(url, ctrl ? { signal: ctrl.signal } : undefined);
          if (timer) clearTimeout(timer);
          if (!res.ok) return;
          const json = await res.json();
          const result = json && json.chart && json.chart.result && json.chart.result[0];
          if (!result || !result.meta) return;
          const meta = result.meta;
          const a = this.state.assets[def.id];
          if (!a || !meta.regularMarketPrice) return;

          a.prevPrice = a.price;
          a.price = roundTo(meta.regularMarketPrice, a.priceDecimals);
          if (meta.chartPreviousClose) a.open24h = roundTo(meta.chartPreviousClose, a.priceDecimals);
          if (meta.regularMarketDayHigh) a.high24h = roundTo(meta.regularMarketDayHigh, a.priceDecimals);
          if (meta.regularMarketDayLow) a.low24h = roundTo(meta.regularMarketDayLow, a.priceDecimals);
          if (meta.regularMarketVolume) a.vol24h = Math.round(meta.regularMarketVolume * a.price);

          this.updateLiveCandles(a, a.price, Date.now());
          this.liveStatus.stock = true;
        } catch (e) {
          if (timer) clearTimeout(timer);
        }
      });

      await Promise.allSettled(tasks);
      this.processOpenOrders();
      this.saveState();
      this.emit('tick', { live: true });
    }

    async fetchRealCandles(assetId, tf) {
      if (typeof fetch === 'undefined') return;
      const a = this.state.assets[assetId];
      if (!a) return;

      if (a.kind === 'crypto') {
        const interval = tf === '1D' ? '1d' : tf;
        const url = `https://api.binance.com/api/v3/klines?symbol=${a.symbol}USDT&interval=${interval}&limit=88`;
        try {
          const res = await fetch(url);
          if (!res.ok) return;
          const rows = await res.json();
          if (!Array.isArray(rows) || !rows.length) return;
          a.candles[tf] = rows.map((r) => ({
            t: r[0],
            o: roundTo(parseFloat(r[1]), a.priceDecimals),
            h: roundTo(parseFloat(r[2]), a.priceDecimals),
            l: roundTo(parseFloat(r[3]), a.priceDecimals),
            c: roundTo(parseFloat(r[4]), a.priceDecimals),
            v: Math.round(parseFloat(r[7]) || parseFloat(r[5]) * parseFloat(r[4]))
          }));
          const last = a.candles[tf][a.candles[tf].length - 1];
          if (last) a.price = last.c;
          this.emit('tick', { live: true });
        } catch (e) {}
      } else {
        const map = {
          '1m': 'interval=1m&range=1d',
          '5m': 'interval=5m&range=5d',
          '15m': 'interval=15m&range=5d',
          '1h': 'interval=1h&range=1mo',
          '1D': 'interval=1d&range=3mo'
        };
        const target = `https://query1.finance.yahoo.com/v8/finance/chart/${a.symbol}?${map[tf] || map['5m']}`;
        const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`;
        try {
          const res = await fetch(url);
          if (!res.ok) return;
          const json = await res.json();
          const result = json && json.chart && json.chart.result && json.chart.result[0];
          if (!result || !result.timestamp) return;
          const ts = result.timestamp;
          const q = result.indicators && result.indicators.quote && result.indicators.quote[0];
          if (!q) return;

          const bars = [];
          for (let i = 0; i < ts.length; i++) {
            if (q.open[i] == null || q.high[i] == null || q.low[i] == null || q.close[i] == null) continue;
            bars.push({
              t: ts[i] * 1000,
              o: roundTo(q.open[i], a.priceDecimals),
              h: roundTo(q.high[i], a.priceDecimals),
              l: roundTo(q.low[i], a.priceDecimals),
              c: roundTo(q.close[i], a.priceDecimals),
              v: Math.round((q.volume && q.volume[i]) || 0)
            });
          }
          if (bars.length) {
            a.candles[tf] = bars.slice(-88);
            a.price = a.candles[tf][a.candles[tf].length - 1].c;
            this.liveStatus.stock = true;
            this.emit('tick', { live: true });
          }
        } catch (e) {}
      }
    }

    async fetchRealOrderBookAndTrades(assetId) {
      if (typeof fetch === 'undefined') return;
      const a = this.state.assets[assetId];
      if (!a || a.kind !== 'crypto') return;

      try {
        const [depthRes, tradesRes] = await Promise.all([
          fetch(`https://api.binance.com/api/v3/depth?symbol=${a.symbol}USDT&limit=8`),
          fetch(`https://api.binance.com/api/v3/trades?symbol=${a.symbol}USDT&limit=14`)
        ]);

        if (depthRes.ok) {
          const depth = await depthRes.json();
          if (depth.asks && depth.bids) {
            const asksRaw = depth.asks.slice(0, 6).map((x) => ({
              price: roundTo(parseFloat(x[0]), a.priceDecimals),
              qty: roundTo(parseFloat(x[1]), a.qtyDecimals)
            }));
            const bidsRaw = depth.bids.slice(0, 6).map((x) => ({
              price: roundTo(parseFloat(x[0]), a.priceDecimals),
              qty: roundTo(parseFloat(x[1]), a.qtyDecimals)
            }));
            let maxQty = 0;
            asksRaw.forEach((r) => { if (r.qty > maxQty) maxQty = r.qty; });
            bidsRaw.forEach((r) => { if (r.qty > maxQty) maxQty = r.qty; });
            maxQty = Math.max(1e-9, maxQty);
            asksRaw.sort((x, y) => y.price - x.price);
            bidsRaw.sort((x, y) => y.price - x.price);
            asksRaw.forEach((r) => { r.depthPct = Math.min(100, Math.round((r.qty / maxQty) * 100)); });
            bidsRaw.forEach((r) => { r.depthPct = Math.min(100, Math.round((r.qty / maxQty) * 100)); });
            a.realOrderBook = { asks: asksRaw, bids: bidsRaw, ts: Date.now() };
          }
        }

        if (tradesRes.ok) {
          const trades = await tradesRes.json();
          if (Array.isArray(trades) && trades.length) {
            a.recentTrades = trades.slice().reverse().slice(0, 14).map((t) => ({
              price: roundTo(parseFloat(t.price), a.priceDecimals),
              qty: roundTo(parseFloat(t.qty), a.qtyDecimals),
              side: t.isBuyerMaker ? 'sell' : 'buy',
              time: t.time
            }));
          }
        }

        this.emit('tick', { live: true });
      } catch (e) {}
    }

    getAssetsList() {
      return ASSET_DEFS.map((d) => this.state.assets[d.id]);
    }

    getAsset(id) {
      return this.state.assets[id];
    }

    getReservedCash() {
      return this.state.openOrders
        .filter((o) => o.side === 'buy')
        .reduce((sum, o) => sum + o.reservedUsd, 0);
    }

    getAvailableCash() {
      return Math.max(0, this.state.cash - this.getReservedCash());
    }

    getReservedQty(assetId) {
      return this.state.openOrders
        .filter((o) => o.side === 'sell' && o.assetId === assetId)
        .reduce((sum, o) => sum + o.qty, 0);
    }

    getAvailableQty(assetId) {
      const h = this.state.holdings[assetId];
      const total = h ? h.qty : 0;
      return Math.max(0, total - this.getReservedQty(assetId));
    }

    getPortfolioSummary() {
      let cryptoVal = 0;
      let stockVal = 0;
      let unrealizedPnl = 0;
      const holdingRows = [];

      Object.keys(this.state.holdings).forEach((id) => {
        const h = this.state.holdings[id];
        if (!h || h.qty <= 1e-9) return;
        const asset = this.state.assets[id];
        if (!asset) return;
        const marketVal = h.qty * asset.price;
        const costBasis = h.qty * h.avgPrice;
        const pnl = marketVal - costBasis;
        const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

        if (asset.kind === 'crypto') cryptoVal += marketVal;
        else stockVal += marketVal;

        unrealizedPnl += pnl;
        holdingRows.push({
          assetId: id,
          symbol: asset.symbol,
          quote: asset.quote,
          name: asset.name,
          kind: asset.kind,
          qty: h.qty,
          avgPrice: h.avgPrice,
          currentPrice: asset.price,
          marketVal,
          pnl,
          pnlPct
        });
      });

      const invested = cryptoVal + stockVal;
      const equity = this.state.cash + invested;
      const totalPnl = equity - STARTING_CASH;
      const totalPnlPct = (totalPnl / STARTING_CASH) * 100;

      return {
        cash: this.state.cash,
        availableCash: this.getAvailableCash(),
        reservedCash: this.getReservedCash(),
        cryptoVal,
        stockVal,
        invested,
        equity,
        unrealizedPnl,
        totalPnl,
        totalPnlPct,
        holdingRows
      };
    }

    getRank(equity) {
      if (equity >= 50000) return 'Quant Partner';
      if (equity >= 25000) return 'Portfolio Manager';
      if (equity >= 16000) return 'Desk Strategist';
      if (equity >= 12000) return 'Swing Trader';
      if (equity >= 10300) return 'Active Trader';
      return 'Retail Trader';
    }

    stepOfflineFallback() {
      const now = Date.now();
      let updated = false;

      ASSET_DEFS.forEach((def) => {
        const isLive = def.kind === 'crypto' ? this.liveStatus.crypto : this.liveStatus.stock;
        if (isLive) return;

        const a = this.state.assets[def.id];
        a.prevPrice = a.price;
        const ret = randNormal() * a.volatility * 0.5;
        const nextPrice = roundTo(Math.max(Math.pow(10, -a.priceDecimals), a.price * Math.exp(ret)), a.priceDecimals);
        a.price = nextPrice;
        if (nextPrice > a.high24h) a.high24h = nextPrice;
        if (nextPrice < a.low24h) a.low24h = nextPrice;
        this.updateLiveCandles(a, nextPrice, now);
        updated = true;
      });

      if (updated) {
        this.processOpenOrders();
        this.evaluateAchievements();
        this.emit('tick', { live: false });
      }
    }

    triggerCatalyst(notify = true) {
      const tpl = NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)];
      this.state.catalysts.push({
        scope: tpl.scope,
        impact: tpl.impact,
        ttl: 14
      });

      const entry = {
        id: 'n-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        time: Date.now(),
        scope: tpl.scope === 'all' ? 'MACRO' : tpl.scope.toUpperCase(),
        impact: tpl.impact,
        title: tpl.title,
        desc: tpl.desc
      };

      this.state.newsFeed.unshift(entry);
      if (this.state.newsFeed.length > 30) this.state.newsFeed.pop();
      this.saveState();
      this.emit('news', entry);
      if (notify) {
        this.emit('toast', { type: 'info', message: entry.title });
      }
    }

    generateOrderBook(assetId) {
      const a = this.state.assets[assetId];
      if (!a) return { asks: [], bids: [] };

      if (a.realOrderBook && Date.now() - a.realOrderBook.ts < 15000) {
        return a.realOrderBook;
      }

      const p = a.price;
      const spreadStep = Math.max(Math.pow(10, -a.priceDecimals), p * 0.00045);
      const asks = [];
      const bids = [];

      let maxQty = 0;
      for (let i = 1; i <= 6; i++) {
        const askP = roundTo(p + spreadStep * i, a.priceDecimals);
        const bidP = roundTo(Math.max(Math.pow(10, -a.priceDecimals), p - spreadStep * i), a.priceDecimals);
        const baseNotional = 1200 + i * 950;
        const askQ = roundTo((baseNotional * (0.6 + Math.random() * 0.9)) / p, a.qtyDecimals);
        const bidQ = roundTo((baseNotional * (0.6 + Math.random() * 0.9)) / p, a.qtyDecimals);
        maxQty = Math.max(maxQty, askQ, bidQ);
        asks.push({ price: askP, qty: askQ });
        bids.push({ price: bidP, qty: bidQ });
      }

      // Asks sorted descending so lowest ask is closest to mid
      asks.sort((x, y) => y.price - x.price);
      bids.sort((x, y) => y.price - x.price);

      asks.forEach((r) => { r.depthPct = Math.min(100, Math.round((r.qty / maxQty) * 100)); });
      bids.forEach((r) => { r.depthPct = Math.min(100, Math.round((r.qty / maxQty) * 100)); });

      return { asks, bids };
    }

    placeOrder({ assetId, side, type, price, qty }) {
      const a = this.state.assets[assetId];
      if (!a) return { ok: false, error: 'Asset not found.' };

      const cleanQty = roundTo(Number(qty), a.qtyDecimals);
      if (!cleanQty || cleanQty <= 0) {
        return { ok: false, error: 'Enter a valid quantity.' };
      }

      if (type === 'market') {
        return this.executeFill({
          assetId,
          side,
          price: a.price,
          qty: cleanQty,
          orderType: 'Market'
        });
      }

      // Limit order
      const cleanPrice = roundTo(Number(price), a.priceDecimals);
      if (!cleanPrice || cleanPrice <= 0) {
        return { ok: false, error: 'Enter a valid limit price.' };
      }

      // Immediate fill if limit crosses current market price
      if ((side === 'buy' && cleanPrice >= a.price) || (side === 'sell' && cleanPrice <= a.price)) {
        return this.executeFill({
          assetId,
          side,
          price: a.price,
          qty: cleanQty,
          orderType: 'Limit'
        });
      }

      if (side === 'buy') {
        const needed = cleanPrice * cleanQty * (1 + FEE_RATE);
        if (needed > this.getAvailableCash() + 0.01) {
          return { ok: false, error: 'Insufficient available USD balance.' };
        }
        this.state.openOrders.unshift({
          id: 'ord-' + Date.now() + '-' + Math.floor(Math.random() * 999),
          assetId,
          side: 'buy',
          type: 'limit',
          price: cleanPrice,
          qty: cleanQty,
          reservedUsd: needed,
          createdAt: Date.now()
        });
      } else {
        const availQty = this.getAvailableQty(assetId);
        if (cleanQty > availQty + 1e-8) {
          return { ok: false, error: `Insufficient ${a.symbol} balance.` };
        }
        this.state.openOrders.unshift({
          id: 'ord-' + Date.now() + '-' + Math.floor(Math.random() * 999),
          assetId,
          side: 'sell',
          type: 'limit',
          price: cleanPrice,
          qty: cleanQty,
          reservedUsd: 0,
          createdAt: Date.now()
        });
      }

      this.saveState();
      this.emit('portfolio', {});
      return { ok: true, status: 'open', message: `Limit ${side.toUpperCase()} placed @ ${formatPrice(cleanPrice, a.priceDecimals)}` };
    }

    executeFill({ assetId, side, price, qty, orderType, fromLimit = false }) {
      const a = this.state.assets[assetId];
      const notional = price * qty;
      const fee = notional * FEE_RATE;

      if (side === 'buy') {
        const totalCost = notional + fee;
        const availCash = fromLimit ? this.state.cash : this.getAvailableCash();
        if (totalCost > availCash + 0.02) {
          return { ok: false, error: 'Insufficient available USD balance.' };
        }

        const actualCost = Math.min(this.state.cash, totalCost);
        this.state.cash = Math.max(0, this.state.cash - actualCost);

        const prev = this.state.holdings[assetId];
        if (prev && prev.qty > 0) {
          const newQty = prev.qty + qty;
          const newAvg = (prev.qty * prev.avgPrice + notional) / newQty;
          this.state.holdings[assetId] = { qty: newQty, avgPrice: newAvg };
        } else {
          this.state.holdings[assetId] = { qty, avgPrice: price };
        }

        this.state.stats.totalTrades += 1;
        this.state.tradeHistory.unshift({
          id: 'tr-' + Date.now() + '-' + Math.floor(Math.random() * 999),
          assetId,
          symbol: a.symbol,
          quote: a.quote,
          side: 'buy',
          orderType,
          price,
          qty,
          fee,
          realizedPnl: null,
          time: Date.now()
        });
      } else {
        const holding = this.state.holdings[assetId];
        const availQty = fromLimit ? (holding ? holding.qty : 0) : this.getAvailableQty(assetId);
        const dust = Math.pow(10, -a.qtyDecimals);
        if (!holding || availQty <= 0 || qty > availQty + dust) {
          return { ok: false, error: `Insufficient ${a.symbol} balance.` };
        }

        const sellQty = Math.min(availQty, qty);
        const sellNotional = price * sellQty;
        const sellFee = sellNotional * FEE_RATE;
        const proceeds = sellNotional - sellFee;
        const realized = (price - holding.avgPrice) * sellQty - sellFee;

        this.state.cash += proceeds;
        const remQty = holding.qty - sellQty;
        if (remQty <= Math.pow(10, -(a.qtyDecimals + 2))) {
          delete this.state.holdings[assetId];
        } else {
          holding.qty = remQty;
        }

        this.state.stats.totalTrades += 1;
        this.state.stats.closingTrades += 1;
        this.state.stats.realizedPnl += realized;
        if (realized > 0) {
          this.state.stats.winningTrades += 1;
          this.unlockAchievement('first_profit');
        }

        this.state.tradeHistory.unshift({
          id: 'tr-' + Date.now() + '-' + Math.floor(Math.random() * 999),
          assetId,
          symbol: a.symbol,
          quote: a.quote,
          side: 'sell',
          orderType,
          price,
          qty: sellQty,
          fee: sellFee,
          realizedPnl: realized,
          time: Date.now()
        });
      }

      if (this.state.tradeHistory.length > 60) {
        this.state.tradeHistory.pop();
      }

      a.recentTrades.unshift({
        price,
        qty,
        side,
        time: Date.now()
      });
      if (a.recentTrades.length > 14) a.recentTrades.pop();

      this.unlockAchievement('first_trade');
      if (fromLimit) this.unlockAchievement('limit_fill');
      this.evaluateAchievements();
      this.saveState();
      this.emit('portfolio', {});

      return {
        ok: true,
        status: 'filled',
        message: `${side === 'buy' ? 'Bought' : 'Sold'} ${formatQty(qty, a.qtyDecimals)} ${a.symbol} @ ${formatPrice(price, a.priceDecimals)}`
      };
    }

    processOpenOrders() {
      if (!this.state.openOrders.length) return;
      const remaining = [];
      let changed = false;

      // Process oldest first
      const orders = [...this.state.openOrders].reverse();
      orders.forEach((ord) => {
        const a = this.state.assets[ord.assetId];
        if (!a) return;

        const triggered =
          (ord.side === 'buy' && a.price <= ord.price) ||
          (ord.side === 'sell' && a.price >= ord.price);

        if (triggered) {
          const res = this.executeFill({
            assetId: ord.assetId,
            side: ord.side,
            price: ord.price,
            qty: ord.qty,
            orderType: 'Limit',
            fromLimit: true
          });
          if (res.ok) {
            changed = true;
            this.emit('toast', { type: 'success', message: `Limit Filled: ${res.message}` });
          } else {
            remaining.unshift(ord);
          }
        } else {
          remaining.unshift(ord);
        }
      });

      if (changed) {
        this.state.openOrders = remaining;
        this.saveState();
        this.emit('portfolio', {});
      }
    }

    cancelOrder(orderId) {
      const idx = this.state.openOrders.findIndex((o) => o.id === orderId);
      if (idx === -1) return;
      this.state.openOrders.splice(idx, 1);
      this.saveState();
      this.emit('portfolio', {});
      this.emit('toast', { type: 'info', message: 'Order cancelled.' });
    }

    sellAllHoldings() {
      const ids = Object.keys(this.state.holdings);
      if (!ids.length) return;
      // Cancel open sell orders first so full qty is available
      this.state.openOrders = this.state.openOrders.filter((o) => o.side !== 'sell');
      ids.forEach((id) => {
        const h = this.state.holdings[id];
        const a = this.state.assets[id];
        if (h && a && h.qty > 0) {
          this.executeFill({
            assetId: id,
            side: 'sell',
            price: a.price,
            qty: h.qty,
            orderType: 'Market'
          });
        }
      });
      this.emit('toast', { type: 'info', message: 'All spot positions liquidated.' });
    }

    toggleWatchlist(assetId) {
      const idx = this.state.watchlist.indexOf(assetId);
      if (idx >= 0) this.state.watchlist.splice(idx, 1);
      else this.state.watchlist.push(assetId);
      this.saveState();
      this.emit('watchlist', assetId);
    }

    isWatched(assetId) {
      return this.state.watchlist.includes(assetId);
    }

    unlockAchievement(id) {
      if (!this.state.achievements[id]) {
        this.state.achievements[id] = Date.now();
        const meta = ACHIEVEMENTS.find((x) => x.id === id);
        if (meta) {
          this.emit('toast', { type: 'info', message: `Milestone: ${meta.title}` });
        }
      }
    }

    evaluateAchievements() {
      const summary = this.getPortfolioSummary();
      let hasCrypto = false;
      let hasStock = false;
      summary.holdingRows.forEach((r) => {
        if (r.kind === 'crypto') hasCrypto = true;
        if (r.kind === 'stock') hasStock = true;
      });
      if (hasCrypto && hasStock) this.unlockAchievement('diversified');
      if (this.state.stats.totalTrades >= 10) this.unlockAchievement('ten_trades');
      if (summary.equity >= 12500) this.unlockAchievement('eq_12500');
      if (summary.equity >= 25000) this.unlockAchievement('eq_25000');
    }

    resetAccount() {
      localStorage.removeItem(STORAGE_KEY);
      this.createFreshState();
      this.emit('reset', {});
      this.emit('toast', { type: 'info', message: 'Simulator reset to $10,000.00.' });
    }
  }

  global.ApexEngine = {
    MarketEngine,
    ACHIEVEMENTS,
    FEE_RATE,
    formatPrice,
    formatUsd,
    formatCompactUsd,
    formatQty,
    roundTo
  };
})(window);
