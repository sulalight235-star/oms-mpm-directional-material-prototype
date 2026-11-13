/* 自定义导出：Excel 条件解析与筛选。 */
(() => {
  'use strict';
  const modal=document.getElementById('modalCustomExport'), schema=window.MpmExportFilterSchema;
  if(!modal||!schema)return;
  const {fields,dicts}=schema;
  const section=document.createElement('section');section.className='custom-export-filters export-upload-filters';
  section.setAttribute('aria-labelledby','exportFiltersHeading');
  section.innerHTML=`<div class="custom-export-filters-head"><h2 id="exportFiltersHeading">筛选条件</h2><button type="button" class="btn-link" data-upload-reset>重置</button></div><div class="export-upload-actions"><a class="btn-link" href="assets/templates/物料导出筛选条件模板.xlsx" download>下载筛选模板</a><button type="button" class="btn btn-default" data-upload-select>选择文件</button><input type="file" accept=".xlsx" id="exportFilterFile" hidden aria-label="上传筛选条件Excel文件"><span data-upload-name>未选择文件</span><button type="button" class="btn-link" data-upload-remove hidden>移除</button></div><p class="export-upload-help">支持 .xlsx。每格填写一个值，多个值在同列向下填写；同列满足任一值，不同列同时满足，空白列不限制。货主等字段选择编码，日期格式为 YYYY-MM-DD。</p><p class="export-upload-default">未上传附件时，按物料列表已查询的筛选结果导出；上传附件后，仅按文件中的条件筛选，不叠加列表条件。移除附件后恢复使用列表查询条件。</p><div data-upload-result role="status" aria-live="polite"></div>`;
  modal.querySelector('#customExportTitle').before(section);
  const $=s=>section.querySelector(s),input=$('#exportFilterFile'),result=$('[data-upload-result]');
  let current={source:'excel',filename:'',rules:[]},valid=true,busy=false,revision=0;
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function reset(){revision++;input.value='';current={source:'excel',filename:'',rules:[]};valid=true;busy=false;$('[data-upload-name]').textContent='未选择文件';$('[data-upload-remove]').hidden=true;result.replaceChildren();}
  $('[data-upload-select]').onclick=()=>input.click();$('[data-upload-reset]').onclick=reset;$('[data-upload-remove]').onclick=reset;
  function showErrors(errors){valid=false;result.innerHTML='<div class="export-upload-errors" role="alert"><strong>文件校验未通过，请修改后重新上传</strong><ul>'+errors.map(e=>'<li>'+esc(e)+'</li>').join('')+'</ul></div>';}
  function dateValue(cell,book){
    if(cell.t==='n') {const d=XLSX.SSF.parse_date_code(cell.v,{date1904:!!book.Workbook?.WBProps?.date1904});if(!d)return '';return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;}
    return String(cell.v??'').trim();
  }
  input.onchange=async()=>{
    const file=input.files[0];if(!file)return;
    const token=++revision;valid=false;busy=true;current={source:'excel',filename:file.name,rules:[]};$('[data-upload-name]').textContent=file.name;$('[data-upload-remove]').hidden=false;result.textContent='正在读取文件…';
    try {
      if(!/\.xlsx$/i.test(file.name)){showErrors(['文件格式不支持，请上传 .xlsx 格式的筛选模板']);return;}
      const book=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false,cellFormula:true});if(token!==revision)return;
      const sheet=book.Sheets['筛选条件'];if(!sheet){showErrors(['缺少“筛选条件”工作表，请下载最新模板填写后上传']);return;}
      const range=sheet['!ref']?XLSX.utils.decode_range(sheet['!ref']):null;
      if(!range||range.e.c!==fields.length-1||fields.some((f,i)=>String(sheet[XLSX.utils.encode_cell({r:0,c:i})]?.v??'').trim()!==f.header)) {showErrors(['表头与模板不一致，请保留模板全部表头及顺序后重新上传']);return;}
      const errors=[],rules=[];
      fields.forEach((f,c)=>{
        const values=new Set();
        for(let r=1;r<=range.e.r;r++) {
          const cell=sheet[XLSX.utils.encode_cell({r,c})];if(!cell||cell.v===undefined||String(cell.v).trim()==='')continue;
          const prefix=`第${r+1}行，${f.header}：`;
          if(cell.f){errors.push(prefix+'不支持公式，请粘贴为文本值');continue;}
          const value=f.type==='date'?dateValue(cell,book):String(cell.v).trim();
          if(f.type==='date') {
            if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number.isNaN(Date.parse(value+'T00:00:00Z'))||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value){errors.push(prefix+'日期格式无效，请填写 YYYY-MM-DD');continue;}
            if(values.size&&!values.has(value)){errors.push(prefix+'本列只允许填写一个日期');continue;}
          }
          if((f.type==='code'||['materialCode','barcodeInput','standardCode','mnemonicCode'].includes(f.id))&&/[,，;；\n\r]/.test(value)){errors.push(prefix+'每个单元格只能填写一个值，请在同列向下逐行填写');continue;}
          if((f.type==='code'||['materialCode','barcodeInput','standardCode'].includes(f.id))&&cell.t==='n'){errors.push(prefix+'请使用文本格式填写编码，避免丢失前导零或精度');continue;}
          if(f.type==='code'&&!f.options.includes(value)){errors.push(prefix+'无效编码“'+value+'”，请选择模板下拉中的编码');continue;}
          if(f.type==='enum'&&!f.options.includes(value)){errors.push(prefix+'无效选项“'+value+'”，请从模板下拉列表中选择');continue;}
          values.add(value);
        }
        if(values.size)rules.push({header:f.header,id:f.id,type:f.type,dict:f.dict,values:[...values]});
      });
      for(const id of ['createdRange','reviewedRange','modifiedRange']){const start=rules.find(r=>r.id===id)?.values[0],end=rules.find(r=>r.id===id+'End')?.values[0];if(start&&end&&start>end)errors.push(fields.find(f=>f.id===id).label+'：开始日期不能晚于结束日期');}
      if(errors.length){showErrors(errors);return;}
      if(!rules.length){showErrors(['文件中没有筛选条件，请从第2行开始填写后重新上传']);return;}
      current={source:'excel',filename:file.name,rules};valid=true;
      result.innerHTML=`<p class="export-upload-success">文件校验通过，已识别 ${rules.length} 个筛选字段、${rules.reduce((n,r)=>n+r.values.length,0)} 个条件值。</p><details class="export-upload-summary"><summary>查看已识别条件</summary><dl>${rules.map(r=>'<dt>'+esc(r.header)+'</dt><dd>'+esc(displayValues(r).join('、'))+'</dd>').join('')}</dl></details>`;
    }catch{if(token===revision)showErrors(['文件无法读取，请使用下载的 Excel 模板填写并保存后重新上传']);}
    finally{if(token===revision){busy=false;input.value='';}}
  };
  function displayValues(rule){return rule.values.map(v=>{const item=rule.dict&&dicts[rule.dict].find(x=>x.code===v);return item?`${v}（${item.name}）`:v;});}
  const titles=[...document.querySelectorAll('.list-layout .table-wrap table thead th')].map(t=>t.textContent.trim());
  const rows=[...document.querySelectorAll('.list-layout .table-wrap table tbody tr')].map(row=>Object.fromEntries(titles.map((t,i)=>[t,t==='编码'?row.cells[i]?.textContent.match(/B\d+/)?.[0]:t==='供应商'?row.cells[i]?.querySelector('.supplier-cell > span')?.textContent.trim():row.cells[i]?.textContent.trim()])));
  const mappings={materialCode:'编码',brandSelect:'品牌',materialName:'名称',modelInput:'型号',descInput:'描述',unitSelect:'基本单位',shelfStatus:'上/下架',specInput:'规格',supplierFilter:'供应商',ownerSelect:'货主',category:'类目',orderExecutor:'订单执行员',productManager:'产品经理',projectQuoter:'项目报价员',saleStatus:'可售'};
  function matches(material,rule){
    const record=window.MpmFilterPicker.records.find(r=>r.code===material.code)||{};
    const tableRow=rows.find(r=>r['编码']===material.code)||{};
    let actual=tableRow[mappings[rule.id]]??material[rule.id]??'';
    if(rule.id==='projectFilter')actual=record.projects||[];
    if(rule.id==='pushStatus')actual=record.pushStatus==='推送成功'?'已推送':record.pushStatus==='推送中'?'未推送':record.pushStatus;
    if(rule.id==='ownerSelect')actual=tableRow['货主']||material.org||'';
    if(rule.id==='saleStatus')actual=String(actual)==='可售'?'是':String(actual)==='不可售'?'否':actual;
    if(rule.type==='date') {const base=rule.id.replace(/End$/,'');actual=material[base]||'';if(!actual)return false;return rule.id.endsWith('End')?String(actual).slice(0,10)<=rule.values[0]:String(actual).slice(0,10)>=rule.values[0];}
    return rule.values.some(value=>{
      const item=rule.dict&&dicts[rule.dict].find(x=>x.code===value);const wanted=item?.name||value;
      if(rule.dict==='category') {
        let names=[];const walk=nodes=>nodes.forEach(node=>{if(node.code===value){const collect=n=>{names.push(n.name);n.children?.forEach(collect)};collect(node);}node.children&&walk(node.children)});walk(window.MpmFilterPicker.categoryTree());return names.length?names.includes(actual):String(actual)===value;
      }
      if(Array.isArray(actual))return actual.includes(wanted);
      if(['materialName','modelInput','descInput','specInput','aliasInput','internalRemark'].includes(rule.id))return String(actual).toLowerCase().includes(wanted.toLowerCase());
      return String(actual)===wanted;
    });
  }
  let listQuery={source:'list',filename:'',rules:[]};
  function categoryRule(){
    const selected=document.querySelector('.tree-node.active')?.dataset.category||'全部';
    if(['全部','商城类'].includes(selected))return null;
    const code=selected.match(/^\[([^\]]+)\]/)?.[1];
    return {header:'类目',id:'category',type:'code',dict:'category',values:[code||selected]};
  }
  function captureListQuery(){
    const rules=[];
    fields.forEach(field=>{
      const control=document.getElementById(field.id);
      if(!control||!control.closest('#filterForm')||!control.value.trim())return;
      const values=field.type==='date'?[control.value]:control.value.trim().split(/[,，;；\n\r、]+/).map(v=>v.trim()).filter(Boolean);
      if(values.length)rules.push({header:field.header,id:field.id,type:field.type,dict:field.dict,values:[...new Set(values)]});
    });
    const category=categoryRule();if(category)rules.push(category);
    listQuery={source:'list',filename:'',rules};
  }
  document.getElementById('searchBtn')?.addEventListener('click',captureListQuery);
  document.getElementById('resetBtn')?.addEventListener('click',()=>{listQuery={source:'list',filename:'',rules:[]};});
  document.querySelectorAll('.tree-node').forEach(node=>node.addEventListener('click',event=>{
    if(event.target.closest('[data-toggle]'))return;
    listQuery.rules=listQuery.rules.filter(rule=>rule.id!=='category');const rule=categoryRule();if(rule)listQuery.rules.push(rule);
  }));
  window.MpmCustomExportFilters={
    validate(){if(busy||!valid){window.PrototypeUI?.showToast?.(busy?'文件正在读取，请稍后提交':'筛选文件校验未通过，请修改或移除文件后重试');result.scrollIntoView({block:'nearest'});return false;}return true;},
    snapshot:()=>JSON.parse(JSON.stringify(current.filename?current:listQuery)),
    filter:(materials,state)=>materials.filter(m=>state.rules.every(rule=>matches(m,rule))),
    summary:state=>(state.source==='list'?'物料列表查询条件：':'上传文件条件：')+(state.rules.length?state.rules.map(rule=>rule.header+'：'+displayValues(rule).join('、')).join('；'):'全部物料')
  };
})();
