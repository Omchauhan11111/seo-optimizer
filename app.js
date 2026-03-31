/* ══════════════════════════════════════════
   STATE
══════════════════════════════════════════ */
const S={prov:'openrouter',key:'',model:'',docxFile:null,docxText:'',category:'',topic:'',topicLabel:'',result:null,kws:[],currentStep:1,pageUrl:''};

/* ══════════════════════════════════════════
   INIT — Build provider UI
══════════════════════════════════════════ */
(function(){
  const tabs=document.getElementById('prov-tabs');
  const panels=document.getElementById('prov-panels');
  Object.values(PROV).forEach((p,i)=>{
    const t=document.createElement('button');
    t.className='prov-tab'+(i===0?' active':'');
    t.textContent=p.label;t.onclick=()=>switchProv(p.id);
    tabs.appendChild(t);
    const d=document.createElement('div');
    d.id='pp-'+p.id;d.style.display=i===0?'block':'none';
    d.innerHTML=`<div class="alert alert-${p.at}" style="margin-bottom:12px;"><span>${p.at==='green'?'🆓':p.at==='yellow'?'⚠️':'💡'}</span><div>${p.at_txt}</div></div>
<div class="field"><label class="label">${p.label} API Key</label><input type="password" id="k-${p.id}" placeholder="${p.ph}" autocomplete="off"><div class="hint">${p.hint}</div></div>
<div class="field"><label class="label">Model</label><select id="m-${p.id}">${p.models.map(g=>`<optgroup label="── ${g.g} ──">${g.opts.map((o,oi)=>`<option value="${o.v}"${oi===0?' selected':''}>${o.l}</option>`).join('')}</optgroup>`).join('')}</select><div class="hint">${p.fn}</div></div>`;
    panels.appendChild(d);
  });
})();

function switchProv(id){
  S.prov=id;
  document.querySelectorAll('.prov-tab').forEach((t,i)=>t.classList.toggle('active',Object.keys(PROV)[i]===id));
  Object.keys(PROV).forEach(k=>{const e=document.getElementById('pp-'+k);if(e)e.style.display=k===id?'block':'none';});
  document.getElementById('api-err').style.display='none';
}

/* ══════════════════════════════════════════
   STEPPER — with Back navigation
══════════════════════════════════════════ */
function setStep(n){
  S.currentStep=n;
  for(let i=1;i<=6;i++){
    const el=document.getElementById('stp-'+i);
    el.classList.remove('active','done');
    if(i<n)el.classList.add('done');
    if(i===n)el.classList.add('active');
  }
}

// Click on done step to go back
document.addEventListener('DOMContentLoaded',()=>{
  for(let i=1;i<=6;i++){
    const el=document.getElementById('stp-'+i);
    el.addEventListener('click',()=>{
      if(el.classList.contains('done')){
        goBackToStep(i);
      }
    });
  }
});

function goBackToStep(target){
  // Hide all steps and output
  for(let i=1;i<=5;i++) document.getElementById('step'+i).style.display='none';
  document.getElementById('output-section').classList.remove('show');

  if(target===1){document.getElementById('step1').style.display='block';setStep(1);}
  else if(target===2){document.getElementById('step2').style.display='block';setStep(2);}
  else if(target===3){document.getElementById('step3').style.display='block';setStep(3);}
  else if(target===4){document.getElementById('step4').style.display='block';setStep(4);}
  else if(target===5){document.getElementById('step5').style.display='block';setStep(5);}
  window.scrollTo({top:0,behavior:'smooth'});
}

function goBack(){
  if(S.currentStep>1) goBackToStep(S.currentStep-1);
}

/* ══ STEP 1 ══ */
function validateAPI(){
  const p=PROV[S.prov];
  const k=(document.getElementById('k-'+S.prov)?.value||'').trim();
  const eb=document.getElementById('api-err');
  const et=document.getElementById('api-err-txt');
  eb.style.display='none';
  if(!k){eb.style.display='flex';et.innerHTML='Please enter your '+p.label+' API key.';return;}
  if(!k.startsWith(p.kp)){eb.style.display='flex';et.innerHTML='<strong>Wrong format!</strong> '+p.label+' keys start with <code>'+p.kp+'…</code>';return;}
  S.key=k;S.model=document.getElementById('m-'+S.prov)?.value||'';
  document.getElementById('step1').style.display='none';
  document.getElementById('step2').style.display='block';
  setStep(2);
}

