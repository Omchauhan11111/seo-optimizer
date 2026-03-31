/* ══════════════════════════════════════════
   PROMPT BUILDERS — Dynamic, Context-Aware
   v3.0 — No country assumptions, doc-driven
══════════════════════════════════════════ */

const isSvc = () => S.category === 'services';

/* ─── Extract market/country from URL and doc ─── */
function detectMarket() {
  // 1. Try from URL first (most reliable)
  const url = (S.pageUrl || '').toLowerCase();
  if (url.includes('.sg') || url.includes('/sg/') || url.includes('singapore')) return 'Singapore';
  if (url.includes('.my') || url.includes('/my/') || url.includes('malaysia')) return 'Malaysia';
  if (url.includes('.au') || url.includes('australia')) return 'Australia';
  if (url.includes('.uk') || url.includes('.co.uk') || url.includes('united-kingdom')) return 'United Kingdom';
  if (url.includes('.in') || url.includes('india')) return 'India';
  if (url.includes('.hk') || url.includes('hongkong') || url.includes('hong-kong')) return 'Hong Kong';

  // 2. Try from document text
  const txt = (S.docxText || '').toLowerCase();
  const counts = {
    'Singapore': ['singapore','acra','iras','cpf','sgd','s$','pte ltd','uen ','singpass'].filter(s => txt.includes(s)).length,
    'Malaysia':  ['malaysia','malaysian','ringgit','rm ','bursa','ssm ','sdn bhd','lembaga'].filter(s => txt.includes(s)).length,
    'Australia': ['australia','australian','ato ','abn ','acn ','aud '].filter(s => txt.includes(s)).length,
    'India':     ['india','indian','rupee','inr ','gst india','pan card','aadhaar'].filter(s => txt.includes(s)).length,
  };
  const best = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
  if (best && best[1] >= 2) return best[0];

  // 3. Try from topic
  const topic = (S.topic || '').toLowerCase();
  if (topic.includes('singapore')) return 'Singapore';
  if (topic.includes('malaysia')) return 'Malaysia';

  // 4. Fallback — extract from URL domain
  try {
    const domain = new URL(S.pageUrl || 'https://x.com').hostname;
    if (domain.endsWith('.sg')) return 'Singapore';
    if (domain.endsWith('.my')) return 'Malaysia';
    if (domain.endsWith('.au')) return 'Australia';
    if (domain.endsWith('.in')) return 'India';
  } catch(e) {}

  return 'the target market';
}

/* ─── Extract company/brand from URL ─── */
function detectBrand() {
  try {
    const domain = new URL(S.pageUrl || '').hostname.replace('www.','');
    return domain.split('.')[0] || 'the company';
  } catch(e) { return 'the company'; }
}

/* ─── Doc preview for AI ─── */
function docPreview(chars = 5000) {
  if (!S.docxText) return '[No document uploaded]';
  return S.docxText.slice(0, chars);
}

function docWordCount() {
  return S.docxText ? S.docxText.split(/\s+/).filter(Boolean).length : 0;
}

function catLabel() {
  return { incorporation:'Company Incorporation/Registration', resources:'Resources/Guides/Compliance', services:'Professional Services', blogs:'Blog/Informational Content' }[S.category] || S.category;
}

function pageType() {
  return isSvc() ? 'SERVICE PAGE (commercial/transactional — people want to hire or buy)' : 'BLOG/GUIDE (informational + research intent)';
}

/* ════════════════════════════════
   KEYWORD PROMPT
════════════════════════════════ */
function pKw() {
  const market = detectMarket();
  const wc = docWordCount();
  return `You are an expert SEO strategist. Analyze the uploaded document and generate ACCURATE, SPECIFIC keywords.

DOCUMENT CONTENT (read this carefully — base keywords on actual content):
=== START ===
${docPreview(3000)}
=== END ===

TASK DETAILS:
- Topic: "${S.topic}"
- Category: ${catLabel()}
- Page Type: ${pageType()}
- Market/Country: ${market}
- Document Words: ${wc}
${S.pageUrl ? `- Page URL: ${S.pageUrl}` : ''}

KEYWORD RULES:
1. ALL keywords must be directly relevant to the ACTUAL document content above
2. Include "${market}" as location modifier where it makes sense
3. Volume = realistic for ${market} market (most terms: 100-5K/month)
4. Difficulty = reflect real competition (gov/authority sites often rank = High)
5. Primary: must match topic "${S.topic}" exactly
6. Secondary: sub-topics found in the document
7. LSI: semantically related terms actually used in the document

Return ONLY valid JSON — no markdown, no explanation:
{"keywords":[{"keyword":"...","type":"primary|secondary|lsi","volume":"100-1K","difficulty":"Low|Medium|High","intent":"Informational|Commercial|Transactional"}]}

Generate: 3 primary, 5 secondary, 6 LSI = 14 total.`;
}

