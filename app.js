/* ══════════════════════════════════════════════════════════════════════════
   APP.JS — High-Output AI Content Engine v5.0
   Section-wise generation · Category-differentiated · Anti-truncation
══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────
   STATE
───────────────────────────────────────────────────────────── */
const S = {
  prov: 'openrouter', key: '', model: '', docxFile: null, docxText: '',
  category: '', topic: '', topicLabel: '', result: null, kws: [],
  currentStep: 1, pageUrl: '',
  /* New state for section-wise */
  structure: null, sectionsHtml: [], generationLog: []
};

/* ─────────────────────────────────────────────────────────────
   INIT — Build provider UI
───────────────────────────────────────────────────────────── */
(function () {
  const tabs = document.getElementById('prov-tabs');
  const panels = document.getElementById('prov-panels');
  Object.values(PROV).forEach((p, i) => {
    const t = document.createElement('button');
    t.className = 'prov-tab' + (i === 0 ? ' active' : '');
    t.textContent = p.label; t.onclick = () => switchProv(p.id);
    tabs.appendChild(t);
    const d = document.createElement('div');
    d.id = 'pp-' + p.id; d.style.display = i === 0 ? 'block' : 'none';
    d.innerHTML = `<div class="alert alert-${p.at}" style="margin-bottom:12px;"><span>${p.at === 'green' ? '🆓' : p.at === 'yellow' ? '⚠️' : '💡'}</span><div>${p.at_txt}</div></div>
<div class="field"><label class="label">${p.label} API Key</label><input type="password" id="k-${p.id}" placeholder="${p.ph}" autocomplete="off"><div class="hint">${p.hint}</div></div>
<div class="field"><label class="label">Model</label><select id="m-${p.id}">${p.models.map(g => `<optgroup label="── ${g.g} ──">${g.opts.map((o, oi) => `<option value="${o.v}"${oi === 0 ? ' selected' : ''}>${o.l}</option>`).join('')}</optgroup>`).join('')}</select><div class="hint">${p.fn}</div></div>`;
    panels.appendChild(d);
  });
})();

function switchProv(id) {
  S.prov = id;
  document.querySelectorAll('.prov-tab').forEach((t, i) => t.classList.toggle('active', Object.keys(PROV)[i] === id));
  Object.keys(PROV).forEach(k => { const e = document.getElementById('pp-' + k); if (e) e.style.display = k === id ? 'block' : 'none'; });
  document.getElementById('api-err').style.display = 'none';
}

/* ─────────────────────────────────────────────────────────────
   STEPPER
───────────────────────────────────────────────────────────── */
function setStep(n) {
  S.currentStep = n;
  for (let i = 1; i <= 6; i++) {
    const el = document.getElementById('stp-' + i);
    el.classList.remove('active', 'done');
    if (i < n) el.classList.add('done');
    if (i === n) el.classList.add('active');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  for (let i = 1; i <= 6; i++) {
    const el = document.getElementById('stp-' + i);
    el.addEventListener('click', () => { if (el.classList.contains('done')) goBackToStep(i); });
  }
});

