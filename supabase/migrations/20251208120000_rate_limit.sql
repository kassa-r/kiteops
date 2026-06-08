create table if not exists rate_limits (
  key text primary key,
  window_start bigint not null,
  request_count int not null
);

alter table rate_limits enable row level security;

create policy "Service role full access" on rate_limits
  for all
  to service_role
  using (true)
  with check (true);
