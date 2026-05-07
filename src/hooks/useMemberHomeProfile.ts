import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type HousingStatus = "proprietaire" | "locataire";
export type HousingType = "maison" | "appartement";
export type DpeGrade = "A" | "B" | "C" | "D" | "E" | "F" | "G";
export type EquipmentCategory = "heating" | "solar" | "insulation" | "water" | "ventilation";
export type EquipmentStatus = "owned" | "wanted";

export interface HomeProfile {
  id: string;
  user_id: string;
  housing_status: HousingStatus | null;
  housing_type: HousingType | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  surface_m2: number | null;
  dpe_estimated: DpeGrade | null;
  dpe_user_provided: boolean;
  installed_by_global: string | null;
  wizard_step_completed: number;
  completed_at: string | null;
}

export interface HomeEquipment {
  id: string;
  profile_id: string;
  user_id: string;
  category: EquipmentCategory;
  equipment_key: string;
  status: EquipmentStatus;
  details: Record<string, any>;
  installed_by: string | null;
}

export interface SavingsReference {
  id: string;
  equipment_key: string;
  category: EquipmentCategory;
  label: string;
  description: string | null;
  avg_savings_per_year_eur: number;
  avg_savings_per_m2_eur: number;
  eligible_aids: string[];
  display_order: number;
}

export interface EconomiesSettings {
  allow_tenants: boolean;
  allow_apartments: boolean;
}

export function useMemberHomeProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<HomeProfile | null>(null);
  const [equipments, setEquipments] = useState<HomeEquipment[]>([]);
  const [reference, setReference] = useState<SavingsReference[]>([]);
  const [settings, setSettings] = useState<EconomiesSettings>({ allow_tenants: false, allow_apartments: false });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: p }, { data: ref }, { data: s }] = await Promise.all([
      supabase.from("member_home_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("equipment_savings_reference").select("*").order("display_order"),
      supabase.from("economies_settings").select("allow_tenants, allow_apartments").eq("id", 1).maybeSingle(),
    ]);
    setReference((ref as SavingsReference[]) || []);
    if (s) setSettings(s as EconomiesSettings);

    if (p) {
      setProfile(p as HomeProfile);
      const { data: eq } = await supabase
        .from("member_home_equipments")
        .select("*")
        .eq("profile_id", (p as HomeProfile).id);
      setEquipments((eq as HomeEquipment[]) || []);
    } else {
      setProfile(null);
      setEquipments([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const upsertProfile = useCallback(
    async (patch: Partial<HomeProfile>) => {
      if (!user) return null;
      const payload = { user_id: user.id, ...profile, ...patch };
      delete (payload as any).created_at;
      delete (payload as any).updated_at;
      const { data, error } = await supabase
        .from("member_home_profiles")
        .upsert(payload, { onConflict: "user_id" })
        .select()
        .single();
      if (error) throw error;
      setProfile(data as HomeProfile);
      return data as HomeProfile;
    },
    [user, profile]
  );

  const setEquipmentSelection = useCallback(
    async (profileId: string, items: { equipment_key: string; category: EquipmentCategory; status: EquipmentStatus; installed_by?: string | null; details?: Record<string, any> }[]) => {
      if (!user) return;
      await supabase.from("member_home_equipments").delete().eq("profile_id", profileId);
      if (items.length > 0) {
        const rows = items.map((i) => ({
          profile_id: profileId,
          user_id: user.id,
          equipment_key: i.equipment_key,
          category: i.category,
          status: i.status,
          installed_by: i.installed_by ?? null,
          details: i.details ?? {},
        }));
        const { data } = await supabase.from("member_home_equipments").insert(rows).select();
        setEquipments((data as HomeEquipment[]) || []);
      } else {
        setEquipments([]);
      }
    },
    [user]
  );

  return { profile, equipments, reference, settings, loading, reload: load, upsertProfile, setEquipmentSelection };
}