function goBackToStep(target) {
  for (let i = 1; i <= 5; i++) document.getElementById('step' + i).style.display = 'none';
  document.getElementById('output-section').classList.remove('show');
  if (target >= 1 && target <= 5) {
    document.getElementById('step' + target).style.display = 'block';
    setStep(target);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack() { if (S.currentStep > 1) goBackToStep(S.currentStep - 1); }

/* ─────────────────────────────────────────────────────────────
   STEP 1 — API
───────────────────────────────────────────────────────────── */
function validateAPI() {
  const p = PROV[S.prov];
  const k = (document.getElementById('k-' + S.prov)?.value || '').trim();
  const eb = document.getElementById('api-err');
  const et = document.getElementById('api-err-txt');
  eb.style.display = 'none';
  if (!k) { eb.style.display = 'flex'; et.innerHTML = 'Please enter your ' + p.label + ' API key.'; return; }
  if (!k.startsWith(p.kp)) { eb.style.display = 'flex'; et.innerHTML = '<strong>Wrong format!</strong> ' + p.label + ' keys start with <code>' + p.kp + '…</code>'; return; }
  S.key = k; S.model = document.getElementById('m-' + S.prov)?.value || '';
  document.getElementById('step1').style.display = 'none';
  document.getElementById('step2').style.display = 'block';
  setStep(2);
}

/* ─────────────────────────────────────────────────────────────
   STEP 2 — UPLOAD
───────────────────────────────────────────────────────────── */
function handleFile(inp) {
  const f = inp.files[0]; if (!f) return;
  S.docxFile = f;
  document.getElementById('fname-text').textContent = f.name;
  document.getElementById('upload-done').classList.add('show');
  document.getElementById('btn-step2').disabled = false;
}

(function () {
  const uz = document.getElementById('upload-zone');
  uz.addEventListener('dragover', e => { e.preventDefault(); uz.classList.add('drag'); });
  uz.addEventListener('dragleave', () => uz.classList.remove('drag'));
  uz.addEventListener('drop', e => {
    e.preventDefault(); uz.classList.remove('drag');
    const f = e.dataTransfer.files[0];
    if (f) { S.docxFile = f; document.getElementById('fname-text').textContent = f.name; document.getElementById('upload-done').classList.add('show'); document.getElementById('btn-step2').disabled = false; }
  });
})();

async function goStep3() {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const r = await mammoth.convertToHtml({ arrayBuffer: e.target.result });
      const div = document.createElement('div');
      div.innerHTML = r.value;
      S.docxText = div.innerText || div.textContent || '';
      S.docxText = S.docxText.replace(/\n{3,}/g, '\n\n').trim();

      const wc = S.docxText.split(/\s+/).filter(Boolean).length;
      const rt = Math.ceil(wc / 200);
      document.getElementById('doc-info').innerHTML = `<span class="doc-info-badge">📄 ${wc.toLocaleString()} words</span><span class="doc-info-badge">⏱ ~${rt} min read</span><span class="doc-info-badge">✅ Document parsed</span>`;
      document.getElementById('doc-info').style.display = 'flex';
    } catch { S.docxText = 'Could not parse DOCX.'; }
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'block';
    setStep(3);
  };
  reader.readAsArrayBuffer(S.docxFile);
}

/* ─────────────────────────────────────────────────────────────
   STEP 3 — CATEGORY
───────────────────────────────────────────────────────────── */
function selectCat(cat) {
  S.category = cat;
  document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('cat-' + cat).classList.add('selected');
  const sel = document.getElementById('topic-select');
  sel.innerHTML = '<option value="">— Select a topic —</option>';
  (TOPICS[cat] || []).forEach(t => { const o = document.createElement('option'); o.value = t; o.textContent = t; sel.appendChild(o); });
  const cu = document.createElement('option'); cu.value = '__custom__'; cu.textContent = '✏️ Other (type your own)'; sel.appendChild(cu);
  document.getElementById('step3').style.display = 'none';
  document.getElementById('step4').style.display = 'block';
  setStep(4);
}

/* ─────────────────────────────────────────────────────────────
   STEP 4 — TOPIC
───────────────────────────────────────────────────────────── */
function onTopicChange() {
  const v = document.getElementById('topic-select').value;
  const cw = document.getElementById('custom-wrap');
  const pv = document.getElementById('topic-preview');
  const btn = document.getElementById('btn-step4');
  const rules = CATEGORY_RULES[S.category] || {};

  if (v === '__custom__') { cw.style.display = 'block'; pv.style.display = 'none'; btn.disabled = false; S.topic = ''; }
  else if (v) {
    cw.style.display = 'none'; pv.style.display = 'block'; S.topic = v; S.topicLabel = v;
    pv.innerHTML = `<div class="alert alert-green"><span>✅</span><div>
      <strong>Topic:</strong> ${v}<br>
      <span style="font-size:12px;opacity:.8;">Category: <strong>${S.category}</strong> — ${rules.description || ''}</span><br>
      <span style="font-size:12px;opacity:.8;">Target: <strong>${rules.words?.label || ''} words</strong> · Tone: <strong>${rules.tone || ''}</strong></span>
    </div></div>`;
    btn.disabled = false;
  } else { cw.style.display = 'none'; pv.style.display = 'none'; btn.disabled = true; }
}

function goStep5() {
  const cv = document.getElementById('custom-topic').value.trim();
  if (document.getElementById('topic-select').value === '__custom__') {
    if (!cv) { alert('Please enter a custom topic.'); return; }
    S.topic = cv; S.topicLabel = cv;
  }

  const isSv = S.category === 'services';
  const opts = isSv ? OPTS.services : OPTS.blog_inc_res;
  const grid = document.getElementById('opt-grid');
  grid.innerHTML = '';
  opts.forEach(o => {
    const label = document.createElement('label');
    label.className = 'opt-item';
    label.innerHTML = `<input type="checkbox" id="opt-${o.id}" checked><div class="opt-item-text">${o.label}<span class="opt-item-hint">${o.hint}</span></div>`;
    grid.appendChild(label);
  });

  document.getElementById('step5-cat-info').innerHTML = `<span class="doc-info-badge">📂 ${S.category.charAt(0).toUpperCase() + S.category.slice(1)}</span><span class="doc-info-badge">🎯 ${S.topicLabel.slice(0, 40)}${S.topicLabel.length > 40 ? '…' : ''}</span>`;

  document.getElementById('step4').style.display = 'none';
  document.getElementById('step5').style.display = 'block';
  setStep(5);
}

