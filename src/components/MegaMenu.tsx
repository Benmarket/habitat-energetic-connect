import { Link } from "react-router-dom";
import { Sun, Droplet, Home, FileText, Calculator, Lightbulb } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

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
        title: "ISOLATION",
        items: [
          { label: "Isolation des combles", href: "/offres/isolation-combles" },
          { label: "Isolation extérieure", href: "/offres/isolation-exterieure" },
          { label: "Planchers bas", href: "/offres/planchers-bas" },
        ],
      },
      {
        icon: Home,
        title: "OUTILS & AIDES",
        items: [
          { label: "Simulateurs", href: "/simulateurs" },
          { label: "Guides", href: "/guides" },
          { label: "Aides/Subventions", href: "/aides" },
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
          { label: "Simulateur aides", href: "/simulateurs/aides" },
        ],
      },
    ],
  },
};

export const MegaMenu = () => {
  return (
    <NavigationMenu className="hidden lg:flex">
      <NavigationMenuList className="space-x-1">
        {/* Offres */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-foreground hover:text-primary data-[state=open]:text-primary">
            Offres
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid grid-cols-3 gap-6 p-6 w-[800px]">
              {megaMenuData.offres.categories.map((category, idx) => (
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

        {/* Guides */}
        <NavigationMenuItem className="hidden xl:flex">
          <NavigationMenuTrigger className="text-foreground hover:text-primary data-[state=open]:text-primary">
            Guides
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid grid-cols-1 gap-6 p-6 w-[300px]">
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

        {/* Aides */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-foreground hover:text-primary data-[state=open]:text-primary">
            Aides
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid grid-cols-1 gap-6 p-6 w-[300px]">
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

        {/* Actualité - simple link */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              to="/actualites"
              className={cn(
                "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-primary focus:bg-accent focus:text-primary focus:outline-none"
              )}
            >
              Actualité
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* Simulateurs */}
        <NavigationMenuItem className="hidden 2xl:flex">
          <NavigationMenuTrigger className="text-foreground hover:text-primary data-[state=open]:text-primary">
            Simulateurs
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid grid-cols-1 gap-6 p-6 w-[300px]">
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

        {/* Qui sommes-nous - simple link */}
        <NavigationMenuItem className="hidden 2xl:flex">
          <NavigationMenuLink asChild>
            <Link
              to="/qui-sommes-nous"
              className={cn(
                "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-primary focus:bg-accent focus:text-primary focus:outline-none"
              )}
            >
              Qui sommes-nous
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};
