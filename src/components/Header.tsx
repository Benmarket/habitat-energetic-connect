import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, User, Shield, Home, BarChart3, MessageCircle, Users, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { MegaMenu } from "@/components/MegaMenu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { AuthModal } from "@/components/AuthModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [profile, setProfile] = useState<{ first_name: string | null; last_name: string | null } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Fetch profile
      supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data);
        });

      // Fetch role
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setUserRole(data.role);
        });
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return user?.email?.[0].toUpperCase() || "U";
  };

  const getFullName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return user?.email?.split('@')[0] || "Utilisateur";
  };

  const getRoleDisplay = () => {
    if (userRole === 'super_admin') return 'Super Admin';
    if (userRole === 'admin') return 'Admin';
    if (userRole === 'moderator') return 'Modérateur';
    return null;
  };

  const isAdminOrAbove = userRole === 'super_admin' || userRole === 'admin' || userRole === 'moderator';

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
                  <Button variant="ghost" className="flex items-center gap-2 h-auto py-2 px-3">
                    <Avatar className="h-10 w-10 bg-primary">
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium text-foreground">{getFullName()}</span>
                      {getRoleDisplay() && (
                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
                          {getRoleDisplay()}
                        </Badge>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2">
                  {/* User Header */}
                  <div className="flex items-center gap-3 px-2 py-3 mb-2">
                    <Avatar className="h-12 w-12 bg-primary">
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{getFullName()}</span>
                      <Badge variant="outline" className="w-fit text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                        particulier
                      </Badge>
                    </div>
                  </div>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer py-2.5">
                    <Shield className="mr-3 h-4 w-4 text-muted-foreground" />
                    <span>Mon compte</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => navigate("/mes-maisons")} className="cursor-pointer py-2.5">
                    <Home className="mr-3 h-4 w-4 text-muted-foreground" />
                    <span>Mes maisons</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => navigate("/economies")} className="cursor-pointer py-2.5">
                    <BarChart3 className="mr-3 h-4 w-4 text-muted-foreground" />
                    <span>Économies réalisées</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => navigate("/forums")} className="cursor-pointer py-2.5">
                    <MessageCircle className="mr-3 h-4 w-4 text-muted-foreground" />
                    <span>Forums de discussion</span>
                  </DropdownMenuItem>
                  
                  {isAdminOrAbove && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/administration")} className="cursor-pointer py-2.5">
                        <Users className="mr-3 h-4 w-4 text-purple-600" />
                        <span className="text-purple-600 font-medium">Administration</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer py-2.5 text-red-600 focus:text-red-600">
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>Se déconnecter</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" onClick={() => setIsAuthModalOpen(true)}>
                <User className="h-5 w-5 mr-2" />
                Connexion
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
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                  >
                    <User className="h-5 w-5 mr-2" />
                    Connexion
                  </Button>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
      
      <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
    </header>
  );
};

export default Header;
