import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteUserRequest {
  userId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user is authenticated and has admin privileges
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin privileges
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin', 'ceo'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient privileges' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: DeleteUserRequest = await req.json();
    const { userId } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent deleting self
    if (userId === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user details before deletion for logging
    const { data: userToDelete } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name, role')
      .eq('user_id', userId)
      .maybeSingle();

    console.log('Starting user deletion process for:', userId);

    // Delete related data in specific order to avoid foreign key conflicts
    
    // 1. Delete from admin_users table (if exists)
    console.log('Deleting from admin_users...');
    const { error: adminError } = await supabaseAdmin
      .from('admin_users')
      .delete()
      .eq('user_id', userId);
    
    if (adminError) {
      console.log('Admin users deletion error (may not exist):', adminError);
    }

    // 2. Delete from profiles table
    console.log('Deleting from profiles...');
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', userId);
    
    if (profileError) {
      console.error('Profile deletion error:', profileError);
      throw new Error(`Failed to delete profile: ${profileError.message}`);
    }

    console.log('User profile and admin record deleted successfully');

    // Log the deletion event
    if (userToDelete) {
      try {
        await supabaseAdmin.rpc('log_system_event', {
          p_log_level: 'warning',
          p_event_type: 'user_deleted',
          p_message: `User profile deleted: ${userToDelete.full_name || userToDelete.email} (${userToDelete.role})`,
          p_metadata: { 
            deleted_user_id: userId,
            deleted_user_email: userToDelete.email,
            deleted_user_role: userToDelete.role,
            deleted_by: user.id 
          },
          p_user_id: user.id
        });
      } catch (logError) {
        console.error('Error logging deletion event:', logError);
        // Continue even if logging fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User deleted successfully',
        deletedUser: {
          id: userId,
          email: userToDelete?.email,
          full_name: userToDelete?.full_name,
          role: userToDelete?.role
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});