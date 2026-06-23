# CMS Care Compare Sync — Implementation Notes

The `facilities` table (migration `0001_initial_schema.sql`) is reference data the
app reads from. It is **not** populated by the frontend, and the frontend never
calls `data.cms.gov` directly. This avoids hitting CMS rate limits on every page
load and keeps facility search fast and offline-tolerant.

## Recommended approach

Build a small scheduled job (a second Supabase Edge Function, triggered by
`pg_cron` or Supabase's Cron Jobs feature) that:

1. Queries `https://data.cms.gov/data-api/v1/dataset/provider-info/data`, filtered
   by the ZIP codes / counties your active clients are in.
2. Extracts: `overall_rating`, `health_inspection_rating`, `staffing_rating`,
   `provider_name`, `provider_address`, plus — critically, since these were
   identified as missing from the original spec during competitive research —
   the **abuse-icon flag** and **Special Focus Facility** status. Both are
   stronger red flags than a routine low star rating and are surfaced as
   distinct UI badges (see `FacilityRow.jsx`), not folded into `health_inspection_rating`.
3. Upserts into the `facilities` table, matched on `cms_provider_id` (the CCN).
4. Updates `last_synced_at`.

## Why this matters for the abuse-flag / SFF distinction

CMS caps a facility's health inspection rating at 2 stars when there's a
harm-level abuse citation — meaning a facility with a *routine* 2-star rating and
a facility *capped* at 2 stars due to abuse look identical if you only store the
numeric rating. Make sure your sync job captures the abuse-icon flag as its own
boolean field (`abuse_flag`), not derived after the fact from the rating number.

## Geocoding for distance sort

`useFacilities.js` currently falls back to name-order when `sortBy === "distance"`
because there's no live distance calculation against the client's address yet.
To complete this:

1. Geocode each client's `location` field (e.g. via Google Geocoding API or a
   free alternative) and store `latitude`/`longitude` on the `clients` table.
2. Compute distance client-side using the Haversine formula against
   `facilities.latitude` / `facilities.longitude`, or push the calculation into
   a Postgres function using the PostGIS extension if you want it server-side
   and indexed.

## Suggested cron frequency

CMS refreshes Care Compare data roughly monthly. A nightly sync is more than
sufficient and avoids any risk of hitting CMS's API rate limits.
