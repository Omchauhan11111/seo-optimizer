/* ══════════════════════════════════════════════════════════════════════════
   PROMPTS.JS — High-Output AI Content Engine v5.0
   Section-wise generation · Category-differentiated · Anti-truncation
══════════════════════════════════════════════════════════════════════════ */

if (!window.promptOverrides) window.promptOverrides = {};

/* ─────────────────────────────────────────────────────────────
   CATEGORY RULES — source of truth for all prompt behaviour
───────────────────────────────────────────────────────────── */
const CATEGORY_RULES = {
  blogs: {
    words: { min: 2000, ideal: "2500–3000", label: "2000–3000" },
    tone: "informational",
    cta: false,
    toc: true,
    faq: { count: 6, minSentences: 4 },
    sections: { min: 7 },
    sectionWords: { min: 280, ideal: 380 },
    description: "Informational blog post — educate, explain, no selling",
    tables: 2,
    callouts: 2,
    style: `
- Conversational yet authoritative tone
- Explain concepts from first principles — assume reader is intelligent but not an expert
- Every claim backed by Singapore regulatory context (ACRA, IRAS, MOM, etc.)
- Use real numbers, real fees, real timelines
- Teach the reader something genuinely useful in every section
- Avoid corporate jargon — write like a trusted advisor
- Short sentences (max 20 words). New paragraph every 3–4 sentences.`
  },
  services: {
    words: { min: 1200, ideal: "1400–1600", label: "1200–1600" },
    tone: "conversion",
    cta: true,
    toc: false,
    faq: { count: 5, minSentences: 3 },
    sections: { min: 5 },
    sectionWords: { min: 150, ideal: 220 },
    description: "Service page — convert visitors to clients",
    tables: 1,
    callouts: 1,
    style: `
- Direct, benefit-led writing — lead with WHAT THE CLIENT GETS, not what the company does
- Every section answers "what's in it for me?" from the client's perspective
- Specific over vague: "handles within 1–3 business days" not "fast turnaround"
- Include Singapore-specific compliance details to signal authority
- Use second person ("you", "your business") throughout
- Strong verbs: "eliminate", "guarantee", "streamline", "secure"`
  },
  resources: {
    words: { min: 3000, ideal: "3500–4500", label: "3000–4500" },
    tone: "deep",
    cta: false,
    toc: true,
    faq: { count: 8, minSentences: 5 },
    sections: { min: 9 },
    sectionWords: { min: 350, ideal: 500 },
    description: "Deep resource/guide — maximum depth, comprehensive coverage",
    tables: 3,
    callouts: 3,
    style: `
- Maximum depth — this is the definitive guide on this topic in Singapore
- Every H2 section must be exhaustive, covering every angle a reader might have
- Include: step-by-step processes, comparison tables, decision frameworks, checklists
- Reference official acts, regulations, government circulars by name and section number
- Anticipate follow-up questions and answer them proactively in the same section
- Real-world examples and scenarios to illustrate abstract concepts
- Structured so a reader can both scan (headings/bullets) and read deeply`
  },
  incorporation: {
    words: { min: 2000, ideal: "2500–3000", label: "2000–2500" },
    tone: "hybrid",
    cta: true,
    toc: true,
    faq: { count: 7, minSentences: 4 },
    sections: { min: 8 },
    sectionWords: { min: 250, ideal: 350 },
    description: "Incorporation guide + service promotion — educate AND convert",
    tables: 2,
    callouts: 2,
    style: `
- Hybrid: first 60% of content is purely educational (process, requirements, costs, timelines)
- Last 40% transitions to how 3E Accounting handles this specifically
- Every requirement mentioned is an opportunity to show how the service fulfills it
- Include real ACRA fees, IRAS rates, MOM requirements — dated 2026
- The reader should leave knowing exactly what to do AND why to use this service
- Step-by-step structure for the process sections
- Singapore entrepreneur perspective: speak to both local and foreign founders`
  }
};

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
const isSvc = () => S.category === "services";

function getCatRules() {
  return CATEGORY_RULES[S.category] || CATEGORY_RULES.blogs;
}

