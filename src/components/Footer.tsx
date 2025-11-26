import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Youtube, MessageCircle, Phone } from "lucide-react";
import { NewsletterForm } from "@/components/NewsletterForm";

const Footer = () => {
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
              Votre portail de confiance pour les énergies renouvelables. Nous connectons les particuliers avec les meilleurs installateurs certifiés de France.
            </p>
            
            {/* Phone number */}
            <a 
              href="tel:0800123456" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 hover:shadow-lg border border-white/20 mb-6"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20">
                <Phone className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-sm tracking-wide">0 800 123 456</span>
            </a>
            
            <div className="flex gap-4">
              <a href="#" className="text-white/60 hover:text-white transition-colors" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors" aria-label="YouTube">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#whatsapp" className="text-white/60 hover:text-white transition-colors" aria-label="WhatsApp">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Navigation</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/actualites" className="text-white/70 hover:text-white transition-colors text-sm">
                Actualités
              </Link>
              <Link to="/aides" className="text-white/70 hover:text-white transition-colors text-sm">
                Aides
              </Link>
              <Link to="/guides" className="text-white/70 hover:text-white transition-colors text-sm">
                Guides
              </Link>
              <Link to="/offres" className="text-white/70 hover:text-white transition-colors text-sm">
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

          {/* Column 3: Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/services/installation-solaire" className="text-white/70 hover:text-white transition-colors text-sm">
                Installation solaire
              </Link>
              <Link to="/services/pompes-a-chaleur" className="text-white/70 hover:text-white transition-colors text-sm">
                Pompes à chaleur
              </Link>
              <Link to="/services/eolien-domestique" className="text-white/70 hover:text-white transition-colors text-sm">
                Éolien domestique
              </Link>
              <Link to="/services/stockage-energie" className="text-white/70 hover:text-white transition-colors text-sm">
                Stockage d'énergie
              </Link>
              <Link to="/services/audit-energetique" className="text-white/70 hover:text-white transition-colors text-sm">
                Audit énergétique
              </Link>
            </nav>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
            <p className="text-white/70 mb-4 text-sm">
              Recevez les dernières actualités et offres en énergies renouvelables.
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <nav className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-white/60">
            <Link to="/mentions-legales" className="hover:text-white transition-colors">
              Mentions légales
            </Link>
            <Link to="/politique-confidentialite" className="hover:text-white transition-colors">
              Politique de confidentialité
            </Link>
            <Link to="/conditions-utilisation" className="hover:text-white transition-colors">
              Conditions d'utilisation
            </Link>
            <Link to="/rgpd" className="hover:text-white transition-colors">
              RGPD
            </Link>
            <Link to="/plan-du-site" className="hover:text-white transition-colors">
              Plan du site
            </Link>
          </nav>
          <p className="text-sm text-white/60">
            © 2024 Prime Énergies. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
