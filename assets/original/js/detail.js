/* ==========================================================================
   detail.js — 點擊紀錄列 → 彈出該影像的完整偵測詳情
   ==========================================================================
   即時呼叫 /api/analysis/<id>/detail (後端用原圖重跑 pipeline)
   顯示：大圖 4 格視覺化 + 評分圓環 + 完整特徵
   ========================================================================== */

// gradeText / scoreColor / feedbackFor 定義於 ui.js (全站共用)

// 確保 modal 容器存在
function _ensureModal() {
  let m = document.getElementById('detailModal');
  if (m) return m;
  m = document.createElement('div');
  m.id = 'detailModal';
  m.className = 'detail-modal';
  m.innerHTML = `
    <div class="detail-backdrop"></div>
    <div class="detail-dialog">
      <button class="detail-close" aria-label="關閉">✕</button>
      <div class="detail-content" id="detailContent"></div>
    </div>`;
  document.body.appendChild(m);
  // 關閉事件
  m.querySelector('.detail-backdrop').addEventListener('click', closeDetailModal);
  m.querySelector('.detail-close').addEventListener('click', closeDetailModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDetailModal(); });
  return m;
}

function closeDetailModal() {
  const m = document.getElementById('detailModal');
  if (m) m.classList.remove('show');
}

async function openDetailModal(analysisId) {
  const m = _ensureModal();
  const content = m.querySelector('#detailContent');
  content.innerHTML = `<div class="detail-loading" role="status" aria-live="polite"><div class="spinner" aria-hidden="true"></div><p>${t('detail.analyzing')}</p></div>`;
  m.classList.add('show');

  try {
    const res = await apiFetch(`/api/analysis/${analysisId}/detail`);
    const d = await res.json();
    if (!d.ok) {
      content.innerHTML = `<div class="detail-loading"><p style="color:var(--red)">${esc(d.error || '分析失敗')}</p></div>`;
      return;
    }
    content.innerHTML = _cardHTML(d);
    // 圓環 + 分數 count-up 動畫
    requestAnimationFrame(() => {
      const ring = content.querySelector('.ring circle:last-child');
      const circ = 2 * Math.PI * 46;
      if (ring) ring.style.strokeDashoffset = circ * (1 - d.ai_score / 100);
      animateCount(content.querySelector('.ring-num'), Math.round(d.ai_score), { decimals: 0, duration: 1000 });
      content.querySelectorAll('.feat-bar i').forEach(bar => {
        const w = bar.style.width; bar.style.width = '0'; requestAnimationFrame(() => bar.style.width = w);
      });
    });
    // 點圖開啟檢視器 (4 視圖切換 + 偵測前後對比)
    const views = [
      { src: d.images.original, label: t('detail.orig'),       color: '#94A3B8' },
      { src: d.images.roi,      label: t('detail.roi'),        color: '#14B8A6' },
      { src: d.images.white,    label: t('detail.white_det'),  color: '#22C55E', compareWith: d.images.roi },
      { src: d.images.damage,   label: t('detail.damage_det'), color: '#EF4444', compareWith: d.images.roi },
    ];
    content.querySelectorAll('.quad-cell').forEach((cell, qi) => {
      cell.addEventListener('click', () => openLightbox(views, qi));
    });
  } catch (e) {
    if (e.message === 'AUTH_401') { closeDetailModal(); return; }
    content.innerHTML = `<div class="detail-loading"><p style="color:var(--red)">連線錯誤：${esc(e.message)}</p></div>`;
  }
}

