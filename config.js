/* ══════════════════════════════════════════
   PROVIDERS
══════════════════════════════════════════ */
const PROV = {
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    kp: "sk-or",
    ph: "sk-or-v1-…",
    hint: 'Get key: <a href="https://openrouter.ai/keys" target="_blank">openrouter.ai/keys</a> → Free account',
    at: "blue",
    at_txt:
      "<strong>OpenRouter</strong> — Free models available. Format: <code>sk-or-v1-…</code>",
    fn: "Free models available",
    models: [
      {
        g: "FREE MODELS",
        opts: [
          { v: "mistralai/mistral-7b-instruct:free", l: "Mistral 7B — Free ✓" },
          {
            v: "meta-llama/llama-3.1-8b-instruct:free",
            l: "Llama 3.1 8B — Free ✓",
          },
          { v: "deepseek/deepseek-r1:free", l: "DeepSeek R1 — Free ✓ ⭐" },
          { v: "google/gemma-3-12b-it:free", l: "Gemma 3 12B — Free ✓" },
        ],
      },
      {
        g: "PAID (Best Quality)",
        opts: [
          { v: "anthropic/claude-3.5-sonnet", l: "Claude 3.5 Sonnet ⭐" },
          { v: "openai/gpt-4o-mini", l: "GPT-4o Mini" },
          { v: "deepseek/deepseek-chat", l: "DeepSeek Chat" },
        ],
      },
    ],
    hd(s) {
      return {
        "Content-Type": "application/json",
        Authorization: "Bearer " + s.key,
        "HTTP-Referer": "https://3ecpa.com.sg",
        "X-Title": "3E SEO",
      };
    },
    bd(p, s) {
      return JSON.stringify({
        model: s.model,
        max_tokens: 8000,
        messages: [{ role: "user", content: p }],
      });
    },
    url() {
      return "https://openrouter.ai/api/v1/chat/completions";
    },
    parse(d) {
      const c = d?.choices?.[0]?.message?.content;
      if (!c) throw new Error("Empty response. Try another model.");
      return c;
    },
    err(st, msg, s) {
      if (st === 401) return "Key invalid.";
      if (st === 402) return "No credits — select a free model.";
      if (st === 404) return "Model not found: " + s.model;
      if (st === 429) return "Rate limit — wait 1 min.";
      return "Error " + st + ": " + msg;
    },
  },
 gemini: {
  id: "gemini",
  label: "🆓 Google Gemini (Free)",
  kp: "AIza",
  ph: "AIzaSy…",

  hint: 'Get FREE key: <a href="https://aistudio.google.com/app/apikey" target="_blank">aistudio.google.com</a> — No card',

  at: "green",
  at_txt: "<strong>Google AI Studio — Free (Working)</strong>",
  fn: "Free · Stable",

  // ✅ ONLY MODELS FROM YOUR API LIST
  models: [
    {
      g: "WORKING MODELS",
      opts: [
        { v: "gemini-flash-latest", l: "Gemini Flash Latest ✅ BEST" },
        { v: "gemini-flash-lite-latest", l: "Gemini Flash Lite" },
        { v: "gemini-pro-latest", l: "Gemini Pro Latest" }
      ]
    }
  ],

  // ✅ HEADERS
  hd() {
    return {
      "Content-Type": "application/json"
    };
  },

  // ✅ BODY
  bd(p, s) {
    return JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: p }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 8000,
        temperature: 0.4
      }
    });
  },

  // ✅ FINAL WORKING ENDPOINT
  url(s) {
    return `https://generativelanguage.googleapis.com/v1beta/models/${s.model}:generateContent?key=${s.key}`;
  },

  // ✅ PARSE RESPONSE
  parse(d) {
    console.log("FULL GEMINI RESPONSE:", d);

    const text = d?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    return text;
  },

  // ✅ ERROR HANDLER
  err(st, msg) {
    if (st === 400) return "Bad request (check model or body)";
    if (st === 403) return "Invalid API key";
    if (st === 404) return "Model not found";
    if (st === 429) return "Rate limit — wait 1 min";
    return "Error " + st + ": " + msg;
  },
},
  deepseek: {
    id: "deepseek",
    label: "🚀 DeepSeek (Cheap)",
    kp: "sk-",
    ph: "sk-…",
    hint: 'Get key: <a href="https://platform.deepseek.com/api_keys" target="_blank">platform.deepseek.com</a>',
    at: "blue",
    at_txt:
      "<strong>DeepSeek API</strong> — Very affordable. Format: <code>sk-…</code>",
    fn: "Paid · ~$0.14/M tokens",
    models: [
      {
        g: "DEEPSEEK",
        opts: [
          { v: "deepseek-chat", l: "DeepSeek Chat V3 ⭐" },
          { v: "deepseek-reasoner", l: "DeepSeek Reasoner R1" },
        ],
      },
    ],
    hd(s) {
      return {
        "Content-Type": "application/json",
        Authorization: "Bearer " + s.key,
      };
    },
    bd(p, s) {
      return JSON.stringify({
        model: s.model,
        max_tokens: 8000,
        messages: [{ role: "user", content: p }],
        temperature: 0.4,
      });
    },
    url() {
      return "https://api.deepseek.com/v1/chat/completions";
    },
    parse(d) {
      const c = d?.choices?.[0]?.message?.content;
      if (!c) throw new Error("Empty response.");
      return c;
    },
    err(st, msg) {
      if (st === 401) return "Key invalid.";
      if (st === 402) return "Insufficient balance.";
      if (st === 429) return "Rate limit.";
      return "Error " + st + ": " + msg;
    },
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic Claude",
    kp: "sk-ant",
    ph: "sk-ant-…",
    hint: 'Get key: <a href="https://console.anthropic.com" target="_blank">console.anthropic.com</a>',
    at: "yellow",
    at_txt:
      "<strong>Anthropic</strong> — Paid, highest quality. Format: <code>sk-ant-…</code>",
    fn: "Paid · Highest Quality",
    models: [
      {
        g: "CLAUDE",
        opts: [
          { v: "claude-3-5-sonnet-20241022", l: "Claude 3.5 Sonnet ⭐" },
          { v: "claude-3-5-haiku-20241022", l: "Claude 3.5 Haiku — Fast" },
        ],
      },
    ],
    hd(s) {
      return {
        "Content-Type": "application/json",
        "x-api-key": s.key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      };
    },
    bd(p, s) {
      return JSON.stringify({
        model: s.model,
        max_tokens: 8000,
        messages: [{ role: "user", content: p }],
      });
    },
    url() {
      return "https://api.anthropic.com/v1/messages";
    },
    parse(d) {
      const t = d?.content?.[0]?.text;
      if (!t) throw new Error("Empty response.");
      return t;
    },
    err(st, msg) {
      if (st === 401) return "Key invalid — must start with sk-ant-…";
      if (st === 429) return "Rate limit.";
      return "Error " + st + ": " + msg;
    },
  },
};

