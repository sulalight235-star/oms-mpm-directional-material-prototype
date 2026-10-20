(function () {
  'use strict';
  const page = document.body.dataset.scpApplicationPage;
  const detailPage = 'SCP-物料管理-我的申请-物料详情.html';
  const listPage = 'SCP-物料管理-我的申请.html';
  const examples = [
    { code: 'A26090001001', name: '钳形电流表', brand: '优利德/UNI-T', model: 'UT210E', unit: '台', status: '放弃（自动执行）', updated: '2026-10-12 09:01', action: '2026-10-04 08:40', actionLabel: '最后一次驳回时间' },
    { code: 'A26090001002', name: '绝缘防护手套', brand: '安盾/ANDUN', model: '10kV', unit: '双', status: '放弃（自动执行）', updated: '2026-10-12 09:00', action: '2026-10-03 16:20', actionLabel: '最后一次撤回时间' },
    { code: 'A26090001003', name: '工业测温仪', brand: '德力西/DELIXI', model: 'DT880', unit: '台', status: '放弃（自动执行）', updated: '2026-10-12 08:00', action: '2026-09-30 10:30', actionLabel: '最后一次驳回时间' },
    { code: 'A26090001004', name: '防护眼镜', brand: '霍尼韦尔/HONEYWELL', model: 'S200A', unit: '副', status: '放弃', updated: '2026-10-10 14:18', action: '', actionLabel: '' }
  ];

  function connectWorkbench() {
    const href = 'SCP-工作台-首页.html';
    const nav = document.querySelector('.side .nav-row');
    if (nav) {
      const link = document.createElement('a');
      link.className = nav.className + ' proto-workbench-link';
      link.href = href;
      link.dataset.workbenchLink = '';
      link.innerHTML = nav.innerHTML;
      nav.replaceWith(link);
    }
    const tab = document.querySelector('.tabs .tab');
    if (tab) {
      const link = document.createElement('a');
      link.className = tab.className + ' proto-workbench-link';
      link.href = href;
      link.dataset.workbenchLink = '';
      link.textContent = '工作台';
      tab.replaceWith(link);
    }
  }

  function initList() {
    const body = document.getElementById('application-rows');
    const detailHref = code => `${detailPage}?code=${encodeURIComponent(code)}`;
    body.insertAdjacentHTML('afterbegin', examples.map(item => `<tr data-status="${item.status}" data-code="${item.code}" data-name="${item.name}">
      <td><a href="${detailHref(item.code)}">${item.code}</a></td><td><a href="${detailHref(item.code)}">${item.name}</a></td>
      <td>${item.brand}</td><td>${item.model}</td><td>${item.unit}</td><td>-</td>
      <td><span class="application-status ${item.status === '放弃' ? 'manual' : ''}">${item.status}</span></td>
      <td>-</td><td>${item.updated}</td><td></td><td><a class="application-view-link" href="${detailHref(item.code)}">查看</a></td>
    </tr>`).join(''));
    const rows = Array.from(body.querySelectorAll('tr'));
    const headings = Array.from(document.querySelectorAll('#application-table th'), heading => heading.textContent.trim());
    rows.forEach(row => {
      Array.from(row.cells).forEach((cell, index) => { cell.dataset.label = headings[index]; });
      if (!row.dataset.status) row.dataset.status = row.cells[6]?.textContent.trim() || '';
      if (!row.dataset.code) row.dataset.code = row.cells[0]?.textContent.trim() || '';
      if (!row.dataset.name) row.dataset.name = row.cells[1]?.textContent.trim() || '';
    });
    const query = document.getElementById('application-query');
    const field = document.getElementById('application-query-field');
    const status = document.getElementById('application-status');
    const count = document.getElementById('application-count');
    const update = () => {
      const value = query.value.trim().toLowerCase();
      let visible = 0;
      rows.forEach(row => {
        const matches = (!status.value || row.dataset.status === status.value) && (!value || row.dataset[field.value].toLowerCase().includes(value));
        row.hidden = !matches;
        if (matches) visible++;
      });
      count.textContent = `共 ${visible} 条`;
      let empty = body.querySelector('.application-empty-row');
      if (!visible && !empty) { empty = document.createElement('tr'); empty.className = 'application-empty-row'; empty.innerHTML = '<td class="application-empty" colspan="11">没有符合条件的申请</td>'; body.appendChild(empty); }
      if (empty) empty.hidden = visible > 0;
    };
    document.getElementById('application-search').addEventListener('click', update);
    query.addEventListener('keydown', event => { if (event.key === 'Enter') update(); });
    document.getElementById('application-reset').addEventListener('click', () => { query.value = ''; field.value = 'code'; status.value = ''; update(); });
    document.getElementById('application-refresh').addEventListener('click', update);
    update();
  }

  function initDetail() {
    const code = new URLSearchParams(location.search).get('code');
    const item = examples.find(example => example.code === code);
    if (!item) return;
    document.body.classList.add('application-terminal');
    const content = document.querySelector('.content');
    content.classList.add('application-readonly');
    const summary = document.createElement('section');
    summary.className = 'application-summary';
    summary.setAttribute('aria-label', '物料申请结果');
    summary.innerHTML = `<h1>物料申请详情</h1><div class="application-summary-grid">
      <div class="application-summary-item"><span>物料编码</span><strong>${item.code}</strong></div>
      <div class="application-summary-item"><span>审核状态</span><strong><span class="application-status ${item.status === '放弃' ? 'manual' : ''}">${item.status}</span></strong></div>
      <div class="application-summary-item"><span>更新时间</span><strong>${item.updated}</strong></div>
      ${item.action ? `<div class="application-summary-item"><span>${item.actionLabel}</span><strong>${item.action}</strong></div>` : '<div class="application-summary-item"></div>'}
    </div><p class="application-final-note">该申请已结束，仅可查看。</p>`;
    content.prepend(summary);
    const values = { '编码': item.code, '品牌': item.brand, '名称': item.name, '型号': item.model, '基本单位': item.unit };
    Object.entries(values).forEach(([label, value]) => {
      const input = content.querySelector(`input[aria-label="${label}"]`);
      if (input) input.value = value;
    });
    content.querySelectorAll('input,select,textarea,button').forEach(control => { control.disabled = true; });
    content.querySelectorAll('[role="button"]').forEach(control => { control.removeAttribute('onclick'); control.removeAttribute('onkeydown'); control.removeAttribute('tabindex'); control.setAttribute('aria-disabled', 'true'); });
    document.querySelectorAll('.actionbar [onclick*="save()"],.actionbar [onclick*="submitForm()"],.footer [onclick*="save()"],.footer [onclick*="submitForm()"]')
      .forEach(control => control.remove());
    const close = document.querySelector('.footer button');
    if (close) { close.textContent = '返回我的申请'; close.onclick = () => { location.href = listPage; }; }
  }

  connectWorkbench();
  if (page === 'list') initList();
  if (page === 'detail') initDetail();
})();
