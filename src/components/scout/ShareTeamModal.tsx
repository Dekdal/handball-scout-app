import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { inviteMemberToTeam, getTeamMembers, updateMemberRole, removeMemberAccess, type TeamMemberItem, type TeamRole } from "@/lib/scout/teamSharing";
import { Users, UserPlus, Shield, Trash2, Send, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableTeams: string[];
  initialTeam?: string;
}

export function ShareTeamModal({ open, onOpenChange, availableTeams, initialTeam }: Props) {
  const [selectedTeam, setSelectedTeam] = useState<string>(initialTeam || availableTeams[0] || "UFAL");
  const [emailInput, setEmailInput] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<TeamRole>("jogador");
  const [members, setMembers] = useState<TeamMemberItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (initialTeam) {
      setSelectedTeam(initialTeam);
    } else if (availableTeams.length > 0 && !selectedTeam) {
      setSelectedTeam(availableTeams[0]);
    }
  }, [initialTeam, availableTeams]);

  const loadMembers = async (team: string) => {
    if (!team) return;
    setIsLoading(true);
    const data = await getTeamMembers(team);
    setMembers(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (open && selectedTeam) {
      loadMembers(selectedTeam);
    }
  }, [open, selectedTeam]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      toast.error("Informe o e-mail do convidado!");
      return;
    }
    if (!selectedTeam) {
      toast.error("Selecione a equipe que deseja compartilhar!");
      return;
    }

    const updated = await inviteMemberToTeam(selectedTeam, emailInput.trim(), selectedRole);
    setMembers(updated);
    setEmailInput("");
    toast.success(`Convite de ${selectedRole === "tecnico" ? "Técnico" : "Jogador"} da equipe "${selectedTeam}" enviado para ${emailInput.trim()}!`);
  };

  const handleRoleChange = async (memberId: string, newRole: TeamRole) => {
    const updated = await updateMemberRole(selectedTeam, memberId, newRole);
    setMembers(updated);
    toast.success(`Permissão alterada para "${newRole === "tecnico" ? "Técnico (Edição)" : "Jogador (Leitura)"}" com sucesso!`);
  };

  const handleRevoke = async (memberId: string, email: string) => {
    if (confirm(`Deseja revogar o acesso de "${email}" à equipe "${selectedTeam}"?`)) {
      const updated = await removeMemberAccess(selectedTeam, memberId);
      setMembers(updated);
      toast.success(`Acesso de ${email} revogado!`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-primary">
            <Users className="h-6 w-6 text-purple-600" />
            Compartilhar Equipes & Acessos
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Selecione qual equipe da sua liga deseja compartilhar com comissão técnica ou atletas por e-mail.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          
          {/* SELETOR DE QUAL TIME COMPARTILHAR */}
          <div className="bg-purple-100/60 dark:bg-purple-950/40 p-3 rounded-xl border border-purple-300 dark:border-purple-800 space-y-1.5">
            <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">
              1. Selecione a Equipe a Compartilhar:
            </Label>
            <select
              className="w-full h-9 text-xs font-bold bg-background border border-input rounded-md px-3 py-1 text-primary focus:ring-2 focus:ring-purple-600"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
            >
              {availableTeams.map((t) => (
                <option key={t} value={t}>🛡️ Equipe: {t}</option>
              ))}
            </select>
          </div>

          {/* FORMULÁRIO DE ENVIO DE CONVITE */}
          <form onSubmit={handleSendInvite} className="bg-muted/40 p-4 rounded-xl border space-y-3">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <UserPlus className="h-4 w-4 text-purple-600" /> Convidar Membro para a Equipe "{selectedTeam}"
            </span>

            <div className="grid gap-3 sm:grid-cols-3 items-end">
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-[11px] font-bold text-muted-foreground">E-mail do Convidado</Label>
                <Input
                  type="email"
                  placeholder="ex: atleta@teste.com ou auxiliar@teste.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-muted-foreground">Permissão Inicial</Label>
                <select
                  className="w-full h-9 text-xs font-bold bg-background border border-input rounded-md px-2 py-1 focus:ring-1 focus:ring-purple-600"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as TeamRole)}
                >
                  <option value="jogador">🏃‍♂️ Jogador (Leitura)</option>
                  <option value="tecnico">👨‍🏫 Técnico (Edição)</option>
                </select>
              </div>
            </div>

            <Button type="submit" size="sm" className="w-full font-bold bg-purple-600 hover:bg-purple-700 text-white gap-2">
              <Send className="h-3.5 w-3.5" /> Enviar Convite de Acesso
            </Button>
          </form>

          {/* LISTA DE MEMBROS DA EQUIPE SELECIONADA */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-primary flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-emerald-600" /> Membros de "{selectedTeam}" ({members.length})
              </span>
              
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3 text-purple-600" /> Alterar papel a qualquer momento.
              </span>
            </div>

            <div className="border rounded-lg overflow-hidden max-h-[220px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-[11px]">E-mail do Membro</TableHead>
                    <TableHead className="text-[11px]">Permissão (Editável)</TableHead>
                    <TableHead className="text-right text-[11px]">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-xs text-muted-foreground">
                        Nenhum membro convidado para a equipe "{selectedTeam}" ainda.
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
                            className={cn(
                              "h-7 text-xs font-bold border rounded-md px-2 py-0.5 shadow-2xs transition-all",
                              m.role === "tecnico"
                                ? "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-200"
                                : "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200"
                            )}
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.id, e.target.value as TeamRole)}
                          >
                            <option value="jogador">🏃‍♂️ Jogador (Leitura)</option>
                            <option value="tecnico">👨‍🏫 Técnico (Edição)</option>
                          </select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="xs"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRevoke(m.id, m.email)}
                            title="Revogar Acesso"
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
          <Button size="sm" variant="outline" onClick={() => onOpenChange(false)} className="font-bold">
            Concluído
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
