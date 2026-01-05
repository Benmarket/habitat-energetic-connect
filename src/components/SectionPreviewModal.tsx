import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SolarBanner from "@/components/SolarBanner";
import WhySolarSection from "@/components/WhySolarSection";
import RenovationProgramSection from "@/components/RenovationProgramSection";
import NewsSection from "@/components/NewsSection";
import AidesSection from "@/components/AidesSection";
import GuidesSection from "@/components/GuidesSection";
import EligibilityFormSection from "@/components/EligibilityFormSection";
import SimulatorsSection from "@/components/SimulatorsSection";
import InstallerFinderSection from "@/components/InstallerFinderSection";
import PartnerOffersSection from "@/components/PartnerOffersSection";
import CTAPartner from "@/components/CTAPartner";
import FAQSection from "@/components/FAQSection";
import ReviewsSection from "@/components/ReviewsSection";
import ContactSection from "@/components/ContactSection";
import AppDownloadSection from "@/components/AppDownloadSection";

interface SectionPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string | null;
  sectionName: string;
}

const SECTION_COMPONENTS: Record<string, React.FC> = {
  'solar-banner': SolarBanner,
  'why-solar': WhySolarSection,
  'renovation': RenovationProgramSection,
  'news': NewsSection,
  'aides': AidesSection,
  'guides': GuidesSection,
  'eligibility': EligibilityFormSection,
  'simulators': SimulatorsSection,
  'installers': InstallerFinderSection,
  'partner-offers': PartnerOffersSection,
  'cta-partner': CTAPartner,
  'faq': FAQSection,
  'reviews': ReviewsSection,
  'contact': ContactSection,
  'app-download': AppDownloadSection,
};

const SectionPreviewModal = ({ open, onOpenChange, sectionId, sectionName }: SectionPreviewModalProps) => {
  const Component = sectionId ? SECTION_COMPONENTS[sectionId] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 border-b sticky top-0 bg-background z-10">
          <DialogTitle>Aperçu : {sectionName}</DialogTitle>
        </DialogHeader>
        <div className="bg-background">
          {Component ? (
            <div className="pointer-events-none">
              <Component />
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Aperçu non disponible pour cette section
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SectionPreviewModal;