function getOpts() {
  return Array.from(document.getElementById('opt-grid').querySelectorAll('input:checked')).map(i => i.id.replace('opt-', ''));
}

/* ─────────────────────────────────────────────────────────────
   API CALL
───────────────────────────────────────────────────────────── */
async function callAI(prompt) {
  const p = PROV[S.prov];
  const resp = await fetch(p.url(S), { method: 'POST', headers: p.hd(S), body: p.bd(prompt, S) });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(p.err(resp.status, err?.error?.message || resp.statusText, S));
  }
  return p.parse(await resp.json());
}

function parseJSON(raw) {
  if (!raw) return null;
  const clean = raw.replace(/```json|```/g, '').trim();
  try { return JSON.parse(clean); } catch {
    const m = clean.match(/\{[\s\S]*\}/);
    if (m) try { return JSON.parse(m[0]); } catch { }
    return null;
  }
}

/* ─────────────────────────────────────────────────────────────
   PROGRESS HELPERS
───────────────────────────────────────────────────────────── */
const PHASE_IDS = ['ps-kw', 'ps-serp', 'ps-audit', 'ps-struct', 'ps-sections', 'ps-merge', 'ps-humanize'];

function phase(id, pct, txt) {
  PHASE_IDS.forEach(p => {
    const el = document.getElementById(p);
    if (!el) return;
    if (el.classList.contains('active')) el.classList.replace('active', 'done');
  });
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  setP(pct, txt);
}

function setP(pct, txt) {
  document.getElementById('prog-fill').style.width = pct + '%';
  document.getElementById('prog-pct').textContent = pct + '%';
  document.getElementById('prog-text').textContent = txt;
}

function logStep(msg) {
  S.generationLog.push(msg);
  const logEl = document.getElementById('gen-log');
  if (logEl) {
    logEl.innerHTML = S.generationLog.slice(-6).map(l => `<div class="log-line">${l}</div>`).join('');
  }
}

