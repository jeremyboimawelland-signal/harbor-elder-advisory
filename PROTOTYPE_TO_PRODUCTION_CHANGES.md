# From Prototype to Production: What Changed and Why

This document exists because the original `ElderCareDashboard.jsx` was built as a
**single-file interactive artifact** for the Claude.ai preview environment, not as
deployable application code. Several of its patterns work *only* inside that
sandbox. This list is the complete account of every place this Lovable export
deviates from the original file, so nothing gets silently lost or reintroduced
incorrectly later.

## 1. The Claude API call — the most important change

**Original:** `callClaude()` called `fetch("https://api.anthropic.com/v1/messages")`
directly from the browser, with no API key anywhere in the code.

**Why it worked there:** The Claude.ai artifact preview intercepts that exact URL
and injects authentication invisibly, specifically to let artifacts demo AI
features without exposing a key.

**Why it can't work in Lovable or production:** Outside that sandbox, this fetch
either fails outright (no key) or — if someone "fixed" it by hardcoding a key —
would ship a live Anthropic API key to every visitor's browser, where anyone
could extract it from devtools and run up your bill or worse.

**What replaced it:** `supabase/functions/agent-chat/index.ts`, a Supabase Edge
Function (Deno) that holds `ANTHROPIC_API_KEY` as a server-side secret.
`src/lib/agentApi.js` calls it via `supabase.functions.invoke("agent-chat", ...)`.
The five agent system prompts and the orchestrator synthesis prompt were moved
into `supabase/functions/agent-chat/prompts.ts`, copied verbatim from the
original `AGENT_SYSTEM_PROMPTS` / `ORCHESTRATOR_SYNTHESIS_PROMPT` constants —
not one word changed, since those prompts were already carefully scoped
(word limits, mandatory disclaimers, the cross-agent Medicaid look-back guard).

## 2. Browser-local storage → real Supabase tables

**Original:** Every piece of state — financials, documents, legal document
status, the decision log, consultant notes, the audit log, chat history, tour
checklists, condition flags, downsizing steps — lived in `window.storage`, a
key-value store scoped to the artifact session.

**Why it can't work in Lovable:** `window.storage` doesn't exist outside the
Claude.ai artifact runtime. There is no equivalent global in a normal browser or
in Lovable's preview.

**What replaced it:** A full relational schema (`supabase/migrations/0001_initial_schema.sql`)
with one table per concern, and a matching React hook per table in `src/hooks/`
(`useFinancials`, `useDocuments`, `useDecisionLog`, etc.) that replicate each
`useStoredState(...)` call's read/write contract as closely as possible so the
component code reading from them needed minimal changes.

## 3. Three real bugs fixed during the port, not introduced by it

These were identified during the original dashboard's own QA pass (documented in
this conversation's earlier turns) and are fixed at the schema/RLS level here,
not just patched in the UI:

- **Tour Huddle cross-client leak:** the original keyed checklist state by
  `tour-${facility.id}` alone, so two different clients touring the same
  facility shared the same checked-off state. Fixed via the `(client_id,
  facility_id)` unique constraint on `tour_checklists` in migration 0001.
- **Audit log had no setter:** `const [auditLog] = useStoredState(...)` meant
  the audit log could never actually grow despite the UI implying live logging.
  Fixed: `useAuditLog.js` exposes a real `logAction()` mutator, called from
  `useDocuments`, `useConsultantNotes`, and `ConsultantTab`'s brief export.
- **Dead "New client" and "Export brief" buttons:** both had no `onClick` in an
  earlier draft of the prototype. Both are wired to real handlers here
  (`useClients.createClient`, `ConsultantTab.exportBrief`).

## 4. RBAC: UI convention → enforced database policy

**Original:** The OBSERVER role's restrictions (can't add Decision Log entries,
can't upload documents) were enforced by hiding buttons in React. A technically
sophisticated OBSERVER-role sibling could still have called the underlying
storage write directly, since nothing actually blocked it.

**What replaced it:** Row Level Security policies in migration 0001
(`can_edit_client()` helper function, used on every write policy) are the real
boundary now. The UI still hides the composer for OBSERVER — that's preserved
from the original design intent ("not just disabled... hidden entirely") — but
it's now a courtesy on top of a real enforcement layer, not the only layer.
Similarly, `consultant_notes` RLS policies ensure that table is **never**
readable by a client-role user under any circumstance, including a coding
mistake in the frontend — the original only kept it out of the client-facing
tab list.

## 5. Inline styles → Tailwind

**Original:** Every component used a `style={{...}}` object referencing a `T`
palette constant and string-concatenated font stacks.

**Why it changed:** Lovable-generated and Lovable-edited code is overwhelmingly
Tailwind-based; mixing inline styles throughout makes future Lovable-assisted
edits to this codebase harder, not easier. `tailwind.config.js` defines the exact
same palette as custom color tokens (`ink`, `copper`, `sage`, etc.) so visual
output is unchanged, but every component now uses className strings.

## 6. Fake login → real Supabase Auth

**Original:** `<RoleGate>` had two buttons — "Continue as Sarah Donnelly" and
"Continue as Consultant" — that just set local React state. There was no
authentication at all.

**What replaced it:** `LoginScreen.jsx` uses Supabase magic-link auth
(`signInWithOtp`). `useAuth.js` derives the client/admin role from whether the
signed-in user appears as `consultant_user_id` on any row in `clients`, rather
than from a button click. See the README's note on the preserved `switchRole()`
demo convenience and why it must be removed before going live.

## 7. What was deliberately left as a stub

A few pieces from the original MRDs were never implemented even in the
prototype (it was explicitly a UI/UX demo, not a backend), and remain stubs
here too — ported faithfully rather than silently expanded in scope:

- **OCR / document extraction** (`useDocuments.simulateUpload`) still simulates
  the Processing → Processed transition with a timer and a fixed lookup table of
  extracted fields, rather than calling a real OCR service. See the README.
- **CMS Care Compare live sync** — `facilities` is reference data the frontend
  reads, populated by a job described in `docs/CMS_SYNC_NOTES.md`, not built here.
- **PandaDoc e-signature integration** — `legal_documents.pandadoc_document_id`
  exists as a column to receive this later; no PandaDoc API calls are wired in.
- **Geocoded distance sort** for facilities — falls back to name order; see
  `docs/CMS_SYNC_NOTES.md` for the two-step fix.

None of these were fully spec'd with working code in the original prototype
either — they were either static seed data or explained in code comments as
"would be wired in here." This port does not regress anything that worked
before; it makes the gaps explicit and documented instead of implicit.
