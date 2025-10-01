# CloseTheLoop Educational Feedback System - Development Proposal

**Project:** CloseTheLoop (Version 1.3 - Frontend & Hosting Update)
**Date:** October 26, 2023
**Prepared For:** [Client Name]

## 1. Executive Summary
This proposal outlines the final tech stack and development for CloseTheLoop, an AI-powered web app for instant student feedback via Google Gemini 2.5 Flash. We use pure HTML/CSS/JS frontend, FOSS backend (Node.js), and free secure hosting (Vercel/Supabase), as mandated.

## 2. Product Vision and Goals
CloseTheLoop provides targeted feedback on assignments, with actionable professor insights. Key commits:
- Lightweight frontend: Pure HTML/CSS/JS.
- AI-assisted KAU setup with Gemini 2.5 Flash.
- Cost-effective: FOSS tools, free tiers (Vercel, Supabase).

## 3. Scope of Functionality
**Administration & Session Management (Professor):**
- File upload for lecture materials.
- AI extraction of KAUs & finalization.
- Dashboard with aggregated gaps and AI remedial suggestions.

**Student Submission & Feedback:**
- File upload (PDF/DOCX/PPTX).
- Instant structured feedback: Highlights, Missing Points, Reflective Questions, Prescriptive Suggestions.

Data secured with encryption.

## 4. Technical Architecture and Compliance
All components FOSS/free commercial tiers.

| Component          | Technology                  | Detail |
|--------------------|-----------------------------|--------|
| Frontend (Client) | Vanilla JS, HTML5, CSS3     | No frameworks; FOSS libs (Axios) minimal. |
| Backend (Server)  | Node.js Express             | FOSS; handles API, uploads, AI calls. |
| Database          | PostgreSQL (Supabase)       | FOSS; optimized queries. |
| AI/LLM Interface  | Google Gemini 2.5 Flash     | Mandatory per PRD. |
| Compute Hosting   | Vercel Serverless Functions | Free tier, secure. |
| DB Hosting        | Supabase Free Tier          | Commercial, secure. |
| Storage           | Supabase Storage            | Free, for uploads. |

Performance: <60s AI feedback.

## 5. Cost Estimate and Timeline
Estimates for "first cut" app (core features, deployment).

**Labor Cost:**
- Development: 75 EUR/hour x 10 hours = 750 EUR.

**Platform Cost:**
- All free (Vercel, Supabase, Gemini credits).

**Total Estimated Cost:** 750 EUR (Excluding Gemini usage).

Ready to start development.
