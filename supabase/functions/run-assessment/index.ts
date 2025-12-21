// Supabase Edge Function
// Validates user auth and triggers Node.js backend securely
// Deploy with: supabase functions deploy run-assessment

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "content-type": "application/json" } }
      );
    }

    // Create Supabase client to verify user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "content-type": "application/json" } }
      );
    }

    // Parse request body
    const { assessment_id } = await req.json();
    
    if (!assessment_id) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing assessment_id" }),
        { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } }
      );
    }

    // Verify user has access to this assessment (via org membership)
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .select("id, org_id")
      .eq("id", assessment_id)
      .single();

    if (assessmentError || !assessment) {
      return new Response(
        JSON.stringify({ ok: false, error: "Assessment not found or access denied" }),
        { status: 404, headers: { ...corsHeaders, "content-type": "application/json" } }
      );
    }

    // Call Node.js backend
    const nodeUrl = Deno.env.get("NODE_BACKEND_URL");
    const nodeSecret = Deno.env.get("NODE_BACKEND_SECRET");

    if (!nodeUrl) {
      return new Response(
        JSON.stringify({ ok: false, error: "Backend service not configured" }),
        { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } }
      );
    }

    console.log(`Triggering analysis for assessment ${assessment_id} by user ${user.id}`);

    const backendResponse = await fetch(`${nodeUrl}/assessments/${assessment_id}/run`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(nodeSecret ? { "x-shared-secret": nodeSecret } : {}),
      },
    });

    const data = await backendResponse.json();

    return new Response(
      JSON.stringify(data),
      { 
        status: backendResponse.status, 
        headers: { ...corsHeaders, "content-type": "application/json" } 
      }
    );

  } catch (e) {
    console.error("Edge function error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } }
    );
  }
});

