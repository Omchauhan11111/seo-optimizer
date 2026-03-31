/* ══════════════════════════════════════════
   PROMPT BUILDERS — v4.0
   Stronger, More Accurate, More Content
══════════════════════════════════════════ */

const isSvc = () => S.category === 'services';

/* ─── Extract market/country from URL and doc ─── */
function detectMarket() {
  const url = (S.pageUrl || '').toLowerCase();
  if (url.includes('.sg') || url.includes('/sg/') || url.includes('singapore')) return 'Singapore';
  if (url.includes('.my') || url.includes('/my/') || url.includes('malaysia')) return 'Malaysia';
  if (url.includes('.au') || url.includes('australia')) return 'Australia';
  if (url.includes('.uk') || url.includes('.co.uk') || url.includes('united-kingdom')) return 'United Kingdom';
  if (url.includes('.in') || url.includes('india')) return 'India';
  if (url.includes('.hk') || url.includes('hongkong') || url.includes('hong-kong')) return 'Hong Kong';

  const txt = (S.docxText || '').toLowerCase();
  const counts = {
    'Singapore': ['singapore','acra','iras','cpf','sgd','s$','pte ltd','uen ','singpass'].filter(s => txt.includes(s)).length,
    'Malaysia':  ['malaysia','malaysian','ringgit','rm ','bursa','ssm ','sdn bhd','lembaga'].filter(s => txt.includes(s)).length,
    'Australia': ['australia','australian','ato ','abn ','acn ','aud '].filter(s => txt.includes(s)).length,
    'India':     ['india','indian','rupee','inr ','gst india','pan card','aadhaar'].filter(s => txt.includes(s)).length,
  };
  const best = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
  if (best && best[1] >= 2) return best[0];

  const topic = (S.topic || '').toLowerCase();
  if (topic.includes('singapore')) return 'Singapore';
  if (topic.includes('malaysia')) return 'Malaysia';

  try {
    const domain = new URL(S.pageUrl || 'https://x.com').hostname;
    if (domain.endsWith('.sg')) return 'Singapore';
    if (domain.endsWith('.my')) return 'Malaysia';
    if (domain.endsWith('.au')) return 'Australia';
    if (domain.endsWith('.in')) return 'India';
  } catch(e) {}

  return 'Singapore';
}

/* ─── Extract company/brand from URL ─── */
function detectBrand() {
  try {
    const domain = new URL(S.pageUrl || '').hostname.replace('www.','');
    return domain.split('.')[0] || 'the company';
  } catch(e) { return 'the company'; }
}