/* ══ STEP 2 ══ */
function handleFile(inp){
  const f=inp.files[0];if(!f)return;
  S.docxFile=f;
  document.getElementById('fname-text').textContent=f.name;
  document.getElementById('upload-done').classList.add('show');
  document.getElementById('btn-step2').disabled=false;
}
(function(){
  const uz=document.getElementById('upload-zone');
  uz.addEventListener('dragover',e=>{e.preventDefault();uz.classList.add('drag');});
  uz.addEventListener('dragleave',()=>uz.classList.remove('drag'));
  uz.addEventListener('drop',e=>{
    e.preventDefault();uz.classList.remove('drag');
    const f=e.dataTransfer.files[0];
    if(f){S.docxFile=f;document.getElementById('fname-text').textContent=f.name;document.getElementById('upload-done').classList.add('show');document.getElementById('btn-step2').disabled=false;}
  });
})();

async function goStep3(){
  const reader=new FileReader();
  reader.onload=async(e)=>{
    try{
      const r=await mammoth.convertToHtml({arrayBuffer:e.target.result});
      // Keep more structure — extract text but preserve paragraph breaks
      const div=document.createElement('div');
      div.innerHTML=r.value;
      // Get text with newlines for better analysis
      S.docxText=div.innerText||div.textContent||'';
      S.docxText=S.docxText.replace(/\n{3,}/g,'\n\n').trim();

      // Show doc info
      const wc=S.docxText.split(/\s+/).filter(Boolean).length;
      const rt=Math.ceil(wc/200);
      document.getElementById('doc-info').innerHTML=`<span class="doc-info-badge">📄 ${wc.toLocaleString()} words</span><span class="doc-info-badge">⏱ ~${rt} min read</span><span class="doc-info-badge">✅ Document parsed</span>`;
      document.getElementById('doc-info').style.display='flex';
    }
    catch{S.docxText='Could not parse DOCX.';}
    document.getElementById('step2').style.display='none';
    document.getElementById('step3').style.display='block';
    setStep(3);
  };
  reader.readAsArrayBuffer(S.docxFile);
}

/* ══ STEP 3 ══ */
function selectCat(cat){
  S.category=cat;
  document.querySelectorAll('.cat-card').forEach(c=>c.classList.remove('selected'));
  document.getElementById('cat-'+cat).classList.add('selected');
  const sel=document.getElementById('topic-select');
  sel.innerHTML='<option value="">— Select a topic —</option>';
  (TOPICS[cat]||[]).forEach(t=>{const o=document.createElement('option');o.value=t;o.textContent=t;sel.appendChild(o);});
  const cu=document.createElement('option');cu.value='__custom__';cu.textContent='✏️ Other (type your own)';sel.appendChild(cu);
  document.getElementById('step3').style.display='none';
  document.getElementById('step4').style.display='block';
  setStep(4);
}

/* ══ STEP 4 ══ */
function onTopicChange(){
  const v=document.getElementById('topic-select').value;
  const cw=document.getElementById('custom-wrap');
  const pv=document.getElementById('topic-preview');
  const btn=document.getElementById('btn-step4');
  if(v==='__custom__'){cw.style.display='block';pv.style.display='none';btn.disabled=false;S.topic='';}
  else if(v){
    cw.style.display='none';pv.style.display='block';S.topic=v;S.topicLabel=v;
    const isSv=S.category==='services';
    pv.innerHTML=`<div class="alert alert-green"><span>✅</span><div><strong>Topic selected:</strong> ${v}<br><span style="font-size:12px;opacity:.8;">Mode: ${isSv?'Service page — concise, interlinking focus, no TOC':'Blog/Guide — full content with Table of Contents'}</span></div></div>`;
    btn.disabled=false;
  }else{cw.style.display='none';pv.style.display='none';btn.disabled=true;}
}

