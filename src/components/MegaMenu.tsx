import { Link } from "react-router-dom";
import { Sun, Droplet, Home, FileText, Calculator, Lightbulb, Newspaper, Users2 } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const megaMenuData = {
  offres: {
    title: "Offres",
    categories: [
      {
        icon: Sun,
        title: "PHOTOVOLTAÏQUE",
        items: [
          { label: "Panneaux solaires", href: "/offres/panneaux-solaires" },
          { label: "Batterie de stockage", href: "/offres/batterie" },
          { label: "Borne de recharge", href: "/offres/borne-recharge" },
        ],
      },
      {
        icon: Droplet,
        title: "CHAUFFAGE",
        items: [
          { label: "Pompe à chaleur air/eau", href: "/offres/pac-air-eau" },
          { label: "Pompe à chaleur air/air", href: "/offres/pac-air-air" },
          { label: "Chauffe-eau thermodynamique", href: "/offres/chauffe-eau" },
        ],
      },
      {
        icon: Home,
        title: "ISOLATION",
        items: [
          { label: "Isolation des combles", href: "/offres/isolation-combles" },
          { label: "Isolation extérieure", href: "/offres/isolation-exterieure" },
          { label: "Planchers bas", href: "/offres/planchers-bas" },
        ],
      },
    ],
  },
  guides: {
    title: "Guides",
    categories: [
      {
        icon: FileText,
        title: "GUIDES PRATIQUES",
        items: [
          { label: "Guide énergie solaire", href: "/guides/energie-solaire" },
          { label: "Guide isolation", href: "/guides/isolation" },
          { label: "Guide pompe à chaleur", href: "/guides/pompe-chaleur" },
          { label: "Guide aides financières", href: "/guides/aides" },
        ],
      },
    ],
  },
  aides: {
    title: "Aides",
    categories: [
      {
        icon: Lightbulb,
        title: "AIDES & SUBVENTIONS",
        items: [
          { label: "MaPrimeRénov'", href: "/aides/maprimorenov" },
          { label: "CEE", href: "/aides/cee" },
          { label: "Éco-PTZ", href: "/aides/eco-ptz" },
          { label: "TVA réduite", href: "/aides/tva-reduite" },
        ],
      },
    ],
  },
  actualite: {
    title: "Actualité",
    categories: [
      {
        icon: Newspaper,
        title: "ACTUALITÉS",
        items: [
          { label: "Toutes les actualités", href: "/actualites" },
          { label: "Réglementation", href: "/actualites?filter=reglementation" },
          { label: "Innovations", href: "/actualites?filter=innovations" },
          { label: "Conseils", href: "/actualites?filter=conseils" },
        ],
      },
    ],
  },
  simulateurs: {
    title: "Simulateurs",
    categories: [
      {
        icon: Calculator,
        title: "SIMULATEURS",
        items: [
          { label: "Simulateur solaire", href: "/simulateurs/solaire" },
          { label: "Simulateur isolation", href: "/simulateurs/isolation" },
          { label: "Simulateur pompe à chaleur", href: "/simulateurs/pac" },
          { label: "Simulateur aides", href: "/simulateurs/aides" },
        ],
      },
    ],
  },
  quiSommesNous: {
    title: "Qui sommes-nous?",
    categories: [
      {
        icon: Users2,
        title: "À PROPOS",
        items: [
          { label: "Notre mission", href: "/qui-sommes-nous/mission" },
          { label: "Notre réseau", href: "/qui-sommes-nous/reseau" },
          { label: "Nos engagements", href: "/qui-sommes-nous/engagements" },
          { label: "Contact", href: "/qui-sommes-nous/contact" },
        ],
      },
    ],
  },
};

export const MegaMenu = () => {
  return (
    <NavigationMenu>
      <NavigationMenuList className="space-x-1">
        {/* Offres - Always visible */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>Offres</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-[700px] p-6 bg-background">
              <div className="grid grid-cols-3 gap-6">
                {megaMenuData.offres.categories.map((category, idx) => (
                  <div key={idx}>
                    <div className="flex items-center gap-2 mb-3">
                      <category.icon className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-sm text-foreground uppercase tracking-wide">{category.title}</h3>
                    </div>
                    <ul className="space-y-2">
                      {category.items.map((item) => (
                        <li key={item.href}>
                          <Link
                            to={item.href}
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Guides - Hidden below xl */}
        <NavigationMenuItem className="hidden xl:flex">
          <NavigationMenuTrigger>Guides</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid grid-cols-1 gap-6 p-6 w-[300px] bg-background">
              {megaMenuData.guides.categories.map((category, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-2 mb-3">
                    <category.icon className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-sm text-foreground uppercase tracking-wide">
                      {category.title}
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {category.items.map((item, itemIdx) => (
                      <li key={itemIdx}>
                        <NavigationMenuLink asChild>
                          <Link
                            to={item.href}
                            className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            {item.label}
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Aides - Hidden below xl */}
        <NavigationMenuItem className="hidden xl:flex">
          <NavigationMenuTrigger>Aides</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid grid-cols-1 gap-6 p-6 w-[300px] bg-background">
              {megaMenuData.aides.categories.map((category, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-2 mb-3">
                    <category.icon className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-sm text-foreground uppercase tracking-wide">
                      {category.title}
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {category.items.map((item, itemIdx) => (
                      <li key={itemIdx}>
                        <NavigationMenuLink asChild>
                          <Link
                            to={item.href}
                            className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            {item.label}
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Actualité - Always visible */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-foreground hover:text-primary data-[state=open]:text-primary">
            Actualité
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid grid-cols-1 gap-6 p-6 w-[300px] bg-background">
              {megaMenuData.actualite.categories.map((category, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-2 mb-3">
                    <category.icon className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-sm text-foreground uppercase tracking-wide">
                      {category.title}
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {category.items.map((item, itemIdx) => (
                      <li key={itemIdx}>
                        <NavigationMenuLink asChild>
                          <Link
                            to={item.href}
                            className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            {item.label}
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Simulateurs - Hidden below 2xl */}
        <NavigationMenuItem className="hidden 2xl:flex">
          <NavigationMenuTrigger className="text-foreground hover:text-primary data-[state=open]:text-primary">
            Simulateurs
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid grid-cols-1 gap-6 p-6 w-[300px] bg-background">
              {megaMenuData.simulateurs.categories.map((category, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-2 mb-3">
                    <category.icon className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-sm text-foreground uppercase tracking-wide">
                      {category.title}
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {category.items.map((item, itemIdx) => (
                      <li key={itemIdx}>
                        <NavigationMenuLink asChild>
                          <Link
                            to={item.href}
                            className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            {item.label}
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Qui sommes-nous - Hidden below 2xl */}
        <NavigationMenuItem className="hidden 2xl:flex">
          <NavigationMenuTrigger className="text-foreground hover:text-primary data-[state=open]:text-primary">
            Qui sommes-nous?
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid grid-cols-1 gap-6 p-6 w-[300px] bg-background">
              {megaMenuData.quiSommesNous.categories.map((category, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-2 mb-3">
                    <category.icon className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-sm text-foreground uppercase tracking-wide">
                      {category.title}
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {category.items.map((item, itemIdx) => (
                      <li key={itemIdx}>
                        <NavigationMenuLink asChild>
                          <Link
                            to={item.href}
                            className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            {item.label}
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};
