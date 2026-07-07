import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { ListTree, Home, FileText, BookOpen, HelpCircle, Calculator, Sparkles, Wrench, MessageSquare, Building2, Shield, UserCircle, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

interface SitemapLink {
  label: string;
  href: string;
}

interface SitemapSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  links: SitemapLink[];
}

interface PostItem {
  slug: string;
  content_type: "actualite" | "guide" | "aide";
  post_categories?: { categories?: { slug: string } }[];
}

interface LandingPageItem {
  path: string;
  slug: string;
}

interface ForumCategoryItem {
  slug: string;
}

const staticSections: SitemapSection[] = [
  {
    title: "Pages principales",
    icon: Home,
    links: [
      { label: "Accueil", href: "/" },
      { label: "Actualités", href: "/actualites" },
      { label: "Guides", href: "/guides" },
      { label: "Aides", href: "/aides" },
      { label: "FAQ", href: "/faq" },
      { label: "Forum", href: "/forum" },
    ],
  },
  {
    title: "Services",
    icon: Wrench,
    links: [
      { label: "Installation solaire", href: "/services/installation-solaire" },
      { label: "Pompes à chaleur", href: "/services/pompes-a-chaleur" },
      { label: "Stockage d'énergie", href: "/services/stockage-energie" },
      { label: "Audit énergétique", href: "/services/audit-energetique" },
      { label: "Amélioration de l'habitat", href: "/services/amelioration-habitat" },
    ],
  },
  {
    title: "Simulateurs",
    icon: Calculator,
    links: [
      { label: "Simulateur solaire", href: "/simulateurs/solaire" },
    ],
  },
  {
    title: "Espace membre",
    icon: UserCircle,
    links: [
      { label: "Connexion / Inscription", href: "/connexion" },
      { label: "Tableau de bord", href: "/tableau-de-bord" },
      { label: "Mon profil", href: "/profil" },
      { label: "Laisser un avis", href: "/laisser-un-avis" },
    ],
  },
  {
    title: "Informations légales",
    icon: Shield,
    links: [
      { label: "Mentions légales", href: "/mentions-legales" },
      { label: "Politique de confidentialité", href: "/politique-confidentialite" },
      { label: "Conditions d'utilisation", href: "/conditions-utilisation" },
      { label: "Plan du site", href: "/plan-du-site" },
    ],
  },
];

const PlanDuSite = () => {
  const [actualites, setActualites] = useState<SitemapLink[]>([]);
  const [guides, setGuides] = useState<SitemapLink[]>([]);
  const [aides, setAides] = useState<SitemapLink[]>([]);
  const [landings, setLandings] = useState<SitemapLink[]>([]);
  const [forumCategories, setForumCategories] = useState<SitemapLink[]>([]);
  const [offres, setOffres] = useState<SitemapLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDynamicContent = async () => {
      try {
        // Fetch published posts
        const { data: posts, error: postsError } = await supabase
          .from("posts")
          .select("slug, content_type, post_categories(categories(slug))")
          .eq("status", "published")
          .order("updated_at", { ascending: false });

        if (!postsError && posts) {
          const typedPosts = posts as unknown as PostItem[];
          setActualites(
            typedPosts
              .filter((p) => p.content_type === "actualite")
              .map((p) => {
                const categorySlug = p.post_categories?.[0]?.categories?.slug || "non-classe";
                return {
                  label: p.slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                  href: `/actualites/${categorySlug}/${p.slug}`,
                };
              })
          );
          setGuides(
            typedPosts
              .filter((p) => p.content_type === "guide")
              .map((p) => ({
                label: p.slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                href: `/guide/${p.slug}`,
              }))
          );
          setAides(
            typedPosts
              .filter((p) => p.content_type === "aide")
              .map((p) => ({
                label: p.slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                href: `/aide/${p.slug}`,
              }))
          );
        }

        // Fetch landing pages with SEO status
        const { data: landingPages, error: lpError } = await supabase
          .from("landing_pages")
          .select("path, slug")
          .eq("seo_status", "seo");

        if (!lpError && landingPages) {
          setLandings(
            (landingPages as LandingPageItem[]).map((lp) => ({
              label: lp.slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
              href: lp.path,
            }))
          );
        }

        // Fetch forum categories
        const { data: categories, error: fcError } = await supabase
          .from("forum_categories")
          .select("slug");

        if (!fcError && categories) {
          setForumCategories(
            (categories as ForumCategoryItem[]).map((c) => ({
              label: c.slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
              href: `/forum/categorie/${c.slug}`,
            }))
          );
        }

        // Fetch partner offers (advertisers)
        const { data: advertisers, error: advError } = await (supabase as any)
          .from("advertisers")
          .select("slug, id")
          .eq("status", "active");

        if (!advError && advertisers) {
          setOffres(
            advertisers.map((a: any) => ({
              label: a.slug?.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) || `Offre ${a.id}`,
              href: `/offre-partenaire/${a.slug}/${a.id}`,
            }))
          );
        }
      } catch (error) {
        console.error("Erreur lors du chargement du plan du site:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDynamicContent();
  }, []);

  const dynamicSections: SitemapSection[] = [
    ...(actualites.length > 0
      ? [
          {
            title: "Actualités",
            icon: FileText,
            links: actualites,
          },
        ]
      : []),
    ...(guides.length > 0
      ? [
          {
            title: "Guides",
            icon: BookOpen,
            links: guides,
          },
        ]
      : []),
    ...(aides.length > 0
      ? [
          {
            title: "Aides financières",
            icon: HelpCircle,
            links: aides,
          },
        ]
      : []),
    ...(landings.length > 0
      ? [
          {
            title: "Pages d'atterrissage",
            icon: Sparkles,
            links: landings,
          },
        ]
      : []),
    ...(offres.length > 0
      ? [
          {
            title: "Offres partenaires",
            icon: Building2,
            links: offres,
          },
        ]
      : []),
    ...(forumCategories.length > 0
      ? [
          {
            title: "Catégories du forum",
            icon: MessageSquare,
            links: forumCategories,
          },
        ]
      : []),
  ];

  const allSections = [...staticSections, ...dynamicSections];

  return (
    <>
      <Helmet>
        <title>Plan du site | Prime Énergies</title>
        <meta name="description" content="Plan du site de Prime Énergies : accédez rapidement à l'ensemble de nos pages et contenus." />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <Header />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          {/* Back to home link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-8 font-medium"
          >
            <Home className="w-4 h-4" />
            Retour à l'accueil
          </Link>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <SitemapIcon className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">Plan du site</h1>
            <p className="text-muted-foreground">
              Retrouvez ci-dessous l'ensemble des pages accessibles sur Prime Énergies.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chargement du plan du site...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {allSections.map((section, idx) => {
                const Icon = section.icon;
                return (
                  <section key={idx} className="bg-card p-6 rounded-lg border">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold">{section.title}</h2>
                    </div>
                    <ul className="space-y-2">
                      {section.links.map((link, linkIdx) => (
                        <li key={linkIdx} className="flex items-start gap-2">
                          <LinkIcon className="w-4 h-4 text-primary mt-1 shrink-0" />
                          <Link
                            to={link.href}
                            className="text-foreground hover:text-primary transition-colors break-words"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default PlanDuSite;
