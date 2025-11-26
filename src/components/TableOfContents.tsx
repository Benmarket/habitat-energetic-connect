import { List } from "lucide-react";
import { Card } from "./ui/card";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  items: TOCItem[];
}

export const TableOfContents = ({ items }: TableOfContentsProps) => {
  if (items.length === 0) return null;

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <Card className="p-6 mb-8 bg-muted/30">
      <div className="flex items-center gap-2 mb-4">
        <List className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Sommaire</h2>
      </div>
      <nav>
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={index}
              className={item.level === 3 ? "ml-4" : ""}
            >
              <button
                onClick={() => scrollToHeading(item.id)}
                className="text-left text-sm text-muted-foreground hover:text-primary transition-colors hover:underline"
              >
                {item.text}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </Card>
  );
};
