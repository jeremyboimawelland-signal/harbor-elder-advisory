# Harbor Elder Advisory — Lovable Project Export

This is a full project port of the `ElderCareDashboard.jsx` interactive prototype
into a real, buildable React + Supabase application, structured the way Lovable
expects: multi-file components, a Tailwind theme instead of inline styles, real
database tables instead of browser-local mock state, and a server-side proxy for
the Claude API instead of the artifact-sandbox-only direct fetch.

**Read `docs/PROTOTYPE_TO_PRODUCTION_CHANGES.md` first** — it documents every
place this port had to deviate from the original prototype's code, and why.

## What's in this export

```
harbor-elder-advisory/
├── src/                         React app (Vite)
│   ├── components/              One folder per tab/feature, mirroring the prototype's tabs
│   ├── hooks/                   Supabase-backed data hooks (replace useStoredState)
│   ├── lib/                     Supabase client, agent API client, shared constants
│   └── styles/                  Tailwind entry point
├── supabase/
│   ├── migrations/              Full schema + RLS policies + demo seed data
│   └── functions/agent-chat/    Edge Function proxying the Claude API (holds the key server-side)
├── docs/                        This file, the CMS sync notes, and the prototype-diff doc
└── LOVABLE_PROMPTS.md           Sequenced prompts to paste into Lovable, sprint by sprint
```

## Setup

### 1. Connect Supabase in Lovable

In the Lovable editor, open the Supabase integration panel and connect (or create)
a Supabase project. Lovable will inject `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` automatically — you do not need to set these by hand
inside Lovable. (`.env.example` is provided for local development outside Lovable.)

### 2. Run the migrations

```bash
supabase link --project-ref your-project-ref
supabase db push
```

This runs both files in `supabase/migrations/` in order: the schema + RLS policies,
then the demo seed data. **Read the comments inside `0002_seed_demo_data.sql`
first** — the client/principal/financial seed rows are commented out by default
because they reference `auth.users` rows that don't exist until you've created at
least one real account. The facility reference data (5 demo facilities) seeds
unconditionally since it isn't user-scoped.

### 3. Deploy the agent-chat Edge Function

```bash
supabase functions deploy agent-chat
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-real-key
```

This is the single most important step that has no equivalent in the original
prototype. The dashboard's `callClaude()` function called
`fetch("https://api.anthropic.com/v1/messages")` directly from the browser — that
only works inside the Claude.ai artifact sandbox, which intercepts that exact URL
and injects auth invisibly. It will fail with no key (and would leak a key if one
were hardcoded) anywhere else, including in Lovable's preview. The Edge Function
in `supabase/functions/agent-chat/` is the real, secure replacement: it holds your
Anthropic API key as a server-side secret and exposes a safe endpoint
(`src/lib/agentApi.js` calls it via `supabase.functions.invoke`).

### 4. Create your first consultant account

Sign up through the app's login screen (magic link via Supabase Auth), then in
the Supabase dashboard go to Authentication → Users and copy that user's UUID.
Use it to fill in the placeholders in `0002_seed_demo_data.sql` if you want the
three demo clients (Sarah Donnelly, James Whitfield, Priya Nair) pre-loaded, or
just use the in-app "New client" button to create real ones from scratch.

### 5. Build, sprint by sprint

`LOVABLE_PROMPTS.md` breaks the remaining build work into the same five sprints
from the original build plan. Paste them into Lovable's chat one at a time —
the project structure already in this export should make most of them describe
work that's already done, but they're useful for any customization or for
re-deriving the structure if you're starting this in a fresh Lovable project
rather than importing this export directly.

## Local development (outside Lovable)

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project's URL + anon key
npm run dev
```

## A note on the "Switch role" button

`useAuth.js` includes a `switchRole()` function and `App.jsx` wires it to the
TopBar's "Switch role" button, matching the prototype's demo convenience for
toggling between client and consultant views without a second account. **This
should be removed or gated behind an internal feature flag before any real
client uses this app** — letting any signed-in user grant themselves consultant
access is fine for a demo and not fine in production. The real role gate is
RLS + the `consultant_user_id` / `owner_user_id` columns on `clients`, not this
button.

## A note on charting

`recharts` is included as a dependency (per the original build plan's intended
stack) but **not currently used** — `BurnRateWidget.jsx` ports the original
prototype's hand-rolled CSS bar chart (a flex row of styled `div`s) rather than
a recharts component, exactly matching what the prototype actually shipped. If
you want a richer burn-down chart with axes, tooltips, and zoom, recharts is
already installed and ready to swap in.

## A note on OCR / document upload

`useDocuments.js`'s `simulateUpload()` preserves the prototype's placeholder
behavior (random filename, a timed Processing → Processed transition) rather
than wiring real file storage and OCR, which was out of scope for this port.
See the comment block at the top of that file for the three concrete steps to
wire in real uploads via Supabase Storage + LlamaParse/Textract, matching the
original MRD's specified architecture.
