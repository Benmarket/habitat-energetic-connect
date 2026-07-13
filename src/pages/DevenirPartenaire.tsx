import { useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import {
  Briefcase,
  Send,
  Target,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Award,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  Users,
  Rocket,
} from "lucide-react";

const PARTNER_FORM_IDENTIFIER = "partner-application";

const WORK_TYPES = [
  "Panneaux photovoltaïques",
  "Pompe à chaleur",
  "Isolation",
  "Rénovation globale",
  "Ballon thermodynamique",
  "Chauffage bois / granulés",
  "Ventilation / VMC",
];

const schema = z.object({
  companyName: z.string().trim().min(2, "Raison sociale requise").max(150),
  siret: z.string().trim().regex(/^\d{14}$/, "SIRET invalide (14 chiffres)"),
  firstName: z.string().trim().min(1, "Prénom requis").max(80),
  lastName: z.string().trim().min(1, "Nom requis").max(80),
  role: z.string().trim().max(120).optional().or(z.literal("")),
  email: z.string().trim().email("Email invalide").max(200),
  phone: z.string().trim().min(10, "Téléphone invalide").max(20),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  zone: z.string().trim().min(2, "Zone requise").max(200),
  workTypes: z.array(z.string()).min(1, "Sélectionnez au moins un type"),
  rge: z.boolean(),
  message: z.string().trim().max(1500).optional().or(z.literal("")),
});

const DevenirPartenaire = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState({
    companyName: "",
    siret: "",
    firstName: "",
    lastName: "",
    role: "",
    email: "",
    phone: "",
    website: "",
    zone: "",
    workTypes: [] as string[],
    rge: false,
    message: "",
  });

  const set = <K extends keyof typeof data>(k: K, v: (typeof data)[K]) =>
    setData((p) => ({ ...p, [k]: v }));

  const toggleWorkType = (w: string) => {
    setData((p) => ({
      ...p,
      workTypes: p.workTypes.includes(w)
        ? p.workTypes.filter((x) => x !== w)
        : [...p.workTypes, w],
    }));
  };

  const scrollToForm = () => {
    document.getElementById("form-partenaire")?.scrollIntoView({ behavior: "smooth" });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setSubmitting(true);
    try {
      // Look up form_configurations id for partner-application
      const { data: formCfg } = await supabase
        .from("form_configurations")
        .select("id")
        .eq("form_identifier", PARTNER_FORM_IDENTIFIER)
        .maybeSingle();

      const submissionPayload = {
        raison_sociale: data.companyName,
        siret: data.siret,
        prenom: data.firstName,
        nom: data.lastName,
        fonction: data.role,
        email: data.email,
        telephone: data.phone,
        site_web: data.website,
        zone_intervention: data.zone,
        types_travaux: data.workTypes,
        certifie_rge: data.rge,
        message: data.message,
      };

      let submissionId: string | undefined;
      if (formCfg?.id) {
        const { data: sub, error: subErr } = await supabase
          .from("form_submissions")
          .insert({ form_id: formCfg.id, data: submissionPayload })
          .select("id")
          .single();
        if (subErr) throw subErr;
        submissionId = sub?.id;
      }

      // Confirmation email
      const { sendFormConfirmationEmail } = await import("@/lib/sendFormConfirmationEmail");
      sendFormConfirmationEmail({
        formIdentifier: PARTNER_FORM_IDENTIFIER,
        submissionId,
        recipient: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
        },
        formLabel: "votre candidature partenaire",
        requestSummary: `${data.companyName} • ${data.zone} • ${data.workTypes.join(", ")}`,
      });

      const params = new URLSearchParams({
        name: data.firstName,
        workType: "candidature-partenaire",
        type: "partenaire",
      });
      navigate(`/merci?${params.toString()}`);
    } catch (err: any) {
      console.error(err);
      toast.error("Une erreur est survenue. Merci de réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Devenir partenaire | Proposez vos offres sur Prime Énergies</title>
        <meta
          name="description"
          content="Rejoignez le réseau Prime Énergies : recevez des leads qualifiés de particuliers en projet de rénovation énergétique dans votre zone d'intervention. Candidature 100% en ligne."
        />
        <link rel="canonical" href="https://prime-energies.fr/devenir-partenaire" />
        <meta property="og:title" content="Devenir partenaire | Prime Énergies" />
        <meta property="og:description" content="Développez votre activité avec des leads qualifiés en rénovation énergétique." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://prime-energies.fr/devenir-partenaire" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <Breadcrumb
          items={[
            { name: "Accueil", url: "/" },
            { name: "Devenir partenaire", url: "/devenir-partenaire" },
          ]}
        />

        {/* HERO — orange gradient B2B */}
        <section className="relative overflow-hidden bg-gradient-to-br from-amber-600 via-orange-500 to-orange-700 text-white">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,white_1px,transparent_1px),radial-gradient(circle_at_80%_70%,white_1px,transparent_1px)] bg-[length:40px_40px]" />
          </div>
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-amber-800/30 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
                <Briefcase className="w-4 h-4" />
                Espace professionnels
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
                Développez votre activité <br className="hidden md:block" />
                <span className="bg-gradient-to-r from-yellow-200 to-white bg-clip-text text-transparent">
                  avec des leads qualifiés
                </span>
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8 leading-relaxed">
                Rejoignez le réseau Prime Énergies et recevez chaque semaine des demandes
                de particuliers en projet de rénovation énergétique dans votre zone
                d'intervention.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  onClick={scrollToForm}
                  className="bg-white text-orange-700 hover:bg-amber-50 font-bold h-12 px-8 gap-2 shadow-xl hover:scale-105 transition-all"
                >
                  Déposer ma candidature
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <a href="#comment-ca-marche">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white bg-transparent hover:bg-white/10 h-12 px-8 font-semibold"
                  >
                    Comment ça marche ?
                  </Button>
                </a>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-4 max-w-2xl mx-auto text-center">
                <div>
                  <div className="text-3xl md:text-4xl font-extrabold">48h</div>
                  <div className="text-xs md:text-sm text-white/80 uppercase tracking-wide">Validation dossier</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-extrabold">0€</div>
                  <div className="text-xs md:text-sm text-white/80 uppercase tracking-wide">Frais d'entrée</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-extrabold">100%</div>
                  <div className="text-xs md:text-sm text-white/80 uppercase tracking-wide">Leads géolocalisés</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BÉNÉFICES */}
        <section className="py-16 bg-gradient-to-b from-amber-50/50 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
                Pourquoi rejoindre Prime Énergies&nbsp;?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Une plateforme conçue pour les artisans et installateurs RGE, dans le respect
                du cahier des charges des primes énergies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Target,
                  title: "Leads qualifiés",
                  desc: "Particuliers pré-filtrés par projet, zone et budget. Vous ne perdez pas de temps.",
                },
                {
                  icon: MapPin,
                  title: "Ciblage régional",
                  desc: "Recevez uniquement les demandes de votre secteur d'intervention.",
                },
                {
                  icon: ShieldCheck,
                  title: "Cahier des charges",
                  desc: "Conformité obligatoire au dispositif des primes énergies, aucune ambiguïté.",
                },
                {
                  icon: TrendingUp,
                  title: "Visibilité premium",
                  desc: "Votre offre exposée à des milliers de visiteurs qualifiés chaque mois.",
                },
              ].map((b, i) => (
                <Card
                  key={i}
                  className="border-2 border-transparent hover:border-orange-300 hover:shadow-xl transition-all bg-white"
                >
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4 shadow-lg">
                      <b.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{b.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* COMMENT ÇA MARCHE */}
        <section id="comment-ca-marche" className="py-16 bg-orange-950/[0.02]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Comment ça marche&nbsp;?</h2>
              <p className="text-muted-foreground">Trois étapes simples pour rejoindre le réseau.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                {
                  icon: FileCheck,
                  step: "01",
                  title: "Candidature en ligne",
                  desc: "Remplissez le formulaire ci-dessous avec les informations de votre entreprise et vos qualifications.",
                },
                {
                  icon: Users,
                  step: "02",
                  title: "Étude du dossier",
                  desc: "Notre équipe partenariats valide votre conformité (RGE, assurance, cahier des charges) sous 48-72h ouvrées.",
                },
                {
                  icon: Rocket,
                  step: "03",
                  title: "Mise en ligne",
                  desc: "Vos offres sont publiées et vous recevez vos premiers leads qualifiés dans votre zone.",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="relative bg-white rounded-2xl border-2 border-orange-100 p-6 hover:border-orange-400 hover:shadow-xl transition-all"
                >
                  <div className="absolute -top-4 -right-4 w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white font-extrabold text-xl flex items-center justify-center shadow-lg">
                    {s.step}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                    <s.icon className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRÉREQUIS */}
        <section className="py-16 bg-gradient-to-br from-amber-50 via-orange-50/50 to-amber-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="bg-white rounded-2xl border-2 border-orange-200 shadow-xl p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold">Prérequis pour candidater</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                Le respect du cahier des charges des primes énergies est <strong>obligatoire</strong>.
                Sans ces qualifications, votre dossier ne pourra être validé.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "Certification RGE en cours de validité",
                  "SIRET actif depuis au moins 12 mois",
                  "Assurance décennale à jour",
                  "Références clients vérifiables",
                  "Respect des grilles tarifaires primes",
                  "Zone d'intervention clairement définie",
                ].map((req, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
                    <span className="text-sm">{req}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FORMULAIRE */}
        <section id="form-partenaire" className="py-16 bg-gradient-to-b from-background to-amber-50/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
                <Briefcase className="w-4 h-4" />
                Candidature partenaire
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
                Déposez votre dossier
              </h2>
              <p className="text-muted-foreground">
                Réponse sous 48 à 72h ouvrées. Toutes les informations restent confidentielles.
              </p>
            </div>

            <form
              onSubmit={onSubmit}
              className="bg-white rounded-2xl border-2 border-orange-200 shadow-xl p-6 md:p-8 space-y-6"
            >
              {/* Entreprise */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-orange-700 mb-3">
                  Entreprise
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Raison sociale <span className="text-destructive">*</span></Label>
                    <Input value={data.companyName} onChange={(e) => set("companyName", e.target.value)} placeholder="SARL Dupont Rénovation" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>SIRET <span className="text-destructive">*</span></Label>
                    <Input value={data.siret} onChange={(e) => set("siret", e.target.value.replace(/\s/g, ""))} placeholder="14 chiffres" maxLength={14} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Site web</Label>
                    <Input value={data.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-orange-700 mb-3">
                  Contact
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Prénom <span className="text-destructive">*</span></Label>
                    <Input value={data.firstName} onChange={(e) => set("firstName", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nom <span className="text-destructive">*</span></Label>
                    <Input value={data.lastName} onChange={(e) => set("lastName", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Fonction</Label>
                    <Input value={data.role} onChange={(e) => set("role", e.target.value)} placeholder="Gérant, chargé d'affaires..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email pro <span className="text-destructive">*</span></Label>
                    <Input type="email" value={data.email} onChange={(e) => set("email", e.target.value)} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Téléphone <span className="text-destructive">*</span></Label>
                    <Input type="tel" value={data.phone} onChange={(e) => set("phone", e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Activité */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-orange-700 mb-3">
                  Activité
                </h3>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Zone d'intervention <span className="text-destructive">*</span></Label>
                    <Input value={data.zone} onChange={(e) => set("zone", e.target.value)} placeholder="Ex. Bouches-du-Rhône, Var, région PACA..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Types de travaux proposés <span className="text-destructive">*</span></Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {WORK_TYPES.map((w) => {
                        const active = data.workTypes.includes(w);
                        return (
                          <button
                            key={w}
                            type="button"
                            onClick={() => toggleWorkType(w)}
                            className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm text-left transition-all ${
                              active
                                ? "border-orange-500 bg-orange-50 text-orange-900 font-semibold"
                                : "border-border hover:border-orange-300"
                            }`}
                          >
                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${active ? "text-orange-600" : "text-muted-foreground/40"}`} />
                            {w}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <Checkbox
                      id="rge"
                      checked={data.rge}
                      onCheckedChange={(v) => set("rge", v === true)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="rge" className="text-sm leading-relaxed cursor-pointer">
                      Je certifie disposer d'une <strong>certification RGE en cours de validité</strong> et
                      m'engage à respecter le cahier des charges des primes énergies.
                    </Label>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Message (facultatif)</Label>
                    <Textarea
                      value={data.message}
                      onChange={(e) => set("message", e.target.value)}
                      placeholder="Présentez brièvement votre entreprise, vos volumes, vos spécialités..."
                      rows={4}
                      maxLength={1500}
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                size="lg"
                className="w-full h-12 bg-gradient-to-r from-amber-600 via-orange-500 to-orange-600 hover:opacity-95 text-white font-bold gap-2 shadow-lg"
              >
                <Send className="w-4 h-4" />
                {submitting ? "Envoi en cours..." : "Envoyer ma candidature"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                En soumettant ce formulaire, vous acceptez d'être recontacté par notre
                équipe partenariats. Vos données restent strictement confidentielles.
              </p>
            </form>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default DevenirPartenaire;
