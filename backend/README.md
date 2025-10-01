# Backend Setup

## Supabase Configuration
1. Create a free Supabase project at https://supabase.com.
2. Enable Row Level Security (RLS) on all tables (can be disabled for POC).
3. Run the schema.sql in Supabase SQL Editor to create tables.
4. Get your project URL and anon/public API key.
5. Enable Storage: Create a bucket 'closetheloop-files' with public access.

## Environment Variables
Create a `.env` file in backend/ directory:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
GOOGLE_GENAI_API_KEY=your-google-ai-api-key
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
```

## Running Locally
```bash
npm install
node api/index.js  # or use Vercel dev
```

For Vercel deployment: Link project and add env vars.
