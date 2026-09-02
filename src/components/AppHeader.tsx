import { Link, useRouter } from "@tanstack/react-router";
import { Goal, LogOut, Shield, User, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function AppHeader({ user: propUser }: { user?: { email?: string | null } | null }) {
  const router = useRouter();
  const { user, isTecnico, setSimulatedRole } = useAuth();

  const displayUser = user || propUser;

  return (
    <header className="border-b border-border bg-card shadow-2xs">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-primary">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Goal className="h-5 w-5" />
          </span>
          GoalScout
        </Link>
        {displayUser ? (
          <div className="flex items-center gap-3">
            
            {/* SELETOR DE PERFIL DE TESTE / BADGE RBAC */}
            <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg border">
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-md font-extrabold flex items-center gap-1",
                isTecnico
                  ? "bg-purple-600 text-white"
                  : "bg-emerald-600 text-white"
              )}>
                {isTecnico ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                {isTecnico ? "👨‍🏫 Técnico" : "🏃‍♂️ Jogador"}
              </span>

              <Button
                size="xs"
                variant="ghost"
                className="h-6 text-[10px] font-bold text-muted-foreground hover:text-foreground"
                title="Alternar entre perfil Técnico (Edição) e Jogador (Somente Leitura)"
                onClick={() => {
                  if (isTecnico) {
                    setSimulatedRole("jogador");
                  } else {
                    setSimulatedRole("tecnico");
                  }
                }}
              >
                <RefreshCw className="h-2.5 w-2.5 mr-1" /> Simular {isTecnico ? "Jogador" : "Técnico"}
              </Button>
            </div>

            <span className="hidden text-xs text-muted-foreground sm:inline font-medium">{displayUser.email}</span>

            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                router.navigate({ to: "/auth" });
              }}
            >
              <LogOut className="mr-1.5 h-4 w-4" /> Sair
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
