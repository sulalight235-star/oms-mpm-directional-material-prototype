(function () {
  'use strict';
  const main = document.querySelector('.legacy-create');
  const picker = document.getElementById('legacyPicker');
  const valueInput = document.getElementById('legacyPickerValue');
  let applyChoice = null;
  let releaseFocus = null;
  const toast = text => PrototypeUI.showToast(text);
  const field = title => { const label = [...main.querySelectorAll('label')].find(e => e.title === title); return label && (document.getElementById(label.htmlFor) || label.closest('.xh-form-item').querySelector('input,textarea')); };
  function choose(title, values, apply, opener) {
    document.getElementById('legacyPickerTitle').textContent = title;
    document.getElementById('legacyPickerOptions').replaceChildren(...values.map(text => { const o = document.createElement('option'); o.value = text; return o; }));
    valueInput.value = '';
    valueInput.setCustomValidity('');
    applyChoice = apply;
    picker.showModal();
    releaseFocus = PrototypeUI.trapDialogFocus(picker, opener);
    valueInput.focus();
  }
  picker.addEventListener('proto:request-close', () => picker.close());
  picker.addEventListener('close', () => { if (releaseFocus) releaseFocus(); });
  picker.querySelector('[data-picker-cancel]').onclick = () => picker.close();
  picker.querySelector('[data-picker-confirm]').onclick = () => {
    if (!valueInput.value.trim()) { valueInput.setCustomValidity('请选择或输入内容'); valueInput.reportValidity(); return; }
    applyChoice(valueInput.value.trim()); picker.close();
  };
  valueInput.addEventListener('input', () => valueInput.setCustomValidity(''));
  main.querySelectorAll('form').forEach(form => form.addEventListener('submit', e => e.preventDefault()));
  main.querySelectorAll('.xh-radio-group').forEach((group, index) => group.querySelectorAll('input[type=radio]').forEach(input => { input.name = 'legacy-radio-' + index; }));
  main.addEventListener('input', event => { const select = event.target.closest('.xh-select'); const placeholder = select?.querySelector('.xh-select-selection-placeholder'); if (placeholder && event.target.value) placeholder.textContent = event.target.value; event.target.classList.remove('legacy-invalid'); });
  main.querySelectorAll('input[readonly]:not([hidden]):not([disabled]),.xh-select:not(.xh-select-disabled)').forEach(el => {
    el.setAttribute('tabindex', '0');
    const open = () => {
      const input = el.matches('input') ? el : el.querySelector('input');
      const title = input?.getAttribute('aria-label') || el.closest('.xh-form-item')?.querySelector('label')?.textContent || '字典数据';
      if(title==='产品线' && window.LegacyProductLinePicker){window.LegacyProductLinePicker(x=>{if(input){input.value=x.name;input.dataset.productLineCode=x.code;input.dispatchEvent(new Event('input',{bubbles:true}));}const placeholder=el.querySelector('.xh-select-selection-placeholder');if(placeholder)placeholder.textContent=x.name;});return;}
      const samples = { 品牌: ['世达 / SATA', '得力 / deli', '博世 / BOSCH'], 基本单位: ['个', '件', '套', '台', '米', '箱'], 类目: ['工业用品 / 手工具 / 螺丝刀', '工业用品 / 电动工具 / 电钻'], 物料税率: ['13%', '9%', '6%', '免税'], 产品线: ['工业工具', '电气设备'], 货主: ['咸亨国际科技股份有限公司'] };
      choose('选择' + title, samples[title] || ['演示数据'], value => {
        if (input) { input.value = value; input.classList.remove('legacy-invalid'); }
        if (!el.matches('input')) {
          const placeholder = el.querySelector('.xh-select-selection-placeholder');
          if (placeholder) { placeholder.textContent = value; placeholder.style.color = '#262626'; }
        }
      }, el);
    };
    el.addEventListener('click', open);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  main.addEventListener('change', event => {
    const input = event.target;
    if (input.type === 'checkbox' || input.type === 'radio') {
      main.querySelectorAll('.xh-radio-wrapper,.xh-checkbox-wrapper').forEach(label => {
        const control = label.querySelector('input'); if (!control) return;
        label.classList.toggle('xh-radio-wrapper-checked', control.type === 'radio' && control.checked);
        const shell = control.closest('.xh-radio,.xh-checkbox');
        if (shell) shell.classList.toggle(control.type === 'radio' ? 'xh-radio-checked' : 'xh-checkbox-checked', control.checked);
      });
    }
    if (input.type === 'file' && input.files.length && !input.closest('#pic_upload')) {
      const box = input.closest('.box-iRk2dh');
      [...input.files].forEach(file => { const img = document.createElement('img'); img.className = 'legacy-file-preview'; img.alt = file.name; img.src = URL.createObjectURL(file); img.onload = () => URL.revokeObjectURL(img.src); box.appendChild(img); });
      toast('已添加本地图片，仅用于原型预览');
    }
  });
  function saveDraft() {
    const values = [...main.querySelectorAll('input,textarea')].filter(e => e.type !== 'file').map(e => ({ id: e.id, value: e.value, checked: e.checked }));
    try { localStorage.setItem('mpm-legacy-create-draft', JSON.stringify(values)); toast('暂存成功，可在当前浏览器恢复'); } catch { toast('暂存失败，请检查浏览器存储设置'); }
  }
  function nextStep() {
    const required = ['品牌', '名称', '型号', '基本单位', '类目'];
    const missing = required.map(title => ({ title, input: field(title) })).filter(x => x.input && !x.input.value.trim());
    if (missing.length) { missing.forEach(x => x.input.classList.add('legacy-invalid')); missing[0].input.focus(); toast('请完善' + missing.map(x => x.title).join('、')); return; }
    showStep(2);
  }
  const scroller = main.querySelector('.container-sTWEpK');
  const originalBoxes = [...scroller.querySelectorAll(':scope > .box-iRk2dh')];
  function showStep(step) {
    let panel = document.getElementById('legacyStepPanel');
    if (panel) panel.remove();
    originalBoxes.forEach(box => box.hidden = step !== 1);
    scroller.querySelectorAll('.xh-steps-item').forEach((item, i) => { item.classList.toggle('xh-steps-item-process', i + 1 === step); item.classList.toggle('xh-steps-item-active', i + 1 === step); });
    if (step === 1) return;
    panel = document.createElement('section'); panel.id = 'legacyStepPanel'; panel.className = 'legacy-step-panel';
    panel.innerHTML = step === 2 ? '<h2>分配ERP组织</h2><label><input type="checkbox" checked>咸亨国际科技股份有限公司</label><p>原型仅演示组织选择，不调用 ERP 服务。</p><button class="proto-btn" type="button" data-back>上一步</button><button class="proto-btn proto-btn--primary" type="button" data-forward>下一步</button>' : '<h2>提交审核</h2><p>物料信息已填写，确认后演示提交审核结果。</p><button class="proto-btn" type="button" data-back>上一步</button><button class="proto-btn proto-btn--primary" type="button" data-submit>确认提交</button>';
    scroller.appendChild(panel); panel.querySelector('[data-back]').onclick = () => showStep(step - 1);
    panel.querySelector('[data-forward]')?.addEventListener('click', () => { if (!panel.querySelector('input:checked')) { toast('请选择ERP组织'); return; } showStep(3); });
    panel.querySelector('[data-submit]')?.addEventListener('click', event => { PrototypeUI.setButtonBusy(event.target, true, '提交中…'); setTimeout(() => { PrototypeUI.setButtonBusy(event.target, false); toast('原型演示：提交审核成功，未写入业务系统'); }, 600); });
    panel.scrollIntoView({ block: 'nearest' });
  }
  main.querySelectorAll('.boxtitle-diOwgg').forEach(header => {
    const children = [...header.parentElement.children].filter(e => e !== header);
    if (!children.some(e => e.style.display === 'none') && !header.querySelector('svg')) return;
    header.tabIndex = 0; header.setAttribute('role', 'button');
    const toggle = () => children.forEach(e => { e.style.display = e.style.display === 'none' ? '' : 'none'; });
    header.addEventListener('click', e => { if (!e.target.closest('button')) toggle(); });
    header.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });
  main.addEventListener('click', event => {
    if (event.target.closest('[data-series-mount],[data-extra]')) return;
    const button = event.target.closest('button'); if (!button || button.disabled || button.closest('#legacyStepPanel')) return;
    if (button.closest('.legacy-image-layout')) return;
    const text = button.textContent.trim().replace(/\s+/g, '');
    if (text === '恢复暂存') return;
    if (text === '下一步') return nextStep();
    if (text === '暂存') return saveDraft();
    if (text === '关闭') { location.href = 'MPM-工作台-首页.html'; return; }
    if (text === '快捷拾取') return choose('快捷拾取物料名称', ['工业工具演示物料'], value => { const input = field('名称'); if (input) input.value = value; toast('已拾取名称，请继续完善其他信息'); }, button);
    if (text === '新增外链' || text === '新增佐证') {
      const row = document.createElement('div'); row.className = 'legacy-extra-row';
      row.innerHTML = '<label>链接地址<input type="url" placeholder="https://" aria-label="链接地址"></label><label>价格<input type="number" min="0" aria-label="链接价格"></label><button class="proto-btn" type="button">删除</button>';
      row.querySelector('button').onclick = () => row.remove(); button.closest('.box-iRk2dh').appendChild(row); return;
    }
    if (text === '清空图片' && !button.closest('#pic_upload')) { button.closest('.box-iRk2dh').querySelectorAll('.legacy-file-preview').forEach(e => e.remove()); toast('图片已清空'); return; }
    if (text === '上传资质图片') return choose('本地资质附件名称', ['产品合格证.pdf', '检测报告.pdf'], value => { const box = button.closest('.box-iRk2dh'); let list = box.querySelector('[data-local-attachment-list]'); if (!list) { list = document.createElement('ul'); list.dataset.localAttachmentList = ''; box.appendChild(list); } const li = document.createElement('li'); li.textContent = value + '（原型演示，未上传）'; list.appendChild(li); }, button);
    if (['主推', '常规', '零星'].includes(text)) { button.parentElement.querySelectorAll('button').forEach(e => e.style.fontWeight = '400'); button.style.fontWeight = '700'; toast('已选择' + text); return; }
    if (text === '删除') return;
    toast('原型未接入此项后台服务，可演示填写与暂存');
  });
  const restore = document.createElement('button'); restore.type = 'button'; restore.className = 'xh-btn xh-btn-link xh-btn-sm'; restore.textContent = '恢复暂存';
  restore.onclick = () => { try { const draft = JSON.parse(localStorage.getItem('mpm-legacy-create-draft') || 'null'); if (!draft) return toast('暂无暂存数据'); draft.forEach(item => { const e = item.id && document.getElementById(item.id); if (e && e.type !== 'file') { e.value = item.value; if (typeof item.checked === 'boolean') e.checked = item.checked; } }); toast('已恢复暂存'); } catch { toast('恢复失败，请重新暂存'); } };
  main.querySelector('.btn-left-box-asf71u').appendChild(restore);
})();