/* ════════════════════════════════
   SERP PROMPT
════════════════════════════════ */
function pSERP() {
  const market = detectMarket();
  const brand = detectBrand();
  return `You are an SEO expert doing competitor analysis.

DOCUMENT CONTENT (understand what this page covers):
=== START ===
${docPreview(2000)}
=== END ===

TASK DETAILS:
- Topic: "${S.topic}"
- Market: ${market}
- Page Type: ${pageType()}
${S.pageUrl ? `- Analyzing for: ${S.pageUrl}` : ''}
- Brand/Site: ${brand}

Generate REALISTIC competitor analysis for "${S.topic}" in ${market}.

Think about who ACTUALLY ranks for this topic in ${market}:
- Official/government sites (highest authority)
- Professional services firms
- Industry associations
- News/media sites covering this topic

RULES:
- URLs must look realistic for ${market} (use correct country domains like .${market==='Malaysia'?'my':market==='Singapore'?'sg':market==='Australia'?'com.au':'com'})
- Word counts: gov pages 800-1500w, service pages 600-1000w, guides 1500-3000w
- content_gaps: SPECIFIC to this page's actual content weaknesses vs competitors
- recommended_sections: sections competitors have that this page LACKS

Return ONLY valid JSON:
{"serp_competitors":[{"rank":1,"title":"...","url":"...","word_count":1800,"sections":["Introduction","Services","Benefits","FAQ"],"has_faq":true,"has_table":true,"domain_authority":"High|Medium|Low"}],"top_topics":["key topic competitors cover"],"content_gaps":["specific gap: what's missing from current page vs competitors"],"word_count_target":${isSvc()?850:2600},"recommended_sections":["section name"]}

5 competitors. Be specific to "${S.topic}" in ${market}.`;
}

/* ════════════════════════════════
   AUDIT PROMPT
════════════════════════════════ */
function pAudit() {
  const wc = docWordCount();
  const market = detectMarket();
  const scoreBefore = Math.min(55, Math.max(10, Math.round(wc/60)));
  const scoreAfter  = Math.min(92, scoreBefore + 35);

  return `You are a senior SEO content auditor. Read the document below WORD FOR WORD and give an honest audit.

=== DOCUMENT START ===
${docPreview(4500)}
=== DOCUMENT END ===

AUDIT CONTEXT:
- Topic: "${S.topic}"
- Market: ${market}
- Page Type: ${isSvc() ? 'SERVICE PAGE' : 'BLOG/GUIDE'}
- Word Count: ${wc} words
${S.pageUrl ? `- URL: ${S.pageUrl}` : ''}

SCORING (BE BRUTALLY HONEST):
- score_before: actual quality score RIGHT NOW. ${wc < 300 ? 'Very thin content = 10-25.' : wc < 600 ? 'Short content = 20-40.' : wc < 1200 ? 'Medium content = 35-55.' : 'Decent content = 45-65.'}
- score_after: realistic improvement after optimization. Max +35 points.
- Base scores on WHAT YOU ACTUALLY SEE — not what could theoretically exist.

issues_fail: Real critical problems you spotted in the text above
issues_warn: Minor issues you noticed  
issues_pass: Things actually done correctly

Return ONLY valid JSON:
{"score_before":${scoreBefore},"score_after":${scoreAfter},"word_count_before":${wc},"word_count_after":${isSvc()?850:2600},"score_breakdown":{"Content Depth":${Math.min(60,Math.round(wc/20))},"Keyword Usage":25,"Content Freshness":30,"Structure / UX":35,"E-E-A-T Signals":20,"CTA / Conversion":15},"issues_fail":[{"label":"...","detail":"specific issue found in the actual text"}],"issues_warn":[{"label":"...","detail":"..."}],"issues_pass":[{"label":"...","detail":"..."}]}`;
}

