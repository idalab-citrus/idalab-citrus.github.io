/* ==========================================================================
   InfiniteTable — 可重用的「無限滾動 + 點擊排序」表格元件
   ==========================================================================
   用法:
     new InfiniteTable({
       root: '#myTableCard',          // 容器選擇器 (內含 table + .scroll-sentinel)
       endpoint: '/api/my-history',   // 分頁 API
       colspan: 7,                    // 空狀態的 colspan
       defaultSort: 'created_at',
       extraParams: { user_id: 5 },   // (選填) 額外查詢參數
       renderRow: (rec) => `<tr>...</tr>`,
       onFirstPage: (records, data) => {}   // (選填) 第一頁載入後回呼 (算統計用)
     });

   API 需回傳: { records: [...], has_more: bool, page: int }
   表頭可排序的 <th> 加上 data-sort-key="ai_score"，內含 <span class="sort-arrow"></span>
   ========================================================================== */

class InfiniteTable {
  constructor(opts) {
    this.root = document.querySelector(opts.root);
    this.endpoint = opts.endpoint;
    this.tbody = this.root.querySelector('tbody');
    this.sentinel = this.root.querySelector('.scroll-sentinel');
    this.colspan = opts.colspan || 6;
    this.renderRow = opts.renderRow;
    this.extraParams = opts.extraParams || {};
    this.onFirstPage = opts.onFirstPage || null;
    this.emptyTitle = opts.emptyTitle || null;
    this.emptyDesc = opts.emptyDesc || null;

    this.sort = opts.defaultSort || 'created_at';
    this.order = 'desc';
    this.page = 1;
    this.hasMore = true;
    this.loading = false;
    this._firstPage = true;
    this._loadSeq = 0;
    this._abortController = null;

    this._initSortHeaders();
    this._initObserver();
    document.addEventListener('langchange', () => this.reload());
    this.reload();
  }

  // 點擊表頭排序
  _initSortHeaders() {
    this.root.querySelectorAll('[data-sort-key]').forEach(th => {
      th.classList.add('sortable');
      th.addEventListener('click', () => {
        const key = th.dataset.sortKey;
        if (this.sort === key) {
          this.order = (this.order === 'asc') ? 'desc' : 'asc';
        } else {
          this.sort = key;
          this.order = 'desc';
        }
        this._updateArrows();
        this.reload();
      });
    });
    this._updateArrows();
  }

  _updateArrows() {
    this.root.querySelectorAll('[data-sort-key]').forEach(th => {
      const arrow = th.querySelector('.sort-arrow');
      if (th.dataset.sortKey === this.sort) {
        th.classList.add('sorted');
        if (arrow) arrow.textContent = this.order === 'asc' ? '↑' : '↓';
      } else {
        th.classList.remove('sorted');
        if (arrow) arrow.textContent = '';
      }
    });
  }

  // 滑到底自動載入
  _initObserver() {
    if (!this.sentinel) return;
    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && this.hasMore && !this.loading) {
        this.loadMore();
      }
    }, { rootMargin: '150px' });
    this.observer.observe(this.sentinel);
  }

  _emptyHTML() {
    const tr = (k, fb) => (typeof t === 'function' ? t(k) : fb);
    if (this.emptyTitle) {
      return `<div class="empty-state">
        <div class="empty-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 15l5-5 4 4 3-3 6 6" opacity=".6"/><circle cx="8.5" cy="8.5" r="1.5"/></svg></div>
        <div class="empty-t">${tr(this.emptyTitle, '尚無紀錄')}</div>
        ${this.emptyDesc ? `<div class="empty-d">${tr(this.emptyDesc, '')}</div>` : ''}
      </div>`;
    }
    return tr('common.empty', '尚無紀錄');
  }

  reload() {
    if (this._abortController) this._abortController.abort();
    this._loadSeq += 1;
    this.loading = false;
    this.page = 1;
    this.hasMore = true;
    this._firstPage = true;
    this.tbody.innerHTML = '';
    this.loadMore();
  }

  async loadMore() {
    if (this.loading || !this.hasMore) return;
    const isFirstPage = this._firstPage;
    const surfaceLoading = isFirstPage && typeof beginDataLoading === 'function'
      ? beginDataLoading(this.root, { labelKey: 'loading.records' })
      : null;
    const loadSeq = this._loadSeq;
    const controller = new AbortController();
    this._abortController = controller;
    this.loading = true;
    if (this.sentinel) this.sentinel.classList.add('loading');

    const params = new URLSearchParams({
      sort: this.sort, order: this.order, page: this.page, ...this.extraParams,
    });

    try {
      const res = (typeof apiFetch === 'function')
        ? await apiFetch(`${this.endpoint}?${params}`, { signal: controller.signal })
        : await fetch(`${this.endpoint}?${params}`, { signal: controller.signal });
      const data = await res.json();
      if (loadSeq !== this._loadSeq) return;
      const records = data.records || [];

      if (this._firstPage && this.onFirstPage) {
        this.onFirstPage(records, data);
      }

      if (this._firstPage && records.length === 0) {
        this.tbody.innerHTML = `<tr><td colspan="${this.colspan}" class="empty">${this._emptyHTML()}</td></tr>`;
      } else {
        this.tbody.insertAdjacentHTML('beforeend', records.map(this.renderRow).join(''));
      }

      this.hasMore = !!data.has_more;
      this.page += 1;
      this._firstPage = false;
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      console.error('載入失敗', e);
      if (this._firstPage) {
        this.tbody.innerHTML = `<tr><td colspan="${this.colspan}" class="empty">載入失敗</td></tr>`;
      }
    } finally {
      if (loadSeq === this._loadSeq) {
        this.loading = false;
        this._abortController = null;
        if (this.sentinel) this.sentinel.classList.remove('loading');
      }
      if (surfaceLoading && typeof endDataLoading === 'function') endDataLoading(surfaceLoading);
    }
  }
}

// scoreColor 定義於 ui.js (全站共用)
