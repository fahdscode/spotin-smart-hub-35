import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  phone: string;
  newPassword: string;
  resetCode?: string;
}

interface EmailVerificationRequest {
  clientId: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    switch (action) {
      case "reset-password":
        return await handlePasswordReset(req);
      case "verify-email":
        return await handleEmailVerification(req);
      case "create-test-client":
        return await handleCreateTestClient(req);
      default:
        return new Response("Invalid action", { status: 400, headers: corsHeaders });
    }
  } catch (error: any) {
    console.error("Error in auth-helpers function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function handlePasswordReset(req: Request): Promise<Response> {
  const { phone, newPassword }: PasswordResetRequest = await req.json();
  
  // Hash the new password
  const bcrypt = await import("https://deno.land/x/bcrypt@v0.4.1/mod.ts");
  const passwordHash = await bcrypt.hash(newPassword);

  // Update client password
  const { data, error } = await supabase
    .from("clients")
    .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
    .eq("phone", phone)
    .eq("is_active", true)
    .select("id, full_name, phone");

  if (error || !data.length) {
    return new Response(
      JSON.stringify({ success: false, error: "Client not found or could not update password" }),
      { status: 404, headers: corsHeaders }
    );
  }

  // Send password reset confirmation email if client has email
  const client = data[0];
  console.log("Password reset successful for client:", client.id);

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: "Password reset successfully",
      clientId: client.id 
    }),
    { status: 200, headers: corsHeaders }
  );
}

async function handleEmailVerification(req: Request): Promise<Response> {
  const { clientId, email }: EmailVerificationRequest = await req.json();

  // Update client email verification status
  const { data, error } = await supabase
    .from("clients")
    .update({ 
      email_verified: true, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", clientId)
    .eq("email", email)
    .select("full_name");

  if (error || !data.length) {
    return new Response(
      JSON.stringify({ success: false, error: "Email verification failed" }),
      { status: 400, headers: corsHeaders }
    );
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: "Email verified successfully" 
    }),
    { status: 200, headers: corsHeaders }
  );
}

async function handleCreateTestClient(req: Request): Promise<Response> {
  const bcrypt = await import("https://deno.land/x/bcrypt@v0.4.1/mod.ts");
  const passwordHash = await bcrypt.hash("testpass123");

  // Create test client with known credentials
  const { data, error } = await supabase.rpc('test_client_registration', {
    p_first_name: "Test",
    p_last_name: "Client",
    p_phone: "1234567890",
    p_email: "test@spotin.com",
    p_password_hash: passwordHash,
    p_job_title: "Tester",
    p_how_did_you_find_us: "Development"
  });

  if (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      data,
      testCredentials: {
        phone: "1234567890",
        password: "testpass123"
      }
    }),
    { status: 200, headers: corsHeaders }
  );
}

serve(handler);