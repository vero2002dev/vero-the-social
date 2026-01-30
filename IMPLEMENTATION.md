# VERO - Implementation Guide

Este guia detalha como implementar o VERO do zero ao deploy.

## 📋 Checklist de Implementação

### Fase 1: Setup Inicial ✅
- [x] Criar projeto Supabase
- [x] Executar migrations SQL
- [x] Criar storage buckets
- [x] Configurar .env.local
- [x] Instalar dependências npm

### Fase 2: Componentes Base (A IMPLEMENTAR)
- [ ] shadcn/ui components restantes
- [ ] Componentes shared (AppShell, ProfileCard, etc.)
- [ ] Hooks personalizados

### Fase 3: Páginas Públicas (A IMPLEMENTAR)
- [ ] Landing page (welcome carousel)
- [ ] Login/Signup pages
- [ ] Onboarding flow

### Fase 4: Verificação (A IMPLEMENTAR)
- [ ] Verification introduction/instructions
- [ ] Camera capture + upload
- [ ] Verification required gate

### Fase 5: App Principal (A IMPLEMENTAR)
- [ ] App shell com bottom nav
- [ ] Intent page
- [ ] Explore page
- [ ] Chats page + conversation view
- [ ] Profile settings

### Fase 6: Admin (A IMPLEMENTAR)
- [ ] Admin dashboard
- [ ] Verification queue
- [ ] Photo review
- [ ] Reports
- [ ] User management (strikes/ban)

### Fase 7: API Routes (A IMPLEMENTAR)
- [ ] Signed URL generation
- [ ] Admin actions (approve/reject)
- [ ] File uploads

### Fase 8: Testing & Deploy
- [ ] Test local completo
- [ ] Deploy para Netlify
- [ ] Configurar domínio
- [ ] Test produção

---

## 🗂️ Ficheiros Já Criados

### ✅ Configuração Base
```
vero-app/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── .env.example
├── .gitignore
└── README.md
```

### ✅ Supabase
```
src/lib/supabase/
├── client.ts        # Browser client
├── server.ts        # Server client + service role
```

### ✅ Middleware
```
src/middleware.ts    # Auth + verification gate
```

### ✅ Utils
```
src/lib/utils/
├── cn.ts           # Class name merger
├── storage.ts      # Signed URLs, upload, delete
└── compatibility.ts # Match logic
```

### ✅ Types
```
src/types/
├── database.types.ts # Supabase types (placeholder)
└── index.ts         # Custom types
```

### ✅ UI Components
```
src/components/ui/
├── button.tsx
├── input.tsx
├── card.tsx
└── badge.tsx
```

### ✅ Globals
```
src/app/
├── globals.css
└── layout.tsx
```

### ✅ SQL Migrations
```
supabase/migrations/
├── 20240101000000_initial_schema.sql
├── 20240101000001_rls_policies.sql
├── 20240101000002_storage_policies.sql
└── 20240101000003_seed_intents.sql
```

---

## 🚧 Próximos Passos

### 1. Componentes UI Restantes (shadcn/ui)

Criar estes componentes na pasta `src/components/ui/`:

- `dialog.tsx` - Para modais
- `dropdown-menu.tsx` - Para menus
- `tabs.tsx` - Para navegação em tabs
- `textarea.tsx` - Para bio
- `label.tsx` - Para formulários

Podes usar o shadcn/ui CLI:

```bash
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add label
```

### 2. Componentes Shared

Criar na pasta `src/components/shared/`:

#### `AppShell.tsx`
```tsx
- Bottom navigation (Intent, Explore, Chats, Profile)
- Header com título
- Background gradients (conforme Stitch)
```

#### `ProfileCard.tsx`
```tsx
- Exibe perfil de uma presença
- Avatar + nome + bio
- Badge de profile type (Single/Couple)
- Connection type tag
- Connect button
```

#### `VerifiedBadge.tsx`
```tsx
- Ícone check circle com fill
- Cor teal
- Tooltip "Verified"
```

#### `IntentPicker.tsx`
```tsx
- Grid de intents
- Fetch de `intents` table
- Select active intent
- Update profile
```

#### `DynamicsChips.tsx`
```tsx
- Toggles para 1→1, 2→1, 1→2, Group
- Update `accepted_dynamics` JSON
```

#### `ConnectButton.tsx`
```tsx
- Cria connection (pending)
- Lógica: inserir em `connections` + `connection_members`
```

#### `ReportModal.tsx`
```tsx
- Dialog com form
- Insert em `reports` table
```

### 3. Páginas

Criar na ordem:

#### `src/app/page.tsx` - Welcome Carousel
```tsx
- 4 slides (ver stitch welcome_to_vero_1/2/3/4)
- Botão "Get Started" → /auth/signup
```

#### `src/app/auth/login/page.tsx`
```tsx
- Email + Password
- Supabase signInWithPassword
- Redirect para /app/intent (se verified) ou /verification/required
```

#### `src/app/auth/signup/page.tsx`
```tsx
- Email + Password
- Supabase signUp
- Redirect para /onboarding/choose-profile-type
```

#### `src/app/onboarding/choose-profile-type/page.tsx`
```tsx
- HTML do Stitch como referência
- 2 botões: "Sou Single" / "Somos 2"
- Update profile.profile_type
- Redirect para /onboarding/profile
```

#### `src/app/onboarding/profile/page.tsx`
```tsx
- Se single: display_name + bio
- Se couple: couple_name + bio
- Avatar upload
- Redirect para /onboarding/dynamics
```

