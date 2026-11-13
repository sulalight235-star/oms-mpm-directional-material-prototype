/* 选中批改：仅修改本地原型中的所选物料。 */
(() => {
  'use strict';
  const exportDropdown=document.getElementById('exportDropdown');
  const table=document.querySelector('.list-layout .table-panel .table-wrap > table');
  if(!exportDropdown||!table)return;
  const headings=[...table.querySelectorAll('thead th')];
  const codeIndex=headings.findIndex(th=>['编码','物料编码'].includes(th.textContent.trim()));
  const nameIndex=headings.findIndex(th=>th.textContent.trim()==='名称');
  const shelfIndex=headings.findIndex(th=>th.textContent.trim()==='上/下架');
  const saleIndex=headings.findIndex(th=>th.textContent.trim()==='可售');
  const rows=[...table.querySelectorAll('tbody tr')].map(row=>({row,code:row.cells[codeIndex]?.textContent.match(/B\d+/)?.[0],nameCell:row.cells[nameIndex],shelf:row.cells[shelfIndex],sale:row.cells[saleIndex]})).filter(item=>item.code);
  const selected=new Set(), storageKey='mpm-selected-batch-material-state-v1';
  let changes={};try{changes=JSON.parse(localStorage.getItem(storageKey)||'{}');if(!changes||Array.isArray(changes)||typeof changes!=='object')changes={};}catch{}
  const notify=(message,type='info')=>PrototypeUI.showToast(message,{type});
  const dropdown=document.createElement('div');dropdown.className='dropdown material-selected-batch';
  dropdown.innerHTML=`<button class="tool-link material-selected-batch-trigger" id="selectedBatchBtn" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="selectedBatchMenu">选中批改<svg class="prototype-icon" aria-hidden="true"><use href="assets/icons/prototype-icons.svg#icon-chevron-down"></use></svg></button><div class="dropdown-menu" id="selectedBatchMenu" role="menu" aria-label="选中批改">${['上架','下架','可售','不可售','隐藏（商城）','展示（商城）','停产','未停产'].map(label=>`<button type="button" class="dropdown-item" role="menuitem" data-selected-batch-action="${label}" tabindex="-1">${label}</button>`).join('')}</div>`;
  exportDropdown.before(dropdown);
  const trigger=dropdown.querySelector('button'),items=[...dropdown.querySelectorAll('[role=menuitem]')];
  function close(focus=false){dropdown.classList.remove('open');trigger.setAttribute('aria-expanded','false');if(focus)trigger.focus();}
  function open(){exportDropdown.classList.remove('open');dropdown.classList.add('open');trigger.setAttribute('aria-expanded','true');}
  trigger.onclick=event=>{event.stopPropagation();dropdown.classList.contains('open')?close():open();};
  trigger.onkeydown=event=>{if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();event.stopPropagation();open();items[event.key==='ArrowDown'?0:items.length-1].focus();}};
  dropdown.onkeydown=event=>{const index=items.indexOf(document.activeElement);if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);}else if(index>=0&&['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();items[event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length].focus();}};
  document.addEventListener('click',event=>{if(!dropdown.contains(event.target))close();});
  dropdown.addEventListener('focusout',()=>setTimeout(()=>{if(!dropdown.contains(document.activeElement))close();},0));
  const heading=document.createElement('th');heading.className='material-selection-column';
  const selectAll=document.createElement('input');selectAll.type='checkbox';selectAll.setAttribute('aria-label','全选当前页物料');heading.append(selectAll);table.querySelector('thead tr').prepend(heading);
  rows.forEach(item=>{const td=document.createElement('td');td.className='material-selection-column';const input=document.createElement('input');input.type='checkbox';input.dataset.selectMaterial=item.code;input.setAttribute('aria-label','选择物料 '+item.code);td.append(input);item.row.prepend(td);item.input=input;input.onchange=()=>{input.checked?selected.add(item.code):selected.delete(item.code);updateSelection();};applyState(item,changes[item.code]||{});});
  const counter=document.querySelector('.list-layout .pagination-left');
  function updateSelection(){selectAll.checked=rows.length>0&&selected.size===rows.length;selectAll.indeterminate=selected.size>0&&selected.size<rows.length;rows.forEach(item=>item.input.checked=selected.has(item.code));if(counter)counter.textContent=counter.textContent.replace(/已选：\s*\d+/, '已选：'+selected.size);}
  selectAll.onchange=()=>{rows.forEach(item=>selectAll.checked?selected.add(item.code):selected.delete(item.code));updateSelection();};
  function applyState(item,state){
    if(state.shelf!==undefined){item.shelf.textContent=state.shelf?'上架':'下架';item.shelf.className=state.shelf?'status-up':'status-down';}
    if(state.sale!==undefined){item.sale.textContent=state.sale?'可售':'不可售';item.sale.className=state.sale?'status-sale':'status-unsale';}
    if(state.discontinued!==undefined){item.row.dataset.discontinued=state.discontinued?'是':'否';let badge=item.nameCell.querySelector('[data-discontinued]');if(!badge){badge=document.createElement('span');badge.dataset.discontinued='';item.nameCell.append(badge);}badge.className='proto-tag material-discontinued-label'+(state.discontinued?' proto-tag--danger':' proto-tag--success');badge.textContent=state.discontinued?'停产':'未停产';badge.title='是否停产：'+(state.discontinued?'是':'否');}
    if(state.hidden!==undefined){item.row.dataset.mallHidden=String(state.hidden);let badge=item.nameCell.querySelector('[data-mall-hidden]');if(state.hidden&&!badge){badge=document.createElement('span');badge.dataset.mallHidden='';badge.className='material-mall-hidden-label';badge.textContent='商城隐藏';item.nameCell.append(badge);}else if(!state.hidden)badge?.remove();}
  }
  function execute(action,codes){
    const next={...changes};const field=['上架','下架'].includes(action)?'shelf':['可售','不可售'].includes(action)?'sale':['停产','未停产'].includes(action)?'discontinued':'hidden';const value=['上架','可售','隐藏（商城）','停产'].includes(action);
    codes.forEach(code=>next[code]={...next[code],[field]:value});
    try{localStorage.setItem(storageKey,JSON.stringify(next));}catch{notify('保存失败，请稍后重试','error');return false;}
    changes=next;rows.filter(item=>codes.includes(item.code)).forEach(item=>applyState(item,changes[item.code]));notify('操作成功','success');return true;
  }
  function confirm(action,codes){
    const dialog=document.createElement('dialog');dialog.className='series-dialog material-batch-confirm';dialog.setAttribute('aria-labelledby','selectedBatchConfirmTitle');
    dialog.innerHTML=`<div class="series-dialog-head"><h2 id="selectedBatchConfirmTitle">确认${action}</h2><button class="proto-btn" type="button" data-cancel aria-label="关闭">×</button></div><div class="series-dialog-body"><p>确认对选中的 ${codes.length} 条物料执行“${action}”？</p><p class="series-muted">${action==='下架'?'操作后物料变为下架状态，可通过“上架”恢复。':action==='不可售'?'操作后物料变为不可售状态，可通过“可售”恢复。':'操作后物料在商城隐藏，可通过“展示（商城）”恢复。'}</p></div><div class="series-dialog-footer"><button type="button" class="proto-btn" data-cancel>取消</button><button type="button" class="proto-btn proto-btn--primary" data-confirm>确认</button></div>`;
    document.body.append(dialog);dialog.showModal();const release=PrototypeUI.trapDialogFocus(dialog,trigger);dialog.querySelectorAll('[data-cancel]').forEach(button=>button.onclick=()=>dialog.close());dialog.querySelector('[data-confirm]').onclick=()=>{if(execute(action,codes))dialog.close();};dialog.addEventListener('proto:request-close',()=>dialog.close());dialog.addEventListener('close',()=>{release();dialog.remove();trigger.focus();},{once:true});dialog.querySelector('[data-cancel]').focus();
  }
  items.forEach(item=>item.onclick=()=>{const codes=[...selected];const action=item.dataset.selectedBatchAction;close(true);if(!codes.length)return notify('请选择需要批改的物料');if(['下架','不可售','隐藏（商城）'].includes(action))confirm(action,codes);else execute(action,codes);});
})();
