-- =================================================================
-- VERO: INTERAÇÕES (Swipes)
-- Rastreia quem curtiu ou passou quem
-- =================================================================

CREATE TYPE interaction_type AS ENUM ('like', 'pass', 'superlike');

CREATE TABLE IF NOT EXISTS profile_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  interaction_type interaction_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Evita duplo swipe no mesmo perfil
  UNIQUE(actor_id, target_id)
);

-- Index para performance na exclusão de candidatos (quem eu já vi)
CREATE INDEX idx_interactions_actor ON profile_interactions(actor_id);
CREATE INDEX idx_interactions_target ON profile_interactions(target_id);

-- RLS: Apenas dono pode criar, leitura depende do contexto
ALTER TABLE profile_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own interactions"
ON profile_interactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = actor_id);

CREATE POLICY "Users can view their own interactions"
ON profile_interactions FOR SELECT
TO authenticated
USING (auth.uid() = actor_id);
