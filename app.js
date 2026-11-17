(function () {
  'use strict';

  const {
    MarketEngine,
    ACHIEVEMENTS,
    FEE_RATE,
    formatPrice,
    formatUsd,
    formatCompactUsd,
    formatQty,
    roundTo
  } = window.ApexEngine;

  const { MarketChart } = window.ApexChart;

  const engine = new MarketEngine();

  const ui = {
    activeView: 'markets',
    selectedAssetId: 'BTC',
    timeframe: '1m',
    chartType: 'candle',
    chartCollapsed: false,
    marketCat: 'all',
    marketSearch: '',
    marketSortKey: null, // 'name' | 'price' | 'change'
    marketSortDir: 'desc',
    sheetCat: 'all',
    sheetSearch: '',
    orderSide: 'buy',
    orderType: 'market',
    obTab: 'book',
    tradeSubtab: 'open',
    confirmResetArmed: false,
    confirmSellAllArmed: false
  };

  let chart = null;

  // DOM Cache
  const els = {
    regimePill: document.getElementById('regime-pill'),
    speedBtns: document.querySelectorAll('.speed-btn'),
    headerEquityBtn: document.getElementById('header-equity-btn'),
    headerEquityVal: document.getElementById('header-equity-val'),
    newsBar: document.getElementById('news-bar'),
    newsBarText: document.getElementById('news-bar-text'),

    views: {
      markets: document.getElementById('view-markets'),
      trade: document.getElementById('view-trade'),
      assets: document.getElementById('view-assets'),
      sim: document.getElementById('view-sim')
    },
    navItems: document.querySelectorAll('.nav-item'),

    // Markets
    ovCryptoCap: document.getElementById('ov-crypto-cap'),
    ovCryptoChg: document.getElementById('ov-crypto-chg'),
    ovStockIdx: document.getElementById('ov-stock-idx'),
    ovStockChg: document.getElementById('ov-stock-chg'),
    ovSentimentVal: document.getElementById('ov-sentiment-val'),
    ovSentimentTxt: document.getElementById('ov-sentiment-txt'),
    marketSearch: document.getElementById('market-search'),
    catTabs: document.querySelectorAll('.cat-tab'),
    sortBtns: document.querySelectorAll('.sort-btn'),
    marketList: document.getElementById('market-list'),

    // Trade Header & Chart
    pairSelectorBtn: document.getElementById('pair-selector-btn'),
    tradeSymbol: document.getElementById('trade-symbol'),
    tradeKindBadge: document.getElementById('trade-kind-badge'),
    tradePrice: document.getElementById('trade-price'),
    tradeChg: document.getElementById('trade-chg'),
    tradeFavBtn: document.getElementById('trade-fav-btn'),
    statHigh: document.getElementById('stat-high'),
    statLow: document.getElementById('stat-low'),
    statVol: document.getElementById('stat-vol'),
    statSector: document.getElementById('stat-sector'),
    tfBtns: document.querySelectorAll('.tf-btn'),
    ctypeBtns: document.querySelectorAll('.ctype-btn[data-ctype]'),
    chartCollapseBtn: document.getElementById('chart-collapse-btn'),
    chartContainer: document.getElementById('chart-container'),
    ohlcO: document.getElementById('ohlc-o'),
    ohlcH: document.getElementById('ohlc-h'),
    ohlcL: document.getElementById('ohlc-l'),
    ohlcC: document.getElementById('ohlc-c'),
    ohlcMa7: document.getElementById('ohlc-ma7'),
    ohlcMa25: document.getElementById('ohlc-ma25'),

    // Order Form
    btnSideBuy: document.getElementById('btn-side-buy'),
    btnSideSell: document.getElementById('btn-side-sell'),
    orderTypeSelect: document.getElementById('order-type'),
    priceInputWrap: document.getElementById('price-input-wrap'),
    orderPrice: document.getElementById('order-price'),
    fillBestPrice: document.getElementById('fill-best-price'),
    priceDec: document.getElementById('price-dec'),
    priceInc: document.getElementById('price-inc'),
    qtyUnitSym: document.getElementById('qty-unit-sym'),
    orderQty: document.getElementById('order-qty'),
    qtyDec: document.getElementById('qty-dec'),
    qtyInc: document.getElementById('qty-inc'),
    pctBtns: document.querySelectorAll('.pct-btn'),
    orderTotal: document.getElementById('order-total'),
    availBalance: document.getElementById('avail-balance'),
    submitOrderBtn: document.getElementById('submit-order-btn'),

    // Order Book
    obTabs: document.querySelectorAll('.ob-tab'),
    obBookPane: document.getElementById('ob-book-pane'),
    obTradesPane: document.getElementById('ob-trades-pane'),
    obAsks: document.getElementById('ob-asks'),
    obBids: document.getElementById('ob-bids'),
    obMid: document.getElementById('ob-mid'),
    recentTradesList: document.getElementById('recent-trades-list'),

    // Trade Subtabs
    subtabBtns: document.querySelectorAll('.subtab-btn'),
    openOrdersCount: document.getElementById('open-orders-count'),
    tradeSubtabContent: document.getElementById('trade-subtab-content'),

    // Assets View
    rankBadge: document.getElementById('rank-badge'),
    assetsTotalEquity: document.getElementById('assets-total-equity'),
    assetsTotalPnl: document.getElementById('assets-total-pnl'),
    assetsCash: document.getElementById('assets-cash'),
    assetsInvested: document.getElementById('assets-invested'),
    assetsRealized: document.getElementById('assets-realized'),
    assetsWinrate: document.getElementById('assets-winrate'),
    allocCash: document.getElementById('alloc-cash'),
    allocCrypto: document.getElementById('alloc-crypto'),
    allocStock: document.getElementById('alloc-stock'),
    legCash: document.getElementById('leg-cash'),
    legCrypto: document.getElementById('leg-crypto'),
    legStock: document.getElementById('leg-stock'),
    holdingsList: document.getElementById('holdings-list'),
    executionsList: document.getElementById('executions-list'),
    liquidateAllBtn: document.getElementById('liquidate-all-btn'),

    // Sim View
    simDayCounter: document.getElementById('sim-day-counter'),
    btnAdvanceHour: document.getElementById('btn-advance-hour'),
    btnAdvanceDay: document.getElementById('btn-advance-day'),
    btnTriggerNews: document.getElementById('btn-trigger-news'),
    btnResetAccount: document.getElementById('btn-reset-account'),
    achCount: document.getElementById('ach-count'),
    achievementsList: document.getElementById('achievements-list'),
    newsFeedList: document.getElementById('news-feed-list'),

    // Modal
    pairModal: document.getElementById('pair-modal'),
    closePairModal: document.getElementById('close-pair-modal'),
    sheetSearchInput: document.getElementById('sheet-search-input'),
    sheetCats: document.querySelectorAll('.sheet-cat'),
    sheetPairList: document.getElementById('sheet-pair-list'),

    toastContainer: document.getElementById('toast-container')
  };

  function showToast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    els.toastContainer.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 2600);
  }

  function switchView(viewName) {
    ui.activeView = viewName;
    Object.keys(els.views).forEach((k) => {
      els.views[k].classList.toggle('active', k === viewName);
    });
    els.navItems.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    if (viewName === 'trade') {
      renderTradeHeaderAndChart(true);
      renderOrderFormMeta();
      renderOrderBook();
      renderTradeSubtab();
      setTimeout(() => chart && chart.draw(), 30);
    } else if (viewName === 'markets') {
      renderMarkets();
    } else if (viewName === 'assets') {
      renderAssetsView();
    } else if (viewName === 'sim') {
      renderSimView();
    }
  }

  function selectAsset(assetId, goToTrade = true) {
    ui.selectedAssetId = assetId;
    const a = engine.getAsset(assetId);
    if (!a) return;

    els.orderQty.value = '';
    els.orderTotal.value = '';
    els.orderPrice.value = a.price.toFixed(a.priceDecimals);
    clearPctActive();

    if (goToTrade) {
      switchView('trade');
    } else {
      renderTradeHeaderAndChart(true);
      renderOrderFormMeta();
      renderOrderBook();
      renderTradeSubtab();
    }
  }

  function clearPctActive() {
    els.pctBtns.forEach((b) => b.classList.remove('active'));
  }

  // Header & News Bar
  function renderHeader() {
    const summary = engine.getPortfolioSummary();
    els.headerEquityVal.textContent = formatUsd(summary.equity);

    const regime = engine.state.regime;
    els.regimePill.textContent = regime;
    els.regimePill.className = 'regime-pill ' + (regime === 'BULL' ? 'bull' : regime === 'BEAR' ? 'bear' : '');

    if (engine.state.newsFeed.length) {
      els.newsBarText.textContent = engine.state.newsFeed[0].title;
    }
  }

  // Markets View
  function getFilteredSortedAssets() {
    let list = engine.getAssetsList();

    if (ui.marketCat === 'crypto') {
      list = list.filter((a) => a.kind === 'crypto');
    } else if (ui.marketCat === 'stock') {
      list = list.filter((a) => a.kind === 'stock');
    } else if (ui.marketCat === 'fav') {
      list = list.filter((a) => engine.isWatched(a.id));
    }

    const q = ui.marketSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((a) =>
        a.symbol.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.sector.toLowerCase().includes(q)
      );
    }

    if (ui.marketSortKey) {
      const dir = ui.marketSortDir === 'asc' ? 1 : -1;
      list.sort((a, b) => {
        if (ui.marketSortKey === 'name') {
          return a.symbol.localeCompare(b.symbol) * dir;
        }
        if (ui.marketSortKey === 'price') {
          return (a.price - b.price) * dir;
        }
        if (ui.marketSortKey === 'change') {
          const ca = (a.price - a.open24h) / a.open24h;
          const cb = (b.price - b.open24h) / b.open24h;
          return (ca - cb) * dir;
        }
        return 0;
      });
    }

    return list;
  }

  function renderMarketsOverview() {
    const all = engine.getAssetsList();
    let cryptoRatio = 0;
    let cryptoCount = 0;
    let stockRatio = 0;
    let stockCount = 0;

    all.forEach((a) => {
      const chg = ((a.price - a.open24h) / a.open24h) * 100;
      if (a.kind === 'crypto') {
        cryptoRatio += chg;
        cryptoCount++;
      } else {
        stockRatio += chg;
        stockCount++;
      }
    });

    const avgCrypto = cryptoRatio / Math.max(1, cryptoCount);
    const avgStock = stockRatio / Math.max(1, stockCount);

    const cryptoCap = 2.94 * (1 + avgCrypto / 100);
    const stockIdx = 5942.1 * (1 + avgStock / 100);

    els.ovCryptoCap.textContent = '$' + cryptoCap.toFixed(2) + 'T';
    els.ovCryptoChg.textContent = (avgCrypto >= 0 ? '+' : '') + avgCrypto.toFixed(2) + '%';
    els.ovCryptoChg.className = 'ov-sub tabular ' + (avgCrypto >= 0 ? 'up' : 'down');

    els.ovStockIdx.textContent = stockIdx.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    els.ovStockChg.textContent = (avgStock >= 0 ? '+' : '') + avgStock.toFixed(2) + '%';
    els.ovStockChg.className = 'ov-sub tabular ' + (avgStock >= 0 ? 'up' : 'down');

    const sent = engine.state.sentiment;
    els.ovSentimentVal.textContent = sent;
    els.ovSentimentTxt.textContent = sent >= 65 ? 'Greed' : sent <= 38 ? 'Fear' : 'Balanced';
    els.ovSentimentTxt.className = 'ov-sub ' + (sent >= 65 ? 'up' : sent <= 38 ? 'down' : 'neutral');
  }

  function renderMarkets() {
    renderMarketsOverview();
    const list = getFilteredSortedAssets();

    if (!list.length) {
      els.marketList.innerHTML = '<div class="empty-state">No matching Crypto or Company pairs found.</div>';
      return;
    }

    const html = list.map((a) => {
      const chgPct = ((a.price - a.open24h) / a.open24h) * 100;
      const isUp = chgPct >= 0;
      const avatarCls = a.kind === 'stock' ? 'ticker-avatar stock' : 'ticker-avatar';
      const kindLabel = a.kind === 'stock' ? 'STOCK' : 'CRYPTO';

      return `
        <div class="market-row" data-id="${a.id}">
          <div class="mr-left">
            <div class="${avatarCls}">${a.symbol.slice(0, 4)}</div>
            <div class="mr-names">
              <div class="mr-pair">
                <span>${a.symbol}</span><span class="mr-quote">/${a.quote}</span>
                <span class="mr-type-tag">${kindLabel}</span>
              </div>
              <div class="mr-sub">${a.name} · Vol ${formatCompactUsd(a.vol24h)}</div>
            </div>
          </div>
          <div class="mr-price-col">
            <div class="mr-price tabular">${formatPrice(a.price, a.priceDecimals)}</div>
            <div class="mr-subprice tabular">$${formatPrice(a.price, a.priceDecimals)}</div>
          </div>
          <div class="mr-chg-col">
            <div class="chg-pill tabular ${isUp ? 'up' : 'down'}">
              ${isUp ? '+' : ''}${chgPct.toFixed(2)}%
            </div>
          </div>
        </div>
      `;
    }).join('');

    els.marketList.innerHTML = html;
  }

  // Trade View
  function renderTradeHeaderAndChart(syncPriceField = false) {
    const a = engine.getAsset(ui.selectedAssetId);
    if (!a) return;

    const chgPct = ((a.price - a.open24h) / a.open24h) * 100;
    const isUp = chgPct >= 0;

    els.tradeSymbol.textContent = `${a.symbol}/${a.quote}`;
    els.tradeKindBadge.textContent = a.kind === 'stock' ? 'COMPANY' : 'CRYPTO';
    els.tradePrice.textContent = formatPrice(a.price, a.priceDecimals);
    els.tradePrice.className = 'trade-main-price tabular ' + (isUp ? 'up' : 'down');
    els.tradeChg.textContent = `${isUp ? '+' : ''}${chgPct.toFixed(2)}%`;
    els.tradeChg.className = 'trade-main-chg tabular ' + (isUp ? 'up' : 'down');

    els.tradeFavBtn.classList.toggle('fav-active', engine.isWatched(a.id));

    els.statHigh.textContent = formatPrice(a.high24h, a.priceDecimals);
    els.statLow.textContent = formatPrice(a.low24h, a.priceDecimals);
    els.statVol.textContent = formatCompactUsd(a.vol24h);
    els.statSector.textContent = a.sector;

    if (syncPriceField || ui.orderType === 'market') {
      els.orderPrice.value = a.price.toFixed(a.priceDecimals);
    }

    if (chart) {
      chart.setData({
        candles: a.candles[ui.timeframe],
        chartType: ui.chartType,
        decimals: a.priceDecimals
      });
    }
  }

  function updateOhlcReadout(bar, ma7, ma25) {
    const a = engine.getAsset(ui.selectedAssetId);
    if (!a || !bar) return;
    els.ohlcO.textContent = bar.o.toFixed(a.priceDecimals);
    els.ohlcH.textContent = bar.h.toFixed(a.priceDecimals);
    els.ohlcL.textContent = bar.l.toFixed(a.priceDecimals);
    els.ohlcC.textContent = bar.c.toFixed(a.priceDecimals);
    els.ohlcMa7.textContent = ma7 !== null ? ma7.toFixed(a.priceDecimals) : '--';
    els.ohlcMa25.textContent = ma25 !== null ? ma25.toFixed(a.priceDecimals) : '--';
  }

  function renderOrderFormMeta() {
    const a = engine.getAsset(ui.selectedAssetId);
    if (!a) return;

    els.qtyUnitSym.textContent = a.symbol;

    const isBuy = ui.orderSide === 'buy';
    els.btnSideBuy.classList.toggle('active', isBuy);
    els.btnSideSell.classList.toggle('active', !isBuy);

    els.submitOrderBtn.className = 'submit-order-btn ' + (isBuy ? 'buy' : 'sell');
    els.submitOrderBtn.textContent = `${isBuy ? 'Buy' : 'Sell'} ${a.symbol}`;

    const isLimit = ui.orderType === 'limit';
    els.orderTypeSelect.value = ui.orderType;
    els.priceInputWrap.classList.toggle('disabled', !isLimit);
    els.orderPrice.disabled = !isLimit;

    if (isBuy) {
      els.availBalance.textContent = formatUsd(engine.getAvailableCash());
    } else {
      const availQ = engine.getAvailableQty(a.id);
      els.availBalance.textContent = `${formatQty(availQ, a.qtyDecimals)} ${a.symbol}`;
    }
  }

  function getEffectiveOrderPrice() {
    const a = engine.getAsset(ui.selectedAssetId);
    if (!a) return 0;
    if (ui.orderType === 'market') return a.price;
    const p = parseFloat(els.orderPrice.value);
    return p > 0 ? p : a.price;
  }

  function syncTotalFromQty() {
    const q = parseFloat(els.orderQty.value);
    const p = getEffectiveOrderPrice();
    if (q > 0 && p > 0) {
      els.orderTotal.value = (q * p).toFixed(2);
    } else {
      els.orderTotal.value = '';
    }
  }

  function syncQtyFromTotal() {
    const a = engine.getAsset(ui.selectedAssetId);
    const tot = parseFloat(els.orderTotal.value);
    const p = getEffectiveOrderPrice();
    if (a && tot > 0 && p > 0) {
      els.orderQty.value = roundTo(tot / p, a.qtyDecimals);
    } else {
      els.orderQty.value = '';
    }
  }

  function renderOrderBook() {
    const a = engine.getAsset(ui.selectedAssetId);
    if (!a) return;

    if (ui.obTab === 'book') {
      const { asks, bids } = engine.generateOrderBook(a.id);
      els.obAsks.innerHTML = asks.map((r) => `
        <div class="ob-row ask" data-price="${r.price}">
          <div class="ob-depth-bar" style="width:${r.depthPct}%"></div>
          <span class="ob-p">${formatPrice(r.price, a.priceDecimals)}</span>
          <span class="ob-q">${formatQty(r.qty, a.qtyDecimals)}</span>
        </div>
      `).join('');

      els.obBids.innerHTML = bids.map((r) => `
        <div class="ob-row bid" data-price="${r.price}">
          <div class="ob-depth-bar" style="width:${r.depthPct}%"></div>
          <span class="ob-p">${formatPrice(r.price, a.priceDecimals)}</span>
          <span class="ob-q">${formatQty(r.qty, a.qtyDecimals)}</span>
        </div>
      `).join('');

      const isUp = a.price >= a.prevPrice;
      els.obMid.textContent = formatPrice(a.price, a.priceDecimals);
      els.obMid.className = 'ob-mid-price tabular ' + (isUp ? 'up' : 'down');
    } else {
      els.recentTradesList.innerHTML = a.recentTrades.map((t) => {
        const dt = new Date(t.time);
        const ts = dt.toTimeString().slice(0, 8);
        return `
          <div class="rt-row">
            <span class="${t.side === 'buy' ? 'up' : 'down'}">${formatPrice(t.price, a.priceDecimals)}</span>
            <span>${formatQty(t.qty, a.qtyDecimals)}</span>
            <span class="rt-time">${ts}</span>
          </div>
        `;
      }).join('');
    }
  }

  function renderTradeSubtab() {
    const openOrders = engine.state.openOrders;
    els.openOrdersCount.textContent = openOrders.length;

    els.subtabBtns.forEach((b) => {
      b.classList.toggle('active', b.dataset.subtab === ui.tradeSubtab);
    });

    if (ui.tradeSubtab === 'open') {
      if (!openOrders.length) {
        els.tradeSubtabContent.innerHTML = '<div class="empty-state">No open limit orders.</div>';
        return;
      }
      els.tradeSubtabContent.innerHTML = openOrders.map((o) => {
        const a = engine.getAsset(o.assetId);
        return `
          <div class="order-card">
            <div class="oc-top">
              <div class="oc-title">
                <span>${a.symbol}/${a.quote}</span>
                <span class="side-pill ${o.side}">${o.side.toUpperCase()} LIMIT</span>
              </div>
              <button class="btn-outline-sm cancel-order-btn" data-oid="${o.id}">Cancel</button>
            </div>
            <div class="oc-grid">
              <div class="metric-cell"><span>Limit Price</span><strong class="tabular">${formatPrice(o.price, a.priceDecimals)}</strong></div>
              <div class="metric-cell"><span>Amount</span><strong class="tabular">${formatQty(o.qty, a.qtyDecimals)}</strong></div>
              <div class="metric-cell"><span>Mark Price</span><strong class="tabular">${formatPrice(a.price, a.priceDecimals)}</strong></div>
            </div>
          </div>
        `;
      }).join('');
    } else if (ui.tradeSubtab === 'holding') {
      const a = engine.getAsset(ui.selectedAssetId);
      const h = engine.state.holdings[a.id];
      if (!h || h.qty <= 1e-9) {
        els.tradeSubtabContent.innerHTML = `<div class="empty-state">No active ${a.symbol} position.</div>`;
        return;
      }
      const val = h.qty * a.price;
      const pnl = (a.price - h.avgPrice) * h.qty;
      const pnlPct = h.avgPrice > 0 ? ((a.price - h.avgPrice) / h.avgPrice) * 100 : 0;
      const isUp = pnl >= 0;

      els.tradeSubtabContent.innerHTML = `
        <div class="holding-card">
          <div class="hc-top">
            <div class="hc-title">
              <span>${a.symbol}/${a.quote}</span>
              <span class="kind-badge">${a.kind.toUpperCase()}</span>
            </div>
            <button class="btn-outline-sm quick-close-btn" data-id="${a.id}">Close 100%</button>
          </div>
          <div class="hc-grid">
            <div class="metric-cell"><span>Size</span><strong class="tabular">${formatQty(h.qty, a.qtyDecimals)}</strong></div>
            <div class="metric-cell"><span>Avg Entry</span><strong class="tabular">${formatPrice(h.avgPrice, a.priceDecimals)}</strong></div>
            <div class="metric-cell"><span>Unrealized PnL</span><strong class="tabular ${isUp ? 'up' : 'down'}">${isUp ? '+' : ''}${formatUsd(pnl)} (${pnlPct.toFixed(2)}%)</strong></div>
          </div>
        </div>
      `;
    } else {
      const hist = engine.state.tradeHistory.slice(0, 12);
      if (!hist.length) {
        els.tradeSubtabContent.innerHTML = '<div class="empty-state">No executed trades yet.</div>';
        return;
      }
      els.tradeSubtabContent.innerHTML = hist.map((t) => renderExecCard(t)).join('');
    }
  }

  function renderExecCard(t) {
    const a = engine.getAsset(t.assetId);
    const dec = a ? a.priceDecimals : 2;
    const qdec = a ? a.qtyDecimals : 3;
    const dt = new Date(t.time).toTimeString().slice(0, 8);
    const pnlHtml = t.realizedPnl !== null
      ? `<strong class="tabular ${t.realizedPnl >= 0 ? 'up' : 'down'}">${t.realizedPnl >= 0 ? '+' : ''}${formatUsd(t.realizedPnl)}</strong>`
      : `<strong class="tabular">${formatUsd(t.price * t.qty)}</strong>`;
    const thirdLabel = t.realizedPnl !== null ? 'Realized PnL' : 'Notional';

    return `
      <div class="exec-card">
        <div class="oc-top">
          <div class="oc-title">
            <span>${t.symbol}/${t.quote}</span>
            <span class="side-pill ${t.side}">${t.side.toUpperCase()} · ${t.orderType}</span>
          </div>
          <span class="muted-sub tabular">${dt}</span>
        </div>
        <div class="oc-grid">
          <div class="metric-cell"><span>Fill Price</span><strong class="tabular">${formatPrice(t.price, dec)}</strong></div>
          <div class="metric-cell"><span>Amount</span><strong class="tabular">${formatQty(t.qty, qdec)}</strong></div>
          <div class="metric-cell"><span>${thirdLabel}</span>${pnlHtml}</div>
        </div>
      </div>
    `;
  }

  // Assets View
  function renderAssetsView() {
    const summary = engine.getPortfolioSummary();
    const stats = engine.state.stats;

    els.rankBadge.textContent = engine.getRank(summary.equity);
    els.assetsTotalEquity.textContent = formatUsd(summary.equity);

    const isUp = summary.totalPnl >= 0;
    els.assetsTotalPnl.textContent = `${isUp ? '+' : ''}${formatUsd(summary.totalPnl)} (${isUp ? '+' : ''}${summary.totalPnlPct.toFixed(2)}%)`;
    els.assetsTotalPnl.className = 'pnl-val tabular ' + (isUp ? 'up' : 'down');

    els.assetsCash.textContent = formatUsd(summary.availableCash);
    els.assetsInvested.textContent = formatUsd(summary.invested);

    const rUp = stats.realizedPnl >= 0;
    els.assetsRealized.textContent = `${rUp ? '+' : ''}${formatUsd(stats.realizedPnl)}`;
    els.assetsRealized.className = 'tabular ' + (stats.realizedPnl === 0 ? '' : rUp ? 'up' : 'down');

    if (stats.closingTrades > 0) {
      const wr = Math.round((stats.winningTrades / stats.closingTrades) * 100);
      els.assetsWinrate.textContent = `${wr}% (${stats.winningTrades}/${stats.closingTrades})`;
    } else {
      els.assetsWinrate.textContent = '--';
    }

    const eq = Math.max(1, summary.equity);
    const pCash = Math.round((summary.cash / eq) * 100);
    const pCrypto = Math.round((summary.cryptoVal / eq) * 100);
    const pStock = Math.max(0, 100 - pCash - pCrypto);

    els.allocCash.style.width = `${pCash}%`;
    els.allocCrypto.style.width = `${pCrypto}%`;
    els.allocStock.style.width = `${pStock}%`;
    els.legCash.textContent = `${pCash}%`;
    els.legCrypto.textContent = `${pCrypto}%`;
    els.legStock.textContent = `${pStock}%`;

    if (!summary.holdingRows.length) {
      els.holdingsList.innerHTML = '<div class="empty-state">No open holdings. Head to Markets or Trade to allocate capital.</div>';
    } else {
      els.holdingsList.innerHTML = summary.holdingRows.map((r) => {
        const a = engine.getAsset(r.assetId);
        const hUp = r.pnl >= 0;
        return `
          <div class="holding-card">
            <div class="hc-top">
              <div class="hc-title">
                <span>${r.symbol}/${r.quote}</span>
                <span class="kind-badge">${r.kind === 'stock' ? 'COMPANY' : 'CRYPTO'}</span>
              </div>
              <div class="hc-actions">
                <button class="btn-outline-sm asset-trade-btn" data-id="${r.assetId}">Trade</button>
                <button class="btn-outline-sm quick-close-btn" data-id="${r.assetId}">Sell</button>
              </div>
            </div>
            <div class="hc-grid">
              <div class="metric-cell"><span>Value / Qty</span><strong class="tabular">${formatUsd(r.marketVal)} (${formatQty(r.qty, a.qtyDecimals)})</strong></div>
              <div class="metric-cell"><span>Avg / Last</span><strong class="tabular">${formatPrice(r.avgPrice, a.priceDecimals)} / ${formatPrice(r.currentPrice, a.priceDecimals)}</strong></div>
              <div class="metric-cell"><span>PnL</span><strong class="tabular ${hUp ? 'up' : 'down'}">${hUp ? '+' : ''}${formatUsd(r.pnl)} (${r.pnlPct.toFixed(2)}%)</strong></div>
            </div>
          </div>
        `;
      }).join('');
    }

    const hist = engine.state.tradeHistory.slice(0, 15);
    if (!hist.length) {
      els.executionsList.innerHTML = '<div class="empty-state">No trade executions recorded yet.</div>';
    } else {
      els.executionsList.innerHTML = hist.map((t) => renderExecCard(t)).join('');
    }
  }

  // Sim / Feed View
  function renderSimView() {
    const simDays = Math.floor(engine.state.tickCount / 240) + 1;
    els.simDayCounter.textContent = `Day ${simDays}`;

    const unlocked = engine.state.achievements;
    const count = Object.keys(unlocked).length;
    els.achCount.textContent = `${count} / ${ACHIEVEMENTS.length}`;

    els.achievementsList.innerHTML = ACHIEVEMENTS.map((a) => {
      const done = Boolean(unlocked[a.id]);
      return `
        <div class="ach-item ${done ? 'unlocked' : ''}">
          <div>
            <div class="ach-title">${a.title}</div>
            <div class="ach-desc">${a.desc}</div>
          </div>
          <div class="ach-status">${done ? 'UNLOCKED' : 'LOCKED'}</div>
        </div>
      `;
    }).join('');

    els.newsFeedList.innerHTML = engine.state.newsFeed.map((n) => {
      const tagCls = n.impact > 0 ? 'pos' : n.impact < 0 ? 'neg' : '';
      const timeStr = new Date(n.time).toTimeString().slice(0, 5);
      return `
        <div class="news-item">
          <div class="ni-head">
            <span class="ni-tag ${tagCls}">${n.scope}</span>
            <span>${timeStr}</span>
          </div>
          <div class="ni-title">${n.title}</div>
          <div class="ni-desc">${n.desc}</div>
        </div>
      `;
    }).join('');
  }

  // Bottom Sheet Modal
  function openPairModal() {
    els.pairModal.classList.add('open');
    els.pairModal.setAttribute('aria-hidden', 'false');
    renderSheetList();
  }

  function closePairModal() {
    els.pairModal.classList.remove('open');
    els.pairModal.setAttribute('aria-hidden', 'true');
  }

  function renderSheetList() {
    let list = engine.getAssetsList();
    if (ui.sheetCat !== 'all') {
      list = list.filter((a) => a.kind === ui.sheetCat);
    }
    const q = ui.sheetSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((a) =>
        a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
      );
    }

    els.sheetPairList.innerHTML = list.map((a) => {
      const chg = ((a.price - a.open24h) / a.open24h) * 100;
      const isUp = chg >= 0;
      return `
        <div class="sheet-pair-row" data-id="${a.id}">
          <div>
            <strong>${a.symbol}/${a.quote}</strong>
            <span class="kind-badge">${a.kind === 'stock' ? 'COMPANY' : 'CRYPTO'}</span>
            <div class="muted-sub">${a.name}</div>
          </div>
          <div style="text-align:right">
            <div class="tabular" style="font-weight:600">${formatPrice(a.price, a.priceDecimals)}</div>
            <div class="tabular ${isUp ? 'up' : 'down'}" style="font-size:11px">${isUp ? '+' : ''}${chg.toFixed(2)}%</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Bind UI Events
  function bindEvents() {
    // Bottom Navigation
    els.navItems.forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    els.headerEquityBtn.addEventListener('click', () => switchView('assets'));
    els.newsBar.addEventListener('click', () => switchView('sim'));

    // Speed buttons
    els.speedBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const spd = Number(btn.dataset.speed);
        engine.setSpeed(spd);
        els.speedBtns.forEach((b) => b.classList.toggle('active', Number(b.dataset.speed) === spd));
      });
    });

    // Markets filter & search & sort
    els.marketSearch.addEventListener('input', (e) => {
      ui.marketSearch = e.target.value;
      renderMarkets();
    });

    els.catTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        ui.marketCat = tab.dataset.cat;
        els.catTabs.forEach((t) => t.classList.toggle('active', t === tab));
        renderMarkets();
      });
    });

    els.sortBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.sort;
        if (ui.marketSortKey === key) {
          ui.marketSortDir = ui.marketSortDir === 'desc' ? 'asc' : 'desc';
        } else {
          ui.marketSortKey = key;
          ui.marketSortDir = key === 'name' ? 'asc' : 'desc';
        }
        els.sortBtns.forEach((b) => b.classList.toggle('active', b === btn));
        renderMarkets();
      });
    });

    els.marketList.addEventListener('click', (e) => {
      const row = e.target.closest('.market-row');
      if (row) selectAsset(row.dataset.id, true);
    });

    // Trade Pair Modal & Favorite
    els.pairSelectorBtn.addEventListener('click', openPairModal);
    els.closePairModal.addEventListener('click', closePairModal);
    els.pairModal.addEventListener('click', (e) => {
      if (e.target === els.pairModal) closePairModal();
    });

    els.sheetSearchInput.addEventListener('input', (e) => {
      ui.sheetSearch = e.target.value;
      renderSheetList();
    });

    els.sheetCats.forEach((btn) => {
      btn.addEventListener('click', () => {
        ui.sheetCat = btn.dataset.scat;
        els.sheetCats.forEach((b) => b.classList.toggle('active', b === btn));
        renderSheetList();
      });
    });

    els.sheetPairList.addEventListener('click', (e) => {
      const row = e.target.closest('.sheet-pair-row');
      if (row) {
        closePairModal();
        selectAsset(row.dataset.id, true);
      }
    });

    els.tradeFavBtn.addEventListener('click', () => {
      engine.toggleWatchlist(ui.selectedAssetId);
      renderTradeHeaderAndChart(false);
    });

    // Chart Controls
    els.tfBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        ui.timeframe = btn.dataset.tf;
        els.tfBtns.forEach((b) => b.classList.toggle('active', b === btn));
        renderTradeHeaderAndChart(false);
      });
    });

    els.ctypeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        ui.chartType = btn.dataset.ctype;
        els.ctypeBtns.forEach((b) => b.classList.toggle('active', b === btn));
        renderTradeHeaderAndChart(false);
      });
    });

    els.chartCollapseBtn.addEventListener('click', () => {
      ui.chartCollapsed = !ui.chartCollapsed;
      els.chartContainer.classList.toggle('collapsed', ui.chartCollapsed);
      els.chartCollapseBtn.textContent = ui.chartCollapsed ? '▸' : '▾';
      if (!ui.chartCollapsed) setTimeout(() => chart && chart.draw(), 30);
    });

    // Order Entry Controls
    els.btnSideBuy.addEventListener('click', () => {
      ui.orderSide = 'buy';
      els.orderQty.value = '';
      els.orderTotal.value = '';
      clearPctActive();
      renderOrderFormMeta();
    });

    els.btnSideSell.addEventListener('click', () => {
      ui.orderSide = 'sell';
      els.orderQty.value = '';
      els.orderTotal.value = '';
      clearPctActive();
      renderOrderFormMeta();
    });

    els.orderTypeSelect.addEventListener('change', (e) => {
      ui.orderType = e.target.value;
      const a = engine.getAsset(ui.selectedAssetId);
      if (a && ui.orderType === 'limit') {
        els.orderPrice.value = a.price.toFixed(a.priceDecimals);
      }
      renderOrderFormMeta();
      syncTotalFromQty();
    });

    els.fillBestPrice.addEventListener('click', () => {
      const a = engine.getAsset(ui.selectedAssetId);
      if (!a) return;
      if (ui.orderType !== 'limit') {
        ui.orderType = 'limit';
        renderOrderFormMeta();
      }
      els.orderPrice.value = a.price.toFixed(a.priceDecimals);
      syncTotalFromQty();
    });

    els.priceDec.addEventListener('click', () => stepPrice(-1));
    els.priceInc.addEventListener('click', () => stepPrice(1));
    els.qtyDec.addEventListener('click', () => stepQty(-1));
    els.qtyInc.addEventListener('click', () => stepQty(1));

    els.orderPrice.addEventListener('input', () => syncTotalFromQty());
    els.orderQty.addEventListener('input', () => {
      clearPctActive();
      syncTotalFromQty();
    });
    els.orderTotal.addEventListener('input', () => {
      clearPctActive();
      syncQtyFromTotal();
    });

    els.pctBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const pct = parseFloat(btn.dataset.pct);
        const a = engine.getAsset(ui.selectedAssetId);
        if (!a) return;

        els.pctBtns.forEach((b) => b.classList.toggle('active', b === btn));
        const p = getEffectiveOrderPrice();
        if (p <= 0) return;

        if (ui.orderSide === 'buy') {
          const availCash = engine.getAvailableCash();
          const spendable = (availCash * pct) / (1 + FEE_RATE);
          const rawQty = spendable / p;
          const stepFloor = Math.pow(10, a.qtyDecimals);
          const qty = Math.floor(rawQty * stepFloor) / stepFloor;
          els.orderQty.value = qty > 0 ? qty : '';
          syncTotalFromQty();
        } else {
          const availQty = engine.getAvailableQty(a.id);
          const stepFloor = Math.pow(10, a.qtyDecimals);
          const qty = Math.floor(availQty * pct * stepFloor) / stepFloor;
          els.orderQty.value = qty > 0 ? qty : '';
          syncTotalFromQty();
        }
      });
    });

    els.submitOrderBtn.addEventListener('click', () => {
      const a = engine.getAsset(ui.selectedAssetId);
      if (!a) return;
      const qty = parseFloat(els.orderQty.value);
      const price = parseFloat(els.orderPrice.value);

      const res = engine.placeOrder({
        assetId: a.id,
        side: ui.orderSide,
        type: ui.orderType,
        price,
        qty
      });

      if (res.ok) {
        showToast(res.message, 'success');
        els.orderQty.value = '';
        els.orderTotal.value = '';
        clearPctActive();
        renderOrderFormMeta();
        renderTradeSubtab();
        renderHeader();
      } else {
        showToast(res.error, 'error');
      }
    });

    // Order Book Tabs & Price Click-to-Fill
    els.obTabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        ui.obTab = btn.dataset.obtab;
        els.obTabs.forEach((b) => b.classList.toggle('active', b === btn));
        els.obBookPane.classList.toggle('active', ui.obTab === 'book');
        els.obTradesPane.classList.toggle('active', ui.obTab === 'trades');
        renderOrderBook();
      });
    });

    const handleObClick = (e) => {
      const row = e.target.closest('.ob-row');
      if (!row) return;
      const p = parseFloat(row.dataset.price);
      const a = engine.getAsset(ui.selectedAssetId);
      if (!a || isNaN(p)) return;
      if (ui.orderType !== 'limit') {
        ui.orderType = 'limit';
        renderOrderFormMeta();
      }
      els.orderPrice.value = p.toFixed(a.priceDecimals);
      syncTotalFromQty();
    };
    els.obAsks.addEventListener('click', handleObClick);
    els.obBids.addEventListener('click', handleObClick);

    // Trade Subtabs & Actions
    els.subtabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        ui.tradeSubtab = btn.dataset.subtab;
        renderTradeSubtab();
      });
    });

    els.tradeSubtabContent.addEventListener('click', (e) => {
      const cancelBtn = e.target.closest('.cancel-order-btn');
      if (cancelBtn) {
        engine.cancelOrder(cancelBtn.dataset.oid);
        renderOrderFormMeta();
        renderTradeSubtab();
        return;
      }
      const closeBtn = e.target.closest('.quick-close-btn');
      if (closeBtn) {
        closeSingleHolding(closeBtn.dataset.id);
      }
    });

    // Assets View Actions
    els.holdingsList.addEventListener('click', (e) => {
      const tradeBtn = e.target.closest('.asset-trade-btn');
      if (tradeBtn) {
        selectAsset(tradeBtn.dataset.id, true);
        return;
      }
      const closeBtn = e.target.closest('.quick-close-btn');
      if (closeBtn) {
        closeSingleHolding(closeBtn.dataset.id);
      }
    });

    els.liquidateAllBtn.addEventListener('click', () => {
      const summary = engine.getPortfolioSummary();
      if (!summary.holdingRows.length) return;
      if (!ui.confirmSellAllArmed) {
        ui.confirmSellAllArmed = true;
        els.liquidateAllBtn.textContent = 'Confirm Sell All?';
        els.liquidateAllBtn.classList.add('down');
        setTimeout(() => {
          ui.confirmSellAllArmed = false;
          els.liquidateAllBtn.textContent = 'Sell All';
          els.liquidateAllBtn.classList.remove('down');
        }, 3000);
        return;
      }
      ui.confirmSellAllArmed = false;
      els.liquidateAllBtn.textContent = 'Sell All';
      els.liquidateAllBtn.classList.remove('down');
      engine.sellAllHoldings();
      renderAssetsView();
      renderHeader();
    });

    // Sim Hub Actions
    els.btnAdvanceHour.addEventListener('click', () => engine.advanceTicks(12, '1 Hour'));
    els.btnAdvanceDay.addEventListener('click', () => engine.advanceTicks(80, '1 Day'));
    els.btnTriggerNews.addEventListener('click', () => engine.triggerCatalyst(true));

    els.btnResetAccount.addEventListener('click', () => {
      if (!ui.confirmResetArmed) {
        ui.confirmResetArmed = true;
        els.btnResetAccount.textContent = 'Tap Again to Reset';
        setTimeout(() => {
          ui.confirmResetArmed = false;
          els.btnResetAccount.textContent = 'Reset Account';
        }, 3000);
        return;
      }
      ui.confirmResetArmed = false;
      els.btnResetAccount.textContent = 'Reset Account';
      engine.resetAccount();
      selectAsset(ui.selectedAssetId, false);
      renderHeader();
      renderAssetsView();
      renderSimView();
    });
  }

  function stepPrice(dir) {
    if (ui.orderType !== 'limit') return;
    const a = engine.getAsset(ui.selectedAssetId);
    if (!a) return;
    const curr = parseFloat(els.orderPrice.value) || a.price;
    const step = Math.max(Math.pow(10, -a.priceDecimals), curr * 0.002);
    const next = Math.max(Math.pow(10, -a.priceDecimals), curr + dir * step);
    els.orderPrice.value = next.toFixed(a.priceDecimals);
    syncTotalFromQty();
  }

  function stepQty(dir) {
    const a = engine.getAsset(ui.selectedAssetId);
    if (!a) return;
    const curr = parseFloat(els.orderQty.value) || 0;
    const step = Math.max(Math.pow(10, -a.qtyDecimals), (100 / a.price));
    const next = Math.max(0, roundTo(curr + dir * step, a.qtyDecimals));
    els.orderQty.value = next > 0 ? next : '';
    clearPctActive();
    syncTotalFromQty();
  }

  function closeSingleHolding(assetId) {
    const a = engine.getAsset(assetId);
    const avail = engine.getAvailableQty(assetId);
    if (!a || avail <= 1e-9) {
      showToast('Available balance is locked in open orders.', 'error');
      return;
    }
    const res = engine.placeOrder({
      assetId,
      side: 'sell',
      type: 'market',
      qty: avail
    });
    if (res.ok) {
      showToast(res.message, 'success');
      renderHeader();
      if (ui.activeView === 'trade') {
        renderOrderFormMeta();
        renderTradeSubtab();
      } else if (ui.activeView === 'assets') {
        renderAssetsView();
      }
    } else {
      showToast(res.error, 'error');
    }
  }

  // Engine Subscriptions
  engine.subscribe((eventType, payload) => {
    if (eventType === 'tick') {
      renderHeader();
      if (ui.activeView === 'markets') {
        renderMarkets();
      } else if (ui.activeView === 'trade') {
        renderTradeHeaderAndChart(false);
        renderOrderBook();
        if (ui.tradeSubtab === 'holding' || ui.tradeSubtab === 'open') {
          renderTradeSubtab();
        }
      } else if (ui.activeView === 'assets') {
        renderAssetsView();
      } else if (ui.activeView === 'sim') {
        const simDays = Math.floor(engine.state.tickCount / 240) + 1;
        els.simDayCounter.textContent = `Day ${simDays}`;
      }
      if (els.pairModal.classList.contains('open')) {
        renderSheetList();
      }
    } else if (eventType === 'portfolio') {
      renderHeader();
      if (ui.activeView === 'trade') {
        renderOrderFormMeta();
        renderTradeSubtab();
      } else if (ui.activeView === 'assets') {
        renderAssetsView();
      }
    } else if (eventType === 'news') {
      renderHeader();
      if (ui.activeView === 'sim') renderSimView();
    } else if (eventType === 'toast') {
      showToast(payload.message, payload.type);
    }
  });

  // Boot
  function init() {
    chart = new MarketChart(document.getElementById('price-chart'), updateOhlcReadout);
    bindEvents();
    renderHeader();
    renderMarkets();
    const initAsset = engine.getAsset(ui.selectedAssetId);
    if (initAsset) {
      els.orderPrice.value = initAsset.price.toFixed(initAsset.priceDecimals);
    }
    engine.start();
  }

  init();
})();