function detectMarket() {
  const url = (S.pageUrl || "").toLowerCase();
  if (url.includes(".sg") || url.includes("singapore")) return "Singapore";
  if (url.includes(".my") || url.includes("malaysia")) return "Malaysia";
  if (url.includes(".au") || url.includes("australia")) return "Australia";
  if (url.includes(".uk") || url.includes(".co.uk")) return "United Kingdom";
  if (url.includes(".in") || url.includes("india")) return "India";
  if (url.includes(".hk") || url.includes("hong-kong")) return "Hong Kong";

  const txt = (S.docxText || "").toLowerCase();
  const counts = {
    Singapore: ["singapore","acra","iras","cpf","sgd","s$","pte ltd","uen ","singpass"].filter(s => txt.includes(s)).length,
    Malaysia:  ["malaysia","ringgit","rm ","ssm ","sdn bhd"].filter(s => txt.includes(s)).length,
    Australia: ["australia","ato ","abn ","acn ","aud "].filter(s => txt.includes(s)).length,
    India:     ["india","rupee","inr ","pan card","aadhaar"].filter(s => txt.includes(s)).length,
  };
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (best && best[1] >= 2) return best[0];

  const topic = (S.topic || "").toLowerCase();
  if (topic.includes("singapore")) return "Singapore";
  if (topic.includes("malaysia")) return "Malaysia";

  try {
    const domain = new URL(S.pageUrl || "https://x.com").hostname;
    if (domain.endsWith(".sg")) return "Singapore";
    if (domain.endsWith(".my")) return "Malaysia";
    if (domain.endsWith(".au")) return "Australia";
  } catch (e) {}

  return "Singapore";
}

function detectBrand() {
  try {
    const domain = new URL(S.pageUrl || "").hostname.replace("www.", "");
    const name = domain.split(".")[0];
    return name && name.length > 1 ? name : "3E Accounting";
  } catch (e) {
    return "3E Accounting";
  }
}

function docPreview(chars = 15000) {
  if (!S.docxText) return "[No document uploaded]";
  return S.docxText.slice(0, chars);
}

function docWordCount() {
  return S.docxText ? S.docxText.split(/\s+/).filter(Boolean).length : 0;
}

function catLabel() {
  return ({
    incorporation: "Company Incorporation/Registration Guide",
    resources: "Deep Resource/Guide/Compliance",
    services: "Professional Services Page",
    blogs: "Blog/Informational Content",
  }[S.category] || S.category);
}

function pageType() {
  return isSvc()
    ? "SERVICE PAGE (conversion focus — visitor wants to hire or buy)"
    : "BLOG/GUIDE (informational + research intent)";
}

/* ════════════════════════════════════════════════════════════════
   1. KEYWORD RESEARCH
════════════════════════════════════════════════════════════════ */
function pKw() {
  const market = detectMarket();
  const wc = docWordCount();
  const rules = getCatRules();

  return `You are a specialist SEO keyword researcher with deep expertise in the ${market} market.

TASK: Analyze the FULL document below and extract REAL, ACCURATE, market-specific keywords.

═══ FULL DOCUMENT CONTENT (read every word) ═══
${docPreview(6000)}
═══ END ═══

TOPIC: "${S.topic}"
CATEGORY: ${catLabel()} — ${rules.description}
PAGE TYPE: ${pageType()}
MARKET: ${market}
TARGET WORD COUNT: ${rules.words.label} words
DOCUMENT WORD COUNT: ${wc}
${S.pageUrl ? `PAGE URL: ${S.pageUrl}` : ""}

KEYWORD RULES (follow every one):
1. ONLY keywords directly supported by the document content above. No invention.
2. Geo-modifier "${market}" must appear naturally where relevant.
3. Volume MUST be realistic for ${market} (Singapore = small market, most B2B terms 50–2,000/mo).
4. Difficulty: Government sites (ACRA, IRAS, MOM) dominate → High. Mid-tier → Medium. Long-tail → Low.
5. PRIMARY (3): Exact phrases a reader types to find "${S.topic}" in ${market}.
6. SECONDARY (5): Sub-topics/variations found in the document.
7. LSI (6): Semantically related terms, official body names, regulatory terms.
8. Intent:
   - "Informational" = how-to, what-is, guide
   - "Commercial" = compare, best, review  
   - "Transactional" = hire, buy, register, apply, get-quote
9. For ${rules.tone} pages, weight intent toward ${rules.tone === "conversion" ? "Transactional" : rules.tone === "deep" ? "Informational" : "mix of Informational and Commercial"}.

Return ONLY valid JSON — no markdown, no explanation:
{"keywords":[{"keyword":"exact phrase","type":"primary|secondary|lsi","volume":"50-500","difficulty":"Low|Medium|High","intent":"Informational|Commercial|Transactional"}]}

Output exactly: 3 primary + 5 secondary + 6 LSI = 14 keywords total.`;
}