function goStep5(){
  const cv=document.getElementById('custom-topic').value.trim();
  if(document.getElementById('topic-select').value==='__custom__'){
    if(!cv){alert('Please enter a custom topic.');return;}
    S.topic=cv;S.topicLabel=cv;
  }
  // Build options grid based on category
  const isSv=S.category==='services';
  const opts=isSv?OPTS.services:OPTS.blog_inc_res;
  const grid=document.getElementById('opt-grid');
  grid.innerHTML='';
  opts.forEach(o=>{
    const label=document.createElement('label');
    label.className='opt-item';
    label.innerHTML=`<input type="checkbox" id="opt-${o.id}" checked><div class="opt-item-text">${o.label}<span class="opt-item-hint">${o.hint}</span></div>`;
    grid.appendChild(label);
  });

  // Update category info in step 5
  document.getElementById('step5-cat-info').innerHTML=`<span class="doc-info-badge">📂 ${S.category.charAt(0).toUpperCase()+S.category.slice(1)}</span><span class="doc-info-badge">🎯 ${S.topicLabel.slice(0,40)}${S.topicLabel.length>40?'…':''}</span>`;

  document.getElementById('step4').style.display='none';
  document.getElementById('step5').style.display='block';
  setStep(5);
}

function getOpts(){
  return Array.from(document.getElementById('opt-grid').querySelectorAll('input:checked')).map(i=>i.id.replace('opt-',''));
}

/* ══════════════════════════════════════════
   API CALL
══════════════════════════════════════════ */
async function callAI(prompt){
  const p=PROV[S.prov];
  const resp=await fetch(p.url(S),{method:'POST',headers:p.hd(S),body:p.bd(prompt,S)});
  if(!resp.ok){
    const err=await resp.json().catch(()=>({}));
    throw new Error(p.err(resp.status,err?.error?.message||resp.statusText,S));
  }
  return p.parse(await resp.json());
}

function parseJSON(raw){
  if(!raw)return null;
  const clean=raw.replace(/```json|```/g,'').trim();
  try{return JSON.parse(clean);}catch{
    const m=clean.match(/\{[\s\S]*\}/);
    if(m)try{return JSON.parse(m[0]);}catch{}
    return null;
  }
}

/* ══════════════════════════════════════════
   RUN
══════════════════════════════════════════ */
async function runOpt(){
  const btn=document.getElementById('btn-run');
  const checkedOpts=getOpts();
  if(checkedOpts.length===0){
    if(!confirm('No optimization options are checked. Continue with minimal optimization?'))return;
  }

  btn.disabled=true;btn.innerHTML='<span class="spinner"></span> Running Full SEO Audit…';
  document.getElementById('progress-wrap').classList.add('show');

  // Run optimization
  try{
    phase('ps-kw',12,'Researching keywords for: '+S.topicLabel.slice(0,40)+'…');
    const kwPrompt = (window.promptOverrides?.kw) || pKw();
    const kwR=await callAI(kwPrompt);
    S.kws=parseJSON(kwR)?.keywords||[];

    phase('ps-serp',28,'Analyzing top SERP competitors…');
    const serpPrompt = (window.promptOverrides?.serp) || pSERP();
    const serpR=await callAI(serpPrompt);
    const serpD=parseJSON(serpR)||{};

    phase('ps-audit',48,'Running SEO audit on your document…');
    const auditPrompt = (window.promptOverrides?.audit) || pAudit();
    const auditR=await callAI(auditPrompt);
    const auditD=parseJSON(auditR)||{};

    phase('ps-opt',68,'Rewriting with full SEO optimization…');
    const optPrompt=pOpt(kwR,serpR,auditR);
    const optR=await callAI(optPrompt);
    const optD=parseJSON(optR)||{};

    phase('ps-build',92,'Building final report…');
    S.result={serp:serpD,audit:auditD,opt:optD};
    setP(100,'Complete! ✅');
    ['ps-kw','ps-serp','ps-audit','ps-opt','ps-build'].forEach(id=>{
      const el=document.getElementById(id);el.classList.remove('active');el.classList.add('done');
    });
    renderReport();
    setStep(6);
  }catch(err){
    btn.disabled=false;btn.innerHTML='🚀 Start Full SEO Optimization';
    document.getElementById('progress-wrap').classList.remove('show');
    alert('Error:\n\n'+err.message+'\n\nCheck your API key and try again.');
  }
}

function phase(id,pct,txt){
  ['ps-kw','ps-serp','ps-audit','ps-opt','ps-build'].forEach(p=>{
    const el=document.getElementById(p);
    if(el.classList.contains('active'))el.classList.replace('active','done');
  });
  document.getElementById(id).classList.add('active');
  setP(pct,txt);
}
function setP(pct,txt){
  document.getElementById('prog-fill').style.width=pct+'%';
  document.getElementById('prog-pct').textContent=pct+'%';
  document.getElementById('prog-text').textContent=txt;
}

