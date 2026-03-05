
CREATE TABLE role_fit_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  profile_id INTEGER NOT NULL,
  job_key TEXT NOT NULL,
  job_title TEXT,
  company TEXT,
  fit_score INTEGER NOT NULL,
  required_years_experience INTEGER,
  candidate_years_experience INTEGER,
  strong_matches TEXT,
  gaps_identified TEXT,
  fit_summary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_role_fit_assessments_user_id ON role_fit_assessments(user_id);
CREATE INDEX idx_role_fit_assessments_job_key ON role_fit_assessments(job_key);
CREATE UNIQUE INDEX idx_role_fit_assessments_user_job ON role_fit_assessments(user_id, job_key);
