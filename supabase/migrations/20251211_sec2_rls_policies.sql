    -- =============================================
-- SEC.2: Enable RLS and Deny Public Access
-- Migration: 2025-12-11
-- Description: Protect PII tables from unauthorized access
-- =============================================

-- =============================================
-- 1. vault_notify_subscriptions
-- Stores: recipient_email (PII)
-- =============================================

ALTER TABLE vault_notify_subscriptions ENABLE ROW LEVEL SECURITY;

-- Deny all access via anon key (public access)
-- Service Role key bypasses RLS automatically
CREATE POLICY "Deny public select on vault_notify_subscriptions"
ON vault_notify_subscriptions FOR SELECT
TO anon
USING (false);

CREATE POLICY "Deny public insert on vault_notify_subscriptions"
ON vault_notify_subscriptions FOR INSERT
TO anon
WITH CHECK (false);

CREATE POLICY "Deny public update on vault_notify_subscriptions"
ON vault_notify_subscriptions FOR UPDATE
TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny public delete on vault_notify_subscriptions"
ON vault_notify_subscriptions FOR DELETE
TO anon
USING (false);

-- =============================================
-- 2. emergency_contacts
-- Stores: contact_email (PII)
-- =============================================

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny public select on emergency_contacts"
ON emergency_contacts FOR SELECT
TO anon
USING (false);

CREATE POLICY "Deny public insert on emergency_contacts"
ON emergency_contacts FOR INSERT
TO anon
WITH CHECK (false);

CREATE POLICY "Deny public update on emergency_contacts"
ON emergency_contacts FOR UPDATE
TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny public delete on emergency_contacts"
ON emergency_contacts FOR DELETE
TO anon
USING (false);

-- =============================================
-- Verification Query (run after migration)
-- =============================================
-- SELECT schemaname, tablename, policyname, cmd 
-- FROM pg_policies 
-- WHERE tablename IN ('vault_notify_subscriptions', 'emergency_contacts', 'vault_contacts');

-- =============================================
-- 3. vault_contacts
-- Stores: owner_email, recipient_email (PII)
-- Added: 2025-12-11 (SEC.2b)
-- =============================================

ALTER TABLE vault_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny public select on vault_contacts"
ON vault_contacts FOR SELECT
TO anon
USING (false);

CREATE POLICY "Deny public insert on vault_contacts"
ON vault_contacts FOR INSERT
TO anon
WITH CHECK (false);

CREATE POLICY "Deny public update on vault_contacts"
ON vault_contacts FOR UPDATE
TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny public delete on vault_contacts"
ON vault_contacts FOR DELETE
TO anon
USING (false);
