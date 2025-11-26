import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Eye } from "lucide-react";

interface PageDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageUrl: string;
}

const PageDetailsModal = ({ open, onOpenChange, pageUrl }: PageDetailsModalProps) => {
  const getPageDetails = (url: string) => {
    switch (url) {
      case "/":
        return {
          title: "Page d'accueil",
          sections: [
            {
              label: "Pages principales",
              items: [
                { name: "Hero Section", views: 350, trend: "+12%" },
                { name: "Section Simulateurs", views: 298, trend: "+18%" },
                { name: "Section Aides", views: 245, trend: "+8%" }
              ]
            }
          ]
        };
      
      case "/actualites":
        return {
          title: "Actualités",
          sections: [
            {
              label: "Catégories les plus vues",
              items: [
                { name: "Énergies renouvelables", views: 156, trend: "+15%" },
                { name: "Subventions", views: 98, trend: "+22%" },
                { name: "Rénovation énergétique", views: 67, trend: "+8%" }
              ]
            },
            {
              label: "Articles les plus vus",
              items: [
                { name: "CEE Chauffage : tout savoir", views: 89, trend: "+25%" },
                { name: "Deadline novembre 2025", views: 72, trend: "+18%" },
                { name: "MaPrimeRénov' 2025", views: 58, trend: "+12%" }
              ]
            }
          ]
        };
      
      case "/guides":
        return {
          title: "Guides",
          sections: [
            {
              label: "Catégories les plus vues",
              items: [
                { name: "Installation solaire", views: 124, trend: "+20%" },
                { name: "Isolation thermique", views: 89, trend: "+15%" },
                { name: "Pompes à chaleur", views: 76, trend: "+10%" }
              ]
            },
            {
              label: "Guides les plus consultés",
              items: [
                { name: "Guide complet panneaux solaires", views: 67, trend: "+28%" },
                { name: "Isolation combles perdus", views: 54, trend: "+19%" },
                { name: "Choisir sa PAC air-eau", views: 48, trend: "+14%" }
              ]
            }
          ]
        };
      
      case "/aides":
        return {
          title: "Aides & Subventions",
          sections: [
            {
              label: "Catégories les plus vues",
              items: [
                { name: "Aides nationales", views: 112, trend: "+18%" },
                { name: "Aides locales", views: 87, trend: "+12%" },
                { name: "CEE", views: 73, trend: "+25%" }
              ]
            },
            {
              label: "Aides les plus consultées",
              items: [
                { name: "MaPrimeRénov' 2025", views: 95, trend: "+30%" },
                { name: "CEE Chauffage", views: 68, trend: "+22%" },
                { name: "Éco-PTZ", views: 52, trend: "+15%" }
              ]
            }
          ]
        };
      
      case "/annonces":
        return {
          title: "Annonces",
          sections: [
            {
              label: "Catégories les plus vues",
              items: [
                { name: "Offres partenaires", views: 98, trend: "+24%" },
                { name: "Promotions solaires", views: 76, trend: "+19%" },
                { name: "Offres isolation", views: 64, trend: "+11%" }
              ]
            },
            {
              label: "Annonces les plus vues",
              items: [
                { name: "Installation solaire -30%", views: 78, trend: "+35%" },
                { name: "PAC air-eau premium", views: 62, trend: "+28%" },
                { name: "Isolation combles offerte", views: 49, trend: "+16%" }
              ]
            }
          ]
        };
      
      case "/offres":
        return {
          title: "Offres Partenaires",
          sections: [
            {
              label: "Catégories les plus vues",
              items: [
                { name: "Offres solaires", views: 87, trend: "+22%" },
                { name: "Offres chauffage", views: 65, trend: "+17%" },
                { name: "Offres isolation", views: 52, trend: "+13%" }
              ]
            },
            {
              label: "Offres les plus consultées",
              items: [
                { name: "Pack solaire complet", views: 71, trend: "+31%" },
                { name: "PAC réversible", views: 58, trend: "+24%" },
                { name: "Isolation totale maison", views: 44, trend: "+18%" }
              ]
            }
          ]
        };
      
      case "/forum":
        return {
          title: "Forum Communautaire",
          sections: [
            {
              label: "Catégories les plus actives",
              items: [
                { name: "Questions installation solaire", views: 156, trend: "+28%" },
                { name: "Retours d'expérience PAC", views: 134, trend: "+22%" },
                { name: "Conseils isolation", views: 98, trend: "+15%" }
              ]
            },
            {
              label: "Topics les plus consultés",
              items: [
                { name: "Mon installation solaire 6kWc", views: 234, trend: "+42%" },
                { name: "PAC air-eau : vos avis ?", views: 189, trend: "+35%" },
                { name: "Isolation combles : quel budget ?", views: 156, trend: "+27%" }
              ]
            }
          ]
        };
      
      default:
        return null;
    }
  };

  const details = getPageDetails(pageUrl);

  if (!details) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Détails de la page : <span className="text-primary">{details.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {details.sections.map((section, idx) => (
            <div key={idx} className="space-y-3">
              <h3 className="font-semibold text-lg text-foreground">{section.label}</h3>
              <div className="space-y-2">
                {section.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{item.name}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                        <span className="font-bold text-foreground">{item.views}</span>
                        <span className="text-xs text-muted-foreground">vues</span>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {item.trend}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PageDetailsModal;