/* ════════════════════════════════
   OPTIMIZATION PROMPT
════════════════════════════════ */
function pOpt(kw, serp, audit) {
  const checkedOpts = getOpts();
  const extra = (document.getElementById('extra-inst')?.value || '').trim();
  const isSv = isSvc();
  const market = detectMarket();
  const brand = detectBrand();
  const year = new Date().getFullYear();
  const wc = docWordCount();

  /* Build site base URL for internal links */
  let siteBase = '';
  try { siteBase = new URL(S.pageUrl || '').origin; } catch(e) {}

  /* Rules for each checked option */
  const optRules = [];
  if (checkedOpts.includes('keywords'))
    optRules.push(`KEYWORDS: Naturally weave researched keywords into content. Primary keyword in H1 and first H2. Secondary in body H2s. LSI throughout paragraphs. Target keyword density 1-2%.`);
  if (checkedOpts.includes('meta'))
    optRules.push(`META: Write meta_title (max 60 chars, include primary keyword + "${market}") and meta_description (150-160 chars, action-oriented, include a benefit).`);
  if (checkedOpts.includes('headings'))
    optRules.push(`HEADINGS: Strict H1 > H2 > H3 hierarchy. ONE H1 only. Each H2 covers a distinct subtopic. Include keywords naturally in headings.`);
  if (checkedOpts.includes('toc') && !isSv)
    optRules.push(`TABLE OF CONTENTS: Add immediately after H1:\n<div class="toc-box"><h4>📋 Table of Contents</h4><ol><li><a href="#section1">Section Name</a></li>...</ol></div>`);
  if (checkedOpts.includes('freshness'))
    optRules.push(`FRESHNESS: Update all stats, fees, thresholds to ${year}. Verify all regulatory figures are current for ${market}. Add "${year}" to relevant headings.`);
  if (checkedOpts.includes('serp'))
    optRules.push(`SERP GAPS: Add the missing sections identified in SERP analysis. Cover topics competitors rank for that this page currently misses.`);
  if (checkedOpts.includes('faq') && !isSv)
    optRules.push(`FAQ SECTION: Add at end with minimum 6 Q&As relevant to "${S.topic}":\n<div class="faq-item"><div class="faq-q">Question?</div><div class="faq-a">Detailed answer...</div></div>`);
  if (checkedOpts.includes('cta'))
    optRules.push(`CTAs: Add MINIMUM 3 CTA boxes throughout content using class "tool-cta". Space them: after intro, mid-content, end. Make them action-oriented with specific benefit.`);
  if (checkedOpts.includes('eeat'))
    optRules.push(`E-E-A-T: Add specific credentials, cite official ${market} regulations by name, include statistics with sources, mention years of experience, certifications.`);
  if (checkedOpts.includes('schema'))
    optRules.push(`SCHEMA: Add JSON-LD at bottom:\n<script type="application/ld+json">{ "@context":"https://schema.org", "@type":"${isSv?'Service':'Article'}", ... }</script>`);
  if (checkedOpts.includes('interlinking') && isSv)
    optRules.push(`INTERNAL LINKS (CRITICAL FOR SERVICE PAGES): Add MINIMUM 8 internal links throughout content. Use natural anchor text. Link to related services, blog posts, guides.${siteBase ? ` Base URL: ${siteBase}` : ''} Format: <a href="${siteBase}/relevant-page/">anchor text</a>. Place links where they add value — inside paragraphs, in a "Related Services" section, and in CTAs.`);
  if (checkedOpts.includes('service_promo') && isSv)
    optRules.push(`SERVICE PROMOTION: Add a dedicated "Why Choose ${brand.charAt(0).toUpperCase()+brand.slice(1)}" section. Highlight unique value propositions, what makes the service different, specific benefits the client gets.`);
  if (checkedOpts.includes('service_explain') && isSv)
    optRules.push(`SUB-SERVICES: Give each service/feature its OWN H3 heading with 2-3 sentences explaining: what it is, what's included, the benefit to client.`);
  if (checkedOpts.includes('readability'))
    optRules.push(`READABILITY: Max 20 words per sentence. Use bullet lists for 3+ items. Short paragraphs (3-4 sentences max). Use bold for key terms. Add subheadings every 150-200 words.`);
  if (checkedOpts.includes('images'))
    optRules.push(`IMAGE SUGGESTIONS: Add <!-- Image: [specific alt text description] --> comments at 3-4 visual break points.`);
  if (checkedOpts.includes('pricing') && isSv)
    optRules.push(`PRICING: Add a pricing section or table. If exact prices aren't known, use "Starting from..." or "Contact us for a quote" with what's included at each tier.`);
  if (checkedOpts.includes('trust_signals') && isSv)
    optRules.push(`TRUST SIGNALS: Add specific trust elements: years established, number of clients served, certifications/memberships, awards. Make them specific and verifiable.`);

  const contentTarget = isSv
    ? `SERVICE PAGE CONTENT TARGET:
- MINIMUM 800 words, ideally 900-1000 words. DO NOT produce less than 800 words.
- Structure: Intro (100w) → What We Offer (200w) → Each Sub-Service with H3 (300w) → Why Choose Us (150w) → CTA sections
- NO Table of Contents on service pages
- Every H3 sub-service section needs: what it is + what's included + client benefit`
    : `BLOG/GUIDE CONTENT TARGET:
- MINIMUM 2200 words, ideally 2500-2800 words. DO NOT produce less than 2200 words.
- Structure: Intro → TOC → Multiple H2 sections (400-500w each) → Comparison table → FAQ → Conclusion
- Must include at least ONE HTML comparison <table>
- Comprehensive coverage — answer every question a reader might have`;

  const colorRules = `COLOR-CODING RULES (follow exactly):
- <div class="new-block">NEW CONTENT</div> = content you're ADDING (shown GREEN)
- <div class="remove-block">OLD CONTENT</div> = content to DELETE (shown RED strikethrough)  
- Content with NO wrapper = existing content KEPT AS-IS (shown white/normal)
- <span class="new-inline">word</span> = inline addition
- <span class="remove-inline">word</span> = inline deletion

IMPORTANT: Most content should be unwrapped (kept). Only genuinely new additions get new-block. Only deletions get remove-block. Do NOT wrap everything in new-block.`;

  const instBlock = extra
    ? `\nUSER ADDITIONAL INSTRUCTIONS (MANDATORY — must action all of these):\n"${extra}"\n\nAction every instruction above AND add "instructions_response" to JSON explaining what you changed.`
    : '';

  return `You are a senior SEO content strategist. Produce a COMPLETE, THOROUGH optimization of the document below.

═══ ORIGINAL DOCUMENT ═══
${docPreview(5500)}
═══ END DOCUMENT ═══

CONTEXT:
- Topic: "${S.topic}"
- Category: ${S.category} → ${isSv ? 'SERVICE PAGE' : 'BLOG/GUIDE'}
- Market: ${market}
- Brand/Site: ${brand}${siteBase ? ` (${siteBase})` : ''}
- Year: ${year}
${S.pageUrl ? `- Page URL: ${S.pageUrl}` : ''}

KEYWORD DATA:
${kw}

SERP ANALYSIS:
${serp}

SEO AUDIT:
${audit}

CHECKED OPTIMIZATION GOALS — apply EVERY one of these:
${checkedOpts.length ? checkedOpts.join(', ') : 'general optimization'}

DETAILED RULES FOR EACH GOAL:
${optRules.length ? optRules.join('\n\n') : 'Apply general SEO best practices.'}

${contentTarget}

${colorRules}

QUALITY NON-NEGOTIABLES:
- Write professional, natural English — no keyword stuffing
- All data must be accurate for ${market} as of ${year}
- Internal links must use real URL patterns from the actual site${siteBase ? ` (${siteBase})` : ''}
- Do NOT repeat the same keyword more than 3× in close proximity
- Content must genuinely help the reader — not just tick SEO boxes
- optimized_html must be COMPLETE — include the FULL page content, not excerpts
${instBlock}

OUTPUT — Return ONLY valid JSON, absolutely no markdown code fences:
{
  "meta_title": "max 60 chars, primary keyword + ${market}",
  "meta_description": "150-160 chars, benefit-focused",
  "url_slug": "/url-slug/",
  "h1": "primary H1 heading",
  "optimized_html": "THE COMPLETE OPTIMIZED HTML — full page, all sections, color-coded",
  "changes_added": [{"title":"what was added","detail":"SEO reason"}],
  "changes_removed": [{"title":"what removed","detail":"why removed"}]${extra ? `,\n  "instructions_response": "detailed explanation of what you changed per user instructions"` : ''}
}`;
}