/* ════════════════════════════════════════════════════════════════
   2. SERP ANALYSIS
════════════════════════════════════════════════════════════════ */
function pSERP() {
  const market = detectMarket();
  const brand = detectBrand();
  const rules = getCatRules();
  const tld = { Malaysia:"my", Singapore:"sg", Australia:"com.au", India:"in" }[market] || "com";

  return `You are a senior SEO analyst. Simulate a REALISTIC SERP analysis for "${S.topic}" in ${market}.

DOCUMENT CONTENT (understand what THIS page currently covers):
═══ START ═══
${docPreview(4000)}
═══ END ═══

TOPIC: "${S.topic}"
CATEGORY: ${catLabel()}
MARKET: ${market}
PAGE TYPE: ${pageType()}
${S.pageUrl ? `URL BEING OPTIMISED: ${S.pageUrl}` : ""}
BRAND: ${brand}

REALISTIC COMPETITOR ANALYSIS:
Think carefully who ACTUALLY ranks for "${S.topic}" in ${market}:
- Official government sites: ACRA.gov.sg, MOM.gov.sg, IRAS.gov.sg, SSM.com.my (rank #1–2 for regulatory topics)
- Established professional firms: Big 4, top law firms, major accounting firms in ${market}
- Direct competitors similar to ${brand}
- Industry media: StraitsTimes, BusinessTimes, CNA (SG), TheEdge (MY)

TARGET LENGTH: ${rules.words.label} words (category: ${rules.description})
TONE: ${rules.tone}

Return ONLY valid JSON — no markdown, no explanation:
{
  "serp_competitors": [
    {
      "rank": 1,
      "title": "realistic page title",
      "url": "https://realdomain.${tld}/realistic-slug/",
      "word_count": 2800,
      "sections": ["H2 Section 1", "H2 Section 2", "H2 Section 3", "H2 Section 4", "FAQ"],
      "has_faq": true,
      "has_table": true,
      "domain_authority": "High|Medium|Low"
    }
  ],
  "top_topics": [
    "specific topic competitors cover that's relevant to ${S.topic}"
  ],
  "content_gaps": [
    "SPECIFIC gap: exact thing missing from current document that top competitors cover"
  ],
  "word_count_target": ${rules.words.min},
  "recommended_sections": [
    "H2 Section Name: why this section is needed for the ${market} audience"
  ]
}

Output: 5 competitors, 7 top_topics, 7 content_gaps, 6 recommended_sections.
Be SPECIFIC to "${S.topic}" in ${market}. No generic advice.`;
}

