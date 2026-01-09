-- Migration script to fix existing offer PDF public IDs
-- Cloudinary stores authenticated raw files WITH .pdf extension
-- This script adds .pdf extension to public IDs that are missing it

-- Update offers where pdf_public_id doesn't end with .pdf
UPDATE offers 
SET pdf_public_id = pdf_public_id || '.pdf' 
WHERE pdf_public_id IS NOT NULL 
  AND pdf_public_id NOT LIKE '%.pdf'
  AND pdf_public_id != '';

-- Optional: Verify the update
-- SELECT id, pdf_public_id FROM offers WHERE pdf_public_id IS NOT NULL;