/* ══════════════════════════════════════════
   RENDER REPORT
══════════════════════════════════════════ */
function renderReport(){
  const{serp,audit,opt}=S.result;
  document.getElementById('output-section').classList.add('show');
  document.getElementById('step5').style.display='none';

  // Badges
  const nA=(opt.changes_added||[]).length,nR=(opt.changes_removed||[]).length;
  document.getElementById('badge-added').textContent='+'+nA+' Added';
  document.getElementById('badge-removed').textContent='-'+nR+' Removed';
  document.getElementById('badge-score').textContent='Score: '+(audit.score_before||'—')+'→'+(audit.score_after||'—');

  // Scores
  document.getElementById('sc-before').textContent=audit.score_before||'—';
  document.getElementById('sc-after').textContent=audit.score_after||'—';
  const sb=audit.score_breakdown||{};
  document.getElementById('sc-bars').innerHTML=Object.entries(sb).map(([k,v])=>`
    <div class="score-bar-row">
      <span class="score-bar-label">${k}</span>
      <div class="score-bar-track"><div class="score-bar-fill" style="width:${v}%;background:${v<40?'#f87171':v<65?'#fbbf24':'#6ee7b7'}"></div></div>
      <span class="score-bar-val">${v}</span>
    </div>`).join('');

  const wca=audit.word_count_after||0;
  const wcb=audit.word_count_before||0;
  const diff=(wca-wcb);
  document.getElementById('sc-highlights').innerHTML=`
    <div>🟢 +${(audit.score_after||0)-(audit.score_before||0)} pts improvement</div>
    <div>🟢 ${diff>0?'+'+diff.toLocaleString()+' words added':diff.toLocaleString()+' words'}</div>
    <div>🟢 ${(audit.issues_fail||[]).length} critical issues addressed</div>
    <div>🟢 ${S.kws.length} keywords targeted</div>`;
  document.getElementById('sc-metrics').innerHTML=`
    <div class="score-metric"><div class="sm-num">${audit.word_count_before||'—'}</div><div class="sm-lbl">Words Before</div></div>
    <div class="score-metric"><div class="sm-num" style="color:#6ee7b7;">${audit.word_count_after||'—'}</div><div class="sm-lbl">Words After</div></div>
    <div class="score-metric"><div class="sm-num" style="color:#fbbf24;">${S.kws.length}</div><div class="sm-lbl">Keywords</div></div>`;

  // Keywords
  document.getElementById('kw-body').innerHTML=(S.kws||[]).map(k=>`
    <tr>
      <td><strong>${k.keyword}</strong></td>
      <td><span class="kw-badge kw-${k.type||'lsi'}">${k.type||'lsi'}</span></td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#1a4fad;">${k.volume||'—'}</td>
      <td><span class="${k.difficulty==='High'?'diff-h':k.difficulty==='Medium'?'diff-m':'diff-l'}">${k.difficulty||'—'}</span></td>
      <td style="font-size:12px;color:#666;">${k.intent||'—'}</td>
    </tr>`).join('');

  // SERP
  document.getElementById('serp-cards').innerHTML=(serp.serp_competitors||[]).map(c=>`
    <div class="serp-card">
      <div class="serp-title"><span class="serp-rank">${c.rank}</span>${c.title}</div>
      <div class="serp-url">${c.url}</div>
      <div style="font-size:12px;color:#888;margin-bottom:5px;">~${(c.word_count||2500).toLocaleString()} words · ${c.domain_authority||'Medium'} DA</div>
      <div class="serp-tags">
        <span class="serp-tag ${c.has_faq?'on':''}">FAQ ${c.has_faq?'✓':'✗'}</span>
        <span class="serp-tag ${c.has_table?'on':''}">Tables ${c.has_table?'✓':'✗'}</span>
        ${(c.sections||[]).slice(0,4).map(s=>`<span class="serp-tag on">${s}</span>`).join('')}
      </div>
    </div>`).join('');

  // Audit
  const ai=(item,type)=>`<div class="audit-item"><div class="audit-ico ${type}">${type==='fail'?'❌':type==='warn'?'⚠️':'✅'}</div><div><span class="audit-lbl">${item.label}</span><span class="audit-det">${item.detail}</span></div></div>`;
  document.getElementById('audit-fail').innerHTML=(audit.issues_fail||[]).map(i=>ai(i,'fail')).join('')||'<p style="color:#888;font-size:13px;">None found</p>';
  document.getElementById('audit-warn').innerHTML=(audit.issues_warn||[]).map(i=>ai(i,'warn')).join('')||'<p style="color:#888;font-size:13px;">None found</p>';
  document.getElementById('audit-pass').innerHTML=(audit.issues_pass||[]).map(i=>ai(i,'pass')).join('')||'<p style="color:#888;font-size:13px;">None found</p>';

  // Gaps
  document.getElementById('gap-topics').innerHTML=(serp.top_topics||[]).map(t=>`<div class="gap-item"><span style="color:#1a4fad;font-size:16px;">•</span>${t}</div>`).join('');
  document.getElementById('gap-missing').innerHTML=(serp.content_gaps||[]).map(g=>`<div class="gap-item"><span style="color:#c87000;">⚡</span>${g}</div>`).join('');

  // Instructions response
  const extra=document.getElementById('extra-inst').value.trim();
  if(extra&&opt.instructions_response){
    document.getElementById('rpt-inst').style.display='block';
    document.getElementById('inst-nav-li').style.display='list-item';
    document.getElementById('inst-content').innerHTML=`<h4>💡 Your Instructions: "${extra}"</h4><p>${(opt.instructions_response||'').replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>')}</p>`;
  }

  // Changes summary (what was added/removed)
  const added=opt.changes_added||[];
  const removed=opt.changes_removed||[];
  if(added.length||removed.length){
    document.getElementById('rpt-changes').style.display='block';
    document.getElementById('changes-nav-li').style.display='list-item';
    document.getElementById('changes-added-list').innerHTML=added.map(c=>`<div class="gap-item"><span style="color:#0d6e3f;font-size:16px;">+</span><div><strong>${c.title}</strong><br><span style="font-size:12px;color:#666;">${c.detail}</span></div></div>`).join('')||'<p style="color:#888;font-size:13px;">None</p>';
    document.getElementById('changes-removed-list').innerHTML=removed.map(c=>`<div class="gap-item"><span style="color:#c0392b;font-size:16px;">-</span><div><strong style="text-decoration:line-through;">${c.title}</strong><br><span style="font-size:12px;color:#666;">${c.detail}</span></div></div>`).join('')||'<p style="color:#888;font-size:13px;">None</p>';
  }

  // Blog body
  const metaBox=`<div class="meta-output-box">
    <strong>📌 Meta Title:</strong> <span class="meta-val">${opt.meta_title||''}</span><br>
    <strong>📌 Meta Description:</strong> <span class="meta-val">${opt.meta_description||''}</span><br>
    <strong>📌 URL Slug:</strong> <span class="meta-val">${opt.url_slug||''}</span>
  </div>`;
  document.getElementById('blog-body').innerHTML=metaBox+(opt.optimized_html||'<p style="color:#888;">No content was generated. Please try again.</p>');

  // Activate FAQ toggles
  document.querySelectorAll('.faq-item').forEach(fi=>{
    const q=fi.querySelector('.faq-q');
    if(q)q.addEventListener('click',()=>fi.classList.toggle('open'));
  });

  document.getElementById('output-section').scrollIntoView({behavior:'smooth'});
}