/* ════════════════════════════════════════════════════════════════
   3. SEO AUDIT
════════════════════════════════════════════════════════════════ */
function pAudit() {
  const wc = docWordCount();
  const market = detectMarket();
  const rules = getCatRules();
  const scoreBefore = Math.min(55, Math.max(8, Math.round(wc / 55)));
  const scoreAfter = Math.min(93, scoreBefore + 35);

  return `You are a senior SEO content auditor. Read the FULL document below and produce an HONEST, SPECIFIC audit.

═══ FULL DOCUMENT — READ EVERY LINE ═══
${docPreview(8000)}
═══ END DOCUMENT ═══

AUDIT CONTEXT:
- Topic: "${S.topic}"
- Category: ${catLabel()} (${rules.description})
- Market: ${market}
- Page Type: ${isSvc() ? "SERVICE PAGE" : "BLOG/GUIDE"}
- Current Word Count: ${wc} words
- Target Word Count: ${rules.words.label} words
- Target Tone: ${rules.tone}
${S.pageUrl ? `- URL: ${S.pageUrl}` : ""}

SCORING:
- score_before: ${wc < 300 ? "Thin: 8–20" : wc < 600 ? "Short: 18–35" : wc < 1200 ? "Medium: 32–52" : wc < 2000 ? "Decent: 45–62" : "Good length but check quality: 50–68"}
- score_after: realistic after full optimization. Max +38 points.
- score_breakdown: score each dimension 0–100 based on WHAT YOU ACTUALLY READ.

CATEGORY-SPECIFIC ISSUES TO CHECK FOR ${S.category.toUpperCase()}:
${S.category === "blogs" ? `- Is content purely informational without selling?
- Does it have enough depth and explanation per section?
- Are there real data points, statistics, examples?
- Is there a proper FAQ section?` : ""}
${S.category === "services" ? `- Does it have clear CTAs?
- Does it explain sub-services individually?
- Does it have pricing transparency?
- Are there trust signals (years, client count, awards)?
- Internal links to related services?` : ""}
${S.category === "resources" ? `- Is it comprehensive enough to be the definitive guide?
- Does it have step-by-step processes?
- Are there comparison tables and data?
- Does it anticipate follow-up questions?` : ""}
${S.category === "incorporation" ? `- Does it balance education vs promotion?
- Are ACRA fees and requirements up to date?
- Does it cover both local and foreign founder scenarios?
- Is the incorporation process explained step by step?` : ""}

Return ONLY valid JSON:
{
  "score_before": ${scoreBefore},
  "score_after": ${scoreAfter},
  "word_count_before": ${wc},
  "word_count_after": ${rules.words.min},
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

/* ════════════════════════════════════════════════════════════════
   4. STRUCTURE GENERATION
   Returns JSON array of H1/H2/H3 headings for the page
════════════════════════════════════════════════════════════════ */
function pStructure(kwData, serpData) {
  const rules = getCatRules();
  const market = detectMarket();
  const brand = detectBrand();
  const year = new Date().getFullYear();

  return `You are a senior SEO content architect. Generate the COMPLETE heading structure for this page.

TOPIC: "${S.topic}"
CATEGORY: ${catLabel()} — ${rules.description}
MARKET: ${market}
BRAND: ${brand}
YEAR: ${year}
MIN SECTIONS: ${rules.sections.min}
WORDS PER SECTION: ${rules.sectionWords.min}–${rules.sectionWords.ideal}
TOTAL TARGET: ${rules.words.ideal} words
CTA REQUIRED: ${rules.cta}
TOC REQUIRED: ${rules.toc}
FAQ COUNT: ${rules.faq.count}

KEYWORD DATA (include these in headings where natural):
${kwData}

SERP GAPS (these MUST become sections):
${serpData}

CATEGORY STRUCTURE RULES FOR ${S.category.toUpperCase()}:
${S.category === "blogs" ? `
REQUIRED H2 ORDER:
1. Introduction context / What is [topic]?
2. Why [topic] matters in ${market} / Key statistics
3. The Process / How it works (step by step)
4. Requirements / Eligibility / Types
5. Costs & Timeline / Fees table
6. Common Mistakes / Key Considerations
7. [SERP GAP SECTION 1]
8. [SERP GAP SECTION 2]
9. Expert Tips / Best Practices
10. FAQ (${rules.faq.count} questions)
11. Conclusion
Each H2 should have 1–2 H3 sub-sections where it deepens the topic.` : ""}
${S.category === "services" ? `
REQUIRED H2 ORDER:
1. What We Offer (overview with strong hook)
2–5. Individual sub-services (one H2 per major service line, with H3s for sub-items)
6. Why Choose ${brand} (differentiators)
7. Our Process / How It Works (numbered steps)
8. Pricing / Packages
9. FAQ (${rules.faq.count} questions)
NO TOC. NO CONCLUSION H2.` : ""}
${S.category === "resources" ? `
REQUIRED H2 ORDER:
1. What is [topic]? / Overview & Definition
2. Why [topic] matters / Key Benefits for ${market} businesses
3. Legal Framework / Regulatory Requirements in ${market}
4. Types / Categories / Options
5. Step-by-Step Process (detailed)
6. Costs, Fees, and Timeline
7. Compliance Requirements / Ongoing Obligations
8. Common Mistakes to Avoid
9. [SERP GAP SECTION 1]
10. [SERP GAP SECTION 2]
11. Comparison: Options A vs B vs C (table)
12. Expert Recommendations / Decision Framework
13. FAQ (${rules.faq.count} questions)
14. Conclusion / Summary
Each H2 should have 2–3 H3 sub-sections.` : ""}
${S.category === "incorporation" ? `
REQUIRED H2 ORDER:
1. Why Incorporate in ${market}? / Key Advantages
2. Types of Business Structures in ${market}
3. Requirements for Company Incorporation in ${market}
4. Step-by-Step Incorporation Process
5. Costs & Government Fees (${year})
6. Post-Incorporation Requirements / Compliance
7. For Foreign Entrepreneurs / Special Considerations
8. [SERP GAP SECTION]
9. How ${brand} Makes Incorporation Seamless
10. Our Incorporation Package / What's Included
11. FAQ (${rules.faq.count} questions)
12. Conclusion` : ""}

Return ONLY valid JSON — no markdown, no explanation:
{
  "h1": "The main H1 heading with primary keyword",
  "sections": [
    {
      "id": "section-slug",
      "h2": "H2 Heading Text",
      "h3s": ["Optional H3 sub-heading 1", "Optional H3 sub-heading 2"],
      "intent": "What this section covers in 1 sentence",
      "words": 350,
      "is_cta": false,
      "is_faq": false
    }
  ],
  "meta_title": "50–60 char meta title with primary keyword",
  "meta_description": "145–158 char meta description. Action verb start. Benefit. Soft CTA.",
  "url_slug": "/seo-friendly-slug/"
}`;
}

/* ════════════════════════════════════════════════════════════════
   5. SECTION CONTENT GENERATION
   Called once per section — generates full HTML for that section
════════════════════════════════════════════════════════════════ */
function pSection(section, sectionIndex, totalSections, kwData, serpData, allSectionsBuilt) {
  const rules = getCatRules();
  const market = detectMarket();
  const brand = detectBrand();
  const year = new Date().getFullYear();
  const checkedOpts = getOpts();
  const extra = (document.getElementById("extra-inst")?.value || "").trim();
  const depthMode = document.getElementById("depth-mode")?.value || "deep";
  const depthMultiplier = depthMode === "insane" ? 1.6 : depthMode === "deep" ? 1.3 : 1.0;
  const targetWords = Math.round((section.words || rules.sectionWords.ideal) * depthMultiplier);

  let siteBase = "";
  try { siteBase = new URL(S.pageUrl || "").origin; } catch (e) {}

  const isFirst = sectionIndex === 0;
  const isLast = sectionIndex === totalSections - 1;

  /* Build what's already been written (for context) */
  const builtContext = allSectionsBuilt.length > 0
    ? `SECTIONS ALREADY WRITTEN (for continuity — do NOT repeat content from these):\n${allSectionsBuilt.slice(-2).map(s => `[${s.h2}]: ${s.preview}`).join("\n")}\n`
    : "";

  /* Section-specific instructions */
  let sectionInstructions = "";

  if (section.is_faq) {
    sectionInstructions = `
THIS IS THE FAQ SECTION. Generate exactly ${rules.faq.count} FAQs.
FORMAT:
<div class="faq-item">
  <div class="faq-q">Full question as someone would actually type it into Google?</div>
  <div class="faq-a">Detailed answer — minimum ${rules.faq.minSentences} sentences. Include specific ${market} regulatory details, actual fees, real timelines, official body names. No vague answers.</div>
</div>
Questions must be REAL searches, not generic. Cover: process, costs, timelines, requirements, common concerns.
DO NOT wrap in any outer div — output faq-items directly.`;
  } else if (section.is_cta) {
    sectionInstructions = `
THIS IS A CTA SECTION. Generate a conversion-focused call-to-action block.
<div class="tool-cta">
  <h3>Compelling CTA headline — specific to "${S.topic}"</h3>
  <p>2–3 sentences on the key benefit of acting now. Specific to ${market} context.</p>
  <div class="btn-row">
    <a href="${siteBase || "https://3ecpa.com.sg"}/contact/" class="cta-btn-w">Get Free Consultation</a>
    <a href="${siteBase || "https://3ecpa.com.sg"}/${S.category}/" class="cta-btn-outline">View Packages</a>
  </div>
  <div class="trust"><span>Free consultation</span><span>24hr response</span><span>Licensed professionals</span></div>
</div>
DO NOT wrap in new-block or any outer div. Output the tool-cta div directly.`;
  } else if (section.h2.toLowerCase().includes("step") || section.intent?.toLowerCase().includes("process")) {
    sectionInstructions = `
THIS IS A PROCESS/STEPS SECTION. Use numbered step format:
<ol class="steps">
  <li class="step-body"><strong>Step Title</strong><p>Detailed explanation of exactly what happens in this step. Include WHO does it, WHAT is submitted, HOW LONG it takes, and any Singapore-specific requirement. Minimum 60 words per step.</p></li>
</ol>
Include at least 5–7 steps. Each step must be substantive — no filler.`;
  } else if (section.h2.toLowerCase().includes("cost") || section.h2.toLowerCase().includes("fee") || section.h2.toLowerCase().includes("pric")) {
    sectionInstructions = `
THIS IS A COSTS/PRICING SECTION. Include a proper HTML comparison table with real ${market} fees:
<div class="tbl-wrap">
  <table>
    <thead><tr><th>Item</th><th>Fee / Cost</th><th>Notes</th></tr></thead>
    <tbody>
      <tr><td>Government fee (e.g. ACRA)</td><td>SGD XXX</td><td>One-time</td></tr>
    </tbody>
  </table>
</div>
Use REAL fees from the document or known ${market} regulatory rates. Add notes on what affects pricing.`;
  } else if (section.h2.toLowerCase().includes("compar") || section.h2.toLowerCase().includes("vs ") || section.h2.toLowerCase().includes("option")) {
    sectionInstructions = `
THIS IS A COMPARISON SECTION. Include a comparison table:
<div class="tbl-wrap">
  <table>
    <thead><tr><th>Criteria</th><th>Option A</th><th>Option B</th><th>Option C</th></tr></thead>
    <tbody><!-- populate with real data --></tbody>
  </table>
</div>
After the table, include a recommendation paragraph on which option suits which type of business.`;
  } else if (section.h3s && section.h3s.length > 0) {
    sectionInstructions = `
THIS SECTION HAS H3 SUB-SECTIONS. After your opening paragraph for the H2, create these H3 sub-sections:
${section.h3s.map((h3, i) => `H3 ${i+1}: "${h3}" — write ${Math.round(targetWords / (section.h3s.length + 1))} words for this sub-section`).join("\n")}
Each H3 must have its own full explanation. Do NOT just summarize — explain fully.`;
  }

  /* Callout instruction for key sections */
  const calloutInstruction = (sectionIndex % 3 === 1 && !section.is_faq && !section.is_cta)
    ? `\nADD A CALLOUT BOX somewhere in this section:\n<div class="callout callout-blue"><strong>💡 Key Point:</strong><p>A genuinely important insight or fact that the reader must not miss. Make it specific — include a real figure, regulation name, or expert tip.</p></div>`
    : "";

  /* Interlinking for services */
  const interlinksInstruction = (checkedOpts.includes("interlinking") && isSvc() && sectionIndex % 2 === 0)
    ? `\nADD 2 INTERNAL LINKS in this section (anchor text must be keyword-rich and descriptive):\nFormat: <a href="${siteBase || "https://3ecpa.com.sg"}/relevant-page/">descriptive anchor text</a>`
    : "";

  return `You are a world-class SEO content writer specialising in ${market} business content.
Your job: write ONE COMPLETE SECTION of a ${catLabel()} page.

━━ SECTION TO WRITE ━━
H2 Heading: "${section.h2}"
${section.h3s?.length > 0 ? `H3 Sub-sections: ${section.h3s.join(" | ")}` : ""}
Section intent: ${section.intent}
Target words: ${targetWords}
Section ${sectionIndex + 1} of ${totalSections}

━━ FULL DOCUMENT CONTENT (original — use as source material) ━━
${docPreview(8000)}
━━ END DOCUMENT ━━

━━ CONTEXT ━━
Topic: "${S.topic}"
Category: ${catLabel()} — ${rules.description}
Market: ${market}
Brand: ${brand}
Year: ${year}
Page type: ${pageType()}
Depth mode: ${depthMode}

━━ KEYWORDS TO USE NATURALLY ━━
${kwData}

━━ CONTENT GAPS TO FILL ━━
${serpData}

${builtContext}

━━ WRITING STYLE FOR ${S.category.toUpperCase()} ━━
${rules.style}
${extra ? `\n━━ USER SPECIAL INSTRUCTIONS ━━\n${extra}\n` : ""}

━━ SECTION-SPECIFIC INSTRUCTIONS ━━
${sectionInstructions}
${calloutInstruction}
${interlinksInstruction}

━━ ABSOLUTE RULES — NEVER VIOLATE ━━
1. MINIMUM ${targetWords} words for this section — COUNT before submitting
2. NEVER summarize — ALWAYS explain fully
3. NEVER use placeholder text or "..." — write every word
4. Every paragraph must add unique value — no filler, no repetition
5. Primary keyword must appear naturally at least once in this section
6. Include specific ${market} facts: actual fees, real timelines, official body names, act references
7. ${isFirst ? "First section: start with a compelling hook that draws the reader in immediately" : ""}
8. ${isLast ? "Last section (if conclusion): summarize key takeaways and what the reader should do next" : ""}
9. Every H3 section must be fully written — minimum ${Math.round(targetWords / (Math.max(section.h3s?.length || 1, 1) + 1))} words each
10. Color coding rules:
    - <div class="new-block">...</div> = content you are ADDING (not in original document)
    - <div class="remove-block">...</div> = original content to be DELETED
    - Content with NO wrapper = kept from original unchanged
    - Most content should be in new-block since you're expanding
    - DO NOT wrap absolutely everything in new-block if it came from the original

━━ OUTPUT FORMAT ━━
Return ONLY valid JSON — no markdown, no preamble:
{
  "html": "Complete HTML for this section — the <h2> tag, all paragraphs, lists, tables, callouts, H3s, etc.",
  "word_count": 380,
  "preview": "First 100 chars of text content"
}`;
}

