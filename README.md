# SPECTRA by VISION_S — ready-to-deploy static website

SPECTRA is a browser-first presentation studio built with plain HTML, CSS and JavaScript. There is no local Node.js setup, npm install, build step or bundler. The only server-side code is a Vercel Function at `api/generate.js`, used to keep the Gemini API key private.

## Deploy on Vercel (recommended)
1. Create a GitHub repository and upload the **contents** of this folder (keep `api/` at the repository root).
2. In Vercel, choose **Add New → Project** and import the repository.
3. Keep the framework preset as **Other**. Leave the build command and output directory empty/default; this is a static site with a Vercel Function.
4. Open **Project → Settings → Environment Variables**.
5. Add `GEMINI_API_KEY` with your Gemini API key. Optionally add `GEMINI_MODEL` (default: `gemini-2.5-flash`).
6. Redeploy after saving the environment variable.

No local Node.js commands are required. Vercel runs `api/generate.js` automatically. Do not put your Gemini key in `app.js`, HTML, CSS or any public GitHub file.

## What is included
- Editorial SPECTRA landing page and responsive interface
- Presentation brief with format, audience, tone, slide count, language and ratio
- Gemini generation of Creative DNA, story architecture and per-slide content/layout direction
- Studio with slide navigation, live previews, layout switching, editable slide text and speaker notes
- Add slide, save project locally, delete local project, and quality review
- Browser-side editable PowerPoint export using PptxGenJS
- Required `SPECTRA By VISION_S` watermark on **every exported slide**
- Speaker notes embedded in PowerPoint when supported by the export library

## GitHub Pages
The static landing page and demo can run on GitHub Pages, but AI generation cannot: GitHub Pages does not execute Vercel Functions. Use Vercel for the complete Gemini-powered experience. Never expose a Gemini key in client-side code.

## Important product notes
- Projects are stored in the current browser's localStorage. Export PPTX files to keep portable copies; clearing browser data removes local projects.
- Exported PowerPoint slides use editable native text and vector shapes. The slide art is generated from editable layout primitives rather than external raster images. You can continue editing the PPTX in PowerPoint or compatible software.
- AI-generated factual claims should be reviewed and sourced before presenting. SPECTRA does not independently fact-check generated claims.
- Gemini model availability can vary by API account and region. If the default model is unavailable, set `GEMINI_MODEL` to a model enabled for your Gemini API key.
