import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/connexion");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchRoles();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    
    if (data) setProfile(data);
  };

  const fetchRoles = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    
    if (data) setRoles(data.map(r => r.role));
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isSuperAdmin = roles.includes("super_admin");
  const isAdmin = roles.includes("admin");
  const isModerator = roles.includes("moderator");

  return (
    <>
      <Helmet>
        <title>Tableau de bord | Prime Énergies</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Tableau de bord</h1>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profil</CardTitle>
                </CardHeader>
                <CardContent>
                  <p><strong>Email:</strong> {user.email}</p>
                  {profile && (
                    <>
                      <p><strong>Prénom:</strong> {profile.first_name}</p>
                      <p><strong>Nom:</strong> {profile.last_name}</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rôles</CardTitle>
                </CardHeader>
                <CardContent>
                  {roles.length > 0 ? (
                    <ul className="space-y-1">
                      {roles.map((role) => (
                        <li key={role} className="capitalize">
                          {role.replace("_", " ")}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">Aucun rôle assigné</p>
                  )}
                </CardContent>
              </Card>

              {(isSuperAdmin || isAdmin || isModerator) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Administration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Accédez aux fonctionnalités d'administration
                    </p>
                    {/* Add links to admin pages here */}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Dashboard;
