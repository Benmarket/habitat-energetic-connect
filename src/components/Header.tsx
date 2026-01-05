import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, User, Home, BarChart3, MessageCircle, Users, LogOut, ChevronDown, Settings } from "lucide-react";
import RegionSubHeader from "@/components/RegionSubHeader";
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [profile, setProfile] = useState<{ first_name: string | null; last_name: string | null; account_type: string | null; company_name: string | null } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [headerFooterSettings, setHeaderFooterSettings] = useState({
    showPhone: false,
    phoneNumber: "0 800 123 456",
    showWhatsapp: false,
    whatsappLink: "",
    showMemberSpace: true,
    showInstallerButton: true,
    installerButtonText: "Trouver un installateur",
    installerButtonColor: "#22c55e",
    installerButtonTextColor: "#ffffff",
    installerButtonBorderRadius: 6,
    installerButtonPaddingX: 16,
    installerButtonPaddingY: 8,
    installerButtonBorderWidth: 0,
    installerButtonBorderColor: "#000000",
    installerButtonBorderStyle: "solid",
    installerButtonShadowSize: "none",
    installerButtonUseGradient: false,
    installerButtonGradientColor1: "#22c55e",
    installerButtonGradientColor2: "#16a34a",
    installerButtonGradientAngle: 90,
    installerButtonLink: "/#etude",
    showRegionSubHeader: true,
    memberMenuShowAccount: true,
    memberMenuShowDashboard: true,
    memberMenuShowEconomies: true,
    memberMenuShowForum: true,
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === "/";

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

  // Scroll detection for sub-header with hysteresis to prevent flickering
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Add hysteresis: collapse at 60px, expand at 30px to avoid flickering
      if (!isScrolled && currentScrollY > 60) {
        setIsScrolled(true);
      } else if (isScrolled && currentScrollY < 30) {
        setIsScrolled(false);
      }
      lastScrollY = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isScrolled]);

  useEffect(() => {
    // Load header/footer settings
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
            showInstallerButton: value.showInstallerButton ?? true,
            installerButtonText: value.installerButtonText || "Trouver un installateur",
            installerButtonColor: value.installerButtonColor || "#22c55e",
            installerButtonTextColor: value.installerButtonTextColor || "#ffffff",
            installerButtonBorderRadius: value.installerButtonBorderRadius ?? 6,
            installerButtonPaddingX: value.installerButtonPaddingX ?? 16,
            installerButtonPaddingY: value.installerButtonPaddingY ?? 8,
            installerButtonBorderWidth: value.installerButtonBorderWidth ?? 0,
            installerButtonBorderColor: value.installerButtonBorderColor || "#000000",
            installerButtonBorderStyle: value.installerButtonBorderStyle || "solid",
            installerButtonShadowSize: value.installerButtonShadowSize || "none",
            installerButtonUseGradient: value.installerButtonUseGradient ?? false,
            installerButtonGradientColor1: value.installerButtonGradientColor1 || "#22c55e",
            installerButtonGradientColor2: value.installerButtonGradientColor2 || "#16a34a",
            installerButtonGradientAngle: value.installerButtonGradientAngle ?? 90,
            installerButtonLink: value.installerButtonLink || "/#etude",
            showRegionSubHeader: value.showRegionSubHeader ?? true,
            memberMenuShowAccount: value.memberMenuShowAccount ?? true,
            memberMenuShowDashboard: value.memberMenuShowDashboard ?? true,
            memberMenuShowEconomies: value.memberMenuShowEconomies ?? true,
            memberMenuShowForum: value.memberMenuShowForum ?? true,
          });
        }
        setSettingsLoaded(true);
      });
  }, []);

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
    <header className="sticky top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
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
              {headerFooterSettings.showWhatsapp && (
                <a 
                  href={getWhatsappUrl()} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-8 h-8 flex-shrink-0 rounded-full hover:scale-110 transition-all duration-300 hover:shadow-lg"
                  aria-label="Contacter via WhatsApp"
                >
                  <img src={whatsappIcon} alt="WhatsApp" className="w-8 h-8 object-contain" />
                </a>
              )}
              
              {/* Phone - visible from md, strict one-line layout */}
              {headerFooterSettings.showPhone && (
                <a 
                  href={`tel:${headerFooterSettings.phoneNumber.replace(/\s/g, '')}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 hover:bg-muted/70 rounded-full transition-all duration-300 hover:shadow-md border border-border/50 flex-shrink-0"
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 flex-shrink-0">
                    <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  </div>
                  <span className="font-bold text-foreground text-sm tracking-wide whitespace-nowrap">{headerFooterSettings.phoneNumber}</span>
                </a>
              )}
              
              {/* Installer button - visible from lg only */}
              {headerFooterSettings.showInstallerButton && (
                <button 
                  onClick={() => {
                    const link = headerFooterSettings.installerButtonLink;
                    if (link.includes('#')) {
                      const [path, hash] = link.split('#');
                      const currentPath = window.location.pathname;
                      // If we're already on the target page or it's the home page
                      if (!path || path === '/' || currentPath === path) {
                        const element = document.getElementById(hash);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        }
                      } else {
                        // Navigate to the page first, then scroll
                        navigate(link);
                      }
                    } else {
                      navigate(link);
                    }
                  }}
                  className="hidden lg:flex whitespace-nowrap font-medium transition-all hover:opacity-90 cursor-pointer"
                  style={{
                    background: headerFooterSettings.installerButtonUseGradient
                      ? `linear-gradient(${headerFooterSettings.installerButtonGradientAngle}deg, ${headerFooterSettings.installerButtonGradientColor1}, ${headerFooterSettings.installerButtonGradientColor2})`
                      : headerFooterSettings.installerButtonColor,
                    color: headerFooterSettings.installerButtonTextColor,
                    borderRadius: `${headerFooterSettings.installerButtonBorderRadius}px`,
                    padding: `${headerFooterSettings.installerButtonPaddingY}px ${headerFooterSettings.installerButtonPaddingX}px`,
                    border: headerFooterSettings.installerButtonBorderWidth > 0 
                      ? `${headerFooterSettings.installerButtonBorderWidth}px ${headerFooterSettings.installerButtonBorderStyle} ${headerFooterSettings.installerButtonBorderColor}` 
                      : 'none',
                    boxShadow: headerFooterSettings.installerButtonShadowSize === 'sm' ? '0 1px 2px rgba(0,0,0,0.05)' 
                      : headerFooterSettings.installerButtonShadowSize === 'md' ? '0 4px 6px rgba(0,0,0,0.1)'
                      : headerFooterSettings.installerButtonShadowSize === 'lg' ? '0 10px 15px rgba(0,0,0,0.15)'
                      : 'none',
                  }}
                >
                  {headerFooterSettings.installerButtonText}
                </button>
              )}
              
              {/* Live chat notifications - visible for admins */}
              {isAdminOrAbove && <LiveChatNotifications />}
              
              {/* User menu - visible from md */}
              {user && headerFooterSettings.showMemberSpace ? (
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
                      {headerFooterSettings.memberMenuShowAccount && (
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
                      )}
                    </div>
                  </div>
                  
                  <DropdownMenuSeparator />
                  
                  {headerFooterSettings.memberMenuShowDashboard && (
                    <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer py-2.5">
                      <Home className="mr-3 h-4 w-4 text-muted-foreground" />
                      <span>Tableau de bord</span>
                    </DropdownMenuItem>
                  )}
                  
                  {headerFooterSettings.memberMenuShowEconomies && (
                    <DropdownMenuItem onClick={() => navigate("/economies")} className="cursor-pointer py-2.5">
                      <BarChart3 className="mr-3 h-4 w-4 text-muted-foreground" />
                      <span>Économies réalisées</span>
                    </DropdownMenuItem>
                  )}
                  
                  {headerFooterSettings.memberMenuShowForum && (
                    <DropdownMenuItem onClick={() => navigate("/forum")} className="cursor-pointer py-2.5">
                      <MessageCircle className="mr-3 h-4 w-4 text-muted-foreground" />
                      <span>Forums de discussion</span>
                    </DropdownMenuItem>
                  )}
                  
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
            ) : headerFooterSettings.showMemberSpace ? (
              <Button variant="outline" onClick={() => setIsAuthModalOpen(true)} className="gap-2">
                <User className="h-4 w-4" />
                Espace Perso
              </Button>
            ) : null}
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
                      
                      {headerFooterSettings.memberMenuShowAccount && (
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
                      )}

                      {headerFooterSettings.memberMenuShowDashboard && (
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
                      )}
                      
                      {headerFooterSettings.memberMenuShowEconomies && (
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
                      )}
                      
                      {headerFooterSettings.memberMenuShowForum && (
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
                      )}
                      
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
              {headerFooterSettings.showWhatsapp && (
                <a
                  href={getWhatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-foreground hover:text-primary transition-colors"
                >
                  <img src={whatsappIcon} alt="WhatsApp" className="w-[18px] h-[18px] mr-2" />
                  <span className="font-semibold">WhatsApp</span>
                </a>
              )}
              {headerFooterSettings.showPhone && (
                <a
                  href={`tel:${headerFooterSettings.phoneNumber.replace(/\s/g, '')}`}
                  className="flex items-center text-foreground hover:text-primary transition-colors"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  <span className="font-semibold">{headerFooterSettings.phoneNumber}</span>
                </a>
              )}
              <div className="pt-2 space-y-2">
                <Button asChild className="w-full">
                  <Link to="/#etude" onClick={() => setIsMenuOpen(false)}>
                    Trouver un installateur
                  </Link>
                </Button>
                {!user && headerFooterSettings.showMemberSpace && (
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
      
      {/* Region Sub-Header - Only on homepage and if enabled (wait for settings to load) */}
      {settingsLoaded && isHomePage && headerFooterSettings.showRegionSubHeader && <RegionSubHeader isScrolled={isScrolled} />}
      
      <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
    </header>
  );
};

export default Header;
