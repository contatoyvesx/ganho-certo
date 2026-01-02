import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Phone, User, Search, Loader2, Pencil, Trash2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];

const clientSchema = z.object({
  name: z.string().min(2, "Informe o nome do cliente"),
  phone: z.string().min(8, "Informe o telefone"),
  service_type: z.string().min(2, "Informe o serviço"),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

const Clients = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      phone: "",
      service_type: "",
      notes: "",
    },
  });

const {
  data: clients = [],
  isLoading,
  isError,
} = useQuery({
  queryKey: ["clients", user?.id],
  enabled: !!user,
  queryFn: async () => {
    if (!user) return [];

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Clients query error:", error);
      throw error;
    }

    return data ?? [];
  },
  staleTime: 30_000,
});


  const resetForm = () => {
    form.reset({ name: "", phone: "", service_type: "", notes: "" });
    setEditingClient(null);
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["clients", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["quotes", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["payments", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["dashboard", user?.id] });
  };

  const createClient = useMutation({
    mutationFn: async (values: ClientFormValues) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { data, error } = await supabase
        .from("clients")
        .insert({
          user_id: user.id,
          name: values.name,
          phone: values.phone,
          service_type: values.service_type,
          notes: values.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateAll();
      toast({
        title: "Cliente cadastrado!",
        description: "Novo cliente adicionado à sua lista.",
      });
      resetForm();
      setOpen(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível cadastrar o cliente.",
      });
    },
  });

  const updateClient = useMutation({
    mutationFn: async (payload: { id: string; values: ClientFormValues }) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await supabase
        .from("clients")
        .update({
          name: payload.values.name,
          phone: payload.values.phone,
          service_type: payload.values.service_type,
          notes: payload.values.notes || null,
        })
        .eq("id", payload.id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast({
        title: "Cliente atualizado!",
      });
      resetForm();
      setOpen(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o cliente.",
      });
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast({
        title: "Cliente removido",
      });
      setClientToDelete(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover o cliente. Verifique pendências.",
      });
    },
  });

  const onSubmit = (values: ClientFormValues) => {
    if (editingClient) {
      updateClient.mutate({ id: editingClient.id, values });
    } else {
      createClient.mutate(values);
    }
  };

  const filteredClients = useMemo(
    () =>
      (clients || []).filter(
        (client) =>
          client.name.toLowerCase().includes(search.toLowerCase()) ||
          client.service_type.toLowerCase().includes(search.toLowerCase())
      ),
    [clients, search]
  );

  const openForCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openForEdit = (client: Client) => {
    setEditingClient(client);
    form.reset({
      name: client.name,
      phone: client.phone,
      service_type: client.service_type,
      notes: client.notes || "",
    });
    setOpen(true);
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Clientes</h1>
            <p className="text-muted-foreground">{clients?.length || 0} clientes cadastrados</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openForCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Novo cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle>{editingClient ? "Editar cliente" : "Novo cliente"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" placeholder="Nome do cliente" {...form.register("name")} />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" placeholder="(00) 00000-0000" {...form.register("phone")} />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service_type">Tipo de serviço</Label>
                  <Input
                    id="service_type"
                    placeholder="Ex: Ar-condicionado, Elétrica..."
                    {...form.register("service_type")}
                  />
                  {form.formState.errors.service_type && (
                    <p className="text-sm text-destructive">{form.formState.errors.service_type.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observação (opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Alguma informação adicional..."
                    {...form.register("notes")}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createClient.isPending || updateClient.isPending}
                >
                  {createClient.isPending || updateClient.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : editingClient ? (
                    "Salvar alterações"
                  ) : (
                    "Cadastrar cliente"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Clients List */}
       {isLoading && !isError ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClients.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border/80 rounded-2xl shadow-soft">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {clients && clients.length === 0 ? "Nenhum cliente cadastrado ainda" : "Nenhum cliente encontrado"}
                </p>
              </div>
            ) : (
              filteredClients.map((client, index) => (
                <div
                  key={client.id}
                  className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between animate-slide-up shadow-soft transition-transform hover:-translate-y-0.5 hover:shadow-soft-lg"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold text-lg">
                        {client.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{client.name}</p>
                      <p className="text-sm text-muted-foreground">{client.service_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={`tel:${client.phone}`}
                      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      <span className="hidden sm:inline">{client.phone}</span>
                    </a>
                    <Button variant="outline" size="sm" onClick={() => openForEdit(client)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setClientToDelete(client)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <AlertDialog open={!!clientToDelete} onOpenChange={() => setClientToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
              <AlertDialogDescription>
                Remover o cliente irá impedir novos relacionamentos. Deseja continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => clientToDelete && deleteClient.mutate(clientToDelete.id)}
                disabled={deleteClient.isPending}
              >
                {deleteClient.isPending ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default Clients;
