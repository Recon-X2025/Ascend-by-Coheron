CREATE TABLE resume_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  job_title TEXT NOT NULL,
  company TEXT,
  job_description TEXT,
  tailored_content TEXT NOT NULL,
  match_score INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resume_versions_profile ON resume_versions(profile_id);