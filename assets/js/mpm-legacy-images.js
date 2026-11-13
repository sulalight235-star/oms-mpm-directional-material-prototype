(() => {
  'use strict';
  function mountEditor(root,initial={main:[],detail:[]},initialEditable=true){
  root.classList.add('mpm-image-editor');
  let editable=initialEditable;
  const area=document.createElement('div');area.className='legacy-image-layout';
  area.innerHTML='<div class="legacy-image-groups"></div><section class="legacy-image-preview" aria-labelledby="legacyImagePreviewTitle"><h3 id="legacyImagePreviewTitle">预览窗</h3><div data-image-preview aria-live="polite">暂无图片</div></section>';
  root.append(area);
  area.addEventListener('click',event=>event.stopPropagation());
  const state={main:[],detail:[]},labels={main:'主图',detail:'详情图'},versions={main:0,detail:0};let selected=null,lastViewed=null,serial=0;
  function nextItem(kind,source){const seq=Math.max(0,...state[kind].map(item=>item.seq))+1;const ext=(source.sourceName||source.name||'image.png').match(/\.([a-z0-9]+)$/i)?.[1]||'png';return {...source,id:++serial,kind,seq,name:labels[kind]+String(seq).padStart(2,'0')+'.'+ext};}
  for(const kind of ['main','detail'])for(const item of initial[kind]||[])state[kind].push(nextItem(kind,item));
  selected=state.main[0]||state.detail[0]||null;
  const toast=(text,type='info')=>PrototypeUI.showToast(text,{type});
  function confirm(title,message,opener,action){
    const d=document.createElement('dialog');d.className='proto-modal legacy-image-confirm';d.innerHTML='<h2></h2><p></p><div class="legacy-image-dialog-actions"><button type="button" class="proto-btn" data-cancel>取消</button><button type="button" class="proto-btn proto-btn--primary" data-confirm>确认</button></div>';
    d.querySelector('h2').textContent=title;d.querySelector('p').textContent=message;document.body.append(d);d.showModal();const release=PrototypeUI.trapDialogFocus(d,opener);
    d.querySelector('[data-cancel]').onclick=()=>d.close();d.querySelector('[data-confirm]').onclick=()=>{action();d.close()};
    d.addEventListener('proto:request-close',()=>d.close());d.addEventListener('close',()=>{release();d.remove()},{once:true});
  }
  function choose(item){selected=item;draw();}
  function draw(){
    for(const kind of ['main','detail']){
      const group=area.querySelector(`[data-image-group="${kind}"]`),list=group.querySelector('[data-image-list]');
      list.querySelectorAll('.legacy-image-tile').forEach(e=>e.remove());group.querySelector('[data-image-count]').textContent=`（${state[kind].length}）`;group.querySelector('[data-clear-images]').disabled=!editable||!state[kind].length;group.querySelector('[data-add-image]').disabled=!editable;
      state[kind].forEach((item,index)=>{
        const tile=document.createElement('div');tile.className='legacy-image-tile';tile.dataset.imageId=item.id;if(lastViewed===item)tile.classList.add('is-last-viewed');
        const thumb=document.createElement('button');thumb.type='button';thumb.className='legacy-image-thumbnail';thumb.setAttribute('aria-label',`预览${labels[kind]}第${index+1}张：${item.name}`);thumb.setAttribute('aria-pressed',String(selected===item));
        const img=document.createElement('img');img.src=item.url;img.alt=item.name;thumb.append(img);thumb.onclick=()=>choose(item);thumb.oncontextmenu=e=>{if(!editable)return;e.preventDefault();e.stopPropagation();openMenu(item,e.clientX,e.clientY)};thumb.onkeydown=e=>{if(editable&&(e.key==='ContextMenu'||e.shiftKey&&e.key==='F10')){e.preventDefault();const box=thumb.getBoundingClientRect();openMenu(item,box.left,box.bottom)}};
        const remove=document.createElement('button');remove.type='button';remove.className='legacy-image-delete';remove.textContent='×';remove.setAttribute('aria-label',`删除${labels[kind]}第${index+1}张`);remove.hidden=!editable;remove.onclick=()=>confirm('删除图片',`确认删除这张${labels[kind]}？`,remove,()=>{const at=state[kind].indexOf(item);if(at<0)return;state[kind].splice(at,1);if(selected===item)selected=state[kind][Math.min(at,state[kind].length-1)]||state.main[0]||state.detail[0]||null;URL.revokeObjectURL(item.url);draw();group.querySelector('[data-add-image]').focus();});
        const name=document.createElement('span');name.className='legacy-image-filename';name.textContent=item.name;name.title=item.name;const more=document.createElement('button');more.type='button';more.className='legacy-image-more';more.textContent='⋯';more.hidden=!editable;more.setAttribute('aria-label','图片操作：'+item.name);more.onclick=()=>{const box=more.getBoundingClientRect();openMenu(item,box.left,box.bottom)};if(lastViewed===item){const mark=document.createElement('span');mark.className='legacy-image-viewed';mark.textContent='刚刚查看';tile.append(mark)}tile.append(thumb,remove,more,name);list.insertBefore(tile,group.querySelector('[data-add-image]'));
      });
    }
    const preview=area.querySelector('[data-image-preview]');preview.replaceChildren();
    if(!selected){preview.textContent='暂无图片';return;}
    const button=document.createElement('button');button.type='button';button.className='legacy-image-large';button.setAttribute('aria-label','查看大图：'+selected.name);
    const image=document.createElement('img');image.src=selected.url;image.alt=selected.name;button.append(image);button.onclick=()=>openLarge(selected,button);button.oncontextmenu=e=>{if(!editable)return;e.preventDefault();openMenu(selected,e.clientX,e.clientY)};
    const caption=document.createElement('p');caption.textContent=`${labels[selected.kind]} ${state[selected.kind].indexOf(selected)+1} / ${state[selected.kind].length}　${selected.name}`;preview.append(button,caption);
  }
  function openLarge(item,opener){
    const kind=item.kind;let index=state[kind].indexOf(item);
    const d=document.createElement('dialog');d.className='proto-modal legacy-image-lightbox';d.setAttribute('aria-label',labels[kind]+'大图预览');
    d.innerHTML='<div class="legacy-image-lightbox-head"><h2></h2><button type="button" class="proto-btn" data-close aria-label="关闭图片预览">×</button></div><img alt=""><div class="legacy-image-dialog-actions"><button type="button" class="proto-btn" data-prev>上一张</button><span aria-live="polite"></span><button type="button" class="proto-btn" data-next>下一张</button></div>';
    function update(){const pic=state[kind][index];d.querySelector('img').src=pic.url;d.querySelector('img').alt=pic.name;d.querySelector('h2').textContent=labels[kind]+'预览';d.querySelector('.legacy-image-dialog-actions span').textContent=`${index+1} / ${state[kind].length}`;d.querySelector('[data-prev]').disabled=d.querySelector('[data-next]').disabled=state[kind].length<2;}
    const step=delta=>{index=(index+delta+state[kind].length)%state[kind].length;update()};
    d.querySelector('[data-prev]').onclick=()=>step(-1);d.querySelector('[data-next]').onclick=()=>step(1);d.querySelector('[data-close]').onclick=()=>d.close();
    d.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();step(e.key==='ArrowLeft'?-1:1)}});
    document.body.append(d);d.showModal();const release=PrototypeUI.trapDialogFocus(d,opener);d.addEventListener('proto:request-close',()=>d.close());d.addEventListener('close',()=>{release();d.remove();selected=lastViewed=state[kind][index];draw();const thumb=area.querySelector(`[data-image-id="${selected.id}"] .legacy-image-thumbnail`);thumb?.scrollIntoView({block:'nearest',inline:'nearest'});thumb?.focus({preventScroll:true});},{once:true});update();
  }
  for(const kind of ['main','detail']){
    const group=document.createElement('section');group.className='legacy-image-group';group.dataset.imageGroup=kind;
    group.innerHTML=`<div class="legacy-image-group-head"><h3>${labels[kind]}<span data-image-count>（0）</span></h3><button type="button" class="xh-btn xh-btn-link xh-btn-sm" data-clear-images>清空图片</button></div><div class="legacy-image-list" data-image-list><button type="button" class="legacy-image-add" data-add-image aria-label="上传${labels[kind]}"><svg class="prototype-icon" aria-hidden="true"><use href="assets/icons/prototype-icons.svg#icon-plus"></use></svg><span>上传${labels[kind]}</span></button></div><input type="file" accept=".jpg,.jpeg,.png,.gif,.webp,.bmp" multiple hidden aria-label="选择${labels[kind]}文件">`;
    area.querySelector('.legacy-image-groups').append(group);const input=group.querySelector('input'),add=group.querySelector('[data-add-image]');add.onclick=()=>input.click();
    async function upload(files){if(!editable)return;const version=versions[kind];let count=0;
      for(const file of files){
        if(!/\.(jpe?g|png|gif|webp|bmp)$/i.test(file.name)){toast(`“${file.name}”格式不支持，请选择 JPG、PNG、GIF、WebP 或 BMP 图片`,'error');continue;}
        const url=URL.createObjectURL(file);const image=new Image();image.src=url;
        try{await image.decode()}catch{URL.revokeObjectURL(url);toast(`“${file.name}”无法读取，请选择有效图片后重试`,'error');continue;}
        if(!editable||version!==versions[kind]){URL.revokeObjectURL(url);continue;}
        const item=nextItem(kind,{sourceName:file.name,blob:file,url});state[kind].push(item);selected=item;count++;
      }
      input.value='';draw();if(count)toast(`已添加${count}张${labels[kind]}`);
    }
    input.onchange=()=>upload([...input.files]);
    group.querySelector('[data-clear-images]').onclick=e=>confirm('清空'+labels[kind],`确认清空全部${state[kind].length}张${labels[kind]}？`,e.currentTarget,()=>{versions[kind]++;state[kind].forEach(item=>URL.revokeObjectURL(item.url));state[kind]=[];if(selected?.kind===kind)selected=state.main[0]||state.detail[0]||null;draw();add.focus();});
    group.ondragover=e=>{e.preventDefault();group.classList.add('is-dragging')};group.ondragleave=()=>group.classList.remove('is-dragging');group.ondrop=e=>{e.preventDefault();group.classList.remove('is-dragging');upload([...e.dataTransfer.files])};
  }
  let closeMenu=()=>{};
  function openMenu(item,x,y){
    closeMenu();if(!editable)return;
    const menu=document.createElement('div');menu.className='legacy-image-context-menu';menu.setAttribute('role','menu');menu.setAttribute('aria-label','图片操作');
    const actions=[['AI抠图','icon-ai'],['在线PS','icon-edit'],['人脸模糊','icon-user'],['复制图片','icon-file']];
    const buttons=actions.map(([label,icon])=>{const button=document.createElement('button');button.type='button';button.setAttribute('role','menuitem');button.tabIndex=-1;button.innerHTML=`<svg class="prototype-icon" aria-hidden="true"><use href="assets/icons/prototype-icons.svg#${icon}"></use></svg><span>${label}</span>`;menu.append(button);return button;});
    const copy=buttons[3];document.body.append(menu);
    const box=menu.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(x,innerWidth-box.width-8))+'px';menu.style.top=Math.max(8,Math.min(y,innerHeight-box.height-8))+'px';
    const controller=new AbortController();
    closeMenu=(restore=false)=>{controller.abort();menu.remove();if(restore)area.querySelector(`[data-image-id="${item.id}"] .legacy-image-thumbnail`)?.focus();};
    buttons.slice(0,3).forEach((button,index)=>button.onclick=e=>{e.stopPropagation();closeMenu(true);toast(actions[index][0]+'：原型未实现');});
    copy.onclick=e=>{e.stopPropagation();if(!editable||!state[item.kind].includes(item)){closeMenu(true);return;}const duplicated=nextItem(item.kind,{sourceName:item.sourceName||item.name,blob:item.blob,url:item.blob?URL.createObjectURL(item.blob):item.url});state[item.kind].push(duplicated);selected=duplicated;closeMenu();draw();area.querySelector(`[data-image-id="${duplicated.id}"] .legacy-image-thumbnail`)?.focus();toast('图片已复制，命名为'+duplicated.name);};
    document.addEventListener('pointerdown',e=>{if(!menu.contains(e.target))closeMenu();},{capture:true,signal:controller.signal});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeMenu(true)}else if(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const index=buttons.indexOf(document.activeElement);const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(index+(['ArrowDown','ArrowRight'].includes(e.key)?1:-1)+buttons.length)%buttons.length;buttons[next].focus()}else if(e.key==='Tab')closeMenu();},{capture:true,signal:controller.signal});
    window.addEventListener('resize',()=>closeMenu(),{signal:controller.signal});document.addEventListener('wheel',e=>{if(!menu.contains(e.target))closeMenu()},{capture:true,signal:controller.signal});buttons[0].focus({preventScroll:true});
  }
  root.addEventListener('mpm:image-permission',event=>{editable=!!event.detail;closeMenu();draw();});
  window.addEventListener('pagehide',event=>{closeMenu();if(!event.persisted)Object.values(state).flat().forEach(item=>URL.revokeObjectURL(item.url))});
  draw();
  return {setEditable(value){root.dispatchEvent(new CustomEvent('mpm:image-permission',{detail:value}))}};
  }
  window.MpmImageEditor={mount:mountEditor};
  const legacy=document.querySelector('#pic_upload .picinfobox-UIVA_B');
  if(legacy){const first=[...legacy.children].find(e=>e.classList.contains('picinfotitle-x1kHBW')&&e.textContent.includes('主图'));if(first){let node=first;while(node){const next=node.nextElementSibling;node.remove();node=next;}mountEditor(legacy);}}
  const samples=(mainCount,detailCount)=>Object.fromEntries([['main',mainCount],['detail',detailCount]].map(([kind,count])=>[kind,Array.from({length:count},(_,i)=>({name:`image-${i+1}.svg`,url:`assets/images/material-preview/B0401025928-${kind}-${i%2+1}.svg`}))]));
  const traditional=document.querySelector('#section-images > .card-body');
  if(traditional){traditional.replaceChildren();mountEditor(traditional,samples(1,2));}
  const audit=document.querySelector('#card-images .img-section-row');
  if(audit){const lists=audit.querySelectorAll('.img-upload-area');const initial=samples(lists[0]?.querySelectorAll('.img-thumb').length||0,lists[1]?.querySelectorAll('.img-thumb').length||0);const videos=lists[2];const host=document.createElement('div');audit.before(host);if(videos){const label=document.createElement('p');label.textContent='视频';host.after(label,videos);}audit.remove();mountEditor(host,initial);}
  const context=document.body.dataset.seriesContext;
  if(['formal','review','draft','batch','mine','result'].includes(context)){
    const card=document.createElement('section');card.className='series-card';card.innerHTML='<h2>图片</h2><div data-detail-image-editor></div>';document.querySelector('#detailComparison')?.before(card);
    const host=card.querySelector('[data-detail-image-editor]');const main=document.querySelector('main');const editor=mountEditor(host,samples(2,2),main.dataset.imageEditable==='true');document.addEventListener('mpm:detail-images-state',event=>editor.setEditable(event.detail));
  }
})();
