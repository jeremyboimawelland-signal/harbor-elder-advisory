-- ============================================================
-- Demo seed data — mirrors SEED_CLIENTS / FINANCIAL_SEED / DOCS_SEED /
-- FACILITIES_SEED from the original ElderCareDashboard.jsx prototype,
-- so the Lovable preview has the same three demo clients to click through.
--
-- NOTE: clients.owner_user_id and consultant_user_id reference auth.users,
-- which won't exist until real accounts are created. Run this AFTER you've
-- created at least one consultant account in Supabase Auth, then replace
-- the placeholder UUID below with that user's real id.
-- ============================================================

-- Replace this with a real auth.users.id before running, or this insert will fail
-- the foreign key constraint. In Lovable: Authentication tab → Users → copy the UUID.
-- do $$
-- declare
--   demo_consultant_id uuid := 'REPLACE-WITH-REAL-AUTH-USER-UUID';
-- begin
--   ...
-- end $$;

-- The block below is left as a template using a placeholder. Uncomment and fill in
-- real UUIDs once you have at least one Supabase Auth user for the consultant.

/*
insert into clients (id, owner_user_id, consultant_user_id, name, location, status, risk_level, created_at, last_activity_at) values
  ('11111111-1111-1111-1111-111111111111', 'REPLACE-WITH-REAL-AUTH-USER-UUID', 'REPLACE-WITH-REAL-AUTH-USER-UUID', 'Sarah Donnelly', 'Wauwatosa, WI', 'active', 'High', '2026-04-02', '2026-06-21'),
  ('22222222-2222-2222-2222-222222222222', 'REPLACE-WITH-REAL-AUTH-USER-UUID', 'REPLACE-WITH-REAL-AUTH-USER-UUID', 'James Whitfield', 'Madison, WI', 'active', 'Medium', '2026-05-14', '2026-06-19'),
  ('33333333-3333-3333-3333-333333333333', 'REPLACE-WITH-REAL-AUTH-USER-UUID', 'REPLACE-WITH-REAL-AUTH-USER-UUID', 'Priya Nair', 'Brookfield, WI', 'onboarding', 'Low', '2026-06-20', '2026-06-22');

insert into principals (client_id, name, role, age, conditions) values
  ('11111111-1111-1111-1111-111111111111', 'Robert Donnelly', 'Father', 78, '["Hospice-pending", "Incurable illness"]'),
  ('11111111-1111-1111-1111-111111111111', 'Eleanor Donnelly', 'Mother', 76, '["Early-onset dementia", "Post-surgical recovery"]'),
  ('22222222-2222-2222-2222-222222222222', 'Dorothy Whitfield', 'Mother', 84, '["Mobility decline"]'),
  ('33333333-3333-3333-3333-333333333333', 'Anand Nair', 'Father', 81, '[]');

insert into client_roles (client_id, name, role, engagement, location) values
  ('11111111-1111-1111-1111-111111111111', 'Michael Donnelly', 'OBSERVER', 'Low', 'Denver, CO'),
  ('22222222-2222-2222-2222-222222222222', 'Renee Whitfield-Cho', 'ADMIN', 'High', 'Madison, WI');

insert into financial_snapshot (client_id, monthly_income, monthly_expenses, cost_basis_real_estate, home_market_value_est, ira_beneficiary_designation) values
  ('11111111-1111-1111-1111-111111111111', 4850, 9200, 142000, 410000, 'non_spouse'),
  ('22222222-2222-2222-2222-222222222222', 3100, 5400, 88000, 0, null),
  ('33333333-3333-3333-3333-333333333333', 2600, 2600, 0, 0, null);

insert into liquid_assets (client_id, label, value, sort_order) values
  ('11111111-1111-1111-1111-111111111111', 'IRA (non-spouse beneficiary)', 300000, 0),
  ('11111111-1111-1111-1111-111111111111', 'Checking / savings', 38000, 1),
  ('11111111-1111-1111-1111-111111111111', 'Home equity (est., pre-sale)', 0, 2),
  ('22222222-2222-2222-2222-222222222222', 'Checking / savings', 96000, 0),
  ('22222222-2222-2222-2222-222222222222', 'CDs', 40000, 1),
  ('33333333-3333-3333-3333-333333333333', 'Savings', 61000, 0);

insert into documents (client_id, name, doc_type, status, uploaded_at) values
  ('11111111-1111-1111-1111-111111111111', 'Robert_Donnelly_Medicare_Card.pdf', 'Medicare', 'Processed', '2026-04-03'),
  ('11111111-1111-1111-1111-111111111111', 'Home_Deed_Wauwatosa.pdf', 'Real Estate', 'Processed', '2026-04-10'),
  ('11111111-1111-1111-1111-111111111111', 'IRA_Statement_Q1.pdf', 'Financial', 'Processed', '2026-04-12'),
  ('11111111-1111-1111-1111-111111111111', 'Eleanor_Dementia_Diagnosis_Letter.pdf', 'Medical', 'Needs Review', '2026-05-02'),
  ('22222222-2222-2222-2222-222222222222', 'Dorothy_POA_Draft_v1.pdf', 'Legal', 'Processed', '2026-05-15');

insert into legal_documents (client_id, name, form_reference, status, signers) values
  ('11111111-1111-1111-1111-111111111111', 'Durable Power of Attorney (Financial) — Eleanor Donnelly', 'WI Ch. 244', 'Drafted', '["Principal", "Witness 1", "Witness 2", "Agent"]'),
  ('11111111-1111-1111-1111-111111111111', 'Healthcare Power of Attorney — Robert Donnelly', 'WI Form F-00085', 'Awaiting Signatures', '["Principal", "Witness 1", "Witness 2", "Agent"]'),
  ('11111111-1111-1111-1111-111111111111', 'HIPAA Authorization — Eleanor Donnelly', 'Federal', 'Not Started', '["Principal"]');

insert into decision_log (client_id, actor_name, entry_text, created_at) values
  ('11111111-1111-1111-1111-111111111111', 'Sarah Donnelly', 'Approved Lakeview Memory Care for tour — added to shortlist.', '2026-06-18'),
  ('11111111-1111-1111-1111-111111111111', 'Sarah Donnelly', 'Began Healthcare POA draft for Eleanor with assigned attorney review.', '2026-06-10');
*/

-- ---------- Facilities are global reference data, not client-scoped — safe to seed directly ----------
insert into facilities (name, address, care_type, overall_rating, health_inspection_rating, staffing_rating, quality_measures_rating, abuse_flag, special_focus_facility, latitude, longitude) values
  ('Lakeview Memory Care', '4500 Lake Dr, Wauwatosa, WI', 'memory', 4, 4, 4, 5, false, false, 43.0494, -88.0426),
  ('Maple Grove Senior Living', '210 Maple Ave, Wauwatosa, WI', 'assisted', 2, 2, 3, 2, true, false, 43.0512, -88.0398),
  ('Hilltop Rehabilitation & Care', '88 Hilltop Rd, Milwaukee, WI', 'skilled', 3, 3, 2, 4, false, true, 43.0389, -87.9065),
  ('Sienna Gardens Assisted Living', '17 Sienna Ct, Wauwatosa, WI', 'assisted', 5, 5, 4, 5, false, false, 43.0467, -88.0511),
  ('Harborview Hospice Residence', '900 Harborview Pl, Wauwatosa, WI', 'hospice', 4, 4, 5, 4, false, false, 43.0501, -88.0350);
