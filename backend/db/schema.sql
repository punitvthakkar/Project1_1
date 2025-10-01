-- Supabase PostgreSQL Schema for CloseTheLoop

-- Sessions table: For professor-created sessions
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(50) UNIQUE NOT NULL, -- User-defined, e.g., "CHEM101-2023"
    title VARCHAR(255) NOT NULL,
    professor_placeholder VARCHAR(100), -- Placeholder for future auth
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    document_path TEXT -- S3/Supabase Storage path for uploaded slides
);

-- KAUs (Key Areas of Understanding) table: AI-suggested or finalized
CREATE TABLE IF NOT EXISTS kaus (
    id SERIAL PRIMARY KEY,
    session_id INT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- e.g., "Communication #1"
    description TEXT NOT NULL,
    finalized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Submissions table: Student uploads
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    session_id INT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_placeholder VARCHAR(100), -- Placeholder for future auth
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Supabase Storage path
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feedback table: LLM-generated outputs
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    submission_id INT UNIQUE NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    highlights TEXT, -- Done Well points
    missing_points TEXT, -- Gaps identified
    reflective_questions TEXT, -- Questions for reflection
    prescriptive_suggestions TEXT, -- Teaching suggestions
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for aggregation performance
CREATE INDEX idx_sessions_session_id ON sessions(session_id);
CREATE INDEX idx_submissions_session_id ON submissions(session_id);
CREATE INDEX idx_feedback_submission_id ON feedback(submission_id);
CREATE INDEX idx_kaus_session_id ON kaus(session_id);
