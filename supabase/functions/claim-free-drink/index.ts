import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { ticket_id, client_id, drink_id, drink_name, ticket_name } = await req.json()

    console.log('Claiming free drink:', { ticket_id, client_id, drink_id, drink_name })

    // Verify ticket belongs to client and hasn't been claimed
    const { data: ticket, error: ticketError } = await supabaseClient
      .from('client_tickets')
      .select('*')
      .eq('id', ticket_id)
      .eq('client_id', client_id)
      .eq('free_drink_claimed', false)
      .single()

    if (ticketError || !ticket) {
      console.error('Ticket verification failed:', ticketError)
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid ticket or already claimed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create order with price = 0
    const { error: orderError } = await supabaseClient
      .from('session_line_items')
      .insert({
        user_id: client_id,
        item_name: drink_name,
        quantity: 1,
        price: 0,
        status: 'pending',
        notes: `Free drink from ticket: ${ticket_name}`
      })

    if (orderError) {
      console.error('Order creation failed:', orderError)
      throw orderError
    }

    // Update ticket as claimed
    const { error: updateError } = await supabaseClient
      .from('client_tickets')
      .update({
        free_drink_claimed: true,
        free_drink_claimed_at: new Date().toISOString(),
        claimed_drink_name: drink_name
      })
      .eq('id', ticket_id)

    if (updateError) {
      console.error('Ticket update failed:', updateError)
      throw updateError
    }

    console.log('✅ Free drink claimed successfully')

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error claiming free drink:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
