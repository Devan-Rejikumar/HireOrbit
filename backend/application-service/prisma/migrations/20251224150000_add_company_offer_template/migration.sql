-- CreateTable
CREATE TABLE IF NOT EXISTS "company_offer_templates" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "logo_url" TEXT,
    "signature_url" TEXT,
    "brand_color" TEXT,
    "font_family" TEXT,
    "header_text" TEXT,
    "intro_text" TEXT,
    "closing_text" TEXT,
    "footer_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_offer_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "company_offer_templates_company_id_key" ON "company_offer_templates"("company_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "company_offer_templates_company_id_idx" ON "company_offer_templates"("company_id");

