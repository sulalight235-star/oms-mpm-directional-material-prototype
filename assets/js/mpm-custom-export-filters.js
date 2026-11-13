/* 自定义导出筛选交互；仅处理当前原型内的示例物料。 */
(() => {
  'use strict';
  const modal = document.getElementById('modalCustomExport');
  if (!modal) return;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const table = document.querySelector('.list-layout .table-panel .table-wrap table');
  const titles = [...table.querySelectorAll('thead th')].map(th => th.textContent.trim());
  const records = [...table.querySelectorAll('tbody tr')].map((row, index) => {
    const cell = title => row.cells[titles.indexOf(title)];
    const text = title => cell(title)?.textContent.trim() || '';
    return {
      code: text('编码').match(/B\d+/)?.[0] || '', owner: text('货主'), brand: text('品牌'), category: text('类目'),
      supplier: cell('供应商')?.querySelector('.supplier-cell > span')?.textContent.trim() || text('供应商'),
      // 原页面未包含这三类属性，补齐当前原型的演示筛选数据。
      pushStatus: ['推送成功', '推送失败', '推送中'][index % 3],
      materialTag: ['自营物料', '定向物料', '电商服务商'][index % 3],
      projects: [['华东区域项目'], ['设备采购项目', '电力检修项目'], ['华东区域项目', '电力检修项目']][index % 3]
    };
  });
  const groups = [ ['owner','货主'], ['brand','品牌'], ['category','类目'], ['supplier','供应商'], ['projects','项目'] ];
  const selections = Object.fromEntries(groups.map(([key]) => [key, new Set()]));
  function renderTags(key,field,state = selections) {
    const target = field.querySelector('.export-multiselect-selected'); target.replaceChildren();
    if(!state[key].size) { target.textContent = '请选择，可多选'; return; }
    for(const value of state[key]) { const tag = document.createElement('span'); tag.className = 'export-filter-tag'; tag.textContent = value; target.append(tag); }
  }
  const referenceChoices = {
    owner: [['1087','浙江中标卓越认证有限公司'],['1085','浙创智元（杭州）科技有限公司'],['1083','杭州威亨国际数字科技有限公司'],['1080','河南正博电力科技有限公司'],['1071','嘉兴浙创兴能技术有限公司'],['1070','咸亨国际（杭州）院前救护研究中心有限公司'],['1066','咸亨国际秦晋城（杭州）科技发展有限公司'],['1048','咸亨核电器材（上海）有限公司'],['1044','天津咸亨智能科技有限公司'],['1022','杭州贝特设备制造有限公司海宁分公司']],
    projects: [['10','能建商城国内A'],['11','微采商城'],['18','央采中心'],['19','山东京采'],['20','中直机关'],['21','天津政采'],['22','江阴政采'],['27','深圳政采'],['30','蜀山政采'],['36','江苏省采']],
    supplier: [['HZS3200207','南京高米科技有限公司'],['HZS3300877','杭州渭宁建设有限公司'],['HZS1300443','石家庄易尼商贸有限公司'],['HZS4201916','武汉正旺建设有限公司'],['HZS3301930','浙江大源建设有限公司'],['HZS3104430','支付宝（中国）网络技术有限公司'],['HZS6100032','宝鸡文杰商贸有限公司'],['HZS6300397','青海利拓优建材有限公司'],['HZS6501172','库尔勒微州商贸中心'],['HZS1100172','合众新能源汽车股份有限公司']]
  };
  function choices(key) {
    const rows = (referenceChoices[key] || []).map(([code,name]) => ({code,name}));
    [...new Set(records.flatMap(record => record[key]))].filter(Boolean).forEach((name,index) => { if(!rows.some(row => row.name === name)) rows.push({code:({owner:'ORG',brand:'BR',supplier:'SUP',projects:'PRJ',category:'CAT'}[key])+String(index+1).padStart(3,'0'), name}); });
    return rows;
  }
  function categoryTree() {
    return [{code:'01',name:'应急装备测试',children:[{code:'0101',name:'无人机',children:[{code:'010101',name:'多旋翼飞行平台',children:['消费类无人机类别','教育类无人机','行业类无人机','载重多旋翼飞行平台','飞行汽车','外部链接','消费类无人机'].map((name,i)=>({code:'010101'+String(i+1).padStart(2,'0'),name}))},{code:'010102',name:'复合翼飞行平台',children:[{code:'01010201',name:'复合翼无人机'}]},{code:'010103',name:'任务载荷',children:[{code:'01010301',name:'光电载荷'}]}]}]}, {code:'04',name:'工器具',children:[{code:'0401',name:'电动/气动工具',children:choices('category').map((row,index)=>({code:'0401'+String(index+1).padStart(2,'0'),name:row.name}))}]}];
  }
  function openPicker(key,label,field,state = selections,onConfirm = () => {}) {
    const pending = new Set(state[key]), opener = field.querySelector('button');
    let page = 1, query = '';
    const d = document.createElement('dialog'); d.className = 'series-dialog series-compact-picker export-reference-picker'; d.setAttribute('aria-labelledby','exportPickerTitle');
    d.innerHTML = `<div class="series-dialog-head"><h2 id="exportPickerTitle">${label}</h2><button type="button" class="proto-btn" data-picker-close aria-label="关闭">×</button></div><div class="series-dialog-body"><form class="compact-picker-search"><label class="prototype-sr-only" for="exportPickerQuery">搜索${label}编码或名称</label><input id="exportPickerQuery" class="proto-input" placeholder="请输入" autocomplete="off"><button type="submit" class="proto-btn proto-btn--primary" aria-label="查询"><svg class="prototype-icon" aria-hidden="true"><use href="assets/icons/prototype-icons.svg#icon-search"></use></svg></button></form><div data-picker-content></div><nav class="compact-picker-pages" aria-label="${label}选择分页"></nav></div><div class="series-dialog-footer"><span data-picker-count></span><button type="button" class="proto-btn" data-picker-clear>清空</button><button type="button" class="proto-btn" data-picker-close>取消</button><button type="button" class="proto-btn proto-btn--primary" data-picker-confirm>确认</button></div>`;
    document.body.append(d); d.showModal();
    const release = PrototypeUI.trapDialogFocus(d,opener);
    const $ = selector => d.querySelector(selector);
    const content = $('[data-picker-content]'), pages = $('.compact-picker-pages');
    const count = () => $('[data-picker-count]').textContent = '已选择 '+pending.size+' 项';
    const allRows = choices(key), roots = key === 'category' ? categoryTree() : [];
    const openNodes = new Set(['01','0101','010101','04','0401']);
    const leaves = node => node.children ? node.children.flatMap(leaves) : [node.name];
    function updateTreeChecks() {
      content.querySelectorAll('[data-tree-select]').forEach(input => { const values = JSON.parse(input.dataset.values); const selected = values.filter(name => pending.has(name)).length; input.checked = selected === values.length; input.indeterminate = selected > 0 && selected < values.length; });
      count();
    }
    function drawTree() {
      pages.hidden = true;
      const matches = node => (node.code+' '+node.name).toLowerCase().includes(query) || node.children?.some(matches);
      function branch(nodes,level=0,force=false) {
        return nodes.filter(node => !query || force || matches(node)).map(node => {
          const expanded = query ? true : openNodes.has(node.code);
          const selfMatch = (node.code+' '+node.name).toLowerCase().includes(query);
          return `<li role="none"><div class="export-tree-row" style="--tree-level:${level}">${node.children ? `<button type="button" class="export-tree-toggle" data-tree-toggle="${node.code}" aria-expanded="${expanded}" aria-label="${expanded?'收起':'展开'}${escape(node.name)}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${expanded?'m6 9 6 6 6-6':'m9 6 6 6-6 6'}" stroke="currentColor" stroke-width="1.75"/></svg></button>` : '<span class="export-tree-spacer"></span>'}<label><input type="checkbox" data-tree-select="${node.code}" data-values="${escape(JSON.stringify(leaves(node)))}"><span>|${node.code}|${escape(node.name)}</span></label></div>${node.children && expanded ? '<ul role="group">'+branch(node.children,level+1,force||selfMatch)+'</ul>' : ''}</li>`;
        }).join('');
      }
      content.innerHTML = '<ul class="export-category-tree" aria-label="类目树">'+branch(roots)+'</ul>';
      if(!content.querySelector('li')) content.innerHTML = '<div class="series-empty">暂无匹配数据</div>';
      content.querySelectorAll('[data-tree-toggle]').forEach(button => button.onclick=()=>{openNodes.has(button.dataset.treeToggle)?openNodes.delete(button.dataset.treeToggle):openNodes.add(button.dataset.treeToggle);drawTree();});
      content.querySelectorAll('[data-tree-select]').forEach(input => input.onchange=()=>{JSON.parse(input.dataset.values).forEach(value=>input.checked?pending.add(value):pending.delete(value));updateTreeChecks();});
      updateTreeChecks();
    }
    function draw() {
      if(key === 'category') return drawTree();
      const rows = allRows.filter(row => (row.code+' '+row.name).toLowerCase().includes(query));
      const totalPages = Math.max(1,Math.ceil(rows.length/10)); page = Math.min(page,totalPages);
      content.innerHTML = `<div class="compact-picker-table"><table><thead><tr><th class="export-picker-check"><input type="checkbox" data-picker-all aria-label="全选当前页"></th><th>编码</th><th>名称</th></tr></thead><tbody>${rows.slice((page-1)*10,page*10).map(row => `<tr tabindex="0" data-picker-row="${escape(row.name)}" aria-selected="${pending.has(row.name)}"><td><input type="checkbox" data-picker-choice="${escape(row.name)}" aria-label="选择${escape(row.name)}" ${pending.has(row.name)?'checked':''}></td><td>${escape(row.code)}</td><td title="${escape(row.name)}">${escape(row.name)}</td></tr>`).join('') || '<tr><td colspan="3" class="series-empty">暂无匹配数据</td></tr>'}</tbody></table></div>`;
      function update() { const inputs=[...content.querySelectorAll('[data-picker-choice]')];inputs.forEach(input=>{input.checked=pending.has(input.dataset.pickerChoice);input.closest('tr').setAttribute('aria-selected',String(input.checked));}); const n=inputs.filter(input=>input.checked).length;const all=$('[data-picker-all]'); all.checked=inputs.length>0&&n===inputs.length;all.indeterminate=n>0&&n<inputs.length;all.disabled=!inputs.length;count(); }
      content.querySelectorAll('[data-picker-row]').forEach(row => {
        const toggle=()=>{const name=row.dataset.pickerRow;pending.has(name)?pending.delete(name):pending.add(name);update();};
        row.onclick=event=>{if(event.target.type==='checkbox'){event.target.checked?pending.add(row.dataset.pickerRow):pending.delete(row.dataset.pickerRow);update();}else toggle();};
        row.onkeydown=event=>{if(event.target===row&&['Enter',' '].includes(event.key)){event.preventDefault();toggle();}};
      });
      $('[data-picker-all]').onchange=event=>{content.querySelectorAll('[data-picker-choice]').forEach(input=>event.target.checked?pending.add(input.dataset.pickerChoice):pending.delete(input.dataset.pickerChoice));update();};
      const numbers = new Set([1,totalPages,page-1,page,page+1]);
      let previous=0;
      pages.innerHTML = `<span>${rows.length}条数据</span><button type="button" class="proto-btn" data-picker-page="${page-1}" ${page===1?'disabled':''} aria-label="上一页">‹</button>`+[...numbers].filter(n=>n>0&&n<=totalPages).sort((a,b)=>a-b).map(n=>{const gap=previous&&n-previous>1?' <span>…</span> ':'';previous=n;return gap+`<button type="button" class="proto-btn ${n===page?'export-picker-active':''}" data-picker-page="${n}" ${n===page?'aria-current="page"':''}>${n}</button>`;}).join('')+`<button type="button" class="proto-btn" data-picker-page="${page+1}" ${page===totalPages?'disabled':''} aria-label="下一页">›</button>`;
      pages.querySelectorAll('[data-picker-page]').forEach(button=>button.onclick=()=>{page=Number(button.dataset.pickerPage);draw();});update();
    }
    $('.compact-picker-search').onsubmit=event=>{event.preventDefault();query=$('#exportPickerQuery').value.trim().toLowerCase();page=1;draw();};
    d.querySelectorAll('[data-picker-close]').forEach(button=>button.onclick=()=>d.close());
    $('[data-picker-confirm]').onclick=()=>{state[key]=new Set(pending);renderTags(key,field,state);onConfirm([...pending]);d.close();};
    $('[data-picker-clear]').onclick=()=>{pending.clear();draw();};
    d.addEventListener('proto:request-close',()=>d.close());
    d.addEventListener('keydown',event=>{if(event.key==='Escape')event.stopPropagation();});
    d.addEventListener('close',()=>{release();d.remove();opener.focus();},{once:true});
    draw();$('#exportPickerQuery').focus();
  }
  // 列表与导出复用同一选择弹窗，但保持各自的筛选状态。
  const listSelections = Object.fromEntries(groups.map(([key]) => [key,new Set()]));
  const listFields = [];
  for(const [key,label,id] of [['owner','货主','ownerSelect'],['brand','品牌','brandSelect'],['supplier','供应商','supplierFilter'],['projects','项目','projectFilter']]) {
    const original = document.getElementById(id);
    if(!original) continue;
    const field = original.closest('.filter-item');
    const oldChoices = [...original.options].filter(option => option.value).map(option => option.textContent);
    referenceChoices[key] ||= [];
    oldChoices.forEach((name,index) => { if(!choices(key).some(row => row.name===name)) referenceChoices[key].push(['LIST'+String(index+1).padStart(3,'0'),name]); });
    const value = document.createElement('input'); value.type='hidden'; value.id=id; value.defaultValue='';
    original.replaceWith(value);
    const trigger = document.createElement('button'); trigger.type='button'; trigger.id=id+'Picker'; trigger.className='export-picker-trigger list-filter-picker'; trigger.setAttribute('aria-haspopup','dialog'); trigger.dataset.listPicker=key;
    trigger.innerHTML='<span class="export-multiselect-selected">请选择，可多选</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="1.75"/></svg>';
    field.append(trigger);field.querySelector('label').htmlFor=trigger.id;
    trigger.onclick=()=>openPicker(key,label,field,listSelections,values=>{value.value=values.join('、');value.dispatchEvent(new Event('change',{bubbles:true}));});
    listFields.push([key,field,value]);
  }
  document.getElementById('filterForm')?.addEventListener('reset',()=>{
    for(const [key,field,value] of listFields) {listSelections[key].clear();value.value='';renderTags(key,field,listSelections);}
  });
  window.MpmFilterPicker = {choices,categoryTree,records};
})();
