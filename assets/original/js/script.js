/* ==========================================================================
   AI 增強影像評分系統 — 前端邏輯
   ========================================================================== */

const dropzone   = document.getElementById('dropzone');
const fileInput  = document.getElementById('fileInput');
const progress   = document.getElementById('progress');
const summary    = document.getElementById('summary');
const cardsWrap  = document.getElementById('cards');

// scoreColor / gradeText / feedbackFor 定義於 ui.js (全站共用)

// ── 上傳觸發 ──
dropzone.addEventListener('click', ()=>fileInput.click());
fileInput.addEventListener('change', e=>{
  if(e.target.files.length) handleFiles(e.target.files);
  e.target.value = '';   // 允許連續選同一個檔
});
// 手機直接拍照 (capture=environment 開後鏡頭)；stopPropagation 避免同時觸發 dropzone 的選檔
const cameraBtn = document.getElementById('cameraBtn');
const cameraInput = document.getElementById('cameraInput');
if(cameraBtn && cameraInput){
  cameraBtn.addEventListener('click', e=>{ e.stopPropagation(); cameraInput.click(); });
  cameraInput.addEventListener('change', e=>{
    if(e.target.files.length) handleFiles(e.target.files);
    e.target.value = '';
  });
}
// 上一次分數 (後端隨分析結果回傳)，供卡片顯示「較上次 ▲/▼」
let _prevScore = null;
function isImageFile(f){
  // HEIC 在部分瀏覽器 (Windows Chrome) 的 f.type 是空字串，改用副檔名補判
  return f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name || '');
}
['dragover','dragenter'].forEach(ev=>dropzone.addEventListener(ev,e=>{
  e.preventDefault(); dropzone.classList.add('drag');
}));
['dragleave','drop'].forEach(ev=>dropzone.addEventListener(ev,e=>{
  e.preventDefault(); dropzone.classList.remove('drag');
}));
dropzone.addEventListener('drop', e=>{
  if(e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
});

// ── 剪貼簿貼上 (Ctrl+V，專業標註平台慣例) ──
document.addEventListener('paste', e=>{
  if(!e.clipboardData) return;
  const files = Array.from(e.clipboardData.files || []).filter(isImageFile);
  if(files.length){ e.preventDefault(); handleFiles(files); }
});

// ── 主流程 ──
async function handleFiles(fileList){
  const files = Array.from(fileList).filter(isImageFile);
  if(!files.length){ showToast(t('progress.not_image'), 'error'); return; }

  // 清空舊結果 (含上次還原的結果與提示)
  cardsWrap.innerHTML = '';
  summary.classList.remove('show');
  document.querySelectorAll('.restored-note').forEach(el=>el.remove());

  // 預覽佇列 (Google Lens 式掃描) + 骨架卡
  buildPreviewStrip(files);
  setPreviewStates(0);
  buildSkeletons(Math.min(files.length, 2));

  // 顯示進度
  progress.classList.add('show');
  setProgress(0, files.length, t('progress.uploading'));

  const fd = new FormData();
  files.forEach(f=>fd.append('images', f));

  // 假進度動畫 (因為後端是一次回傳，給使用者視覺回饋)
  let fake = 0;
  const timer = setInterval(()=>{
    fake = Math.min(fake + 1, files.length - 0.3);
    setProgress(fake, files.length, t('progress.analyzing'));
    setPreviewStates(fake);
  }, Math.max(400, 1200 - files.length*40));

  // 久候提示：超過 6 秒仍在跑 → 通常是伺服器首次載入模型，安撫使用者不是當機
  const slowHint = setTimeout(()=>{
    progress.querySelector('.t').textContent = t('progress.warming');
  }, 6000);

  // 逾時保護：避免連線異常時永遠卡在「掃描中」。時間隨張數放寬。
  const ctrl = new AbortController();
  const killer = setTimeout(()=>ctrl.abort(), 60000 + files.length * 20000);

  const cleanupTimers = ()=>{ clearInterval(timer); clearTimeout(slowHint); clearTimeout(killer); };

  try{
    const res = await apiFetch('/api/analyze', {method:'POST', body:fd, signal:ctrl.signal});
    let data;
    try{ data = await res.json(); }
    catch(e){ throw new Error('HTTP ' + res.status); }
    cleanupTimers();
    setProgress(files.length, files.length, t('progress.done'));
    setPreviewStates(files.length);

    setTimeout(()=>{
      progress.classList.remove('show');
      hidePreviewStrip();
      clearSkeletons();
      if(data.ok){
        _prevScore = (data.prev_score != null) ? data.prev_score : null;
        renderSummary(data.summary, data.count, data.results);
        renderCards(data.results);
        saveLastBatch(data);
      }else{
        showToast((t('progress.failed')||'分析失敗') + ': ' + (data.error||''), 'error');
      }
    }, 600);
  }catch(err){
    cleanupTimers();
    progress.classList.remove('show');
    hidePreviewStrip();
    clearSkeletons();
    if(err.name === 'AbortError') showToast(t('progress.timeout'), 'error');
    else if(err.message !== 'AUTH_401') showToast('連線錯誤: ' + err.message, 'error');
  }
}

// ── 預覽佇列 ──
let _pvUrls = [];
function buildPreviewStrip(files){
  const strip = document.getElementById('previewStrip');
  if(!strip) return;
  _pvUrls.forEach(u=>URL.revokeObjectURL(u)); _pvUrls = [];
  strip.innerHTML = files.map((f, i)=>{
    const url = URL.createObjectURL(f); _pvUrls.push(url);
    return `<div class="pv-item" data-state="queued" style="animation-delay:${i*0.05}s">
      <div class="pv-thumb"><img src="${url}" alt=""><div class="pv-scan"></div>
        <div class="pv-check"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div>
      </div>
      <div class="pv-meta"><div class="pv-name" title="${f.name}">${f.name}</div><div class="pv-state">${t('preview.queued')}</div></div>
    </div>`;
  }).join('');
  strip.classList.remove('fade-out');
  strip.classList.add('show');
}
function setPreviewStates(p){
  const items = document.querySelectorAll('#previewStrip .pv-item');
  const cur = Math.floor(p);
  items.forEach((item, i)=>{
    const st = (i < cur || p >= items.length) ? 'done' : (i === cur ? 'scanning' : 'queued');
    if(item.dataset.state !== st){
      item.dataset.state = st;
      item.querySelector('.pv-state').textContent = t('preview.' + st);
    }
  });
}
function hidePreviewStrip(){
  const strip = document.getElementById('previewStrip');
  if(!strip || !strip.classList.contains('show')) return;
  strip.classList.add('fade-out');
  setTimeout(()=>{
    strip.classList.remove('show','fade-out');
    strip.innerHTML = '';
    _pvUrls.forEach(u=>URL.revokeObjectURL(u)); _pvUrls = [];
  }, 450);
}

// ── 骨架載入卡 ──
function buildSkeletons(n){
  for(let i=0;i<n;i++){
    const sk = document.createElement('div');
    sk.className = 'card skeleton-card';
    sk.style.animationDelay = (i*0.1)+'s';
    sk.innerHTML = `
      <div class="sk-head"><div class="sk sk-icon"></div><div class="sk sk-line w40"></div></div>
      <div class="sk-body">
        <div class="sk-quad"><div class="sk"></div><div class="sk"></div><div class="sk"></div><div class="sk"></div></div>
        <div class="sk-panel"><div class="sk sk-ring"></div><div class="sk sk-line w80"></div><div class="sk sk-line w60"></div><div class="sk sk-line w80"></div><div class="sk sk-line w40"></div></div>
      </div>`;
    cardsWrap.appendChild(sk);
  }
}
function clearSkeletons(){
  cardsWrap.querySelectorAll('.skeleton-card').forEach(el=>el.remove());
}

function setProgress(cur, total, text){
  progress.querySelector('.t').textContent = text;
  progress.querySelector('.c').textContent = `${Math.floor(cur)} / ${total}`;
  progress.querySelector('.progress-bar i').style.width = (cur/total*100) + '%';
}

// ── 總覽 (數字 count-up 動畫) ──
function renderSummary(s, count, results){
  const set = (id, val, dec)=>{
    const el = document.getElementById(id);
    if(!el) return;   // 依角色只會存在其中一組格子
    if(typeof val === 'number') animateCount(el, val, {decimals:dec});
    else el.textContent = val ?? '—';
  };
  set('sm-avg', s.avg_ai, 1);
  // 醫師/助教：AI vs 醫師的驗證指標
  set('sm-mae', s.mae, 1);
  const hitEl = document.getElementById('sm-hit');
  if(hitEl) hitEl.textContent = s.verify_total ? `${s.hits} / ${s.verify_total}` : '—';
  // 學生：本次最高分 + 較上次
  const okScores = (results||[]).filter(r=>r.ok).map(r=>r.ai_score);
  set('sm-best', okScores.length ? Math.max(...okScores) : null, 0);
  const dEl = document.getElementById('sm-delta');
  if(dEl){
    if(_prevScore != null && okScores.length){
      const d = okScores[okScores.length-1] - _prevScore;   // 以本次最後一張對比上次
      dEl.textContent = (d>0?'▲ +':(d<0?'▼ ':'— ')) + Math.abs(d).toFixed(1);
      dEl.style.color = d>0 ? 'var(--green)' : (d<0 ? 'var(--red)' : 'var(--ink-faint)');
    }else{
      dEl.textContent = t('summary.first_time'); dEl.style.color='var(--ink-faint)'; dEl.style.fontSize='18px';
    }
  }
  set('sm-cnt', count, 0);
  document.getElementById('sm-total').textContent = (getLang()==='zh' ? `共 ${count} 張影像` : `${count} images`);
  summary.classList.add('show');
}

// ── 診斷卡 ──
function renderCards(results){
  results.forEach((d, i)=>{
    const card = document.createElement('div');
    card.className = 'card' + (d.ok ? '' : ' error');
    card.style.animationDelay = (i*0.08) + 's';

    if(!d.ok){
      card.innerHTML = `
        <div class="card-head">
          <div class="card-file">
            <div class="fi"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg></div>
            <div style="min-width:0"><div class="card-fname" title="${esc(d.filename)}">${esc(d.filename)}</div><div class="card-fmeta">${t('progress.failed')}</div></div>
          </div>
        </div>
        <div class="err-body">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          <span>${d.error || '無法處理此影像'}</span>
        </div>`;
      cardsWrap.appendChild(card);
      return;
    }

    const isVerify = d.doctor_score != null;
    const isStaff = !!window.IS_STAFF;
    const col = scoreColor(d.ai_score);
    const circ = 2*Math.PI*46;
    const off = circ*(1 - d.ai_score/100);
    const f = d.features;

    // 驗證模式 (AI vs 醫師) 只對醫師/助教有意義；學生看「較上次」進步回饋
    let compare = '';
    if(isVerify && isStaff){
      const delta = Math.abs(d.ai_score - d.doctor_score);
      const ok = delta <= 12.5;
      compare = `<div class="score-compare">
        <div class="row"><span>${t('detail.doctor_score')}</span><span class="mono">${d.doctor_score}</span></div>
        <div class="row"><span>${t('detail.abs_error')}</span><span class="delta ${ok?'delta-ok':'delta-warn'}">${delta.toFixed(1)} ${t('detail.points')}</span></div>
      </div>`;
    }else if(_prevScore != null){
      const dv = d.ai_score - _prevScore;
      const cls = dv > 0 ? 'delta-ok' : (dv < 0 ? 'delta-warn' : '');
      const sign = dv > 0 ? '▲ +' : (dv < 0 ? '▼ ' : '— ');
      compare = `<div class="score-compare">
        <div class="row"><span>${t('summary.vs_prev')}</span><span class="delta ${cls}">${sign}${Math.abs(dv).toFixed(1)} ${t('detail.points')}</span></div>
      </div>`;
    }

    card.innerHTML = `
      <div class="card-head">
        <div class="card-file">
          <div class="fi"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg></div>
          <div style="min-width:0"><div class="card-fname" title="${esc(d.filename)}">${esc(d.filename)}</div><div class="card-fmeta">${t('detail.title')}</div></div>
        </div>
        ${isStaff ? `<span class="mode-tag ${isVerify?'mode-verify':'mode-predict'}">${isVerify?t('mode.verify_full'):t('mode.predict_full')}</span>` : ''}
      </div>
      <div class="card-body">
        <div class="quad">
          <div class="quad-cell"><img src="${d.images.original}" data-full="${d.images.original}"><div class="quad-label"><span class="dot" style="background:#94A3B8"></span>${t('detail.orig')}</div></div>
          <div class="quad-cell"><img src="${d.images.roi}" data-full="${d.images.roi}"><div class="quad-label"><span class="dot" style="background:#14B8A6"></span>${t('detail.roi')}</div></div>
          <div class="quad-cell"><img src="${d.images.white}" data-full="${d.images.white}"><div class="quad-label"><span class="dot" style="background:#22C55E"></span>${t('detail.white_det')}</div></div>
          <div class="quad-cell"><img src="${d.images.damage}" data-full="${d.images.damage}"><div class="quad-label"><span class="dot" style="background:#EF4444"></span>${t('detail.damage_det')}</div></div>
        </div>
        <div class="panel">
          <div class="score-block">
            <div class="ring${d.ai_score>=88?' celebrate':''}">
              <svg width="104" height="104">
                <circle cx="52" cy="52" r="46" fill="none" stroke="var(--line-soft)" stroke-width="9"/>
                <circle cx="52" cy="52" r="46" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ}" style="transition:stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)"/>
              </svg>
              <div class="ring-val"><div class="ring-num" style="color:${col}">${Math.round(d.ai_score)}</div><div class="ring-unit">AI Score</div></div>
            </div>
            <div class="score-meta">
              <div class="label">${t('detail.summary')} <button type="button" class="rubric-btn" aria-label="${t('rubric.title')}" title="${t('rubric.title')}">?</button></div>
              <div class="grade" style="color:${col}">${gradeText(d.ai_score)}</div>
              ${compare}
              <div class="rubric-pop" hidden>
                <div class="rubric-t">${t('rubric.title')}</div>
                <div class="rubric-row"><span style="color:var(--green)">≥ 88</span><span>${t('grade.excellent')}</span></div>
                <div class="rubric-row"><span style="color:var(--teal)">63 – 87</span><span>${t('grade.good')}</span></div>
                <div class="rubric-row"><span style="color:var(--amber)">38 – 62</span><span>${t('grade.fair')}</span></div>
                <div class="rubric-row"><span style="color:var(--red)">&lt; 38</span><span>${t('grade.poor')}</span></div>
                <div class="rubric-note">${t('rubric.note')}</div>
              </div>
            </div>
          </div>
          <div class="features">
            <div class="feat-group">
              <div class="feat-gtitle"><span class="gdot" style="background:var(--red)"></span>${t('detail.damage_feat')}</div>
              <div class="feat-row"><span class="fname">${t('detail.damage_ratio')}</span><span class="fval" style="color:var(--red)">${(f.Damage_Ratio*100).toFixed(1)}%</span></div>
              <div class="feat-bar"><i style="width:${Math.min(f.Damage_Ratio*100*2.5,100)}%;background:var(--red)"></i></div>
              <div class="feat-row"><span class="fname">${t('detail.damage_count')}</span><span class="fval">${f.Damage_Count}</span></div>
            </div>
            <div class="feat-group">
              <div class="feat-gtitle"><span class="gdot" style="background:var(--green)"></span>${t('detail.white_feat')}</div>
              <div class="feat-row"><span class="fname">${t('detail.white_ratio')}</span><span class="fval" style="color:var(--green)">${(f.White_Ratio*100).toFixed(1)}%</span></div>
              <div class="feat-bar"><i style="width:${Math.min(f.White_Ratio*100*2,100)}%;background:var(--green)"></i></div>
              <div class="feat-row"><span class="fname">${t('detail.white_count')}</span><span class="fval">${f.White_Count}</span></div>
            </div>
          </div>
        </div>
      </div>`;
    // 評分標準 popover：點按鈕開合、點外面或 Esc 關閉 (標準 popover 行為)
    const rb = card.querySelector('.rubric-btn'), rp = card.querySelector('.rubric-pop');
    if(rb && rp){
      rb.addEventListener('click', e=>{ e.stopPropagation(); rp.hidden = !rp.hidden; });
      rp.addEventListener('click', e=>e.stopPropagation());
      document.addEventListener('click', ()=>{ rp.hidden = true; });
      document.addEventListener('keydown', e=>{ if(e.key === 'Escape') rp.hidden = true; });
    }
    cardsWrap.appendChild(card);

    // 觸發圓環 + 分數 count-up 動畫
    requestAnimationFrame(()=>{
      const ring = card.querySelector('.ring circle:last-child');
      if(ring) ring.style.strokeDashoffset = off;
      animateCount(card.querySelector('.ring-num'), Math.round(d.ai_score), {decimals:0, duration:1000});
      card.querySelectorAll('.feat-bar i').forEach(bar=>{
        const w = bar.style.width; bar.style.width='0'; requestAnimationFrame(()=>bar.style.width=w);
      });
    });

    // 點圖開啟檢視器 (4 視圖切換 + 偵測前後對比)
    const views = [
      {src:d.images.original, label:t('detail.orig'),       color:'#94A3B8'},
      {src:d.images.roi,      label:t('detail.roi'),        color:'#14B8A6'},
      {src:d.images.white,    label:t('detail.white_det'),  color:'#22C55E', compareWith:d.images.roi},
      {src:d.images.damage,   label:t('detail.damage_det'), color:'#EF4444', compareWith:d.images.roi},
    ];
    card.querySelectorAll('.quad-cell').forEach((cell, qi)=>{
      cell.addEventListener('click', ()=>openLightbox(views, qi));
    });
  });
}

/* ==========================================================================
   離開分析頁後回來，還原上次的分析結果
   --------------------------------------------------------------------------
   結果原本只存在 DOM，換頁 (例如去設定調語言) 就消失，只能回歷史紀錄重跑。
   改存 sessionStorage：關掉分頁即清除，不會留在共用電腦上。
   結果含 4 張 base64 影像，量大時可能超過 sessionStorage 配額，
   因此超過上限就不存 (下次回來單純是空白頁，不會壞掉)。
   ========================================================================== */
const LAST_BATCH_KEY = 'citrus_last_batch';
const LAST_BATCH_MAX_BYTES = 3 * 1024 * 1024;

function saveLastBatch(data){
  try{
    const payload = JSON.stringify({
      ts: Date.now(),
      summary: data.summary,
      count: data.count,
      prev_score: data.prev_score,
      results: data.results,
    });
    if(payload.length > LAST_BATCH_MAX_BYTES){ sessionStorage.removeItem(LAST_BATCH_KEY); return; }
    sessionStorage.setItem(LAST_BATCH_KEY, payload);
  }catch(e){ /* 配額不足或無痕模式：放棄還原功能，不影響本次結果 */ }
}

function clearLastBatch(){
  try{ sessionStorage.removeItem(LAST_BATCH_KEY); }catch(e){}
}

function restoreLastBatch(){
  let data;
  try{
    const raw = sessionStorage.getItem(LAST_BATCH_KEY);
    if(!raw) return;
    data = JSON.parse(raw);
  }catch(e){ return; }
  if(!data || !data.results || !data.results.length) return;

  _prevScore = (data.prev_score != null) ? data.prev_score : null;
  renderSummary(data.summary, data.count, data.results);
  renderCards(data.results);

  // 明確告知這是還原的舊結果，不是剛剛分析的
  const note = document.createElement('div');
  note.className = 'restored-note';
  note.innerHTML = `<span>${t('restore.note')}</span>
    <button type="button" class="restore-clear">${t('restore.clear')}</button>`;
  summary.parentNode.insertBefore(note, summary);
  note.querySelector('.restore-clear').addEventListener('click', ()=>{
    clearLastBatch();
    note.remove();
    cardsWrap.innerHTML = '';
    summary.classList.remove('show');
  });
}

// 新的一批分析開始時，舊的還原內容要先清掉
document.addEventListener('DOMContentLoaded', restoreLastBatch);
