import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHead, TableHeader, TableRow, TableCell, TableBody } from '@/components/ui/table';
import { Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface Stats {
  total: number; sent: number; failed: number; pending: number; suppressed: number; opened: number; clicked: number;
  request: { status: string } | null;
  recipients: { message_id: string; recipient_email: string; status: string; opens: number; clicks: number; first_open: string | null; error_message: string | null }[];
}
const statuses: Record<string, string> = { sent: 'Envoyé', pending: 'En attente', dlq: 'Échec', failed: 'Échec', suppressed: 'Bloqué', bounced: 'Rejeté', complained: 'Signalé' };
export function ArticleEmailStatsDialog({ article, onClose }: { article: { id: string; title: string } | null; onClose: () => void }) {
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => { setPage(0); setData(null); }, [article?.id]);
  useEffect(() => {
    if (!article) return;
    let active = true;
    setLoading(true); setError('');
    supabase.rpc('get_article_email_stats', { p_post_id: article.id, p_offset: page * 50 }).then(({ data: result, error: failure }) => {
      if (!active) return;
      if (failure) { setError('Impossible de charger les statistiques. Réessayez.'); setData(null); }
      else setData(result as unknown as Stats);
      setLoading(false);
    });
    return () => { active = false; };
  }, [article?.id, page, refresh]);
  return <Dialog open={!!article} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="max-w-3xl w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Newsletter · statistiques</DialogTitle><DialogDescription>{article?.title}</DialogDescription></DialogHeader>
      <div className="flex justify-end"><Button variant="outline" size="icon" aria-label="Actualiser les statistiques" title="Actualiser" disabled={loading} onClick={() => setRefresh(v => v + 1)}><RefreshCw className="h-4 w-4" /></Button></div>
      {loading ? <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /> : error ? <p role="alert" className="text-destructive">{error}</p> : data && <>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[['Emails enregistrés', data.total], ['Envoyés', data.sent], ['Ouvertures détectées', data.opened], ['Destinataires ayant cliqué', data.clicked]].map(([label, value]) => <div key={label} className="border rounded-md p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{value}</p></div>)}
        </div>
        <p className="text-sm text-muted-foreground">En attente : {data.pending} · Échecs : {data.failed} · Bloqués : {data.suppressed}</p>
        {data.request?.status === 'blocked_provider' && <p className="text-sm text-destructive">Envoi demandé, mais bloqué : service newsletter dédié non connecté. Aucun envoi automatique n’est programmé.</p>}
        <p className="text-xs text-muted-foreground">« Envoyé » ne confirme pas la réception en boîte de réception. Les ouvertures sont détectées par image : les protections de messagerie et les robots peuvent les masquer ou les déclencher. Données sensibles, réservées au super administrateur.</p>
        {data.total === 0 ? <p className="text-sm py-4">Aucun email relié à cet article. Les anciens envois sans identifiant d’article ne peuvent pas lui être attribués avec certitude.</p> : <>
          <Table><TableHeader><TableRow><TableHead>Destinataire</TableHead><TableHead>Statut</TableHead><TableHead>Ouvertures</TableHead><TableHead>Clics</TableHead></TableRow></TableHeader>
            <TableBody>{data.recipients.map(r => <TableRow key={r.message_id}><TableCell className="break-all"><p>{r.recipient_email}</p>{r.first_open && <p className="text-xs text-muted-foreground">Première ouverture : {new Date(r.first_open).toLocaleString('fr-FR')}</p>}{r.error_message && <p className="text-xs text-destructive">{r.error_message}</p>}</TableCell><TableCell><Badge variant={['dlq', 'failed', 'bounced'].includes(r.status) ? 'destructive' : 'outline'}>{statuses[r.status] || r.status}</Badge></TableCell><TableCell>{r.opens}</TableCell><TableCell>{r.clicks}</TableCell></TableRow>)}</TableBody>
          </Table>
          <div className="flex justify-end items-center gap-3"><Button variant="outline" size="icon" aria-label="Page précédente" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button><span className="text-sm">{page + 1} / {Math.max(1, Math.ceil(data.total / 50))}</span><Button variant="outline" size="icon" aria-label="Page suivante" disabled={(page + 1) * 50 >= data.total} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button></div>
        </>}
      </>}
    </DialogContent>
  </Dialog>;
}