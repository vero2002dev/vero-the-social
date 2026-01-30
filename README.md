# VERO

Premium platform for authentic connections. Built with Next.js 15, Supabase, and TailwindCSS.

## 🎯 Features

- **Verification Gate**: All users must verify before accessing the app
- **Profile Types**: Single (1 person) or Couple (joint profile)
- **Dynamics**: Support for 1→1, 2→1, 1→2, and group connections
- **Intent-Driven Matching**: Users set active intents to find compatible matches
- **Real-time Chat**: 1:1 and group conversations
- **Admin Dashboard**: Moderation queue for verifications, photos, and reports
- **3-Strike System**: Automated ban on 3rd strike

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **Database**: Supabase (Postgres)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (private buckets)
- **Deployment**: Netlify

## 📁 Project Structure

```
vero/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   │   ├── ui/          # shadcn/ui base components
│   │   └── shared/      # Custom shared components
│   ├── lib/             # Utilities and configs
│   │   ├── supabase/   # Supabase clients
│   │   └── utils/      # Helper functions
│   └── types/           # TypeScript types
├── supabase/
│   └── migrations/      # SQL migrations
└── public/              # Static assets
```

## 🚀 Getting Started

### 1. Prerequisites

- Node.js 18+
- npm 9+
- Supabase account ([app.supabase.com](https://app.supabase.com))

### 2. Supabase Setup

#### Create Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Create a new project
3. Save your project URL and anon key

#### Run Migrations

Navigate to SQL Editor in Supabase Dashboard and run migrations in order:

1. `supabase/migrations/20240101000000_initial_schema.sql`
2. `supabase/migrations/20240101000001_rls_policies.sql`
3. `supabase/migrations/20240101000002_storage_policies.sql`
4. `supabase/migrations/20240101000003_seed_intents.sql`

#### Create Storage Buckets

Go to Storage in Supabase Dashboard and create these buckets (all private):

- `avatars`
- `gallery`
- `verifications`

### 3. Local Development

#### Clone and Install

```bash
git clone <your-repo>
cd vero
npm install
```

#### Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_EMAILS=your-email@example.com
```

#### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. First Admin User

After creating your account, add yourself as admin via SQL:

```sql
INSERT INTO admin_users (user_id, email, granted_by)
SELECT id, email, id
FROM auth.users
WHERE email = 'your-email@example.com';
```

## 📝 Key Concepts

### Profile Types

- **Single**: Individual profile (1 person)
- **Couple**: Joint profile (2 people, 1 account)

### Verification Flow

1. User signs up → `unverified`
2. Submits selfie + proof → `pending`
3. Admin reviews → `verified` or `rejected`
4. If verified: avatar locks, can access app
5. If rejected: can re-submit

### Dynamics

Users select which connection types they accept:

- `1→1`: Single with single
- `2→1`: Couple seeking single
- `1→2`: Single seeking couple
- `Group`: 3+ people

### Matching Logic

Profiles are compatible if:

- Both are `verified`
- Both have `active_intent_id`
- Their `profile_type` + `accepted_dynamics` match
- Example: Single (accepts 1→1) + Single (accepts 1→1) → compatible

## 🎨 Design System

### Colors

- **Primary Black**: `#000000`
- **Signature Teal**: `#549B8C`
- **Surface Dark**: `#161c1b`

### Typography

- **Font**: Plus Jakarta Sans (400, 500, 600, 700)
- **Headings**: Bold, tracking-tight
- **Body**: Light, readable

### Components

All UI components follow VERO design system with:

- Dark mode (always on)
- Rounded corners (1rem default, 2rem lg)
- Teal accent color
- Subtle glow effects

## 🔒 Security

### Row-Level Security (RLS)

All tables have RLS enabled:

- Users can only see their own data
- Verified users can see other verified users
- Admins can see everything

### Storage Policies

All buckets are private:

- Users can upload to their own folders
- Signed URLs generated server-side
- 1-hour expiry by default

### Verification Gate

Middleware enforces verification status:

- Unverified users → redirected to `/verification/required`
- Cannot access `/app/*` routes until verified

## 📦 Deployment

### Netlify

1. Connect your repo to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy!

Build settings:

- Build command: `npm run build`
- Publish directory: `.next`

## 🛣️ Roadmap

### MVP (Current)

- [x] Authentication
- [x] Profile types (single/couple)
- [x] Verification gate
- [x] Intent system
- [x] Basic matching
- [x] 1:1 chat
- [x] Admin dashboard

### Future

- [ ] Group chats (3+ people)
- [ ] Photo gallery moderation
- [ ] Advanced matching algorithm
- [ ] Push notifications
- [ ] In-app reporting flow
- [ ] Couple account linking (2 separate logins)

## 🤝 Contributing

This is a private project. Contact the team for contribution guidelines.

## 📄 License

Proprietary. All rights reserved.
