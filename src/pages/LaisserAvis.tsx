import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Star, Upload, Loader2, Check, X, LogIn } from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";

const reviewSchema = z.object({
  full_name: z.string().trim().min(2, "Nom complet requis (2 caractères min)").max(120),
  email: z.string().trim().email("Email invalide").max(255),
  rating: z.number().int().min(1, "Note requise").max(5),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

const uploadToMedia = async (file: File, prefix: string): Promise<string | null> => {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `internal-reviews/${prefix}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) {
    console.error("Upload error:", error);
    return null;
  }
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
};

export default function LaisserAvis() {
  const { user } = useAuth();
  const [prefilling, setPrefilling] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [existingAvatar, setExistingAvatar] = useState<string | null>(null);
  const [hideName, setHideName] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const prefill = async () => {
      if (!user) {
        setPrefilling(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        const name = [data.first_name, data.last_name].filter(Boolean).join(" ").trim();
        setFullName(name);
        setEmail(data.email || user.email || "");
      } else {
        setEmail(user.email || "");
      }
      setExistingAvatar(null);
      setPrefilling(false);
    };
    prefill();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = reviewSchema.safeParse({
      full_name: fullName,
      email,
      rating,
      message: message || undefined,
    });
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      toast.error(first || "Veuillez vérifier les champs");
      return;
    }
    if (photos.length > 5) {
      toast.error("Maximum 5 photos");
      return;
    }

    setSubmitting(true);
    try {
      let profileUrl: string | null = existingAvatar;
      if (profilePhoto) {
        profileUrl = await uploadToMedia(profilePhoto, "profiles");
      }
      const photoUrls: string[] = [];
      for (const p of photos) {
        const url = await uploadToMedia(p, "photos");
        if (url) photoUrls.push(url);
      }

      const { error } = await supabase.from("internal_reviews").insert({
        user_id: user?.id ?? null,
        full_name: fullName.trim(),
        hide_name: hideName,
        email: email.trim(),
        rating,
        message: message.trim() || null,
        profile_photo_url: profileUrl,
        photos: photoUrls,
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'envoyer votre avis. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <>
        <Helmet>
          <title>Merci pour votre avis | Prime Énergies</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-purple-500/5 px-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-8 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold">Merci pour votre avis !</h1>
              <p className="text-muted-foreground">
                Votre témoignage a bien été envoyé. Nous l'apprécions énormément.
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Laisser un avis | Prime Énergies</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-purple-500/5 py-4 md:py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl">
            <CardHeader className="text-center pb-3 pt-5">
              <CardTitle className="text-xl md:text-2xl bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Partagez votre expérience
              </CardTitle>
              <CardDescription className="text-sm">
                Votre avis nous aide à progresser. Merci pour votre temps.
              </CardDescription>
              {!user && (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAuthOpen(true)}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Se connecter pour pré-remplir
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-2">
              {prefilling ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Rating */}
                  <div className="space-y-2">
                    <Label>Votre note <span className="text-destructive">*</span></Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(n)}
                          onMouseEnter={() => setHoverRating(n)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="transition-transform hover:scale-110"
                          aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                        >
                          <Star
                            className={`w-7 h-7 ${
                              n <= (hoverRating || rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground/40"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Full name */}
                  <div className="space-y-2">
                    <Label htmlFor="full_name">
                      Nom complet <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="full_name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      maxLength={120}
                      required
                    />
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="hide_name"
                        checked={hideName}
                        onCheckedChange={(v) => setHideName(v === true)}
                      />
                      <Label htmlFor="hide_name" className="text-sm font-normal cursor-pointer">
                        Masquer mon nom (affichage anonyme)
                      </Label>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      maxLength={255}
                      required
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Votre message (facultatif)</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={2000}
                      rows={5}
                      placeholder="Racontez-nous votre expérience…"
                    />
                  </div>

                  {/* Profile photo — only if not logged in with an existing avatar */}
                  {!user && (
                    <div className="space-y-2">
                      <Label htmlFor="profile_photo">Photo de profil (facultatif)</Label>
                      <Input
                        id="profile_photo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setProfilePhoto(e.target.files?.[0] ?? null)}
                      />
                      {profilePhoto && (
                        <p className="text-xs text-muted-foreground">{profilePhoto.name}</p>
                      )}
                    </div>
                  )}

                  {/* Photos */}
                  <div className="space-y-2">
                    <Label htmlFor="photos">Photos à joindre (facultatif, max 5)</Label>
                    <Input
                      id="photos"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []).slice(0, 5);
                        setPhotos(files);
                      }}
                    />
                    {photos.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {photos.map((p, i) => (
                          <div
                            key={i}
                            className="text-xs px-2 py-1 bg-muted rounded flex items-center gap-1"
                          >
                            {p.name}
                            <button
                              type="button"
                              onClick={() =>
                                setPhotos((prev) => prev.filter((_, idx) => idx !== i))
                              }
                              aria-label="Retirer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                    size="lg"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Envoi…
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Envoyer mon avis
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </>

  );
}
