import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, Mail, Phone, ChevronDown, ChevronRight, Users, Inbox, Repeat, Download } from "lucide-react";

type UnifiedLead = {
  id: string;
  formId: string | null;
  formName: string;
  formIdentifier: string;
  submittedAt: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  data: Record<string, any>;
};

// Extract email/phone/name from arbitrary submission data payloads
function extractContact(data: any): { email: string | null; phone: string | null; name: string | null } {
  if (!data || typeof data !== "object") return { email: null, phone: null, name: null };
  const email =
    data.email || data.mail || data.Email || data.e_mail || null;
  const phone =
    data.phone || data.telephone || data.tel || data.phoneNumber || data.mobile || null;
  const fullName =
    data.fullName ||
    data.full_name ||
    data.name ||
    [data.firstName || data.prenom || data.first_name, data.lastName || data.nom || data.last_name]
      .filter(Boolean)
      .join(" ") ||
    null;
  return {
    email: email ? String(email).toLowerCase().trim() : null,
    phone: phone ? String(phone).trim() : null,
    name: fullName ? String(fullName).trim() : null,
  };
}

function normalizeKey(email: string | null, phone: string | null): string | null {
  if (email) return `e:${email}`;
  if (phone) return `p:${phone.replace(/\D/g, "")}`;
  return null;
}