function _cardHTML(d) {
  const isVerify = d.doctor_score != null;
  const col = scoreColor(d.ai_score);
  const circ = 2 * Math.PI * 46;
  const f = d.features;

  const isStaff = !!window.IS_STAFF;
  // 驗證模式指標 (AI vs 醫師) 只給醫師/助教看；學生的紀錄不會有醫師分數
  let compare = '';
  if (isVerify && isStaff) {
    const delta = Math.abs(d.ai_score - d.doctor_score);
    const ok = delta <= 12.5;
    compare = `<div class="score-compare">
      <div class="row"><span>${t('detail.doctor_score')}</span><span class="mono">${d.doctor_score}</span></div>
      <div class="row"><span>${t('detail.abs_error')}</span><span class="delta ${ok ? 'delta-ok' : 'delta-warn'}">${delta.toFixed(1)} ${t('detail.points')}</span></div>
    </div>`;
  }
  return `
    <div class="detail-header">
      <div>
        <div class="detail-fname">${esc(d.filename)}</div>
        <div class="detail-meta">${d.owner ? esc(d.owner) + ' · ' : ''}${esc(d.created_at) || ''}　${t('detail.title')}</div>
      </div>
      ${isStaff ? `<span class="mode-tag ${isVerify ? 'mode-verify' : 'mode-predict'}">${isVerify ? t('mode.verify_full') : t('mode.predict_full')}</span>` : ''}
    </div>
    <div class="detail-body">
      <div class="quad">
        <div class="quad-cell"><img src="${d.images.original}" data-full="${d.images.original}"><div class="quad-label"><span class="dot" style="background:#94A3B8"></span>${t('detail.orig')}</div></div>
        <div class="quad-cell"><img src="${d.images.roi}" data-full="${d.images.roi}"><div class="quad-label"><span class="dot" style="background:#14B8A6"></span>${t('detail.roi')}</div></div>
        <div class="quad-cell"><img src="${d.images.white}" data-full="${d.images.white}"><div class="quad-label"><span class="dot" style="background:#22C55E"></span>${t('detail.white_det')}</div></div>
        <div class="quad-cell"><img src="${d.images.damage}" data-full="${d.images.damage}"><div class="quad-label"><span class="dot" style="background:#EF4444"></span>${t('detail.damage_det')}</div></div>
      </div>
      <div class="panel">
        <div class="score-block">
          <div class="ring${d.ai_score >= 88 ? ' celebrate' : ''}">
            <svg width="104" height="104">
              <circle cx="52" cy="52" r="46" fill="none" stroke="var(--line-soft)" stroke-width="9"/>
              <circle cx="52" cy="52" r="46" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ}" style="transition:stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)"/>
            </svg>
            <div class="ring-val"><div class="ring-num" style="color:${col}">${Math.round(d.ai_score)}</div><div class="ring-unit">AI Score</div></div>
          </div>
          <div class="score-meta">
            <div class="label">${t('detail.summary')}</div>
            <div class="grade" style="color:${col}">${gradeText(d.ai_score)}</div>
            ${compare}
          </div>
        </div>
        <div class="features">
          <div class="feat-group">
            <div class="feat-gtitle"><span class="gdot" style="background:var(--red)"></span>${t('detail.damage_feat')}</div>
            <div class="feat-row"><span class="fname">${t('detail.damage_ratio')}</span><span class="fval" style="color:var(--red)">${(f.Damage_Ratio * 100).toFixed(1)}%</span></div>
            <div class="feat-bar"><i style="width:${Math.min(f.Damage_Ratio * 100 * 2.5, 100)}%;background:var(--red)"></i></div>
            <div class="feat-row"><span class="fname">${t('detail.damage_count')}</span><span class="fval">${f.Damage_Count}</span></div>
          </div>
          <div class="feat-group">
            <div class="feat-gtitle"><span class="gdot" style="background:var(--green)"></span>${t('detail.white_feat')}</div>
            <div class="feat-row"><span class="fname">${t('detail.white_ratio')}</span><span class="fval" style="color:var(--green)">${(f.White_Ratio * 100).toFixed(1)}%</span></div>
            <div class="feat-bar"><i style="width:${Math.min(f.White_Ratio * 100 * 2, 100)}%;background:var(--green)"></i></div>
            <div class="feat-row"><span class="fname">${t('detail.white_count')}</span><span class="fval">${f.White_Count}</span></div>
          </div>
        </div>
      </div>
    </div>`;
}
