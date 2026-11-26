import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ArrowLeft, ArrowRight, Search, Eye, Loader2, Download, FileSpreadsheet, FileText, Archive, X } from 'lucide-react';
import { prepareSolarExport, deliverSolarExport, type SolarSimulationRow, type SolarExportFormat, type PreparedSolarExport } from '@/lib/solar-simulation-export';

type RecordRow = SolarSimulationRow;
const FIELD_LABELS: Record<string, string> = { postalCode: 'Code postal', city: 'Ville', housing: 'Logement', surface: 'Surface (m²)', ownership: 'Propriétaire', orientation: 'Orientation', roofType: 'Toiture', equipments: 'Équipements', monthlyBill: 'Facture mensuelle (€)', householdSize: 'Personnes au foyer', projectHorizon: 'Délai', hasQuote: 'Devis reçu', batteryInterest: 'Intérêt batterie' };
const valueText = (v: unknown): string => v === null || v === '' || v === undefined ? '—' : Array.isArray(v) ? v.join(', ') || '—' : typeof v === 'boolean' ? (v ? 'Oui' : 'Non') : String(v);

export default function AdminSolarSimulations() {
  const [search, setSearch] = useState(''); const [query, setQuery] = useState(''); const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<RecordRow[]>([]); const [total, setTotal] = useState(0); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [detail, setDetail] = useState<RecordRow | null>(null); const [detailLoading, setDetailLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exportOpen, setExportOpen] = useState(false); const [exporting, setExporting] = useState(false);
  const [prepared, setPrepared] = useState<PreparedSolarExport | null>(null); const [exportError, setExportError] = useState('');
  const [progress, setProgress] = useState('');
  const allPageSelected = rows.length > 0 && rows.every(row => selected.has(row.reference));
  const somePageSelected = rows.some(row => selected.has(row.reference));
  function toggle(reference: string, checked: boolean) {
    setSelected(previous => { const next = new Set(previous); if (checked) next.add(reference); else next.delete(reference); return next; });
  }
  function togglePage(checked: boolean) {
    setSelected(previous => { const next = new Set(previous); rows.forEach(row => checked ? next.add(row.reference) : next.delete(row.reference)); return next; });
  }
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    supabase.rpc('get_solar_simulations', { p_search: query, p_offset: offset }).then(({ data, error }) => {
      if (!active) return; setLoading(false);
      if (error) { setError('Impossible de charger les simulations.'); return; }
      const result = data as unknown as { items: RecordRow[]; total: number }; setRows(result.items); setTotal(result.total);
    });
    return () => { active = false; };
  }, [query, offset]);
  async function open(reference: string) {
    setDetailLoading(true); setError('');
    const { data, error } = await supabase.rpc('get_solar_simulations', { p_reference: reference });
    setDetailLoading(false);
    if (error) { setError('Impossible de charger le compte rendu.'); return; }
    const result = data as unknown as { items: RecordRow[] }; setDetail(result.items[0] ?? null);
  }
  async function exportRecords(references: string[], format: SolarExportFormat) {
    if (!references.length || exporting) return;
    setExportOpen(true); setExporting(true); setPrepared(null); setExportError('');
    try {
      const records: RecordRow[] = [];
      // Read every full snapshot via the existing super-admin RPC, including off-page selections.
      for (const reference of references) {
        setProgress(`${records.length + 1} / ${references.length}`);
        const { data, error: rpcError } = await supabase.rpc('get_solar_simulations', { p_reference: reference });
        if (rpcError) throw new Error('Impossible de lire une simulation. Aucun export partiel n’a été téléchargé.');
        const result = data as unknown as { items: RecordRow[] };
        const record = result?.items?.find(item => item.reference === reference);
        if (!record) throw new Error('Une simulation sélectionnée n’est plus accessible.');
        records.push(record);
      }
      setProgress('Préparation des fichiers…');
      setPrepared(await prepareSolarExport(records, format));
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Impossible de préparer l’export.');
    } finally { setExporting(false); }
  }
  return <><Helmet><title>Simulations utilisateurs | Prime Énergies</title><meta name="robots" content="noindex, nofollow" /></Helmet><Header />
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <Button asChild variant="ghost"><Link to="/administration"><ArrowLeft className="w-4 h-4 mr-2" />Administration</Link></Button>
      <h1 className="text-2xl font-bold mt-4 mb-6">Simulations utilisateurs</h1>
      <form className="flex gap-2 mb-6" onSubmit={e => { e.preventDefault(); setOffset(0); setQuery(search.trim()); setSelected(new Set()); }}><Input aria-label="Code simulation ou nom" placeholder="Code simulation, nom ou email" value={search} onChange={e => setSearch(e.target.value)} /><Button type="submit" aria-label="Rechercher"><Search className="w-4 h-4" /></Button></form>
      {error && <p role="alert" className="text-destructive mb-4">{error}</p>}
      {loading ? <Loader2 className="animate-spin" /> : <><div className="flex flex-wrap items-center justify-between gap-3 mb-3"><p className="text-muted-foreground text-sm">{total} simulation(s){selected.size > 0 && ` · ${selected.size} sélectionnée(s)`}</p><div className="flex flex-wrap items-center gap-2">{selected.size > 0 && <Button variant="ghost" size="icon" aria-label="Effacer la sélection" title="Effacer la sélection" disabled={exporting} onClick={() => setSelected(new Set())}><X className="w-4 h-4" /></Button>}<ExportMenu label="Exporter la sélection" disabled={!selected.size || exporting} multiple={selected.size > 1} onExport={format => exportRecords([...selected], format)} /></div></div><div className="overflow-x-auto border rounded-lg"><Table><TableHeader><TableRow><TableHead className="w-10"><Checkbox aria-label="Sélectionner toute la page" checked={allPageSelected ? true : somePageSelected ? 'indeterminate' : false} disabled={exporting || !rows.length} onCheckedChange={checked => togglePage(checked === true)} /></TableHead><TableHead>Code simulation</TableHead><TableHead>Date</TableHead><TableHead>Client</TableHead><TableHead>Localisation</TableHead><TableHead>Facture</TableHead><TableHead>Lead</TableHead><TableHead>Compte rendu / Export</TableHead></TableRow></TableHeader><TableBody>
        {rows.map(row => <TableRow key={row.reference} data-state={selected.has(row.reference) ? 'selected' : undefined}><TableCell><Checkbox aria-label={`Sélectionner ${row.reference}`} checked={selected.has(row.reference)} disabled={exporting} onCheckedChange={checked => toggle(row.reference, checked === true)} /></TableCell><TableCell className="font-mono text-xs break-all max-w-56">{row.reference}</TableCell><TableCell>{new Date(row.created_at).toLocaleString('fr-FR')}</TableCell><TableCell>{row.lead_id ? `${row.first_name ?? ''} ${row.last_name ?? ''}` : 'Sans contact'}<div className="text-xs text-muted-foreground">{row.email}</div></TableCell><TableCell>{valueText(row.snapshot.inputs?.city)} · {valueText(row.snapshot.inputs?.postalCode)}</TableCell><TableCell>{valueText(row.snapshot.inputs?.monthlyBill)} €/mois</TableCell><TableCell>{row.lead_id ? 'Oui' : 'Non'}</TableCell><TableCell><div className="flex gap-2"><Button variant="outline" size="icon" aria-label={`Ouvrir ${row.reference}`} title="Voir le compte rendu" disabled={detailLoading} onClick={() => open(row.reference)}><Eye className="w-4 h-4" /></Button><ExportMenu label={`Exporter ${row.reference}`} iconOnly disabled={exporting} onExport={format => exportRecords([row.reference], format)} /></div></TableCell></TableRow>)}
        {!rows.length && <TableRow><TableCell colSpan={8} className="text-center py-8">Aucune simulation trouvée.</TableCell></TableRow>}
      </TableBody></Table></div><div className="flex justify-between mt-4"><Button variant="outline" disabled={!offset} onClick={() => setOffset(Math.max(0, offset - 25))}><ArrowLeft className="w-4 h-4 mr-2" />Précédent</Button><Button variant="outline" disabled={offset + 25 >= total} onClick={() => setOffset(offset + 25)}>Suivant<ArrowRight className="w-4 h-4 ml-2" /></Button></div></>}
    </main>
    <Dialog open={!!detail} onOpenChange={o => { if (!o) setDetail(null); }}><DialogContent className="max-w-3xl w-[calc(100%-2rem)] max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>Compte rendu conservé</DialogTitle><DialogDescription className="font-mono break-all">{detail?.reference}</DialogDescription></DialogHeader>{detail && <>
      <div className="flex flex-wrap justify-between items-center gap-3"><p className="break-all">{detail.first_name} {detail.last_name} · {detail.email ?? 'Sans contact'} · {detail.phone}</p><ExportMenu label="Exporter ce compte rendu" disabled={exporting} onExport={format => exportRecords([detail.reference], format)} /></div>
      <h2 className="font-semibold">Informations renseignées</h2><dl className="grid sm:grid-cols-2 gap-3">{Object.entries(detail.snapshot.inputs ?? {}).map(([key, value]) => <div key={key}><dt className="text-xs text-muted-foreground">{FIELD_LABELS[key] ?? key}</dt><dd className="break-words">{valueText(value)}</dd></div>)}</dl>
      <h2 className="font-semibold mt-4">Résultats enregistrés</h2><div className="grid sm:grid-cols-2 gap-4">{(['sans','avec'] as const).map(key => { const sc = detail.snapshot.engine?.[key]; return sc ? <section key={key} className="border rounded-lg p-4"><h3 className="font-semibold mb-2">{key === 'avec' ? 'Avec batterie' : 'Sans batterie'}</h3><p>{sc.puissanceKwc} kWc · {sc.nbPanneaux} panneaux</p><p>{sc.economiesAn} € de gains/an</p><p>{sc.nouvelleFactureMensuelle} €/mois de facture estimée</p><p>{sc.couvertureBesoinsPct} % de besoins couverts</p><p>{sc.gains25ans} € de gains sur 25 ans</p><p>{sc.resteACharge} € de reste à charge</p></section> : null; })}</div>
      <details className="mt-4"><summary className="cursor-pointer font-medium">Toutes les données du calcul conservé</summary><pre className="mt-3 whitespace-pre-wrap break-all text-xs bg-muted p-3 rounded-lg">{JSON.stringify(detail.snapshot, null, 2)}</pre></details>
    </>}</DialogContent></Dialog>
    <Dialog open={exportOpen} onOpenChange={open => { if (!exporting) { setExportOpen(open); if (!open) setPrepared(null); } }}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>{exporting ? 'Préparation de l’export' : exportError ? 'Export indisponible' : 'Export prêt'}</DialogTitle><DialogDescription className="break-all">{exporting ? progress : prepared?.filename ?? 'Veuillez réessayer.'}</DialogDescription></DialogHeader>{exporting && <Loader2 aria-label="Préparation en cours" className="w-6 h-6 animate-spin" />}{exportError && <p role="alert" className="text-destructive">{exportError}</p>}{prepared && <Button className="w-full gap-2" onClick={() => deliverSolarExport(prepared).catch(() => setExportError('Le téléchargement a échoué. Réessayez.'))}><Download className="w-4 h-4" />Télécharger</Button>}</DialogContent></Dialog>
  </>;
}

function ExportMenu({ label, iconOnly, disabled, multiple, onExport }: { label: string; iconOnly?: boolean; disabled?: boolean; multiple?: boolean; onExport: (format: SolarExportFormat) => void }) {
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size={iconOnly ? 'icon' : 'default'} disabled={disabled} aria-label={label} title={label} className="gap-2 shrink-0"><Download className="w-4 h-4" />{!iconOnly && label}</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => onExport('csv')}><FileSpreadsheet className="w-4 h-4 mr-2" />CSV</DropdownMenuItem><DropdownMenuItem onSelect={() => onExport('pdf')}><FileText className="w-4 h-4 mr-2" />{multiple ? 'PDF par simulation (ZIP)' : 'PDF'}</DropdownMenuItem><DropdownMenuItem onSelect={() => onExport('both')}><Archive className="w-4 h-4 mr-2" />CSV + PDF (ZIP)</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}