/* ══════════════════════════════════════════
   TOPICS
══════════════════════════════════════════ */
const TOPICS = {
  incorporation: [
    "Singapore Company Incorporation Services Package",
    "Singapore Company Registration Services",
    "Why 3E Accounting's Company Incorporation Package is the best in Singapore?",
    "Singapore Nominee Director Services",
    "Singapore Nominee Director Requirements: A Complete Hiring Guide",
    "Guide to Singapore Company Registration",
    "Your Complete Guide to Start Business in Singapore in 2026",
    "Guide to Selecting Your Singapore Company Names",
    "Free Singapore Company Name Check: Verify & Reserve Your Business Name (2026 Guide)",
    "Incorporation FAQ",
    "Converting Sole Proprietorship to Company in Singapore",
    "Sole Proprietor vs LLP vs Company in Singapore",
    "Foreign Company Setup Option",
  ],
  resources: [
    "Latest News in Singapore",
    "Corporate Compliance Requirement",
    "Guide to Setup Singapore Business",
    "Business Compendium",
    "Industry Guide",
    "Singapore Taxation",
    "Human Resource and Immigration",
    "Finances And Grants",
    "Why Choose Singapore?",
    "Country Guides",
    "Singapore Budget",
    "Guidebook for Singapore Directors and DCP",
    "Employee Benefits",
    "Technology",
    "Entrepreneurship",
    "Miscellaneous Topics",
  ],
  services: [
    "Start a Singapore Company",
    "Immigration / Work Pass",
    "Corporate Secretarial",
    "Virtual Office",
    "Accounting",
    "Taxation",
    "Human Resource",
    "Auditing",
    "Business Advisory",
    "Business Setup",
    "One-Stop Cloud Solution",
    "Other Jurisdictions Setup",
    "Legal",
    "IT and Design",
  ],
  blogs: [
    "Singapore Company Incorporation Blog",
    "Accounting & Finance Blog",
    "Taxation & GST Blog",
    "Human Resource & Payroll Blog",
    "Immigration & Work Pass Blog",
    "Corporate Compliance Blog",
    "Business Advisory Blog",
    "Singapore Budget Blog",
    "Entrepreneurship & Startup Blog",
    "Industry-Specific Business Guide Blog",
    "Other Jurisdictions Blog",
  ],
};

