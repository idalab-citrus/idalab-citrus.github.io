/* ==========================================================================
   chart.js — 股票圖風格進步曲線 (三指標/縮放/平移/tooltip/響應式)
   ========================================================================== */
class TrendChart {
  constructor(selector, points) {
    this.container = document.querySelector(selector);
    this.container.classList.add('chart-content-mounting');
    this.all = (points || []).filter(p => p.ts).sort((a, b) => a.ts - b.ts);
    this.metric = 'ai';
    this.H = 300;
    this.pad = { l: 46, r: 16, t: 18, b: 40 };
    
    if (this.all.length) {
      this.fullMin = 0;
      this.fullMax = Math.max(1, this.all.length - 1);
    } else { 
      this.fullMin = 0; 
      this.fullMax = 1; 
    }
    
    this.dMin = this.fullMin; 
    this.dMax = this.fullMax;
    this._dragging = false;
    this._build();
    this._bindEvents();
    this.render();
    this._revealInitial();
  }

  _revealInitial() {
    if (this._hasRevealed) return;
    this._hasRevealed = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      this.container.classList.remove('chart-content-mounting');
      this.container.classList.add('chart-content-ready');
    }));
  }

  metricColor() {
    const cs = getComputedStyle(document.documentElement);
    if (this.metric === 'damage') return cs.getPropertyValue('--red').trim() || '#DC2626';
    if (this.metric === 'white') return cs.getPropertyValue('--green').trim() || '#16A34A';
    return cs.getPropertyValue('--teal').trim() || '#0F766E';
  }

  metricVal(p) { return p[this.metric]; }

  _build() {
    this.container.innerHTML = `
      <div class="chart-toolbar">
        <div class="chart-metrics">
          <button data-m="ai" class="active">${t('chart.metric_ai')}</button>
          <button data-m="damage">${t('chart.metric_damage')}</button>
          <button data-m="white">${t('chart.metric_white')}</button>
        </div>
        <div class="chart-tools">
          <span class="chart-hint">${t('chart.zoom_hint')}</span>
          <button class="chart-reset" type="button">${t('chart.reset_zoom')}</button>
        </div>
      </div>
      <div class="chart-canvas"></div>`;
    this.canvas = this.container.querySelector('.chart-canvas');
    this.container.querySelectorAll('.chart-metrics button').forEach(b => {
      b.addEventListener('click', () => {
        this.metric = b.dataset.m;
        this.container.querySelectorAll('.chart-metrics button').forEach(x => x.classList.toggle('active', x === b));
        this.render();
      });
    });
    this.container.querySelector('.chart-reset').addEventListener('click', () => this.resetZoom());
  }

  setMetric(m) { this.metric = m; this.render(); }
  resetZoom() { this.dMin = this.fullMin; this.dMax = this.fullMax; this.render(); }

  // ★ 新增：無縫更新圖表資料的方法
  updateData(points) {
    this.all = (points || []).filter(p => p.ts).sort((a, b) => a.ts - b.ts);
    if (this.all.length) {
      this.fullMin = 0;
      this.fullMax = Math.max(1, this.all.length - 1);
    } else { 
      this.fullMin = 0; 
      this.fullMax = 1; 
    }
    this.dMin = this.fullMin; 
    this.dMax = this.fullMax;
    this.render();
  }

  _visiblePoints() { 
    return this.all.filter((p, i) => i >= Math.floor(this.dMin) - 1 && i <= Math.ceil(this.dMax) + 1 && this.metricVal(p) != null); 
  }

  render() {
    if (!this.all.length) {
      this.canvas.innerHTML = `<div style="text-align:center;color:var(--ink-faint);padding:60px;font-size:14px">${t('common.empty')}</div>`;
      return;
    }
    
    const W = this.canvas.clientWidth || 760, H = this.H, pad = this.pad;
    const innerW = W - pad.l - pad.r, innerH = H - pad.t - pad.b;
    const col = this.metricColor();
    const span = (this.dMax - this.dMin) || 1;
    
    const xAt = (idx) => pad.l + ((idx - this.dMin) / span) * innerW;
    const yAt = (v) => pad.t + innerH - (v / 100) * innerH;
    const vis = this._visiblePoints();
    
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" style="display:block;cursor:${this._dragging ? 'grabbing' : 'grab'}">`;
    
    svg += `<defs>
      <clipPath id="chart-clip">
        <rect x="${pad.l}" y="-10" width="${innerW}" height="${H + 20}"/>
      </clipPath>
      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${col}" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="${col}" stop-opacity="0"/>
      </linearGradient>
    </defs>`;
    
    [0, 25, 50, 75, 100].forEach(v => {
      const y = yAt(v);
      svg += `<line x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}" stroke="var(--line)" stroke-width="1"/>`;
    });

    if (vis.length >= 1) {
      svg += `<g clip-path="url(#chart-clip)">`;
      const areaTop = vis.map(p => `${xAt(this.all.indexOf(p))},${yAt(this.metricVal(p))}`).join(' ');
      const x0 = xAt(this.all.indexOf(vis[0])), x1 = xAt(this.all.indexOf(vis[vis.length - 1])), yBase = yAt(0);
      
      svg += `<polygon points="${x0},${yBase} ${areaTop} ${x1},${yBase}" fill="url(#cg)"/>`;
      svg += `<polyline points="${areaTop}" fill="none" stroke="${col}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
      
      vis.forEach((p) => { 
        const globalIdx = this.all.indexOf(p);
        svg += `<circle class="cpt" data-i="${globalIdx}" cx="${xAt(globalIdx)}" cy="${yAt(this.metricVal(p))}" r="3.5" fill="${col}" stroke="transparent" stroke-width="16" style="cursor:pointer; transition: r 0.15s ease; pointer-events: all;"/>`; 
      });
      svg += `</g>`;
    }

    [0, 25, 50, 75, 100].forEach(v => {
      const y = yAt(v);
      svg += `<text x="${pad.l - 8}" y="${y + 4}" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="11" fill="var(--ink-faint)">${v}</text>`;
    });

    const fmt = (ts) => { const d = new Date(ts); return `${(d.getMonth() + 1)}/${d.getDate()}`; };
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const idx = this.dMin + (span * i / ticks);
      const safeIdx = Math.max(0, Math.min(this.all.length - 1, Math.round(idx)));
      const x = pad.l + (innerW * i / ticks);
      svg += `<text x="${x}" y="${H - 14}" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="10.5" fill="var(--ink-faint)">${fmt(this.all[safeIdx].ts)}</text>`;
    }
    
    svg += `</svg>`;
    
    this.canvas.innerHTML = svg;
    
    if (!this._tip) {
      this._tip = document.createElement('div'); this._tip.className = 'chart-tip';
      this.canvas.style.position = 'relative';
    }
    
    this.canvas.appendChild(this._tip); this._tip.style.display = 'none';
    
    this.canvas.querySelectorAll('.cpt').forEach(c => {
      c.addEventListener('mouseenter', () => {
        c.setAttribute('r', '5.5');
        const p = this.all[+c.dataset.i];
        const label = this.metric === 'ai' ? t('chart.metric_ai') : (this.metric === 'damage' ? t('chart.metric_damage') : t('chart.metric_white'));
        const unit = this.metric === 'ai' ? '' : '%';
        const _esc = (typeof esc === 'function') ? esc : (s => s);
        this._tip.innerHTML = `<b>${_esc(p.filename)}</b><br>${_esc((p.x || '').split(' ')[0])}<br>${label}: <b>${this.metricVal(p)}${unit}</b>`;
        this._tip.style.display = 'block';
        const cx = +c.getAttribute('cx'), cy = +c.getAttribute('cy');
        const scaleX = (this.canvas.clientWidth) / W;
        this._tip.style.left = (cx * scaleX) + 'px'; this._tip.style.top = (cy - 10) + 'px';
      });
      c.addEventListener('mouseleave', () => { 
        c.setAttribute('r', '3.5');
        this._tip.style.display = 'none'; 
      });
    });
  }

  _bindEvents() {
    this.canvas.addEventListener('wheel', (e) => {
      if (!this.all.length) return;
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const W = this.canvas.clientWidth, innerW = W - this.pad.l - this.pad.r;
      const relX = (e.clientX - rect.left - this.pad.l) / innerW;
      const span = this.dMax - this.dMin;
      const focus = this.dMin + span * Math.max(0, Math.min(1, relX));
      const factor = e.deltaY < 0 ? 0.82 : 1.22;
      let newSpan = span * factor;
      
      const minSpan = Math.max(1, Math.min(3, this.fullMax - this.fullMin)); 
      const maxSpan = this.fullMax - this.fullMin;
      
      newSpan = Math.max(minSpan, Math.min(maxSpan, newSpan));
      let nMin = focus - (focus - this.dMin) * (newSpan / span);
      let nMax = nMin + newSpan;
      
      if (nMin < this.fullMin) { nMin = this.fullMin; nMax = nMin + newSpan; }
      if (nMax > this.fullMax) { nMax = this.fullMax; nMin = nMax - newSpan; }
      
      this.dMin = nMin; this.dMax = nMax; this.render();
    }, { passive: false });

    this.canvas.addEventListener('mousedown', (e) => {
      this._dragging = true; this._dragStartX = e.clientX;
      this._dragStartDomain = { min: this.dMin, max: this.dMax };
    });

    window.addEventListener('mousemove', (e) => {
      if (!this._dragging) return;
      const W = this.canvas.clientWidth, innerW = W - this.pad.l - this.pad.r;
      const span = this._dragStartDomain.max - this._dragStartDomain.min;
      const dx = (e.clientX - this._dragStartX) / innerW * span;
      let nMin = this._dragStartDomain.min - dx, nMax = this._dragStartDomain.max - dx;
      
      if (nMin < this.fullMin) { nMin = this.fullMin; nMax = nMin + span; }
      if (nMax > this.fullMax) { nMax = this.fullMax; nMin = nMax - span; }
      
      this.dMin = nMin; this.dMax = nMax; this.render();
    });

    window.addEventListener('mouseup', () => { this._dragging = false; });
    this.canvas.addEventListener('dblclick', () => this.resetZoom());
    window.addEventListener('resize', () => this.render());
    document.addEventListener('themechange', () => this.render());
    document.addEventListener('langchange', () => { this._build(); this.render(); });
  }
}
