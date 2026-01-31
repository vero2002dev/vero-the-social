-- =================================================================
-- VERO: REPARAÇÃO PARTE 2 (Função de Admin)
-- Rode isto no SQL Editor se o "redirect" continuar acontecendo
-- =================================================================

-- Cria a função que o site usa para saber se você é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garante permissões
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO anon;
GRANT EXECUTE ON FUNCTION is_admin() TO service_role;
