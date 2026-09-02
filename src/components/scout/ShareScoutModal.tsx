import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { inviteMemberToScout, getScoutMembers, updateScoutMemberRole, removeScoutMemberAccess, type TeamMemberItem, type TeamRole } from "@/lib/scout/teamSharing";
import { Share2, UserPlus, Shield, Trash2, Send, Info, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameId: string;
  gameTitle: string;
}

export function ShareScoutModal({ open, onOpenChange, gameId, gameTitle }: Props) {
  const [emailInput, setEmailInput] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<TeamRole>("jogador");
  const [members, setMembers] = useState<TeamMemberItem[]>([]);

  const loadMembers = async () => {
    if (!gameId) return;
    const data = await getScoutMembers(gameId);
    setMembers(data);
  };

  useEffect(() => {
    if (open && gameId) {
      loadMembers();
    }
  }, [open, gameId]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      toast.error("Informe o e-mail do convidado!");
      return;
    }

    const updated = await inviteMemberToScout(gameId, emailInput.trim(), selectedRole);
    setMembers(updated);
    setEmailInput("");
    toast.success(`Acesso a este scout isolado enviado para ${emailInput.trim()}!`);
  };

  const handleRoleChange = async (memberId: string, newRole: TeamRole) => {
    const updated = await updateScoutMemberRole(gameId, memberId, newRole);
    setMembers(updated);
    toast.success(`Permissão para este scout alterada com sucesso!`);
  };

  const handleRevoke = async (memberId: string, email: string) => {
    if (confirm(`Deseja revogar o acesso de "${email}" a esta partida isolada?`)) {
      const updated = await removeScoutMemberAccess(gameId, memberId);
      setMembers(updated);
      toast.success(`Acesso revogado!`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-primary">
            <Share2 className="h-6 w-6 text-accent" />
            Compartilhar Apenas este Scout
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Conceda acesso a esta partida específica (<span className="font-bold text-primary">{gameTitle}</span>) sem compartilhar todo o histórico da equipe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          
          {/* FORMULÁRIO DE CONVITE PARA SCOUT ISOLADO */}
          <form onSubmit={handleSendInvite} className="bg-accent/10 p-4 rounded-xl border border-accent/30 space-y-3">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <UserPlus className="h-4 w-4 text-accent" /> Convidar por E-mail para este Scout
            </span>

            <div className="grid gap-3 sm:grid-cols-3 items-end">
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-[11px] font-bold text-muted-foreground">E-mail do Convidado</Label>
                <Input
                  type="email"
                  placeholder="ex: atleta@teste.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-muted-foreground">Permissão</Label>
                <select
                  className="w-full h-9 text-xs font-bold bg-background border border-input rounded-md px-2 py-1"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as TeamRole)}
                >
                  <option value="jogador">🏃‍♂️ Jogador</option>
                  <option value="tecnico">👨‍🏫 Técnico</option>
                </select>
              </div>
            </div>

            <Button type="submit" size="sm" className="w-full font-bold bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
              <Send className="h-3.5 w-3.5" /> Conceder Acesso ao Scout
            </Button>
          </form>

          {/* LISTA DE CONVIDADOS DESTE SCOUT */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-emerald-600" /> Pessoas com acesso a este Scout ({members.length})
            </span>

            <div className="border rounded-lg overflow-hidden max-h-[180px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-[11px]">E-mail</TableHead>
                    <TableHead className="text-[11px]">Permissão</TableHead>
                    <TableHead className="text-right text-[11px]">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-xs text-muted-foreground">
                        Nenhum convidado específico para este scout ainda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-mono text-xs font-bold text-primary">
                          {m.email}
                        </TableCell>
                        <TableCell>
                          <select
                            className="h-7 text-xs font-bold border rounded-md px-2 py-0.5"
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.id, e.target.value as TeamRole)}
                          >
                            <option value="jogador">🏃‍♂️ Jogador</option>
                            <option value="tecnico">👨‍🏫 Técnico</option>
                          </select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="xs"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRevoke(m.id, m.email)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

        </div>

        <DialogFooter className="pt-2 border-t">
          <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
            Concluído
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
