/* ══════════════════════════════════════════
   PROMPT BUILDERS
   All prompts used for AI calls
══════════════════════════════════════════ */

const isSvc=()=>S.category==='services';

function pKw(){
  const catLabel = {
    incorporation: 'Company Incorporation / Registration',
    resources: 'Resources / Guides / Compliance',
    services: 'Professional Services (Accounting / Legal / HR)',
    blogs: 'Blog / Informational Content'
  }[S.category] || S.category;

  return `You are an expert SEO strategist for 3E Accounting Singapore (3ecpa.com.sg), a professional services firm.
Topic: "${S.topic}"
Category: ${catLabel}
${isSvc()
  ? 'PAGE TYPE: SERVICE PAGE — Focus ONLY on commercial/transactional keywords. People searching to hire or buy a service.'
  : 'PAGE TYPE: BLOG/GUIDE — Focus on informational + commercial-investigation keywords. People researching a topic.'}

CRITICAL RULES for accuracy:
- Keywords MUST be SPECIFIC to Singapore market (add "Singapore" suffix where needed)
- Volume estimates must be REALISTIC for a small country (1K-10K is typical max for SG; most terms are 100-1K)
- Difficulty must reflect actual competition (government/bank sites rank for these, so "High" is common)
- Do NOT generate generic global keywords — these must be Singapore-specific search terms people actually type
- LSI keywords should be semantically related terms, not just synonyms

Return ONLY valid JSON (no markdown, no explanation):
{"keywords":[{"keyword":"...","type":"primary|secondary|lsi","volume":"100-1K","difficulty":"Low|Medium|High","intent":"Informational|Commercial|Transactional"}]}

Generate: 3 primary, 5 secondary, 6 LSI. Total = 14 keywords. Singapore 2026 context.`;
}

function pSERP(){
  const catLabel = {
    incorporation: 'company incorporation Singapore',
    resources: 'business guide Singapore',
    services: 'professional services Singapore',
    blogs: 'business blog Singapore'
  }[S.category] || S.category;

  return `You are an SEO expert for 3E Accounting Singapore (3ecpa.com.sg).
Topic: "${S.topic}"
Category: ${S.category}
Search Context: This is a Singapore B2B professional services market.

Generate REALISTIC competitor data for Singapore market. Common top-ranking sites include:
- gov.sg / acra.gov.sg / iras.gov.sg (government — always rank #1-3 for compliance topics)
- singaporelegaladvice.com, singaporebizsetup.com, 3ecpa.com.sg itself, osome.com, sleek.com, boardroom.com.sg

IMPORTANT:
- Word counts should reflect REAL page lengths (government pages: 800-1500w, commercial guides: 1500-3500w)
- has_faq and has_table should reflect what these types of pages ACTUALLY have
- content_gaps must be specific to the topic "${S.topic}" — not generic SEO advice
- word_count_target for services = 700-900, for blogs/guides = 2000-3000

Return ONLY valid JSON:
{"serp_competitors":[{"rank":1,"title":"...","url":"...","word_count":1800,"sections":["Overview","Requirements","Process","Fees","FAQ"],"has_faq":true,"has_table":true,"domain_authority":"High|Medium"}],"top_topics":["topic covered by competitors"],"content_gaps":["specific thing missing from current content"],"word_count_target":${isSvc()?800:2500},"recommended_sections":["section name"]}

5 realistic Singapore market competitors. Be specific to "${S.topic}".`;
}

function pAudit(){
  const wordCount = S.docxText.split(/\s+/).filter(Boolean).length;
  return `You are a senior SEO content auditor specializing in Singapore professional services.
Analyze this ACTUAL content carefully:

=== DOCUMENT START ===
${S.docxText.slice(0,4500)}
=== DOCUMENT END ===

Topic: "${S.topic}"
Category: ${S.category}
Page Type: ${isSvc()?'SERVICE PAGE':'BLOG/GUIDE'}
Actual Word Count: ${wordCount} words

SCORING INSTRUCTIONS — Be ACCURATE and HONEST:
- score_before must reflect the ACTUAL quality of the uploaded document (if it's short/thin, score low 20-45; if decent, 45-65)
- score_after is the projected score AFTER optimization (max realistic improvement: +30 to +45 pts)
- Do NOT give inflated scores — a 400-word page cannot be a 65; it should be 25-35
- Base score_breakdown on what you ACTUALLY observe in the content

AUDIT RULES:
- issues_fail: Real problems you found in the actual text (missing keywords, no structure, thin content, etc.)
- issues_warn: Minor issues (short sentences, missing CTA, no internal links, etc.)
- issues_pass: Things done correctly (if any headings exist, if topic is clear, etc.)
- Be specific — reference actual content issues, not generic SEO advice

Return ONLY valid JSON:
{"score_before":${Math.min(65,Math.max(15,Math.round(wordCount/50)))},"score_after":${Math.min(90,Math.max(55,Math.round(wordCount/50)+38))},"word_count_before":${wordCount},"word_count_after":${isSvc()?850:2600},"score_breakdown":{"Content Depth":30,"Keyword Usage":25,"Content Freshness":35,"Structure / UX":40,"E-E-A-T Signals":20,"CTA / Conversion":15},"issues_fail":[{"label":"...","detail":"..."}],"issues_warn":[{"label":"...","detail":"..."}],"issues_pass":[{"label":"...","detail":"..."}]}

Be brutally honest — the person needs accurate feedback to improve their content.`;
}

