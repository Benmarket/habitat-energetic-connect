import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Eye, Download } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface GuideStatsModalProps {
  open: boolean;
  onClose: () => void;
  mode: "views" | "downloads";
  guide: { id: string; slug: string; title: string } | null;
}

export function GuideStatsModal({ open, onClose, mode, guide }: GuideStatsModalProps) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!open || !guide) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (mode === "downloads") {
          const { data } = await supabase
            .from("guide_downloads")
            .select("id, email, first_name, last_name, phone, method, user_id, created_at")
            .eq("guide_id", guide.id)
            .order("created_at", { ascending: false })
            .limit(500);
          if (!cancelled) setRows(data || []);
        } else {
          // Vues : on filtre page_views sur le path du guide
          const path = `/guides/${guide.slug}`;
          const { data } = await supabase
            .from("page_views")
            .select("id, visitor_id, user_id, referrer, user_agent, created_at")
            .or(`page_url.eq.${path},page_url.ilike.${path}?%`)
            .order("created_at", { ascending: false })
            .limit(500);
          if (!cancelled) setRows(data || []);
        }
      } catch (e) {
        console.error("[GuideStatsModal] fetch error", e);
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, guide, mode]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "downloads" ? <Download className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            {mode === "downloads" ? "Téléchargements" : "Vues"} — {guide?.title}
          </DialogTitle>
          <DialogDescription>
            {mode === "downloads"
              ? "Liste des leads/membres ayant téléchargé ce guide (500 derniers)."
              : "Sessions ayant consulté la page du guide (500 derniers)."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Aucune donnée pour ce guide.
          </p>
        ) : mode === "downloads" ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Identité</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {format(new Date(r.created_at), "d MMM yyyy HH:mm", { locale: fr })}
                  </TableCell>
                  <TableCell className="text-sm">
                    {[r.first_name, r.last_name].filter(Boolean).join(" ") || "—"}
                  </TableCell>
                  <TableCell className="text-sm">{r.email || "—"}</TableCell>
                  <TableCell className="text-sm">{r.phone || "—"}</TableCell>
                  <TableCell>
                    {r.user_id ? (
                      <Badge variant="default">Membre</Badge>
                    ) : (
                      <Badge variant="secondary">Lead</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Visiteur</TableHead>
                <TableHead>Référent</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {format(new Date(r.created_at), "d MMM yyyy HH:mm", { locale: fr })}
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {r.visitor_id ? r.visitor_id.slice(0, 16) + "…" : "—"}
                  </TableCell>
                  <TableCell className="text-xs truncate max-w-[200px]">
                    {r.referrer || "(direct)"}
                  </TableCell>
                  <TableCell>
                    {r.user_id ? (
                      <Badge variant="default">Membre</Badge>
                    ) : (
                      <Badge variant="secondary">Visiteur</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
