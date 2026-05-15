# Jonas Supabase Back-End Integration Design

## Context

The project has two app surfaces:

- `repositories/jonas`: the production Next.js app with Supabase auth, app routes, PWA metadata, and the current visual style.
- `repositories/jonas/files`: a Gemini/Vite prototype with mock data and a similar car-wash flow.

The Supabase project and `servicos` table already exist in the Supabase panel. This work will not create or migrate the database schema.

## Goals

- Keep the current Next.js design style unchanged.
- Wire the existing screens to reliable back-end logic.
- Keep all service data synchronized with the existing Supabase table.
- Add working report export behavior.
- Add a correction path for wrong service records.
- Reduce duplicated data calculations across pages.

## Data Contract

The app will use the existing `servicos` table with the columns already referenced by the code:

- `id`
- `placa`
- `tipo_lavagem`
- `andar`
- `local`
- `funcionario`
- `data_hora`
- `forma_pagamento`
- `valor`

The app will validate required fields before inserts and updates, normalize values where useful, especially plate and price, and only accept safe numeric or UUID record identifiers for updates/deletes.

## Architecture

Service-related database reads and calculations will move into a small shared module under `lib/services`.

Pages will use that module instead of duplicating Supabase query logic:

- `registro`: submits a validated record to Supabase.
- `dashboard`: reads services for today, week, or month and calculates totals.
- `atividades`: reads recent services and allows authenticated edit/delete correction.
- `relatorio`: reads a date range, calculates KPIs, revenue split, and lists services.
- `api/relatorio/csv`: exports the same date-range data as CSV.

## UI Scope

The visual style must remain aligned with the current Next.js app:

- Same route structure.
- Same color tokens from `app/globals.css`.
- Same mobile-first layout.
- No broad restyling from the Gemini prototype.

Gemini's prototype is treated as reference material only for missing workflow ideas, not as a replacement design.

## Error Handling

- Insert/update/delete failures should show a clear error on the page where the operation was attempted.
- Empty dashboard/report states should stay graceful.
- Export endpoints should validate dates and return a meaningful error when export data cannot be loaded.

## Testing And Verification

- Run unit tests, lint, and build after edits.
- Verify that missing API routes no longer break report export.
- Verify the app still compiles with the existing Next.js version.
