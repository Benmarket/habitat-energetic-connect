import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Star,
  Copy,
  Download,
  Trash2,
  ExternalLink,
  Loader2,
  Search,
  EyeOff,
  MessageSquareText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Review = {
  id: string;
  full_name: string;
  hide_name: boolean;
  email: string;
  rating: number;
  message: string | null;
  profile_photo_url: string | null;
  photos: string[];
  user_id: string | null;
  created_at: string;
};

export default function AdminInternalReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const publicUrl = `${window.location.origin}/laisser-un-avis`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(publicUrl)}`;

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("internal_reviews")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Impossible de charger les avis");
    } else {
      setReviews((data as Review[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (ratingFilter && r.rating !== ratingFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          r.full_name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          (r.message || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reviews, search, ratingFilter]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    return { total, avg };
  }, [reviews]);

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success("Lien copié");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("internal_reviews").delete().eq("id", id);
    if (error) return toast.error("Suppression impossible");
    toast.success("Avis supprimé");
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <>
      <Helmet>
        <title>Avis internes | Administration</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
            <Link
              to="/administration"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l'administration
            </Link>

            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Avis internes
              </h1>
              <p className="text-muted-foreground">
                Un lien privé pour recueillir des avis auprès des personnes de votre choix. Non
                exposé au public.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* QR + link */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquareText className="w-5 h-5 text-primary" />
                    Lien privé de dépôt d'avis
                  </CardTitle>
                  <CardDescription>
                    Partagez ce lien ou ce QR code à qui vous voulez. Non listé publiquement.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-shrink-0 p-4 bg-white rounded-xl border shadow-sm">
                      <img
                        src={qrUrl}
                        alt="QR code du formulaire d'avis"
                        width={200}
                        height={200}
                        className="block"
                      />
                    </div>
                    <div className="flex-1 space-y-3 w-full">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          URL à partager
                        </label>
                        <div className="flex gap-2 mt-1">
                          <Input value={publicUrl} readOnly className="font-mono text-xs" />
                          <Button variant="outline" size="icon" onClick={copyLink}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <a href={publicUrl} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4 mr-1.5" />
                            Ouvrir le formulaire
                          </Button>
                        </a>
                        <a href={qrUrl} download="qr-avis.png" target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-1.5" />
                            Télécharger le QR
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-4xl font-bold">{stats.total}</div>
                    <div className="text-sm text-muted-foreground">avis reçus</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold">{stats.avg.toFixed(1)}</span>
                      <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="text-sm text-muted-foreground">note moyenne</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4 items-center">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher (nom, email, message)…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-1">
                <Button
                  variant={ratingFilter === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRatingFilter(null)}
                >
                  Toutes
                </Button>
                {[5, 4, 3, 2, 1].map((n) => (
                  <Button
                    key={n}
                    variant={ratingFilter === n ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRatingFilter(n)}
                  >
                    {n}★
                  </Button>
                ))}
              </div>
            </div>

            {/* List */}
            {loading ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {reviews.length === 0
                    ? "Aucun avis pour le moment. Partagez le lien pour en recevoir."
                    : "Aucun avis ne correspond à votre recherche."}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map((r) => (
                  <Card key={r.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex items-start gap-3">
                        {r.profile_photo_url ? (
                          <img
                            src={r.profile_photo_url}
                            alt={r.full_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-lg font-semibold text-primary">
                            {r.full_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold truncate">{r.full_name}</span>
                            {r.hide_name && (
                              <Badge variant="secondary" className="text-xs">
                                <EyeOff className="w-3 h-3 mr-1" />
                                Masqué
                              </Badge>
                            )}
                            {r.user_id && (
                              <Badge variant="outline" className="text-xs">
                                Connecté
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{r.email}</div>
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star
                                key={n}
                                className={`w-4 h-4 ${
                                  n <= r.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(r.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </div>

                      {r.message && (
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{r.message}</p>
                      )}

                      {r.photos.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {r.photos.map((p, i) => (
                            <a key={i} href={p} target="_blank" rel="noreferrer">
                              <img
                                src={p}
                                alt={`Photo ${i + 1}`}
                                className="w-16 h-16 rounded object-cover border hover:scale-105 transition-transform"
                              />
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-end pt-2 border-t">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-1.5" />
                              Supprimer
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer cet avis ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est définitive.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => remove(r.id)}>
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
