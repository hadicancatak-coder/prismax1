import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Security: Verify cron secret header
    const cronSecret = req.headers.get('X-Cron-Secret');
    const expectedSecret = Deno.env.get('CRON_SECRET');
    
    if (!expectedSecret || cronSecret !== expectedSecret) {
      console.error('Unauthorized reschedule attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting reschedule_overdue_tasks...');
    
    // Call the reschedule function
    const { error } = await supabase.rpc('reschedule_overdue_tasks');

    if (error) {
      console.error('Reschedule error:', error);
      throw error;
    }

    console.log('Reschedule completed successfully');
    
    return new Response(
      JSON.stringify({ success: true, message: 'Overdue tasks rescheduled' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
