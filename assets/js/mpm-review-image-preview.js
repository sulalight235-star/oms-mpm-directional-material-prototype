/* 委托事件，确保审核页签切换和查询重新渲染后仍可预览。 */
(() => {
  const body=document.getElementById('tableBody');if(!body)return;
  body.addEventListener('click',event=>{
    const button=event.target.closest('[data-review-image]');if(!button)return;
    const code=button.dataset.reviewImage;
    const images=kind=>Array.from({length:Number(button.dataset[kind==='main'?'mainCount':'detailCount'])||0},(_,index)=>`assets/images/material-preview/${code}-${kind}-${index+1}.svg`);
    window.MpmMaterialImagePreview.open(code,button.dataset.imageName,button,{main:images('main'),detail:images('detail')});
  });
})();
