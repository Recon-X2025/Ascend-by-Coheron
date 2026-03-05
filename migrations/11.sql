
ALTER TABLE eula_acceptances ADD COLUMN age_verified INTEGER DEFAULT 0;
ALTER TABLE eula_acceptances ADD COLUMN age_verified_at TIMESTAMP;
