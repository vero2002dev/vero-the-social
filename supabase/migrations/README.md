# VERO - SQL Migrations

Este diretório contém todas as migrations SQL para o projeto VERO.

## Ordem de Execução

Execute as migrations **nesta ordem exata**:

1. `20240101000000_initial_schema.sql` - Schema inicial (tabelas, enums, constraints)
2. `20240101000001_rls_policies.sql` - Row-Level Security policies
3. `20240101000002_storage_policies.sql` - Supabase Storage buckets e policies
4. `20240101000003_seed_intents.sql` - Seed de intents predefinidos

## Como Executar

### Opção A: Supabase CLI (Recomendado)

```bash
# 1. Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# 2. Link ao projeto
supabase link --project-ref your-project-ref

# 3. Executar migrations
supabase db push

# Ou aplicar individualmente:
supabase db execute --file 20240101000000_initial_schema.sql
supabase db execute --file 20240101000001_rls_policies.sql
supabase db execute --file 20240101000002_storage_policies.sql
supabase db execute --file 20240101000003_seed_intents.sql
```

### Opção B: Supabase Dashboard

1. Ir para o projeto no [Supabase Dashboard](https://app.supabase.com)
2. Navegar para **SQL Editor**
3. Criar uma nova query
4. Copiar e colar o conteúdo de cada migration pela ordem
5. Executar (Run)

### Opção C: psql (Desenvolvimento Local)

```bash
# Se estiver a usar Supabase local
psql postgresql://postgres:postgres@localhost:54322/postgres -f 20240101000000_initial_schema.sql
psql postgresql://postgres:postgres@localhost:54322/postgres -f 20240101000001_rls_policies.sql
psql postgresql://postgres:postgres@localhost:54322/postgres -f 20240101000002_storage_policies.sql
psql postgresql://postgres:postgres@localhost:54322/postgres -f 20240101000003_seed_intents.sql
```

## Verificação

Após executar todas as migrations, verificar:

```sql
-- Ver todas as tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar intents (deve retornar 10)
SELECT COUNT(*) FROM intents;

-- Verificar RLS ativado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

## Primeiro Admin

Para adicionar o primeiro admin, após criar uma conta:

```sql
INSERT INTO admin_users (user_id, email, granted_by)
SELECT id, email, id
FROM auth.users
WHERE email = 'seu-email@exemplo.com';
```

## Reset (Cuidado!)

Para fazer reset completo do schema (desenvolvimento only):

```bash
# Via CLI
supabase db reset

# Ou SQL direto
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

## Notas Importantes

- **RLS está ativado em todas as tabelas** - apenas utilizadores autenticados com as permissões corretas podem aceder aos dados
- **Avatars ficam LOCKED após verificação** - não podem ser alterados
- **3 strikes = ban automático**
- **Apenas utilizadores verified podem ver outros perfis**
- **Storage buckets são PRIVATE** - usar signed URLs para acesso

## Troubleshooting

### Erro: "relation already exists"
As migrations já foram executadas. Fazer reset ou ignorar.

### Erro: "permission denied"
Verificar que está a usar a connection string correta e que tem permissões de admin.

### Erro: "function is_admin() does not exist"
Executar a migration 1 primeiro (initial_schema.sql).

### Storage policies não aplicam
Storage policies podem precisar ser criadas via Dashboard em alguns casos. Ver documentação do Supabase.
