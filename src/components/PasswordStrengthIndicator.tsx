import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const passwordRules = [
  { label: "Au moins 8 caractères", test: (p: string) => p.length >= 8 },
  { label: "Au moins une majuscule", test: (p: string) => /[A-Z]/.test(p) },
];

export const isPasswordValid = (password: string) =>
  passwordRules.every((r) => r.test(password));

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  if (!password) return null;
  return (
    <ul className="mt-2 space-y-1 text-xs">
      {passwordRules.map((rule) => {
        const ok = rule.test(password);
        return (
          <li
            key={rule.label}
            className={`flex items-center gap-1.5 ${
              ok ? "text-green-600" : "text-muted-foreground"
            }`}
          >
            {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
};
