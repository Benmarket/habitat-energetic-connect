import { supabase } from "@/integrations/supabase/client";

export interface SendFormConfirmationParams {
  formIdentifier: string;
  submissionId?: string;
  recipient: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  /** Short label like "votre demande de devis solaire" */
  formLabel?: string;
  /** One-line summary shown in the email recap (e.g. "Panneaux solaires • 75001 Paris") */
  requestSummary?: string;
}

/**
 * Trigger the confirmation email orchestrator after any form/simulator submission.
 * Best-effort: errors are logged but never thrown (UX should not break if email fails).
 *
 * The edge function reads the form_configurations toggles to decide:
 *  - whether to send anything at all
 *  - whether to include a signup magic link
 *  - or whether to send a "welcome back" variant if the user already has an account
 */
export async function sendFormConfirmationEmail(params: SendFormConfirmationParams): Promise<void> {
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : undefined;
    const { error } = await supabase.functions.invoke("send-form-confirmation", {
      body: { ...params, siteOrigin: origin },
    });
    if (error) {
      console.warn("[sendFormConfirmationEmail] non-blocking error:", error);
    }
  } catch (err) {
    console.warn("[sendFormConfirmationEmail] non-blocking exception:", err);
  }
}
