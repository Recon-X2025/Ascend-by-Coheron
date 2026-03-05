
CREATE TABLE applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  job_url TEXT,
  source TEXT,
  location TEXT,
  salary_range TEXT,
  status TEXT DEFAULT 'applied',
  notes TEXT,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_applications_profile ON applications(profile_id);
CREATE INDEX idx_applications_status ON applications(status);
