-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "profiles" (
    "id" SERIAL NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "location" TEXT,
    "headline" TEXT,
    "summary" TEXT,
    "linkedin_url" TEXT,
    "resume_key" TEXT,
    "target_role" TEXT,
    "target_industry" TEXT,
    "career_goals" TEXT,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiences" (
    "id" SERIAL NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "start_date" TEXT,
    "end_date" TEXT,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education" (
    "id" SERIAL NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "degree" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "graduation_year" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" SERIAL NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" SERIAL NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "user_id" TEXT,
    "job_title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "job_url" TEXT,
    "source" TEXT,
    "location" TEXT,
    "salary_range" TEXT,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "notes" TEXT,
    "match_score" INTEGER,
    "priority" TEXT DEFAULT 'warm',
    "interview_date" TIMESTAMP(3),
    "contact_name" TEXT,
    "follow_up_reminder" BOOLEAN NOT NULL DEFAULT false,
    "job_description" TEXT,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" SERIAL NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "location" TEXT,
    "filters" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_versions" (
    "id" SERIAL NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "job_title" TEXT NOT NULL,
    "company" TEXT,
    "job_description" TEXT,
    "tailored_content" TEXT NOT NULL,
    "match_score" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "referral_code" TEXT NOT NULL,
    "referred_count" INTEGER NOT NULL DEFAULT 0,
    "converted_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eula_acceptances" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "eula_version" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "marketing_consent" INTEGER NOT NULL DEFAULT 0,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "age_verified" INTEGER NOT NULL DEFAULT 0,
    "age_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eula_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_consent_preferences" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "help_improve_ascend" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_consent_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_export_requests" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "download_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_export_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_deletion_requests" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduled_deletion_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_deletion_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_referrals" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "job_title" TEXT,
    "job_url" TEXT,
    "clicked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_searches" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "company_url" TEXT,
    "searched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_fit_assessments" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "job_key" TEXT NOT NULL,
    "job_title" TEXT,
    "company" TEXT,
    "fit_score" INTEGER NOT NULL,
    "required_years_experience" INTEGER,
    "candidate_years_experience" INTEGER,
    "strong_matches" TEXT,
    "gaps_identified" TEXT,
    "fit_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_fit_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "profiles_email_idx" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "profiles_user_id_idx" ON "profiles"("user_id");

-- CreateIndex
CREATE INDEX "experiences_profile_id_idx" ON "experiences"("profile_id");

-- CreateIndex
CREATE INDEX "education_profile_id_idx" ON "education"("profile_id");

-- CreateIndex
CREATE INDEX "skills_profile_id_idx" ON "skills"("profile_id");

-- CreateIndex
CREATE INDEX "applications_profile_id_idx" ON "applications"("profile_id");

-- CreateIndex
CREATE INDEX "applications_status_idx" ON "applications"("status");

-- CreateIndex
CREATE INDEX "applications_user_id_idx" ON "applications"("user_id");

-- CreateIndex
CREATE INDEX "saved_searches_profile_id_idx" ON "saved_searches"("profile_id");

-- CreateIndex
CREATE INDEX "resume_versions_profile_id_idx" ON "resume_versions"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_referral_code_key" ON "referrals"("referral_code");

-- CreateIndex
CREATE INDEX "referrals_user_id_idx" ON "referrals"("user_id");

-- CreateIndex
CREATE INDEX "referrals_referral_code_idx" ON "referrals"("referral_code");

-- CreateIndex
CREATE INDEX "eula_acceptances_user_id_eula_version_idx" ON "eula_acceptances"("user_id", "eula_version");

-- CreateIndex
CREATE INDEX "data_consent_preferences_user_id_idx" ON "data_consent_preferences"("user_id");

-- CreateIndex
CREATE INDEX "data_export_requests_user_id_idx" ON "data_export_requests"("user_id");

-- CreateIndex
CREATE INDEX "account_deletion_requests_user_id_idx" ON "account_deletion_requests"("user_id");

-- CreateIndex
CREATE INDEX "platform_referrals_user_id_idx" ON "platform_referrals"("user_id");

-- CreateIndex
CREATE INDEX "platform_referrals_platform_idx" ON "platform_referrals"("platform");

-- CreateIndex
CREATE INDEX "company_searches_user_id_idx" ON "company_searches"("user_id");

-- CreateIndex
CREATE INDEX "role_fit_assessments_user_id_idx" ON "role_fit_assessments"("user_id");

-- CreateIndex
CREATE INDEX "role_fit_assessments_job_key_idx" ON "role_fit_assessments"("job_key");

-- CreateIndex
CREATE UNIQUE INDEX "role_fit_assessments_user_id_job_key_key" ON "role_fit_assessments"("user_id", "job_key");

-- AddForeignKey
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education" ADD CONSTRAINT "education_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_fit_assessments" ADD CONSTRAINT "role_fit_assessments_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
