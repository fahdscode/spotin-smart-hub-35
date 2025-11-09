import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CheckInRequest {
  barcode: string;
  scanned_by_user_id?: string;
  action?: 'checkin' | 'checkout';
  client_id?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { barcode, scanned_by_user_id, action, client_id }: CheckInRequest = await req.json()

    console.log('Check-in/out request:', { barcode, action, client_id, scanned_by_user_id })

    let result;

    if (action === 'checkout' && client_id) {
      // Manual checkout using client_id
      result = await handleManualCheckout(supabaseClient, client_id, scanned_by_user_id)
    } else if (action === 'checkin' && client_id) {
      // NEW: Handle check-in by client_id (for membership clients)
      result = await handleManualCheckin(supabaseClient, client_id, scanned_by_user_id)
    } else {
      // Barcode-based toggle check-in/out
      result = await handleBarcodeToggle(supabaseClient, barcode, scanned_by_user_id)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: result.success ? 200 : 400,
    })

  } catch (error) {
    console.error('Check-in/out error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// ========== HELPER FUNCTIONS FOR SESSION CLEANUP ==========

async function closeAllClientReceipts(supabase: any, clientId: string) {
  console.log('Closing all receipts for client:', clientId)
  const closeTime = new Date().toISOString()
  const { data, error } = await supabase
    .from('receipts')
    .update({ 
      status: 'closed',
      closed_at: closeTime,
      updated_at: closeTime
    })
    .eq('user_id', clientId)
    .neq('status', 'closed')
    .neq('status', 'cancelled')
    .select()
  
  if (error) {
    console.error('Error closing receipts:', error)
  } else {
    console.log('✅ Closed receipts:', data?.length || 0, '- Receipt IDs:', data?.map(r => r.id).join(', ') || 'none')
  }
  return data
}

async function cancelAllPendingOrders(supabase: any, clientId: string) {
  console.log('Cancelling pending orders for client:', clientId)
  const { data, error } = await supabase
    .from('session_line_items')
    .update({ 
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', clientId)
    .eq('status', 'pending')
    .select()
  
  if (error) {
    console.error('Error cancelling orders:', error)
  } else {
    console.log('✅ Cancelled orders:', data?.length || 0)
  }
  return data
}

async function closeAllCheckInSessions(supabase: any, clientId: string) {
  console.log('Closing check-in sessions for client:', clientId)
  const { data, error } = await supabase
    .from('check_ins')
    .update({ 
      status: 'checked_out', 
      checked_out_at: new Date().toISOString() 
    })
    .eq('client_id', clientId)
    .eq('status', 'checked_in')
    .is('checked_out_at', null)
    .select()
  
  if (error) {
    console.error('Error closing check-in sessions:', error)
  } else {
    console.log('✅ Closed check-in sessions:', data?.length || 0)
  }
  return data
}

async function performFullSessionCleanup(supabase: any, clientId: string) {
  console.log('=== 🧹 PERFORMING FULL SESSION CLEANUP FOR CLIENT:', clientId, '===')
  await closeAllClientReceipts(supabase, clientId)
  await cancelAllPendingOrders(supabase, clientId)
  await closeAllCheckInSessions(supabase, clientId)
  console.log('=== ✅ CLEANUP COMPLETED - Client ready for new session ===')
}

// ========== MAIN HANDLER FUNCTIONS ==========

async function handleBarcodeToggle(supabase: any, barcode: string, scannedByUserId?: string) {
  const trimmedBarcode = barcode.trim()
  
  console.log('Processing barcode toggle:', trimmedBarcode)

  // Find the client
  const { data: clients, error: clientError } = await supabase
    .from('clients')
    .select('id, client_code, full_name, phone, email, barcode, is_active, active')
    .or(`barcode.eq.${trimmedBarcode},client_code.eq.${trimmedBarcode}`)
    .eq('is_active', true)
    .single()

  if (clientError || !clients) {
    console.log('Client not found:', clientError)
    return {
      success: false,
      error: 'Invalid barcode. Please try again.',
      debug: { barcode: trimmedBarcode, clientError }
    }
  }

  const client = clients
  const action = client.active ? 'checked_out' : 'checked_in'
  
  console.log('Client found:', { id: client.id, name: client.full_name, currentStatus: client.active, newAction: action })

  try {
    if (client.active) {
      // ========== CHECKOUT PROCESS ==========
      console.log('🔴 Starting checkout process for client:', client.id, '-', client.full_name)

      // Perform complete session cleanup
      await performFullSessionCleanup(supabase, client.id)

      // Set client active status to false
      const checkoutTime = new Date().toISOString()
      await supabase
        .from('clients')
        .update({ active: false, updated_at: checkoutTime })
        .eq('id', client.id)

      console.log('✅ Checkout completed successfully at:', checkoutTime)

    } else {
      // ========== CHECK-IN PROCESS ==========
      console.log('🟢 Starting check-in process for client:', client.id, '-', client.full_name)

      // CRITICAL SAFETY CLEANUP: Ensure NO leftover data from previous sessions
      // This closes ALL old receipts, cancels ALL pending orders, closes ALL old check-ins
      await performFullSessionCleanup(supabase, client.id)

      // Now create fresh check-in session with exact timestamp
      const checkInTime = new Date().toISOString()
      
      await supabase
        .from('clients')
        .update({ active: true, updated_at: checkInTime })
        .eq('id', client.id)

      // Create new check-in record with exact timestamp
      const { data: newCheckIn, error: checkInError } = await supabase
        .from('check_ins')
        .insert({
          client_id: client.id,
          user_id: scannedByUserId || client.id,
          status: 'checked_in',
          checked_in_at: checkInTime
        })
        .select()
        .single()

      if (checkInError) {
        console.error('Error creating check-in:', checkInError)
      } else {
        console.log('✅ Fresh check-in session created at:', checkInTime, '- Session ID:', newCheckIn?.id)
        console.log('💡 New receipt will be created automatically when first order is placed')
      }
    }

    // Log the action
    try {
      await supabase
        .from('check_in_logs')
        .insert({
          client_id: client.id,
          action: action,
          scanned_barcode: trimmedBarcode,
          scanned_by_user_id: scannedByUserId,
          notes: `Successful ${action} via edge function`
        })
    } catch (logError) {
      console.log('Failed to log action (continuing):', logError)
    }

    return {
      success: true,
      action: action,
      client: {
        id: client.id,
        client_code: client.client_code,
        full_name: client.full_name,
        phone: client.phone,
        email: client.email,
        barcode: client.barcode,
        active: !client.active // Return the NEW status
      }
    }

  } catch (updateError) {
    console.error('Error updating client status:', updateError)
    return {
      success: false,
      error: 'Failed to update client status. Please try again.',
      details: updateError instanceof Error ? updateError.message : 'Unknown error'
    }
  }
}

async function handleManualCheckin(supabase: any, clientId: string, checkinByUserId?: string) {
  console.log('Processing manual check-in:', clientId)

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, client_code, full_name, phone, email, barcode, is_active, active')
    .eq('id', clientId)
    .eq('is_active', true)
    .single()

  if (clientError || !client) {
    return {
      success: false,
      error: 'Client not found or inactive.'
    }
  }

  if (client.active) {
    return {
      success: false,
      error: 'Client is already checked in.'
    }
  }

  try {
    console.log('🟢 Starting manual check-in for client:', clientId)

    // CRITICAL CLEANUP: Close all old sessions before creating new one
    await performFullSessionCleanup(supabase, clientId)

    const checkInTime = new Date().toISOString()
    
    await supabase
      .from('clients')
      .update({ active: true, updated_at: checkInTime })
      .eq('id', clientId)

    // Create new check-in record
    const { data: newCheckIn } = await supabase
      .from('check_ins')
      .insert({
        client_id: clientId,
        user_id: checkinByUserId || clientId,
        status: 'checked_in',
        checked_in_at: checkInTime
      })
      .select()
      .single()

    console.log('✅ Manual check-in completed at:', checkInTime, '- Session ID:', newCheckIn?.id)

    // Log the action
    await supabase
      .from('check_in_logs')
      .insert({
        client_id: clientId,
        action: 'checked_in',
        scanned_barcode: client.barcode,
        scanned_by_user_id: checkinByUserId,
        notes: 'Manual check-in by staff (membership client)'
      })

    return {
      success: true,
      message: 'Client checked in successfully',
      client: {
        id: client.id,
        client_code: client.client_code,
        full_name: client.full_name,
        phone: client.phone,
        email: client.email,
        barcode: client.barcode,
        active: true
      }
    }

  } catch (error) {
    console.error('Error during check-in:', error)
    return {
      success: false,
      error: 'System error during check-in.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function handleManualCheckout(supabase: any, clientId: string, checkoutByUserId?: string) {
  console.log('Processing manual checkout:', clientId)

  // Find the client
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, client_code, full_name, phone, email, barcode, is_active, active')
    .eq('id', clientId)
    .eq('is_active', true)
    .single()

  if (clientError || !client) {
    return {
      success: false,
      error: 'Client not found or inactive.'
    }
  }

  if (!client.active) {
    return {
      success: false,
      error: 'Client is already checked out.'
    }
  }

  try {
    // ========== MANUAL CHECKOUT PROCESS ==========
    console.log('🔴 Starting manual checkout for client:', clientId)

    // Perform complete session cleanup
    await performFullSessionCleanup(supabase, clientId)

    // Update client active status
    const checkoutTime = new Date().toISOString()
    await supabase
      .from('clients')
      .update({ active: false, updated_at: checkoutTime })
      .eq('id', clientId)

    console.log('✅ Manual checkout completed successfully at:', checkoutTime)

    // Log the action
    try {
      await supabase
        .from('check_in_logs')
        .insert({
          client_id: clientId,
          action: 'checked_out',
          scanned_barcode: client.barcode,
          scanned_by_user_id: checkoutByUserId,
          notes: 'Manual checkout by staff via edge function'
        })
    } catch (logError) {
      console.log('Failed to log action (continuing):', logError)
    }

    return {
      success: true,
      message: 'Client checked out successfully',
      client: {
        id: client.id,
        client_code: client.client_code,
        full_name: client.full_name,
        phone: client.phone,
        email: client.email,
        barcode: client.barcode,
        active: false
      }
    }

  } catch (updateError) {
    console.error('Error during checkout:', updateError)
    return {
      success: false,
      error: 'System error during checkout. Please try again.',
      details: updateError instanceof Error ? updateError.message : 'Unknown error'
    }
  }
}