/* ─────────────────────────────────────────────────────────────
   MAIN RUN — Section-wise generation engine
───────────────────────────────────────────────────────────── */
async function runOpt() {
  const btn = document.getElementById('btn-run');
  const checkedOpts = getOpts();

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Initializing Content Engine…';
  document.getElementById('progress-wrap').classList.add('show');
  document.getElementById('gen-log-wrap').style.display = 'block';
  S.generationLog = [];
  S.sectionsHtml = [];
  S.structure = null;

  const rules = CATEGORY_RULES[S.category] || CATEGORY_RULES.blogs;
  const depthMode = document.getElementById('depth-mode')?.value || 'deep';
  logStep(`🚀 Engine started — ${S.category} · ${rules.words.label} words · ${depthMode} mode`);

  try {
    /* ── PHASE 1: Keywords ── */
    phase('ps-kw', 5, 'Researching keywords…');
    logStep('🔑 Generating keyword research…');
    const kwPrompt = window.promptOverrides?.kw || pKw();
    const kwR = await callAI(kwPrompt);
    S.kws = parseJSON(kwR)?.keywords || [];
    logStep(`✅ Keywords: ${S.kws.length} found`);

    /* ── PHASE 2: SERP Analysis ── */
    phase('ps-serp', 12, 'Analyzing SERP competitors…');
    logStep('📊 Running SERP analysis…');
    const serpPrompt = window.promptOverrides?.serp || pSERP();
    const serpR = await callAI(serpPrompt);
    const serpD = parseJSON(serpR) || {};
    logStep(`✅ SERP: ${(serpD.content_gaps || []).length} gaps identified`);

    /* ── PHASE 3: SEO Audit ── */
    phase('ps-audit', 20, 'Running SEO audit…');
    logStep('🔍 Auditing existing document…');
    const auditPrompt = window.promptOverrides?.audit || pAudit();
    const auditR = await callAI(auditPrompt);
    const auditD = parseJSON(auditR) || {};
    logStep(`✅ Audit: ${(auditD.issues_fail || []).length} critical issues found`);

    /* ── PHASE 4: Structure Generation ── */
    phase('ps-struct', 28, 'Building content structure…');
    logStep('🏗️ Generating heading structure…');
    const structPrompt = pStructure(kwR, serpR);
    const structR = await callAI(structPrompt);
    S.structure = parseJSON(structR) || {};

    if (!S.structure.sections || S.structure.sections.length === 0) {
      throw new Error('Structure generation failed — no sections returned. Try again.');
    }
    logStep(`✅ Structure: ${S.structure.sections.length} sections planned`);

    /* ── PHASE 5: Section-wise Generation ── */
    phase('ps-sections', 35, `Writing section 1 of ${S.structure.sections.length}…`);
    const totalSections = S.structure.sections.length;
    const allSectionsBuilt = [];

    for (let i = 0; i < totalSections; i++) {
      const section = S.structure.sections[i];
      const pct = 35 + Math.round((i / totalSections) * 48);
      setP(pct, `Writing section ${i + 1}/${totalSections}: "${section.h2}"…`);
      logStep(`✍️ Writing [${i + 1}/${totalSections}]: ${section.h2}`);

      const sectionPrompt = pSection(section, i, totalSections, kwR, serpR, allSectionsBuilt);
      const sectionR = await callAI(sectionPrompt);
      const sectionD = parseJSON(sectionR) || {};

      const html = sectionD.html || `<h2 id="${section.id}">${section.h2}</h2><p>Section content for ${section.h2}.</p>`;
      const wordCount = sectionD.word_count || 0;

      S.sectionsHtml.push(html);
      allSectionsBuilt.push({
        h2: section.h2,
        preview: (sectionD.preview || html.replace(/<[^>]+>/g, '').slice(0, 100))
      });

      logStep(`✅ Section ${i + 1} done — ~${wordCount} words`);
    }

    /* ── PHASE 6: Final Merge ── */
    phase('ps-merge', 85, 'Merging and polishing final content…');
    logStep('🔧 Assembling final HTML…');

    const allSectionsHtmlStr = S.sectionsHtml.join('\n\n');
    const mergePrompt = pMerge(S.structure, allSectionsHtmlStr, kwR, auditR);
    const mergeR = await callAI(mergePrompt);
    const mergeD = parseJSON(mergeR) || {};

    /* Fallback: if merge fails, assemble manually */
    if (!mergeD.optimized_html) {
      logStep('⚠️ Merge parse failed — using direct assembly');
      mergeD.optimized_html = buildFallbackHtml(S.structure, S.sectionsHtml);
      mergeD.meta_title = S.structure.meta_title || S.topic;
      mergeD.meta_description = S.structure.meta_description || '';
      mergeD.url_slug = S.structure.url_slug || '';
    }

    /* ── PHASE 7: Humanization Pass ── */
    phase('ps-humanize', 92, 'Humanizing content to reduce AI detection…');
    logStep('🧑‍💻 Running humanization pass…');

    let finalHtml = mergeD.optimized_html || '';
    try {
      const humanizePrompt = pHumanize(finalHtml);
      const humanizeR = await callAI(humanizePrompt);
      /* The response should be raw HTML — strip any accidental markdown fences */
      const cleanHumanized = (humanizeR || '').replace(/^```html?\s*/i, '').replace(/```\s*$/i, '').trim();
      if (cleanHumanized && cleanHumanized.length > 200) {
        finalHtml = cleanHumanized;
        logStep('✅ Humanization complete — AI-detection risk reduced');
      } else {
        logStep('⚠️ Humanization returned short response — using original content');
      }
    } catch (humanizeErr) {
      logStep('⚠️ Humanization step failed (' + humanizeErr.message + ') — using original content');
      /* Non-fatal: continue with original merged HTML */
    }

    /* Build final result */
    setP(100, 'Complete! ✅');
    PHASE_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.classList.remove('active'); el.classList.add('done'); }
    });
    logStep('🎉 Content generation complete!');

    S.result = {
      serp: serpD,
      audit: auditD,
      opt: {
        ...mergeD,
        optimized_html: finalHtml,
        changes_added: mergeD.changes_added || [],
        changes_removed: mergeD.changes_removed || []
      }
    };

    renderReport();
    setStep(6);

  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = '🚀 Start Full SEO Optimization';
    document.getElementById('progress-wrap').classList.remove('show');
    logStep('❌ Error: ' + err.message);
    alert('Error:\n\n' + err.message + '\n\nCheck your API key and try again.');
  }
}

