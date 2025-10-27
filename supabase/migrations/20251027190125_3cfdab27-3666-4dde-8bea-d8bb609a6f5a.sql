-- Create function to reset client password with token verification
CREATE OR REPLACE FUNCTION reset_client_password(
  p_phone TEXT,
  p_reset_token TEXT,
  p_new_password TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id UUID;
  v_token_record RECORD;
  v_password_hash TEXT;
BEGIN
  -- Find the client by phone
  SELECT id INTO v_client_id
  FROM clients
  WHERE phone = p_phone AND is_active = true;

  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Client not found'
    );
  END IF;

  -- Verify the reset token
  SELECT * INTO v_token_record
  FROM password_reset_tokens
  WHERE client_id = v_client_id
    AND token = p_reset_token
    AND used = false
    AND expires_at > NOW();

  IF v_token_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired reset code'
    );
  END IF;

  -- Hash the new password using pgcrypto
  v_password_hash := crypt(p_new_password, gen_salt('bf', 10));

  -- Update the client's password
  UPDATE clients
  SET password_hash = v_password_hash,
      updated_at = NOW()
  WHERE id = v_client_id;

  -- Mark the token as used
  UPDATE password_reset_tokens
  SET used = true
  WHERE id = v_token_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Password reset successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;