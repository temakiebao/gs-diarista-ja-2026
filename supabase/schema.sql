-- ============================================================================
-- DIARISTAJÁ - SCHEMA DO BANCO DE DADOS & POLÍTICAS RLS (SUPABASE / POSTGRESQL)
-- ============================================================================

-- 1. Tabela de perfis básicos (vinculada ao auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null unique,
  telefone text,
  tipo_conta text not null default 'professional'
    check (tipo_conta in ('professional', 'admin', 'client')),
  created_at timestamptz not null default now()
);

-- 2. Tabela de dados profissionais
create table if not exists public.professionals (
  id uuid primary key references public.profiles(id) on delete cascade,
  descricao_experiencia text not null,
  cidade text not null,
  bairro text not null,
  valor_hora numeric(10, 2) not null check (valor_hora >= 0),
  servicos text[] not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'suspended')),
  created_at timestamptz not null default now()
);

-- Índices para consultas rápidas do painel admin e do aplicativo mobile
create index if not exists idx_professionals_status on public.professionals(status);
create index if not exists idx_professionals_cidade on public.professionals(cidade);

-- 3. Trigger para criar automaticamente o registro em public.profiles ao cadastrar no Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email, telefone, tipo_conta)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'telefone',
    coalesce(new.raw_user_meta_data->>'tipo_conta', 'professional')
  )
  on conflict (id) do update set
    nome = excluded.nome,
    telefone = coalesce(excluded.telefone, public.profiles.telefone);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Função auxiliar para verificar se o usuário autenticado é administrador
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and tipo_conta = 'admin'
  );
$$;

-- 5. Habilitar Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.professionals enable row level security;

-- ============================================================================
-- POLÍTICAS RLS: TABELA PROFILES
-- ============================================================================

drop policy if exists "Perfis de profissionais aprovados sao publicos" on public.profiles;
create policy "Perfis de profissionais aprovados sao publicos"
  on public.profiles for select
  using (
    exists (
      select 1 from public.professionals p
      where p.id = profiles.id and p.status = 'approved'
    )
  );

drop policy if exists "Usuario ve proprio perfil e admin ve todos" on public.profiles;
create policy "Usuario ve proprio perfil e admin ve todos"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Usuario insere proprio perfil" on public.profiles;
create policy "Usuario insere proprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id and tipo_conta <> 'admin');

drop policy if exists "Usuario atualiza proprio perfil" on public.profiles;
create policy "Usuario atualiza proprio perfil"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and (tipo_conta <> 'admin' or public.is_admin())
  );

-- ============================================================================
-- POLÍTICAS RLS: TABELA PROFESSIONALS
-- ============================================================================

-- App Mobile e visitantes públicos enxergam SOMENTE cadastros com status 'approved'
drop policy if exists "Apenas profissionais aprovados sao visiveis publicamente" on public.professionals;
create policy "Apenas profissionais aprovados sao visiveis publicamente"
  on public.professionals for select
  using (status = 'approved');

-- Profissional vê o próprio cadastro (qualquer status) e Admin vê todos
drop policy if exists "Profissional ve proprio status e admin ve todos" on public.professionals;
create policy "Profissional ve proprio status e admin ve todos"
  on public.professionals for select
  using (auth.uid() = id or public.is_admin());

-- Profissional cria seu próprio registro obrigatoriamente como 'pending'
drop policy if exists "Profissional cria cadastro como pending" on public.professionals;
create policy "Profissional cria cadastro como pending"
  on public.professionals for insert
  with check (auth.uid() = id and status = 'pending');

-- Profissional pode editar seus dados descritivos, sem poder alterar o próprio status
drop policy if exists "Profissional edita dados mantendo status" on public.professionals;
create policy "Profissional edita dados mantendo status"
  on public.professionals for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and status = (select p.status from public.professionals p where p.id = auth.uid())
  );

-- Administrador pode aprovar, rejeitar ou suspender qualquer cadastro
drop policy if exists "Admin atualiza qualquer profissional" on public.professionals;
create policy "Admin atualiza qualquer profissional"
  on public.professionals for update
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- PROMOVER UM USUÁRIO A ADMINISTRADOR (EXECUTE APÓS CRIAR O USUÁRIO NO AUTH)
-- ============================================================================
-- update public.profiles
-- set tipo_conta = 'admin'
-- where email = 'admin@diaristaja.com';