/* ════════════════════════════════════════════════════════════════
   6. FINAL MERGE + POLISH
   Assembles all sections into final output with meta/TOC
════════════════════════════════════════════════════════════════ */
function pMerge(structure, sectionsHtml, kwData, auditData) {
  const rules = getCatRules();
  const market = detectMarket();
  const brand = detectBrand();
  const year = new Date().getFullYear();
  const checkedOpts = getOpts();

  let siteBase = "";
  try { siteBase = new URL(S.pageUrl || "").origin; } catch (e) {}

  const tocItems = structure.sections
    .filter(s => !s.is_cta && !s.is_faq)
    .map(s => `<li><a href="#${s.id}">${s.h2}</a></li>`)
    .join("\n    ");

  const tocBlock = rules.toc ? `
<div class="toc-box">
  <h4>📋 Table of Contents</h4>
  <ol>
    ${tocItems}
  </ol>
</div>` : "";

  const metaStrip = `<div class="meta-strip">
  <span class="meta-badge">3E Accounting Singapore</span>
  <span>Updated ${year}</span>
  <span class="meta-badge green">✓ ${market} Verified</span>
  <span>📖 ~${Math.round(rules.words.min / 200)} min read</span>
</div>`;

  const bottomCta = rules.cta ? `
<div class="bottom-cta">
  <h2>Ready to Get Started? We Make It Simple.</h2>
  <p>Join thousands of businesses that trust ${brand} for their corporate needs in ${market}. Fast, accurate, fully compliant.</p>
  <div class="btn-row" style="justify-content:center;display:flex;gap:14px;flex-wrap:wrap;">
    <a href="${siteBase || "https://3ecpa.com.sg"}/contact/" class="cta-btn-w" style="color:#0d2b6e;">Get Free Consultation</a>
    <a href="${siteBase || "https://3ecpa.com.sg"}/${S.category}/" class="cta-btn-outline" style="border-color:#0d2b6e;color:#0d2b6e;">View Our Services</a>
  </div>
</div>` : "";

  return `You are a senior SEO editor. Your job is to assemble and polish the complete page HTML.

━━ ASSEMBLED SECTIONS (the full page content, section by section) ━━
${sectionsHtml}
━━ END SECTIONS ━━

━━ PAGE STRUCTURE ━━
H1: ${structure.h1}
Meta Title: ${structure.meta_title}
Meta Description: ${structure.meta_description}
URL Slug: ${structure.url_slug}
Category: ${S.category} — ${rules.description}
Market: ${market}

━━ TOC BLOCK (insert after intro if category requires TOC) ━━
${tocBlock}

━━ META STRIP (insert after H1) ━━
${metaStrip}

━━ BOTTOM CTA (append at very end) ━━
${bottomCta}

━━ FINAL POLISH TASKS ━━
1. Ensure the H1 is at the very top
2. After H1, insert the meta-strip
3. ${rules.toc ? "After the meta-strip and intro paragraph, insert the TOC block" : "No TOC needed"}
4. Add id attributes to all H2 tags matching the section IDs for anchor links
5. Ensure all FAQ items use the faq-item/faq-q/faq-a class structure
6. Check all tables are wrapped in <div class="tbl-wrap">
7. Verify CTAs use the correct class (tool-cta, bottom-cta)
8. ${rules.cta ? "Append the bottom-cta at the very end" : "No bottom CTA needed"}
9. Ensure there are NO duplicate headings
10. Verify internal links use real URL patterns from ${siteBase || "https://3ecpa.com.sg"}
11. Count total words — must be minimum ${rules.words.min}. If short, EXPAND the intro and conclusion.

━━ SEO AUDIT ISSUES TO FIX ━━
${auditData}

━━ KEYWORD DATA (verify these appear throughout) ━━
${kwData}

━━ OUTPUT ━━
Return ONLY valid JSON — no markdown:
{
  "meta_title": "${structure.meta_title}",
  "meta_description": "${structure.meta_description}",
  "url_slug": "${structure.url_slug}",
  "h1": "${structure.h1}",
  "optimized_html": "THE COMPLETE ASSEMBLED HTML — h1, meta-strip, toc (if applicable), all sections in order, bottom-cta (if applicable)",
  "word_count_final": 2800,
  "changes_added": [{"title": "what was added", "detail": "specific SEO/content reason"}],
  "changes_removed": [{"title": "what was removed", "detail": "why it was removed"}]
}`;
}

