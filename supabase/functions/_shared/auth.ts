// Shared strict JWT auth helper for AI / privileged edge functions.
// - Validates Authorization: Bearer <token> via Supabase getClaims (cryptographic verify)
// - Enforces required claims: sub, exp (not expired), iss matches project, aud=authenticated
// - Optionally enforces admin / super_admin role via user_roles
// - Returns a typed result; callers should short-circuit on `response`
//
// IMPORTANT: never trust raw JWT payloads — always go through getClaims.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

export type AuthOk = {
  ok: true;
  userId: string;
  claims: Record<string, any>;
  supabaseAdmin: SupabaseClient;
};
export type AuthFail = {
  ok: false;
  response: Response;
};
export type AuthResult = AuthOk | AuthFail;

export interface AuthOptions {
  requireAdmin?: boolean;
  corsHeaders: Record<string, string>;
}

function jsonResp(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function requireAuth(req: Request, opts: AuthOptions): Promise<AuthResult> {
  const { corsHeaders, requireAdmin = false } = opts;

  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return { ok: false, response: jsonResp({ error: "Non autorisé - Token manquant" }, 401, corsHeaders) };
  }
  const token = authHeader.slice(7).trim();
  if (!token || token.split(".").length !== 3) {
    return { ok: false, response: jsonResp({ error: "Non autorisé - Token malformé" }, 401, corsHeaders) };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return { ok: false, response: jsonResp({ error: "Configuration serveur invalide" }, 500, corsHeaders) };
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

  // Cryptographic JWT verification (signature + standard checks)
  const { data, error } = await supabaseAuth.auth.getClaims(token);
  if (error || !data?.claims) {
    return { ok: false, response: jsonResp({ error: "Non autorisé - Token invalide" }, 401, corsHeaders) };
  }
  const claims: any = data.claims;

  // Strict claim checks
  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof claims.exp === "number" && claims.exp <= nowSec) {
    return { ok: false, response: jsonResp({ error: "Non autorisé - Token expiré" }, 401, corsHeaders) };
  }
  if (typeof claims.nbf === "number" && claims.nbf > nowSec + 30) {
    return { ok: false, response: jsonResp({ error: "Non autorisé - Token pas encore valide" }, 401, corsHeaders) };
  }
  const expectedIss = `${supabaseUrl.replace(/\/$/, "")}/auth/v1`;
  if (typeof claims.iss === "string" && claims.iss !== expectedIss) {
    return { ok: false, response: jsonResp({ error: "Non autorisé - Émetteur invalide" }, 401, corsHeaders) };
  }
  if (claims.aud && claims.aud !== "authenticated") {
    return { ok: false, response: jsonResp({ error: "Non autorisé - Audience invalide" }, 401, corsHeaders) };
  }
  if (claims.role && claims.role !== "authenticated") {
    return { ok: false, response: jsonResp({ error: "Non autorisé - Rôle JWT invalide" }, 401, corsHeaders) };
  }
  const userId: string | undefined = claims.sub;
  if (!userId) {
    return { ok: false, response: jsonResp({ error: "Non autorisé - Sub manquant" }, 401, corsHeaders) };
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  if (requireAdmin) {
    const { data: roles, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (roleError) {
      return { ok: false, response: jsonResp({ error: "Erreur de vérification du rôle" }, 500, corsHeaders) };
    }
    const isAdmin = (roles || []).some((r: any) => r.role === "admin" || r.role === "super_admin");
    if (!isAdmin) {
      return { ok: false, response: jsonResp({ error: "Accès réservé aux administrateurs" }, 403, corsHeaders) };
    }
  }

  return { ok: true, userId, claims, supabaseAdmin };
}
