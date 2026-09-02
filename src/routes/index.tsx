import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Goal, BarChart3, Target, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GoalScout — Scout de Goleiros de Handebol" },
      {
        name: "description",
        content: "Registre arremessos sofridos, analise heatmaps e gere relatórios completos do seu goleiro.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/app" />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-display text-lg font-bold text-primary">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Goal className="h-5 w-5" />
            </span>
            GoalScout
          </div>
          <Button asChild size="sm">
            <Link to="/auth">Entrar</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
                Handebol · Análise de desempenho
              </span>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-primary sm:text-5xl">
                Transforme cada arremesso em <span className="text-accent">dados</span>.
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                GoalScout é a plataforma de scout para goleiros de handebol. Registre
                arremessos em tempo real, visualize heatmaps, identifique padrões dos
                cobradores e exporte relatórios profissionais.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/auth">Começar agora</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#features">Saiba mais</a>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="grid aspect-[4/3] w-full grid-cols-3 grid-rows-3 gap-2 rounded-2xl border-8 border-primary bg-gradient-to-br from-primary/5 to-accent/10 p-4 shadow-xl">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-md border border-border bg-card/70 backdrop-blur transition hover:bg-accent/20"
                  />
                ))}
              </div>
              <div className="absolute -bottom-4 -right-4 hidden rounded-xl bg-card p-4 shadow-lg ring-1 ring-border sm:block">
                <div className="text-xs text-muted-foreground">Eficiência</div>
                <div className="font-display text-3xl font-bold text-success">67%</div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-border bg-card">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Target, title: "Registro rápido", text: "Mapa do gol em 9 zonas. Toque, escolha o resultado, pronto." },
              { icon: BarChart3, title: "Dashboard ao vivo", text: "Eficiência, gols sofridos e estatísticas por situação." },
              { icon: MapPin, title: "Heatmap", text: "Veja onde os adversários finalizam e onde você defende mais." },
              { icon: Goal, title: "Tiros de 7m", text: "Histórico por cobrador, mão dominante e zona preferida." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl border border-border p-5">
                <Icon className="h-6 w-6 text-accent" />
                <h3 className="mt-3 font-display text-lg font-bold text-primary">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card py-6 text-center text-xs text-muted-foreground">
        GoalScout · Feito para treinadores e goleiros de handebol
      </footer>
    </div>
  );
}
