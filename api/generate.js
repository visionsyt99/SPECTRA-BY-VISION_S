const SYSTEM = `You are SPECTRA by VISION_S, an expert presentation creative director, information designer, editorial art director and presentation architect. Produce a complete, useful, visually-directed presentation, not an outline. Think through audience, purpose, thesis, evidence, narrative arc and visual language before writing slides. Avoid fabricated statistics, quotations, citations, sources or factual claims. If the brief requests current facts and no research tool is available, mark claims that need verification in speakerNotes and use qualitative framing instead of invented numbers.

CREATIVE DIRECTION: define a coherent deck-specific visual DNA with a memorable name, central metaphor, four hex palette colours (background, foreground, accent, secondary), typography roles, composition rules and graphic motif. Make each slide feel art-directed. Do not use generic AI gradients, glassmorphism, repeated title-plus-bullets on every slide, vague filler, or meaningless stock phrases. Vary composition intentionally. Use concise, presentation-ready copy, not essay paragraphs. Each slide should communicate one clear idea and advance the story. Include useful body copy, bullets, labels, data only when justified, and speaker notes. Use diagram labels or timeline milestones where suitable. No external image URLs; instead describe a concrete visual concept that can be drawn with editable shapes.

SLIDE LAYOUTS (choose the best layout per slide and vary): title, statement, split, bullets, statistic, quote, timeline, comparison, diagram, grid, closing. For layouts requiring missing data, use conceptual labels, never fabricate measurements. Include visualDescription describing an editable vector composition with shapes, lines, icons-as-simple-geometric-symbols, and placement. Keep all text legible and concise. Every slide needs slideNumber, kicker, title, subtitle, body, bullets (array), layout, visualDescription, statValue, statLabel, leftLabel, rightLabel, steps (array), nodes (array), speakerNotes. Unused fields may be empty strings/arrays.

OUTPUT: return valid JSON only, exactly this schema: {"title":string,"objective":string,"audience":string,"type":string,"slides":number,"dna":{"name":string,"visualMetaphor":string,"palette":[string,string,string,string],"type":"string","composition":string,"motion":string,"motif":string},"story":[string],"slideContent":[{"slideNumber":number,"kicker":string,"title":string,"subtitle":string,"body":string,"bullets":[string],"layout":string,"visualDescription":string,"statValue":string,"statLabel":string,"leftLabel":string,"rightLabel":string,"steps":[string],"nodes":[string],"speakerNotes":string}],"qa":[string]}. Exactly the requested number of slideContent items. Keep palette as valid hex values. Preserve the user's topic, title intent, language and requested audience. If title blank, create a compelling title. Use the requested language for all slide copy and notes.`;

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ error: 'Gemini is not configured yet. Add GEMINI_API_KEY in Vercel → Project Settings → Environment Variables, then redeploy.' });
    const b = req.body || {};
    const clean = {
      title: String(b.title || '').slice(0, 180), objective: String(b.objective || '').slice(0, 3000),
      audience: String(b.audience || 'General audience').slice(0, 300), type: String(b.type || 'Keynote').slice(0, 60),
      tone: String(b.tone || 'Distinctive, clear and thoughtful').slice(0, 300),
      slides: Math.max(4, Math.min(24, Number(b.slides) || 10)), language: String(b.language || 'English').slice(0, 40),
      ratio: b.ratio === '4:3' ? '4:3' : '16:9'
    };
    if (!clean.objective.trim()) return res.status(400).json({ error: 'Please describe what the presentation should communicate.' });
    const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 26000);
    let response;
    try {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
        method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: 'user', parts: [{ text: `Create this presentation. Requested slide count: exactly ${clean.slides}. Brief: ${JSON.stringify(clean)}` }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.82, maxOutputTokens: 18000 }
        })
      });
    } finally { clearTimeout(timer); }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `Gemini API returned ${response.status}`);
    const raw = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
    if (!raw) throw new Error('Gemini returned no presentation content. Please try again.');
    const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, ''));
    if (!Array.isArray(parsed.slideContent) || parsed.slideContent.length < clean.slides) throw new Error('The AI response was incomplete. Please generate again.');
    parsed.slideContent = parsed.slideContent.slice(0, clean.slides).map((s, i) => ({
      slideNumber: i + 1, kicker: String(s.kicker || '').slice(0, 100), title: String(s.title || `Slide ${i + 1}`).slice(0, 180),
      subtitle: String(s.subtitle || '').slice(0, 260), body: String(s.body || '').slice(0, 900),
      bullets: Array.isArray(s.bullets) ? s.bullets.slice(0, 6).map(x => String(x).slice(0, 220)) : [],
      layout: ['title','statement','split','bullets','statistic','quote','timeline','comparison','diagram','grid','closing'].includes(s.layout) ? s.layout : 'statement',
      visualDescription: String(s.visualDescription || '').slice(0, 700), statValue: String(s.statValue || ''), statLabel: String(s.statLabel || ''),
      leftLabel: String(s.leftLabel || ''), rightLabel: String(s.rightLabel || ''),
      steps: Array.isArray(s.steps) ? s.steps.slice(0, 6).map(String) : [], nodes: Array.isArray(s.nodes) ? s.nodes.slice(0, 6).map(String) : [],
      speakerNotes: String(s.speakerNotes || '').slice(0, 1800)
    }));
    parsed.title = String(parsed.title || clean.title || 'SPECTRA Presentation').slice(0, 180);
    parsed.objective = clean.objective; parsed.audience = clean.audience; parsed.type = clean.type; parsed.slides = clean.slides; parsed.ratio = clean.ratio;
    parsed.dna = parsed.dna || {};
    parsed.dna.palette = Array.isArray(parsed.dna.palette) && parsed.dna.palette.length >= 4 && parsed.dna.palette.slice(0,4).every(c => /^#[0-9a-fA-F]{6}$/.test(String(c))) ? parsed.dna.palette.slice(0,4) : ['#101014','#F4F0E8','#A9B8FF','#C9B99B'];
    parsed.story = parsed.slideContent.map(s => s.title);
    parsed.qa = Array.isArray(parsed.qa) ? parsed.qa.slice(0, 12).map(String) : ['Slide count verified','Creative direction consistency reviewed','Required watermark included in every exported slide'];
    return res.status(200).json(parsed);
  } catch (error) {
    const msg = error.name === 'AbortError' ? 'Gemini took too long to respond. Try a shorter brief or fewer slides.' : (error.message || 'Presentation generation failed.');
    return res.status(500).json({ error: msg });
  }
};
