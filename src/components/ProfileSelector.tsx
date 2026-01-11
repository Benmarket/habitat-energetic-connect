import { useState } from "react";
import { ChevronUp, Building2, Wrench, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProfileOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

const profileOptions: ProfileOption[] = [
  {
    id: "particuliers",
    label: "PARTICULIERS",
    description: "Offres pour les foyers",
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: "professionnels",
    label: "PROFESSIONNELS",
    description: "Solutions pour entreprises & collectivités",
    icon: <Building2 className="w-4 h-4" />,
    disabled: true,
  },
  {
    id: "assistance",
    label: "ASSISTANCE",
    description: "Dépannage & maintenance résidentielle",
    icon: <Wrench className="w-4 h-4" />,
    disabled: true,
  },
  {
    id: "partenaires",
    label: "PARTENAIRES",
    description: "Rejoindre le réseau d'affiliés",
    icon: <Users className="w-4 h-4" />,
    disabled: true,
  },
];

interface ProfileSelectorProps {
  className?: string;
}

export default function ProfileSelector({ className }: ProfileSelectorProps) {
  const [selectedProfile, setSelectedProfile] = useState("particuliers");
  const [isOpen, setIsOpen] = useState(false);

  const currentProfile = profileOptions.find((p) => p.id === selectedProfile);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all duration-200 ${className}`}
        >
          <span className="text-[13px] font-semibold text-slate-700 tracking-wide uppercase">
            {currentProfile?.label}
          </span>
          <ChevronUp
            className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
              isOpen ? "" : "rotate-180"
            }`}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-72 p-2 bg-white border border-slate-200 shadow-xl rounded-xl z-[100]"
      >
        {profileOptions
          .filter((option) => option.id !== selectedProfile)
          .map((option) => (
            <DropdownMenuItem
              key={option.id}
              disabled={option.disabled}
              onClick={() => {
                if (!option.disabled) {
                  setSelectedProfile(option.id);
                }
              }}
              className={`flex flex-col items-start gap-0.5 p-4 rounded-lg cursor-pointer ${
                option.disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2">
                {option.icon}
                <span className="font-bold text-slate-800 uppercase tracking-wide text-sm">
                  {option.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 ml-6">{option.description}</p>
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
