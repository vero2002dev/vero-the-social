-- =================================================================
-- FUNCTION: handle_new_swipe (The Matchmaker)
-- Lógica atômica para registrar Swipe e criar Match se recíproco
-- =================================================================

CREATE OR REPLACE FUNCTION handle_new_swipe(
  target_id UUID,
  interaction_type interaction_type
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  existing_like BOOLEAN;
  new_connection_id UUID;
  result JSONB;
BEGIN
  -- 1. Registrar a interação (Swipe)
  INSERT INTO public.profile_interactions (actor_id, target_id, interaction_type)
  VALUES (current_user_id, target_id, interaction_type)
  ON CONFLICT (actor_id, target_id) DO NOTHING;

  -- Se for PASS, acabou aqui.
  IF interaction_type = 'pass' THEN
    RETURN jsonb_build_object('is_match', false);
  END IF;

  -- 2. Verificar se o outro já deu LIKE (Reciprocidade)
  SELECT EXISTS (
    SELECT 1 FROM public.profile_interactions
    WHERE actor_id = target_id
      AND target_id = current_user_id
      AND interaction_type IN ('like', 'superlike')
  ) INTO existing_like;

  -- 3. Se deu MATCH!
  IF existing_like THEN
    -- Criar a Conexão (Chat Room)
    INSERT INTO public.connections (connection_type, status, initiated_by)
    VALUES ('one_to_one', 'matched', current_user_id)
    RETURNING id INTO new_connection_id;

    -- Adicionar os membros (Eu e Ela)
    INSERT INTO public.connection_members (connection_id, profile_id, role)
    VALUES 
      (new_connection_id, current_user_id, 'single'), -- Simplificado
      (new_connection_id, target_id, 'single');

    RETURN jsonb_build_object(
      'is_match', true, 
      'connection_id', new_connection_id
    );
  END IF;

  RETURN jsonb_build_object('is_match', false);
END;
$$;