/* ════════════════════════════════════════════════════════════════
   7. HUMANIZATION PASS
   Rewrites AI-generated HTML to pass AI detection at <20%
   while preserving all HTML tags, SEO structure, and meaning
════════════════════════════════════════════════════════════════ */
function pHumanize(htmlContent) {
  const market = detectMarket();
  const rules = getCatRules();

  return `You are a professional human content editor — NOT an AI writer.
Your ONLY job: rewrite the text content inside the HTML below so it reads like a real person wrote it.

━━ CRITICAL RULES ━━
1. PRESERVE ALL HTML TAGS exactly as-is — do NOT change, move, or remove any tag, class, id, href, or attribute
2. ONLY rewrite the visible text content between tags
3. Keep ALL structured elements intact: <table>, <ol class="steps">, <div class="faq-item">, <div class="tool-cta">, <div class="callout">, etc.
4. Keep ALL internal links and their anchor text (you may rephrase the surrounding sentence, not the anchor text itself)
5. Do NOT add or remove sections, headings, or HTML structure
6. Do NOT shorten content — maintain similar word count
7. Do NOT remove any facts, fees, figures, or regulatory details
8. Output ONLY the rewritten HTML — no explanation, no preamble, no markdown fences

━━ HUMANIZATION GOALS ━━
Target: AI detection score below 20% on tools like GPTZero, Originality.ai, Copyleaks

HOW to achieve this:

A) SENTENCE VARIETY — actively break predictable patterns:
   - Mix very short sentences (3–6 words) with longer ones (20–30 words)
   - Occasionally start a sentence with "And" or "But" — real writers do this
   - Use sentence fragments sparingly for emphasis. Like this.
   - Vary paragraph length — some 1 sentence, some 4–5 sentences

B) NATURAL HUMAN PHRASES — insert these sparingly (1–2 per section max):
   - "Here's the thing..." / "Let's be honest..." / "In practice..."
   - "Now, you might be wondering..." / "The short answer is..."
   - "Worth noting:" / "One thing most people miss:"
   - "In reality..." / "That said..." / "Fair warning:"

C) LIGHT IMPERFECTIONS — real editors don't over-polish:
   - Occasional casual word choice ("tricky", "pretty straightforward", "fair bit")
   - A slightly incomplete thought followed by clarification
   - Rhetorical questions: "Why does this matter?" / "So what does this mean for you?"

D) REMOVE AI SIGNALS — avoid these robotic patterns:
   - NEVER use: "In conclusion", "Furthermore", "Moreover", "It is worth noting", "It is important to"
   - NEVER use: "This comprehensive guide", "In today's fast-paced", "Navigating the complexities"
   - NEVER start consecutive sentences with the same word
   - NEVER use triple-part lists like "First... Second... Third..." in prose
   - Avoid overly symmetrical paragraph structures

E) CONVERSATIONAL FLOW:
   - Use "you" and "your" where natural — speak directly to the reader
   - Explain things like you're talking to a smart friend, not writing a manual
   - Let the tone breathe — not every sentence needs to be "important"

F) CONTENT CATEGORY CONTEXT:
   This is a ${rules.tone} page about ${market} business topics.
   ${rules.tone === 'conversion' ? 'Keep the persuasive edge — just make it sound like a real salesperson, not a brochure.' : ''}
   ${rules.tone === 'informational' || rules.tone === 'deep' ? 'Keep the authoritative depth — just sound like a knowledgeable advisor, not a textbook.' : ''}
   ${rules.tone === 'hybrid' ? 'Balance education and persuasion — sound like someone who genuinely knows their stuff and wants to help.' : ''}

━━ WHAT TO KEEP UNCHANGED ━━
- All HTML tags and attributes
- All numbers, fees, dates, percentages, regulatory body names (ACRA, IRAS, MOM, etc.)
- All anchor text inside <a> tags
- All heading text inside <h1>, <h2>, <h3>, <h4> tags (headings are SEO-critical — do NOT change them)
- All content inside <th> table headers
- class="new-block" and class="remove-block" div wrappers

━━ THE HTML TO HUMANIZE ━━
${htmlContent}
━━ END HTML ━━

Return ONLY the rewritten HTML. Start directly with the first HTML tag. No explanation. No markdown.`;
}

