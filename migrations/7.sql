ALTER TABLE applications ADD COLUMN match_score INTEGER;
ALTER TABLE applications ADD COLUMN priority TEXT DEFAULT 'warm';
ALTER TABLE applications ADD COLUMN interview_date DATETIME;
ALTER TABLE applications ADD COLUMN contact_name TEXT;
ALTER TABLE applications ADD COLUMN follow_up_reminder BOOLEAN DEFAULT 0;
ALTER TABLE applications ADD COLUMN job_description TEXT;