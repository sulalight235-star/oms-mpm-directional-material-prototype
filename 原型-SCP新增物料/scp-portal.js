(function () {
  'use strict';
  const page = document.body.dataset.scpPage;
  const workbench = 'SCP-工作台-首页.html';
  const messagesPage = 'SCP-消息中心-列表.html';
  const createPage = 'SCP-物料管理-新增物料-单个新增.html';
  const applicationsPage = 'SCP-物料管理-我的申请.html';
  const icon = name => `<svg class="prototype-icon" aria-hidden="true"><use href="../assets/icons/prototype-icons.svg#icon-${name}"></use></svg>`;
  const orderIds = ['2609000157', '2609000156', '2609000064', '2608000235', '2608000223', '2608000222', '2608000166', '2608000165', '2608000121', '2608000120', '2608000101', '2608000080', '2608000054'];
  const materialNotices = ['A26090001001', 'A26090001002'].map((code, index) => ({
    id: `material-${code}`, code,
    text: `物料编码【${code}】超出7天无人处理，根据系统规则已经自动放弃！`,
    time: '2026年10月12日', type: '物料审核通知'
  }));
  const notices = materialNotices.concat(orderIds.map((id, index) => ({ id, index, text: `您有新的供应商订单${id}待接单！`, time: '2026-10-12 08:00', type: '催单通知' })))
    .concat(Array.from({ length: 24744 }, (_, index) => {
      const id = '2607' + String(24744 - index).padStart(6, '0');
      return { id, text: `您有新的供应商订单${id}待接单！`, time: '2026-10-11 08:00', type: '催单通知' };
    }));
  const taskTitles = ['SXJD26100900009询价单需报价', '您有新的订单2610000005待接单', '您有新的订单2610000004待接单', '您有新的订单2610000003待接单', '您有新的订单2610000002待接单', '您有新的订单2610000001待接单', 'SXJD2609000007询价单需报价', 'SXJD2609000006询价单需报价', 'DD260900000194客户订单需发货'];
  const navLink = (label, href, symbol, active = false) => `<a href="${href}"${active ? ' class="active" aria-current="page"' : ''}>${symbol ? icon(symbol) : ''}<span>${label}</span></a>`;
  const navStub = label => `<span class="scp-nav-label">${label}<span class="chevron">⌄</span></span>`;
  const app = document.getElementById('scp-app');
  const state = { filter: 'all', query: '', queryField: '内容', page: 1, perPage: 20, selected: null, returnFocus: null };

  app.innerHTML = `
    <header class="scp-header proto-topbar" data-prototype-topbar>
      <a class="scp-brand" href="${workbench}">咸亨国际供应商协同平台（SCP）</a>
      <nav class="scp-header-actions" aria-label="全局功能">
        <a href="../index.html">切换系统</a><a href="${messagesPage}">消息通知</a><a href="${messagesPage}">版本更新</a><a href="${messagesPage}">任务中心</a><span>王云龙 ▾</span>
      </nav>
    </header>
    <div class="scp-body">
      <aside class="scp-sidebar" aria-label="主导航"><nav class="scp-nav">
        ${navLink('工作台', workbench, 'home', page === 'workbench')}
        ${navLink('咸亨公告', messagesPage, 'bell')}
        ${navStub('基本信息')}${navStub('询报价')}${navStub('物料管理')}
        <div class="scp-nav-sub">
          ${navLink('项目物料提报管理', 'SCP-项目物料提报管理-项目物料列表.html')}
          ${navLink('项目物料', 'SCP-项目物料提报管理-项目物料列表.html')}
          ${navLink('我的物料', 'SCP-物料管理-我的物料.html')}
          ${navLink('新增物料', createPage)}
          ${navLink('批量新增', 'SCP-物料管理-新增物料-批量新增.html')}
          ${navLink('待提交物料', 'SCP-物料管理-待提交物料.html')}
          ${navLink('我新增的品牌', createPage)}
          ${navLink('我的申请', applicationsPage)}
          ${navLink('库存管理', 'SCP-物料管理-我的物料.html')}
          ${navLink('国网物料询价', messagesPage)}
        </div>
        ${navStub('订单管理')}
        <div class="scp-nav-sub">${navLink('订单报备', messagesPage)}${navLink('订单履约', messagesPage)}${navLink('退货管理', messagesPage)}</div>
        ${navStub('客户开票')}
        <div class="scp-nav-sub">${navLink('可开票订单', messagesPage)}${navLink('开票申请', messagesPage)}</div>
      </nav></aside>
      <main id="main-content" class="scp-main">
        <nav class="scp-tabs proto-page-nav" aria-label="页面导航">
          <a class="scp-tab ${page === 'workbench' ? 'active' : ''} proto-workbench-link" data-workbench-link href="${workbench}">工作台</a>
          <a class="scp-tab ${page === 'messages' ? 'active' : ''}" href="${messagesPage}">消息中心${page === 'messages' ? '<span class="tab-close" aria-hidden="true">×</span>' : ''}</a>
          <a class="scp-tab" href="${messagesPage}">订单详情 <span class="tab-close" aria-hidden="true">×</span></a>
          <a class="scp-tab" href="${messagesPage}">国网物料询价 <span class="tab-close" aria-hidden="true">×</span></a>
          <a class="scp-tab" href="SCP-物料管理-我的物料.html">我的物料 <span class="tab-close" aria-hidden="true">×</span></a>
          <a class="scp-tab" href="SCP-物料管理-我的申请.html">我的申请 <span class="tab-close" aria-hidden="true">×</span></a>
        </nav>
        <div class="scp-view" id="scp-view"></div>
      </main>
    </div>
    <div class="scp-modal-backdrop" id="message-modal" role="presentation">
      <div class="scp-modal" role="dialog" aria-modal="true" aria-labelledby="message-modal-title" aria-describedby="message-modal-content">
        <div class="scp-modal-head"><h2 id="message-modal-title">消息详情</h2><button class="scp-modal-close" type="button" aria-label="关闭消息详情" data-close-modal>×</button></div>
        <div class="scp-modal-body"><p id="message-modal-content"></p><a href="${messagesPage}" id="message-process">前往处理&gt;&gt;</a></div>
        <div class="scp-modal-foot"><button type="button" class="scp-primary" data-close-modal>确定</button></div>
      </div>
    </div>`;

  function isRead(id) { return id === orderIds[0] || localStorage.getItem('scp-message-read-' + id) === '1'; }
  function renderWorkbench() {
    document.getElementById('scp-view').innerHTML = `<div class="scp-workbench">
      <section class="scp-stats" aria-label="业务概览">
        <div class="scp-stat"><div class="scp-stat-name">电供客户订单</div><div class="scp-stat-total">850</div><span class="scp-stat-icon">${icon('document')}</span><div class="scp-stat-lines"><span>待发货: 473</span><span>待验收: 235</span><span>销项待开: 97</span><span>待结算: 26</span><span>发货超期: <b class="scp-danger">382</b></span><span>妥投超期: <b class="scp-danger">485</b></span></div></div>
        <div class="scp-stat"><div class="scp-stat-name">咸亨订单</div><div class="scp-stat-total">309</div><span class="scp-stat-icon">${icon('cart')}</span><div class="scp-stat-lines"><span>待接单: 66</span><span>待发货: 121</span></div></div>
        <div class="scp-stat"><div class="scp-stat-name">我的询价单</div><div class="scp-stat-total">170</div><span class="scp-stat-icon">${icon('document')}</span><div class="scp-stat-lines"><span>待接单: 55</span><span>待报价: 18</span></div></div>
        <div class="scp-stat"><div class="scp-stat-name">我的物料</div><div class="scp-stat-total">520</div><span class="scp-stat-icon">${icon('cart')}</span><div class="scp-stat-lines"><span>驳回物料: 329</span><span></span><span>审核中: 44</span><span>驳回品牌: 0</span></div></div>
      </section>
      <div class="scp-dashboard-grid">
        <section class="scp-panel scp-tasks"><div class="scp-panel-head"><h1>待办事项清单</h1><a href="${messagesPage}">查看全部 &gt;&gt;</a></div><div class="scp-task-scroll">
          ${taskTitles.map((title, i) => `<div class="scp-task"><div class="scp-task-copy"><div class="scp-task-title">${title}</div><div class="scp-task-meta">创建人${i < 2 ? '姚春萍' : 'A4004张素平'} · 截止日期:2026-10-${i < 2 ? '23' : '12'} 创建日期:2026-10-08</div></div><span class="scp-status ${i > 1 ? 'overdue' : ''}">${i > 1 ? '逾期' : '待处理'}</span><button class="scp-task-action" type="button" data-task="${i}">处理</button></div>`).join('')}
        </div></section>
        <div class="scp-side-panels">
          <section class="scp-panel scp-enterprise"><div class="scp-panel-head"><h2>企业信息</h2><a href="${createPage}">更多</a></div><div class="scp-license" role="img" aria-label="营业执照暂无上传"><small>营业执照</small><strong>暂无上传</strong></div><div class="scp-company-name">哈尔滨理工大学</div><div class="scp-company-line"><span>统一社会信用代码</span><span>LEQIMOCK0000000003</span><span>法人代表</span><span></span><span>合作形式</span><span>电商供应商、供应商</span></div></section>
          <section class="scp-panel scp-notices"><div class="scp-panel-head"><h2>消息通知</h2><a href="${messagesPage}">查看全部 &gt;&gt;</a></div><div class="scp-notice-scroll">${notices.slice(0, 13).map(n => `<a class="scp-notice ${isRead(n.id) ? 'read' : ''}" href="${messagesPage}?message=${n.id}"><div class="scp-notice-title">${n.text}</div><div class="scp-notice-time">${n.time}</div></a>`).join('')}</div></section>
        </div>
      </div></div>`;
  }

  function filteredNotices() {
    return notices.filter(n => (state.filter === 'all' || (state.filter === 'read') === isRead(n.id)) && (state.queryField === '类型' ? n.type : n.text).includes(state.query));
  }
  function renderRows() {
    const filtered = filteredNotices();
    const rows = filtered.slice((state.page - 1) * state.perPage, state.page * state.perPage);
    document.getElementById('message-rows').innerHTML = rows.length ? rows.map(n => `<tr><td><button type="button" class="message-link ${isRead(n.id) ? 'read' : ''}" data-message="${n.id}">${n.text}</button></td><td>${n.time}</td><td>${n.type}</td></tr>`).join('') : '<tr><td class="scp-empty" colspan="3">没有符合条件的消息</td></tr>';
    const pages = Math.max(1, Math.ceil(filtered.length / state.perPage));
    document.getElementById('pager-total').textContent = `共 ${filtered.length} 条`;
    const visiblePages = pages <= 5 ? Array.from({ length: pages }, (_, i) => i + 1) : Array.from({ length: 5 }, (_, i) => Math.min(Math.max(1, state.page - 2), pages - 4) + i);
    document.getElementById('pager-pages').innerHTML = visiblePages.map(number => `<button type="button" data-page="${number}" class="${state.page === number ? 'current' : ''}" aria-label="第 ${number} 页">${number}</button>`).join('') + (pages > 5 ? `<span aria-hidden="true">···</span><button type="button" data-page="${pages}" class="${state.page === pages ? 'current' : ''}" aria-label="最后一页">${pages}</button>` : '');
    document.getElementById('pager-prev').disabled = state.page === 1;
    document.getElementById('pager-next').disabled = state.page >= pages;
  }
  function renderMessages() {
    document.getElementById('scp-view').innerHTML = `<div class="scp-messages"><h1 class="prototype-sr-only">消息中心</h1>
      <section class="scp-filter" aria-label="消息筛选">
        <div class="scp-filter-line"><label for="message-field">条件:</label><select id="message-field"><option value="内容">消息内容</option><option value="类型">类型</option></select><input id="message-query" aria-label="搜索消息" placeholder="请输入"><div class="scp-search-actions"><button class="primary" type="button" id="message-search">查询</button><button type="button" id="message-reset">重置</button></div></div>
        <div class="scp-filter-line"><span>方案:</span><button type="button" data-plan="default">缺省</button><button type="button" data-plan="add">添加</button><button type="button" data-plan="default">设为默认</button></div>
        <div class="scp-segment" role="group" aria-label="消息状态"><button type="button" data-filter="all" class="selected" aria-pressed="true">全部</button><button type="button" data-filter="unread" aria-pressed="false">未读</button><button type="button" data-filter="read" aria-pressed="false">已读</button></div>
      </section>
      <div class="scp-message-table-wrap"><table class="scp-message-table"><thead><tr><th scope="col">消息内容</th><th scope="col">时间</th><th scope="col">类型</th></tr></thead><tbody id="message-rows"></tbody></table></div>
      <div class="scp-pager"><span class="total" id="pager-total"></span><button type="button" id="pager-prev" aria-label="上一页">‹</button><span id="pager-pages"></span><button type="button" id="pager-next" aria-label="下一页">›</button><select id="page-size" aria-label="每页条数"><option value="20">20 条/页</option><option value="10">10 条/页</option><option value="5">5 条/页</option></select><label class="page-extra" for="jump-page">跳至</label><input class="page-extra" type="number" id="jump-page" min="1" aria-label="跳转页码"><span class="page-extra">页</span></div>
    </div>`;
    renderRows();
  }
  function showMessage(id, trigger) {
    const notice = notices.find(n => n.id === id);
    if (!notice) return;
    state.returnFocus = trigger || document.activeElement;
    state.selected = notice;
    localStorage.setItem('scp-message-read-' + id, '1');
    document.getElementById('message-modal-content').textContent = notice.text;
    const processLink = document.getElementById('message-process');
    processLink.textContent = '前往处理>>';
    processLink.href = notice.code ? applicationsPage : messagesPage;
    document.getElementById('message-modal').classList.add('open');
    document.querySelector('.scp-modal-close').focus();
    if (page === 'messages') renderRows();
  }
  function closeModal() {
    document.getElementById('message-modal').classList.remove('open');
    if (state.returnFocus && state.returnFocus.isConnected) state.returnFocus.focus();
  }
  if (page === 'messages') renderMessages(); else renderWorkbench();
  app.addEventListener('click', event => {
    const messageButton = event.target.closest('[data-message]');
    if (messageButton) showMessage(messageButton.dataset.message, messageButton);
    if (event.target.closest('[data-close-modal]')) closeModal();
    if (event.target.id === 'message-modal') closeModal();
    const filterButton = event.target.closest('[data-filter]');
    if (filterButton) {
      state.filter = filterButton.dataset.filter; state.page = 1;
      document.querySelectorAll('[data-filter]').forEach(button => { const selected = button === filterButton; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected)); });
      renderRows();
    }
    if (event.target.id === 'message-search') { state.query = document.getElementById('message-query').value.trim(); state.queryField = document.getElementById('message-field').value; state.page = 1; renderRows(); }
    if (event.target.id === 'message-reset') { state.query = ''; state.queryField = '内容'; state.page = 1; document.getElementById('message-query').value = ''; document.getElementById('message-field').value = '内容'; renderRows(); }
    const pageButton = event.target.closest('[data-page]');
    if (pageButton) { state.page = Number(pageButton.dataset.page); renderRows(); }
    if (event.target.id === 'pager-prev' && state.page > 1) { state.page--; renderRows(); }
    if (event.target.id === 'pager-next' && state.page < Math.ceil(filteredNotices().length / state.perPage)) { state.page++; renderRows(); }
    if (event.target.closest('[data-task]')) location.href = messagesPage;
    if (event.target.id === 'message-process' && !state.selected.code) { event.preventDefault(); event.target.textContent = '订单处理页面暂未纳入本原型'; document.querySelector('.prototype-live-region').textContent = event.target.textContent; }
    if (event.target.closest('[data-plan]')) document.querySelector('.prototype-live-region').textContent = '查询方案为原型演示';
  });
  app.addEventListener('change', event => {
    if (event.target.id === 'page-size') { state.perPage = Number(event.target.value); state.page = 1; renderRows(); }
    if (event.target.id === 'jump-page') { state.page = Math.min(Math.max(1, Number(event.target.value) || 1), Math.max(1, Math.ceil(filteredNotices().length / state.perPage))); renderRows(); }
  });
  app.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.getElementById('message-modal').classList.contains('open')) closeModal();
    if (event.key === 'Enter' && event.target.id === 'message-query') { state.query = event.target.value.trim(); state.queryField = document.getElementById('message-field').value; state.page = 1; renderRows(); }
    if (event.key === 'Tab' && document.getElementById('message-modal').classList.contains('open')) {
      const focusable = Array.from(document.querySelectorAll('#message-modal button, #message-modal a'));
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  const linkedMessage = new URLSearchParams(location.search).get('message');
  if (page === 'messages' && linkedMessage) showMessage(linkedMessage);
})();