/* ══════════════════════════════════════════
   DOWNLOADS
══════════════════════════════════════════ */
function dlReport(){
  const wrap=document.getElementById('output-section');
  const styles=`<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
${document.querySelector('style')?document.querySelector('style').textContent:''}
body{background:#f4f7fc;padding:20px;font-family:'Inter',sans-serif;}
</style>`;
  const html=`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>SEO Report — ${S.topicLabel}</title>${styles}</head><body>${wrap.outerHTML}</body></html>`;
  doDL(new Blob([html],{type:'text/html'}),'SEO-Report-'+safe(S.topicLabel)+'.html');
}

/* DOCX Download — Fixed with bundled library */
async function dlDOCX(){
  const btn=document.getElementById('btn-docx');
  const origLabel='📄 Download Blog (DOCX)';
  const opt=S.result?.opt;
  if(!opt){alert('No result yet.');return;}

  // Try to get docx library — check multiple global names CDNs use
  let docxLib = window.docx || window.DocxJS || null;

  if(!docxLib){
    btn.innerHTML='<span class="spinner spinner-dark"></span> Loading library…';
    btn.disabled=true;
    const cdns=[
      'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.js',
      'https://unpkg.com/docx@8.5.0/build/index.js',
      'https://cdnjs.cloudflare.com/ajax/libs/docx/8.5.0/index.js',
    ];
    for(const url of cdns){
      try{
        await loadScript(url);
        docxLib = window.docx || null;
        if(docxLib) break;
      }catch(e){ console.warn('CDN failed:',url); }
    }
  }

  // If library still unavailable, generate clean styled HTML as .doc (Word opens it fine)
  if(!docxLib){
    btn.innerHTML='<span class="spinner spinner-dark"></span> Generating…';
    try{
      const htmlContent = buildWordHTML(opt);
      const blob = new Blob([htmlContent], {type:'application/msword'});
      doDL(blob, 'SEO-Blog-'+safe(S.topicLabel)+'.doc');
      btn.innerHTML='✅ Downloaded (.doc)!';
      setTimeout(()=>{btn.innerHTML=origLabel;btn.disabled=false;},3000);
    }catch(e){
      btn.innerHTML=origLabel;btn.disabled=false;
      alert('Download failed: '+e.message);
    }
    return;
  }

  btn.innerHTML='<span class="spinner spinner-dark"></span> Building DOCX…';btn.disabled=true;

  try{
    const{Document,Packer,Paragraph,TextRun,HeadingLevel,Table,TableRow,TableCell,WidthType}=docxLib;
    const tmp=document.createElement('div');
    tmp.innerHTML=opt.optimized_html||'';
    const ch=[];

    // Header
    ch.push(new Paragraph({children:[new TextRun({text:'SEO OPTIMIZED CONTENT — '+S.topicLabel,bold:true,size:26,color:'0d2b6e',font:'Calibri'})],spacing:{after:200}}));
    ch.push(new Paragraph({children:[new TextRun({text:'Generated by 3E Accounting SEO Optimizer',size:18,color:'666666',italics:true})],spacing:{after:100}}));
    ch.push(new Paragraph({children:[new TextRun({text:'Category: '+S.category+' | Date: '+new Date().toLocaleDateString('en-SG'),size:18,color:'666666'})],spacing:{after:200}}));

    // Meta info
    ch.push(new Paragraph({children:[new TextRun({text:'── META INFORMATION ──',bold:true,size:20,color:'0d2b6e'})],spacing:{after:100}}));
    ch.push(new Paragraph({children:[new TextRun({text:'Meta Title: ',bold:true,size:20}),new TextRun({text:opt.meta_title||'',size:20,color:'0d6e3f'})],spacing:{after:80}}));
    ch.push(new Paragraph({children:[new TextRun({text:'Meta Description: ',bold:true,size:20}),new TextRun({text:opt.meta_description||'',size:20,color:'0d6e3f'})],spacing:{after:80}}));
    ch.push(new Paragraph({children:[new TextRun({text:'URL Slug: ',bold:true,size:20}),new TextRun({text:opt.url_slug||'',size:20,color:'0d6e3f'})],spacing:{after:200}}));

    // Color legend
    ch.push(new Paragraph({children:[
      new TextRun({text:'COLOR LEGEND: ',bold:true,size:18}),
      new TextRun({text:'■ GREEN = New content added  ',size:18,color:'0d6e3f',bold:true}),
      new TextRun({text:'■ RED Strikethrough = Remove  ',size:18,color:'c0392b',bold:true,strike:true}),
      new TextRun({text:'■ Normal = Keep unchanged',size:18,color:'333333'})
    ],spacing:{after:280},shading:{type:'clear',fill:'F8FBFF'}}));

    ch.push(new Paragraph({children:[new TextRun({text:'── OPTIMIZED CONTENT ──',bold:true,size:20,color:'0d2b6e'})],spacing:{before:200,after:120}}));

    function getRuns(node,defaultColor,strike){
      const runs=[];
      node.childNodes.forEach(n=>{
        if(n.nodeType===Node.TEXT_NODE){
          const t=n.textContent;
          if(t.replace(/\s/g,'').length>0){
            runs.push(new TextRun({text:t,size:22,color:defaultColor||'1A1A1A',strike:strike||undefined}));
          }
        } else if(n.nodeType===Node.ELEMENT_NODE){
          const tag=n.tagName.toLowerCase();
          if(tag==='strong'||tag==='b'){
            getRuns(n,defaultColor,strike).forEach(r=>runs.push(new TextRun({...r,bold:true})));
          } else if(tag==='em'||tag==='i'){
            getRuns(n,defaultColor,strike).forEach(r=>runs.push(new TextRun({...r,italics:true})));
          } else if(tag==='span'&&n.classList.contains('new-inline')){
            runs.push(new TextRun({text:n.textContent,size:22,color:'0d6e3f',highlight:'green'}));
          } else if(tag==='span'&&n.classList.contains('remove-inline')){
            runs.push(new TextRun({text:n.textContent,size:22,color:'c0392b',strike:true}));
          } else if(tag==='a'){
            runs.push(new TextRun({text:n.textContent,size:22,color:defaultColor||'1A4FAD',underline:{},strike:strike||undefined}));
          } else {
            runs.push(...getRuns(n,defaultColor,strike));
          }
        }
      });
      return runs.filter(r=>r);
    }

    function nodeToParas(node){
      const ps=[];
      if(node.nodeType!==Node.ELEMENT_NODE)return ps;
      const tag=node.tagName.toLowerCase();
      const isNew=node.classList?.contains('new-block');
      const isRem=node.classList?.contains('remove-block');
      const col=isNew?'065f46':isRem?'c0392b':null;
      const strike=isRem;

      function mkRuns(n){
        const r=getRuns(n,col,strike);
        if(!r.length)r.push(new TextRun({text:n.textContent||'',size:22,color:col||'1A1A1A'}));
        return r;
      }

      if(tag==='h1'){ps.push(new Paragraph({heading:HeadingLevel.HEADING_1,children:mkRuns(node),spacing:{before:280,after:140}}));}
      else if(tag==='h2'){ps.push(new Paragraph({heading:HeadingLevel.HEADING_2,children:mkRuns(node),spacing:{before:240,after:100}}));}
      else if(tag==='h3'){ps.push(new Paragraph({heading:HeadingLevel.HEADING_3,children:mkRuns(node),spacing:{before:200,after:80}}));}
      else if(tag==='h4'){ps.push(new Paragraph({heading:HeadingLevel.HEADING_4,children:mkRuns(node),spacing:{before:160,after:60}}));}
      else if(tag==='p'){
        const r=mkRuns(node);
        if(r.length&&node.textContent.trim()){
          const shade=isNew?{type:'clear',fill:'E6F5EF'}:isRem?{type:'clear',fill:'FDEAEA'}:undefined;
          ps.push(new Paragraph({children:r,spacing:{after:140},shading:shade}));
        }
      }
      else if(tag==='ul'||tag==='ol'){
        node.querySelectorAll('li').forEach((li,idx)=>{
          const r=mkRuns(li);
          const shade=isNew?{type:'clear',fill:'E6F5EF'}:isRem?{type:'clear',fill:'FDEAEA'}:undefined;
          ps.push(new Paragraph({bullet:{level:0},children:r.length?r:[new TextRun({text:li.textContent,size:22})],spacing:{after:80},shading:shade}));
        });
      }
      else if(tag==='table'){
        try{
          const rows=[];
          node.querySelectorAll('tr').forEach(tr=>{
            const cells=Array.from(tr.querySelectorAll('th,td')).map(c=>{
              const isTh=c.tagName.toLowerCase()==='th';
              return new TableCell({children:[new Paragraph({children:[new TextRun({text:c.textContent.trim(),size:20,bold:isTh,color:isTh?'FFFFFF':'2A2A2A'})],spacing:{after:40}})],shading:isTh?{type:'clear',fill:'0D2B6E'}:undefined});
            });
            if(cells.length)rows.push(new TableRow({children:cells}));
          });
          if(rows.length){
            ps.push(new Table({rows,width:{size:100,type:WidthType.PERCENTAGE}}));
            ps.push(new Paragraph({children:[],spacing:{after:140}}));
          }
        }catch{
          node.querySelectorAll('tr').forEach(tr=>{
            const cells=Array.from(tr.querySelectorAll('th,td')).map(c=>c.textContent.trim());
            ps.push(new Paragraph({children:[new TextRun({text:cells.join(' | '),size:19,font:'Courier New'})],spacing:{after:50}}));
          });
        }
      }
      else if(tag==='div'||(tag==='section')){
        // Handle new-block and remove-block divs
        if(isNew||isRem){
          node.childNodes.forEach(c=>ps.push(...nodeToParas(c)));
        } else {
          node.childNodes.forEach(c=>ps.push(...nodeToParas(c)));
        }
      }
      else{node.childNodes.forEach(c=>ps.push(...nodeToParas(c)));}
      return ps;
    }

    tmp.childNodes.forEach(n=>ch.push(...nodeToParas(n)));

    const doc=new Document({
      styles:{
        default:{
          document:{run:{font:{name:'Calibri'},size:22}},
          heading1:{run:{color:'0D2B6E',bold:true,size:32,font:'Calibri'}},
          heading2:{run:{color:'0D2B6E',bold:true,size:26,font:'Calibri'}},
          heading3:{run:{color:'1C3870',bold:true,size:22,font:'Calibri'}},
        }
      },
      sections:[{
        properties:{
          page:{
            size:{width:12240,height:15840},
            margin:{top:1440,right:1440,bottom:1440,left:1440}
          }
        },
        children:ch
      }]
    });
    const blob=await Packer.toBlob(doc);
    doDL(blob,'SEO-Blog-'+safe(S.topicLabel)+'.docx');
    btn.innerHTML='✅ Downloaded!';
    setTimeout(()=>{btn.innerHTML=origLabel;btn.disabled=false;},3000);
  }catch(e){
    console.error(e);
    btn.innerHTML=origLabel;btn.disabled=false;
    alert('DOCX build error: '+e.message+'\n\nPlease use the HTML download instead — it preserves all color coding perfectly.');
  }
}