/* ════════════════════════════════════════════════════════════════
   PROMPT EDITOR MODAL SYSTEM
════════════════════════════════════════════════════════════════ */
function openPromptEditor(key, label, promptText) {
  const modal = document.getElementById("prompt-modal");
  document.getElementById("pm-title").textContent = "✏️ Edit: " + label;
  document.getElementById("pm-textarea").value = promptText;

  document.getElementById("pm-save").onclick = () => {
    window.promptOverrides[key] = document.getElementById("pm-textarea").value;
    modal.style.display = "none";
    showToast("✅ Custom prompt saved for this session");
    refreshPromptPanel();
  };
  document.getElementById("pm-reset").onclick = () => {
    delete window.promptOverrides[key];
    modal.style.display = "none";
    showToast("↩ Prompt reset to auto-generated default");
    refreshPromptPanel();
  };
  document.getElementById("pm-close").onclick = () => { modal.style.display = "none"; };
  modal.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };
  modal.style.display = "flex";
}

function getPromptText(key) {
  if (window.promptOverrides[key]) return window.promptOverrides[key];
  return { kw: pKw, serp: pSERP, audit: pAudit }[key]?.() || "";
}

function refreshPromptPanel() {
  const panel = document.getElementById("prompt-editor-panel");
  if (!panel || panel.style.display === "none") return;
  showAllPromptEditors();
}

