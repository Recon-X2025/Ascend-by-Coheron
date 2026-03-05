CREATE TABLE referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  referred_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_referrals_user_id ON referrals(user_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);