/* ─────────────────────────────────────────────────────────────
   FALLBACK HTML ASSEMBLER (if merge AI call fails)
───────────────────────────────────────────────────────────── */
function buildFallbackHtml(structure, sectionsHtml) {
  const rules = CATEGORY_RULES[S.category] || CATEGORY_RULES.blogs;
  const year = new Date().getFullYear();

  let siteBase = '';
  try { siteBase = new URL(S.pageUrl || '').origin; } catch (e) { siteBase = 'https://3ecpa.com.sg'; }

  const metaStrip = `<div class="meta-strip">
  <span class="meta-badge">3E Accounting Singapore</span>
  <span>Updated ${year}</span>
  <span class="meta-badge green">✓ Singapore Verified</span>
</div>`;

  let tocHtml = '';
  if (rules.toc) {
    const tocItems = (structure.sections || [])
      .filter(s => !s.is_cta && !s.is_faq)
      .map(s => `<li><a href="#${s.id}">${s.h2}</a></li>`)
      .join('\n    ');
    tocHtml = `<div class="toc-box"><h4>📋 Table of Contents</h4><ol>${tocItems}</ol></div>`;
  }

  const bottomCta = rules.cta ? `<div class="bottom-cta">
  <h2>Ready to Get Started?</h2>
  <p>Contact 3E Accounting today for a free consultation.</p>
  <div class="btn-row" style="justify-content:center;display:flex;gap:14px;">
    <a href="${siteBase}/contact/" class="cta-btn-w" style="color:#0d2b6e;">Get Free Consultation</a>
  </div>
</div>` : '';

  return `<h1>${structure.h1 || S.topic}</h1>
${metaStrip}
${tocHtml}
${sectionsHtml.join('\n\n')}
${bottomCta}`;
}

