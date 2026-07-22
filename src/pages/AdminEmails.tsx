import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { format, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { ArrowLeft, Loader2, Mail, Search, RefreshCw, Download } from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type PresetKey = "24h" | "7d" | "30d" | "90d";

function computePreset(key: PresetKey): DateRange {
  const to = new Date();
  const map: Record<PresetKey, number> = { "24h": 1, "7d": 7, "30d": 30, "90d": 90 };
  return { from: subDays(to, map[key]), to };
}

interface EmailLogRow {
  id: string;
  message_id: string | null;
  template_name: string | null;
  recipient_email: string | null;
  status: string | null;
  error_message: string | null;
  created_at: string;
  opens?: number;
  clicks?: number;
  first_open_at?: string | null;
  last_click_url?: string | null;
}


const STATUS_STYLES: Record<string, string> = {
  sent: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  suppressed: "bg-amber-100 text-amber-700 border-amber-200",
  failed: "bg-red-100 text-red-700 border-red-200",
  dlq: "bg-red-100 text-red-700 border-red-200",
  bounced: "bg-red-100 text-red-700 border-red-200",
  complained: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_LABEL: Record<string, string> = {
  sent: "Envoyé",
  pending: "En attente",
  suppressed: "Supprimé",
  failed: "Échec",
  dlq: "Échec (DLQ)",
  bounced: "Rebond",
  complained: "Plainte",
};

const AdminEmails = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [range, setRange] = useState<DateRange>(() => computePreset("30d"));
  const [rows, setRows] = useState<EmailLogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [templateFilter, setTemplateFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => {
    if (!authLoading && !user) navigate("/connexion");
  }, [user, authLoading, navigate]);

  const load = async () => {
    if (!range.from || !range.to) return;
    setLoading(true);
    const from = new Date(range.from);
    from.setHours(0, 0, 0, 0);
    const to = new Date(range.to);
    to.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("email_send_log")
      .select("id,message_id,template_name,recipient_email,status,error_message,created_at")
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString())
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) {
      console.error("[AdminEmails] load error:", error);
      setRows([]);
    } else {
      setRows((data as EmailLogRow[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from?.toISOString(), range.to?.toISOString()]);

  // Deduplicate by message_id — keep the latest status per email.
  const deduped = useMemo(() => {
    const seen = new Map<string, EmailLogRow>();
    for (const r of rows) {
      const key = r.message_id || r.id;
      if (!seen.has(key)) seen.set(key, r);
    }
    return Array.from(seen.values());
  }, [rows]);

  const templateOptions = useMemo(() => {
    const set = new Set<string>();
    deduped.forEach((r) => r.template_name && set.add(r.template_name));
    return Array.from(set).sort();
  }, [deduped]);

  const filtered = useMemo(() => {
    return deduped.filter((r) => {
      if (templateFilter !== "all" && r.template_name !== templateFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        const hay = `${r.recipient_email ?? ""} ${r.template_name ?? ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [deduped, templateFilter, statusFilter, search]);

  const stats = useMemo(() => {
    const s = { total: 0, sent: 0, failed: 0, suppressed: 0, pending: 0 };
    filtered.forEach((r) => {
      s.total++;
      const st = r.status || "";
      if (st === "sent") s.sent++;
      else if (["failed", "dlq", "bounced", "complained"].includes(st)) s.failed++;
      else if (st === "suppressed") s.suppressed++;
      else if (st === "pending") s.pending++;
    });
    return s;
  }, [filtered]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => setPage(0), [templateFilter, statusFilter, search]);

  const exportCsv = () => {
    const header = ["date", "template", "destinataire", "statut", "erreur"].join(",");
    const lines = filtered.map((r) =>
      [
        r.created_at,
        r.template_name ?? "",
        r.recipient_email ?? "",
        r.status ?? "",
        (r.error_message ?? "").replace(/[\n,]/g, " "),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `emails-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Emails automatiques | Administration</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6 md:py-10 max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link
                to="/administration"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Mail className="w-6 h-6 text-purple-600" />
                Emails automatiques
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Journal complet des envois : leads, confirmations, newsletter, réinitialisations…
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Rafraîchir
              </Button>
              <Button variant="outline" size="sm" onClick={exportCsv}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <StatCard label="Total" value={stats.total} />
            <StatCard label="Envoyés" value={stats.sent} tone="emerald" />
            <StatCard label="Échecs" value={stats.failed} tone="red" />
            <StatCard label="Supprimés" value={stats.suppressed} tone="amber" />
            <StatCard label="En attente" value={stats.pending} tone="slate" />
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="flex gap-2">
                  {(["24h", "7d", "30d", "90d"] as PresetKey[]).map((k) => (
                    <Button
                      key={k}
                      variant="outline"
                      size="sm"
                      onClick={() => setRange(computePreset(k))}
                    >
                      {k}
                    </Button>
                  ))}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      {range.from && range.to
                        ? `${format(range.from, "dd MMM", { locale: fr })} – ${format(range.to, "dd MMM yyyy", { locale: fr })}`
                        : "Choisir une période"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={range}
                      onSelect={(r) => r && setRange(r)}
                      numberOfMonths={2}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
                <Select value={templateFilter} onValueChange={setTemplateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type d'email" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {templateOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="sent">Envoyés</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="failed">Échecs</SelectItem>
                    <SelectItem value="dlq">Échecs (DLQ)</SelectItem>
                    <SelectItem value="suppressed">Supprimés</SelectItem>
                    <SelectItem value="bounced">Rebonds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Rechercher par email ou type…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {filtered.length} email{filtered.length > 1 ? "s" : ""}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-16 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : paginated.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  Aucun email envoyé sur cette période.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Destinataire</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Erreur</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginated.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {format(new Date(r.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {r.template_name ?? "—"}
                            </TableCell>
                            <TableCell className="text-sm">{r.recipient_email ?? "—"}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={STATUS_STYLES[r.status ?? ""] ?? ""}
                              >
                                {STATUS_LABEL[r.status ?? ""] ?? r.status ?? "—"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                              {r.error_message ?? ""}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4 text-sm">
                      <span className="text-muted-foreground">
                        Page {page + 1} / {totalPages}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPage((p) => Math.max(0, p - 1))}
                          disabled={page === 0}
                        >
                          Précédent
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                          disabled={page >= totalPages - 1}
                        >
                          Suivant
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    </>
  );
};

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "emerald" | "red" | "amber" | "slate";
}) {
  const toneClass: Record<string, string> = {
    default: "text-foreground",
    emerald: "text-emerald-600",
    red: "text-red-600",
    amber: "text-amber-600",
    slate: "text-slate-600",
  };
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
        <p className={`text-2xl font-bold ${toneClass[tone]}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

export default AdminEmails;
