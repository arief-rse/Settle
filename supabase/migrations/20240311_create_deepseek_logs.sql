-- Create the deepseek_logs table
create table public.deepseek_logs (
    id uuid default gen_random_uuid() primary key,
    user_id text not null,
    request jsonb,
    response jsonb,
    error text,
    status integer not null,
    duration_ms integer not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS policies
alter table public.deepseek_logs enable row level security;

-- Users can only read their own logs
create policy "Users can view own logs" 
    on public.deepseek_logs for select 
    using (auth.uid()::text = user_id);

-- Edge function can insert logs for any user
create policy "Edge function can insert logs" 
    on public.deepseek_logs for insert 
    to service_role 
    with check (true); 