import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { MegaMenu } from "@/components/MegaMenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold">
              <span className="text-primary">Prime</span>
              <span className="text-foreground">énergies</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <MegaMenu />

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center space-x-4">
            <a href="tel:0800123456" className="flex items-center text-foreground hover:text-primary transition-colors">
              <Phone className="w-4 h-4 mr-2" />
              <span className="font-semibold">0 800 123 456</span>
            </a>
            <Button asChild>
              <Link to="/#etude">Trouver un installateur</Link>
            </Button>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    Tableau de bord
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" asChild>
                <Link to="/connexion">
                  <User className="h-5 w-5 mr-2" />
                  Connexion
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-foreground hover:text-primary transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-4">
              <Link
                to="/offres"
                className="text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Offres
              </Link>
              <Link
                to="/guides"
                className="text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Guides
              </Link>
              <Link
                to="/aides"
                className="text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Aides
              </Link>
              <Link
                to="/actualites"
                className="text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Actualité
              </Link>
              <Link
                to="/simulateurs"
                className="text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Simulateurs
              </Link>
              <Link
                to="/qui-sommes-nous"
                className="text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Qui sommes-nous
              </Link>
              <a
                href="tel:0800123456"
                className="flex items-center text-foreground hover:text-primary transition-colors"
              >
                <Phone className="w-4 h-4 mr-2" />
                <span className="font-semibold">0 800 123 456</span>
              </a>
              <div className="pt-2 space-y-2">
                <Button asChild className="w-full">
                  <Link to="/#etude" onClick={() => setIsMenuOpen(false)}>
                    Trouver un installateur
                  </Link>
                </Button>
                {user ? (
                  <>
                    <Button variant="outline" asChild className="w-full">
                      <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                        Tableau de bord
                      </Link>
                    </Button>
                    <Button variant="outline" onClick={handleSignOut} className="w-full">
                      Déconnexion
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" asChild className="w-full">
                    <Link to="/connexion" onClick={() => setIsMenuOpen(false)}>
                      <User className="h-5 w-5 mr-2" />
                      Connexion
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
