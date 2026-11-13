/* 批量新增前置校验原型。读取真实 Excel；系统字典、权限与重复检查使用本地演示上下文。 */
(() => {
  'use strict';
  const rules = window.MpmPreimportRules;
  const $ = (s, root = document) => root.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const KEY = 'mpm-preimport-batches-v1';
  const required = ['四级类目编码','四级类目名称','创建组织编码','货主编码','物料名称','型号','品牌编码','品牌名称','基本单位编码','基本单位名称','类型','物料等级'];
  const baseHeaders = [...required.slice(0,10), '类型','物料等级','市场价','商城价','结算价','项目调拨参考价','参考供货价','起订量','规格','描述','内部备注','条形码','助记码','厂家订货号','物料别名','供应商名称','意向项目','毛重','净重','长度','宽度','高度','是否倍数下单','发货期','安装费','检测费'];
  const headers = [...baseHeaders, ...Array.from({length:4}, (_,i) => ['链接','店铺类型','外链销售单位数量','咸亨销售单位数量'].map(k => `外链${i+1}${k}`)).flat()];
  const cats = [...new Set(rules.map(r => r.category))];
  // 以下是可复现的演示查询结果；不将本地缺失字典伪装成线上真实查询。
  const dictionary = {
    owners: {'ORG002':{name:'万聚国际（杭州）'},'ORG001':{name:'威亨国际科技'},'ORG-CONFIG':{name:'配置缺失演示货主',missingConfig:true}},
    categories: {'04010201':{name:'电动工具',level:4},'01010101':{name:'消费类无人机类别',level:4},'0401':{name:'电动/气动工具',level:2},'04010202':{name:'税编缺失演示类目',level:4,missingTax:true},'09010101':{name:'产业演示类目',level:4,industry:true}},
    brands: {'BR001':{name:'斯派克/SPIAKE'},'BR002':{name:'牛享/NIUXIAN'},'LIST001':{name:'牧田/MAKITA'},'BR-OFF':{name:'禁用演示品牌',disabled:true},'BR-LIMIT':{name:'限价演示品牌',min:50,max:500},'BR-MAX':{name:'最高限价演示品牌',max:500},'BR-MIN':{name:'最低限价演示品牌',min:50}},
    units: {'EA':'个','TAI':'台','HE':'盒','DAI':'袋'},
    suppliers:['咸亨国际科技股份有限公司','牧田（中国）有限公司'], projects:['华东区域项目','电力检修项目'],
    // 名称+型号+品牌命中下列样例时，返回各类已存在物料状态。
    duplicates: Array.from({length:10},(_,i)=>({name:['已存在演示物料','无审批员演示物料','异常重复演示物料','临时审核演示物料','采购待审演示物料','商品待审演示物料','撤回演示物料','驳回演示物料','处理中演示物料','其他审核演示物料'][i],model:'DEMO-01',brand:'BR001',rule:16+i,code:'B04010259'+(28-i)})),
    forbidden:['★','※'], canSetSettlement:true
  };
  const clean = s => String(s ?? '').trim();
  const normalize = s => clean(s).replace(/[（(]/g,'').replace(/[）)*＊\s]/g,'').replace(/^\*/,'');
  function number(v) { const s=clean(v); return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s) && Number.isFinite(Number(s)) ? Number(s) : NaN; }
  const decimals = v => (clean(v).split('.')[1] || '').length;
  const sample = () => Object.fromEntries(headers.map(h => [h, ({'四级类目编码':'04010201','四级类目名称':'电动工具','创建组织编码':'ORG002','货主编码':'ORG002','物料名称':'充电式电钻','型号':'QA-2026','品牌编码':'BR001','品牌名称':'斯派克/SPIAKE','基本单位编码':'EA','基本单位名称':'个','类型':'2','物料等级':'常规','市场价':'200','商城价':'150','结算价':'100','起订量':'1'})[h] || '']));
  function validateRow(data, rowNo, context = dictionary) {
    const errors=[]; const v=h=>clean(data[h]); const n=h=>number(v(h));
    const add=(id,field,vars={},override) => {
      const rule=rules.find(r=>r.id===id); if(!rule) return;
      const msg=(override || rule.message).replace(/\{([^}]+)\}/g,(_,k)=>String(vars[k] ?? v(k) ?? '')).replace(/<br\s*\/?\s*>/gi,'；').replace(/；$/,'');
      if(!errors.some(e=>e.message===`第${rowNo}行，${msg}`)) errors.push({id,field,category:rule.category,type:rule.type,message:`第${rowNo}行，${msg}`});
    };
    const missing=required.filter(h=>!v(h)); if(missing.length) add(1,missing.join('、'),{'字段名':missing.join('；')});
    if(!v('市场价')) add(3,'市场价'); if(!v('起订量')) add(4,'起订量');
    const owner=context.owners[v('货主编码')], category=context.categories[v('四级类目编码')],brand=context.brands[v('品牌编码')],unit=context.units[v('基本单位编码')];
    if(v('货主编码')&&!owner) add(6,'货主编码');
    if(v('四级类目编码')&&!category) add(7,'四级类目编码',{'类目编码':v('四级类目编码')});
    if(category){
      if(v('四级类目名称')&&v('四级类目名称')!==category.name) add(8,'四级类目名称',{'系统类目名称':category.name});
      if(category.level!==4) add(9,'四级类目编码',{'类目名称':category.name});
      if(category.industry) add(10,'四级类目编码');
      if(category.missingTax) [33,34,35,36].forEach(id=>add(id,'税收分类配置'));
      if(category.taxRateInvalid) add(37,'税率',{'类目税率':category.taxRate});
    }
    if(v('品牌编码')&&!brand) add(11,'品牌编码');
    if(brand){if(v('品牌名称')&&v('品牌名称')!==brand.name) add(12,'品牌名称');if(brand.disabled)add(13,'品牌编码',{'填写的品牌名称':v('品牌名称')});}
    if(v('基本单位编码')&&!unit) add(14,'基本单位编码',{'单位编码':v('基本单位编码')});
    if(unit&&v('基本单位名称')&&v('基本单位名称')!==unit) add(15,'基本单位名称',{'单位编码':v('基本单位编码'),'填写的单位名称':v('基本单位名称')});
    if(owner?.missingConfig) [28,29,30,31,32].forEach(id=>add(id,'货主配置'));
    if(owner?.missingFields?.length) add(38,'货主配置',{'物料编码':v('物料编码')||'待生成','字段列表':owner.missingFields.join('、')});
    if(brand && v('物料名称') && v('型号')) {
      const duplicate=context.duplicates.find(d=>d.name===v('物料名称')&&d.model===v('型号')&&d.brand===v('品牌编码'));
      if(duplicate) add(duplicate.rule,'物料名称/型号/品牌',{'物料编码':duplicate.code,'审批员姓名':'王云龙','采购员姓名':'张银群','创建人姓名':'管理员','物料名称':duplicate.name,'任务编码':'DEMO-TASK-001'});
    }
    if(v('供应商名称')&&!context.suppliers.includes(v('供应商名称')))add(26,'供应商名称',{'供应商名称':v('供应商名称')});
    if(v('意向项目')) v('意向项目').split('/').forEach(p=>{if(p.trim()&&!context.projects.includes(p.trim()))add(27,'意向项目',{'项目名称':p.trim()});});
    ['物料名称','型号'].forEach((h,i)=>{const chars=context.forbidden.filter(c=>v(h).includes(c));if(chars.length)add(39+i,h,{'全部禁止字符，以、分隔':chars.join('、')});});
    ['物料名称','型号','规格','描述'].forEach(h=>{const chars=[...new Set(v(h).match(/[\\"']/g)||[])];if(chars.length)add(41,h,{'字段名':h,'命中的字符，以逗号分隔':chars.join(',')});});
    [['物料名称',100,42],['型号',100,43],['描述',1000,44],['内部备注',500,47],['条形码',20,48],['助记码',20,49],['厂家订货号',40,50],['物料别名',2000,52]].forEach(([h,max,id])=>{if([...v(h)].length>max)add(id,h,{'新生成的物料编码':'待生成'});});
    if(/\s/.test(v('型号')))add(45,'型号');
    const appended=v('描述')+(v('安装费')==='1'?'含安装费':'')+({'1':'含第三方检测费','2':'含出厂检测费'}[v('检测费')]||'');
    if(v('描述').length<=1000&&appended.length>1000)add(46,'描述');
    if(v('厂家订货号')&&!/^[\p{Script=Han}A-Za-z0-9]+$/u.test(v('厂家订货号')))add(51,'厂家订货号');
    const priceFields=['市场价','商城价','结算价','项目调拨参考价','参考供货价'];
    const parsed={};
    priceFields.forEach((h,i)=>{
      if(!v(h))return;
      let value=n(h); if(!Number.isFinite(value)){add(53+i,h,{},`${h}【${v(h)}】格式非法，请设置大于0的数字值`);return;}
      value=Math.round(value*10**(h==='结算价'?3:2))/10**(h==='结算价'?3:2);parsed[h]=value;
      const max=h==='结算价'?9999999.999:9999999.99;
      if(value<0.01||value>max)add(h==='结算价'?64:63,h,{'价格字段名':h});
      if(value<0&&h==='商城价')add(58,h);if(value<0&&h==='结算价')add(59,h);
      if(value<0&&h==='项目调拨参考价')add(60,h,{'转换后的数值':value});if(value<0&&h==='参考供货价')add(61,h,{'参考供货价原值':v(h)});
    });
    if(v('结算价')&&!context.canSetSettlement)add(62,'结算价');
    if(v('货主编码')==='ORG002'&&v('类型')==='2'&&!(n('结算价')>0)&&!(n('项目调拨参考价')>0))add(65,'结算价/项目调拨参考价');
    if(v('毛重')){if(!Number.isFinite(n('毛重')))add(66,'毛重');else if(Math.round(n('毛重')*100)/100<=0)add(67,'毛重');}
    if(v('净重')&&!Number.isFinite(n('净重')))add(68,'净重');
    ['长度','宽度','高度'].forEach((h,i)=>{if(v(h)&&(!/^[+-]?\d+$/.test(v(h))||n(h)<-2147483648||n(h)>2147483647))add(69+i,h);});
    if(v('起订量')){const q=n('起订量');if(!Number.isFinite(q))add(72,'起订量');else{if(q<=0)add(73,'起订量');if(decimals(v('起订量'))>3)add(74,'起订量');if(q<0.001||q>9999999.999)add(75,'起订量');}}
    const market=parsed['市场价'],mall=parsed['商城价']??0,transfer=parsed['项目调拨参考价']??0,cost=parsed['结算价']>0?parsed['结算价']:transfer;
    // 数字格式/范围不通过时，不追加依赖这些价格的关系错误。
    if(market>=0.01 && !errors.some(e=>priceFields.includes(e.field))){
      if(mall>0&&transfer>0&&!(market>=mall&&mall>transfer))add(76,'市场价/商城价/项目调拨参考价');
      else if(mall>0&&!(transfer>0)&&market<mall)add(77,'市场价/商城价');
      else if(!(mall>0)&&transfer>0&&market<=transfer)add(78,'市场价/项目调拨参考价');
      if(cost>0&&mall>0&&!(market>=mall&&mall>cost))add(79,'市场价/商城价/结算价',{'物料编码':'待生成'});
      else if(!(mall>0)&&cost>0&&market<=cost)add(81,'市场价/结算价',{'物料编码':'待生成'});
    }
    if(brand && mall>0 && !errors.some(e=>e.field==='商城价')){
      if(brand.min!=null&&brand.max!=null&&(mall<brand.min||mall>brand.max))add(82,'商城价',{'物料编码':'待生成'});
      else if(brand.min==null&&brand.max!=null&&mall>brand.max)add(83,'商城价',{'物料编码':'待生成'});
      else if(brand.max==null&&brand.min!=null&&mall<brand.min)add(84,'商城价',{'物料编码':'待生成'});
    }
    if(v('类型')&&!['1','2','3'].includes(v('类型')))add(86,'类型');
    if(v('物料等级')&&!['主推','常规','零星'].includes(v('物料等级')))add(87,'物料等级');
    if(v('是否倍数下单')&&!['0','1'].includes(v('是否倍数下单')))add(88,'是否倍数下单');
    if(v('发货期')&&!/^[1-9]\d{0,9}$/.test(v('发货期')))add(89,'发货期');
    if(v('安装费')&&!['0','1'].includes(v('安装费')))add(90,'安装费');
    if(v('检测费')&&!['0','1','2'].includes(v('检测费')))add(91,'检测费');
    for(let i=1;i<=4;i++){
      const keys=['链接','店铺类型','外链销售单位数量','咸亨销售单位数量'].map(k=>`外链${i}${k}`);
      const values=keys.map(v);if(!values.some(Boolean))continue;
      if(!values.every(Boolean))add(92,`外链${i}`);
      if(values[0]){try{const url=new URL(values[0]);if(!['http:','https:'].includes(url.protocol))throw Error();}catch{add(93,keys[0],{},`外链${i}：请输入合法链接`);}}
      if(values[1]&&!['自营','第三方'].includes(values[1]))add(94,keys[1],{},`外链${i}：无此店铺类型！`);
      [2,3].forEach((pos,j)=>{if(!values[pos])return;const val=number(values[pos]),start=j===0?95:99,prefix=j===0?'外部':'内部';if(!Number.isFinite(val))add(start+3,keys[pos],{},`外链${i}：${prefix}单位参数不合法！`);else{if(val<=0)add(start,keys[pos],{},`外链${i}：${prefix}单位参数必须大于0！`);if(decimals(values[pos])>4)add(start+1,keys[pos],{},`外链${i}：${prefix}单位参数小数点后最多4位！`);if(values[pos].replace(/^[+-]/,'').split('.')[0].length>8)add(start+2,keys[pos],{},`外链${i}：${prefix}单位参数最多8位！`);}});
    }
    return {rowNo,data,errors};
  }

  let state={phase:'idle',file:null,source:null,results:[],fileError:'',task:null};
  let dialog,release,opener;
  let auditProgress={done:0,total:null};
  function icon(name) {return `<svg class="prototype-icon" aria-hidden="true"><use href="assets/icons/prototype-icons.svg#icon-${name}"></use></svg>`;}
  function init(){
    if(!window.PrototypeUI)return;
    const entry=$('#preImportBtn'); if(!entry)return;
    entry.onclick=()=>open(entry);
    $('#batchTemplateBtn').onclick=()=>downloadTemplate();
    dialog=document.createElement('dialog');dialog.id='preImportDialog';dialog.className='proto-modal preimport-dialog';dialog.setAttribute('aria-labelledby','preImportTitle');
    dialog.innerHTML=`<header class="preimport-head"><h2 id="preImportTitle">导入模板</h2><button type="button" class="proto-btn proto-icon-btn" data-action="close" aria-label="关闭导入模板">${icon('close')}</button></header><div class="preimport-body"></div><footer class="preimport-footer"></footer>`;
    document.body.append(dialog);
    dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
    dialog.addEventListener('click',e=>{const closeButton=e.target.closest('[data-window-close]');if(closeButton){const windowEl=closeButton.closest('.preimport-window');windowEl.close();const remaining=dialog.querySelectorAll('.preimport-window[open]').length;dialog.classList.toggle('preimport-single-window',remaining===1);if(!remaining)close();else dialog.querySelector('.preimport-window[open] button')?.focus();return;}const button=e.target.closest('[data-action]');if(button)action(button.dataset.action);});
    // 动态结果区的焦点目标随状态变化，使用公共焦点陷阱并在每次渲染后重新绑定。
    dialog.addEventListener('proto:request-close',()=>close());
    const guide=$('.demo-tips-body')||$('.demo-tips');if(guide){const p=document.createElement('p');p.className='preimport-demo-note';p.innerHTML=`<b>预导入演示：</b>点击“预导入”→选择Excel→开始导入→自动前置校验→下载同一行的全部错误→修改完整原模板重新上传→全部通过后提交。系统查询使用本地演示字典，非线上真实校验；下一步任务仅写入当前浏览器。<button type="button" class="preimport-link" data-demo="pass">下载通过样例</button><button type="button" class="preimport-link" data-demo="fail">下载多错误样例</button>`;guide.append(p);p.querySelectorAll('[data-demo]').forEach(b=>b.onclick=()=>downloadTemplate(b.dataset.demo));}
    restoreRows();
  }
  function open(trigger){opener=trigger||opener;dialog.showModal();render();}
  function close(){if(['checking','submitting'].includes(state.phase)){PrototypeUI.showToast('处理中，请稍候',{type:'info'});return;}dialog.close();release?.();release=null;opener?.focus();}
  function bindFocus(){release?.();release=PrototypeUI.trapDialogFocus(dialog,opener);}
  const counts=()=>({total:state.results.length,failed:state.results.filter(r=>r.errors.length).length,errors:state.results.reduce((n,r)=>n+r.errors.length,0)});
  function steps(){const stage=state.phase==='submitted'?3:2;return `<ol class="preimport-steps" aria-label="批量新增导入流程">${['获取模板','导入模板','获取拓展模板','拓展属性导入','图片上传OSS关联','提交审核完成'].map((s,i)=>`<li class="${i+1<stage?'done':i+1===stage?'active':''}" ${i+1===stage?'aria-current="step"':''}><span class="preimport-step-num">${i+1<stage?icon('check'):i+1}</span><strong>${s}</strong><span>${['在操作栏下载模板<br>填写待导入数据','上传整理好的模板<br>生成导入批号','通过预导出获取<br>含拓展属性的Excel','通过拓展属性导入<br>补充拓展属性','关联主图<br>及详情图','提交进入<br>审核流程'][i]}</span></li>`).join('')}</ol>`;}
  function resultCard(passed,results,current){
    const c={total:results.length,failed:results.filter(r=>r.errors.length).length,errors:results.reduce((sum,r)=>sum+r.errors.length,0)};
      const resultIcon=passed?'<svg class="prototype-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>':icon('close');
      const totals=cats.map(category=>({name:category,count:results.reduce((sum,row)=>sum+row.errors.filter(e=>e.category===category).length,0)}));
      const displayCategories=totals;
      const content=`<section class="preimport-result" aria-live="polite"><div class="preimport-result-icon ${passed?'success':'failure'}">${resultIcon}</div><h3>${passed?'预审核全部通过':'预审核未通过'}</h3><p>${passed?`共校验${c.total}行，全部通过`:`共${c.total}行，通过${c.total-c.failed}行，失败${c.failed}行`}</p>${passed?'':`<p class="preimport-error preimport-error-count">失败${c.failed}行共发现${c.errors}项错误</p>`}<div class="preimport-category-box"><h4>${icon('list')}${passed?'预审核通过项':'预审核结果'}</h4><div class="preimport-categories">${displayCategories.map(item=>`<span class="preimport-category-row ${item.count?'preimport-error':'preimport-category-passed'}" data-category="${esc(item.name)}" data-status="${item.count?'failed':'passed'}">${icon(item.count?'close':'check')}<span class="preimport-category-name">${esc(item.name)}</span><strong>${item.count?`未通过（${item.count}项错误）`:'通过'}</strong></span>`).join('')}</div></div><div class="preimport-result-notes"><p>${icon('info')}${passed?'预审核通过，可提交下一步任务。':'请下载错误文件，修改完整模板后重新上传。'}</p><p>${icon('info')}${passed?'点击确认后，系统才提交下一步任务处理。':'存在失败行时，整批不可提交下一步任务。'}</p></div></section>`;
      let buttons=passed?'<button type="button" class="proto-btn" data-action="close">暂不提交</button><button type="button" class="proto-btn proto-btn--primary preimport-confirm" data-action="submit">'+'<svg class="prototype-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="m3 3 18 9-18 9 4-9-4-9Z"/><path d="M7 12h14"/></svg>'+'确认提交任务</button>':'<button type="button" class="proto-btn" data-action="download">下载错误文件</button><button type="button" class="proto-btn proto-btn--primary" data-action="retry">重新上传</button>';

    if(!current)buttons=buttons.replace(/data-action="[^"]+"/g,'disabled title="状态示例，不处理当前文件"');
    return `<dialog open id="preImport${passed?'Pass':'Fail'}Window" class="proto-modal preimport-result-dialog preimport-state-card preimport-window" aria-labelledby="preImport${passed?'Pass':'Fail'}Title" data-outcome="${passed?'passed':'failed'}" data-current="${current}"><header class="preimport-head"><h2 id="preImport${passed?'Pass':'Fail'}Title">物料预审结果</h2><button type="button" class="proto-btn proto-icon-btn" data-window-close aria-label="关闭${passed?'通过':'未通过'}状态弹窗">${icon('close')}</button></header><div class="preimport-state-head"><strong>${passed?'通过状态':'未通过状态'}</strong><span>${current?'当前文件':'状态示例'}</span></div><div class="preimport-state-body">${content}</div><footer class="preimport-footer">${buttons}</footer></dialog>`;
  }
  function render(){
    const body=$('.preimport-body',dialog),footer=$('.preimport-footer',dialog);const c=counts();
    dialog.dataset.importPhase=state.phase;
    dialog.classList.remove('preimport-single-window');
    const compact=['checking','passed','failed','submitting'].includes(state.phase);
    dialog.classList.toggle('preimport-result-dialog',compact);
    $('#preImportTitle').textContent=compact?'物料预审结果':'导入模板';
    dialog.classList.toggle('preimport-comparison',['passed','failed'].includes(state.phase));
    $('[data-action="close"]',dialog).setAttribute('aria-label',compact?'关闭物料预审结果':'关闭导入模板');
    const busy=['checking','submitting'].includes(state.phase);$('[data-action="close"]',dialog).disabled=busy;
    let content=''; let buttons='';
    if(state.phase==='idle'||state.phase==='file-error'){
      content=`<div class="preimport-upload"><label for="preImportFile">导入文件</label><div class="preimport-file-row"><button type="button" class="proto-btn preimport-file-button" data-action="choose">${esc(state.file?.name||'请选择文件')}</button><input id="preImportFile" type="file" accept=".xlsx,.xls" hidden><button type="button" class="proto-btn proto-btn--primary" data-action="start" aria-describedby="preImportFlowHint" ${state.file?'':'disabled'}>开始导入</button></div><p>支持 .xlsx、.xls，请上传完整物料模板。</p><p id="preImportFlowHint">点击【开始导入】后自动进行系统前置校验；全部通过后，点击【确认提交任务】进入下一步处理。</p>${state.fileError?`<p class="preimport-error" role="alert">${esc(state.fileError)}</p>`:''}<button type="button" class="preimport-link" data-action="template">下载导入模板</button></div>`;
      buttons='<button type="button" class="proto-btn" data-action="close">关闭</button>';
    }else if(busy){
      content=`<section class="preimport-result" role="status" aria-live="polite"><div class="preimport-result-icon loading">${icon('refresh')}</div><h3>${state.phase==='checking'?'正在进行预审核':'正在提交下一步任务'}</h3><p>${state.phase==='checking'?'正在读取模板并核对字段、基础数据及业务规则，请稍候。':'校验已通过，正在生成导入批号及待补充数据，请勿重复提交。'}</p><progress id="preImportProgress" aria-label="预审核进度"></progress><p id="preImportProgressText">${state.phase==='checking'?'正在读取模板数据':'正在提交任务'}</p><p>${esc(state.file?.name)}</p></section>`;
      buttons='<button type="button" class="proto-btn" disabled>处理中，请稍候</button>';
    }else if(state.phase==='passed'||state.phase==='failed'){
      const passed=state.phase==='passed';
      const good=validateRow(sample(),2);
      const bad=validateRow({...sample(),'品牌编码':'BR999','型号':'QA 2026','起订量':'0'},2);
      content=`<div class="preimport-state-grid">${resultCard(true,passed?state.results:[good],passed)}${resultCard(false,passed?[bad]:state.results,!passed)}</div>`;
      buttons='';
    }else if(state.phase==='submitted'){
      content=`<section class="preimport-result" role="status"><div class="preimport-result-icon success">${icon('check')}</div><h3>导入处理完成</h3><p>已生成导入批号，物料已加入批量新增列表，可继续补充拓展属性及图片。</p><div class="preimport-receipt"><p>任务编号：<b>${esc(state.task.id)}</b></p><p>导入批号：<b>${esc(state.task.batch)}</b></p><p>本次导入：<b>${c.total}</b> 条</p><p>文件名称：${esc(state.file.name)}</p></div></section>`;
      buttons='<button type="button" class="proto-btn" data-action="close">返回列表</button><button type="button" class="proto-btn" data-action="retry">继续导入</button><button type="button" class="proto-btn proto-btn--primary" data-action="extension">获取拓展模板</button>';
    }
    body.innerHTML=(compact?'':steps())+content;footer.innerHTML=buttons;
    const input=$('#preImportFile',dialog);if(input)input.onchange=()=>{const file=input.files[0];if(file){state={phase:'idle',file,source:null,results:[],fileError:'',task:null};render();$('[data-action="start"]',dialog).focus();}};
    bindFocus();
    if(dialog.classList.contains('preimport-comparison'))dialog.querySelector('.preimport-window[data-current="true"] button')?.focus();
  }
  function action(name){
    if(['checking','submitting'].includes(state.phase)&&name!=='close')return;
    ({close,choose:()=>$('#preImportFile',dialog)?.click(),start:checkFile,template:downloadTemplate,
      download:downloadErrors,
      retry:()=>{state={phase:'idle',file:null,source:null,results:[],fileError:'',task:null};render();$('[data-action="choose"]',dialog).focus();},submit,extension:downloadExtension,
    }[name]||(()=>{}))();
  }
  async function checkFile(){
    if(!state.file)return;
    const file=state.file;state.phase='checking';state.fileError='';auditProgress={done:0,total:null};render();
    await new Promise(r=>setTimeout(r,450));
    try{
      if(!/\.(xlsx|xls)$/i.test(file.name))throw Error('文件格式不正确，请上传.xlsx或.xls格式的Excel模板');
      const bytes=await file.arrayBuffer(),sig=new Uint8Array(bytes.slice(0,8));
      if(!(sig[0]===80&&sig[1]===75)&&!(sig[0]===208&&sig[1]===207))throw Error('文件无法读取，请检查文件内容后重新上传');
      const workbook=XLSX.read(bytes,{type:'array'}),sheet=workbook.Sheets[workbook.SheetNames[0]];
      if(!sheet||!sheet['!ref'])throw Error('模板中没有数据，请填写后重新上传');
      const range=XLSX.utils.decode_range(sheet['!ref']);let headerRow=-1,sourceHeaders=[];
      for(let r=range.s.r;r<=Math.min(range.e.r,range.s.r+9);r++){
        const candidate=Array.from({length:range.e.c+1},(_,c)=>clean(sheet[XLSX.utils.encode_cell({r,c})]?.v));
        if(candidate.some(h=>normalize(h)==='物料名称')){headerRow=r;sourceHeaders=candidate;break;}
      }
      if(headerRow<0)throw Error('模板表头不正确，未找到“物料名称”，请使用下载的导入模板');
      const normalized=sourceHeaders.map(normalize),missing=[...required,'市场价','起订量'].filter(h=>!normalized.includes(h));
      if(missing.length)throw Error(`模板缺少列：${missing.join('、')}，请使用完整导入模板`);
      if(normalized.filter(Boolean).length!==new Set(normalized.filter(Boolean)).size)throw Error('模板存在重复列名，请检查表头后重新上传');
      if(normalized.some(h=>['原Excel行号','错误数量','错误提示汇总'].includes(h)))throw Error('当前文件为失败明细，请修改完整原始模板后重新上传');
      const inputs=[];
      for(let r=headerRow+1;r<=range.e.r;r++){
        const cells=sourceHeaders.map((_,c)=>sheet[XLSX.utils.encode_cell({r,c})]);
        if(cells.every(c=>!c?.f&&!clean(c?.v)))continue;
        const data=Object.fromEntries(headers.map(h=>[h,''])); normalized.forEach((h,c)=>{if(h)data[h]=clean(cells[c]?.v);});
        inputs.push({data,cells,rowNo:r+1});
      }
      auditProgress={done:0,total:inputs.length};updateAuditProgress();
      const results=[],chunk=Math.max(1,Math.ceil(inputs.length/10));
      await new Promise(resolve=>setTimeout(resolve,100));
      for(let index=0;index<inputs.length;index++){
        const {data,cells,rowNo}=inputs[index];
        const result=validateRow(data,rowNo);
        cells.forEach((cell,c)=>{if(cell?.f)result.errors.push({field:normalized[c],category:'必填与基础数据',type:'公式单元格',message:`第${rowNo}行，${normalized[c]}包含公式，请粘贴为实际值后重新上传`});});
        result.original=sourceHeaders.map((_,c)=>clean(cells[c]?.v));results.push(result);
        auditProgress.done=index+1;
        if((index+1)%chunk===0||index===inputs.length-1){updateAuditProgress();await new Promise(resolve=>setTimeout(resolve,80));}
      }
      if(!results.length)throw Error('模板中没有数据，请填写后重新上传');
      state.source={headers:sourceHeaders,headerRow:headerRow+1};state.results=results;state.phase=results.some(r=>r.errors.length)?'failed':'passed';
    }catch(e){state.phase='file-error';state.results=[];state.source=null;state.fileError=e.message||'文件读取失败，请检查文件后重新上传';}
    render();if(state.phase==='file-error')$('.preimport-error',dialog)?.setAttribute('tabindex','-1');
  }
  function updateAuditProgress(){
    const progress=$('#preImportProgress',dialog),label=$('#preImportProgressText',dialog);
    if(progress&&auditProgress.total!=null){progress.max=Math.max(1,auditProgress.total);progress.value=auditProgress.done;}
    if(label)label.textContent=auditProgress.total==null?'正在读取模板数据':`已校验 ${auditProgress.done} / ${auditProgress.total} 行`;
  }
  async function saveBook(name,sheets){
    try{
      const workbook=new ExcelJS.Workbook();
      sheets.forEach(({name,rows})=>{
        const sheet=workbook.addWorksheet(name,{views:[{state:'frozen',ySplit:1}]});
        sheet.addRows(rows);
        rows[0].forEach((h,i)=>{sheet.getColumn(i+1).width=/错误提示|报错/.test(h)?95:name==='填写说明'&&i===1?110:i<2?24:22;});
        sheet.eachRow((row,index)=>{
          row.alignment={vertical:'top',wrapText:true};row.font={name:'微软雅黑',size:11};
          row.eachCell(cell=>{if(typeof cell.value==='string')cell.numFmt='@';});
          if(index===1){row.height=30;row.font={name:'微软雅黑',bold:true,size:11,color:{argb:'FF1F2937'}};row.eachCell(cell=>{cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF0F5FA'}};});}
          else row.height=Math.min(409,Math.max(30,...rows[index-1].map(value=>String(value??'').split('\n').length*22+10)));
        });
        if(name==='物料导入'){
          // 文本编码保留前导零，固定选项提供原生Excel下拉。
          const options={'类型':['1','2','3'],'物料等级':['主推','常规','零星'],'是否倍数下单':['0','1'],'安装费':['0','1'],'检测费':['0','1','2']};
          rows[0].forEach((header,index)=>{const key=normalize(header);sheet.getColumn(index+1).numFmt='@';if(options[key])for(let r=2;r<=1001;r++)sheet.getCell(r,index+1).dataValidation={type:'list',allowBlank:true,formulae:['"'+options[key].join(',')+'"'],showErrorMessage:true,errorTitle:'选项不正确',error:'请从下拉列表选择'};});
        }
      });
      const buffer=await workbook.xlsx.writeBuffer(),url=URL.createObjectURL(new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})),link=document.createElement('a');
      link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    }
    catch{PrototypeUI.showToast('文件生成失败，请稍后重试',{type:'error'});}
  }
  function downloadTemplate(kind){
    if(kind instanceof Event)kind=undefined;
    const data=[];
    if(kind==='pass')data.push(sample());
    if(kind==='fail'){const bad=sample();Object.assign(bad,{'物料名称':'安全帽','品牌编码':'BR999','型号':'QA 2026','起订量':'0'});data.push(bad,sample());}
    const note=[['填写说明','内容'],['用途','批量新增前置校验原型；主表一行一条物料，第一行为表头。'],['必填字段',required.join('、')+'；市场价、起订量同样必填。'],['类型','1=定向；2=自营；3=电商服务商。'],['物料等级','主推、常规、零星'],['外链','每组四项一起填写或全部不填；店铺类型：自营、第三方。'],['编码格式','所有编码以文本填写，保留前导零。'],['失败处理','同一行全部错误汇总；修改完整原模板后重新上传，整批通过才可提交。'],['演示边界','系统字典、配置、权限、重复数据是本地样例；不表示线上实时查询结果。']];
    const reference=[['字典类型','编码或值','名称或说明'],...Object.entries(dictionary.owners).map(([k,v])=>['货主',k,v.name]),...Object.entries(dictionary.categories).map(([k,v])=>['类目',k,v.name]),...Object.entries(dictionary.brands).map(([k,v])=>['品牌',k,v.name]),...Object.entries(dictionary.units).map(([k,v])=>['基本单位',k,v]),...dictionary.suppliers.map(v=>['供应商名称',v,v]),...dictionary.projects.map(v=>['意向项目',v,v]),...dictionary.duplicates.map(d=>['重复物料样例',d.name,`型号${d.model}；品牌${d.brand}；${rules.find(r=>r.id===d.rule).type}`])];
    saveBook(kind==='pass'?'批量新增-校验通过样例.xlsx':kind==='fail'?'批量新增-同一行多错误样例.xlsx':'批量新增物料模板.xlsx',[{name:'物料导入',rows:[headers.map(h=>required.includes(h)?'*'+h:h),...data.map(row=>headers.map(h=>row[h]))]},{name:'填写说明',rows:note},{name:'演示字典',rows:reference}]);
  }
  function downloadErrors(){
    if(!state.source||!state.results.some(r=>r.errors.length))return;
    const failed=state.results.filter(r=>r.errors.length),rows=[[...state.source.headers,'原Excel行号','错误数量','错误提示汇总'],...failed.map(r=>[...r.original,r.rowNo,r.errors.length,r.errors.map((e,i)=>`${i+1}. ${e.message}`).join('\n')])];
    saveBook('批量新增-错误文件.xlsx',[{name:'失败数据',rows},{name:'填写说明',rows:[['说明','内容'],['重新上传','请修改完整原始模板后重新上传，本文件包含报错辅助列，不可直接导入。'],['统计',`共校验${state.results.length}行，失败${failed.length}行，错误${counts().errors}项`],['行号','原Excel实际行号（包含表头）；同一数据行全部错误逐条换行汇总。']]}]);
  }
  async function submit(){
    if(state.phase!=='passed'||!state.results.length||state.results.some(r=>r.errors.length))return;
    state.phase='submitting';render();await new Promise(r=>setTimeout(r,600));
    const now=Date.now(),task={id:'PRE'+now,batch:'BATCH'+now,createdAt:new Date().toISOString(),filename:state.file.name,status:'成功',records:state.results.map(r=>r.data)};
    try{const stored=JSON.parse(localStorage.getItem(KEY)||'[]');stored.push(task);localStorage.setItem(KEY,JSON.stringify(stored));state.task=task;state.phase='submitted';restoreRows();PrototypeUI.showToast('任务处理完成，物料已加入批量新增列表',{type:'success'});}
    catch{state.phase='passed';PrototypeUI.showToast('任务提交失败，本地存储不可用，请稍后重试',{type:'error'});}
    render();
  }
  function restoreRows(){
    let tasks=[];try{tasks=JSON.parse(localStorage.getItem(KEY)||'[]');}catch{return;}
    $('#tbody').querySelectorAll('[data-preimport-row]').forEach(row=>row.remove());
    const fragment=document.createDocumentFragment();
    tasks.forEach(task=>task.records.forEach((record,i)=>{
      const row=document.createElement('tr');row.dataset.preimportRow='true';
      const code='T'+task.batch.replace('BATCH','')+String(i+1).padStart(3,'0');
      const values=[record['物料名称'],record['四级类目名称'],record['型号'],code,record['基本单位名称'],record['规格']||'—','管理员',record['商城价']||'—',record['市场价'],record['项目调拨参考价']||'—',record['描述']||'—',record['品牌名称'],record['助记码']||'—',record['旧物料码']||'—',record['物料等级'],task.batch,'待关联','待关联'];
      row.innerHTML=`<td class="checkbox-col"><input type="checkbox" class="checkbox row-check" aria-label="选择${esc(record['物料名称'])}"></td>`+values.map((v,i)=>`<td ${i===3?'class="code-cell"':''}>${esc(v)}</td>`).join('');
      $('.row-check',row).onchange=()=>window.updateSelCount?.();fragment.append(row);
    }));$('#tbody').prepend(fragment);
    const total=$('#batchImportTotal');if(total)total.textContent=`共 ${$('#tbody').rows.length} 条`;
  }
  function downloadExtension(){
    if(!state.task)return;
    saveBook('批量新增-拓展属性模板.xlsx',[{name:'拓展属性',rows:[['导入批号','原文件行号','物料名称','型号','类目编码','拓展属性名称','拓展属性值'],...state.results.map(r=>[state.task.batch,r.rowNo,r.data['物料名称'],r.data['型号'],r.data['四级类目编码'],'',''])]},{name:'填写说明',rows:[['说明','内容'],['后续处理','按实际类目拓展属性补充；通过列表“导入拓展属性”入口继续。原型未连接真实类目属性服务。']]}]);
  }
  window.MpmPreimport={validateRow,sample,headers,dictionary,rules};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