function pOpt(kw,serp,audit){
  const checkedOpts=getOpts();
  const opts=checkedOpts.join(', ');
  const extra=document.getElementById('extra-inst').value.trim();
  const isSv=isSvc();

  // Build specific rules for checked options only
  const optRules=[];
  if(checkedOpts.includes('keywords'))optRules.push('- Naturally integrate the researched keywords throughout (primary in H1, H2s; secondary in body; LSI in paragraphs)');
  if(checkedOpts.includes('meta'))optRules.push('- Write meta_title (55-60 chars, include primary keyword + "Singapore") and meta_description (150-160 chars, action-oriented)');
  if(checkedOpts.includes('headings'))optRules.push('- Ensure proper H1 > H2 > H3 hierarchy. H1 must include primary keyword. H2s should include secondary keywords');
  if(checkedOpts.includes('toc')&&!isSv)optRules.push('- MUST include Table of Contents after H1: <div class="toc-box"><h4>📋 Table of Contents</h4><ol>linked items</ol></div>');
  if(checkedOpts.includes('freshness'))optRules.push('- Update ALL statistics, fees, figures to 2026: GST=9%, EP salary threshold=S$5,600, ACRA fee=S$315, MOM data 2026');
  if(checkedOpts.includes('serp'))optRules.push('- Add sections that SERP competitors have but current content lacks (from the SERP analysis gaps)');
  if(checkedOpts.includes('faq')&&!isSv)optRules.push('- Add FAQ section at end: minimum 5 questions using <div class="faq-item"><div class="faq-q">Q</div><div class="faq-a">A</div></div>');
  if(checkedOpts.includes('cta'))optRules.push('- Add minimum 2 CTA boxes using .tool-cta class with links to 3ecpa.com.sg contact/relevant pages');
  if(checkedOpts.includes('eeat'))optRules.push('- Add E-E-A-T signals: cite specific SG regulations (mention ACRA, IRAS, MOM), include specific data/numbers, mention 3E Accounting expertise');
  if(checkedOpts.includes('schema'))optRules.push('- Add JSON-LD schema markup in a <script type="application/ld+json"> block (Article or Service schema)');
  if(checkedOpts.includes('interlinking')&&isSv)optRules.push('- PRIORITY: Add minimum 6-8 internal links to relevant 3ecpa.com.sg pages (use realistic anchor text)');
  if(checkedOpts.includes('service_promo')&&isSv)optRules.push('- Prominently highlight 3E Accounting service benefits, what\'s included, why choose 3E');
  if(checkedOpts.includes('service_explain')&&isSv)optRules.push('- Explain each sub-service/feature individually with its own H3 heading');
  if(checkedOpts.includes('readability'))optRules.push('- Improve readability: short sentences (15-20 words avg), use bullet lists, break up long paragraphs');
  if(checkedOpts.includes('images'))optRules.push('- Add HTML comments <!-- Image suggestion: [descriptive alt text] --> at logical visual break points');
  if(checkedOpts.includes('pricing')&&isSv)optRules.push('- Add transparent pricing section or "Contact for quote" CTA with what\'s included');
  if(checkedOpts.includes('trust_signals')&&isSv)optRules.push('- Add trust signals: years in business, number of clients served, awards/recognitions, professional memberships');

  const svcRules=`
SERVICE PAGE RULES (NON-NEGOTIABLE):
- Total content: 700–900 words maximum (concise, scannable, no fluff)
- NO Table of Contents
- Focus: commercial intent — why choose 3E, what you get, how to start
- Minimum 3 CTA buttons/boxes throughout the page`;

  const blogRules=`
BLOG/GUIDE RULES (NON-NEGOTIABLE):
- Total content: 2,000–2,800 words (comprehensive but not padded)
- Table of Contents is MANDATORY (if toc option checked)
- Include at least one comparison TABLE using proper HTML <table> tags
- Balance: 60% informational, 40% 3E Accounting promotion`;

  const colorRules=`
COLOR-CODING HTML RULES — FOLLOW EXACTLY:
- <div class="new-block"> ... </div> = NEW content you are ADDING (displays GREEN)
- <div class="remove-block"> ... </div> = OLD content to DELETE (displays RED strikethrough)
- Content WITHOUT any wrapper = EXISTING content kept unchanged (displays normal/white)
- <span class="new-inline">word</span> = inline addition (green highlight)
- <span class="remove-inline">word</span> = inline deletion (red strikethrough)

CRITICAL COLOR RULES:
1. The MAJORITY of content should be unwrapped (white = keep)
2. Only GENUINELY new sections get new-block
3. Only content you want DELETED gets remove-block
4. Do NOT wrap everything in new-block — that defeats the purpose
5. Original content that you keep verbatim must have NO wrapper at all`;

  const qualityRules=`
QUALITY & ACCURACY RULES:
- Write natural, professional English (not keyword-stuffed)
- All Singapore data must be 2026-accurate
- Internal links must use real 3ecpa.com.sg URL patterns (e.g. /company-incorporation/, /accounting/, /taxation/)
- Do NOT fabricate statistics — use real Singapore government figures
- Do NOT repeat the same keyword more than 3x in close proximity
- Make content genuinely helpful — it should answer the user's actual question`;

  const instPart=extra?`\n\nUSER'S ADDITIONAL INSTRUCTIONS (MANDATORY — must be actioned):\n"${extra}"\n\nYou MUST:\n1. Action these instructions in the optimized content\n2. Include "instructions_response" in your JSON — a detailed explanation of exactly what you changed/added because of these instructions`:'';

  return `You are a senior SEO content strategist for 3E Accounting Singapore (3ecpa.com.sg).
Your job: Optimize the uploaded document for the topic "${S.topic}".

## ORIGINAL DOCUMENT (analyze thoroughly — understand the existing content first):
${S.docxText.slice(0,5500)}

## CONTEXT:
- Topic: "${S.topic}"
- Category: ${S.category} (${isSv?'SERVICE PAGE':'BLOG/GUIDE'})
- Page URL Target: https://www.3ecpa.com.sg/

## KEYWORD RESEARCH RESULT:
${kw}

## SERP ANALYSIS RESULT:
${serp}

## SEO AUDIT RESULT:
${audit}

## USER SELECTED ONLY THESE OPTIMIZATION GOALS (apply ONLY these):
${opts || 'None selected — do minimal optimization only'}

## OPTIMIZATION RULES FOR CHECKED OPTIONS:
${optRules.join('\n')||'- No specific options selected, do general light optimization'}

${isSv?svcRules:blogRules}

${colorRules}

${qualityRules}
${instPart}

## OUTPUT — Return ONLY valid JSON (absolutely no markdown fences, no explanation outside JSON):
{
  "meta_title": "55-60 char title with primary keyword",
  "meta_description": "150-160 char compelling description",
  "url_slug": "/relevant-url-slug/",
  "h1": "H1 heading",
  "optimized_html": "[COMPLETE optimized HTML with color-coded changes — follow all rules above]",
  "changes_added": [{"title":"what was added","detail":"why it was added for SEO"}],
  "changes_removed": [{"title":"what was removed","detail":"why it was removed"}]${extra?`,\n  "instructions_response": "detailed response to user instructions"`:''}\n}`;
}

/* Show prompt preview */
function showPromptPreview(which){
  const el=document.getElementById('prompt-preview-box');
  const btn=document.getElementById('prompt-toggle-btn');
  if(el.classList.contains('show')){
    el.classList.remove('show');
    btn.textContent='👁 Preview AI Prompts';
    return;
  }
  let text='';
  if(which==='all'){
    text='=== KEYWORD PROMPT ===\n'+pKw()+'\n\n=== SERP PROMPT ===\n'+pSERP()+'\n\n=== AUDIT PROMPT ===\n'+pAudit();
  }
  el.textContent=text;
  el.classList.add('show');
  btn.textContent='🙈 Hide Preview';
}
