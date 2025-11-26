import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb = ({ items }: BreadcrumbProps) => {
  return (
    <nav aria-label="Fil d'Ariane" className="bg-muted/30 py-3 px-4">
        <div className="container mx-auto">
          <ol className="flex items-center gap-2 text-sm flex-wrap">
            {items.map((item, index) => (
              <li key={index} className="flex items-center gap-2">
                {index === 0 ? (
                  <>
                    <Link
                      to={item.url}
                      className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      <Home className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                    {items.length > 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </>
                ) : index < items.length - 1 ? (
                  <>
                    <Link
                      to={item.url}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </>
                ) : (
                  <span className="text-foreground font-medium">{item.name}</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </nav>
  );
};
