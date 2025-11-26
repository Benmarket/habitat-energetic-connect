import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Eye, UserCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface LiveVisitorsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PresenceState {
  [key: string]: Array<{
    presence_ref: string;
    user_id?: string;
    user_name?: string;
    account_type?: string;
    online_at?: string;
  }>;
}

const LiveVisitorsModal = ({ open, onOpenChange }: LiveVisitorsModalProps) => {
  const [presenceState, setPresenceState] = useState<PresenceState>({});
  const { user } = useAuth();

  useEffect(() => {
    if (!open) return;

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user?.id || `anonymous-${Math.random().toString(36).substr(2, 9)}`,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setPresenceState(state);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const presenceData = user?.id
            ? {
                user_id: user.id,
                user_name: user.user_metadata?.first_name 
                  ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
                  : user.email,
                account_type: user.user_metadata?.account_type || 'particulier',
                online_at: new Date().toISOString(),
              }
            : {
                online_at: new Date().toISOString(),
              };

          await channel.track(presenceData);
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [open, user]);

  const visitors = Object.values(presenceState).flat();
  const authenticatedUsers = visitors.filter((v) => v.user_id);
  const anonymousCount = visitors.filter((v) => !v.user_id).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Eye className="w-6 h-6 text-primary" />
            Visiteurs en direct
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Explication */}
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <p className="text-sm text-muted-foreground">
              Cette vue en temps réel affiche tous les utilisateurs actuellement actifs sur le site.
              Les utilisateurs connectés sont identifiés par leur nom, tandis que les visiteurs non
              connectés sont comptabilisés comme visiteurs classiques.
            </p>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  Utilisateurs connectés
                </span>
              </div>
              <div className="text-3xl font-bold text-primary">{authenticatedUsers.length}</div>
            </div>

            <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <UserCircle className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Visiteurs classiques
                </span>
              </div>
              <div className="text-3xl font-bold text-foreground">{anonymousCount}</div>
            </div>
          </div>

          {/* Liste des utilisateurs authentifiés */}
          {authenticatedUsers.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Utilisateurs connectés
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {authenticatedUsers.map((visitor, idx) => {
                  const initials = visitor.user_name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || 'U';

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground">
                            {visitor.user_name || 'Utilisateur'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            En ligne depuis{' '}
                            {Math.floor(
                              (Date.now() - new Date(visitor.online_at).getTime()) / 1000 / 60
                            )}{' '}
                            min
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {visitor.account_type}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Visiteurs anonymes */}
          {anonymousCount > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-muted-foreground" />
                Visiteurs classiques
              </h3>
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {anonymousCount} visiteur{anonymousCount > 1 ? 's' : ''} non identifié
                    {anonymousCount > 1 ? 's' : ''} navigue{anonymousCount > 1 ? 'nt' : ''} actuellement
                    sur le site
                  </span>
                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(anonymousCount, 5))].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-muted-foreground/40"
                      />
                    ))}
                    {anonymousCount > 5 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        +{anonymousCount - 5}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {visitors.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <UserCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucun visiteur en ligne pour le moment</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LiveVisitorsModal;
