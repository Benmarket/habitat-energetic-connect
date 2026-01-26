import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

// Email validation schema
const emailSchema = z.string()
  .trim()
  .min(1, "Veuillez entrer une adresse email")
  .email("Veuillez entrer une adresse email valide")
  .max(255, "L'email est trop long");

export const NewsletterForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email with zod
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    const validatedEmail = validation.data.toLowerCase();
    setIsLoading(true);

    try {
      // Check if email already exists
      const { data: existing } = await supabase
        .from("newsletter_subscribers")
        .select("email, status")
        .eq("email", validatedEmail)
        .maybeSingle();

      if (existing) {
        if (existing.status === "active") {
          toast.info("Vous êtes déjà inscrit à notre newsletter !");
        } else {
          toast.info("Cette adresse email était désinscrite. Contactez-nous pour vous réinscrire.");
        }
        setEmail("");
        setIsLoading(false);
        return;
      }

      // Insert new subscriber
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({
          email: validatedEmail,
          source: "footer",
          status: "active"
        });

      if (error) {
        // Handle rate limiting error
        if (error.message.includes("row-level security") || error.code === "42501") {
          toast.error("Trop de tentatives. Veuillez réessayer plus tard.");
          return;
        }
        throw error;
      }

      // Redirect to thank you page for newsletter
      setEmail("");
      navigate(`/merci?type=newsletter&email=${encodeURIComponent(validatedEmail)}`);
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="email"
        placeholder="Votre email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
        disabled={isLoading}
        maxLength={255}
        autoComplete="email"
      />
      <Button 
        type="submit" 
        disabled={isLoading}
        className="bg-primary hover:bg-primary/90"
      >
        <Mail className="h-4 w-4" />
      </Button>
    </form>
  );
};