/* ══════════════════════════════════════════
   OPT OPTIONS PER CATEGORY
══════════════════════════════════════════ */
const OPTS = {
  blog_inc_res: [
    {
      id: "keywords",
      label: "Keyword Integration",
      hint: "Primary + LSI keywords throughout",
    },
    {
      id: "meta",
      label: "Meta Title & Description",
      hint: "Optimized for CTR",
    },
    {
      id: "headings",
      label: "H1/H2/H3 Structure",
      hint: "Proper heading hierarchy",
    },
    {
      id: "toc",
      label: "Table of Contents",
      hint: "Linked TOC for navigation",
    },
    {
      id: "freshness",
      label: "2026 Data Freshness",
      hint: "Update all stats & figures",
    },
    {
      id: "serp",
      label: "SERP Gap Analysis",
      hint: "Add what competitors have",
    },
    { id: "faq", label: "FAQ Section", hint: "Schema-ready FAQ markup" },
    {
      id: "cta",
      label: "CTAs & Internal Links",
      hint: "Conversion + interlinking",
    },
    { id: "eeat", label: "E-E-A-T Signals", hint: "Authority & trust signals" },
    { id: "schema", label: "Schema Markup", hint: "Article/FAQ schema tags" },
    {
      id: "readability",
      label: "Readability Score",
      hint: "Flesch-Kincaid optimization",
    },
    {
      id: "images",
      label: "Image Alt Suggestions",
      hint: "SEO-optimized alt text hints",
    },
  ],
  services: [
    {
      id: "keywords",
      label: "Keyword Integration",
      hint: "Commercial/transactional focus",
    },
    {
      id: "meta",
      label: "Meta Title & Description",
      hint: "Optimized for conversions",
    },
    {
      id: "headings",
      label: "H1/H2/H3 Structure",
      hint: "Clean heading hierarchy",
    },
    {
      id: "freshness",
      label: "2026 Data Freshness",
      hint: "Update prices & figures",
    },
    {
      id: "interlinking",
      label: "Internal Links (Priority)",
      hint: "5–8+ links to 3ecpa pages",
    },
    {
      id: "service_promo",
      label: "Service Promotion",
      hint: "Highlight benefits & value",
    },
    { id: "cta", label: "CTAs", hint: "Multiple CTA boxes" },
    {
      id: "service_explain",
      label: "Explain Each Sub-Service",
      hint: "Break down service one-by-one",
    },
    { id: "eeat", label: "E-E-A-T Signals", hint: "Trust & authority content" },
    { id: "serp", label: "SERP Analysis", hint: "Competitor comparison" },
    {
      id: "pricing",
      label: "Pricing Transparency",
      hint: "Add clear pricing/packages",
    },
    {
      id: "trust_signals",
      label: "Trust Signals",
      hint: "Awards, testimonials, stats",
    },
  ],
};