function showAllPromptEditors() {
  const panel = document.getElementById("prompt-editor-panel");
  const btn = document.getElementById("btn-toggle-prompts");
  if (panel.style.display !== "none") {
    panel.style.display = "none";
    btn.textContent = "👁 Preview & Edit AI Prompts";
    return;
  }
  const prompts = [
    { key: "kw", label: "🔑 Keyword Research" },
    { key: "serp", label: "📊 SERP Analysis" },
    { key: "audit", label: "🔍 SEO Audit" },
  ];
  panel.innerHTML = prompts.map(p => {
    const isEdited = !!window.promptOverrides[p.key];
    const preview = getPromptText(p.key).slice(0, 160).replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<div class="prompt-preview-item">
      <div class="pp-header">
        <span class="pp-label">${isEdited ? '<span style="color:#c87000;">✏️ [CUSTOM]</span> ' : ""}${p.label}</span>
        <button class="btn-edit-prompt" onclick="openPromptEditor('${p.key}','${p.label}',getPromptText('${p.key}'))">Edit Prompt</button>
        ${isEdited ? `<button class="btn-reset-prompt" onclick="delete window.promptOverrides['${p.key}'];refreshPromptPanel();showToast('Reset to default')">↩ Reset</button>` : ""}
      </div>
      <div class="pp-preview">${preview}…</div>
    </div>`;
  }).join("");
  panel.style.display = "block";
  btn.textContent = "🙈 Hide Prompts";
}

function showToast(msg) {
  let t = document.getElementById("toast-msg");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast-msg";
    t.style.cssText = "position:fixed;bottom:24px;right:24px;background:#0d2b6e;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.3);transition:opacity .3s;pointer-events:none;";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = "1";
  clearTimeout(t._to);
  t._to = setTimeout(() => { t.style.opacity = "0"; }, 3000);
}