/* ══════════════════════════════════════════
   EDITABLE PROMPT MODAL SYSTEM
══════════════════════════════════════════ */
if (!window.promptOverrides) window.promptOverrides = {};

function openPromptEditor(key, label, promptText) {
  const modal = document.getElementById('prompt-modal');
  document.getElementById('pm-title').textContent = '✏️ Edit: ' + label;
  document.getElementById('pm-textarea').value = promptText;

  document.getElementById('pm-save').onclick = () => {
    window.promptOverrides[key] = document.getElementById('pm-textarea').value;
    modal.style.display = 'none';
    showToast('✅ Custom prompt saved for this session');
    refreshPromptPanel();
  };
  document.getElementById('pm-reset').onclick = () => {
    delete window.promptOverrides[key];
    modal.style.display = 'none';
    showToast('↩ Prompt reset to auto-generated default');
    refreshPromptPanel();
  };
  document.getElementById('pm-close').onclick = () => { modal.style.display = 'none'; };
  modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
  modal.style.display = 'flex';
}

function getPromptText(key) {
  if (window.promptOverrides[key]) return window.promptOverrides[key];
  return { kw: pKw, serp: pSERP, audit: pAudit }[key]?.() || '';
}

function refreshPromptPanel() {
  const panel = document.getElementById('prompt-editor-panel');
  if (!panel || panel.style.display === 'none') return;
  showAllPromptEditors();
}