/* ─────────────────────────────────────────────────────────────
   RENDER REPORT
───────────────────────────────────────────────────────────── */
function renderReport() {
  const { serp, audit, opt } = S.result;
  document.getElementById('output-section').classList.add('show');
  document.getElementById('step5').style.display = 'none';

  /* Badges */
  const nA = (opt.changes_added || []).length, nR = (opt.changes_removed || []).length;
  document.getElementById('badge-added').textContent = '+' + nA + ' Added';
  document.getElementById('badge-removed').textContent = '-' + nR + ' Removed';
  document.getElementById('badge-score').textContent = 'Score: ' + (audit.score_before || '—') + '→' + (audit.score_after || '—');

  /* Scores */
  document.getElementById('sc-before').textContent = audit.score_before || '—';
  document.getElementById('sc-after').textContent = audit.score_after || '—';
  const sb = audit.score_breakdown || {};
  document.getElementById('sc-bars').innerHTML = Object.entries(sb).map(([k, v]) => `
    <div class="score-bar-row">
      <span class="score-bar-label">${k}</span>
      <div class="score-bar-track"><div class="score-bar-fill" style="width:${v}%;background:${v < 40 ? '#f87171' : v < 65 ? '#fbbf24' : '#6ee7b7'}"></div></div>
      <span class="score-bar-val">${v}</span>
    </div>`).join('');

  const wca = audit.word_count_after || opt.word_count_final || 0;
  const wcb = audit.word_count_before || 0;
  document.getElementById('sc-highlights').innerHTML = `
    <div>🟢 +${(audit.score_after || 0) - (audit.score_before || 0)} pts improvement</div>
    <div>🟢 ${wca > wcb ? '+' + (wca - wcb).toLocaleString() + ' words added' : wca.toLocaleString() + ' words'}</div>
    <div>🟢 ${(audit.issues_fail || []).length} critical issues addressed</div>
    <div>🟢 ${S.kws.length} keywords targeted</div>
    <div>🟢 ${S.sectionsHtml.length} sections generated</div>`;
  document.getElementById('sc-metrics').innerHTML = `
    <div class="score-metric"><div class="sm-num">${audit.word_count_before || '—'}</div><div class="sm-lbl">Words Before</div></div>
    <div class="score-metric"><div class="sm-num" style="color:#6ee7b7;">${wca || '—'}</div><div class="sm-lbl">Words After</div></div>
    <div class="score-metric"><div class="sm-num" style="color:#fbbf24;">${S.kws.length}</div><div class="sm-lbl">Keywords</div></div>
    <div class="score-metric"><div class="sm-num" style="color:#93c5fd;">${S.sectionsHtml.length}</div><div class="sm-lbl">Sections</div></div>`;

  /* Keywords */
  document.getElementById('kw-body').innerHTML = (S.kws || []).map(k => `
    <tr>
      <td><strong>${k.keyword}</strong></td>
      <td><span class="kw-badge kw-${k.type || 'lsi'}">${k.type || 'lsi'}</span></td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#1a4fad;">${k.volume || '—'}</td>
      <td><span class="${k.difficulty === 'High' ? 'diff-h' : k.difficulty === 'Medium' ? 'diff-m' : 'diff-l'}">${k.difficulty || '—'}</span></td>
      <td style="font-size:12px;color:#666;">${k.intent || '—'}</td>
    </tr>`).join('');

  /* SERP */
  document.getElementById('serp-cards').innerHTML = (serp.serp_competitors || []).map(c => `
    <div class="serp-card">
      <div class="serp-title"><span class="serp-rank">${c.rank}</span>${c.title}</div>
      <div class="serp-url">${c.url}</div>
      <div style="font-size:12px;color:#888;margin-bottom:5px;">~${(c.word_count || 2500).toLocaleString()} words · ${c.domain_authority || 'Medium'} DA</div>
      <div class="serp-tags">
        <span class="serp-tag ${c.has_faq ? 'on' : ''}">FAQ ${c.has_faq ? '✓' : '✗'}</span>
        <span class="serp-tag ${c.has_table ? 'on' : ''}">Tables ${c.has_table ? '✓' : '✗'}</span>
        ${(c.sections || []).slice(0, 4).map(s => `<span class="serp-tag on">${s}</span>`).join('')}
      </div>
    </div>`).join('');

  /* Audit */
  const ai = (item, type) => `<div class="audit-item"><div class="audit-ico ${type}">${type === 'fail' ? '❌' : type === 'warn' ? '⚠️' : '✅'}</div><div><span class="audit-lbl">${item.label}</span><span class="audit-det">${item.detail}</span></div></div>`;
  document.getElementById('audit-fail').innerHTML = (audit.issues_fail || []).map(i => ai(i, 'fail')).join('') || '<p style="color:#888;font-size:13px;">None found</p>';
  document.getElementById('audit-warn').innerHTML = (audit.issues_warn || []).map(i => ai(i, 'warn')).join('') || '<p style="color:#888;font-size:13px;">None found</p>';
  document.getElementById('audit-pass').innerHTML = (audit.issues_pass || []).map(i => ai(i, 'pass')).join('') || '<p style="color:#888;font-size:13px;">None found</p>';

  /* Gaps */
  document.getElementById('gap-topics').innerHTML = (serp.top_topics || []).map(t => `<div class="gap-item"><span style="color:#1a4fad;font-size:16px;">•</span>${t}</div>`).join('');
  document.getElementById('gap-missing').innerHTML = (serp.content_gaps || []).map(g => `<div class="gap-item"><span style="color:#c87000;">⚡</span>${g}</div>`).join('');

  /* Changes */
  const added = opt.changes_added || [];
  const removed = opt.changes_removed || [];
  if (added.length || removed.length) {
    document.getElementById('rpt-changes').style.display = 'block';
    document.getElementById('changes-nav-li').style.display = 'list-item';
    document.getElementById('changes-added-list').innerHTML = added.map(c => `<div class="gap-item"><span style="color:#0d6e3f;font-size:16px;">+</span><div><strong>${c.title}</strong><br><span style="font-size:12px;color:#666;">${c.detail}</span></div></div>`).join('') || '<p style="color:#888;font-size:13px;">None</p>';
    document.getElementById('changes-removed-list').innerHTML = removed.map(c => `<div class="gap-item"><span style="color:#c0392b;font-size:16px;">-</span><div><strong style="text-decoration:line-through;">${c.title}</strong><br><span style="font-size:12px;color:#666;">${c.detail}</span></div></div>`).join('') || '<p style="color:#888;font-size:13px;">None</p>';
  }

  /* Section breakdown panel */
  if (S.structure?.sections) {
    document.getElementById('rpt-sections').style.display = 'block';
    document.getElementById('sections-nav-li').style.display = 'list-item';
    document.getElementById('sections-list').innerHTML = S.structure.sections.map((s, i) => `
      <div class="gap-item">
        <span style="background:#1a4fad;color:#fff;border-radius:50%;width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;">${i + 1}</span>
        <div>
          <strong>${s.h2}</strong>
          ${s.h3s?.length ? `<br><span style="font-size:11px;color:#888;">↳ ${s.h3s.join(' · ')}</span>` : ''}
          <span style="font-size:11px;color:#888;margin-left:8px;">~${s.words || '—'} words</span>
          ${s.is_faq ? '<span class="cat-badge badge-toc" style="margin-left:6px;">FAQ</span>' : ''}
          ${s.is_cta ? '<span class="cat-badge badge-no-toc" style="margin-left:6px;">CTA</span>' : ''}
        </div>
      </div>`).join('');
  }

  /* Generation log */
  const logSection = document.getElementById('rpt-log');
  if (logSection && S.generationLog.length) {
    logSection.style.display = 'block';
    document.getElementById('log-nav-li').style.display = 'list-item';
    document.getElementById('gen-log-output').innerHTML = S.generationLog.map(l => `<div class="log-line">${l}</div>`).join('');
  }

  /* Blog body */
  const metaBox = `<div class="meta-output-box">
    <strong>📌 Meta Title:</strong> <span class="meta-val">${opt.meta_title || ''}</span><br>
    <strong>📌 Meta Description:</strong> <span class="meta-val">${opt.meta_description || ''}</span><br>
    <strong>📌 URL Slug:</strong> <span class="meta-val">${opt.url_slug || ''}</span>
  </div>`;
  document.getElementById('blog-body').innerHTML = metaBox + (opt.optimized_html || '<p style="color:#888;">No content was generated. Please try again.</p>');

  /* Activate FAQ toggles */
  document.querySelectorAll('.faq-item').forEach(fi => {
    const q = fi.querySelector('.faq-q');
    if (q) q.addEventListener('click', () => fi.classList.toggle('open'));
  });

  /* Word count of final output */
  const finalText = (opt.optimized_html || '').replace(/<[^>]+>/g, ' ');
  const finalWc = finalText.split(/\s+/).filter(Boolean).length;
  document.getElementById('final-wc').textContent = finalWc.toLocaleString() + ' words in final output';

  document.getElementById('output-section').scrollIntoView({ behavior: 'smooth' });
}

