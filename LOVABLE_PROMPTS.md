# Lovable Build Prompts — Sequenced

This export already contains a working implementation of everything below — use
these prompts in one of two ways:

- **Importing this export as-is:** paste it into a new Lovable project (via
  GitHub import or drag-and-drop, depending on what Lovable supports at the time
  you're reading this) and skip straight to Sprint 0's Supabase connection step.
  The prompts below are then mostly useful as a verification checklist.
- **Rebuilding from scratch inside Lovable's chat:** paste each sprint's prompt
  in order. Lovable will generate its own version of each piece — the prompts
  describe the *what*, and you can point Lovable at this export's specific files
  (schema, edge function, hooks) as reference for the *how* when its first
  attempt diverges.

Either way, do not skip Sprint 0 — every later sprint depends on the schema and
the edge function existing first.

---

## Sprint 0 — Foundation

```
Connect Supabase to this project. Then run the SQL migration in
supabase/migrations/0001_initial_schema.sql — it creates the full schema
(clients, principals, financial_snapshot, liquid_assets, documents,
legal_documents, facilities, tour_checklists, property_condition_flags,
downsizing_steps, decision_log, consultant_notes, audit_log, chat_messages,
client_roles, platform_config) with Row Level Security enabled on every
client-scoped table. Do not weaken or remove any RLS policy — in particular,
the consultant_notes table must never be readable by a non-consultant user,
and decision_log must only be writable by ADMIN-role users or the
client/consultant themselves, never by OBSERVER-role family members.
```

## Sprint 1 — Auth & Roster

```
Build the login screen using Supabase magic-link auth (signInWithOtp). After
sign-in, derive whether the user is a 'client' or 'admin' by checking whether
their user id appears as consultant_user_id on any row in the clients table —
if so they're an admin/consultant, otherwise they're a client. Build the
Client Roster screen for admin users: a searchable list of clients showing
name, location, status, risk level, and last activity, with a "New client"
button that opens a modal (name, location, initial risk level radio buttons)
and inserts a new row into clients.
```

## Sprint 2 — Financial Core (build this early — it's the differentiator)

```
Build the Overview tab: a household summary card showing each principal's
name, role, age, and flagged conditions; a five-phase roadmap checklist; and
the Burn Rate widget. The Burn Rate widget calculates
runwayMonths = totalLiquidAssets / (monthlyExpenses - monthlyIncome), shows
that number prominently, and flips to a red "Urgent Liquidity Alert" badge
when runwayMonths < 12. Below it, build an editable assets table (add/remove/
rename rows, edit monthly income and expenses) that writes to the
financial_snapshot and liquid_assets tables and recalculates the runway
number live as the user types.
```

## Sprint 3 — Domain Tabs & the Multi-Agent Chat

```
Build five domain tabs — Legal & Estate, Healthcare, Real Estate, Tax &
Wealth, and Family — each showing its own data (legal document tracker,
CMS facility search, property condition checklist, capital gains
calculator, decision log) plus a dark "agent boundaries" card summarizing
that domain's system prompt constraints in plain language.

Then build a Supabase Edge Function called agent-chat that accepts
{ agentKey, userText, contextNote } or { isSynthesis: true, userText,
subAgentResponses }, holds ANTHROPIC_API_KEY as a server secret (never in
frontend code), and calls api.anthropic.com/v1/messages server-side with
the appropriate system prompt, returning { text } or { error }. NEVER call
the Anthropic API directly from frontend code — it must go through this
Edge Function so the API key stays server-side.

Build the "Ask the Agents" chat tab: a keyword router that picks one or more
of the five domain agent keys from the user's question, calls agent-chat
once per matched agent in parallel, then makes one more agent-chat call with
isSynthesis: true to summarize how the answers relate. Show per-agent loading
states while calls are in flight, and a Retry button if any call fails.
```

## Sprint 4 — Family & Advocacy Layer

```
Add RBAC to the Family tab: client_roles rows have a role of ADMIN or
OBSERVER. Only ADMIN-role users (and the client/consultant themselves) can
insert into decision_log — enforce this with a Row Level Security policy,
not just by hiding the UI. Add a live "preview portal as ADMIN / OBSERVER"
radio toggle on the Family tab so a consultant can see exactly what an
OBSERVER-role family member's view looks like before granting them access.

On the Healthcare tab, when a user clicks "Build Tour Huddle" on a facility,
generate a dynamic question checklist based on that facility's CMS citations
(abuse flag, Special Focus Facility status) crossed with the household's
flagged health conditions, and persist the checked/unchecked state per
(client, facility) pair — not per facility alone, or two different clients
touring the same facility will see each other's progress.
```

## Sprint 5 — Document Assembly & Consultant Console

```
Build the Documents tab: a category-tagged upload flow (Financial, Medical,
Legal, Real Estate, Medicare) that simulates OCR extraction (or wires to a
real OCR service if you have one) and shows extracted fields when a
processed document is clicked.

Build the admin-only Consultant Notes tab — visible only when role is
'admin' AND the user is currently proxying into a client file. It must
never appear, under any circumstance, for a client-role user. Include: an
internal notes composer (writes to consultant_notes, RLS-restricted to the
assigned consultant only), an Attorney Handoff Brief that exports a
plain-text summary via a real file download, and a live Audit Log that
records every meaningful action (document uploads, legal status changes,
note additions, brief exports) for both client- and consultant-side actions.

Add a persistent banner that appears any time an admin is proxying into a
client's file, clearly naming the client and stating that actions are
logged. This banner must remain visible on every tab while proxying — it
is the primary safety/trust signal in the entire admin console.
```
