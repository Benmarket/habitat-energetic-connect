import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useMemberHomeProfile } from "@/hooks/useMemberHomeProfile";
import { supabase } from "@/integrations/supabase/client";
import StepHousingProfile from "@/components/economies/StepHousingProfile";
import StepAddress from "@/components/economies/StepAddress";
import StepSurface from "@/components/economies/StepSurface";
import StepEquipments from "@/components/economies/StepEquipments";
import BlockedAccess from "@/components/economies/BlockedAccess";
import Dashboard from "@/components/economies/Dashboard";
import { estimateDpe } from "@/lib/dpeCalculator";

const STEPS = ["Profil", "Adresse", "Surface", "Équipements", "Analyse"];

const Economies = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { profile, equipments, reference, settings, loading, reload, upsertProfile, setEquipmentSelection } =
    useMemberHomeProfile();

  const [step, setStep] = useState<number>(0);
  const [draft, setDraft] = useState<{ housing_status?: any; housing_type?: any }>({});
  const [leadSurface, setLeadSurface] = useState<number | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [editing, setEditing] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) navigate("/connexion?redirect=/economies", { replace: true });
  }, [user, authLoading, navigate]);

  // Initial step from profile
  useEffect(() => {
    if (!profile) return;
    setDraft({ housing_status: profile.housing_status, housing_type: profile.housing_type });
    if (profile.completed_at && !editing) setShowDashboard(true);
  }, [profile, editing]);

  // Pré-remplissage surface depuis le dernier lead de l'utilisateur
  useEffect(() => {
    if (!user || profile?.surface_m2) return;
    (async () => {
      const { data } = await supabase
        .from("leads")
        .select("notes")
        .eq("email", user.email!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      // notes peut contenir un JSON sérialisé avec surface, tentative best-effort
      if (data?.notes) {
        const m = data.notes.match(/(\d{2,4})\s*m[²2]/i);
        if (m) setLeadSurface(Number(m[1]));
      }
    })();
  }, [user, profile]);

  const housingStatus = draft.housing_status ?? profile?.housing_status ?? null;
  const housingType = draft.housing_type ?? profile?.housing_type ?? null;

  const blocked = useMemo(() => {
    if (!housingStatus || !housingType) return null;
    const tenantBlocked = housingStatus === "locataire" && !settings.allow_tenants;
    const apartmentBlocked = housingType === "appartement" && !settings.allow_apartments;
    if (tenantBlocked && apartmentBlocked) return "both" as const;
    if (tenantBlocked) return "tenant" as const;
    if (apartmentBlocked) return "apartment" as const;
    return null;
  }, [housingStatus, housingType, settings]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const goTo = (n: number) => setStep(n);

  const handleProfileChange = (patch: any) => {
    setDraft((d) => ({ ...d, ...patch }));
  };

  const validateStep1 = async () => {
    if (!housingStatus || !housingType) return;
    try {
      await upsertProfile({
        housing_status: housingStatus,
        housing_type: housingType,
        wizard_step_completed: Math.max(profile?.wizard_step_completed || 0, 1),
      });
      goTo(1);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const renderContent = () => {
    if (showDashboard && profile) {
      return (
        <Dashboard
          profile={profile}
          equipments={equipments}
          reference={reference}
          onEdit={() => {
            setEditing(true);
            setShowDashboard(false);
            setStep(0);
          }}
        />
      );
    }

    if (step === 0) {
      return (
        <StepHousingProfile
          housingStatus={housingStatus}
          housingType={housingType}
          onChange={handleProfileChange}
          onNext={validateStep1}
        />
      );
    }

    if (blocked) {
      return (
        <BlockedAccess
          reason={blocked}
          onReset={() => {
            setStep(0);
          }}
        />
      );
    }

    if (step === 1) {
      return (
        <StepAddress
          address={profile?.address ?? null}
          postalCode={profile?.postal_code ?? null}
          city={profile?.city ?? null}
          latitude={profile?.latitude ?? null}
          longitude={profile?.longitude ?? null}
          onSave={async (p) => {
            await upsertProfile({ ...p, wizard_step_completed: Math.max(profile?.wizard_step_completed || 0, 2) });
          }}
          onNext={() => goTo(2)}
          onBack={() => goTo(0)}
        />
      );
    }

    if (step === 2) {
      return (
        <StepSurface
          surface={profile?.surface_m2 ?? null}
          prefilledFromLead={leadSurface}
          onSave={async (m2) => {
            await upsertProfile({ surface_m2: m2, wizard_step_completed: Math.max(profile?.wizard_step_completed || 0, 3) });
          }}
          onNext={() => goTo(3)}
          onBack={() => goTo(1)}
        />
      );
    }

    if (step === 3) {
      return (
        <StepEquipments
          reference={reference}
          initial={equipments.map((e) => ({ equipment_key: e.equipment_key, category: e.category, status: e.status, details: e.details as any }))}
          onSave={async (items) => {
            if (!profile) return;
            await setEquipmentSelection(profile.id, items);
            // Recharge équipements puis estime DPE
            const fresh = items.map((i, idx) => ({
              id: String(idx),
              profile_id: profile.id,
              user_id: profile.user_id,
              equipment_key: i.equipment_key,
              category: i.category,
              status: i.status,
              details: {},
              installed_by: null,
            }));
            const dpe = estimateDpe(profile.surface_m2, fresh as any);
            await upsertProfile({
              dpe_estimated: dpe,
              wizard_step_completed: 4,
              completed_at: new Date().toISOString(),
            });
            await reload();
            setEditing(false);
            setShowDashboard(true);
          }}
          onNext={() => {}}
          onBack={() => goTo(2)}
        />
      );
    }

    return null;
  };

  const progress = showDashboard ? 100 : ((step + 1) / STEPS.length) * 100;

  return (
    <>
      <Helmet>
        <title>Mes économies — Espace membre</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Header />
      <main className="min-h-screen bg-muted/30 pt-24 pb-16">
        <div className="container max-w-5xl mx-auto px-4">
          {!showDashboard && (
            <div className="mb-8 text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Mes économies réalisées</h1>
              <p className="text-muted-foreground">
                Construisez votre fiche logement pour visualiser vos économies actuelles et votre potentiel.
              </p>
              <div className="mt-6">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  {STEPS.map((s, i) => (
                    <span key={s} className={i === step ? "text-primary font-semibold" : ""}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          <Card className="p-6 md:p-8">{renderContent()}</Card>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Economies;
