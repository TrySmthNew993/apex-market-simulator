(function (global) {
  'use strict';

  class MarketChart {
    constructor(canvas, onInspect) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.onInspect = onInspect;
      this.candles = [];
      this.chartType = 'candle'; // 'candle' | 'line'
      this.timeframe = '1m';
      this.decimals = 2;
      this.hoverIndex = null;
      this.visibleCount = 52;

      this.resizeObserver = null;
      this.bindEvents();
    }

    bindEvents() {
      const getLocalX = (clientX) => {
        const rect = this.canvas.getBoundingClientRect();
        return clientX - rect.left;
      };

      const updateHover = (x) => {
        if (!this.candles.length) return;
        const rect = this.canvas.getBoundingClientRect();
        const plotW = Math.max(10, rect.width - 58);
        const slice = this.getVisibleSlice();
        const step = plotW / slice.length;
        const idx = Math.max(0, Math.min(slice.length - 1, Math.floor(x / step)));
        this.hoverIndex = idx;
        this.draw();
        this.emitInspect(slice, idx);
      };

      this.canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          updateHover(getLocalX(e.touches[0].clientX));
        }
      }, { passive: true });

      this.canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
          updateHover(getLocalX(e.touches[0].clientX));
        }
      }, { passive: true });

      this.canvas.addEventListener('touchend', () => {
        this.hoverIndex = null;
        this.draw();
        this.emitLatest();
      });

      this.canvas.addEventListener('mousemove', (e) => {
        updateHover(getLocalX(e.clientX));
      });

      this.canvas.addEventListener('mouseleave', () => {
        this.hoverIndex = null;
        this.draw();
        this.emitLatest();
      });

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.draw());
        this.resizeObserver.observe(this.canvas.parentElement);
      }
      window.addEventListener('resize', () => this.draw());
    }

    setData({ candles, chartType, decimals, timeframe }) {
      this.candles = candles || [];
      if (chartType) this.chartType = chartType;
      if (decimals !== undefined) this.decimals = decimals;
      if (timeframe) this.timeframe = timeframe;
      this.draw();
      if (this.hoverIndex === null) {
        this.emitLatest();
      }
    }

    formatAxisTime(ts) {
      if (!ts) return '';
      const d = new Date(ts);
      if (this.timeframe === '1D') {
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${m}/${day}`;
      }
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }

    getVisibleSlice() {
      const len = this.candles.length;
      if (len <= this.visibleCount) return this.candles;
      return this.candles.slice(len - this.visibleCount);
    }

    computeMA(fullCandles, endIdxGlobal, period) {
      if (endIdxGlobal + 1 < period) return null;
      let sum = 0;
      for (let i = endIdxGlobal - period + 1; i <= endIdxGlobal; i++) {
        sum += fullCandles[i].c;
      }
      return sum / period;
    }

    emitLatest() {
      if (!this.candles.length || !this.onInspect) return;
      const idx = this.candles.length - 1;
      const ma7 = this.computeMA(this.candles, idx, 7);
      const ma25 = this.computeMA(this.candles, idx, 25);
      this.onInspect(this.candles[idx], ma7, ma25);
    }

    emitInspect(slice, sliceIdx) {
      if (!this.onInspect || !slice[sliceIdx]) return;
      const offset = this.candles.length - slice.length;
      const globalIdx = offset + sliceIdx;
      const ma7 = this.computeMA(this.candles, globalIdx, 7);
      const ma25 = this.computeMA(this.candles, globalIdx, 25);
      this.onInspect(slice[sliceIdx], ma7, ma25);
    }

    fmt(val) {
      if (val === null || val === undefined) return '--';
      return Number(val).toFixed(this.decimals);
    }

    draw() {
      const parent = this.canvas.parentElement;
      if (!parent) return;
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      if (width <= 0 || height <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      if (this.canvas.width !== Math.round(width * dpr) || this.canvas.height !== Math.round(height * dpr)) {
        this.canvas.width = Math.round(width * dpr);
        this.canvas.height = Math.round(height * dpr);
      }

      const ctx = this.ctx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const slice = this.getVisibleSlice();
      if (!slice.length) return;

      const rightAxisW = 58;
      const padTop = 14;
      const padBottom = 18;
      const volH = Math.round(height * 0.17);
      const plotW = width - rightAxisW;
      const priceAreaH = height - padTop - padBottom - volH - 6;

      // Determine high/low range
      let maxP = -Infinity;
      let minP = Infinity;
      let maxV = 0;
      let hiIdx = 0;
      let loIdx = 0;

      slice.forEach((b, i) => {
        if (b.h > maxP) { maxP = b.h; hiIdx = i; }
        if (b.l < minP) { minP = b.l; loIdx = i; }
        if (b.v > maxV) maxV = b.v;
      });

      const range = Math.max(maxP - minP, maxP * 0.002);
      const topP = maxP + range * 0.08;
      const botP = minP - range * 0.08;
      const spanP = Math.max(1e-9, topP - botP);

      const yOf = (p) => padTop + ((topP - p) / spanP) * priceAreaH;
      const step = plotW / slice.length;
      const xOf = (i) => i * step + step * 0.5;

      // Horizontal subtle grid lines
      ctx.strokeStyle = '#181E26';
      ctx.lineWidth = 1;
      ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#5B6370';
      ctx.textAlign = 'left';

      const gridRows = 4;
      for (let g = 0; g <= gridRows; g++) {
        const y = Math.round(padTop + (priceAreaH * g) / gridRows) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(plotW, y);
        ctx.stroke();

        const pVal = topP - (spanP * g) / gridRows;
        ctx.fillText(this.fmt(pVal), plotW + 5, y + 3);
      }

      // Volume bars at bottom
      const volBaseY = height - padBottom;
      if (maxV > 0) {
        const barW = Math.max(1.5, step * 0.62);
        slice.forEach((b, i) => {
          const vh = Math.max(1, (b.v / maxV) * volH);
          const x = xOf(i) - barW / 2;
          ctx.fillStyle = b.c >= b.o ? 'rgba(14, 203, 129, 0.24)' : 'rgba(246, 70, 93, 0.24)';
          ctx.fillRect(x, volBaseY - vh, barW, vh);
        });
      }

      // Candles or Line
      const offset = this.candles.length - slice.length;
      if (this.chartType === 'candle') {
        const bodyW = Math.max(2, Math.min(9, step * 0.65));
        slice.forEach((b, i) => {
          const cx = xOf(i);
          const isUp = b.c >= b.o;
          const color = isUp ? '#0ECB81' : '#F6465D';
          const yH = yOf(b.h);
          const yL = yOf(b.l);
          const yO = yOf(b.o);
          const yC = yOf(b.c);

          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx, yH);
          ctx.lineTo(cx, yL);
          ctx.stroke();

          ctx.fillStyle = color;
          const topY = Math.min(yO, yC);
          const rectH = Math.max(1.2, Math.abs(yC - yO));
          ctx.fillRect(cx - bodyW / 2, topY, bodyW, rectH);
        });

        // Moving Averages (MA7, MA25)
        this.drawMA(ctx, slice, offset, 7, '#E5A913', xOf, yOf);
        this.drawMA(ctx, slice, offset, 25, '#7B8BA5', xOf, yOf);
      } else {
        // Clean Line + subtle fill
        ctx.beginPath();
        slice.forEach((b, i) => {
          const x = xOf(i);
          const y = yOf(b.c);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = '#EAECEF';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        ctx.lineTo(xOf(slice.length - 1), padTop + priceAreaH);
        ctx.lineTo(xOf(0), padTop + priceAreaH);
        ctx.closePath();
        ctx.fillStyle = 'rgba(234, 236, 239, 0.05)';
        ctx.fill();
      }

      // High / Low price markers
      ctx.font = '9.5px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#848E9C';
      const hiX = xOf(hiIdx);
      const hiY = yOf(maxP);
      ctx.textAlign = hiX > plotW * 0.7 ? 'right' : 'left';
      ctx.fillText(this.fmt(maxP), hiX + (hiX > plotW * 0.7 ? -4 : 4), Math.max(10, hiY - 3));

      const loX = xOf(loIdx);
      const loY = yOf(minP);
      ctx.textAlign = loX > plotW * 0.7 ? 'right' : 'left';
      ctx.fillText(this.fmt(minP), loX + (loX > plotW * 0.7 ? -4 : 4), Math.min(padTop + priceAreaH + 8, loY + 10));

      // Current live price dashed line & pill
      const lastBar = slice[slice.length - 1];
      const lastY = clampNum(yOf(lastBar.c), padTop, padTop + priceAreaH);
      const isLastUp = lastBar.c >= lastBar.o;

      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = isLastUp ? 'rgba(14, 203, 129, 0.55)' : 'rgba(246, 70, 93, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, lastY);
      ctx.lineTo(plotW, lastY);
      ctx.stroke();
      ctx.restore();

      // Right axis current price pill
      ctx.fillStyle = isLastUp ? '#0ECB81' : '#F6465D';
      ctx.fillRect(plotW + 2, lastY - 8, rightAxisW - 4, 16);
      ctx.fillStyle = isLastUp ? '#07130D' : '#FFFFFF';
      ctx.font = '600 9.5px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(this.fmt(lastBar.c), plotW + 5, lastY + 3);

      // Bottom X-axis real time labels
      ctx.font = '9.5px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#5B6370';
      ctx.textAlign = 'center';
      const labelCount = 4;
      for (let k = 0; k < labelCount; k++) {
        const idx = Math.min(slice.length - 1, Math.round((k + 0.5) * (slice.length / labelCount)));
        const bar = slice[idx];
        if (bar && bar.t) {
          ctx.fillText(this.formatAxisTime(bar.t), xOf(idx), height - 4);
        }
      }

      // Interactive Crosshair on touch/hover
      if (this.hoverIndex !== null && slice[this.hoverIndex]) {
        const hb = slice[this.hoverIndex];
        const hx = xOf(this.hoverIndex);
        const hy = yOf(hb.c);

        ctx.save();
        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = '#5B6370';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hx, padTop);
        ctx.lineTo(hx, volBaseY);
        ctx.moveTo(0, hy);
        ctx.lineTo(plotW, hy);
        ctx.stroke();
        ctx.restore();

        // Crosshair dot
        ctx.fillStyle = '#EAECEF';
        ctx.beginPath();
        ctx.arc(hx, hy, 3, 0, Math.PI * 2);
        ctx.fill();

        // Crosshair price pill
        ctx.fillStyle = '#2B3139';
        ctx.fillRect(plotW + 2, hy - 8, rightAxisW - 4, 16);
        ctx.fillStyle = '#EAECEF';
        ctx.font = '600 9.5px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(this.fmt(hb.c), plotW + 5, hy + 3);

        // Crosshair time pill on bottom axis
        if (hb.t) {
          const tStr = this.formatAxisTime(hb.t);
          const pillW = 38;
          const px = clampNum(hx - pillW / 2, 2, plotW - pillW - 2);
          ctx.fillStyle = '#2B3139';
          ctx.fillRect(px, height - 15, pillW, 13);
          ctx.fillStyle = '#EAECEF';
          ctx.textAlign = 'center';
          ctx.fillText(tStr, px + pillW / 2, height - 5);
        }
      }

      // Vertical separator for price axis
      ctx.strokeStyle = '#1C212A';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotW + 0.5, 0);
      ctx.lineTo(plotW + 0.5, height);
      ctx.stroke();
    }

    drawMA(ctx, slice, offset, period, color, xOf, yOf) {
      ctx.beginPath();
      let started = false;
      slice.forEach((_, i) => {
        const ma = this.computeMA(this.candles, offset + i, period);
        if (ma === null) return;
        const x = xOf(i);
        const y = yOf(ma);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      });
      if (started) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
    }
  }

  function clampNum(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  global.ApexChart = { MarketChart };
})(window);
