import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Case status must be attorney_confirmed or later for client portal access
const ALLOWED_STATUSES = ['attorney_confirmed', 'rn_assigned', 'care_plan_in_progress', 'care_plan_submitted', 'released', 'closed']

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { caseNumber, pin } = await req.json()

    if (!caseNumber || !pin) {
      return new Response(
        JSON.stringify({ error: 'Case number and PIN required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const trimmedCaseNumber = caseNumber.toString().trim().toUpperCase()
    const trimmedPin = pin.toString().trim()

    const { data: caseData, error: caseError } = await supabaseAdmin
      .from('rc_cases')
      .select('id, client_pin, case_number, case_status, pin_failed_attempts, pin_locked_until, client_id')
      .eq('case_number', trimmedCaseNumber)
      .eq('is_superseded', false)
      .maybeSingle()

    if (caseError || !caseData) {
      return new Response(
        JSON.stringify({ error: 'Case not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!ALLOWED_STATUSES.includes(caseData.case_status || '')) {
      return new Response(
        JSON.stringify({ error: 'Your case is not yet ready for portal access. Please contact your attorney.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const row = caseData as { pin_locked_until?: string; pin_failed_attempts?: number }
    if (row.pin_locked_until) {
      const lockedUntil = new Date(row.pin_locked_until)
      if (lockedUntil > new Date()) {
        return new Response(
          JSON.stringify({ error: 'Account temporarily locked', locked_until: row.pin_locked_until }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    if (caseData.client_pin !== trimmedPin) {
      const attempts = (row.pin_failed_attempts || 0) + 1
      const updates: Record<string, unknown> = { pin_failed_attempts: attempts }
      if (attempts >= 5) {
        const lockUntil = new Date()
        lockUntil.setHours(lockUntil.getHours() + 1)
        updates.pin_locked_until = lockUntil.toISOString()
      }
      await supabaseAdmin.from('rc_cases').update(updates).eq('id', caseData.id)
      return new Response(
        JSON.stringify({ error: 'Invalid PIN', attempts_remaining: Math.max(0, 5 - attempts) }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    await supabaseAdmin
      .from('rc_cases')
      .update({ pin_failed_attempts: 0, pin_locked_until: null })
      .eq('id', caseData.id)

    let clientName = 'Client'
    if (caseData.client_id) {
      const { data: clientRow } = await supabaseAdmin
        .from('rc_clients')
        .select('first_name, last_name')
        .eq('id', caseData.client_id)
        .maybeSingle()
      if (clientRow && (clientRow.first_name || clientRow.last_name)) {
        clientName = [clientRow.first_name, clientRow.last_name].filter(Boolean).join(' ').trim() || clientName
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        case_id: caseData.id,
        case_number: caseData.case_number,
        client_name: clientName,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Client sign-in error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
