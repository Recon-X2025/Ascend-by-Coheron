
CREATE TABLE eula_acceptances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  eula_version TEXT NOT NULL,
  accepted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  marketing_consent INTEGER DEFAULT 0,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_eula_user_version ON eula_acceptances(user_id, eula_version);
