import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { leadId, firstName, lastName } = await req.json();

    if (
      typeof leadId !== "string" ||
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      firstName.trim().length === 0 ||
      firstName.length > 100 ||
      lastName.length > 100
    ) {
      return new Response(JSON.stringify({ error: "invalid_input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Vérifier que le lead correspond au flow attendu : placeholder + récent (< 15 min)
    const { data: lead, error: fetchErr } = await admin
      .from("leads")
      .select("id, first_name, last_name, created_at")
      .eq("id", leadId)
      .maybeSingle();

    if (fetchErr || !lead) {
      return new Response(JSON.stringify({ error: "not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ageMs = Date.now() - new Date(lead.created_at).getTime();
    if (
      ageMs > 15 * 60 * 1000 ||
      lead.first_name !== "Prospect" ||
      lead.last_name !== "Solaire"
    ) {
      return new Response(JSON.stringify({ error: "not_allowed" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: upErr } = await admin
      .from("leads")
      .update({
        first_name: firstName.trim().slice(0, 100),
        last_name: (lastName.trim() || firstName.trim()).slice(0, 100),
      })
      .eq("id", leadId);

    if (upErr) {
      return new Response(JSON.stringify({ error: "update_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_e) {
    return new Response(JSON.stringify({ error: "bad_request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
