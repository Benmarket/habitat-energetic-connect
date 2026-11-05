import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Send } from 'lucide-react';

export function PublishNewsletterDialog({ open, onOpenChange, onConfirm }: {
  open: boolean; onOpenChange: (open: boolean) => void; onConfirm: (send: boolean) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const confirm = async (send: boolean) => {
    if (busy) return;
    setBusy(true);
    try { await onConfirm(send); onOpenChange(false); } finally { setBusy(false); }
  };
  return <Dialog open={open} onOpenChange={(value) => { if (!busy) onOpenChange(value); }}>
    <DialogContent className="max-w-lg w-[calc(100%-2rem)]">
      <DialogHeader>
        <DialogTitle>Publier cet article</DialogTitle>
        <DialogDescription>Voulez-vous envoyer un mail aux membres de la newsletter ?</DialogDescription>
      </DialogHeader>
      <div className="border border-border rounded-md p-3 space-y-2">
        <p className="text-sm font-semibold">Système non encore appliqué — non fonctionnel</p>
        <p className="text-sm text-muted-foreground">« Oui » conserve uniquement une trace de votre demande. Aucun email ne sera envoyé ni programmé pour plus tard. « Non » publie sans demander d’envoi. Les anciens emails manquants ne seront pas relancés.</p>
      </div>
      <DialogFooter className="gap-2">
        <Button variant="outline" disabled={busy} onClick={() => confirm(false)}>Non, publier sans email</Button>
        <Button disabled={busy} onClick={() => confirm(true)}>{busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}Oui, demander l’envoi</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}