function showAllPromptEditors() {
  const panel = document.getElementById('prompt-editor-panel');
  const btn = document.getElementById('btn-toggle-prompts');
  if (panel.style.display !== 'none') {
    panel.style.display = 'none';
    btn.textContent = '👁 Preview & Edit AI Prompts';
    return;
  }
  const prompts = [
    { key: 'kw',   label: '🔑 Keyword Research' },
    { key: 'serp', label: '📊 SERP Analysis' },
    { key: 'audit',label: '🔍 SEO Audit' },
  ];
  panel.innerHTML = prompts.map(p => {
    const isEdited = !!window.promptOverrides[p.key];
    const preview = getPromptText(p.key).slice(0, 160).replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return `<div class="prompt-preview-item">
      <div class="pp-header">
        <span class="pp-label">${isEdited ? '<span style="color:#c87000;">✏️ [CUSTOM]</span> ' : ''}${p.label}</span>
        <button class="btn-edit-prompt" onclick="openPromptEditor('${p.key}','${p.label}',getPromptText('${p.key}'))">Edit Prompt</button>
        ${isEdited ? `<button class="btn-reset-prompt" onclick="delete window.promptOverrides['${p.key}'];refreshPromptPanel();showToast('Reset to default')">↩ Reset</button>` : ''}
      </div>
      <div class="pp-preview">${preview}…</div>
    </div>`;
  }).join('');
  panel.style.display = 'block';
  btn.textContent = '🙈 Hide Prompts';
}

function resetPrompt(key) {
  delete window.promptOverrides[key];
  showToast('Reset to default');
  refreshPromptPanel();
}

function showToast(msg) {
  let t = document.getElementById('toast-msg');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast-msg';
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#0d2b6e;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.3);transition:opacity .3s;pointer-events:none;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._to);
  t._to = setTimeout(() => { t.style.opacity = '0'; }, 3000);
}
