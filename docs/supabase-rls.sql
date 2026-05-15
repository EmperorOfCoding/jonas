alter table public.servicos enable row level security;

drop policy if exists "servicos_authenticated_select" on public.servicos;
drop policy if exists "servicos_authenticated_insert" on public.servicos;
drop policy if exists "servicos_authenticated_update" on public.servicos;
drop policy if exists "servicos_authenticated_delete" on public.servicos;

create policy "servicos_authenticated_select"
on public.servicos
for select
to authenticated
using (true);

create policy "servicos_authenticated_insert"
on public.servicos
for insert
to authenticated
with check (true);

create policy "servicos_authenticated_update"
on public.servicos
for update
to authenticated
using (true)
with check (true);

create policy "servicos_authenticated_delete"
on public.servicos
for delete
to authenticated
using (true);
