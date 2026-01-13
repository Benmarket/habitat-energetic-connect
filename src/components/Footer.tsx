import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Youtube, MessageCircle, Phone } from "lucide-react";
import { NewsletterForm } from "@/components/NewsletterForm";
import { supabase } from "@/integrations/supabase/client";

const Footer = () => {
  const [headerFooterSettings, setHeaderFooterSettings] = useState({
    showPhone: false,
    phoneNumber: "0 800 123 456",
    showWhatsapp: false,
    whatsappLink: "",
    showMemberSpace: true,
  });

  // Génère le lien WhatsApp à partir du paramètre configuré
  const getWhatsappUrl = () => {
    const link = headerFooterSettings.whatsappLink?.trim();
    if (!link) return "#";
    // Si c'est déjà une URL complète
    if (link.startsWith("http://") || link.startsWith("https://")) {
      return link;
    }
    // Sinon on considère que c'est un numéro (avec ou sans +)
    const cleanNumber = link.replace(/[^0-9]/g, "");
    return `https://wa.me/${cleanNumber}`;
  };

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'header_footer')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          const value = data.value as any;
          setHeaderFooterSettings({
            showPhone: value.showPhone ?? false,
            phoneNumber: value.phoneNumber || "0 800 123 456",
            showWhatsapp: value.showWhatsapp ?? false,
            whatsappLink: value.whatsappLink || "",
            showMemberSpace: value.showMemberSpace ?? true,
          });
        }
      });
  }, []);

  return (
    <footer className="bg-[#1a2332] text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Logo and description */}
          <div>
            <Link to="/" className="inline-block mb-4">
              <h2 className="text-2xl font-bold">
                <span className="text-primary">Prime</span>
                <span className="text-white"> energies</span>
              </h2>
              <p className="text-sm text-white/60">prime-energies.fr</p>
            </Link>
            <p className="text-white/70 mb-6 text-sm leading-relaxed">
              Votre portail de confiance pour les énergies renouvelables. Nous connectons les particuliers avec les
              meilleurs installateurs certifiés de France.
            </p>
          </div>

          {/* Column 2: Newsletter */}
          <div className="lg:order-4">
            <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
            <p className="text-white/70 mb-4 text-sm">
              Recevez les dernières actualités et offres en énergies renouvelables.
            </p>
            <NewsletterForm />
          </div>

          {/* Columns 3 & 4: Navigation and Services - Side by side on mobile */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-6 lg:gap-8 lg:order-2">
            {/* Column 3: Navigation */}
            <div>
              <h3 className="text-base lg:text-lg font-semibold mb-4">Navigation</h3>
              <nav className="grid grid-cols-1 gap-2">
                <Link to="/actualites" className="text-white/70 hover:text-white transition-colors text-sm">
                  Actualités
                </Link>
                <Link to="/aides" className="text-white/70 hover:text-white transition-colors text-sm">
                  Aides
                </Link>
                <Link to="/guides" className="text-white/70 hover:text-white transition-colors text-sm">
                  Guides
                </Link>
                <Link to="/#offres" className="text-white/70 hover:text-white transition-colors text-sm">
                  Offres
                </Link>
                <Link to="/simulateurs" className="text-white/70 hover:text-white transition-colors text-sm">
                  Simulateurs
                </Link>
                <Link to="/a-propos" className="text-white/70 hover:text-white transition-colors text-sm">
                  À propos
                </Link>
              </nav>
            </div>

            {/* Column 4: Services */}
            <div>
              <h3 className="text-base lg:text-lg font-semibold mb-4">Services</h3>
              <nav className="grid grid-cols-1 gap-2">
                <Link
                  to="/services/installation-solaire"
                  className="text-white/70 hover:text-white transition-colors text-sm"
                >
                  Installation solaire
                </Link>
                <Link
                  to="/services/pompes-a-chaleur"
                  className="text-white/70 hover:text-white transition-colors text-sm"
                >
                  Pompes à chaleur
                </Link>
                <Link
                  to="/services/eolien-domestique"
                  className="text-white/70 hover:text-white transition-colors text-sm"
                >
                  Éolien domestique
                </Link>
                <Link
                  to="/services/stockage-energie"
                  className="text-white/70 hover:text-white transition-colors text-sm"
                >
                  Stockage d'énergie
                </Link>
                <Link
                  to="/services/audit-energetique"
                  className="text-white/70 hover:text-white transition-colors text-sm"
                >
                  Audit énergétique
                </Link>
                <Link
                  to="/services/amelioration-habitat"
                  className="text-white/70 hover:text-white transition-colors text-sm"
                >
                  Amélioration de l'habitat
                </Link>
              </nav>
            </div>
          </div>
        </div>

        {/* Phone number and social icons - centered below all columns */}
        <div className="flex flex-nowrap items-center justify-center gap-3 mb-8">
          {headerFooterSettings.showPhone && (
            <a
              href={`tel:${headerFooterSettings.phoneNumber.replace(/\s/g, '')}`}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 hover:shadow-lg border border-white/20"
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20">
                <Phone className="w-3 h-3 text-white" />
              </div>
              <span className="font-bold text-white text-xs tracking-wide whitespace-nowrap">{headerFooterSettings.phoneNumber}</span>
            </a>
          )}

          <div className="flex gap-3">
            <a href="#" className="text-white/60 hover:text-white transition-colors" aria-label="Facebook">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="#" className="text-white/60 hover:text-white transition-colors" aria-label="Twitter">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" className="text-white/60 hover:text-white transition-colors" aria-label="LinkedIn">
              <Linkedin className="w-4 h-4" />
            </a>
            <a href="#" className="text-white/60 hover:text-white transition-colors" aria-label="YouTube">
              <Youtube className="w-4 h-4" />
            </a>
            {headerFooterSettings.showWhatsapp && (
              <a href={getWhatsappUrl()} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors" aria-label="WhatsApp">
                <MessageCircle className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col items-center gap-4">
          <nav className="flex flex-wrap justify-center gap-4 text-sm text-white/60">
            <Link to="/mentions-legales" className="hover:text-white transition-colors">
              Mentions légales
            </Link>
            <Link to="/politique-confidentialite" className="hover:text-white transition-colors">
              Politique de confidentialité
            </Link>
            <Link to="/conditions-utilisation" className="hover:text-white transition-colors">
              Conditions d'utilisation
            </Link>
            <Link to="/plan-du-site" className="hover:text-white transition-colors">
              Plan du site
            </Link>
          </nav>
          <p className="text-sm text-white/60 text-center">© 2018-2026 Prime Énergies. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;