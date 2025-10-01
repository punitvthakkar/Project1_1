# CloseTheLoop Service Clarifications

## Current Service Stack

### Frontend Hosting: GitHub Pages
- **Purpose**: Hosts static HTML/CSS/JS files for the web app interface. No server-side processing, just serves files. Zero cost, integrates with GitHub repos.
- **Why chosen**: Free, reliable, easy for static sites; no backend needed for UI.

### Backend API: Vercel (Serverless Functions)
- **Purpose**: Runs Node.js/Express routes for AI calls, DB queries, file uploads. Handles dynamic requests from frontend (e.g., POST /api/sessions).
- **Why chosen**: Free tier for hobby projects, auto-scales on requests, integrated with Git GitHub repos; Node.js native for our stack.

### Database: Supabase (PostgreSQL + Storage)
- **Purpose**: Stores sessions, KAUs, submissions, feedback. Also stores document/file uploads in Supabase Storage (object storage).
- **Why chosen**: Free tier (500MB DB, 1GB storage), PostgreSQL (robust queries), API auth handled; all-in-one for data + files.

### AI Model: Google Gemini 2.5 Flash
- **Purpose**: Processes document text to extract/generate structured JSON outputs (KAUs, feedback with 4 sections). Handles text analysis, ensures consistent educational outputs.
- **Why chosen**: Mandatory as per PRD; free credits sufficient for low usage; high-quality JSON struct schelogging.

## Affordability & Alternatives

All current services have generous free tiers, making the app cost-free for personal/educational use (e.g., under Vercel/Supabase limits: 100GB bandwidth/month, 10K functions/month).

### Alternatives (More Affordable/Comparable):

- **GitHub Pages Alternatives**:
  - Netlify: Similar free tier, better CMS/plugins, preview deploys.
  - Surge: Even simpler, no repo link, pay after free usage.

- **Vercel Alternatives**:
  - Netlify Functions: Free 125K invocations/month, similar features.
  - Cloudflare Pages + Workers: Free 100K/day, global edge network.

- **Supabase Alternatives**:
  - Neon: Pure PostgreSQL free tier (512MB), but no storage - pair with Cloudflare R2 cheaper.
  - Firebase: Free for DB + storage, but changes to schema harder, JS ecosystem.

- **Google Gemini Alternatives**:
  - OpenAI GPT-4o: Better JSON support, but API costs (~$0.001/1K tokens), no free tier.
  - Local Ollama: Free, but resources-intensive, not scalable for web; requires VPS (~$5/month).

## Comparison Table

| Service | Current | Alternative | Free Limits | Pros | Cons |
|---------|---------|-------------|-------------|------|------|
| **Frontend Hosting** | GitHub Pages | Netlify | Unlimited static sites, 100GB/month bandwidth | GitHub integrated, reliable | No server logic, Cephal void org repos |
| | | Surge | Freemium after 1 site | Simpler deploy | Feature limited |
| **Backend API** | Vercel | Netlify Functions | 375K/month invocations | Framework agnostic, fast | Cold starts |
| | | Cloudflare Pages + Workers | 100K/day requests | Edge performance | Less mature ecosystem |
| **Database & Storage** | Supabase | Neon + Cloudflare R2 | Neon: 512MB DB, R2: 10GB | Cost-effective, Postgres | Separate setup |
| | | Firebase | DB + 1GB storage | Realtime features | Vendor lock-in |
| **AI Model** | Google Gemini 2.5 Flash | OpenAI GPT-4o | Paid (~$0.002/1K tokens) | Consistent JSON, pay-as-you-go | No free tier |
| | | Local Ollama (via VPS) | Self-hosted | Privacy, no API limits | High compute cost ($5+/month) |

**Recommendation**: Stick to current stack for free/hobby use. Switch to Netlify/Firebase for larger scale if needed.