#### `src/app/onboarding/dynamics/page.tsx`
```tsx
- DynamicsChips component
- Update accepted_dynamics
- Redirect para /onboarding/intent
```

#### `src/app/onboarding/intent/page.tsx`
```tsx
- IntentPicker component
- Update active_intent_id
- Redirect para /verification/introduction
```

#### `src/app/verification/introduction/page.tsx`
```tsx
- Explicação do processo
- "Continue" → /verification/instructions
```

#### `src/app/verification/instructions/page.tsx`
```tsx
- Instruções específicas
- "Start Verification" → /verification/submit
```

#### `src/app/verification/submit/page.tsx`
```tsx
- Upload selfie
- Upload proof (video ou imagens)
- Insert em verification_requests
- Redirect para /verification/pending
```

#### `src/app/verification/pending/page.tsx`
```tsx
- Loading state
- "Your verification is being reviewed"
- Poll verification_status ou usar realtime
```

#### `src/app/verification/required/page.tsx`
```tsx
- Gate para unverified users
- "Verification required to access VERO"
- Link para re-submit se rejected
```

#### `src/app/app/layout.tsx`
```tsx
- AppShell component
- Verificar se user é verified (middleware já faz isso)
```

#### `src/app/app/intent/page.tsx`
```tsx
- Mostrar active intent
- Lista de matches compatíveis (ver compatibility.ts)
- Connect buttons
```

#### `src/app/app/explore/page.tsx`
```tsx
- Lista de todas as presenças verified
- Filtrar por compatibility
- ProfileCards
```

#### `src/app/app/chats/page.tsx`
```tsx
- Lista de connections (status = matched)
- Último message de cada
- Redirect para /app/chats/[connectionId]
```

#### `src/app/app/chats/[connectionId]/page.tsx`
```tsx
- Messages query (real-time)
- Chat input
- Send message
```

#### `src/app/app/profile/page.tsx`
```tsx
- Ver/editar perfil
- Gallery photos
- Settings
- Logout
```

### 4. Admin Pages

#### `src/app/admin/verifications/page.tsx`
```tsx
- Lista pending verification_requests
- Approve/Reject buttons
- Admin notes
```

#### `src/app/admin/photos/page.tsx`
```tsx
- Lista gallery_photos (status = pending_review)
- Approve/Reject
```

#### `src/app/admin/reports/page.tsx`
```tsx
- Lista reports (resolved_at IS NULL)
- Ver detalhes
- Apply action (warning/strike/ban)
```

#### `src/app/admin/users/page.tsx`
```tsx
- Lista profiles
- Ver strikes
- Apply strike/ban
```

### 5. API Routes

#### `src/app/api/storage/signed-url/route.ts`
```ts
// POST /api/storage/signed-url
// Body: { bucket, path }
// Returns: { signedUrl }
export async function POST(request: Request) {
  const { bucket, path } = await request.json();
  const signedUrl = await getSignedUrl(bucket, path);
  return Response.json({ signedUrl });
}
```

#### `src/app/api/admin/verify/route.ts`
```ts
// POST /api/admin/verify
// Body: { requestId, action: 'approve' | 'reject', notes }
// Admin only
export async function POST(request: Request) {
  // Verificar is_admin()
  // Update verification_request
  // Update profile.verification_status
  // Lock avatar se approved
  return Response.json({ success: true });
}
```

---

## 🎨 Design Reference (Stitch)

Os ficheiros HTML no `stitch_choose_profile_type/` são a referência para:

- Layout
- Spacing
- Typography
- Colors
- Animations

Converter o HTML para componentes React/Tailwind mantendo:
- Classes Tailwind
- Estrutura de divs
- Gradientes de background
- Efeitos hover

---

## 🔑 Dados de Teste

### Intents (já seeded)
```sql
SELECT * FROM intents;
```

### Criar Perfis de Teste

```sql
-- Single
INSERT INTO profiles (id, profile_type, display_name, bio, verification_status, active_intent_id)
VALUES (
  'user-uuid-here',
  'single',
  'Ana Silva',
  'Looking for genuine connections',
  'verified',
  (SELECT id FROM intents WHERE key = 'meet')
);

-- Couple
INSERT INTO profiles (id, profile_type, couple_name, bio, verification_status, active_intent_id)
VALUES (
  'couple-uuid-here',
  'couple',
  'João & Maria',
  'Exploring together',
  'verified',
  (SELECT id FROM intents WHERE key = 'explore')
);
```

---

## 🚀 Deploy Netlify

### 1. Preparar Repo
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo>
git push -u origin main
```

### 2. Configurar Netlify

1. Ir para [app.netlify.com](https://app.netlify.com)
2. "Add new site" → "Import existing project"
3. Connect ao GitHub
4. Selecionar repo

Build settings:
- Build command: `npm run build`
- Publish directory: `.next`

Environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAILS`

### 3. Deploy

Netlify faz deploy automático em cada push para main.

---

## 🐛 Troubleshooting

### Build fails no Netlify

Verificar:
- Node version (18+)
- Env vars corretos
- `npm install` funciona local
- Migrations foram executadas no Supabase

### RLS errors

Verificar:
- Policies estão ativas
- User está autenticado
- User tem permissões corretas

### Images não carregam

Verificar:
- Storage policies corretas
- Signed URLs não expiraram
- Bucket name correto

---

## 📞 Support

Para questões ou bugs, contactar a equipa de desenvolvimento.
