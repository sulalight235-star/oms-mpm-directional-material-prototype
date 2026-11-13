/* 物料列表主图列与多图预览；图片为本地原型示例素材。 */
(() => {
  'use strict';
  const path = (code,kind,index) => `assets/images/material-preview/${code}-${kind}-${index+1}.svg`;
  window.MpmMaterialImagePreview = {open:openPreview};
  const table = document.querySelector('.list-layout .table-panel .table-wrap > table');
  if (!table || table.querySelector('[data-material-image-heading]')) return;
  const headings = [...table.querySelectorAll('thead th')];
  const codeIndex = headings.findIndex(th => ['编码','物料编码'].includes(th.textContent.trim()));
  const nameIndex = headings.findIndex(th => th.textContent.trim() === '名称');
  if (codeIndex < 0) return;
  const imageHeading = document.createElement('th');
  imageHeading.textContent = '主图'; imageHeading.dataset.materialImageHeading = ''; imageHeading.className = 'material-image-column';
  headings[codeIndex].after(imageHeading);
  const supportedCodes = new Set(['B0401025928','B0401025927','B0401025926','B0401025925','B0401025924','B0401025923','B0401025922','B0401025920']);
  [...table.querySelectorAll('tbody tr')].forEach(row => {
    const cell = row.cells[codeIndex], code = cell.textContent.match(/B\d+/)?.[0];
    const name = row.cells[nameIndex]?.textContent.trim() || '物料';
    const td = document.createElement('td'); td.className = 'material-image-column';
    if (!supportedCodes.has(code)) { td.textContent = '暂无图片'; cell.after(td); return; }
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'material-image-thumb'; button.dataset.previewMaterial = code;
    button.setAttribute('aria-label', `预览${name}的主图`); button.title = '点击预览主图'; button.setAttribute('aria-haspopup','dialog');
    const image = document.createElement('img'); image.src = path(code,'main',0); image.alt = name+'主图'; image.width = 48; image.height = 48; image.loading = 'lazy';
    button.append(image); td.append(button); cell.after(td);
    button.onclick = () => openPreview(code,name,button);
  });
  function openPreview(code,name,opener,gallery) {
    const images=gallery || {main:[path(code,'main',0),path(code,'main',1)],detail:[path(code,'detail',0),path(code,'detail',1)]};
    let kind='main',index=0,zoom=100,panX=0,panY=0,drag=null;
    const dialog=document.createElement('dialog');dialog.className='proto-modal material-image-preview';dialog.setAttribute('aria-labelledby','materialImagePreviewTitle');
    dialog.innerHTML=`<div class="material-preview-head"><div><h2 id="materialImagePreviewTitle"></h2><p></p></div><button type="button" data-preview-close aria-label="关闭图片预览"><svg class="prototype-icon" aria-hidden="true"><use href="assets/icons/prototype-icons.svg#icon-close"></use></svg></button></div><div class="material-preview-tabs" role="tablist" aria-label="图片类型"><button type="button" role="tab" id="materialMainImageTab" data-image-kind="main" aria-controls="materialImagePanel" aria-selected="true">主图（${images.main.length}）</button></div><div class="material-preview-stage" id="materialImagePanel" role="tabpanel" aria-labelledby="materialMainImageTab"><img data-image-large alt="" draggable="false"><p class="material-preview-empty" hidden></p></div><div class="material-preview-thumbnails" id="materialPreviewThumbnails" aria-label="选择图片"></div><div class="material-preview-controls" role="group" aria-label="图片预览操作"><button type="button" data-image-prev aria-label="上一张" title="上一张"><svg class="prototype-icon" aria-hidden="true"><use href="assets/icons/prototype-icons.svg#icon-arrow-left"></use></svg></button><span class="material-preview-info" aria-live="polite" aria-atomic="true"></span><button type="button" data-image-next aria-label="下一张" title="下一张"><svg class="prototype-icon" aria-hidden="true"><use href="assets/icons/prototype-icons.svg#icon-chevron-right"></use></svg></button><span class="material-preview-divider" aria-hidden="true"></span><button type="button" data-zoom-out aria-label="缩小" title="缩小"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" stroke-width="2"/></svg></button><button type="button" class="material-preview-zoom" data-zoom-reset aria-label="恢复100%显示" title="恢复100%显示">100%</button><button type="button" data-zoom-in aria-label="放大" title="放大"><svg class="prototype-icon" aria-hidden="true"><use href="assets/icons/prototype-icons.svg#icon-plus"></use></svg></button><span class="material-preview-divider" aria-hidden="true"></span><button type="button" data-toggle-thumbnails aria-expanded="true" aria-controls="materialPreviewThumbnails" aria-label="隐藏缩略图" title="隐藏缩略图"><svg class="prototype-icon" aria-hidden="true"><use href="assets/icons/prototype-icons.svg#icon-grid"></use></svg></button></div>`;
    dialog.querySelector('h2').textContent=name+' · 图片预览';dialog.querySelector('.material-preview-head p').textContent=code;
    const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';document.body.append(dialog);dialog.showModal();
    const release=PrototypeUI.trapDialogFocus(dialog,opener);
    const $=selector=>dialog.querySelector(selector),image=$('[data-image-large]');
    const title=()=>kind==='main'?'主图':'详情图';
    function applyZoom(){image.style.transform=`translate(${panX}px,${panY}px) scale(${zoom/100})`;image.style.cursor=zoom>100?'grab':'default';$('[data-zoom-reset]').textContent=zoom+'%';$('[data-zoom-out]').disabled=!images[kind].length||zoom<=25;$('[data-zoom-in]').disabled=!images[kind].length||zoom>=300;$('[data-zoom-reset]').disabled=!images[kind].length;}
    function render(){
      zoom=100;panX=panY=0;image.hidden=!images[kind].length;if(images[kind].length)image.src=images[kind][index];else image.removeAttribute('src');image.alt=`${name}${title()}第${index+1}张`;
      $('[data-image-prev]').disabled=images[kind].length<2;$('[data-image-next]').disabled=images[kind].length<2;
      $('.material-preview-info').textContent=images[kind].length?`${index+1} / ${images[kind].length}`:'0 / 0';$('.material-preview-info').setAttribute('aria-label',images[kind].length?`${title()}第${index+1}张，共${images[kind].length}张`:`暂无${title()}`);
      $('.material-preview-empty').hidden=!!images[kind].length;$('.material-preview-empty').textContent='暂无'+title();
      $('.material-preview-thumbnails').replaceChildren();
      for(let n=0;n<images[kind].length;n++){
        const button=document.createElement('button');button.type='button';button.className='material-preview-small';button.setAttribute('aria-label',`查看${title()}第${n+1}张`);button.setAttribute('aria-pressed',String(n===index));
        const thumb=document.createElement('img');thumb.src=images[kind][n];thumb.alt=`${name}${title()}${n+1}`;thumb.width=64;thumb.height=52;button.append(thumb);button.onclick=()=>{index=n;render();$('.material-preview-thumbnails').children[n].focus();};$('.material-preview-thumbnails').append(button);
      }
      applyZoom();
    }
    const step=delta=>{const inThumbs=document.activeElement?.closest('.material-preview-thumbnails');if(!images[kind].length)return;index=(index+delta+images[kind].length)%images[kind].length;render();if(inThumbs)$('.material-preview-thumbnails').children[index].focus();};
    $('[data-image-prev]').onclick=()=>step(-1);$('[data-image-next]').onclick=()=>step(1);
    $('[data-zoom-out]').onclick=()=>{zoom=Math.max(25,zoom-25);if(zoom<=100)panX=panY=0;applyZoom();};$('[data-zoom-in]').onclick=()=>{zoom=Math.min(300,zoom+25);applyZoom();};$('[data-zoom-reset]').onclick=()=>{zoom=100;panX=panY=0;applyZoom();};
    $('[data-toggle-thumbnails]').onclick=event=>{const strip=$('.material-preview-thumbnails');strip.hidden=!strip.hidden;event.currentTarget.setAttribute('aria-expanded',String(!strip.hidden));event.currentTarget.setAttribute('aria-label',strip.hidden?'显示缩略图':'隐藏缩略图');event.currentTarget.title=strip.hidden?'显示缩略图':'隐藏缩略图';};
    image.onpointerdown=event=>{if(zoom<=100)return;event.preventDefault();drag={x:event.clientX,y:event.clientY,panX,panY};image.setPointerCapture(event.pointerId);image.style.cursor='grabbing';};
    image.onpointermove=event=>{if(!drag)return;panX=drag.panX+event.clientX-drag.x;panY=drag.panY+event.clientY-drag.y;image.style.transform=`translate(${panX}px,${panY}px) scale(${zoom/100})`;};
    const stopDrag=()=>{drag=null;image.style.cursor=zoom>100?'grab':'default';};image.onpointerup=stopDrag;image.onpointercancel=stopDrag;
    $('[data-preview-close]').onclick=()=>dialog.close();$('.material-preview-stage').onclick=event=>{if(event.target===$('.material-preview-stage'))dialog.close();};
    dialog.addEventListener('keydown',event=>{if(event.key==='Escape')event.stopPropagation();if(!event.target.closest('[role=tablist]')&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();step(event.key==='ArrowRight'?1:-1);}});
    dialog.addEventListener('proto:request-close',()=>dialog.close());dialog.addEventListener('close',()=>{release();dialog.remove();document.body.style.overflow=previousOverflow;opener.focus();},{once:true});
    render();$('[data-preview-close]').focus();
  }
})();