/* Build a Word-compatible HTML .doc file as fallback when docx CDN unavailable */
function buildWordHTML(opt){
  const html = opt.optimized_html || '';
  // Convert color-block divs to styled spans for Word
  const styled = html
    .replace(/<div class="new-block">/g, '<div style="background:#e6f5ef;border-left:4px solid #0d6e3f;padding:8px 12px;margin:8px 0;">')
    .replace(/<div class="remove-block">/g, '<div style="background:#fdeaea;border-left:4px solid #c0392b;padding:8px 12px;margin:8px 0;text-decoration:line-through;color:#c0392b;">')
    .replace(/<span class="new-inline">/g, '<span style="background:#d4edda;color:#0d6e3f;font-weight:600;">')
    .replace(/<span class="remove-inline">/g, '<span style="color:#c0392b;text-decoration:line-through;">');
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8">
<style>
  body{font-family:Calibri,sans-serif;font-size:11pt;color:#1a1a1a;margin:2cm;}
  h1{font-size:20pt;color:#0d2b6e;border-bottom:2px solid #0d2b6e;padding-bottom:6pt;}
  h2{font-size:15pt;color:#0d2b6e;margin-top:18pt;}
  h3{font-size:13pt;color:#1c3870;margin-top:14pt;}
  p{line-height:1.6;margin:6pt 0;}
  table{border-collapse:collapse;width:100%;margin:12pt 0;}
  th{background:#0d2b6e;color:#fff;padding:6pt 8pt;text-align:left;font-size:10pt;}
  td{border:1px solid #dde5f3;padding:5pt 8pt;font-size:10pt;}
  .meta-box{background:#f0f4fa;border:1px solid #b8ccf5;padding:12pt;margin-bottom:16pt;border-radius:4pt;}
  .legend{background:#f8f9fa;border:1px solid #dde5f3;padding:8pt 12pt;margin-bottom:12pt;font-size:9pt;}
</style>
</head><body>
<div class="meta-box">
  <strong>Meta Title:</strong> ${opt.meta_title||''}<br>
  <strong>Meta Description:</strong> ${opt.meta_description||''}<br>
  <strong>URL Slug:</strong> ${opt.url_slug||''}
</div>
<div class="legend">
  <span style="color:#0d6e3f;font-weight:bold;">■ GREEN BACKGROUND</span> = New content added &nbsp;|&nbsp;
  <span style="color:#c0392b;font-weight:bold;">■ RED BACKGROUND + strikethrough</span> = Remove &nbsp;|&nbsp;
  Normal = Keep as-is
</div>
${styled}
</body></html>`;
}

function loadScript(src){
  return new Promise((res,rej)=>{
    const s=document.createElement('script');
    s.src=src;s.onload=res;s.onerror=rej;
    document.head.appendChild(s);
  });
}

function doDL(blob,name){
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=name;
  a.style.position='fixed';a.style.opacity='0';
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},2000);
}

function safe(s){return(s||'report').replace(/[^a-z0-9]/gi,'_').slice(0,40);}
