(function(){"use strict";
const products=[
["B0301052673","","扁铲","手动凿类","90784","","世达/SATA"],["B1201040618","SRMHZS1401...","五层货架","隔板式货架","1800*600*2000","","迦遇/JIAYU"],["","SRMHZS4104...","不锈钢橱柜","收纳柜","网纹","","赴/FU"],["","SRMHZS4104...","不锈钢橱柜","收纳柜","吊柜","","赴/FU"],["","SRMHZS4104...","不锈钢橱柜","其它柜子","挂墙","","赴/FU"],["","SRMHZS4104...","不锈钢橱柜","其它柜子","厨房","","赴/FU"],["B2605000942","SRMHZS320...","无硅消泡剂","其它水处理耗材","HSY-866","","仁聚益/RJY"],["","SRMHZS4104...","橱柜","收纳柜","落地","","赴/FU"],["B2603009490","","油漆","其它油漆","蓝","","千居美/KYUMI"],["B0905009232","SRMHZS1401...","防水防油皮革手套","普通袖套","PU","","贯满/GUANLI"],["B2002030962","","不锈钢金属软管","金属软管","1/4--L=1000","","康工达/KANG"],["","SRMHZS1104...","鞋套机鞋套","一次性鞋套","CPE材质","","思科锐/SIKER"],["","SRMHZS4104...","橱柜","收纳柜","钢制","","赴/FU"],["","SRMHZS370...","黄绿地线","其它线缆","BVR16平方","","亚昊/YAHAO"],["","SRMHZS370...","黄绿地线","其它线缆","BVR25平方","","亚昊/YAHAO"],["","SRMHZS4104...","储物架","物料架","材料","","还/HUAN"],["","SRMHZS370...","黄绿地线","其它线缆","BVR50平方","","亚昊/YAHAO"],["B2603009491","","油漆","其它油漆","黑色","","千居美/KYUMI"],["","SRMHZS4410...","点歌机","音箱/音响","LS22","","酷开/COOCAA"],["B1509095979","SRMHZS430...","办公桌","办公桌","MZ2T16","","福满森/FUMA"],["B1509095980","SRMHZS4103...","办公桌","办公桌","120*60*75cm","","豫龙都/YULO"],["B1509095981","SRMHZS4103...","桌子","其它桌子","木质","","豫龙都/YULO"],["B1201040616","SRMHZS4103...","工具挂钩竖向架","物料架","ZQ-52","","梓趣/ZIQU"],["B1201040617","SRMHZS1401...","五层货架","隔板式货架","1800*500*2000","","迦遇/JIAYU"],["","SRMHZS6501...","除垢剂","除垢剂","25/KG","","华威/HUAWAY"],["B0502005729","SRMHZS450...","保险丝","熔丝/熔片","RW10/25A","","SMALLHERT"],["","SRMHZS1104...","鞋套机鞋套","一次性鞋套","PE材质","","思科锐/SIKER"],["","SRMHZS6501...","二氧化氯","消毒粉","300G","","秀霸/XIUBA"],["B0201003910","","接地电阻测试仪","接地电阻测试仪","D05995","","世达/SATA"]];
const applicants=["吉林省星顺通商贸有限公司（供应商）","山西坤鹏世纪商贸有限公司（供应商）","河南麦欧克家具有限公司（供应商）","南京天从电气有限公司（供应商）","南阳申天东物资有限公司（供应商）","建华工业科技（济南）有限公司（供应商）","广东裕峰精工机械有限公司（供应商）","湖南卓越家具有限公司（供应商）","洛阳悦动商贸有限公司（供应商）","新疆建豪机电设备化工有限公司（供应商）"];
const rows=products.map((p,i)=>["咸亨国际科技股份有限公司",p[0],p[1],p[2],p[3],p[4],p[5]||"-",p[6],"零星",i%7===0?"SRM修改-审":"SRM新增-审",applicants[i%applicants.length],"AI智能审核",i%4===0?"通过":"驳回",i%4===0?"（智能审核）审核通过":"（智能审核）【字段校验未通过】",`2026-11-${i%5===0?'09':'04'} ${String(11+i%6).padStart(2,'0')}:2${i%10}`,"2026-11-9 11:30",i%6===0?"电商管理部":"",""]);
const headers=["货主","编码","临时编码","名称","四级类目","型号","规格","品牌","物料等级","审核类型","申请人","审核人","审核状态","审核说明","申请时间","审核时间","采购部门","助记码"];
const widths=[112,105,112,105,105,105,105,105,105,108,250,105,105,105,105,105,105,105];let filtered=rows.slice();
const ico=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${{search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/>',down:'<path d="m6 9 6 6 6-6"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="1"/><path d="M16 3v4M8 3v4M3 10h18"/>',edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',chev:'<path d="m7 7 5 5 5-5"/><path d="m7 13 5 5 5-5"/>',up:'<path d="m18 15-6-6-6 6"/><path d="M12 20V9"/>'}[n]}</svg>`;
const select=(cls,label,opts)=>`<div class="audit-select ${cls}"><select aria-label="${label}"><option value="">请选择</option>${opts.map(x=>`<option>${x}</option>`).join('')}</select>${ico('down')}</div>`;
const date=(cls,label)=>`<div class="audit-date ${cls}"><input placeholder="请选择" aria-label="${label}开始"><span>→</span><input placeholder="请选择" aria-label="${label}结束"><button aria-label="选择日期">${ico('calendar')}</button></div>`;
function render(root){root.querySelector('tbody').innerHTML=filtered.map(r=>`<tr>${r.map(v=>`<td title="${v}">${v}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${headers.length}" style="text-align:center;padding:24px">暂无符合条件的审核日志</td></tr>`}
function toast(root,msg){const t=root.querySelector('[data-toast]');t.textContent=msg;t.classList.add('is-visible');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('is-visible'),1600)}
function install(){
 const root=document.getElementById('auditLogPage');
 headers.push('数据类型');widths.push(145);rows.forEach(row=>row.push('SRM物料'));
 const iqs=[...rows[0]];Object.assign(iqs,{1:'',2:'IQS202611110001',3:'绝缘操作杆',5:'JYG-10KV',7:'世达/SATA',9:'IQS新增审核',10:'王云龙',11:'王云龙',12:'通过',13:'审核通过',18:'IQS新增审核'});
 const oms=[...rows[1]];Object.assign(oms,{1:'B1201040620',2:'OMS202611110001',3:'定向采购工具箱',5:'GJX-2026',7:'牧田/MAKITA',9:'OMS定向物料审核',10:'张银群',11:'张银群',12:'待审核',13:'待审核',18:'OMS定向物料'});
 rows.unshift(iqs,oms);filtered=rows.slice();
 const input=(label,placeholder='请输入',list='')=>`<input id="audit-filter-${label}" class="audit-control" placeholder="${placeholder}" aria-label="${label}" ${list?`list="${list}"`:''}>`;
 const dropdown=(label,options)=>select('',label,options).replace('<select ',`<select id="audit-filter-${label}" `);
 const field=(label,control)=>`<div class="audit-filter-field"><label class="audit-label" for="audit-filter-${label}">${label}</label>${control}</div>`;
 const dates=label=>`<div class="audit-date"><input id="audit-filter-${label}" type="date" aria-label="${label}开始"><span>→</span><input type="date" aria-label="${label}结束"></div>`;
 root.innerHTML=`<section class="audit-filters"><div class="audit-filters-head"><div class="audit-filter-title">${ico('search')}<span>筛选:</span></div><div class="audit-filter-actions"><button class="audit-btn audit-btn--primary" type="button" data-search>查询</button><button class="audit-btn" type="button" data-reset>重置</button><button class="audit-icon-btn" type="button" data-collapse aria-label="收起筛选" aria-expanded="true" aria-controls="auditFilterGrid">${ico('chev')}</button></div></div><form class="audit-filter-grid" id="auditFilterGrid">
 ${field('审核人',input('审核人','输入或选择审核人','auditReviewerOptions'))}
 ${field('审核类型',dropdown('审核类型',['SRM新增-审','SRM修改-审','IQS新增审核','OMS定向物料审核']))}
 ${field('申请时间',dates('申请时间'))}${field('审核时间',dates('审核时间'))}
 ${field('审核状态',dropdown('审核状态',['通过','驳回','待审核']))}
 ${field('申请人',input('申请人'))}${field('物料编码',input('物料编码','多个编码用英文逗号分隔'))}${field('临时编码',input('临时编码','请输入临时编码'))}
 ${field('采购部门',dropdown('采购部门',['电商管理部','供应链中心']))}${field('品牌',input('品牌','输入或选择品牌','auditBrandOptions'))}${field('物料名称',input('物料名称'))}${field('型号',input('型号'))}
 ${field('数据类型',dropdown('数据类型',['SRM物料','IQS新增审核','OMS定向物料']))}${field('助记码',input('助记码','多个助记码用英文逗号分隔'))}
 </form><datalist id="auditReviewerOptions">${['AI智能审核','王云龙','张银群'].map(name=>`<option value="${name}">`).join('')}</datalist><datalist id="auditBrandOptions">${[...new Set(rows.map(row=>row[7]))].map(name=>`<option value="${name}">`).join('')}</datalist></section>
 <div class="audit-toolbar"><div class="audit-toolbar-side"><span class="audit-toolbar-label">操作:</span><button class="audit-link" data-action="刷新">刷新</button></div><div class="audit-toolbar-side"><button class="audit-link" data-action="导出">导出</button><button class="audit-return" data-action="返回工作台" title="返回工作台" aria-label="返回工作台">${ico('up')}</button></div></div><div class="audit-table-shell"><table class="audit-table"><colgroup>${widths.map(w=>`<col style="width:${w}px">`).join('')}</colgroup><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody></tbody></table></div><div class="audit-toast" role="status" data-toast></div>`;
 const value=label=>root.querySelector(`[aria-label="${label}"]`).value.trim().toLowerCase();
 const contains=(row,index,label)=>!value(label)||row[index].toLowerCase().includes(value(label));
 const multiple=(row,index,label)=>!value(label)||value(label).split(/[,，;；\s]+/).filter(Boolean).some(code=>row[index].toLowerCase().includes(code));
 const exact=(row,index,label)=>!value(label)||row[index].toLowerCase()===value(label);
 function dateMatches(row,index,label){const start=value(label+'开始'),end=value(label+'结束');const date=row[index].split(' ')[0].split('-').map((part,i)=>i?part.padStart(2,'0'):part).join('-');return (!start||date>=start)&&(!end||date<=end);}
 function search(){
   for(const label of ['申请时间','审核时间']){if(value(label+'开始')&&value(label+'结束')&&value(label+'开始')>value(label+'结束')){toast(root,label+'开始日期不能晚于结束日期');return;}}
   filtered=rows.filter(row=>contains(row,11,'审核人')&&exact(row,12,'审核状态')&&exact(row,9,'审核类型')&&exact(row,18,'数据类型')&&exact(row,16,'采购部门')&&contains(row,10,'申请人')&&multiple(row,1,'物料编码')&&contains(row,2,'临时编码')&&contains(row,7,'品牌')&&contains(row,3,'物料名称')&&contains(row,5,'型号')&&multiple(row,17,'助记码')&&dateMatches(row,14,'申请时间')&&dateMatches(row,15,'审核时间'));
   render(root);toast(root,`查询完成，共 ${filtered.length} 条`);
 }
 root.querySelector('[data-search]').onclick=search;root.querySelector('form').onsubmit=event=>{event.preventDefault();search();};
 root.querySelector('[data-reset]').onclick=()=>{root.querySelector('form').reset();root.querySelectorAll('select').forEach(x=>x.classList.remove('has-value'));filtered=rows.slice();render(root);toast(root,'筛选条件已重置')};
 root.querySelector('[data-collapse]').onclick=event=>{const collapsed=root.classList.toggle('filters-collapsed');event.currentTarget.setAttribute('aria-expanded',String(!collapsed));event.currentTarget.setAttribute('aria-label',collapsed?'展开筛选':'收起筛选');};
 root.querySelectorAll('select').forEach(s=>s.onchange=()=>s.classList.toggle('has-value',!!s.value));
 root.querySelector('[data-action="刷新"]').onclick=()=>{search();toast(root,'数据已刷新')};
 root.querySelector('[data-action="导出"]').onclick=()=>toast(root,'审核日志导出任务已创建（原型演示）');
 root.querySelector('[data-action="返回工作台"]').onclick=()=>location.href='MPM-工作台-首页.html';render(root);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install):install();
})();
