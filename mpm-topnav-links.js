(function () {
  const scriptUrl = document.currentScript ? new URL(document.currentScript.src) : new URL('mpm-topnav-links.js', location.href);
  const rootBase = new URL('.', scriptUrl);

  const routes = {
    '消息通知': 'MPM-任务中心-任务列表.html',
    '价格审核': 'MPM-物料-待我审核.html',
    '版本更新': 'index.html#doc',
    '推送ERP': 'MPM-物料对接-待推送物料列表.html',
    '管理模块': 'MPM-关系设置-数据配置表.html',
    '任务中心': 'MPM-任务中心-任务列表.html',
    '清洗任务': 'MPM-类目属性-类目列表-资质规则批量维护.html'
  };

  const tabRoutes = {
    '工作台': 'MPM-工作台-首页.html',
    '对接物料列表管理': 'MPM-物料对接-对接物料列表管理.html',
    '对接物料列表': 'MPM-物料对接-对接物料列表管理.html',
    '物料列表': 'MPM-物料-物料列表.html',
    '待推送物料列表': 'MPM-物料对接-待推送物料列表.html',
    '提报商品详情': 'MPM-物料对接-待推送物料列表-提报商品详情.html',
    '客户商品清单': 'MPM-物料对接-客户商品清单.html',
    '对接物料详情': 'MPM-物料对接-对接物料列表-对接物料详情.html'
  };

  const navItems = [
    { name: '消息通知', dot: true },
    { name: '价格审核', dot: true },
    { divider: true },
    { name: '版本更新' },
    { name: '推送ERP' },
    { name: '管理模块' },
    { name: '任务中心' },
    { name: '清洗任务', dot: true },
    { divider: true },
    { name: '管理员', user: true }
  ];

  function hrefFor(name) {
    const target = routes[name];
    return target ? new URL(target, rootBase).href : '';
  }

  function navigate(name) {
    const href = hrefFor(name);
    if (href) window.location.href = href;
  }

  function navigateTab(name) {
    const target = tabRoutes[name];
    if (target) window.location.href = new URL(target, rootBase).href;
  }

  function cleanText(text) {
    return (text || '').replace(/\s+/g, '').replace(/[▾⌄×✕]/g, '');
  }

  function isMpmPage() {
    const headerText = cleanText(Array.from(document.querySelectorAll('.topbar, .top, header')).map(el => el.textContent).join(' '));
    return headerText.includes('主数据管理平台') || headerText.includes('咸亨国际主数据管理平台');
  }

  function isCurrent(name) {
    const href = hrefFor(name);
    if (!href) return false;
    const current = decodeURIComponent(location.pathname).split('/').pop();
    return decodeURIComponent(new URL(href).pathname).split('/').pop() === current;
  }

  function makeNavDiv(item) {
    if (item.divider) {
      const divider = document.createElement('div');
      divider.className = 'nav-divider';
      return divider;
    }
    const el = document.createElement('div');
    el.className = 'nav-item mpm-topnav-link';
    el.dataset.name = item.name;
    if (item.user) {
      el.innerHTML = '<div class="user-avatar">管</div>管理员 ▾';
      return el;
    }
    el.textContent = item.name;
    if (item.dot) {
      const dot = document.createElement('span');
      dot.className = 'badge-dot';
      el.appendChild(dot);
    }
    if (isCurrent(item.name)) el.classList.add('active');
    el.title = '进入' + item.name;
    el.addEventListener('click', () => navigate(item.name));
    return el;
  }

  function makeSpan(item) {
    if (item.divider) {
      const divider = document.createElement('span');
      divider.className = 'divider';
      return divider;
    }
    const el = document.createElement('span');
    el.className = 'mpm-topnav-link';
    if (item.user) {
      el.innerHTML = '<span class="user-avatar">管</span>管理员 ▾';
      return el;
    }
    el.textContent = item.name;
    if (item.dot) {
      const dot = document.createElement('i');
      dot.className = 'badge-dot';
      el.appendChild(dot);
    }
    if (isCurrent(item.name)) el.classList.add('active');
    el.title = '进入' + item.name;
    el.addEventListener('click', () => navigate(item.name));
    return el;
  }

  function makeTopAction(item) {
    if (item.divider || item.user) return null;
    const el = document.createElement('span');
    el.className = 'mpm-topnav-link' + (item.dot ? ' dot' : '');
    el.textContent = item.name;
    if (isCurrent(item.name)) el.classList.add('active');
    el.title = '进入' + item.name;
    el.addEventListener('click', () => navigate(item.name));
    return el;
  }

  function normalizeMpmNav() {
    if (!isMpmPage()) return;

    document.querySelectorAll('nav.nav-menu').forEach(nav => {
      if (nav.querySelector('#accountSwitcher')) return;
      nav.innerHTML = '';
      navItems.forEach(item => nav.appendChild(makeNavDiv(item)));
    });

    document.querySelectorAll('.top .right').forEach(nav => {
      nav.innerHTML = '';
      navItems.forEach(item => nav.appendChild(makeSpan(item)));
    });

    document.querySelectorAll('.topbar .top-actions').forEach(nav => {
      nav.innerHTML = '';
      navItems.forEach(item => {
        const el = makeTopAction(item);
        if (el) nav.appendChild(el);
      });
      const user = document.createElement('span');
      user.textContent = '管理员 ▾';
      nav.appendChild(user);
    });

    document.querySelectorAll('.brand-name, .brand-title').forEach(el => {
      if (!cleanText(el.textContent).includes('主数据管理平台')) return;
      el.style.cursor = 'pointer';
      el.title = '返回物料工作台';
      el.addEventListener('click', () => { window.location.href = new URL('MPM-工作台-首页.html', rootBase).href; });
    });
  }

  function attachLooseLinks() {
    const candidates = Array.from(document.querySelectorAll('.nav-item, .top-actions span, .top .right span, .topbar .right .item, .top-right span, .tabs .tab'));
    candidates.forEach(el => {
      const text = cleanText(el.textContent);
      Object.keys(routes).forEach(name => {
        if (!text.includes(name)) return;
        el.classList.add('mpm-topnav-link');
        el.title = '进入' + name;
        el.addEventListener('click', event => {
          event.stopPropagation();
          navigate(name);
        });
      });
    });
  }

  function normalizePageTabs() {
    const pageTitle = cleanText(document.title).replace(/-咸亨国际主数据管理平台$/, '');

    document.querySelectorAll('.tabs').forEach(tabs => {
      let workbench = tabs.querySelector('.mpm-workbench-tab');
      if (!workbench) {
        workbench = document.createElement('div');
        workbench.className = 'tab mpm-workbench-tab';
        workbench.textContent = '工作台';
        workbench.title = '返回MPM物料工作台';
        workbench.setAttribute('role', 'link');
        workbench.setAttribute('tabindex', '0');
        workbench.addEventListener('click', () => navigateTab('工作台'));
        workbench.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            navigateTab('工作台');
          }
        });
        tabs.insertBefore(workbench, tabs.firstChild);
      }

      Array.from(tabs.querySelectorAll('.tab')).forEach(tab => {
        const text = cleanText(tab.textContent);
        const target = tabRoutes[text];
        if (!target) return;

        tab.classList.add('mpm-page-tab-link');
        tab.title = text === '工作台' ? '返回MPM物料工作台' : '进入' + text;
        tab.setAttribute('role', 'link');
        tab.setAttribute('tabindex', '0');
        tab.classList.toggle('active', text === pageTitle);

        if (tab.dataset.mpmTabBound === 'true') return;
        tab.dataset.mpmTabBound = 'true';
        tab.addEventListener('click', event => {
          if (event.target.closest('.x')) return;
          navigateTab(text);
        });
        tab.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            navigateTab(text);
          }
        });

        const close = tab.querySelector('.x');
        if (close) {
          close.title = '关闭标签';
          close.addEventListener('click', event => {
            event.stopPropagation();
            const wasActive = tab.classList.contains('active');
            tab.remove();
            if (wasActive) navigateTab('工作台');
          });
        }
      });
    });
  }

  function injectStyle() {
    if (document.getElementById('mpmTopnavLinkStyle')) return;
    const style = document.createElement('style');
    style.id = 'mpmTopnavLinkStyle';
    style.textContent = [
      '.mpm-topnav-link{cursor:pointer;}',
      '.mpm-page-tab-link{cursor:pointer;}',
      '.mpm-page-tab-link:focus-visible{outline:2px solid #1677ff;outline-offset:-2px;}',
      '.mpm-workbench-tab{position:sticky;left:0;z-index:4;flex:0 0 auto;font-weight:600;color:#1677ff!important;background:#f5f9ff!important;border-right:1px solid #d9e7ff!important;}',
      '.mpm-workbench-tab.active::after{display:none;}',
      '.mpm-topnav-link.active{color:#fff;background:rgba(255,255,255,.12);}',
      '.top-actions .mpm-topnav-link.active{background:rgba(255,255,255,.12);border-radius:4px;}',
      '.demo-tips.collapsed .demo-tips-body,.demo-tips.collapsed .demo-tips-section,.demo-tips.collapsed .demo-tips-content{display:none!important;}',
      '.mpm-demo-tips-head{display:flex;align-items:center;justify-content:space-between;gap:16px;min-width:210px;cursor:pointer;user-select:none;}',
      '.mpm-demo-tips-title{color:#ffd666;font-size:13px;font-weight:700;white-space:nowrap;}',
      '.mpm-demo-tips-toggle{color:#fff;opacity:.65;font-size:12px;white-space:nowrap;}',
      '.mpm-demo-tips-head:hover .mpm-demo-tips-toggle{opacity:1;}',
      '.demo-tips.mpm-demo-tips-static{padding:9px 14px;}',
      '.demo-tips.mpm-demo-tips-static:not(.collapsed) .mpm-demo-tips-head{margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed rgba(255,255,255,.2);}',
      '.demo-tips.mpm-demo-tips-static:has(> .demo-tips-close) .mpm-demo-tips-head{padding-right:16px;}'
    ].join('');
    document.head.appendChild(style);
  }

  function setDemoTipToggleText(tip) {
    const collapsed = tip.classList.contains('collapsed');
    const toggle = tip.querySelector('.demo-tips-toggle, .mpm-demo-tips-toggle');
    if (toggle) toggle.textContent = collapsed ? '展开 ▸' : '收起 ▾';
  }

  function normalizeDemoTips() {
    document.querySelectorAll('.demo-tips').forEach((tip, index) => {
      const directChildren = Array.from(tip.children);
      const existingHead = directChildren.find(child => child.classList.contains('demo-tips-head') || child.classList.contains('demo-tips-header'));

      tip.classList.add('collapsed');

      if (existingHead) {
        let toggle = existingHead.querySelector('.demo-tips-toggle, .mpm-demo-tips-toggle');
        if (!toggle) {
          toggle = document.createElement('span');
          toggle.className = 'mpm-demo-tips-toggle';
          existingHead.appendChild(toggle);
        }
        existingHead.addEventListener('click', () => {
          setTimeout(() => setDemoTipToggleText(tip), 0);
        });
        setDemoTipToggleText(tip);
        return;
      }

      tip.classList.add('mpm-demo-tips-static');
      if (!tip.id) tip.id = 'mpmDemoTip' + (index + 1);

      const head = document.createElement('div');
      head.className = 'mpm-demo-tips-head';
      head.innerHTML = '<span class="mpm-demo-tips-title">💡 操作说明</span><span class="mpm-demo-tips-toggle">展开 ▸</span>';
      head.addEventListener('click', () => {
        tip.classList.toggle('collapsed');
        setDemoTipToggleText(tip);
      });
      tip.insertBefore(head, tip.firstChild);
      setDemoTipToggleText(tip);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    injectStyle();
    normalizeDemoTips();
    normalizeMpmNav();
    normalizePageTabs();
    attachLooseLinks();
  });
})();
