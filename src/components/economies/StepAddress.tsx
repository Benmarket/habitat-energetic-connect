import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  address: string | null;
  postalCode: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  onSave: (patch: { address: string; postal_code: string; city: string; latitude: number; longitude: number }) => Promise<void>;
  onNext: () => void;
  onBack: () => void;
}

const StepAddress = ({ address, postalCode, city, latitude, longitude, onSave, onNext, onBack }: Props) => {
  const [q, setQ] = useState(address ? `${address} ${postalCode || ""} ${city || ""}`.trim() : "");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(!!latitude && !!longitude);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    latitude && longitude ? { lat: latitude, lon: longitude } : null
  );
  const [chosen, setChosen] = useState<{ address: string; postal_code: string; city: string } | null>(
    address && postalCode && city ? { address, postal_code: postalCode, city } : null
  );

  useEffect(() => {
    if (q.length < 4 || validated) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5`);
        const data = await r.json();
        setSuggestions(data.features || []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q, validated]);

  const pick = (f: any) => {
    const p = f.properties;
    const c = f.geometry.coordinates;
    setChosen({ address: p.name, postal_code: p.postcode, city: p.city });
    setCoords({ lat: c[1], lon: c[0] });
    setQ(`${p.name}, ${p.postcode} ${p.city}`);
    setSuggestions([]);
    setValidated(true);
  };

  const handleSave = async () => {
    if (!chosen || !coords) {
      toast.error("Sélectionnez une adresse dans la liste");
      return;
    }
    await onSave({
      address: chosen.address,
      postal_code: chosen.postal_code,
      city: chosen.city,
      latitude: coords.lat,
      longitude: coords.lon,
    });
    onNext();
  };

  const mapUrl =
    coords &&
    `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lon - 0.005}%2C${coords.lat - 0.003}%2C${coords.lon + 0.005}%2C${coords.lat + 0.003}&layer=mapnik&marker=${coords.lat}%2C${coords.lon}`;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Où se situe votre logement ?</h2>
        <p className="text-sm text-muted-foreground">
          Utilisé uniquement pour situer votre logement et personnaliser vos calculs (zone climatique, ensoleillement…).
        </p>
      </div>

      <div className="relative">
        <Label htmlFor="addr" className="font-semibold">Adresse complète</Label>
        <div className="relative mt-2">
          <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="addr"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setValidated(false);
            }}
            placeholder="Commencez à taper votre adresse…"
            className="pl-10"
          />
          {loading && <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />}
        </div>
        {suggestions.length > 0 && (
          <Card className="absolute z-10 w-full mt-1 max-h-64 overflow-y-auto">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => pick(s)}
                className="w-full text-left px-4 py-2 hover:bg-muted transition-colors text-sm border-b last:border-b-0"
              >
                <div className="font-medium">{s.properties.label}</div>
              </button>
            ))}
          </Card>
        )}
      </div>

      {validated && coords && (
        <Card className="overflow-hidden">
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center gap-2 text-emerald-700 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" /> Adresse localisée
          </div>
          <iframe
            title="Carte"
            src={mapUrl!}
            className="w-full h-64 border-0"
            loading="lazy"
          />
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>Retour</Button>
        <Button size="lg" disabled={!validated} onClick={handleSave} className="hover:scale-105 transition-transform">
          Continuer
        </Button>
      </div>
    </div>
  );
};

export default StepAddress;
