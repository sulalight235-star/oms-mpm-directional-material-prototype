(function initScpDemoTips() {
  const STYLE_ID = 'scpDemoTipsStyle';

  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.scp-demo-tips { position:fixed; right:16px; bottom:16px; width:360px; max-width:calc(100vw - 32px); max-height:70vh; background:rgba(0,0,0,.78); color:#fff; padding:12px 14px; border-radius:6px; font-size:12px; line-height:1.65; z-index:9999; box-shadow:0 4px 12px rgba(0,0,0,.2); transition:padding .2s ease, width .2s ease; }',
      '.scp-demo-tips b { color:#ffd666; }',
      '.scp-demo-tips .ti { color:#95de64; }',
      '.scp-demo-tips-header { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:10px; cursor:pointer; user-select:none; }',
      '.scp-demo-tips-title { color:#ffd666; font-weight:700; }',
      '.scp-demo-tips-actions { display:flex; align-items:center; gap:8px; color:#fff; opacity:.82; white-space:nowrap; }',
      '.scp-demo-tips-toggle { font-size:12px; }',
      '.scp-demo-tips-close { color:#fff; cursor:pointer; font-size:14px; opacity:.72; }',
      '.scp-demo-tips-close:hover { opacity:1; }',
      '.scp-demo-tips-body { max-height:calc(70vh - 44px); overflow-y:auto; padding-right:2px; }',
      '.scp-demo-tips-section { margin-top:10px; padding-top:10px; border-top:1px dashed rgba(255,255,255,.22); }',
      '.scp-demo-tips-section:first-child { margin-top:0; padding-top:0; border-top:0; }',
      '.scp-demo-tips ul { margin:4px 0 0; padding-left:18px; }',
      '.scp-demo-tips li { margin:2px 0; }',
      '.scp-demo-tips.collapsed { width:auto; padding:9px 14px; }',
      '.scp-demo-tips.collapsed .scp-demo-tips-body { display:none; }',
      '.scp-demo-tips.collapsed .scp-demo-tips-header { margin-bottom:0; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function setupTip(tip) {
    let body = tip.querySelector('.scp-demo-tips-body');

    if (!body) {
      body = document.createElement('div');
      body.className = 'scp-demo-tips-body';
      Array.from(tip.childNodes).forEach(node => {
        if (!(node.nodeType === 1 && node.classList && node.classList.contains('scp-demo-tips-header'))) {
          body.appendChild(node);
        }
      });
      tip.appendChild(body);
    }

    let header = tip.querySelector('.scp-demo-tips-header');
    if (!header) {
      header = document.createElement('div');
      header.className = 'scp-demo-tips-header';
      header.innerHTML = '<span class="scp-demo-tips-title">演示说明</span><span class="scp-demo-tips-actions"><span class="scp-demo-tips-toggle">收起 ▾</span><span class="scp-demo-tips-close" title="关闭">×</span></span>';
      tip.insertBefore(header, body);
    }

    const toggle = header.querySelector('.scp-demo-tips-toggle');
    const close = header.querySelector('.scp-demo-tips-close');
    const sync = () => {
      if (toggle) toggle.textContent = tip.classList.contains('collapsed') ? '展开 ▸' : '收起 ▾';
    };

    header.addEventListener('click', event => {
      if (event.target.closest('.scp-demo-tips-close')) return;
      tip.classList.toggle('collapsed');
      sync();
    });

    if (close) {
      close.addEventListener('click', event => {
        event.stopPropagation();
        tip.style.display = 'none';
      });
    }

    sync();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.scp-demo-tips').forEach(setupTip);
  });
})();
