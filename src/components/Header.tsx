import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, User, Home, BarChart3, MessageCircle, Users, LogOut, ChevronDown, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { MegaMenu } from "@/components/MegaMenu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { AuthModal } from "@/components/AuthModal";
import { LiveChatNotifications } from "@/components/LiveChatNotifications";
import whatsappIcon from "@/assets/whatsapp-icon.png";
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
  const [isUserMenuExpanded, setIsUserMenuExpanded] = useState(false);
  const [profile, setProfile] = useState<{ first_name: string | null; last_name: string | null; account_type: string | null; company_name: string | null } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Fetch profile
      supabase
        .from('profiles')
        .select('first_name, last_name, account_type, company_name')
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
          <Link to="/" className="flex flex-col shrink-0">
            <span className="text-2xl font-bold leading-tight">
              <span className="text-primary">Prime </span>
              <span className="text-foreground">energies</span>
            </span>
            <span className="text-xs text-muted-foreground">prime-energies.fr</span>
          </Link>

          {/* Desktop Navigation - Hidden on smaller screens */}
          <div className="hidden lg:flex flex-1 justify-center">
            <MegaMenu />
          </div>

          {/* Right side container */}
          <div className="flex items-center gap-3 lg:gap-4 ml-auto">
            {/* Right side actions - Progressive visibility */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
              {/* WhatsApp - visible from md, fixed size */}
              <a 
                href="#whatsapp" 
                className="flex items-center justify-center w-8 h-8 flex-shrink-0 rounded-full hover:scale-110 transition-all duration-300 hover:shadow-lg"
                aria-label="Contacter via WhatsApp"
              >
                <img src={whatsappIcon} alt="WhatsApp" className="w-8 h-8 object-contain" />
              </a>
              
              {/* Phone - visible from md, strict one-line layout */}
              <a 
                href="tel:0800123456" 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 hover:bg-muted/70 rounded-full transition-all duration-300 hover:shadow-md border border-border/50 flex-shrink-0"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 flex-shrink-0">
                  <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                </div>
                <span className="font-bold text-foreground text-sm tracking-wide whitespace-nowrap">0 800 123 456</span>
              </a>
              
              {/* Installer button - visible from lg only */}
              <Button asChild className="hidden lg:flex whitespace-nowrap text-sm lg:text-base px-3 lg:px-4">
                <Link to="/#etude">Trouver un installateur</Link>
              </Button>
              
              {/* Live chat notifications - visible for admins */}
              {isAdminOrAbove && <LiveChatNotifications />}
              
              {/* User menu - visible from md */}
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
                  <div className="flex items-start gap-3 px-2 py-3 mb-2">
                    <Avatar className="h-12 w-12 bg-primary">
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1">
                      <span className="font-semibold text-foreground">{getFullName()}</span>
                      {profile?.account_type === 'professionnel' && profile?.company_name && (
                        <span className="text-xs text-muted-foreground mt-0.5">{profile.company_name}</span>
                      )}
                      <Badge variant="outline" className="w-fit text-xs bg-emerald-50 text-emerald-700 border-emerald-200 mt-1">
                        {profile?.account_type || 'particulier'}
                      </Badge>
                      <div className="flex justify-end mt-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate("/profil")}
                          className="flex items-center gap-1.5 text-xs h-auto py-1 px-2"
                        >
                          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">Mon compte</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer py-2.5">
                    <Home className="mr-3 h-4 w-4 text-muted-foreground" />
                    <span>Tableau de bord</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => navigate("/economies")} className="cursor-pointer py-2.5">
                    <BarChart3 className="mr-3 h-4 w-4 text-muted-foreground" />
                    <span>Économies réalisées</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => navigate("/forum")} className="cursor-pointer py-2.5">
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
              <Button variant="outline" onClick={() => setIsAuthModalOpen(true)} className="gap-2">
                <User className="h-4 w-4" />
                Espace Perso
              </Button>
            )}
            </div>

            {/* Mobile Menu Button - visible below lg */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-foreground hover:text-primary transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation - visible below lg */}
        {isMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-4">
              {/* User menu button - at the top */}
              {user && (
                <div className="pb-4 border-b border-border">
                  <button
                    onClick={() => setIsUserMenuExpanded(!isUserMenuExpanded)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 bg-primary">
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium text-foreground">{getFullName()}</span>
                        {getRoleDisplay() && (
                          <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200 mt-1">
                            {getRoleDisplay()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isUserMenuExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Expanded user menu */}
                  {isUserMenuExpanded && (
                    <div className="mt-3 p-3 rounded-lg bg-background border border-border space-y-2">
                      {profile?.account_type === 'professionnel' && profile?.company_name && (
                        <div className="text-xs text-muted-foreground pb-2 border-b border-border">
                          {profile.company_name}
                        </div>
                      )}
                      
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsUserMenuExpanded(false);
                          navigate("/profil");
                        }}
                        className="flex items-center w-full py-2 px-2 rounded-md hover:bg-accent transition-colors text-left text-sm"
                      >
                        <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                        <span>Mon compte</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsUserMenuExpanded(false);
                          navigate("/dashboard");
                        }}
                        className="flex items-center w-full py-2 px-2 rounded-md hover:bg-accent transition-colors text-left text-sm"
                      >
                        <Home className="mr-3 h-4 w-4 text-muted-foreground" />
                        <span>Tableau de bord</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsUserMenuExpanded(false);
                          navigate("/economies");
                        }}
                        className="flex items-center w-full py-2 px-2 rounded-md hover:bg-accent transition-colors text-left text-sm"
                      >
                        <BarChart3 className="mr-3 h-4 w-4 text-muted-foreground" />
                        <span>Économies réalisées</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsUserMenuExpanded(false);
                          navigate("/forum");
                        }}
                        className="flex items-center w-full py-2 px-2 rounded-md hover:bg-accent transition-colors text-left text-sm"
                      >
                        <MessageCircle className="mr-3 h-4 w-4 text-muted-foreground" />
                        <span>Forums de discussion</span>
                      </button>
                      
                      {isAdminOrAbove && (
                        <>
                          <div className="border-t border-border my-2" />
                          <button
                            onClick={() => {
                              setIsMenuOpen(false);
                              setIsUserMenuExpanded(false);
                              navigate("/administration");
                            }}
                            className="flex items-center w-full py-2 px-2 rounded-md hover:bg-accent transition-colors text-left text-sm"
                          >
                            <Users className="mr-3 h-4 w-4 text-purple-600" />
                            <span className="text-purple-600 font-medium">Administration</span>
                          </button>
                        </>
                      )}
                      
                      <div className="border-t border-border my-2" />
                      
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsUserMenuExpanded(false);
                          handleSignOut();
                        }}
                        className="flex items-center w-full py-2 px-2 rounded-md hover:bg-accent transition-colors text-left text-sm text-red-600"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        <span>Se déconnecter</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
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
              <a
                href="#whatsapp"
                className="flex items-center text-foreground hover:text-primary transition-colors"
              >
                <img src={whatsappIcon} alt="WhatsApp" className="w-[18px] h-[18px] mr-2" />
                <span className="font-semibold">WhatsApp</span>
              </a>
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
                {!user && (
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