/* ─── Doc preview for AI ─── */
function docPreview(chars = 6000) {
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
   1. KEYWORD RESEARCH PROMPT
   Goal: Accurate, document-driven,
   market-specific keywords only
════════════════════════════════ */
function pKw() {
  const market = detectMarket();
  const wc = docWordCount();
  return `You are a specialist SEO keyword researcher with deep knowledge of the ${market} market.

YOUR TASK: Analyze the document below and extract REAL, ACCURATE keywords that people in ${market} actually search for.

═══ DOCUMENT CONTENT ═══
${docPreview(4000)}
═══ END ═══

TOPIC: "${S.topic}"
CATEGORY: ${catLabel()}
PAGE TYPE: ${pageType()}
MARKET: ${market}
DOCUMENT WORD COUNT: ${wc}
${S.pageUrl ? `PAGE URL: ${S.pageUrl}` : ''}

STRICT RULES — follow every one:

1. ONLY output keywords directly relevant to the ACTUAL document content above. Do NOT invent keywords not supported by the text.
2. Every keyword must include "${market}" as a geo-modifier where it makes natural sense (e.g. "company incorporation Singapore", "ACRA registration Singapore").
3. Volume must be REALISTIC for ${market}. Singapore/HK = small market (most terms 50–2,000/mo). Do NOT write "10K–100K" for niche B2B terms.
4. Difficulty must reflect ACTUAL competition. Government sites (MOM, ACRA, IRAS, SSM) dominate → "High". Mid-tier guides → "Medium". Long-tail → "Low".
5. PRIMARY keywords (3): Must exactly match the core intent of "${S.topic}". These are the exact phrases someone types when looking for this topic.
6. SECONDARY keywords (5): Sub-topics or variations found inside the document. Each must be a real search phrase.
7. LSI keywords (6): Semantically related terms that appear naturally in the document (e.g. regulatory body names, process steps, official form names).
8. Intent mapping:
   - "Informational" = how-to, what-is, guide
   - "Commercial" = compare, best, review
   - "Transactional" = hire, buy, register, apply, get quote

Return ONLY valid JSON — no markdown fences, no explanation, no extra text:
{"keywords":[{"keyword":"exact search phrase","type":"primary|secondary|lsi","volume":"50-500","difficulty":"Low|Medium|High","intent":"Informational|Commercial|Transactional"}]}

Output exactly: 3 primary + 5 secondary + 6 LSI = 14 total keywords.`;
}

/* ════════════════════════════════
   2. SERP ANALYSIS PROMPT
   Goal: Realistic competitors,
   real gaps, actionable data
════════════════════════════════ */
function pSERP() {
  const market = detectMarket();
  const brand = detectBrand();
  const tld = market==='Malaysia'?'my':market==='Singapore'?'sg':market==='Australia'?'com.au':market==='India'?'in':'com';

  return `You are an expert SEO analyst. Your job is to simulate a realistic SERP analysis for "${S.topic}" in ${market}.

DOCUMENT CONTENT (understand what THIS page covers):
═══ START ═══
${docPreview(2500)}
═══ END ═══

TOPIC: "${S.topic}"
MARKET: ${market}
PAGE TYPE: ${pageType()}
${S.pageUrl ? `ANALYZING FOR: ${S.pageUrl}` : ''}
SITE/BRAND: ${brand}

THINK CAREFULLY about who ACTUALLY ranks for "${S.topic}" in ${market}:
- Official government sites: ACRA.gov.sg, MOM.gov.sg, IRAS.gov.sg, SSM.com.my, etc. (ALWAYS rank #1–2 for regulatory topics)
- Established professional firms: Big 4, top law firms, major accounting firms in ${market}
- Industry associations & chambers of commerce
- High-authority news/media: StraitsTimes, BusinessTimes, Channel NewsAsia (SG), TheEdge (MY)
- Direct competitors similar to ${brand}

RULES FOR REALISTIC OUTPUT:
- Competitor URLs must use REAL domain patterns for ${market} (e.g. .${tld} domains, known brand names)
- Word counts: Government pages 800–1,500w | Service pages 700–1,200w | Comprehensive guides 2,000–4,000w
- content_gaps must be SPECIFIC to what is MISSING from the document above vs what competitors likely cover
- recommended_sections must be sections that would genuinely improve this specific page
- word_count_target: ${isSvc() ? 'Service page = 900–1,100 words' : 'Blog/Guide = 2,500–3,200 words'}
- Do NOT fabricate completely random URLs — use realistic brand names known in ${market}

Return ONLY valid JSON — no markdown, no explanation:
{
  "serp_competitors": [
    {
      "rank": 1,
      "title": "realistic page title",
      "url": "https://realisticdomain.${tld}/realistic-page/",
      "word_count": 2200,
      "sections": ["Introduction", "What is X", "Requirements", "Process Steps", "Costs", "FAQ"],
      "has_faq": true,
      "has_table": true,
      "domain_authority": "High|Medium|Low"
    }
  ],
  "top_topics": [
    "specific topic competitors cover that's relevant to ${S.topic}"
  ],
  "content_gaps": [
    "SPECIFIC gap: exact thing missing from current page that competitors cover"
  ],
  "word_count_target": ${isSvc() ? 1000 : 2800},
  "recommended_sections": [
    "Section name: why it's needed"
  ]
}

Output 5 competitors, 6 top_topics, 6 content_gaps, 5 recommended_sections. Be SPECIFIC to "${S.topic}" in ${market}.`;
}

/* ════════════════════════════════
   3. SEO AUDIT PROMPT
   Goal: Honest, document-specific,
   actionable audit findings
════════════════════════════════ */
function pAudit() {
  const wc = docWordCount();
  const market = detectMarket();
  const scoreBefore = Math.min(52, Math.max(8, Math.round(wc/65)));
  const scoreAfter  = Math.min(90, scoreBefore + 33);

  return `You are a senior SEO content auditor. Read the ENTIRE document below carefully and produce an HONEST, SPECIFIC audit.

═══ DOCUMENT — READ EVERY WORD ═══
${docPreview(5000)}
═══ END DOCUMENT ═══

AUDIT CONTEXT:
- Topic: "${S.topic}"
- Market: ${market}
- Page Type: ${isSvc() ? 'SERVICE PAGE' : 'BLOG/GUIDE'}
- Current Word Count: ${wc} words
${S.pageUrl ? `- URL: ${S.pageUrl}` : ''}

SCORING GUIDE — be brutally honest based on what you actually read:
- score_before: ${wc < 300 ? 'Very thin content = score 8–20' : wc < 600 ? 'Short content = score 18–35' : wc < 1200 ? 'Medium content = score 32–52' : wc < 2000 ? 'Decent content = score 45–62' : 'Good length but check quality = score 50–68'}
- score_after: realistic after full optimization. Max +35 points improvement.
- score_breakdown: score each dimension 0–100 based on WHAT YOU ACTUALLY SEE in the text.

issues_fail: CRITICAL problems you found in the text (missing H1, no keywords visible, no structure, outdated data, thin content, no CTA). Be specific — name the actual problem.
issues_warn: Real warnings based on what you read (keyword appears only once, no internal links, no data sources cited, weak intro).
issues_pass: Things genuinely done well in the document. Do not fabricate — only list if truly present.

Return ONLY valid JSON:
{
  "score_before": ${scoreBefore},
  "score_after": ${scoreAfter},
  "word_count_before": ${wc},
  "word_count_after": ${isSvc() ? 1000 : 2800},
  "score_breakdown": {
    "Content Depth": 0,
    "Keyword Usage": 0,
    "Content Freshness": 0,
    "Structure / UX": 0,
    "E-E-A-T Signals": 0,
    "CTA / Conversion": 0
  },
  "issues_fail": [{"label": "specific issue name", "detail": "exactly what is wrong and where"}],
  "issues_warn": [{"label": "warning name", "detail": "specific detail"}],
  "issues_pass": [{"label": "what's good", "detail": "specific detail of what works"}]
}`;
}

/* ════════════════════════════════
   4. FINAL OPTIMIZATION PROMPT
   Goal: Maximum content, accurate,
   specific, deeply detailed output
════════════════════════════════ */
function pOpt(kw, serp, audit) {
  const checkedOpts = getOpts();
  const extra = (document.getElementById('extra-inst')?.value || '').trim();
  const isSv = isSvc();
  const market = detectMarket();
  const brand = detectBrand();
  const year = new Date().getFullYear();
  const wc = docWordCount();

  let siteBase = '';
  try { siteBase = new URL(S.pageUrl || '').origin; } catch(e) {}

  /* Per-option detailed rules */
  const optRules = [];

  if (checkedOpts.includes('keywords'))
    optRules.push(`KEYWORD INTEGRATION — MANDATORY:
• Primary keyword must appear in: H1, first paragraph (within first 50 words), at least 2 H2s, meta title.
• Secondary keywords: each must appear at least once in a H2 or body paragraph.
• LSI keywords: spread naturally throughout — minimum 1 per 300 words.
• Target density: 1–2% for primary keyword. NEVER stuff. Read naturally.
• Bold the primary keyword on FIRST occurrence in the body.`);

  if (checkedOpts.includes('meta'))
    optRules.push(`META TAGS — MANDATORY:
• meta_title: Exactly 50–60 characters. Format: [Primary Keyword] in ${market} | [Brand] OR [Year] [Primary Keyword] Guide | [Brand]. MUST include primary keyword near the start.
• meta_description: Exactly 145–158 characters. Start with an action verb. Include primary keyword, a specific benefit, and a soft CTA (e.g. "Learn more", "Get started"). Never truncate mid-sentence.`);

  if (checkedOpts.includes('headings'))
    optRules.push(`HEADING STRUCTURE — MANDATORY:
• EXACTLY one H1 — the main page title, contains primary keyword.
• H2s: minimum 5 for blog, minimum 3 for service page. Each covers a distinct subtopic. Include secondary keywords.
• H3s: sub-sections under H2s. Use for steps, features, sub-services.
• H4s: optional deep sub-sections or FAQ questions.
• NO heading should be a duplicate. NO heading should be a single word.`);

  if (checkedOpts.includes('toc') && !isSv)
    optRules.push(`TABLE OF CONTENTS — MANDATORY for blog/guide:
Place immediately after H1 and intro paragraph. List ALL H2 sections with anchor links.
Format:
<div class="toc-box">
  <h4>📋 Table of Contents</h4>
  <ol>
    <li><a href="#section-id">Section Title</a></li>
    <!-- one entry per H2 -->
  </ol>
</div>
Add id="section-id" to each corresponding H2 tag.`);

  if (checkedOpts.includes('freshness'))
    optRules.push(`CONTENT FRESHNESS — MANDATORY:
• Replace ALL year references with ${year} where relevant.
• Update any fee/cost figures to current ${year} rates (ACRA fees, MOM fees, government charges, etc.).
• Add "Updated ${year}" badge in meta strip or intro.
• Replace phrases like "recently" or "in recent years" with specific "${year}" references.
• Verify all regulatory body names and processes are current.`);

  if (checkedOpts.includes('serp'))
    optRules.push(`SERP GAP COVERAGE — MANDATORY:
Based on the SERP analysis provided, add EVERY missing section that competitors rank for. These must be FULLY WRITTEN new sections — not placeholder headings. Each gap section needs minimum 150 words with real, specific content.`);

  if (checkedOpts.includes('faq') && !isSv)
    optRules.push(`FAQ SECTION — MANDATORY:
Add minimum 7 FAQs at the end. Questions must be REAL queries people search (use keyword data). Answers must be detailed — minimum 3 sentences each, specific to ${market}.
Format each FAQ:
<div class="faq-item">
  <div class="faq-q">What is the exact question someone would search?</div>
  <div class="faq-a">Detailed, specific answer with accurate ${market} information. Include official body names, real figures, step-by-step if needed. Minimum 3 sentences.</div>
</div>`);

  if (checkedOpts.includes('cta'))
    optRules.push(`CTAs — MANDATORY:
Add exactly 3 CTA boxes: (1) After intro section, (2) After the midpoint H2, (3) At page end.
Each CTA must be unique — different headline, different benefit statement, different button text.
Use class "tool-cta" for inline CTAs, "bottom-cta" for final CTA.
Make CTAs specific to the service/topic — NOT generic "Contact us".`);

  if (checkedOpts.includes('eeat'))
    optRules.push(`E-E-A-T SIGNALS — MANDATORY:
• Cite real ${market} regulatory bodies by official name (e.g. ACRA, IRAS, MOM, SSM, LHDN).
• Reference specific official acts, regulations, or guidelines by name.
• Add specific statistics with source attribution (even if estimated — label it).
• Include trust indicators: years the company has operated, number of clients, awards, certifications.
• Add author expertise signals in intro (e.g. "Our team of licensed professionals with X years...").`);

  if (checkedOpts.includes('schema'))
    optRules.push(`SCHEMA MARKUP:
Add at the very end of optimized_html:
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "${isSv ? 'Service' : 'Article'}",
  "name": "[page title]",
  "description": "[meta description]",
  "provider": {"@type": "Organization", "name": "${brand}"}
}
</script>`);

  if (checkedOpts.includes('interlinking') && isSv)
    optRules.push(`INTERNAL LINKS — CRITICAL FOR SERVICE PAGES:
Add MINIMUM 10 internal links. Spread them naturally — do NOT dump all at end.
• 3–4 links inside body paragraphs (anchor text = keyword-rich)
• 2–3 links in a dedicated "Related Services" section
• 2 links inside CTA boxes
• 1–2 links in FAQ answers
${siteBase ? `Base URL: ${siteBase}` : ''}
Format: <a href="${siteBase || 'https://yoursite.com'}/relevant-page-slug/">descriptive anchor text</a>
Each anchor text must be descriptive and different — NOT "click here" or "read more".`);

  if (checkedOpts.includes('service_promo') && isSv)
    optRules.push(`SERVICE PROMOTION — MANDATORY:
Add a "Why Choose ${brand.charAt(0).toUpperCase()+brand.slice(1)}" section with MINIMUM 6 specific differentiators. Each differentiator needs:
• A bold heading (what makes it special)
• 2–3 sentences explaining the specific benefit to the client
• A concrete claim (years, numbers, stats, guarantees)`);

  if (checkedOpts.includes('service_explain') && isSv)
    optRules.push(`SUB-SERVICE BREAKDOWN — MANDATORY:
For EACH sub-service or feature, create an H3 section containing:
• What exactly is included in this sub-service
• Who needs it and why
• The specific benefit/outcome the client gets
• Any relevant ${market} regulatory context
Minimum 100 words per sub-service section.`);

  if (checkedOpts.includes('readability'))
    optRules.push(`READABILITY — MANDATORY:
• Maximum sentence length: 22 words. Split longer sentences.
• Paragraph max: 4 sentences. Add line break after every paragraph.
• Use bullet lists for any group of 3+ items.
• Bold key terms on first use. Bold important numbers and facts.
• Add a subheading (H3 or H4) every 200 words in long sections.
• Use transition phrases between sections ("Now that you understand X, let's look at Y...").`);

  if (checkedOpts.includes('images'))
    optRules.push(`IMAGE PLACEHOLDERS:
Add <!-- IMAGE: [exact alt text description] --> comments at 4 strategic locations:
1. After H1 (hero image — describe the scene/infographic)
2. Before a key process/steps section (diagram or flowchart idea)
3. Inside a comparison table section (screenshot or chart idea)
4. Near FAQ or conclusion (team photo or office/credentials)`);

  if (checkedOpts.includes('pricing') && isSv)
    optRules.push(`PRICING SECTION — MANDATORY:
Add a clear pricing section with an HTML table. Include:
• Package/tier names
• What's included in each
• Price range (if known) OR "From SGD/MYR X" OR "Custom quote"
• A note on what factors affect pricing
• A CTA to request a quote`);

  if (checkedOpts.includes('trust_signals') && isSv)
    optRules.push(`TRUST SIGNALS — MANDATORY:
Add a dedicated trust section with REAL, SPECIFIC claims:
• How many years the firm has been operating
• Approximate number of clients or incorporations handled
• Professional memberships (ICPAS, ISCA, Law Society, etc.)
• Awards or recognition (if known)
• Regulatory compliance (PDPA, MAS-regulated, etc.)
Use <div class="adv-grid"> cards for visual presentation.`);

  /* ── Content volume & structure targets ── */
  const contentTarget = isSv
    ? `═══ SERVICE PAGE — MANDATORY CONTENT REQUIREMENTS ═══

MINIMUM LENGTH: 1,000 words. IDEAL: 1,100–1,300 words. DO NOT output less than 1,000 words under any circumstance.

REQUIRED STRUCTURE (follow in order):
1. H1 — Keyword-rich page title [1 heading]
2. Intro paragraph — 80–100 words. Hook + what the service does + who it's for. Bold the primary keyword.
3. "What We Offer" H2 — Overview of all sub-services (150–200 words)
4. Individual Sub-Service H3s — ONE H3 per sub-service, 100–150 words each. Minimum 4 sub-services.
5. CTA Box #1 — Mid-page conversion
6. "Why Choose ${brand.charAt(0).toUpperCase()+brand.slice(1)}" H2 — 6 differentiators, 200–250 words
7. Process / How It Works H2 — Step-by-step numbered list (5–7 steps), 150–200 words
8. Pricing H2 (if pricing option checked) — table format
9. CTA Box #2
10. FAQ H2 — minimum 5 Q&As specific to this service in ${market}
11. CTA Box #3 / Bottom CTA

ABSOLUTE RULES:
• NO Table of Contents on service pages
• Every section must be FULLY written — no placeholder text
• Every H3 must have real, specific content about that sub-service`

    : `═══ BLOG/GUIDE — MANDATORY CONTENT REQUIREMENTS ═══

MINIMUM LENGTH: 2,800 words. IDEAL: 3,000–3,500 words. DO NOT output less than 2,800 words under any circumstance.

REQUIRED STRUCTURE (follow in order):
1. H1 — Keyword-rich, compelling title [1 heading]
2. Meta strip — <div class="meta-strip"> with author, date badge "${year}", reading time
3. Intro — 150–200 words. State EXACTLY what the reader will learn. Include primary keyword in first 50 words. Bold key phrase.
4. TOC Box — linked table of contents for all H2s
5. CTA Box #1 — after intro
6. H2 Section 1: Background/Overview — 300–400 words, include one callout box with key fact
7. H2 Section 2: Requirements/Eligibility/Types — 300–400 words, include bullet list of requirements
8. H2 Section 3: Step-by-Step Process — 350–450 words, use <ol class="steps"> numbered list
9. H2 Section 4: Costs/Fees/Timeline — 250–350 words, MUST include HTML comparison <table>
10. H2 Section 5: Key Considerations/Common Mistakes — 250–300 words
11. CTA Box #2 — mid-content
12. H2 Section 6: [Topic]-Specific Section from SERP gaps — 250–350 words
13. H2 Section 7: Comparison or Advanced Tips — 200–300 words, use <div class="adv-grid"> cards
14. FAQ Section — minimum 7 FAQs, 3+ sentences each
15. H2 Conclusion — 150–200 words, summarize key points, link to related guides
16. Bottom CTA

ABSOLUTE RULES:
• EVERY section must be FULLY written — 0 placeholder text allowed
• At least 2 HTML tables (comparison/cost/timeline data)
• At least 1 callout box (<div class="callout callout-blue"> or callout-green)
• At least 1 adv-grid cards section
• All ${market} facts, fees, regulatory references must be accurate as of ${year}
• Minimum 7 FAQs with 3+ sentence answers each`;

  /* ── Color coding rules ── */
  const colorRules = `═══ COLOR-CODING RULES — FOLLOW EXACTLY ═══

The output shows changes vs the original document:
• <div class="new-block"> ... </div> → Content you are ADDING (renders GREEN)
• <div class="remove-block"> ... </div> → Existing content to DELETE (renders RED with strikethrough)
• Content with NO wrapper → Existing content KEPT AS-IS (renders normal/white)
• <span class="new-inline">word</span> → Single inline addition within kept paragraph
• <span class="remove-inline">word</span> → Single inline deletion within kept paragraph

CRITICAL: Most content should be unwrapped (kept as-is). Only wrap:
- Genuinely NEW sections you are adding → new-block
- Content from original that should be DELETED → remove-block
Do NOT wrap everything in new-block. Do NOT wrap kept content.`;

  const instBlock = extra
    ? `\n═══ USER ADDITIONAL INSTRUCTIONS — MANDATORY ═══\n"${extra}"\n\nYou MUST action every instruction above. Add "instructions_response" to JSON output explaining point-by-point what you changed for each instruction.`
    : '';

  return `You are a world-class SEO content strategist specialising in ${market} business content. Your job is to produce the MOST COMPLETE, ACCURATE, and USEFUL optimization of the document below.

═══ ORIGINAL DOCUMENT — READ IN FULL ═══
${docPreview(6000)}
═══ END ORIGINAL DOCUMENT ═══

OPTIMIZATION CONTEXT:
- Topic: "${S.topic}"
- Category: ${S.category} → ${isSv ? 'SERVICE PAGE' : 'BLOG/GUIDE'}
- Market: ${market}
- Brand/Site: ${brand}${siteBase ? ` (${siteBase})` : ''}
- Year: ${year}
- Original Word Count: ${wc} words
${S.pageUrl ? `- Page URL: ${S.pageUrl}` : ''}

═══ KEYWORD DATA (use these throughout) ═══
${kw}

═══ SERP ANALYSIS (fill these content gaps) ═══
${serp}

═══ SEO AUDIT (fix every issue listed) ═══
${audit}

═══ CHECKED OPTIMIZATION GOALS — APPLY ALL ═══
${checkedOpts.length ? checkedOpts.join(', ') : 'full general optimization'}

═══ DETAILED RULES PER GOAL ═══
${optRules.length ? optRules.join('\n\n') : 'Apply all SEO best practices at maximum quality.'}

${contentTarget}

${colorRules}

${instBlock}

═══ NON-NEGOTIABLE QUALITY STANDARDS ═══
1. optimized_html MUST contain the COMPLETE page — every section fully written. No "..." or placeholder text. No truncation.
2. All ${market} facts, government body names, fee amounts, regulatory references must be ACCURATE as of ${year}.
3. Internal links must use real URL patterns from ${siteBase || 'the actual site domain'}.
4. Primary keyword must NOT appear more than once per 150 words (avoid stuffing).
5. Every paragraph must add genuine value to the reader — not just repeat other paragraphs.
6. Sentences must flow naturally. Read it back — would a real professional be proud of this?
7. changes_added must list EVERY major change with a specific SEO reason.
8. The output content should be so thorough and helpful that a reader has NO reason to visit a competitor page.

FINAL INSTRUCTION: Write as if you are the best SEO copywriter in ${market}. The content must be the single most useful, accurate, and complete resource on "${S.topic}" available online.

Return ONLY valid JSON — absolutely no markdown fences, no preamble, no explanation:
{
  "meta_title": "50–60 chars — primary keyword near start + ${market}",
  "meta_description": "145–158 chars — action verb start, primary keyword, specific benefit, soft CTA",
  "url_slug": "/seo-optimized-url-slug/",
  "h1": "compelling H1 with primary keyword",
  "optimized_html": "THE COMPLETE OPTIMIZED HTML PAGE — all sections fully written, color-coded, minimum ${isSv ? 1000 : 2800} words",
  "changes_added": [{"title": "what was added", "detail": "specific SEO/content reason this improves the page"}],
  "changes_removed": [{"title": "what was removed", "detail": "why it was removed or replaced"}]${extra ? `,\n  "instructions_response": "point-by-point explanation of every change made per user instructions"` : ''}
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
