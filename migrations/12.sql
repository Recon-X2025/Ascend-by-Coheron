
CREATE TABLE platform_referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  job_title TEXT,
  job_url TEXT,
  clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_platform_referrals_user ON platform_referrals(user_id);
CREATE INDEX idx_platform_referrals_platform ON platform_referrals(platform);

CREATE TABLE company_searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_url TEXT,
  searched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_company_searches_user ON company_searches(user_id);