/* ─────────────────────────────────────────────────────────────
   DOWNLOADS
───────────────────────────────────────────────────────────── */
function dlReport() {
  const wrap = document.getElementById('output-section');
  const styles = `<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
${document.querySelector('style') ? document.querySelector('style').textContent : ''}
body{background:#f4f7fc;padding:20px;font-family:'Inter',sans-serif;}
</style>`;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>SEO Report — ${S.topicLabel}</title>${styles}</head><body>${wrap.outerHTML}</body></html>`;
  doDL(new Blob([html], { type: 'text/html' }), 'SEO-Report-' + safe(S.topicLabel) + '.html');
}

async function dlDOCX() {
  const btn = document.getElementById('btn-docx');
  const origLabel = '📄 Download Blog (DOCX)';
  const opt = S.result?.opt;
  if (!opt) { alert('No result yet.'); return; }

  let docxLib = window.docx || window.DocxJS || null;
  if (!docxLib) {
    btn.innerHTML = '<span class="spinner spinner-dark"></span> Loading library…'; btn.disabled = true;
    const cdns = ['https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.js', 'https://unpkg.com/docx@8.5.0/build/index.js'];
    for (const url of cdns) {
      try { await loadScript(url); docxLib = window.docx || null; if (docxLib) break; } catch (e) { }
    }
  }

  if (!docxLib) {
    btn.innerHTML = '<span class="spinner spinner-dark"></span> Generating…';
    const htmlContent = buildWordHTML(opt);
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    doDL(blob, 'SEO-Blog-' + safe(S.topicLabel) + '.doc');
    btn.innerHTML = '✅ Downloaded (.doc)!';
    setTimeout(() => { btn.innerHTML = origLabel; btn.disabled = false; }, 3000);
    return;
  }

  btn.innerHTML = '<span class="spinner spinner-dark"></span> Building DOCX…'; btn.disabled = true;
  try {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } = docxLib;
    const tmp = document.createElement('div');
    tmp.innerHTML = opt.optimized_html || '';
    const ch = [];

    ch.push(new Paragraph({ children: [new TextRun({ text: 'SEO OPTIMIZED CONTENT — ' + S.topicLabel, bold: true, size: 26, color: '0d2b6e', font: 'Calibri' })], spacing: { after: 200 } }));
    ch.push(new Paragraph({ children: [new TextRun({ text: 'Generated by 3E Accounting SEO Engine | Category: ' + S.category + ' | ' + new Date().toLocaleDateString('en-SG'), size: 18, color: '666666', italics: true })], spacing: { after: 300 } }));

    if (opt.meta_title) ch.push(new Paragraph({ children: [new TextRun({ text: 'Meta Title: ', bold: true, size: 20 }), new TextRun({ text: opt.meta_title, size: 20, color: '0d6e3f' })], spacing: { after: 80 } }));
    if (opt.meta_description) ch.push(new Paragraph({ children: [new TextRun({ text: 'Meta Description: ', bold: true, size: 20 }), new TextRun({ text: opt.meta_description, size: 20, color: '0d6e3f' })], spacing: { after: 80 } }));
    if (opt.url_slug) ch.push(new Paragraph({ children: [new TextRun({ text: 'URL Slug: ', bold: true, size: 20 }), new TextRun({ text: opt.url_slug, size: 20, color: '0d6e3f' })], spacing: { after: 300 } }));

    function nodeToParas(node) {
      const ps = []; if (node.nodeType !== Node.ELEMENT_NODE) return ps;
      const tag = node.tagName.toLowerCase();
      function mkRuns(n, col, strike) {
        const runs = [];
        n.childNodes.forEach(c => {
          if (c.nodeType === Node.TEXT_NODE && c.textContent.trim()) {
            runs.push(new TextRun({ text: c.textContent, size: 22, color: col || '1A1A1A', strike: strike || undefined }));
          } else if (c.nodeType === Node.ELEMENT_NODE) {
            const t = c.tagName.toLowerCase();
            if (t === 'strong' || t === 'b') mkRuns(c, col, strike).forEach(r => runs.push(new TextRun({ ...r, bold: true })));
            else if (t === 'a') runs.push(new TextRun({ text: c.textContent, size: 22, color: col || '1A4FAD', underline: {}, strike: strike || undefined }));
            else mkRuns(c, col, strike).forEach(r => runs.push(r));
          }
        });
        return runs.length ? runs : [new TextRun({ text: n.textContent || '', size: 22, color: col || '1A1A1A' })];
      }
      const isNew = node.classList?.contains('new-block');
      const isRem = node.classList?.contains('remove-block');
      const col = isNew ? '065f46' : isRem ? 'c0392b' : null;
      const shade = isNew ? { type: 'clear', fill: 'E6F5EF' } : isRem ? { type: 'clear', fill: 'FDEAEA' } : undefined;
      if (tag === 'h1') ps.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: mkRuns(node, col), spacing: { before: 280, after: 140 } }));
      else if (tag === 'h2') ps.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: mkRuns(node, col), spacing: { before: 240, after: 100 } }));
      else if (tag === 'h3') ps.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: mkRuns(node, col), spacing: { before: 200, after: 80 } }));
      else if (tag === 'h4') ps.push(new Paragraph({ heading: HeadingLevel.HEADING_4, children: mkRuns(node, col), spacing: { before: 160, after: 60 } }));
      else if (tag === 'p') { const r = mkRuns(node, col, isRem); if (r.length && node.textContent.trim()) ps.push(new Paragraph({ children: r, spacing: { after: 140 }, shading: shade })); }
      else if (tag === 'ul' || tag === 'ol') { node.querySelectorAll('li').forEach(li => { ps.push(new Paragraph({ bullet: { level: 0 }, children: mkRuns(li, col), spacing: { after: 80 }, shading: shade })); }); }
      else { node.childNodes.forEach(c => ps.push(...nodeToParas(c))); }
      return ps;
    }
    tmp.childNodes.forEach(n => ch.push(...nodeToParas(n)));

    const doc = new Document({
      styles: { default: { document: { run: { font: { name: 'Calibri' }, size: 22 } }, heading1: { run: { color: '0D2B6E', bold: true, size: 32 } }, heading2: { run: { color: '0D2B6E', bold: true, size: 26 } }, heading3: { run: { color: '1C3870', bold: true, size: 22 } } } },
      sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, children: ch }]
    });
    const blob = await Packer.toBlob(doc);
    doDL(blob, 'SEO-Blog-' + safe(S.topicLabel) + '.docx');
    btn.innerHTML = '✅ Downloaded!';
    setTimeout(() => { btn.innerHTML = origLabel; btn.disabled = false; }, 3000);
  } catch (e) {
    console.error(e);
    btn.innerHTML = origLabel; btn.disabled = false;
    alert('DOCX build error: ' + e.message + '\n\nUse the HTML download instead.');
  }
}

function buildWordHTML(opt) {
  const html = opt.optimized_html || '';
  const styled = html
    .replace(/<div class="new-block">/g, '<div style="background:#e6f5ef;border-left:4px solid #0d6e3f;padding:8px 12px;margin:8px 0;">')
    .replace(/<div class="remove-block">/g, '<div style="background:#fdeaea;border-left:4px solid #c0392b;padding:8px 12px;margin:8px 0;text-decoration:line-through;color:#c0392b;">');
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
  .meta-output-box{background:#f0f4fa;border:1px solid #b8ccf5;padding:12pt;margin-bottom:16pt;}
</style>
</head><body>
<div class="meta-output-box">
  <strong>Meta Title:</strong> ${opt.meta_title || ''}<br>
  <strong>Meta Description:</strong> ${opt.meta_description || ''}<br>
  <strong>URL Slug:</strong> ${opt.url_slug || ''}
</div>
${styled}
</body></html>`;
}

function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

function doDL(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  a.style.position = 'fixed'; a.style.opacity = '0';
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
}

function safe(s) { return (s || 'report').replace(/[^a-z0-9]/gi, '_').slice(0, 40); }
