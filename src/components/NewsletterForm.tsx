import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const NewsletterForm = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast.error("Veuillez entrer une adresse email valide");
      return;
    }

    setIsLoading(true);

    try {
      // Check if email already exists
      const { data: existing } = await supabase
        .from("newsletter_subscribers")
        .select("email, status")
        .eq("email", email)
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
          email,
          source: "footer",
          status: "active"
        });

      if (error) throw error;

      toast.success("Merci pour votre inscription ! Vous recevrez bientôt nos actualités.");
      setEmail("");
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