export default function AllLeadsPanel() {
  const [search, setSearch] = useState("");
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["all-leads-unified"],
    queryFn: async () => {
      const [forms, subs, news] = await Promise.all([
        supabase.from("form_configurations").select("id, name, form_identifier"),
        supabase.from("form_submissions").select("id, form_id, data, submitted_at").order("submitted_at", { ascending: false }).limit(2000),
        supabase.from("newsletter_subscribers").select("id, email, source, subscribed_at, created_at").order("subscribed_at", { ascending: false }).limit(2000),
      ]);
      if (forms.error) throw forms.error;
      if (subs.error) throw subs.error;

      const formMap = new Map((forms.data || []).map((f: any) => [f.id, f]));
      const leads: UnifiedLead[] = [];

      (subs.data || []).forEach((s: any) => {
        const form = formMap.get(s.form_id);
        const c = extractContact(s.data);
        leads.push({
          id: s.id,
          formId: s.form_id,
          formName: form?.name || "Formulaire inconnu",
          formIdentifier: form?.form_identifier || "—",
          submittedAt: s.submitted_at,
          email: c.email,
          phone: c.phone,
          name: c.name,
          data: s.data || {},
        });
      });

      if (!news.error) {
        (news.data || []).forEach((n: any) => {
          leads.push({
            id: `news_${n.id}`,
            formId: null,
            formName: "Newsletter",
            formIdentifier: "newsletter",
            submittedAt: n.subscribed_at || n.created_at,
            email: n.email ? String(n.email).toLowerCase().trim() : null,
            phone: null,
            name: null,
            data: { email: n.email, source: n.source },
          });
        });
      }

      leads.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      return leads;
    },
    refetchInterval: 15000,
  });

  const leads = data || [];

  // Group by contact key
  const grouped = useMemo(() => {
    const map = new Map<string, { key: string; email: string | null; phone: string | null; name: string | null; leads: UnifiedLead[] }>();
    const orphans: UnifiedLead[] = [];
    leads.forEach((l) => {
      const key = normalizeKey(l.email, l.phone);
      if (!key) {
        orphans.push(l);
        return;
      }
      if (!map.has(key)) {
        map.set(key, { key, email: l.email, phone: l.phone, name: l.name, leads: [] });
      }
      const g = map.get(key)!;
      g.leads.push(l);
      if (!g.name && l.name) g.name = l.name;
      if (!g.email && l.email) g.email = l.email;
      if (!g.phone && l.phone) g.phone = l.phone;
    });
    const groups = Array.from(map.values()).map((g) => ({
      ...g,
      lastAt: g.leads[0]?.submittedAt,
    }));
    groups.sort((a, b) => new Date(b.lastAt!).getTime() - new Date(a.lastAt!).getTime());
    return { groups, orphans };
  }, [leads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return grouped.groups;
    return grouped.groups.filter((g) => {
      return (
        g.email?.toLowerCase().includes(q) ||
        g.phone?.toLowerCase().includes(q) ||
        g.name?.toLowerCase().includes(q) ||
        g.leads.some((l) => l.formName.toLowerCase().includes(q))
      );
    });
  }, [grouped, search]);

  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const uniquePeople = grouped.groups.length;
    const multi = grouped.groups.filter((g) => g.leads.length > 1).length;
    return { totalLeads, uniquePeople, multi };
  }, [leads, grouped]);

  const toggle = (k: string) => {
    setOpenKeys((prev) => {
      const n = new Set(prev);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  };

  const exportCSV = () => {
    const rows = [
      ["Date", "Nom", "Email", "Téléphone", "Formulaire", "Identifiant"],
      ...leads.map((l) => [
        new Date(l.submittedAt).toLocaleString("fr-FR"),
        l.name || "",
        l.email || "",
        l.phone || "",
        l.formName,
        l.formIdentifier,
      ]),
    ];
    const csv = rows
      .map((r) =>
        r.map((v) => (typeof v === "string" && (v.includes(",") || v.includes('"')) ? `"${v.replace(/"/g, '""')}"` : v)).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tous-les-leads_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Inbox className="h-5 w-5 text-primary" />
              Tous les leads — vue unifiée
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Agrégation en temps réel de toutes les soumissions, groupées par personne (email/téléphone), du plus récent au plus ancien.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1"><Inbox className="h-3 w-3" /> {stats.totalLeads} soumissions</Badge>
            <Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" /> {stats.uniquePeople} personnes</Badge>
            <Badge variant="secondary" className="gap-1"><Repeat className="h-3 w-3" /> {stats.multi} récurrentes</Badge>
            <Button size="sm" variant="outline" onClick={exportCSV} disabled={!leads.length}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par email, téléphone, nom ou formulaire..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>

        <div className="max-h-[520px] overflow-y-auto rounded-md border bg-background">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Aucun lead trouvé</div>
          ) : (
            <ul className="divide-y">
              {filtered.slice(0, 200).map((g) => {
                const last = g.leads[0];
                const isOpen = openKeys.has(g.key);
                return (
                  <li key={g.key}>
                    <Collapsible open={isOpen} onOpenChange={() => toggle(g.key)}>
                      <CollapsibleTrigger asChild>
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 text-left">
                          {isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm truncate">
                                {g.name || g.email || g.phone || "Anonyme"}
                              </span>
                              {g.leads.length > 1 && (
                                <Badge variant="default" className="h-5 gap-1">
                                  <Repeat className="h-3 w-3" /> {g.leads.length}×
                                </Badge>
                              )}
                              <Badge variant="outline" className="h-5 text-xs">{last.formName}</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                              {g.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{g.email}</span>}
                              {g.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{g.phone}</span>}
                              <span>· {new Date(last.submittedAt).toLocaleString("fr-FR")}</span>
                            </div>
                          </div>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-3 pl-11 space-y-2">
                          {g.leads.map((l) => (
                            <div key={l.id} className="rounded-md border bg-muted/30 p-2.5 text-xs">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="h-5">{l.formName}</Badge>
                                  <span className="text-muted-foreground font-mono">{l.formIdentifier}</span>
                                </div>
                                <span className="text-muted-foreground">{new Date(l.submittedAt).toLocaleString("fr-FR")}</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                                {Object.entries(l.data)
                                  .filter(([k]) => !k.startsWith("_"))
                                  .slice(0, 10)
                                  .map(([k, v]) => (
                                    <div key={k} className="truncate">
                                      <span className="text-muted-foreground">{k}:</span>{" "}
                                      <span className="font-medium">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {grouped.orphans.length > 0 && (
          <p className="text-xs text-muted-foreground">
            + {grouped.orphans.length} soumission(s) sans email/téléphone (non groupables).
          </p>
        )}
      </CardContent>
    </Card>
  );
}
