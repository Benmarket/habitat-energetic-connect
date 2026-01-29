import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface VisitorSession {
  visitor_id: string;
  token: string;
  expires_at: string;
}

const STORAGE_KEY = "visitor_session";

/**
 * Hook to manage secure visitor sessions for anonymous chat.
 * 
 * For authenticated users: returns null (they use auth.uid() in RLS).
 * For anonymous users: issues a server-side session and stores the token.
 * 
 * The token is sent via x-visitor-token header and validated by current_visitor_id().
 */
export const useVisitorSession = () => {
  const { user } = useAuth();
  const [session, setSession] = useState<VisitorSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializingRef = useRef(false);

  // Get stored session from localStorage
  const getStoredSession = useCallback((): VisitorSession | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored) as VisitorSession;
      
      // Check if session is expired
      if (new Date(parsed.expires_at) < new Date()) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      
      return parsed;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }, []);

  // Issue a new session from the server
  const issueNewSession = useCallback(async (): Promise<VisitorSession | null> => {
    try {
      const { data, error: rpcError } = await supabase.rpc("issue_visitor_session", {
        p_expires_in_seconds: 86400, // 24 hours
      });

      if (rpcError) {
        console.error("Failed to issue visitor session:", rpcError);
        setError("Impossible de créer une session visiteur");
        return null;
      }

      const sessionData = data as unknown as VisitorSession;
      
      // Store in localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
      
      return sessionData;
    } catch (err) {
      console.error("Error issuing visitor session:", err);
      setError("Erreur lors de la création de la session");
      return null;
    }
  }, []);

  // Initialize session on mount (only for anonymous users)
  useEffect(() => {
    const initSession = async () => {
      // If user is authenticated, they don't need a visitor session
      if (user) {
        setSession(null);
        setIsLoading(false);
        return;
      }

      // Prevent double initialization
      if (initializingRef.current) return;
      initializingRef.current = true;

      setIsLoading(true);
      setError(null);

      // Try to get existing session
      let existingSession = getStoredSession();
      
      if (existingSession) {
        setSession(existingSession);
        setIsLoading(false);
        initializingRef.current = false;
        return;
      }

      // Issue new session
      const newSession = await issueNewSession();
      setSession(newSession);
      setIsLoading(false);
      initializingRef.current = false;
    };

    initSession();
  }, [user, getStoredSession, issueNewSession]);

  // Get the visitor token (null if authenticated user)
  const getVisitorToken = useCallback((): string | null => {
    if (user) return null;
    return session?.token || null;
  }, [user, session]);

  // Get the visitor ID (null if authenticated user)
  const getVisitorId = useCallback((): string | null => {
    if (user) return null;
    return session?.visitor_id || null;
  }, [user, session]);

  // Create headers with visitor token for Supabase requests
  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = getVisitorToken();
    if (!token) return {};
    return { "x-visitor-token": token };
  }, [getVisitorToken]);

  // Clear session (useful for logout or testing)
  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  // Force refresh session
  const refreshSession = useCallback(async () => {
    clearSession();
    if (!user) {
      const newSession = await issueNewSession();
      setSession(newSession);
    }
  }, [user, clearSession, issueNewSession]);

  return {
    session,
    isLoading,
    error,
    isAuthenticated: !!user,
    getVisitorToken,
    getVisitorId,
    getAuthHeaders,
    clearSession,
    refreshSession,
  };
};
