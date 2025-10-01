# CloseTheLoop Deployment Instructions for Novices

Follow these steps to deploy CloseTheLoop (backend to Vercel, frontend to GitHub Pages) after setting up accounts.

## Prerequisites
- GitHub account.
- Vercel account (https://vercel.com) - free tier.
- Supabase account (https://supabase.com) - free tier.
- Google AI API key (https://makersuite.google.com/app/apikey).

## Setup Supabase (DB & Storage)
1. Create new project at https://supabase.com.
2. Enable Storage: Go to Storage tab, create bucket named 'closetheloop-files', set public.
3. Run the schema: In Supabase, go to SQL Editor, paste and run content from `backend/db/schema.sql`.
4. Note: Project URL, anon key, DB password.

## Set Up Environment Variables
Create a file `backend/.env` with:
```
GEMINI_API_KEY=your-google-ai-api-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
```

## Deploy Backend to Vercel
1. Install Vercel CLI: `npm install -g vercel` (global).
2. Push code to GitHub repository.
3. Login: `vercel login`.
4. Cd to project root: `vercel`.
5. Follow prompts: Select 'Yes' for project, link to GitHub repo.
6. For functions, it auto-detects `/backend/api` routes.
7. Add env vars in Vercel dashboard: Environment Variables tab, add each from .env.
8. Deploy: `vercel --prod`.

Backend endpoints: https://your-project.vercel.app/api/*.

## Deploy Frontend to GitHub Pages
1. In repo, go to Settings > Pages.
2. Source: Select 'Deploy from a branch'.
3. Branch: main, folder: /frontend.
4. Save. GitHub will build and deploy to `https://username.github.io/repo-name`.

Frontend runs at GitHub Pages URL, but update API calls in `frontend/app.js` to use Vercel backend URL e.g., `const API_BASE = 'https://your-project.vercel.app';` then use axios with `${API_BASE}/api/...`.

## Testing
- Visit GitHub Pages URL.
- Try student submit: Enter Session ID (create one first), upload file, get feedback.
- For professor: Create session (with document, confirm checkbox), finalize KAUs, view dashboard.

## Troubleshooting
- API errors: Check env vars and Supabase keys.
- File upload fails: Ensure 'closetheloop-files' bucket public.
- Gemini no response: Verify API key limits.

Done! The app is live.
