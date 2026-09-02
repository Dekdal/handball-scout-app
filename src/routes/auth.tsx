import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Goal, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — GoalScout" },
      { name: "description", content: "Acesse sua conta GoalScout para começar o scout do seu goleiro." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

function AuthPage() {
  const router = useRouter();
  const { loginOffline } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleEnterOfflineMode = () => {
    loginOffline();
    toast.success("Bem-vindo ao Modo Offline! Acesso liberado.");
    router.navigate({ to: "/app" });
  };

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      setLoading(false);
      if (error) {
        if (error.message.includes("fetch") || error.message.includes("Failed")) {
          // Entra automaticamente no Modo Offline sem bloquear o usuário!
          loginOffline();
          toast.success("Servidor em nuvem pausado. Acessando no Modo Offline com sucesso!");
          router.navigate({ to: "/app" });
          return;
        }
        return toast.error(error.message);
      }
      localStorage.removeItem("handball_scout_offline_user");
      router.navigate({ to: "/app" });
    } catch (err: any) {
      setLoading(false);
      loginOffline();
      toast.success("Acessando no Modo Offline...");
      router.navigate({ to: "/app" });
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: name.trim() || undefined },
        },
      });
      setLoading(false);
      if (error) {
        if (error.message.includes("fetch") || error.message.includes("Failed")) {
          loginOffline();
          toast.success("Modo Offline ativado! Acesso liberado.");
          router.navigate({ to: "/app" });
          return;
        }
        return toast.error(error.message);
      }
      toast.success("Conta criada! Você já pode entrar.");
    } catch (err: any) {
      setLoading(false);
      loginOffline();
      toast.success("Modo Offline ativado!");
      router.navigate({ to: "/app" });
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-primary">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Goal className="h-5 w-5" />
            </span>
            GoalScout
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-primary">Acesse sua conta</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Entre ou crie sua conta para começar o scout e prancheta tática.
            </p>
          </div>

          {/* BOTÃO EM DESTAQUE DE MODO OFFLINE / APROVEITAMENTO DIRETO */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              <Sparkles className="h-4 w-4 text-amber-500" /> Acesso Rápido Local
            </div>
            <p className="text-xs text-muted-foreground">
              Ideal para uso sem internet ou quando o banco de dados em nuvem estiver indisponível.
            </p>
            <Button
              type="button"
              variant="default"
              size="sm"
              className="w-full font-bold bg-amber-500 hover:bg-amber-600 text-amber-950 shadow-md gap-2"
              onClick={handleEnterOfflineMode}
            >
              🚀 Entrar sem Login (Modo Offline / Treinador Demo)
            </Button>
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-3 pt-3">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Conectando..." : "Entrar com Supabase"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-3 pt-3">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Treinador / Goleiro" />
                </div>
                <div>
                  <Label htmlFor="email2">E-mail</Label>
                  <Input id="email2" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="password2">Senha</Label>
                  <Input id="password2" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Criando..." : "Criar conta no Supabase"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
