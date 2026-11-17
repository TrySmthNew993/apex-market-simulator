# ApexEX — Crypto & Equities Market Simulator

A mobile-first browser market simulator featuring both **Crypto** and **Company Stocks**, designed with a clean, matte dark exchange UI inspired by Binance, OKX, and Bybit.

## Features
- **16 Simulated Markets**: 8 Crypto pairs (`BTC`, `ETH`, `SOL`, `BNB`, `XRP`, `DOGE`, `AVAX`, `TON`) and 8 US Company equities (`NVDA`, `AAPL`, `MSFT`, `TSLA`, `AMZN`, `GOOGL`, `META`, `JPM`).
- **Interactive Charts**: HiDPI Canvas 2D Candlestick and Line charts across `1m`, `5m`, `15m`, `1h`, and `1D` timeframes with Volume bars, MA(7)/MA(25), and touch crosshair inspection.
- **Spot Trading**: Market and Limit orders, live 6-level Order Book (tap price to fill), Recent Trades tape, and open order / position management.
- **Portfolio & Market Simulation**: `$10,000.00` starting capital, realized/unrealized PnL tracking, simulation speed controls (`Pause`, `1x`, `2x`, `5x`), time skips, dynamic news catalysts, and `localStorage` persistence.

## Run Locally
Open `index.html` directly in your browser, or run a local static server:

```bash
python3 -m http.server 8080
```
